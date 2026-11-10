// A aproximação, na página do sistema solar: clicando num planeta que tem luas visitáveis,
// a nave só chega perto dele (sem alfândega). O planeta cresce no meio da tela, as luas
// aparecem dando voltas nele, e a pessoa escolhe com calma entre o planeta e as luas.
// Só depois de escolher é que vem a viagem de verdade (o salto e a chegada com alfândega).
// De longe, as luas não aparecem: elas só surgem quando a nave se aproxima.
(function () {
	var T = window.T || function (pt) { return pt; };
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var sistema = document.getElementById('sistema');
	if (!sistema) return;

	/* As luas que dá para visitar. r: raio da órbita (em raios do globo do planeta, fora de escala
	   para caber na tela, mas na ordem de verdade); ach: achatamento da elipse (vista de lado);
	   incl: inclinação (as de Urano "em pé", porque o planeta é deitado; Tritão inclinado e na
	   contramão); dias: o tempo de uma volta, o de verdade (aqui, um dia passa em 4 segundos);
	   tam: o tamanho na tela (em % do menor lado da tela, ampliado para dar para ver e clicar). */
	var SISTEMAS = {
		terra: { cor: '#6f9bff', luas: [
			{ id: 'lua', nome: T('Lua', 'Moon'), lema: T('A nossa companheira de sempre', 'Our constant companion'), r: 2.3, ach: 0.32, incl: -5, dias: 27.32, tam: 5.2, fase: 0.6 }] },
		jupiter: { cor: '#e6c49a', luas: [
			{ id: 'io', nome: 'Io', lema: T('O mundo dos vulcões', 'The world of volcanoes'), r: 1.55, ach: 0.3, incl: -3, dias: 1.769, tam: 4.2, fase: 0.3 },
			{ id: 'europa', nome: 'Europa', lema: T('Um oceano escondido embaixo do gelo', 'An ocean hidden under the ice'), r: 2.0, ach: 0.3, incl: -3, dias: 3.551, tam: 4.0, fase: 2.4 },
			{ id: 'ganimedes', nome: T('Ganimedes', 'Ganymede'), lema: T('A maior lua do Sistema Solar', 'The largest moon in the Solar System'), r: 2.5, ach: 0.3, incl: -3, dias: 7.155, tam: 4.8, fase: 4.4 }] },
		saturno: { cor: '#e3cc8f', globo: 49 / 95, luas: [
			{ id: 'mimas', nome: 'Mimas', lema: T('A lua com uma cratera gigante', 'The moon with a giant crater'), r: 2.25, ach: 0.26, incl: -4, dias: 0.942, tam: 3.4, fase: 1.0 },
			{ id: 'encelado', nome: T('Encélado', 'Enceladus'), lema: T('A lua dos gêiseres de gelo', 'The moon of icy geysers'), r: 2.6, ach: 0.26, incl: -4, dias: 1.37, tam: 3.6, fase: 3.6 },
			{ id: 'tita', nome: T('Titã', 'Titan'), lema: T('A lua com céu, chuva e mares', 'The moon with sky, rain and seas'), r: 3.05, ach: 0.26, incl: -4, dias: 15.945, tam: 4.8, fase: 5.3 }] },
		urano: { cor: '#a8ecf5', luas: [
			{ id: 'miranda', nome: 'Miranda', lema: T('A colcha de retalhos de Urano', 'The patchwork moon of Uranus'), r: 1.9, ach: 0.3, incl: 82, dias: 1.413, tam: 4.2, fase: 0.8 }] },
		netuno: { cor: '#6b95ff', luas: [
			{ id: 'tritao', nome: T('Tritão', 'Triton'), lema: T('A lua que anda na contramão', 'The moon that goes the wrong way'), r: 2.1, ach: 0.38, incl: -28, dias: -5.877, tam: 4.6, fase: 2.0 }] }
	};
	var SEGUNDOS_POR_DIA = 4;
	var NOMES = { terra: T('Terra', 'Earth'), jupiter: T('Júpiter', 'Jupiter'), saturno: T('Saturno', 'Saturn'), urano: T('Urano', 'Uranus'), netuno: T('Netuno', 'Neptune') };
	var LEMAS = { terra: T('O planeta azul', 'The blue planet'), jupiter: T('O rei dos planetas', 'The king of the planets'), saturno: T('O senhor dos anéis', 'The lord of the rings'), urano: T('O planeta deitado', 'The planet lying on its side'), netuno: T('O planeta encontrado pela matemática', 'The planet found by mathematics') };

	var camada = null, estado = null;

	/* clicando num planeta com luas (na imagem, no nome embaixo ou no botão do quadro de informações),
	   a nave se aproxima em vez de viajar; o resto continua indo direto para a página */
	document.addEventListener('click', function (e) {
		var a = e.target.closest && e.target.closest('a[href]');
		if (!a || camada && camada.contains(a)) return;
		if (e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
		var m = /(?:^|\/)(terra|jupiter|saturno|urano|netuno)\.html$/.exec(a.getAttribute('href'));
		if (!m) return;
		e.preventDefault();
		e.stopPropagation();
		aproximar(m[1]);
	}, true);

	function el(tag, cls, pai) { var e = document.createElement(tag); if (cls) e.className = cls; if (pai) pai.appendChild(e); return e; }

	function aproximar(id) {
		if (estado) return;
		var S = SISTEMAS[id], origem = sistema.querySelector('.astro[data-id="' + id + '"] img');
		var nomeP = NOMES[id];
		camada = el('div', 'aprox');
		camada.setAttribute('role', 'dialog');
		camada.setAttribute('aria-modal', 'true');
		camada.setAttribute('aria-label', T('Perto de ', 'Close to ') + nomeP);
		camada.style.setProperty('--cor-destino', S.cor);
		/* o céu em pixel art, igual ao do resto do site (fundo.js), com o halo do planeta e as órbitas */
		var ceu = el('canvas', 'aprox-ceu', camada);
		ceu.setAttribute('aria-hidden', 'true');
		var hud = el('p', 'hud-rotulo aprox-hud', camada);
		hud.textContent = T('Aproximando de ', 'Approaching ') + nomeP + '…';
		var voltar = el('button', 'aprox-voltar', camada);
		voltar.type = 'button';
		voltar.innerHTML = '&larr; ' + T('Voltar ao sistema solar', 'Back to the solar system');
		var palco = el('div', 'aprox-palco', camada);
		/* o planeta, com a arte dela, bem grande */
		var planeta = el('a', 'aprox-planeta', palco);
		planeta.href = id + '.html';
		planeta.setAttribute('aria-label', T('Visitar ', 'Visit ') + nomeP);
		/* o brilho em volta do planeta, igual ao da página dele */
		el('span', 'aprox-brilho', planeta);
		var img = el('img', '', planeta);
		img.src = 'pixel/' + id + '.png'; img.alt = '';
		var rotP = el('span', 'aprox-rotulo', planeta);
		rotP.textContent = nomeP;
		/* as luas */
		var luas = S.luas.map(function (L) {
			var a = el('a', 'aprox-lua', palco);
			a.href = L.id + '.html';
			a.setAttribute('aria-label', T('Visitar ', 'Visit ') + L.nome);
			var im = el('img', '', a); im.src = 'pixel/' + L.id + '.png'; im.alt = '';
			var rot = el('span', 'aprox-rotulo', a); rot.textContent = L.nome;
			a.addEventListener('mouseenter', function () { mostrar(L); });
			a.addEventListener('focus', function () { mostrar(L); });
			a.addEventListener('mouseleave', function () { mostrar(null); });
			a.addEventListener('blur', function () { mostrar(null); });
			return { L: L, a: a };
		});
		planeta.addEventListener('mouseenter', function () { mostrar('planeta'); });
		planeta.addEventListener('focus', function () { mostrar('planeta'); });
		planeta.addEventListener('mouseleave', function () { mostrar(null); });
		planeta.addEventListener('blur', function () { mostrar(null); });

		/* embaixo: a escolha, com calma */
		var painel = el('div', 'aprox-painel', camada);
		var titulo = el('p', 'aprox-titulo', painel);
		var lema = el('p', 'aprox-lema', painel);
		var escolhas = el('div', 'aprox-escolhas', painel);
		function botao(href, sprite, texto, principal) {
			var b = el('a', 'aprox-escolha' + (principal ? ' principal' : ''), escolhas);
			b.href = href;
			b.innerHTML = '<img src="pixel/' + sprite + '.png" alt="">' + texto;
			return b;
		}
		var bP = botao(id + '.html', id, T('Visitar ', 'Visit ') + nomeP, true);
		bP.addEventListener('mouseenter', function () { mostrar('planeta'); });
		bP.addEventListener('mouseleave', function () { mostrar(null); });
		luas.forEach(function (x) {
			var b = botao(x.L.id + '.html', x.L.id, x.L.nome);
			b.addEventListener('mouseenter', function () { mostrar(x.L); });
			b.addEventListener('mouseleave', function () { mostrar(null); });
		});
		var nota = el('p', 'aprox-nota', painel);
		nota.innerHTML = T('As luas estão ampliadas e mais perto do que na realidade. ', 'The moons are enlarged and closer than in reality. ') +
			'<a href="escala-real.html">' + T('Veja na escala real', 'See them at real scale') + ' &rarr;</a>';

		var sobre = null;
		function mostrar(x) {
			sobre = x;
			planeta.classList.toggle('ativo', x === 'planeta');
			luas.forEach(function (l) { l.a.classList.toggle('ativo', l.L === x); });
			camada.classList.toggle('com-foco', !!x);
			if (x && x !== 'planeta') {
				titulo.textContent = x.nome; lema.textContent = x.lema + ' · ' + T('uma lua de ', 'a moon of ') + nomeP;
			} else {
				titulo.textContent = x === 'planeta' ? nomeP : nomeP + T(' e ', ' and ') + (S.luas.length > 1 ? T('as suas luas', 'its moons') : T('a sua lua', 'its moon'));
				lema.textContent = x === 'planeta' ? LEMAS[id] : T('Escolha o seu destino: o planeta ou uma das luas.', 'Choose your destination: the planet or one of its moons.');
			}
		}
		mostrar(null);

		document.body.appendChild(camada);
		document.documentElement.classList.add('aproximando');

		/* posições: o planeta no meio, do tamanho que deixa a maior órbita caber na tela */
		var relogio = 0, antes = performance.now(), medida = null;
		function medir() {
			var W = palco.clientWidth, H = palco.clientHeight, zx = 1, zy = 1;
			S.luas.forEach(function (L) {
				var inc = L.incl * Math.PI / 180, rx = L.r, ry = L.r * L.ach;
				zx = Math.max(zx, Math.abs(rx * Math.cos(inc)) + Math.abs(ry * Math.sin(inc)));
				zy = Math.max(zy, Math.abs(rx * Math.sin(inc)) + Math.abs(ry * Math.cos(inc)));
			});
			var meio = Math.min(W, H);
			/* (com folga dos lados para o nome das luas, e nunca grande demais na tela do celular) */
			var rg = Math.min((W / 2 - Math.max(44, meio * 0.07)) / zx, (H / 2 - Math.max(26, meio * 0.07)) / zy, H * 0.26, W * 0.24);
			var largura = 2 * rg / (S.globo || 1);
			medida = { W: W, H: H, cx: W / 2, cy: H / 2, rg: rg, largura: largura, meio: meio };
			img.style.width = largura + 'px';
			planeta.style.left = (W / 2 - largura / 2) + 'px';
			planeta.style.top = (H / 2 - img.naturalHeight / img.naturalWidth * largura / 2) + 'px';
			prepararCeu();
		}
		function posicionar() {
			var m = medida;
			luas.forEach(function (x) {
				var L = x.L, inc = L.incl * Math.PI / 180, rx = m.rg * L.r, ry = rx * L.ach;
				var ang = L.fase + relogio / (L.dias * SEGUNDOS_POR_DIA) * Math.PI * 2;
				var ex = Math.cos(ang) * rx, ey = Math.sin(ang) * ry;
				var X = m.cx + ex * Math.cos(inc) - ey * Math.sin(inc), Y = m.cy + ex * Math.sin(inc) + ey * Math.cos(inc);
				var tam = Math.max(26, m.meio * L.tam / 100);
				x.a.style.width = tam + 'px';
				x.a.style.left = (X - tam / 2) + 'px';
				x.a.style.top = (Y - tam / 2) + 'px';
				/* na metade de trás da órbita, a lua passa atrás do planeta */
				x.a.style.zIndex = Math.sin(ang) < 0 ? 1 : 3;
				/* atrás do planeta, o nome dela some (senão aparece cortado pela borda do planeta) */
				x.a.classList.toggle('atras', Math.sin(ang) < 0 && Math.abs(X - m.cx) < m.largura / 2 + tam);
			});
		}
		function quadro(agora) {
			if (!estado) return;
			var dt = Math.max(0, Math.min(0.1, (agora - antes) / 1000));
			antes = agora;
			/* com o mouse em cima de uma lua ou do planeta, tudo para, para dar tempo de escolher */
			if (!calmo && !sobre) relogio += dt;
			posicionar();
			/* o céu: 30 quadros por segundo bastam (na chegada, com as estrelas riscando, em todos) */
			if (agora - ultimoCeu > 33 || agora - chegada < 1700) { ultimoCeu = agora; desenharCeu(agora); }
			requestAnimationFrame(quadro);
		}
		/* ---- o céu ---- */
		var cctx = ceu.getContext('2d'), CP = 3, CW = 0, CH = 0, cimg = null, cbuf = null, estrelas = [], chegada = 0, ultimoCeu = 0;
		var corP = [parseInt(S.cor.substr(1, 2), 16), parseInt(S.cor.substr(3, 2), 16), parseInt(S.cor.substr(5, 2), 16)];
		/* pontilhado ordenado 4x4, o mesmo das nebulosas do fundo do site */
		var LIMIAR = [0, 0.5, 0.125, 0.625, 0.75, 0.25, 0.875, 0.375, 0.1875, 0.6875, 0.0625, 0.5625, 0.9375, 0.4375, 0.8125, 0.3125];
		function px(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
		function sorte(i, k) { var h = Math.imul(i + 1, 374761393) ^ Math.imul(k + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
		function prepararCeu() {
			CP = window.innerWidth < 700 ? 2 : window.innerWidth < 1400 ? 3 : 4;
			CW = Math.max(1, Math.ceil(window.innerWidth / CP)); CH = Math.max(1, Math.ceil(window.innerHeight / CP));
			ceu.width = CW; ceu.height = CH;
			cimg = cctx.createImageData(CW, CH); cbuf = new Uint32Array(cimg.data.buffer);
			/* as estrelas do site: de 1 pixel, piscando, e umas poucas maiores, em cruz */
			estrelas = [];
			for (var i = 0, n = Math.round(CW * CH / 160); i < n; i++) {
				var c = sorte(i, 5);
				estrelas.push({ x: Math.floor(sorte(i, 1) * CW), y: Math.floor(sorte(i, 2) * CH), grande: sorte(i, 3) < 0.025, brilho: 0.35 + sorte(i, 4) * 0.65,
					vel: 0.6 + sorte(i, 6) * 2.4, fase: sorte(i, 7) * 6.3, c: c < 0.1 ? [180, 210, 255] : c < 0.16 ? [255, 210, 235] : c < 0.2 ? [255, 236, 190] : [255, 255, 255] });
			}
		}
		function ponto(x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < CW && y < CH) cbuf[y * CW + x] = c; }
		function desenharCeu(agora) {
			if (!cbuf || !medida) return;
			var s = agora / 1000, rp = palco.getBoundingClientRect();
			var cx = (rp.left + medida.cx) / CP, cy = (rp.top + medida.cy) / CP, R = medida.rg / CP;
			cbuf.fill(px(5, 3, 12));
			/* as estrelas; na chegada, elas passam riscando para fora, como a nave freando */
			var u = calmo ? 1 : Math.min(1, (agora - chegada) / 1600), risco = (1 - u) * (1 - u) * 90 / CP;
			for (var i = 0; i < estrelas.length; i++) {
				var e = estrelas[i];
				var onda = calmo ? 1 : 0.5 + 0.5 * Math.sin(s * e.vel + e.fase), b = e.brilho * (0.25 + 0.75 * onda * onda);
				if (risco > 1) {
					var dx = e.x - cx, dy = e.y - cy, dl = Math.hypot(dx, dy) || 1, comp = risco * (0.4 + dl / CW);
					for (var k = 0; k < comp; k++) { var bk = e.brilho * (1 - k / comp); ponto(e.x - dx / dl * k, e.y - dy / dl * k, px(e.c[0] * bk, e.c[1] * bk, e.c[2] * bk)); }
					continue;
				}
				var cc = px(e.c[0] * b, e.c[1] * b, e.c[2] * b);
				cbuf[e.y * CW + e.x] = cc;
				if (e.grande && b > 0.45) {
					var c2 = px(e.c[0] * b * 0.45, e.c[1] * b * 0.45, e.c[2] * b * 0.55);
					ponto(e.x - 1, e.y, c2); ponto(e.x + 1, e.y, c2); ponto(e.x, e.y - 1, c2); ponto(e.x, e.y + 1, c2);
				}
			}
			/* as órbitas, pontilhadas em pixel; a da lua em destaque acende na cor do planeta */
			if (camada.classList.contains('chegou')) luas.forEach(function (l) {
				var L = l.L, inc = L.incl * Math.PI / 180, rx = R * L.r, ry = rx * L.ach, aceso = sobre === L;
				var cor = aceso ? px(corP[0], corP[1], corP[2]) : px(70, 78, 112), passos = Math.ceil(2 * Math.PI * rx / (aceso ? 2 : 3));
				for (var j = 0; j < passos; j++) {
					var a = j / passos * Math.PI * 2, ex = Math.cos(a) * rx, ey = Math.sin(a) * ry;
					ponto(cx + ex * Math.cos(inc) - ey * Math.sin(inc), cy + ex * Math.sin(inc) + ey * Math.cos(inc), cor);
				}
			});
			cctx.putImageData(cimg, 0, 0);
		}

		function iniciar() {
			medir(); posicionar();
			chegada = performance.now();
			/* o voo: o planeta sai do lugar dele no sistema e cresce até o meio da tela */
			if (origem && !calmo) {
				var de = origem.getBoundingClientRect(), para = img.getBoundingClientRect();
				var esc = de.width / para.width;
				planeta.style.transition = 'none';
				planeta.style.transform = 'translate(' + (de.left + de.width / 2 - (para.left + para.width / 2)) + 'px,' + (de.top + de.height / 2 - (para.top + para.height / 2)) + 'px) scale(' + esc + ')';
				void planeta.offsetWidth;
				planeta.style.transition = '';
				planeta.style.transform = '';
			}
			requestAnimationFrame(function () { camada.classList.add('aberta'); });
			setTimeout(function () { if (estado) { camada.classList.add('chegou'); hud.textContent = T('Perto de ', 'Close to ') + nomeP; } }, calmo ? 0 : 1100);
			/* o foco vai para a cena (e não para o planeta, para o texto de escolha continuar aparecendo) */
			camada.tabIndex = -1;
			setTimeout(function () { if (estado) camada.focus({ preventScroll: true }); }, calmo ? 0 : 1200);
			requestAnimationFrame(quadro);
		}
		estado = { id: id, origem: origem, medir: function () { medir(); posicionar(); } };
		if (img.complete && img.naturalWidth) iniciar(); else img.addEventListener('load', iniciar);

		voltar.addEventListener('click', afastar);
		/* clicando no espaço vazio, a nave se afasta de novo */
		camada.addEventListener('click', function (e) { if (e.target === camada || e.target === palco || e.target === ceu) afastar(); });
	}

	function afastar() {
		if (!estado || !camada) return;
		var c = camada, origem = estado.origem, id = estado.id;
		estado = null;
		c.classList.remove('chegou');
		c.classList.add('saindo');
		var planeta = c.querySelector('.aprox-planeta'), img = planeta.querySelector('img');
		if (origem && !calmo) {
			var de = origem.getBoundingClientRect(), para = img.getBoundingClientRect();
			planeta.style.transform = 'translate(' + (de.left + de.width / 2 - (para.left + para.width / 2)) + 'px,' + (de.top + de.height / 2 - (para.top + para.height / 2)) + 'px) scale(' + (de.width / para.width) + ')';
		}
		c.classList.remove('aberta');
		setTimeout(function () {
			c.remove();
			if (camada === c) camada = null;
			document.documentElement.classList.remove('aproximando');
			var volta = sistema.querySelector('.astro[data-id="' + id + '"]');
			if (volta) volta.focus({ preventScroll: true });
		}, calmo ? 0 : 900);
	}

	document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && estado) afastar(); });
	window.addEventListener('resize', function () { if (estado) estado.medir(); });
})();
