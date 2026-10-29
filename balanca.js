// Balança espacial: mostra quanto a balança marcaria no planeta da página
// e compara um pulo na Terra com um pulo nesse planeta.
//
// Uso: <section id="balanca" data-planeta="marte"></section>
//
// A massa da pessoa não muda; muda a força com que cada planeta puxa.
// Por isso: peso lá = peso na Terra x (gravidade lá / gravidade da Terra).
// No pulo, a pessoa sai do chão sempre com a mesma velocidade:
// altura = v² / 2g e tempo no ar = 2v / g.
(function () {
	var raiz = document.getElementById('balanca');
	if (!raiz) return;
	/* o texto no idioma da visita (veja idioma.js) */
	var TR = window.T || function (pt) { return pt; };

	var G_TERRA = 9.81;
	var PULO_TERRA = 0.5; // metros: um pulo comum na Terra
	var V0 = Math.sqrt(2 * G_TERRA * PULO_TERRA);

	var CORPOS = [
		{ id: 'mercurio', nome: 'Mercúrio', g: 3.70,  chao: '#8d8a86', solido: true },
		{ id: 'venus',    nome: 'Vênus',    g: 8.87,  chao: '#c98a3a', solido: true },
		{ id: 'terra',    nome: 'Terra',    em: 'na Terra', g: 9.81,  chao: '#4f8a3c', solido: true },
		{ id: 'marte',    nome: 'Marte',    g: 3.71,  chao: '#b9573a', solido: true },
		{ id: 'jupiter',  nome: 'Júpiter',  g: 24.79, chao: '#c9a27a', solido: false },
		{ id: 'saturno',  nome: 'Saturno',  g: 10.44, chao: '#d8c08a', solido: false },
		{ id: 'urano',    nome: 'Urano',    g: 8.87,  chao: '#9fdde6', solido: false },
		{ id: 'netuno',   nome: 'Netuno',   g: 11.15, chao: '#4a6fd8', solido: false },
		{ id: 'sol',      nome: 'Sol',      em: 'no Sol', g: 274,   chao: '#ffb43c', solido: false },
		// nos destinos da galáxia, os lugares onde a conta fica divertida (a gravidade vem da massa e
		// do tamanho de cada um: g = G × massa / raio²)
		{ id: 'proxima-centauri', nome: 'Proxima b', em: 'em Proxima b', g: 10.5, chao: '#b06a54', solido: true,
			extra: 'É uma estimativa: os cientistas sabem a massa de Proxima b, mas ainda não o tamanho exato.' },
		{ id: 'sirius', nome: 'Sirius B', em: 'em Sirius B', g: 4.0e6, chao: '#cfe0ff', solido: true,
			extra: 'Sirius B é uma anã branca: quase a massa do Sol espremida no tamanho da Terra. Por isso ela puxa tão forte.',
			compara: function (kg) { var n = kg / 635000; return 'É o peso de ' + (n < 2 ? 'um' : 'uns ' + Math.round(n)) + ' Cristo' + (n < 2 ? '' : 's') + ' Redentor' + (n < 2 ? '' : 'es') + ' (cada um tem 635 toneladas)!'; } },
		{ id: 'caranguejo', nome: 'Estrela de nêutrons', quem: 'a estrela de nêutrons', em: 'na estrela de nêutrons do Caranguejo', g: 1.9e12, chao: '#9fc0ff', solido: true,
			extra: 'A estrela de nêutrons tem mais massa que o Sol inteiro num tamanho de cidade: é a gravidade mais forte em que dá para "ficar em pé".',
			compara: function (kg) { var n = kg / 5e11; return 'Mais que todas as pessoas da Terra juntas: ' + (n < 2 ? 'quase o mesmo' : 'umas ' + Math.round(n) + ' vezes') + ' o peso da humanidade inteira!'; } },
		{ id: 'betelgeuse', nome: 'Betelgeuse', em: 'em Betelgeuse', g: 0.0032, chao: '#e0602a', solido: false,
			extra: 'Betelgeuse é tão grande e tão espalhada que, na beirada dela, ela quase não puxa nada.',
			compara: function (kg) { var n = kg * 1000 / 5; return 'Mais leve que ' + (n < 1.5 ? 'uma folha' : Math.ceil(n) + ' folhas') + ' de papel (cada uma tem uns 5 gramas)!'; } }
	];
	// em inglês: os nomes e as frases de cada lugar
	if (window.IDIOMA === 'en') {
		var INGLES = {
			mercurio: { nome: 'Mercury' }, venus: { nome: 'Venus' }, terra: { nome: 'Earth', em: 'on Earth' }, marte: { nome: 'Mars' },
			jupiter: { nome: 'Jupiter' }, saturno: { nome: 'Saturn' }, urano: { nome: 'Uranus' }, netuno: { nome: 'Neptune' },
			sol: { nome: 'Sun', em: 'on the Sun', quem: 'the Sun' },
			'proxima-centauri': { em: 'on Proxima b', extra: 'This is an estimate: scientists know the mass of Proxima b, but not yet its exact size.' },
			sirius: { em: 'on Sirius B', extra: 'Sirius B is a white dwarf: almost the mass of the Sun squeezed into the size of Earth. That is why it pulls so hard.',
				compara: function (kg) { var n = kg / 635000; return 'That is the weight of ' + (n < 2 ? 'one Christ the Redeemer statue' : 'about ' + Math.round(n) + ' Christ the Redeemer statues') + ' (each weighs 635 tonnes)!'; } },
			caranguejo: { nome: 'Neutron star', quem: 'the neutron star', em: 'on the Crab neutron star', extra: 'The neutron star has more mass than the whole Sun in the size of a city: it is the strongest gravity you could "stand" on.',
				compara: function (kg) { var n = kg / 5e11; return 'More than all the people on Earth together: ' + (n < 2 ? 'about the same as' : 'some ' + Math.round(n) + ' times') + ' the weight of all humanity!'; } },
			betelgeuse: { em: 'on Betelgeuse', extra: 'Betelgeuse is so big and so spread out that, at its edge, it barely pulls at all.',
				compara: function (kg) { var n = kg * 1000 / 5; return 'Lighter than ' + (n < 1.5 ? 'a sheet' : Math.ceil(n) + ' sheets') + ' of paper (each weighs about 5 grams)!'; } }
		};
		CORPOS.forEach(function (c) { var e = INGLES[c.id]; if (e) for (var k in e) c[k] = e[k]; if (!c.em || !e || !e.em) c.em = 'on ' + c.nome; });
	}
	var porId = {};
	CORPOS.forEach(function (c) { porId[c.id] = c; c.em = c.em || 'em ' + c.nome; });
	function Em(c) { return c.em.charAt(0).toUpperCase() + c.em.slice(1); }

	var pagina = raiz.getAttribute('data-planeta');
	if (!porId[pagina]) return;
	var escolhido = pagina;
	var naTerra = pagina === 'terra'; // na página da Terra, o pulo aparece sozinho
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var pesoTerra = 50;
	try { pesoTerra = parseFloat(localStorage.getItem('pesoTerra')) || 50; } catch (e) {}

	function num(v, casas) {
		return v.toLocaleString(window.LOCALE || 'pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });
	}
	function pesoEm(c) { return pesoTerra * c.g / G_TERRA; }

	// ---------- Montagem ----------
	var aqui = porId[pagina];

	// alturas e tempos de qualquer tamanho: de menos que um átomo até quilômetros
	function alturaTexto(h) {
		if (h < 1e-10) return TR('menos que um átomo', 'less than an atom');
		if (h < 1e-3) return num(h * 1e6, h < 1e-5 ? 2 : 0) + ' µm';
		if (h < 0.01) return num(h * 1000, 1) + ' mm';
		if (h >= 1000) return num(h / 1000, 1) + ' km';
		if (h >= 10) return num(h, 0) + ' m';
		return num(h * 100, 0) + ' cm';
	}
	function tempoTexto(s) {
		if (s < 0.001) return TR('um instantinho', 'an instant');
		if (s >= 120) return num(s / 60, 0) + ' min';
		return num(s, 2) + ' s';
	}
	// o peso em gramas, quilos ou toneladas (até bilhões de toneladas)
	function pesoTexto(kg) {
		if (kg < 1) return [num(kg * 1000, 0), TR('gramas', 'grams')];
		if (kg < 10000) return [num(kg, kg >= 1000 ? 0 : 1), 'kg'];
		var t = kg / 1000;
		if (t < 1e6) return [num(t, 0), TR('toneladas', 'tonnes')];
		if (t < 1e9) return [num(t / 1e6, 1), TR('milhões de toneladas', 'million tonnes')];
		return [num(t / 1e9, 1), TR('bilhões de toneladas', 'billion tonnes')];
	}
	function cartaoPulo(corpo) {
		var h = V0 * V0 / (2 * corpo.g);
		return '<div class="pulo-cartao pixelado" style="--acento: ' + corpo.chao + '">' +
			'<h4>' + corpo.nome + '</h4>' +
			'<dl>' +
				'<div><dt>' + TR('Altura do pulo', 'Jump height') + '</dt><dd>' + alturaTexto(h) + '</dd></div>' +
				'<div><dt>' + TR('Tempo no ar', 'Time in the air') + '</dt><dd>' + tempoTexto(2 * V0 / corpo.g) + '</dd></div>' +
			'</dl>' +
		'</div>';
	}

	var notaPulo = naTerra
		? TR('Um pulo comum, de quem está parado e pula o mais alto que consegue.', 'An ordinary jump, standing still and jumping as high as you can.')
		: TR('Os dois astronautas pulam com o mesmo impulso: só a gravidade muda.', 'Both astronauts jump with the same push: only the gravity changes.') +
		  (aqui.solido ? '' : ' ' + TR(aqui.nome + ' não tem chão firme, então aqui imaginamos que tivesse.', aqui.nome + ' has no solid ground, so here we imagine it did.'));
	notaPulo += '<br>' + TR('A altura do pulo não depende do seu peso: só da força do impulso e da gravidade do planeta.', 'The jump height does not depend on your weight: only on the push and on the gravity of the place.');

	raiz.className = 'balanca';
	raiz.innerHTML =
		'<h2 class="balanca-titulo">' + TR('Sua balança espacial', 'Your space scale') + '</h2>' +
		'<p class="balanca-intro">' + (naTerra
			? TR('Digite seu peso e veja o que a balança marca aqui na Terra.', 'Type your weight and see what the scale reads here on Earth.')
			: TR('Sua massa é a mesma em qualquer lugar, mas ' + (aqui.quem || aqui.nome) + ' te puxa com uma força diferente da Terra. ' +
			  'Digite seu peso na Terra e veja quanto a balança marcaria ' + aqui.em + '.', 'Your mass is the same everywhere, but ' + (aqui.quem || aqui.nome) + ' pulls on you with a different force than Earth. ' +
			  'Type your weight on Earth and see what the scale would read ' + aqui.em + '.')) + '</p>' +
		'<div class="balanca-painel">' +
			'<div class="balanca-entrada pixelado">' +
				'<label for="pesoTerra">' + TR('Seu peso na Terra', 'Your weight on Earth') + '</label>' +
				'<div class="entrada-linha">' +
					'<button type="button" class="passo" data-passo="-1" aria-label="' + TR('Diminuir 1 kg', 'Decrease 1 kg') + '">−</button>' +
					'<div class="entrada-numero"><input type="number" id="pesoTerra" min="1" max="500" step="1" inputmode="decimal"><span>kg</span></div>' +
					'<button type="button" class="passo" data-passo="1" aria-label="' + TR('Aumentar 1 kg', 'Increase 1 kg') + '">+</button>' +
				'</div>' +
				'<input type="range" id="pesoDeslizar" min="10" max="150" step="1" aria-label="' + TR('Ajustar seu peso na Terra', 'Adjust your weight on Earth') + '">' +
			'</div>' +
			'<div class="balanca-seta" aria-hidden="true"></div>' +
			'<div class="aparelho pixelado" aria-live="polite">' +
				'<div class="aparelho-onde">' + TR('Balança ' + aqui.em, 'Scale ' + aqui.em) + '</div>' +
				'<div class="aparelho-visor"><span id="balancaValor">0</span><small id="balancaUnidade">kg</small></div>' +
				'<div class="aparelho-pes"><i></i><i></i></div>' +
			'</div>' +
		'</div>' +
		'<p class="balanca-nota" id="balancaNota"></p>' +
		'<div class="pulo">' +
			'<h3 class="pulo-titulo">' + (naTerra ? TR('Um pulo na Terra', 'A jump on Earth') : TR('Um pulo na Terra e ' + aqui.em, 'A jump on Earth and ' + aqui.em)) + '</h3>' +
			'<canvas id="puloTela" role="img"></canvas>' +
			'<div class="pulo-cartoes' + (naTerra ? ' sozinho' : '') + '">' +
				(naTerra ? cartaoPulo(aqui) : cartaoPulo(porId.terra) + cartaoPulo(aqui)) +
			'</div>' +
			'<p class="pulo-nota">' + notaPulo + '</p>' +
		'</div>';

	var campo = document.getElementById('pesoTerra');
	var deslizar = document.getElementById('pesoDeslizar');
	var valor = document.getElementById('balancaValor');
	var nota = document.getElementById('balancaNota');
	var tela = document.getElementById('puloTela');

	var hAqui = V0 * V0 / (2 * aqui.g);
	tela.setAttribute('aria-label', naTerra
		? TR('Astronauta pulando na Terra: sobe ' + alturaTexto(PULO_TERRA) + '.', 'Astronaut jumping on Earth: rises ' + alturaTexto(PULO_TERRA) + '.')
		: TR('Dois astronautas pulando com o mesmo impulso: na Terra sobe ' + alturaTexto(PULO_TERRA) + ', ' + aqui.em + ' sobe ' + alturaTexto(hAqui) + '.', 'Two astronauts jumping with the same push: on Earth one rises ' + alturaTexto(PULO_TERRA) + ', ' + aqui.em + ' the other rises ' + alturaTexto(hAqui) + '.'));

	// ---------- Balança ----------
	var mostrado = 0, animacaoNumero = null;
	function animarNumero(alvo) {
		cancelAnimationFrame(animacaoNumero);
		var de = mostrado, inicio = performance.now(), dur = calmo ? 0 : 500;
		(function passo(agora) {
			var t = dur ? Math.min(1, (agora - inicio) / dur) : 1;
			t = 1 - Math.pow(1 - t, 3);
			mostrado = de + (alvo - de) * t;
			valor.textContent = num(mostrado, mostrado >= 1000 ? 0 : 1);
			if (t < 1) animacaoNumero = requestAnimationFrame(passo);
		})(inicio);
	}

	function atualizar() {
		var kg = pesoEm(aqui), unidade = document.getElementById('balancaUnidade');
		// os pesos gigantes (ou minúsculos) aparecem direto em toneladas (ou gramas), sem animar
		if (kg >= 10000 || kg < 1) {
			cancelAnimationFrame(animacaoNumero);
			var p = pesoTexto(kg);
			valor.textContent = p[0]; unidade.textContent = p[1]; mostrado = 0;
		} else { unidade.textContent = 'kg'; animarNumero(kg); }
		var razao = aqui.g / G_TERRA;
		nota.innerHTML = (naTerra
			? TR('Na Terra, a balança marca o seu peso de sempre.', 'On Earth, the scale shows your usual weight.')
			: razao < 0.01
				? Em(aqui) + TR(' você pesaria só <strong>' + num(razao * 100, 2) + '%</strong> do seu peso na Terra.', ' you would weigh only <strong>' + num(razao * 100, 2) + '%</strong> of your weight on Earth.')
				: razao < 1
					? Em(aqui) + TR(' você pesaria <strong>' + num(razao * 100, 0) + '%</strong> do seu peso na Terra.', ' you would weigh <strong>' + num(razao * 100, 0) + '%</strong> of your weight on Earth.')
					: Em(aqui) + TR(' você pesaria <strong>' + num(razao, razao >= 100 ? 0 : 1).replace(/,0$/, '') + ' vezes</strong> o seu peso na Terra.', ' you would weigh <strong>' + num(razao, razao >= 100 ? 0 : 1).replace(/\.0$/, '') + ' times</strong> your weight on Earth.')) +
			(aqui.compara ? ' ' + aqui.compara(kg) : '') + (aqui.extra ? '<br><small>' + aqui.extra + '</small>' : '');
	}

	function definirPeso(v, origem) {
		if (!(v > 0)) return;
		pesoTerra = Math.max(1, Math.min(Math.round(v * 10) / 10, 500));
		if (origem !== campo) campo.value = pesoTerra;
		if (origem !== deslizar) deslizar.value = Math.max(10, Math.min(150, pesoTerra));
		try { localStorage.setItem('pesoTerra', pesoTerra); } catch (e) {}
		atualizar();
	}

	campo.addEventListener('input', function () { definirPeso(parseFloat(campo.value.replace(',', '.')), campo); });
	campo.addEventListener('blur', function () { campo.value = pesoTerra; });
	deslizar.addEventListener('input', function () { definirPeso(parseFloat(deslizar.value), deslizar); });
	raiz.querySelectorAll('.passo').forEach(function (b) {
		b.addEventListener('click', function () { definirPeso(Math.round(pesoTerra) + parseInt(b.getAttribute('data-passo'), 10)); });
	});

	// ---------- Pulo ----------
	// Astronauta em pixel art (11 x 14)
	var ASTRONAUTA = [
		'...DDDDD...',
		'..DWWWWWD..',
		'.DWVVVVVWD.',
		'.DWVvVVVWD.',
		'.DWWWWWWWD.',
		'..DDWWWDD..',
		'.DWWWWWWWD.',
		'DWDWWPWWDWD',
		'DWDWWWWWDWD',
		'DGDWWWWWDGD',
		'.D.DWWWD.D.',
		'...DWDWD...',
		'..DWD.DWD..',
		'..DDD.DDD..'
	];
	var CORES = { D: '#1b1430', W: '#f2eefc', V: '#ff8ad8', v: '#ffffff', P: '#ff8ad8', G: '#b8aed8' };
	var AGACHADO = ASTRONAUTA.slice(0, 11).concat(ASTRONAUTA.slice(13)); // pernas dobradas

	var ctx = tela.getContext('2d');
	var largura = 0, altura = 0, escala = 4, dpr = 1;
	var ALT_MAX = 1.4;   // metros que cabem acima do chão (Mercúrio e Marte: 1,32 m)
	var CHAO = 76, TOPO = 34;

	// O chão é a própria pixel art do planeta (de pixel/sprites.js), bem ampliada:
	// só o topo dele aparece, e o astronauta pula em cima.
	var ARTES = {};
	var LARG_GLOBO = { saturno: 51 }; // Saturno: a arte inclui os anéis, o globo é mais estreito
	['terra', pagina].forEach(function (id) {
		if (ARTES[id] || !window.SPRITES || !window.SPRITES[id]) return;
		var img = new Image();
		img.onload = function () {
			// Mede onde o planeta está na arte: primeira linha com pixels, centro dela e largura
			var c = document.createElement('canvas');
			c.width = img.naturalWidth;
			c.height = img.naturalHeight;
			var g = c.getContext('2d');
			g.drawImage(img, 0, 0);
			var d = g.getImageData(0, 0, c.width, c.height).data;
			var topo = -1, xMin = c.width, xMax = -1;
			for (var y = 0; y < c.height; y++) for (var x = 0; x < c.width; x++) {
				if (d[(y * c.width + x) * 4 + 3] === 0) continue;
				if (topo < 0) topo = y;
				if (x < xMin) xMin = x;
				if (x > xMax) xMax = x;
			}
			var a = 0, b = -1;
			for (x = 0; x < c.width; x++) if (d[(topo * c.width + x) * 4 + 3] > 0) { if (b < 0) a = x; b = x; }
			ARTES[id] = { img: img, topo: topo, cx: (a + b + 1) / 2, globo: LARG_GLOBO[id] || (xMax - xMin + 1) };
		};
		img.src = window.SPRITES[id];
	});

	function medir() {
		dpr = Math.min(window.devicePixelRatio || 1, 2);
		largura = tela.clientWidth;
		altura = Math.round(Math.max(300, Math.min(380, largura * 0.5)));
		tela.style.height = altura + 'px';
		tela.width = Math.round(largura * dpr);
		tela.height = Math.round(altura * dpr);
		escala = largura < 480 ? 3 : 5;
	}

	function desenharBoneco(sprite, x, yPes) {
		var h = sprite.length, w = sprite[0].length;
		var x0 = Math.round(x - w * escala / 2), y0 = Math.round(yPes - h * escala);
		for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
			var cor = CORES[sprite[j][i]];
			if (!cor) continue;
			ctx.fillStyle = cor;
			ctx.fillRect(x0 + i * escala, y0 + j * escala, escala, escala);
		}
	}

	function painel(x, w, corpo, t) {
		var pxPorMetro = (altura - CHAO - TOPO - ASTRONAUTA.length * escala) / ALT_MAX;
		var yChao = altura - CHAO;
		var voo = 2 * V0 / corpo.g;
		var hMax = V0 * V0 / (2 * corpo.g);

		ctx.save();
		ctx.beginPath();
		ctx.rect(x, 0, w, altura);
		ctx.clip();

		// fundo do painel
		ctx.fillStyle = 'rgba(10, 6, 24, 0.55)';
		ctx.fillRect(x, 0, w, altura);
		// chão: o topo da pixel art do planeta
		var arte = ARTES[corpo.id];
		if (arte) {
			var s = Math.max(3, Math.round(w * 1.6 / arte.globo)); // ampliação inteira: pixels nítidos
			ctx.imageSmoothingEnabled = false;
			ctx.drawImage(arte.img,
				Math.round(x + w / 2 - arte.cx * s), yChao - arte.topo * s,
				arte.img.naturalWidth * s, arte.img.naturalHeight * s);
		} else {
			ctx.fillStyle = corpo.chao;
			ctx.fillRect(x, yChao, w, CHAO);
		}

		// linha da altura máxima
		var yTopo = yChao - hMax * pxPorMetro;
		ctx.strokeStyle = 'rgba(255, 138, 216, 0.75)';
		ctx.setLineDash([6, 6]);
		ctx.beginPath();
		ctx.moveTo(x + 12, Math.round(yTopo) + 0.5);
		ctx.lineTo(x + w - 12, Math.round(yTopo) + 0.5);
		ctx.stroke();
		ctx.setLineDash([]);

		// textos
		ctx.fillStyle = '#ffffff';
		ctx.font = '700 17px "Space Grotesk", sans-serif';
		ctx.textBaseline = 'top';
		ctx.fillText(corpo.nome, x + 12, 10);
		ctx.fillStyle = '#b8aed8';
		ctx.font = '13px "Space Grotesk", sans-serif';
		ctx.fillText(TR('gravidade ', 'gravity ') + num(corpo.g, corpo.g >= 1000 ? 0 : corpo.g < 0.1 ? 4 : 2) + ' m/s²', x + 12, 32);
		ctx.textAlign = 'right';
		ctx.fillStyle = '#ff8ad8';
		ctx.fillText(alturaTexto(hMax), x + w - 12, Math.max(52, yTopo - 18));
		ctx.textAlign = 'left';

		// boneco: agacha, pula, cai, agacha
		var AGACHA = 0.18, POUSO = 0.14;
		var sprite = ASTRONAUTA, subida = 0;
		if (t < AGACHA) sprite = AGACHADO;
		else if (t < AGACHA + voo) {
			var tv = t - AGACHA;
			subida = V0 * tv - corpo.g * tv * tv / 2;
		} else if (t < AGACHA + voo + POUSO) sprite = AGACHADO;
		if (calmo) { sprite = ASTRONAUTA; subida = hMax; }
		desenharBoneco(sprite, x + w / 2, yChao - Math.max(0, subida) * pxPorMetro);
		ctx.restore();
	}

	var inicioPulo = 0, visivel = true;
	function reiniciarPulo() { inicioPulo = performance.now(); }

	function quadro(agora) {
		if (visivel && largura) {
			var c = porId[escolhido];
			// (em Betelgeuse o pulo dura mais de meia hora: o astronauta sobe, some lá em cima e,
			// depois de uns segundos, a cena recomeça)
			var ciclo = Math.min(6, 0.18 + 0.14 + 1.1 + Math.max(2 * V0 / G_TERRA, 2 * V0 / c.g));
			var t = ((agora - inicioPulo) / 1000) % ciclo;
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, largura, altura);
			if (naTerra) {
				painel(0, largura, c, t);
			} else {
				var meio = Math.floor(largura / 2);
				painel(0, meio - 4, porId.terra, t);
				painel(meio + 4, largura - meio - 4, c, t);
			}
		}
		if (!calmo) requestAnimationFrame(quadro);
	}

	if ('IntersectionObserver' in window) {
		new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; }).observe(tela);
	}
	var espera;
	window.addEventListener('resize', function () {
		clearTimeout(espera);
		espera = setTimeout(function () { medir(); if (calmo) quadro(performance.now()); }, 120);
	});

	medir();
	definirPeso(pesoTerra);
	reiniciarPulo();
	// redesenha quando as fontes terminarem de carregar
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (calmo) quadro(performance.now()); });
	requestAnimationFrame(quadro);
})();
