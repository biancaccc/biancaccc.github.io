// O idioma do site: português (o original) ou inglês.
// Na primeira visita, o site abre no idioma do navegador (português para quem usa português; inglês
// para todo o resto) e depois lembra a escolha (localStorage: idioma). ?lang=en ou ?lang=pt força um.
// Nas páginas, um texto traduzido fica no próprio elemento: data-en="..." troca o conteúdo, e
// data-en-aria-label, data-en-title, data-en-alt e data-en-content trocam esses atributos.
// Nos scripts, T('texto em português', 'text in English') devolve o texto no idioma da visita.
// Os letreiros pintados dentro das cenas (AGÊNCIA ANDARILHA, LÁMEN 24H...) ficam sempre em português.
// Carregue antes de todos os outros scripts, logo no fim do <body>.
(function () {
	var salvo = null;
	try { salvo = localStorage.getItem('idioma'); } catch (e) {}
	var pedido = /[?&]lang=(pt|en)\b/.exec(location.search);
	var navegador = ((navigator.languages && navigator.languages[0]) || navigator.language || 'pt').toLowerCase();
	var idioma = pedido ? pedido[1] : (salvo === 'pt' || salvo === 'en') ? salvo : navegador.indexOf('pt') === 0 ? 'pt' : 'en';
	if (pedido) try { localStorage.setItem('idioma', idioma); } catch (e) {}
	window.IDIOMA = idioma;
	document.documentElement.lang = idioma === 'en' ? 'en' : 'pt-BR';
	window.T = function (pt, en) { return idioma === 'en' && en != null ? en : pt; };
	window.LOCALE = idioma === 'en' ? 'en-US' : 'pt-BR'; /* para os números: 26.700 vira 26,700 em inglês */

	var ATRIBUTOS = ['aria-label', 'title', 'alt', 'content', 'placeholder', 'data-astro', 'data-planeta', 'data-plural', 'data-nome'];
	function traduzir(raiz) {
		if (idioma !== 'en') return;
		[].forEach.call(raiz.querySelectorAll('[data-en]'), function (el) {
			if (el.tagName === 'TITLE') el.textContent = el.getAttribute('data-en'); else el.innerHTML = el.getAttribute('data-en');
		});
		ATRIBUTOS.forEach(function (a) {
			[].forEach.call(raiz.querySelectorAll('[data-en-' + a + ']'), function (el) { el.setAttribute(a, el.getAttribute('data-en-' + a)); });
		});
	}
	// os textos longos das páginas ficam em en/<página>.js (e os repetidos em en/comum.js), num
	// dicionário { 'texto em português': 'English (com as mesmas marcações)' }; a troca procura cada
	// elemento pelo texto dele (sem as marcações) e troca o de dentro mais fundo que tiver aquele texto
	function chave(el) { return el.textContent.replace(/\s+/g, ' ').trim(); }
	// (só troca o de dentro de quem tem apenas texto e marcações de texto: nada de imagem, canvas ou id lá dentro)
	var SO_TEXTO = ':not(b):not(i):not(em):not(strong):not(small):not(span):not(a):not(br):not(sup):not(sub):not(abbr):not(kbd):not(mark)';
	function soTexto(el) { return !el.querySelector(SO_TEXTO) && !el.querySelector('[id]'); }
	// os textos soltos ao lado de imagens (como os nomes dos planetas no rodapé): troca só o texto
	var conversor = document.createElement('div');
	function soltos(el) {
		for (var n = el.firstChild; n; n = n.nextSibling) {
			if (n.nodeType !== 3) continue;
			var t = n.nodeValue.replace(/\s+/g, ' ').trim(), v = t && window.EN.t[t];
			if (v === undefined || !v) continue;
			conversor.innerHTML = v;
			n.nodeValue = n.nodeValue.replace(n.nodeValue.trim(), conversor.textContent);
		}
	}
	function porDicionario(raiz) {
		var EN = window.EN; if (!EN) return;
		(function andar(el) {
			for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
				if (/^(SCRIPT|STYLE|CANVAS|SVG)$/i.test(c.tagName) || c.classList.contains('idioma')) continue;
				var k = chave(c), filho = c.children.length === 1 ? c.children[0] : null;
				if (k && EN.t[k] !== undefined && !(filho && chave(filho) === k) && soTexto(c)) c.innerHTML = EN.t[k];
				else { soltos(c); andar(c); }
			}
		})(raiz.body || raiz);
		ATRIBUTOS.forEach(function (a) {
			[].forEach.call(raiz.querySelectorAll('[' + a + ']'), function (el) { var v = el.getAttribute(a); if (EN.a[v] !== undefined) el.setAttribute(a, EN.a[v]); });
		});
		if (EN.t[document.title] !== undefined) document.title = EN.t[document.title];
	}
	window.traduzirPagina = function (raiz) { traduzir(raiz); porDicionario(raiz); };
	traduzir(document);
	if (idioma === 'en') {
		// o dicionário desta página (carregado agora, antes dos outros scripts lerem a página)
		var pagina = (location.pathname.split('/').pop() || 'index').replace(/\.html$/, '') || 'index';
		document.write('<script src="en/comum.js"><\/script><script src="en/' + pagina + '.js"><\/script><script>window.traduzirPagina && porDicionarioAgora()<\/script>');
		window.porDicionarioAgora = function () { porDicionario(document); };
	}

	// trocar o idioma recarrega a página no outro idioma (o seletor e a tela de início do embarque usam)
	window.trocarIdioma = function (cod) {
		if (cod === idioma) return;
		try { localStorage.setItem('idioma', cod); } catch (e) {}
		var novo = location.href.replace(/([?&])lang=(pt|en)&?/, '$1').replace(/[?&](#|$)/, '$1');
		if (novo === location.href) location.reload(); else location.href = novo;
	};
	// o seletor PT | EN, embaixo, perto do crédito da autora: maior na capa, discreto no resto
	// (um globinho em pixel art na frente)
	var seletor = document.createElement('div');
	seletor.className = 'idioma';
	seletor.setAttribute('role', 'group');
	seletor.setAttribute('aria-label', idioma === 'en' ? 'Language' : 'Idioma');
	seletor.innerHTML = '<svg class="idioma-globo" viewBox="0 0 9 9" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">' +
		'<rect x="3" y="0" width="3" height="1"/><rect x="1" y="1" width="2" height="1"/><rect x="6" y="1" width="2" height="1"/><rect x="0" y="3" width="1" height="3"/><rect x="8" y="3" width="1" height="3"/>' +
		'<rect x="1" y="7" width="2" height="1"/><rect x="6" y="7" width="2" height="1"/><rect x="3" y="8" width="3" height="1"/><rect x="4" y="1" width="1" height="7"/><rect x="1" y="4" width="7" height="1"/>' +
		'<rect x="2" y="2" width="1" height="5" opacity="0.6"/><rect x="6" y="2" width="1" height="5" opacity="0.6"/><rect x="0" y="2" width="1" height="1" opacity="0.6"/><rect x="8" y="2" width="1" height="1" opacity="0.6"/><rect x="0" y="6" width="1" height="1" opacity="0.6"/><rect x="8" y="6" width="1" height="1" opacity="0.6"/></svg>';
	['pt', 'en'].forEach(function (cod, i) {
		if (i) { var sep = document.createElement('span'); sep.className = 'idioma-sep'; sep.textContent = '|'; sep.setAttribute('aria-hidden', 'true'); seletor.appendChild(sep); }
		var b = document.createElement('button');
		b.type = 'button';
		b.textContent = cod.toUpperCase();
		b.lang = cod === 'en' ? 'en' : 'pt-BR';
		b.setAttribute('aria-label', cod === 'en' ? 'English' : 'Português');
		b.setAttribute('aria-pressed', cod === idioma ? 'true' : 'false');
		b.addEventListener('click', function () { window.trocarIdioma(cod); });
		seletor.appendChild(b);
	});
	document.body.appendChild(seletor);
})();
