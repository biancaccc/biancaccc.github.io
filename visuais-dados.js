// Dados dos visuais de cada planeta (o visuais.js monta tudo na página a partir daqui).
//  - visores: número em destaque ao lado do texto de cada seção (chave = número da seção);
//  - comparacoes: caixinha "isso é como…" embaixo do texto de uma seção;
//  - animacao: mini animação em pixel art numa seção (as animações ficam no visuais.js);
//  - comparacao: o planeta em tamanho real ao lado do Sol (diâmetro em km);
//  - linha: linha do tempo; calculadoras; quiz (a resposta certa é a marcada com *).
// O texto de cada página continua igual: os visuais só entram em volta dele.
window.VISUAIS_DADOS = {
	// o Sol: a comparação mostra os 8 planetas em tamanho real ao lado dele
	sol: {
		nome: 'Sol',
		comparacao: { todos: true },
		animacao: { secao: 3, id: 'sol-foton', hud: ['0 mil anos dentro do Sol', 'presa no labirinto'],
			aria: 'Animação: o Sol cortado ao meio. Um pontinho de luz nasce no centro e anda em zigue-zague por muito tempo, sobe numa bolha de gás até a superfície e depois voa em linha reta até a Terra.',
			legenda: 'A luz nasce no núcleo e fica presa num labirinto por dezenas de milhares de anos. Quando escapa, chega à Terra em 8 minutos.' },
		animacao2: { secao: 5, id: 'sol-aurora', hud: ['ano 0 de 11', 'Sol calmo, poucas manchas'],
			aria: 'Animação: ao longo de 11 anos, as manchas do Sol aparecem e somem. No auge do ciclo, erupções soltam nuvens de partículas que viajam até a Terra e acendem auroras verdes e rosas nos polos.',
			legenda: 'No auge do ciclo de 11 anos, as erupções soltam nuvens de partículas. O escudo magnético da Terra (as linhas azuis) desvia quase tudo, mas nos polos elas entram e acendem as auroras.' }
	},

	mercurio: {
		nome: 'Mercúrio',
		visores: {
			1: ['88 dias', 'é um ano em Mercúrio, o planeta mais rápido'],
			2: ['176 dias', 'do nascer de um Sol até o seguinte'],
			3: ['580 °C', 'de diferença entre o dia e a noite'],
			4: ['2012', 'o ano em que a MESSENGER confirmou o gelo'],
			5: ['75%', 'do interior é um núcleo de metal'],
			6: ['1915', 'Einstein explica a órbita de Mercúrio'],
			7: ['3', 'sondas já o visitaram']
		},
		comparacoes: {
			2: 'se o dia na sua cidade durasse quase seis meses: é o tempo entre um nascer do Sol e outro em Mercúrio.',
			3: 'de dia, mais quente que um forno de pizza bem aceso (cerca de 400 °C); de noite, muito mais frio que o congelador de casa (−18 °C).',
			5: 'um pêssego com um caroço enorme: o núcleo de metal ocupa a maior parte do planeta.'
		},
		animacao: { secao: 2, id: 'mercurio-dia', hud: ['volta 1 de 2 no Sol', 'o Sol nascendo lá'],
			aria: 'Animação: Mercúrio dá a volta no Sol girando devagar. Uma bandeirinha vermelha marca um lugar do planeta, e um quadrinho mostra o céu visto de lá: o Sol nasce, atravessa o céu e só se põe depois de uma volta inteira.',
			legenda: 'Acompanhe a bandeirinha vermelha: o Sol nasce lá, atravessa o céu devagar (veja o quadrinho, com o céu visto de lá) e só se põe depois de uma volta inteira. Do nascer ao próximo nascer do Sol, Mercúrio dá 2 voltas: um dia lá dura 2 anos dele.' },
		animacao2: { secao: 3, id: 'mercurio-calor', hud: ['dia 0 de 176', '−180 °C no pontinho'],
			aria: 'Animação: Mercúrio de perto, com o Sol à esquerda. Uma bandeirinha gira com o planeta, do lado escuro para o lado iluminado, e um termômetro sobe e desce.',
			legenda: 'Sem ar para guardar o calor, o lado virado para o Sol passa de 400 °C e o lado escuro cai para −180 °C. O termômetro mostra a temperatura na bandeirinha.' },
		comparacao: { km: 4879, plural: 'Mercúrios' },
		linha: [
			['1631', 'Pierre Gassendi vê Mercúrio passar na frente do Sol, pela primeira vez com um telescópio.'],
			['1859', 'Urbain Le Verrier percebe que a órbita de Mercúrio se desloca de um jeito estranho.'],
			['1915', 'A Teoria da Relatividade de Einstein explica esse deslocamento.'],
			['1974', 'A Mariner 10 é a primeira sonda a passar por Mercúrio.'],
			['2011', 'A MESSENGER entra em órbita do planeta.'],
			['2012', 'A MESSENGER confirma gelo nas crateras dos polos.'],
			['2018', 'A BepiColombo é lançada rumo a Mercúrio.']
		],
		calculadoras: {
			idade: 0.2408,
			viagem: { destino: 'Mercúrio', km: 155000000, nota: 'Da Terra até Mercúrio: cerca de 155 milhões de km, em média.',
				sonda: { anos: 6.6, frase: 'Como a sonda MESSENGER', nota: ' (ela saiu em 2004 e só entrou em órbita em 2011, dando voltas pelo caminho para frear)' } }
		},
		quiz: [
			['Quanto dura um ano em Mercúrio?', ['*88 dias', '365 dias', 'Dois anos da Terra']],
			['Onde fica a água de Mercúrio?', ['Em lagos na superfície', '*Congelada em crateras nos polos', 'Nas nuvens']],
			['Quem explicou o jeito estranho da órbita de Mercúrio?', ['Isaac Newton', 'Galileu Galilei', '*Albert Einstein']]
		]
	},

	venus: {
		nome: 'Vênus',
		visores: {
			1: ['95%', 'do tamanho da Terra: o planeta irmão'],
			2: ['243 dias', 'para dar um giro em torno de si'],
			3: ['465 °C', 'de dia e de noite'],
			4: ['90×', 'a pressão do ar na Terra'],
			5: ['2023', 'o ano do sinal de um vulcão ativo'],
			6: ['127 min', 'foi o quanto a Venera 13 aguentou'],
			7: ['3', 'missões planejadas para a "década de Vênus"']
		},
		comparacoes: {
			2: 'ver o Sol nascer só a cada 117 dias da Terra: esse é o tempo entre um nascer do Sol e outro em Vênus.',
			3: 'mais quente que um forno de pizza (uns 400 °C), ligado dia e noite, sem desligar nunca.',
			4: 'carregar o peso de uns seis carros em cima de cada palma da mão.'
		},
		animacao2: { secao: 3, id: 'venus-estufa', hud: ['20 °C no chão', 'a luz do Sol entra'],
			aria: 'Animação: a luz do Sol atravessa as nuvens amarelas de Vênus e esquenta o chão; o calor tenta subir, mas bate na atmosfera e volta, e o termômetro vai subindo.',
			legenda: 'O efeito estufa de Vênus: a luz do Sol entra, vira calor no chão, e o ar grosso de gás carbônico não deixa o calor sair. Por isso lá é mais quente que em Mercúrio.' },
		animacao: { secao: 2, id: 'venus-gira', hud: ['Terra: gira assim →', '← Vênus: ao contrário'],
			aria: 'Animação: a Terra e Vênus girando lado a lado. Vênus gira no sentido contrário e bem mais devagar.',
			legenda: 'As manchas mostram o sentido do giro: na Terra elas andam para a direita; em Vênus, para a esquerda, e bem mais devagar (na animação, ainda mais rápido do que de verdade).' },
		comparacao: { km: 12104, plural: 'Vênus' },
		linha: [
			['1610', 'Galileu vê que Vênus tem fases, como a Lua: uma prova de que ela gira em volta do Sol.'],
			['1639', 'Jeremiah Horrocks observa Vênus passando na frente do Sol.'],
			['1962', 'A Mariner 2 é a primeira sonda a passar por outro planeta: Vênus.'],
			['1970', 'A Venera 7 envia os primeiros dados da superfície de outro planeta.'],
			['1982', 'A Venera 13 manda as primeiras fotos coloridas do solo de Vênus.'],
			['1990', 'A sonda Magellan começa a mapear Vênus por baixo das nuvens, com radar.'],
			['2023', 'Cientistas encontram sinal de um vulcão ativo nas imagens da Magellan.']
		],
		calculadoras: {
			idade: 0.6152,
			viagem: { destino: 'Vênus', km: 170000000, nota: 'Da Terra até Vênus: cerca de 170 milhões de km, em média (às vezes chega a 40 milhões).',
				sonda: { anos: 0.33, frase: 'Como a sonda Venera 7', nota: ' (ela saiu em agosto de 1970 e chegou em dezembro)' } }
		},
		quiz: [
			['Em Vênus, para que lado o Sol nasce?', ['Leste', '*Oeste', 'Norte']],
			['Qual é o planeta mais quente do Sistema Solar?', ['Mercúrio', '*Vênus', 'Marte']],
			['Do que são feitas as nuvens de Vênus?', ['Água', '*Ácido sulfúrico', 'Poeira']]
		]
	},

	terra: {
		nome: 'Terra',
		visores: {
			1: ['71%', 'da superfície coberta de água'],
			2: ['8 min', 'é o tempo da luz do Sol até aqui'],
			3: ['107 mil', 'km/h: a nossa velocidade em volta do Sol'],
			4: ['23°', 'de inclinação do eixo'],
			5: ['5.400 °C', 'no centro da Terra'],
			6: ['3 cm', 'por ano: o quanto as placas andam'],
			7: ['384 mil', 'km até a Lua'],
			8: ['6 bilhões', 'de km: a distância da foto']
		},
		comparacoes: {
			3: 'dar a volta no mundo a cada 22 minutos, sem perceber nada.',
			5: 'o centro da Terra é quase tão quente quanto a superfície do Sol.',
			6: 'as placas andam mais ou menos na mesma velocidade em que as suas unhas crescem.',
			7: 'cerca de 30 Terras enfileiradas caberiam no espaço entre a Terra e a Lua.'
		},
		animacao2: { secao: 7, id: 'terra-lua', hud: ['dia 0 de 29', 'lua nova'],
			aria: 'Animação: à esquerda, a Lua dá a volta na Terra, vista de cima, com o Sol à esquerda; à direita, a Lua como aparece no céu, mudando de fase.',
			legenda: 'Metade da Lua está sempre iluminada pelo Sol. Conforme ela dá a volta na Terra, vemos mais ou menos dessa metade: são as fases. No Brasil, a crescente acende pela esquerda.' },
		animacao: { secao: 4, id: 'terra-estacoes', hud: ['dezembro', 'verão no Brasil'],
			aria: 'Animação: a Terra dá a volta no Sol com o eixo inclinado sempre para o mesmo lado. Quando o hemisfério sul fica virado para o Sol, é verão no Brasil.',
			legenda: 'O eixo fica sempre inclinado para o mesmo lado. Quando a metade de baixo da Terra (onde fica o Brasil) está virada para o Sol, é verão aqui e inverno na Europa.' },
		comparacao: { km: 12742, plural: 'Terras' },
		linha: [
			['240 a.C.', 'Eratóstenes calcula o tamanho da Terra usando sombras e um pouco de geometria.'],
			['1543', 'Copérnico defende que a Terra gira em volta do Sol, e não o contrário.'],
			['1957', 'O Sputnik 1 é o primeiro satélite artificial a orbitar a Terra.'],
			['1961', 'Yuri Gagarin é a primeira pessoa a ir ao espaço.'],
			['1968', 'A Apollo 8 fotografa o "Nascer da Terra", visto da Lua.'],
			['1969', 'A Apollo 11 leva as primeiras pessoas a pisar na Lua.'],
			['1990', 'A Voyager 1 fotografa o "Pálido Ponto Azul".']
		],
		calculadoras: {
			voltas: true,
			viagem: { destino: 'a Lua', titulo: 'Quanto tempo para chegar à Lua?', km: 384400, nota: 'Da Terra até a Lua: cerca de 384 mil km.',
				sonda: { anos: 3 / 365.25, frase: 'Como a Apollo 11', nota: ' (ela levou uns 3 dias, em 1969)' } }
		},
		quiz: [
			['Quanto da superfície da Terra é coberta de água?', ['*Cerca de 71%', 'Metade', 'Quase toda (90%)']],
			['Por que existem as estações do ano?', ['A Terra se afasta do Sol', '*O eixo da Terra é inclinado', 'A Lua esconde o Sol']],
			['Como se chama a foto da Terra tirada pela Voyager 1 em 1990?', ['*Pálido Ponto Azul', 'Nascer da Terra', 'Bolinha Azul']]
		]
	},

	marte: {
		nome: 'Marte',
		visores: {
			1: ['53%', 'do tamanho da Terra'],
			2: ['687 dias', 'é um ano em Marte'],
			3: ['−60 °C', 'é a temperatura média'],
			4: ['22 km', 'de altura do Monte Olimpo'],
			5: ['2', 'luas: Fobos e Deimos'],
			7: ['2', 'jipes da NASA rodando lá hoje']
		},
		comparacoes: {
			3: 'o frio de um inverno na Antártida seria um dia comum em Marte.',
			4: 'a base do Monte Olimpo é quase do tamanho do Rio Grande do Sul.',
			7: 'um sinal de rádio leva de 3 a 22 minutos para ir da Terra até Marte, então ninguém dirige os jipes "ao vivo".'
		},
		animacao2: { secao: 2, id: 'marte-ano', hud: ['dia 0 de 687', 'a Terra já deu 0 voltas'],
			aria: 'Animação: Marte e a Terra dando a volta no Sol. A Terra, mais perto e mais rápida, dá quase duas voltas enquanto Marte dá uma.',
			legenda: 'Marte fica mais longe do Sol e anda mais devagar: enquanto ele dá uma volta (687 dias), a Terra dá quase duas.' },
		animacao: { secao: 3, id: 'marte-poeira', hud: ['semana 0', 'céu limpo'],
			aria: 'Animação: uma tempestade de poeira começa num ponto de Marte, cresce até cobrir o planeta inteiro e depois vai baixando.',
			legenda: 'As tempestades de poeira de Marte começam pequenas e podem crescer até esconder o planeta inteiro por semanas.' },
		comparacao: { km: 6779, plural: 'Martes' },
		linha: [
			['1877', 'Asaph Hall descobre as duas luas de Marte: Fobos e Deimos.'],
			['1965', 'A Mariner 4 tira as primeiras fotos de Marte de perto.'],
			['1976', 'A Viking 1 pousa em Marte.'],
			['1997', 'O Sojourner é o primeiro jipe a passear por Marte.'],
			['2004', 'Os jipes Spirit e Opportunity chegam a Marte.'],
			['2012', 'O Curiosity pousa na cratera Gale.'],
			['2021', 'O Perseverance chega levando o Ingenuity, o primeiro helicóptero em outro planeta.']
		],
		calculadoras: {
			idade: 1.8808,
			viagem: { destino: 'Marte', km: 225000000, nota: 'Da Terra até Marte: cerca de 225 milhões de km, em média.',
				sonda: { anos: 0.58, frase: 'Como o jipe Perseverance', nota: ' (ele saiu em julho de 2020 e pousou em fevereiro de 2021)' } }
		},
		quiz: [
			['Por que Marte é vermelho?', ['Por causa de lava quente', '*Por causa da ferrugem no solo', 'Por causa do reflexo do Sol']],
			['Qual é o maior vulcão conhecido do Sistema Solar?', ['*Monte Olimpo', 'Monte Everest', 'Monte Fuji']],
			['Qual foi o primeiro helicóptero a voar em outro planeta?', ['*Ingenuity', 'Curiosity', 'Viking']]
		]
	},

	jupiter: {
		nome: 'Júpiter',
		visores: {
			1: ['1.300', 'Terras caberiam dentro dele'],
			3: ['10 h', 'é um dia em Júpiter'],
			4: ['400 km/h', 'de vento na Grande Mancha Vermelha'],
			5: ['+100', 'luas conhecidas'],
			7: ['1994', 'o ano em que o cometa caiu em Júpiter'],
			8: ['2030', 'a Europa Clipper deve chegar lá']
		},
		comparacoes: {
			1: 'se a Terra fosse uma moeda, Júpiter seria do tamanho de um prato.',
			4: 'ventos de 400 km/h são mais rápidos que um carro de Fórmula 1.',
			5: 'quatro das luas de Júpiter dá para ver com um binóculo, como Galileu viu em 1610.'
		},
		animacao2: { secao: 4, id: 'jupiter-mancha', hud: ['ano 1879', 'cabem 3,1 Terras lado a lado'],
			aria: 'Animação: a Grande Mancha Vermelha de Júpiter de perto, girando entre as faixas de nuvens, encolhendo de 1879 até hoje, com círculos do tamanho da Terra para comparar.',
			legenda: 'Em 1879, cabiam umas três Terras lado a lado na Grande Mancha Vermelha. Ela vem encolhendo, e hoje cabe pouco mais de uma.' },
		animacao: { secao: 5, id: 'jupiter-luas', hud: ['Io · Europa · Ganimedes · Calisto', 'como Galileu viu em 1610'],
			aria: 'Animação: Júpiter girando rápido, com a Grande Mancha Vermelha, e as quatro luas de Galileu passando na frente e atrás dele.',
			legenda: 'Vistas da Terra, as quatro luas de Galileu parecem ir e voltar em linha reta, passando na frente e atrás de Júpiter. Io, a mais perto, é a mais rápida; Calisto, a mais longe, a mais lenta.' },
		comparacao: { km: 139820, plural: 'Júpiteres' },
		linha: [
			['1610', 'Galileu descobre as quatro maiores luas de Júpiter.'],
			['1665', 'Giovanni Cassini observa uma grande mancha no planeta.'],
			['1973', 'A Pioneer 10 é a primeira sonda a passar por Júpiter.'],
			['1979', 'A Voyager 1 descobre os anéis finos de Júpiter e vulcões em Io.'],
			['1994', 'Os pedaços do cometa Shoemaker-Levy 9 caem em Júpiter.'],
			['1995', 'A sonda Galileo entra em órbita e solta uma pequena sonda nas nuvens.'],
			['2016', 'A Juno começa a estudar Júpiter de pertinho.']
		],
		calculadoras: {
			idade: 11.862,
			viagem: { destino: 'Júpiter', km: 780000000, nota: 'Da Terra até Júpiter: cerca de 780 milhões de km, em média.',
				sonda: { anos: 5, frase: 'Como a sonda Juno', nota: ' (ela saiu em 2011 e chegou em 2016)' } }
		},
		quiz: [
			['Quantas Terras caberiam dentro de Júpiter?', ['Umas 10', '*Mais de 1.300', 'Exatamente 100']],
			['O que é a Grande Mancha Vermelha?', ['Um vulcão', '*Uma tempestade', 'Um lago']],
			['Qual lua de Júpiter tem mais vulcões ativos?', ['*Io', 'Europa', 'Calisto']]
		]
	},

	saturno: {
		nome: 'Saturno',
		visores: {
			1: ['2º', 'maior planeta do Sistema Solar'],
			2: ['70%', 'da densidade da água: ele boiaria'],
			3: ['29 anos', 'e meio: é um ano em Saturno'],
			4: ['282 mil', 'km de largura dos anéis principais'],
			5: ['6', 'lados no hexágono do polo norte'],
			6: ['285', 'luas conhecidas'],
			7: ['13 anos', 'da Cassini estudando Saturno']
		},
		comparacoes: {
			4: 'os anéis principais ocupariam três quartos do caminho entre a Terra e a Lua.',
			6: 'se cada lua de Saturno fosse um aluno, daria para encher mais de sete salas de aula.'
		},
		animacao2: { secao: 2, id: 'saturno-flutua', hud: ['uma banheira gigante', 'soltando na água…'],
			aria: 'Animação: a Terra, Júpiter e Saturno são soltos numa banheira gigante. A Terra afunda rápido, Júpiter afunda devagar e Saturno fica boiando.',
			legenda: 'Saturno é menos denso que a água (densidade 0,7, contra 1 da água; a Terra tem 5,5 e Júpiter, 1,3): numa banheira gigante, ele boiaria. Os tamanhos aqui não estão em escala.' },
		animacao: { secao: 4, id: 'saturno-aneis', hud: ['ano 0 de 29', 'anéis bem abertos'],
			aria: 'Animação: Saturno visto da Terra ao longo de um ano dele. Os anéis vão ficando de lado até quase sumir e depois abrem de novo.',
			legenda: 'Como Saturno é inclinado, os anéis parecem abrir e fechar ao longo do ano dele. Quando ficam de lado para a Terra, como em 2025, quase desaparecem.' },
		comparacao: { km: 116460, plural: 'Saturnos', proporcao: 1.9 },
		linha: [
			['1610', 'Galileu vê Saturno com "orelhas": eram os anéis.'],
			['1655', 'Christiaan Huygens descobre Titã e depois explica que as "orelhas" são anéis.'],
			['1675', 'Giovanni Cassini encontra uma divisão nos anéis, que leva o nome dele.'],
			['1979', 'A Pioneer 11 é a primeira sonda a passar por Saturno.'],
			['2004', 'A Cassini entra em órbita de Saturno.'],
			['2005', 'A Huygens pousa em Titã.'],
			['2017', 'A Cassini mergulha em Saturno, no fim da missão.']
		],
		calculadoras: {
			idade: 29.457,
			viagem: { destino: 'Saturno', km: 1400000000, nota: 'Da Terra até Saturno: cerca de 1,4 bilhão de km, em média.',
				sonda: { anos: 7, frase: 'Como a sonda Cassini', nota: ' (ela saiu em 1997 e chegou em 2004)' } }
		},
		quiz: [
			['Do que são feitos os anéis de Saturno?', ['*Pedaços de gelo e rocha', 'Gás colorido', 'Metal']],
			['Que forma tem a tempestade no polo norte de Saturno?', ['Círculo', '*Hexágono', 'Triângulo']],
			['Qual lua de Saturno tem rios e lagos de metano?', ['*Titã', 'Encélado', 'Fobos']]
		]
	},

	netuno: {
		nome: 'Netuno',
		visores: {
			1: ['1846', 'descoberto pela matemática'],
			2: ['2024', 'as cores de verdade foram reveladas'],
			3: ['165 anos', 'é um ano em Netuno'],
			4: ['−200 °C', 'no topo das nuvens'],
			5: ['2.000 km/h', 'de vento'],
			6: ['16', 'luas conhecidas'],
			7: ['12 anos', 'de viagem da Voyager 2 até lá']
		},
		comparacoes: {
			1: 'encontrar uma bola escondida só olhando para onde as outras bolas rolaram.',
			3: 'ninguém que nasce na Terra vive o suficiente para ver Netuno dar uma volta inteira no Sol.',
			5: 'ventos de 2.000 km/h são mais que o dobro da velocidade de um avião a jato.'
		},
		animacao2: { secao: 3, id: 'netuno-ano', hud: ['ano 1846', 'descoberto em 1846 (marca vermelha)'],
			aria: 'Animação: Netuno dando a volta no Sol, devagar, a partir do ponto onde estava em 1846, deixando um rastro do caminho, até completar a volta em 2011.',
			legenda: 'Netuno foi descoberto em 1846 (a marca vermelha) e só completou a primeira volta desde então em 2011: 165 anos depois.' },
		animacao: { secao: 5, id: 'netuno-ventos', hud: ['ventos de 2.000 km/h', 'Tritão: ao contrário'],
			aria: 'Animação: as nuvens brancas e a Grande Mancha Escura de Netuno correndo com os ventos, e a lua Tritão dando a volta no sentido contrário.',
			legenda: 'As nuvens brancas e a Grande Mancha Escura correm com os ventos mais fortes do Sistema Solar. E Tritão, a maior lua, dá a volta no sentido contrário ao do giro de Netuno.' },
		comparacao: { km: 49244, plural: 'Netunos' },
		linha: [
			['1612', 'Galileu vê Netuno, mas acha que é uma estrela.'],
			['1846', 'Le Verrier calcula onde ele deveria estar e Johann Galle o encontra.'],
			['1846', 'Semanas depois, William Lassell descobre Tritão, a maior lua de Netuno.'],
			['1989', 'A Voyager 2 passa por Netuno: a única visita até hoje.'],
			['2011', 'Netuno completa a primeira volta no Sol desde que foi descoberto.'],
			['2024', 'Cientistas mostram as cores verdadeiras de Netuno e Urano.']
		],
		calculadoras: {
			idade: 164.8,
			viagem: { destino: 'Netuno', km: 4500000000, nota: 'Da Terra até Netuno: cerca de 4,5 bilhões de km, em média.',
				sonda: { anos: 12, frase: 'Como a sonda Voyager 2', nota: ' (ela saiu em 1977 e chegou em 1989)' } }
		},
		quiz: [
			['Como Netuno foi encontrado?', ['Por acaso, olhando o céu', '*Por cálculos de matemática', 'Por uma sonda']],
			['Quanto dura um ano em Netuno?', ['12 anos', '84 anos', '*165 anos']],
			['O que a lua Tritão tem de especial?', ['É a maior lua do Sistema Solar', '*Gira no sentido contrário ao do planeta', 'É feita de ferro']]
		]
	},

	// ---------- Os destinos da Via Láctea ----------
	// Aqui não tem comparação com o Sol nem idade no planeta. No lugar, a calculadora "luz"
	// (quando saiu a luz que vemos de lá) e a viagem medida em anos-luz (1 ano-luz = 9,46 trilhões de km).
	// O quiz dos destinos conta para outro selo: "Sabe-tudo da Via Láctea".
	'sagitario-a': {
		nome: 'Sagittarius A*', quizGalaxia: true,
		visores: {
			1: ['4 milhões', 'de vezes a massa do Sol'],
			3: ['2022', 'o ano da primeira foto'],
			4: ['Mercúrio', 'a sombra caberia dentro da órbita dele'],
			5: ['16 anos', 'uma volta da estrela S2'],
			7: ['230 milhões', 'de anos: uma volta do Sol pela galáxia']
		},
		comparacoes: {
			2: 'para a Terra virar um buraco negro, ela teria que ser espremida até ficar do tamanho de uma bolinha de gude, com menos de 2 centímetros.',
			7: 'desde que nasceu, há 4,6 bilhões de anos, o Sol já deu umas 20 voltas em volta do centro da galáxia.'
		},
		animacao2: { secao: 2, id: 'sgr-luz', hud: ['a luz entorta perto dele', 'perto demais: não volta'],
			aria: 'Animação: raios de luz passando perto do buraco negro. Os que passam longe só fazem uma curva; os que chegam perto demais caem dentro e somem.',
			legenda: 'A gravidade do buraco negro entorta a luz. Quem passa longe só faz uma curva; quem atravessa o horizonte de eventos (a borda da sombra) não volta mais.' },
		animacao: { secao: 5, id: 'sgr-s2', hud: ['ano 0 de 16', '0 km/s'],
			aria: 'Animação: a estrela S2 dá a volta no buraco negro numa órbita bem alongada, andando devagar longe dele e muito rápido quando passa perto.',
			legenda: 'A estrela S2 numa volta de 16 anos: longe do buraco negro ela anda devagar; quando passa perto, dispara a quase 8.000 km/s.' },
		linha: [
			['1974', 'Bruce Balick e Robert Brown encontram uma fonte de ondas de rádio bem no centro da galáxia: Sagittarius A*.'],
			['Anos 1990', 'As equipes de Reinhard Genzel e Andrea Ghez começam a seguir as estrelas que giram em volta dele.'],
			['2002', 'A estrela S2 passa no ponto mais perto e mostra que ali existe algo enorme e invisível.'],
			['2018', 'A S2 passa perto de novo e confirma uma previsão de Einstein sobre a luz e a gravidade.'],
			['2020', 'Genzel e Ghez ganham o Prêmio Nobel de Física.'],
			['2022', 'O Event Horizon Telescope mostra a primeira foto de Sagittarius A*.']
		],
		calculadoras: {
			luz: 26700, de: 'do centro da galáxia',
			viagem: { titulo: 'Quanto tempo para chegar ao centro da galáxia?', km: 26700 * 9.4607e12, nota: 'Da Terra até lá: cerca de 26.700 anos-luz, ou uns 253 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['Por que um buraco negro é "negro"?', ['Porque é pintado de preto', '*Porque nem a luz consegue sair dele', 'Porque fica muito longe']],
			['Quanto tempo a estrela S2 leva para dar uma volta nele?', ['1 dia', '*16 anos', '230 milhões de anos']],
			['A Terra corre o risco de ser engolida por Sagittarius A*?', ['Sim, daqui a pouco', '*Não, ela está longe demais', 'Só se o Sol apagar']]
		]
	},

	fermi: {
		nome: 'Bolhas de Fermi', quizGalaxia: true,
		visores: {
			1: ['2', 'bolhas: uma acima e outra abaixo da galáxia'],
			2: ['2010', 'o ano da descoberta'],
			3: ['50 mil', 'anos-luz de uma ponta à outra'],
			5: ['100 mil', 'supernovas: a energia que foi preciso'],
			7: ['45 mil', 'anos-luz de altura em cada bolha do eROSITA']
		},
		comparacoes: {
			3: 'se a Via Láctea fosse um CD, cada bolha subiria uns 3 centímetros acima dele.',
			4: 'os raios gama são para os nossos olhos como o apito de cachorro é para os nossos ouvidos: estão lá, mas a gente não percebe.',
			6: 'a 3 milhões de km/h, daria para ir da Terra até a Lua em uns 8 minutos.'
		},
		animacao2: { secao: 4, id: 'fermi-raios', hud: ['← raios gama', 'luz que os olhos veem →'],
			aria: 'Animação: o centro da galáxia visto de lado. Uma linha passa de um lado para o outro trocando a visão: com a luz comum só aparece a galáxia; em raios gama, aparecem as duas bolhas.',
			legenda: 'Com a luz que nossos olhos veem, as bolhas não aparecem. Só em raios gama (à esquerda da linha) dá para ver as duas.' },
		animacao: { secao: 5, id: 'fermi-sopro', hud: ['há 4 milhões de anos', 'tudo calmo'],
			aria: 'Animação: a Via Láctea vista de lado. O centro engole uma nuvem de gás, solta jatos para cima e para baixo, e as duas bolhas vão inflando até ficarem enormes.',
			legenda: 'A explicação mais aceita: o buraco negro do centro engoliu uma nuvem de gás e soprou jatos e ventos que incharam as duas bolhas.' },
		linha: [
			['Há uns 4 milhões de anos', 'Provavelmente, Sagittarius A* engole uma grande nuvem de gás e as bolhas começam a se formar.'],
			['2008', 'A NASA lança o telescópio espacial Fermi, que enxerga raios gama.'],
			['2010', 'Doug Finkbeiner, Meng Su e Tracy Slatyer descobrem as bolhas nos dados do Fermi.'],
			['2015', 'A luz de um quasar que fica atrás de uma bolha ajuda a medir a idade e a velocidade dela.'],
			['2020', 'O telescópio eROSITA encontra um par de bolhas ainda maior, em raios X.']
		],
		calculadoras: {
			luz: 26700, de: 'do centro das bolhas',
			viagem: { titulo: 'Quanto tempo para chegar às Bolhas de Fermi?', km: 26700 * 9.4607e12, nota: 'Da Terra até o centro delas: cerca de 26.700 anos-luz, ou uns 253 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['Por que não dá para ver as Bolhas de Fermi numa foto comum?', ['Estão escondidas atrás do Sol', '*Brilham em raios gama, que nossos olhos não veem', 'São pequenas demais']],
			['De onde saem as bolhas?', ['*Do centro da Via Láctea', 'Da Nebulosa de Órion', 'Do Sistema Solar']],
			['Qual é a explicação mais aceita para elas?', ['*O buraco negro do centro engoliu uma grande nuvem de gás', 'Uma explosão no Sol', 'Dois planetas bateram um no outro']]
		]
	},

	orion: {
		nome: 'Nebulosa de Órion', quizGalaxia: true,
		visores: {
			1: ['1.344', 'anos-luz até a Terra'],
			3: ['2 gases', 'pintam as cores: hidrogênio e oxigênio'],
			4: ['4', 'estrelas no Trapézio'],
			6: ['milhares', 'de estrelas jovens na nuvem'],
			7: ['1880', 'a primeira foto de uma nebulosa']
		},
		comparacoes: {
			1: 'se o Sistema Solar inteiro, até Netuno, coubesse numa moeda, a nebulosa teria uns 600 metros de largura.',
			3: 'fumaça na frente de uma lanterna: a luz está lá atrás, mas a poeira das partes escuras não deixa ela passar.',
			5: 'os planetas nascem como bolas de neve: grãozinhos de poeira grudam uns nos outros, viram pedras, e as pedras viram planetas.'
		},
		animacao2: { secao: 2, id: 'orion-constelacao', hud: ['a constelação de Órion', 'vista do Brasil'],
			aria: 'Animação: a constelação de Órion como se vê do Brasil, de cabeça para baixo. As Três Marias piscam, depois a espada, e a imagem se aproxima da estrela do meio da espada até ela virar a nebulosa.',
			legenda: 'Do Brasil, Órion aparece de cabeça para baixo, com a espada acima das Três Marias. A estrela borrada do meio da espada é a nebulosa.' },
		animacao: { secao: 5, id: 'orion-disco', hud: ['0 ano', 'nuvem de gás'],
			aria: 'Animação: uma nuvem de gás encolhe e gira até formar uma estrela no meio de um disco de poeira, e no disco vão aparecendo planetas.',
			legenda: 'Do disco de poeira em volta de uma estrela recém-nascida podem surgir planetas. O Sistema Solar começou assim, há 4,6 bilhões de anos.' },
		linha: [
			['1610', 'Nicolas-Claude Fabri de Peiresc é o primeiro a descrever a nebulosa vista num telescópio.'],
			['1656', 'Christiaan Huygens faz um dos primeiros desenhos dela.'],
			['1769', 'Charles Messier coloca a nebulosa no catálogo dele, como M42.'],
			['1880', 'Henry Draper tira a primeira foto de uma nebulosa: ela.'],
			['1993', 'O Hubble encontra discos de poeira em volta de estrelas recém-nascidas.'],
			['2023', 'O James Webb mostra objetos do tamanho de Júpiter flutuando soltos pela nuvem.']
		],
		calculadoras: {
			luz: 1344, de: 'da Nebulosa de Órion',
			viagem: { titulo: 'Quanto tempo para chegar à Nebulosa de Órion?', km: 1344 * 9.4607e12, nota: 'Da Terra até lá: cerca de 1.344 anos-luz, ou uns 12,7 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['O que está acontecendo dentro da Nebulosa de Órion?', ['*Estrelas estão nascendo', 'Uma estrela está morrendo', 'Um buraco negro está comendo gás']],
			['De onde vem o vermelho e o rosa da nebulosa?', ['*Do hidrogênio brilhando', 'De ferro enferrujado', 'Do reflexo do Sol']],
			['Como se chamam os discos de onde podem surgir planetas?', ['Anéis de Saturno', '*Discos protoplanetários', 'Discos voadores']]
		]
	},

	pleiades: {
		nome: 'Plêiades', quizGalaxia: true,
		visores: {
			1: ['444', 'anos-luz até a Terra'],
			2: ['100 milhões', 'de anos de idade'],
			4: ['7', 'irmãs na mitologia grega'],
			6: ['6 a 9', 'estrelas que dá para ver a olho nu']
		},
		comparacoes: {
			2: 'se o Sol fosse uma pessoa de 46 anos, as Plêiades seriam um bebê de 1 ano.',
			5: 'o logotipo da Subaru tem seis estrelas: a grande é a própria empresa, e as cinco pequenas são as empresas que se juntaram para formá-la.',
			6: 'contar as irmãs é um teste de céu escuro: quanto mais estrelas você enxerga, menos luz da cidade está atrapalhando.'
		},
		animacao2: { secao: 6, id: 'pleiades-ceu', hud: ['no céu da cidade', 'você vê 6 estrelas'],
			aria: 'Animação: as Plêiades vistas no céu claro da cidade, depois no céu escuro do campo e depois com binóculo, aparecendo cada vez mais estrelas.',
			legenda: 'Na cidade, a luz das ruas esconde as estrelas fracas. No campo dá para ver mais, e com um binóculo aparecem dezenas.' },
		animacao: { secao: 7, id: 'pleiades-separa', hud: ['hoje', 'irmãs juntas'],
			aria: 'Animação: o grupinho de estrelas azuis das Plêiades vai se espalhando devagar, cada estrela para um lado, ao longo de centenas de milhões de anos.',
			legenda: 'As puxadas das outras estrelas e da galáxia vão afastando as irmãs, até cada uma seguir o seu caminho.' },
		linha: [
			['Há uns 3.600 anos', 'O Disco Celeste de Nebra mostra um grupinho de estrelas que devem ser as Plêiades.'],
			['Há uns 2.700 anos', 'O poeta grego Hesíodo usa o aparecimento das Plêiades para marcar a época da colheita.'],
			['1610', 'Galileu aponta o telescópio para elas e encontra dezenas de estrelas.'],
			['1769', 'Charles Messier coloca as Plêiades no catálogo dele, como M45.'],
			['1859', 'Wilhelm Tempel descobre a névoa azul em volta da estrela Merope.'],
			['1953', 'É fundada no Japão a Subaru, com as Plêiades no logotipo.']
		],
		calculadoras: {
			luz: 444, de: 'das Plêiades',
			viagem: { titulo: 'Quanto tempo para chegar às Plêiades?', km: 444 * 9.4607e12, nota: 'Da Terra até lá: cerca de 444 anos-luz, ou uns 4,2 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['Quantas estrelas a maioria das pessoas vê nas Plêiades a olho nu?', ['Duas', '*Seis', 'Mil']],
			['De onde vem a névoa azul em volta delas?', ['*De uma nuvem de poeira que reflete a luz das estrelas', 'Da fumaça das estrelas', 'Do gás onde elas nasceram']],
			['Como os povos tupi-guarani chamavam as Plêiades?', ['Subaru', '*Eixu, o ninho de abelhas', 'Cruzeiro']]
		]
	},

	helice: {
		nome: 'Nebulosa da Hélice', quizGalaxia: true,
		visores: {
			1: ['650', 'anos-luz até a Terra'],
			3: ['100 mil °C', 'na superfície da anã branca'],
			5: ['20 mil', 'nós cometários'],
			6: ['meia Lua', 'é o tamanho dela no céu'],
			7: ['5 bilhões', 'de anos até o Sol virar uma']
		},
		comparacoes: {
			3: 'uma anã branca é como apertar o Sol inteiro numa bola do tamanho da Terra: uma colherzinha dela pesaria várias toneladas.',
			5: 'se a nebulosa fosse um campo de futebol, cada nó cometário seria do tamanho de uma bolinha de pingue-pongue.'
		},
		animacao2: { secao: 5, id: 'helice-nos', hud: ['os nós cometários', 'cada um do tamanho do Sistema Solar'],
			aria: 'Animação: a borda de dentro do anel da Hélice de perto, cheia de bolinhas de gás com caudas, e o vento da anã branca soprando da esquerda para a direita.',
			legenda: 'O vento e a luz da anã branca (à esquerda) empurram o gás para fora e esticam as caudas dos nós, como se fossem cometas.' },
		animacao: { secao: 2, id: 'helice-morte', hud: ['estrela como o Sol', 'bilhões de anos'],
			aria: 'Animação: uma estrela amarela incha e vira uma gigante vermelha, solta as camadas de fora num anel colorido que vai se abrindo e, no meio, sobra uma anã branca.',
			legenda: 'A vida de uma estrela como o Sol no fim: incha, solta as camadas de fora e deixa no meio uma anã branca acendendo o gás.' },
		linha: [
			['Há uns 10 mil anos', 'A estrela solta as camadas de fora e a nebulosa começa a se formar.'],
			['Antes de 1824', 'Karl Ludwig Harding descobre a nebulosa.'],
			['1996', 'Fotos do Hubble mostram os nós cometários na borda de dentro do anel.'],
			['2003', 'Uma foto do Hubble junto com um telescópio no Chile mostra a nebulosa inteira, e o apelido "Olho de Deus" se espalha.'],
			['Daqui a 5 bilhões de anos', 'O Sol deve virar uma nebulosa planetária parecida com esta.']
		],
		calculadoras: {
			luz: 650, de: 'da Nebulosa da Hélice',
			viagem: { titulo: 'Quanto tempo para chegar à Nebulosa da Hélice?', km: 650 * 9.4607e12, nota: 'Da Terra até lá: cerca de 650 anos-luz, ou uns 6,1 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['O que sobra no centro de uma nebulosa planetária?', ['Um buraco negro', '*Uma anã branca', 'Um planeta gigante']],
			['Por que ela se chama "planetária"?', ['*Os primeiros astrônomos achavam que ela parecia um planeta', 'Porque tem planetas dentro', 'Porque vai virar um planeta']],
			['O que o Sol vai virar daqui a uns 5 bilhões de anos?', ['Um buraco negro', '*Uma gigante vermelha e depois uma anã branca', 'Uma estrela azul']]
		]
	},

	tabby: {
		nome: 'Estrela de Tabby', quizGalaxia: true,
		visores: {
			1: ['1.470', 'anos-luz até a Terra'],
			2: ['150 mil', 'estrelas vigiadas pelo Kepler'],
			4: ['0', 'sinais de rádio encontrados'],
			5: ['1.700', 'pessoas ajudaram a pagar as observações']
		},
		comparacoes: {
			2: 'se a estrela fosse uma lâmpada, um planeta como Júpiter seria uma mosca passando na frente; a queda de 22% seria como cobrir quase um quarto da lâmpada.',
			5: 'o pôr do sol aqui na Terra: a poeira e o ar seguram mais o azul, e por isso o Sol fica alaranjado no fim da tarde.'
		},
		animacao2: { secao: 2, id: 'tabby-quedas', hud: ['com planeta: 100%', 'Tabby: 100%'],
			aria: 'Animação: dois gráficos de brilho. Em cima, uma estrela com um planeta: o brilho cai um tiquinho, sempre igual. Embaixo, a Estrela de Tabby: o brilho cai muito, em quedas irregulares.',
			legenda: 'Em cima, uma estrela comum com um planeta: quedinhas de 1%, sempre iguais. Embaixo, a Estrela de Tabby: quedas de até 22%, sem padrão nenhum.' },
		animacao: { secao: 5, id: 'tabby-cores', hud: ['azul: 100%', 'vermelho: 100%'],
			aria: 'Animação: uma nuvem de poeira passa na frente da estrela e o gráfico mostra duas linhas de brilho; a linha azul cai mais que a vermelha.',
			legenda: 'Quando a poeira passa, a luz azul cai mais que a vermelha. Um painel sólido bloquearia as duas cores igualzinho.' },
		linha: [
			['2009', 'O telescópio Kepler começa a medir o brilho de 150 mil estrelas.'],
			['2011', 'Voluntários do Planet Hunters notam as quedas estranhas no brilho da estrela.'],
			['2015', 'Tabetha Boyajian e a equipe publicam o estudo, e Jason Wright levanta a ideia da megaestrutura.'],
			['2016', 'Radiotelescópios procuram sinais de rádio e não encontram nada.'],
			['2017', 'Os cientistas pegam uma queda ao vivo, apelidada de Elsie.'],
			['2018', 'O estudo das cores da luz aponta a poeira como a explicação mais provável.']
		],
		calculadoras: {
			luz: 1470, de: 'da Estrela de Tabby',
			viagem: { titulo: 'Quanto tempo para chegar à Estrela de Tabby?', km: 1470 * 9.4607e12, nota: 'Da Terra até lá: cerca de 1.470 anos-luz, ou uns 13,9 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['O que mais provavelmente faz o brilho da estrela cair?', ['Uma megaestrutura alienígena', '*Nuvens de poeira', 'Um planeta gigante']],
			['Qual pista mostrou que não era uma estrutura sólida?', ['*A luz azul caía mais que a vermelha', 'A estrela mudou de lugar', 'Chegou um sinal de rádio']],
			['Quem percebeu primeiro que a estrela era estranha?', ['*Voluntários do projeto Planet Hunters', 'Astronautas na Lua', 'Um jipe em Marte']]
		]
	},

	'omega-centauri': {
		nome: 'Omega Centauri', quizGalaxia: true,
		visores: {
			1: ['10 milhões', 'de estrelas'],
			2: ['1677', 'Halley vê que não é uma estrela só'],
			3: ['40×', 'mais perto umas das outras que as vizinhas do Sol'],
			4: ['12 bilhões', 'de anos de idade'],
			6: ['8.200', 'sóis de massa no buraco negro, no mínimo']
		},
		comparacoes: {
			1: 'contando uma estrela por segundo, sem parar nem para dormir, você levaria uns 4 meses para contar todas.',
			3: 'se as estrelas perto do Sol fossem casas de sítio, as de Omega Centauri seriam apartamentos de um prédio.',
			4: 'se a idade do Universo fosse um dia inteiro, as estrelas de Omega Centauri teriam nascido pouco depois das 3 da manhã.'
		},
		animacao2: { secao: 5, id: 'omega-engolida', hud: ['há 10 bilhões de anos', 'uma galáxia pequena chega perto'],
			aria: 'Animação: uma galáxia pequena chega perto da Via Láctea em espiral; as estrelas de fora vão ficando para trás, e sobra só o miolo, que continua dando voltas.',
			legenda: 'A explicação mais aceita: Omega Centauri era o miolo de uma galáxia pequena. A Via Láctea arrancou as estrelas de fora e só ele sobrou.' },
		animacao: { secao: 7, id: 'omega-contramao', hud: ['galáxia: ↻', 'Omega Centauri: ↺'],
			aria: 'Animação: a Via Láctea vista de cima, com as estrelas girando num sentido, e Omega Centauri dando a volta no sentido contrário, por fora do disco.',
			legenda: 'As estrelas do disco giram todas para o mesmo lado; Omega Centauri faz a volta ao contrário, mais uma pista de que veio de fora.' },
		linha: [
			['Há uns 1.900 anos', 'Ptolomeu anota Omega Centauri como uma estrela comum.'],
			['1603', 'Johann Bayer dá a ele o nome de estrela, com a letra grega ômega.'],
			['1677', 'Edmond Halley percebe que aquilo não é uma estrela só.'],
			['Anos 1830', 'John Herschel mostra que é um aglomerado globular.'],
			['2024', 'Mais de 20 anos de fotos do Hubble revelam um buraco negro no centro.']
		],
		calculadoras: {
			luz: 17000, de: 'de Omega Centauri',
			viagem: { titulo: 'Quanto tempo para chegar a Omega Centauri?', km: 17000 * 9.4607e12, nota: 'Da Terra até lá: cerca de 17.000 anos-luz, ou uns 161 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['O que é Omega Centauri?', ['Uma estrela só', '*Uma bola com milhões de estrelas', 'Um planeta']],
			['Quantos anos têm as estrelas dele?', ['Uns 100 anos', '*Cerca de 12 bilhões', 'Cerca de 1 milhão']],
			['O que ele pode ter sido antes?', ['*O núcleo de uma pequena galáxia engolida', 'Um pedaço do Sol', 'Uma nebulosa']]
		]
	},

	betelgeuse: {
		nome: 'Betelgeuse', quizGalaxia: true,
		visores: {
			1: ['550', 'anos-luz até a Terra'],
			3: ['700×', 'o tamanho do Sol'],
			4: ['3.300 °C', 'na superfície (no Sol, 5.500 °C)'],
			5: ['metade', 'do brilho sumiu em 2020'],
			6: ['100 mil', 'anos, no máximo, até explodir'],
			7: ['1995', 'a primeira foto da superfície']
		},
		comparacoes: {
			3: 'se o Sol fosse do tamanho de uma bolinha de gude, Betelgeuse seria do tamanho de uma sala de aula.',
			4: 'uma brasa e a chama do fogão: a brasa, mais fria, é vermelha; a chama, bem mais quente, é azulada.',
			6: 'a luz da explosão leva 550 anos para chegar aqui: se ela explodisse hoje, só veríamos lá pelo ano 2575.'
		},
		animacao: { secao: 5, id: 'betelgeuse-apagao', hud: ['outubro de 2019', 'brilho: 100%'],
			aria: 'Animação: Betelgeuse solta uma bolha de gás embaixo, que esfria e vira uma nuvem de poeira escura na frente dela; ao lado, um gráfico mostra o brilho caindo até a metade e depois voltando.',
			legenda: 'O grande apagão: a bolha de gás vira poeira na frente da estrela e esconde parte da luz. O gráfico mostra o brilho de outubro de 2019 a abril de 2020.' },
		animacao2: { secao: 6, id: 'betelgeuse-supernova', hud: ['uma noite comum', 'Betelgeuse vermelhinha'],
			aria: 'Animação: Órion no céu do Brasil, de cabeça para baixo. Betelgeuse explode e vira um ponto brilhantíssimo que clareia o céu; ao longo dos meses vai apagando, e Órion fica sem o ombro.',
			legenda: 'Como pode ser o dia da supernova: Betelgeuse brilha quase como a Lua, dá para vê-la de dia e, meses depois, Órion fica sem um dos ombros.' },
		linha: [
			['Há milhares de anos', 'Povos do mundo todo já reparam na estrela vermelha no ombro de Órion.'],
			['1836', 'John Herschel percebe que o brilho de Betelgeuse muda.'],
			['1920', 'Ela é a primeira estrela, fora o Sol, a ter o tamanho medido, num telescópio na Califórnia.'],
			['1995', 'O Hubble tira a primeira foto direta da superfície de outra estrela: ela.'],
			['2019–2020', 'O grande apagão: o brilho cai pela metade e depois volta.'],
			['2025', 'Astrônomos encontram uma pequena estrela companheira girando em volta dela.']
		],
		calculadoras: {
			luz: 550, de: 'de Betelgeuse',
			viagem: { titulo: 'Quanto tempo para chegar a Betelgeuse?', km: 550 * 9.4607e12, nota: 'Da Terra até lá: cerca de 550 anos-luz, ou uns 5,2 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['Por que Betelgeuse é vermelha?', ['Porque está pegando fogo', '*Porque a superfície é mais fria que a do Sol', 'Porque está muito longe']],
			['O que causou o grande apagão de 2019?', ['Ela explodiu', '*Uma nuvem de poeira que ela mesma soltou', 'A Lua passou na frente']],
			['Se Betelgeuse estivesse no lugar do Sol, até onde ela chegaria?', ['Só até Mercúrio', '*Passaria da órbita de Marte', 'Até a Lua']]
		]
	},

	'eta-carinae': {
		nome: 'Eta Carinae', quizGalaxia: true,
		visores: {
			1: ['5 milhões', 'de vezes o brilho do Sol'],
			2: ['5,5 anos', 'uma volta das duas estrelas'],
			3: ['1843', 'a 2ª estrela mais brilhante do céu'],
			4: ['2 milhões', 'de km/h: a velocidade do Homúnculo'],
			5: ['4×', 'maior que a Nebulosa de Órion'],
			7: ['7.500', 'anos-luz até a Terra']
		},
		comparacoes: {
			1: 'se o Sol fosse a lanterna de um celular, Eta Carinae seria um estádio inteiro com todos os refletores acesos.',
			4: 'a 2 milhões de km/h, daria para ir da Terra até a Lua em uns 10 minutos.',
			7: 'a luz dela leva 7.500 anos para chegar aqui: a que vemos hoje saiu de lá antes de existirem as pirâmides do Egito.'
		},
		animacao: { secao: 2, id: 'eta-par', hud: ['ano 0 de 5,5', 'longe: o choque é fraco'],
			aria: 'Animação vista de cima: a estrela grande fica parada e a pequena dá a volta numa órbita esticada. Os ventos das duas saem como ondas e se chocam num arco entre elas; quando a pequena passa pertinho, o arco brilha muito e o medidor de raios X sobe.',
			legenda: 'Vista de cima: a estrela grande parada e a pequena dando a volta a cada 5 anos e meio. As ondas são os ventos das duas; o arco amarelo é onde eles se chocam. Quando a pequena passa pertinho, o choque fica fortíssimo e o medidor de raios X (à direita) sobe.' },
		animacao2: { secao: 3, id: 'eta-erupcao', hud: ['ano 1837', 'uma estrela comum'],
			aria: 'Animação: a estrela começa a brilhar demais, solta gás que forma duas bolhas na diagonal, some atrás da própria poeira e depois volta a aparecer no meio das bolhas.',
			legenda: 'A Grande Erupção, de 1837 até hoje: a estrela brilha demais, solta o gás que forma o Homúnculo, some atrás da poeira e volta a aparecer no século 20.' },
		linha: [
			['1677', 'Edmond Halley anota Eta Carinae como uma estrela fraquinha.'],
			['1837', 'John Herschel percebe que ela começou a brilhar muito mais.'],
			['1843', 'No auge da Grande Erupção, só Sírius brilha mais no céu.'],
			['Fim do século 19', 'Coberta pela própria poeira, ela some a olho nu.'],
			['1950', 'Enrique Gaviola batiza a nuvem em volta dela de Homúnculo.'],
			['1996', 'O brasileiro Augusto Damineli descobre que o brilho dela muda a cada 5 anos e meio: são duas estrelas.'],
			['1996', 'O Hubble tira a famosa foto do Homúnculo, com as duas bolhas.']
		],
		calculadoras: {
			luz: 7500, de: 'de Eta Carinae',
			viagem: { titulo: 'Quanto tempo para chegar a Eta Carinae?', km: 7500 * 9.4607e12, nota: 'Da Terra até lá: cerca de 7.500 anos-luz, ou uns 71 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['Quantas estrelas existem em Eta Carinae?', ['Uma só', '*Duas, girando juntinhas', 'Mil']],
			['O que é o Homúnculo?', ['Um planeta', '*A nuvem de gás soltada na Grande Erupção', 'Um buraco negro']],
			['Em 1843, Eta Carinae chegou a ser…', ['A estrela mais fraca do céu', '*A segunda estrela mais brilhante do céu', 'Maior que o Sol visto daqui']]
		]
	},
	sirius: {
		nome: 'Sirius', quizGalaxia: true,
		visores: {
			1: ['8,6', 'anos-luz até a Terra'],
			2: ['1844', 'Bessel percebe o bambeio'],
			3: ['10 t', 'numa colherzinha de Sirius B'],
			4: ['50 anos', 'uma volta das duas estrelas'],
			5: ['230 milhões', 'de anos: a idade de Sirius']
		},
		comparacoes: {
			1: 'se o Sol fosse uma lâmpada de 100 watts, Sirius A seria um holofote de 2.500 watts.',
			3: 'Sirius B tem quase a massa do Sol espremida no tamanho da Terra: é como espremer um caminhão inteiro num dado.',
			4: 'quem nasceu quando as duas estavam no ponto mais longe uma da outra vai ter uns 50 anos quando elas voltarem para lá.'
		},
		animacao: { secao: 2, id: 'sirius-bambeio', hud: ['ano 1760', 'Sirius anda pelo céu…'],
			aria: 'Animação: ao longo de cem anos, Sirius anda pelo céu fazendo ondas, em vez de seguir em linha reta. Depois aparece a companheira, fazendo ondas ao contrário, e o ponto entre as duas, que anda reto.',
			legenda: 'Cem anos de Sirius no céu: ela não anda reto, faz ondas. Em 1844, Bessel concluiu que algo invisível a puxava; em 1862, Alvan Clark viu a companheira. As duas giram em volta de um ponto entre elas (a cruzinha), e é esse ponto que anda em linha reta.' },
		animacao2: { secao: 5, id: 'sirius-vida', hud: ['há 230 milhões de anos', 'duas estrelas nascem'],
			aria: 'Animação: duas estrelas azuladas nascem, e a da esquerda é a maior. Ela incha até virar uma gigante vermelha, solta as camadas de fora num anel de gás e sobra só um pontinho branco, a anã branca, ao lado de Sirius A.',
			legenda: 'A vida de Sirius B: era a maior das duas, gastou o combustível mais depressa, virou uma gigante vermelha, soltou as camadas de fora e sobrou só o miolo, a anã branca do tamanho da Terra.' },
		linha: [
			['Há uns 5 mil anos', 'No Egito antigo, Sirius (Sopdet) anuncia a cheia do Nilo e o começo do ano.'],
			['1718', 'Edmond Halley percebe que Sirius mudou de lugar no céu desde a Grécia antiga.'],
			['1844', 'Friedrich Bessel conclui que uma companheira invisível puxa Sirius.'],
			['1862', 'Alvan Clark vê a companheira pela primeira vez, testando uma lente nova.'],
			['1915', 'Walter Adams descobre que Sirius B é quentíssima e minúscula: uma anã branca.'],
			['2005', 'O Hubble mede a massa de Sirius B com precisão: quase a mesma do Sol.']
		],
		calculadoras: {
			luz: 8.6, de: 'de Sirius',
			viagem: { titulo: 'Quanto tempo para chegar a Sirius?', km: 8.6 * 9.4607e12, nota: 'Da Terra até lá: cerca de 8,6 anos-luz, ou uns 81 trilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['Como Bessel descobriu que Sirius tinha uma companheira?', ['Viu as duas num telescópio', '*Sirius andava pelo céu fazendo ondas', 'Ouviu um sinal de rádio']],
			['Sirius B é do tamanho de quê?', ['Do Sol', '*Da Terra', 'De uma cidade']],
			['No começo, qual das duas estrelas era a maior?', ['Sirius A', '*Sirius B, que já virou anã branca', 'Eram iguais']]
		]
	},
	caranguejo: {
		nome: 'Nebulosa do Caranguejo', quizGalaxia: true,
		visores: {
			1: ['6.500', 'anos-luz até a Terra'],
			2: ['23 dias', 'visível de dia, em 1054'],
			3: ['M1', 'o nº 1 da lista de Messier'],
			4: ['30', 'voltas por segundo'],
			5: ['5 milhões', 'de km/h: a velocidade da nuvem']
		},
		comparacoes: {
			4: 'imagine o Sol inteiro espremido até ficar do tamanho de uma cidade. Agora imagine essa bola girando 30 vezes a cada segundo, mais rápido que a hélice de um ventilador ligado no máximo. Isso é uma estrela de nêutrons.',
			5: 'a 5 milhões de km/h, daria para ir da Terra até a Lua em uns 5 minutos.'
		},
		animacao: { secao: 2, id: 'caranguejo-1054', hud: ['junho de 1054', 'uma noite comum'],
			aria: 'Animação: o céu visto da China em 1054. Uma estrela nova aparece perto do Touro, tão brilhante que dá para ver de dia; depois vai apagando ao longo de dois anos e some. No fim, aparece a Nebulosa do Caranguejo como é vista hoje num telescópio.',
			legenda: 'A "estrela convidada" de 1054, vista da China: brilhou até de dia por 23 dias, apagou devagar em quase dois anos, e hoje no lugar dela está a Nebulosa do Caranguejo.' },
		animacao2: { secao: 4, id: 'caranguejo-pulsar', hud: ['piscadas: 0', 'em câmera lenta'],
			aria: 'Animação: o pulsar no meio, girando, com dois feixes de luz saindo em lados opostos como um farol. Cada vez que um feixe passa pela Terra, à direita, ela pisca e o gráfico embaixo marca um pico.',
			legenda: 'O pulsar funciona como um farol: gira e solta dois feixes de luz, um em cada polo do ímã dele (o vermelho e o azul). Cada vez que um feixe passa pela Terra, vemos uma piscada. Aqui está em câmera lenta: de verdade, ele dá 30 voltas por segundo.' },
		linha: [
			['1054', 'Astrônomos chineses registram a "estrela convidada", visível até de dia por 23 dias.'],
			['1731', 'John Bevis é o primeiro a ver a nebulosa num telescópio.'],
			['1758', 'Charles Messier a encontra procurando cometas, e ela vira a M1.'],
			['1844', 'Lord Rosse desenha os fiapos e a nebulosa ganha o nome de Caranguejo.'],
			['1968', 'Os astrônomos descobrem o pulsar no meio dela.'],
			['2023', 'O James Webb fotografa a nebulosa com cores e detalhes nunca vistos.']
		],
		calculadoras: {
			luz: 6500, de: 'da Nebulosa do Caranguejo',
			viagem: { titulo: 'Quanto tempo para chegar à Nebulosa do Caranguejo?', km: 6500 * 9.4607e12, nota: 'Da Terra até lá: cerca de 6.500 anos-luz, ou uns 61 quatrilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['O que é a Nebulosa do Caranguejo?', ['Um lugar onde estrelas nascem', '*O que sobrou de uma estrela que explodiu', 'Um planeta gigante']],
			['O que é o pulsar no meio dela?', ['Um buraco negro', '*Uma estrela de nêutrons que gira como um farol', 'Um cometa']],
			['Em 1054, a explosão ficou tão brilhante que…', ['Apagou o Sol', '*Dava para ver até de dia', 'Só aparecia com telescópio']]
		]
	},
	'proxima-centauri': {
		nome: 'Proxima Centauri', quizGalaxia: true,
		visores: {
			1: ['4,2', 'anos-luz: a estrela mais perto'],
			2: ['2.800 °C', 'na superfície (o Sol tem 5.500)'],
			3: ['500 mil', 'anos para dar a volta em A e B'],
			4: ['11 dias', 'um ano em Proxima b'],
			6: ['20 anos', 'de viagem com velas de luz']
		},
		comparacoes: {
			2: 'se o Sol fosse uma bola de basquete, Proxima seria uma bolinha de tênis de mesa.',
			4: 'em Proxima b, você faria aniversário umas 33 vezes por ano da Terra.'
		},
		animacao: { secao: 4, id: 'proxima-b', hud: ['dia 0 de 11', 'a bandeirinha fica sempre de dia'],
			aria: 'Animação: Proxima b dá a volta na estrela vermelha em 11 dias, com o eixo em pé e uma setinha mostrando o giro. Ele gira bem devagar, uma vez por volta, e por isso a bandeirinha fincada no chão fica sempre no lado claro, virada para a estrela; o lado azul-escuro é noite para sempre.',
			legenda: 'Proxima b gira em volta do próprio eixo só uma vez a cada volta na estrela. Por isso a bandeirinha fica sempre no lado claro, virada para a estrela: lá é dia para sempre, e o lado azul-escuro é noite para sempre.' },
		animacao2: { secao: 6, id: 'proxima-viagem', hud: ['ano 0', 'saindo do Sol…'],
			aria: 'Animação: uma corrida do Sol até Proxima, em três pistas. Em cima, um raio de luz chega em 4 anos; no meio, uma navezinha com vela empurrada por laser chega em uns 21 anos; embaixo, a Voyager 1 quase não sai do lugar.',
			legenda: 'Uma corrida até Proxima: em cima, a luz (chega em 4,2 anos); no meio, uma navezinha com vela empurrada por laser (uns 21 anos); embaixo, a Voyager 1, que levaria mais de 70 mil anos.' },
		linha: [
			['1915', 'Robert Innes descobre Proxima, na África do Sul.'],
			['1917', 'Os astrônomos confirmam: é a estrela mais perto do Sol.'],
			['2016', 'Uma erupção faz Proxima brilhar tanto que, por minutos, daria para vê-la a olho nu.'],
			['2016', 'É descoberto o planeta Proxima b, na zona habitável.'],
			['2016', 'Cientistas propõem mandar navezinhas com velas de luz até lá.'],
			['2022', 'É descoberto mais um planeta, menor: Proxima d.']
		],
		calculadoras: {
			luz: 4.2, de: 'de Proxima Centauri',
			viagem: { titulo: 'Quanto tempo para chegar a Proxima Centauri?', km: 4.24 * 9.4607e12, nota: 'Da Terra até lá: cerca de 4,2 anos-luz, ou uns 40 trilhões de km.',
				sonda: { kmh: 61000, frase: 'Na velocidade da Voyager 1', nota: ' (a nave que foi mais longe, a uns 61 mil km/h)' } }
		},
		quiz: [
			['O que Proxima Centauri tem de especial?', ['É a maior estrela do céu', '*É a estrela mais perto do Sol', 'É um buraco negro']],
			['Por que Proxima é vermelha?', ['Porque está pegando fogo', '*Porque é uma estrela pequena e mais fria que o Sol', 'Porque está explodindo']],
			['Em Proxima b, um lado do planeta…', ['Gira muito rápido', '*Fica sempre de dia, e o outro sempre de noite', 'É feito de gelo']]
		]
	}
};

// ---------- O céu visto de cada destino ----------
// O que aparece no céu de lá (o desenho é feito pelo ceuDe, no visuais.js; tela de 200 x 110).
// O brilho do Sol visto de cada lugar foi calculado pela distância: daqui da Terra, a olho nu, só
// dá para ver estrelas até a "magnitude 6", e o Sol só passa nesse limite de bem pertinho.
(function (V) {
	var SOL_FRACO = 'o Sol: fraco demais para ver', SOL_INVISIVEL = 'o Sol: invisível daqui';
	V['sagitario-a'].ceu = {
		texto: 'No centro da galáxia, o céu é lotado: milhões de estrelas bem pertinho umas das outras, tantas que a noite nunca fica escura, e nuvens de gás avermelhado. Perto do buraco negro, a estrela S2 passa voando. E o Sol? Ele fica a 26.700 anos-luz, fraquinho demais e escondido atrás da poeira: daqui não dá para vê-lo.',
		legenda: 'O céu perto de Sagittarius A*: estrelas para todo lado e nuvens vermelhas. A mira amarela marca onde o Sol estaria, invisível.',
		aria: 'Céu lotado de estrelas e nuvens avermelhadas, com um brilho no meio e uma estrela azulada passando; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['o céu no centro da galáxia', SOL_INVISIVEL], fundo: '#0e0612', estrelas: 420, coresEstrelas: ['#ffd8b0', '#ffffff', '#ffb080', '#cfe0ff'],
		nuvens: [[60, 40, 55, '#3a1020', 0.55], [140, 70, 60, '#4a1828', 0.5], [100, 55, 30, '#5a2030', 0.35]],
		brilhantes: [[100, 55, '#ffe8c0', 3], [112, 48, '#bcd4ff', 2, true]], sol: [28, 92, false] };
	V.fermi.ceu = {
		texto: 'Lá do alto de uma das bolhas, uns 25 mil anos-luz acima do disco, a vista é incrível: dá para ver a Via Láctea inteira de cima, como um redemoinho gigante de estrelas lá embaixo. O Sol é só um dos pontinhos de um dos braços, impossível de achar.',
		legenda: 'De cima de uma Bolha de Fermi, a Via Láctea aparece lá embaixo, vista de cima. A mira marca onde fica o Sol, num dos braços.',
		aria: 'A Via Láctea vista de cima, como um redemoinho com dois braços, embaixo; em volta, um brilho roxo fraquinho; uma mira amarela marca onde o Sol fica num dos braços.',
		hud: ['do alto de uma bolha', 'o Sol: perdido num dos braços'], fundo: '#05030c', estrelas: 40,
		// (lá de cima a galáxia aparece quase de frente: redondinha, inteira dentro do quadro)
		nuvens: [[100, 56, 95, '#2a0a3a', 0.45]], galaxia: [100, 58, 52, 42], sol: [130, 72, false] };
	V.orion.ceu = {
		texto: 'Dentro da Nebulosa de Órion, o céu é todo colorido: nuvens rosas e alaranjadas em todas as direções, iluminadas pelas quatro estrelas do Trapézio, tão fortes que fariam sombra no chão. Do Sol, nem sinal: daqui ele seria fraco demais para ver.',
		legenda: 'Dentro da Nebulosa de Órion: nuvens coloridas por todo o céu e as quatro estrelas do Trapézio no meio.',
		aria: 'Céu cheio de nuvens rosas e alaranjadas, com quatro estrelas muito brilhantes juntinhas no meio; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['dentro da Nebulosa de Órion', SOL_FRACO], fundo: '#120818', estrelas: 50,
		nuvens: [[100, 55, 90, '#4a1a38', 0.6], [60, 35, 50, '#6a3a2a', 0.45], [150, 75, 50, '#3a2050', 0.5], [100, 55, 35, '#7a3a50', 0.35]],
		brilhantes: [[94, 50, '#ffffff', 3], [104, 48, '#e8f0ff', 3], [100, 58, '#ffffff', 3], [90, 57, '#dfe8ff', 2]], sol: [172, 20, false] };
	V.pleiades.ceu = {
		texto: 'No meio das Plêiades, o céu teria várias estrelas azuis mais brilhantes que Vênus, todas pertinho, mergulhadas numa névoa azul. Seria como morar no meio de uma família de estrelas. O Sol, a 444 anos-luz, ficaria fraco demais para enxergar.',
		legenda: 'No meio das Plêiades: as irmãs azuis brilhando por todo o céu, numa névoa azulada.',
		aria: 'Céu com sete estrelas azuis muito brilhantes espalhadas e uma névoa azul; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['no meio das Plêiades', SOL_FRACO], estrelas: 60,
		nuvens: [[100, 55, 90, '#14284e', 0.5], [70, 45, 40, '#1f3a6a', 0.4]],
		brilhantes: [[40, 30, '#cfe0ff', 3], [80, 60, '#bcd4ff', 4], [120, 35, '#dfe8ff', 3], [150, 70, '#bcd4ff', 3], [170, 30, '#cfe0ff', 2], [60, 85, '#e8f0ff', 2], [110, 85, '#cfe0ff', 3]], sol: [185, 95, false] };
	V.helice.ceu = {
		texto: 'Perto da Nebulosa da Hélice, o céu teria um anel enorme de gás em volta, azulado por dentro e avermelhado por fora, e bem no meio a anã branca: pequenininha, mas muito brilhante. O Sol, a 650 anos-luz, não apareceria.',
		legenda: 'Perto da Hélice: o anel de gás tomando o céu e a anã branca brilhando no meio.',
		aria: 'Um anel enorme de gás azulado e avermelhado tomando o céu, com uma estrelinha branca no meio; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['perto da Hélice', SOL_FRACO], estrelas: 60,
		nuvens: [[100, 55, 60, '#14304a', 0.35]], anel: [100, 55, 80, 42, '#3a8a9a', '#a84a5a'],
		brilhantes: [[100, 55, '#e8f4ff', 2]], sol: [182, 14, false] };
	V.tabby.ceu = {
		texto: 'Perto da Estrela de Tabby, o céu seria parecido com o nosso, cheio de estrelas comuns. A diferença é ela: de vez em quando, sem aviso, o brilho dela cai, e depois volta. O Sol, a 1.470 anos-luz, ficaria fraco demais para ver.',
		legenda: 'Perto da Estrela de Tabby: um céu comum, com ela apagando e acendendo de vez em quando.',
		aria: 'Céu estrelado comum com uma estrela grande que apaga e acende devagar; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['perto da Estrela de Tabby', SOL_FRACO], estrelas: 80,
		brilhantes: [[100, 50, '#fff0d8', 4, true]], sol: [30, 90, false] };
	V['omega-centauri'].ceu = {
		texto: 'No meio de Omega Centauri, o céu nunca fica escuro: são milhares de estrelas mais brilhantes que Vênus, para todo lado, amareladas e velhinhas. Dava para ler um livro à noite só com a luz delas! O Sol, a 17 mil anos-luz, nem de longe apareceria.',
		legenda: 'No meio de Omega Centauri: estrelas por todo o céu, tantas que a noite fica clara.',
		aria: 'Céu completamente tomado por milhares de estrelas amareladas, com um brilho no meio; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['no meio de Omega Centauri', SOL_INVISIVEL], fundo: '#14100a', estrelas: 1100, coresEstrelas: ['#fff0c8', '#ffe0a0', '#ffffff', '#ffc890'],
		nuvens: [[100, 55, 95, '#3a3018', 0.5]], sol: [20, 100, false] };
	V.betelgeuse.ceu = {
		texto: 'Se existisse um planeta perto de Betelgeuse, ela tomaria um pedaço enorme do céu, vermelha e fervendo. E as constelações seriam todas diferentes das nossas: Órion, por exemplo, nem existiria. O Sol, a 550 anos-luz, ficaria fraco demais para ver.',
		legenda: 'De um planeta perto de Betelgeuse: a estrela gigante ocupando um pedaço enorme do céu.',
		aria: 'Um pedaço enorme de uma estrela vermelha e fervendo tomando a esquerda do céu, com estrelas comuns em volta; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['de um planeta perto de Betelgeuse', SOL_FRACO], estrelas: 60,
		disco: [-30, 60, 95], brilhantes: [[160, 25, '#dfe8ff', 2]], sol: [178, 92, false] };
	V['eta-carinae'].ceu = {
		texto: 'Perto de Eta Carinae, o céu seria tomado pela Nebulosa de Carina, com nuvens rosas e pilares de poeira, e Eta brilhando mais que todas as outras estrelas juntas. O Sol, a 7.500 anos-luz, não apareceria.',
		legenda: 'Perto de Eta Carinae: as nuvens da Nebulosa de Carina e Eta brilhando no meio.',
		aria: 'Céu com nuvens rosas e alaranjadas e uma estrela muito brilhante no meio; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['perto de Eta Carinae', SOL_INVISIVEL], fundo: '#100812', estrelas: 60,
		nuvens: [[100, 65, 95, '#4a1a30', 0.55], [50, 30, 45, '#6a3a24', 0.45], [160, 40, 40, '#5a2a3a', 0.45]],
		brilhantes: [[110, 48, '#fff6e0', 4]], sol: [22, 15, false] };
	V.sirius.ceu = {
		texto: 'De um planeta em volta de Sirius, o Sol aparece! Ele seria uma estrela comum, mais ou menos tão brilhante quanto a Estrela Polar, do lado oposto do céu, entre as constelações da Águia e de Hércules. E a companheira Sirius B brilharia como uma estrela fortíssima.',
		legenda: 'De Sirius: o Sol aparece como uma estrela comum (dentro da mira), e Sirius B brilha forte.',
		aria: 'Céu estrelado com uma estrela branca muito brilhante à esquerda, Sirius B, e uma estrelinha amarela dentro de uma mira, o Sol.',
		hud: ['de um planeta em Sirius', 'o Sol: dá para ver!'], estrelas: 80,
		brilhantes: [[45, 35, '#e8f0ff', 4]], sol: [132, 60, true] };
	V.caranguejo.ceu = {
		texto: 'Dentro da Nebulosa do Caranguejo, o céu teria fiapos alaranjados e uma névoa azulada em volta, e o pulsar piscando no meio, 30 vezes por segundo, rápido demais para a gente perceber cada piscada. O Sol, a 6.500 anos-luz, não apareceria.',
		legenda: 'Dentro do Caranguejo: os fiapos e a névoa azulada, e o pulsar piscando sem parar no meio.',
		aria: 'Céu com nuvens alaranjadas e uma névoa azulada, e um pontinho azul piscando muito rápido no meio; uma mira amarela marca onde o Sol estaria, sem ele aparecer.',
		hud: ['dentro do Caranguejo', SOL_INVISIVEL], fundo: '#0a0814', estrelas: 50,
		nuvens: [[100, 55, 95, '#2a3a50', 0.45], [45, 40, 45, '#6a3418', 0.45], [160, 70, 45, '#5a2a14', 0.45], [100, 20, 30, '#4a3a14', 0.35]],
		brilhantes: [[100, 55, '#cfe0ff', 2, 'rapido']], sol: [180, 100, false] };
	V['proxima-centauri'].ceu = {
		texto: 'De Proxima b, o Sol aparece como uma estrela brilhante na constelação de Cassiopeia. O famoso "W" de Cassiopeia ganharia uma sexta estrela: o nosso Sol! E as vizinhas Alfa Centauri A e B brilhariam no céu mais forte que qualquer estrela que a gente vê daqui.',
		legenda: 'De Proxima b: o "W" de Cassiopeia ganha mais uma estrela, o Sol (dentro da mira), e Alfa Centauri A e B brilham forte.',
		aria: 'Céu estrelado com duas estrelas amarelas muito brilhantes à esquerda, Alfa Centauri A e B, e à direita a constelação de Cassiopeia em zigue-zague, com uma estrela amarela a mais na ponta, o Sol, dentro de uma mira.',
		hud: ['de Proxima b', 'o Sol: em Cassiopeia!'], estrelas: 70,
		linhas: [[112, 54], [125, 40], [137, 55], [150, 42], [163, 56], [176, 44]],
		brilhantes: [[50, 40, '#fff0b0', 4], [57, 45, '#ffd8a0', 3], [125, 40, '#ffffff', 1], [137, 55, '#ffffff', 1], [150, 42, '#ffffff', 1], [163, 56, '#ffffff', 1], [176, 44, '#ffffff', 1]], sol: [112, 54, true] };

	// ---------- Ouça de verdade ----------
	// gravações e sonificações de verdade (links para os sites da NASA e do observatório)
	var CHANDRA = 'https://chandra.harvard.edu/sound/';
	V.sol.sons = [{ titulo: 'Os sons do Sol', texto: 'O Sol vibra o tempo todo, por dentro. A sonda SOHO mediu essas vibrações e, acelerando 42 mil vezes, dá para ouvir o zumbido grave do coração do Sol.', url: 'https://svs.gsfc.nasa.gov/13011', fonte: 'NASA · sonda SOHO' }];
	// "audio": o som guardado no site (só a trilha de áudio, comprimida, das gravações da NASA,
	// que são de domínio público); sem "audio", o cartão é só um link para o site de lá
	V.terra.sons = [{ titulo: 'A canção da Terra', texto: 'Ondas de rádio em volta da Terra, captadas pelas sondas Van Allen. Elas soam como um coro de passarinhos de manhã cedo.', url: 'https://svs.gsfc.nasa.gov/11073', fonte: 'NASA · sondas Van Allen', audio: 'sons/terra.aac', duracao: 30.2 }];
	V.jupiter.sons = [{ titulo: 'Júpiter em som', texto: 'Os raios X das auroras de Júpiter e a luz infravermelha do planeta transformados em música: o som fica mais grave na faixa do meio e na Grande Mancha Vermelha.', url: CHANDRA + 'jupiter.html', fonte: 'NASA · telescópio Chandra', audio: 'sons/jupiter.aac', duracao: 32 }];
	V.saturno.sons = [{ titulo: 'Saturno em som', texto: 'Os dados de Saturno, do planeta e dos anéis, transformados em música pelos cientistas do telescópio Chandra.', url: CHANDRA + 'saturn.html', fonte: 'NASA · telescópio Chandra', audio: 'sons/saturno.aac', duracao: 25.6 }];
	V['sagitario-a'].sons = [{ titulo: 'O centro da galáxia em som', texto: 'A imagem do centro da Via Láctea vira música, lida da esquerda para a direita. O som cresce quando chega em Sagittarius A*.', url: CHANDRA + 'gcenter.html', fonte: 'NASA · telescópio Chandra', audio: 'sons/sagitario-a.aac', duracao: 64 }];
	V['eta-carinae'].sons = [{ titulo: 'Eta Carinae em som', texto: 'A imagem de Eta Carinae e do Homúnculo transformada em som pelos cientistas do telescópio Chandra.', url: CHANDRA + 'etacar.html', fonte: 'NASA · telescópio Chandra', audio: 'sons/eta-carinae.aac', duracao: 44 }];
	V.caranguejo.sons = [
		{ titulo: 'A nebulosa em som', texto: 'A imagem da nebulosa vira música, e um som de sino marca o lugar do pulsar.', url: CHANDRA + 'crab_chandra_nustar.html', fonte: 'NASA · telescópios Chandra e NuSTAR', audio: 'sons/caranguejo.aac', duracao: 40 },
		{ titulo: 'O pulsar de verdade', texto: 'Os pulsos de rádio do pulsar do Caranguejo, captados por um radiotelescópio e tocados como som: são tão rápidos (30 por segundo) que viram um zumbido.', url: 'https://www.jb.man.ac.uk/pulsar/Education/Sounds/sounds.html', fonte: 'Observatório Jodrell Bank' }];
})(window.VISUAIS_DADOS);