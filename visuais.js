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
	/* (TR: o texto no idioma da visita, veja idioma.js; não é T porque uma animação tem uma variável T) */
	var TR = window.T || function (pt) { return pt; };
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
			if (sec) sec.appendChild(el('p', 'comparacao-dia', '<span class="icone-secao" data-icone="balao" aria-hidden="true"></span><span><b>' + TR('Isso é como…', 'That is like…') + '</b> ' + D.comparacoes[n] + '</span>'));
		});
		// mini animações (cada página tem duas, em seções diferentes)
		/* (as animações já refeitas, mais detalhadas, usam uma tela maior) */
		var GRANDES = /^/;
		[D.animacao, D.animacao2].forEach(function (a) {
			var secA = a && document.getElementById('secao-' + a.secao);
			if (secA) secA.appendChild(el('figure', 'animacao',
				'<canvas data-animacao="' + a.id + '" width="' + (GRANDES.test(a.id) ? 320 : 200) + '" height="' + (GRANDES.test(a.id) ? 176 : 110) + '" role="img" aria-label="' + a.aria + '"></canvas>' +
				'<div class="animacao-hud" aria-hidden="true"><span data-hud="ano">' + a.hud[0] + '</span><span data-hud="estacao">' + a.hud[1] + '</span></div>' +
				'<figcaption>' + a.legenda + '</figcaption>'));
		});
		// a imagem antiga de comparação vira a comparação viva com o Sol
		var antiga = document.querySelector('figure.comparacao'), c = D.comparacao;
		if (antiga && c && c.todos) { // na página do Sol: os 8 planetas em tamanho real ao lado dele
			var todos = el('figure', 'comparacao-viva');
			todos.setAttribute('data-todos', '1');
			todos.setAttribute('role', 'img');
			todos.setAttribute('aria-label', TR('Comparação de tamanho: o Sol e, ao lado, os oito planetas em tamanho real. Até Júpiter, o maior, parece pequeno perto do Sol, e a Terra é um pontinho.', 'Size comparison: the Sun and, next to it, the eight planets at true scale. Even Jupiter, the largest, looks small beside the Sun, and Earth is a tiny dot.'));
			antiga.parentNode.replaceChild(todos, antiga);
		} else if (antiga && c) {
			var viva = el('figure', 'comparacao-viva');
			viva.setAttribute('data-astro', D.nome);
			viva.setAttribute('data-img', 'pixel/' + pagina + '.png');
			viva.setAttribute('data-km', c.km);
			viva.setAttribute('data-plural', c.plural);
			if (c.proporcao) viva.setAttribute('data-proporcao', c.proporcao);
			viva.setAttribute('role', 'img');
			viva.setAttribute('aria-label', TR('Comparação de tamanho: ' + D.nome + ' em tamanho real ao lado do Sol. O diâmetro do Sol é cerca de ' + Math.round(1392700 / c.km) + ' vezes maior.', 'Size comparison: ' + D.nome + ' at true scale next to the Sun. The Sun is about ' + Math.round(1392700 / c.km) + ' times wider.'));
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
		if (D.ceu) secaoExtra('ceu', TR('O céu visto daqui', 'The sky from here'), '<p>' + D.ceu.texto + '</p>' +
			'<figure class="animacao"><canvas data-animacao="ceu" width="320" height="176" role="img" aria-label="' + D.ceu.aria + (D.ceu.chao === false ? '' : TR(' Embaixo, um astronauta olha o céu, em pé no chão de um planeta.', ' Below, an astronaut looks at the sky, standing on the ground of a planet.')) + '"></canvas>' +
			'<div class="animacao-hud" aria-hidden="true"><span data-hud="ano">' + D.ceu.hud[0] + '</span><span data-hud="estacao">' + D.ceu.hud[1] + '</span></div>' +
			'<figcaption>' + D.ceu.legenda + '</figcaption></figure>');
		if (D.linha) secaoExtra('linha-do-tempo', TR('Linha do tempo', 'Timeline'), '<ol class="linha-tempo">' +
			D.linha.map(function (m) { return '<li><b>' + m[0] + '</b><span>' + m[1] + '</span></li>'; }).join('') + '</ol>' +
			'<p class="linha-tempo-mais"><a href="linha-do-tempo.html">' + TR('Ver a linha do tempo de todos os destinos juntos', 'See the timeline of all destinations together') + ' &rarr;</a></p>');
		var K = D.calculadoras;
		if (K) {
			var cards = '';
			if (K.idade) cards +=
				'<div class="calc" data-ferramenta="idade" data-ano="' + K.idade + '" data-planeta="' + D.nome + '">' +
				'<label class="calc-titulo" for="calc-idade">' + TR('Quantos anos você teria em ' + D.nome + '?', 'How old would you be on ' + D.nome + '?') + '</label>' +
				'<div class="calc-entrada"><input id="calc-idade" type="number" min="0" max="130" value="10" inputmode="numeric"><span>' + TR('anos na Terra', 'Earth years') + '</span></div>' +
				'<p class="calc-resultado" aria-live="polite"></p></div>';
			if (K.voltas) cards +=
				'<div class="calc" data-ferramenta="voltas" data-km-ano="940000000">' +
				'<label class="calc-titulo" for="calc-voltas">' + TR('Quanto você já viajou em volta do Sol?', 'How far have you traveled around the Sun?') + '</label>' +
				'<div class="calc-entrada"><input id="calc-voltas" type="number" min="0" max="130" value="10" inputmode="numeric"><span>' + TR('anos de idade', 'years old') + '</span></div>' +
				'<p class="calc-resultado" aria-live="polite"></p></div>';
			// nos destinos da galáxia: quando saiu a luz que vemos de lá (e quando chega a de hoje)
			if (K.luz) cards +=
				'<div class="calc" data-ferramenta="luz" data-anos-luz="' + K.luz + '" data-de="' + K.de + '">' +
				'<label class="calc-titulo" for="calc-luz">' + TR('Quando saiu a luz que você vê ' + K.de + '?', 'When did the light you see from ' + K.de + ' leave?') + '</label>' +
				'<div class="calc-entrada"><input id="calc-luz" type="number" min="1900" max="2100" value="2015" inputmode="numeric"><span>' + TR('ano em que você nasceu', 'year you were born') + '</span></div>' +
				'<p class="calc-resultado" aria-live="polite"></p></div>';
			var V = K.viagem;
			if (V) cards +=
				'<div class="calc" data-ferramenta="viagem" data-km="' + V.km + '">' +
				'<p class="calc-titulo">' + (V.titulo || TR('Quanto tempo para chegar a ' + V.destino + '?', 'How long to get to ' + V.destino + '?')) + '</p>' +
				'<div class="calc-opcoes" role="group" aria-label="' + TR('Escolha o jeito de viajar', 'Choose how to travel') + '">' +
					'<button type="button" data-kmh="100" data-icone="carro" data-frase="' + TR('De carro, a 100 km/h', 'By car, at 100 km/h') + '">' + TR('Carro', 'Car') + '</button>' +
					'<button type="button" data-kmh="900" data-icone="aviao" data-frase="' + TR('De avião, a 900 km/h', 'By plane, at 900 km/h') + '">' + TR('Avião', 'Plane') + '</button>' +
					'<button type="button" ' + (V.sonda.kmh ? 'data-kmh="' + V.sonda.kmh + '"' : 'data-anos="' + V.sonda.anos + '"') + ' data-icone="foguete" data-frase="' + V.sonda.frase + '" data-nota="' + V.sonda.nota + '">' + (pagina === 'terra' ? TR('Foguete', 'Rocket') : TR('Sonda', 'Probe')) + '</button>' +
					'<button type="button" data-kmh="1079252849" data-icone="luz" data-frase="' + TR('Na velocidade da luz', 'At the speed of light') + '">' + TR('Luz', 'Light') + '</button>' +
				'</div>' +
				'<div class="calc-trilha" aria-hidden="true"><i class="calc-terra"></i><i class="calc-veiculo"></i>' +
					(pagina === 'terra' ? '<i class="calc-urano calc-lua"></i>'
						: D.quizGalaxia ? '<i class="calc-urano calc-estrela"></i>' // os destinos não têm pixel art pequena: uma estrelinha na cor deles
						: '<i class="calc-urano calc-destino" style="--destino:url(pixel/' + pagina + '.png)"></i>') + '</div>' +
				'<p class="calc-resultado" aria-live="polite">' + TR('Escolha um jeito de viajar.', 'Choose a way to travel.') + '</p>' +
				'<small class="calc-nota">' + V.nota + '</small></div>';
			secaoExtra('calculadoras', TR('Calculadoras espaciais', 'Space calculators'), '<div class="calculadoras">' + cards + '</div>');
		}
		// sons de verdade: gravações e "sonificações" da NASA e de observatórios (links para os sites deles)
		if (D.sons) secaoExtra('sons', TR('Ouça de verdade', 'Hear it for real'),
			'<p>' + TR('No espaço não tem ar, e sem ar o som não anda. Mas os telescópios e as sondas captam luz e ondas de rádio, e os cientistas transformam esses dados em sons que a gente pode ouvir. Use fone de ouvido!', 'There is no air in space, and without air sound cannot travel. But telescopes and probes pick up light and radio waves, and scientists turn that data into sounds we can hear. Use headphones!') + '</p>' +
			'<ul class="sons">' + D.sons.map(function (s) {
				// com o som guardado no site: um tocador (botão, barrinha e o link para a página original)
				if (s.audio) return '<li class="som"><button type="button" class="sons-tocar" data-audio="' + s.audio + '" data-duracao="' + (s.duracao || '') + '" aria-pressed="false" aria-label="' + TR('Tocar: ', 'Play: ') + s.titulo + '"><span class="sons-icone" aria-hidden="true"></span></button>' +
					'<span class="sons-texto"><b>' + s.titulo + '</b><span>' + s.texto + '</span><span class="sons-barra" aria-hidden="true"><i></i></span>' +
					'<small>' + s.fonte + ' · <a href="' + s.url + '" target="_blank" rel="noopener">' + TR('ver no site original, em inglês', 'see it on the original site') + ' &#8599;</a></small></span></li>';
				return '<li><a href="' + s.url + '" target="_blank" rel="noopener"><span class="sons-icone" aria-hidden="true">&#9835;</span><span class="sons-texto"><b>' + s.titulo + '</b><span>' + s.texto + '</span><small>' + s.fonte + ' · ' + TR('o site é em inglês', 'original site') + ' &#8599;</small></span></a></li>';
			}).join('') + '</ul>');
		var SELO_QUIZ = D.quizGalaxia ? TR('Sabe-tudo da Via Láctea', 'Milky Way Know-it-all') : D.quizLua ? TR('Sabe-tudo das luas', 'Moon Know-it-all') : TR('Sabe-tudo do Sistema Solar', 'Solar System Know-it-all');
		// "Quiz da Terra", "Quiz das Plêiades"... (o resto fica com "de")
		var DE = { 'Terra': 'da Terra', 'Lua': 'da Lua', 'Nebulosa de Órion': 'da Nebulosa de Órion', 'Plêiades': 'das Plêiades', 'Bolhas de Fermi': 'das Bolhas de Fermi',
			'Nebulosa da Hélice': 'da Nebulosa da Hélice', 'Estrela de Tabby': 'da Estrela de Tabby', 'Nebulosa do Caranguejo': 'da Nebulosa do Caranguejo' };
		if (D.quiz) secaoExtra('quiz', TR('Quiz ' + (DE[D.nome] || 'de ' + D.nome), D.nome + ' quiz'),'<div class="quiz" data-quiz="' + pagina + '"' + (D.quizGalaxia ? ' data-quiz-galaxia' : '') + (D.quizLua ? ' data-quiz-luas' : '') + '>' +
			'<p class="quiz-intro">' + TR('Acerte as três perguntas: cada quiz certo conta para o selo especial "' + SELO_QUIZ + '" do seu passaporte.', 'Get all three questions right: each quiz you ace counts toward the special "' + SELO_QUIZ + '" seal in your passport.') + '</p>' +
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
		/* os dados vêm numa tela de 200 x 110; aqui ela é maior (mais detalhe), e tudo é esticado junto */
		var k = L / 200, aleat = semente(c.semente || 91);
		function rgb(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
		function mistura(a, b, f) { return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; }
		/* pontilhado ordenado 4 x 4 (Bayer): os degradês viram pixel art */
		var BAY = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return (v + 0.5) / 16; });
		function bay(x, y) { return BAY[(x & 3) + ((y & 3) << 2)]; }
		function fbm(x, y) { var s = 0, a = 0.5, f = 1; for (var i = 0; i < 4; i++) { s += ruido2d(x * f + i * 17.3, y * f - i * 9.1) * a; f *= 2.03; a *= 0.5; } return s / 0.9375; }
		function liso(a, b, v) { var u = Math.max(0, Math.min(1, (v - a) / (b - a))); return u * u * (3 - 2 * u); }
		var FUNDO = rgb(c.fundo || '#07051a');
		var HOR = rgb(c.horizonte || (c.nuvens && c.nuvens.length ? c.nuvens[0][3] : '#1c1a48'));
		var temChao = c.chao !== false;

		/* ---- a camada parada (desenhada uma vez): o céu, as nebulosas, a galáxia, o anel, as estrelas fracas e o chão ---- */
		var F = new Float32Array(L * A * 3);
		function soma(x, y, cc, f) { var i = (y * L + x) * 3; F[i] += cc[0] * f; F[i + 1] += cc[1] * f; F[i + 2] += cc[2] * f; }
		/* o céu: um pouco mais claro perto do horizonte (a luz das nebulosas no ar) */
		for (var y = 0; y < A; y++) {
			var fh = temChao ? Math.pow(Math.max(0, (y / A - 0.3) / 0.5), 1.6) * 0.32 : 0, cy0 = mistura(FUNDO, HOR, fh);
			for (var x = 0; x < L; x++) { var i0 = (y * L + x) * 3; F[i0] = cy0[0]; F[i0 + 1] = cy0[1]; F[i0 + 2] = cy0[2]; }
		}
		/* as nebulosas: fiapos de gás com vários tons, que se enrolam (ruído deformado) e com faixas de poeira escura */
		(c.nuvens || []).forEach(function (n, ni) {
			var nx = n[0] * k, ny = n[1] * k, r = n[2] * k, cc = rgb(n[3]), forca = n[4], claro = mistura(cc, [255, 235, 225], 0.45), esc = 22 * k;
			for (var y = Math.max(0, Math.floor(ny - r * 1.25)); y < Math.min(A, ny + r * 1.25); y++) for (var x = Math.max(0, Math.floor(nx - r * 1.25)); x < Math.min(L, nx + r * 1.25); x++) {
				var wx = x / esc + ni * 7.1, wy = y / esc - ni * 3.3, q = fbm(wx, wy);
				var d = Math.hypot(x - nx, (y - ny) * 1.15) / r;
				var borda = Math.max(0, 1 - d * (0.7 + 0.6 * q));
				if (borda <= 0) continue;
				var fio = fbm(wx * 1.7 + q * 2.4, wy * 1.7 - q * 1.8);
				var dens = forca * Math.pow(borda, 1.2) * (0.25 + 1.5 * fio * fio);
				var poeira = liso(0.6, 0.74, fbm(wx * 2.4 + 5, wy * 2.4 - 3)) * 0.65;
				soma(x, y, dens > 0.42 ? mistura(cc, claro, Math.min(1, (dens - 0.42) * 2)) : cc, dens * 1.25 * (1 - poeira));
				if (poeira > 0) { var ip = (y * L + x) * 3; F[ip] *= 1 - poeira * borda * 0.5; F[ip + 1] *= 1 - poeira * borda * 0.5; F[ip + 2] *= 1 - poeira * borda * 0.5; }
			}
		});
		/* a Via Láctea vista de cima: braços em espiral com nós rosados, poeira e o bojo amarelado no meio */
		if (c.galaxia) {
			var g = c.galaxia, gx0 = g[0] * k, gy0 = g[1] * k, grx = g[2] * k, gry = g[3] * k;
			for (var y = Math.max(0, Math.floor(gy0 - gry * 1.2)); y < Math.min(A, gy0 + gry * 1.2); y++) for (var x = Math.max(0, Math.floor(gx0 - grx * 1.2)); x < Math.min(L, gx0 + grx * 1.2); x++) {
				var ux = (x - gx0) / grx, uy = (y - gy0) / gry, rr = Math.hypot(ux, uy);
				if (rr > 1.15) continue;
				var th = Math.atan2(uy, ux), espiral = Math.cos(2 * (th - 2.4 * Math.log(rr + 0.06)));
				var mancha = fbm(x / (6 * k), y / (6 * k));
				var braco = Math.pow(Math.max(0, espiral), 2.2) * Math.pow(Math.max(0, 1 - rr), 0.9) * (0.5 + mancha);
				var bojo = Math.exp(-Math.pow(rr / 0.17, 2)), disco = Math.exp(-rr * 3.2) * 0.45;
				var faixa = Math.pow(Math.max(0, -espiral), 3) * Math.max(0, 1 - rr) * 0.6;
				soma(x, y, [150, 172, 236], braco * 1.1 + disco * 0.6);
				soma(x, y, [255, 236, 196], bojo * 1.5 + disco * 0.3);
				if (braco > 0.3 && ruido2d(x / (2 * k), y / (2 * k)) > 0.82) soma(x, y, [255, 130, 190], 0.35);
				if (faixa > 0) { var ig = (y * L + x) * 3; F[ig] *= 1 - faixa; F[ig + 1] *= 1 - faixa; F[ig + 2] *= 1 - faixa; }
			}
		}
		/* o anel da Hélice: azul-esverdeado por dentro, avermelhado por fora, com os "nós" na beirada de dentro */
		if (c.anel) {
			var an = c.anel, ax = an[0] * k, ay = an[1] * k, arx = an[2] * k, ary = an[3] * k, dentro = rgb(an[4]), fora = rgb(an[5] || an[4]);
			for (var y = Math.max(0, Math.floor(ay - ary * 1.4)); y < Math.min(A, ay + ary * 1.4); y++) for (var x = Math.max(0, Math.floor(ax - arx * 1.4)); x < Math.min(L, ax + arx * 1.4); x++) {
				var ex = (x - ax) / arx, ey = (y - ay) / ary, th2 = Math.atan2(ey, ex);
				var ra = Math.hypot(ex, ey) * (1 + (fbm(Math.cos(th2) * 2 + 9, Math.sin(th2) * 2) - 0.5) * 0.22);
				var anelD = Math.exp(-Math.pow((ra - 1) / 0.16, 2)) * (0.55 + 0.6 * fbm(x / (7 * k), y / (7 * k)));
				var miolo = ra < 1 ? Math.pow(1 - ra, 0.4) * 0.28 : 0;
				soma(x, y, mistura(dentro, fora, liso(0.85, 1.15, ra)), anelD * 1.3);
				soma(x, y, dentro, miolo);
				if (ra > 0.8 && ra < 0.96 && ruido2d(x / (1.6 * k), y / (1.6 * k)) > 0.8) soma(x, y, [210, 90, 80], 0.6);
			}
		}
		/* as estrelas fracas, paradas (as que cintilam são desenhadas a cada quadro) */
		var CORES = (c.coresEstrelas || ['#ffffff', '#cfe0ff', '#ffe8c8']).map(rgb), soltas = [];
		var total = Math.round((c.estrelas || 70) * k * k);
		for (var s = 0; s < total; s++) {
			var sx = aleat() * L | 0, sy = aleat() * A | 0, sb = 0.18 + aleat() * aleat() * 0.7, sc = CORES[s % CORES.length];
			if (s % 9 === 0 && soltas.length < 70) soltas.push({ x: sx, y: sy, c: sc, b: 0.5 + aleat() * 0.5, v: 0.8 + aleat() * 2.2, f: aleat() * 6.3, cruz: aleat() < 0.35 });
			else soma(sx, sy, sc, sb);
		}
		/* as linhas de uma constelação, bem fraquinhas */
		if (c.linhas) for (var li = 0; li < c.linhas.length - 1; li++) {
			var p0 = c.linhas[li], p1 = c.linhas[li + 1], comp = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) * k;
			for (var st = 4; st < comp - 4; st += 2) {
				var lx = Math.round(p0[0] * k + (p1[0] - p0[0]) * k * st / comp), ly = Math.round(p0[1] * k + (p1[1] - p0[1]) * k * st / comp);
				if (lx >= 0 && ly >= 0 && lx < L && ly < A) soma(lx, ly, [90, 96, 170], 0.7);
			}
		}
		/* o chão de um planeta imaginário: uma serra recortada ao longe (escura, com a borda acesa pela luz do
		   céu) e, perto, o chão com pedras e rochas grandes, em silhueta */
		var chao = new Uint8Array(L * A), topoPerto = new Int16Array(L), bordas = [];
		if (temChao) {
			var sem = (c.semente || 91) * 0.37;
			/* (a serra é mais escura que o céu, para virar silhueta; o chão de perto, quase preto) */
			var serra = mistura(mistura(FUNDO, HOR, 0.1), [0, 0, 0], 0.5), perto = mistura([3, 2, 7], HOR, 0.03);
			var bordaSerra = mistura(HOR, [255, 236, 220], 0.32), bordaPerto = mistura(HOR, [255, 236, 220], 0.2);
			var HS = new Float32Array(L), HP = new Float32Array(L);
			for (var x = 0; x < L; x++) {
				/* a serra: picos (ruído "dobrado", que faz pontas) */
				var pico = 1 - Math.abs(ruido2d(x / (22 * k) + sem, 1.7) * 2 - 1), ond = fbm(x / (60 * k) + sem, 3.1);
				HS[x] = Math.round(A * 0.8 - (pico * 13 + ond * 16 + 2) * k);
				/* o chão de perto: ondulado, com rochas grandes de vez em quando */
				var rocha = Math.max(0, ruido2d(x / (14 * k) + sem + 4, 8.3) - 0.6) * 26 * k;
				HP[x] = Math.round(A * 0.9 - fbm(x / (30 * k) + sem + 9, 5.5) * 12 * k - rocha);
				topoPerto[x] = HP[x];
			}
			for (var x = 0; x < L; x++) {
				/* a borda acesa vai do topo de cada coluna até o topo da vizinha (assim ela fica contínua nas subidas) */
				var bS = Math.max(HS[x], x > 0 ? HS[x - 1] : HS[x], x < L - 1 ? HS[x + 1] : HS[x]);
				var bP = Math.max(HP[x], x > 0 ? HP[x - 1] : HP[x], x < L - 1 ? HP[x + 1] : HP[x]);
				for (var y = Math.max(0, HS[x]); y < A; y++) {
					var ic = (y * L + x) * 3, cc2;
					if (y >= HP[x]) {
						cc2 = y <= bP ? bordaPerto : perto;
						if (y <= bP) bordas.push([y * L + x, bordaPerto]);
					} else {
						var prof = Math.min(1, (y - HS[x]) / (10 * k));
						cc2 = y <= bS ? bordaSerra : mistura(mistura(serra, bordaSerra, 0.12), serra, prof);
						if (y <= bS) bordas.push([y * L + x, bordaSerra]);
					}
					F[ic] = cc2[0]; F[ic + 1] = cc2[1]; F[ic + 2] = cc2[2];
					chao[y * L + x] = 1;
				}
			}
		}
		/* tudo vira pixel art: cada cor é arredondada em degraus, com o pontilhado decidindo o degrau */
		var base = new Uint32Array(L * A), DEG = 10;
		for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
			var ib = (y * L + x) * 3, bb = bay(x, y);
			base[y * L + x] = cor(Math.min(255, Math.floor(F[ib] / DEG + bb) * DEG), Math.min(255, Math.floor(F[ib + 1] / DEG + bb) * DEG), Math.min(255, Math.floor(F[ib + 2] / DEG + bb) * DEG));
		}
		/* as bordas acesas do chão ficam com a cor exata (o pontilhado deixava a linha tracejada) */
		bordas.forEach(function (b) { base[b[0]] = cor(b[1][0], b[1][1], b[1][2]); });
		F = null;

		/* ---- o astronauta (em pé no chão, olhando o céu) e a plaquinha com o nome da Bianca ---- */
		/* (o: contorno, w: roupa, g: sombra, b: mochila, v: visor, l: luz do visor, r: faixa vermelha) */
		var ASTRO = [
			'.........o.', '...ooo..owo', '..owwwo.owo', '.owvvvwoowo', '.owvlvwowo.', '.owvvvwowo.', '..owwwoowo.',
			'.obwrrwwwo.', 'obbwwwwwo..', 'obbwwwwo...', 'obbwwwwo...', '.owwgwwo...', '.owwowwo...', '.owgogwo...', '.ogo.ogo...', 'oooo.ooo...'];
		var VISOR = mistura(HOR, [255, 220, 150], 0.35);
		var astroX = Math.round((c.astronauta !== undefined ? c.astronauta : (c.sol && c.sol[0] < 100 ? 172 : 26)) * k), olhaEsq = astroX > L / 2;
		var LETRAS = { B: ['110', '101', '110', '101', '110'], I: ['111', '010', '010', '010', '111'], A: ['111', '101', '111', '101', '101'], N: ['101', '111', '111', '101', '101'], C: ['011', '100', '100', '100', '011'] };
		function desenharAstronauta(buf, t) {
			if (!temChao) return;
			var pe = topoPerto[Math.max(0, Math.min(L - 1, astroX + 3))], y0 = pe - ASTRO.length + 1;
			var pal = { o: cor(14, 12, 26), w: cor(222, 226, 240), g: cor(150, 150, 172), b: cor(112, 116, 146), v: cor(VISOR[0], VISOR[1], VISOR[2]), l: cor(Math.min(255, VISOR[0] + 70), Math.min(255, VISOR[1] + 70), Math.min(255, VISOR[2] + 70)), r: cor(232, 80, 110) };
			ASTRO.forEach(function (lin, j) {
				for (var i = 0; i < lin.length; i++) {
					var ch = lin[i]; if (ch === '.') continue;
					pintar(buf, L, A, olhaEsq ? astroX + 10 - i : astroX + i, y0 + j, pal[ch]);
				}
			});
			/* um brilho passa pelo visor de vez em quando, e a luzinha da antena pisca */
			if (Math.sin(t * 0.7) > 0.75) pintar(buf, L, A, olhaEsq ? astroX + 7 : astroX + 3, y0 + 3, cor(255, 255, 255));
			pintar(buf, L, A, olhaEsq ? astroX + 7 : astroX + 3, y0, cor(40, 40, 60));
			if (Math.sin(t * 3) > 0) pintar(buf, L, A, olhaEsq ? astroX + 7 : astroX + 3, y0 - 1, cor(255, 90, 110));
			/* a plaquinha fincada no chão, com o nome (pequenininho) */
			var px0 = olhaEsq ? astroX - 31 : astroX + 16, pchao = topoPerto[Math.max(0, Math.min(L - 1, px0 + 12))], py0 = pchao - 11;
			var tabua = cor(Math.min(255, HOR[0] * 0.4 + 88), Math.min(255, HOR[1] * 0.4 + 78), Math.min(255, HOR[2] * 0.4 + 66)), madeira = cor(30, 24, 28);
			for (var yy = 0; yy < 7; yy++) for (var xx = 0; xx < 26; xx++) pintar(buf, L, A, px0 + xx, py0 + yy, yy === 0 || yy === 6 || xx === 0 || xx === 25 ? madeira : tabua);
			for (var yy = 7; yy < 11; yy++) pintar(buf, L, A, px0 + 12, py0 + yy, madeira);
			'BIANCA'.split('').forEach(function (l, n) {
				LETRAS[l].forEach(function (lin, j) { for (var i = 0; i < 3; i++) if (lin[i] === '1') pintar(buf, L, A, px0 + 2 + n * 4 + i, py0 + 1 + j, madeira); });
			});
		}

		/* ---- uma estrela brilhante: núcleo branco, halo pontilhado na cor dela e raios em cruz ---- */
		function brilhante(buf, x, y, cc, tam, b, t) {
			x = Math.round(x); y = Math.round(y);
			var R = Math.round(tam * 2.6 * k * (0.55 + 0.45 * b)), cr = rgb(cc);
			for (var yy = -R; yy <= R; yy++) for (var xx = -R; xx <= R; xx++) {
				var px2 = x + xx, py2 = y + yy;
				if (px2 < 0 || py2 < 0 || px2 >= L || py2 >= A || chao[py2 * L + px2]) continue;
				var d = Math.hypot(xx, yy) / R;
				if (d >= 1) continue;
				var forca = Math.pow(1 - d, 1.8) * b;
				if (bay(px2, py2) < forca * 1.4) buf[py2 * L + px2] = forca > 0.45 ? cor(Math.min(255, cr[0] * 0.8 + 50), Math.min(255, cr[1] * 0.8 + 50), Math.min(255, cr[2] * 0.8 + 50)) : cor(cr[0] * 0.5, cr[1] * 0.5, cr[2] * 0.55);
			}
			/* os raios: curtos, contínuos, apagando para a ponta; nas maiores, também nas diagonais */
			var raio = Math.round((tam * 1.8 + 1) * k * b);
			function raioPara(dx, dy, n) {
				for (var p = 1; p <= n; p++) {
					var f = 1 - p / (n + 1), qx = x + dx * p, qy = y + dy * p;
					if (qx < 0 || qy < 0 || qx >= L || qy >= A || chao[qy * L + qx]) continue;
					buf[qy * L + qx] = f > 0.6 ? cor(255, 255, 255) : cor(Math.min(255, cr[0] * (0.35 + f)), Math.min(255, cr[1] * (0.35 + f)), Math.min(255, cr[2] * (0.4 + f)));
				}
			}
			[[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { raioPara(dd[0], dd[1], raio); });
			if (tam > 2) [[1, 1], [-1, -1], [1, -1], [-1, 1]].forEach(function (dd) { raioPara(dd[0], dd[1], Math.round(raio * 0.35)); });
			[[0, 0], [1, 0], [0, 1], [1, 1]].forEach(function (dd) { if (tam > 2 || (dd[0] === 0 && dd[1] === 0)) pintar(buf, L, A, x + dd[0], y + dd[1], cor(255, 255, 255)); });
		}

		/* ---- estrela-cadente, de vez em quando ---- */
		var cadente = null, proxCadente = 3 + aleat() * 5;

		return function (buf, t, hud) {
			buf.set(base);
			/* a estrela gigante no céu (Betelgeuse), fervendo: grãos de convecção, borda mais escura e uma coroa */
			if (c.disco) {
				var dc = c.disco, dx0 = dc[0] * k, dy0 = dc[1] * k, R = dc[2] * k;
				var PAL = [[255, 214, 160], [255, 160, 92], [228, 98, 44], [168, 48, 30], [96, 22, 20]].map(function (v) { return cor(v[0], v[1], v[2]); });
				for (var y = Math.max(0, Math.floor(dy0 - R - 10 * k)); y < Math.min(A, dy0 + R + 10 * k); y++) for (var x = 0; x < Math.min(L, dx0 + R + 10 * k); x++) {
					if (chao[y * L + x]) continue;
					var d = Math.hypot(x - dx0, y - dy0);
					if (d > R) { var cor2 = (R + 10 * k - d) / (10 * k); if (cor2 > 0 && bay(x, y) < cor2 * cor2 * 0.8) buf[y * L + x] = d < R + 3 * k ? PAL[3] : PAL[4]; continue; }
					var mu = Math.sqrt(1 - (d / R) * (d / R));
					var grao = ruido2d(x / (5 * k) + t * 0.12, y / (5 * k)) * 0.65 + ruido2d(x / (2 * k) - t * 0.3, y / (2 * k) + 7) * 0.35;
					var nv = (1 - mu) * 3.2 + (0.5 - grao) * 2.2 + bay(x, y) * 0.9;
					buf[y * L + x] = PAL[Math.max(0, Math.min(4, Math.floor(nv)))];
				}
			}
			/* as estrelas que cintilam: umas ficam só piscando, outras viram uma cruzinha no auge */
			soltas.forEach(function (e) {
				if (chao[e.y * L + e.x]) return;
				var b = e.b * (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * e.v + e.f), 2));
				buf[e.y * L + e.x] = cor(e.c[0] * b, e.c[1] * b, e.c[2] * b);
				if (e.cruz && b > 0.75) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (dd) { var qx = e.x + dd[0], qy = e.y + dd[1]; if (qx >= 0 && qy >= 0 && qx < L && qy < A && !chao[qy * L + qx]) buf[qy * L + qx] = cor(e.c[0] * b * 0.5, e.c[1] * b * 0.5, e.c[2] * b * 0.55); });
			});
			/* as estrelas brilhantes (com o jeito de piscar de cada uma) */
			(c.brilhantes || []).forEach(function (e, i) {
				var b = 1;
				if (e[4] === 'rapido') b = Math.sin(t * 60) > 0 ? 1 : 0.35; /* o pulsar: 30 vezes por segundo (aqui, o mais rápido que a tela mostra) */
				else if (e[4] === 'apaga') { var ciclo = (t % 14) / 14; b = ciclo > 0.55 && ciclo < 0.8 ? 0.25 + 0.75 * Math.abs(Math.cos((ciclo - 0.55) / 0.25 * Math.PI)) : 1; } /* a Estrela de Tabby: o brilho cai de repente e volta */
				else if (e[4]) b = 0.7 + 0.3 * Math.sin(t * 0.9 + i);
				brilhante(buf, e[0] * k, e[1] * k, e[2], e[3], b, t);
			});
			/* o Sol: a estrelinha amarela (se dá para ver) e a mira com cantoneiras, piscando, onde ele estaria */
			if (c.sol) {
				var sx = Math.round(c.sol[0] * k), sy = Math.round(c.sol[1] * k);
				if (c.sol[2]) brilhante(buf, sx, sy, '#ffd36a', 1, 1, t);
				else pintar(buf, L, A, sx, sy, cor(110, 96, 64));
				var m = Math.round(7 * k), aceso = Math.sin(t * 2.6) > -0.3, cm = aceso ? cor(255, 211, 106) : cor(150, 120, 60);
				[[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (q) {
					for (var p = 0; p < 4; p++) { pintar(buf, L, A, sx + q[0] * (m - p), sy + q[1] * m, cm); pintar(buf, L, A, sx + q[0] * m, sy + q[1] * (m - p), cm); }
				});
			}
			/* a estrela-cadente: risca o céu de cima em meio segundo e some */
			if (!cadente && t > proxCadente) { cadente = { t0: t, x: (0.15 + aleat() * 0.6) * L, y: aleat() * A * 0.35, dx: (aleat() < 0.5 ? -1 : 1) * L * 0.35, dy: A * 0.18 }; }
			if (cadente) {
				var u = (t - cadente.t0) / 0.6;
				if (u > 1) { cadente = null; proxCadente = t + 6 + aleat() * 9; }
				else for (var q = 0; q < 14 * k; q++) {
					var uu = u - q / (40 * k); if (uu < 0) break;
					var qx = Math.round(cadente.x + cadente.dx * uu), qy = Math.round(cadente.y + cadente.dy * uu), fb = (1 - q / (14 * k)) * Math.sin(Math.min(1, u) * Math.PI);
					if (qx >= 0 && qy >= 0 && qx < L && qy < A && !chao[qy * L + qx]) buf[qy * L + qx] = cor(255 * fb, 250 * fb, 230 * fb);
				}
			}
			desenharAstronauta(buf, t);
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
	// ---------- As animações das luas ----------
	// (ferramentas pequenas só delas: um disco cheio, uma linha, uma cor misturada por cima e os
	// planetas-pais desenhados no céu)
	function luaDisco(buf, L, A, cx, cy, r, c) { for (var y = -r; y <= r; y++) for (var x = -r; x <= r; x++) if (x * x + y * y <= r * r + r * 0.6) pintar(buf, L, A, cx + x, cy + y, c); }
	function luaLinha(buf, L, A, x0, y0, x1, y1, c) { var n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); for (var i = 0; i <= n; i++) pintar(buf, L, A, x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); }
	function luaMistura(buf, L, A, x, y, r, g, b, a) {
		x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= L || y >= A || a <= 0) return;
		var v = buf[y * L + x], r0 = v & 255, g0 = (v >>> 8) & 255, b0 = (v >>> 16) & 255; a = Math.min(1, a);
		buf[y * L + x] = cor(Math.min(255, r0 + (r - r0) * a), Math.min(255, g0 + (g - g0) * a), Math.min(255, b0 + (b - b0) * a));
	}
	// ---------- Ferramentas novas das animações das luas (tela maior, 320 x 176) ----------
	// As artes de verdade (pixel/<nome>.png: os planetas da Bianca e as luas) reduzidas com média
	// das cores, giradas e iluminadas; um céu com estrelas de vários brilhos e cores e nebulosa
	// suave; brilhos somados (luz); esferas lisas com muitos tons, sem o quadriculado.
	var ARTES_PX = {};
	function arteCarregar(id) {
		if (ARTES_PX[id]) return ARTES_PX[id];
		var reg = ARTES_PX[id] = { ok: false, tam: {} }, im = new Image();
		im.onload = function () {
			var c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
			var x = c.getContext('2d'); x.drawImage(im, 0, 0);
			reg.w = c.width; reg.h = c.height; reg.d = x.getImageData(0, 0, c.width, c.height).data; reg.ok = true;
		};
		im.src = 'pixel/' + id + '.png';
		return reg;
	}
	// a arte reduzida para "lar" pixels de largura (média das cores de cada bloco), guardada
	function arteNoTamanho(id, lar) {
		var reg = arteCarregar(id); lar = Math.max(2, Math.round(lar));
		if (!reg.ok) return null;
		if (reg.tam[lar]) return reg.tam[lar];
		var alt = Math.max(2, Math.round(lar * reg.h / reg.w)), sx = reg.w / lar, sy = reg.h / alt;
		var r = new Float32Array(lar * alt * 4);
		for (var y = 0; y < alt; y++) for (var x = 0; x < lar; x++) {
			var x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx)), y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
			var sr = 0, sg = 0, sb = 0, sa = 0, n = 0;
			for (var yy = y0; yy < y1; yy++) for (var xx = x0; xx < x1; xx++) {
				var i = (yy * reg.w + xx) * 4, a = reg.d[i + 3] / 255;
				sr += reg.d[i] * a; sg += reg.d[i + 1] * a; sb += reg.d[i + 2] * a; sa += a; n++;
			}
			var k = (y * lar + x) * 4;
			if (sa > 0) { r[k] = sr / sa; r[k + 1] = sg / sa; r[k + 2] = sb / sa; } r[k + 3] = sa / n;
		}
		return (reg.tam[lar] = { w: lar, h: alt, d: r });
	}
	// desenha a arte centrada em (cx, cy), com "lar" de largura, girada de "giro" radianos e com a
	// luz vindo da direção (lx, ly) na tela (sem luz: como na arte). "sombra" é o quanto o lado da
	// noite escurece (0 a 1). Devolve false enquanto a imagem ainda não carregou.
	function arte(buf, L, A, id, cx, cy, lar, giro, lx, ly, sombra, brilho, estica) {
		var s = arteNoTamanho(id, lar); if (!s) return false;
		/* (estica: alonga a arte na direção do giro, mantendo a área, como uma maré) */
		var e = estica || 1, re = Math.sqrt(e);
		var c = Math.cos(giro || 0), sn = Math.sin(giro || 0), R = Math.hypot(s.w, s.h) / 2 * e + 1, raio = Math.min(s.w, s.h) / 2;
		var luz = lx !== undefined && lx !== null, ln = luz ? Math.hypot(lx, ly) || 1 : 1;
		for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
			if (x < 0 || y < 0 || x >= L || y >= A) continue;
			var dx = x + 0.5 - cx, dy = y + 0.5 - cy;
			var u = (dx * c + dy * sn) / e + s.w / 2, v = (-dx * sn + dy * c) * re + s.h / 2;
			var iu = Math.floor(u), iv = Math.floor(v);
			if (iu < 0 || iv < 0 || iu >= s.w || iv >= s.h) continue;
			var k = (iv * s.w + iu) * 4, a = s.d[k + 3]; if (a < 0.5) continue;
			var f = brilho || 1;
			if (luz) {
				var nx = (u - s.w / 2) / raio, ny = (v - s.h / 2) / raio, nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
				var gx = nx * c - ny * sn, gy = nx * sn + ny * c; nx = gx; ny = gy;
				var d = (nx * lx + ny * ly) / ln * 0.9 + nz * 0.25;
				f *= 1 - (sombra === undefined ? 0.85 : sombra) * suave(0.5 - d * 2.2);
			}
			buf[y * L + x] = cor(Math.min(255, s.d[k] * f), Math.min(255, s.d[k + 1] * f), Math.min(255, s.d[k + 2] * f));
		}
		return true;
	}
	// um brilho redondo somado à cor de baixo (a luz "acende" o que está atrás)
	function brilhoSoma(buf, L, A, cx, cy, R, r, g, b, forca) {
		for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
			if (x < 0 || y < 0 || x >= L || y >= A) continue;
			var d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R; if (d >= 1) continue;
			var k = Math.pow(1 - d, 2) * forca, v = buf[y * L + x];
			buf[y * L + x] = cor(Math.min(255, (v & 255) + r * k), Math.min(255, ((v >>> 8) & 255) + g * k), Math.min(255, ((v >>> 16) & 255) + b * k));
		}
	}
	// uma esfera lisa, com muitos tons (pal: do mais claro ao mais escuro), luz de (lx, ly) e
	// "textura(x, y)" opcional (de -1 a 1) para manchas
	function esfera(buf, L, A, cx, cy, R, pal, lx, ly, textura) {
		var ln = Math.hypot(lx, ly) || 1, n = pal.length;
		for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
			if (x < 0 || y < 0 || x >= L || y >= A) continue;
			var nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / R, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
			var nz = Math.sqrt(1 - d2), l = (-(nx * lx + ny * ly) / ln) * 0.75 + nz * 0.45;
			var v = 1 - Math.max(0, Math.min(1, l)) + (textura ? textura(nx, ny) * 0.18 : 0);
			buf[y * L + x] = pal[Math.max(0, Math.min(n - 1, Math.floor(v * (n - 0.01))))];
		}
	}
	function rampaCores(lista, n) {
		var cs = lista.map(function (h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }), out = [];
		for (var i = 0; i < n; i++) {
			var p = i / (n - 1) * (cs.length - 1), a = Math.floor(p), f = p - a, b = Math.min(cs.length - 1, a + 1);
			out.push(cor(cs[a][0] + (cs[b][0] - cs[a][0]) * f, cs[a][1] + (cs[b][1] - cs[a][1]) * f, cs[a][2] + (cs[b][2] - cs[a][2]) * f));
		}
		return out;
	}
	// o céu: fundo com degradê, uma nebulosa bem suave e estrelas de vários brilhos e cores
	// (umas cintilam e viram cruzinha no auge)
	function ceuBonito(L, A, sem, neb) {
		var aleat = semente(sem), base = new Uint32Array(L * A), pisca = [];
		var nc = neb ? [parseInt(neb.substr(1, 2), 16), parseInt(neb.substr(3, 2), 16), parseInt(neb.substr(5, 2), 16)] : [70, 40, 110];
		for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
			var n = ruido2d(x * 0.018 + sem, y * 0.03) * 0.6 + ruido2d(x * 0.05, y * 0.07 + sem) * 0.4, k = Math.max(0, n - 0.5) * 0.55;
			base[y * L + x] = cor(6 + nc[0] * k, 4 + nc[1] * k, 16 + nc[2] * k + y * 0.04);
		}
		var CORES = [[255, 255, 255], [200, 220, 255], [255, 230, 200], [255, 200, 220]];
		for (var i = 0; i < L * A / 70; i++) {
			var x = aleat() * L | 0, y = aleat() * A | 0, b = 0.25 + aleat() * aleat() * 0.75, c = CORES[i % 4];
			if (i % 7 === 0) pisca.push([x, y, c, 0.6 + aleat() * 0.4, 0.8 + aleat() * 2, aleat() * 6]);
			else base[y * L + x] = cor(c[0] * b, c[1] * b, c[2] * b);
		}
		return function (buf, t) {
			buf.set(base);
			pisca.forEach(function (e) {
				var b = e[3] * (0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(t * e[4] + e[5]), 2)), c = e[2];
				buf[e[1] * L + e[0]] = cor(c[0] * b, c[1] * b, c[2] * b);
				if (b > 0.75) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { luaMistura(buf, L, A, e[0] + d[0], e[1] + d[1], c[0], c[1], c[2], 0.4); });
			});
		};
	}
	// uma órbita pontilhada (elipse), mais acesa perto de quem passa por ela (ang)
	function orbitaPontilhada(buf, L, A, cx, cy, rx, ry, ang, r, g, b) {
		var n = Math.max(40, Math.round((rx + ry) * 1.6));
		for (var i = 0; i < n; i += 2) {
			var a = i / n * Math.PI * 2, perto = ang === null ? 0 : Math.max(0, Math.cos(a - ang)) ;
			var f = 0.35 + 0.65 * Math.pow(perto, 6);
			luaMistura(buf, L, A, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r, g, b, f);
		}
	}
	Object.assign(ANIMACOES, {
		// A Lua dá a volta na Terra e gira no mesmo tempo: a bandeirinha vermelha (o lado que a gente
		// vê daqui) fica sempre virada para a Terra. No cantinho, a Lua vista da Terra: sempre igual.
		'lua-face': function (L, A) {
			var ceu = ceuBonito(L, A, 401, '#3a4a8a'), cx = 138, cy = A / 2 + 4, rx = 104, ry = 52, CICLO = 14;
			return function (buf, t, hud) {
				ceu(buf, t);
				var ang = (t % CICLO) / CICLO * Math.PI * 2, mx = cx + Math.cos(ang) * rx, my = cy + Math.sin(ang) * ry;
				orbitaPontilhada(buf, L, A, cx, cy, rx, ry, ang, 150, 160, 230);
				/* a Lua gira uma vez a cada volta: a arte acompanha o ângulo da órbita */
				var giro = Math.atan2(cy - my, cx - mx) + Math.PI / 2;
				var atras = Math.sin(ang) < 0;
				function lua() {
					brilhoSoma(buf, L, A, mx, my, 22, 120, 120, 140, 0.35);
					arte(buf, L, A, 'lua', mx, my, 26, giro);
					/* a bandeirinha fincada no lado que olha para a Terra */
					var dx = cx - mx, dy = cy - my, dn = Math.hypot(dx, dy) || 1, ux = dx / dn, uy = dy / dn;
					var bx = mx + ux * 12, by = my + uy * 12;
					luaLinha(buf, L, A, bx, by, bx + ux * 7, by + uy * 7, hex('#e8e6f0'));
					luaLinha(buf, L, A, bx + ux * 7, by + uy * 7, bx + ux * 5 - uy * 4, by + uy * 5 + ux * 4, hex('#ff4a5a'));
					luaLinha(buf, L, A, bx + ux * 5, by + uy * 5, bx + ux * 5 - uy * 4, by + uy * 5 + ux * 4, hex('#ff4a5a'));
					/* a linha de visão até a Terra, pontilhada */
					for (var k = 22; k < dn - 30; k += 5) luaMistura(buf, L, A, mx + ux * k, my + uy * k, 255, 110, 130, 0.55);
				}
				if (atras) lua();
				brilhoSoma(buf, L, A, cx, cy, 46, 60, 120, 255, 0.45);
				arte(buf, L, A, 'terra', cx, cy, 52, t * 0.35);
				if (!atras) lua();
				/* o quadrinho: a Lua vista da Terra, sempre com o mesmo lado (e a bandeirinha no mesmo lugar) */
				var qx = L - 74, qy = 8, qw = 66, qh = 66;
				for (var y = qy; y < qy + qh; y++) for (var x = qx; x < qx + qw; x++) {
					var borda = x === qx || y === qy || x === qx + qw - 1 || y === qy + qh - 1;
					buf[y * L + x] = borda ? hex('#6a74c8') : hex('#0a0820');
				}
				brilhoSoma(buf, L, A, qx + qw / 2, qy + qh / 2 + 2, 30, 110, 110, 130, 0.3);
				arte(buf, L, A, 'lua', qx + qw / 2, qy + qh / 2 + 2, 42, 0);
				luaLinha(buf, L, A, qx + qw / 2 - 2, qy + qh / 2 - 6, qx + qw / 2 - 2, qy + qh / 2 + 2, hex('#e8e6f0'));
				luaDisco(buf, L, A, qx + qw / 2 - 2, qy + qh / 2 + 3, 1, hex('#e8e6f0'));
				for (var fy = 0; fy < 3; fy++) for (var fx = 0; fx < 4 - fy; fx++) pintar(buf, L, A, qx + qw / 2 - 1 + fx, qy + qh / 2 - 6 + fy, hex('#ff4a5a'));
				if (hud) {
					var dia = Math.floor((t % CICLO) / CICLO * 27.3);
					hud.ano.textContent = TR('dia ' + dia + ' de 27', 'day ' + dia + ' of 27');
					hud.estacao.textContent = TR('da Terra: sempre o mesmo lado', 'from Earth: always the same side');
				}
			};
		},
		// O nascimento da Lua: Theia, do tamanho de Marte, bate de raspão na Terra jovem (ainda de
		// lava); os pedaços formam um disco em volta e vão se juntando, até virar a Lua
		'lua-theia': function (L, A) {
			var ceu = ceuBonito(L, A, 402, '#6a3a5a'), cx = 128, cy = A / 2 + 6, CICLO = 16, BATE = 3.6, aleat = semente(41), pedacos = [];
			for (var i = 0; i < 420; i++) pedacos.push({ a: aleat() * Math.PI * 2, r: 38 + aleat() * aleat() * 52, f: aleat(), g: aleat(), v: aleat() });
			var LAVA = rampaCores(['#fff2c0', '#ffc060', '#f07a30', '#b8401e', '#6a1e14', '#2a0c0c'], 16);
			var ROCHA = rampaCores(['#e6d8ff', '#b0a0e0', '#7a68b0', '#4a3c78', '#241c40'], 12);
			var LUAX = 128 + 86, LUAY = cy - 26;
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, depois = c - BATE;
				/* Theia vindo, com o rastro */
				if (c < BATE) {
					var k = suave(c / BATE), thx = L + 30 - k * (L + 30 - cx - 34), thy = 18 + k * (cy - 14 - 18);
					for (var r = 1; r < 26; r++) luaMistura(buf, L, A, thx + r * 2.4, thy - r * 0.9, 150, 130, 230, 0.4 * (1 - r / 26));
					esfera(buf, L, A, thx, thy, 15, ROCHA, -1, -0.4, function (x, y) { return ruido2d(x * 3 + 7, y * 3) - 0.5; });
				}
				/* a Terra jovem: lava com rachaduras acesas; depois da batida, ainda mais quente e esfriando */
				var quente = c < BATE ? 0.25 : Math.max(0.25, 1 - depois / 9);
				brilhoSoma(buf, L, A, cx, cy, 58, 255, 110, 40, 0.25 + quente * 0.5);
				esfera(buf, L, A, cx, cy, 30, LAVA, -1, -0.3, function (x, y) {
					var n = ruido2d(x * 4 + t * 0.15, y * 4) - 0.5, risca = Math.abs(ruido2d(x * 6 + 3, y * 6 - t * 0.1) - 0.5) < 0.05 ? -1.6 * quente : 0;
					return n * 1.2 + risca + (1 - quente) * 1.2;
				});
				/* o clarão e a onda de choque */
				if (depois >= 0 && depois < 1.2) {
					var fl = 1 - depois / 1.2;
					brilhoSoma(buf, L, A, cx + 26, cy - 12, 80 * (0.4 + depois), 255, 240, 210, fl * 1.6);
					var ro = 10 + depois * 90;
					for (var a = 0; a < Math.PI * 2; a += 0.02) luaMistura(buf, L, A, cx + 26 + Math.cos(a) * ro, cy - 12 + Math.sin(a) * ro * 0.7, 255, 220, 180, fl * 0.8);
				}
				if (depois >= 0) {
					/* os pedaços: um jato de lado, depois um disco girando, e por fim juntando na Lua */
					var junta = suave((depois - 5) / 6), sai = Math.min(1, depois / 1.4);
					pedacos.forEach(function (p) {
						var w = 0.9 * Math.pow(52 / p.r, 1.5);
						var a = p.a + depois * w, rr = p.r * sai;
						var x0 = cx + Math.cos(a) * rr, y0 = cy + Math.sin(a) * rr * 0.36;
						var tx = LUAX + (p.f - 0.5) * 10 * (1 - junta), ty = LUAY + (p.g - 0.5) * 10 * (1 - junta);
						var x = x0 + (tx - x0) * junta, y = y0 + (ty - y0) * junta;
						var na = Math.sin(a) < 0 && junta < 0.5 && Math.abs(x - cx) < 30 && Math.abs(y - cy) < 30;
						if (na) return;
						var calor = Math.max(0, 1 - depois / 6);
						var r = 150 + 105 * calor + p.v * 20, g = 140 + 60 * calor * p.v, b = 170 - 120 * calor;
						luaMistura(buf, L, A, x, y, r, g, b, 0.85);
					});
					if (junta > 0.6) {
						var tamanho = 8 + 18 * suave((junta - 0.6) / 0.4);
						brilhoSoma(buf, L, A, LUAX, LUAY, tamanho, 160, 150, 170, 0.4);
						arte(buf, L, A, 'lua', LUAX, LUAY, tamanho, 0, -1, -0.3, 0.6);
					}
				}
				if (hud) {
					hud.ano.textContent = TR('há 4,5 bilhões de anos', '4.5 billion years ago');
					hud.estacao.textContent = c < BATE ? TR('Theia se aproxima', 'Theia approaches') : depois < 1.4 ? TR('a batida!', 'the impact!') : depois < 5 ? TR('os pedaços ficam girando', 'the pieces keep orbiting') : TR('nasce a Lua', 'the Moon is born');
				}
			};
		},
		// Io espremida: na órbita (exagerada aqui), quando passa perto de Júpiter ela estica e esquenta;
		// Europa e Ganimedes, mais longe, dão 2 e 1 voltas enquanto Io dá 4
		'io-mare': function (L, A) {
			var ceu = ceuBonito(L, A, 403, '#5a4a3a'), jx = 58, jy = A / 2 + 2, CICLO = 16, E = 0.3;
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, ai = c / CICLO * Math.PI * 2 * 4, ae = c / CICLO * Math.PI * 2 * 2, ag = c / CICLO * Math.PI * 2;
				function raioIo(a) { return 104 * (1 - E * E) / (1 + E * Math.cos(a)); }
				var ri = raioIo(ai), ix = jx + Math.cos(ai) * ri, iy = jy + Math.sin(ai) * ri * 0.34;
				var ex = jx + Math.cos(ae) * 160, ey = jy + Math.sin(ae) * 160 * 0.3, gxm = jx + Math.cos(ag) * 230, gym = jy + Math.sin(ag) * 230 * 0.26;
				/* as órbitas (a de Io achatada de propósito, para dar para ver o perto e o longe) */
				for (var k = 0; k < 220; k += 2) { var a = k / 220 * Math.PI * 2, r = raioIo(a); luaMistura(buf, L, A, jx + Math.cos(a) * r, jy + Math.sin(a) * r * 0.34, 240, 200, 90, 0.35 + 0.5 * Math.pow(Math.max(0, Math.cos(a - ai)), 8)); }
				orbitaPontilhada(buf, L, A, jx, jy, 160, 48, ae, 200, 190, 170);
				orbitaPontilhada(buf, L, A, jx, jy, 230, 60, ag, 170, 160, 150);
				var perto = suave((96 - ri) / 34);
				function io() {
					brilhoSoma(buf, L, A, ix, iy, 14 + perto * 10, 255, 120, 40, 0.25 + perto * 0.7);
					/* Io esticada na direção de Júpiter */
					arte(buf, L, A, 'io', ix, iy, 16, Math.atan2(jy - iy, jx - ix), jx - ix, jy - iy, 0.75, 1 + perto * 0.25, 1 + perto * 0.45);
				}
				var luas = [[Math.sin(ai) < 0, io], [Math.sin(ae) < 0, function () { arte(buf, L, A, 'europa', ex, ey, 14, 0, jx - ex, jy - ey, 0.75); }], [Math.sin(ag) < 0, function () { arte(buf, L, A, 'ganimedes', gxm, gym, 20, 0, jx - gxm, jy - gym, 0.75); }]];
				luas.forEach(function (l) { if (l[0]) l[1](); });
				brilhoSoma(buf, L, A, jx, jy, 66, 230, 190, 140, 0.35);
				arte(buf, L, A, 'jupiter', jx, jy, 92, 0);
				luas.forEach(function (l) { if (!l[0]) l[1](); });
				if (hud) {
					hud.ano.textContent = TR('Io ' + (Math.floor(c / CICLO * 4) + 1) + ' · Europa ' + (Math.floor(c / CICLO * 2) + 1) + ' · Ganimedes 1', 'Io ' + (Math.floor(c / CICLO * 4) + 1) + ' · Europa ' + (Math.floor(c / CICLO * 2) + 1) + ' · Ganymede 1');
					hud.estacao.textContent = perto > 0.5 ? TR('perto: Io estica e esquenta', 'close: Io stretches and heats up') : TR('longe: Io relaxa', 'far: Io relaxes');
				}
			};
		},
		// a pluma de um vulcão de Io: sem ar, o material sobe e cai em arcos, formando um guarda-chuva,
		// e a poeira que cai pinta um anel vermelho no chão. Júpiter enorme no céu.
		'io-pluma': function (L, A) {
			var ceu = ceuBonito(L, A, 404, '#3a2a1a'), CICLO = 12, vx0 = 150, aleat = semente(44), gotas = [];
			for (var i = 0; i < 2600; i++) gotas.push([aleat() * CICLO, (aleat() - 0.5) * 1.7, 0.86 + aleat() * 0.16, aleat()]);
			var CHAO = 136;
			function chaoY(x) { return CHAO + Math.pow((x - 160) / 160, 2) * 10; }
			/* o chão de enxofre: amarelos, laranjas, manchas pretas de lava e brancas de geada de SO2 */
			var chao = new Uint32Array(L * A);
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
				var h = chaoY(x); if (y < h) continue;
				/* (achatado na perspectiva: as manchas ficam mais largas que altas) */
				var n = ruido2d(x * 0.03, y * 0.1) * 0.65 + ruido2d(x * 0.08, y * 0.22) * 0.35, prof = (y - h) / (A - h);
				var col = n > 0.66 ? [222, 134, 56] : n > 0.56 ? [234, 188, 70] : n > 0.44 ? [242, 212, 96] : [248, 230, 140];
				if (ruido2d(x * 0.05 + 30, y * 0.16) > 0.82) col = [96, 52, 34];
				if (ruido2d(x * 0.06 - 9, y * 0.2 + 4) > 0.84) col = [236, 236, 220];
				var f = 0.75 + 0.25 * (1 - prof) - (y - h < 1 ? -0.15 : 0);
				chao[y * L + x] = cor(Math.min(255, col[0] * f), Math.min(255, col[1] * f), Math.min(255, col[2] * f));
			}
			return function (buf, t, hud) {
				ceu(buf, t);
				brilhoSoma(buf, L, A, 262, 40, 110, 220, 170, 110, 0.25);
				arte(buf, L, A, 'jupiter', 262, 40, 150, -0.15, -1, 0.2, 0.7);
				var c = t % CICLO;
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) if (chao[y * L + x]) buf[y * L + x] = chao[y * L + x];
				/* o anel vermelho de poeira, crescendo no chão em volta do vulcão */
				var raioAnel = 120 * Math.min(1, c / 7), forte = suave(c / 4);
				for (var x = 0; x < L; x++) {
					var h = chaoY(x);
					for (var dy = 0; dy < 10; dy++) {
						var dd = Math.abs(Math.abs(x - vx0) - raioAnel * (1 - dy * 0.03)) / 9;
						if (dd < 1) luaMistura(buf, L, A, x, h + dy, 200, 50, 30, forte * (1 - dd) * 0.85);
					}
				}
				/* a boca do vulcão, acesa, e o calor tremendo em cima */
				var vy = chaoY(vx0);
				for (var k = -6; k <= 6; k++) pintar(buf, L, A, vx0 + k, vy + 1 - Math.max(0, 3 - Math.abs(k) * 0.5), hex('#3a1a10'));
				brilhoSoma(buf, L, A, vx0, vy, 16, 255, 150, 50, 0.9);
				for (var q = 0; q < 40; q++) luaMistura(buf, L, A, vx0 + Math.sin(q * 0.5 + t * 6) * (1 + q * 0.05), vy - 2 - q, 255, 210, 120, 0.75 * (1 - q / 40));
				/* as partículas: cada uma sai do vulcão e cai num arco (gravidade sem ar) */
				gotas.forEach(function (g) {
					var tau = ((c - g[0]) % CICLO + CICLO) % CICLO * 1.2, v = 64 * g[2], vxp = g[1] * 36;
					var y = vy - (v * tau - 10 * tau * tau), x = vx0 + vxp * tau;
					if (y > chaoY(x) || tau > 8) return;
					/* (no alto do arco ela anda devagar: ali as partículas se juntam e formam o guarda-chuva) */
					var br = 1 - tau / 9, topo = Math.exp(-Math.pow((tau - v / 20) / 1.2, 2)) * 0.3;
					br += topo;
					if (g[3] > 0.65) luaMistura(buf, L, A, x, y, 255, 244, 200, 0.25 + br * 0.35);
					else if (g[3] > 0.3) luaMistura(buf, L, A, x, y, 255, 190, 100, 0.22 + br * 0.35);
					else luaMistura(buf, L, A, x, y, 230, 110, 60, 0.22 + br * 0.35);
				});
				if (hud) {
					hud.ano.textContent = TR('altura: mais de 300 km', 'height: over 300 km');
					hud.estacao.textContent = c < 6 ? TR('sem ar, o material cai em arcos', 'with no air, it falls in arcs') : TR('a poeira pinta um anel vermelho', 'the dust paints a red ring');
				}
			};
		},
		// Europa cortada ao meio: de um lado a superfície (a arte), do outro as camadas: a casca de gelo,
		// o oceano escondido (com bolhas subindo das fontes quentes do fundo), a rocha e o núcleo de metal
		'europa-oceano': function (L, A) {
			var ceu = ceuBonito(L, A, 405, '#2a4a6a'), cx = 160, cy = 92, R = 78, CICLO = 14, aleat = semente(45), bolhas = [];
			for (var i = 0; i < 60; i++) bolhas.push([(aleat() - 0.5) * 2.6, aleat() * CICLO, aleat()]);
			/* (as camadas em fração do raio, com a casca e o oceano engordados para dar para ver) */
			var GELO = 0.9, OCEANO = 0.72, ROCHA = 0.36;
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, etapa = Math.floor(c / CICLO * 3);
				brilhoSoma(buf, L, A, cx, cy, R + 24, 140, 160, 200, 0.3);
				arte(buf, L, A, 'europa', cx, cy, R * 2, 0, -1, -0.3, 0.6);
				/* o corte: um quarto da lua aberto, de cima até a direita */
				for (var y = Math.floor(cy - R); y <= cy; y++) for (var x = Math.floor(cx); x <= cx + R; x++) {
					var d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R; if (d > 1) continue;
					var col;
					if (d > GELO) { var g = (d - GELO) / (1 - GELO); col = [214 + g * 30, 230 + g * 18, 246]; if (ruido2d(x * 0.4, y * 0.4) > 0.7) col = [190, 210, 236]; }
					else if (d > OCEANO) {
						var p = (d - OCEANO) / (GELO - OCEANO), onda = Math.sin((x - y) * 0.12 + t * 1.6) * 0.5 + 0.5;
						col = [24 + p * 40 + onda * 14, 70 + p * 70 + onda * 20, 140 + p * 70 + onda * 20];
					} else if (d > ROCHA) { var r = ruido2d(x * 0.12, y * 0.12); col = r > 0.6 ? [120, 86, 60] : r > 0.4 ? [140, 104, 74] : [158, 120, 86]; col = col.map(function (v) { return v * (0.7 + 0.3 * (d - ROCHA) / (OCEANO - ROCHA)); }); }
					else { var m = 1 - d / ROCHA; col = [150 + m * 70, 150 + m * 70, 166 + m * 60]; }
					var acende = (etapa === 0 && d > GELO) || (etapa === 1 && d > OCEANO && d <= GELO) || (etapa === 2 && d <= OCEANO) ? 1.12 : 0.92;
					buf[y * L + x] = cor(Math.min(255, col[0] * acende), Math.min(255, col[1] * acende), Math.min(255, col[2] * acende));
				}
				/* as bordas do corte, claras */
				for (var k = 0; k <= R; k++) { luaMistura(buf, L, A, cx + k, cy, 255, 255, 255, 0.5); luaMistura(buf, L, A, cx, cy - k, 255, 255, 255, 0.5); }
				/* fontes quentes no fundo do oceano e bolhas subindo até o gelo */
				[0.2, 0.75, 1.3].forEach(function (b, i) {
					var a = -Math.PI / 2 + b, fx = cx + Math.cos(a) * R * (OCEANO + 0.01), fy = cy + Math.sin(a) * R * (OCEANO + 0.01);
					brilhoSoma(buf, L, A, fx, fy, 7, 255, 140, 50, 0.6 + 0.3 * Math.sin(t * 4 + i));
				});
				bolhas.forEach(function (b) {
					var a = -Math.PI / 2 + 0.2 + (b[0] + 1.3) / 2.6 * 1.1, s = ((c - b[1]) % CICLO + CICLO) % CICLO / 3;
					if (s > 1) return;
					var r = R * (OCEANO + s * (GELO - OCEANO - 0.01)), x = cx + Math.cos(a) * r + Math.sin(t * 3 + b[2] * 9) * 1.2, y = cy + Math.sin(a) * r;
					if (x < cx || y > cy) return;
					luaMistura(buf, L, A, x, y, 200, 240, 255, 0.8);
				});
				if (hud) {
					hud.ano.textContent = [TR('gelo: 15 a 25 km', 'ice: 15 to 25 km'), TR('oceano: 60 a 150 km', 'ocean: 60 to 150 km'), TR('fundo de rocha', 'rocky seafloor')][etapa];
					hud.estacao.textContent = [TR('a casca rachada por fora', 'the shell is cracked outside'), TR('o dobro da água da Terra', "twice Earth's water"), TR('fontes quentes? bolhas subindo', 'hot vents? bubbles rising')][etapa];
				}
			};
		},
		// cada volta em Júpiter estica Europa e o gelo racha: a cada volta, uma rachadura nova (primeiro
		// acesa, depois cor de ferrugem, com os sais que sobem de baixo)
		'europa-rachaduras': function (L, A) {
			var ceu = ceuBonito(L, A, 406, '#4a3a5a'), CICLO = 16, VOLTAS = 8, gx = 214, gy = A / 2 + 4, R = 62, aleat = semente(46), linhas = [];
			for (var i = 0; i < VOLTAS; i++) { var v = [aleat() * 2 - 1, aleat() * 2 - 1, aleat() + 0.2], n = Math.hypot(v[0], v[1], v[2]); linhas.push([v[0] / n, v[1] / n, v[2] / n, aleat() * Math.PI * 2]); }
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, volta = c / CICLO * VOLTAS, ang = volta * Math.PI * 2, feitas = Math.floor(volta);
				/* Júpiter pequeno, e Europa dando voltas nele */
				var jx = 50, jy = gy, ex = jx + Math.cos(ang) * 40, ey = jy + Math.sin(ang) * 14;
				orbitaPontilhada(buf, L, A, jx, jy, 40, 14, ang, 200, 190, 170);
				if (Math.sin(ang) < 0) arte(buf, L, A, 'europa', ex, ey, 8, 0);
				arte(buf, L, A, 'jupiter', jx, jy, 40, 0);
				if (Math.sin(ang) >= 0) arte(buf, L, A, 'europa', ex, ey, 8, 0);
				/* Europa de perto: esticada (só um tiquinho) quando passa perto de Júpiter */
				var estica = 1 + Math.max(0, Math.cos(ang)) * 0.07;
				brilhoSoma(buf, L, A, gx, gy, R + 20, 150, 140, 130, 0.25);
				arte(buf, L, A, 'europa', gx, gy, R * 2, 0, -1, -0.3, 0.55, 1, estica);
				/* as rachaduras: grandes círculos na esfera; cada volta, uma nova crescendo */
				for (var q = 0; q < Math.min(feitas + 1, VOLTAS); q++) {
					var l = linhas[q], cresce = q < feitas ? 1 : volta - feitas;
					var u = [-l[1], l[0], 0], un = Math.hypot(u[0], u[1]) || 1; u = [u[0] / un, u[1] / un, 0];
					var w = [l[1] * u[2] - l[2] * u[1], l[2] * u[0] - l[0] * u[2], l[0] * u[1] - l[1] * u[0]];
					var nova = q === feitas, idade = nova ? 0 : (volta - q - 1);
					for (var s = 0; s < cresce * 2.4; s += 0.006) {
						var a = l[3] + s, p = [u[0] * Math.cos(a) + w[0] * Math.sin(a), u[1] * Math.cos(a) + w[1] * Math.sin(a), u[2] * Math.cos(a) + w[2] * Math.sin(a)];
						if (p[2] < 0.05) continue;
						var x = gx + p[0] * R * estica, y = gy + p[1] * R / Math.sqrt(estica);
						if (nova) { luaMistura(buf, L, A, x, y, 255, 170, 90, 0.9); luaMistura(buf, L, A, x + 1, y, 255, 120, 60, 0.35); }
						else luaMistura(buf, L, A, x, y, 150, 70, 44, Math.min(0.85, 0.5 + idade * 0.12));
					}
				}
				if (hud) {
					hud.ano.textContent = TR('volta ' + (feitas + 1) + ' em Júpiter', 'orbit ' + (feitas + 1) + ' around Jupiter');
					hud.estacao.textContent = TR('Júpiter estica, o gelo racha', 'Jupiter stretches, the ice cracks');
				}
			};
		},
		// As auroras de Ganimedes balançam conforme Júpiter gira. Sem oceano, balançariam uns 6 graus;
		// o Hubble mediu só 2: um oceano de água salgada segura o balanço
		'ganimedes-aurora': function (L, A) {
			var ceu = ceuBonito(L, A, 407, '#2a5a4a'), cx = 196, cy = A / 2 + 4, R = 56, CICLO = 14;
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, comOceano = c >= CICLO / 2, amp = (comOceano ? 2 : 6) * Math.PI / 180 * 4;
				var bal = Math.sin(t * 2.2) * amp;
				/* Júpiter enorme ali do lado, girando, com as linhas do campo magnético */
				brilhoSoma(buf, L, A, -40, cy, 150, 230, 190, 140, 0.3);
				arte(buf, L, A, 'jupiter', -40, cy, 220, 0, 1, 0, 0.5);
				for (var f = 0; f < 4; f++) {
					var alc = 120 + f * 34;
					for (var a = -1.2; a <= 1.2; a += 0.012) {
						var x = -40 + Math.cos(a) * alc, y = cy + Math.sin(a) * alc * 0.75 + Math.sin(bal * 3) * 6 * Math.cos(a);
						if (((a * 40 + t * 6) % 3) < 1) luaMistura(buf, L, A, x, y, 120, 200, 255, 0.28);
					}
				}
				brilhoSoma(buf, L, A, cx, cy, R + 18, 160, 150, 130, 0.25);
				arte(buf, L, A, 'ganimedes', cx, cy, R * 2, 0, -1, -0.3, 0.65);
				/* com oceano: um anel azul por dentro, mostrando a água salgada escondida */
				if (comOceano) {
					var surge = suave((c - CICLO / 2) / 1.2);
					for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
						var d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / R;
						if (d > 0.84 && d < 0.94) luaMistura(buf, L, A, x, y, 60, 140, 255, 0.26 * surge);
					}
				}
				/* os dois anéis de aurora, perto dos polos, balançando */
				[-1, 1].forEach(function (p) {
					for (var a = 0; a < Math.PI * 2; a += 0.01) {
						var px0 = Math.cos(a) * R * 0.6, py0 = Math.sin(a) * R * 0.15 + p * R * 0.72;
						var xr = px0 * Math.cos(bal) - py0 * Math.sin(bal), yr = px0 * Math.sin(bal) + py0 * Math.cos(bal);
						var atras = Math.sin(a) * p < 0 && xr * xr + yr * yr < R * R * 0.95;
						var br = 0.55 + 0.45 * Math.sin(a * 5 + t * 4);
						for (var h = 0; h < 5; h++) luaMistura(buf, L, A, cx + xr, cy + yr - p * h * 1.2, 90, 255, 180, (atras ? 0.15 : 0.6) * br * (1 - h / 5));
					}
				});
				if (hud) {
					hud.ano.textContent = comOceano ? TR('medido pelo Hubble: 2°', 'measured by Hubble: 2°') : TR('sem oceano seria: 6°', 'with no ocean it would be: 6°');
					hud.estacao.textContent = comOceano ? TR('um oceano salgado segura as auroras', 'a salty ocean holds the auroras back') : TR('as auroras balançam com Júpiter', 'the auroras sway with Jupiter');
				}
			};
		},
		// Ganimedes ao lado da nossa Lua, de Mercúrio e de Titã, todos na mesma escala
		'ganimedes-tamanho': function (L, A) {
			var ceu = ceuBonito(L, A, 408, '#3a3a5a'), CICLO = 12, ESC = 74 / 5268;
			var ASTROS = [['lua', 3474, TR('Lua: 3.474 km', 'Moon: 3,474 km')], ['mercurio', 4879, TR('Mercúrio: 4.879 km', 'Mercury: 4,879 km')],
				['tita', 5150, TR('Titã: 5.150 km', 'Titan: 5,150 km')], ['ganimedes', 5268, TR('Ganimedes: 5.268 km, a maior!', 'Ganymede: 5,268 km, the largest!')]];
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, foco = Math.min(3, Math.floor(c / CICLO * 4)), x = 14, base = A / 2 + 16;
				/* a régua no chão: todos apoiados na mesma linha */
				for (var k = 6; k < L - 6; k++) luaMistura(buf, L, A, k, base + 44, 150, 140, 200, k % 4 < 2 ? 0.5 : 0.2);
				ASTROS.forEach(function (a, i) {
					var d = a[1] * ESC; x += d / 2;
					var y = base + 44 - d / 2 - 2;
					if (i === foco) brilhoSoma(buf, L, A, x, y, d * 0.8, 255, 220, 140, 0.35);
					arte(buf, L, A, a[0], x, y, d, 0, -1, -0.3, 0.55);
					if (i === foco) {
						var sy = y - d / 2 - 12 + Math.round(Math.sin(t * 5) * 1.5);
						for (var q = 0; q < 5; q++) for (var w = -q; w <= q; w++) pintar(buf, L, A, x + w, sy + q, hex('#ffd36a'));
						for (var q2 = -6; q2 < 0; q2++) { pintar(buf, L, A, x, sy + q2, hex('#ffd36a')); pintar(buf, L, A, x + 1, sy + q2, hex('#ffd36a')); }
					}
					x += d / 2 + 9;
				});
				if (hud) { hud.ano.textContent = ASTROS[foco][2]; hud.estacao.textContent = TR('todos na mesma escala', 'all at the same scale'); }
			};
		},
		// o ciclo do metano em Titã: evapora do lago, vira nuvem, chove devagar e o rio volta ao lago
		'tita-chuva': function (L, A) {
			var CICLO = 16, aleat = semente(49), gotas = [], vapor = [];
			for (var i = 0; i < 140; i++) gotas.push([178 + aleat() * 110, aleat(), aleat()]);
			for (i = 0; i < 70; i++) vapor.push([20 + aleat() * 130, aleat(), aleat()]);
			/* a paisagem fixa: o céu laranja de névoa, as colinas, o lago de metano e o rio */
			var base = new Uint32Array(L * A), lago = new Uint8Array(L * A);
			var CEU = rampaCores(['#6a3a14', '#a8641e', '#d08a34', '#e8b060', '#f0c880'], 32);
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
				var col = CEU[Math.max(0, Math.min(31, Math.floor((y / 110 + (ruido2d(x * 0.02, y * 0.05) - 0.5) * 0.12) * 31)))];
				var longe = 104 - Math.sin(x * 0.025 + 1) * 10 - ruido2d(x * 0.04, 3) * 14;
				var perto = 124 - Math.sin(x * 0.03) * 8 - ruido2d(x * 0.06, 1) * 12;
				if (y > longe) col = rampaCores(['#9a5a24', '#7a4420'], 2)[ruido2d(x * 0.1, y * 0.1) > 0.6 ? 1 : 0];
				if (y > perto) { var r = ruido2d(x * 0.05, y * 0.12) * 0.7 + ruido2d(x * 0.2, y * 0.3) * 0.3, pr = (y - perto) / 40; col = cor(118 - r * 50 - pr * 30, 76 - r * 36 - pr * 20, 36 - r * 18 - pr * 8); }
				/* o lago escuro, à esquerda, e o rio descendo da direita */
				if (y > 132 && x < 170 - (y - 132) * 1.4) { lago[y * L + x] = 1; col = hex('#1c1418'); }
				var rio = 150 + (y - 118) * 4.2 + Math.sin(y * 0.3) * 6;
				if (y > 118 && Math.abs(x - rio) < 2.2 + (y - 118) * 0.06 && x > 150) { lago[y * L + x] = 2; col = hex('#241a1e'); }
				base[y * L + x] = col;
			}
			return function (buf, t, hud) {
				buf.set(base);
				var c = t % CICLO;
				/* o Sol, fraquinho, atrás da névoa */
				brilhoSoma(buf, L, A, 60, 34, 34, 255, 220, 160, 0.35);
				/* o brilho do céu refletido no lago, mexendo */
				for (var y = 132; y < A; y++) for (var x = 0; x < 170; x++) {
					var q = lago[y * L + x]; if (!q) continue;
					if (Math.sin(x * 0.18 + t * 1.6 + y * 0.9) > 0.86) buf[y * L + x] = hex('#5a3a2a');
				}
				for (var y2 = 118; y2 < A; y2++) for (var x2 = 150; x2 < L; x2++) if (lago[y2 * L + x2] === 2 && ((x2 + y2 * 2 - Math.floor(t * 10)) % 7 === 0)) buf[y2 * L + x2] = hex('#6a4a3a');
				/* o vapor subindo do lago, a nuvem crescendo e a chuva caindo devagar */
				var nuvem = suave((c - 2) / 4) * (1 - suave((c - 13) / 3));
				if (c < 12) vapor.forEach(function (v) { var s = (c * 0.1 + v[1]) % 1; luaMistura(buf, L, A, v[0] + s * 110 + Math.sin(s * 9 + v[2] * 6) * 4, 136 - s * 104, 255, 226, 190, 0.45 * (1 - s) * Math.min(1, s * 6)); });
				if (nuvem > 0) for (var j = 0; j < 26; j++) {
					var nx = 186 + (j * 37 % 100), ny = 22 + (j * 13 % 14) + Math.sin(t * 0.5 + j) * 1.5;
					brilhoSoma(buf, L, A, nx, ny, 10 + (j % 4) * 3, 255, 236, 200, 0.3 * nuvem);
				}
				if (c > 6 && c < 14) gotas.forEach(function (g) {
					/* (devagar: a gota de metano cai umas 6 vezes mais devagar que a de chuva daqui) */
					var y = 34 + ((c - 6) * 12 + g[1] * 90) % 96; if (y > 140 - g[2] * 20) return;
					luaMistura(buf, L, A, g[0], y, 255, 236, 200, 0.8); luaMistura(buf, L, A, g[0], y + 1, 230, 180, 110, 0.6);
				});
				if (hud) {
					hud.ano.textContent = TR('−179 °C', '−179 °C');
					hud.estacao.textContent = c < 2 ? TR('o metano evapora do lago', 'methane evaporates from the lake') : c < 6 ? TR('vira nuvem', 'it becomes a cloud') : c < 14 ? TR('chove bem devagar', 'it rains very slowly') : TR('o rio leva de volta ao lago', 'the river carries it back to the lake');
				}
			};
		},
		// a descida da Huygens: o paraquedas atravessa a névoa laranja por duas horas e meia e a sonda
		// pousa num chão de pedrinhas de gelo
		'tita-huygens': function (L, A) {
			var CICLO = 16, aleat = semente(50), pedras = [];
			for (var i = 0; i < 70; i++) pedras.push([aleat() * L, aleat(), 1 + aleat() * 3]);
			var NEVOA = rampaCores(['#5a2e10', '#a05a1c', '#d48a34', '#ecb468', '#f6d49a'], 40);
			return function (buf, t, hud) {
				var c = t % CICLO, k = Math.min(1, c / 12), alt = Math.round(150 * (1 - k));
				/* a névoa em camadas, passando para cima enquanto a sonda desce */
				var sobe = k * 260;
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var yy = y + sobe, n = ruido2d(x * 0.02 + yy * 0.004, yy * 0.03) * 0.6 + ruido2d(x * 0.06, yy * 0.08) * 0.4;
					var v = 0.25 + (y / A) * 0.35 + k * 0.25 + (n - 0.5) * 0.35;
					buf[y * L + x] = NEVOA[Math.max(0, Math.min(39, Math.floor(v * 39)))];
				}
				/* o chão aparecendo lá embaixo no fim: pedrinhas de gelo arredondadas */
				var chao = A + 60 - suave((k - 0.55) / 0.45) * 100;
				if (chao < A) {
					for (var y = Math.max(0, Math.floor(chao)); y < A; y++) for (var x = 0; x < L; x++) {
						var p = (y - chao) / 40, r = ruido2d(x * 0.05, y * 0.1);
						buf[y * L + x] = cor(150 - p * 40 + r * 20, 96 - p * 30 + r * 14, 50 - p * 14);
					}
					pedras.forEach(function (pd) {
						var py = chao + 6 + pd[1] * 40; if (py > A) return;
						esfera(buf, L, A, pd[0], py, pd[2] * (0.7 + pd[1] * 0.6), rampaCores(['#f0e0d0', '#c8a888', '#8a6a50', '#4a3424'], 8), -1, -0.6);
					});
				}
				/* a sonda: o paraquedas listrado, os cabos e a cápsula, balançando */
				var px = 160 + Math.sin(t * 0.9) * 10, balanco = Math.sin(t * 0.9 + 0.5) * 0.12;
				var py = k < 1 ? 70 + Math.sin(t * 1.3) * 3 : Math.min(chao - 6, 70 + (c - 12) * 40);
				var pousou = k >= 1 && py >= chao - 7;
				if (!pousou) {
					for (var a = -1; a <= 1; a += 0.02) {
						var cx2 = px + Math.sin(a * 1.2 + balanco) * 30, cy2 = py - 42 - Math.cos(a * 1.2) * 12;
						for (var h = 0; h < 6; h++) pintar(buf, L, A, cx2, cy2 + h, Math.floor((a + 1) * 5) % 2 ? hex('#ffffff') : hex('#e84a3a'));
					}
					[-1, -0.4, 0.4, 1].forEach(function (a) { luaLinha(buf, L, A, px + Math.sin(a * 1.2 + balanco) * 30, py - 38 - Math.cos(a * 1.2) * 12, px, py - 6, hex('#3a2418')); });
				}
				esfera(buf, L, A, px, py, 7, rampaCores(['#ffffff', '#d8d8e0', '#9a9aa8', '#5a5a68'], 8), -1, -0.5);
				for (var q = -8; q <= 8; q++) pintar(buf, L, A, px + q, py + 3, hex('#c8a040'));
				if (Math.sin(t * 6) > 0) brilhoSoma(buf, L, A, px + 4, py - 3, 4, 255, 80, 80, 0.8);
				if (hud) {
					hud.ano.textContent = TR('altitude: ' + alt + ' km', 'altitude: ' + alt + ' km');
					hud.estacao.textContent = k < 0.6 ? TR('descendo pela névoa (2 h 27 min)', 'drifting through the haze (2 h 27 min)') : k < 1 ? TR('o chão aparece', 'the ground appears') : TR('pousou! pedrinhas de gelo', 'landed! pebbles of ice');
				}
			};
		},
		// os gêiseres de Encélado: o oceano embaixo, a casca de gelo e as quatro listras de tigre
		// soltando jatos de vapor e gelo; Saturno no céu
		'encelado-geiser': function (L, A) {
			var ceu = ceuBonito(L, A, 411, '#3a4a7a'), CICLO = 12, aleat = semente(51), jatos = [];
			var LISTRAS = [64, 124, 190, 252], SUP = 112;
			for (var i = 0; i < 4400; i++) jatos.push([LISTRAS[i % 4], aleat() * CICLO, (aleat() - 0.5) * 0.5, 0.75 + aleat() * 0.3, aleat()]);
			return function (buf, t, hud) {
				ceu(buf, t);
				brilhoSoma(buf, L, A, 270, 40, 60, 230, 210, 150, 0.25);
				arte(buf, L, A, 'saturno', 266, 38, 120, -0.2, -1, 0.2, 0.6);
				var c = t % CICLO;
				/* o corte: gelo por cima, o oceano lá embaixo */
				for (var y = SUP; y < A; y++) for (var x = 0; x < L; x++) {
					var col;
					if (y < SUP + 30) { var n = ruido2d(x * 0.08, y * 0.12); col = n > 0.62 ? [214, 230, 246] : n > 0.4 ? [234, 244, 252] : [246, 250, 255]; if (y - SUP < 2) col = [255, 255, 255]; }
					else { var onda = Math.sin(x * 0.07 + t * 1.2 + y * 0.3) * 0.5 + 0.5; col = [24 + onda * 16, 70 + onda * 24, 150 + onda * 30]; }
					buf[y * L + x] = cor(col[0], col[1], col[2]);
				}
				/* as rachaduras (listras de tigre) até o oceano, com a água subindo */
				LISTRAS.forEach(function (lx, i) {
					for (var y = SUP; y < SUP + 30; y++) {
						var x = lx + Math.sin(y * 0.4 + i) * 2;
						pintar(buf, L, A, x, y, hex('#3a6aa8')); pintar(buf, L, A, x + 1, y, hex('#2a5a98'));
						if (((y + Math.floor(t * 20)) % 5) === 0) pintar(buf, L, A, x, y, hex('#bfe8ff'));
					}
					brilhoSoma(buf, L, A, lx, SUP, 10, 200, 230, 255, 0.5);
				});
				/* os jatos: subindo em leque, brilhando com a luz do Sol */
				jatos.forEach(function (j) {
					var tau = ((c - j[1]) % CICLO + CICLO) % CICLO, s = tau / 4;
					if (s > 1) return;
					var y = SUP - s * 110 * j[3], x = j[0] + j[2] * s * 110 + Math.sin(s * 6 + j[4] * 9) * 3 * s;
					luaMistura(buf, L, A, x, y, 235, 245, 255, (1 - s) * 0.55);
				});
				if (hud) {
					hud.ano.textContent = TR('4 listras de tigre', '4 tiger stripes');
					hud.estacao.textContent = c < 6 ? TR('jatos de vapor e gelo', 'jets of vapor and ice') : TR('a água vem do oceano lá embaixo', 'the water comes from the ocean below');
				}
			};
		},
		// os grãos de gelo dos jatos se espalham pela órbita de Encélado e formam o anel E de Saturno
		'encelado-anel': function (L, A) {
			var ceu = ceuBonito(L, A, 412, '#3a3a6a'), cx = 160, cy = A / 2 + 4, CICLO = 16, aleat = semente(52), graos = [];
			for (var i = 0; i < 1400; i++) graos.push([aleat() * CICLO, aleat() * Math.PI * 2, (aleat() - 0.5) * 2, aleat()]);
			var RX = 120, RY = 36;
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, ang = c * 1.4;
				/* o anel E: os grãos espalhados pela órbita, cada vez mais */
				graos.forEach(function (g) {
					if (g[0] > c * 1.1) return;
					var a = g[1] + c * 1.4 * (0.95 + g[3] * 0.1), esp = g[2] * (6 + (c - g[0]) * 1.6);
					var x = cx + Math.cos(a) * (RX + esp), y = cy + Math.sin(a) * (RY + esp * 0.3);
					if (Math.sin(a) < 0 && Math.abs(x - cx) < 44 && Math.abs(y - cy) < 30) return;
					luaMistura(buf, L, A, x, y, 190, 220, 255, 0.4);
				});
				brilhoSoma(buf, L, A, cx, cy, 70, 230, 210, 150, 0.25);
				/* Encélado, com os jatos saindo do polo sul */
				var ex = cx + Math.cos(ang) * RX, ey = cy + Math.sin(ang) * RY;
				if (Math.sin(ang) >= 0) arte(buf, L, A, 'saturno', cx, cy, 120, 0, -1, -0.2, 0.55);
				function encelado() {
					brilhoSoma(buf, L, A, ex, ey, 14, 200, 230, 255, 0.45);
					arte(buf, L, A, 'encelado', ex, ey, 12, 0, cx - ex, cy - ey, 0.6);
					for (var k = 0; k < 20; k++) luaMistura(buf, L, A, ex + Math.sin(k * 2.3 + t * 8) * (k * 0.15), ey + 6 + k * 0.6, 220, 240, 255, 0.6 * (1 - k / 20));
				}
				if (Math.sin(ang) < 0) { encelado(); arte(buf, L, A, 'saturno', cx, cy, 120, 0, -1, -0.2, 0.55); } else encelado();
				if (hud) {
					hud.ano.textContent = TR('volta ' + (Math.floor(c * 1.4 / (Math.PI * 2)) + 1), 'orbit ' + (Math.floor(c * 1.4 / (Math.PI * 2)) + 1));
					hud.estacao.textContent = TR('o anel E vai se formando', 'the E ring takes shape');
				}
			};
		},
		// o impacto que abriu a cratera Herschel: quase despedaçou Mimas, e o tremor rachou o outro lado
		'mimas-impacto': function (L, A) {
			var ceu = ceuBonito(L, A, 413, '#4a3a5a'), cx = 168, cy = A / 2 + 4, R = 62, CICLO = 12, BATE = 3, aleat = semente(53), lascas = [];
			for (var i = 0; i < 260; i++) lascas.push([aleat() * Math.PI * 2 - Math.PI, aleat(), aleat()]);
			var CRX = cx + 21, CRY = cy - 2;
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, depois = c - BATE;
				/* o tremor: Mimas balança depois da batida */
				var treme = depois > 0 && depois < 1.6 ? Math.sin(depois * 40) * 3 * (1 - depois / 1.6) : 0;
				brilhoSoma(buf, L, A, cx, cy, R + 20, 160, 160, 170, 0.25);
				/* antes da batida, a cratera ainda não existe: Mimas lisa, só com crateras pequenas */
				if (depois < 0.25) esfera(buf, L, A, cx, cy, R, rampaCores(['#eceae6', '#c4c2c0', '#9a989a', '#6a686e', '#3a3a42'], 16), 1, 0.3, function (x, y) { return (ruido2d(x * 6 + 3, y * 6) - 0.5) * 1.6 + (ruido2d(x * 14, y * 14 + 5) > 0.8 ? 1 : 0); });
				else arte(buf, L, A, 'mimas', cx + treme, cy, R * 2, 0, -1, -0.3, 0.6);
				/* o asteroide chegando da esquerda, com rastro */
				if (c < BATE) {
					var k = suave(c / BATE), ax = L + 10 - k * (L + 10 - CRX), ay = 20 + k * (CRY - 20);
					for (var r = 1; r < 24; r++) luaMistura(buf, L, A, ax + r * 2, ay - r * 0.8, 255, 200, 140, 0.5 * (1 - r / 24));
					esfera(buf, L, A, ax, ay, 5, rampaCores(['#c8a888', '#8a6a50', '#4a3424'], 8), -1, -0.5);
				}
				/* o clarão, as lascas voando e as rachaduras do outro lado */
				if (depois >= 0) {
					if (depois < 1) brilhoSoma(buf, L, A, CRX, CRY, 70 * (0.3 + depois), 255, 236, 200, (1 - depois) * 1.5);
					lascas.forEach(function (l) {
						var s = depois * (0.6 + l[1] * 0.8); if (s > 3) return;
						var x = CRX + Math.cos(l[0] * 0.8) * s * 40, y = CRY + Math.sin(l[0] * 0.8) * s * 30 + s * s * 4;
						luaMistura(buf, L, A, x, y, 230, 220, 210, 0.7 * (1 - s / 3));
					});
					var racha = suave((depois - 0.8) / 2.5);
					[[-0.55, -0.4], [-0.7, 0.1], [-0.45, 0.5], [-0.8, -0.1]].forEach(function (rc, i) {
						for (var q = 0; q < racha * 30; q++) {
							var x = cx + R * rc[0] + q * 0.8 * Math.cos(rc[1] + Math.sin(q * 0.4 + i) * 0.3), y = cy + R * rc[1] * 0.6 + q * 0.8 * Math.sin(rc[1] + Math.sin(q * 0.4 + i) * 0.3);
							if (Math.hypot(x - cx, y - cy) < R - 2) luaMistura(buf, L, A, x + treme, y, 70, 60, 70, 0.8);
						}
					});
				}
				if (hud) {
					hud.ano.textContent = c < BATE ? TR('um asteroide se aproxima', 'an asteroid approaches') : c < BATE + 2 ? TR('a batida quase parte Mimas', 'the impact nearly splits Mimas') : TR('cratera Herschel: 130 km', 'Herschel crater: 130 km');
					hud.estacao.textContent = c < BATE + 1.2 ? '' : TR('o tremor racha o outro lado', 'the shock cracks the far side');
				}
			};
		},
		// o mapa de calor da Cassini: as partes mais quentes e mais frias de Mimas formam um Pac-Man
		'mimas-pacman': function (L, A) {
			var ceu = ceuBonito(L, A, 414, '#2a2a5a'), cx = 150, cy = A / 2 + 4, R = 62, CICLO = 12;
			var QUENTE = rampaCores(['#fff2a0', '#ffd03a', '#f0a02a', '#c86a20'], 10), FRIO = rampaCores(['#8ac8ff', '#3a7ae8', '#2a4ac8', '#1a2a8a'], 10);
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, varre = suave((c - 2) / 4) * (R * 2 + 4) - R - 2;
				var boca = 0.5 + Math.abs(Math.sin(t * 3)) * 0.25 * (c > 7 ? 1 : 0);
				brilhoSoma(buf, L, A, cx, cy, R + 20, 160, 160, 170, 0.25);
				arte(buf, L, A, 'mimas', cx, cy, R * 2, 0, -1, -0.3, 0.6);
				/* a "câmera de calor" passando: do lado já varrido, o mapa de calor */
				for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
					var d = Math.hypot(x, y) / R; if (d > 1 || x >= varre) continue;
					var a = Math.atan2(y, x), fria = Math.abs(a) < boca && x > 0;
					var v = Math.min(9, Math.floor(d * 6 + ruido2d(x * 0.1, y * 0.1) * 3));
					pintar(buf, L, A, cx + x, cy + y, fria ? FRIO[v] : QUENTE[v]);
				}
				if (varre > -R && varre < R) for (var y2 = -R; y2 <= R; y2++) if (varre * varre + y2 * y2 < R * R) { pintar(buf, L, A, cx + varre, cy + y2, hex('#ffffff')); luaMistura(buf, L, A, cx + varre + 1, cy + y2, 255, 255, 255, 0.4); }
				/* o olho do Pac-Man e a bolinha (a cratera Herschel) que ele vai comer */
				if (c > 6) {
					esfera(buf, L, A, cx + 4, cy - 30, 5, rampaCores(['#3a2a10', '#1a1208'], 4), -1, -0.5);
					var bx = cx + R + 30 - ((c - 6) * 14 % 40);
					brilhoSoma(buf, L, A, bx, cy, 10, 255, 240, 180, 0.6);
					esfera(buf, L, A, bx, cy, 4, rampaCores(['#fffbe0', '#ffe8a0', '#e8c060'], 6), -1, -0.5);
				}
				if (hud) {
					hud.ano.textContent = c < 2 ? TR('Mimas, na luz normal', 'Mimas in normal light') : c < 6 ? TR('o mapa de calor da Cassini', "Cassini's heat map") : TR('é um Pac-Man!', "it's Pac-Man!");
					hud.estacao.textContent = c < 2 ? '' : TR('amarelo: quente · azul: frio', 'yellow: warm · blue: cold');
				}
			};
		},
		// a queda do alto de Verona Rupes: uns 12 minutos até o chão (na Terra, sem ar, seria 1 minuto)
		'miranda-penhasco': function (L, A) {
			var ceu = ceuBonito(L, A, 415, '#2a5a6a'), CICLO = 14;
			/* o paredão (bem alto) à esquerda, com camadas, e o chão lá embaixo */
			var base = null;
			return function (buf, t, hud) {
				ceu(buf, t);
				brilhoSoma(buf, L, A, 262, 40, 60, 140, 230, 240, 0.3);
				arte(buf, L, A, 'urano', 262, 40, 64, 0, -1, 0.2, 0.6);
				if (!base) {
					base = new Uint32Array(L * A);
					for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
						var borda = 108 + Math.sin(y * 0.25) * 3 + ruido2d(1, y * 0.15) * 7, col = 0;
						if (x < borda && y > 18) {
							var cam = Math.floor((y + ruido2d(x * 0.05, y * 0.02) * 8) / 7) % 3, n = ruido2d(x * 0.15, y * 0.1);
							var tom = [[150, 146, 150], [128, 124, 130], [170, 166, 168]][cam];
							var luz = x > borda - 4 ? 1.35 : 0.7 + 0.3 * (x / borda);
							col = cor(Math.min(255, tom[0] * luz * (0.85 + n * 0.3)), Math.min(255, tom[1] * luz * (0.85 + n * 0.3)), Math.min(255, tom[2] * luz * (0.85 + n * 0.3)));
						} else if (y > 158) { var n2 = ruido2d(x * 0.1, y * 0.3); col = cor(110 + n2 * 50, 108 + n2 * 50, 114 + n2 * 50); }
						base[y * L + x] = col;
					}
				}
				for (var i = 0; i < L * A; i++) if (base[i]) buf[i] = base[i];
				for (var x2 = 0; x2 < 112; x2++) pintar(buf, L, A, x2, 18, hex('#dcd8dc'));
				/* a régua da altura: uns 20 km de paredão */
				for (var y3 = 20; y3 < 158; y3 += 4) luaMistura(buf, L, A, 300, y3, 255, 211, 106, 0.6);
				/* a pedra caindo (devagarinho no começo, acelerando) */
				var c = t % CICLO, k = Math.min(1, c / 12), y0 = 16 + 140 * k * k;
				if (c > 0.3 && k < 1) { for (var r = 1; r < 8 * k; r++) luaMistura(buf, L, A, 128, y0 - r * 2, 220, 220, 230, 0.4 * (1 - r / (8 * k))); esfera(buf, L, A, 128, y0, 4, rampaCores(['#f0eef0', '#b8b4b8', '#6a666a'], 8), -1, -0.5); }
				if (k >= 1 && c < 13.5) for (var j = 0; j < 14; j++) { var s = (c - 12) * 1.5; luaMistura(buf, L, A, 128 + (j - 7) * s * 5, 156 - Math.abs(j - 7) * s * 2 + s * s * 4, 220, 220, 230, 0.8 * (1 - s)); }
				if (hud) {
					var min = Math.floor(k * 12), seg = Math.floor((k * 12 - min) * 60);
					hud.ano.textContent = TR('queda: ' + min + ' min ' + seg + ' s', 'fall: ' + min + ' min ' + seg + ' s');
					hud.estacao.textContent = TR('na Terra (sem ar): 1 minuto', 'on Earth (no air): 1 minute');
				}
			};
		},
		// por que Miranda é tão bagunçada: gelo mais quente sobe de dentro e deforma a superfície,
		// formando as coroas
		'miranda-retalhos': function (L, A) {
			var ceu = ceuBonito(L, A, 416, '#3a4a5a'), cx = 160, cy = A / 2 + 4, R = 64, CICLO = 14;
			var COROAS = [[-0.35, -0.25, 0.32], [0.3, 0.2, 0.36], [0.05, -0.55, 0.22]];
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, sobe = suave(c / 5), deforma = suave((c - 5) / 4), nasce = suave((c - 9) / 3);
				brilhoSoma(buf, L, A, cx, cy, R + 18, 170, 170, 180, 0.25);
				arte(buf, L, A, 'miranda', cx, cy, R * 2, 0, -1, -0.3, 0.6);
				/* as bolhas de gelo quente subindo de dentro (brilho laranja por baixo) e as coroas */
				COROAS.forEach(function (co, i) {
					var px = cx + co[0] * R, py = cy + co[1] * R, r = co[2] * R;
					var fundo = (1 - sobe) * 30;
					if (nasce < 1) brilhoSoma(buf, L, A, px, py + fundo, r * (0.6 + sobe * 0.6), 255, 150, 70, 0.55 * (1 - nasce * 0.8));
					if (deforma > 0) {
						/* os sulcos em volta, como pistas de corrida (as coroas de verdade) */
						for (var k = 0; k < 5; k++) {
							var rk = r * (0.4 + k * 0.17) * deforma;
							for (var a = 0; a < Math.PI * 2; a += 0.02) {
								var x = px + Math.cos(a) * rk * 1.1, y = py + Math.sin(a) * rk * 0.8;
								if (Math.hypot(x - cx, y - cy) < R - 2) luaMistura(buf, L, A, x, y, k % 2 ? 90 : 220, k % 2 ? 86 : 216, k % 2 ? 96 : 220, 0.5 * deforma);
							}
						}
					}
				});
				if (hud) {
					hud.ano.textContent = c < 5 ? TR('gelo mais quente sobe de dentro', 'warmer ice rises from inside') : c < 9 ? TR('a superfície se deforma', 'the surface buckles') : TR('nascem as coroas', 'the coronae are born');
					hud.estacao.textContent = TR('Inverness · Arden · Elsinore', 'Inverness · Arden · Elsinore');
				}
			};
		},
		// Tritão anda na contramão: Netuno e as outras luas giram para um lado, Tritão vai para o outro
		'tritao-contra': function (L, A) {
			var ceu = ceuBonito(L, A, 417, '#2a3a7a'), cx = 160, cy = A / 2 + 4, CICLO = 14;
			function seta(x, y, dir, r, g, b) { for (var k = 0; k < 4; k++) { luaMistura(buf0, L, A, x - dir * k, y - k, r, g, b, 0.9); luaMistura(buf0, L, A, x - dir * k, y + k, r, g, b, 0.9); } }
			var buf0 = null;
			return function (buf, t, hud) {
				buf0 = buf; ceu(buf, t);
				var c = t % CICLO, ap = c / CICLO * Math.PI * 2 * 3, at = -c / CICLO * Math.PI * 2;
				var px = cx + Math.cos(ap) * 70, py = cy + Math.sin(ap) * 20, tx = cx + Math.cos(at) * 130, ty = cy + Math.sin(at) * 46;
				/* as órbitas: a de Proteu (mesmo sentido de Netuno) e a de Tritão, inclinada e na contramão */
				orbitaPontilhada(buf, L, A, cx, cy, 70, 20, ap, 140, 200, 255);
				orbitaPontilhada(buf, L, A, cx, cy, 130, 46, at, 255, 160, 160);
				var atrasP = Math.sin(ap) < 0, atrasT = Math.sin(at) < 0;
				if (atrasP) arte(buf, L, A, 'mimas', px, py, 9, 0);
				if (atrasT) arte(buf, L, A, 'tritao', tx, ty, 20, 0, cx - tx, cy - ty, 0.6);
				brilhoSoma(buf, L, A, cx, cy, 60, 80, 120, 255, 0.4);
				/* Netuno girando (a arte gira para o mesmo lado de Proteu) */
				arte(buf, L, A, 'netuno', cx, cy, 70, t * 0.6);
				if (!atrasP) arte(buf, L, A, 'mimas', px, py, 9, 0);
				if (!atrasT) arte(buf, L, A, 'tritao', tx, ty, 20, 0, cx - tx, cy - ty, 0.6);
				/* setinhas mostrando o sentido de cada um */
				seta(cx + 50, cy - 40, 1, 140, 200, 255);
				seta(tx + Math.sin(at) * 16, ty - Math.cos(at) * 6, -Math.sign(Math.sin(at)) || 1, 255, 120, 120);
				if (hud) {
					hud.ano.textContent = TR('Netuno e Proteu: para um lado', 'Neptune and Proteus: one way');
					hud.estacao.textContent = TR('Tritão: para o outro!', 'Triton: the other way!');
				}
			};
		},
		// um gêiser de nitrogênio em Tritão: sobe uns 8 km em linha reta, o vento lá no alto leva a
		// fumaça para o lado e a poeira escura cai no chão, formando uma mancha comprida
		'tritao-geiser': function (L, A) {
			var ceu = ceuBonito(L, A, 418, '#2a3a6a'), CICLO = 12, aleat = semente(58), fumaca = [], CHAO = 140, GX = 70;
			for (var i = 0; i < 2600; i++) fumaca.push([aleat() * CICLO, aleat(), aleat()]);
			var chao = new Uint32Array(L * A);
			for (var y = CHAO; y < A; y++) for (var x = 0; x < L; x++) {
				var n = ruido2d(x * 0.04, y * 0.15) * 0.6 + ruido2d(x * 0.12, y * 0.3) * 0.4, p = (y - CHAO) / (A - CHAO);
				var col = n > 0.6 ? [226, 196, 196] : n > 0.45 ? [240, 214, 210] : [250, 232, 226];
				if (y - CHAO < 1) col = [255, 244, 240];
				chao[y * L + x] = cor(col[0] * (0.9 + p * 0.1), col[1] * (0.9 + p * 0.1), col[2] * (0.9 + p * 0.1));
			}
			return function (buf, t, hud) {
				ceu(buf, t);
				brilhoSoma(buf, L, A, 272, 36, 46, 90, 130, 255, 0.35);
				arte(buf, L, A, 'netuno', 272, 36, 52, 0, -1, 0.2, 0.6);
				for (var i = CHAO * L; i < L * A; i++) buf[i] = chao[i];
				var c = t % CICLO, mancha = suave((c - 4) / 6);
				/* a mancha escura comprida, crescendo na direção do vento */
				for (var y = CHAO + 2; y < CHAO + 14; y++) for (var x = GX; x < GX + 240 * mancha; x++) {
					var w = 1 - Math.abs(y - CHAO - 7) / 7 - (x - GX) / 300;
					if (w > 0 && ruido2d(x * 0.1, y * 0.4) < 0.8) luaMistura(buf, L, A, x, y, 80, 60, 70, Math.min(1, w * 1.1) * mancha);
				}
				/* o jato: sobe reto, e lá em cima o vento leva para a direita */
				var sobe = Math.min(1, c / 1.5);
				fumaca.forEach(function (f) {
					var tau = ((c - f[0]) % CICLO + CICLO) % CICLO; if (tau > 6) return;
					var h = Math.min(1, tau / 1.2) * 110 * sobe, x = GX + (f[1] - 0.5) * (2 + h * 0.06) + Math.sin(tau * 6 + f[1] * 9) * 1.2, y = CHAO - h;
					if (tau > 1.2) { var d = tau - 1.2; x += d * 40 * (0.6 + f[2] * 0.8); y = CHAO - 110 * sobe + (f[1] - 0.5) * (4 + d * 9) + d * 3 + Math.sin(tau * 2 + f[2] * 9) * 2; }
					luaMistura(buf, L, A, x, y, 190, 180, 190, 0.3 * (1 - tau / 6) + 0.08);
					if (f[2] < 0.12) brilhoSoma(buf, L, A, x, y, 5, 70, 66, 74, 0.25 * (1 - tau / 6));
				});
				brilhoSoma(buf, L, A, GX, CHAO, 8, 200, 220, 255, 0.4);
				if (hud) {
					hud.ano.textContent = TR('−235 °C', '−235 °C');
					hud.estacao.textContent = c < 1.5 ? TR('o jato sobe 8 km', 'the jet rises 8 km') : c < 5 ? TR('o vento leva para o lado', 'the wind carries it sideways') : TR('mancha escura de até 150 km', 'a dark streak up to 150 km');
				}
			};
		},
	});
	// ---------- Ferramentas das animações dos planetas (tela grande) ----------
	// a arte do planeta "colada" numa esfera que gira: cada ponto do disco vira longitude e
	// latitude, a longitude anda com o giro e a cor vem da arte (o lado de trás é o espelho da
	// frente, então tudo que some na borda volta pelo outro lado). "inc" inclina o eixo (radianos).
	function arteGlobo(buf, L, A, id, cx, cy, R, giro, lx, ly, sombra, inc) {
		var s = arteNoTamanho(id, R * 2); if (!s) return false;
		var ci = Math.cos(inc || 0), si = Math.sin(inc || 0), luz = lx !== undefined && lx !== null, ln = luz ? Math.hypot(lx, ly) || 1 : 1;
		for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
			if (x < 0 || y < 0 || x >= L || y >= A) continue;
			var nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / R, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
			var nz = Math.sqrt(1 - d2), bx = nx * ci + ny * si, by = -nx * si + ny * ci;
			var lon = Math.atan2(bx, nz) + (giro || 0), lat = Math.asin(Math.max(-1, Math.min(1, by)));
			/* a face da frente é a arte; a de trás é a arte virada de ponta-cabeça (sem espelho) */
			/* perto da emenda (90° do meio da arte) as duas faces se misturam, sem risco */
			lon = Math.atan2(Math.sin(lon), Math.cos(lon));
			var lf = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, lon)), lb = lon - (lon > 0 ? Math.PI : -Math.PI);
			lb = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, lb));
			var mist = suave((Math.abs(lon) - Math.PI / 2 + 0.3) / 0.6);
			var kf = amostra(lf, by), kb = amostra(lb, -by), f = 1;
			if (luz) {
				var d = (nx * lx + ny * ly) / ln * 0.9 + nz * 0.25;
				f = 1 - (sombra === undefined ? 0.85 : sombra) * suave(0.5 - d * 2.2);
			}
			f *= 0.82 + 0.18 * Math.sqrt(nz);
			var r = s.d[kf] + (s.d[kb] - s.d[kf]) * mist, g = s.d[kf + 1] + (s.d[kb + 1] - s.d[kf + 1]) * mist, b = s.d[kf + 2] + (s.d[kb + 2] - s.d[kf + 2]) * mist;
			buf[y * L + x] = cor(Math.min(255, r * f), Math.min(255, g * f), Math.min(255, b * f));
		}
		function amostra(l, yy) {
			var v = yy * 0.94, u = l / (Math.PI / 2) * 0.88 * Math.sqrt(Math.max(0, 1 - v * v));
			var iu = Math.max(0, Math.min(s.w - 1, Math.floor((u + 1) / 2 * s.w))), iv = Math.max(0, Math.min(s.h - 1, Math.floor((v + 1) / 2 * s.h)));
			return (iv * s.w + iu) * 4;
		}
		return true;
	}
	// escurece (multiplica) o que já está pintado num disco: f(nx, ny, nz) dá de 0 (preto) a 1
	function escurecer(buf, L, A, cx, cy, R, f) {
		for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
			if (x < 0 || y < 0 || x >= L || y >= A) continue;
			var nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / R, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
			var k = Math.max(0, Math.min(1, f(nx, ny, Math.sqrt(1 - d2)))); if (k >= 1) continue;
			var v = buf[y * L + x];
			buf[y * L + x] = cor((v & 255) * k, ((v >>> 8) & 255) * k, ((v >>> 16) & 255) * k);
		}
	}
	// a arte misturada por cima do que está pintado (meio transparente)
	function arteVeu(buf, L, A, id, cx, cy, lar, forca) {
		var s = arteNoTamanho(id, lar); if (!s) return;
		var x0 = Math.round(cx - s.w / 2), y0 = Math.round(cy - s.h / 2);
		for (var y = 0; y < s.h; y++) for (var x = 0; x < s.w; x++) {
			var k = (y * s.w + x) * 4; if (s.d[k + 3] < 0.5) continue;
			luaMistura(buf, L, A, x0 + x, y0 + y, s.d[k], s.d[k + 1], s.d[k + 2], forca);
		}
	}
	// o Sol no meio das órbitas: halo somado, a arte da Bianca girando devagar e raios piscando
	function solNoMeio(buf, L, A, cx, cy, R, t) {
		brilhoSoma(buf, L, A, cx, cy, R * 3.4, 255, 150, 50, 0.45);
		brilhoSoma(buf, L, A, cx, cy, R * 1.9, 255, 210, 120, 0.7);
		for (var i = 0; i < 8; i++) {
			var a = i * Math.PI / 4 + t * 0.08, c = 0.5 + 0.5 * Math.sin(t * 1.7 + i * 2.1);
			for (var r = R + 1; r < R * (1.7 + c * 0.5); r++) luaMistura(buf, L, A, cx + Math.cos(a) * r, cy + Math.sin(a) * r, 255, 220, 140, 0.45 * (1 - (r - R) / (R * 1.2)));
		}
		arteGlobo(buf, L, A, 'sol', cx, cy, R, t * 0.12);
	}
	// uma seta curva (arco) com ponta, para mostrar o sentido do giro
	function setaArco(buf, L, A, cx, cy, rx, ry, a0, a1, r, g, b) {
		var n = Math.ceil(Math.abs(a1 - a0) * Math.max(rx, ry) * 1.2);
		for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; luaMistura(buf, L, A, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, r, g, b, 0.95); }
		var px = cx + Math.cos(a1) * rx, py = cy + Math.sin(a1) * ry, sg = a1 > a0 ? 1 : -1;
		var tx = -Math.sin(a1) * rx * sg, ty = Math.cos(a1) * ry * sg, tn = Math.hypot(tx, ty) || 1; tx /= tn; ty /= tn;
		for (var k = 1; k <= 4; k++) {
			luaMistura(buf, L, A, px - tx * k - ty * k * 0.8, py - ty * k + tx * k * 0.8, r, g, b, 0.95);
			luaMistura(buf, L, A, px - tx * k + ty * k * 0.8, py - ty * k - tx * k * 0.8, r, g, b, 0.95);
		}
	}
	// a bandeirinha vermelha fincada em (x, y), apontando para (ux, uy)
	function bandeirinha(buf, L, A, x, y, ux, uy, h) {
		h = h || 7;
		luaLinha(buf, L, A, x, y, x + ux * h, y + uy * h, hex('#f4f0ff'));
		for (var k = 0; k < 4; k++) luaLinha(buf, L, A, x + ux * (h - k), y + uy * (h - k), x + ux * (h - k) - uy * (4 - k), y + uy * (h - k) + ux * (4 - k), hex('#ff4a5a'));
	}
	// o termômetro: tubo de vidro, bulbo, marcas e o líquido com a cor da temperatura
	function termometro(buf, L, A, x, topo, base, alto, marcas) {
		for (var y = topo; y <= base; y++) for (var dx = -4; dx <= 4; dx++) {
			var borda = Math.abs(dx) === 4 || y === topo;
			if (borda) luaMistura(buf, L, A, x + dx, y, 200, 190, 255, 0.8);
			else luaMistura(buf, L, A, x + dx, y, 20, 18, 50, 0.7);
		}
		luaDisco(buf, L, A, x, base + 5, 7, hex('#cdbfff'));
		var q = Math.max(0, Math.min(1, alto)), r = 80 + 175 * q, g = 150 - 80 * q, b = 255 - 210 * q;
		luaDisco(buf, L, A, x, base + 5, 5, cor(r, g, b));
		var cheio = base - q * (base - topo - 3);
		for (y = Math.floor(cheio); y <= base + 1; y++) for (dx = -2; dx <= 2; dx++) pintar(buf, L, A, x + dx, y, dx === -1 ? cor(Math.min(255, r + 60), Math.min(255, g + 60), Math.min(255, b + 40)) : cor(r, g, b));
		brilhoSoma(buf, L, A, x, base + 5, 14, r * 0.6, g * 0.4, b * 0.4, 0.5);
		(marcas || []).forEach(function (m) {
			var yy = Math.round(base - m[0] * (base - topo - 3));
			for (var k = 5; k < (m[1] ? 10 : 8); k++) pintar(buf, L, A, x + k, yy, m[1] ? hex('#ffe6a0') : hex('#8a83c0'));
		});
	}
	var SOL_TONS = ['#fffbe8', '#fff0a8', '#ffd060', '#ffa838', '#f07820', '#c04810', '#701c08'];

	Object.assign(ANIMACOES, {
		// Urano dando a volta no Sol deitado: o eixo aponta sempre para o mesmo lado, então
		// durante metade da volta o polo norte (vermelho) fica de frente para o Sol, e depois o sul.
		'urano-rola': function (L, A) {
			var ceu = ceuBonito(L, A, 501, '#2a5a7a'), cx = L / 2, cy = A / 2 + 2, rx = 122, ry = 58, R = 15;
			return function (buf, t, hud) {
				ceu(buf, t);
				var ang = (t / 16) * Math.PI * 2, px = cx + Math.cos(ang) * rx, py = cy + Math.sin(ang) * ry;
				orbitaPontilhada(buf, L, A, cx, cy, rx, ry, ang, 150, 200, 230);
				var atras = Math.sin(ang) < 0, giro = (t / 3) * Math.PI * 2;
				function urano() {
					var lx = cx - px, ly = cy - py;
					brilhoSoma(buf, L, A, px, py, R * 2.2, 90, 200, 220, 0.4);
					/* o anel em pé (o eixo está deitado): a metade de trás antes do planeta */
					function anel(frente) {
						for (var th = 0; th < Math.PI * 2; th += 0.012) {
							var ax = Math.cos(th) * 4.5, ay = Math.sin(th) * (R + 8);
							if ((ax >= 0) !== frente) continue;
							if (!frente && ax * ax + ay * ay < R * R) continue;
							luaMistura(buf, L, A, px + ax, py + ay, 200, 240, 250, frente ? 0.85 : 0.4);
						}
					}
					luaLinha(buf, L, A, px - R - 9, py, px - R, py, hex('#8a96c8'));
					anel(false);
					arteGlobo(buf, L, A, 'urano', px, py, R, giro, lx, ly, 0.8, Math.PI / 2);
					/* nuvens claras presas na superfície, rolando em volta do eixo deitado */
					[[-5, 0], [4, 2.1], [-1, 4.2], [7, 5.3]].forEach(function (n) {
						var a = n[1] + giro, r = Math.sqrt(R * R - n[0] * n[0]) * 0.9;
						if (Math.sin(a) <= 0.15) return;
						var x = px + n[0], y = py + Math.cos(a) * r;
						var d = ((x - px) * lx + (y - py) * ly) / (Math.hypot(lx, ly) || 1);
						if (d < -4) return;
						for (var k = -2; k <= 2; k++) luaMistura(buf, L, A, x + k * Math.sin(a), y, 255, 255, 255, 0.75 - Math.abs(k) * 0.15);
					});
					anel(true);
					/* a setinha do giro em volta da ponta esquerda do eixo */
					setaArco(buf, L, A, px - R - 6, py, 3.5, 8, -1.3, 1.5, 255, 211, 106);
					/* o eixo que sai à direita, com o polo norte (vermelho) */
					luaLinha(buf, L, A, px + R, py, px + R + 9, py, hex('#a8b4e8'));
					luaDisco(buf, L, A, px + R + 10, py, 2, hex('#ff5a6a'));
					brilhoSoma(buf, L, A, px + R + 10, py, 6, 255, 80, 100, 0.5);
				}
				if (atras) { urano(); solNoMeio(buf, L, A, cx, cy, 16, t); } else { solNoMeio(buf, L, A, cx, cy, 16, t); urano(); }
				if (hud) {
					var ano = Math.floor(((ang / (Math.PI * 2)) % 1) * 84), frente = -Math.cos(ang);
					hud.ano.textContent = TR('ano ' + ano + ' de 84', 'year ' + ano + ' of 84');
					hud.estacao.textContent = TR((frente > 0.6 ? 'verão' : frente < -0.6 ? 'inverno' : Math.sin(ang) > 0 ? 'primavera' : 'outono') + ' no polo norte', (frente > 0.6 ? 'summer' : frente < -0.6 ? 'winter' : Math.sin(ang) > 0 ? 'spring' : 'autumn') + ' at the north pole');
				}
			};
		},

		// Urano cortado ao meio: atmosfera, a camada de gelos (água, metano e amônia, fervendo
		// devagar) e o núcleo de rocha; lá dentro, a pressão vira o carbono em diamantes que chovem
		'urano-diamantes': function (L, A) {
			var ceu = ceuBonito(L, A, 502, '#2a5a7a'), aleat = semente(23), diamantes = [];
			var cx = L / 2, cy = A - 6, R = 126;
			var ATM = rampaCores(['#eafcff', '#bff0f6', '#8fd8e6'], 10), GELO = rampaCores(['#6fc4dc', '#3f94c0', '#2a68a0', '#1c4a80'], 16), NUC = rampaCores(['#e8b888', '#b07a58', '#7a4e3a'], 10);
			function novo(d) { var a = -Math.PI * (0.12 + aleat() * 0.76), r = R * (0.6 + aleat() * 0.24); d.x = cx + Math.cos(a) * r; d.y = cy + Math.sin(a) * r; d.v = 4 + aleat() * 6; d.f = aleat() * 6; d.r = 0; return d; }
			for (var i = 0; i < 46; i++) { var d = novo({}); var k = aleat() * 0.5; d.x += (cx - d.x) * k; d.y += (cy - d.y) * k; diamantes.push(d); }
			var anterior = 0;
			return function (buf, t) {
				var dt = Math.max(0, Math.min(0.2, t - anterior)); anterior = t;
				ceu(buf, t);
				brilhoSoma(buf, L, A, cx, cy, R * 1.25, 60, 160, 200, 0.35);
				for (var y = Math.floor(cy - R); y < cy; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
					if (x < 0 || y < 0 || x >= L) continue;
					var dx = x + 0.5 - cx, dy = y + 0.5 - cy, r = Math.hypot(dx, dy); if (r > R) continue;
					var f = r / R, a = Math.atan2(dy, dx), c;
					if (f > 0.84) c = ATM[Math.max(0, Math.min(9, Math.floor((1 - f) / 0.16 * 9 + ruido2d(a * 20 + t * 0.3, f * 30) * 2)))];
					else if (f > 0.3) {
						/* a camada de gelos: correntes subindo e descendo bem devagar */
						var n = ruido2d(a * 6 + Math.sin(f * 9 + t * 0.4) * 0.6, f * 7 - t * 0.15);
						c = GELO[Math.max(0, Math.min(15, Math.floor((f - 0.3) / 0.54 * 12 + (n - 0.5) * 5)))];
					} else c = NUC[Math.max(0, Math.min(9, Math.floor(f / 0.3 * 9 + (ruido2d(a * 4, f * 10) - 0.5) * 3)))];
					buf[y * L + x] = c;
				}
				/* as divisas entre as camadas e a linha do corte */
				[0.84, 0.3].forEach(function (f) { for (var a = Math.PI; a < Math.PI * 2; a += 0.004) luaMistura(buf, L, A, cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f, 230, 250, 255, 0.35); });
				brilhoSoma(buf, L, A, cx, cy, R * 0.42, 255, 170, 90, 0.35 + 0.08 * Math.sin(t * 2));
				for (var x2 = Math.round(cx - R); x2 <= Math.round(cx + R); x2++) pintar(buf, L, A, x2, Math.round(cy), hex('#e6fbff'));
				/* os diamantes: caem para o centro, brilhando com uma cruzinha que gira */
				diamantes.forEach(function (d) {
					var vx = cx - d.x, vy = cy - d.y, n = Math.hypot(vx, vy);
					if (n < R * 0.31) { d.r += dt; if (d.r > 0.6) novo(d); }
					else { d.x += vx / n * d.v * dt; d.y += vy / n * d.v * dt; }
					var b = 0.5 + 0.5 * Math.sin(t * 3 + d.f), fade = n < R * 0.31 ? 1 - d.r / 0.6 : 1;
					luaMistura(buf, L, A, d.x, d.y, 255, 255, 255, fade);
					luaMistura(buf, L, A, d.x + 1, d.y, 200, 240, 255, 0.6 * fade);
					if (b > 0.6) {
						var s = Math.round(1 + (b - 0.6) * 6);
						for (var q = 1; q <= s; q++) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (e) { luaMistura(buf, L, A, d.x + e[0] * q, d.y + e[1] * q, 220, 250, 255, (1 - q / (s + 1)) * fade); });
						brilhoSoma(buf, L, A, d.x, d.y, 5, 160, 220, 255, 0.4 * fade);
					}
				});
			};
		},

		// Vênus e a Terra girando lado a lado: a Terra gira para um lado (um dia rápido); Vênus,
		// para o outro (ela gira ao contrário) e bem mais devagar: um dia de lá dura 243 dias daqui
		'venus-gira': function (L, A) {
			var ceu = ceuBonito(L, A, 503, '#5a3a6a'), R = 48, cy = 80;
			return function (buf, t) {
				ceu(buf, t);
				brilhoSoma(buf, L, A, 0, 0, 160, 255, 200, 120, 0.25);
				brilhoSoma(buf, L, A, 86, cy, R * 1.5, 60, 130, 255, 0.4);
				arteGlobo(buf, L, A, 'terra', 86, cy, R, t * 0.9, -0.6, -0.5, 0.55);
				brilhoSoma(buf, L, A, 234, cy, R * 1.5, 255, 170, 60, 0.4);
				arteGlobo(buf, L, A, 'venus', 234, cy, R, -t * 0.12, -0.6, -0.5, 0.55);
				/* as setas embaixo: curvas, como se abraçassem o planeta */
				setaArco(buf, L, A, 86, cy + 6, R + 6, R * 0.35 + 6, Math.PI * 0.85, Math.PI * 0.15, 140, 200, 255);
				setaArco(buf, L, A, 234, cy + 6, R + 6, R * 0.35 + 6, Math.PI * 0.15, Math.PI * 0.85, 255, 200, 110);
				/* pontinhos andando nas setas: rápido na Terra, devagar na Venus */
				for (var i = 0; i < 3; i++) {
					var a = Math.PI * 0.85 - ((t * 0.6 + i / 3) % 1) * Math.PI * 0.7;
					luaDisco(buf, L, A, 86 + Math.cos(a) * (R + 6), cy + 6 + Math.sin(a) * (R * 0.35 + 6), 1, hex('#ffffff'));
					var b = Math.PI * 0.15 + ((t * 0.08 + i / 3) % 1) * Math.PI * 0.7;
					luaDisco(buf, L, A, 234 + Math.cos(b) * (R + 6), cy + 6 + Math.sin(b) * (R * 0.35 + 6), 1, hex('#ffffff'));
				}
			};
		},

		// A Terra dando a volta no Sol com o eixo inclinado (23°) sempre para o mesmo lado:
		// quando a metade de baixo (o hemisfério sul) fica virada para o Sol, é verão no Brasil
		'terra-estacoes': function (L, A) {
			var ceu = ceuBonito(L, A, 504, '#2a3a8a'), cx = L / 2, cy = A / 2 + 2, rx = 122, ry = 58, R = 15, INC = 23 * Math.PI / 180;
			var MESES = TR(['dezembro', 'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro'], ['December', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November']);
			return function (buf, t, hud) {
				ceu(buf, t);
				var ang = (t / 12) * Math.PI * 2, px = cx + Math.cos(ang) * rx, py = cy + Math.sin(ang) * ry;
				orbitaPontilhada(buf, L, A, cx, cy, rx, ry, ang, 140, 170, 255);
				function terra() {
					brilhoSoma(buf, L, A, px, py, R * 2.2, 60, 140, 255, 0.45);
					/* o eixo inclinado: o polo norte aponta sempre para cima e para a direita */
					var ex = Math.sin(INC), ey = -Math.cos(INC);
					luaLinha(buf, L, A, px - ex * (R + 6), py - ey * (R + 6), px - ex * R, py - ey * R, hex('#8a96c8'));
					arteGlobo(buf, L, A, 'terra', px, py, R, (t / 1.5) * Math.PI * 2, cx - px, cy - py, 0.8, INC);
					luaLinha(buf, L, A, px + ex * R, py + ey * R, px + ex * (R + 7), py + ey * (R + 7), hex('#a8b4e8'));
					luaDisco(buf, L, A, px + ex * (R + 8), py + ey * (R + 8), 1, hex('#ff5a6a'));
					/* o Brasil: um pontinho amarelo no hemisfério sul, do lado da frente */
					var bx = px - ex * R * 0.45 + 0.35 * R, by = py - ey * R * 0.45;
					luaDisco(buf, L, A, bx, by, 1, hex('#ffe680'));
				}
				if (Math.sin(ang) < 0) { terra(); solNoMeio(buf, L, A, cx, cy, 16, t); } else { solNoMeio(buf, L, A, cx, cy, 16, t); terra(); }
				if (hud) {
					var mes = MESES[Math.floor(((ang / (Math.PI * 2)) % 1) * 12)], sul = Math.cos(ang);
					hud.ano.textContent = mes;
					hud.estacao.textContent = TR((sul > 0.7 ? 'verão' : sul < -0.7 ? 'inverno' : Math.sin(ang) > 0 ? 'outono' : 'primavera') + ' no Brasil', (sul > 0.7 ? 'summer' : sul < -0.7 ? 'winter' : Math.sin(ang) > 0 ? 'autumn' : 'spring') + ' in Brazil');
				}
			};
		},

		// Saturno ao longo de um ano dele (29 anos e meio): vistos da Terra, os anéis abrem,
		// vão ficando de lado até quase sumir (como em 2025) e depois abrem de novo
		'saturno-aneis': function (L, A) {
			var ceu = ceuBonito(L, A, 505, '#6a5a3a'), cx = L / 2, cy = A / 2, R = 40, PERIODO = 14;
			var GLOBO = rampaCores(['#fff4d8', '#f0dca8', '#e0c080', '#c89a5a', '#8a6a3e', '#3a2a18'], 18);
			var FAIXA = rampaCores(['#f8e4b8', '#d8b480', '#b88a58', '#7a5a38', '#2e2010'], 18);
			/* o perfil dos anéis: brilho de cada raio (anel C fraco, B forte, Cassini vazio, A médio, Encke) */
			function anelBrilho(r) {
				var q = r / R;
				if (q < 1.24 || q > 2.27) return 0;
				if (q < 1.53) return 0.25 + 0.1 * Math.sin(q * 90);
				if (q < 1.95) return 0.85 + 0.12 * Math.sin(q * 140);
				if (q < 2.03) return 0.05;
				if (Math.abs(q - 2.21) < 0.008) return 0.1;
				return 0.6 + 0.08 * Math.sin(q * 160);
			}
			var ANEL = [255, 236, 196];
			return function (buf, t, hud) {
				ceu(buf, t);
				var fase = (t / PERIODO) * Math.PI * 2, b = 0.42 * Math.sin(fase), ab = Math.max(0.012, Math.abs(b));
				brilhoSoma(buf, L, A, cx, cy, R * 2.6, 255, 200, 120, 0.3);
				function aneis(frente) {
					for (var y = Math.floor(-R * 2.3 * ab) - 1; y <= R * 2.3 * ab + 1; y++) for (var x = -R * 2.3; x <= R * 2.3; x++) {
						var yy = y / ab, r = Math.hypot(x, yy), k = anelBrilho(r);
						if (k <= 0) continue;
						var nafrente = y * Math.sign(b || 1) > 0;
						if (nafrente !== frente) continue;
						if (!frente && x * x + y * y < R * R) continue;
						/* a sombra do planeta nos anéis, atrás dele (o Sol vem da esquerda e de cima) */
						var somb = !frente && x > 0 && Math.abs(yy * 0.4) < R * 0.9 && x < R * 1.6 ? 0.45 : 1;
						var a = Math.min(1, k * (0.55 + Math.min(1, ab * 6) * 0.45));
						luaMistura(buf, L, A, cx + x, cy + y, ANEL[0] * somb, ANEL[1] * somb * (0.9 + k * 0.1), ANEL[2] * somb * (0.75 + k * 0.25), a);
					}
				}
				aneis(false);
				esfera(buf, L, A, cx, cy, R, GLOBO, -0.7, -0.5, function (x, y) { return Math.sin(y * 9 + ruido2d(x * 3 + t * 0.1, y * 2) * 1.4) * 0.9 + (Math.abs(y) > 0.8 ? 1.2 : 0); });
				/* faixas e a sombra dos anéis sobre o globo */
				escurecer(buf, L, A, cx, cy, R, function (x, y) { var s = y * Math.sign(b || 1) - (-0.18 * b / 0.42); return Math.abs(b) > 0.03 && s > -0.05 && s < 0.12 * Math.abs(b) / 0.42 + 0.02 ? 0.55 : 1; });
				aneis(true);
				if (hud) {
					var ano = Math.floor(((fase / (Math.PI * 2)) % 1) * 29.5), abrindo = Math.sign(b) * Math.cos(fase) > 0;
					hud.ano.textContent = TR('ano ' + ano + ' de 29', 'year ' + ano + ' of 29');
					hud.estacao.textContent = TR(Math.abs(b) > 0.32 ? 'anéis bem abertos' : Math.abs(b) < 0.06 ? 'anéis de lado (como em 2025)' : abrindo ? 'anéis abrindo' : 'anéis fechando', Math.abs(b) > 0.32 ? 'rings wide open' : Math.abs(b) < 0.06 ? 'rings edge-on (as in 2025)' : abrindo ? 'rings opening' : 'rings closing');
				}
			};
		},

		// Mercúrio dando a volta no Sol: 3 giros a cada 2 voltas. No pontinho da bandeira, do nascer
		// do Sol até o próximo nascer passam 2 voltas inteiras (176 dias). O quadrinho mostra o céu de lá.
		'mercurio-dia': function (L, A) {
			var ceu = ceuBonito(L, A, 506, '#5a4a7a'), cx = 196, cy = A / 2 - 4, rx = 98, ry = 48, R = 14, ANO = 8;
			var bx = 6, by = A - 62, bw = 96, bh = 56;
			var CHAO = rampaCores(['#b0a8c4', '#7a7290', '#4a4460'], 8);
			return function (buf, t, hud) {
				ceu(buf, t);
				var th = (t / ANO) * Math.PI * 2, px = cx + Math.cos(th) * rx, py = cy + Math.sin(th) * ry;
				orbitaPontilhada(buf, L, A, cx, cy, rx, ry, th, 200, 190, 240);
				var fi = th * 1.5 + Math.PI / 2;
				var h = Math.atan2(Math.sin(fi - th - Math.PI), Math.cos(fi - th - Math.PI)), dia = Math.cos(h) > 0;
				function planeta() {
					brilhoSoma(buf, L, A, px, py, R * 2, 200, 190, 230, 0.3);
					arteGlobo(buf, L, A, 'mercurio', px, py, R, fi, cx - px, cy - py, 0.85);
					/* a bandeirinha no equador, girando junto com o planeta */
					if (Math.sin(fi) > -0.1) {
						var fx = px + Math.cos(fi) * R * 0.95;
						bandeirinha(buf, L, A, fx, py, 0, -1, 7);
						if (dia) for (var d = 20; d < Math.hypot(fx - cx, py - cy) - 4; d += 4) {
							var k = d / Math.hypot(fx - cx, py - cy);
							luaMistura(buf, L, A, cx + (fx - cx) * k, cy + (py - cy) * k, 255, 220, 120, 0.6);
						}
					}
				}
				if (Math.sin(th) < 0) { planeta(); solNoMeio(buf, L, A, cx, cy, 18, t); } else { solNoMeio(buf, L, A, cx, cy, 18, t); planeta(); }
				/* o quadrinho: o céu visto da bandeirinha (preto, porque Mercúrio não tem ar) */
				var chao = by + bh - 14, meio = bx + bw / 2;
				for (var y = by; y < by + bh; y++) for (var x = bx; x < bx + bw; x++) {
					var borda = y === by || y === by + bh - 1 || x === bx || x === bx + bw - 1, k = y * L + x;
					if (borda) buf[k] = hex('#7a72c8');
					else if (y >= chao) buf[k] = CHAO[Math.min(7, Math.floor((y - chao) / 2 + ruido2d(x * 0.4, y * 0.4) * 3))];
					else buf[k] = hex('#05040e');
				}
				if (!dia) [[8, 6], [20, 14], [40, 5], [56, 18], [70, 8], [84, 22], [30, 26], [62, 30], [12, 32]].forEach(function (e) { luaMistura(buf, L, A, bx + e[0], by + e[1], 220, 210, 255, 0.5 + 0.5 * Math.sin(t * 3 + e[0])); });
				var sx = meio + Math.sin(h) * 38, sy = chao - Math.cos(h) * 30;
				if (sy < chao + 4) {
					for (y = Math.floor(sy - 12); y <= sy + 12; y++) for (x = Math.floor(sx - 12); x <= sx + 12; x++) {
						if (x <= bx || x >= bx + bw - 1 || y <= by || y >= chao) continue;
						var dd = Math.hypot(x - sx, y - sy);
						if (dd < 5) pintar(buf, L, A, x, y, dd < 3 ? hex('#fffbe8') : hex('#ffd060'));
						else if (dd < 12) luaMistura(buf, L, A, x, y, 255, 200, 100, (1 - dd / 12) * 0.5);
					}
				}
				if (dia) for (x = bx + 1; x < bx + bw - 1; x++) luaMistura(buf, L, A, x, chao, 255, 230, 160, 0.4 * Math.max(0, Math.cos(h)));
				luaLinha(buf, L, A, meio, chao, meio, chao - 9, hex('#f4f0ff'));
				for (var q = 0; q < 4; q++) luaLinha(buf, L, A, meio + 1, chao - 9 + q, meio + 5 - q, chao - 9 + q, hex('#ff4a5a'));
				if (hud) {
					var c = Math.cos(h), s = Math.sin(h);
					hud.ano.textContent = TR('volta ' + (Math.floor(th / (Math.PI * 2)) % 2 + 1) + ' de 2 no Sol', 'orbit ' + (Math.floor(th / (Math.PI * 2)) % 2 + 1) + ' of 2 around the Sun');
					hud.estacao.textContent = TR(c > 0.93 ? 'meio-dia lá (430 °C)' : c > 0.2 ? (s < 0 ? 'manhã lá' : 'tarde lá') : c > -0.2 ? (s < 0 ? 'o Sol nascendo lá' : 'o Sol se pondo lá') : 'noite lá (−180 °C)', c > 0.93 ? 'noon there (430 °C)' : c > 0.2 ? (s < 0 ? 'morning there' : 'afternoon there') : c > -0.2 ? (s < 0 ? 'sunrise there' : 'sunset there') : 'night there (−180 °C)');
				}
			};
		},

		// Marte com uma tempestade de poeira que começa pequena, cobre o planeta inteiro e baixa
		'marte-poeira': function (L, A) {
			var ceu = ceuBonito(L, A, 507, '#7a3a2a'), cx = L / 2, cy = A / 2, R = 72, CICLO = 16;
			return function (buf, t, hud) {
				ceu(buf, t);
				var ciclo = (t / CICLO) % 1, fase = Math.min(1, Math.max(0, (ciclo - 0.22) / 0.6)), k = Math.sin(fase * Math.PI) * 1.3 - 0.15;
				brilhoSoma(buf, L, A, cx, cy, R * 1.4, 255, 120, 60, 0.35 + Math.max(0, k) * 0.2);
				var giro = t * 0.2;
				arteGlobo(buf, L, A, 'marte', cx, cy, R, giro, -0.7, -0.4, 0.75);
				/* a poeira: nasce num ponto da superfície e se espalha, com a borda rodopiando */
				for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
					var nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / R, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
					var nz = Math.sqrt(1 - d2), u = Math.atan2(nx, nz) + giro, v = Math.asin(ny);
					var dist = Math.acos(Math.max(-1, Math.min(1, Math.cos(v) * Math.cos(u - 0.9) * Math.cos(0.3) + Math.sin(v) * Math.sin(0.3)))) / Math.PI;
					var borda = (ruido2d(u * 3 + t * 0.4, v * 3) - 0.5) * 0.2, q = (k - dist - borda) / 0.08;
					if (q <= 0) continue;
					var rod = ruido2d(u * 5 + t * 0.7 + Math.sin(v * 4 + t) * 0.5, v * 5), luz = Math.max(0.2, -nx * 0.6 - ny * 0.35 + nz * 0.6);
					var a = Math.min(0.92, q) * (0.75 + rod * 0.3);
					luaMistura(buf, L, A, x, y, (215 + rod * 40) * luz + 20, (165 + rod * 40) * luz + 10, (110 + rod * 30) * luz, a);
				}
				/* a borda do planeta fica nublada quando a tempestade está alta */
				if (k > 0.3) brilhoSoma(buf, L, A, cx, cy, R * 1.12, 200, 140, 80, (k - 0.3) * 0.25);
				if (hud) {
					hud.ano.textContent = TR('semana ' + Math.floor(ciclo * 20), 'week ' + Math.floor(ciclo * 20));
					hud.estacao.textContent = TR(k < 0.05 ? 'céu limpo' : k > 0.95 ? 'o planeta inteiro coberto' : fase < 0.5 ? 'a tempestade crescendo' : 'a poeira baixando', k < 0.05 ? 'clear sky' : k > 0.95 ? 'the whole planet covered' : fase < 0.5 ? 'the storm growing' : 'the dust settling');
				}
			};
		},

		// Júpiter girando rápido (um dia de só 10 horas) e as quatro luas de Galileu indo e
		// voltando, vistas de lado: passam na frente (com a sombrinha no planeta) e atrás dele
		'jupiter-luas': function (L, A) {
			var ceu = ceuBonito(L, A, 508, '#6a4a3a'), cx = L / 2, cy = A / 2, R = 44;
			var CALISTO = rampaCores(['#b8a898', '#7a6a5e', '#3a322c'], 10);
			/* distância, período (s), tamanho, arte: Io, Europa, Ganimedes, Calisto */
			var LUAS = [[62, 3.5, 7, 'io'], [81, 7, 6, 'europa'], [110, 14, 10, 'ganimedes'], [148, 33, 9, null]];
			function lua(l, t, frente) {
				var a = (t / l[1]) * Math.PI * 2, x = cx + Math.cos(a) * l[0], y = cy + Math.sin(a) * 3;
				if ((Math.sin(a) > 0) !== frente) return;
				if (l[3]) arte(buf0, L, A, l[3], x, y, l[2], 0, -0.7, -0.3, 0.6);
				else esfera(buf0, L, A, x, y, l[2] / 2, CALISTO, -0.7, -0.3, function (u, v) { return ruido2d(u * 4 + 9, v * 4) - 0.5; });
			}
			var buf0;
			return function (buf, t) {
				buf0 = buf;
				ceu(buf, t);
				LUAS.forEach(function (l) { lua(l, t, false); });
				brilhoSoma(buf, L, A, cx, cy, R * 1.6, 255, 190, 130, 0.35);
				arteGlobo(buf, L, A, 'jupiter', cx, cy, R, t * 0.9, -0.7, -0.3, 0.7);
				/* as sombras das luas que estão na frente, no disco do planeta */
				LUAS.forEach(function (l) {
					var a = (t / l[1]) * Math.PI * 2, x = cx + Math.cos(a) * l[0] + 5;
					if (Math.sin(a) <= 0 || Math.abs(x - cx) > R - 3) return;
					escurecer(buf, L, A, x, cy + 2, l[2] / 2.2, function () { return 0.25; });
				});
				LUAS.forEach(function (l) { lua(l, t, true); });
			};
		},

		// Netuno: nuvens brancas e a Grande Mancha Escura correndo com os ventos mais rápidos do
		// Sistema Solar (para o lado contrário do giro), e Tritão dando a volta ao contrário
		'netuno-ventos': function (L, A) {
			var ceu = ceuBonito(L, A, 509, '#2a3a8a'), cx = L / 2, cy = A / 2, R = 56;
			function tritao(t, frente, buf) {
				var a = -(t / 9) * Math.PI * 2, x = cx + Math.cos(a) * 112, y = cy + Math.sin(a) * 26;
				if ((Math.sin(a) > 0) !== frente) return;
				brilhoSoma(buf, L, A, x, y, 10, 160, 140, 180, 0.3);
				arte(buf, L, A, 'tritao', x, y, 11, 0, -0.7, -0.3, 0.7);
			}
			return function (buf, t) {
				ceu(buf, t);
				orbitaPontilhada(buf, L, A, cx, cy, 112, 26, -(t / 9) * Math.PI * 2, 170, 160, 220);
				tritao(t, false, buf);
				brilhoSoma(buf, L, A, cx, cy, R * 1.6, 70, 110, 255, 0.45);
				var giro = t * 0.3;
				arteGlobo(buf, L, A, 'netuno', cx, cy, R, giro, -0.7, -0.35, 0.8);
				/* as nuvens e a mancha escura andam contra o giro */
				var vento = -t * 0.55;
				for (var y = Math.floor(cy - R); y <= cy + R; y++) for (var x = Math.floor(cx - R); x <= cx + R; x++) {
					var nx = (x + 0.5 - cx) / R, ny = (y + 0.5 - cy) / R, d2 = nx * nx + ny * ny; if (d2 > 0.97) continue;
					var nz = Math.sqrt(1 - d2), u = Math.atan2(nx, nz) - vento, v = Math.asin(ny);
					var du = Math.atan2(Math.sin(u - 0.3), Math.cos(u - 0.3)), dv = v + 0.32;
					var luz = Math.max(0.15, -nx * 0.65 - ny * 0.3 + nz * 0.6);
					var mancha = (du * du) / 0.09 + (dv * dv) / 0.012;
					if (mancha < 1) { luaMistura(buf, L, A, x, y, 12, 20, 60, 0.55 * (1 - mancha * 0.5)); continue; }
					if (mancha < 1.6 && dv < 0) { luaMistura(buf, L, A, x, y, 230, 240, 255, 0.55 * luz); continue; }
					var n1 = Math.abs(v - 0.5) < 0.05 && Math.sin(u * 3 + 1) > 0.55, n2 = Math.abs(v + 0.62) < 0.04 && Math.sin(u * 2 - 2) > 0.7, n3 = Math.abs(v - 0.12) < 0.025 && Math.sin(u * 4) > 0.8;
					if (n1 || n2 || n3) luaMistura(buf, L, A, x, y, 245, 250, 255, 0.85 * luz);
				}
				/* as setinhas: o vento (branca, para a esquerda) e o giro (azul, para a direita) */
				/* as setas: o vento em cima (branca, para a esquerda) e o giro embaixo (azul, para a direita) */
				[[cy - R - 9, -1, [240, 245, 255]], [cy + R + 9, 1, [120, 170, 255]]].forEach(function (s) {
					for (var x = -22; x <= 22; x++) luaMistura(buf, L, A, cx + x, s[0], s[2][0], s[2][1], s[2][2], 0.95);
					for (var k = 1; k <= 4; k++) { luaMistura(buf, L, A, cx + s[1] * (22 - k), s[0] - k, s[2][0], s[2][1], s[2][2], 0.95); luaMistura(buf, L, A, cx + s[1] * (22 - k), s[0] + k, s[2][0], s[2][1], s[2][2], 0.95); }
					var f = ((t * (s[1] < 0 ? 1.2 : 0.6)) % 1);
					luaDisco(buf, L, A, cx + s[1] * (-22 + f * 40), s[0], 1, hex('#ffffff'));
				});
				tritao(t, true, buf);
			};
		},

		// Mercúrio de perto, com o Sol à esquerda: a bandeirinha gira com o planeta e o termômetro
		// mostra a temperatura lá, do calor do dia (430 °C) ao frio da noite (−180 °C)
		'mercurio-calor': function (L, A) {
			var ceu = ceuBonito(L, A, 510, '#5a3a5a'), cx = 128, cy = A / 2 + 4, R = 62;
			return function (buf, t, hud) {
				ceu(buf, t);
				/* a luz do Sol entrando pela esquerda */
				brilhoSoma(buf, L, A, -40, cy, 120, 255, 190, 90, 0.9);
				brilhoSoma(buf, L, A, -40, cy, 70, 255, 240, 200, 0.9);
				for (var i = 0; i < 6; i++) {
					var yy = cy - 70 + i * 28 + Math.sin(t * 0.6 + i) * 4;
					for (var x = 0; x < cx - R * 0.6; x += 1) luaMistura(buf, L, A, x, yy + (x - 0) * (cy - yy) / (cx * 3), 255, 230, 160, 0.12 * (1 - x / (cx - R * 0.6)));
				}
				var lam = (t / 16) * Math.PI * 2;
				brilhoSoma(buf, L, A, cx - 10, cy, R * 1.4, 255, 200, 140, 0.25);
				arteGlobo(buf, L, A, 'mercurio', cx, cy, R, lam, -1, 0, 0.92);
				var px = cx + Math.sin(lam) * R * 0.96, frente = Math.cos(lam) > 0, sol = -Math.sin(lam);
				var temp = sol > 0 ? -180 + 610 * Math.pow(sol, 0.4) : -180;
				if (frente) {
					bandeirinha(buf, L, A, px, cy, 0, -1, 10);
					if (sol > 0.2) brilhoSoma(buf, L, A, px, cy - 3, 10, 255, 120, 40, (sol - 0.2) * 0.6);
				}
				var alto = (temp + 180) / 610;
				termometro(buf, L, A, 268, 18, 140, alto, [[0, false], [180 / 610, true], [1, false]]);
				if (hud) {
					hud.ano.textContent = TR('dia ' + Math.floor(((t / 16) % 1) * 176) + ' de 176', 'day ' + Math.floor(((t / 16) % 1) * 176) + ' of 176');
					var graus = Math.round(temp / 10) * 10;
					hud.estacao.textContent = TR((graus < 0 ? '−' + Math.abs(graus) : graus) + ' °C no pontinho' + (frente ? '' : ' (atrás)'), (graus < 0 ? '−' + Math.abs(graus) : graus) + ' °C at the dot' + (frente ? '' : ' (behind)'));
				}
			};
		},

		// Vênus: a luz do Sol atravessa as nuvens e esquenta o chão; o calor tenta sair, mas a
		// atmosfera grossa (quase toda de gás carbônico) devolve tudo, e o chão chega a 465 °C
		'venus-estufa': function (L, A) {
			var ceu = ceuBonito(L, A, 511, '#4a2a4a'), CICLO = 12, N = 44, NUV0 = 28, NUV1 = 62, CHAO = A - 26;
			var aleat = semente(91), fotons = [];
			for (var i = 0; i < N; i++) fotons.push({ x: 14 + aleat() * (L - 80), nasce: i * 0.22, fase: aleat() * 6, vai: 0.9 + aleat() * 0.8 });
			var NUV = rampaCores(['#fff6d0', '#f6d888', '#e0b050', '#b07c30'], 12), AR = rampaCores(['#5a2a14', '#7a3a18', '#a84e1c', '#d0702a'], 16);
			var SOLO = rampaCores(['#a8683a', '#7a4628', '#52301c', '#2e1a10'], 10);
			return function (buf, t, hud) {
				var c = t % CICLO, presos = 0;
				fotons.forEach(function (f) { if (c - f.nasce >= 1) presos++; });
				var calor = Math.min(1, presos / N * 1.15), temp = 20 + 445 * calor;
				ceu(buf, t);
				brilhoSoma(buf, L, A, 24, 6, 40, 255, 240, 200, 0.9);
				brilhoSoma(buf, L, A, 24, 6, 14, 255, 255, 240, 1);
				for (var y = NUV0 - 6; y < A; y++) for (var x = 0; x < L; x++) {
					var k = y * L + x;
					if (y < NUV1) {
						var n = ruido2d(x * 0.04 + t * 0.25, y * 0.12) * 0.7 + ruido2d(x * 0.11 - t * 0.4, y * 0.2) * 0.3;
						var topo = NUV0 + (ruido2d(x * 0.05 + t * 0.2, 3) - 0.5) * 12;
						if (y < topo) continue;
						buf[k] = NUV[Math.max(0, Math.min(11, Math.floor((y - NUV0) / (NUV1 - NUV0) * 7 + (0.5 - n) * 8)))];
					} else if (y < CHAO) {
						var q = (y - NUV1) / (CHAO - NUV1), onda = ruido2d(x * 0.05, y * 0.08 - t * 0.3) - 0.5;
						buf[k] = AR[Math.max(0, Math.min(15, Math.floor(q * 9 + calor * 6 * q + onda * 3)))];
					} else {
						var morro = CHAO + Math.sin(x * 0.03) * 2 + Math.sin(x * 0.11) * 1.2;
						if (y < morro) { buf[k] = AR[Math.min(15, Math.floor(9 + calor * 6))]; continue; }
						var racha = Math.abs(ruido2d(x * 0.12, y * 0.25) - 0.5) < 0.035;
						if (racha && calor > 0.3) buf[k] = calor > 0.8 ? hex('#ffd36a') : calor > 0.55 ? hex('#ff8a2a') : hex('#c84a1a');
						else buf[k] = SOLO[Math.max(0, Math.min(9, Math.floor((y - morro) / 3 + ruido2d(x * 0.3, y * 0.3) * 4)))];
					}
				}
				/* o chão brilhando de quente */
				if (calor > 0.3) for (x = 0; x < L; x += 16) brilhoSoma(buf, L, A, x + 8, CHAO + 4, 20, 255, 90, 20, (calor - 0.3) * 0.35);
				fotons.forEach(function (f) {
					var idade = c - f.nasce;
					if (idade < 0) return;
					if (idade < 1) {
						var yy = idade * CHAO, xx = f.x + idade * 10;
						for (var r = 0; r < 9; r++) luaMistura(buf, L, A, xx - r * 0.3, yy - r * 1.4, 255, 245, 190, 1 - r / 9);
						brilhoSoma(buf, L, A, xx, yy, 4, 255, 240, 160, 0.5);
						return;
					}
					var k2 = ((idade - 1) / f.vai) % 1, sobe = k2 < 0.5 ? k2 * 2 : 2 - k2 * 2;
					var yc = CHAO - 3 - sobe * (CHAO - NUV1 - 4), xc = f.x + 10 + Math.sin(idade * 1.7 + f.fase) * 10;
					for (var w = 0; w < 6; w++) luaMistura(buf, L, A, xc + Math.sin(idade * 9 + w * 0.9) * 1.5, yc + (k2 < 0.5 ? w : -w), 255, 90, 40, 0.9 - w * 0.14);
					brilhoSoma(buf, L, A, xc, yc, 4, 255, 80, 30, 0.45);
				});
				termometro(buf, L, A, 300, NUV1 + 4, A - 22, (temp - 20) / 445, [[0, false], [1, true]]);
				if (hud) {
					hud.ano.textContent = TR(Math.round(temp / 5) * 5 + ' °C no chão', Math.round(temp / 5) * 5 + ' °C on the ground');
					hud.estacao.textContent = TR(c < 1.2 ? 'a luz do Sol entra' : calor < 0.6 ? 'o calor não consegue sair' : 'quente de derreter chumbo', c < 1.2 ? 'sunlight comes in' : calor < 0.6 ? 'the heat cannot escape' : 'hot enough to melt lead');
				}
			};
		},

		// A Lua dando a volta na Terra, vista de cima (o Sol está à esquerda), e ao lado como
		// ela aparece no céu do Brasil: a parte iluminada muda a cada noite
		'terra-lua': function (L, A) {
			var ceu = ceuBonito(L, A, 512, '#2a3a7a'), cx = 92, cy = A / 2 + 2, ro = 62, CICLO = 14;
			return function (buf, t, hud) {
				ceu(buf, t);
				/* a luz do Sol vindo da esquerda */
				brilhoSoma(buf, L, A, -60, cy, 110, 255, 200, 110, 0.7);
				for (var i = 0; i < 9; i++) { var yy = 14 + i * 19; for (var x = 0; x < 22; x++) luaMistura(buf, L, A, x + ((t * 30 + i * 7) % 22), yy, 255, 220, 140, 0.25 * (1 - x / 22)); }
				var fase = ((t % CICLO) / CICLO) * Math.PI * 2, ang = Math.PI - fase;
				orbitaPontilhada(buf, L, A, cx, cy, ro, ro, ang, 150, 150, 220);
				brilhoSoma(buf, L, A, cx, cy, 30, 60, 130, 255, 0.45);
				arteGlobo(buf, L, A, 'terra', cx, cy, 15, t * 2, -1, 0, 0.85);
				var mx = cx + Math.cos(ang) * ro, my = cy + Math.sin(ang) * ro;
				arte(buf, L, A, 'lua', mx, my, 12, 0, -1, 0, 0.9);
				/* a divisória e a Lua grande, como se vê daqui (no Brasil, a crescente acende pela esquerda) */
				for (var y = 10; y < A - 10; y += 3) luaMistura(buf, L, A, 182, y, 120, 110, 220, 0.5);
				var lx = 252, ly = cy, R = 50, Sx = -Math.sin(fase), Sz = -Math.cos(fase);
				brilhoSoma(buf, L, A, lx, ly, R * 1.5, 160, 160, 190, 0.15 + 0.35 * (1 + Sz) / 2);
				arte(buf, L, A, 'lua', lx, ly, R * 2, 0);
				escurecer(buf, L, A, lx, ly, R, function (nx, ny, nz) { var a = nx * Sx + nz * Sz; return 0.08 + 0.92 * suave((a + 0.06) / 0.14); });
				if (hud) {
					var f = fase, nome = f < 0.25 || f > 6.03 ? TR('lua nova', 'new moon') : f < 1.32 ? TR('lua crescente', 'waxing crescent') : f < 1.82 ? TR('quarto crescente', 'first quarter') : f < 2.9 ? TR('crescente, quase cheia', 'waxing gibbous') : f < 3.39 ? TR('lua cheia', 'full moon') : f < 4.46 ? TR('minguante', 'waning gibbous') : f < 4.96 ? TR('quarto minguante', 'last quarter') : TR('minguante, quase nova', 'waning crescent');
					hud.ano.textContent = TR('dia ' + Math.floor((t % CICLO) / CICLO * 29.5) + ' de 29', 'day ' + Math.floor((t % CICLO) / CICLO * 29.5) + ' of 29');
					hud.estacao.textContent = nome;
				}
			};
		},

		// Marte e a Terra dando a volta no Sol: a Terra, mais perto, dá quase duas voltas
		// enquanto Marte dá uma (687 dias)
		'marte-ano': function (L, A) {
			var ceu = ceuBonito(L, A, 513, '#5a2a3a'), cx = L / 2, cy = A / 2 + 2, CICLO = 15, PT = CICLO * 365 / 687;
			var RXM = 132, RYM = 66, RXT = 84, RYT = 42;
			return function (buf, t, hud) {
				ceu(buf, t);
				var am = (t / CICLO) * Math.PI * 2, at = (t / PT) * Math.PI * 2;
				orbitaPontilhada(buf, L, A, cx, cy, RXM, RYM, am, 240, 150, 110);
				orbitaPontilhada(buf, L, A, cx, cy, RXT, RYT, at, 120, 170, 255);
				/* os rastros do caminho já feito neste ano de Marte */
				var cm = (t % CICLO) / CICLO * Math.PI * 2;
				for (var a = 0; a < cm; a += 0.02) luaMistura(buf, L, A, cx + Math.cos(am - a) * RXM, cy + Math.sin(am - a) * RYM, 255, 140, 90, 0.5 * (1 - a / (cm + 0.01)));
				var corpos = [
					{ x: cx + Math.cos(am) * RXM, y: cy + Math.sin(am) * RYM, z: Math.sin(am), d: function (o) { brilhoSoma(buf, L, A, o.x, o.y, 22, 255, 120, 60, 0.35); arteGlobo(buf, L, A, 'marte', o.x, o.y, 11, t * 3.8, cx - o.x, cy - o.y, 0.8, 25 * Math.PI / 180); } },
					{ x: cx + Math.cos(at) * RXT, y: cy + Math.sin(at) * RYT, z: Math.sin(at), d: function (o) { brilhoSoma(buf, L, A, o.x, o.y, 20, 60, 140, 255, 0.4); arteGlobo(buf, L, A, 'terra', o.x, o.y, 9, t * 3.9, cx - o.x, cy - o.y, 0.8, 23 * Math.PI / 180); } }
				];
				corpos.filter(function (o) { return o.z < 0; }).sort(function (a, b) { return a.z - b.z; }).forEach(function (o) { o.d(o); });
				solNoMeio(buf, L, A, cx, cy, 17, t);
				corpos.filter(function (o) { return o.z >= 0; }).sort(function (a, b) { return a.z - b.z; }).forEach(function (o) { o.d(o); });
				if (hud) {
					var voltas = Math.floor((t % CICLO) / PT);
					hud.ano.textContent = TR('dia ' + Math.floor(((t / CICLO) % 1) * 687) + ' de 687', 'day ' + Math.floor(((t / CICLO) % 1) * 687) + ' of 687');
					hud.estacao.textContent = TR('a Terra já deu ' + voltas + (voltas === 1 ? ' volta' : ' voltas'), 'Earth has gone around ' + voltas + (voltas === 1 ? ' time' : ' times'));
				}
			};
		},

		// A Grande Mancha Vermelha de Júpiter encolhendo desde 1879 (de uns 39 mil km para uns
		// 14 mil km de largura), com Terras para comparar
		'jupiter-mancha': function (L, A) {
			var CICLO = 14, cx = L / 2, cy = A / 2 + 4, PXKM = 250 / 39000;
			var FAIXAS = rampaCores(['#fbf2e0', '#ecd6b4', '#d4b08a', '#b08460', '#7a5440'], 20);
			var MANCHA = rampaCores(['#f8c8a0', '#e88a62', '#cc5c3c', '#a8402e', '#6a2420'], 20);
			return function (buf, t, hud) {
				var c = t % CICLO, k = suave(c / 11), km = 39000 - 25000 * k;
				var a = km * PXKM / 2, b = a * 0.5;
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var lat = y / A * 6, faixa = Math.floor(lat), vel = (faixa % 2 ? 1 : -1) * (5 + faixa * 1.5);
					var u = x + t * vel, dx = (x - cx) / a, dy = (y - cy) / b, r = Math.hypot(dx, dy);
					/* o gás desvia em volta da mancha */
					var desvio = r < 2.2 ? Math.exp(-(r - 1) * 2) * Math.sign(dy) * 6 : 0;
					var n = ruido2d(u * 0.03, (y + desvio) * 0.12) * 0.6 + ruido2d(u * 0.09, (y + desvio) * 0.3 + faixa) * 0.4;
					var base = (Math.sin((y + desvio) * 0.21) * 0.5 + 0.5) * 9 + n * 8, cc;
					if (r < 1) {
						var giro = Math.atan2(dy, dx) - t * (0.5 + r * 0.9);
						cc = MANCHA[Math.max(0, Math.min(19, Math.floor(r * 10 + Math.sin(giro * 3 + r * 7) * 2.5 + ruido2d(giro * 2, r * 4) * 5 - 2)))];
					} else if (r < 1.2) cc = FAIXAS[Math.max(0, Math.min(19, Math.floor((r - 1) * 20 + n * 4)))];
					else cc = FAIXAS[Math.max(0, Math.min(19, Math.floor(base)))];
					buf[y * L + x] = cc;
				}
				/* sombra de cima e de baixo, para parecer a curva do planeta */
				for (y = 0; y < A; y++) { var s = 1 - Math.pow(Math.abs(y - A / 2) / (A / 2), 3) * 0.45; for (x = 0; x < L; x++) { var v = buf[y * L + x]; buf[y * L + x] = cor((v & 255) * s, ((v >>> 8) & 255) * s, ((v >>> 16) & 255) * s); } }
				/* as Terras, transparentes, lado a lado na largura da mancha */
				var terras = km / 12742, raio = 12742 * PXKM / 2, m = Math.max(1, Math.round(terras));
				for (var i = 0; i < m; i++) {
					var ex = cx - (m - 1) * raio + i * raio * 2;
					brilhoSoma(buf, L, A, ex, cy, raio * 1.25, 40, 90, 200, 0.35);
					arte(buf, L, A, 'terra', ex, cy, raio * 2, t * 0.05, -0.7, -0.4, 0.6);
				}
				/* a borda da mancha, tracejada por cima das Terras */
				for (var q = 0; q < Math.PI * 2; q += 0.006) if (Math.floor(q * 40) % 2 === 0) luaMistura(buf, L, A, cx + Math.cos(q) * a, cy + Math.sin(q) * b, 255, 236, 220, 0.9);
				if (hud) {
					hud.ano.textContent = TR('ano ' + (1879 + Math.round(k * 145)), 'year ' + (1879 + Math.round(k * 145)));
					hud.estacao.textContent = TR('cabem ' + numero(terras, 1) + ' Terras lado a lado', numero(terras, 1) + ' Earths fit side by side');
				}
			};
		},

		// Saturno numa banheira gigante: a Terra afunda rapidinho, Júpiter afunda devagar e
		// Saturno, menos denso que a água (0,69 g/cm³), fica boiando
		'saturno-flutua': function (L, A) {
			var ceu = ceuBonito(L, A, 515, '#3a4a8a'), CICLO = 12, AGUA = 84, FUNDO_T = A - 12, X0 = 14, X1 = L - 15;
			var AGUAC = rampaCores(['#6ac8ff', '#3a8ae0', '#2458b0', '#163478'], 14);
			var PLAN = [
				{ x: 64, R: 11, id: 'terra', ate: function (c) { return AGUA + 11 + (FUNDO_T - 12 - AGUA - 11) * suave((c - 1) / 1.4); } },
				{ x: 152, R: 30, id: 'jupiter', ate: function (c) { return AGUA + 30 + (FUNDO_T - 31 - AGUA - 30) * suave((c - 1) / 7); } },
				{ x: 250, R: 25, id: 'saturno', anel: true, ate: function (c) { return AGUA + 4 + Math.sin((c - 1) * 4) * 5 * Math.exp(-(c - 1) * 0.6); } }
			];
			return function (buf, t, hud) {
				var c = t % CICLO;
				ceu(buf, t);
				/* a banheira: a louça com brilho */
				for (var y = 40; y <= FUNDO_T + 6; y++) for (var dx = -5; dx <= 0; dx++) { var g = 200 + dx * 14; pintar(buf, L, A, X0 + dx, y, cor(g, g, g + 30)); pintar(buf, L, A, X1 - dx, y, cor(g, g, g + 30)); }
				for (var x = X0 - 5; x <= X1 + 5; x++) for (var q = 1; q <= 6; q++) { var g2 = 230 - q * 18; pintar(buf, L, A, x, FUNDO_T + q, cor(g2, g2, g2 + 30)); }
				luaDisco(buf, L, A, X0 - 2, 40, 4, hex('#f4f4ff')); luaDisco(buf, L, A, X1 + 2, 40, 4, hex('#f4f4ff'));
				PLAN.forEach(function (p) {
					var py = c < 1 ? -40 + (AGUA - p.R + 40) * (c * c) : p.ate(c);
					p.y = py;
					if (p.anel) arte(buf, L, A, 'saturno', p.x, py, p.R * 2 * 95 / 49, -0.12);
					else arteGlobo(buf, L, A, p.id, p.x, py, p.R, t * 0.6, -0.6, -0.5, 0.5);
				});
				/* a água por cima, transparente: tudo que está embaixo fica azulado */
				for (y = AGUA - 1; y <= FUNDO_T; y++) for (x = X0 + 1; x < X1; x++) {
					var sup = AGUA + Math.sin(x * 0.12 + t * 3) * 0.8 + Math.sin(x * 0.05 - t * 2) * 0.6;
					if (y < sup) continue;
					var prof = (y - AGUA) / (FUNDO_T - AGUA), caus = Math.abs(ruido2d(x * 0.11 + Math.sin(y * 0.15 + t) * 0.4, y * 0.13 - t * 0.5) - 0.5) * 2;
					var col = AGUAC[Math.max(0, Math.min(13, Math.floor(prof * 11)))];
					luaMistura(buf, L, A, x, y, col & 255, (col >>> 8) & 255, (col >>> 16) & 255, y - sup < 1 ? 0.95 : 0.62);
					if (y - sup < 1) luaMistura(buf, L, A, x, y, 220, 245, 255, 0.8);
					else if (caus < 0.08) luaMistura(buf, L, A, x, y, 190, 235, 255, 0.35 * (1 - prof));
				}
				/* respingos e bolhas */
				PLAN.forEach(function (p, j) {
					if (c > 1 && c < 1.9) for (var s = 0; s < 10; s++) { var f = (c - 1) / 0.9, ox = (s - 4.5) * (p.R / 3 + 2) * f; luaDisco(buf, L, A, p.x + ox, AGUA - 2 - Math.sin(f * Math.PI) * (8 + (s % 3) * 4 + p.R * 0.3), 1, hex('#d8f4ff')); }
					if (!p.anel && c > 1.2) for (var bq = 0; bq < 4; bq++) {
						var fb = ((t * 0.7 + bq * 0.25 + j * 0.1) % 1), by = p.y - p.R - fb * (p.y - p.R - AGUA);
						if (by > AGUA + 2) luaMistura(buf, L, A, p.x + Math.sin(fb * 9 + bq) * 4, by, 230, 250, 255, 0.8);
					}
				});
				if (hud) {
					hud.ano.textContent = TR('uma banheira gigante', 'a giant bathtub');
					hud.estacao.textContent = TR(c < 1 ? 'soltando na água…' : c < 2.6 ? 'a Terra afunda rapidinho' : c < 8 ? 'Júpiter afunda devagar' : 'Saturno flutua!', c < 1 ? 'dropping into the water…' : c < 2.6 ? 'Earth sinks fast' : c < 8 ? 'Jupiter sinks slowly' : 'Saturn floats!');
				}
			};
		},

		// Netuno dando a volta no Sol: achado em 1846, ele só completou a primeira volta desde a
		// descoberta em 2011 (165 anos). O rastro mostra o caminho já feito
		'netuno-ano': function (L, A) {
			var ceu = ceuBonito(L, A, 516, '#2a3a8a'), cx = L / 2, cy = A / 2 + 2, rx = 130, ry = 62, CICLO = 16, A0 = 0.6;
			return function (buf, t, hud) {
				ceu(buf, t);
				var k = (t % CICLO) / CICLO, ang = A0 + k * Math.PI * 2, px = cx + Math.cos(ang) * rx, py = cy + Math.sin(ang) * ry;
				orbitaPontilhada(buf, L, A, cx, cy, rx, ry, null, 110, 140, 230);
				for (var a = A0; a < ang; a += 0.008) luaMistura(buf, L, A, cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 110, 160, 255, 0.35 + 0.6 * (a - A0) / (ang - A0 + 0.01));
				var d0x = cx + Math.cos(A0) * rx, d0y = cy + Math.sin(A0) * ry;
				brilhoSoma(buf, L, A, d0x, d0y, 8, 255, 80, 100, 0.5 + 0.3 * Math.sin(t * 4));
				[[0, -4], [0, -3], [0, 3], [0, 4], [-3, 0], [-4, 0], [3, 0], [4, 0]].forEach(function (s) { pintar(buf, L, A, d0x + s[0], d0y + s[1], hex('#ff5a6a')); });
				function netuno() {
					brilhoSoma(buf, L, A, px, py, 28, 60, 100, 255, 0.45);
					arteGlobo(buf, L, A, 'netuno', px, py, 13, (t / 1.5) * Math.PI * 2, cx - px, cy - py, 0.85, 28 * Math.PI / 180);
				}
				if (Math.sin(ang) < 0) { netuno(); solNoMeio(buf, L, A, cx, cy, 15, t); } else { solNoMeio(buf, L, A, cx, cy, 15, t); netuno(); }
				if (hud) {
					var ano = 1846 + Math.floor(k * 165);
					hud.ano.textContent = TR('ano ' + ano, 'year ' + ano);
					hud.estacao.textContent = TR(k < 0.05 ? 'descoberto em 1846 (marca vermelha)' : k > 0.95 ? 'primeira volta completa: 2011' : 'a primeira volta desde a descoberta', k < 0.05 ? 'discovered in 1846 (red mark)' : k > 0.95 ? 'first full orbit: 2011' : 'the first orbit since its discovery');
				}
			};
		},

		// O ciclo de 11 anos: as manchas aparecem e somem; no auge, erupções soltam nuvens de
		// partículas que viajam até a Terra e, ao chegar, acendem auroras nos polos
		'sol-aurora': function (L, A) {
			var ceu = ceuBonito(L, A, 517, '#3a2a6a'), aleat = semente(67), CICLO = 18;
			var scx = -30, scy = A / 2 + 4, SR = 108, ex = 252, ey = A / 2 + 6, ER = 16, SOLP_ = rampaCores(SOL_TONS, 16);
			var manchas = [];
			for (var i = 0; i < 18; i++) manchas.push([(aleat() - 0.5) * 1.1, (aleat() - 0.5) * 0.9, aleat(), 2 + aleat() * 3]);
			var particulas = [];
			for (i = 0; i < 160; i++) particulas.push([(aleat() - 0.5) * 1.1, 0.75 + aleat() * 0.4, aleat()]);
			var ERUPCOES = [6.6, 9.8], VIAGEM = 3, AURORA = 2.8;
			var bx = scx + SR * Math.cos(-0.2), by = scy + SR * Math.sin(-0.2);
			return function (buf, t, hud) {
				var c = t % CICLO, ano = c / CICLO * 11, ativo = Math.pow(Math.sin(Math.PI * ano / 11), 2);
				ceu(buf, t);
				brilhoSoma(buf, L, A, scx, scy, SR * 1.5, 255, 140, 40, 0.55);
				brilhoSoma(buf, L, A, scx, scy, SR * 1.18, 255, 200, 110, 0.6 + ativo * 0.2);
				for (var y = Math.max(0, Math.floor(scy - SR)); y <= Math.min(A - 1, scy + SR); y++) for (var x = 0; x <= scx + SR; x++) {
					var nx = (x + 0.5 - scx) / SR, ny = (y + 0.5 - scy) / SR, d2 = nx * nx + ny * ny; if (d2 > 1) continue;
					var nz = Math.sqrt(1 - d2), u = Math.atan2(nx, nz) + t * 0.02, w = Math.asin(ny);
					var grao = ruido2d(u * 28 + Math.sin(t * 0.7 + w * 9) * 0.3, w * 28 + t * 0.15) * 0.65 + ruido2d(u * 7, w * 7 - t * 0.05) * 0.35;
					var fac = Math.abs(ruido2d(u * 5 + 3, w * 5) - 0.5) < 0.03 && nz < 0.6 ? -1.2 : 0;
					buf[y * L + x] = SOLP_[Math.max(0, Math.min(SOLP_.length - 1, Math.floor((1 - Math.pow(nz, 0.5)) * 11 + (0.5 - grao) * 5 + 2 + fac)))];
				}
				/* as manchas: aparecem mais quando o Sol está agitado (miolo escuro, penumbra marrom) */
				manchas.forEach(function (m) {
					if (m[2] > ativo * 1.08) return;
					var nx = 0.35 + m[0] * 0.5 + 0.4, ny = m[1], mx = scx + nx * SR * 0.9, my = scy + ny * SR * 0.9;
					if (mx < 2) return;
					escurecer(buf, L, A, mx, my, m[3] + 2, function (x, y) { return 0.55 + Math.hypot(x, y) * 0.4; });
					escurecer(buf, L, A, mx, my, m[3], function () { return 0.3; });
				});
				var chegando = 0, aurora = 0;
				ERUPCOES.forEach(function (e0) {
					var dt = c - e0;
					if (dt > VIAGEM && dt < VIAGEM + AURORA) aurora = Math.max(aurora, Math.sin(Math.PI * Math.min(1, (dt - VIAGEM) / AURORA)));
					if (dt > VIAGEM - 0.7 && dt < VIAGEM + 0.6) chegando = 1;
				});
				/* o escudo magnético da Terra: linhas achatadas do lado do Sol */
				[24, 33, 44].forEach(function (Lc, n) {
					for (var q = -1.45; q <= 1.45; q += 0.012) {
						var rr = Lc * Math.cos(q) * Math.cos(q);
						if (rr < ER + 1) continue;
						[-1, 1].forEach(function (lado) {
							var xx = lado * rr * Math.cos(q) * (lado < 0 ? 0.7 - chegando * 0.18 : 1.4), yy = rr * Math.sin(q);
							luaMistura(buf, L, A, ex + xx, ey + yy, chegando ? 150 : 80, chegando ? 240 : 130, 255, (chegando ? 0.75 : 0.4) * (1 - n * 0.2));
						});
					}
				});
				brilhoSoma(buf, L, A, ex, ey, ER * 2, 60, 140, 255, 0.4);
				arteGlobo(buf, L, A, 'terra', ex, ey, ER, t * 0.8, -1, 0, 0.85);
				if (aurora > 0.02) for (var q2 = -0.8; q2 <= 0.8; q2 += 0.025) {
					var alt = (3 + Math.abs(Math.sin(q2 * 9 + t * 5)) * 6) * aurora * (1 - Math.abs(q2) * 0.6);
					[-1, 1].forEach(function (pol) {
						var nx = Math.sin(q2), ny = pol * Math.cos(q2);
						for (var h = 0; h < alt; h++) {
							var f = h / alt;
							luaMistura(buf, L, A, ex + nx * (ER * 0.9 + 1 + h), ey + ny * (ER * 0.9 + 1 + h), 60 + f * 200, 255 - f * 150, 140 + f * 80, 0.85 * (1 - f * 0.5));
						}
					});
					brilhoSoma(buf, L, A, ex, ey - ER - 3, 10, 60, 255, 140, aurora * 0.05);
					brilhoSoma(buf, L, A, ex, ey + ER + 3, 10, 60, 255, 140, aurora * 0.05);
				}
				ERUPCOES.forEach(function (e0) {
					var dt = c - e0;
					if (dt < -0.6 || dt > VIAGEM + 0.4) return;
					if (dt < 0.9) {
						var alto = Math.max(0, Math.min(1, (dt + 0.6) / 0.9)) * 18;
						for (var a = 0; a <= Math.PI; a += 0.03) luaMistura(buf, L, A, bx + Math.sin(a) * alto, by - 9 + Math.cos(a) * 9, 255, 240 - a * 40, 180, 0.9);
						brilhoSoma(buf, L, A, bx + alto * 0.5, by - 9, 16, 255, 220, 150, 0.6);
						if (dt > 0 && dt < 0.5) brilhoSoma(buf, L, A, bx + 6, by - 6, 50 * dt + 10, 255, 255, 230, (0.5 - dt) * 2);
					}
					if (dt <= 0) return;
					var k = Math.min(1, dt / VIAGEM), dist = ex - ER - 10 - bx;
					particulas.forEach(function (p) {
						var r = k * dist * p[1], ang = p[0] * (0.25 + k * 0.5);
						var px = bx + Math.cos(ang) * r, py = by + (ey - by) * k + Math.sin(ang) * r;
						if (px > ex - ER * 0.8 - 6) return;
						luaMistura(buf, L, A, px, py, 255, 160 + p[2] * 90, 80 + p[2] * 120, 0.9);
					});
				});
				if (hud) {
					var erupcao = ERUPCOES.some(function (e0) { return c - e0 >= -0.4 && c - e0 < 0.5; }), viajando = ERUPCOES.some(function (e0) { return c - e0 >= 0.5 && c - e0 < VIAGEM; });
					hud.ano.textContent = TR('ano ' + Math.floor(ano) + ' de 11', 'year ' + Math.floor(ano) + ' of 11');
					hud.estacao.textContent = TR(aurora > 0.05 ? 'aurora na Terra!' : erupcao ? 'erupção!' : viajando ? 'partículas a caminho da Terra' : ativo < 0.25 ? 'Sol calmo, poucas manchas' : 'Sol agitado, cheio de manchas', aurora > 0.05 ? 'aurora on Earth!' : erupcao ? 'eruption!' : viajando ? 'particles heading to Earth' : ativo < 0.25 ? 'calm Sun, few spots' : 'restless Sun, full of spots');
				}
			};
		},

		// A luz nascendo no centro do Sol fica presa num labirinto por dezenas de milhares de
		// anos; sobe numa bolha de gás até a superfície e, livre, chega à Terra em 8 minutos
		'sol-foton': function (L, A) {
			var ceu = ceuBonito(L, A, 518, '#3a2a5a'), aleat = semente(73), CICLO = 16;
			var scx = 4, scy = A / 2, SR = 86, NUCLEO = 22, RADIA = 60, ex = 290, ey = A / 2;
			var NUC = rampaCores(['#ffffff', '#fffbe0', '#fff0a0'], 8), RAD = rampaCores(['#ffe080', '#ffc050', '#f0a030', '#e08828'], 14), CONV = rampaCores(['#ffb060', '#f08030', '#d05a20', '#a03a14'], 14);
			var caminho = [[scx + 4, scy]], px = scx + 4, py = scy;
			while (Math.hypot(px - scx, py - scy) < RADIA && caminho.length < 900) {
				var a = aleat() * Math.PI * 2, rr = Math.hypot(px - scx, py - scy) || 1;
				px += Math.cos(a) * 3.2 + (px - scx) / rr * 0.24; py += Math.sin(a) * 3.2 + (py - scy) / rr * 0.24;
				if (px < scx + 3) px = scx + 3;
				py = Math.max(scy - SR + 8, Math.min(scy + SR - 8, py));
				caminho.push([px, py]);
			}
			var saida = caminho[caminho.length - 1], angSaida = Math.atan2(saida[1] - scy, saida[0] - scx);
			var T1 = 8.5, T2 = 10.3, T3 = 13.6;
			return function (buf, t, hud) {
				var c = t % CICLO;
				ceu(buf, t);
				brilhoSoma(buf, L, A, scx, scy, SR * 1.35, 255, 140, 40, 0.6);
				for (var y = Math.floor(scy - SR); y <= scy + SR; y++) for (var x = 0; x <= scx + SR; x++) {
					if (y < 0 || y >= A) continue;
					var dx = x + 0.5 - scx, dy = y + 0.5 - scy, d = Math.hypot(dx, dy); if (d > SR) continue;
					var col;
					if (d < NUCLEO) col = NUC[Math.max(0, Math.min(7, Math.floor(d / NUCLEO * 7 - Math.sin(t * 3) * 1.2)))];
					else if (d < RADIA) col = RAD[Math.max(0, Math.min(13, Math.floor((d - NUCLEO) / (RADIA - NUCLEO) * 10 + Math.sin(d * 0.9 - t * 0.6) * 1.6)))];
					else {
						/* as bolhas de gás fervendo (convecção) */
						var ang = Math.atan2(dy, dx), b = ruido2d(ang * 9, d * 0.18 - t * 0.6);
						col = CONV[Math.max(0, Math.min(13, Math.floor((d - RADIA) / (SR - RADIA) * 5 + (0.5 - b) * 12 + 3)))];
					}
					buf[y * L + x] = col;
				}
				[NUCLEO, RADIA].forEach(function (r, n) { for (var q = -Math.PI / 2; q <= Math.PI / 2; q += 0.01) luaMistura(buf, L, A, scx + Math.cos(q) * r, scy + Math.sin(q) * r, 255, 255, n ? 200 : 255, 0.5); });
				brilhoSoma(buf, L, A, scx, scy, NUCLEO * 1.5, 255, 255, 220, 0.5 + 0.15 * Math.sin(t * 3));
				var chegou = c > T3 && c < T3 + 1.4;
				brilhoSoma(buf, L, A, ex, ey, 26, 60, 140, 255, 0.4 + (chegou ? 0.4 : 0));
				arteGlobo(buf, L, A, 'terra', ex, ey, 13, t * 0.8, -1, 0, 0.85);
				if (chegou) brilhoSoma(buf, L, A, ex - 12, ey, 10 + (c - T3) * 20, 255, 250, 210, 1.4 - (c - T3));
				var fx, fy;
				if (c < T1) {
					var ate = Math.floor(c / T1 * (caminho.length - 1));
					for (var j = Math.max(1, ate - 220); j <= ate; j++) {
						var p0 = caminho[j - 1], p1 = caminho[j], idade = (ate - j) / 220;
						for (var m = 0; m <= 1; m += 0.25) luaMistura(buf, L, A, p0[0] + (p1[0] - p0[0]) * m, p0[1] + (p1[1] - p0[1]) * m, 120 + 130 * (1 - idade), 230, 255, 0.85 * (1 - idade * 0.8));
					}
					fx = caminho[ate][0]; fy = caminho[ate][1];
				} else if (c < T2) {
					var k = suave((c - T1) / (T2 - T1)), r = RADIA + (SR - RADIA) * k;
					fx = scx + Math.cos(angSaida) * r; fy = scy + Math.sin(angSaida) * r;
					for (var by2 = -5; by2 <= 5; by2++) for (var bx2 = -5; bx2 <= 5; bx2++) { var dd = Math.hypot(bx2, by2); if (dd <= 5) luaMistura(buf, L, A, fx + bx2, fy + by2, 255, 210, 150, dd > 4 ? 0.9 : 0.35); }
				} else {
					var k2 = Math.min(1, (c - T2) / (T3 - T2)), sx = scx + Math.cos(angSaida) * SR, sy = scy + Math.sin(angSaida) * SR;
					fx = sx + (ex - 13 - sx) * k2; fy = sy + (ey - sy) * k2;
					for (var w = 0; w < 50; w++) { var kw = Math.max(0, k2 - w * 0.006); luaMistura(buf, L, A, sx + (ex - 13 - sx) * kw, sy + (ey - sy) * kw, 255, 240, 170, 0.9 * (1 - w / 50)); }
				}
				brilhoSoma(buf, L, A, fx, fy, 7, 120, 230, 255, 0.9);
				luaDisco(buf, L, A, fx, fy, 1, hex('#ffffff'));
				if (hud) {
					hud.ano.textContent = TR(c < T1 ? numero(Math.round(c / T1 * 50), 0) + ' mil anos dentro do Sol' : c < T2 ? 'subindo numa bolha de gás' : c < T3 ? numero(Math.min(8, Math.floor((c - T2) / (T3 - T2) * 8)), 0) + ' min viajando' : 'chegou à Terra!', c < T1 ? numero(Math.round(c / T1 * 50), 0) + ' thousand years inside the Sun' : c < T2 ? 'rising in a gas bubble' : c < T3 ? numero(Math.min(8, Math.floor((c - T2) / (T3 - T2) * 8)), 0) + ' min traveling' : 'reached Earth!');
					hud.estacao.textContent = TR(c < T1 ? 'presa no labirinto' : c < T2 ? 'quase lá fora' : 'só 8 minutos até aqui', c < T1 ? 'trapped in the maze' : c < T2 ? 'almost outside' : 'only 8 minutes to here');
				}
			};
		}
	});
	// ---------- Ferramentas das animações dos destinos (tela grande) ----------
	// uma estrela com brilho somado e raios em cruz (tam: o tamanho dos raios)
	function estrelaBrilho(buf, L, A, x, y, r, g, b, tam, forca) {
		forca = forca === undefined ? 1 : forca;
		brilhoSoma(buf, L, A, x, y, tam * 1.6 + 2, r * 0.7, g * 0.7, b * 0.7, 0.55 * forca);
		for (var k = 1; k <= tam; k++) {
			var a = (1 - k / (tam + 1)) * 0.85 * forca;
			luaMistura(buf, L, A, x + k, y, r, g, b, a); luaMistura(buf, L, A, x - k, y, r, g, b, a);
			luaMistura(buf, L, A, x, y + k, r, g, b, a); luaMistura(buf, L, A, x, y - k, r, g, b, a);
		}
		luaMistura(buf, L, A, x, y, 255, 255, 255, Math.min(1, forca * 1.2));
	}
	// uma camada pré-pintada (r, g, b, alfa por pixel) misturada por cima, com força k
	function camadaMistura(buf, L, A, cam, k) {
		for (var i = 0, n = L * A; i < n; i++) {
			var a = cam[i * 4 + 3] * k; if (a <= 0.004) continue;
			var v = buf[i];
			buf[i] = cor((v & 255) + (cam[i * 4] - (v & 255)) * a, ((v >>> 8) & 255) + (cam[i * 4 + 1] - ((v >>> 8) & 255)) * a, ((v >>> 16) & 255) + (cam[i * 4 + 2] - ((v >>> 16) & 255)) * a);
		}
	}
	// um painel de vidro escuro com grade (para os gráficos)
	function painel(buf, L, A, x0, y0, x1, y1, linhas) {
		for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
			var borda = x === x0 || x === x1 || y === y0 || y === y1;
			luaMistura(buf, L, A, x, y, borda ? 140 : 10, borda ? 130 : 8, borda ? 230 : 30, borda ? 0.7 : 0.62);
		}
		(linhas || []).forEach(function (ly) { for (var x = x0 + 2; x < x1 - 1; x += 3) luaMistura(buf, L, A, x, ly, 120, 120, 200, 0.45); });
	}
	// um ponto de linha de gráfico com brilho (para as curvas ficarem acesas)
	function pontoAceso(buf, L, A, x, y, r, g, b) {
		luaMistura(buf, L, A, x, y, r, g, b, 1);
		luaMistura(buf, L, A, x, y - 1, r, g, b, 0.35); luaMistura(buf, L, A, x, y + 1, r, g, b, 0.35);
	}
	// o buraco negro: o disco de gás quente inclinado (a metade de trás aparece também por cima,
	// entortada pela gravidade), o anel de fótons e a sombra. "lado" mais claro: o gás vindo em nossa direção
	function buracoNegro(buf, L, A, cx, cy, R, t) {
		var RX = R * 3.4, RY = R * 0.62;
		function disco(frente) {
			for (var y = Math.floor(cy - RY - 2); y <= cy + RY + 2; y++) for (var x = Math.floor(cx - RX); x <= cx + RX; x++) {
				var dx = (x + 0.5 - cx) / RX, dy = (y + 0.5 - cy) / RY, r = Math.hypot(dx, dy);
				if (r > 1 || r < R * 1.5 / RX) continue;
				if ((dy > 0) !== frente) continue;
				var a = Math.atan2(dy, dx), giro = ruido2d(a * 3 - t * 1.2 / (r + 0.2), r * 9);
				var quente = 1 - (r - R * 1.5 / RX) / (1 - R * 1.5 / RX), lado = 0.65 - 0.45 * Math.cos(a);
				var k = Math.pow(quente, 1.4) * (0.55 + giro * 0.6) * lado;
				luaMistura(buf, L, A, x, y, 255, 140 + 115 * k, 50 + 160 * k * k, Math.min(1, k * 1.6 + 0.1));
			}
		}
		disco(false);
		/* a metade de trás do disco, vista por cima do buraco (o arco entortado pela gravidade) */
		for (var a = Math.PI * 1.03; a < Math.PI * 1.97; a += 0.006) for (var w = 0; w < R * 0.9; w += 0.7) {
			var rr = R * 1.45 + w, x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.95;
			var k = (1 - w / (R * 0.9)) * (0.5 + 0.5 * ruido2d(a * 6 - t, w * 0.5)) * (0.65 - 0.45 * Math.cos(a));
			luaMistura(buf, L, A, x, y, 255, 170 + 80 * k, 80 + 120 * k, Math.min(1, k * 1.3));
		}
		brilhoSoma(buf, L, A, cx, cy, R * 3, 255, 150, 60, 0.35);
		for (var y2 = Math.floor(cy - R * 1.3); y2 <= cy + R * 1.3; y2++) for (var x2 = Math.floor(cx - R * 1.3); x2 <= cx + R * 1.3; x2++) {
			var d = Math.hypot(x2 + 0.5 - cx, y2 + 0.5 - cy);
			if (d < R) pintar(buf, L, A, x2, y2, hex('#000000'));
			else if (d < R + 1.4) luaMistura(buf, L, A, x2, y2, 255, 236, 190, 0.95 * (1 - (d - R) / 1.6));
		}
		disco(true);
	}
	// a Via Láctea vista de lado, como camada pré-pintada: a faixa de estrelas, o bojo dourado
	// no meio e a faixa escura de poeira
	function viaDeLado(L, A, cx, cy, larg, sem) {
		var cam = new Float32Array(L * A * 4), aleat = semente(sem);
		function por(x, y, r, g, b, a) {
			x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= L || y >= A) return;
			var i = (y * L + x) * 4, a0 = cam[i + 3], na = a0 + a * (1 - a0); if (na <= 0) return;
			cam[i] = (cam[i] * a0 + r * a * (1 - a0)) / na; cam[i + 1] = (cam[i + 1] * a0 + g * a * (1 - a0)) / na; cam[i + 2] = (cam[i + 2] * a0 + b * a * (1 - a0)) / na; cam[i + 3] = na;
		}
		for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
			var u = (x - cx) / larg, v = (y - cy), esp = 7 * (1 - 0.55 * Math.min(1, Math.abs(u))) + 10 * Math.exp(-u * u * 18);
			var k = Math.exp(-v * v / (esp * esp)) * Math.max(0, 1 - Math.abs(u) * 0.9) * (0.6 + 0.4 * ruido2d(x * 0.08 + sem, y * 0.2));
			var bojo = Math.exp(-(u * u * 30 + v * v / 70));
			var poeira = Math.abs(v - Math.sin(u * 3) * 1.2) < 1.6 && Math.abs(u) < 0.8 && ruido2d(x * 0.15, 3 + sem) > 0.35 ? 0.55 : 1;
			if (k + bojo > 0.02) por(x, y, 170 + 85 * bojo, 170 + 50 * bojo, 230 - 90 * bojo, Math.min(1, (k * 0.75 + bojo * 0.9)) * poeira);
		}
		for (var i = 0; i < larg * 9; i++) {
			var u2 = (aleat() - 0.5) * 2, x2 = cx + u2 * larg, sp = 7 * (1 - 0.55 * Math.abs(u2));
			var y3 = cy + (aleat() + aleat() + aleat() - 1.5) * sp * 0.9, br = 0.6 + aleat() * 0.4;
			por(x2, y3, 230 * br, 225 * br, 255 * br, 0.8);
		}
		return cam;
	}

	Object.assign(ANIMACOES, {
		// Sagittarius A*: a estrela S2 numa órbita bem alongada em volta do buraco negro.
		// Como um cometa, ela anda devagar lá longe e dispara quando passa perto (leis de Kepler).
		'sgr-s2': function (L, A) {
			var ceu = ceuBonito(L, A, 601, '#6a3a2a'), fx = 228, fy = A / 2 + 4, giro = -0.2;
			var a = 104, e = 0.88, b = a * Math.sqrt(1 - e * e), T = 16;
			var OUTRAS = [[52, 0.45, 1.2, 9, [255, 220, 180]], [40, 0.3, -0.9, 7, [200, 220, 255]], [70, 0.6, 2.4, 12, [255, 255, 230]], [60, 0.5, 0.4, 10, [190, 210, 255]]];
			function kepler(M, ee) { var E = Math.PI; for (var k = 0; k < 14; k++) E -= (E - ee * Math.sin(E) - M) / (1 - ee * Math.cos(E)); return E; }
			function naTela(X, Y, gg) { var c = Math.cos(gg), s = Math.sin(gg); return [fx + X * c - Y * s, fy + X * s + Y * c]; }
			var vPeri = Math.sqrt(2 / (a * (1 - e)) - 1 / a);
			return function (buf, t, hud) {
				ceu(buf, t);
				brilhoSoma(buf, L, A, fx, fy, 90, 90, 40, 80, 0.4);
				for (var k = 0; k < 400; k += 2) {
					var E0 = k / 400 * Math.PI * 2, p0 = naTela(a * (Math.cos(E0) - e), b * Math.sin(E0), giro);
					luaMistura(buf, L, A, p0[0], p0[1], 150, 150, 230, 0.4);
				}
				OUTRAS.forEach(function (o) {
					var bo = o[0] * Math.sqrt(1 - o[1] * o[1]), Eo = kepler(((t / o[3]) % 1) * Math.PI * 2, o[1]);
					var q = naTela(o[0] * (Math.cos(Eo) - o[1]), bo * Math.sin(Eo), o[2]);
					estrelaBrilho(buf, L, A, q[0], q[1], o[4][0], o[4][1], o[4][2], 2, 0.7);
				});
				buracoNegro(buf, L, A, fx, fy, 8, t);
				var M = ((t / T + 0.5) % 1) * Math.PI * 2;
				for (var j = 40; j >= 1; j--) {
					var Ej = kepler(M - j * 0.006, e), pj = naTela(a * (Math.cos(Ej) - e), b * Math.sin(Ej), giro);
					luaMistura(buf, L, A, pj[0], pj[1], 140, 200, 255, 0.85 * (1 - j / 41));
				}
				var E = kepler(M, e), X = a * (Math.cos(E) - e), Y = b * Math.sin(E), p = naTela(X, Y, giro);
				estrelaBrilho(buf, L, A, p[0], p[1], 170, 220, 255, 4);
				if (hud) {
					var dist = Math.sqrt(X * X + Y * Y), v = Math.sqrt(2 / dist - 1 / a) / vPeri * 7650;
					hud.ano.textContent = TR('ano ' + Math.floor((M / (Math.PI * 2)) * 16) + ' de 16', 'year ' + Math.floor((M / (Math.PI * 2)) * 16) + ' of 16');
					hud.estacao.textContent = numero(Math.round(v / 10) * 10, 0) + ' km/s';
				}
			};
		},

		// Sagittarius A*: raios de luz passando perto do buraco negro. Os de longe só entortam;
		// os que chegam perto demais caem lá dentro e não voltam mais
		'sgr-luz': function (L, A) {
			var ceu = ceuBonito(L, A, 602, '#3a2a5a'), cx = 176, cy = A / 2, SOMBRA = 14, K = 14, raios = [];
			[-74, -58, -44, -34, -26, -20, -14, -8, 8, 14, 20, 26, 34, 44, 58, 74].forEach(function (b) {
				var x = -5, y = cy + b, vx = 1, vy = 0, pts = [], caiu = false;
				for (var s = 0; s < 1400; s++) {
					var dx = cx - x, dy = cy - y, r2 = dx * dx + dy * dy, r = Math.sqrt(r2);
					if (r < SOMBRA) { caiu = true; break; }
					vx += dx / r * K / r2 * 0.6; vy += dy / r * K / r2 * 0.6;
					var v = Math.sqrt(vx * vx + vy * vy); vx /= v; vy /= v;
					x += vx * 0.5; y += vy * 0.5;
					pts.push([x, y]);
					if (x > L + 4 || y < -4 || y > A + 4 || x < -8) break;
				}
				raios.push({ pts: pts, caiu: caiu });
			});
			return function (buf, t) {
				ceu(buf, t);
				raios.forEach(function (rr) {
					for (var i = 0; i < rr.pts.length; i += 2) { var p = rr.pts[i]; luaMistura(buf, L, A, p[0], p[1], rr.caiu ? 200 : 120, rr.caiu ? 110 : 150, rr.caiu ? 90 : 240, 0.3); }
				});
				buracoNegro(buf, L, A, cx, cy, SOMBRA - 4, t);
				raios.forEach(function (rr, j) {
					for (var q = 0; q < 2; q++) {
						var i2 = Math.floor(((t * 0.22 + q / 2 + j * 0.061) % 1) * rr.pts.length);
						for (var w = 0; w < 26; w++) {
							var p2 = rr.pts[i2 - w]; if (!p2) break;
							luaMistura(buf, L, A, p2[0], p2[1], rr.caiu ? 255 : 220, rr.caiu ? 170 - w * 3 : 240, rr.caiu ? 80 : 255, 1 - w / 26);
						}
						var pc = rr.pts[i2];
						if (pc) brilhoSoma(buf, L, A, pc[0], pc[1], 5, rr.caiu ? 255 : 160, rr.caiu ? 140 : 220, rr.caiu ? 60 : 255, 0.6);
					}
				});
			};
		},

		// Bolhas de Fermi: a Via Láctea de lado; o centro engole uma nuvem, solta jatos e as
		// duas bolhas vão inflando (magenta), com a casca do eROSITA (turquesa) em volta
		'fermi-sopro': function (L, A) {
			var ceu = ceuBonito(L, A, 603, '#3a2a6a'), cx = L / 2, cy = A / 2, CICLO = 15, via = viaDeLado(L, A, cx, cy, 150, 7);
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, cresce = suave((c - 3) / 8), casca = suave((c - 6) / 6), some = c > 13.5 ? 1 - (c - 13.5) / 1.5 : 1;
				var rw = 6 + cresce * 36, rh = 5 + cresce * 34;
				if (c > 3) for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					for (var s = -1; s <= 1; s += 2) {
						if (s * (cy - y) < 0) continue;
						var u = (x - cx) / rw, v = (y - (cy - s * rh)) / rh, a = Math.atan2(v, u);
						var bord = 1 + (ruido2d(Math.cos(a) * 2 + s * 4, Math.sin(a) * 2) - 0.5) * 0.12, d = Math.hypot(u, v) / bord;
						if (d < 1) {
							var borda = Math.pow(d, 6), fil = ruido2d(x * 0.08 + s * 9, y * 0.08 - t * 0.2);
							luaMistura(buf, L, A, x, y, 230 + 25 * borda, 90 + 90 * borda, 230, (0.18 + 0.55 * borda + fil * 0.12) * some);
						} else if (casca > 0) {
							var u2 = (x - cx) / (rw * 1.22 * casca + 1), v2 = (y - (cy - s * rh * 1.12 * casca)) / (rh * 1.2 * casca + 1), d2 = Math.hypot(u2, v2);
							if (d2 < 1 && d2 > 0.86) luaMistura(buf, L, A, x, y, 90, 230, 215, (1 - Math.abs(d2 - 0.93) / 0.07) * 0.5 * some * casca);
						}
					}
				}
				/* partículas subindo dentro das bolhas */
				if (c > 3) for (var k = 0; k < 60; k++) {
					var f = ((t * 0.3 + k / 60) % 1), lado = k & 1 ? 1 : -1;
					var px = cx + Math.sin(k * 12.9898) * rw * 0.8 * Math.sin(f * Math.PI), py = cy - lado * f * rh * 1.9;
					luaMistura(buf, L, A, px, py, 255, 220, 250, 0.8 * some * Math.sin(f * Math.PI));
				}
				camadaMistura(buf, L, A, via, 1);
				brilhoSoma(buf, L, A, cx, cy, 26, 255, 210, 140, 0.6);
				if (c < 2.6) {
					var nx = cx - 120 + suave(c / 2.6) * 120;
					for (var n = 0; n < 60; n++) luaMistura(buf, L, A, nx + Math.sin(n * 7.1) * 10 * (1 - c / 3), cy - 8 + Math.cos(n * 3.3) * 5, 255, 140, 220, 0.8);
					brilhoSoma(buf, L, A, nx, cy - 8, 12, 255, 100, 200, 0.4);
				}
				if (c > 2.4 && c < 3.6) { var fl = 1 - Math.abs(c - 3) / 0.6; brilhoSoma(buf, L, A, cx, cy, 10 + fl * 40, 255, 255, 240, fl * 1.5); }
				if (c > 2.8 && c < 9.5) {
					var jl = Math.min(80, (c - 2.8) * 40), jf = c > 8 ? (9.5 - c) / 1.5 : 1;
					for (var jy = 6; jy < jl; jy++) { var a2 = (1 - jy / 90) * jf; luaMistura(buf, L, A, cx, cy - jy, 200, 240, 255, a2); luaMistura(buf, L, A, cx, cy + jy, 200, 240, 255, a2); luaMistura(buf, L, A, cx + 1, cy - jy, 150, 220, 255, a2 * 0.5); luaMistura(buf, L, A, cx + 1, cy + jy, 150, 220, 255, a2 * 0.5); }
				}
				if (hud) {
					var ma = c < 3 ? 4 : Math.max(0, 4 - (c - 3) / 8 * 4);
					hud.ano.textContent = TR(ma <= 0.05 ? 'hoje' : 'há ' + numero(ma, ma < 1 ? 1 : 0).replace(',0', '') + (ma >= 2 ? ' milhões' : ' milhão') + ' de anos', ma <= 0.05 ? 'today' : numero(ma, ma < 1 ? 1 : 0).replace('.0', '') + ' million years ago');
					hud.estacao.textContent = TR(c < 2.4 ? 'uma nuvem de gás cai no centro' : c < 3.4 ? 'o buraco negro engole a nuvem' : c < 9 ? 'jatos soprando as bolhas' : 'bolhas de 25 mil anos-luz', c < 2.4 ? 'a gas cloud falls to the center' : c < 3.4 ? 'the black hole swallows the cloud' : c < 9 ? 'jets blowing the bubbles' : 'bubbles 25 thousand light-years tall');
				}
			};
		},

		// Bolhas de Fermi: a mesma região vista em luz comum (só a galáxia) e em raios gama
		// (as bolhas aparecem). Uma "lente" passa de um lado para o outro trocando a visão
		'fermi-raios': function (L, A) {
			var ceu = ceuBonito(L, A, 604, '#2a2a5a'), cx = L / 2, cy = A / 2, via = viaDeLado(L, A, cx, cy, 150, 11);
			var GAMA = new Float32Array(L * A * 4);
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
				var i = (y * L + x) * 4, m = 0;
				for (var s = -1; s <= 1; s += 2) {
					if (s * (cy - y) < 0) continue;
					var u = (x - cx) / 38, v = (y - (cy - s * 36)) / 38, a = Math.atan2(v, u);
					var d = Math.hypot(u, v) / (1 + Math.sin(a * 5 + s) * 0.05 + Math.sin(a * 11) * 0.03);
					if (d < 1) m = Math.max(m, 0.35 + 0.6 * Math.pow(d, 5) + (ruido2d(x * 0.1, y * 0.1) - 0.5) * 0.2);
				}
				var faixa = Math.exp(-Math.pow((y - cy) / 6, 2)) * Math.max(0, 1 - Math.abs(x - cx) / 160);
				GAMA[i] = 255; GAMA[i + 1] = Math.min(240, 90 + 110 * faixa + 60 * Math.pow(m, 3)); GAMA[i + 2] = 230 - 60 * faixa;
				GAMA[i + 3] = Math.min(1, m * 0.85 + faixa * 0.6 + 0.05);
			}
			return function (buf, t, hud) {
				var c = t % 8, corte = c < 4 ? suave(c / 3.2) * (L + 8) - 4 : L + 4 - suave((c - 4) / 3.2) * (L + 8);
				ceu(buf, t);
				camadaMistura(buf, L, A, via, 1);
				brilhoSoma(buf, L, A, cx, cy, 24, 255, 210, 140, 0.5);
				/* à esquerda da lente: o céu em raios gama (fundo roxo e as bolhas acesas) */
				for (var y = 0; y < A; y++) for (var x = 0; x < Math.min(L, corte); x++) {
					var k = y * L + x, i = k * 4, v = buf[k], g = ((v & 255) + ((v >>> 8) & 255) + ((v >>> 16) & 255)) / 3 * 0.25;
					var a = GAMA[i + 3];
					buf[k] = cor(Math.min(255, 18 + g + (GAMA[i] - 18) * a), Math.min(255, 8 + g + (GAMA[i + 1] - 8) * a), Math.min(255, 36 + g + (GAMA[i + 2] - 36) * a));
				}
				for (y = 0; y < A; y++) { luaMistura(buf, L, A, corte, y, 255, 255, 255, 0.95); luaMistura(buf, L, A, corte + 1, y, 160, 250, 255, 0.6); luaMistura(buf, L, A, corte - 1, y, 255, 160, 240, 0.6); }
				brilhoSoma(buf, L, A, corte, cy, 30, 180, 240, 255, 0.25);
				if (hud) {
					hud.ano.textContent = TR('← raios gama', '← gamma rays');
					hud.estacao.textContent = TR('luz que os olhos veem →', 'light our eyes see →');
				}
			};
		},

		// Nebulosa de Órion: uma nuvem encolhe e gira, acende uma estrela no meio de um disco
		// de poeira, e no disco vão se formando planetas (abrindo "trilhas" sem poeira)
		'orion-disco': function (L, A) {
			var ceu = ceuBonito(L, A, 605, '#8a3a6a'), aleat = semente(71), poeira = [], cx = L / 2, cy = A / 2, incl = 0.3, CICLO = 16;
			for (var i = 0; i < 1600; i++) poeira.push([18 + Math.pow(aleat(), 0.7) * 120, aleat() * Math.PI * 2, aleat()]);
			var PLANETAS = [[34, rampaCores(['#f0d0b0', '#b08060', '#4a3020'], 8), 3], [56, rampaCores(['#ffc0a0', '#d0604a', '#5a2018'], 8), 3.5], [82, rampaCores(['#fff0c8', '#d8b080', '#6a4a2a'], 8), 6], [110, rampaCores(['#c8e0ff', '#5a8ae0', '#1a2a6a'], 8), 4.5]];
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, nuvem = 1 - suave((c - 0.5) / 3), acesa = suave((c - 2.8) / 1.2), forma = suave((c - 6) / 6);
				brilhoSoma(buf, L, A, cx, cy, 140, 200, 80, 140, 0.25 + nuvem * 0.2);
				function desenhar(frente) {
					poeira.forEach(function (p) {
						var r = p[0] * (0.4 + 0.6 * (1 - nuvem * 0.6)), ang = p[1] + t * 3 / Math.pow(r / 18, 1.5), sy = Math.sin(ang);
						if ((sy >= 0) !== frente) return;
						var limpa = 0;
						PLANETAS.forEach(function (pl) { if (Math.abs(p[0] - pl[0]) < 6) limpa = Math.max(limpa, forma); });
						if (p[2] < limpa) return;
						var x = cx + Math.cos(ang) * r, y = cy + sy * r * (incl + nuvem * 0.6);
						var luz = acesa * Math.max(0, 1 - r / 130), q = p[2];
						luaMistura(buf, L, A, x, y, 200 + 55 * luz, 110 + 60 * q + 80 * luz, 120 + 40 * q, (0.45 + 0.4 * q) * (frente ? 1 : 0.8));
					});
				}
				desenhar(false);
				if (acesa > 0) { brilhoSoma(buf, L, A, cx, cy, 40 * acesa, 255, 200, 120, 0.7); brilhoSoma(buf, L, A, cx, cy, 10 * acesa + 1, 255, 255, 230, 1.2); estrelaBrilho(buf, L, A, cx, cy, 255, 240, 200, Math.round(6 * acesa), acesa); }
				PLANETAS.forEach(function (pl, n) {
					if (forma <= 0) return;
					var ang = n * 1.7 + t * 3 / Math.pow(pl[0] / 18, 1.5), sy = Math.sin(ang);
					var x = cx + Math.cos(ang) * pl[0], y = cy + sy * pl[0] * incl;
					esfera(buf, L, A, x, y, pl[2] * forma, pl[1], cx - x, cy - y);
				});
				desenhar(true);
				if (hud) {
					hud.ano.textContent = TR(c < 2.8 ? numero(Math.round(c / 2.8 * 100), 0) + ' mil anos' : c < 6 ? numero(0.1 + (c - 2.8) / 3.2 * 0.9, 1) + ' milhão de anos' : numero(Math.min(10, 1 + (c - 6) / 6 * 9), 0) + ' milhões de anos', c < 2.8 ? numero(Math.round(c / 2.8 * 100), 0) + ' thousand years' : c < 6 ? numero(0.1 + (c - 2.8) / 3.2 * 0.9, 1) + ' million years' : numero(Math.min(10, 1 + (c - 6) / 6 * 9), 0) + ' million years');
					hud.estacao.textContent = TR(c < 2.8 ? 'a nuvem encolhe e gira' : c < 6 ? 'uma estrela acende no disco' : c < 12 ? 'planetas se formando' : 'um novo sistema solar', c < 2.8 ? 'the cloud shrinks and spins' : c < 6 ? 'a star lights up in the disk' : c < 12 ? 'planets forming' : 'a new solar system');
				}
			};
		},

		// Órion vista do Brasil (de cabeça para baixo): as Três Marias, a "espada" acima delas e,
		// chegando mais perto da estrela do meio da espada, ela vira a nebulosa
		'orion-constelacao': function (L, A) {
			var ceu = ceuBonito(L, A, 606, '#2a2a6a'), CICLO = 12;
			var E = { betelgeuse: [0.7, 0.8, [255, 170, 110], 4], bellatrix: [0.32, 0.75, [220, 230, 255], 3], meissa: [0.5, 0.88, [220, 230, 255], 2],
				alnitak: [0.57, 0.48, [220, 230, 255], 3], alnilam: [0.5, 0.5, [255, 255, 255], 3], mintaka: [0.43, 0.53, [220, 230, 255], 3],
				saiph: [0.62, 0.18, [200, 220, 255], 3], rigel: [0.3, 0.22, [180, 210, 255], 4] };
			var ESPADA = [[0.515, 0.38], [0.52, 0.32], [0.525, 0.26]];
			var LINHAS = [['betelgeuse', 'alnitak'], ['bellatrix', 'mintaka'], ['alnitak', 'alnilam'], ['alnilam', 'mintaka'], ['alnitak', 'saiph'], ['mintaka', 'rigel'], ['betelgeuse', 'meissa'], ['bellatrix', 'meissa']];
			return function (buf, t, hud) {
				var c = t % CICLO;
				function base(p) { return [L / 2 + (p[0] - 0.5) * A * 1.5, A / 2 + (p[1] - 0.5) * A * 0.95]; }
				var T = base(ESPADA[1]), z01 = suave((c - 6.2) / 3), zoom = 1 + z01 * z01 * 9;
				function tela(p) { var b = base(p); return [T[0] + (b[0] - T[0]) * zoom + (L / 2 - T[0]) * z01, T[1] + (b[1] - T[1]) * zoom + (A / 2 - T[1]) * z01]; }
				ceu(buf, t);
				var linhas = suave(c / 1.2) * (1 - suave((c - 6.2) / 1));
				if (linhas > 0.02) LINHAS.forEach(function (l) {
					var a = tela(E[l[0]]), b = tela(E[l[1]]), n = Math.hypot(b[0] - a[0], b[1] - a[1]);
					for (var d = 6; d < n - 6; d += 2) luaMistura(buf, L, A, a[0] + (b[0] - a[0]) * d / n, a[1] + (b[1] - a[1]) * d / n, 130, 140, 230, 0.5 * linhas);
				});
				Object.keys(E).forEach(function (k) {
					var e = E[k], p = tela(e), marias = (k === 'alnitak' || k === 'alnilam' || k === 'mintaka') && c > 1.5 && c < 4;
					var cc = marias ? [255, 220, 120] : e[2], pul = marias ? 0.75 + 0.25 * Math.sin(t * 8) : 1;
					estrelaBrilho(buf, L, A, p[0], p[1], cc[0], cc[1], cc[2], e[3], pul);
				});
				var nebula = suave((c - 7) / 2.5);
				ESPADA.forEach(function (s, i) {
					var p = tela(s);
					if (i === 1 && nebula > 0) {
						var R = 4 + nebula * 70, arteD = document.querySelector('canvas.arte-destino'), px = null;
						try { if (arteD && arteD.width) px = arteD.getContext('2d').getImageData(0, 0, arteD.width, arteD.height); } catch (er) {}
						brilhoSoma(buf, L, A, p[0], p[1], R * 1.2, 220, 100, 160, 0.4 * nebula);
						for (var y = -R; y <= R; y++) for (var x = -R; x <= R; x++) {
							var d = Math.sqrt(x * x + y * y) / R; if (d > 1) continue;
							var a = Math.min(1, (1 - d) * 4) * nebula;
							if (px) {
								var ax = Math.min(px.width - 1, Math.floor((x + R) / (2 * R) * px.width)), ay = Math.min(px.height - 1, Math.floor((y + R) / (2 * R) * px.height)), ki = (ay * px.width + ax) * 4;
								if (px.data[ki + 3] > 0) luaMistura(buf, L, A, p[0] + x, p[1] + y, px.data[ki], px.data[ki + 1], px.data[ki + 2], a);
							} else luaMistura(buf, L, A, p[0] + x, p[1] + y, d < 0.3 ? 255 : 210, d < 0.3 ? 240 : 80, d < 0.3 ? 230 : 120, a * (1 - d));
						}
					}
					var pisca = i === 1 && c > 4 && c < 6.2 ? 0.6 + 0.4 * Math.sin(t * 8) : 1;
					if (!(i === 1 && nebula > 0.5)) estrelaBrilho(buf, L, A, p[0], p[1], i === 1 && c > 4 ? 255 : 230, i === 1 && c > 4 ? 160 : 225, i === 1 && c > 4 ? 210 : 255, 2, pisca);
				});
				if (hud) {
					hud.ano.textContent = TR(c < 1.5 ? 'a constelação de Órion' : c < 4 ? 'as Três Marias' : c < 6.2 ? 'a espada: a do meio é borrada' : 'chegando mais perto…', c < 1.5 ? 'the constellation Orion' : c < 4 ? "Orion's Belt" : c < 6.2 ? 'the sword: the middle one is blurry' : 'getting closer…');
					hud.estacao.textContent = TR(c < 7.5 ? 'vista do Brasil' : 'não é estrela: é a nebulosa!', c < 7.5 ? 'seen from Brazil' : 'not a star: it is the nebula!');
				}
			};
		},

		// Plêiades: a família de estrelas azuis vai se espalhando, puxada pela galáxia
		'pleiades-separa': function (L, A) {
			var ceu = ceuBonito(L, A, 607, '#2a3a8a'), aleat = semente(89), irmas = [], cx = L / 2, cy = A / 2, CICLO = 16;
			for (var i = 0; i < 22; i++) {
				var r = Math.sqrt(aleat()) * 36, an = aleat() * Math.PI * 2, x = cx + Math.cos(an) * r * 1.3, y = cy + Math.sin(an) * r * 0.85;
				var va = aleat() * Math.PI * 2, vel = 60 + aleat() * 90;
				irmas.push({ x: x, y: y, vx: Math.cos(va) * vel + (y - cy) * 3, vy: Math.sin(va) * vel * 0.55, tam: i < 7 ? 4 + (i < 3 ? 2 : 0) : 1 + (aleat() * 2 | 0) });
			}
			/* a névoa azul (luz das estrelas batendo na poeira): fiapos riscados, pré-pintados */
			var NEVOA = new Float32Array(L * A * 4);
			for (var py = 0; py < A; py++) for (var px = 0; px < L; px++) {
				var dx = (px - cx) / 90, dy = (py - cy) / 56, d = dx * dx + dy * dy;
				var fio = ruido2d(px * 0.03 + py * 0.06, py * 0.02 - px * 0.01) * 0.7 + ruido2d(px * 0.12 + py * 0.2, py * 0.05) * 0.3;
				var k = Math.max(0, 1 - d) * Math.max(0, fio - 0.3) * 1.6, i4 = (py * L + px) * 4;
				NEVOA[i4] = 90 + 80 * fio; NEVOA[i4 + 1] = 140 + 70 * fio; NEVOA[i4 + 2] = 255; NEVOA[i4 + 3] = Math.min(0.75, k);
			}
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, k = suave((c - 2) / 11), apaga = c > 15 ? (c - 15) : 0;
				camadaMistura(buf, L, A, NEVOA, (1 - k) * (1 - apaga));
				irmas.forEach(function (s) {
					var x = s.x + s.vx * k, y = s.y + s.vy * k, br = (1 - apaga) * (0.85 + 0.15 * Math.sin(t * 2 + s.x));
					if (br <= 0) return;
					estrelaBrilho(buf, L, A, x, y, 170, 205, 255, s.tam, br);
				});
				if (hud) {
					hud.ano.textContent = TR(k < 0.02 ? 'hoje' : 'daqui a ' + numero(Math.round(k * 250 / 10) * 10, 0) + ' milhões de anos', k < 0.02 ? 'today' : numero(Math.round(k * 250 / 10) * 10, 0) + ' million years from now');
					hud.estacao.textContent = TR(k < 0.3 ? 'irmãs juntas' : k < 0.7 ? 'se afastando' : 'cada uma no seu caminho', k < 0.3 ? 'sisters together' : k < 0.7 ? 'drifting apart' : 'each on its own path');
				}
			};
		},

		// Plêiades: quantas irmãs dá para ver no céu da cidade, no céu do campo e com binóculo
		'pleiades-ceu': function (L, A) {
			var aleat = semente(97), cx = L / 2, cy = A / 2 - 8, estrelas = [], CICLO = 12, base = ceuBonito(L, A, 608, '#1a2a5a');
			[[0, 0, 1], [-14, -6, 0.92], [10, -10, 0.88], [-6, 8, 0.86], [18, 2, 0.84], [-22, 4, 0.8], [6, 14, 0.62], [-2, -16, 0.6], [24, -8, 0.58]].forEach(function (s) { estrelas.push([cx + s[0] * 2.6, cy + s[1] * 2.2, s[2]]); });
			for (var i = 0; i < 80; i++) estrelas.push([cx + (aleat() - 0.5) * 200, cy + (aleat() - 0.5) * 110, 0.08 + aleat() * 0.45]);
			var PREDIOS = [];
			for (var x = 0; x < L; ) { var w = 14 + (aleat() * 22 | 0); PREDIOS.push([x, w, 14 + (aleat() * 30 | 0)]); x += w + 1; }
			return function (buf, t, hud) {
				var c = t % CICLO, etapa = c < 4 ? 0 : c < 8 ? 1 : 2, mistura = Math.min(1, (c % 4) / 0.8);
				var limite = [0.83, 0.57, 0.08][etapa], antes = [0.08, 0.83, 0.57][etapa], corte = antes + (limite - antes) * mistura;
				if (etapa === 0 && c < 0.8) corte = 0.08 + (0.83 - 0.08) * mistura;
				/* o céu: na cidade, a luz alaranjada esconde as estrelas fracas */
				for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var b = etapa === 0 ? Math.pow(y / A, 1.6) : etapa === 1 ? Math.pow(y / A, 3) * 0.35 : 0;
					buf[y * L + x] = etapa === 0 ? cor(26 + b * 150, 18 + b * 80, 40 + b * 30) : cor(5 + b * 60, 6 + b * 50, 22 + b * 50);
				}
				if (etapa === 2) base(buf, t);
				var vistas = 0;
				estrelas.forEach(function (s) {
					if (s[2] < corte) return;
					vistas++;
					var br = Math.min(1, 0.35 + s[2] * 0.7) * (0.85 + 0.15 * Math.sin(t * 2 + s[0]));
					if (s[2] > 0.55 || etapa === 2) estrelaBrilho(buf, L, A, s[0], s[1], 180, 210, 255, s[2] > 0.82 ? 4 : s[2] > 0.5 ? 2 : 1, br);
					else luaMistura(buf, L, A, s[0], s[1], 200, 220, 255, br);
				});
				if (etapa === 0) PREDIOS.forEach(function (p, n) {
					for (var y = A - p[2]; y < A; y++) for (var x = p[0]; x < p[0] + p[1]; x++) {
						var jan = (x - p[0]) % 4 === 2 && (y - (A - p[2])) % 5 === 2 && ruido2d(x * 0.7, y * 0.7 + n) > 0.45;
						pintar(buf, L, A, x, y, jan ? hex('#ffd36a') : cor(14, 10, 22));
					}
					if (n % 3 === 0) luaMistura(buf, L, A, p[0] + 3, A - p[2] - 3, 255, 80, 80, 0.5 + 0.5 * Math.sin(t * 3 + n));
				});
				if (etapa === 1) for (x = 0; x < L; x++) {
					var arv = 8 + Math.abs(Math.sin(x * 0.21)) * 9 + Math.abs(Math.sin(x * 0.07 + 1)) * 8 + (ruido2d(x * 0.3, 1) - 0.5) * 5;
					for (y = Math.round(A - arv); y < A; y++) pintar(buf, L, A, x, y, cor(4, 4, 10));
				}
				if (etapa === 1) [[40, 6], [210, 8]].forEach(function (v) { luaMistura(buf, L, A, v[0], A - v[1] - 12, 255, 240, 120, 0.4 + 0.6 * Math.max(0, Math.sin(t * 4 + v[0]))); });
				if (etapa === 2) for (y = 0; y < A; y++) for (x = 0; x < L; x++) {
					var d = Math.min(Math.hypot(x - cx + 44, y - cy - 8), Math.hypot(x - cx - 44, y - cy - 8));
					if (d > 78) buf[y * L + x] = cor(0, 0, 0);
					else if (d > 70) { var v2 = buf[y * L + x], f = 1 - (d - 70) / 8; buf[y * L + x] = cor((v2 & 255) * f, ((v2 >>> 8) & 255) * f, ((v2 >>> 16) & 255) * f); }
				}
				if (hud) {
					hud.ano.textContent = TR(['no céu da cidade', 'no céu do campo', 'com binóculo'][etapa], ['in a city sky', 'in a country sky', 'with binoculars'][etapa]);
					hud.estacao.textContent = TR('você vê ' + vistas + ' estrelas', 'you see ' + vistas + ' stars');
				}
			};
		},

		// Nebulosa da Hélice: a estrela incha (gigante vermelha), solta as camadas de fora num
		// anel colorido que vai se abrindo e, no meio, sobra uma anã branca acendendo o gás
		'helice-morte': function (L, A) {
			var ceu = ceuBonito(L, A, 609, '#2a3a5a'), cx = L / 2, cy = A / 2 + 2, CICLO = 17;
			var GIG = rampaCores(['#fff0c0', '#ffb060', '#e0602a', '#a02a14', '#4a0e06'], 14);
			return function (buf, t, hud) {
				ceu(buf, t);
				var c = t % CICLO, incha = suave((c - 2.5) / 3.2), solta = suave((c - 6) / 1.6), abre = suave((c - 6.4) / 7.5), apaga = c > 15.4 ? suave((c - 15.4) / 1.6) : 0, vivo = 1 - apaga;
				if (c > 6) {
					var Ra = 22 + abre * 56, esp = 6 + abre * 18;
					for (var y = Math.max(0, Math.floor(cy - Ra * 1.5)); y < Math.min(A, cy + Ra * 1.5); y++) for (var x = Math.max(0, Math.floor(cx - Ra * 1.5)); x < Math.min(L, cx + Ra * 1.5); x++) {
						var dx = x - cx, dy = (y - cy) / 0.84, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
						var Rn = Ra * (1 + (ruido2d(Math.cos(a) * 3 + 5, Math.sin(a) * 3 + t * 0.05) - 0.5) * 0.18), dentro = Rn - esp;
						if (d < dentro) {
							var g = Math.pow(1 - d / dentro, 0.7), n = ruido2d(x * 0.08, y * 0.08 + t * 0.1);
							luaMistura(buf, L, A, x, y, 110 + 140 * g, 220 + 35 * g, 215 + 30 * g, (0.25 + 0.45 * g + n * 0.25) * vivo * (0.5 + abre * 0.5));
						} else if (d < Rn + esp * 0.6) {
							var f = (d - dentro) / (esp * 1.6), grumo = ruido2d(Math.cos(a) * 7 + d * 0.12, Math.sin(a) * 7 + t * 0.08);
							var ff = Math.max(0, Math.min(1, f + (grumo - 0.5) * 0.4));
							luaMistura(buf, L, A, x, y, 255, 220 - 180 * ff, 130 - 90 * ff, (0.9 - ff * 0.5) * vivo * (0.6 + grumo * 0.5));
							if (f < 0.3 && Math.sin(a * 60 + grumo * 4) > 0.9 && vivo > 0.4) luaMistura(buf, L, A, x, y, 255, 245, 225, 0.8);
						} else if (d < Rn + esp * 0.6 + 16) {
							var h = 1 - (d - Rn - esp * 0.6) / 16;
							luaMistura(buf, L, A, x, y, 160, 30, 60, h * h * 0.4 * vivo * abre);
						}
					}
				}
				if (c > 5.6 && c < 9) {
					var sopro = (c - 5.6) / 3.4;
					for (var q = 0; q < 200; q++) {
						var aq = q * 2.39996, rq = 30 + sopro * 50 * (0.7 + ruido2d(q * 0.7, 3) * 0.6);
						luaMistura(buf, L, A, cx + Math.cos(aq) * rq, cy + Math.sin(aq) * rq * 0.84, 255, 140 - sopro * 60, 70, 0.8 * (1 - sopro * 0.6));
					}
				}
				var R = c < 6 ? 9 + incha * 34 : 43 * (1 - solta) + 2.5 * solta;
				if (c < 6.5 || solta < 0.95) {
					brilhoSoma(buf, L, A, cx, cy, R * 1.8, 255, 120 + 100 * (1 - incha), 50, 0.5);
					var pal = incha < 0.3 ? rampaCores(['#fffbe8', '#ffe8a0', '#ffc050', '#e08a30'], 12) : GIG;
					esfera(buf, L, A, cx, cy, R, pal, -0.6, -0.5, function (x, y) { return (ruido2d(x * 5 + t * 0.4, y * 5 - t * 0.3) - 0.5) * 3; });
				}
				if (c > 7) { brilhoSoma(buf, L, A, cx, cy, 22, 170, 240, 255, 0.8); estrelaBrilho(buf, L, A, cx, cy, 210, 245, 255, 6, vivo * 0.6 + 0.4); }
				if (hud) {
					hud.ano.textContent = TR(c < 2.5 ? 'estrela como o Sol' : c < 6 ? 'gigante vermelha' : c < 8 ? 'solta as camadas' : 'nebulosa planetária', c < 2.5 ? 'a star like the Sun' : c < 6 ? 'red giant' : c < 8 ? 'sheds its layers' : 'planetary nebula');
					hud.estacao.textContent = TR(c < 2.5 ? 'bilhões de anos' : c < 6 ? 'o combustível acaba' : c < 15.4 ? 'há ' + numero(Math.max(1, Math.round((c - 6) / 9.4 * 10)), 0) + ' mil anos' : 'o gás se espalha', c < 2.5 ? 'billions of years' : c < 6 ? 'the fuel runs out' : c < 15.4 ? numero(Math.max(1, Math.round((c - 6) / 9.4 * 10)), 0) + ' thousand years ago' : 'the gas spreads out');
				}
			};
		},

		// Hélice de perto: a borda de dentro do anel, com os nós cometários. O vento e a luz da
		// anã branca (à esquerda) sopram para fora e esticam as caudas deles
		'helice-nos': function (L, A) {
			var aleat = semente(103), nos = [], vento = [];
			function borda(y) { return 140 + Math.sin(y * 0.08 + 1) * 14 + Math.sin(y * 0.2) * 6; }
			for (var i = 0; i < 44; i++) { var ny = 6 + aleat() * (A - 12); nos.push([borda(ny) - 4 + aleat() * 40, ny, 1 + aleat() * 1.5, aleat() * 6]); }
			for (i = 0; i < 80; i++) vento.push([aleat(), aleat() * A, 0.5 + aleat()]);
			var FUNDO = new Uint32Array(L * A);
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
				var b = borda(y), n = ruido2d(x * 0.04, y * 0.06) * 0.6 + ruido2d(x * 0.12, y * 0.15) * 0.4, r, g, bb;
				if (x < b) { var f0 = x / b; r = 30 + 60 * f0 + n * 40; g = 120 + 80 * f0 + n * 50; bb = 130 + 50 * f0 + n * 30; }
				else { var f = Math.min(1, (x - b) / (L - b)); r = 255 - f * 90; g = 170 - f * 130 + n * 40; bb = 100 - f * 40 + n * 20; var k = 0.75 + n * 0.4; r *= k; g *= k; bb *= k; }
				FUNDO[y * L + x] = cor(Math.min(255, r), Math.min(255, g), Math.min(255, bb));
			}
			return function (buf, t) {
				buf.set(FUNDO);
				brilhoSoma(buf, L, A, -10, A / 2, 110, 160, 240, 255, 0.45);
				vento.forEach(function (v) { var x = ((v[0] + t * 0.1 * v[2]) % 1) * L; for (var w = 0; w < 5; w++) luaMistura(buf, L, A, x - w, v[1], 210, 255, 250, 0.5 * (1 - w / 5)); });
				nos.forEach(function (n) {
					var cauda = 16 + n[2] * 12 + Math.sin(t * 2 + n[3]) * 3;
					for (var q = 1; q < cauda; q++) {
						var yq = n[1] + Math.sin(q * 0.2 + t + n[3]) * 0.8, f = q / cauda;
						for (var w2 = -n[2]; w2 <= n[2]; w2++) luaMistura(buf, L, A, n[0] + q, yq + w2 * (1 - f * 0.7), 60, 16, 30, 0.75 * (1 - f) * (1 - Math.abs(w2) / (n[2] + 1)));
					}
					brilhoSoma(buf, L, A, n[0] - 1, n[1], 4 + n[2], 255, 220, 170, 0.7);
					luaDisco(buf, L, A, n[0] - 1, n[1], 1, hex('#fff6e8'));
				});
				estrelaBrilho(buf, L, A, 8, A / 2, 210, 245, 255, 8);
			};
		},

		// Estrela de Tabby: uma nuvem de poeira passa na frente da estrela, e o gráfico mostra a
		// luz azul caindo mais que a vermelha (como a poeira faz; um painel sólido não faria)
		'tabby-cores': function (L, A) {
			var ceu = ceuBonito(L, A, 611, '#4a3a2a'), aleat = semente(127), graos = [], sx = 78, sy = 88, R = 40, CICLO = 9;
			for (var i = 0; i < 900; i++) { var gr = Math.sqrt(aleat()), ga = aleat() * Math.PI * 2; graos.push([Math.cos(ga) * gr * 46, Math.sin(ga) * gr * 32, aleat()]); }
			var g0 = 172, g1 = 306, gt = 34, gb = 140, PAL = rampaCores(['#fffbe8', '#fff0b0', '#ffd070', '#f0a040', '#b06020'], 16);
			function cobre(tt) { var xc = -50 + ((tt % CICLO) / CICLO) * 260, d = Math.abs(xc - sx) / 58; return d < 1 ? Math.pow(1 - d * d, 1.5) * (0.8 + 0.2 * Math.sin(tt * 2.3)) : 0; }
			function yDo(b) { return gt + 6 + (1 - b) / 0.25 * (gb - gt - 12); }
			return function (buf, t, hud) {
				ceu(buf, t);
				var k = cobre(t);
				brilhoSoma(buf, L, A, sx, sy, R * 2.2, 255, 190, 100, 0.6 * (1 - k * 0.3));
				esfera(buf, L, A, sx, sy, R, PAL, -0.4, -0.4, function (x, y) { return (ruido2d(x * 6 + t * 0.3, y * 6) - 0.5) * 1.5; });
				escurecer(buf, L, A, sx, sy, R, function () { return 1 - k * 0.2; });
				var xc = -50 + ((t % CICLO) / CICLO) * 260;
				graos.forEach(function (g) {
					var gx = xc + g[0], gy = sy + g[1] + Math.sin(g[0] * 0.2 + t) * 3;
					luaMistura(buf, L, A, gx, gy, 90 + g[2] * 40, 60 + g[2] * 20, 40, 0.35 + g[2] * 0.3);
				});
				painel(buf, L, A, g0 - 6, gt, g1 + 4, gb, [yDo(1), yDo(0.75)]);
				for (var gx = g0; gx <= g1; gx++) {
					var kk = cobre(t - (g1 - gx) * 0.04);
					pontoAceso(buf, L, A, gx, yDo(1 - kk * 0.13), 255, 110, 90);
					pontoAceso(buf, L, A, gx, yDo(1 - kk * 0.22), 110, 175, 255);
				}
				brilhoSoma(buf, L, A, g1, yDo(1 - k * 0.13), 6, 255, 110, 90, 0.8);
				brilhoSoma(buf, L, A, g1, yDo(1 - k * 0.22), 6, 110, 175, 255, 0.8);
				if (hud) {
					hud.ano.textContent = TR('azul: ' + Math.round((1 - k * 0.22) * 100) + '%', 'blue: ' + Math.round((1 - k * 0.22) * 100) + '%');
					hud.estacao.textContent = TR('vermelho: ' + Math.round((1 - k * 0.13) * 100) + '%', 'red: ' + Math.round((1 - k * 0.13) * 100) + '%');
				}
			};
		},

		// Tabby x uma estrela comum: em cima, um planeta passando na frente faz o brilho cair um
		// tiquinho, sempre igual; embaixo, a Estrela de Tabby cai muito, sem padrão nenhum
		'tabby-quedas': function (L, A) {
			var ceu = ceuBonito(L, A, 612, '#3a2a4a'), g0 = 106, g1 = 306;
			var AMA = rampaCores(['#fffbe0', '#ffe8a0', '#ffc860', '#d08a30'], 12), LAR = rampaCores(['#fff0d0', '#ffc880', '#f09a40', '#b05a20'], 12);
			function planeta(tt) { var f = (tt % 4) / 4; return Math.abs(f - 0.5) < 0.06 ? 0.01 : 0; }
			function tabby(tt) {
				var q = 0;
				[[1.2, 0.08, 0.5], [3.1, 0.22, 0.9], [5.3, 0.12, 0.6], [6.6, 0.05, 0.3], [8.4, 0.18, 1.2]].forEach(function (d) { var x = (tt % 10) - d[0]; q += d[1] * Math.exp(-x * x / (d[2] * d[2] * 0.3)); });
				return Math.min(0.24, q);
			}
			function grafico(buf, topo, base, fn, t, rgb) {
				painel(buf, L, A, g0 - 6, topo - 6, g1 + 4, base + 6, [topo, base]);
				for (var x = g0; x <= g1; x++) pontoAceso(buf, L, A, x, topo + fn(t - (g1 - x) * 0.05) / 0.25 * (base - topo), rgb[0], rgb[1], rgb[2]);
				brilhoSoma(buf, L, A, g1, topo + fn(t) / 0.25 * (base - topo), 6, rgb[0], rgb[1], rgb[2], 0.8);
			}
			return function (buf, t, hud) {
				ceu(buf, t);
				var qp = planeta(t), qt = tabby(t);
				brilhoSoma(buf, L, A, 50, 46, 44, 255, 220, 140, 0.5);
				esfera(buf, L, A, 50, 46, 24, AMA, -0.4, -0.4);
				var f = (t % 4) / 4;
				if (Math.abs(f - 0.5) < 0.16) { var px = 50 + (f - 0.5) * 200; luaDisco(buf, L, A, px, 46, 3, hex('#0c0a14')); }
				brilhoSoma(buf, L, A, 50, 128, 44, 255, 190, 110, 0.5 * (1 - qt * 2));
				esfera(buf, L, A, 50, 128, 24, LAR, -0.4, -0.4);
				escurecer(buf, L, A, 50, 128, 24, function () { return 1 - qt * 0.9; });
				for (var g = 0; g < 160; g++) { var gx = 50 + (((t * 0.11 + g * 0.37) % 1.4) - 0.7) * 90, gy = 128 + Math.sin(g * 2.3) * 18 + Math.cos(g * 1.7) * 6; if (qt > 0.03) luaMistura(buf, L, A, gx, gy, 110, 76, 56, Math.min(0.7, qt * 4)); }
				grafico(buf, 30, 62, planeta, t, [130, 220, 255]);
				grafico(buf, 112, 150, tabby, t, [255, 180, 80]);
				if (hud) {
					hud.ano.textContent = TR('com planeta: ' + (qp > 0 ? '99%' : '100%'), 'with planet: ' + (qp > 0 ? '99%' : '100%'));
					hud.estacao.textContent = 'Tabby: ' + Math.round((1 - qt) * 100) + '%';
				}
			};
		},

		// Omega Centauri na contramão: a Via Láctea vista de cima, girando num sentido, e o
		// aglomerado dando a volta no sentido contrário, numa órbita inclinada, por fora do disco
		'omega-contramao': function (L, A) {
			var ceu = ceuBonito(L, A, 613, '#2a2a5a'), aleat = semente(137), disco = [], cx = L / 2, cy = A / 2, achata = 0.5;
			for (var i = 0; i < 2200; i++) {
				var r = 6 + Math.pow(aleat(), 0.8) * 96, braco = aleat() < 0.5 ? 0 : Math.PI;
				disco.push([r, braco + Math.log(r / 6) * 1.6 + (aleat() - 0.5) * (1.3 + r / 70), aleat()]);
			}
			return function (buf, t) {
				ceu(buf, t);
				var ao = -t * 0.5, ox = Math.cos(ao) * 134, oz = Math.sin(ao), oy = oz * 46 - Math.cos(ao) * 16, atras = oz < 0;
				function omega() {
					for (var j = 1; j <= 60; j++) { var aj = ao + j * 0.02; luaMistura(buf, L, A, cx + Math.cos(aj) * 134, cy + Math.sin(aj) * 46 - Math.cos(aj) * 16, 255, 200, 120, 0.7 * (1 - j / 60)); }
					var x0 = cx + ox, y0 = cy + oy;
					brilhoSoma(buf, L, A, x0, y0, 12, 255, 210, 130, 0.8);
					for (var q = 0; q < 50; q++) { var a = q * 2.39996, rr = Math.sqrt(q / 50) * 6; luaMistura(buf, L, A, x0 + Math.cos(a) * rr, y0 + Math.sin(a) * rr, 255, 235, 190, 0.9); }
				}
				if (atras) omega();
				brilhoSoma(buf, L, A, cx, cy, 110, 90, 100, 200, 0.25);
				disco.forEach(function (d) {
					var a = d[1] + t * 0.8 * (14 / (d[0] + 8)), x = cx + Math.cos(a) * d[0], y = cy + Math.sin(a) * d[0] * achata;
					var q = Math.max(0, 1 - d[0] / 34);
					luaMistura(buf, L, A, x, y, 150 + 100 * q + 40 * d[2], 160 + 60 * q + 50 * d[2], 240 - 90 * q, 0.3 + 0.5 * d[2] * d[2]);
				});
				brilhoSoma(buf, L, A, cx, cy, 30, 255, 220, 150, 0.9);
				brilhoSoma(buf, L, A, cx, cy, 10, 255, 250, 220, 1);
				/* setinhas: a galáxia gira para um lado; Omega, para o outro */
				setaArco(buf, L, A, cx, cy, 108, 56, Math.PI * 0.35, Math.PI * 0.65, 140, 170, 255);
				if (!atras) omega();
			};
		},

		// Omega Centauri: uma galáxia pequena chega perto da Via Láctea, perde as estrelas de fora
		// pelo caminho e sobra só o miolo, que continua dando voltas: Omega Centauri
		'omega-engolida': function (L, A) {
			var ceu = ceuBonito(L, A, 614, '#2a2a5a'), aleat = semente(113), CICLO = 20, FUSAO = 13, gx = L / 2, gy = A / 2 + 2, disco = [], ana = [];
			for (var i = 0; i < 1400; i++) { var r = 5 + Math.pow(aleat(), 0.8) * 56, br = aleat() < 0.5 ? 0 : Math.PI; disco.push([r, br + Math.log(r / 5) * 1.6 + (aleat() - 0.5) * (1.3 + r / 50), aleat()]); }
			for (i = 0; i < 420; i++) { var rr = Math.pow(aleat(), 1.3) * 24, aa = aleat() * Math.PI * 2; ana.push([Math.cos(aa) * rr, Math.sin(aa) * rr * 0.75, rr / 24, aleat() < 0.5 ? -1 : 1]); }
			function caminho(k) { var ang = 2.6 + k * Math.PI * 3.2, raio = 132 - 76 * Math.min(1, k * 1.5); return [gx + Math.cos(ang) * raio, gy + Math.sin(ang) * raio * 0.45]; }
			return function (buf, t, hud) {
				var c = t % CICLO, k = c / FUSAO;
				ceu(buf, t);
				brilhoSoma(buf, L, A, gx, gy, 70, 90, 100, 200, 0.3);
				disco.forEach(function (d) {
					var a = d[1] + t * 0.5 * (10 / (d[0] + 5)), q = Math.max(0, 1 - d[0] / 22);
					luaMistura(buf, L, A, gx + Math.cos(a) * d[0], gy + Math.sin(a) * d[0] * 0.5, 150 + 100 * q + 40 * d[2], 160 + 60 * q + 40 * d[2], 240 - 90 * q, 0.3 + 0.5 * d[2] * d[2]);
				});
				brilhoSoma(buf, L, A, gx, gy, 20, 255, 220, 150, 0.9);
				var cc = caminho(k);
				ana.forEach(function (s) {
					var solta = 0.2 + 0.55 * (1 - s[2]), px, py, br = 1;
					if (k < solta || s[2] < 0.3) { var aperta = 1 - Math.min(0.5, k * 0.5); px = cc[0] + s[0] * aperta; py = cc[1] + s[1] * aperta; }
					else { var p = caminho(Math.max(0, k - (k - solta) * 1.1 * (s[3] > 0 ? 1 : -0.6))); px = p[0] + s[0] * 0.7; py = p[1] + s[1] * 0.7; br = Math.max(k > 1 ? 0.45 : 0.6, 1 - (k - solta) * 0.8); }
					if (k > 1 && s[2] >= 0.3) {
						var mist = suave((k - 1) / 0.4), fi = s[0] * 0.7 + s[1] + t * 0.12, ro = 42 + s[2] * 56;
						px += (gx + Math.cos(fi) * ro - px) * mist; py += (gy + Math.sin(fi) * ro * 0.5 - py) * mist;
					}
					luaMistura(buf, L, A, px, py, 255, 220, 150, 0.85 * br);
				});
				brilhoSoma(buf, L, A, cc[0], cc[1], 12, 255, 210, 130, 0.8);
				luaDisco(buf, L, A, cc[0], cc[1], 2, hex('#fff1c8'));
				if (hud) {
					var bi = 10 - Math.min(1, k) * 10;
					hud.ano.textContent = TR(bi < 0.4 ? 'hoje' : 'há ' + numero(bi, bi < 2 ? 1 : 0) + (bi < 2 ? ' bilhão' : ' bilhões') + ' de anos', bi < 0.4 ? 'today' : numero(bi, bi < 2 ? 1 : 0) + ' billion years ago');
					hud.estacao.textContent = TR(k < 0.2 ? 'uma galáxia pequena chega perto' : k < 0.75 ? 'a Via Láctea arranca as estrelas de fora' : k < 1 ? 'sobra só o miolo' : 'Omega Centauri, dando voltas na Via Láctea', k < 0.2 ? 'a small galaxy comes close' : k < 0.75 ? 'the Milky Way strips its outer stars' : k < 1 ? 'only the core is left' : 'Omega Centauri, orbiting the Milky Way');
				}
			};
		},

		// O grande apagão de Betelgeuse (2019-2020): a estrela solta uma bolha de gás embaixo, a
		// bolha esfria e vira poeira na frente dela, o brilho cai pela metade e depois a poeira se espalha
		'betelgeuse-apagao': function (L, A) {
			var ceu = ceuBonito(L, A, 615, '#5a2a2a'), cx = 84, cy = A / 2 + 4, R = 58, CICLO = 14;
			var MESES = TR(['outubro de 2019', 'novembro de 2019', 'dezembro de 2019', 'janeiro de 2020', 'fevereiro de 2020', 'março de 2020', 'abril de 2020'], ['October 2019', 'November 2019', 'December 2019', 'January 2020', 'February 2020', 'March 2020', 'April 2020']);
			var PAL = rampaCores(['#fff0c0', '#ffb860', '#f07a32', '#c8461e', '#8a2414', '#3a0a04'], 18);
			function brilho(k) { var x = (k - 0.55) / 0.22; return 1 - 0.6 * Math.exp(-x * x); }
			var g0 = 186, g1 = 306, gt = 30, gb = 140;
			return function (buf, t, hud) {
				var c = t % CICLO, k = Math.min(1, c / 12), b = brilho(k);
				ceu(buf, t);
				brilhoSoma(buf, L, A, cx, cy, R * 1.7, 255, 110, 40, 0.55 * b);
				/* a estrela: células enormes de gás fervendo (escurece junto com o brilho) */
				esfera(buf, L, A, cx, cy, R, PAL, -0.3, -0.3, function (x, y) { return (ruido2d(x * 2.6 + t * 0.12, y * 2.6 - t * 0.08) - 0.5) * 3.5 + (1 - b) * 3; });
				var sai = suave(k / 0.3), esfria = suave((k - 0.25) / 0.25), some = suave((k - 0.62) / 0.35);
				var bx = cx - 14 - sai * 10 - some * 26, by = cy + 20 + sai * 10 + some * 20, br = 16 + sai * 20 + some * 16;
				if (sai > 0.05) for (var y = Math.floor(by - br); y <= by + br; y++) for (var x = Math.floor(bx - br); x <= bx + br; x++) {
					var d = Math.hypot((x - bx) / br, (y - by) / (br * 0.75)); if (d > 1) continue;
					var n = ruido2d(x * 0.12, y * 0.12 + t * 0.2), a = Math.max(0, (1 - d) * 1.6 * (n - 0.25 - some * 0.3)) * sai;
					if (esfria < 0.5) luaMistura(buf, L, A, x, y, 255, 160 + n * 60, 80, Math.min(0.85, a));
					else luaMistura(buf, L, A, x, y, 40, 20, 14, Math.min(0.9, a * 1.3));
				}
				painel(buf, L, A, g0 - 6, gt, g1 + 4, gb, [gt + 8, gb - 8]);
				var ate = g0 + Math.round(k * (g1 - g0));
				function gy(f) { return gt + 8 + (1 - brilho(f)) / 0.7 * (gb - gt - 16); }
				for (var gx = g0; gx <= g1; gx++) luaMistura(buf, L, A, gx, gy((gx - g0) / (g1 - g0)), 255, 150, 90, gx <= ate ? 0 : 0.15);
				for (gx = g0; gx <= ate; gx++) pontoAceso(buf, L, A, gx, gy((gx - g0) / (g1 - g0)), 255, 150, 90);
				brilhoSoma(buf, L, A, ate, gy(k), 7, 255, 200, 150, 0.9);
				if (hud) {
					hud.ano.textContent = MESES[Math.min(6, Math.floor(k * 6.99))];
					hud.estacao.textContent = TR('brilho: ' + Math.round(b * 100) + '%' + (k > 0.25 && k < 0.75 ? ' (poeira na frente)' : ''), 'brightness: ' + Math.round(b * 100) + '%' + (k > 0.25 && k < 0.75 ? ' (dust in front)' : ''));
				}
			};
		},

		// O dia em que Betelgeuse explodir, visto do Brasil: Órion de cabeça para baixo no céu,
		// a estrela vermelha vira um ponto brilhantíssimo (dá para ver até de dia), vai apagando
		// ao longo dos meses e, no fim, Órion fica sem o ombro
		'betelgeuse-supernova': function (L, A) {
			var ceu0 = ceuBonito(L, A, 616, '#1a2a5a'), CICLO = 16, aleat = semente(161);
			var E = [[160, 44, [180, 210, 255], 4], [208, 50, [210, 225, 255], 3], [174, 82, [220, 230, 255], 2], [184, 79, [255, 255, 255], 2], [194, 76, [220, 230, 255], 2], [168, 116, [220, 230, 255], 3], [204, 104, [255, 170, 110], 4]];
			var LINHAS = [[0, 4], [1, 2], [2, 3], [3, 4], [2, 5], [4, 6]];
			var ARV = []; for (var x = 0; x < L; x++) ARV.push(16 + Math.sin(x * 0.04) * 6 + Math.abs(Math.sin(x * 0.29)) * (x % 37 < 12 ? 12 : 0) + (ruido2d(x * 0.4, 2) - 0.5) * 4);
			return function (buf, t, hud) {
				var c = t % CICLO, explode = c > 3, k = explode ? (c - 3) / 11 : 0, forca = explode ? Math.max(0, 1 - Math.pow(k, 0.7)) : 0, ceu = forca * 0.55;
				ceu0(buf, t);
				if (ceu > 0) for (var y = 0; y < A; y++) for (var x2 = 0; x2 < L; x2++) {
					var alt = y / A;
					luaMistura(buf, L, A, x2, y, 60 - alt * 20, 110 - alt * 20, 190, Math.min(0.9, ceu * 1.6));
				}
				var bx = E[6][0], by = E[6][1];
				LINHAS.forEach(function (l) {
					if (l[1] === 6 && c > 14) return;
					var a = E[l[0]], b = E[l[1]], n = Math.hypot(b[0] - a[0], b[1] - a[1]);
					for (var d = 6; d < n - 6; d += 2) luaMistura(buf, L, A, a[0] + (b[0] - a[0]) * d / n, a[1] + (b[1] - a[1]) * d / n, 130, 140, 230, 0.45 * (1 - ceu));
				});
				E.forEach(function (e, i) { if (i < 6) estrelaBrilho(buf, L, A, e[0], e[1], e[2][0], e[2][1], e[2][2], e[3], 1 - ceu * 1.2); });
				if (!explode) estrelaBrilho(buf, L, A, bx, by, 255, 170, 110, 4, 1);
				else if (c < 14) {
					var tam = 4 + forca * 30 + (c < 3.4 ? (3.4 - c) * 80 : 0);
					brilhoSoma(buf, L, A, bx, by, tam * 2, 160, 200, 255, 0.6 * (0.3 + forca));
					brilhoSoma(buf, L, A, bx, by, tam * 0.5, 255, 255, 255, 1.2);
					for (var r = 1; r < tam * 1.6; r++) { var a2 = (1 - r / (tam * 1.6)) * (0.4 + forca * 0.6); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (s) { luaMistura(buf, L, A, bx + s[0] * r, by + s[1] * r, 220, 240, 255, a2); }); }
				}
				for (x = 0; x < L; x++) for (var y2 = Math.round(A - ARV[x]); y2 < A; y2++) pintar(buf, L, A, x, y2, ceu > 0.25 ? cor(20 + ceu * 30, 30 + ceu * 30, 50 + ceu * 40) : cor(4, 4, 10));
				if (hud) {
					var semanas = Math.round(k * 52);
					hud.ano.textContent = TR(!explode ? 'uma noite comum' : c < 4 ? 'o dia da explosão!' : c < 14 ? semanas + ' semanas depois' : 'um ano depois', !explode ? 'an ordinary night' : c < 4 ? 'the day of the explosion!' : c < 14 ? semanas + ' weeks later' : 'a year later');
					hud.estacao.textContent = TR(!explode ? 'Betelgeuse vermelhinha' : forca > 0.5 ? 'quase tão forte quanto a Lua' : forca > 0.15 ? 'ainda dá para ver de dia' : c < 14 ? 'apagando devagar' : 'Órion sem o ombro', !explode ? 'little red Betelgeuse' : forca > 0.5 ? 'almost as bright as the Moon' : forca > 0.15 ? 'still visible by day' : c < 14 ? 'slowly fading' : 'Orion without its shoulder');
				}
			};
		},

		// Eta Carinae: as duas estrelas numa órbita bem esticada (uma volta a cada 5 anos e meio).
		// Os ventos das duas se chocam numa "frente" de gás que brilha em raios X, mais forte quando passam perto
		'eta-par': function (L, A) {
			var ceu = ceuBonito(L, A, 617, '#3a2a5a'), CICLO = 14, e = 0.78, a = 92, b = a * Math.sqrt(1 - e * e), Ax = 72, Ay = A / 2 + 4;
			var GRANDE = rampaCores(['#ffffff', '#e8f4ff', '#bcd8ff', '#7f9ce8'], 12), PEQ = rampaCores(['#ffffff', '#d8ecff', '#8fb0f0'], 8);
			function kepler(M) { var E = Math.PI; for (var k = 0; k < 14; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); return E; }
			function posicao(k) { var E = kepler((((k + 0.5) % 1) + 1) % 1 * Math.PI * 2); return [Ax - a * (Math.cos(E) - e), Ay + b * Math.sin(E)]; }
			return function (buf, t, hud) {
				var k = (t % CICLO) / CICLO, p = posicao(k), Bx = p[0], By = p[1];
				var dist = Math.hypot(Bx - Ax, By - Ay), perto = Math.max(0, Math.min(1, (70 - dist) / 52));
				ceu(buf, t);
				for (var q = 0; q < 1; q += 0.004) { var o = posicao(q); luaMistura(buf, L, A, o[0], o[1], 140, 140, 230, 0.35); }
				for (var r = 1; r <= 60; r++) { var o2 = posicao(k - r * 0.002); luaMistura(buf, L, A, o2[0], o2[1], 130, 190, 255, 0.8 * (1 - r / 60)); }
				[[Ax, Ay, 50, [110, 130, 230]], [Bx, By, 26, [100, 170, 230]]].forEach(function (s, n) {
					for (var w = 0; w < 4; w++) {
						var raio = ((t * 0.5 + w / 4 + n * 0.17) % 1) * s[2] + 10, f = 1 - (raio - 10) / s[2];
						for (var ang = 0; ang < Math.PI * 2; ang += 0.04) luaMistura(buf, L, A, s[0] + Math.cos(ang) * raio, s[1] + Math.sin(ang) * raio, s[3][0], s[3][1], s[3][2], 0.4 * f);
					}
				});
				var dir = Math.atan2(By - Ay, Bx - Ax), mx = Ax + (Bx - Ax) * 0.68, my = Ay + (By - Ay) * 0.68, forte = 0.35 + perto * 0.65;
				for (var s2 = -1; s2 <= 1; s2 += 0.02) {
					var curva = s2 * s2 * 9, px = mx + Math.cos(dir + Math.PI / 2) * s2 * 24 + Math.cos(dir) * curva, py = my + Math.sin(dir + Math.PI / 2) * s2 * 24 + Math.sin(dir) * curva;
					var f2 = forte * (1 - Math.abs(s2) * 0.6);
					luaMistura(buf, L, A, px, py, 255, 200 + 55 * f2, 120 + 130 * f2, Math.min(1, f2 * 1.3));
					if (perto > 0.4 && Math.sin(t * 20 + s2 * 19) > 0.7) luaMistura(buf, L, A, px + Math.cos(dir) * 3, py + Math.sin(dir) * 3, 255, 250, 210, 0.9);
				}
				brilhoSoma(buf, L, A, mx, my, 18 + perto * 20, 255, 220, 140, 0.3 + perto * 0.6);
				brilhoSoma(buf, L, A, Ax, Ay, 30, 160, 200, 255, 0.7);
				esfera(buf, L, A, Ax, Ay, 12, GRANDE, -0.5, -0.5);
				brilhoSoma(buf, L, A, Bx, By, 16, 160, 210, 255, 0.6);
				esfera(buf, L, A, Bx, By, 6, PEQ, -0.5, -0.5);
				termometro(buf, L, A, 296, 26, 140, 0.12 + perto * 0.88, [[0.5, false], [1, true]]);
				if (hud) {
					hud.ano.textContent = TR('ano ' + numero(k * 5.5, 1) + ' de 5,5', 'year ' + numero(k * 5.5, 1) + ' of 5.5');
					hud.estacao.textContent = TR(perto > 0.5 ? 'pertinho: o choque brilha muito!' : perto > 0.1 ? 'se aproximando…' : 'longe: o choque é fraco', perto > 0.5 ? 'up close: the shock glows bright!' : perto > 0.1 ? 'getting closer…' : 'far apart: the shock is faint');
				}
			};
		},

		// A Grande Erupção, de 1837 até hoje: a estrela brilha demais (em 1843, só Sírius brilhava
		// mais), solta gás que forma as duas bolhas do Homúnculo, some atrás da própria poeira e,
		// do século 20 para cá, volta a aparecer no meio da nuvem
		'eta-erupcao': function (L, A) {
			var ceu = ceuBonito(L, A, 618, '#5a2a3a'), CICLO = 16, cx = L / 2, cy = A / 2 + 4;
			function ano(c) { return c < 2 ? 1837 + c * 3 : c < 7 ? 1843 + (c - 2) * 7.4 : c < 12 ? 1880 + (c - 7) * 29 : 2025; }
			return function (buf, t, hud) {
				var c = t % CICLO, an = ano(c);
				var cresce = suave((an - 1843) / 70), poeira = an > 1856 && an < 1945 ? Math.min(1, (an - 1856) / 12, (1945 - an) / 25) : 0;
				var brilho = an < 1843 ? 0.5 + (an - 1837) / 6 * 1.1 : an < 1856 ? 1.6 - (an - 1843) / 13 * 0.9 : an < 1945 ? 0.7 - poeira * 0.5 : 0.7 + Math.min(1, (an - 1945) / 80) * 0.5;
				ceu(buf, t);
				if (cresce > 0.01) for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
					var u = x - cx, v = y - cy, s = u * 0.75 + v * 0.66, p = -u * 0.66 + v * 0.75, lado = s >= 0 ? 1 : -1;
					var ds = s - lado * 42 * cresce, rl = Math.sqrt(ds * ds / Math.pow(40 * cresce + 1, 2) + p * p / Math.pow(32 * cresce + 1, 2));
					var bord = 1 + (ruido2d(Math.atan2(p, ds) * 2 + lado * 3, 1) - 0.5) * 0.25;
					if (rl > bord) continue;
					var mu = Math.sqrt(Math.max(0, 1 - (rl / bord) * (rl / bord))), tex = ruido2d(x * 0.22 + lado * 7, y * 0.22) * 0.6 + ruido2d(x * 0.07, y * 0.07 + lado) * 0.4;
					var luz = 0.4 + 0.5 * Math.pow(1 - mu, 2) + (tex - 0.5) * 0.5 + (lado > 0 ? 0.08 : -0.05);
					if (poeira > 0.3) luaMistura(buf, L, A, x, y, 90 * luz, 50 * luz, 36 * luz, 0.85);
					else luaMistura(buf, L, A, x, y, 255 * Math.min(1, luz + 0.2), 190 * luz, 160 * luz, 0.9);
				}
				var tam = 3 + brilho * 12;
				brilhoSoma(buf, L, A, cx, cy, tam * 3, 255, 200, 150, 0.4 * brilho);
				brilhoSoma(buf, L, A, cx, cy, tam, 255, 250, 230, 0.9 * brilho);
				for (var r = 1; r < tam * 1.8; r++) { var a = (1 - r / (tam * 1.8)) * Math.min(1, brilho * 0.8); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { luaMistura(buf, L, A, cx + d[0] * r, cy + d[1] * r, 255, 240, 220, a); }); }
				if (hud) {
					hud.ano.textContent = TR('ano ' + Math.round(an), 'year ' + Math.round(an));
					hud.estacao.textContent = TR(an < 1840 ? 'uma estrela comum' : an < 1846 ? '2ª estrela mais brilhante do céu!' : an < 1860 ? 'o gás forma duas bolhas' : an < 1945 ? 'escondida pela própria poeira' : 'o Homúnculo hoje', an < 1840 ? 'an ordinary star' : an < 1846 ? '2nd brightest star in the sky!' : an < 1860 ? 'the gas forms two bubbles' : an < 1945 ? 'hidden by its own dust' : 'the Homunculus today');
				}
			};
		},

		// Cem anos de Sirius no céu (1760 a 1862): ela anda fazendo ondas, em vez de seguir reto.
		// Em 1844, Bessel percebe o bambeio; em 1862, Alvan Clark vê a companheira, que faz ondas ao
		// contrário. As duas giram em volta de um ponto entre elas, e é esse ponto que anda reto.
		// Sirius A pesa o dobro de Sirius B, por isso balança a metade.
		'sirius-bambeio': function (L, A) {
			var ceu = ceuBonito(L, A, 619, '#2a3a6a'), CICLO = 16;
			function ano(c) { return 1760 + Math.min(1, c / 10.5) * 102; }
			function centro(an) { var k = (an - 1760) / 102; return [26 + k * 270, 100 - k * 26]; }
			function separacao(an) { var f = (an - 1760) / 50 * Math.PI * 2 + 0.6; return [Math.cos(f) * 11, Math.sin(f) * 44]; }
			function posA(an) { var c = centro(an), s = separacao(an); return [c[0] - s[0] / 3, c[1] - s[1] / 3]; }
			function posB(an) { var c = centro(an), s = separacao(an); return [c[0] + s[0] * 2 / 3, c[1] + s[1] * 2 / 3]; }
			return function (buf, t, hud) {
				var c = t % CICLO, an = ano(c), bessel = an >= 1844, clark = c >= 10.5;
				ceu(buf, t);
				if (bessel) for (var q = 1760; q <= 1862; q += 0.25) { if (Math.round(q * 4) % 6 < 3) continue; var p = centro(q); luaMistura(buf, L, A, p[0], p[1], 150, 150, 240, 0.6); }
				for (q = 1760; q < an; q += 0.12) { var pa = posA(q), f = Math.max(0.25, 1 - (an - q) / 40); luaMistura(buf, L, A, pa[0], pa[1], 140, 180, 255, 0.85 * f); }
				if (clark) {
					for (q = 1760; q <= 1862; q += 0.2) { if (Math.round(q * 5) % 2) continue; var pb = posB(q); luaMistura(buf, L, A, pb[0], pb[1], 170, 170, 200, 0.5); }
					var cm = centro(an);
					for (var d = -3; d <= 3; d++) { luaMistura(buf, L, A, cm[0] + d, cm[1], 255, 224, 138, 1); luaMistura(buf, L, A, cm[0], cm[1] + d, 255, 224, 138, 1); }
				}
				var a = posA(an);
				estrelaBrilho(buf, L, A, a[0], a[1], 190, 215, 255, 10);
				brilhoSoma(buf, L, A, a[0], a[1], 16, 160, 200, 255, 0.6);
				if (clark) {
					var b = posB(an);
					estrelaBrilho(buf, L, A, b[0], b[1], 230, 230, 255, 2, 0.9);
					var pul = Math.sin(t * 6) > -0.3;
					if (pul) for (var g = 0; g < Math.PI * 2; g += 0.05) luaMistura(buf, L, A, b[0] + Math.cos(g) * 10, b[1] + Math.sin(g) * 10, 255, 224, 138, 0.8);
					if (pul) for (d = 6; d <= 14; d++) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (s) { luaMistura(buf, L, A, b[0] + s[0] * d, b[1] + s[1] * d, 255, 224, 138, 0.7); });
				}
				if (hud) {
					hud.ano.textContent = TR('ano ' + Math.round(an), 'year ' + Math.round(an));
					hud.estacao.textContent = TR(!bessel ? 'Sirius anda pelo céu… fazendo ondas' : !clark ? 'Bessel: algo invisível a puxa!' : 'Clark vê a companheira (na mira)', !bessel ? 'Sirius moves across the sky… in waves' : !clark ? 'Bessel: something invisible pulls it!' : 'Clark sees the companion (in the crosshair)');
				}
			};
		},

		// A vida de Sirius B: ela nasceu maior que Sirius A, gastou o combustível mais depressa,
		// inchou até virar uma gigante vermelha, soltou as camadas de fora num anel de gás e
		// sobrou só o miolo, a anã branca do tamanho da Terra
		'sirius-vida': function (L, A) {
			var ceu = ceuBonito(L, A, 620, '#2a3a6a'), CICLO = 16, Ax = 246, Bx = 104, cy = A / 2 + 2;
			var AZUL = rampaCores(['#ffffff', '#e0ecff', '#b0c8ff', '#6a88e0'], 12), GIG = rampaCores(['#fff0c0', '#ffb060', '#e0602a', '#a02a14', '#4a0e06'], 14);
			function milhoes(c) { return c < 3.5 ? 230 - c / 3.5 * 90 : c < 7.5 ? 140 - (c - 3.5) / 4 * 18 : 122 - (c - 7.5) / 3 * 4; }
			return function (buf, t, hud) {
				var c = t % CICLO, incha = suave((c - 3.5) / 4), solta = suave((c - 7.5) / 3), hoje = c >= 10.5;
				ceu(buf, t);
				var RA = 10 + (hoje ? 1.5 : 0);
				brilhoSoma(buf, L, A, Ax, cy, RA * 3, 150, 190, 255, 0.7);
				esfera(buf, L, A, Ax, cy, RA, AZUL, -0.6, -0.5);
				estrelaBrilho(buf, L, A, Ax, cy, 200, 220, 255, 16, 0.6);
				if (solta < 0.02) {
					var R = 14 + incha * 42, gig = incha > 0.15;
					brilhoSoma(buf, L, A, Bx, cy, R * 1.8, gig ? 255 : 150, gig ? 110 : 190, gig ? 50 : 255, 0.6);
					esfera(buf, L, A, Bx, cy, R, gig ? GIG : AZUL, -0.6, -0.5, gig ? function (x, y) { return (ruido2d(x * 4 + t * 0.3, y * 4) - 0.5) * 3; } : null);
				} else {
					var raio = 48 + solta * 70, some = 1 - suave((c - 9.5) / 1.6);
					for (var y = Math.floor(cy - raio * 1.1); y <= cy + raio * 1.1; y++) for (var x = Math.floor(Bx - raio * 1.1); x <= Bx + raio * 1.1; x++) {
						var d = Math.hypot(x - Bx, (y - cy) / 0.92) / raio; if (d > 1.05) continue;
						var n = ruido2d(x * 0.07 + 5, y * 0.07), anel = Math.exp(-Math.pow((d - 0.82) / 0.13, 2)), meio = Math.max(0, 0.7 - d) * 0.6;
						if (anel > 0.05) luaMistura(buf, L, A, x, y, 230, 110, 170, anel * (0.3 + n * 0.6) * some);
						if (meio > 0.02) luaMistura(buf, L, A, x, y, 120, 230, 220, meio * (0.4 + n * 0.6) * some);
					}
					estrelaBrilho(buf, L, A, Bx, cy, 230, 240, 255, 4);
					if (hoje) {
						/* do lado, a Terra no mesmo tamanho (é desse tamanho que ela ficou) */
						arte(buf, L, A, 'terra', Bx, cy + 14, 5, 0);
						brilhoSoma(buf, L, A, Bx, cy + 14, 6, 60, 120, 255, 0.4);
					}
				}
				if (hud) {
					hud.ano.textContent = TR(hoje ? 'hoje' : 'há ' + Math.round(milhoes(c)) + ' milhões de anos', hoje ? 'today' : Math.round(milhoes(c)) + ' million years ago');
					hud.estacao.textContent = TR(c < 3.5 ? 'duas estrelas nascem: B é a maior' : c < 7.5 ? 'Sirius B incha: uma gigante vermelha' : !hoje ? 'ela solta as camadas de fora' : 'B virou uma anã branca, do tamanho da Terra', c < 3.5 ? 'two stars are born: B is the bigger one' : c < 7.5 ? 'Sirius B swells: a red giant' : !hoje ? 'it sheds its outer layers' : 'B became a white dwarf, the size of Earth');
				}
			};
		},

		// O céu visto da China em 1054: uma noite comum no Touro; aparece a "estrela convidada", tão
		// forte que dá para ver de dia (o céu fica azul, com o Sol); depois, à noite, ela vai
		// apagando ao longo de quase dois anos até sumir; no fim, a nebulosa como é vista hoje
		'caranguejo-1054': function (L, A) {
			var noite = ceuBonito(L, A, 621, '#2a2a5a'), CICLO = 16, sx = 180, sy = 62;
			var TOURO = [[154, 82], [164, 92], [174, 100], [180, 92], [190, 82], [138, 62], [202, 62]];
			function quando(c) {
				if (c < 1.5) return TR(['junho de 1054', 'uma noite comum'], ['June 1054', 'an ordinary night']);
				if (c < 5) return TR(['4 de julho de 1054', 'dá para ver até de dia!'], ['July 4, 1054', 'visible even by day!']);
				if (c < 12) { var m = Math.round((c - 5) / 7 * 21) + 1; return TR([m + (m > 1 ? ' meses' : ' mês') + ' depois', 'à noite, ainda brilhando'], [m + (m > 1 ? ' months' : ' month') + ' later', 'at night, still shining']); }
				if (c < 13.5) return ['1056', TR('apagou', 'faded away')];
				return TR(['hoje, num telescópio', 'a Nebulosa do Caranguejo'], ['today, in a telescope', 'the Crab Nebula']);
			}
			var CHAO = []; for (var x = 0; x < L; x++) CHAO.push(14 + Math.sin(x * 0.03) * 4 + Math.sin(x * 0.11) * 2);
			return function (buf, t, hud) {
				var c = t % CICLO, dia = c >= 1.5 && c < 5, forca = c < 1.5 ? 0 : c < 5 ? 1 : c < 12 ? 1 - (c - 5) / 7 * 0.92 : 0;
				if (dia) {
					for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) { var alt = y / A; buf[y * L + x] = cor(70 + alt * 90, 130 + alt * 70, 220 + alt * 20); }
					brilhoSoma(buf, L, A, 60, 46, 50, 255, 240, 200, 0.7);
					brilhoSoma(buf, L, A, 60, 46, 12, 255, 255, 240, 1.5);
					[[40, 120, 60], [230, 100, 80]].forEach(function (n) { for (var k = 0; k < 6; k++) brilhoSoma(buf, L, A, n[0] + k * 10 + Math.sin(t * 0.3 + k) * 2, n[1] - Math.abs(k - 2.5) * 3, 14, 255, 255, 255, 0.5); });
				} else {
					noite(buf, t);
					TOURO.forEach(function (e) { estrelaBrilho(buf, L, A, e[0], e[1], 220, 230, 255, 2, 0.8); });
					estrelaBrilho(buf, L, A, 166, 112, 255, 170, 110, 3, 1);
				}
				if (forca > 0.02) {
					var tam = 2 + forca * 10;
					brilhoSoma(buf, L, A, sx, sy, tam * 2.5, 255, 230, 180, 0.6 * forca);
					brilhoSoma(buf, L, A, sx, sy, tam * 0.6, 255, 255, 245, 1.2);
					for (var r = 1; r < tam * 2; r++) { var a = (1 - r / (tam * 2)) * (0.3 + forca * 0.7); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { luaMistura(buf, L, A, sx + d[0] * r, sy + d[1] * r, 255, 250, 230, a); }); }
				}
				if (c >= 13.5) {
					var neb = suave((c - 13.5) / 1.2);
					for (var y2 = sy - 14; y2 <= sy + 14; y2++) for (var x3 = sx - 18; x3 <= sx + 18; x3++) {
						var d2 = Math.hypot((x3 - sx) / 18, (y2 - sy) / 13); if (d2 > 1) continue;
						var fio = Math.abs(ruido2d(x3 * 0.35, y2 * 0.35) - 0.5) < 0.08;
						if (fio) luaMistura(buf, L, A, x3, y2, 255, 140, 90, (1 - d2) * neb * 1.2);
						else luaMistura(buf, L, A, x3, y2, 150, 190, 255, (1 - d2) * (1 - d2) * neb * 0.7);
					}
				}
				for (x = 0; x < L; x++) for (y = Math.round(A - CHAO[x]); y < A; y++) pintar(buf, L, A, x, y, dia ? cor(40, 70, 46) : cor(6, 5, 12));
				/* o telhado curvo de um observatório chinês */
				var tx = 262, ty = A - 14, TEL = dia ? [80, 40, 40] : [14, 10, 22];
				for (var j = -26; j <= 26; j++) { var curva = Math.abs(j) > 18 ? (Math.abs(j) - 18) * 0.6 : 0; for (var i = 0; i < 4; i++) pintar(buf, L, A, tx + j, ty - 18 - i - curva, cor(TEL[0], TEL[1], TEL[2])); }
				for (var py = ty - 17; py < ty + 4; py++) for (var px = tx - 16; px <= tx + 16; px++) pintar(buf, L, A, px, py, cor(TEL[0] * 0.8, TEL[1] * 0.8, TEL[2] * 0.8));
				for (j = -10; j <= 10; j++) for (i = 0; i < 3; i++) pintar(buf, L, A, tx + j, ty - 25 - i, cor(TEL[0], TEL[1], TEL[2]));
				if (!dia) [[-8, -8], [8, -8]].forEach(function (w) { luaMistura(buf, L, A, tx + w[0], ty + w[1], 255, 200, 110, 0.7 + 0.3 * Math.sin(t * 3 + w[0])); luaMistura(buf, L, A, tx + w[0], ty + w[1] + 1, 255, 200, 110, 0.6); });
				if (hud) { var w2 = quando(c); hud.ano.textContent = w2[0]; hud.estacao.textContent = w2[1]; }
			};
		},

		// O pulsar como um farol: gira e solta dois feixes de luz em lados opostos. Quando um feixe
		// passa pela Terra (à direita), ela pisca e o gráfico embaixo marca um pico. Câmera lenta:
		// aqui, uma volta a cada 8 segundos; de verdade, 30 voltas por segundo
		'caranguejo-pulsar': function (L, A) {
			var ceu = ceuBonito(L, A, 622, '#3a2a4a'), cx = 96, cy = 74, Tx = 290, Ty = 74, VOLTA = 8, JANELA = 16;
			var NEB = new Float32Array(L * A * 4);
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
				var d = Math.hypot((x - cx) / 74, (y - cy) / 52); if (d > 1.1) continue;
				var fio = Math.abs(ruido2d(x * 0.07 + Math.sin(y * 0.1), y * 0.07) - 0.5) + Math.abs(ruido2d(x * 0.2, y * 0.2) - 0.5) * 0.15, i4 = (y * L + x) * 4, k = Math.max(0, 1 - d);
				if (fio < 0.09) { NEB[i4] = 255; NEB[i4 + 1] = 140; NEB[i4 + 2] = 90; NEB[i4 + 3] = Math.min(0.7, k * 1.4) * (1 - fio / 0.09); }
				else { NEB[i4] = 140; NEB[i4 + 1] = 180; NEB[i4 + 2] = 255; NEB[i4 + 3] = k * k * 0.55; }
			}
			return function (buf, t, hud) {
				var ang = (t / VOLTA) * Math.PI * 2;
				ceu(buf, t);
				camadaMistura(buf, L, A, NEB, 1);
				[0, Math.PI].forEach(function (lado) {
					var a2 = ang + lado;
					for (var s = 4; s < 260; s += 0.6) {
						var larg = s * 0.05;
						for (var w = -larg; w <= larg; w += 0.6) {
							var f = (1 - s / 260) * (1 - Math.abs(w) / (larg + 0.5));
							luaMistura(buf, L, A, cx + Math.cos(a2) * s - Math.sin(a2) * w, cy + Math.sin(a2) * s + Math.cos(a2) * w, 200, 225, 255, f * 0.5);
						}
					}
				});
				brilhoSoma(buf, L, A, cx, cy, 16, 180, 210, 255, 0.9);
				estrelaBrilho(buf, L, A, cx, cy, 230, 240, 255, 4);
				[[0, [255, 90, 106]], [Math.PI, [90, 138, 255]]].forEach(function (polo) {
					var pa = ang + polo[0];
					for (var e = 3; e <= 9; e++) luaMistura(buf, L, A, cx + Math.cos(pa) * e, cy + Math.sin(pa) * e, polo[1][0], polo[1][1], polo[1][2], 0.9);
				});
				var dif = Math.abs(((ang % Math.PI) + Math.PI) % Math.PI), pisca = dif < 0.06 || dif > Math.PI - 0.06;
				var desde = ((t + VOLTA * 0.02) % (VOLTA / 2)), aceso = pisca || desde < 0.9, lendo = t > 1 && desde < 2.5;
				if (aceso) brilhoSoma(buf, L, A, Tx, Ty, 26, 160, 255, 150, 0.8 * (pisca ? 1 : 1 - desde / 0.9));
				arteGlobo(buf, L, A, 'terra', Tx, Ty, 9, t * 0.5, -1, 0, 0.6);
				var g0 = 14, g1 = 306, gy = A - 12;
				painel(buf, L, A, g0 - 4, gy - 26, g1 + 4, gy + 4, [gy]);
				for (var gx = g0; gx <= g1; gx++) {
					var tp = t - (g1 - gx) / (g1 - g0) * JANELA; if (tp < 0) continue;
					var ap = ((tp / VOLTA) * Math.PI * 2) % Math.PI, d2 = Math.min(ap, Math.PI - ap);
					var alt = d2 < 0.12 ? (0.12 - d2) / 0.12 * 20 : 0;
					for (var yy = 0; yy <= alt; yy++) luaMistura(buf, L, A, gx, gy - yy, 155, 227, 106, yy > alt - 1.5 ? 1 : 0.4);
					if (alt <= 0) luaMistura(buf, L, A, gx, gy, 155, 227, 106, 0.6);
				}
				if (hud) {
					hud.ano.textContent = TR('piscadas: ' + Math.floor(t / VOLTA * 2), 'blinks: ' + Math.floor(t / VOLTA * 2));
					hud.estacao.textContent = TR(pisca || lendo ? 'o feixe passou pela Terra: pisca!' : 'em câmera lenta (de verdade, 30 voltas por segundo)', pisca || lendo ? 'the beam swept past Earth: blink!' : 'in slow motion (really 30 turns per second)');
				}
			};
		},

		// Vista de cima: Proxima b dá a volta na estrela em 11 dias (aqui, 1 segundo = 1 dia), sempre
		// com o mesmo lado virado para ela. A bandeirinha fica no lado do dia e nunca vê a noite
		'proxima-b': function (L, A) {
			var ceu = ceuBonito(L, A, 623, '#5a2a3a'), cx = L / 2, cy = A / 2 + 2, rx = 112, ry = 54, CICLO = 11;
			var ESTRELA = rampaCores(['#ffe0c0', '#ff9a6a', '#e05a3a', '#a8302a', '#5a1410'], 14);
			var PLAN = rampaCores(['#ffd8b8', '#e8a888', '#b07058', '#5a3a3a'], 10), NOITE = rampaCores(['#4a4a90', '#2a2a64', '#14123a'], 6);
			return function (buf, t, hud) {
				ceu(buf, t);
				var k = (t % CICLO) / CICLO, a = k * Math.PI * 2, px = cx + Math.cos(a) * rx, py = cy + Math.sin(a) * ry;
				orbitaPontilhada(buf, L, A, cx, cy, rx, ry, a, 230, 150, 170);
				function estrela() {
					brilhoSoma(buf, L, A, cx, cy, 52, 255, 90, 60, 0.6);
					esfera(buf, L, A, cx, cy, 16, ESTRELA, -0.4, -0.4, function (x, y) { return (ruido2d(x * 4 + t * 0.3, y * 4) - 0.5) * 2.5; });
					/* as erupções de Proxima: de vez em quando ela dá um clarão */
					var fl = Math.max(0, Math.sin(t * 0.9) - 0.92) * 12;
					if (fl > 0) brilhoSoma(buf, L, A, cx + 10, cy - 8, 20, 255, 230, 200, fl);
				}
				function planeta() {
					var lx = cx - px, ly = cy - py, ln = Math.hypot(lx, ly); lx /= ln; ly /= ln;
					brilhoSoma(buf, L, A, px, py, 18, 255, 140, 100, 0.3);
					esfera(buf, L, A, px, py, 11, PLAN, -lx, -ly, function (x, y) { return (ruido2d(x * 3 + Math.cos(a) * 2, y * 3 + Math.sin(a) * 2) - 0.5) * 1.5; });
					escurecer(buf, L, A, px, py, 11, function (x, y) { var d = x * lx + y * ly; return 0.3 + 0.7 * suave((d + 0.1) / 0.3); });
					/* a bandeirinha, sempre no ponto virado para a estrela */
					bandeirinha(buf, L, A, px + lx * 10, py + ly * 10, lx, ly, 7);
				}
				if (Math.sin(a) < 0) { planeta(); estrela(); } else { estrela(); planeta(); }
				if (hud) {
					hud.ano.textContent = TR('dia ' + Math.floor(k * 11) + ' de 11', 'day ' + Math.floor(k * 11) + ' of 11');
					hud.estacao.textContent = TR('a bandeirinha fica sempre de dia', 'the little flag is always in daylight');
				}
			};
		},

		// Uma corrida do Sol até Proxima (4,2 anos-luz), em três pistas: em cima, um raio de luz;
		// no meio, uma navezinha com vela, empurrada por um laser da Terra (um quinto da velocidade
		// da luz: uns 21 anos); embaixo, a Voyager 1 (mais de 70 mil anos: quase não sai do lugar)
		'proxima-viagem': function (L, A) {
			var ceu = ceuBonito(L, A, 624, '#2a2a5a'), CICLO = 16, x0 = 40, x1 = 280, PISTAS = [46, 92, 138];
			var SOL = rampaCores(['#fffbe0', '#ffd060', '#f09030', '#a04810'], 12), PROX = rampaCores(['#ffd0b0', '#e05a3a', '#7a2018'], 10);
			function anos(c) { return Math.min(25, c / 13 * 25); }
			return function (buf, t, hud) {
				var c = t % CICLO, an = anos(c);
				ceu(buf, t);
				brilhoSoma(buf, L, A, 0, A / 2, 70, 255, 200, 100, 0.7);
				esfera(buf, L, A, 2, A / 2, 26, SOL, -1, 0);
				brilhoSoma(buf, L, A, L - 4, A / 2, 40, 255, 90, 60, 0.6);
				esfera(buf, L, A, L - 4, A / 2, 14, PROX, 1, 0);
				PISTAS.forEach(function (py) { for (var x = x0; x <= x1; x += 4) luaMistura(buf, L, A, x, py, 130, 130, 220, 0.45); for (var q = -3; q <= 3; q++) luaMistura(buf, L, A, x1, py + q, 255, 200, 160, 0.6); });
				var kl = Math.min(1, an / 4.2), lx = x0 + kl * (x1 - x0);
				for (var r = 0; r < 30; r++) luaMistura(buf, L, A, lx - r, PISTAS[0], 255, 240, 170, 1 - r / 30);
				brilhoSoma(buf, L, A, lx, PISTAS[0], 7, 255, 250, 210, 0.9);
				var kv = Math.min(1, an / 21), vx = x0 + kv * (x1 - x0), vy = PISTAS[1];
				if (an < 2) { for (var lz = x0 - 30; lz < vx - 6; lz++) luaMistura(buf, L, A, lz, vy, 255, 80, 110, 0.8); brilhoSoma(buf, L, A, vx - 6, vy, 10, 255, 80, 110, 0.6); }
				for (var s = -8; s <= 8; s++) { luaMistura(buf, L, A, vx - 4 + Math.abs(s) * 0.15, vy + s, 230, 235, 255, 0.95); luaMistura(buf, L, A, vx - 5 + Math.abs(s) * 0.15, vy + s, 150, 160, 220, 0.8); }
				luaLinha(buf, L, A, vx - 4, vy - 8, vx + 2, vy, hex('#9aa6d8')); luaLinha(buf, L, A, vx - 4, vy + 8, vx + 2, vy, hex('#9aa6d8'));
				luaDisco(buf, L, A, vx + 2, vy, 1, hex('#ffe08a'));
				var gx = x0 + 1, gy = PISTAS[2];
				luaLinha(buf, L, A, gx - 3, gy, gx + 3, gy, hex('#c8c8e8')); luaDisco(buf, L, A, gx - 4, gy, 2, hex('#e8e8f8')); luaLinha(buf, L, A, gx, gy, gx + 2, gy - 5, hex('#8a8ab0'));
				luaMistura(buf, L, A, gx - 4, gy - 3, 255, 80, 80, 0.5 + 0.5 * Math.sin(t * 4));
				if (hud) {
					hud.ano.textContent = TR('ano ' + numero(an, an < 10 ? 1 : 0), 'year ' + numero(an, an < 10 ? 1 : 0));
					hud.estacao.textContent = TR(an < 4.2 ? 'a luz vai na frente' : an < 21 ? 'a luz chegou! a vela ainda vai' : 'a vela chegou! a Voyager… nem saiu', an < 4.2 ? 'light goes first' : an < 21 ? 'light arrived! the sail is still going' : 'the sail arrived! Voyager… barely left');
				}
			};
		}
	});
	// As animações que contam o tempo (anos, semanas, dias) repetem um ciclo de tantos segundos.
	// Elas ganham uma barra embaixo: dá para pausar e arrastar para ir e voltar no tempo.
	var CICLOS = {
		'urano-rola': 16, 'terra-estacoes': 12, 'saturno-aneis': 14, 'mercurio-dia': 16, 'mercurio-calor': 16, 'marte-poeira': 16,
		'marte-ano': 15, 'netuno-ano': 16, 'terra-lua': 14, 'venus-estufa': 12, 'jupiter-mancha': 14, 'sol-aurora': 18, 'sol-foton': 16,
		'sgr-s2': 16, 'fermi-sopro': 15, 'orion-disco': 16, 'pleiades-separa': 16, 'helice-morte': 17, 'omega-engolida': 20, 'betelgeuse-apagao': 14, 'betelgeuse-supernova': 16, 'eta-par': 14, 'eta-erupcao': 16,
		'sirius-bambeio': 16, 'sirius-vida': 16, 'caranguejo-1054': 16, 'proxima-b': 11, 'proxima-viagem': 16,
		'lua-face': 14, 'lua-theia': 16, 'io-mare': 16, 'io-pluma': 12, 'europa-oceano': 14, 'europa-rachaduras': 16, 'ganimedes-aurora': 14, 'ganimedes-tamanho': 12,
		'tita-chuva': 16, 'tita-huygens': 16, 'encelado-geiser': 12, 'encelado-anel': 16, 'mimas-impacto': 12, 'mimas-pacman': 12, 'miranda-penhasco': 14, 'miranda-retalhos': 14,
		'tritao-contra': 14, 'tritao-geiser': 12
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
				'<input type="range" min="0" max="1000" step="1" value="0" aria-label="' + TR('Linha do tempo da animação: arraste para ir e voltar', 'Animation timeline: drag to go back and forth') + '">';
			figura.insertBefore(controle, figura.querySelector('figcaption'));
			botao = controle.querySelector('button');
			barra = controle.querySelector('input');
			var atualizarBotao = function () {
				botao.classList.toggle('pausado', !tocando);
				botao.setAttribute('aria-label', tocando ? TR('Pausar a animação', 'Pause the animation') : TR('Continuar a animação', 'Resume the animation'));
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
			var dt = Math.max(0, Math.min(0.1, (agora - anterior) / 1000));
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
		if (n >= 1e9) return numero(n / 1e9, n < 1e10 ? 1 : 0) + TR(n < 2e9 ? ' bilhão' : ' bilhões', ' billion');
		if (n >= 1e6) return numero(n / 1e6, n < 2e6 ? 1 : 0) + TR(n < 2e6 ? ' milhão' : ' milhões', ' million');
		if (n >= 10000) return numero(Math.round(n / 1000), 0) + TR(' mil', ' thousand');
		if (n >= 1000) return numero(n / 1000, 1) + TR(' mil', ' thousand');
		return numero(Math.round(n), 0);
	}
	// na página do Sol: ele com os 8 planetas em fila, cada um no tamanho real em relação a ele
	var PLANETAS = [['mercurio', TR('Mercúrio', 'Mercury'), 4879], ['venus', TR('Vênus', 'Venus'), 12104], ['terra', TR('Terra', 'Earth'), 12742], ['marte', TR('Marte', 'Mars'), 6779],
		['jupiter', TR('Júpiter', 'Jupiter'), 139820], ['saturno', TR('Saturno', 'Saturn'), 116460, 1.9], ['urano', TR('Urano', 'Uranus'), 51118], ['netuno', TR('Netuno', 'Neptune'), 49244]];
	var TOQUE = window.matchMedia && window.matchMedia('(hover: none)').matches;
	// um planetinha com lupa: passando o mouse (ou tocando), aparece ele ampliado
	function comLupa(nome, img, astro) {
		return '<span class="cv-item cv-com-lupa" tabindex="0" aria-label="' + TR(nome + ' em tamanho real; passe o mouse ou toque para ampliar', nome + ' at true scale; hover or tap to zoom in') + '">' +
			astro + '<small>' + nome + '</small>' +
			'<span class="cv-lupa" aria-hidden="true"><span class="cv-lupa-vidro"><img src="' + img + '" alt=""></span><small class="cv-zoom"></small></span></span>';
	}
	// o quanto cada lupa amplia, pelo tamanho do pontinho dela
	function medirLupas(fig) {
		fig.querySelectorAll('.cv-com-lupa').forEach(function (item) {
			var d = item.querySelector('.cv-astro').getBoundingClientRect().height;
			item.querySelector('.cv-zoom').textContent = TR('ampliado ', 'zoom ') + Math.round(132 * 0.8 / d) + '×'; // a lupa tem 132 px
		});
	}
	document.querySelectorAll('.comparacao-viva[data-todos]').forEach(function (fig) {
		fig.innerHTML =
			'<div class="cv-cena">' +
				'<div class="cv-sol"><img src="pixel/sol.png" alt=""><i class="cv-transito"><small>' + TR('Terra', 'Earth') + '</small></i></div>' +
				'<div class="cv-lado">' +
					'<p class="cv-titulo">' + TR('Os planetas em tamanho real ao lado do Sol', 'The planets at true scale next to the Sun') + '</p>' +
					'<div class="cv-fila">' + PLANETAS.map(function (p) {
						return comLupa(p[1], 'pixel/' + p[0] + '.png', '<span class="cv-astro" data-km="' + p[2] + '" data-prop="' + (p[3] || 1) + '"><img src="pixel/' + p[0] + '.png" alt=""></span>');
					}).join('') + '</div>' +
					'<p class="cv-dica">' + (TOQUE ? TR('Toque', 'Tap') : TR('Passe o mouse', 'Hover')) + TR(' em um planeta para ampliar', ' over a planet to zoom in') + '</p>' +
				'</div>' +
			'</div>' +
			'<figcaption>' + TR('O Sol é <b>109 vezes</b> mais largo que a Terra, e dentro dele caberiam cerca de <b>1,3 milhão de Terras</b>. Até Júpiter, o maior planeta, cabe dez vezes lado a lado no diâmetro do Sol.', 'The Sun is <b>109 times</b> wider than Earth, and about <b>1.3 million Earths</b> would fit inside it. Even Jupiter, the largest planet, fits ten times side by side across the Sun.') + '</figcaption>';
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
		var razao = km / KM_SOL, ladoALado = Math.round(1 / razao), dentro = Math.pow(1 / razao, 3), ehTerra = img === 'pixel/terra.png';
		fig.innerHTML =
			'<div class="cv-cena">' +
				'<div class="cv-sol"><img src="pixel/sol.png" alt=""><i class="cv-transito"><small>' + nome + '</small></i></div>' +
				'<div class="cv-lado">' +
					'<p class="cv-titulo">' + TR('Tamanho real em relação ao Sol', 'True size compared to the Sun') + '</p>' +
					'<div class="cv-pequenos">' +
						comLupa(nome, img, '<span class="cv-astro cv-alvo"><img src="' + img + '" alt=""></span>') +
						(ehTerra ? '' : comLupa(TR('Terra', 'Earth'), 'pixel/terra.png', '<span class="cv-astro cv-terra"></span>')) + // na Terra, ela mesma já é a régua
					'</div>' +
					'<p class="cv-dica">' + (TOQUE ? TR('Toque', 'Tap') : TR('Passe o mouse', 'Hover')) + TR(' em ', ' over ') + nome + (ehTerra ? '' : TR(' ou na Terra', ' or Earth')) + TR(' para ampliar', ' to zoom in') + '</p>' +
				'</div>' +
			'</div>' +
			'<figcaption>' + TR('<b>' + ladoALado + ' ' + plural + '</b> lado a lado atravessariam o Sol de uma ponta à outra, e dentro dele caberiam cerca de <b>' + quantos(dentro) + ' ' + plural + '</b>.', '<b>' + ladoALado + ' ' + plural + '</b> side by side would stretch across the Sun, and about <b>' + quantos(dentro) + ' ' + plural + '</b> would fit inside it.') + '</figcaption>';
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
	function numero(n, casas) { return n.toLocaleString(window.LOCALE || 'pt-BR', { minimumFractionDigits: casas || 0, maximumFractionDigits: casas || 0 }); }
	document.querySelectorAll('[data-ferramenta="idade"]').forEach(function (c) {
		var ano = parseFloat(c.getAttribute('data-ano')), planeta = c.getAttribute('data-planeta');
		var campo = c.querySelector('input'), saida = c.querySelector('.calc-resultado');
		function calcular() {
			var idade = Math.max(0, Math.min(130, parseFloat(campo.value) || 0));
			var la = idade / ano, falta = ano - (idade % ano);
			// aniversário: em dias se faltar menos de um ano da Terra
			var quando = falta < 1 ? numero(Math.max(1, falta * 365.25), 0) + TR(' dias', ' days') : numero(falta, 0) + (Math.round(falta) === 1 ? TR(' ano', ' Earth year') : TR(' anos', ' Earth years')) + TR(' da Terra', '');
			saida.innerHTML = TR('Em ' + planeta + ' você teria <b>' + numero(la, la < 1 ? 2 : 1) + ' ' + (la >= 1 && la < 2 ? 'ano' : 'anos') + '</b>.<br>' +
				'Seu próximo aniversário de ' + planeta + ' seria daqui a ' + quando + '.', 'On ' + planeta + ' you would be <b>' + numero(la, la < 1 ? 2 : 1) + ' ' + (la >= 1 && la < 2 ? 'year' : 'years') + ' old</b>.<br>' +
				'Your next ' + planeta + ' birthday would be in ' + quando + '.');
		}
		campo.addEventListener('input', calcular);
		calcular();
	});
	function tempoBonito(horas) {
		var anos = horas / 8766;
		// tempos de viagem até os destinos da galáxia: milhões e bilhões de anos
		var cerca = TR('cerca de ', 'about ');
		if (anos >= 1e9) return cerca + numero(anos / 1e9, anos < 1e10 ? 1 : 0) + TR((anos < 2e9 ? ' bilhão' : ' bilhões') + ' de anos', ' billion years');
		if (anos >= 1e6) return cerca + numero(anos / 1e6, anos < 1e7 ? 1 : 0) + TR((anos < 2e6 ? ' milhão' : ' milhões') + ' de anos', ' million years');
		if (anos >= 2) return cerca + numero(anos, 0) + TR(' anos', ' years');
		if (horas >= 48) return cerca + numero(horas / 24, 0) + TR(' dias', ' days');
		if (horas * 60 < 1) return cerca + numero(horas * 3600, 1) + TR(' segundo', ' second') + (horas * 3600 >= 2 ? 's' : '');
		var h = Math.floor(horas), min = Math.round((horas - h) * 60);
		return cerca + (h ? h + ' h ' : '') + min + ' min';
	}
	// quanto já viajamos em volta do Sol (na página da Terra): uns 940 milhões de km por ano
	document.querySelectorAll('[data-ferramenta="voltas"]').forEach(function (c) {
		var porAno = parseFloat(c.getAttribute('data-km-ano')), campo = c.querySelector('input'), saida = c.querySelector('.calc-resultado');
		function calcular() {
			var idade = Math.max(0, Math.min(130, parseFloat(campo.value) || 0)), km = idade * porAno;
			var texto = km >= 1e9 ? numero(km / 1e9, 1) + TR(' bilhões de km', ' billion km') : numero(km / 1e6, 0) + TR(' milhões de km', ' million km');
			saida.innerHTML = TR('Você já viajou cerca de <b>' + texto + '</b> com a Terra em volta do Sol, ' +
				'dando ' + numero(idade, 0) + (Math.round(idade) === 1 ? ' volta' : ' voltas') + ' nele, sem sair do lugar.', 'You have already traveled about <b>' + texto + '</b> with Earth around the Sun, ' +
				'going around it ' + numero(idade, 0) + (Math.round(idade) === 1 ? ' time' : ' times') + ' without leaving your spot.');
		}
		campo.addEventListener('input', calcular);
		calcular();
	});
	// a luz que vemos de um destino saiu de lá há tantos anos quanto a distância em anos-luz
	function anoBonito(a) {
		if (a <= 0) return numero(-a, 0) + TR(' a.C.', ' BC');
		return a >= 10000 ? numero(a, 0) : String(a);
	}
	function epoca(a) {
		if (a < -10000) return TR('quando os mamutes ainda andavam pela Terra', 'when mammoths still walked the Earth');
		if (a < -3000) return TR('antes da invenção da escrita', 'before writing was invented');
		if (a < 476) return TR('na Antiguidade', 'in Antiquity');
		if (a < 1500) return TR('na Idade Média', 'in the Middle Ages');
		if (a < 1822) return TR('quando o Brasil ainda era colônia de Portugal', 'when Brazil was still a Portuguese colony');
		return TR('há pouco tempo', 'not long ago');
	}
	document.querySelectorAll('[data-ferramenta="luz"]').forEach(function (c) {
		var al = parseFloat(c.getAttribute('data-anos-luz')), de = c.getAttribute('data-de');
		var campo = c.querySelector('input'), saida = c.querySelector('.calc-resultado'), hoje = new Date().getFullYear();
		// as distâncias são aproximadas: o ano de saída fica arredondado
		// (Sirius, a 8,6 anos-luz, fica no ano certinho)
		var arred = al >= 10000 ? 100 : al >= 100 ? 10 : 1, saiu = Math.round((hoje - al) / arred) * arred;
		function calcular() {
			var nasceu = Math.max(1900, Math.min(hoje, Math.round(parseFloat(campo.value) || hoje)));
			saida.innerHTML = TR('A luz que chega hoje saiu ' + de + ' por volta do ano <b>' + anoBonito(saiu) + '</b>, ' + epoca(saiu) + '.<br>' +
				'E a luz que saiu de lá quando você nasceu só chega aqui no ano <b>' + anoBonito(Math.round(nasceu + al)) + '</b>.', 'The light arriving today left ' + de + ' around the year <b>' + anoBonito(saiu) + '</b>, ' + epoca(saiu) + '.<br>' +
				'And the light that left there when you were born only gets here in the year <b>' + anoBonito(Math.round(nasceu + al)) + '</b>.');
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
						var galaxia = q.hasAttribute('data-quiz-galaxia'), luas = q.hasAttribute('data-quiz-luas');
						var selo = galaxia ? TR('Sabe-tudo da Via Láctea', 'Milky Way Know-it-all') : luas ? TR('Sabe-tudo das luas', 'Moon Know-it-all') : TR('Sabe-tudo do Sistema Solar', 'Solar System Know-it-all'), total = galaxia ? 12 : luas ? 9 : 8;
						if (window.PassaporteEspacial) window.PassaporteEspacial.anotar(galaxia ? 'quizGalaxia' : luas ? 'quizLua' : 'quiz', q.getAttribute('data-quiz'));
						var feitos = 0;
						try { feitos = ((JSON.parse(localStorage.getItem('passaporteEspacial')) || {})[galaxia ? 'quizzesGalaxia' : luas ? 'quizzesLuas' : 'quizzes'] || []).length; } catch (e) {}
						saida.innerHTML = TR('<b>Acertou tudo!</b> ', '<b>All correct!</b> ') + (feitos >= total ? TR('Você ganhou o selo especial "' + selo + '"! Ele está no passaporte, na aba Conquistas.', 'You earned the special "' + selo + '" seal! It is in your passport, in the Achievements tab.')
							: TR('Quiz anotado no passaporte: ' + feitos + ' de ' + total + ' para o selo especial "' + selo + '".', 'Quiz stamped in your passport: ' + feitos + ' of ' + total + ' toward the special "' + selo + '" seal.'));
					} else {
						saida.innerHTML = TR('Você acertou ' + acertos + ' de ' + perguntas.length + '. ', 'You got ' + acertos + ' of ' + perguntas.length + ' right. ');
						var deNovo = document.createElement('button');
						deNovo.type = 'button';
						deNovo.className = 'quiz-de-novo';
						deNovo.textContent = TR('Tentar de novo', 'Try again');
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
