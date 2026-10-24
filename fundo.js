// Fundo do site, igual em todas as páginas e no mesmo estilo da viagem:
// tudo em pixel art (cada pixel do fundo vira um bloco de 3x3 na tela).
//  - nebulosas só nas bordas, pontilhadas em poucos tons, com cores que mudam devagar;
//  - estrelinhas de 1 pixel piscando, e algumas maiores com brilho em cruz.
(function () {
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	var ceu = document.createElement('div');
	ceu.className = 'ceu';
	ceu.setAttribute('aria-hidden', 'true');
	var telaNeb = document.createElement('canvas');
	var telaEst = document.createElement('canvas');
	telaNeb.className = 'nebulosas';
	telaEst.className = 'estrelas';
	ceu.appendChild(telaNeb);
	ceu.appendChild(telaEst);
	document.body.insertBefore(ceu, document.body.firstChild);

	var neb = telaNeb.getContext('2d'), est = telaEst.getContext('2d');
	var P = 3, W = 0, H = 0;
	var densidade = null, imgNeb = null, bufNeb = null, imgEst = null, bufEst = null;
	var estrelas = [];

	function cor(r, g, b, a) { return ((a === undefined ? 255 : a) << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }

	// ruído suave para o formato das nebulosas
	function hash(x, y) {
		var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263)) | 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	}
	function ruido(x, y) {
		var xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi;
		u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
		var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
		return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
	}
	function fbm(x, y) {
		var s = 0, a = 0.5;
		for (var i = 0; i < 5; i++) { s += ruido(x, y) * a; x *= 2; y *= 2; a *= 0.5; }
		return s / 0.97;
	}

	function preparar() {
		P = window.innerWidth < 700 ? 2 : window.innerWidth < 1400 ? 3 : 4;
		W = Math.max(1, Math.ceil(window.innerWidth / P));
		H = Math.max(1, Math.ceil(window.innerHeight / P));
		telaNeb.width = telaEst.width = W;
		telaNeb.height = telaEst.height = H;
		imgNeb = neb.createImageData(W, H); bufNeb = new Uint32Array(imgNeb.data.buffer);
		imgEst = est.createImageData(W, H); bufEst = new Uint32Array(imgEst.data.buffer);

		// formato das nebulosas (fixo): fiapos de ruído, só perto das bordas
		densidade = new Float32Array(W * H);
		var esc = 60 / P;
		for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
			var dx = (x / W - 0.5) * 2, dy = (y / H - 0.5) * 2;
			var borda = Math.max(0, Math.min(1, (Math.sqrt(dx * dx * 0.8 + dy * dy * 1.2) - 0.75) / 0.6));
			var n = fbm(x / esc, y / esc);
			densidade[y * W + x] = Math.max(0, (n - 0.45) * 2.2) * borda;
		}

		estrelas = [];
		var qtd = Math.round(W * H / 160);
		for (var i = 0; i < qtd; i++) {
			var sorte = Math.random();
			estrelas.push({
				x: (Math.random() * W) | 0, y: (Math.random() * H) | 0,
				grande: Math.random() < 0.025,
				brilho: 0.35 + Math.random() * 0.65,
				vel: 0.6 + Math.random() * 2.4, fase: Math.random() * 6.3,
				c: sorte < 0.1 ? [180, 210, 255] : sorte < 0.16 ? [255, 210, 235] : sorte < 0.2 ? [255, 236, 190] : [255, 255, 255]
			});
		}
		desenharNebulosas(0);
	}

	// cores das nebulosas: duas cores que vão mudando devagar (rosa, roxo, azul, verde-água)
	var TONS = [[255, 80, 170], [150, 80, 255], [70, 130, 255], [40, 200, 200], [255, 110, 150]];
	function tomNoTempo(s, desloc) {
		var p = (s / 18 + desloc) % TONS.length, i = Math.floor(p), f = p - i;
		var a = TONS[i], b = TONS[(i + 1) % TONS.length];
		return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
	}
	var LIMIAR = [0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875, 0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125];

	function desenharNebulosas(s) {
		var c1 = tomNoTempo(s, 0), c2 = tomNoTempo(s, 2.5);
		for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
			var k = y * W + x, d = densidade[k];
			if (d <= 0.02) { bufNeb[k] = 0; continue; }
			// pontilhado ordenado 4x4: 3 tons, bem pixel art
			var lim = LIMIAR[(x & 3) + ((y & 3) << 2)];
			var nivel = Math.min(3, Math.floor(d * 3 + lim));
			if (nivel <= 0) { bufNeb[k] = 0; continue; }
			var mix = (x / W + y / H) / 2;
			var r = c1[0] + (c2[0] - c1[0]) * mix, g = c1[1] + (c2[1] - c1[1]) * mix, b = c1[2] + (c2[2] - c1[2]) * mix;
			var forca = [0, 0.16, 0.28, 0.42][nivel];
			bufNeb[k] = cor(r * forca, g * forca, b * forca, 255);
		}
		neb.putImageData(imgNeb, 0, 0);
	}

	function desenharEstrelas(s) {
		bufEst.fill(0);
		for (var i = 0; i < estrelas.length; i++) {
			var e = estrelas[i];
			var onda = calmo ? 1 : 0.5 + 0.5 * Math.sin(s * e.vel + e.fase);
			// durante a leitura, as estrelas quase param de piscar (menos distração)
			var b = lendo ? e.brilho * (0.6 + 0.12 * onda) : e.brilho * (0.25 + 0.75 * onda * onda);
			var c = cor(e.c[0] * b, e.c[1] * b, e.c[2] * b, 255);
			bufEst[e.y * W + e.x] = c;
			if (e.grande && b > 0.45) {
				var c2 = cor(e.c[0] * b * 0.45, e.c[1] * b * 0.45, e.c[2] * b * 0.55, 255);
				if (e.x > 0) bufEst[e.y * W + e.x - 1] = c2;
				if (e.x < W - 1) bufEst[e.y * W + e.x + 1] = c2;
				if (e.y > 0) bufEst[(e.y - 1) * W + e.x] = c2;
				if (e.y < H - 1) bufEst[(e.y + 1) * W + e.x] = c2;
			}
		}
		est.putImageData(imgEst, 0, 0);
	}

	var anterior = 0, ultimaNeb = 0;
	function laco(agora) {
		if (agora - anterior >= 1000 / 15) {
			anterior = agora;
			var s = agora / 1000;
			desenharEstrelas(s);
			if (agora - ultimaNeb > 300) { ultimaNeb = agora; desenharNebulosas(s); }
		}
		requestAnimationFrame(laco);
	}

	// "Abaixar as luzes" para ler: quando a parte de texto da página ocupa a tela,
	// o fundo escurece (pelo CSS, com transição suave) e as estrelas param de piscar.
	var lendo = false;
	var leitura = document.getElementById('leitura');
	function conferirLeitura() {
		if (!leitura) return;
		var topo = leitura.getBoundingClientRect().top;
		var agora = topo < window.innerHeight * 0.55;
		if (agora !== lendo) {
			lendo = agora;
			ceu.classList.toggle('lendo', lendo);
			if (calmo) desenharEstrelas(0);
		}
	}
	window.addEventListener('scroll', conferirLeitura, { passive: true });
	window.addEventListener('hashchange', conferirLeitura);

	var espera;
	window.addEventListener('resize', function () {
		clearTimeout(espera);
		espera = setTimeout(function () { preparar(); desenharEstrelas(0); }, 150);
	});

	preparar();
	conferirLeitura();
	desenharEstrelas(0);
	if (!calmo) requestAnimationFrame(laco);
})();
