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

	var ATRIBUTOS = ['aria-label', 'title', 'alt', 'content', 'placeholder'];
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
	function porDicionario(raiz) {
		var EN = window.EN; if (!EN) return;
		(function andar(el) {
			for (var c = el.firstElementChild; c; c = c.nextElementSibling) {
				if (/^(SCRIPT|STYLE|CANVAS|SVG)$/i.test(c.tagName) || c.classList.contains('idioma')) continue;
				var k = chave(c), filho = c.children.length === 1 ? c.children[0] : null;
				if (k && EN.t[k] !== undefined && !(filho && chave(filho) === k)) c.innerHTML = EN.t[k];
				else andar(c);
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

	// o seletor PT | EN, discreto, no canto de baixo à esquerda (trocar recarrega a página no outro idioma)
	var seletor = document.createElement('div');
	seletor.className = 'idioma';
	seletor.setAttribute('role', 'group');
	seletor.setAttribute('aria-label', idioma === 'en' ? 'Language' : 'Idioma');
	['pt', 'en'].forEach(function (cod, i) {
		if (i) { var sep = document.createElement('span'); sep.className = 'idioma-sep'; sep.textContent = '|'; sep.setAttribute('aria-hidden', 'true'); seletor.appendChild(sep); }
		var b = document.createElement('button');
		b.type = 'button';
		b.textContent = cod.toUpperCase();
		b.lang = cod === 'en' ? 'en' : 'pt-BR';
		b.setAttribute('aria-label', cod === 'en' ? 'English' : 'Português');
		b.setAttribute('aria-pressed', cod === idioma ? 'true' : 'false');
		b.addEventListener('click', function () {
			if (cod === idioma) return;
			try { localStorage.setItem('idioma', cod); } catch (e) {}
			var novo = location.href.replace(/([?&])lang=(pt|en)&?/, '$1').replace(/[?&](#|$)/, '$1');
			if (novo === location.href) location.reload(); else location.href = novo;
		});
		seletor.appendChild(b);
	});
	document.body.appendChild(seletor);
})();
