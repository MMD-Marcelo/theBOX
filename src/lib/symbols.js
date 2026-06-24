// Símbolos e emojis com palavras-chave para busca.
// item: [caractere, "palavras chave"]  (kw vazio = busca só pelo proprio caractere)

// gera um intervalo de code points (inclusive) como itens sem keyword
function range(start, end) {
  const out = [];
  for (let cp = start; cp <= end; cp += 1) out.push([String.fromCodePoint(cp), ""]);
  return out;
}

export const CATEGORIES = [
  {
    label: "Setas",
    items: [
      ["←", "seta esquerda"], ["→", "seta direita"], ["↑", "seta cima"], ["↓", "seta baixo"],
      ["↔", "seta horizontal"], ["↕", "seta vertical"], ["↖", "seta diagonal"], ["↗", "seta diagonal"],
      ["↘", "seta diagonal"], ["↙", "seta diagonal"], ["⇒", "seta dupla"], ["⇐", "seta dupla"],
      ["⇑", "seta dupla"], ["⇓", "seta dupla"], ["⇄", "trocar setas"], ["⇅", "trocar setas"],
      ["➜", "seta"], ["➡", "seta"], ["➤", "seta cheia"], ["➥", "seta"], ["➦", "seta"], ["➨", "seta"],
      ["»", "seta aspas"], ["«", "seta aspas"], ["▲", "triangulo cima"], ["▼", "triangulo baixo"],
      ["◀", "triangulo esquerda play"], ["▶", "triangulo direita play"], ["↻", "recarregar girar"], ["↺", "girar"],
      ["⟲", "girar"], ["⟳", "girar"], ["⤴", "seta curva"], ["⤵", "seta curva"], ["↩", "voltar retorno"], ["↪", "avancar"],
    ],
  },
  {
    label: "Estrelas e formas",
    items: [
      ["★", "estrela cheia"], ["☆", "estrela vazia"], ["✦", "estrela brilho"], ["✧", "estrela"],
      ["✪", "estrela circulo"], ["❂", "estrela sol"], ["✶", "estrela"], ["✷", "estrela"], ["❄", "floco neve"],
      ["●", "circulo cheio bolinha"], ["○", "circulo vazio"], ["◉", "circulo alvo"], ["◍", "circulo"],
      ["■", "quadrado cheio"], ["□", "quadrado vazio"], ["▣", "quadrado"], ["▤", "quadrado"],
      ["◆", "losango"], ["◇", "losango vazio"], ["▪", "quadrado pequeno"], ["▫", "quadrado pequeno"],
      ["▬", "barra"], ["▮", "barra"], ["◢", "triangulo"], ["◣", "triangulo"], ["◤", "triangulo"], ["◥", "triangulo"],
      ["⬛", "quadrado preto"], ["⬜", "quadrado branco"], ["🔴", "circulo vermelho bolinha"], ["🟠", "circulo laranja"],
      ["🟡", "circulo amarelo"], ["🟢", "circulo verde"], ["🔵", "circulo azul"], ["🟣", "circulo roxo"], ["⚫", "circulo preto"], ["⚪", "circulo branco"],
    ],
  },
  {
    label: "Marcas e sinais",
    items: [
      ["✓", "check certo ok confirma"], ["✔", "check certo ok"], ["✗", "x errado cancela"], ["✘", "x errado"],
      ["☑", "checkbox marcado"], ["☐", "checkbox vazio"], ["☒", "checkbox x"], ["⚠", "aviso atencao alerta"],
      ["⛔", "proibido"], ["🚫", "proibido nao"], ["❗", "exclamacao importante"], ["❓", "interrogacao duvida"],
      ["❌", "x vermelho errado"], ["✅", "check verde ok"], ["➕", "mais soma"], ["➖", "menos"], ["➗", "dividir"],
      ["✚", "cruz mais"], ["†", "cruz"], ["‡", "cruz dupla"], ["⭕", "circulo vermelho certo"], ["〽", "marca"],
      ["♻", "reciclar reciclagem"], ["⚜", "flor de lis"], ["🔱", "tridente"], ["⚙", "engrenagem config"],
    ],
  },
  {
    label: "Moeda e comércio",
    items: [
      ["$", "dolar cifrao dinheiro"], ["€", "euro"], ["£", "libra"], ["¥", "iene yuan"], ["₿", "bitcoin cripto"],
      ["¢", "centavo"], ["₽", "rublo"], ["₩", "won"], ["₹", "rupia"], ["₴", "hryvnia"], ["₺", "lira"], ["₫", "dong"],
      ["₪", "shekel"], ["฿", "baht"], ["™", "trademark marca"], ["©", "copyright direitos"], ["®", "registrado"],
      ["℠", "service mark"], ["№", "numero"], ["%", "porcento porcentagem"], ["‰", "permil"],
    ],
  },
  {
    label: "Pontuação",
    items: [
      ["•", "bullet ponto lista"], ["·", "ponto medio"], ["…", "reticencias"], ["—", "travessao traco"],
      ["–", "hifen traco"], ["“", "aspas abre"], ["”", "aspas fecha"], ["‘", "aspas simples"], ["’", "apostrofo"],
      ["«", "aspas angular"], ["»", "aspas angular"], ["§", "secao paragrafo"], ["¶", "paragrafo"],
      ["&", "e comercial"], ["@", "arroba"], ["#", "hashtag cerquilha"], ["*", "asterisco"], ["~", "til"],
      ["^", "circunflexo"], ["_", "underline sublinhado"], ["|", "barra vertical pipe"], ["\\", "barra invertida"],
      ["¡", "exclamacao invertida"], ["¿", "interrogacao invertida"], ["†", "adaga"], ["‹", "menor"], ["›", "maior"],
    ],
  },
  {
    label: "Matemática",
    items: [
      ["±", "mais menos"], ["×", "vezes multiplicar"], ["÷", "dividir"], ["≠", "diferente"], ["≈", "aproximado"],
      ["≤", "menor igual"], ["≥", "maior igual"], ["∞", "infinito"], ["√", "raiz quadrada"], ["∛", "raiz cubica"],
      ["∑", "somatorio soma"], ["∏", "produtorio"], ["∫", "integral"], ["∂", "derivada parcial"], ["∆", "delta variacao"],
      ["∇", "nabla"], ["π", "pi"], ["µ", "micro mu"], ["°", "grau temperatura"], ["′", "minuto linha"], ["″", "segundo"],
      ["½", "meio metade"], ["¼", "um quarto"], ["¾", "tres quartos"], ["⅓", "um terco"], ["⅔", "dois tercos"],
      ["∈", "pertence"], ["∉", "nao pertence"], ["⊂", "subconjunto"], ["∪", "uniao"], ["∩", "intersecao"],
      ["∅", "vazio conjunto"], ["∀", "para todo"], ["∃", "existe"], ["¬", "negacao nao"], ["∧", "e logico"], ["∨", "ou logico"],
      ["≡", "identico"], ["∝", "proporcional"], ["∠", "angulo"], ["⊥", "perpendicular"], ["∥", "paralelo"],
    ],
  },
  {
    label: "Grego",
    items: [
      ["α", "alfa"], ["β", "beta"], ["γ", "gama"], ["δ", "delta"], ["ε", "epsilon"], ["ζ", "zeta"], ["η", "eta"],
      ["θ", "teta"], ["λ", "lambda"], ["μ", "mu"], ["π", "pi"], ["ρ", "ro"], ["σ", "sigma"], ["τ", "tau"],
      ["φ", "fi"], ["χ", "chi"], ["ψ", "psi"], ["ω", "omega"], ["Δ", "delta maiusculo"], ["Σ", "sigma maiusculo"],
      ["Ω", "omega maiusculo"], ["Φ", "fi maiusculo"], ["Π", "pi maiusculo"], ["Θ", "teta maiusculo"],
    ],
  },
  {
    label: "Música",
    items: [
      ["♪", "nota musical"], ["♫", "notas musica"], ["♬", "notas"], ["♩", "nota"], ["♭", "bemol"], ["♮", "bequadro"],
      ["♯", "sustenido"], ["🎵", "nota musica"], ["🎶", "notas musica"], ["🎼", "partitura"], ["🎤", "microfone"],
      ["🎧", "fone audio"], ["🎸", "guitarra violao"], ["🎹", "piano teclado"], ["🥁", "bateria tambor"], ["🎺", "trompete"], ["🎷", "saxofone"],
    ],
  },
  {
    label: "Jogos e cartas",
    items: [
      ["♠", "espadas naipe carta"], ["♥", "copas coracao naipe"], ["♦", "ouros naipe"], ["♣", "paus naipe"],
      ["♚", "rei xadrez"], ["♛", "rainha xadrez"], ["♜", "torre xadrez"], ["♝", "bispo xadrez"], ["♞", "cavalo xadrez"], ["♟", "peao xadrez"],
      ["⚀", "dado 1"], ["⚁", "dado 2"], ["⚂", "dado 3"], ["⚃", "dado 4"], ["⚄", "dado 5"], ["⚅", "dado 6"],
      ["🎲", "dado"], ["🎯", "alvo dardo"], ["🎮", "controle game jogo"], ["🕹", "joystick"], ["🎰", "caca niquel"], ["🃏", "coringa carta"],
    ],
  },
  {
    label: "Zodíaco",
    items: [
      ["♈", "aries zodiaco"], ["♉", "touro"], ["♊", "gemeos"], ["♋", "cancer"], ["♌", "leao"], ["♍", "virgem"],
      ["♎", "libra"], ["♏", "escorpiao"], ["♐", "sagitario"], ["♑", "capricornio"], ["♒", "aquario"], ["♓", "peixes"],
      ["⛎", "ofiuco"], ["☉", "sol"], ["☽", "lua"], ["☿", "mercurio"], ["♀", "venus feminino"], ["♂", "marte masculino"],
      ["⚥", "generos"], ["⚧", "trans"], ["☯", "yin yang"], ["☮", "paz"], ["✝", "cruz crista"], ["☪", "islamismo"], ["✡", "judaismo"],
    ],
  },
  {
    label: "Teclas e UI",
    items: [
      ["⌘", "command mac tecla"], ["⌥", "option alt mac"], ["⇧", "shift seta"], ["⌃", "control ctrl"],
      ["⏎", "enter return"], ["⏏", "ejetar"], ["⌫", "backspace apagar"], ["⌦", "delete"], ["⎋", "escape esc"],
      ["⇪", "capslock"], ["⇥", "tab"], ["␣", "espaco"], ["⏯", "play pause"], ["⏭", "proximo"], ["⏮", "anterior"],
      ["⏩", "avancar rapido"], ["⏪", "voltar rapido"], ["⏫", "subir"], ["⏬", "descer"], ["⏸", "pausa"], ["⏹", "parar stop"], ["⏺", "gravar rec"],
      ["🔍", "lupa buscar"], ["🔒", "cadeado fechado"], ["🔓", "cadeado aberto"], ["🔔", "sino notificacao"], ["🔕", "sino mudo"],
    ],
  },
  {
    label: "Rostos",
    items: [
      ...range(0x1f600, 0x1f64f),
      ["😀", "feliz sorriso rosto"], ["😂", "rindo chorando lagrima"], ["🤣", "rolando rindo"], ["😊", "feliz fofo"],
      ["😍", "amor apaixonado coracao olhos"], ["😘", "beijo"], ["😎", "legal oculos"], ["🤔", "pensando duvida"],
      ["😴", "dormindo sono"], ["😭", "chorando triste"], ["😡", "raiva bravo nervoso"], ["🥳", "festa comemorar"],
      ["😱", "medo grito susto"], ["🤩", "uau incrivel estrela"], ["🙄", "revirar olhos"], ["🤤", "baba fome"],
      ["💀", "caveira morte"], ["👻", "fantasma"], ["🤡", "palhaco"], ["💩", "coco merda"], ["👽", "alien et"],
      ["🤖", "robo bot"], ["🎃", "abobora halloween"], ["😇", "anjo santo"], ["🥶", "frio congelando"], ["🥵", "calor quente"],
      ["🤯", "explodir mente"], ["🤮", "vomito enjoo"], ["🤬", "xingando raiva"], ["🥺", "suplica fofo pidao"],
    ],
  },
  {
    label: "Gestos e pessoas",
    items: [
      ["👍", "joinha like positivo"], ["👎", "negativo deslike"], ["👌", "ok joia"], ["✌", "paz vitoria"],
      ["🤞", "dedos cruzados sorte"], ["🤟", "amor rock"], ["🤙", "ligar shaka"], ["👏", "palmas aplauso"],
      ["🙏", "reza obrigado por favor"], ["💪", "forte musculo"], ["🤝", "aperto mao acordo"], ["✋", "mao pare"],
      ["👋", "tchau ola aceno"], ["🤚", "mao"], ["🖐", "mao espalmada"], ["🤲", "maos"], ["👐", "maos abertas"],
      ["🙌", "maos comemora"], ["👀", "olhos olhando"], ["👁", "olho"], ["🧠", "cerebro mente"], ["👤", "pessoa silhueta"],
      ["👥", "pessoas"], ["🫶", "coracao maos amor"], ["🤌", "dedos italiano"], ["☝", "dedo cima"], ["👇", "dedo baixo"],
      ["👈", "dedo esquerda"], ["👉", "dedo direita"],
    ],
  },
  {
    label: "Corações e amor",
    items: [
      ["❤", "coracao vermelho amor"], ["🧡", "coracao laranja"], ["💛", "coracao amarelo"], ["💚", "coracao verde"],
      ["💙", "coracao azul"], ["💜", "coracao roxo"], ["🖤", "coracao preto"], ["🤍", "coracao branco"], ["🤎", "coracao marrom"],
      ["💔", "coracao partido"], ["❣", "coracao exclamacao"], ["💕", "dois coracoes"], ["💞", "coracoes girando"],
      ["💓", "coracao batendo"], ["💗", "coracao crescendo"], ["💖", "coracao brilho"], ["💘", "coracao flecha"], ["💝", "coracao presente"],
      ["💟", "coracao decoracao"], ["♥", "coracao naipe"], ["💋", "beijo boca"], ["💌", "carta amor"],
    ],
  },
  {
    label: "Animais e natureza",
    items: [
      ["🐶", "cachorro cao dog"], ["🐱", "gato cat"], ["🦊", "raposa"], ["🐻", "urso"], ["🐼", "panda"], ["🐨", "coala"],
      ["🦁", "leao"], ["🐯", "tigre"], ["🐸", "sapo"], ["🐵", "macaco"], ["🐔", "galinha"], ["🐧", "pinguim"],
      ["🦅", "aguia passaro"], ["🦄", "unicornio"], ["🐝", "abelha"], ["🦋", "borboleta"], ["🐢", "tartaruga"],
      ["🐍", "cobra"], ["🐙", "polvo"], ["🦈", "tubarao"], ["🐬", "golfinho"], ["🐳", "baleia"], ["🐠", "peixe"],
      ["🐴", "cavalo"], ["🐮", "vaca boi"], ["🐷", "porco"], ["🐰", "coelho"], ["🐭", "rato"], ["🦉", "coruja"],
      ["🌵", "cacto"], ["🌲", "arvore pinheiro"], ["🌳", "arvore"], ["🌴", "palmeira coqueiro"], ["🌸", "flor cerejeira"],
      ["🌹", "rosa flor"], ["🌻", "girassol"], ["🌷", "tulipa"], ["🌺", "flor"], ["🍀", "trevo sorte"], ["🍁", "folha outono"],
      ["🌞", "sol"], ["🌙", "lua noite"], ["⭐", "estrela"], ["🌟", "estrela brilho"], ["🌈", "arco iris"], ["⚡", "raio energia"],
      ["🔥", "fogo"], ["💧", "agua gota"], ["🌊", "onda mar"], ["❄", "neve frio floco"], ["☃", "boneco neve"],
    ],
  },
  {
    label: "Comida e bebida",
    items: [
      ["🍕", "pizza"], ["🍔", "hamburguer lanche"], ["🍟", "batata frita"], ["🌭", "cachorro quente"], ["🌮", "taco"],
      ["🌯", "burrito"], ["🍿", "pipoca"], ["🍩", "rosquinha donut"], ["🍪", "biscoito cookie"], ["🍰", "bolo fatia"],
      ["🎂", "bolo aniversario"], ["🧁", "cupcake"], ["🍫", "chocolate"], ["🍬", "bala doce"], ["🍭", "pirulito"],
      ["🍦", "sorvete"], ["🍨", "sorvete"], ["🍎", "maca fruta"], ["🍌", "banana"], ["🍉", "melancia"], ["🍓", "morango"],
      ["🍇", "uva"], ["🍊", "laranja"], ["🍋", "limao"], ["🍑", "pessego"], ["🍒", "cereja"], ["🥑", "abacate"],
      ["🍅", "tomate"], ["🌽", "milho"], ["🥕", "cenoura"], ["🍞", "pao"], ["🧀", "queijo"], ["🥚", "ovo"],
      ["🍺", "cerveja chopp"], ["🍻", "brinde cerveja"], ["🍷", "vinho taca"], ["🥂", "brinde champanhe"], ["☕", "cafe"],
      ["🍵", "cha"], ["🥤", "refrigerante copo"], ["🧃", "suco caixinha"], ["🍴", "garfo faca talher"], ["🥄", "colher"],
    ],
  },
  {
    label: "Esportes e atividades",
    items: [
      ["⚽", "futebol bola"], ["🏀", "basquete"], ["🏈", "futebol americano"], ["⚾", "beisebol"], ["🎾", "tenis"],
      ["🏐", "volei"], ["🏉", "rugby"], ["🎱", "sinuca bilhar"], ["🏓", "ping pong"], ["🏸", "badminton"], ["🥊", "boxe luva"],
      ["🥋", "artes marciais"], ["⛳", "golfe"], ["🎣", "pescar"], ["🎯", "alvo dardo"], ["🎳", "boliche"], ["🎮", "game controle"],
      ["🎲", "dado"], ["🏆", "trofeu premio"], ["🥇", "medalha ouro primeiro"], ["🥈", "medalha prata"], ["🥉", "medalha bronze"],
      ["🏅", "medalha"], ["🎖", "medalha honra"], ["🚴", "ciclismo bike"], ["🏊", "natacao"], ["🏃", "corrida correr"], ["⛷", "esqui"],
    ],
  },
  {
    label: "Viagem e lugares",
    items: [
      ["🚗", "carro"], ["🚕", "taxi"], ["🚙", "suv carro"], ["🚌", "onibus"], ["🚎", "trolebus"], ["🏎", "corrida formula1"],
      ["🚓", "policia viatura"], ["🚑", "ambulancia"], ["🚒", "bombeiro caminhao"], ["🚜", "trator"], ["🛵", "scooter moto"],
      ["🏍", "moto"], ["🚲", "bicicleta bike"], ["✈", "aviao"], ["🚀", "foguete rocket"], ["🚁", "helicoptero"], ["⛵", "veleiro barco"],
      ["🚤", "lancha barco"], ["🚢", "navio"], ["🚂", "trem locomotiva"], ["🚆", "trem"], ["🗺", "mapa"], ["🧭", "bussola"],
      ["🏠", "casa"], ["🏡", "casa jardim"], ["🏢", "predio escritorio"], ["🏥", "hospital"], ["🏦", "banco"], ["🏨", "hotel"],
      ["🏫", "escola"], ["🏪", "loja conveniencia"], ["⛪", "igreja"], ["🗽", "estatua liberdade"], ["🗼", "torre"], ["🌆", "cidade"],
    ],
  },
  {
    label: "Objetos e tech",
    items: [
      ["💻", "notebook laptop computador"], ["🖥", "monitor pc"], ["📱", "celular smartphone"], ["⌨", "teclado"],
      ["🖱", "mouse"], ["🖨", "impressora"], ["💾", "disquete salvar"], ["💿", "cd disco"], ["📀", "dvd"], ["🎧", "fone headset"],
      ["📷", "camera foto"], ["📸", "camera flash"], ["🎥", "filmadora video"], ["📺", "tv televisao"], ["📻", "radio"],
      ["🔋", "bateria"], ["🔌", "tomada plug"], ["💡", "ideia lampada"], ["🔦", "lanterna"], ["🔍", "lupa buscar"], ["🔎", "lupa"],
      ["🔒", "cadeado fechado"], ["🔓", "cadeado aberto"], ["🔑", "chave"], ["🗝", "chave antiga"], ["⚙", "engrenagem config"],
      ["🛠", "ferramentas"], ["🔧", "chave inglesa"], ["🔨", "martelo"], ["📌", "alfinete fixar"], ["📎", "clipe anexo"],
      ["✏", "lapis editar"], ["🖊", "caneta"], ["📝", "nota escrever"], ["📁", "pasta"], ["📂", "pasta aberta"], ["🗑", "lixeira deletar"],
      ["💰", "dinheiro saco"], ["💳", "cartao credito"], ["🎁", "presente"], ["🏆", "trofeu"], ["🚀", "foguete lancar"], ["📦", "caixa pacote"],
      ["📧", "email"], ["📨", "mensagem"], ["📞", "telefone"], ["⏰", "despertador alarme"], ["⌚", "relogio pulso"], ["🕐", "relogio hora"],
    ],
  },
];
