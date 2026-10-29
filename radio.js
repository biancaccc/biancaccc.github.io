// Rádio da nave: cada lugar da viagem tem a sua estação, composta a partir da cor,
// do jeito e da história daquele lugar.
// Nenhum arquivo de áudio: toda música é gerada na hora pelo navegador (Web Audio),
// juntando camadas: um acorde de fundo ("pad"), ruído (vento, mar, plasma), melodias
// tocadas por "instrumentos" sintetizados, batidas e pequenos acontecimentos
// (bolhas, estrelas cadentes, código Morse, explosões solares…).
// Começa sempre desligado, só aparece depois da decolagem e, ligado, continua ligado
// de página em página durante a visita.
(function () {
	'use strict';
	var AC = window.AudioContext || window.webkitAudioContext;
	if (!AC) return;

	var MAIOR = [0, 2, 4, 5, 7, 9, 11], MENOR = [0, 2, 3, 5, 7, 8, 10], MAIOR_PENTA = [0, 2, 4, 7, 9], MENOR_PENTA = [0, 3, 5, 7, 10];
	var LIDIO = [0, 2, 4, 6, 7, 9, 11], DORICO = [0, 2, 3, 5, 7, 9, 10], FRIGIO = [0, 1, 3, 5, 7, 8, 10], MENOR_HARM = [0, 2, 3, 5, 7, 8, 11];
	var EGIPCIA = [0, 1, 4, 5, 7, 8, 10]; // (o "hijaz", com aquele salto do 2 para o 3: soa como o Egito antigo)

	// Cada estação: nome, frequência no visor, raiz (Hz) e escala; depois as camadas.
	// Nas melodias, cada nota é [grau da escala, duração em tempos]; grau null é pausa.
	// A frequência das estações dos planetas é a duração do ano daquele planeta (em dias).
	var ESTACOES = {
		// Via Láctea: grande, acolhedora, de encher os olhos. Arpejo que sobe e desce como os braços
		// da espiral, e de vez em quando uma estrela cadente atravessa de um ouvido para o outro.
		'index': { nome: 'Rádio Via Láctea', freq: '88,1', nota: 'Música para atravessar a galáxia', raiz: 146.83, escala: MAIOR,
			pad: { onda: 'triangle', corte: 900, vol: 0.45, giro: 0.03 },
			melodias: [{ inst: 'sino', bpm: 66, oitava: 2, vol: 0.07, padrao: [[0, 1], [2, 1], [4, 1], [7, 1], [9, 1], [7, 1], [4, 1], [2, 1]], pausa: 4, variar: 0.4 }],
			eventos: [{ tipo: 'cadente', cada: 11 }], eco: 0.4 },

		// Sagittarius A*: pesado, escuro, misterioso. Um coração enorme que bate cada vez mais
		// devagar (o tempo anda mais lento perto do buraco negro), notas que "caem" para o grave
		// e o zumbido do anel de luz girando em volta da sua cabeça, de um ouvido para o outro.
		'sagitario-a': { nome: 'Rádio Horizonte', freq: '26,7', nota: 'O tempo anda mais devagar perto do buraco negro', raiz: 55, escala: MENOR,
			pad: { onda: 'sawtooth', corte: 220, vol: 0.55, lfo: 0.03 }, ruido: { corte: 160, vol: 0.32 },
			pulso: { bpm: 46, freq: 44, vol: 0.85, duplo: true, desacelera: true },
			anel: { grau: 4, oitava: 4, vol: 0.05, giro: 0.12 }, // uns 330 Hz: zumbido grave, sem agulhar o ouvido
			sub: { freq: 55, vol: 0.5 }, // o grave bem forte, que vai e volta como uma onda de gravidade
			melodias: [{ inst: 'sino', bpm: 36, oitava: 4, vol: 0.06, cai: true, semBrilho: true, padrao: [[4, 2], [3, 2], [0, 4], [null, 2], [6, 2], [4, 4]], pausa: 6 }],
			eco: 0.6 },

		// Bolhas de Fermi: magenta, enérgica, explosiva. Uma batida animada, arpejos rápidos
		// que pulam de um lado para o outro (as duas bolhas) e bolhinhas subindo o tempo todo.
		'fermi': { nome: 'Raio Gama FM', freq: '101,9', nota: 'Duas bolhas gigantes, uma de cada lado', raiz: 98, escala: [0, 2, 4, 6, 8, 10],
			pad: { onda: 'sawtooth', corte: 1100, vol: 0.28, lfo: 0.25 },
			bateria: { bpm: 112, bumbo: [0, 2.5], chimbal: 0.5, vol: 0.45 },
			melodias: [
				{ inst: 'beep', bpm: 112, oitava: 4, vol: 0.035, pan: -0.7, padrao: [[0, 0.25], [2, 0.25], [4, 0.25], [6, 0.25], [4, 0.25], [2, 0.25], [null, 0.5]], pausa: 2, variar: 0.5 },
				{ inst: 'beep', bpm: 112, oitava: 4, vol: 0.035, pan: 0.7, atraso: 2, padrao: [[6, 0.25], [4, 0.25], [2, 0.25], [0, 0.25], [2, 0.25], [4, 0.25], [null, 0.5]], pausa: 2, variar: 0.5 }],
			eventos: [{ tipo: 'bolhas', cada: 0.35, vol: 0.05 }, { tipo: 'estalos', cada: 0.25, vol: 0.09 }], eco: 0.35 },

		// Órion: rosa e verde-azulado, um berçário. Um coro suave, uma canção de ninar em
		// caixinha de música (em três tempos, de embalar) e o brilho das quatro estrelas do Trapézio.
		'orion': { nome: 'Berçário FM', freq: '134,4', nota: 'Uma canção de ninar para estrelas recém-nascidas', raiz: 130.81, escala: LIDIO,
			pad: { onda: 'coro', corte: 900, vol: 0.5, ondula: true },
			melodias: [{ inst: 'caixinha', bpm: 80, oitava: 2, vol: 0.08, padrao: [[4, 1], [2, 1], [4, 1], [5, 2], [4, 1], [2, 2], [1, 1], [0, 3], [2, 1], [4, 1], [6, 1], [7, 2], [6, 1], [4, 3]], pausa: 3 }],
			eventos: [{ tipo: 'trapezio', cada: 9 }], eco: 0.45 },

		// Plêiades: azul, jovem, brincalhona. Uma conversa entre irmãs, em frases de sete notas
		// (as Sete Irmãs): uma pergunta (termina "em aberto"), a outra responde (termina em casa);
		// a primeira pergunta de novo, mais agudo, e na última resposta as duas cantam juntas,
		// uma imitando a outra. Por baixo, um contraponto de notas longas anda no sentido contrário,
		// e um eco agudinho repete o fim de cada frase. A cada volta, as irmãs trocam de lado.
		'pleiades': { nome: 'Rádio Sete Irmãs', freq: '44,4', nota: 'Uma conversa cantada entre sete irmãs', raiz: 196, escala: MAIOR_PENTA,
			pad: { onda: 'sine', corte: 800, vol: 0.3 },
			melodias: [{ bpm: 120, ciclo: 28, pausa: 2, trocaLados: true, vozes: [
				// a irmã que pergunta (esquerda)
				{ inst: 'caixinha', oitava: 2, vol: 0.08, pan: -0.65, inicio: 0, variar: 0.25, padrao: [[0, 1], [2, 1], [4, 1], [5, 1], [4, 1], [2, 1], [3, 1]] },
				{ inst: 'caixinha', oitava: 2, vol: 0.08, pan: -0.65, inicio: 14, variar: 0.25, padrao: [[5, 1], [4, 1], [5, 1], [7, 1], [6, 1], [5, 1], [4, 1]] },
				// a irmã que responde (direita), com o timbre de sino
				{ inst: 'sino', oitava: 2, vol: 0.07, pan: 0.65, inicio: 7, padrao: [[4, 1], [3, 1], [2, 1], [1, 1], [2, 1], [1, 1], [0, 1]] },
				{ inst: 'sino', oitava: 2, vol: 0.07, pan: 0.65, inicio: 21, padrao: [[7, 1], [6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [0, 1]] },
				// na última resposta, a primeira irmã entra junto, imitando um tempo depois e mais grave
				{ inst: 'caixinha', oitava: 2, vol: 0.055, pan: -0.65, inicio: 22, padrao: [[5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [0, 1]] },
				// contraponto: notas longas, sempre andando ao contrário da melodia
				{ inst: 'sino', oitava: 1, vol: 0.045, pan: 0, inicio: 0, padrao: [[5, 3.5], [4, 3.5], [2, 3.5], [3, 3.5], [2, 3.5], [1, 3.5], [3, 3.5], [0, 3.5]] },
				// eco agudinho repetindo o finzinho de cada frase, do outro lado
				{ inst: 'caixinha', oitava: 8, vol: 0.022, pan: 0.4, inicio: 6.5, chance: 0.8, padrao: [[2, 0.25], [3, 0.25], [null, 6.5], [1, 0.25], [0, 0.25], [null, 6.5], [5, 0.25], [4, 0.25], [null, 6.5], [2, 0.25], [0, 0.5]] }] }],
			eco: 0.3 },

		// Hélice: o "Olho de Deus", a morte de uma estrela, contada como algo mágico em vez de
		// triste: um coro numa escala clara, sininhos respondendo, um sino distante e brilhos
		// de poeira de estrela, o gás que ela vai soltando pelo espaço.
		'helice': { nome: 'Rádio Olho de Deus', freq: '65,0', nota: 'A morte de uma estrela, que vira um olho colorido no céu', raiz: 116.54, escala: LIDIO,
			pad: { onda: 'triangle', corte: 900, vol: 0.4, ondula: true }, ruido: { tipo: 'bandpass', corte: 900, vol: 0.05, vento: 0.06 },
			melodias: [
				{ inst: 'coro', bpm: 56, oitava: 2, vol: 0.1, padrao: [[0, 2], [2, 1], [4, 1], [6, 3], [4, 1], [7, 4]], pausa: 6 },
				{ inst: 'caixinha', bpm: 56, oitava: 4, vol: 0.05, atraso: 4, padrao: [[7, 1], [6, 1], [4, 1], [2, 1], [4, 4]], pausa: 10 }],
			eventos: [{ tipo: 'toque', cada: 12, grau: 4, oitava: 4, vol: 0.06 }, { tipo: 'brilhos', cada: 8 }], eco: 0.65 },

		// Tabby: laranja, curiosa, misteriosa. Um teremim de filme de ficção científica antigo,
		// um sinal em código Morse que diz "OLÁ?" e o rádio que some sem aviso, como o brilho dela.
		'tabby': { nome: 'Sinal Misterioso', freq: '147,0', nota: 'Extraterrestres ou poeira? O sinal some de vez em quando…', raiz: 110, escala: [0, 1, 4, 6, 7, 10],
			pad: { onda: 'triangle', corte: 700, vol: 0.4 },
			melodias: [{ inst: 'teremim', bpm: 70, oitava: 2, vol: 0.08, padrao: [[0, 2], [3, 1], [2, 1], [5, 3], [null, 1], [4, 1], [3, 1], [1, 2], [0, 4]], pausa: 4, variar: 0.5 }],
			eventos: [{ tipo: 'morse', cada: 16, texto: 'OLA?' }, { tipo: 'queda', cada: 9 }], chiado: 0.045, eco: 0.35 },

		// Omega Centauri: dourado, antiquíssimo, lotado de estrelas. Um órgão velho e grave,
		// um enxame de pinguinhos (10 milhões de estrelas) e, bem lá no fundo, o eco de uma
		// melodia de outra galáxia, a que ele talvez tenha sido um dia.
		'omega-centauri': { nome: 'Rádio 10 Milhões', freq: '170,0', nota: 'Estrelas antigas e a lembrança de uma galáxia engolida', raiz: 73.42, escala: DORICO,
			pad: { onda: 'square', corte: 520, vol: 0.32 },
			melodias: [{ inst: 'sino', bpm: 56, oitava: 4, vol: 0.035, pan: 0.4, padrao: [[0, 2], [4, 2], [3, 2], [2, 4]], pausa: 12, envio: 1 }],
			eventos: [{ tipo: 'enxame', cada: 0.11, vol: 0.022, oitava: 8 }], eco: 0.55 },

		// Betelgeuse: vermelha, enorme, no fim da vida. A estação inteira RESPIRA: um órgão grave
		// que enche e esvazia devagar, com o fôlego junto (a estrela pulsando). Por cima, um
		// lamento de metais na escala menor harmônica (aquele passo esquisito do 6 para o 7).
		// De vez em quando ela apaga (o Grande Apagão de 2019) e só uma voz continua; e às vezes
		// tudo sobe, sobe… como se ela fosse explodir, e para no último segundo: ainda não.
		'betelgeuse': { nome: 'Rádio Gigante Vermelha', freq: '55,0', nota: 'Uma estrela enorme respirando devagar, quase explodindo', raiz: 55, escala: MENOR_HARM,
			respiro: { periodo: 9, vol: 0.3 }, sub: { freq: 27.5, vol: 0.35 },
			melodias: [
				{ inst: 'metal', bpm: 44, oitava: 2, vol: 0.045, pan: -0.15, padrao: [[4, 2], [5, 1], [6, 1], [7, 4], [null, 1], [6, 1], [5, 1], [4, 2], [3, 1], [2, 1], [1, 2], [0, 5]], pausa: 7, variar: 0.3 },
				{ inst: 'coro', bpm: 44, oitava: 2, vol: 0.06, pan: 0.3, atraso: 14, padrao: [[0, 6], [-1, 4], [0, 8]], pausa: 18, chance: 0.6 }],
			eventos: [{ tipo: 'apagao', cada: 30 }, { tipo: 'quaseSupernova', cada: 52 }], eco: 0.5 },

		// Eta Carinae: duas gigantes numa órbita esticada de 5,5 anos, conversando. A grande fala
		// grave, de um lado; a menor responde uma oitava acima, do outro (vozes de teremim, que
		// deslizam de uma nota para a outra). Elas se revezam: pergunta, resposta, pergunta… e no
		// fim falam juntas, em oitavas, como no periastro, quando passam pertinho. Por baixo, as
		// duas estrelas dão voltas em volta da cabeça e, no encontro, os raios X estalam. De vez
		// em quando, a Grande Erupção de 1843: os dois lobos do Homúnculo inflando até o estrondo.
		'eta-carinae': { nome: 'Rádio Homúnculo', freq: '75,0', nota: 'Duas estrelas gigantes conversando, e uma erupção que ainda ecoa', raiz: 87.31, escala: FRIGIO,
			pad: { onda: 'coro', corte: 800, vol: 0.22, ondula: true, acordes: [[0, 2, 4], [1, 3, 5], [0, 2, 4], [-1, 1, 4]] },
			dupla: { periodo: 11, vol: 0.07 },
			melodias: [{ bpm: 72, ciclo: 30, pausa: 4, vozes: [
				// a grande pergunta…
				{ inst: 'teremim', oitava: 2, vol: 0.06, pan: -0.55, inicio: 0, padrao: [[0, 1], [2, 1], [4, 2], [3, 1], [2, 3]], variar: 0.25 },
				// …a menor responde, uma oitava acima…
				{ inst: 'teremim', oitava: 4, vol: 0.045, pan: 0.55, inicio: 8, padrao: [[2, 1], [3, 1], [4, 2], [5, 1], [4, 3]], variar: 0.25 },
				// …a grande de novo, descendo…
				{ inst: 'teremim', oitava: 2, vol: 0.06, pan: -0.55, inicio: 16, padrao: [[4, 1], [3, 1], [1, 2], [0, 2]] },
				// …a menor concorda, no meio da frase dela…
				{ inst: 'teremim', oitava: 4, vol: 0.04, pan: 0.55, inicio: 18, padrao: [[1, 2], [0, 2]] },
				// …e no fim as duas juntas, em oitavas (o encontro)
				{ inst: 'teremim', oitava: 2, vol: 0.05, pan: -0.55, inicio: 23, padrao: [[1, 1], [0, 5]] },
				{ inst: 'teremim', oitava: 4, vol: 0.04, pan: 0.55, inicio: 23, padrao: [[1, 1], [0, 5]] }] }],
			eventos: [{ tipo: 'grandeErupcao', cada: 36 }, { tipo: 'brilhos', cada: 13 }], eco: 0.6 },

		// Sirius: a estrela mais brilhante do céu, pertinho de casa. Uma caixinha de música
		// cintilando e dando voltas na cabeça (Sirius piscando em cores), uma harpa na escala
		// egípcia (no Egito antigo, Sirius anunciava a cheia do Nilo, que corre baixinho no fundo)
		// e, quase escondida no brilho, uma vozinha bem fraca e aguda lá do lado: Sirius B. De vez
		// em quando, lá longe, um latido: ela é a Estrela do Cão.
		'sirius': { nome: 'Rádio Estrela do Cão', freq: '86,0', nota: 'A estrela mais brilhante do céu, e a companheira escondida no clarão', raiz: 110, escala: EGIPCIA,
			pad: { onda: 'triangle', corte: 2200, vol: 0.28, acordes: [[0, 2, 4], [-1, 1, 3], [0, 2, 4], [3, 5, 7]] }, mar: 0.05,
			melodias: [
				{ inst: 'caixinha', bpm: 92, oitava: 4, vol: 0.05, giro: 0.2, padrao: [[4, 1], [5, 1], [4, 1], [2, 1], [1, 2], [0, 2], [null, 1], [2, 1], [4, 1], [7, 3]], pausa: 3, variar: 0.4 },
				{ inst: 'pluck', bpm: 92, oitava: 2, vol: 0.05, pan: -0.3, padrao: [[0, 1], [null, 1], [4, 1], [null, 1], [3, 1], [1, 1], [0, 2]] },
				{ inst: 'sino', bpm: 92, oitava: 8, vol: 0.014, pan: 0.75, atraso: 9, padrao: [[0, 1], [4, 2]], pausa: 14, chance: 0.7, semBrilho: true }],
			eventos: [{ tipo: 'brilhos', cada: 9 }, { tipo: 'latido', cada: 38 }], eco: 0.45 },

		// Nebulosa do Caranguejo: o pulsar é o metrônomo da estação, um "tic" agudo que nunca
		// atrasa (ele é um dos relógios mais certinhos do universo), e um zumbido que dá voltas em
		// volta da cabeça, como o feixe do farol girando. Por cima, um teremim misterioso em menor,
		// a nuvem de fiapos num órgão escuro e, de vez em quando, a "estrela convidada" de 1054:
		// um estrondo, um acorde brilhante que demora para apagar.
		'caranguejo': { nome: 'Rádio Pulsar', freq: '105,4', nota: 'Um farol de nêutrons girando no meio dos restos de uma supernova', raiz: 73.42, escala: MENOR,
			pad: { onda: 'sawtooth', corte: 650, vol: 0.32, lfo: 0.06, acordes: [[0, 2, 4], [-2, 0, 2], [-3, -1, 2], [-1, 1, 4]] },
			anel: { grau: 0, oitava: 4, vol: 0.035, giro: 0.5 },
			melodias: [
				{ inst: 'tique', bpm: 120, oitava: 32, vol: 0.03, padrao: [[0, 1]], envio: 0.15 },
				{ inst: 'teremim', bpm: 60, oitava: 4, vol: 0.045, pan: -0.2, atraso: 4, padrao: [[0, 2], [2, 1], [4, 3], [3, 1], [2, 1], [1, 2], [0, 4]], pausa: 8, variar: 0.35 }],
			eventos: [{ tipo: 'estrelaConvidada', cada: 40 }], eco: 0.5 },

		// Proxima Centauri: a vizinha mais perto, pequena e calorosa. Uma canção de ninar de
		// marimba, aconchegante, num pad quentinho; lá longe, de um lado e do outro, as duas
		// irmãs Alfa Centauri A e B tocando sininhos; de vez em quando a estrela solta uma
		// explosão de luz (estalos e um brilho que sobe) e passa uma estrela cadente.
		'proxima-centauri': { nome: 'Rádio Vizinha', freq: '42,4', nota: 'A estrela mais perto do Sol, pequena, vermelha e cheia de surpresas', raiz: 130.81, escala: MAIOR_PENTA,
			pad: { onda: 'triangle', corte: 1100, vol: 0.32, acordes: [[0, 2, 4], [1, 3, 5], [-1, 2, 4], [0, 2, 5]] },
			melodias: [
				{ inst: 'marimba', bpm: 84, oitava: 2, vol: 0.06, padrao: [[2, 1], [1, 1], [0, 2], [1, 1], [2, 1], [4, 2], [3, 1], [2, 1], [1, 1], [0, 3]], pausa: 3, variar: 0.3 },
				{ inst: 'sino', bpm: 84, oitava: 4, vol: 0.022, pan: -0.8, atraso: 6, padrao: [[4, 2], [2, 2]], pausa: 12, chance: 0.7 },
				{ inst: 'sino', bpm: 84, oitava: 4, vol: 0.02, pan: 0.8, atraso: 10, padrao: [[5, 2], [4, 2]], pausa: 12, chance: 0.7 }],
			eventos: [{ tipo: 'chama', cada: 22 }, { tipo: 'cadente', cada: 30 }], eco: 0.45 },

		// Sistema Solar: ciano, nossa casa, amigável. Um balanço gostoso e uma melodia
		// que sobe de planeta em planeta: oito notas, uma para cada um.
		'sistema-solar': { nome: 'Rádio Sol 1 UA', freq: '100,1', nota: 'Oito notas, uma para cada planeta', raiz: 130.81, escala: MAIOR,
			pad: { onda: 'triangle', corte: 1100, vol: 0.4 },
			bateria: { bpm: 92, bumbo: [0, 1.5, 2], chimbal: 0.5, vol: 0.35 },
			melodias: [{ inst: 'pluck', bpm: 92, oitava: 2, vol: 0.1, padrao: [[0, 0.5], [1, 0.5], [2, 0.5], [3, 0.5], [4, 0.5], [5, 0.5], [6, 0.5], [7, 1.5], [null, 2.5], [4, 0.5], [2, 0.5], [0, 3]], pausa: 2 }],
			eco: 0.3 },

		// Sol: amarelo, quente, poderoso. Acordes fortes de quinta, o plasma roncando e
		// explosões solares que acendem tudo de repente.
		'sol': { nome: 'Rádio Plasma', freq: '57,78', nota: '5.778 graus na superfície: o Sol ronca e explode', raiz: 65.41, escala: MAIOR,
			pad: { onda: 'sawtooth', corte: 520, vol: 0.45, acordes: [[0, 4, 7], [3, 7, 10], [4, 8, 11], [0, 4, 7]] },
			ruido: { corte: 420, vol: 0.3, vento: 0.11 },
			melodias: [{ inst: 'metal', bpm: 70, oitava: 2, vol: 0.09, padrao: [[0, 2], [4, 1], [7, 3], [null, 2], [5, 1], [4, 1], [2, 2], [4, 4]], pausa: 4 }],
			eventos: [{ tipo: 'erupcao', cada: 9 }, { tipo: 'estalos', cada: 0.35, vol: 0.07 }], eco: 0.3 },

		// Mercúrio: o planeta mais rápido, pequeno e apressado. Tudo corre!
		'mercurio': { nome: 'Rádio Mercúrio', freq: '88,0', nota: 'Um ano em Mercúrio dura só 88 dias: tudo aqui corre', raiz: 261.63, escala: MAIOR_PENTA,
			pad: { onda: 'sine', corte: 1500, vol: 0.25 },
			bateria: { bpm: 168, bumbo: [0, 2], chimbal: 0.5, vol: 0.25 },
			melodias: [{ inst: 'pluck', bpm: 168, oitava: 1, vol: 0.08, padrao: [[0, 0.5], [2, 0.5], [4, 0.5], [2, 0.5], [1, 0.5], [3, 0.5], [4, 1]], pausa: 1, variar: 0.6 }],
			eco: 0.2 },

		// Vênus: a Estrela d'Alva, linda de longe e um forno por dentro.
		//  - deusa do amor: uma melodia bonita, cantada por um coro, numa escala quente "de deserto";
		//  - gira ao contrário: logo depois de cantada, a mesma frase toca de trás para a frente
		//    (o retrógrado), com as notas crescendo do nada e sendo cortadas, como fita rebobinando;
		//  - 465 °C: o fundo ondula como a miragem do asfalto quente;
		//  - pressão 90 vezes a da Terra: um grave pesado e abafado por baixo de tudo;
		//  - chuva de ácido que evapora antes de chegar ao chão: gotinhas que caem e somem no caminho;
		//  - raios nas nuvens de ácido: um estalo distante e um trovão grave, de vez em quando.
		'venus': { nome: 'Rádio Vênus', freq: '224,7', nota: 'A Estrela d\'Alva: linda de longe, um forno por dentro, e girando ao contrário', raiz: 82.41,
			escala: [0, 1, 4, 5, 7, 8, 10],
			pad: { onda: 'sawtooth', corte: 480, vol: 0.36, miragem: 22, lfo: 0.05 },
			sub: { freq: 41.2, vol: 0.3 },
			ruido: { corte: 600, vol: 0.1, vento: 0.05 },
			melodias: [{ bpm: 60, ciclo: 24, pausa: 4, vozes: [
				// a deusa canta a frase...
				{ inst: 'coro', oitava: 2, vol: 0.1, pan: -0.25, inicio: 0, padrao: [[4, 2], [5, 1], [4, 1], [2, 2], [1, 1], [2, 1], [0, 4]] },
				// ...e Vênus, girando ao contrário, devolve a mesma frase de trás para a frente
				{ inst: 'reverso', oitava: 2, vol: 0.11, pan: 0.25, inicio: 12, padrao: [[0, 4], [2, 1], [1, 1], [2, 2], [4, 1], [5, 1], [4, 2]] },
				// notas longas e graves, sustentando o peso da atmosfera
				{ inst: 'coro', oitava: 1, vol: 0.06, inicio: 0, padrao: [[0, 12], [3, 6], [1, 6]] }] }],
			eventos: [{ tipo: 'chuvaAcida', cada: 3.5 }, { tipo: 'relampago', cada: 12 }], eco: 0.5 },

		// Terra: azul e verde, viva. A natureza vem na frente: mar, vento nas folhas, um riacho
		// pingando, grilos e vários passarinhos (sabiá, bem-te-vi e pardais); o violão fica de fundo,
		// junto com os assobios de rádio que a Terra faz de verdade.
		'terra': { nome: 'Rádio Terra', freq: '365,2', nota: 'Mar, mata, passarinhos e os assobios de rádio da própria Terra', raiz: 146.83, escala: MAIOR,
			pad: { onda: 'triangle', corte: 850, vol: 0.28 }, mar: 0.22,
			ruido: { tipo: 'bandpass', corte: 1700, vol: 0.05, vento: 0.07 }, // vento nas folhas
			melodias: [{ inst: 'pluck', bpm: 84, oitava: 2, vol: 0.075, padrao: [[0, 1], [2, 1], [4, 2], [5, 1], [4, 1], [2, 2], [1, 1], [2, 1], [0, 2]], pausa: 6, variar: 0.3 }],
			eventos: [{ tipo: 'passaros', cada: 2.6 }, { tipo: 'grilos', cada: 1.6 }, { tipo: 'gotas', cada: 0.7 }, { tipo: 'assobio', cada: 16 }], eco: 0.3 },

		// Marte: vermelho e poeirento, mas com um robozinho alegre explorando: uma marimba
		// saltitante, vento do deserto bem de leve e os bipes do robô passeando por lá.
		'marte': { nome: 'Rádio Marte', freq: '687,0', nota: 'Um deserto vermelho com um robozinho passeando', raiz: 92.5, escala: MAIOR_PENTA,
			pad: { onda: 'triangle', corte: 560, vol: 0.4 }, ruido: { tipo: 'bandpass', corte: 600, vol: 0.1, vento: 0.06 },
			melodias: [
				{ inst: 'marimba', bpm: 84, oitava: 2, vol: 0.09, padrao: [[0, 1], [2, 1], [4, 2], [3, 1], [2, 1], [0, 2]], pausa: 3 },
				{ inst: 'beep', bpm: 140, oitava: 8, vol: 0.025, pan: 0.5, atraso: 4, chance: 0.9, padrao: [[0, 0.5], [2, 0.5], [4, 0.25], [4, 0.25], [5, 1]], pausa: 8 }],
			eco: 0.5 },

		// Júpiter: o rei dos planetas, enorme e tempestuoso. Metais graves numa marcha imponente,
		// a tempestade da Grande Mancha Vermelha girando e os assobios de rádio que a sonda Juno gravou.
		'jupiter': { nome: 'Rádio Júpiter', freq: '433,3', nota: 'O rei dos planetas, com tempestades e assobios de rádio', raiz: 55, escala: MAIOR,
			pad: { onda: 'sawtooth', corte: 320, vol: 0.45, giro: 0.08 }, ruido: { corte: 300, vol: 0.25, vento: 0.05 },
			bateria: { bpm: 60, bumbo: [0, 2], vol: 0.6 },
			melodias: [{ inst: 'metal', bpm: 60, oitava: 2, vol: 0.12, padrao: [[0, 2], [4, 1], [7, 1], [9, 2], [7, 2], [5, 1], [4, 1], [2, 2], [0, 4]], pausa: 4 }],
			eventos: [{ tipo: 'assobio', cada: 4 }], eco: 0.4 },

		// Saturno: dourado e elegante. Uma valsa (três tempos) com sininhos que dão a volta
		// em você, como os anéis.
		'saturno': { nome: 'Rádio Anéis', freq: '107,6', nota: 'Uma valsa para os anéis', raiz: 110, escala: [0, 2, 4, 7, 9, 11],
			pad: { onda: 'sine', corte: 900, vol: 0.38 },
			bateria: { bpm: 96, bumbo: [0], chimbal: 1, compasso: 3, vol: 0.25 },
			melodias: [{ inst: 'sino', bpm: 96, oitava: 4, vol: 0.05, giro: 0.15, padrao: [[0, 1], [2, 1], [3, 1], [5, 1], [3, 1], [2, 1], [4, 1], [6, 1], [8, 1], [6, 3]], pausa: 3 }],
			eco: 0.55 },

		// Urano: gelado, quieto e esquisito (gira deitado). Sininhos de gelo numa melodia
		// de cabeça para baixo, em cinco tempos, que nunca cai onde a gente espera.
		'urano': { nome: 'Rádio Urano', freq: '306,9', nota: 'Um gigante de gelo que gira deitado', raiz: 164.81, escala: [0, 2, 7, 9],
			pad: { onda: 'sine', corte: 1600, vol: 0.35 }, ruido: { tipo: 'bandpass', corte: 3000, vol: 0.05 },
			melodias: [{ inst: 'caixinha', bpm: 70, oitava: 4, vol: 0.05, padrao: [[7, 1], [5, 1], [6, 2], [3, 1], [4, 1], [2, 1], [3, 2], [0, 1]], pausa: 5, variar: 0.4 }],
			eco: 0.6 },

		// Netuno: azul-escuro, o mais longe e o mais ventoso. Ventos uivando e um canto
		// distante e solitário, com muito eco.
		'netuno': { nome: 'Rádio Netuno', freq: '601,9', nota: 'Os ventos mais rápidos do Sistema Solar, bem longe de casa', raiz: 61.74, escala: MENOR,
			pad: { onda: 'sawtooth', corte: 380, vol: 0.45 }, ruido: { tipo: 'bandpass', corte: 600, vol: 0.32, vento: 0.13 },
			melodias: [{ inst: 'coro', bpm: 54, oitava: 4, vol: 0.09, padrao: [[0, 3], [2, 1], [3, 2], [4, 2], [3, 4]], pausa: 8 }],
			eco: 0.65 },

		// ---------- As luas (a frequência é quantos dias cada uma leva para dar uma volta no seu planeta) ----------

		// Lua: prateada, calma e silenciosa (lá não tem ar para levar som). Uma canção de ninar de caixinha
		// de música e, de vez em quando, os bipes Quindar das conversas da Apollo com a Terra.
		'lua': { nome: 'Rádio Lua Cheia', freq: '27,3', nota: 'Uma canção de ninar prateada, com os bipes das conversas da Apollo', raiz: 130.81, escala: MAIOR_PENTA,
			pad: { onda: 'sine', corte: 1200, vol: 0.3 },
			melodias: [
				{ inst: 'caixinha', bpm: 60, oitava: 4, vol: 0.06, padrao: [[4, 1], [2, 1], [0, 2], [2, 1], [4, 1], [5, 2], [4, 1], [2, 1], [1, 2], [0, 4]], pausa: 4, variar: 0.3 },
				{ inst: 'sino', bpm: 60, oitava: 2, vol: 0.04, atraso: 8, padrao: [[0, 4], [3, 4], [2, 8]], pausa: 8 }],
			eventos: [{ tipo: 'quindar', cada: 11 }], eco: 0.6 },

		// Io: explosiva e quente. Tambores graves em ritmo apressado, metais tensos numa escala
		// "dramática" e vulcões estourando o tempo todo, com a lava estalando.
		'io': { nome: 'Rádio Vulcão', freq: '1,77', nota: 'Mais de 400 vulcões, e Júpiter espremendo tudo', raiz: 73.42, escala: MENOR_HARM,
			pad: { onda: 'sawtooth', corte: 420, vol: 0.4, giro: 0.05 }, sub: { freq: 36.7, vol: 0.25 },
			bateria: { bpm: 126, bumbo: [0, 0.75, 1.5, 2.5], chimbal: 0.5, vol: 0.4 },
			melodias: [{ inst: 'metal', bpm: 126, oitava: 2, vol: 0.09, padrao: [[0, 1], [0, 0.5], [2, 0.5], [3, 1], [4, 1], [6, 0.5], [7, 1.5], [null, 1], [6, 0.5], [4, 0.5], [3, 1], [1, 1], [0, 2]], pausa: 2, variar: 0.3 }],
			eventos: [{ tipo: 'vulcao', cada: 6, vol: 0.28 }, { tipo: 'estalos', cada: 0.4, vol: 0.05 }], eco: 0.3 },

		// Europa: misteriosa e escondida, como o oceano embaixo do gelo. Tudo soa abafado, como ouvido
		// debaixo d'água: ondas lentas, bolhas subindo das fontes quentes e o gelo rangendo lá em cima.
		'europa': { nome: 'Rádio Oceano Escondido', freq: '3,55', nota: 'Um oceano inteiro embaixo do gelo, esperando para ser explorado', raiz: 98, escala: DORICO,
			pad: { onda: 'triangle', corte: 520, vol: 0.4, lfo: 0.08 }, mar: 0.16,
			melodias: [{ inst: 'sino', bpm: 50, oitava: 2, vol: 0.06, padrao: [[0, 2], [2, 1], [3, 1], [4, 3], [null, 1], [3, 1], [2, 1], [0, 4]], pausa: 6, variar: 0.3 }],
			eventos: [{ tipo: 'bolhas', cada: 0.9, vol: 0.05 }, { tipo: 'estalos', cada: 2.5, vol: 0.06 }], eco: 0.7 },

		// Ganimedes: a gigante tranquila, com ímã e auroras. Metais largos e majestosos, um teremim
		// desenhando as auroras e os assobios de rádio que a sonda Galileo gravou em volta dela.
		'ganimedes': { nome: 'Rádio Aurora Gigante', freq: '7,15', nota: 'A maior lua do Sistema Solar, com ímã próprio e auroras', raiz: 87.31, escala: LIDIO,
			pad: { onda: 'sawtooth', corte: 700, vol: 0.38, giro: 0.04 },
			melodias: [
				{ inst: 'metal', bpm: 56, oitava: 2, vol: 0.08, padrao: [[0, 2], [4, 2], [6, 2], [7, 4], [6, 1], [4, 1], [2, 2], [0, 4]], pausa: 4 },
				{ inst: 'teremim', bpm: 56, oitava: 4, vol: 0.04, pan: 0.4, atraso: 6, padrao: [[7, 3], [6, 1], [4, 2], [6, 2], [7, 4]], pausa: 10, chance: 0.8 }],
			eventos: [{ tipo: 'assobio', cada: 7 }], eco: 0.55 },

		// Titã: sonolenta e nebulosa, no meio da névoa laranja. Um coro lento e grave, gotas de metano
		// caindo devagar (umas seis vezes mais devagar que a chuva daqui) e um vento bem fraquinho.
		'tita': { nome: 'Rádio Névoa Laranja', freq: '15,95', nota: 'Chuva de metano caindo devagarinho num céu cor de laranja', raiz: 82.41, escala: MENOR,
			pad: { onda: 'sawtooth', corte: 380, vol: 0.4, lfo: 0.04 }, ruido: { tipo: 'bandpass', corte: 500, vol: 0.06, vento: 0.04 },
			melodias: [{ inst: 'coro', bpm: 46, oitava: 2, vol: 0.08, padrao: [[0, 3], [2, 2], [3, 3], [2, 2], [0, 4], [null, 2], [-1, 2], [0, 6]], pausa: 6 }],
			eventos: [{ tipo: 'gotas', cada: 1.6 }], eco: 0.65 },

		// Encélado: branquinha, delicada e cristalina. Sininhos de gelo brilhando, uma caixinha de
		// música saltitante e, de vez em quando, um gêiser soltando um jato de cristais.
		'encelado': { nome: 'Rádio Gêiser', freq: '1,37', nota: 'Jatos de gelo brilhando no polo sul de uma lua branquinha', raiz: 196, escala: MAIOR,
			pad: { onda: 'sine', corte: 2400, vol: 0.26 },
			melodias: [{ inst: 'caixinha', bpm: 100, oitava: 4, vol: 0.05, padrao: [[0, 0.5], [2, 0.5], [4, 0.5], [7, 0.5], [9, 1], [7, 0.5], [4, 0.5], [5, 1], [4, 1], [2, 2]], pausa: 3, variar: 0.4 }],
			eventos: [{ tipo: 'geiser', cada: 7, vol: 0.1 }, { tipo: 'brilhos', cada: 5 }], eco: 0.55 },

		// Mimas: pequena, engraçada e com um Pac-Man escondido. Uma musiquinha de videogame antigo,
		// toda de bipes, e um sino grave que lembra o impacto da cratera gigante.
		'mimas': { nome: 'Rádio Fliperama', freq: '0,94', nota: 'Uma lua pequena com uma cratera gigante e um Pac-Man escondido', raiz: 130.81, escala: MAIOR,
			pad: { onda: 'square', corte: 900, vol: 0.12 },
			bateria: { bpm: 132, bumbo: [0, 2], chimbal: 0.5, vol: 0.2 },
			melodias: [
				{ inst: 'beep', bpm: 132, oitava: 4, vol: 0.03, padrao: [[0, 0.5], [7, 0.5], [4, 0.5], [7, 0.5], [2, 0.5], [7, 0.5], [5, 0.5], [7, 0.5], [0, 0.5], [4, 0.5], [7, 0.5], [9, 0.5], [7, 2]], pausa: 2, variar: 0.4 },
				{ inst: 'beep', bpm: 132, oitava: 2, vol: 0.03, pan: -0.3, padrao: [[0, 1], [0, 1], [3, 1], [4, 1], [5, 1], [4, 1], [3, 1], [0, 1]], pausa: 0 }],
			eventos: [{ tipo: 'toque', cada: 16, grau: 0, oitava: 1, vol: 0.06 }], eco: 0.25 },

		// Miranda: uma colcha de retalhos. Cada pedaço da música tem um ritmo diferente que não combina
		// com o outro (como os terrenos dela), e de vez em quando um assobio cai e cai e cai (a queda de
		// 12 minutos do penhasco).
		'miranda': { nome: 'Rádio Retalhos', freq: '1,41', nota: 'Uma colcha de retalhos com o penhasco mais alto do Sistema Solar', raiz: 123.47, escala: DORICO,
			pad: { onda: 'triangle', corte: 900, vol: 0.32 },
			melodias: [
				{ inst: 'marimba', bpm: 90, oitava: 2, vol: 0.08, pan: -0.4, padrao: [[0, 1], [2, 1], [4, 1], [2, 1], [5, 1]], pausa: 1 },
				{ inst: 'caixinha', bpm: 70, oitava: 4, vol: 0.045, pan: 0.4, atraso: 3, padrao: [[7, 1.5], [6, 1], [4, 1.5], [3, 2]], pausa: 3, variar: 0.5 },
				{ inst: 'pluck', bpm: 112, oitava: 2, vol: 0.06, atraso: 7, chance: 0.7, padrao: [[0, 0.75], [3, 0.75], [1, 0.5], [4, 1]], pausa: 5 }],
			eventos: [{ tipo: 'assobio', cada: 13 }], eco: 0.45 },

		// Tritão: rebelde e geladíssima, anda na contramão. A melodia toca de trás para a frente (como a
		// volta dela em Netuno), sobre um vento gelado, e os gêiseres de nitrogênio sopram de vez em quando.
		'tritao': { nome: 'Rádio Contramão', freq: '5,88', nota: 'Uma lua do contra: gira ao contrário e solta gêiseres de nitrogênio', raiz: 69.3, escala: MENOR,
			pad: { onda: 'sawtooth', corte: 450, vol: 0.38 }, ruido: { tipo: 'bandpass', corte: 900, vol: 0.12, vento: 0.09 },
			melodias: [
				{ inst: 'reverso', bpm: 58, oitava: 4, vol: 0.08, padrao: [[4, 2], [3, 1], [2, 1], [0, 2], [2, 2], [3, 4]], pausa: 5 },
				{ inst: 'caixinha', bpm: 58, oitava: 4, vol: 0.035, pan: 0.5, atraso: 10, padrao: [[3, 1], [2, 1], [0, 2]], pausa: 12, chance: 0.7 }],
			eventos: [{ tipo: 'geiser', cada: 10, vol: 0.09, gelo: false }], eco: 0.6 }
	};

	var pagina = (location.pathname.split('/').pop() || 'index.html').replace(/\.html$/, '') || 'index';
	// em inglês: o nome e a nota de cada estação (e a vírgula da frequência vira ponto)
	var TR = window.T || function (pt) { return pt; };
	if (window.IDIOMA === 'en') {
		var INGLES = {
			'index': ['Milky Way Radio', 'Music to cross the galaxy'],
			'sagitario-a': ['Horizon Radio', 'Time runs slower near the black hole'],
			'fermi': ['Gamma Ray FM', 'Two giant bubbles, one on each side'],
			'orion': ['Nursery FM', 'A lullaby for newborn stars'],
			'pleiades': ['Seven Sisters Radio', 'A sung conversation between seven sisters'],
			'helice': ['Eye of God Radio', 'The death of a star, which becomes a colorful eye in the sky'],
			'tabby': ['Mystery Signal', 'Aliens or dust? The signal fades now and then…'],
			'omega-centauri': ['10 Million Radio', 'Ancient stars and the memory of a swallowed galaxy'],
			'betelgeuse': ['Red Giant Radio', 'A huge star breathing slowly, almost exploding'],
			'eta-carinae': ['Homunculus Radio', 'Two giant stars talking, and an eruption that still echoes'],
			'sirius': ['Dog Star Radio', 'The brightest star in the sky, and the companion hidden in its glare'],
			'caranguejo': ['Pulsar Radio', 'A neutron lighthouse spinning in the remains of a supernova'],
			'proxima-centauri': ['Neighbor Radio', 'The closest star to the Sun, small, red and full of surprises'],
			'sistema-solar': ['Sun 1 AU Radio', 'Eight notes, one for each planet'],
			'sol': ['Plasma Radio', '5,778 degrees at the surface: the Sun roars and bursts'],
			'mercurio': ['Mercury Radio', 'A year on Mercury lasts only 88 days: everything here rushes'],
			'venus': ['Venus Radio', 'The Morning Star: lovely from afar, an oven inside, and spinning backwards'],
			'terra': ['Earth Radio', 'Sea, forest, birds and the radio whistles of Earth itself'],
			'marte': ['Mars Radio', 'A red desert with a little robot roving around'],
			'jupiter': ['Jupiter Radio', 'The king of the planets, with storms and radio whistles'],
			'saturno': ['Rings Radio', 'A waltz for the rings'],
			'urano': ['Uranus Radio', 'An ice giant that spins on its side'],
			'netuno': ['Neptune Radio', 'The fastest winds in the Solar System, far from home'],
			'lua': ['Full Moon Radio', 'A silvery lullaby, with the beeps of the Apollo conversations'],
			'io': ['Volcano Radio', 'More than 400 volcanoes, and Jupiter squeezing it all'],
			'europa': ['Hidden Ocean Radio', 'A whole ocean under the ice, waiting to be explored'],
			'ganimedes': ['Giant Aurora Radio', 'The largest moon in the Solar System, with its own magnet and auroras'],
			'tita': ['Orange Haze Radio', 'Methane rain falling ever so slowly from an orange sky'],
			'encelado': ['Geyser Radio', 'Jets of ice sparkling at the south pole of a snow-white moon'],
			'mimas': ['Arcade Radio', 'A small moon with a giant crater and a hidden Pac-Man'],
			'miranda': ['Patchwork Radio', 'A patchwork quilt with the tallest cliff in the Solar System'],
			'tritao': ['Wrong-Way Radio', 'A contrary moon: it orbits backwards and blows nitrogen geysers']
		};
		Object.keys(INGLES).forEach(function (k) { var e = ESTACOES[k]; if (e) { e.nome = INGLES[k][0]; e.nota = INGLES[k][1]; e.freq = e.freq.replace(',', '.'); } });
	}
	var E = ESTACOES[pagina] || ESTACOES.index;
	var VOLUME = 0.5;

	// ---------- O som ----------
	var ctx = null, mestre = null, estacao = null, eco = null, ruidoBuf = null, timers = [], tocando = false;

	function nota(grau, oitava) {
		var n = E.escala.length, semi = E.escala[((grau % n) + n) % n] + 12 * Math.floor(grau / n);
		return E.raiz * (oitava || 1) * Math.pow(2, semi / 12);
	}
	function agendar(fn, ms) { var id = setTimeout(function () { if (tocando) fn(); }, ms); timers.push(id); }
	// repete fn com intervalos meio irregulares em volta de "media" segundos
	function repetir(media, fn) { (function prox() { agendar(function () { fn(); prox(); }, media * 1000 * (0.4 + Math.random() * 1.2)); })(); }
	function sorteio(a) { return a[Math.floor(Math.random() * a.length)]; }

	function montar() {
		ctx = new AC();
		mestre = ctx.createGain(); mestre.gain.value = 0;
		var grave = ctx.createBiquadFilter(); grave.type = 'highpass'; grave.frequency.value = 32;
		var comp = ctx.createDynamicsCompressor();
		mestre.connect(grave); grave.connect(comp); comp.connect(ctx.destination);
		estacao = ctx.createGain(); estacao.connect(mestre);
		// eco: um atraso que se repete, ficando mais abafado a cada volta
		eco = ctx.createDelay(2); eco.delayTime.value = 0.43;
		var volta = ctx.createGain(); volta.gain.value = E.eco || 0.3;
		var abafa = ctx.createBiquadFilter(); abafa.type = 'lowpass'; abafa.frequency.value = 2400;
		eco.connect(abafa); abafa.connect(volta); volta.connect(eco); abafa.connect(estacao);
		ruidoBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
		var d = ruidoBuf.getChannelData(0);
		for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
	}

	function oscilador(tipo, freq) { var o = ctx.createOscillator(); o.type = tipo; o.frequency.value = freq; return o; }
	function lfo(freq, quanto, alvo) { var o = oscilador('sine', freq), g = ctx.createGain(); g.gain.value = quanto; o.connect(g); g.connect(alvo); o.start(); return o; }
	function fonteRuido() { var s = ctx.createBufferSource(); s.buffer = ruidoBuf; s.loop = true; return s; }
	function ganho(v) { var g = ctx.createGain(); g.gain.value = v; return g; }
	function filtro(tipo, freq, q) { var f = ctx.createBiquadFilter(); f.type = tipo; f.frequency.value = freq; if (q) f.Q.value = q; return f; }
	// saída com posição esquerda/direita; "giro" faz o som dar voltas em volta da cabeça
	function saidaPan(pan, giro, destino) {
		if (!ctx.createStereoPanner) return destino;
		var p = ctx.createStereoPanner(); p.pan.value = pan || 0;
		if (giro) lfo(giro, 0.85, p.pan);
		p.connect(destino);
		return p;
	}

	// ---------- Instrumentos ----------
	// cada um toca uma nota: frequência, início (no relógio do áudio), duração, volume e saída
	function envelope(g, t, ataque, vol, fim) {
		g.gain.setValueAtTime(0.0001, t);
		g.gain.exponentialRampToValueAtTime(vol, t + ataque);
		g.gain.exponentialRampToValueAtTime(0.0001, fim);
	}
	var INSTRUMENTOS = {
		// sino: som limpo com um harmônico "metálico", e uma cauda longa
		sino: function (f, t, d, v, s, m) {
			var fim = t + Math.max(1.6, d * 2), o = oscilador('sine', f), g = ganho(0);
			envelope(g, t, 0.005, v, fim);
			if (m && m.cai) o.frequency.exponentialRampToValueAtTime(f * 0.5, fim); // a nota "cai" no buraco negro
			o.connect(g); g.connect(s);
			o.start(t); o.stop(fim + 0.05);
			if (m && m.semBrilho) return; // sem o harmônico agudo (o buraco negro fica só no grave)
			var o2 = oscilador('sine', f * 2.76), g2 = ganho(0);
			envelope(g2, t, 0.005, v * 0.25, t + 0.6);
			o2.connect(g2); g2.connect(s); o2.start(t); o2.stop(t + 0.7);
		},
		// caixinha de música: ataque bem rápido, brilho agudo, some depressa
		caixinha: function (f, t, d, v, s) {
			var fim = t + 1.1, o = oscilador('sine', f), g = ganho(0), o2 = oscilador('sine', f * 4), g2 = ganho(0);
			envelope(g, t, 0.002, v, fim); envelope(g2, t, 0.002, v * 0.18, t + 0.25);
			o.connect(g); g.connect(s); o2.connect(g2); g2.connect(s);
			o.start(t); o.stop(fim + 0.05); o2.start(t); o2.stop(t + 0.3);
		},
		// violão: corda beliscada, com o filtro fechando logo depois do ataque
		pluck: function (f, t, d, v, s) {
			var fim = t + d * 0.9 + 0.35, o = oscilador('triangle', f), o2 = oscilador('sawtooth', f), fl = filtro('lowpass', 3200), g = ganho(0), g2 = ganho(0.3);
			fl.frequency.setValueAtTime(3200, t); fl.frequency.exponentialRampToValueAtTime(500, t + 0.3);
			envelope(g, t, 0.004, v, fim);
			o.connect(fl); o2.connect(g2); g2.connect(fl); fl.connect(g); g.connect(s);
			o.start(t); o.stop(fim + 0.05); o2.start(t); o2.stop(fim + 0.05);
		},
		// bipe de robô ou de rádio
		beep: function (f, t, d, v, s) {
			var fim = t + d * 0.8, o = oscilador('square', f), fl = filtro('lowpass', 2600), g = ganho(0);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.005); g.gain.setValueAtTime(v, fim - 0.01); g.gain.linearRampToValueAtTime(0, fim);
			o.connect(fl); fl.connect(g); g.connect(s); o.start(t); o.stop(fim + 0.02);
		},
		// teremim: desliza de uma nota para a outra, com vibrato (filme de ficção científica antigo)
		teremim: function (f, t, d, v, s, m) {
			var fim = t + d, o = oscilador('sine', f), g = ganho(0);
			o.frequency.setValueAtTime(m._ultima || f, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.14);
			m._ultima = f;
			var vib = oscilador('sine', 5.5), vg = ganho(f * 0.012); vib.connect(vg); vg.connect(o.frequency);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.08); g.gain.setValueAtTime(v, fim - 0.05); g.gain.linearRampToValueAtTime(0, fim + 0.15);
			o.connect(g); g.connect(s); o.start(t); o.stop(fim + 0.2); vib.start(t); vib.stop(fim + 0.2);
		},
		// coro: duas ondas desafinadas passando por filtros que imitam a vogal "aah"
		coro: function (f, t, d, v, s) {
			var fim = t + d, g = ganho(0), mix = ganho(1);
			[-8, 8].forEach(function (cents) { var o = oscilador('sawtooth', f); o.detune.value = cents; o.connect(mix); o.start(t); o.stop(fim + 1); });
			[[730, 6], [1090, 8], [2440, 10]].forEach(function (fm) { var b = filtro('bandpass', fm[0], fm[1]); mix.connect(b); b.connect(g); });
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 3, t + 0.5); g.gain.setValueAtTime(v * 3, fim); g.gain.linearRampToValueAtTime(0, fim + 0.9);
			g.connect(s);
		},
		// metais: o filtro abre como um trompete soprando
		metal: function (f, t, d, v, s) {
			var fim = t + d, o = oscilador('sawtooth', f), o2 = oscilador('sawtooth', f * 1.003), fl = filtro('lowpass', 300, 2), g = ganho(0);
			fl.frequency.setValueAtTime(300, t); fl.frequency.exponentialRampToValueAtTime(2200, t + 0.12); fl.frequency.exponentialRampToValueAtTime(900, t + 0.5);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.07); g.gain.setValueAtTime(v * 0.8, fim - 0.05); g.gain.linearRampToValueAtTime(0, fim + 0.3);
			o.connect(fl); o2.connect(fl); fl.connect(g); g.connect(s);
			o.start(t); o.stop(fim + 0.35); o2.start(t); o2.stop(fim + 0.35);
		},
		// de trás para a frente: a nota nasce do nada, cresce e é cortada de repente
		reverso: function (f, t, d, v, s) {
			var fim = t + d, o = oscilador('triangle', f), o2 = oscilador('sine', f * 2), g = ganho(0), g2 = ganho(0.3);
			g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, fim - 0.02); g.gain.linearRampToValueAtTime(0, fim);
			o.connect(g); o2.connect(g2); g2.connect(g); g.connect(s);
			o.start(t); o.stop(fim + 0.02); o2.start(t); o2.stop(fim + 0.02);
		},
		// marimba: madeira batida, redondinha e alegre
		marimba: function (f, t, d, v, s) {
			var fim = t + 0.6, o = oscilador('sine', f), g = ganho(0), o2 = oscilador('sine', f * 4), g2 = ganho(0), o3 = oscilador('triangle', f * 2), g3 = ganho(0);
			envelope(g, t, 0.002, v, fim); envelope(g2, t, 0.001, v * 0.35, t + 0.04); envelope(g3, t, 0.002, v * 0.15, t + 0.15);
			o.connect(g); g.connect(s); o2.connect(g2); g2.connect(s); o3.connect(g3); g3.connect(s);
			o.start(t); o.stop(fim + 0.05); o2.start(t); o2.stop(t + 0.06); o3.start(t); o3.stop(t + 0.2);
		},
		// tique: um estalinho agudo e seco, como o ponteiro de um relógio (o pulsar)
		tique: function (f, t, d, v, s) {
			var o = oscilador('sine', f), g = ganho(0);
			envelope(g, t, 0.001, v, t + 0.025);
			o.connect(g); g.connect(s); o.start(t); o.stop(t + 0.03);
		},
		// bolha: um "blup" que sobe
		bolha: function (f, t, d, v, s) {
			var o = oscilador('sine', f), g = ganho(0);
			o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 3, t + 0.12);
			envelope(g, t, 0.01, v, t + 0.16);
			o.connect(g); g.connect(s); o.start(t); o.stop(t + 0.2);
		}
	};

	// ---------- Camadas ----------
	// pad: um acorde que muda devagar, com o filtro "respirando"
	function camadaPad(p) {
		var g = ganho(p.vol), saida = saidaPan(0, p.giro, estacao), alvoFiltro;
		g.connect(saida);
		var entrada;
		if (p.onda === 'coro') {
			// coro de fundo: as vozes passam pelos filtros da vogal "aah"
			entrada = ganho(1);
			[[730, 5], [1090, 7]].forEach(function (fm) { var b = filtro('bandpass', fm[0], fm[1]); entrada.connect(b); b.connect(g); });
			g.gain.value = p.vol * 2.4;
			alvoFiltro = null;
		} else {
			entrada = filtro('lowpass', p.corte, 0.8);
			entrada.connect(g);
			alvoFiltro = entrada.frequency;
		}
		if (alvoFiltro) lfo(p.lfo || 0.08, p.corte * 0.45, alvoFiltro);
		if (p.ondula) lfo(0.05, (p.onda === 'coro' ? p.vol * 2.4 : p.vol) * 0.4, g.gain);
		var acordes = p.acordes || [[0, 2, 4], [1, 3, 5], [-1, 2, 4], [0, 3, 5]], qual = 0, vozes = [];
		var onda = p.onda === 'coro' ? 'sawtooth' : p.onda;
		acordes[0].forEach(function (grau) {
			[-7, 7].forEach(function (desafina) {
				var o = oscilador(onda, nota(grau)), gv = ganho(0.16);
				o.detune.value = desafina;
				if (p.miragem) lfo(0.18 + Math.random() * 0.15, p.miragem, o.detune); // o ar quente ondulando (Vênus)
				o.connect(gv); gv.connect(entrada); o.start();
				vozes.push(o);
			});
		});
		repetir(10, function () {
			qual = (qual + 1) % acordes.length;
			vozes.forEach(function (o, i) { o.frequency.setTargetAtTime(nota(acordes[qual][i >> 1]), ctx.currentTime, 1.6); });
		});
	}

	// ruído filtrado: vento, tempestade, plasma; "vento" faz ele ir e vir
	function camadaRuido(r) {
		var s = fonteRuido(), f = filtro(r.tipo || 'lowpass', r.corte, r.tipo === 'bandpass' ? 1.4 : 0.7), g = ganho(r.vol);
		s.connect(f); f.connect(g); g.connect(estacao); s.start();
		if (r.vento) { lfo(r.vento, r.corte * 0.6, f.frequency); lfo(r.vento * 0.7, r.vol * 0.5, g.gain); }
	}
	// mar: ondas que crescem e quebram devagar
	function camadaMar(vol) {
		vol = typeof vol === 'number' ? vol : 0.12;
		var s = fonteRuido(), f = filtro('lowpass', 700), g = ganho(vol);
		s.connect(f); f.connect(g); g.connect(saidaPan(0, 0.05, estacao)); s.start();
		lfo(0.09, vol * 0.9, g.gain); lfo(0.09, 450, f.frequency);
	}

	// várias vozes que tocam juntas no mesmo relógio (pergunta, resposta, contraponto…):
	// cada voz começa num tempo do ciclo, e "trocaLados" inverte esquerda e direita a cada volta
	function camadaConjunto(m) {
		var batida = 60 / m.bpm, volta = 0;
		var vozes = m.vozes.map(function (v) {
			var p = ctx.createStereoPanner ? ctx.createStereoPanner() : null, envio = ganho(0.5);
			if (p) { p.pan.value = v.pan || 0; p.connect(estacao); p.connect(envio); }
			else envio.connect(estacao);
			envio.connect(eco);
			return { v: v, p: p, entrada: p || estacao };
		});
		function ciclo() {
			var t0 = ctx.currentTime + 0.05, lado = m.trocaLados && volta++ % 2 ? -1 : 1;
			vozes.forEach(function (z) {
				var v = z.v;
				if (v.chance != null && Math.random() > v.chance) return;
				if (z.p) z.p.pan.setValueAtTime((v.pan || 0) * lado, t0);
				var t = t0 + (v.inicio || 0) * batida, muda = v.variar && Math.random() < v.variar ? Math.floor(Math.random() * v.padrao.length) : -1;
				v.padrao.forEach(function (n, i) {
					if (n[0] !== null) INSTRUMENTOS[v.inst](nota(n[0] + (i === muda ? 1 : 0), v.oitava), t, n[1] * batida, v.vol, z.entrada, v);
					t += n[1] * batida;
				});
			});
			agendar(ciclo, (m.ciclo + (m.pausa || 0)) * batida * 1000);
		}
		agendar(ciclo, 600);
	}

	// sub-grave: um tom bem fundo que cresce e recua devagar; a oitava de cima vai junto para o
	// grave aparecer também em caixinhas de som pequenas e no notebook (que não tocam tão baixo)
	function camadaSub(s) {
		var g = ganho(s.vol * 0.7);
		[[s.freq, 1], [s.freq * 2, 0.45]].forEach(function (h) {
			var o = oscilador('sine', h[0]), gh = ganho(h[1]);
			o.connect(gh); gh.connect(g); o.start();
		});
		lfo(0.09, s.vol * 0.3, g.gain);
		g.connect(estacao);
	}

	// o anel de luz em volta do buraco negro: um zumbido que pulsa e dá voltas em volta da cabeça
	// (duas ondas quase iguais "batendo" uma na outra deixam o som mais encorpado)
	function camadaAnel(a) {
		var f = nota(a.grau, a.oitava), g = ganho(a.vol), filtroAnel = filtro('lowpass', f * 2.2, 0.7);
		[0, 3].forEach(function (desvio) { var o = oscilador('triangle', f + desvio); o.connect(filtroAnel); o.start(); });
		filtroAnel.connect(g);
		lfo(0.7, a.vol * 0.35, g.gain);
		g.connect(saidaPan(0, a.giro, estacao)); g.connect(eco);
	}

	function camadaMelodia(m) {
		if (m.vozes) { camadaConjunto(m); return; }
		var saida = saidaPan(m.pan, m.giro, estacao), batida = 60 / m.bpm, total = 0;
		var envio = ganho(m.envio != null ? m.envio : 0.5); saida.connect(envio); envio.connect(eco);
		var entrada = ganho(1); entrada.connect(saida);
		m.padrao.forEach(function (n) { total += n[1]; });
		function ciclo() {
			if (Math.random() < (m.chance == null ? 1 : m.chance)) {
				var t = ctx.currentTime + 0.05, notas = m.padrao.slice();
				// de vez em quando uma nota muda, para a música não ficar sempre igual
				if (m.variar && Math.random() < m.variar) {
					var i = Math.floor(Math.random() * notas.length);
					if (notas[i][0] !== null) notas[i] = [notas[i][0] + (Math.random() < 0.5 ? 1 : -1), notas[i][1]];
				}
				notas.forEach(function (n) {
					if (n[0] !== null) INSTRUMENTOS[m.inst](nota(n[0], m.oitava), t, n[1] * batida, m.vol, entrada, m);
					t += n[1] * batida;
				});
			}
			agendar(ciclo, (total + (m.pausa || 0)) * batida * 1000);
		}
		agendar(ciclo, ((m.atraso || 0) * batida + 0.6) * 1000);
	}

	// batida: bumbo e chimbal
	function bumbo(t, v) {
		var o = oscilador('sine', 120), g = ganho(0);
		o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
		envelope(g, t, 0.004, v, t + 0.4);
		o.connect(g); g.connect(estacao); o.start(t); o.stop(t + 0.45);
	}
	function chimbal(t, v) {
		var s = fonteRuido(), f = filtro('highpass', 7000), g = ganho(0);
		envelope(g, t, 0.002, v, t + 0.05);
		s.connect(f); f.connect(g); g.connect(estacao); s.start(t, Math.random()); s.stop(t + 0.07);
	}
	function camadaBateria(b) {
		var batida = 60 / b.bpm, compasso = b.compasso || 4;
		function ciclo() {
			var t0 = ctx.currentTime + 0.05;
			b.bumbo.forEach(function (x) { bumbo(t0 + x * batida, b.vol); });
			if (b.chimbal) for (var x = 0; x < compasso; x += b.chimbal) chimbal(t0 + x * batida, b.vol * (x % 1 ? 0.12 : 0.2));
			agendar(ciclo, compasso * batida * 1000);
		}
		agendar(ciclo, 600);
	}

	// coração: bate devagar; "desacelera" faz as batidas ficarem cada vez mais espaçadas
	// (perto do buraco negro), "apaga" faz elas ficarem cada vez mais fracas (a estrela morrendo)
	function batidaCoracao(freq, v) {
		var t = ctx.currentTime, o = oscilador('sine', freq * 2.5), g = ganho(0);
		o.frequency.exponentialRampToValueAtTime(freq, t + 0.12);
		envelope(g, t, 0.01, v, t + 0.6);
		o.connect(g); g.connect(estacao); o.start(t); o.stop(t + 0.65);
	}
	function camadaPulso(p) {
		var intervalo = 60 / p.bpm, forca = 1;
		(function prox() {
			agendar(function () {
				batidaCoracao(p.freq, p.vol * forca);
				if (p.duplo) agendar(function () { batidaCoracao(p.freq, p.vol * forca * 0.7); }, 280);
				if (p.desacelera) { intervalo *= 1.06; if (intervalo > 60 / p.bpm * 2.6) intervalo = 60 / p.bpm; }
				if (p.apaga) { forca *= 0.9; if (forca < 0.12) forca = 1; }
				prox();
			}, intervalo * 1000);
		})();
	}

	// Betelgeuse respirando: um órgão grave (lá, dó, mi) que enche e esvazia, com o filtro abrindo
	// junto e um fôlego de ruído por cima, como um peito enorme subindo e descendo
	function camadaRespiro(r) {
		var g = ganho(r.vol * 0.55), fl = filtro('lowpass', 320, 1.2), freq = 1 / r.periodo;
		[0, 2, 4, 7].forEach(function (grau, i) {
			[-6, 6].forEach(function (cents) {
				var o = oscilador(i === 3 ? 'triangle' : 'sawtooth', nota(grau, 1)); o.detune.value = cents;
				var gv = ganho(i === 3 ? 0.1 : 0.16); o.connect(gv); gv.connect(fl); o.start();
			});
		});
		fl.connect(g); g.connect(estacao);
		lfo(freq, r.vol * 0.5, g.gain);
		lfo(freq, 230, fl.frequency);
		var s = fonteRuido(), fs = filtro('bandpass', 700, 0.9), gs = ganho(0.02);
		s.connect(fs); fs.connect(gs); gs.connect(estacao); s.start();
		lfo(freq, 0.02, gs.gain); lfo(freq, 350, fs.frequency);
	}

	// Eta Carinae: as duas estrelas são duas vozes que giram em volta da cabeça, em lados opostos
	// (o mesmo "pêndulo" puxa uma para a esquerda e a outra para a direita). A cada volta elas
	// passam pelo meio juntas: é o periastro, quando a menor acende e os raios X estalam.
	function camadaDupla(d) {
		var P = d.periodo, grande = ganho(d.vol), menor = ganho(d.vol * 0.35);
		var pa = saidaPan(0, 0, estacao), pb = saidaPan(0, 0, estacao);
		grande.connect(pa); menor.connect(pb); menor.connect(eco);
		[0, 4].forEach(function (desvio, i) { var o = oscilador(i ? 'sine' : 'triangle', nota(0, 2) + desvio * 0.3); var f = filtro('lowpass', 700); o.connect(f); f.connect(grande); o.start(); });
		var fm = filtro('lowpass', 900, 2);
		[nota(4, 4), nota(4, 4) * 1.004].forEach(function (fr) { var o = oscilador('triangle', fr); o.connect(fm); o.start(); });
		fm.connect(menor);
		// o pêndulo que move as duas: o seno passa pelo zero (as duas no meio) em t0, t0 + P/2…
		var t0 = ctx.currentTime + 0.1, pend = oscilador('sine', 1 / P);
		if (pa.pan) { var ga = ganho(0.45), gb = ganho(-0.85); pend.connect(ga); ga.connect(pa.pan); pend.connect(gb); gb.connect(pb.pan); }
		pend.start(t0);
		var k = 0;
		(function proximo() {
			k++;
			var alvo = t0 + k * P;
			agendar(function () { periastro(alvo); proximo(); }, Math.max(0, (alvo - ctx.currentTime - 1.2) * 1000));
		})();
		function periastro(t) {
			// a menor acende (fica mais alta e mais brilhante) e depois se afasta, apagando
			menor.gain.setTargetAtTime(d.vol * 1.1, t - 0.9, 0.35); menor.gain.setTargetAtTime(d.vol * 0.35, t + 0.6, 1.2);
			fm.frequency.setTargetAtTime(3800, t - 0.9, 0.35); fm.frequency.setTargetAtTime(900, t + 0.6, 1.2);
			// as notas das duas se esbarram (o meio-tom do modo frígio, bem agudo)
			[nota(1, 8), nota(0, 8)].forEach(function (f, i) { INSTRUMENTOS.caixinha(f, t + i * 0.05, 0.3, 0.035, eco); INSTRUMENTOS.caixinha(f, t + i * 0.05, 0.3, 0.03, estacao); });
			// os raios X: uma chuva de estalinhos bem no encontro
			for (var i = 0; i < 18; i++) {
				var ti = t - 0.3 + Math.random() * 1.1, s = fonteRuido(), f2 = filtro('highpass', 2500 + Math.random() * 4000), g = ganho(0);
				g.gain.setValueAtTime(0.0001, ti); g.gain.linearRampToValueAtTime(0.05 * Math.random() + 0.01, ti + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.03);
				s.connect(f2); f2.connect(g); g.connect(saidaPan(Math.random() * 0.8 - 0.4, 0, estacao)); s.start(ti, Math.random() * 1.5); s.stop(ti + 0.04);
			}
		}
	}

	// ---------- Acontecimentos ----------
	function estalo(vol) {
		var t = ctx.currentTime, s = fonteRuido(), f = filtro('highpass', 1500 + Math.random() * 3000), g = ganho(0);
		g.gain.setValueAtTime(vol * Math.random(), t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
		s.connect(f); f.connect(g); g.connect(estacao);
		s.start(t, Math.random() * 1.5); s.stop(t + 0.04);
	}
	var EVENTOS = {
		estalos: function (e) { estalo(e.vol); },
		// assobio de rádio: um tom que cai do agudo para o grave (os "whistlers" de verdade)
		assobio: function () {
			var t = ctx.currentTime, o = oscilador('sine', 4500 + Math.random() * 2500), g = ganho(0);
			o.frequency.exponentialRampToValueAtTime(250 + Math.random() * 200, t + 1.6);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.045, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.7);
			o.connect(g); g.connect(estacao); g.connect(eco); o.start(t); o.stop(t + 1.8);
		},
		// o sinal some e volta (o brilho da Estrela de Tabby, que cai sem aviso)
		queda: function () {
			var t = ctx.currentTime, dura = 1 + Math.random() * 2.5;
			estacao.gain.setTargetAtTime(0.12 + Math.random() * 0.3, t, 0.35);
			estacao.gain.setTargetAtTime(1, t + dura, 0.5);
		},
		bolhas: function (e) {
			INSTRUMENTOS.bolha(nota(Math.floor(Math.random() * 12), 4), ctx.currentTime, 0.15, e.vol, saidaPan(Math.random() < 0.5 ? -0.7 : 0.7, 0, estacao));
		},
		enxame: function (e) {
			INSTRUMENTOS.caixinha(nota(Math.floor(Math.random() * 10), e.oitava), ctx.currentTime, 0.2, e.vol * (0.4 + Math.random() * 0.6), saidaPan(Math.random() * 1.6 - 0.8, 0, estacao));
		},
		// um sino grave e distante que dobra
		toque: function (e) {
			var t = ctx.currentTime, f = nota(e.grau, e.oitava), fim = t + 7;
			[[1, 1], [2.4, 0.4], [3.1, 0.25], [4.2, 0.15]].forEach(function (h) {
				var o = oscilador('sine', f * h[0]), g = ganho(0);
				envelope(g, t, 0.01, e.vol * h[1], fim / h[0] + t * (1 - 1 / h[0]));
				o.connect(g); g.connect(estacao); g.connect(eco); o.start(t); o.stop(fim);
			});
		},
		// estrela cadente: um risco agudo que atravessa de um lado para o outro
		cadente: function () {
			var t = ctx.currentTime, o = oscilador('sine', 2400), g = ganho(0), p = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
			o.frequency.exponentialRampToValueAtTime(700, t + 1.2);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.3);
			o.connect(g);
			if (p) { var lado = Math.random() < 0.5 ? -1 : 1; p.pan.setValueAtTime(lado * -0.9, t); p.pan.linearRampToValueAtTime(lado * 0.9, t + 1.2); g.connect(p); p.connect(estacao); p.connect(eco); }
			else { g.connect(estacao); g.connect(eco); }
			o.start(t); o.stop(t + 1.4);
		},
		// código Morse: pontos e traços
		morse: function (e) {
			var CODIGO = { O: '---', L: '.-..', A: '.-', '?': '..--..' }, t = ctx.currentTime + 0.1, ponto = 0.08;
			var s = saidaPan(0.3, 0, estacao);
			e.texto.split('').forEach(function (letra) {
				(CODIGO[letra] || '').split('').forEach(function (sinal) {
					var d = sinal === '.' ? ponto : ponto * 3;
					INSTRUMENTOS.beep(1180, t, d / 0.8, 0.03, s);
					t += d + ponto;
				});
				t += ponto * 2;
			});
		},
		// as quatro estrelas do Trapézio acendendo uma depois da outra
		trapezio: function () {
			var t = ctx.currentTime;
			[0, 2, 4, 6].forEach(function (grau, i) { INSTRUMENTOS.caixinha(nota(grau, 8), t + i * 0.12, 0.3, 0.04, saidaPan(-0.6 + i * 0.4, 0, estacao)); });
		},
		// explosão solar: o plasma ruge e um acorde brilhante acende
		// as luas:
		// um gêiser (Encélado, Tritão): um jato de ruído que sobe do grave para o agudo e se espalha,
		// com uns cristaizinhos de gelo tilintando no fim
		geiser: function (e) {
			var t = ctx.currentTime, s = fonteRuido(), f = filtro('bandpass', 400, 2.5), g = ganho(0), p = saidaPan(Math.random() * 1.2 - 0.6, 0, estacao);
			f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4200, t + 1.4); f.frequency.exponentialRampToValueAtTime(1800, t + 3);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(e.vol || 0.12, t + 0.3); g.gain.linearRampToValueAtTime(0, t + 3);
			s.connect(f); f.connect(g); g.connect(p); g.connect(eco); s.start(t); s.stop(t + 3.1);
			if (e.gelo !== false) for (var i = 0; i < 6; i++) INSTRUMENTOS.caixinha(nota(Math.floor(Math.random() * 7), 8), t + 1.2 + i * 0.18 + Math.random() * 0.1, 0.2, 0.02, p);
		},
		// um vulcão de Io: um estrondo grave que desce, e a lava estalando depois
		vulcao: function (e) {
			var t = ctx.currentTime, o = oscilador('sine', 70), g = ganho(0);
			o.frequency.exponentialRampToValueAtTime(32, t + 1.6);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(e.vol || 0.3, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
			o.connect(g); g.connect(estacao); o.start(t); o.stop(t + 1.9);
			var s = fonteRuido(), f = filtro('lowpass', 900), g2 = ganho(0);
			g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime((e.vol || 0.3) * 0.5, t + 0.05); g2.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
			s.connect(f); f.connect(g2); g2.connect(estacao); s.start(t); s.stop(t + 1.3);
			for (var i = 0; i < 8; i++) setTimeout(function () { estalo(0.08); }, 900 + Math.random() * 2500);
		},
		// os "bipes Quindar" das transmissões da Apollo: dois tons curtos (2.525 Hz para abrir e 2.475 Hz
		// para fechar), que marcavam o começo e o fim de cada fala entre a Terra e os astronautas
		quindar: function () {
			var t = ctx.currentTime, s = saidaPan(0.3, 0, estacao);
			INSTRUMENTOS.beep(2525, t, 0.25, 0.025, s);
			INSTRUMENTOS.beep(2475, t + 2.6 + Math.random() * 1.5, 0.25, 0.025, s);
		},
		erupcao: function () {
			var t = ctx.currentTime, s = fonteRuido(), f = filtro('lowpass', 300, 3), g = ganho(0);
			f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3200, t + 0.8); f.frequency.exponentialRampToValueAtTime(300, t + 2.6);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.22, t + 0.6); g.gain.linearRampToValueAtTime(0, t + 2.6);
			s.connect(f); f.connect(g); g.connect(estacao); s.start(t); s.stop(t + 2.7);
			[0, 4, 7].forEach(function (grau) { INSTRUMENTOS.sino(nota(grau, 4), t + 0.5, 1.5, 0.04, estacao); });
		},
		// passarinhos: cada vez canta um, de um lugar diferente
		passaros: function () {
			var t = ctx.currentTime, s = saidaPan(Math.random() * 1.6 - 0.8, 0, estacao);
			s.connect(eco);
			// um piado: o tom vai de "de" até "ate", passando por "meio"
			function pio(ti, de, meio, ate, dura, vol) {
				var o = oscilador('sine', de), g = ganho(0);
				o.frequency.setValueAtTime(de, ti); o.frequency.exponentialRampToValueAtTime(meio, ti + dura * 0.45); o.frequency.exponentialRampToValueAtTime(ate, ti + dura);
				envelope(g, ti, 0.008, vol, ti + dura);
				o.connect(g); g.connect(s); o.start(ti); o.stop(ti + dura + 0.02);
			}
			var especie = Math.random(), i, b;
			if (especie < 0.35) {
				// sabiá: uma frase cantada e assobiada, de notas que deslizam
				b = 1900 + Math.random() * 500;
				var frase = [1, 1.26, 1.12, 1.5, 1.33], dt = 0;
				for (i = 0; i < 3 + Math.floor(Math.random() * 3); i++) {
					var f = b * frase[i % frase.length], d = 0.14 + Math.random() * 0.12;
					pio(t + dt, f, f * 1.08, f * (Math.random() < 0.5 ? 0.92 : 1.12), d, 0.045);
					dt += d + 0.04;
				}
			} else if (especie < 0.6) {
				// bem-te-vi: "bem" - "te" - "viiii"
				b = 2300 + Math.random() * 300;
				pio(t, b, b * 1.15, b * 1.05, 0.09, 0.05);
				pio(t + 0.16, b * 1.2, b * 1.3, b * 1.2, 0.08, 0.05);
				pio(t + 0.32, b * 1.35, b * 1.4, b * 0.95, 0.38, 0.05);
			} else {
				// pardais: piados curtinhos e rápidos
				b = 2800 + Math.random() * 900;
				for (i = 0; i < 3 + Math.floor(Math.random() * 4); i++) pio(t + i * 0.12, b, b * 1.5, b * 1.1, 0.08, 0.035);
			}
		},
		// chuva de ácido de Vênus: gotinhas que caem e evaporam no meio do caminho, antes do chão
		chuvaAcida: function () {
			var t = ctx.currentTime, n = 3 + Math.floor(Math.random() * 4);
			for (var i = 0; i < n; i++) {
				var ti = t + i * (0.08 + Math.random() * 0.14), f = 1300 + Math.random() * 900;
				var o = oscilador('sine', f), g = ganho(0), s = saidaPan(Math.random() * 1.6 - 0.8, 0, estacao);
				o.frequency.setValueAtTime(f, ti); o.frequency.exponentialRampToValueAtTime(f * 0.55, ti + 0.4);
				envelope(g, ti, 0.01, 0.018, ti + 0.22); // some antes de terminar de cair
				o.connect(g); g.connect(s); g.connect(eco); o.start(ti); o.stop(ti + 0.45);
			}
		},
		// raio nas nuvens de ácido: um estalo seco ao longe e um trovão grave rolando depois
		relampago: function () {
			var t = ctx.currentTime, lado = Math.random() * 1.4 - 0.7;
			var s1 = fonteRuido(), f1 = filtro('bandpass', 1800, 0.8), g1 = ganho(0);
			g1.gain.setValueAtTime(0.22, t); g1.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
			s1.connect(f1); f1.connect(g1); g1.connect(saidaPan(lado, 0, estacao)); s1.start(t, Math.random()); s1.stop(t + 0.15);
			var s2 = fonteRuido(), f2 = filtro('lowpass', 180, 0.7), g2 = ganho(0), t2 = t + 0.25;
			f2.frequency.setValueAtTime(260, t2); f2.frequency.exponentialRampToValueAtTime(90, t2 + 2.8);
			g2.gain.setValueAtTime(0, t2); g2.gain.linearRampToValueAtTime(0.35, t2 + 0.3); g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 3);
			s2.connect(f2); f2.connect(g2); g2.connect(saidaPan(lado * 0.5, 0, estacao)); s2.start(t2, Math.random()); s2.stop(t2 + 3.1);
		},
		// grilos: trinados agudos e rápidos, ao longe
		grilos: function () {
			var t = ctx.currentTime, s = saidaPan(Math.random() * 1.6 - 0.8, 0, estacao), f = 4200 + Math.random() * 600;
			for (var c = 0; c < 2 + Math.floor(Math.random() * 2); c++) {
				for (var p = 0; p < 6; p++) {
					var ti = t + c * 0.28 + p * 0.022, o = oscilador('sine', f), g = ganho(0);
					envelope(g, ti, 0.003, 0.012, ti + 0.016);
					o.connect(g); g.connect(s); o.start(ti); o.stop(ti + 0.02);
				}
			}
		},
		// gotas d'água num riacho: "plic"
		gotas: function () {
			var t = ctx.currentTime, f = 700 + Math.random() * 900, o = oscilador('sine', f), g = ganho(0), s = saidaPan(Math.random() * 1.4 - 0.7, 0, estacao);
			o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.2, t + 0.04);
			envelope(g, t, 0.003, 0.03 + Math.random() * 0.02, t + 0.07);
			o.connect(g); g.connect(s); o.start(t); o.stop(t + 0.08);
		},
		// o Grande Apagão de Betelgeuse: a estação quase some, devagar, e só uma voz grave continua,
		// descendo; depois a luz volta
		apagao: function () {
			var t = ctx.currentTime;
			estacao.gain.setTargetAtTime(0.18, t, 1.2);
			estacao.gain.setTargetAtTime(1, t + 6, 1.5);
			var o = oscilador('sine', nota(4, 2)), o2 = oscilador('triangle', nota(4, 2) * 1.5), g = ganho(0), g2 = ganho(0.25);
			o.frequency.setValueAtTime(nota(4, 2), t + 1); o.frequency.exponentialRampToValueAtTime(nota(0, 1), t + 6);
			o2.frequency.setValueAtTime(nota(4, 2) * 1.5, t + 1); o2.frequency.exponentialRampToValueAtTime(nota(0, 1) * 1.5, t + 6);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.07, t + 2); g.gain.setValueAtTime(0.07, t + 5); g.gain.linearRampToValueAtTime(0, t + 8);
			o.connect(g); o2.connect(g2); g2.connect(g); g.connect(mestre); g.connect(eco); // (direto no mestre: não apaga junto)
			o.start(t); o.stop(t + 8.1); o2.start(t); o2.stop(t + 8.1);
		},
		// quase uma supernova: tudo sobe e sobe por 7 segundos… para de repente, um silêncio, e só
		// um estrondo lá longe e um sino. Ainda não foi desta vez.
		quaseSupernova: function () {
			var t = ctx.currentTime, pico = t + 7;
			var s = fonteRuido(), f = filtro('bandpass', 200, 1.5), g = ganho(0);
			f.frequency.setValueAtTime(200, t); f.frequency.exponentialRampToValueAtTime(5200, pico);
			g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, pico); g.gain.setValueAtTime(0, pico + 0.01);
			s.connect(f); f.connect(g); g.connect(estacao); s.start(t); s.stop(pico + 0.05);
			[0, 2, 4].forEach(function (grau) {
				var o = oscilador('sawtooth', nota(grau, 2)), fo = filtro('lowpass', 400, 3), go = ganho(0);
				o.detune.setValueAtTime(0, t); o.detune.linearRampToValueAtTime(1200, pico);
				fo.frequency.setValueAtTime(400, t); fo.frequency.exponentialRampToValueAtTime(4000, pico);
				go.gain.setValueAtTime(0.0001, t); go.gain.exponentialRampToValueAtTime(0.05, pico); go.gain.setValueAtTime(0, pico + 0.01);
				o.connect(fo); fo.connect(go); go.connect(estacao); o.start(t); o.stop(pico + 0.05);
			});
			// o silêncio (a estação toda segura o fôlego) e o estrondo distante
			estacao.gain.setTargetAtTime(0.05, pico, 0.03);
			estacao.gain.setTargetAtTime(1, pico + 1.4, 0.8);
			var t2 = pico + 1.1, s2 = fonteRuido(), f2 = filtro('lowpass', 160, 0.7), g2 = ganho(0);
			g2.gain.setValueAtTime(0, t2); g2.gain.linearRampToValueAtTime(0.4, t2 + 0.15); g2.gain.exponentialRampToValueAtTime(0.0001, t2 + 4);
			s2.connect(f2); f2.connect(g2); g2.connect(mestre); s2.start(t2, Math.random()); s2.stop(t2 + 4.1);
			INSTRUMENTOS.sino(nota(0, 4), t2 + 0.6, 2, 0.05, eco);
			INSTRUMENTOS.sino(nota(0, 4), t2 + 0.6, 2, 0.04, mestre);
		},
		// a Grande Erupção de 1843: os dois lobos do Homúnculo inflando, um de cada lado (notas de
		// trás para a frente), até o estrondo; depois um acorde frígio fica ecoando
		grandeErupcao: function () {
			var t = ctx.currentTime, boom = t + 3;
			[[-0.9, 0], [0.9, 4]].forEach(function (l) {
				var s = saidaPan(l[0], 0, estacao);
				INSTRUMENTOS.reverso(nota(l[1], 4), t, 3, 0.07, s);
				INSTRUMENTOS.reverso(nota(l[1] + 7, 4), t + 0.5, 2.5, 0.03, s);
			});
			var s2 = fonteRuido(), f2 = filtro('lowpass', 1800, 0.7), g2 = ganho(0);
			f2.frequency.setValueAtTime(1800, boom); f2.frequency.exponentialRampToValueAtTime(120, boom + 3);
			g2.gain.setValueAtTime(0, boom); g2.gain.linearRampToValueAtTime(0.3, boom + 0.03); g2.gain.exponentialRampToValueAtTime(0.0001, boom + 3.4);
			s2.connect(f2); f2.connect(g2); g2.connect(estacao); g2.connect(eco); s2.start(boom, Math.random()); s2.stop(boom + 3.5);
			var o = oscilador('sine', 90), go = ganho(0);
			o.frequency.setValueAtTime(90, boom); o.frequency.exponentialRampToValueAtTime(32, boom + 0.8);
			envelope(go, boom, 0.005, 0.5, boom + 1.2);
			o.connect(go); go.connect(estacao); o.start(boom); o.stop(boom + 1.3);
			[0, 1, 4].forEach(function (grau, i) { INSTRUMENTOS.sino(nota(grau, 4), boom + 0.3 + i * 0.12, 2, 0.045, eco); });
		},
		// a "estrela convidada" de 1054: um estrondo lá longe e um acorde brilhante que vai
		// apagando bem devagar (ela ficou visível por quase dois anos)
		estrelaConvidada: function () {
			var t = ctx.currentTime, s = fonteRuido(), f = filtro('lowpass', 1400, 0.7), g = ganho(0);
			f.frequency.setValueAtTime(1400, t); f.frequency.exponentialRampToValueAtTime(120, t + 2.5);
			g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.25, t + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
			s.connect(f); f.connect(g); g.connect(estacao); g.connect(eco); s.start(t, Math.random()); s.stop(t + 3.1);
			[0, 2, 4, 7].forEach(function (grau, i) {
				var o = oscilador('triangle', nota(grau, 8)), go = ganho(0);
				go.gain.setValueAtTime(0, t + 0.2); go.gain.linearRampToValueAtTime(0.025, t + 0.6 + i * 0.1); go.gain.exponentialRampToValueAtTime(0.0001, t + 9);
				o.connect(go); go.connect(estacao); go.connect(eco); o.start(t + 0.2); o.stop(t + 9.1);
			});
		},
		// uma erupção de Proxima: uma chuva de estalos e um brilho agudo que sobe e some
		chama: function () {
			var t = ctx.currentTime, lado = Math.random() * 1.2 - 0.6, s = saidaPan(lado, 0, estacao);
			for (var i = 0; i < 14; i++) {
				var ti = t + Math.random() * 0.8, sr = fonteRuido(), fh = filtro('highpass', 2000 + Math.random() * 3000), g = ganho(0);
				g.gain.setValueAtTime(0.0001, ti); g.gain.linearRampToValueAtTime(0.03 + Math.random() * 0.03, ti + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.04);
				sr.connect(fh); fh.connect(g); g.connect(s); sr.start(ti, Math.random() * 1.5); sr.stop(ti + 0.05);
			}
			var o = oscilador('sine', 600), go = ganho(0);
			o.frequency.setValueAtTime(600, t); o.frequency.exponentialRampToValueAtTime(2400, t + 0.9);
			go.gain.setValueAtTime(0, t); go.gain.linearRampToValueAtTime(0.03, t + 0.2); go.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
			o.connect(go); go.connect(s); go.connect(eco); o.start(t); o.stop(t + 1.3);
		},
		// um cachorrinho latindo lá longe ("au-au"): um tom que sobe e cai depressa, passando pelo
		// filtro da vogal "a"
		latido: function () {
			var t = ctx.currentTime, s = saidaPan(Math.random() * 1.2 - 0.6, 0, estacao);
			s.connect(eco);
			[0, 0.24].forEach(function (d, i) {
				var ti = t + d, f0 = i ? 520 : 600, o = oscilador('sawtooth', f0), b = filtro('bandpass', 1100, 3), g = ganho(0);
				o.frequency.setValueAtTime(f0 * 0.8, ti); o.frequency.linearRampToValueAtTime(f0, ti + 0.03); o.frequency.exponentialRampToValueAtTime(f0 * 0.6, ti + 0.13);
				g.gain.setValueAtTime(0, ti); g.gain.linearRampToValueAtTime(0.05, ti + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, ti + 0.15);
				o.connect(b); b.connect(g); g.connect(s); o.start(ti); o.stop(ti + 0.17);
			});
		},
		// brilhos mágicos: uma escadinha de sininhos subindo, como poeira de estrela
		brilhos: function () {
			var t = ctx.currentTime, s = saidaPan(Math.random() * 1.2 - 0.6, 0, estacao), inicio = Math.floor(Math.random() * 3);
			s.connect(eco);
			for (var i = 0; i < 5; i++) INSTRUMENTOS.caixinha(nota(inicio + i * 2, 8), t + i * 0.07, 0.2, 0.025, s);
		}
	};

	// chiado ao sintonizar: o ruído varre as frequências até achar a estação
	function sintonizar() {
		var t = ctx.currentTime, s = fonteRuido(), f = filtro('bandpass', 300, 2), g = ganho(0);
		f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(3500, t + 0.5); f.frequency.exponentialRampToValueAtTime(900, t + 0.9);
		g.gain.setValueAtTime(0.35, t); g.gain.setTargetAtTime(0, t + 0.6, 0.15);
		s.connect(f); f.connect(g); g.connect(mestre); s.start(t); s.stop(t + 1.4);
	}

	function comecarCamadas() {
		if (tocando) return;
		tocando = true;
		sintonizar();
		// conta para o selo especial "Ouvinte da galáxia" (as 18 estações)
		if (window.PassaporteEspacial && ESTACOES[pagina]) window.PassaporteEspacial.anotar('estacao', pagina);
		mestre.gain.setValueAtTime(0, ctx.currentTime);
		mestre.gain.setTargetAtTime(VOLUME, ctx.currentTime + 0.4, 0.5);
		if (E.pad) camadaPad(E.pad);
		if (E.ruido) camadaRuido(E.ruido);
		if (E.mar) camadaMar(E.mar);
		if (E.anel) camadaAnel(E.anel);
		if (E.sub) camadaSub(E.sub);
		if (E.respiro) camadaRespiro(E.respiro);
		if (E.dupla) camadaDupla(E.dupla);
		camadaRuido({ tipo: 'bandpass', corte: 3200, vol: E.chiado || 0.012 }); // o chiadinho de todo rádio
		if (E.pulso) camadaPulso(E.pulso);
		if (E.bateria) camadaBateria(E.bateria);
		(E.melodias || []).forEach(camadaMelodia);
		(E.eventos || []).forEach(function (e) { repetir(e.cada, function () { EVENTOS[e.tipo](e); }); });
		// apagão de rádio de verdade agora (escala R da NOAA, por causa de uma explosão solar): o rádio estala
		var est = window.TempoDoSol && window.TempoDoSol.estado(), esc = window.TempoDoSol && window.TempoDoSol.dados && window.TempoDoSol.dados.escalas;
		if (est && esc && esc.R >= 1) repetir(4 / esc.R, function () { for (var k = 0; k < 6 + esc.R * 4; k++) agendar(function () { estalo(0.25); }, k * 40 + Math.random() * 60); });
	}

	function desligarSom() {
		tocando = false;
		timers.forEach(clearTimeout); timers = [];
		if (!ctx) return;
		var velho = ctx;
		mestre.gain.setTargetAtTime(0, velho.currentTime, 0.12);
		setTimeout(function () { velho.close(); }, 600);
		ctx = null;
	}

	// ---------- O aparelho na tela ----------
	var ligado = false, esperando = false;
	// só dá para usar o rádio depois da decolagem: na página da viagem, só quando já
	// chegamos na galáxia (o viagem.js põe a classe "na-galaxia" no body)
	var naViagem = document.body.classList.contains('viagem');
	// (durante o embarque e a cena de chegada o rádio fica quieto: elas têm a trilha delas)
	function disponivel() {
		if (document.body.classList.contains('embarcando') || document.documentElement.classList.contains('chegando')) return false;
		return !naViagem || document.body.classList.contains('na-galaxia');
	}

	var botao = document.createElement('button');
	botao.type = 'button';
	botao.className = 'radio';
	// ícone: um radinho em pixel, com antena, alto-falante e dial
	botao.innerHTML =
		'<svg class="radio-icone" viewBox="0 0 16 14" aria-hidden="true" shape-rendering="crispEdges" fill="currentColor">' +
		'<rect x="9" y="0" width="1" height="1"/><rect x="10" y="1" width="1" height="1"/><rect x="11" y="2" width="1" height="2"/>' +
		'<rect x="0" y="4" width="16" height="1"/><rect x="0" y="13" width="16" height="1"/><rect x="0" y="4" width="1" height="10"/><rect x="15" y="4" width="1" height="10"/>' +
		'<rect x="2" y="6" width="1" height="1"/><rect x="4" y="6" width="1" height="1"/><rect x="6" y="6" width="1" height="1"/>' +
		'<rect x="3" y="8" width="1" height="1"/><rect x="5" y="8" width="1" height="1"/>' +
		'<rect x="2" y="10" width="1" height="1"/><rect x="4" y="10" width="1" height="1"/><rect x="6" y="10" width="1" height="1"/>' +
		'<rect x="9" y="6" width="5" height="2"/><rect x="9" y="10" width="2" height="2"/><rect x="12" y="10" width="2" height="2"/></svg>' +
		'<span class="radio-visor"><b class="radio-freq">FM ' + E.freq + '</b><span class="radio-nome"></span></span>' +
		'<span class="radio-ondas" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
	var nomeTela = botao.querySelector('.radio-nome');

	// a doca segura o rádio no canto da tela
	var doca = document.createElement('div');
	doca.className = 'radio-doca';
	doca.appendChild(botao);
	try { localStorage.removeItem('radioVersao'); } catch (e) {} // sobra do teste das duas versões

	// de 8 em 8 segundos o visor mostra o boletim do Sol ao vivo (dados da NOAA) no lugar do nome da estação
	var mostraSol = false;
	setInterval(function () { mostraSol = !mostraSol && !!(window.TempoDoSol && window.TempoDoSol.boletim()); if (ligado) atualizar(); }, 8000);
	function atualizar() {
		botao.setAttribute('aria-pressed', ligado ? 'true' : 'false');
		botao.classList.toggle('ligado', ligado && !esperando);
		botao.classList.toggle('esperando', esperando);
		var sol = ligado && !esperando && mostraSol && window.TempoDoSol && window.TempoDoSol.dados, bol = null;
		if (sol && sol.vento) bol = TR('Sol ao vivo · ', 'Live Sun · ') + Math.round(sol.vento.v) + ' km/s' + (sol.kp ? ' · Kp ' + TR(sol.kp.v.toFixed(1).replace('.', ','), sol.kp.v.toFixed(1)) : '');
		nomeTela.textContent = esperando ? TR('Toque para sintonizar', 'Tap to tune in') : bol ? bol : ligado ? E.nome : TR('Rádio desligado', 'Radio off');
		botao.title = ligado ? E.nome + ' · ' + E.nota + TR('. Clique para desligar.', '. Click to turn off.') : TR('Ligar o rádio da nave (', 'Turn on the ship radio (') + E.nome + ')';
		botao.setAttribute('aria-label', ligado ? TR('Desligar o rádio: ', 'Turn off the radio: ') + E.nome : TR('Ligar o rádio da nave: ', 'Turn on the ship radio: ') + E.nome);
		try { sessionStorage.setItem('radio', ligado ? '1' : '0'); } catch (e) {}
	}

	function ligar() {
		ligado = true;
		if (!disponivel()) { atualizar(); return; } // liga de verdade quando a nave chegar na galáxia
		if (!ctx) montar();
		if (ctx.state === 'running') { esperando = false; comecarCamadas(); }
		else {
			// o navegador só deixa tocar som depois de um toque na página
			esperando = true;
			ctx.resume().then(function () { if (ligado && ctx && ctx.state === 'running') { esperando = false; comecarCamadas(); atualizar(); } }, function () {});
		}
		atualizar();
	}
	function desligar() { ligado = false; esperando = false; desligarSom(); atualizar(); }

	botao.addEventListener('click', function () {
		if (esperando) { ligar(); return; }
		if (ligado) desligar(); else ligar();
	});
	// voltando de outra página com o rádio ligado: o primeiro toque em qualquer lugar sintoniza
	function retomar(ev) {
		if (!esperando || botao.contains(ev.target)) return;
		ligar();
	}
	['pointerdown', 'keydown', 'touchstart'].forEach(function (tipo) { document.addEventListener(tipo, retomar, true); });

	// na página da viagem: o rádio some ao rever a decolagem e volta na chegada à galáxia
	// (e em qualquer página: some durante o embarque e a chegada, e volta quando elas acabam)
	if (window.MutationObserver) {
		var vigia = new MutationObserver(function () {
			if (!ligado) return;
			if (disponivel() && !tocando && !esperando) ligar();
			else if (!disponivel() && (tocando || esperando)) { esperando = false; desligarSom(); atualizar(); }
		});
		vigia.observe(document.body, { attributes: true, attributeFilter: ['class'] });
		vigia.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
	}

	// saindo da página por um salto: o som vai sumindo enquanto a nave acelera
	var saltar = window.saltarPara;
	if (saltar) window.saltarPara = function (href, opcoes) {
		if (ctx && mestre) mestre.gain.setTargetAtTime(0, ctx.currentTime, 0.25);
		return saltar.apply(this, arguments);
	};
	window.addEventListener('pagehide', function () { if (ligado) desligarSom(); });
	// voltando pelo botão "voltar" do navegador (página guardada na memória): sintoniza de novo
	window.addEventListener('pageshow', function (ev) { if (ev.persisted && ligado) ligar(); });

	document.body.appendChild(doca);
	var antes = null;
	try { antes = sessionStorage.getItem('radio'); } catch (e) {}
	if (antes === '1') ligar(); else atualizar();
})();
