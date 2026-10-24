// A nave da viagem: a Millennium Falcon em pixel art.
// Fica num arquivo só dela porque aparece na decolagem (viagem.js), em todas as transições
// com as estrelas (transicao.js) e na foto da carteira de piloto (passaporte.js).
//
// A nave é montada em 3D (o disco, as duas garras da frente, a cabine em tubo, a antena
// parabólica, a torre de canhão, os anéis de acoplamento, as saídas de ar e a faixa dos
// motores), iluminada, e cada ponto vira um pixel. Depois as cores são reduzidas a poucos
// tons com pontilhado e o contorno fica escuro, para continuar com cara de pixel art.
//
// Uso: Nave.construir(larguraDaTela) e, a cada quadro, Nave.desenhar(buf, W, H, t, tremor, forca).
// Nave.renderizarModelo(opcoes) desenha a nave de qualquer ângulo (a carteira de piloto usa).
(function () {
	function cor(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
	function sorte(x, y, s) {
		var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + s) | 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	}
	function normal3(a, b, c) { var m = Math.sqrt(a * a + b * b + c * c) || 1; return [a / m, b / m, c / m]; }

	// ---------- O modelo (coordenadas da nave: x para a frente, y para bombordo, z para cima) ----------
	// o disco inteiro: a peça do meio, entre as garras, vai até a borda da frente (o vão de carga só começa depois dela)
	function noDisco(x, y) { return x * x + y * y <= 1; }
	function naGarra(x, y) {
		var ay = Math.abs(y);
		if (x < 0.4 || x > 1.55 || ay < 0.12) return false;
		return ay <= 0.42 - Math.max(0, x - 1.32) * 1.25;
	}
	function altura(x, y) {
		var r = Math.sqrt(x * x + y * y), h = -1;
		if (noDisco(x, y)) {
			h = 0.055 + 0.07 * (1 - r * r);
			if (r < 0.24) h += 0.012;                                          // centro elevado
			if (r < 0.08) h += 0.045 * Math.sqrt(1 - (r / 0.08) * (r / 0.08)); // torre de canhão
			if (x > 0.18 && x < 0.98 && Math.abs(y) > 0.17 && Math.abs(y) < 0.31) h += 0.022; // as duas vigas compridas
			if (x > 0.3 && Math.abs(y) < 0.1) h += 0.016;                                      // a peça do meio, entre as garras
		}
		if (naGarra(x, y)) h = Math.max(h, 0.05 + (Math.abs(Math.abs(y) - 0.27) < 0.06 ? 0.012 : 0)); // garras, com uma faixa no meio
		return h;
	}
	// textura do casco: placas em raio, anéis, peças com tons diferentes, ferrugem e saídas de ar
	var SAIDAS = [[-0.45, -0.18], [-0.47, -0.4], [-0.62, -0.08], [-0.65, -0.3], [-0.6, -0.52], [-0.8, -0.2]];
	function textura(x, y) {
		var r = Math.sqrt(x * x + y * y), a = Math.atan2(y, x), extra = 0, t = 0;
		if (noDisco(x, y)) {
			if (r > 0.24 && Math.abs(Math.sin(a * 12)) < 0.06) extra -= 0.3;                  // linhas das placas
			if (Math.abs(r - 0.24) < 0.008 || Math.abs(r - 0.5) < 0.008 || Math.abs(r - 0.78) < 0.008 || Math.abs(r - 0.93) < 0.008) extra -= 0.2;
			var ci = Math.floor(a / (Math.PI / 24)), cr = Math.floor(r * 9), sorteio = sorte(ci + 50, cr, 909);
			if (r > 0.25) {
				extra += (sorteio - 0.5) * 0.16;                                              // peças de tons diferentes
				if (sorteio < 0.045 && r > 0.4 && sorte(Math.floor(x * 40), Math.floor(y * 40), 12) < 0.6) t = 1; // um pouco de ferrugem
				var gq = sorte(Math.floor(x * 24), Math.floor(y * 24), 21);                   // pecinhas mais claras ou mais escuras
				if (gq < 0.08) extra -= 0.16; else if (gq > 0.93) extra += 0.1;
			}
			// "trincheira" de carga do lado de bombordo
			if (y > 0.16 && y < 0.3 && x > -0.75 && x < 0.18) { extra -= 0.15; if (sorte(Math.floor(x * 60), Math.floor(y * 60), 3) < 0.3) extra -= 0.2; }
			for (var n = 0; n < SAIDAS.length; n++) {
				var ds = Math.hypot(x - SAIDAS[n][0], y - SAIDAS[n][1]);
				if (ds < 0.085) { extra += ds > 0.066 ? 0.22 : ds > 0.05 ? -0.35 : -0.15 - (ds < 0.025 ? 0.15 : 0); break; }
			}
		} else {
			if (Math.abs(x - 0.75) < 0.006 || Math.abs(x - 1.1) < 0.006) extra -= 0.2;
			if (sorte(Math.floor(x * 30), Math.floor(y * 30), 7) < 0.05) t = 1;
			var gg = sorte(Math.floor(x * 24), Math.floor(y * 24), 23);
			if (gg < 0.1) extra -= 0.16; else if (gg > 0.92) extra += 0.1;
		}
		return [extra, t];
	}

	// ---------- Desenho do modelo de qualquer ângulo ----------
	// o: { L, A (tamanho da imagem), giro (ângulo da nave em volta do eixo vertical, em radianos:
	//      0 = de costas para nós), inclinacao (quanto a câmera olha de cima), esc, ox, oy
	//      (escala e posição do centro da nave), luz: [x, y, z] (direção da luz na tela) }
	// devolve { cores: Uint32Array (0 = vazio), motores: [[x, y, d]] (a faixa azul, d = 0 no meio) }
	var CASCO = ['#22262f', '#2f3540', '#3f4653', '#525a67', '#68717d', '#808a94', '#9aa3aa', '#b5bcbf', '#cfd3d2', '#e6e4df', '#f6ece6'];
	var FERRUGEM = ['#3a2a2a', '#523634', '#6c4540', '#86584f', '#9e6c62', '#b48478'];
	var VIDRO = ['#0e1426', '#1c2a48', '#38507a', '#7fa8d8'];
	var ESCURO = ['#15161e', '#22242f', '#30333f', '#40444f'];
	var MOTOR_BASE = ['#4ab4ff'];
	function hexCor(h) { return cor(parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)); }
	var RAMPAS = [CASCO, FERRUGEM, VIDRO, ESCURO, MOTOR_BASE].map(function (r) { return r.map(hexCor); });
	var CONTORNO = cor(24, 24, 32);

	function renderizarModelo(o) {
		var L = o.L, A = o.A, N = L * A;
		var CA = Math.cos(o.giro + Math.PI / 2), SA = Math.sin(o.giro + Math.PI / 2);
		var FI = o.inclinacao, CF = Math.cos(FI), SF = Math.sin(FI), ESC = o.esc, OX = o.ox, OY = o.oy;
		var LUZ = normal3(o.luz[0], o.luz[1], o.luz[2]), VISTA = [0, -CF, SF], BRILHO = o.brilho || 1;
		var MEIO = normal3(LUZ[0] + VISTA[0], LUZ[1] + VISTA[1], LUZ[2] + VISTA[2]);
		var profundidade = new Float32Array(N).fill(1e9), luz = new Float32Array(N), tinta = new Uint8Array(N), motorD = new Float32Array(N);
		var tem = new Uint8Array(N);
		// passo dos pontos: menos de meio pixel, para não sobrar buraco
		var P = Math.min(0.0045, 0.4 / ESC);

		function ponto(x, y, z, nx, ny, nz, t, brilhoExtra, dMotor) {
			var X = x * CA - y * SA, Y = x * SA + y * CA;
			var sx = Math.round(OX + X * ESC), sy = Math.round(OY - (Y * SF + z * CF) * ESC);
			if (sx < 0 || sy < 0 || sx >= L || sy >= A) return;
			var d = Y * CF - z * SF, k = sy * L + sx;
			if (d >= profundidade[k]) return;
			var n = normal3(nx * CA - ny * SA, nx * SA + ny * CA, nz);
			if (n[0] * VISTA[0] + n[1] * VISTA[1] + n[2] * VISTA[2] < 0) { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }
			var dif = Math.max(0, n[0] * LUZ[0] + n[1] * LUZ[1] + n[2] * LUZ[2]);
			var esp = Math.pow(Math.max(0, n[0] * MEIO[0] + n[1] * MEIO[1] + n[2] * MEIO[2]), 22);
			profundidade[k] = d;
			luz[k] = ((0.34 + 0.6 * dif + esp * 0.25) + (brilhoExtra || 0) * 0.75) * BRILHO;
			tinta[k] = t || 0;
			motorD[k] = dMotor || 0;
			tem[k] = 1;
		}
		var x, y, z, w;
		// 1. tampa de cima
		for (x = -1.02; x <= 1.56; x += P) for (y = -1.02; y <= 1.02; y += P) {
			var h = altura(x, y);
			if (h < 0) continue;
			var hx = altura(x + 0.01, y), hy = altura(x, y + 0.01);
			var tx = textura(x, y);
			ponto(x, y, h, hx < 0 ? 0 : -(hx - h) / 0.01, hy < 0 ? 0 : -(hy - h) / 0.01, 1, tx[1], tx[0]);
		}
		// 2. paredes: a borda do disco (com a faixa dos motores atrás) e as garras
		var passoAng = P * 0.85;
		for (var ang = 0; ang < Math.PI * 2; ang += passoAng) {
			var cx = Math.cos(ang), cy = Math.sin(ang);
			if (cx > 0.4 && Math.abs(cy) >= 0.12 && Math.abs(cy) < 0.42) continue; // ali começam as garras
			var motor = o.motores !== false && cx < -0.5;
			for (z = -0.06; z <= 0.055; z += P * 1.6) {
				if (motor && z > -0.028 && z < 0.032) ponto(cx, cy, z, cx, cy, 0, 4, 0, Math.abs(cy) / 0.87);
				else ponto(cx, cy, z, cx, cy, 0, 0, Math.abs(z) < 0.01 ? -0.12 : 0);
			}
		}
		for (var lado = -1; lado <= 1; lado += 2) {
			for (x = 0.4; x <= 1.55; x += P) {
				var yo = 0.42 - Math.max(0, x - 1.32) * 1.25;
				if (x * x + yo * yo > 1) for (z = -0.05; z <= 0.05; z += P * 1.6) ponto(x, lado * yo, z, x > 1.32 ? 0.6 : 0, lado * 0.8, 0, 0, z > 0.03 ? 0.05 : -0.05);
				// paredes do vão de carga, que só existe na frente da peça do meio
				if (x * x + 0.0144 > 1) for (z = -0.05; z <= 0.05; z += P * 1.6) ponto(x, lado * 0.12, z, 0, -lado, 0, 3, 0);
			}
			for (y = 0.12; y <= 0.15 + 0.01; y += P) for (z = -0.05; z <= 0.05; z += P * 1.6) ponto(1.55, lado * y, z, 1, 0, 0, 0, -0.05);
		}
		// 3. cabine em tubo, do lado de boreste
		var CBY = -1.0, CBZ = 0.02, CBR = 0.085, passoW = Math.min(0.05, P * 10);
		for (x = -0.25; x <= 0.86; x += P) for (w = 0; w < Math.PI * 2; w += passoW) {
			ponto(x, CBY + CBR * Math.cos(w), CBZ + CBR * Math.sin(w), 0, Math.cos(w), Math.sin(w), 0, (Math.abs((x + 0.25) % 0.13) < 0.012) ? -0.18 : 0);
		}
		for (var e = 0; e <= Math.PI / 2; e += passoW) for (w = 0; w < Math.PI * 2; w += passoW) {
			var vidro = e > 0.55 && Math.sin(w) > -0.3;
			ponto(0.86 + 0.1 * Math.sin(e), CBY + CBR * Math.cos(e) * Math.cos(w), CBZ + CBR * Math.cos(e) * Math.sin(w),
				Math.sin(e), Math.cos(e) * Math.cos(w), Math.cos(e) * Math.sin(w), vidro ? 2 : 0, vidro && Math.abs(Math.cos(w * 3)) > 0.9 ? 0.4 : 0);
		}
		for (x = 0.05; x <= 0.4; x += P) for (w = 0; w < Math.PI; w += passoW) {
			var yc = -0.82 - (x - 0.05) * 0.5;
			ponto(x, yc + 0.06 * Math.cos(w), 0.07 + 0.06 * Math.sin(w), 0, Math.cos(w), Math.sin(w), 0, 0);
		}
		// 4. anel de acoplamento (bombordo)
		var AX = -0.08, AR = 0.1;
		for (y = 0.92; y <= 1.1; y += P) for (w = 0; w < Math.PI * 2; w += passoW) ponto(AX + AR * Math.cos(w), y, AR * Math.sin(w), Math.cos(w), 0, Math.sin(w), 0, Math.abs(y - 1.0) < 0.01 ? -0.2 : 0);
		for (var rr = 0; rr <= AR; rr += P) for (w = 0; w < Math.PI * 2; w += passoW * 0.6) {
			ponto(AX + rr * Math.cos(w), 1.1, rr * Math.sin(w), 0, 1, 0, rr < 0.06 ? 3 : 0, rr > 0.085 ? 0.1 : rr > 0.06 ? -0.25 : rr > 0.03 ? -0.05 : -0.35);
		}
		// 5. antena parabólica, perto da frente
		var DX = 0.6, DY = 0.5, base = altura(DX, DY);
		for (z = base; z <= base + 0.12; z += P) for (w = 0; w < Math.PI * 2; w += 0.3) ponto(DX + 0.016 * Math.cos(w), DY + 0.016 * Math.sin(w), z, Math.cos(w), Math.sin(w), 0, 0, -0.1);
		var nd = normal3(0.7, 0.15, 0.7), e1 = normal3(-nd[2], 0, nd[0]), e2 = [nd[1] * e1[2] - nd[2] * e1[1], nd[2] * e1[0] - nd[0] * e1[2], nd[0] * e1[1] - nd[1] * e1[0]];
		for (var rd = 0; rd <= 0.12; rd += P * 0.8) for (w = 0; w < Math.PI * 2; w += passoW * 0.6) {
			var fp = -rd * rd * 1.6;
			ponto(DX + rd * (Math.cos(w) * e1[0] + Math.sin(w) * e2[0]) + nd[0] * fp,
				DY + rd * (Math.cos(w) * e1[1] + Math.sin(w) * e2[1]) + nd[1] * fp,
				base + 0.16 + rd * (Math.cos(w) * e1[2] + Math.sin(w) * e2[2]) + nd[2] * fp,
				nd[0], nd[1], nd[2], 0, rd > 0.11 ? -0.25 : rd < 0.02 ? -0.3 : 0.05);
		}
		// canos da torre de canhão
		var topoTorre = altura(0, 0);
		for (x = 0.04; x <= 0.2; x += P) { ponto(x, 0.025, topoTorre - 0.01, 0, 0, 1, 3, 0.1); ponto(x, -0.025, topoTorre - 0.01, 0, 0, 1, 3, 0.1); }

		// ---- tapa os buraquinhos (pixels vazios cercados de nave, nas quinas das vigas) ----
		for (var volta = 0; volta < 2; volta++) for (y = 1; y < A - 1; y++) for (x = 1; x < L - 1; x++) {
			var kk = y * L + x;
			if (tem[kk]) continue;
			var viz = [kk - 1, kk + 1, kk - L, kk + L].filter(function (v) { return tem[v]; });
			if (viz.length < 3) continue;
			var vz = viz[0];
			tem[kk] = 1; luz[kk] = luz[vz] * 0.85; tinta[kk] = tinta[vz] === 4 ? 0 : tinta[vz]; profundidade[kk] = profundidade[vz];
		}
		// ---- cores, pontilhado e contorno ----
		var cores = new Uint32Array(N), motores = [];
		var B4 = [0, 0.5, 0.75, 0.25];
		for (y = 0; y < A; y++) for (x = 0; x < L; x++) {
			var k = y * L + x;
			if (!tem[k]) continue;
			var borda = x === 0 || y === 0 || x === L - 1 || y === A - 1 || !tem[k - 1] || !tem[k + 1] || !tem[k - L] || !tem[k + L];
			if (borda && tinta[k] !== 4) { cores[k] = CONTORNO; continue; }
			if (tinta[k] === 4) { cores[k] = RAMPAS[4][0]; motores.push([x, y, motorD[k]]); continue; }
			var rampa = RAMPAS[tinta[k]];
			var v = Math.max(0, Math.min(0.999, luz[k] * 0.92 + (B4[(x & 1) + ((y & 1) << 1)] - 0.4) * 0.09));
			cores[k] = rampa[Math.floor(v * rampa.length)];
		}
		return { cores: cores, motores: motores };
	}

	// ---------- A nave das transições: de costas, vista um pouco de cima ----------
	var NAVE_W = 0, NAVE_H = 0, NAVE = null, NAVE_S = 1;
	var MOTOR = [];        // pixels da faixa dos motores (a cor muda a cada quadro)
	var MOTOR_MAPA = null; // para cada pixel da nave: o índice dele em MOTOR, ou -1
	var INCLINACAO = 30 * Math.PI / 180; // quanto olhamos de cima (mais é mais de cima; menos, mais de trás)
	var ultimaLargura = 0;
	function construir(W) {
		var s = W > 560 ? 2 : 1;
		var largura = Math.max(38, Math.min(150, Math.round(W * 0.26 / s))); // pouco mais de 1/4 da largura da tela
		if (largura === ultimaLargura && s === NAVE_S && NAVE) return; // já está pronta nesse tamanho
		ultimaLargura = largura; NAVE_S = s; NAVE_W = largura;
		var esc = (NAVE_W - 4) / 2.25;
		var cima = 1.0 * Math.sin(INCLINACAO) + 0.3 * Math.cos(INCLINACAO) + 0.62 * Math.sin(INCLINACAO); // garras lá na frente + antena
		var baixo = 1.0 * Math.sin(INCLINACAO) + 0.08 * Math.cos(INCLINACAO);                                // borda de trás
		NAVE_H = Math.ceil((cima + baixo) * esc) + 4;
		var r = renderizarModelo({ L: NAVE_W, A: NAVE_H, giro: 0, inclinacao: INCLINACAO, esc: esc, ox: NAVE_W / 2, oy: 2 + cima * esc, luz: [-0.6, 0.3, 0.55], brilho: 0.84 });
		NAVE = r.cores;
		MOTOR = r.motores;
		MOTOR_MAPA = new Int32Array(NAVE_W * NAVE_H).fill(-1);
		MOTOR.forEach(function (p, n) { MOTOR_MAPA[p[1] * NAVE_W + p[0]] = n; });
	}
	var MOTOR_CORES = [cor(255, 255, 255), cor(214, 246, 255), cor(150, 228, 255), cor(95, 200, 255)];

	// opcoes (opcional): escala (1 = tamanho normal; menor = a nave se afastando),
	// centroX e centroY (posição do centro da nave, de 0 a 1; sem isso ela fica no meio, embaixo)
	function desenhar(buf, W, H, t, tremor, forca, opcoes) {
		if (!NAVE) return;
		var escala = opcoes && opcoes.escala !== undefined ? opcoes.escala : 1;
		if (escala <= 0.02) return;
		var s = NAVE_S * escala; // tamanho de cada pixel da nave na tela (pode ser fracionário)
		var largura = Math.max(1, Math.round(NAVE_W * s)), altura = Math.max(1, Math.round(NAVE_H * s));
		var centroY = (opcoes && opcoes.centroY !== undefined ? opcoes.centroY : 0.66) * H;
		var centroX = (opcoes && opcoes.centroX !== undefined ? opcoes.centroX : 0.5) * W;
		var x0 = Math.round(centroX - largura / 2 + Math.sin(t * 0.7) * 2 * escala + (tremor ? (Math.random() * 2 - 1) * tremor : 0));
		var y0 = Math.round(centroY - altura / 2 + Math.sin(t * 1.3) * 1.5 * escala + (tremor ? (Math.random() * 2 - 1) * tremor : 0));

		// brilho azul dos motores (pontilhado)
		var raio = (2.2 + forca * 3 + Math.sin(t * 18) * 0.3) * s * Math.max(1, NAVE_W / 90);
		var passo = Math.max(4, Math.round(raio * 0.8 / Math.max(0.2, escala)));
		if (raio >= 1) for (var m = 0; m < MOTOR.length; m += passo) {
			var ex = x0 + (MOTOR[m][0] + 0.5) * s, ey = y0 + (MOTOR[m][1] + 1) * s;
			for (var y = -raio; y <= raio; y++) for (var x = -raio; x <= raio; x++) {
				var d = Math.sqrt(x * x + y * y) / raio;
				if (d > 1) continue;
				var gx = Math.round(ex + x), gy = Math.round(ey + y);
				if (gx < 0 || gy < 0 || gx >= W || gy >= H) continue;
				if (d > 0.5 && (gx + gy) % 2) continue;
				var k = (1 - d) * (0.14 + forca * 0.22);
				var i = gy * W + gx, c = buf[i];
				buf[i] = cor(Math.min(255, (c & 255) + 95 * k), Math.min(255, ((c >> 8) & 255) + 200 * k), Math.min(255, ((c >> 16) & 255) + 255 * k));
			}
		}
		// a nave, pixel a pixel na tela (cada pixel da tela pega o pixel da nave mais próximo)
		var q = (t * 14) | 0;
		for (var dy = 0; dy < altura; dy++) {
			var py = y0 + dy;
			if (py < 0 || py >= H) continue;
			var j = Math.min(NAVE_H - 1, (dy / s) | 0);
			for (var dx = 0; dx < largura; dx++) {
				var px = x0 + dx;
				if (px < 0 || px >= W) continue;
				var i2 = Math.min(NAVE_W - 1, (dx / s) | 0), fonte = j * NAVE_W + i2;
				var c2 = NAVE[fonte];
				// faixa dos motores piscando (mais branca no meio)
				var mi = MOTOR_MAPA[fonte];
				if (mi >= 0) {
					var p = MOTOR[mi];
					var nivel = Math.min(3, Math.floor(p[2] * 3 + ((q + p[0]) % 3 === 0 ? 1 : 0) - forca));
					c2 = MOTOR_CORES[Math.max(0, nivel)];
				}
				if (c2) buf[py * W + px] = c2;
			}
		}
	}
	function tamanho() { return { largura: NAVE_W * NAVE_S, altura: NAVE_H * NAVE_S }; }
	window.Nave = { construir: construir, desenhar: desenhar, tamanho: tamanho, renderizarModelo: renderizarModelo };
})();
