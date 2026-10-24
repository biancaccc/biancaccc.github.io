// Passaporte espacial: cada destino visitado ganha um carimbo em pixel art.
//  - Nas páginas dos destinos (body com data-passaporte="..."), a primeira visita carimba o
//    passaporte e mostra o carimbo novo num cantinho da tela.
//  - Na Via Láctea (index.html), o botão "Passaporte" abre o livrinho com todos os carimbos,
//    o nome de quem viaja e, com os 8 destinos, o certificado de Turista da Via Láctea.
// Tudo fica guardado só neste navegador (localStorage).
(function () {
	var CHAVE = 'passaporteEspacial';
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Os destinos, na ordem do passeio. "codigo" é a sigla do carimbo (como nos aeroportos)
	// e "desenho" é o ícone de 16 x 16 pixels (# = tinta).
	var DESTINOS = [
		{ id: 'sagitario', nome: 'Sagittarius A*', codigo: 'SGR', cor: '#ffb347', href: 'sagitario-a.html', desenho: [
			'................',
			'.....######.....',
			'...##......##...',
			'..#..######..#..',
			'.#..#......#..#.',
			'.#.#........#.#.',
			'################',
			'#..#........#..#',
			'################',
			'.#.#........#.#.',
			'.#..#......#..#.',
			'..#..######..#..',
			'...##......##...',
			'.....######.....',
			'................',
			'................'] },
		{ id: 'fermi', nome: 'Bolhas de Fermi', codigo: 'FRM', cor: '#e070ff', href: 'fermi.html', desenho: [
			'.....######.....',
			'...##......##...',
			'..#..........#..',
			'..#..........#..',
			'...#........#...',
			'....##....##....',
			'......#..#......',
			'################',
			'......#..#......',
			'....##....##....',
			'...#........#...',
			'..#..........#..',
			'..#..........#..',
			'...##......##...',
			'.....######.....',
			'................'] },
		{ id: 'orion', nome: 'Nebulosa de Órion', codigo: 'ORI', cor: '#ff6fb5', href: 'orion.html', desenho: [
			'................',
			'......##........',
			'....##..##..##..',
			'...#......##..#.',
			'..#...........#.',
			'.#......#......#',
			'.#.....###.....#',
			'#....#######...#',
			'#......###.....#',
			'.#......#.....#.',
			'.#...........#..',
			'..##.......##...',
			'....#######.....',
			'................',
			'................',
			'................'] },
		{ id: 'pleiades', nome: 'Plêiades', codigo: 'PLE', cor: '#8fb8ff', href: 'pleiades.html', desenho: [
			'................',
			'..#.........#...',
			'.###.......###..',
			'..#....#....#...',
			'......###.......',
			'.......#....#...',
			'...#.......###..',
			'..###.......#...',
			'...#...#........',
			'......###...#...',
			'.......#...###..',
			'............#...',
			'....#...........',
			'...###..........',
			'....#...........',
			'................'] },
		{ id: 'helice', nome: 'Nebulosa da Hélice', codigo: 'HEL', cor: '#5fd6d0', href: 'helice.html', desenho: [
			'................',
			'................',
			'.....######.....',
			'...##......##...',
			'..#...####...#..',
			'.#...#....#...#.',
			'#...#..##..#...#',
			'#...#.####.#...#',
			'#...#..##..#...#',
			'.#...#....#...#.',
			'..#...####...#..',
			'...##......##...',
			'.....######.....',
			'................',
			'................',
			'................'] },
		{ id: 'tabby', nome: 'Estrela de Tabby', codigo: 'TAB', cor: '#ff9d5c', href: 'tabby.html', desenho: [
			'................',
			'......####......',
			'....##....##....',
			'...#........#...',
			'...#........#...',
			'....##....##....',
			'......####......',
			'................',
			'################',
			'................',
			'####....########',
			'....#..#........',
			'.....##.........',
			'................',
			'................',
			'................'] },
		{ id: 'omega', nome: 'Omega Centauri', codigo: 'OMG', cor: '#ffe08a', href: 'omega-centauri.html', desenho: [
			'................',
			'.....#.#.#......',
			'...#.#.#.#.#....',
			'..#.#.#.#.#.#...',
			'.#.#.#####.#.#..',
			'..#.#######.#...',
			'.#.#########.#..',
			'..#.#######.#...',
			'.#.#.#####.#.#..',
			'..#.#.#.#.#.#...',
			'...#.#.#.#.#....',
			'.....#.#.#......',
			'................',
			'................',
			'................',
			'................'] },
		{ id: 'betelgeuse', nome: 'Betelgeuse', codigo: 'BET', cor: '#ff6a3d', href: 'betelgeuse.html', desenho: [
			'................',
			'.....######.....',
			'...##......##...',
			'..#...##.....#..',
			'.#...#..#.....#.',
			'.#....##...#..#.',
			'#.........#.#..#',
			'#...#......#...#',
			'#..#.#.........#',
			'#...#....##....#',
			'.#......#..#..#.',
			'.#.......##...#.',
			'..#..........#..',
			'...##......##...',
			'.....######.....',
			'................'] },
		{ id: 'eta', nome: 'Eta Carinae', codigo: 'ETA', cor: '#c8a0ff', href: 'eta-carinae.html', desenho: [
			'................',
			'.####...........',
			'#....##.........',
			'#......#........',
			'#.......#.......',
			'.#.......#......',
			'..##......#.....',
			'....##...###....',
			'....#...#####...',
			'.....#...###..#.',
			'......#......#..',
			'.......#....#...',
			'........#..#....',
			'.........##.....',
			'................',
			'................'] },
		{ id: 'sirius', nome: 'Sirius', codigo: 'SIR', cor: '#5b8cff', href: 'sirius.html', desenho: [
			'.........#......',
			'.........#......',
			'........###.....',
			'.......#####....',
			'.#############..',
			'.......#####....',
			'........###.....',
			'.........#......',
			'.........#......',
			'................',
			'...#............',
			'..###...........',
			'...#............',
			'................',
			'................',
			'................'] },
		{ id: 'caranguejo', nome: 'Nebulosa do Caranguejo', codigo: 'CRB', cor: '#9be36a', href: 'caranguejo.html', desenho: [
			'................',
			'....#..#..#.....',
			'..#.#######.#...',
			'.##.#.....#.##..',
			'..##..#.#..##...',
			'.#.#...#...#.#..',
			'.#.#..###..#.#..',
			'.#.#...#...#.#..',
			'..##..#.#..##...',
			'.##.#.....#.##..',
			'..#.#######.#...',
			'....#..#..#.....',
			'................',
			'................',
			'................',
			'................'] },
		{ id: 'proxima', nome: 'Proxima Centauri', codigo: 'PRX', cor: '#f0505a', href: 'proxima-centauri.html', desenho: [
			'................',
			'.#.#............',
			'......######....',
			'....##......##..',
			'...#..........#.',
			'..#....##......#',
			'..#...#..#.....#',
			'..#....##......#',
			'..#............#',
			'...#..........#.',
			'.##.##......##..',
			'#..#..######....',
			'#..#............',
			'.##.............',
			'................',
			'................'] },
		{ id: 'sistema', nome: 'Sistema Solar', codigo: 'SOL', cor: '#7fe3ff', href: 'sistema-solar.html', desenho: [
			'..#..#..#.......',
			'...#####........',
			'.#########......',
			'..#######.......',
			'.#########......',
			'...#####........',
			'..#..#..#.......',
			'..........###...',
			'.........#####..',
			'......###########',
			'.........#####..',
			'..........###...',
			'................',
			'..#.............',
			'................',
			'................'] }
	];
	var BRASAO = { id: 'brasao', codigo: 'PX1', cor: '#e8c46a', desenho: [
		'................',
		'.......##.......',
		'.....##..###....',
		'....#.......#...',
		'...#..####...#..',
		'..#..#....#..#..',
		'..#.#..##..#.#..',
		'..#.#.#..#.#.#..',
		'..#.#..#.#.#.#..',
		'..#..#...#..#...',
		'...#..###..#....',
		'....#.....#.....',
		'.....#####......',
		'................',
		'................',
		'................'] };

	// fonte minúscula (3 x 5) para os textos dos carimbos
	var LETRAS = {
		A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
		D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
		G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'], J: ['..#', '..#', '..#', '#.#', '.#.'],
		L: ['#..', '#..', '#..', '#..', '###'], M: ['#.#', '###', '###', '#.#', '#.#'], N: ['##.', '#.#', '#.#', '#.#', '#.#'],
		O: ['.#.', '#.#', '#.#', '#.#', '.#.'], P: ['##.', '#.#', '##.', '#..', '#..'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
		S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
		V: ['#.#', '#.#', '#.#', '#.#', '.#.'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'], Y: ['#.#', '#.#', '.#.', '.#.', '.#.'],
		'0': ['###', '#.#', '#.#', '#.#', '###'], '1': ['.#.', '##.', '.#.', '.#.', '###'], '2': ['##.', '..#', '.#.', '#..', '###'],
		'3': ['##.', '..#', '.#.', '..#', '##.'], '4': ['#.#', '#.#', '###', '..#', '..#'], '5': ['###', '#..', '##.', '..#', '##.'],
		'6': ['.##', '#..', '###', '#.#', '###'], '7': ['###', '..#', '.#.', '.#.', '.#.'], '8': ['###', '#.#', '###', '#.#', '###'],
		'9': ['###', '#.#', '###', '..#', '##.'], '.': ['...', '...', '...', '...', '.#.'], '-': ['...', '...', '###', '...', '...'],
		'*': ['...', '#.#', '.#.', '#.#', '...'], ':': ['...', '.#.', '...', '.#.', '...'], ' ': ['...', '...', '...', '...', '...']
	};
	// formato e textos de cada carimbo (como os carimbos de entrada de cada país, todos diferentes)
	var ESTILOS = {
		sagitario: { forma: 'circulo', rotulo: 'SGR A*' },
		fermi: { forma: 'hexagono', rotulo: 'FERMI' },
		orion: { forma: 'retangulo', rotulo: 'ORION' },
		pleiades: { forma: 'circulo', rotulo: 'PLEIADES' },
		helice: { forma: 'oval', rotulo: 'HELICE' },
		tabby: { forma: 'retangulo', rotulo: 'TABBY' },
		omega: { forma: 'hexagono', rotulo: 'OMEGA' },
		betelgeuse: { forma: 'circulo', rotulo: 'BETELGEUSE' },
		eta: { forma: 'oval', rotulo: 'ETA CARINAE' },
		sirius: { forma: 'hexagono', rotulo: 'SIRIUS' },
		caranguejo: { forma: 'retangulo', rotulo: 'CARANGUEJO' },
		proxima: { forma: 'circulo', rotulo: 'PROXIMA' },
		sistema: { forma: 'oval', rotulo: 'SOLAR' },
		brasao: { forma: 'circulo', rotulo: 'PX-01', rodape: 'AGENCIA' },
		ouvinte: { forma: 'circulo', rotulo: 'OUVINTE', rodape: 'ESPECIAL' },
		planetas: { forma: 'hexagono', rotulo: 'PLANETAS', rodape: 'ESPECIAL' },
		decolagem: { forma: 'oval', rotulo: 'DECOLAGEM', rodape: 'ESPECIAL' },
		especialista: { forma: 'retangulo', rotulo: 'SABE-TUDO', rodape: 'QUIZ' },
		galactico: { forma: 'circulo', rotulo: 'SABE-TUDO', rodape: 'GALAXIA' }
	};

	// Selos especiais (conquistas): ganhos fazendo coisas pelo site, além de visitar os destinos.
	// "progresso" diz quanto falta: uma lista de coisas diferentes (estações, planetas) ou um contador.
	var CONQUISTAS = [
		{ id: 'ouvinte', nome: 'Ouvinte da galáxia', desc: 'Sintonizou as 23 estações do rádio da nave', falta: 'Sintonize as 23 estações do rádio da nave', cor: '#4fd68a', lista: 'estacoes', total: 23, unidade: 'estações' },
		{ id: 'planetas', nome: 'Volta ao Sistema Solar', desc: 'Visitou o Sol e os 8 planetas', falta: 'Visite o Sol e os 8 planetas', cor: '#f0a830', lista: 'planetas', total: 9, unidade: 'astros' },
		{ id: 'decolagem', nome: 'Piloto de decolagem', desc: 'Viu a decolagem da nave 3 vezes', falta: 'Veja a decolagem da nave 3 vezes', cor: '#5ab8e8', contador: 'decolagens', total: 3, unidade: 'decolagens' },
		{ id: 'especialista', nome: 'Sabe-tudo do Sistema Solar', desc: 'Acertou os quizzes dos 8 planetas', falta: 'Acerte o quiz no fim da página de cada planeta', cor: '#3fa8b8', lista: 'quizzes', total: 8, unidade: 'quizzes' },
		{ id: 'galactico', nome: 'Sabe-tudo da Via Láctea', desc: 'Acertou os quizzes dos 12 destinos da galáxia', falta: 'Acerte o quiz no fim da página de cada destino da galáxia', cor: '#b46be8', lista: 'quizzesGalaxia', total: 12, unidade: 'quizzes' }
	];
	var ASTROS = ['sol', 'mercurio', 'venus', 'terra', 'marte', 'jupiter', 'saturno', 'urano', 'netuno'];
	function progresso(c, d) { return Math.min(c.total, c.contador ? (d[c.contador] || 0) : (d[c.lista] || []).length); }

	// ---------- Guardar ----------
	function ler() {
		var d = null;
		try { d = JSON.parse(localStorage.getItem(CHAVE)); } catch (e) {}
		if (!d || typeof d !== 'object') d = {};
		if (!d.carimbos) d.carimbos = {};
		if (typeof d.nome !== 'string') d.nome = '';
		// o selo do quiz antes valia só para Urano; agora pede os 8 planetas
		if (d.conquistas && d.conquistas.especialista && (d.quizzes || []).length < 8) delete d.conquistas.especialista;
		return d;
	}
	function salvar(d) { try { localStorage.setItem(CHAVE, JSON.stringify(d)); } catch (e) {} }
	function quantos(d) { return DESTINOS.filter(function (x) { return d.carimbos[x.id]; }).length; }
	function dataBonita(iso) {
		try { return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/\./g, ''); }
		catch (e) { return ''; }
	}
	function porId(id) { for (var i = 0; i < DESTINOS.length; i++) if (DESTINOS[i].id === id) return DESTINOS[i]; return null; }

	// ---------- Desenho do carimbo (72 x 72 pixels, ampliado na tela) ----------
	// Como um carimbo de imigração: borda dupla no formato daquele destino (círculo, hexágono,
	// retângulo ou oval) com uma faixa de pontinhos entre as bordas; o nome em cima; o ícone
	// do destino no meio (24 x 24, com tinta cheia e meio-tom pontilhado); estrelinhas dos
	// lados; a data; e "ENTRADA" ou "VISTO" embaixo. A tinta sai irregular, como de verdade.
	function hashTexto(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
	function sorte(x, y, s) {
		var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + s) | 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	}
	// giro de cada carimbo (sempre o mesmo para o mesmo destino), entre -9 e 9 graus
	function giroDe(d) { return Math.round((sorte(3, 7, hashTexto(d.id)) - 0.5) * 18); }
	function dataCurta(iso) {
		var t = iso ? new Date(iso) : new Date();
		return ('0' + t.getDate()).slice(-2) + '.' + ('0' + (t.getMonth() + 1)).slice(-2) + '.' + String(t.getFullYear()).slice(2);
	}
	// "raio" de cada formato: 1 na borda de fora, menor por dentro
	function raioForma(forma, dx, dy) {
		var ax = Math.abs(dx), ay = Math.abs(dy);
		if (forma === 'circulo') return Math.sqrt(dx * dx + dy * dy) / 34.5;
		if (forma === 'oval') return Math.sqrt(dx * dx / (35.5 * 35.5) + dy * dy / (29.5 * 29.5));
		if (forma === 'hexagono') return Math.max(ax * 0.866 + ay * 0.5, ay) / 33.5;
		return Math.pow(Math.pow(ax / 35, 8) + Math.pow(ay / 31.5, 8), 1 / 8); // retângulo de cantos redondos
	}

	// Ícones dos destinos, desenhados com formas simples em 24 x 24.
	// c(x, y) = tinta cheia; m(x, y) = meio-tom (pontilhado)
	var ICONES = {
		// selos especiais: um radinho, o Sol com as órbitas dos planetas e um foguete decolando
		ouvinte: function (c, m) {
			c(13, 1); c(14, 2); c(15, 3); c(16, 4); c(17, 5); c(18, 6); // antena
			for (var x = 2; x <= 21; x++) { c(x, 7); c(x, 20); }
			for (var y = 7; y <= 20; y++) { c(2, y); c(21, y); }
			for (y = 8; y < 20; y++) for (x = 3; x < 21; x++) {
				var r = Math.hypot(x + 0.5 - 8, y + 0.5 - 14);
				if (Math.abs(r - 4) < 0.6) c(x, y); else if (r < 3.4 && (x + y) % 2 === 0) m(x, y); // alto-falante
			}
			for (x = 13; x <= 19; x++) { c(x, 10); c(x, 12); } c(13, 11); c(19, 11); c(16, 11); // visor
			c(14, 16); c(15, 16); c(14, 17); c(15, 17); c(17, 16); c(18, 16); c(17, 17); c(18, 17); // botões
		},
		planetas: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 12, dy = (y + 0.5 - 12) * 1.6, r = Math.hypot(dx, dy);
				if (Math.hypot(x + 0.5 - 12, y + 0.5 - 12) < 3.2) c(x, y);             // o Sol
				else if ((Math.abs(r - 6.5) < 0.5 || Math.abs(r - 10) < 0.5) && (x + y) % 2 === 0) m(x, y); // órbitas
			}
			[[18, 10], [3, 14], [21, 13], [7, 6]].forEach(function (p) { c(p[0], p[1]); c(p[0] + 1, p[1]); c(p[0], p[1] + 1); c(p[0] + 1, p[1] + 1); });
			c(11, 7); c(12, 7); c(11, 16); c(12, 16); // raios do Sol
		},
		// Urano deitado: o globo com os anéis "em pé", porque o eixo é quase horizontal
		especialista: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 12, dy = y + 0.5 - 12, r = Math.hypot(dx, dy), anel = Math.hypot(dx / 3.2, dy / 11);
				if (r < 6.5 && r > 5.6) c(x, y);
				else if (r < 5.6) { if ((x + y) % 2 === 0) m(x, y); }
				else if (Math.abs(anel - 1) < 0.1) c(x, y);
			}
			for (var e = 1; e <= 4; e++) { c(5 - e + 1, 12); c(18 + e - 1, 12); } // o eixo deitado
		},
		// a Via Láctea vista de cima: o miolo cheio e dois braços em espiral
		galactico: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 12, dy = y + 0.5 - 12, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
				if (r < 2.6) { c(x, y); continue; }
				if (r > 11.5) continue;
				// distância até o braço mais perto (espiral: o ângulo cresce com o raio)
				var fase = ((a - Math.log(r) * 2.1) % Math.PI + Math.PI * 2) % Math.PI;
				var perto = Math.min(fase, Math.PI - fase);
				if (perto < 0.32) c(x, y); else if (perto < 0.62 && (x + y) % 2 === 0) m(x, y);
			}
			c(3, 3); c(20, 4); c(4, 20); m(21, 19);
		},
		decolagem: function (c, m) {
			for (var y = 1; y < 18; y++) for (var x = 6; x < 18; x++) {
				var meia = y < 6 ? (y - 1) * 0.9 + 0.5 : 4.5, dx = Math.abs(x + 0.5 - 12);
				if (Math.abs(dx - meia) < 0.7 && y > 1) c(x, y);
				else if (dx < meia && Math.hypot(x + 0.5 - 12, y + 0.5 - 8) > 1.8 && (x + y) % 3 === 0) m(x, y);
			}
			c(11, 1); c(12, 1); for (var x2 = 7; x2 <= 16; x2++) c(x2, 17);                  // ponta e base
			[[6, 14], [5, 15], [4, 16], [4, 17], [17, 14], [18, 15], [19, 16], [19, 17]].forEach(function (p) { c(p[0], p[1]); }); // aletas
			for (var f = 18; f < 23; f++) for (var g = 10; g < 14; g++) if ((f + g) % 2 === 0 || f < 20) m(g, f); // fogo
			c(11, 23); c(12, 22);
		},
		sagitario: function (c, m) {
			var gi = -0.35, cg = Math.cos(gi), sg = Math.sin(gi);
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 12, dy = y + 0.5 - 12, r = Math.sqrt(dx * dx + dy * dy);
				var X = dx * cg + dy * sg, Y = -dx * sg + dy * cg;
				var disco = (X * X) / 132 + (Y * Y) / 9;
				if (r < 4.6) continue;                       // a sombra: papel sem tinta
				if (r < 5.8) { c(x, y); continue; }           // anel de luz
				if (disco < 1 && Y > -0.5) { if (r < 8.5 || disco < 0.35) c(x, y); else m(x, y); continue; } // disco da frente
				if (Y < 0 && r < 8.2) m(x, y);                // arco de cima (o disco de trás, entortado)
				else if (disco < 1) m(x, y);
			}
			c(2, 3); c(21, 20); c(20, 2); m(3, 21);
		},
		fermi: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 12, dy = y + 0.5 - 12;
				var up = Math.abs(dy), r = Math.sqrt(dx * dx + up * up) + 0.001, fi = Math.atan2(dx, up);
				var borda = 11 * Math.pow(Math.max(0, Math.cos(fi)), 0.6);
				if (Math.abs(dy) < 0.6 && Math.abs(dx) < 11.5) { c(x, y); continue; } // o disco da galáxia
				if (Math.abs(r - borda) < 0.75) c(x, y);
				else if (r < borda) { if (r > borda - 2.2) m(x, y); else if ((x * 7 + y * 3) % 11 === 0) c(x, y); }
			}
			c(11, 11); c(12, 11); c(11, 12); c(12, 12); c(10, 11); c(13, 12);
		},
		orion: function (c, m) {
			var nuvem = [[8, 9, 6], [14, 8, 5.5], [17, 13, 5], [10, 15, 5.5], [5, 13, 3.5], [14, 17, 4]];
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dentro = 0, perto = 0;
				nuvem.forEach(function (n) { var d = Math.hypot(x + 0.5 - n[0], y + 0.5 - n[1]); if (d < n[2]) dentro++; if (Math.abs(d - n[2]) < 0.7) perto++; });
				if (dentro && perto && dentro < 2) c(x, y);
				else if (dentro) { if ((x + y * 2) % 5 === 0) c(x, y); else if (dentro > 1) m(x, y); }
			}
			// as estrelas do Trapézio, no coração da nuvem
			[[11, 11], [13, 12], [12, 14], [10, 13]].forEach(function (p) { c(p[0], p[1]); });
			[[3, 3], [20, 4], [21, 20], [2, 21]].forEach(function (p) { c(p[0], p[1]); c(p[0] + 1, p[1]); c(p[0] - 1, p[1]); c(p[0], p[1] + 1); c(p[0], p[1] - 1); });
		},
		pleiades: function (c, m) {
			var irmas = [[11, 12, 3], [4, 13, 2], [5, 9, 1], [18, 13, 2], [15, 7, 2], [14, 17, 2], [19, 4, 1], [21, 9, 1]];
			// fiapos de nebulosa azul em diagonal
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) if (((x - y + 40) % 6 === 0) && ((x * 3 + y) % 4 !== 0)) m(x, y);
			irmas.forEach(function (s) {
				c(s[0], s[1]);
				for (var k = 1; k <= s[2]; k++) { c(s[0] + k, s[1]); c(s[0] - k, s[1]); c(s[0], s[1] + k); c(s[0], s[1] - k); }
				if (s[2] > 1) { c(s[0] + 1, s[1] + 1); c(s[0] - 1, s[1] - 1); c(s[0] + 1, s[1] - 1); c(s[0] - 1, s[1] + 1); }
			});
		},
		helice: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = (x + 0.5 - 12) / 1.0, dy = (y + 0.5 - 12) / 0.8, r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
				if (r > 10.2 && r < 11.2) c(x, y);                           // borda de fora
				else if (r >= 6.5 && r <= 10.2) {
					if (r < 7.4 && Math.abs(Math.sin(a * 9)) > 0.4) c(x, y);    // nós na borda de dentro
					else if (Math.abs(Math.sin(a * 14 + r)) > 0.7) m(x, y);   // fiapos em raio
				}
				else if (r < 3.2 && r > 2.2) m(x, y);
			}
			c(12, 12); c(11, 12); c(12, 11); c(11, 11);
		},
		tabby: function (c, m) {
			for (var y = 0; y < 16; y++) for (var x = 0; x < 24; x++) {
				var r = Math.hypot(x + 0.5 - 12, y + 0.5 - 7.5);
				if (r > 6 && r < 7) c(x, y);
				else if (r <= 6) {
					var poeira = Math.abs(y + 0.5 - 7.5 - (x - 12) * 0.25) < 1.6 && x > 6;
					if (poeira) c(x, y); else if ((x + y) % 2) m(x, y);
				}
			}
			// gráfico do brilho embaixo, com as quedas estranhas
			for (var x = 1; x < 23; x++) {
				var queda = x > 6 && x < 10 ? 2 : x > 14 && x < 19 ? (x === 16 || x === 17 ? 4 : 2) : 0;
				c(x, 18 + queda);
				if (x % 2 === 0) m(x, 23);
			}
			for (var y2 = 17; y2 < 24; y2++) m(0, y2);
		},
		omega: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var r = Math.hypot(x + 0.5 - 12, (y + 0.5 - 12) * 1.05);
				var dens = Math.exp(-r / 3.6);
				var s = sorte(x, y, 77);
				if (r < 11.5 && s < dens * 1.6) c(x, y);
				else if (r < 11.5 && s < dens * 3) m(x, y);
			}
			[[4, 5], [19, 18], [18, 4]].forEach(function (p) { c(p[0] + 1, p[1]); c(p[0] - 1, p[1]); c(p[0], p[1] + 1); c(p[0], p[1] - 1); });
		},
		// Betelgeuse: a estrela enorme, com manchas, e plumas de gás saindo para um lado
		betelgeuse: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 11, dy = y + 0.5 - 13, r = Math.hypot(dx, dy);
				if (r < 8.6 && r > 7.6) c(x, y);
				else if (r < 7.6) { if (sorte(x, y, 31) < 0.35 - r * 0.02) c(x, y); else if ((x + y) % 2 === 0) m(x, y); }
				else if (r < 11.5 && dx > 0 && dy < 0 && sorte(x, y, 37) < 0.25) m(x, y); // as plumas
			}
		},
		// Eta Carinae: as duas bolhas do Homúnculo, na diagonal, e a estrela no meio
		eta: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var u = x + 0.5 - 12, v = y + 0.5 - 12, s = u * 0.75 + v * 0.66, p = -u * 0.66 + v * 0.75, lado = s >= 0 ? 1 : -1;
				var rl = Math.hypot((s - lado * 5.6) / 5.2, p / 4.4);
				if (rl < 1 && rl > 0.8) c(x, y); else if (rl < 0.8 && (x + y) % 2 === 0) m(x, y);
				if (Math.abs(s) < 0.6 && Math.abs(p) < 9 && Math.abs(p) > 2 && x % 2 === 0) c(x, y); // a saia
			}
			c(11, 11); c(12, 11); c(11, 12); c(12, 12); c(10, 11); c(13, 12); c(11, 10); c(12, 13);
		},
		// Sirius: a estrela grande com o halo e as pontas em cruz, e a companheirinha embaixo
		sirius: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 13.5, dy = y + 0.5 - 10, r = Math.hypot(dx, dy);
				if (r < 3.2) c(x, y);
				else if (Math.abs(r - 5.6) < 0.5 && (x + y) % 2 === 0) m(x, y);           // o halo
				else if ((Math.abs(dx) < 0.6 && r < 10.5) || (Math.abs(dy) < 0.6 && r < 10.5)) c(x, y); // as pontas
			}
			c(5, 18); c(4, 18); c(6, 18); c(5, 17); c(5, 19); // Sirius B
		},
		// o Caranguejo: a nuvem oval de fiapos e o pulsar no meio, com os dois feixes de farol
		caranguejo: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = (x + 0.5 - 12) / 11, dy = (y + 0.5 - 12) / 8, r = Math.hypot(dx, dy);
				if (r > 1.05) continue;
				if (r > 0.86) { if (sorte(x, y, 43) < 0.7) c(x, y); }
				else if (r > 0.25 && sorte(x, y, 47) < 0.22) c(x, y);
				else if (r > 0.25 && (x + y) % 2 === 0) m(x, y);
			}
			c(11, 11); c(12, 11); c(11, 12); c(12, 12);
			[[9, 9], [8, 8], [7, 7], [14, 14], [15, 15], [16, 16]].forEach(function (p) { c(p[0], p[1]); }); // os feixes
		},
		// Proxima: a estrela vermelha grande e, na frente, o planetinha meio iluminado
		proxima: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var r = Math.hypot(x + 0.5 - 14, y + 0.5 - 10);
				if (r < 8.6 && r > 7.6) c(x, y);
				else if (r < 7.6) { if (sorte(x, y, 53) < 0.18) c(x, y); else if ((x + y) % 2 === 0) m(x, y); }
				var rp = Math.hypot(x + 0.5 - 5, y + 0.5 - 18);
				if (rp < 3.4) { if (x + 0.5 - 5 + (y + 0.5 - 18) * -0.6 > 0) c(x, y); else if (rp > 2.6) c(x, y); }
			}
			c(2, 2); c(4, 3); // Alfa Centauri A e B, lá longe
		},
		sistema: function (c, m) {
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var rs =Math.hypot(x + 0.5 - 5, y + 0.5 - 6);
				if (rs < 3.6) c(x, y);
				else if (rs < 6 && Math.abs(Math.sin(Math.atan2(y - 6, x - 5) * 4)) > 0.85) c(x, y); // raios do Sol
				// órbita
				var ro = Math.hypot((x + 0.5 - 5) / 1.25, y + 0.5 - 6);
				if (Math.abs(ro - 14) < 0.5 && (x + y) % 2 === 0) m(x, y);
				// Saturno com o anel
				var rp = Math.hypot(x + 0.5 - 17, y + 0.5 - 16);
				var anel = Math.hypot((x + 0.5 - 17) / 2.4, (y + 0.5 - 16 + (x - 17) * 0.15));
				if (rp < 3.3) { if (rp > 2.4) c(x, y); else m(x, y); }
				else if (Math.abs(anel - 2.4) < 0.45) c(x, y);
			}
			c(10, 19); c(10, 20); c(11, 19); c(11, 20); // um planetinha na órbita
		},
		brasao: function (c, m) {
			// galáxia em espiral, o símbolo da agência
			for (var y = 0; y < 24; y++) for (var x = 0; x < 24; x++) {
				var dx = x + 0.5 - 12, dy = y + 0.5 - 12, r = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
				if (r < 2) { c(x, y); continue; }
				if (r > 11.5) continue;
				var braco = Math.cos(2 * (a - Math.log(r) * 1.6));
				if (braco > 0.75) c(x, y); else if (braco > 0.35) m(x, y);
			}
		}
	};

	function desenharCarimbo(tela, d, iso) {
		var T = 72, C = T / 2;
		tela.width = T; tela.height = T;
		var ctx = tela.getContext('2d'), img = ctx.createImageData(T, T), px = img.data;
		var r = parseInt(d.cor.substr(1, 2), 16), g = parseInt(d.cor.substr(3, 2), 16), b = parseInt(d.cor.substr(5, 2), 16);
		var s = hashTexto(d.id), estilo = ESTILOS[d.id] || { forma: 'circulo', rotulo: d.codigo };
		var forma = estilo.forma;
		// pressão da mão: a tinta sai mais forte de um lado do carimbo
		var lado = sorte(9, 9, s) * Math.PI * 2, px0 = Math.cos(lado), py0 = Math.sin(lado);
		function pinta(x, y, fraco) {
			x = Math.round(x); y = Math.round(y);
			if (x < 0 || y < 0 || x >= T || y >= T) return;
			var a = sorte(x, y, s);
			var pressao = 0.7 + 0.3 * (((x - C) * px0 + (y - C) * py0) / C * 0.5 + 0.5);
			if (a < 0.08 + (1 - pressao) * 0.25) return; // falhas da tinta
			var k = (y * T + x) * 4;
			px[k] = r; px[k + 1] = g; px[k + 2] = b;
			px[k + 3] = Math.max(px[k + 3], Math.round(255 * pressao * (fraco ? 0.55 : 1) * (a < 0.26 ? 0.72 : 1)));
		}
		function texto(str, cy) {
			var largura = str.length * 4 - 1, x0 = Math.round(C - largura / 2);
			str.split('').forEach(function (l, n) {
				var gl = LETRAS[l]; if (!gl) return;
				gl.forEach(function (linha, y) { for (var x = 0; x < 3; x++) if (linha[x] === '#') pinta(x0 + n * 4 + x, cy + y); });
			});
			return [x0, x0 + largura];
		}
		function estrelinha(x, y, tam) {
			pinta(x, y);
			for (var k = 1; k <= tam; k++) { pinta(x + k, y, k === tam); pinta(x - k, y, k === tam); pinta(x, y + k, k === tam); pinta(x, y - k, k === tam); }
		}
		// bordas: grossa por fora, faixa de pontinhos, fina por dentro
		for (var y = 0; y < T; y++) for (var x = 0; x < T; x++) {
			var rr = raioForma(forma, x + 0.5 - C, y + 0.5 - C);
			if (rr <= 1 && rr > 0.945) pinta(x, y);
			else if (rr <= 0.915 && rr > 0.875 && (x + y) % 3 === 0) pinta(x, y, true);
			else if (rr <= 0.86 && rr > 0.83) pinta(x, y);
		}
		// nome em cima, com risquinhos dos lados e uma linha tracejada embaixo
		var nome = texto(estilo.rotulo, 13);
		pinta(nome[0] - 3, 15); pinta(nome[0] - 4, 15, true); pinta(nome[1] + 2, 15); pinta(nome[1] + 3, 15, true);
		for (x = 18; x < T - 18; x++) if (x % 3 !== 2) pinta(x, 20, true);
		// ícone no meio
		var icone = ICONES[d.id];
		if (icone) icone(function (ix, iy) { pinta(24 + ix, 23 + iy); }, function (ix, iy) { if ((ix + iy) % 2 === 0) pinta(24 + ix, 23 + iy, true); });
		// estrelinhas dos lados do ícone
		estrelinha(14, 35, 2); estrelinha(57, 35, 2); estrelinha(17, 28, 1); estrelinha(54, 42, 1);
		// data entre dois tracinhos, e a palavra de baixo
		if (iso !== null) {
			var dt = texto(dataCurta(iso), 50);
			for (var k = 2; k <= 4; k++) { pinta(dt[0] - k - 1, 52, k === 4); pinta(dt[1] + k, 52, k === 4); }
		}
		var rodape = estilo.rodape !== undefined ? estilo.rodape : (forma === 'circulo' || forma === 'oval') ? 'VISTO' : 'ENTRADA';
		texto(rodape, 57);
		ctx.putImageData(img, 0, 0);
		return tela;
	}
	// iso: a data do carimbo (null = sem data, como no brasão da capa)
	function novoCarimbo(d, classe, iso) {
		var tela = document.createElement('canvas');
		tela.className = classe || 'carimbo-tela';
		tela.setAttribute('aria-hidden', 'true');
		tela.style.setProperty('--giro', giroDe(d) + 'deg');
		return desenharCarimbo(tela, d, iso);
	}

	// ---------- Nas páginas dos destinos: carimbar na primeira visita ----------
	function registrar(id) {
		var d = ler(), destino = porId(id);
		if (!destino || d.carimbos[id]) return;
		d.carimbos[id] = new Date().toISOString();
		salvar(d);
		// chegando pela primeira vez (chegada.js): o carimbo só aparece quando a alfândega bate
		if (window.Chegada && window.Chegada.ativa) { window.Chegada.carimbo = function () { mostrarCarimboNovo(destino, quantos(d)); }; return; }
		// espera o salto terminar para mostrar o carimbo
		setTimeout(function () { mostrarCarimboNovo(destino, quantos(d)); }, emSalto() ? 1500 : 900);
	}
	// Anota o que a pessoa fez (sintonizou uma estação, visitou um planeta, viu a decolagem)
	// e dá o selo especial quando completa. O rádio e a viagem chamam por window.PassaporteEspacial.
	function anotar(tipo, valor) {
		var d = ler();
		d.conquistas = d.conquistas || {};
		if (tipo === 'decolagem') d.decolagens = (d.decolagens || 0) + 1;
		else {
			var lista = tipo === 'estacao' ? 'estacoes' : tipo === 'quiz' ? 'quizzes' : tipo === 'quizGalaxia' ? 'quizzesGalaxia' : 'planetas';
			d[lista] = d[lista] || [];
			if (d[lista].indexOf(valor) >= 0) return;
			d[lista].push(valor);
		}
		var ganhas = CONQUISTAS.filter(function (c) {
			if (d.conquistas[c.id] || progresso(c, d) < c.total) return false;
			d.conquistas[c.id] = new Date().toISOString();
			return true;
		});
		salvar(d);
		// na decolagem, espera a nave chegar na galáxia para mostrar o selo
		ganhas.forEach(function (c, i) { setTimeout(function () { mostrarConquista(c); }, (tipo === 'decolagem' ? 3500 : emSalto() ? 1500 : 900) + i * 600); });
	}
	window.PassaporteEspacial = { anotar: anotar };

	function mostrarConquista(c) {
		var aviso = document.createElement('div');
		aviso.className = 'carimbo-novo conquista-nova';
		aviso.setAttribute('role', 'status');
		aviso.style.setProperty('--cor-carimbo', c.cor);
		aviso.appendChild(novoCarimbo(c, null, ler().conquistas[c.id]));
		var texto = document.createElement('div');
		texto.className = 'carimbo-novo-texto';
		texto.innerHTML = '<p>Selo especial conquistado!</p><strong>' + c.nome + '</strong><span>' + c.desc + '</span>' +
			'<a href="index.html#conquistas">Ver conquistas &rarr;</a>';
		aviso.appendChild(texto);
		var fechar = document.createElement('button');
		fechar.type = 'button';
		fechar.className = 'carimbo-novo-fechar';
		fechar.setAttribute('aria-label', 'Fechar aviso');
		fechar.innerHTML = '&times;';
		aviso.appendChild(fechar);
		document.body.appendChild(aviso);
		var tempo = setTimeout(tirar, 10000);
		fechar.addEventListener('click', tirar);
		function tirar() {
			clearTimeout(tempo);
			aviso.classList.add('saindo');
			setTimeout(function () { aviso.remove(); }, calmo ? 0 : 400);
		}
	}

	// a página acabou de chegar por um salto? (a tela das estrelas de transicao.js ainda está à mostra)
	function emSalto() {
		var t = document.querySelector('canvas.transicao');
		return document.documentElement.classList.contains('em-salto') || !!(t && t.style.display === 'block');
	}
	function mostrarCarimboNovo(destino, total) {
		var completo = total === DESTINOS.length;
		var aviso = document.createElement('div');
		aviso.className = 'carimbo-novo';
		aviso.setAttribute('role', 'status');
		aviso.style.setProperty('--cor-carimbo', destino.cor);
		aviso.appendChild(novoCarimbo(destino, null, ler().carimbos[destino.id]));
		var texto = document.createElement('div');
		texto.className = 'carimbo-novo-texto';
		texto.innerHTML = '<p>' + (completo ? 'Passaporte completo!' : 'Carimbo novo no passaporte') + '</p>' +
			'<strong>' + destino.nome.replace('*', '<span class="ast">*</span>') + '</strong>' +
			'<span>' + (completo ? 'Seu certificado de Turista da Via Láctea está pronto.' : total + ' de ' + DESTINOS.length + ' destinos visitados') + '</span>' +
			'<a href="index.html#passaporte">Ver passaporte &rarr;</a>';
		aviso.appendChild(texto);
		var fechar = document.createElement('button');
		fechar.type = 'button';
		fechar.className = 'carimbo-novo-fechar';
		fechar.setAttribute('aria-label', 'Fechar aviso');
		fechar.innerHTML = '&times;';
		fechar.addEventListener('click', function () { tirar(); });
		aviso.appendChild(fechar);
		document.body.appendChild(aviso);
		var tempo = setTimeout(tirar, completo ? 12000 : 8000);
		function tirar() {
			clearTimeout(tempo);
			aviso.classList.add('saindo');
			setTimeout(function () { aviso.remove(); }, calmo ? 0 : 400);
		}
	}

	// ---------- Na Via Láctea: o botão e o livrinho do passaporte ----------
	var botao = null;
	function montarBotao(galaxia) {
		botao = document.createElement('button');
		botao.type = 'button';
		botao.className = 'botao-passaporte';
		botao.id = 'abrir-passaporte';
		botao.addEventListener('click', abrir);
		galaxia.appendChild(botao);
		atualizarBotao();
	}
	function atualizarBotao() {
		if (!botao) return;
		var d = ler(), n = quantos(d), mostrados = d.mostrados || [];
		var novos = DESTINOS.filter(function (x) { return d.carimbos[x.id] && mostrados.indexOf(x.id) < 0; }).length;
		botao.classList.toggle('completo', n === DESTINOS.length);
		// um passaportezinho que abre ao passar o mouse, o nome, uma fileira de carimbos
		// (um pontinho colorido por destino) e um aviso quando tem carimbo novo para bater
		var pontos = DESTINOS.map(function (x) {
			return '<i class="' + (d.carimbos[x.id] ? 'feito' : '') + '" style="--c:' + x.cor + '"></i>';
		}).join('');
		botao.innerHTML =
			'<span class="bp-livro" aria-hidden="true"><span class="bp-pagina"><i></i></span><span class="bp-capa"></span></span>' +
			'<span class="bp-texto"><span class="bp-titulo">Passaporte</span><span class="bp-carimbos" aria-hidden="true">' + pontos + '</span></span>' +
			'<b class="bp-contagem">' + n + '<small>/' + DESTINOS.length + '</small></b>' +
			(novos ? '<span class="bp-novo">' + (novos > 1 ? novos + ' novos' : 'novo') + '</span>' : '');
		botao.setAttribute('aria-label', 'Abrir passaporte: ' + n + ' de ' + DESTINOS.length + ' carimbos' + (novos ? ', ' + novos + ' para carimbar' : ''));
	}

	// ---------- O passaporte aberto ----------
	// Como um passaporte de verdade: primeiro aparece a capa (azul-marinho, letras douradas,
	// o brasão e o símbolo do chip); ela abre como um livro e mostra a página de dados
	// (foto, campos em português e inglês, assinatura e as duas linhas de letras de máquina
	// lá embaixo) e, ao lado, a página de vistos com os carimbos espalhados.
	// Carimbos que ainda não apareceram no passaporte são batidos na hora, com o carimbador.
	var dialogo = null, livroAberto = false, aoClicarFora = null; // livroAberto: o passaporte estava aberto (para voltar igual)
	function abrir(visao) {
		if (typeof visao !== 'string') visao = null; // (quando vem do clique, chega o evento)
		if (!dialogo) {
			dialogo = document.createElement('dialog');
			dialogo.className = 'passaporte';
			dialogo.setAttribute('aria-label', 'Passaporte da Via Láctea');
			// clicar fora: se o passaporte estiver aberto, ele fecha; senão, a aba de documentos fecha
			dialogo.addEventListener('click', function (e) {
				if (e.target !== dialogo && !e.target.classList.contains('doc-holo') && !e.target.classList.contains('pp-dica-abrir')) return;
				if (aoClicarFora && aoClicarFora()) return;
				dialogo.close();
			});
			dialogo.addEventListener('close', atualizarBotao);
			document.body.appendChild(dialogo);
		}
		livroAberto = false; // abrindo de novo, o passaporte começa fechado
		montarLivro(visao);
		if (dialogo.showModal) dialogo.showModal(); else dialogo.setAttribute('open', '');
	}

	// ---------- Estampas espaciais do passaporte (desenhadas uma vez) ----------
	// papel: órbitas pontilhadas, uma galáxia espiral d'água no meio, constelações e estrelinhas,
	// tudo em tinta bem clara, como a estampa de segurança de um passaporte de verdade.
	// capa: estrelas e constelações douradas, como gravadas em ouro no couro.
	var estampasProntas = false;
	function estampasEspaciais() {
		if (estampasProntas) return;
		estampasProntas = true;
		function constelacao(ctx, pts, cor) {
			ctx.strokeStyle = cor; ctx.fillStyle = cor; ctx.lineWidth = 1;
			ctx.beginPath(); pts.forEach(function (p, i) { if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }); ctx.stroke();
			pts.forEach(function (p) { ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); });
		}
		function estrelinha(ctx, x, y, t, cor) { ctx.fillStyle = cor; ctx.fillRect(x - t, y, t * 2 + 1, 1); ctx.fillRect(x, y - t, 1, t * 2 + 1); }
		// papel
		var p = document.createElement('canvas'); p.width = 440; p.height = 600;
		var c = p.getContext('2d'), cx = 220, cy = 310;
		c.save(); c.translate(cx, cy); c.rotate(-0.26);
		for (var r = 40; r <= 210; r += 26) {
			for (var a = 0; a < Math.PI * 2; a += 0.025) if (Math.floor(a / 0.05) % 2 === 0) { c.fillStyle = 'rgba(80, 100, 170, 0.08)'; c.fillRect(Math.cos(a) * r, Math.sin(a) * r * 0.42, 1.5, 1.5); }
		}
		for (var braco = 0; braco < 2; braco++) for (var t = 0; t < 1; t += 0.004) {
			var rr = 6 + t * 80, aa = braco * Math.PI + t * 7;
			for (var k = 0; k < 2; k++) { c.fillStyle = 'rgba(120, 90, 190, ' + (0.09 - t * 0.05) + ')'; c.fillRect(Math.cos(aa) * rr + (Math.random() - 0.5) * 6, (Math.sin(aa) * rr + (Math.random() - 0.5) * 6) * 0.45, 2, 2); }
		}
		c.fillStyle = 'rgba(180, 140, 220, 0.12)'; c.beginPath(); c.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); c.fill();
		c.restore();
		constelacao(c, [[300, 70], [330, 92], [362, 84], [388, 118], [372, 150]], 'rgba(70, 110, 170, 0.14)');
		constelacao(c, [[60, 470], [92, 452], [118, 480], [150, 468], [170, 500]], 'rgba(70, 110, 170, 0.14)');
		constelacao(c, [[70, 120], [96, 96], [120, 112]], 'rgba(150, 110, 60, 0.12)');
		for (var n = 0; n < 40; n++) estrelinha(c, Math.random() * 440, Math.random() * 600, Math.random() < 0.3 ? 2 : 1, 'rgba(150, 120, 60, 0.14)');
		// capa
		var q = document.createElement('canvas'); q.width = 440; q.height = 616;
		var d = q.getContext('2d');
		for (n = 0; n < 160; n++) { var b = Math.random(); d.fillStyle = 'rgba(226, 192, 106, ' + (0.15 + b * 0.45) + ')'; d.fillRect(Math.random() * 440, Math.random() * 616, b > 0.85 ? 2 : 1, b > 0.85 ? 2 : 1); }
		for (n = 0; n < 10; n++) estrelinha(d, 20 + Math.random() * 400, 20 + Math.random() * 576, 3, 'rgba(240, 210, 130, 0.55)');
		constelacao(d, [[40, 60], [80, 40], [118, 72], [150, 52]], 'rgba(226, 192, 106, 0.45)');      // em cima, à esquerda
		constelacao(d, [[300, 540], [340, 520], [372, 548], [404, 528], [420, 566]], 'rgba(226, 192, 106, 0.45)'); // embaixo, à direita
		constelacao(d, [[360, 70], [392, 96], [380, 130]], 'rgba(226, 192, 106, 0.4)');
		var raiz = document.documentElement.style;
		raiz.setProperty('--pp-papel', 'url(' + p.toDataURL() + ')');
		raiz.setProperty('--pp-capa', 'url(' + q.toDataURL() + ')');
	}

	// holograma 3D: o documento inclina na direção do mouse e um brilho furta-cor corre por cima,
	// como os hologramas de segurança dos documentos de verdade (as camadas ficam no CSS)
	function holograma(el) {
		var w = document.createElement('div');
		w.className = 'doc-holo';
		w.appendChild(el);
		if (calmo) return w;
		// ao aparecer, o documento passa pelo leitor: uma linha de laser desce e vai revelando tudo
		w.classList.add('escaneando');
		var laser = document.createElement('span');
		laser.className = 'doc-scan';
		laser.setAttribute('aria-hidden', 'true');
		w.appendChild(laser);
		// os hologramas (a nave da carteira, a galáxia do certificado) começam desligados e só
		// "ligam" depois que o leitor termina de passar: primeiro o projetor, depois o feixe e a imagem
		var holos = w.querySelectorAll('.holograma');
		holos.forEach(function (h) { h.classList.add('desligada'); });
		setTimeout(function () { w.classList.remove('escaneando'); laser.remove(); }, 1300);
		setTimeout(function () { holos.forEach(function (h) { h.classList.remove('desligada'); }); }, 1450);
		w.addEventListener('pointermove', function (e) {
			var r = w.getBoundingClientRect();
			w.style.setProperty('--hx', Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)).toFixed(3));
			w.style.setProperty('--hy', Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2)).toFixed(3));
			w.classList.add('holo-ativo');
		});
		w.addEventListener('pointerleave', function () {
			w.style.setProperty('--hx', 0); w.style.setProperty('--hy', 0);
			w.classList.remove('holo-ativo');
		});
		return w;
	}

	function botaoFechar() {
		var fechar = document.createElement('button');
		fechar.type = 'button';
		fechar.className = 'passaporte-fechar';
		fechar.innerHTML = 'Fechar &times;';
		fechar.addEventListener('click', function () { dialogo.close(); });
		return fechar;
	}

	// número do passaporte: sorteado uma vez e guardado
	function numeroDe(d) {
		if (!d.numero) { d.numero = 'PX' + String(Math.floor(1000000 + Math.random() * 8999999)); salvar(d); }
		return d.numero;
	}
	// nome sem acentos e em maiúsculas, como nas linhas de máquina
	function semAcento(s) { return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z ]/g, ' ').trim(); }
	// dígito verificador dos passaportes de verdade (pesos 7, 3, 1)
	function digito(s) {
		var pesos = [7, 3, 1], soma = 0;
		for (var i = 0; i < s.length; i++) {
			var c = s[i], v = c === '<' ? 0 : /[0-9]/.test(c) ? +c : c.charCodeAt(0) - 55;
			soma += v * pesos[i % 3];
		}
		return String(soma % 10);
	}
	function aaMmDd(iso) { var t = iso ? new Date(iso) : new Date(); return String(t.getFullYear()).slice(2) + ('0' + (t.getMonth() + 1)).slice(-2) + ('0' + t.getDate()).slice(-2); }
	function linhasDeMaquina(d, emitido) {
		var partes = semAcento(d.nome || 'Viajante').split(/\s+/).filter(Boolean);
		var sobrenome = partes.length > 1 ? partes.pop() : partes[0];
		var nomes = partes.length && partes[0] !== sobrenome ? partes.join('<') : '';
		var l1 = ('P<VLC' + sobrenome + '<<' + nomes);
		while (l1.length < 44) l1 += '<';
		var num = numeroDe(d).slice(0, 9), dt = aaMmDd(emitido);
		var l2 = num + digito(num) + 'TRQ' + dt + digito(dt) + 'X' + '999999' + digito('999999') + 'VIALACTEA';
		while (l2.length < 43) l2 += '<';
		l2 += digito(l2);
		return [l1.slice(0, 44), l2.slice(0, 44)];
	}

	// foto do passaporte: uma astronauta em pixel art (48 x 60), pixel a pixel, com luz vindo de
	// cima e da esquerda:
	//  - capacete branco com 6 tons de sombra, brilho forte em cima e um aro em volta da viseira;
	//  - viseira dourada espelhada (como as de verdade), refletindo a Via Láctea em espiral,
	//    estrelas e o brilho da lanterna;
	//  - lanterna, fones com luzinha e uma antena com a ponta vermelha;
	//  - anel do pescoço com parafusos;
	//  - traje com dobras, mangueira, painel de controle com telinha e botões, distintivo
	//    dourado da agência e a bandeirinha no ombro.
	function desenharFoto(tela) {
		var L = 48, A = 60;
		tela.width = L; tela.height = A;
		var ctx = tela.getContext('2d'), img = ctx.createImageData(L, A);
		var cor = new Array(L * A);
		var B4 = [0, 0.5, 0.75, 0.25];
		function hex(h) { return [parseInt(h.substr(1, 2), 16), parseInt(h.substr(3, 2), 16), parseInt(h.substr(5, 2), 16)]; }
		function rampa(lista) { return lista.map(hex); }
		var BRANCO = rampa(['#ffffff', '#f1f0f7', '#dedcea', '#c3c0d6', '#9f9bb9', '#77738f']);
		var OURO = rampa(['#3a1e08', '#6a3a10', '#a8661c', '#d89a34', '#f2c45c', '#fff0b0']);
		var METAL = rampa(['#e4e8f2', '#b4bccf', '#8890a8', '#5e6680']);
		function tom(lista, v, x, y) { return lista[Math.max(0, Math.min(lista.length - 1, Math.floor(v * lista.length + B4[(x & 1) + ((y & 1) << 1)] * 0.9 - 0.45)))]; }
		function p(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < L && y < A) cor[y * L + x] = c; }
		var x, y;

		// ---- traje ----
		for (y = 40; y < A; y++) for (x = 0; x < L; x++) {
			var meia = Math.min(23, 11 + (y - 40) * 1.5);
			var dx = x + 0.5 - 24;
			if (Math.abs(dx) > meia) continue;
			var v = 0.1 + Math.pow(Math.abs(dx) / meia, 2) * 0.55 + (y - 40) / 20 * 0.2 + (dx > 0 ? 0.08 : 0);
			// dobras do tecido
			if (Math.abs((x - y * 0.6) % 9) < 0.8 && Math.abs(dx) > 7) v += 0.25;
			p(x, y, tom(BRANCO, v, x, y));
		}
		// costura do ombro
		for (x = 4; x <= 44; x++) { var yc = 47 + Math.abs(x - 24) * 0.08; if (Math.abs(x - 24) > 12) p(x, yc, BRANCO[4]); }
		// mangueira saindo do peito para o lado do capacete
		for (var t = 0; t <= 1; t += 0.04) {
			var hx = 34 + 6 * t + 2 * Math.sin(t * 3), hy = 50 - 14 * t;
			p(hx, hy, hex('#6f86b8')); p(hx + 1, hy, hex('#93a8d6'));
		}
		// painel de controle no peito
		for (y = 47; y <= 57; y++) for (x = 17; x <= 30; x++) {
			var borda = y === 47 || y === 57 || x === 17 || x === 30;
			p(x, y, hex(borda ? '#5b6a94' : y === 48 ? '#b9c6e6' : '#8c9cc6'));
		}
		for (x = 19; x <= 26; x++) for (y = 49; y <= 52; y++) p(x, y, hex((x + y) % 3 === 0 ? '#7fe3ff' : '#123048')); // telinha
		for (x = 20; x <= 25; x++) p(x, 50, hex('#9ff0ff'));
		p(28, 49, hex('#ff5a5a')); p(28, 51, hex('#ffd25a')); p(28, 53, hex('#7dff9a'));
		p(20, 55, hex('#5ac8ff')); p(22, 55, hex('#5ac8ff')); p(24, 55, hex('#ff8ad8')); p(26, 55, hex('#5ac8ff'));
		// distintivo dourado da agência (ombro esquerdo)
		for (y = 46; y <= 52; y++) for (x = 6; x <= 12; x++) {
			var dd = Math.hypot(x - 9, y - 49);
			if (dd <= 3.4) p(x, y, dd > 2.6 ? hex('#a8761c') : dd < 1 ? hex('#fff0b0') : hex('#e8c46a'));
		}
		// bandeirinha (ombro direito)
		for (y = 46; y <= 50; y++) for (x = 36; x <= 41; x++) p(x, y, hex(y === 48 ? '#ff8ad8' : (y === 46 || y === 50) ? '#2a3a9a' : '#4a6cff'));
		p(37, 47, hex('#ffffff'));

		// ---- anel do pescoço, com parafusos ----
		for (y = 37; y <= 41; y++) for (x = 12; x <= 36; x++) {
			var vm = (y - 37) / 4 + Math.abs(x - 24) / 40;
			p(x, y, tom(METAL, vm, x, y));
		}
		for (x = 14; x <= 34; x += 4) p(x, 39, hex('#454b60'));

		// ---- capacete ----
		var hcx = 24, hcy = 21, hr = 17;
		for (y = 0; y < 40; y++) for (x = 0; x < L; x++) {
			var ux = (x + 0.5 - hcx) / hr, uy = (y + 0.5 - hcy) / hr, rr = ux * ux + uy * uy;
			if (rr > 1) continue;
			var z = Math.sqrt(1 - rr), luz = Math.max(0, -0.5 * ux - 0.55 * uy + 0.67 * z);
			var vh = 1 - luz;
			// brilho forte em cima, à esquerda
			if (Math.hypot(ux + 0.42, uy + 0.55) < 0.16) vh = 0;
			p(x, y, tom(BRANCO, vh, x, y));
		}
		// fones dos lados, com luzinha
		[[7, 22, '#7fe3ff'], [41, 22, '#7fe3ff']].forEach(function (f) {
			for (y = f[1] - 5; y <= f[1] + 5; y++) for (x = f[0] - 3; x <= f[0] + 3; x++) {
				var d2 = (x - f[0]) * (x - f[0]) / 10 + (y - f[1]) * (y - f[1]) / 26;
				if (d2 <= 1) p(x, y, d2 > 0.6 ? METAL[3] : d2 > 0.25 ? METAL[1] : hex(f[2]));
			}
		});
		// antena no fone direito, com a ponta vermelha
		for (y = 6; y <= 16; y++) p(42 + (16 - y) * 0.15, y, METAL[2]);
		p(43, 5, hex('#ff5a5a')); p(44, 5, hex('#ff8a7a')); p(43, 4, hex('#ff5a5a'));
		// lanterna no alto, à esquerda
		for (x = 12; x <= 17; x++) for (y = 4; y <= 7; y++) p(x, y, y === 4 ? METAL[1] : y === 7 ? METAL[3] : (x > 13 && x < 16) ? hex('#fff6c8') : METAL[2]);
		// aro em volta da viseira
		var vcx = 24, vcy = 23, vrx = 14, vry = 11;
		for (y = 8; y < 38; y++) for (x = 6; x < 42; x++) {
			var e = Math.pow((x + 0.5 - vcx) / (vrx + 1.6), 2) + Math.pow((y + 0.5 - vcy) / (vry + 1.6), 2);
			if (e <= 1) p(x, y, METAL[e > 0.86 ? 3 : 2]);
		}
		// viseira dourada espelhada
		for (y = 8; y < 38; y++) for (x = 6; x < 42; x++) {
			var vx = (x + 0.5 - vcx) / vrx, vy = (y + 0.5 - vcy) / vry, rv = vx * vx + vy * vy;
			if (rv > 1) continue;
			// mais escura no meio, dourada nas bordas (reflexo), mais clara embaixo
			var vv = 0.12 + rv * 0.5 + (vy + 1) * 0.12;
			var c = tom(OURO, vv, x, y);
			// a Via Láctea refletida: um disco espiral de pontinhos cor de creme e azul
			var gx = vx - 0.18, gy = (vy + 0.05) * 1.6, rg = Math.sqrt(gx * gx + gy * gy), ag = Math.atan2(gy, gx);
			if (rg < 0.42) {
				var braco = Math.cos(2 * (ag - Math.log(rg + 0.02) * 1.8));
				if (rg < 0.07) c = hex('#fff6dc');
				else if (braco > 0.6 && sorte(x, y, 5) < 0.85 - rg) c = rg < 0.2 ? hex('#ffe8b8') : hex('#b8c8ff');
			}
			// estrelas
			if (sorte(x, y, 11) < 0.035 && rv < 0.8) c = hex('#ffffff');
			// brilho curvo da lanterna (em cima, à esquerda) e um menor embaixo, à direita
			var arco = Math.hypot(vx + 0.25, vy + 0.15);
			if (Math.abs(arco - 0.62) < 0.06 && vx < 0 && vy < -0.05) c = vx < -0.45 ? hex('#ffffff') : hex('#fff2c8');
			if (Math.hypot(vx - 0.55, vy - 0.5) < 0.09) c = hex('#ffe9a8');
			p(x, y, c);
		}

		// ---- contorno escuro em volta de tudo ----
		var contorno = hex('#241c3a');
		var final = cor.slice();
		function vazio(a, b) { return a < 0 || b < 0 || a >= L || b >= A || !cor[b * L + a]; }
		for (y = 0; y < A; y++) for (x = 0; x < L; x++) {
			if (!cor[y * L + x]) continue;
			if (vazio(x - 1, y) || vazio(x + 1, y) || vazio(x, y - 1) || (y < A - 1 && vazio(x, y + 1))) final[y * L + x] = contorno;
		}
		for (var k = 0; k < L * A; k++) {
			var c2 = final[k]; if (!c2) continue;
			img.data[k * 4] = c2[0]; img.data[k * 4 + 1] = c2[1]; img.data[k * 4 + 2] = c2[2]; img.data[k * 4 + 3] = 255;
		}
		ctx.putImageData(img, 0, 0);
		return tela;
	}

	// o carimbador (de madeira, com a borracha na cor da tinta), 16 x 16
	var CARIMBADOR = [
		'.....kkkkkk.....',
		'....kkkkkkkk....',
		'....kkKkkkkk....',
		'....dkkkkkkd....',
		'.....dddddd.....',
		'......dddd......',
		'......dddd......',
		'......dddd......',
		'.....dddddd.....',
		'..dddddddddddd..',
		'.ddDddddddddddd.',
		'.dddddddddddddd.',
		'.MMMMMMMMMMMMMM.',
		'mmmmmmmmmmmmmmmm',
		'.rrrrrrrrrrrrrr.',
		'.rrrrrrrrrrrrrr.'];
	function desenharCarimbador(tela, corTinta) {
		var r = parseInt(corTinta.substr(1, 2), 16), g = parseInt(corTinta.substr(3, 2), 16), b = parseInt(corTinta.substr(5, 2), 16);
		var cores = { k: [214, 150, 86], K: [240, 196, 140], d: [140, 88, 46], D: [176, 116, 64], M: [92, 100, 120], m: [160, 168, 186], r: [r, g, b] };
		tela.width = 16; tela.height = 16;
		var ctx = tela.getContext('2d'), img = ctx.createImageData(16, 16);
		CARIMBADOR.forEach(function (linha, y) {
			for (var x = 0; x < 16; x++) {
				var c = cores[linha[x]]; if (!c) continue;
				var k = (y * 16 + x) * 4;
				img.data[k] = c[0]; img.data[k + 1] = c[1]; img.data[k + 2] = c[2]; img.data[k + 3] = 255;
			}
		});
		ctx.putImageData(img, 0, 0);
		return tela;
	}

	// uma página de vistos (os carimbos dos destinos, com vagas vazias para os que faltam)
	function paginaVistos(d, n, lista, inicio, numero, classe, novos) {
		var mostrados = d.mostrados || [];
		var pag = document.createElement('section');
		pag.className = 'pp-pagina pp-vistos ' + classe;
		pag.innerHTML = '<header class="pp-cabecalho"><span>Vistos</span><span>Visas</span></header>';
		var area = document.createElement('div');
		area.className = 'pp-carimbos';
		lista.forEach(function (x, j) {
			var i = inicio + j, s = hashTexto(x.id);
			var vaga = document.createElement('div');
			vaga.className = 'pp-vaga';
			vaga.style.setProperty('--cor-carimbo', x.cor);
			// espalhados como num passaporte de verdade: duas colunas, com um desvio de cada lado
			vaga.style.setProperty('--dx', Math.round((sorte(1, i, s) - 0.5) * 22) + 'px');
			vaga.style.setProperty('--dy', Math.round((sorte(2, i, s) - 0.5) * 16) + 'px');
			var nome = x.nome.replace('*', '<span class="ast">*</span>');
			if (d.carimbos[x.id]) {
				var marca = document.createElement('div');
				marca.className = 'pp-carimbo';
				marca.style.setProperty('--giro', giroDe(x) + 'deg');
				marca.appendChild(novoCarimbo(x, null, d.carimbos[x.id])); // a data vai dentro do carimbo
				marca.title = x.nome + ': clique para carimbar de novo';
				marca.addEventListener('click', function () { carimbar(vaga, marca, x); });
				vaga.appendChild(marca);
				if (mostrados.indexOf(x.id) < 0) { marca.classList.add('esperando'); novos.push({ vaga: vaga, marca: marca, destino: x }); }
			} else {
				vaga.classList.add('vazia');
				vaga.innerHTML = '<span class="pp-vaga-nome">' + nome + '</span>';
			}
			area.appendChild(vaga);
		});
		pag.appendChild(area);
		pag.insertAdjacentHTML('beforeend', '<footer class="pp-rodape"><span>' + n + ' / ' + DESTINOS.length + '</span><span>' + numero + '</span></footer>');
		return pag;
	}
	// a capa do passaporte: a frente azul com o brasão e, no verso, a página de dados (a mesa do embarque usa também)
	function capaDoPassaporte(d, datas, n, completo) {
		var capa = document.createElement('div');
		capa.className = 'pp-capa';
		var frente = document.createElement('div');
		frente.className = 'pp-capa-frente';
		frente.innerHTML = '<p class="pp-capa-agencia">Agência de turismo espacial</p>';
		// o brasão com órbitas douradas em volta, como um planeta gravado na capa
		var emblema = document.createElement('span');
		emblema.className = 'pp-capa-emblema';
		emblema.innerHTML = '<i class="pp-orbita"></i><i class="pp-orbita"></i><b class="pp-lua"></b>';
		emblema.appendChild(novoCarimbo(BRASAO, 'pp-capa-brasao', null));
		frente.appendChild(emblema);
		frente.insertAdjacentHTML('beforeend',
			'<p class="pp-capa-titulo">Passaporte</p><p class="pp-capa-sub">Via Láctea · Milky Way</p>' +
			'<span class="pp-capa-chip" aria-hidden="true"></span>');
		capa.appendChild(frente);

		var verso = document.createElement('section');
		verso.className = 'pp-pagina pp-dados pp-capa-verso';
		var linhas = linhasDeMaquina(d, datas[0]);
		verso.innerHTML =
			'<header class="pp-cabecalho"><span>Passaporte · Passport</span><span>Via Láctea</span></header>' +
			'<div class="pp-dados-corpo">' +
				'<div class="pp-foto"><canvas aria-hidden="true"></canvas></div>' +
				'<dl class="pp-campos">' +
					'<div class="curto"><dt>Tipo / Type</dt><dd>P</dd></div>' +
					'<div class="curto"><dt>Código / Code</dt><dd>VLC</dd></div>' +
					'<div class="curto"><dt>Nº / No.</dt><dd class="pp-numero"></dd></div>' +
					'<div class="pp-campo-nome"><dt><label for="pp-nome">Nome / Name</label></dt><dd><input id="pp-nome" type="text" maxlength="32" autocomplete="off" placeholder="Escreva seu nome"></dd></div>' +
					'<div><dt>Nacionalidade / Nationality</dt><dd>Terráquea</dd></div>' +
					'<div><dt>Nave / Ship</dt><dd>PX-01 Millennium Falcon</dd></div>' +
					'<div><dt>Emissão / Issue</dt><dd>' + (d.embarque || datas[0] ? dataBonita(d.embarque || datas[0]).toUpperCase() : '—') + '</dd></div>' +
					'<div><dt>Validade / Expiry</dt><dd>Até o fim do universo</dd></div>' +
				'</dl>' +
			'</div>' +
			'<div class="pp-assinatura"><span class="pp-assinatura-nome"></span><small>Assinatura / Signature</small></div>' +
			'<div class="pp-progresso"><span>Destinos visitados</span><b>' + n + ' de ' + DESTINOS.length + '</b></div>' +
			'<div class="pp-maquina" aria-hidden="true"><span></span><span></span></div>';
		verso.querySelector('.pp-numero').textContent = numeroDe(d);
		desenharFoto(verso.querySelector('.pp-foto canvas'));
		var campo = verso.querySelector('input');
		var assinatura = verso.querySelector('.pp-assinatura-nome');
		var maquina = verso.querySelectorAll('.pp-maquina span');
		function atualizarNome() {
			var atual = ler(); atual.nome = campo.value.trim(); salvar(atual);
			assinatura.textContent = atual.nome;
			var l = linhasDeMaquina(atual, datas[0]);
			maquina[0].textContent = l[0]; maquina[1].textContent = l[1];
		}
		campo.value = d.nome;
		assinatura.textContent = d.nome;
		maquina[0].textContent = linhas[0]; maquina[1].textContent = linhas[1];
		campo.addEventListener('input', atualizarNome);
		if (d.embarque) {
			// o carimbo verde de EMBARQUE APROVADO, batido na recepção da agência, do lado da assinatura
			verso.querySelector('.pp-assinatura').appendChild(carimboEmbarque(d.embarque));
		}
		if (completo) {
			// selo holográfico de Turista da Via Láctea, colado na página de dados
			var selo = document.createElement('button');
			selo.type = 'button';
			selo.className = 'pp-selo';
			selo.innerHTML = '<span class="pp-selo-anel" aria-hidden="true"></span><span class="pp-selo-brilho" aria-hidden="true"></span>' +
				'<span class="pp-selo-texto"><span>Turista da<br>Via Láctea</span><small>ver certificado</small></span>';
			selo.addEventListener('click', function () { montarLivro('certificado'); });
			paralaxe(selo);
			verso.appendChild(selo);
		}
		capa.appendChild(verso);
		return { capa: capa, frente: frente, verso: verso };
	}

	// visao: 'passaporte' (padrão), 'carteira' ou 'certificado'; jaAberto: o passaporte já aparece aberto
	function montarLivro(visao, jaAberto) {
		visao = visao || 'passaporte';
		estampasEspaciais();
		var d = ler(), n = quantos(d), completo = n === DESTINOS.length;
		var datas = DESTINOS.map(function (x) { return d.carimbos[x.id]; }).filter(Boolean).sort();
		dialogo.innerHTML = '';
		dialogo.className = 'passaporte mostra-' + visao;
		dialogo.appendChild(botaoFechar());
		dialogo.appendChild(abasDocumentos(visao, completo));
		aoClicarFora = null; // (carteira, certificado e conquistas não têm livro para fechar)
		if (visao === 'certificado' && completo) { var cert = certificado(d, datas); dialogo.appendChild(holograma(cert)); caberNaTela(cert); return; }
		if (visao === 'carteira') { dialogo.appendChild(holograma(carteira(d, datas))); return; }
		if (visao === 'conquistas') { dialogo.appendChild(holograma(paginaConquistas(d))); return; }
		if (visao === 'bilhete') { dialogo.appendChild(holograma(bilheteEmbarque(d))); return; }

		var livro = document.createElement('div');
		livro.className = 'pp-livro';

		// ---- páginas de vistos: uma folha (frente e verso) que vira como a capa, e embaixo dela o diário ----
		// frente da folha (página 3): os 6 primeiros carimbos; verso (página 4): os outros;
		// embaixo da folha (página 5): o diário de bordo, com a data de cada visita
		var novosFrente = [], novosVerso = [];
		var POR_PAGINA = 7; // (13 destinos: 7 na página 3 e 6 na página 4, em quatro fileiras)
		var vistos = paginaVistos(d, n, DESTINOS.slice(0, POR_PAGINA), 0, 3, 'pp-folha-frente', novosFrente);
		var vistos2 = paginaVistos(d, n, DESTINOS.slice(POR_PAGINA), POR_PAGINA, 4, 'pp-folha-verso', novosVerso);
		if (n > 0) {
			var zerar = document.createElement('button');
			zerar.type = 'button';
			zerar.className = 'pp-zerar';
			zerar.textContent = 'Passaporte novo';
			zerar.addEventListener('click', function () {
				if (!confirm('Apagar todos os carimbos e começar um passaporte novo?')) return;
				var atual = ler(); atual.carimbos = {}; atual.mostrados = []; salvar(atual); montarLivro('passaporte', true);
			});
			vistos.appendChild(zerar);
		}
		// o diário de bordo: as visitas em ordem, com a data
		var diario = document.createElement('section');
		diario.className = 'pp-pagina pp-diario';
		var visitas = DESTINOS.filter(function (x) { return d.carimbos[x.id]; }).sort(function (a, b) { return d.carimbos[a.id] < d.carimbos[b.id] ? -1 : 1; });
		diario.innerHTML = '<header class="pp-cabecalho"><span>Diário de bordo</span><span>Travel log</span></header>' +
			(visitas.length ? '<ol class="pp-diario-lista">' + visitas.map(function (x) {
				return '<li style="--cor-carimbo:' + x.cor + '"><i aria-hidden="true"></i><b>' + x.nome.replace('*', '<span class="ast">*</span>') + '</b><span>' + dataBonita(d.carimbos[x.id]) + '</span></li>';
			}).join('') + '</ol>' : '<p class="pp-diario-vazio">Nenhuma viagem anotada ainda. Escolha um destino na Via Láctea!</p>') +
			'<p class="pp-diario-falta">' + (n === DESTINOS.length ? 'Todos os destinos visitados!' : 'Faltam ' + (DESTINOS.length - n) + ' destino' + (DESTINOS.length - n > 1 ? 's' : '') + ' para o certificado.') + '</p>' +
			'<footer class="pp-rodape"><span>' + n + ' / ' + DESTINOS.length + '</span><span>5</span></footer>';
		livro.appendChild(diario);
		var folha = document.createElement('div');
		folha.className = 'pp-folha';
		folha.appendChild(vistos);
		folha.appendChild(vistos2);
		livro.appendChild(folha);
		// ---- capa (frente) e página de dados (verso da capa) ----
		var pecas = capaDoPassaporte(d, datas, n, completo), capa = pecas.capa, frente = pecas.frente, verso = pecas.verso;
		livro.appendChild(capa);
		var embrulho = holograma(livro);
		if (!jaAberto) embrulho.classList.add('so-capa'); // fechado, só a capa (metade da direita) passa pelo leitor
		dialogo.appendChild(embrulho);

		// a capa só abre quando a pessoa clica nela; depois disso, os carimbos novos são batidos um por um
		frente.setAttribute('role', 'button');
		frente.setAttribute('tabindex', '0');
		frente.setAttribute('aria-label', 'Abrir o passaporte');
		// a dica fica fora do passaporte, embaixo dele, e some quando ele está aberto
		var dica = document.createElement('p');
		dica.className = 'pp-dica-abrir';
		dica.setAttribute('aria-hidden', 'true');
		dica.textContent = 'Clique no passaporte para abrir';
		dialogo.appendChild(dica);
		var aberto = false, virado = false, celular = function () { return window.innerWidth <= 760; };
		function carimbarTodos(lista, espera) {
			lista.forEach(function (nv, i) { setTimeout(function () { carimbar(nv.vaga, nv.marca, nv.destino); }, espera + i * 850); });
			return espera + lista.length * 850;
		}
		function abrirCapa() {
			if (aberto) return;
			aberto = livroAberto = true;
			livro.classList.add('aberto');
			dica.hidden = true;
			if (calmo) livro.classList.add('sem-animacao');
			var espera = calmo ? 0 : 1100;
			// no celular as páginas ficam uma embaixo da outra: rola até os vistos antes de carimbar
			if ((novosFrente.length || novosVerso.length) && celular()) {
				setTimeout(function () { vistos.scrollIntoView({ behavior: calmo ? 'auto' : 'smooth', block: 'start' }); }, calmo ? 0 : 300);
				espera += calmo ? 0 : 500;
			}
			var depois = carimbarTodos(novosFrente, espera);
			// carimbo novo na página 4: a folha vira sozinha para ele ser batido lá
			if (novosVerso.length) {
				setTimeout(function () { if (!celular()) virar(true); }, depois + (calmo ? 0 : 200));
				carimbarTodos(novosVerso, depois + (calmo || celular() ? 0 : 1300));
			}
			if (novosFrente.length || novosVerso.length) {
				d.mostrados = DESTINOS.filter(function (x) { return d.carimbos[x.id]; }).map(function (x) { return x.id; });
				salvar(d);
			}
			var campoNome = verso.querySelector('input');
			if (campoNome && !campoNome.value) setTimeout(function () { campoNome.focus({ preventScroll: true }); }, calmo ? 0 : 1000);
		}
		// virar a folha: das páginas 2 e 3 para as páginas 4 e 5, e de volta
		function virar(sim) {
			virado = sim;
			livro.classList.toggle('virado', sim);
		}
		frente.addEventListener('click', abrirCapa);
		// fechar o passaporte (a capa volta e a folha desvira)
		function fecharCapa() {
			if (!aberto) return false;
			aberto = livroAberto = false;
			livro.classList.remove('sem-animacao');
			// na página 4, a folha desvira primeiro e só depois a capa fecha (as duas juntas
			// deixavam a folha por cima da capa, e o livro fechava mostrando a página 3)
			var espera = virado && !calmo && !celular() ? 950 : 0;
			virar(false);
			setTimeout(function () {
				if (aberto) return; // abriu de novo no meio do caminho
				livro.classList.remove('aberto');
				dica.hidden = false;
				setTimeout(function () { frente.focus({ preventScroll: true }); }, calmo ? 0 : 600);
			}, espera);
			return true;
		}
		// clicando no passaporte aberto, a página vira; clicando de novo, ela volta. Os campos, os
		// carimbos e os botões continuam funcionando normalmente
		livro.addEventListener('click', function (e) {
			if (!aberto || frente.contains(e.target)) return;
			if (e.target.closest('input, button, a, .pp-carimbo')) return;
			if (!celular()) virar(!virado);
		});
		// clicando fora do passaporte: primeiro ele fecha; com ele já fechado, a aba de documentos fecha
		aoClicarFora = fecharCapa;
		frente.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirCapa(); } });
		if (jaAberto) { livro.classList.add('sem-animacao'); abrirCapa(); }
		else setTimeout(function () { frente.focus({ preventScroll: true }); }, 50);
	}
	// ---------- Página de selos especiais (conquistas) ----------
	// Uma página do passaporte com os três selos: os ganhos aparecem carimbados, com a data;
	// os que faltam ficam só em contorno, com o que falta fazer e uma barrinha de progresso.
	// Selo ganho que ainda não tinha sido visto entra com o carimbador.
	function paginaConquistas(d) {
		var pagina = document.createElement('section');
		pagina.className = 'pp-pagina pp-conquistas';
		var ganhas = CONQUISTAS.filter(function (c) { return d.conquistas && d.conquistas[c.id]; }).length;
		pagina.innerHTML = '<header class="pp-cabecalho"><span>Selos especiais</span><span>Special seals</span></header>' +
			'<p class="conq-intro">Selos ganhos explorando a galáxia <b>' + ganhas + ' de ' + CONQUISTAS.length + '</b></p>';
		var vistas = d.conquistasVistas || [], novas = [];
		var lista = document.createElement('div');
		lista.className = 'conq-lista';
		CONQUISTAS.forEach(function (c) {
			var ganha = d.conquistas && d.conquistas[c.id], feito = progresso(c, d);
			var item = document.createElement('div');
			item.className = 'conq-item' + (ganha ? ' ganha' : '');
			item.style.setProperty('--cor-carimbo', c.cor);
			var vaga = document.createElement('div');
			vaga.className = 'pp-vaga conq-vaga';
			var marca = document.createElement('div');
			marca.className = 'pp-carimbo';
			marca.style.setProperty('--giro', giroDe(c) + 'deg');
			marca.appendChild(novoCarimbo(c, null, ganha || null));
			vaga.appendChild(marca);
			if (!ganha) vaga.insertAdjacentHTML('beforeend', '<span class="conq-cadeado" aria-hidden="true"></span>');
			item.appendChild(vaga);
			var texto = document.createElement('div');
			texto.className = 'conq-texto';
			texto.innerHTML = (ganha ? '<em class="conq-tag">Conquistado</em>' : '') +
				'<strong>' + c.nome + '</strong><span>' + (ganha ? c.desc + ' · ' + dataBonita(ganha) : c.falta) + '</span>' +
				'<span class="conq-barra" style="--feito:' + (feito / c.total) + ';--total:' + c.total + '"><i></i></span>' +
				'<small><b>' + feito + '</b> de <b>' + c.total + '</b> ' + c.unidade + '</small>';
			item.appendChild(texto);
			lista.appendChild(item);
			if (ganha && vistas.indexOf(c.id) < 0) { marca.classList.add('esperando'); novas.push({ vaga: vaga, marca: marca, c: c }); }
		});
		pagina.appendChild(lista);
		pagina.insertAdjacentHTML('beforeend', '<footer class="pp-rodape"><span>' + ganhas + ' / ' + CONQUISTAS.length + '</span><span>4</span></footer>');
		// os selos novos são carimbados depois que o leitor termina de escanear a página
		novas.forEach(function (nv, i) { setTimeout(function () { carimbar(nv.vaga, nv.marca, nv.c); }, (calmo ? 0 : 1300) + i * 850); });
		if (novas.length) { d.conquistasVistas = CONQUISTAS.filter(function (c) { return d.conquistas[c.id]; }).map(function (c) { return c.id; }); salvar(d); }
		return pagina;
	}

	// o carimbador desce, bate na página (que treme um pouquinho) e sobe, deixando a tinta
	function carimbar(vaga, marca, destino) {
		if (calmo) { marca.classList.remove('esperando'); return; }
		var velho = vaga.querySelector('.pp-carimbador');
		if (velho) velho.remove();
		var ferramenta = desenharCarimbador(document.createElement('canvas'), destino.cor);
		ferramenta.className = 'pp-carimbador';
		ferramenta.setAttribute('aria-hidden', 'true');
		ferramenta.style.setProperty('--giro', giroDe(destino) + 'deg');
		vaga.appendChild(ferramenta);
		marca.classList.add('esperando');
		marca.classList.remove('tinta');
		setTimeout(function () {
			marca.classList.remove('esperando');
			void marca.offsetWidth;
			marca.classList.add('tinta');
			var pagina = vaga.closest('.pp-pagina');
			if (pagina) { pagina.classList.remove('tranco'); void pagina.offsetWidth; pagina.classList.add('tranco'); }
		}, 430);
		setTimeout(function () { ferramenta.remove(); }, 900);
	}

	// ---------- Abas dos documentos: passaporte, carteira de piloto e certificado ----------
	function abasDocumentos(visao, completo) {
		var nav = document.createElement('nav');
		nav.className = 'pp-docs';
		nav.setAttribute('aria-label', 'Documentos');
		// ícones em pixel (grade 9×9): livrinho, cartão com foto e medalha
		var ICONES_ABAS = {
			passaporte: '<rect x="1" y="0" width="7" height="9"/><rect x="2" y="1" width="5" height="7" fill="var(--fundo-aba)"/><rect x="3" y="2" width="3" height="3"/><rect x="3" y="6" width="3" height="1"/>',
			carteira: '<rect x="0" y="1" width="9" height="7"/><rect x="1" y="2" width="7" height="5" fill="var(--fundo-aba)"/><rect x="2" y="3" width="2" height="3"/><rect x="5" y="3" width="2" height="1"/><rect x="5" y="5" width="2" height="1"/>',
			certificado: '<rect x="2" y="0" width="2" height="3"/><rect x="5" y="0" width="2" height="3"/><rect x="1" y="3" width="7" height="6"/><rect x="2" y="4" width="5" height="4" fill="var(--fundo-aba)"/><rect x="4" y="5" width="1" height="2"/>',
			bilhete: '<rect x="0" y="2" width="9" height="5"/><rect x="1" y="3" width="4" height="3" fill="var(--fundo-aba)"/><rect x="6" y="2" width="1" height="1" fill="var(--fundo-aba)"/><rect x="6" y="4" width="1" height="1" fill="var(--fundo-aba)"/><rect x="6" y="6" width="1" height="1" fill="var(--fundo-aba)"/>',
			conquistas: '<rect x="4" y="0" width="1" height="2"/><rect x="3" y="2" width="3" height="1"/><rect x="0" y="3" width="9" height="1"/><rect x="1" y="4" width="7" height="1"/><rect x="2" y="5" width="5" height="1"/><rect x="1" y="6" width="3" height="2"/><rect x="5" y="6" width="3" height="2"/><rect x="0" y="8" width="2" height="1"/><rect x="7" y="8" width="2" height="1"/>'
		};
		var abas = [['passaporte', 'Passaporte'], ['carteira', 'Carteira de piloto']];
		if (ler().embarque) abas.push(['bilhete', 'Bilhete']); // (o bilhete de embarque, impresso na agência)
		abas.push(['certificado', 'Certificado'], ['conquistas', 'Conquistas']);
		abas.forEach(function (a) {
			var b = document.createElement('button');
			b.type = 'button';
			b.innerHTML = '<svg class="pp-docs-icone" viewBox="0 0 9 9" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">' + ICONES_ABAS[a[0]] + '</svg><span>' + a[1] + '</span>';
			b.setAttribute('aria-pressed', a[0] === visao ? 'true' : 'false');
			if (a[0] === 'certificado' && !completo) {
				b.disabled = true;
				b.title = 'Visite os ' + DESTINOS.length + ' destinos para ganhar o certificado';
				b.insertAdjacentHTML('beforeend', '<span class="pp-docs-cadeado" aria-hidden="true"></span>');
			}
			// voltando para o passaporte, ele fica do jeito que estava (aberto ou fechado)
			b.addEventListener('click', function () { if (a[0] !== visao) montarLivro(a[0], a[0] === 'passaporte' ? livroAberto : true); });
			nav.appendChild(b);
		});
		return nav;
	}

	// o certificado inteiro cabe numa tela só: se ele for mais alto que o espaço disponível, a página
	// toda diminui na mesma proporção (sem rolar). Refaz a conta quando as fontes chegam e quando a
	// janela muda de tamanho.
	function caberNaTela(el) {
		function ajustar() {
			if (!el.isConnected) { window.removeEventListener('resize', ajustar); return; }
			el.style.zoom = 1;
			var disponivel = window.innerHeight - 280 /* o mesmo espaço em cima (holograma) e embaixo */, largura = window.innerWidth - 24;
			// no celular só encolhe pela largura (encolher pela altura deixava o texto numa
			// coluninha fina); lá o certificado ocupa a largura toda e a página rola
			var celular = window.innerWidth <= 620;
			var z = Math.min(1, celular ? 1 : disponivel / el.scrollHeight, largura / el.scrollWidth);
			el.style.zoom = Math.max(0.4, z);
		}
		ajustar();
		if (document.fonts && document.fonts.ready) document.fonts.ready.then(ajustar);
		window.addEventListener('resize', ajustar);
	}

	// efeito parallax: o selo inclina na direção do mouse, o texto "flutua" na frente do anel e o
	// brilho do holograma corre para o lado oposto (as profundidades ficam no CSS)
	function paralaxe(el) {
		if (calmo) return;
		el.addEventListener('pointermove', function (e) {
			var r = el.getBoundingClientRect();
			el.style.setProperty('--mx', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3));
			el.style.setProperty('--my', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3));
			el.classList.add('paralaxe-ativa');
		});
		el.addEventListener('pointerleave', function () {
			el.style.setProperty('--mx', 0); el.style.setProperty('--my', 0);
			el.classList.remove('paralaxe-ativa');
		});
	}

	// o selo dourado do certificado: borda serrilhada (como os selos de cera e de papel-alumínio),
	// anel com o nome da agência escrito em volta e um miolo liso com brilho de metal
	// Medalha: uma roseta de fita dourada pregueada em volta, a moeda com aro de contas e o nome
	// da agência gravado, e o miolo de esmalte azul (onde fica o texto que flutua no parallax)
	function lacreSvg() {
		var p = function (r, a) { return (60 + Math.cos(a) * r).toFixed(2) + ',' + (60 + Math.sin(a) * r).toFixed(2); };
		var pregas = '', contas = '', N = 44, i;
		for (i = 0; i < N; i++) {
			var a0 = i / N * Math.PI * 2, a1 = (i + 1) / N * Math.PI * 2, am = (a0 + a1) / 2;
			// cada prega é um gomo com a ponta arredondada; os gomos alternam luz e sombra
			pregas += '<polygon points="' + [p(40, a0), p(57.5, a0), p(59.5, am), p(57.5, a1), p(40, a1)].join(' ') + '" fill="' + (i % 2 ? '#a5761f' : '#e9c25e') + '"/>';
		}
		for (i = 0; i < 48; i++) { var b = i / 48 * Math.PI * 2; contas += '<circle cx="' + (60 + Math.cos(b) * 41.2).toFixed(2) + '" cy="' + (60 + Math.sin(b) * 41.2).toFixed(2) + '" r="0.95"/>'; }
		return '<svg class="cert-lacre-svg" viewBox="0 0 120 120" aria-hidden="true">' +
			'<defs>' +
				'<radialGradient id="lacreOuro" cx="35%" cy="28%" r="85%"><stop offset="0" stop-color="#fff4c4"/><stop offset="0.4" stop-color="#ecc25a"/><stop offset="0.8" stop-color="#b8862a"/><stop offset="1" stop-color="#8a5e16"/></radialGradient>' +
				'<radialGradient id="lacreEsmalte" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="#3a4cc0"/><stop offset="0.55" stop-color="#22307e"/><stop offset="1" stop-color="#121a4e"/></radialGradient>' +
				'<linearGradient id="lacreSombra" x1="0" y1="0" x2="1" y2="1"><stop offset="0.45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#3a2400" stop-opacity="0.35"/></linearGradient>' +
				'<path id="lacreArco" d="M60,60 m-34.6,0 a34.6,34.6 0 1,1 69.2,0 a34.6,34.6 0 1,1 -69.2,0"/>' +
			'</defs>' +
			'<g stroke="#7a5212" stroke-width="0.35" stroke-linejoin="round">' + pregas + '</g>' +
			'<circle cx="60" cy="60" r="58" fill="url(#lacreSombra)"/>' +
			// a moeda
			'<circle cx="60" cy="60" r="44.5" fill="url(#lacreOuro)" stroke="#6a4710" stroke-width="1"/>' +
			'<circle cx="60" cy="60" r="43.2" fill="none" stroke="#fff4c4" stroke-opacity="0.75" stroke-width="0.7"/>' +
			'<g fill="#7a5212">' + contas + '</g>' +
			'<circle cx="60" cy="60" r="39.4" fill="none" stroke="#7a5212" stroke-width="0.6"/>' +
			'<text class="cert-lacre-anel"><textPath href="#lacreArco" startOffset="0">AGÊNCIA ANDARILHA ✦ SELO OFICIAL ✦ DESDE 2077 ✦</textPath></text>' +
			// o miolo de esmalte, com um filete dourado
			'<circle cx="60" cy="60" r="29" fill="#8a5e16"/>' +
			'<circle cx="60" cy="60" r="27.6" fill="url(#lacreEsmalte)" stroke="#f3d27a" stroke-width="1.1"/>' +
			'<circle cx="60" cy="60" r="24.8" fill="none" stroke="#f3d27a" stroke-opacity="0.45" stroke-width="0.5" stroke-dasharray="1 1.6"/>' +
			'<ellipse cx="52" cy="48" rx="14" ry="7" fill="#fff" fill-opacity="0.12" transform="rotate(-30 52 48)"/>' +
		'</svg>';
	}

	function dataPorExtenso(iso) {
		try { return new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; }
	}

	// ---------- Certificado de Turista da Via Láctea ----------
	// Formal como um diploma: papel de segurança creme, moldura dupla com cantos dourados,
	// brasão, título em letras clássicas, o nome em letra de caneta, os carimbos, duas
	// assinaturas, o lacre dourado com fitas e o número de registro.
	// Holografias de segurança do certificado: um selo holográfico redondo com a Via Láctea
	// em espiral (como o adesivo prateado dos documentos de verdade) e uma faixa holográfica
	// na lateral, com microtexto. As cores mudam conforme o mouse, junto com o efeito 3D.
	function holografiasDoCertificado() {
		var bracos = '';
		for (var b = 0; b < 2; b++) {
			var pts = [];
			for (var a = 0; a <= Math.PI * 2.6; a += 0.15) {
				var r = 4 * Math.exp(0.3 * a), ang = a + b * Math.PI;
				pts.push((r * Math.cos(ang)).toFixed(1) + ',' + (r * Math.sin(ang) * 0.62).toFixed(1));
			}
			bracos += '<polyline points="' + pts.join(' ') + '" />';
		}
		var micro = new Array(9).join('VIA LÁCTEA ✦ PX-01 ✦ ');
		return '<div class="cert-holo-faixa" aria-hidden="true"><span>' + micro + '</span></div>' +
			'<div class="cert-holo-selo" aria-hidden="true">' +
				'<svg viewBox="-50 -50 100 100"><ellipse rx="44" ry="44" class="holo-anel" />' + bracos +
				'<ellipse rx="7" ry="4.5" class="holo-nucleo" /></svg>' +
				'<span class="holo-texto">Autêntico</span>' +
			'</div>';
	}

	// Hologramas de verdade: um projetorzinho no documento solta um feixe de luz, e em cima dele
	// alguma coisa gira no ar, azul e transparente, com linhas de varredura e uns "chuviscos" de
	// sinal, saindo para fora da borda. "luzDoQuadro(i)" devolve, para o quadro i da volta, a luz
	// (0 a 1) de cada pixel; os quadros são feitos um por vez (para não travar a página) e
	// depois só se repetem.
	// a tela tem folga em volta: girando, a nave (com as garras) fica bem mais comprida de lado
	var HOLO_L = 150, HOLO_A = 108, HOLO_QUADROS = 40;
	function projecao(classe, legenda, luzDoQuadro) {
		var caixa = document.createElement('div');
		caixa.className = 'holograma ' + classe;
		caixa.setAttribute('aria-hidden', 'true');
		caixa.innerHTML = '<span class="holo-feixe"><i></i><i></i><i></i></span><canvas class="holo-objeto"></canvas><span class="holo-emissor"></span><span class="holo-legenda">' + legenda + '</span>';
		var tela = caixa.querySelector('canvas'), L = HOLO_L, A = HOLO_A;
		tela.width = L; tela.height = A;
		var ctx = tela.getContext('2d'), quadros = [], atual = 0, anterior = 0;
		var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		function desenharQuadro(i) {
			var luz = luzDoQuadro(i), img = ctx.createImageData(L, A), px = img.data;
			for (var k = 0; k < L * A; k++) {
				var l = luz[k];
				if (!l) continue;
				l = Math.min(1, l);
				var linha = ((k / L) | 0) % 2 ? 0.5 : 1; // linhas de varredura
				px[k * 4] = 70 + 150 * l; px[k * 4 + 1] = 200 + 55 * l; px[k * 4 + 2] = 255;
				px[k * 4 + 3] = (80 + 175 * l) * linha;
			}
			return img;
		}
		function laco(agora) {
			if (!caixa.isConnected && quadros.length) return; // o documento fechou
			if (agora - anterior > 110) {
				anterior = agora;
				if (!quadros[atual]) quadros[atual] = desenharQuadro(atual);
				ctx.putImageData(quadros[atual], 0, 0);
				if (!calmo) atual = (atual + 1) % HOLO_QUADROS;
			}
			if (!calmo || !quadros.length) requestAnimationFrame(laco);
		}
		requestAnimationFrame(laco);
		return caixa;
	}

	// a nave PX-01 girando, desenhada pelo modelo 3D de nave.js (vai na carteira de piloto)
	function hologramaDaNave() {
		return projecao('holo-nave', 'PX-01 · projeção', function (i) {
			var luz = new Float32Array(HOLO_L * HOLO_A);
			if (!window.Nave || !window.Nave.renderizarModelo) return luz;
			var r = window.Nave.renderizarModelo({
				L: HOLO_L, A: HOLO_A, giro: i / HOLO_QUADROS * Math.PI * 2, inclinacao: 40 * Math.PI / 180,
				esc: 44, ox: HOLO_L / 2, oy: HOLO_A / 2, luz: [0.5, -0.3, 0.7], motores: false
			});
			for (var k = 0; k < luz.length; k++) {
				var c = r.cores[k];
				if (c) luz[k] = Math.max(0.01, ((c & 255) * 0.3 + ((c >> 8) & 255) * 0.59 + ((c >> 16) & 255) * 0.11) / 255);
			}
			return luz;
		});
	}

	// a Via Láctea girando, um disco inclinado com dois braços em espiral e o miolo acesso
	// (vai no certificado de turista da Via Láctea)
	var estrelasHolo = null;
	function hologramaDaGalaxia() {
		if (!estrelasHolo) {
			estrelasHolo = [];
			var s = 7, aleat = function () { s = (s * 16807) % 2147483647; return s / 2147483647; };
			for (var n = 0; n < 3200; n++) {
				var r, a, braco = n % 2;
				if (n < 600) { r = Math.abs(aleat() + aleat() - 1) * 0.24; a = aleat() * Math.PI * 2; } // o miolo
				else { r = 0.12 + Math.pow(aleat(), 0.8) * 0.88; a = Math.log(r / 0.12) / 0.32 + braco * Math.PI + (aleat() - 0.5) * 0.7; }
				estrelasHolo.push([r * Math.cos(a), r * Math.sin(a), (aleat() - 0.5) * 0.05 * (1 - r), 1 - r * 0.6]);
			}
		}
		var INCL = 58 * Math.PI / 180, CI = Math.cos(INCL), SI = Math.sin(INCL), R = 58;
		return projecao('holo-galaxia', 'Via Láctea · projeção', function (i) {
			var luz = new Float32Array(HOLO_L * HOLO_A), g = -i / HOLO_QUADROS * Math.PI * 2, cg = Math.cos(g), sg = Math.sin(g);
			estrelasHolo.forEach(function (e) {
				var x = e[0] * cg - e[1] * sg, y = e[0] * sg + e[1] * cg;
				var sx = Math.round(HOLO_L / 2 + x * R), sy = Math.round(HOLO_A / 2 + 4 + (y * CI - e[2] * SI) * R);
				if (sx < 0 || sy < 0 || sx >= HOLO_L || sy >= HOLO_A) return;
				luz[sy * HOLO_L + sx] += e[3] * 0.6;
			});
			return luz;
		});
	}

	function certificado(d, datas) {
		var c = document.createElement('section');
		c.className = 'cert';
		var ultima = datas[datas.length - 1];
		var registro = 'VLC-' + new Date(ultima).getFullYear() + '-' + numeroDe(d).slice(2);
		c.innerHTML =
			'<div class="cert-moldura">' +
				'<span class="cert-canto" aria-hidden="true"></span><span class="cert-canto" aria-hidden="true"></span>' +
				'<span class="cert-canto" aria-hidden="true"></span><span class="cert-canto" aria-hidden="true"></span>' +
				'<header class="cert-topo">' +
					'<p class="cert-orgao">Agência Andarilha · Turismo Espacial</p>' +
					'<p class="cert-depto">Departamento de Viagens Interestelares</p>' +
				'</header>' +
				'<h2 class="cert-titulo">Certificado</h2>' +
				'<p class="cert-subtitulo">de Turista da Via Láctea</p>' +
				'<div class="cert-divisor" aria-hidden="true"><span>&#10022;</span></div>' +
				'<p class="cert-texto">Certificamos, para os devidos fins, que</p>' +
				'<p class="cert-nome"></p>' +
				'<p class="cert-texto">visitou os ' + DESTINOS.length + ' destinos turísticos da Via Láctea a bordo da nave PX-01, ' +
					'viajando na velocidade da luz, e faz jus ao título de</p>' +
				'<p class="cert-honra">Turista da Via Láctea</p>' +
				'<div class="cert-selos"></div>' +
				'<footer class="cert-rodape">' +
					'<div class="cert-assina"><span class="cert-assina-nome">L. Andrômeda</span><small>Diretora da Agência</small></div>' +
					'<div class="cert-lacre-base" aria-hidden="true"><span class="cert-fita"></span><span class="cert-fita"></span><div class="cert-lacre">' + lacreSvg() +
						'<span class="cert-lacre-brilho"></span>' +
						'<span class="cert-lacre-texto"><i>&#10022; &#10022; &#10022;</i><b>PX-01</b><span>Via Láctea</span></span></div></div>' +
					'<div class="cert-assina"><span class="cert-assina-nome">C. Órion</span><small>Comandante da nave PX-01</small></div>' +
				'</footer>' +
				'<p class="cert-local"></p>' +
			'</div>';
		// no topo, o selo da Agência Andarilha (de marca.js), quem emite o certificado
		var topo = c.querySelector('.cert-topo');
		if (window.Andarilha) topo.insertAdjacentHTML('afterbegin', '<div class="cert-selo-agencia" aria-hidden="true">' + window.Andarilha.selo() + '</div>');
		else c.querySelector('.cert-moldura').insertBefore(novoCarimbo(BRASAO, 'cert-brasao', null), topo);
		c.querySelector('.cert-moldura').insertAdjacentHTML('afterbegin', holografiasDoCertificado());
		c.querySelector('.cert-moldura').appendChild(hologramaDaGalaxia());
		c.querySelector('.cert-nome').textContent = d.nome || 'Turista sem nome'; // o nome é texto, nunca HTML
		c.querySelector('.cert-local').textContent = 'Via Láctea, ' + dataPorExtenso(ultima) + '  ·  Registro nº ' + registro;
		paralaxe(c.querySelector('.cert-lacre')); // o selo dourado inclina com o mouse
		var selos = c.querySelector('.cert-selos');
		DESTINOS.forEach(function (x) { selos.appendChild(novoCarimbo(x, null, d.carimbos[x.id])); });
		return c;
	}

	// ---------- Carteira de piloto ----------
	// Uma carteira de habilitação (do tamanho de um cartão), com a foto de quem pilota e a
	// foto do modelo da nave. Clicando, ela vira e mostra as categorias e observações.
	// "foto" do modelo: a Millennium Falcon em pixel art, vista de frente e de lado (três quartos),
	// como a foto da maquete do museu. O modelo 3D da nave fica em nave.js (é o mesmo das
	// transições, só que de outro ângulo); aqui entram o fundo neutro e a sombra embaixo.
	function fotoDaNave(tela) {
		var L = 176, A = 104;
		tela.width = L; tela.height = A;
		var ctx = tela.getContext('2d'), img = ctx.createImageData(L, A), buf = new Uint32Array(img.data.buffer);
		function cor(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
		var B4 = [0, 0.5, 0.75, 0.25];
		// fundo cinza, um pouco mais claro no meio, e a sombra da nave embaixo
		for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
			var claro = 1 - Math.hypot((x - L / 2) / L, (y - A * 0.4) / A) * 1.2 + B4[(x & 1) + ((y & 1) << 1)] * 0.12;
			var sombra = Math.pow((x - 98) / 70, 2) + Math.pow((y - 90) / 9, 2) < 1;
			buf[y * L + x] = sombra ? (claro > 0.62 ? cor(44, 46, 52) : cor(38, 40, 46)) : claro > 0.78 ? cor(86, 89, 98) : claro > 0.6 ? cor(72, 75, 84) : claro > 0.42 ? cor(60, 63, 71) : cor(50, 52, 60);
		}
		if (window.Nave && window.Nave.renderizarModelo) {
			// a nave virada com as garras para a esquerda e um pouco para nós, vista de cima (28 graus)
			var r = window.Nave.renderizarModelo({
				L: L, A: A, giro: Math.atan2(-0.6, -0.8) - Math.PI / 2, inclinacao: 28 * Math.PI / 180,
				esc: 64, ox: 103, oy: 52, luz: [0.65, -0.15, 0.55], motores: false
			});
			for (var k = 0; k < L * A; k++) if (r.cores[k]) buf[k] = r.cores[k];
		}
		ctx.putImageData(img, 0, 0);
		return tela;
	}
	function carteira(d, datas) {
		var w = document.createElement('section');
		w.className = 'cnh';
		var emissao = datas[0] ? dataBonita(datas[0]).toUpperCase() : dataBonita(new Date().toISOString()).toUpperCase();
		var registro = 'CNH-' + numeroDe(d).slice(2);
		w.innerHTML =
			'<div class="cnh-cartao" role="button" tabindex="0" aria-label="Carteira de piloto. Clique para virar.">' +
				'<div class="cnh-face cnh-frente">' +
					// enfeites: órbitas pontilhadas com um planetinha, Saturno no canto, chip, faixa holográfica e microtexto
					'<span class="cnh-orbitas" aria-hidden="true"><i></i><i></i><b></b></span>' +
					'<span class="cnh-planeta" aria-hidden="true"></span>' +
					'<span class="cnh-faixa-holo" aria-hidden="true"></span>' +
					'<header class="cnh-topo">' +
						'<span class="cnh-brasao"></span>' +
						'<div><strong>Carteira de Habilitação Espacial</strong><span>Departamento de Trânsito Interestelar · Agência de Turismo Espacial</span></div>' +
						'<b class="cnh-sigla">VLC</b>' +
					'</header>' +
					'<div class="cnh-corpo">' +
						'<div class="cnh-foto"><canvas aria-hidden="true"></canvas></div>' +
						'<dl class="cnh-campos">' +
							'<div class="largo"><dt>Nome</dt><dd class="cnh-nome"></dd></div>' +
							'<div><dt>Nº de registro</dt><dd class="cnh-registro"></dd></div>' +
							'<div><dt>Categoria</dt><dd>A B C L</dd></div>' +
							'<div><dt>1ª habilitação</dt><dd>' + emissao + '</dd></div>' +
							'<div><dt>Validade</dt><dd>Fim do universo</dd></div>' +
							'<div class="largo"><dt>Nave autorizada</dt><dd>PX-01 Millennium Falcon</dd></div>' +
						'</dl>' +
						'<figure class="cnh-modelo"><canvas role="img" aria-label="Foto do modelo da nave em pixel art: a Millennium Falcon vista de frente e de lado, com o disco cinza-claro cheio de placas, as duas garras da frente, a cabine em tubo, a antena parabólica e o anel de acoplamento, sobre um fundo cinza"></canvas>' +
							'<figcaption><b>Modelo YT-1300</b><span>Cargueiro leve · 34,37 m · Millennium Falcon</span></figcaption></figure>' +
					'</div>' +
					'<div class="cnh-assinatura"><span class="cnh-assinatura-nome"></span><small>Assinatura do(a) piloto</small></div>' +
					'<span class="cnh-holograma" aria-hidden="true"></span>' +
					'<span class="cnh-chip" aria-hidden="true"></span>' +
					'<p class="cnh-micro" aria-hidden="true">' + new Array(9).join('VIA LÁCTEA ✦ PX-01 ✦ PILOTO HABILITADO ✦ ') + '</p>' +
				'</div>' +
				'<div class="cnh-face cnh-verso">' +
					'<span class="cnh-orbitas" aria-hidden="true"><i></i><i></i><b></b></span>' +
					'<p class="cnh-micro" aria-hidden="true">' + new Array(9).join('DEPARTAMENTO DE TRÂNSITO INTERESTELAR ✦ ') + '</p>' +
					'<header class="cnh-topo cnh-topo-verso"><strong>Categorias</strong><span>Classes de nave que você pode pilotar</span></header>' +
					'<table class="cnh-categorias">' +
						'<thead><tr><th>Cat.</th><th>Veículo</th><th>Habilitado(a)</th></tr></thead>' +
						'<tbody>' +
							'<tr><td>A</td><td>Cápsulas e módulos de pouso</td><td>Sim</td></tr>' +
							'<tr><td>B</td><td>Naves de passeio</td><td>Sim</td></tr>' +
							'<tr><td>C</td><td>Cargueiros leves (YT-1300)</td><td>Sim</td></tr>' +
							'<tr><td>L</td><td>Saltos na velocidade da luz</td><td>Sim</td></tr>' +
							'<tr class="nao"><td>X</td><td>Naves de batalha</td><td>Não</td></tr>' +
						'</tbody>' +
					'</table>' +
					'<p class="cnh-obs"><b>Observações:</b> apto(a) a pilotar em cinturões de asteroides. Proibido estacionar perto de buracos negros. Uso obrigatório do cinto em saltos para o hiperespaço.</p>' +
					'<div class="cnh-verso-rodape"><span class="cnh-codigo" aria-hidden="true"></span><div class="cnh-autoridade"><span>C. Órion</span><small>Autoridade emissora</small></div></div>' +
				'</div>' +
			'</div>' +
			'<p class="cnh-dica">Clique na carteira para virar</p>';
		w.querySelector('.cnh-nome').textContent = d.nome || 'Piloto sem nome';
		w.querySelector('.cnh-assinatura-nome').textContent = d.nome || '';
		w.querySelector('.cnh-registro').textContent = registro;
		desenharFoto(w.querySelector('.cnh-foto canvas'));
		fotoDaNave(w.querySelector('.cnh-modelo canvas'));
		w.querySelector('.cnh-brasao').appendChild(novoCarimbo(BRASAO, 'cnh-brasao-tela', null));
		// código de barras em pixels, tirado do número de registro
		var codigo = w.querySelector('.cnh-codigo'), s = hashTexto(registro);
		for (var i = 0; i < 46; i++) {
			var barra = document.createElement('i');
			barra.style.width = (sorte(i, 1, s) < 0.5 ? 1 : sorte(i, 2, s) < 0.7 ? 2 : 3) + 'px';
			codigo.appendChild(barra);
		}
		var cartao = w.querySelector('.cnh-cartao');
		var holo = hologramaDaNave();
		cartao.insertAdjacentElement('afterend', holo);
		// virando: primeiro o holograma desliga (a nave encolhe, o feixe recolhe, o projetor apaga)
		// e só depois a carteira gira; desvirando: a carteira gira de volta e só então o holograma
		// liga de novo, em etapas. Cliques no meio da animação esperam ela acabar.
		var DESLIGA = calmo ? 0 : 380, GIRA = calmo ? 0 : 800, ocupado = false;
		function virar() {
			if (ocupado) return;
			ocupado = true;
			if (!cartao.classList.contains('virada')) {
				holo.classList.add('desligada');
				setTimeout(function () { cartao.classList.add('virada'); setTimeout(function () { ocupado = false; }, GIRA); }, DESLIGA);
			} else {
				cartao.classList.remove('virada');
				setTimeout(function () { holo.classList.remove('desligada'); ocupado = false; }, GIRA);
			}
		}
		cartao.addEventListener('click', virar);
		cartao.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); virar(); } });
		return w;
	}

	// ---------- Começo ----------
	var idPagina = document.body.getAttribute('data-passaporte');
	if (idPagina) registrar(idPagina);
	// páginas do Sol e dos planetas contam para o selo "Volta ao Sistema Solar"
	var arquivo = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
	if (ASTROS.indexOf(arquivo) >= 0) anotar('planeta', arquivo);
	var galaxia = document.getElementById('galaxia');
	if (galaxia) {
		montarBotao(galaxia);
		// "Ver passaporte" / "Ver conquistas" dos avisos: chega aqui com #passaporte ou #conquistas
		if (location.hash === '#passaporte' || location.hash === '#conquistas') {
			var visao = location.hash === '#conquistas' ? 'conquistas' : null;
			setTimeout(function () { abrir(visao); }, emSalto() ? 1600 : 400);
		}
	}
	// os documentos de verdade para a mesa do embarque (embarque.js): o passaporte fechado (capa,
	// página de dados e a primeira página de vistos) e a carteira de piloto com o holograma da nave
	function documentosDaMesa() {
		estampasEspaciais();
		var d = ler(), n = quantos(d), completo = n === DESTINOS.length;
		var datas = DESTINOS.map(function (x) { return d.carimbos[x.id]; }).filter(Boolean).sort();
		var livro = document.createElement('div');
		livro.className = 'pp-livro';
		var folha = document.createElement('div');
		folha.className = 'pp-folha';
		folha.appendChild(paginaVistos(d, n, DESTINOS.slice(0, 7), 0, 3, 'pp-folha-frente', []));
		livro.appendChild(folha);
		var pecas = capaDoPassaporte(d, datas, n, completo);
		livro.appendChild(pecas.capa);
		var campo = pecas.verso.querySelector('input');
		campo.readOnly = true; campo.tabIndex = -1; campo.removeAttribute('id'); // na mesa o nome é escrito pela cena
		return { livro: livro, dados: pecas.verso, carteira: carteira(d, datas) };
	}
	// o carimbo de EMBARQUE APROVADO (também usado pela mesa do embarque, quando o carimbo desce)
	function carimboEmbarque(iso) {
		var visto = document.createElement('span');
		visto.className = 'pp-embarque';
		visto.title = 'Embarque aprovado na Agência Andarilha em ' + dataBonita(iso);
		visto.innerHTML = '<svg viewBox="0 0 120 100" aria-hidden="true">' +
			'<defs><mask id="pp-embarque-faixa"><rect width="120" height="100" fill="#fff"/><rect x="0" y="36" width="120" height="28" fill="#000"/></mask></defs>' +
			'<g fill="none" stroke="currentColor" mask="url(#pp-embarque-faixa)"><circle cx="60" cy="50" r="46" stroke-width="3"/><circle cx="60" cy="50" r="38" stroke-width="1.5"/></g>' +
			'<rect x="4" y="37" width="112" height="26" fill="none" stroke="currentColor" stroke-width="3"/>' +
			'<text x="60" y="56" font-size="15" text-anchor="middle" fill="currentColor">APROVADO</text>' +
			'<text x="60" y="30" font-size="9" text-anchor="middle" fill="currentColor">★ ★ ★</text>' +
			'<text x="60" y="76" font-size="8" text-anchor="middle" fill="currentColor">PX-01</text>' +
			'<text x="60" y="86" font-size="6.5" text-anchor="middle" fill="currentColor" class="pp-embarque-data"></text>' +
			'</svg>';
		visto.querySelector('.pp-embarque-data').textContent = dataBonita(iso).toUpperCase();
		return visto;
	}
	// o bilhete de embarque, impresso pelo ZÖ-11 no guichê 11: o canhoto destacável com a senha e o código
	// de barras, o cabeçalho azul-marinho com o símbolo, os dados do voo e uma faixa holográfica
	function bilheteEmbarque(d) {
		var w = document.createElement('section');
		w.className = 'bilhete';
		var data = (d.embarque ? dataBonita(d.embarque) : dataBonita(new Date().toISOString())).toUpperCase();
		w.innerHTML =
			'<div class="bilhete-corpo">' +
				'<header class="bilhete-topo">' + (window.Andarilha ? window.Andarilha.simbolo('bilhete-simbolo') : '') + '<div><strong>Cartão de embarque</strong><span>Boarding pass · Agência Andarilha</span></div><b>PX-01</b></header>' +
				'<div class="bilhete-rota"><div><small>De</small><b>TER</b><span>Terra · Porto Andarilha</span></div><i aria-hidden="true">✦ ─── ➜</i><div><small>Para</small><b>VLC</b><span>Via Láctea</span></div></div>' +
				'<dl class="bilhete-campos">' +
					'<div class="largo"><dt>Piloto</dt><dd class="bilhete-nome"></dd></div>' +
					'<div><dt>Nave</dt><dd>Millennium Falcon</dd></div><div><dt>Hangar</dt><dd>11</dd></div>' +
					'<div><dt>Portão</dt><dd>11</dd></div><div><dt>Assento</dt><dd>Piloto</dd></div>' +
					'<div><dt>Data</dt><dd>' + data + '</dd></div><div><dt>Embarque</dt><dd>Agora</dd></div>' +
				'</dl>' +
				'<span class="bilhete-holo" aria-hidden="true"></span>' +
			'</div>' +
			'<div class="bilhete-canhoto"><small>Senha</small><b>011</b><small>Guichê 11</small><span class="bilhete-codigo" aria-hidden="true"></span><small class="bilhete-atendente">Atendente ZÖ-11</small></div>';
		w.querySelector('.bilhete-nome').textContent = d.nome || 'Piloto sem nome';
		var cod = w.querySelector('.bilhete-codigo'), s = hashTexto((d.nome || '') + data);
		for (var i = 0; i < 30; i++) { var barra = document.createElement('i'); barra.style.width = (sorte(i, 1, s) < 0.5 ? 1 : sorte(i, 2, s) < 0.7 ? 2 : 3) + 'px'; cod.appendChild(barra); }
		return w;
	}
	window.Passaporte = { abrir: abrir, documentosDaMesa: documentosDaMesa, carimboEmbarque: carimboEmbarque, bilhete: bilheteEmbarque };
})();
