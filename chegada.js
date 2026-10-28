// Chegada: sempre que a nave chega voando a um destino, uma cena curta vista da cabine da PX-01
// (a mesma do embarque, com o para-brisa em leque):
//  1. a nave sai do salto e as estrelas freiam na janela;
//  2. às vezes acontece algo de verdade no caminho (só fenômenos reais, explicados pelo computador
//     de bordo): uma chuva de meteoros vista de cima, um cometa, a sonda Voyager 1, o clarão de um
//     raio cósmico atravessando o olho;
//  3. o destino cresce na janela;
//  4. onde há chão (Mercúrio, Vênus, Marte) a nave pousa, levanta poeira e a alfândega vem até
//     ela; nos outros lugares (gigantes de gás, o Sol, estrelas, nebulosas, o buraco negro) ela
//     atraca numa estação de alfândega em órbita, a uma distância segura;
//  5. na Terra, a nave volta ao hangar 11 e, se veio suja de outro lugar (poeira vermelha de
//     Marte, gelo, fuligem do Sol...), a equipe de solo lava a nave enquanto a gente olha;
//  6. a alfândega carimba o passaporte e a gente desembarca na página.
// Toca na primeira visita a cada destino (localStorage "chegadas"), de novo a cada volta que chega num
// salto (a alfândega confere o visto que já está no passaporte) e na Terra sempre que a nave volta suja.
// "?chegada" no endereço mostra de novo.
(function () {
	var pagina = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
	var NOMES = {
		mercurio: 'Mercúrio', venus: 'Vênus', terra: 'Terra', marte: 'Marte', jupiter: 'Júpiter', saturno: 'Saturno', urano: 'Urano', netuno: 'Netuno',
		sol: 'Sol', 'sistema-solar': 'Sistema Solar', 'sagitario-a': 'Sagittarius A*', fermi: 'Bolhas de Fermi', orion: 'Nebulosa de Órion',
		pleiades: 'Plêiades', helice: 'Nebulosa da Hélice', tabby: 'Estrela de Tabby', 'omega-centauri': 'Omega Centauri', betelgeuse: 'Betelgeuse',
		'eta-carinae': 'Eta Carinae', sirius: 'Sirius', caranguejo: 'Nebulosa do Caranguejo', 'proxima-centauri': 'Proxima Centauri'
	};
	if (!NOMES[pagina]) return;
	var NOME = NOMES[pagina];
	var POUSO = { mercurio: 1, venus: 1, marte: 1 };
	var PLANETAS = ['mercurio', 'venus', 'terra', 'marte', 'jupiter', 'saturno', 'urano', 'netuno', 'sol'];
	var noSistema = PLANETAS.indexOf(pagina) >= 0;
	var tipo = pagina === 'terra' ? 'terra' : POUSO[pagina] ? 'pouso' : 'estacao';
	// três modelos de estação: o anel girando (perto dos planetas), o escudo de sombra (perto das
	// estrelas, protegendo do calor e da luz) e o farol de espaço profundo (nebulosas, buraco negro)
	var MODELO = /^(sol|betelgeuse|sirius|proxima-centauri|tabby|eta-carinae|pleiades)$/.test(pagina) ? 'escudo'
		: /^(sagitario-a|fermi|orion|helice|caranguejo|omega-centauri)$/.test(pagina) ? 'farol' : 'anel';
	// o agente da alfândega de cada lugar: as cores do uniforme, um detalhe próprio e o que ele conta
	// (só coisas de verdade sobre o lugar)
	var AGENTES = {
		mercurio: { terno: '#6a6e7a', quepe: '#3a3d46', olho: '#ffd36a', extra: 'viseira', fala: 'Bem-vindo a Mercúrio! Aqui um dia, de um nascer do Sol a outro, dura 176 dias da Terra.' },
		venus: { terno: '#a8562a', quepe: '#6a2a10', olho: '#ffb86a', extra: 'blindado', fala: 'Bem-vindo a Vênus! Não abra a janela: lá fora chove ácido, e aqui o Sol nasce no oeste.' },
		marte: { terno: '#8a3a24', quepe: '#5a2414', olho: '#7fe3ff', extra: 'mascara', fala: 'Bem-vindo a Marte! Cuidado com a poeira: às vezes uma tempestade cobre o planeta inteiro.' },
		jupiter: { terno: '#a8743a', quepe: '#6a4a22', olho: '#ffd8a0', extra: 'faixas', fala: 'Estação Calisto, bem-vindo a Júpiter! Ficamos perto da lua Calisto, longe da radiação forte do planeta.' },
		saturno: { terno: '#c8a86a', quepe: '#8a6a3a', olho: '#fff0c8', extra: 'anel', fala: 'Bem-vindo a Saturno! Os anéis são de gelo e pedrinhas, e quase todos têm só uns dez metros de espessura.' },
		urano: { terno: '#4aa8a8', quepe: '#2a6a7a', olho: '#dff8ff', extra: 'deitado', fala: 'Bem-vindo a Urano! Ele gira deitado: cada polo tem uns 42 anos de dia e 42 de noite.' },
		netuno: { terno: '#2a4ab8', quepe: '#14205a', olho: '#7fa8ff', extra: 'cachecol', fala: 'Bem-vindo a Netuno! Os ventos daqui passam de 2 mil km/h. Segure o quepe!' },
		sol: { terno: '#c8a040', quepe: '#8a6a1a', olho: '#3a2a10', extra: 'coroa', fala: 'Estação Escudo Solar, bem-vindo! Atrás do escudo está fresquinho; do outro lado, a superfície do Sol passa de 5.500 °C.' },
		'sistema-solar': { terno: '#1c2a6e', quepe: '#101a4a', olho: '#7fe3ff', extra: 'oito', fala: 'Bem-vindo ao Sistema Solar, a nossa casa! Oito planetas, um Sol e muita poeira de cometa.' },
		'sagitario-a': { terno: '#1a1a22', quepe: '#0a0a10', olho: '#ffb347', extra: 'gravata', fala: 'Estação Horizonte, bem-vindo! Daqui não passamos: perto do buraco negro, até o tempo anda mais devagar.' },
		fermi: { terno: '#6a2a8a', quepe: '#3a1050', olho: '#e070ff', extra: 'visorGama', fala: 'Farol Fermi, bem-vindo! As bolhas só aparecem em raios gama, então use o nosso visor especial.' },
		orion: { terno: '#b84a8a', quepe: '#6a1a4a', olho: '#ffb8e0', extra: 'flor', fala: 'Bem-vindo ao berçário de estrelas de Órion! Fale baixinho: tem estrela nascendo.' },
		pleiades: { terno: '#3a6ad8', quepe: '#1a3a8a', olho: '#cfe0ff', extra: 'estrelas', fala: 'Bem-vindo às Plêiades, as Sete Irmãs! Na verdade são mais de mil, mas só umas sete aparecem a olho nu.' },
		helice: { terno: '#2a8a8a', quepe: '#14505a', olho: '#5fd6d0', extra: 'monoculo', fala: 'Bem-vindo ao Olho de Deus! Isto é o que sobrou de uma estrela parecida com o Sol. Um dia o nosso vai ficar assim.' },
		tabby: { terno: '#a85a2a', quepe: '#5a2a10', olho: '#ff9d5c', extra: 'interrogacao', fala: 'Bem-vindo à Estrela de Tabby! O brilho dela cai sem aviso. Suspeito número um: poeira. Mas seguimos de olho.' },
		'omega-centauri': { terno: '#a8862a', quepe: '#5a4410', olho: '#ffe08a', extra: 'medalhas', fala: 'Bem-vindo a Omega Centauri: uns dez milhões de estrelas numa bola só. Talvez seja o miolo de uma galáxia que a Via Láctea engoliu.' },
		betelgeuse: { terno: '#a82a1a', quepe: '#5a1008', olho: '#ff6a3d', extra: 'oculos', fala: 'Bem-vindo a Betelgeuse! No lugar do Sol, ela engoliria até a órbita de Marte. E um dia vai explodir.' },
		'eta-carinae': { terno: '#8a4ab8', quepe: '#4a1a6a', olho: '#c8a0ff', extra: 'antenas', fala: 'Bem-vindo a Eta Carinae! Em 1843 uma das duas estrelas explodiu sem morrer e virou a segunda mais brilhante do céu.' },
		sirius: { terno: '#3a5ad8', quepe: '#1a2a7a', olho: '#cfe4ff', extra: 'orelhas', fala: 'Bem-vindo a Sirius, a estrela mais brilhante do céu da Terra! A companheira, Sirius B, é uma anã branca do tamanho da Terra.' },
		caranguejo: { terno: '#4a8a2a', quepe: '#244a14', olho: '#9be36a', extra: 'pinca', fala: 'Bem-vindo ao Caranguejo! O pulsar do meio gira umas 30 vezes por segundo. Escute: tic-tic-tic.' },
		'proxima-centauri': { terno: '#a83a3a', quepe: '#5a1414', olho: '#f0505a', extra: 'planetinha', fala: 'Bem-vindo à vizinha mais próxima do Sol! A luz daqui leva só 4,2 anos para chegar à Terra. Mande um oi!' }
	};
	var AG = AGENTES[pagina] || { terno: '#1c2a6e', quepe: '#101a4a', olho: '#7fe3ff', extra: '', fala: 'Bem-vindo de volta à Terra!' };

	var calmo = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	function lerLista(k) { try { return JSON.parse(localStorage.getItem(k)) || []; } catch (e) { return []; } }
	var chegadas = lerLista('chegadas'), sujeira = null;
	try { sujeira = localStorage.getItem('naveSujeira'); } catch (e) {}
	var forcar = /[?&]chegada\b/.test(location.search);
	var primeira = forcar || chegadas.indexOf(pagina) < 0, suja = tipo === 'terra' && sujeira && sujeira !== 'terra';
	// voltando a um lugar já visitado: a cena toda de novo (a aproximação, a alfândega e o passaporte),
	// mas só quando a nave chega voando (num salto), não ao recarregar a página
	var volta = !primeira && !suja && !!window.veioDeSalto;
	var tocar = primeira || suja || volta;
	// a nave fica com a "sujeira" do último lugar onde esteve (para a lavagem quando voltar à Terra)
	if (tipo !== 'terra') try { localStorage.setItem('naveSujeira', pagina); } catch (e) {}
	if (!tocar || calmo) return;

	// o passaporte espera a alfândega para mostrar o carimbo novo (passaporte.js lê isto)
	window.Chegada = { ativa: true, carimbo: null };

	// ================== O palco ==================
	var H = 270, NUCLEO = 480, W = 480, OX = 0;
	function medir() { var asp = window.innerWidth / Math.max(1, window.innerHeight); W = Math.max(NUCLEO, Math.min(640, Math.round(H * asp / 2) * 2)); OX = (W - NUCLEO) / 2; }
	medir();
	var raiz = document.createElement('div');
	raiz.className = 'chegada';
	raiz.setAttribute('role', 'dialog'); raiz.setAttribute('aria-label', 'Chegada em ' + NOME);
	raiz.innerHTML = '<div class="chegada-palco"><canvas class="chegada-tela"></canvas><div class="chegada-camada"></div><div class="chegada-escuro"></div></div>' +
		'<button type="button" class="chegada-pular">Pular chegada &#9656;</button>';
	document.body.appendChild(raiz);
	document.documentElement.classList.add('chegando');
	var palco = raiz.querySelector('.chegada-palco'), tela = raiz.querySelector('canvas'), camada = raiz.querySelector('.chegada-camada'), escuro = raiz.querySelector('.chegada-escuro');
	var ctx = tela.getContext('2d');
	function ajustar() {
		tela.width = W; tela.height = H; ctx.imageSmoothingEnabled = false;
		var k = Math.min(window.innerWidth / W, window.innerHeight / H);
		palco.style.width = Math.floor(W * k) + 'px'; palco.style.height = Math.floor(H * k) + 'px';
	}
	ajustar();

	// ================== Pintura pixel a pixel (as mesmas ferramentas do embarque) ==================
	var BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(function (v) { return (v + 0.5) / 16; });
	function ruido(x, y) { var n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
	var CORES = {};
	function rgb(h) { var v = CORES[h]; if (v === undefined) { var n = parseInt(h.slice(1), 16); v = CORES[h] = (255 << 24 | (n & 255) << 16 | ((n >> 8) & 255) << 8 | (n >> 16)) >>> 0; } return v; }
	function rampa(cores, t, x, y) {
		var n = cores.length - 1, v = Math.max(0, Math.min(n, t * n)), i = Math.floor(v);
		if (i >= n) return cores[n];
		return v - i > BAYER[(Math.round(x) & 3) + ((Math.round(y) & 3) << 2)] ? cores[i + 1] : cores[i];
	}
	var buf = null, BW = 0, BH = 0, DX = 0;
	function Pintura(w, h, dx) { this.w = w; this.h = h; this.dx = dx || 0; this.d = new Uint32Array(w * h); }
	function pintar(p, fn) { buf = p.d; BW = p.w; BH = p.h; DX = p.dx; fn(); return p; }
	function px(x, y, c) { x = Math.round(x + DX); y = Math.round(y); if (x < 0 || y < 0 || x >= BW || y >= BH || !c) return; buf[y * BW + x] = rgb(c); }
	function ret(x, y, w, h, c) {
		var x0 = Math.round(x + DX), y0 = Math.round(y), x1 = x0 + Math.round(w), y1 = y0 + Math.round(h);
		for (var j = Math.max(0, y0); j < Math.min(BH, y1); j++) for (var i = Math.max(0, x0); i < Math.min(BW, x1); i++) {
			var k = typeof c === 'function' ? c(i - DX, j) : c;
			if (k) buf[j * BW + i] = rgb(k);
		}
	}
	function mistura(x, y, h, a) {
		x = Math.round(x + DX); y = Math.round(y); if (x < 0 || y < 0 || x >= BW || y >= BH || a <= 0) return;
		a = Math.min(1, a);
		var k = y * BW + x, o = buf[k], n = rgb(h);
		if (!(o >>> 24)) { buf[k] = n; return; }
		var r = (o & 255) * (1 - a) + (n & 255) * a, g = ((o >> 8) & 255) * (1 - a) + ((n >> 8) & 255) * a, b = ((o >> 16) & 255) * (1 - a) + ((n >> 16) & 255) * a;
		buf[k] = (255 << 24 | (b & 255) << 16 | (g & 255) << 8 | (r & 255)) >>> 0;
	}
	function poli(pts, c) {
		var y0 = Infinity, y1 = -Infinity;
		pts.forEach(function (p) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
		y0 = Math.max(Math.floor(y0), -1); y1 = Math.min(Math.ceil(y1), BH + 1);
		for (var y = y0; y <= y1; y++) {
			var xa = Infinity, xb = -Infinity, yy = y + 0.5;
			for (var i = 0; i < pts.length; i++) {
				var a = pts[i], b = pts[(i + 1) % pts.length];
				if ((a[1] <= yy && b[1] > yy) || (b[1] <= yy && a[1] > yy)) { var x = a[0] + (yy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]); xa = Math.min(xa, x); xb = Math.max(xb, x); }
			}
			if (xa < xb) for (var xx = Math.max(Math.round(xa), -DX - 2); xx < Math.min(Math.round(xb), BW - DX + 2); xx++) px(xx, y, typeof c === 'function' ? c(xx, y) : c);
		}
	}
	function elip(cx, cy, rx, ry, c) {
		for (var j = -ry; j <= ry; j++) {
			var m = Math.round(rx * Math.sqrt(Math.max(0, 1 - (j * j) / (ry * ry || 1))));
			for (var i = -m; i <= m; i++) px(cx + i, cy + j, typeof c === 'function' ? c(cx + i, cy + j, i / (rx || 1), j / (ry || 1)) : c);
		}
	}
	function linha(x0, y0, x1, y1, c) {
		var n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)));
		for (var i = 0; i <= n; i++) px(x0 + (x1 - x0) * i / (n || 1), y0 + (y1 - y0) * i / (n || 1), c);
	}
	var F3 = {
		A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100',
		G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111',
		M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101',
		S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101',
		Y: '101101010010010', Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
		4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001110',
		'/': '001001010100100', '-': '000000111000000', '.': '000000000000010', ':': '000010000010000', '>': '100010001010100', '·': '000000010000000', '*': '101010101000000', ',': '000000000010100'
	};
	var SEM_ACENTO = { 'Á': 'A', 'Â': 'A', 'Ã': 'A', 'À': 'A', 'É': 'E', 'Ê': 'E', 'Í': 'I', 'Ó': 'O', 'Ô': 'O', 'Õ': 'O', 'Ú': 'U', 'Ç': 'C', 'Ö': 'O' };
	function letras(s, x, y, esc, c, centro) {
		esc = esc || 1; s = s.toUpperCase();
		if (centro) x = Math.round(x - (s.length * 4 - 1) * esc / 2);
		for (var n = 0; n < s.length; n++, x += 4 * esc) {
			var g = F3[SEM_ACENTO[s[n]] || s[n]]; if (!g) continue;
			for (var i = 0; i < 15; i++) if (g[i] === '1') ret(x + (i % 3) * esc, y + Math.floor(i / 3) * esc, esc, esc, c);
		}
	}
	function texto3(c, s, x, y, esc, cor, centro) {
		c.fillStyle = cor; s = s.toUpperCase();
		if (centro) x = Math.round(x - (s.length * 4 - 1) * esc / 2);
		for (var n = 0; n < s.length; n++) { var g = F3[SEM_ACENTO[s[n]] || s[n]]; if (!g) continue; for (var i = 0; i < 15; i++) if (g[i] === '1') c.fillRect(x + n * 4 * esc + (i % 3) * esc, y + Math.floor(i / 3) * esc, esc, esc); }
	}
	function paraCanvas(p) {
		var k = document.createElement('canvas'); k.width = p.w; k.height = p.h;
		var g = k.getContext('2d'), img = g.createImageData(p.w, p.h);
		new Uint32Array(img.data.buffer).set(p.d); g.putImageData(img, 0, 0);
		return k;
	}
	function R(c, x, y, w, h, cor) { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
	function P(c, x, y, cor) { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), 1, 1); }
	function brilhoC(c, x, y, r, cor, a) { c.save(); c.globalCompositeOperation = 'lighter'; var g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, cor); g.addColorStop(1, 'rgba(0,0,0,0)'); c.globalAlpha = a; c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); c.restore(); }
	function suave(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }

	// ================== O som (o que der: a página nova pode nascer sem permissão de áudio) ==================
	var AC = window.AudioContext || window.webkitAudioContext, audio = null, mestre = null;
	try { audio = new AC(); mestre = audio.createGain(); mestre.gain.value = 0.45; mestre.connect(audio.destination); } catch (e) { audio = null; }
	function acordarAudio() { if (audio && audio.state === 'suspended') audio.resume(); }
	raiz.addEventListener('pointerdown', acordarAudio);
	function tom(tp, f, t0, dur, vol, f2) {
		if (!audio) return;
		var o = audio.createOscillator(), g = audio.createGain();
		o.type = tp; o.frequency.setValueAtTime(f, t0); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
		g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
		o.connect(g); g.connect(mestre); o.start(t0); o.stop(t0 + dur + 0.02);
	}
	function ruidoEnv(t0, pontos, freq, q, tp, freq2) {
		if (!audio) return;
		var dur = pontos[pontos.length - 1][0], n = Math.floor(audio.sampleRate * (dur + 0.05)), b = audio.createBuffer(1, n, audio.sampleRate), d = b.getChannelData(0);
		for (var i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
		var s = audio.createBufferSource(), f = audio.createBiquadFilter(), g = audio.createGain();
		s.buffer = b; f.type = tp || 'bandpass'; f.frequency.setValueAtTime(freq, t0); if (freq2) f.frequency.linearRampToValueAtTime(freq2, t0 + dur); f.Q.value = q || 1;
		g.gain.setValueAtTime(0, t0); pontos.forEach(function (p) { g.gain.linearRampToValueAtTime(p[1], t0 + p[0]); });
		s.connect(f); f.connect(g); g.connect(mestre); s.start(t0); s.stop(t0 + dur + 0.05);
	}
	function agoraA() { return audio ? audio.currentTime + 0.02 : 0; }
	var SONS = {
		freio: function () { var t = agoraA(); ruidoEnv(t, [[0.1, 0.2], [1.2, 0]], 2400, 0.6, 'bandpass', 300); tom('sawtooth', 160, t, 1.2, 0.04, 50); },
		motor: function (dur) { var t = agoraA(); ruidoEnv(t, [[0.6, 0.12], [dur - 0.6, 0.16], [dur, 0]], 140, 0.7, 'lowpass', 220); tom('sine', 42, t, dur, 0.14, 38); },
		toque: function () { var t = agoraA(); tom('sine', 70, t, 0.4, 0.4, 35); ruidoEnv(t, [[0.005, 0.3], [0.12, 0]], 300, 0.7, 'lowpass'); ruidoEnv(t + 0.05, [[0.3, 0.12], [1.6, 0]], 900, 0.5, 'bandpass', 400); },
		clunk: function () { var t = agoraA(); tom('square', 110, t, 0.12, 0.08, 70); tom('sine', 60, t, 0.5, 0.35, 40); ruidoEnv(t, [[0.004, 0.25], [0.1, 0]], 1200, 0.8); ruidoEnv(t + 0.3, [[0.1, 0.12], [0.8, 0]], 4200, 0.6, 'highpass'); },
		bip: function () { var t = agoraA(); tom('sine', 1320, t, 0.12, 0.05); tom('sine', 1760, t + 0.1, 0.18, 0.05); },
		carimbo: function () { var t = agoraA(); tom('sine', 110, t, 0.16, 0.38, 55); ruidoEnv(t, [[0.003, 0.32], [0.06, 0]], 500, 0.7, 'lowpass'); ruidoEnv(t + 0.03, [[0.02, 0.035], [0.14, 0]], 1900, 1.8, 'bandpass', 900); },
		agua: function (dur) { var t = agoraA(); ruidoEnv(t, [[0.3, 0.1], [dur - 0.5, 0.09], [dur, 0]], 5200, 0.4, 'highpass', 4200); ruidoEnv(t, [[0.4, 0.05], [dur, 0]], 1200, 0.5, 'bandpass', 900); },
		raio: function () { var t = agoraA(); tom('sine', 3200, t, 0.25, 0.05, 1800); },
		tic: function () { var t = agoraA(); tom('triangle', 4200, t, 0.05, 0.12, 2600); ruidoEnv(t, [[0.002, 0.2], [0.03, 0]], 6000, 1, 'highpass'); tom('sine', 1800, t + 0.01, 0.4, 0.03, 1700); }
	};
	function blip(base) {
		if (!audio) return;
		var t = audio.currentTime, o = audio.createOscillator(), f = audio.createBiquadFilter(), g = audio.createGain();
		o.type = 'square'; o.frequency.value = base * (0.85 + Math.random() * 0.35);
		f.type = 'bandpass'; f.frequency.value = 900 + Math.random() * 900; f.Q.value = 3;
		g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
		o.connect(f); f.connect(g); g.connect(mestre); o.start(t); o.stop(t + 0.07);
	}

	// ================== A cabine (a mesma da decolagem) ==================
	var VIDRO = { cx: 240, cy: 98, rx: 230, ry: 112, topo: 12, base: 158, ox: 240, oy: 104 };
	function noVidro(x, y) { var u = (x - VIDRO.cx) / VIDRO.rx, v = (y - VIDRO.cy) / VIDRO.ry; return y > VIDRO.topo && y < VIDRO.base && u * u + v * v < 1; }
	var ANEIS_VIDRO = [[30, 4], [74, 6], [138, 8]];
	function naHaste(x, y) {
		var u = (x - VIDRO.cx) / VIDRO.rx, v = (y - VIDRO.cy) / VIDRO.ry, q = Math.sqrt(u * u + v * v);
		if (q > 0.955) return 0.15 + (1 - q) * 4;
		if (y > VIDRO.base - 5) return 0.75 - (y - VIDRO.base + 5) * 0.15;
		var dx = (x - VIDRO.ox) / 1.3, dy = y - VIDRO.oy, d = Math.sqrt(dx * dx + dy * dy), a = Math.atan2(dy, dx);
		for (var i = 0; i < ANEIS_VIDRO.length; i++) {
			var r = ANEIS_VIDRO[i][0], w = ANEIS_VIDRO[i][1], e = d - r;
			if (Math.abs(e) < w / 2) return e < 0 ? 0.95 - (e + w / 2) / w * 0.3 : 0.6 - e / w * 0.8;
		}
		if (d < ANEIS_VIDRO[0][0]) return 0;
		var n = d < ANEIS_VIDRO[1][0] ? 8 : 10, passo = Math.PI * 2 / n, ini = passo / 2;
		var rel = ((a - ini) % passo + passo) % passo, lado = rel < passo / 2 ? 1 : -1; rel = Math.min(rel, passo - rel);
		var dist = rel * d, larg = 1.4 + d * 0.028;
		if (dist < larg) return lado > 0 ? 0.85 - dist / larg * 0.4 : 0.45 - dist / larg * 0.3;
		return 0;
	}
	var TELAS_CAB = [{ x: 86, y: 180, w: 54, h: 32, tipo: 'radar' }, { x: 204, y: 177, w: 72, h: 38, tipo: 'meio' }, { x: 340, y: 180, w: 54, h: 32, tipo: 'ondas' }];
	var moldura = null, luzes = [];
	function fazerMoldura() {
		// a cabine é a mesma da decolagem (cabine.js): a janela em leque, os painéis, as poltronas
		var mf = window.CabineFalcon.moldura(W, H, OX);
		moldura = mf.canvas;
		luzes = [];
		var CORES_LUZ = ['#7dffa8', '#7fe3ff', '#ffd36a', '#ff8a5a', '#ff5a7a', '#c89aff'];
		for (var yy = 222; yy <= 234; yy += 6) for (var xx = 54; xx < 398; xx += 7) luzes.push({ x: xx, y: yy });
		for (xx = 84; xx < 400; xx += 9) luzes.push({ x: xx, y: 162 });
		mf.luzes.forEach(function (l) { luzes.push({ x: l.x, y: l.y }); }); // (as luzinhas das paredes e do teto)
		luzes = luzes.filter(window.CabineFalcon.livreDasAlavancas);
		luzes.forEach(function (l, i) { l.cor = CORES_LUZ[Math.floor(ruido(i, 3) * CORES_LUZ.length)]; l.pisca = ruido(i, 5) < 0.25; l.vel = 2 + ruido(i, 6) * 5; l.fase = ruido(i, 7) * 6; });
	}
	function desenharCabine(c, t, texto1, texto2) {
		c.drawImage(moldura, -OX, 0);
		luzes.forEach(function (l) {
			if (l.pisca && Math.sin(t * l.vel + l.fase) < -0.3) return;
			c.globalAlpha = 0.28; R(c, l.x - 1, l.y - 1, 4, 4, l.cor); c.globalAlpha = 1;
			R(c, l.x, l.y, 2, 2, l.cor); P(c, l.x, l.y, '#ffffff');
		});
		TELAS_CAB.forEach(function (q) {
			c.save(); c.beginPath(); c.rect(q.x, q.y, q.w, q.h); c.clip();
			R(c, q.x, q.y, q.w, q.h, '#04140e');
			if (q.tipo === 'radar') {
				var cx = q.x + q.w / 2, cy = q.y + q.h / 2, a = t * 2;
				c.strokeStyle = 'rgba(125,255,168,0.35)'; c.lineWidth = 1; [6, 11, 15].forEach(function (r) { c.beginPath(); c.arc(cx + 0.5, cy + 0.5, r, 0, Math.PI * 2); c.stroke(); });
				c.strokeStyle = '#7dffa8'; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15); c.stroke();
				if (Math.sin(t * 3) > 0) R(c, cx + 6, cy - 4, 2, 2, '#dfffe8');
			} else if (q.tipo === 'ondas' && window.TempoDoSol) {
				/* o tempo do Sol ao vivo (dados da NOAA), com a moldura piscando em vermelho no alerta */
				var vs = window.TempoDoSol.visor(t);
				vs.linhas.forEach(function (l, il) { texto3(c, l[0], q.x + q.w / 2, q.y + 4 + il * 9, 1, l[1], true); });
				if (vs.alerta && Math.floor(t * 3) % 2) { R(c, q.x, q.y, q.w, 1, '#ff6a5a'); R(c, q.x, q.y + q.h - 1, q.w, 1, '#ff6a5a'); R(c, q.x, q.y, 1, q.h, '#ff6a5a'); R(c, q.x + q.w - 1, q.y, 1, q.h, '#ff6a5a'); }
			} else if (q.tipo === 'ondas') {
				for (var b2 = 0; b2 < 12; b2++) { var hb = 3 + Math.abs(Math.sin(t * 3 + b2 * 0.7) * Math.cos(t * 1.3 + b2)) * (q.h - 8); R(c, q.x + 3 + b2 * 4, q.y + q.h - 2 - hb, 3, hb, b2 % 3 ? '#7fe3ff' : '#ffd36a'); }
			} else {
				texto3(c, texto1 || 'CHEGANDO', q.x + q.w / 2, q.y + 8, 1, '#7dffa8', true);
				texto3(c, texto2 || '', q.x + q.w / 2, q.y + 20, 1, '#7fe3ff', true);
				if (Math.floor(t * 2) % 2) R(c, q.x + 4, q.y + 30, 3, 4, '#7dffa8');
			}
			for (var sl = q.y; sl < q.y + q.h; sl += 2) { c.globalAlpha = 0.18; R(c, q.x, sl, q.w, 1, '#000000'); }
			c.globalAlpha = 1; c.restore();
		});
		// as alavancas puxadas para trás (freando) e o botão de ignição aceso
		[230, 246].forEach(function (lx) { R(c, lx, 246, 4, 24, '#2a2c34'); R(c, lx - 2, 240, 8, 6, '#c8ccd6'); R(c, lx - 2, 240, 8, 1, '#ffffff'); });
		R(c, 296, 186, 26, 24, '#16171c'); c.fillStyle = '#4aff8a'; c.beginPath(); c.arc(309, 197, 6, 0, Math.PI * 2); c.fill(); texto3(c, 'ON', 305, 207, 1, '#4aff8a');
	}

	// ================== O céu lá fora ==================
	var ESTRELAS = [];
	for (var e = 0; e < 140; e++) ESTRELAS.push({ x: ruido(e, 11) * 2 - 1, y: ruido(e, 12) * 2 - 1, z: 0.1 + ruido(e, 13) * 0.9, b: ruido(e, 14) });
	// as estrelas da janela: v = velocidade (1 = ainda no salto, riscos compridos; 0 = paradas)
	function desenharEstrelas(c, t, v) {
		R(c, -OX, 0, W, H, '#03040e');
		var cx = 240, cy = VIDRO.oy;
		ESTRELAS.forEach(function (s) {
			var z = ((s.z - t * v * 0.6) % 1 + 1) % 1 + 0.02, x = cx + s.x / z * 60, y = cy + s.y / z * 45;
			var cor = s.b > 0.7 ? '#cfe4ff' : s.b > 0.4 ? '#ffffff' : '#ffe8d8';
			if (v > 0.05) {
				var z2 = z + v * 0.25, x0 = cx + s.x / z2 * 60, y0 = cy + s.y / z2 * 45;
				c.strokeStyle = cor; c.globalAlpha = Math.min(1, 0.4 + (1 - z) * 0.8); c.lineWidth = 1; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x, y); c.stroke(); c.globalAlpha = 1;
			} else P(c, x, y, (Math.sin(t * 2 + s.b * 20) > 0.85) ? '#ffffff' : cor);
		});
	}

	// ================== A imagem do destino ==================
	var imgDestino = null;
	(function () {
		var arte = document.querySelector('canvas.arte-destino');
		if (arte && tipo === 'estacao' && !noSistema && pagina !== 'sistema-solar') { imgDestino = arte; return; }
		var arq = pagina === 'sistema-solar' ? 'sol' : pagina;
		var im = new Image(); im.onload = function () { imgDestino = im; }; im.src = 'pixel/' + arq + '.png';
	})();
	// (algumas artes da página têm coisas que não existem no céu: na Tabby, o gráfico do brilho embaixo
	// da estrela. Pela janela só aparece o recorte do astro: [x, y, lado] em frações da arte)
	var RECORTE = { tabby: [0.16, 0.02, 0.68] };
	// chegando ao Sistema Solar: o Sol no meio e os oito planetas girando nas órbitas (as mesmas artes
	// de pixel das páginas deles), as órbitas inclinadas como se a gente chegasse um pouco de cima
	var ORDEM_PLANETAS = ['mercurio', 'venus', 'terra', 'marte', 'jupiter', 'saturno', 'urano', 'netuno'], IMG_PLANETA = {};
	if (pagina === 'sistema-solar') ORDEM_PLANETAS.forEach(function (p) { var im = new Image(); im.onload = function () { IMG_PLANETA[p] = im; }; im.src = 'pixel/' + p + '.png'; });
	function desenharSistema(c, tam, x, y) {
		var t = performance.now() / 1000, TAMS = [3, 4, 4, 3, 10, 12, 6, 6]; // (Saturno maior por causa dos anéis)
		var lista = ORDEM_PLANETAS.map(function (p, i) {
			var r = tam * (0.16 + i * 0.075), a = i * 2.1 + t * (0.5 / (i + 1));
			return { p: p, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.32, r: r, z: Math.sin(a), tam: Math.max(2, TAMS[i] * tam / 110) };
		});
		// as órbitas, fininhas
		c.strokeStyle = 'rgba(140,170,255,0.18)'; c.lineWidth = 1;
		lista.forEach(function (q) { c.beginPath(); c.ellipse(x, y, q.r, q.r * 0.32, 0, 0, Math.PI * 2); c.stroke(); });
		function planeta(q) { var im = IMG_PLANETA[q.p]; c.imageSmoothingEnabled = false; if (im) { var k = q.tam / Math.max(im.width, im.height); c.drawImage(im, Math.round(q.x - im.width * k / 2), Math.round(q.y - im.height * k / 2), Math.round(im.width * k), Math.round(im.height * k)); } else R(c, q.x - 1, q.y - 1, 2, 2, '#cfd8ff'); }
		lista.filter(function (q) { return q.z < 0; }).forEach(planeta); // (os que estão atrás do Sol)
		brilhoC(c, x, y, tam * 0.22, 'rgba(255,220,140,1)', 0.8);
		if (imgDestino) { var s = tam * 0.12, k2 = s / Math.max(imgDestino.width, imgDestino.height); c.drawImage(imgDestino, Math.round(x - imgDestino.width * k2 / 2), Math.round(y - imgDestino.height * k2 / 2), Math.round(imgDestino.width * k2), Math.round(imgDestino.height * k2)); }
		lista.filter(function (q) { return q.z >= 0; }).forEach(planeta); // (os da frente)
	}
	function desenharDestino(c, tam, x, y) {
		if (pagina === 'sistema-solar') return desenharSistema(c, tam * 1.5, x, y);
		if (!imgDestino) return;
		var W0 = imgDestino.width || 128, H0 = imgDestino.height || 128;
		if (!W0 || !H0) return;
		var rc = RECORTE[pagina], sx = 0, sy = 0, w = W0, h = H0;
		if (rc) { sx = Math.round(rc[0] * W0); sy = Math.round(rc[1] * H0); w = h = Math.round(rc[2] * Math.min(W0, H0)); }
		var k = tam / Math.max(w, h);
		c.imageSmoothingEnabled = false;
		c.drawImage(imgDestino, sx, sy, w, h, Math.round(x - w * k / 2), Math.round(y - h * k / 2), Math.round(w * k), Math.round(h * k));
	}

	// ================== Os eventos reais no caminho ==================
	// Só fenômenos de verdade, cada um onde faz sentido:
	//  - chegando na Terra: uma chuva de meteoros vista de cima, queimando na atmosfera (os astronautas
	//    da Estação Espacial fotografam isso);
	//  - perto do Sol (Mercúrio, Vênus, o Sol): uma erupção solar;
	//  - depois de Marte (os gigantes): um asteroide do cinturão passando;
	//  - dentro do Sistema Solar: um cometa (cauda de gás reta, para longe do Sol; a de poeira, curva);
	//  - entre as estrelas: a Voyager 1, um objeto interestelar como o ʻOumuamua, um planeta errante;
	//  - em qualquer lugar: um micrometeorito batendo no vidro, o clarão de um raio cósmico no olho.
	// Acontecem de vez em quando (um evento nunca visto tem mais chance; um repetido, bem pouca).
	var CONTEXTO = tipo === 'terra' ? ['meteoros', 'micrometeorito', 'raio']
		: /^(mercurio|venus|sol)$/.test(pagina) ? ['erupcao', 'cometa', 'micrometeorito', 'raio']
		: /^(jupiter|saturno|urano|netuno)$/.test(pagina) ? ['asteroide', 'cometa', 'micrometeorito', 'raio']
		: noSistema || pagina === 'sistema-solar' ? ['cometa', 'micrometeorito', 'raio']
		: ['voyager', 'oumuamua', 'errante', 'micrometeorito', 'raio'];
	var FALAS_EVENTO = {
		meteoros: 'Olhe lá embaixo: uma chuva de meteoros! São grãos de poeira do rastro de um cometa queimando na atmosfera da Terra. Os astronautas da Estação Espacial fotografam isso de cima.',
		cometa: 'Um cometa! O Sol está à nossa esquerda: a cauda azul de gás aponta sempre para longe dele, reta, e a de poeira, amarelada, fica curvada para trás no caminho do cometa. O verde da cabeça é carbono brilhando.',
		voyager: 'É a Voyager 1! Lançada em 1977, já sem energia, mas ainda viajando entre as estrelas com o Disco de Ouro, uma mensagem da Terra.',
		raio: 'Viu esse clarão? Foi um raio cósmico, uma partícula de altíssima energia atravessando seu olho. Os astronautas da Apollo 11 já viam isso.',
		erupcao: 'Erupção solar! O Sol soltou uma rajada de partículas. A nave virou o escudo para o lado dele até passar. É esse mesmo vento que acende as auroras na Terra.',
		asteroide: 'Um asteroide do cinturão! Na vida real eles ficam a quase um milhão de quilômetros um do outro, então ver um de perto assim é pura sorte.',
		micrometeorito: 'Tic! Um grãozinho de poeira, menor que um grão de areia, bateu no vidro a dezenas de quilômetros por segundo. Por isso o para-brisa tem várias camadas.',
		oumuamua: 'Um objeto interestelar, como o ʻOumuamua, que passou pelo Sistema Solar em 2017: comprido, avermelhado, girando devagar, vindo de outra estrela.',
		errante: 'Um planeta errante: um mundo sem estrela, vagando sozinho no escuro. Só dá para notar porque ele tapa as estrelas de trás. Deve haver bilhões deles na galáxia.'
	};
	var evento = null;
	(function () {
		var vistos = lerLista('eventosVistos');
		var novos = CONTEXTO.filter(function (o) { return vistos.indexOf(o) < 0; });
		if (novos.length && Math.random() < 0.4) evento = novos[Math.floor(Math.random() * novos.length)];
		else if (Math.random() < 0.1) evento = CONTEXTO[Math.floor(Math.random() * CONTEXTO.length)];
		if (forcar && /[?&]evento=(\w+)/.test(location.search)) evento = RegExp.$1;
		if (!FALAS_EVENTO[evento]) evento = null;
	})();
	var lascas = [];
	function desenharEvento(c, t) { // t: segundos desde o começo do evento (dura uns 8 s)
		if (evento === 'meteoros') {
			// a Terra de noite lá embaixo, a borda azul da atmosfera, luzes de cidades e os riscos queimando
			var tc = 285, r = 190; // (o centro da Terra lá embaixo: só a curva de cima aparece na janela)
			c.fillStyle = '#05091a'; c.beginPath(); c.arc(240, tc, r, 0, Math.PI * 2); c.fill();
			c.strokeStyle = 'rgba(90,170,255,0.75)'; c.lineWidth = 2; c.beginPath(); c.arc(240, tc, r + 1, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
			c.strokeStyle = 'rgba(140,220,255,0.3)'; c.lineWidth = 4; c.beginPath(); c.arc(240, tc, r + 4, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
			for (var k = 0; k < 120; k++) {
				var lx = 60 + ruido(k, 3) * 360, ly = 100 + ruido(k, 4) * 60, dd = Math.hypot(lx - 240, ly - tc);
				if (dd > r - 4 || ruido(k >> 3, 6) < 0.35) continue;
				P(c, lx, ly, ruido(k, 5) > 0.5 ? '#ffb85a' : '#ffd890'); if (ruido(k, 9) > 0.6) P(c, lx + 1, ly, '#e8903a');
			}
			for (var m = 0; m < 16; m++) {
				var per = 0.9 + ruido(m, 7) * 1.2, f = ((t + ruido(m, 8) * 3) % per) / per; if (f > 0.4) continue;
				var ang = -0.5 + ruido(m, 11) * 1.0, mx = 240 + Math.sin(ang) * (120 + f * 40), my = tc - Math.cos(ang) * (r - 6) + f * 10, comp = 6 + f * 30;
				var dx2 = Math.sin(ang) * comp, dy2 = -Math.cos(ang) * comp * 0.3 - comp * 0.3;
				var g = c.createLinearGradient(mx - dx2, my - dy2, mx, my); g.addColorStop(0, 'rgba(120,255,170,0)'); g.addColorStop(0.7, 'rgba(150,255,190,0.8)'); g.addColorStop(1, 'rgba(255,255,255,1)');
				c.strokeStyle = g; c.lineWidth = 2; c.beginPath(); c.moveTo(mx - dx2, my - dy2); c.lineTo(mx, my); c.stroke();
				brilhoC(c, mx, my, 4, 'rgba(200,255,220,1)', 0.8); P(c, mx, my, '#ffffff');
			}
		} else if (evento === 'cometa' || evento === 'erupcao') {
			// a luz do Sol entrando pela esquerda da janela
			brilhoC(c, -OX - 20, 70, 170, 'rgba(255,236,190,0.9)', evento === 'erupcao' ? 0.35 + Math.max(0, Math.sin(Math.min(t, 3) * 1.1)) * 0.5 : 0.25);
			if (evento === 'erupcao') {
				// o clarão da erupção e as partículas passando da esquerda para a direita
				var fl = t > 0.8 && t < 4 ? Math.sin((t - 0.8) / 3.2 * Math.PI) : 0;
				c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = fl * 0.22; c.fillStyle = '#ffb86a'; c.fillRect(-OX, 0, W, H); c.restore();
				for (var q = 0; q < 50 * fl; q++) { var u = ((t * 1.6 + ruido(q, 1)) % 1), y0 = 20 + ruido(q, 2) * 140; c.globalAlpha = 0.6; c.fillStyle = q % 3 ? '#ffd890' : '#ffffff'; c.fillRect(Math.round(-OX + u * (W + 40)), Math.round(y0), 4, 1); }
				c.globalAlpha = 1;
				return;
			}
			// o cometa descendo devagar pela janela, com o Sol à esquerda:
			//  - a cabeça (o núcleo branco e a coma esverdeada, do carbono brilhando);
			//  - a cauda de gás, azul, fina e reta, apontando exatamente para longe do Sol (para a direita);
			//  - a cauda de poeira, larga e amarelada, também saindo do lado oposto ao Sol mas curvada para
			//    trás, para o lado de onde o cometa veio (ele desce, então ela curva para cima)
			var nx = 214 + t * 1.5, ny = 86 + t * 2.4; // (a cabeça passa pelo vidro redondo do meio, livre das hastes)
			for (var i = 0; i < 90; i++) {
				var s = i / 90, cx = nx + s * 150, cy = ny - s * s * 55, larg = 1 + s * 14;
				c.globalAlpha = (1 - s) * 0.13; c.fillStyle = '#fff0c8';
				c.beginPath(); c.ellipse(cx, cy, 3 + s * 5, larg, -0.35 - s * 0.4, 0, Math.PI * 2); c.fill();
			}
			var gi = c.createLinearGradient(nx, ny, nx + 200, ny + 4); gi.addColorStop(0, 'rgba(140,200,255,0.85)'); gi.addColorStop(1, 'rgba(90,140,255,0)');
			c.globalAlpha = 1; c.strokeStyle = gi;
			[[0, 2], [-2, 1], [2, 1]].forEach(function (f2) { c.lineWidth = f2[1]; c.beginPath(); c.moveTo(nx, ny + f2[0] * 0.5); c.lineTo(nx + 200, ny + 4 + f2[0] * 2); c.stroke(); });
			for (var st = 0; st < 5; st++) { var sx2 = nx + 20 + ((t * 30 + st * 37) % 170); c.globalAlpha = 0.5; R(c, sx2, ny + (sx2 - nx) * 0.02 - 1, 6, 1, '#cfe8ff'); }
			c.globalAlpha = 1;
			brilhoC(c, nx, ny, 14, 'rgba(120,255,190,0.9)', 0.55); brilhoC(c, nx, ny, 6, 'rgba(255,255,255,1)', 0.9); R(c, nx - 1, ny - 1, 2, 2, '#ffffff');
		} else if (evento === 'voyager') {
			// a sonda: a antena parabólica branca, o corpo de dez lados, as hastes do magnetômetro e do gerador
			var vx = 110 + t * 22, vy = 88 + Math.sin(t * 0.5) * 3;
			c.save(); c.translate(vx, vy); c.scale(2, 2); c.translate(-vx, -vy); // (em dobro: ela passa perto da janela)
			c.strokeStyle = '#8a8e98'; c.lineWidth = 1;
			c.beginPath(); c.moveTo(vx, vy + 4); c.lineTo(vx - 26, vy + 14); c.stroke(); // o magnetômetro
			c.beginPath(); c.moveTo(vx + 2, vy + 5); c.lineTo(vx + 18, vy + 12); c.stroke(); // o gerador nuclear
			R(c, vx + 16, vy + 10, 4, 4, '#5a5e6a');
			R(c, vx - 3, vy + 2, 7, 5, '#b8a060'); R(c, vx - 3, vy + 2, 7, 1, '#e8d090'); // o corpo, dourado
			c.fillStyle = '#e8ecf4'; c.beginPath(); c.ellipse(vx, vy - 2, 10, 4, -0.15, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#a8acb8'; c.beginPath(); c.ellipse(vx, vy - 1, 10, 3, -0.15, 0, Math.PI); c.fill();
			R(c, vx, vy - 6, 1, 4, '#c8ccd6');
			if ((t % 2) < 0.15) brilhoC(c, vx + 3, vy + 4, 5, 'rgba(255,220,140,0.9)', 0.8); // o brilho do disco de ouro
			c.restore();
		} else if (evento === 'asteroide' || evento === 'oumuamua') {
			// uma rocha girando devagar, iluminada de um lado (o asteroide: batatão cinza; o objeto
			// interestelar: comprido como um charuto, avermelhado)
			var ax = 60 + t * 24, ay = 80 + Math.sin(t * 0.4) * 6, giro = t * (evento === 'oumuamua' ? 0.9 : 0.35);
			var comp2 = evento === 'oumuamua' ? 26 : 16, alt = evento === 'oumuamua' ? 5 : 12;
			var CORA = evento === 'oumuamua' ? ['#d89070', '#a85a40', '#6a3424', '#2a140e'] : ['#c8c0b0', '#8a8478', '#5a5650', '#2a2826'];
			c.save(); c.translate(ax, ay); c.rotate(giro);
			for (var b = 0; b < 4; b++) { c.fillStyle = CORA[3 - b]; c.beginPath(); c.ellipse(-b * 1.2, -b * 0.8, comp2 - b * 3, alt - b * 1.4 + Math.sin(b * 2) * 1.5, 0, 0, Math.PI * 2); c.fill(); }
			if (evento === 'asteroide') [[4, 2, 3], [-6, -3, 2], [8, -4, 2]].forEach(function (cr) { c.fillStyle = 'rgba(30,28,26,0.5)'; c.beginPath(); c.arc(cr[0], cr[1], cr[2], 0, Math.PI * 2); c.fill(); });
			c.restore();
		} else if (evento === 'errante') {
			// um disco escuro tapando as estrelas de trás, com uma borda avermelhada fraquinha (o calor de dentro)
			var ex = 380 - t * 18, ey = 70, er = 34;
			c.fillStyle = '#020206'; c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.fill();
			c.strokeStyle = 'rgba(120,40,30,0.5)'; c.lineWidth = 2; c.beginPath(); c.arc(ex, ey, er, 0, Math.PI * 2); c.stroke();
		} else if (evento === 'micrometeorito') {
			// a lasquinha no vidro (uma estrelinha de rachaduras) depois do "tic"
			if (t > 1.2) {
				if (!lascas.length) { lascas.push({ x: 160 + Math.random() * 160, y: 50 + Math.random() * 60 }); SONS.tic(); }
				var l = lascas[0];
				c.strokeStyle = 'rgba(220,240,255,0.8)'; c.lineWidth = 1;
				for (var a = 0; a < 7; a++) { var an = a / 7 * Math.PI * 2 + 0.3, cm = 3 + (a % 3) * 2; c.beginPath(); c.moveTo(l.x, l.y); c.lineTo(l.x + Math.cos(an) * cm, l.y + Math.sin(an) * cm); c.stroke(); }
				P(c, l.x, l.y, '#ffffff');
				if (t < 1.4) brilhoC(c, l.x, l.y, 10, 'rgba(255,255,255,1)', 1);
			}
		} else if (evento === 'raio') {
			if (t > 1.2 && t < 1.35) {
				c.save(); c.globalCompositeOperation = 'lighter';
				c.strokeStyle = '#ffffff'; c.globalAlpha = 0.9; c.lineWidth = 1; c.beginPath(); c.moveTo(-OX + W * 0.2, 30); c.lineTo(-OX + W * 0.75, 220); c.stroke();
				c.globalAlpha = 0.35; c.fillStyle = '#dff4ff'; c.fillRect(-OX, 0, W, H);
				c.restore();
			}
		}
	}

	// ================== Os cenários do pouso ==================
	// o chão de cada planeta, numa tira alta (o céu em cima, o horizonte e o chão embaixo), e o posto
	// da alfândega já no lugar onde a nave vai parar
	var SOLO = {
		mercurio: { ceu: ['#000000', '#020208', '#04040c'], chao: ['#c8c4bc', '#a8a49c', '#88847c', '#68645e', '#4a4844'], poeira: '#a8a49c', estrelas: true, sol: 3, nota: 'Sem ar nenhum: o céu é preto mesmo de dia, e o Sol parece três vezes maior que na Terra.' },
		venus: { ceu: ['#5a3a10', '#8a5a1a', '#b8822e', '#d8a848', '#e8c068'], chao: ['#7a5a3a', '#5e4630', '#4a3624', '#3a2a1c', '#2a1e14'], poeira: '#8a6a3a', estrelas: false, sol: 0, nota: 'Casco blindado: lá fora são 465 °C e o ar pesa 92 vezes mais que na Terra. As nuvens de ácido não deixam ver o Sol.' },
		marte: { ceu: ['#6a4a3a', '#a8785a', '#c89a76', '#dcb48c', '#e8c8a0'], chao: ['#d88a5a', '#c06a3e', '#a0522e', '#7e3e22', '#5a2a16'], poeira: '#c8784a', estrelas: false, sol: 0.6, nota: 'O céu de Marte é cor de caramelo por causa da poeira fina no ar, e o Sol parece menor e mais branco.' }
	};
	var HOR = 330; // o horizonte na tira (a tira tem 2H de altura)
	function fazerSolo(s) {
		return paraCanvas(pintar(new Pintura(W, H * 2, OX), function () {
			for (var y = 0; y < H * 2; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
				var c;
				var colina = HOR - 4 - Math.max(0, Math.sin((x + OX) * 0.02) * 6 + ruido((x + OX) >> 4, 3) * 6);
				if (y < colina) {
					c = rampa(s.ceu, Math.pow(y / colina, 1.3), x, y);
					if (s.estrelas && y < HOR - 30 && ruido(x + 71, y + 13) > 0.993) c = '#ffffff';
				} else {
					var prof = (y - HOR + 2) / (H * 2 - HOR), z = 30 / Math.max(0.5, y - HOR + 4);
					c = rampa(s.chao, 0.15 + prof * 0.55 + (ruido(Math.floor((x - 240) * z * 0.6), Math.floor(z * 8)) - 0.5) * 0.35, x, y);
				}
				px(x, y, c);
			}
			// crateras (Mercúrio), placas de basalto (Vênus), pedras e dunas (Marte)
			for (var k = 0; k < 26; k++) {
				var cx = -OX + ruido(k, 21) * W, cy = HOR + 6 + Math.pow(ruido(k, 22), 1.6) * (H * 2 - HOR - 10), esc = 0.2 + (cy - HOR) / (H * 2 - HOR) * 1.6;
				if (pagina === 'mercurio') { elip(cx, cy, 10 * esc, 3 * esc, s.chao[3]); elip(cx, cy + esc, 8 * esc, 2 * esc, s.chao[4]); linha(cx - 10 * esc, cy, cx - 6 * esc, cy - esc, s.chao[0]); }
				else if (pagina === 'venus') { linha(cx - 14 * esc, cy, cx + 14 * esc, cy + 2 * esc, s.chao[4]); linha(cx, cy - 2 * esc, cx + 6 * esc, cy + 4 * esc, s.chao[4]); }
				else { elip(cx, cy, 3 * esc + 1, 2 * esc + 1, s.chao[3]); px(cx - esc, cy - esc, s.chao[0]); }
			}
			// o Sol (só onde dá para ver)
			if (s.sol) { var sx = 90, sy = HOR - 46, sr = Math.round(6 * s.sol); elip(sx, sy, sr + 4, sr + 4, function (x, y) { mistura(x, y, '#ffffff', 0.25); return null; }); elip(sx, sy, sr, sr, pagina === 'marte' ? '#f4f0e8' : '#fffbe8'); }
			// o posto da alfândega: uma cúpula pressurizada com a câmara de ar e a placa
			var ax = 330, ay = HOR + 30;
			elip(ax, ay, 34, 20, function (x, y, u, v) { return v > 0.1 ? null : rampa(['#f4f4f8', '#d8dce6', '#b0b4c2', '#888c9a'], (u + 1) / 2 * 0.7 + (v + 1) / 2 * 0.3, x, y); });
			ret(ax - 34, ay + 2, 68, 3, '#5a5e6a');
			for (var j = -3; j <= 3; j++) linha(ax + j * 9, ay + 2, ax + j * 6, ay - 18 + Math.abs(j) * 2, '#a8acb8');
			ret(ax + 26, ay - 8, 16, 12, '#c8ccd6'); ret(ax + 30, ay - 6, 8, 10, '#2a2c34'); ret(ax + 31, ay - 5, 6, 2, '#ffd36a');
			ret(ax - 24, ay - 30, 48, 9, '#101a4a'); ret(ax - 24, ay - 30, 48, 1, '#e8c46a'); letras('ALFÂNDEGA', ax, ay - 28, 1, '#e8c46a', true);
			ret(ax - 1, ay - 21, 2, 6, '#5a5e6a');
		}));
	}

	// ================== O hangar 11 (a volta para casa) ==================
	var SUJEIRAS = {
		marte: { cor: '#c0602e', nome: 'a poeira vermelha de Marte' },
		mercurio: { cor: '#8a867c', nome: 'o pó cinza de Mercúrio' },
		venus: { cor: '#c8a040', nome: 'as manchas de ácido das nuvens de Vênus' },
		sol: { cor: '#3a2618', nome: 'a fuligem do calor do Sol' },
		jupiter: { cor: '#e8f4ff', nome: 'o gelo que grudou perto de Júpiter' }, saturno: { cor: '#eef8ff', nome: 'o gelo dos anéis de Saturno' },
		urano: { cor: '#d8f4f4', nome: 'o gelo de Urano' }, netuno: { cor: '#d8e8ff', nome: 'o gelo de Netuno' }
	};
	var sujo = sujeira && sujeira !== 'terra' ? (SUJEIRAS[sujeira] || { cor: '#8a7aa0', nome: 'a poeira de estrelas do espaço entre as estrelas' }) : null;
	var naveCasa = null, sujeiraCasa = null, fundoHangar = null;
	var BAIA = { cx: 240, cy: 136, rx: 196, ry: 121, fundo: 30 };
	function fazerHangar() {
		var B = BAIA, fy = B.cy + B.fundo;
		fundoHangar = paraCanvas(pintar(new Pintura(W, H, OX), function () {
			function dentro(x, y, cy) { var u = (x - B.cx) / B.rx, v = (y - cy) / B.ry; return u * u + v * v < 1; }
			for (var y = 0; y < H; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
				var c;
				if (dentro(x, y, B.cy)) {
					if (dentro(x, y, fy)) { var u = (x - B.cx) / B.rx, v = (y - fy) / B.ry, d = Math.sqrt(u * u + v * v), a = Math.atan2(v, u);
						var junta = Math.abs(((d * 6) % 1) - 0.5) > 0.47 || Math.abs((((a / Math.PI * 12) % 1) + 1) % 1 - 0.5) > 0.485;
						c = junta ? '#7e7a72' : rampa(['#c4c0b6', '#b4b0a6', '#a4a096', '#94908a', '#84807a'], 0.2 + ruido(x >> 3, y >> 3) * 0.35 + v * 0.15 + (d > 0.88 ? 0.35 : 0), x, y);
					} else { var ang = Math.atan2((y - B.cy) / B.ry, (x - B.cx) / B.rx), alt = (y - (B.cy + Math.sin(ang) * B.ry)) / B.fundo; c = (Math.round(ang * 40) % 5 === 0) ? '#1e2028' : rampa(['#5e6270', '#4a4e5a', '#3a3e4a', '#2c2f38'], alt * 0.7 + 0.15, x, y); }
				} else if (y < 9 + Math.sin((x + OX) * 0.05) * 4) c = rampa(['#f0a868', '#e8c890', '#b8c8e0'], 1 - y / 14, x, y);
				else if (y < 30 + Math.sin((x + OX) * 0.03) * 8 + ruido((x + OX) >> 3, 2) * 10) c = rampa(['#5a4434', '#7a5c44', '#9a7656', '#b8946c'], 0.2 + ruido(x >> 2, Math.floor(y / 6)) * 0.5, x, y);
				else { var gx = (x + OX) / 34, gy = y / 22; c = (gx - Math.floor(gx) < 0.04 || gy - Math.floor(gy) < 0.06) ? '#a29e94' : rampa(['#d8d2c4', '#cac4b6', '#bab4a6', '#aaa498'], 0.25 + ruido(Math.floor(gx), Math.floor(gy)) * 0.2 + y / H * 0.2, x, y); }
				px(x, y, c);
			}
			for (var t = 0; t < Math.PI * 2; t += 0.002) { var zx = B.cx + Math.cos(t) * B.rx * 0.8, zy = fy + Math.sin(t) * B.ry * 0.8; if (!dentro(zx, zy, B.cy)) continue; var fx = (Math.floor(t * 24) % 2) ? '#f0c030' : '#1a1a1e'; px(zx, zy, fx); px(zx, zy + 1, fx); }
			for (t = 0; t < Math.PI * 2; t += 0.0015) { var rx = B.cx + Math.cos(t) * B.rx, ry = B.cy + Math.sin(t) * B.ry; px(rx, ry, '#e8c040'); px(rx, ry - 1, '#e8c040'); }
			letras('11', B.cx + 128, fy + 46, 2, '#f0c030', true);
			letras('BIANCA CARDADOR', 400, 262, 1, '#a8904a', true); // (a assinatura da autora, pintada no pátio)
		}));
		if (!window.Nave || !window.Nave.renderizarModelo) return;
		var L = 300, A = 220, r = window.Nave.renderizarModelo({ L: L, A: A, giro: 3.75, inclinacao: 38 * Math.PI / 180, esc: 84, ox: L / 2, oy: A / 2, luz: [-0.5, -0.45, 0.75], brilho: 1, motores: false });
		var k = document.createElement('canvas'); k.width = L; k.height = A;
		var g = k.getContext('2d'), img = g.createImageData(L, A); new Uint32Array(img.data.buffer).set(r.cores); g.putImageData(img, 0, 0);
		naveCasa = k;
		// a sujeira: manchas por cima da nave (só nos pixels da nave), mais grossas embaixo e atrás
		if (sujo) {
			var s = document.createElement('canvas'); s.width = L; s.height = A;
			var gs = s.getContext('2d'), im2 = gs.createImageData(L, A), d2 = new Uint32Array(im2.data.buffer), cs = rgb(sujo.cor) & 0x00ffffff;
			for (var y = 0; y < A; y++) for (var x = 0; x < L; x++) {
				if (!r.cores[y * L + x]) continue;
				var n = ruido(x >> 2, y >> 2) * 0.6 + ruido(x, y) * 0.4 + y / A * 0.25;
				if (n > 0.55) d2[y * L + x] = ((Math.min(255, Math.round((n - 0.4) * 300)) << 24) | cs) >>> 0;
			}
			gs.putImageData(im2, 0, 0); sujeiraCasa = s;
		}
	}
	// a vista da janela no hangar 11 (a mesma da cabine no embarque), com o dobro da altura da tela:
	// em cima o céu indo para o espaço, embaixo os paredões de rocha, o muro da baia e o chão
	var foraCasa = null;
	function fazerForaCasa() {
		return paraCanvas(pintar(new Pintura(W, H * 2, OX), function () {
			for (var y = 0; y < H * 2; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
				var c, q = (x - 240) / 240;
				var rocha = 300 + Math.sin((x + OX) * 0.04) * 6 + ruido((x + OX) >> 3, 7) * 9, muro = 334 + q * q * 10, chao = 362 + q * q * 14;
				if (y < rocha) {
					c = rampa(['#03041a', '#080c2e', '#141a4c', '#2e2a68', '#6a3a78', '#c0605e', '#f0a868'], Math.pow(y / rocha, 1.7), x, y);
					if (y < 250 && ruido(x + 917, y + 331) > 0.991 + y / 250 * 0.008) c = ruido(x, y) > 0.6 ? '#ffffff' : '#bfe0ff';
				} else if (y < muro) {
					var cam = Math.floor((y + Math.sin(x * 0.07) * 4) / 5);
					c = rampa(['#4a3a30', '#6a5040', '#8a6a50', '#aa8664', '#c8a07a'], 0.2 + ruido(x >> 2, cam) * 0.5 + (cam % 3) * 0.1 - (y - rocha) / 34 * 0.25, x, y);
				} else if (y < chao) {
					c = (Math.floor((x + OX) / 9) % 4 === 0) ? '#1e2028' : rampa(['#6a6e7a', '#5e6270', '#4a4e5a', '#3a3e4a', '#2c2f38'], (y - muro) / (chao - muro) * 0.8 + 0.1, x, y);
				} else {
					var z = 400 / (y - 346), u = (x - 240) / (y - 346) * 2.2;
					var junta = z % 1 < 0.06 || Math.abs((u % 1 + 1) % 1 - 0.5) > 0.47;
					c = junta ? '#8a867c' : rampa(['#d0ccc2', '#c0bcb2', '#b0aca2', '#a09c92', '#8e8a82'], 0.15 + ruido(Math.floor(u), Math.floor(z)) * 0.3 + (ruido(x, y) - 0.5) * 0.12 + (1 - (y - chao) / 180) * 0.2, x, y);
				}
				px(x, y, c);
			}
			for (var t = Math.PI; t < Math.PI * 2; t += 0.001) {
				var zx = 240 + Math.cos(t) * 330, zy = 470 + Math.sin(t) * 74;
				if (zy < 366) continue;
				var faixa = (Math.floor(t * 30) % 2) ? '#f0c030' : '#1a1a1e', esp = Math.max(1, Math.round((zy - 350) / 14));
				for (var e2 = 0; e2 < esp; e2++) px(zx, zy + e2, faixa);
			}
			letras('11', 240, 418, 3, '#e8b830', true);
			for (y = 250; y < 364; y++) for (x = -OX; x < 34; x++) px(x, y, rampa(['#e8e2d8', '#d0cabe', '#b8b2a6', '#9a948a', '#6a665e'], (x + OX) / (34 + OX) * 0.9 + (ruido(x >> 2, y >> 2) - 0.5) * 0.08, x, y));
			for (y = 258; y < 360; y += 16) { ret(-OX, y, 34 + OX, 2, '#7a766e'); ret(-OX + 6, y + 5, 10, 5, '#2a2c34'); ret(-OX + 6, y + 5, 10, 1, '#ffd890'); }
			[[96, 300], [384, 300]].forEach(function (p) { ret(p[0], p[1], 3, 36, '#4a4e5a'); ret(p[0] + 1, p[1], 1, 36, '#8a8e98'); ret(p[0] - 5, p[1] - 4, 13, 5, '#2a2c34'); ret(p[0] - 4, p[1] + 1, 11, 1, '#fff4d0'); });
		}));
	}
	var gotas = [];
	function desenharLavagem(c, t) { // t: segundos desde o começo da lavagem
		var B = BAIA, nx = B.cx + 6, ny = B.cy + B.fundo - 4, x0 = nx - 150, y0 = ny - 134;
		c.drawImage(fundoHangar, -OX, 0);
		c.globalAlpha = 0.5; c.fillStyle = '#120e0a'; c.beginPath(); c.ellipse(nx + 10, ny + 8, 120, 42, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
		if (naveCasa) c.drawImage(naveCasa, x0, y0);
		// a frente de lavagem anda da esquerda para a direita: atrás dela a nave já está limpa
		var frente = x0 + 40 + Math.min(1, t / 7) * 240;
		if (sujeiraCasa) { c.save(); c.beginPath(); c.rect(frente, 0, W, H); c.clip(); c.drawImage(sujeiraCasa, x0, y0); c.restore(); }
		// os dois lavadores com as mangueiras, jogando água na frente de lavagem
		var lavando = t < 7.2;
		[[-1, ny + 40], [1, ny - 40]].forEach(function (q, i) {
			var lx = frente - 20 + i * 8, ly = q[1] + (i ? 0 : 0);
			R(c, lx, ly - 7, 4, 7, '#3a6ab0'); R(c, lx, ly - 10, 4, 3, '#e8c0a0'); R(c, lx, ly - 11, 4, 1, '#ffd36a'); R(c, lx, ly, 1, 2, '#2a2c34'); R(c, lx + 3, ly, 1, 2, '#2a2c34');
			if (!lavando) return;
			var alvoY = ny - 20 + i * 14 + Math.sin(t * 3 + i) * 10;
			for (var k = 0; k < 16; k++) { var u = ((t * 2.4 + k / 16) % 1), gx = lx + 4 + (frente + 6 - lx) * u, gy = ly - 6 + (alvoY - ly + 6) * u - Math.sin(u * Math.PI) * 10; P(c, gx, gy, u > 0.8 ? '#ffffff' : '#9ad8ff'); }
			if (Math.random() < 0.7) gotas.push({ x: frente + 4 + Math.random() * 6, y: alvoY + (Math.random() - 0.5) * 8, vx: (Math.random() - 0.3) * 30, vy: -20 - Math.random() * 20, v: 0.8, cor: Math.random() < 0.4 && sujo ? sujo.cor : '#cfeeff' });
		});
		// a espuma e a água escorrendo, levando a sujeira
		for (var i = gotas.length - 1; i >= 0; i--) { var g = gotas[i]; g.v -= 1 / 30; g.vy += 60 / 30; g.x += g.vx / 30; g.y += g.vy / 30; if (g.v <= 0) { gotas.splice(i, 1); continue; } c.globalAlpha = Math.min(1, g.v * 1.5); P(c, g.x, g.y, g.cor); }
		c.globalAlpha = 1;
		for (var b = 0; b < 12; b++) { var bx = x0 + 40 + ruido(b, 31) * Math.max(1, frente - x0 - 40), by = ny - 30 + ruido(b, 32) * 60; if (bx < frente) { c.globalAlpha = 0.6; R(c, bx, by, 2, 2, '#ffffff'); c.globalAlpha = 1; } }
		// limpinha: brilhos correndo pelo casco
		if (t > 7.2) for (var s = 0; s < 6; s++) { var f = ((t * 0.8 + s / 6) % 1); if (f < 0.25) { var sx = x0 + 60 + ruido(s, 41) * 180, sy = y0 + 70 + ruido(s, 42) * 80; R(c, sx - 3, sy, 7, 1, '#ffffff'); R(c, sx, sy - 3, 1, 7, '#ffffff'); } }
		// a nave pousando no começo (descendo do céu, com a sombra crescendo)
	}

	// ================== As estações da alfândega ==================
	// três modelos (MODELO), desenhados a cada quadro no tamanho k, com o miolo em (x, y):
	//  - anel: um anel girando devagar em volta do miolo, com raios, janelas acesas e o braço de atracagem;
	//  - escudo: um guarda-sol enorme virado para a estrela (a gente vê as costas dele, com as nervuras),
	//    o módulo habitado na sombra e as asas de painéis solares;
	//  - farol: uma torre treliçada no escuro, a antena parabólica, o módulo no meio e o farol girando no alto
	function desenharEstacao(c, t, k, x, y) {
		c.save(); c.translate(x, y);
		if (MODELO === 'escudo') {
			// o escudo: um disco forrado com a mesma manta dourada amassada da escotilha (a que se vê de
			// perto, quando a nave atraca), com as nervuras e a borda brilhando com a luz da estrela
			var er = 110 * k, fo = manta || (manta = fazerManta());
			c.save(); c.beginPath(); c.ellipse(0, -6 * k, er, er * 0.42, 0, 0, Math.PI * 2); c.clip();
			c.imageSmoothingEnabled = false; c.drawImage(fo, 0, 0, 160, 70, -er, -6 * k - er * 0.42, er * 2, er * 0.84);
			c.fillStyle = 'rgba(40,24,6,0.25)'; c.fillRect(-er, -6 * k, er * 2, er * 0.42); // (a metade de baixo, na sombra)
			c.restore();
			c.strokeStyle = 'rgba(90,60,20,0.8)'; c.lineWidth = Math.max(1, 1.5 * k);
			for (var nv = 0; nv < 12; nv++) { var an = nv / 12 * Math.PI * 2; c.beginPath(); c.moveTo(0, -6 * k); c.lineTo(Math.cos(an) * er, -6 * k + Math.sin(an) * er * 0.42); c.stroke(); }
			c.strokeStyle = '#e8c46a'; c.lineWidth = Math.max(1, 3 * k); c.beginPath(); c.ellipse(0, -6 * k, er, er * 0.42, 0, 0, Math.PI * 2); c.stroke();
			brilhoC(c, -er * 0.7, -er * 0.35, 30 * k, 'rgba(255,230,170,0.9)', 0.6);
			// as asas de painéis solares, para os lados
			[-1, 1].forEach(function (l) {
				c.fillStyle = '#1a2a6a'; c.fillRect(l > 0 ? 30 * k : -86 * k, 14 * k, 56 * k, 14 * k);
				c.strokeStyle = '#4a6ac8'; c.lineWidth = 1; for (var p = 0; p <= 7; p++) { c.beginPath(); c.moveTo((l > 0 ? 30 : -86) * k + p * 8 * k, 14 * k); c.lineTo((l > 0 ? 30 : -86) * k + p * 8 * k, 28 * k); c.stroke(); }
				c.fillStyle = '#8a8e9a'; c.fillRect(l > 0 ? 20 * k : -30 * k, 19 * k, 10 * k, 4 * k);
			});
			// o módulo habitado, um cilindro forrado de manta dourada, com janelinhas e a porta de atracagem
			c.drawImage(fo, 200, 80, 40, 34, -20 * k, 4 * k, 40 * k, 34 * k);
			c.fillStyle = 'rgba(255,240,190,0.25)'; c.fillRect(-20 * k, 4 * k, 12 * k, 34 * k); c.fillStyle = 'rgba(40,24,6,0.3)'; c.fillRect(10 * k, 4 * k, 10 * k, 34 * k);
			for (var w = 0; w < 4; w++) { c.fillStyle = w % 2 ? '#ffe2a0' : '#9ad8ff'; c.fillRect(-14 * k + w * 8 * k, 10 * k, 3 * k, 3 * k); }
			c.fillStyle = '#1a1c24'; c.beginPath(); c.arc(0, 26 * k, 8 * k, 0, Math.PI * 2); c.fill();
			c.strokeStyle = '#e8c46a'; c.lineWidth = Math.max(1, 2 * k); c.beginPath(); c.arc(0, 26 * k, 10 * k, 0, Math.PI * 2); c.stroke();
			if (Math.sin(t * 6) > 0) { c.fillStyle = '#ff4a4a'; c.fillRect(Math.round(-88 * k), Math.round(20 * k), 3, 3); c.fillStyle = '#4aff8a'; c.fillRect(Math.round(86 * k), Math.round(20 * k), 3, 3); }
		} else if (MODELO === 'farol') {
			// a torre treliçada, de cima a baixo
			var topo = -80 * k, base = 80 * k, lg = 8 * k;
			c.strokeStyle = '#6a6e7a'; c.lineWidth = Math.max(1, 1.5 * k);
			c.beginPath(); c.moveTo(-lg, topo); c.lineTo(-lg, base); c.moveTo(lg, topo); c.lineTo(lg, base); c.stroke();
			for (var yy = topo; yy < base; yy += 12 * k) { c.beginPath(); c.moveTo(-lg, yy); c.lineTo(lg, yy + 12 * k); c.moveTo(lg, yy); c.lineTo(-lg, yy + 12 * k); c.stroke(); }
			// a antena parabólica, apontada para a Terra
			c.fillStyle = '#d8dce6'; c.beginPath(); c.ellipse(-34 * k, -36 * k, 22 * k, 8 * k, -0.5, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#a8acb8'; c.beginPath(); c.ellipse(-33 * k, -35 * k, 22 * k, 6 * k, -0.5, 0, Math.PI); c.fill();
			c.strokeStyle = '#8a8e9a'; c.beginPath(); c.moveTo(-lg, -30 * k); c.lineTo(-30 * k, -34 * k); c.stroke();
			// o módulo no meio, com o anel de atracagem azul virado para nós
			c.fillStyle = '#8a8e9a'; c.beginPath(); c.ellipse(0, 6 * k, 30 * k, 22 * k, 0, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#b8bcc8'; c.beginPath(); c.ellipse(-6 * k, 0, 20 * k, 14 * k, 0, 0, Math.PI * 2); c.fill();
			for (var w2 = 0; w2 < 6; w2++) { c.fillStyle = w2 % 2 ? '#ffe2a0' : '#9ad8ff'; c.fillRect((-24 + w2 * 9) * k, 16 * k, 3 * k, 2 * k); }
			c.fillStyle = '#1a1c24'; c.beginPath(); c.arc(0, 6 * k, 9 * k, 0, Math.PI * 2); c.fill();
			c.strokeStyle = '#4a8aff'; c.lineWidth = Math.max(1, 2.5 * k); c.beginPath(); c.arc(0, 6 * k, 11 * k, 0, Math.PI * 2); c.stroke();
			// o farol girando no alto: dois fachos de luz varrendo o escuro
			var ang = t * 1.6;
			c.save(); c.globalCompositeOperation = 'lighter';
			[0, Math.PI].forEach(function (d) {
				var a2 = ang + d; c.globalAlpha = 0.18 + 0.12 * Math.cos(a2);
				c.fillStyle = '#ffd36a'; c.beginPath(); c.moveTo(0, topo); c.lineTo(Math.cos(a2 - 0.08) * 200 * k, topo + Math.sin(a2 - 0.08) * 60 * k); c.lineTo(Math.cos(a2 + 0.08) * 200 * k, topo + Math.sin(a2 + 0.08) * 60 * k); c.fill();
			});
			c.restore();
			c.fillStyle = '#ffd36a'; c.beginPath(); c.arc(0, topo, 4 * k, 0, Math.PI * 2); c.fill(); brilhoC(c, 0, topo, 14 * k, 'rgba(255,220,120,1)', 0.7); // (já dentro do translate)
		} else {
			var rx = 120 * k, ry = 40 * k;
			// o anel de trás (mais escuro)
			c.strokeStyle = '#3a3e4a'; c.lineWidth = Math.max(2, 14 * k); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, Math.PI, Math.PI * 2); c.stroke();
			// os raios
			c.strokeStyle = '#6a6e7a'; c.lineWidth = Math.max(1, 3 * k);
			for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + t * 0.15; c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * rx, Math.sin(a) * ry); c.stroke(); }
			// o miolo e o braço de atracagem apontando para nós
			c.fillStyle = '#8a8e9a'; c.beginPath(); c.ellipse(0, 0, 26 * k, 26 * k, 0, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#b8bcc8'; c.beginPath(); c.ellipse(-4 * k, -5 * k, 18 * k, 16 * k, 0, 0, Math.PI * 2); c.fill();
			c.fillStyle = '#1a1c24'; c.beginPath(); c.ellipse(0, 0, 11 * k, 11 * k, 0, 0, Math.PI * 2); c.fill();
			c.strokeStyle = '#f0c030'; c.lineWidth = Math.max(1, 3 * k); c.setLineDash([4 * k, 4 * k]); c.beginPath(); c.ellipse(0, 0, 14 * k, 14 * k, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
			// o anel da frente, com as janelinhas acesas
			c.strokeStyle = '#a8acb8'; c.lineWidth = Math.max(2, 14 * k); c.beginPath(); c.ellipse(0, 0, rx, ry, 0, 0, Math.PI); c.stroke();
			c.strokeStyle = '#d8dce6'; c.lineWidth = Math.max(1, 3 * k); c.beginPath(); c.ellipse(0, -5 * k, rx, ry, 0, 0.2, Math.PI - 0.2); c.stroke();
			for (var j = 0; j < 24; j++) { var b = j / 24 * Math.PI + t * 0.05; if (Math.sin(b) < 0.1) continue; c.fillStyle = j % 3 ? '#ffe2a0' : '#9ad8ff'; c.fillRect(Math.round(Math.cos(b) * rx), Math.round(Math.sin(b) * ry + 2 * k), Math.max(1, Math.round(3 * k)), Math.max(1, Math.round(2 * k))); }
			// as luzes de aproximação piscando
			if (Math.sin(t * 6) > 0) { c.fillStyle = '#ff4a4a'; c.fillRect(Math.round(-rx - 4), -1, 3, 3); c.fillStyle = '#4aff8a'; c.fillRect(Math.round(rx + 2), -1, 3, 3); }
		}
		c.restore();
	}
	// O agente da alfândega: um robô de cabeça branca arredondada, com o visor escuro onde os olhos
	// piscam e a boca vira ondinha enquanto fala; quepe com a faixa e o distintivo dourados, antena,
	// dragonas nos ombros, o crachá e o carimbo na mão (que desce no "tum"). As cores do uniforme e um
	// detalhe próprio mudam em cada lugar (AG). (x, y) é o meio do pescoço; e = escala (1 na escotilha)
	var falaAte = 0, carimbouEm = 0;
	function desenharAgente(c, t, x, y, e) {
		function Rr(dx, dy, w, h, cor) { R(c, x + dx * e, y + dy * e, w * e, h * e, cor); }
		function O(dx, dy, rx, ry, cor) { c.fillStyle = cor; c.beginPath(); c.ellipse(x + dx * e, y + dy * e, rx * e, ry * e, 0, 0, Math.PI * 2); c.fill(); }
		function caixaR(dx, dy, w, h, r, cor) { c.fillStyle = cor; c.beginPath(); if (c.roundRect) c.roundRect(x + dx * e, y + dy * e, w * e, h * e, r * e); else c.rect(x + dx * e, y + dy * e, w * e, h * e); c.fill(); }
		var bob = Math.round(Math.sin(t * 2) * 0.6), falando = performance.now() < falaAte, X = AG.extra, olhoC = AG.olho;
		// a luz da cabine da estação atrás dele, no tom do uniforme
		if (e >= 0.8) { var fundo = c.createRadialGradient(x, y - 10 * e, 2, x, y - 10 * e, 34 * e); fundo.addColorStop(0, AG.terno); fundo.addColorStop(1, '#0a1430'); c.fillStyle = fundo; c.globalAlpha = 0.8; c.fillRect(x - 40 * e, y - 44 * e, 80 * e, 80 * e); c.globalAlpha = 1; }
		// o corpo: o paletó com as dragonas, o crachá e a faixa dourada
		O(0, 20, 24, 14, AG.terno); c.globalAlpha = 0.25; O(-4, 15, 18, 8, '#ffffff'); c.globalAlpha = 1;
		if (X === 'blindado') { O(-18, 10, 8, 6, '#6a2a10'); O(18, 10, 8, 6, '#6a2a10'); [[-20, 8], [-15, 12], [16, 8], [21, 12]].forEach(function (q) { Rr(q[0], q[1], 1, 1, '#ffd890'); }); }
		else { Rr(-24, 8, 9, 3, '#e8c46a'); Rr(15, 8, 9, 3, '#e8c46a'); Rr(-23, 11, 7, 1, '#c8a040'); Rr(16, 11, 7, 1, '#c8a040'); }
		Rr(-1, 8, 2, 20, '#e8c46a');
		if (X === 'gravata') { Rr(-3, 8, 6, 3, '#f2eefc'); Rr(-1, 9, 2, 12, '#c83a4a'); }
		if (X === 'cachecol') { O(0, 8, 13, 4, '#e84a5a'); Rr(4, 9, 4, 12, '#e84a5a'); for (var lis = 0; lis < 3; lis++) Rr(4, 12 + lis * 4, 4, 1, '#ffffff'); }
		Rr(-14, 14, 7, 5, '#f2eefc'); Rr(-13, 15, 2, 2, '#ff9a7a'); Rr(-10, 15, 2, 1, AG.terno); Rr(-10, 17, 2, 1, AG.terno); // o crachá
		// o pescoço sanfonado
		Rr(-4, 2, 8, 6, '#6a6e7a'); Rr(-4, 4, 8, 1, '#4a4e5a'); Rr(-4, 6, 8, 1, '#4a4e5a');
		// a cabeça arredondada (deitada em Urano, como o planeta), com os parafusos das orelhas
		var hy = -16 + bob;
		if (X === 'deitado') { c.save(); c.translate(x, y + (hy + 6) * e); c.rotate(-0.3); c.translate(-x, -(y + (hy + 6) * e)); }
		caixaR(-15, hy - 4, 30, 24, 7, '#c8ccd6'); caixaR(-15, hy - 4, 24, 20, 7, '#e8ecf4');
		O(-16, hy + 7, 3, 4, '#8a8e9a'); O(16, hy + 7, 3, 4, '#6a6e7a'); Rr(-17, hy + 6, 1, 1, '#ffffff');
		// o visor com os olhos e a boca
		caixaR(-11, hy, 22, 14, 3, '#0c1428'); Rr(-10, hy, 8, 1, '#2a3a5a');
		var pisca = (t % 3.3) > 3.15, feliz = performance.now() - carimbouEm < 1600;
		[-7, 3].forEach(function (ox) {
			if (pisca) Rr(ox, hy + 5, 5, 1, olhoC);
			else if (feliz) { Rr(ox, hy + 4, 5, 1, olhoC); Rr(ox, hy + 3, 1, 1, olhoC); Rr(ox + 4, hy + 3, 1, 1, olhoC); } // olhinhos sorrindo
			else { Rr(ox, hy + 3, 5, 4, olhoC); Rr(ox + 1, hy + 3, 2, 1, '#ffffff'); }
		});
		if (falando) for (var b = 0; b < 6; b++) Rr(-6 + b * 2, hy + 10 - Math.round(Math.abs(Math.sin(t * 18 + b)) * 2), 1, 1 + Math.round(Math.abs(Math.sin(t * 18 + b)) * 2), olhoC);
		else { Rr(-4, hy + 10, 8, 1, olhoC); Rr(-5, hy + 9, 1, 1, olhoC); Rr(4, hy + 9, 1, 1, olhoC); }
		// os detalhes de cada lugar, no rosto
		if (X === 'viseira') { c.globalAlpha = 0.75; caixaR(-13, hy - 1, 26, 9, 3, '#e8b030'); c.globalAlpha = 1; Rr(-12, hy, 10, 1, '#fff4c8'); } // o visor dourado contra o Sol
		if (X === 'mascara') { caixaR(-9, hy + 8, 18, 7, 3, '#5a5e6a'); O(-5, hy + 11, 2, 2, '#2a2c34'); O(5, hy + 11, 2, 2, '#2a2c34'); O(-5, hy + 5, 4, 3, 'rgba(127,227,255,0.35)'); O(5, hy + 5, 4, 3, 'rgba(127,227,255,0.35)'); } // óculos e máscara contra a poeira
		if (X === 'oculos') { Rr(-10, hy + 2, 8, 5, '#14141a'); Rr(2, hy + 2, 8, 5, '#14141a'); Rr(-2, hy + 3, 4, 1, '#14141a'); Rr(-9, hy + 3, 3, 1, '#5a5e7a'); Rr(3, hy + 3, 3, 1, '#5a5e7a'); }
		if (X === 'monoculo') { c.strokeStyle = '#e8c46a'; c.lineWidth = e; c.beginPath(); c.arc(x + 5.5 * e, y + (hy + 5) * e, 4.5 * e, 0, Math.PI * 2); c.stroke(); Rr(9, hy + 8, 1, 10, '#e8c46a'); }
		brilhoC(c, x, y + (hy + 6) * e, 14 * e, olhoC, 0.25);
		// o quepe com a aba, a faixa e o distintivo dourado (o planetinha da agência)
		Rr(-15, hy - 11, 30, 8, AG.quepe); Rr(-17, hy - 4, 34, 2, '#070b24'); Rr(-15, hy - 5, 30, 1, '#e8c46a');
		O(0, hy - 8, 3, 3, '#e8c46a'); O(0, hy - 8, 2, 2, '#ff9a7a'); Rr(-1, hy - 10, 1, 1, '#fff4c8');
		if (X === 'flor') { O(-10, hy - 10, 3, 3, '#ff8ad8'); O(-10, hy - 10, 1.2, 1.2, '#ffe060'); }
		if (X === 'estrelas') for (var s = 0; s < 7; s++) Rr(-13 + s * 4, hy - 13 - (s % 2), 1, 1, s === 3 ? '#ffffff' : '#cfe0ff');
		if (X === 'anel') { c.strokeStyle = 'rgba(232,212,150,0.85)'; c.lineWidth = 1.5 * e; c.beginPath(); c.ellipse(x, y + (hy - 8) * e, 22 * e, 5 * e, -0.15, 0, Math.PI * 2); c.stroke(); }
		// a antena (duas, em alguns lugares), com a luzinha piscando
		var luz = Math.sin(t * 5) > 0;
		(X === 'antenas' ? [-9, 9] : [9]).forEach(function (ax, i) {
			Rr(ax, hy - 18, 1, 7, '#8a8e9a'); O(ax + 0.5, hy - 19, 2, 2, (luz !== !!i) ? olhoC : '#2a3a4a');
			if (luz !== !!i) brilhoC(c, x + (ax + 0.5) * e, y + (hy - 19) * e, 6 * e, olhoC, 0.6);
		});
		// (mais detalhes de cada lugar, por cima de tudo)
		if (X === 'coroa') { for (var cr = -3; cr <= 3; cr++) { var ax2 = cr * 4.5, alt2 = cr % 2 ? 3 : 5; Rr(ax2, hy - 12 - alt2, 1, alt2, '#ffd36a'); Rr(ax2, hy - 12 - alt2, 1, 1, '#fff4c8'); } brilhoC(c, x, y + (hy - 14) * e, 18 * e, 'rgba(255,210,100,1)', 0.35); }
		if (X === 'interrogacao') { O(0, hy - 8, 3, 3, '#ffffff'); [[-1, -10], [0, -10], [1, -9], [0, -8], [0, -6]].forEach(function (p) { Rr(p[0], hy + p[1], 1, 1, '#5a2a10'); }); }
		if (X === 'orelhas') { [-1, 1].forEach(function (l) { O(l * 16, hy + 4, 3.5, 7, '#7a5a3a'); O(l * 16.5, hy + 6, 2, 4, '#a8805a'); }); } // orelhas de cachorro: a Estrela do Cão
		if (X === 'faixas') { Rr(-15, hy - 10, 30, 1, '#e8b080'); Rr(-15, hy - 8, 30, 1, '#c88a5a'); Rr(-15, hy - 7, 30, 1, '#e8c8a0'); O(6, hy - 8, 2.5, 1.2, '#c84a3a'); } // as faixas e a Grande Mancha Vermelha
		if (X === 'visorGama') { caixaR(-13, hy + 1, 26, 7, 3, 'rgba(224,112,255,0.55)'); Rr(-16, hy + 3, 3, 2, '#3a1050'); Rr(13, hy + 3, 3, 2, '#3a1050'); Rr(-11, hy + 2, 6, 1, '#ffd0ff'); }
		if (X === 'pinca') { Rr(-26, 6, 4, 9, AG.terno); O(-25, 1, 5, 4.5, '#e8603a'); Rr(-31, 0, 6, 1, '#1a1a22'); O(-27, -1, 1, 1, '#ffb08a'); }
		if (X === 'medalhas') { for (var md = 0; md < 4; md++) { Rr(-14 + md * 4, 20, 1, 2, '#c83a4a'); O(-13.5 + md * 4, 23, 1.6, 1.6, md % 2 ? '#ffd36a' : '#e8e8f0'); } }
		if (X === 'planetinha') { var ap = t * 1.4; O(Math.cos(ap) * 22, hy + 5 + Math.sin(ap) * 6, 2.2, 2.2, '#c8604a'); O(Math.cos(ap) * 22 - 0.7, hy + 4.3 + Math.sin(ap) * 6, 0.9, 0.9, '#ffb08a'); } // Proxima b em volta da cabeça
		if (X === 'oito') ['#b8b0a8', '#e8c070', '#4a8aff', '#d86a3a', '#d8a070', '#e8d090', '#8ad8e8', '#4a6ad8'].forEach(function (cp, k) { Rr(-14 + k * 3.8, hy - 5, 2, 1, cp); });
		if (X === 'deitado') c.restore();
		// a mão com o carimbo de madeira (levantado; desce no "tum")
		var desce = Math.max(0, 1 - (performance.now() - carimbouEm) / 400), sy = 4 + (desce > 0 ? Math.sin(desce * Math.PI) * 8 : 0);
		Rr(18, sy + 6, 5, 10, AG.terno); O(20.5, sy + 5, 3.5, 3, '#c8ccd6');
		Rr(18, sy - 6, 5, 8, '#a8743a'); Rr(19, sy - 6, 1, 8, '#c8945a'); O(20.5, sy - 7, 4, 2.5, '#8a5a2a'); Rr(16, sy + 1, 9, 3, '#3a3a44'); Rr(16, sy + 4, 9, 1, '#c83a4a');
	}
	// A manta térmica dourada das estações-escudo (como a das naves de verdade, que reflete o calor da
	// estrela): uma folha amassada em facetas irregulares, cada uma pegando a luz de um jeito, com os
	// vincos claros e escuros entre elas, as costuras da manta com pontinhos e uma luz suave de cima
	var manta = null;
	function fazerManta() {
		var OURO = ['#fff6c8', '#fbe39a', '#f0cc6a', '#ddb04a', '#c49034', '#a07024', '#78501a', '#4e3412'];
		var CEL = 6;
		function semente(cx, cy) { return [cx * CEL + ruido(cx, cy * 3 + 1) * CEL, cy * CEL + ruido(cx * 5 + 2, cy) * CEL]; }
		return paraCanvas(pintar(new Pintura(W, H, OX), function () {
			for (var y = 0; y < H; y++) for (var x = -OX; x < NUCLEO + OX; x++) {
				var gx = Math.floor((x + OX) / CEL), gy = Math.floor(y / CEL), d1 = 1e9, d2 = 1e9, id = 0;
				for (var j = -1; j <= 1; j++) for (var i = -1; i <= 1; i++) {
					var p = semente(gx + i, gy + j), d = Math.hypot(x + OX - p[0], y - p[1]);
					if (d < d1) { d2 = d1; d1 = d; id = (gx + i) * 7919 + (gy + j); } else if (d < d2) d2 = d;
				}
				// a faceta: um tom só, de acordo com a inclinação (sorteada) dela e a luz que vem de cima à esquerda
				// (as facetas vizinhas se alternam entre viradas para a luz e para a sombra, como papel amassado)
				var luz = (x + OX) / W * 0.2 + y / H * 0.3, inc = ruido(id, 11), t = 0.1 + (inc > 0.7 ? 0 : inc > 0.35 ? 0.25 : 0.5) + luz + (ruido(id, 17) - 0.5) * 0.12;
				// o vinco: a borda fininha entre duas facetas, quase sempre uma dobra escura, às vezes um fio de brilho
				if (d2 - d1 < 0.7) t = ruido(id, 13) > 0.75 ? 0 : 0.85;
				px(x, y, OURO[Math.max(0, Math.min(OURO.length - 1, Math.round(t * (OURO.length - 1))))]);
			}
			// as costuras da manta: faixas mais escuras com os pontinhos da linha
			for (var sy = 34; sy < H; sy += 46) for (var sx = -OX; sx < NUCLEO + OX; sx++) { px(sx, sy, '#5a3c14'); if (sx % 4 === 0) px(sx, sy - 1, '#fff6c8'); }
			for (var sx2 = -OX + 58; sx2 < NUCLEO + OX; sx2 += 120) for (var sy2 = 0; sy2 < H; sy2++) { px(sx2, sy2, '#5a3c14'); if (sy2 % 4 === 0) px(sx2 + 1, sy2, '#fff6c8'); }
			// alguns reflexos fortes, como a folha brilhando
			for (var k = 0; k < 18; k++) { var rx = -OX + ruido(k, 31) * W, ry = ruido(k, 32) * 150; px(rx, ry, '#ffffff'); px(rx + 1, ry, '#fff6c8'); px(rx, ry + 1, '#fff6c8'); }
		}));
	}
	// bem de perto: a escotilha redonda da estação, com o agente da alfândega pela janelinha. Cada
	// modelo tem a sua: o anel com faixas amarelas e pretas; o escudo com o casco de folha dourada em
	// hexágonos; o farol com o aro azul e as luzes de sinalização
	function desenharEscotilha(c, t, aberta) {
		var cx = 240, cy = VIDRO.oy, m = MODELO;
		R(c, -OX, 0, W, H, m === 'escudo' ? '#3a3020' : m === 'farol' ? '#1a1e2c' : '#2a2c34');
		if (m === 'escudo') c.drawImage(manta || (manta = fazerManta()), -OX, 0);
		else for (var y = 0; y < 160; y += 12) { R(c, -OX, y, W, 1, '#1a1c22'); R(c, -OX, y + 1, W, 1, m === 'farol' ? '#2a3a6a' : '#4a4e5a'); }
		c.fillStyle = '#5a5e6a'; c.beginPath(); c.arc(cx, cy, 80, 0, Math.PI * 2); c.fill();
		if (m === 'escudo') { c.fillStyle = '#e8c46a'; c.beginPath(); c.arc(cx, cy, 74, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#8a6a1a'; c.lineWidth = 2; for (var r6 = 0; r6 < 12; r6++) { var a3 = r6 / 12 * Math.PI * 2; c.beginPath(); c.moveTo(cx + Math.cos(a3) * 62, cy + Math.sin(a3) * 62); c.lineTo(cx + Math.cos(a3) * 74, cy + Math.sin(a3) * 74); c.stroke(); } }
		else if (m === 'farol') { c.fillStyle = '#2a5ad8'; c.beginPath(); c.arc(cx, cy, 74, 0, Math.PI * 2); c.fill(); for (var lz = 0; lz < 16; lz++) { var a4 = lz / 16 * Math.PI * 2 + t * 0.8; if (lz % 4 === 0) { c.fillStyle = '#ffd36a'; c.fillRect(Math.round(cx + Math.cos(a4) * 68 - 2), Math.round(cy + Math.sin(a4) * 68 - 2), 4, 4); } } }
		else for (var a = 0; a < 24; a++) { c.fillStyle = a % 2 ? '#f0c030' : '#1a1a1e'; c.beginPath(); c.moveTo(cx, cy); c.arc(cx, cy, 74, a / 24 * Math.PI * 2, (a + 1) / 24 * Math.PI * 2); c.fill(); }
		c.fillStyle = '#8a8e9a'; c.beginPath(); c.arc(cx, cy, 62, 0, Math.PI * 2); c.fill();
		c.fillStyle = m === 'escudo' ? '#c8b890' : '#a8acb8'; c.beginPath(); c.arc(cx - 6, cy - 6, 50, 0, Math.PI * 2); c.fill();
		// a janelinha com o agente da alfândega
		c.fillStyle = '#0a1430'; c.beginPath(); c.arc(cx, cy - 4, 30, 0, Math.PI * 2); c.fill();
		if (aberta) { c.save(); c.beginPath(); c.arc(cx, cy - 4, 30, 0, Math.PI * 2); c.clip(); desenharAgente(c, t, cx, cy + 4, 1); c.restore(); }
		c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 2; c.beginPath(); c.arc(cx, cy - 4, 26, Math.PI * 1.1, Math.PI * 1.5); c.stroke();
		R(c, cx - 26, cy + 30, 52, 9, '#101a4a'); R(c, cx - 26, cy + 30, 52, 1, '#e8c46a'); texto3(c, 'ALFÂNDEGA', cx, cy + 32, 1, '#e8c46a', true);
		var corLuz = m === 'farol' ? ['#4a8aff', 'rgba(80,140,255,0.9)'] : m === 'escudo' ? ['#ffd36a', 'rgba(255,210,100,0.9)'] : ['#ff4a4a', 'rgba(255,80,80,0.9)'];
		[[-70, -40], [70, -40], [-70, 40], [70, 40]].forEach(function (q, i) { if (Math.sin(t * 4 + i) > 0) { R(c, cx + q[0] - 2, cy + q[1] - 2, 4, 4, corLuz[0]); brilhoC(c, cx + q[0], cy + q[1], 8, corLuz[1], 0.6); } });
	}

	// ================== O roteiro ==================
	var fase = 'salto', inicioFase = performance.now(), geracao = 0, fim = false;
	function irFase(f) { fase = f; inicioFase = performance.now(); }
	function tFase() { return (performance.now() - inicioFase) / 1000; }
	function depois(fn, ms) { var g = geracao; return setTimeout(function () { if (g === geracao && !fim) fn(); }, calmo ? 0 : ms); }
	function escurecer(v) { escuro.style.opacity = v; }
	function corte(f, fn) { escurecer(1); depois(function () { irFase(f); if (fn) fn(); escurecer(0); }, 450); }

	function balao(frase, quem, voz) {
		[].forEach.call(camada.querySelectorAll('.chegada-balao'), function (b) { b.remove(); });
		var b = document.createElement('div');
		b.className = 'chegada-balao';
		b.innerHTML = '<span class="chegada-balao-quem"></span><span class="chegada-balao-texto"></span>';
		b.firstChild.textContent = quem;
		camada.appendChild(b);
		var alvo = b.lastChild, i = 0;
		return new Promise(function (pronto) {
			(function letra() {
				if (!b.isConnected || fim) return;
				if (i >= frase.length) return pronto(b);
				var ch = frase[i++]; alvo.textContent += ch; falaAte = performance.now() + 160;
				if (/[\wÀ-ú]/.test(ch) && i % 2) blip(voz || 440);
				setTimeout(letra, /[,.!?:]/.test(ch) ? 150 : 32);
			})();
		});
	}
	function botaoFinal() {
		var b = document.createElement('button');
		b.type = 'button'; b.className = 'chegada-botao';
		b.innerHTML = '&#9656; Desembarcar em ' + NOME;
		b.addEventListener('click', terminar);
		camada.appendChild(b);
		setTimeout(function () { try { b.focus({ preventScroll: true }); } catch (e) {} }, 50);
	}
	// a alfândega: as boas-vindas do agente do lugar (com uma curiosidade de verdade), o passaporte e
	// o carimbo novo (se este destino ainda não tinha)
	function alfandega(quem) {
		var temCarimbo = !!(window.Chegada && window.Chegada.carimbo);
		balao(tipo === 'terra' ? 'Bem-vindo de volta à Terra! Passaporte, por favor.' : AG.fala, quem, 520).then(function () {
			depois(function () {
				balao('Passaporte, por favor...', quem, 520).then(function () {
					depois(function () {
						SONS.carimbo(); carimbouEm = performance.now();
						if (temCarimbo) { window.Chegada.carimbo(); window.Chegada.carimbo = null; }
						balao(temCarimbo ? 'Tum! Visto carimbado. Aproveite a visita!' : 'Seu passaporte já tem este visto. Boa visita de novo!', quem, 520).then(function () { depois(botaoFinal, 400); });
					}, 500);
				});
			}, tipo === 'terra' ? 0 : 1400);
		});
	}
	function roteiro() {
		SONS.freio();
		var temEvento = !!evento;
		// 1. saindo do salto
		depois(function () {
			irFase(temEvento ? 'evento' : 'cruzeiro');
			if (temEvento) {
				depois(function () { if (evento === 'raio') SONS.raio(); }, evento === 'raio' ? 1200 : 0);
				depois(function () { balao(FALAS_EVENTO[evento], 'Computador de bordo', 380); }, evento === 'raio' || evento === 'micrometeorito' ? 1700 : 900);
				try { var vs = lerLista('eventosVistos'); if (vs.indexOf(evento) < 0) { vs.push(evento); localStorage.setItem('eventosVistos', JSON.stringify(vs)); } } catch (e) {}
			}
			// sem evento no caminho: se o Sol estiver agitado de verdade agora, o computador de bordo avisa
			// (uma vez por visita)
			var avisoSol = !temEvento && window.TempoDoSol && window.TempoDoSol.aviso(), jaAvisou = false;
			try { jaAvisou = sessionStorage.getItem('avisoSol') === '1'; } catch (e) {}
			if (avisoSol && !jaAvisou) {
				try { sessionStorage.setItem('avisoSol', '1'); } catch (e) {}
				depois(function () { balao(avisoSol, 'Computador de bordo', 380); }, 900);
				depois(aproximar, 8500);
			} else depois(aproximar, temEvento ? 9000 : 1400);
		}, 1500);
	}
	function aproximar() {
		[].forEach.call(camada.querySelectorAll('.chegada-balao'), function (b) { b.remove(); });
		irFase('aproxima');
		SONS.motor(4);
		var aviso = tipo === 'pouso' ? 'Preparando o pouso em ' + NOME + '.' : tipo === 'terra' ? 'Hangar 11, aqui é a PX-01. Voltando para casa!' : 'Estação Alfândega de ' + NOME + ' à vista. Mantendo distância segura.';
		balao(aviso, tipo === 'terra' ? 'Você · rádio' : 'Computador de bordo', 380);
		depois(function () {
			if (tipo === 'estacao') corte('atraca', function () { SONS.motor(3.4); depois(function () { SONS.clunk(); corte('escotilha', function () { depois(function () { SONS.bip(); irFase('escotilhaAberta'); alfandega('Alfândega · ' + NOME); }, 900); }); }, 3600); });
			else if (tipo === 'pouso') corte('descida', function () {
				var s = SOLO[pagina];
				balao(s.nota, 'Computador de bordo', 380);
				SONS.motor(4.2);
				depois(function () { SONS.toque(); irFase('pousado'); depois(function () { alfandega('Alfândega · ' + NOME); }, 1800); }, 4200);
			});
			else corte('descidaCasa', function () {
				SONS.motor(4);
				depois(function () { SONS.toque(); corte('lavagem', function () {
					if (sujo) { SONS.agua(7.5); balao('A equipe do hangar 11 já está lavando ' + sujo.nome + ' da PX-01.', 'ZÖ-11 · rádio', 460); }
					else balao('A PX-01 voltou limpinha! A equipe do hangar 11 só confere tudo.', 'ZÖ-11 · rádio', 460);
					depois(function () { alfandega('ZÖ-11 · rádio'); }, sujo ? 8000 : 3500);
				}); }, 4000);
			});
		}, 4200);
	}

	// ================== O quadro ==================
	var poeira = [], solo = null;
	function quadro() {
		if (fim) return;
		requestAnimationFrame(quadro);
		var t = performance.now() / 1000, tf = tFase();
		ctx.setTransform(1, 0, 0, 1, OX, 0);
		var texto1 = 'CHEGANDO', texto2 = NOME.length > 12 ? NOME.split(' ').pop() : NOME;
		if (fase === 'salto') desenharEstrelas(ctx, t, Math.max(0, 1 - tf / 1.5));
		else if (fase === 'evento' || fase === 'cruzeiro') { desenharEstrelas(ctx, t, 0.02); if (fase === 'evento') desenharEvento(ctx, tf); }
		else if (fase === 'aproxima') {
			desenharEstrelas(ctx, t, 0.03);
			var k = suave(tf / 4.2), tam = 14 + k * k * (tipo === 'estacao' ? 110 : 190);
			desenharDestino(ctx, tam, 240 + (1 - k) * 30, VIDRO.oy + (tipo === 'estacao' ? -10 : 10) + k * (tipo === 'estacao' ? 0 : 30));
			texto2 = Math.round((1 - k) * 9000 + 120) + ' KM';
		} else if (fase === 'atraca' || fase === 'escotilha' || fase === 'escotilhaAberta') {
			if (fase === 'atraca') {
				desenharEstrelas(ctx, t, 0);
				desenharDestino(ctx, 124, 240, VIDRO.oy - 10);
				var ka = suave(tf / 3.6); desenharEstacao(ctx, t, 0.35 + ka * 1.4, 240 + (1 - ka) * 160, VIDRO.oy + 6 - (1 - ka) * 20);
				texto1 = 'ATRACANDO'; texto2 = Math.max(0, Math.round((1 - ka) * 300)) + ' M';
			} else { desenharEscotilha(ctx, t, fase === 'escotilhaAberta'); texto1 = 'ATRACADA'; texto2 = 'ALFÂNDEGA'; }
		} else if (fase === 'descida' || fase === 'pousado') {
			if (!solo) solo = fazerSolo(SOLO[pagina]);
			var kd = fase === 'pousado' ? 1 : suave(tf / 4.2), oy = Math.round(-HOR + 92 + (1 - kd) * 110 + (fase === 'descida' ? Math.sin(t * 9) * (1 - kd) : 0));
			// o horizonte vai subindo até a altura dos olhos (a nave descendo de pé)
			ctx.drawImage(solo, -OX, oy);
			if (fase === 'pousado') {
				// a poeira levantada no toque: no vácuo de Mercúrio ela cai rápido, em Marte fica no ar
				if (tf < 0.15 && !poeira.length) for (var i = 0; i < 90; i++) poeira.push({ x: 240 + (Math.random() - 0.5) * 60, y: 156, vx: (Math.random() - 0.5) * 160, vy: -Math.random() * 60, r: 1 + Math.random() * 3 });
				var ar = pagina === 'mercurio' ? 0 : pagina === 'venus' ? 0.6 : 0.3, gr = pagina === 'mercurio' ? 40 : 30;
				for (var p = poeira.length - 1; p >= 0; p--) {
					var q = poeira[p]; q.vy += gr / 30; q.vx *= 1 - ar * 0.05; q.vy *= 1 - ar * 0.04; q.x += q.vx / 30; q.y += q.vy / 30; q.r += ar * 0.05;
					if (q.y > 160 && pagina === 'mercurio') { poeira.splice(p, 1); continue; }
					if (q.y > 160) q.y = 160;
					ctx.globalAlpha = Math.max(0, 0.7 - tf * (0.6 - ar * 0.45)); ctx.fillStyle = SOLO[pagina].poeira; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill();
				}
				ctx.globalAlpha = 1;
				// o agente da alfândega saindo da cúpula e vindo até a nave
				var andar = Math.min(1, Math.max(0, (tf - 0.8) / 2.2)), ax = 360 - andar * 90, ay = HOR + 34 + oy + andar * 8;
				if (tf > 0.8) { // (o mesmo agente da escotilha, pequenininho, andando pelo chão)
					var pe = andar < 1 ? Math.floor(t * 6) % 2 : 0;
					R(ctx, ax - 3, ay - 6 - (pe ? 1 : 0), 2, 6 + (pe ? 1 : 0), '#2a2c34'); R(ctx, ax + 1, ay - 6 - (pe ? 0 : 1), 2, 6 + (pe ? 0 : 1), '#2a2c34');
					ctx.globalAlpha = 0.3; ctx.fillStyle = '#000000'; ctx.beginPath(); ctx.ellipse(ax, ay, 6, 1.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
					desenharAgente(ctx, t, ax, ay - 13, 0.36);
				}
				if (Math.sin(t * 4) > 0) R(ctx, 334 - 1, HOR + 2 + oy - 22, 2, 2, '#ff4a4a');
				texto1 = 'POUSADA'; texto2 = NOME;
			} else { texto1 = 'DESCENDO'; texto2 = Math.round((1 - kd) * 2000) + ' M'; }
			// a luz dos motores de pouso refletindo embaixo
			if (fase === 'descida') brilhoC(ctx, 240, 160, 80, 'rgba(140,210,255,0.6)', 0.4 + kd * 0.4);
		} else if (fase === 'descidaCasa') {
			// a volta: a mesma vista da janela da decolagem, ao contrário: do céu escuro até a baia 11
			// (a nave desce devagar no fim, quase parando antes de tocar o chão)
			var kc = suave(tf / 4.2);
			if (!foraCasa) foraCasa = fazerForaCasa();
			ctx.drawImage(foraCasa, -OX, Math.round(-kc * 254));
			brilhoC(ctx, 240, 160, 90, 'rgba(140,210,255,0.6)', kc * 0.5); // a luz dos motores de pouso no chão
			texto1 = 'HANGAR 11'; texto2 = Math.round((1 - kc) * 800) + ' M';
		}
		if (fase === 'lavagem') { if (!fundoHangar) fazerHangar(); desenharLavagem(ctx, tf); }
		else desenharCabine(ctx, t, texto1, texto2);
		// o raio cósmico também passa por cima da cabine (é no olho, não lá fora)
		if (fase === 'evento' && evento === 'raio' && tf > 1.2 && tf < 1.3) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.fillStyle = '#ffffff'; ctx.fillRect(-OX, 0, W, H); ctx.restore(); }
	}

	// ================== Fim ==================
	function terminar() {
		if (fim) return;
		fim = true; geracao++;
		try { if (chegadas.indexOf(pagina) < 0) { chegadas.push(pagina); localStorage.setItem('chegadas', JSON.stringify(chegadas)); } } catch (e) {}
		if (tipo === 'terra') try { localStorage.setItem('naveSujeira', 'terra'); } catch (e) {}
		// se pulou antes da alfândega, o carimbo aparece agora mesmo
		if (window.Chegada && window.Chegada.carimbo) { var cb = window.Chegada.carimbo; setTimeout(cb, 700); }
		window.Chegada = null;
		raiz.classList.add('saindo');
		document.documentElement.classList.remove('chegando');
		setTimeout(function () { raiz.remove(); if (audio) audio.close(); }, 700);
	}
	raiz.querySelector('.chegada-pular').addEventListener('click', terminar);
	document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape' && !fim) { terminar(); document.removeEventListener('keydown', esc); } });
	window.addEventListener('resize', function () { var antes = W; medir(); ajustar(); if (W !== antes) { fazerMoldura(); solo = null; fundoHangar = null; foraCasa = null; manta = null; } });

	fazerMoldura();
	escurecer(0);
	roteiro();
	requestAnimationFrame(quadro);
})();
