// Agência Andarilha: o símbolo e o selo da agência de turismo espacial.
//
// O símbolo é pixel art de 32 x 32 (um planeta com anel de órbita e a nave passando),
// desenhado aqui mesmo, em SVG, para ficar nítido em qualquer tamanho. Ele aparece no topo
// das páginas (junto do nome) e vira o ícone da aba. O selo é o símbolo com o nome da
// agência em volta, como os selos das agências de viagem antigas: fica na página inicial,
// antes da decolagem. "Desde 2077" é de propósito: a agência ainda vai existir.
(function () {
	var N = 32;
	var B4 = [0, 0.5, 0.75, 0.25]; // pontilhado 2 x 2

	// a grade de pixels do símbolo: cada célula guarda uma cor (ou nada)
	function pixels() {
		var g = [], x, y;
		for (y = 0; y < N; y++) { g.push([]); for (x = 0; x < N; x++) g[y].push(null); }
		function pinta(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < N && y < N && dentro(x, y)) g[y][x] = c; }
		function dist(x, y) { var dx = x + 0.5 - N / 2, dy = y + 0.5 - N / 2; return Math.sqrt(dx * dx + dy * dy); }
		function dentro(x, y) { return dist(x, y) < 13.2; }
		// o medalhão: aro dourado (mais escuro embaixo, à direita), um filete escuro e o céu
		for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
			var d = dist(x, y);
			if (d >= 15.6) continue;
			if (d >= 14.2) g[y][x] = x + y > 33 ? '#b0863a' : '#e8c46a';
			else if (d >= 13.2) g[y][x] = '#0a0718';
			else g[y][x] = y < 10 ? '#1a1240' : '#160f33';
		}
		// estrelinhas no céu
		[[8, 8, '#ffffff'], [25, 21, '#cdf1ff'], [7, 23, '#ffd9f2'], [14, 5, '#cdf1ff'], [27, 14, '#ffffff']].forEach(function (s) { pinta(s[0], s[1], s[2]); });
		pinta(10, 13, '#8fd3fa'); pinta(9, 13, '#4f72d6'); pinta(11, 13, '#4f72d6'); pinta(10, 12, '#4f72d6'); pinta(10, 14, '#4f72d6'); // uma cintilante
		// o planeta, iluminado de cima à direita (rosa e laranja, como as nebulosas da galáxia)
		var PLANETA = ['#ffd2a0', '#ff9a7a', '#e0607a', '#a83a72', '#5e2260'];
		var pcx = 13.5, pcy = 18.5, pr = 6.4;
		function noPlaneta(x, y) { var dx = x + 0.5 - pcx, dy = y + 0.5 - pcy; return dx * dx + dy * dy < pr * pr; }
		for (y = 0; y < N; y++) for (x = 0; x < N; x++) {
			if (!noPlaneta(x, y)) continue;
			var nx = (x + 0.5 - pcx) / pr, ny = (y + 0.5 - pcy) / pr, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
			var luz = nx * 0.55 - ny * 0.55 + nz * 0.6;
			var nivel = Math.max(0, Math.min(4, Math.floor((1 - luz) * 2.6 + B4[(x & 1) + ((y & 1) << 1)])));
			pinta(x, y, PLANETA[nivel]);
		}
		// a órbita: uma elipse inclinada; a metade de trás some atrás do planeta
		var cs = Math.cos(-0.32), sn = Math.sin(-0.32);
		for (var a = 0; a < Math.PI * 2; a += 0.012) {
			var ex = Math.cos(a) * 12.2, ey = Math.sin(a) * 4.2;
			var ox = 15.5 + ex * cs - ey * sn, oy = 18 + ex * sn + ey * cs;
			var atras = Math.sin(a) < 0;
			if (atras && noPlaneta(Math.floor(ox), Math.floor(oy))) continue;
			pinta(ox - 0.5, oy - 0.5, atras ? '#3f8fa8' : '#7fe3ff');
		}
		// a nave (a mesma da viagem, vista de cima): disco com as duas pontas para a frente,
		// a cabine do lado e o motor aceso atrás, subindo pela órbita
		var NAVE = [
			'..###...',
			'.#####..',
			'###o####',
			'####....',
			'###o####',
			'.#####..',
			'..###...'
		];
		var nx0 = 18, ny0 = 4;
		NAVE.forEach(function (linha, j) {
			for (var i = 0; i < linha.length; i++) {
				var c = linha[i];
				if (c === '.') continue;
				pinta(nx0 + i, ny0 + j, c === 'o' ? '#7fe3ff' : (j < 3 ? '#eef1fb' : '#aab3d6'));
			}
		});
		pinta(nx0 + 2, ny0 + 3, '#5a6390'); // o miolo do disco
		// o rastro do motor, pontilhado
		[[16, 7, '#7fe3ff'], [15, 7, '#7fe3ff'], [13, 7, '#4f72d6'], [11, 8, '#3b2a86']].forEach(function (p) { pinta(p[0], p[1], p[2]); });
		return g;
	}

	// a grade vira retângulos de SVG (cada linha junta os pixels vizinhos da mesma cor)
	var GRADE = pixels();
	function retangulos() {
		var s = '';
		GRADE.forEach(function (linha, y) {
			for (var x = 0; x < N;) {
				var c = linha[x];
				if (!c) { x++; continue; }
				var x2 = x;
				while (x2 < N && linha[x2] === c) x2++;
				s += '<rect x="' + x + '" y="' + y + '" width="' + (x2 - x) + '" height="1" fill="' + c + '"/>';
				x = x2;
			}
		});
		return s;
	}
	var RETS = retangulos();

	function simbolo(classe) {
		return '<svg class="' + (classe || 'simbolo-agencia') + '" viewBox="0 0 32 32" shape-rendering="crispEdges" aria-hidden="true">' + RETS + '</svg>';
	}

	// o selo: o símbolo no meio e o nome da agência em volta, entre dois aros
	function estrela(cx, cy) {
		return '<rect x="' + (cx - 1) + '" y="' + (cy - 4) + '" width="2" height="8"/><rect x="' + (cx - 4) + '" y="' + (cy - 1) + '" width="8" height="2"/>';
	}
	function selo() {
		return '<svg class="selo-svg" viewBox="0 0 200 200" aria-hidden="true">' +
			'<defs>' +
				'<path id="selo-cima" d="M 24 100 A 76 76 0 0 1 176 100"/>' +
				'<path id="selo-baixo" d="M 15 100 A 85 85 0 0 0 185 100"/>' +
			'</defs>' +
			'<circle cx="100" cy="100" r="97" class="selo-aro"/>' +
			'<circle cx="100" cy="100" r="93" class="selo-aro fino"/>' +
			'<circle cx="100" cy="100" r="66" class="selo-aro fino"/>' +
			'<text class="selo-nome"><textPath href="#selo-cima" startOffset="50%" text-anchor="middle">Agência Andarilha</textPath></text>' +
			'<text class="selo-lema"><textPath href="#selo-baixo" startOffset="50%" text-anchor="middle">Turismo espacial · desde 2077</textPath></text>' +
			'<g class="selo-estrelas" shape-rendering="crispEdges">' + estrela(14, 100) + estrela(186, 100) + '</g>' +
			'<g transform="translate(40 40) scale(3.75)" shape-rendering="crispEdges">' + RETS + '</g>' +
			'</svg>';
	}
	window.Andarilha = { simbolo: simbolo, selo: selo };

	// o símbolo no topo das páginas, antes do nome
	document.querySelectorAll('.marca').forEach(function (m) { m.insertAdjacentHTML('afterbegin', simbolo('marca-simbolo')); });
	// e o selo na página inicial
	var lugarSelo = document.getElementById('selo-agencia');
	if (lugarSelo) lugarSelo.innerHTML = selo();

	// a assinatura da autora, discreta, no pé de todas as páginas
	var credito = document.createElement('p');
	credito.className = 'credito-autora';
	credito.textContent = 'por Bianca Cardador';
	document.body.appendChild(credito);

	// o ícone da aba
	try {
		var icone = document.createElement('link');
		icone.rel = 'icon';
		icone.type = 'image/svg+xml';
		icone.href = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" shape-rendering="crispEdges">' + RETS + '</svg>');
		document.head.appendChild(icone);
	} catch (e) {}
})();
