// Balanço (libração) dos planetas em pixel art.
//
// Como a Lua vista da Terra, o planeta não gira de verdade: ele só "balança"
// um pouquinho para os lados e para cima e para baixo, mostrando um tiquinho
// mais de uma borda e depois da outra. A arte é tratada como a metade visível
// de uma esfera, e a cada quadro cada pixel pega a cor do ponto da arte que
// estaria ali com o planeta inclinado. Tudo acontece no tamanho original dos
// pixels da arte, então ela continua sendo pixel art.
//
// Uso: <img class="planeta" data-planeta="terra" src="pixel/terra.png">
// As artes vêm de pixel/sprites.js (window.SPRITES).
(function () {
	var SPRITES = window.SPRITES || {};

	// Saturno: o globo balança e os anéis giram em volta dele.
	// anelNaFrente: linhas onde o anel passa na frente do globo; anelLinhas: linhas que o anel ocupa.
	var ESPECIAIS = {
		saturno: { globo: { cx: 45.5, cy: 25, r: 25 }, anelNaFrente: [20, 25], anelLinhas: [20, 36] }
	};
	var PERIODO_ANEL = 40000;          // ms para o anel dar uma volta

	var LON_MAX = 8 * Math.PI / 180;   // balanço para os lados
	var LAT_MAX = 6 * Math.PI / 180;   // balanço para cima e para baixo
	var PERIODO_LON = 9000;            // ms
	var PERIODO_LAT = 12500;           // ms
	var INTERVALO = 1000 / 15;         // 15 quadros por segundo, bem pixel art

	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var planetas = [];

	function preparar(img) {
		var nome = img.getAttribute('data-planeta');
		if (!SPRITES[nome]) return;
		var fonte = new Image();
		fonte.onload = function () {
			var w = fonte.width, h = fonte.height;
			var tela = document.createElement('canvas');
			tela.width = w;
			tela.height = h;
			tela.className = img.className;
			tela.setAttribute('role', 'img');
			tela.setAttribute('aria-label', img.alt);
			tela.style.cssText = img.style.cssText;
			var ctx = tela.getContext('2d');
			ctx.drawImage(fonte, 0, 0);
			var original = ctx.getImageData(0, 0, w, h);
			var px = new Uint32Array(original.data.buffer.slice(0));
			var saida = ctx.createImageData(w, h);
			var out = new Uint32Array(saida.data.buffer);

			var opaco = function (x, y) {
				return x >= 0 && y >= 0 && x < w && y < h && (px[y * w + x] >>> 24) > 0;
			};

			// Centro e raio do globo
			var esp = ESPECIAIS[nome] || {};
			var g = esp.globo;
			if (!g) {
				var x0 = w, y0 = h, x1 = 0, y1 = 0;
				for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) if (opaco(x, y)) {
					if (x < x0) x0 = x; if (x > x1) x1 = x;
					if (y < y0) y0 = y; if (y > y1) y1 = y;
				}
				g = { cx: (x0 + x1 + 1) / 2, cy: (y0 + y1 + 1) / 2, r: Math.max(x1 - x0 + 1, y1 - y0 + 1) / 2 };
			}
			var anel = esp.anelNaFrente;

			// Quais pixels se mexem: dentro do globo, longe da borda (o contorno fica parado)
			var movel = new Uint8Array(w * h);
			for (var j = 0; j < h; j++) {
				for (var i = 0; i < w; i++) {
					if (!opaco(i, j)) continue;
					if (!opaco(i - 1, j) || !opaco(i + 1, j) || !opaco(i, j - 1) || !opaco(i, j + 1)) continue;
					if (anel && j >= anel[0] && j <= anel[1]) continue;
					var dx = (i + 0.5 - g.cx) / g.r, dy = (j + 0.5 - g.cy) / g.r;
					if (dx * dx + dy * dy >= 1) continue;
					movel[j * w + i] = 1;
				}
			}

			// Anel: pixels da faixa do anel que não são do globo. Cada um ganha uma posição
			// na elipse do anel (raio e ângulo); girar = andar com o ângulo.
			var anelPx = null;
			if (esp.anelLinhas) {
				var mascara = new Uint8Array(w * h);
				var ax0 = w, ax1 = -1, ay0 = h, ay1 = -1;
				for (j = esp.anelLinhas[0]; j <= esp.anelLinhas[1]; j++) {
					for (i = 0; i < w; i++) {
						if (!opaco(i, j) || movel[j * w + i]) continue;
						var gx = (i + 0.5 - g.cx) / g.r, gy = (j + 0.5 - g.cy) / g.r;
						var foraDoGlobo = gx * gx + gy * gy > 1.06 * 1.06;
						var naFrente = anel && j >= anel[0] && j <= anel[1];
						if (!foraDoGlobo && !naFrente) continue;
						mascara[j * w + i] = 1;
						if (i < ax0) ax0 = i; if (i > ax1) ax1 = i;
						if (j < ay0) ay0 = j; if (j > ay1) ay1 = j;
					}
				}
				var ex = (ax0 + ax1 + 1) / 2, ey = (ay0 + ay1 + 1) / 2;
				var ea = (ax1 - ax0 + 1) / 2, eb = (ay1 - ay0 + 1) / 2;
				var lista = [], raios = [], angulos = [];
				for (var k = 0; k < w * h; k++) {
					if (!mascara[k]) continue;
					var ux = ((k % w) + 0.5 - ex) / ea, uy = (Math.floor(k / w) + 0.5 - ey) / eb;
					lista.push(k);
					raios.push(Math.sqrt(ux * ux + uy * uy));
					angulos.push(Math.atan2(uy, ux));
				}
				anelPx = { mascara: mascara, lista: lista, raios: raios, angulos: angulos, ex: ex, ey: ey, ea: ea, eb: eb };
			}

			var p = {
				tela: tela, ctx: ctx, saida: saida, out: out, px: px, movel: movel, anel: anelPx,
				w: w, h: h, g: g, visivel: true, ultimo: -1, chave: ''
			};
			img.parentNode.replaceChild(tela, img);
			ajustarNitidez(p);
			desenhar(p, 0);
			planetas.push(p);

			if ('IntersectionObserver' in window) {
				new IntersectionObserver(function (e) { p.visivel = e[0].isIntersecting; }).observe(tela);
			}
		};
		fonte.src = SPRITES[nome];
	}

	// Ampliando: pixels nítidos. Reduzindo (planetas pequenos na página inicial): suave.
	function ajustarNitidez(p) {
		var largura = p.tela.getBoundingClientRect().width * (window.devicePixelRatio || 1);
		p.tela.style.imageRendering = largura >= p.w ? 'pixelated' : 'auto';
	}

	function desenhar(p, t) {
		var lon = calmo ? 0 : LON_MAX * Math.sin(t * 2 * Math.PI / PERIODO_LON);
		var lat = calmo ? 0 : LAT_MAX * Math.sin(t * 2 * Math.PI / PERIODO_LAT + 1.3);
		var cl = Math.cos(lon), sl = Math.sin(lon), ca = Math.cos(lat), sa = Math.sin(lat);
		var w = p.w, h = p.h, g = p.g, px = p.px, out = p.out, movel = p.movel;

		for (var j = 0; j < h; j++) {
			for (var i = 0; i < w; i++) {
				var k = j * w + i;
				if (!movel[k]) { out[k] = px[k]; continue; }
				// Ponto na esfera visto de frente
				var x = (i + 0.5 - g.cx) / g.r, y = (j + 0.5 - g.cy) / g.r;
				var z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
				// Inclina a esfera (para os lados, depois para cima/baixo)
				var x1 = x * cl + z * sl, z1 = -x * sl + z * cl;
				var y2 = y * ca - z1 * sa, z2 = y * sa + z1 * ca;
				if (z2 < 0) { var n = Math.sqrt(x1 * x1 + y2 * y2) || 1; x1 /= n; y2 /= n; }
				// Procura o pixel da arte; se cair no contorno, puxa um pouco para dentro
				var cor = px[k];
				for (var tentativa = 0; tentativa < 4; tentativa++) {
					var f = 1 - tentativa / g.r;
					var si = Math.floor(g.cx + x1 * f * g.r), sj = Math.floor(g.cy + y2 * f * g.r);
					if (si >= 0 && sj >= 0 && si < w && sj < h && movel[sj * w + si]) { cor = px[sj * w + si]; break; }
				}
				out[k] = cor;
			}
		}

		// Anel girando: o desenho do anel fica igual; o que gira são "pedaços de gelo"
		// mais claros e mais escuros dando a volta (3 tons, para continuar pixel art)
		var a = p.anel;
		if (a && !calmo) {
			var giro = t * 2 * Math.PI / PERIODO_ANEL;
			for (var n = 0; n < a.lista.length; n++) {
				var ka = a.lista[n];
				var ang = a.angulos[n] - giro, r = a.raios[n];
				var onda = Math.sin(7 * ang + 5 * r) + 0.7 * Math.sin(13 * ang - 9 * r + 2.1);
				var fator = onda > 0.9 ? 1.18 : onda < -0.9 ? 0.84 : 1;
				var c = px[ka];
				if (fator === 1) { out[ka] = c; continue; }
				var cr = Math.min(255, (c & 255) * fator), cg = Math.min(255, ((c >>> 8) & 255) * fator), cb = Math.min(255, ((c >>> 16) & 255) * fator);
				out[ka] = ((c >>> 24) << 24 | (cb << 16) | (cg << 8) | cr) >>> 0;
			}
		}
		p.ctx.putImageData(p.saida, 0, 0);
	}

	var inicio = performance.now(), anterior = 0;
	function laco(agora) {
		if (agora - anterior >= INTERVALO) {
			anterior = agora;
			for (var n = 0; n < planetas.length; n++) {
				if (planetas[n].visivel) desenhar(planetas[n], agora - inicio);
			}
		}
		requestAnimationFrame(laco);
	}

	function comecar() {
		var imgs = document.querySelectorAll('img.planeta[data-planeta]');
		for (var n = 0; n < imgs.length; n++) preparar(imgs[n]);
		if (!calmo) requestAnimationFrame(laco);
		window.addEventListener('resize', function () { planetas.forEach(ajustarNitidez); });
	}

	if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', comecar);
	else comecar();
})();
