// Páginas dos planetas e dos destinos:
//  - o "diário de bordo" ao lado marca a seção que está sendo lida e mostra o progresso;
//  - as seções aparecem deslizando quando chegam na tela;
//  - um aviso "role para explorar" no topo.
(function () {
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	var raiz = document.documentElement;
	if (!calmo && 'IntersectionObserver' in window) raiz.classList.add('com-js');

	// aviso para rolar, no topo
	var destaque = document.querySelector('.destaque');
	if (destaque && document.getElementById('leitura')) {
		var rolar = document.createElement('a');
		rolar.className = 'rolar';
		rolar.href = '#leitura';
		rolar.textContent = 'Role para explorar';
		destaque.appendChild(rolar);
	}

	// seções aparecendo
	if (raiz.classList.contains('com-js')) {
		var revelar = new IntersectionObserver(function (entradas) {
			entradas.forEach(function (e) {
				if (e.isIntersecting) { e.target.classList.add('visivel'); revelar.unobserve(e.target); }
			});
		}, { rootMargin: '0px 0px -12% 0px' });
		document.querySelectorAll('.bloco, .comparacao, .fecho').forEach(function (el) { revelar.observe(el); });
	}

	// diário de bordo: seção atual e progresso
	var sumario = document.querySelector('.sumario');
	var links = document.querySelectorAll('.sumario a');
	if (!sumario || !links.length) return;
	var titulo = sumario.querySelector('p');
	if (titulo) titulo.textContent = 'Diário de bordo';
	var barra = document.createElement('div');
	barra.className = 'barra-leitura';
	barra.innerHTML = '<i></i>';
	sumario.appendChild(barra);
	var conteudo = document.querySelector('.conteudo');

	function progresso() {
		var r = conteudo.getBoundingClientRect();
		var total = r.height - window.innerHeight * 0.5;
		var p = Math.max(0, Math.min(1, (window.innerHeight * 0.5 - r.top) / Math.max(1, total)));
		sumario.style.setProperty('--progresso', (p * 100).toFixed(1) + '%');
		if (titulo) titulo.setAttribute('data-progresso', Math.round(p * 100) + '%');
	}
	window.addEventListener('scroll', progresso, { passive: true });
	window.addEventListener('resize', progresso);
	progresso();

	if (!('IntersectionObserver' in window)) return;
	var porId = {}, alvos = [];
	links.forEach(function (a) {
		var id = a.getAttribute('href').slice(1);
		var alvo = document.getElementById(id);
		if (!alvo) return;
		porId[id] = a;
		alvos.push(alvo);
	});
	var visiveis = {};
	var observador = new IntersectionObserver(function (entradas) {
		entradas.forEach(function (e) { visiveis[e.target.id] = e.isIntersecting; });
		for (var i = 0; i < alvos.length; i++) {
			if (visiveis[alvos[i].id]) {
				links.forEach(function (a) { a.classList.remove('ativo'); });
				porId[alvos[i].id].classList.add('ativo');
				break;
			}
		}
	}, { rootMargin: '-90px 0px -55% 0px' });
	alvos.forEach(function (a) { observador.observe(a); });
})();
