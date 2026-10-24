// Pixel arts animadas dos destinos da viagem.
// Uso: <canvas class="planeta arte-destino" data-arte="buraco-negro"></canvas>
// Cada arte é desenhada numa tela pequena (128 x 128) e ampliada com pixels nítidos.
// Os tons são limitados a uma paleta curta, para continuar com cara de pixel art.
(function () {
	var TAM = 128;
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	function cor(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
	function hex(h) { return cor(parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)); }
	function paleta(lista) { return lista.map(hex); }

	// Ruído suave (3D: x, y e tempo), para gás e turbulência
	function hash(x, y, z) {
		var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	}
	function suave(t) { return t * t * (3 - 2 * t); }
	function ruido(x, y, z) {
		var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
		var u = suave(x - xi), v = suave(y - yi), w = suave(z - zi);
		function l(a, b, t) { return a + (b - a) * t; }
		return l(
			l(l(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), l(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
			l(l(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), l(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
	}
	function fbm(x, y, z, oit) {
		var s = 0, a = 0.5, tot = 0;
		for (var i = 0; i < oit; i++) { s += ruido(x, y, z) * a; tot += a; x *= 2; y *= 2; a *= 0.5; }
		return s / tot;
	}
	function pontilhar(v, x, y) {
		// pontilhado ordenado 2x2: suaviza a passagem entre tons sem perder o estilo
		var m = [0, 0.5, 0.75, 0.25][(x & 1) + ((y & 1) << 1)];
		return v + (m - 0.5) * 0.12;
	}
	function tom(pal, v, x, y) {
		v = pontilhar(v, x, y);
		var i = Math.max(0, Math.min(pal.length - 1, Math.floor(v * pal.length)));
		return pal[i];
	}

	// ---------- Sagittarius A*: o buraco negro ----------
	// Inspirada numa ilustração de buraco negro (no estilo do filme Interstellar):
	// o disco de gás inclinado na diagonal, branco-amarelado perto do buraco e
	// laranja/vermelho nas pontas; a parte de trás do disco aparece "dobrada" por
	// cima do buraco (a gravidade entorta a luz); uma sombra alaranjada escura com
	// um anel de luz fino e branco; e um brilho avermelhado em volta.
	var PAL_BURACO = paleta(['#05030c', '#1c0403', '#3d0903', '#6a1404', '#9c2405', '#cc3c07', '#ef5e0c', '#fb8618', '#ffad30', '#ffd062', '#ffeaa6', '#fffbea']);
	var INCLINACAO = -0.42;   // o disco sobe da esquerda para a direita
	var ACHATADO = 0.27;      // o disco é visto quase de lado
	var SOMBRA = 0.19;        // raio da sombra
	var estrelasBuraco = [];
	(function () {
		var s = 5;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < 60; i++) estrelasBuraco.push([(aleat() * TAM) | 0, (aleat() * TAM) | 0, 0.3 + aleat() * 0.5, aleat() * 6]);
	})();
	var LIM4 = [0, 0.5, 0.75, 0.25];
	// preto da sombra: um tom diferente do fundo (#05030c), que vira transparente no recorte
	var PRETO_BURACO = cor(1, 0, 2);

	function buracoNegro(buf, t) {
		var c = TAM / 2, ci = Math.cos(INCLINACAO), si = Math.sin(INCLINACAO);
		for (var y = 0; y < TAM; y++) {
			for (var x = 0; x < TAM; x++) {
				var sx = (x + 0.5 - c) / c * 0.82, sy = (y + 0.5 - c) / c * 0.82; // 0.82 = um pouco de zoom
				// coordenadas "do disco": X ao longo do disco, Y para fora dele
				var X = sx * ci + sy * si, Y = -sx * si + sy * ci;
				var r = Math.sqrt(X * X + Y * Y);
				var rho = Math.sqrt(X * X + (Y / ACHATADO) * (Y / ACHATADO)); // distância no plano do disco
				var fi = Math.atan2(Y / ACHATADO, X);
				var v = 0, k = y * TAM + x;

				// brilho avermelhado em volta, esticado ao longo do disco
				v += Math.exp(-rho / 0.55) * 0.45 + Math.exp(-r / 0.5) * 0.16;

				// disco de gás: mais claro perto do buraco, com fiapos girando
				if (rho > SOMBRA * 1.15 && rho < 1.05) {
					var giro = fi - t * 0.5 / Math.pow(rho, 1.5); // perto gira mais rápido
					var fios = fbm(Math.cos(giro) * 2.5 + 7, Math.sin(giro) * 2.5 + rho * 9, t * 0.15, 4);
					var perto = Math.exp(-(rho - SOMBRA) / 0.2);
					var borda = 1 - Math.max(0, (rho - 0.75) / 0.3);
					v += (0.25 + perto * 1.1) * (0.45 + fios * 0.9) * Math.max(0, borda);
				}

				// a parte de trás do disco, entortada por cima da sombra (o arco largo de cima)
				if (Y < 0.02 && r > SOMBRA) {
					var arco = Math.exp(-Math.pow((r - SOMBRA - 0.075) / 0.07, 2));
					var lado = Math.max(0, -Y / r); // mais forte bem em cima
					var fiosArco = fbm(Math.atan2(Y, X) * 3 - t * 0.6, r * 12, t * 0.2, 3);
					v += arco * (0.5 + lado * 0.7) * (0.55 + fiosArco * 0.8);
				}
				// arco fininho por baixo da sombra (imagem secundária)
				if (Y > 0 && r > SOMBRA) v += Math.exp(-Math.pow((r - SOMBRA - 0.018) / 0.018, 2)) * 0.55;

				// sombra: preta de verdade, só com um vermelho bem escuro pontilhado na beirada,
				// e o anel de luz fino em volta
				var naSombra = r < SOMBRA;
				var naFrente = Y > 0 && rho > SOMBRA * 1.15 && rho < 1.05; // o disco da frente passa na frente da sombra
				if (naSombra && !naFrente) {
					var beirada = (r / SOMBRA - 0.82) / 0.18; // 0 a 1 só nos últimos 18% do raio
					buf[k] = beirada > LIM4[(x & 1) + ((y & 1) << 1)] + 0.25 ? PAL_BURACO[1] : PRETO_BURACO;
					continue;
				}
				// onde o disco da frente passa por cima da sombra: só a faixa mais clara do disco
				// aparece, como um anel de luz amarelo bem forte; o resto continua preto
				if (naSombra && naFrente) {
					var faixa = v * (0.4 + 0.6 * r / SOMBRA);
					buf[k] = faixa > 0.42 + LIM4[(x & 1) + ((y & 1) << 1)] * 0.06 ? tom(PAL_BURACO, 0.72 + Math.min(1, faixa - 0.42) * 0.3, x, y) : PRETO_BURACO;
					continue;
				}
				if (Math.abs(r - SOMBRA) < 0.012 && !naFrente) { buf[k] = PAL_BURACO[11]; continue; }

				// cantos escuros
				v *= 1.12 * Math.min(1, 1.5 - Math.sqrt(sx * sx + sy * sy) * 0.85);
				if (v < 0.25) {
					// borda do brilho: em vez de pixels quase pretos, pontinhos vermelhos cada vez
					// mais espaçados, que somem no fundo
					buf[k] = (v - 0.08) / 0.17 > LIMIAR4[(x & 3) + ((y & 3) << 2)] ? PAL_BURACO[3] : PAL_BURACO[0];
					continue;
				}
				buf[k] = tom(PAL_BURACO, Math.min(0.999, Math.max(0.32, v)), x, y);
			}
		}
		// estrelinhas de fundo, só onde está escuro
		estrelasBuraco.forEach(function (e) {
			var k = e[1] * TAM + e[0];
			if (buf[k] !== PAL_BURACO[0] && buf[k] !== PAL_BURACO[1]) return;
			var b = e[2] * (calmo ? 1 : 0.6 + 0.4 * Math.sin(t * 1.5 + e[3]));
			buf[k] = cor(200 * b + 30, 190 * b + 30, 200 * b + 40);
		});
	}

	// ---------- Nebulosa de Órion ----------
	// Feita a partir da foto do Hubble (luz visível, 2006). O formato e as cores vêm da própria
	// foto, no tamanho da arte (FOTO_ORION, 128 x 128, com os véus realçados): o centro creme do Trapézio, o rosa-malva e o lilás
	// em volta dele, a nuvenzinha rosa de cima (M43) com a faixa escura, a poeira marrom e
	// dourada saindo para a esquerda, o castanho-avermelhado da direita, os véus cinza-azulados
	// das bordas e os cantos escuros. Por cima: o gás se mexendo devagar, fiapos e veios,
	// cores mais vivas, poucos tons com pontilhado (cara de pixel art) e as estrelas.
	// a foto do Hubble (NASA/ESA, domínio público) no tamanho da arte, 128 x 128, guardada em base64
	// (3 bytes por pixel: vermelho, verde e azul). Dá o formato, os véus de gás e as cores de verdade
	var FOTO_ORION = 'CAILCgQPDQcSDwgTEAkTEgsVEgsVEwwWFA0XFA0YFA0ZFRAbExAaExEdFRMeFhQfFRMfFhQfFhQeFBQZFBQbFBQdExUeFBchFBYhFBciFRgkFholFRkkFRkkFRgkFxomGBsnFBgjFRgkGB0nExciERciFBgkGxonHhgmHxglGxciGhchFxUe' +
		'FBMaGhgfGxgfFREXFhIXFhQaFRQaExMYExIYFBUaEhIWFBIVFhQWFhQXFRMWFxUYFhQXExMTERAQExARFBMSFhYUEhIQEQ8QGBYXDwwNEA0PEA0QEhARExMQFBUQEhIQEhIQEhIQFBQUExQTERYUEhgVERkXERoZFB4dEx0bERgaEBcZEBYY' +
		'EBQXDxMVDRIVDBIWChAUJikuCg8VBgsSBgsRBgoRCAsSCgwTCQkRCQkRCwoSCQoSCAsSCAsTBwkRBwkRCAsSCAoSBwgQCAkRBwcPCAcPCgcRCQYPCAcMBwcMBwcMBwgNBQgMBgoPBQ0QBA8QBQ8RAgwNCgUODgYSEAkUEQsVEgwWFA0YFQ4Y' +
		'FQ4ZFg8aFhAbFxAdGBIeFRIdFBIeFRMeFhQgFxUgGhckGRciGBghGhokGhkkFxkkEBIeFRcjFBknFRonFhsoGB0qGB0qFxwpGB0qFxwpGyAtGh8sHyQxHSEvFh4qFx4pHx8tIiAtIB0qHhwoHxwmJSQsGBcfGRYdHBgfHBceGxYdHRkhGxog' +
		'GBcdGhkfGxwhGBgdFxUZGhcaGhgbGRcaGxgcGxgbFxcXFhUWFhQVGBcVGRgWFxcVFhQUEg8RFhQVFRMUFhMVGBYXGRgWFhcSFRUSFBQSFRUTFxYWFhYWEhYVFBoYGR4dGB4eGCAfFx8eFR4fExsdFRodERUZEBQYEBQYEBUYDRMWO0BEDhMY' +
		'ChAVDhMZCxEXCA4UCg4UCAwTDA0VDg8WDA4WDRAYDRAXCg0UCg0UCw4VCw4VBwsSCAwTCg4VCg0UCAkRCQoRCAoQCQwRCQ0SBwwRCA0TChAWBxEUBRASBxMVBhASCwYQDwkUEgwWEgwWEw0XFQ8ZFREaFREaFREaFBAbFREcFhIeFBIdFBId' +
		'FhQfFhQfFxUgGBUgGBciFhciGRklGhsoExUiNTdGGR0sDxYmExoqFh0tHCMyHiU1HiU1GB8uFx4tGSAwHyY1GSAvGSAvGCIuGyQwHiQxHiIuHyEtHyEtHh8pHhwmGxghGxchGhUdHRkgGxceHRohHRshHRwiHh0jHR0jGxwhHh0hISAiGhoc' +
		'HBseGhkbGRkbGRkaGhkZGBYXHRwbHx8dGxsZFxYVFRUUFhUUGBcWGBcWGhoZHR4aGRsWGhwZGBkXFRYUFhgXGBoaGRwbGBsaGBsbGRocGRscGBwdFRseFBocFxseExgbERYZERYZEhcZExgbCg8SDBEVDRMWDhQZDBMZCxQZCRAWCxIYEhcd' +
		'ERYcDBEXDBEXDBAXCg4VCQ4UCg4UCQ4UBw8VCBAWDBMYChEWCxIYChAWBg4TBw8UCBAVCBAWCBAVCRIXBxMVBRITBxUWCBYXDQcSEgsWFA4YFQ8ZFhAaFhAaFBEaFBEaFhMcFRMdFRIdFRIdFRMeFRMeFRMeFRMeFhQfGBUgFxYiFhYiFRYj' +
		'FRclFBYjJik4FxwrEhsqEhsqFR0tFx8vGCAwICg4ISk5ICk4Hyc3Hyc3HCQ0GyMzGCEvFyEvGCIvGiIvHSMwHiMwICIuISAqIh4pIx0nKCIsHhsjHxwjIB0kHh0jHx8kIiEnHh8kHh8kISAlHx4iHBsgHR0hGhoeFxYaFhYXGRkZGxgaHRsa' +
		'ISAeIiIgHh4cHx8dHR0bHR0bHBwaHh4cISIfHiEbGx0aHB4bGhwZGBoZGBoZGhwbGBoZGRsaGhsdGRocGBocFxwdHiQkGB4eFx0eFRscFBobEhsbExsdExocDxcZDRUYERkcERoeEBkeDRUbDhUbDhQaDhMZDhMZDhMZDhMZDxQaEBUbERYc' +
		'DxUbDhccDxkdDxkeEBoeDhkdDxkeDhoeDRkdDRgcDBcbCxYbDBccCRgZCRgZCBgYCBcXEQoUFA4YFQ8ZFhAaFhAaFxEbFhMcFRMcFhMcFRMdFRIeFhMeFRMeFRMeFRMeFxUgGRciFxUgFxchFRgjFxklFhklFRklEhUjFhspHSQzEBgnFBwr' +
		'FR0sFBsqFh4sGCAuGCAvFx4tGCAuHSU0HiY1GiIyFyAvFB0sEx4rFx8sHCEwHSAsIyMtKiYxLiUyMis1Ih8oKyoxIB0kJiUrJiUrJSQqIiMoISInJCQoICAkGhoeGBgdGBcdFhYaGRoaHR0dIyAiIyIgIiEfJiUjJSUjIiIfHx8cICEeHh8c' +
		'Hh8cICIeHSAbGRwZHB8cGBsXGRwaHSEgGB0cGRwbHiAfGxseHB0fHB0fGx8gGR4fGyEhGiAgFR4dFR8dGCEgGSEhFh4gFBweFBweFx8iFh4jFR0jDxcdERgeFBogFRogFRogEhcdFBogFBkfExkfExkfEBcdDhccDRYbDRgcEBsfDxseDhwf' +
		'DhshDRogDBkfDBcdDRceDRgdChcaDBoaCxoaBhQVEgsWFQ8ZFhAaFxEbGRMdGBIcFRQcFxYeFhUdFRMdFhQfFhQfFhQfFhQfFhQfFxUgGBYhGBUgFxYhFBchGBslFRolFxsnFhsnERcjEBckERglEhknGB8sHCMwGyIvHCMwHCMwGyIvGB8s' +
		'Fx4sHCMwGyEyGiAzGiQzFyMxGCAuGR4sHSAtICAsQDtGOzE/Jh4pIyApHx4lJyQrKCctKyowKSguKysxKSovJicrJSYqICElGhsfFRYbExQYGBgYHx4eJCIjJSQjKSgmJyYlJygkJCYhIyUgICIcICIdIiQeIiUfHSIcHCIdGiAcGyAcHCAe' +
		'HiMiISclIiclISUkKSstICAjICEjHSEiHyMkHiQlHyYlGiMiGSIhGiMiHCUjGSIiGCAiFyAiFR4gEhkeFBshFx0jGh8lGx8lHiIoICQrGCAlFRwiFBshExogExogERgeDxcdDxgdERsfEhwhER4hDx4hDRogDRshDxshDhkfDRYdDBUcChUY' +
		'ChYYChYYBhIUEwwXFBAZFREaFREcFhMdFhQeFRMeFhUfFhUfFxUgFxUgFxUgGBYhFxUgGBYhGBYhGBYhGRciGBcjGBkkGRsmGRwnGB0nFhslEhcjExYlFBglGx8sHiIvHyQwHyMwHiEwICQzJCc2Iig2GyEtGCArGSAwHiQ1Jiw9KC8/Jio7' +
		'JSg5Jyg3Kyo3Lyw4LScxKyQsKiIpJyQpKyswKSovKiovLSwyLi4zMzI3LCswJiYqIiMmISEjHB0fGhocGhoaHBwaHx8eIiIkJiUpKCYuJykqJCYjISMeIiQfJykkJSckICMgHiMfHyQgIyklHiQiHiQiHyQiIygmJispJysrJyssJSkqJSkp' +
		'JCcmJCYmISQjHyIiICMkIiUmHSUkGSIiGiIjGB0gFxwgGB0hFyAiHSYoGyIlHyUoISQpISQrHiIoGx8kGR8kGR4kFxwiExkhEhogERkeERogERohEhshFB4kEh0kEBshEBwiERwiERsiDxkfDBYdCxYaCxUZDRgbDRkbEwwXFA8ZFBEaExAb' +
		'FBEdFhQfFhQfFhQfFhQfFxUgFxUgFxUgGBYhGBYhGBYhGBYhGRciGhgjGhkjGxsmHBwmHiApHiEqGh4nGBwmFxsnGx8rHSEtGBwoHCArHyMvHiIwISQyHyMyHiQzIik2HyY1GiQzGiQyHic2HSY1Hyc3KTBALTA+MTE9MzE8LioyMCowMigt' +
		'MCovLCsxKSguLiwzMTA2Li4zMC81MC80Ly4zIyInISAjHx8hHh4gHhwhHh4gHyAgICIhIyQlJyotKCwuJCcmIiQhIiQfKSslJSUjISIfHyMfHiMfOD06JSopICclIiclIiYlJCcnJSkqJCgpKS0uKiwvLC0sLC4tJigoJSYoKCkrLS8xKC4v' +
		'IigrISYpISYpISMoICInHSIlHSImIiYrJSkuICMqISQrIiUrIyYrICUqHSEpHCAoGiEqFx8nFB4iFB0jERoiExwiFh8nExslFB4mFR8nExwlFh8nExwkDRcfCxQaChUZDhkeEBseEwwXFA8ZExAZExAbFBEcFRMeFRMeFhQfFhQfFxUgGBYh' +
		'GRciFxUgGBYhGhgjGhgjGRciGhgjGxgjHxwmHx4nISEqIyMrJSUuICIrGh4oGx8pFxsmJCgzIygzICUwIiYxJCg0JCg2JCk5JSo8Jis+ISw7ICw6HCc1GyY0GiMyIyw7LzNANjVANjQ+MzA4NjA3OTE2Ni81Myw1LyozMS42Li41Ly82Kywy' +
		'KSkvKiovKSkuJCQpISElIiImHxsjIB0jICAlISUnJiwuJS0xJCotJCgqIyYlIyQhJCUhJCQiJickIiQhIiYiIickJiopIicmIiclJCUlISIkKCkrKCksJygsJycrKSsrKywtKCkrKisuNDU5MjM3KS0wJCgrJiktKCovIyQpISIoICAmHx4l' +
		'IyIqIyQtICMrISQsJyoyJioxICQsHSEqHCApGR8qFh4mEx0hEx0jEhsiFh8mFyApEhskExolFRwnDhYgNj1HKzM8DRUfDxgeDxgdDhoeDBcaEwwXFA8ZFBEaFBEbFRIdFhQfFRMeFhQfFhQfFhQfGBYhGRciFxUgGBYhHhwnHBolHBolGxkk' +
		'GxkjHxwlIR4nJCAqJyMsJyMsJyQtJCMsHx4oHBwnIyQvJCYyICIuICQuISUwICMwIyY2IyY4JCU6KSs8Jig4LjA/MjVEMDNCLzFBMTE9NzU+OTc/NzM6OjU7Pzk+Pjc+OzQ/VU9aOjdALCs0KCoxKy41KioyJSUsJiYtJicsJCYqJSUpJiIo' +
		'JSIoIyMqIycyHiY2QEheLTQ/IygrJikqJSclJSUjJSQiJCQiJCYjJiglJSglJyopIiYlIiUkISIkJCUoJCUoJiYqJCUqKCktKCksKCktKisvMDE2MTI2KysxKS0wKS0wKy4zKiwxJSUsIiIqJCIsJiItIiErHx8oIiMrIiUtIiUsISQrHiIp' +
		'HyMsHCAqGiArGSApFh4kFR0kFR0kGiIqGyMrFh0oFRonFx0pGR8rExklEhckExklExohExshERofDxkbFA0XFRAaFRIbFRIdFhMeFhQfFRMeFRMeFhQfFhQfGRciGRciGBYhFxUgHRsmHhwnIB4pIB4pIh4oJSAoJyAoKSEpJyAoNSw1MCcw' +
		'LCYtJiApJB8pJCIsIh8sIiAtIiQtICIsJSUxJyYzQkFPamd2MCs6NzE/NzJANjJAOjdEPTpINTM+ODU8PjtCPztBOzY8QTxBRT9GPDlEZmRvQEBKMTE6Kiw1Ki02JycxJCQtJycvJicuJSYrIyQpJyUoJCQnIyUrISc0Iio/eIGZP0ZVICUs' +
		'JiksJCUlIiIgJiUjKSgmKCgmJCYjJSclIyUkIiYlIycnIyMmJiYqIyInIiEmJSQpJycsLS4yMjM3NDU6MDA2LS00Nzc/LzQ4JSsuKy80KS0zKCkxKCgwJCQuISApHx4mICAnIyQqJSYrJCYrIyYrISYqICUrHiMpGyEqGSAoGSAmGSAnGSAo' +
		'GSAnGSAqFx4pGB0oFxwnGBwoGB0oFxsmFBkkExohFBwhEhsgEBkdFQ4YFREaFhMbFhMeFhMeFhQfFhQfFBIdFhQfFxUgGBYhFxUgFRMeFxUgGBYhGxkkHRsmIR8qKCUtLSUtLiUtMCYvLyQtLyMtMSUvNSkxMykxMCcxLycyLyo3Lio4JiQw' +
		'JiQvKicyLCk0PzpFU0xXOzVAPjlEQDxHOzhCOzlDOTdCQD5FQD1EQD5ER0RJRD9FR0JIPzxEPD5IMTQ+MDM9MzZALzI8Ki03IiUvJSgxJScwIyYuKCsyJCYtJykuJCYqISYpISkrIy0yIy02HyYzICQwHSEnIyQmKSgmLComLiwpKiooKCkm' +
		'KiwqJScmJykoJignJiUqJiQqJCMoIyInJiUrMTA2MjM4MDE1Li81MTE4MTE5MTE5LDM3Jy8yKC4zKzA2Ky41KSw1JCgwIycuJSgtKSovKSouMTE2Ki0vJiotJisuIygrICUoHCMnHCMoHiUrHyYuHiUtGiIqHCMtGiErGh4oGBwmFxslFxsl' +
		'FhokFRkjFRwiFRwiEhsgEBodExAaFRIdFRIdFRMeFhQfFxUgFxUeFhQdFxQgFxUgFxUhFBIeIB4pGBYgFhYhGBcjGxkmIBspJiEuJiIqLiUtMictMCQqMCQrMSYsMiUsNyo0OCw5Nyw6Niw4OTI6MSgvMigwNCs0Mys0My03NTA7Nzg/NTg9' +
		'NjY8PD1DODk/NDc8QD9DRUJGSEZLTUtRRkRJRURGPD1CNDlDNz5INDhEMjE/LS07JCc1HiIuIygyHyYuICgtJSouKCswKCovJSksIicpHSUmHSgpIi8wISowICQtJSctKCkrKSopJyklKCspKCsqJiglKCknKywqKikqKSgqKSgrKSksJiUq' +
		'Li0zNjU7ODc+MDI3MDM5MzU8MTI6LjA3KiwzJisuJiwuKC0wKS0wKS0wJysvKCsvKCouJigrKCgrKiotKisuLC0uKSssKCotJSYsISUrHyYqGyMmHSMpHiQrHyUsICYsHiQrHiMsHiIrHiEpHB8pHR4pHR0oGBgkFhkiGBwjFx0iEhoeExEb' +
		'FRMfFRMeFRMeFhQfFxUgFxYeFxYfGBYhGBYhFxUhFRMgKSYyGhciGBgiFxcjGxkmJB0tNC89IR8pLCUtMCUrMSUoMCMqLSIoLyQoOCs1MyY3MiY2Nio1OzE3MSIoPy41RzdAQzU/PzZANjA6KSsvMDM3NTU5PDs/QEBDPT9APT4/Pz5CRURK' +
		'TEpRSUhOREVGPT5CMzhBMTpDOT9KODdFMzNCJSo4HSQwHSYwHiowIi4xJS0wKCwvKi4uKC0uJSotIysvISowISsxICktJCgrKisvLCwvLC0tKy8tJy0rJCkoKSspLy8tLCsoLyssODU4NTU2MjI0MC80MC80MTA3NDM7MjU6MjU7MjU6LTA2' +
		'LC80LC80Ky8wLTExLTAxKy8vKy8vKy8vLC0uKiosKystKystKiosKCkqJyknKCgnKCcsJyYuICIqHiQoGiElHCAnICQqIyguJCkvIyguISYsHiQsICQtHyEsHh4rHh0qHBooGxslGBshFx4gExseFBIdFxUgFxUgFxUgFxUgFxUgFxYeGBYf' +
		'GBYhGBYhFxUhFxUiFBEdHBolGhkkIB8qIR4rIhwqIx8rJCIsKCMrLyUsLyMqMygwMygvLCEoLiIsNSc1Oiw7Nig1MCArOiczRTE9RjI9RjVATD5IRTtDQj1DQT9ERD9DQDw+Pjo8OTg5MzU3NDg8U1VaR0ZPTUxTR0RLR0RMPkBKNDxFNz1I' +
		'NTdEMDVDIis4JCw4JCw4Ii01JS81JC0xKS8yKzEyKC8vKS8yKS8zJy4yJywyJiovKiwwLS0wMDAyLy8vLCwrLC0sLi4uMTEvLi0qMi8tPDc4Ojc4MzI0MTEzLSwxLCsxMC41MzI5NDU5NTY6MjM3MDE1MTI1MjQ3MjQ0MTMyMDIxLzEwLi8v' +
		'KiwrKSorJycqJycpJycoJyYnJSQlIyMiJCQjJiUoJiQqISEmHSElHCEmHiIpIiYtJCcuIycuJywyJisyISgvHiQsHiMsICIuICAsHRwoHR8pHiIoHCMlFB4fFRMdFxUgFxUgFxUgFxUgFxUgFxYeFxYeGBYhGBYhFhQgFRMgFhUhGBYgGxkk' +
		'IB0oIRwoIhwoIBomIBwmKCMsLygxLiQuMicwLyQtLiIrMiUuMiMuMh8sSjRDUjtKUDxLVEBPSTVCSjlDSDpBTUJIU0tVWVFcWFBYVEtRRD5DPjtANzc8ODtAOTk/Pz1ERUJKREBLRkNNREVPNTxFKzI9LTA8LDNAIi05KjI/KjE+JzA5KC82' +
		'LTQ4LTU4KDIyKjQzKzE0Ki0xKi0xLS4zLC0xKywvLzAxLzAwMC4vMjAxMTAwLy4uNTQyNzUxOzY0OzY3NzQ1MjIzMzQ2MzM4Li4zLi40MTE3MzQ4MzU4NDU3NDU2NDY2NTY3NzY2NzY3NTQ0MC8wLCssLCssLS0uLCwuKisrJiYmJSMjJCEh' +
		'ISAfIiIhIiAhIiEkJCMoJCUqJCYsIyYsJSctIiUsIiUrJCkuJCguIikvHyYsHSIqHyEqISItHx8rGx0mHiEmHyQoGSIjFRMdFhQfFhQfFxUgGBYhGRciGBcfFxYfGRciFxUgFhQfFBIfFRMfFhQeGhciIRomIBkkIRslHxskHxkjIhwnJSEs' +
		'KiMvLyUxLyQuMSQsNygvNiMpWUNNWz9Na0xfXURVX0hXY0tZalRgYU5XWkpSYE5edmR1bl1nZFJZaFpfZlphYVZdVk1VSEBIPzg/PTlAQT5JPjxHOjtFNjtFKy86LCw6MTVDKDA+KTA8KS87LDA5MTQ6Nzs/MDY5LDU0LDU0LDIzKzAyLjE1' +
		'MTI2MDEzLzExLjExLzIxMjIyODY3MzExMjEvOTg0OTczNTMvODUzNzc2NTY3NDU4MjM3MTI2NDU6Njc+NTU6NjU5Ojo9Nzc5NTY1OTo5ODc3NTU1NDM0Ly4uKyorLi0uLCwuLCwuLy8vKykpKiglLCckJiMhJiYkKScmKycmKykrKikuKCgu' +
		'JCMpIiMoIiQpIyYrJSktICUqIScsHyQqHyIpISErIyItIiEsHx4mIiImICMmHiMjFRMdFhQfFhQfFhQfFxUgGBYhFxYfFxUeGBYhFhMfFhQfFhQhFRQfFxUgHRcjJBwnIRkjIRwjIBwjIhwlIh4qIh8tJiEvLyg1Nis1OiozPywwPicpTzE4' +
		'WjdFcUpfcE5gd1Zmg2BxhmR0f19vc1dmdldolnWDooCGkG9wim1sfGJkgmpyhW96cmFoTkFIOzU8PzxFOzlEPT5HQEZPQEJOOzlHNjNEMDJBLzQ/NDdBODc/OTk+OTo9NDg5Mzk5Mjc3Mzc3MjY4Mzc4MDQ2MTQzLjIwLjQyMjk3Njo4ODc4' +
		'MzIxNDQxOTk1NjcxNzgzOjo4Nzg2NDY3NDY4NTY6OjtAP0BFPT1FPTxDPz5EPTxBOjk8Ozs8OTg5MjI0Ly8xMDAyLi8wLCwuKiosJygqJSYnKSgpMC0tNDAtNjAtMC4rMDAuMi4rLSkmKicnKicsKicuKScvKikvKiswIycsHyMnIicrJCYs' +
		'IyQsIyMrIyIqJCAsHRolHRojHx4jISIkICMkFRMdFhQfFhQfFxUgFxUgFxUgFRQeFBMcFRQfFRQeFhMfFBIeFBIeFxQfGhQgHRUhHxgiIBskIRskIhslJB4qJiAuJx8tKB8sLSEsNycuQCwvQCUnQSAlTSYwbkNTiFtuiVZsjmF2g1NpgVdp' +
		'hFhpl1dlqWxzlWpqcU9KellThF9blWhuonSAimhwbVdbTD9FQ0BMRENSSUlUPD9KOjlGQjtKPTdHMjJAMjQ+NjY9Ojg9PDs9Pj8+PkNAOT4+OD0+OD0+NDg5MDQ0MzY3NTYzMjcxNDs3Oz89Nzk3NDQzMzMyNDQyOTk1Ojs2Ojw2PD04Ozw3' +
		'ODg3Nzg4Ojs+PT5BPT5BP0BEQUFGPT1CQD9DQkFEOzs7MjIxLi8wLC4vLS4vMDAyLS4vKywtKywsKywrLS0sMjAtNDAsNC8rLiomLSonMSwpLykmMCopMCosLykvLioxLSoxKSovJiYsJCYsJCgtISMoIiQpIyQqIyEpIh0oIRomIBkiIRoh' +
		'Ih8iICAfFRMdFhQfFhQfFRMeFRMeFRMeExMeEBEbEhEbERAaEhAbFBIdFREcFhAcGBIeGRMfGRMfGhQgHBYhIBkjIhokJBomKBwoLR8sMyUxPC40PiwvPSUnPSAjRiUpTywxd0pXlVxxnGp9llptkVZjlVBalkZKgkM/cEU/eVBLkl9cjVBQ' +
		'k1JTunt/o2lulWJkfFldWk9cQEFTPz9MNThDNDI9QjlGQjlHPTlFPDlBPTo+PTo6Pj46PkA7PEE8OT47Oj89PUA/Njg2Nzg4PDs7PTs2PkE6PkQ9Ojk2NDAuNDIvNDQxODc1PDo4Qj87QT87Q0A7QUA6Pz85QUA/REVHRUZIPkFAODw5OTk7' +
		'Ojs8OTo6Li8vLC0rLi8sKy8sKi0rKiopLCoqLiwtLCwsLzAsNjYyNDMvMS0qLywoNDAtNjArNS4oNCwoMiooMyoqMyorMiorLyktLyovLCguKScuKikxJycvJSgsIyUpIyQoJSMpIx8nIBojIBYfIhkeJiEiJSMgFRMdFRMfFRMeExEcExEc' +
		'FBIdEhIcEREbEhAbEQ8aEA4ZExAbFRAcFxEdGBIeGBIeGBIeGBIeFxMeGBUeIBskJh4oMSYxQDM/PS05NiYuOicsPSgpPickQywnQColQCIkSiovhVdfh1BXoVNbnUVJnVFVlVNUh0RCoFdUrGVhomZfiVZNkVlVoVhbs2JonGBjb1ldRkVP' +
		'PT5LOj5JODhBQjpERz9GQTxAQD09QDs5RD86RUA7QD84PT44OTkyPj43QEA6PTs3PTs5QkA+VVFNSUlDP0E5Pjs0OzMuOTUuPDw3QD89Q0A9RUA9RkE+S0RBS0hDRkhDRkhHREdIQENFPkJCOz8+Oz0/PD0+Nzk4LzEvMDMwMDMvLS8rLy8s' +
		'MC8sMi8tMi8tMzIvMjArNDEsODUxNjIvMy0sNjAxOjMwPTYwOjIvNCwpMiopMSgpLyYnLCQmLScpLSgsKSYrKCctJCMpJiYoJSQnIiEkIyEmISAlHh0iHx0gJCEiKikmJiYhFRMdFRMeFBIdExEcExEcEhAbEhEbEhAbEg8aEQ8aEg8aExAb' +
		'FRAcFhAbFxEcGRMeGRMeGxQgGRYgHBskIyEqNS45QzhEPS88PC06MCMsNyQqRCorTC0rTCsmQCEaMSQdJh4YUCYscDE5vlJh1VVmwVttwGp5rF1ik0dHmVhSoW1lh1pTfExKez5CkEtPj1ZYa0xQSj9LOTlINjtGNjZAOzM8QTk9Pzs6Pjs2' +
		'SEQ8TEU8TkY9Rj82Qz82RUE2SEM4SEM6SEM8RUA6R0I+dG9sU1BLQkE4Rj81QjgvQz4yQ0E6QD47QDw5RD47SkNBT0RDTEdFQkZDQkZEPkFAPUFAPkJBPkJAPD8+Oz49Ozw5NDYzMjMvMjMuNzcwOjcxOTMuOzQvPjczPDcyOTQsODIqOjMu' +
		'OzQxPDM0PTM2PDQxOTIrOjMtNi4rMSknLyYmLSMkLSUkKiQjKyYnKSYoKCcrKCcrKCUnKCYnJSQmIiIlICAkHiAkICIjIiUjIyYhISIbFRMfFxUgFRMeFBIdExEcExEcEhAbEhAbFBEcFBEcFBEcFhEdFxEcGBIbGRMcGRMdGxUfHBUfHRgi' +
		'KCcyMS45PDVCSkBOQzhGLiMwLSQtNyMqSCQqVyotYzEyWycnPiMiLicjLyEhRisvZDI5eTtCkE5doGFznWx5qHSBrWp5xneHnV9rglllgV1pgV5mhV9njGh1aVBjSENVP0FRQUNRRUBMQTtAQj8+SUdDUk5HT0g/TEM5S0I4S0Q6R0I2TEU6' +
		'UklATkU8TEM7TUM7SEE8T0xEUExATkQ4T0M5Tkk+REI7RUE+QT06SERBUUxJV1FPSEREPUE/PkE8Oz04Pj87REZCREVBQkM+RUU/SEdCRkM9R0M8RUI6Qzw0PjUtOi4nPC0nQTUuPjMsPTMqPTMqPjUtPjUwPDQwPTMyOTEsOTIqODErNi4q' +
		'MCglMCclKyMiKiUjKyYlKycnKScoJycqJSQoJCMkJSQlISIjHiAjGBsfGR4hHCEiGiAeHSMdHSEZFRQfFxUgFhQfFBIdFBIdFBIdExEcFBEcFhMeFhMeFxIeFxEdGRMdGhQeGxUfGxUfHhgiJB4oKSMuLSg0MCo2MSo3Mis3Miw5LSUxMiQu' +
		'RCs0UyoyYC0zbDg9azU6XywtRSspJCIfOSsvMB4lTD1Ck2x5mG6FpYemupe+wIyzwYChr3aQnHOLl3ePj3CDlW6An3WLkHCJYVZtS0pfR0hdR0RWSkZSRkZKRkVHQz89RkA6SUA4UUc9TkY7T0tBTkpBVE1CV01DTUE3TD40U0xEUVBGVVFE' +
		'XlNGVklBTkpDRkVARkE9R0I/TUpHT01KRkZEPTw7QEE/R0lCS01DTU5FT05GTkxHUExFT0pCTkY+TUQ8S0E4QTUsQjUrRjYsRTIqRzMrSjcuRTMqQjQrQjYtQTUsQjgvPjQrQjkwPjYuNzAoODEqOTIsNCwpNi0rMCknKiclKykpKCcpJSYo' +
		'ISMnHyImHiIlHiIlHSIkHCElGR4iFhsfFhsdGR8eHiQfGyIbFRMfFhQfFBIdFBIdFRMeFRMeFBIdExAbFBEcFREdFhEdFxIeGRQeGhUeHhghIBokJB4nJR8pKCEsKiIvLSYzLSc0Lyk2KygzMiw3QC46Si85WjQ8YDY9ZzxBZDg6cTY0Vysq' +
		'KiAdOCcuQyo3blljqYuboomlyrTizbDqyJ7WwI6/rXickF97lGeCpHWMqnqPnnCIiWiCa1x0UE1lSk1mSUhgTk1fS05ZS0pSR0NGTUZDTUQ9VEpCVU1ES0tESklDU09GXFNKUkM4UT8zUUtCUlJIXVhLZFhNYVRMTklDTkpFUEtHUk5KS0hF' +
		'QUI+QEI+TU5KV1VRXVtUYF5TWllMUU9EVE9IUkk/UEU8UEM6TkE3STowQzIoQTAlPywhQCwiSTIqTDUsSzQsSTYtRjctRTgvQDcsPzcrQjktQTovOzQrOTIrQDo0OzQwNS8tMCwqLSwsLCwtJSYoHyIlICMoHyMnGiEkFx8hGCAjFx4hFhsg' +
		'GB0iFxsfGB0eGiIfGCEbFBIdFhQgFhQfFRMeFBIdExEcEhAbEhAbFBIdFBIdFRMeGRciGhggHBkfIx4lKSQrKSQrJyAoJR8nJR8qKiQxKyQ0Lyg3My04NjA6Oy44RTA2SzI2UDU7Wzo+Zjw8cT05YSsuNCIiJSYmPSsybVVap4mUq5GryLnk' +
		'zbzt0rHj26Tcx4WzoGB6iE9gjltsmWp/oXSKm3eNd2V+WFRsTlJrSUpjT01kU1JlU1FdVlJYVU5OUkxHVlBMTkxJQ0VESkxLUlFOXFVPVkk/UT8yT0tCSUhCU0tCYFRKXFBGVUxEVlBJWFJNVVBMVFBNWFVQYF5XaWVebWZgZF1VXFRMXFNJ' +
		'WVBGVUpBVkU7U0M4UUI3UEA2SzowRTIoRDEkRDIlRDImRzMoUDguVDgxUTguSjksRjowPjctPjguPzYtQzowPzcvOTMtOzYyOjYzMS8uLi0tMDEyLTAxJSksHyImIiMoHyAnGyAkGSEkGSMlFiEjGB4iExgcFhsdFh0cFiAfFiAdFhQfFxUh' +
		'FhQfFhQfFhQfFRMeExEcFRMeFRMeFhQfGhgjHx0oIB4mIx8mKCMqKCMqJiEoJB0lJR4mJyEpKyQtLCUwMCk0NS43NzE5PjQ9SDc7Sjc6STQ6VTtBZD9CbT08b0JENiUmLCcnZU9Tg2VmYEFCfmNyv6vM69n758nr4Kne2JbKtHKcn2KAo2qG' +
		'pW+LqnaRrYSciHSOVlBoQkFYS0ddUEdbUUpbUlBeWFVeV1RWVVNSTU1LSUlKSUlJVVZUVFRRWlhTWFJKVEk/R0Y/REVAUEtFU0pDUUlCUk5IWFBLYVVQZVpXaV5bZ11YbGFZaWBWW1RKXFJJY1RMbFlQa1NMZ09IYE5EWEY8VUU6UkA1Uj40' +
		'Uz40UTwuTTosTjovUDwxUzwyVjo0VjoxTzguRzgvPzYtQjoxQzoxPTYsPDcuOTQuMS0pODYzMjIwLC0tKywtLC8xLTI1JCcrIiMpHx8mHB8kIyktHSYpFR8hFBoeEhcbEhcZEhkZFR8eFR4bFxUgGBUhFhQfFRMeFRMeFBIdExEcFBIdFxUg' +
		'GxkkHhwnIB8pIiAoJCEoJiEoJSAnJSAnJR4mJR4mKCEnKyQqKyQrLictMSsxNzE4PTQ7RDg5STw+TD5FWURMaEdMekxOXDk6Lx8fMiQkUTQ2b0xKooCJlHSQu57L27z0zKTh2qXszpTcuH68tn2vvoWys3yms3yhq4Ggg3SRTEhkRENdTkhg' +
		'WU5hV05dT01bUE5ZVFNZUFFUS01QSk1QWFVUXFpYWFdXVFVSTUxISkhCSkZAT0lBVEtEVUpEVkxHWlRPZFpUaFpWbmBdcWJdcWFab19VcF9TcV5VeGNbdl9Vd1xTdVhQclZOZFBHW0o/WEY6VkI3XEU6WEA2VT0yVkAzTzovTTkuVD0zVTs0' +
		'VzoxTzYsRjQsRTkxRDsyQDcuNjEmNTEoNDEqLSwmLS0oMDEuLS8tLS8vLC8wJysuHyMnHiAlHx8lHB8kHSElGyMmFh8iERgcExgcExgaEhkYEhwbFB0aFxUgFxUgFhQfFRMeFBIdFBIdFBIdFRMeGRciHRsmHRsmHx0oIR8nIx8mJyMqIRwj' +
		'JB8mJyAoKCAoLCUqOzQ4MisvNi8zNzA0NS42OTI4QTc4RTs8Sz9FWkZNa0dNd0ZLSzAvNiYlPygrdVZannl9hmNymHWUw5/OxZ7Xz6Xmw5TftYjWqH3ErX+8soG6rHuwroCspIOma2CBP0FePUJfSkhiWVJoU01cTElWTEpUVVVbUVJWUVFW' +
		'XFtfZF9eYV1dU1FTSEdGSklGUE5JV0tCWEc9XU1FX09IXk9JY1VPY1dSZ15abmNgcmRecmJaZ1hKcltOhGFYhmVdg2Vdc1lQZlBFYk5DYE1EXUtAWkg8Xko+XkY5VzswVzwxWUA1VkA1UjwxV0A2XEM8WkE3TTYsSTcvSDkyQDUtPDMqNTAl' +
		'MzAmMi8oMTAqKiolKiooKy0sLzAxKi0vIycqICQoHR8kICAnISEnHyInHCImFh8iFBoeFxsfFR0eEhoZFx0dFh0aFxYhGBYiFxQgFRMeGBYhGBYhFRMeFxUgGhgjGxkkHBolGxkkHRskIyAnJSAnIh0kIx4lJyEoKiEpKyAoLSQpNy4xOzI2' +
		'PDI5PTQ9OTQ7Qjo7Rz09ST1BW0NIb0JHekJFUjgzPSsqZEVNpoiTmnmFY0NLdFRloXycq4Oss4u8q4bBqYfInny5lW6loHWroXern3mjmX2dal97QkNdQUZgTEtiW1ZpVVBdTkpRT05TVFNYT0tPXFRWal9iZ2BgXFhYVVFSVE9OX1ZUY1hU' +
		'VkQ6XkpAZlNOV0RDXk5NZFZUaVxbbWFgcWJicmBedWBZblhMbVFFdlNKdVVLcVVLa1JJXUk/W0k+WUg+Wkk9Xk5BX00+WkM1VzsuVjkuWT40V0A2W0Y6W0U7Xkc/VkM3SzotSjoxRDYuPTIpNy4kNi4kODMpNTAqMS0oLi0pMC8tMTIxKywt' +
		'JSgpJiotJiktIyUqICAoIB8lHyEmISUqGCAjFx4hGBwhGCAgFR0cGB4eFhsaGhkkGxkkGRgiGhgjGRgiFhQfFRMeGhgjHBolGxkjGhgjGhgjHx0lJiMpJiEoJyIpJiEoKCIpKyIrLiQsMikuNS0vNSwwUEdOSUFKOzY8Qjo7SD08TTw9XT5B' +
		'eUZJjE5SSzEsSDUzjGp0qoydl3iNf2JxgGF0jWaFk2qQpH6smHawimuhg2OOhl+JkGWSkmqVl3OVgmV9b11xXFVoT01gU01fVk1cV1BaUU1QU1BTUU5QVU9SYVVXcGBiZV5eWlZWW1RUZlpZbl5ba1dSWEQ9WkhFYVFSY1VaaV1jbWFmeWlt' +
		'fGdsemNmeF1fdVhVclNMb1NIaVNGbldMb1dNblVNalFKaFJKXk5DXk9DZVVHX0w+WEEyWT4wWzwyXUA3XUM4YUk/YktBX0lAVUY5TkI1RjkwRTgxPTIqOC4mOjEoPjcvPTcxNzEtMS0qMzEwMzIzKy0tIiYnISUoIiYqJyktKCcuIyEoICAl' +
		'JCgsHiUoGiEkGh4jGB8gFBwbFxwdFhsZHR0kHRwjGhkgGRgfFxYcFxYdFxYeGBcgGhkhHBkiGhcgGRYgHxsiJB8mJiEoJiEoJiEoJiEoKSMqLScrMCsvMSwvMy0xODE1PjY6Pjk4RDw6TT49Ujk4Yj08d0dIdEBHTDU3QDQ0c1ZcrIWYpIeh' +
		'oYOinXuYoXyXk2qImXCVj2iXfFd8bUtla0dneVR3iWWFh2N9dVhrZVBfXExZWUpWWUhUWkpVW05WVFFUVVNWWFRXX1pcY1tcYFVWYltbYllZZVZWcFxcZlBNXEVCYk5NZVNXbWFmc2dwemx0hG51gmZsgWBmflxedlRTaUtIaEpIaFJMaltP' +
		'bVpNdF1QdFlOdVpRb1VMZlFEZlFEbFdKZExAXUI1XUAxYUQ2YkQ4ZUM4aUg/ZEc8YEk9WEc9UEM6ST00Rzw1RTw2PzczPjcyPDcwPTQxOzIwNy8uMy8wNDIyKiopJCYlJCYmIyUmJSUoKCgsJicqIiMmIyQoIiYpHSImGRwhFx0eGB0dGR0d' +
		'GBsaGxogHBshGhkfGhkfGRgeGhkeGhkgGRggIB8nHBkiGxcgGhcgHhoiIBohJB8mJyIpJyIpJSEoKCIpKyYrMCsvNC8xOjAzPTAzQDI0Qzg3S0A+VkVCY0lGZEE/ckdHd0xSQS0zOS00dFZgr4ORqIWWlXOKlG6HnXONl2uHkWeGjmWHdVFw' +
		'cE5qd1V1elh4f116f110fWF2bVhsYExeX01ZXUxSWUpLWUtMW1FWWU9TX1RXZVdbYlNWZ1hZbWJja15gc2FkbVhaaVZWaVZWcmRmfm91iHR+jnWCi2x5iGNvgV9ndVhccFBSclJQb1BObFBOcVlVcF5Tc11QdVpNdFdKcVNJaUxBbFJFb1ZJ' +
		'ZUxAZUw/a09BYUU1XEEyZEc4ZUQ4aEQ7aEc8ZUo+XEk9UUI3SjwzSj43TEQ+RT44Qz02QjwzQDcxOi8tNy4sNTAvMC4rKiooJygmJigmJigmJCUlKCgpKCkoJCYlIiMkICEjICMlGyAiGyEgGyEgGyAeGR4bHBsiHBshGxogGhkfGRgeGRge' +
		'GBcfFRQdJyYuHBojGxghGxghIBwjIhwjHxohIx4lLikwLikwMCsyLyoxMSwxNy4wPjAxSTU1TTc3TDs6TTs4Uz45WT86XD46XTs5XTw+QC84PTE/aElXp3qEmW5zelRglG+Dn3iUnXWWkGuKgV94dlhyeFp5f19/gWGAe113cVRobVRlZlFi' +
		'ZFFgYE9ZX05TWEpJW05OUURHU0VHWEZIYExPZVBUblpddmVpdWNofGlucF5kbl1je2xxfnF3hXN8jW99j2h5h19vgFloeFpjblhbalBSd1pad1pYeFpZeFxXcVdNdFhMclNGcE9Abkw/ZUU4aEk7Z0o8YUU5Z0s/blBBaEk5XEExZkk6aEc6' +
		'aUU6a0c+ZEQ6Xkc5U0IzTDsuTD82TUM7SkI7Rj83RD01Qzw0OTEsOzQwNzIuNDEtLS8qKiwnKComKSsoKSooKSknJSUiJSUiJCYkIiQiIiQjHyIiHiQhHSMgHSMgHSIeHR0jHRwjGxogGRgeGhkfGhkfFxYcFxYcFhYcGhceGRYdGhceHBgf' +
		'IRsiIBsiIBsiIBsiJSAnLyszMi81MSovOS0wPi0tTTUzYkhFUz07Vj87VDs0YEU/X0I/XD49UTk7PjA8PDBCYUhXkmpxfVNTeFdfoIKVknSRhWiLgmaHc1lxcFhwdVt3f2J+elx1cVVqbVRlZU9ZXElNW0tPXUxTWklRVkZPTT9IPTM1TD8/' +
		'W0tKZVJSZlRXblxidmJreWVvfmpzd2RvfWp1g3B7fWh0h2t5lG9+lGt6hmNvfmNsgmxzc11hclteeWBifWFhe11beFpUcVJJbEtAcU4/b0s7aUU1ZEIxZ0Y1aUg5ZEU3Z0Y7bEk8akc3ZUc2Zkg5Z0Y4aUU5bkk+bEc+YEM2W0Q2VUE0UD82' +
		'UEU8S0M8Rj45RD04QDs3OjYxPTo1PDc0NTEuMTEuLC0qKSsoKiwnKysnKismJCQgIiMeJyckIiMhIyUjIyYkISUjISUiISYhHyQfHx0kHh0jHBshHBshHRwiHBshGBcdFxYcGRgeGBUcGRYdHBkgHhohIRwjIRwjIBsiIRwjIh0kJiIoNjI1' +
		'OzU2PDIxQjEwSTAvWD07XUVBYEY/YEM6XD84ZEZDWT08RDI1Ny04NS08TT5JbVJYjWpvlnmGk3uNg2yEgGqHfWWCfWR+blZsblVrfF91e1twcVRlbFRiZlJZWEZEVEREVkZKU0FLVUVRTUBKRz5CVEdIXUxMaFVXZlNZdmZvgm59hXGBhHB/' +
		'h3GAhWp6hmh4iGl4i2d2j2h0jGVvg2Jpf2NqhWxyhmxygWlvemFkfmJjfmFed1dRbUxCakY6b0k5bkg2Z0QwZUIvZ0YzbU08bUw9ck5CbUU4cEc5Z0Q1Xjwtakg5bUs9aUY5a0Y6ZEU3Y0c7W0Q4VUM6T0I8TEI9SEA/Qz4/PTo7OTg4PDo6' +
		'OTc2MjAwKiorKywrLS8sKSsoLS4rLCwoKCcjIyMfJyclJCQiHyAfJScmJigkJCYhJSciIyYgHx0kHx4lHh0jHh0jHh0jGxogGBcdGhkfHRwiGxkgHRsiHxwjHxsiIx4lIRwjHRgfHxohJB8nLCcrNDEwR0JBT0ZERjc2Tzo4WUE+XkdCZUpB' +
		'aEo+Xj42UjMxTDAyMyMnLiYvMS04My00QTE4YUZUeV5tj3aEcVpqfmh7gWd8gmN8c1ltb1hoc1dnfl5tdFdlZk1cWENOUD5DTTxBTj1CUkJGUEBESj1BUENKTj1BXUZJcVleeWJthXB/iHaJgnGEhHCDgmh7i2h8kml9j2h6i2ZzhV5oglhg' +
		'flFZhVVggVpkel5meF5mfWRqfmJjeFtXclNLakk+Yz8xZkEwZUAsZEAraEYxaks1cVE+eVZHdU5Bh11SfE1BZj0vYj0vYz4waUg5ZUM3ZEE1ZEM2Xj8zXEI4V0M8Rzo1RDs3SUJFQDtDPDtBODo/OTs/NjU6MzE2LS0wKCorKiwsKCopJygm' +
		'KSgnJyYkIyIgKCcnIyIjIiIjIyMkJCMgJSQfKCgjJSUgHSAkHR4kGxwhGxwhHBwhGhofFxgeFxkeGBofFxgdGxshHx8lIR8lIh0jJiAnHxkfIx4jLywxMzEzOTM0PzU2TkRCUkVBXEtGX01HYVBGa1RKdFRMZ0Q/TDQvOC0oKSElKCAnLCcw' +
		'IRojMCMtRzRBUz5KYU5ZXEtVXExXYU5cb1lpb1loclxodV1pdVlnclRjZkhSUjk+RTc7TTs+WkJHW0NGUTo+WEFHX0VOZU1VbVVffmh3h3OIh3OMinOIh2yBf2F1h2F3lGh+m2uAmGl8i15sil1oiVxlhFtjfFVebUpVbFFbeWNrf2lufGFi' +
		'dVpUcVVIb04/ZEIyXDwqcE48bUw5ZkcybE04eFdAfFZBeVE/hVpLeEw/aT4vbkQ0cEk6ZUAyZEA1ZkM4aEg5YUM2XEI7WENCSDo8Pjc5QDxBPTlBPzpCQT1EPDhAODQ7NjI6NDE3MDA1LjE0Ky8vJiknJiYlJCIjIh8iJiUnJCQkJSUmISIh' +
		'HiAbISQeJyokJSgiGRwiGh0hGRofGBkeGhofGhkfGBofFxofGRsgGhwhHB0iHR4jHx4jIBwhIxwjJyAmLiktMi8yOzg5QTs7SkJAUkdFYVJOXExFbVxVdWZcZVNJa1JMbE5LSjUxMSsnJyQoIhsiKBsjKhgiPyw2RDA5UUBKUENMSz9ITT9H' +
		'WkhRW0dQaFFbalJabFRaclhibU9bYD5DYENETTw9XUZJZklNZ0hNYkRKakxSclZdeGJscV9wfWuBhG+IgmiEjWiAg1xzhl1zkGR6lml+lWh9jWBxiF1ohFhifVRbcE5UaEtQbE1VdVhifmlvgGptfGBfc1ZOa1BCZkk5X0MyXEEvbFE/c1hF' +
		'Zks3bk87dVE9dk04flNAgFREeE4/c0g3cUY2dks8cUk8bUc7akU6ZUAwYj4wXjw3Wz9BTTk9Rjo/RT5EQDpCQjlCRTlDPzU+OjM7NzE4My82MzI4MTI1LTAwLC0sKCcmJiQlJCIjJCIiKSgmJyUjJSMhISMdISMdJikiJikjGh0iGhwiGRof' +
		'FhccFRUaFRQaFBYbFhgdGRofGhsgGxogHx4kIh8lJiEnJR0kLSUrMisvMy4yPDg5REA+TkdETEI+UEI9YE9IcF1XallUQzYvSDozSzg0UkBAOzEyHx4iJhsjPSQuVTU/YkNLUDk9STxDRDpCSj9FTDxBVD5DVzxCXkFJX0NIX0VHZ0xQaUpR' +
		'bUpNY0JCX0VHbVBTaUlOa0hOb0pQf11he2FleWJveGB6hmuJimWDmmuHk113iFNsmWZ+l2h+mW2Bi2B1e1ZjdFFZbkxSZ0ZJX0BDaEpPdldcgGNog21xf2dphmdkcVJIZEk6Zk4/aVFAalJBa1JAbVRAblRBdVZEeldEeVI/gFRBgFJAfE08' +
		'eEw7d0w7c0g4d00+dkw9dEs9dEg5bUEzbUM9ZUJDTzU5SDU6ST1DRzxERDc/RTc/QDI6PTI6PTQ8PDc+OTY6NDM2MjEyMDAwLSsrKSgmIyIfIh8dKyYjKyUiLSUiKSYhJyUfKCghKCkiGBshGx0jGRofFRYbFBUaFRQaEhMYFBUaGRkeGxog' +
		'HBshIB4lIx8lIhwjJRwkKR4lLyQqLiYrNS8wRD87TkZDTUI+PzAsQDAqSjg1Py8tKyMeMSskMiQjOikrRjo+Hx0kKRwlYEJMdk9ZYD5FY0lPPjI5PDU8Sj9GTT1DSTM4UTQ5WjtCUTY5Vz06WD4+WjxBZUNGZ0VFeFZZe1ddZ0JKZT1FeVBW' +
		'fFRZZ0VLhGByiF5+mmiNqGyPrWuHkU5poWR9oWiAlGJ4gFRoc0pdZkZRZUdNaEtQaExPblFUcVRYelpef2FlfWVogGZmeVhTbEo+c1RFgWNYdlhLdVdHdVVEe1xJgF9NelpHc1E/d1JAe1I/fE48eEg1ckYzbkMxckYzd0o5eUw8eUo6dUY1' +
		'eUo7eE1DZ0Q/UTc3Szc6TT5CSjtBSDY8RjM6RzU8SDg+RDg9QTtAPjk9NzM0NjEzNjIzMS8wLS0pKScjKCQgKSEfLiQiMSYjLyciLikiLSojKSkhFhkfGRsgGRkeFxgdFhccFhUbFRYbFBUaGBcdGxogISAmIh8mIBwjIBkfJBoiJhohKR0j' +
		'Kx8mNiwuRTs6UUZGSj49MCQiOCsoPS8sMCQjLCUgMysnRTY2QTE0LiMpHxwlJholSjA5VzdBWz1IZk9aPzM9RTxFRzxGTD5GSDU+STE5UzhBTjU4TTczUDo5YUdLY0dLa0pOfldfc01YXTdGcElXflReYzlBdUpVi1hupGWGxn2jvnOWnlRy' +
		'nVt0pmh/j1dsc0JWcUZZdExecE1bcFBaZ0pRblFVcFNZb1FXeFhddVlcb1laeWBfYkE8YkAzfVxNe1lNfFpMgV1MgFpJhmBNkGpVimdSfVtHfFhGfVhFelE/eEs4ckgya0IsbkItfk07gE49gU09fko5hFNCflFDaEI5XEA9VkFCUT5BTjk+' +
		'TTY8TDU7UDg+Tjg9Sjs/QDg7QDc6PzY5OzM2OzU3NzQ0MC4rLCglKSQhKyUhLiYiLycjLSUiLycjLiolKykjFRkfFxofFxgdFxgdFxgdGBcdFhYcFhUbFxYcGBcdHBkgHhsiIh4lIBkgHxUdIxUdKBkgKRsjJxoeLB0gQjM2Sj4/LSIiNSsq' +
		'MyooLyglMCkkQDMwUj4/Pi4xJyAlHhkmKR8qMyIsNiEsQSs6Pis+RDRDST1IQjZDRjpFRjlERTZDQy86PikuPy4rVUREZVFXV0JIZklOfVVha0ZXbUpdflltglppbkZSc0pZmF50vnCO3oqqvnOSjkxok1ZskFdpg05hg1Vngldqf1dpfFRm' +
		'dlBedFNecVJbcFJbc1JcbExUaE9SaFVWdF1ddVVRfVtQgWJSeltMfFxLelhFflpFiWRNiWRLhWFJhWROgGFNf15MfVlGeVI+d003dEs0dkkzgE06j1lGkFhGkFRElVlLiFNFcEM5b0tIYENFWUFFTzc7TzU5Ujc7VzxBXENGUT9CQzo8Qjc7' +
		'Qzc7PjM3OzQ3ODQ1MS4tLCgnKiclKCUiKSYiLiomLickLSUiLCgkKykkFBQZFxcdFxccFhYcFxYcFxcdFhYbFBUZFhQaGRUbHhgfHxggHxgfHBUcHxUeHxMaJBYdKRoiLh8lLB0gOSwuOi0vLiMjMCYjMiknLiclMCkmPjIxSjk9KxwkKyAp' +
		'LCMxNCYyQi03TjU/UDhFRzNDQTI9QjhCPjhGOjZHQDhLQzhMTD5LWEdKW0lIXkxOXUtUW0ZRaE5adlRjd09ikGd8k2l9jV1vfkpbjVdnuXWKyHOPzniWsWOAlFFrhVFjfUxdiFdqjF1xglVqflJnhFdqiF5ue1hkdlRafFZbcUtUY0JHa05O' +
		'blZYdVpcbU5Jakc6dVNCg2RWhWRVgV5NgV9Lgl1Igl9HhGNMhGVQhWhVhGVUfV1JgF9Kd1ZBdlE7f1U8g1E5kVdDo2NSomJSmVtLkFZIgE5EflNQaUVHXUFGVT5DTjg8TjM5VjlAW0NHVkNFTT4/Sz4/RDg7PjM2ODAzNS0wMyssLicoLSYo' +
		'KiUlKygnLCgoLignMCspMC0rMTAuEA4UFBMZFRQaFRQaFhUbFxYcFRUaFhYbGxkeHRkeIBogIhohHxcfIRohJh4jKh8lKh8kLCAkMSUpMSUoMycpNCgnMygmOzAsQzk1Ni8qLiYiMiglVUtMMyYsMiItOiw2UTxEZUVNa0dOZUVMVTxESjpB' +
		'QjhBQj1KNTNCNS0/STtMZ1hjZFJVYEpMaVRcalhocVtvc1ltflxxjmJ5qniPnmuAiE9lnlty1omf14ehy3qXr2J/pFp0n1xyjVlnmWl2n29/mmp8jl5zj191kmF0g1lqbUpXeFRZhVxde1RZb0pMck5Ne1lccVBSY0M+WzcoaEMxi2hajWlb' +
		'hmJThGBPgF1Kf1xIgWJMe15JhGhUhWpVfF5JfV5Jf2NNfVxEhFg9jlk9lFlClFZDkVVCml9NkFdIgE1Bf1FLcEhGXj1AWUBEWEFEVjk9Xj5DVz9BVkNDUTw+Tz5ARTk6PzU3OzA0NSkvMicrLyUpLiUoLSQoLycqMCosLikpMS0tNDIxNTUz' +
		'EQ0UExAXFBEYFhMaGBUcFxQbGBUbGhccHBkeHRkfHRkfHhofIx8jIh0gJSAjLicpNCotQDU2NywtLyMlMicnNysrNispPTIvQzkzSUM5SEA3RDoxQDQuQzQzQjE1Szg+YkhNdlNXbkhLeldceFphWERPRjpFQzpHPjdDTkFMZ1RdalVdX0hO' +
		'ZkxSeGJwdGB4eWJ/gWSAm3OOrnyZr3eTiE9oikxlwXmS4Yul4pGszYagrW2Gs3WLoGR3pGt3sHiDs32Kn2x6mmp5m2x8kmJ0flVodFNka0lTc09Sck5RXzo8bkZGfFRYe1ZYbUpFXjstakc0hWBQgV5Oe1lJeVhIeFpId1pGeFg/f2FLhmxX' +
		'iG5ZhGlUgmZRiGtRimRJjFk+l11Bklo+i1g/jllFlF5Kk19MilhIg1RIcEY9ZkA8ZEJBYD08bEREbERFYUI/VD06TTk5Szo7SDo7QDQ3PDE1NisxNCcwMCUsLiMpLiQoMSgqMisrMSsrMi4tNDEwNDMxDgsTEA0UFBEYFBEYFhMaGBUcGxYc' +
		'HBcdHRgeGxgeGxofIiElKyksLywtMy8wOjQ1QTk5QTc4MigpLiQkMignMCYkOjAtSUA6WVFKUUpBRz41PTIqRjgyWkhHWEVIVkNJdV5ifV5jfFpgakpSYUZSRTZDNy08QjpJUEdUaFlic1xidVtee15hgmVqim+AjnWQknWWlXGRrX6dvIKh' +
		'mlt3gkRcq2uEwXqTxXaN5qK3uH6StXyPxIiaqWZ5tXWFx4mZun+Qq3WGnGp7m2t9lGR1jmZ6f2B2bE5ebEtSc1NYZUBFe1BWfVNaeVFWdlJQXDswY0EyfFlJd1ZGcFBCdFdHdFhLc1hIcVM5dVlCgWZSemNOemJOgWhSf2BDi2JEmGNHnWRJ' +
		'iVU5fVM3gFI8iVdChVQ/hVVBhVdFeU49bEI3ZDozYDUsbz02e0lDcUhCWTw2Tzo3STY0RDY1QTU2PjE0OiwyNygxMyUtMSUqLyQnMCcoMyspMy0sMy0tNDAvNjQzEgwUGBMbFxMaGBMaGhUcGxceGxcdGRYbGBUbHhofJiEnKiYsMCwwODM2' +
		'QDo9Pzg6OjAyMScoKyEiKyEhKB4dKyEeOTArNy4nOTAqNi0nOjAqRDYwVURAWUREV0JFXk5TgGxyeF9kY0hPRCw3Pyk4QDA+PzRATUVRZlpkd2NpgWVnhWRigl5aoH19pIKOpoSdr4aksoOftH+YrGuDpWF2q2x+zY+iy4uexImXw4ya0p+t' +
		'3qa105OjyIKSy4mbyYmdwIKXtXyQrHiMp3WIpHWEkWp+g2eAbFJnaUpXcVJbcE5XfVZhgVplcktVdlJWdVVTZUU/Z0c8bE5DWz4zXkM3bFFGcFZJbFE8a1E8eWFOdV9LemJOfWNNelg6kGdJnG1Sl2ZNbUAnYDofc0gweks0c0Mtc0Qtb0Mt' +
		'bEIvbEIya0EybkEwe0Q2fkQ5d0U9ZEA5Uzw1RzMsRDUvQTMxPzExPS0wOygsOSkrNScpMCUlLiUkMiooMywsNC4uODMyOzc2Eg0UFxEZFxIZGRQbGxYcHBceHRwhHh0iIiEmJiInKyQqLicuMSoxMy00PDQ6MykuLCAmJxofLCEjMiooMikm' +
		'Ny8rOjMsQjszQzoySUA1UEc7WEs/Xk1CbVdRbFZUeGdoX01NTTY4SDAzQCkyQSo4TzpAYE5PalhbbVhajm9upn14glhOelJFmnBpsomOv5Sl05yy25+z2Z6tyYORw3yFxomR05qm3aWzyJSdwo6Y2KSv3qey1Zqjz5Kaz5Cf15iovYKSrnWF' +
		'o219nWp4nm54kWt9d155Z1BqbVFkd1hmcVRja05dcE9fcE1ccE5ac1NcaUxOZEhDbFBLZElCYEU8ZElAak9EZU09ZlBBcFtMa1RDblRCel1Hh2FGjmdLhF5EbEUuYzwndEs3eUw2hFQ9fk84dEYvbEArZTwqXjgmXTcjbkAqhUs5fj8zekM6' +
		'akQ7Uz0xTjsvSjkvQTIrPC0qPS4tPCkmPCopOCkoMycmLSMjMCcoMyssMyssOzU1Pjk5Ew0VGBMaGhUcGhUcGxUdIBsiICAjISEjJCInJiIpJBwkKh4pKSAnJyEmKR4mJxwjKRwjLyIpOS4xOzMxOTIvPTcyRj84SEE4TUc7WFJDZ15PYVNE' +
		'Y1FCaVNHZ09GZ1BGUTgsUzUrZ0hCVjk7UTlBX0lKb1dWYkhGeFROsYF3oWtejl1NmWpZfkxBp3l7zZ+u1p6u25+oy5GVzo2TzYuS05ie05+l3q202Kiv2qqv3qyzz5yixZOXw5CUzpec2qGoxY2TuICHsXuDmGRti15miGRxgmR5fF93eltx' +
		'fFxvdFVpbVBkaUldb05gcVJib1Jfb1Zca1RUaE9NbFFLbVNLZktCZU1DYE4/YU9Bd2FUalFEa1FAd1pGgVtEfVlBX0MrVDchc087il5NjV5Jkl9HmmFKjFU+bj8rakMwZD4rYTokXzYdg085klNEgEA3dUE3Y0M0WEE0SjowQDMsPC0pQC4q' +
		'PisjPCkjOCklMyUkLyQkMScoMyorNSwsODIxNzIyFA4WGBMaHhkgIBsiIBoiIx4lIB0hISAiIh8lIh4kJyAlKh8mLSQmLScoKyEnKBskKR0jMScoMyopNi4sPjczRD43S0M4UUk7VEw7XVNBZVdGYU48Zk08Wz4uUjUiVjogbU0zfFZBbko7' +
		'X0E6VDw7YkxLaVJSZUdEk2ZdpnFjm2hZilpLiFRDhU5Crn+ByqGu2ai00peYyIuIyJKU06Gp5LO706Cjzp+f1bKz27i21a6rzaSh3bGx3K2v1aOk1aCh3qWnypCUwoiRr3iDmW13k2t2kmd2kWZ5hl5zflpue1Zpfllpe1lrdFNkb1Jicldo' +
		'c1tna1RZcVdXcFRNbVFGblVIaVRIYFFAXks9cFhMcFZLc1xNcFlHb1Q/bVA7X0UucVM9eVVAfVRBe1Y+ilxDrGpVuXRejVM9dUgxdEYyaz8oYzsibT4ni009lk1DiUM5ekY5Yj81TDozQTMvQzIvQColPSkgOyghOCcjMiQkLyQjLyUjMSUk' +
		'MignMisqMi4uEw0VGRQcHRgfHRgeHxogIBshIRwkJB8mJR8lIh0fJyIhMiwpOTMyPTc6PDM4Oi40OzA0PTMzODIvODEtPTUsRTotVEY0ZVZBfm1UiXVWi3NVcVQ3aEYrXToeYz8idVMxbk0wX0ArUTYnW0I5aVJLeF5Vd11XgGNehV9XhlxT' +
		'gltVgVlPjl5P0aSZ2q+s1qit5bK1yIaGu3FxwoqJ47u53LWz06KhyJWU0rKt27uzyaed1rKp2LKq1Kum262sxpKTt32CtnqDs3iGqnOEnmx7mGh2kGBujV9uiF5tfVhmdVNZc1NVcVJXcVNedFhqc1lwcFdpclZdZ0tMYkQ/ak1DbFBEcVlL' +
		'Y1FCaFRHdFxRblZKaFFDYU48Xk85YUg1c08/iWFSd1RCX0YwU0IqaE40kmBJunlls3Negkg0d0UwcUUtd0kxfUQwhkEymFFFm1tQe0A0aj4zWT43SzcxRjMtPygjOSYeOSYhOignNCUlLyIiLSEhLCAhLSIjLCUlLikrFA4WGhUcGxYdHRge' +
		'HxogHxofIhsiJh4lJx4lKyUrNzI6OzhAPDg+OTM3OS80QDU4QDU2OjAvNzEtPDYuSD0vUUAsY081d2FElHxcnINgf2NAZUUlVDETUzARZ0QlYj4eWjoiVz8wW0ZAaVVRclxWdF9Ycl9cd2FggGBch19Zh2BbjmNcnm1loG1of0lHklpYkldT' +
		'rWxpt3FxxYiHyZaTxJiUx52Z1KynxaSbzq2hxqOXtZGDuJSH1bGlyKCXwJGMy5SUw4iOtXuGqHKCn258lGVwlWdwj2VrhmJmeVpeb1JSblJPbVJSZ01TalFbc1xreGBwdl9pa1NcaVFVaFBOa1RNdmBVb1lOalNJeGJYdmBUblhLaFNDYUw8' +
		'ZEo8hGdZgWNUeF1MclpIXU45Uj8nelM8voRusG9be0Esd0YueEgwiVI6nllHlEg7iUU4mmBTgEAzbDguZUA3TDIqQiskOiIcOSUgNyMhNyQmOCUoMyIlMB8gKx4iLCElKyQmLSgrEw0VFxIYGhUaHBccHxodIx8hJiAjJx8iLSMpMCYyLiY6' +
		'Qz9bT0pbMisyPjQ5Qjc3PjQxPDMwPjgxR0A1V0k4ZE82cVg6gGVEg2pJfGNEclg6VDYdUzUdblI5Vz0lUzUjUzYqWEE9Y05RZlJWYU1PW0xOXlNYa1tjf2JmlWxpm25ow5OQw4+QqXJ1pGdounh1mVZSeT47gkpJwX+Avnh6wYiIyqim59LL' +
		'1LOqzKqf1LKkz66ezqye1LOlyamZwpqM0Z+W15+dv4iLpnN6j2ZsjGZpj2tpgWFdeV5Za1RQZE5MZk5OaFJRZlBPYUxMZFBPbFpdb19pf298eWt2cGFndGNjc2Jcc11WbVhQc11VbVhNdmBTg2pbiGVbfmFWcmFRY1VDb1tKc1ZJaU09XEIs' +
		'b0gxrXVesHBahFM6f082i1I5mVxDpFtInU5Ai0Y4dTUndDMnbTYrbkM5UzMpQyghPCQeNiMeNCAeMx4gOCQmOyYoNSEjLR8lLSIqKiIpKSUpEw0VFxIYGhUbHxoeJiEjKicnKSYlKyYmMyksLyQsKyI0V1NtbWd5PDQ9Qjk9Qjc1SUA7UUlD' +
		'YFpRYllNXU47d2FHkHVXhGlKaU8yZEsyaU84TTIeTDAfWT8vTTgpSzgwUTw2XkVCVz4/UTxAUT9GWUdLYVFaallobVFddE1Uh11ih1hcmWlvk2NrjFJUllRQdjk0WycokFtf0pWYsXFypG5vxqWm69bV5MvBz7apzrio6NLB4sy9yrSmyrOj' +
		'zKueuImBs357r3x9q32AkG5sgmRdf2FWdlpObFJIZ1BKYUxHZFBJaldRaFVPZFNMXUtFWklGWUtNb2Jqg3iDdmlzdWZodGJecV1XbVpTaldQZE9FbVNGfV5Rf1xSkHJoc1xOXk09UD0sUz4ucFNAc1Y9g15Cun5mt3Bbj1lChU42qWZOomJJ' +
		'mVI9n1FCl01AejotbjQoYy8hZzsxWzkwSy4pRi4qOSYhNCAeNB8eOCEkQCgoPSUlMSIqLCErKB8nKyUsEQwTFxIZGxYcIh0hJiIiLCcnMC8tODYzNC0qPjQ1QDc/NzE+Lig1Ni44OTAzS0A9XlRNamJaamJYYlhKZlVAeWFGiGxPf2RHXUMo' +
		'VjojTzMeRiwaQyscTDUpUDwxTTw3VkI8Vjw3UDY0VEBAUEFFXkhLZ09XYkxbXD5PYj1MfFZkj2Nsek1VdkpViVZZll1abTo4cD5GoGVxuYCHk2Biil9gtJKX17zBz7y1wrCj08Oz2s262s670ca03cq93sG4x52Zp3Z1nGxunnN2n3x4lndt' +
		'h2lchGdZfGFVdltUbFdMZlVGa1hNa1dQaldSYU9OWUZEXktHZVRVdmZrdWJneGRke2lkcWJcZ1lTaVlUaFNNbVNKb1JGaVFDhWteiWhcb1FCUDsqST0qZE44fmNHkW1PsnZdsmpXoGNPomROvHZdsW1UnllDnVFDnlFEhD8zaDMmXy8iWzIn' +
		'XDkwRSgjRi8rPysmNiUhNCEgOiQjQSknQCcmMCEpNy43R0FIJSAmEAsSFxEYHRgdJB4gKiUlNC4uNDIuLy0oMy4rNzAwMigsMCUrOC80PDQ3PDIyTUNAVkxETUQ6SkAzSjssVkQub1o8YEYpTjMYXUEpZUcwSjIdTTsqV0Y6WEc+XEdAa01J' +
		'clRSVj0+Tzo/VUNLTT1FVUFNXERTYUNXbUlfe1BlglBhgU9fd0ZZgk5ijVhliFRddEBNhVFijVdmnWZ0i1djkmhvzbGy4c7O3MvM6NrT4dHB7N3I6tzGyLqm0L2vsJaLuJWPsIeEl21si2Jil3FsmHZvlXdvhGpgdV5ReWJSblpOaVhPdl5W' +
		'dFpSeGBbYU5MWkZFYkxJY1JLX0tEXURAaVNPcGNdYl1XYlxZdmxsaFxaVUVAYlBHXkw9YUs7fV5NhmVSeF1LalRDZk47eFlDiWBHmGRLn2VOoWdUn2VSrm1WuXFZrmRRn1VIqFlMkUY5bzcrXi8iWzAnWTEsTCsoRSwoPispNCgpLiQjMyQg' +
		'PiomPSkpLSIpKykvMC00KSIrEQsTFhIYHBcbIx0gKyQmMCoqMi0sMy0rNS0tLCMkNSosOi4xQTc5Qjg3Qzg2TkA+VEdCSD40NyojOCYfUD0uUz0pTDYfWkIvZkw7TTMfUTwqZFNHZVRNYk5KcVhXgF5fdVZbZElTZU5cTDhIRzNEV0FaYEZk' +
		'd1Z3j2WIlGGFjVR1jlt8fk5zl2SIs4Cbr3yRiVRtl2Z9uY+ZvpCapniAv5eb2bq35dPQ+ff1/Prz7ubZ8+fZ59fL1cK4ybeqnoZ8n394r4qDu5SOo313nnhxlXNti25niXFohG9kdmJUb11RbVtSdmFXemNZe2ReXUpFXUpGZFBNYlJLX0xF' +
		'WEI9ZFFMXFBLTEM8YVZScGZjZFlVXlRNYVVNY1JKaVJGdVVGhmBOjGZTjmlYcE07iF9NpXVgoGpUn2hSlV1Mfkc2pGdR1Ix0r2NPoVVIrF1Pm05AdjgtZjImYDIpXTIuWTY0SjIvPi4uMSosKyUmMSUjOikoNiUqLiUsJSMpJCMqKyMsEQwT' +
		'GxUcHxofIBofJR8iLCcoMCgrLyYqLiQmNywtQTY2QjY2Qzg1RTo2QTMwRjc0RzczNyojLiAbOSYiLxsQMx0LNiENPCgYRzMlWUU1dmNXdWJbcV5dfmVphmhvh2VvdVZjbFJlYUphUjpWYUlnXUVpblJ7glyFmGaSq3GemlyKlFmHnGaUtH6r' +
		'xJO0y5+1uZGlyKa23b/F0q+0vpibx6KiwqGdsZmS3tnS6eLZ59/V8+fd5dXN18S/zbqyoomBooJ5tI+GupSLwJ2Sr42DlXRrhWlhhGxmgG1ke2leeGZcdWRabVpQdmJZcV1WYU9IXUtFZVNPYVNMX09HYExHXk1KVkpGW0tFY1VNXVFJU0lB' +
		'Y1tSY1xSZFhSbVlRd1hJfVVDiV1JlGpVjmRShFdFmmpXoG9alGNPf1E/azwpm2JMzIVtwnVfn1JCp1hIoFJCgj4ycDcrZTMrXTArUS4qRy8sPzEyMi0xLSsvMCcpMCMmMSQuLyYvJyQrJCMsKSMuGRQaHxkfIRwiIx0jJiAkKSMoKyInLCIn' +
		'MCUoNCorPTIxQDY0RTo2STw2PS8pOiklOCYiPzArRjgyRzguRDMjSDYgV0UuWkk2aFhHhXVoemlidmNjgWpwgmdyhGZzfl1udVhtblhyWURkWkFob1N8Zkt2dVR/iFuFpWyXrnGdpmiZqGeVv3ypx4u14rDN7srX7dPZ18LGzre5xamrzKys' +
		'x6WjzKyozbCp17613sa79OHW2si918W71sS70buyvqOaro2EtZCGp4J2sI5+spGCqot/jHJoemVec2Fac2Nbd2ddeWlffGtidGFaallRYlNJX09IWkxHWU9GWUtDWkdDUkRCV01KX09JXU5GUEM5TkM4WE9DV09EV1FGZVhKeF1LelU/fFI6' +
		'flU8kWZTkWdTeVA8hl9KhmBNdVVAaEMvjVtEuXVc0IFpsmJPnk89mks6ikI1djotaDQqWCwlSSciPygjNignLSgsKykuLygrLiMqLiIvKSEsJSIsJSQvKSMwGhUaHhofIh0jIx0jJx8nKCEoLiUoMScpNy4vQTc4QDg3PzY2QTg0PjMuQTMu' +
		'SDcyTz86U0U/VElBVk1BVko5aFhCe2lUindmmYd5iHhud2VggGxvemNtfmVzf2V0dVhtdFx0W0lnVkRqZk16aUx8b1GBb0h1g1B5omWNo2SQoGWWrW2ctG6drGybvYep4LfI58fR6M7T3MPBy6+uzK6u0rSz3cC+0rWy1rWt1reu68/GzbOp' +
		'xayhzbar07quwaOYsIyCp4B1oHptpoJztZSCq458j3dpe2hecWFZc2ZecWNbdGZddGRebFxYaVhTX1FJWkxEWExGXFNKYFVMX05KU0ZFWlNRXFFMTkM6RjstT0MzU0c3UkQ1VUs5YlE8hWhQkWtSeE82gFhBhltHhVpHhF5KhmRRgWFOf2FP' +
		'cFE+f1I7vXpfxnVcumhTq1tHl0g1i0AxejwuaDYpWC4lSiwlPysjOSgkLiUmJyIkLCIkLyIpLB8rJR0pHh0nHx8rJiEvGRQaHRceIh0jJh8mKyQsMCoxNS4wODExQjs7R0FBSEJCPzk5Ni4sQDYyST45V0lDXE9HXlJJXVZMZF5UbmRVdmlW' +
		'fmxcjnpvh3RsemligG1reGJmbVZgdl5sa1RiaVFlY09pU0NkXE50ZlF/XD9yb0yBeUx9jFN+nFuFlleFl12Qo2qdnWCWpmqhsHSkxo+y2qfF987h8dTU4sXFy62t1Li6zrS1176+xq+p3MG817u3v6Gdu5mWw6Ob0LOmwqGVrYd8sId8mHBk' +
		'p4Fzqol2nH9sinRldmRYaVpRbmFZbmBYcWJcbV9cZVdWYlNQXk9HXlBHX1ROXlZNXVNKWUxIWk9PXllXVU5JTEM5TUEyVUY0Wkk3WEY1XUszZ080jWtPoHVckGVOeVE8g1VAj2BMil5MeE8/c009flpKellIc0gzpGBGzXthsl5IqllEm0w4' +
		'jUMyfD4ubTstWjIoRSojOykhPCghNCclLCMjKh4dLR8jKx4pJh4qHh4qHR4rIx8tGhQaHBUcIxwjKyUqMCouMy0yOTEyQDo6RkNCQT89RUFART4+NzAtQjs2UUlDV05IVk9IW1hPYmBXZ2VbbGhZcWtZfnRmfG9mdmVhd2NjeGNkYktOXklN' +
		'VUBHTTxFTkNUWUloW0l0WEx1U0NraUh2gk1/jVF9k1Z9j1J9jVKEklqOm2WbmGGbo2umrG+qsXKouH2r1KXH7crc6MjS58nM4sfHzbOy4s7P0L+/z7Cr28rAzLy4zqqsv5eStIuDvZmMuJmGwJ2JuJF9p4Ntn4Bvim1lemFddmNccWFVdmVb' +
		'd2Zgbl1ZX1BOYVJPZFVNYFFDXE9AZFhPZldOXlJKV1JLWVVRZF1aV09GXFBEYE8/XUo2Xkw3WUk0ZFQ3cFo7imlLhF1BkWlNelM6ekwzkmBIgE04d0MwfUw6gFJBelI/cEEtlVE50XtgwmhOn0ozk0YvjUczf0EtbDwtVTMqRCwqPCoqOygj' +
		'OSklMiUlKyAiJx0jJyAnKCEoIiAoICAsIiIuGxQbHhceJR4lKyUpLigsMSsvNzAyPzo6Qj8/QUA/REBAQDk6QTs5REA6S0VAUUtGU09JYF9YY2RdXl1UYmFVbWlcb2ldamFZZFlXZllaY1NUXkxOWkhNU0FKUUBOUkZbYFFzX096U0VtZUpy' +
		'f058iEp0j1N2gktwekZzf0l9iVCCmGCVlWOdkWKdmGWiqXGsrneswpbA0q/N0K3D5MHMzq+yy7Cwzrm4y7KxxKCb3szC6tnT2rOvrH5xn29j17Cg5cax3LmkzqiVvZiHrYx+hWZfd1xZiHRriXZogG5ig3Fpf25palpXYVJPZlhQZ1dKYFFE' +
		'ZlZNaVZPY1RNX1pTYl5YZ15aXVRKXlBEZlRFZFE+YlI9YFI8Z1U5dFo8eVY5gFc7m29VkWRMe1I5eE83c0UveEcxhVVAglI9bEIrYzUcejkeuGRJxmxSqVQ9m0s2j0UwhkUybzstXDcvTjIxPyotOSkoOisqNCYmLSIkKSAjLCQnMSQqLSMr' +
		'JSQuICEtGBMZHhgfJB4kJSAkKSQoMCsvNTAzOzc3Pjs8PTs8Ozg5OjY3PDg3Pjs4SERBUk5LUE1JTk5JU1RPWVpUYWFZX15VYFtUW1RQV1BOXFdUVU5MW1BTW0xXVERVV0ddWUpkWkxvVUlvVkRod051jEl4lFF3i1J0e0t1fVCGhlOQjVOI' +
		'j1SKkF2Yo3u0v5rPj12cll6b0KfU1rrcvZS33rLJ6sLO6s3R6NDO2r220rKt5crG8NDLsXxxiEYzk1xHzKGJ2LSa17Kc0KqYzqqav52Mq4t9mn10knptj3pqiXZqhHJpgnJqcWJeZ1hWZFVRYlFJXk9FalpScV5YZlZQYFZQZFtUZVlSYVhO' +
		'XFBFalpMbFxLaFlGZ1pFbFg9cVc5e1g9iF9FkGJKkWNNe1dCcE45bUUvbT8pekcxd0Mscj4mbzYdjUYrsVxCpE01nUs1mEs1kkYziEUzcTssYzszUjUzQi0vNyssMyYnLyMkLiIjKh8fLiEhNyInMB8mKSMsISItFxIYHhkfHxogJB4iLyou' +
		'Mi0xMi8xNDIzNzQ1NjI0MzAxMzAyNjU0PTo5R0JBTUhHU1FPV1dVV1hVVFdSUFJMUVJMUU5KTkpHUlBNSElFR0VEVU5SW1BdV0tgXE9oV0ZkUkVoVEltZEptgU1zlEx5k093ilJ6gFGEtozHq3u7gUeCiEqCkVmSk2afmW6oi1SUomWjpnWt' +
		'y6nYxJnDsYGhyZuw7cjS6MjK3cO+48nI37i8yJCRr2df2IR3rGpRxZV2uZFyuJF1t5F5spB8w6CNuZeHpod9m4Byjnhokn91kYB3dmVdb2BbaVpYZVZTaFZRZlZOZ1dPclxZa1lVW1BJW1FIXlFGaFtPZVhLalpMaVlJYFJAZ1tFeGZJeWJD' +
		'dVk7fl1AfFc9hl9IiGNRdE8+a0EvbTsocDYidDYgk046iz4ruWdSy3VekDwmk0YvkEcyjEUxhUgzd0c2Xj0xTzozRTUzNywtMCYnMCQmLiIiLB8fLh8gOyIlNB4lKyMrJCMtGxccHBcdHhofKCQnLiotLCgsLCstLy4xMS0xMCsvMS8yMzQ2' +
		'Ly4tOTUySUNBSkRBU09MV1ZST09KSEpFSktGTk5KSEhEQD06QD48Ozs5S0pLWFNZUkpXVk5hV05lWUplVktqXk9xb0xug0xwkVJ7j1J7iFB6hVOFnW2ol2Wkg06Ghkx/f0d8fk6EgEyHkleSlVmQlGGTtoy6qn2mmmuNqHeRp3aJw5Si6MbP' +
		'7M7a0pmnqV1jxnh5yHV2w3lszJN8sINquY92tI52poVwtJSArox+rIyCoIV4i3ZogXBrfm1pcmFab19dZlZXYlNRZVRPZldPY1VNblpWZlRSW1BJWU9EXE4+aFhJbFxNbV1OaVlJYVI+Y1M8emJHfmRGel9CdVk8dlg8elpChGFOcEk5Zjwr' +
		'bDooeD0pjks4kk09gToqx3xqplhCgzUej0IrpFpEikUwej8qd0c2YEAySTUtQTMvOy4vMSYnMycoLiIiMCQlNCcoPCMnNR8mMCcvJyUsGhgdHRsgIyEmJyUoKScqLSwuLS4wMC8yMC0wMSwwMS8yMzM2LSsqMiwoQjo4RDs5RT87SERAQ0I9' +
		'SUhETk5KS0lIPDo4PTo2Qj48RUNFTUhMU05TVVBZVVFgWFRnXVFoWlBsY1Fxc0trgUxuhVF3g051gEpwhE51i1aGg1CEeEh3eEdyd0Z0fk1+jVWKik+De0dzj1+HqnqjnXCVmW2MlGR/f0VeqWqE2qfC57rU4Zat136K6qWr0I2bu290xIR+' +
		'ypiLx5qLt5CApYR0mXlpl3VqlHRri3BmgGtibV1dZ1hYalhUa1tbalpbYlNQYVFJZFZMZFdOa1lVaFhWW1JJT0c4WEo4ZFE/bVtLb11ObVxLZVQ/ZFI6eFg/gF1Cg2JHdlc8cFI5aEkzbEw4Y0MvXzomZjolekQwlVNCdD4sXTMeaDMeaCcS' +
		'kkkzpFM+tGNOl046fz8scz8uZEAzTDIrSDYyRDY1NCcnNioqMiYoMSYpMycqNSAlMB0jLyYvKSYtGxgdIh8lJSIqJSQqJiUqKysvLS8zLS8zKysvLSwwLy0xLi0wLCkoLSQjOCwtPTEyPzY1PDc1P0A8TU5JSkhFQj47RT48QDs6RUFAQjw+' +
		'QTtBS0hRTktWV1NdXlllXVVxYlRycVd1dU1rf0xsgElueUdufEtvekZpg09yd0ZuaTxlcEBqgUp3jVWCkVeFh0t4iVB5k1+FnWuQk2OEk2OAg01pgERdpGJ8sm6Ou3mXtGqEsGR43pyq356wwHWGuHJ6uX9/tYOBq4N/mXhwj3Blk3VthWtm' +
		'd2Bdb1taZ1NXYVBOXU5HYVJPaVpYZ1hUYVFLZFVNZ1pSZ1pXY1ZTXVBIWEo5WEgvYUw5bllGcVxIbFdBcVlCb1c+cVU6e1k+f1k+gFk+cU81VTghUDIfWzwqXjwsZT8ubUAvaTUkYDEgWTYhYTIcXCURg0YywHBcsGBIsGRPkk89gUs9Zj81' +
		'SzEnRTMrRDg4NywtOC8wMystMCcrMCQqMyElKyAjJycpKSguHxwhIR8lIyEpJCMrJyYsLC0xJyovIyUqJygsJycsKCYrJyUoJCEhIxwcLyQmPzM1QDY3QT49RUZCRUQ/QTw5OjIwNi4sPjg3REJBNTc3RERITElQVk5ZY1dlZFdpYFl3bFx6' +
		'cVFveU1qeklneERnckJoeUlud0ZmeUhnd0hrbEBndUZvgkx2ilJ8klmCgklxiE94iVJ6lWGFkFp7jlZ1fURfiExlsXOLomJ9fz5YhUZejFBmoGN4x4md25WpxHyItnJ6sHV+o3V6jGhmfGBbg2tmgGtoeGVmcl5gb1daalNPY09GY1BKaFdT' +
		'a1tYZVZRYVJNZ1lSZ1tUYVRNYlNHX007ZVI6bFVAdV5IeGBJc1lBdlpBdFg+cVU5c1I2dU4ze1M6dVM8Vz0nUjckTTAfVDQlVjEjVywdXi4eXCkaWy8abDgjZjIfcDonyHtopVY+r2RRnFhJgkxCYz00STInQjMpPTAvNywtOC8wMikqLyQo' +
		'KRwgLh4iKiMmJScqJSYrHRshIB4lIiIpJSQsKCgvKCouHyImIiMoJSUqJCMoJCInKSUoLSkqMSwrPDIzRTo8RT0+RkNCQz88PzgzNCsoNCsoPDY0R0JBNjg2MDo7R0hJU0tNY1Nda1puaVl1b2SAcVt3dEtpf01re0tpdUpqc0dpdEVndEZk' +
		'dUZkeEprbT9kd0huhVJ4gkx0i1N6gUhvfEVrgUhuklV7jlF1klV1k1d0klhwkVhwg05lc0BVglFmjF1ze0xkkGF4uoCUtHOArWl1o2Jyj1togFlfcVpabl1bdWFieGNldFxfe2BjfmFdcVNLak5KaVFPaFVSY1VQYVJOZ1VQa1tPZ1hIYFA8' +
		'YlA8ZlE8c1pDd15HdVtDdVlAclU7dlY9eFc8d1M5c000dlA8ZUY0UTgnUzooSzEfSiwcTikaWi0dajcnazIhaDUfazUgZTMhXSoayYJwu25arWFVm1hPhE9IXjoySTYsOzEnOi0rNikpMCYlMSclMCQjLB0eLB0iJR4kIyMoIyMpHBwhISEn' +
		'IiEqISAqIiIpICAlICEmISInIiEmJSMoJyMoKSQoLiorOjU0QTk6Rjw9S0RESkVFRT07PjEuQzg2Rz48SUNDNTExLy0vPj5ESkRIWk1QaFhiYlVqaV97c194bk1le0tlg01pd0hlcEpodkxqeUxqdEhkdEdkd0ppckVnc0BkekBmhklviUpw' +
		'h0Zsj1BzklF2jUtxjEpumlh6oWKAjlJtfUlfXjRGYjpNelRpeVVsY0Faellyhl1xj19romt4jlZoekxccE5XZU5Sa1VablVbeFxhgWRofmBieFdRc1BHdFJOcFBPalFPZlVQaldSbldSbltNaFZCY1E5ZVA7aVA9cVdAeF5Gd1pCcVM6a0w0' +
		'a0syc1A2eVU+fFtGZkY3UjYpTjYpTDMkTjIjTS8gTyobXTEhbzwqeDoobjUgZTAdXTEjUicZtXBdrmNPpV1UmVdPekVAXDkzSDcxNi8oOCwqOCsqNyooNScmMiYkKh4cKh0iIhwiISEmJiUtISMoIiQrHh4oHh4oHR0lHRwjHR0iHx8kIiEm' +
		'IyEmJSEmKSQoKyYnMy0tRTw9Rj0+Qzk7OC8wOS4uRzo5SD8+PTg3My8xLSktPDQ7SDtHTkJKXlNbXFBdYVhtdmmDc09kckRYe0hcf0xhdkhhb0hjc0lkd0tmc0pkcEVhc0ZjeUxpfkhogkVohkVohkJnk0xwmVN2kExwjEtvk1B0kk9xikpq' +
		'ik9sh1RsWTJEXDhMbEtgZUdeaU5mcVhxcVdqhmdzmXV/j2h3eFNia0tTYT9Gc05ZhmBrjmdxjmlvelhZcVFLd1ZOfFhVdFJQcVJPcVhRcFhPcVZObVVJalZEaVM/Z087b1RBcFY/dVpDdFhBbU85Z0cwY0MtaUgzZEYzZUo6WUAzTzcrTzgr' +
		'TTMlUDMmVTYoWTQlXTEgbToofUAsbjgiWy8cSCkaOxsLmltErGdNmVdMllhPeUU+Xjs2RDMxLCUlNCopNiopOCopNikoNispKiAdKB0fIR4iISMnIiAmICQoHyIrHR8oHBwnHRwmHh0kIB8lISAmIiEmJCAmJiEnJB4iJR0gNSssOjEyMykq' +
		'OS0vPC4xSj0/SkJCPDY3MS4wMC8zNjI6QThCT0JMVExXUExaXFNlfW2Dgmd/ekRXe0JReEVSeUlYeEped0lkcERdckhgcElha0NecEVgdUZjfEdlhk1thEZnhkVmj0tsiUVljEtrhUZoh0Voj0tujEtriU5sjlp1bERYXTdMaEddbVBmZExi' +
		'a1RscFZtblRjdFpjgGJufVpnflZekmBqoGp2mmRymGVyj2Jpf1lbcVVQbVRLdFRQeVRSfVlUfFxTeFxPeFxPeFxUcFdOb1ZKb1NBeF1GdV1FcVhBbFI7aEw2ZkczY0MvVDkmUjorVEEzUT4zSzcrTjcqTC8iTjAjVDMnWjUmXDIgZDUhbDMf' +
		'YjMcUi8dPCgZNyIPnmRJomJCj1VDkFdJe0g/XDg0SDY2QDk9KSIjMSYmMCQkMiYlMykmKB8cIRgYIyAiIyUnHh0hHCEmHSAnHB0lHR0mHRwlHRwjHR0iHB0hHh4jIR0iHxkeIxwgLyYoMScoLCIjMykpRjo6VUZHU0NDQTc2Ly8yNjc+QjxE' +
		'SDxFTEBLUEtXUlVhW1Zocmd5hWx9dkVacThHdkFOeUZWe0hbeUhddEdccUdccUpebEZcakRadEpidkhjfEllfkdlf0NigkJjhkhoeT9dfUNifkJjgEJiiUhnjU1si1FvglFrdk9iZUBRclFhblBiWD9RaVRjblxtYk9lZlBkbFRgaE5TaUtV' +
		'fVdkfFBegFJfflBbd0xUe1NYd1dWaE5Ibk9Le1dTgVxVfFlPf11SgGBWgGNbel1WcVdMblJDblRAdV1HclhDaEw5YkUzYEUyW0AtUzklTzcmTTkqUT4xUTsvUjksTjEkSywfUjAiWjQkXjUiYTMddEMzZzosWTQhPSIOUDMemmRLlFY8jVRC' +
		'i1RGdEU9WTk2SzU1TDo9KR0eKyEhLSIhLCAgLSMhKR8cHxoYIB0cKCUlJiEkFRcfGxsjGxoiGhoiGhkhGhkhGhsfHR4jJCMoIh4iGhQYIBccJx8jKyMkNCssQjc3T0JBUkRERjUzMicnMDE3OjlCQjY/SzpDT0NPV1VnXFdqa15whG18dEdV' +
		'cTNCcz9Jbz5Ld0NXfUReeURbc0hZcUpbc01gcEtcbUdackhddUhhd0hhe0dhhEpmmFl5fENicUJecD5cdTxbe0VjhUxph0xqhE9tfVFsc1BlcE5ceFdlcVNkVDtJUD1EWk9XZlhzY1ByYE5dVkZJVkZPXkhWc1dlgWBtgVxldE1UeFFVdVFS' +
		'cU9Ob05MdlVRd1VPdFBJdlNMdVRPd1lSb1RKaVFFalBFZk1AaVNBalFAZUk4XkIxWT4tVDspWj8qUzglSzEhWD8xZkw/VzwwUTMoUzQmWDYnXDYkXzcjXTEafVBDckA4bz8rTiQMbUEtiFNAiE46ilRChlFGcUdAVTk0RTAsPygoNSQlLSEh' +
		'KyEgKB4cKB4cKBwbHxsYHhoYJR0bKSEgJycvGhoiHR0lHRwkGxsiHx4mJCIoKCcsKCQqIx0iHhYbIBYcIxwfLykrOzM0PzY3Rjw9QDU1NSoqLigqNDA3NS41QDM8TUFPWlhqYF1ybVdufWh5d0xceDVDeztEdj5HdD5MeEBUe0BZeUFYc0ZX' +
		'b0ZXckpdcUtdckteckpedElgcUZbfk9khlJpilNsfUlidEhfaz9YbkFcc0ple05rf01rhlh2e1NueFdwdVRnfV5veFxvYEpZRzU8NygvqpuylYipXVJmYFJZX0xTbVdic1lke1xmgmBneVVbbEhKakZHakZIbElJclBPbEtJbExIbU9KbE9L' +
		'aU1HY0xEYEpBYUtBYUxBX09AX0s9W0Q2WkAwWj8uWj4tWj4sVDgnTjIlVjsvaEtAYUI2WTktVzcrVzQmVzIhWjQhXzgiXC0dYCkcZC4acUEsbkMzZjkodUUwfE06g1NGa0Q8VDs0RzYvQjAsOCspMigmLiYjKiIfJh0aJRsZHRkVHBkUIhwY' +
		'Ix4ZJigsIiMoISEnHx4kIiAnIx8nIyEmJCAlIhwiHRYcHhUZIRYcJh8iLyorOjU3QTo9QDg6PDQ2MSwuLCowOzE+RTdDUEVQX1pqX2N4Y2R4dGh6fGBwcTVFfj5GiEhMgENMeUBOej5Tf0BZe0FYckNTbkRScUlZcEpccUtec0xfdEtedklc' +
		'gE9jgExhf0lgg09mdkdcb0ZcaUZeZUVecU9qhF16hV96f2B5dVlzdFlsdlxsc1tua1hnXU5UQzE2fG6AkIaiX1duWk5ZYExRZlBWZE1UZ05Ta05Sc1NWdlRVaUVHZkFEaUZIb05Oa0xLaUtIaUxJcFVRZ09KXUlDWkhBWUdAVkY+U0c8VUY6' +
		'VkQ3WEIzWD8wWj8vXD8wVjotUjYrYUU6Y0M5ZkM2YD4zWTkuWTcqVTMjVDEfWDYiWDEeXjAbXzAZZDooXDorTjAfXjsncUczeUw+ZD81UzwxTT0zQzMqOy4nNy0mMCgiKiMeIxwYIxsZHhoVHRoVHhkTHRkTGxsiIiEnHx4kHxwjIh8mIB4l' +
		'IB4jIBshHBcdGhQYHRYaIBkeLCcqMzAxPTo8OjY5LScrMy0yKykvMy48QTJMTkFZXFdpaWl7ZmZ9amt/b3F+cFZhbyw6f0xNiEpLhENMekBMfUFTfz9XfUNXckRRcUdRc0pYcktdcEpdckxedE1ceEtbfEpdfUpdh1NogU9keUtfcUdbaElc' +
		'YklecFdwj3GLgGR7fmd8dmF2blhocFppbVlsZFNlY1ZfVERLQjVBYFdqX1ZpVUlWVUNKXElMZlJUYU1PZk9RZ0xMbE1OclBSb01OZURFYkJBZEZEblBOblBObVJOZk9KX01HVEU+U0U+UEE6TEI4TkQ6UUQ4UT8zVT4zWT80WT8yVz4yWkA0' +
		'XkI3Xz80XDgrYT0yXDkwXjwwXDwsVDUkVzgmVjciWTgfWTogTzYiRzQmRjIjWTsoakEub0I0YzwxVjkvVUA2TTovQzEoOiwjMykhJx8aPjY0KB8eHxoXHRkUHRoTGxgSGhkfHRwhHBsgHRsgHxwiIBwhHhshHBofGhgdHhoeJB8jKyYqLywv' +
		'NTM2MjAzIyIlIyAlKCUrLCoyOS9EfWuPcGWLXWB7Zmd7aWh7cWqBdW5+c2RqdzNBcjg8fD1BgD9GekBKf0JTgEJXf0ZZdUhUdUxUdkxYcktccUtedE5fckxZb0dVdElae1Biek9idEtecktea0RVZkRTZExebVducVdxcltxb15vcGBuYU9a' +
		'ZlRgaFdpZVhpYldiXFFaTkJIUkZNXVBcWE1YUURNUUJEXk5OZ1dWblxaZk5NZUhHZEVEaUtJaktKYUNAYUE/aktJbU9MZkpGYUpEYE5GVEY/TD43TkA6Sj81SkA3TkQ6UEM6VEE6V0E6VD4yVD4yV0A1VjsxWzwwXDoqXDYsWjQsZEM4YUI1' +
		'WTwsVTopUzckUzkhTjohRTsmRTsuRy8kaEM1bUIwcUA0ZTgwWjkvUzouUTotSTYpPi4iNikgKR8aJx4dJBkZIBgYHhoXHhwXHRsVGhofHBshGxkeHBkeHhogIBshHRofHhwhHRwhIiAlJCMmKSgrMTAyMC4xIB4hISAkIyIoKCkuMC86OzRM' +
		'bmOGcWuRXmF/aWl9bml9d2qCcGh4bmdreTlFezE8ezlCfEBIdT5GeEFPeT5QfERVdkdSdkpTc0lTckpZck1edFBfbklVakdTb05cclBgclBfbk1dbk5eZ0ZVZ0dTaE9faVNnaVRoalttZVppZFhjXlFaYFFZXE9bXlFfXFJdWVReVUtRT0FD' +
		'VkdMV0lST0VNVEdJV0ZEYlFMbVpWaVRRZElHYUZDW0A8YERAZEZDZ0ZDbEpIa0xIYUY/WUQ9XEtCXEtDTTs1TDs0Sj0zTEE3TEM4TUE3UD84VD84Uj00VUA1WUM3Wz80XT4yWzcrWDMpWTUtVjUqVDYnVjopTjYjTTEdTTIfRDQiOTIkNisj' +
		'PyYfXjkta0IybTsvaTkxXDgvVTouUzksSDQoPS0iNCgfLSAbJRgXIBUVJBsaHhcWIBwYHhsWFxkfGhohGxgfHRgfHBkgHRohHx0jIB4jIB4jISAlIyQoKiswLy8xIyMkHhwgIyEmKCcsLS4zLS88NDlNQkVbUVJoXFtwa2d7cml9dmyAaG55' +
		'YFJZbDA5gTJAeDZDcDtFbkBIcENMcj9Kd0FOeUVSckNMc0lQc0tVb0pWcExYbkpWbU1WbVBZclRea05cZklYZEdXYklVYUtUYkpVa1VhXEtYW1NfWFRfWlBaXVJaWk1UWEtRVElPVEpSVlReTkhQTD1CVkVGVkdKUklPVEpMXUxGaE9HZk9J' +
		'aVZSZ09LYUlEXkZCW0I+YkZBZkdCbkxHaklCXUE4W0M5WEI3WkQ6X0U8Vz00UD4yUkI3STovSjovSjguTjkwTzkuUz0xXEQ2XD4zWzkxWjQvVjQsTzAlUzQoUzUmTjIgTDQfSjAbRS4cOi4jLykjLyYgNCQcQSkcXToqazsxZzoxWDgsVTsv' +
		'VDguQjImNCogNSsiMiQfKxsaIhkXIRkWHhcTIhwYIh4XFxgdGhgfGxgfHRkgHBkgHx0jIR8lHhwhHRwhHx4jJycsLi8zKywtHx8hIyMmJSMoKyswKi0yLTM6N0BJQEhUS1FfX2FxYmFwb2h4eHCBaGh0VD1GcTI7hDlEcTQ/ajlFaD5IakFL' +
		'cEFLdEJMdUVPcENKckhOcktUbktVaUdRakhRcVFZblBYak5WZktWXkVRXEVSX0lVYk5Xa1RealNdYE1XUkZNTURKUkdOVEhNW09TXFBXT0ZOVE1XVlNcTERLTkJFUURFVEpLVVFTVkxNXUxHaFFIYEpEXktHY0xHY0tDXUc/Vj03WDw1YUQ8' +
		'a0pEZUQ8ZEM4YUI3XT8zWDotYD8zZEM4X0Q5WEA2VUE3U0E3TTowSjYvSjQqTjcqVz0xVzkuVzYtVjIrTS4lSi4iTTEkTjEiTC8fTzEhVDknSjMiNyoeLSUdMScgNCQbNR8RSCobWjInYz00VzkuTzQpTDEoOisgMiofMCgfNSghLyIeJh8a' +
		'HhkVIh4ZIB4XJCQbFhUbGhgfGxceGxceHRshICAlHx4jHRwhIB8kJiUqKSgtLi0yJiYoJSYnKCgrKScsKCovLTI2KTE2Mz1DOURNTVdkXGFwYF9wcmx8e3aDbWZzXD1GdzU+iUBJbzY/ZThEXjlCYj1Faj9IbUFIakBGakBFb0dMbUlRa0pS' +
		'aktRakpQaUtQbVFWZ01TZE1TWkdOWUhQWkpRX05WalZebFVdY05TV0dKUkVIVUlMVEhKXFBTWlBWS0ZNUk9ZVVFZUUpPSD5AST8+TkhGT05MUkpHW0lDZ1FIXUlBVUM+V0I8XUc9XEY7WUA2VTkxXD42ZEc+YEI6Y0Q8YkI6YUE3Xj4zYD41' +
		'YkA1Y0E3XT00XEI4Vj82UT01Uz02Vj40W0I2Wj0wUjImVDQpUTAoTTAlTjMmTjIlTTEjTjEkUjImX0EyUTUoQSwiNiQdNSMcOiUcOSMYOSIURSkeUzYrVjswRy4kQywiOCkeMioeMCgcNikhMCMdKyUeIx4ZIiAZKSohKS0kFRQaGBYdHBce' +
		'GxgfHRsiHyAlHyAkICAkKikuKSgtKyovKigtKSkrKSssKCgrJygsJysvIiotJjA2NT9IO0dTSlZlV15uX11wb2d5eHF9e3B6VzU+cjQ6jkZOdTZBXTE6VDM5WTk9Yz1CZjxBZz9CakJGb0lNbUpQakpQaEpOaUxOZEhKZEtOZU5QY05RXElN' +
		'XU1RXU9UYVRZaFZdZlJXX0xPWkpKWEtLW1FTVUpMWU9QU0pOTkhPUE5VWFRZVU5RSD5ASkA/SkRBTUpGT0hEYFBJYExAX0xDW0pDV0M8WUI4YEg+ZEtBXkQ7YEQ8XUE5Y0dAYUdDYERAX0E8WTs0XD43X0E5ZkM7YkI6XUA3Wj82WD00WT01' +
		'VzswXj81XzwxUCwhUzAmUjEnWDYrWTksUDQnSzImSi8jSCwhUjImSywgTC8mRywlQCYgQygfQSofNCUYNSgbOCYbSS8nRSskPiggOCcdMygcMSgcNSggMSMcLCQcKCMcIiEZLS8kKC4iFxQaGhceHBgfHBkgHRwiHyAlICImJCUpKCgsIyEm' +
		'JSMoKScsKSkrJigpKSstJSgsKjI1JC8xLjk+OEFKN0RNRVNeVVxoXlpnbGNvdGx2eW53SCkvZiwxjEFKhjtIXDEzUDIxWTs7ZUFCZj5BZT9CbEVIb0pNbEtPZEZLYkVIZkpJZUtJYElIYUxMYUxNWkdJXElMWUpNV01QY1RZZFNYX09SW05P' +
		'XlVWZl9jWlJUWVBRV05QUktPUk5TV1NTV1BQWlBSSkA/U0lHUUlEU0pGW0xEYk5DaFVNWklDWEQ7W0Q5XUQ7ZUxEZ05HZktGZUlDZElEW0M+XUA8YkI8YkE6X0A1Wz0zXT85YUU+Y0c+X0I3Xj4zYT81YD41Yz81Zz40XzUsXDctVTUrYzox' +
		'Zz0zXT0xVj4xSzYpQi0iSjImRy4gQCYaRi4kRC4kPisfPi4iMSoeJCIVKB4UPychSC0pOiYeNiQaNCkdMCUbMyIaMiEZLSIYKSIbJiMbLC8jLDElFxQbGhceHBgfHRohHR0iHyAlIiQoJicrISElHRwhJiQpKScsJCQmIyQlIyQnIygqJS0v' +
		'JTEzLzo+OUJFN0NGQ09TUVdcW1dcZltidGpzdGhuOR0fZjEziT1FiztIYDMzVDYwWTo2YTw7akBCZ0FCakVGa0hKaEhKYkVHYEZFY0lHYUlFXUZDXUZEYktLYElLXkhLWEhJV01OZFZZY1NYX1BUXFBTWlNWWVRXXFZYWlFSTUVFTkdIV1JT' +
		'VFBPVU9PZ15fVkxMUERBVkpFVktFWktCY09Eb11UXUxFWEQ8WEA4WkE6ZUtFbFNOa1JPak9NY0lFXUI5XT82Xj40YUA1YUAzYkM3XkI8Wj43Wz02XDsyYT4zYj0zYDsyYTsyaUA2ZjwzZD0yYDsxdEY9ckM5YT80V0A0TDwvQjIlRjQmSjco' +
		'RC8iRC0hTjcrSDUnOSgaMCcaKSgaKSMXNSEbQiolPSgiOCUcNSccMyQbMh8YMyAYLSAXKSAYKiQcLS4jJSkdFhUaGRgdGxofHBsgHRwhISAlJyYrIyInHx4jHBsgHh0iIiEmISAlHyAiGh4fIScmJi4wLTc6Lzo6ND47NUA/RE1OTE9SV1RX' +
		'XVVZcmpwWEhJPRwYYy8shkFElElOZDQwVDUuUjQwXzY3ZTk5ZUI+ZkZEaUdGbUxLZkdGYEVEXkdEXEZBZElFY0VDakxNa1FUYE1OWk1MYFNTYVJTXU1OW0pMW0xNX1JSWExKVEpJUUlJVExOVUxNVUtKVk9QWlVWVlJRW1ZUUEdEWUxJV0lC' +
		'WklAV0Q6X0tCXEhAVkM8WUU9WEI5WkE6WT87c1lZk3yCX0VFbE5EZEs+V0I1W0U4YEY6YEE3ZEA4aEE6ZDw1VzEpVDEoWDctWTcvWDgvVzctWzcrYjcrc0A3eEc8b0E4ZT84V0E3Sz0wQDEjQS0fRzAiUjYpVTInXjUrZzgvXTEnRigcQC0g' +
		'MiccKx8XNCMdQismNSAZNyMcNCAZMh8YNCEaNSQcLiMaKiIZLCkdJyUZFxYbGRgdGxofHRwhHRwhIB8kIB8kHRwhHRwhGhkeGRgdHx4jHRwhHB0gGx8fHCIhHycpJzI0Lzo6Mz07NT9ARk5RUFJWVVFVWVFVc2txRjY3NhoVXC4pfz4/lk1R' +
		'ZzczTjApUDYwXTg4Yjg4YT86YkRAZkZEakpIZEVDYEVDXEVDXUhDYktGYEVCYkVFZ0xNalNUYU9PYU5OZlJSYk5NX0xLXE1LYlNRX1FOVkpIVEtLU0lKVUtLV0xLVExNVlBPUkxJWFBNVElGX1JOXVBIWUpAVEI4WEU7WEU8WUdAWkhAWEY8' +
		'WUQ7YEY/ZUpGbFFRXUE/Y0U6ZEo+Xkg7YEg8ZkpAYkI5XToxZEA2b0c/aEI5VzIpUi8lVDMqVjYtWjowWzgsXzQqbTwyajsuazsyZzk1UzMtTjw0QTUqOisfPiseSDAkTi0jVCwkZDUvYDEqTiogQyshOSsiLyUcMSQcMB8YMyAaNiMcMiAZ' +
		'MCAYMiIbNiYeMSMbLB8XKSEXKSIYFxYbGRgdGxofHRwhHBsgHBsgHBsgHRwhHRwhGRgdGxofHx4jHh0iGBgbHCAgGB4cGSEiJzE0LDc4Mz09OURFQ0xPUFJWUUxQWlFVcGZsZllZMxwYUysmdTk5m1VZdkRBSy0lTTYvVzg1Xjg3Xj05YUI+' +
		'ZkhFY0RCXT88W0E9WUI/WUZBW0dBY0pHZ0xKZEhIc1hZcFZWZUtIZ0xKYUZEXkdDXUtGX05JXExHWktIV0pJY1dXYVRTV0pIVEpIWlBNWE5LVElFWExGXk9KW05FV0pAWUg+VkQ6VkQ7VEM7Vkc/V0Y+WkY8XUQ5YUQ7ZkpCZkhAZEQ7YUU6' +
		'XEE2W0A1WjwyYkI5XD8yWDktYT8zb0o/bkg9XzkvVjMqVTUqWDctXjovYTguZzkvaDwxbj01eEJAYjYzSzEsQTIrOi8kPC4hQi8jQSYcTiokXTMvZDgzVzAqPyMcNCQdNSskMiohLCEZLh8YMSIbNSYfNSYfMiQcLyEaNiQeMCAZLB4XLyIa' +
		'FxYaGRgeGhkeGhkeGhkeHBsgGxofGxofHRwhHRwhHh0iIiEmHRwhFBUXGBwcFBoZHSUmKjQ2KjY3Ljk6OENFQElMSkxRT0lOW1BUZlxha2FhNCQgSSklcDo5llRViVJQSikhSTMrTDEtWDY1Wjs4X0I8Y0RBaUtIZUhEVz46VkE8VEE7WkVA' +
		'X0dDYkhEYkZEY0dGaEtIZ0hFYUI/XT88YUZCYUtEXUlDWkZAXUtFWkpHYlJRXk5KXEtHWUpFV0lEXE1HWkpFWEhDXU5HXU9HVUc+WUg+XkxCXkxCXktEXExFWElBWkc8XUQ3X0M3Y0U6Y0U7YkQ6X0I4Wj4zVzovUzUrWDswVjsvVDksUzYq' +
		'WzswZkM5a0Y9ZEE3XDowWTcuXTgtXTYrXzYsXjgtZjcvbjYyc0A9WTUxTjQvSDUtQjEmRC8mTTQtUzQvUzAsWTUxUS4pPyUgMCIcKSEaJh8XLSQcMSQcMyYeMiUeNCYfMyYfLyEaNiUeMSAZMyMcMiMbFBMYFxYbGRgdGhkeGhkeGxofGxof' +
		'HRwhIB8kHRshHh0iIiEmFxYbFBQXFxobExoYHycoKTM1KTQ2KzY6Mj1BPUVKSktQT0hNWk5TYFVaaGFiOTAsOyIeZTYzkFBQl1ZVUykkQy4kSjEsVjc2Wj47XkI8XD85aUtHZEhDVT03VkI8VUA6WUI+W0M/WkI+W0I+XUM/YEVBYkRAaUpH' +
		'Z0hFXT88YEVBXUQ/XEY+X0pEX0xIVkNAW0hEXUlDWUhBXUtEXUpDXElDX01GYlNLXk9HWUdAWUU8XkhAXkpBZVFKY1JLXUtEWkU6WD8yWz8zXkE2X0M5YEU6XkI3Wj4zVjswVDkuUTYrTTMpTjcrUjouUjkuVDcuXj00ZUM5ZUI3Yz80YTwx' +
		'XjkuXDYsVzQrXDMrZjMsZjQsYzcwYDUwYDs2VDcuUDQrVTkxUTQuUTUvSjArQiwmOSciLSEdKiIcKCAZLSIcNCchMiQeMCMdNCUgNiUgMCAcMCIaLSAYNCUdMiIaFRQYFxYbGRgdGRgdGhkeGxofHBsgHBsgHx4jHBsgGxofGhoeFxYbGRkc' +
		'Gx8fGiAfHSUmJi8xJzI0KTQ4MTxAOUJGSElOUElNVkpOW1BVZWBhPjg0NiIdWC0qg0REn1hZYjIuPycfSjMuUjUzWD06WT04Wj02Vzo0Vjo2Vj45UT43VT45WkE9W0M/Vj46WEE7WEA7XkQ/YERAZEZCYkNAXj47Y0NAYEM+WUE5XUZAXEhD' +
		'VUE9VD86XUdBWUc/XUpDY01HXUdBXktEY1JKYE5GW0dAXEQ9X0Y/X0dAX0lCXEhAXElAVkA1XUQ4X0Q6VjoxVjwzWEA0VjwxWD4zVTovVTsvVDswTTUrTDcsTTkuUDswUzsxVjsyWTgtXTovYDwxXjkwYDsyYTw0WTgvVzEpXjAnaDktZjUr' +
		'bjcxajk1VzErUS0nTSwmUDUuTjgwSjgwPjEpNCojMCkkLCUgKiEbMCUeNikjOCkkNygjOScjNSIeMR8bLSQbLSQbLiAYLh0WFRQZFxYcGRgdGhkeHBsgHh0iHBwhGhsfFxgcFxcbFxgaGxseGhocHR4gIiMlGR0eFx4eICkpIywtKTM1MT0/' +
		'ND0/SEtOUEtOUEZHVkxOZFxfOzU2Kx4cUi8tdz4+lFFTbTk4QSEdRi8qVTw4WTw4WTs0WTw2VTw3Ujo3Uz46Uz45VUA6WEE8W0M+Vz44WD43Wj44XkI8XEA4XD83Wzs1Xz03ZD87Y0E7W0E3VD00V0I6VT84VDo1X0M/XEZAXklCZ09KYktF' +
		'W0hBXkxFZFBIXkdAXUY+YUc+YUU8XEA2Vz80VEE2VUA1VD4zUDkxTzcwUToxTjYrUTswUDswTzcsVTgvWDszVToxUTguTDUrTjcsUj0xUTwxUTgtUDUrTjAnSisjUC8nVTMrVjgxVzMsYTErYzQuZTs0ZTw1TyglTiwpUCopWzY1Ti8sSjMs' +
		'QzIpNy0lKysiJyojKikkKiYhKScgKCQdLSIeNCQhOCUjMCEeKyIcKCUcJSIZKiIaKx4YFRQZGBccGRgdGxofHRwhHRwhHR0hHB0hGxwgFxgbHR4fHB0fHBweHyAhHiAiFBkaGiAfHSYlJS0tKzM2MTs9Mzw+RUhKUExOUEZHVUtNW1FUOjQ1' +
		'KR4cRyonajc1hklId0ZCSikkSjIsUTkzVDcyVTcwVjs1Uzs3Uz47VkE8Uz45VD44WEE6XEQ+W0E7Wj84Wz85WTw1Wj00XD41WzozXjw1Yz44Yj43Wz82WT42VT02WUA5Wj85YkVBXUU/XkZBX0RAYklEYEpEYU1GY01FYUlBYEg/X0U7XkI4' +
		'XD4zVDswTTovUT0yVEA2TzsyTDowUDsxUjswTDgsSzcsTTctTjUtUTYuUzsxVDwyUTovTTcsTjkuSzgsRzgrSzsvTDkuSTIoSS4lRCgfRy0mWTkxVy0nUCkiUzUsUjcvRygkRickSiopYUJCSS4rRS0oQy8oNCojKCsiJSokKSolKygjKCcg' +
		'KCggMSkkMiMhMyMhLCEeIx8ZIx8YJyIaLCQdLyQfFhUZGBcdGhkeHBsgHBsgGRgdGRoeHR4iIiMnHyAiICEjGxweFRcZGBwdGx8gGB0dGiEgHicmJCwsKC4wKTEzMTg7QEJFRUBCTEJDVElKUUhJMy0tMCckRCwoWi0pczw4d0pDUDMqRC4l' +
		'STIrSzApTzQtUTgzUzw4VD87Uz45UDkzUTo0V0A6WkE8WkE7XEA5WDw1VzkzWDoxVzcwWzoyXDkzXzs1YT44Wz01Wz43WTw2Wj84X0M+YEI+WkA7XEE9XkE9YkZCZkxHZU1IXkc/XkU8X0Q7X0M7XD42VjkwVDwxUj4zTzswTz0yUD40Tz40' +
		'UD0zUj0yTzovSTYsSzgvTDkvTTcvTTkuTzsvTjouTz0xTzwwTDouTEIzSD4vSjsuSDUqSTMoSzEoSjAoZkdAVjEqSywiSDInRTEoQSciQiMhQSknOygmPCsnQCklPSgjLSUgHyMdGiAaHx4bJiAdKSYiLy8pMSsoLyQiLCEfKCEeIiAbJh8a' +
		'LiYgMyslMyslFhUZGRgeGRgdGxofGhkeGhgdGhoeHyAkHR4jHB0fGhscFhcZFRkaFx0dHCEiGyEhGiEhHygnJy4tKC0tJy8wMDg6PkBDPTk7RTw8TkVETkRFMiopMSciQyskYDcxcD02bEE5Sy4mPCcgQS4mRzIrSzUuVT85UDw3TDk0TDcy' +
		'TjcxUTkyVj44WD45WT04WTw2VjgyWTo1VTcxVDUvWjk0WTgzWzo1XDs1WDoyWTo0Wzw3XUE6WT45Wz46WD03Wj85Wz04YUM+ZUdCYkdBYEU9XUI5XEA4Wj01WTw0WTw1UzkwUDswTjouSzgtTTsxTjwyTDkvTjovTjoxSzcuSTcuSTgwSTgw' +
		'SDgtRjYsSTkuTjwyTz40UEA1Sz8zSDsvTTswTDYtSi8oSi4nTC4oVjIsWDIsTS4lUDgwSTMtPCMfPiYhOCcjNyonOywqOSMiNyEgKCAcISMeHyYhIB8eJiEhIx8dKSciKyUhLyUjLyckKCQgJCIdKiMeMyolMSokKSQeFRQYGhkeGxofGxof' +
		'GxofHBsgGhoeGRoeGBkdGxwfGhsdGRocFBkZGB8fGSAgGB8eGSIhISopKC8uJS0qJi8uMDs6OkBAPDs8Qz49SUNAUklJMigoLyIfRCkkZDgzbjs1aDw3SismOichPy8pSTkzTTs0Tjs1Tjs2TTs2SzYxWEA5WD44VTw3VDg1Wz46XD85Wzw3' +
		'WDk0UjUvUzYwVTgyVzo0WDo1VjgyWDwzWDozXT45WDw1Uzs1V0A6Vj02WT43YUM9ZUZBYkM+YkU/XkE4Wj80Wz82WTw0VDcvVzozVzs0TjYsTzgtUDowTTgvUD40UD0yUDovTDUsTTYvTDkySzozSDs0STw0RDcvRzoySTozSDozSjs0Szow' +
		'SjctSTQrUjoyTzUuSS8oUDMsVTAqVzErVzcwUzozRSsoOiMfOSkiMyMgMR8gMB4fNCAhNB8gKh0dHx8cHiIhIyQkIiAgIyEfJiEeJB0bKCAeKyUiLiomKicjKiQgLSUiLyglLiglFBQYHBogHh0iHhwhHx4jHBsgFxgcGBkdHB0hHyAiHBwe' +
		'Hh8hGB0eFyAfFyAfFR4dGSIhHygnJC0qISsmJjIvMT07PEREP0FAOzo4JyIeOTAvNSoqMSAdTi4qbDw3cDo2Zzs2VTcyPy0pQTUxST48Szs1RjQuTDs2V0VAVUA5a1FJWT84UDczUzczWTw3XD44Wjo1WDo0UzgxUDYvUjgxVDozUTcxUTcv' +
		'VDkwVzozVjo0Vjs0Uzw1VUI7WUM7WT84ZUhCYkM+YEI9YUU+YEM6XUA1Wj0zWDw0VjkzVTgyVzozWDszVDkwVj00UjoyUz42UTwzUzkwVjs0TjQuTDYwSDgxSDs1RTs1SD45ST44RDgyQzUwRjgzTz41SzkvRzUrSDYsTDkvSTYtSDEoSSoj' +
		'Ti4mUjcwSjQuQSglQC0oMikhMiAfMxwfMhwfMR4gMiAhLh0fIx8fHB8gGxweGhscICEeJh4cJRwaIxoZJR4bKiUiLSkmKiYiLSkkMS0oLysmFBQYGhofGxsgHBwhICAlHR4iGxseGRseHiIkICMkGh8fHSIiGyMiGiMiFh8eFh0cGSAgHyUm' +
		'IigoICknKDMxNkA/Q0pMNzw+JSUmJBkaKh4fNSYmMx4bSyomZTg3Zzk4XTY0UjQwRzIuRzs2QTk1QDMtSToySjs1b2BbcmBcSjQxUzo2Ujk0VDo2Vjk1WDs3VjczVjk0Ujs1UDkzUTkzUDkyUTkzUTkxVDYuVjgxVTgyVTozVTw2WEI8VUE4' +
		'WUM7YUdAXkI6YkU9X0E5XUA4YkU8XT83XkA4Wz01Wj02WT01VzsyVzwzVTwzVDs0Uzs0TjgvSzUudWFaSjYwRjEuRTUyST49Rj5AR0NCQz8+QTU3QzIxRzYuRzUvRTUwQTMsPDAnRTkuQzYsPi0kQy0lRzIqRTMsRjYvSTcxOy4pMygkNyUk' +
		'NR8hMx8hMCAjLR8gKiAgJCEiHR8hGBkbGxocIRwcJhsaKB0cJRoaJBwcKiclKSgnLC0oLy8pLy0oLCgkFBUZGBkdGxwgHh8jHh8jISImGx0gGBwdGyAgHiMjHSMjHSMjGiIiGyQjFyAfFBsbHCIiIigoICYmJCwsKDEwN0BAPEJGKy8yKywv' +
		'LCQnJiAfNiwqOCYiRSglUiwsWjc2UzQxUzczSjcxPzMuPTYyPzUwRTozSTw3STk1RzQwSzUzUTg1VDs2Uzo1UzgzUjcyUTYyUjgzUDgzUzs2VDw3Uzs1UDgzUDYxUjMtUTMtVDcxVTo0VTw3Vj04VkE6XUc/XkU+Wj03YEI6YkM7Wz42Wj42' +
		'Wz42Wz01Wj00VzsyVjsyVDowUzoyVTw1UjozUTkyTzgyRzUuQDMrQTIsRTIyQTQ0RTw+SDxASERGRUNIQDdCPjE5PjIzPy8uPi8tOi8qNy4mNywjPC4lPjAnQjUrQTUtPzMrQzgwPjQsNiomMiQhMiQjLyIhLB4fLR4hKR0eIR0bHh0dHh8h' +
		'HB0fIh4gJRweLCAgLiIiKiAhKyIjKSUlIiIiKiolLiwnLSgkLCUiFhcbHB0hICElHyAkICElIiMnGBsdGx8gIycoHiQkHiQkISgoGiQiGiQjFR8eFB4dHSYlHyknHiYlJy4uKzUzOkREKTAyJywvMTU3Ki0sIiQhLiomMyYiQykmSiknUTcz' +
		'UTo0TDcwRDIsQTUwOzMwQTw4QTk2Rzo3QS8rQy0oTDMuUzo0Ujk0UDcyTTUwTDYvSjUuTzgyUDYyTzUwUjgzUDYxTzUxTjMuTjErTzMsUzcyVDo1VT04VT04WUI8Vj44Vz02Wj03Wjs1Y0M8WT41UjkvVjkxVzkxVjkwUjgvTzcsTjYtUDcw' +
		'UjoyUDkyTjgxTDcxRTQvQTQuQjQxQDE0QTc+QDxFQTlBQUBLQ0ZVTUtcPjpJOTZDPTU2PjQyOTEtOC8qNywmQDErQjUtPzQrPjMrPDEoNiwjMichNScjMyUiLCUhMC4pLCYkJxocLB4gIx4cIB4eICAiISAjJSIjJR4gKyAgLyMkLCEiKB0e' +
		'JyAhKCUmLCYjMCYkLyIhLR8fGBkdHh8kHyAkHh8jIiMnHR4jGBwdHiMiHiQjGiAeHSUjGiMhFyIgGSUjFyEgGCIhHSYlHCYlISgoJi0tND48LDU1HyUoIycqLTI0MjY2ISQhKiQiMSAdQyclSispSjgyRTUuQS4nQzItQjYyQjw5RkNBTUdF' +
		'Rjg2PSomQiokSjAoTjQuTTUwSzMuSjQuSDUuSTcwTjkzUzYyUTUxUjYyVDg0UDQwTDEsSjApTTMtUTcyUTgzUDgzUzs3Uzw3Ujo0VTs2Vzs2WDw2Wj02VDoyTzcuUDUtTzMsUTYvTjYuTzgvTzgwTDUtSTQsSzcwTDkyTDkzSDg0QzgxQzU0' +
		'PzA4QjtJQ0dZRE9sPk1vO0ZkQUJXRT9OPjdEQzs+Pzc2OS8tOC0qOSwpOi0pPjApPS0lQTEqRDQuPS0oOSkkOSklNikmMS0oMDMuLy8rKyIjLiIjKSUiIyAgIR4hIR0gIB0eIxweJh0fJRsdJRkdJRodJh4gMiwtMiYmMiMjNCIjLRobGhsg' +
		'Hh8kHh8jISImISImGxwgGh4eHCIgHyUjGyMgHCUiICkmGiMhFiEgFyEgHCYlHCUkGSMhISkoKTEwOkNCISsqHCIlHyMmIScpNjw8JCYkLSYkNycmQScmQiYkPzErRjcwQjApQTAsRTo3SERAR0ZCTUZERDUzRC4rQiokRi4mSDEqSzMtRzAq' +
		'SDIrSTUuSjUuSzQuUTczUDYyTjQvTjUwTTMuSjArRzAqSjMtUDgzUTk0TjYyUzs3TTczTTYxUjs1VT03VDs1UzozTjYuSTIqTDIrSzApSzIrSTIrSTQrSTQsSTUuRjMsRzMsSDUvSTcxSzo1RzozRzk4QzQ9QjxQRE9tfZrAiKbQRVqIQUdc' +
		'RD1FPjI5Qjk6RDk5QjQ0PS8uOCsnOi8pOy0mQDEqSDcyPy4pPSwoPCknOSsnPDMtNzMuMjMuMTEtLiopKiQjJyEfJiAiIh4hIBsfIhwfJyEjKCImHhcaJRwfJhwgKSEjKCIiKBsbLBscMh4hKRcYGRofGRoeISImICElGxwgGRseGR4dHyQi' +
		'IiknHCYjIywpJS4rGiQiExwbFR4dGyIhHCIiGh8gIigoLjU1N0A/GyYlISgrICQnHCIlKzc2IyooISAdKyEeOSomOCchNyokPi4oPyokPSomRDo3RkVCQkI8SEE9RDQxPygmQSklRTAqRTAqRzErRzErSDArSTArTDEtTTQvTjYxSzMuTTUw' +
		'TjYxTDQuSzMuSzcwSzgxTTgzTTcyUTk1UTk3SzcxTDgyUDw2UT02UTo1TjgxSzYtSjQrSTApSzErRzAoRjEoRzMqSTUtRjIrRzQtRzQuRjUuRDIsSTcwTD42TDs6SjpFSENZUl+DfJ/Pl7vvQVySP0thRUVKQjpAPzQ1Py8vQjExPCwpOS0n' +
		'PDMrOzQrQDkxRDozOzEqPjIuPzMvPjQvOjQuNC0pMSonKSUiJiYjJSUiIh0bJyEiIRsfHRcbHRcaIR0eFxcaFxQYIhwfJh8hJyIjJB8eIhcWJxgYKxscJxcYExMYEhMXFxgcFhcbGhseGBkcGyAgIigmICYkGyMgGiMgGCMfGSMhFR4dFBwb' +
		'FRobGyAgGyAhISkpLDk4LDY2Fh0fHSIkGh4gFx8fHywoKDEvKSwqLCsnOjUvPzgwPS8pQDAsQTAuRzg2TkZDQT85RD02Oy4oOyolPSYjSC8rSTAsQyokRCwlSzIsSC4oSC0oTTIuTzYwTjQtSzErSjIrTjYwTjcxTjcxTDcvTTcvSzQuTDYx' +
		'VD44Tzk1STcxTzw2Tjs1Tzw1TjozRzQsRjMsRTIrRjEqRjEpRzMrRjMqRTIqRzYvSDcwRjUuRzcwRjcwRTYuRDQrSjkxTTs5TDxFTUVZUlZ0SGCVQlyZOU59O0dbQ0ZMQDtEQjU6QDAyPC0sOy4qOS8pOzMsPjoxOzcuODMrODIrODAsOzIv' +
		'OjAsMicjMSQiLyEhKyAhJiIhIh4eIhsbKiEkIxwgHBYaGhUaGhYaGRcZGxcZIBoeIxsdJh0fJh4eIxUWJhcYKBobIRQVDA0TDxAVEBEVFBUZFxgbFxgaHSIhIigmIicmHSUiFR4bGiMfGCMhEBsZEBkYFhscGyAgHCIiISwrKjo6KDIzFBob' +
		'Gx0fFhgaHiMiGiMgICUkLzExPj88P0A7PDs0QDYwQjYzRDo6S0JBUUpGQj82OSojOSYfPCchQCkjTDErSCslRScgRyoiTC8nSS0lSzErTDQtTTMtTjEpVTkyRy0lRi4nSjMtSzYvSDMqTjgvTzcwUDkzVUE6TDozSDcwSzkySDYvTDgxTjo0' +
		'SDQsQi8mSDUuTDozRzUuSDUuSTUvQTEpRzgxSjs0RTYvRzgxRjgxRTcvRTcuRjUtTDo3Szs+TkBNVExiRkxuRUt0RUtqQkRSR0BHRjhCPzA3QzU3PTAvNywnPjQvTEE9QDgxPDQuQDcyPjYwNi0qOS8tOS4rMyQiMB8fLh4gKh0gKSAjJyAi' +
		'JBkbJxwgIhoeGhQaGBMZGxgeHRcaHxcZJRseIhgbIxkaJhsdIxQXJBYZIBQXGRATCwwSEhMYFRYaFhcbFBUYGBobHSIgHyUjISclGyQhFyAdFh8cFh8dEBoZDxYVFhobGR4fHSMjIy0tLTo6KzQ0HSEhHBweHBscJygnJisoIycmMzc2RUdE' +
		'S01HQkM7QT41S0Y+S0I9ST87RDo1NS0lMiMbPSghQCkiQyoiRywkRighSy4lSSwiSCsiSi4mTDEpSjApSzApSS0mSi8oRSwmQy4nRTEqRjIrRDMpSTYuTTkzTzw0TT01RzgxSDgxRTUuRjUuRjMsTjs0TDkxTzkvVT8zUjwyTzsyTTkySjgx' +
		'RTQtSjkySjozRjYvSDcwSDYvRTYvRjgxRDUuSTgyTDs7SztDTD1KSD9RTUVaT0dZSD9GQzQ3RzI4PisvOSgpOisnOislPjAqPzItNickNyglOCsoNisoNCooMysoMygmNCYlLyAgKx0eJxsdJBweKCAiJBsdHhUYHBYZGhUaGBMZFxMZHhkd' +
		'HxcbIhgbIhkcHxYYIhgZIhgZHhQWGxIVFRARDA0SEhMYFhcbGBkeFhcaHB0fHCEhHyUjIignHSUjFB4bFh8dFR4dEBoZDxUVExgZGR8fHicmIiwsLTg3LDU0KCsrHBwdIR0eKiYmNDUyNTc1NDk2P0I9Q0Q+PTsyPTkwRT01QzMsPikkNiEc' +
		'Mh0XNiIaPSgfPycfPyYdRCgfSi0lSi8kTTInUDUrRCkgSi4lTDApSS4nRy8oRy8oRC8oRDAqRTIrQzErPS8lQjEpTjw1UUA5TD42RjozQTMuQjQvQDAqRDQsTDszSDYuUDktVDsuUDouSjYtTDkyTTw1STgyTTw1SjkyRzUuRzYvRzUuQzQt' +
		'QTYvQzYuRDUuRzYzSzg5Szc7SDY7TDxCTUBISTxCRTM4Ri81QSwuPysqPywoQC0nPSwmNSUhNCAeMR0cLh0dLSAfMSclNS4sMCYlLyQlLiEiKRweKR4gJx4hJBweIhocHRcZGhUYGBMYFxIYGBMaHhcdHhcbHBQYHBUXHhYZIBgaHhcZHBcY' +
		'GBQVExETCgsRDQ4TFBUZFhccFRYZHB0fGyAhHSMjHiMkFx8fFR4dFh8eExwbEBgXEBUWExgZGiAgHicmIy4sKjU0MDk3MDU0IyMjIRscMSopNTUyMzQyMzYyMzQvMy8pMikiMCcgOSkiPyUfQSAbPBsWNhcTOCEaOycfPCYfOyMbPyYdRy4k' +
		'QywgQSofRy8mQyoiRy0mSjAqRy8pRC8oRTEqQzApRTQtQzMsQTIqPC4lQDAoTTw1Sjs0RTcxQDUwPjErPjArPS8qRDUuRjYvQjIrRTEoRjEmRzMqRDEqSDYvSjo0RjcxSTkySjozSTkyRzcwRjYvRzgxQTcuQTYuQDQtQTQvRTUyRTIxRTEz' +
		'RTU1SDw+QzU9RTU+RDE1QywvQy4uPysnOygjOScjNiQiNSEhMR0eMB4fLiAfLCIhMCgmLCQjKyEjKh4gKx8hKh8iKB4iIxsdHRkZHRgZGxYaGRQZFRAWFxEYHRMbHRYbHBcbHBYaHBcZHBgZHBkZFxQVFBIVEBETCgsQDg8UFBUZFBQYFBUZ' +
		'GBobGh8fGiAgGR8eFBwcERsZExwbFR0cExkZERUWFRobGCAfHScmICwqJTIuLDgzLjYzKSopJB4dLCMjKikkJyklJiYkMCsoOCsoNiQgLCAaMSAZOx8YQh8WRCEZORsTNB8YOCUfPCghOycgPCcfQCohPCcePCkfPiojQi4nRS4pRi4rQiwn' +
		'QCwmQi8oQzMrRDYvQDMrPzEqPC0lQTApSDcwRjUvQDItPjMtPTIuPDAqPzIsQDIrPS8oPS4nQDApQTApQjErRjUuQzIrRDMsRTYvSDsySj01STw0RTgwRjkxRTgwQjYtOjEqOjEsOzIuPzMwQzMzRC8zQjEuQjU0QjM7Py01PyspPioqOyYo' +
		'OSUkMyAeNSMiMyEiLx4fMiEhMCAhKx4eKyEgKiEgKyIkKiElKB0hJhoeJRoeJx0hJB0fIR0dHBkaGxYZGhUaFhEXFRAXGhAYGhEZGxUaHBcbHBcbHBgaGhgZFBIVExIVEBASDAwSERIXExQYERMXFBYZFhkaGB0eGB4eGB0dExsaEhsaExwb' +
		'ERkYEhkZExkaFRscFh8gHSYmICwqIC4qJzMwLzk1Ky8sIB8eHRgXIx8dIiEgGxsZJiAePCwqOyYiMiQcMSAXOSEXQCMZQSIaPiAZNB8YNSMdPSolQS4nQC4nPy0mPCskOysjOyojQi8pQC0nQS4pPSokPiwjQS8nRDIsQjMsPzIrPC8pOywl' +
		'Pi4nQzIsRDUwPjEsQDUvQDUxOTAqPzUuPTAqPC4nPC0nPjArQTIuQzQvRzgzRDQuQTErQDUtRjw0TEI7QzkyPTMsQTcwRDkyQjcvPTQsOjMtODAsOjAsQTMxQzAyQC8pQDAsQC4yPiktPigjOSQkOCUmOCUlMSAfMR8fLx0fMSMiMyYkLyMi' +
		'LSMiKiAfKyEhKiEiJx4gJhwfJxseJRodJBkdIxwdIyAgHhocGhUYGRMYFxEYFhAXGQ8XGhEYHRUbHBUYHRcbHBkbFRQXFBMVEREUDQwRDA0SDxAVEREWEBQXEhcaFRkbFxwcFhwcFhwbEhsaFB0bFh8eERsZERoYFBweFBwhGSEkHSUnHigp' +
		'Iy4sJzAwJC4rJS0qIiknHB8dGxUXGRcYGRoZIB4bOC0rPSsnQS0mOiceOCQaPCUbPyMdQyMhOiMdOCYePSojQS4oPy8oPzIqPDAoPC8nPS8oPzApQTIrPi8oOyoiQC8lQzApQy8pQC4nOywlNykhPC0oPC4oOy0nQDQuPTIsQTUwPzQuODIq' +
		'PTYvQTQuQC8rOiwnOy4oPjErQzYwQzgyQTcxPjUuPzgxQzw2TEM+Qjo1OjEsPDEtPjMvPDIrOTApODAoNy0nOS0nPC8pPzAtPzAtPi0rPysqPignPicnPikqOCUmMyMjMyMjLh4fMB0fNykoMCckMCkmKyUiKiQhLSUkKyEhKiAhJh0dIxob' +
		'IxkaJBobIhobHxocGhUYGRMXGBMXFxEXGBIZGhMXHhQZIhcdIRcbHBUYGBYYGBkaFhcaEhMXDxEUCw0UCw4TDhAVERMXFRYaFRgbFRocExgbFBgbEhocERobExscERoaERkaFh4hFRwiGSAmHCQnHScoIi0tKDIyJzEvKzMxLTQyJigoEQ8Q' +
		'FRYWExYVLS4qKiUgOS4oQDcuQjQqPygfQCUcQCYgOyQeNSQdNyggPCoiPyslPCkjQzErQDIqPC8nPTAoPzEqQjMsPzApPi8nQjIqQjApQi8oPy4nOywlNikhOi0nOy8pOy8pPjMtPzUuPDIrOC8oOjUsOzYuQDMtQC8qOi4oOi4oPTAqPzQu' +
		'PzQuPjQtPTQtOzMtPTYwSD86QDcyOzItOzAsOi8rOS8oNy8nODEpOzEqOi4oOy0oPzEuPzEuQC8tQSwrQisrPycmPSkoOiknNSYlLyIhLyEhMSIjLSEgJx8cKSQiKCQjJCAfJyEiJyEjJh8hJR4gIhsdHxgaIBkbHxkbHRoaGxYZGxYaGhUZ' +
		'FxIYFxMYGxYYHxgcGhIYIRkgHBYdGRYdGRocFhcaExQYDxAUEhUbDhIYDxIXERIXFRYaFRYaEhYZExgbExgbExocERkbEBgaDhYYEBgbFh0iFx4lGiEpHSQqHSYpHykqIywtJi4wJy4vIykqGx4fDQ0OEBUWDxUUFBcUJyYgKyggNzktQTkv' +
		'PycgQyQeOyIcOCggNishOy8mPS0kQCwmPSciQy0oQDEqNy0kOy4mPjEpPzEpPy8oPC4mQTQqPy8nQTApPzApOCskNy0nOjEqRj02Rj02NSwlOjEqPzYvODApOzcvODQsOzAqOSsmOC4oOjArOzAqPTIsPjQuPDIsOjAqOjIsNzAqQzo1PDMu' +
		'OC8qOS8rOS4pOC4oOjEqOzQsPDIsOCwmOCwmPTEsQjQvQC8qPSklPygmQSgnOygkOCgjNysnLiMhKh8fKx8fKh4fJBsbIx4fJCIjIiAiIh4iJSAjJSAhIR0eIRwdHxscHxobHRkaGhgZGhgaGhcbFxUYFhMXFRIXGRYYHBkcQDxBHhkhJCAq' +
		'IR4pGBccFBYYFBUZDxAUChAWDREYDA8WERMYFBUaFRQZEhUZERYaERYaERgbDRUXDRUYDxcZEBgcFRwjGB8oHCMrICYvHCUqHScqICksHycqHiUnGyAjEBQVCgwOEBYWDhQUDhMQHSAZJiggKC8kOzcuPioiQyYhPyYfOCggODAlOjEnOCkg' +
		'NiUePCkjQC0nPS8nOzIpQDUsPzIqNykhNighNyoiPjEpQTMrOywlOi0mOC0nPDMtPjkySUM9PDYwLigiMSokNi4oQTs1OzkyOzgyQjg0QjUyODArOTEsODAqOjEsOTArPDIuOi8rOTArODErOzMtNy4pNy4pOC0pNywoNy0mOjIrPTUuPTMs' +
		'NiokOy4oPjQuQDQuQC8qPiomPyUkPiQjPCYhNyYgOy0pNSonLSIhLCAgKh0fKB0fJyEiIh8gHh0fIh8iIR4hIB4gHx0fHRsdHRsdIB0fHRwdGBcYFxYYGBcaFRQXFhUZGBccGBcZFxcbJycsExIaSUhSQT5IEhEVFBQXEhEWDw0TEBUcDBEX' +
		'DRAXEhIZFBMZExEXDxMXDxQYEBUZDhUYDRUYDRYYDhYaEBceEhkhExokGyIsICcwHyguHCYrHSYqFR0hERcaFxwgFxseCQ0PDRETDxQVDxQSExYQHyIZJCkhMzAnOisiQCggQSchOiMdMScdMysgNiogNykhOisjPC4mQDUtPDIpPjQrPzUs' +
		'Oy4mNSkhOCwkOjAnOi0lOCskNyslNy4nNzAqPjw1PDozLSojLCghMSslMCkjMSwmNDQsMzIrQDgyQDQwPjcxPTgyOjMtOjItOzItOjEsOS4qOC8qOjMtOTArNSwnOC8qOjAsNywoNiwmOC8oODEpOjAqPTAqPDApPDMrOi4mPy4nQCwnQSgl' +
		'PiMgOyQeQC0mQjItNykmLiMhLiEjLR4gKx0fJx8fIR0eIh8gIyAhIR4hHh0gHBseHRwfHh0gHh4gHx4gGhoZGhocGBgaFBUWFxYaGBccGRodGRsfExgbFhgcGRkfHBkhGxodExMWERAVDw0TEBQdDhIaDxMaEBAYEA8WDg0UCw8TDxQYEBUZ' +
		'ChEVCxIWDBQXDRQaDxcfERciEhgmGR8uICYzHiYvHCUsFx4lEhkgEhgcDRIWGh4hFBgaDRIVEBYWEhcVFBgTGh4WJScgMS4mMSUcNyQcOSIbOB8aMigeMy0iLycdMSceMiggMikgNzAmMysiMSgfMyogPDEoNikhLiEZMCUcMiQdMSMdNCch' +
		'MigjNzEsOjszOToyKyghKighLyslMCwmKygiKysjLzAoNC8pOzEtOzQvOjQuPTYwOjIsNy8pNy4pNSsmNSwnODErOjEsNy4pNSwnOS4qOS4pNi0mNy4nNzAoNiwmNyokQTUvNiwkNioiOiojOygiQCgkPSMgPCQfQS0nPi0oMiQhLyMhLyIj' +
		'LR4fKRscJhwcJh8fIBsbIRwdHhwcGRscGhsdGxweGBkbGBkbGhscGxwcGhwdGRocGRobGRkdFhcbFhoeGh8iFhsfFhodFxkaGhkcGBgaFRQYFBIYEA8TCw0ZDRAcDhEcDg8ZDQ0WCwsUCg4TDRIVDRIWCQ8VCA8UCxIZDBQdDxghFBwrEBcv' +
		'Z22GWmFxHCQxGiEvFRwnERghERkeDxYYHSQlFR4gEBkZExwZFR0YFRwWGR8YIyQbKygeJyAXKyEaNiojLiIcLSYgKycgJiEbKiQeLigiLyokMS0jLSofLSgdLyYdNCohKx4WKxwVKhwUKxwXLB4ZNCgiNy0oNTEqOTsyMjQrKyokKyokLS0o' +
		'Li4pMDErKywmLC0nMTErODEuOC4rNi0oOC8oOC8oNi0nNSwmNSwlNCslNSwnNy4pOC8qNSwnMyolNCslNS4mNy8oMyojNCgiNSgiMyYgMSYfMychNiciNSQfPSklOiYiNyYhOisoPC4rNiomMCUjLSMgKB0cJx0cJh4cJx4eIhkaHRYXGhcW' +
		'GhsZGRkaGRsaGhsbGBobGBocGRkbFxgZGRocGRoeGRoeFxodEhwdFR4gFh4fFhseFhkcGBkdFBUZFRQYFRMYFBAVCg4aDQ8bDQ8bCw0ZCQkVCQoTCQwRCxAUDBEVBQwRBAsRCA8WCxMbDxghExsoEhcuTVJrRUxbHicxGSEuEBciDRQcEhkd' +
		'FBgcHCIjEBoZDBUUCBEODhURGSAaFRsUHR8WJiUcJB4XJRwWKyEcLiQeKiMdJSAbIx4YJyIcLCgiLyokLSoiLCkfLCkfLiceKyEZKh8YKx8YJRoRLCAaLSIcLyYeMSokOTYvPj82MS8oLSkkKiYiKSgjLi4pMjQuMTIsODkzLS0oLCcjMigm' +
		'MiklMSkkNCwmMysmMiokNC0nNCsmMyolMyolNi0oOC8qMyolMSkjMioiNSwlNCojMiYgNCchMyUfLyIeLyIdLiAbLh8bMyMfNSUhOS0pOi0qNywoNSsnMCQjLSAfKR8dKB4dKCAeJRwcIhobIBoaHRkYHBkXGxgZGhgZGhkaGxocFxYZFRYY' +
		'FxcZFxgaFxkdGBsfFxwfEhwdEBobERkbFBodFhodEhcaExYaExQYExIXEw8VCxAbCw8bCgwYCAoWCQsXCgsWCQ0SCQ8TCg4SBQwRBg0TCA8VChIaDhcfEBgiEhorERctFh4rGiMrFyAqERoiChEXChAUFxsdFh0dDhUTDxUTCxEODRIPGyIc' +
		'GiEaGx4WIyMbIh0XIhoVIRgTJx8ZKSQeKyYgKiUfKSQeKiUfJSAaJiIbJiQaKSYdLikgKCEZKB4YKCAYJR4UKiIbMSkiNS4mNjMrPz43ODUsLCYfLSYgKCEdJyMfLSwnKiskLzAoPD01PDw1KSUfLygjMiomMCglMCklMCgkMisnODAsMysm' +
		'NColMikkMyolNCsmMikkMSgjMSkhNy0nNSokLyIcMCMdMCIdLyAdLh8cLR8cLiEeMCQgMSYhMiokMiokMSckMSYkLyEgLR8fKB0dJx0cJR0aIRgYHxYXHxkZHxkZHhgYIBocHRgaHBgZHBcbGRcaFBUXFRUXGBkcGR0gGB0gFxwfFh4gFR4g' +
		'EhocExsdFRseExcaExgbExUYEREWDwwSDBIfDRIeDRAcCw8bDQ8bDA8aCA0UBwwSCA0TBg0RBQ4QCBATChMYDhcdEBofEBkkFBwrFh8nFiAkFiEnERogCxIXBAsODBASDRERDREODxMPDxQREBUQFx0XHiMdHSEZHyAYIyAZJh8aIx0XIRsV' +
		'IRsWJB8ZJSAaKCMdKCMdJB8ZIiAYJSQbKiceMC0kMCwkLCUeLSkfMC0hMS0kODEpNzEoPDkyOTkxLyohLCUdKiMcKiMdKSUgLy4oMDEqPT42MzUtPD01REM7My8oMSokMCkjMSokNS4oNi8pNi8pNS0nMyojMSghMikiMSghLyYgLiUfLyMf' +
		'MCMgLiAdKx0aLB4bLR8cLB0bLR4cLB8dKyAdLSQfLiYhLykjLCUhLCMhKyAeJxoaKBoaJhsbJRsaIhoYHxYWHBQVGxUVHRUWHhUWIxodHhcaHhgaHxkdGRUZFRYYFxgaGBkbFRcbExcaExcaERYZFhseExgbEhcaERcaEhkbERkbEBUYERMX' +
		'DAwSDRQiDhQiDhIeDREdCw8bCQsXBwsUBwwSBwwSBg0RBQ4QCBATChMXDhccEBocEBkgEBkjFB0hFB4gFyMmEhwfDBUXChASCg4PDhAQEhMPEhQQExQREhUQEhcRGR8YHiQdGx0XHh0YHhoVIBoXIh0ZIRwXIRwWIh0XJSAaJiEbJB8ZIyEa' +
		'KSkhLS0lMi8oNzQtNjEsLywjLy0hLysiMisjMSsjMi8nMS4mLikgLycgLCUdKyYfLSwlNjcvNDUtODoxODsyMTQqPD0zNTIqMCkgMysiMysiMSohNi4lNi8mMysjMyojNCskMikiMCcgLCMcLSIcLR0bKxwaKhwZKhwZLB4bKBoYKBwbKh4c' +
		'KiAeKyEfLCIgKiIfKyMgKB8dJRsZJRsaIhkXIxkYIhgYIRcWIBcVHhUUHBMUHBYWHBQVHRMUHhUYHRYZGxUXGhQYGRQYFxYYGBcaGBgbFhYbFRYaFBQZFRUaFBMYERIWFBcbEhcaEBYZDBcYDBQWDxMXDQ8TDhUjDRQiDBEfCg4bCAwYBwsX' +
		'BwsVBgoRBgsRBw4SBQ0QCBASCBEVCxUZDhgXDxkcERohERodEh4eFSEjFiEjDRYYEBUWEBQVERMRExMOExQOEhMOEBINERUPFBkTHiQdHiEbHh0YHRoVIhwYIh4aIh4YJB8ZIx4YIx4YJiEbKiUfKCYfKCkhKCkhKSggLCkiKSYgJSIaKCUa' +
		'LyshLicfLiggLSghMCwkMCwhLykhLikhLCkgMDAoNjkwMzMpMjUqMzYqLTAlMzQqODYsMysiMykgMikgMykgMSgfMSgeMyoiMSghMSkiMikiMSghLyYfLSEcLR4cLR8cLiAdKx0aKhwZJxoXJR0aJBsYJx0bJx0bJBoYJBoYJxwaJxwaIxkY' +
		'JRwaIhsZIxwcHhUVHhYUHhcVHxYWHBQVGRISGRESGBERGxQWGRQWFA8RFRAUFhEVFxMXFxMXGBUZFhUaIyInGRgdFxMYFxMZFRMYExIXERMXDRIUBxMTBxITChATCw0RDhMiDhIhDBAeCQ0ZCQ0YCg0XBwwUBQwRBg0RBg8RBxESCBITCBIT' +
		'CxUVDxkYDhkYDxsbEBsaER0bFCAfGSUkERwbChUUCxYVDRYTEhYRExUPExYQFBYREhUTFBoYGyAaISMeISEcIR4ZIyAcIiEcJSEaJiIZJCAYJSEYKSUcKyceKCYeJyUeKicgLCkhJiIZJB4WJiAYKiMbLSYeLicfMCghMywkNy8nMi0iMish' +
		'OjIpOTEnNzAnNTEnMjElMTAkMzElMzAlMi4jPzkvNy0kMikfNi0kMykgMSYfMSYgMygiMygiMSghMyojMikkMSUhMCMfLiMdMSYgMiYhMCUhLiIfLCEdJhwaMSglLyUjKB4cIxkXJRsZJhwaJBkXIRYWHxYVHxkXHBkYHBsZFhUTGBQTGRMT' +
		'FhAQFhEQFg8QFg8RFhITFBITFBEUFxIWFhIVFBQWFRQXFRQYERAVOTg+HhsiFREXExMXERIWFREXFRAXDxAUChETBw0PCw4SCQsNDBAfDRAfDBAdCw8aCg4ZCg0WBwwSBg0RCBATBw8RBxASBxESCRMSChQTDBYVDRgWEBwaER0bER0bFCAe' +
		'FiIgFSEfCxcVCxcVCBQRDxYPFBgSExYPFBYREhUUExkYGBwYHyAbISAbIB4ZIyAaIyIcIh4WJiIZJCAXIR0UJCAXKSUcKSYdKSYeKSUeJyEaIRwUJR4WJyAYKSMbLCUdLyggMSkhNy4nMighNC0iS0I4PTIpPjMrMyohNS0jMy4jLikeMCof' +
		'MyshNCwjNiwjLiQaMykgNCohMykgNSokNywmMichLyQeNCojNCslMyklNSYkMyUhMighMiciMiciLyQgLSIfKyEeKh8dMSclLyUjKR8dJhwaKB4cJhwZIxgXIhYWHRIRHhcWHxsbHRwaFxUUGBISGBARGRARGBAQGA4PGQ4RGREUFxITFhEU' +
		'GBIWGBIWFxQXGBQYGBQZGBUaEQ0TGBMaFhMZEREVEhIWFRAWFA0UDw8TDhIVDA8SDQ8TCQkMDA4dDhAeDhAdDQ8bCg0XCg0VBwwRBgwQBg4RBQ4QBg8QBxAQCBIRBxEQCBIRChUUDRoYER0bEh4cEx8dEx8dFiIgEh4cDBgWCxYTCxMOEBYQ' +
		'EhUOExYQExcSERgUFRkUGx0XIB8aIR0XIh4XIBwUIRwTIR0UIBwTHhoRIBwSJSEXJiMZJiIZJSEXJSAYIx0XJB0XJyEaKiQbLyggMikiMighMichNiskLiQcMCUcNCYdNScfRzsyMigeNCshNCogMSceMScdMigfMicgMykgMiceNisjMygi' +
		'MyciNywnMygiMSYgMCcgMikjMygjMyUiMiQfLyIcLyIfLiMfKyAcKyAeKR4cKB4cKR8dKiAeKR8dJxwaJx0bJhwaJRoZJhoaJBkYHRUUIBsbHxoZHxUWHRIUHxATHA4RHA0QHhASHxATHREUHBIVGxEUHRIWHhMYHRUYHhYaHhUaHBMbGhEa' +
		'GhEZGRIZEhEWEA8UEw0UFQ8WDQ0RDBATDA0RCgoOBgQICgsbCw0aCw0aCgwXCAsUBwoSBwoQBgoOBgsNBgsOBQwNBxAOBhAOBA4NBhAQCRUTCxcVDRkYDRkXDhsZERwaEh0bEx8cDRkXChcUCRMOCREKDBEKERUOFRkVFBkWEhcSGRsWHx0Y' +
		'Ix0XJB0VIhwSIBkQHRcNHxgOGxYLHBYMHRcNIRoRIhsTIhwUIRoTHRcSIRsVJSAbJiEaLCYgLiMfKyEcLyIdLCAbLiIcMiQfNCUfMiQcPS8mLCIYMiYcMCQaMCMaKh8WJhoUKRwXLyQbMygfMCUfKiAZKiAaLiMfLiMdLCIbKiEZKyIcLCMf' +
		'MSMgMSIfLB0aKBkXJRgWIxgWJBkXJBkYJx0bKiEfJxwbJRsZJBoYJRoYJRwZIxkXJBgYJBkYHRQUHRYXHBQUHxMUIBITIxEUIQ4RIRARIRETIxIUIRMVIRUXIRUYIhMYIRMYHRIWHRIWHxIYHxMZGxAYGw4YFw4WERAUEA0TEgsSEw0UDQ0S' +
		'Cw0RBwgLBgYKCAUJ';

	var FOTO_N = 128, fotoOrion = new Float32Array(FOTO_N * FOTO_N * 3);
	(function () {
		var bin = atob(FOTO_ORION), n = FOTO_N * FOTO_N * 3, bruto = new Float32Array(n), i;
		for (i = 0; i < n; i++) bruto[i] = bin.charCodeAt(i) / 255;
		// realça os véus de gás: cada pixel fica mais diferente da média em volta dele
		// (o contorno das nuvens, os fiapos e as faixas escuras de poeira aparecem mais)
		function borrado(raio) {
			var saida = new Float32Array(n);
			for (var y = 0; y < FOTO_N; y++) for (var x = 0; x < FOTO_N; x++) for (var c = 0; c < 3; c++) {
				var s = 0, q = 0;
				for (var dy = -raio; dy <= raio; dy++) for (var dx = -raio; dx <= raio; dx++) {
					var xx = x + dx, yy = y + dy;
					if (xx < 0 || yy < 0 || xx >= FOTO_N || yy >= FOTO_N) continue;
					s += bruto[(yy * FOTO_N + xx) * 3 + c]; q++;
				}
				saida[(y * FOTO_N + x) * 3 + c] = s / q;
			}
			return saida;
		}
		var largo = borrado(4), fino = borrado(1);
		for (i = 0; i < n; i++) fotoOrion[i] = Math.max(0, bruto[i] + (bruto[i] - largo[i]) * 1.1 + (bruto[i] - fino[i]) * 0.6);
	})();
	// a cor da foto num ponto (u, v de 0 a 1), misturando os 4 vizinhos
	function corDaFoto(u, v, saida) {
		var fx = Math.max(0, Math.min(FOTO_N - 1.001, u * FOTO_N - 0.5)), fy = Math.max(0, Math.min(FOTO_N - 1.001, v * FOTO_N - 0.5));
		var x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
		for (var c = 0; c < 3; c++) {
			var a = fotoOrion[(y0 * FOTO_N + x0) * 3 + c], b = fotoOrion[(y0 * FOTO_N + x0 + 1) * 3 + c];
			var d = fotoOrion[((y0 + 1) * FOTO_N + x0) * 3 + c], e = fotoOrion[((y0 + 1) * FOTO_N + x0 + 1) * 3 + c];
			saida[c] = (a + (b - a) * ax) + ((d + (e - d) * ax) - (a + (b - a) * ax)) * ay;
		}
	}	var luzOrion = new Float32Array(TAM * TAM * 3);
	var estrelasOrion = [];
	(function () {
		var s = 11;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < 200; i++) {
			var sorte = aleat();
			estrelasOrion.push({
				x: (aleat() * TAM) | 0, y: (aleat() * TAM) | 0,
				b: 0.5 + aleat() * 0.45,
				c: sorte < 0.5 ? [255, 255, 255] : sorte < 0.85 ? [185, 210, 255] : [255, 222, 195],
				raios: aleat() < 0.1, f: 0.8 + aleat() * 2, fase: aleat() * 6
			});
		}
		// o aglomerado do Trapézio, no centro claro
		for (i = 0; i < 22; i++) {
			var a = aleat() * Math.PI * 2, r = Math.abs(aleat() + aleat() - 1) * 0.06;
			estrelasOrion.push({ x: Math.round((0.47 + Math.cos(a) * r) * TAM), y: Math.round((0.45 + Math.sin(a) * r) * TAM), b: 0.75 + aleat() * 0.25, c: [255, 255, 255], raios: false, f: 1 + aleat() * 2, fase: aleat() * 6 });
		}
		// as estrelas grandes, nos lugares delas na foto (a azul de baixo é a mais forte)
		[[0.68, 0.8, [160, 200, 255]], [0.53, 0.075, [235, 240, 255]], [0.14, 0.41, [225, 232, 255]], [0.47, 0.45, [255, 255, 255]], [0.5, 0.6, [255, 240, 225]], [0.9, 0.16, [200, 220, 255]]]
			.forEach(function (p) { estrelasOrion.push({ x: Math.round(p[0] * TAM), y: Math.round(p[1] * TAM), b: 1, c: p[2], raios: true, grande: true, f: 1.2, fase: p[0] * 9 }); });
	})();

	// a estrela só clareia o pixel (nunca escurece o gás atrás dela)
	function maisClaro(c, r, g, b) {
		return cor(Math.max(c & 255, r), Math.max((c >>> 8) & 255, g), Math.max((c >>> 16) & 255, b));
	}

	// rampas de cor (posição de 0 a 1 -> cor)
	function rampa(lista, v) {
		for (var i = 1; i < lista.length; i++) {
			if (v <= lista[i][0]) {
				var a = lista[i - 1], b = lista[i], f = (v - a[0]) / (b[0] - a[0]);
				return [a[1][0] + (b[1][0] - a[1][0]) * f, a[1][1] + (b[1][1] - a[1][1]) * f, a[1][2] + (b[1][2] - a[1][2]) * f];
			}
		}
		return lista[lista.length - 1][1];
	}

	var corFoto = [0, 0, 0];
	function orion(buf, t) {
		var tt = t * 0.035;
		for (var y = 0; y < TAM; y++) {
			for (var x = 0; x < TAM; x++) {
				var u = (x + 0.5) / TAM, v = (y + 0.5) / TAM;
				// o gás "respira": o lugar onde a foto é lida balança um pouquinho, devagar
				var wx = fbm(u * 3 + 3, v * 3, tt, 3) - 0.5, wy = fbm(u * 3, v * 3 + 7, tt, 3) - 0.5;
				corDaFoto(u + wx * 0.007, v + wy * 0.007, corFoto); // pouquinho, para não borrar os detalhes
				// textura: nuvenzinhas, fiapos claros e veios escuros, como na foto ampliada
				var textura = fbm(u * 10 + 4, v * 10, tt, 3);
				var fiapo = Math.pow(1 - Math.abs(2 * fbm(u * 6 + wx + 20, v * 6 + wy, tt * 0.9, 4) - 1), 6);
				var veio = Math.pow(1 - Math.abs(2 * fbm(u * 5 + 40, v * 7 + 3, tt * 0.7, 4) - 1), 8);
				var r = corFoto[0], g = corFoto[1], b = corFoto[2];
				// tira o "fundo" escuro da foto (ele vira transparente) e realça o resto
				var lum = Math.max(r, g, b);
				var sobra = Math.max(0, lum - 0.075) / Math.max(0.001, lum);
				var ganho = 1.6 * sobra * (0.92 + textura * 0.16 + fiapo * 0.14) * (1 - veio * 0.12);
				r *= ganho; g *= ganho; b *= ganho;
				// mais cor: cada tom da foto fica mais vivo (o rosa mais rosa, o marrom mais ferrugem,
				// o cinza-azulado mais azul), sem mudar qual é a cor
				var media = (r + g + b) / 3, sat = 1.45;
				r = media + (r - media) * sat; g = media + (g - media) * sat; b = media + (b - media) * sat;
				// o miolo do Trapézio é branco-creme, sem puxar para o rosa
				var dc = Math.sqrt(Math.pow(u - 0.47, 2) + Math.pow(v - 0.45, 2)), creme = Math.min(1, Math.exp(-dc / 0.035) * 1.2);
				r += (1.25 - r) * creme; g += (1.18 - g) * creme; b += (1.05 - b) * creme;
				var k = (y * TAM + x) * 3;
				luzOrion[k] = Math.max(0, r); luzOrion[k + 1] = Math.max(0, g); luzOrion[k + 2] = Math.max(0, b);
			}
		}
		// poucos tons de brilho (com pontilhado), mantendo a cor; o que é bem fraco some no
		// fundo num pontilhado mais solto, em vez de virar pixels quase pretos
		var LIM = [0, 0.5, 0.75, 0.25];
		for (y = 0; y < TAM; y++) for (x = 0; x < TAM; x++) {
			var j = y * TAM + x, k2 = j * 3;
			var rr = luzOrion[k2], gg = luzOrion[k2 + 1], bb = luzOrion[k2 + 2];
			var m = Math.max(rr, gg, bb);
			if (m < 0.17) {
				if (m < 0.04 || (m - 0.04) / 0.13 <= LIMIAR4[(x & 3) + ((y & 3) << 2)]) { buf[j] = hex('#05030c'); continue; }
				var q0 = 0.17 / m;
				buf[j] = cor(rr * q0 * 255, gg * q0 * 255, bb * q0 * 255);
				continue;
			}
			var nivel = Math.floor(Math.min(1, m) * 12 + LIM[(x & 1) + ((y & 1) << 1)]) / 12;
			var q = Math.max(1 / 12, nivel) / m;
			buf[j] = cor(Math.min(255, rr * q * 255), Math.min(255, gg * q * 255), Math.min(255, bb * q * 255));
		}
		// estrelas
		estrelasOrion.forEach(function (e) {
			if (e.x < 1 || e.y < 1 || e.x >= TAM - 1 || e.y >= TAM - 1) return;
			var pisca = calmo ? 1 : 0.8 + 0.2 * Math.sin(t * e.f + e.fase);
			var b = e.b * pisca;
			var k = e.y * TAM + e.x;
			buf[k] = maisClaro(buf[k], e.c[0] * b, e.c[1] * b, e.c[2] * b);
			if (e.raios) {
				var tam = e.grande ? 3 : 1;
				for (var dd = 1; dd <= tam; dd++) {
					var f = b * (1 - dd / (tam + 1));
					var r0 = e.c[0] * f, g0 = e.c[1] * f, b0 = e.c[2] * f;
					if (e.x + dd < TAM) buf[k + dd] = maisClaro(buf[k + dd], r0, g0, b0);
					if (e.x - dd >= 0) buf[k - dd] = maisClaro(buf[k - dd], r0, g0, b0);
					if (e.y + dd < TAM) buf[k + dd * TAM] = maisClaro(buf[k + dd * TAM], r0, g0, b0);
					if (e.y - dd >= 0) buf[k - dd * TAM] = maisClaro(buf[k - dd * TAM], r0, g0, b0);
				}
			}
		});
	}

	// ---------- Omega Centauri: o aglomerado globular ----------
	// Inspirada nas fotos de telescópio: uma bola levemente oval de estrelas
	// branco-amareladas, com um miolo muito claro, gigantes laranja espalhadas
	// e algumas estrelas da frente com raios em cruz.
	var PAL_FUNDO_OMEGA = hex('#05030c');
	var estrelasOmega = [];
	(function () {
		for (var i = 0; i < 6500; i++) {
			var u = Math.random();
			var r = 0.11 * Math.sqrt(1 / Math.pow(1 - u * 0.985, 2) - 1);
			if (r > 0.98) { i--; continue; }
			var a = Math.random() * Math.PI * 2;
			var sorte = Math.random();
			var c = sorte < 0.5 ? [255, 228, 170] : sorte < 0.78 ? [255, 246, 226] : sorte < 0.94 ? [255, 176, 96] : [176, 206, 255];
			estrelasOmega.push({ x: Math.cos(a) * r, y: Math.sin(a) * r * 0.92, c: c, b: 0.3 + Math.random() * 0.7, f: 0.6 + Math.random() * 2.4, fase: Math.random() * 6 });
		}
	})();
	var raiosOmega = [[-0.62, -0.38], [0.55, 0.5], [0.3, -0.7], [-0.4, 0.62]];
	var luzOmega = new Float32Array(TAM * TAM * 3);

	function omega(buf, t) {
		luzOmega.fill(0);
		var c = TAM / 2, raio = TAM * 0.47;
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var dx = (x + 0.5 - c) / raio, dy = (y + 0.5 - c) / (raio * 0.92);
			var g = Math.exp(-(dx * dx + dy * dy) * 7) * 0.5;
			var k = (y * TAM + x) * 3;
			luzOmega[k] = g; luzOmega[k + 1] = g * 0.9; luzOmega[k + 2] = g * 0.72;
		}
		for (var i = 0; i < estrelasOmega.length; i++) {
			var e = estrelasOmega[i];
			var px = Math.round(c + e.x * raio), py = Math.round(c + e.y * raio);
			if (px < 0 || py < 0 || px >= TAM || py >= TAM) continue;
			var b = e.b * (calmo ? 1 : 0.6 + 0.4 * Math.sin(t * e.f + e.fase)) / 255;
			var k2 = (py * TAM + px) * 3;
			luzOmega[k2] += e.c[0] * b; luzOmega[k2 + 1] += e.c[1] * b; luzOmega[k2 + 2] += e.c[2] * b;
		}
		for (var j = 0; j < TAM * TAM; j++) {
			var r = luzOmega[j * 3], gg = luzOmega[j * 3 + 1], bb = luzOmega[j * 3 + 2];
			if (r < 0.03 && gg < 0.03 && bb < 0.03) { buf[j] = PAL_FUNDO_OMEGA; continue; }
			var m = Math.max(r, gg, bb), q = Math.max(0.2, Math.round(Math.min(1, m) * 5) / 5) / m;
			r = Math.min(1, r * q); gg = Math.min(1, gg * q); bb = Math.min(1, bb * q);
			buf[j] = cor(5 + r * 250, 3 + gg * 252, 12 + bb * 243);
		}
		// estrelas brilhantes da frente, com raios em cruz
		raiosOmega.forEach(function (p, i) {
			var x = Math.round(c + p[0] * raio), y = Math.round(c + p[1] * raio);
			var pisca = 0.7 + 0.3 * Math.sin(t * 2 + i);
			buf[y * TAM + x] = cor(255, 255, 255);
			for (var d = 1; d <= 3; d++) {
				var v = Math.round(255 * pisca * (1 - d / 4));
				var cc = cor(v, v, Math.min(255, v + 30));
				buf[y * TAM + x + d] = buf[y * TAM + x - d] = buf[(y + d) * TAM + x] = buf[(y - d) * TAM + x] = cc;
			}
		});
	}

	// ---------- Ajudante: transforma luz (r, g, b) em pixel art ----------
	// poucos níveis de brilho com pontilhado 2x2, mantendo a cor (e realçando a saturação)
	var LIM2 = [0, 0.5, 0.75, 0.25];
	function pintarLuz(buf, luz, niveis, sat, minimo) {
		minimo = minimo || 0.05; // abaixo disso o pixel fica transparente
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var j = y * TAM + x, k = j * 3;
			var r = luz[k], g = luz[k + 1], b = luz[k + 2];
			var m = Math.max(r, g, b);
			if (m < minimo) { buf[j] = hex('#05030c'); continue; }
			var media = (r + g + b) / 3;
			r = Math.max(0, media + (r - media) * sat); g = Math.max(0, media + (g - media) * sat); b = Math.max(0, media + (b - media) * sat);
			m = Math.max(r, g, b, 0.001);
			var nivel = Math.floor(Math.min(1, m) * niveis + LIM2[(x & 1) + ((y & 1) << 1)]) / niveis;
			var q = Math.max(1 / niveis, nivel) / m;
			buf[j] = cor(Math.min(255, r * q * 255), Math.min(255, g * q * 255), Math.min(255, b * q * 255));
		}
	}
	// borda suave: onde a luz fica fraca, os pixels vão rareando num pontilhado até sumir no fundo
	// do site (em vez de um corte seco ou de pixels quase pretos); os que ficam têm cor de verdade
	function bordaSuave(luz, limite) {
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var k = (y * TAM + x) * 3, m = Math.max(luz[k], luz[k + 1], luz[k + 2]);
			var f = m / limite;
			if (f >= 1) continue;
			if ((f - 0.25) / 0.75 < LIMIAR4[(x & 3) + ((y & 3) << 2)]) { luz[k] = luz[k + 1] = luz[k + 2] = 0; continue; }
			luz[k] /= f; luz[k + 1] /= f; luz[k + 2] /= f;
		}
	}
	function estrelaComRaios(buf, x, y, c, tam, brilho) {
		if (x < 0 || y < 0 || x >= TAM || y >= TAM) return;
		buf[y * TAM + x] = maisClaro(buf[y * TAM + x], 255 * brilho, 255 * brilho, 255 * brilho);
		for (var d = 1; d <= tam; d++) {
			var f = brilho * (1 - d / (tam + 1));
			var r0 = c[0] * f, g0 = c[1] * f, b0 = c[2] * f;
			if (x + d < TAM) buf[y * TAM + x + d] = maisClaro(buf[y * TAM + x + d], r0, g0, b0);
			if (x - d >= 0) buf[y * TAM + x - d] = maisClaro(buf[y * TAM + x - d], r0, g0, b0);
			if (y + d < TAM) buf[(y + d) * TAM + x] = maisClaro(buf[(y + d) * TAM + x], r0, g0, b0);
			if (y - d >= 0) buf[(y - d) * TAM + x] = maisClaro(buf[(y - d) * TAM + x], r0, g0, b0);
		}
	}
	function estrelasSoltas(semente, qtd) {
		var s = semente, lista = [];
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < qtd; i++) {
			var sorte = aleat();
			lista.push({ x: (aleat() * TAM) | 0, y: (aleat() * TAM) | 0, b: 0.45 + aleat() * 0.55, f: 0.7 + aleat() * 2, fase: aleat() * 6,
				c: sorte < 0.5 ? [255, 255, 255] : sorte < 0.75 ? [175, 205, 255] : [255, 220, 170], raio: aleat() < 0.08 });
		}
		return lista;
	}
	function desenharSoltas(buf, lista, t) {
		lista.forEach(function (e) {
			var b = e.b * (calmo ? 1 : 0.65 + 0.35 * Math.sin(t * e.f + e.fase));
			if (e.raio) estrelaComRaios(buf, e.x, e.y, e.c, 1, b);
			else buf[e.y * TAM + e.x] = maisClaro(buf[e.y * TAM + e.x], e.c[0] * b, e.c[1] * b, e.c[2] * b);
		});
	}

	// ---------- Nebulosa da Hélice ----------
	// Inspirada na foto do telescópio VISTA (ESO), o "Olho de Deus": um olho inclinado.
	//  - o centro é azul: azul-violeta mais escuro no meio, azul-claro perto da borda;
	//  - a passagem do azul para o anel é clara, quase creme;
	//  - a borda de dentro do anel é dourada e granulada (os milhares de "nós cometários"
	//    viram pontinhos brilhantes e fiapos apontando para fora);
	//  - o anel vai do dourado ao laranja e ao vermelho, e é mais grosso nas pontas do olho;
	//  - por fora, uma névoa vermelho-escura esfumaçada, com um arco largo em cima à esquerda;
	//  - estrelas azuladas grandes, com brilho em volta, espalhadas pela foto.
	var luzHelice = new Float32Array(TAM * TAM * 3);
	var soltasHelice = estrelasSoltas(17, 170);
	var graosHelice = new Float32Array(TAM * TAM); // "sorte" fixa de cada pixel, para os grãos brilhantes
	for (var gi = 0; gi < TAM * TAM; gi++) graosHelice[gi] = hash(gi % TAM, (gi / TAM) | 0, 91);
	// estrelas azuis grandes, nas mesmas regiões da foto: x, y, tamanho do brilho
	var AZUIS_HELICE = [[0.81, 0.33, 1], [0.91, 0.46, 0.75], [0.07, 0.52, 0.85], [0.64, 0.82, 0.9], [0.78, 0.87, 0.75], [0.93, 0.06, 0.7], [0.89, 0.23, 0.5], [0.3, 0.77, 0.45], [0.17, 0.3, 0.4]];
	var LIMIAR4 = [0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875, 0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125];
	function misturaCor(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
	function curva(lista, v) {
		if (v <= lista[0][0]) return lista[0][1];
		for (var i = 1; i < lista.length; i++) {
			if (v <= lista[i][0]) { var a = lista[i - 1], b = lista[i]; return a[1] + (b[1] - a[1]) * (v - a[0]) / (b[0] - a[0]); }
		}
		return lista[lista.length - 1][1];
	}
	// "s" mede onde o pixel está: de -1 (centro) a 0 (borda de dentro do anel), 1 (borda de fora) e além
	var RAMPA_HELICE = [
		[-1, [0.3, 0.36, 0.74]],    // azul-violeta escuro, no meio
		[-0.55, [0.32, 0.5, 0.9]], // azul
		[-0.22, [0.5, 0.72, 0.98]],  // azul-claro
		[-0.05, [0.86, 0.9, 0.82]],  // quase branco / creme (a passagem suave)
		[0.1, [1, 0.88, 0.5]],       // amarelo-claro
		[0.3, [1, 0.72, 0.24]],      // dourado
		[0.55, [1, 0.46, 0.12]],     // laranja
		[0.8, [0.85, 0.22, 0.07]],   // vermelho-alaranjado
		[1.15, [0.55, 0.1, 0.05]],   // vermelho-escuro
		[2, [0.35, 0.05, 0.05]]      // vinho
	];
	var LUZ_HELICE = [[-1, 0.46], [-0.5, 0.55], [-0.15, 0.68], [0, 0.84], [0.2, 1], [0.42, 0.85], [0.62, 0.55], [0.85, 0.3], [1.1, 0.13], [1.5, 0.04], [2, 0]];

	function helice(buf, t) {
		var tt = t * 0.04;
		var giro = -0.24, cg = Math.cos(giro), sg = Math.sin(giro); // o olho sobe da esquerda para a direita
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var j = y * TAM + x;
			var px = (x + 0.5) / TAM * 2 - 1, py = (y + 0.5) / TAM * 2 - 1 - 0.06;
			// contorno orgânico (nada de elipse perfeita)
			var qx = px + (fbm(px * 2 + 3, py * 2, tt, 2) - 0.5) * 0.14;
			var qy = py + (fbm(px * 2, py * 2 + 9, tt, 2) - 0.5) * 0.14;
			var dx = qx * cg + qy * sg, dy = -qx * sg + qy * cg;
			var r = Math.sqrt(dx * dx + dy * dy) + 1e-6, ang = Math.atan2(dy, dx);
			var ca = dx / r, sa = dy / r;
			// raio de dentro (o buraco azul, quase redondo) e de fora (o olho, comprido e com pontas)
			var irr = fbm(ca * 1.6 + 3, sa * 1.6, tt * 0.4, 3);
			var Ri = 0.39 / Math.sqrt(ca * ca + Math.pow(sa / 0.86, 2)) * (1 + (irr - 0.5) * 0.14);
			var Ro = 1 / Math.pow(Math.pow(Math.abs(ca / 0.86), 1.7) + Math.pow(Math.abs(sa / 0.5), 1.7), 1 / 1.7) * (1 + (irr - 0.5) * 0.14);
			var s = r < Ri ? r / Ri - 1 : (r - Ri) / (Ro - Ri);

			var manchas = fbm(px * 6 + 10, py * 6, tt, 4);
			// fiapos radiais (variam rápido com o ângulo e devagar com a distância)
			var fios = fbm(ca * 20 + 40, sa * 20 + r * 3, tt * 0.6, 3);
			var fil = Math.pow(Math.max(0, fios - 0.45) * 2.6, 1.5);
			// em cima à esquerda o anel é mais fraco e mais vermelho, como na foto
			var ladoFraco = Math.max(0, Math.cos(ang + 2.2));
			var sc = s + (manchas - 0.5) * 0.32 + (s > 0 ? ladoFraco * 0.18 : 0);

			var col = rampa(RAMPA_HELICE, Math.max(-1, Math.min(2, sc)));
			var luz = curva(LUZ_HELICE, sc);
			if (s < 0) {
				// centro: azul com manchas mais escuras e alguns fiapos perto da borda
				luz *= 0.82 + (manchas - 0.5) * 0.7 + fil * 0.25 * (1 + s);
			} else {
				// anel: textura granulada, fiapos para fora, lado de cima-esquerda mais apagado
				luz *= (0.72 + (manchas - 0.5) * 0.6 + fil * 0.4) * (1 - ladoFraco * 0.25);
				// grãos brilhantes (os nós), muito mais na faixa dourada
				var faixaOuro = Math.exp(-Math.pow((s - 0.22) / 0.28, 2));
				var g = graosHelice[j];
				if (g > 0.9 - faixaOuro * 0.3 - fil * 0.12 && s < 1.2) {
					var pisca = calmo ? 1 : 0.6 + 0.4 * Math.sin(t * (1 + g * 3) + g * 50);
					luz += (0.25 + faixaOuro * 0.45) * pisca;
					col = misturaCor(col, [1, 0.9, 0.55], faixaOuro * 0.6);
				}
			}
			var R = col[0] * luz, G = col[1] * luz, B = col[2] * luz;

			// névoa vermelha esfumaçada por fora do anel, com buracos escuros
			var ex = (dx + 0.04) / 0.98, ey = (dy - 0.02) / 0.7, rE = Math.sqrt(ex * ex + ey * ey);
			var fumo = fbm(px * 3 + 30, py * 3, tt * 0.6, 5);
			var fumoFino = fbm(px * 9 + 60, py * 9, tt * 0.8, 3);
			// uma nuvem larga e contínua em forma de olho, que começa logo depois do anel
			var envelope = Math.exp(-Math.pow(Math.max(0, rE - 0.58) / 0.24, 2));
			var fora = Math.min(1, Math.max(0, s - 0.3) * 1.6);
			var densidade = (0.38 + Math.max(0, fumo - 0.3) * 1.8) * (0.7 + fumoFino * 0.6);
			densidade *= 1 - 0.85 * Math.max(0, Math.min(1, (0.4 - fumo) * 6)); // buracos escuros
			var neblina = densidade * envelope * fora;
			// a casca de fora: o arco largo em cima à esquerda e um pedaço mais fraco embaixo à direita
			var ax = px + 0.05, ay = py + 0.02, ra = Math.sqrt(ax * ax + ay * ay), aa = Math.atan2(ay, ax);
			var casca = Math.exp(-Math.pow((ra - 0.88) / 0.12, 2));
			var arco = casca * (Math.pow(Math.max(0, Math.cos(aa + 2.3)), 0.7) + 0.5 * Math.pow(Math.max(0, Math.cos(aa - 0.8)), 1.5)) * (0.35 + fumo * 0.9);
			var vermelho = neblina * 0.36 + arco * 0.38;
			// vermelho de verdade (sem puxar para o laranja), um pouco mais escuro longe do anel
			var perto = Math.exp(-Math.max(0, s - 0.8) / 0.4);
			R += vermelho * (0.78 + 0.12 * perto); G += vermelho * 0.07; B += vermelho * 0.06;
			// um brilho de fundo bem suave, que junta tudo
			var fundoSuave = Math.exp(-rE * rE / 0.5) * 0.12 * (s > 0 ? 1 : 0);
			R += fundoSuave; G += fundoSuave * 0.08; B += fundoSuave * 0.07;

			// as partes mais fracas somem num pontilhado (sem borda dura no vermelho de fora)
			var fraco = Math.max(R, G, B) / 0.2;
			if (fraco < 1) {
				if ((fraco - 0.3) / 0.7 < LIMIAR4[(x & 3) + ((y & 3) << 2)]) R = G = B = 0;
				else if (fraco > 0) { R /= fraco; G /= fraco; B /= fraco; } // o pontinho que fica tem cor de verdade, não preto
			}
			luzHelice[j * 3] = R; luzHelice[j * 3 + 1] = G; luzHelice[j * 3 + 2] = B;
		}
		pintarLuz(buf, luzHelice, 12, 1.25, 0.035);
		desenharSoltas(buf, soltasHelice, t);
		// estrelas azuis grandes, com um brilho redondo em volta
		AZUIS_HELICE.forEach(function (e, i) {
			var cx = Math.round(e[0] * TAM), cy = Math.round(e[1] * TAM), raio = 1.5 + e[2] * 2.5;
			var pisca = calmo ? 1 : 0.85 + 0.15 * Math.sin(t * 1.7 + i * 2);
			for (var yy = -4; yy <= 4; yy++) for (var xx = -4; xx <= 4; xx++) {
				var X = cx + xx, Y = cy + yy;
				if (X < 0 || Y < 0 || X >= TAM || Y >= TAM) continue;
				var d = Math.sqrt(xx * xx + yy * yy);
				if (d > raio) continue;
				var f = Math.pow(1 - d / raio, 1.6) * pisca;
				if (f < 0.3) continue; // brilho fraco demais viraria um contorno escuro sobre o fundo
				buf[Y * TAM + X] = maisClaro(buf[Y * TAM + X], 90 * f, 160 * f, 255 * f);
			}
			estrelaComRaios(buf, cx, cy, [200, 225, 255], e[2] > 0.7 ? 2 : 1, pisca);
		});
		// a anã branca no centro: pequena e azulada, quase escondida
		var c = TAM / 2;
		buf[Math.round(c + 0.03 * c) * TAM + Math.round(c)] = maisClaro(buf[Math.round(c + 0.03 * c) * TAM + Math.round(c)], 210, 230, 255);
	}

	// ---------- Plêiades ----------
	// Inspirada nas fotos de telescópio: as estrelas mais brilhantes, azul-esbranquiçadas,
	// com raios em cruz, envoltas em fiapos de nebulosa azul (poeira refletindo a luz delas),
	// sobre um fundo azul bem escuro cheio de estrelinhas.
	var IRMAS = [
		{ n: 'Alcyone', x: 0.47, y: 0.5, b: 1.0 }, { n: 'Atlas', x: 0.2, y: 0.55, b: 0.85 }, { n: 'Pleione', x: 0.21, y: 0.47, b: 0.55 },
		{ n: 'Electra', x: 0.76, y: 0.56, b: 0.85 }, { n: 'Maia', x: 0.66, y: 0.38, b: 0.8 }, { n: 'Merope', x: 0.6, y: 0.66, b: 0.8 },
		{ n: 'Taygeta', x: 0.75, y: 0.29, b: 0.7 }, { n: 'Celaeno', x: 0.86, y: 0.42, b: 0.55 }, { n: 'Asterope', x: 0.73, y: 0.17, b: 0.5 }
	];
	var luzPleiades = new Float32Array(TAM * TAM * 3);
	var soltasPleiades = estrelasSoltas(29, 160);
	function pleiades(buf, t) {
		var tt = t * 0.04, co = Math.cos(-0.5), so = Math.sin(-0.5);
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = x / TAM, v = y / TAM;
			var ru = u * co - v * so, rv = u * so + v * co;
			// fiapos de nebulosa, esticados na diagonal
			var fios = fbm(ru * 3, rv * 13, tt, 5);
			var nuvem = fbm(u * 4 + 5, v * 4, tt, 4);
			// a nebulosa brilha mais perto das estrelas grandes
			var perto = 0, brilhoEstrela = 0;
			for (var i = 0; i < IRMAS.length; i++) {
				var ex = u - IRMAS[i].x, ey = v - IRMAS[i].y;
				perto += Math.exp(-Math.sqrt(ex * ex + ey * ey) / 0.11) * IRMAS[i].b;
				brilhoEstrela += Math.exp(-(ex * ex + ey * ey) / 0.0016) * IRMAS[i].b * 1.8; // halo branco da própria estrela
			}
			var neb = (Math.pow(fios, 1.6) * 1.5 + nuvem * 0.25) * (0.12 + perto * 0.75);
			var k = (y * TAM + x) * 3;
			luzPleiades[k] = 0.02 + neb * 0.38 + brilhoEstrela * 0.85;
			luzPleiades[k + 1] = 0.03 + neb * 0.6 + brilhoEstrela * 0.92;
			luzPleiades[k + 2] = 0.09 + neb * 1.05 + brilhoEstrela;
		}
		pintarLuz(buf, luzPleiades, 10, 1.2);
		desenharSoltas(buf, soltasPleiades, t);
		// as Sete Irmãs (e companhia), com raios em cruz
		IRMAS.forEach(function (s, i) {
			var pisca = calmo ? 1 : 0.85 + 0.15 * Math.sin(t * 1.6 + i * 1.7);
			var x = Math.round(s.x * TAM), y = Math.round(s.y * TAM);
			var tam = Math.round(4 + s.b * 9);
			estrelaComRaios(buf, x, y, [215, 232, 255], tam, pisca);
			estrelaComRaios(buf, x + 1, y, [200, 225, 255], 1, pisca);
			estrelaComRaios(buf, x, y + 1, [200, 225, 255], 1, pisca);
		});
	}

	// ---------- Estrela de Tabby ----------
	// A estrela (um pouco maior e mais quente que o Sol) com nuvens irregulares de poeira
	// passando na frente dela. As nuvens são iluminadas do lado da estrela e, quando
	// passam na frente, deixam a estrela mais escura e mais avermelhada (a poeira fina
	// bloqueia mais o azul: foi essa "pista das cores" que mostrou que é poeira).
	// Embaixo, um painel com o gráfico do brilho, como o do telescópio Kepler.
	var luzTabby = new Float32Array(TAM * TAM * 3);
	var soltasTabby = estrelasSoltas(41, 110);
	var ESTRELA_X = 0.5, ESTRELA_Y = 0.36, ESTRELA_R = 0.17;
	var NUVENS_POEIRA = [];
	(function () {
		var s = 77;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < 5; i++) {
			NUVENS_POEIRA.push({
				fase: aleat() * 3.4, vel: 0.1 + aleat() * 0.1,
				y: (aleat() - 0.5) * 0.12,                   // altura em relação à estrela
				lx: 0.07 + aleat() * 0.13, ly: 0.03 + aleat() * 0.05, // tamanho (esticada na horizontal)
				dens: 0.8 + aleat() * 1.6,                    // algumas bem densas, outras ralas
				cauda: aleat() < 0.6,                         // algumas têm "cauda", como cometas
				semente: aleat() * 100
			});
		}
	})();
	function posNuvem(nv, t) { return ((t * nv.vel + nv.fase) % 3.4) - 1.2; } // de -1,2 a 2,2 (atravessa)

	// densidade da poeira num ponto (u, v), em coordenadas da tela (0 a 1)
	function poeiraEm(u, v, t, detalhe) {
		var total = 0;
		for (var i = 0; i < NUVENS_POEIRA.length; i++) {
			var nv = NUVENS_POEIRA[i];
			var cx = ESTRELA_X + posNuvem(nv, t) * 0.5, cy = ESTRELA_Y + nv.y;
			var dx = (u - cx) / nv.lx, dy = (v - cy) / nv.ly;
			// cauda: a nuvem se estica para trás (para a esquerda)
			if (nv.cauda && dx < 0) dx *= 0.35;
			var base = dx * dx + dy * dy;
			if (base > 6) continue;
			var forma = Math.exp(-base);
			if (detalhe) {
				var n = fbm(u * 14 + nv.semente, v * 14, t * 0.2, 3);
				forma *= Math.max(0, 0.35 + (n - 0.5) * 1.8 + forma * 0.5); // bordas irregulares e grumos
			}
			total += forma * nv.dens;
		}
		return total;
	}
	// brilho da estrela num instante qualquer (para o gráfico mostrar o passado também)
	var AMOSTRAS = [];
	for (var a = 0; a < 7; a++) for (var b2 = 0; b2 < 7; b2++) {
		var ax = (a - 3) / 3, ay = (b2 - 3) / 3;
		if (ax * ax + ay * ay <= 1) AMOSTRAS.push([ESTRELA_X + ax * ESTRELA_R, ESTRELA_Y + ay * ESTRELA_R]);
	}
	function brilhoTabby(t) {
		var soma = 0;
		for (var i = 0; i < AMOSTRAS.length; i++) soma += 1 - Math.exp(-poeiraEm(AMOSTRAS[i][0], AMOSTRAS[i][1], t, false) * 0.9);
		return 1 - Math.min(0.22, soma / AMOSTRAS.length * 0.35);
	}

	function tabby(buf, t) {
		var brilho = brilhoTabby(t);
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = (x + 0.5) / TAM, v = (y + 0.5) / TAM;
			var dx = (u - ESTRELA_X) / ESTRELA_R, dy = (v - ESTRELA_Y) / ESTRELA_R, d = Math.sqrt(dx * dx + dy * dy);
			var k = (y * TAM + x) * 3, r = 0, g = 0, b = 0;
			if (d < 1) {
				// disco da estrela: mais claro no meio, mais alaranjado na borda, com granulação
				var borda = Math.sqrt(1 - d * d);
				var gran = fbm(u * 22, v * 22, t * 0.3, 3);
				var l = (0.6 + 0.4 * borda) * (0.86 + gran * 0.28);
				r = l * 1.05; g = l * (0.8 + 0.16 * borda); b = l * (0.5 + 0.32 * borda);
			} else {
				// o brilho em volta vai sumindo e acaba antes da borda da arte (nada de retângulo marrom)
				var fimHalo = Math.max(0, 1 - (d - 1) / 1.0);
				var halo = (Math.exp(-(d - 1) / 0.3) * 0.85 + Math.exp(-(d - 1) / 0.9) * 0.15) * fimHalo * fimHalo;
				r = halo; g = halo * 0.72; b = halo * 0.42;
			}
			// poeira (só na faixa onde as nuvens passam)
			{
				var tau = poeiraEm(u, v, t, true);
				if (tau > 0.01) {
					// atrás da poeira: escurece e avermelha (o azul some mais)
					r *= Math.exp(-tau * 0.7); g *= Math.exp(-tau * 0.95); b *= Math.exp(-tau * 1.3);
					// a própria poeira brilha um pouco, iluminada pela estrela (mais do lado dela)
					// longe da estrela a poeira quase não recebe luz (vira só uma sombra que some no fundo)
					var ilum = (Math.exp(-Math.max(0, d - 1) / 0.9) * 0.75 + 0.14) * Math.max(0, 1 - Math.max(0, d - 1) / 1.5);
					var p = Math.min(1, tau * 0.8) * ilum;
					r += p * 0.75; g += p * 0.52; b += p * 0.38;
				}
			}
			luzTabby[k] = r; luzTabby[k + 1] = g; luzTabby[k + 2] = b;
		}
		bordaSuave(luzTabby, 0.24); // o brilho de fora some aos poucos no fundo
		pintarLuz(buf, luzTabby, 12, 1.2, 0.035);
		desenharSoltas(buf, soltasTabby, t);

		// painel com o gráfico do brilho
		desenharGrafico(buf, t, brilhoTabby, brilho);
	}

	// ---------- Estrela de Tabby, hipótese 2: a megaestrutura alienígena ----------
	// Um "enxame de Dyson": milhares de painéis gigantes girando em anéis inclinados em
	// volta da estrela para captar a energia dela. Os painéis passam na frente e atrás da
	// estrela. Repare no gráfico: painéis sólidos escurecem a estrela por igual, sem mudar
	// a cor dela (e foi justamente isso que as observações NÃO mostraram).
	var luzAlien = new Float32Array(TAM * TAM * 3);
	var soltasAlien = estrelasSoltas(53, 110);
	var ANEIS = [
		{ raio: 0.26, achatado: 0.3, giro: -0.35, qtd: 26, vel: 0.32, fase: 0 },
		{ raio: 0.33, achatado: 0.22, giro: 0.25, qtd: 34, vel: -0.24, fase: 1.3 },
		{ raio: 0.4, achatado: 0.38, giro: -0.1, qtd: 42, vel: 0.17, fase: 2.1 }
	];
	var PAINEL = { corpo: cor(38, 46, 74), celula: cor(62, 98, 168), borda: cor(150, 162, 196), brilho: cor(255, 255, 255) };

	// posição de cada painel num instante (x, y em coordenadas 0..1; frente = passa na frente da estrela)
	function paineisEm(t) {
		var lista = [];
		ANEIS.forEach(function (an, ia) {
			var cg = Math.cos(an.giro), sg = Math.sin(an.giro);
			for (var i = 0; i < an.qtd; i++) {
				// os painéis ficam em blocos, com espaços vazios entre eles (o brilho cai e volta)
				if (Math.sin(i / an.qtd * Math.PI * 2 * 3 + ia * 2) < 0.15) continue;
				var fi = an.fase + i / an.qtd * Math.PI * 2 + t * an.vel;
				var ox = Math.cos(fi) * an.raio, oy = Math.sin(fi) * an.raio * an.achatado;
				lista.push({
					x: ESTRELA_X + ox * cg - oy * sg, y: ESTRELA_Y + ox * sg + oy * cg,
					frente: Math.sin(fi) > 0, largo: Math.abs(Math.sin(fi)) > 0.35, // de frente parece maior
					reflexo: Math.sin(fi * 3 + ia) > 0.97, anel: ia
				});
			}
		});
		return lista;
	}
	function cobreEstrela(p) {
		var dx = p.x - ESTRELA_X, dy = p.y - ESTRELA_Y;
		return p.frente && dx * dx + dy * dy < ESTRELA_R * ESTRELA_R;
	}
	function brilhoAlien(t) {
		var cobertos = 0;
		paineisEm(t).forEach(function (p) { if (cobreEstrela(p)) cobertos += p.largo ? 6 : 3; });
		return 1 - Math.min(0.22, cobertos * 0.0035);
	}
	function desenharPainel(buf, p) {
		var x = Math.round(p.x * TAM), y = Math.round(p.y * TAM);
		var w = p.largo ? 4 : 2, h = 2;
		for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) {
			var px = x - (w >> 1) + i, py = y - 1 + j;
			if (px < 0 || py < 0 || px >= TAM || py >= TAM) continue;
			var borda = i === 0 || i === w - 1;
			buf[py * TAM + px] = p.reflexo ? PAINEL.brilho : borda ? PAINEL.borda : (j === 0 ? PAINEL.celula : PAINEL.corpo);
		}
	}
	// gráfico do brilho, igual nas duas hipóteses (a legenda da página explica como ler):
	// moldura, linha pontilhada dos 100% (logo acima da curva, para não sumir atrás dela),
	// a curva azul do brilho (o fundo do quadro = 75%) e o ponto branco do "agora", piscando.
	// O quadro fica um pouco acima da borda da arte, para o recorte pontilhado não comer a moldura.
	function desenharGrafico(buf, t, funcaoBrilho, agora) {
		var x0 = Math.round(TAM * 0.1), x1 = Math.round(TAM * 0.9), y0 = Math.round(TAM * 0.7), y1 = Math.round(TAM * 0.9);
		var HUD = cor(127, 227, 255), HUD_FRACO = cor(30, 70, 90), PONTILHADO = cor(61, 138, 168);
		for (var x2 = x0; x2 <= x1; x2++) { buf[y0 * TAM + x2] = HUD_FRACO; buf[y1 * TAM + x2] = HUD_FRACO; }
		for (var y2 = y0; y2 <= y1; y2++) { buf[y2 * TAM + x0] = HUD_FRACO; buf[y2 * TAM + x1] = HUD_FRACO; }
		var cem = y0 + 2, topo = y0 + 3, fundo = y1 - 2;
		for (var xr = x0 + 2; xr < x1; xr += 2) buf[cem * TAM + xr] = PONTILHADO; // linha dos 100% de brilho
		var largura = x1 - x0 - 2;
		for (var h = 0; h < largura; h++) {
			var bt = funcaoBrilho(t - (largura - h) * 0.25); // cada pixel do gráfico = 0,25 s
			buf[Math.round(topo + (1 - bt) / 0.25 * (fundo - topo)) * TAM + x0 + 1 + h] = HUD;
		}
		// ponto do "agora" (2 x 2), piscando, na ponta direita da curva
		if (calmo || Math.sin(t * 6) > 0) {
			var ya = Math.round(topo + (1 - agora) / 0.25 * (fundo - topo));
			buf[ya * TAM + x1 - 2] = buf[ya * TAM + x1 - 1] = buf[(ya - 1) * TAM + x1 - 2] = buf[(ya - 1) * TAM + x1 - 1] = cor(255, 255, 255);
		}
	}

	function tabbyAlien(buf, t) {
		var paineis = paineisEm(t);
		var brilho = brilhoAlien(t);
		// estrela e brilho em volta (a cor não muda: os painéis bloqueiam todas as cores igual)
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = (x + 0.5) / TAM, v = (y + 0.5) / TAM;
			var dx = (u - ESTRELA_X) / ESTRELA_R, dy = (v - ESTRELA_Y) / ESTRELA_R, d = Math.sqrt(dx * dx + dy * dy);
			var k = (y * TAM + x) * 3, r, g, b;
			if (d < 1) {
				var borda = Math.sqrt(1 - d * d);
				var gran = fbm(u * 22, v * 22, t * 0.3, 3);
				var l = (0.6 + 0.4 * borda) * (0.86 + gran * 0.28) * brilho;
				r = l * 1.05; g = l * (0.8 + 0.16 * borda); b = l * (0.5 + 0.32 * borda);
			} else {
				var fimHaloA = Math.max(0, 1 - (d - 1) / 1.0);
				var halo = (Math.exp(-(d - 1) / 0.3) * 0.85 + Math.exp(-(d - 1) / 0.9) * 0.15) * brilho * fimHaloA * fimHaloA;
				r = halo; g = halo * 0.72; b = halo * 0.42;
			}
			luzAlien[k] = r; luzAlien[k + 1] = g; luzAlien[k + 2] = b;
		}
		bordaSuave(luzAlien, 0.24);
		pintarLuz(buf, luzAlien, 12, 1.2, 0.035);
		desenharSoltas(buf, soltasAlien, t);
		// painéis de trás (escondidos atrás da estrela)
		paineis.forEach(function (p) {
			if (p.frente) return;
			var dx = p.x - ESTRELA_X, dy = p.y - ESTRELA_Y;
			if (dx * dx + dy * dy < ESTRELA_R * ESTRELA_R) return;
			desenharPainel(buf, p);
		});
		// trilhas dos anéis (bem fracas), para dar a ideia da estrutura
		ANEIS.forEach(function (an) {
			var cg = Math.cos(an.giro), sg = Math.sin(an.giro);
			for (var a = 0; a < 160; a++) {
				var fi = a / 160 * Math.PI * 2;
				if (a % 3) continue;
				var ox = Math.cos(fi) * an.raio, oy = Math.sin(fi) * an.raio * an.achatado;
				var px = Math.round((ESTRELA_X + ox * cg - oy * sg) * TAM), py = Math.round((ESTRELA_Y + ox * sg + oy * cg) * TAM);
				var ddx = px / TAM - ESTRELA_X, ddy = py / TAM - ESTRELA_Y;
				if (Math.sin(fi) <= 0 && ddx * ddx + ddy * ddy < ESTRELA_R * ESTRELA_R) continue;
				if (px >= 0 && py >= 0 && px < TAM && py < TAM) buf[py * TAM + px] = maisClaro(buf[py * TAM + px], 70, 90, 130);
			}
		});
		// painéis da frente (passam na frente da estrela)
		paineis.forEach(function (p) { if (p.frente) desenharPainel(buf, p); });
		desenharGrafico(buf, t, brilhoAlien, brilho);
	}

	// ---------- Bolhas de Fermi ----------
	// Inspirada na ilustração da NASA: a Via Láctea vista de lado (uma faixa fina de estrelas
	// com o bojo dourado no meio e uma linha escura de poeira) e duas bolhas enormes de
	// raios gama, magenta e violeta, saindo do centro para cima e para baixo, com a borda
	// mais forte (a frente de choque). Por fora, as bolhas de raios X do eROSITA, maiores e
	// fracas, em azul-turquesa. Ondas de choque e partículas sobem o tempo todo do centro.
	var luzFermi = new Float32Array(TAM * TAM * 3);
	var soltasFermi = estrelasSoltas(61, 150);
	var RAMPA_BOLHA = [[0, [0.2, 0.05, 0.35]], [0.35, [0.45, 0.12, 0.62]], [0.65, [0.8, 0.25, 0.78]], [0.85, [1, 0.5, 0.88]], [1, [1, 0.85, 0.96]]];
	var particulasFermi = [];
	(function () {
		var s = 83;
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < 140; i++) {
			particulasFermi.push({
				lado: i % 2 ? 1 : -1,                  // bolha de cima ou de baixo
				ang: (aleat() - 0.5) * 2.2,            // abertura em leque, saindo do centro
				vel: 0.05 + aleat() * 0.09, fase: aleat(),
				quente: aleat() < 0.3
			});
		}
	})();
	// formato de uma bolha: uma "pétala" que nasce estreita no centro da galáxia e se abre
	// para cima (r = altura x cos(ângulo)^n, medido a partir do centro)
	function bolha(px, up, lado, altura, abertura, t) {
		var by = up * lado, bx = px - 0.015 * lado * by; // levemente torta, como as de verdade
		if (by <= 0) return 9;
		var r = Math.sqrt(bx * bx + by * by), fi = Math.atan2(bx, by);
		var limite = altura * Math.pow(Math.cos(fi), abertura) * (1 + (fbm(fi * 1.4 + 5 + lado * 9, r * 2, t * 0.04, 3) - 0.5) * 0.14);
		return r / Math.max(0.001, limite); // 1 = na borda
	}
	function fermi(buf, t) {
		var tt = t * 0.04;
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var j = y * TAM + x;
			var px = (x + 0.5) / TAM * 2 - 1, py = (y + 0.5) / TAM * 2 - 1;
			var lado = py < 0 ? 1 : -1; // na tela, y cresce para baixo: em cima é a bolha "norte"
			var R = 0, G = 0, B = 0;
			var manchas = fbm(px * 4 + 20, py * 4, tt, 4), fino = fbm(px * 11, py * 11 + 40, tt * 1.4, 3);

			// 1. bolhas de raios X (eROSITA): maiores, fracas, turquesa, só a casca
			var qx = bolha(px, -py, lado, 1.02, 0.45, t);
			var cascaX = Math.exp(-Math.pow((qx - 0.97) / 0.09, 2)) * (0.3 + manchas * 0.7) * (0.6 + fino * 0.6) + (qx < 1 ? 0.06 * manchas : 0);
			R += cascaX * 0.12; G += cascaX * 0.42; B += cascaX * 0.5;

			// 2. bolhas de Fermi (raios gama): magenta e violeta, borda forte, por dentro quase uniforme
			var q = bolha(px, -py, lado, 0.84, 0.62, t);
			if (q < 1.25) {
				var dentro = Math.max(0, Math.min(1, (1.04 - q) / 0.08)); // borda nítida
				var borda = Math.exp(-Math.pow((q - 0.97) / 0.06, 2));
				// ondas de choque saindo do centro, uma atrás da outra
				var ondas = 0;
				for (var n = 0; n < 3; n++) {
					var qo = ((calmo ? 0.3 : t * 0.06) + n / 3) % 1;
					ondas += Math.exp(-Math.pow((q - qo) / 0.05, 2)) * (1 - qo) * 0.28 * (0.4 + fino);
				}
				var nivel = (0.36 + q * 0.16 + (manchas - 0.5) * 0.45 + (fino - 0.5) * 0.18) * dentro + borda * 0.55 + ondas * dentro;
				var cb = rampa(RAMPA_BOLHA, Math.max(0, Math.min(1, nivel * 0.95)));
				var lb = Math.min(1.2, nivel * 1.1);
				R += cb[0] * lb; G += cb[1] * lb; B += cb[2] * lb;
			}

			// 3. a galáxia de lado: faixa fina de estrelas, bojo dourado, linha de poeira
			var disco = Math.exp(-Math.pow(py / (0.03 + 0.045 * Math.exp(-px * px / 0.15)), 2)) * Math.exp(-Math.pow(px / 0.95, 2)) * (0.45 + fino * 0.8) * (graosHelice[j] > 0.86 ? 1.8 : 1);
			var bojo = Math.exp(-(px * px / 0.035 + py * py / 0.012));
			var poeira = 1 - 0.75 * Math.exp(-Math.pow((py - 0.006) / 0.016, 2)) * (0.5 + manchas * 0.8) * Math.min(1, Math.abs(px) * 4 + 0.35);
			R += (disco * 0.8 + bojo * 1.15) * poeira; G += (disco * 0.88 + bojo * 0.92) * poeira; B += (disco * 1.1 + bojo * 0.6) * poeira;
			// brilho rosado onde as bolhas nascem
			var nucleo = Math.exp(-(px * px + py * py) / 0.01);
			R += nucleo * 0.5; G += nucleo * 0.25; B += nucleo * 0.45;

			// as partes mais fracas somem num pontilhado (sem borda escura sobre o fundo do site)
			var fraco = Math.max(R, G, B) / 0.2;
			if (fraco < 1) {
				if ((fraco - 0.3) / 0.7 < LIMIAR4[(x & 3) + ((y & 3) << 2)]) R = G = B = 0;
				else if (fraco > 0) { R /= fraco; G /= fraco; B /= fraco; }
			}
			luzFermi[j * 3] = R; luzFermi[j * 3 + 1] = G; luzFermi[j * 3 + 2] = B;
		}
		pintarLuz(buf, luzFermi, 12, 1.3, 0.035);
		desenharSoltas(buf, soltasFermi, t);

		// partículas subindo do centro em leque, até a borda da bolha
		particulasFermi.forEach(function (p) {
			var f = calmo ? p.fase : (t * p.vel + p.fase) % 1;
			var dist = f * 0.8 * (1 - 0.25 * Math.abs(p.ang));
			var px = Math.sin(p.ang) * dist * 0.62, py = -Math.cos(p.ang) * dist * p.lado; // na tela: lado 1 sobe
			var x = Math.round((px + 1) / 2 * TAM), y = Math.round((py + 1) / 2 * TAM);
			if (x < 0 || y < 0 || x >= TAM || y >= TAM) return;
			var b = Math.sin(f * Math.PI); // aparece, brilha e some
			if (b < 0.25) return;
			var c = p.quente ? [255, 230, 250] : [255, 120, 230];
			buf[y * TAM + x] = maisClaro(buf[y * TAM + x], c[0] * b, c[1] * b, c[2] * b);
		});
		// Sagittarius A*, bem no meio
		estrelaComRaios(buf, TAM / 2, TAM / 2, [255, 220, 250], 2, calmo ? 1 : 0.85 + 0.15 * Math.sin(t * 3));
	}

	// poucos tons de brilho (com pontilhado), mantendo a cor; o que é bem fraco some no fundo num
	// pontilhado mais solto, em vez de virar pixels quase pretos (o mesmo jeito da Órion)
	function posterizar(buf, luz) {
		var LIM = [0, 0.5, 0.75, 0.25];
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var j = y * TAM + x, k = j * 3, rr = luz[k], gg = luz[k + 1], bb = luz[k + 2], m = Math.max(rr, gg, bb);
			if (m < 0.17) {
				if (m < 0.04 || (m - 0.04) / 0.13 <= LIMIAR4[(x & 3) + ((y & 3) << 2)]) { buf[j] = hex('#05030c'); continue; }
				var q0 = 0.17 / m;
				buf[j] = cor(rr * q0 * 255, gg * q0 * 255, bb * q0 * 255);
				continue;
			}
			var nivel = Math.floor(Math.min(1, m) * 12 + LIM[(x & 1) + ((y & 1) << 1)]) / 12, q = Math.max(1 / 12, nivel) / m;
			buf[j] = cor(Math.min(255, rr * q * 255), Math.min(255, gg * q * 255), Math.min(255, bb * q * 255));
		}
	}
	function estrelinhas(semente, n) {
		var s = semente, lista = [];
		function aleat() { s = (s * 16807) % 2147483647; return s / 2147483647; }
		for (var i = 0; i < n; i++) { var sorte = aleat(); lista.push({ x: (aleat() * TAM) | 0, y: (aleat() * TAM) | 0, b: 0.5 + aleat() * 0.5, c: sorte < 0.55 ? [255, 255, 255] : sorte < 0.8 ? [185, 210, 255] : [255, 210, 180], f: 0.8 + aleat() * 2, fase: aleat() * 6 }); }
		return lista;
	}
	function pintarEstrelinhas(buf, lista, t) {
		lista.forEach(function (e) {
			var b = e.b * (calmo ? 1 : 0.75 + 0.25 * Math.sin(t * e.f + e.fase)), k = e.y * TAM + e.x;
			buf[k] = maisClaro(buf[k], e.c[0] * b, e.c[1] * b, e.c[2] * b);
		});
	}

	// ---------- Betelgeuse: a supergigante vermelha ----------
	// Inspirada nas imagens do VLT e do ALMA: um disco laranja-avermelhado meio irregular, com
	// células de gás enormes (claras no meio, com veios escuros entre elas), escurecendo até o
	// vermelho na beirada; em volta, uma atmosfera difusa com plumas de gás saindo para um lado
	// e, embaixo, a nuvem de poeira escura do "grande apagão" de 2019.
	var luzBetel = new Float32Array(TAM * TAM * 3), estrelasBetel = estrelinhas(43, 70);
	var RAMPA_BETEL = [[0, [0.22, 0.03, 0.02]], [0.25, [0.58, 0.09, 0.04]], [0.5, [0.92, 0.3, 0.08]], [0.72, [1, 0.56, 0.18]], [0.88, [1, 0.8, 0.45]], [1, [1, 0.95, 0.8]]];
	function betelgeuse(buf, t) {
		var tt = t * 0.05, c = TAM / 2;
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = (x + 0.5 - c) / c, v = (y + 0.5 - c) / c, r = Math.sqrt(u * u + v * v), ang = Math.atan2(v, u);
			var borda = 0.62 * (1 + (fbm(Math.cos(ang) * 1.4 + 3, Math.sin(ang) * 1.4, tt, 3) - 0.5) * 0.14); // a borda não é redonda
			var R = 0, G = 0, B = 0;
			if (r < borda) {
				var mu = Math.sqrt(Math.max(0, 1 - (r / borda) * (r / borda))); // 1 no meio, 0 na beirada
				var su = u / borda / (0.55 + 0.45 * mu), sv = v / borda / (0.55 + 0.45 * mu); // as células "achatam" perto da borda
				var celula = fbm(su * 2.4 + 5, sv * 2.4, tt, 4);
				var veio = Math.pow(1 - Math.abs(2 * fbm(su * 3 + 20, sv * 3 + 7, tt * 0.8, 4) - 1), 5);
				var val = (0.3 + 0.62 * mu) * (0.6 + celula * 0.75) - veio * 0.28 * mu;
				var poeira = Math.exp(-((u + 0.22) * (u + 0.22) + (v - 0.34) * (v - 0.34)) / 0.05) * (0.45 + fbm(u * 6, v * 6, tt, 3) * 0.6); // a nuvem do apagão
				val *= 1 - Math.min(0.75, poeira * 0.9);
				var cr = rampa(RAMPA_BETEL, Math.max(0, Math.min(1, val)));
				var b = 0.45 + val * 0.85;
				R = cr[0] * b; G = cr[1] * b; B = cr[2] * b;
			} else {
				// a atmosfera em volta e as plumas de gás saindo para cima, à direita
				var fora = r - borda;
				var halo = Math.exp(-fora / 0.07) * 0.55;
				var pluma = Math.pow(Math.max(0, Math.cos(ang + 0.75)), 3) * Math.exp(-fora / 0.2) * (0.35 + fbm(u * 4 + 9, v * 4, tt, 4) * 0.9) * 0.55;
				var tufos = Math.pow(1 - Math.abs(2 * fbm(u * 3.5 + 40, v * 3.5, tt, 3) - 1), 6) * Math.exp(-fora / 0.12) * 0.35;
				var g = halo + pluma + tufos;
				R = g * 0.95; G = g * 0.28; B = g * 0.1;
			}
			var media = (R + G + B) / 3;
			R = media + (R - media) * 1.2; G = media + (G - media) * 1.2; B = media + (B - media) * 1.2;
			var k = (y * TAM + x) * 3;
			luzBetel[k] = Math.max(0, R); luzBetel[k + 1] = Math.max(0, G); luzBetel[k + 2] = Math.max(0, B);
		}
		posterizar(buf, luzBetel);
		pintarEstrelinhas(buf, estrelasBetel, t);
	}

	// ---------- Eta Carinae: o Homúnculo ----------
	// Feita a partir da foto do Hubble. O formato e as cores vêm da própria foto, reduzida a 64 x 64
	// (FOTO_ETA): as duas bolhas branco-lavanda com a rede de veios marrom-avermelhados, o halo
	// azul em volta, a nuvem magenta e vermelha por fora e o fundo escuro. Por cima: a textura
	// de "couve-flor" das bolhas, a estrela no meio com os raios compridos azuis e dourados que
	// atravessam a imagem e as três estrelas azuis com anéis, lá em cima à esquerda.
	// a foto do Hubble de Eta Carinae (NASA/ESA, domínio público) reduzida a 64 x 64: dá o formato e
	// as cores de verdade; a textura, o brilho, os raios e as estrelas são desenhados por cima
	var FOTO_ETA = [
		'080b07080b07080a07070906060906070906060906050a06050a06040a06040b06030b06030b06030b06030b06030b06050c07050c07050c07050d08050c07050c07050c07050d08050d08050d08040d08060d08060d08060d08050d08040d08040e08040e08030d07040e08040e08040e08040e08040f0a08120c040e09040e09040e09060f090c100c060d08050d08050c07040d07030d07030d07030d07030d07030d0707100a040c07040d08030c07020c06020c06030c09020b0a020b0a',
		'090c08090c08070a06080a07080a07080b07060a06050a06050a06050a06040b06030b060e150e030b06030b06040b06050c07050c07050c07060d08050c07050d08050c07060d08060d08060d08050d08070e09070e09070e09060d09060e09060e09060e0a060e09060e09050f0a050e09050f0a050f0b050f0b050f0b040e0b040e0b050f0b080f0c060d09050e08050d08040e08040e08040e08040d08030d07060f08070f08040d09050c09040c08030d07030d07030d09030c0a020b0a',
		'0e0f08080b07080a07080b07080b07080b07080b07080a07070b07070b07060b07050b060d1511040c06030b06040c07050c07050c07050c07060d08060d08060d08060d08060d08070e0a070e0a080e0a080e0a080e0a070e0a070f0a080f0b080f0b070f0a070f0a070f0a070f0a070e0a06130f050f0c050f0b050f0c050f0c060f0c050f0c050f0c070e0c060f0b040e08040e08040e08050e09050e08050d0709110a040e09030d09040e0a030d09030d0a030d09030d09030d0a030c0b',
		'060c06080b07080b07070b07080b07080b07080b07080b07080b07080b07070a06050b06040b06030b06050c07040c07050c07050c07060d08060d08060d09060d09070e0a070e0a080e0a090e0a090e0a0a0e0a0b100c0a100c0a0f0b0a100b08100b08100b08100b08100b09100b09110c08141007100b08100b09100c08100c08110c07110d07110b070f0b070e0c050f0a050f0a050f0a060e09060d080a110c060e08040e0a040e0a030d09030d09040e0a040e0a040e0a040e0a040d0c',
		'060c06080b07080b08080b07080b07080b07080b07080b07080b07080b07070a07060a06050b06050c07050c07050c07050c07050c07060d08060d08070e09070e0a070f0a080f0b0a100c0a0f0b0b0f0b0b0f0b0b100b0b100c0b100c0b100c0c110c0b100c0b110c0b110b0b110d0a110d0a130d09110c09110c09110c09110c0a120d09120d09120c09110c09110c08100b08100b070f0b080f0b09100b09100c060f0a060f0b050e0a040e0a040e0a040e0a040e0a040e0a040e0a040d0a',
		'070c06070c06070c06070c06080c06080c07080c07080c07080b07080b08080b07070a06060a06050c07050c07050c07050c07050c07060d08060d09070e0a070e0a08100b09100b0b100c0c110c0d110d0e0f0d0f110c0d110c0e110d0e110c0e110b0e110c0d110b0e120c0d120d0c120e0c15100b120d0b130e0b120d0c130e0b130e0b120e0b130e0a120d0a120d0b110c0b100c0a100c0a100b0d140d0d100c090f0b080f0c070e0c050e0b050e0b050f0c050f0b040e0b040e0a040d09',
		'090d070a0d080a0d07090c07090c070a0d070a0d08090c06080b07080b07080b07080b07080b07070b07060c09070c08060c08060c08070d08070d09080e0a090f0a0b0f090f110b0f120b0e120c0e120c0d100c0f120c10130c10130d10130d0f120c10130d0f120c0f120c0f120c0f17130d16110d130d0d130d0f130d0d130e0d130e0e130e0d130e0d130d0d130d13140f12120d13130e1a17101d161112110d0a0f0b090f0c080f0d080f0c070e0c060e0c050f0c050f0c040e0b040e0a',
		'0a0d080c0e090d0e080d0e090d0e090d0e090c0e090b0d080a0c08090c07090d08090c07090c08090c090a0d090a0d0a090c09080d09080d09080e0a0a0f0a0b0f090d100a15140d12120b12120c10130c10120c10120b11130b17160e13140c1c170f12130b11140d11130d10130d1017120f150f10140e10140e11140f11140f10150f0f140e10140e11140f12140e1915121c16112a1d141e17111b151013120d0e100c0d100c0a100c09110d09100c08100c0c100c060f0c050f0c050f0c',
		'0b0e090c0d080d0d080c0d090d0e090d0e090c0e090b0d080a0d080a0d080b0e080a0d080a0d090a0d080c0e090d100a0c0e090b0d090a0e090b0f0a0c100a0c100a0e110b10110a13140c15140b17150d15130d11120a12140b13140c15150c17160d13140c13140d13140d13140e12171112150f12160e191b1412150f12161011151012151012150f1215101616101f19132b1c133c2316351d182017131c16100f110c0d110d0c110d0c110d0a120d0c110c16140f0c120d070f0c07100d',
		'0a0d080c0d080c0c080b0c070c0d080c0d08080d07090c06090c06090c06090c060a0d080b0e090c0e090e0f0910110a0f100b0e0f0a0e100a0f110a0f110b0f110910120a13140b12130b17150c301c11351d131b150d14150c15160c14160c14150c15160d15160e14150e13160e141d1a13170e13170f13170f14170f13170f13160f1317111317111517101b1811261c1637221545231d3d211b18140f13120c0f110c0f120d0e120e0e130e0d130e14140f1714100c110d09110d09100d',
		'0b0e090d0e090d0d090d0d090d0e090b0d080a0d080a0d080a0d070a0d07090c06090c060b0e080d0f090e0f0a0f100911120b12130a13130a12120b11110a11120919160b21180d19160c1a150c281b10381f13301c1416160b16160c16170d16180e16180e17180e15170d14180f16211f15181015181015181015181014170f1518101518111a19131b19131617101e1c12221a114d27202f1c1719150f13130d11120d10130d10130e13140f14141017151110140e0f131011130f0c110e',
		'0b0e090c0d090c0e090d0e090b0e090a0d070a0d070a0d080b0e090b0e090c0e090d0f090d0e090e0f090f100910110911130813140b17140b201a0f21190c3d29195537273c271b3621152c1d101b170c18170b17140d18170d18170c19180d1a180e19180e18180d17180e161910161b14161911191a13181a12171a13161911191a13181913171712211b151819111c1c1222191345241e321d161c161114130e13130f12130e13140f16151114141010140e11130e1114110f130f0e130f',
		'1112090d0f090d0e090d0e080d0e090d0e090c0e090b0e090b0e090b0f080d0f080e0f090e0f0a10110811120711130812120719170c29221a3d322e4a3328765e6b5c474d3929223d261a3320131e190e1b180e19160e1a170d1b190f1d1b11221d131c1a1019190e19190d191b13171b12171a11191a131b1e1a1a1d18201d171d1c151819131718131c1a131d1f161718101b1812261b161c161014140f13130f14141017161116161115151113151011140f12140f1214110e130f0e130f',
		'0c0f050f11070d10070d0e080d0e090d0e090d0e090b0e090b0e090b0f080e11071011071011080f11080e110711130812140815170a28272136343549404047465a4946614034383b272241271d291e11201a0f1d18101c180f1d1a101e1c12201c121c1b101a1a0f1b1b101c2625181b13191b131a19121c1c1620201e211c171a19131d1b15181b152220151a1c13191a131b19131818111a17111c171215161115151114151017161112151013151012140f13151013151011140f101411',
		'0b0e050d0e060c10070b11070b0f070b0f070b0f070b0f070b0f080d11080e11061112071313081112070f120712140813160910160a1a1e17292c26383631353333564f6d4b41533b2f2f422d283823182e1e14271b131e19111d1a101e1b101e1b111d1a101c1b101c1c111c28291b1d152223241e21212024282222251d1c171d1b161c1b1723201b27221a181b181b1b17191a151719131d19151b18141c181416171214161214151017171117181213161213151212151112140f171512',
		'0b0e060c0d060d0e070b0f070e12070d11070c0f070b0f070d10080e120711130723180a1c170a11130711130712150712170e122123192c3a232e2536383a3d37364e4756645b7a4a3b444031334c3130542f2a3f241e2c1d18201b13211c13201c121f1d12211c13201d1520211d1d1f1b232a35213148244471292f44211f1f201e1e212327412d271b1b1b1b1c1b1c1f1f191d1b1c1b181d1c19181814161611141611131612191813191812141814121512121511121510151511161410',
		'0b0e070b0c070d0d090b0d07090d050d10071315070f11080f1208101208101208131407221c0f12140811140810180c182a322b3f673c55932c3c4e383634443d4546404a606087554a613c3034443037482f33382626362426251e1a261e18241e16241f182d272a2f2c322223232325282a355325447232578f394573382e4327314b3a415d2f2b3a221f231f20241d242b181d1e1f1f201f1e1e19191518181416171319171417171215161114161114161214151014141016131013120e',
		'0a0d06080a050a0e08080d080f18220d171f0a0f0814160713150710130810130711130713150710150710160a0e2529274067697fb07285bb3f508434302d53424f4b3f4d4641564945624035403d2e35422d353b2b314a2d372f242629211f2e232333282d33304039415f3131453e3d6344548b3b4e85414b804e65a5514c843c578e3a4e812a3c6c39355b33365c1e24311d232b2123291d1c1b1f1f201e2124191a1717181516171215171215161114151014140f13130e17141015130f',
		'090c0507090308100b132235253a651c2e550d18200b11081014081216081014061113071315081416090f170c0f1e16283f624c5e905565a1444b7e3936403c333c4538453e323f50456444394c3c2e39432e39392730472c3831272e2b23253829323a2e3d3b2f40373955413551493c634855903a3d673c487a4c63a44461a24055883054923e54963248863338642d2d452327361f242d23222a282129191e21171b1a15191516181317181315151114141013140f16141019141015130f',
		'070c04060803080f0d1626485876ad2742771021360810090b10070e130610170712170712170811160810190a10201b1e36473b538a303d6436303c322e2c3d363c4335413d313d493b55484467372f404530404a2e3c462a3a3929383627303e2c3b372e44382f443d2f4244335151497d434778413d654a5088486eb23469a93b6db53d7dc63a72bb2e549636488032305124263723212c30293e2925321a2a3b171c1c171a171718141916131816121b15111d16121d161321171216130f',
		'080d05070a05080d091327421c30591a2d590d10110e0f071114080e12070f13061419071a1e0a121809111a0c131e11162724192d3618201c34282b38282b393038342c373a2f3c393143505588403c5a4432464f3347472e43402b3f4a2f4055324546334c45314e4f395d583c675d508c484c854659964579c14a6baa4267a8417fc9399ee74a96e03880cb4068b1393a6c332b47332c4624315619232d1a1e22181a181b19171917141c17142c1c182518142819152c1a151d1610181310',
		'0b0e07090c06090d090a13110f1e2a0d13150d100e101107101207101206111306121507131e1b1c343f1a261d162112141d101a201a211e1445272244292b3a292f352c35362b353d31443c45744550873d354d3f344e40304b5b3453673f62623d5f6c3e59985b7c9d5e7ea6627fb07aa2a692c66368a94d60a2566ba3467dc63f8cd8467bc84b86d34e78c54a6ab3464f9641448028518d26528e1d2d481c232c1f1c1d221c1d251a1a281c1e2a1c1d301c182317131e15111c15101f1612',
		'0b0e080a0d080b0e090c0f0910130d0d100a0e110b111208111308111307111307121d171e314d314a822f406520251a181c0b1d1e15261c123c221b4b2a293c2528352933372c3a3f344f42426c4668ac4f5181433f6749385a5e3d68624375865380b2738abb78899b4f549a535fa97293bba1cac3bce79893ca777ebf4b76c04686d25081cf6185d3557dca4776c2446cb73466af305a9f2954942c335a26212d261e23241d202c1f243222274526293a1f1b2116131d161217140f18130f',
		'0a0d060a0d080b0e090d10091011090f10090f110811130812140713150810160c162d42304472859ad4364676212b38212110211e122a1e113a20175f302e532d304429343a2a39473d634946754f5e965878b5544c77513e6160477b7c5486b17190b17186b47282a85e6ba05f73ae8bb5beabd4c3b3ddb6a2cbc0afdca5a7df6f91d45779c35875c14f69b62c99e4208dd93673bd4361a73d46822c325729293e2e263633252e38252c3f262f301f222819181f16121d1615191513181411',
		'0a0e070b0e090d1008121108121109131308131308111307131407141407111609121f1f2d3e683b4a762e375e1a22291a1a10241e102f241447261c5f30335d32424c304a482c4244375854588f5d60946c9ccf717aa6594d75785a8fb57fa3b57fa0a2667bac708ca9677ab391bab392c0b9a5d6bba2c8b496bbbfb2ddb8aedbc1c2ec9aa2da5375bd3d63af2a71bf248dda3e82cf505ea743589b403a68363157443d6b452c3c41293630212822191a281a1b3a201f301d1c1a1412191411',
		'0b0e080b0e090d0f090f10081211081514091514081514091615081314061015090f1918202d43242e521e21301a1913211a10241b122d211457371f512e2d55365246365c4934554c3d626d7ab38ea6d59999bf99b0d86a68938d6d9aa5749393627b97667f825371a67892ae89b1ba9bc7bca3cac0b1deb49bc5c0add6b49cc7b4a7d5c2c4eda1ade13f72bd318ad83c95e02c89d43189d24290d74c7fc44f61a25a5994574378563d6238293b34232a2d20242116131d141119130f1c1512',
		'090c050a0d070b0e090c100810120815140915150813130715130714140812130712180e121b1e161a1c1916131e1914251a12251a122b1c163e221f5c31286638414d3b614e46764e48776777aeafd1f3b1bfe19eb0da888ebb90759d9772948c688178505f8a6174916d89b8a1cbb89ac2c8b9e3ba99c0c5b2e0bda2cdb69eceb3a4d4afafdebabbe86076bc516bb73e94e13685d12a85cf377dc35451925b5494715a956f538b583a5e3e24292c1c1e321d1a1d150f17130e1813101b1412',
		'080b05090c06090c070b0e080c10070d11070f110710120613130713130814140916160a14160e1919111c170e251a12281b14281b142b1c16321f1f3c242c54323c75566656547e56598c57619589a9d3a2c1e5acb8dea5b6dd9183aa917a9aa2859e9b7e93896f80907894ad99bcc8b4dbbfbce6bca9d2c09ec5c0a0caba98c3b7a2d0b5a5d5bbbdea7c83c34163b13485d33f8ad72c87d34680c863589d6b5b9a7f507d8146615b3039301d1f1f15142a1a181b1410191410181311191311',
		'080d0c070e0c070d09080e0a09100b0b10080d110810120811120713130615150817160918180f1e180e241911291b132a1c152e1e1a2f2023342129392531442d43503a58655c765e608a5e61926472a19abfe4b9cdecaeb9d7a39fc18f819db39db2af9fb88b7b8cb6a8c3baacc8b8a7ceb6a9d2b8a8d3ba9fc8b898c5b194c4b9a6d8b194c2b7a3d39691cc3183d23f81d03b7dca3b7fca575da14d3460663c5d6032434f2931381d1e2718171c14122217162a19162719151f15131d1512',
		'080b07080c08080c08080e0a08100d0a120a0c11070e150b10181112150a15150918150b1a180e211a10281b14291b152d1c19301d2034222a382431402c434835554f3c6454497b5955855e6288656b8e8687a7a49eb99e99b1b0afcaada5bc998a98d7c2d89d93a3dcd6ecdad5ecbfbad9a79bc2b3a1cba8809fb582a2ba98c4b186aeb79eccae8ab89a90c94977c6555dab4762ad575ea97454998d4c7f713c5a714469602f355027252517151f15132a1817371e1b341c17301b162b1916',
		'080b07080b07080c08090c08090d070a10070c10080e120712150a17160b16150a191a141e1f1d221c16291d1a2b1e222f202634222e352535402b434532514f3b655d497464507c786e9d8983adb5bcddc5cce8c2bfd8bebbd3aeaac0b2afc6aaa5b8aba7bbbeb8c9d2cddfd7dbf1d7dcf4a192b29c7b98b78eb2c9a8d0bd97bfc09fcab79bc9ab7da98477b8526ebd595ead7a56a15f4a8f9b58919a4e74753e5969394f5e2d314822215225224723204c242145211b2d1a14201511261815',
		'0a0c07080b07080b07080c08090d090b0f070d10080f13061515081c170a1914091b170d1e1910241b17281e1f302a3a322c4338273c3f314f4b3b635e4368916b8ea896bca293baa49cc4adaed2c5d0e8d7dcf0d7d3e8ebe9f8e8e6f6cdd0e5c9cee3cdd3e6d6d3e3dedaebc1bed4b1aac3a899ba9980a1c5aed6c09bbfc8bce6c1a7d0aa789ca0729e42579f2f59a53b478969417f924d85a04e788d4665773c506e3a4c5f3036482628482420311c1927171528181620151219130f181310',
		'080b06080b07080b07080c07080c080b0f070d11071014071213071815091d170b20190f231a1230211f3322262f21293727373a283e412c474a34599686b0a487a9b7bee5a69dc1b6b9d7bbc5e0d3dcf0d3d1e3e4e3f5e8e8f8ededfbeef0fce8edf9e0e5f2e3e5f4dfdbecbeaec39b8da8afa6c6c6b9dbac7e9fba98c4b795c0baa5d5ac7ca17154873b4d9346478b4c3a73643a6faa5176944257873e4b692f3254272749221e331c1a2a1a172718152719162417141f161217120e14120e',
		'080b06080b07080b07080b07090d070b0f070d11071013061213071915091e170b22190e261a1237211e35222634232e3c283b412c46432f4d4c3357a28eb1a387a7a489a3a18fa9b2b6d2c9d0e7c9cde2d9d8ebd5d0e3dad8eae6e7f5eeeffcf7f8feebeefae7ebf9d9dbedc1b5cbd5cae3a79bb7c0afcea67e9daf81a6b48cbaae7fa68f5b813d35673c3b755739716a3767783a6599486d90435c813a465d2c2f462325582b2b562a284625222d1a162718151d140f1b141014120c13110d',
		'080b06080b07080b07080b070a0d070c10070f12071313071414091915091b160a21180c341e15442423542e3a47293c3f293e422d48473052725175a0728cae9abba2849ebec5e2bbc0d9b7bad0bbbdcfcfcce0d0c8d9d6d4e4e1e4f4ebeefbfcfefff2f3fce6ebf9bec3d7bfbad2b8abc6a59dbdc5bcddbea7cdc1a0cba66c8e81455f3e366a313b783b407f493f7c5a3d7a793f6f934874af526e9742496f3130592d326b33344b242041201a22171119130f19140f15120d14110c13110d',
		'080b06080b07080b07090c070a0e060d10081012061313081414091915091e170b2a1b0f40272240252a4d2e433f283f432b454b375e6e5b84b1a4cdb094b6a2798eab97b8b6b2ccc0c5dfc4cbe1ccd2e7cccbe1d1cee0c4becfd9daeaeceffcedeefaededfae0e3f3b1b9d29996b0a39dbd8e8eb39b8cb0afa1cbb79dcba5729a57457c344b93354c9539488f4e498f484282543b74834578b85c84be596d8c3f488b4a5d5d2b2b4c24222f1a171f15121a140f16120c14120b13120b13110d',
		'080b06080b07080b07090d070b0f070d11071213071514081614091d170c291b1130211d30262f3327353d31514137614b4b864c4c839c94c3afafd9a98ca5ae97b6a293b2a99fb9b5b5d2aaabc0c2c5dfbcb5cfd3d2e9d0cce2d3d5e7dfe2f2dee1f2e8e9f8cccedfc2bad19b8fadbebbd8c7bfdca58cb0b6b5e2ada6d88784bf5469af3b6ebc3774c23463b03d529954488982477da9557fac5271b051638a42509449597034354122213620211f161218140f16120d14120c13120c15120e',
		'060c05060c05060c05090e060c100712130716140716140719170a231d182a21232c34512c3152363356403d6e454c884c66ad61629ab4b4dfb6b2d6b1a5c6b5b4daa7a1c0c4c8e8bfc1deb1a6c1b3b0c9c4c4e29f90a8afa6becbc5dec7c6dfdad9ebe0dfeebcbad3adaac9ab97b7a899bac4bedfac8db1c19dc1ae91b9ab95c37684c65e7eca6f77c45570bc605da6a064a5d46f9fdb6986ca575e8f3c3d602a2a4d25223f2120321d1d291a181f151319141019131019130e16120c13110d',
		'060c05060c05060c050a0f060d10061313071613091918131824311f3963252c472c2b402e3154393f73445b9d426fb8477ec86c78b2b5c1eaa99ec0ad96b59d8badb8b9dabec2e6bbbce0babee0b6b4d29e94ad9c91afa898b5aaa5c2b9b5d0d1cfe4bcb8d1acabc99993b9a993ba997ea29f95beb0aedbb5a2ceb791b7b57a9c7862a37567b29874c26e73bf9177c3bf71add36d95ea7593bb515a75343d46262d341d1f2d1d1e261c1d1e17151d151318141117131016130f15120f13110d',
		'060c05060c05070d06090e060c100612110717140a1a242d173f6521242f25293a282d452b386239538e2f7ec53994de428ed87678b1b7b3dcae9abcb39ab7aaa9ceb9bfe19285a98172909288a3b3b9d6bcc5e2b1b7d4adaec7cad5edc5cbe2aba2bea6a3beb8bcd99f9ec5997aa469547f6c60917b7baf9593c48a75aa9e78ac8f62a16451947a569c8e5ba1cd81beda86bbcb7caed37fabd674949c474d5827242b1a17221815221a1b261c1f24181720191918191a15161413120f12120f',
		'060c05060c05070d060a0f070c0f0610110513120718160d1f1911201b181c365e2536612b4a8129639f3862a44a63a8576bb5705d9bafb4e1afa8ceb8a5c2a9a0c1a9a4c59b98bd705d74998da9c3cbe9bcc3dcb1b5d0a8acc5babad2a6a0bebdbcd5bfc1d7d2daef9da1c85859874c548754548a5b558f5d5d96757aaa6f6ba65e4b8c5d4b8c9a589a9455939e5890be6a9cd478a4d87ea6c46787a24c58662e28311c172b1a1629191622161520161418131014120e13120f13120f131513',
		'060c05060c05070d060a0f060d10050f11051211061514091a17102020232621232f2c442b3b6a2d4076373e704048836275be615b9e9799cda69dcda8859fb3aecec6cbe9a0a2c780738db3badfb3b5d1bbc0dabfc7e2c3d1edb8b6d3bec2dec5cee3c2c7dfced9f3a1a1cb525784424b7e4343744345774344794c42766b5d8d7766a5645396ae63a295548e914e80a8567ed37197d67396b154687c3b42652a222f1a141e150f19130e1c14111b131017120f14120e13110d12100c12100e',
		'060c06070d06080e070a0f060d100610110611100514140919150b21190f271a1132272f313254303a673342783d40786163a9736ab46054969588bdb9a2c5bdb4d6bab4d6afb0d79d91b4babcd8c5d1edc0cae6c5d0efbfc7e8acaacac4ceebbdbedab7bad6b8b8dba09bc6514e7d49487d3c3d6e393c6b3a3a6b654373603b6a5d41798a71ac9475b2ac669c914f7fad5c86c7678ad37192b65f7a9248596e2e232817101e151018130e15110b15120c11110c12100c12110d11100c10100d',
		'090d07090d080a0e080a0f070c10060f10061111061514091713091d150a23180e291c1a3127363531513237653832574b3c6d6b589f526eb76971b49d9ccfbaa1c3c0afcfb7accfb4b1d6a198bab8beddafafcfaca4c591728ca28fb4aba3c5b9bddeb7bde1b6b1da7a78aa444374473a68463662433767523a66533b6e743f6e784376744c899572a4a27bac935d8faf5b7fcf6681a0516a91455886404f752f222b191225171126181115110b12110b11100c11100c10100b10100b0f100c',
		'19120b0d0f080d10080d10060d0f070e0f05121307141308181409271c1221180e231a13271e2131293c372b423d2638422f515f61a85176c15b67b08988c4bbb4dfb8a0c19f7f9bb2a5cab9b5d8b9c3e6aea7cb926e8692698194779f9f88ae9d8cb6a68eb98367964240744339683c2e533b2a4b3a2c4c372c545436628b4b7c97507d87476d8d50788154828f5a82a96088bd607f8a414e874869954b647733313d1e1418130d15120c13110b11100a11100b100f0b0e100a0e0f0a0e0f0a',
		'0c0d080e0f080f11070f10070e0f070e100511120713110617140825201f1e19121f1813271e1f3121253620263d263646345e4d53964f61aa5967b25a61a96e6eaeb0afdcd0cae8bcb6d6c2c3e2bbb9ddaa94baa787acac89afad8eb4936488a37aa28d63913f33623a3361413057412d51462d4f3827413a2b4c64334f8b4664b65874a149567f393c8c485fa25166a15970a56282945679a55f839c4b5ca246494b1f1417120c13100a12100a10100a0f100b0e0f0a0d0f0a0e0f0a0d0e09',
		'0d0f091820191920170e0f0610110713120612110612100516130817140a1b170f2018122218112c1c193225323725375037613f3e7442437d4b63ad4a7cc95581cd5e7dc4858fcaa8b2e0b4bde5928fc16f61956b5b8a8f7baa987bac916c967758864b35623b2d58412c5040284348273e462536432437462738592c3c6e3134833532762f27662e2b813c3c8e3f3d9c4851b86582b17193d88db3923e3c62271a26160f15110b14100a110f090f1009191a140e0e090e0f0a0c0e090b0e09',
		'0c0e0910140d0e19170f100612110713110614120713110618170f16140c1a150b221a14241c192b22272f2b473b283765467461477d4e37654b5fa73688d52592e03b97e45d94d7578dd66371ba5f5ea64245864649894e4b8d4f4a884934633f31603c2b4f43264641243f392236412333442432552b35592a336931388d3f446e2f2953251f451f185b271c773124903f3cb4545dbc5e6da24d4d341d0f1e140d16110b12100a13110b0f0f080d0e080d0d080c0c080b0e090a0d08090d08',
		'0d0e080e0e0711110812110610100610100513110615120718160d1b160b1d160d261d1a2721282f1e1b3d262e3e2b42452f4e52324e382c4d3c5697277cc62c77c33087d04968ab4a65ae5350955b4a8e554f975c5faa4e5ba44c4c8f503c75443364482d4f48263e54293f582e40552c3c62313e7d3c46853b3f75373a8e4551663033653336522418411f14411e1647201745201750221846201824190c1e1a0e12110a100e0a0d0e090d0e080c0d080b0e080a0d07090c07080c06090c07',
		'110f07121008121009110f071111061211061210051613081a15091e160a21160b22180e2b1c1428180e321c173b201f3c2c47342b48383c6a325591345090405ca04258953c4c8b3f4682423b71584381525ea8505da64f549a5b4586493567512f51572e46592a39653046572d3d5f32438a3f46863f476a302f602c2a5f2f32613135632e293a1e162819112217102617122b19112c1a131b120c14100912100914150d10110b0d0e090b0c080a0c07090c07090c06090c06080c06070b07',
		'1510091511081410081411071311061311061512071713081a140820160823160b23170b27180c23150928170c2f1a14332d4b36283f354b82256aa9383a6b5042663a3a6f363f76322f5236284348396f4d63ad4b589e485fa74c3c745c375f6d364c803e4f5d2f3b6d374d703946542c376a353d7134345326205b2a234c272245272c5f2e2c3b1e182718112216102a191223160e1e140c141009100e080e0e080c0d070f100913130b0b0d08090c06090c06080c06070c06060b07060b07',
		'1610091810091611091611071511061511071713071b14071d14071e140820150824170923150924160a2a190f311d193825313b4779416fad2a69aa3743663b2c3e3d325b3031592c2c4e3c29424d396c4b4c8a3c3e7566589374416a954c6c9043559140456d343c69323e6f3741512a2d452422582923371e1a361e1b311c173a1e1a3c1e19341b1529191322160f1e140e1c130c1310090f0e090d0d090b0c080a0c07090c070b0d0715140b0e0f07080b05070b06060b07050b07050a06',
		'1910091a11081810091711081611071712081a14081c13091f14091e14081d140723160925170b29170c2c1a122a1a1437232937598e377ec03378b645415d301f2827315629273f372a475339655a4d898852838b4664763d56813d4da34a53863e4379383b5b2f364b24263f2124391e1c341d1a311d192819152116102517122a191221160f2116111f150f26170f18120c15100a0f0e070c0c070b0c07090c06090c06090c06080b05070b050e10080f1009070b06050b06040b07040b06',
		'181009170f081810091810081711071812091a13081d13091c12081c12081e140922160a22150925160a2a1c172d20232d1f242e305140456c5f629132273b2428432231563e37653b2942794c777d5d9773466d834056903f4869333b49242644262c4f282a5a292443211f2e19192c1c1c2f1e1d1e151017130e19130e2115102d19131e140d1c130e2616111d130d15110c100e090c0c060a0c08090c08080b07080b07090c08080b07070b07060a06070c07090e09040c07040b06030b06',
		'1810091810091911081810071911091a12091b13091b12081b12081d13091e14082115092014091e14082118132618122a1f2429243335231c3b3761272d56273b69332b4738283e3c2431713f5d884f76a355719f4e667433354f27293521263b2a3a311d2050241d3d1e1c2415152117161e151115120d12110c12100c18130d16110b1a130d1e140e16110c110f0a0c0d080b0d08090c07090c08090c08080a07080b07090c08070a06060a06050a06050a06040905040d07040d08030b06',
		'1810091810091911081c11081c11081c12091c12091b11081b12081a13081c12081c12081b12081c140a1e140c1f150e261c1b2b1b1533211a2d253828263f2c1c22412a395d3a554527305c3038743d4d6c343a6430395125213f211f2a1b1c271b1c2b1c1c25181529191622151415120e12110d0f100b0f100b0e0f0a0e100a0e0f0a110f0b110f0a0f0e090b0d080a0c07090c09080b07080b07070b07050a06060a06060a06060a06050a06040a06040a05040905040a05040c07060d08',
		'1810081a11091b11091a10081a10081910081a10081b11091b11091a12081b12081912081a120a1b130b1d140c1f150d22160e27201d2a1b1a271a1b2316102314102c191540222041252844211d5226234c24234521213b1e192c1a162c19172c1a17301c1a1c140f17130d14100d14120f0e100d0d0f0c0c0f0c0b0e0b0b0e0b0b0d0b0b0d0a0c0d090b0c090c0e0a090c08070b07060b07060a06060b07060b07050a06050a06040a06030905030a06020a06020a06030a06030a07020a06',
		'181009180f09190f09190f091a100a1b11091a10081a11091911081a110918110818120b1a120a1a120a1d130b21150c271a0f231b1a1f16142116121e130e1e130f2215112e1a162e1a163a1e19381c152e1b1b3c1f1e311b172316122717121c140f17120e13110d10100b0e0f0c0e100d0c0f0c0b0e0b0a0d0a0a0d09090c090a0d0a0a0d0a0b0c0a0b0c090d0e0a080d09060c0a060c09050b08050c09050b08040a08040b08030b08030a08020a07020907020a07020a07020a07020907',
		'160e09170f0a19100a1b110a1b110a1a11081a10091b110a1811081611091812091b120a1c120a1d130b1f150c25170b2419101c17181e1a1d1c130d1b130d1d13101c120e1f1410231612281712291813301e23301b1728191417110d15110c11100b0f110b0e100a0c0f0a0c0f0b0b0d0d0a0d0c090e0b080d0a080e0a080c09090c090a0d0b0d0f0c0d0e0b0c0d0a050c09060d0a060c0a050b08040b08040b08030b08040b09030b08030a08030b08020907020a07030a08020a07020a07',
		'160e0a180f0a1a100a191009180f0817100919100a18100919110a1c130b1b120a1b11091e130b20140b21150b2a1a091b130d18130e1b130f1a120c1a120d17110c1b120e1d120f1e13102014112516122f1b1c23161219130f12110c0f100b0e100a0c100a0b0e090b0e0a0a0f0b080d0c080e0d070f0c070e0b060d0b060d0a080d0b070c0a070d0b090c0b070c0a050c09050e0b040d0b040b0a040b0a040b09030b08030b08030c08030c08030b08030b08030b08040b08030a08020a08',
		'180f0b190f0b190f09170f0918100a16100916100918110a1b120b1d120a1c120a1c120a1d130b1e130c26170a1d130a19120c19130e18110c18110c17110c19120e18120d19120e1d130f1e13102115122517151f151213100d0f100b0e100b0b0f0c0a0e0c0a0e0c0a0e0d090e0c080d0d060e0c060d0b060d0b060d0b060d0b0a0e0d0c0e0e070d0b060d0a050c09050c09040d0b030d0c040b0b040b0b040c0b050f0d020c0b030c0b030c0b030b0a030b0a020b0a030a0a030a0a030b0a',
		'1c100b1c0f0a190e0b180e0b150f0a150f0b15100b17110c18110a1b120b1c120b1b110a19110a1c130b1e140917110a17110b16110c14100a150f0a18120d17110c17110d1a130f1c14101d14101d151114141313110e12110d0c0f0b0b0f0b0a100d080f0d080e0c080d0c070d0b060c0b050d0c050d0c050d0c050d0c060e0d060d0c060d0c050e0d050e0d040e0c040d0c030d0c030d0b030c0b030c0b030b0b030c0b030c0b030c0b020d0b020d0c020c0b030c0b030c0b030b0a020b0a',
		'1c0e0a1a0e0a180e0c180f0c150f0c150f0c150f0c14100c16110b19120b19110b19110b17110a1a140a141009110f0914100b120f0b120f0b16100c16100b15100a17110c19130e1b141016120d1513101014160f100d0e100d0a0f0b09100c090f0d070e0c070e0c060d0a050e0b050e0c050e0d050e0d040e0d040e0d040e0d040d0c040d0c050e0d060f0f2b1d26040d0c030f0e020e0e020f0f020e0e030c0d030c0b030c0b030c0b030d0b020d0b020d0b030d0b030c0b030c0b020b0a',
		'1c0f0b1b0f0c190e0c140e0c130d0c18141a16121514131515130c16110b15110a18110b15130b110f080e0d090d0d090d0c080e0d09120f0b150f0c16100c16100b17110d17120d15110d12120e1815130d100f0c100e0b0e0d090f0c080e0b070e0c060d0a060f0c040f0d040f0c040e0e040e0f040e0d030e0d030e0d040e0d040d0c040e0d040d0c050e0e050f10030e0f020e0e020e0e020e0e020e0e030c0d020d0d030d0d030e0e030e0e030e0e020d0c020d0b020d0b020d0b030c0b'
	].join('');
	var fotoEta = new Float32Array(64 * 64 * 3);
	for (var fe = 0; fe < 64 * 64 * 3; fe++) fotoEta[fe] = parseInt(FOTO_ETA.substr(fe * 2, 2), 16) / 255;
	function corDaFotoEta(u, v, saida) {
		var fx = Math.max(0, Math.min(62.999, u * 64 - 0.5)), fy = Math.max(0, Math.min(62.999, v * 64 - 0.5));
		var x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
		for (var c = 0; c < 3; c++) {
			var a = fotoEta[(y0 * 64 + x0) * 3 + c], b = fotoEta[(y0 * 64 + x0 + 1) * 3 + c];
			var d = fotoEta[((y0 + 1) * 64 + x0) * 3 + c], e = fotoEta[((y0 + 1) * 64 + x0 + 1) * 3 + c];
			saida[c] = (a + (b - a) * ax) + ((d + (e - d) * ax) - (a + (b - a) * ax)) * ay;
		}
	}
	var luzEta = new Float32Array(TAM * TAM * 3), estrelasEta = estrelinhas(47, 60), corEta = [0, 0, 0];
	var CENTRO_ETA = [0.512, 0.531];
	// os raios compridos da estrela do meio (como na foto): direção e cor
	var RAIOS_ETA = [[-0.18, 1, [120, 170, 255]], [1, 0.65, [255, 200, 110]], [1, 0.16, [110, 160, 255]], [-0.68, 1, [255, 205, 120]]].map(function (r) {
		var n = Math.hypot(r[0], r[1]); return [r[0] / n, r[1] / n, r[2]];
	});
	// as três estrelas azuis, com anéis e pontas
	var TRES_ETA = [[0.073, 0.301], [0.279, 0.278], [0.21, 0.367]];
	// as duas bolhas, nos lugares da foto: centro (u, v), raios e brilho (a de baixo, mais perto de nós, é maior)
	// [centro u, centro v, raio ao longo do eixo, raio atravessado, ângulo do eixo, brilho]
	var LOBOS_ETA = [[0.425, 0.68, 0.172, 0.158, 2.08, 1], [0.6, 0.462, 0.142, 0.13, -0.61, 0.86]];
	function etaCarinae(buf, t) {
		var tt = t * 0.04;
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = (x + 0.5) / TAM, v = (y + 0.5) / TAM;
			var wx = fbm(u * 3 + 3, v * 3, tt, 3) - 0.5, wy = fbm(u * 3, v * 3 + 7, tt, 3) - 0.5;
			corDaFotoEta(u + wx * 0.012, v + wy * 0.012, corEta);
			var r = corEta[0], g = corEta[1], b = corEta[2];
			var lum = Math.max(r, g, b), claro = 0;
			var textura = fbm(u * 9 + 40, v * 9, tt, 3);
			// as duas bolhas, com a borda bem definida (na foto reduzida elas ficam borradas):
			// branco-lavanda no meio, rosadas na beirada, com a rede de veios avermelhados
			for (var lb = 0; lb < LOBOS_ETA.length; lb++) {
				var L0 = LOBOS_ETA[lb], cu = Math.cos(L0[4]), su = Math.sin(L0[4]);
				var ru = u - L0[0], rv = v - L0[1], ao = (ru * cu + rv * su) / L0[2], at = (-ru * su + rv * cu) / L0[3];
				var dl = Math.sqrt(ao * ao + at * at);
				var borda = 1 + (fbm(Math.atan2(at, ao) * 1.6 + lb * 5, 2, tt, 3) - 0.5) * 0.14;
				if (dl > borda) continue;
				var mu = Math.sqrt(Math.max(0, 1 - (dl / borda) * (dl / borda)));
				var rede = 1 - Math.abs(2 * fbm(u * 28 + lb * 9, v * 28, tt * 0.5, 3) - 1); // os veios ("couve-flor"): só as cristas mais finas
				var mancha = fbm(u * 6 + 20 + lb, v * 6, tt, 3);
				var base = [1, 0.98, 1.04];
				var esc = Math.max(0, rede - 0.82) * 3 + Math.max(0, 0.46 - mancha) * 0.9;
				if (mu < 0.14) { base = [0.62, 0.32, 0.36]; esc = 0; } // a borda fininha, marrom-avermelhada
				else if (mu < 0.24) base = [0.96, 0.84, 0.9]; // logo dentro da borda, um rosado bem clarinho
				r = base[0] - esc * 0.32; g = base[1] - esc * 0.6; b = base[2] - esc * 0.55;
				var bri = (0.7 + mu * 0.26) * L0[5];
				r *= bri; g *= bri; b *= bri;
				lum = Math.max(r, g, b); claro = 1;
				break;
			}
			// fora das bolhas: fiapos em raio no halo azul e na nuvem vermelha
			var ang = Math.atan2(v - CENTRO_ETA[1], u - CENTRO_ETA[0]), fiapo = fbm(Math.cos(ang) * 5 + 9, Math.sin(ang) * 5 + Math.hypot(u - CENTRO_ETA[0], v - CENTRO_ETA[1]) * 3, tt, 3);
			var sobra = Math.max(0, lum - 0.05) / Math.max(0.001, lum);
			var ganho = claro > 0 ? 1 : 1.45 * sobra * (0.7 + fiapo * 0.6 + textura * 0.2); // as bolhas já vêm com o brilho certo
			r *= ganho; g *= ganho; b *= ganho;
			var media = (r + g + b) / 3, sat = claro > 0 ? 1.05 : 1.5;
			r = media + (r - media) * sat; g = media + (g - media) * sat; b = media + (b - media) * sat;
			// o brilho branco da estrela no meio
			var dc = Math.hypot(u - CENTRO_ETA[0], v - CENTRO_ETA[1]), estrela = Math.exp(-dc / 0.03) * 2.2 + Math.exp(-dc / 0.09) * 0.35;
			r += estrela; g += estrela; b += estrela;
			var k = (y * TAM + x) * 3;
			luzEta[k] = Math.max(0, r); luzEta[k + 1] = Math.max(0, g); luzEta[k + 2] = Math.max(0, b);
		}
		posterizar(buf, luzEta);
		pintarEstrelinhas(buf, estrelasEta, t);
		// os raios compridos da estrela do meio, que atravessam a imagem (mais fortes perto dela)
		var cx = CENTRO_ETA[0] * TAM, cy = CENTRO_ETA[1] * TAM, pisca = calmo ? 1 : 0.85 + 0.15 * Math.sin(t * 2);
		RAIOS_ETA.forEach(function (rr) {
			for (var s = -TAM * 1.2; s <= TAM * 1.2; s += 0.5) {
				var px = Math.round(cx + rr[0] * s), py = Math.round(cy + rr[1] * s);
				if (px < 0 || py < 0 || px >= TAM || py >= TAM) continue;
				var f = Math.max(0.18, 1 - Math.abs(s) / 70) * pisca;
				buf[py * TAM + px] = maisClaro(buf[py * TAM + px], rr[2][0] * f, rr[2][1] * f, rr[2][2] * f);
			}
		});
		// as três estrelas azuis: miolo branco, anel azul pontilhado e oito pontinhas
		TRES_ETA.forEach(function (e, n) {
			var ex = Math.round(e[0] * TAM), ey = Math.round(e[1] * TAM), br = calmo ? 1 : 0.85 + 0.15 * Math.sin(t * 1.6 + n * 2);
			for (var a = 0; a < Math.PI * 2; a += 0.2) {
				var ax = Math.round(ex + Math.cos(a) * 4.2), ay = Math.round(ey + Math.sin(a) * 4.2);
				if (ax >= 0 && ay >= 0 && ax < TAM && ay < TAM) buf[ay * TAM + ax] = maisClaro(buf[ay * TAM + ax], 70 * br, 100 * br, 220 * br);
			}
			for (var p = 1; p <= 6; p++) {
				var f2 = (1 - p / 7) * br;
				[[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7]].forEach(function (d, i) {
					if (i > 3 && p > 4) return; // as diagonais são mais curtas
					var qx = Math.round(ex + d[0] * p), qy = Math.round(ey + d[1] * p);
					if (qx >= 0 && qy >= 0 && qx < TAM && qy < TAM) buf[qy * TAM + qx] = maisClaro(buf[qy * TAM + qx], 150 * f2, 180 * f2, 255 * f2);
				});
			}
			[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (d) { var k2 = (ey + d[1]) * TAM + ex + d[0]; buf[k2] = maisClaro(buf[k2], 255, 255, 255); });
		});
	}

	// ---------- Sirius: a estrela mais brilhante do céu e a companheira anã branca ----------
	// Como na foto do Hubble (2005): Sirius A tão brilhante que "estoura", com um halo azulado em
	// anéis e as pontas em cruz do telescópio; embaixo, à esquerda, Sirius B, um pontinho branco
	// quase escondido no clarão. Os anéis mudam devagar de cor, como Sirius cintilando no céu.
	var luzSirius = new Float32Array(TAM * TAM * 3), estrelasSirius = estrelinhas(59, 55);
	var SIRIUS_A = [0.56, 0.42], SIRIUS_B = [0.27, 0.74];
	var ANEIS_SIRIUS = [[0.115, 0.3], [0.17, 0.2], [0.235, 0.13], [0.31, 0.08]];
	function sirius(buf, t) {
		var tt = t * 0.05, cint = calmo ? 0 : t * 0.35;
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = (x + 0.5) / TAM, v = (y + 0.5) / TAM, du = u - SIRIUS_A[0], dv = v - SIRIUS_A[1];
			var r = Math.sqrt(du * du + dv * dv), ang = Math.atan2(dv, du);
			// o clarão: miolo branco estourado e um brilho azulado que vai sumindo
			// (bem azul e bem largo: ela é a estrela mais brilhante do céu)
			var miolo = Math.exp(-r / 0.055) * 3.2, brilho = Math.exp(-r / 0.13) * 1.1 + Math.exp(-r / 0.26) * 0.34;
			var R = miolo + brilho * 0.38, G = miolo + brilho * 0.66, B = miolo + brilho * 1.2;
			// os anéis do halo, meio falhados, em azul, lilás e ciano (as cores giram devagar)
			ANEIS_SIRIUS.forEach(function (an, i) {
				var dr = (r - an[0]) / 0.011, falha = 0.55 + fbm(Math.cos(ang) * 2 + i * 4, Math.sin(ang) * 2, tt, 3) * 0.9;
				var f = Math.exp(-dr * dr) * an[1] * falha, h = i * 1.7 + cint + ang * 0.3;
				R += f * (0.35 + 0.25 * Math.sin(h)); G += f * (0.65 + 0.2 * Math.sin(h + 2.1)); B += f * 1.2;
			});
			// um véu fininho de luz espalhada, granulado (a "névoa" em volta nas fotos)
			var veu = Math.exp(-r / 0.2) * Math.max(0, fbm(u * 10, v * 10, tt, 3) - 0.45) * 0.5;
			R += veu * 0.5; G += veu * 0.65; B += veu;
			// Sirius B: um pontinho branco com um brilho bem pequeno
			var db = Math.hypot(u - SIRIUS_B[0], v - SIRIUS_B[1]), anB = Math.exp(-db / 0.008) * 2 + Math.exp(-db / 0.025) * 0.35;
			R += anB * 0.9; G += anB * 0.95; B += anB;
			var k = (y * TAM + x) * 3;
			luzSirius[k] = R; luzSirius[k + 1] = G; luzSirius[k + 2] = B;
		}
		posterizar(buf, luzSirius);
		pintarEstrelinhas(buf, estrelasSirius, t);
		// as pontas em cruz de Sirius A (compridas, quase até a borda) e um X fraquinho
		var ax = SIRIUS_A[0] * TAM, ay = SIRIUS_A[1] * TAM, pisca = calmo ? 1 : 0.85 + 0.15 * Math.sin(t * 2.2);
		[[1, 0, 1], [0, 1, 1], [0.71, 0.71, 0.35], [0.71, -0.71, 0.35]].forEach(function (d) {
			for (var s = -TAM; s <= TAM; s += 0.5) {
				var px = Math.round(ax + d[0] * s), py = Math.round(ay + d[1] * s);
				if (px < 0 || py < 0 || px >= TAM || py >= TAM || Math.abs(s) < 4) continue;
				var f = Math.max(0, 1 - Math.abs(s) / (d[2] > 0.5 ? 72 : 28)) * d[2] * pisca;
				if (f < 0.08) continue;
				buf[py * TAM + px] = maisClaro(buf[py * TAM + px], 150 * f + 70, 205 * f + 50, 255);
				// as pontas grossas perto da estrela (2 pixels de largura)
				if (d[2] > 0.5 && Math.abs(s) < 26) { var qx = px + d[1], qy = py + d[0]; if (qx < TAM && qy < TAM) buf[qy * TAM + qx] = maisClaro(buf[qy * TAM + qx], 110 * f + 40, 170 * f + 40, Math.min(255, 255 * f + 60)); }
			}
		});
		// a estrela em si: um miolo branco puro no meio do clarão (o posterizar mantém o tom azulado,
		// então ele é pintado por cima), num degradê pontilhado do branco até os azuis do brilho
		var DEGRADE_SIRIUS = [[255, 255, 255], [236, 244, 255], [212, 228, 255], [184, 210, 255], [156, 190, 255], [128, 168, 250]];
		for (var my = -16; my <= 16; my++) for (var mx = -16; mx <= 16; mx++) {
			var dm = Math.hypot(mx, my), qx2 = Math.round(ax) + mx, qy2 = Math.round(ay) + my;
			if (dm > 16 || qx2 < 0 || qy2 < 0 || qx2 >= TAM || qy2 >= TAM) continue;
			// 0 a 3,5 pixels: branco; depois um degrau a cada 2,3 pixels, com pontilhado entre eles
			var nv = Math.max(0, (dm - 3.5) / 2.3) + LIMIAR4[(qx2 & 3) + ((qy2 & 3) << 2)] - 0.5, i2 = Math.round(nv);
			if (i2 < 0) i2 = 0;
			if (i2 >= DEGRADE_SIRIUS.length) continue;
			var km = qy2 * TAM + qx2, cd = DEGRADE_SIRIUS[i2];
			buf[km] = maisClaro(buf[km], cd[0], cd[1], cd[2]);
		}
		// as pontinhas de Sirius B
		var bx = Math.round(SIRIUS_B[0] * TAM), by = Math.round(SIRIUS_B[1] * TAM);
		[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
			for (var p = 1; p <= 4; p++) { var f2 = 1 - p / 5, k2 = (by + d[1] * p) * TAM + bx + d[0] * p; buf[k2] = maisClaro(buf[k2], 220 * f2, 230 * f2, 255 * f2); }
		});
		buf[by * TAM + bx] = cor(255, 255, 255);
	}

	// ---------- Nebulosa do Caranguejo: o que sobrou da supernova de 1054 ----------
	// Feita a partir da foto do Hubble (2005), como a Órion: o formato e as cores vêm da própria
	// foto, no tamanho da arte (FOTO_CARANGUEJO, 128 x 128, sem as estrelas de fundo e com os
	// fiapos realçados): a nuvem larga, mais funda à direita; a fumaça azul-esbranquiçada do
	// miolo; a rede de fiapos verde-amarelados e brancos por dentro; e a franja de fiapos
	// alaranjados e cor de ferrugem na borda. Por cima: o gás se mexendo devagar, uma textura de
	// fiapos finos, cores mais vivas, poucos tons com pontilhado, as estrelas e o pulsar piscando.
	// a foto do Hubble (NASA/ESA, domínio público), 3 bytes por pixel em base64
	var FOTO_CARANGUEJO = 'BwEDBwEDBwECBwACBgACBwECBwACBwACBwACBwACBwACBwACBQABAgABAgABAwABAwABAgAAAgAAAwABAgABBAMBAgABAwABAgAAAgAAAwABAwABAwABAwABAgAAAwABAAEBAQABAwABAAAAAAAAAgAAAgAAAgAAAgAAAwABAwABAgEBBwIDEA0SJSEsCwYIBAICAwEBCQIEBAEABwIBCAICCgMCCwUBDAQECQICBwICBQMCAwEAAwEBBQIBCAMEFBcZBgICAwEBAwABAgAAAgAAAQAAAAAAAQICAQAAAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgECBgIDBwACBgACBwECBwACBgACBgACBwACBwACBwACBAABBAABAgABAgABAwABAwABAwABAwABAwABAwAAAgABAgAAAwABAgAAAgAAAwABAwABAwABAwABAgAAAwABAQABAQABAwABAQABAQAAAwABAwABAgAAAwABAgAAAgAAAgEABAECBQMFBwMFBgIFBAEDAwEBCAEDCQICDQUCCQQCCwUCCQQCCQMCCQMCCAIBBgICBQMBBgMBDAMDCQMCBwMDCQMEBAEAAwEBAwABAgAAAQABAQAAAQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAACAAABAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwECBwIDBwACBgACBwACBwACBgACBgACBwACBwACBwACAgABAwABAwABAwABAwABAgAAAgAAAgAAAwABAgAAAgAAAwAAAwAAAgAAAgAAAwABAwAAAwABAgAAAwABAwABAwAAAwABAwABAgAAAgAAAwAAAwABAwABAgAAAgAAAgAAAgEBAwABBAECBQMCAwEBBAEBAwEBCAEECQMBCAMCBwQBDQYDCgMBDgQCCgICCgQCCAMBBwICCQQDCwUDCgMDBwICBwMBBgABBAEBAgABAAAAAgABAwABAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAACAQECAAECAAECAAACAAABAAADAAEDAAEDAAACAAECAAEBAAACAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAABwAABwAABgABBwACBwACBgACBgACBgAABQABAgABAgABAwABAwABAwABAwABAwABAwEBAgAAAwAAAgAAAgAAAwAAAwAAAwABAgAAAgAAAwAAAwABAgAAAwABAwABAgAAAwABAwABAgAAAgAAAgAAAgAAAwABAgAAAgAAAgAAAwABAwEBBgECBwEBBwECAwICBwECCAECCQICCgQDCAMCCQMDEQgFFAgEDAUDDQYECQMDDAUECgUCEAcFDAUDCgUCCgIBBwEBBQICAwECAQMBAgEDAQABAAAAAAAAAAAAAAAAAQACAQAAAAAAAAAAAAECAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABAAAAAAAAAAAAAAABAQADAAEEAQAFAQAGAAEFAQIGAQIGAQIGAAEDAAACAAECAAABAAACAAACAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABgAABwAABwAABwABBwACBwACBwACBwACBgACBAABAgABAwABAwABAwABAQABAgABAwABAwAAAgAAAwAABQMBAwACAgABAwABAgAAAgAAAgABAwABAgAAAgAAAgAAAgAAAgABAgABAgABAwAAAgAAAwABAQABAgABAgAAAwABAgAAAgEBBAEBBwEBBwICBgICAwEBCAECCgICDQQCDAUDBwMBCgQDEQcEHAwHDQUECwUCDAUEEAkFDwgEFAoFDAQCDwYDCwUDCQMDBQICBQMDBAIBCgwMBQQFAAEAAAAAAAAAAQEBNURLAwEDAAAAAAAAAQMAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAABAAACAAADAAACAQEEAQEGAQEHAgIJAgIKAQEIAQAHAQIIAQULAQYMAgUMAQMJAgIGAQEGAgEHAQIEAAACAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQQBAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAABwAABwACBgACBgACBwACBwACBwACBwACBQABAwABAwABAwABAwABAwABAwABAwABAwABAgAAAwABBAQBBgQCAgAAAgAAAgABAwAAAgAAAwAAAgAAAwABAgABCAkMAgABAwABAwABAgAAAgAAAgAAAwABAwABAgAAAgAAAgAAAgIABQQEBAIBAwIBAwECAgIABwIBDAMDCwQDDQcECgQCCwUEEQgFIxQJEwkHEAYFEAYDFAoGDgUDFAoGDAYDDAQDDAYECQMDBQIDBAICAgAAAgAAAwABAQEBAAABAQEBAQEBAwIDAAACAAAAAAAAAAAAAAAAAAACAAACAAACAAACAAACAAACAQAHAAAHAQEHAQEEAQEHAAQKAgYLAQgMAgoOAgsQAggOAggOBAwRAwwQBA0PAwkPAgYLAQUKAQULAQMHAAEEAAACAAACAAACAAAAAAAAAAAAAAAAAAAAAQMBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAABwAABgAABgABBgACBwACBgABBgABBwACBQABAwABAwABAwABAwABAwABAwABAwABAgABAwECAgAAAgAAAwAAAgAAAwABAgAAAgAAAwAAAgAAAwABAwABAgAABAMDAgAAAgABAgABAQIBAwABAgAAAwABAwABAgAAAgAAAgAAAgEABAcFBgYEAwIBBAECBAMABwIBCQICCQMCCgQCCwcEEgkGGgwHHA4IEgYEDwYEEQoDJBoLFwwEJBYJIRMJGg4JDgYDCQICBgIBBAEBAwEBAwABAwABAQEBAAABAAABAQEBAQABAAABAAAAAAAAAAAAAAACAAAEAAADAAAFBAQFAwUKAgQIAgEIAQEIAgMLAgQJAwQKAgkNAgkNAw0RBxUVCRYZDxshDxshChcaBxQXCRMXBBATAQsOAQoOAgcMAgQLAAMKAQEGAAADAAACAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAABwAABwAABgABBwABBwAABgABBgAABwACBQABAwABAwAAAwABAwABAQABAgABAwAAAwABAwICAgABAgABAwABAgAAAwABAwABAgAAAgAAAwABAgABAQAAAwABAgAAAwABAgAABQIDKTAzBQIDAwABAgAAAgAAAwAAAwABAwECDhMVBQIBBQMBBAIABAEBBQMCCgQDDgQCDQYDFg4HHxcIGw8FIg8IGw4HGg4IFA0HFAwHJRkKJR4LIhgIKBUKHBAIEQkFDQUCCQMCBwEBBAECAwEBAwABAQEBAQEBAQEDAQEBAQEAAAEAAAACAAACAAAEAQAGAQAHAQEEAQAHBgYHAgMKAgMKAwULBAcMBAoPAgoOAwwQAwsPAw0QBREUChcaDhseDRkcDhoeDRoeDBccChUYCBQXBRESBRISAgkNAQYMAAQLAgMJAAADAAABAAACAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAABgAABgABBwAABgACBgECBgABBwECBwACBwACBwACBgACBQABAgAAAwABAgAAAgAAAgAAAgAAAwABBwgLAwABAgAAAwABAwABAgAAAwABAwABAwABAgAAAwABAgAAAgAAAgAAAwECGRsaBQACAgAAAwABAwABAwABAwEBAwEBCAgHBQEDAwEBBQECCAEDCAICDQUEEggFFQwFGhMIFgwFGwwHJxQJHw8HHA8KEwkGEgoGFAoFGg8IHhEHMyIMGw8JFAkHDwcECgUDCQQDBgICBAIBAwEBAgABAwADAgADAAACAAACAQECAQIDBAEHAgEIAgIJAwUJBAUIBAQKAwUIAgQKBgcOBwsOBQwQDhUUCxQVCxQXBxEVDRgbCRMXDBYaDhgcDRcZCxYbCRYYCBUYCBIWCRUYBREVBA4UAgwRAQkNAQQMAQMJAQEFAgMDAAABAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAABwAABwAABgABBwECBwECBgEBBwABBwACBwACBwACBAABBAABAgAAAwABAwABAwABAwABAwABAgABAwABAwABAwABAwABAwABAgAAAwABAwABAgAAAgAAAwABAwABAgAAAgAAAgEBAwACAgABAgABAwABAwEBAwABAwEBAwEBAwEAAwEBAwEBBgECBwID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BwACBgACBQABAwABAwABAwABAwABAwABAwABAwABAgAAAwABAgAAAgAAAwABAwABAwABAwABAgAAAwABAgABAgABAwABAwABAwABAgAAAgAAAwABAgAAAwEBBQECBgECAwICBgQERldaEBMVCgYFCgYECwYFEAgFDAcFFgkFMBkNGgwIGw4INCMNRTcRXUQXPiwMKB4KIBgJFQsIFg4IGQ4JJhkLPiwVR05HiaCjNzIeMSoXGBQUGxcSFQ8MFgwLIxkPHRYPHRcPHRoRHBcQLygXJB8SKykYJSQTHB0WICMbHyIZOT0mLzMhKTIjKTMrJi0oKzMqLDEsJTAtLDs3KDo4Lj44IjIxHi8wHCsrGSYlHigjGiIhFhsbFxwbGiEeIiMfGBsbHBsZDhISFhQSDQ0LCQgJFhAKHhUMCAQHAgEEAQACAAAAAAABAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwAABgAABgAABwABBwABBwAABgABBgACBwACBgACBgIDAwAAAwABAgAAAwABAwABAwABAwABAgAAAwABAwABAwABAwABAgAAAwABAwABAwABAwABAwABAwABAwABAwABAwABAwABAwABAQEAAwABBAIDCAUFCAEDBAIBBwQEDRASDgwNCQYGDQYFEgkGFwsJEQgKFgoJMR4OGxAHGREKIBkKNCQNPCsRNCkMNCoOHxYJGREJHBIKKxsNMSQQMiURJyMWNzglQzkbLikUIRsTJSATHhQMIhcNJxoPPTIeKSIXHxoQMCkWTj8hLygWNDMZNTEcHyIXHiMZLjMiPkYsIysgIi0kGiQiHy4oMDgsLzgwLzw2KTk4LUA9KTk3JDQyJDIxHi4tIC0rJCwmHiUiJykiJiskNTMoIyIcGhoUHhoVFBQQGRQQCwgKDQgIFQ0JIhgLFgwLEQgGCAUEAAACAQECBw4JAQABAQEAAAAAAAAAAAAAAAAAAAABAAACAAABBwACBgABBgAABwABBgACBgACBwACBwACBwABBQABBQIBBgAABgABAgAAAwABAwABAwAAAwABAwABAwABAwAAAwAAAwABAwABAgAABAAABwEBAgAAAwABAwABAgAAAgAAAwABAgEAAgEAAwABAwABAwEBBQECCAEECAICBwQFBwQFBwYFCQUHEAgIFAoJFwsKGQ0JIBENJxkOGxEHEgkGJB8NQDQQNScRSUIdOToTLCUOLCgPNSwQLh4MOiYPMiUQNCcTT0MeUUYdUD8fNS0WIx4UMSoaLygXOy0YRDYcMSgYNy0ZNzEXVUwlPzMaJyMTODcbLTMdHyQZKC8hQk42Ii0iKzgsJzQtKTguO0Y4MjowMEE5L0A9LUE+Kj47IzMyJTUzITIxNDwzNT0zLjQqODkpNzkqQjsuNDEjMyscKSAXGxcSHRYQGBAMFAoIIhwSMjAWFQ0KFAsKCQYEAQEEAAACAAAAAAAAAQIBAAAAAAAAAAAAAAAAAAADJy5MFBkxBgABBgABBwAABwABBwACBwACBwACBwACBwAABQABBAAABgACBgABAgAAAwABAwABAwAAAgAAAgAAAwABAwAAAwAAAwABAwABAgAAAwAABgIBAgAAAwABAwABAgAAAgAAAgAAAwIBAwEBAwEBAwEBBQEBBgECCAEEBwMDBwMEBwQGCgYHDAYGDggJHhAMGgwJHxEKNiURLyYSGQ8IHw8KHBMHKyUSMC0kNy4QNS4OJiUMJB8JIxgKOisUOywRNysWQjsjZVEgUkgfaU4lRzkeMicWMycYPTkfYGU3WU8qRjweS0UjR0IfXFAjOTETKycYODcdLDIfHSQbGCAcJjAjNkIvJjIoLjwyLjktLTszO0c6NEQ+LUI9KUA+KUA/Jzc3OEY8TVBFQ0tASk8/PkEzXFI7UkoySkErOTIfOjAfJRwUGhUQEg8MEw0MHxQOGRELLSsVJxsOIRYPBAMGAQIFAAAEAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAEJyY+FRgwBgMBBgACBwACBwACBwACBgACBgABBgABBwACBQABCAMJBgABBgABAwABAwABAwABAwABAgAAAgAAAwAAAgAAAwABAwABAwABAwABAwABAwABAwABAgAAAgAAAwABAwABAwABAwEBAwEBAwEBAwABBwEDCAIDCQMFBgQECQQGCQUFDAcGCwcIFAoJGw4KHA8KIRYNJh0OGxELGQ8JIxcLHxYLHxUKMCUQLSUNRDwSKiQNJysaHhgQJyASOy4VXUgca1oiaVolUEMbW0ggRDcgNCsZSzwfSz4iUU8rVlEsbl4wTD8gY2A0bWk0UU8nQTgcQkEjLDEdHCMXHSUeKTEkPEUvNUIxNkY1MT4yLDsxYWpQMkI5KTw5JTo3MkdBM0M9RFBCSlNATFI/XVtEaWJScWdRTEozS0UuPDMeNCwcIh0VLicYIhwUGhIPGhIQIRsRQTkgPzcbKScYDggKAQAHAQAHAAADAAACAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABBgABBgACBwACBwACBwACBgACBgABBgABBgACBgEDLi5ABwACBgABAwABAwABAwABAwABAwABAwABAwAAAgAAAwABAwABAwABAgAAAwABAwABAwABAgAAAgAAAwABAwABBQECBgECBgECBAEBBgEDCAEDCAIDCQIGCQUFCQUGCgYHCwYGDQcJEQcHIRELLRkQGBILHhULKyIRKRsNODEVJBwPEwwGHxQKNzgbQj8cLCcSIBYLIBUOLSQRT0EZb2EpaF4kXVEfV0YfRDsaTkIhPjUeWUwjW1EqSEcpREAkYlQuX00nZmxBe35Ab2kzY1csWFMoNz0hJiwgJi8lJjAqOEAsUWFDRVY9MUA0LT80RlNAK0E8L0I9MEM8Pk9CTltKUVhGUldFZ19DZ1hCWFI/V1Q/TEo2T0syQj8lNSwbODAhRDcfGRcSKiIVLSIRLyEVIBkPHhUNFxALEg0MBgMJAQAHAAAEAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwACBwACBwACBwAABwACBwACBwACBwACBwABBAAABgACBgAABgABAwABAQABAgABAwAAAwABAwABAQABAwABAwABAwABAwABAQABAwAAAwAAAwABAwABAwABAwABAwABBgECBwACBwECBAECCAEDBwIDBwMECQIGCgUHCgQGCQMFCgYHEAsKEQkIHQ8MPSgSSDkaMSESJBoOIRkLLCMQGhEHEQoHIRgOIRQLMSoSOTcaMicQQS8XRUAfbWEodmwvcGgsVEogXFIlVFQoPDkbSD4dVk8mUEgpKzMiMDMgYFguV0klTEQkODsgZWk1cWIwZl4uSlIwMTclMDguMTgsPUMwUGFFSVY8Mj40Jzs1NEs/Mkc+MEZBN0dBOUc9Y2ZQYmhRb3NRe3JTY19FUlI8Q0k5PUI0QkEtPzckUkUrTEApLiUYIRoSSjoeOi4cIxkTKR4TKB0RDgsMDAkMCAYJAQAHAAAEAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABwACBwACBwACBwACBwACBwACBwACBwACBgABBgABBwACBgABBgACBwACBAABAwABAwABAgABAgABAwABAwABAwABAwABAwABAwAAAwABAwABAgABAwABBwACBwABBgABBwACBwACBwECBwEDBgECBgMEBwYGCgQFCQUGCgUGDAcIDwYGFw0KEgsJIREOSjIXSjsbIRkOHRQKHhgKJRkMGRMKDwcHGhALKB8OMiQSVUkhOioRPjEVRz0ahnMyZV4rX04edGAubG88WU4lOjAVRzkbOjkgLy0cLjMgPDYfPT4kRDshT0MmMjAeXWMyhHE4eHE3RFU2KjMqND0wSU03SlI+QE8+Pkk4PUg8KTw6PE5DOlBEPE9HRFBFPkw/VWBMU2RNRFNFZWVMU1dFRkg2SlA+TFJCdGlObVs+T0MpVEInMCYYKh8UTEchNCcWKB4SKBwTGxQMFhMKEhEMEw8PAwIGAAEFAAAHAAACAAABAAAAAAAAAAAAAAAAAQECBQoGBwACBgABBgACBwACBgABAwABBgABBgACAwABBQABBwACHBwdDwoKBwACBAABAwABAwABAgABAgABAwABAwABAwABAwABAgAABQABBQABBQABBAABBQABBwACBgABBgACBwECBwECBwEDBwECBwEDBgIEBwQECgQHDAoLCwcHDQUGDwgHGQwLHxANHQ8KOCUUNCcTMSUVKBwOGA4KIxUNIRgPGRAKJRwPHRMKMCsVZlYmNSkQMygUYlYkamUvfm8yb1onXVYkREMgYVElW04nYFgpR0YnMzciOTsmQDkjQEEnRD4jOS8eST4lYlQqiXU+kIhHVWhKN0UyPUo5T1c+SVlBS1pFPks/UldDQU1EOUtERVtOQVVOO09GWGVNW2tXTGBQUl5RY2hQV2VOW11EWmFIU1lISkw7ZFo+VE8xaVo0RDkhPDIcOzEdLSMYHhcUGRMSJR0VIx4WHhsVGhgTCQkMAwUKAAEHAAAFAAADAAABAAAAAAAAAAAAAAABAgMCBwACBgACBgACBwAABQABAQABBQABBgACAgAABAABBwACBgIBCQEBBgACBAAAAwAAAwABAwABAwAAAwAAAwABAwABAwABAgAABwACBwACBwACBwACBwAABwACBgACBwECBwABBwECBwIDCAICBgIDCAMECQIDCgUHCQYHDAgIDwYHFAkIGQsJHhAKHxAJNiIPLyIPLSANMicTEQ4LEw4LIBQNIBYNFxIJ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oqZ6kYdehoxkg5FgVlo+REc0c2hBf3pRcG1GZWpJT1k+S0wzQUApPjoiLikbFxgSCw4LBQsIAgQHAQAHAAAGAAACAAACAAACBwACBwACBwACBwACBgABAwABBgABBwACBgACBgABBAABBgABBwACBwACBgABBgAABwAABwAABwAABgAABwAABwAABgECBwEDBgEBBwEDBwECDAUEDQMDEQMEFAYJGgkJFQwMMyEbLhYMSS8ZOCsZQysYVjolXkYkU0AkQikUQCoUUTsaPS4YUUAiVj0jdVozYWE1PD0rXUsycmA4iHZEYGpJYHRaMj8vTk0ylZiCq7ypoKRyhItaqJ9dzcmQztCi4uPLztCob31eT2ZUW29ZgZV5fYdlja+fbZONbJeWmbu4v87Oo7Otka6uor64qLSplaehT4qZX5Weg7Cyh62qbpabgaCZr764qMLFgay7eaq2ep2hdJqgfZ2hhaylWpCPV4iCRnVxSXBrSnBoUXRoV3JoTnBogo1nq6Z3lI1ehY5faHRUUFpBTU00YGM+Vl9FYnNmXHRsOks8OT4qMjUnLi8fKSocGR0YDBMQBQoIAgMIAgEHAAAFAAABAAABAAACBgABBwACBwACBgACBwACBgABBgABBwACBwACBwACBwACBgACBwACBwACBgABBgAABwAABwAABwAABwAABgAABgECBwEDBwACBQIBCAEDCQIECgIDEAYGIw8KOR0RKhMNJxAKSyoZNx8SNyIYPCceKhgRRC4cUDcdcEsvdVg1XT4hUzkbWT0eSDYdaUYpZE0uWWI5Yl85eGk9nY5XkopbhZV5bIJgRFE+Yl0/l5lqno9VjHxOZGM8kY5YxMyoytawz86o19vAk6BzeItuW3ppanporKyLf5yMVIB3Y4+TjrGzpbauma2qka21mra52drftsO+XZKjbpyqrc/NkLW4b56tr7+3hbC2dKa1d6e6cJ+weJ6ua5amfZ2rbJWaXZGRX4+KT3x5RW9pWnluVWxfan5pfIt3fIp1f4tkc3xQe4VUgIZYa2tIWV8/SEw0P04/VnBxXHR1NT0wNTkqLy8hQD8qPT8rISkjGiQkBwwOAwYMAgEJAAAHAAEFAQICAAACBgAABgABBwACBgACBwACBgABBgABBwACBwACBwACBwACBgACBwACBwACBgAABwAABwAABwAABwAABwEB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a103f2w/g29FZlQtTkUnOjMiIiQdHiMfHCMdFB0bCRYXBBIUAQ4QAQYMAQMJAQAHBwACBgACBgACBwACBQABAwABBwAABwABBgABBgAABwAABwAACAAABwAACgAADAAADgEBEgUDEQUCEQUCEAUCEwcEHBQIFQoFHBAJLRwPOycVQzAaPy8eOSodSjgobk81bl9BcmhKfXVYkpJ1rKJ8iXxXanJbfIVqpKiCi4BihHZYh3tZUFZCQlJBXX9lep1/stnGvNe6hLiwfaungKqgoa+baoiKVIKIWoySZ6ymg6ipnLOwpLGroKiutri+08jO4PH2uNrkiLTLssfTt8Daq73Vs8HQtcHMnLjOtMbftdHhsNXkk77YibzUhLXWg7XdhbXhea/Xa6fOZaLEYp+9XZq2WJOoWpKmYpCgT4eVTICJQnd9U4eHWI2UpryrjKynnraodpGIU3t+boF4TGlkUn97b4mATm5nkZuBjp51doxyd4Fkk49saW5OSU84bWhEZlk0a1U0ZlAuXEkqOzEfJyMYMCogJScgGiEeFR8bDRgZAw8RAggNAQQLAQIJAAEHAwABBAABBwACBgAABgABAwABBQAABgAABwAABwAABwAACAAACAAABwAACwAADAABEQICEQUCDwQBDwMCEQUCFAoFHhULJh8RHBULHxIOJBUOSzIdU0IpOzEfPS8eQzYhclw9lIRbsq6IoraOZGFDgnxcZW9bbnlliZJwkKB5jIVorad9h4FaUWBQZId1nMCmuNrCqcGrt9rRlry3lrShjqKTfKGagqGgf6KjlL6/n7i7sLy+trW0lae4s7fE0MzbzNvvf7LUd6zQpMXXprrWsL7ZnLvZvsbZpLzUqb3Zs9DpiLrZnL/UsdLilcHbibnhirfmg7PbdavSbanKaKLCX568VJSrWJmoeqqqea+oUouUTISKSIKHQnmBWYqRobWoeZuWcI2KXIF+dYmAZnltZX9yfpSDbouCmqCFuriTrbCMoKSCl5l0ZWlKUFY4S0owXEw2c1c5XlAsQjchPjQdPi8dMishIR4cDRobCxcaChcWAQwPAAcMAAQKAQIIAAEIBAABBQABBwABBwACBgABBgABBwMDBgEABwAABwAABwAABwAACAAACQAACwAADQICDwEAEQQBEAQDDgIBEAMBGg0KGQ8IIhoOKx8UHRIMLiATNyYU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EA0QLC83g6KkFhYZDQoNCgcJCQYJBgUMBgUMBQQLBAULBQQJBQQLBQULAwULBAUMBAULBAULAgcNAgcNAwABAgAAAwABBAABBQECBAABBQABBgABBAAABAABBwACBgABBwABBgACBgAABgAABwAABwAABwAABgAABwAABgABBwEDCAEDCgEICgMIDAUKFAkJEAgKFAwMHhUOKCATGxEMHRYPJiIQKi0YKycQJB8SHBUMHBQMNDEWLjATLyANJhQJJRgLOSwTQi0SLx0MUDMWOB0NJg8JKBMKKBQLLBYKMRgKRCoVMx0PIRIJJyANLiUQJhUKNiIRQycQPSERMBYKLRUKDwMDCQEDCAADCQADCQADCQADCgADCQADCQADCQABCQABCQACCQABCQABCQAACQAACQAACQACCQACCQADCgADCgADCgEFCwEFCgIECQEECQEECAEECAEDCAEECAIECAIDCAIFCAIECQIFCQEICAMHBQMICAQICQMJDAQJCgYJDAoNDhARFRYWEREQCwgKCQYJCAkJBQULBgQMBQQLBgQLBgQMAwUKBAUMBAYMBAYMBAYKBAUMBAYMBAYMAgAAAgABAgABAwABAgABAwAACQACIRUeCQAABQABBQABBgABBgABBgACBgABBgAABgAABgAABgAABwAABwAABgABBwEDCAEDBwEFCQMGCgMGDAYJEgYIEQYHFg0LGBENGhQOFA0KIBkPMSwXPTgcLyoULSYTMSoVQzgYOTISHhEIJxkMJxwMIRUNLRUMNyAQOR0MGgoHEggHEgkHGg0IFgcEGwwHIRAKHgwHIg8HJxYJLxoLLhUKMhkMNBoLJA0IGQgFDwQDCQECCQACCQACCQAACQABCQACCAADCQACCQACCAAABwAACAACCAEBCQAACQAACAAACAAACAACCQADCgADCQADCAEDCQADCQADCQADCAEEBwIDCQIECAIECQIECQIFCAIDCQIFCQMECQIFCQEIBgMIBgMJBgMHCAMICgMJCQUICQcJCgkMCgsKDA0KCgcJCQYKBwYKBgULBgUMBgUMBQQLBQQLBAUMBAYMBAYMBAYMBQYLBAYMBQcNBQcNAgABDggNBAEAAwAAAwABBAABCQEDP0ROBQAAAwAAAQABAgABAwABBgACBQECJR4lCwABBgAABgECBwACBgECBgECBwECBwACBwEDCAIECQIFBwMFCwMFDgUHEAgJEgkJFxAMFw4KHhYQIRcONykWMB8QQC4VNCITPygUHQ0HHw8JJxgKIREIMx4NJBAJFwgFEQUFDAQDDQQGEwgHCgIECgEDDQIEDwYIEAQEFQcEGAkGFQYDIiIkDgMEDgMDDAIDDgIECQABCQAACQAACAAACQAACAAACAAACgACCQABCAAACAAACwQCCQAACQAACQAACQADCQADCQADCAADCQADCQADCAACCAIEBwIDCAIECAEEBwIDCAEEBwEDCAEECQIFCAIECAEECAIECQQGFRoRCQEHBwIIBgMIBgQHBgMJBwQICAcGCgYGCAcKCgYJCQYIBwcKCQgMBgUNBgYKBgYLBgULBQQLBQQKBAYKBAULBAULBAUMAwYMAgkNAwgOAwcOAgABDQ4QBQABAgAAAgAAAwABBAABAwABAgAAAgAAAgABAwABAwABBgACBgABIiYrCAACBwABBwACBgACBgACBgACBwACBwECBwECBwEDCAIEBwIDCAMFCQIFCwQFDAUHEgkJGxEOGQ8KFAsJFAcGFQcIFQcHEwUIEQYHDAIFDQQEEAUFDAQDDQQFCgECCQECBwIDCAEDCQEECAECCQACCAADCQAFHCEhCQECCgECCgABCgEBCwMECQABCgAACgABCAIBCgAACQAACQAACQAACQAABwAABwAACQAACAAABwAACAAABwAACQAACAAABwABBwACBwEDBwEDBwACBwACBwABBwEBBwIDBwECBwEDBwECCAECCAEDCAEEDgkOCQIFCAIECAIFCAEHBwEFBwIHBgIHBgIHBgMHBgMIBgMIBwQIBwUGCggODxMXBwYJBwUHBQYIBggKBgQMCgwNBgoKBQQLBgUMBQQLAwcMAwYKBAYLBQYMBAYMAwYMBAcNBAcNAgABAgAAAgAAAgAAAgAAAwICAgAAAwABAwABAwABAwABAwABAwABBwACBQABBgAABQABBgABBwACBgACBwACBwACBwACBgACBgEBBgECBgECBwEDBwEDCAEDBwMDCAMECgQECgQICQQFCQMHCQIICQIIBwIIBgMKCQcJBQIDCAEEBwMECQIEBwIEBwEDBwIDBgECCAEDCQECCAECCgADCQACCAABCQEDCQAACQAACQAACgEBCQAACgAACgAACgAACAAACQAACQAACQAACAAABwAABwAABwAABwAACAAABwAACAAACAAABwAABwABBQICBwACBgECBwEDBgECBwACBgMCBQEBBgICBgEDBwECBgECBwEDBwEECAEDHCAnCQUKCAEECAEGCQEICAEGCAEHBQMHBQMGBgMGBgMJBgMHBgMHBgMHBgQIBgUHBgQJBAUIBgUIBQUIBgQJBQcJBQQKBQQLBQQLBQQLBQQLBQULBQYMAwYMBAYMBQYLBQYNBQcNAwABAwABAgAAAgAAAgABAQAAAwABAgAAAgAAAgAAAgAAAgAAAwABAwABAwABAgAAAgABAwABAwABAwABBAABBwACBgAABgABBwACBgEBBwAABgECBwACBwECCAEDBwEDCgMDCAEFCAEGCQIGCAEGCAEGBwEEBwAHCAIHBgAEBwECBwMEBgECBgEBBwEDCAEDCAEDCAABCQAACAAACAAACQAACAAACAAABwAACAAACAAACgAACgAACgABCAAACAAABwAACQAACQAACQAACAAACAAACQAACQAABwAABwAABwAABwAABgAABgAABgABBgECBwIBBwIDBgIDBwEDBwIDBgECBgECBwEDBwEDBwEDBwIDCAEDBwEDBwEDCAIECAIEBwEDBwEDCAEHBQMEBwEFBQIGBwIHBgMIBwQIBgMIBgQIBgMHBgQJBQUHBAQLBQQLBQQLBQQLBgQLBQQLBQQLBQQLBQQLBgUMBAcJAwYLBAcLAgcNBAYNAwcOAwcNAgcOAwABAwABAgAAAgAAAgAAAgAAAwABAwABAgAAAgAAAgAAAgAAAwABAwABAwABAgAAAQABAwABAwABBAEBCAUEBQABBgABBwACBQABBQABBgAABgAABwABBwABBwABBgEBBwECBwEEBwEEBwEDBwEDBgADBgACBwAEBwEEBgECBgECBgACBgECBgECBwEBBwABBwABCAABCAAABwEBCAEBCQAACQAACQAACQAACAAACAAACQAACQAABgEBCAAACAAACQAACQAACQAACAAABwAABwAACAAACAAABwAABwAABwAABgAABwECBgAABgMBBwABBwEDBwIDBwEDBgECBwECBgACBwEDBwEDBwECBgECBwECBwEDCAEDBwIECAIECAEECAIECAEGBwEGBAIEBQMFBgUGBgIGBQIHBQMHBgMIBgMIBgMHBQMIBQQIBQQLBQQLBQQLBQMLBQQLBQQLBQQLBQQLBQQMBQUMBAYKBQsKBQcLAwcNBAYMAwcNAggOAggOAwABAwABAwABAwABAwABAgAAAgAAAwABAgAAAgAAAgAAAwABAgAAAgAAAwABAwABAwABAgAAAwAAAwEABQABBAABBgABBgACAgABBAAABgAABwAABwAABwAABgAABgAABgECBwECBwEDBwACBwECBgEBBgICBgEBBwECBwABBwAABgABBwECBwIDBwAABwAACAAABwEACgUDBwEBBwAACAAACQAACQAABwAACAAACAAACQAACAAACAABCAAACAAABwAACQAACAAACAAABwAABwAABwAABwAABwAABgAABgAABgAACgYKBgEBBwEABgAABgECBgECBgECBgIDBwECBgECBwECBwECBwECBwECBwACBwEDBwEDCAEEBwIDCAIECAEFCgUIBQQEBQIHBAEGBQIHBQIGBQIGBQMHBQMHBgMIBgMHBQIHBgMJBQMKBQQLBAIKBQQLBQQLBQQLBQQLBgUMBAULBAYLBAUMBAYMBQYNBQcMBQcNAgcOAggOAwgOAgAAAgAAAwABAQABAwAAAgAAAwAABQAAAwABAwABAgAAAwABAgAAAgAAAgAAAwABAwABAgAAAwAAAgABAwAABQIEBAEBAwAAAgABAwABBgABCAACCAEABwAABgAABgABBwAABwAABwAABgECBwACBgABBgAABgAABwAABwAABwAABgAABwAABwAABwAABwAABwAABwAABwAABgAABgAACAAACQAABwAACAAABwAABwAABwAABgAABgAABwAACAAACAAACAAAHxwdCQAABwAABwAABwAABwAABgAABgAABgAABgABBgABBgAABgABBgABBgACBgECBgECBgIDBwECBwECBgICBwACBQICBwECBwEDBwECBwEDBwEDBwECBwIDCAEFBwIEBQMFBQIGBQIGBQIHBQQGBgMGBQIGBgMIBgMJBQMHBQMIBAUIBQMLBQQLBQQLBAQKBQULBgQMBQQLAwULAwUKBAULBAYMBAcMCQ4VChMXAwcNAwcOAwkODBYWAwABAwABAgAAAQAABAABAwABAgABBAAAAgAAAgAAAwABAwAAAwABAwABAQABAgABAgAAAgAAAwABAwABAgAAAwEAAQEAAgAAAwABAwABBgABCAQFDgkJBQAABgAABwABBgAABgAABgAABgABBgACBgACBgAABgAABwAABgAABgAABwAABwAABwAABgAABwAABwAABwAABgEABwIBBwACCAAACAAACAAABgAABQEABwAABgAABwAABwAABgAABwAACAAACAAADxENCAAABgAABgAABwAABwAABwAABwAABwAABwABBgABBwAABwABBwACBwACBgECBwACBwECBwECBgECBgECBwIDBwEDBwECBwEDBwADBwEDBwECCAEEBwIEBwIEBgEFBAIEBAEGBQIHBQMGBgMGBgMIBQIHBQIGBgQIBQMIBgMIBQQJBQQLBQQLBQQLBQQLBQULBQQLBQULBAYLBAUMBAUMBAYMAwYLBAcNAwcNAwcNAgcNAwgOBAoNAwABAgAAAwABAwAAAwABAwABAgAAAwABAQAAAgAAAwAAAwABAgABAgABAwABAwABAwABAwAAAwAAAgABAwABAwABAwABAwEBAwAAAwABAwABBgABBgABBgECCQMDBgAABgAABgABBQABBgEBBQABBgACBgAABgAABwAABwAABwAABwAABwAABwAABwAADgYBCAAABwAABgAABgAABwAABwAABwAABwAABgAABwAABgAABgEBBwAABwAABgAABgAABQIBBwEABgAABwAABwAABwAABwAABwAABgACBwACBwACBwAABQABBgECBgECBgACBwACBgABBwECBwEDBwACBgEBBgECBgEDBwEDCAMCCwUGBwIFCAEEBwAGBQEGBAIGBwIEBQIDBAIFBQEGBQIGBQIGBQIHBQIIBQMHBQQHBAQHBgMKBgQLBQMLBQQLBQQLBQQLBQQLBQQLBQQLBQQLBAUMBAULBAYMBQYMBAUMBQYNBQYMBAYNAQcNAggNAwgNAwABAgAAAgABAwAAAwABAwABAgAAAwABAQAAAgAAAwAAAwABAgABAgABAgAAAgAAAwABAwAAAwAAAgABAwABAwABAwAAAgABAgAAAwABAwABBAABBAABBgABBgAABgAABgACBgABBgABBgABBgABBwACBwABBwABBwABBwABBwAABQEABgEBBwAACAAAEAoCBwAABwAABwAABwABBgABBgABBwAABwAABgABBwAABgAABQAABgAABwAABwAABwAABgAABwAABgAABwAABgAABwAABwAABwAABgACBwACBwACBwABBgABBgABBgECBgACBwECBgABBgABBwECBgECBgECBwACBgEDBwEDDAcKTFtbCAMECQIEBgEEBgIFBQIGBAIGBAMFBgIHBAEGBQIHBQIHBgMHBgMJBwQJBQMHBQUHBgQJBgMKBAMKBQQLBQQLBAMLBAMLBQQLBQQLBQQLBAYLBAYMBAYMBAYMBQYMBQYMBAcOAwcNAgcNAwgOBAgOAwABAwABAwABAQABAwABAwABAwABAwABAgAAAgAAAgAAAQABAwABAgAAAgAAAgAAAwABAwABAwABAwABAwABAgAAAQABAgABAwABAwABAwABAwABAwABBwACBwABBwABBgACBgACBwACBgACBwACBwACBwAABwABBwACBgACBgABBAABAwEABgAABwAACAEBBgABBgAABwAABwABBgACBgACBwAABwAABwACBgABBwAABwAABwAABwAABwAABwAABwAABwAABwAABwAABgAABwAABwAABwAABwACBwACBwACBgACBwABBwECBwECBgECBwECBgACBgACBwECBgECBgECBgECBwIDBwEBBgICCAQGBwIECAIFDQQMGBYhBwMFBQIGBQIGBQIHBQIGBQIHBQIHBgMJCAUJCQcNBwQKBQQHBgQHBgMJBQQLBQQLBQQLAwQLBQQLBQQLBQQLBQQLBAUMBAYMBAUMBAUMBQYNBQcNAgcNAggNAggPAwgOAwgN';
	var fotoCaranguejo = new Float32Array(FOTO_N * FOTO_N * 3);
	(function () {
		var bin = atob(FOTO_CARANGUEJO), n = FOTO_N * FOTO_N * 3, bruto = new Float32Array(n), i;
		for (i = 0; i < n; i++) bruto[i] = bin.charCodeAt(i) / 255;
		// realça os fiapos: cada pixel fica mais diferente da média em volta dele
		function borrado(raio) {
			var saida = new Float32Array(n);
			for (var y = 0; y < FOTO_N; y++) for (var x = 0; x < FOTO_N; x++) for (var c = 0; c < 3; c++) {
				var s = 0, q = 0;
				for (var dy = -raio; dy <= raio; dy++) for (var dx = -raio; dx <= raio; dx++) {
					var xx = x + dx, yy = y + dy;
					if (xx < 0 || yy < 0 || xx >= FOTO_N || yy >= FOTO_N) continue;
					s += bruto[(yy * FOTO_N + xx) * 3 + c]; q++;
				}
				saida[(y * FOTO_N + x) * 3 + c] = s / q;
			}
			return saida;
		}
		var largo = borrado(4), fino = borrado(1);
		for (i = 0; i < n; i++) fotoCaranguejo[i] = Math.max(0, bruto[i] + (bruto[i] - largo[i]) * 0.9 + (bruto[i] - fino[i]) * 0.5);
	})();
	function corDaFotoCaranguejo(u, v, saida) {
		var fx = Math.max(0, Math.min(FOTO_N - 1.001, u * FOTO_N - 0.5)), fy = Math.max(0, Math.min(FOTO_N - 1.001, v * FOTO_N - 0.5));
		var x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
		for (var c = 0; c < 3; c++) {
			var a = fotoCaranguejo[(y0 * FOTO_N + x0) * 3 + c], b = fotoCaranguejo[(y0 * FOTO_N + x0 + 1) * 3 + c];
			var d = fotoCaranguejo[((y0 + 1) * FOTO_N + x0) * 3 + c], e = fotoCaranguejo[((y0 + 1) * FOTO_N + x0 + 1) * 3 + c];
			saida[c] = (a + (b - a) * ax) + ((d + (e - d) * ax) - (a + (b - a) * ax)) * ay;
		}
	}
	var luzCaranguejo = new Float32Array(TAM * TAM * 3), corCaranguejo = [0, 0, 0], estrelasCaranguejo = estrelinhas(67, 70);
	// as estrelas mais fortes da foto, nos lugares delas
	var GRANDES_CARANGUEJO = [[0.53, 0.1], [0.04, 0.09], [0.88, 0.71], [0.86, 0.86], [0.59, 0.81], [0.33, 0.1], [0.92, 0.27]];
	var PULSAR = [0.5, 0.53];
	function caranguejo(buf, t) {
		var tt = t * 0.035;
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = (x + 0.5) / TAM, v = (y + 0.5) / TAM;
			var wx = fbm(u * 3 + 3, v * 3, tt, 3) - 0.5, wy = fbm(u * 3, v * 3 + 7, tt, 3) - 0.5;
			corDaFotoCaranguejo(u + wx * 0.006, v + wy * 0.006, corCaranguejo);
			var r = corCaranguejo[0], g = corCaranguejo[1], b = corCaranguejo[2];
			// fiapos finos por cima (a foto reduzida perde os fiapinhos de verdade)
			var fiapo = Math.pow(1 - Math.abs(2 * fbm(u * 14 + wx + 20, v * 14 + wy, tt * 0.9, 3) - 1), 7);
			var textura = fbm(u * 9 + 4, v * 9, tt, 3);
			// tira o fundo escuro da foto (vira transparente) e realça o resto
			var lum = Math.max(r, g, b), sobra = Math.max(0, lum - 0.07) / Math.max(0.001, lum);
			var ganho = 1.45 * sobra * (0.85 + textura * 0.2 + fiapo * 0.35);
			r *= ganho; g *= ganho; b *= ganho;
			// só um pouquinho mais de cor: na foto as cores são suaves (azul bem claro no miolo,
			// verde-oliva, dourado e ferrugem nos fiapos), e mais que isso vira neon
			// (o posterizar já deixa os tons médios mais vivos, então aqui a cor diminui um pouco)
			var media = (r + g + b) / 3, sat = 0.95;
			r = media + (r - media) * sat; g = media + (g - media) * sat; b = media + (b - media) * sat;
			// o miolo mais claro fica azul bem clarinho (sem estourar no branco)
			var topo = Math.max(r, g, b), branco = Math.max(0, Math.min(1, (topo - 0.62) / 0.5)) * 0.3;
			r += (topo * 0.94 - r) * branco; g += (topo * 0.97 - g) * branco; b += (topo - b) * branco;
			var k = (y * TAM + x) * 3;
			luzCaranguejo[k] = Math.max(0, r); luzCaranguejo[k + 1] = Math.max(0, g); luzCaranguejo[k + 2] = Math.max(0, b);
		}
		posterizar(buf, luzCaranguejo);
		pintarEstrelinhas(buf, estrelasCaranguejo, t);
		// as estrelas grandes da foto, com pontinhas
		GRANDES_CARANGUEJO.forEach(function (e, n) {
			var ex = Math.round(e[0] * TAM), ey = Math.round(e[1] * TAM), br = calmo ? 1 : 0.85 + 0.15 * Math.sin(t * 1.5 + n);
			buf[ey * TAM + ex] = maisClaro(buf[ey * TAM + ex], 255 * br, 255 * br, 255 * br);
			[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var k2 = (ey + d[1]) * TAM + ex + d[0]; buf[k2] = maisClaro(buf[k2], 170 * br, 200 * br, 255 * br); });
		});
		// o pulsar, no meio da fumaça azul: um ponto branco que pisca (ele gira 30 vezes por
		// segundo; aqui pisca a cada quadro) com um anelzinho fraco em volta
		var px = Math.round(PULSAR[0] * TAM), py = Math.round(PULSAR[1] * TAM), aceso = calmo || Math.floor(t * 12) % 2 === 0;
		for (var a = 0; a < Math.PI * 2; a += 0.2) {
			if ((a * 5 | 0) % 2) continue;
			var ax = Math.round(px + Math.cos(a) * 4), ay = Math.round(py + Math.sin(a) * 2.6);
			buf[ay * TAM + ax] = maisClaro(buf[ay * TAM + ax], 150, 180, 240);
		}
		var bp = aceso ? 255 : 175;
		[[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d, i) { var k3 = (py + d[1]) * TAM + px + d[0]; buf[k3] = maisClaro(buf[k3], i ? bp * 0.8 : bp, i ? bp * 0.88 : bp, bp); });
	}

	// ---------- Proxima Centauri: a anã vermelha mais perto do Sol, e o planeta dela ----------
	// Uma estrela vermelha grande, fervendo, com manchas escuras e uma explosão de luz (um "flare")
	// saindo da beirada; na frente, à esquerda, o planeta Proxima b, iluminado só do lado virado
	// para a estrela (ele tem um lado sempre de dia e um sempre de noite). Lá longe, em cima, as
	// duas irmãs amarelas: Alfa Centauri A e B.
	var luzProxima = new Float32Array(TAM * TAM * 3), estrelasProxima = estrelinhas(71, 70);
	var RAMPA_ANA = [[0, [0.3, 0.04, 0.03]], [0.3, [0.66, 0.1, 0.05]], [0.55, [0.95, 0.28, 0.08]], [0.78, [1, 0.5, 0.2]], [1, [1, 0.78, 0.5]]];
	var PROX = [0.6, 0.47, 0.3], PLANETA_B = [0.25, 0.73, 0.1];
	var ALCA = [-0.8, 0.075]; // a alça da explosão de luz: direção (ângulo) e meia largura
	function proxima(buf, t) {
		var tt = t * 0.05, chama = calmo ? 0.6 : 0.5 + 0.5 * Math.sin(t * 0.7);
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var u = (x + 0.5) / TAM, v = (y + 0.5) / TAM, du = u - PROX[0], dv = v - PROX[1], r = Math.hypot(du, dv), R = 0, G = 0, B = 0;
			if (r < PROX[2]) {
				var mu = Math.sqrt(1 - (r / PROX[2]) * (r / PROX[2]));
				var gr = fbm(du * 14 + 5, dv * 14, tt, 4), mancha = Math.max(0, 0.36 - fbm(du * 4 + 40, dv * 4, tt * 0.5, 3)) * 2.4;
				var val = (0.28 + mu * 0.62) * (0.7 + gr * 0.55) - mancha * 0.35 * mu;
				var c = rampa(RAMPA_ANA, Math.max(0, Math.min(1, val)));
				var b = 0.55 + val * 0.75;
				R = c[0] * b; G = c[1] * b; B = c[2] * b;
			} else {
				// o brilho vermelho em volta
				var fora = r - PROX[2];
				var halo = Math.exp(-fora / 0.035) * 0.55 + Math.exp(-fora / 0.12) * 0.12;
				R = halo * 0.95; G = halo * 0.22; B = halo * 0.12;
			}
			// a explosão de luz: uma alça de gás quente saindo da beirada, em cima à direita, e
			// voltando para ela (como as proeminências do Sol). É gás, então é meio desfiada e
			// irregular, mais forte perto dos pés e mais fraca no alto; ela sobe e desce devagar
			var da = Math.atan2(dv, du) - ALCA[0];
			da = Math.atan2(Math.sin(da), Math.cos(da));
			var tang = da * PROX[2], alt = r - PROX[2], H = 0.055 + 0.025 * chama;
			if (Math.abs(tang) < ALCA[1] * 1.6 && alt > -0.02 && alt < H * 1.6) {
				var torto = (fbm(tang * 30 + 3, alt * 30, tt * 3, 3) - 0.5) * 0.35;
				var ell = Math.sqrt(Math.pow(tang / ALCA[1], 2) + Math.pow(Math.max(0, alt) / H, 2)) + torto;
				var fio = Math.exp(-Math.pow((ell - 1) / 0.2, 2)) * (alt > 0 ? 1 : 0.6);
				var fiapos = 0.45 + fbm(u * 30 + 7, v * 30, tt * 4, 3) * 0.8, pe = 1 + Math.exp(-alt / 0.015) * 0.6;
				var luzA = fio * fiapos * pe * 0.95 + (ell < 1 && alt > 0 ? (1 - ell) * 0.12 : 0);
				R += luzA * 1.1; G += luzA * (0.45 + fio * 0.3); B += luzA * 0.18;
			}
			var k = (y * TAM + x) * 3;
			luzProxima[k] = R; luzProxima[k + 1] = G; luzProxima[k + 2] = B;
		}
		posterizar(buf, luzProxima);
		pintarEstrelinhas(buf, estrelasProxima, t);
		// Alfa Centauri A e B, longe, em cima à esquerda: duas estrelas amarelas com pontinhas
		[[0.17, 0.16, [255, 236, 170], 4], [0.215, 0.185, [255, 205, 140], 3]].forEach(function (e) {
			var ex = Math.round(e[0] * TAM), ey = Math.round(e[1] * TAM);
			for (var p = 1; p <= e[3]; p++) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var f = 1 - p / (e[3] + 1), k2 = (ey + d[1] * p) * TAM + ex + d[0] * p; buf[k2] = maisClaro(buf[k2], e[2][0] * f, e[2][1] * f, e[2][2] * f); });
			buf[ey * TAM + ex] = cor(255, 255, 240);
		});
		// o planeta Proxima b: rochoso, meio avermelhado, com o lado da estrela (direita, em cima)
		// iluminado e o resto no escuro, e uma beirada fininha de atmosfera
		var pcx = PLANETA_B[0] * TAM, pcy = PLANETA_B[1] * TAM, pr = PLANETA_B[2] * TAM;
		var lx = PROX[0] - PLANETA_B[0], ly = PROX[1] - PLANETA_B[1], ln = Math.hypot(lx, ly); lx /= ln; ly /= ln;
		var ROCHA = [[236, 176, 140], [196, 124, 98], [150, 84, 72], [104, 56, 58], [74, 42, 54], [52, 32, 50]]; // (o lado da noite fica escuro, mas não preto)
		for (var py = Math.floor(pcy - pr - 1); py <= pcy + pr + 1; py++) for (var px = Math.floor(pcx - pr - 1); px <= pcx + pr + 1; px++) {
			var dx = (px + 0.5 - pcx) / pr, dy = (py + 0.5 - pcy) / pr, d2 = dx * dx + dy * dy;
			if (px < 0 || py < 0 || px >= TAM || py >= TAM) continue;
			var kp = py * TAM + px;
			if (d2 > 1) {
				// a atmosfera, só no lado iluminado
				if (d2 < 1.28 && dx * lx + dy * ly > 0.2) buf[kp] = maisClaro(buf[kp], 200, 110, 90);
				continue;
			}
			// metade de dia (clara) e metade de noite (escura), com a linha entre elas pontilhada
			var luz = dx * lx + dy * ly, tex = fbm(dx * 3 + 7, dy * 3, 0, 3);
			var n = Math.floor((0.45 - luz) * 3.6 + (0.5 - tex) * 1.1 + LIMIAR4[(px & 3) + ((py & 3) << 2)] * 0.9);
			var cr = ROCHA[Math.max(0, Math.min(ROCHA.length - 1, n))];
			buf[kp] = cor(cr[0], cr[1], cr[2]);
		}
	}

	var ARTES = { 'buraco-negro': buracoNegro, 'orion': orion, 'omega': omega, 'helice': helice, 'pleiades': pleiades, 'tabby': tabby, 'tabby-alien': tabbyAlien, 'fermi': fermi, 'betelgeuse': betelgeuse, 'eta-carinae': etaCarinae, 'sirius': sirius, 'caranguejo': caranguejo, 'proxima': proxima };

	// Sem "quadrado" em volta: o fundo escuro vira transparente e a borda da arte
	// se dissolve num pontilhado (a 4 tons), como numa pixel art feita à mão.
	var FUNDO = hex('#05030c');
	// redonda (buraco negro e aglomerado) ou quadro de cantos arredondados (Órion, que é uma foto "cheia")
	function fazerMascara(potencia, inicio) {
		var m = new Uint8Array(TAM * TAM), limiar = [0, 0.5, 0.75, 0.25];
		for (var y = 0; y < TAM; y++) for (var x = 0; x < TAM; x++) {
			var dx = Math.abs((x + 0.5 - TAM / 2) / (TAM / 2)), dy = Math.abs((y + 0.5 - TAM / 2) / (TAM / 2));
			var d = Math.pow(Math.pow(dx, potencia) + Math.pow(dy, potencia), 1 / potencia);
			var v = 1 - (d - inicio) / (0.98 - inicio); // 1 dentro, 0 na borda
			m[y * TAM + x] = v > limiar[(x & 1) + ((y & 1) << 1)] ? 1 : 0;
		}
		return m;
	}
	var MASCARAS = { redonda: fazerMascara(2, 0.72), quadro: fazerMascara(5, 0.82) };
	function recortar(buf, mascara) {
		for (var i = 0; i < buf.length; i++) if (!mascara[i] || buf[i] === FUNDO) buf[i] = 0;
	}

	// ---------- Animação ----------
	var telas = [];
	document.querySelectorAll('canvas.arte-destino').forEach(function (tela) {
		var desenhar = ARTES[tela.getAttribute('data-arte')];
		if (!desenhar) return;
		tela.width = TAM;
		tela.height = TAM;
		var ctx = tela.getContext('2d');
		var img = ctx.createImageData(TAM, TAM);
		var item = { tela: tela, ctx: ctx, img: img, buf: new Uint32Array(img.data.buffer), desenhar: desenhar, visivel: true,
			mascara: /^(omega|betelgeuse)$/.test(tela.getAttribute('data-arte')) ? MASCARAS.redonda : MASCARAS.quadro };
		telas.push(item);
		if ('IntersectionObserver' in window) {
			new IntersectionObserver(function (e) { item.visivel = e[0].isIntersecting; }).observe(tela);
		}
		item.desenhar(item.buf, 0);
		recortar(item.buf, item.mascara);
		item.ctx.putImageData(item.img, 0, 0);
	});
	// redesenha na hora (usado pelas abas, inclusive quando as animações estão desligadas)
	window.redesenharArtes = function () {
		var t = (performance.now() - (window.__inicioArtes || 0)) / 1000;
		telas.forEach(function (it) {
			it.desenhar = ARTES[it.tela.getAttribute('data-arte')] || it.desenhar;
			it.desenhar(it.buf, calmo ? 0 : t);
			recortar(it.buf, it.mascara);
			it.ctx.putImageData(it.img, 0, 0);
		});
	};
	if (!telas.length || calmo) return;

	var inicio = performance.now(), anterior = 0;
	function laco(agora) {
		if (agora - anterior > 1000 / 12) { // 12 quadros por segundo
			anterior = agora;
			var t = (agora - inicio) / 1000;
			telas.forEach(function (it) {
				if (!it.visivel) return;
				it.desenhar = ARTES[it.tela.getAttribute('data-arte')] || it.desenhar; // permite trocar de arte (abas)
				it.desenhar(it.buf, t);
				recortar(it.buf, it.mascara);
				it.ctx.putImageData(it.img, 0, 0);
			});
		}
		requestAnimationFrame(laco);
	}
	requestAnimationFrame(laco);
})();
