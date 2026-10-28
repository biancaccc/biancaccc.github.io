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
		var motivos = [];
		if (/^[MX]/.test(max)) motivos.push('explosão classe ' + max + ' nas últimas horas');
		/* (a escala G oficial da NOAA vale mais; sem ela, a conta pelo Kp: 5 = G1, 6 = G2 ... 9 = G5) */
		var g = esc.G >= 1 ? esc.G : kp !== null && kp >= 5 ? Math.min(5, Math.floor(kp) - 4) : 0;
		if (g) motivos.push('tempestade geomagnética G' + g + (kp !== null ? ' (Kp ' + kpTexto(kp) + ')' : ''));
		if (esc.R >= 1) motivos.push('apagão de rádio R' + esc.R + ' no lado da Terra virado para o Sol');
		if (esc.S >= 1) motivos.push('tempestade de partículas S' + esc.S);
		return { agitado: motivos.length > 0, motivos: motivos, kp: kp, aurora: kp !== null && kp >= 5, auroraLonge: kp !== null && kp >= 7 };
	}

	// as linhas do visor da cabine (3 linhas de até 13 letras), passando de página em página
	function kpTexto(kp) { return kp.toFixed(1).replace('.', ','); }
	function visor(t) {
		var ciano = '#7fe3ff', verde = '#7dffa8', branco = '#dfffe8', laranja = '#ffb860', vermelho = '#ff6a5a';
		if (!dados) return { linhas: [['TEMPO DO SOL', ciano], ['SINTONIZANDO', branco], ['NOAA' + '...'.slice(0, Math.floor(t * 2) % 4), verde]] };
		if (dados.semSinal) return { linhas: [['TEMPO DO SOL', ciano], ['SEM SINAL', laranja], ['DA NOAA', branco]] };
		var e = estado(), paginas = [];
		if (e.agitado) paginas.push({ linhas: [['ALERTA SOLAR', vermelho], [e.motivos[0].indexOf('explos') === 0 ? 'EXPLOSAO ' + dados.raioXMax.classe : e.motivos[0].indexOf('tempestade geo') === 0 ? 'TEMPESTADE G' + e.motivos[0].split(' G')[1].charAt(0) : e.motivos[0].indexOf('apag') === 0 ? 'APAGAO RADIO' : 'PARTICULAS', laranja], [e.aurora ? 'AURORA: SIM' : 'NOAA AO VIVO', branco]], alerta: true });
		if (dados.vento) paginas.push({ linhas: [['VENTO SOLAR', ciano], [Math.round(dados.vento.v) + ' KM/S', branco], [dados.bz ? 'BZ ' + dados.bz.v.toFixed(1) + ' NT' : 'NOAA AO VIVO', verde]] });
		if (dados.raioX) paginas.push({ linhas: [['RAIOS X', ciano], ['CLASSE ' + dados.raioX.classe, /^[MX]/.test(dados.raioX.classe) ? laranja : branco], ['GOES', verde]] });
		if (e.kp !== null) paginas.push({ linhas: [['INDICE KP ' + e.kp.toFixed(1), ciano], [e.kp >= 5 ? 'TEMPESTADE' : e.kp >= 4 ? 'AGITADO' : 'CALMO', e.kp >= 5 ? laranja : branco], ['AURORA: ' + (e.aurora ? 'SIM' : 'NAO'), verde]] });
		if (dados.manchas) paginas.push({ linhas: [['MANCHAS', ciano], [dados.manchas.v + ' NO MES', branco], ['NOAA', verde]] });
		if (!paginas.length) return { linhas: [['TEMPO DO SOL', ciano], ['SEM SINAL', laranja], ['DA NOAA', branco]] };
		var p = paginas[Math.floor(t / 3.5) % paginas.length];
		return { linhas: p.linhas, alerta: !!p.alerta, agitado: e.agitado };
	}

	// a frase do computador de bordo quando o Sol está agitado de verdade (ou null)
	function aviso() {
		var e = estado();
		if (!e || !e.agitado) return null;
		var f = 'Atenção: o Sol está agitado agora, de verdade. ' + e.motivos[0].charAt(0).toUpperCase() + e.motivos[0].slice(1) + ', segundo a NOAA.';
		if (e.auroraLonge) f += ' Tem aurora até em latitudes médias na Terra!';
		else if (e.aurora) f += ' Tem aurora perto dos polos da Terra!';
		return f;
	}
	// o boletim curto para o rádio e para a torre
	function boletim() {
		var e = estado();
		if (!e) return null;
		var partes = [];
		if (dados.vento) partes.push('vento solar a ' + Math.round(dados.vento.v) + ' km/s');
		if (e.kp !== null) partes.push('Kp ' + kpTexto(e.kp));
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
