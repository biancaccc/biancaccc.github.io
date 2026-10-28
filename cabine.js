// A cabine da PX-01 (a nossa Millennium Falcon), vista do lugar do piloto, para a decolagem
// (embarque.js) e para as chegadas (chegada.js): as duas usam exatamente a mesma cabine.
// Inspirada na cabine da Falcon dos filmes: apertada e escura, o para-brisa em leque com o vidro
// redondo no meio, painéis cheios de interruptores e luzinhas nas paredes e no teto em arco,
// mangueiras sanfonadas seguindo a moldura do vidro, o painel com os visores e as alavancas, e as
// poltronas de couro claro com a moldura de metal (a do copiloto à direita, o braço da nossa à esquerda).
// Uso: CabineFalcon.moldura(W, H, OX) devolve { canvas, luzes } (o canvas tem a janela vazada; luzes são
// as luzinhas das paredes, para quem desenha piscar por cima).
(function () {
	var NUCLEO = 480;
	var VIDRO = { cx: 240, cy: 98, rx: 230, ry: 112, topo: 12, base: 158, ox: 240, oy: 104 };
	function noVidro(x, y) { var u = (x - VIDRO.cx) / VIDRO.rx, v = (y - VIDRO.cy) / VIDRO.ry; return y > VIDRO.topo && y < VIDRO.base && u * u + v * v < 1; }
	// o para-brisa: um vidro redondo no meio e dois anéis de vidros em trapézio, presos por aros e raios
	// de metal que engrossam para perto de nós (0 no vidro; senão a luz da armação, de 0 a 1)
	var ANEIS_VIDRO = [[30, 4], [74, 6], [138, 8]];
	function naHaste(x, y) {
		var u = (x - VIDRO.cx) / VIDRO.rx, v = (y - VIDRO.cy) / VIDRO.ry, q = Math.sqrt(u * u + v * v);
		if (q > 0.955) return 0.15 + (1 - q) * 4;
		if (y > VIDRO.base - 5) return 0.75 - (y - VIDRO.base + 5) * 0.15;
		var dx = (x - VIDRO.ox) / 1.3, dy = y - VIDRO.oy, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
		for (var i = 0; i < ANEIS_VIDRO.length; i++) {
			var r = ANEIS_VIDRO[i][0], w = ANEIS_VIDRO[i][1], e = d - r;
			if (Math.abs(e) < w / 2) return e < 0 ? 0.95 - (e + w / 2) / w * 0.3 : 0.6 - e / w * 0.8;
		}
		if (d < ANEIS_VIDRO[0][0]) return 0;
		var n = d < ANEIS_VIDRO[1][0] ? 8 : 10, passo = Math.PI * 2 / n, ini = passo / 2;
		var rel = ((a - ini) % passo + passo) % passo, lado = rel < passo / 2 ? 1 : -1; rel = Math.min(rel, passo - rel);
		var dist = rel * d, larg = 1.4 + d * 0.028;
		if (dist < larg) return lado > 0 ? 0.85 - dist / larg * 0.4 : 0.45 - dist / larg * 0.3;
		return 0;
	}
	var TELAS = [{ x: 86, y: 180, w: 54, h: 32, tipo: 'radar' }, { x: 204, y: 177, w: 72, h: 38, tipo: 'meio' }, { x: 340, y: 180, w: 54, h: 32, tipo: 'ondas' }];

	// ---------- pintura pixel a pixel (as mesmas ferramentas das cenas) ----------
	var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return (v + 0.5) / 16; });
	function ruido(x, y) { var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
	var CORES = {};
	function rgb(h) { var v = CORES[h]; if (v === undefined) { var n = parseInt(h.slice(1), 16); v = CORES[h] = (255 << 24 | (n & 255) << 16 | ((n >> 8) & 255) << 8 | (n >> 16)) >>> 0; } return v; }
	function rampa(cores, t, x, y) {
		var n = cores.length - 1, v = Math.max(0, Math.min(n, t * n)), i = Math.floor(v);
		if (i >= n) return cores[n];
		return v - i > BAYER[(Math.round(x) & 3) + ((Math.round(y) & 3) << 2)] ? cores[i + 1] : cores[i];
	}
	var buf, BW, BH, DX;
	function px(x, y, c) { x = Math.round(x + DX); y = Math.round(y); if (x < 0 || y < 0 || x >= BW || y >= BH || !c) return; buf[y * BW + x] = rgb(c); }
	function ret(x, y, w, h, c) {
		var x0 = Math.round(x + DX), y0 = Math.round(y), x1 = x0 + Math.round(w), y1 = y0 + Math.round(h);
		for (var j = Math.max(0, y0); j < Math.min(BH, y1); j++) for (var i = Math.max(0, x0); i < Math.min(BW, x1); i++) {
			var k = typeof c === 'function' ? c(i - DX, j) : c;
			if (k) buf[j * BW + i] = rgb(k);
		}
	}
	function mistura(x, y, h, a) {
		x = Math.round(x + DX); y = Math.round(y); if (x < 0 || y < 0 || x >= BW || y >= BH || a <= 0) return;
		a = Math.min(1, a);
		var k = y * BW + x, o = buf[k], n = rgb(h);
		if (!(o >>> 24)) return;
		var r = (o & 255) * (1 - a) + (n & 255) * a, g = ((o >> 8) & 255) * (1 - a) + ((n >> 8) & 255) * a, b = ((o >> 16) & 255) * (1 - a) + ((n >> 16) & 255) * a;
		buf[k] = (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
	}
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
	var F3 = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', I: '111010010010111', N: '110101101101101', O: '010101101101010', R: '110101110101101', X: '101101010101101', P: '110101110100100', 0: '111101101101111', 1: '010110010010111', '-': '000000111000000', '·': '000000010000000' };
	function letras(s, x, y, c, centro) {
		if (centro) x = Math.round(x - (s.length * 4 - 1) / 2);
		for (var n = 0; n < s.length; n++, x += 4) { var g = F3[s[n]]; if (!g) continue; for (var i = 0; i < 15; i++) if (g[i] === '1') px(x + (i % 3), y + Math.floor(i / 3), c); }
	}

	// uma caixa de equipamento na parede (só onde não é vidro): borda chanfrada, o miolo e o conteúdo
	// ('chaves' = fileiras de interruptores, 'luzes' = grade de luzinhas, 'tela' = moldura verde acesa
	// como na Falcon, 'gaveta' = grade de ventilação); as luzinhas vão para a lista de quem pisca
	function caixa(x, y, w, h, tipo, luzes) {
		function fora(cor) { return function (xx, yy) { return noVidro(xx, yy) ? null : cor; }; }
		ret(x, y, w, h, fora('#14151a'));
		ret(x + 1, y + 1, w - 2, h - 2, function (xx, yy) { return noVidro(xx, yy) ? null : rampa(['#4a4e5a', '#3e424c', '#33363f'], (yy - y) / h * 0.7 + (xx - x) / w * 0.3, xx, yy); });
		ret(x + 1, y + 1, w - 2, 1, fora('#6a6e7a'));
		if (tipo === 'chaves') {
			for (var cy = y + 4; cy < y + h - 5; cy += 7) for (var cx = x + 3; cx < x + w - 3; cx += 5) {
				if (noVidro(cx, cy)) continue;
				ret(cx, cy + 2, 3, 3, '#0e0f12'); ret(cx + 1, cy, 1, 3, '#c8ccd6'); px(cx + 1, cy, '#ffffff');
			}
		} else if (tipo === 'luzes') {
			for (cy = y + 3; cy < y + h - 3; cy += 4) for (cx = x + 3; cx < x + w - 3; cx += 4) {
				if (noVidro(cx, cy)) continue;
				ret(cx, cy, 2, 2, '#1a1c22'); luzes.push({ x: cx, y: cy });
			}
		} else if (tipo === 'tela') {
			ret(x + 3, y + 3, w - 6, h - 6, fora('#0a1410'));
			for (var b = 0; b < w - 6; b++) { if (!noVidro(x + 3 + b, y + 3)) { px(x + 3 + b, y + 3, '#4aff8a'); px(x + 3 + b, y + h - 4, '#4aff8a'); } }
			for (b = 0; b < h - 6; b++) { if (!noVidro(x + 3, y + 3 + b)) { px(x + 3, y + 3 + b, '#4aff8a'); px(x + w - 4, y + 3 + b, '#4aff8a'); } }
			if (!noVidro(x + w / 2, y + h / 2)) { ret(x + 6, y + 6, 3, 3, '#ff9a3a'); luzes.push({ x: x + w - 9, y: y + h - 8 }); }
		} else {
			for (cy = y + 3; cy < y + h - 3; cy += 3) ret(x + 3, cy, w - 6, 1, fora('#1a1c22'));
		}
	}
	// a mangueira sanfonada: anéis claros e escuros alternados seguindo um caminho
	function mangueira(pontos, grossura) {
		for (var i = 0; i < pontos.length - 1; i++) {
			var a = pontos[i], b = pontos[i + 1], n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]));
			for (var k = 0; k <= n; k++) {
				var x = a[0] + (b[0] - a[0]) * k / n, y = a[1] + (b[1] - a[1]) * k / n, anel = Math.floor((i * 100 + k) / 2) % 2;
				for (var g = 0; g < grossura; g++) px(x, y + g, g === 0 ? (anel ? '#8a8e98' : '#5a5e6a') : g === grossura - 1 ? '#121318' : (anel ? '#4a4e58' : '#2e3038'));
			}
		}
	}

	function moldura(W, H, OX) {
		var tela = document.createElement('canvas'); tela.width = W; tela.height = H;
		var g = tela.getContext('2d'), img = g.createImageData(W, H);
		buf = new Uint32Array(img.data.buffer); BW = W; BH = H; DX = OX;
		var luzes = [];
		// 1. a armação do para-brisa e as paredes de metal escuro, com placas acolchoadas em leque
		for (var y = 0; y < H; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
			var h = naHaste(x, y), dentro = noVidro(x, y);
			if (dentro && h <= 0) continue;
			if (dentro) { px(x, y, rampa(['#121318', '#24262e', '#3a3d47', '#585c67', '#868b96', '#b4b9c2'], Math.min(1, h) + (ruido(x >> 1, y >> 1) - 0.5) * 0.06, x, y)); continue; }
			var bx = (x - 240) / (240 + OX), vin = Math.min(1, bx * bx * 0.8 + Math.abs(y - 90) / H * 0.5);
			var a = Math.atan2(y - VIDRO.cy, x - VIDRO.cx) * 12, nerv = Math.abs((a % 1 + 1) % 1 - 0.5) > 0.44;
			px(x, y, nerv ? rampa(['#2a2c32', '#1e2026', '#141519'], vin, x, y) : rampa(['#5a5e68', '#4a4e58', '#3c3f48', '#2e3038', '#202228'], vin * 0.9 + (ruido(x >> 3, y >> 3) - 0.5) * 0.12, x, y));
		}
		// 2. o aro do vidro: um filete escuro e um brilho frio por dentro
		for (var t = 0; t < Math.PI * 2; t += 0.002) {
			var ex = VIDRO.cx + Math.cos(t) * (VIDRO.rx + 1), ey = VIDRO.cy + Math.sin(t) * (VIDRO.ry + 1);
			if (ey < VIDRO.topo || ey > VIDRO.base) continue;
			px(ex, ey, '#0e0f12'); px(ex + Math.cos(t), ey + Math.sin(t), '#1a1c22'); px(ex + Math.cos(t) * 2, ey + Math.sin(t) * 2, '#8a90a0');
		}
		// 3. o teto em arco: uma faixa larga de painéis com interruptores, luzes e dois relógios redondos
		ret(-OX, 0, W, 14, function (xx, yy) { return rampa(['#3a3d46', '#2c2e36', '#202228'], yy / 14, xx, yy); });
		ret(-OX, 13, W, 1, '#0e0f12'); ret(-OX, 14, W, 1, '#5a5e6a');
		for (var s = -OX + 6; s < NUCLEO + OX - 6; s += 8) {
			if (s > 110 && s < 370) { ret(s, 3, 4, 5, '#0e0f12'); ret(s + 1, 4, 2, 2, '#c8ccd6'); luzes.push({ x: s + 1, y: 10 }); }
			else { ret(s, 2, 6, 9, '#14151a'); ret(s + 2, 3, 1, 4, '#c8ccd6'); px(s + 2, 3, '#ffffff'); }
		}
		[[82, 7], [398, 7]].forEach(function (r) { elip(r[0], r[1], 5, 5, '#0e0f12'); elip(r[0], r[1], 4, 4, '#1a2420'); linha(r[0], r[1], r[0] + 3, r[1] - 2, '#ffd36a'); px(r[0], r[1], '#ffffff'); });
		// 4. as paredes dos lados, apertadas e cheias de caixas: interruptores, luzinhas, as telas de
		// moldura verde e as grades (só aparecem fora do vidro, nos cantos e nas laterais)
		var ESQ = [[-OX + 2, 16, 40 + OX, 26, 'luzes'], [-OX + 2, 44, 30 + OX, 30, 'tela'], [-OX + 2, 76, 24 + OX, 40, 'chaves'], [-OX + 2, 118, 30 + OX, 30, 'luzes'], [-OX + 2, 150, 44 + OX, 18, 'gaveta'],
			[46, 16, 40, 14, 'chaves']];
		var DIR = [[NUCLEO - 44, 16, 42 + OX, 24, 'chaves'], [NUCLEO - 32, 42, 30 + OX, 34, 'luzes'], [NUCLEO - 26, 78, 24 + OX, 36, 'tela'], [NUCLEO - 32, 116, 30 + OX, 32, 'chaves'], [NUCLEO - 46, 150, 44 + OX, 18, 'luzes'],
			[394, 16, 40, 14, 'luzes']];
		ESQ.concat(DIR).forEach(function (c) { caixa(c[0], c[1], c[2], c[3], c[4], luzes); });
		// 5. as mangueiras sanfonadas: uma acompanhando a moldura do vidro de cada lado, outra pela base
		[-1, 1].forEach(function (l) {
			var pts = [];
			for (var k = 0; k <= 12; k++) { var ang = Math.PI / 2 + l * (0.55 + k / 12 * 1.1); pts.push([VIDRO.cx + Math.cos(ang) * (VIDRO.rx + 6), VIDRO.cy + Math.sin(ang) * (VIDRO.ry + 6)]); }
			mangueira(pts.filter(function (p) { return p[1] > VIDRO.topo + 4 && p[1] < VIDRO.base; }), 3);
		});
		for (var mx2 = -OX; mx2 < NUCLEO + OX; mx2++) {
			var seg = ((mx2 + OX) % 60) / 60, my2 = 150 + Math.sin(seg * Math.PI) * 3 + Math.abs(mx2 - 240) * 0.02, anel = (mx2 & 1) === 0;
			px(mx2, my2, anel ? '#6a6e7a' : '#3a3d46'); px(mx2, my2 + 1, anel ? '#3a3d46' : '#22242a'); px(mx2, my2 + 2, '#14151a');
			if ((mx2 + OX) % 60 === 0) { ret(mx2 - 1, my2 - 2, 3, 6, '#8a8e98'); px(mx2, my2 - 2, '#d0d4dc'); }
		}
		// 6. o painel: o tampo em perspectiva cheio de botões coloridos, e a frente escura com os visores
		poli([[-OX - 2, 198], [70, 156], [410, 156], [NUCLEO + OX + 2, 198], [NUCLEO + OX + 2, H], [-OX - 2, H]], function (xx, yy) { return rampa(['#34373f', '#2a2c34', '#22242a', '#1a1b20', '#121216'], (yy - 156) / 114 + (ruido(xx >> 2, yy >> 2) - 0.5) * 0.06, xx, yy); });
		poli([[96, 154], [384, 154], [452, 176], [28, 176]], function (xx, yy) { return rampa(['#5a5e6a', '#4a4e5a', '#3e424c', '#33363f'], (yy - 154) / 22 + (ruido(xx >> 2, yy >> 2) - 0.5) * 0.06, xx, yy); });
		for (var pz = 1; pz < 8; pz++) linha(96 + pz * 36, 154, 28 + pz * 53, 176, '#3a3d46');
		linha(96, 154, 384, 154, '#8a8e98'); linha(28, 176, 452, 176, '#0e0f12'); linha(28, 177, 452, 177, '#3a3d46');
		// os botões quadrados do tampo (vermelhos, laranja, brancos), como no painel da Falcon
		var BOT = ['#c83a3a', '#e8843a', '#e8e4d8', '#3a7ac8', '#e8c040'];
		for (var by2 = 166; by2 <= 171; by2 += 5) for (var bx2 = 60 + (by2 - 166) * 2; bx2 < 420 - (by2 - 166) * 2; bx2 += 11) { if (bx2 > 196 && bx2 < 284) continue; ret(bx2, by2, 4, 3, '#0e0f12'); ret(bx2, by2, 4, 2, BOT[Math.floor(ruido(bx2, by2) * BOT.length)]); }
		TELAS.forEach(function (q) {
			ret(q.x - 4, q.y - 4, q.w + 8, q.h + 8, '#0c0d10'); ret(q.x - 4, q.y - 4, q.w + 8, 1, '#5a5e6a'); ret(q.x - 4, q.y + q.h + 3, q.w + 8, 1, '#050506');
			ret(q.x, q.y, q.w, q.h, '#060c0a');
			[[-2, -2], [q.w + 1, -2], [-2, q.h + 1], [q.w + 1, q.h + 1]].forEach(function (p) { px(q.x + p[0], q.y + p[1], '#3a3e48'); });
		});
		for (var yy2 = 222; yy2 <= 234; yy2 += 6) for (var xx2 = 54; xx2 < 428; xx2 += 7) { if (xx2 > 216 && xx2 < 262) continue; ret(xx2 - 1, yy2 - 1, 4, 4, '#0a0a0c'); ret(xx2, yy2, 2, 2, '#2a2c32'); } // (o meio fica livre para o suporte das alavancas)
		for (xx2 = 84; xx2 < 400; xx2 += 9) { ret(xx2 - 1, 161, 4, 4, '#2a2c34'); ret(xx2, 162, 2, 2, '#3a3d46'); }
		for (xx2 = 60; xx2 < 420; xx2 += 10) { if (xx2 > 200 && xx2 < 280) continue; ret(xx2, 246, 4, 7, '#0e0e12'); ret(xx2 + 1, 243, 2, 5, '#a8acb8'); px(xx2 + 1, 243, '#ffffff'); }
		// 7. o manche do piloto
		ret(148, 236, 8, 34, function (xx, yy) { return rampa(['#5a5e6a', '#3a3d46', '#22242a'], (xx - 148) / 8, xx, yy); });
		ret(112, 232, 80, 6, function (xx, yy) { return rampa(['#6a6e7a', '#3a3d46', '#1e2026'], (yy - 232) / 6, xx, yy); });
		[112, 184].forEach(function (gx) { ret(gx, 214, 8, 20, function (xx, yy) { return rampa(['#4a3a2e', '#3a2c22', '#2a1e16'], (xx - gx) / 8, xx, yy); }); ret(gx, 214, 8, 2, '#6a5442'); });
		px(116, 216, '#ff4a4a'); px(188, 216, '#ffd36a');
		// 8. as poltronas de couro claro com a moldura de metal: a do copiloto à direita (o encosto
		// retangular com os gomos e o apoio de cabeça) e o braço da nossa, embaixo à esquerda
		// (a do copiloto, vista de costas como na foto: o encosto alto de couro claro com o topo
		// arredondado, a costura em volta, e o painel cinza embutido no meio, com a moldura de metal)
		function couro(xx, yy, x0, w) { var u = (xx - x0) / w; return rampa(['#ecd0a4', '#d8b482', '#c09864', '#a07a4a', '#7a5a36', '#54402a'], 0.15 + Math.max(0, u - 0.25) * 0.9 + Math.max(0, 0.12 - u) * 1.5, xx, yy); }
		var SX = 400, SY = 166, SW = 78, SR = 16; // o encosto: canto de cima à esquerda, largura e o raio do topo
		ret(SX, SY, SW, H - SY, function (xx, yy) {
			var dx = Math.max(0, SX + SR - xx, xx - (SX + SW - SR)), dy = Math.max(0, SY + SR - yy);
			if (dx * dx + dy * dy > SR * SR) return null;
			var borda = dx * dx + dy * dy > (SR - 2) * (SR - 2) || xx < SX + 2 || xx > SX + SW - 3;
			return borda ? (xx < SX + SW / 2 ? '#f4e0bc' : '#6a4e30') : couro(xx, yy, SX, SW);
		});
		for (var cs = 0; cs < SW - 10; cs += 2) { px(SX + 5 + cs, SY + 5 + (cs < SR || cs > SW - 10 - SR ? Math.max(0, SR - Math.min(cs, SW - 10 - cs)) * 0.5 : 0), '#a8804e'); } // a costura de cima
		ret(SX + 16, SY + 24, SW - 32, 58, function (xx, yy) { return rampa(['#9a9ea8', '#7a7e88', '#5a5e68'], (xx - SX - 16) / (SW - 32), xx, yy); }); // a moldura de metal do painel
		ret(SX + 19, SY + 27, SW - 38, 52, function (xx, yy) { return rampa(['#5a5e68', '#4a4e58', '#3a3d46', '#2e3038'], (yy - SY - 27) / 52 * 0.5 + (xx - SX - 19) / (SW - 38) * 0.5, xx, yy); }); // o painel cinza
		ret(SX + 19, SY + 27, SW - 38, 1, '#22242a'); ret(SX + 22, SY + 34, SW - 44, 3, '#1a1c22'); ret(SX + 22, SY + 34, SW - 44, 1, '#8a8e98'); // a alça
		for (var gm = 0; gm < 3; gm++) linha(SX + 6, SY + 30 + gm * 22, SX + 13, SY + 30 + gm * 22, '#b08a58'); // os gomos dos lados
		for (gm = 0; gm < 3; gm++) linha(SX + SW - 13, SY + 30 + gm * 22, SX + SW - 6, SY + 30 + gm * 22, '#6a4e30');
		// o braço da nossa poltrona, embaixo à esquerda: o estofado de couro e a borda de metal por cima
		poli([[-OX - 2, 222], [30, 228], [44, 270], [-OX - 2, 270]], function (xx, yy) { return rampa(['#ecd0a4', '#d8b482', '#c09864', '#a07a4a', '#7a5a36'], 0.2 + (yy - 222) / 48 * 0.5 + Math.max(0, xx - 20) / 24 * 0.3, xx, yy); });
		linha(-OX, 221, 30, 227, '#c8ccd6'); linha(-OX, 222, 30, 228, '#8a8e98'); linha(30, 228, 44, 270, '#5a4028');
		for (var cb = 0; cb < 4; cb++) linha(-OX + 4, 234 + cb * 9, 28 + cb * 3, 236 + cb * 9, '#b08a58'); // os gomos
		// 9. a plaquinha do fabricante (só o nome da nave) e a assinatura da autora gravada bem de leve no
		// painel escuro, embaixo à esquerda, para quem reparar
		ret(324, 256, 36, 10, '#8a6a2a'); ret(325, 257, 34, 8, function (xx, yy) { return rampa(['#f0d48a', '#d8b460', '#b8923e'], (yy - 257) / 8, xx, yy); });
		letras('PX-01', 342, 259, '#4a3410', true);
		letras('BIANCA CARDADOR', 92, 262, '#26282f', true);
		// 10. a profundidade: o que está perto de nós fica na penumbra; o tampo junto do vidro pega a luz de fora
		for (var vy = 0; vy < H; vy++) for (var vx = -OX; vx < NUCLEO + OX; vx++) {
			if (!buf[vy * BW + vx + DX]) continue;
			var lx3 = Math.abs(vx - 240) / (240 + OX), sombra = lx3 * lx3 * 0.55 + Math.max(0, (vy - 196) / 74) * 0.45 * (0.4 + lx3);
			if (sombra > 0.02) mistura(vx, vy, '#05060a', Math.min(0.7, sombra));
			if (vy > 152 && vy < 178 && vx > 60 && vx < 420) mistura(vx, vy, '#ffe2c0', (1 - (vy - 152) / 26) * 0.1);
		}
		g.putImageData(img, 0, 0);
		return { canvas: tela, luzes: luzes };
	}
	// as luzinhas do painel não acendem em cima do suporte das alavancas (no meio, embaixo)
	function livreDasAlavancas(l) { return !(l.y >= 216 && l.x > 216 && l.x < 262); }
	window.CabineFalcon = { VIDRO: VIDRO, noVidro: noVidro, naHaste: naHaste, TELAS: TELAS, moldura: moldura, livreDasAlavancas: livreDasAlavancas };
})();
