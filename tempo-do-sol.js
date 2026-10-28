// O tempo do Sol ao vivo: os dados de verdade do Centro de Previsão do Clima Espacial da NOAA
// (Space Weather Prediction Center, services.swpc.noaa.gov), lidos direto pelo navegador de quem visita.
// O vento solar (velocidade e densidade, medidos pelo satélite no ponto L1, a 1,5 milhão de km da Terra),
// o campo magnético que ele traz (Bz), o índice Kp (o quanto o campo magnético da Terra está sacudido,
// de 0 a 9), os raios X do Sol medidos pelo satélite GOES (que dão a classe das explosões: A, B, C, M, X),
// as escalas de alerta da NOAA (R = apagão de rádio, S = tempestade de partículas, G = tempestade
// geomagnética) e o número de manchas solares do mês.
// Nada é inventado: se a NOAA não responder, os visores dizem "sem sinal".
// Os dados ficam guardados por 15 minutos (localStorage: tempoDoSol), para não pedir de novo a cada página.
// Uso: TempoDoSol.quando(fn) chama fn(dados) quando eles chegarem (ou na hora, se já chegaram);
// TempoDoSol.visor(t) devolve as linhas do visor da cabine; TempoDoSol.aviso() e .boletim(), as frases.
(function () {
	'use strict';
	var T = window.T || function (pt) { return pt; };
	var BASE = 'https://services.swpc.noaa.gov/';
	var VALIDADE = 15 * 60 * 1000;
	var dados = null, carregando = false, esperando = [];

	function buscar(caminho) {
		var ctl = window.AbortController ? new AbortController() : null;
		var tempo = setTimeout(function () { if (ctl) ctl.abort(); }, 9000);
		return fetch(BASE + caminho, ctl ? { signal: ctl.signal, cache: 'no-store' } : { cache: 'no-store' })
			.then(function (r) { clearTimeout(tempo); if (!r.ok) throw new Error(r.status); return r.json(); });
	}
	// as tabelas da NOAA vêm de dois jeitos: lista de listas (a primeira é o cabeçalho) ou lista de objetos
	function tabela(j) {
		if (!Array.isArray(j) || !j.length) return [];
		if (Array.isArray(j[0])) { var cab = j[0]; return j.slice(1).map(function (l) { var o = {}; cab.forEach(function (k, i) { o[k] = l[i]; }); return o; }); }
		return j;
	}
	function num(v) { var n = parseFloat(v); return isFinite(n) ? n : null; }
	function ultimo(linhas, chave) { for (var i = linhas.length - 1; i >= 0; i--) { var v = num(linhas[i][chave]); if (v !== null) return { v: v, quando: linhas[i].time_tag || linhas[i]['time-tag'] }; } return null; }
	function campo(o, nomes) { for (var i = 0; i < nomes.length; i++) if (o && o[nomes[i]] !== undefined) return o[nomes[i]]; return undefined; }

	// a classe de uma explosão pelo fluxo de raios X (0,1 a 0,8 nm, em W/m²): A, B, C, M ou X, com o número
	function classe(fluxo) {
		var letras = [['X', 1e-4], ['M', 1e-5], ['C', 1e-6], ['B', 1e-7], ['A', 1e-8]];
		for (var i = 0; i < letras.length; i++) if (fluxo >= letras[i][1]) return letras[i][0] + (fluxo / letras[i][1]).toFixed(1);
		return 'A0.0';
	}

	function carregar() {
		if (carregando) return;
		carregando = true;
		var pedidos = [
			buscar('products/solar-wind/plasma-2-hour.json').then(function (j) { var l = tabela(j); return { vento: ultimo(l, 'speed'), densidade: ultimo(l, 'density') }; }),
			buscar('products/solar-wind/mag-2-hour.json').then(function (j) { return { bz: ultimo(tabela(j), 'bz_gsm') }; }),
			buscar('products/noaa-planetary-k-index.json').then(function (j) {
				var l = tabela(j), u = null;
				['Kp', 'kp', 'kp_index', 'estimated_kp'].some(function (k) { u = ultimo(l, k); return u; });
				return { kp: u };
			}),
			buscar('json/goes/primary/xrays-6-hour.json').then(function (j) {
				var l = tabela(j).filter(function (o) { return o.energy === '0.1-0.8nm'; }), u = ultimo(l, 'flux'), max = 0;
				l.forEach(function (o) { var f = num(o.flux); if (f !== null && f > max) max = f; });
				return { raioX: u ? { v: u.v, classe: classe(u.v), quando: u.quando } : null, raioXMax: max ? { v: max, classe: classe(max) } : null };
			}),
			buscar('products/noaa-scales.json').then(function (j) {
				var hoje = j && (j['0'] || j[0]), esc = {};
				['R', 'S', 'G'].forEach(function (k) { var s = hoje && hoje[k], n = num(s && campo(s, ['Scale', 'scale'])); esc[k] = n === null ? 0 : n; });
				return { escalas: esc };
			}),
			buscar('json/solar-cycle/observed-solar-cycle-indices.json').then(function (j) {
				var l = tabela(j);
				for (var i = l.length - 1; i >= 0; i--) { var v = num(l[i].ssn); if (v !== null && v >= 0) return { manchas: { v: Math.round(v), mes: l[i]['time-tag'] } }; }
				return {};
			})
		];
		var juntar = function (lista) {
			var d = { quando: Date.now() }, algum = false;
			lista.forEach(function (r) { if (r.status === 'fulfilled' && r.value) Object.keys(r.value).forEach(function (k) { if (r.value[k]) { d[k] = r.value[k]; algum = true; } }); });
			carregando = false;
			if (!algum) { dados = { semSinal: true, quando: Date.now() }; avisar(); return; }
			dados = d;
			try { localStorage.setItem('tempoDoSol', JSON.stringify(d)); } catch (e) {}
			avisar();
		};
		// (sem Promise.allSettled nos navegadores mais antigos: cada pedido vira um resultado, dê certo ou não)
		Promise.all(pedidos.map(function (p) { return p.then(function (v) { return { status: 'fulfilled', value: v }; }, function () { return { status: 'rejected' }; }); })).then(juntar);
	}
	function avisar() { var lista = esperando; esperando = []; lista.forEach(function (fn) { try { fn(dados); } catch (e) {} }); }

	// o resumo: o Sol está agitado agora? (explosão M ou X nas últimas 6 horas, Kp 5 ou mais, ou alerta da NOAA)
	function estado() {
		if (!dados || dados.semSinal) return null;
		var kp = dados.kp ? dados.kp.v : null, max = dados.raioXMax ? dados.raioXMax.classe : '', esc = dados.escalas || {};
		/* (cada motivo: o tipo, para o visor, e a frase nos dois idiomas) */
		var motivos = [];
		function motivo(tipo, pt, en) { motivos.push({ tipo: tipo, texto: T(pt, en) }); }
		if (/^[MX]/.test(max)) motivo('explosao', 'explosão classe ' + max + ' nas últimas horas', 'a class ' + max + ' solar flare in the last few hours');
		/* (a escala G oficial da NOAA vale mais; sem ela, a conta pelo Kp: 5 = G1, 6 = G2 ... 9 = G5) */
		var g = esc.G >= 1 ? esc.G : kp !== null && kp >= 5 ? Math.min(5, Math.floor(kp) - 4) : 0;
		if (g) motivo('G' + g, 'tempestade geomagnética G' + g + (kp !== null ? ' (Kp ' + kpTexto(kp) + ')' : ''), 'a G' + g + ' geomagnetic storm' + (kp !== null ? ' (Kp ' + kp.toFixed(1) + ')' : ''));
		if (esc.R >= 1) motivo('radio', 'apagão de rádio R' + esc.R + ' no lado da Terra virado para o Sol', 'an R' + esc.R + ' radio blackout on the side of Earth facing the Sun');
		if (esc.S >= 1) motivo('particulas', 'tempestade de partículas S' + esc.S, 'an S' + esc.S + ' solar radiation storm');
		return { agitado: motivos.length > 0, motivos: motivos, kp: kp, aurora: kp !== null && kp >= 5, auroraLonge: kp !== null && kp >= 7 };
	}

	// as linhas do visor da cabine (3 linhas de até 13 letras), passando de página em página
	function kpTexto(kp) { return kp.toFixed(1).replace('.', ','); }
	function visor(t) {
		var ciano = '#7fe3ff', verde = '#7dffa8', branco = '#dfffe8', laranja = '#ffb860', vermelho = '#ff6a5a';
		var semSinal = { linhas: [[T('TEMPO DO SOL', 'SOLAR WEATHER'), ciano], [T('SEM SINAL', 'NO SIGNAL'), laranja], [T('DA NOAA', 'FROM NOAA'), branco]] };
		if (!dados) return { linhas: [[T('TEMPO DO SOL', 'SOLAR WEATHER'), ciano], [T('SINTONIZANDO', 'TUNING IN'), branco], ['NOAA' + '...'.slice(0, Math.floor(t * 2) % 4), verde]] };
		if (dados.semSinal) return semSinal;
		var e = estado(), paginas = [];
		var aoVivo = T('NOAA AO VIVO', 'NOAA LIVE');
		if (e.agitado) {
			var m0 = e.motivos[0].tipo, linha2 = m0 === 'explosao' ? T('EXPLOSAO ', 'FLARE ') + dados.raioXMax.classe : m0.charAt(0) === 'G' ? T('TEMPESTADE ', 'STORM ') + m0 : m0 === 'radio' ? T('APAGAO RADIO', 'RADIO OUTAGE') : T('PARTICULAS', 'PARTICLES');
			paginas.push({ linhas: [[T('ALERTA SOLAR', 'SOLAR ALERT'), vermelho], [linha2, laranja], [e.aurora ? T('AURORA: SIM', 'AURORA: YES') : aoVivo, branco]], alerta: true });
		}
		if (dados.vento) paginas.push({ linhas: [[T('VENTO SOLAR', 'SOLAR WIND'), ciano], [Math.round(dados.vento.v) + ' KM/S', branco], [dados.bz ? 'BZ ' + dados.bz.v.toFixed(1) + ' NT' : aoVivo, verde]] });
		if (dados.raioX) paginas.push({ linhas: [[T('RAIOS X', 'X-RAYS'), ciano], [T('CLASSE ', 'CLASS ') + dados.raioX.classe, /^[MX]/.test(dados.raioX.classe) ? laranja : branco], ['GOES', verde]] });
		if (e.kp !== null) paginas.push({ linhas: [[T('INDICE KP ', 'KP INDEX ') + e.kp.toFixed(1), ciano], [e.kp >= 5 ? T('TEMPESTADE', 'STORM') : e.kp >= 4 ? T('AGITADO', 'ACTIVE') : T('CALMO', 'QUIET'), e.kp >= 5 ? laranja : branco], ['AURORA: ' + (e.aurora ? T('SIM', 'YES') : T('NAO', 'NO')), verde]] });
		if (dados.manchas) paginas.push({ linhas: [[T('MANCHAS', 'SUNSPOTS'), ciano], [dados.manchas.v + T(' NO MES', ' / MONTH'), branco], ['NOAA', verde]] });
		if (!paginas.length) return semSinal;
		var p = paginas[Math.floor(t / 3.5) % paginas.length];
		return { linhas: p.linhas, alerta: !!p.alerta, agitado: e.agitado };
	}

	// a frase do computador de bordo quando o Sol está agitado de verdade (ou null)
	function aviso() {
		var e = estado();
		if (!e || !e.agitado) return null;
		var m = e.motivos[0].texto;
		var f = T('Atenção: o Sol está agitado agora, de verdade. ' + m.charAt(0).toUpperCase() + m.slice(1) + ', segundo a NOAA.',
			'Attention: the Sun is really active right now. NOAA reports ' + m + '.');
		if (e.auroraLonge) f += T(' Tem aurora até em latitudes médias na Terra!', ' There are auroras even at mid-latitudes on Earth!');
		else if (e.aurora) f += T(' Tem aurora perto dos polos da Terra!', ' There are auroras near the poles on Earth!');
		return f;
	}
	// o boletim curto para o rádio e para a torre
	function boletim() {
		var e = estado();
		if (!e) return null;
		var partes = [];
		if (dados.vento) partes.push(T('vento solar a ', 'solar wind at ') + Math.round(dados.vento.v) + ' km/s');
		if (e.kp !== null) partes.push('Kp ' + T(kpTexto(e.kp), e.kp.toFixed(1)));
		return partes.length ? partes.join(', ') : null;
	}

	window.TempoDoSol = {
		quando: function (fn) { if (dados) fn(dados); else { esperando.push(fn); carregar(); } },
		visor: visor, aviso: aviso, boletim: boletim, estado: estado,
		get dados() { return dados; }
	};
	// os dados guardados há menos de 15 minutos valem; senão, pede de novo à NOAA
	try { var g = JSON.parse(localStorage.getItem('tempoDoSol') || 'null'); if (g && Date.now() - g.quando < VALIDADE) dados = g; } catch (e) {}
	if (!dados && window.fetch) carregar();
	if (!window.fetch) dados = { semSinal: true, quando: Date.now() };
})();
