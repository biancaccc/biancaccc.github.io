// Turismo espacial: a viagem da página inicial.
//
// 1. Cruzeiro: a nave (vista de trás) voa pelo espaço com estrelas passando.
// 2. Salto: ao clicar em "Iniciar viagem", a nave acelera até a velocidade da luz.
// 3. Via Láctea: a galáxia em pixel art, girando devagar, com os destinos marcados.
// 4. Partida: ao escolher um destino, a câmera mergulha nele e a página muda.
//
// Tudo é desenhado numa tela pequena (cada pixel vira um bloco de 3x3 na tela),
// por isso fica com cara de pixel art.
(function () {
	var tela = document.getElementById('cena');
	var ctx = tela.getContext('2d');
	var intro = document.getElementById('intro');
	var galaxia = document.getElementById('galaxia');
	var flash = document.getElementById('flash');
	var botaoIniciar = document.getElementById('iniciar');
	var velocidadeTexto = document.getElementById('velocidade');
	var camadaMarcadores = document.getElementById('marcadores');
	var cartao = document.getElementById('cartao');
	var botaoRever = document.getElementById('rever');

	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ---------- Tela em baixa resolução ----------
	var P = 3, W = 0, H = 0, img = null, buf = null, acc = null;
	function medir() {
		P = window.innerWidth < 700 ? 3 : window.innerWidth < 1500 ? 4 : 5; // pixels grandes, como pixel art de verdade
		// nunca zero (a aba pode abrir em segundo plano, ainda sem tamanho)
		W = Math.max(1, Math.ceil(window.innerWidth / P));
		H = Math.max(1, Math.ceil(window.innerHeight / P));
		tela.width = W;
		tela.height = H;
		img = ctx.createImageData(W, H);
		buf = new Uint32Array(img.data.buffer);
		acc = new Float32Array(W * H * 3);
		construirNave(); // a nave é desenhada no tamanho da tela
	}
	function cor(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
	var FUNDO = cor(5, 3, 12);
	function ponto(x, y, c) {
		x = x | 0; y = y | 0;
		if (x >= 0 && y >= 0 && x < W && y < H) buf[y * W + x] = c;
	}
	function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
	function mistura(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }

	// ---------- Estrelas passando ----------
	var CORES_ESTRELA = [[255, 255, 255], [200, 225, 255], [255, 220, 245], [180, 240, 255]];
	var estrelas = [];
	function novaEstrela(e, inicio) {
		e.x = Math.random() * 2 - 1;
		e.y = Math.random() * 2 - 1;
		e.z = inicio ? 0.05 + Math.random() * 0.95 : 1;
		e.c = CORES_ESTRELA[(Math.random() * CORES_ESTRELA.length) | 0];
		return e;
	}
	for (var i = 0; i < 650; i++) estrelas.push(novaEstrela({}, true));

	function desenharEstrelas(dt, v, rastro, azul, brilhoGeral) {
		if (brilhoGeral === undefined) brilhoGeral = 1;
		var cx = W / 2, cy = H * 0.42, f = Math.min(W, H) * 0.55;
		for (var n = 0; n < estrelas.length; n++) {
			var e = estrelas[n];
			e.z -= v * dt;
			if (e.z <= 0.02) { novaEstrela(e, false); continue; }
			var x1 = cx + e.x / e.z * f, y1 = cy + e.y / e.z * f;
			if (x1 < -50 || y1 < -50 || x1 > W + 50 || y1 > H + 50) { novaEstrela(e, false); continue; }
			var z2 = Math.min(1, e.z + rastro);
			var x0 = cx + e.x / z2 * f, y0 = cy + e.y / z2 * f;
			var brilho = Math.min(1, (1.05 - e.z) * 1.4) * brilhoGeral;
			var c = mistura(e.c, [150, 200, 255], azul);
			var passos = Math.min(220, Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))));
			for (var p = 0; p <= passos; p++) {
				var t = p / passos;
				var b = brilho * (0.25 + 0.75 * t);
				ponto(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, cor(c[0] * b, c[1] * b, c[2] * b));
			}
			if (e.z < 0.25) ponto(x1 + 1, y1, cor(c[0] * brilho, c[1] * brilho, c[2] * brilho));
		}
	}

	// ---------- A nave (nave.js, a mesma das transições entre páginas) ----------
	function construirNave() { window.Nave.construir(W); }
	function desenharNave(t, tremor, forca, opcoes) { window.Nave.desenhar(buf, W, H, t, tremor, forca, opcoes); }
	// ---------- A Via Láctea ----------
	// Gerada uma vez: milhares de "estrelas" com posição e cor.
	function gauss() {
		var u = 1 - Math.random(), v = Math.random();
		return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
	}
	var GX = [], GY = [], GZ = [], GR = [], GG = [], GB = [];
	function adicionar(x, y, z, c, k) { GX.push(x); GY.push(y); GZ.push(z); GR.push(c[0] * k); GG.push(c[1] * k); GB.push(c[2] * k); }

	var PASSO = Math.tan(13 * Math.PI / 180);
	var SOL = { r: 0.54, a: 2.35 };
	var DENS = 2; // quantas vezes mais estrelas (mais denso = menos granulado)
	(function gerarGalaxia() {
		// Inspirada nas ilustrações da NASA da Via Láctea vista de cima:
		// uma barra central dourada, dois braços grandes que saem das pontas da barra,
		// dois braços menores, o pequeno Braço de Órion (onde está o Sol),
		// nebulosas rosadas em grupinhos e faixas escuras de poeira.
		var n, r, a, x, y, k;
		var barra = 28 * Math.PI / 180, MEIA_BARRA = 0.3;
		// barra (alongada, amarelo-alaranjada)
		for (n = 0; n < 5200 * DENS; n++) {
			x = gauss() * MEIA_BARRA * 0.55; y = gauss() * 0.055;
			adicionar(x * Math.cos(barra) - y * Math.sin(barra), x * Math.sin(barra) + y * Math.cos(barra), gauss() * 0.02,
				Math.random() < 0.5 ? [1, 0.8, 0.5] : [1, 0.9, 0.7], 0.55 + Math.random() * 0.45);
		}
		// bojo arredondado e núcleo bem claro
		for (n = 0; n < 2200 * DENS; n++) adicionar(gauss() * 0.075, gauss() * 0.075, gauss() * 0.04, [1, 0.86, 0.62], 0.6);
		for (n = 0; n < 700 * DENS; n++) adicionar(gauss() * 0.03, gauss() * 0.03, 0, [1, 0.97, 0.9], 1.3);
		// braços: os dois grandes começam nas pontas da barra
		var bracos = [
			{ inicio: barra, raio0: MEIA_BARRA, qtd: 8000, forca: 1 },          // Escudo-Centauro
			{ inicio: barra + Math.PI, raio0: MEIA_BARRA, qtd: 8000, forca: 1 }, // Perseu
			{ inicio: barra + Math.PI / 2, raio0: 0.22, qtd: 4000, forca: 0.6 },  // Norma
			{ inicio: barra - Math.PI / 2, raio0: 0.22, qtd: 4000, forca: 0.6 }   // Sagitário
		];
		bracos.forEach(function (b) {
			for (var n = 0; n < b.qtd * DENS; n++) {
				var r = b.raio0 + Math.pow(Math.random(), 0.9) * (1.05 - b.raio0);
				var a = b.inicio + Math.log(r / b.raio0) / PASSO;
				var espalha = 0.04 + 0.045 * r; // bem espalhadas: sem faixas duras
				var px = r * Math.cos(a) + gauss() * espalha, py = r * Math.sin(a) + gauss() * espalha;
				var sorte = Math.random();
				var c = sorte < 0.65 ? [0.7, 0.82, 1] : [1, 0.96, 0.92];
				adicionar(px, py, gauss() * 0.012, c, (0.45 + Math.random() * 0.45) * b.forca * (1.15 - r * 0.55));
			}
			// nebulosas rosadas, em grupinhos ao longo do braço
			for (var g = 0; g < 34 * b.forca; g++) {
				var rg = b.raio0 + Math.random() * (1 - b.raio0);
				var ag = b.inicio + Math.log(rg / b.raio0) / PASSO + gauss() * 0.04;
				var gx = rg * Math.cos(ag), gy = rg * Math.sin(ag);
				for (var m = 0; m < 10 * DENS; m++) adicionar(gx + gauss() * 0.01, gy + gauss() * 0.01, 0, [1, 0.42, 0.7], 0.75);
			}
			// poeira escura no lado de dentro dos braços (luz "negativa")
			for (var d = 0; d < 3000 * DENS * b.forca; d++) {
				var rr = b.raio0 + Math.random() * (1 - b.raio0);
				var aa = b.inicio + Math.log(rr / b.raio0) / PASSO - 0.13;
				adicionar(rr * Math.cos(aa) + gauss() * 0.014, rr * Math.sin(aa) + gauss() * 0.014, 0, [0.55, 0.5, 0.45], -0.6);
			}
		});
		// Braço de Órion, onde fica o Sol
		for (n = 0; n < 1800 * DENS; n++) {
			r = 0.42 + Math.random() * 0.26;
			a = SOL.a + Math.log(r / SOL.r) / PASSO;
			adicionar(r * Math.cos(a) + gauss() * 0.02, r * Math.sin(a) + gauss() * 0.02, gauss() * 0.01,
				Math.random() < 0.05 ? [1, 0.4, 0.7] : [0.75, 0.86, 1], 0.45 + Math.random() * 0.4);
		}
		// disco difuso (o "brilho" entre os braços)
		for (n = 0; n < 7000 * DENS; n++) {
			r = -Math.log(1 - Math.random() * 0.95) * 0.3;
			a = Math.random() * Math.PI * 2;
			k = Math.max(0, 1 - r);
			adicionar(r * Math.cos(a), r * Math.sin(a), gauss() * 0.02, [0.9, 0.84, 0.95], 0.34 * k);
		}
		// estrelas soltas do halo
		for (n = 0; n < 500; n++) adicionar(gauss() * 0.6, gauss() * 0.6, gauss() * 0.3, [1, 0.9, 0.8], 0.4);
	})();
	var NG = GX.length;
	GX = new Float32Array(GX); GY = new Float32Array(GY); GZ = new Float32Array(GZ);
	GR = new Float32Array(GR); GG = new Float32Array(GG); GB = new Float32Array(GB);

	// Estrelas de fundo (fixas na tela, piscando)
	var fundoEstrelas = [];
	for (i = 0; i < 260; i++) fundoEstrelas.push({ x: Math.random(), y: Math.random(), f: 0.5 + Math.random() * 2, b: 0.3 + Math.random() * 0.7 });

	// ---------- Destinos ----------
	function noPlano(r, a) { return [r * Math.cos(a), r * Math.sin(a)]; }
	var sol = noPlano(SOL.r, SOL.a);
	var DESTINOS = [
		{
			id: 'sagitario', nome: 'Sagittarius A*', tipo: T('Buraco negro supermassivo', 'Supermassive black hole'), distancia: T('26.700 anos-luz da Terra', '26,700 light-years from Earth'),
			texto: T('O gigante escondido no coração da Via Láctea, com a massa de 4 milhões de sóis.', 'The hidden giant at the heart of the Milky Way, with the mass of 4 million suns.'),
			href: 'sagitario-a.html', cor: '#ffb347', pos: [0, 0, 0]
		},
		{
			id: 'orion', nome: T('Nebulosa de Órion', 'Orion Nebula'), tipo: T('Berçário de estrelas', 'Stellar nursery'), distancia: T('1.344 anos-luz da Terra', '1,344 light-years from Earth'),
			texto: T('Uma nuvem colorida de gás e poeira onde milhares de estrelas estão nascendo agora mesmo.', 'A colorful cloud of gas and dust where thousands of stars are being born right now.'),
			href: 'orion.html', cor: '#ff6fb5', pos: [sol[0] - 0.13, sol[1] - 0.12, 0], esquerda: true
		},
		{
			id: 'omega', nome: 'Omega Centauri', tipo: T('Aglomerado globular', 'Globular cluster'), distancia: T('17.000 anos-luz da Terra', '17,000 light-years from Earth'),
			texto: T('Cerca de 10 milhões de estrelas antigas apertadas numa bola. Talvez o coração de uma galáxia engolida.', 'About 10 million ancient stars packed into a ball. Perhaps the heart of a swallowed galaxy.'),
			href: 'omega-centauri.html', cor: '#ffe08a', pos: noPlano(0.42, SOL.a + 0.9).concat([0.4])
		},
		{
			id: 'sistema', nome: T('Sistema Solar', 'Solar System'), tipo: T('Nossa casa · você está aqui', 'Our home · you are here'), distancia: T('A 26.700 anos-luz do centro da galáxia', '26,700 light-years from the center of the galaxy'),
			texto: T('O Sol, oito planetas e todos nós, num dos braços menores da Via Láctea.', 'The Sun, eight planets and all of us, in one of the smaller arms of the Milky Way.'),
			href: 'sistema-solar.html', cor: '#7fe3ff', pos: [sol[0], sol[1], 0]
		},
		{
			id: 'pleiades', nome: T('Plêiades', 'Pleiades'), tipo: T('Aglomerado de estrelas jovens', 'Cluster of young stars'), distancia: T('444 anos-luz da Terra', '444 light-years from Earth'),
			texto: T('As Sete Irmãs: uma família de mais de mil estrelas azuis que nasceram juntas.', 'The Seven Sisters: a family of more than a thousand blue stars born together.'),
			href: 'pleiades.html', cor: '#8fb8ff', pos: [sol[0] + 0.2, sol[1] + 0.2, 0]
		},
		{
			id: 'helice', nome: T('Nebulosa da Hélice', 'Helix Nebula'), tipo: T('Nebulosa planetária', 'Planetary nebula'), distancia: T('650 anos-luz da Terra', '650 light-years from Earth'),
			texto: T('O "Olho de Deus": o que sobrou de uma estrela como o Sol no fim da vida.', 'The "Eye of God": what is left of a star like the Sun at the end of its life.'),
			href: 'helice.html', cor: '#5fd6d0', pos: [sol[0] + 0.32, sol[1] - 0.15, 0]
		},
		{
			id: 'tabby', nome: T('Estrela de Tabby', "Tabby's Star"), tipo: T('A estrela mais misteriosa', 'The most mysterious star'), distancia: T('1.470 anos-luz da Terra', '1,470 light-years from Earth'),
			texto: T('O brilho dela cai de um jeito estranho. Extraterrestres ou poeira? Venha descobrir.', 'Its light dims in a strange way. Aliens or dust? Come and find out.'),
			href: 'tabby.html', cor: '#ff9d5c', pos: [sol[0] - 0.12, sol[1] + 0.28, 0], esquerda: true
		},
		{
			// as bolhas saem do centro para cima do disco: o marcador fica acima de Sagittarius A*
			id: 'fermi', nome: T('Bolhas de Fermi', 'Fermi Bubbles'), tipo: T('Bolhas gigantes de raios gama', 'Giant gamma-ray bubbles'), distancia: T('26.700 anos-luz da Terra', '26,700 light-years from Earth'),
			texto: T('Duas bolhas invisíveis do tamanho de meia galáxia, sopradas pelo centro da Via Láctea.', 'Two invisible bubbles the size of half a galaxy, blown out by the center of the Milky Way.'),
			href: 'fermi.html', cor: '#e070ff', pos: [0, 0, 0.32], esquerda: true
		},
		// (os novos entram no fim da lista: o Sistema Solar é o 4º e as Bolhas de Fermi, o 8º)
		{
			id: 'betelgeuse', nome: 'Betelgeuse', tipo: T('Supergigante vermelha', 'Red supergiant'), distancia: T('550 anos-luz da Terra', '550 light-years from Earth'),
			texto: T('Uma estrela tão grande que, no lugar do Sol, passaria da órbita de Marte. Um dia ela vai explodir.', 'A star so big that, in place of the Sun, it would reach past the orbit of Mars. One day it will explode.'),
			href: 'betelgeuse.html', cor: '#ff6a3d', pos: [sol[0] - 0.23, sol[1] + 0.07, 0], esquerda: true
		},
		{
			id: 'eta', nome: 'Eta Carinae', tipo: T('Par de estrelas gigantes', 'A pair of giant stars'), distancia: T('7.500 anos-luz da Terra', '7,500 light-years from Earth'),
			texto: T('Duas estrelas enormes e uma nuvem em forma de ampulheta, que sobrou de uma erupção gigante.', 'Two huge stars and an hourglass-shaped cloud left over from a giant eruption.'),
			href: 'eta-carinae.html', cor: '#c8a0ff', pos: [0.3, -0.35, 0] // num canto livre do mapa ilustrativo
		},
		{
			// pertinho do Sol de verdade (8,6 anos-luz): no mapa ilustrativo fica logo abaixo dele
			id: 'sirius', nome: 'Sirius', tipo: T('Par de estrelas · a mais brilhante do céu', 'A pair of stars · the brightest in the sky'), distancia: T('8,6 anos-luz da Terra', '8.6 light-years from Earth'),
			texto: T('A estrela mais brilhante do céu, e uma companheira do tamanho da Terra escondida no clarão dela.', 'The brightest star in the sky, with an Earth-sized companion hidden in its glare.'),
			href: 'sirius.html', cor: '#5b8cff', pos: [sol[0] + 0.07, sol[1] + 0.36, 0]
		},
		{
			// no mapa ilustrativo, num pedaço livre do braço, à esquerda e acima do Sol
			id: 'caranguejo', nome: T('Nebulosa do Caranguejo', 'Crab Nebula'), tipo: T('Resto de supernova · um farol girando', 'Supernova remnant · a spinning lighthouse'), distancia: T('6.500 anos-luz da Terra', '6,500 light-years from Earth'),
			texto: T('O que sobrou de uma estrela que explodiu em 1054, com um pulsar no meio que gira 30 vezes por segundo.', 'What is left of a star that exploded in 1054, with a pulsar at its center spinning 30 times per second.'),
			href: 'caranguejo.html', cor: '#9be36a', pos: [sol[0] - 0.37, sol[1] - 0.48, 0]
		},
		{
			// a estrela mais perto do Sol (4,2 anos-luz): no mapa ilustrativo, logo acima dele
			id: 'proxima', nome: 'Proxima Centauri', tipo: T('Anã vermelha · a estrela mais perto', 'Red dwarf · the nearest star'), distancia: T('4,2 anos-luz da Terra', '4.2 light-years from Earth'),
			texto: T('A estrela mais perto do Sol, pequena e vermelha, com um planeta do tamanho da Terra que pode ter água.', 'The nearest star to the Sun, small and red, with an Earth-sized planet that may have water.'),
			href: 'proxima-centauri.html', cor: '#f0505a', pos: [sol[0] - 0.02, sol[1] - 0.265, 0], esquerda: true
		}
	];

	// ---------- Escala real ----------
	// No mapa, o Sol fica a 0,54 do centro e de verdade está a 26.700 anos-luz: cada unidade
	// do mapa vale uns 49.400 anos-luz (e a galáxia desenhada já tem mais ou menos o tamanho certo).
	// As posições reais vêm da distância e da direção no céu (longitude e latitude galácticas).
	var ANOS_LUZ = 26700 / SOL.r;
	function doSol(anosLuz, l, b) {
		l *= Math.PI / 180; b *= Math.PI / 180;
		var plano = anosLuz * Math.cos(b) / ANOS_LUZ, ang = SOL.a + Math.PI + l; // longitude 0 = rumo ao centro
		return [sol[0] + plano * Math.cos(ang), sol[1] + plano * Math.sin(ang), anosLuz * Math.sin(b) / ANOS_LUZ];
	}
	// distância (anos-luz), longitude e latitude galácticas (graus)
	var CEU = { orion: [1344, 209.0, -19.4], pleiades: [444, 166.6, -23.5], helice: [650, 36.2, -57.1], tabby: [1470, 81.6, 6.2], omega: [17090, 309.1, 15.0],
		betelgeuse: [548, 199.8, -9.0], eta: [7500, 287.6, -0.6], sirius: [8.6, 227.2, -8.9],
		caranguejo: [6500, 184.6, -5.8], proxima: [4.24, 313.9, -1.9] };
	DESTINOS.forEach(function (d) {
		var c = CEU[d.id];
		d.real = c ? doSol(c[0], c[1], c[2]) : d.pos.slice();
		if (c && c[0] < 2000) { d.local = true; d.ceu = c; } // tão perto do Sol que quase encostam nele
	});
	DESTINOS[7].real = [0, 0, 12500 / ANOS_LUZ]; // as bolhas sobem uns 25.000 anos-luz: o marcador fica no meio
	// no mapa, toda distância é contada a partir do centro da galáxia (e não da Terra)
	function anosLuzDoCentro(p) { return Math.round(Math.sqrt(p[0] * p[0] + p[1] * p[1] + p[2] * p[2]) * ANOS_LUZ / 100) * 100; }
	DESTINOS.forEach(function (d) {
		d.distancia = d.id === 'sagitario' ? T('Bem no centro da galáxia', 'Right at the center of the galaxy')
			: d.id === 'fermi' ? T('Saem do centro da galáxia e sobem até 25.000 anos-luz', 'They rise from the center of the galaxy up to 25,000 light-years')
			: T('A ' + anosLuzDoCentro(d.real).toLocaleString('pt-BR') + ' anos-luz do centro da galáxia', anosLuzDoCentro(d.real).toLocaleString('en-US') + ' light-years from the center of the galaxy');
	});
	var escalaReal = false, kReal = 0; // kReal vai de 0 (ilustrativo) a 1 (real), para os marcadores deslizarem
	function posAtual(d) {
		var k = kReal * kReal * (3 - 2 * kReal);
		return [0, 1, 2].map(function (i) { return d.pos[i] + (d.real[i] - d.pos[i]) * k; });
	}
	var RAIO_VIZINHANCA = 1600 / ANOS_LUZ; // o quadradinho em volta do Sol que a lupa amplia

	// ---------- Câmera da galáxia ----------
	var TILT = 0.6;
	var cam = { x: 0, y: 0, zoom: 1 };
	// a galáxia vindo ao encontro da nave: começa minúscula e chega a este tamanho no fim do salto
	var ZOOM_SALTO_INICIO = 0.025, ZOOM_SALTO_FIM = 0.5, chegadaDoSalto = false;
	var NAVE_CENTRO_Y = 0.66; // altura da nave na tela (a mesma de nave.js)
	var ENTRA_NAVE = 0.6; // segundos da nave voltando por baixo da tela, ao escolher um destino
	var inicioSaltoDestino = 0;
	// cam.y que põe o centro da galáxia no ponto de onde saem as estrelas (42% da altura)
	function alturaDoFuro(zoom) { return (0.54 - 0.42) * H / (escalaGalaxia() * zoom); }
	var giro = 0;
	function escalaGalaxia() {
		// tela em pé (celular): a galáxia pode passar um pouco das bordas, para não ficar minúscula
		if (W / H < 0.8) return W * 0.64 / 1.05;
		return Math.min(W * 0.46, H * 0.62 / TILT) / 1.05;
	}
	function projetar(x, y, z) {
		var c = Math.cos(giro), s = Math.sin(giro);
		var xr = x * c - y * s, yr = x * s + y * c;
		var S = escalaGalaxia() * cam.zoom;
		return [W / 2 + (xr - cam.x) * S, H * 0.54 + (yr * TILT - z * 0.9 - cam.y) * S, xr, yr * TILT - z * 0.9];
	}

	// ---------- A galáxia em pixel art "clássica" ----------
	// Do jeito que os artistas de pixel art desenham o espaço: pixels grandes,
	// paleta curta e escolhida a dedo, formas limpas, degradês em pontilhado
	// (dithering) e estrelinhas cintilantes de 4 pontas.
	function hexCor(h) { return cor(parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)); }
	// rampa fria (braços): do escuro ao branco, passando por índigo, roxo, azul e ciano
	var RAMPA_FRIA = ['#0a0718', '#17123a', '#281c5c', '#3b2a86', '#4446b0', '#4f72d6', '#5fa4ec', '#8fd3fa', '#cdf1ff', '#ffffff'].map(hexCor);
	// rampa quente (centro): do escuro ao branco, passando por vinho, rosa, pêssego e amarelo
	var RAMPA_QUENTE = ['#0a0718', '#25103a', '#4a1a52', '#7a2a66', '#b44470', '#e06a72', '#f69a7c', '#ffc890', '#ffe9b8', '#fffbea'].map(hexCor);
	var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
	var NEB = ['#ff5fa8', '#ff7ac8', '#e55cff'].map(hexCor);

	var BRACOS_PIX = [
		{ a0: 28 * Math.PI / 180, r0: 0.26, forca: 1 },
		{ a0: 28 * Math.PI / 180 + Math.PI, r0: 0.26, forca: 1 },
		{ a0: 28 * Math.PI / 180 + Math.PI / 2, r0: 0.24, forca: 0.45 },
		{ a0: 28 * Math.PI / 180 - Math.PI / 2, r0: 0.24, forca: 0.45 }
	];
	// nebulosas rosadas: pontinhos fixos ao longo dos braços (desenhados à mão, não ruído)
	var NEBULOSAS = [];
	(function () {
		var s = 3;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		BRACOS_PIX.forEach(function (b, q) {
			var qtd = q < 2 ? 14 : 6;
			for (var i = 0; i < qtd; i++) {
				var r = b.r0 + 0.08 + aleat() * (0.95 - b.r0);
				var a = b.a0 + Math.log(r / b.r0) / PASSO + (aleat() - 0.5) * 0.12;
				NEBULOSAS.push({ x: r * Math.cos(a), y: r * Math.sin(a), c: NEB[(aleat() * 3) | 0], grande: aleat() < 0.35 });
			}
		});
	})();
	// estrelinhas cintilantes por cima da galáxia e no fundo
	var CINTILANTES = [];
	(function () {
		var s = 9;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < 12; i++) {
			var r = Math.sqrt(aleat()) * 1.0, a = aleat() * Math.PI * 2;
			CINTILANTES.push({ x: r * Math.cos(a), y: r * Math.sin(a), fase: aleat() * 6, vel: 0.6 + aleat() * 1.2, noDisco: true });
		}
		for (i = 0; i < 10; i++) CINTILANTES.push({ sx: aleat(), sy: aleat(), fase: aleat() * 6, vel: 0.4 + aleat(), noDisco: false });
	})();

	// A galáxia "solta": uma grande nuvem colorida que ocupa a tela, com um giro
	// em espiral só sugerido. As cores vêm em manchas (quentes de um lado, frias do
	// outro), com pontilhado entre os tons, como nos fundos de espaço em pixel art.
	function hash2(x, y) {
		var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	}
	function ruido2(x, y) {
		var xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi;
		u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
		var a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
		return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
	}
	function fbm2(x, y, oit) {
		var s = 0, a = 0.5, tot = 0;
		for (var i = 0; i < oit; i++) { s += ruido2(x, y) * a; tot += a; x *= 2.03; y *= 2.03; a *= 0.5; }
		return s / tot;
	}
	var RAMPA_FRIA2 = ['#0a0718', '#121a3e', '#17305f', '#1b4c84', '#2271a8', '#329cc6', '#57c4dc', '#92e6ec', '#d6fcff', '#ffffff'].map(hexCor);
	var RAMPA_QUENTE2 = ['#0a0718', '#22113c', '#3f175c', '#661f7d', '#94298f', '#c23c95', '#ea5f92', '#ff8f88', '#ffc492', '#fff1d8'].map(hexCor);

	// paletas tiradas da ilustração da NASA da Via Láctea:
	// centro creme/amarelo -> bege/caramelo; braços branco-acinzentados com lavanda;
	// bordas azul-ardósia; poeira marrom/ferrugem; nebulosas vermelho-rosadas
	var RAMPA_CENTRO = ['#0a0718', '#2a1c1a', '#4f3426', '#7a5638', '#a8805a', '#d1aa80', '#ecd0a6', '#f9e6c4', '#fff4dc', '#fffbf0'].map(hexCor);
	var RAMPA_MEIO = ['#0a0718', '#1c1a2c', '#36324a', '#56506a', '#7a7490', '#9f9ab2', '#c0bccf', '#dad8e6', '#eeedf6', '#ffffff'].map(hexCor);
	var RAMPA_FORA = ['#0a0718', '#111a33', '#1c2a4f', '#2a3d6c', '#3b5389', '#506ca6', '#6d89bf', '#93a9d4', '#bccbe6', '#e4ecfa'].map(hexCor);
	var RAMPA_POEIRA = ['#0a0718', '#21120f', '#3a2018', '#552d20', '#70402d', '#8a5238', '#a46644', '#b97a52', '#c98d63', '#d6a077'].map(hexCor);
	var VERMELHOS = ['#ff4d6d', '#ff7a95', '#e8365c', '#ff9aa8'].map(hexCor);

	var TEX = 256, TEX_RAIO = 1.7;
	var texPoeira = new Float32Array(TEX * TEX);
	var texLuz = new Float32Array(TEX * TEX), texCalor = new Float32Array(TEX * TEX);
	(function pintarNuvem() {
		for (var j = 0; j < TEX; j++) for (var i = 0; i < TEX; i++) {
			var x = (i + 0.5) / TEX * 2 * TEX_RAIO - TEX_RAIO, y = (j + 0.5) / TEX * 2 * TEX_RAIO - TEX_RAIO;
			var r = Math.sqrt(x * x + y * y), ang = Math.atan2(y, x);
			// giro em espiral: quanto mais longe do centro, mais torcido
			var torcido = ang + 2.3 * Math.log(r + 0.12);
			var sx = Math.cos(torcido) * r, sy = Math.sin(torcido) * r;
			// nuvem com o espaço deformado (fica solta, sem formas exatas)
			var wx = fbm2(sx * 1.6 + 5, sy * 1.6, 3), wy = fbm2(sx * 1.6, sy * 1.6 + 9, 3);
			var nuvem = fbm2(sx * 2.4 + wx * 1.8, sy * 2.4 + wy * 1.8, 5);
			// sugestão de dois braços: só um "empurrãozinho" na nuvem
			var bracos = 0.5 + 0.5 * Math.cos(2 * torcido);
			var envelope = Math.exp(-r / 0.9);
			var nucleo = Math.exp(-r * r / 0.025) * 1.1 + Math.exp(-r / 0.16) * 0.35;
			var luz = (Math.pow(nuvem, 1.4) * 2.1 * (0.55 + bracos * 0.6)) * envelope * Math.max(0, 1 - Math.max(0, r - 1.25) / 0.4) + nucleo;
			// calor: manchas grandes de cor, e o centro sempre quente
			var calor = fbm2(x * 1.3 + 40, y * 1.3, 3) * 1.25 - 0.1 + Math.exp(-r / 0.25) * 0.8;
			var k = j * TEX + i;
			texLuz[k] = luz;
			texCalor[k] = calor;
			// poeira: veios em espiral (crista do ruído), só dentro do disco
			var veio = 1 - Math.abs(2 * fbm2(sx * 3.2 + 70, sy * 3.2 + wx, 4) - 1);
			texPoeira[k] = Math.pow(veio, 5) * Math.exp(-r / 1.1) * (r > 0.12 ? 1 : 0);
		}
	})();

	// nebulosas: só onde a nuvem é clara (braços), entre o centro e a borda
	var NEBULOSAS_V = [];
	(function () {
		var s = 33, tentativas = 0;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		var esc = TEX / (2 * TEX_RAIO);
		while (NEBULOSAS_V.length < 150 && tentativas++ < 20000) {
			var r = 0.25 + Math.sqrt(aleat()) * 1.05, a = aleat() * Math.PI * 2, x = r * Math.cos(a), y = r * Math.sin(a);
			var k = (((y + TEX_RAIO) * esc) | 0) * TEX + (((x + TEX_RAIO) * esc) | 0);
			if (texLuz[k] < 0.2) continue;
			NEBULOSAS_V.push({ x: x, y: y, c: VERMELHOS[(aleat() * 4) | 0], grande: aleat() < 0.3 });
		}
	})();

	var ESTRELAS_NUVEM = [];
	(function () {
		var s = 21;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < 170; i++) {
			var r = Math.pow(aleat(), 0.7) * 1.4, a = aleat() * Math.PI * 2;
			ESTRELAS_NUVEM.push({ x: r * Math.cos(a), y: r * Math.sin(a), vel: 0.8 + aleat() * 2, fase: aleat() * 6, azul: aleat() < 0.5 });
		}
	})();

	function desenharGalaxia(t) {
		var c = Math.cos(giro), s = Math.sin(giro);
		var S = escalaGalaxia() * cam.zoom, cx = W / 2, cy = H * 0.54;
		var esc = TEX / (2 * TEX_RAIO);
		for (var py = 0, i = 0; py < H; py++) {
			var yr = ((py + 0.5 - cy) / S + cam.y) / TILT;
			for (var px = 0; px < W; px++, i++) {
				var xr = (px + 0.5 - cx) / S + cam.x;
				var gx = xr * c + yr * s, gy = -xr * s + yr * c; // desfaz o giro
				var ti = ((gx + TEX_RAIO) * esc) | 0, tj = ((gy + TEX_RAIO) * esc) | 0;
				if (ti < 0 || tj < 0 || ti >= TEX || tj >= TEX) { buf[i] = FUNDO; continue; }
				var tk = tj * TEX + ti, luz = texLuz[tk];
				var limiar = BAYER[(px & 3) + ((py & 3) << 2)] / 16;
				var nivel = Math.floor(Math.min(1, luz) * 9 + limiar);
				if (nivel <= 0) { buf[i] = FUNDO; continue; }
				// manchas quentes ou frias, com pontilhado na fronteira entre elas
				// a cor vem da distância ao centro (com pontilhado na passagem de uma zona para outra)
				var rg = Math.sqrt(gx * gx + gy * gy) + Math.max(-0.5, Math.min(0.5, texCalor[tk] - 0.5)) * 0.18 + (limiar - 0.5) * 0.08;
				var rampa = rg < 0.26 ? RAMPA_CENTRO : rg < 0.85 ? RAMPA_MEIO : RAMPA_FORA;
				// poeira marrom por cima dos braços
				if (texPoeira[tk] > 0.32 + limiar * 0.25) rampa = RAMPA_POEIRA;
				buf[i] = rampa[Math.min(9, nivel)];
			}
		}
		// nebulosas vermelho-rosadas espalhadas pelos braços
		for (var h = 0; h < NEBULOSAS_V.length; h++) {
			var nv = NEBULOSAS_V[h], pn = projetar(nv.x, nv.y, 0), nx = Math.round(pn[0]), ny = Math.round(pn[1]);
			ponto(nx, ny, nv.c);
			if (nv.grande) { ponto(nx + 1, ny, nv.c); ponto(nx, ny + 1, VERMELHOS[1]); }
		}
		// estrelinhas salpicadas dentro da nuvem (giram junto com ela)
		for (var e2 = 0; e2 < ESTRELAS_NUVEM.length; e2++) {
			var en = ESTRELAS_NUVEM[e2], pe = projetar(en.x, en.y, 0);
			var bri2 = calmo ? 1 : 0.55 + 0.45 * Math.sin(t * en.vel + en.fase);
			ponto(Math.round(pe[0]), Math.round(pe[1]), en.azul ? cor(150 * bri2 + 90, 220 * bri2 + 30, 255) : cor(255, 240 * bri2 + 15, 220 * bri2 + 30));
		}
		// linha pontilhada mostrando que Omega Centauri fica acima do disco da galáxia
		// (só junto com os marcadores, quando estamos escolhendo o destino)
		DESTINOS.forEach(function (d) {
			if (d.local || !d.pos[2] || !marcasVisiveis) return;
			var q = posAtual(d), a = projetar(q[0], q[1], 0), b = projetar(q[0], q[1], q[2]);
			var passos = Math.round(Math.abs(b[1] - a[1]));
			for (var p = 0; p < passos; p += 2) ponto(a[0], a[1] + (b[1] - a[1]) * p / passos, cor(255, 224, 138));
		});
		// na escala real: cantoneiras em volta do Sol, marcando o pedacinho que a lupa amplia
		if (marcasVisiveis && kReal > 0.5) {
			var ps = projetar(sol[0], sol[1], 0), rv = Math.max(3, Math.round(RAIO_VIZINHANCA * escalaGalaxia() * cam.zoom) + 2);
			var sx = Math.round(ps[0]), sy = Math.round(ps[1]), cc = cor(127, 227, 255);
			[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (c) {
				for (var k = 0; k < 3; k++) { ponto(sx + c[0] * (rv - k), sy + c[1] * rv, cc); ponto(sx + c[0] * rv, sy + c[1] * (rv - k), cc); }
			});
		}
		// estrelas de fundo piscando (só onde está escuro)
		for (var e = 0; e < fundoEstrelas.length; e++) {
			var st = fundoEstrelas[e];
			var bx = (st.x * W) | 0, by = (st.y * H) | 0, idx = by * W + bx;
			if (buf[idx] !== FUNDO) continue;
			var bri = st.b * (calmo ? 1 : 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * st.f + e)));
			buf[idx] = cor(200 * bri + 20, 210 * bri + 20, 255 * bri);
		}
		// estrelinhas cintilantes de 4 pontas: ponto -> cruz -> cruz grande -> cruz -> ponto
		CINTILANTES.forEach(function (st) {
			var x, y;
			if (st.noDisco) { var p = projetar(st.x, st.y, 0); x = Math.round(p[0]); y = Math.round(p[1]); }
			else { x = Math.round(st.sx * W); y = Math.round(st.sy * H); }
			var fase = calmo ? 1 : (Math.sin(t * st.vel + st.fase) + 1) / 2;
			var tam = fase > 0.88 ? 2 : fase > 0.55 ? 1 : 0;
			ponto(x, y, cor(255, 255, 255));
			for (var d = 1; d <= tam; d++) {
				var cc = d === tam ? RAMPA_FRIA[6] : RAMPA_FRIA[8];
				ponto(x + d, y, cc); ponto(x - d, y, cc); ponto(x, y + d, cc); ponto(x, y - d, cc);
			}
		});
	}

	// ---------- Marcadores dos destinos ----------
	var selecionado = null;
	// o "*" de Sagittarius A* em outra fonte (na fonte pixelada ele parece um apóstrofo)
	function nomeHtml(n) { return n.replace('*', '<span class="ast">*</span>'); }
	DESTINOS.forEach(function (d) {
		var b = document.createElement('button');
		b.type = 'button';
		b.className = 'marcador';
		b.style.setProperty('--cor-destino', d.cor);
		b.setAttribute('aria-label', d.nome + ': ' + d.tipo);
		if (d.esquerda) b.classList.add('esquerda');
		if (d.local) b.classList.add('local');
		b.innerHTML = '<span class="mira" aria-hidden="true"></span><span class="rotulo">' + nomeHtml(d.nome) + '</span>';
		ligarEscolha(b, d);
		d.botao = b;
		camadaMarcadores.appendChild(b);
	});

	// No computador, passar o mouse (ou chegar pelo teclado) mostra o cartão do lado, com a
	// miniatura da arte, e clicar no destino já viaja; tirando o mouse, o cartão some (o mapa
	// fica limpo, só com os nomes). No celular não existe "passar o mouse": tocar no destino só
	// mostra o cartão, e quem viaja é o botão "Viajar para lá" dele.
	var semMouse = window.matchMedia && window.matchMedia('(hover: none)').matches;
	var ponteiro = semMouse ? 'touch' : 'mouse', esconderDepois = null;
	function ligarEscolha(el, d) {
		el.addEventListener('pointerdown', function (e) { ponteiro = e.pointerType; });
		el.addEventListener('mouseenter', function () { if (ponteiro !== 'touch') { clearTimeout(esconderDepois); mostrarCartao(d); } });
		el.addEventListener('focus', function () { if (ponteiro !== 'touch') { clearTimeout(esconderDepois); mostrarCartao(d); } });
		// um tempinho antes de sumir, para o cartão não piscar ao passar de um destino para outro
		el.addEventListener('mouseleave', function () { if (ponteiro !== 'touch') { clearTimeout(esconderDepois); esconderDepois = setTimeout(esconderCartao, 250); } });
		el.addEventListener('blur', function () { if (ponteiro !== 'touch') { clearTimeout(esconderDepois); esconderDepois = setTimeout(esconderCartao, 250); } });
		el.addEventListener('click', function () {
			if (ponteiro === 'touch') { mostrarCartao(d, true); return; }
			partir(d);
		});
	}

	// a miniatura: as artes dos destinos (destinos.js) numa telinha que troca de arte;
	// o Sistema Solar usa a pixel art do Sol
	var ARTE_DO_DESTINO = { sagitario: 'buraco-negro', orion: 'orion', omega: 'omega', pleiades: 'pleiades', helice: 'helice', tabby: 'tabby', fermi: 'fermi', betelgeuse: 'betelgeuse', eta: 'eta-carinae', sirius: 'sirius', caranguejo: 'caranguejo', proxima: 'proxima' };
	var miniTela = cartao.querySelector('.cartao-mini canvas.arte-destino'), miniSol = cartao.querySelector('.cartao-mini img');
	var cartaoInfo = cartao.querySelector('.cartao-info'), cartaoCorpo = cartao.querySelector('.cartao-corpo');
	// a miniatura é só um "sinal captado": a arte reduzida a um mosaico de pixels grandes, que
	// sugere as cores e a forma do lugar sem estragar a surpresa da página
	var MOSAICO = 22, mosaico = cartao.querySelector('.cartao-mosaico'), mctx = mosaico.getContext('2d');
	mosaico.width = mosaico.height = MOSAICO;
	function pintarMosaico() {
		if (!cartao.classList.contains('aberto')) return;
		var fonte = miniSol.hidden ? miniTela : miniSol;
		if (fonte === miniSol && !miniSol.complete) return;
		mctx.imageSmoothingEnabled = true;
		mctx.clearRect(0, 0, MOSAICO, MOSAICO);
		mctx.drawImage(fonte, 0, 0, MOSAICO, MOSAICO);
	}
	setInterval(pintarMosaico, 160);

	function mostrarCartao(d, deNovo) {
		if (!deNovo && selecionado === d && cartao.classList.contains('aberto')) return;
		selecionado = d;
		DESTINOS.forEach(function (o) { o.botao.classList.toggle('ativo', o === d); });
		cartao.style.setProperty('--cor-destino', d.cor);
		var arte = ARTE_DO_DESTINO[d.id];
		miniTela.hidden = !arte; miniSol.hidden = !!arte;
		if (arte) { miniTela.setAttribute('data-arte', arte); if (window.redesenharArtes) window.redesenharArtes(); }
		cartao.style.setProperty('--brilho-mini', arte ? d.cor : '#ffb347'); // o Sol brilha laranja
		miniSol.parentNode.classList.toggle('sol', !arte);
		pintarMosaico();
		cartaoInfo.innerHTML =
			'<p class="cartao-tipo">' + d.tipo + '</p>' +
			'<h2>' + nomeHtml(d.nome) + '</h2>' +
			'<p class="cartao-distancia">' + d.distancia + '</p>';
		// no computador, sem botão (quem viaja é o clique no destino); no celular, o botão
		cartaoCorpo.innerHTML = '<p class="cartao-texto">' + d.texto + '</p>' + (ponteiro === 'touch'
			? '<a class="botao-hud" href="' + d.href + '">' + T('Viajar para lá', 'Travel there') + ' &rarr;</a>'
			: '<p class="cartao-dica">' + T('Clique no destino para viajar', 'Click the destination to travel') + '</p>');
		cartao.classList.add('aberto');
		var ir = cartaoCorpo.querySelector('a');
		if (ir) ir.addEventListener('click', function (ev) {
			if (ev.ctrlKey || ev.metaKey || ev.shiftKey) return;
			ev.preventDefault();
			partir(d);
		});
	}

	function esconderCartao() {
		if (cena === 'partida') return;
		selecionado = null;
		DESTINOS.forEach(function (o) { o.botao.classList.remove('ativo'); });
		cartao.classList.remove('aberto');
	}

	function posicionarMarcadores() {
		DESTINOS.forEach(function (d) {
			var q = posAtual(d), p = projetar(q[0], q[1], q[2]);
			d.botao.style.transform = 'translate(' + (p[0] * P) + 'px,' + (p[1] * P) + 'px)';
			d.tela = [p[0] * P, p[1] * P];
		});
		arrumarNomes();
		// régua: quantos pixels da tela valem 10.000 anos-luz agora
		if (escalaReal) {
			var S = escalaGalaxia() * cam.zoom * P;
			regua.style.width = Math.round(10000 / ANOS_LUZ * S) + 'px';
		}
	}

	// ---------- Nomes do mapa sem se amontoar ----------
	// A galáxia gira devagar e os destinos vão chegando perto uns dos outros. De tempos em
	// tempos, cada nome procura um lugar livre: do lado de sempre, do outro lado do marcador,
	// ou um pouquinho acima ou abaixo, sem encostar nos outros nomes, nos outros marcadores
	// nem sair da tela. (No celular só o nome do destino escolhido aparece, então não precisa.)
	var ultimoArranjo = 0;
	var LUGARES = [[0, 0], [1, 0], [0, -22], [0, 22], [1, -22], [1, 22]]; // [troca de lado?, desvio vertical]
	function arrumarNomes() {
		var agora = performance.now();
		if (!marcasVisiveis || agora - ultimoArranjo < 300) return;
		ultimoArranjo = agora;
		var celular = window.innerWidth <= 700;
		var ocupados = [], visiveis = DESTINOS.filter(function (d) { return d.tela && getComputedStyle(d.botao).opacity !== '0'; });
		// os marcadores (as miras) ocupam o lugar deles
		visiveis.forEach(function (d) { ocupados.push([d.tela[0] - 13, d.tela[1] - 13, d.tela[0] + 13, d.tela[1] + 13, d]); });
		function sobra(r, dono) {
			var area = 0;
			ocupados.forEach(function (o) {
				if (o[4] === dono) return;
				var w = Math.min(r[2], o[2]) - Math.max(r[0], o[0]), h = Math.min(r[3], o[3]) - Math.max(r[1], o[1]);
				if (w > 0 && h > 0) area += w * h;
			});
			if (r[0] < 8 || r[2] > window.innerWidth - 8) area += 5000; // saindo da tela
			return area;
		}
		// o escolhido escolhe primeiro; os outros se ajeitam em volta dele
		visiveis.sort(function (a, b) { return (b === selecionado) - (a === selecionado); }).forEach(function (d) {
			var rotulo = d.botao.querySelector('.rotulo'), w = rotulo.offsetWidth, h = rotulo.offsetHeight || 24;
			if (celular || !w) { d.botao.classList.toggle('esquerda', !!d.esquerda); rotulo.style.removeProperty('--desvio'); return; }
			var melhor = null;
			LUGARES.some(function (l) {
				var esq = l[0] ? !d.esquerda : !!d.esquerda, x = d.tela[0], y = d.tela[1] + l[1];
				var r = esq ? [x - 19 - w, y - h / 2, x - 19, y + h / 2] : [x + 19, y - h / 2, x + 19 + w, y + h / 2];
				var custo = sobra(r, d) + (l[0] ? 1 : 0) + Math.abs(l[1]) * 0.1; // prefere ficar como está
				if (!melhor || custo < melhor.custo) melhor = { custo: custo, esq: esq, desvio: l[1], r: r };
				return custo < 2; // achou um lugar livre
			});
			d.botao.classList.toggle('esquerda', melhor.esq);
			rotulo.style.setProperty('--desvio', melhor.desvio + 'px');
			ocupados.push(melhor.r.concat([d]));
		});
	}

	// ---------- Botão da escala real, régua e lupa da vizinhança do Sol ----------
	var notaMapa = galaxia.querySelector('.nota-mapa');
	var TEXTO_ILUSTRATIVO = notaMapa.textContent;
	var escalaCaixa = document.createElement('div');
	escalaCaixa.className = 'escala';
	escalaCaixa.innerHTML =
		'<button type="button" class="escala-botao" aria-pressed="false">' +
		'<span>' + T('Ilustrativo', 'Illustrative') + '</span><span>' + T('Escala real', 'Real scale') + '</span></button>' +
		'<span class="escala-regua" aria-hidden="true"><i></i>' + T('10.000 anos-luz', '10,000 light-years') + '</span>';
	galaxia.appendChild(escalaCaixa);
	var botaoEscala = escalaCaixa.querySelector('button'), regua = escalaCaixa.querySelector('.escala-regua i');

	// a lupa: os vizinhos do Sol vistos de cima, com o Sol no meio e o centro da galáxia para
	// cima. Os anéis marcam a distância até o Sol, e cada anel fica 10 vezes mais longe que o
	// anterior (10, 100 e 1.000 anos-luz): assim Sirius e Proxima, pertinho, não caem em cima do
	// Sol, e Órion e Tabby, bem mais longe, ainda cabem no quadro.
	var lupa = document.createElement('div');
	lupa.className = 'lupa-sol';
	function raioLupa(anosLuz) { return 8 + Math.log(Math.max(1, anosLuz)) / Math.LN10 * 32; } // 10 → 40, 100 → 72, 1.000 → 104
	var svg = '';
	[[10, '10'], [100, '100'], [1000, T('1.000 anos-luz', '1,000 light-years')]].forEach(function (a) {
		var rc = raioLupa(a[0]);
		svg += '<circle cx="150" cy="150" r="' + rc + '" /><text x="153" y="' + (150 - rc - 3) + '">' + a[1] + '</text>';
	});
	lupa.innerHTML =
		'<p class="lupa-titulo">' + T('Vizinhos do Sol', 'Neighbors of the Sun') + '</p>' +
		'<div class="lupa-mapa"><svg viewBox="0 0 300 300" aria-hidden="true"><path d="M150 6 l-5 8 h10 z" class="lupa-seta" />' + svg + '</svg>' +
		'<span class="lupa-centro" aria-hidden="true">' + T('rumo ao centro da galáxia', 'toward the center of the galaxy') + '</span>' +
		'<span class="lupa-sol-ponto" aria-hidden="true">' + T('Sol', 'Sun') + '</span></div>' +
		'<p class="lupa-legenda">' + T('Vista de cima, com o Sol no meio. Cada anel fica 10 vezes mais longe que o anterior. No mapa grande, estes destinos quase encostam no Sol.', 'Seen from above, with the Sun in the middle. Each ring is 10 times farther than the one before. On the big map, these destinations almost touch the Sun.') + '</p>';
	var lupaMapa = lupa.querySelector('.lupa-mapa');
	// de que lado do ponto fica o nome, para nenhum encostar no outro
	var LADO_LUPA = { orion: 'abaixo', betelgeuse: 'acima', tabby: 'esq', sirius: 'esq', proxima: 'esq' };
	DESTINOS.forEach(function (d) {
		if (!d.local) return;
		var l = d.ceu[1] * Math.PI / 180, plano = d.ceu[0] * Math.cos(d.ceu[2] * Math.PI / 180), r = raioLupa(plano);
		var b = document.createElement('button');
		b.type = 'button';
		b.className = 'lupa-destino ' + (LADO_LUPA[d.id] || 'dir');
		b.style.setProperty('--cor-destino', d.cor);
		b.style.left = (150 + Math.sin(l) * r) / 300 * 100 + '%';
		b.style.top = (150 - Math.cos(l) * r) / 300 * 100 + '%';
		var al = d.ceu[0] < 20 ? (Math.round(d.ceu[0] * 10) / 10).toLocaleString(LOCALE) : Math.round(d.ceu[0]).toLocaleString(LOCALE);
		b.innerHTML = '<i></i><span><b>' + d.nome.replace('Nebulosa d', 'N. d').replace('Estrela de ', '').replace(' Centauri', '').replace(' Nebula', '').replace("'s Star", '') + '</b><small>' + al + T(' anos-luz', ' light-years') + '</small></span>';
		b.setAttribute('aria-label', d.nome + ': ' + al + T(' anos-luz do Sol', ' light-years from the Sun'));
		ligarEscolha(b, d);
		lupaMapa.appendChild(b);
	});
	galaxia.appendChild(lupa);

	botaoEscala.addEventListener('click', function () {
		escalaReal = !escalaReal;
		if (calmo) kReal = escalaReal ? 1 : 0;
		botaoEscala.setAttribute('aria-pressed', escalaReal ? 'true' : 'false');
		galaxia.classList.toggle('escala-real', escalaReal);
		notaMapa.textContent = escalaReal
			? T('Escala real: posições aproximadas, vistas de cima.', 'Real scale: approximate positions, seen from above.')
			: TEXTO_ILUSTRATIVO;
		posicionarMarcadores();
	});

	// ---------- Cenas ----------
	var cena = 'cruzeiro', inicioCena = 0, destinoPartida = null, partidaDe = null;
	var marcasVisiveis = false; // os pontos e linhas dos destinos estão à mostra?
	function trocarCena(nova) { cena = nova; inicioCena = performance.now(); }

	function iniciarSalto() {
		if (cena !== 'cruzeiro') return;
		intro.classList.add('saltando');
		if (window.PassaporteEspacial) window.PassaporteEspacial.anotar('decolagem'); // selo "Piloto de decolagem"
		if (calmo) { chegarNaGalaxia(); return; }
		trocarCena('salto');
	}

	function chegarNaGalaxia(doSalto) {
		chegadaDoSalto = !!doSalto && !calmo;
		try { sessionStorage.setItem('jaViajou', '1'); } catch (e) {}
		intro.hidden = true;
		galaxia.hidden = false;
		document.body.classList.add('na-galaxia');
		cam.x = 0;
		cam.zoom = chegadaDoSalto ? ZOOM_SALTO_FIM : calmo ? 1 : 4;
		cam.y = chegadaDoSalto ? alturaDoFuro(ZOOM_SALTO_FIM) : 0;
		trocarCena('galaxia');
		flash.classList.remove('aceso');
		if (history.replaceState) history.replaceState(null, '', '#galaxia');
		// (o cartão só aparece quando a pessoa passa o mouse num destino: o mapa fica mais limpo)
		DESTINOS[3].botao.blur();
	}

	function partir(d) {
		if (cena === 'partida') return;
		if (calmo) { location.href = d.href; return; }
		destinoPartida = d;
		var q = posAtual(d.local && escalaReal ? DESTINOS[3] : d), p = projetar(q[0], q[1], q[2]);
		partidaDe ={ x: cam.x, y: cam.y, zoom: cam.zoom, alvoX: p[2], alvoY: p[3], d: d };
		inicioSaltoDestino = 0;
		cartao.classList.remove('aberto');
		galaxia.classList.add('partindo');
		marcasVisiveis = false; galaxia.classList.remove('escolhendo');
		trocarCena('partida');
	}

	function voltarAoInicio() {
		marcasVisiveis = false; galaxia.classList.remove('escolhendo');
		galaxia.hidden = true;
		galaxia.classList.remove('partindo');
		document.body.classList.remove('na-galaxia');
		intro.hidden = false;
		intro.classList.remove('saltando');
		if (history.replaceState) history.replaceState(null, '', location.pathname);
		trocarCena('cruzeiro');
	}

	botaoIniciar.addEventListener('click', iniciarSalto);
	botaoRever.addEventListener('click', voltarAoInicio);
	document.addEventListener('keydown', function (e) {
		if (e.code === 'Space' && cena === 'cruzeiro' && !intro.hidden && !document.body.classList.contains('embarcando')) { e.preventDefault(); iniciarSalto(); }
	});

	function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

	var anterior = performance.now(), ultimoHud = 0, ultimaGalaxia = 0;
	function quadro(agora) {
		var dt = Math.min(0.05, (agora - anterior) / 1000);
		anterior = agora;
		var t = agora / 1000, tc = (agora - inicioCena) / 1000;

		if (cena === 'cruzeiro' || cena === 'salto') {
			buf.fill(FUNDO);
			// durante o salto, a Via Láctea aparece lá no fundo, pequenininha, e vem crescendo
			// ao encontro da nave (no ponto de onde as estrelas saem)
			if (cena === 'salto' && !calmo) {
				var aproxima = Math.min(1, tc / 2.4);
				cam.zoom = ZOOM_SALTO_INICIO * Math.pow(ZOOM_SALTO_FIM / ZOOM_SALTO_INICIO, aproxima * aproxima);
				cam.x = 0; cam.y = alturaDoFuro(cam.zoom);
				desenharGalaxia(t);
			}
			var v = 0.12, rastro = 0.015, azul = 0, forca = 0, tremor = 0;
			if (cena === 'salto') {
				var k = Math.min(1, tc / 2.4);
				var ease = k * k * k;
				v = 0.12 + ease * 5;
				rastro = 0.015 + ease * 0.45;
				azul = ease;
				forca = k;
				tremor = k * 1.5;
				// no fim do salto, a tela do salto (a mesma das trocas de página, só estrelas e a nave)
				// cobre tudo e vai freando por cima da galáxia: sem clarão
				if (tc > 2.4) chegarNaGalaxia(true);
			}
			desenharEstrelas(calmo ? 0 : dt, v, rastro, azul);
			desenharNave(calmo ? 0 : t, tremor, forca);
			if (agora - ultimoHud > 100) {
				ultimoHud = agora;
				var c = cena === 'salto' ? Math.min(1, 0.02 + Math.pow(Math.min(1, tc / 2.4), 3) * 0.98) : 0.02;
				velocidadeTexto.textContent = c >= 0.999 ? T('VELOCIDADE DA LUZ', 'SPEED OF LIGHT') : c.toLocaleString(LOCALE, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' c';
			}
		} else {
			if (!calmo) giro += dt * (2 * Math.PI / 480); // uma volta a cada 8 minutos
			// os marcadores deslizam entre o mapa ilustrativo e a escala real
			var alvoReal = escalaReal ? 1 : 0;
			if (kReal !== alvoReal) {
				kReal = alvoReal > kReal ? Math.min(1, kReal + dt / 1.2) : Math.max(0, kReal - dt / 1.2);
				ultimaGalaxia = 0; // enquanto deslizam, a tela anda em velocidade normal
			}
			if (cena === 'galaxia' && !calmo) {
				if (chegadaDoSalto) {
					// a galáxia termina de chegar: cresce até o tamanho normal e desce para o meio da tela
					var qc = suave(tc / 1.6);
					cam.zoom = ZOOM_SALTO_FIM + (1 - ZOOM_SALTO_FIM) * qc;
					cam.y = alturaDoFuro(ZOOM_SALTO_FIM) * (1 - qc);
				} else cam.zoom = 1 + 3 * Math.pow(1 - suave(tc / 1.8), 2);
			}
			if (cena === 'partida') {
				// a câmera segue a nave: ela fica no mesmo lugar da tela e a galáxia vem crescendo,
				// com o destino no ponto de onde as estrelas saem (42% da altura)
				var q = suave(tc / 1.8);
				cam.zoom = partidaDe.zoom * Math.pow(3, q);
				cam.x = partidaDe.x + (partidaDe.alvoX - partidaDe.x) * q;
				cam.y = partidaDe.y + (partidaDe.alvoY + alturaDoFuro(cam.zoom) - partidaDe.y) * q;
				// com a nave já no lugar, começa o salto: a tela das trocas de página (transicao.js,
				// com as mesmas estrelas e a mesma nave no mesmo lugar) entra devagar por cima
				if (tc > ENTRA_NAVE + 0.2 && destinoPartida) {
					var href = destinoPartida.href; destinoPartida = null;
					inicioSaltoDestino = agora;
					if (window.saltarPara) window.saltarPara(href, { centroY: 0.42, entrada: 0.55 }); else location.href = href;
				}
			}
			// os pontos e as linhas dos destinos só aparecem quando a viagem terminou e dá para escolher
			// (nunca durante a chegada da decolagem, a volta de um destino ou a partida para outro)
			var escolher = cena === 'galaxia' && (calmo || tc >= (chegadaDoSalto ? 1.7 : 2.2));
			if (escolher !== marcasVisiveis) { marcasVisiveis = escolher; galaxia.classList.toggle('escolhendo', escolher); }
			// parada (depois da chegada), a galáxia gira bem devagar: 15 quadros por segundo bastam
			var parada = cena === 'galaxia' && (calmo || tc > 2.3);
			if (parada && agora - ultimaGalaxia < 1000 / 15) { requestAnimationFrame(quadro); return; }
			ultimaGalaxia = agora;
			desenharGalaxia(t);
			// logo depois do salto: as estrelas em riscos vão freando e a nave para um pouco antes
			// da galáxia e desce para fora da tela (ela só volta quando você escolher um destino)
			if (chegadaDoSalto && cena === 'galaxia' && tc < 1.3) {
				var freio = 1 - suave(tc / 1.1), desce = suave(tc / 1.3);
				if (tc < 1.1) desenharEstrelas(dt, 0.12 + freio * 5, 0.015 + freio * 0.45, freio, freio);
				desenharNave(t, freio * 1.2, freio, { escala: 1 + desce * 0.25, centroY: NAVE_CENTRO_Y + (1.35 - NAVE_CENTRO_Y) * desce });
			}
			// indo para um destino: a nave volta por baixo da tela até o lugar de sempre e a câmera
			// passa a segui-la; quando o salto começa, as estrelas aceleram exatamente como na tela
			// das trocas de página, que entra por cima sem que dê para perceber a emenda
			if (cena === 'partida' && partidaDe) {
				var ks = 0;
				if (inicioSaltoDestino) {
					ks = Math.min(1, (agora - inicioSaltoDestino) / 900);
					var es = ks * ks * ks;
					desenharEstrelas(dt, 0.3 + es * 4.5, 0.02 + es * 0.42, es);
				}
				var entra = suave(tc / ENTRA_NAVE);
				desenharNave(t, ks * 1.2, Math.max(0.4, ks), { centroY: 1.2 + (NAVE_CENTRO_Y - 1.2) * entra });
			}
			posicionarMarcadores();
		}
		ctx.putImageData(img, 0, 0);
		requestAnimationFrame(quadro);
	}

	// Volta pelo botão "voltar" do navegador: tira o clarão
	window.addEventListener('pageshow', function () {
		flash.classList.remove('aceso');
		if (cena === 'partida') { cam.x = 0; cam.y = 0; cam.zoom = 1; galaxia.classList.remove('partindo'); trocarCena('galaxia'); inicioCena -= 5000; }
	});

	var espera;
	window.addEventListener('resize', function () {
		clearTimeout(espera);
		espera = setTimeout(medir, 120);
	});

	medir();
	// Quem volta de um destino (ou já fez a viagem nesta visita) cai direto na galáxia
	var jaViajou = false;
	try { jaViajou = sessionStorage.getItem('jaViajou') === '1'; } catch (e) {}
	if (location.hash === '#galaxia' || jaViajou && location.hash !== '#inicio') {
		chegarNaGalaxia();
		inicioCena -= 1200; // chega quase sem zoom
	} else {
		trocarCena('cruzeiro');
	}
	requestAnimationFrame(quadro);
})();
