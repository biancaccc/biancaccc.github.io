// Visuais das seções de texto (em teste na página de Urano):
//  - ícones em pixel art nos títulos e nas caixinhas "isso é como…";
//  - mini animações em pixel art explicando a ideia de uma seção;
//  - linha do tempo que acende conforme a página rola;
//  - calculadoras (idade no planeta e tempo de viagem até lá);
//  - quiz no fim da página, que dá um selo especial no passaporte.
// Em Urano tudo está escrito no HTML da página (atributos data-...). Nos outros planetas,
// os dados ficam em visuais-dados.js e este arquivo monta o HTML primeiro (montarDaPagina).
(function () {
	'use strict';
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ---------- Montar os visuais a partir dos dados (visuais-dados.js) ----------
	var pagina = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
	var DADOS = window.VISUAIS_DADOS && window.VISUAIS_DADOS[pagina];
	if (DADOS) montarDaPagina(DADOS);
	function montarDaPagina(D) {
		var conteudo = document.querySelector('.conteudo');
		if (!conteudo) return;
		function el(tag, classe, html) { var e = document.createElement(tag); if (classe) e.className = classe; if (html) e.innerHTML = html; return e; }
		// visores ao lado do texto
		Object.keys(D.visores || {}).forEach(function (n) {
			var sec = document.getElementById('secao-' + n), ps = sec ? sec.querySelectorAll(':scope > p') : [];
			if (!ps.length) return;
			var v = D.visores[n], corpo = el('div', 'bloco-corpo'), texto = el('div', 'bloco-texto');
			ps[0].parentNode.insertBefore(corpo, ps[0]);
			ps.forEach(function (p) { texto.appendChild(p); });
			corpo.appendChild(texto);
			var classe = 'visor-dado' + (v[0].length >= 8 ? ' longo' : '') + (/^−/.test(v[0]) && /°C/.test(v[0]) ? ' frio' : '');
			corpo.appendChild(el('aside', classe, '<b>' + v[0] + '</b><span>' + v[1] + '</span>'));
		});
		// "isso é como…"
		Object.keys(D.comparacoes || {}).forEach(function (n) {
			var sec = document.getElementById('secao-' + n);
			if (sec) sec.appendChild(el('p', 'comparacao-dia', '<span class="icone-secao" data-icone="balao" aria-hidden="true"></span><span><b>Isso é como…</b> ' + D.comparacoes[n] + '</span>'));
		});
		// mini animações (cada página tem duas, em seções diferentes)
		[D.animacao, D.animacao2].forEach(function (a) {
			var secA = a && document.getElementById('secao-' + a.secao);
			if (secA) secA.appendChild(el('figure', 'animacao',
				'<canvas data-animacao="' + a.id + '" width="200" height="110" role="img" aria-label="' + a.aria + '"></canvas>' +
				'<div class="animacao-hud" aria-hidden="true"><span data-hud="ano">' + a.hud[0] + '</span><span data-hud="estacao">' + a.hud[1] + '</span></div>' +
				'<figcaption>' + a.legenda + '</figcaption>'));
		});
		// a imagem antiga de comparação vira a comparação viva com o Sol
		var antiga = document.querySelector('figure.comparacao'), c = D.comparacao;
		if (antiga && c && c.todos) { // na página do Sol: os 8 planetas em tamanho real ao lado dele
			var todos = el('figure', 'comparacao-viva');
			todos.setAttribute('data-todos', '1');
			todos.setAttribute('role', 'img');
			todos.setAttribute('aria-label', 'Comparação de tamanho: o Sol e, ao lado, os oito planetas em tamanho real. Até Júpiter, o maior, parece pequeno perto do Sol, e a Terra é um pontinho.');
			antiga.parentNode.replaceChild(todos, antiga);
		} else if (antiga && c) {
			var viva = el('figure', 'comparacao-viva');
			viva.setAttribute('data-astro', D.nome);
			viva.setAttribute('data-img', 'pixel/' + pagina + '.png');
			viva.setAttribute('data-km', c.km);
			viva.setAttribute('data-plural', c.plural);
			if (c.proporcao) viva.setAttribute('data-proporcao', c.proporcao);
			viva.setAttribute('role', 'img');
			viva.setAttribute('aria-label', 'Comparação de tamanho: ' + D.nome + ' em tamanho real ao lado do Sol. O diâmetro do Sol é cerca de ' + Math.round(1392700 / c.km) + ' vezes maior.');
			antiga.parentNode.replaceChild(viva, antiga);
		}
		// seções extras no fim: linha do tempo, calculadoras e quiz
		var fecho = conteudo.querySelector('.fecho'), extras = [];
		function secaoExtra(id, titulo, corpo) {
			var s = el('section', 'bloco pixelado visual-extra', '<h2>' + titulo + '</h2>' + corpo);
			s.id = id;
			conteudo.insertBefore(s, fecho);
			extras.push([id, titulo]);
		}
		// o céu visto de lá (só nos destinos da galáxia): um texto e um céu em pixel art
		if (D.ceu) secaoExtra('ceu', 'O céu visto daqui', '<p>' + D.ceu.texto + '</p>' +
			'<figure class="animacao"><canvas data-animacao="ceu" width="200" height="110" role="img" aria-label="' + D.ceu.aria + '"></canvas>' +
			'<div class="animacao-hud" aria-hidden="true"><span data-hud="ano">' + D.ceu.hud[0] + '</span><span data-hud="estacao">' + D.ceu.hud[1] + '</span></div>' +
			'<figcaption>' + D.ceu.legenda + '</figcaption></figure>');
		if (D.linha) secaoExtra('linha-do-tempo', 'Linha do tempo', '<ol class="linha-tempo">' +
			D.linha.map(function (m) { return '<li><b>' + m[0] + '</b><span>' + m[1] + '</span></li>'; }).join('') + '</ol>' +
			'<p class="linha-tempo-mais"><a href="linha-do-tempo.html">Ver a linha do tempo de todos os destinos juntos &rarr;</a></p>');
		var K = D.calculadoras;
		if (K) {
			var cards = '';
			if (K.idade) cards +=
				'<div class="calc" data-ferramenta="idade" data-ano="' + K.idade + '" data-planeta="' + D.nome + '">' +
				'<label class="calc-titulo" for="calc-idade">Quantos anos você teria em ' + D.nome + '?</label>' +
				'<div class="calc-entrada"><input id="calc-idade" type="number" min="0" max="130" value="10" inputmode="numeric"><span>anos na Terra</span></div>' +
				'<p class="calc-resultado" aria-live="polite"></p></div>';
			if (K.voltas) cards +=
				'<div class="calc" data-ferramenta="voltas" data-km-ano="940000000">' +
				'<label class="calc-titulo" for="calc-voltas">Quanto você já viajou em volta do Sol?</label>' +
				'<div class="calc-entrada"><input id="calc-voltas" type="number" min="0" max="130" value="10" inputmode="numeric"><span>anos de idade</span></div>' +
				'<p class="calc-resultado" aria-live="polite"></p></div>';
			// nos destinos da galáxia: quando saiu a luz que vemos de lá (e quando chega a de hoje)
			if (K.luz) cards +=
				'<div class="calc" data-ferramenta="luz" data-anos-luz="' + K.luz + '" data-de="' + K.de + '">' +
				'<label class="calc-titulo" for="calc-luz">Quando saiu a luz que você vê ' + K.de + '?</label>' +
				'<div class="calc-entrada"><input id="calc-luz" type="number" min="1900" max="2100" value="2015" inputmode="numeric"><span>ano em que você nasceu</span></div>' +
				'<p class="calc-resultado" aria-live="polite"></p></div>';
			var V = K.viagem;
			if (V) cards +=
				'<div class="calc" data-ferramenta="viagem" data-km="' + V.km + '">' +
				'<p class="calc-titulo">' + (V.titulo || 'Quanto tempo para chegar a ' + V.destino + '?') + '</p>' +
				'<div class="calc-opcoes" role="group" aria-label="Escolha o jeito de viajar">' +
					'<button type="button" data-kmh="100" data-icone="carro" data-frase="De carro, a 100 km/h">Carro</button>' +
					'<button type="button" data-kmh="900" data-icone="aviao" data-frase="De avião, a 900 km/h">Avião</button>' +
					'<button type="button" ' + (V.sonda.kmh ? 'data-kmh="' + V.sonda.kmh + '"' : 'data-anos="' + V.sonda.anos + '"') + ' data-icone="foguete" data-frase="' + V.sonda.frase + '" data-nota="' + V.sonda.nota + '">' + (pagina === 'terra' ? 'Foguete' : 'Sonda') + '</button>' +
					'<button type="button" data-kmh="1079252849" data-icone="luz" data-frase="Na velocidade da luz">Luz</button>' +
				'</div>' +
				'<div class="calc-trilha" aria-hidden="true"><i class="calc-terra"></i><i class="calc-veiculo"></i>' +
					(pagina === 'terra' ? '<i class="calc-urano calc-lua"></i>'
						: D.quizGalaxia ? '<i class="calc-urano calc-estrela"></i>' // os destinos não têm pixel art pequena: uma estrelinha na cor deles
						: '<i class="calc-urano calc-destino" style="--destino:url(pixel/' + pagina + '.png)"></i>') + '</div>' +
				'<p class="calc-resultado" aria-live="polite">Escolha um jeito de viajar.</p>' +
				'<small class="calc-nota">' + V.nota + '</small></div>';
			secaoExtra('calculadoras', 'Calculadoras espaciais', '<div class="calculadoras">' + cards + '</div>');
		}
		// sons de verdade: gravações e "sonificações" da NASA e de observatórios (links para os sites deles)
		if (D.sons) secaoExtra('sons', 'Ouça de verdade',
			'<p>No espaço não tem ar, e sem ar o som não anda. Mas os telescópios e as sondas captam luz e ondas de rádio, e os cientistas transformam esses dados em sons que a gente pode ouvir. Use fone de ouvido!</p>' +
			'<ul class="sons">' + D.sons.map(function (s) {
				// com o som guardado no site: um tocador (botão, barrinha e o link para a página original)
				if (s.audio) return '<li class="som"><button type="button" class="sons-tocar" data-audio="' + s.audio + '" data-duracao="' + (s.duracao || '') + '" aria-pressed="false" aria-label="Tocar: ' + s.titulo + '"><span class="sons-icone" aria-hidden="true"></span></button>' +
					'<span class="sons-texto"><b>' + s.titulo + '</b><span>' + s.texto + '</span><span class="sons-barra" aria-hidden="true"><i></i></span>' +
					'<small>' + s.fonte + ' · <a href="' + s.url + '" target="_blank" rel="noopener">ver no site original, em inglês &#8599;</a></small></span></li>';
				return '<li><a href="' + s.url + '" target="_blank" rel="noopener"><span class="sons-icone" aria-hidden="true">&#9835;</span><span class="sons-texto"><b>' + s.titulo + '</b><span>' + s.texto + '</span><small>' + s.fonte + ' · o site é em inglês &#8599;</small></span></a></li>';
			}).join('') + '</ul>');
		var SELO_QUIZ = D.quizGalaxia ? 'Sabe-tudo da Via Láctea' : 'Sabe-tudo do Sistema Solar';
		// "Quiz da Terra", "Quiz das Plêiades"... (o resto fica com "de")
		var DE = { 'Terra': 'da Terra', 'Nebulosa de Órion': 'da Nebulosa de Órion', 'Plêiades': 'das Plêiades', 'Bolhas de Fermi': 'das Bolhas de Fermi',
			'Nebulosa da Hélice': 'da Nebulosa da Hélice', 'Estrela de Tabby': 'da Estrela de Tabby', 'Nebulosa do Caranguejo': 'da Nebulosa do Caranguejo' };
		if (D.quiz) secaoExtra('quiz', 'Quiz ' + (DE[D.nome] || 'de ' + D.nome),'<div class="quiz" data-quiz="' + pagina + '"' + (D.quizGalaxia ? ' data-quiz-galaxia' : '') + '>' +
			'<p class="quiz-intro">Acerte as três perguntas: cada quiz certo conta para o selo especial "' + SELO_QUIZ + '" do seu passaporte.</p>' +
			D.quiz.map(function (q, i) {
				return '<fieldset class="quiz-pergunta"><legend>' + (i + 1) + '. ' + q[0] + '</legend>' +
					q[1].map(function (r) { return r.charAt(0) === '*' ? '<button type="button" data-certa>' + r.slice(1) + '</button>' : '<button type="button">' + r + '</button>'; }).join('') +
					'</fieldset>';
			}).join('') + '<p class="quiz-resultado" aria-live="polite"></p></div>');
		// e os links no "diário de bordo", antes da balança
		var extraLi = document.querySelector('.sumario li.extra'), lista = document.querySelector('.sumario ol');
		extras.forEach(function (e) {
			var li = el('li', null, '<a href="#' + e[0] + '">' + e[1] + '</a>');
			if (extraLi) lista.insertBefore(li, extraLi); else if (lista) lista.appendChild(li);
		});
	}

	// ---------- Ícones (12 x 12; # = cheio, + = meio-tom) ----------
	var ICONES = {
		telescopio: ['............', '..........##', '........###+', '......###++.', '....###++...', '..##++##....', '.#++#..#....', '..##...#....', '......#.#...', '.....#...#..', '....#.....#.', '............'],
		cristal: ['.....##.....', '..#..##..#..', '...#.##.#...', '....####....', '.##########.', '.##########.', '....####....', '...#.##.#...', '..#..##..#..', '.....##.....', '............', '............'],
		balao: ['............', '.##########.', '#++++++++++#', '#+##+##+##+#', '#++++++++++#', '#++++++++++#', '.###++#####.', '....#+#.....', '.....##.....', '............', '............', '............'],
		rolando: ['....####....', '..##++++##..', '.#+++##+++#.', '.#++#..#++#.', '#++#....#++#', '#++#....#++#', '############', '#++#....#++#', '.#++#..#++#.', '.#+++##+++#.', '..##++++##..', '....####....'],
		'dia-noite': ['.....##.....', '..#..##.....', '...#####....', '..#######...', '###########.', '..####++++#.', '..###++++++#', '...##+++++#.', '..#..#+++#..', '.....###....', '............', '............'],
		termometro: ['.....##.....', '....#..#....', '....#..#.##.', '....#..#....', '....#++#.##.', '....#++#....', '....#++#.##.', '...#++++#...', '..#++++++#..', '..#++++++#..', '...#++++#...', '....####....'],
		mascaras: ['############', '#++++##++++#', '#+##+##+##+#', '#++++##++++#', '#+#+#..#++#.', '#+.+#..#+.+#', '.#++#..#+#+#', '..##....##.#', '............', '............', '............', '............'],
		sonda: ['......#.....', '.....###....', '......#.....', '#####.#.####', '#+++#####++#', '#+++#+++#++#', '#####+++####', '.....###....', '......#.....', '.....#.#....', '....#...#...', '............'],
		relogio: ['...######...', '..#++++++#..', '.#+++#++++#.', '#++++#+++++#', '#++++#+++++#', '#++++####++#', '#++++++++++#', '#++++++++++#', '.#++++++++#.', '..#++++++#..', '...######...', '............'],
		calculadora: ['.##########.', '.#++++++++#.', '.#+######+#.', '.#++++++++#.', '.#+#+#+#++#.', '.#++++++++#.', '.#+#+#+#++#.', '.#++++++++#.', '.#+#+#+###.', '.#++++++++#.', '.##########.', '............'],
		interrogacao: ['...######...', '..#++++++#..', '..#+#..#+#..', '......#+#...', '.....#+#....', '....#+#.....', '....#+#.....', '............', '....###.....', '....###.....', '............', '............'],
		carro: ['............', '............', '...######...', '..#++#+++#..', '.#+++#++++#.', '############', '#++++++++++#', '############', '..##....##..', '..##....##..', '............', '............'],
		aviao: ['.....#......', '.....##.....', '.....##.....', '.....###....', '############', '############', '.....###....', '.....##.....', '....####....', '.....##.....', '............', '............'],
		foguete: ['.....##.....', '....####....', '....#++#....', '....#..#....', '....#++#....', '....####....', '...######...', '..##.##.##..', '.....++.....', '.....+......', '............', '............'],
		luz: ['.....#......', '....##......', '...###......', '..####......', '.#########..', '.....####...', '.....###....', '.....##.....', '.....#......', '............', '............', '............']
	};
	function svgIcone(nome) {
		var linhas = ICONES[nome];
		if (!linhas) return '';
		var s = '<svg viewBox="0 0 12 12" shape-rendering="crispEdges" aria-hidden="true">';
		linhas.forEach(function (l, y) {
			for (var x = 0; x < l.length; x++) {
				if (l[x] === '#') s += '<rect x="' + x + '" y="' + y + '" width="1" height="1"/>';
				else if (l[x] === '+') s += '<rect x="' + x + '" y="' + y + '" width="1" height="1" opacity="0.35"/>';
			}
		});
		return s + '</svg>';
	}
	document.querySelectorAll('[data-icone]').forEach(function (el) {
		el.insertAdjacentHTML(el.tagName === 'BUTTON' ? 'afterbegin' : 'beforeend', svgIcone(el.getAttribute('data-icone')));
	});

	// ---------- Mini animações em pixel art ----------
	function cor(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
	function hex(h) { return cor(parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)); }
	var B4 = [0, 0.5, 0.75, 0.25]; // pontilhado 2 x 2
	function semente(s) { return function () { s = (s * 16807) % 2147483647; return s / 2147483647; }; }

	var ANIMACOES = {
		// Urano dando a volta no Sol deitado: o eixo aponta sempre para o mesmo lado, então
		// durante metade da volta o polo norte (vermelho) fica de frente para o Sol, e depois o sul.
		'urano-rola': function (L, A) {
			var aleat = semente(11), estrelas = [];
			for (var i = 0; i < 70; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
			var FUNDO = hex('#07051a'), SOL = [hex('#fff4c0'), hex('#ffd36a'), hex('#ffb347'), hex('#e07a2a')];
			var CLARO = [hex('#e6fbff'), hex('#bfeff5'), hex('#8fdbe6'), hex('#5fb8c8'), hex('#3f8fa8'), hex('#2a5f78'), hex('#173a52')];
			var NUVEM = hex('#ffffff'), SETA = hex('#ffd36a');
			var cx = L / 2, cy = A / 2, rx = L * 0.36, ry = A * 0.3, R = 10;
			// nuvens presas na superfície (posição ao longo do eixo e longitude): elas giram junto
			// com o planeta em volta do eixo deitado, e é isso que mostra ele rolando
			var NUVENS = [[-3, 0, 0.88], [4, 2.1, 0.9], [-1, 4.2, 0.88]].map(function (n) {
				var r = Math.sqrt(R * R - n[0] * n[0]);
				return [n[0] / R, r * Math.cos(n[1]) / R, r * Math.sin(n[1]) / R, n[2]];
			});
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				estrelas.forEach(function (e) { if (e[2] > 0.3) buf[e[1] * L + e[0]] = cor(120 + e[2] * 100, 120 + e[2] * 100, 160 + e[2] * 90); });
				// órbita pontilhada
				for (var a = 0, n = 0; a < Math.PI * 2; a += 0.03, n++) {
					var ox = Math.round(cx + Math.cos(a) * rx), oy = Math.round(cy + Math.sin(a) * ry);
					if (n % 2 === 0) buf[oy * L + ox] = hex('#7472c8');
				}
				// o ângulo na órbita (16 segundos = 84 anos)
				var ang = (t / 16) * Math.PI * 2, px = cx + Math.cos(ang) * rx, py = cy + Math.sin(ang) * ry;
				var atras = Math.sin(ang) < 0; // na metade de cima da elipse, Urano passa "atrás" do Sol
				function sol() {
					for (var y = -9; y <= 9; y++) for (var x = -9; x <= 9; x++) {
						var d = Math.sqrt(x * x + y * y);
						var k = (Math.round(cy) + y) * L + Math.round(cx) + x;
						if (d < 5.5) buf[k] = SOL[d < 2.5 ? 0 : d < 4.2 ? 1 : 2];
						else if (d < 9 && B4[(x & 1) + ((y & 1) << 1)] < (9 - d) / 4) buf[k] = SOL[3];
					}
				}
				function urano() {
					var ux = Math.round(px), uy = Math.round(py);
					function ponto(x, y, c) { if (x >= 0 && y >= 0 && x < L && y < A) buf[y * L + x] = c; }
					// o anel: o eixo fica deitado (na horizontal), então o anel fica "em pé" (uma elipse
					// fininha na vertical). Primeiro a metade de trás, depois o planeta, depois a da frente.
					function anel(frente) {
						for (var th = 0; th < Math.PI * 2; th += 0.02) {
							var ax = Math.cos(th) * 3.2, ay = Math.sin(th) * (R + 5);
							if ((ax >= 0) !== frente) continue;
							if (!frente && ax * ax + ay * ay < R * R) continue;
							ponto(Math.round(ux + ax), Math.round(uy + ay), frente ? hex('#d8f6fa') : hex('#6fa8b8'));
						}
					}
					// o eixo, atravessando o planeta
					for (var e = -R - 6; e <= R + 6; e++) ponto(ux + e, uy, hex('#7a86b8'));
					anel(false);
					// o globo, iluminado do lado do Sol, girando em volta do eixo (uma volta a cada 3 s);
					// na face da frente, a superfície sobe
					var lx = cx - px, ly = cy - py, n = Math.sqrt(lx * lx + ly * ly) || 1; lx /= n; ly /= n;
					var giro = (t / 3) * Math.PI * 2, cg = Math.cos(giro), sg = Math.sin(giro);
					for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
						var d2 = x * x + y * y;
						if (d2 > R * R) continue;
						var z = Math.sqrt(R * R - d2), luz = (x * lx + y * ly + z * 0.3) / R;
						var nivel = Math.max(0, Math.min(6, Math.round((1 - luz) * 3 + 0.8 + B4[(x & 1) + ((y & 1) << 1)] * 0.9)));
						// o ponto da superfície no "mapa" do planeta (desfazendo o giro)
						var yb = (y * cg + z * sg) / R, zb = (-y * sg + z * cg) / R, xb = x / R, nuvem = false;
						NUVENS.forEach(function (c) { if (xb * c[0] + yb * c[1] + zb * c[2] > c[3]) nuvem = true; });
						// faixas suaves com a longitude, para o giro aparecer mesmo longe das nuvens
						if (nuvem) nivel = Math.max(0, nivel - 3);
						else if (Math.sin(Math.atan2(zb, yb) * 2) > 0.6) nivel = Math.min(6, nivel + 1);
						ponto(ux + x, uy + y, nuvem && nivel < 2 ? NUVEM : CLARO[nivel]);
					}
					anel(true);
					// a setinha curva em volta da ponta esquerda do eixo, mostrando o sentido do giro
					var sx = ux - R - 4;
					for (var th = -1.2; th <= 1.6; th += 0.08) ponto(Math.round(sx - Math.cos(th) * 3), Math.round(uy - Math.sin(th) * 6), SETA);
					var tx = Math.round(sx - Math.cos(1.6) * 3), ty = Math.round(uy - Math.sin(1.6) * 6);
					// a ponta da seta, um triangulinho apontando para a direita
					[[0, -2], [0, -1], [0, 0], [0, 1], [0, 2], [1, -1], [1, 0], [1, 1], [2, 0]].forEach(function (p) { ponto(tx + p[0], ty + p[1], SETA); });
					// a ponta do eixo que sai à direita e o polo norte (vermelho), sempre para a direita
					for (e = R; e <= R + 6; e++) ponto(ux + e, uy, hex('#9aa6d8'));
					var pnx = ux + R + 6;
					[[0, 0], [1, 0], [0, -1], [0, 1], [-1, 0]].forEach(function (p) { ponto(pnx + p[0], uy + p[1], hex('#ff5a6a')); });
				}
				if (atras) { urano(); sol(); } else { sol(); urano(); }
				// o painel: ano da volta e a estação no polo norte (o polo norte aponta para a direita,
				// então ele está de frente para o Sol quando Urano está do lado esquerdo da órbita)
				if (hud) {
					var ano = Math.floor(((ang / (Math.PI * 2)) % 1) * 84);
					var frente = -Math.cos(ang); // 1 = polo norte de frente para o Sol
					hud.ano.textContent = 'ano ' + ano + ' de 84';
					// virando para o Sol = primavera; se afastando dele = outono
					hud.estacao.textContent = (frente > 0.6 ? 'verão' : frente < -0.6 ? 'inverno' : Math.sin(ang) > 0 ? 'primavera' : 'outono') + ' no polo norte';
				}
			};
		},
		// Urano cortado ao meio: atmosfera, a camada de gelos e o núcleo, com diamantes caindo
		'urano-diamantes': function (L, A) {
			var aleat = semente(23), diamantes = [];
			var FUNDO = hex('#07051a'), cx = L / 2, cy = A - 6, R = Math.min(L * 0.42, A - 10);
			var ATM = [hex('#e6fbff'), hex('#bfeff5'), hex('#9fdde8')], GELO = [hex('#5fb0d0'), hex('#3f8fb8'), hex('#2c6f98'), hex('#1f5278')];
			var NUC = [hex('#b08a6a'), hex('#8a6a52'), hex('#6a4e3e')];
			function novo(d) { var a = -Math.PI * (0.15 + aleat() * 0.7), r = R * (0.62 + aleat() * 0.2); d.x = cx + Math.cos(a) * r; d.y = cy + Math.sin(a) * r; d.v = 1.5 + aleat() * 2; d.f = aleat() * 6; return d; }
			for (var i = 0; i < 26; i++) { var d = novo({}); d.y += aleat() * 10; diamantes.push(d); }
			var anterior = 0;
			return function (buf, t) {
				var dt = Math.min(0.2, t - anterior); anterior = t;
				buf.fill(FUNDO);
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.sqrt(dx * dx + dy * dy);
					if (r > R || dy > 0) continue; // só a metade de cima (o planeta cortado ao meio)
					var b = B4[(x & 1) + ((y & 1) << 1)], k = y * L + x, f = r / R;
					if (f > 0.86) buf[k] = ATM[Math.min(2, Math.floor((1 - f) / 0.14 * 3 + b * 0.6))];
					else if (f > 0.3) buf[k] = GELO[Math.min(3, Math.floor((f - 0.3) / 0.56 * 4 + b * 0.7))];
					else buf[k] = NUC[Math.min(2, Math.floor(f / 0.3 * 3 + b * 0.6))];
				}
				// linha do corte
				for (var x2 = Math.round(cx - R); x2 <= Math.round(cx + R); x2++) buf[Math.round(cy) * L + x2] = hex('#e6fbff');
				// diamantes caindo em direção ao centro, piscando
				diamantes.forEach(function (d) {
					var vx = cx - d.x, vy = cy - d.y, n = Math.sqrt(vx * vx + vy * vy);
					if (n < R * 0.3) novo(d);
					else { d.x += vx / n * d.v * dt; d.y += vy / n * d.v * dt; }
					var px = Math.round(d.x), py = Math.round(d.y), brilho = Math.sin(t * 3 + d.f) > 0.3;
					buf[py * L + px] = hex('#ffffff');
					if (brilho) { buf[(py - 1) * L + px] = hex('#d8f6ff'); buf[(py + 1) * L + px] = hex('#d8f6ff'); buf[py * L + px - 1] = hex('#d8f6ff'); buf[py * L + px + 1] = hex('#d8f6ff'); }
				});
			};
		},

		// Vênus e a Terra girando lado a lado: as manchas da Terra andam para a direita;
		// as nuvens de Vênus andam para a esquerda (ela gira ao contrário) e bem mais devagar
		'venus-gira': function (L, A) {
			var aleat = semente(31), estrelas = [];
			for (var i = 0; i < 50; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
			var FUNDO = hex('#07051a'), R = 26, cy = A / 2 - 4;
			var MAR = [hex('#9fd0ff'), hex('#5f9fe8'), hex('#3a6fc0'), hex('#244a8a'), hex('#14284e')];
			var TERRA_V = [hex('#b8e08a'), hex('#7fbf5a'), hex('#4f9a44'), hex('#2f6a36'), hex('#183a20')];
			var NUVEM = [hex('#fff6d8'), hex('#f5dc9a'), hex('#e6b85a'), hex('#b8863a'), hex('#6a4a24')];
			// manchas que dão a volta (periódicas na longitude)
			function campo(u, v, s) { return Math.sin(3 * u + s) * Math.cos(2.2 * v + s * 0.7) + 0.6 * Math.sin(5 * u - 3 * v + s * 1.9) + 0.4 * Math.sin(2 * u + 4 * v); }
			function globo(buf, cx, giro, tipo) {
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d2 = x * x + y * y;
					if (d2 > R * R) continue;
					var nx = x / R, ny = y / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
					var u = Math.atan2(nx, nz) - giro, v = Math.asin(ny);
					var luz = 0.45 + 0.55 * (nz * 0.8 - nx * 0.25 - ny * 0.15) + B4[(x & 1) + ((y & 1) << 1)] * 0.18;
					var n = Math.max(0, Math.min(4, Math.round((1 - luz) * 4)));
					var c;
					if (tipo === 'terra') c = Math.abs(v) > 1.2 ? hex('#eef6ff') : campo(u, v, 0) > 0.35 ? TERRA_V[n] : MAR[n];
					else c = NUVEM[Math.max(0, Math.min(4, n + (Math.sin(v * 7 + campo(u, v, 2) * 1.2) > 0.3 ? 0 : 1)))];
					buf[(Math.round(cy) + y) * L + cx + x] = c;
				}
			}
			function seta(buf, cx, paraDireita) {
				var y0 = Math.round(cy + R + 9), c = hex('#cdbfff');
				for (var x = -9; x <= 9; x++) buf[y0 * L + cx + x] = c;
				var ponta = cx + (paraDireita ? 9 : -9), dir = paraDireita ? -1 : 1;
				for (var k = 1; k <= 3; k++) { buf[(y0 - k) * L + ponta + dir * k] = c; buf[(y0 + k) * L + ponta + dir * k] = c; }
			}
			return function (buf, t) {
				buf.fill(FUNDO);
				estrelas.forEach(function (e) { if (e[2] > 0.35) buf[e[1] * L + e[0]] = cor(110 + e[2] * 100, 110 + e[2] * 100, 150 + e[2] * 100); });
				globo(buf, Math.round(L * 0.28), t * 1.1, 'terra');
				globo(buf, Math.round(L * 0.72), -t * 0.35, 'venus');
				seta(buf, Math.round(L * 0.28), true);
				seta(buf, Math.round(L * 0.72), false);
			};
		},

		// A Terra dando a volta no Sol com o eixo inclinado (23°) sempre para o mesmo lado:
		// quando a metade de baixo (o hemisfério sul) fica virada para o Sol, é verão no Brasil
		'terra-estacoes': function (L, A) {
			var aleat = semente(17), estrelas = [];
			for (var i = 0; i < 70; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
			var FUNDO = hex('#07051a'), SOL = [hex('#fff4c0'), hex('#ffd36a'), hex('#ffb347'), hex('#e07a2a')];
			var MAR = [hex('#bfe0ff'), hex('#8fc0ff'), hex('#5f9fe8'), hex('#3a6fc0'), hex('#244a8a'), hex('#17305e'), hex('#0e1c3a')];
			var cx = L / 2, cy = A / 2, rx = L * 0.36, ry = A * 0.3;
			var VERDE = [hex('#c8e89a'), hex('#b8e08a'), hex('#9fd07a'), hex('#7fbf5a'), hex('#5f9a44'), hex('#3f6a36'), hex('#244a22')];
			var MESES = ['dezembro', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro'];
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				function ponto(x, y, c) { if (x >= 0 && y >= 0 && x < L && y < A) buf[y * L + x] = c; }
				estrelas.forEach(function (e) { if (e[2] > 0.3) buf[e[1] * L + e[0]] = cor(120 + e[2] * 100, 120 + e[2] * 100, 160 + e[2] * 90); });
				for (var a = 0, n = 0; a < Math.PI * 2; a += 0.03, n++) if (n % 2 === 0) ponto(Math.round(cx + Math.cos(a) * rx), Math.round(cy + Math.sin(a) * ry), hex('#7472c8'));
				var ang = (t / 12) * Math.PI * 2, px = cx + Math.cos(ang) * rx, py = cy + Math.sin(ang) * ry, ux = Math.round(px), uy = Math.round(py);
				function sol() {
					for (var y = -9; y <= 9; y++) for (var x = -9; x <= 9; x++) {
						var d = Math.sqrt(x * x + y * y);
						if (d < 5.5) ponto(Math.round(cx) + x, Math.round(cy) + y, SOL[d < 2.5 ? 0 : d < 4.2 ? 1 : 2]);
						else if (d < 9 && B4[(x & 1) + ((y & 1) << 1)] < (9 - d) / 4) ponto(Math.round(cx) + x, Math.round(cy) + y, SOL[3]);
					}
				}
				function terra() {
					// no estilo de Urano: o eixo inclinado 23° com o polo norte marcado, os continentes
					// girando junto com a Terra (um dia a cada 1,5 s) e a setinha do giro
					globoGirando(buf, L, A, ux, uy, { R: 8, inc: 23, giro: (t / 1.5) * Math.PI * 2, luz: [cx - px, cy - py], PAL: MAR,
						manchas: [[0.35, 0.2, 0.55], [-0.3, 2.3, 0.6], [0.15, 4.1, 0.5], [0.55, 3.2, 0.4]], manchaPAL: VERDE, calotas: true });
				}
				if (Math.sin(ang) < 0) { terra(); sol(); } else { sol(); terra(); }
				if (hud) {
					var mes = MESES[Math.floor(((ang / (Math.PI * 2)) % 1) * 12)], sul = Math.cos(ang); // 1 = hemisfério sul de frente para o Sol
					hud.ano.textContent = mes;
					hud.estacao.textContent = (sul > 0.7 ? 'verão' : sul < -0.7 ? 'inverno' : Math.sin(ang) > 0 ? 'outono' : 'primavera') + ' no Brasil';
				}
			};
		},

		// Saturno ao longo de um ano dele (29 anos e meio): vistos da Terra, os anéis abrem,
		// vão ficando de lado até quase sumir (como em 2025) e depois abrem de novo
		'saturno-aneis': function (L, A) {
			var aleat = semente(41), estrelas = [];
			for (var i = 0; i < 60; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
			var FUNDO = hex('#07051a'), cx = L / 2, cy = A / 2, R = 20, R1 = 27, R2 = 46, PERIODO = 14;
			var GLOBO = [hex('#fff0c8'), hex('#f0d89a'), hex('#e3c07a'), hex('#c89a5a'), hex('#8a6a3e'), hex('#4a3a24')];
			var ANEL = [hex('#f5e6c0'), hex('#d8c08a'), hex('#a8905e')];
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				function ponto(x, y, c) { if (x >= 0 && y >= 0 && x < L && y < A) buf[y * L + x] = c; }
				estrelas.forEach(function (e) { if (e[2] > 0.3) buf[e[1] * L + e[0]] = cor(120 + e[2] * 100, 120 + e[2] * 100, 160 + e[2] * 90); });
				var fase = (t / PERIODO) * Math.PI * 2, b = 0.42 * Math.sin(fase); // inclinação aparente dos anéis
				function anel(frente) {
					for (var y = -R2; y <= R2; y++) for (var x = -R2; x <= R2; x++) {
						var r;
						if (Math.abs(b) < 0.03) { if (y !== 0) continue; r = Math.abs(x); } // de lado: só uma linha fininha
						else r = Math.sqrt(x * x + (y / b) * (y / b));
						if (r < R1 || r > R2) continue;
						if ((y * Math.sign(b || 1) > 0) !== frente && Math.abs(b) >= 0.03) continue;
						if (!frente && x * x + y * y < R * R) continue;
						var faixa = r < 33 ? 2 : r < 38 ? 0 : r < 39.5 ? -1 : 1; // a divisão de Cassini
						if (faixa < 0) continue;
						ponto(Math.round(cx + x), Math.round(cy + y), ANEL[(faixa + (B4[((x + 64) & 1) + (((y + 64) & 1) << 1)] > 0.6 ? 1 : 0)) % 3]);
					}
				}
				anel(false);
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d2 = x * x + y * y;
					if (d2 > R * R) continue;
					var z = Math.sqrt(R * R - d2), luz = (-x * 0.35 - y * 0.3 + z * 0.9) / R;
					var listra = Math.sin(y * 0.9) > 0.55 ? 1 : 0;
					var nivel = Math.max(0, Math.min(5, Math.round((1 - luz) * 3 + listra + B4[(x & 1) + ((y & 1) << 1)] * 0.8)));
					ponto(Math.round(cx + x), Math.round(cy + y), GLOBO[nivel]);
				}
				anel(true);
				if (hud) {
					var ano = Math.floor(((fase / (Math.PI * 2)) % 1) * 29.5), abrindo = Math.sign(b) * Math.cos(fase) > 0;
					hud.ano.textContent = 'ano ' + ano + ' de 29';
					hud.estacao.textContent = Math.abs(b) > 0.32 ? 'anéis bem abertos' : Math.abs(b) < 0.06 ? 'anéis de lado (como em 2025)' : abrindo ? 'anéis abrindo' : 'anéis fechando';
				}
			};
		},

		// Mercúrio dando a volta no Sol (no mesmo cenário da animação de Urano). Ele gira devagar:
		// 3 giros a cada 2 voltas. O resultado é estranho: no pontinho vermelho, do nascer do Sol até
		// o próximo nascer passam 2 voltas inteiras (176 dias da Terra). O quadrinho embaixo mostra o
		// céu visto de lá: o Sol nasce, atravessa o céu devagar e só se põe um ano depois.
		'mercurio-dia': function (L, A) {
			var O = cenarioOrbita(L, A, 5), ANO = 8, R = 8;
			var CINZA = [hex('#f0ecf6'), hex('#d4cee2'), hex('#b0a8c4'), hex('#8a83a0'), hex('#5e5876'), hex('#3a3654'), hex('#221e36')];
			var bx = 1, by = A - 25, bw = 40, bh = 24; // o quadrinho do céu, no canto, fora da órbita
			return function (buf, t, hud) {
				O.fundo(buf);
				O.orbita(buf, 1);
				var th = (t / ANO) * Math.PI * 2, p = O.pos(th, 1), ux = Math.round(p[0]), uy = Math.round(p[1]);
				// no estilo de Urano: o eixo em pé (Mercúrio quase não tem inclinação), as crateras
				// girando junto e a bandeirinha no equador. "fi" é para onde a bandeirinha aponta,
				// no plano da órbita (começa no nascer do Sol); o Sol, visto de lá, fica na direção th + 180°
				var fi = th * 1.5 + Math.PI / 2;
				var h = Math.atan2(Math.sin(fi - th - Math.PI), Math.cos(fi - th - Math.PI)); // 0 = meio-dia lá
				var dia = Math.cos(h) > 0;
				function planeta() {
					globoGirando(buf, L, A, ux, uy, { R: R, inc: 0, giro: fi, luz: [O.cx - p[0], O.cy - p[1]], PAL: CINZA,
						manchas: [[0.45, 1, 0.38], [-0.35, 2.6, 0.42], [0.1, 4, 0.32], [-0.55, 5.2, 0.3], [0.65, 3.6, 0.3]], manchaPAL: CINZA.slice(2).concat([CINZA[6], CINZA[6]]),
						bandeira: [0, 0] });
					// quando é dia lá (e a bandeirinha está do lado da frente), um raio de sol liga o Sol a ela
					if (dia && Math.sin(fi) > 0) {
						var mx = ux + Math.cos(fi) * R, my = uy, n = Math.hypot(mx - O.cx, my - O.cy);
						for (var d = 11; d < n - 2; d += 3) pintar(buf, L, A, O.cx + (mx - O.cx) * d / n, O.cy + (my - O.cy) * d / n, hex('#ffd36a'));
					}
				}
				if (O.atras(th)) { planeta(); O.sol(buf); } else { O.sol(buf); planeta(); }
				// o quadrinho: o céu visto do pontinho vermelho (preto: Mercúrio não tem ar)
				for (var y = by; y < by + bh; y++) for (var x = bx; x < bx + bw; x++) {
					var borda = y === by || y === by + bh - 1 || x === bx || x === bx + bw - 1;
					buf[y * L + x] = borda ? hex('#4a4280') : y > by + bh - 8 ? (y === by + bh - 7 ? hex('#8a83a0') : hex('#5e5876')) : hex('#0b0820');
				}
				var chao = by + bh - 8, meio = bx + bw / 2;
				if (!dia) [[6, 5], [14, 10], [28, 4], [34, 11], [21, 7], [9, 13]].forEach(function (e) { pintar(buf, L, A, bx + e[0], by + e[1], hex('#cdbfff')); });
				var sx = meio + Math.sin(h) * 15, sy = chao - Math.cos(h) * 12;
				for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
					if (dx * dx + dy * dy > 5 || sy + dy >= chao || sy + dy <= by || sx + dx <= bx || sx + dx >= bx + bw - 1) continue;
					pintar(buf, L, A, sx + dx, sy + dy, dx * dx + dy * dy < 2 ? hex('#fff4c0') : hex('#ffb347'));
				}
				for (var f = 1; f <= 4; f++) pintar(buf, L, A, meio, chao - f, hex('#ffffff'));
				pintar(buf, L, A, meio + 1, chao - 4, hex('#ff4a5a')); pintar(buf, L, A, meio + 2, chao - 4, hex('#ff4a5a')); pintar(buf, L, A, meio + 1, chao - 3, hex('#ff4a5a'));
				if (hud) {
					var c = Math.cos(h), s = Math.sin(h);
					hud.ano.textContent = 'volta ' + (Math.floor(th / (Math.PI * 2)) % 2 + 1) + ' de 2 no Sol';
					hud.estacao.textContent = c > 0.93 ? 'meio-dia lá (430 °C)' : c > 0.2 ? (s < 0 ? 'manhã lá' : 'tarde lá') : c > -0.2 ? (s < 0 ? 'o Sol nascendo lá' : 'o Sol se pondo lá') : 'noite lá (−180 °C)';
				}
			};
		},

		// Marte com uma tempestade de poeira que começa pequena, cobre o planeta inteiro e baixa
		'marte-poeira': function (L, A) {
			var aleat = semente(13), estrelas = [];
			for (var i = 0; i < 60; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
			var FUNDO = hex('#07051a'), cx = L / 2, cy = A / 2, R = 40, CICLO = 16;
			var SOLO = [hex('#f0a070'), hex('#d8784a'), hex('#b85a36'), hex('#8a4028'), hex('#5a2a1c'), hex('#2e1610')];
			var ESCURO = [hex('#9a5a40'), hex('#7a4632'), hex('#5e3426'), hex('#44261c'), hex('#2e1810'), hex('#1a0e0a')];
			var POEIRA = [hex('#f5d6a8'), hex('#e6bf8a'), hex('#cfa070'), hex('#a8805a'), hex('#7a5c40'), hex('#40301e')];			function ruido(u, v) { return Math.sin(u * 3.1 + 1.3) * Math.cos(v * 2.7) + 0.5 * Math.sin(u * 7.3 - v * 4.1) + 0.3 * Math.cos(u * 11 + v * 9); }
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				estrelas.forEach(function (e) { if (e[2] > 0.3) buf[e[1] * L + e[0]] = cor(120 + e[2] * 100, 120 + e[2] * 100, 160 + e[2] * 90); });
				// quanto do planeta a poeira cobre: céu limpo no começo e no fim do ciclo, tempestade no meio
				var ciclo = (t / CICLO) % 1, fase = Math.min(1, Math.max(0, (ciclo - 0.22) / 0.6)), k = Math.sin(fase * Math.PI) * 1.3 - 0.15;
				var giro = t * 0.25;
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d2 = x * x + y * y;
					if (d2 > R * R) continue;
					var nx = x / R, ny = y / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
					var u = Math.atan2(nx, nz) + giro, v = Math.asin(ny);
					var luz = 0.4 + 0.6 * (nz * 0.85 - nx * 0.3 - ny * 0.2) + B4[(x & 1) + ((y & 1) << 1)] * 0.16;
					var n = Math.max(0, Math.min(5, Math.round((1 - luz) * 5)));
					var c = ruido(u, v) > 0.55 ? ESCURO[n] : SOLO[n]; // as regiões escuras e o solo (sem a calota branca)
					// a poeira se espalha a partir de um ponto, com a borda irregular e rodopiando
					var dist = Math.acos(Math.max(-1, Math.min(1, Math.cos(v) * Math.cos(u - 0.6) * Math.cos(-0.3) + Math.sin(v) * Math.sin(-0.3)))) / Math.PI;
					if (dist + ruido(u * 1.7 + t * 0.4, v * 1.7) * 0.08 < k) c = POEIRA[Math.min(5, n + (ruido(u * 2.3 + t * 0.6, v * 2.1) > 0.4 ? 1 : 0))]; // redemoinhos
					buf[(Math.round(cy) + y) * L + Math.round(cx) + x] = c;
				}
				if (hud) {
					hud.ano.textContent = 'semana ' + Math.floor(ciclo * 20);
					hud.estacao.textContent = k < 0.05 ? 'céu limpo' : k > 0.95 ? 'o planeta inteiro coberto' : fase < 0.5 ? 'a tempestade crescendo' : 'a poeira baixando';
				}
			};
		},

		// Júpiter girando rápido (faixas e a Grande Mancha Vermelha) e as quatro luas de Galileu
		// indo e voltando, vistas de lado: passam na frente e atrás do planeta
		'jupiter-luas': function (L, A) {
			var aleat = semente(19), estrelas = [];
			for (var i = 0; i < 60; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
			var FUNDO = hex('#07051a'), cx = L / 2, cy = A / 2, R = 24;
			var FAIXAS = [hex('#f5ead6'), hex('#e6d0b0'), hex('#c8a480'), hex('#a87a58'), hex('#7a5440'), hex('#3e2a20')];
			var MANCHA = [hex('#e8906c'), hex('#c86a4a'), hex('#a8503a'), hex('#7a3a2c'), hex('#5a2a20'), hex('#30160e')];
			// distância, período (em segundos) e cor de cada lua: Io, Europa, Ganimedes e Calisto
			var LUAS = [[34, 3.5, '#f0d860', 1], [44, 7, '#f0e8d8', 1], [60, 14, '#b8a898', 2], [82, 33, '#7a7068', 2]];
			function lua(buf, l, t, frente) {
				var a = (t / l[1]) * Math.PI * 2, x = Math.round(cx + Math.cos(a) * l[0]), y = Math.round(cy + Math.sin(a) * 2);
				if ((Math.sin(a) > 0) !== frente) return;
				for (var dy = -l[3]; dy <= l[3]; dy++) for (var dx = -l[3]; dx <= l[3]; dx++) if (dx * dx + dy * dy <= l[3] * l[3] + 1) {
					var px = x + dx, py = y + dy;
					if (px >= 0 && py >= 0 && px < L && py < A) buf[py * L + px] = hex(l[2]);
				}
			}
			return function (buf, t) {
				buf.fill(FUNDO);
				estrelas.forEach(function (e) { if (e[2] > 0.3) buf[e[1] * L + e[0]] = cor(120 + e[2] * 100, 120 + e[2] * 100, 160 + e[2] * 90); });
				LUAS.forEach(function (l) { lua(buf, l, t, false); }); // as que estão atrás
				var giro = t * 0.9;
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d2 = x * x + y * y;
					if (d2 > R * R) continue;
					var nx = x / R, ny = y / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
					var u = Math.atan2(nx, nz) + giro, v = Math.asin(ny);
					var luz = 0.45 + 0.55 * (nz * 0.85 - nx * 0.3) + B4[(x & 1) + ((y & 1) << 1)] * 0.15;
					var n = Math.max(0, Math.min(5, Math.round((1 - luz) * 4)));
					var faixa = Math.sin(v * 9 + Math.sin(u * 3) * 0.25) > 0.35 ? 2 : 0;
					var du = ((u % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2) - Math.PI, dv = v - 0.38; // a Grande Mancha Vermelha
					var c = (du * du) / 0.09 + (dv * dv) / 0.012 < 1 ? MANCHA[n] : FAIXAS[Math.min(5, n + faixa)];
					buf[(Math.round(cy) + y) * L + Math.round(cx) + x] = c;
				}
				LUAS.forEach(function (l) { lua(buf, l, t, true); }); // as que estão na frente
			};
		},

		// Netuno: nuvens brancas e a Grande Mancha Escura correndo com os ventos, e Tritão
		// dando a volta no sentido contrário ao do giro do planeta
		'netuno-ventos': function (L, A) {
			var aleat = semente(29), estrelas = [];
			for (var i = 0; i < 60; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
			var FUNDO = hex('#07051a'), cx = L / 2, cy = A / 2, R = 34;
			var AZUL = [hex('#9ec4ff'), hex('#6b95ff'), hex('#4a72e0'), hex('#3454b0'), hex('#22367a'), hex('#121c44')];
			function tritao(buf, t, frente) {
				// Netuno gira com a frente andando para a direita (como as nuvens); Tritão, ao contrário:
				// quando passa na frente do planeta, ele anda da direita para a esquerda
				var a = (t / 9) * Math.PI * 2, x = Math.round(cx + Math.cos(a) * 52), y = Math.round(cy + Math.sin(a) * 14);
				if ((Math.sin(a) > 0) !== frente) return;
				for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) if (dx * dx + dy * dy <= 5) {
					var px = x + dx, py = y + dy;
					if (px >= 0 && py >= 0 && px < L && py < A) buf[py * L + px] = dx + dy < 0 ? hex('#e8e0e8') : hex('#a89aa8');
				}
			}
			return function (buf, t) {
				buf.fill(FUNDO);
				estrelas.forEach(function (e) { if (e[2] > 0.3) buf[e[1] * L + e[0]] = cor(120 + e[2] * 100, 120 + e[2] * 100, 160 + e[2] * 90); });
				tritao(buf, t, false);
				var giro = t * 0.35;
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d2 = x * x + y * y;
					if (d2 > R * R) continue;
					var nx = x / R, ny = y / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
					var u = Math.atan2(nx, nz), v = Math.asin(ny);
					var luz = 0.45 + 0.55 * (nz * 0.85 - nx * 0.3) + B4[(x & 1) + ((y & 1) << 1)] * 0.15;
					var n = Math.max(0, Math.min(5, Math.round((1 - luz) * 4 + (Math.sin(v * 6) > 0.6 ? 1 : 0))));
					var c = AZUL[n];
					// as nuvens e a mancha andam com os ventos (no equador, para o lado contrário do giro)
					var uv = u - giro * 2.2;
					var nuvem = Math.sin(uv * 3 + v * 2) > 0.8 && Math.abs(v - 0.5) < 0.12;
					var nuvem2 = Math.sin(uv * 2 - 1) > 0.85 && Math.abs(v + 0.35) < 0.07;
					var du = ((uv % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI, dv = v + 0.15;
					if ((du * du) / 0.12 + (dv * dv) / 0.02 < 1) c = AZUL[Math.min(5, n + 2)]; // a Grande Mancha Escura
					if (nuvem || nuvem2) c = n > 3 ? hex('#a8c0e8') : hex('#f2f6ff');
					buf[(Math.round(cy) + y) * L + Math.round(cx) + x] = c;
				}
				tritao(buf, t, true);
			};
		},

		// ---------- Destinos da galáxia ----------
		// Sagittarius A*: a estrela S2 numa órbita bem alongada em volta do buraco negro.
		// Como um cometa, ela anda devagar lá longe e dispara quando passa perto (leis de Kepler).
		'sgr-s2': function (L, A) {
			var fundo = estrelasFundo(L, A, 41, 70);
			var FUNDO = hex('#07051a'), DISCO = [hex('#fff1b8'), hex('#ffc65a'), hex('#e8822a'), hex('#8a3a1a')];
			var fx = 150, fy = A / 2 + 4, giro = -0.2, cg = Math.cos(giro), sg = Math.sin(giro);
			var a = 70, e = 0.88, b = a * Math.sqrt(1 - e * e), T = 16;
			// outras estrelas S, em órbitas menores e mais redondas
			var OUTRAS = [[34, 0.45, 1.2, 9], [26, 0.3, -0.9, 7], [44, 0.6, 2.4, 12]];
			function kepler(M, ee) { var E = Math.PI; for (var k = 0; k < 14; k++) E -= (E - ee * Math.sin(E) - M) / (1 - ee * Math.cos(E)); return E; }
			function naTela(X, Y, gg) { var c = Math.cos(gg), s = Math.sin(gg); return [fx + X * c - Y * s, fy + X * s + Y * c]; }
			var vPeri = Math.sqrt(2 / (a * (1 - e)) - 1 / a);
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				fundo(buf, t);
				// a órbita pontilhada da S2
				for (var k = 0; k < 220; k += 2) {
					var E0 = k / 220 * Math.PI * 2, p0 = naTela(a * (Math.cos(E0) - e), b * Math.sin(E0), giro);
					pintar(buf, L, A, p0[0], p0[1], hex('#3a3470'));
				}
				// as outras estrelas S
				OUTRAS.forEach(function (o) {
					var bo = o[0] * Math.sqrt(1 - o[1] * o[1]), Eo = kepler(((t / o[3]) % 1) * Math.PI * 2, o[1]);
					var q = naTela(o[0] * (Math.cos(Eo) - o[1]), bo * Math.sin(Eo), o[2]);
					pintar(buf, L, A, q[0], q[1], hex('#9fb4e8'));
				});
				// o buraco negro: disquinho de gás, anel de luz e a sombra
				for (var y = -9; y <= 9; y++) for (var x = -14; x <= 14; x++) {
					var r = Math.sqrt(x * x + y * y), disco = (x * x) / 196 + (y * y) / 9;
					var px = fx + x, py = fy + y;
					if (r < 3.6) { pintar(buf, L, A, px, py, hex('#000000')); continue; }
					if (r < 5) { pintar(buf, L, A, px, py, DISCO[r < 4.3 ? 0 : 1]); continue; }
					if (disco < 1 && B4[(x & 1) + ((y & 1) << 1)] < 1.2 - disco) pintar(buf, L, A, px, py, DISCO[Math.min(3, Math.floor(disco * 3 + 1))]);
				}
				// a S2, com um rastro mostrando a velocidade (rastro comprido = rápida)
				var M = ((t / T + 0.5) % 1) * Math.PI * 2;
				for (var j = 14; j >= 0; j--) {
					var Mj = M - j * 0.012, Ej = kepler(Mj, e), pj = naTela(a * (Math.cos(Ej) - e), b * Math.sin(Ej), giro);
					var k2 = 1 - j / 15;
					if (j) pintar(buf, L, A, pj[0], pj[1], cor(90 + 130 * k2, 140 + 100 * k2, 255));
				}
				var E = kepler(M, e), X = a * (Math.cos(E) - e), Y = b * Math.sin(E), p = naTela(X, Y, giro);
				var sx = Math.round(p[0]), sy = Math.round(p[1]);
				[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (d) { pintar(buf, L, A, sx + d[0], sy + d[1], hex('#ffffff')); });
				[[-1, 0], [2, 0], [0, -1], [1, -1], [0, 2], [1, 2]].forEach(function (d) { pintar(buf, L, A, sx + d[0], sy + d[1], hex('#8fd3fa')); });
				if (hud) {
					var dist = Math.sqrt(X * X + Y * Y), v = Math.sqrt(2 / dist - 1 / a) / vPeri * 7650;
					hud.ano.textContent = 'ano ' + Math.floor((M / (Math.PI * 2)) * 16) + ' de 16';
					hud.estacao.textContent = numero(Math.round(v / 10) * 10, 0) + ' km/s';
				}
			};
		},

		// Bolhas de Fermi: a Via Láctea de lado; o centro engole uma nuvem, solta jatos e as
		// duas bolhas vão inflando (magenta), com a casca do eROSITA (turquesa) em volta
		'fermi-sopro': function (L, A) {
			var fundo = estrelasFundo(L, A, 53, 60), aleat = semente(57), disco = [];
			var FUNDO = hex('#07051a'), cx = L / 2, cy = A / 2, CICLO = 15;
			for (var i = 0; i < 520; i++) {
				var dx = (aleat() - 0.5) * 2, larg = Math.pow(Math.abs(dx), 0.8);
				disco.push([cx + dx * 92, cy + (aleat() - 0.5) * (6 - larg * 4.2) * (1 + (1 - larg) * 0.8), aleat()]);
			}
			var MAG = [hex('#ff9ff0'), hex('#e070ff'), hex('#a43ad0'), hex('#5e1f86')], TURQ = hex('#5fe0d6');
			function lobo(x, y, rw, rh, sinal) { // dentro de uma bolha? (0 = borda, 1 = miolo)
				var yc = cy - sinal * rh, u = (x - cx) / rw, v = (y - yc) / rh;
				if (sinal * (cy - y) < 0) return -1;
				var d = u * u + v * v;
				return d < 1 ? 1 - d : -1;
			}
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				fundo(buf, t);
				var c = t % CICLO, cresce = suave((c - 3) / 8), shell = suave((c - 6) / 6), some = c > 13.5 ? 1 - (c - 13.5) / 1.5 : 1;
				var rw = 4 + cresce * 19, rh = 3 + cresce * 19; // do tamanho certo para caber inteira (com a casca) na tela
				// as bolhas (antes do disco, que passa na frente)
				if (c > 3) for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					for (var s = -1; s <= 1; s += 2) {
						var dentro = lobo(x, y, rw, rh, s), lim = B4[(x & 1) + ((y & 1) << 1)];
						if (dentro >= 0) {
							var nivel = dentro < 0.12 ? 0 : dentro < 0.4 ? 1 : 2;
							if (nivel === 0 || lim < (0.9 - dentro) * some) buf[y * L + x] = MAG[nivel + (some < 0.6 ? 1 : 0)];
						} else if (shell > 0) {
							var fora = lobo(x, y, rw * 1.2 * shell + 1, rh * 1.18 * shell + 1, s);
							if (fora >= 0 && fora < 0.1 && lim < 0.6 * some) buf[y * L + x] = TURQ;
						}
					}
				}
				// partículas subindo dentro das bolhas
				if (c > 3) for (var k = 0; k < 40; k++) {
					var f = ((t * 0.35 + k / 40) % 1), lado = k & 1 ? 1 : -1;
					var px = cx + Math.sin(k * 12.9898) * rw * 0.7 * f, py = cy - lado * f * rh * 1.8;
					if (lobo(px, py, rw, rh, lado) > 0.05) pintar(buf, L, A, px, py, hex('#ffd6f6'));
				}
				// o disco da galáxia, de lado, com o miolo dourado
				disco.forEach(function (d) {
					var br = 0.5 + 0.5 * d[2], perto = 1 - Math.min(1, Math.abs(d[0] - cx) / 30);
					pintar(buf, L, A, d[0], d[1], cor(150 + 105 * perto * br, 150 + 70 * br, 200 - 90 * perto));
				});
				for (var yy = -3; yy <= 3; yy++) for (var xx = -6; xx <= 6; xx++) if ((xx * xx) / 36 + (yy * yy) / 9 < 1) pintar(buf, L, A, cx + xx, cy + yy, hex('#ffe9b8'));
				// a nuvem de gás chegando ao centro, o clarão e os jatos
				if (c < 2.6) {
					var nx = cx - 70 + suave(c / 2.6) * 70;
					for (var n = 0; n < 30; n++) pintar(buf, L, A, nx + Math.sin(n * 7.1) * 6 * (1 - c / 3), cy - 6 + Math.cos(n * 3.3) * 3, hex('#ff8ad8'));
				}
				if (c > 2.4 && c < 3.4) { var fl = 1 - Math.abs(c - 2.9) * 2; for (var q = -6; q <= 6; q++) { pintar(buf, L, A, cx + q * fl, cy, hex('#ffffff')); pintar(buf, L, A, cx, cy + q * fl, hex('#ffffff')); } }
				if (c > 2.8 && c < 9) for (var jy = 4; jy < 4 + Math.min(48, (c - 2.8) * 24); jy++) {
					pintar(buf, L, A, cx, cy - jy, hex('#cdf1ff')); pintar(buf, L, A, cx, cy + jy, hex('#cdf1ff'));
				}
				if (hud) {
					var ma = c < 3 ? 4 : Math.max(0, 4 - (c - 3) / 8 * 4);
					hud.ano.textContent = ma <= 0.05 ? 'hoje' : 'há ' + numero(ma, ma < 1 ? 1 : 0).replace(',0', '') + (ma >= 2 ? ' milhões' : ' milhão') + ' de anos';
					hud.estacao.textContent = c < 2.4 ? 'uma nuvem de gás cai no centro' : c < 3.4 ? 'o buraco negro engole a nuvem' : c < 9 ? 'jatos soprando as bolhas' : 'bolhas de 25 mil anos-luz';
				}
			};
		},

		// Nebulosa de Órion: uma nuvem encolhe e gira, acende uma estrela no meio de um disco
		// de poeira, e no disco vão se formando planetas (abrindo "trilhas" sem poeira)
		'orion-disco': function (L, A) {
			var fundo = estrelasFundo(L, A, 67, 50), aleat = semente(71), poeira = [];
			for (var i = 0; i < 520; i++) poeira.push([12 + Math.pow(aleat(), 0.7) * 62, aleat() * Math.PI * 2, aleat()]);
			var PLANETAS = [[20, hex('#c8a07a')], [32, hex('#e8906c')], [46, hex('#e6c49a')], [60, hex('#8fb8ff')]];
			var FUNDO = hex('#0a0616'), CICLO = 16, cx = L / 2, cy = A / 2, incl = 0.28;
			var PO = [hex('#ff8ac0'), hex('#d0607a'), hex('#a8705a'), hex('#6a3a4a')];
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				fundo(buf, t);
				var c = t % CICLO, nuvem = 1 - suave((c - 0.5) / 3), acesa = suave((c - 2.8) / 1.2), forma = suave((c - 6) / 6);
				function desenharPoeira(frente) {
					poeira.forEach(function (p) {
						var r = p[0] * (0.35 + 0.65 * (1 - nuvem * 0.6)), ang = p[1] + t * 2.2 / Math.pow(r / 12, 1.5);
						var sy = Math.sin(ang);
						if ((sy >= 0) !== frente) return;
						// perto de um planeta, a poeira vai sumindo (ele "varre" a trilha dele)
						var limpa = 0;
						PLANETAS.forEach(function (pl) { if (Math.abs(p[0] - pl[0]) < 4) limpa = Math.max(limpa, forma); });
						if (p[2] < limpa) return;
						var x = cx + Math.cos(ang) * r, y = cy + sy * r * (incl + nuvem * 0.7);
						pintar(buf, L, A, x, y, PO[Math.min(3, Math.floor(p[2] * 3 + r / 50))]);
					});
				}
				desenharPoeira(false);
				// a estrela nascendo
				if (acesa > 0) for (var y = -5; y <= 5; y++) for (var x = -5; x <= 5; x++) {
					var d = Math.sqrt(x * x + y * y);
					if (d < 2.2 * acesa + 0.5) pintar(buf, L, A, cx + x, cy + y, hex('#fffbe0'));
					else if (d < 4.5 * acesa && B4[(x & 1) + ((y & 1) << 1)] < 0.6) pintar(buf, L, A, cx + x, cy + y, hex('#ffd36a'));
				}
				// os planetas
				PLANETAS.forEach(function (pl, n) {
					if (forma <= 0) return;
					var ang = n * 1.7 + t * 2.2 / Math.pow(pl[0] / 12, 1.5), sy = Math.sin(ang);
					var x = cx + Math.cos(ang) * pl[0], y = cy + sy * pl[0] * incl, tam = forma * (n === 2 ? 2.4 : 1.6);
					for (var yy = -2; yy <= 2; yy++) for (var xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= tam * tam) pintar(buf, L, A, x + xx, y + yy, pl[1]);
				});
				desenharPoeira(true);
				if (hud) {
					hud.ano.textContent = c < 2.8 ? numero(Math.round(c / 2.8 * 100), 0) + ' mil anos' : c < 6 ? numero(0.1 + (c - 2.8) / 3.2 * 0.9, 1) + ' milhão de anos' : numero(Math.min(10, 1 + (c - 6) / 6 * 9), 0) + ' milhões de anos';
					hud.estacao.textContent = c < 2.8 ? 'a nuvem encolhe e gira' : c < 6 ? 'uma estrela acende no disco' : c < 12 ? 'planetas se formando' : 'um novo sistema solar';
				}
			};
		},

		// Plêiades: a família de estrelas azuis vai se espalhando, puxada pela galáxia
		'pleiades-separa': function (L, A) {
			var fundo = estrelasFundo(L, A, 83, 50), aleat = semente(89), irmas = [];
			var cx = L / 2, cy = A / 2, CICLO = 16;
			for (var i = 0; i < 16; i++) {
				var r = Math.sqrt(aleat()) * 22, an = aleat() * Math.PI * 2, x = cx + Math.cos(an) * r * 1.2, y = cy + Math.sin(an) * r * 0.8;
				var va = aleat() * Math.PI * 2, vel = 45 + aleat() * 60;
				irmas.push({ x: x, y: y, vx: Math.cos(va) * vel + (y - cy) * 2, vy: Math.sin(va) * vel * 0.6, grande: i < 7 });
			}
			// a névoa: fiapos (ondas suaves) com um pontilhado solto, sem cara de grade
			var NEVOA = new Float32Array(L * A);
			for (var py = 0; py < A; py++) for (var px = 0; px < L; px++) {
				var onda = 0.5 + 0.3 * Math.sin(px * 0.11 + py * 0.05) + 0.2 * Math.sin(px * 0.04 - py * 0.19 + 1.3);
				NEVOA[py * L + px] = onda * 0.45 - aleat() * 0.35;
			}
			var FUNDO = hex('#060a1e');
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				fundo(buf, t);
				var c = t % CICLO, k = suave((c - 2) / 11), apaga = c > 15 ? (c - 15) : 0;
				// a névoa azul em volta, que fica para trás
				var nevoa = (1 - k) * (1 - apaga);
				if (nevoa > 0.05) for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var dx = (x - cx) / 44, dy = (y - cy) / 28, d = dx * dx + dy * dy;
					var n = d < 1 ? NEVOA[y * L + x] * (1 - d) * nevoa : 0;
					if (n > 0.12) buf[y * L + x] = n > 0.2 ? hex('#2a4f9a') : hex('#18306a');
				}
				irmas.forEach(function (s) {
					var x = s.x + s.vx * k, y = s.y + s.vy * k, br = 1 - apaga;
					if (br <= 0) return;
					var brilho = cor(200 * br + 30, 225 * br + 20, 255 * br);
					pintar(buf, L, A, x, y, brilho);
					if (s.grande) {
						var raio = cor(110 * br, 160 * br, 255 * br);
						[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pintar(buf, L, A, x + d[0], y + d[1], raio); });
						if (Math.sin(t * 2 + s.x) > 0.3) [[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(function (d) { pintar(buf, L, A, x + d[0], y + d[1], cor(60 * br, 100 * br, 200 * br)); });
					}
				});
				if (hud) {
					hud.ano.textContent = k < 0.02 ? 'hoje' : 'daqui a ' + numero(Math.round(k * 250 / 10) * 10, 0) + ' milhões de anos';
					hud.estacao.textContent = k < 0.3 ? 'irmãs juntas' : k < 0.7 ? 'se afastando' : 'cada uma no seu caminho';
				}
			};
		},

		// Nebulosa da Hélice: a estrela incha (gigante vermelha), solta as camadas de fora num
		// anel colorido que vai se abrindo e, no meio, sobra uma anã branca acendendo o gás
		'helice-morte': function (L, A) {
			var fundo = estrelasFundo(L, A, 97, 60), cx = L / 2, cy = A / 2 + 2, CICLO = 17;
			var MEIO = [hex('#e8fff8'), hex('#a8f4e8'), hex('#5fd6d0'), hex('#2f9aa8'), hex('#1a5a6a'), hex('#103440')];
			var ANEL = [hex('#ffe8b0'), hex('#ffc070'), hex('#ff8a4a'), hex('#e8503a'), hex('#a8283a'), hex('#5a1428')];
			function mistura(a, b, k) { return cor(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k); }
			return function (buf, t, hud) {
				buf.fill(hex('#06040f'));
				fundo(buf, t);
				var c = t % CICLO, incha = suave((c - 2.5) / 3.2), solta = suave((c - 6) / 1.6), abre = suave((c - 6.4) / 7.5), apaga = c > 15.4 ? suave((c - 15.4) / 1.6) : 0;
				var vivo = 1 - apaga;
				// a nebulosa: um "olho" com a borda irregular, que vai se abrindo
				if (c > 6) {
					var Ra = 14 + abre * 34, esp = 4 + abre * 11;
					for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
						var dx = x - cx, dy = (y - cy) / 0.84, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx), lim = B4[(x & 1) + ((y & 1) << 1)];
						var torto = ruido2d(Math.cos(a) * 3 + 5, Math.sin(a) * 3 + t * 0.05) * 0.1 - 0.05; // a borda não é um círculo perfeito
						var Rn = Ra * (1 + torto), dentro = Rn - esp;
						var k = y * L + x;
						if (d < dentro) { // o miolo azul-esverdeado, mais claro perto da anã branca
							var g = Math.pow(1 - d / dentro, 0.8) * vivo * (0.55 + abre * 0.45) + ruido2d(x * 0.12, y * 0.12 + t * 0.1) * 0.25;
							var n = Math.floor((1 - g) * 5.5 + lim * 0.7);
							if (n < 5 || lim < 0.3 * vivo) buf[k] = MEIO[Math.max(0, Math.min(5, n))];
						} else if (d < Rn + esp * 0.35) { // o anel: amarelo na borda de dentro, vermelho por fora, em grumos
							var f = (d - dentro) / (esp * 1.35), grumo = ruido2d(Math.cos(a) * 6 + d * 0.15, Math.sin(a) * 6 + t * 0.08);
							var m2 = Math.floor(f * 5.2 + (0.5 - grumo) * 1.6 + lim * 0.6 + apaga * 2);
							if (m2 < 6) buf[k] = ANEL[Math.max(0, Math.min(5, m2))];
							// os nós cometários: raiozinhos claros saindo da borda de dentro
							if (f < 0.3 && Math.sin(a * 46 + grumo * 4) > 0.86 && vivo > 0.4) buf[k] = f < 0.12 ? hex('#fff6e0') : hex('#ffd0a0');
						} else if (d < Rn + esp * 0.35 + 9) { // um halo vermelho bem fraquinho em volta
							var h = 1 - (d - Rn - esp * 0.35) / 9;
							if (lim < h * 0.35 * vivo * abre) buf[k] = hex('#5a1428');
						}
					}
				}
				// as camadas de fora sendo sopradas: nuvens irregulares saindo da gigante vermelha
				if (c > 5.6 && c < 9) {
					var sopro = (c - 5.6) / 3.4;
					for (var q = 0; q < 70; q++) {
						var aq = q * 2.39996, rq = 22 + sopro * 30 * (0.7 + ruido2d(q * 0.7, 3) * 0.6);
						pintar(buf, L, A, cx + Math.cos(aq) * rq, cy + Math.sin(aq) * rq * 0.84, sopro < 0.6 ? hex('#ff8a4a') : hex('#c83a3a'));
					}
				}
				// a estrela: amarela fervendo, depois a gigante vermelha turbulenta, depois a anã branca
				var R = c < 6 ? 6 + incha * 20 : 26 * (1 - solta) + 2.2 * solta;
				var base = c < 6 ? [255, 236 - incha * 140, 150 - incha * 110] : [235 + solta * 20, 96 + solta * 150, 40 + solta * 215];
				for (var yy = -Math.ceil(R) - 1; yy <= R + 1; yy++) for (var xx = -Math.ceil(R) - 1; xx <= R + 1; xx++) {
					var dd = Math.sqrt(xx * xx + yy * yy), ferve = ruido2d(xx * 0.35 + t * 0.6, yy * 0.35 - t * 0.4);
					var borda = R + (R > 5 ? (ferve - 0.5) * 2.4 : 0);
					if (dd > borda) continue;
					var luz = (1 - (dd / Math.max(1, R)) * 0.45) * (0.75 + ferve * 0.4);
					pintar(buf, L, A, cx + xx, cy + yy, cor(Math.min(255, base[0] * luz), Math.min(255, base[1] * luz), Math.min(255, base[2] * luz)));
				}
				// o brilho azulado da anã branca
				if (c > 7) for (var s = 2; s <= 4; s++) [[-s, 0], [s, 0], [0, -s], [0, s]].forEach(function (p) { pintar(buf, L, A, cx + p[0], cy + p[1], s < 4 ? hex('#bff6ff') : hex('#5fd6d0')); });
				if (hud) {
					hud.ano.textContent = c < 2.5 ? 'estrela como o Sol' : c < 6 ? 'gigante vermelha' : c < 8 ? 'solta as camadas' : 'nebulosa planetária';
					hud.estacao.textContent = c < 2.5 ? 'bilhões de anos' : c < 6 ? 'o combustível acaba' : c < 15.4 ? 'há ' + numero(Math.max(1, Math.round((c - 6) / 9.4 * 10)), 0) + ' mil anos' : 'o gás se espalha';
				}
			};
		},

		// Estrela de Tabby: uma nuvem de poeira passa na frente da estrela, e o gráfico mostra a
		// luz azul caindo mais que a vermelha (como a poeira faz; um painel sólido não faria)
		'tabby-cores': function (L, A) {
			var fundo = estrelasFundo(L, A, 113, 40), aleat = semente(127), graos = [];
			for (var i = 0; i < 320; i++) { var gr = Math.sqrt(aleat()), ga = aleat() * Math.PI * 2; graos.push([Math.cos(ga) * gr * 26, Math.sin(ga) * gr * 17, aleat()]); }
			var FUNDO = hex('#08060f'), sx = 46, sy = 52, R = 17, CICLO = 9;
			var g0 = 104, g1 = 194, gt = 16, gb = 92; // a área do gráfico
			function cobre(tt) { // quanto da estrela a poeira cobre (0 a 1)
				var xc = -30 + ((tt % CICLO) / CICLO) * 150, d = Math.abs(xc - sx) / 34;
				return d < 1 ? Math.pow(1 - d * d, 1.5) * (0.8 + 0.2 * Math.sin(tt * 2.3)) : 0;
			}
			function yDo(b) { return gt + (1 - b) / 0.25 * (gb - gt); } // 100% em cima, 75% embaixo
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				fundo(buf, t);
				var k = cobre(t), luz = 1 - k * 0.2;
				// a estrela, escurecendo um pouco
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d = Math.sqrt(x * x + y * y);
					if (d > R) continue;
					var l = (1 - d / R * 0.35) * luz;
					pintar(buf, L, A, sx + x, sy + y, cor(255 * l, (205 - d * 3) * l, (110 - d * 3) * l));
				}
				// a nuvem de poeira passando (grãos marrons, mais densos no meio)
				var xc = -30 + ((t % CICLO) / CICLO) * 150;
				graos.forEach(function (g) {
					pintar(buf, L, A, xc + g[0], sy + g[1] + Math.sin(g[0] * 0.3 + t) * 2, g[2] > 0.7 ? hex('#6a4a3a') : hex('#3e2c2a'));
				});
				// o gráfico: linhas de 100% e 75%, e as duas cores do brilho (o tempo corre para a esquerda)
				for (var gx = g0; gx <= g1; gx++) { if (gx % 3 === 0) { pintar(buf, L, A, gx, gt, hex('#2a2a50')); pintar(buf, L, A, gx, gb, hex('#2a2a50')); } }
				for (var gy = gt; gy <= gb; gy++) pintar(buf, L, A, g0 - 1, gy, hex('#3a3a6a'));
				for (gx = g0; gx <= g1; gx++) {
					var kk = cobre(t - (g1 - gx) * 0.05);
					pintar(buf, L, A, gx, yDo(1 - kk * 0.13), hex('#ff6a5a'));
					pintar(buf, L, A, gx, yDo(1 - kk * 0.22), hex('#6fb0ff'));
				}
				if (hud) {
					hud.ano.textContent = 'azul: ' + Math.round((1 - k * 0.22) * 100) + '%';
					hud.estacao.textContent = 'vermelho: ' + Math.round((1 - k * 0.13) * 100) + '%';
				}
			};
		},

		// Omega Centauri na contramão: a Via Láctea vista de cima, girando num sentido, e o
		// aglomerado dando a volta no sentido contrário, numa órbita inclinada, por fora do disco
		'omega-contramao': function (L, A) {
			var fundo = estrelasFundo(L, A, 131, 40), aleat = semente(137), disco = [];
			var cx = L / 2, cy = A / 2, achata = 0.55;
			for (var i = 0; i < 600; i++) {
				var r = 6 + Math.pow(aleat(), 0.8) * 58, braco = aleat() < 0.5 ? 0 : Math.PI;
				var an = braco + Math.log(r / 6) * 1.6 + (aleat() - 0.5) * 1.3;
				disco.push([r, an, aleat()]);
			}
			var FUNDO = hex('#07051a');
			return function (buf, t, hud) {
				buf.fill(FUNDO);
				fundo(buf, t);
				// Omega Centauri: órbita inclinada (passa por trás e pela frente do disco)
				var ao = -t * 0.55, ox = Math.cos(ao) * 82, oz = Math.sin(ao), oy = oz * 30 - Math.cos(ao) * 10;
				var atras = oz < 0;
				function omega() {
					for (var j = 1; j <= 18; j++) { var aj = ao + j * 0.05; pintar(buf, L, A, cx + Math.cos(aj) * 82, cy + Math.sin(aj) * 30 - Math.cos(aj) * 10, cor(120 - j * 5, 100 - j * 4, 40)); }
					var x0 = Math.round(cx + ox), y0 = Math.round(cy + oy);
					for (var y = -2; y <= 2; y++) for (var x = -2; x <= 2; x++) if (x * x + y * y <= 5) pintar(buf, L, A, x0 + x, y0 + y, x * x + y * y < 2 ? hex('#fff1b8') : hex('#ffc65a'));
				}
				if (atras) omega();
				// o disco girando (as estrelas de dentro dão a volta mais depressa)
				disco.forEach(function (d) {
					var a = d[1] + t * 0.9 * (12 / (d[0] + 6)), x = cx + Math.cos(a) * d[0], y = cy + Math.sin(a) * d[0] * achata;
					var quente = Math.max(0, 1 - d[0] / 22);
					pintar(buf, L, A, x, y, cor(150 + 100 * quente + 40 * d[2], 160 + 60 * quente + 40 * d[2], 230 - 80 * quente));
				});
				for (var yy = -4; yy <= 4; yy++) for (var xx = -6; xx <= 6; xx++) if ((xx * xx) / 36 + (yy * yy) / 16 < 1) pintar(buf, L, A, cx + xx, cy + yy, hex('#ffe9b8'));
				if (!atras) omega();
			};
		},

		// ---------- Segundas animações dos planetas ----------
		// Mercúrio de perto, com o Sol à esquerda: o pontinho vermelho gira com o planeta e o
		// termômetro mostra a temperatura lá, do calor do dia ao frio da noite
		'mercurio-calor': function (L, A) {
			var fundo = estrelasFundo(L, A, 7, 50), cx = 74, cy = A / 2 + 6, R = 36;
			var CINZA = [hex('#f0ecf6'), hex('#d4cee2'), hex('#b0a8c4'), hex('#8a83a0'), hex('#5e5876'), hex('#3a3654'), hex('#221e36')];
			return function (buf, t, hud) {
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// a luz do Sol chegando pela esquerda, sumindo num pontilhado
				for (var y = 0; y < A; y++) for (var x = 0; x < 26; x++) { var fl = (26 - x) / 26; if (B4[(x & 1) + ((y & 1) << 1)] < fl * fl * 0.9) pintar(buf, L, A, x, y, fl > 0.6 ? hex('#ffd36a') : hex('#c87a2a')); }
				var lam = (t / 16) * Math.PI * 2;
				for (y = -R; y <= R; y++) for (x = -R; x <= R; x++) {
					if (x * x + y * y > R * R) continue;
					var nx = x / R, ny = y / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
					var luz = -nx * 0.9 + nz * 0.25, lim = B4[(x & 1) + ((y & 1) << 1)];
					var lon = Math.atan2(nx, nz) - lam, lat = Math.asin(ny);
					var nivel = luz > 0.04 ? Math.round((1 - luz) * 2.4 + lim * 0.8) : 5 + (lim > 0.6 ? 1 : 0);
					if (Math.sin(lon * 5 + 1) * Math.cos(lat * 6) > 0.72) nivel += 1; // crateras
					pintar(buf, L, A, cx + x, cy + y, CINZA[Math.max(0, Math.min(6, nivel))]);
				}
				// o pontinho no equador, girando com o planeta
				var px = cx + Math.sin(lam) * R, frente = Math.cos(lam) > 0, sol = -Math.sin(lam);
				var temp = sol > 0 ? -180 + 610 * Math.pow(sol, 0.4) : -180;
				if (frente) {
					for (var f = 0; f <= 5; f++) pintar(buf, L, A, px, cy - f, hex('#ffffff'));
					[[1, -5], [2, -5], [1, -4], [2, -4], [3, -5]].forEach(function (q) { pintar(buf, L, A, px + q[0], cy + q[1], hex('#ff4a5a')); });
				}
				// o termômetro (de −180 °C a 430 °C), com a marca do zero
				var tx = 176, topo = 14, base = 98, alto = (temp + 180) / 610;
				for (y = topo; y <= base; y++) { pintar(buf, L, A, tx - 1, y, hex('#4a4280')); pintar(buf, L, A, tx + 5, y, hex('#4a4280')); }
				for (x = tx - 1; x <= tx + 5; x++) { pintar(buf, L, A, x, topo, hex('#4a4280')); pintar(buf, L, A, x, base, hex('#4a4280')); }
				var cheio = Math.round(base - 1 - alto * (base - topo - 2));
				for (y = cheio; y < base; y++) for (x = tx; x <= tx + 4; x++) pintar(buf, L, A, x, y, cor(80 + 175 * alto, 120 - 40 * alto, 255 - 200 * alto));
				var zero = Math.round(base - 1 - (180 / 610) * (base - topo - 2));
				for (x = tx - 4; x < tx - 1; x++) pintar(buf, L, A, x, zero, hex('#cdbfff'));
				if (hud) {
					hud.ano.textContent = 'dia ' + Math.floor((t / 16) * 176) + ' de 176';
					var graus = Math.round(temp / 10) * 10;
					hud.estacao.textContent = (graus < 0 ? '−' + Math.abs(graus) : graus) + ' °C no pontinho' + (frente ? '' : ' (atrás)');
				}
			};
		},

		// Vênus: a luz do Sol atravessa as nuvens e esquenta o chão; o calor tenta sair, mas a
		// atmosfera grossa devolve tudo para baixo, e o chão vai esquentando até 465 °C
		'venus-estufa': function (L, A) {
			var fundo = estrelasFundo(L, A, 9, 30), CICLO = 12, N = 34, NUV0 = 18, NUV1 = 38, CHAO = A - 14;
			var aleat = semente(91), fotons = [];
			for (var i = 0; i < N; i++) fotons.push({ x: 8 + aleat() * (L - 50), nasce: i * 0.27, fase: aleat() * 6, vai: 0.9 + aleat() * 0.8 });
			return function (buf, t, hud) {
				var c = t % CICLO, presos = 0;
				fotons.forEach(function (f) { if (c - f.nasce >= 1) presos++; });
				var calor = Math.min(1, presos / N * 1.15), temp = 20 + 445 * calor;
				buf.fill(hex('#07051a'));
				fundo(buf, t); // as estrelas: só aparecem no espaço, acima das nuvens
				for (var y = NUV0; y < A; y++) for (var x = 0; x < L; x++) {
					var lim = B4[(x & 1) + ((y & 1) << 1)], k = y * L + x;
					if (y < NUV1) { // as nuvens amarelas, andando
						var n = Math.sin(x * 0.18 + t * 0.8 + y * 0.4) + Math.sin(x * 0.07 - t * 0.5);
						buf[k] = n + lim > 1.2 ? hex('#fff0b8') : n + lim > 0.2 ? hex('#f0cc6a') : hex('#c89a3a');
					} else if (y < CHAO) { // o ar grosso e alaranjado embaixo das nuvens, mais quente perto do chão
						var q = (y - NUV1) / (CHAO - NUV1);
						buf[k] = q > 0.8 && calor * 0.6 + lim * 0.5 > 0.55 ? hex('#7a3418') : q + lim * 0.25 > 0.6 ? hex('#4a2010') : hex('#341610');
					} else { // o chão, com rachaduras que brilham com o calor
						var racha = Math.sin(x * 0.5 + Math.sin(y * 1.3) * 2) > 0.85;
						buf[k] = racha ? (calor > 0.4 ? (calor > 0.8 ? hex('#ffd36a') : hex('#ff7a2a')) : hex('#4a2a1a')) : lim > 0.5 ? hex('#7a4a2a') : hex('#5e3620');
					}
				}
				fotons.forEach(function (f) {
					var idade = c - f.nasce;
					if (idade < 0) return;
					if (idade < 1) { // a luz do Sol descendo (amarela)
						var yy = idade * CHAO, xx = f.x + idade * 6;
						[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (s) { pintar(buf, L, A, xx + s[0], yy + s[1], hex('#fffbe0')); });
						for (var r = 1; r <= 5; r++) pintar(buf, L, A, xx - r * 0.25, yy - r, r < 3 ? hex('#ffd36a') : hex('#c89a3a'));
						return;
					}
					// o calor (vermelho) sobe e desce, preso entre o chão e as nuvens
					var k2 = ((idade - 1) / f.vai) % 1, sobe = k2 < 0.5 ? k2 * 2 : 2 - k2 * 2;
					var yc = CHAO - 2 - sobe * (CHAO - NUV1 - 3), xc = f.x + 6 + Math.sin(idade * 1.7 + f.fase) * 8;
					[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (s) { pintar(buf, L, A, xc + s[0], yc + s[1], hex('#ff6a3a')); });
					// um rastrinho ondulado mostrando para onde ele vai
					for (var w = 1; w <= 3; w++) pintar(buf, L, A, xc + Math.round(Math.sin(idade * 8 + w)), yc + (k2 < 0.5 ? 1 + w : -w), hex('#a83a2a'));
				});
				// termômetro
				var tx = 188, topo = NUV1 + 2, base = A - 2, alto = (temp - 20) / 445;
				for (y = topo; y <= base; y++) { pintar(buf, L, A, tx - 1, y, hex('#cdbfff')); pintar(buf, L, A, tx + 4, y, hex('#cdbfff')); }
				var cheio = Math.round(base - 1 - alto * (base - topo - 2));
				for (y = cheio; y < base; y++) for (x = tx; x <= tx + 3; x++) pintar(buf, L, A, x, y, hex('#ff5a3a'));
				if (hud) {
					hud.ano.textContent = Math.round(temp / 5) * 5 + ' °C no chão';
					hud.estacao.textContent = c < 1.2 ? 'a luz do Sol entra' : calor < 0.6 ? 'o calor não consegue sair' : 'quente de derreter chumbo';
				}
			};
		},

		// A Lua dando a volta na Terra, vista de cima (o Sol está à esquerda), e ao lado como
		// ela aparece no céu do Brasil: a parte iluminada muda a cada noite
		'terra-lua': function (L, A) {
			var fundo = estrelasFundo(L, A, 33, 60), cx = 52, cy = A / 2 + 4, ro = 34, CICLO = 14;
			var MAR = [hex('#bfe0ff'), hex('#8fc0ff'), hex('#5f9fe8'), hex('#3a6fc0'), hex('#244a8a'), hex('#17305e'), hex('#0e1c3a')];
			var LUA = [hex('#f4f2fa'), hex('#d8d4e4'), hex('#b8b2c8'), hex('#8e889e')];
			return function (buf, t, hud) {
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				for (var y = 0; y < A; y++) for (var x = 0; x < 10; x++) if (B4[(x & 1) + ((y & 1) << 1)] < (10 - x) / 14) pintar(buf, L, A, x, y, hex('#ffd36a'));
				for (var a = 0, n = 0; a < Math.PI * 2; a += 0.05, n++) if (n % 2 === 0) pintar(buf, L, A, cx + Math.cos(a) * ro, cy + Math.sin(a) * ro, hex('#4a4280'));
				var fase = ((t % CICLO) / CICLO) * Math.PI * 2, ang = Math.PI - fase; // lua nova do lado do Sol
				globoLuz(buf, L, A, cx, cy, 7, -1, 0, MAR);
				var mx = Math.round(cx + Math.cos(ang) * ro), my = Math.round(cy + Math.sin(ang) * ro);
				for (y = -3; y <= 3; y++) for (x = -3; x <= 3; x++) if (x * x + y * y <= 10) pintar(buf, L, A, mx + x, my + y, x < 0 ? LUA[1] : hex('#2a2640'));
				// a divisória e a Lua grande, como se vê daqui (no Brasil, a crescente acende pela esquerda)
				for (y = 6; y < A - 6; y += 2) pintar(buf, L, A, 104, y, hex('#3a3270'));
				var R = 25, lx = 152, ly = cy, Sx = -Math.sin(fase), Sz = -Math.cos(fase);
				for (y = -R; y <= R; y++) for (x = -R; x <= R; x++) {
					if (x * x + y * y > R * R) continue;
					var nx = x / R, ny = y / R, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
					var acesa = nx * Sx + nz * Sz, mar = Math.sin(x * 0.25 + 1) * Math.cos(y * 0.3 - 0.5) > 0.45;
					var c = acesa > 0.02 ? LUA[Math.min(3, (mar ? 2 : 0) + (B4[(x & 1) + ((y & 1) << 1)] > 0.6 ? 1 : 0))] : acesa > -0.06 && B4[(x & 1) + ((y & 1) << 1)] > 0.4 ? LUA[3] : hex('#1c1830');
					pintar(buf, L, A, lx + x, ly + y, c);
				}
				if (hud) {
					var f = fase, nome = f < 0.25 || f > 6.03 ? 'lua nova' : f < 1.32 ? 'lua crescente' : f < 1.82 ? 'quarto crescente' : f < 2.9 ? 'crescente, quase cheia' : f < 3.39 ? 'lua cheia' : f < 4.46 ? 'minguante' : f < 4.96 ? 'quarto minguante' : 'minguante, quase nova';
					hud.ano.textContent = 'dia ' + Math.floor((t % CICLO) / CICLO * 29.5) + ' de 29';
					hud.estacao.textContent = nome;
				}
			};
		},

		// Marte e a Terra dando a volta no Sol (o mesmo cenário de Urano): a Terra, mais perto,
		// dá quase duas voltas enquanto Marte dá uma (687 dias)
		'marte-ano': function (L, A) {
			var O = cenarioOrbita(L, A, 15), CICLO = 15, PT = CICLO * 365 / 687;
			var VERMELHO = [hex('#ffc8a0'), hex('#f0a070'), hex('#d8784a'), hex('#b85a36'), hex('#8a4028'), hex('#5a2a1c'), hex('#2e1610')];
			var AZUL = [hex('#bfe0ff'), hex('#8fc0ff'), hex('#5f9fe8'), hex('#3a6fc0'), hex('#244a8a'), hex('#17305e'), hex('#0e1c3a')];
			return function (buf, t, hud) {
				O.fundo(buf);
				O.orbita(buf, 1);
				O.orbita(buf, 0.6, hex('#3f5fa8'));
				var am = (t / CICLO) * Math.PI * 2, at = (t / PT) * Math.PI * 2;
				var pm = O.pos(am, 1), pt = O.pos(at, 0.6);
				// no estilo de Urano: os dois com o eixo inclinado, o polo norte marcado e manchas
				// girando junto (o dia de Marte é quase igual ao da Terra); a setinha só em Marte
				var dia = (t / 1.6) * Math.PI * 2;
				var corpos = [
					{ atras: O.atras(am), z: Math.sin(am), d: function () { globoGirando(buf, L, A, Math.round(pm[0]), Math.round(pm[1]), { R: 8, inc: 25, giro: dia * 0.97, luz: [O.cx - pm[0], O.cy - pm[1]], PAL: VERMELHO, manchas: [[0.2, 0.4, 0.45], [-0.3, 2.8, 0.5], [0.4, 4.6, 0.35]], manchaPAL: VERMELHO.slice(2).concat([VERMELHO[6], VERMELHO[6]]) }); } },
					{ atras: O.atras(at), z: Math.sin(at) * 0.6, d: function () { globoGirando(buf, L, A, Math.round(pt[0]), Math.round(pt[1]), { R: 5, inc: 23, giro: dia, luz: [O.cx - pt[0], O.cy - pt[1]], PAL: AZUL, manchas: [[0.3, 0.3, 0.6], [-0.3, 2.6, 0.6]], manchaPAL: [hex('#c8e89a'), hex('#9fd07a'), hex('#7fbf5a'), hex('#5f9a44'), hex('#3f6a36'), hex('#244a22'), hex('#163018')], calotas: true, seta: false }); } }
				];
				corpos.filter(function (c) { return c.atras; }).sort(function (a, b) { return a.z - b.z; }).forEach(function (c) { c.d(); });
				O.sol(buf);
				corpos.filter(function (c) { return !c.atras; }).sort(function (a, b) { return a.z - b.z; }).forEach(function (c) { c.d(); });
				if (hud) {
					var voltas = Math.floor(t / PT);
					hud.ano.textContent = 'dia ' + Math.floor((t / CICLO) * 687) + ' de 687';
					hud.estacao.textContent = 'a Terra já deu ' + voltas + (voltas === 1 ? ' volta' : ' voltas');
				}
			};
		},

		// A Grande Mancha Vermelha de Júpiter encolhendo desde 1879, com Terras para comparar
		'jupiter-mancha': function (L, A) {
			var CICLO = 14, cx = L / 2, cy = A / 2 + 6, PXKM = 150 / 39000;
			var FAIXAS = [hex('#f5ead6'), hex('#e6d0b0'), hex('#c8a480'), hex('#a87a58'), hex('#7a5440')];
			var MANCHA = [hex('#f0b090'), hex('#e0805a'), hex('#c85a3a'), hex('#a8402e'), hex('#7a2c22')];
			return function (buf, t, hud) {
				var c = t % CICLO, k = suave(c / 11), km = 39000 - 25000 * k;
				var a = km * PXKM / 2, b = a * 0.42;
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var lim = B4[(x & 1) + ((y & 1) << 1)], faixa = Math.floor((y + 4) / 14), vel = (faixa % 2 ? 1 : -1) * (6 + faixa * 1.5);
					var u = x + t * vel, onda = Math.sin(u * 0.09 + y * 0.35 + faixa) + Math.sin(u * 0.03 - faixa * 2) * 0.6;
					var dx = (x - cx) / a, dy = (y - cy) / b, r = Math.sqrt(dx * dx + dy * dy), cc;
					if (r < 1) { // a mancha, girando (mais rápido na borda)
						var giro = Math.atan2(dy, dx) - t * (0.6 + r * 0.8);
						var n = Math.floor(r * 3.2 + Math.sin(giro * 3 + r * 6) * 0.7 + lim * 0.8);
						cc = MANCHA[Math.max(0, Math.min(4, n))];
					} else if (r < 1.18) cc = FAIXAS[lim > 0.5 ? 0 : 1]; // a borda clara em volta
					else cc = FAIXAS[Math.max(0, Math.min(4, (faixa % 2 ? 2 : 0) + Math.round(onda * 0.7 + lim * 0.6)))];
					buf[y * L + x] = cc;
				}
				// Terras (círculos pontilhados azuis) lado a lado na largura da mancha
				var terras = km / 12742, raio = 12742 * PXKM / 2, m = Math.max(1, Math.round(terras));
				for (var i = 0; i < m; i++) {
					var ex = cx - (m - 1) * raio + i * raio * 2;
					for (var ty = -raio; ty <= raio; ty++) for (var tx = -raio; tx <= raio; tx++) {
						if (tx * tx + ty * ty > raio * raio) continue;
						var px2 = Math.round(ex + tx), py2 = Math.round(cy + ty);
						if (B4[(px2 & 1) + ((py2 & 1) << 1)] < 0.3) pintar(buf, L, A, px2, py2, hex('#3f7fd8')); // a Terra "transparente", em pontilhado
					}
					for (var q = 0; q < Math.PI * 2; q += 0.06) pintar(buf, L, A, ex + Math.cos(q) * raio, cy + Math.sin(q) * raio, hex('#d8f0ff'));
				}
				if (hud) {
					hud.ano.textContent = 'ano ' + (1879 + Math.round(k * 145));
					hud.estacao.textContent = 'cabem ' + numero(terras, 1) + ' Terras lado a lado';
				}
			};
		},

		// Saturno numa banheira gigante: a Terra afunda rapidinho, Júpiter afunda devagar e
		// Saturno, menos denso que a água, fica boiando
		'saturno-flutua': function (L, A) {
			var CICLO = 12, AGUA = 50, FUNDO_T = A - 6;
			var PLAN = [
				{ x: 40, R: 6, cor: [hex('#8fc0ff'), hex('#3a6fc0'), hex('#7fbf5a')], ate: function (c) { return AGUA + 6 + (FUNDO_T - 6 - AGUA - 6) * suave((c - 1) / 1.4); } },
				{ x: 100, R: 11, cor: [hex('#f5ead6'), hex('#c8a480'), hex('#a87a58')], ate: function (c) { return AGUA + 11 + (FUNDO_T - 11 - AGUA - 11) * suave((c - 1) / 7); } },
				{ x: 158, R: 11, anel: true, cor: [hex('#fff0c8'), hex('#e3c07a'), hex('#c89a5a')], ate: function (c) { return AGUA + 3 + Math.sin((c - 1) * 4) * 4 * Math.exp(-(c - 1) * 0.6); } }
			];
			return function (buf, t, hud) {
				var c = t % CICLO;
				buf.fill(hex('#0b0820'));
				// a banheira
				for (var y = 12; y < A; y++) { pintar(buf, L, A, 6, y, hex('#cdbfff')); pintar(buf, L, A, L - 7, y, hex('#cdbfff')); }
				for (var x = 6; x < L - 6; x++) pintar(buf, L, A, x, FUNDO_T + 1, hex('#cdbfff'));
				for (y = AGUA; y <= FUNDO_T; y++) for (x = 7; x < L - 7; x++) {
					var onda = y === AGUA + Math.round(Math.sin(x * 0.2 + t * 3) * 0.6);
					buf[y * L + x] = onda ? hex('#9fd8ff') : B4[(x & 1) + ((y & 1) << 1)] > 0.6 ? hex('#2a5fae') : hex('#1f4a8a');
				}
				PLAN.forEach(function (p) {
					var py = c < 1 ? -14 + (AGUA - p.R + 14) * (c * c) : p.ate(c);
					for (var yy = -p.R - 4; yy <= p.R + 4; yy++) for (var xx = -p.R - 8; xx <= p.R + 8; xx++) {
						var d = Math.sqrt(xx * xx + yy * yy), anel = p.anel && Math.abs(yy) <= 1 && Math.abs(xx) > p.R - 2 && Math.abs(xx) <= p.R + 7;
						if (d > p.R && !anel) continue;
						var col = anel ? p.cor[0] : p.cor[Math.min(2, Math.floor((xx + yy + p.R * 2) / (p.R * 1.6)) + (Math.sin(yy * 0.9) > 0.6 ? 1 : 0))];
						var sy = Math.round(py + yy), sx = p.x + xx;
						if (sy >= AGUA && B4[(sx & 1) + ((sy & 1) << 1)] > 0.4) col = hex('#3a6fc0'); // embaixo d'água, fica azulado
						pintar(buf, L, A, sx, sy, col);
					}
					// respingos quando cai na água
					if (c > 1 && c < 1.7) for (var s = 0; s < 6; s++) { var f = (c - 1) / 0.7; pintar(buf, L, A, p.x + (s - 2.5) * 5 * f, AGUA - 1 - Math.sin(f * Math.PI) * (6 + s % 3 * 2), hex('#d8f4ff')); }
				});
				if (hud) {
					hud.ano.textContent = 'uma banheira gigante';
					hud.estacao.textContent = c < 1 ? 'soltando na água…' : c < 2.6 ? 'a Terra afunda rapidinho' : c < 8 ? 'Júpiter afunda devagar' : 'Saturno flutua!';
				}
			};
		},

		// Netuno dando a volta no Sol (o mesmo cenário de Urano): achado em 1846, ele só completou
		// a primeira volta desde a descoberta em 2011. O rastro mostra o caminho já feito
		'netuno-ano': function (L, A) {
			var O = cenarioOrbita(L, A, 27), CICLO = 16, A0 = 0.6;
			var AZUL = [hex('#c8dcff'), hex('#9ec4ff'), hex('#6b95ff'), hex('#4a72e0'), hex('#3454b0'), hex('#22367a'), hex('#121c44')];
			return function (buf, t, hud) {
				var k = (t % CICLO) / CICLO, ang = A0 + k * Math.PI * 2, p = O.pos(ang, 1);
				O.fundo(buf);
				O.orbita(buf, 1);
				for (var a = A0; a < ang; a += 0.025) { var q = O.pos(a, 1); pintar(buf, L, A, q[0], q[1], hex('#6b95ff')); } // o caminho já feito
				var d0 = O.pos(A0, 1); // onde ele estava quando foi descoberto
				[[0, -3], [0, -2], [0, 2], [0, 3], [-2, 0], [2, 0]].forEach(function (s) { pintar(buf, L, A, d0[0] + s[0], d0[1] + s[1], hex('#ff5a6a')); });
				// no estilo de Urano: o eixo inclinado 28°, o polo norte marcado, as faixas e a Grande
				// Mancha Escura girando junto (um dia de Netuno a cada 1,5 s) e a setinha do giro
				function netuno() {
					globoGirando(buf, L, A, Math.round(p[0]), Math.round(p[1]), { R: 8, inc: 28, giro: (t / 1.5) * Math.PI * 2, luz: [O.cx - p[0], O.cy - p[1]], PAL: AZUL,
						manchas: [[-0.3, 0.5, 0.32], [0.45, 3.4, 0.22]], manchaPAL: [hex('#22367a'), hex('#22367a'), hex('#1a2a66'), hex('#121c44'), hex('#121c44'), hex('#0a1030'), hex('#0a1030')], faixas: true });
				}
				if (O.atras(ang)) { netuno(); O.sol(buf); } else { O.sol(buf); netuno(); }
				if (hud) {
					var ano = 1846 + Math.floor(k * 165);
					hud.ano.textContent = 'ano ' + ano;
					hud.estacao.textContent = k < 0.05 ? 'descoberto em 1846 (marca vermelha)' : k > 0.95 ? 'primeira volta completa: 2011' : 'a primeira volta desde a descoberta';
				}
			};
		},

		// ---------- O Sol ----------
		// O ciclo de 11 anos: as manchas aparecem e somem; no auge, erupções soltam nuvens de
		// partículas que viajam até a Terra e, ao chegar, acendem auroras nos polos
		'sol-aurora': function (L, A) {
			var fundo = estrelasFundo(L, A, 61, 50), aleat = semente(67), CICLO = 18;
			var scx = -14, scy = A / 2 + 4, SR = 62; // um Sol enorme: só o pedaço da direita cabe na tela
			var ex = 152, ey = A / 2 + 6, ER = 11; // com espaço à direita para as linhas do escudo caberem
			var SOLP = [hex('#fffbe0'), hex('#fff0a0'), hex('#ffd36a'), hex('#ffb347'), hex('#f08a2a'), hex('#c85a1a')];
			var MAR = [hex('#bfe0ff'), hex('#8fc0ff'), hex('#5f9fe8'), hex('#3a6fc0'), hex('#244a8a'), hex('#17305e'), hex('#0e1c3a')];
			var manchas = [];
			for (var i = 0; i < 16; i++) manchas.push([0.25 + aleat() * 0.55, (aleat() - 0.5) * 1.1, aleat(), 1 + (aleat() * 2 | 0)]);
			var particulas = [];
			for (i = 0; i < 90; i++) particulas.push([(aleat() - 0.5) * 1.1, 0.75 + aleat() * 0.4, aleat()]);
			var ERUPCOES = [6.6, 9.8], VIAGEM = 3, AURORA = 2.8;
			// o ponto da borda do Sol de onde sai a erupção
			var bx = scx + SR * Math.cos(-0.18), by = scy + SR * Math.sin(-0.18);
			return function (buf, t, hud) {
				var c = t % CICLO, ano = c / CICLO * 11, ativo = Math.pow(Math.sin(Math.PI * ano / 11), 2);
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// o Sol: granulação fervendo, mais escuro na borda, e a coroa em volta
				for (var y = 0; y < A; y++) for (var x = 0; x < 92; x++) {
					var dx = x - scx, dy = y - scy, d = Math.sqrt(dx * dx + dy * dy), lim = B4[(x & 1) + ((y & 1) << 1)];
					if (d > SR) {
						var coroa = (SR + 14 - d) / 14 + Math.sin(Math.atan2(dy, dx) * 9 + t * 0.6) * 0.15;
						if (coroa > 0 && lim < coroa * 0.55) buf[y * L + x] = coroa > 0.6 ? SOLP[4] : SOLP[5];
						continue;
					}
					var borda = d / SR, grao = Math.sin(x * 0.9 + Math.sin(y * 0.7 + t * 1.3) * 1.5) * Math.cos(y * 0.8 - Math.sin(x * 0.6 - t) * 1.5);
					buf[y * L + x] = SOLP[Math.max(0, Math.min(5, Math.floor(borda * borda * 3.6 + grao * 0.5 + lim * 0.7)))];
				}
				// as manchas: aparecem mais quando o Sol está agitado (miolo escuro e borda marrom)
				manchas.forEach(function (m) {
					if (m[2] > ativo * 1.08) return;
					var ang = m[1] * 0.75, r = SR * (1 - m[0] * 0.55), mx = scx + Math.cos(ang) * r, my = scy + Math.sin(ang) * r;
					for (var yy = -2; yy <= 2; yy++) for (var xx = -2; xx <= 2; xx++) {
						var q = Math.abs(xx) + Math.abs(yy);
						if (q <= m[3]) pintar(buf, L, A, mx + xx, my + yy, q < m[3] ? hex('#4a1e0a') : hex('#a8501a'));
					}
				});
				// a Terra, com o escudo magnético (as linhas), achatado do lado do Sol
				var chegando = 0, aurora = 0;
				ERUPCOES.forEach(function (e0) {
					var dt = c - e0;
					if (dt > VIAGEM && dt < VIAGEM + AURORA) aurora = Math.max(aurora, Math.sin(Math.PI * Math.min(1, (dt - VIAGEM) / AURORA)));
					if (dt > VIAGEM - 0.7 && dt < VIAGEM + 0.6) chegando = 1;
				});
				[17, 23, 30].forEach(function (Lc, n) {
					for (var q = -1.4; q <= 1.4; q += 0.035) {
						var rr = Lc * Math.cos(q) * Math.cos(q);
						if (rr < ER + 1) continue;
						[-1, 1].forEach(function (lado) {
							var xx = lado * rr * Math.cos(q) * (lado < 0 ? 0.72 - chegando * 0.18 : 1.3), yy = rr * Math.sin(q);
							if (Math.round(q * 28) % 2 === 0) pintar(buf, L, A, ex + xx, ey + yy, chegando ? (n === 0 ? hex('#ccffff') : hex('#7fe3ff')) : (n === 0 ? hex('#4a6fb8') : hex('#2e467a')));
						});
					}
				});
				globoLuz(buf, L, A, ex, ey, ER, -1, 0, MAR, function (x, y) { return Math.sin(x * 0.7 + 2) * Math.cos(y * 0.6) > 0.5 ? -1 : 0; });
				// a aurora: cortinas verdes com a ponta rosa saindo de um anel em volta de cada polo
				if (aurora > 0.02) for (var q2 = -0.75; q2 <= 0.75; q2 += 0.07) {
					var alt = Math.round((2 + Math.abs(Math.sin(q2 * 7 + t * 5)) * 4) * aurora * (1 - Math.abs(q2) * 0.6));
					[-1, 1].forEach(function (pol) {
						var nx = Math.sin(q2), ny = pol * Math.cos(q2);
						for (var h = 0; h < alt; h++) pintar(buf, L, A, ex + nx * (ER + 1 + h), ey + ny * (ER * 0.92 + 1 + h), h < alt - 3 ? hex('#3aff8a') : h < alt - 1 ? hex('#b8ffd0') : hex('#ff6ad0'));
					});
				}
				// as erupções: um arco de plasma brilhante na borda e a nuvem de partículas viajando em leque
				ERUPCOES.forEach(function (e0) {
					var dt = c - e0;
					if (dt < -0.6 || dt > VIAGEM + 0.4) return;
					if (dt < 0.9) { // o arco de plasma subindo e explodindo
						var alto = Math.max(0, Math.min(1, (dt + 0.6) / 0.9)) * 10;
						for (var a = 0; a <= Math.PI; a += 0.08) pintar(buf, L, A, bx + 1 + Math.sin(a) * alto, by - 6 + Math.cos(a) * 6, a % 0.32 < 0.16 ? hex('#ffffff') : hex('#ffd36a'));
						if (dt > 0 && dt < 0.4) for (var f = 0; f < 10; f++) pintar(buf, L, A, bx + 4 + Math.cos(f * 0.63) * dt * 26, by - 4 + Math.sin(f * 0.63) * dt * 26, hex('#ffffff'));
					}
					if (dt <= 0) return;
					var k = Math.min(1, dt / VIAGEM), dist = (ex - ER - 6 - bx);
					particulas.forEach(function (p) {
						var r = k * dist * p[1], ang = p[0] * (0.25 + k * 0.45); // o leque vai se abrindo
						var px = bx + Math.cos(ang) * r, py = by + (ey - by) * k + Math.sin(ang) * r;
						if (px > ex - ER - 4) return;
						pintar(buf, L, A, px, py, p[2] > 0.6 ? hex('#ffe6b0') : p[2] > 0.25 ? hex('#ffa04a') : hex('#d8602a'));
					});
				});
				if (hud) {
					var erupcao = ERUPCOES.some(function (e0) { return c - e0 >= -0.4 && c - e0 < 0.5; }), viajando = ERUPCOES.some(function (e0) { return c - e0 >= 0.5 && c - e0 < VIAGEM; });
					hud.ano.textContent = 'ano ' + Math.floor(ano) + ' de 11';
					hud.estacao.textContent = aurora > 0.05 ? 'aurora na Terra!' : erupcao ? 'erupção!' : viajando ? 'partículas a caminho da Terra' : ativo < 0.25 ? 'Sol calmo, poucas manchas' : 'Sol agitado, cheio de manchas';
				}
			};
		},

		// A luz nascendo no centro do Sol fica presa num labirinto por dezenas de milhares de
		// anos; sobe numa bolha de gás até a superfície e, livre, chega à Terra em 8 minutos
		'sol-foton': function (L, A) {
			var fundo = estrelasFundo(L, A, 71, 40), aleat = semente(73), CICLO = 16;
			var scx = 4, scy = A / 2 + 2, SR = 56, NUCLEO = 14, RADIA = 38, ex = 184, ey = A / 2 + 2;
			var MAR = [hex('#bfe0ff'), hex('#8fc0ff'), hex('#5f9fe8'), hex('#3a6fc0'), hex('#244a8a'), hex('#17305e'), hex('#0e1c3a')];
			// o caminho da luz no labirinto: passinhos ao acaso, com um leve empurrão para fora
			var caminho = [[scx + 3, scy]], px = scx + 3, py = scy;
			while (Math.hypot(px - scx, py - scy) < RADIA && caminho.length < 700) {
				var a = aleat() * Math.PI * 2, rr = Math.hypot(px - scx, py - scy) || 1;
				px += Math.cos(a) * 2.6 + (px - scx) / rr * 0.22; py += Math.sin(a) * 2.6 + (py - scy) / rr * 0.22;
				if (px < scx + 2) px = scx + 2;
				py = Math.max(scy - SR + 6, Math.min(scy + SR - 6, py));
				caminho.push([px, py]);
			}
			var saida = caminho[caminho.length - 1], angSaida = Math.atan2(saida[1] - scy, saida[0] - scx);
			var T1 = 8.5, T2 = 10.3, T3 = 13.6;
			return function (buf, t, hud) {
				var c = t % CICLO;
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// o Sol cortado ao meio: núcleo pulsando, zona do labirinto (anéis) e zona das bolhas (fervendo)
				for (var y = 0; y < A; y++) for (var x = 0; x < scx + SR + 10; x++) {
					var dx = x - scx, dy = y - scy, d = Math.sqrt(dx * dx + dy * dy), lim = B4[(x & 1) + ((y & 1) << 1)], col;
					if (d > SR) {
						var coroa = (SR + 9 - d) / 9;
						if (coroa > 0 && lim < coroa * 0.5) buf[y * L + x] = hex('#c85a1a');
						continue;
					}
					if (d < NUCLEO) col = d < NUCLEO * (0.55 + Math.sin(t * 3) * 0.08) ? hex('#ffffff') : hex('#fff0a0');
					else if (d < RADIA) col = Math.sin(d * 1.1 - t * 0.5) + lim * 0.8 > 0.9 ? hex('#ffc65a') : hex('#f0a030');
					else {
						var bolha = Math.sin(Math.atan2(dy, dx) * 10 + Math.sin(d * 0.6 - t * 2.4) * 1.2);
						col = d > SR - 2 ? hex('#ffe08a') : bolha + lim * 0.6 > 0.7 ? hex('#ff8a3a') : bolha > -0.4 ? hex('#d8602a') : hex('#a83a18');
					}
					buf[y * L + x] = col;
				}
				// as linhas que separam as zonas
				for (var q = -Math.PI / 2; q <= Math.PI / 2; q += 0.05) { pintar(buf, L, A, scx + Math.cos(q) * NUCLEO, scy + Math.sin(q) * NUCLEO, hex('#ffffff')); pintar(buf, L, A, scx + Math.cos(q) * RADIA, scy + Math.sin(q) * RADIA, hex('#ffe08a')); }
				// a Terra (pisca quando a luz chega)
				var chegou = c > T3 && c < T3 + 1.2;
				globoLuz(buf, L, A, ex, ey, 8, -1, 0, MAR);
				if (chegou) for (var s2 = 0; s2 < 8; s2++) pintar(buf, L, A, ex - 9 + Math.cos(s2 * 0.8) * (c - T3) * 10, ey + Math.sin(s2 * 0.8) * (c - T3) * 10, hex('#fffbe0'));
				var fx, fy;
				if (c < T1) { // presa no labirinto: o caminho já feito aparece em ciano
					var ate = Math.floor(c / T1 * (caminho.length - 1));
					for (var j = Math.max(1, ate - 140); j <= ate; j++) {
						var p0 = caminho[j - 1], p1 = caminho[j], novo = j > ate - 25;
						for (var m = 0; m <= 1; m += 0.34) pintar(buf, L, A, p0[0] + (p1[0] - p0[0]) * m, p0[1] + (p1[1] - p0[1]) * m, novo ? hex('#bffcff') : hex('#2f9fd8'));
					}
					fx = caminho[ate][0]; fy = caminho[ate][1];
				} else if (c < T2) { // subindo numa bolha de gás até a superfície
					var k = suave((c - T1) / (T2 - T1)), r = RADIA + (SR - RADIA) * k;
					fx = scx + Math.cos(angSaida) * r; fy = scy + Math.sin(angSaida) * r;
					for (var by2 = -3; by2 <= 3; by2++) for (var bx2 = -3; bx2 <= 3; bx2++) if (bx2 * bx2 + by2 * by2 <= 9) pintar(buf, L, A, fx + bx2, fy + by2, hex('#ffb070'));
				} else { // livre: em linha reta até a Terra, deixando um risco de luz
					var k2 = Math.min(1, (c - T2) / (T3 - T2)), sx = scx + Math.cos(angSaida) * SR, sy = scy + Math.sin(angSaida) * SR;
					fx = sx + (ex - 9 - sx) * k2; fy = sy + (ey - sy) * k2;
					for (var w = 1; w < 22; w++) { var kw = Math.max(0, k2 - w * 0.012); pintar(buf, L, A, sx + (ex - 9 - sx) * kw, sy + (ey - sy) * kw, w < 8 ? hex('#fff0a0') : hex('#c89a3a')); }
				}
				// a luz: um pontinho branco com brilho ciano em volta
				[[-1, 0], [2, 0], [0, -1], [1, -1], [0, 2], [1, 2]].forEach(function (s) { pintar(buf, L, A, fx + s[0], fy + s[1], hex('#7fe3ff')); });
				[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (s) { pintar(buf, L, A, fx + s[0], fy + s[1], hex('#ffffff')); });
				if (hud) {
					hud.ano.textContent = c < T1 ? numero(Math.round(c / T1 * 50), 0) + ' mil anos dentro do Sol' : c < T2 ? 'subindo numa bolha de gás' : c < T3 ? numero(Math.min(8, Math.floor((c - T2) / (T3 - T2) * 8)), 0) + ' min viajando' : 'chegou à Terra!';
					hud.estacao.textContent = c < T1 ? 'presa no labirinto' : c < T2 ? 'quase lá fora' : 'só 8 minutos até aqui';
				}
			};
		},

		// ---------- Segundas animações dos destinos ----------
		// Sagittarius A*: raios de luz passando perto do buraco negro. Os de longe só entortam;
		// os que chegam perto demais caem lá dentro e não voltam mais
		'sgr-luz': function (L, A) {
			var fundo = estrelasFundo(L, A, 79, 50), cx = 112, cy = A / 2 + 4, SOMBRA = 9, K = 6;
			var raios = [];
			[-40, -30, -22, -16, -12, -8, -4, 4, 8, 12, 16, 22, 30, 40].forEach(function (b) {
				var x = -5, y = cy + b, vx = 1, vy = 0, pts = [], caiu = false;
				for (var s = 0; s < 420; s++) {
					var dx = cx - x, dy = cy - y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
					if (r < SOMBRA) { caiu = true; break; }
					vx += dx / r * K / r2 * 0.5; vy += dy / r * K / r2 * 0.5;
					var v = Math.sqrt(vx * vx + vy * vy); vx /= v; vy /= v;
					x += vx * 0.6; y += vy * 0.6;
					if (s % 2 === 0) pts.push([x, y]);
					if (x > L + 4 || y < -4 || y > A + 4) break;
				}
				raios.push({ pts: pts, caiu: caiu });
			});
			return function (buf, t) {
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				raios.forEach(function (rr, j) {
					rr.pts.forEach(function (p, i) { if (i % 3 === 0) pintar(buf, L, A, p[0], p[1], rr.caiu ? hex('#3a2a50') : hex('#2a3a6a')); });
					// os "pacotinhos" de luz andando pelo caminho
					for (var q = 0; q < 3; q++) {
						var i2 = Math.floor(((t * 0.35 + q / 3 + j * 0.07) % 1) * rr.pts.length), p2 = rr.pts[i2];
						if (!p2) continue;
						pintar(buf, L, A, p2[0], p2[1], rr.caiu ? hex('#ffb347') : hex('#ffffff'));
						var p3 = rr.pts[Math.max(0, i2 - 2)]; pintar(buf, L, A, p3[0], p3[1], rr.caiu ? hex('#a8501e') : hex('#8fd3fa'));
					}
				});
				for (var y = -14; y <= 14; y++) for (var x = -14; x <= 14; x++) {
					var d = Math.sqrt(x * x + y * y);
					if (d < SOMBRA) pintar(buf, L, A, cx + x, cy + y, hex('#000000'));
					else if (d < SOMBRA + 1.3) pintar(buf, L, A, cx + x, cy + y, hex('#ffd36a'));
					else if (d < SOMBRA + 4 && B4[(x & 1) + ((y & 1) << 1)] < (SOMBRA + 4 - d) / 5) pintar(buf, L, A, cx + x, cy + y, hex('#a8501e'));
				}
			};
		},

		// Bolhas de Fermi: a mesma região vista em luz comum (só a galáxia) e em raios gama
		// (as bolhas aparecem). Uma "lente" passa de um lado para o outro trocando a visão
		'fermi-raios': function (L, A) {
			var fundo = estrelasFundo(L, A, 83, 60), aleat = semente(87), disco = [];
			var cx = L / 2, cy = A / 2;
			for (var i = 0; i < 480; i++) { var dx = (aleat() - 0.5) * 2, larg = Math.pow(Math.abs(dx), 0.8); disco.push([cx + dx * 92, cy + (aleat() - 0.5) * (6 - larg * 4.2) * 1.4, aleat()]); }
			var MAG = [hex('#ff9ff0'), hex('#e070ff'), hex('#a43ad0')];
			return function (buf, t, hud) {
				var c = t % 8, corte = c < 4 ? suave(c / 3.2) * (L + 8) - 4 : L + 4 - suave((c - 4) / 3.2) * (L + 8);
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					if (x > corte) continue; // à esquerda da lente: raios gama
					buf[y * L + x] = hex('#120a24');
					for (var s = -1; s <= 1; s += 2) {
						var yc = cy - s * 21, u = (x - cx) / 18, v = (y - yc) / 22;
						if (s * (cy - y) < 0) continue;
						var d = u * u + v * v + Math.sin(Math.atan2(v, u) * 5 + s) * 0.07 + Math.sin(Math.atan2(v, u) * 11) * 0.04; // borda irregular
						if (d < 1) buf[y * L + x] = d > 0.85 ? MAG[0] : B4[(x & 1) + ((y & 1) << 1)] < (1 - d) * 0.9 ? MAG[1] : MAG[2];
					}
				}
				disco.forEach(function (d) {
					var gama = d[0] <= corte, perto = 1 - Math.min(1, Math.abs(d[0] - cx) / 30), br = 0.5 + 0.5 * d[2];
					pintar(buf, L, A, d[0], d[1], gama ? cor(90, 70, 120) : cor(150 + 105 * perto * br, 150 + 70 * br, 200 - 90 * perto));
				});
				for (y = 0; y < A; y++) { pintar(buf, L, A, corte, y, hex('#ffffff')); if (y % 2) pintar(buf, L, A, corte + 1, y, hex('#9ffcff')); }
				if (hud) {
					hud.ano.textContent = '← raios gama';
					hud.estacao.textContent = 'luz que os olhos veem →';
				}
			};
		},

		// Órion vista do Brasil (de cabeça para baixo): as Três Marias, a "espada" acima delas e,
		// chegando mais perto da estrela do meio da espada, ela vira a nebulosa
		'orion-constelacao': function (L, A) {
			var fundo = estrelasFundo(L, A, 89, 30), CICLO = 12;
			// posições no céu (constelação girada: como se vê daqui do hemisfério sul)
			var E = { betelgeuse: [0.7, 0.8, '#ffb070', 2], bellatrix: [0.32, 0.75, '#dfe8ff', 1], meissa: [0.5, 0.88, '#dfe8ff', 1],
				alnitak: [0.57, 0.48, '#dfe8ff', 1], alnilam: [0.5, 0.5, '#ffffff', 1], mintaka: [0.43, 0.53, '#dfe8ff', 1],
				saiph: [0.62, 0.18, '#cfe0ff', 1], rigel: [0.3, 0.22, '#bcd4ff', 2] };
			var ESPADA = [[0.515, 0.38], [0.52, 0.32], [0.525, 0.26]];
			var LINHAS = [['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'], ['alnitak', 'alnilam'], ['alnilam', 'mintaka'], ['alnitak', 'saiph'], ['mintaka', 'rigel'], ['betelgeuse', 'meissa'], ['bellatrix', 'meissa']];
			return function (buf, t, hud) {
				var c = t % CICLO;
				// chegando perto: tudo cresce em volta da estrela do meio da espada, que vai para o centro
				function base(p) { return [L / 2 + (p[0] - 0.5) * A * 1.5, A / 2 + (p[1] - 0.5) * A * 0.95]; }
				var T = base(ESPADA[1]), z01 = suave((c - 6.2) / 3), zoom = 1 + z01 * z01 * 9;
				function tela(p) { var b = base(p); return [T[0] + (b[0] - T[0]) * zoom + (L / 2 - T[0]) * z01, T[1] + (b[1] - T[1]) * zoom + (A / 2 - T[1]) * z01]; }
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				var linhas = suave(c / 1.2) * (1 - suave((c - 6.2) / 1));
				LINHAS.forEach(function (l) {
					var a = tela(E[l[0]]), b = tela(E[l[1]]), n = Math.hypot(b[0] - a[0], b[1] - a[1]);
					for (var d = 4; d < n - 4; d += 2) if (linhas > 0.3) pintar(buf, L, A, a[0] + (b[0] - a[0]) * d / n, a[1] + (b[1] - a[1]) * d / n, hex('#4a4a9a'));
				});
				Object.keys(E).forEach(function (k) {
					var e = E[k], p = tela(e), marias = (k === 'alnitak' || k === 'alnilam' || k === 'mintaka') && c > 1.5 && c < 4 && Math.sin(t * 8) > 0;
					// cada estrela da constelação com raios em cruz (as maiores, raios maiores)
					var tam = e[3] > 1 ? 2 : 1;
					for (var r = 1; r <= tam; r++) [[r, 0], [-r, 0], [0, r], [0, -r]].forEach(function (s) { pintar(buf, L, A, p[0] + s[0], p[1] + s[1], hex(marias ? '#c89a3a' : r === 1 ? '#8fa4e0' : '#4a5a9a')); });
					pintar(buf, L, A, p[0], p[1], hex(marias ? '#ffd36a' : e[2]));
				});
				// a espada; a "estrela" do meio vira a nebulosa quando chegamos perto
				var nebula = suave((c - 7) / 2.5);
				ESPADA.forEach(function (s, i) {
					var p = tela(s);
					if (i === 1 && nebula > 0) {
						// a estrela borrada vira a nebulosa: a própria pixel art do topo da página, crescendo
						var R = 3 + nebula * 44, arte = document.querySelector('canvas.arte-destino'), px = null;
						try { if (arte && arte.width) px = arte.getContext('2d').getImageData(0, 0, arte.width, arte.height); } catch (er) {}
						for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
							var d = Math.sqrt(x * x + y * y) / R, lim = B4[(((p[0] + x) | 0) & 1) + ((((p[1] + y) | 0) & 1) << 1)];
							if (d > 1 || (d > 0.75 && lim < (d - 0.75) * 4)) continue; // a borda some num pontilhado
							if (px) {
								var ax = Math.min(px.width - 1, Math.floor((x + R) / (2 * R) * px.width)), ay = Math.min(px.height - 1, Math.floor((y + R) / (2 * R) * px.height)), ki = (ay * px.width + ax) * 4;
								if (px.data[ki + 3] > 0) pintar(buf, L, A, p[0] + x, p[1] + y, cor(px.data[ki], px.data[ki + 1], px.data[ki + 2]));
							} else if (lim < 1 - d) pintar(buf, L, A, p[0] + x, p[1] + y, d < 0.3 ? hex('#fff0e8') : hex('#d0507a'));
						}
					}
					pintar(buf, L, A, p[0], p[1], i === 1 && c > 4 && c < 6.2 && Math.sin(t * 8) > 0 ? hex('#ff9ad0') : hex('#e8e0ff'));
				});
				if (hud) {
					hud.ano.textContent = c < 1.5 ? 'a constelação de Órion' : c < 4 ? 'as Três Marias' : c < 6.2 ? 'a espada: a do meio é borrada' : 'chegando mais perto…';
					hud.estacao.textContent = c < 7.5 ? 'vista do Brasil' : 'não é estrela: é a nebulosa!';
				}
			};
		},

		// Plêiades: quantas irmãs dá para ver no céu da cidade, no céu do campo e com binóculo
		'pleiades-ceu': function (L, A) {
			var aleat = semente(97), cx = L / 2, cy = A / 2 - 2, estrelas = [];
			// as mais brilhantes primeiro (os nomes das irmãs), depois as mais fracas
			[[0, 0, 1], [-14, -6, 0.92], [10, -10, 0.88], [-6, 8, 0.86], [18, 2, 0.84], [-22, 4, 0.8], [6, 14, 0.62], [-2, -16, 0.6], [24, -8, 0.58]].forEach(function (s) { estrelas.push([cx + s[0] * 1.7, cy + s[1] * 1.5, s[2]]); });
			for (var i = 0; i < 50; i++) estrelas.push([cx + (aleat() - 0.5) * 130, cy + (aleat() - 0.5) * 70, 0.08 + aleat() * 0.45]);
			var CICLO = 12;
			return function (buf, t, hud) {
				var c = t % CICLO, etapa = c < 4 ? 0 : c < 8 ? 1 : 2, mistura = Math.min(1, (c % 4) / 0.8);
				var limite = [0.83, 0.57, 0.08][etapa], antes = [0.08, 0.83, 0.57][etapa], corte = antes + (limite - antes) * mistura;
				if (etapa === 0 && c < 0.8) corte = 0.08 + (0.83 - 0.08) * mistura; // volta do binóculo para a cidade
				var ceu = etapa === 0 ? [40, 26, 30] : [7, 6, 22];
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var brilho = etapa === 0 ? Math.max(0, (y - 40) / 70) : etapa === 1 ? Math.max(0, (y - 70) / 160) : 0; // no campo, só um clarinho no horizonte
					buf[y * L + x] = cor(ceu[0] + brilho * 90, ceu[1] + brilho * 50, ceu[2] + brilho * 20);
				}
				var vistas = 0;
				estrelas.forEach(function (s) {
					if (s[2] < corte) return;
					vistas++;
					var b = Math.min(1, 0.4 + s[2] * 0.6) * (0.85 + 0.15 * Math.sin(t * 2 + s[0]));
					pintar(buf, L, A, s[0], s[1], cor(190 * b + 50, 215 * b + 30, 255 * b));
					if (s[2] > 0.82 || (etapa === 2 && s[2] > 0.55)) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pintar(buf, L, A, s[0] + d[0], s[1] + d[1], cor(90 * b, 130 * b, 230 * b)); });
				});
				// embaixo: prédios com janelas acesas (cidade), árvores (campo) ou a borda do binóculo
				if (etapa === 0) for (var x2 = 0; x2 < L; x2++) { var alt = 10 + ((x2 / 14) | 0) % 3 * 7; for (var y2 = A - alt; y2 < A; y2++) buf[y2 * L + x2] = (x2 % 5 === 2 && y2 % 4 === 1) ? hex('#ffd36a') : hex('#0b0812'); }
				if (etapa === 1) for (x2 = 0; x2 < L; x2++) { var arv = 6 + Math.abs(Math.sin(x2 * 0.3) * 6) + Math.abs(Math.sin(x2 * 0.11)) * 5; for (y2 = A - arv; y2 < A; y2++) buf[y2 * L + x2] = hex('#05040a'); }
				if (etapa === 2) for (y2 = 0; y2 < A; y2++) for (x2 = 0; x2 < L; x2++) {
					var dl = Math.hypot(x2 - cx + 26, y2 - cy) , dr = Math.hypot(x2 - cx - 26, y2 - cy);
					if (Math.min(dl, dr) > 50) buf[y2 * L + x2] = hex('#000000');
				}
				if (hud) {
					hud.ano.textContent = ['no céu da cidade', 'no céu do campo', 'com binóculo'][etapa];
					hud.estacao.textContent = 'você vê ' + vistas + ' estrelas';
				}
			};
		},

		// Hélice de perto: a borda de dentro do anel, com os nós cometários. O vento e a luz da
		// anã branca (à esquerda) sopram para fora e esticam as caudas deles
		'helice-nos': function (L, A) {
			var aleat = semente(103), nos = [], vento = [];
			function borda(y) { return 92 + Math.sin(y * 0.12 + 1) * 10 + Math.sin(y * 0.31) * 4; } // a borda de dentro do anel
			for (var i = 0; i < 26; i++) { var ny = 5 + aleat() * (A - 10); nos.push([borda(ny) - 2 + aleat() * 26, ny, 1 + aleat() * 1.5, aleat() * 6]); }
			for (i = 0; i < 40; i++) vento.push([aleat(), aleat() * A, 0.5 + aleat()]);
			var MEIO = [hex('#7fe6d8'), hex('#3f9fa8'), hex('#1d4a5a')], ANEL = [hex('#ffb070'), hex('#ff7048'), hex('#c83a3a'), hex('#6a1a2a')];
			return function (buf, t) {
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var lim = B4[(x & 1) + ((y & 1) << 1)], b = borda(y), k = y * L + x;
					var onda = Math.sin(y * 0.15 + x * 0.04) * 0.15 + Math.sin(y * 0.05 - x * 0.02) * 0.1;
					if (x < b) { var f0 = x / b + onda; buf[k] = MEIO[Math.min(2, Math.floor(f0 * 2.3 + lim * 0.5))]; }
					else { var f = (x - b) / (L - b) + onda; buf[k] = ANEL[Math.max(0, Math.min(3, Math.floor(f * 3.4 + lim * 0.5)))]; }
				}
				// o vento saindo da anã branca, para a direita
				vento.forEach(function (v) { var x = ((v[0] + t * 0.12 * v[2]) % 1) * L; pintar(buf, L, A, x, v[1], hex('#c8fff6')); pintar(buf, L, A, x - 1, v[1], hex('#7fe6d8')); });
				// os nós: cabeça clara, cauda comprida apontando para fora (para a direita)
				// (como nas fotos do Hubble: a cabeça acesa do lado da estrela e a cauda escura atrás)
				nos.forEach(function (n) {
					var cauda = 10 + n[2] * 7 + Math.sin(t * 2 + n[3]) * 2;
					for (var q = 1; q < cauda; q++) {
						var yq = n[1] + Math.sin(q * 0.25 + t + n[3]) * 0.7;
						pintar(buf, L, A, n[0] + q, yq, q < cauda * 0.6 ? hex('#4a1a2a') : hex('#7a2a32'));
						if (q < cauda * 0.4) pintar(buf, L, A, n[0] + q, yq + 1, hex('#5a2030'));
					}
					pintar(buf, L, A, n[0] - 1, n[1], hex('#fff6e8')); pintar(buf, L, A, n[0] - 1, n[1] + 1, hex('#ffe0c0')); pintar(buf, L, A, n[0] - 2, n[1], hex('#ffd0a0'));
					pintar(buf, L, A, n[0], n[1] - 1, hex('#ffe0c0')); pintar(buf, L, A, n[0], n[1] + 2, hex('#ffd0a0'));
				});
				// a anã branca, lá na esquerda
				for (y = -4; y <= 4; y++) for (x = -4; x <= 4; x++) { var d = Math.sqrt(x * x + y * y); if (d < 2) pintar(buf, L, A, 8 + x, A / 2 + y, hex('#ffffff')); else if (d < 4.5 && B4[(x & 1) + ((y & 1) << 1)] < 0.6) pintar(buf, L, A, 8 + x, A / 2 + y, hex('#bff6ff')); }
			};
		},

		// Tabby x uma estrela comum: em cima, um planeta passando na frente faz o brilho cair um
		// tiquinho, sempre igual; embaixo, a Estrela de Tabby cai muito, sem padrão nenhum
		'tabby-quedas': function (L, A) {
			var fundo = estrelasFundo(L, A, 107, 30), g0 = 64, g1 = 196;
			function planeta(tt) { var f = (tt % 4) / 4; return Math.abs(f - 0.5) < 0.06 ? 0.01 : 0; }
			function tabby(tt) {
				var q = 0;
				[[1.2, 0.08, 0.5], [3.1, 0.22, 0.9], [5.3, 0.12, 0.6], [6.6, 0.05, 0.3], [8.4, 0.18, 1.2]].forEach(function (d) { var x = (tt % 10) - d[0]; q += d[1] * Math.exp(-x * x / (d[2] * d[2] * 0.3)); });
				return Math.min(0.24, q);
			}
			function linha(buf, topo, base, fn, t, corL) {
				for (var x = g0; x <= g1; x += 3) { pintar(buf, L, A, x, topo, hex('#2a2a50')); pintar(buf, L, A, x, base, hex('#2a2a50')); }
				for (x = g0; x <= g1; x++) { var q = fn(t - (g1 - x) * 0.06); pintar(buf, L, A, x, topo + q / 0.25 * (base - topo), corL); }
			}
			function estrela(buf, ex, ey, R, luz, cor0) {
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) { var d = Math.sqrt(x * x + y * y); if (d <= R) pintar(buf, L, A, ex + x, ey + y, cor(cor0[0] * luz * (1 - d / R * 0.3), cor0[1] * luz * (1 - d / R * 0.3), cor0[2] * luz * (1 - d / R * 0.3))); }
			}
			return function (buf, t, hud) {
				buf.fill(hex('#08060f'));
				fundo(buf, t);
				var qp = planeta(t), qt = tabby(t);
				estrela(buf, 30, 34, 12, 1 - qp, [255, 230, 160]);
				var f = (t % 4) / 4; if (Math.abs(f - 0.5) < 0.12) { var px = 30 + (f - 0.5) * 140; for (var y = -1; y <= 1; y++) for (var x = -1; x <= 1; x++) pintar(buf, L, A, px + x, 34 + y, hex('#1a1424')); }
				estrela(buf, 30, 82, 12, 1 - qt * 0.9, [255, 200, 120]);
				// a poeira passando na frente da Tabby
				for (var g = 0; g < 50; g++) { var gx = 30 + (((t * 0.11 + g * 0.37) % 1.4) - 0.7) * 50, gy = 82 + Math.sin(g * 2.3) * 9; if (qt > 0.03) pintar(buf, L, A, gx, gy, hex('#5a3e30')); }
				linha(buf, 24, 50, planeta, t, hex('#7fd8ff'));
				linha(buf, 72, 100, tabby, t, hex('#ffb347'));
				if (hud) {
					hud.ano.textContent = 'com planeta: ' + (qp > 0 ? '99%' : '100%');
					hud.estacao.textContent = 'Tabby: ' + Math.round((1 - qt) * 100) + '%';
				}
			};
		},

		// Omega Centauri: uma galáxia pequena chega perto da Via Láctea, perde as estrelas de fora
		// pelo caminho e sobra só o miolo, que continua dando voltas: Omega Centauri
		'omega-engolida': function (L, A) {
			// (a Via Láctea no meio e o caminho da galáxia pequena todo dentro da tela, sem cortar)
			var fundo = estrelasFundo(L, A, 109, 40), aleat = semente(113), CICLO = 20, FUSAO = 13, gx = L / 2, gy = A / 2 + 2;
			var disco = [], ana = [];
			for (var i = 0; i < 420; i++) { var r = 4 + Math.pow(aleat(), 0.8) * 34, br = aleat() < 0.5 ? 0 : Math.PI; disco.push([r, br + Math.log(r / 4) * 1.6 + (aleat() - 0.5) * 1.2, aleat()]); }
			for (i = 0; i < 170; i++) { var rr = Math.pow(aleat(), 1.3) * 15, aa = aleat() * Math.PI * 2; ana.push([Math.cos(aa) * rr, Math.sin(aa) * rr * 0.75, rr / 15, aleat() < 0.5 ? -1 : 1]); }
			function caminho(k) { // o centro da galáxia pequena, chegando em espiral
				var ang = 2.6 + k * Math.PI * 3.2, raio = 80 - 46 * Math.min(1, k * 1.5);
				return [gx + Math.cos(ang) * raio, gy + Math.sin(ang) * raio * 0.45];
			}
			return function (buf, t, hud) {
				// k vai de 0 a 1 durante a fusão (13 s) e continua passando de 1 depois: o miolo segue
				// dando voltas e as estrelas arrancadas vão se espalhando pela órbita toda
				var c = t % CICLO, k = c / FUSAO;
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				disco.forEach(function (d) {
					var a = d[1] + t * 0.5 * (10 / (d[0] + 5)), q = Math.max(0, 1 - d[0] / 14);
					pintar(buf, L, A, gx + Math.cos(a) * d[0], gy + Math.sin(a) * d[0] * 0.5, cor(150 + 100 * q + 40 * d[2], 160 + 60 * q + 40 * d[2], 230 - 80 * q));
				});
				for (var y = -3; y <= 3; y++) for (var x = -5; x <= 5; x++) if ((x * x) / 25 + (y * y) / 9 < 1) pintar(buf, L, A, gx + x, gy + y, hex('#ffe9b8'));
				var cc = caminho(k);
				ana.forEach(function (s) {
					var solta = 0.2 + 0.55 * (1 - s[2]); // as de fora soltam primeiro
					var px, py, br = 1;
					if (k < solta || s[2] < 0.3) { var aperta = 1 - Math.min(0.5, k * 0.5); px = cc[0] + s[0] * aperta; py = cc[1] + s[1] * aperta; }
					else { var p = caminho(Math.max(0, k - (k - solta) * 1.1 * (s[3] > 0 ? 1 : -0.6))); px = p[0] + s[0] * 0.7; py = p[1] + s[1] * 0.7; br = Math.max(k > 1 ? 0.45 : 0.6, 1 - (k - solta) * 0.8); }
					// depois da fusão, as estrelas arrancadas se espalham em volta da Via Láctea e viram parte dela
					if (k > 1 && s[2] >= 0.3) {
						var mist = suave((k - 1) / 0.4), fi = s[0] * 0.7 + s[1] + t * 0.12, ro = 26 + s[2] * 34;
						px += (gx + Math.cos(fi) * ro - px) * mist; py += (gy + Math.sin(fi) * ro * 0.5 - py) * mist;
					}
					pintar(buf, L, A, px, py, cor(255 * br, 220 * br, 150 * br));
				});
				for (y = -2; y <= 2; y++) for (x = -2; x <= 2; x++) if (x * x + y * y <= 5) pintar(buf, L, A, cc[0] + x, cc[1] + y, x * x + y * y < 2 ? hex('#fff1b8') : hex('#ffc65a'));
				if (hud) {
					var bi = 10 - Math.min(1, k) * 10;
					hud.ano.textContent = bi < 0.4 ? 'hoje' : 'há ' + numero(bi, bi < 2 ? 1 : 0) + (bi < 2 ? ' bilhão' : ' bilhões') + ' de anos';
					hud.estacao.textContent = k < 0.2 ? 'uma galáxia pequena chega perto' : k < 0.75 ? 'a Via Láctea arranca as estrelas de fora' : k < 1 ? 'sobra só o miolo' : 'Omega Centauri, dando voltas na Via Láctea';
				}
			};
		},

		// ---------- Betelgeuse ----------
		// O grande apagão (2019-2020): a estrela solta uma bolha de gás embaixo, a bolha esfria e
		// vira poeira na frente dela, o brilho cai pela metade e depois a poeira se espalha
		'betelgeuse-apagao': function (L, A) {
			var fundo = estrelasFundo(L, A, 151, 50), cx = 56, cy = A / 2 + 6, R = 34, CICLO = 14;
			var MESES = ['outubro de 2019', 'novembro de 2019', 'dezembro de 2019', 'janeiro de 2020', 'fevereiro de 2020', 'março de 2020', 'abril de 2020'];
			var SOLO = [hex('#ffe0a0'), hex('#ffb060'), hex('#f07a32'), hex('#c8461e'), hex('#8a2414'), hex('#4a1008')];
			function brilho(k) { var x = (k - 0.55) / 0.22; return 1 - 0.6 * Math.exp(-x * x); } // o mínimo em fevereiro de 2020
			var g0 = 112, g1 = 194, gt = 26, gb = 96; // o gráfico do brilho
			return function (buf, t, hud) {
				var c = t % CICLO, k = Math.min(1, c / 12), b = brilho(k);
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// a estrela, fervendo (escurece junto com o brilho)
				for (var y = -R - 3; y <= R + 3; y++) for (var x = -R - 3; x <= R + 3; x++) {
					var d = Math.sqrt(x * x + y * y), lim = B4[(x & 1) + ((y & 1) << 1)];
					if (d > R) { if (d < R + 4 && lim < (R + 4 - d) / 6 * b) pintar(buf, L, A, cx + x, cy + y, SOLO[4]); continue; }
					var mu = Math.sqrt(1 - (d / R) * (d / R)), cel = ruido2d(x * 0.16 + t * 0.15, y * 0.16 - t * 0.1);
					var n = Math.floor((1 - mu) * 3.2 + (0.5 - cel) * 1.6 + lim * 0.7 + (1 - b) * 2.4);
					pintar(buf, L, A, cx + x, cy + y, SOLO[Math.max(0, Math.min(5, n))]);
				}
				// a bolha de gás saindo embaixo, à esquerda, e virando uma nuvem de poeira escura
				var sai = suave(k / 0.3), esfria = suave((k - 0.25) / 0.25), some = suave((k - 0.62) / 0.35);
				var bx = cx - 8 - sai * 6 - some * 16, by = cy + 12 + sai * 6 + some * 12, br = 10 + sai * 12 + some * 10;
				for (var q = 0; q < 420; q++) {
					var a = q * 2.39996, rr = Math.sqrt(q / 420) * br, px = bx + Math.cos(a) * rr, py = by + Math.sin(a) * rr * 0.75;
					if (ruido2d(px * 0.3, py * 0.3 + t * 0.2) < 0.35 + some * 0.5 || sai < 0.05) continue;
					pintar(buf, L, A, px, py, esfria < 0.5 ? (q % 3 ? hex('#ff9a4a') : hex('#ffd08a')) : (q % 4 ? hex('#2a140c') : hex('#4a2414')));
				}
				// o gráfico: o brilho de outubro a abril (100% em cima, 30% embaixo)
				for (var gx = g0; gx <= g1; gx += 3) { pintar(buf, L, A, gx, gt, hex('#2a2a50')); pintar(buf, L, A, gx, gb, hex('#2a2a50')); }
				for (var gy = gt; gy <= gb; gy++) pintar(buf, L, A, g0 - 1, gy, hex('#3a3a6a'));
				var ate = g0 + Math.round(k * (g1 - g0));
				for (gx = g0; gx <= ate; gx++) pintar(buf, L, A, gx, gt + (1 - brilho((gx - g0) / (g1 - g0))) / 0.7 * (gb - gt), hex('#ff8a4a'));
				pintar(buf, L, A, ate, gt + (1 - b) / 0.7 * (gb - gt) - 1, hex('#ffffff'));
				if (hud) {
					hud.ano.textContent = MESES[Math.min(6, Math.floor(k * 6.99))];
					hud.estacao.textContent = 'brilho: ' + Math.round(b * 100) + '%' + (k > 0.25 && k < 0.75 ? ' (poeira na frente)' : '');
				}
			};
		},

		// O dia em que Betelgeuse explodir, visto do Brasil: Órion de cabeça para baixo no céu,
		// a estrela vermelha vira um ponto brilhantíssimo (dá para ver até de dia), vai apagando
		// ao longo dos meses e, no fim, Órion fica sem o ombro
		'betelgeuse-supernova': function (L, A) {
			var fundo = estrelasFundo(L, A, 157, 40), CICLO = 16;
			// Órion vista daqui (girada): Betelgeuse fica embaixo, à direita
			var E = [[100, 30, '#bcd4ff', 2], [130, 34, '#cfe0ff', 1], [109, 52, '#dfe8ff', 1], [115, 50, '#ffffff', 1], [121, 48, '#dfe8ff', 1], [105, 74, '#dfe8ff', 1], [127, 66, '#ffb070', 2]];
			var LINHAS = [[0, 4], [1, 2], [2, 3], [3, 4], [2, 5], [4, 6]];
			return function (buf, t, hud) {
				var c = t % CICLO, explode = c > 3, k = explode ? (c - 3) / 11 : 0; // k: 0 no dia da explosão, 1 meses depois
				var forca = explode ? Math.max(0, 1 - Math.pow(k, 0.7)) : 0;
				// o céu: noite comum; na explosão, clareia como um entardecer azul
				var ceu = forca * 0.55;
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var alt = y / A;
					buf[y * L + x] = cor(7 + ceu * 60 * (1 - alt * 0.5), 5 + ceu * 90 * (1 - alt * 0.3), 26 + ceu * 150);
				}
				if (ceu < 0.25) fundo(buf, t);
				LINHAS.forEach(function (l) {
					if (l[1] === 6 && c > 14) return; // sem Betelgeuse, sem a linha do ombro
					var a = E[l[0]], b = E[l[1]], n = Math.hypot(b[0] - a[0], b[1] - a[1]);
					for (var d = 4; d < n - 4; d += 2) pintar(buf, L, A, a[0] + (b[0] - a[0]) * d / n, a[1] + (b[1] - a[1]) * d / n, hex('#3a3a7a'));
				});
				E.forEach(function (e, i) {
					if (i === 6) return;
					pintar(buf, L, A, e[0], e[1], hex(e[2]));
					if (e[3] > 1) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (s) { pintar(buf, L, A, e[0] + s[0], e[1] + s[1], hex('#5a6a9a')); });
				});
				// Betelgeuse: vermelha antes; depois, um ponto branco-azulado enorme com raios, apagando
				var bx = E[6][0], by = E[6][1];
				if (!explode) {
					pintar(buf, L, A, bx, by, hex('#ffb070'));
					[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (s) { pintar(buf, L, A, bx + s[0], by + s[1], hex('#c8602a')); });
				} else if (c < 14) {
					var tam = 2 + forca * 16 + (c < 3.4 ? (3.4 - c) * 30 : 0);
					for (var yy = -tam; yy <= tam; yy++) for (var xx = -tam; xx <= tam; xx++) {
						var d2 = Math.sqrt(xx * xx + yy * yy), raio = Math.min(Math.abs(xx), Math.abs(yy)) < 1 ? 0.5 : 0;
						var v = (1 - d2 / tam) * (0.6 + raio) * (0.4 + forca);
						if (v > 0.12 && B4[(((bx + xx) | 0) & 1) + ((((by + yy) | 0) & 1) << 1)] < v * 1.6) pintar(buf, L, A, bx + xx, by + yy, v > 0.55 ? hex('#ffffff') : v > 0.3 ? hex('#cdf1ff') : hex('#7fb8ff'));
					}
				}
				// o chão, com morros e árvores (aqui do Brasil)
				for (var x2 = 0; x2 < L; x2++) {
					var h = 10 + Math.sin(x2 * 0.05) * 4 + Math.abs(Math.sin(x2 * 0.37)) * (x2 % 23 < 6 ? 6 : 0);
					for (var y2 = Math.round(A - h); y2 < A; y2++) buf[y2 * L + x2] = ceu > 0.3 ? hex('#1a2440') : hex('#05040a');
				}
				if (hud) {
					var semanas = Math.round(k * 52);
					hud.ano.textContent = !explode ? 'uma noite comum' : c < 4 ? 'o dia da explosão!' : c < 14 ? semanas + ' semanas depois' : 'um ano depois';
					hud.estacao.textContent = !explode ? 'Betelgeuse vermelhinha' : forca > 0.5 ? 'quase tão forte quanto a Lua' : forca > 0.15 ? 'ainda dá para ver de dia' : c < 14 ? 'apagando devagar' : 'Órion sem o ombro';
				}
			};
		},

		// ---------- Eta Carinae ----------
		// As duas estrelas numa órbita bem esticada (uma volta a cada 5 anos e meio): os ventos das
		// duas se chocam numa "frente" de gás que brilha em raios X, mais forte quando passam perto
		'eta-par': function (L, A) {
			// vista de cima: a estrela grande parada (à esquerda) e a pequena dando a volta numa órbita
			// esticada. Os ventos das duas saem como ondas; onde as ondas se encontram, o gás se choca
			// e brilha (o arco). Perto uma da outra, o choque fica fortíssimo: o medidor de raios X sobe
			var fundo = estrelasFundo(L, A, 163, 40), CICLO = 14, e = 0.78, a = 52, b = a * Math.sqrt(1 - e * e);
			var Ax = 48, Ay = A / 2 + 4; // a grande fica num dos focos da órbita, que se abre para a direita
			function kepler(M) { var E = Math.PI; for (var k = 0; k < 14; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
			function posicao(k) { var E = kepler((((k + 0.5) % 1) + 1) % 1 * Math.PI * 2); return [Ax - a * (Math.cos(E) - e), Ay + b * Math.sin(E)]; }
			return function (buf, t, hud) {
				var k = (t % CICLO) / CICLO, p = posicao(k), Bx = p[0], By = p[1];
				var dist = Math.hypot(Bx - Ax, By - Ay), perto = Math.max(0, Math.min(1, (40 - dist) / 30));
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// a órbita pontilhada e o rastro da pequena
				for (var q = 0; q < 1; q += 0.006) { var o = posicao(q); if (Math.round(q * 166) % 2 === 0) pintar(buf, L, A, o[0], o[1], hex('#2e2a5a')); }
				for (var r = 1; r <= 24; r++) { var o2 = posicao(k - r * 0.004); pintar(buf, L, A, o2[0], o2[1], r < 10 ? hex('#7fb8ff') : hex('#3f5fa8')); }
				// os ventos: ondas que saem de cada estrela (a grande sopra mais forte)
				[[Ax, Ay, 30, '#5a6ab8'], [Bx, By, 16, '#4a8ac8']].forEach(function (s, n) {
					for (var w = 0; w < 3; w++) {
						var raio = ((t * 0.6 + w / 3 + n * 0.17) % 1) * s[2] + 6;
						for (var ang = 0; ang < Math.PI * 2; ang += 0.12) pintar(buf, L, A, s[0] + Math.cos(ang) * raio, s[1] + Math.sin(ang) * raio, hex(s[3]));
					}
				});
				// o choque dos ventos: um arco entre as duas, mais perto da pequena (o vento dela é mais fraco)
				var dir = Math.atan2(By - Ay, Bx - Ax), mx = Ax + (Bx - Ax) * 0.68, my = Ay + (By - Ay) * 0.68, forte = 0.35 + perto * 0.65;
				for (var s2 = -1; s2 <= 1; s2 += 0.05) {
					var curva = s2 * s2 * 5, px = mx + Math.cos(dir + Math.PI / 2) * s2 * 14 + Math.cos(dir) * curva, py = my + Math.sin(dir + Math.PI / 2) * s2 * 14 + Math.sin(dir) * curva;
					var f = forte * (1 - Math.abs(s2) * 0.6);
					pintar(buf, L, A, px, py, f > 0.75 ? hex('#ffffff') : f > 0.5 ? hex('#ffe08a') : hex('#c8902a'));
					if (perto > 0.4 && Math.sin(t * 20 + s2 * 9) > 0.6) pintar(buf, L, A, px + Math.cos(dir) * 2, py + Math.sin(dir) * 2, hex('#fff6c8')); // faíscas de raios X
				}
				globoLuz(buf, L, A, Ax, Ay, 8, 0, -1, [hex('#ffffff'), hex('#e8f4ff'), hex('#bcd8ff'), hex('#8fb0f0')]);
				globoLuz(buf, L, A, Math.round(Bx), Math.round(By), 4, 0, -1, [hex('#ffffff'), hex('#d8ecff'), hex('#9fc0f0')]);
				// o medidor de raios X, na direita
				var mxx = 186, topo = 24, base = 100, nivel = 0.12 + perto * 0.88;
				for (var y = topo; y <= base; y++) { pintar(buf, L, A, mxx - 1, y, hex('#4a4280')); pintar(buf, L, A, mxx + 6, y, hex('#4a4280')); }
				for (var x = mxx - 1; x <= mxx + 6; x++) { pintar(buf, L, A, x, topo, hex('#4a4280')); pintar(buf, L, A, x, base, hex('#4a4280')); }
				for (y = Math.round(base - 1 - nivel * (base - topo - 2)); y < base; y++) for (x = mxx; x <= mxx + 5; x++) pintar(buf, L, A, x, y, nivel > 0.7 ? hex('#ffffff') : nivel > 0.4 ? hex('#ffe08a') : hex('#c8902a'));
				if (hud) {
					hud.ano.textContent = 'ano ' + numero(k * 5.5, 1) + ' de 5,5';
					hud.estacao.textContent = perto > 0.5 ? 'pertinho: o choque brilha muito!' : perto > 0.1 ? 'se aproximando…' : 'longe: o choque é fraco';
				}
			};
		},

		// A Grande Erupção, de 1837 até hoje: a estrela brilha demais (em 1843, só Sírius brilhava
		// mais), solta gás que forma as duas bolhas do Homúnculo, some atrás da própria poeira e,
		// do século 20 para cá, volta a aparecer no meio da nuvem
		'eta-erupcao': function (L, A) {
			var fundo = estrelasFundo(L, A, 173, 50), CICLO = 16, cx = L / 2, cy = A / 2 + 4;
			var LOBO = [hex('#fff0e0'), hex('#f0c8b0'), hex('#d89a80'), hex('#a8645a'), hex('#6a3a34')], POEIRA = [hex('#6a3a2a'), hex('#4a2420'), hex('#2e1618')];
			function ano(c) { return c < 2 ? 1837 + c * 3 : c < 7 ? 1843 + (c - 2) * 7.4 : c < 12 ? 1880 + (c - 7) * 29 : 2025; }
			return function (buf, t, hud) {
				var c = t % CICLO, an = ano(c);
				var cresce = suave((an - 1843) / 70), poeira = an > 1856 && an < 1945 ? Math.min(1, (an - 1856) / 12, (1945 - an) / 25) : 0;
				var brilho = an < 1843 ? 0.5 + (an - 1837) / 6 * 1.1 : an < 1856 ? 1.6 - (an - 1843) / 13 * 0.9 : an < 1945 ? 0.7 - poeira * 0.5 : 0.7 + Math.min(1, (an - 1945) / 80) * 0.5; // do século 20 para cá, ela volta a brilhar
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// as duas bolhas crescendo na diagonal
				if (cresce > 0.01) for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var u = x - cx, v = y - cy, s = u * 0.75 + v * 0.66, p = -u * 0.66 + v * 0.75, lado = s >= 0 ? 1 : -1;
					var ds = s - lado * 25 * cresce, rl = Math.sqrt(ds * ds / Math.pow(24 * cresce + 1, 2) + p * p / Math.pow(19 * cresce + 1, 2));
					var bord = 1 + (ruido2d(Math.atan2(p, ds) * 2 + lado * 3, 1) - 0.5) * 0.25;
					if (rl > bord) continue;
					var mu = Math.sqrt(Math.max(0, 1 - (rl / bord) * (rl / bord))), lim = B4[(x & 1) + ((y & 1) << 1)];
					var tex = ruido2d(x * 0.25 + lado * 7, y * 0.25), n = Math.floor((1 - mu) * 2.2 + (0.5 - tex) * 2.2 + lim * 0.8 + 1 + (lado > 0 ? 0 : 0.5));
					buf[y * L + x] = poeira > 0.4 ? POEIRA[Math.max(0, Math.min(2, n - 1))] : LOBO[Math.max(0, Math.min(4, n))];
				}
				// a estrela no meio, com raios (bem grandes no auge de 1843)
				var tam = 2 + brilho * 6;
				for (var yy = -tam; yy <= tam; yy++) for (var xx = -tam; xx <= tam; xx++) {
					var d = Math.sqrt(xx * xx + yy * yy), raio = Math.min(Math.abs(xx), Math.abs(yy)) < 1 ? 0.45 : 0;
					var v2 = (1 - d / tam) * (0.55 + raio) * brilho;
					if (v2 > 0.15 && B4[(((cx + xx) | 0) & 1) + ((((cy + yy) | 0) & 1) << 1)] < v2 * 1.5) pintar(buf, L, A, cx + xx, cy + yy, v2 > 0.6 ? hex('#ffffff') : v2 > 0.35 ? hex('#ffe8c8') : hex('#ffb070'));
				}
				if (hud) {
					hud.ano.textContent = 'ano ' + Math.round(an);
					hud.estacao.textContent = an < 1840 ? 'uma estrela comum' : an < 1846 ? '2ª estrela mais brilhante do céu!' : an < 1860 ? 'o gás forma duas bolhas' : an < 1945 ? 'escondida pela própria poeira' : 'o Homúnculo hoje';
				}
			};
		},

		// ---------- Sirius ----------
		// Cem anos de Sirius no céu (1760 a 1862): ela anda fazendo ondas, em vez de seguir reto.
		// Em 1844, Bessel percebe o bambeio (aparece a linha reta que ela "deveria" seguir); em
		// 1862, Alvan Clark vê a companheira, que faz ondas ao contrário. As duas giram em volta de
		// um ponto entre elas (a cruzinha), e é esse ponto que anda reto. Sirius A pesa o dobro de
		// Sirius B, por isso balança a metade.
		'sirius-bambeio': function (L, A) {
			var fundo = estrelasFundo(L, A, 181, 45), CICLO = 16;
			function ano(c) { return 1760 + Math.min(1, c / 10.5) * 102; }
			function centro(an) { var k = (an - 1760) / 102; return [16 + k * 168, 62 - k * 16]; }
			function separacao(an) { var f = (an - 1760) / 50 * Math.PI * 2 + 0.6; return [Math.cos(f) * 7, Math.sin(f) * 27]; }
			function posA(an) { var c = centro(an), s = separacao(an); return [c[0] - s[0] / 3, c[1] - s[1] / 3]; }
			function posB(an) { var c = centro(an), s = separacao(an); return [c[0] + s[0] * 2 / 3, c[1] + s[1] * 2 / 3]; }
			return function (buf, t, hud) {
				var c = t % CICLO, an = ano(c), bessel = an >= 1844, clark = c >= 10.5;
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// a linha reta que Bessel esperava (o caminho do ponto entre as duas)
				if (bessel) for (var q = 1760; q <= 1862; q += 0.7) { if (Math.round(q / 0.7) % 3 === 0) continue; var p = centro(q); pintar(buf, L, A, p[0], p[1], hex('#5a5aa8')); }
				// o rastro de Sirius A: as ondas
				for (q = 1760; q < an; q += 0.35) { var pa = posA(q); pintar(buf, L, A, pa[0], pa[1], an - q < 8 ? hex('#8fb0ff') : hex('#4a5aa8')); }
				// depois de 1862: o rastro de Sirius B, ao contrário, e a cruzinha no meio
				if (clark) {
					for (q = 1760; q <= 1862; q += 0.5) { if (Math.round(q * 2) % 2) continue; var pb = posB(q); pintar(buf, L, A, pb[0], pb[1], hex('#5a5a78')); }
					var cm = centro(an);
					[[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]].forEach(function (d) { pintar(buf, L, A, cm[0] + d[0], cm[1] + d[1], hex('#ffe08a')); });
				}
				// Sirius A, branco-azulada, com as pontinhas
				var a = posA(an), ax = Math.round(a[0]), ay = Math.round(a[1]);
				globoLuz(buf, L, A, ax, ay, 3, 0, -1, [hex('#ffffff'), hex('#e8f2ff'), hex('#bcd4ff'), hex('#8fb0f0')]);
				for (var e = 4; e <= 8; e++) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pintar(buf, L, A, ax + d[0] * e, ay + d[1] * e, e < 6 ? hex('#cfe0ff') : hex('#6a7ac8')); });
				// Sirius B: um pontinho, e a mira do telescópio de Clark piscando em volta
				if (clark) {
					var b = posB(an), bx = Math.round(b[0]), by = Math.round(b[1]);
					pintar(buf, L, A, bx, by, hex('#ffffff'));
					[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pintar(buf, L, A, bx + d[0], by + d[1], hex('#8a8ab0')); });
					if (Math.sin(t * 6) > -0.3) for (var g = 0; g < Math.PI * 2; g += 0.3) pintar(buf, L, A, bx + Math.cos(g) * 7, by + Math.sin(g) * 7, hex('#ffe08a'));
				}
				if (hud) {
					hud.ano.textContent = 'ano ' + Math.round(an);
					hud.estacao.textContent = !bessel ? 'Sirius anda pelo céu… fazendo ondas' : !clark ? 'Bessel: algo invisível a puxa!' : 'Clark vê a companheira (na mira)';
				}
			};
		},

		// A vida de Sirius B: ela nasceu maior que Sirius A, gastou o combustível mais depressa,
		// inchou até virar uma gigante vermelha, soltou as camadas de fora num anel de gás e
		// sobrou só o miolo, a anã branca do tamanho da Terra
		'sirius-vida': function (L, A) {
			var fundo = estrelasFundo(L, A, 191, 45), CICLO = 16, Ax = 150, Bx = 62, cy = A / 2 + 2;
			var AZUL = [hex('#ffffff'), hex('#e0ecff'), hex('#b0c8ff'), hex('#7f9cf0')];
			var GIGANTE = [hex('#ffe0a0'), hex('#ffb060'), hex('#f07a32'), hex('#c8461e'), hex('#8a2414'), hex('#4a1008')];
			var NEBULOSA = [hex('#7fe3d8'), hex('#5fb8c8'), hex('#e070a8'), hex('#a84a8a')];
			function milhoes(c) { return c < 3.5 ? 230 - c / 3.5 * 90 : c < 7.5 ? 140 - (c - 3.5) / 4 * 18 : 122 - (c - 7.5) / 3 * 4; }
			return function (buf, t, hud) {
				var c = t % CICLO;
				var incha = suave((c - 3.5) / 4), solta = suave((c - 7.5) / 3), hoje = c >= 10.5;
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// Sirius A: quase não muda (só fica um pouquinho maior e mais brilhante)
				globoLuz(buf, L, A, Ax, cy, 6 + (hoje ? 1 : 0), -1, -1, AZUL);
				// Sirius B
				if (solta < 0.02) {
					var R = 9 + incha * 26;
					for (var y = -R - 2; y <= R + 2; y++) for (var x = -R - 2; x <= R + 2; x++) {
						var d = Math.sqrt(x * x + y * y);
						if (d > R) continue;
						var mu = Math.sqrt(1 - (d / R) * (d / R)), lim = B4[(x & 1) + ((y & 1) << 1)];
						var pal = incha > 0.35 ? GIGANTE : AZUL, cel = incha > 0.35 ? ruido2d(x * 0.18 + t * 0.2, y * 0.18) : 0.5;
						var n = Math.floor((1 - mu) * (pal.length - 1.5) + (0.5 - cel) * 1.6 + lim * 0.8 + (incha > 0.35 ? 0 : -0.3) + (x + y > 0 ? 0.4 : 0));
						pintar(buf, L, A, Bx + x, cy + y, pal[Math.max(0, Math.min(pal.length - 1, n))]);
					}
				} else {
					// as camadas de fora se espalham num anel de gás (como a Nebulosa da Hélice) que vai sumindo
					var raio = 30 + solta * 46, some = 1 - suave((c - 9.5) / 1.6);
					for (var q = 0; q < 900; q++) {
						var ang = q * 2.39996, rr = raio * (0.6 + 0.4 * Math.sqrt((q % 97) / 97)), px = Bx + Math.cos(ang) * rr, py = cy + Math.sin(ang) * rr * 0.92;
						if (ruido2d(px * 0.2 + 5, py * 0.2) > some * 0.9) continue;
						pintar(buf, L, A, px, py, NEBULOSA[(rr / raio > 0.85 ? 2 : 0) + (q % 3 === 0 ? 1 : 0)]);
					}
					// o miolo que sobrou: a anã branca, branquinha e minúscula
					pintar(buf, L, A, Bx, cy, hex('#ffffff'));
					[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pintar(buf, L, A, Bx + d[0], cy + d[1], hex('#cfe0ff')); });
					if (hoje) {
						// do lado, a Terra no mesmo tamanho (é desse tamanho que ela ficou)
						pintar(buf, L, A, Bx, cy + 9, hex('#4f8fe8')); pintar(buf, L, A, Bx + 1, cy + 9, hex('#5fd08a'));
						pintar(buf, L, A, Bx, cy + 10, hex('#3f6fc8')); pintar(buf, L, A, Bx + 1, cy + 10, hex('#4f8fe8'));
					}
				}
				if (hud) {
					hud.ano.textContent = hoje ? 'hoje' : 'há ' + Math.round(milhoes(c)) + ' milhões de anos';
					hud.estacao.textContent = c < 3.5 ? 'duas estrelas nascem: B é a maior' : c < 7.5 ? 'Sirius B incha: uma gigante vermelha' : !hoje ? 'ela solta as camadas de fora' : 'B virou uma anã branca, do tamanho da Terra';
				}
			};
		},

		// ---------- Nebulosa do Caranguejo ----------
		// O céu visto da China em 1054: uma noite comum no Touro; aparece a "estrela convidada", tão
		// forte que dá para ver de dia (o céu fica azul, com o Sol); depois, à noite, ela vai
		// apagando ao longo de quase dois anos até sumir; no fim, a nebulosa como é vista hoje
		'caranguejo-1054': function (L, A) {
			var fundo = estrelasFundo(L, A, 197, 40), CICLO = 16, sx = 112, sy = 40;
			// o Touro (o "V" da cabeça e os chifres), perto de onde a estrela aparece
			var TOURO = [[96, 52], [102, 58], [108, 64], [112, 58], [118, 52], [86, 40], [126, 40], [104, 70]];
			var NEBULOSA = [hex('#ffb070'), hex('#e0603a'), hex('#9fc0ff'), hex('#ffe0a0')];
			function quando(c) {
				if (c < 1.5) return ['junho de 1054', 'uma noite comum'];
				if (c < 5) return ['4 de julho de 1054', 'dá para ver até de dia!'];
				if (c < 12) { var m = Math.round((c - 5) / 7 * 21) + 1; return [m + (m > 1 ? ' meses' : ' mês') + ' depois', 'à noite, ainda brilhando'] }
				if (c < 13.5) return ['1056', 'apagou'];
				return ['hoje, num telescópio', 'a Nebulosa do Caranguejo'];
			}
			return function (buf, t, hud) {
				var c = t % CICLO, dia = c >= 1.5 && c < 5, forca = c < 1.5 ? 0 : c < 5 ? 1 : c < 12 ? 1 - (c - 5) / 7 * 0.92 : 0;
				// o céu: azul de dia, escuro de noite
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var alt = y / A;
					buf[y * L + x] = dia ? cor(70 + alt * 60, 130 + alt * 50, 210 + alt * 30) : cor(7, 5, 26);
				}
				if (!dia) {
					fundo(buf, t);
					TOURO.forEach(function (e) { pintar(buf, L, A, e[0], e[1], hex('#dfe8ff')); });
					pintar(buf, L, A, 104, 70, hex('#ffb070')); // Aldebarã, alaranjada
				} else {
					// o Sol, do lado
					globoLuz(buf, L, A, 40, 34, 7, 0, -1, [hex('#ffffff'), hex('#fff6d0'), hex('#ffe08a')]);
				}
				// a estrela convidada
				if (forca > 0.02) {
					var tam = 1 + forca * 5;
					for (var yy = -tam - 2; yy <= tam + 2; yy++) for (var xx = -tam - 2; xx <= tam + 2; xx++) {
						var d = Math.sqrt(xx * xx + yy * yy), raio = Math.min(Math.abs(xx), Math.abs(yy)) < 1 ? 0.6 : 0;
						var v = (1 - d / (tam + 2)) * (0.5 + raio) * (0.4 + forca);
						if (v > 0.15 && B4[((sx + xx) & 1) + (((sy + yy) & 1) << 1)] < v * 1.6) pintar(buf, L, A, sx + xx, sy + yy, v > 0.55 ? hex('#ffffff') : dia ? hex('#fff8e0') : hex('#ffe8b0'));
					}
				}
				// hoje: a nebulosa, uma manchinha com fiapos
				if (c >= 13.5) for (var q = 0; q < 160; q++) {
					var a = q * 2.39996, rr = Math.sqrt(q / 160) * 7, px = sx + Math.cos(a) * rr * 1.3, py = sy + Math.sin(a) * rr;
					pintar(buf, L, A, px, py, NEBULOSA[rr < 2.5 ? 2 : q % 4 === 0 ? 3 : q % 2 ? 0 : 1]);
				}
				// o chão, com o telhado de um observatório chinês
				for (var x2 = 0; x2 < L; x2++) {
					var h = 8 + Math.sin(x2 * 0.04) * 2;
					for (var y2 = Math.round(A - h); y2 < A; y2++) buf[y2 * L + x2] = dia ? hex('#2a3a2a') : hex('#05040a');
				}
				var tx = 160, ty = A - 10, TELHADO = dia ? hex('#4a2a2a') : hex('#0c0a14');
				for (var i = 0; i < 4; i++) for (var j = -14 - i * 0; j <= 14; j++) {
					var curva = Math.abs(j) > 11 ? 1 : 0;
					pintar(buf, L, A, tx + j, ty - 10 - i - curva * (Math.abs(j) - 11), TELHADO);
				}
				for (var py2 = ty - 9; py2 < ty + 2; py2++) for (var px2 = tx - 9; px2 <= tx + 9; px2++) pintar(buf, L, A, px2, py2, TELHADO);
				for (j = -6; j <= 6; j++) pintar(buf, L, A, tx + j, ty - 14, TELHADO);
				if (hud) { var w = quando(c); hud.ano.textContent = w[0]; hud.estacao.textContent = w[1]; }
			};
		},

		// O pulsar como um farol: gira e solta dois feixes de luz em lados opostos. Quando um feixe
		// passa pela Terra (à direita), ela pisca e o gráfico embaixo marca um pico. Câmera lenta:
		// aqui, uma volta a cada 2 segundos; de verdade, 30 voltas por segundo
		'caranguejo-pulsar': function (L, A) {
			// (bem devagar, para dar para acompanhar o feixe: uma volta a cada 8 segundos)
			var fundo = estrelasFundo(L, A, 199, 40), cx = 62, cy = 48, Tx = 182, Ty = 48, VOLTA = 8, JANELA = 16;
			var FIAPOS = [];
			var aleat = semente(201);
			for (var i = 0; i < 140; i++) { var a = aleat() * Math.PI * 2, r = 22 + aleat() * 12; FIAPOS.push([cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 0.8, aleat() < 0.5 ? '#c8602a' : '#8a3a2a']); }
			return function (buf, t, hud) {
				var ang = (t / VOLTA) * Math.PI * 2;
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				FIAPOS.forEach(function (f) { pintar(buf, L, A, f[0], f[1], hex(f[2])); });
				// os dois feixes (cones estreitos que giram)
				[0, Math.PI].forEach(function (lado) {
					var a2 = ang + lado;
					for (var s = 4; s < 140; s += 0.7) {
						var larg = s * 0.06;
						for (var w = -larg; w <= larg; w += 0.8) {
							var px = cx + Math.cos(a2) * s - Math.sin(a2) * w, py = cy + Math.sin(a2) * s + Math.cos(a2) * w;
							var f = (1 - s / 140) * (1 - Math.abs(w) / (larg + 0.5));
							if (f > 0.08 && B4[(Math.round(px) & 1) + ((Math.round(py) & 1) << 1)] < f * 1.8) pintar(buf, L, A, px, py, f > 0.5 ? hex('#cfe0ff') : hex('#5a7ad8'));
						}
					}
				});
				// a estrela de nêutrons, com o ímã (torto em relação ao giro) que gira junto: os feixes
				// saem dos dois polos dele, o vermelho (norte) e o azul (sul)
				globoLuz(buf, L, A, cx, cy, 3, 0, -1, [hex('#ffffff'), hex('#e8f2ff'), hex('#9fc0ff')]);
				[[0, '#ff5a6a'], [Math.PI, '#5a8aff']].forEach(function (polo) {
					var pa = ang + polo[0];
					for (var e = 2; e <= 6; e++) pintar(buf, L, A, cx + Math.cos(pa) * e, cy + Math.sin(pa) * e, hex(polo[1]));
					[[0, 1], [0, -1], [1, 0]].forEach(function (q) { pintar(buf, L, A, cx + Math.cos(pa) * 6 - Math.sin(pa) * q[0] + Math.cos(pa) * q[1] * 0, cy + Math.sin(pa) * 6 + Math.cos(pa) * q[0], hex(polo[1])); });
				});
				// a Terra pisca quando um feixe passa por ela
				var dif = Math.abs(((ang % Math.PI) + Math.PI) % Math.PI), pisca = dif < 0.12 || dif > Math.PI - 0.12;
				// o tempo desde a última passada do feixe (uma a cada meia volta): a Terra continua
				// acesa por quase 1 segundo e a mensagem fica 2,5 segundos, para dar tempo de ler
				var desde = ((t + VOLTA * 0.02) % (VOLTA / 2)), aceso = pisca || desde < 0.9, lendo = t > 1 && desde < 2.5;
				if (aceso) for (var g = 0; g < Math.PI * 2; g += 0.3) { pintar(buf, L, A, Tx + Math.cos(g) * 7, Ty + Math.sin(g) * 7, hex('#ffffff')); pintar(buf, L, A, Tx + Math.cos(g) * 9, Ty + Math.sin(g) * 9, hex('#9be36a')); }
				globoLuz(buf, L, A, Tx, Ty, 4, -1, -0.3, [hex('#9fe0ff'), hex('#4f8fe8'), hex('#3a7a4a'), hex('#1f3a6a')]);
				// o gráfico das piscadas: os últimos 16 segundos, andando para a esquerda
				var g0 = 10, g1 = 190, gy = A - 10;
				for (var gx = g0; gx <= g1; gx += 2) pintar(buf, L, A, gx, gy, hex('#2a2a50'));
				for (gx = g0; gx <= g1; gx++) {
					var tp = t - (g1 - gx) / (g1 - g0) * JANELA;
					if (tp < 0) continue; // (antes de começar não tem piscada)
					var ap = ((tp / VOLTA) * Math.PI * 2) % Math.PI, d2 = Math.min(ap, Math.PI - ap);
					var alt = d2 < 0.12 ? Math.round((0.12 - d2) / 0.12 * 12) : 0;
					for (var yy = 0; yy <= alt; yy++) pintar(buf, L, A, gx, gy - yy, hex('#9be36a'));
				}
				if (hud) {
					hud.ano.textContent = 'piscadas: ' + Math.floor(t / VOLTA * 2);
					hud.estacao.textContent = pisca || lendo ? 'o feixe passou pela Terra: pisca!' : 'em câmera lenta (de verdade, 30 voltas por segundo)';
				}
			};
		},

		// ---------- Proxima Centauri ----------
		// Vista de cima: Proxima b dá a volta na estrela em 11 dias (aqui, 1 segundo = 1 dia), sempre
		// com o mesmo lado virado para ela. A bandeirinha fica no lado do dia e nunca vê a noite
		'proxima-b': function (L, A) {
			// o mesmo cenário das voltas em volta do Sol (como Urano e Marte), com Proxima, vermelha,
			// no lugar do Sol; na metade de cima da órbita, o planeta passa atrás da estrela
			var O = cenarioOrbita(L, A, 203), CICLO = 11;
			var ESTRELA = [hex('#ffd0a0'), hex('#ff9a6a'), hex('#e05a3a'), hex('#a8302a')];
			// o lado do dia (quente, iluminado) e o lado da noite (azul-escuro), bem diferentes
			var DIA = [hex('#ffd2b0'), hex('#f0a882'), hex('#d8845e')], NOITE = [hex('#3a3a78'), hex('#2a2a5e'), hex('#1e1c46')];
			function estrela(buf, t) {
				for (var y = -14; y <= 14; y++) for (var x = -14; x <= 14; x++) {
					var d = Math.sqrt(x * x + y * y);
					if (d > 8 && d < 14 && B4[(x & 1) + ((y & 1) << 1)] < (14 - d) / 7) pintar(buf, L, A, O.cx + x, O.cy + y, hex('#6a1a1a'));
				}
				globoLuz(buf, L, A, O.cx, O.cy, 8, -0.3, -0.5, ESTRELA, function (x, y) { return ruido2d(x * 0.5 + t * 0.4, y * 0.5) > 0.7 ? 1 : 0; });
			}
			return function (buf, t, hud) {
				var k = (t % CICLO) / CICLO, a = k * Math.PI * 2, p = O.pos(a, 1), px = Math.round(p[0]), py = Math.round(p[1]);
				O.fundo(buf);
				O.orbita(buf, 1, hex('#6a4a8a'));
				// no estilo de Urano: o eixo em pé com o polo marcado, as crateras e a bandeirinha
				// presas no chão e a setinha do giro. Ele gira uma vez a cada volta em torno da
				// estrela, do jeito certo para a bandeirinha ficar sempre virada para ela (no plano da
				// órbita, a estrela fica na direção a + 180°): é dia lá para sempre
				var planeta = function () {
					globoGirando(buf, L, A, px, py, { R: 9, inc: 0, giro: a + Math.PI, luz: [O.cx - px, O.cy - py], PAL: DIA, noite: NOITE,
						manchas: [[0.45, 0.9, 0.35], [-0.4, 2.4, 0.4], [0.1, 3.9, 0.35], [-0.2, 5.3, 0.3]], manchaPAL: [DIA[1], DIA[2], hex('#b06a54')],
						bandeira: [0, 0] });
				};
				if (O.atras(a)) { planeta(); estrela(buf, t); } else { estrela(buf, t); planeta(); }
				if (hud) {
					hud.ano.textContent = 'dia ' + Math.floor(k * 11) + ' de 11';
					hud.estacao.textContent = 'a bandeirinha fica sempre de dia';
				}
			};
		},

		// Uma corrida do Sol até Proxima (4,2 anos-luz), em três pistas: em cima, um raio de luz;
		// no meio, uma navezinha com vela, empurrada por um laser da Terra (um quinto da velocidade
		// da luz: uns 21 anos); embaixo, a Voyager 1 (mais de 70 mil anos: quase não sai do lugar)
		'proxima-viagem': function (L, A) {
			var fundo = estrelasFundo(L, A, 207, 40), CICLO = 16, x0 = 22, x1 = 176, PISTAS = [30, 56, 82];
			function anos(c) { return Math.min(25, c / 13 * 25); }
			return function (buf, t, hud) {
				var c = t % CICLO, an = anos(c);
				buf.fill(hex('#07051a'));
				fundo(buf, t);
				// o Sol na esquerda e Proxima na direita
				globoLuz(buf, L, A, 10, A / 2, 7, 1, -0.3, [hex('#fff4c0'), hex('#ffd36a'), hex('#ffb347'), hex('#e07a2a')]);
				globoLuz(buf, L, A, 190, A / 2, 5, -1, -0.3, [hex('#ffb08a'), hex('#e05a3a'), hex('#a8302a')]);
				PISTAS.forEach(function (py) { for (var x = x0; x <= x1; x += 3) pintar(buf, L, A, x, py, hex('#2a2a50')); });
				// a luz: chega em 4,2 anos
				var kl = Math.min(1, an / 4.2), lx = x0 + kl * (x1 - x0);
				for (var r = 0; r < 10; r++) pintar(buf, L, A, lx - r, PISTAS[0], r < 3 ? hex('#ffffff') : hex('#ffe08a'));
				// a navezinha com vela: chega em uns 21 anos (o laser empurra no começo)
				var kv = Math.min(1, an / 21), vx = x0 + kv * (x1 - x0), vy = PISTAS[1];
				if (an < 2) for (var lz = x0; lz < vx - 4; lz += 2) pintar(buf, L, A, lz, vy, hex('#ff4f6a'));
				for (var s = -4; s <= 4; s++) { pintar(buf, L, A, vx - 2, vy + s, hex('#dfe8ff')); if (Math.abs(s) < 4) pintar(buf, L, A, vx - 3, vy + s, hex('#9aa6d8')); }
				pintar(buf, L, A, vx, vy, hex('#ffe08a')); pintar(buf, L, A, vx - 1, vy, hex('#c8c8e8'));
				// a Voyager 1: em 25 anos, anda 25/75.000 do caminho (nem um pixel)
				var gx = x0 + 1, gy = PISTAS[2];
				pintar(buf, L, A, gx, gy, hex('#c8c8e8')); pintar(buf, L, A, gx - 1, gy - 1, hex('#8a8ab0')); pintar(buf, L, A, gx - 1, gy + 1, hex('#8a8ab0')); pintar(buf, L, A, gx + 1, gy, hex('#ffffff'));
				if (hud) {
					hud.ano.textContent = 'ano ' + numero(an, an < 10 ? 1 : 0);
					hud.estacao.textContent = an < 4.2 ? 'a luz vai na frente' : an < 21 ? 'a luz chegou! a vela ainda vai' : 'a vela chegou! a Voyager… nem saiu';
				}
			};
		}
	};
	// ---------- Os sons de verdade (tocador da seção "Ouça de verdade") ----------
	// Um som de cada vez: tocar um para o outro. O botão vira pausa, e a barrinha anda.
	var somTocando = null;
	document.querySelectorAll('.sons-tocar').forEach(function (b) {
		var item = b.closest('.som'), barra = item.querySelector('.sons-barra i'), audio = null;
		b.addEventListener('click', function () {
			if (!audio) {
				audio = new Audio(b.getAttribute('data-audio'));
				// a duração vem dos dados (alguns navegadores não sabem a duração de arquivos .aac)
				audio.addEventListener('timeupdate', function () {
					var total = parseFloat(b.getAttribute('data-duracao')) || (isFinite(audio.duration) ? audio.duration : 0);
					if (total) barra.style.width = Math.min(100, audio.currentTime / total * 100) + '%';
				});
				audio.addEventListener('ended', function () { item.classList.remove('tocando'); barra.style.width = '0%'; somTocando = null; });
			}
			if (item.classList.contains('tocando')) { audio.pause(); item.classList.remove('tocando'); b.setAttribute('aria-pressed', 'false'); somTocando = null; return; }
			if (somTocando && somTocando !== audio) somTocando.pause();
			document.querySelectorAll('.som.tocando').forEach(function (o) { o.classList.remove('tocando'); o.querySelector('.sons-tocar').setAttribute('aria-pressed', 'false'); });
			audio.play();
			item.classList.add('tocando');
			b.setAttribute('aria-pressed', 'true');
			somTocando = audio;
		});
	});

	// ---------- O céu visto de cada destino ----------
	// Um desenhador de céu: cada destino diz o que aparece no céu de lá (visuais-dados.js, "ceu"):
	//  fundo, nuvens: [[x, y, raio, cor, força]] (nebulosas, pontilhadas), estrelas: quantas estrelas
	//  soltas e de que cores, brilhantes: [[x, y, cor, tamanho, pisca?]], disco: [x, y, raio, cor]
	//  (uma estrela enorme no céu), anel: [x, y, rx, ry, cor] (o anel da Hélice), galaxia:
	//  [x, y, rx, ry] (a Via Láctea vista de cima), linhas: [[x, y], ...] (uma constelação) e sol:
	//  [x, y, visível?]. O Sol visível é uma estrelinha amarela; invisível, só a mira pontilhada
	//  piscando no lugar onde ele estaria.
	function ceuDe(L, A, c) {
		var aleat = semente(c.semente || 91), soltas = [];
		var CORES = (c.coresEstrelas || ['#ffffff', '#cfe0ff', '#ffe8c8']).map(hex);
		for (var i = 0; i < (c.estrelas || 70); i++) soltas.push([aleat() * L | 0, aleat() * A | 0, aleat(), CORES[i % CORES.length], aleat() * 6]);
		function bolha(buf, x0, y0, r, corH, forca, t) {
			var cc = hex(corH);
			for (var y = Math.max(0, Math.floor(y0 - r)); y < Math.min(A, y0 + r); y++) for (var x = Math.max(0, Math.floor(x0 - r)); x < Math.min(L, x0 + r); x++) {
				var d = Math.hypot(x - x0, y - y0) / r;
				if (d > 1) continue;
				var v = (1 - d) * forca * (0.55 + ruido2d(x * 0.12 + t * 0.05, y * 0.12) * 0.9);
				if (B4[(x & 1) + ((y & 1) << 1)] < v) buf[y * L + x] = cc;
			}
		}
		return function (buf, t, hud) {
			buf.fill(hex(c.fundo || '#07051a'));
			(c.nuvens || []).forEach(function (n) { bolha(buf, n[0], n[1], n[2], n[3], n[4], t); });
			if (c.galaxia) {
				// a Via Láctea vista de cima: um disco inclinado com dois braços em espiral
				var g = c.galaxia;
				for (var q = 0; q < 1400; q++) {
					var r = Math.pow((q % 700) / 700, 0.8), ang = Math.log(r * 8 + 1) * 2.4 + (q >= 700 ? Math.PI : 0) + t * 0.02 + (ruido2d(q, 3) - 0.5) * 0.6;
					var px = g[0] + Math.cos(ang) * r * g[2], py = g[1] + Math.sin(ang) * r * g[3];
					pintar(buf, L, A, px, py, r < 0.18 ? hex('#fff0c8') : q % 3 ? hex('#8fa8e8') : hex('#e8c8ff'));
				}
				// o bojo do centro, na mesma proporção do disco (redondo quando a galáxia está de frente)
				var bx = Math.max(3, Math.round(g[2] * 0.1)), by = Math.max(2, Math.round(g[3] * 0.1));
				for (var gy = -by; gy <= by; gy++) for (var gx = -bx; gx <= bx; gx++) if (gx * gx / (bx * bx) + gy * gy / (by * by) < 1) pintar(buf, L, A, g[0] + gx, g[1] + gy, hex(gx * gx / (bx * bx) + gy * gy / (by * by) < 0.3 ? '#fff8e0' : '#ffe8b0'));
			}
			soltas.forEach(function (e) { var b = 0.45 + e[2] * 0.55 + Math.sin(t * 1.5 + e[4]) * 0.15; if (b > 0.55) buf[e[1] * L + e[0]] = e[3]; });
			if (c.anel) {
				var an = c.anel;
				for (var a = 0; a < Math.PI * 2; a += 0.004) {
					var rr = 1 + (ruido2d(Math.cos(a) * 3 + 9, Math.sin(a) * 3) - 0.5) * 0.25, w = (aleat() - 0.5) * 0.22;
					pintar(buf, L, A, an[0] + Math.cos(a) * an[2] * (rr + w), an[1] + Math.sin(a) * an[3] * (rr + w), hex(Math.abs(w) < 0.06 ? an[4] : an[5] || an[4]));
				}
			}
			if (c.disco) {
				// uma estrela enorme no céu (só um pedaço aparece), fervendo
				var dc = c.disco, PAL = [hex('#ffd0a0'), hex('#ff9a5a'), hex('#e0602a'), hex('#a8301e')];
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var d = Math.hypot(x - dc[0], y - dc[1]);
					if (d > dc[2] + 6) continue;
					if (d > dc[2]) { if (B4[(x & 1) + ((y & 1) << 1)] < (dc[2] + 6 - d) / 8) buf[y * L + x] = PAL[3]; continue; }
					var n = Math.floor(d / dc[2] * 2.6 + (0.5 - ruido2d(x * 0.15 + t * 0.2, y * 0.15)) * 1.4 + B4[(x & 1) + ((y & 1) << 1)] * 0.6);
					buf[y * L + x] = PAL[Math.max(0, Math.min(3, n))];
				}
			}
			if (c.linhas) for (var k = 0; k < c.linhas.length - 1; k++) {
				var p0 = c.linhas[k], p1 = c.linhas[k + 1], nn = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
				for (var s = 3; s < nn - 3; s += 2) pintar(buf, L, A, p0[0] + (p1[0] - p0[0]) * s / nn, p0[1] + (p1[1] - p0[1]) * s / nn, hex('#3a3a7a'));
			}
			(c.brilhantes || []).forEach(function (e, i) {
				var b = e[4] ? (0.55 + 0.45 * Math.max(0, Math.sin(t * (e[4] === 'rapido' ? 25 : 0.9) + i))) : 1, cc = hex(e[2]), tam = e[3];
				pintar(buf, L, A, e[0], e[1], b > 0.6 ? hex('#ffffff') : cc);
				for (var p = 1; p <= tam; p++) if (b > 0.4 || p === 1) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { pintar(buf, L, A, e[0] + dd[0] * p, e[1] + dd[1] * p, cc); });
				if (tam > 2) [[1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(function (dd) { pintar(buf, L, A, e[0] + dd[0], e[1] + dd[1], cc); });
			});
			// o Sol: estrelinha amarela (se dá para ver) ou só a mira piscando onde ele estaria
			if (c.sol) {
				var sx = c.sol[0], sy = c.sol[1], aceso = Math.sin(t * 3) > -0.2;
				if (c.sol[2]) { pintar(buf, L, A, sx, sy, hex('#fff4c0')); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { pintar(buf, L, A, sx + dd[0], sy + dd[1], hex('#ffd36a')); }); }
				else pintar(buf, L, A, sx, sy, hex('#5a5040'));
				if (aceso) for (var m = 0; m < Math.PI * 2; m += 0.35) pintar(buf, L, A, sx + Math.cos(m) * 6, sy + Math.sin(m) * 6, hex('#ffd36a'));
			}
			if (hud) { hud.ano.textContent = c.hud[0]; hud.estacao.textContent = c.hud[1]; }
		};
	}
	ANIMACOES.ceu = function (L, A) { return ceuDe(L, A, DADOS && DADOS.ceu || {}); };

	// ---------- As épocas da linha do tempo geral (cenas de 200 x 70) ----------
	// Antes dos telescópios: as pirâmides do Egito à noite, o Nilo refletindo o céu e Sirius
	// nascendo no horizonte (o sinal da cheia do rio)
	ANIMACOES['era-antiga'] = function (L, A) {
		var fundo = estrelasFundo(L, A, 211, 45), chao = A - 16;
		return function (buf, t) {
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) buf[y * L + x] = cor(10 + y * 0.5, 8 + y * 0.4, 30 + y * 0.9);
			fundo(buf, t);
			// Sirius subindo devagar no horizonte, à direita, piscando
			var sy = chao - 6 - ((t * 1.2) % 30), b = 0.7 + 0.3 * Math.sin(t * 4);
			pintar(buf, L, A, 160, sy, hex('#ffffff'));
			[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pintar(buf, L, A, 160 + d[0], sy + d[1], b > 0.8 ? hex('#cfe0ff') : hex('#8fb0ff')); });
			// o chão de areia e as pirâmides
			for (var x2 = 0; x2 < L; x2++) for (var y2 = chao; y2 < A; y2++) buf[y2 * L + x2] = y2 < chao + 4 ? hex('#3a2a28') : hex('#120c18');
			[[50, 26], [86, 20], [112, 13]].forEach(function (p) {
				for (var h = 0; h <= p[1]; h++) for (var w = -h; w <= h; w++) pintar(buf, L, A, p[0] + w, chao - p[1] + h, w < 0 ? hex('#4a3428') : hex('#6a4a34'));
			});
			// o Nilo, embaixo, refletindo a estrela
			for (var x3 = 0; x3 < L; x3++) for (var y3 = A - 7; y3 < A - 2; y3++) buf[y3 * L + x3] = hex('#14204a');
			if (Math.sin(t * 3) > -0.3) pintar(buf, L, A, 160, A - 5, hex('#8fb0ff'));
			for (var o = 0; o < L; o += 9) pintar(buf, L, A, (o + t * 6) % L, A - 4, hex('#2a3a7a'));
		};
	};
	// Os primeiros telescópios: uma luneta de latão apontada para Júpiter, com as quatro luas que
	// Galileu viu em 1610 dando voltas (vistas de lado, elas vão e voltam)
	ANIMACOES['era-telescopio'] = function (L, A) {
		var fundo = estrelasFundo(L, A, 213, 50);
		return function (buf, t) {
			buf.fill(hex('#07051a'));
			fundo(buf, t);
			// Júpiter com faixas, lá em cima à direita
			var jx = 150, jy = 22;
			globoLuz(buf, L, A, jx, jy, 6, -1, -0.5, [hex('#f5ead6'), hex('#e6d0b0'), hex('#c8a480'), hex('#8a6a4a')], function (x, y) { return Math.abs(y) === 2 ? 1 : 0; });
			[[11, 1.8, 0], [16, 0.9, 1.5], [23, 0.45, 3], [31, 0.2, 4.5]].forEach(function (lua) {
				var lx = jx + Math.cos(t * lua[1] + lua[2]) * lua[0], atras = Math.sin(t * lua[1] + lua[2]) < 0;
				if (!(atras && Math.abs(lx - jx) < 6)) pintar(buf, L, A, lx, jy, hex('#ffffff'));
			});
			// a luneta, no tripé, apontada para ele
			var x0 = 40, y0 = A - 22, dx = (jx - x0), dy = (jy - y0), n = Math.hypot(dx, dy); dx /= n; dy /= n;
			for (var s = -14; s <= 24; s++) for (var w = -2; w <= 2; w++) {
				var gr = s > 18 ? 2 : s < -8 ? 1 : 1.6;
				if (Math.abs(w) > gr) continue;
				pintar(buf, L, A, x0 + dx * s - dy * w, y0 + dy * s + dx * w, Math.abs(w) > gr - 0.7 ? hex('#8a5a1e') : s > 18 ? hex('#ffe08a') : hex('#d8a040'));
			}
			[[-10, 20], [0, 20], [10, 20]].forEach(function (p) { for (var k = 0; k <= 20; k++) pintar(buf, L, A, x0 + p[0] * k / 20, y0 + 2 + k, hex('#6a4a2a')); });
			// um brilho na ponta da luneta, como se ela pegasse a luz de Júpiter
			if (Math.sin(t * 2) > 0.6) pintar(buf, L, A, x0 + dx * 25, y0 + dy * 25, hex('#ffffff'));
		};
	};
	// O século 20: um foguete decolando da plataforma, com fogo e fumaça; recomeça a cada 7 segundos
	ANIMACOES['era-foguete'] = function (L, A) {
		var fundo = estrelasFundo(L, A, 217, 50), aleat = semente(219);
		var fumaca = [];
		for (var i = 0; i < 60; i++) fumaca.push([aleat() - 0.5, aleat(), aleat()]);
		return function (buf, t) {
			var c = t % 7, sobe = c < 1.2 ? 0 : Math.pow(c - 1.2, 2) * 3.2, fx = 100, fy = A - 12 - sobe;
			buf.fill(hex('#07051a'));
			fundo(buf, t);
			// a fumaça, espalhando no chão
			fumaca.forEach(function (f) {
				var r = Math.min(c * 9, 30) * f[2], px = fx + f[0] * r * 2.4, py = A - 6 - f[1] * r * 0.4;
				if (c > 0.6) pintar(buf, L, A, px, py, f[2] > 0.6 ? hex('#8a8aa0') : hex('#5a5a70'));
			});
			// a torre de lançamento
			for (var y = A - 40; y < A - 4; y++) { pintar(buf, L, A, 118, y, hex('#5a4a6a')); if (y % 4 === 0) pintar(buf, L, A, 117, y, hex('#5a4a6a')); }
			for (var x = 0; x < L; x++) for (var y2 = A - 4; y2 < A; y2++) buf[y2 * L + x] = hex('#1a1424');
			// o foguete: branco com faixas, ponta vermelha e aletas
			for (var yy = -14; yy <= 0; yy++) for (var xx = -2; xx <= 2; xx++) {
				if (yy < -11 && Math.abs(xx) > (yy + 14)) continue;
				pintar(buf, L, A, fx + xx, fy + yy, yy < -11 ? hex('#ff5a4a') : yy === -6 ? hex('#3a3a6a') : xx < 0 ? hex('#cfd4e8') : hex('#ffffff'));
			}
			[[-3, -1], [-3, 0], [3, -1], [3, 0], [-4, 0], [4, 0]].forEach(function (p) { pintar(buf, L, A, fx + p[0], fy + p[1], hex('#ff5a4a')); });
			// o fogo, tremendo
			if (c > 0.6) for (var k = 1; k <= 6 + Math.round(Math.sin(t * 30) * 2); k++) for (var w = -2; w <= 2; w++) {
				if (Math.abs(w) > 2 - k * 0.25) continue;
				pintar(buf, L, A, fx + w, fy + k, k < 3 ? hex('#ffffff') : k < 5 ? hex('#ffd36a') : hex('#ff8a3a'));
			}
		};
	};
	// O século 21: o telescópio James Webb flutuando, com o espelho dourado de 18 hexágonos em cima
	// do escudo roxo em camadas, balançando de leve na frente de uma nebulosa
	ANIMACOES['era-webb'] = function (L, A) {
		var fundo = estrelasFundo(L, A, 223, 50);
		var HEX = [];
		[[0, 0], [1, 0], [-1, 0], [0.5, -0.87], [-0.5, -0.87], [0.5, 0.87], [-0.5, 0.87], [2, 0], [-2, 0], [1.5, -0.87], [-1.5, -0.87], [1.5, 0.87], [-1.5, 0.87], [1, -1.73], [-1, -1.73], [0, -1.73], [1, 1.73], [-1, 1.73]].forEach(function (h) { HEX.push(h); });
		return function (buf, t) {
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
				var neb = ruido2d(x * 0.05 + t * 0.03, y * 0.06) * Math.exp(-Math.pow((x - 40) / 50, 2));
				buf[y * L + x] = neb > 0.55 && B4[(x & 1) + ((y & 1) << 1)] < (neb - 0.55) * 4 ? hex('#4a2a5a') : hex('#07051a');
			}
			fundo(buf, t);
			var cx = 120, cy = 30 + Math.sin(t * 0.8) * 2;
			// o escudo de proteção: cinco camadas roxas, uma em cima da outra
			for (var c = 0; c < 5; c++) for (var x2 = -32 + c * 3; x2 <= 32 - c * 3; x2++) pintar(buf, L, A, cx + x2, cy + 18 + c * 2 - Math.abs(x2) * 0.12, c % 2 ? hex('#8a5ab0') : hex('#c8a0e8'));
			// o espelho: hexágonos dourados, com um brilho passando
			HEX.forEach(function (h, i) {
				var hx = cx + h[0] * 6, hy = cy + h[1] * 6, brilho = Math.sin(t * 2 - h[0] * 0.8) > 0.85;
				for (var yy = -3; yy <= 3; yy++) for (var xx = -3; xx <= 3; xx++) {
					if (Math.abs(xx) + Math.abs(yy) * 0.58 > 3.2) continue;
					pintar(buf, L, A, hx + xx, hy + yy, brilho ? hex('#fff6c8') : (xx + yy) < 0 ? hex('#ffd36a') : hex('#d8a040'));
				}
			});
			// o espelhinho secundário, preso por três braços
			for (var k = 0; k < 14; k++) { pintar(buf, L, A, cx - 8 + k * 0.6, cy - 12 + k * 0.85, hex('#9aa6d8')); pintar(buf, L, A, cx + 8 - k * 0.6, cy - 12 + k * 0.85, hex('#9aa6d8')); }
			pintar(buf, L, A, cx, cy - 14, hex('#ffd36a')); pintar(buf, L, A, cx + 1, cy - 14, hex('#ffd36a'));
		};
	};
	// O futuro: o Sol incha até virar uma gigante vermelha, solta as camadas de fora num anel de
	// gás e sobra uma anã branca (recomeça a cada 12 segundos)
	ANIMACOES['era-futuro'] = function (L, A) {
		var fundo = estrelasFundo(L, A, 227, 50), cx = 100, cy = A / 2;
		var AMARELO = [hex('#fff4c0'), hex('#ffd36a'), hex('#ffb347'), hex('#e07a2a')], VERMELHO = [hex('#ffd0a0'), hex('#ff8a4a'), hex('#d8462a'), hex('#8a2414')];
		return function (buf, t) {
			var c = t % 12, incha = suave((c - 2) / 4), solta = suave((c - 6.5) / 3.5);
			buf.fill(hex('#07051a'));
			fundo(buf, t);
			if (solta < 0.05) {
				var R = 6 + incha * 22, PAL = incha > 0.4 ? VERMELHO : AMARELO;
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d = Math.sqrt(x * x + y * y);
					if (d > R) continue;
					var n = Math.floor(d / R * 2.5 + (0.5 - ruido2d(x * 0.25 + t * 0.3, y * 0.25)) * 1.2 + B4[(x & 1) + ((y & 1) << 1)] * 0.6);
					pintar(buf, L, A, cx + x, cy + y, PAL[Math.max(0, Math.min(3, n))]);
				}
			} else {
				var raio = 24 + solta * 40, some = 1 - suave((c - 10) / 2);
				for (var a = 0; a < Math.PI * 2; a += 0.02) {
					var w = ruido2d(Math.cos(a) * 3 + 5, Math.sin(a) * 3) * 6;
					if (ruido2d(a * 6, 2) > some) continue;
					pintar(buf, L, A, cx + Math.cos(a) * (raio + w), cy + Math.sin(a) * (raio + w) * 0.6, a % 0.06 < 0.03 ? hex('#5fd6d0') : hex('#e0607a'));
				}
				pintar(buf, L, A, cx, cy, hex('#ffffff')); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { pintar(buf, L, A, cx + d[0], cy + d[1], hex('#cfe0ff')); });
			}
		};
	};
	// estrelinhas fixas de fundo, piscando de leve (usadas nas animações dos destinos)
	function estrelasFundo(L, A, s, n) {
		var aleat = semente(s), lista = [];
		for (var i = 0; i < n; i++) lista.push([aleat() * L | 0, aleat() * A | 0, aleat(), aleat() * 6]);
		return function (buf, t) {
			lista.forEach(function (e) { var b = 60 + e[2] * 90 + Math.sin(t * 1.5 + e[3]) * 25; buf[e[1] * L + e[0]] = cor(b, b, b + 40); });
		};
	}
	function pintar(buf, L, A, x, y, c) {
		x = Math.round(x); y = Math.round(y);
		if (x >= 0 && y >= 0 && x < L && y < A) buf[y * L + x] = c;
	}
	function suave(k) { return k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k); }
	// ruído suave (de 0 a 1), para bordas e texturas orgânicas nas animações
	function ruido2d(x, y) {
		function h(i, j) { var n = (Math.imul(i, 374761393) + Math.imul(j, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
		var xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi;
		u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v);
		var a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1);
		return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
	}
	// O cenário padrão das voltas em volta do Sol (o mesmo da animação de Urano): estrelas, a
	// órbita pontilhada vista meio de lado, o Sol com o brilho pontilhado e a posição na órbita.
	// Na metade de cima da órbita, o planeta passa atrás do Sol.
	function cenarioOrbita(L, A, s) {
		var aleat = semente(s), estrelas = [];
		for (var i = 0; i < 70; i++) estrelas.push([aleat() * L | 0, aleat() * A | 0, aleat()]);
		var FUNDO = hex('#07051a'), SOL = [hex('#fff4c0'), hex('#ffd36a'), hex('#ffb347'), hex('#e07a2a')], ORBITA = hex('#7472c8');
		var cx = L / 2, cy = A / 2, rx = L * 0.36, ry = A * 0.3;
		return {
			cx: cx, cy: cy,
			fundo: function (buf) {
				buf.fill(FUNDO);
				estrelas.forEach(function (e) { if (e[2] > 0.3) buf[e[1] * L + e[0]] = cor(120 + e[2] * 100, 120 + e[2] * 100, 160 + e[2] * 90); });
			},
			orbita: function (buf, esc, c) { for (var a = 0, n = 0; a < Math.PI * 2; a += 0.03 / esc, n++) if (n % 2 === 0) pintar(buf, L, A, cx + Math.cos(a) * rx * esc, cy + Math.sin(a) * ry * esc, c || ORBITA); },
			pos: function (ang, esc) { return [cx + Math.cos(ang) * rx * esc, cy + Math.sin(ang) * ry * esc]; },
			atras: function (ang) { return Math.sin(ang) < 0; },
			sol: function (buf) {
				for (var y = -9; y <= 9; y++) for (var x = -9; x <= 9; x++) {
					var d = Math.sqrt(x * x + y * y);
					if (d < 5.5) pintar(buf, L, A, cx + x, cy + y, SOL[d < 2.5 ? 0 : d < 4.2 ? 1 : 2]);
					else if (d < 9 && B4[(x & 1) + ((y & 1) << 1)] < (9 - d) / 4) pintar(buf, L, A, cx + x, cy + y, SOL[3]);
				}
			}
		};
	}
	// o eixo inclinado atravessando o planeta (como na Terra e em Urano): a linha passa por
	// trás do globo e a ponta do polo norte fica branquinha. "globo" desenha o planeta por cima
	function comEixo(buf, L, A, ux, uy, R, graus, globo) {
		var inc = graus * Math.PI / 180, ex = Math.sin(inc), ey = -Math.cos(inc), fora = Math.max(3, Math.round(R * 0.55));
		for (var e = -R - fora; e <= R + fora; e++) pintar(buf, L, A, ux + ex * e, uy + ey * e, hex('#9aa6d8'));
		globo();
		pintar(buf, L, A, ux + ex * (R + fora), uy + ey * (R + fora), hex('#ffffff'));
	}
	// Um planeta girando em volta do próprio eixo, no estilo da animação de Urano (que é a mais fácil
	// de entender): o eixo atravessa o globo e sai dos dois lados, com o polo norte marcado em
	// vermelho; manchas presas na superfície giram junto (é isso que mostra a rotação); uma setinha
	// curva perto do polo mostra o sentido do giro; e, se tiver, uma bandeirinha fincada no chão
	// dá a volta junto com o planeta (some quando vai para o lado de trás).
	// o: { R, inc (graus: 0 = eixo em pé, 90 = deitado), giro (radianos), luz: [lx, ly] (para onde
	//      fica o Sol), PAL (do claro ao escuro), manchas: [[eixo, longitude, tamanho]],
	//      manchaPAL (cor das manchas), calotas (polos brancos), faixas (listras de longitude),
	//      bandeira: [eixo, longitude], seta (true), noite: PAL do lado escuro (contraste forte) }
	function globoGirando(buf, L, A, ux, uy, o) {
		var R = o.R, inc = o.inc * Math.PI / 180, ax = Math.sin(inc), ay = -Math.cos(inc), bx = -ay, by = ax;
		var cg = Math.cos(o.giro), sg = Math.sin(o.giro), ln = Math.hypot(o.luz[0], o.luz[1]) || 1, lx = o.luz[0] / ln, ly = o.luz[1] / ln;
		var EIXO = hex('#9aa6d8'), POLO = hex('#ff5a6a'), SETA = hex('#ffd36a');
		var manchas = (o.manchas || []).map(function (m) { var r = Math.sqrt(1 - m[0] * m[0]); return [m[0], r * Math.cos(m[1]), r * Math.sin(m[1]), Math.cos(m[2])]; });
		// o eixo atrás do planeta (o globo cobre o meio dele)
		for (var e = -R - 5; e <= R + 8; e++) pintar(buf, L, A, ux + ax * e, uy + ay * e, EIXO);
		for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
			var d2 = x * x + y * y;
			if (d2 > R * R) continue;
			var z = Math.sqrt(R * R - d2), lim = B4[((ux + x) & 1) + (((uy + y) & 1) << 1)];
			var luz = (x * lx + y * ly + z * 0.3) / R;
			// o ponto no "mapa" do planeta: ao longo do eixo (a) e em volta dele (b, c), desfazendo o giro
			var a = (x * ax + y * ay) / R, b = (x * bx + y * by) / R, c = z / R;
			var b2 = b * cg + c * sg, c2 = -b * sg + c * cg, mancha = false;
			for (var q = 0; q < manchas.length; q++) if (a * manchas[q][0] + b2 * manchas[q][1] + c2 * manchas[q][2] > manchas[q][3]) { mancha = true; break; }
			var cor0;
			if (o.noite) {
				// dia e noite bem separados (a linha entre eles pontilhada)
				var dia = (x * lx + y * ly) / R + (lim - 0.5) * 0.3 > 0;
				var tom = Math.min(2, Math.floor(Math.sqrt(d2) / R * 2.2));
				cor0 = dia ? (mancha ? o.manchaPAL[tom] : o.PAL[tom]) : o.noite[mancha ? Math.min(2, tom + 1) : tom];
			} else {
				var n = Math.max(0, Math.min(o.PAL.length - 1, Math.round((1 - luz) * 3 + 0.8 + lim * 0.9)));
				if (o.faixas && Math.sin(Math.atan2(c2, b2) * 2) > 0.6) n = Math.min(o.PAL.length - 1, n + 1);
				cor0 = mancha ? o.manchaPAL[Math.min(o.manchaPAL.length - 1, n)] : o.PAL[n];
				if (o.calotas && Math.abs(a) > 0.86 && n < o.PAL.length - 2) cor0 = hex('#f4f8ff');
			}
			pintar(buf, L, A, ux + x, uy + y, cor0);
		}
		// a bandeirinha fincada no chão (só aparece quando está do lado da frente)
		if (o.bandeira) {
			var fa = o.bandeira[0], fr = Math.sqrt(1 - fa * fa), fb2 = fr * Math.cos(o.bandeira[1]), fc2 = fr * Math.sin(o.bandeira[1]);
			var fb = fb2 * cg - fc2 * sg, fc = fb2 * sg + fc2 * cg;
			if (fc > -0.05) {
				var nx = fa * ax + fb * bx, ny = fa * ay + fb * by; // para onde o chão "aponta" na tela
				// o mastro sai do chão para fora; quando a bandeirinha está de frente para nós (o "para
				// fora" fica apontando para a tela), ele fica em pé, para cima
				var nn = Math.hypot(nx, ny), dx = 0, dy = -1;
				if (nn > 0.55) { dx = nx / nn; dy = ny / nn; }
				var px0 = ux + nx * R, py0 = uy + ny * R;
				for (var k = 0; k <= 5; k++) pintar(buf, L, A, px0 + dx * k, py0 + dy * k, hex('#ffffff'));
				var tx = px0 + dx * 5, ty = py0 + dy * 5;
				[[1, 0], [2, 0], [3, 0], [1, 1], [2, 1]].forEach(function (p) { pintar(buf, L, A, tx + p[0], ty + p[1], hex('#ff4a5a')); });
			}
		}
		// a ponta norte do eixo, por cima do globo, com o polo vermelho
		for (e = R; e <= R + 8; e++) pintar(buf, L, A, ux + ax * e, uy + ay * e, EIXO);
		var pnx = Math.round(ux + ax * (R + 8)), pny = Math.round(uy + ay * (R + 8));
		[[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (p) { pintar(buf, L, A, pnx + p[0], pny + p[1], POLO); });
		// a setinha curva em volta do eixo, perto do polo norte, mostrando o sentido do giro
		// (a superfície da frente anda para o lado da ponta da seta)
		if (o.seta !== false) {
			// um anelzinho em volta do eixo, entre o planeta e o polo (o símbolo de "gira para este
			// lado"): a metade de trás mais apagada, a da frente acesa, com uma pontinha de seta no
			// meio da frente apontando para onde a superfície da frente anda
			var sx = ux + ax * (R + 4), sy = uy + ay * (R + 4), sent = o.sentido || 1;
			for (var th = 0; th < Math.PI * 2; th += 0.05) {
				var frente = Math.sin(th) < 0;
				pintar(buf, L, A, sx + bx * Math.cos(th) * 5.5 + ax * Math.sin(th) * 1.6, sy + by * Math.cos(th) * 5.5 + ay * Math.sin(th) * 1.6, frente ? SETA : hex('#8a6a2a'));
			}
			var fx2 = sx - ax * 1.6, fy2 = sy - ay * 1.6; // o meio da metade da frente
			[[1, 0], [2, 0], [0, 0], [0, 1], [0, -1], [-1, 1.5], [-1, -1.5], [-1, 1], [-1, -1]].forEach(function (q) { pintar(buf, L, A, fx2 - bx * sent * q[0] + ax * q[1], fy2 - by * sent * q[0] + ay * q[1], SETA); });
		}
	}
	// um planeta redondo iluminado pelo lado de (lx, ly); PAL vai do tom mais claro ao mais
	// escuro; "superficie" (opcional) escurece alguns pixels (crateras, manchas)
	function globoLuz(buf, L, A, ux, uy, R, lx, ly, PAL, superficie) {
		var n = Math.sqrt(lx * lx + ly * ly) || 1; lx /= n; ly /= n;
		for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
			var d2 = x * x + y * y;
			if (d2 > R * R) continue;
			var z = Math.sqrt(R * R - d2), luz = (x * lx + y * ly + z * 0.3) / R;
			var nivel = Math.round((1 - luz) * 3 + 0.8 + B4[(x & 1) + ((y & 1) << 1)] * 0.9);
			if (superficie) nivel += superficie(x, y, z);
			pintar(buf, L, A, ux + x, uy + y, PAL[Math.max(0, Math.min(PAL.length - 1, nivel))]);
		}
	}
	// As animações que contam o tempo (anos, semanas, dias) repetem um ciclo de tantos segundos.
	// Elas ganham uma barra embaixo: dá para pausar e arrastar para ir e voltar no tempo.
	var CICLOS = {
		'urano-rola': 16, 'terra-estacoes': 12, 'saturno-aneis': 14, 'mercurio-dia': 16, 'mercurio-calor': 16, 'marte-poeira': 16,
		'marte-ano': 15, 'netuno-ano': 16, 'terra-lua': 14, 'venus-estufa': 12, 'jupiter-mancha': 14, 'sol-aurora': 18, 'sol-foton': 16,
		'sgr-s2': 16, 'fermi-sopro': 15, 'orion-disco': 16, 'pleiades-separa': 16, 'helice-morte': 17, 'omega-engolida': 20, 'betelgeuse-apagao': 14, 'betelgeuse-supernova': 16, 'eta-par': 14, 'eta-erupcao': 16,
		'sirius-bambeio': 16, 'sirius-vida': 16, 'caranguejo-1054': 16, 'proxima-b': 11, 'proxima-viagem': 16
	};
	document.querySelectorAll('canvas[data-animacao]').forEach(function (tela) {
		var nome = tela.getAttribute('data-animacao'), criar = ANIMACOES[nome];
		if (!criar) return;
		var L = tela.width, A = tela.height, ctx = tela.getContext('2d'), img = ctx.createImageData(L, A), buf = new Uint32Array(img.data.buffer);
		var quadro = criar(L, A), figura = tela.closest('figure'), hud = null, ciclo = CICLOS[nome];
		if (figura && figura.querySelector('[data-hud]')) hud = { ano: figura.querySelector('[data-hud="ano"]'), estacao: figura.querySelector('[data-hud="estacao"]') };
		var visivel = true, tempo = ciclo ? 0 : 2, tocando = !calmo, anterior = performance.now(), ultimo = 0;
		var barra = null, botao = null;
		function desenhar() {
			quadro(buf, tempo, hud);
			ctx.putImageData(img, 0, 0);
			if (barra) barra.value = Math.round(((tempo % ciclo) / ciclo) * 1000);
		}
		if (ciclo && figura) {
			var controle = document.createElement('div');
			controle.className = 'animacao-controle';
			controle.innerHTML = '<button type="button" class="animacao-play"></button>' +
				'<input type="range" min="0" max="1000" step="1" value="0" aria-label="Linha do tempo da animação: arraste para ir e voltar">';
			figura.insertBefore(controle, figura.querySelector('figcaption'));
			botao = controle.querySelector('button');
			barra = controle.querySelector('input');
			var atualizarBotao = function () {
				botao.classList.toggle('pausado', !tocando);
				botao.setAttribute('aria-label', tocando ? 'Pausar a animação' : 'Continuar a animação');
			};
			botao.addEventListener('click', function () { tocando = !tocando; anterior = performance.now(); atualizarBotao(); });
			// arrastando a barra, a animação pausa e mostra exatamente aquele momento
			barra.addEventListener('input', function () {
				tocando = false; atualizarBotao();
				tempo = (parseFloat(barra.value) / 1000) * ciclo;
				desenhar();
			});
			atualizarBotao();
		}
		desenhar();
		if ('IntersectionObserver' in window) new IntersectionObserver(function (e) { visivel = e[0].isIntersecting; }).observe(tela);
		(function laco(agora) {
			var dt = Math.min(0.1, (agora - anterior) / 1000);
			anterior = agora;
			if (tocando && visivel) {
				tempo += dt;
				if (ciclo && tempo >= ciclo) tempo -= ciclo;
				if (agora - ultimo > 1000 / 15) { ultimo = agora; desenhar(); } // 15 quadros por segundo
			}
			requestAnimationFrame(laco);
		})(performance.now());
	});

	// ---------- Comparação de tamanho com o Sol ----------
	// O Sol (a pixel art dele, com o brilho da página do Sol) e, ao lado, o planeta e a Terra
	// no tamanho real em relação a ele; uma lupa mostra o planeta ampliado, para dar para
	// reconhecer, e de tempos em tempos ele passa na frente do Sol, como uma sombrinha.
	var KM_SOL = 1392700, KM_TERRA = 12742;
	function quantos(n) {
		if (n >= 1e6) return numero(n / 1e6, n < 2e6 ? 1 : 0) + (n < 2e6 ? ' milhão' : ' milhões');
		if (n >= 10000) return numero(Math.round(n / 1000), 0) + ' mil';
		if (n >= 1000) return numero(n / 1000, 1) + ' mil';
		return numero(Math.round(n), 0);
	}
	// na página do Sol: ele com os 8 planetas em fila, cada um no tamanho real em relação a ele
	var PLANETAS = [['mercurio', 'Mercúrio', 4879], ['venus', 'Vênus', 12104], ['terra', 'Terra', 12742], ['marte', 'Marte', 6779],
		['jupiter', 'Júpiter', 139820], ['saturno', 'Saturno', 116460, 1.9], ['urano', 'Urano', 51118], ['netuno', 'Netuno', 49244]];
	var TOQUE = window.matchMedia && window.matchMedia('(hover: none)').matches;
	// um planetinha com lupa: passando o mouse (ou tocando), aparece ele ampliado
	function comLupa(nome, img, astro) {
		return '<span class="cv-item cv-com-lupa" tabindex="0" aria-label="' + nome + ' em tamanho real; passe o mouse ou toque para ampliar">' +
			astro + '<small>' + nome + '</small>' +
			'<span class="cv-lupa" aria-hidden="true"><span class="cv-lupa-vidro"><img src="' + img + '" alt=""></span><small class="cv-zoom"></small></span></span>';
	}
	// o quanto cada lupa amplia, pelo tamanho do pontinho dela
	function medirLupas(fig) {
		fig.querySelectorAll('.cv-com-lupa').forEach(function (item) {
			var d = item.querySelector('.cv-astro').getBoundingClientRect().height;
			item.querySelector('.cv-zoom').textContent = 'ampliado ' + Math.round(132 * 0.8 / d) + '×'; // a lupa tem 132 px
		});
	}
	document.querySelectorAll('.comparacao-viva[data-todos]').forEach(function (fig) {
		fig.innerHTML =
			'<div class="cv-cena">' +
				'<div class="cv-sol"><img src="pixel/sol.png" alt=""><i class="cv-transito"><small>Terra</small></i></div>' +
				'<div class="cv-lado">' +
					'<p class="cv-titulo">Os planetas em tamanho real ao lado do Sol</p>' +
					'<div class="cv-fila">' + PLANETAS.map(function (p) {
						return comLupa(p[1], 'pixel/' + p[0] + '.png', '<span class="cv-astro" data-km="' + p[2] + '" data-prop="' + (p[3] || 1) + '"><img src="pixel/' + p[0] + '.png" alt=""></span>');
					}).join('') + '</div>' +
					'<p class="cv-dica">' + (TOQUE ? 'Toque' : 'Passe o mouse') + ' em um planeta para ampliar</p>' +
				'</div>' +
			'</div>' +
			'<figcaption>O Sol é <b>109 vezes</b> mais largo que a Terra, e dentro dele caberiam cerca de <b>1,3 milhão de Terras</b>. Até Júpiter, o maior planeta, cabe dez vezes lado a lado no diâmetro do Sol.</figcaption>';
		var sol = fig.querySelector('.cv-sol'), transito = fig.querySelector('.cv-transito');
		function medir() {
			var D = sol.getBoundingClientRect().width * 0.92;
			fig.querySelectorAll('.cv-fila .cv-astro').forEach(function (a) {
				var d = Math.max(1.5, D * parseFloat(a.getAttribute('data-km')) / KM_SOL);
				a.style.width = (d * parseFloat(a.getAttribute('data-prop'))).toFixed(1) + 'px';
				a.style.height = d.toFixed(1) + 'px';
			});
			var dt = Math.max(2, D * KM_TERRA / KM_SOL);
			transito.style.width = transito.style.height = dt.toFixed(1) + 'px';
			medirLupas(fig);
		}
		medir();
		window.addEventListener('resize', medir);
		if (calmo) transito.style.display = 'none';
	});

	document.querySelectorAll('.comparacao-viva:not([data-todos])').forEach(function (fig) {
		var nome = fig.getAttribute('data-astro'), img = fig.getAttribute('data-img'), km = parseFloat(fig.getAttribute('data-km'));
		var plural = fig.getAttribute('data-plural') || nome + 's', prop = parseFloat(fig.getAttribute('data-proporcao')) || 1; // proporção: Saturno é mais largo por causa dos anéis
		var razao = km / KM_SOL, ladoALado = Math.round(1 / razao), dentro = Math.pow(1 / razao, 3), ehTerra = nome === 'Terra';
		fig.innerHTML =
			'<div class="cv-cena">' +
				'<div class="cv-sol"><img src="pixel/sol.png" alt=""><i class="cv-transito"><small>' + nome + '</small></i></div>' +
				'<div class="cv-lado">' +
					'<p class="cv-titulo">Tamanho real em relação ao Sol</p>' +
					'<div class="cv-pequenos">' +
						comLupa(nome, img, '<span class="cv-astro cv-alvo"><img src="' + img + '" alt=""></span>') +
						(ehTerra ? '' : comLupa('Terra', 'pixel/terra.png', '<span class="cv-astro cv-terra"></span>')) + // na Terra, ela mesma já é a régua
					'</div>' +
					'<p class="cv-dica">' + (TOQUE ? 'Toque' : 'Passe o mouse') + ' em ' + nome + (ehTerra ? '' : ' ou na Terra') + ' para ampliar</p>' +
				'</div>' +
			'</div>' +
			'<figcaption><b>' + ladoALado + ' ' + plural + '</b> lado a lado atravessariam o Sol de uma ponta à outra, e dentro dele caberiam cerca de <b>' + quantos(dentro) + ' ' + plural + '</b>.</figcaption>';
		var sol = fig.querySelector('.cv-sol'), alvo = fig.querySelector('.cv-alvo'), terra = fig.querySelector('.cv-terra');
		var transito = fig.querySelector('.cv-transito');
		function medir() {
			var D = sol.getBoundingClientRect().width * 0.92; // o disco do Sol ocupa ~92% da imagem
			var d = Math.max(2, D * razao), dt = Math.max(1.5, D * KM_TERRA / KM_SOL);
			alvo.style.width = (d * prop).toFixed(1) + 'px';
			alvo.style.height = d.toFixed(1) + 'px';
			if (terra) terra.style.width = terra.style.height = dt.toFixed(1) + 'px';
			transito.style.width = transito.style.height = d.toFixed(1) + 'px';
			medirLupas(fig);
		}
		medir();
		window.addEventListener('resize', medir);
		if (calmo) transito.style.display = 'none';
	});

	// ---------- Linha do tempo: os marcos acendem conforme a página rola ----------
	var marcos = document.querySelectorAll('.linha-tempo li');
	if (marcos.length) {
		if (calmo || !('IntersectionObserver' in window)) marcos.forEach(function (m) { m.classList.add('acesa'); });
		else {
			var acender = new IntersectionObserver(function (entradas) {
				entradas.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('acesa'); acender.unobserve(e.target); } });
			}, { rootMargin: '0px 0px -20% 0px' });
			marcos.forEach(function (m) { acender.observe(m); });
		}
	}

	// ---------- Calculadoras ----------
	function numero(n, casas) { return n.toLocaleString('pt-BR', { minimumFractionDigits: casas || 0, maximumFractionDigits: casas || 0 }); }
	document.querySelectorAll('[data-ferramenta="idade"]').forEach(function (c) {
		var ano = parseFloat(c.getAttribute('data-ano')), planeta = c.getAttribute('data-planeta');
		var campo = c.querySelector('input'), saida = c.querySelector('.calc-resultado');
		function calcular() {
			var idade = Math.max(0, Math.min(130, parseFloat(campo.value) || 0));
			var la = idade / ano, falta = ano - (idade % ano);
			// aniversário: em dias se faltar menos de um ano da Terra
			var quando = falta < 1 ? numero(Math.max(1, falta * 365.25), 0) + ' dias' : numero(falta, 0) + (Math.round(falta) === 1 ? ' ano' : ' anos') + ' da Terra';
			saida.innerHTML = 'Em ' + planeta + ' você teria <b>' + numero(la, la < 1 ? 2 : 1) + ' ' + (la >= 1 && la < 2 ? 'ano' : 'anos') + '</b>.<br>' +
				'Seu próximo aniversário de ' + planeta + ' seria daqui a ' + quando + '.';
		}
		campo.addEventListener('input', calcular);
		calcular();
	});
	function tempoBonito(horas) {
		var anos = horas / 8766;
		// tempos de viagem até os destinos da galáxia: milhões e bilhões de anos
		if (anos >= 1e9) return 'cerca de ' + numero(anos / 1e9, anos < 1e10 ? 1 : 0) + (anos < 2e9 ? ' bilhão' : ' bilhões') + ' de anos';
		if (anos >= 1e6) return 'cerca de ' + numero(anos / 1e6, anos < 1e7 ? 1 : 0) + (anos < 2e6 ? ' milhão' : ' milhões') + ' de anos';
		if (anos >= 2) return 'cerca de ' + numero(anos, 0) + ' anos';
		if (horas >= 48) return 'cerca de ' + numero(horas / 24, 0) + ' dias';
		if (horas * 60 < 1) return 'cerca de ' + numero(horas * 3600, 1) + ' segundo' + (horas * 3600 >= 2 ? 's' : '');
		var h = Math.floor(horas), min = Math.round((horas - h) * 60);
		return 'cerca de ' + (h ? h + ' h ' : '') + min + ' min';
	}
	// quanto já viajamos em volta do Sol (na página da Terra): uns 940 milhões de km por ano
	document.querySelectorAll('[data-ferramenta="voltas"]').forEach(function (c) {
		var porAno = parseFloat(c.getAttribute('data-km-ano')), campo = c.querySelector('input'), saida = c.querySelector('.calc-resultado');
		function calcular() {
			var idade = Math.max(0, Math.min(130, parseFloat(campo.value) || 0)), km = idade * porAno;
			var texto = km >= 1e9 ? numero(km / 1e9, 1) + ' bilhões de km' : numero(km / 1e6, 0) + ' milhões de km';
			saida.innerHTML = 'Você já viajou cerca de <b>' + texto + '</b> com a Terra em volta do Sol, ' +
				'dando ' + numero(idade, 0) + (Math.round(idade) === 1 ? ' volta' : ' voltas') + ' nele, sem sair do lugar.';
		}
		campo.addEventListener('input', calcular);
		calcular();
	});
	// a luz que vemos de um destino saiu de lá há tantos anos quanto a distância em anos-luz
	function anoBonito(a) {
		if (a <= 0) return numero(-a, 0) + ' a.C.';
		return a >= 10000 ? numero(a, 0) : String(a);
	}
	function epoca(a) {
		if (a < -10000) return 'quando os mamutes ainda andavam pela Terra';
		if (a < -3000) return 'antes da invenção da escrita';
		if (a < 476) return 'na Antiguidade';
		if (a < 1500) return 'na Idade Média';
		if (a < 1822) return 'quando o Brasil ainda era colônia de Portugal';
		return 'há pouco tempo';
	}
	document.querySelectorAll('[data-ferramenta="luz"]').forEach(function (c) {
		var al = parseFloat(c.getAttribute('data-anos-luz')), de = c.getAttribute('data-de');
		var campo = c.querySelector('input'), saida = c.querySelector('.calc-resultado'), hoje = new Date().getFullYear();
		// as distâncias são aproximadas: o ano de saída fica arredondado
		// (Sirius, a 8,6 anos-luz, fica no ano certinho)
		var arred = al >= 10000 ? 100 : al >= 100 ? 10 : 1, saiu = Math.round((hoje - al) / arred) * arred;
		function calcular() {
			var nasceu = Math.max(1900, Math.min(hoje, Math.round(parseFloat(campo.value) || hoje)));
			saida.innerHTML = 'A luz que chega hoje saiu ' + de + ' por volta do ano <b>' + anoBonito(saiu) + '</b>, ' + epoca(saiu) + '.<br>' +
				'E a luz que saiu de lá quando você nasceu só chega aqui no ano <b>' + anoBonito(Math.round(nasceu + al)) + '</b>.';
		}
		campo.addEventListener('input', calcular);
		calcular();
	});
	document.querySelectorAll('[data-ferramenta="viagem"]').forEach(function (c) {
		var km = parseFloat(c.getAttribute('data-km')), saida = c.querySelector('.calc-resultado'), veiculo = c.querySelector('.calc-veiculo');
		var botoes = c.querySelectorAll('.calc-opcoes button');
		botoes.forEach(function (b) {
			b.addEventListener('click', function () {
				botoes.forEach(function (o) { o.setAttribute('aria-pressed', o === b ? 'true' : 'false'); });
				var horas = b.hasAttribute('data-anos') ? parseFloat(b.getAttribute('data-anos')) * 8766 : km / parseFloat(b.getAttribute('data-kmh'));
				saida.innerHTML = b.getAttribute('data-frase') + ': <b>' + tempoBonito(horas) + '</b>' + (b.getAttribute('data-nota') || '') + '.';
				// o veiculozinho atravessa a trilha; quanto mais rápido o jeito de viajar, mais rápido ele vai
				veiculo.innerHTML = svgIcone(b.getAttribute('data-icone'));
				var dura = Math.max(0.6, Math.min(6, Math.log10(horas + 1) * 1.1));
				veiculo.style.animation = 'none'; void veiculo.offsetWidth;
				veiculo.style.animation = calmo ? 'none' : 'calc-viaja ' + dura.toFixed(2) + 's linear forwards';
				if (calmo) veiculo.style.left = 'calc(100% - 28px)';
			});
		});
	});

	// ---------- Quiz ----------
	document.querySelectorAll('.quiz').forEach(function (q) {
		var perguntas = q.querySelectorAll('.quiz-pergunta'), saida = q.querySelector('.quiz-resultado'), respondidas = 0, acertos = 0;
		perguntas.forEach(function (p) {
			var botoes = p.querySelectorAll('button');
			botoes.forEach(function (b) {
				b.addEventListener('click', function () {
					if (p.classList.contains('respondida')) return;
					p.classList.add('respondida');
					botoes.forEach(function (o) { o.disabled = true; if (o.hasAttribute('data-certa')) o.classList.add('certa'); });
					if (b.hasAttribute('data-certa')) acertos++; else b.classList.add('errada');
					respondidas++;
					if (respondidas < perguntas.length) return;
					if (acertos === perguntas.length) {
						// os quizzes dos planetas contam para um selo; os dos destinos da galáxia, para outro
						var galaxia = q.hasAttribute('data-quiz-galaxia');
						var selo = galaxia ? 'Sabe-tudo da Via Láctea' : 'Sabe-tudo do Sistema Solar', total = galaxia ? 12 : 8;
						if (window.PassaporteEspacial) window.PassaporteEspacial.anotar(galaxia ? 'quizGalaxia' : 'quiz', q.getAttribute('data-quiz'));
						var feitos = 0;
						try { feitos = ((JSON.parse(localStorage.getItem('passaporteEspacial')) || {})[galaxia ? 'quizzesGalaxia' : 'quizzes'] || []).length; } catch (e) {}
						saida.innerHTML = '<b>Acertou tudo!</b> ' + (feitos >= total ? 'Você ganhou o selo especial "' + selo + '"! Ele está no passaporte, na aba Conquistas.'
							: 'Quiz anotado no passaporte: ' + feitos + ' de ' + total + ' para o selo especial "' + selo + '".');
					} else {
						saida.innerHTML = 'Você acertou ' + acertos + ' de ' + perguntas.length + '. ';
						var deNovo = document.createElement('button');
						deNovo.type = 'button';
						deNovo.className = 'quiz-de-novo';
						deNovo.textContent = 'Tentar de novo';
						deNovo.addEventListener('click', function () {
							respondidas = 0; acertos = 0; saida.textContent = '';
							perguntas.forEach(function (pp) { pp.classList.remove('respondida'); pp.querySelectorAll('button').forEach(function (o) { o.disabled = false; o.classList.remove('certa', 'errada'); }); });
						});
						saida.appendChild(deNovo);
					}
				});
			});
		});
	});
})();
