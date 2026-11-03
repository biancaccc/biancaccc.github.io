// Transição entre as páginas da viagem: o mesmo salto para a velocidade da luz da decolagem.
// Ao clicar num link do site, a tela escurece e as estrelas viram riscos cada vez mais
// rápidos (sem clarão branco). Na página nova, os riscos desaceleram e somem, revelando a página.
(function () {
	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	if (calmo) { document.documentElement.classList.remove('em-salto'); document.documentElement.style.background = ''; }
	if (calmo) { window.saltarPara = function (href) { location.href = href; }; return; }

	var tela = document.createElement('canvas');
	tela.className = 'transicao';
	tela.setAttribute('aria-hidden', 'true');
	document.body.appendChild(tela);
	var ctx = tela.getContext('2d');

	// tela em baixa resolução, como a da decolagem (pixels grandes)
	var P = 4, W = 1, H = 1, img = null, buf = null;
	function medir() {
		P = window.innerWidth < 700 ? 3 : window.innerWidth < 1500 ? 4 : 5;
		// o tamanho visível de verdade (sem a barra de rolagem), para a tela do salto não ficar esticada
		var lw = document.documentElement.clientWidth || window.innerWidth, lh = document.documentElement.clientHeight || window.innerHeight;
		W = Math.max(1, Math.ceil(lw / P));
		H = Math.max(1, Math.ceil(lh / P));
		tela.width = W; tela.height = H;
		img = ctx.createImageData(W, H);
		buf = new Uint32Array(img.data.buffer);
		if (window.Nave) window.Nave.construir(W); // a nave no tamanho desta tela
	}
	function cor(r, g, b) { return (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0; }
	var FUNDO = cor(5, 3, 12);

	// ---------- Poeira cósmica da Via Láctea ----------
	// Nuvens de gás e poeira passando por nós num "túnel": a profundidade de cada pixel é
	// 1 / distância do centro, então as nuvens nascem lá no fundo e correm para as bordas.
	// Cores da Via Láctea (azul, lavanda, creme, marrom da poeira e alguns nós rosados),
	// sempre em tons médios: nada de branco forte na cara.
	function hash3(x, y, z) {
		var h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1440662683)) | 0;
		h = Math.imul(h ^ (h >>> 13), 1274126177);
		return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
	}
	function ruido3(x, y, z) {
		var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
		var u = x - xi, v = y - yi, w = z - zi;
		u = u * u * (3 - 2 * u); v = v * v * (3 - 2 * v); w = w * w * (3 - 2 * w);
		function l(a, b, k) { return a + (b - a) * k; }
		return l(
			l(l(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), l(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
			l(l(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), l(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
	}
	var LIM16 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
	var TONS_POEIRA = [[46, 58, 128], [92, 96, 168], [150, 132, 176], [184, 156, 124], [110, 68, 52]];
	var ROSA = [176, 72, 132];
	var NIVEIS = [0, 0.3, 0.45, 0.6, 0.72, 0.8];
	// indo para o centro da galáxia (Sagittarius A*, Bolhas de Fermi): a poeira fica creme e
	// branca, e lá no fundo do túnel aparece o brilho do centro (claro, mas sem estourar)
	var TONS_CENTRO = [[176, 162, 196], [214, 198, 172], [238, 226, 200], [252, 246, 232], [200, 176, 146]];
	var BRILHO_CENTRO = [255, 250, 240];
	var NIVEIS_BRANCO = [0, 0.5, 0.68, 0.82, 0.92, 0.98];
	var claro = 0;
	function vaiProCentro(endereco) { return /(sagitario-a|fermi)\.html/.test(endereco || ''); }
	// voltando para a Via Láctea (a página inicial), o salto é só de estrelas no preto, sem poeira
	var semPoeira = false;
	function vaiPraGalaxia(endereco) { try { var p = new URL(endereco, location.href).pathname; return /(\/|index\.html)$/.test(p); } catch (e) { return false; } }
	// indo de um planeta a outro (dentro do Sistema Solar) também não tem nebulosa no caminho
	function noSistemaSolar(endereco) { try { return /(sistema-solar|sol|mercurio|venus|terra|marte|jupiter|saturno|urano|netuno|lua|io|europa|ganimedes|tita|encelado|mimas|miranda|tritao)\.html$/.test(new URL(endereco, location.href).pathname); } catch (e) { return false; } }
	// desenha a poeira em buf (W x H); viajado = quanto já andamos; forca de 0 (nada) a 1
	function poeiraCosmica(buf, W, H, viajado, forca, centroY, claroAqui) {
		if (forca <= 0.02) { buf.fill(FUNDO); return; }
		var cl = claroAqui === undefined ? claro : claroAqui;
		var tons = cl > 0 ? TONS_CENTRO : TONS_POEIRA;
		var cx = W / 2, cy = H * (centroY || 0.5), esc = Math.min(W, H);
		for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
			var dx = (x + 0.5 - cx) / esc, dy = (y + 0.5 - cy) / esc;
			var r = Math.sqrt(dx * dx + dy * dy) + 0.001;
			var prof = 0.3 / r + viajado; // profundidade no túnel
			var ux = dx / r, uy = dy / r;
			var lim = LIM16[(x & 3) + ((y & 3) << 2)] / 16;
			// o brilho do centro da galáxia, no fundo do túnel (bem branco no meio, pontilhado na borda)
			if (cl > 0) {
				var g = cl * forca * Math.exp(-r * r / 0.04) * 1.15;
				var ng = Math.min(5, Math.floor(g * 5 + lim));
				if (ng >= 2) { var bg = NIVEIS_BRANCO[ng]; buf[y * W + x] = cor(BRILHO_CENTRO[0] * bg, BRILHO_CENTRO[1] * bg, BRILHO_CENTRO[2] * bg); continue; }
			}
			var n = ruido3(ux * 2.2 + 5, uy * 2.2, prof * 1.1) * 0.65 + ruido3(ux * 6 + 11, uy * 6, prof * 3.2) * 0.35;
			var tunel = Math.min(1, r * 2.4 + cl * 0.35); // o centro fica mais livre, como um túnel
			var dens = Math.max(0, (n - 0.43) * 2.4) * tunel * forca * (1 + cl * 0.25);
			var nivel = Math.min(5, Math.floor(dens * 5 + lim));
			if (nivel <= 0) { buf[y * W + x] = FUNDO; continue; }
			var tipo = ruido3(ux * 1.4 + 20, uy * 1.4, prof * 0.45);
			var c = n > 0.8 && tipo > 0.55 && tipo < 0.7 && !cl ? ROSA : tons[Math.min(4, Math.floor(tipo * 5))];
			var b = NIVEIS[nivel];
			buf[y * W + x] = cor(5 + c[0] * b, 3 + c[1] * b, 12 + c[2] * b);
		}
	}
	window.poeiraCosmica = function (buf, W, H, viajado, forca, centroY) { poeiraCosmica(buf, W, H, viajado, forca, centroY, 0); };
	// estrelas em 3D: x e y na tela, z é a distância (quanto menor, mais perto)
	var CORES = [[255, 255, 255], [200, 225, 255], [255, 220, 245], [180, 240, 255]];
	var estrelas = [];
	function nova(e, inicio) {
		e.x = Math.random() * 2 - 1; e.y = Math.random() * 2 - 1;
		e.z = inicio ? 0.05 + Math.random() * 0.95 : 1;
		e.c = CORES[(Math.random() * CORES.length) | 0];
		return e;
	}
	for (var i = 0; i < 520; i++) estrelas.push(nova({}, true));
	// as estrelas são guardadas na troca de página, para a página nova continuar exatamente
	// as mesmas (sem pular para outras posições no meio do salto)
	function guardarEstrelas() {
		var lista = [];
		for (var n = 0; n < estrelas.length; n++) { var e = estrelas[n]; lista.push(+e.x.toFixed(4), +e.y.toFixed(4), +e.z.toFixed(4), CORES.indexOf(e.c)); }
		try { sessionStorage.setItem('saltoEstrelas', JSON.stringify({ e: lista, v: viajado })); } catch (er) {}
	}
	function recuperarEstrelas() {
		try {
			var dados = JSON.parse(sessionStorage.getItem('saltoEstrelas'));
			sessionStorage.removeItem('saltoEstrelas');
			if (!dados || !dados.e) return;
			estrelas = [];
			for (var n = 0; n + 3 < dados.e.length; n += 4) estrelas.push({ x: dados.e[n], y: dados.e[n + 1], z: dados.e[n + 2], c: CORES[dados.e[n + 3]] || CORES[0] });
			viajado = dados.v || 0;
		} catch (er) {}
	}

	var viajado = 0, centroY = 0.5;
	// forca: quanto os motores da nave estão acelerando (0 a 1)
	function desenhar(dt, v, rastro, azul, poeira, forca) {
		viajado += v * dt * 0.35;
		poeiraCosmica(buf, W, H, viajado, semPoeira ? 0 : (poeira || 0), centroY);
		var cx = W / 2, cy = H * centroY, f = Math.min(W, H) * 0.55;
		for (var n = 0; n < estrelas.length; n++) {
			var e = estrelas[n];
			e.z -= v * dt;
			if (e.z <= 0.02) { nova(e, false); continue; }
			var x1 = cx + e.x / e.z * f, y1 = cy + e.y / e.z * f;
			if (x1 < -50 || y1 < -50 || x1 > W + 50 || y1 > H + 50) { nova(e, false); continue; }
			var z2 = Math.min(1, e.z + rastro);
			var x0 = cx + e.x / z2 * f, y0 = cy + e.y / z2 * f;
			var brilho = Math.min(1, (1.05 - e.z) * 1.4);
			var c = [e.c[0] + (150 - e.c[0]) * azul, e.c[1] + (200 - e.c[1]) * azul, e.c[2] + (255 - e.c[2]) * azul];
			var passos = Math.min(220, Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))));
			for (var p = 0; p <= passos; p++) {
				var t = p / passos, b = brilho * (0.25 + 0.75 * t);
				var px = (x0 + (x1 - x0) * t) | 0, py = (y0 + (y1 - y0) * t) | 0;
				if (px >= 0 && py >= 0 && px < W && py < H) buf[py * W + px] = cor(c[0] * b, c[1] * b, c[2] * b);
			}
		}
		// a nave voando no meio das estrelas, como na decolagem
		// (forca -1 = sem nave: é o caso da página que só aparece do escuro, sem salto)
		if (window.Nave && forca !== -1) { forca = forca || 0; window.Nave.desenhar(buf, W, H, performance.now() / 1000, forca * 1.2, forca); }
		ctx.putImageData(img, 0, 0);
	}

	// ---------- Animação ----------
	// modo: 'chegada' (desacelerando) ou 'partida' (acelerando)
	var modo = null, inicio = 0, anterior = 0, destino = null, rodando = false;
	function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
	var CHEGADA = 0.75, SUMIR = 0.5, PARTIDA = 0.9;

	function quadro(agora) {
		// o relógio do salto só começa no primeiro quadro de verdade: enquanto a página nova ainda
		// prepara as artes (o que pode levar um tempinho), a animação não pode "pular" para a frente
		if (!inicio) inicio = anterior = agora;
		var dt = Math.min(0.05, (agora - anterior) / 1000);
		anterior = agora;
		var tc = (agora - inicio) / 1000;
		if (modo === 'partida') {
			var k = Math.min(1, tc / PARTIDA), ease = k * k * k;
			tela.style.opacity = Math.min(1, tc / entrada);
			desenhar(dt, 0.3 + ease * 4.5, 0.02 + ease * 0.42, ease, 0.45 + 0.55 * k, k);
			if (tc >= PARTIDA && destino) {
				var href = destino; destino = null;
				// guarda o último quadro do salto: a página nova já nasce com ele no fundo,
				// então nenhum quadro vazio aparece enquanto ela carrega
				try { sessionStorage.setItem('saltoQuadro', tela.toDataURL('image/png')); } catch (e) {}
				guardarEstrelas();
				location.href = href;
				// congela neste quadro: é exatamente o que a página nova vai mostrar ao abrir
				modo = 'indo'; rodando = false;
				return;
			}
		} else if (modo === 'chegada') {
			var q = Math.min(1, tc / CHEGADA), freio = 1 - suave(q);
			desenhar(dt, 0.15 + freio * 4.5, 0.01 + freio * 0.42, freio, 0.35 + 0.65 * freio, freio);
			tela.style.opacity = 1 - suave((tc - CHEGADA * 0.6) / SUMIR);
			if (tc > CHEGADA * 0.6 + SUMIR) { parar(); return; }
		}
		requestAnimationFrame(quadro);
	}
	function comecar(m) {
		modo = m; inicio = 0;
		tela.style.display = 'block';
		if (!rodando) { rodando = true; requestAnimationFrame(quadro); }
	}
	function parar() {
		modo = null; rodando = false;
		tela.style.opacity = 0;
		tela.style.display = 'none';
	}

	// Ir para outra página com o salto
	// opcoes (opcional): centroY = de onde as estrelas saem (0 a 1), entrada = segundos para a tela
	// do salto aparecer por cima (a viagem pela galáxia usa uma entrada mais lenta, seguindo a nave)
	var entrada = 0.3;
	window.saltarPara = function (href, opcoes) {
		if (modo === 'partida') return;
		centroY = opcoes && opcoes.centroY ? opcoes.centroY : 0.5;
		entrada = opcoes && opcoes.entrada ? opcoes.entrada : 0.3;
		try { sessionStorage.setItem('salto', '1'); sessionStorage.setItem('saltoCentro', String(centroY)); } catch (e) {}
		destino = href;
		claro = vaiProCentro(href) ? 1 : 0;
		semPoeira = vaiPraGalaxia(href) || (noSistemaSolar(location.href) && noSistemaSolar(href));
		try { sessionStorage.setItem('saltoSemPoeira', semPoeira ? '1' : '0'); } catch (e) {}
		tela.style.opacity = 0;
		comecar('partida');
		rodando = true;
	};

	// Fim da decolagem (viagem.js): a tela do salto cobre tudo e vai freando, revelando a galáxia
	window.cobrirComSalto = function (cy) {
		centroY = cy || 0.5;
		claro = 0;
		semPoeira = true; // a decolagem é só estrelas e a nave, sem nebulosas
		tela.style.opacity = 1;
		desenhar(0, 0, 0.42, 1, 1, 1);
		comecar('chegada');
	};

	function tirarCobertura() {
		var raiz = document.documentElement;
		raiz.classList.remove('em-salto');
		raiz.style.background = ''; raiz.style.imageRendering = '';
		// o fundo escuro do <html> só serve para o começo: se ficasse, o fundo do <body> deixaria de
		// "subir" para a página e cobriria as estrelas e nebulosas do fundo (fundo.js)
		raiz.style.backgroundColor = '';
		try { sessionStorage.removeItem('saltoQuadro'); } catch (e) {}
	}

	// Chegada: se viemos de um salto, as estrelas desaceleram; se não, a página só aparece do escuro
	medir();
	var veioDeSalto = false;
	try { veioDeSalto = sessionStorage.getItem('salto') === '1'; sessionStorage.removeItem('salto'); } catch (e) {}
	window.veioDeSalto = veioDeSalto; // (a cena de chegada, chegada.js, só toca a versão curta quando a nave chegou voando)
	if (veioDeSalto) {
		// as estrelas continuam saindo do mesmo ponto da página anterior
		try { centroY = parseFloat(sessionStorage.getItem('saltoCentro')) || 0.5; sessionStorage.removeItem('saltoCentro'); } catch (e) {}
		claro = vaiProCentro(location.pathname) ? 1 : 0;
		semPoeira = vaiPraGalaxia(location.href);
		try { if (sessionStorage.getItem('saltoSemPoeira') === '1') semPoeira = true; sessionStorage.removeItem('saltoSemPoeira'); } catch (e) {}
		recuperarEstrelas();
		tela.style.opacity = 1;
		desenhar(0, 0, 0.42, 1, 1, 1);
		// a tela das estrelas já cobre tudo: pode tirar a cobertura que veio do <head>
		tirarCobertura();
		comecar('chegada');
		setTimeout(function () { if (modo === 'chegada') parar(); }, 4000); // garantia, caso a aba abra em segundo plano
	} else {
		tela.style.opacity = 1;
		desenhar(0, 0, 0.01, 0, 0, -1);
		document.documentElement.style.backgroundColor = ''; // a tela do salto já cobre tudo (veja tirarCobertura)
		requestAnimationFrame(function () { requestAnimationFrame(function () { tela.classList.add('sumindo'); tela.style.opacity = 0; }); });
		setTimeout(function () { if (!modo) { tela.classList.remove('sumindo'); tela.style.display = 'none'; } }, 700);
	}

	// Voltando pelo botão "voltar" do navegador: tira a tela do salto
	window.addEventListener('pageshow', function (e) { if (e.persisted) parar(); });
	window.addEventListener('resize', medir);

	// a transição simples: uma cortina escura cobre a página e só então vamos para a outra
	function escurecerPara(href) {
		var cortina = document.createElement('div');
		cortina.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#05030c;opacity:0;transition:opacity .35s ease;pointer-events:none';
		document.body.appendChild(cortina);
		requestAnimationFrame(function () { requestAnimationFrame(function () { cortina.style.opacity = 1; }); });
		setTimeout(function () { location.href = href; }, 380);
	}
	document.addEventListener('click', function (e) {
		var a = e.target.closest && e.target.closest('a[href]');
		if (!a || e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
		if (a.target && a.target !== '_self') return;
		var url = new URL(a.href, location.href);
		if (url.origin !== location.origin && url.protocol !== 'file:') return;
		// links para outra parte da mesma página não têm transição
		if (url.pathname === location.pathname && url.hash) return;
		e.preventDefault();
		// a linha do tempo não é uma viagem: indo para ela (ou saindo dela) a página só escurece
		if (/linha-do-tempo\.html$/.test(url.pathname) || /linha-do-tempo\.html$/.test(location.pathname)) return escurecerPara(a.href);
		window.saltarPara(a.href);
	});
})();
