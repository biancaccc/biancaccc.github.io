// Embarque: antes da primeira decolagem, o piloto passa pela recepção da Agência Andarilha
// (um "Detran das naves"), entrega o passaporte e a carteira de piloto, assina, recebe o carimbo
// de APROVADO, pega os documentos de volta, vê a nave estacionada no hangar e entra pela porta.
//
// As cenas são pixel art desenhada aqui, pixel a pixel, com 270 pixels de altura e a largura que
// a tela pedir (de 480 a 640): telas mais largas ganham mais cenário dos lados, e nada é cortado.
// A recepção e o hangar são montados em 3D de verdade (uma câmera projetando o chão, as paredes,
// os guichês), para a perspectiva ficar certa. A mesa vista de cima é um "mundo" com câmera onde
// ficam os documentos DE VERDADE do jogo (os do passaporte.js), que abrem, recebem a assinatura e
// o carimbo. As falas são balbucios (cada letra faz um blipzinho de voz). Aparece só na primeira
// visita (localStorage "embarqueFeito"); "?embarque" no endereço mostra de novo.
(function () {
	'use strict';
	var forcar = /[?&]embarque/.test(location.search);
	var feito = false;
	try { feito = localStorage.getItem('embarqueFeito') === '1'; } catch (e) {}
	if ((feito || location.hash === '#galaxia') && !forcar) return;
	try { if (sessionStorage.getItem('salto') === '1' && !forcar) return; } catch (e) {}

	// o "miolo" de cada cena tem 480 x 270; a tela de verdade tem W de largura, com OX de cenário extra de cada lado
	var NUCLEO = 480, H = 270, W = 480, OX = 0;
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var RAD = Math.PI / 180;
	function medir() {
		var a = window.innerWidth / Math.max(1, window.innerHeight);
		W = Math.round(Math.max(NUCLEO, Math.min(640, H * a)));
		W += W % 2;
		OX = (W - NUCLEO) / 2;
	}
	medir();

	// ---------- A tela ----------
	var raiz = document.createElement('div');
	raiz.className = 'embarque';
	raiz.setAttribute('role', 'dialog');
	raiz.setAttribute('aria-label', T('Embarque na Agência Andarilha', 'Boarding at the Andarilha Agency'));
	raiz.innerHTML =
		'<div class="emb-palco">' +
			'<canvas class="emb-tela" aria-hidden="true"></canvas>' +
			'<div class="emb-mundo" hidden><div class="emb-camera">' +
				'<canvas class="emb-mesa" aria-hidden="true"></canvas><div class="emb-nucleo"></div>' +
			'</div></div>' +
			'<div class="emb-escuro"></div>' +
			'<div class="emb-camada"></div>' +
		'</div>' +
		'<div class="emb-topo"><button type="button" class="emb-som" aria-pressed="true" title="' + T('Som ligado', 'Sound on') + '">&#9835; ' + T('Som', 'Sound') + '</button>' +
		'<button type="button" class="emb-pular">' + T('Pular embarque', 'Skip boarding') + ' &#9656;</button></div>';
	document.body.appendChild(raiz);
	document.body.classList.add('embarcando');
	var palco = raiz.querySelector('.emb-palco');
	var tela = raiz.querySelector('.emb-tela'), ctx = tela.getContext('2d');
	var mundo = raiz.querySelector('.emb-mundo'), camera = raiz.querySelector('.emb-camera'), nucleo = raiz.querySelector('.emb-nucleo');
	var mesaTela = raiz.querySelector('.emb-mesa'), mesaCtx = mesaTela.getContext('2d');
	var camada = raiz.querySelector('.emb-camada'), escuro = raiz.querySelector('.emb-escuro');

	// o palco: proporção W:H, cabendo inteiro na janela (sem cortar nada)
	function ajustarPalco() {
		var vw = window.innerWidth, vh = window.innerHeight, w = Math.min(vw, vh * W / H);
		palco.style.width = w + 'px'; palco.style.height = (w * H / W) + 'px';
		tela.width = W; tela.height = H; mesaTela.width = W; mesaTela.height = H;
		ctx.imageSmoothingEnabled = false; mesaCtx.imageSmoothingEnabled = false;
		mesaTela.style.width = (W * 4) + 'px'; mesaTela.style.height = (H * 4) + 'px';
		nucleo.style.left = (OX * 4) + 'px';
	}
	ajustarPalco();

	// ---------- Pintura pixel a pixel (num buffer, sem borrado nenhum) ----------
	var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return (v + 0.5) / 16; });
	function limiar(x, y) { return BAYER[(x & 3) + ((y & 3) << 2)]; }
	function ruido(x, y) { var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
	var CORES = {};
	function rgb(h) { var v = CORES[h]; if (v === undefined) { var n = parseInt(h.slice(1), 16); v = CORES[h] = (255 << 24 | (n & 255) << 16 | ((n >> 8) & 255) << 8 | (n >> 16)) >>> 0; } return v; }
	// escolhe entre as cores de uma rampa, pontilhando a passagem de uma para a outra
	function rampa(cores, t, x, y) {
		var n = cores.length - 1, v = Math.max(0, Math.min(n, t * n)), i = Math.floor(v);
		if (i >= n) return cores[n];
		return v - i > limiar(Math.round(x), Math.round(y)) ? cores[i + 1] : cores[i];
	}
	// buf é o buffer em que se pinta; DX desloca o "miolo" para o meio da tela larga
	var buf = null, BW = 0, BH = 0, DX = 0;
	function Pintura(w, h, dx) { this.w = w; this.h = h; this.dx = dx || 0; this.d = new Uint32Array(w * h); }
	function pintar(p, fn) { var a = buf, aw = BW, ah = BH, ad = DX; buf = p.d; BW = p.w; BH = p.h; DX = p.dx; fn(); buf = a; BW = aw; BH = ah; DX = ad; return p; }
	function tela0() { return new Pintura(W, H, OX); } // uma pintura do tamanho da tela, com o miolo no meio
	function px(x, y, c) { x = Math.round(x + DX); y = Math.round(y); if (x < 0 || y < 0 || x >= BW || y >= BH || !c) return; buf[y * BW + x] = rgb(c); }
	function ret(x, y, w, h, c) {
		var x0 = Math.round(x + DX), y0 = Math.round(y), x1 = x0 + Math.round(w), y1 = y0 + Math.round(h);
		for (var j = Math.max(0, y0); j < Math.min(BH, y1); j++) for (var i = Math.max(0, x0); i < Math.min(BW, x1); i++) {
			var k = typeof c === 'function' ? c(i - DX, j) : c;
			if (k) buf[j * BW + i] = rgb(k);
		}
	}
	function grad(x, y, w, h, cores, deitado) {
		ret(x, y, w, h, function (i, j) { return rampa(cores, deitado ? (i - x) / Math.max(1, w - 1) : (j - y) / Math.max(1, h - 1), i, j); });
	}
	// mistura uma cor por cima com transparência (para brilhos, vidros e sombras)
	function mistura(x, y, h, a) {
		x = Math.round(x + DX); y = Math.round(y); if (x < 0 || y < 0 || x >= BW || y >= BH || a <= 0) return;
		a = Math.min(1, a);
		var k = y * BW + x, o = buf[k], n = rgb(h);
		if (!(o >>> 24)) { buf[k] = n; return; }
		var r = (o & 255) * (1 - a) + (n & 255) * a, g = ((o >> 8) & 255) * (1 - a) + ((n >> 8) & 255) * a, b = ((o >> 16) & 255) * (1 - a) + ((n >> 16) & 255) * a;
		buf[k] = (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
	}
	// polígono convexo preenchido por linhas (cor fixa ou uma função de x, y)
	function poli(pts, c) {
		var y0 = Infinity, y1 = -Infinity;
		pts.forEach(function (p) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
		y0 = Math.max(Math.floor(y0), -1); y1 = Math.min(Math.ceil(y1), BH + 1);
		for (var y = y0; y <= y1; y++) {
			var xa = Infinity, xb = -Infinity, yy = y + 0.5;
			for (var i = 0; i < pts.length; i++) {
				var a = pts[i], b = pts[(i + 1) % pts.length];
				if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) { var x = a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); xa = Math.min(xa, x); xb = Math.max(xb, x); }
			}
			if (xa < xb) for (var xx = Math.max(Math.round(xa), -DX - 2); xx < Math.min(Math.round(xb), BW - DX + 2); xx++) px(xx, y, typeof c === 'function' ? c(xx, y) : c);
		}
	}
	function elip(cx, cy, rx, ry, c) {
		for (var j = -ry; j <= ry; j++) {
			var m = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry || 1))));
			for (var i = -m; i <= m; i++) px(cx + i, cy + j, typeof c === 'function' ? c(cx + i, cy + j, i / (rx || 1), j / (ry || 1)) : c);
		}
	}
	function linha(x0, y0, x1, y1, c) {
		var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
		for (var i = 0; i <= n; i++) px(x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1), c);
	}
	function brilho(cx, cy, r, h, forca) {
		for (var j = -r; j <= r; j++) for (var i = -r; i <= r; i++) {
			var d = Math.sqrt(i * i + j * j) / r; if (d >= 1) continue;
			mistura(cx + i, cy + j, h, (1 - d) * (1 - d) * forca);
		}
	}
	// contorno escuro em volta de um sprite (como em Papers, Please): todo pixel vazio encostado num cheio
	function contornar(p, cor) {
		var d = p.d, w = p.w, h = p.h, c = rgb(cor), o = new Uint32Array(d);
		for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
			var i = y * w + x; if (d[i]) continue;
			if ((x > 0 && d[i - 1]) || (x < w - 1 && d[i + 1]) || (y > 0 && d[i - w]) || (y < h - 1 && d[i + w])) o[i] = c;
		}
		p.d = o; return p;
	}
	// cola um sprite (Pintura) no buffer atual, na posição (x, y) do miolo
	function colar(p, x, y) {
		x = Math.round(x); y = Math.round(y);
		for (var j = 0; j < p.h; j++) for (var i = 0; i < p.w; i++) {
			var v = p.d[j * p.w + i]; if (!v) continue;
			var X = x + i + DX, Y = y + j; if (X < 0 || Y < 0 || X >= BW || Y >= BH) continue;
			buf[Y * BW + X] = v;
		}
	}
	// textura em perspectiva: uma Pintura esticada num quadrilátero da tela (para placas na parede)
	function quadTex(p, q, alfa) {
		var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
		var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, g = 0, hh = 0;
		if (Math.abs(sx) > 1e-9 || Math.abs(sy) > 1e-9) { var den = dx1 * dy2 - dx2 * dy1; g = (sx * dy2 - dx2 * sy) / den; hh = (dx1 * sy - sx * dy1) / den; }
		var a = x1 - x0 + g * x1, b = x3 - x0 + hh * x3, c = x0, d = y1 - y0 + g * y1, e = y3 - y0 + hh * y3, f = y0;
		// inversa da matriz [[a b c] [d e f] [g h 1]]
		var A = e - f * hh, B = c * hh - b, C = b * f - c * e, D = f * g - d, E = a - c * g, F = c * d - a * f, G = d * hh - e * g, Hh = b * g - a * hh, I = a * e - b * d;
		var mx0 = Math.floor(Math.min(x0, x1, x2, x3)), mx1 = Math.ceil(Math.max(x0, x1, x2, x3)), my0 = Math.floor(Math.min(y0, y1, y2, y3)), my1 = Math.ceil(Math.max(y0, y1, y2, y3));
		for (var y = my0; y <= my1; y++) for (var x = mx0; x <= mx1; x++) {
			var X = x + 0.5, Y = y + 0.5, w = G * X + Hh * Y + I, u = (A * X + B * Y + C) / w, v = (D * X + E * Y + F) / w;
			if (u < 0 || v < 0 || u >= 1 || v >= 1) continue;
			var s = p.d[Math.floor(v * p.h) * p.w + Math.floor(u * p.w)]; if (!s) continue;
			if (alfa) { var hex = '#' + ('00000' + (((s & 255) << 16) | (s & 0xff00) | ((s >> 16) & 255)).toString(16)).slice(-6); mistura(x, y, hex, alfa); }
			else { var XX = x + DX; if (XX >= 0 && y >= 0 && XX < BW && y < BH) buf[y * BW + XX] = s; }
		}
	}
	// uma fontezinha de 3 x 5 pixels, desenhada à mão, para todas as placas ficarem nítidas
	var F3 = {
		A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
		G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
		M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
		S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
		Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
		4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
		'-': '000000111000000', '.': '000000000000010', ':': '000010000010000', '>': '100010001010100', '<': '001010100010001',
		'!': '010010010000010', '/': '001001010100100', '+': '000010111010000', '?': '110001010000010', '·': '000000010000000'
	};
	var SEM_ACENTO = { 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'À': 'A', 'É': 'E', 'Ê': 'E', 'Í': 'I', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ú': 'U', 'Ç': 'C', 'Ö': 'O' };
	function larguraLetras(s, esc) { return (s.length * 4 - 1) * (esc || 1); }
	function letras(s, x, y, esc, c, centro) {
		esc = esc || 1; s = s.toUpperCase();
		if (centro) x = Math.round(x - larguraLetras(s, esc) / 2);
		for (var n = 0; n < s.length; n++, x += 4 * esc) {
			var ch = s[n], g = F3[SEM_ACENTO[ch] || ch];
			if (!g) continue;
			for (var i = 0; i < 15; i++) if (g[i] === '1') ret(x + (i % 3) * esc, y + Math.floor(i / 3) * esc, esc, esc, c);
			if (/[ÁÂÃÀÉÊÍÓÔÕÚ]/.test(ch)) ret(x + esc, y - 2 * esc, esc, esc, c);
			if (ch === 'Ç') ret(x + esc, y + 5 * esc, esc, esc, c);
			if (ch === 'Ö') { ret(x, y - 2 * esc, esc, esc, c); ret(x + 2 * esc, y - 2 * esc, esc, esc, c); }
		}
	}
	function paraCanvas(p) {
		var k = document.createElement('canvas'); k.width = p.w; k.height = p.h;
		var g = k.getContext('2d'), img = g.createImageData(p.w, p.h);
		new Uint32Array(img.data.buffer).set(p.d); g.putImageData(img, 0, 0);
		return k;
	}
	function deCanvas(k, w, h) { // um canvas/imagem virando Pintura (para usar como textura)
		var c = document.createElement('canvas'); c.width = w; c.height = h;
		var g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(k, 0, 0, w, h);
		var p = new Pintura(w, h), d = g.getImageData(0, 0, w, h).data;
		for (var i = 0; i < w * h; i++) if (d[i * 4 + 3] > 128) p.d[i] = (255 << 24 | d[i * 4 + 2] << 16 | d[i * 4 + 1] << 8 | d[i * 4]) >>> 0;
		return p;
	}
	// ajudantes de desenho direto no canvas (para o que se mexe a cada quadro), em coordenadas do miolo
	function R(c, x, y, w, h, cor) { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
	function P(c, x, y, cor) { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
	function linhaGrossa(c, a, b, w, cor) {
		var n = Math.ceil(Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])));
		c.fillStyle = cor;
		for (var i = 0; i <= n; i++) { var t = i / (n || 1); c.fillRect(Math.round(a[0] + (b[0] - a[0]) * t - w / 2), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(w), 1); }
	}
	// a setinha de "clique aqui": dourada, com contorno azul-marinho grosso, um halo pulsando em volta
	// e quicando, para aparecer bem em cima de qualquer fundo (claro ou escuro)
	// (um meio-termo: dá para achar, mas sem gritar)
	function setaAcesa(c, sx, sy, t) {
		sy = Math.round(sy + Math.sin(t * 4) * 2);
		var pul = 0.5 + 0.5 * Math.sin(t * 4);
		c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.1 + pul * 0.12; c.fillStyle = '#ffd36a';
		c.beginPath(); c.arc(sx, sy + 8, 10, 0, Math.PI * 2); c.fill(); c.restore();
		function forma(dx, dy, cor) { R(c, sx - 2 + dx, sy + dy, 5, 8, cor); for (var j = 0; j < 6; j++) R(c, sx - 6 + j + dx, sy + 8 + j + dy, 13 - j * 2, 1, cor); }
		forma(1, 1, 'rgba(10,8,20,0.35)'); // a sombra
		[[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(function (d) { forma(d[0], d[1], 'rgba(16,26,74,0.85)'); }); // o contorno fininho
		forma(0, 0, '#ffd36a');
		R(c, sx - 1, sy + 1, 1, 7, '#fff4c8'); // o brilho
	}
	function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
	function texto3(c, s, x, y, esc, cor) {
		c.fillStyle = cor; s = s.toUpperCase();
		for (var n = 0; n < s.length; n++) { var g = F3[SEM_ACENTO[s[n]] || s[n]]; if (!g) continue; for (var i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(x + n * 4 * esc + (i % 3) * esc, y + Math.floor(i / 3) * esc, esc, esc); }
	}

	// ---------- Uma câmera 3D simples (para a recepção e o hangar terem a perspectiva certa) ----------
	function camera3d(o) {
		var cy = Math.cos(o.yaw), sy = Math.sin(o.yaw), cp = Math.cos(o.pitch), sp = Math.sin(o.pitch);
		var proj = function (x, y, z) {
			var dx = x - o.x, dy = y - o.y, dz = z - o.z, xr = dx * cy - dz * sy, zr = dx * sy + dz * cy;
			var yr = dy * cp + zr * sp, zz = Math.max(0.05, -dy * sp + zr * cp);
			return [o.cx + o.f * xr / zz, o.cy - o.f * yr / zz, zz];
		};
		// o raio que sai da câmera por um pixel da tela (para pintar chão, teto e paredes)
		proj.raio = function (sx, sy) {
			var xr = (sx - o.cx) / o.f, yr = (o.cy - sy) / o.f;
			var dy = yr * cp - sp, zr = yr * sp + cp;
			return [xr * cy + zr * sy, dy, -xr * sy + zr * cy];
		};
		proj.o = o;
		return proj;
	}
	// uma face 3D (4 cantos) pintada na tela
	function face(cam, pts, c) { poli(pts.map(function (p) { return cam(p[0], p[1], p[2]); }), c); }

	// o selo da agência (de marca.js), carregado como imagem para ir na parede e na abertura
	var seloImg = null;
	if (window.Andarilha && window.Andarilha.selo) {
		var svg = window.Andarilha.selo();
		if (typeof svg !== 'string') svg = svg.outerHTML;
		if (svg.indexOf('xmlns=') < 0) svg = svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
		var im = new Image();
		im.onload = function () { seloImg = im; refazerFundos(); };
		im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
	}

	// o símbolo da agência (32 x 32, pixel art de verdade): usado sempre em tamanho inteiro (1x, 2x), nítido
	var simbImg = null;
	if (window.Andarilha && window.Andarilha.simbolo) {
		var svgS = window.Andarilha.simbolo().replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"');
		var imS = new Image();
		imS.onload = function () { simbImg = imS; refazerFundos(); };
		imS.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgS);
	}

	// ---------- Sons (Web Audio) ----------
	var AC = window.AudioContext || window.webkitAudioContext, audio = null, mestre = null, somLigado = true, ambiente = null;
	function iniciarAudio() {
		if (audio || !AC) return;
		audio = new AC();
		mestre = audio.createGain(); mestre.gain.value = 0.5; mestre.connect(audio.destination);
	}
	function tom(tipo, f, t0, dur, vol, f2) {
		if (!audio) return;
		var o = audio.createOscillator(), g = audio.createGain();
		o.type = tipo; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
		g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		o.connect(g); g.connect(mestre); o.start(t0); o.stop(t0 + dur + 0.02);
	}
	function chiado(t0, dur, vol, freq, q, freq2, destino) {
		if (!audio) return;
		var n = Math.floor(audio.sampleRate * dur), b = audio.createBuffer(1, n, audio.sampleRate), d = b.getChannelData(0);
		for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
		var s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
		s.buffer = b; f.type = 'bandpass'; f.frequency.setValueAtTime(freq, t0); if (freq2) f.frequency.exponentialRampToValueAtTime(freq2, t0 + dur); f.Q.value = q || 1;
		g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		s.connect(f); f.connect(g); g.connect(destino || mestre); s.start(t0);
		return s;
	}
	// um ruído com o volume desenhado à mão (pontos [tempo, volume], em rampas): é o que faz papel,
	// couro, plástico e borracha soarem como coisa de verdade, e não como um chiado que só some
	function ruidoEnv(t0, pontos, freq, q, tipo, freq2) {
		if (!audio) return;
		var dur = pontos[pontos.length - 1][0], n = Math.floor(audio.sampleRate * (dur + 0.05)), b = audio.createBuffer(1, n, audio.sampleRate), d = b.getChannelData(0);
		for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
		var s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
		s.buffer = b; f.type = tipo || 'bandpass'; f.frequency.setValueAtTime(freq, t0); if (freq2) f.frequency.linearRampToValueAtTime(freq2, t0 + dur); f.Q.value = q || 1;
		g.gain.setValueAtTime(0, t0); pontos.forEach(function (p) { g.gain.linearRampToValueAtTime(p[1], t0 + p[0]); });
		s.connect(f); f.connect(g); g.connect(mestre); s.start(t0); s.stop(t0 + dur + 0.05);
	}
	// os estalinhos do papel se dobrando: grãos curtinhos e irregulares de ruído agudo
	function crepitar(t0, dur, densidade, vol) {
		for (var t = t0; t < t0 + dur; t += (0.008 + Math.random() * 0.035) / densidade) {
			var v = vol * (0.25 + Math.random() * 0.75);
			ruidoEnv(t, [[0.002, v], [0.006 + Math.random() * 0.018, 0]], 2200 + Math.random() * 4500, 1.4);
		}
	}
	// o blip de voz de cada letra (o "balbucio"): uma nota curtinha passando por um filtro de vogal
	function blip(base) {
		if (!audio || !somLigado) return;
		var t = audio.currentTime, o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
		o.type = 'square'; o.frequency.value = base * (0.85 + Math.random() * 0.35);
		f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 900; f.Q.value = 3;
		g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
		o.connect(f); f.connect(g); g.connect(mestre); o.start(t); o.stop(t + 0.07);
	}
	var SONS = {
		ding: function () { if (!audio) return; var t = audio.currentTime; tom('sine', 988, t, 0.6, 0.12); tom('sine', 784, t + 0.32, 0.9, 0.12); },
		clique: function () { if (!audio) return; tom('square', 1400, audio.currentTime, 0.04, 0.05); },
		// um documento escorregando pela mesa e pousando: o passaporte (capa de couro, pousa com um "tup"
		// grave), a carteirinha (plástico, um "tic" seco) ou uma folha (leve, com estalinhos)
		papel: function (tipo) {
			if (!audio) return;
			var t = audio.currentTime + 0.02, pousa = t + 0.78;
			if (tipo === 'livro') {
				ruidoEnv(t, [[0.12, 0.05], [0.6, 0.06], [0.78, 0]], 700, 0.6, 'bandpass', 450); // o couro arrastando
				ruidoEnv(pousa, [[0.004, 0.22], [0.09, 0]], 260, 0.7, 'lowpass');
				tom('sine', 105, pousa, 0.12, 0.12, 70); crepitar(pousa + 0.02, 0.06, 1, 0.02);
			} else if (tipo === 'cartao') {
				ruidoEnv(t, [[0.1, 0.03], [0.6, 0.035], [0.76, 0]], 2600, 0.8, 'bandpass', 1800); // o plástico deslizando, mais fino
				ruidoEnv(pousa, [[0.002, 0.12], [0.025, 0]], 3800, 1.2, 'highpass');
				tom('triangle', 1650, pousa, 0.03, 0.03); tom('sine', 320, pousa, 0.05, 0.05, 220);
			} else {
				ruidoEnv(t, [[0.08, 0.04], [0.55, 0.035], [0.75, 0]], 1500, 0.6, 'bandpass', 900);
				crepitar(t, 0.7, 0.5, 0.025);
				ruidoEnv(pousa, [[0.004, 0.08], [0.06, 0]], 600, 0.7, 'lowpass');
			}
		},
		// o passaporte abrindo ou fechando: o ar da página virando, os estalinhos do papel e a capa batendo
		folha: function () {
			if (!audio) return;
			var t = audio.currentTime + 0.02;
			ruidoEnv(t, [[0.1, 0.05], [0.28, 0.08], [0.42, 0]], 700, 0.6, 'bandpass', 2600);
			crepitar(t + 0.04, 0.34, 1.2, 0.03);
			ruidoEnv(t + 0.4, [[0.004, 0.16], [0.07, 0]], 380, 0.7, 'lowpass'); tom('sine', 120, t + 0.4, 0.1, 0.07, 80);
		},
		// o carimbo de borracha: o baque abafado na mesa, a madeira do cabo e o "tchc" da tinta grudando
		tum: function () {
			if (!audio) return;
			var t = audio.currentTime;
			tom('sine', 110, t, 0.16, 0.38, 55); ruidoEnv(t, [[0.003, 0.32], [0.06, 0]], 500, 0.7, 'lowpass');
			tom('triangle', 240, t, 0.05, 0.07, 190);
			ruidoEnv(t + 0.03, [[0.02, 0.035], [0.14, 0]], 1900, 1.8, 'bandpass', 900);
		},
		aprovado: function () { if (!audio) return; var t = audio.currentTime; tom('sine', 1320, t, 0.5, 0.06); tom('sine', 1760, t + 0.1, 0.6, 0.05); },
		// os documentos puxados da mesa de uma vez: o ar, os papéis se esfregando e a mão pegando
		whoosh: function () {
			if (!audio) return;
			var t = audio.currentTime;
			ruidoEnv(t, [[0.14, 0.1], [0.36, 0.05], [0.55, 0]], 500, 0.7, 'bandpass', 2200);
			crepitar(t + 0.05, 0.4, 1, 0.03);
			ruidoEnv(t + 0.5, [[0.005, 0.1], [0.08, 0]], 320, 0.7, 'lowpass');
		},
		// a fanfarra de metais quando a Millennium Falcon aparece (no clima épico de Star Wars, mas nossa):
		// rufar de tímpanos, um acorde de Si bemol que cresce, um de Mi bemol, e o Si bemol final bem alto
		fanfarra: function () {
			if (!audio) return;
			var t = audio.currentTime + 0.05, destino = audio.createGain(); destino.gain.value = 0.9; destino.connect(mestre); destino.connect(eco());
			function metal(notas, t0, dur, vol) {
				notas.forEach(function (n) {
					[-6, 5].forEach(function (det) {
						var o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
						o.type = 'sawtooth'; o.frequency.value = nota(n); o.detune.value = det;
						f.type = 'lowpass'; f.Q.value = 1.5; f.frequency.setValueAtTime(350, t0); f.frequency.exponentialRampToValueAtTime(2600, t0 + 0.35); f.frequency.exponentialRampToValueAtTime(1500, t0 + dur);
						g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.12); g.gain.setValueAtTime(vol, t0 + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur + 0.4);
						o.connect(f); f.connect(g); g.connect(destino); o.start(t0); o.stop(t0 + dur + 0.5);
					});
				});
			}
			function timpano(t0, vol) { tom('sine', 72, t0, 0.6, vol, 52); chiado(t0, 0.15, vol * 0.5, 180, 1); }
			for (var r = 0; r < 10; r++) timpano(t + r * 0.07, 0.05 + r * 0.02); // o rufar
			metal([46, 53, 58, 62, 65], t + 0.7, 1.1, 0.03); timpano(t + 0.7, 0.35);
			metal([51, 55, 58, 63, 67], t + 1.85, 0.5, 0.03); timpano(t + 1.85, 0.25);
			metal([46, 53, 58, 62, 65, 70], t + 2.4, 2.4, 0.034); timpano(t + 2.4, 0.4);
			chiado(t + 2.4, 3.2, 0.12, 7000, 0.4, 4000); // o prato
		},
		// a impressorinha térmica do totem soltando o papel da senha
		impressora: function () { if (!audio) return; var t = audio.currentTime; for (var i = 0; i < 10; i++) tom('square', i % 2 ? 1900 : 2400, t + i * 0.055, 0.04, 0.025); chiado(t, 0.6, 0.06, 3200, 2); tom('sine', 1568, t + 0.65, 0.2, 0.05); },
		// a porta de vidro automática da fachada e o "plim-plom" de boas-vindas
		portaVidro: function () { if (!audio) return; var t = audio.currentTime; chiado(t, 0.6, 0.12, 900, 0.8, 400); tom('sine', 784, t + 0.15, 0.5, 0.07); tom('sine', 1047, t + 0.4, 0.7, 0.07); },
		// passos no piso (quatro batidinhas abafadas)
		passos: function () { if (!audio) return; var t = audio.currentTime; for (var i = 0; i < 4; i++) { tom('sine', 110 + (i % 2) * 15, t + i * 0.32, 0.08, 0.12, 60); chiado(t + i * 0.32, 0.05, 0.08, 1800, 1.5); } },
		// a cadeira rangendo ao sentar
		cadeira: function () { if (!audio) return; var t = audio.currentTime; tom('sawtooth', 180, t, 0.25, 0.03, 120); chiado(t, 0.3, 0.07, 700, 6, 500); tom('sine', 90, t + 0.05, 0.2, 0.1, 50); },
		// a caneta riscando o papel (a cada letra digitada) e o floreio no fim da assinatura
		// a ponta da caneta no papel: um risco curto e irregular (sobe e desce como a mão), com o atrito grave por baixo
		rabisco: function () {
			if (!audio) return;
			var t = audio.currentTime, d = 0.07 + Math.random() * 0.06, v = 0.04 + Math.random() * 0.03;
			ruidoEnv(t, [[0.012, v], [d * 0.45, v * 0.5], [d * 0.7, v * 0.9], [d, 0]], 3000 + Math.random() * 1800, 2.2, 'bandpass', 2200 + Math.random() * 2600);
			ruidoEnv(t, [[0.015, 0.02], [d, 0]], 900, 0.7, 'lowpass');
		},
		// o floreio do fim da assinatura: um traço longo e rápido, e o pinguinho do ponto
		floreio: function () {
			if (!audio) return;
			var t = audio.currentTime;
			ruidoEnv(t, [[0.04, 0.05], [0.2, 0.07], [0.34, 0.025], [0.4, 0]], 2400, 2, 'bandpass', 4800);
			ruidoEnv(t, [[0.04, 0.02], [0.4, 0]], 900, 0.7, 'lowpass');
			ruidoEnv(t + 0.55, [[0.003, 0.07], [0.03, 0]], 2600, 1.2);
		},
		// o leitor de documentos: bip-bip
		bipLeitor: function () { if (!audio) return; var t = audio.currentTime; tom('square', 1760, t, 0.07, 0.04); tom('square', 2350, t + 0.1, 0.09, 0.04); },
		// o robô digitando no teclado dele
		digitar: function () { if (!audio) return; var t = audio.currentTime, n = 4 + Math.floor(Math.random() * 6); for (var i = 0; i < n; i++) { chiado(t + i * (0.06 + Math.random() * 0.05), 0.025, 0.1, 3200 + Math.random() * 1500, 4); } },
		// o alto-falante da recepção chamando a próxima senha (um balbucio abafado, com eco)
		anuncio: function () {
			if (!audio || !somLigado) return;
			var t = audio.currentTime + 0.9, filtro = audio.createBiquadFilter(), eco = audio.createDelay(), ganhoEco = audio.createGain();
			filtro.type = 'bandpass'; filtro.frequency.value = 1300; filtro.Q.value = 1.2; eco.delayTime.value = 0.12; ganhoEco.gain.value = 0.35;
			filtro.connect(mestre); filtro.connect(eco); eco.connect(ganhoEco); ganhoEco.connect(mestre);
			for (var i = 0; i < 16; i++) {
				var o = audio.createOscillator(), g = audio.createGain(), tt = t + i * 0.11 + (i > 7 ? 0.25 : 0);
				o.type = 'square'; o.frequency.value = 260 * (0.85 + Math.random() * 0.35);
				g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.05, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.08);
				o.connect(g); g.connect(filtro); o.start(tt); o.stop(tt + 0.1);
			}
		},
		// a cabine ligando: o zumbido subindo e os bipes dos painéis acendendo em cascata
		ligar: function () {
			if (!audio) return;
			var t = audio.currentTime;
			tom('sine', 80, t, 1.8, 0.12, 220); tom('triangle', 160, t + 0.2, 1.6, 0.03, 660);
			for (var i = 0; i < 14; i++) tom('square', 900 + (i % 5) * 220 + Math.random() * 80, t + 0.3 + i * 0.12, 0.05, 0.018);
			tom('sine', 1320, t + 2.1, 0.3, 0.05); tom('sine', 1760, t + 2.25, 0.5, 0.05);
		},
		// o rádio abrindo: chiado de estática e o bipe de quem vai falar
		radio: function () { if (!audio) return; var t = audio.currentTime; chiado(t, 0.22, 0.12, 2400, 0.8, 1200); tom('sine', 1250, t + 0.2, 0.12, 0.05); },
		// os bipes da contagem regressiva (o último é mais alto e mais longo)
		contagem: function (ultimo) { if (!audio) return; var t = audio.currentTime; tom('square', ultimo ? 1760 : 880, t, ultimo ? 0.6 : 0.16, 0.05); },
		// os motores da decolagem: um ronco que vai crescendo e subindo de tom
		motor: function () {
			if (!audio) return;
			var t = audio.currentTime;
			ruidoEnv(t, [[1.5, 0.12], [4, 0.3], [6.2, 0.34], [7, 0]], 120, 0.7, 'lowpass', 900);
			ruidoEnv(t, [[2, 0.02], [5, 0.08], [6.5, 0.1], [7, 0]], 2400, 0.6, 'bandpass', 5200);
			tom('sawtooth', 48, t, 6.8, 0.07, 150); tom('sine', 36, t, 6.8, 0.2, 90);
		},
		// a porta da nave: a trava pesada soltando, o estouro da pressão escapando de uma vez (largo e
		// grave por baixo, chiado forte por cima), o painel deslizando e o vapor chiando até morrer
		porta: function () {
			if (!audio) return;
			var t = audio.currentTime + 0.02;
			tom('sine', 70, t, 0.25, 0.4, 40); ruidoEnv(t, [[0.004, 0.35], [0.08, 0]], 400, 0.7, 'lowpass'); tom('square', 180, t, 0.05, 0.05, 120); // a trava
			ruidoEnv(t + 0.12, [[0.02, 0.5], [0.35, 0.42], [0.9, 0.12], [1.3, 0]], 3800, 0.5, 'bandpass', 1800); // o estouro da pressão
			ruidoEnv(t + 0.12, [[0.02, 0.4], [0.5, 0.15], [1, 0]], 160, 0.8, 'lowpass', 90); // o "bafo" grave do ar saindo
			tom('sawtooth', 60, t + 0.5, 1.1, 0.04, 45); ruidoEnv(t + 0.5, [[0.2, 0.05], [1, 0.04], [1.2, 0]], 700, 1.5, 'bandpass', 500); // o painel deslizando
			ruidoEnv(t + 0.9, [[0.3, 0.16], [1.5, 0.1], [3, 0]], 6000, 0.6, 'highpass', 3500); // o vapor chiando até sumir
			ruidoEnv(t + 1, [[0.4, 0.06], [2.6, 0]], 1400, 0.5, 'bandpass', 800);
			tom('sine', 660, t + 1.6, 0.5, 0.06); tom('sine', 990, t + 1.75, 0.6, 0.06); // o bipe de porta aberta
		}
	};
	// o som de fundo de cada lugar: a recepção (gente balbuciando, teclados, bipes de senha,
	// ar-condicionado), o hangar (vento, motores ao longe, ferramentas) e dentro da nave (zumbidos)
	function ligarAmbiente(tipo) {
		if (!audio) return;
		if (MUSICA_DE[tipo]) tocarMusica(MUSICA_DE[tipo]);
		if (ambiente && ambiente.tipo === tipo) return;
		if (ambiente) { ambiente.parar(); ambiente = null; }
		var bus = audio.createGain(), timers = [], fontes = [];
		bus.gain.value = 0; bus.gain.setTargetAtTime(1, audio.currentTime, 0.5); bus.connect(mestre);
		function zumbido(f, vol, onda) { var o = audio.createOscillator(), g = audio.createGain(); o.type = onda || 'sine'; o.frequency.value = f; g.gain.value = vol; o.connect(g); g.connect(bus); o.start(); fontes.push(o); }
		function repetir(fn, min, max) { (function vez() { fn(); timers.push(setTimeout(vez, (min + Math.random() * (max - min)) * 1000)); })(); }
		if (tipo === 'recepcao' || tipo === 'mesa') {
			var vozes = audio.createGain(), filtro = audio.createBiquadFilter();
			vozes.gain.value = tipo === 'mesa' ? 0.18 : 0.35; filtro.type = 'lowpass'; filtro.frequency.value = 1500; vozes.connect(filtro); filtro.connect(bus);
			[180, 230, 300, 140, 260].forEach(function (base, i) {
				var saida = vozes;
				if (audio.createStereoPanner) { saida = audio.createStereoPanner(); saida.pan.value = -0.8 + i * 0.4; saida.connect(vozes); }
				(function frase() {
					var n = 4 + Math.floor(Math.random() * 10), t = audio.currentTime + 0.05;
					for (var k = 0; k < n; k++) {
						var o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
						o.type = 'triangle'; o.frequency.value = base * (0.8 + Math.random() * 0.5);
						f.type = 'bandpass'; f.frequency.value = 600 + Math.random() * 900; f.Q.value = 2;
						g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.05, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
						o.connect(f); f.connect(g); g.connect(saida); o.start(t); o.stop(t + 0.1);
						t += 0.09 + Math.random() * 0.06;
					}
					timers.push(setTimeout(frase, (n * 0.12 + 0.8 + Math.random() * 2.5) * 1000));
				})();
			});
			zumbido(62, 0.04);
			repetir(function () { var t = audio.currentTime; for (var k = 0; k < 3 + Math.random() * 5; k++) tom('square', 2200 + Math.random() * 600, t + k * 0.09, 0.02, 0.012); }, 2, 5);
			repetir(function () { var t = audio.currentTime; tom('sine', 1320, t, 0.15, 0.025); tom('sine', 1760, t + 0.12, 0.2, 0.02); }, 7, 12);
		} else if (tipo === 'rua') {
			var chuva = chiado(audio.currentTime, 40, 0.09, 5200, 0.6, null, bus); var chuva2 = chiado(audio.currentTime, 40, 0.06, 900, 0.5, null, bus);
			zumbido(41, 0.05); zumbido(82, 0.012, 'triangle'); // o zumbido da cidade
			repetir(function () { var t = audio.currentTime; chiado(t, 1.6, 0.08, 400, 1, 2400, bus); }, 3, 7); // um carro voador passando
			repetir(function () { var t = audio.currentTime; for (var k = 0; k < 3; k++) { var o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(700, t + k * 0.9); o.frequency.linearRampToValueAtTime(980, t + k * 0.9 + 0.45); o.frequency.linearRampToValueAtTime(700, t + k * 0.9 + 0.9); g.gain.value = 0.008; o.connect(g); g.connect(bus); o.start(t + k * 0.9); o.stop(t + k * 0.9 + 0.9); } }, 14, 24); // uma sirene ao longe
			repetir(function () { var t = audio.currentTime + 0.5; tom('sine', 48, t, 2.5, 0.12, 30); chiado(t, 2.2, 0.06, 120, 0.7, 60, bus); }, 18, 30); // trovão
			// o "longe" da cidade: tudo o que vem dos prédios passa por um filtro abafado e ecoa entre eles
			var longe = audio.createBiquadFilter(), ecoRua = audio.createDelay(), voltaEco = audio.createGain();
			longe.type = 'lowpass'; longe.frequency.value = 1500; ecoRua.delayTime.value = 0.23; voltaEco.gain.value = 0.38;
			longe.connect(bus); longe.connect(ecoRua); ecoRua.connect(voltaEco); voltaEco.connect(ecoRua); voltaEco.connect(bus);
			function noLonge(vol) {
				var g = audio.createGain(); g.gain.value = vol;
				if (audio.createStereoPanner) { var p = audio.createStereoPanner(); p.pan.value = Math.random() * 1.6 - 0.8; g.connect(p); p.connect(longe); } else g.connect(longe);
				return g;
			}
			function nota1(dest, tp, f, t0, dur, vol) { var o = audio.createOscillator(), g = audio.createGain(); o.type = tp; o.frequency.value = f; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(dest); o.start(t0); o.stop(t0 + dur + 0.05); }
			// uma propaganda falando de um telão: o "plim-plim-plom" e uma voz animada, abafada e com eco
			repetir(function () {
				var d = noLonge(0.9), t = audio.currentTime + 0.1, base = 280 + Math.random() * 120;
				[0, 4, 7, 12].forEach(function (s, i) { nota1(d, 'sine', 523 * Math.pow(2, s / 12), t + i * 0.13, 0.5, 0.05); });
				var n = 14 + Math.floor(Math.random() * 10), tt = t + 0.7;
				for (var k = 0; k < n; k++) {
					var o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain(), dur = 0.07 + Math.random() * 0.06;
					o.type = 'square'; o.frequency.value = base * (0.9 + Math.random() * 0.35 + (k % 5 === 4 ? 0.25 : 0));
					f.type = 'bandpass'; f.frequency.value = 700 + Math.random() * 1100; f.Q.value = 2.5;
					g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.06, tt + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, tt + dur);
					o.connect(f); f.connect(g); g.connect(d); o.start(tt); o.stop(tt + dur + 0.02);
					tt += dur + (k % 6 === 5 ? 0.22 : 0.02);
				}
			}, 7, 13);
			// o jingle do telão da gueixa: uma frase de koto na escala japonesa, bem longe
			repetir(function () {
				var d = noLonge(0.8), t = audio.currentTime + 0.1, ESC = [0, 2, 3, 7, 8, 12, 14], frase = [0, 2, 4, 3, 1, 2, 0];
				frase.forEach(function (i, k) { nota1(d, 'triangle', 392 * Math.pow(2, ESC[i] / 12), t + k * 0.22, 0.9, 0.06); nota1(d, 'sine', 784 * Math.pow(2, ESC[i] / 12), t + k * 0.22, 0.3, 0.015); });
			}, 18, 28);
			// buzinas de carros voadores presos no trânsito lá em cima
			repetir(function () { var d = noLonge(0.7), t = audio.currentTime; nota1(d, 'square', 330, t, 0.25, 0.03); nota1(d, 'square', 415, t, 0.25, 0.02); if (Math.random() < 0.5) { nota1(d, 'square', 330, t + 0.35, 0.4, 0.03); nota1(d, 'square', 415, t + 0.35, 0.4, 0.02); } }, 9, 17);
			// o sininho de vento da barraca de lámen, balançando com a chuva
			repetir(function () { var t = audio.currentTime; [2093, 2637, 3136].forEach(function (f, i) { if (Math.random() < 0.7) nota1(bus, 'sine', f, t + i * 0.12 + Math.random() * 0.05, 1.6, 0.012); }); }, 11, 19);
			// e o zumbido elétrico dos letreiros de neon
			zumbido(120, 0.0035, 'sawtooth'); zumbido(240, 0.0015, 'square');
		} else if (tipo === 'hangar') {
			chiado(audio.currentTime, 30, 0.05, 220, 0.4, null, bus);
			zumbido(48, 0.06); zumbido(96, 0.015, 'triangle');
			repetir(function () { var t = audio.currentTime; for (var k = 0; k < 4; k++) chiado(t + k * 0.11, 0.06, 0.06, 3500, 4, null, bus); }, 3, 6);
			repetir(function () { var t = audio.currentTime; tom('sine', 523, t, 0.4, 0.02); tom('sine', 659, t + 0.25, 0.5, 0.02); }, 6, 10);
		} else if (tipo === 'cabine') {
			zumbido(55, 0.08); zumbido(110, 0.025, 'triangle'); zumbido(165, 0.008);
			repetir(function () { var t = audio.currentTime; tom('sine', 1568 + Math.random() * 400, t, 0.06, 0.012); }, 0.8, 2);
		} else if (tipo === 'nave') {
			zumbido(55, 0.07); zumbido(110, 0.02, 'triangle'); zumbido(331, 0.006);
			repetir(function () { tom('sine', 1980, audio.currentTime, 0.05, 0.015); }, 1.5, 3);
		}
		ambiente = { tipo: tipo, parar: function () {
			timers.forEach(clearTimeout); bus.gain.setTargetAtTime(0, audio.currentTime, 0.3);
			setTimeout(function () { fontes.forEach(function (o) { try { o.stop(); } catch (e) {} }); bus.disconnect(); }, 1500);
		} };
	}
	function desligarAmbiente() { if (ambiente) { ambiente.parar(); ambiente = null; } pararMusica(); }

	// ---------- A trilha sonora (sintetizador, no clima de Blade Runner) ----------
	// rua e agência: acordes longos e macios com eco (Lá menor, Fá, Dó, Sol); hangar: a fanfarra quando a
	// nave aparece e depois um arpejo animado; decolagem: um arpejo que vai subindo e crescendo
	var musica = null, ecoBus = null;
	function eco() {
		if (ecoBus) return ecoBus;
		var conv = audio.createConvolver(), n = audio.sampleRate * 3, imp = audio.createBuffer(2, n, audio.sampleRate);
		for (var ch = 0; ch < 2; ch++) { var d = imp.getChannelData(ch); for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
		conv.buffer = imp; var g = audio.createGain(); g.gain.value = 0.55; conv.connect(g); g.connect(mestre);
		return (ecoBus = conv);
	}
	function nota(n) { return 440 * Math.pow(2, (n - 69) / 12); } // número MIDI para frequência
	function pad(notas, t0, dur, vol, destino) {
		notas.forEach(function (n) {
			[-7, 0, 7].forEach(function (det) {
				var o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
				o.type = 'sawtooth'; o.frequency.value = nota(n); o.detune.value = det;
				f.type = 'lowpass'; f.frequency.setValueAtTime(500, t0); f.frequency.linearRampToValueAtTime(1100, t0 + dur * 0.5); f.frequency.linearRampToValueAtTime(600, t0 + dur); f.Q.value = 2;
				g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + Math.min(1.6, dur * 0.4)); g.gain.setValueAtTime(vol, t0 + dur * 0.75); g.gain.linearRampToValueAtTime(0.0001, t0 + dur + 0.6);
				o.connect(f); f.connect(g); g.connect(destino); g.connect(eco()); o.start(t0); o.stop(t0 + dur + 0.7);
			});
		});
	}
	function sino(n, t0, vol, destino) { var o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = nota(n); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.2); o.connect(g); g.connect(destino); g.connect(eco()); o.start(t0); o.stop(t0 + 2.3); }
	function arpejo(n, t0, dur, vol, destino, tipoOnda) { var o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain(); o.type = tipoOnda || 'square'; o.frequency.value = nota(n); f.type = 'lowpass'; f.frequency.value = 2200; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(f); f.connect(g); g.connect(destino); g.connect(eco()); o.start(t0); o.stop(t0 + dur + 0.05); }
	function tocarMusica(tipo) {
		if (!audio || (musica && musica.tipo === tipo)) return;
		pararMusica();
		var bus = audio.createGain(), timers = [], compasso = 0;
		bus.gain.value = 0; bus.gain.setTargetAtTime(tipo === 'agencia' ? 0.6 : 1, audio.currentTime, 1.2); bus.connect(mestre);
		var ACORDES = [[57, 60, 64], [53, 57, 60], [48, 55, 64], [55, 59, 62]]; // Lá menor, Fá, Dó, Sol
		(function proximo() {
			if (tipo === 'hangar' && compasso === 0) { compasso++; timers.push(setTimeout(proximo, 4600)); return; } // (espera a fanfarra terminar)
			var t = audio.currentTime + 0.05, ac = ACORDES[compasso % 4];
			if (tipo === 'rua' || tipo === 'agencia') {
				pad(ac, t, 4.2, 0.018, bus); pad([ac[0] - 24], t, 4.2, 0.03, bus); // o acorde e o baixo bem grave
				if (compasso % 2 === 0) [0, 1, 2].forEach(function (k) { if (Math.random() < 0.6) sino(ac[k] + 24, t + 0.6 + k * 1.1, 0.03, bus); }); // gotinhas de sino
				timers.push(setTimeout(proximo, 4000));
			} else if (tipo === 'hangar') {
				var MAIOR = [[46, 53, 58, 62], [51, 55, 58, 63], [44, 51, 56, 60], [46, 53, 58, 65]]; // Si bemol, Mi bemol, Lá bemol, Si bemol
				var a2 = MAIOR[compasso % 4]; pad(a2.slice(1), t, 2.6, 0.014, bus); pad([a2[0] - 12], t, 2.6, 0.03, bus);
				for (var i = 0; i < 16; i++) arpejo(a2[i % 4] + 12 + (i % 8 > 3 ? 12 : 0), t + i * 0.15, 0.14, 0.022, bus); // o arpejo em semicolcheias
				timers.push(setTimeout(proximo, 2400));
			} else if (tipo === 'decolagem') {
				var sobe = Math.min(compasso, 6), base = 50 + sobe; // cada compasso um pouco mais alto, mais rápido, mais forte
				pad([base, base + 4, base + 7, base + 12], t, 2, 0.016 + sobe * 0.002, bus); pad([base - 24], t, 2, 0.035, bus);
				for (var j = 0; j < 16 + sobe * 2; j++) arpejo(base + [0, 7, 12, 16, 19, 24][j % 6], t + j * (0.12 - sobe * 0.008), 0.1, 0.02 + sobe * 0.002, bus, 'sawtooth');
				timers.push(setTimeout(proximo, 2000));
			}
			compasso++;
		})();
		musica = { tipo: tipo, parar: function () { timers.forEach(clearTimeout); bus.gain.setTargetAtTime(0, audio.currentTime, 0.6); setTimeout(function () { bus.disconnect(); }, 3500); } };
	}
	function pararMusica() { if (musica) { musica.parar(); musica = null; } }
	var MUSICA_DE = { rua: 'rua', recepcao: 'agencia', mesa: 'agencia', hangar: 'hangar', nave: 'hangar' }; // (a música da decolagem entra com a contagem, na cabine)

	// ---------- Camada de cima: balões, dicas e botões (posições em pixels do miolo 480 x 270) ----------
	function pos(el, x, y, w) {
		el.dataset.x = x; el.dataset.y = y; if (w) el.dataset.w = w;
		el.style.left = ((x + OX) / W * 100) + '%'; el.style.top = (y / H * 100) + '%'; if (w) el.style.width = (w / W * 100) + '%';
	}
	function reposicionar() { [].forEach.call(camada.children, function (el) { if (el.dataset.x) pos(el, +el.dataset.x, +el.dataset.y, el.dataset.w ? +el.dataset.w : 0); }); }
	function limpar() { camada.innerHTML = ''; }
	// o balão de fala do atendente, pequeno, no canto de cima à direita: cada letra faz um blip
	function falar(frase, voz, quem) {
		var b = document.createElement('div');
		b.className = 'emb-balao';
		pos(b, 476, 26); // (no cantinho, abaixo dos botões de som e pular)
		b.innerHTML = '<span class="emb-balao-quem">' + (quem || 'ZÖ-11') + '</span><span class="emb-balao-texto"></span>';
		camada.appendChild(b);
		var alvo = b.lastChild, i = 0;
		falando = true;
		return new Promise(function (pronto) {
			(function letra() {
				if (!b.isConnected) return; // a cena mudou: a conversa acaba aqui
				if (i >= frase.length) { falando = false; return pronto(b); }
				var ch = frase[i++];
				alvo.textContent += ch;
				if (/[\wÀ-ú]/.test(ch) && i % 2) blip(voz || 440);
				setTimeout(letra, calmo ? 0 : /[,.!?…]/.test(ch) ? 170 : 45);
			})();
		});
	}
	function legenda(txt, x, y) { var l = document.createElement('div'); l.className = 'emb-legenda'; pos(l, x, y); l.innerHTML = txt; camada.appendChild(l); return l; }
	function alvoClicavel(x, y, w, h, rotulo, aoClicar) {
		var b = document.createElement('button');
		b.type = 'button'; b.className = 'emb-alvo'; b.setAttribute('aria-label', rotulo);
		pos(b, x, y, w); b.style.height = (h / H * 100) + '%';
		b.addEventListener('click', function () { SONS.clique(); aoClicar(); });
		camada.appendChild(b);
		return b;
	}
	function botao(txt, x, y, aoClicar, classe) {
		var b = document.createElement('button');
		b.type = 'button'; b.className = 'emb-botao' + (classe ? ' ' + classe : ''); b.innerHTML = txt;
		pos(b, x, y);
		b.addEventListener('click', function () { SONS.clique(); aoClicar(); });
		camada.appendChild(b);
		return b;
	}

	// o primeiro nome do piloto, para o ZÖ-11 chamar pelo nome
	function primeiroNome() { var n = (nomePiloto || '').trim().split(/\s+/)[0]; return n ? n.charAt(0).toUpperCase() + n.slice(1) : T('piloto', 'pilot'); }
	// o título de capítulo que aparece num canto no começo de cada parte, como num filme
	var capEl = document.createElement('div'); capEl.className = 'emb-capitulo'; palco.appendChild(capEl);
	function capitulo(numero, nome) {
		capEl.innerHTML = '<b>' + numero + '</b><span></span>'; capEl.lastChild.textContent = nome;
		capEl.classList.remove('mostra'); void capEl.offsetWidth; capEl.classList.add('mostra');
	}

	// ---------- Cenas e câmera ----------
	var cena = null, inicioCena = 0, geracao = 0, falando = false;
	// o escurecer entre as cenas (uma transição de CSS, que não depende de quantos quadros o navegador desenha)
	function escurecer(v) { escuro.style.opacity = v; }
	// as faixas pretas de cinema (em cima e embaixo): a altura anda até o alvo (em % do palco) no tempo pedido
	var faixas = ['cima', 'baixo'].map(function (lado) { var f = document.createElement('div'); f.className = 'emb-faixa ' + lado; palco.appendChild(f); return f; });
	var faixaAlt = 0, faixaAnim = 0, faixaAlvo = 0;
	function moverFaixas(alvo, dur) {
		faixaAlvo = alvo;
		var de = faixaAlt, t0 = performance.now(), id = ++faixaAnim;
		(function passo() {
			if (id !== faixaAnim) return;
			var u = dur > 0 ? Math.min(1, (performance.now() - t0) / (dur * 1000)) : 1;
			u = 0.5 - Math.cos(u * Math.PI) / 2; /* suave e quase constante, sem acelerar de repente no meio */
			faixaAlt = de + (alvo - de) * u;
			faixas.forEach(function (f) { f.style.height = faixaAlt + '%'; });
			if (u < 1) requestAnimationFrame(passo);
		})();
	}
	function depois(fn, ms) { var g = geracao; return setTimeout(function () { if (g === geracao) fn(); }, ms); }
	function prepararFundo(c) { if (c.fundo && !c.pronto) { c.fundoPronto = c.fundo(); c.pronto = true; } }
	function refazerFundos() { Object.keys(CENAS).forEach(function (n) { CENAS[n].pronto = false; }); mesaFundo = null; if (cena) prepararFundo(cena); }
	function irPara(nome) {
		geracao++;
		var nova = CENAS[nome], deMesaParaMesa = cena && cena.mesa && nova.mesa;
		escuro.style.transition = ''; /* (a apresentação da rua usa um escurecer mais lento) */
		falando = false;
		if (!deMesaParaMesa) escurecer(1);
		limpar();
		depois(function () {
			cena = nova; cena.nome = nome;
			prepararFundo(cena);
			mundo.hidden = !cena.mesa;
			tela.style.transform = ''; tela.style.transformOrigin = ''; raiz.classList.remove('cinema'); moverFaixas(0, 0);
			tela.classList.toggle('aproxima', nome === 'hangar');
			inicioCena = performance.now();
			escurecer(0);
			if (cena.entrar) cena.entrar();
		}, deMesaParaMesa || calmo ? 0 : 420);
	}
	// a câmera da mesa: olha para o ponto (x, y) do miolo do mundo (1920 x 1080) com zoom z
	var cam = { x: 960, y: 540, z: 1 };
	function apontar(x, y, z, dur) {
		cam = { x: x, y: y, z: z };
		camera.style.transition = calmo || dur === 0 ? 'none' : 'transform ' + (dur || 1.3) + 's cubic-bezier(0.5, 0.05, 0.25, 1)';
		ajustarCamera();
	}
	function ajustarCamera() {
		var k = palco.clientWidth / (W * 4);
		camera.style.transform = 'scale(' + k + ') translate(' + (W * 2 - (cam.x + OX * 4) * cam.z) + 'px, ' + (H * 2 - cam.y * cam.z) + 'px) scale(' + cam.z + ')';
	}
	window.addEventListener('resize', function () {
		var antes = W; medir(); ajustarPalco();
		if (W !== antes) refazerFundos();
		reposicionar();
		var t = camera.style.transition; camera.style.transition = 'none'; ajustarCamera(); void camera.offsetWidth; camera.style.transition = t;
	});

	// ---------- Os documentos de verdade, em cima da mesa ----------
	var docs = null, nomePiloto = '';
	try { nomePiloto = (JSON.parse(localStorage.getItem('passaporteEspacial')) || {}).nome || ''; } catch (e) {}
	var PP_ESC = 0.78, CNH_ESC = 0.66;
	// onde cada um fica na mesa (centro no mundo do miolo, giro em graus): o mesmo nas cenas 3 e 7
	var LUGAR = { pp: { x: 740, y: 670, giro: -14 }, ppAberto: { x: 900, y: 600, giro: 0 }, cnh: { x: 1170, y: 720, giro: 5 },
		bilheteSaida: { x: 960, y: 470, giro: 0 }, bilhete: { x: 1290, y: 950, giro: 4 } };
	var BIL_ESC = 0.6;
	// o carimbador mora em pé ao lado da latinha de tinta: o mesmo lugar dele na mesa de frente
	var CARIMBADOR_CASA = null; // (calculado quando os documentos chegam: o lugar do carimbo na mesa 3D)
	function montarDocumentos() {
		if (docs || !window.Passaporte || !window.Passaporte.documentosDaMesa) return;
		var m = window.Passaporte.documentosDaMesa();
		var pp = document.createElement('div'); pp.className = 'emb-doc emb-pp'; pp.appendChild(m.livro);
		var cnh = document.createElement('div'); cnh.className = 'emb-doc emb-cnh'; cnh.appendChild(m.carteira);
		nucleo.appendChild(cnh); nucleo.appendChild(pp);
		var carimbador = document.createElement('canvas'); carimbador.className = 'emb-carimbador'; carimbador.width = 40; carimbador.height = 48;
		desenharCarimbador(carimbador.getContext('2d'));
		nucleo.appendChild(carimbador);
		var holo = m.carteira.querySelector('.holograma');
		if (holo) holo.classList.add('desligada');
		docs = { pp: pp, livro: m.livro, dados: m.dados, cnh: cnh, holo: holo, carimbador: carimbador,
			assinatura: m.dados.querySelector('.pp-assinatura-nome'), campoNome: m.dados.querySelector('input'),
			cnhNome: m.carteira.querySelector('.cnh-nome'), cnhAssinatura: m.carteira.querySelector('.cnh-assinatura-nome') };
		// o passaporte chega sem assinatura e sem carimbo de embarque: os dois acontecem aqui na mesa
		escreverNome('');
		var antigo = m.dados.querySelector('.pp-embarque'); if (antigo) antigo.remove();
		pousar(docs.pp, LUGAR.pp, PP_ESC, 860, 602, 0); pousar(docs.cnh, LUGAR.cnh, CNH_ESC, 600, 400, 0);
		CARIMBADOR_CASA = casaDoCarimbador();
		pousarCarimbador(0);
	}
	// o cartão de embarque: sai da impressora do guichê, do lado do ZÖ-11, e escorrega até o piloto
	function imprimirBilhete() {
		if (!docs || docs.bilhete || !window.Passaporte.bilhete) return;
		var d = {}; try { d = JSON.parse(localStorage.getItem('passaporteEspacial')) || {}; } catch (e) {}
		var b = document.createElement('div'); b.className = 'emb-doc emb-bilhete imprimindo';
		b.appendChild(window.Passaporte.bilhete(d));
		nucleo.appendChild(b); docs.bilhete = b;
		pousar(b, LUGAR.bilheteSaida, 0.34, 640, 260, 0);
		SONS.impressora();
		depois(function () { b.classList.remove('imprimindo'); SONS.papel(); pousar(b, LUGAR.bilhete, BIL_ESC, 640, 260, 1); }, 1600);
	}
	function pousar(el, l, esc, w, h, dur) {
		var curva = ' cubic-bezier(0.45, 0.05, 0.25, 1)';
		el.style.width = w + 'px'; el.style.height = h + 'px';
		el.style.transition = dur && !calmo ? 'transform ' + dur + 's' + curva + ', left ' + dur + 's' + curva + ', top ' + dur + 's' + curva : 'none';
		el.style.left = (l.x - w / 2) + 'px'; el.style.top = (l.y - h / 2) + 'px';
		el.style.transform = 'rotate(' + l.giro + 'deg) scale(' + esc + ')';
	}
	function pousarCarimbador(dur, x, y, esc) {
		var c = docs.carimbador;
		c.style.transition = dur && !calmo ? 'transform ' + dur + 's cubic-bezier(0.45, 0.05, 0.3, 1)' : 'none';
		c.style.transform = 'translate(' + ((x || CARIMBADOR_CASA.x) - 80) + 'px, ' + ((y || CARIMBADOR_CASA.y) - 176) + 'px) scale(' + (esc || 1) + ')';
	}
	function escreverNome(s) {
		if (!docs) return;
		docs.assinatura.textContent = s; docs.campoNome.value = s;
		docs.cnhNome.textContent = s || T('Piloto sem nome', 'Unnamed pilot'); docs.cnhAssinatura.textContent = s;
	}

	// ================== As pessoas e os robôs ==================
	// Desenhados em metros (u para a direita, v para cima, a partir do chão) com s pixels por metro,
	// cada um num sprite próprio que depois ganha o contorno escuro e é colado na cena.
	function sprite(larguraM, alturaM, s, desenho) {
		var w = Math.ceil(larguraM * s) + 6, h = Math.ceil(alturaM * s) + 6;
		var p = new Pintura(w, h);
		pintar(p, function () {
			desenho(function (u) { return w / 2 + u * s; }, function (v) { return h - 3 - v * s; }, s);
		});
		return { p: contornar(p, '#1a1622'), ax: w / 2, ay: h - 3 };
	}
	function colarSprite(sp, x, y) { colar(sp.p, x - sp.ax, y - sp.ay); }
	// faixa com sombreado: a luz vem de cima à esquerda
	function lado(cores, t, x, y) { return rampa(cores, t, x, y); }
	// cadeira de escritório preta, vista de costas (encosto, assento, pistão e a estrela com rodinhas)
	function cadeira(X, Y, s, partes) {
		var cores = ['#5a5d68', '#3e414b', '#2c2e36', '#1e1f25'];
		if (partes !== 'encosto') {
			// a estrela de cinco pés com as rodinhas
			poli([[X(-0.3), Y(0.07)], [X(0.3), Y(0.07)], [X(0.06), Y(0.11)], [X(-0.06), Y(0.11)]], '#24252c');
			poli([[X(-0.05), Y(0.11)], [X(0.05), Y(0.11)], [X(0.22), Y(0.03)], [X(0.16), Y(0.03)]], '#2c2e36');
			[-0.3, -0.12, 0.12, 0.3].forEach(function (u) { elip(Math.round(X(u)), Math.round(Y(0.03)), Math.max(1, Math.round(0.03 * s)), Math.max(1, Math.round(0.03 * s)), '#111116'); });
			// o pistão cromado
			ret(X(-0.025), Y(0.44), Math.max(2, 0.05 * s), 0.33 * s, function (x, y) { return lado(['#c8ccd6', '#8a8e98', '#4a4e58'], (x - X(-0.025)) / Math.max(2, 0.05 * s), x, y); });
			// o assento
			poli([[X(-0.25), Y(0.5)], [X(0.25), Y(0.5)], [X(0.23), Y(0.43)], [X(-0.23), Y(0.43)]], function (x, y) { return lado(cores, (x - X(-0.25)) / (0.5 * s) * 0.7 + 0.2, x, y); });
		}
		if (partes !== 'base') {
			// o encosto, com bordas arredondadas, costura no meio e o brilho da luz do teto
			var x0 = X(-0.22), x1 = X(0.22), y0 = Y(0.98), y1 = Y(0.55), r = 0.05 * s;
			ret(x0, y0, x1 - x0, y1 - y0, function (x, y) {
				var dx = Math.max(0, x0 + r - x, x - (x1 - r)), dy = Math.max(0, y0 + r - y, y - (y1 - r));
				if (dx * dx + dy * dy > r * r) return null;
				var t = (x - x0) / (x1 - x0) * 0.6 + (y - y0) / (y1 - y0) * 0.35;
				return lado(cores, t + (ruido(x, y) - 0.5) * 0.08, x, y);
			});
			ret(x0 + r, y0 + 1, (x1 - x0) * 0.45, 1, '#7a7e8a');
			ret(X(-0.003), Y(0.94), 1, 0.32 * s, '#24262c');
			ret(X(-0.03), Y(0.6), 0.06 * s + 1, Math.max(2, 0.05 * s), '#24262c'); // a alça de trás do encosto
			ret(X(-0.02), Y(0.58), 0.04 * s + 1, Math.max(1, 0.02 * s), '#0e0f12');
		}
	}
	// uma pessoa sentada, vista de costas (e a cadeira). p: { pele, cabelo, cabelo2, estilo, roupa, roupa2, calca, sapato, alien, extra }
	function pessoaDeCostas(s, p) {
		return sprite(0.9, 1.65, s, function (X, Y) {
			var pele = p.pele, sombraPele = p.pele2 || '#000000';
			// os pés (lá na frente, debaixo do balcão) e as canelas
			if (p.calca) {
				[-1, 1].forEach(function (lado1) {
					var u = lado1 * 0.11;
					ret(X(u - 0.05), Y(0.44), 0.1 * s, 0.38 * s, function (x, y) { return rampa(p.calca, (x - X(u - 0.05)) / (0.1 * s) * 0.6 + (lado1 > 0 ? 0.3 : 0), x, y); });
					ret(X(u - 0.06), Y(0.07), 0.12 * s, 0.07 * s, p.sapato || '#f2f2f2'); ret(X(u - 0.06), Y(0.02), 0.12 * s, Math.max(1, 0.02 * s), '#8a8e98');
				});
			}
			cadeira(X, Y, s, 'base');
			// o tronco: costas com camiseta/casaco, dobras e sombra do lado direito
			var c = p.roupa;
			poli([[X(-0.21), Y(1.06)], [X(0.21), Y(1.06)], [X(0.18), Y(0.5)], [X(-0.18), Y(0.5)]], function (x, y) {
				var t = (x - X(-0.21)) / (0.42 * s);
				var dobra = Math.sin((x * 0.7 + y * 0.4) * 0.5) > 0.92 ? 0.25 : 0;
				return rampa(c, t * 0.75 + dobra + (ruido(x >> 1, y >> 1) - 0.5) * 0.06, x, y);
			});
			// os ombros arredondados
			elip(Math.round(X(-0.17)), Math.round(Y(1.03)), Math.round(0.07 * s), Math.round(0.05 * s), function (x, y) { return rampa(c, 0.15, x, y); });
			elip(Math.round(X(0.17)), Math.round(Y(1.03)), Math.round(0.07 * s), Math.round(0.05 * s), function (x, y) { return rampa(c, 0.75, x, y); });
			if (p.roupa2) ret(X(-0.06), Y(1.1), 0.12 * s, 0.04 * s, p.roupa2); // a gola
			if (p.extra === 'alca') linha(X(-0.15), Y(1.04), X(0.12), Y(0.62), '#5a3a22'); // alça da bolsa atravessada
			if (p.extra === 'capuz') elip(Math.round(X(0)), Math.round(Y(1.04)), Math.round(0.12 * s), Math.round(0.05 * s), function (x, y) { return rampa(c, 0.5, x, y); });
			// o encosto da cadeira por cima da parte de baixo das costas
			cadeira(X, Y, s, 'encosto');
			// os braços, dos lados do encosto, indo para o balcão
			[-1, 1].forEach(function (l) {
				var u0 = l * 0.2;
				poli([[X(u0 - 0.04), Y(1.0)], [X(u0 + 0.04), Y(1.0)], [X(u0 + l * 0.04 + 0.03), Y(0.74)], [X(u0 + l * 0.04 - 0.03), Y(0.74)]], function (x, y) { return rampa(c, l > 0 ? 0.8 : 0.1, x, y); });
				if (p.mangaCurta) ret(X(u0 + l * 0.04 - 0.03), Y(0.8), 0.06 * s, 0.06 * s, function (x, y) { return rampa([pele, sombraPele], l > 0 ? 0.5 : 0, x, y); });
			});
			// o pescoço, as orelhas e a cabeça
			ret(X(-0.045), Y(1.17), 0.09 * s, 0.09 * s, function (x, y) { return rampa([pele, pele, sombraPele], (x - X(-0.045)) / (0.09 * s) * 0.5 + 0.3, x, y); });
			var cy = Math.round(Y(1.25)), rx = Math.max(2, Math.round(0.095 * s)), ry = Math.max(3, Math.round(0.115 * s));
			if (!p.alien) { elip(Math.round(X(-0.1)), Math.round(Y(1.25)), Math.max(1, Math.round(0.02 * s)), Math.max(1, Math.round(0.03 * s)), pele); elip(Math.round(X(0.1)), Math.round(Y(1.25)), Math.max(1, Math.round(0.02 * s)), Math.max(1, Math.round(0.03 * s)), sombraPele === '#000000' ? pele : sombraPele); }
			elip(Math.round(X(0)), cy, rx, ry, function (x, y, u, v) { return rampa([pele, pele, sombraPele], (u + 1) / 2 * 0.6 + 0.2, x, y); });
			// o cabelo, cobrindo a nuca (vista de trás), com mechas
			var cab = p.cabelo;
			if (p.estilo === 'curto' || p.estilo === 'raspado') {
				elip(Math.round(X(0)), cy - Math.round(0.02 * s), rx, Math.round(ry * 0.9), function (x, y, u, v) {
					if (v > 0.55) return null;
					return rampa(cab, (u + 1) / 2 * 0.5 + (p.estilo === 'raspado' ? 0.1 : 0) + (ruido(x, y >> 1) - 0.5) * 0.3, x, y);
				});
			} else if (p.estilo === 'longo') {
				elip(Math.round(X(0)), cy, rx + 1, ry + 1, function (x, y, u) { return rampa(cab, (u + 1) / 2 * 0.5 + (ruido(x, 7) - 0.5) * 0.35, x, y); });
				poli([[X(-0.11), Y(1.24)], [X(0.11), Y(1.24)], [X(0.13), Y(0.86)], [X(-0.13), Y(0.86)]], function (x, y) { return rampa(cab, (x - X(-0.13)) / (0.26 * s) * 0.55 + (ruido(x, 7) - 0.5) * 0.4 + (y - Y(1.24)) / (0.4 * s) * 0.2, x, y); });
			} else if (p.estilo === 'coque') {
				elip(Math.round(X(0)), cy, rx, ry, function (x, y, u) { return rampa(cab, (u + 1) / 2 * 0.5 + (ruido(x, y) - 0.5) * 0.25, x, y); });
				elip(Math.round(X(0)), Math.round(Y(1.37)), Math.max(2, Math.round(0.05 * s)), Math.max(2, Math.round(0.045 * s)), function (x, y, u) { return rampa(cab, (u + 1) / 2 * 0.6, x, y); });
			} else if (p.estilo === 'cacheado') {
				for (var k = 0; k < 26; k++) { var a = k / 26 * Math.PI * 2, rr = 0.6 + ruido(k, 3) * 0.5; elip(Math.round(X(Math.cos(a) * 0.1 * rr)), Math.round(Y(1.27 + Math.sin(a) * 0.1 * rr)), Math.max(1, Math.round(0.04 * s)), Math.max(1, Math.round(0.04 * s)), cab[k % 2 ? 1 : 0]); }
				elip(Math.round(X(0)), Math.round(Y(1.28)), rx, ry, function (x, y) { return rampa(cab, ruido(x, y) * 0.8, x, y); });
			} else if (p.estilo === 'bone') {
				elip(Math.round(X(0)), cy - Math.round(0.03 * s), rx + 1, Math.round(ry * 0.8), function (x, y, u, v) { return v > 0.3 ? null : rampa(p.bone, (u + 1) / 2 * 0.6, x, y); });
				ret(X(-0.03), Y(1.24), 0.06 * s, 0.02 * s + 1, p.bone[2]);
				elip(Math.round(X(0)), Math.round(Y(1.16)), rx - 1, Math.max(1, Math.round(0.03 * s)), cab[1]);
			}
			if (p.fone) { elip(Math.round(X(0)), Math.round(Y(1.34)), rx + 1, Math.max(1, Math.round(0.03 * s)), '#2a2c34'); elip(Math.round(X(-0.11)), Math.round(Y(1.25)), Math.max(1, Math.round(0.03 * s)), Math.max(2, Math.round(0.045 * s)), '#e84a6a'); elip(Math.round(X(0.11)), Math.round(Y(1.25)), Math.max(1, Math.round(0.03 * s)), Math.max(2, Math.round(0.045 * s)), '#c83a5a'); }
			if (p.alien) { [-1, 1].forEach(function (l) { linha(X(l * 0.05), Y(1.34), X(l * 0.09), Y(1.48), '#4a9a7a'); elip(Math.round(X(l * 0.09)), Math.round(Y(1.5)), Math.max(1, Math.round(0.025 * s)), Math.max(1, Math.round(0.025 * s)), l > 0 ? '#ffd36a' : '#ff8ad8'); }); }
			if (p.androide) { /* a cabeça de metal: a emenda no meio, o anel de luz na nuca e o cabo do pescoço */
				linha(X(0), Y(1.36), X(0), Y(1.15), '#8a90a8'); linha(X(-0.06), Y(1.2), X(0.06), Y(1.2), '#7fe3ff');
				elip(Math.round(X(-0.05)), Math.round(Y(1.32)), Math.max(1, Math.round(0.02 * s)), Math.max(1, Math.round(0.02 * s)), '#ffffff');
				ret(X(-0.015), Y(1.17), Math.max(1, 0.03 * s), 0.06 * s, '#3a3d48'); px(X(0), Y(1.13), '#7dffa8');
			}
			if (p.chifres) [-1, 1].forEach(function (l) { linha(X(l * 0.06), Y(1.34), X(l * 0.1), Y(1.44), '#f2e8d8'); linha(X(l * 0.07), Y(1.34), X(l * 0.11), Y(1.43), '#d8ccb4'); });
			if (p.extra === 'bengala') { linha(X(0.32), Y(0.02), X(0.25), Y(0.82), '#6a4a2a'); linha(X(0.25), Y(0.82), X(0.2), Y(0.82), '#6a4a2a'); }
		});
	}
	// um robô atendente sentado atrás do balcão, de frente para nós (só aparece da barriga para cima)
	function roboDeFrente(s, cor) {
		return sprite(0.62, 1.8, s, function (X, Y) {
			var metal = cor.metal || ['#eef0f8', '#c8ccdc', '#a8acc4', '#868aa4', '#5e627c'];
			// o uniforme azul da agência, com gola branca, gravata dourada e crachá
			poli([[X(-0.24), Y(1.3)], [X(0.24), Y(1.3)], [X(0.27), Y(0.8)], [X(-0.27), Y(0.8)]], function (x, y) { return rampa(['#34449a', '#24357e', '#1c2a6e', '#141f55'], (x - X(-0.27)) / (0.54 * s) * 0.8 + 0.1, x, y); });
			elip(Math.round(X(-0.2)), Math.round(Y(1.27)), Math.round(0.07 * s), Math.round(0.04 * s), '#34449a'); elip(Math.round(X(0.2)), Math.round(Y(1.27)), Math.round(0.07 * s), Math.round(0.04 * s), '#1c2a6e');
			poli([[X(-0.07), Y(1.31)], [X(0.07), Y(1.31)], [X(0), Y(1.18)]], '#f2eefc');
			poli([[X(-0.015), Y(1.27)], [X(0.015), Y(1.27)], [X(0.02), Y(1.1)], [X(-0.02), Y(1.1)]], '#e8c46a');
			ret(X(0.08), Y(1.17), 0.09 * s, 0.06 * s, '#f2eefc'); ret(X(0.09), Y(1.16), 0.03 * s, 0.03 * s, '#7fe3ff');
			ret(X(-0.13), Y(1.15), Math.max(1, 0.03 * s), Math.max(1, 0.03 * s), '#e8c46a');
			// o pescoço de molas
			ret(X(-0.04), Y(1.38), 0.08 * s, 0.08 * s, function (x, y) { return (Math.round(y) % 2) ? '#8a8ea8' : '#5a5e78'; });
			// a cabeça de metal com visor
			var x0 = X(-0.15), x1 = X(0.15), y0 = Y(1.66), y1 = Y(1.37);
			ret(x0, y0, x1 - x0, y1 - y0, function (x, y) { return rampa(metal, (x - x0) / (x1 - x0) * 0.6 + (y - y0) / (y1 - y0) * 0.35, x, y); });
			ret(x0, y0, x1 - x0, 1, metal[0]);
			ret(X(-0.12), Y(1.6), 0.24 * s, 0.15 * s, function (x, y) { return rampa(['#1e3a5a', '#10203a', '#08101e'], (y - Y(1.6)) / (0.15 * s), x, y); });
			ret(X(-0.11), Y(1.59), Math.max(1, 0.05 * s), 1, '#5a8ab8'); // o reflexo no vidro
			ret(X(-0.08), Y(1.54), Math.max(1, 0.04 * s), Math.max(1, 0.035 * s), cor.olho); ret(X(0.04), Y(1.54), Math.max(1, 0.04 * s), Math.max(1, 0.035 * s), cor.olho);
			ret(X(-0.04), Y(1.48), 0.08 * s, 1, cor.olho);
			ret(X(-0.19), Y(1.56), 0.04 * s, 0.1 * s, metal[3]); ret(X(0.15), Y(1.56), 0.04 * s, 0.1 * s, metal[4]); // as orelhas
			ret(X(-0.008), Y(1.78), Math.max(1, 0.016 * s), 0.12 * s, '#6a6e88');
			elip(Math.round(X(0)), Math.round(Y(1.79)), Math.max(1, Math.round(0.022 * s)), Math.max(1, Math.round(0.022 * s)), cor.antena);
		});
	}

	var CENAS = {};

	// ruído suave (interpolado), para nuvens de nebulosa e manchas
	function ruidoSuave(x, y) {
		var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
		fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
		var a = ruido(xi, yi), b = ruido(xi + 1, yi), c = ruido(xi, yi + 1), d = ruido(xi + 1, yi + 1);
		return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
	}
	function nuvem(x, y, esc) { return ruidoSuave(x / esc, y / esc) * 0.55 + ruidoSuave(x / esc * 2.1, y / esc * 2.1) * 0.3 + ruidoSuave(x / esc * 4.3, y / esc * 4.3) * 0.15; }

	// 0. A RUA DA AGÊNCIA, à noite, num porto espacial cyberpunk (Blade Runner): arranha-céus com
	// telões gigantes no fundo, neblina rosa e azul, carros voadores, fios cruzando a rua, letreiros
	// verticais com letras estrangeiras, um bar de lámen e uma farmácia dos lados, e no meio a Agência
	// Andarilha, azul-marinho e dourada, com o telão dela em cima. Chove; o asfalto molhado reflete tudo.
	// Clicar em "Entrar" abre a porta de vidro.
	var PORTA_F = { x0: 216, x1: 264, y0: 160, y1: 212 };
	var TELAS = []; // os telões dos prédios (animados a cada quadro)
	var JANELAS = []; // as janelas com coisas que se mexem (TV, computador, aquário)
	// uma "letra" estrangeira inventada (5 x 5 pixels, simétrica), para os letreiros
	function glifo(x, y, cor, semente, esc) {
		esc = esc || 1;
		for (var j = 0; j < 5; j++) for (var i = 0; i < 3; i++) if (ruido(semente * 7 + i, j + semente * 3) > 0.45 || (j === 0 && i === 1) || (i === 2 && j === 2)) { ret(x + i * esc, y + j * esc, esc, esc, cor); ret(x + (4 - i) * esc, y + j * esc, esc, esc, cor); }
	}
	// um letreiro vertical de neon: caixa escura, borda acesa e uma coluna de letras
	function letreiroVertical(x, y, n, cor, semente) {
		ret(x - 1, y - 1, 9, n * 7 + 3, '#0a0814'); ret(x - 1, y - 1, 9, 1, cor); ret(x - 1, y + n * 7 + 1, 9, 1, cor); ret(x - 1, y - 1, 1, n * 7 + 3, cor); ret(x + 7, y - 1, 1, n * 7 + 3, cor);
		for (var k = 0; k < n; k++) glifo(x + 1, y + 1 + k * 7, cor, semente + k);
		for (var g = 0; g < n * 7; g += 2) { mistura(x - 2, y + g, cor, 0.25); mistura(x + 8, y + g, cor, 0.25); }
	}
	// uma baleia holográfica (de lado, nadando para a esquerda), nadando como as jubartes de verdade:
	// a cabeça quase parada, a onda do corpo crescendo só do meio para trás, a nadadeira da cauda
	// (horizontal, como a das baleias, não em pé como a dos peixes) subindo e descendo devagar, a
	// nadadeira peitoral comprida remando de leve e o corpo inteiro subindo um pouco a cada batida.
	// o: { L, rgb, batida (segundos por batida da cauda), fase, alfa }
	function baleia(c, hx, hy, t, o) {
		if (o.alfa <= 0) return;
		var L = o.L, rgb = o.rgb;
		/* o holograma tremula de vez em quando, como um projetor falhando por um instante */
		var alfa = o.alfa * (Math.sin(t * 23 + o.fase * 7) > 0.985 ? 0.5 : 1);
		var cor = function (a) { return 'rgba(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ',' + (a * alfa) + ')'; };
		/* (a cor clarinha, quase branca: as nadadeiras peitorais e a barriga da jubarte são brancas) */
		var claro = function (a) { return 'rgba(' + ((rgb[0] + 510) / 3 | 0) + ',' + ((rgb[1] + 510) / 3 | 0) + ',' + ((rgb[2] + 510) / 3 | 0) + ',' + (a * alfa) + ')'; };
		var w = Math.PI * 2 / o.batida, ang = t * w + o.fase, R0 = L * 0.12, A = L * 0.05;
		/* o deslocamento vertical de cada ponto do corpo (u = 0 na cabeça, 1 na cauda) */
		var onda = function (u) { var k = Math.max(0, (u - 0.4) / 0.6); return Math.sin(ang - u * 2.4) * k * k * A + Math.sin(ang - 0.6) * 0.6; };
		var raio = function (u) { return u < 0.1 ? R0 * (0.72 + 0.28 * Math.sqrt(u / 0.1)) : u < 0.38 ? R0 : R0 * Math.max(0.2, 1 - Math.pow((u - 0.38) / 0.62, 1.1) * 0.85); };
		/* a cabeça da jubarte é achatada e pontuda em cima, com a mandíbula grande embaixo */
		var raioCima = function (u) { return u < 0.24 ? R0 * (0.22 + 0.78 * Math.pow(u / 0.24, 0.75)) : raio(u); };
		var raioBaixo = function (u) { return u < 0.14 ? R0 * (0.5 + 0.5 * Math.sqrt(u / 0.14)) : raio(u); };
		var malha = Math.max(4, L * 0.07), scan = (t * 5) % 3;
		/* uma faixa de luz descendo devagar pelo corpo (a varredura do holograma), só dentro dele */
		var varreY = hy - R0 + (((t * 0.3) % 1.4) - 0.2) * R0 * 2;
		/* as nadadeiras peitorais: compridas (um terço do corpo, como na jubarte de verdade), brancas,
		   com a borda da frente ondulada de calombos, remando devagar; a do outro lado aparece apagadinha */
		function peitoral(lado) {
			var ur = 0.27, cyr = hy + onda(ur), rr = raio(ur);
			var bx = hx + L * ur, by = cyr + rr * 0.55, Lf = L * (lado ? 0.31 : 0.24);
			var a0 = 0.62 + Math.sin(ang * 0.5 + (lado ? 0 : 0.8)) * 0.14, dx = Math.cos(a0), dy = Math.sin(a0), nx = -dy, ny = dx;
			var borda = [], tras = [];
			for (var s2 = 0; s2 <= 1.001; s2 += 0.04) {
				var larg = R0 * 0.3 * Math.pow(1 - s2, 0.55) + 0.4, calombo = s2 > 0.15 && s2 < 0.95 ? Math.abs(Math.sin(s2 * Math.PI * 7)) * 1.4 : 0;
				/* (a nadadeira é um pouco curvada, como uma asa) */
				var curva = s2 * s2 * Lf * 0.12, px0 = bx + dx * s2 * Lf + nx * curva, py0 = by + dy * s2 * Lf + ny * curva;
				borda.push([px0 - nx * (larg + calombo), py0 - ny * (larg + calombo)]);
				tras.push([px0 + nx * larg * 0.6, py0 + ny * larg * 0.6]);
			}
			c.beginPath(); c.moveTo(borda[0][0], borda[0][1]);
			borda.forEach(function (p) { c.lineTo(p[0], p[1]); }); for (var j = tras.length - 1; j >= 0; j--) c.lineTo(tras[j][0], tras[j][1]);
			c.closePath(); c.fillStyle = lado ? claro(0.26) : cor(0.1); c.fill();
			if (!lado) return;
			c.fillStyle = claro(0.85); borda.forEach(function (p, j) { if (j > 0) c.fillRect(p[0], p[1], 1, 1); }); /* a borda dos calombos, acesa */
			c.fillStyle = cor(0.5); tras.forEach(function (p, j) { if (j % 2 && j > 0) c.fillRect(p[0], p[1], 1, 0.5); });
			c.fillStyle = claro(0.95); c.fillRect(borda[6][0], borda[6][1], 1, 1); c.fillRect(borda[11][0], borda[11][1] + 0.5, 1, 1); /* cracas na borda */
		}
		peitoral(0);
		/* o corpo, coluna por coluna (em posições quebradas, sem arredondar: o corpo desliza liso) */
		for (var i = 0; i < L; i += 0.5) {
			var u = i / L, x = hx + i, r = raio(u);
			var cy = hy + onda(u), y0 = cy - raioCima(u) * 0.82, y1 = cy + raioBaixo(u) * 0.8;
			/* a nadadeira dorsal pequena, em cima de uma corcova (é a "corcunda" do nome em inglês, humpback) */
			if (u > 0.58 && u < 0.7) {
				var fu = (u - 0.58) / 0.12, fh = fu < 0.7 ? Math.sin(fu / 0.7 * Math.PI / 2) * R0 * 0.42 : R0 * 0.42 * (1 - (fu - 0.7) / 0.3) * 0.35;
				c.fillStyle = cor(0.2); c.fillRect(x, y0 - fh, 0.5, fh); c.fillStyle = cor(0.7); c.fillRect(x, y0 - fh, 0.5, 1);
			}
			/* o volume do holograma: o meio mais transparente e as beiradas mais acesas (como um vidro visto de lado) */
			c.fillStyle = cor(0.12); c.fillRect(x, y0, 0.5, y1 - y0);
			c.fillStyle = cor(0.12); c.fillRect(x, y0 + 1, 0.5, 2); c.fillRect(x, y1 - 3, 0.5, 2);
			/* a barriga clarinha (a jubarte tem a barriga branca e as costas escuras) */
			if (u > 0.04 && u < 0.75) { c.fillStyle = claro(0.08); c.fillRect(x, cy + r * 0.2, 0.5, y1 - cy - r * 0.2); }
			/* as linhas da varredura, descendo devagar */
			c.fillStyle = cor(0.07); for (var sy = Math.floor(y0) + 1 + scan; sy < y1 - 1; sy += 3) c.fillRect(x, sy, 0.5, 1);
			if (varreY > y0 && varreY < y1 - 1.5) { c.fillStyle = cor(0.2); c.fillRect(x, varreY, 0.5, 1.5); }
			/* a malha do holograma: a linha do lado do corpo e os anéis, de tantos em tantos pixels */
			c.fillStyle = cor(0.2); c.fillRect(x, cy - r * 0.18, 0.5, 0.5);
			if (i % malha < 0.5) { c.fillStyle = cor(0.09); c.fillRect(x, y0, 0.5, y1 - y0); }
			/* o contorno aceso: as costas um pouco mais fortes que a barriga */
			c.fillStyle = cor(0.7); c.fillRect(x, y0, 0.5, 1); c.fillStyle = claro(0.5); c.fillRect(x, y1 - 1, 0.5, 1);
			/* as pregas da garganta: listras compridas embaixo, da ponta da boca até o meio da barriga */
			if (u > 0.03 && u < 0.44) {
				c.fillStyle = claro(u > 0.36 ? 0.22 * (0.44 - u) / 0.08 : 0.22);
				for (var pg = cy + r * 0.28; pg < y1 - 1.2; pg += 1.5) c.fillRect(x, pg, 0.5, 0.6);
			}
			/* a boca: uma linha que sai da ponta do focinho e desce um pouquinho até embaixo do olho */
			if (u < 0.2) { c.fillStyle = claro(0.75); c.fillRect(x, cy + R0 * (-0.05 + 0.32 * Math.pow(u / 0.2, 1.5)), 0.5, 1); }
			/* os calombos da cabeça (os tubérculos, cada um com um pelo sensorial) e os do queixo */
			if (u > 0.01 && u < 0.17 && i % (L * 0.03) < 0.5) { c.fillStyle = claro(1); c.fillRect(x, y0 - 1, 1, 1); }
			if (u < 0.06 && i % (L * 0.022) < 0.5) { c.fillStyle = claro(0.7); c.fillRect(x, y1 - 0.4, 0.9, 0.9); }
			/* o espiráculo (o "nariz" no alto da cabeça) */
			if (Math.abs(u - 0.2) < 0.003) { c.fillStyle = claro(0.9); c.fillRect(x - 0.5, y0 - 0.6, 1.5, 0.8); }
			/* os "nós" em cima do pedúnculo, entre a dorsal e a cauda */
			if (u > 0.72 && u < 0.92 && i % (L * 0.032) < 0.5) { c.fillStyle = cor(0.65); c.fillRect(x, y0 - 0.6, 0.8, 0.8); }
		}
		/* o olho, logo acima do canto da boca, com um brilho em volta */
		var ux = 0.19, ox = hx + L * ux, oy = hy + onda(ux) + R0 * 0.08;
		c.fillStyle = cor(0.3); c.fillRect(ox - 1, oy - 1, 3, 2.5); c.fillStyle = claro(1); c.fillRect(ox, oy - 0.5, 1, 1);
		/* cracas no queixo (as jubartes de verdade carregam várias) */
		c.fillStyle = claro(0.8); c.fillRect(hx + L * 0.025, hy + onda(0.025) + raio(0.025) * 0.55, 1, 1); c.fillRect(hx + L * 0.045, hy + onda(0.045) + raio(0.045) * 0.7, 1, 0.8);
		peitoral(1);
		/* a nadadeira da cauda: uma lâmina fina que inclina para cima e para baixo seguindo a batida */
		/* (vista de lado, a nadadeira abre num leque conforme inclina: fina quando passa reta, larga na ponta da batida;
		   a borda de trás é serrilhada, como a de toda jubarte) */
		var xe = hx + L, ye = hy + onda(1), incl = (onda(1) - onda(0.94)) / (L * 0.06) * 1.4, lc = L * 0.18, abre = 2 + Math.abs(Math.sin(ang - 2.4)) * L * 0.07;
		for (var k2 = 0; k2 < lc; k2 += 0.5) {
			var f2 = k2 / lc, esp = 1.6 + f2 * abre * (f2 < 0.85 ? 1 : 1 - (f2 - 0.85) * 3), meio = ye + k2 * incl;
			c.fillStyle = cor(0.18); c.fillRect(xe + k2, meio - esp / 2, 0.5, esp);
			c.fillStyle = cor(0.65); c.fillRect(xe + k2, meio - esp / 2, 0.5, 1); c.fillStyle = claro(0.5); c.fillRect(xe + k2, meio + esp / 2 - 1, 0.5, 1);
			if (f2 > 0.3 && k2 % 1 === 0) { c.fillStyle = cor(0.1); c.fillRect(xe + k2, meio - 0.3, 0.5, 0.6); } /* a nervura do meio */
			if (k2 + 0.5 >= lc) { c.fillStyle = claro(0.8); for (var sz = meio - esp / 2; sz < meio + esp / 2; sz += 1.4) c.fillRect(xe + k2 + ((sz * 1.7 | 0) % 2 ? 0.5 : -0.5), sz, 1, 0.8); }
		}
		/* faíscas do projetor soltando do corpo e subindo devagar, sumindo no ar */
		for (var n = 0; n < 7; n++) {
			var vida = (t * 0.25 + n * 0.37 + o.fase) % 1, un = (n * 0.618 + Math.floor(t * 0.25 + n * 0.37 + o.fase) * 0.29) % 0.9;
			var fx = hx + L * un + vida * 6, fy = hy + onda(un) - raio(un) * 0.8 - vida * 10;
			c.fillStyle = claro(0.7 * (1 - vida)); c.fillRect(fx, fy, 1, 1);
		}
	}
	// os carros flutuantes da rua (de lado, sem rodas: deslizam sobre os propulsores, com a luz azul
	// embaixo). Desenhados virados para a direita; com lado = -1 o desenho espelha (a frente vai para a esquerda)
	function carroRua(c, modelo, cx, chao, lado, t) {
		var base = Math.round(chao - 5 + Math.sin(t * 3 + cx * 0.01)), L = modelo.L;
		function Q(x, y, w, h, cor) { R(c, lado > 0 ? cx + x : cx - x - w, base + y, w, h, cor); }
		/* a luz azul dos propulsores no asfalto molhado e o facho do farol na frente */
		c.save(); c.globalCompositeOperation = 'lighter';
		var gl = c.createRadialGradient(cx, chao, 1, cx, chao, L * 0.6); gl.addColorStop(0, modelo.brilho); gl.addColorStop(1, 'rgba(0,0,0,0)');
		c.fillStyle = gl; c.save(); c.translate(cx, chao); c.scale(1, 0.12); c.translate(-cx, -chao); c.beginPath(); c.arc(cx, chao, L * 0.6, 0, Math.PI * 2); c.fill(); c.restore();
		c.globalAlpha = 0.07; c.fillStyle = '#fff8e0'; var fx = cx + lado * L / 2;
		c.beginPath(); c.moveTo(fx, base - 9); c.lineTo(fx + lado * 60, base - 16); c.lineTo(fx + lado * 60, base + 4); c.fill();
		c.globalAlpha = 0.25; for (var rf = 2; rf < 12; rf += 2) { R(c, fx - lado * 2, chao + rf, 2, 1, '#fff8e0'); R(c, cx - lado * L / 2, chao + rf, 2, 1, '#ff3a3a'); } /* os reflexos das luzes no chão molhado */
		c.restore(); c.globalAlpha = 1;
		modelo.desenho(Q, t, L);
		if (modelo.texto) texto3(c, modelo.texto, (lado > 0 ? cx - 34 : cx - 16) + 9, base - 19, 1, '#9af0ff'); /* o nome na lateral (sempre de frente para quem lê) */
	}
	function sedan(cores) {
		return { L: 64, brilho: cores.brilho || 'rgba(58,224,255,0.5)', desenho: function (Q, t, L) {
			Q(-30, -3, 10, 3, '#14141e'); Q(14, -3, 12, 3, '#14141e'); Q(-28, 0, 6, 1, '#3ae0ff'); Q(16, 0, 8, 1, '#3ae0ff'); /* os propulsores */
			Q(-32, -8, 64, 5, cores.b); Q(-32, -4, 64, 1, cores.d); Q(28, -10, 5, 4, cores.b); Q(-33, -11, 61, 3, cores.b); Q(-31, -12, 56, 1, cores.B);
			Q(-34, -14, 5, 2, cores.d); Q(-33, -12, 2, 2, cores.d); /* o aerofólio atrás */
			for (var j = 0; j < 6; j++) Q(-20 + j, -13 - j, 34 - j * 3, 1, j === 5 ? cores.B : '#1a2e48'); /* a cabine de vidro inclinada */
			Q(-12, -16, 9, 1, '#8ac8ff'); Q(0, -15, 1, 3, cores.d); Q(-2, -11, 1, 6, cores.d);
			Q(-31, -5, 62, 1, '#3ae0ff'); Q(31, -10, 2, 2, '#ffffff'); Q(29, -10, 2, 1, '#cfe8ff'); Q(-33, -10, 2, 3, '#ff3a3a');
			if (cores.taxi) { Q(-8, -22, 15, 4, '#ffd36a'); Q(-7, -21, 13, 2, '#1a1418'); for (var tx = 0; tx < 13; tx += 2) Q(-31 + tx * 4.6, -7, 2, 1, '#1a1418'); }
		} };
	}
	var MODELOS = {
		esporte: sedan({ b: '#c8306a', B: '#ff6aa0', d: '#7a1a40', brilho: 'rgba(255,58,184,0.5)' }),
		prata: sedan({ b: '#8a90a8', B: '#c8d0e8', d: '#4a5068' }),
		taxi: sedan({ b: '#e8b030', B: '#ffe08a', d: '#9a7020', taxi: true, brilho: 'rgba(255,211,106,0.45)' }),
		van: { L: 76, brilho: 'rgba(58,224,255,0.5)', desenho: function (Q, t) {
			Q(-30, -3, 12, 3, '#14141e'); Q(18, -3, 12, 3, '#14141e'); Q(-28, 0, 8, 1, '#3ae0ff'); Q(20, 0, 8, 1, '#3ae0ff');
			Q(-38, -26, 58, 23, '#d8dce8'); Q(-38, -26, 58, 1, '#ffffff'); Q(-38, -5, 76, 2, '#8a8ea8');
			Q(20, -20, 14, 17, '#d8dce8'); for (var j = 0; j < 6; j++) Q(20 + j, -20 + j, 1, 1, '#d8dce8'); Q(26, -18, 10, 7, '#1a2e48'); Q(27, -17, 4, 1, '#8ac8ff'); Q(34, -11, 4, 8, '#d8dce8');
			Q(-34, -21, 50, 9, '#2a3a6a'); Q(-34, -21, 50, 1, '#3ae0ff'); /* a faixa da transportadora */
			Q(36, -9, 2, 3, '#ffffff'); Q(-39, -14, 2, 4, '#ff3a3a'); Q(-39, -24, 2, 2, '#ffb030');
		}, texto: 'ENTREGAS' },
		policia: { L: 66, brilho: 'rgba(120,140,255,0.5)', desenho: function (Q, t) {
			Q(-30, -3, 10, 3, '#14141e'); Q(16, -3, 12, 3, '#14141e'); Q(-28, 0, 6, 1, '#7a8aff'); Q(18, 0, 8, 1, '#7a8aff');
			Q(-33, -11, 66, 8, '#14182e'); Q(-33, -7, 66, 2, '#e8ecf4'); Q(30, -13, 4, 4, '#14182e'); Q(-32, -12, 58, 1, '#3a4268');
			for (var j = 0; j < 6; j++) Q(-18 + j, -12 - j, 30 - j * 3, 1, j === 5 ? '#3a4268' : '#1a2e48');
			var pisca = Math.floor(t * 6) % 2; Q(-6, -19, 6, 2, pisca ? '#ff2a3a' : '#3a1a20'); Q(0, -19, 6, 2, pisca ? '#1a2048' : '#3a6aff');
			Q(32, -10, 2, 2, '#ffffff'); Q(-34, -10, 2, 3, '#ff3a3a');
		} },
		moto: { L: 34, brilho: 'rgba(176,90,255,0.5)', desenho: function (Q, t) {
			Q(-14, -3, 8, 3, '#14141e'); Q(8, -3, 8, 3, '#14141e'); Q(-12, 0, 4, 1, '#b05aff'); Q(10, 0, 4, 1, '#b05aff');
			Q(-16, -8, 34, 5, '#2a2a3e'); Q(-14, -9, 26, 1, '#5a5e7a'); Q(10, -11, 8, 3, '#2a2a3e'); Q(-16, -6, 34, 1, '#b05aff');
			/* a piloto de capacete com o visor aceso */
			Q(-4, -18, 7, 9, '#1a1a2a'); Q(1, -16, 6, 2, '#1a1a2a'); Q(6, -15, 2, 3, '#1a1a2a');
			Q(-3, -24, 7, 6, '#e8e2d8'); Q(1, -22, 4, 2, '#3ae0ff'); Q(-6, -21, 3, 1, '#ff3ab8');
			Q(17, -8, 2, 2, '#ffffff'); Q(-17, -7, 2, 2, '#ff3a3a');
		} }
	};
	// as faixas da rua: a de trás vai para a esquerda, a da frente para a direita
	var FAIXAS = [
		{ chao: 238, lado: -1, vel: 34, carros: ['taxi', 'policia', 'prata', 'van'] },
		{ chao: 256, lado: 1, vel: 52, carros: ['esporte', 'moto', 'van', 'taxi', 'prata'] }
	];
	// um pedestre de lado (cerca de 38 px de altura), andando com guarda-chuva aceso
	// ou com a capa de chuva transparente de LED
	function pedestre(c, gx, gy, lado, t, p) {
		var f = Math.floor(t * 5 + p.fase) % 4, ab = [2, 0, -2, 0][f], sobe = f % 2 ? 0 : 1, E = 1.4; /* E = a escala do desenho */
		function Q(x, y, w, h, cor) { var x0 = Math.round(x * E), x1 = Math.round((x + w) * E), y0 = Math.round((y - sobe) * E), y1 = Math.round((y - sobe + h) * E); R(c, lado > 0 ? gx + x0 : gx - x1, gy + y0, x1 - x0, y1 - y0, cor); }
		Q(-1 + ab, -9, 2, 9 + sobe, p.calca); Q(-1 - ab, -9, 2, 9 + sobe, p.calca2); Q(-1 + ab, -1 + sobe, 3, 1, '#14141e'); Q(-1 - ab, -1 + sobe, 3, 1, '#14141e'); /* as pernas e os sapatos */
		Q(-3, -21, 6, 12, p.casaco); Q(-4, -12, 8, 3, p.casaco); Q(-3, -21, 1, 12, p.casaco2); /* o casaco */
		Q(-2, -26, 5, 5, p.pele); Q(-2, -27, 5, 2, p.cabelo); Q(-3, -26, 2, 4, p.cabelo); Q(2, -24, 1, 1, '#1a1418'); /* a cabeça */
		if (p.guarda) {
			Q(2, -19, 2, 6, p.casaco2); Q(3, -32, 1, 14, '#d8d8e8'); /* o braço e o cabo */
			c.fillStyle = p.guarda; c.beginPath(); c.ellipse(lado > 0 ? gx + 3.5 * E : gx - 3.5 * E, gy - (32 + sobe) * E, 12 * E, 5 * E, 0, Math.PI, 0); c.fill();
			Q(-9, -32, 25, 1, p.aro); for (var gt = 0; gt < 3; gt++) { var fg = ((t * 1.6 + gt * 0.33 + p.fase) % 1); if (fg < 0.6) Q(-8 + gt * 11, -31 + fg * 12, 1, 1, 'rgba(184,208,255,0.8)'); }
		} else {
			c.save(); c.globalAlpha = 0.35; Q(-5, -28, 10, 20, p.capa); c.restore(); Q(-5, -28, 10, 1, p.capa); Q(-5, -28, 1, 20, p.capa); Q(4, -28, 1, 20, p.capa); Q(-5, -9, 10, 1, p.capa); /* a capa de LED */
			Q(-3, -25, 1, 2, '#3ae0ff'); /* o fone aceso */
		}
	}
	var PEDESTRES = [
		{ per: 18, ini: 0, lado: 1, fase: 0, pele: '#d8a888', cabelo: '#1a1418', casaco: '#2a3a4a', casaco2: '#1a2a3a', calca: '#1a1a22', calca2: '#2a2a32', guarda: 'rgba(58,224,255,0.85)', aro: '#9af0ff' },
		{ per: 22, ini: 8, lado: -1, fase: 1, pele: '#a06a48', cabelo: '#3a2a1a', casaco: '#4a2a4a', casaco2: '#3a1a3a', calca: '#1a1a22', calca2: '#2a2a32', guarda: 'rgba(255,58,184,0.85)', aro: '#ffa0e0' },
		{ per: 26, ini: 15, lado: 1, fase: 2, pele: '#e8c0a0', cabelo: '#c8b070', casaco: '#3a3a3e', casaco2: '#2a2a2e', calca: '#2a2a3a', calca2: '#3a3a4a', capa: '#ff9ad8' }
	];
	CENAS.abertura = {
		fundo: function () {
			TELAS = []; JANELAS = [];
			var p = pintar(tela0(), function () {
				var X0 = -OX, X1 = NUCLEO + OX, HORIZ = 212;
				// o céu: noite carregada, com a neblina iluminada pela cidade (rosa embaixo, azul em cima)
				for (var y = 0; y < 200; y++) for (var x = X0; x < X1; x++) {
					var n = nuvem(x + 300, y * 1.8, 50);
					px(x, y, rampa(['#04030c', '#080820', '#0e0c2e', '#1a1040', '#2e1450', '#4a1a5a'], y / 200 + (n - 0.5) * 0.25, x, y));
				}
				// as torres lá do fundo: silhuetas altas com janelinhas, faixas de neon e luzes de topo
				function torres(cam, baseY, altMin, altMax, larMin, larMax, nevoa) {
					for (var bx = X0 - 10; bx < X1; ) {
						var bw = larMin + Math.floor(ruido(bx, cam * 7) * (larMax - larMin)), bh = altMin + Math.floor(ruido(bx, cam * 7 + 1) * (altMax - altMin)), topo = baseY - bh;
						var corT = cam === 0 ? ['#141634', '#10122c', '#0c0e24'] : ['#0e1028', '#0a0b1e', '#070816'];
						ret(bx, topo, bw - 1, bh, function (x2, y2) { return rampa(corT, (x2 - bx) / bw * 0.7 + 0.1, x2, y2); });
						if (ruido(bx, cam + 20) > 0.6) { ret(bx + bw / 2 - 1, topo - 10, 1, 10, corT[1]); px(bx + bw / 2 - 1, topo - 11, '#ff3a5a'); }
						// janelinhas em grade (umas acesas, em branco, ciano ou âmbar)
						for (var wy = topo + 3; wy < baseY - 2; wy += 3) for (var wx = bx + 2; wx < bx + bw - 2; wx += 2) { var r = ruido(wx * 3 + cam, wy); if (r > 0.86) px(wx, wy, r > 0.97 ? '#ffffff' : r > 0.92 ? '#7fe3ff' : '#ffb860'); }
						// faixas de neon subindo pela quina
						var neon = ruido(bx, cam + 30);
						if (neon > 0.55) { var cn = neon > 0.8 ? '#ff3ab8' : neon > 0.68 ? '#3ae0ff' : '#b05aff'; ret(bx, topo + 2, 1, bh - 2, cn); for (var g = topo; g < baseY; g += 2) mistura(bx + 1, g, cn, 0.3); }
						// um telão gigante em algumas torres do meio
						if (cam === 1 && bw > 22 && ruido(bx, 77) > 0.3 && TELAS.length < 7 && (bx + bw < 140 || bx > 340)) { // (nunca atrás da agência nem dos prédios da frente)
							var ty = topo + 8 + Math.floor(ruido(bx, 78) * 20), lim = bx + bw < 140 ? 84 : 94, th = Math.min(46, bh - 30, lim - ty);
							/* (o anúncio do retrato precisa de pelo menos 34 px de altura: a tela sobe um pouco no prédio) */
							if (TELAS.length % 3 === 0 && th < 34 && ty - (34 - th) > topo + 3) { ty -= 34 - th; th = 34; }
							if (th > 12) TELAS.push({ x: bx + 3, y: ty, w: bw - 7, h: th, tipo: TELAS.length % 3 });
						}
						bx += bw + (cam === 0 ? 0 : Math.floor(ruido(bx, 9) * 6));
					}
					// a neblina na base das torres
					for (var y3 = baseY - 50; y3 < baseY; y3++) for (var x3 = X0; x3 < X1; x3++) mistura(x3, y3, nevoa, (y3 - baseY + 50) / 50 * 0.35);
				}
				torres(0, 180, 60, 150, 10, 26, '#5a2a6a');
				torres(1, 186, 70, 175, 18, 40, '#3a2a6a');
				// a torre do telão gigante da gueixa, à esquerda (como os anúncios de Blade Runner)
				ret(16, 0, 100, 90, function (x2, y2) { return rampa(['#141634', '#0e1028', '#0a0b1e'], (x2 - 16) / 100 * 0.7 + 0.1, x2, y2); });
				for (var gw = 0; gw < 100; gw += 4) for (var gh = 0; gh < 90; gh += 3) if (ruido(gw + 16, gh) > 0.9) px(16 + gw, gh, '#7fe3ff');
				ret(24, 4, 84, 82, '#05040a'); ret(23, 3, 86, 1, '#ff3ab8'); ret(23, 86, 86, 1, '#ff3ab8'); ret(23, 3, 1, 84, '#ff3ab8'); ret(108, 3, 1, 84, '#ff3ab8');
				TELAS.push({ x: 24, y: 4, w: 84, h: 82, tipo: 'gueixa' });
				// os prédios dos lados da rua, bem perto: paredes escuras, janelas quentes, aparelhos de ar, escadas de incêndio
				function predio(x0, x1, topo, cor) {
					// a parede de tijolinho escuro, com manchas de chuva escorrendo
					ret(x0, topo, x1 - x0, HORIZ - topo, function (x2, y2) {
						var tij = (y2 % 4 === 0) || ((x2 + (Math.floor(y2 / 4) % 2) * 4) % 8 === 0);
						return rampa(cor, (x2 - x0) / (x1 - x0) * 0.4 + (ruido(x2 >> 2, y2 >> 2) - 0.5) * 0.15 + 0.3 + (tij ? 0.12 : 0) + (ruido(x2, 3) > 0.92 ? 0.15 : 0), x2, y2);
					});
					// o topo: a mureta, a caixa d'água, a antena e a parabólica
					ret(x0, topo - 3, x1 - x0, 3, cor[0]); ret(x0, topo - 3, x1 - x0, 1, '#4a4258');
					var cxA = x0 + (x1 - x0) * 0.3; ret(cxA, topo - 16, 14, 13, '#2a2436'); ret(cxA - 1, topo - 17, 16, 2, '#3a3448'); for (var pe = 0; pe < 3; pe++) ret(cxA + 1 + pe * 5, topo - 3, 1, 3, '#1a1624');
					ret(x0 + (x1 - x0) * 0.7, topo - 26, 1, 23, '#3a3448'); px(x0 + (x1 - x0) * 0.7, topo - 27, '#ff3a5a');
					elip(Math.round(x0 + (x1 - x0) * 0.85), topo - 7, 5, 4, function (a, b, u) { return u < 0.2 ? '#8a8e98' : '#5a5e6a'; });
					// as janelas: moldura, peitoril, cortina, gente, plantas, persiana; e o ar-condicionado pingando
					for (var wy = topo + 6; wy < HORIZ - 66; wy += 14) {
						if (Math.floor((wy - topo) / 14) % 2 === 1) { ret(x0 + 2, wy + 11, x1 - x0 - 4, 1, '#4a4258'); for (var gx2 = x0 + 4; gx2 < x1 - 4; gx2 += 3) px(gx2, wy + 9, '#3a3448'); } // a sacadinha com grade
						for (var wx = x0 + 6; wx < x1 - 12; wx += 18) {
							/* o que tem em cada janela acesa: abajur entre cortinas, gente vendo TV no sofá, estante de
							   livros, planta, gato no parapeito, alguém no computador, aquário, cozinha e persiana */
							var r = ruido(wx, wy), acesa = r > 0.45, tipo = Math.floor(ruido(wx, wy + 1) * 9);
							var luz = (tipo === 1 || tipo === 5) ? '#4a5a9a' : r > 0.8 ? '#ffd890' : r > 0.65 ? '#c8e8ff' : '#ffb8d8';
							ret(wx - 1, wy - 1, 12, 11, '#0e0c16');
							ret(wx, wy, 10, 9, acesa ? function (a, b) { return rampa([luz, luz, '#2a2030'], (b - wy) / 14, a, b); } : '#0a0a18');
							if (acesa) {
								if (tipo === 0) { /* o abajur aceso entre as cortinas */
									ret(wx, wy, 2, 9, '#8a3a4a'); ret(wx + 8, wy, 2, 9, '#8a3a4a'); px(wx + 1, wy + 2, '#6a2a3a'); px(wx + 8, wy + 5, '#6a2a3a');
									ret(wx + 4, wy + 3, 3, 2, '#fff0b0'); px(wx + 3, wy + 4, '#ffe08a'); px(wx + 7, wy + 4, '#ffe08a'); ret(wx + 5, wy + 5, 1, 2, '#3a2a20'); ret(wx + 3, wy + 7, 5, 2, '#5a3a24');
								} else if (tipo === 1) { /* a sala de TV: o sofá de costas, duas cabeças e a TV (que pisca, desenhada a cada quadro) */
									ret(wx + 1, wy + 1, 5, 4, '#14141e'); JANELAS.push({ x: wx + 2, y: wy + 2, tipo: 'tv' });
									ret(wx, wy + 6, 10, 3, '#5a2a3a'); ret(wx, wy + 6, 10, 1, '#7a3a4a');
									ret(wx + 2, wy + 4, 2, 2, '#1a1418'); ret(wx + 6, wy + 4, 2, 2, '#3a2418');
								} else if (tipo === 2) { /* a estante de livros, com lombadas coloridas */
									for (var pl = 0; pl < 3; pl++) { ret(wx, wy + 2 + pl * 3, 10, 1, '#4a3020'); for (var lv2 = 0; lv2 < 9; lv2++) if (ruido(wx + lv2, wy + pl) > 0.25) ret(wx + lv2, wy + pl * 3, 1, 2, ['#c83a3a', '#3a6ac8', '#e8c46a', '#4aa85a', '#e8e2d8', '#8a4ac8'][Math.floor(ruido(wx + lv2, wy + pl + 9) * 6)]); }
								} else if (tipo === 3) { /* a costela-de-adão no vaso, com a cortina de lado */
									ret(wx + 7, wy, 3, 9, '#5a7a8a'); ret(wx + 2, wy + 6, 4, 3, '#b0603a'); ret(wx + 2, wy + 6, 4, 1, '#d0805a');
									[[1, 2], [2, 1], [3, 3], [4, 0], [5, 2], [6, 4], [2, 4], [4, 4], [3, 1], [1, 4], [5, 5]].forEach(function (f) { px(wx + f[0], wy + f[1], f[0] % 2 ? '#3a8a4a' : '#5ab86a'); });
								} else if (tipo === 4) { /* o gato sentado no parapeito, de perfil */
									ret(wx + 4, wy + 6, 3, 3, '#1a1418'); px(wx + 5, wy + 5, '#1a1418'); ret(wx + 5, wy + 4, 2, 2, '#1a1418'); px(wx + 5, wy + 3, '#1a1418'); px(wx + 6, wy + 3, '#1a1418'); px(wx + 6, wy + 4, '#c8ff6a');
									px(wx + 3, wy + 8, '#1a1418'); px(wx + 2, wy + 7, '#1a1418');
								} else if (tipo === 5) { /* alguém no computador, de costas, com o monitor brilhando */
									ret(wx + 5, wy + 1, 4, 3, '#9ad8ff'); ret(wx + 6, wy + 4, 2, 1, '#3a3a4a'); ret(wx, wy + 5, 10, 1, '#5a3a24');
									ret(wx + 2, wy + 2, 3, 3, '#2a1a14'); ret(wx + 1, wy + 5, 5, 4, '#3a3a5a'); JANELAS.push({ x: wx + 5, y: wy + 1, tipo: 'pc' });
								} else if (tipo === 6) { /* o aquário em cima do móvel (os peixinhos nadam a cada quadro) */
									ret(wx + 1, wy + 3, 8, 4, '#2a7ab8'); ret(wx + 1, wy + 3, 8, 1, '#8ad0ff'); px(wx + 2, wy + 6, '#4aa85a'); px(wx + 2, wy + 5, '#4aa85a'); px(wx + 7, wy + 6, '#e8c46a');
									ret(wx, wy + 7, 10, 2, '#5a3a24'); JANELAS.push({ x: wx + 1, y: wy + 4, tipo: 'aquario' });
								} else if (tipo === 7) { /* a cozinha: a luminária pendurada, a prateleira com potes e as panelas */
									ret(wx + 5, wy, 1, 2, '#3a3a4a'); ret(wx + 4, wy + 2, 3, 1, '#fff0b0'); ret(wx, wy + 4, 4, 1, '#5a3a24'); px(wx + 1, wy + 3, '#c83a3a'); px(wx + 3, wy + 3, '#e8e2d8');
									px(wx + 7, wy + 4, '#8a8e98'); ret(wx + 7, wy + 5, 2, 2, '#5a5e6a'); px(wx + 8, wy + 4, '#8a8e98'); ret(wx, wy + 7, 10, 2, '#e8e2d8');
								} else { /* a persiana meio aberta */
									for (var bl = 0; bl < 5; bl += 1) ret(wx, wy + bl, 10, 1, bl % 2 ? '#d8c8b0' : '#b8a890');
								}
								mistura(wx + 5, wy + 12, luz, 0.25); mistura(wx + 4, wy + 13, luz, 0.15);
							}
							ret(wx - 1, wy + 9, 12, 1, '#4a4258'); // o peitoril
							if (ruido(wx, wy + 5) > 0.7) { ret(wx + 11, wy + 3, 6, 5, '#5a5e6a'); ret(wx + 12, wy + 4, 4, 1, '#8a8e98'); ret(wx + 12, wy + 5, 4, 1, '#3a3e48'); px(wx + 14, wy + 9, '#6a9ac8'); } // o ar-condicionado pingando
						}
					}
					// os canos descendo pela parede e uns rabiscos de grafite perto da calçada
					ret(x0 + 3, topo, 2, HORIZ - topo - 62, '#3a3448'); ret(x0 + 3, topo, 1, HORIZ - topo - 62, '#5a5268');
					for (var gf = 0; gf < 3; gf++) { var gx = x0 + 10 + gf * 30; if (gx > x1 - 20) break; for (var gp = 0; gp < 14; gp++) px(gx + gp, HORIZ - 72 + Math.round(Math.sin(gp * 0.9 + gf) * 3), ['#ff3ab8', '#3ae0ff', '#ffd36a'][gf]); }
				}
				predio(X0, 128, 86, ['#2a2236', '#221c2e', '#1a1624', '#14101c']);
				predio(352, X1, 96, ['#1e2232', '#181c2a', '#121522', '#0e101a']);
				// o prédio da agência no meio: fachada azul-marinho subindo, com o telão vertical dela
				ret(150, 26, 180, HORIZ - 26, function (x2, y2) { return rampa(['#26388a', '#1c2a6e', '#16225a', '#101a4a'], (x2 - 150) / 180 * 0.5 + (y2 - 26) / 186 * 0.4 + (ruido(x2 >> 3, y2 >> 3) - 0.5) * 0.06, x2, y2); });
				for (var sx = 172; sx < 330; sx += 22) { ret(sx, 26, 1, 120, '#0e1640'); ret(sx + 1, 26, 1, 120, '#2c3c8e'); }
				ret(146, 22, 188, 4, '#c8a040'); ret(146, 22, 188, 1, '#f0d480');
				ret(146, 26, 3, HORIZ - 26, '#c8a040'); ret(331, 26, 3, HORIZ - 26, '#8a6a20');
				ret(184, 28, 112, 80, '#05060e'); ret(182, 26, 116, 2, '#c8a040'); ret(182, 106, 116, 2, '#c8a040'); ret(182, 26, 2, 82, '#c8a040'); ret(296, 26, 2, 82, '#8a6a20'); // a moldura do telão
				TELAS.push({ x: 184, y: 28, w: 112, h: 78, tipo: 'agencia' });
				// o letreiro dourado da agência
				// (com o selo da agência do lado do nome; o selo entra por cima, depois)
				ret(152, 111, 176, 36, '#0a0e2a'); ret(152, 111, 176, 1, '#f0d480'); ret(152, 146, 176, 1, '#c8a040'); ret(152, 111, 1, 36, '#c8a040'); ret(327, 111, 1, 36, '#8a6a20');
				[[154, 113], [325, 113], [154, 144], [325, 144]].forEach(function (q) { px(q[0], q[1], '#f0d480'); }); // os parafusos dourados
				brilho(256, 129, 84, '#e8c46a', 0.22);
				letras('AGÊNCIA ANDARILHA', 257, 124, 2, '#ffe6a0', true);
				ret(176, 149, 128, 1, '#7fe3ff'); brilho(240, 149, 50, '#7fe3ff', 0.15);
				// as janelinhas dos andares dos lados do telão, a câmera de segurança e o interfone
				for (var aj = 0; aj < 5; aj++) [[156, 172], [302, 318]].forEach(function (q) {
					var jy = 40 + aj * 16; ret(q[0], jy, q[1] - q[0], 10, '#0a1030'); ret(q[0] + 1, jy + 1, q[1] - q[0] - 2, 8, function (a, b) { return rampa(['#8ab0e8', '#5a80c8', '#2a4a90'], (b - jy) / 8, a, b); });
					for (var pb = 0; pb < 8; pb += 2) ret(q[0] + 1, jy + 1 + pb, q[1] - q[0] - 2, 1, '#2a3a7a'); ret(q[0], jy + 10, q[1] - q[0], 1, '#c8a040');
				});
				ret(334, 150, 6, 3, '#2a2c34'); ret(338, 151, 3, 2, '#5a5e6a'); px(339, 152, '#ff3a3a');
				ret(270, 176, 5, 9, '#14141e'); ret(271, 177, 3, 3, '#7fe3ff'); for (var ib = 0; ib < 3; ib++) px(271 + ib, 182, '#5a5e6a');
				// as vitrines da agência: lá dentro, a mesma recepção (a vitrine do porto no alto, o friso dourado,
				// a faixa azul e a parede branca); na da esquerda, o guichê com o robô atendente; na da direita,
				// a horta hidropônica, o totem de senhas e o robô-garçom (que flutua, desenhado a cada quadro)
				function salaPelaVitrine(x0, x1, y0) {
					ret(x0, y0, x1 - x0, 212 - y0, function (x2, y2) { return rampa(['#f6f8fb', '#eceff4', '#e0e4ea', '#d4d8e0'], (y2 - y0) / (212 - y0) * 0.8, x2, y2); });
					ret(x0, y0, x1 - x0, 10, function (x2, y2) { return ruido(x2 * 3, y2 * 5) > 0.93 ? '#ffffff' : y2 > y0 + 7 ? (ruido(x2, 9) > 0.6 ? '#ffd890' : '#161838') : rampa(['#0e0c2e', '#1c1446', '#3a1a5a'], (y2 - y0) / 8, x2, y2); });
					ret(x0, y0 + 10, x1 - x0, 1, '#e8c46a'); ret(x0, y0 + 11, x1 - x0, 2, '#1c2a6e');
				}
				[[172, 210], [270, 308]].forEach(function (q, iv) {
					ret(q[0] - 2, 156, q[1] - q[0] + 4, 56, '#c8a040');
					salaPelaVitrine(q[0], q[1], 158);
					if (iv === 0) {
						/* o robô atendente atrás do balcão: cabeça de metal, visor com os olhos, antena, uniforme azul */
						var rx = q[0] + 13;
						ret(rx + 3, 176, 1, 3, '#8a8ea8'); px(rx + 3, 175, '#ff8ad8');
						ret(rx, 179, 8, 7, '#c8ccdc'); ret(rx, 179, 8, 1, '#eef0f8'); ret(rx + 7, 180, 1, 6, '#8a8ea8'); ret(rx + 1, 181, 6, 3, '#0a1424');
						ret(rx + 3, 186, 2, 1, '#8a8ea8'); ret(rx - 3, 187, 14, 5, '#24357e'); ret(rx + 2, 187, 4, 2, '#f2eefc'); px(rx + 4, 189, '#e8c46a'); px(rx + 4, 190, '#e8c46a');
						/* o monitor (de costas) e o balcão azul de tampo branco, com o friso dourado e o selo */
						ret(q[0] + 25, 184, 9, 7, '#2a2c34'); ret(q[0] + 28, 191, 3, 1, '#2a2c34');
						ret(q[0] + 1, 192, q[1] - q[0] - 2, 2, '#ffffff'); ret(q[0] + 1, 194, q[1] - q[0] - 2, 18, function (x2, y2) { return rampa(['#4a84dc', '#3a70c8', '#2c5cb0', '#224a92'], (y2 - 194) / 18, x2, y2); });
						ret(q[0] + 1, 195, q[1] - q[0] - 2, 1, '#e8c46a'); elip(q[0] + 19, 202, 2, 2, '#c8a040'); px(q[0] + 19, 202, '#e8905a');
						/* a plaquinha do guichê pendurada */
						ret(q[0] + 4, 171, 1, 3, '#8a90a0'); ret(q[0] + 2, 174, 6, 4, '#1c2a6e'); ret(q[0] + 2, 174, 6, 1, '#e8c46a'); px(q[0] + 4, 176, '#ffffff'); px(q[0] + 5, 176, '#ffffff');
					} else {
						/* a horta hidropônica: dois tubos de vidro com folhas e a luz rosa em cima */
						[q[0] + 3, q[0] + 8].forEach(function (tx) {
							ret(tx, 176, 3, 32, '#d8e8f4'); ret(tx, 175, 3, 1, '#ff6ad8'); ret(tx - 1, 208, 5, 4, '#3a3d48');
							for (var fo = 0; fo < 6; fo++) { px(tx + (fo % 2 ? 2 : 0), 178 + fo * 5, '#4aa85a'); px(tx + 1, 179 + fo * 5, '#7ad86a'); }
						});
						/* o totem de senhas: branco, topo azul-marinho, a telinha ciano e o selo dourado */
						var tx2 = q[0] + 16;
						ret(tx2, 180, 7, 32, '#f2f4f8'); ret(tx2 + 6, 180, 1, 32, '#c4c8d4'); ret(tx2, 180, 7, 3, '#1c2a6e'); ret(tx2 + 1, 186, 5, 4, '#7fe3ff'); px(tx2 + 3, 184, '#e8c46a'); ret(tx2 + 2, 193, 3, 1, '#1a1b20');
						/* uma cadeira de espera azul */
						ret(q[0] + 26, 198, 10, 6, '#3a70c8'); ret(q[0] + 26, 198, 10, 1, '#6fa4ff'); ret(q[0] + 26, 204, 10, 2, '#2c5cb0'); ret(q[0] + 28, 206, 1, 6, '#5a5e6a'); ret(q[0] + 34, 206, 1, 6, '#5a5e6a');
					}
					for (var rf = 0; rf < 10; rf++) mistura(q[0] + 2 + rf * 3, 160 + rf * 4, '#ffffff', 0.3);
				});
				// a marquise dourada e a porta (que desliza; desenhada a cada quadro)
				poli([[204, 150], [276, 150], [282, 157], [198, 157]], function (x2, y2) { return rampa(['#f0d480', '#c8a040', '#8a6a20'], (y2 - 150) / 7, x2, y2); });
				ret(PORTA_F.x0 - 3, PORTA_F.y0 - 3, PORTA_F.x1 - PORTA_F.x0 + 6, PORTA_F.y1 - PORTA_F.y0 + 3, '#c8a040');
				ret(PORTA_F.x0, PORTA_F.y0, PORTA_F.x1 - PORTA_F.x0, PORTA_F.y1 - PORTA_F.y0, function (x2, y2) { return rampa(['#fff4d0', '#ffe8b0', '#f0d090'], (y2 - PORTA_F.y0) / 52, x2, y2); });
				/* pela porta: a recepção lá dentro, com o painel de senhas em holograma e a fileira de cadeiras azuis */
				salaPelaVitrine(PORTA_F.x0, PORTA_F.x1, PORTA_F.y0);
				ret(PORTA_F.x0 + 14, PORTA_F.y0 + 17, 20, 8, '#1a5a8a'); ret(PORTA_F.x0 + 14, PORTA_F.y0 + 17, 20, 1, '#3ae0ff'); letras('011', PORTA_F.x0 + 24, PORTA_F.y0 + 19, 1, '#ffffff', true);
				for (var cd = 0; cd < 4; cd++) { var cdx = PORTA_F.x0 + 3 + cd * 11; ret(cdx, PORTA_F.y0 + 36, 9, 6, '#3a70c8'); ret(cdx, PORTA_F.y0 + 36, 9, 1, '#6fa4ff'); ret(cdx, PORTA_F.y0 + 42, 9, 2, '#2c5cb0'); ret(cdx + 4, PORTA_F.y0 + 44, 1, 8, '#5a5e6a'); }
				ret(PORTA_F.x0, PORTA_F.y0 + 50, PORTA_F.x1 - PORTA_F.x0, 2, '#c8ccd6');
				// o bar de lámen, à esquerda: lanternas vermelhas, cortina de pano, balcão com banquinhos
				ret(16, 150, 112, 62, '#1a0c10'); ret(16, 150, 112, 3, '#c83a2a');
				ret(20, 156, 104, 30, function (x2, y2) { return rampa(['#ffb070', '#e8783a', '#a84a22'], (y2 - 156) / 30, x2, y2); });
				for (var nr = 0; nr < 7; nr++) { ret(22 + nr * 15, 156, 13, 14, nr % 2 ? '#2a1a3a' : '#3a1a2a'); glifo(26 + nr * 15, 158, '#f2e0c0', nr + 40); } // a cortina com letras
				ret(20, 190, 104, 4, '#6a3a1e'); ret(20, 190, 104, 1, '#c8885a');
				for (var bq = 0; bq < 5; bq++) { ret(28 + bq * 20, 196, 8, 2, '#c83a2a'); ret(31 + bq * 20, 198, 2, 14, '#5a5e6a'); }
				[[26, 146], [118, 146]].forEach(function (q) { elip(q[0], q[1], 5, 6, '#e83a2a'); elip(q[0] - 1, q[1] - 1, 3, 4, '#ff7a5a'); ret(q[0] - 3, q[1] - 7, 6, 1, '#2a1a1a'); ret(q[0] - 3, q[1] + 6, 6, 1, '#2a1a1a'); brilho(q[0], q[1], 14, '#ff5a3a', 0.3); });
				ret(40, 132, 64, 12, '#0a0814'); ret(40, 132, 64, 1, '#ff4a3a'); ret(40, 143, 64, 1, '#ff4a3a'); letras('LÁMEN 24H', 72, 135, 1, '#ff8a6a', true); brilho(72, 138, 36, '#ff4a3a', 0.2);
				// lá dentro: o cozinheiro de chapéu branco, as panelas fumegando e o cardápio na parede
				ret(52, 172, 12, 18, '#f2eee8'); ret(52, 172, 12, 2, '#ffffff'); elip(58, 168, 4, 4, '#d8a070'); ret(54, 162, 8, 4, '#ffffff'); ret(53, 165, 10, 1, '#d8d4cc');
				[[70, 184], [82, 184]].forEach(function (q) { ret(q[0], q[1], 10, 6, '#5a5e6a'); ret(q[0], q[1], 10, 1, '#a8acb8'); ret(q[0] + 1, q[1] + 1, 8, 2, '#c87a3a'); });
				ret(96, 170, 22, 16, '#2a1a12'); ret(96, 170, 22, 1, '#c8885a'); for (var mc = 0; mc < 3; mc++) { glifo(98, 172 + mc * 5, '#f2e0c0', 70 + mc); letras(['90', '75', '60'][mc], 115, 172 + mc * 5, 1, '#ffd36a', false); }
				// uma cliente sentada no banquinho, de costas, comendo: jaqueta bomber com faixa de neon nas
				// mangas e um raio bordado nas costas, os cotovelos no balcão, calça escura e tênis branco
				// (a cabeça, que abaixa para comer, é desenhada a cada quadro)
				ret(89, 197, 2, 9, '#22222e'); ret(94, 197, 2, 9, '#2a2a38'); ret(88, 205, 3, 2, '#e8e2d8'); ret(94, 205, 3, 2, '#d8d2c8'); px(88, 206, '#ff3ab8'); px(96, 206, '#ff3ab8');
				ret(87, 179, 11, 17, function (x, y) { return rampa(['#4a5a8a', '#3a4a7a', '#2a3a62', '#1e2a4a'], (x - 87) / 11 * 0.7 + (y - 179) / 17 * 0.25, x, y); });
				ret(86, 180, 13, 3, '#3a4a7a'); ret(86, 180, 6, 1, '#5a6a9a'); ret(87, 194, 11, 2, '#1e2a4a'); /* os ombros e o elástico da barra */
				ret(85, 182, 2, 9, '#2e3c66'); ret(98, 182, 2, 9, '#1e2a4a'); ret(85, 184, 2, 1, '#3ae0ff'); ret(98, 184, 2, 1, '#3ae0ff'); /* os braços indo para o balcão */
				px(93, 184, '#ffd36a'); px(92, 185, '#ffd36a'); px(91, 186, '#ffd36a'); px(92, 186, '#ffd36a'); px(93, 186, '#ffd36a'); px(92, 187, '#ffd36a'); px(91, 188, '#ffd36a'); /* o raio bordado */
				ret(91, 177, 3, 2, '#c8906a');
				// o varal de lanterninhas de papel em cima do toldo
				for (var lv = 0; lv < 9; lv++) { var lx = 22 + lv * 12, lyv = 151 + Math.round(Math.sin(lv * 0.7) * 1); ret(lx, lyv, 4, 5, lv % 2 ? '#ffd36a' : '#ff6a4a'); px(lx + 1, lyv + 1, '#ffffff'); }
				// a farmácia, à direita: a cruz verde de neon, a vitrine e as máquinas de venda brilhando
				ret(352, 150, 120, 62, '#0c1a14'); ret(352, 150, 120, 3, '#2ad88a');
				ret(358, 158, 60, 50, function (x2, y2) { return rampa(['#d8fff0', '#a8f0d0', '#6ad0a8'], (y2 - 158) / 50, x2, y2); });
				for (var pr = 0; pr < 3; pr++) { ret(362, 168 + pr * 12, 52, 2, '#3a8a6a'); for (var it = 0; it < 6; it++) ret(364 + it * 8, 162 + pr * 12, 5, 6, ['#ff6a8a', '#ffffff', '#6ac8ff', '#ffd36a'][(it + pr) % 4]); }
				ret(380, 128, 26, 26, '#0a0814'); ret(389, 131, 8, 20, '#2aff8a'); ret(383, 137, 20, 8, '#2aff8a'); brilho(393, 141, 22, '#2aff8a', 0.3);
				// (com um painel holográfico verde translúcido atrás, para dar para ler)
				ret(373, 112, 41, 11, function (x2, y2) { mistura(x2, y2, y2 % 2 ? '#04241a' : '#06301f', 0.82); return null; });
				ret(373, 112, 41, 1, '#2ad88a'); ret(373, 122, 41, 1, '#2ad88a'); ret(373, 112, 1, 11, '#1a8a5a'); ret(413, 112, 1, 11, '#1a8a5a');
				for (var hgx = 373; hgx < 414; hgx += 2) { mistura(hgx, 111, '#2ad88a', 0.35); mistura(hgx, 123, '#2ad88a', 0.35); }
				letras('FARMÁCIA', 393, 116, 1, '#9affc8', true);
				[[426, '#3ae0ff'], [446, '#ff3ab8']].forEach(function (q) { ret(q[0], 166, 16, 46, '#14141e'); ret(q[0] + 2, 168, 12, 24, q[1]); for (var vb = 0; vb < 4; vb++) ret(q[0] + 3, 170 + vb * 5, 10, 3, '#ffffff'); ret(q[0] + 3, 196, 10, 4, '#2a2a3a'); brilho(q[0] + 8, 180, 18, q[1], 0.25); });
				// os letreiros verticais pendurados nos prédios dos lados (vermelho, ciano, rosa, amarelo)
				letreiroVertical(112, 70, 7, '#ff4a6a', 3); letreiroVertical(94, 92, 4, '#3ae0ff', 11); letreiroVertical(-OX + 20, 74, 7, '#ffd36a', 21); letreiroVertical(8, 96, 4, '#ff3ab8', 61);
				letreiroVertical(360, 66, 6, '#ff3ab8', 31); letreiroVertical(438, 80, 9, '#7affb8', 41); letreiroVertical(NUCLEO + OX - 30, 74, 8, '#3ae0ff', 51);
				// os fios cruzando a rua, de um prédio para o outro
				[[0, 60, 480, 52, 22], [-OX, 96, NUCLEO + OX, 88, 16], [40, 20, 420, 30, 28]].forEach(function (f) {
					for (var t = 0; t <= 1; t += 0.002) { var xx = f[0] + (f[2] - f[0]) * t, yy = f[1] + (f[3] - f[1]) * t + Math.sin(t * Math.PI) * f[4]; px(xx, yy, '#06050c'); }
				});
				// a calçada molhada, o meio-fio e o asfalto
				ret(X0, HORIZ, W, 10, function (x2, y2) { return (x2 % 16 === 0) ? '#1a1828' : rampa(['#3a3650', '#2e2a44', '#24223a'], (y2 - HORIZ) / 10 + (ruido(x2 >> 1, y2) - 0.5) * 0.2, x2, y2); });
				ret(X0, HORIZ + 10, W, 2, '#5a5878'); ret(X0, HORIZ + 12, W, 1, '#14121e');
				ret(X0, HORIZ + 13, W, H - HORIZ - 13, function (x2, y2) { return rampa(['#1a1828', '#14121e', '#0e0c16'], (y2 - HORIZ) / 58 * 0.6 + (ruido(x2 >> 2, y2 >> 1) - 0.5) * 0.15, x2, y2); });
				// o reflexo de tudo no asfalto molhado (o espelho da fachada, tremido e mais escuro)
				for (var ry = HORIZ + 13; ry < H; ry++) {
					var dist = ry - (HORIZ + 13), origem = HORIZ - 2 - Math.round(dist * 1.6), onda = Math.round(Math.sin(ry * 1.3) * 1.5);
					if (origem < 0) continue;
					for (var rx = X0; rx < X1; rx++) {
						var k = (origem * BW) + Math.max(0, Math.min(BW - 1, rx + DX + onda)), v = buf[k];
						if (!v || ruido(rx >> 1, ry) < 0.25) continue;
						var hex = '#' + ('00000' + (((v & 255) << 16) | (v & 0xff00) | ((v >> 16) & 255)).toString(16)).slice(-6);
						mistura(rx, ry, hex, 0.42 * (1 - dist / 70));
					}
				}
				// os reflexos coloridos compridos dos neons no asfalto (vermelho do lámen, dourado da agência, verde da farmácia...)
				[[72, '#ff4a3a', 30], [26, '#ff5a3a', 8], [118, '#ff5a3a', 8], [240, '#e8c46a', 60], [393, '#2aff8a', 20], [434, '#3ae0ff', 8], [454, '#ff3ab8', 8], [66, '#ff3ab8', 30]].forEach(function (q) {
					for (var ry2 = HORIZ + 14; ry2 < H; ry2++) for (var dx2 = -q[2] / 2; dx2 < q[2] / 2; dx2++) {
						var forca = (1 - (ry2 - HORIZ) / 60) * (1 - Math.abs(dx2) / (q[2] / 2)) * 0.35;
						if (ruido(q[0] + dx2, ry2 >> 1) > 0.3 && (ry2 % 3)) mistura(q[0] + dx2 + Math.round(Math.sin(ry2 * 0.9) * 1.5), ry2, q[1], forca);
					}
				});
				// poças mais claras, uma seta pintada e marcas de pneu
				[[110, 252, 18], [300, 262, 26], [460, 244, 14], [190, 230, 12]].forEach(function (q) { elip(q[0], q[1], q[2], 2, function (x2, y2) { mistura(x2, y2, '#8a90c8', 0.22); return null; }); });
				poli([[352, 258], [372, 258], [372, 255], [380, 260], [372, 265], [372, 262], [352, 262]], function (x2, y2) { mistura(x2, y2, '#d8d8e8', 0.22); return null; });
				// os postes de luz da calçada (cabeça ciano) e um hidrante
				[[140, '#3ae0ff'], [344, '#3ae0ff']].forEach(function (q) {
					ret(q[0], 150, 2, 64, '#2a2838'); ret(q[0], 150, 1, 64, '#5a5878'); ret(q[0] - 8, 148, 12, 3, '#2a2838'); ret(q[0] - 7, 151, 10, 1, q[1]);
					brilho(q[0] - 2, 154, 16, q[1], 0.25); elip(q[0] - 2, 214, 14, 2, function (x2, y2, u) { mistura(x2, y2, q[1], 0.18 * (1 - u * u)); return null; });
				});
				ret(328, 204, 6, 8, '#c83a3a'); ret(327, 203, 8, 2, '#e85a5a'); ret(326, 207, 2, 2, '#a82a2a'); ret(334, 207, 2, 2, '#a82a2a');
				// sacos de lixo na calçada, perto do lámen
				[[132, 207, '#1a1a22'], [126, 209, '#2a2a3a']].forEach(function (q) { elip(q[0], q[1], 5, 4, q[2]); px(q[0] - 2, q[1] - 3, '#5a5a6a'); });
				// a faixa de pedestres e um bueiro
				for (var fx = 150; fx < 340; fx += 16) ret(fx, 238, 9, 30, function (x2, y2) { mistura(x2, y2, '#d8d8e8', 0.28); return null; });
				elip(420, 250, 12, 3, '#0a0a12'); for (var gr = -10; gr <= 10; gr += 3) ret(420 + gr, 248, 1, 4, '#2a2a3a');
				letras('BIANCA CARDADOR', 360, 262, 1, '#5a5440'); // (a assinatura da autora, pintada no asfalto)
			});
			var k = paraCanvas(p), g = k.getContext('2d');
			if (simbImg) { g.imageSmoothingEnabled = false; g.drawImage(simbImg, OX + 156, 113, 32, 32); } // o símbolo do lado do nome, no tamanho certo (nítido)
			return k;
		},
		quadro: function (c, t) {
			if (this.cine && !this.mostrou) {
				var tc = (performance.now() - this.cine) / 1000;
				if (tc >= CINE_FIM) mostrarEntrar(this);
				else {
					var camC = cameraCine(tc);
					/* o corte suave: escurece no fim de cada plano e clareia já no seguinte */
					if (camC.plano !== this.planoAtual) {
						this.planoAtual = camC.plano; aplicarCine(camC); escurecer(0);
						if (camC.plano === PLANOS.length - 1) moverFaixas(0, 5); /* a rua inteira: as faixas recolhem devagar */
					}
					else if (camC.resta < ESCURO_CINE && camC.plano < PLANOS.length - 1) escurecer(1);
				}
			}
			// os telões dos prédios: cada um com seu anúncio mexendo
			TELAS.forEach(function (tl, i) {
				c.save(); c.beginPath(); c.rect(tl.x, tl.y, tl.w, tl.h); c.clip();
				if (tl.tipo === 'agencia') telaoAgencia(c, tl, t);
				else if (tl.tipo === 'gueixa') telaoGueixa(c, tl, t);
				else if (tl.tipo === 0) { anuncioIris(c, tl, t, i); /* o anúncio das lentes ÍRIS 9 */
				} else if (tl.tipo === 1) { // um letreiro correndo
					R(c, tl.x, tl.y, tl.w, tl.h, '#0a1a3a');
					var msg = 'VIAJE PARA SATURNO · ANDARILHA 2077 · ', off = Math.floor(t * 18) % (msg.length * 4 * 2);
					texto3(c, msg + msg, tl.x + 2 - off, tl.y + tl.h / 2 - 5, 2, '#3ae0ff');
					R(c, tl.x, tl.y, tl.w, 2, '#ff3ab8'); R(c, tl.x, tl.y + tl.h - 2, tl.w, 2, '#ff3ab8');
				} else { // barras de cor pulsando
					for (var b = 0; b < tl.w; b += 3) { var hgt = (Math.sin(t * 3 + b * 0.4 + i) * 0.5 + 0.5) * tl.h; R(c, tl.x + b, tl.y + tl.h - hgt, 2, hgt, b % 6 ? '#b05aff' : '#3ae0ff'); }
				}
				c.restore();
				c.globalAlpha = 0.18; R(c, tl.x - 2, tl.y - 2, tl.w + 4, tl.h + 4, tl.tipo === 'agencia' ? '#e8c46a' : '#ff3ab8'); c.globalAlpha = 1;
			});
			// os holofotes varrendo o céu lá de trás dos prédios
			c.save(); c.globalCompositeOperation = 'lighter';
			[[132, 0.7], [346, 1.1]].forEach(function (h, i) {
				var ang = -Math.PI / 2 + Math.sin(t * 0.35 * h[1] + i * 2) * 0.55, comp = 220;
				c.globalAlpha = 0.07; c.fillStyle = i ? '#9ad8ff' : '#ffb8e8';
				c.beginPath(); c.moveTo(h[0], 86); c.lineTo(h[0] + Math.cos(ang - 0.05) * comp, 86 + Math.sin(ang - 0.05) * comp); c.lineTo(h[0] + Math.cos(ang + 0.05) * comp, 86 + Math.sin(ang + 0.05) * comp); c.fill();
			});
			c.restore(); c.globalAlpha = 1;
			// o dirigível com telão passando devagar lá no alto, da esquerda para a direita: o nariz
			// redondo na frente (à direita), as aletas e a hélice girando atrás, a gôndola embaixo
			/* (o dirigível começa já do lado direito: nunca na frente do rosto da gueixa no primeiro plano) */
			var dz = ((t * 0.04 + 0.6) % 1.3) - 0.15, dxp = Math.round(-OX + dz * (W + 80) - 40), dyp = Math.round(12 + Math.sin(t * 0.5) * 1.5);
			c.globalAlpha = 0.05; c.fillStyle = '#c8e8ff'; c.beginPath(); c.moveTo(dxp + 2, dyp + 9); c.lineTo(dxp - 10, dyp + 70); c.lineTo(dxp + 16, dyp + 70); c.fill(); c.globalAlpha = 1; /* o facho de luz da gôndola */
			R(c, dxp - 27, dyp - 8, 6, 6, '#22243a'); R(c, dxp - 26, dyp - 8, 4, 1, '#3a3c58'); R(c, dxp - 27, dyp + 2, 6, 5, '#1a1c2c'); /* as aletas de cima e de baixo */
			R(c, dxp - 29, dyp - 1, 7, 3, '#22243a');
			var helice = Math.floor(t * 20) % 3; R(c, dxp - 31, dyp + (helice === 0 ? -3 : helice === 1 ? -1 : 0), 1, helice === 1 ? 6 : 4, '#8a8ea8'); P(c, dxp - 30, dyp + 1, '#5a5e7a');
			c.fillStyle = '#1a1c30'; c.beginPath(); c.ellipse(dxp, dyp, 24, 7, 0, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#2a2c44'; c.beginPath(); c.ellipse(dxp + 3, dyp - 2, 19, 4, 0, 0, Math.PI * 2); c.fill();
			R(c, dxp + 14, dyp - 4, 6, 1, '#4a4e6a'); /* o brilho no nariz */
			R(c, dxp - 14, dyp - 2, 28, 5, '#08040e');
			c.save(); c.beginPath(); c.rect(dxp - 14, dyp - 2, 28, 5); c.clip(); texto3(c, 'VIAJE · SATURNO · SIRIUS · ', dxp - 14 - (Math.floor(t * 10) % 48), dyp - 2, 1, '#ff3ab8'); c.restore();
			R(c, dxp - 6, dyp + 7, 12, 3, '#14152a'); R(c, dxp - 5, dyp + 8, 10, 1, '#ffd890'); P(c, dxp - 2, dyp + 8, '#14152a'); P(c, dxp + 2, dyp + 8, '#14152a'); /* a gôndola com as janelinhas acesas */
			if (Math.sin(t * 4) > 0.6) P(c, dxp + 24, dyp, '#ffffff'); /* a luz branca no nariz, na frente */
			if (Math.sin(t * 4 + 2) > 0.6) P(c, dxp - 30, dyp - 8, '#ff3a3a'); /* e a vermelha na cauda */
			// o letreiro correndo da farmácia
			R(c, 356, 152, 112, 6, '#04140c');
			c.save(); c.beginPath(); c.rect(356, 152, 112, 6); c.clip(); texto3(c, 'ABERTO 24H · REMÉDIO PARA ENJOO DE HIPERESPAÇO · ', 356 - (Math.floor(t * 16) % 200), 152, 1, '#3aff9a'); c.restore();
			// os carros voadores passando em três alturas, com farol e lanterna
			for (var n = 0; n < 5; n++) {
				var per = 7 + n * 2.3, u = ((t + n * 3.1) % per) / per, ida = n % 2 ? -1 : 1;
				var vx = ida > 0 ? -OX - 30 + u * (W + 60) : NUCLEO + OX + 30 - u * (W + 60), vy = [24, 48, 74, 36, 92][n], esc = n > 2 ? 1 : 2;
				for (var r2 = 1; r2 < 12; r2++) P(c, vx - ida * r2 * 2, vy, r2 < 4 ? 'rgba(255,255,255,0.6)' : 'rgba(255,90,140,0.3)');
				R(c, vx - 4 * esc, vy - 1, 8 * esc, 2 * esc, '#2a2a3e'); R(c, vx - 2 * esc, vy - 2, 4 * esc, 1, '#5a5e7a');
				R(c, vx + ida * 4 * esc, vy, 1, 1, '#ffffff'); R(c, vx - ida * 4 * esc, vy, 1, 1, '#ff3a3a');
			}
			// as janelas dos apartamentos: a TV piscando de cor, o monitor rolando e os peixinhos do aquário
			JANELAS.forEach(function (jn, ij) {
				if (jn.tipo === 'tv') { var cena2 = Math.floor(t * 0.8 + ij) % 4; R(c, jn.x, jn.y, 3, 2, ['#5ab8ff', '#ff8a5a', '#8aff9a', '#ffe08a'][cena2]); if (Math.sin(t * 9 + ij) > 0.6) R(c, jn.x, jn.y, 3, 2, 'rgba(255,255,255,0.4)'); }
				else if (jn.tipo === 'pc') { R(c, jn.x, jn.y, 4, 3, '#9ad8ff'); R(c, jn.x + 1, jn.y + (Math.floor(t * 2 + ij) % 3), 2, 1, '#2a4a7a'); }
				else { P(c, jn.x + 1 + Math.round((Math.sin(t * 0.9 + ij) + 1) * 2.5), jn.y + 1, '#ff8a3a'); P(c, jn.x + 1 + Math.round((Math.cos(t * 0.7 + ij) + 1) * 2.5), jn.y + 2, '#ffe08a'); }
			});
			// os detalhes pequenos da rua (cada plano da câmera tem alguma coisa se mexendo de perto)
			// as luzes vermelhas das antenas no alto dos prédios, piscando devagar (aviso para os carros voadores)
			[[-OX + (128 + OX) * 0.7, 59, 0], [352 + (NUCLEO + OX - 352) * 0.7, 69, 1.1]].forEach(function (an) {
				if (Math.sin(t * 2.2 + an[2]) > 0.2) { c.globalAlpha = 0.35; R(c, an[0] - 1, an[1] - 1, 3, 3, '#ff3a5a'); c.globalAlpha = 1; P(c, an[0], an[1], '#ffb0b8'); }
			});
			// o drone de entrega passando embaixo do telão da gueixa, com a caixinha pendurada
			var udr = (t % 13) / 13, drx = -OX - 10 + udr * (200 + OX), dry = 96 + Math.sin(t * 1.6) * 3;
			R(c, drx - 3, dry, 7, 2, '#2a2c3e'); R(c, drx - 2, dry - 1, 5, 1, '#5a5e7a');
			var rot = Math.floor(t * 30) % 2; R(c, drx - 5 + rot, dry - 1, 2, 1, '#a8acc4'); R(c, drx + 4 - rot, dry - 1, 2, 1, '#a8acc4');
			P(c, drx, dry + 2, '#5a5e7a'); P(c, drx, dry + 3, '#5a5e7a'); R(c, drx - 1, dry + 4, 3, 3, '#c8885a'); P(c, drx - 1, dry + 4, '#e8a870');
			if (Math.sin(t * 9) > 0) P(c, drx + 3, dry + 1, '#3aff8a'); else P(c, drx - 3, dry + 1, '#ff3a3a');
			// as gotas pingando: da moldura do telão, do toldo do lámen e da marquise da agência
			[[28, 106, 87, 150, 5], [18, 126, 153, 212, 7], [198, 282, 157, 212, 6]].forEach(function (bd, ib) {
				for (var gi = 0; gi < bd[4]; gi++) {
					var gx0 = bd[0] + Math.floor(ruido(gi, ib + 40) * (bd[1] - bd[0])), per2 = 1.4 + ruido(gi, ib + 41) * 1.2, f = ((t / per2) + ruido(gi, ib + 42)) % 1;
					if (f < 0.45) { if (f > 0.2) P(c, gx0, bd[2] + 1, 'rgba(184,208,255,0.8)'); continue; } /* a gota crescendo na beirada */
					var qd = (f - 0.45) * per2, gy0 = bd[2] + 1 + 160 * qd * qd;
					if (gy0 < bd[3]) R(c, gx0, gy0, 1, 2, 'rgba(184,208,255,0.75)');
					else if (gy0 < bd[3] + 10) { P(c, gx0 - 1, bd[3] - 1, 'rgba(184,208,255,0.6)'); P(c, gx0 + 1, bd[3] - 1, 'rgba(184,208,255,0.6)'); } /* o respingo */
				}
			});
			// o gato preto em cima dos sacos de lixo, abanando o rabo e piscando
			R(c, 126, 199, 6, 5, '#0c0a12'); R(c, 130, 195, 4, 4, '#0c0a12'); P(c, 130, 194, '#0c0a12'); P(c, 133, 194, '#0c0a12');
			if ((t % 5) > 0.15) { P(c, 131, 196, '#c8ff6a'); P(c, 133, 196, '#c8ff6a'); }
			for (var rb = 0; rb < 6; rb++) P(c, 125 - Math.round(Math.sin(rb * 0.5) * 2), 203 - rb + Math.round(Math.sin(t * 2.4 + rb * 0.6) * rb * 0.4), '#0c0a12');
			// o cozinheiro mexendo a panela com a concha
			/* o rosto do cozinheiro: os olhinhos (que piscam e olham para a panela de vez em quando) e o sorriso */
			var olhaPanela = (t % 6) > 3.5 ? 1 : 0;
			if ((t % 4.3) > 0.15) { P(c, 56 + olhaPanela, 167 + olhaPanela, '#1a1418'); P(c, 60 + olhaPanela, 167 + olhaPanela, '#1a1418'); }
			else { P(c, 56 + olhaPanela, 168, '#8a5a3a'); P(c, 60 + olhaPanela, 168, '#8a5a3a'); }
			P(c, 57, 170, '#a0603a'); P(c, 58, 170, '#a0603a'); P(c, 59, 170, '#a0603a');
			var conc = Math.sin(t * 2.6) * 1.5;
			R(c, 63, 176, 5, 2, '#f2eee8'); P(c, 68, 177, '#d8a070'); linhaGrossa(c, [69, 177], [73, 180 + conc], 1, '#a8acb8'); R(c, 72, 181 + conc, 3, 2, '#c8ccd8');
			// a cliente do banquinho: a cabeça abaixa de vez em quando para comer, e o vapor da tigela sobe
			var come = (t % 4) < 1.2 ? 1 : 0;
			R(c, 88, 170 + come, 9, 8, '#1a1418'); R(c, 89, 169 + come, 7, 1, '#1a1418'); R(c, 89, 170 + come, 3, 1, '#3a2a24'); /* o cabelo, com brilho */
			R(c, 91, 166 + come, 3, 3, '#1a1418'); P(c, 92, 166 + come, '#3a2a24'); R(c, 90, 168 + come, 5, 1, '#ff3ab8'); /* o coque com o elástico rosa */
			P(c, 87, 174 + come, '#c8906a'); P(c, 97, 174 + come, '#a06a48'); /* as orelhas */
			for (var vt = 0; vt < 3; vt++) { var fv = ((t * 0.7 + vt / 3) % 1); c.globalAlpha = (1 - fv) * 0.4; P(c, 99 + Math.sin(fv * 6 + vt) * 1.5, 186 - fv * 12, '#ffffff'); } c.globalAlpha = 1;
			R(c, 99, 187, 5, 3, '#c83a2a'); R(c, 99, 187, 5, 1, '#f2e0c0'); /* a tigela de lámen */
			// as lanternas vermelhas do lámen respirando
			c.save(); c.globalCompositeOperation = 'lighter';
			[[26, 146], [118, 146]].forEach(function (q, i) { c.globalAlpha = 0.12 + Math.sin(t * 1.8 + i) * 0.06; c.fillStyle = '#ff5a3a'; c.beginPath(); c.arc(q[0], q[1], 9, 0, Math.PI * 2); c.fill(); });
			c.restore(); c.globalAlpha = 1;
			// um letreiro vertical com mau contato: de vez em quando ele falha e volta
			var falha = t % 11; if ((falha > 3 && falha < 3.12) || (falha > 3.25 && falha < 3.32) || (falha > 3.45 && falha < 3.9)) { c.globalAlpha = 0.75; R(c, 112, 71, 7, 47, '#0a0814'); c.globalAlpha = 1; }
			// as mariposas rodeando a luz dos postes
			[138, 342].forEach(function (lx, i) { for (var mo = 0; mo < 3; mo++) P(c, lx + Math.sin(t * (6 + mo) + mo * 2 + i) * 6, 153 + Math.cos(t * (4.5 + mo * 1.3) + mo) * 3, mo ? '#fff4c8' : '#d8c8a8'); });
			// a câmera de segurança da agência virando devagar, com a luzinha vermelha
			var cmv = Math.round(Math.sin(t * 0.5) * 1); R(c, 334, 150, 6, 3, '#2a2c34'); R(c, 338 + cmv, 151, 3, 2, '#5a5e6a'); if ((t % 2) < 1) P(c, 339 + cmv, 152, '#ff3a3a');
			// o robozinho de limpeza indo e voltando na calçada da farmácia, deixando o chão brilhando
			var ida2 = (t * 12) % 220, rbx = 360 + (ida2 < 110 ? ida2 : 220 - ida2), rdir = ida2 < 110 ? 1 : -1;
			c.globalAlpha = 0.25; R(c, rdir > 0 ? rbx - 14 : rbx + 5, 219, 10, 1, '#9ad8ff'); c.globalAlpha = 1;
			R(c, rbx - 4, 214, 9, 4, '#c8ccd8'); R(c, rbx - 3, 213, 7, 1, '#e8ecf4'); R(c, rbx - 4, 216, 9, 1, '#3ae0ff'); R(c, rbx - 3, 218, 2, 1, '#2a2a3a'); R(c, rbx + 2, 218, 2, 1, '#2a2a3a');
			P(c, rbx + rdir * 5, 218 - (Math.floor(t * 12) % 2), '#a8acc4'); /* a escovinha girando */
			if ((t % 1) < 0.5) P(c, rbx, 212, '#ffd36a');
			// as baleias holográficas (mãe e filhote) nadando devagar no céu, da direita para a esquerda,
			// lá longe: passam por trás do prédio da agência e dos telões da Andarilha (nunca na frente deles)
			c.save();
			c.beginPath(); c.rect(-OX, 0, W, H); c.rect(144, 20, 192, 200); TELAS.forEach(function (tl) { if (tl.tipo === 1) c.rect(tl.x - 2, tl.y - 2, tl.w + 4, tl.h + 4); }); c.clip('evenodd');
			c.globalCompositeOperation = 'lighter';
			var volta2 = W + 300, ciclo2 = ((((t - BALEIA_DESL) * 6) % volta2) + volta2) % volta2, bx0 = NUCLEO + OX + 30 - ciclo2;
			/* a mãe: batidas lentas (uma a cada 5 s), um leve avanço a cada batida e o corpo subindo e descendo devagar */
			var maeX = bx0 + Math.sin(t * Math.PI * 2 / 5) * 1.5, maeY = 46 + Math.sin(t * 0.21) * 5;
			baleia(c, maeX, maeY, t, { L: 112, rgb: [110, 215, 255], batida: 5, fase: 0, alfa: 1 });
			/* o filhote nada colado nela, por cima das costas, perto da nadadeira peitoral (no "vácuo" da mãe):
			   bate a cauda mais rápido, se afasta um pouquinho e volta */
			var filX = maeX + 26 + Math.sin(t * 0.37) * 9, filY = maeY - 22 + Math.sin(t * 0.53 + 1) * 2.5;
			baleia(c, filX, filY, t, { L: 54, rgb: [200, 160, 255], batida: 2.6, fase: 1.3, alfa: 1 });
			c.restore(); c.globalAlpha = 1;
			// o relâmpago lá longe, de vez em quando: o céu e a rua inteira clareiam duas vezes, rapidinho
			var rel = t % 17;
			if (!calmo && ((rel > 9 && rel < 9.07) || (rel > 9.2 && rel < 9.3))) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.16; R(c, -OX, 0, W, 200, '#b8a8ff'); c.restore(); c.globalAlpha = 1; }
			// o neon do letreiro da agência zumbindo: de vez em quando o brilho dourado pulsa (um halo
			// redondo e somado à luz, sem borda nenhuma, para não aparecer caixa em volta do nome)
			var zum = Math.sin(t * 13) > 0.9 ? 1 : 0.35 + Math.sin(t * 2.1) * 0.1;
			c.save(); c.globalCompositeOperation = 'lighter';
			var halo = c.createRadialGradient(240, 129, 4, 240, 129, 100);
			halo.addColorStop(0, 'rgba(255,214,130,' + 0.16 * zum + ')'); halo.addColorStop(1, 'rgba(255,190,90,0)');
			c.translate(240, 129); c.scale(1, 0.3); c.translate(-240, -129);
			c.fillStyle = halo; c.beginPath(); c.arc(240, 129, 100, 0, Math.PI * 2); c.fill();
			c.restore();
			// vapor saindo do bueiro e da panela do lámen
			for (var v = 0; v < 26; v++) {
				var kv = ((t * 0.3 + v / 26) % 1), sxv = 420 + Math.sin(v * 2 + t) * 6 + kv * 10, syv = 248 - kv * 50;
				c.globalAlpha = (1 - kv) * 0.25; R(c, sxv, syv, 3 + kv * 4, 2, '#d8d0e8');
				var lxv = 60 + Math.sin(v + t) * 10, lyv = 186 - kv * 40; c.globalAlpha = (1 - kv) * 0.2; R(c, lxv, lyv, 2 + kv * 3, 2, '#ffe0c8');
			}
			c.globalAlpha = 1;
			// a porta de vidro: duas folhas que deslizam quando o piloto entra
			var abre = this.abrindo ? Math.min(1, (performance.now() - this.abrindo) / 800) : 0, e = abre * abre * (3 - 2 * abre);
			var meio = (PORTA_F.x0 + PORTA_F.x1) / 2, larg = (PORTA_F.x1 - PORTA_F.x0) / 2, desl = Math.round(e * larg);
			c.save(); c.beginPath(); c.rect(PORTA_F.x0, PORTA_F.y0, PORTA_F.x1 - PORTA_F.x0, PORTA_F.y1 - PORTA_F.y0); c.clip();
			[-1, 1].forEach(function (l) {
				var x0 = l < 0 ? PORTA_F.x0 - desl : meio + desl;
				c.globalAlpha = 0.5; R(c, x0, PORTA_F.y0, larg, PORTA_F.y1 - PORTA_F.y0, '#9ad0f0'); c.globalAlpha = 1;
				R(c, x0, PORTA_F.y0, larg, 2, '#e8c46a'); R(c, x0, PORTA_F.y1 - 3, larg, 3, '#c8a040'); R(c, l < 0 ? x0 + larg - 2 : x0, PORTA_F.y0, 2, PORTA_F.y1 - PORTA_F.y0, '#c8a040');
				R(c, x0 + 4, PORTA_F.y0 + 6, 2, 28, 'rgba(255,255,255,0.6)');
			});
			if (!abre) { c.strokeStyle = '#e8c46a'; c.lineWidth = 1; c.beginPath(); c.arc(meio, PORTA_F.y0 + 14, 5, 0, Math.PI * 2); c.stroke(); }
			c.restore();
			c.globalAlpha = 0.1 + e * 0.3; c.fillStyle = '#ffe8b0';
			c.beginPath(); c.moveTo(PORTA_F.x0, PORTA_F.y1); c.lineTo(PORTA_F.x1, PORTA_F.y1); c.lineTo(PORTA_F.x1 + 24, H); c.lineTo(PORTA_F.x0 - 24, H); c.fill(); c.globalAlpha = 1;
			// gente passando na calçada, na frente da porta da agência (guarda-chuvas de cabo aceso, capa de chuva de LED)
			PEDESTRES.forEach(function (pd) {
				var up = ((t + pd.ini) % pd.per) / pd.per, gx = pd.lado > 0 ? -OX - 14 + up * (W + 28) : NUCLEO + OX + 14 - up * (W + 28);
				pedestre(c, gx, 221, pd.lado, t, pd);
			});
			// os carros flutuantes passando nas duas faixas da rua
			FAIXAS.forEach(function (fx2) {
				var vao = (W + 260) / fx2.carros.length;
				fx2.carros.forEach(function (nome, ic) {
					var pos = (t * fx2.vel + ic * vao) % (W + 260), cxr = fx2.lado > 0 ? -OX - 130 + pos : NUCLEO + OX + 130 - pos, m = MODELOS[nome];
					carroRua(c, m, Math.round(cxr), fx2.chao, fx2.lado, t + ic);
				});
			});
			// a chuva: riscos finos caindo na diagonal, e as gotas respingando nas poças
			for (var gch = 0; gch < 140; gch++) {
				var semente = gch * 13.7, gxx = ((ruido(gch, 1) * (W + 60) + t * 40) % (W + 60)) - OX - 30, gyy = (ruido(gch, 2) * 300 + t * (220 + ruido(gch, 3) * 80)) % 300 - 20;
				c.globalAlpha = 0.25 + ruido(gch, 4) * 0.3; R(c, gxx + gyy * 0.18, gyy, 1, 5, '#b8d0ff');
			}
			for (var sp = 0; sp < 12; sp++) {
				var ciclo = (t * 1.5 + sp * 0.37) % 1, spx = ((ruido(sp, Math.floor(t * 1.5 + sp * 0.37)) * W) - OX), spy = 228 + ruido(sp + 9, Math.floor(t * 1.5 + sp * 0.37)) * 40;
				c.globalAlpha = (1 - ciclo) * 0.5; c.strokeStyle = '#b8d0ff'; c.beginPath(); c.ellipse(spx, spy, 1 + ciclo * 5, 0.5 + ciclo * 1.5, 0, 0, Math.PI * 2); c.stroke();
			}
			c.globalAlpha = 1;
		},
		entrar: function () {
			var cena0 = this; cena0.abrindo = 0; cena0.cine = 0; cena0.mostrou = false; cena0.planoAtual = -1;
			// antes de tudo, os créditos na tela preta ("feito por Bianca Cardador"), que somem devagar;
			// depois, um toque para começar (é ele que libera o som no navegador)
			// (os créditos estão ocultos por enquanto, a pedido da Bianca: voltam no fim do projeto;
			// para mostrar de novo, troque CREDITOS para true)
			var CREDITOS = false;
			escurecer(1);
			if (CREDITOS) {
				var cred = document.createElement('div');
				cred.className = 'emb-creditos';
				cred.innerHTML = '<small>' + T('feito por', 'made by') + '</small><strong>Bianca Cardador</strong><i aria-hidden="true">✦</i>';
				palco.appendChild(cred);
				depois(function () { cred.remove(); }, calmo ? 0 : 5200);
			}
			depois(function () {
				botao('&#9654; ' + T('Começar a viagem', 'Begin the journey'), 240, 128, comecar, 'grande');
				/* embaixo dele, a escolha do idioma (trocar recarrega a página e volta para esta tela) */
				var esc = document.createElement('div');
				esc.className = 'emb-idioma'; esc.setAttribute('role', 'group'); esc.setAttribute('aria-label', T('Idioma', 'Language'));
				pos(esc, 240, 168);
				[['pt', 'Português'], ['en', 'English']].forEach(function (l) {
					var bi = document.createElement('button');
					bi.type = 'button'; bi.textContent = l[1]; bi.lang = l[0] === 'en' ? 'en' : 'pt-BR';
					bi.setAttribute('aria-pressed', (window.IDIOMA || 'pt') === l[0] ? 'true' : 'false');
					bi.addEventListener('click', function () { if (window.trocarIdioma) window.trocarIdioma(l[0]); });
					esc.appendChild(bi);
				});
				camada.appendChild(esc);
			}, calmo || !CREDITOS ? 0 : 5000);
			function comecar() {
				iniciarAudio();
				/* o primeiro plano começa com a gueixa normal, mostra o gole e termina no sorriso */
				GUEIXA_DESL = (performance.now() - inicioCena) / 1000 - 2.0;
				var tPlano2 = (performance.now() - inicioCena) / 1000 + PLANOS[0][0], centro2 = Math.min(PLANOS[1][1], W - OX - W / (2 * PLANOS[1][3]));
				BALEIA_DESL = tPlano2 - (NUCLEO + OX + 30 - (centro2 - 30)) / 6;
				if (audio && audio.state === 'suspended') audio.resume();
				ligarAmbienteChuva();
				limpar(); escuro.style.transition = 'opacity ' + ESCURO_CINE + 's ease-in-out'; aplicarCine(cameraCine(0)); escurecer(0);
				cena0.cine = performance.now(); raiz.classList.add('cinema'); moverFaixas(9, 0.8); depois(function () { capitulo('I', T('A rua da agência', 'The agency street')); }, 1200);
				// um clique durante o passeio da câmera pula direto para o final
				var pular = alvoClicavel(-OX, 0, W, H, T('Pular a apresentação', 'Skip the intro'), function () { cena0.cine = performance.now() - CINE_FIM * 1000; });
				pular.classList.add('emb-alvo-cheio');
				depois(function () { mostrarEntrar(cena0); }, CINE_FIM * 1000);
			}
		}
	};
	// a apresentação da rua: uma sequência de planos parados (a câmera não se mexe), ligados por
	// cortes suaves e lentos (a tela escurece até o preto e volta já no plano seguinte). Cada plano mostra um
	// pedaço da vida nessa cidade do futuro: [duração, x, y, zoom], com x e y no miolo (o centro da tela).
	var PLANOS = [
		[7.8, 66, 40, 3.4],    /* o telão da gueixa: normal, depois o gole do chá Hoshi e o sorriso, com a chuva na frente */
		[5.6, 452, 50, 2.3],   /* o céu da cidade: as baleias holográficas, as torres e os carros voadores */
		[4.2, 24, 116, 3.5],   /* as janelas dos apartamentos (gente vendo TV, o gato, o aquário...) */
		[4.4, 66, 168, 3.0],   /* o bar de lámen com o cozinheiro */
		[3.8, 124, 202, 5.0],  /* o gato preto no lixo, com as gotas pingando do toldo */
		[4.4, 120, 218, 2.6],  /* a rua: os carros passando e as poças refletindo os neons */
		[4.2, 410, 186, 2.8],  /* a farmácia, as máquinas e o robozinho de limpeza */
		[4.4, 240, 66, 2.8],   /* o telão da agência */
		[4.2, 240, 166, 2.3],  /* o letreiro dourado e a porta */
		[5.2, 240, 135, 1]     /* a rua inteira */
	];
	var ESCURO_CINE = 0.9; /* segundos para escurecer (e para clarear de novo) em cada corte */
	var CINE_FIM = PLANOS.reduce(function (s2, p) { return s2 + p[0]; }, 0);
	function cameraCine(t) {
		var ini = 0, i = 0;
		while (i < PLANOS.length - 1 && t > ini + PLANOS[i][0]) { ini += PLANOS[i][0]; i++; }
		return { x: PLANOS[i][1], y: PLANOS[i][2], z: PLANOS[i][3], plano: i, resta: ini + PLANOS[i][0] - t };
	}
	function aplicarCine(cam) {
		var cw = palco.clientWidth, ch = palco.clientHeight, k = cw / W, z = cam.z;
		var tx = cw / 2 - (cam.x + OX) * k * z, ty = ch / 2 - cam.y * k * z;
		tx = Math.min(0, Math.max(cw - cw * z, tx)); ty = Math.min(0, Math.max(ch - ch * z, ty));
		tela.style.transformOrigin = '0 0'; tela.style.transform = 'translate(' + tx + 'px, ' + ty + 'px) scale(' + z + ')';
	}
	function mostrarEntrar(cena0) {
		if (cena0.mostrou) return; cena0.mostrou = true;
		limpar(); escuro.style.transition = ''; aplicarCine({ x: 240, y: 135, z: 1 }); escurecer(0);
		/* as faixas pretas de cinema recolhem devagar */
		raiz.classList.remove('cinema'); if (faixaAlvo !== 0) moverFaixas(0, 2.8); /* (se pulou a apresentação) */
		botao('&#9654; ' + T('Entrar na agência', 'Enter the agency'), 240, 232, function () {
			limpar(); cena0.abrindo = performance.now(); SONS.portaVidro(); depois(SONS.passos, 300);
			depois(function () { irPara('recepcao'); }, 900);
		}, 'grande');
	}
	// o telão gigante da gueixa (uma homenagem aos anúncios de Blade Runner): penteado alto com grampos
	// dourados e flores, rosto claro, lábios vermelhos, quimono vermelho; ela pisca, sorri e toma chá
	var BALEIA_DESL = 0; /* acerta as baleias para o segundo plano da apresentação pegar as duas nadando no meio do céu */
	// o anúncio das lentes de contato com luz ÍRIS 9 (um retrato de moda, como os telões de Blade Runner):
	// uma moça de cabelo chanel com mecha ciano, um olho normal e o outro com a lente acesa, que pisca,
	// solta um anel de varredura e muda de cor; atrás, o halo e a grade; embaixo, a marca e o slogan
	function anuncioIris(c, tl, t, i) {
		var x = tl.x, y = tl.y, w = tl.w, h = tl.h, faixa = 8;
		var fundo = c.createLinearGradient(0, y, 0, y + h); fundo.addColorStop(0, '#3a0a4a'); fundo.addColorStop(1, '#0a1a4a'); c.fillStyle = fundo; c.fillRect(x, y, w, h);
		c.globalAlpha = 0.25; for (var gx = x + ((t * 4) % 6); gx < x + w; gx += 6) R(c, gx, y, 1, h - faixa, '#b05aff'); c.globalAlpha = 1; /* a grade correndo */
		var ox = Math.round(x + w / 2 - 10), oy = Math.round(y + Math.max(1, (h - faixa - 26) / 2));
		var lente = ['#7fe3ff', '#ff6ad8', '#ffd36a'][Math.floor((t + i) / 3) % 3];
		c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + Math.sin(t * 2) * 0.08; c.fillStyle = lente; c.beginPath(); c.arc(ox + 10, oy + 12, 12, 0, Math.PI * 2); c.fill(); c.restore(); c.globalAlpha = 1;
		function Q(a, b, cw, ch, cor) { R(c, ox + a, oy + b, cw, ch, cor); }
		/* os ombros, a jaqueta com a gola de neon e o pescoço */
		Q(2, 22, 16, 4, '#2a1a4a'); Q(4, 21, 12, 1, '#2a1a4a'); Q(7, 21, 6, 1, '#ff3ab8'); Q(8, 19, 4, 3, '#d8a088');
		/* o cabelo chanel atrás do rosto, com a mecha ciano */
		Q(4, 0, 12, 1, '#1a0a2a'); Q(2, 1, 16, 2, '#1a0a2a'); Q(1, 3, 18, 15, '#1a0a2a'); Q(2, 18, 4, 2, '#1a0a2a'); Q(14, 18, 4, 2, '#1a0a2a');
		[[3, 3], [3, 4], [2, 5], [2, 6], [2, 7], [2, 8], [3, 9]].forEach(function (m) { Q(m[0], m[1], 1, 1, '#3ae0ff'); }); Q(7, 1, 4, 1, '#3a2a5a');
		/* o rosto, com a franja de lado */
		Q(5, 5, 10, 11, '#f2c8b0'); Q(6, 16, 8, 1, '#f2c8b0'); Q(7, 17, 6, 1, '#e8b8a0'); Q(14, 7, 1, 9, '#d8a088'); Q(13, 16, 1, 1, '#d8a088');
		Q(4, 3, 12, 2, '#1a0a2a'); Q(4, 5, 5, 1, '#1a0a2a'); Q(4, 6, 3, 1, '#1a0a2a'); Q(4, 7, 1, 1, '#1a0a2a');
		/* as sobrancelhas, o olho normal (que pisca) e o olho com a lente ÍRIS acesa */
		Q(6, 8, 3, 1, '#3a1a2a'); Q(11, 8, 3, 1, '#3a1a2a');
		if ((t + i * 1.7) % 4.2 > 0.14) { Q(6, 9, 3, 1, '#1a0a2a'); Q(6, 10, 3, 1, '#ffffff'); Q(7, 10, 1, 1, '#3a1a2a'); }
		else Q(6, 10, 3, 1, '#3a1a2a');
		Q(11, 9, 3, 1, '#1a0a2a'); Q(11, 10, 3, 1, '#ffffff'); Q(12, 10, 1, 1, lente);
		c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.6; Q(11, 10, 3, 1, lente); c.restore(); c.globalAlpha = 1;
		var anel = (t * 0.7 + i * 0.3) % 1; /* o anel de varredura saindo da lente */
		c.globalAlpha = (1 - anel) * 0.8; c.strokeStyle = lente; c.lineWidth = 1; c.beginPath(); c.arc(ox + 12.5, oy + 10.5, 1 + anel * 7, 0, Math.PI * 2); c.stroke(); c.globalAlpha = 1;
		Q(15, 10, 1, 1, lente); Q(15, 12, 1, 1, lente); Q(14, 11, 1, 1, '#5ab8d8'); /* o implante na têmpora */
		/* o nariz, as bochechas, a boca e o brinco */
		Q(10, 12, 1, 1, '#d8a088'); Q(6, 13, 1, 1, '#f08aa0'); Q(13, 13, 1, 1, '#f08aa0');
		Q(8, 14, 4, 1, '#e8306a'); Q(9, 15, 2, 1, '#c82050'); Q(9, 14, 1, 1, '#ff7a9a');
		Q(4, 12, 1, 1, '#ffd36a'); Q(4, 13, 1, 2, Math.sin(t * 3 + i) > 0 ? '#ffd36a' : '#c8a040');
		/* a faixa de baixo: a marca e o slogan, se revezando */
		R(c, x, y + h - faixa, w, faixa, '#0a0418'); R(c, x, y + h - faixa, w, 1, lente);
		c.save(); c.beginPath(); c.rect(x, y + h - faixa + 1, w, faixa - 1); c.clip();
		var msg = 'ÍRIS 9 · LENTES DE LUZ · ', passo = msg.length * 4;
		texto3(c, msg + msg, x + 1 - (Math.floor(t * 10 + i * 7) % passo), y + h - faixa + 2, 1, '#ffffff');
		c.restore();
		for (var sl = y; sl < y + h; sl += 2) { c.globalAlpha = 0.12; R(c, x, sl, w, 1, '#000000'); } c.globalAlpha = 1;
	}
	var GUEIXA_DESL = 0; /* acerta o relógio da gueixa para o primeiro plano da apresentação pegar o ciclo inteiro */
	function telaoGueixa(c, tl, t) {
		var x = tl.x, y = tl.y, w = tl.w, h = tl.h, cx = x + w / 2, ciclo = (((t - GUEIXA_DESL) % 9) + 9) % 9, levanta = ciclo > 5.1 && ciclo < 6.9, sorri = ciclo > 7.6 && ciclo < 8.9; // (levanta = o gole, com a tigela na boca; sorri = o "hum!" depois)
		// (o fundo: céu azul-noite com um grande sol rosado atrás dela, para o quimono vermelho aparecer)
		var fundo = c.createLinearGradient(0, y, 0, y + h); fundo.addColorStop(0, '#0e1a4a'); fundo.addColorStop(1, '#2a3a7a'); c.fillStyle = fundo; c.fillRect(x, y, w, h);
		c.fillStyle = '#ff9ab8'; c.beginPath(); c.arc(cx, y + 36, 30, 0, Math.PI * 2); c.fill();
		c.fillStyle = '#ffc8d8'; c.beginPath(); c.arc(cx, y + 36, 26, 0, Math.PI * 2); c.fill();
		for (var nu = 0; nu < 3; nu++) R(c, x + 6 + nu * 22, y + 56 + nu * 4, 18, 2, 'rgba(255,255,255,0.35)'); // nuvenzinhas estilizadas
		for (var k = 0; k < 6; k++) { c.globalAlpha = 0.25; R(c, x + 4, y + 6 + k * 12, 6, 8, '#ffd36a'); } c.globalAlpha = 1; // letras correndo do lado
		// o quimono: gola em camadas (vermelho, branco, dourado)
		c.fillStyle = '#a81a3a'; c.beginPath(); c.moveTo(cx - 34, y + h); c.lineTo(cx - 14, y + 58); c.lineTo(cx + 14, y + 58); c.lineTo(cx + 34, y + h); c.fill();
		c.fillStyle = '#f2eee8'; c.beginPath(); c.moveTo(cx - 12, y + 58); c.lineTo(cx, y + 74); c.lineTo(cx + 12, y + 58); c.lineTo(cx + 8, y + 58); c.lineTo(cx, y + 68); c.lineTo(cx - 8, y + 58); c.fill();
		R(c, cx - 30, y + 72, 60, 3, '#e8c46a');
		// o pescoço e o rosto branco
		R(c, cx - 5, y + 48, 10, 12, '#f0e4e0');
		c.fillStyle = '#f8f0ec'; c.beginPath(); c.ellipse(cx, y + 38, 14, 17, 0, 0, Math.PI * 2); c.fill();
		c.fillStyle = '#ffd8d8'; c.globalAlpha = 0.6; c.beginPath(); c.ellipse(cx - 8, y + 43, 3, 2, 0, 0, Math.PI * 2); c.ellipse(cx + 8, y + 43, 3, 2, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
		// o penteado alto preto, com os grampos dourados e as flores vermelhas
		c.fillStyle = '#0e0a14'; c.beginPath(); c.ellipse(cx, y + 24, 18, 11, 0, Math.PI, 0); c.fill();
		c.beginPath(); c.ellipse(cx, y + 14, 13, 9, 0, 0, Math.PI * 2); c.fill();
		c.beginPath(); c.ellipse(cx - 16, y + 30, 5, 9, 0.3, 0, Math.PI * 2); c.ellipse(cx + 16, y + 30, 5, 9, -0.3, 0, Math.PI * 2); c.fill();
		R(c, cx - 7, y + 10, 14, 1, '#3a3050'); // o brilho do cabelo
		[[-14, 6, -1], [14, 6, 1]].forEach(function (g) { c.strokeStyle = '#e8c46a'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx + g[0] * 0.5, y + 16); c.lineTo(cx + g[0] * 1.6, y + g[1]); c.stroke(); R(c, cx + g[0] * 1.6 - 1, y + g[1] - 1, 3, 3, '#ffd36a'); for (var pd = 0; pd < 3; pd++) R(c, cx + g[0] * 1.6 + g[2] * 2, y + g[1] + 3 + pd * 3, 1, 2, '#e8c46a'); });
		[[-10, 20], [9, 19], [-3, 8]].forEach(function (f) { c.fillStyle = '#ff3a5a'; c.beginPath(); c.arc(cx + f[0], y + f[1], 3, 0, Math.PI * 2); c.fill(); R(c, cx + f[0], y + f[1], 1, 1, '#ffd36a'); });
		// os olhos (com o traço vermelho no canto), piscando de vez em quando
		var pisca = (t % 3.7) > 3.55;
		[-1, 1].forEach(function (l) {
			var ox = cx + l * 6;
			if (sorri) { R(c, ox - 3, y + 37, 2, 1, '#1a0a14'); R(c, ox - 1, y + 36, 2, 1, '#1a0a14'); R(c, ox + 1, y + 37, 2, 1, '#1a0a14'); } // os olhinhos de contente, depois do gole
			else if (pisca || levanta) R(c, ox - 3, y + 37, 6, 1, '#1a0a14');
			else { R(c, ox - 3, y + 35, 6, 3, '#1a0a14'); R(c, ox - (l > 0 ? -1 : 2), y + 35, 1, 1, '#ffffff'); }
			R(c, ox + l * 3, y + 34, 2, 1, '#e83a5a');
			R(c, ox - 3, y + 32, 6, 1, '#1a0a14'); // a sobrancelha
		});
		// a boca vermelha (sorri quando toma o chá)
		if (sorri) { R(c, cx - 3, y + 46, 6, 1, '#e8243a'); P(c, cx - 4, y + 45, '#e8243a'); P(c, cx + 3, y + 45, '#e8243a'); }
		else if (!levanta) { R(c, cx - 2, y + 45, 4, 2, '#e8243a'); P(c, cx, y + 45, '#ff7a8a'); }
		// o chá: o braço entra pela manga larga do quimono segurando a tigela (chawan) com o chá verde
		// fumegando; a tigela sobe até a boca e inclina no gole (ela fecha os olhos), depois desce
		// (ciclo de 9 s: 4,2 a 5,1 sobe; 5,1 a 6,9 o gole; 6,9 a 7,8 desce; no resto, fica fora da tela)
		var sobe = ciclo < 4.2 || ciclo > 7.8 ? 0 : ciclo < 5.1 ? (ciclo - 4.2) / 0.9 : ciclo < 6.9 ? 1 : (7.8 - ciclo) / 0.9;
		sobe = sobe * sobe * (3 - 2 * sobe);
		if (sobe > 0) {
			// tudo no "braço": a tigela, a mão e a manga se movem juntas (uma vez e meia maiores), com a
			// tigela subindo do canto de baixo até a boca e inclinando no gole
			var ux = cx + 18 - sobe * 14, uy = y + h + 12 - sobe * (h + 12 - 50), incl = levanta ? -0.5 : -0.12 * sobe, vapor = !levanta;
			c.save(); c.translate(ux, uy); c.rotate(incl); c.scale(1.5, 1.5);
			// a manga larga do quimono, com contorno escuro, a dobra e o forro branco no punho
			c.fillStyle = '#3a0612'; c.beginPath(); c.moveTo(3, 13); c.lineTo(17, 7); c.lineTo(36, 46); c.lineTo(10, 52); c.fill();
			c.fillStyle = '#c82a4a'; c.beginPath(); c.moveTo(4, 13); c.lineTo(16, 8); c.lineTo(34, 46); c.lineTo(11, 51); c.fill();
			c.fillStyle = '#8a1430'; c.beginPath(); c.moveTo(11, 10); c.lineTo(16, 8); c.lineTo(34, 46); c.lineTo(24, 48); c.fill();
			c.strokeStyle = '#f2eee8'; c.lineWidth = 2; c.beginPath(); c.moveTo(4, 13); c.lineTo(16, 8); c.stroke();
			c.strokeStyle = '#e8c46a'; c.lineWidth = 1; c.beginPath(); c.moveTo(5, 15); c.lineTo(17, 10); c.stroke();
			// a tigela (chawan): o corpo branco arredondado com contorno, a sombra, a faixa azul e o chá verde
			c.fillStyle = '#3a2a2a'; c.beginPath(); c.moveTo(-9, -1); c.lineTo(9, -1); c.quadraticCurveTo(9, 10, 0, 10); c.quadraticCurveTo(-9, 10, -9, -1); c.fill();
			c.fillStyle = '#f4f0ea'; c.beginPath(); c.moveTo(-8, 0); c.lineTo(8, 0); c.quadraticCurveTo(8, 9, 0, 9); c.quadraticCurveTo(-8, 9, -8, 0); c.fill();
			c.fillStyle = '#d8d0c4'; c.beginPath(); c.moveTo(2, 0); c.lineTo(8, 0); c.quadraticCurveTo(8, 9, 0, 9); c.fill();
			c.fillStyle = '#3a5ab8'; c.fillRect(-7, 3, 14, 1.5); c.fillStyle = '#c8c0b4'; c.fillRect(-2, 9, 4, 1);
			c.fillStyle = '#ffffff'; c.beginPath(); c.ellipse(0, 0, 8, 2, 0, 0, Math.PI * 2); c.fill();
			if (!levanta) { c.fillStyle = '#5a9a4a'; c.beginPath(); c.ellipse(0, 0.3, 6.5, 1.3, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#a8d88a'; c.fillRect(-4, 0, 2, 0.7); }
			// a mão segurando a tigela pelo lado, com os dedos por cima da borda, e a outra apoiando por baixo
			c.fillStyle = '#3a2a2a'; c.beginPath(); c.ellipse(7, 6, 4.6, 5.6, -0.4, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#f6eae6'; c.beginPath(); c.ellipse(7, 6, 3.8, 4.8, -0.4, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#f6eae6'; c.fillRect(5, -0.5, 1.5, 4); c.fillRect(7, -0.5, 1.5, 4); c.fillStyle = '#d8c4bc'; c.fillRect(6.5, 0, 0.5, 3.5);
			c.fillStyle = '#f6eae6'; c.fillRect(-7, 8.5, 8, 2); c.fillStyle = '#d8c4bc'; c.fillRect(-7, 10, 8, 0.6);
			c.restore();
			// o vapor subindo da tigela (some no gole)
			if (vapor) for (var vp = 0; vp < 3; vp++) {
				for (var vy = 0; vy < 14; vy++) { var f = ((t * 1.2 + vp * 0.33) % 1); c.globalAlpha = (1 - vy / 14) * 0.6; P(c, ux - 5 + vp * 5 + Math.sin(vy * 0.6 + t * 3 + vp) * 2, uy - 4 - vy - f * 3, '#ffffff'); }
				c.globalAlpha = 1;
			}
		}
		// a faixa da propaganda embaixo, com o texto correndo (é um anúncio de chá)
		R(c, x, y + h - 9, w, 9, '#1a0a14'); R(c, x, y + h - 9, w, 1, '#e8c46a');
		c.save(); c.beginPath(); c.rect(x, y + h - 8, w, 8); c.clip();
		var msg = 'CHÁ HOSHI · O CHÁ DAS ESTRELAS · ', passo = msg.length * 4;
		texto3(c, msg + msg, x + 2 - (Math.floor(t * 14) % passo), y + h - 7, 1, '#ffd36a');
		c.restore();
		// as linhas de tela e um brilho que passa
		for (var sl = y; sl < y + h; sl += 2) { c.globalAlpha = 0.18; R(c, x, sl, w, 1, '#000000'); }
		c.globalAlpha = 0.12; R(c, x, y + ((t * 30) % h), w, 4, '#ffffff'); c.globalAlpha = 1;
	}
	// o telão da agência: um comercial em três partes, como num painel de LED de verdade
	//   1. Saturno (pixel art sombreada, com o anel passando por trás e pela frente): "VISITE SATURNO"
	//   2. a PX-01 cruzando a tela, com rastro: "VOE ANDARILHA"
	//   3. o símbolo da agência em 2x, com o nome e "DESDE 2077"
	// entre as partes, um "glitch" de troca de canal; por cima, as linhas e a grade de LED e o brilho
	var saturnoTelao = null, naveTelao = null;
	function fazerSaturnoTelao() {
		var p = new Pintura(84, 46), cx = 42, cy = 23, R0 = 14;
		pintar(p, function () {
			// o anel: só a metade de trás primeiro (a de cima), depois o planeta, depois a da frente
			function anel(frente) {
				for (var a = 0; a < Math.PI * 2; a += 0.004) {
					var naFrente = Math.sin(a) > 0; if (naFrente !== frente) continue;
					for (var r = 22; r <= 38; r += 0.5) {
						if (r > 31 && r < 32.5) continue; // a divisão de Cassini
						var x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r * 0.24 - Math.cos(a) * r * 0.08;
						if (!frente && Math.hypot(x - cx, y - cy) < R0 + 0.5) continue;
						var t = (r - 22) / 16, sombra = !frente && Math.cos(a) > 0.2 && Math.sin(a) > -0.6 ? 0.35 : 0; // a sombra do planeta no anel
						px(x, y, rampa(['#fff0d0', '#ecd0a0', '#d0a878', '#a88058', '#7a5a40'], t * 0.7 + (Math.cos(a) * -0.2 + 0.2) + sombra, Math.round(x), Math.round(y)));
					}
				}
			}
			anel(false);
			for (var y = -R0; y <= R0; y++) for (var x = -R0; x <= R0; x++) {
				var d = Math.sqrt(x * x + y * y); if (d > R0) continue;
				var nx = x / R0, ny = y / R0, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
				var luz = -nx * 0.55 - ny * 0.35 + nz * 0.75; // a luz vem da esquerda, de cima
				var faixa = Math.sin(ny * 11 + 0.6) * 0.12 + Math.sin(ny * 23) * 0.05; // as faixas do planeta
				px(cx + x, cy + y, rampa(['#fff4d8', '#f4d8a8', '#e0b47c', '#c08a58', '#8a5a3a', '#4a2a22'], 1 - luz * 0.9 + faixa + 0.05, cx + x, cy + y));
			}
			anel(true);
		});
		saturnoTelao = paraCanvas(p);
	}
	function telaoAgencia(c, tl, t) {
		if (!saturnoTelao) fazerSaturnoTelao();
		if (!naveTelao && window.Nave && window.Nave.renderizarModelo) {
			var L = 52, A = 26, r = window.Nave.renderizarModelo({ L: L, A: A, giro: Math.PI / 2, inclinacao: 18 * RAD, esc: 15, ox: L / 2, oy: A / 2, luz: [-0.6, -0.5, 0.6], brilho: 1.05, motores: false });
			var k = document.createElement('canvas'); k.width = L; k.height = A; var g = k.getContext('2d'), im2 = g.createImageData(L, A); new Uint32Array(im2.data.buffer).set(r.cores); g.putImageData(im2, 0, 0); naveTelao = k;
		}
		var x = tl.x, y = tl.y, w = tl.w, h = tl.h, cx = x + w / 2, ciclo = t % 12, fase = Math.floor(ciclo / 4), local = ciclo % 4;
		// o fundo do anúncio: um degradê de espaço com estrelas que passam devagar
		var fundo = c.createLinearGradient(0, y, 0, y + h); fundo.addColorStop(0, fase === 1 ? '#0a1440' : '#120a34'); fundo.addColorStop(1, fase === 1 ? '#2a1a5a' : '#2a0e40'); c.fillStyle = fundo; c.fillRect(x, y, w, h);
		for (var s = 0; s < 34; s++) { var sx = x + ((ruido(s, 1) * w + t * (3 + ruido(s, 3) * 8)) % w), sy = y + ruido(s, 2) * h; P(c, sx, sy, Math.sin(t * 3 + s) > 0.3 ? '#ffffff' : '#7a7ab8'); }
		if (fase === 0) {
			c.drawImage(saturnoTelao, Math.round(cx - 42), Math.round(y + 4 + Math.sin(t) * 1));
			texto3(c, 'VISITE SATURNO', Math.round(cx - 27), y + h - 15, 1, '#ffe6a0');
			if (Math.floor(t * 2) % 2) { R(c, x + 4, y + 4, 25, 9, '#ff3ab8'); texto3(c, 'PROMO', x + 6, y + 6, 1, '#ffffff'); } // a etiqueta piscando
			texto3(c, 'ANÉIS INCLUSOS', Math.round(cx - 27), y + h - 8, 1, '#7fe3ff');
		} else if (fase === 1) {
			var u = local / 4, nx2 = x - 50 + u * (w + 100);
			for (var rr = 0; rr < 40; rr++) { c.globalAlpha = (1 - rr / 40) * 0.7; R(c, nx2 - rr * 2, y + 30 + Math.sin(rr * 0.5) * 0.5, 2, 2, rr < 8 ? '#cdf6ff' : '#4ab4ff'); }
			c.globalAlpha = 1;
			if (naveTelao) c.drawImage(naveTelao, Math.round(nx2 - 26), y + 18);
			texto3(c, 'VOE', Math.round(cx - 6), y + h - 22, 1, '#ffffff'); texto3(c, 'ANDARILHA', Math.round(cx - 34), y + h - 14, 2, '#ffe6a0');
		} else {
			if (simbImg) { c.imageSmoothingEnabled = false; c.drawImage(simbImg, Math.round(cx - 32), y + 3, 64, 64); }
			texto3(c, 'AGÊNCIA ANDARILHA', Math.round(cx - 33), y + h - 11, 1, '#ffe6a0');
			texto3(c, 'DESDE 2077', Math.round(cx - 19), y + h - 5, 1, '#7fe3ff');
		}
		// a troca de canal: faixas deslocadas e um "chuvisco" por um instante
		if (local < 0.18) {
			for (var g2 = 0; g2 < 8; g2++) { var gy = y + Math.floor(ruido(g2, Math.floor(t * 20)) * h); c.drawImage(c.canvas, Math.round(x + OX), gy, w, 3, Math.round(x + (ruido(g2, 5) - 0.5) * 16), gy, w, 3); }
			for (var ch = 0; ch < 120; ch++) P(c, x + ruido(ch, Math.floor(t * 30)) * w, y + ruido(ch + 9, Math.floor(t * 30)) * h, ch % 2 ? '#ffffff' : '#ff3ab8');
		}
		// o painel de LED: linhas, colunas mais escuras, um brilho passando e as bordas escurecidas
		c.globalAlpha = 0.2; for (var sl = y; sl < y + h; sl += 2) R(c, x, sl, w, 1, '#000000');
		c.globalAlpha = 0.1; for (var co = x; co < x + w; co += 3) R(c, co, y, 1, h, '#000000');
		c.globalAlpha = 0.08; R(c, x, y + ((t * 26) % (h + 20)) - 10, w, 6, '#ffffff');
		c.globalAlpha = 0.25; R(c, x, y, w, 2, '#000000'); R(c, x, y + h - 2, w, 2, '#000000'); R(c, x, y, 2, h, '#000000'); R(c, x + w - 2, y, 2, h, '#000000');
		c.globalAlpha = 1;
	}	// o som da chuva e da cidade lá fora (liga quando o som é liberado)
	function ligarAmbienteChuva() {
		if (!audio) return;
		ligarAmbiente('rua');
	}

	// 1. A RECEPÇÃO (montada em 3D): estamos atrás das cadeiras azuis de espera, olhando em
	// diagonal para a fila de guichês. Cada guichê tem balcão azul com tampo branco, divisória com
	// vidro jateado em cima, plaquinha pendurada com o número, um robô atendente e o computador.
	// Clientes sentados de costas, o painel de senhas e a TV na parede, o selo da agência, a placa
	// holográfica de licenças, o relógio, a porta dos hangares lá no fundo e o robô-garçom servindo café.
	var CAM_REC = camera3d({ x: 0.4, y: 1.5, z: 1.7, yaw: 28 * RAD, pitch: 5 * RAD, f: 290, cx: 236, cy: 108 });
	var GL = 2.2, GX0 = -2.0, ZC = 5.7, ZP = 5.45, ZW = 7.6, HC = 1.05, HP = 1.85, TETO = 3.0, XF = 26.4;
	function guicheX(k) { return GX0 + k * GL; }
	var CLIENTES = {
		0: { pele: '#c8906a', pele2: '#a06a48', cabelo: ['#3a2a1a', '#2a1a10'], estilo: 'bone', bone: ['#c84a3a', '#a83a2a', '#7a2a1a'], roupa: ['#5a7a5a', '#4a6a4a', '#3a5a3a', '#2a4a2a'], calca: ['#3a4a6a', '#2a3a5a'], sapato: '#e8e2d8' },
		1: { pele: '#f0c8a8', pele2: '#d0a080', cabelo: ['#5a3420', '#4a2614', '#36180a'], estilo: 'longo', roupa: ['#a84a5a', '#8a3a4a', '#6e2a3a', '#521e2c'], roupa2: '#f2e8e0', calca: ['#2a3a5a', '#1e2a44'], sapato: '#f2f2f2', extra: 'alca' },
		3: { pele: '#d8dce8', pele2: '#8a90a8', cabelo: null, estilo: 'androide', androide: true, roupa: ['#3a3a42', '#2a2a30', '#1e1e24', '#141418'], calca: null, mangaCurta: true, sapato: '#f2f2f2' },
		4: { pele: '#8ad8b8', pele2: '#5aa888', cabelo: ['#7ac8a8', '#5aa888'], estilo: 'curto', alien: true, roupa: ['#e8904a', '#d0783a', '#b0602a', '#8a4a1e'], calca: ['#d0783a', '#b0602a'], sapato: '#3a3d46' },
		5: { pele: '#e8c0a0', pele2: '#c89a78', cabelo: ['#e8e8ec', '#c8c8d0', '#a8a8b0'], estilo: 'coque', roupa: ['#a898c8', '#8a7aac', '#6e5e90', '#544674'], calca: ['#5a5a6a', '#44444e'], sapato: '#5a3a2a', extra: 'bengala' },
		6: { pele: '#c08060', pele2: '#9a5e40', cabelo: ['#2a1a12', '#1a0e08'], estilo: 'cacheado', roupa: ['#e8c040', '#d0a830', '#b08a22', '#8a6a18'], calca: ['#3a3a4a', '#2a2a36'], sapato: '#e84a4a', fone: true, extra: 'capuz' },
		9: { pele: '#b8a0e8', pele2: '#8a70c0', cabelo: ['#ff8ad8', '#d05ab0', '#a03a90'], estilo: 'longo', chifres: true, roupa: ['#2a8a7a', '#1e7a6a', '#14625a', '#0e4a44'], calca: ['#2a2a3a', '#1e1e2a'], sapato: '#2a2a32' }
	};
	var ROBOS = [
		{ olho: '#7dffa8', antena: '#ffd36a' }, { olho: '#ffd36a', antena: '#ff8ad8' }, { olho: '#7fe3ff', antena: '#ff8ad8' },
		{ olho: '#ff8ad8', antena: '#7dffa8', metal: ['#f0e8d8', '#d8ccb4', '#b8aa90', '#958670', '#6e6252'] }, { olho: '#7fe3ff', antena: '#ffd36a' },
		{ olho: '#7dffa8', antena: '#7fe3ff', metal: ['#e8f0ec', '#c4d4cc', '#a0b4ac', '#7e948c', '#5a6e66'] }, { olho: '#ffd36a', antena: '#ff8ad8' },
		{ olho: '#7fe3ff', antena: '#ffd36a' }, null, { olho: '#ff8ad8', antena: '#7dffa8' }
	];
	// as texturas das placas e telas (desenhadas retas e depois esticadas na perspectiva)
	function texturaPlaca(num) {
		return pintar(new Pintura(28, 20), function () {
			ret(0, 0, 28, 20, '#c8a040'); ret(1, 1, 26, 18, function (x, y) { return rampa(['#26388a', '#1c2a6e', '#141f55'], y / 18, x, y); }); ret(1, 1, 26, 1, '#3e50a8');
			letras('GUICHÊ', 14, 3, 1, '#e8c46a', true); letras(num, 14, 10, 2, '#ffffff', true);
		});
	}
	function texturaPainel(senha, guiche) { // senha nula = números apagados (piscando)
		return pintar(new Pintura(44, 20), function () {
			/* (um holograma: fundo azul translúcido, borda acesa e os números em luz) */
			ret(0, 0, 44, 20, '#3ae0ff'); ret(1, 1, 42, 18, function (x, y) { return rampa(['#1a5a8a', '#124a78', '#0c3a64'], y / 18, x, y); });
			for (var lv = 2; lv < 19; lv += 2) ret(1, lv, 42, 1, '#165282');
			letras('SENHA', 3, 3, 1, '#9af0ff'); letras('GUICHÊ', 3, 11, 1, '#9af0ff');
			if (senha) { letras(senha, 41 - larguraLetras(senha, 1), 3, 1, '#ffffff'); letras(guiche, 41 - larguraLetras(guiche, 1), 11, 1, '#ffd36a'); }
			else { letras('011', 30, 3, 1, '#2a6a9a'); letras('11', 34, 11, 1, '#2a6a9a'); }
		});
	}
	function texturaTV() {
		return pintar(new Pintura(56, 34), function () {
			ret(0, 0, 56, 34, '#14151a'); ret(2, 2, 52, 30, '#0b1840');
			ret(2, 2, 52, 7, function (x, y) { return rampa(['#2a62c8', '#1a4aa2'], (y - 2) / 7, x, y); }); letras('ATENDIMENTO', 4, 3, 1, '#ffffff');
			letras('SENHA', 5, 12, 1, '#9fd0ff'); letras('GUICHÊ', 31, 12, 1, '#9fd0ff');
			letras('011', 6, 19, 2, '#ffffff'); letras('11', 34, 19, 2, '#ffd36a');
			ret(2, 29, 52, 3, '#16357a'); letras('·', 50, 28, 1, '#e8c46a');
		});
	}
	// o letreiro grande da agência na parede: azul-marinho, moldura dourada, o selo e o nome
	function texturaLetreiro() {
		var p = pintar(new Pintura(118, 36), function () {
			ret(0, 0, 118, 36, '#c8a040'); ret(0, 0, 118, 1, '#f0d480');
			ret(1, 1, 116, 34, function (x, y) { return rampa(['#26388a', '#1c2a6e', '#16225a', '#101a4a'], y / 34 + x / 400, x, y); });
			letras('AGÊNCIA ANDARILHA', 77, 10, 1, '#ffe6a0', true);
			ret(44, 18, 66, 1, '#c8a040');
			letras('TURISMO ESPACIAL', 77, 22, 1, '#7fe3ff', true);
		});
		if (simbImg) { var s = deCanvas(simbImg, 32, 32); for (var j = 0; j < 32; j++) for (var i = 0; i < 32; i++) if (s.d[j * 32 + i]) p.d[(2 + j) * 118 + 3 + i] = s.d[j * 32 + i]; }
		return p;
	}
	function texturaFlamula() {
		return pintar(new Pintura(12, 34), function () {
			ret(0, 0, 12, 2, '#c8a040');
			poli([[0, 2], [12, 2], [12, 28], [6, 34], [0, 28]], function (x, y) { return rampa(['#26388a', '#1c2a6e', '#141f55'], x / 12 * 0.6 + y / 34 * 0.3, x, y); });
			for (var a = 0; a < Math.PI * 2; a += 0.3) px(6 + Math.cos(a) * 3.4, 12 + Math.sin(a) * 3.4, '#e8c46a');
			px(6, 12, '#e8905a'); px(5, 12, '#e8905a'); px(7, 12, '#e8905a');
			ret(1, 22, 10, 1, '#c8a040'); ret(1, 24, 10, 1, '#c8a040');
		});
	}
	function texturaPoster() {
		var p = pintar(new Pintura(36, 48), function () {
			ret(0, 0, 36, 48, '#c8a050'); ret(1, 1, 34, 46, function (x, y) { return rampa(['#ffffff', '#f2f4fa', '#e6e9f2'], y / 46, x, y); });
			ret(3, 38, 30, 1, '#e8c46a'); letras('DESDE', 18, 40, 1, '#1c2a6e', true);
		});
		if (seloImg) { var s = deCanvas(seloImg, 30, 30); for (var j = 0; j < 30; j++) for (var i = 0; i < 30; i++) if (s.d[j * 30 + i]) p.d[(4 + j) * 36 + 3 + i] = s.d[j * 30 + i]; }
		return p;
	}
	function texturaHolo() {
		return pintar(new Pintura(70, 14), function () {
			ret(0, 0, 70, 14, '#7fe3ff'); ret(1, 1, 68, 12, '#3aa8d8');
			letras('LICENÇAS DE NAVE', 35, 2, 1, '#ffffff', true); letras('RENOVAÇÃO · EMBARQUE', 35, 8, 1, '#cdf6ff', true);
		});
	}
	function texturaSaida() {
		return pintar(new Pintura(42, 9), function () { ret(0, 0, 42, 9, '#1f8a4a'); ret(0, 0, 42, 1, '#4ad08a'); letras('HANGARES >', 21, 2, 1, '#ffffff', true); });
	}
	function texturaRelogio() {
		return pintar(new Pintura(13, 13), function () { elip(6, 6, 6, 6, '#2a2c34'); elip(6, 6, 5, 5, '#ffffff'); linha(6, 6, 6, 2, '#1a1a22'); linha(6, 6, 9, 7, '#1a1a22'); px(6, 6, '#e04040'); [0, 3, 6, 9].forEach(function (h) { var a = h / 12 * Math.PI * 2; px(6 + Math.sin(a) * 4, 6 - Math.cos(a) * 4, '#8a8e98'); }); });
	}
	// pinta o cenário da recepção numa Pintura: painel = [senha, guichê] (ou null, apagado);
	// soFrente = só as cadeiras azuis da frente (uma camada à parte, para o que anda ficar atrás delas)
	var salaPronta = null;
	// o que se vê pela vitrine do fundo (em metros, no plano da parede): o céu da noite, a cidade
	// lá longe, as torres de lançamento do porto espacial, as naves estacionadas e as luzes da pista
	// a vitrine vista de pertinho, da mesa do guichê 11: que pedaço do porto aparece em cada pixel
	// (um trecho com a torre de lançamento no meio)
	var VIT_MESA = { x: function (sx) { return 5.6 + (sx + 80) / 640 * 3.2; }, y: function (sy) { return 2.93 - (sy - 10) / 70 * 0.86; },
		sx: function (wx) { return (wx - 5.6) / 3.2 * 640 - 80; }, sy: function (wy) { return 10 + (2.93 - wy) / 0.86 * 70; } };
	var JAN = null; /* a cor que a vitrine pintou em cada pixel (0 = fora da vitrine) */
	var HORIZ_PORTO = 2.3, TORRES_PORTO = [0.6, 7.2, 14.1, 21.0];
	function ceuDoPorto(wx, wy, x, y) {
		var k;
		for (k = 0; k < TORRES_PORTO.length; k++) { /* as torres de lançamento: treliça escura com a nave encostada */
			var dx = wx - TORRES_PORTO[k];
			if (dx > -0.1 && dx < 0.1 && wy > HORIZ_PORTO - 0.02 && wy < 2.82 && (Math.abs(dx) > 0.07 || Math.floor(wy * 30) % 3 === 0 || Math.abs(dx - ((wy * 8) % 0.2 - 0.1)) < 0.02)) return '#2a2c44';
			if (dx > 0.12 && dx < 0.3 && wy > HORIZ_PORTO && wy < 2.62 - (dx > 0.21 ? Math.max(0, (dx - 0.21)) * 1.4 : 0)) return dx < 0.15 ? '#c8ccd8' : rampa(['#eef1fb', '#c8ccdc', '#8a90a8'], (dx - 0.12) / 0.18, x, y);
		}
		if (wy < HORIZ_PORTO) { /* a pista: escura e molhada, com as fileiras de luzes */
			var fila = [2.27, 2.2, 2.11].some(function (f) { return Math.abs(wy - f) < 0.012; });
			if (fila && ((wx * 3.3) % 1 + 1) % 1 < 0.12) return Math.floor(wx * 3.3) % 2 ? '#7fe3ff' : '#ffb860';
			return rampa(['#1a1a30', '#12122a', '#0c0c1e'], (HORIZ_PORTO - wy) / 0.25 + (ruido(x >> 1, y) - 0.5) * 0.15, x, y);
		}
		var col = Math.floor(wx * 5), alt = 0.04 + ruido(col, 71) * 0.17; /* os prédios da cidade lá longe */
		if (wy < HORIZ_PORTO + alt) return ruido(x, y) > 0.9 ? (ruido(x, y + 1) > 0.5 ? '#ffd890' : '#7fe3ff') : '#161838';
		if (ruido(x * 3, y * 7) > 0.985) return '#ffffff'; /* as estrelas */
		return rampa(['#6a2a6a', '#3a1a5a', '#1c1446', '#0e0c2e', '#08081e'], (wy - HORIZ_PORTO) / 0.6, x, y);
	}
	// a máscara da vitrine: os pixels por onde dá para ver lá fora (o que se mexe lá fora só aparece neles)
	function mascaraVitrine(p) {
		var k = document.createElement('canvas'); k.width = p.w; k.height = p.h;
		var g = k.getContext('2d'), img = g.createImageData(p.w, p.h), m = new Uint32Array(img.data.buffer);
		for (var i = 0; i < JAN.length; i++) if (JAN[i] && p.d[i] === JAN[i]) m[i] = 0xffffffff;
		g.putImageData(img, 0, 0);
		return k;
	}
	function recepcao(painel, soFrente) {
		var C = CAM_REC;
		return pintar(tela0(), function () {
			if (soFrente === 'totem') return totemEtc(C, true);
			if (soFrente) return cadeirasDaFrente(C);
			// chão, teto e paredes: para cada pixel, o raio da câmera diz em que superfície ele bate
			// (calculado uma vez só para cada largura de tela; as versões do painel reaproveitam)
			if (salaPronta && salaPronta.w === W) buf.set(salaPronta.d);
			else for (var y = 0; y < H; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
				var d = C.raio(x + 0.5, y + 0.5), o = C.o, oy = o.y, best = Infinity, sup = 0;
				if (d[1] < 0) { var t = -oy / d[1]; if (t < best) { best = t; sup = 1; } }
				if (d[1] > 0) { t = (TETO - oy) / d[1]; if (t < best) { best = t; sup = 2; } }
				if (d[2] > 0) { t = (ZW - o.z) / d[2]; if (t < best) { best = t; sup = 3; } }
				if (d[0] > 0) { t = (XF - o.x) / d[0]; if (t < best) { best = t; sup = 4; } }
				if (d[0] < 0) { t = (-3.6 - o.x) / d[0]; if (t < best) { best = t; sup = 5; } }
				var wx = o.x + d[0] * best, wy = oy + d[1] * best, wz = o.z + d[2] * best, longe = Math.min(1, best / 30), c;
				if (sup === 1) { // o chão de porcelanato claro, com rejunte, reflexo das luminárias e sombra perto do balcão
					var gx = wx / 0.6, gz = wz / 0.6, fx = gx - Math.floor(gx), fz = gz - Math.floor(gz);
					var ref = ((((wx % GL) + GL) % GL) > 0.55 && (((wx % GL) + GL) % GL) < 1.65 && (((wz % 3) + 3) % 3) > 0.9 && (((wz % 3) + 3) % 3) < 1.7) ? -0.25 : 0;
					var tom = 0.3 + ruido(Math.floor(gx), Math.floor(gz)) * 0.18 + longe * 0.25 + ref + (wz > ZC - 0.25 && wz < ZW ? 0.35 : 0);
					c = (fx < 0.03 || fz < 0.03 * (1 + longe * 3)) ? '#a7abb4' : rampa(['#eef0f3', '#dfe2e7', '#d1d4db', '#c2c6ce', '#b0b4bd'], tom, x, y);
				} else if (sup === 2) { // o teto: placas, luminárias embutidas e as grelhas de ar
					var lx = ((wx % GL) + GL) % GL, lz = ((wz % 3) + 3) % 3, gx2 = wx / 0.6, gz2 = wz / 0.6;
					if (lx > 0.55 && lx < 1.65 && lz > 1.0 && lz < 1.6) c = (lx < 0.6 || lx > 1.6 || lz < 1.05 || lz > 1.55) ? '#c8d4e4' : '#ffffff';
					else if (lx > 0.1 && lx < 0.4 && lz > 2.2 && lz < 2.5) c = ((Math.floor(lz * 40)) % 2) ? '#9aa2b0' : '#c4cad4';
					else c = (gx2 - Math.floor(gx2) < 0.03 || gz2 - Math.floor(gz2) < 0.04) ? '#b4bcc8' : rampa(['#dde2ea', '#d2d8e2', '#c6cdd8', '#b8c0cc'], 0.2 + longe * 0.6 + ruido(Math.floor(gx2), Math.floor(gz2)) * 0.1, x, y);
				} else if (sup === 3) { // a parede do fundo: placas brancas, rodapé, faixa azul da agência
					if (wy < 0.12) c = '#7e8494';
					else if (wy > 1.86 && wy < 2.0) c = rampa(['#26388a', '#1c2a6e'], (2 - wy) / 0.14, x, y);
					else if (wy >= 2.0 && wy < 2.025) c = '#e8c46a';
					else if (wy > 2.94) c = '#c4cad4';
					else if (((wx % 1.25) + 1.25) % 1.25 < 0.025) c = '#c8cdd6';
					else c = rampa(['#f2f4f7', '#e8ebef', '#dde1e7', '#d0d5dc'], 0.15 + (2.9 - wy) / 2.9 * 0.3 + longe * 0.4, x, y);
				} else if (sup === 4) { // a parede do fim do salão, com a porta para os hangares
					if (wz > 3.0 && wz < 4.6 && wy < 2.3) c = (wz < 3.08 || wz > 4.52 || wy > 2.22) ? '#8a90a0' : rampa(['#3a4258', '#2a3044'], wy / 2.3, x, y);
					else c = rampa(['#e2e6ec', '#d4d9e0', '#c6ccd4'], 0.3 + longe * 0.5, x, y);
				} else c = rampa(['#e8ebef', '#dde1e7'], 0.5, x, y);
				px(x, y, c);
			}
			if (!salaPronta || salaPronta.w !== W) salaPronta = { w: W, d: new Uint32Array(buf) };
			// as luminárias do teto brilhando um pouco em volta
			for (var lz2 = 1.3; lz2 < ZW; lz2 += 3) for (var lx2 = GX0 + 1.1; lx2 < 24; lx2 += GL) { var q = C(lx2, TETO - 0.02, lz2); if (q[2] > 0.5 && q[0] > -OX - 20 && q[0] < NUCLEO + OX + 20) brilho(Math.round(q[0]), Math.round(q[1]) + 3, Math.round(Math.min(26, 120 / q[2])), '#ffffff', 0.25); }
			// a vitrine panorâmica para o porto espacial, no alto da parede do fundo (as coisas presas na
			// parede, os robôs e as plaquinhas são desenhados depois, na frente dela)
			JAN = new Uint32Array(BW * BH);
			for (var vwx = -1.9; vwx < 25.6; vwx += 0.01) for (var vwy = 2.05; vwy < 2.93; vwy += 0.01) {
				var vq = C(vwx, vwy, ZW - 0.012), vsx = Math.round(vq[0]), vsy = Math.round(vq[1]);
				var moldura = vwy < 2.07 || vwy > 2.91 || ((((vwx - GX0) % GL) + GL) % GL) < 0.05;
				px(vsx, vsy, moldura ? '#8a90a0' : ceuDoPorto(vwx, vwy, vsx, vsy));
				var vi = vsy * BW + vsx + DX; if (vi >= 0 && vi < JAN.length) JAN[vi] = moldura ? 0 : buf[vi];
			}
			// as coisas presas na parede do fundo (acima dos guichês, para as plaquinhas não taparem)
			function naParede(p2, xa, xb, ya, yb, alfa) { quadTex(p2, [C(xa, yb, ZW - 0.01), C(xb, yb, ZW - 0.01), C(xb, ya, ZW - 0.01), C(xa, ya, ZW - 0.01)], alfa); }
			naParede(texturaPainel(painel && painel[0], painel && painel[1]), 2.0, 3.1, 2.35, 2.85, 0.85);
			naParede(texturaLetreiro(), 4.4, 7.0, 2.3, 2.97); // (alto, para as plaquinhas penduradas não taparem)
			naParede(texturaTV(), 7.4, 8.8, 2.3, 2.92);
			naParede(texturaHolo(), 9.5, 12.3, 2.42, 2.8, 0.75);
			naParede(texturaRelogio(), 12.9, 13.4, 2.45, 2.95);
			naParede(texturaTV(), 15.4, 16.8, 2.3, 2.92);
			[1.1, 17.6, 20.0, 22.4].forEach(function (fx) { naParede(texturaFlamula(), fx, fx + 0.45, 2.05, 2.98); });
			naParede(pintar(new Pintura(66, 16), function () { ret(0, 0, 66, 16, '#c8a040'); ret(1, 1, 64, 14, '#1c2a6e'); letras('ANDARILHA', 33, 2, 1, '#e8c46a', true); letras('DESDE 2077', 33, 9, 1, '#ffffff', true); }), 18.2, 19.8, 2.45, 2.85); // a placa da inauguração
			quadTex(texturaSaida(), [C(XF - 0.01, 2.75, 3.2), C(XF - 0.01, 2.75, 4.4), C(XF - 0.01, 2.45, 4.4), C(XF - 0.01, 2.45, 3.2)]);
			// a fila de guichês, do mais longe (direita) para o mais perto (esquerda)
			for (var k = 13; k >= 0; k--) {
				var x0 = guicheX(k), x1 = x0 + GL, cx = (x0 + x1) / 2, num = String(13 - k);
				// o robô atendente, sentado atrás do balcão
				var rb = ROBOS[k];
				if (rb) { var rp = C(cx - 0.35, 0, 6.55); colarSprite(roboDeFrente(300 / rp[2], rb), rp[0], rp[1]); }
				// o computador do atendente (vemos as costas do monitor) e uma impressora de senhas
				face(C, [[cx + 0.05, 1.45, 6.0], [cx + 0.6, 1.45, 6.0], [cx + 0.6, 1.1, 6.0], [cx + 0.05, 1.1, 6.0]], function (sx, sy) { return rampa(['#3a3d48', '#2a2c34', '#1c1d24'], ruido(sx >> 1, sy) * 0.3 + 0.3, sx, sy); });
				face(C, [[cx + 0.05, 1.45, 6.0], [cx + 0.05, 1.45, 6.05], [cx + 0.05, 1.1, 6.05], [cx + 0.05, 1.1, 6.0]], '#4a4e5a');
				face(C, [[cx + 0.28, 1.1, 6.02], [cx + 0.38, 1.1, 6.02], [cx + 0.38, HC, 6.02], [cx + 0.28, HC, 6.02]], '#1c1d24');
				// o balcão: tampo branco e frente azul com frisos e rodapé
				face(C, [[x0, HC, ZC], [x1, HC, ZC], [x1, HC, ZC + 0.6], [x0, HC, ZC + 0.6]], function (sx, sy) { return rampa(['#ffffff', '#f2f4f8', '#e2e6ee'], ruido(sx, sy) * 0.4, sx, sy); });
				face(C, [[x0, HC, ZC], [x1, HC, ZC], [x1, 0.1, ZC], [x0, 0.1, ZC]], function (sx, sy) { var q2 = C(x0, HC, ZC), q3 = C(x0, 0.1, ZC); return rampa(['#4a84dc', '#3a70c8', '#2c5cb0', '#224a92', '#1c3e7c'], (sy - q2[1]) / Math.max(1, q3[1] - q2[1]) * 0.8 + 0.1, sx, sy); });
				face(C, [[x0, HC, ZC - 0.002], [x1, HC, ZC - 0.002], [x1, HC - 0.04, ZC - 0.002], [x0, HC - 0.04, ZC - 0.002]], '#e8c46a');
				var em = C(cx, 0.78, ZC - 0.003), ems = 290 / em[2], er = Math.max(2, Math.round(0.08 * ems));
				elip(Math.round(em[0]), Math.round(em[1]), er, er, '#c8a040'); elip(Math.round(em[0]), Math.round(em[1]), Math.max(1, er - 1), Math.max(1, er - 1), '#1c2a6e');
				elip(Math.round(em[0]), Math.round(em[1]), Math.max(1, Math.round(er * 0.4)), Math.max(1, Math.round(er * 0.4)), '#e8905a');
				if (er > 3) linha(em[0] - er + 1, em[1] + 1, em[0] + er - 1, em[1] - 1, '#7fe3ff');
				face(C, [[x0, 0.55, ZC - 0.002], [x1, 0.55, ZC - 0.002], [x1, 0.53, ZC - 0.002], [x0, 0.53, ZC - 0.002]], '#1c3e7c');
				face(C, [[x0, 0.1, ZC], [x1, 0.1, ZC], [x1, 0, ZC], [x0, 0, ZC]], '#1a2a4a');
				// o leitor de cartão e o folheto em cima do balcão, do lado do cliente
				face(C, [[cx - 0.6, HC + 0.06, ZC + 0.08], [cx - 0.42, HC + 0.06, ZC + 0.08], [cx - 0.42, HC, ZC + 0.12], [cx - 0.6, HC, ZC + 0.12]], '#2a2c34');
				face(C, [[cx - 0.2, HC + 0.18, ZC + 0.15], [cx - 0.05, HC + 0.18, ZC + 0.15], [cx - 0.05, HC, ZC + 0.15], [cx - 0.2, HC, ZC + 0.15]], ['#e8c46a', '#7fe3ff', '#ff8ad8'][k % 3]);
				if (!rb) { // guichê fechado: uma plaquinha no balcão
					face(C, [[cx - 0.25, HC + 0.16, ZC + 0.2], [cx + 0.25, HC + 0.16, ZC + 0.2], [cx + 0.25, HC, ZC + 0.2], [cx - 0.25, HC, ZC + 0.2]], '#c83a3a');
				}
				// a divisória: parte de baixo azul e vidro jateado em cima, com moldura de alumínio
				var xd = x0 - 0.03;
				face(C, [[xd, 1.25, ZP], [xd, 1.25, ZW], [xd, 0, ZW], [xd, 0, ZP]], function (sx, sy) { return rampa(['#5a8ee0', '#4a7ed0', '#3a6cbc', '#2e5ca6'], (sy % 7) / 30 + 0.2 + ruido(sx >> 2, sy >> 2) * 0.1, sx, sy); });
				var vidro = [C(xd, HP, ZP), C(xd, HP, ZW), C(xd, 1.25, ZW), C(xd, 1.25, ZP)];
				poli(vidro, function (sx, sy) { mistura(sx, sy, '#dcecff', 0.55); return null; });
				face(C, [[xd, HP, ZP], [xd, HP, ZW], [xd, HP - 0.03, ZW], [xd, HP - 0.03, ZP]], '#c8ccd6');
				face(C, [[xd, 1.27, ZP], [xd, 1.27, ZW], [xd, 1.23, ZW], [xd, 1.23, ZP]], '#a8b0bc');
				face(C, [[x0 - 0.03, HP, ZP], [x0 + 0.03, HP, ZP], [x0 + 0.03, 0, ZP], [x0 - 0.03, 0, ZP]], function (sx, sy) { return sy < C(x0, 1.25, ZP)[1] ? '#c8ccd6' : '#2e5ca6'; });
				// a horta hidropônica em cima da divisória: um tubo de vidro com alface e manjericão
				// (desenhada aqui, antes da plaquinha, para a plaquinha pendurada ficar na frente)
				if (k >= 2) {
					var ha = C(xd, HP + 0.02, ZP + 0.05), hb2 = C(xd, HP + 0.02, ZW - 0.05);
					for (var zh = ZP + 0.1; zh < ZW - 0.1; zh += 0.16) {
						var ph = C(xd, HP + 0.02, zh), sh = 290 / ph[2], lf2 = Math.max(1, Math.round(0.07 * sh));
						ret(ph[0] - lf2, ph[1] - lf2 * 2, lf2, lf2 * 2, (Math.floor(zh * 10) + k) % 3 ? '#4aa85a' : '#7ad86a');
						ret(ph[0], ph[1] - lf2 * 2 - 1, lf2, lf2 * 2 + 1, (Math.floor(zh * 10) + k) % 2 ? '#5ab86a' : '#3a8a4a');
					}
					for (var e2 = 0; e2 < 2; e2++) linha(ha[0], ha[1] - 1 + e2, hb2[0], hb2[1] - 1 + e2, e2 ? '#a8c8d8' : '#d8f0ff');
				}
				// a plaquinha com o número, pendurada do teto por dois cabos
				var pa = C(cx - 0.21, 2.18, 5.9), pb = C(cx + 0.21, 2.18, 5.9), pc = C(cx + 0.21, 1.9, 5.9), pd = C(cx - 0.21, 1.9, 5.9);
				[cx - 0.14, cx + 0.14].forEach(function (cxx) { var a1 = C(cxx, 2.18, 5.9), a2 = C(cxx, TETO, 5.9); linha(a1[0], a1[1], a2[0], a2[1], '#8a90a0'); });
				quadTex(texturaPlaca(num), [pa, pb, pc, pd]);
			}
			// o bebedouro lá no fundo, perto da porta dos hangares
			face(CAM_REC, [[24.8, 1.0, 6.8], [25.3, 1.0, 6.8], [25.3, 0, 6.8], [24.8, 0, 6.8]], '#e8ecf2');
			face(CAM_REC, [[24.85, 1.35, 6.8], [25.25, 1.35, 6.8], [25.25, 1.0, 6.8], [24.85, 1.0, 6.8]], '#9fd0ff');
			// as cadeiras pretas dos clientes e as pessoas sentadas, do mais longe para o mais perto
			for (k = 9; k >= 0; k--) {
				var cxk = guicheX(k) + GL / 2 + 0.1, pp = C(cxk, 0, 5.05), s = 300 / pp[2];
				// a sombra no chão
				elip(Math.round(pp[0]), Math.round(pp[1]), Math.round(0.32 * s), Math.max(1, Math.round(0.06 * s)), function (sx, sy) { mistura(sx, sy, '#4a4e5a', 0.3); return null; });
				var cl = CLIENTES[k];
				if (cl) colarSprite(pessoaDeCostas(s, cl), pp[0], pp[1]);
				else colarSprite(sprite(0.7, 1.05, s, function (X, Y) { cadeira(X, Y, s); }), pp[0], pp[1]);
			}
			// os postes com fita separando a fila
			var postes = [6.2, 7.7, 9.2, 10.7];
			postes.forEach(function (px0, i) {
				var b0 = C(px0, 0, 4.6), b1 = C(px0, 0.95, 4.6), sp = 290 / b0[2];
				elip(Math.round(b0[0]), Math.round(b0[1]), Math.max(2, Math.round(0.14 * sp)), Math.max(1, Math.round(0.035 * sp)), '#5a5e6a');
				ret(b1[0] - 1, b1[1], Math.max(2, 0.04 * sp), b0[1] - b1[1], function (sx) { return sx - b1[0] < 0 ? '#e8ecf4' : '#8a90a0'; });
				elip(Math.round(b1[0]), Math.round(b1[1]), Math.max(1, Math.round(0.035 * sp)), Math.max(1, Math.round(0.035 * sp)), '#c8ccd6');
				if (i < postes.length - 1) { var n1 = C(px0, 0.9, 4.6), n2 = C(postes[i + 1], 0.9, 4.6); for (var e = 0; e < Math.max(2, 0.05 * sp); e++) linha(n1[0], n1[1] + e, n2[0], n2[1] + e * 0.8, e < 1 ? '#5a8ee0' : '#2a5ab8'); }
			});
			totemEtc(C);
			jornalNoChao(C);
		});
	}
	// o totem de senhas, o porta-guarda-chuva e a plaquinha de piso molhado (no cenário e também numa
	// camada à parte, desenhada por cima de quem passa andando atrás deles)
	function totemEtc(C, camada) {
		// o totem de senhas: branco com o topo azul-marinho, a telinha, a fenda do papel e o selo dourado
		var T = TOTEM;
		face(C, [[T.x1, T.h, T.z0], [T.x1, T.h, T.z1], [T.x1, 0, T.z1], [T.x1, 0, T.z0]], function (sx, sy) { return rampa(['#c8ccd8', '#a8adbd', '#8a90a2'], ruido(sx, sy) * 0.3 + 0.4, sx, sy); });
		face(C, [[T.x0, T.h, T.z0], [T.x1, T.h, T.z0], [T.x1, 0, T.z0], [T.x0, 0, T.z0]], function (sx, sy) { var topo = C(T.x0, T.h, T.z0)[1], base = C(T.x0, 0, T.z0)[1]; return rampa(['#ffffff', '#f2f4f8', '#dfe2ea', '#c4c8d4'], (sy - topo) / Math.max(1, base - topo) * 0.6 + 0.1, sx, sy); });
		face(C, [[T.x0, T.h, T.z0], [T.x1, T.h, T.z0], [T.x1, T.h, T.z1], [T.x0, T.h, T.z1]], '#1c2a6e');
		face(C, [[T.x0, T.h, T.z0 - 0.003], [T.x1, T.h, T.z0 - 0.003], [T.x1, T.h - 0.16, T.z0 - 0.003], [T.x0, T.h - 0.16, T.z0 - 0.003]], function (sx, sy) { return rampa(['#26388a', '#1c2a6e', '#141f55'], (sy % 4) / 6, sx, sy); });
		quadTex(pintar(new Pintura(20, 14), function () { ret(0, 0, 20, 14, '#0a1840'); ret(1, 1, 18, 4, '#2a62c8'); letras('SENHA', 10, 1, 1, '#ffffff', true); letras('TOQUE', 10, 7, 1, '#7fe3ff', true); }), [C(T.x0 + 0.06, 1.18, T.z0 - 0.004), C(T.x1 - 0.06, 1.18, T.z0 - 0.004), C(T.x1 - 0.06, 0.88, T.z0 - 0.004), C(T.x0 + 0.06, 0.88, T.z0 - 0.004)]);
		face(C, [[T.x0 + 0.1, 0.74, T.z0 - 0.004], [T.x1 - 0.1, 0.74, T.z0 - 0.004], [T.x1 - 0.1, 0.71, T.z0 - 0.004], [T.x0 + 0.1, 0.71, T.z0 - 0.004]], '#1a1b20'); // a fenda do papel
		var selo = C((T.x0 + T.x1) / 2, 1.31, T.z0 - 0.004), ss = 290 / selo[2]; elip(Math.round(selo[0]), Math.round(selo[1]), Math.max(2, Math.round(0.05 * ss)), Math.max(2, Math.round(0.05 * ss)), '#e8c46a'); px(selo[0], selo[1], '#ff9a7a');
		// o porta-guarda-chuva com três guarda-chuvas molhados, e a poça embaixo
		var gb = C(5.05, 0, 3.9), gt = C(5.05, 0.55, 3.9), gs = 290 / gb[2];
		if (!camada) elip(Math.round(gb[0]), Math.round(gb[1]) + 1, Math.round(0.3 * gs), Math.max(1, Math.round(0.05 * gs)), function (sx, sy) { mistura(sx, sy, '#8ab0e8', 0.35); return null; });
		[['#ff3ab8', -0.06, 1.0], ['#3ae0ff', 0.04, 0.92], ['#ffd36a', 0.0, 1.05]].forEach(function (q) { var a = C(5.05 + q[1], 0.4, 3.9), b = C(5.05 + q[1] * 2.5, q[2], 3.9); for (var e = -1; e <= 1; e++) linha(a[0] + e, a[1], b[0] + e, b[1], q[0]); elip(Math.round(b[0]), Math.round(b[1]), 1, 1, '#3a3d48'); });
		ret(gt[0] - 0.11 * gs, gt[1], 0.22 * gs, gb[1] - gt[1], function (sx, sy) { return rampa(['#8a90a0', '#5a5e6a', '#3a3d48'], (sx - gt[0] + 0.11 * gs) / (0.22 * gs), sx, sy); });
		ret(gt[0] - 0.11 * gs, gt[1], 0.22 * gs, 1, '#c8ccd6');
		// a plaquinha amarela de "piso molhado"
		var pb = C(3.7, 0, 3.55), pt = C(3.7, 0.62, 3.55), ps = 290 / pb[2];
		poli([[pt[0] - 0.06 * ps, pt[1]], [pt[0] + 0.06 * ps, pt[1]], [pb[0] + 0.16 * ps, pb[1]], [pb[0] - 0.16 * ps, pb[1]]], function (sx, sy) { return rampa(['#ffe060', '#f0c030', '#c89a20'], (sx - pb[0] + 0.16 * ps) / (0.32 * ps) * 0.6 + 0.1, sx, sy); });
		var ic = C(3.7, 0.36, 3.55); elip(Math.round(ic[0]), Math.round(ic[1]), Math.max(1, Math.round(0.035 * ps)), Math.max(1, Math.round(0.035 * ps)), '#1a1a22'); ret(ic[0] - 0.05 * ps, ic[1] + 0.05 * ps, 0.1 * ps, Math.max(1, 0.02 * ps), '#1a1a22');
	}
	// onde fica o totem de senhas (metros)
	var TOTEM = { x0: 4.05, x1: 4.5, z0: 3.85, z1: 4.15, h: 1.42 };
	// as cadeiras azuis de espera, bem pertinho, presas numa barra de metal
	function cadeirasDaFrente(C) {
		{
			var zF = 3.05;
			for (var i2 = 4; i2 >= 0; i2--) { // (só cinco: à direita fica livre para ver o chão, a fila e quem passa)
				var ua = 0.1 + i2 * 0.6, ub = ua + 0.52;
				var c1 = C(ua, 0.9, zF), c2 = C(ub, 0.9, zF), c3 = C(ub, 0.42, zF), c4 = C(ua, 0.42, zF);
				if (c1[2] < 0.3) continue;
				// as pernas cromadas e a barra
				var l1 = C(ua + 0.05, 0.42, zF + 0.2), l2 = C(ua + 0.05, 0, zF + 0.2), l3 = C(ub - 0.05, 0.42, zF + 0.2), l4 = C(ub - 0.05, 0, zF + 0.2);
				linha(l1[0], l1[1], l2[0], l2[1], '#8a90a0'); linha(l3[0], l3[1], l4[0], l4[1], '#8a90a0');
				// o assento (que aparece por cima do encosto, porque estamos em pé atrás) e a espessura do encosto
				face(C, [[ua + 0.02, 0.46, zF + 0.08], [ub - 0.02, 0.46, zF + 0.08], [ub - 0.02, 0.46, zF + 0.52], [ua + 0.02, 0.46, zF + 0.52]], function (sx, sy) { return rampa(['#5a92f2', '#3d7ef0', '#2a66d8', '#1d50b6'], 0.3 + ruido(sx >> 1, sy) * 0.2 + (sx - c1[0]) / Math.max(1, c2[0] - c1[0]) * 0.3, sx, sy); });
				face(C, [[ua + 0.02, 0.42, zF + 0.5], [ub - 0.02, 0.42, zF + 0.5], [ub - 0.02, 0.46, zF + 0.52], [ua + 0.02, 0.46, zF + 0.52]], '#163f92');
				face(C, [[ua + 0.03, 0.9, zF], [ub - 0.03, 0.9, zF], [ub - 0.03, 0.9, zF + 0.05], [ua + 0.03, 0.9, zF + 0.05]], '#a8c8ff');
				// a concha de plástico vista de trás: azul forte com borda clara e sombra
				var r0 = Math.min(c1[0], c4[0]), r1 = Math.max(c2[0], c3[0]), rt = Math.min(c1[1], c2[1]), rb2 = Math.max(c3[1], c4[1]), raio = (r1 - r0) * 0.12;
				poli([c1, c2, c3, c4], function (sx, sy) {
					var dx = Math.max(0, r0 + raio - sx, sx - (r1 - raio)), dy = Math.max(0, rt + raio - sy);
					if (dx * dx + dy * dy > raio * raio) return null;
					var u = (sx - r0) / (r1 - r0), t = Math.pow(Math.abs(u - 0.28), 1.1) * 0.9 + (sy - rt) / (rb2 - rt) * 0.35, borda = (sx - r0) < 2 || (sy - rt) < 2 ? -0.25 : 0;
					return rampa(['#8ab8ff', '#5a92f2', '#3d7ef0', '#2a66d8', '#1d50b6', '#163f92'], t + borda + (ruido(sx >> 1, sy >> 1) - 0.5) * 0.06, sx, sy);
				});
				var meio = C((ua + ub) / 2, 0.72, zF), mw = (r1 - r0) * 0.18;
				ret(meio[0] - mw, meio[1], mw * 2, Math.max(2, (r1 - r0) * 0.03), '#163f92'); ret(meio[0] - mw, meio[1] + Math.max(2, (r1 - r0) * 0.03), mw * 2, 1, '#8ab8ff'); // o furinho da alça
				ret(r0 + raio, rt + 2, (r1 - r0) * 0.4, 1, '#c8dcff'); // o brilho da luz
			}
			var b1 = C(0.1, 0.38, zF + 0.2), b2 = C(3.1, 0.38, zF + 0.2);
			linha(b1[0], b1[1], b2[0], b2[1], '#5a5e6a'); linha(b1[0], b1[1] + 1, b2[0], b2[1] + 1, '#c8ccd6');
		}
	}
	// O retrato da fundadora em pixel art (64 x 80), para a foto do jornal: loira, cabelo comprido e
	// ondulado com a risca de lado e a franja varrendo a testa, olhos verde-acinzentados amendoados, o
	// piercing no nariz, o blazer azul-marinho da agência com o broche dourado. O rosto usa poucos tons
	// em faixas limpas (sem pontilhado), o cabelo tem fios ondulados e um brilho no alto da cabeça, e o
	// fundo é um céu com nebulosa que deixa uma luz de contorno azulada no cabelo.
	function retratoFundadora() {
		return pintar(new Pintura(64, 80), function () {
			function tom(cores, t) { return cores[Math.max(0, Math.min(cores.length - 1, Math.round(t * (cores.length - 1))))]; }
			var CAB = ['#fffbe6', '#fdeeb4', '#f5d98a', '#e6bf66', '#cfa04c', '#ad7f36', '#7f5a24', '#56391a'];
			var PELE = ['#fff1e6', '#fcdcc8', '#f3c6ab', '#e6aa8c', '#cf8e72', '#ad6f58'];
			var cabelo = new Uint8Array(64 * 80); // (onde tem cabelo, para a luz de contorno)
			function mecha(x, y, base) {
				var onda = Math.sin(x * 0.95 + Math.sin(y * 0.16) * 2.4);
				var t = base + (onda > 0.72 ? -0.22 : onda < -0.78 ? 0.18 : 0) + (ruido(x, y >> 2) > 0.93 ? -0.12 : 0);
				cabelo[y * 64 + x] = 1;
				return tom(CAB, t);
			}
			// o fundo: azul-marinho, uma nebulosa rosa e lilás atrás da cabeça e estrelinhas douradas
			for (var y = 0; y < 80; y++) for (var x = 0; x < 64; x++) {
				var d = Math.hypot((x - 30) / 34, (y - 30) / 30), n = ruido(x >> 2, y >> 2) * 0.15;
				px(x, y, d < 0.55 - n ? '#3a2a6e' : d < 0.8 - n ? '#2a2a72' : y < 40 ? '#1e2766' : '#18205a');
			}
			[[6, 7], [57, 11], [9, 47], [56, 40], [48, 4], [3, 26], [60, 60]].forEach(function (s, i) { px(s[0], s[1], '#ffe6a0'); if (i < 2) { px(s[0] - 1, s[1], '#b8903a'); px(s[0] + 1, s[1], '#b8903a'); px(s[0], s[1] - 1, '#b8903a'); px(s[0], s[1] + 1, '#b8903a'); } });
			// o cabelo de trás: a cúpula da cabeça e as ondas compridas descendo até o fim do quadro
			for (y = 6; y < 80; y++) for (x = 0; x < 64; x++) {
				var dentro = y < 30 ? Math.hypot((x - 32) / 21, (y - 29) / 22) < 1 : Math.abs(x - 32) < 21 + Math.min(4, (y - 30) * 0.12) + Math.sin(y * 0.3) * 1.2 && y < 76 + Math.sin(x * 0.7) * 3;
				if (dentro) px(x, y, mecha(x, y, 0.38 + Math.pow(Math.abs(x - 32) / 24, 2) * 0.45 + (y > 66 ? 0.1 : 0)));
			}
			// o brilho no alto da cabeça (uma faixa curva de luz)
			for (x = 18; x < 44; x++) { var yb = 15 + Math.pow((x - 31) / 13, 2) * 6; px(x, yb, x < 36 ? CAB[0] : CAB[1]); if (x > 21 && x < 33) px(x, yb + 1, CAB[1]); }
			// o pescoço, com a sombra do queixo
			for (y = 48; y < 63; y++) for (x = 28; x < 37; x++) px(x, y, y < 53 ? PELE[3] : x > 34 ? PELE[2] : PELE[1]);
			// o blazer, a blusa branca em V, a lapela dourada e o broche da agência
			poli([[0, 80], [64, 80], [63, 70], [46, 61], [18, 61], [1, 70]], function (x2, y2) { return x2 < 24 ? '#33489c' : x2 < 44 ? '#26388a' : '#1c2a72'; });
			for (y = 62; y < 80; y++) { px(10 + (y - 62) * 0.3, y, '#141f55'); px(54 - (y - 62) * 0.3, y, '#141f55'); } // as dobras
			poli([[24, 61], [40, 61], [32, 75]], function (x2, y2) { return x2 > 33 ? '#e4dff0' : '#ffffff'; });
			for (var k = 0; k < 14; k++) { px(24 + k * 0.57, 61 + k, '#f0cf78'); px(40 - k * 0.57, 61 + k, '#c8a040'); }
			elip(46, 69, 3, 3, '#b8903a'); elip(46, 69, 2, 2, '#f0cf78'); px(46, 69, '#ff8a9a'); px(45, 68, '#fffbe6');
			// o rosto: oval com o queixo afinando; a luz vem da esquerda (três faixas de tom, sem pontilhado)
			for (y = 20; y < 52; y++) {
				var v = (y - 34) / 16, hw = 11.6 * Math.sqrt(Math.max(0, 1 - v * v)) * (y > 40 ? 1 - (y - 40) * 0.028 : 1);
				for (x = Math.ceil(32 - hw); x < 32 + hw; x++) {
					// (um tom de base; o mais claro na testa e na maçã da esquerda; dois tons de sombra na direita)
					var u = (x - 32) / hw, t2 = u > 0.82 ? 0.6 : u > 0.5 ? 0.4 : u < -0.86 ? 0.2 : (u < -0.45 && y > 26 && y < 44) || (y < 30 && u < 0.2) ? 0 : 0.2;
					if (y < 25) t2 += 0.2; // a sombrinha da franja na testa
					px(x, y, tom(PELE, t2));
				}
			}
			// as maçãs do rosto coradinhas e a sombra do maxilar
			[[24, 40], [25, 40], [26, 41], [38, 40], [39, 40], [38, 41]].forEach(function (b) { mistura(b[0], b[1], '#f2909c', 0.35); });
			for (y = 44; y < 51; y++) px(32 + 11.6 * (1 - (y - 40) * 0.028) * Math.sqrt(Math.max(0, 1 - Math.pow((y - 34) / 16, 2))) - 1, y, PELE[4]);
			// as mechas da frente caindo pelos ombros (por cima do blazer)
			poli([[9, 38], [20, 44], [22, 66], [18, 77], [11, 74], [7, 56]], function (x2, y2) { return mecha(x2, y2, 0.22 + (x2 - 7) / 15 * 0.4); });
			poli([[44, 44], [55, 38], [57, 56], [53, 74], [46, 77], [42, 66]], function (x2, y2) { return mecha(x2, y2, 0.4 + (x2 - 42) / 15 * 0.35); });
			// a franja: a risca do lado esquerdo e o cabelo varrendo a testa até a têmpora direita
			poli([[23, 11], [41, 14], [48, 25], [47, 40], [43, 31], [36, 24], [28, 22], [24, 24]], function (x2, y2) { return mecha(x2, y2, 0.12 + (y2 - 11) / 29 * 0.4 + (x2 > 44 ? 0.15 : 0)); });
			poli([[12, 20], [23, 11], [22, 22], [20, 32], [19, 44], [13, 38]], function (x2, y2) { return mecha(x2, y2, 0.3 + (x2 - 12) / 11 * 0.25); });
			for (var r = 0; r < 6; r++) px(23, 11 + r, CAB[5]); // a risca
			for (x = 27; x < 45; x++) px(x, 22 + (x - 27) * 0.45, (x % 3) ? CAB[5] : CAB[6]); // a borda da franja, com a sombra na testa
			// as sobrancelhas, em arco
			[[23, 31], [24, 30], [25, 30], [26, 30], [27, 30], [28, 31]].forEach(function (b) { px(b[0], b[1], '#b48c55'); });
			[[36, 31], [37, 30], [38, 30], [39, 30], [40, 30], [41, 31]].forEach(function (b) { px(b[0], b[1], '#a07a46'); });
			// os olhos amendoados, verde-acinzentados, com delineado e o brilhinho
			[26, 38].forEach(function (cx, i) {
				for (var xx = cx - 2; xx <= cx + 2; xx++) px(xx, 35, '#fbf8f2');
				for (xx = cx - 3; xx <= cx + 3; xx++) px(xx, 36, '#f4efe6');
				for (xx = cx - 2; xx <= cx + 2; xx++) px(xx, 37, '#e8ddd2');
				px(cx - 1, 35, '#5f7d73'); px(cx, 35, '#5f7d73'); px(cx + 1, 35, '#5f7d73');
				px(cx - 1, 36, '#86a598'); px(cx, 36, '#1e2826'); px(cx + 1, 36, '#86a598');
				px(cx - 1, 37, '#9fbdb0'); px(cx, 37, '#a9c6b9'); px(cx + 1, 37, '#9fbdb0');
				px(cx - 1, 35, '#ffffff'); // o brilho
				for (xx = cx - 3; xx <= cx + 3; xx++) px(xx, 34, '#3a2a1e'); // o delineado de cima
				px(i ? cx + 4 : cx - 4, 33, '#3a2a1e'); // o "rabinho" do delineado
				px(cx - 3, 37, '#d8a890'); px(cx + 3, 37, '#d8a890');
			});
			// o nariz (a luz na ponte, a sombra do lado), o piercing brilhando na narina e a boca
			// (nariz e boca mais para cima, nas proporções certas do rosto)
			for (y = 37; y < 40; y++) px(32, y, PELE[1]);
			px(33, 39, PELE[3]); px(33, 40, PELE[3]); px(32, 41, PELE[2]); px(30, 42, PELE[4]); px(31, 42, PELE[3]); px(34, 42, PELE[4]); px(33, 42, PELE[3]);
			px(35, 41, '#ffffff'); px(35, 42, '#b8c0d0'); px(36, 41, '#e8ecf4'); // o piercing
			for (x = 28; x <= 36; x++) px(x, 44, x === 32 ? '#d47880' : '#c4646e'); // o lábio de cima, com o arco do meio
			px(30, 43, '#c4646e'); px(34, 43, '#c4646e');
			for (x = 29; x <= 35; x++) px(x, 45, '#e48e96'); px(31, 45, '#f6bcc0'); px(32, 45, '#f6bcc0');
			for (x = 30; x <= 34; x++) px(x, 46, '#d47880');
			px(27, 44, PELE[3]); px(37, 44, PELE[3]); px(32, 48, PELE[3]); // os cantinhos e a sombra do queixo
			// a luz de contorno: a borda do cabelo que encosta no céu ganha um fio azulado da nebulosa
			for (y = 1; y < 79; y++) for (x = 1; x < 63; x++) {
				if (!cabelo[y * 64 + x] || x < 32) continue;
				if (!cabelo[y * 64 + x + 1] && !cabelo[(y - 1) * 64 + x + 1]) mistura(x, y, '#a8d8ff', 0.55);
			}
		});
	}
	// o easter egg: a Gazeta Estelar caída no chão da recepção, ao lado das cadeiras da frente, perto
	// das pegadas molhadas (alguém deixou cair chegando da chuva): uma folha embaixo, a primeira página
	// por cima com a faixa do nome do jornal, a fotinho da fundadora, a manchete e as colunas, e a
	// sombra. Um clique abre o jornal.
	var JORNAL_CHAO = { x: 3.4, z: 3.05 };
	// o jornal em pixels, à mão (sem perspectiva, como os objetos de chão das pixel arts): uma folha
	// deitada em paralelogramo, 56 x 18, com a ponta de cima puxada para a direita
	var JL = 56, JA = 18, JINC = 8;
	function jornalNoChao(C) {
		var c0 = C(JORNAL_CHAO.x, 0, JORNAL_CHAO.z), ox = Math.round(c0[0] - JL / 2), oy = Math.round(c0[1] - JA / 2);
		function P2(lx, ly, cor) { px(ox + lx + Math.round(JINC * (1 - ly / JA)), oy + ly, cor); }
		function folha(dx, dy, cor, borda) {
			for (var ly = 0; ly < JA; ly++) for (var lx = 0; lx < JL; lx++) {
				var b = lx === 0 || ly === 0 || lx === JL - 1 || ly === JA - 1;
				P2(lx + dx, ly + dy, b ? borda : typeof cor === 'function' ? cor(lx, ly) : cor);
			}
		}
		// a sombra no piso e a folha de baixo (um pouco deslocada, mais escura)
		for (var ly = 0; ly < JA; ly++) for (var lx = 0; lx < JL; lx++) mistura(ox + lx + 2 + Math.round(JINC * (1 - ly / JA)), oy + ly + 2, '#3a3e4a', 0.3);
		folha(-4, 2, '#d8cfb8', '#b0a68e');
		// a primeira página
		folha(0, 0, function (lx, ly) { return lx === JL / 2 ? '#d0c6ae' : lx > JL / 2 ? '#e8e0cc' : '#f4eedd'; }, '#a89e86');
		// o nome do jornal: "letrinhas" de 1 pixel em blocos, e a linha dupla embaixo
		for (var lx2 = 6; lx2 < JL - 6; lx2++) if (lx2 % 4 !== 3 && (lx2 < 26 || lx2 > 28)) { P2(lx2, 2, '#26262e'); if (lx2 % 2) P2(lx2, 3, '#26262e'); }
		for (lx2 = 3; lx2 < JL - 3; lx2++) { P2(lx2, 5, '#26262e'); P2(lx2, 6, '#b8ae98'); }
		// a fotinho da fundadora: o fundo azul, o cabelo loiro, o rosto e o blazer
		for (ly = 8; ly < 16; ly++) for (lx2 = 4; lx2 < 13; lx2++) {
			var cor = '#1c2a6e';
			if (ly >= 9 && ly <= 12 && lx2 >= 6 && lx2 <= 10) cor = (ly >= 10 && lx2 >= 7 && lx2 <= 9) ? '#f6d4bc' : '#f2d27c';
			if (ly >= 13 && lx2 >= 6 && lx2 <= 10) cor = ly === 13 && lx2 === 8 ? '#f4f0fc' : '#2c4092';
			P2(lx2, ly, cor);
		}
		// a manchete (traços grossos) e as colunas de texto (traços cinza)
		for (lx2 = 16; lx2 < JL - 4; lx2++) if (lx2 % 5 !== 4) { P2(lx2, 8, '#26262e'); P2(lx2, 9, '#26262e'); }
		for (lx2 = 16; lx2 < 40; lx2++) if (lx2 % 6 !== 5) P2(lx2, 11, '#26262e');
		[13, 15].forEach(function (yy) { for (var xx = 16; xx < JL - 4; xx++) if (xx % 7 !== 6) P2(xx, yy, '#a49a86'); });
		// um pingo de chuva molhando a ponta
		mistura(ox + JL - 6, oy + JA - 3, '#8ab0e8', 0.5); mistura(ox + JL - 5, oy + JA - 3, '#8ab0e8', 0.4);
	}
	// onde fica o jornal na tela (para o clique)
	function areaJornal(C) {
		var c0 = C(JORNAL_CHAO.x, 0, JORNAL_CHAO.z);
		return [c0[0] - JL / 2 - 6, c0[1] - JA / 2 - 2, JL + JINC + 8, JA + 6];
	}	function abrirJornal() {
		if (raiz.querySelector('.emb-jornal')) return;
		SONS.folha();
		var j = document.createElement('div');
		j.className = 'emb-jornal';
		j.innerHTML =
			'<article class="emb-jornal-folha" role="dialog" aria-label="' + T('Gazeta Estelar, primeira página', 'Stellar Gazette, front page') + '">' +
				T('<header><span>Ano LI · nº 2077</span><h2>Gazeta Estelar</h2><span>Porto Andarilha · 1 crédito</span></header>' +
				'<h3>A Agência Andarilha abre as portas</h3>' +
				'<p class="emb-jornal-linha-fina">A primeira agência de turismo espacial em pixel art da galáxia abre as portas com fila, senha, guichê 11 e um robô atendente muito educado</p>' +
				'<figure><figcaption>A fundadora no dia da inauguração</figcaption></figure>' +
				'<div class="emb-jornal-colunas">' +
					'<p>PORTO ANDARILHA — Quem passou pela rua da agência ontem à noite, debaixo de chuva, viu a fila dobrar a esquina. A fundadora cortou a fita dourada às 20h, horário local, e prometeu "a galáxia inteira, carimbo por carimbo".</p>' +
					'<p>O atendente ZÖ-11 recebeu o primeiro piloto com um aceno e um café. "Ele não bebe, mas gosta de oferecer", explicou a fundadora. A nave da casa, a PX-01, espera no hangar 11 com o tanque cheio.</p>' +
					'<p><b>Previsão do tempo:</b> chuva ácida leve na rua, céu limpo acima da atmosfera. <b>Classificados:</b> vende-se capacete usado, pouco orbitado.</p>' +
				'</div>' +
				'<button type="button" class="emb-jornal-fechar">Dobrar o jornal</button>',
				'<header><span>Year LI · No. 2077</span><h2>Stellar Gazette</h2><span>Andarilha Port · 1 credit</span></header>' +
				'<h3>The Andarilha Agency opens its doors</h3>' +
				'<p class="emb-jornal-linha-fina">The first pixel art space tourism agency in the galaxy opens its doors with a queue, ticket numbers, desk 11 and a very polite robot clerk</p>' +
				'<figure><figcaption>The founder on opening day</figcaption></figure>' +
				'<div class="emb-jornal-colunas">' +
					'<p>ANDARILHA PORT — Anyone who walked down the agency street last night, in the rain, saw the line wrap around the corner. The founder cut the golden ribbon at 8 p.m. local time and promised "the whole galaxy, one stamp at a time".</p>' +
					'<p>The clerk ZÖ-11 welcomed the first pilot with a wave and a coffee. "He doesn\'t drink it, but he likes to offer", the founder explained. The house ship, the PX-01, waits in hangar 11 with a full tank.</p>' +
					'<p><b>Weather:</b> light acid rain on the street, clear skies above the atmosphere. <b>Classifieds:</b> used helmet for sale, barely orbited.</p>' +
				'</div>' +
				'<button type="button" class="emb-jornal-fechar">Fold the newspaper</button>') +
			'</article>';
		var foto = paraCanvas(retratoFundadora(false)); foto.className = 'emb-jornal-foto';
		var fig = j.querySelector('figure'); fig.insertBefore(foto, fig.firstChild);
		function fechar() { SONS.folha(); j.classList.add('fechando'); setTimeout(function () { j.remove(); }, 250); }
		j.addEventListener('click', function (e) { if (e.target === j || e.target.classList.contains('emb-jornal-fechar')) fechar(); });
		palco.appendChild(j);
		setTimeout(function () { var b = j.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 50);
	}
	// o cliente que acabou de ser atendido no guichê 6 indo embora, andando de lado (perfil, virado
	// para a direita), com os braços e as pernas balançando a cada passo
	var ANDANTE = { pele: '#e8b890', pele2: '#c89068', cabelo: ['#c87a3a', '#a85a22', '#7a3a12'], roupa: ['#4a6aa8', '#3a5a98', '#2a4a80', '#1e3a66'], calca: ['#3a3a44', '#2a2a32', '#1e1e24'] };
	function pessoaAndando(s, passo) {
		var p = ANDANTE;
		return sprite(0.7, 1.8, s, function (X, Y) {
			var a = Math.sin(passo * Math.PI) * 0.16; // o balanço das pernas e dos braços
			// a perna de trás, a de frente e os sapatos
			[[-a, 0.6], [a, 0]].forEach(function (q, i) {
				var pe = q[0], cor = i ? p.calca : p.calca.slice(1);
				poli([[X(-0.05), Y(0.9)], [X(0.05), Y(0.9)], [X(pe + 0.04), Y(0.06)], [X(pe - 0.05), Y(0.06)]], function (x, y) { return rampa(cor, (x - X(pe - 0.05)) / (0.1 * s) * 0.5 + q[1] * 0.4, x, y); });
				ret(X(pe - 0.06), Y(0.07), 0.16 * s, 0.07 * s, i ? '#3a2a22' : '#2a1e18'); ret(X(pe - 0.06), Y(0.02), 0.16 * s, Math.max(1, 0.02 * s), '#8a7a6a');
			});
			// o braço de trás
			poli([[X(-0.04), Y(1.38)], [X(0.04), Y(1.38)], [X(a * 0.9 + 0.03), Y(0.85)], [X(a * 0.9 - 0.04), Y(0.85)]], function (x, y) { return rampa(p.roupa, 0.85, x, y); });
			// o tronco de lado (casaco com zíper e bolso) e a mochila
			poli([[X(-0.12), Y(1.45)], [X(0.1), Y(1.45)], [X(0.11), Y(0.86)], [X(-0.11), Y(0.86)]], function (x, y) { return rampa(p.roupa, (x - X(-0.12)) / (0.23 * s) * 0.6 + 0.1 + (ruido(x >> 1, y >> 1) - 0.5) * 0.08, x, y); });
			ret(X(0.08), Y(1.4), 1, 0.5 * s, '#c8ccd6'); ret(X(-0.02), Y(1.05), 0.08 * s, 1, '#1e3a66');
			ret(X(-0.22), Y(1.42), 0.11 * s, 0.4 * s, function (x, y) { return rampa(['#e8c040', '#c8a030', '#8a6a18'], (x - X(-0.22)) / (0.11 * s), x, y); });
			// o pescoço e a cabeça de perfil: nariz, orelha, cabelo ruivo atrás
			ret(X(-0.03), Y(1.54), 0.07 * s, 0.1 * s, p.pele2);
			var cy = Math.round(Y(1.64)), rx = Math.max(2, Math.round(0.1 * s)), ry = Math.max(3, Math.round(0.115 * s));
			elip(Math.round(X(0.01)), cy, rx, ry, function (x, y, u) { return rampa([p.pele, p.pele, p.pele2], (1 - u) / 2 * 0.6, x, y); });
			ret(X(0.1), Y(1.64), Math.max(1, 0.025 * s), Math.max(1, 0.03 * s), p.pele2); // o nariz
			elip(Math.round(X(-0.02)), cy - Math.round(0.02 * s), rx, ry, function (x, y, u, v) { return (u > 0.25 && v > -0.55) ? null : rampa(p.cabelo, (u + 1) / 2 * 0.5 + (ruido(x, y >> 1) - 0.5) * 0.4, x, y); });
			elip(Math.round(X(-0.01)), Math.round(Y(1.63)), Math.max(1, Math.round(0.02 * s)), Math.max(1, Math.round(0.03 * s)), p.pele2); // a orelha
			// o braço da frente, balançando ao contrário
			poli([[X(-0.03), Y(1.4)], [X(0.05), Y(1.4)], [X(-a * 0.9 + 0.04), Y(0.86)], [X(-a * 0.9 - 0.04), Y(0.86)]], function (x, y) { return rampa(p.roupa, 0.2, x, y); });
			ret(X(-a * 0.9 - 0.03), Y(0.88), 0.06 * s, 0.06 * s, p.pele);
		});
	}
	var andanteCache = {};
	CENAS.recepcao = {
		fundo: function () {
			// o painel de senhas: nossa senha (011, guichê 11) piscando, depois chamam a próxima (012, guichê 9)
			this.apagado = paraCanvas(recepcao(null));
			this.antes = paraCanvas(recepcao(['010', '7'])); // (a senha anterior, antes de pegarmos a nossa)
			this.outra = paraCanvas(recepcao(['012', '9']));
			this.frente = paraCanvas(recepcao(null, true));
			this.totemCamada = paraCanvas(recepcao(null, 'totem'));
			andanteCache = {};
			var principal = recepcao(['011', '11']);
			this.vitrine = mascaraVitrine(principal);
			this.lafora = document.createElement('canvas'); this.lafora.width = principal.w; this.lafora.height = principal.h;
			return paraCanvas(principal);
		},
		quadro: function (c, t) {
			var C = CAM_REC;
			// o painel: até 7 s a nossa senha pisca; depois, de 9 em 9 s, chamam outra pessoa (com o "ding")
			// (antes de pegar a senha, o painel mostra a anterior; depois chama a nossa, e de 9 em 9 s, a próxima)
			var ts = this.chamada ? t - this.chamada : -1;
			if (ts < 0) c.drawImage(this.antes, -OX, 0);
			else if (ts < 7) { if (Math.sin(ts * 4) < -0.4) c.drawImage(this.apagado, -OX, 0); }
			else {
				var ciclo = Math.floor((ts - 7) / 9), fase = (ts - 7) % 9;
				if (ciclo !== this.ultimaChamada) { this.ultimaChamada = ciclo; SONS.ding(); SONS.anuncio(); }
				if (fase < 4) c.drawImage(Math.sin(t * 4) < -0.4 ? this.apagado : this.outra, -OX, 0);
			}
			var mostraCadeira = this.chamada && t > this.chamada;
			var x0 = guicheX(2), cx = x0 + GL / 2 + 0.1;
			// o ZÖ-11 (guichê 11) acenando para o piloto
			var rh = C(x0 + GL / 2 - 0.17, 1.62, 6.55), s = 300 / rh[2], aceno = Math.round(Math.sin(t * 7) * 0.05 * s);
			var ox = x0 + GL / 2 - 0.35, onda = Math.sin(t * 6) * 0.05;
			var ombro = C(ox + 0.24, 1.26, 6.55), cotovelo = C(ox + 0.33, 1.4, 6.55), pulso2 = C(ox + 0.35 + onda, 1.62, 6.55);
			linhaGrossa(c, ombro, cotovelo, Math.max(2, 0.07 * s), '#24357e'); linhaGrossa(c, cotovelo, pulso2, Math.max(2, 0.06 * s), '#1c2a6e');
			R(c, pulso2[0] - 0.035 * s, pulso2[1] - 0.02 * s, 0.07 * s + 1, Math.max(1, 0.02 * s), '#f2eefc'); // o punho branco
			var mao = Math.max(3, Math.round(0.08 * s)), hx = Math.round(pulso2[0] - mao / 2), hy = Math.round(pulso2[1] - mao - 1);
			R(c, hx, hy, mao, mao, '#a8acc4'); R(c, hx, hy, mao, 1, '#dfe2ef'); R(c, hx + mao - 1, hy, 1, mao, '#7a7e98');
			for (var dd = 0; dd < 3; dd++) R(c, hx + dd * Math.max(1, Math.round(mao / 3)), hy - Math.max(2, Math.round(mao * 0.5)), 1, Math.max(2, Math.round(mao * 0.5)), dd === 1 ? '#dfe2ef' : '#a8acc4');
			R(c, hx - 1, hy + 1, 1, Math.max(1, Math.round(mao / 2)), '#a8acc4'); // o polegar
			// o círculo de luz no chão em volta da cadeira do guichê 11 (somando luz, sem sujar o chão)
			var pc = C(cx, 0, 5.05), sc = 300 / pc[2], pulso = 0.5 + 0.5 * Math.sin(t * 4);
			c.save(); c.globalCompositeOperation = 'lighter'; if (!mostraCadeira) c.globalAlpha = 0;
			c.globalAlpha = mostraCadeira ? 0.18 + pulso * 0.22 : 0; c.fillStyle = '#ffd36a';
			c.beginPath(); c.ellipse(pc[0], pc[1], 0.42 * sc, 0.09 * sc, 0, 0, Math.PI * 2); c.fill();
			c.globalAlpha = mostraCadeira ? 0.5 + pulso * 0.5 : 0; c.strokeStyle = '#ffe9a0'; c.lineWidth = 1;
			c.beginPath(); c.ellipse(pc[0], pc[1], 0.46 * sc + pulso * 2, 0.1 * sc + pulso, 0, 0, Math.PI * 2); c.stroke();
			c.restore();
			// lá fora, pela vitrine: as naves decolando das torres, as luzes piscando e a chuva no vidro
			if (this.vitrine) {
				var lf = this.lafora.getContext('2d');
				lf.setTransform(1, 0, 0, 1, 0, 0); lf.globalCompositeOperation = 'source-over'; lf.globalAlpha = 1; lf.clearRect(0, 0, this.lafora.width, this.lafora.height); lf.translate(OX, 0);
				var naParedeP = function (wx, wy) { return C(wx, wy, ZW - 0.005); };
				TORRES_PORTO.forEach(function (tx, i) {
					var topo = naParedeP(tx, 2.83); if (Math.sin(t * 2.5 + i * 1.7) > 0.3) { R(lf, topo[0] - 1, topo[1] - 1, 3, 3, 'rgba(255,58,90,0.5)'); P(lf, topo[0], topo[1], '#ffb0b8'); }
					// a decolagem: de 16 em 16 s uma torre lança a nave (fogo, fumaça e o clarão no horizonte)
					var fase = (t + i * 4) % 16;
					if (fase < 5.5) {
						var sobe = fase < 1.2 ? 0 : (fase - 1.2) * (fase - 1.2) * 0.09, base = naParedeP(tx + 0.21, HORIZ_PORTO + sobe), ponta = naParedeP(tx + 0.21, HORIZ_PORTO + 0.3 + sobe), es = Math.max(1, 290 / base[2] * 0.2);
						for (var fm = 0; fm < 14; fm++) { var fu = ((t * 2 + fm / 14) % 1), fp = naParedeP(tx + 0.21 + (ruido(fm, 5) - 0.5) * (0.1 + fu * 0.5), HORIZ_PORTO + fu * 0.12); lf.globalAlpha = (1 - fu) * 0.5 * Math.min(1, fase); R(lf, fp[0] - 2 - fu * 3, fp[1] - 1, 4 + fu * 6, 2 + fu * 2, '#c8c0d8'); } /* a fumaça na base */
						lf.globalAlpha = 1;
						if (fase > 1.2) {
							var rastro = Math.min(0.5, sobe); for (var rr = 0; rr < 1; rr += 0.04) { var rp = naParedeP(tx + 0.21, HORIZ_PORTO + sobe - rastro * rr); lf.globalAlpha = (1 - rr) * 0.8; R(lf, rp[0] - 1, rp[1], 2, 2, rr < 0.15 ? '#ffffff' : rr < 0.4 ? '#ffd36a' : '#ff7a3a'); }
							lf.globalAlpha = 1;
						}
						R(lf, ponta[0] - es / 2, ponta[1], es, base[1] - ponta[1], '#eef1fb'); R(lf, ponta[0] - es / 2, ponta[1], 1, base[1] - ponta[1], '#ffffff'); P(lf, ponta[0], ponta[1] + 2, '#7fe3ff');
						if (fase > 1 && fase < 3) { lf.globalAlpha = 0.25 * (1 - Math.abs(fase - 2)); var hz = naParedeP(tx, HORIZ_PORTO); R(lf, hz[0] - 40, hz[1] - 6, 80, 8, '#ffb860'); lf.globalAlpha = 1; }
					}
				});
				// uma nave de carga cruzando o céu devagar, com as luzes de navegação
				var cz = ((t * 0.5) % 34) - 3, cp = naParedeP(cz, 2.68), ce = Math.max(2, 290 / cp[2] * 0.3);
				R(lf, cp[0] - ce, cp[1], ce * 2, Math.max(1, ce / 3), '#3a3d58'); if (Math.sin(t * 6) > 0) { P(lf, cp[0] - ce, cp[1], '#ff3a3a'); P(lf, cp[0] + ce, cp[1], '#3aff8a'); }
				// as gotas escorrendo no vidro
				for (var gv = 0; gv < 40; gv++) { var gx3 = -1.8 + ruido(gv, 61) * 27, gf = (t * (0.05 + ruido(gv, 62) * 0.08) + ruido(gv, 63)) % 1, gp = naParedeP(gx3, 2.92 - gf * 0.86); lf.globalAlpha = 0.5; R(lf, gp[0], gp[1] - 2, 1, 3, '#cfe8ff'); }
				lf.globalAlpha = 1;
				lf.setTransform(1, 0, 0, 1, 0, 0); lf.globalCompositeOperation = 'destination-in'; lf.drawImage(this.vitrine, 0, 0); lf.globalCompositeOperation = 'source-over';
				c.drawImage(this.lafora, -OX, 0);
			}
			// o cliente indo embora: levanta do guichê 6 e anda pelo corredor em direção à saída (para a esquerda)
			var volta = (t + 3) % 18;
			if (volta < 14) {
				var u = volta / 14, ax0 = guicheX(7) + GL / 2 + 0.1, wx = ax0 - u * (ax0 + 1.5), wz = 5.05 - Math.min(1, u * 5) * 0.7;
				var pw = C(wx, 0, wz), sw = 290 / pw[2], passo = Math.floor(volta * 3.2) % 2, chave = Math.round(sw) + '-' + passo;
				var spw = andanteCache[chave] || (andanteCache[chave] = pessoaAndandoCanvas(sw, passo));
				c.fillStyle = 'rgba(60,64,80,0.25)'; c.beginPath(); c.ellipse(pw[0], pw[1], 0.25 * sw, 0.05 * sw, 0, 0, Math.PI * 2); c.fill();
				c.save(); c.translate(Math.round(pw[0]), 0); c.scale(-1, 1); c.drawImage(spw.k, -Math.round(spw.ax), Math.round(pw[1] - spw.ay - (passo ? 1 : 0))); c.restore();
			}
			// o totem e o porta-guarda-chuva por cima de quem passa atrás deles
			if (this.totemCamada) c.drawImage(this.totemCamada, -OX, 0);
			// o totem: a telinha brilhando e uma setinha chamando, até pegarmos a senha; depois, o papel saindo
			var Tt = TOTEM, tela1 = C(Tt.x0 + 0.06, 1.18, Tt.z0), tela2 = C(Tt.x1 - 0.06, 0.88, Tt.z0);
			if (!this.senha) {
				c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25 + 0.25 * Math.sin(t * 5); R(c, tela1[0], tela1[1], tela2[0] - tela1[0], tela2[1] - tela1[1], '#7fe3ff'); c.restore();
				var st = C((Tt.x0 + Tt.x1) / 2, Tt.h + 0.25, Tt.z0); // (a setinha em cima do totem é desenhada no fim, por cima das cadeiras)
			} else {
				var ps2 = Math.min(1, (t - this.senha) / 0.7), fenda = C((Tt.x0 + Tt.x1) / 2, 0.72, Tt.z0 - 0.01), es = 290 / fenda[2];
				var pw2 = Math.max(4, Math.round(0.14 * es)), ph2 = Math.round(0.2 * es * ps2);
				R(c, fenda[0] - pw2 / 2, fenda[1], pw2, ph2, '#fbfbf4'); R(c, fenda[0] + pw2 / 2 - 1, fenda[1], 1, ph2, '#d8d8cc');
				if (ps2 > 0.6) { texto3(c, '011', Math.round(fenda[0] - 5), Math.round(fenda[1] + ph2 * 0.45), 1, '#1a2a7a'); }
			}
			// o robô-garçom flutuante servindo café na sala de espera: desliza devagar de um lado para o
			// outro, para de vez em quando, e leva uma bandeja com duas xícaras fumegando
			var cic = (t * 0.07) % 2, ida3 = cic < 1, uu = ida3 ? cic : 2 - cic; uu = uu * uu * (3 - 2 * uu);
			var gxr = 0.9 + uu * 2.7, gzr = 4.15, gyr = 1.45 + Math.sin(t * 2.2) * 0.03, gp2 = C(gxr, gyr, gzr), gs2 = 290 / gp2[2];
			var gr2 = Math.max(4, Math.round(0.13 * gs2)), gch2 = C(gxr, 0, gzr);
			c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 + Math.sin(t * 6) * 0.03; c.fillStyle = '#7fe3ff';
			c.beginPath(); c.moveTo(gp2[0] - gr2 * 0.5, gp2[1] + gr2); c.lineTo(gp2[0] + gr2 * 0.5, gp2[1] + gr2); c.lineTo(gch2[0] + gr2, gch2[1]); c.lineTo(gch2[0] - gr2, gch2[1]); c.fill(); /* o facho do propulsor */
			c.restore(); c.globalAlpha = 1;
			c.fillStyle = 'rgba(60,64,80,0.25)'; c.beginPath(); c.ellipse(gch2[0], gch2[1], gr2, gr2 * 0.25, 0, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#eef1fb'; c.beginPath(); c.arc(gp2[0], gp2[1], gr2, Math.PI, 0); c.fill(); /* a cúpula */
			R(c, gp2[0] - gr2, gp2[1], gr2 * 2, Math.round(gr2 * 0.7), '#d8dce8'); R(c, gp2[0] - gr2, gp2[1] + Math.round(gr2 * 0.7), gr2 * 2, 1, '#8a90a8');
			R(c, gp2[0] - gr2, gp2[1] - 1, gr2 * 2, 2, '#2f62b6'); /* a faixa azul da agência */
			var olhar = ida3 ? 1 : -1, ex = Math.round(gp2[0] + olhar * gr2 * 0.25);
			R(c, ex - Math.round(gr2 * 0.55), gp2[1] - Math.round(gr2 * 0.75), Math.round(gr2 * 1.1), Math.round(gr2 * 0.45), '#0a1424');
			var pisc2 = (t % 3.5) < 0.12; if (!pisc2) { R(c, ex - Math.round(gr2 * 0.35), gp2[1] - Math.round(gr2 * 0.6), 2, 2, '#7fe3ff'); R(c, ex + Math.round(gr2 * 0.15), gp2[1] - Math.round(gr2 * 0.6), 2, 2, '#7fe3ff'); }
			R(c, gp2[0], gp2[1] - gr2 - 3, 1, 3, '#8a90a8'); P(c, gp2[0], gp2[1] - gr2 - 4, Math.sin(t * 4) > 0 ? '#ffd36a' : '#ff8ad8'); /* a antena */
			var bx3 = Math.round(gp2[0] + olhar * gr2 * 1.2), by3 = Math.round(gp2[1] + gr2 * 0.2); /* o braço e a bandeja */
			R(c, olhar > 0 ? gp2[0] + gr2 - 1 : bx3, by3, Math.abs(bx3 - gp2[0]) - gr2 + 1, 1, '#a8acc4');
			R(c, bx3 - Math.round(gr2 * 0.6), by3, Math.round(gr2 * 1.2), 1, '#c8a040');
			[-0.3, 0.2].forEach(function (dxc, ic) {
				var xc = Math.round(bx3 + dxc * gr2), hc2 = Math.max(2, Math.round(gr2 * 0.3));
				R(c, xc, by3 - hc2, Math.max(2, Math.round(gr2 * 0.25)), hc2, '#f2eee8'); R(c, xc, by3 - hc2, Math.max(2, Math.round(gr2 * 0.25)), 1, '#6a3a1e');
				for (var vs = 0; vs < 2; vs++) { var fv3 = ((t * 0.9 + vs / 2 + ic * 0.3) % 1); c.globalAlpha = (1 - fv3) * 0.45; P(c, xc + 1 + Math.sin(fv3 * 6 + ic) * 1.2, by3 - hc2 - 1 - fv3 * 7, '#ffffff'); }
				c.globalAlpha = 1;
			});
			// o painel de senhas é um holograma: o projetor no teto, o facho de luz descendo, as linhas
			// de varredura correndo e uma tremidinha de vez em quando
			var pq = [C(2.0, 2.85, ZW - 0.02), C(3.1, 2.85, ZW - 0.02), C(3.1, 2.35, ZW - 0.02), C(2.0, 2.35, ZW - 0.02)], proj = C(2.55, TETO - 0.02, ZW - 0.5);
			c.save(); c.globalCompositeOperation = 'lighter';
			R(c, proj[0] - 3, proj[1], 6, 2, '#5a5e6a'); P(c, proj[0], proj[1] + 2, '#9af0ff');
			c.globalAlpha = 0.08; c.fillStyle = '#7fe3ff'; c.beginPath(); c.moveTo(proj[0] - 1, proj[1] + 2); c.lineTo(proj[0] + 1, proj[1] + 2); c.lineTo(pq[1][0], pq[1][1]); c.lineTo(pq[0][0], pq[0][1]); c.fill();
			var tremeH = Math.sin(t * 17) > 0.95 ? 0.4 : 1;
			c.globalAlpha = 0.14 * tremeH; c.beginPath(); pq.forEach(function (q, i) { if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }); c.closePath(); c.fill();
			var varre = (t * 0.6) % 1; c.globalAlpha = 0.35 * tremeH; linhaGrossa(c, [pq[0][0], pq[0][1] + (pq[3][1] - pq[0][1]) * varre], [pq[1][0], pq[1][1] + (pq[2][1] - pq[1][1]) * varre], 1, '#cdf6ff');
			for (var fa = 0; fa < 6; fa++) { var fu2 = ((t * 0.5 + fa / 6) % 1); c.globalAlpha = (1 - fu2) * 0.6; P(c, pq[0][0] + (pq[1][0] - pq[0][0]) * ruido(fa, 31), pq[0][1] - fu2 * 10, '#9af0ff'); }
			c.restore(); c.globalAlpha = 1;
			// as cadeiras azuis da frente por cima de tudo que anda
			if (this.frente) c.drawImage(this.frente, -OX, 0);
			// a setinha amarela balançando em cima da cadeira do guichê 11 (com sombrinha)
			if (!mostraCadeira) { if (!this.senha) setaAcesa(c, Math.round(st[0]), st[1] - 16, t); return; }
			setaAcesa(c, Math.round(pc[0]), pc[1] - 1.25 * sc, t);
		},
		entrar: function () {
			var cena1 = this; cena1.ultimaChamada = -1; cena1.senha = 0; cena1.chamada = 0;
			ligarAmbiente('recepcao'); capitulo('II', T('A recepção', 'The reception'));
			var C = CAM_REC, Tt = TOTEM, ta = C(Tt.x0, Tt.h + 0.1, Tt.z0), tb = C(Tt.x1, 0, Tt.z0);
			var leg = legenda(T('Pegue sua senha no <b>totem</b>', 'Take a ticket number at the <b>kiosk</b>'), 12, 236);
			// (o jornal da senhora da frente: escondido, sem seta, só para quem reparar)
			var aj = areaJornal(C);
			var alvoJornal = alvoClicavel(aj[0], aj[1], aj[2], aj[3], T('Ler o jornal caído no chão', 'Read the newspaper on the floor'), abrirJornal);
			alvoJornal.classList.add('discreto');
			// 1. pegar a senha: o totem imprime o papelzinho "011"
			var alvoTotem = alvoClicavel(ta[0] - 6, ta[1] - 16, tb[0] - ta[0] + 12, tb[1] - ta[1] + 18, T('Pegar a senha no totem', 'Take a ticket number at the kiosk'), function () {
				alvoTotem.remove(); leg.remove(); SONS.impressora();
				cena1.senha = (performance.now() - inicioCena) / 1000;
				// 2. o painel chama a nossa senha, com o "ding" e o alto-falante
				depois(function () {
					cena1.chamada = (performance.now() - inicioCena) / 1000;
					SONS.ding(); SONS.anuncio();
					legenda(T('Senha <b>011</b>: vá até o <b>guichê 11</b>', 'Number <b>011</b>: go to <b>desk 11</b>'), 12, 236);
					var cx = guicheX(2) + GL / 2 + 0.1, a = C(cx, 1.3, 5.05), b = C(cx, 0, 5.05), s = 300 / b[2];
					alvoClicavel(b[0] - 0.45 * s, a[1] - 0.3 * s, 0.9 * s, b[1] - a[1] + 0.4 * s, T('Sentar na cadeira do guichê 11', 'Sit in the chair at desk 11'), function () { SONS.passos(); depois(SONS.cadeira, 1300); depois(function () { irPara('mesa'); }, 1100); });
				}, 1600);
			});
		}
	};
	function pessoaAndandoCanvas(s, passo) { var sp = pessoaAndando(s, passo); return { k: paraCanvas(sp.p), ax: sp.ax, ay: sp.ay }; }
	// 2. A MESA DO GUICHÊ, pelos olhos do piloto: o ZÖ-11 atrás da tela holográfica, a parede
	// escura do fundo com o quadro de galáxia abstrata (de lado), as prateleiras de pastas, e na
	// mesa o teclado de vidro, o café, o porta-canetas, os formulários, a almofada de carimbo, o
	// carimbo de madeira e a plaquinha com o nome
	// o ZÖ-11 de perto: cabeça de metal com bisel, parafusos, arranhões e grades, visor de vidro
	// com reflexo, pescoço de molas com cabos, uniforme com dobras, gravata, crachá e dragonas
	var roboPerto = null, colega = null;
	function desenharRoboPerto() {
		var p = new Pintura(160, 170);
		pintar(p, function () {
			var cx = 80, metal = ['#f4f6fc', '#dcdfec', '#c4c8da', '#aaaec4', '#9094ac', '#767a94', '#5c607a'];
			// o uniforme
			poli([[cx - 56, 104], [cx + 56, 104], [cx + 72, 170], [cx - 72, 170]], function (x, y) {
				var t = (x - (cx - 72)) / 144, dobra = (Math.abs(x - cx - 30 + (y - 104) * 0.3) < 1 || Math.abs(x - cx + 34 + (y - 104) * 0.25) < 1) ? 0.3 : 0;
				return rampa(['#3e50a8', '#30439a', '#26388a', '#1e2c74', '#16225c', '#101a4a'], t * 0.85 + dobra + (ruido(x >> 1, y >> 1) - 0.5) * 0.05, x, y);
			});
			elip(cx - 48, 108, 16, 9, function (x, y, u) { return rampa(['#4a5cb4', '#3e50a8', '#30439a'], (u + 1) / 2, x, y); });
			elip(cx + 48, 108, 16, 9, function (x, y, u) { return rampa(['#1e2c74', '#16225c', '#101a4a'], (u + 1) / 2, x, y); });
			// as dragonas douradas nos ombros
			ret(cx - 60, 101, 22, 5, '#c8a040'); ret(cx - 60, 101, 22, 1, '#f0d480'); for (var f = 0; f < 4; f++) ret(cx - 58 + f * 5, 106, 2, 3, '#c8a040');
			ret(cx + 38, 101, 22, 5, '#a88430'); ret(cx + 38, 101, 22, 1, '#d8b860'); for (f = 0; f < 4; f++) ret(cx + 40 + f * 5, 106, 2, 3, '#a88430');
			// as lapelas, a camisa, a gravata e os botões
			poli([[cx - 18, 104], [cx, 104], [cx - 4, 150], [cx - 22, 120]], '#26388a'); poli([[cx, 104], [cx + 18, 104], [cx + 22, 120], [cx + 4, 150]], '#1a2a72');
			poli([[cx - 12, 104], [cx + 12, 104], [cx, 128]], '#f2eefc'); poli([[cx - 12, 104], [cx, 104], [cx, 128]], '#ffffff');
			poli([[cx - 3, 108], [cx + 3, 108], [cx + 5, 136], [cx, 142], [cx - 5, 136]], function (x, y) { return rampa(['#f0d480', '#e8c46a', '#c8a040'], (x - cx + 5) / 10, x, y); });
			ret(cx - 4, 106, 8, 3, '#c8a040');
			[150, 162].forEach(function (y) { elip(cx - 6, y, 1, 1, '#e8c46a'); });
			// o crachá com foto e o broche da agência
			ret(cx + 22, 118, 26, 18, '#f2f4fa'); ret(cx + 22, 118, 26, 4, '#2a62c8'); ret(cx + 24, 124, 8, 9, '#a8acc4'); ret(cx + 25, 126, 6, 3, '#0a1424');
			letras('ZÖ-11', cx + 34, 125, 1, '#1c2a6e'); ret(cx + 34, 131, 11, 1, '#8a86a8');
			for (var a = 0; a < Math.PI * 2; a += 0.3) px(cx - 34 + Math.cos(a) * 5, 124 + Math.sin(a) * 5, '#e8c46a');
			elip(cx - 34, 124, 2, 2, '#e8905a'); linha(cx - 39, 125, cx - 29, 123, '#7fb0e8');
			// o pescoço de molas, com cabos vermelho e azul
			for (var y = 84; y < 104; y++) ret(cx - 12, y, 24, 1, function (x) { return rampa(y % 3 === 0 ? ['#4a4e66', '#3a3e54'] : ['#b8bcd0', '#8a8ea8', '#5a5e78'], (x - cx + 12) / 24, x, y); });
			for (y = 84; y < 106; y++) { px(cx - 16 + Math.sin(y * 0.4), y, '#c84a4a'); px(cx + 15 + Math.cos(y * 0.4), y, '#3a7ad8'); }
			// a cabeça: caixa arredondada com bisel claro em cima e à esquerda, escuro embaixo e à direita
			var x0 = cx - 46, x1 = cx + 46, y0 = 6, y1 = 86, r = 8;
			ret(x0, y0, x1 - x0, y1 - y0, function (x, y) {
				var dx = Math.max(0, x0 + r - x, x - (x1 - r)), dy = Math.max(0, y0 + r - y, y - (y1 - r));
				if (dx * dx + dy * dy > r * r) return null;
				var t = (x - x0) / (x1 - x0) * 0.55 + (y - y0) / (y1 - y0) * 0.35;
				if (x - x0 < 3 || y - y0 < 3) t -= 0.35;
				if (x1 - x < 3 || y1 - y < 4) t += 0.3;
				return rampa(metal, t + (ruido(x >> 1, y) - 0.5) * 0.07, x, y);
			});
			// emendas, parafusos, arranhões e a grade de ventilação na testa
			ret(x0 + 6, 20, x1 - x0 - 12, 1, '#7a7e98'); ret(x0 + 6, 21, x1 - x0 - 12, 1, '#eef0f8');
			[[x0 + 6, 12], [x1 - 8, 12], [x0 + 6, y1 - 9], [x1 - 8, y1 - 9]].forEach(function (q) { elip(q[0], q[1], 2, 2, '#6a6e88'); px(q[0] - 1, q[1] - 1, '#ffffff'); px(q[0], q[1], '#4a4e66'); });
			for (var g = 0; g < 6; g++) ret(cx - 15 + g * 6, 11, 3, 6, '#4a4e66');
			for (g = 0; g < 9; g++) { var ax = x0 + 8 + ruido(g, 5) * 80, ay = 24 + ruido(g, 6) * 56; linha(ax, ay, ax + 3 + ruido(g, 7) * 4, ay + 1, '#f8f8ff'); }
			// as "orelhas" com luzinha e a antena
			[-1, 1].forEach(function (l) {
				var ox = l < 0 ? x0 - 9 : x1;
				ret(ox, 34, 9, 26, function (x, y) { return rampa(metal, 0.4 + (x - ox) / 9 * 0.4 + (l > 0 ? 0.2 : 0), x, y); });
				ret(ox + (l < 0 ? 2 : 3), 38, 4, 18, '#2a2e40');
			});
			ret(cx - 1, -1, 3, 8, '#6a6e88'); ret(cx - 4, 4, 9, 3, '#8a8ea8');
			// o visor: vidro escuro, com moldura, reflexo diagonal e linhas de tela
			ret(x0 + 10, 26, x1 - x0 - 20, 50, '#3a3e54');
			ret(x0 + 12, 28, x1 - x0 - 24, 46, function (x, y) { return rampa(['#1e3a5a', '#142a46', '#0c1c32', '#08121e'], (y - 28) / 46 + (x - x0) / 400, x, y); });
			for (y = 30; y < 74; y += 2) ret(x0 + 12, y, x1 - x0 - 24, 1, function (x, yy) { return null; });
			for (var k = 0; k < 18; k++) { px(x0 + 16 + k, 30 + Math.floor(k * 0.3), '#4a7aa8'); px(x0 + 16 + k, 31 + Math.floor(k * 0.3), '#2e5680'); }
			ret(x0 + 14, 30, 2, 8, '#5a8ab8');
		});
		return contornar(p, '#1a1622');
	}
	// o rosto do ZÖ-11 no visor (a cada quadro): olhos, piscadas, a onda da voz quando fala
	function rostoRobo(c, t, x, y, feliz) {
		var olho = '#7fe3ff', pisca = (t % 3.4) > 3.25, vx = x - 34, vy = y + 28;
		c.globalAlpha = 0.25; R(c, vx + 6, vy + 6, 24, 18, olho); R(c, vx + 38, vy + 6, 24, 18, olho); c.globalAlpha = 1; // brilho
		[[vx + 18, vy + 14], [vx + 50, vy + 14]].forEach(function (q) {
			if (pisca) R(c, q[0] - 6, q[1] + 1, 12, 2, olho);
			else if (feliz) { R(c, q[0] - 6, q[1] + 1, 2, 3, olho); R(c, q[0] - 4, q[1] - 1, 8, 2, olho); R(c, q[0] + 4, q[1] + 1, 2, 3, olho); }
			else { R(c, q[0] - 5, q[1] - 5, 10, 10, olho); R(c, q[0] - 4, q[1] - 4, 4, 4, '#e8fbff'); R(c, q[0] + 2, q[1] + 2, 2, 2, '#3aa8d8'); }
		});
		if (falando) for (var i = 0; i < 30; i++) { var amp = Math.round(Math.sin(i * 0.9 + t * 30) * Math.sin(t * 13 + i * 0.3) * 5); R(c, vx + 19 + i, vy + 34 - Math.abs(amp), 1, Math.abs(amp) * 2 + 1, olho); }
		else { R(c, vx + 24, vy + 35, 20, 2, olho); R(c, vx + 22, vy + 33, 2, 2, olho); R(c, vx + 44, vy + 33, 2, 2, olho); }
		R(c, vx + 8, vy + 27, 4, 2, '#ff8ad8'); R(c, vx + 56, vy + 27, 4, 2, '#ff8ad8');
		R(c, x - 3, y - 5, 7, 6, Math.sin(t * 4) > 0 ? '#ff8ad8' : '#ffd36a'); P(c, x - 2, y - 4, '#ffffff'); // a luz da antena
		var l = Math.sin(t * 3) > 0; R(c, x - 53, y + 36, 3, 14, l ? '#7fe3ff' : '#2a4a7a'); R(c, x + 52, y + 36, 3, 14, l ? '#2a4a7a' : '#7fe3ff');
	}
	function vapor(c, x, y, t, alto) {
		for (var f = 0; f < 3; f++) for (var i = 0; i < alto; i++) {
			var k = i / alto, fase = t * 1.4 + f * 2.1;
			var sx = x + f * 7 - 7 + Math.sin(k * 7 - fase * 2) * (2 + k * 5), sy = y - i;
			var vida = (Math.sin(fase - k * 4) + 1) / 2;
			if (vida * (1 - k) > limiar(Math.round(sx), Math.round(sy)) * 0.9) P(c, sx, sy, k < 0.4 ? 'rgba(255,255,255,0.8)' : 'rgba(235,238,250,0.5)');
		}
	}
	// o quadro de galáxia abstrata: pinceladas em espiral, como Van Gogh, em tons do espaço
	function quadroGalaxia(x, y, w, h) {
		ret(x - 3, y - 3, w + 6, h + 6, function (i, j) { return rampa(['#f0d480', '#c8a040', '#8a6a20'], ((i - x + 3) + (j - y + 3)) / (w + h + 12), i, j); });
		ret(x - 1, y - 1, w + 2, h + 2, '#5a4418');
		var cx = x + w * 0.42, cy = y + h * 0.48;
		ret(x, y, w, h, function (i, j) {
			var dx = i - cx, dy = (j - cy) * 1.25, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
			var espiral = Math.sin(a * 2 - d * 0.22 + ruido(i >> 1, j >> 1) * 0.8); // os braços da galáxia
			var pincel = Math.sin((i * 0.8 + j * 1.3) + a * 3) * 0.12; // a textura das pinceladas
			var t = 0.85 - Math.max(0, espiral) * 0.55 - Math.max(0, 1 - d / 8) * 0.6 + pincel + (d / w) * 0.25;
			return rampa(['#fff4c0', '#ffd36a', '#e8905a', '#c84a8a', '#7a4ac8', '#3a3a9a', '#1e2266', '#10123a'], t, i, j);
		});
		for (var k = 0; k < 16; k++) { var sx = x + ruido(k, 91) * w, sy = y + ruido(k, 92) * h; px(sx, sy, '#ffffff'); if (k % 3 === 0) { px(sx + 1, sy, '#fff4c0'); px(sx - 1, sy, '#fff4c0'); px(sx, sy + 1, '#fff4c0'); px(sx, sy - 1, '#fff4c0'); } }
		for (k = 0; k < 6; k++) linha(x + 4 + k * 9, y + h - 4 - (k % 2) * 3, x + 10 + k * 9, y + h - 8, '#3a3a9a'); // pinceladas soltas embaixo
	}
	CENAS.mesa = {
		fundo: function () {
			var p = pintar(tela0(), function () {
				// o fundo igual ao da recepção, agora de pertinho: o teto claro com as luminárias, a vitrine
				// para o porto espacial (com a torre de lançamento), o friso dourado, a faixa azul da agência e
				// a parede de placas brancas
				ret(-OX, 0, W, 8, '#d2d8e2'); for (var l = -1; l < 5; l++) { ret(30 + l * 120, 2, 60, 3, '#ffffff'); brilho(60 + l * 120, 8, 26, '#ffffff', 0.25); }
				ret(-OX, 8, W, 2, '#8a90a0');
				for (var vy = 10; vy < 80; vy++) for (var vx = -OX; vx < NUCLEO + OX; vx++) px(vx, vy, ceuDoPorto(VIT_MESA.x(vx), VIT_MESA.y(vy), vx, vy));
				ret(-OX, 80, W, 2, '#8a90a0'); ret(-OX, 82, W, 2, '#e8c46a'); ret(-OX, 82, W, 1, '#f0d480');
				ret(-OX, 84, W, 9, function (x, y) { return rampa(['#26388a', '#1c2a6e'], (y - 84) / 9, x, y); });
				ret(-OX, 93, W, 77, function (x, y) { return ((x + 400) % 220 === 0) ? '#c8cdd6' : rampa(['#f2f4f7', '#e8ebef', '#dde1e7', '#d0d5dc'], 0.15 + (y - 93) / 77 * 0.45, x, y); });
				// o relógio e o quadro de galáxia (com a arandela em cima), pendurados na parede branca
				elip(96, 116, 9, 9, '#3a3e54'); elip(96, 116, 7, 7, '#ffffff'); linha(96, 116, 96, 111, '#1a1a22'); linha(96, 116, 100, 118, '#1a1a22'); px(96, 116, '#e04040');
				ret(344, 94, 26, 2, '#8a90a0'); brilho(357, 120, 36, '#fff0c8', 0.15);
				quadroGalaxia(330, 98, 54, 54);
				// as divisórias azuis do guichê, bem perto, dos dois lados (e o vidro jateado em cima)
				// (as divisórias vão só até a altura da recepção: o vidro jateado em cima, a horta no topo)
				poli([[-OX, 38], [44, 42], [44, 200], [-OX, 214]], function (x, y) { return y < 96 ? rampa(['#c8d8f0', '#b0c4e4'], (x + OX) / (44 + OX), x, y) : rampa(['#4a82d8', '#3a6fc0', '#2b5ba8'], (x + OX) / (44 + OX) * 0.6 + y / 214 * 0.4, x, y); });
				ret(44, 42, 3, 158, '#1d4282'); ret(-OX, 96, 44 + OX, 2, '#c8ccd6'); linha(-OX, 38, 44, 42, '#c8ccd6'); linha(-OX, 37, 44, 41, '#e8ecf4');
				ret(8, 104, 30, 20, '#1a4aa2'); ret(9, 105, 28, 18, '#2a62c8'); ret(9, 105, 28, 1, '#7aa8f0'); letras('11', 23, 109, 2, '#ffffff', true);
				poli([[436, 42], [NUCLEO + OX, 38], [NUCLEO + OX, 214], [436, 200]], function (x, y) { return y < 96 ? rampa(['#b0c4e4', '#a0b4d8'], (x - 436) / (44 + OX), x, y) : rampa(['#2b5ba8', '#244f98', '#1d4282'], (x - 436) / (44 + OX) * 0.6 + y / 214 * 0.4, x, y); });
				ret(433, 42, 3, 158, '#4a82d8'); ret(436, 96, 44 + OX, 2, '#c8ccd6'); linha(436, 42, NUCLEO + OX, 38, '#c8ccd6'); linha(436, 41, NUCLEO + OX, 37, '#e8ecf4');
				// a horta hidropônica no topo das duas divisórias (a mesma da recepção)
				[[-OX, 44, 38, 42], [436, NUCLEO + OX, 42, 38]].forEach(function (d) {
					for (var hx2 = d[0] + 2; hx2 < d[1] - 2; hx2 += 5) {
						var hy2 = d[2] + (d[3] - d[2]) * (hx2 - d[0]) / (d[1] - d[0]);
						ret(hx2, hy2 - 6, 3, 6, (hx2 >> 2) % 3 ? '#4aa85a' : '#7ad86a'); ret(hx2 + 2, hy2 - 8, 2, 8, (hx2 >> 2) % 2 ? '#5ab86a' : '#3a8a4a');
					}
				});
				// a mesa e tudo em cima dela: o mesmo modelo 3D da mesa vista de cima (ver desenharMesa3D)
				desenharMesa3D(CAM_MESA);
			});
			return paraCanvas(p);
		},
		quadro: function (c, t) {
			if (!roboPerto) roboPerto = paraCanvas(desenharRoboPerto());
			// pela vitrine: a luz da torre piscando, a nave decolando de vez em quando e a chuva no vidro
			c.save(); c.beginPath(); c.rect(-OX, 10, W, 70); c.clip();
			var torreX = VIT_MESA.sx(TORRES_PORTO[1]), naveX = VIT_MESA.sx(TORRES_PORTO[1] + 0.21);
			if (Math.sin(t * 2.5 + 1.7) > 0.3) { R(c, torreX - 2, VIT_MESA.sy(2.83) - 2, 4, 4, 'rgba(255,58,90,0.5)'); R(c, torreX - 1, VIT_MESA.sy(2.83) - 1, 2, 2, '#ffb0b8'); }
			var faseM = (t + 4) % 16;
			if (faseM < 5.5) {
				var sobeM = faseM < 1.2 ? 0 : (faseM - 1.2) * (faseM - 1.2) * 0.09, baseY = VIT_MESA.sy(HORIZ_PORTO + sobeM), pontaY = VIT_MESA.sy(HORIZ_PORTO + 0.3 + sobeM);
				for (var fm = 0; fm < 16; fm++) { var fu = ((t * 2 + fm / 16) % 1); c.globalAlpha = (1 - fu) * 0.5 * Math.min(1, faseM); R(c, naveX + (ruido(fm, 5) - 0.5) * (20 + fu * 90) - 4 - fu * 6, VIT_MESA.sy(HORIZ_PORTO) - fu * 10, 8 + fu * 12, 3 + fu * 3, '#c8c0d8'); }
				c.globalAlpha = 1;
				if (faseM > 1.2) for (var rr = 0; rr < 1; rr += 0.03) { c.globalAlpha = (1 - rr) * 0.85; R(c, naveX - 2, baseY + Math.min(0.5, sobeM) * rr / 0.86 * 70, 4, 3, rr < 0.15 ? '#ffffff' : rr < 0.4 ? '#ffd36a' : '#ff7a3a'); }
				c.globalAlpha = 1;
				R(c, naveX - 3, pontaY, 6, baseY - pontaY, '#eef1fb'); R(c, naveX - 3, pontaY, 1, baseY - pontaY, '#ffffff'); R(c, naveX - 1, pontaY + 3, 2, 2, '#7fe3ff');
			}
			for (var gv = 0; gv < 30; gv++) { var gf = (t * (0.05 + ruido(gv, 62) * 0.08) + ruido(gv, 63)) % 1; c.globalAlpha = 0.45; R(c, -OX + ruido(gv, 61) * W, 10 + gf * 70, 1, 4, '#cfe8ff'); }
			c.globalAlpha = 1; c.restore();
			// um colega robô passando lá atrás com uma caixa de arquivos (de 13 em 13 segundos)
			var volta = (t + 6) % 13;
			if (volta < 7) {
				if (!colega) { var sp = roboDeFrente(80, { olho: '#7dffa8', antena: '#7fe3ff', metal: ['#f0e8d8', '#d8ccb4', '#b8aa90', '#958670', '#6e6252'] }); colega = { k: paraCanvas(sp.p), ax: sp.ax, ay: sp.ay }; }
				// (ele anda lá no fundo, entre as divisórias, e a mesa e as divisórias ficam na frente dele)
				var cxr = 20 + (volta / 7) * 440, pulo = Math.abs(Math.sin(volta * 6)) * 2;
				c.save(); c.beginPath(); c.rect(47, 0, 386, 158); c.clip();
				c.drawImage(colega.k, Math.round(cxr - colega.ax), Math.round(196 - colega.ay - pulo));
				R(c, cxr - 16, 104 - pulo, 32, 20, '#a8865a'); R(c, cxr - 16, 104 - pulo, 32, 3, '#c8a070'); R(c, cxr - 6, 110 - pulo, 12, 4, '#f2eefc'); // a caixa
				c.restore();
			}
			var b = Math.round(Math.sin(t * 1.6) * 1);
			c.drawImage(roboPerto, 240 - 80, 50 + b);
			rostoRobo(c, t, 240, 56 + b, this.feliz);
			// a mesa cobre a cintura dele
			c.drawImage(this.fundoPronto, 0, 158, W, H - 158, -OX, 158, W, H - 158);
			// a tela holográfica, bem visível: fundo ciano, bordas brilhando e o feixe do projetor
			var hx = 146, hy = 50, hw = 188, hh = 106;
			c.globalAlpha = 0.12; for (var gl = 1; gl < 5; gl++) { c.strokeStyle = '#7fe3ff'; c.strokeRect(hx - gl + 0.5, hy - gl + 0.5, hw + gl * 2 - 1, hh + gl * 2 - 1); }
			c.globalAlpha = 0.24; R(c, hx, hy, hw, hh, '#5ad0f0');
			c.globalAlpha = 0.12; for (var fx = 0; fx < 14; fx++) R(c, 196 + fx, hy + hh + fx, 88 - fx * 2, 1, '#7fe3ff');
			c.globalAlpha = 1;
			R(c, hx, hy, hw, 1, '#e8fbff'); R(c, hx, hy + hh - 1, hw, 1, '#9fe8ff'); R(c, hx, hy, 1, hh, '#9fe8ff'); R(c, hx + hw - 1, hy, 1, hh, '#9fe8ff');
			R(c, hx - 2, hy - 2, 8, 2, '#e8fbff'); R(c, hx - 2, hy - 2, 2, 8, '#e8fbff'); R(c, hx + hw - 6, hy + hh, 8, 2, '#e8fbff'); R(c, hx + hw, hy + hh - 6, 2, 8, '#e8fbff');
			c.globalAlpha = 0.95;
			R(c, hx + 1, hy + 1, hw - 2, 11, 'rgba(127,227,255,0.35)');
			texto3(c, 'LICENÇA DE NAVE', hx + 6, hy + 4, 1, '#ffffff'); texto3(c, 'PX-01', hx + hw - 26, hy + 4, 1, '#ffd36a');
			// à esquerda: o retrato do piloto; à direita: os campos (o rosto do ZÖ-11 fica livre no meio)
			R(c, hx + 6, hy + 18, 34, 42, 'rgba(127,227,255,0.45)'); R(c, hx + 6, hy + 18, 34, 1, '#e8fbff');
			R(c, hx + 16, hy + 26, 14, 12, '#e8fbff'); R(c, hx + 11, hy + 40, 24, 18, '#e8fbff'); R(c, hx + 19, hy + 30, 8, 4, '#2a6a9a');
			var campos = ['NOME', 'NAVE', 'CATEG.', 'VALID.'];
			for (var li = 0; li < 4; li++) { texto3(c, campos[li], hx + 136, hy + 18 + li * 11, 1, '#cdf6ff'); R(c, hx + 136, hy + 24 + li * 11, 18 + ruido(li, 7) * 26, 2, '#ffffff'); }
			texto3(c, 'VERIFICANDO', hx + 6, hy + 68, 1, '#7dffa8');
			R(c, hx + 6, hy + 76, hw - 12, 6, 'rgba(127,227,255,0.35)'); R(c, hx + 6, hy + 76, (hw - 12) * ((t * 0.22) % 1), 6, '#7dffa8');
			for (var g = 0; g < 8; g++) R(c, hx + 6 + g * 22, hy + 88, 18, 11, ruido(g, Math.floor(t * 2)) > 0.5 ? 'rgba(127,227,255,0.75)' : 'rgba(127,227,255,0.3)');
			c.globalAlpha = 0.7; R(c, hx, hy + ((t * 34) % hh), hw, 1, '#ffffff');
			c.globalAlpha = 1;
			var bocaCafe = CAM_MESA(OBJ_MESA.cafe.x, 8.6, OBJ_MESA.cafe.z); vapor(c, Math.round(bocaCafe[0]) + 1, Math.round(bocaCafe[1]) - 1, t, 24);
			for (var kk = 0; kk < 3; kk++) { var q = Math.floor(ruido(kk, Math.floor(t * 5)) * 36), kp = CAM_MESA(OBJ_MESA.teclado.x0 + 2 + (q % 12) * 3.4, 1.4, OBJ_MESA.teclado.z1 - 2 - Math.floor(q / 12) * 3.3); R(c, kp[0] - 1, kp[1], 3, 1, '#c8f8ff'); } // o ZÖ-11 digitando
			if (Math.floor(t / 4) !== this.ultimaDigitada) { this.ultimaDigitada = Math.floor(t / 4); if (t > 1) SONS.digitar(); }
		},
		entrar: function () {
			var cenaMesa = this; cenaMesa.seta = false; cenaMesa.feliz = false;
			ligarAmbiente('mesa'); capitulo('III', T('O guichê 11', 'Desk 11'));
			depois(function () {
				falar(T('Olá, piloto! Documentos, por favor.', 'Hello, pilot! Documents, please.'), 460).then(function () {
					cenaMesa.seta = true;
					botao(T('Dar documentos', 'Hand over documents'), 240, 236, function () { irPara('entrega'); }, 'pulsa');
				});
			}, 500);
		}
	};

	// ================== A MESA DO GUICHÊ EM 3D ==================
	// Uma mesa só, medida em centímetros, desenhada por duas câmeras: a do piloto sentado (cena 2)
	// e a de cima (cenas 3 a 7). Cada objeto fica no mesmo lugar e do mesmo tamanho nas duas.
	// x: da esquerda (-) para a direita (+); z: da beirada do piloto (0) até a do atendente (80); y: altura.
	var CAM_MESA = camera3d({ x: 0, y: 40, z: -50, yaw: 0, pitch: 22 * RAD, f: 300, cx: 240, cy: 184 });
	CAM_MESA.olho = [0, -50]; // (x, z) da câmera: para saber que lados de cada objeto aparecem
	var ESC_CIMA = 3.2; // pixels por centímetro na vista de cima
	// a vista de cima é um pouquinho inclinada (como olhando de cima e da frente): aparecem o topo e a frente
	function projCima(x, y, z) { return [240 + x * ESC_CIMA, 262 - z * ESC_CIMA - y * ESC_CIMA * 0.35, 1000 - z + y * 0.01]; }
	projCima.olho = null;
	var MESA = { x0: -88, x1: 88, z0: 0, z1: 80 };
	// onde cada coisa está (centímetros), para a cena 2, a vista de cima e as animações usarem o mesmo
	var OBJ_MESA = {
		projetor: { x0: -26, x1: 26, z0: 53, z1: 58, h: 2.4 },
		teclado: { x0: -22, x1: 22, z0: 62, z1: 73, h: 1.3 },
		cafe: { x: -45, z: 68 },
		canetas: { x: -58, z: 52 },
		formularios: { x0: -68, x1: -46, z0: 18, z1: 38 },
		tinta: { x0: 40, x1: 56, z0: 44, z1: 54 },
		carimbo: { x: 64, z: 49 },
		plaquinha: { x0: 44, x1: 68, z0: 16, z1: 21 },
		vaso: { x: 62, z: 72 }
	};
	// o lugar do carimbador na mesa (para o carimbo de verdade, que se mexe, morar ali)
	function casaDoCarimbador() { var p = projCima(OBJ_MESA.carimbo.x, 0, OBJ_MESA.carimbo.z + 4); return { x: p[0] * 4, y: p[1] * 4 }; }

	// ---- geometria: prismas (caixas e cilindros) com os lados certos aparecendo e luz de cima à esquerda ----
	function visivel(P, nx, nz, x, z) { return P.olho ? (P.olho[0] - x) * nx + (P.olho[1] - z) * nz > 0 : nz < -0.05; }
	function circulo(cx, cz, r, n) { var p = []; n = n || 20; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2; p.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return p; }
	function retang(x0, z0, x1, z1) { return [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]; }
	function prisma(P, cont, y0, y1, cores, topo) {
		var n = cont.length;
		for (var i = 0; i < n; i++) {
			var a = cont[i], b = cont[(i + 1) % n], nx = b[1] - a[1], nz = -(b[0] - a[0]), l = Math.hypot(nx, nz) || 1;
			nx /= l; nz /= l;
			if (!visivel(P, nx, nz, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2)) continue;
			var luz = Math.max(0, Math.min(1, 0.4 + nx * 0.38 + nz * 0.12)); // (0 = bem iluminado, 1 = sombra)
			var q = [P(a[0], y0, a[1]), P(b[0], y0, b[1]), P(b[0], y1, b[1]), P(a[0], y1, a[1])];
			var yTopo = Math.min(q[2][1], q[3][1]), yBase = Math.max(q[0][1], q[1][1]);
			poli(q, typeof cores === 'function' ? cores : function (sx, sy) { return rampa(cores, luz + (sy - yTopo) / Math.max(1, yBase - yTopo) * 0.12, sx, sy); });
			if (Array.isArray(cores) && luz < 0.75) linha(q[3][0], q[3][1], q[2][0], q[2][1], cores[0]); // o filete de luz na quina (tira o aspecto chapado)
		}
		if (topo) poli(cont.map(function (c) { return P(c[0], y1, c[1]); }), typeof topo === 'string' || typeof topo === 'function' ? topo : function (sx, sy) { return rampa(topo, (ruido(sx, sy) - 0.5) * 0.15 + 0.15, sx, sy); });
	}
	function tampoTex(P, tex, x0, z0, x1, z1, y, alfa) { quadTex(tex, [P(x0, y, z1), P(x1, y, z1), P(x1, y, z0), P(x0, y, z0)], alfa); }
	function sombraNoTampo(P, cont, h) {
		var dx = h * 0.4, dz = -h * 0.28, f = function (sx, sy) { mistura(sx, sy, '#3a3e52', 0.2); return null; };
		poli(cont.map(function (c) { return P(c[0] + dx, 0.02, c[1] + dz); }), f);
	}
	var LOUCA = ['#ffffff', '#f2f3f8', '#dfe2ec', '#c4c8d6', '#a8adbd'], METAL = ['#f4f6fc', '#d8dce8', '#b8bccb', '#9aa0b2', '#7a8094', '#5e6478'];
	var ESCURO = ['#5a5e70', '#44485a', '#34374a', '#26283a', '#1a1b28'], MADEIRA = ['#f0c080', '#d89c58', '#b87a40', '#8a5a2c', '#5e3a1a'];

	// ---- as texturas planas (teclas, papel, tinta, a plaquinha, o projetor) ----
	var TEX = {};
	function texturasDaMesa() {
		if (TEX.teclado) return TEX;
		TEX.teclado = pintar(new Pintura(66, 16), function () {
			ret(0, 0, 66, 16, '#120e26'); ret(0, 0, 66, 1, '#3a4a8a');
			for (var r = 0; r < 3; r++) for (var k = 0; k < 13; k++) {
				var kx = 2 + k * 4.85 + (r === 1 ? 1 : 0), ky = 2 + r * 4.3, acesa = ruido(k, r + 7) > 0.85, especial = (k === 0 || k === 12);
				ret(kx, ky, 4, 3.4, acesa ? '#4a8ad8' : especial ? '#3a2a6a' : '#24305e'); ret(kx, ky, 4, 1, acesa ? '#cdf6ff' : '#6aaae8'); ret(kx + 3, ky + 1, 1, 2.4, '#141a3a');
			}
			ret(18, 14, 28, 1.6, '#2a3a7a'); ret(18, 14, 28, 0.6, '#7fbfff'); ret(60, 1, 3, 1, '#7dffa8'); // a barra de espaço e a luz de ligado
		});
		TEX.projetor = pintar(new Pintura(78, 8), function () { ret(0, 0, 78, 8, '#22242e'); ret(1, 1, 76, 6, '#30333e'); ret(6, 3, 66, 2, '#7fe3ff'); ret(6, 3, 66, 1, '#e8fbff'); for (var g = 0; g < 6; g++) ret(2 + g * 0.6, 1, 0.4, 6, '#4a4e5e'); ret(73, 2, 2, 2, '#7dffa8'); ret(73, 5, 2, 1, '#ffd36a'); }); // a fenda de luz do holograma, a grade e os leds
		// o formulário de embarque em resolução cheia (70 x 64): cabeçalho azul-marinho com o símbolo
		// dourado, campos preenchidos, caixinhas marcadas, código de barras e a responsável assinando
		TEX.papel = pintar(new Pintura(70, 64), function () {
			ret(0, 0, 70, 64, function (x, y) { return rampa(['#ffffff', '#fbfbfd', '#f2f3f8'], (ruido(x >> 2, y >> 2) * 0.5 + y / 64 * 0.5), x, y); });
			ret(0, 0, 70, 10, '#1c2a6e'); ret(0, 10, 70, 1, '#e8c46a');
			elip(6, 5, 3, 3, '#e8c46a'); elip(6, 5, 2, 2, '#1c2a6e'); px(6, 5, '#ff9a7a');
			letras('EMBARQUE', 12, 3, 1, '#ffffff'); letras('F-42', 66, 3, 1, '#e8c46a'); ret(54, 3, 1, 5, '#e8c46a');
			var campos = [['NOME', 34], ['NAVE', 22], ['DESTINO', 30], ['CATEG.', 12]];
			campos.forEach(function (c2, i) {
				var yy = 14 + i * 7; letras(c2[0], 3, yy, 1, '#8a90a8');
				ret(32, yy + 5, 35, 1, '#c8ccd8'); for (var e = 0; e < c2[1]; e++) if (ruido(e, i + 30) > 0.3) px(33 + e, yy + 2 + Math.round(Math.sin(e * 1.3 + i) * 1.2), '#1a2a7a'); // a letra à mão
			});
			[[3, 43, true], [16, 43, true], [29, 43, false]].forEach(function (q) { ret(q[0], q[1], 5, 5, '#8a90a8'); ret(q[0] + 1, q[1] + 1, 3, 3, '#ffffff'); if (q[2]) { px(q[0] + 1, q[1] + 2, '#1f9a68'); px(q[0] + 2, q[1] + 3, '#1f9a68'); px(q[0] + 3, q[1] + 1, '#1f9a68'); px(q[0] + 4, q[1], '#1f9a68'); } });
			for (var b = 0; b < 26; b++) ret(42 + b, 42, ruido(b, 9) > 0.5 ? 1 : 0.5, 7, ruido(b, 10) > 0.35 ? '#1a1a22' : '#ffffff'); // o código de barras
			letras('RESPONSÁVEL:', 3, 50, 1, '#8a90a8'); ret(3, 62, 64, 1, '#8a90a8');
			letras('BIANCA CARDADOR', 5, 56, 1, '#1a2a7a'); // (a assinatura da autora do site, escondida no formulário)
			for (var rb = 0; rb < 6; rb++) px(64 + (rb % 3), 55 + rb, '#1a2a7a'); // o rabisco final
		});
		TEX.postit = pintar(new Pintura(16, 16), function () { ret(0, 0, 16, 16, function (x, y) { return rampa(['#fff6a0', '#ffe680', '#f0d050'], y / 16, x, y); }); ret(0, 0, 16, 3, '#f0d050'); letras('OI!', 8, 5, 1, '#2a3a8a', true); px(6, 12, '#e84a6a'); px(8, 12, '#e84a6a'); px(7, 13, '#e84a6a'); px(5, 11, '#e84a6a'); px(9, 11, '#e84a6a'); });
		TEX.etiqueta = pintar(new Pintura(12, 5), function () { ret(0, 0, 12, 5, '#f2eee0'); ret(1, 1, 10, 3, '#1f9a68'); ret(2, 2, 8, 1, '#c8f0d8'); });
		TEX.espuma = pintar(new Pintura(14, 8), function () { ret(0, 0, 14, 8, function (x, y) { return rampa(['#5ae8a8', '#2aa870', '#1a7a50', '#0e5a38'], ruido(x, y) * 0.7 + 0.15, x, y); }); });
		TEX.rotulo = pintar(new Pintura(23, 10), function () { ret(0, 0, 23, 10, '#f2f4f8'); ret(0, 0, 23, 3, '#1f9a68'); letras('TINTA', 12, 4, 1, '#1c2a6e', true); });
		TEX.plaquinha = pintar(new Pintura(27, 9), function () {
			ret(0, 0, 27, 9, function (x, y) { return rampa(['#3a3458', '#2a2448', '#1e1a38'], y / 9, x, y); }); ret(0, 0, 27, 1, '#e8c46a'); ret(0, 8, 27, 1, '#8a6a20');
			letras('ZÖ-11', 14, 3, 1, '#ffe6a0', true); px(1, 2, '#f0d480'); px(25, 2, '#f0d480'); px(1, 6, '#f0d480'); px(25, 6, '#f0d480'); // os parafusos dourados
		});
		return TEX;
	}

	// ---- a mesa e os objetos, para a câmera P (cima = true na vista de cima, onde o carimbo é o de verdade) ----
	function desenharMesa3D(P, cima) {
		var T = texturasDaMesa(), O = OBJ_MESA;
		// o tampo cinza-claro, com uma textura fininha e os reflexos compridos das luzes do teto
		poli([P(MESA.x0, 0, MESA.z1), P(MESA.x1, 0, MESA.z1), P(MESA.x1, 0, MESA.z0), P(MESA.x0, 0, MESA.z0)], function (sx, sy) {
			return rampa(['#eceef3', '#e1e4ea', '#d6d9e1', '#cacdd7', '#bec2cd'], 0.25 + (ruido(sx >> 2, sy) - 0.5) * 0.12 + (ruido(sx, sy) - 0.5) * 0.06 + (cima ? 0 : (sy - 158) / 300), sx, sy);
		});
		[-40, 0, 40].forEach(function (rx) { poli([P(rx - 3, 0.01, 76), P(rx + 3, 0.01, 76), P(rx + 9, 0.01, 6), P(rx + 3, 0.01, 6)], function (sx, sy) { mistura(sx, sy, '#ffffff', 0.09); return null; }); });
		// a borda de trás da mesa (o lado do atendente) e uma régua de luz azul
		prisma(P, retang(MESA.x0, 78, MESA.x1, 80), 0, 1.6, ['#9aa0b2', '#7a8094', '#5e6478'], '#c8ccd8');
		var r1 = P(MESA.x0, 1.6, 78), r2 = P(MESA.x1, 1.6, 78); linha(r1[0], r1[1], r2[0], r2[1], '#7fe3ff');
		// as sombras de tudo (deslocadas para a direita e para a frente: a luz vem de cima, à esquerda, de trás)
		sombraNoTampo(P, retang(O.projetor.x0, O.projetor.z0, O.projetor.x1, O.projetor.z1), 2.4);
		sombraNoTampo(P, retang(O.teclado.x0, O.teclado.z0, O.teclado.x1, O.teclado.z1), 1.3);
		sombraNoTampo(P, circulo(O.cafe.x, O.cafe.z, 6.5), 8.5);
		sombraNoTampo(P, circulo(O.canetas.x, O.canetas.z, 3.4), 10);
		sombraNoTampo(P, retang(O.formularios.x0, O.formularios.z0, O.formularios.x1, O.formularios.z1), 1.2);
		sombraNoTampo(P, retang(O.tinta.x0, O.tinta.z0, O.tinta.x1, O.tinta.z1 + 0.8), 8);
		if (!cima) sombraNoTampo(P, retang(O.carimbo.x - 6, O.carimbo.z - 4, O.carimbo.x + 6, O.carimbo.z + 4), 9);
		sombraNoTampo(P, retang(O.plaquinha.x0, O.plaquinha.z0, O.plaquinha.x1, O.plaquinha.z1), 5);
		sombraNoTampo(P, circulo(O.vaso.x, O.vaso.z, 5), 14);

		// cada objeto é uma função de desenho; eles são pintados do mais longe para o mais perto
		var objs = [
			{ z: O.vaso.z, x: O.vaso.x, f: vaso }, { z: 68, x: O.teclado.x0, f: teclado }, { z: O.cafe.z, x: O.cafe.x, f: cafe },
			{ z: 55, x: 0, f: projetor }, { z: O.canetas.z, x: O.canetas.x, f: canetas }, { z: 49, x: O.tinta.x0, f: tinta },
			{ z: 28, x: O.formularios.x0, f: formularios }, { z: 18, x: O.plaquinha.x0, f: plaquinha }, { z: 54, x: -80, f: postit }
		];
		if (!cima) objs.push({ z: O.carimbo.z, x: O.carimbo.x, f: carimbo });
		objs.forEach(function (o) { o.d = P(o.x, 0, o.z)[2]; });
		objs.sort(function (a, b) { return b.d - a.d; }).forEach(function (o) { o.f(); });

		function projetor() {
			var p = O.projetor;
			prisma(P, retang(p.x0, p.z0, p.x1, p.z1), 0, p.h, ESCURO);
			tampoTex(P, T.projetor, p.x0, p.z0, p.x1, p.z1, p.h);
		}
		function teclado() {
			var k = O.teclado;
			prisma(P, retang(k.x0, k.z0, k.x1, k.z1), 0, k.h, ESCURO);
			tampoTex(P, T.teclado, k.x0, k.z0, k.x1, k.z1, k.h);
			var a = P(k.x0, k.h, k.z0), b = P(k.x1, k.h, k.z0); linha(a[0], a[1], b[0], b[1], '#7fe3ff');
			for (var cb = 0; cb < 20; cb++) { var u1 = cb / 20, u2 = (cb + 1) / 20, c1 = P(k.x1 - 2 + u1 * 14, 0.25, 73 + Math.sin(u1 * 3) * 3 + u1 * 4), c2 = P(k.x1 - 2 + u2 * 14, 0.25, 73 + Math.sin(u2 * 3) * 3 + u2 * 4); linha(c1[0], c1[1], c2[0], c2[1], '#1a1b28'); } // o cabo do teclado
		}
		function cafe() {
			var c = O.cafe;
			prisma(P, circulo(c.x, c.z, 6.5, 24), 0, 0.7, LOUCA, ['#ffffff', '#eceef4']); // o pires
			prisma(P, circulo(c.x, c.z, 4.5, 24), 0.7, 1.1, LOUCA, '#dfe2ec');
			prisma(P, circulo(c.x, c.z, 3.9, 20), 1.1, 5, LOUCA);
			prisma(P, circulo(c.x, c.z, 3.9, 20), 5, 5.8, ['#fff0b0', '#e8c46a', '#c8a040', '#a88430', '#7a5e20']); // a faixa dourada da agência
			prisma(P, circulo(c.x, c.z, 3.9, 20), 5.8, 8.6, LOUCA, ['#ffffff', '#f4f6fa']);
			poli(circulo(c.x, c.z, 3.3, 20).map(function (q) { return P(q[0], 8.55, q[1]); }), function (sx, sy) { return rampa(['#8a5428', '#5e3218', '#3a1a0c'], 0.5 + (ruido(sx, sy) - 0.5) * 0.4, sx, sy); }); // o café
			poli(circulo(c.x - 1, c.z + 0.6, 1.2, 10).map(function (q) { return P(q[0], 8.56, q[1]); }), '#c89060'); // a creminha
			prisma(P, retang(c.x + 3.6, c.z - 0.6, c.x + 6.2, c.z + 0.6), 3, 7, LOUCA, '#ffffff'); // a asa
			prisma(P, retang(c.x - 6.2, c.z - 0.35, c.x - 2.2, c.z + 0.35), 0.7, 0.95, METAL, '#ffffff'); // a colherzinha no pires
		}
		function canetas() {
			var c = O.canetas;
			[[-1, 0.4, 16, '#e84a4a'], [1.2, -0.4, 18, '#3a7ad8'], [0.2, 1, 15, '#1a1a22']].forEach(function (q) { // as canetas espetadas
				var a = P(c.x + q[0], 8, c.z + q[1]), b = P(c.x + q[0] * 2.2, q[2], c.z + q[1] * 2), e = cima ? 1 : 2;
				for (var i = 0; i < e; i++) linha(a[0] + i, a[1], b[0] + i, b[1], q[3]);
				px(b[0], b[1], '#f2f2f2');
			});
			prisma(P, circulo(c.x, c.z, 3.4, 16), 0, 10, function (sx, sy) { return ((sx + sy) % 2) ? '#2a2c36' : ((sx % 3) ? '#4a4e5e' : '#6a6e7e'); }, '#16171e'); // o copo de tela de metal
			prisma(P, circulo(c.x, c.z, 3.55, 16), 9.4, 10, METAL); prisma(P, circulo(c.x, c.z, 3.55, 16), 0, 0.6, METAL); // os aros de cima e de baixo
		}
		function formularios() {
			var f = O.formularios;
			for (var i = 0; i < 5; i++) prisma(P, retang(f.x0 + i * 0.3, f.z0 - i * 0.4, f.x1 + i * 0.3, f.z1 - i * 0.4), i * 0.24, i * 0.24 + 0.24, i % 2 ? ['#ffffff', '#e8eaf0', '#d0d4de'] : ['#f2f4f8', '#dcdfe8', '#c4c8d4'], '#eef0f6');
			tampoTex(P, T.papel, f.x0 + 1.2, f.z0 - 1.6, f.x1 + 1.2, f.z1 - 1.6, 1.21);
			prisma(P, retang(f.x1 - 6, f.z1 - 3, f.x1 - 4, f.z1 + 0.6), 1.2, 1.7, ['#f0d480', '#c8a040', '#8a6a20'], '#f0d480'); // o clipe
		}
		function tinta() {
			var t = O.tinta;
			prisma(P, retang(t.x0, t.z0, t.x1, t.z1), 0, 2.6, METAL, '#c8ccd8');
			tampoTex(P, T.espuma, t.x0 + 1, t.z0 + 1, t.x1 - 1, t.z1 - 1, 2.62);
			prisma(P, retang(t.x0, t.z1, t.x1, t.z1 + 0.8), 2.6, 13, METAL, '#eef0f6'); // a tampa aberta, em pé
			quadTex(T.rotulo, [P(t.x0 + 1, 12, t.z1 - 0.01), P(t.x1 - 1, 12, t.z1 - 0.01), P(t.x1 - 1, 4.5, t.z1 - 0.01), P(t.x0 + 1, 4.5, t.z1 - 0.01)]);
			prisma(P, retang(t.x0 + 2, t.z1 - 0.3, t.x1 - 2, t.z1 + 0.3), 2.3, 3, ['#5e6478', '#4a4e5e', '#34374a']); // a dobradiça
			poli(circulo(t.x0 - 2.5, t.z0 + 1.5, 1.1, 10).map(function (q) { return P(q[0], 0.02, q[1]); }), '#1f9a68'); poli(circulo(t.x0 - 4.2, t.z0 + 0.4, 0.5, 8).map(function (q) { return P(q[0], 0.02, q[1]); }), '#1f9a68'); // pinguinhos de tinta na mesa
		}
		function carimbo() {
			var c = O.carimbo;
			prisma(P, retang(c.x - 6, c.z - 4, c.x + 6, c.z + 4), 0, 0.9, ['#2ab878', '#1f9a68', '#147a50', '#0e5a38'], '#1f9a68'); // a borracha manchada de tinta
			prisma(P, retang(c.x - 5.7, c.z - 3.7, c.x + 5.7, c.z + 3.7), 0.9, 4.8, MADEIRA, ['#f0c080', '#e0a868']);
			prisma(P, circulo(c.x, c.z, 1.5, 12), 4.8, 8.5, MADEIRA);
			prisma(P, circulo(c.x, c.z, 2.6, 16), 8.5, 9.5, MADEIRA);
			prisma(P, circulo(c.x, c.z, 3.2, 16), 9.5, 11.5, MADEIRA);
			prisma(P, circulo(c.x, c.z, 2.4, 16), 11.5, 12.6, MADEIRA, ['#ffe0b0', '#f0c080']);
			var b = P(c.x - 1, 12.6, c.z - 0.6); px(b[0], b[1], '#ffffff');
			quadTex(T.etiqueta, [P(c.x - 3.5, 4.1, c.z - 3.72), P(c.x + 3.5, 4.1, c.z - 3.72), P(c.x + 3.5, 1.7, c.z - 3.72), P(c.x - 3.5, 1.7, c.z - 3.72)]); // a etiqueta verde
		}
		function plaquinha() {
			var n = O.plaquinha, yA = 5.5, zT = n.z0 + 3.2;
			// a face inclinada, virada para o piloto, com o nome; e as pontas triangulares
			if (P.olho && P.olho[0] < n.x0) poli([P(n.x0, 0, n.z0), P(n.x0, yA, zT), P(n.x0, 0, n.z1)], '#14102a');
			if (P.olho && P.olho[0] > n.x1) poli([P(n.x1, 0, n.z0), P(n.x1, yA, zT), P(n.x1, 0, n.z1)], '#14102a');
			poli([P(n.x0, 0, n.z0), P(n.x1, 0, n.z0), P(n.x1, yA, zT), P(n.x0, yA, zT)], '#1b1430');
			quadTex(T.plaquinha, [P(n.x0 + 0.4, yA - 0.3, zT - 0.15), P(n.x1 - 0.4, yA - 0.3, zT - 0.15), P(n.x1 - 0.4, 0.3, n.z0 + 0.2), P(n.x0 + 0.4, 0.3, n.z0 + 0.2)]);
			if (cima) poli([P(n.x0, yA, zT), P(n.x1, yA, zT), P(n.x1, 0, n.z1), P(n.x0, 0, n.z1)], '#2a2448'); // (de cima aparece a parte de trás também)
		}
		function postit() { prisma(P, retang(-84, 50, -76, 58), 0, 0.15, ['#ffe680', '#f0d050', '#c8a830'], '#ffe680'); tampoTex(P, T.postit, -84, 50, -76, 58, 0.16); }
		function vaso() {
			var v = O.vaso;
			prisma(P, circulo(v.x, v.z, 5, 20), 0, 11, ['#f4f2ec', '#e2ded4', '#c8c4ba', '#a8a49a', '#8a867e'], '#3a2414');
			prisma(P, circulo(v.x, v.z, 5.1, 20), 7.5, 8.3, ['#34449a', '#24357e', '#1c2a6e', '#141f55']); // a faixa azul-marinho
			poli(circulo(v.x, v.z, 4.3, 16).map(function (q) { return P(q[0], 10.6, q[1]); }), function (sx, sy) { return rampa(['#6a4428', '#4a2e18', '#2e1c0e'], ruido(sx, sy), sx, sy); }); // a terra
			// as folhas compridas (espada-de-são-jorge): verdes com a borda amarelinha
			for (var i = 0; i < 9; i++) {
				var a = i / 9 * Math.PI * 2 + 0.3, ra = 1.2 + (i % 3) * 0.7, alto = 22 + ruido(i, 3) * 12, inc = 2 + ruido(i, 4) * 4;
				var bx = v.x + Math.cos(a) * ra, bz = v.z + Math.sin(a) * ra, tx = bx + Math.cos(a) * inc, tz = bz + Math.sin(a) * inc;
				var q = [P(bx - 0.9, 10.6, bz), P(bx + 0.9, 10.6, bz), P(tx + 0.2, alto, tz), P(tx - 0.2, alto, tz)];
				poli(q, function (sx, sy) { return rampa(['#7ad890', '#4aa85a', '#2a7a3a', '#1e5a2a'], 0.3 + (ruido(sx, sy >> 1) - 0.5) * 0.5 + (i % 2) * 0.25, sx, sy); });
				linha(q[1][0], q[1][1], q[2][0], q[2][1], '#c8d860');
			}
		}
	}

	// ---------- A mesa vista de cima (cenas 3 a 7): o mesmo modelo, pela câmera de cima ----------
	function fundoMesaCima() {
		return pintar(tela0(), function () {
			// do lado do atendente (em cima) o chão escuro dele; dos lados, as divisórias azuis
			ret(-OX, 0, W, H, function (x, y) { return rampa(['#1a1d33', '#16192e', '#121428'], ruido(x >> 3, y >> 3) * 0.4 + 0.3, x, y); });
			var e = projCima(MESA.x0, 0, 0)[0], d = projCima(MESA.x1, 0, 0)[0];
			ret(-OX, 0, e + OX, H, function (x, y) { return rampa(['#3a6fc0', '#2b5ba8', '#244f98'], ruido(x >> 3, y >> 3) * 0.3 + 0.3, x, y); });
			ret(d, 0, NUCLEO + OX - d, H, function (x, y) { return rampa(['#2b5ba8', '#244f98', '#1d4282'], ruido(x >> 3, y >> 3) * 0.3 + 0.3, x, y); });
			desenharMesa3D(projCima, true);
			// a beirada da mesa, do lado do piloto, com o friso de luz
			ret(-OX, 262, W, 8, function (x, y) { return rampa(['#a8adbb', '#80869a'], (y - 262) / 8, x, y); }); ret(-OX, 262, W, 1, '#f2f4f8'); ret(-OX, 265, W, 1, '#7fe3ff');
		});
	}
	var mesaFundo = null;
	function quadroMesa(t) {
		if (!mesaFundo) mesaFundo = paraCanvas(fundoMesaCima());
		mesaCtx.drawImage(mesaFundo, 0, 0);
		mesaCtx.save(); mesaCtx.translate(OX, 0);
		var boca = projCima(OBJ_MESA.cafe.x, 8.6, OBJ_MESA.cafe.z);
		for (var i = 0; i < 18; i++) { // o vapor do café, visto de cima
			var k = (t * 0.35 + i / 18) % 1, a = i * 2.4 + t * 0.6, r = 3 + k * 16;
			var x = boca[0] + Math.cos(a) * r * 0.5 + k * 6, y = boca[1] + Math.sin(a) * r * 0.4 - k * 12;
			if (k < 0.85 && limiar(Math.round(x), Math.round(y)) < 1 - k) R(mesaCtx, x, y, k < 0.4 ? 2 : 1, 1, k < 0.4 ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.45)');
		}
		var led = projCima(OBJ_MESA.projetor.x1 - 2, OBJ_MESA.projetor.h, (OBJ_MESA.projetor.z0 + OBJ_MESA.projetor.z1) / 2);
		if (Math.sin(t * 3) > 0) R(mesaCtx, led[0], led[1], 2, 2, '#7dffa8'); // a luzinha do projetor
		mesaCtx.restore();
	}
	function desenharCarimbador(g) {
		var p = pintar(new Pintura(40, 48), function () {
			ret(4, 34, 32, 10, function (x, y) { return rampa(['#8a5a2c', '#6a3a1c', '#4a2410'], (x - 4) / 32 * 0.7 + (y - 34) / 10 * 0.3, x, y); }); ret(4, 34, 32, 1, '#a8703c');
			ret(5, 44, 30, 3, '#1f9a68'); ret(5, 46, 30, 1, '#147a50');
			for (var j = 0; j < 18; j++) { var w = j < 6 ? 10 + j : 16; for (var i = 0; i < w; i++) px(20 - w / 2 + i, 16 + j, rampa(['#d89a5a', '#c88a4a', '#a86a38', '#8a5228', '#6a3a1c'], i / w, 20 - w / 2 + i, 16 + j)); }
			elip(20, 10, 9, 8, function (x, y, u, v) { return rampa(['#f0c890', '#e0a868', '#c88a4a', '#a86a38', '#7a4a24'], (u + v + 1.6) / 3.2, x, y); });
			elip(17, 7, 3, 2, '#f8dcb0'); px(16, 6, '#ffffff');
			for (var s = 0; s < 6; s++) px(10 + s * 4, 38, '#a87040');
		});
		contornar(p, '#2a1a10');
		var img = g.createImageData(40, 48); new Uint32Array(img.data.buffer).set(p.d); g.putImageData(img, 0, 0);
	}

	// 3. A ENTREGA: o passaporte e a carteira deslizam das mãos do piloto (de baixo) até a mesa
	CENAS.entrega = {
		mesa: true,
		entrar: function () {
			ligarAmbiente('mesa');
			montarDocumentos();
			if (!docs) return irPara('hangar');
			apontar(960, 540, 1, 0);
			docs.livro.classList.remove('aberto');
			pousar(docs.pp, { x: LUGAR.pp.x - 60, y: LUGAR.pp.y + 900, giro: 6 }, PP_ESC, 860, 602, 0);
			pousar(docs.cnh, { x: LUGAR.cnh.x + 80, y: LUGAR.cnh.y + 1000, giro: -10 }, CNH_ESC, 600, 400, 0);
			void docs.pp.offsetWidth;
			depois(function () { SONS.papel('livro'); pousar(docs.pp, LUGAR.pp, PP_ESC, 860, 602, 0.9); }, 150);
			depois(function () { SONS.papel('cartao'); pousar(docs.cnh, LUGAR.cnh, CNH_ESC, 600, 400, 0.9); }, 550);
			depois(SONS.bipLeitor, 1300);
			depois(function () { falar(T('Obrigado! Um momento…', 'Thank you! One moment…'), 460).then(function () { depois(function () { irPara('assinar'); }, 600); }); }, 1500);
		}
	};
	// 4. ASSINAR: o atendente endireita e abre o passaporte (a mesma animação da capa do jogo)
	CENAS.assinar = {
		mesa: true,
		entrar: function () {
			pousar(docs.pp, LUGAR.ppAberto, PP_ESC, 860, 602, 1);
			apontar(LUGAR.ppAberto.x, LUGAR.ppAberto.y, 1.72, 1.3);
			depois(function () { SONS.folha(); docs.livro.classList.add('aberto'); }, 700);
			depois(function () {
				docs.dados.classList.add('emb-chama-assinatura');
				falar(T('Assine aqui, por gentileza.', 'Please sign here.'), 460).then(function () {
					legenda(T('Clique na linha da assinatura', 'Click the signature line'), 12, 248);
					var r = retanguloNaTela(docs.dados.querySelector('.pp-assinatura'));
					alvoClicavel(r.x - 6, r.y - 18, r.w + 12, r.h + 26, T('Assinar o passaporte', 'Sign the passport'), function () { docs.dados.classList.remove('emb-chama-assinatura'); irPara('nome'); });
				});
			}, 2000);
		}
	};
	function retanguloNaTela(el) {
		var r = el.getBoundingClientRect(), p = palco.getBoundingClientRect(), k = W / p.width;
		return { x: (r.left - p.left) * k - OX, y: (r.top - p.top) * k, w: r.width * k, h: r.height * k };
	}
	function centroNoMundo(el) {
		var r = el.getBoundingClientRect(), m = nucleo.getBoundingClientRect(), k = palco.clientWidth / (W * 4) * cam.z;
		return { x: (r.left + r.width / 2 - m.left) / k, y: (r.top + r.height / 2 - m.top) / k };
	}
	// 5. ESCREVER O NOME: zoom na linha, e o nome aparece nela enquanto o piloto digita
	CENAS.nome = {
		mesa: true,
		entrar: function () {
			var ass = centroNoMundo(docs.dados.querySelector('.pp-assinatura'));
			apontar(ass.x - 40, ass.y - 10, 3.1, 1.1);
			depois(function () {
				var caixa = document.createElement('form');
				caixa.className = 'emb-nome';
				pos(caixa, 150, 226, 180);
				caixa.innerHTML = '<label class="emb-nome-rotulo" for="emb-nome">' + T('Digite seu nome para assinar', 'Type your name to sign') + '</label>' +
					'<input id="emb-nome" type="text" maxlength="32" autocomplete="off" spellcheck="false" placeholder="' + T('seu nome', 'your name') + '">' +
					'<button type="submit" class="emb-botao emb-ok">OK</button>';
				camada.appendChild(caixa);
				var campo = caixa.querySelector('input');
				campo.value = nomePiloto; escreverNome(nomePiloto);
				docs.dados.classList.add('emb-escrevendo');
				campo.addEventListener('input', function () { escreverNome(campo.value); SONS.rabisco(); }); // a caneta riscando a cada letra
				caixa.addEventListener('submit', function (e) {
					e.preventDefault();
					var nome = campo.value.trim();
					if (!nome) { campo.classList.remove('treme'); void campo.offsetWidth; campo.classList.add('treme'); campo.focus(); return; }
					nomePiloto = nome; escreverNome(nome);
					docs.dados.classList.remove('emb-escrevendo');
					SONS.floreio();
					irPara('carimbo');
				});
				setTimeout(function () { campo.focus(); campo.select(); }, 60);
			}, calmo ? 0 : 1100);
		}
	};
	// 6. O CARIMBO: o carimbador sai da almofada, vem até o lado da assinatura e desce com um TUM
	CENAS.carimbo = {
		mesa: true,
		entrar: function () {
			var linhaAss = docs.dados.querySelector('.pp-assinatura');
			var antigo = docs.dados.querySelector('.pp-embarque'); if (antigo) antigo.remove();
			var marca = window.Passaporte.carimboEmbarque(new Date().toISOString());
			marca.classList.add('emb-ainda-nao');
			linhaAss.appendChild(marca);
			apontar(LUGAR.ppAberto.x + 200, LUGAR.ppAberto.y - 40, 1.5, 1);
			var c = docs.carimbador;
			depois(function () {
				var alvo = centroNoMundo(marca);
				pousarCarimbador(0.8, alvo.x, alvo.y - 220, 1.5); c.classList.add('no-ar');
				depois(function () { pousarCarimbador(0.2, alvo.x, alvo.y, 1); }, 950);
				depois(function () {
					SONS.tum(); mundo.classList.remove('treme'); void mundo.offsetWidth; mundo.classList.add('treme');
					marca.classList.remove('emb-ainda-nao'); marca.classList.add('emb-batido');
					c.classList.remove('no-ar');
				}, 1150);
				depois(function () { pousarCarimbador(0.5, alvo.x + 30, alvo.y - 220, 1.5); c.classList.add('no-ar'); }, 1450);
				depois(function () { pousarCarimbador(0.8); }, 2000);
				depois(function () { c.classList.remove('no-ar'); }, 2800);
			}, 1100);
			depois(function () {
				try {
					var d = JSON.parse(localStorage.getItem('passaporteEspacial')) || {};
					d.nome = nomePiloto; d.embarque = d.embarque || new Date().toISOString();
					localStorage.setItem('passaporteEspacial', JSON.stringify(d));
				} catch (e) {}
				SONS.aprovado();
				if (docs.holo) docs.holo.classList.remove('desligada');
				falar(T('Tudo certo, ' + primeiroNome() + '! Boa viagem!', 'All set, ' + primeiroNome() + '! Have a good trip!'), 520).then(function () {
					apontar(1000, 660, 1.1, 1.2);
					depois(imprimirBilhete, 500);
					depois(function () {
						limpar();
						falar(T('E aqui está o seu cartão de embarque. Hangar 11!', 'And here is your boarding pass. Hangar 11!'), 460).then(function () { depois(function () { irPara('retirar'); }, 1200); });
					}, 2400);
				});
			}, 2900);
		}
	};
	// 7. RETIRAR: o passaporte fecha e volta exatamente para onde estava; um clique e os dois
	// documentos são puxados de volta para o piloto, como por um sopro de ar
	CENAS.retirar = {
		mesa: true,
		entrar: function () {
			apontar(960, 540, 1, 1.3);
			depois(function () { SONS.folha(); docs.livro.classList.remove('aberto'); }, 200);
			depois(function () { SONS.papel('livro'); pousar(docs.pp, LUGAR.pp, PP_ESC, 860, 602, 0.9); }, 1100);
			depois(function () {
				falar(T('Pode retirar os documentos, ' + primeiroNome() + '.', 'You can take your documents, ' + primeiroNome() + '.'), 460).then(function () {
					legenda(T('Clique nos documentos para pegar', 'Click the documents to take them'), 12, 248);
					alvoClicavel(110, 80, 260, 160, T('Pegar os documentos', 'Take the documents'), function () {
						limpar(); SONS.whoosh();
						mundo.classList.add('ventania');
						pousar(docs.pp, { x: LUGAR.pp.x + 100, y: LUGAR.pp.y + 1100, giro: -2 }, PP_ESC * 1.6, 860, 602, 0.7);
						depois(function () { pousar(docs.cnh, { x: LUGAR.cnh.x - 100, y: LUGAR.cnh.y + 1250, giro: 2 }, CNH_ESC * 1.6, 600, 400, 0.7); }, 90);
						if (docs.bilhete) depois(function () { pousar(docs.bilhete, { x: LUGAR.bilhete.x, y: LUGAR.bilhete.y + 1100, giro: 1 }, BIL_ESC * 1.6, 640, 260, 0.7); }, 170);
						depois(function () { mundo.classList.remove('ventania'); irPara('hangar'); }, 1000);
					});
				});
			}, 2000);
		}
	};

	// 8. O HANGAR, visto do alto em diagonal (a mesma inclinação da câmera para o chão e para a nave):
	// a baia redonda afundada no pátio de concreto, o muro curvo por dentro, a faixa zebrada, a torre,
	// os paredões de rocha; a PX-01 estacionada, apoiada no trem de pouso, com a sombra no chão,
	// a rampa abaixada, as mangueiras de abastecimento e a equipe de solo. A câmera chega perto devagar.
	var INCL = 38 * RAD, ACHATA = Math.sin(INCL), GIRO_NAVE = 3.75, ESC_NAVE = 84;
	var BAIA = { cx: 240, cy: 136, rx: 196, ry: Math.round(196 * Math.sin(38 * RAD)), fundo: 30 };
	var naveHangar = null, sombraNave = null;
	function fazerNave() {
		if (naveHangar || !window.Nave || !window.Nave.renderizarModelo) return;
		var L = 300, A = 220;
		var r = window.Nave.renderizarModelo({ L: L, A: A, giro: GIRO_NAVE, inclinacao: INCL, esc: ESC_NAVE, ox: L / 2, oy: A / 2, luz: [-0.5, -0.45, 0.75], brilho: 1, motores: false });
		var k = document.createElement('canvas'); k.width = L; k.height = A;
		var g = k.getContext('2d'), img = g.createImageData(L, A); new Uint32Array(img.data.buffer).set(r.cores); g.putImageData(img, 0, 0);
		naveHangar = k;
		// as pontas da nave (onde vão as luzes de navegação): o pixel mais à esquerda, o mais à direita e o mais alto
		var esq = null, dir = null, topo = null;
		for (var yy = 0; yy < A; yy++) for (var xx = 0; xx < L; xx++) if (r.cores[yy * L + xx]) {
			if (!esq || xx < esq[0]) esq = [xx, yy]; if (!dir || xx > dir[0]) dir = [xx, yy]; if (!topo) topo = [xx, yy];
		}
		naveHangar.pontas = [esq, dir, topo];
		// a sombra: a nave vista de cima, achatada pela inclinação da câmera
		var s = window.Nave.renderizarModelo({ L: L, A: A, giro: GIRO_NAVE, inclinacao: Math.PI / 2, esc: ESC_NAVE, ox: L / 2, oy: A / 2, luz: [0, 0, 1], motores: false });
		var k2 = document.createElement('canvas'); k2.width = L; k2.height = A;
		var g2 = k2.getContext('2d'), img2 = g2.createImageData(L, A), d2 = new Uint32Array(img2.data.buffer);
		for (var i = 0; i < s.cores.length; i++) if (s.cores[i]) d2[i] = 0xff120e0a;
		g2.putImageData(img2, 0, 0);
		sombraNave = k2;
	}
	CENAS.hangar = {
		fundo: function () {
			var B = BAIA, fy = B.cy + B.fundo;
			var p = pintar(tela0(), function () {
				function dentro(x, y, cy) { var u = (x - B.cx) / B.rx, v = (y - cy) / B.ry; return u * u + v * v < 1; }
				for (var y = 0; y < H; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
					var c;
					if (dentro(x, y, B.cy)) {
						if (dentro(x, y, fy)) { // o chão da baia: concreto com placas, manchas e juntas
							var u = (x - B.cx) / B.rx, v = (y - fy) / B.ry, d = Math.sqrt(u * u + v * v), a = Math.atan2(v, u);
							var junta = Math.abs(((d * 6) % 1) - 0.5) > 0.47 || Math.abs((((a / Math.PI * 12) % 1) + 1) % 1 - 0.5) > 0.485;
							c = junta ? '#7e7a72' : rampa(['#c4c0b6', '#b4b0a6', '#a4a096', '#94908a', '#84807a'], 0.2 + ruido(x >> 3, y >> 3) * 0.35 + (ruido(x, y) - 0.5) * 0.15 + v * 0.15 + (d > 0.88 ? 0.35 : 0), x, y);
						} else { // o muro curvo por dentro: placas de metal escuro com nervuras
							var ang = Math.atan2((y - B.cy) / B.ry, (x - B.cx) / B.rx), alt = (y - (B.cy + Math.sin(ang) * B.ry)) / B.fundo;
							c = (Math.round(ang * 40) % 5 === 0) ? '#1e2028' : rampa(['#5e6270', '#4a4e5a', '#3a3e4a', '#2c2f38'], alt * 0.7 + 0.15 + Math.cos(ang) * 0.15, x, y);
						}
					} else if (y < 9 + Math.sin((x + OX) * 0.05) * 4 + ruido((x + OX) >> 4, 9) * 5) { // um pedaço de céu entardecendo lá em cima
						c = rampa(['#f0a868', '#e8c890', '#b8c8e0', '#8aa8d8'], 1 - y / 14, x, y);
					} else if (y < 30 + Math.sin((x + OX) * 0.03) * 8 + ruido((x + OX) >> 3, 2) * 10) { // os paredões de rocha no fundo
						var cam = Math.floor((y + Math.sin(x * 0.05) * 5) / 6);
						c = rampa(['#5a4434', '#7a5c44', '#9a7656', '#b8946c', '#d4b088'], 0.2 + ruido(x >> 2, cam) * 0.5 + (cam % 3) * 0.1, x, y);
					} else { // o pátio de concreto em volta, mais claro, com marcas de pneu e juntas
						var gx = (x + OX) / 34, gy = y / 22;
						c = (gx - Math.floor(gx) < 0.04 || gy - Math.floor(gy) < 0.06) ? '#a29e94' : rampa(['#d8d2c4', '#cac4b6', '#bab4a6', '#aaa498'], 0.25 + ruido(Math.floor(gx), Math.floor(gy)) * 0.2 + (ruido(x, y) - 0.5) * 0.15 + y / H * 0.2, x, y);
					}
					px(x, y, c);
				}
				// a borda da baia: guarda-corpo de metal e a faixa amarela no pátio
				for (var t = 0; t < Math.PI * 2; t += 0.0015) {
					var rx = B.cx + Math.cos(t) * B.rx, ry = B.cy + Math.sin(t) * B.ry;
					px(rx, ry, '#e8c040'); px(rx, ry - 1, '#e8c040');
					px(rx + Math.cos(t) * 3, ry + Math.sin(t) * 2 - 6, '#c8ccd6');
					if (Math.round(t * 60) % 6 === 0) for (var h = 0; h < 6; h++) px(rx + Math.cos(t) * 3, ry + Math.sin(t) * 2 - h, '#8a8e98');
				}
				// o anel de faixas amarelas e pretas no chão da baia, as luzes e o número
				for (t = 0; t < Math.PI * 2; t += 0.002) {
					var zx = B.cx + Math.cos(t) * B.rx * 0.8, zy = fy + Math.sin(t) * B.ry * 0.8;
					if (!dentro(zx, zy, B.cy)) continue;
					var faixa = (Math.floor(t * 24) % 2) ? '#f0c030' : '#1a1a1e';
					px(zx, zy, faixa); px(zx, zy + 1, faixa); px(zx, zy + 2, faixa);
				}
				letras('11', B.cx + 128, fy + 46, 2, '#f0c030', true);
				letras('BIANCA CARDADOR', 400, 262, 1, '#a8904a', true); // (a assinatura da autora, pintada no pátio)
				// a torre de concreto à esquerda (cilindro) com janelas, canos e uma antena
				for (y = 0; y < 200; y++) for (x = -OX; x < 34; x++) { var u2 = (x + OX) / (34 + OX); px(x, y, rampa(['#e8e2d8', '#d0cabe', '#b8b2a6', '#9a948a', '#7a766e'], u2 * 0.8 + (ruido(x >> 2, y >> 2) - 0.5) * 0.08, x, y)); }
				for (y = 12; y < 200; y += 20) { ret(-OX, y, 34 + OX, 2, '#7a766e'); ret(-OX, y + 2, 34 + OX, 1, '#f4eee4'); }
				for (var jn = 0; jn < 9; jn++) { ret(-OX + 8 + (jn % 2) * 14, 20 + jn * 20, 9, 6, '#2a2c34'); ret(-OX + 8 + (jn % 2) * 14, 20 + jn * 20, 9, 1, '#ffd890'); }
				ret(28, 0, 3, 200, '#5a5650'); ret(31, 0, 2, 200, '#3a3836');
				// caixotes, tambores, um carrinho e os postes de holofote no pátio
				[[60, 228], [72, 236], [404, 236], [418, 228], [430, 240]].forEach(function (q, i) {
					var cor = i % 2 ? ['#a8865a', '#8a6a3a', '#6a4e2a'] : ['#8aa060', '#6a7a4a', '#4e5a36'];
					ret(q[0], q[1], 14, 10, function (x2, y2) { return rampa(cor, (x2 - q[0]) / 14 * 0.6 + (y2 - q[1]) / 10 * 0.3, x2, y2); }); ret(q[0], q[1], 14, 2, cor[0]); ret(q[0] + 6, q[1], 1, 10, '#3a2a1a');
				});
				[[96, 246], [104, 250]].forEach(function (q) { ret(q[0], q[1], 7, 10, function (x2, y2) { return rampa(['#e85a3a', '#c84a2a', '#8a2a1a'], (x2 - q[0]) / 7, x2, y2); }); ret(q[0], q[1] + 3, 7, 1, '#3a1a10'); });
				ret(440, 210, 22, 9, '#d8a030'); ret(440, 210, 22, 2, '#f0c860'); ret(442, 219, 4, 3, '#1a1a1e'); ret(456, 219, 4, 3, '#1a1a1e');
				[[46, 40], [448, 36]].forEach(function (q) { ret(q[0], q[1], 3, 60, '#4a4e5a'); ret(q[0] + 1, q[1], 1, 60, '#8a8e98'); ret(q[0] - 5, q[1] - 5, 13, 6, '#2a2c34'); ret(q[0] - 4, q[1] + 1, 11, 1, '#fff4d0'); });
			});
			return paraCanvas(p);
		},
		quadro: function (c, t) {
			fazerNave();
			var B = BAIA, fy = B.cy + B.fundo, nx = B.cx + 6, ny = fy - 4;
			// a sombra da nave no chão (deslocada pela luz que vem de cima à esquerda)
			if (sombraNave) { c.globalAlpha = 0.55; c.drawImage(sombraNave, 0, 0, 300, 220, nx - 150 + 10, ny - 110 * ACHATA + 6, 300, 220 * ACHATA); c.globalAlpha = 1; }
			// as pernas do trem de pouso (a nave fica uns metros acima do chão) e a rampa abaixada atrás
			[[-62, 8], [-22, 34], [44, 34], [74, 6], [12, -22]].forEach(function (q) { R(c, nx + q[0] - 1, ny + q[1] - 22, 3, 22, '#2a2c34'); R(c, nx + q[0], ny + q[1] - 22, 1, 22, '#6a6e7a'); R(c, nx + q[0] - 4, ny + q[1], 9, 3, '#3a3d46'); R(c, nx + q[0] - 4, ny + q[1], 9, 1, '#8a8e98'); });
			c.fillStyle = '#8a8e98'; c.beginPath(); c.moveTo(nx + 46, ny - 30); c.lineTo(nx + 64, ny - 28); c.lineTo(nx + 80, ny - 2); c.lineTo(nx + 60, ny - 2); c.fill();
			c.fillStyle = '#ffe8b0'; c.globalAlpha = 0.55; c.beginPath(); c.moveTo(nx + 49, ny - 28); c.lineTo(nx + 62, ny - 27); c.lineTo(nx + 75, ny - 4); c.lineTo(nx + 63, ny - 4); c.fill(); c.globalAlpha = 1;
			if (naveHangar) c.drawImage(naveHangar, nx - 150, ny - 110 - 24);
			// as mangueiras de abastecimento ligadas na nave
			c.strokeStyle = '#1a1a1e'; c.lineWidth = 2; c.beginPath(); c.moveTo(nx - 150, ny + 26); c.quadraticCurveTo(nx - 110, ny + 46, nx - 70, ny + 2); c.stroke();
			c.strokeStyle = '#c84a2a'; c.lineWidth = 1; c.beginPath(); c.moveTo(nx - 152, ny + 30); c.quadraticCurveTo(nx - 104, ny + 54, nx - 56, ny + 12); c.stroke();
			R(c, nx - 158, ny + 20, 10, 14, '#3a3d46'); R(c, nx - 156, ny + 22, 6, 2, Math.sin(t * 3) > 0 ? '#7dffa8' : '#2a6a4a');
			// a equipe de solo: um robozinho andando e um técnico de macacão
			var rx = nx + 96 + Math.sin(t * 0.8) * 14;
			R(c, rx, ny + 36, 5, 6, '#d8a030'); R(c, rx + 1, ny + 33, 3, 3, '#a8acc4'); P(c, rx + 2, ny + 34, '#7fe3ff');
			var tx = nx - 96 + Math.cos(t * 0.5) * 6;
			R(c, tx, ny + 40, 4, 7, '#e8742a'); R(c, tx, ny + 37, 4, 3, '#e8c0a0'); R(c, tx, ny + 36, 4, 1, '#3a2a1a'); R(c, tx + 4, ny + 42, 3, 1, '#c8ccd6');
			// uma nave pequena cruzando o céu lá no alto, com o rastro do motor (de 11 em 11 segundos)
			var voo = (t + 2) % 11;
			if (voo < 4) {
				var vx = -OX - 20 + voo / 4 * (W + 40), vy = 5 + voo * 1.5;
				for (var r2 = 1; r2 < 18; r2++) P(c, vx - r2 * 1.6, vy - r2 * 0.4, r2 < 6 ? 'rgba(160,220,255,0.8)' : 'rgba(255,255,255,0.35)');
				R(c, vx - 3, vy - 1, 7, 3, '#4a4e5a'); R(c, vx - 2, vy - 2, 4, 1, '#c8ccd6'); P(c, vx + 3, vy, '#ff4a4a'); R(c, vx - 5, vy, 2, 1, '#7fe3ff');
			}
			// as luzinhas da pista piscando
			for (var a = 0; a < 20; a++) { var ang = a / 20 * Math.PI * 2, lx = B.cx + Math.cos(ang) * B.rx * 0.8, ly = fy + Math.sin(ang) * B.ry * 0.8; var u = (lx - B.cx) / B.rx, v = (ly - B.cy) / B.ry; if (u * u + v * v < 1 && Math.sin(t * 4 - a * 0.7) > 0.4) R(c, lx, ly - 1, 2, 2, '#7fe3ff'); }
			// a nave acordando: o brilho azul dos repulsores embaixo dela vai crescendo, e as luzes de
			// navegação piscam nas pontas (vermelha, verde e a branca de cima)
			var acorda = Math.min(1, Math.max(0, (t - 1.5) / 3));
			if (acorda > 0) {
				var pulso = 0.75 + Math.sin(t * 5) * 0.12 + Math.sin(t * 13) * 0.05;
				var gl = c.createRadialGradient(nx, ny + 8, 2, nx, ny + 8, 90);
				gl.addColorStop(0, 'rgba(140,220,255,' + (0.45 * acorda * pulso) + ')'); gl.addColorStop(0.5, 'rgba(80,150,255,' + (0.16 * acorda * pulso) + ')'); gl.addColorStop(1, 'rgba(60,100,255,0)');
				c.save(); c.translate(nx, ny + 8); c.scale(1, ACHATA); c.translate(-nx, -(ny + 8)); c.fillStyle = gl; c.fillRect(nx - 90, ny + 8 - 90, 180, 180); c.restore();
			}
			if (naveHangar && naveHangar.pontas[0]) {
				var po = naveHangar.pontas, bx0 = nx - 150, by0 = ny - 134;
				[[po[0], '#ff3a4a', 0], [po[1], '#4aff8a', 0.5], [po[2], '#ffffff', 0.25]].forEach(function (q) {
					if (((t + q[2]) % 1.4) < 0.18 && t > 0.8) {
						var lx2 = bx0 + q[0][0], ly2 = by0 + q[0][1];
						c.globalAlpha = 0.35; c.fillStyle = q[1]; c.beginPath(); c.arc(lx2, ly2, 5, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
						R(c, lx2 - 1, ly2 - 1, 3, 3, q[1]); P(c, lx2, ly2, '#ffffff');
					}
				});
			}
			// os holofotes da borda da baia acendendo um por um quando a gente chega, com um tremidinho
			for (var hl = 0; hl < 14; hl++) {
				var ah = Math.PI * 0.08 + hl / 13 * Math.PI * 0.84, hx = B.cx + Math.cos(ah) * B.rx * 0.97, hy = B.cy + Math.sin(ah) * B.ry * 0.97 - 7;
				var liga = t - 0.4 - hl * 0.12;
				if (liga < 0 || (liga < 0.25 && Math.sin(liga * 90) < 0)) { R(c, hx - 1, hy, 3, 2, '#3a3d46'); continue; }
				c.globalAlpha = 0.22; c.fillStyle = '#fff0c0'; c.beginPath(); c.arc(hx, hy + 1, 6, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
				R(c, hx - 1, hy, 3, 2, '#fff4d0'); P(c, hx, hy, '#ffffff');
			}
			// a empilhadeira amarela levando um caixote pelo pátio, indo e voltando
			var ida = (t * 0.09) % 2, fp = ida < 1 ? ida : 2 - ida, fx2 = 330 + fp * 100, fy2 = 250 - fp * 6, vai = ida < 1;
			R(c, fx2 - 8, fy2 + 6, 18, 2, 'rgba(20,16,10,0.35)');
			R(c, fx2 - 6, fy2 - 3, 12, 8, '#e8b030'); R(c, fx2 - 6, fy2 - 3, 12, 2, '#ffd860'); R(c, fx2 - 4, fy2 - 10, 7, 7, '#3a3d46'); R(c, fx2 - 3, fy2 - 9, 5, 4, '#9ad8f0');
			var garfo = vai ? fx2 + 7 : fx2 - 10; R(c, garfo, fy2 - 8, 1, 13, '#4a4e5a'); R(c, vai ? garfo + 1 : garfo - 8, fy2 + 4, 8, 1, '#8a8e98');
			R(c, vai ? garfo + 1 : garfo - 8, fy2 - 3, 8, 7, '#a8865a'); R(c, vai ? garfo + 1 : garfo - 8, fy2 - 3, 8, 1, '#c8a678'); R(c, vai ? garfo + 4 : garfo - 5, fy2 - 3, 1, 7, '#6a4e2a');
			R(c, fx2 - 5, fy2 + 4, 3, 3, '#1a1a1e'); R(c, fx2 + 3, fy2 + 4, 3, 3, '#1a1a1e');
			if (Math.sin(t * 6) > 0) P(c, fx2 - 2, fy2 - 11, '#ff8a2a'); // o giroflex
			// o técnico soldando o trem de pouso, com as faíscas pulando
			var sx = nx - 64, sy = ny + 12;
			R(c, sx - 8, sy - 6, 4, 7, '#3a6ab0'); R(c, sx - 8, sy - 9, 4, 3, '#c8ccd6'); R(c, sx - 7, sy - 8, 3, 1, '#2a2c34'); R(c, sx - 4, sy - 4, 3, 1, '#3a6ab0');
			if ((t % 2.6) < 1.7) {
				c.globalAlpha = 0.4 + Math.random() * 0.3; c.fillStyle = '#bfe8ff'; c.beginPath(); c.arc(sx, sy - 4, 4, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
				P(c, sx, sy - 4, '#ffffff');
				for (var f = 0; f < 7; f++) { var fa = (t * 7 + f * 0.37) % 1, ang2 = ruido(f, Math.floor(t * 7)) * Math.PI - Math.PI; P(c, sx + Math.cos(ang2) * fa * 10, sy - 4 + Math.sin(ang2) * fa * 6 + fa * fa * 9, fa < 0.5 ? '#fff4a0' : '#ff9a3a'); }
			}
			// o sinaleiro com os bastões laranja, guiando a nave
			var mx = nx + 120, my = ny + 50, bra = Math.sin(t * 3) * 0.8;
			R(c, mx, my - 7, 4, 7, '#e8c040'); R(c, mx, my - 10, 4, 3, '#e8c0a0'); R(c, mx, my - 11, 4, 1, '#3a2a1a'); R(c, mx, my, 1, 3, '#2a2c34'); R(c, mx + 3, my, 1, 3, '#2a2c34');
			[[-1, 1], [1, -1]].forEach(function (lado) {
				var bx2 = mx + 2 + lado[0] * 3, by2 = my - 7, ex2 = bx2 + lado[0] * Math.cos(bra * lado[1]) * 6, ey2 = by2 - Math.sin(bra * lado[1] + 0.8) * 6;
				c.strokeStyle = '#ff7a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx2, by2); c.lineTo(ex2, ey2); c.stroke();
				c.globalAlpha = 0.3; c.fillStyle = '#ffa04a'; c.beginPath(); c.arc(ex2, ey2, 3, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
			});
			// o vapor saindo das grelhas do chão da baia, de tempos em tempos
			[[150, 210, 0], [338, 200, 1.7]].forEach(function (g) {
				R(c, g[0] - 5, g[1], 10, 3, '#2a2c34'); for (var gk = 0; gk < 4; gk++) R(c, g[0] - 4 + gk * 3, g[1] + 1, 1, 1, '#6a6e7a');
				var cic = (t + g[2]) % 3.4;
				if (cic < 2.2) for (var pf = 0; pf < 6; pf++) {
					var id = (cic * 1.3 + pf * 0.16) % 1, rr = 2 + id * 7;
					c.globalAlpha = (1 - id) * 0.35; c.fillStyle = '#f0f4fa';
					c.beginPath(); c.arc(g[0] + Math.sin(pf * 2.3 + t) * 3 + id * 6, g[1] - id * 26, rr, 0, Math.PI * 2); c.fill();
				}
				c.globalAlpha = 1;
			});
			// os cones de luz dos holofotes e a poeira dourada no ar
			c.globalAlpha = 0.07; c.fillStyle = '#fff4d0';
			c.beginPath(); c.moveTo(48, 36); c.lineTo(160, 200); c.lineTo(250, 170); c.fill();
			c.beginPath(); c.moveTo(450, 32); c.lineTo(260, 170); c.lineTo(350, 210); c.fill();
			c.globalAlpha = 1;
			for (var i = 0; i < 30; i++) { var px2 = (ruido(i, 81) * W + t * (6 + ruido(i, 82) * 8)) % W - OX, py2 = ruido(i, 83) * 220 + Math.sin(t + i) * 4; P(c, px2, py2, 'rgba(255,240,200,0.55)'); }
		},
		entrar: function () {
			ligarAmbiente('hangar'); capitulo('IV', T('O hangar', 'The hangar')); depois(SONS.fanfarra, 500);
			legenda(T('Hangar 11 · <b>PX-01 Millennium Falcon</b>, sua nave', 'Hangar 11 · <b>PX-01 Millennium Falcon</b>, your ship'), 12, 248);
			depois(function () { irPara('porta'); }, 7000);
		}
	};

	// 9. A PORTA (dentro da nave, como na foto de referência): a parede redonda do corredor, cheia
	// de caixas, cabos e luzinhas, com a porta no meio brilhando. Clicando, o painel desliza para
	// dentro da parede, com chiado de ar, como nos filmes.
	var PORTA = { x0: 200, x1: 280, y0: 52, y1: 238 };
	function caixa(x, y, w, h, cores) { // uma caixa de equipamento com bisel, sombra e parafusos
		ret(x, y, w, h, function (i, j) { return rampa(cores, (i - x) / w * 0.6 + (j - y) / h * 0.3 + (ruido(i >> 1, j >> 1) - 0.5) * 0.08, i, j); });
		ret(x, y, w, 1, '#fffaf0'); ret(x, y, 1, h, '#f8f0e0'); ret(x, y + h - 1, w, 1, '#3a342a'); ret(x + w - 1, y, 1, h, '#4a443a');
		[[2, 2], [w - 3, 2], [2, h - 3], [w - 3, h - 3]].forEach(function (q) { px(x + q[0], y + q[1], '#6a6250'); });
		for (var k = 0; k < 3; k++) mistura(x + 3 + ruido(k, x) * (w - 6), y + 3 + ruido(k, y) * (h - 6), '#5a4a3a', 0.4); // sujeirinha
	}
	CENAS.porta = {
		fundo: function () {
			var p = pintar(tela0(), function () {
				ret(-OX, 0, W, H, '#14120f');
				for (var y = 0; y < H; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
					var dx = (x - 240) / 250, dy = (y - 150) / 190, d = Math.sqrt(dx * dx + dy * dy);
					if (d > 1.02 && d < 1.2) px(x, y, rampa(['#efe4c8', '#d8ccae', '#bcae90', '#988a70', '#6e6250'], (d - 1.02) / 0.18 + (y / H) * 0.3 + (ruido(x >> 2, y >> 2) - 0.5) * 0.1, x, y));
					else if (d <= 1.02) px(x, y, rampa(['#b0aca2', '#a29e94', '#94908a', '#86827a', '#76726a', '#5e5a54'], Math.abs(dx) * 0.7 + (y / H) * 0.4 + (ruido(x >> 2, y >> 2) - 0.5) * 0.14, x, y));
					else px(x, y, rampa(['#2a2620', '#1a1814', '#100e0c'], d - 1.2, x, y));
				}
				for (var a = -2.6; a <= -0.5; a += 0.42) for (var r = 1.02; r < 1.2; r += 0.004) { px(240 + Math.cos(a) * 250 * r, 150 + Math.sin(a) * 190 * r, '#4a4234'); px(241 + Math.cos(a) * 250 * r, 150 + Math.sin(a) * 190 * r, '#f8f0dc'); }
				// as emendas e os rebites das placas da parede
				ret(20, 132, 440, 1, '#5e5a54'); ret(20, 133, 440, 1, '#c8c4ba');
				[60, 152, 336, 428].forEach(function (sx) { ret(sx, 20, 1, 220, '#5e5a54'); ret(sx + 1, 20, 1, 220, '#bab6ac'); for (var ry = 30; ry < 236; ry += 14) { px(sx - 3, ry, '#5e5a54'); px(sx + 4, ry, '#5e5a54'); px(sx - 3, ry - 1, '#d0ccc2'); px(sx + 4, ry - 1, '#d0ccc2'); } });
				for (var k = 0; k < 40; k++) { var mx = 30 + ruido(k, 101) * 420, my = 20 + ruido(k, 102) * 210; if (Math.abs(mx - 240) > 64) linha(mx, my, mx + 2 + ruido(k, 103) * 6, my + ruido(k, 104) * 2, '#6e6a62'); } // arranhões
				// o batente da porta: peças cor de creme com chanfro, em volta do painel
				var dx0 = 182, dx1 = 298, dy0 = 34, dy1 = 238;
				poli([[dx0 + 14, dy0], [dx1 - 14, dy0], [dx1, dy0 + 14], [dx1, dy1], [dx0, dy1], [dx0, dy0 + 14]], '#3a3832');
				poli([[dx0 + 18, dy0 + 4], [dx1 - 18, dy0 + 4], [dx1 - 4, dy0 + 18], [dx1 - 4, dy1], [dx0 + 4, dy1], [dx0 + 4, dy0 + 18]], function (x, y) { return rampa(['#f0e4c8', '#e0d4b6', '#cfc2a4', '#bcae90'], (x - dx0) / (dx1 - dx0) * 0.6 + (ruido(x >> 1, y >> 2) - 0.5) * 0.1, x, y); });
				ret(PORTA.x0 - 2, PORTA.y0 - 2, PORTA.x1 - PORTA.x0 + 4, PORTA.y1 - PORTA.y0 + 2, '#3a3832');
				for (y = dy0 + 26; y < dy1; y += 30) { ret(dx0 + 4, y, 14, 2, '#6a6250'); ret(dx0 + 4, y + 2, 14, 1, '#fff8e8'); ret(dx1 - 18, y, 14, 2, '#6a6250'); ret(dx1 - 18, y + 2, 14, 1, '#fff8e8'); }
				poli([[dx0 + 22, dy0 + 6], [dx1 - 22, dy0 + 6], [dx1 - 30, dy0 + 14], [dx0 + 30, dy0 + 14]], '#b8ac90');
				ret(dx0 + 4, dy0 + 18, 2, dy1 - dy0 - 18, '#fff8e4'); ret(dx1 - 6, dy0 + 18, 2, dy1 - dy0 - 18, '#a89a80');
			});
			return paraCanvas(p);
		},
		quadro: function (c, t) {
			// a abertura em etapas: o lacre solta vapor (0 a 0,5 s), a porta desliza (0,5 a 1,4 s), a luz invade
			var ta = this.abrindo ? (performance.now() - this.abrindo) / 1000 : 0;
			var abre = Math.max(0, Math.min(1, (ta - 0.5) / 0.9)), e = abre * abre * (3 - 2 * abre), largura = PORTA.x1 - PORTA.x0;
			// atrás da porta: o corredor iluminado da nave, em perspectiva
			c.drawImage(this.corredor || (this.corredor = corredorDaPorta()), PORTA.x0, PORTA.y0);
			var pulsoLuz = 0.85 + 0.15 * Math.sin(t * 2.3);
			c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.18 * pulsoLuz; c.fillStyle = '#ffe8b0'; c.fillRect(PORTA.x0, PORTA.y0, largura, PORTA.y1 - PORTA.y0); c.restore();
			// o painel da porta: treme um pouco quando o lacre solta, e depois desliza para dentro da parede
			var tremor = ta > 0 && ta < 0.5 ? Math.round(Math.sin(ta * 80)) : 0;
			c.save(); c.beginPath(); c.rect(PORTA.x0, PORTA.y0, largura, PORTA.y1 - PORTA.y0); c.clip();
			c.drawImage(this.painel || (this.painel = painelDaPorta()), PORTA.x0 + Math.round(e * largura) + tremor, PORTA.y0);
			// a luz escapando pelas frestas da porta fechada (fininha, pulsando)
			if (abre < 1) {
				var fresta = (0.5 + 0.5 * Math.sin(t * 3)) * (ta > 0 ? 1.6 : 1), xf = PORTA.x0 + Math.round(e * largura);
				c.globalAlpha = Math.min(1, 0.35 + fresta * 0.4); R(c, xf, PORTA.y0, 1, PORTA.y1 - PORTA.y0, '#fff4d0'); R(c, PORTA.x0, PORTA.y0, largura, 1, '#fff4d0'); R(c, xf + 39, PORTA.y0, 1, PORTA.y1 - PORTA.y0, '#ffe8b0');
				c.globalAlpha = 1;
			}
			c.restore();
			c.drawImage(this.frente || (this.frente = frenteDaPorta()), -OX, 0);
			var pisca = Math.sin(t * 5);
			R(c, 62, 152, 3, 3, pisca > 0 ? '#ff4a4a' : '#7a2a2a'); R(c, 70, 152, 3, 3, pisca > 0.5 ? '#4a8aff' : '#2a3a7a'); R(c, 78, 152, 3, 3, '#f2f2f2');
			R(c, 384, 66, 4, 4, Math.sin(t * 2) > 0 ? '#ff3a3a' : '#8a1a1a');
			c.globalAlpha = 0.22 + 0.1 * Math.sin(t * 2); R(c, 386, 214, 64, 26, '#4aff8a'); c.globalAlpha = 1;
			// o contorno brilhando, chamando o clique (some quando abre)
			var p = 0.5 + 0.5 * Math.sin(t * 3);
			c.globalAlpha = (0.4 + p * 0.55) * (1 - abre);
			c.strokeStyle = '#7fe3ff'; c.lineWidth = 1;
			for (var k = 0; k < 4; k++) { c.strokeRect(182 - k * 2 + 0.5, 34 - k * 2 + 0.5, 116 + k * 4, 204 + k * 4); c.globalAlpha *= 0.55; }
			c.globalAlpha = 1;
			// quando abre: raios de luz saindo da porta e se abrindo pela parede e pelo chão
			if (e > 0) {
				c.save(); c.globalCompositeOperation = 'lighter';
				var abertoX = PORTA.x0 + e * largura;
				for (var rr = 0; rr < 7; rr++) {
					var ox = PORTA.x0 + (abertoX - PORTA.x0) * (0.15 + rr * 0.12), oy = PORTA.y0 + 20 + rr * 24, abre2 = 30 + rr * 6;
					c.globalAlpha = 0.06 * e * (0.7 + 0.3 * Math.sin(t * 4 + rr)); c.fillStyle = rr % 2 ? '#ffe8b0' : '#cdf6ff';
					c.beginPath(); c.moveTo(ox, oy - 5); c.lineTo(ox - 120 + rr * 40 - abre2, H); c.lineTo(ox - 120 + rr * 40 + abre2, H); c.lineTo(ox, oy + 5); c.fill();
				}
				c.globalAlpha = 0.35 * e; c.fillStyle = '#ffe8b0'; c.beginPath(); c.moveTo(PORTA.x0, PORTA.y1); c.lineTo(abertoX, PORTA.y1); c.lineTo(abertoX + 70, H); c.lineTo(PORTA.x0 - 70, H); c.fill();
				c.restore(); c.globalAlpha = 1;
			}
			// o vapor da pressurização: jatos fortes saindo pelas frestas, que depois sobem e se espalham
			if (ta > 0) {
				var v = this.vapor || (this.vapor = []), agora = performance.now() / 1000;
				// (o estouro forte nos primeiros 0,6 s e depois um vapor mais calmo que vai rareando, junto com o chiado)
				if (ta < 3) for (var n = 0; n < (ta < 0.6 ? 7 : ta < 1.4 ? 3 : Math.random() < 1.4 - ta * 0.45 ? 1 : 0); n++) {
					var lado = Math.random() < 0.5 ? -1 : 1, emCima = Math.random() < 0.2;
					v.push({
						x: emCima ? PORTA.x0 + Math.random() * largura : (lado < 0 ? PORTA.x0 : PORTA.x0 + e * largura), y: emCima ? PORTA.y0 : PORTA.y0 + 10 + Math.random() * (PORTA.y1 - PORTA.y0 - 20),
						vx: emCima ? (Math.random() - 0.5) * 40 : lado * (60 + Math.random() * 110), vy: emCima ? -30 - Math.random() * 30 : -6 - Math.random() * 18,
						r: 2 + Math.random() * 2, nasce: agora, vida: 1.2 + Math.random() * 1.4, tom: Math.random()
					});
				}
				// e uma névoa baixa rolando pelo chão
				if (ta > 0.5 && ta < 3.2 && Math.random() < 0.6) v.push({ x: PORTA.x0 + Math.random() * largura, y: PORTA.y1 - 4, vx: (Math.random() - 0.5) * 80, vy: -2, r: 5, nasce: agora, vida: 2.2, tom: 0.2, chao: true });
				var ultimo = this.ultimoVapor || agora, dt = Math.min(0.05, agora - ultimo); this.ultimoVapor = agora;
				c.save();
				for (var i = v.length - 1; i >= 0; i--) {
					var q = v[i], idade = (agora - q.nasce) / q.vida;
					if (idade >= 1) { v.splice(i, 1); continue; }
					q.vx *= q.chao ? 0.985 : 0.95; q.vy = q.chao ? q.vy * 0.98 : q.vy - 18 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.r += (q.chao ? 10 : 7) * dt;
					var alfa = (idade < 0.1 ? idade / 0.1 : 1 - (idade - 0.1) / 0.9) * (q.chao ? 0.18 : 0.32);
					// cada nuvenzinha em três camadas: a borda azulada (luz da nave), o miolo claro e um brilho
					c.globalAlpha = alfa * 0.5; c.fillStyle = q.tom > 0.5 ? '#bfe8ff' : '#e0ecf8'; c.beginPath(); c.arc(q.x, q.y, q.r * 1.4, 0, Math.PI * 2); c.fill();
					c.globalAlpha = alfa; c.fillStyle = '#f4f8ff'; c.beginPath(); c.arc(q.x, q.y, q.r, 0, Math.PI * 2); c.fill();
					c.globalAlpha = alfa * 0.6; c.fillStyle = '#ffffff'; c.fillRect(Math.round(q.x - q.r * 0.3), Math.round(q.y - q.r * 0.3), Math.max(1, Math.round(q.r * 0.5)), Math.max(1, Math.round(q.r * 0.4)));
				}
				c.restore(); c.globalAlpha = 1;
				// e o clarão no instante em que o lacre solta
				if (ta < 0.25) { c.globalAlpha = (0.25 - ta) * 1.2; R(c, -OX, 0, W, H, '#e8f8ff'); c.globalAlpha = 1; }
			}
		},
		entrar: function () {
			var cena9 = this; cena9.abrindo = 0; cena9.vapor = [];
			ligarAmbiente('nave'); capitulo('V', T('A nave', 'The ship'));
			legenda(T('Clique na porta para embarcar', 'Click the door to board'), 12, 248);
			alvoClicavel(182, 34, 116, 204, T('Entrar na nave', 'Board the ship'), function () {
				limpar(); cena9.abrindo = performance.now(); SONS.porta();
				depois(function () { irPara('cabine'); }, 3800);
			});
		}
	};
	// o corredor da nave atrás da porta (80 x 186): paredes claras em perspectiva, faixas de luz no
	// teto, piso de grade e, lá no fundo, a cabine com a janela para as estrelas
	function corredorDaPorta() {
		return paraCanvas(pintar(new Pintura(80, 186), function () {
			var fx = 40, fy = 78, fw = 22, fh = 34; // a abertura lá do fundo
			ret(0, 0, 80, 186, '#d8ccb0');
			poli([[0, 0], [fx - fw / 2, fy - fh / 2], [fx - fw / 2, fy + fh / 2], [0, 186]], function (x, y) { return rampa(['#fff4dc', '#f0e2c4', '#d8c8a4', '#b8a888'], x / 30 * 0.5 + 0.2 + (Math.floor(x / 6) % 2) * 0.08, x, y); });
			poli([[80, 0], [fx + fw / 2, fy - fh / 2], [fx + fw / 2, fy + fh / 2], [80, 186]], function (x, y) { return rampa(['#fff4dc', '#f0e2c4', '#d8c8a4', '#b8a888'], (80 - x) / 30 * 0.5 + 0.25 + (Math.floor(x / 6) % 2) * 0.08, x, y); });
			poli([[0, 0], [80, 0], [fx + fw / 2, fy - fh / 2], [fx - fw / 2, fy - fh / 2]], function (x, y) { return rampa(['#fffaf0', '#f4e8d0', '#e0d0b0'], y / 60, x, y); });
			poli([[0, 186], [80, 186], [fx + fw / 2, fy + fh / 2], [fx - fw / 2, fy + fh / 2]], function (x, y) { return ((Math.floor(y / 4) + Math.floor(x / 4)) % 2) ? '#6a6458' : '#8a8274'; });
			for (var k = 0; k < 5; k++) { var u = k / 5, y1 = u * (fy - fh / 2); ret(fx - (1 - u) * 26, y1, (1 - u) * 52, Math.max(1, 3 - k * 0.5), '#ffffff'); }
			linha(4, 120, fx - fw / 2, fy + 6, '#7fe3ff'); linha(76, 120, fx + fw / 2, fy + 6, '#7fe3ff');
			linha(2, 60, fx - fw / 2, fy - 8, '#e8c46a'); linha(78, 60, fx + fw / 2, fy - 8, '#e8c46a');
			ret(fx - fw / 2, fy - fh / 2, fw, fh, '#0a1430');
			for (var s = 0; s < 14; s++) px(fx - fw / 2 + ruido(s, 1) * fw, fy - fh / 2 + ruido(s, 2) * fh * 0.6, '#ffffff');
			ret(fx - fw / 2, fy + 4, fw, fh / 2 - 4, '#1a2a4a'); for (var b = 0; b < 4; b++) ret(fx - fw / 2 + 2 + b * 5, fy + 7, 3, 2, ['#7dffa8', '#7fe3ff', '#ffd36a', '#ff8ad8'][b]);
			brilho(fx, fy, 30, '#ffffff', 0.35);
			for (var y = 0; y < 186; y++) for (var x = 0; x < 80; x++) { var d = Math.hypot((x - fx) / 40, (y - fy) / 90); mistura(x, y, '#fff0c8', Math.max(0, 0.35 - d * 0.3)); }
		}));
	}
	function painelDaPorta() {
		return paraCanvas(pintar(new Pintura(80, 186), function () {
			ret(0, 0, 80, 186, function (x, y) { return rampa(['#9a9486', '#8a8476', '#7a7468', '#6a645a', '#5a554c'], x / 80 * 0.5 + (ruido(x >> 2, y >> 2) - 0.5) * 0.2 + 0.3, x, y); });
			[[8, 6, 64, 36], [8, 48, 64, 30], [8, 124, 64, 26], [8, 156, 64, 24]].forEach(function (q) {
				ret(q[0], q[1], q[2], q[3], function (x, y) { return rampa(['#7e786a', '#6e685c', '#5e584e'], (x - q[0]) / q[2] * 0.6 + (y - q[1]) / q[3] * 0.3, x, y); });
				ret(q[0], q[1], q[2], 1, '#b8b2a4'); ret(q[0], q[1] + q[3] - 1, q[2], 1, '#3e3a34'); ret(q[0], q[1], 1, q[3], '#b8b2a4'); ret(q[0] + q[2] - 1, q[1], 1, q[3], '#4a4640');
				px(q[0] + 3, q[1] + 3, '#4a4640'); px(q[0] + q[2] - 4, q[1] + 3, '#4a4640');
			});
			[[10, 84], [48, 84], [10, 106], [48, 106]].forEach(function (q) { ret(q[0], q[1], 22, 10, '#4e4a42'); ret(q[0], q[1], 22, 1, '#8a8476'); });
			poli([[30, 92], [50, 92], [58, 101], [50, 110], [30, 110], [22, 101]], '#4a4640');
			poli([[31, 93], [49, 93], [56, 101], [49, 109], [31, 109], [24, 101]], function (x, y) { return rampa(['#9a9486', '#7a7468', '#5e584e'], (x - 24) / 32 * 0.5 + (y - 93) / 16 * 0.5, x, y); });
			linha(31, 93, 49, 93, '#c8c2b4'); linha(24, 101, 31, 93, '#c8c2b4');
			ret(0, 0, 2, 186, '#4a4640'); ret(78, 0, 2, 186, '#a8a294');
			for (var k = 0; k < 10; k++) linha(4 + ruido(k, 1) * 70, 4 + ruido(k, 2) * 176, 8 + ruido(k, 1) * 70, 5 + ruido(k, 2) * 176, '#a8a294');
		}));
	}
	function frenteDaPorta() {
		return paraCanvas(pintar(tela0(), function () {
			// à esquerda: aparelhos em pé com cabos laranja, a grade redonda com luzinhas e a caixa de ventilação
			caixa(92, 58, 16, 44, ['#ece4cc', '#d8d0b8', '#c0b8a0', '#a49c86']); for (var f = 0; f < 6; f++) ret(94, 64 + f * 6, 12, 2, '#6a6250');
			caixa(64, 100, 18, 22, ['#f2ead6', '#ddd5bf', '#c8c0a8']); caixa(68, 92, 10, 8, ['#a8a090', '#8a8478', '#6e685c']);
			caixa(118, 92, 14, 12, ['#f2ead6', '#e0d8c2', '#c8c0a8']);
			for (var t = 0; t <= 1; t += 0.006) {
				px(100 + Math.sin(t * 3) * 10, 102 + t * 44, '#f08a3a'); px(101 + Math.sin(t * 3) * 10, 102 + t * 44, '#c8641e'); px(102 + Math.sin(t * 3) * 10, 102 + t * 44, '#8a4210');
				px(124 - t * 14, 104 + t * 40 + Math.sin(t * 6) * 4, '#f08a3a'); px(125 - t * 14, 104 + t * 40 + Math.sin(t * 6) * 4, '#c8641e');
			}
			ret(97, 122, 8, 3, '#2a2a2a'); // a abraçadeira dos cabos
			// a caixa de junção onde os dois cabos laranja entram, com os prensa-cabos em cima
			caixa(95, 145, 26, 13, ['#e8e0c8', '#d0c8b0', '#b8b098', '#9c9480']);
			[[100, 144], [109, 144]].forEach(function (g) { ret(g[0] - 1, g[1] - 1, 5, 3, '#3a3832'); ret(g[0], g[1] - 1, 3, 1, '#8a8478'); });
			px(116, 150, '#7dffa8'); letras('J2', 104, 150, 1, '#6a6250');
			elip(76, 172, 20, 14, '#6e685c'); elip(76, 172, 18, 12, function (x, y, u, v) { return rampa(['#e8c890', '#c8a870', '#a88850', '#7a6038'], (u + v + 1.5) / 3, x, y); });
			for (var gr = -10; gr <= 10; gr += 3) ret(60, 172 + gr, 32, 1, '#6a5430');
			caixa(58, 148, 36, 10, ['#4a4640', '#3a3832', '#2a2824']);
			caixa(98, 166, 10, 10, ['#e0d8c2', '#c8c0a8', '#a8a090']); elip(103, 171, 3, 3, '#5a554c');
			caixa(70, 196, 46, 26, ['#f8f0dc', '#e4dcc6', '#cfc7b0', '#b4ac96']); for (f = 0; f < 7; f++) { ret(73, 201 + f * 3, 40, 1, '#7a7260'); ret(73, 202 + f * 3, 40, 1, '#fff8e8'); }
			letras('VENT 3', 93, 214, 1, '#5a5240', true);
			for (var p2 = 0; p2 < 3; p2++) { elip(82 + p2 * 12, 230, 4, 3, '#6e685c'); elip(82 + p2 * 12, 229, 3, 2, '#d8d0bc'); px(81 + p2 * 12, 228, '#ffffff'); }
			// à direita: a caixa de eletrônicos com o módulo vermelho, os cabos azuis e as mangueiras
			caixa(346, 56, 64, 54, ['#f2ead6', '#ddd5bf', '#c8c0a8', '#aca48e']);
			caixa(374, 60, 18, 14, ['#f06a5a', '#d83a3a', '#a82a2a']); ret(378, 64, 10, 6, '#ffffff'); letras('HV', 383, 65, 1, '#a82a2a', true);
			for (var c2 = 0; c2 < 5; c2++) caixa(350 + c2 * 11, 80, 8, 24, c2 % 2 ? ['#5a5e6a', '#3a3d46', '#2a2c34'] : ['#7a7e8a', '#5a5e6a', '#3a3d46']);
			for (t = 0; t <= 1; t += 0.004) {
				// (os três cabos saem da caixa de cima e entram na de baixo: nada fica solto no ar)
				var ax = 348 - Math.sin(t * Math.PI) * 28 + t * 6, ay = 72 + t * 78; px(ax, ay, '#4a7af0'); px(ax + 1, ay, '#2a5ad8'); px(ax + 2, ay, '#1a3a98');
				var bx = 406 + Math.sin(t * Math.PI * 1.5) * 18 - t * 6, by = 64 + t * 86; px(bx, by, '#3a3d46'); px(bx + 1, by, '#1a1a1e'); px(bx + 2, by, '#0e0e10');
				var cx = 362 + t * 30, cy = 108 + Math.sin(t * Math.PI) * 30 + t * 34; px(cx, cy, '#4a7af0'); px(cx, cy + 1, '#1a3a98');
			}
			caixa(352, 140, 50, 30, ['#c8c0b0', '#b0a898', '#989080']); for (f = 0; f < 4; f++) { ret(356, 146 + f * 5, 42, 2, '#6a6250'); ret(356, 148 + f * 5, 42, 1, '#d8d0c0'); }
			// os conectores onde cada cabo entra nas caixas
			[[347, 71], [405, 63], [361, 108], [353, 140], [371, 140], [385, 140]].forEach(function (g) { ret(g[0] - 1, g[1] - 1, 5, 4, '#2a2c34'); ret(g[0], g[1] - 1, 3, 1, '#9a9eaa'); });
			elip(352, 40, 6, 6, '#3a3832'); elip(352, 40, 4, 4, '#a8a090'); px(350, 38, '#ffffff'); ret(350, 34, 4, 3, '#3a3832');
			// o chão escuro com a grade de luz no canto esquerdo
			for (var y = 238; y < H; y++) for (var x = -OX; x < NUCLEO + OX; x++) px(x, y, (x % 6 === 0 || y % 5 === 0) ? '#0e0c0a' : rampa(['#2e2a24', '#221f1a', '#16140f'], (y - 238) / 32, x, y));
			for (var lz = 0; lz < 6; lz++) poli([[36 + lz * 8, 270], [42 + lz * 8, 270], [74 + lz * 6, 242], [70 + lz * 6, 242]], '#f2f2e8');
			ret(182, 238, 116, 2, '#d8ccb0');
			// a maleta cinza com a placa verde de saída
			caixa(372, 204, 92, 66, ['#6a6e7a', '#4a4e5a', '#3a3d46', '#2a2c34']);
			ret(384, 212, 68, 30, '#1a2a1e'); ret(386, 214, 64, 26, '#0e3a1e');
			letras('EXIT', 410, 220, 3, '#4aff8a', true); letras('>', 440, 223, 2, '#4aff8a');
			ret(400, 250, 36, 4, '#22252c'); ret(400, 250, 36, 1, '#8a8e98'); // a alça
			letras('BIANCA CARDADOR', 418, 244, 1, '#6a6e7a', true); // (a assinatura da autora, gravada na maleta)
		}));
	}

	// 10. A CABINE: no lugar do piloto, a janela de vidros em leque olhando o hangar 11. Um clique liga
	// a nave (os painéis acendem em cascata), o ZÖ-11 chama pelo rádio, a contagem aparece no visor do
	// meio e a PX-01 sobe: o hangar desce pela janela, o céu escurece, as estrelas aparecem e começa o
	// salto para a Via Láctea.
	var VIDRO = { cx: 240, cy: 98, rx: 230, ry: 112, topo: 12, base: 158, ox: 240, oy: 104 };
	function noVidro(x, y) { var u = (x - VIDRO.cx) / VIDRO.rx, v = (y - VIDRO.cy) / VIDRO.ry; return y > VIDRO.topo && y < VIDRO.base && u * u + v * v < 1; }
	// o para-brisa da Falcon: um vidro redondo bem no meio, olhando para a frente, e em volta dele
	// dois anéis de vidros em trapézio, presos por aros e raios de metal que engrossam para perto de nós
	// (devolve 0 no vidro, ou a luz da armação: perto de 1 na face iluminada, perto de 0 na sombra)
	var ANEIS_VIDRO = [[30, 4], [74, 6], [138, 8]];
	function naHaste(x, y) {
		var u = (x - VIDRO.cx) / VIDRO.rx, v = (y - VIDRO.cy) / VIDRO.ry, q = Math.sqrt(u * u + v * v);
		if (q > 0.955) return 0.15 + (1 - q) * 4; // o aro grosso de fora
		if (y > VIDRO.base - 5) return 0.75 - (y - VIDRO.base + 5) * 0.15; // o peitoril embaixo
		var dx = (x - VIDRO.ox) / 1.3, dy = y - VIDRO.oy, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
		for (var i = 0; i < ANEIS_VIDRO.length; i++) {
			var r = ANEIS_VIDRO[i][0], w = ANEIS_VIDRO[i][1], e = d - r;
			if (Math.abs(e) < w / 2) return e < 0 ? 0.95 - (e + w / 2) / w * 0.3 : 0.6 - e / w * 0.8; // a face de dentro pega a luz do vidro do meio
		}
		if (d < ANEIS_VIDRO[0][0]) return 0;
		var n = d < ANEIS_VIDRO[1][0] ? 8 : 10, passo = Math.PI * 2 / n, ini = passo / 2;
		var rel = ((a - ini) % passo + passo) % passo, lado = rel < passo / 2 ? 1 : -1; rel = Math.min(rel, passo - rel);
		var dist = rel * d, larg = 1.4 + d * 0.028;
		if (dist < larg) return lado > 0 ? 0.85 - dist / larg * 0.4 : 0.45 - dist / larg * 0.3;
		return 0;
	}
	var TELAS_CAB = [{ x: 86, y: 180, w: 54, h: 32, tipo: 'radar' }, { x: 204, y: 177, w: 72, h: 38, tipo: 'meio' }, { x: 340, y: 180, w: 54, h: 32, tipo: 'ondas' }];
	function tempoCena() { return (performance.now() - inicioCena) / 1000; }
	CENAS.cabine = {
		fundo: function () {
			var cena10 = this;
			// lá fora, com o dobro da altura da tela: em cima o céu indo para o espaço, embaixo o hangar 11
			cena10.fora = paraCanvas(pintar(new Pintura(W, H * 2, OX), function () {
				for (var y = 0; y < H * 2; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
					var c, q = (x - 240) / 240;
					var rocha = 300 + Math.sin((x + OX) * 0.04) * 6 + ruido((x + OX) >> 3, 7) * 9, muro = 334 + q * q * 10, chao = 362 + q * q * 14;
					if (y < rocha) {
						c = rampa(['#03041a', '#080c2e', '#141a4c', '#2e2a68', '#6a3a78', '#c0605e', '#f0a868'], Math.pow(y / rocha, 1.7), x, y);
						if (y < 250 && ruido(x + 917, y + 331) > 0.991 + y / 250 * 0.008) c = ruido(x, y) > 0.6 ? '#ffffff' : '#bfe0ff';
					} else if (y < muro) {
						var cam = Math.floor((y + Math.sin(x * 0.07) * 4) / 5);
						c = rampa(['#4a3a30', '#6a5040', '#8a6a50', '#aa8664', '#c8a07a'], 0.2 + ruido(x >> 2, cam) * 0.5 + (cam % 3) * 0.1 - (y - rocha) / 34 * 0.25, x, y);
					} else if (y < chao) {
						c = (Math.floor((x + OX) / 9) % 4 === 0) ? '#1e2028' : rampa(['#6a6e7a', '#5e6270', '#4a4e5a', '#3a3e4a', '#2c2f38'], (y - muro) / (chao - muro) * 0.8 + 0.1, x, y);
					} else { // o chão da baia em perspectiva, com as juntas fugindo para o fundo
						var z = 400 / (y - 346), u = (x - 240) / (y - 346) * 2.2;
						var junta = z % 1 < 0.06 || Math.abs((u % 1 + 1) % 1 - 0.5) > 0.47;
						c = junta ? '#8a867c' : rampa(['#d0ccc2', '#c0bcb2', '#b0aca2', '#a09c92', '#8e8a82'], 0.15 + ruido(Math.floor(u), Math.floor(z)) * 0.3 + (ruido(x, y) - 0.5) * 0.12 + (1 - (y - chao) / 180) * 0.2, x, y);
					}
					px(x, y, c);
				}
				// o anel de faixas amarelas e pretas e o número da baia
				for (var t = Math.PI; t < Math.PI * 2; t += 0.001) {
					var zx = 240 + Math.cos(t) * 330, zy = 470 + Math.sin(t) * 74;
					if (zy < 366) continue;
					var faixa = (Math.floor(t * 30) % 2) ? '#f0c030' : '#1a1a1e', esp = Math.max(1, Math.round((zy - 350) / 14));
					for (var e2 = 0; e2 < esp; e2++) px(zx, zy + e2, faixa);
				}
				letras('11', 240, 418, 3, '#e8b830', true);
				// a torre do hangar à esquerda e os postes de holofote na borda
				for (y = 250; y < 364; y++) for (x = -OX; x < 34; x++) px(x, y, rampa(['#e8e2d8', '#d0cabe', '#b8b2a6', '#9a948a', '#6a665e'], (x + OX) / (34 + OX) * 0.9 + (ruido(x >> 2, y >> 2) - 0.5) * 0.08, x, y));
				for (y = 258; y < 360; y += 16) { ret(-OX, y, 34 + OX, 2, '#7a766e'); ret(-OX + 6, y + 5, 10, 5, '#2a2c34'); ret(-OX + 6, y + 5, 10, 1, '#ffd890'); }
				[[96, 300], [384, 300]].forEach(function (p) { ret(p[0], p[1], 3, 36, '#4a4e5a'); ret(p[0] + 1, p[1], 1, 36, '#8a8e98'); ret(p[0] - 5, p[1] - 4, 13, 5, '#2a2c34'); });
			}));
			// a cabine por dentro (cabine.js, a mesma das chegadas), com a janela vazada
			var mf = window.CabineFalcon.moldura(W, H, OX);
			cena10.moldura = mf.canvas;
			// as luzes do painel, cada uma com a hora de acender (em cascata, do meio para as pontas)
			var luzes = [], CORES_LUZ = ['#7dffa8', '#7fe3ff', '#ffd36a', '#ff8a5a', '#ff5a7a', '#c89aff'];
			for (var yy = 222; yy <= 234; yy += 6) for (var xx = 54; xx < 428; xx += 7) luzes.push({ x: xx, y: yy, w: 2 });
			for (xx = 84; xx < 400; xx += 9) luzes.push({ x: xx, y: 162, w: 2 });
			mf.luzes.forEach(function (l) { luzes.push({ x: l.x, y: l.y, w: 2 }); }); // (as luzinhas das paredes e do teto)
			luzes = luzes.filter(function (l) { return !(l.x >= 398 && l.y >= 170) && window.CabineFalcon.livreDasAlavancas(l); }); // (nada acende em cima da poltrona do copiloto nem do suporte das alavancas)
			luzes.forEach(function (l, i) {
				l.cor = CORES_LUZ[Math.floor(ruido(i, 3) * CORES_LUZ.length)];
				l.ordem = 0.15 + Math.abs(l.x - 240) / 240 * 1.6 + (l.y === 4 ? 0.4 : 0) + ruido(i, 4) * 0.15;
				l.pisca = ruido(i, 5) < 0.25; l.vel = 2 + ruido(i, 6) * 5; l.fase = ruido(i, 7) * 6;
			});
			cena10.luzes = luzes;
			return paraCanvas(pintar(tela0(), function () { ret(-OX, 0, W, H, '#05060c'); }));
		},
		quadro: function (c, t) {
			var s = this, L = s.ligada ? t - s.ligada : -1;
			// quanto a nave já subiu: devagar no começo, cada vez mais rápido
			var p = s.subida ? Math.min(1, (t - s.subida) / 6) : 0, sub = p * p;
			var bal = s.contagem ? Math.sin(t * 2.2) * 0.8 : 0; // flutuando de leve nos repulsores
			var oy = Math.round(-254 + sub * 300 + bal);
			c.drawImage(s.fora, -OX, oy);
			// lá fora: as luzes da borda da baia, o sinaleiro e um técnico dando tchau
			for (var k = 0; k < 9; k++) {
				var lx = 30 + k * 52, q = (lx - 240) / 240, ly = 333 + q * q * 10 + oy;
				if (Math.sin(t * 3 - k * 0.8) > 0.2) { c.globalAlpha = 0.3; c.fillStyle = '#7fe3ff'; c.beginPath(); c.arc(lx, ly, 4, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; R(c, lx - 1, ly - 1, 3, 2, '#dff8ff'); }
			}
			[[96, 296], [384, 296]].forEach(function (h) { c.globalAlpha = 0.5; c.fillStyle = '#fff4d0'; c.beginPath(); c.arc(h[0] + 1, h[1] + oy, 5, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; R(c, h[0] - 4, h[1] - 1 + oy, 11, 2, '#ffffff'); });
			if (s.contagem) { // o brilho azul dos repulsores refletindo no chão da baia
				var forca = Math.min(1, (t - s.contagem) / 2) * (1 - sub), gl = c.createRadialGradient(240, 420 + oy, 4, 240, 420 + oy, 200);
				gl.addColorStop(0, 'rgba(140,220,255,' + 0.5 * forca + ')'); gl.addColorStop(1, 'rgba(60,110,255,0)');
				c.fillStyle = gl; c.fillRect(-OX, 330 + oy, W, 200);
			}
			var mx = 300, my = 404 + oy, bra = Math.sin(t * 3) * 0.8;
			R(c, mx, my - 9, 5, 9, '#e8c040'); R(c, mx, my - 13, 5, 4, '#e8c0a0'); R(c, mx, my - 14, 5, 1, '#3a2a1a'); R(c, mx, my, 2, 3, '#2a2c34'); R(c, mx + 3, my, 2, 3, '#2a2c34');
			[[-1, 1], [1, -1]].forEach(function (lado) {
				var bx = mx + 2 + lado[0] * 4, by = my - 8, ex = bx + lado[0] * Math.cos(bra * lado[1]) * 8, ey = by - Math.sin(bra * lado[1] + 0.8) * 8;
				c.strokeStyle = '#ff7a1a'; c.lineWidth = 2; c.beginPath(); c.moveTo(bx, by); c.lineTo(ex, ey); c.stroke();
				c.globalAlpha = 0.3; c.fillStyle = '#ffa04a'; c.beginPath(); c.arc(ex, ey, 4, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
			});
			var tx = 170, ty = 400 + oy, mao = Math.sin(t * 8) * 2;
			R(c, tx, ty - 9, 5, 9, '#3a6ab0'); R(c, tx, ty - 13, 5, 4, '#e8c0a0'); R(c, tx, ty - 14, 5, 2, '#c8ccd6'); R(c, tx, ty, 2, 3, '#2a2c34'); R(c, tx + 3, ty, 2, 3, '#2a2c34');
			R(c, tx + 5, ty - 15 + Math.abs(mao) * 0.3, 1, 7, '#3a6ab0'); R(c, tx + 5 + mao, ty - 17, 2, 2, '#e8c0a0'); // o braço acenando
			// as estrelas piscando lá em cima (aparecem quando o céu chega na janela)
			for (var i = 0; i < 16; i++) {
				var sx = ruido(i, 51) * W - OX, sy = ruido(i, 52) * 230 + oy, br = Math.sin(t * (1.5 + ruido(i, 53) * 2) + i);
				if (br > 0.6 && sy > 0) { P(c, sx, sy, '#ffffff'); P(c, sx - 1, sy, 'rgba(200,230,255,0.6)'); P(c, sx + 1, sy, 'rgba(200,230,255,0.6)'); P(c, sx, sy - 1, 'rgba(200,230,255,0.6)'); P(c, sx, sy + 1, 'rgba(200,230,255,0.6)'); }
			}
			// um reflexo suave no vidro
			c.globalAlpha = 0.05; c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(60, 20); c.lineTo(110, 20); c.lineTo(40, 150); c.lineTo(-10, 150); c.fill(); c.globalAlpha = 1;
			c.drawImage(s.moldura, -OX, 0);
			// as luzes do painel
			s.luzes.forEach(function (l) {
				var dt = L - l.ordem; if (L < 0 || dt < 0) return;
				var acesa = dt < 0.18 ? Math.floor(dt * 40) % 2 === 0 : (!l.pisca || Math.sin(t * l.vel + l.fase) > -0.3);
				if (!acesa) return;
				c.globalAlpha = 0.28; R(c, l.x - 1, l.y - 1, l.w + 2, 4, l.cor); c.globalAlpha = 1;
				R(c, l.x, l.y, l.w, 2, l.cor); P(c, l.x, l.y, '#ffffff');
			});
			if (L >= 0) { c.globalAlpha = Math.min(0.12, L * 0.1); c.fillStyle = '#ffe8b8'; c.fillRect(-OX, 12, W, 30); c.globalAlpha = 1; } // a luz do teto acendendo
			// os visores
			TELAS_CAB.forEach(function (q, n) {
				var lt = L - 0.8 - n * 0.35; if (L < 0 || lt < 0) return;
				c.save(); c.beginPath(); c.rect(q.x, q.y, q.w, q.h); c.clip();
				if (lt < 0.3) { R(c, q.x, q.y + q.h / 2 - 1, q.w * Math.min(1, lt / 0.15), 2, '#dfffe8'); c.restore(); return; } // o tubo esquentando
				R(c, q.x, q.y, q.w, q.h, '#04140e');
				if (q.tipo === 'radar') {
					var cx = q.x + q.w / 2, cy = q.y + q.h / 2, a = t * 2;
					c.strokeStyle = 'rgba(125,255,168,0.35)'; c.lineWidth = 1; [6, 11, 15].forEach(function (r) { c.beginPath(); c.arc(cx + 0.5, cy + 0.5, r, 0, Math.PI * 2); c.stroke(); });
					for (var w2 = 0; w2 < 8; w2++) { c.globalAlpha = 0.5 - w2 * 0.06; linhaGrossa(c, [cx, cy], [cx + Math.cos(a - w2 * 0.08) * 15, cy + Math.sin(a - w2 * 0.08) * 15], 1, '#7dffa8'); }
					c.globalAlpha = 1; [[8, -5], [-10, 4], [3, 9]].forEach(function (b, j) { if (Math.sin(t * 2 + j * 2) > 0) R(c, cx + b[0], cy + b[1], 2, 2, '#dfffe8'); });
				} else if (q.tipo === 'ondas' && window.TempoDoSol) {
					/* o tempo do Sol ao vivo (dados da NOAA), com a moldura piscando em vermelho no alerta */
					var vs = window.TempoDoSol.visor(t);
					vs.linhas.forEach(function (l, il) { texto3(c, l[0], Math.round(q.x + q.w / 2 - (l[0].length * 4 - 1) / 2), q.y + 4 + il * 9, 1, l[1]); });
					if (vs.alerta && Math.floor(t * 3) % 2) { R(c, q.x, q.y, q.w, 1, '#ff6a5a'); R(c, q.x, q.y + q.h - 1, q.w, 1, '#ff6a5a'); R(c, q.x, q.y, 1, q.h, '#ff6a5a'); R(c, q.x + q.w - 1, q.y, 1, q.h, '#ff6a5a'); }
				} else if (q.tipo === 'ondas') {
					for (var b2 = 0; b2 < 12; b2++) { var hb = 3 + Math.abs(Math.sin(t * 3 + b2 * 0.7) * Math.cos(t * 1.3 + b2)) * (q.h - 8); R(c, q.x + 3 + b2 * 4, q.y + q.h - 2 - hb, 3, hb, b2 % 3 ? '#7fe3ff' : '#ffd36a'); }
				} else {
					// o visor do meio: o estado da nave e, depois, a contagem regressiva grandona
					if (s.contagem && t - s.contagem < 3) {
						var num = 3 - Math.floor(t - s.contagem), fr = (t - s.contagem) % 1;
						texto3(c, String(num), q.x + q.w / 2 - 6 - (fr < 0.1 ? 1 : 0), q.y + 7, 5, fr < 0.5 ? '#ffd36a' : '#ff9a4a');
					} else if (s.contagem) {
						texto3(c, 'DECOLAR', q.x + 8, q.y + 15, 2, Math.floor(t * 4) % 2 ? '#7dffa8' : '#dfffe8');
					} else {
						texto3(c, 'PX-01', q.x + 4, q.y + 5, 1, '#7dffa8');
						texto3(c, lt > 1.2 ? 'SISTEMAS OK' : 'TESTANDO..', q.x + 4, q.y + 13, 1, '#7dffa8');
						texto3(c, 'MOTORES', q.x + 4, q.y + 21, 1, '#7fe3ff'); R(c, q.x + 34, q.y + 22, Math.min(34, lt * 14), 3, '#7fe3ff');
						if (Math.floor(t * 2) % 2) R(c, q.x + 4, q.y + 30, 3, 4, '#7dffa8');
					}
				}
				for (var sl = q.y; sl < q.y + q.h; sl += 2) { c.globalAlpha = 0.18; R(c, q.x, sl, q.w, 1, '#000000'); } // as linhas do tubo
				c.globalAlpha = 1; c.restore();
			});
			// as duas alavancas de potência no meio do painel, empurradas na decolagem
			// (empurradas no clique: descem até o fim do curso, uma depois da outra)
			var brilhoAl = s.apontado === 'alavanca' ? 0.5 + 0.5 * Math.sin(t * 4) : 0;
			if (brilhoAl) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.12 + brilhoAl * 0.18; c.fillStyle = '#ffd36a'; c.beginPath(); c.ellipse(240, 243, 16, 9, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
			R(c, 224, 236, 32, 34, '#0e0f13'); R(c, 224, 236, 32, 1, '#4a4e5a'); for (var ri = 0; ri < 5; ri++) R(c, 226, 240 + ri * 6, 28, 1, '#22242a'); // a fenda por onde elas correm
			[230, 246].forEach(function (lx, i) {
				var em = s.contagem ? suave((t - s.contagem - i * 0.12) / 0.45) : 0, dy = Math.round(em * 16);
				R(c, lx, 246 + dy, 4, 24 - dy, '#2a2c34'); R(c, lx + 1, 246 + dy, 1, 24 - dy, '#4a4e5a');
				R(c, lx - 2, 240 + dy, 8, 6, brilhoAl ? '#f0dca0' : '#c8ccd6'); R(c, lx - 2, 240 + dy, 8, 1, '#ffffff'); R(c, lx - 2, 245 + dy, 8, 1, '#6a6e7a');
			});
			// o botão de ignição, vermelho, com a tampinha de proteção levantada; aceso em verde depois de ligar
			var ig = s.ligada ? '#4aff8a' : (Math.floor(t * 2) % 2 ? '#ff4a4a' : '#c82a2a');
			R(c, 296, 186, 26, 24, '#16171c'); R(c, 296, 186, 26, 1, '#5a5e6a'); R(c, 297, 187, 24, 1, '#2a2c34');
			c.fillStyle = '#0a0a0c'; c.beginPath(); c.arc(309, 197, 8, 0, Math.PI * 2); c.fill();
			c.fillStyle = ig; c.beginPath(); c.arc(309, 197, 6, 0, Math.PI * 2); c.fill();
			R(c, 306, 193, 3, 2, 'rgba(255,255,255,0.7)');
			if (!s.ligada) { R(c, 299, 182, 20, 3, '#c8a020'); for (var zz = 0; zz < 20; zz += 4) R(c, 299 + zz, 182, 2, 3, '#1a1a1e'); } // a tampa listrada levantada
			texto3(c, s.ligada ? 'ON' : 'IGN', s.ligada ? 305 : 303, 207, 1, s.ligada ? '#4aff8a' : '#ff8a8a');
			if (s.ligada) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.25; c.fillStyle = '#4aff8a'; c.beginPath(); c.arc(309, 197, 11, 0, Math.PI * 2); c.fill(); c.restore(); }
			// (na cabine não tem seta: só um brilho suave em volta do botão que espera o clique)
			if (s.apontado === 'ignicao') { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = 0.15 + 0.2 * (0.5 + 0.5 * Math.sin(t * 4)); c.fillStyle = '#ff6a5a'; c.beginPath(); c.arc(309, 197, 15, 0, Math.PI * 2); c.fill(); c.restore(); }
			// a subida: as estrelas esticando e o clarão branco do salto
			if (s.subida && p > 0.7) {
				var fs = (p - 0.7) / 0.3;
				c.globalAlpha = Math.min(1, fs * fs) * 0.95; c.fillStyle = '#eef6ff'; c.fillRect(-OX, 0, W, H); c.globalAlpha = 1;
			}
		},
		entrar: function () {
			var cena10 = this; cena10.ligada = 0; cena10.contagem = 0; cena10.subida = 0; cena10.apontado = 'ignicao';
			ligarAmbiente('nave'); capitulo('VI', T('A decolagem', 'The takeoff'));
			legenda(T('Aperte o botão de <b>ignição</b> para ligar a nave', 'Press the <b>ignition</b> button to start the ship'), 12, 248);
			alvoClicavel(292, 178, 34, 36, T('Apertar o botão de ignição', 'Press the ignition button'), function () {
				limpar(); cena10.apontado = null; cena10.ligada = tempoCena(); SONS.ligar();
				depois(function () { ligarAmbiente('cabine'); }, 1200);
				depois(function () {
					SONS.radio();
					falar(T('PX-01, aqui é a torre do hangar 11. Na escuta, ' + primeiroNome() + '?', 'PX-01, this is hangar 11 tower. Do you copy, ' + primeiroNome() + '?'), 460, T('ZÖ-11 · rádio', 'ZÖ-11 · radio')).then(function () {
						depois(function () {
							limpar(); SONS.radio();
							/* a torre conta o tempo do Sol de verdade (dados da NOAA), quando eles chegaram */
							var sol = window.TempoDoSol, avisoS = sol && sol.aviso(), bol = sol && sol.boletim();
							var liberada = avisoS ? T('Atenção, PX-01: ' + avisoS.replace('Atenção: o Sol', 'o Sol') + ' Liberada para decolar, com cuidado!', 'Heads up, PX-01: ' + avisoS.replace('Attention: the Sun', 'the Sun') + ' Cleared for takeoff, carefully!')
								: bol ? T('Tempo do Sol calmo: ' + bol + '. PX-01, liberada para decolar!', 'Calm solar weather: ' + bol + '. PX-01, cleared for takeoff!') : T('Céu limpo lá em cima. PX-01, liberada para decolar!', 'Clear skies up there. PX-01, cleared for takeoff!');
							falar(liberada, 460, T('ZÖ-11 · rádio', 'ZÖ-11 · radio')).then(function () {
								cena10.apontado = 'alavanca';
								legenda(T('Empurre as <b>alavancas</b> de potência para decolar', 'Push the power <b>levers</b> to take off'), 12, 248);
								alvoClicavel(218, 226, 44, 44, T('Empurrar as alavancas de potência e decolar', 'Push the power levers and take off'), function () {
									limpar(); cena10.apontado = null; cena10.contagem = tempoCena(); tocarMusica('decolagem');
									[0, 1, 2].forEach(function (n) { depois(function () { SONS.contagem(false); }, n * 1000); });
									depois(function () { SONS.contagem(true); SONS.motor(); cena10.subida = tempoCena(); }, 3000);
									depois(function () { terminar(true); }, 9000);
								});
							});
						}, 1400);
					});
				}, 2600);
			});
		}
	};

	// ---------- O laço ----------
	var anterior = 0;
	function laco(agora) {
		if (!raiz.isConnected) return;
		requestAnimationFrame(laco);
		if (agora - anterior < 1000 / 30) return;
		anterior = agora;
		if (!cena) return;
		var t = (agora - inicioCena) / 1000;
		if (cena.mesa) quadroMesa(t);
		else {
			if (cena.fundoPronto) ctx.drawImage(cena.fundoPronto, 0, 0);
			ctx.save(); ctx.translate(OX, 0);
			if (cena.quadro) cena.quadro(ctx, t);
			ctx.restore();
		}
	}

	// ---------- Fim do embarque ----------
	// (saltar: veio da decolagem, então a viagem já começa com o salto para a Via Láctea)
	function terminar(saltar) {
		geracao++;
		if (saltar === true) { var iniciar = document.getElementById('iniciar'); if (iniciar) setTimeout(function () { iniciar.click(); }, 50); }
		desligarAmbiente();
		try { localStorage.setItem('embarqueFeito', '1'); } catch (e) {}
		if (forcar && history.replaceState) history.replaceState(null, '', location.pathname + location.hash);
		raiz.classList.add('saindo');
		setTimeout(function () { raiz.remove(); document.body.classList.remove('embarcando'); if (audio) audio.close(); }, calmo ? 0 : 900);
	}
	raiz.querySelector('.emb-pular').addEventListener('click', terminar);
	var botaoSom = raiz.querySelector('.emb-som');
	botaoSom.addEventListener('click', function () {
		somLigado = !somLigado;
		botaoSom.setAttribute('aria-pressed', somLigado ? 'true' : 'false');
		if (mestre) mestre.gain.value = somLigado ? 0.5 : 0;
	});

	window.Embarque = { irPara: irPara, terminar: terminar };

	ajustarCamera();
	if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('16px "Mrs Saint Delafield"'), document.fonts.load('8px Silkscreen')]).then(function () { irPara('abertura'); }, function () { irPara('abertura'); });
	else irPara('abertura');
	requestAnimationFrame(laco);
})();
