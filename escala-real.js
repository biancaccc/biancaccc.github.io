// Página "Escala real": animações em pixel art com tamanhos e distâncias de verdade.
//  - heroi: a beirada do Sol, a Terra e Júpiter na mesma escala;
//  - tamanhos: a beirada do Sol e os oito planetas enfileirados;
//  - terra-lua: as 30 Terras entre a Terra e a Lua, e os outros planetas no mesmo espaço;
//  - luas: cada planeta com as suas luas, visto de cima, em escala (as luas giram devagar e param com o mouse);
//  - aneis: os anéis de Saturno girando até ficar de lado;
//  - luz: um raio de luz saindo do Sol, com os planetas nas distâncias de verdade;
//  - viagem: uma faixa em que a Lua tem 1 pixel, do Sol a Netuno.
// Todos os números são reais (NASA, diâmetros médios e distâncias médias).
(function () {
	var T = window.T || function (pt) { return pt; };
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var EN = window.IDIOMA === 'en';
	var LOCALE = EN ? 'en-US' : 'pt-BR';
	function num(n, casas) { return n.toLocaleString(LOCALE, { minimumFractionDigits: casas || 0, maximumFractionDigits: casas || 0 }); }

	/* diâmetro médio (km), distância média do Sol (milhões de km), cor do pontinho */
	var PLANETAS = [
		{ id: 'mercurio', nome: T('Mercúrio', 'Mercury'), d: 4879, a: 57.91, cor: '#b7aea3' },
		{ id: 'venus', nome: T('Vênus', 'Venus'), d: 12104, a: 108.21, cor: '#efcf91' },
		{ id: 'terra', nome: T('Terra', 'Earth'), d: 12742, a: 149.6, cor: '#5c9cf0' },
		{ id: 'marte', nome: T('Marte', 'Mars'), d: 6779, a: 227.92, cor: '#de6b3e' },
		{ id: 'jupiter', nome: T('Júpiter', 'Jupiter'), d: 139820, a: 778.57, cor: '#dcb98d' },
		{ id: 'saturno', nome: T('Saturno', 'Saturn'), d: 116460, a: 1433.53, cor: '#ead596' },
		{ id: 'urano', nome: T('Urano', 'Uranus'), d: 50724, a: 2872.46, cor: '#a6e8ea' },
		{ id: 'netuno', nome: T('Netuno', 'Neptune'), d: 49244, a: 4495.06, cor: '#5579ea' }
	];
	var KM_SOL = 1392700, KM_TERRA = 12742, KM_LUA = 3474, KM_TERRA_LUA = 384400, LUZ = 299792.458;
	var SAT_GLOBO = 49 / 95; /* largura do globo na arte de Saturno (o resto são os anéis) */

	var SPR = {};
	function sprite(id) {
		if (!SPR[id]) { SPR[id] = new Image(); SPR[id].src = 'pixel/' + id + '.png'; }
		return SPR[id];
	}
	PLANETAS.forEach(function (p) { sprite(p.id); });
	sprite('sol');

	/* ---------- ajudantes de pintura ---------- */
	function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
	function hash(x, y) {
		var h = (x * 374761393 + y * 668265263) | 0;
		h = (h ^ (h >>> 13)) * 1274126177 | 0;
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	}
	function ruido(x, y) {
		var xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
		fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
		var a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
		return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
	}
	/* rampa de cores do Sol, do vermelho da borda ao branco-amarelo do meio */
	var RAMPA_SOL = [[120, 24, 8], [196, 62, 12], [238, 116, 24], [255, 170, 48], [255, 214, 104], [255, 244, 196]];
	function corRampa(r, v) {
		v = Math.max(0, Math.min(0.9999, v)) * (r.length - 1);
		var i = Math.floor(v), f = v - i, a = r[i], b = r[i + 1];
		return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
	}
	/* o Sol pixel a pixel: granulação mexendo, borda mais escura e uma coroa suave em volta */
	function pintarSol(dados, L, A, cx, cy, R, t, xMax) {
		var d = dados.data;
		for (var y = 0; y < A; y++) {
			for (var x = 0; x < Math.min(L, xMax); x++) {
				var dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.sqrt(dx * dx + dy * dy), i = (y * L + x) * 4;
				if (r < R) {
					var mu = Math.sqrt(1 - (r * r) / (R * R));
					var g = ruido(x / 2.6 + t * 0.35, y / 2.6) * 0.6 + ruido(x / 7 - t * 0.12, y / 7 + 9) * 0.4;
					var v = 0.18 + 0.62 * Math.pow(mu, 0.45) + (g - 0.5) * 0.34;
					var c = corRampa(RAMPA_SOL, v);
					d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255;
				} else {
					var k = Math.exp(-(r - R) / (R * 0.06)) * (0.75 + 0.25 * ruido(Math.atan2(dy, dx) * 9, t * 0.5));
					if (k > 0.02) {
						d[i] = Math.min(255, d[i] + 255 * k); d[i + 1] = Math.min(255, d[i + 1] + 130 * k); d[i + 2] = Math.min(255, d[i + 2] + 40 * k * 0.5);
						d[i + 3] = 255;
					}
				}
			}
		}
	}
	/* fundo de estrelas que piscam devagar */
	function estrelas(dados, L, A, t, semente, n) {
		var d = dados.data;
		for (var i = 0; i < d.length; i += 4) { d[i] = 5; d[i + 1] = 3; d[i + 2] = 14; d[i + 3] = 255; }
		for (var s = 0; s < n; s++) {
			var x = Math.floor(hash(s, semente) * L), y = Math.floor(hash(semente, s + 7) * A);
			var b = 70 + 150 * hash(s, s + semente), pisca = 0.55 + 0.45 * Math.sin(t * (0.6 + hash(s, 3) * 1.6) + s);
			var j = (y * L + x) * 4, tom = hash(s, 11);
			d[j] = b * pisca * (tom > 0.7 ? 1 : 0.85); d[j + 1] = b * pisca * 0.9; d[j + 2] = b * pisca * (tom < 0.3 ? 0.8 : 1);
		}
	}
	/* um planetinha pequeno demais para a arte: círculo com lado iluminado */
	function bolinha(ctx, x, y, diam, cor, luzX) {
		var r = diam / 2, c = rgb(cor);
		if (r < 0.9) { ctx.fillStyle = cor; ctx.fillRect(Math.round(x - 0.5), Math.round(y - 0.5), 1, 1); return; }
		for (var yy = Math.floor(y - r); yy <= Math.ceil(y + r); yy++) {
			for (var xx = Math.floor(x - r); xx <= Math.ceil(x + r); xx++) {
				var dx = xx + 0.5 - x, dy = yy + 0.5 - y;
				if (dx * dx + dy * dy > r * r) continue;
				var luz = 0.55 + 0.45 * ((luzX || -1) * -dx / r);
				ctx.fillStyle = 'rgb(' + Math.round(c[0] * luz) + ',' + Math.round(c[1] * luz) + ',' + Math.round(c[2] * luz) + ')';
				ctx.fillRect(xx, yy, 1, 1);
			}
		}
	}
	/* a arte da Bianca, reduzida (com média das cores, para não virar borrão) */
	function arte(ctx, id, x, y, diam) {
		var img = sprite(id);
		if (!img.complete || !img.naturalWidth) return false;
		var larg = diam, alt = diam * img.naturalHeight / img.naturalWidth;
		if (id === 'saturno') { larg = diam / SAT_GLOBO; alt = larg * img.naturalHeight / img.naturalWidth; }
		ctx.imageSmoothingEnabled = true;
		ctx.imageSmoothingQuality = 'high';
		ctx.drawImage(img, Math.round(x - larg / 2), Math.round(y - alt / 2), Math.round(larg), Math.round(alt));
		ctx.imageSmoothingEnabled = false;
		return true;
	}
	function planeta(ctx, p, x, y, diam) {
		if (diam < 9 || !arte(ctx, p.id, x, y, diam)) bolinha(ctx, x, y, diam, p.cor);
	}
	function texto(ctx, s, x, y, cor, alinhar) {
		ctx.font = '8px Silkscreen, monospace';
		ctx.textAlign = alinhar || 'left';
		ctx.textBaseline = 'top';
		ctx.fillStyle = 'rgba(5,3,12,0.8)';
		ctx.fillText(s, x + 1, y + 1);
		ctx.fillStyle = cor || '#e8e2ff';
		ctx.fillText(s, x, y);
	}
	function seta(ctx, x, y, cor) {
		ctx.fillStyle = cor;
		for (var i = 0; i < 4; i++) ctx.fillRect(Math.round(x) - 3 + i, Math.round(y) + i, 7 - 2 * i, 1);
		ctx.fillRect(Math.round(x) - 1, Math.round(y) - 4, 3, 4);
	}

	/* ---------- o laço de cada animação ---------- */
	var CENAS = {};
	function animar(tela) {
		var nome = tela.getAttribute('data-escala'), cena = CENAS[nome];
		if (!cena) return;
		tela.width = cena.L; tela.height = cena.A;
		var ctx = tela.getContext('2d'), dados = ctx.createImageData(cena.L, cena.A);
		ctx.imageSmoothingEnabled = false;
		var figura = tela.closest('figure'), hud = null;
		if (figura && figura.querySelector('[data-hud]')) hud = { ano: figura.querySelector('[data-hud="ano"]'), estacao: figura.querySelector('[data-hud="estacao"]') };
		var quadro = cena.criar(ctx, dados, hud);
		var tempo = calmo ? (cena.parado || 0) : 0, tocando = !calmo, visivel = true, anterior = performance.now(), ultimo = 0;
		function desenhar() { quadro(cena.ciclo ? tempo % cena.ciclo : tempo); }
		if (figura) {
			var controle = document.createElement('div');
			controle.className = 'animacao-controle';
			controle.innerHTML = '<button type="button" class="animacao-play"></button>';
			figura.insertBefore(controle, figura.querySelector('figcaption'));
			var botao = controle.querySelector('button');
			var atualizar = function () {
				botao.classList.toggle('pausado', !tocando);
				botao.setAttribute('aria-label', tocando ? T('Pausar a animação', 'Pause the animation') : T('Continuar a animação', 'Resume the animation'));
			};
			botao.addEventListener('click', function () { tocando = !tocando; anterior = performance.now(); atualizar(); });
			atualizar();
		}
		desenhar();
		/* as artes podem chegar depois do primeiro quadro */
		PLANETAS.forEach(function (p) { sprite(p.id).addEventListener('load', desenhar); });
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(desenhar);
		if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; }).observe(tela);
		(function laco(agora) {
			var dt = Math.max(0, Math.min(0.1, (agora - anterior) / 1000));
			anterior = agora;
			if (tocando && visivel) {
				tempo += dt;
				if (agora - ultimo > 1000 / 15) { ultimo = agora; desenhar(); }
			}
			requestAnimationFrame(laco);
		})(performance.now());
	}
	function hudTexto(hud, a, b) {
		if (!hud) return;
		if (hud.ano.textContent !== a) hud.ano.textContent = a;
		if (hud.estacao.textContent !== b) hud.estacao.textContent = b;
		hud.ano.style.display = a ? '' : 'none';
		hud.estacao.style.display = b ? '' : 'none';
	}

	/* Herói: o Sol entrando pela esquerda; a Terra e Júpiter na mesma escala. */
	CENAS.heroi = {
		L: 360, A: 360, parado: 3,
		criar: function (ctx, dados) {
			var R = 330, cx = 180 - R, cy = 180, k = (2 * R) / KM_SOL;
			var terra = PLANETAS[2], jup = PLANETAS[4];
			var dT = terra.d * k, dJ = jup.d * k;
			return function (t) {
				estrelas(dados, 360, 360, t, 5, 70);
				pintarSol(dados, 360, 360, cx, cy, R, t, 300);
				ctx.putImageData(dados, 0, 0);
				/* protuberâncias: laços de plasma subindo e descendo na borda */
				[[-0.42, 0.9, 2.1], [0.18, 1.4, 3.3], [0.55, 1.1, 0.7]].forEach(function (p, n) {
					var ang = p[0], alto = 6 + 5 * Math.sin(t * 0.4 * p[1] + p[2]);
					for (var s = 0; s <= 20; s++) {
						var u = s / 20, a = ang + (u - 0.5) * 0.07, h = Math.sin(u * Math.PI) * alto;
						var x = cx + Math.cos(a) * (R + h), y = cy + Math.sin(a) * (R + h);
						ctx.fillStyle = 'rgba(255,' + (110 + n * 20) + ',40,' + (0.55 + 0.35 * Math.sin(u * Math.PI)) + ')';
						ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
					}
				});
				var xT = 236, xJ = 306, y = 180, sobe = Math.round(Math.sin(t * 2) * 1.5);
				planeta(ctx, terra, xT, y, dT);
				planeta(ctx, jup, xJ, y, dJ);
				seta(ctx, xT, y - 16 + sobe, '#7fe3ff');
				texto(ctx, terra.nome.toUpperCase(), xT, y + 10, '#7fe3ff', 'center');
				texto(ctx, jup.nome.toUpperCase(), xJ, y + dJ / 2 + 6, '#ffd36a', 'center');
				texto(ctx, T('TUDO NA MESMA ESCALA', 'ALL AT THE SAME SCALE'), 352, 340, 'rgba(232,226,255,0.6)', 'right');
			};
		}
	};

	/* Tamanhos: a beirada do Sol e os oito planetas lado a lado; uma setinha visita cada um. */
	CENAS.tamanhos = {
		L: 480, A: 240, ciclo: 9 * 3.2, parado: 4 * 3.2 + 1,
		criar: function (ctx, dados, hud) {
			var dJ = 70, k = dJ / 139820, R = KM_SOL * k / 2, cx = 46 - R, cy = 120;
			var X = [56, 66, 78, 89, 136, 260, 362, 400];
			return function (t) {
				estrelas(dados, 480, 240, t, 9, 90);
				pintarSol(dados, 480, 240, cx, cy, R, t, 60);
				ctx.putImageData(dados, 0, 0);
				PLANETAS.forEach(function (p, i) { planeta(ctx, p, X[i], cy, p.d * k); });
				var n = Math.min(8, Math.floor(t / 3.2)), u = (t % 3.2) / 3.2, sobe = Math.round(Math.sin(t * 5) * 1.5);
				if (n === 0) {
					seta(ctx, 30, 26 + sobe, '#ffd36a');
					texto(ctx, T('SOL', 'SUN'), 30, 12, '#ffd36a', 'center');
					hudTexto(hud, T('Sol', 'Sun'), T('109 Terras de largura', '109 Earths wide'));
				} else {
					var p = PLANETAS[n - 1], x = X[n - 1], d = p.d * k, topo = cy - (p.id === 'saturno' ? d * 0.55 : d / 2) - 12;
					var vezes = p.d / KM_TERRA;
					seta(ctx, x, topo + sobe, '#7fe3ff');
					texto(ctx, p.nome.toUpperCase(), Math.min(468, Math.max(12, x)), topo - 12, '#7fe3ff', 'center');
					var linha = p.id === 'terra' ? T('a nossa medida', 'our yardstick') :
						num(vezes, vezes < 10 ? 2 : 1) + T(vezes < 2 ? ' Terra de largura' : ' Terras de largura', vezes < 2 ? ' Earths wide' : ' Earths wide');
					hudTexto(hud, p.nome, linha);
				}
				if (u < 0.08 && n > 0) { ctx.fillStyle = 'rgba(127,227,255,0.18)'; ctx.fillRect(X[n - 1] - 14, 0, 28, 240); }
				texto(ctx, T('1 PIXEL = ', '1 PIXEL = ') + num(Math.round(1 / k)) + ' KM', 472, 226, 'rgba(232,226,255,0.55)', 'right');
			};
		}
	};

	/* Da Terra à Lua: 29 Terras e meia cabem entre as duas; depois os outros planetas, de centro a centro. */
	CENAS['terra-lua'] = {
		L: 480, A: 180, ciclo: 26, parado: 20,
		criar: function (ctx, dados, hud) {
			var x0 = 26, D = 440, k = D / KM_TERRA_LUA, y = 92, dT = KM_TERRA * k, dL = KM_LUA * k;
			var vao = (KM_TERRA_LUA - KM_TERRA / 2 - KM_LUA / 2) / KM_TERRA; /* 29,5 Terras entre as superfícies */
			var outros = PLANETAS.filter(function (p) { return p.id !== 'terra'; });
			var soma = outros.reduce(function (s, p) { return s + p.d; }, 0);
			var lua = { id: 'lua', cor: '#cfcac0' };
			return function (t) {
				estrelas(dados, 480, 180, t, 13, 70);
				ctx.putImageData(dados, 0, 0);
				var fase2 = t >= 13, apagar = 1;
				if (t > 11.5 && t < 13) apagar = 1 - (t - 11.5) / 1.5;
				if (t > 24.5) apagar = 1 - (t - 24.5) / 1.5;
				/* régua entre os centros */
				ctx.fillStyle = 'rgba(255,211,106,0.35)';
				for (var x = x0; x < x0 + D; x += 4) ctx.fillRect(x, y + 26, 2, 1);
				ctx.fillRect(x0, y + 23, 1, 7); ctx.fillRect(x0 + D, y + 23, 1, 7);
				texto(ctx, '384.400 KM'.replace('.', EN ? ',' : '.'), x0 + D / 2, y + 30, '#ffd36a', 'center');
				if (!fase2) {
					var n = Math.max(0, Math.min(vao, (t - 1.5) / 8 * vao));
					var cheias = Math.floor(n);
					ctx.globalAlpha = apagar;
					for (var i = 0; i < Math.ceil(n); i++) {
						var cxE = x0 + dT / 2 + dT * (i + 0.5);
						if (i === cheias) {
							/* a última Terra é só metade: corta o círculo */
							ctx.save(); ctx.beginPath(); ctx.rect(cxE - dT / 2, 0, dT * (n - cheias), 180); ctx.clip();
							arte(ctx, 'terra', cxE, y, dT); ctx.restore();
						} else arte(ctx, 'terra', cxE, y, dT);
					}
					ctx.globalAlpha = 1;
					arte(ctx, 'terra', x0, y, dT);
					bolinha(ctx, x0 + D, y, dL, lua.cor);
					hudTexto(hud, T('Terras enfileiradas: ', 'Earths in a row: ') + num(Math.min(n, vao), n >= vao ? 1 : 0), n >= vao ? T('quase 30 Terras!', 'almost 30 Earths!') : '');
				} else {
					var m = Math.max(0, Math.min(7, (t - 13.5) / 1.1));
					ctx.globalAlpha = 0.35;
					arte(ctx, 'terra', x0, y, dT);
					bolinha(ctx, x0 + D, y, dL, lua.cor);
					ctx.globalAlpha = apagar;
					var acum = 0;
					for (var j = 0; j < 7; j++) {
						var p = outros[j], d = p.d * k, cxP = x0 + (acum + p.d / 2) * k;
						acum += p.d;
						if (j >= m) break;
						var entra = Math.min(1, m - j), dy = (1 - entra) * -30;
						if (p.id === 'saturno') {
							/* Saturno sem os anéis: só o globo conta */
							ctx.save(); ctx.beginPath(); ctx.arc(cxP, y + dy, d / 2, 0, Math.PI * 2); ctx.clip();
							arte(ctx, 'saturno', cxP, y + dy, d); ctx.restore();
						} else planeta(ctx, p, cxP, y + dy, d);
						if (d < 9) texto(ctx, p.nome.toUpperCase(), cxP, y - 18 - j % 2 * 9, p.cor, 'center');
					}
					ctx.globalAlpha = 1;
					/* os centros da Terra e da Lua */
					ctx.fillStyle = '#7fe3ff'; ctx.fillRect(x0, y - 1, 1, 3); ctx.fillRect(x0 + D, y - 1, 1, 3);
					var feito = m >= 7;
					hudTexto(hud, T('Os outros 7 planetas: ', 'The other 7 planets: ') + num(Math.round(soma * Math.min(1, m / 7) / 10) * 10) + ' km',
						feito ? T('sobram ', 'with ') + num(KM_TERRA_LUA - soma) + T(' km', ' km to spare') : '');
				}
				texto(ctx, T('TERRA', 'EARTH'), x0, y + 12, '#7fe3ff', 'center');
				texto(ctx, T('LUA', 'MOON'), x0 + D, y + 8, '#cfcac0', 'center');
			};
		}
	};

	/* Os anéis de Saturno, vistos de 26,7° (o máximo, visto da Terra) até de lado. */
	CENAS.aneis = {
		L: 480, A: 200, ciclo: 18, parado: 2,
		criar: function (ctx, dados, hud) {
			var cx = 240, cy = 100, Rg = 34, ach = 0.902; /* Saturno é achatado: 9,8% */
			var KM = Rg / 58232;
			/* raios dos anéis (km): C, B, divisão de Cassini, A */
			var FAIXAS = [[74658, 92000, 0.32, [150, 132, 110]], [92000, 117580, 0.95, [226, 206, 160]], [117580, 122170, 0.08, [80, 70, 60]], [122170, 136775, 0.7, [200, 182, 142]]];
			var GLOBO = [[150, 110, 60], [196, 160, 98], [226, 196, 134], [240, 220, 168]];
			return function (t) {
				var u = t / 18, s = (Math.cos(u * Math.PI * 2) + 1) / 2;
				var B = 26.7 * s; /* inclinação dos anéis para nós */
				var sb = Math.sin(B * Math.PI / 180);
				estrelas(dados, 480, 200, t, 21, 80);
				var d = dados.data;
				for (var y = 0; y < 200; y++) {
					for (var x = 0; x < 480; x++) {
						var dx = x + 0.5 - cx, dy = y + 0.5 - cy, i = (y * 480 + x) * 4;
						/* anel: ponto no plano dos anéis visto inclinado */
						var anel = null;
						if (sb > 0.004) {
							var ry = dy / sb, rk = Math.sqrt(dx * dx + ry * ry) / KM;
							for (var f = 0; f < 4; f++) if (rk >= FAIXAS[f][0] && rk < FAIXAS[f][1]) {
								var listra = 0.82 + 0.18 * Math.sin(rk / 900);
								anel = [FAIXAS[f][3][0] * listra, FAIXAS[f][3][1] * listra, FAIXAS[f][3][2] * listra, FAIXAS[f][2]];
							}
						}
						var gy = dy / ach, gr = Math.sqrt(dx * dx + gy * gy);
						var globo = gr < Rg, frente = dy > 0;
						if (globo) {
							var mu = Math.sqrt(1 - gr * gr / (Rg * Rg));
							var banda = 0.5 + 0.5 * Math.sin(gy / Rg * 11 + Math.sin(dx / 9 + t * 0.2) * 0.3);
							var c = GLOBO[Math.min(3, Math.floor((0.35 + 0.6 * mu) * 3 + banda * 0.6))];
							var luz = 0.55 + 0.45 * mu;
							d[i] = c[0] * luz; d[i + 1] = c[1] * luz; d[i + 2] = c[2] * luz;
						}
						if (anel && (!globo || frente)) {
							var a = anel[3];
							/* sombra do planeta nos anéis, atrás dele */
							if (!frente && Math.abs(dx) < Rg && dy < 0) a *= 0.25;
							d[i] = d[i] * (1 - a) + anel[0] * a; d[i + 1] = d[i + 1] * (1 - a) + anel[1] * a; d[i + 2] = d[i + 2] * (1 - a) + anel[2] * a;
						}
					}
				}
				ctx.putImageData(dados, 0, 0);
				/* de lado: só um fiozinho apagado que some */
				if (sb <= 0.03) {
					var some = Math.max(0, 1 - sb / 0.03);
					ctx.fillStyle = 'rgba(220,200,150,' + (0.5 * (1 - some * 0.8)) + ')';
					var meia = 136775 * KM;
					ctx.fillRect(Math.round(cx - meia), cy, Math.round(meia - Rg), 1);
					ctx.fillRect(Math.round(cx + Rg), cy, Math.round(meia - Rg), 1);
					/* a lupa: de perto, os anéis têm a altura de um predinho de três andares */
					var lx = 340, ly = 118, la = 128, lA = 62, fy = ly + 26;
					ctx.globalAlpha = Math.min(1, some * 2);
					ctx.fillStyle = 'rgba(5,3,12,0.94)'; ctx.fillRect(lx, ly, la, lA);
					ctx.fillStyle = '#ffd36a'; ctx.fillRect(lx, ly, la, 1); ctx.fillRect(lx, ly + lA - 1, la, 1); ctx.fillRect(lx, ly, 1, lA); ctx.fillRect(lx + la - 1, ly, 1, lA);
					texto(ctx, T('ZOOM NOS ANÉIS', 'RING CLOSE-UP'), lx + la / 2, ly + 5, '#7fe3ff', 'center');
					/* a fatia do anel: gelo e poeira, 18 px = 10 m */
					ctx.fillStyle = '#b9a67c'; ctx.fillRect(lx + 1, fy, la - 2, 18);
					ctx.fillStyle = '#e8d6a8'; ctx.fillRect(lx + 1, fy, la - 2, 1);
					ctx.fillStyle = '#8a7a5a'; ctx.fillRect(lx + 1, fy + 17, la - 2, 1);
					for (var g = 0; g < 40; g++) {
						var gx = (hash(g, 1) * (la - 6) + t * 3 * (0.5 + hash(g, 4))) % (la - 6);
						ctx.fillStyle = 'rgba(255,255,255,' + (0.3 + hash(g, 3) * 0.6) + ')';
						ctx.fillRect(lx + 3 + Math.floor(gx), fy + 2 + Math.floor(hash(g, 2) * 14), 1, 1);
					}
					/* o predinho, do lado de fora da fatia, com a mesma altura */
					var px = lx + 14, py = fy;
					ctx.fillStyle = '#05030c'; ctx.fillRect(px - 2, py - 2, 14, 21);
					ctx.fillStyle = '#5b4c8a'; ctx.fillRect(px, py, 10, 18);
					ctx.fillStyle = '#ff6fb5'; ctx.fillRect(px - 1, py - 1, 12, 1);
					for (var an = 0; an < 3; an++) for (var ja = 0; ja < 3; ja++) {
						ctx.fillStyle = (Math.floor(t * 1.5) + an * 3 + ja) % 5 ? '#ffd36a' : '#2a2140';
						ctx.fillRect(px + 2 + ja * 3, py + 2 + an * 6, 1, 2);
					}
					/* a medida ao lado */
					ctx.fillStyle = '#ffd36a';
					ctx.fillRect(px + 14, py, 3, 1); ctx.fillRect(px + 15, py, 1, 18); ctx.fillRect(px + 14, py + 17, 3, 1);
					texto(ctx, T('10 M = 3 ANDARES', '10 M = 3 STORIES'), lx + la / 2, fy + 23, '#ffd36a', 'center');
					ctx.globalAlpha = 1;
				}
				texto(ctx, '270.000 KM'.replace('.', EN ? ',' : '.'), cx, 186, 'rgba(232,226,255,0.6)', 'center');
				hudTexto(hud, T('Inclinação: ', 'Tilt: ') + num(B, 1) + '°', sb <= 0.03 ? T('de lado: quase somem', 'edge-on: nearly gone') : (B > 24 ? T('bem abertos', 'wide open') : ''));
			};
		}
	};

	/* A luz: um raio sai do Sol; 1 segundo da animação = 10 minutos de luz. */
	CENAS.luz = {
		L: 480, A: 140, ciclo: 30, parado: 27,
		criar: function (ctx, dados, hud) {
			var x0 = 14, UA = 149.5979, px = 455 / (4495.06 / UA), y = 70;
			var MIN_POR_S = 10;
			return function (t) {
				var corrida = Math.min(1, Math.max(0, (t - 1) / 26.5)), minutos = (t - 1) * MIN_POR_S;
				var fim = 4495.06e6 / LUZ / 60 + 1;
				if (minutos > fim) minutos = fim;
				estrelas(dados, 480, 140, t, 31, 60);
				pintarSol(dados, 480, 140, x0 - 40, y, 44, t, 16);
				ctx.putImageData(dados, 0, 0);
				/* a linha dos planetas */
				ctx.fillStyle = 'rgba(127,227,255,0.18)'; ctx.fillRect(x0, y, 470 - x0, 1);
				var xLuz = x0 + Math.max(0, minutos) * 60 * LUZ / 1e6 / UA * px;
				if (t > 1 && t < 28.8) {
					/* o raio: um traço amarelo que deixa um rastro */
					for (var r = 0; r < 40; r++) {
						ctx.fillStyle = 'rgba(255,236,150,' + (0.7 * (1 - r / 40)) + ')';
						ctx.fillRect(Math.round(xLuz - r * 1.5), y, 2, 1);
					}
					ctx.fillStyle = '#fffbe0'; ctx.fillRect(Math.round(xLuz), y - 1, 2, 3);
				}
				var ultimo = null;
				PLANETAS.forEach(function (p, i) {
					var x = x0 + p.a / UA * px, chegou = xLuz >= x && t > 1;
					var brilho = chegou && xLuz - x < 14 ? 1 - (xLuz - x) / 14 : 0;
					if (brilho) { ctx.fillStyle = 'rgba(255,240,180,' + brilho * 0.5 + ')'; ctx.fillRect(Math.round(x) - 2, y - 2, 5, 5); }
					bolinha(ctx, x, y, 2.4, chegou ? p.cor : '#4a4466');
					var cima = i % 2 === 0, minP = p.a * 1e6 / LUZ / 60;
					if (i >= 4) {
						texto(ctx, p.nome.toUpperCase(), x, cima ? y - 30 : y + 8, chegou ? p.cor : 'rgba(232,226,255,0.4)', i === 7 ? 'right' : 'center');
						if (chegou) texto(ctx, tempoLuz(minP, true), x, cima ? y - 21 : y + 17, '#ffd36a', i === 7 ? 'right' : 'center');
					}
					if (chegou) ultimo = p;
				});
				/* os quatro de dentro, espremidos: uma chave embaixo */
				ctx.fillStyle = 'rgba(232,226,255,0.25)'; ctx.fillRect(x0 + 2, y + 30, 14, 1);
				texto(ctx, T('OS 4 DE DENTRO', 'THE INNER 4'), x0 + 2, y + 33, 'rgba(232,226,255,0.45)');
				hudTexto(hud, T('Luz viajando: ', 'Light travel: ') + tempoLuz(Math.max(0, minutos)),
					ultimo ? T('chegou em ', 'reached ') + ultimo.nome : T('saindo do Sol', 'leaving the Sun'));
			};
		}
	};
	function tempoLuz(min, curto) {
		var h = Math.floor(min / 60), m = Math.floor(min % 60), s = Math.floor((min * 60) % 60);
		if (curto) return h ? h + 'H ' + (m < 10 ? '0' : '') + m + 'MIN' : m + 'MIN ' + (s < 10 ? '0' : '') + s + 'S';
		return (h ? h + ' h ' : '') + m + ' min ' + (h ? '' : s + ' s');
	}

	document.querySelectorAll('canvas[data-escala]').forEach(animar);

	/* ---------- As luas e as órbitas: a lupa com abas ---------- */
	/* [id da página ou null, nome, diâmetro km, raio da órbita km, período em dias (negativo: ao contrário)] */
	var SISTEMAS = [
		{ id: 'terra', d: 12742, luas: [['lua', T('Lua', 'Moon'), 3474, 384400, 27.32]] },
		{ id: 'jupiter', d: 139820, luas: [['io', 'Io', 3643, 421700, 1.769], ['europa', 'Europa', 3122, 671034, 3.551], ['ganimedes', T('Ganimedes', 'Ganymede'), 5268, 1070412, 7.155], [null, T('Calisto', 'Callisto'), 4821, 1882709, 16.689]] },
		{ id: 'saturno', d: 116460, aneis: true, luas: [['mimas', 'Mimas', 396, 185539, 0.942], ['encelado', T('Encélado', 'Enceladus'), 504, 237948, 1.370], [null, T('Tétis', 'Tethys'), 1062, 294619, 1.888], [null, 'Dione', 1123, 377396, 2.737], [null, T('Reia', 'Rhea'), 1527, 527108, 4.518], ['tita', T('Titã', 'Titan'), 5150, 1221870, 15.945]] },
		{ id: 'urano', d: 50724, luas: [['miranda', 'Miranda', 472, 129390, 1.413], [null, 'Ariel', 1158, 191020, 2.520], [null, 'Umbriel', 1169, 266000, 4.144], [null, T('Titânia', 'Titania'), 1577, 435910, 8.706], [null, 'Oberon', 1523, 583520, 13.463]] },
		{ id: 'netuno', d: 49244, luas: [[null, T('Proteu', 'Proteus'), 420, 117647, 1.122], ['tritao', T('Tritão', 'Triton'), 2707, 354759, -5.877]] }
	];
	var caixa = document.getElementById('escala-luas');
	if (caixa) montarLupa(caixa);
	function montarLupa(caixa) {
		var NS = 'http://www.w3.org/2000/svg', C = 200, RMAX = 178;
		var abas = document.createElement('div');
		abas.className = 'er-abas'; abas.setAttribute('role', 'tablist');
		var palco = document.createElement('div'); palco.className = 'er-lupa';
		var svg = document.createElementNS(NS, 'svg');
		svg.setAttribute('viewBox', '0 0 400 400'); svg.setAttribute('role', 'img');
		var info = document.createElement('div'); info.className = 'er-lupa-info';
		var nota = document.createElement('p'); nota.className = 'er-lupa-nota';
		var pausa = document.createElement('button'); pausa.type = 'button'; pausa.className = 'animacao-play';
		var rodape = document.createElement('div'); rodape.className = 'animacao-controle';
		rodape.appendChild(pausa); rodape.appendChild(nota);
		palco.appendChild(svg); palco.appendChild(info);
		caixa.appendChild(abas); caixa.appendChild(palco); caixa.appendChild(rodape);
		var atual = null, pontos = [], dia = 0, segPorDia = 1, parado = false, mouse = false, sobre = null;

		SISTEMAS.forEach(function (s, i) {
			var p = PLANETAS.filter(function (q) { return q.id === s.id; })[0];
			s.nome = p.nome; s.cor = p.cor;
			var b = document.createElement('button');
			b.type = 'button'; b.setAttribute('role', 'tab');
			b.innerHTML = '<img src="pixel/' + s.id + '.png" alt="">' + p.nome;
			b.addEventListener('click', function () { escolher(i); });
			s.botao = b;
			abas.appendChild(b);
		});
		function el(nome, attrs, pai) {
			var e = document.createElementNS(NS, nome);
			for (var k in attrs) e.setAttribute(k, attrs[k]);
			(pai || svg).appendChild(e);
			return e;
		}
		function regua(k) {
			/* a régua: o maior número redondo que caiba em ~120 px */
			var opcoes = [10000, 20000, 50000, 100000, 200000, 500000, 1000000], km = opcoes[0];
			opcoes.forEach(function (o) { if (o * k <= 130) km = o; });
			var w = km * k, x = 16, y = 384;
			el('path', { d: 'M' + x + ' ' + (y - 4) + 'v8M' + x + ' ' + y + 'h' + w + 'M' + (x + w) + ' ' + (y - 4) + 'v8', class: 'er-regua' });
			var tx = el('text', { x: x + w + 6, y: y + 4, class: 'er-regua-texto' });
			tx.textContent = num(km) + ' km';
		}
		function escolher(i) {
			var s = SISTEMAS[i];
			atual = s; dia = 0; sobre = null;
			SISTEMAS.forEach(function (o, j) { o.botao.setAttribute('aria-selected', j === i ? 'true' : 'false'); o.botao.classList.toggle('ativa', j === i); });
			while (svg.firstChild) svg.removeChild(svg.firstChild);
			var maior = s.luas.reduce(function (m, l) { return Math.max(m, l[3]); }, 0), k = RMAX / maior;
			var menor = s.luas.reduce(function (m, l) { return Math.min(m, Math.abs(l[4])); }, 99);
			/* a lua mais rápida leva 8 segundos para dar uma volta */
			segPorDia = 8 / menor;
			svg.setAttribute('aria-label', T(s.nome + ' e as suas luas, vistos de cima, em escala real.', s.nome + ' and its moons, seen from above, at real scale.'));
			el('circle', { cx: C, cy: C, r: 196, class: 'er-lupa-fundo' });
			s.luas.forEach(function (l) { el('circle', { cx: C, cy: C, r: l[3] * k, class: 'er-orbita' + (l[0] ? ' com-pagina' : '') }); });
			var rP = s.d / 2 * k;
			if (s.aneis) {
				[[74658, 92000, 0.25], [92000, 117580, 0.75], [122170, 136775, 0.5]].forEach(function (a) {
					el('circle', { cx: C, cy: C, r: (a[0] + a[1]) / 2 * k, fill: 'none', stroke: '#e6cf94', 'stroke-opacity': a[2], 'stroke-width': Math.max(0.6, (a[1] - a[0]) * k) });
				});
			}
			el('circle', { cx: C, cy: C, r: Math.max(rP, 0.8), fill: s.cor, class: 'er-planeta' });
			pontos = s.luas.map(function (l, n) {
				var g = el(l[0] ? 'a' : 'g', l[0] ? { href: l[0] + '.html', class: 'er-lua com-pagina' } : { class: 'er-lua' });
				var rReal = l[2] / 2 * k, r = Math.max(rReal, 2);
				var halo = el('circle', { r: r + 4, class: 'er-halo' }, g);
				var ponto = el('circle', { r: r, class: 'er-ponto' }, g);
				var nome = el('text', { class: 'er-nome-lua' }, g);
				nome.textContent = l[1];
				var titulo = el('title', {}, g);
				titulo.textContent = l[1] + ' · ' + num(l[2]) + ' km · ' + T('órbita de ', 'orbit of ') + num(l[3]) + ' km · ' + T('uma volta em ', 'one lap in ') + num(Math.abs(l[4]), 1) + T(' dias', ' days');
				g.addEventListener('mouseenter', function () { sobre = l; mostrar(); });
				g.addEventListener('mouseleave', function () { sobre = null; mostrar(); });
				g.addEventListener('focus', function () { sobre = l; mostrar(); });
				g.addEventListener('blur', function () { sobre = null; mostrar(); });
				/* cada lua começa num ponto diferente da órbita */
				return { l: l, g: g, halo: halo, ponto: ponto, nome: nome, R: l[3] * k, fase: n * 2.4 + 0.6, ampliada: rReal < 2 };
			});
			regua(k);
			var ampliadas = pontos.some(function (p) { return p.ampliada; });
			nota.textContent = T('Planeta, órbitas e distâncias em escala real. ', 'Planet, orbits and distances at real scale. ') +
				(ampliadas ? T('Os pontinhos das luas estão ampliados (de verdade, seriam menores que um pixel). ', 'The moon dots are enlarged (for real, they would be smaller than a pixel). ') : '') +
				T('1 segundo aqui = ', '1 second here = ') + num(segPorDia > 0 ? 24 / segPorDia : 0, 1) + T(' horas de verdade. Passe o mouse para parar.', ' real hours. Hover to pause.');
			mostrar();
			posicionar();
		}
		function mostrar() {
			var s = atual, l = sobre;
			if (l) {
				info.innerHTML = '<strong>' + l[1] + '</strong>' + num(l[2]) + ' km ' + T('de diâmetro', 'across') + '<br>' +
					T('a ', '') + num(l[3]) + ' km ' + T('de ', 'from ') + s.nome + '<br>' + T('uma volta em ', 'one lap in ') + num(Math.abs(l[4]), l[4] < 3 ? 2 : 1) + T(' dias', ' days') +
					(l[4] < 0 ? '<br><em>' + T('gira ao contrário!', 'orbits backwards!') + '</em>' : '') +
					(l[0] ? '<br><em>' + T('clique para visitar', 'click to visit') + '</em>' : '');
			} else {
				var longe = s.luas[s.luas.length - 1];
				info.innerHTML = '<strong>' + s.nome + '</strong>' + num(s.d) + ' km ' + T('de diâmetro', 'across') + '<br>' +
					longe[1] + T(' fica a ', ' is ') + num(longe[3] / s.d, 1) + T(' vezes a largura de ', ' times ') + s.nome + (EN ? '’s width away' : '');
			}
		}
		function posicionar() {
			pontos.forEach(function (p) {
				var per = p.l[4], ang = p.fase + (dia / per) * Math.PI * 2;
				var x = C + Math.cos(ang) * p.R, y = C - Math.sin(ang) * p.R;
				p.halo.setAttribute('cx', x.toFixed(2)); p.halo.setAttribute('cy', y.toFixed(2));
				p.ponto.setAttribute('cx', x.toFixed(2)); p.ponto.setAttribute('cy', y.toFixed(2));
				var dir = x > C + 8;
				p.nome.setAttribute('x', (x + (dir ? -8 : 8)).toFixed(1));
				p.nome.setAttribute('y', (y + 4).toFixed(1));
				p.nome.setAttribute('text-anchor', dir ? 'end' : 'start');
			});
		}
		function atualizarPausa() {
			pausa.classList.toggle('pausado', parado);
			pausa.setAttribute('aria-label', parado ? T('Continuar as órbitas', 'Resume the orbits') : T('Pausar as órbitas', 'Pause the orbits'));
		}
		pausa.addEventListener('click', function () { parado = !parado; atualizarPausa(); });
		palco.addEventListener('mouseenter', function () { mouse = true; palco.classList.add('parada'); });
		palco.addEventListener('mouseleave', function () { mouse = false; palco.classList.remove('parada'); });
		parado = calmo; atualizarPausa();
		escolher(1);
		var visivel = true, antes = performance.now();
		if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; }).observe(palco);
		(function laco(agora) {
			var dt = Math.max(0, Math.min(0.1, (agora - antes) / 1000));
			antes = agora;
			if (visivel && !parado && !mouse && !sobre) { dia += dt / segPorDia; posicionar(); }
			requestAnimationFrame(laco);
		})(performance.now());
	}

	/* ---------- Viagem em escala real: a Lua tem 1 pixel ---------- */
	var viagem = document.getElementById('viagem');
	if (viagem) montarViagem(viagem);
	function montarViagem(caixa) {
		var KM_PX = KM_LUA, SOL_PX = KM_SOL / KM_PX, X_SOL = 40 + SOL_PX / 2, ALT = 240, MEIO = 120;
		var FIM = X_SOL + 4495.06e6 / KM_PX + 2600;
		var PX_LUZ = LUZ / KM_PX; /* 86,3 pixels por segundo */
		caixa.innerHTML =
			'<div class="er-viagem-hud" aria-live="off"><span data-v="dist"></span><span data-v="luz"></span></div>' +
			'<div class="er-trilho" tabindex="0" role="region"><div class="er-faixa"></div></div>' +
			'<div class="er-viagem-botoes">' +
			'<button type="button" data-v="inicio">&larr; ' + T('Sol', 'Sun') + '</button>' +
			'<button type="button" data-v="luz1" aria-pressed="false">' + T('Velocidade da luz', 'Speed of light') + '</button>' +
			'<button type="button" data-v="luz100" aria-pressed="false">' + T('100 vezes a luz', '100 × light speed') + '</button>' +
			'<button type="button" data-v="proximo">' + T('Próximo planeta', 'Next planet') + ' &rarr;</button>' +
			'</div>';
		var trilho = caixa.querySelector('.er-trilho'), faixa = caixa.querySelector('.er-faixa');
		trilho.setAttribute('aria-label', T('Faixa do Sistema Solar em escala real. Use as setas para os lados.', 'Strip of the Solar System at real scale. Use the side arrows.'));
		faixa.style.width = Math.round(FIM) + 'px';
		faixa.style.height = ALT + 'px';
		/* céu de estrelas, repetido ao longo da faixa */
		var ceu = document.createElement('canvas'); ceu.width = 600; ceu.height = ALT;
		var cc = ceu.getContext('2d');
		for (var s = 0; s < 70; s++) {
			var b = 60 + 140 * hash(s, 77);
			cc.fillStyle = 'rgb(' + Math.round(b * 0.9) + ',' + Math.round(b * 0.9) + ',' + Math.round(b) + ')';
			cc.fillRect(Math.floor(hash(s, 5) * 600), Math.floor(hash(9, s) * ALT), 1, 1);
		}
		faixa.style.backgroundImage = 'url(' + ceu.toDataURL() + ')';

		function por(html, x, classe, y) {
			var e = document.createElement('div');
			e.className = classe;
			e.style.left = Math.round(x) + 'px';
			if (y != null) e.style.top = Math.round(y) + 'px';
			e.innerHTML = html;
			faixa.appendChild(e);
			return e;
		}
		/* o Sol, com a arte dela, no tamanho de verdade */
		var sol = document.createElement('img');
		sol.src = 'pixel/sol.png'; sol.alt = ''; sol.className = 'er-sol';
		sol.style.width = Math.round(SOL_PX) + 'px'; sol.style.left = (X_SOL - SOL_PX / 2) + 'px'; sol.style.top = (MEIO - SOL_PX / 2) + 'px';
		faixa.appendChild(sol);
		por('<b>' + T('Sol', 'Sun') + '</b>1.392.700 km'.replace(/\./g, EN ? ',' : '.'), X_SOL + SOL_PX / 2 + 16, 'er-rotulo er-rotulo-sol', 30);

		var alvos = [];
		PLANETAS.forEach(function (p) {
			var x = X_SOL + p.a * 1e6 / KM_PX, d = p.d / KM_PX, img = document.createElement('img');
			img.src = 'pixel/' + p.id + '.png'; img.alt = '';
			var larg = p.id === 'saturno' ? d / SAT_GLOBO : d;
			if (d < 8) {
				/* pequeno demais para a arte: um pontinho com a cor dele, e uma mira para achar */
				img = document.createElement('i');
				img.style.height = d.toFixed(1) + 'px';
				img.style.background = p.cor;
				img.style.color = p.cor;
				por('', x, 'er-mira', MEIO - 9);
			}
			img.style.width = Math.max(2, larg).toFixed(1) + 'px';
			img.style.left = (x - larg / 2).toFixed(1) + 'px';
			img.style.top = (MEIO - (p.id === 'saturno' ? larg * 50 / 95 : d) / 2).toFixed(1) + 'px';
			img.className = 'er-planeta-img';
			faixa.appendChild(img);
			var min = p.a * 1e6 / LUZ / 60;
			por('<b style="color:' + p.cor + '">' + p.nome + '</b>' + num(p.a, 1) + T(' milhões de km do Sol', ' million km from the Sun') + '<br>' + T('a luz leva ', 'light takes ') + tempoLuz(min) + '<br>' + num(p.d) + ' km ' + T('de diâmetro', 'across'),
				x, 'er-rotulo', MEIO + Math.max(10, d / 2 + 10));
			alvos.push({ x: x, p: p });
			if (p.id === 'terra') {
				/* a Lua: 1 pixel, a 110 pixels da Terra */
				var lua = por('', x + KM_TERRA_LUA / KM_PX, 'er-lua-px', MEIO);
				lua.title = T('A Lua (1 pixel)', 'The Moon (1 pixel)');
				por(T('Lua', 'Moon') + ' &darr;', x + KM_TERRA_LUA / KM_PX, 'er-plaquinha er-plaquinha-lua', MEIO - 26);
			}
		});
		var UA = 149.5979e6 / KM_PX;
		var PLACAS = [
			[0.12, T('Bem-vindo! Nesta faixa, a Lua tem 1 pixel. Siga para a direita &rarr;', 'Welcome! In this strip, the Moon is 1 pixel wide. Head right &rarr;')],
			[0.24, T('Ainda nada… O espaço é assim: quase todo vazio.', 'Still nothing… Space is like that: almost entirely empty.')],
			[0.55, T('Cada pixel que você passa são 3.474 km.', 'Every pixel you pass is 3,474 km.')],
			[0.86, T('A luz que sai do Sol agora chega aqui em uns 7 minutos.', 'Light leaving the Sun now gets here in about 7 minutes.')],
			[1.25, T('Marte vem aí. Até ele, a luz leva quase 13 minutos.', 'Mars is coming. Light takes almost 13 minutes to get there.')],
			[2.2, T('Começa o cinturão de asteroides. Mesmo aqui, eles ficam, em média, a quase 1 milhão de km uns dos outros.', 'The asteroid belt begins. Even here, they are on average almost 1 million km apart.')],
			[2.77, T('Ceres, o maior do cinturão, passa por aqui. Com 940 km, ela teria só um quarto de pixel.', 'Ceres, the largest in the belt, orbits here. At 940 km, it would be just a quarter of a pixel.')],
			[3.6, T('B. Cardador esteve aqui ✶', 'B. Cardador was here ✶'), 'er-pichacao'],
			[4.2, T('Júpiter está chegando: o maior planeta, com 40 pixels.', 'Jupiter is coming: the largest planet, 40 pixels wide.')],
			[7, T('Entre Júpiter e Saturno cabem mais de 4 vezes a distância do Sol à Terra… e nada no caminho.', 'Between Jupiter and Saturn you could fit more than 4 times the Sun–Earth distance… and nothing in the way.')],
			[13, T('Urano gira deitado: o eixo dele é inclinado 98°.', 'Uranus spins on its side: its axis is tilted 98°.')],
			[19.3, T('Mais de 2 horas e meia de luz desde o Sol. Respira: falta pouco.', 'More than two and a half hours of light from the Sun. Breathe: almost there.')],
			[25, T('Netuno vem aí. Ele leva 165 anos para dar uma volta no Sol.', 'Neptune is coming. It takes 165 years to go around the Sun once.')]
		];
		PLACAS.forEach(function (pl) { por(pl[1], X_SOL + pl[0] * UA, 'er-plaquinha ' + (pl[2] || ''), pl[2] ? 196 : 40); });
		por(T('Fim da linha dos planetas. Daqui até a estrela mais próxima, Proxima Centauri, seriam mais 11,6 bilhões de pixels. A Voyager 1, a nave mais distante, já foi mais de 5 vezes mais longe que Netuno.',
			'End of the line of planets. From here to the nearest star, Proxima Centauri, would be another 11.6 billion pixels. Voyager 1, the most distant spacecraft, has already gone more than 5 times farther than Neptune.'),
			X_SOL + 4495.06e6 / KM_PX + 260, 'er-plaquinha er-plaquinha-fim', 40);
		/* régua de km no chão da faixa: a cada 0,5 UA */
		for (var u = 0.5; u < 30.5; u += 0.5) {
			por(num(u * 149.6, 0) + ' mi km'.replace('mi', EN ? 'M' : 'mi'), X_SOL + u * UA, 'er-marco', ALT - 18);
		}

		var hudDist = caixa.querySelector('[data-v="dist"]'), hudLuz = caixa.querySelector('[data-v="luz"]');
		function atualizar() {
			var centro = trilho.scrollLeft + trilho.clientWidth / 2 - X_SOL;
			var km = Math.max(0, centro) * KM_PX;
			hudDist.textContent = T('Distância do Sol: ', 'Distance from the Sun: ') + (km < 1e6 ? num(km) + ' km' : num(km / 1e6, 1) + T(' milhões de km', ' million km'));
			hudLuz.textContent = T('A luz leva: ', 'Light takes: ') + tempoLuz(km / LUZ / 60);
		}
		trilho.addEventListener('scroll', atualizar, { passive: true });
		/* a rodinha do mouse, em cima da faixa, anda para o lado */
		trilho.addEventListener('wheel', function (e) {
			if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
			var max = trilho.scrollWidth - trilho.clientWidth;
			if ((e.deltaY < 0 && trilho.scrollLeft <= 0) || (e.deltaY > 0 && trilho.scrollLeft >= max)) return;
			e.preventDefault();
			trilho.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 40 : 1) * 1.6;
		}, { passive: false });

		var velocidade = 0, pos = 0, antes = 0;
		var bLuz = caixa.querySelector('[data-v="luz1"]'), bLuz100 = caixa.querySelector('[data-v="luz100"]');
		function acelerar(v) {
			velocidade = velocidade === v ? 0 : v;
			bLuz.setAttribute('aria-pressed', velocidade === PX_LUZ ? 'true' : 'false');
			bLuz100.setAttribute('aria-pressed', velocidade === PX_LUZ * 100 ? 'true' : 'false');
			caixa.classList.toggle('na-luz', velocidade > 0);
			if (velocidade) { pos = trilho.scrollLeft; antes = performance.now(); requestAnimationFrame(andar); }
		}
		function andar(agora) {
			if (!velocidade) return;
			var dt = Math.max(0, Math.min(0.1, (agora - antes) / 1000));
			antes = agora;
			/* se a pessoa rolou na mão, continua de onde ela parou */
			if (Math.abs(trilho.scrollLeft - pos) > 2) pos = trilho.scrollLeft;
			pos += velocidade * dt;
			trilho.scrollLeft = pos;
			if (trilho.scrollLeft >= trilho.scrollWidth - trilho.clientWidth - 1) { acelerar(velocidade); return; }
			requestAnimationFrame(andar);
		}
		bLuz.addEventListener('click', function () { acelerar(PX_LUZ); });
		bLuz100.addEventListener('click', function () { acelerar(PX_LUZ * 100); });
		caixa.querySelector('[data-v="inicio"]').addEventListener('click', function () { if (velocidade) acelerar(velocidade); trilho.scrollLeft = 0; });
		caixa.querySelector('[data-v="proximo"]').addEventListener('click', function () {
			var centro = trilho.scrollLeft + trilho.clientWidth / 2;
			var prox = alvos.filter(function (a) { return a.x > centro + 4; })[0];
			if (velocidade) acelerar(velocidade);
			trilho.scrollLeft = prox ? prox.x - trilho.clientWidth / 2 : 0;
		});
		atualizar();
	}
})();
