# Agência Andarilha · turismo espacial desde 2077

Site estático (HTML, CSS e JavaScript puro, sem build) da Bianca Cardador, publicado em
https://biancaccc.github.io pelo GitHub Pages (repositório `biancaccc/biancaccc.github.io`, branch `main`).
Uma viagem em pixel art pela Via Láctea: um embarque cinematográfico numa agência cyberpunk, a galáxia
com os destinos, uma página para cada destino, o passaporte espacial e uma cena de chegada em cada lugar.

## Como trabalhar com a Bianca

- **Responder sempre em português.** Ela aprova tudo olhando: mostre no navegador antes de dizer que está pronto.
- **Ela gosta de perguntas.** Quando uma escolha criativa estiver mesmo em aberto (personagem, lugar, variante),
  pergunte com opções e uma recomendação. Não pergunte o que é trivial ou já foi decidido.
- **Estética com vida.** Pixel art sempre animada, com luzes, cores lindas e detalhes; nada "chapado" ou
  "simples demais". Toda cena tem movimento ambiente e pequenas surpresas. Priorize o encanto de quem visita.
- **O nome dela sempre na tela:** "Bianca Cardador" escondido no cenário das cenas (pichação, plaquinha,
  assinatura, estêncil) e como crédito discreto nas páginas (`marca.js` já põe "por Bianca Cardador" em todas).
  **Exceção pedida por ela:** na recepção da agência não vai o nome; lá só tem o retrato dela no jornal.
- **Nunca redesenhe os sprites dos planetas dela** (`pixel/*.png`): só anime.
- **Ciência de verdade:** fenômenos, números e fatos têm que ser reais (ela rejeita "invencionice").
- Baixar arquivos da internet só com permissão dela.

## Mapa dos arquivos

- `index.html` + `viagem.js`: a capa, a decolagem e o mapa da galáxia (`DESTINOS`).
- `embarque.js`: o embarque antes da primeira viagem (rua cyberpunk com a gueixa no telão, recepção com totem
  e jornal no chão, guichê 11 com o robô ZÖ-11, passaporte e carteira na mesa, hangar, porta e cabine).
  Mostra só na primeira visita; `?embarque` no endereço mostra de novo.
- `chegada.js`: a cena de chegada em cada destino, vista da cabine: eventos reais no caminho, pouso (Mercúrio,
  Vênus, Marte) ou estação de alfândega (modelos anel, escudo e farol), um agente por destino (`AGENTES`) e o
  carimbo. Na Terra, a nave volta ao hangar 11 e é lavada se veio suja. Toca na primeira visita e a cada volta
  que chega num salto; `?chegada` (e `&evento=cometa` etc.) mostra de novo.
- `cabine.js`: a cabine da PX-01 (inspirada na Millennium Falcon), compartilhada pelo embarque e pelas chegadas.
  Mexa só aqui para mudar a cabine; carregue antes de `embarque.js` e `chegada.js`.
- `passaporte.js`: o passaporte espacial (carimbos, selos, bilhete de embarque, certificado).
- `transicao.js`: o salto na velocidade da luz entre as páginas. `radio.js`: o rádio da nave.
- `tempo-do-sol.js`: o tempo do Sol ao vivo (dados reais da NOAA/SWPC, lidos pelo navegador de quem visita):
  o visor da direita da cabine, a fala da torre na decolagem, o aviso do computador de bordo nas chegadas
  e o boletim no rádio. Sem resposta da NOAA, os visores dizem "sem sinal" (nunca inventa dado).
- `destinos.js`: as artes animadas dos destinos da galáxia. `visuais.js` + `visuais-dados.js`: animações,
  quizzes, linhas do tempo e o "céu visto daqui" das páginas. `nave.js`: o modelo 3D da nave.
- `estilo.css`: todo o estilo. `marca.js`: o símbolo, o selo e o crédito da autora.
- `idioma.js` + `en/`: a versão em inglês (botão PT | EN; nos scripts, `T('pt', 'en')`; os textos das páginas
  ficam em `en/<página>.js` e `en/comum.js`). Os letreiros pintados nas cenas ficam em português.
- **As luas** (`lua`, `io`, `europa`, `ganimedes`, `tita`, `encelado`, `mimas`, `miranda`, `tritao`): uma página
  cada, no padrão dos planetas, com pouso na chegada (o planeta-pai no céu, no tamanho real visto de lá). As artes
  `pixel/<lua>.png` foram desenhadas por código (`pixel/sprites.js` tem cópia delas). Para mexer numa lua: a página,
  `en/<lua>.js`, `visuais-dados.js` (fim do arquivo), `visuais.js` (animações das luas), `radio.js`, `chegada.js`
  (`AGENTES`, `SOLO_LUAS`, `SUJEIRAS`), `balanca.js`, `passaporte.js` (selos "Volta pelas luas" e "Sabe-tudo das luas").
- Para **adicionar um destino**, mexa em: a página HTML, `visuais-dados.js`, `visuais.js` (animações, `CICLOS`,
  total de quizzes), `destinos.js` (`ARTES`), `viagem.js` (`DESTINOS`, `CEU`, `ARTE_DO_DESTINO`),
  `passaporte.js` (`DESTINOS`, `ESTILOS`, `ICONES`, totais das conquistas), `radio.js`, `chegada.js`
  (`NOMES`, `AGENTES`) e os links do `noscript` em `index.html`.

## Cuidados no código

- Comentários com `//` na mesma linha de código já engoliram código duas vezes: prefira `/* */` ou o comentário
  numa linha própria.
- As cenas são pintadas pixel a pixel (`Pintura`, `rampa`, `poli`, `elip`...) num canvas de 270 px de altura e
  largura adaptável (480 a 640); o "miolo" de 480 px fica no meio (`OX`).
- Texto pequeno em perspectiva (`quadTex`) fica quebrado: desenhe letras e objetos pequenos à mão.

## Testar

Rode um servidor na pasta do projeto e abra `http://localhost:8765`:

```
python3 -m http.server 8765
```

Depois de testar, limpe o que os testes guardam no navegador (`localStorage`: `passaporteEspacial`,
`embarqueFeito`, `chegadas`, `naveSujeira`, `eventosVistos`, `tempoDoSol`; e no `sessionStorage`, `avisoSol`).

## Publicar e trabalhar em mais de um computador

- Antes de começar: `git pull` (traz o que foi feito no outro computador).
- Depois de terminar: `git add -A`, `git commit -m "..."` e `git push origin main`. Em um ou dois minutos o
  site no ar atualiza. O login do GitHub é sempre a Bianca quem faz.
- O site antigo, "Nosso sistema solar", está no primeiro commit (`c0f9c91`); a primeira publicação da Andarilha
  tem a tag `andarilha-publicada`.

## Ideias combinadas para as próximas sessões

Feito: **o tempo do Sol ao vivo** (`tempo-do-sol.js`), **a versão em inglês** e **as luas como destinos**
(com pouso).

**Encanto**
- **O céu de verdade na rua da agência:** a lua na fase real do dia e, de vez em quando, a Estação Espacial
  Internacional passando no céu no horário em que passaria de verdade.
- **O Disco de Ouro da PX-01:** a pessoa grava uma mensagem curta, que vira um disco dourado no passaporte e
  "viaja" junto.
- **Um companheiro na cabine:** escolher o ZÖ-11 ou um robozinho novo para a poltrona do copiloto, comentando
  as chegadas e reagindo aos eventos.

**Experiência (UI/UX)**
- **Celular:** testar o embarque e as chegadas no celular (em pé e deitado) e deixar os botões fáceis de tocar.
  Prioridade: num portfólio, o site costuma ser aberto primeiro no celular.
- **Primeira carga:** a rua e a recepção são pintadas pixel a pixel antes de aparecer; num computador fraco
  fica um tempo de tela preta. Uma telinha de carregamento no estilo da agência ("emitindo seu bilhete…").
- **Acessibilidade:** textos alternativos para leitor de tela, legendas para os sons importantes (o "ding" da
  senha, o alto-falante) e contraste nos textos pequenos (o modo "movimento reduzido" já existe).

**Portfólio**
- **Página "bastidores":** o processo do projeto (rascunhos, as escolhas como o DETRAN do futuro, as baleias e
  a gueixa, antes e depois, a paleta de cores). Combina com o crédito "feito por Bianca Cardador", que volta
  no fim do projeto (`CREDITOS = true` em `embarque.js`).
