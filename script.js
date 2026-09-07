// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBykDF5TNKQHejUJTp-ue7s5CKfpJp1HV0",
  authDomain: "mestre-471a0.firebaseapp.com",
  databaseURL: "https://mestre-471a0-default-rtdb.firebaseio.com",
  projectId: "mestre-471a0",
  storageBucket: "mestre-471a0.firebasestorage.app",
  messagingSenderId: "142996111628",
  appId: "1:142996111628:web:c3785e54588632f468c929",
  measurementId: "G-XWSF04WNVW"
};
firebase.initializeApp(firebaseConfig);
const bancoDados = firebase.database();
const CARTAS_FRASE = [
    "O que arruinou meu último encontro?",
    "___ é a pior coisa do mundo, mas eu adoro.",
    "A nova moda entre os jovens é ___.",
    "Por que estou chorando no chuveiro?",
    "O ingrediente secreto da minha avó é ___.",
    "A cura para a depressão foi descoberta: ___.",
    "Ninguém espera por ___ na ceia de Natal.",
    "O que os alienígenas acharam mais estranho na Terra?",
    "O que é mais emo?",
    "Como eu perdi minha virgindade?",
    "Atirei o pau no gato / Mas o gato não morreu / Dona Chica admirou-se / Do que o gato deu.",
    "Papai, por que mamãe está chorando?",
    "Durante sua infância, Salvador Dalí fez centenas de pinturas de ___.",
    "Em 1.000 anos, quando o dinheiro de papel for uma memória distante, como nós iremos pagar por bens e serviços?",
    "O Museu de História Natural acabou de lançar uma exibição interativa sobre ___.",
    "A Infraero agora proíbe ___ em aviões.",
    "É lamentável que os jovens hoje em dia estão todos se envolvendo com ___.",
    "A CBF baniu ___ do futebol por dar aos jogadores uma vantagem injusta.",
    "Qual é o prazer secreto do Batman?",
    "O próximo livro de J.K. Rowling: Harry Potter e a Câmara de ___.",
    "Me desculpe, Professor, mas eu não consegui fazer meu dever de casa por causa da ___.",
    "O que eu trouxe do Paraguai?",
    "É impossível comer um só!",
    "Qual é minha anti-droga?",
    "Enquanto os Estados Unidos disputavam com a União Soviética para ver quem chegava primeiro à Lua, o governo do México destinava milhões de pesos em pesquisas sobre ___.",
    "No novo Filme Original do Disney Channel, Hannah Montana luta com ___ pela primeira vez.",
    "Qual meu poder secreto?",
    "Qual a dieta do momento?",
    "O que Vin Diesel comeu no jantar?",
    "Quando o Faraó se mostrou irredutível, Moisés invocou uma praga de ___.",
    "Como eu estou afirmando meu status de relacionamento?",
    "Dizem que na prisão do Carandiru se podia trocar 200 cigarros por ___.",
    "Depois do terremoto, Sean Penn trouxe ___ para o povo do Haiti.",
    "Ao invés de carvão nos dias de hoje Papai Noel dá às crianças malcriadas ___.",
    "A vida dos índios Tapajós foi mudada totalmente quando o homem branco os apresentou a ___.",
    "O que o governo está fazendo para as crianças da favela obterem sucesso?",
    "Talvez ela tenha nascido com isso. Talvez seja ___.",
    "Nos momentos finais de Michael Jackson, ele pensou ___.",
    "Pessoas brancas gostam de ___.",
    "Por que estou todo dolorido?",
    "Um jantar romântico a luz de velas não está completo sem ___.",
    "O que eu preciso trazer do passado para convencer as pessoas que sou um poderoso mago?",
    "LIGUE AGORA PARA 011-1406 E ADQUIRA JÁ O SEU ___.",
    "A viagem de estudo da classe foi completamente arruinada por causa de ___.",
    "Qual é o melhor amigo da mulher?",
    "Querida Márcia, eu estou tendo problemas com ___ e gostaria de seu conselho.",
    "Quando eu for Presidente do Brasil, eu vou criar o Ministério de ___.",
    "O que meus pais estão escondendo de mim?",
    "O que nunca falha para se tentar animar uma festa?",
    "O que se melhora com a idade?",
    "Bom até a última gota.",
    "Eu tenho 99 problemas mas ___ não é um deles.",
    "Pegadinha do Malandro!",
    "O novo reality show da MTV tem oito celebridades decadentes vivendo com ___.",
    "O que vovó acharia perturbador, porém ao mesmo tempo elegante?",
    "Durante o sexo, eu gosto de pensar sobre ___.",
    "O que fez meu último relacionamento terminar?",
    "Qual é o próximo McLanche Feliz?",
    "Que som é esse?",
    "O que tem de tonelada no Paraíso?",
    "Porque eu não consigo dormir a noite?",
    "E é assim que eu quero morrer.",
    "Eu ainda não sei com quais armas a III Guerra Mundial será lutada, mas a IV Guerra Mundial será lutada com ___.",
    "Que cheiro é esse?",
    "Porque ___ é tão grudento?",
    "O que sempre faz com que você consiga transar?",
    "O que ajuda Obama a relaxar?",
    "Assim expira o mundo / Assim expira o mundo / Não com uma explosão, mas com ___.",
    "Chegando a Broadway esta temporada: ___ O Musical.",
    "Mas antes de matá-lo Sr. Bond, Eu devo lhe mostrar ___.",
    "Estudos mostram que ratos de laboratório navegam através de labirintos 50% mais rápido, após serem expostos a ___.",
    "Daqui a pouco na ESPN 2: O Campeonato Mundial de ___.",
    "Quando eu for bilionário, eu irei erguer uma estátua de 20 metros para comemorar ___.",
    "Guerra! Pra que serve?",
    "O que me causa gases incontroláveis?",
    "Que cheiro têm as pessoas velhas?",
    "O que eu estou abandonando pela quaresma?",
    "A medicina alternativa está reconhecendo os poderes curativos de ___.",
    "Os E.U.A. começaram a enviar ___ de pára-quedas para as crianças do Afeganistão.",
    "O que é que José Sarney prefere?",
    "O que você não espera encontrar em sua comida chinesa?",
    "Eu bebo para esquecer ___.",
    "Toca aqui, irmão. ___",
    "Dizem que o prato preferido de Vladmir Putin é recheado com ___.",
    "Qual é a próxima dupla dinâmica de super-heróis/ajudantes?",
    "É verdade, eu matei ___.",
    "Como, você pergunta? Com ___.",
    "E o Oscar de melhor ___ vai para ___.",
    "Para o meu próximo truque eu vou tirar um ___ da minha ___.",
    "Passo 1: ___ / Passo 2: ___ / Passo 3: Lucro.",
    "Quando eu estava viajando no ácido, ___ se tornou ___.",
    "___ é um caminho sem volta que leva a ___.",
    "Em um mundo devastado por ___, nosso único conforto é ___.",
    "No novo filme de M. Night Shyamalan, Bruce Willis descobre que ___ era na verdade ___ todo esse tempo.",
    "Eu realmente nunca entendi ___ até encontrar ___.",
    "Rede Vida apresenta a estória de ___.",
    "___ + ___ = ___",
    "Faça um haiku."
];
const CARTAS_RESPOSTA = [
    "Uma maldição cigana.",
    "Um momento de silêncio.",
    "Uma festa onde só tem macho.",
    "Um policial honesto sem nada a perder.",
    "A Fome.",
    "Uma bacteria comedora de carne.",
    "Cobras voadoras taradas.",
    "Cagar para o Terceiro Mundo.",
    "Mandar mensagens sexuais por SMS.",
    "Metamorfos.",
    "Estrelas Pornôs.",
    "Estuprar e pilhar.",
    "72 virgens.",
    "Um tiroteio.",
    "Um paradoxo de viagem no tempo.",
    "Uma autêntica comida Mexicana.",
    "Bijuterias.",
    "Consultores.",
    "Dívidas astronômicas.",
    "Problemas com o papai.",
    "O Selo de Aprovação de Donald Trump.",
    "Injeções Hormonais",
    "Cair no ridículo.",
    "O milagre do nascimento.",
    "Derrubar o candelabro sobre seus inimigos e subir pela corda.",
    "Botar um ovo.",
    "Compartilhar agulhas",
    "O Ex-Presidente George W. Bush.",
    "Ficar pelado e assistir a Nickelodeon.",
    "Meleca de nariz.",
    "Mandando ver.",
    "Nu frontal Completo.",
    "Fingir se importar.",
    "A inevitável destruição do universo.",
    "Classe Média Sofre.",
    "Deveres conjugais.",
    "Roberval, o ladrão de chocolate.",
    "Desodorante para corpo AXE.",
    "Sangue de Cristo.",
    "Um terrível acidente com depilação a laser.",
    "BATMAN!!!",
    "Agricultura.",
    "Um retardado fortão.",
    "Seleção Natural.",
    "Abortos clandestinos.",
    "Comer todos os biscoitos antes da feira beneficente.",
    "Os braços da Michelle Obama.",
    "O World of Warcraft.",
    "Furar olho.",
    "Obesidade.",
    "Vídeos homoeróticos de jogadores de Vôlei.",
    "Tétano.",
    "Uma exibição sexual.",
    "Torção testicular.",
    "Rodízio de carnes por R$ 9,90.",
    "Pizza de chocolate.",
    "Kanye West.",
    "Queijo Quente.",
    "Ataque de Velociraptors.",
    "Tirar a camisa.",
    "Esmegma.",
    "Alcolismo.",
    "Um homem de meia idade de patins.",
    "Um abraço dos Ursinhos Carinhosos.",
    "Beber, Cair e Levantar.",
    "Um Pirulitão.",
    "Auto-piedade.",
    "Crianças com coleiras.",
    "Preliminares meia-boca.",
    "A Bíblia Sagrada.",
    "Pornô Alemão Sado-Masô.",
    "Pegar fogo.",
    "Gravidez adolescente.",
    "Gandhi.",
    "Deixar uma mensagem de voz bizarra.",
    "Ganchos.",
    "Representantes do SAC.",
    "Uma ereção que dura mais de 4 horas.",
    "Meus genitais.",
    "Pegar mulher na clínica de abortos.",
    "Ciência.",
    "Não reciprocar no sexo oral.",
    "Passarinho que não voa.",
    "Uma boa cheirada.",
    "Afogamento simulado.",
    "Um café da manhã balanceado.",
    "Escolas públicas.",
    "Literalmente tirar doce de crianças.",
    "O Criança Esperança.",
    "Uma passada de mão clandestina.",
    "Notas de Post-It passivo-agressivas.",
    "A equipe de Ginástica Olímpica da China.",
    "Mude para a Porto Seguro®.",
    "Urinar um pouquinho.",
    "Vídeo caseiro da Ana Maria Braga chorando embaixo da mesa.",
    "Polução Noturna.",
    "Os judeus.",
    "Minha bunda.",
    "Coxas poderosas.",
    "Paquerar com idosos.",
    "Pato Purific, confie no bico do pato!",
    "Uma suave passada de mão na coxa.",
    "Tensão sexual.",
    "O fruto proibido.",
    "Esqueleto do He-Man.",
    "Comida para gatos Whiskas®.",
    "Ser rico.",
    "Doce, doce vingança.",
    "Tucanos.",
    "Um jumento com flatulência.",
    "Natalie Portman.",
    "Dar uma pegadinha.",
    "Pilotos Kamikazes",
    "Sean Connery.",
    "A Agenda Gay.",
    "O Retirante Nordestino.",
    "Um falcão de caça.",
    "Coroinhas.",
    "Jarbas do Tang.",
    "Ficar com tanta raiva que lhe dá uma ereção.",
    "Amostras grátis.",
    "Um grande fuzuê a troco de nada.",
    "Fazer a coisa certa.",
    "A Lei do Ventre Livre.",
    "Lactação.",
    "Paz mundial.",
    "RoboCop.",
    "Malandragem.",
    "Justin Bieber.",
    "Oompa-Loompas.",
    "Um forró inapropriado.",
    "Puberdade.",
    "Fantasmas.",
    "Uma cirurgia de implante de silicone nos seios que ficou assimétrica.",
    "Mãos de seresteiro.",
    "Dar uma dedada.",
    "Boris Casoy prendendo o saco na porta do chuveiro.",
    "Danoninho®.",
    "Brutalidade Policial.",
    "Joaquim Silvério dos Reis.",
    "Pré-adolescentes.",
    "Tirar o escalpo.",
    "Segurar um risinho ao ouvir menção do Peru.",
    "Tuitar.",
    "Esperar um arroto e acabar vomitando.",
    "Darth Vader.",
    "Ritalina™",
    "Uma punheta meia-boca.",
    "Células-Tronco.",
    "Exatamente o que você esperava.",
    "Decote de bom-gosto.",
    "Sexo de Pandas.",
    "Uma lobotomia com um picador de gelo.",
    "Tom Cruise.",
    "Herpes Labial.",
    "Esperma de Baleia.",
    "Mendigos sem-teto.",
    "A mão-naquilo, aquilo-na-mão.",
    "Incesto.",
    "O Pac-Man gozando incontrolavelmente.",
    "Um mímico tendo um ataque do coração.",
    "Ted Boy Marino.",
    "Deus.",
    "Lavar bem as dobrinhas.",
    "Chuva dourada.",
    "Emoções.",
    "Lamber a comida pra marcar como sua.",
    "Nova Schin.",
    "A Placenta.",
    "Combustão Humana Espontânea.",
    "Amizade Colorida.",
    "Pintura com os dedos.",
    "Cheiro de gente velha.",
    "Morrer de disenteria.",
    "Meus demônios internos.",
    "Uma arma de água cheia de xixi de gato.",
    "Hermes da Fonseca.",
    "Dormir de conchinha.",
    "A erva.",
    "Briga de Galo.",
    "Fogo amigo.",
    "Fernando Henrique Cardoso.",
    "Uma festa de aniversário fracassada.",
    "Uma mulata safada.",
    "Olimpíadas de matemática.",
    "Um pônei.",
    "Francisco Cuoco.",
    "Cavalgando em direção ao Pôr do Sol.",
    "Um M. Night Shyamalan plot twist.",
    "Cabelo pixaim.",
    "Destruição mútua assegurada.",
    "Pedófilos.",
    "Levedura.",
    "Roubo de Túmulos.",
    "Comer o último bisão conhecido.",
    "Catapultas.",
    "Gente Pobre.",
    "Liberdade, ainda que tardia.",
    "Xaxado.",
    "A Força.",
    "Chicoteando a bunda dela.",
    "Design Inteligente.",
    "Bucho-furado.",
    "AIDS.",
    "Fotos de Seios.",
    "O Super Homem de Nietzche.",
    "Sarah Palin.",
    "American Gladiators.",
    "Ficar realmente chapado.",
    "Cientologia.",
    "Inveja do penis.",
    "Rezar até deixar de ser gay.",
    "Se curtir.",
    "Dois anões cagando em um balde.",
    "A KKK.",
    "Genghis Khan.",
    "Metanfetaminas.",
    "Servidão.",
    "Não falar com estranhos.",
    "A Bop It.",
    "Compensação.",
    "Arremesso de Anão.",
    "A carreira de ator de Shaquille O'Neal.",
    "Bukkake.",
    "Brilho do Sol e Arco-Iris.",
    "Empinar.",
    "Uma vida completa de tristeza.",
    "Um macaco fumando charuto.",
    "Justiça de um Vigilante.",
    "Racismo.",
    "Enchente de verão.",
    "O Testículo perdido de Lance Armstrong.",
    "Tirar um sarro.",
    "Os terroristas.",
    "Britney Spears aos 55 anos.",
    "Atitude.",
    "Começar a cantar e dançar do nada.",
    "Lepra.",
    "Gloryholes.",
    "Estar com os faróis acesos.",
    "Dental Dams.",
    "Limpeza étnica.",
    "O coração de uma criança.",
    "A vagina da Raquel de Queiroz.",
    "Os escravos de Jó jogando caxangá.",
    "Filhotes!",
    "O períneo; o meinho; a periferia do parque de diversões.",
    "A mão invisível.",
    "Acordar seminu no estacionamento do Bob's.",
    "Ouvir atentamente.",
    "Esperando até o casamento.",
    "Estupidez inconcebível.",
    "Euphoria™ por Calvin Klein.",
    "Repassar o presente.",
    "Auto canibalismo.",
    "Disfunção erétil.",
    "Minha coleção de brinquedinhos eróticos.",
    "O Papa.",
    "Pessoas Brancas.",
    "Tentáculo Hentai.",
    "Boris Casoy vomitando compulsivamente",
    "Muito gel de cabelo.",
    "Seppuku.",
    "Dupla do mesmo sexo de patinação no gelo.",
    "enquanto aranhas eclodem de seu cérebro e saem por seus canais lacrimais.",
    "Trapaceando nas Paraolimpiadas.",
    "Carisma.",
    "Keanu Reeves.",
    "Sean Penn.",
    "Nickelback.",
    "Uma espiadinha.",
    "Cagando e andando. Pra sempre.",
    "Mestruação.",
    "Crianças com cancer no reto.",
    "Uma surpresa salgadinha.",
    "Sul.",
    "A violação dos nossos mais básicos direitos.",
    "YOU MUST CONSTRUCT ADDITIONAL PYLONS.",
    "Estupro em encontro.",
    "Ser fabuloso.",
    "Necrofilia.",
    "Cavalaria.",
    "Órfãos adoráveis.",
    "Mola Maluca enrolada.",
    "Aquela parada que eletrocuta seu abdomen.",
    "Centauros.",
    "Biscoito Passatempo.",
    "MechaHitler.",
    "O verdadeiro significado do Natal.",
    "Expelir pedra nos rins.",
    "Beakman do Mundo de Beakman.",
    "Putas.",
    "Cagadas de fogo.",
    "Estrogênio.",
    "Clareamento anal.",
    "Pessoas Negras.",
    "muito deficientes.",
    "Outro maldito filme de vampiro.",
    "burrito de café-da-manhã.",
    "Michael Jackson.",
    "Melhorias cibernéticas.",
    "Caras que não ligam.",
    "Cobertores com varíola.",
    "Masturbação.",
    "Insinuações classistas.",
    "Peido de buceta.",
    "Esconder uma ereção.",
    "Calcinhas comestíveis.",
    "Viagra®.",
    "Sopa que está muito quente.",
    "O Profeta Maomé (que Alá o abençoe).",
    "Sexo surpresa!",
    "Promoção da semana do Subway.",
    "Beber sozinho.",
    "Mão furada.",
    "Multiplos ferimentos de faca.",
    "Se cagar todo.",
    "Abuso infantil.",
    "Contas anais.",
    "Casualidade civil.",
    "Tirar de dentro.",
    "Robert Downey, Jr.",
    "Comida de cavalo.",
    "Um chapeu realmente maneiro.",
    "Kim Jong-il.",
    "Um pentenho rebelde.",
    "Fraternidades judias.",
    "Uma minoria minúscula.",
    "Meter na bunda.",
    "Dar comida a Cláudia Jimenez.",
    "Ensinar um robo a amar.",
    "Uma lata de chute-no-traseiro.",
    "Um moinho cheio de corpos.",
    "Conde Chocula.",
    "Usar a cueca no lado B.",
    "Raio da Morte.",
    "Telhado de vidro.",
    "Um isopor cheio de órgãos humanos.",
    "O sonho americano.",
    "Barris de cerveja.",
    "Peido molhado.",
    "Volta atrás.",
    "Bebês mortos.",
    "Prepúcio.",
    "Solos de saxofone.",
    "Italianos.",
    "Um feto.",
    "Atirar pra cima com um rifle enquanto cercado por porcos selvagens.",
    "José Sarney.",
    "Amputados.",
    "Eugenia.",
    "Meu status de relacionamento.",
    "Christopher Walken.",
    "Abelhas?",
    "Harry Potter erotica.",
    "Ensino Médio.",
    "Ficar Bebâdo com Cepacol.",
    "Nazistas.",
    "10 gramas de heroína mexicana.",
    "Stephen Hawking falando palavrão.",
    "Pais mortos.",
    "Permanência do objeto.",
    "Polegares Opositores.",
    "Questões do vestibular racistas.",
    "Bla-bla-bla.",
    "Explosões.",
    "Boa noite cinderela.",
    "Dando 110%.",
    "Motoserras para mãos.",
    "Cheirar cola.",
    "Minha vagina.",
    "Sua Alteza Real, Rainha Elizabeth II.",
    "Nicolas Cage.",
    "Boris Casoy sendo perseguido por uma revoada de urubus.",
    "Calça de cavalgada.",
    "A Trilha de Lágrimas.",
    "Concurso de Beleza Infantil.",
    "Repressão.",
    "Um assassinato cruel.",
    "Ser marginalizado.",
    "Goblins.",
    "Minha alma.",
    "Sedução.",
    "Música New Age.",
    "Esperança.",
    "A maior confusão.",
    "Um complexo de édipo.",
    "Hot Pockets®.",
    "Rev. Dr. Martin Luther King, Jr.",
    "Vikings.",
    "Gansos.",
    "Fazer bico.",
    "Um micropenis.",
    "Pessoas Gostosas.",
    "Aquecimento Global.",
    "Atropelamento.",
    "Voto das mulheres.",
    "Uma camisinha defeituosa.",
    "Você Decide.",
    "Crianças africanas.",
    "O Massacre da Candelária.",
    "Barack Obama.",
    "Asiáticos que não são bom em matemática.",
    "Velhinhos Japoneses.",
    "Trocar gentilesas.",
    "Heteronormatividade.",
    "Abrir o Mar Vermelho.",
    "Arnold Schwarzenegger.",
    "Boquete no carro.",
    "Um abdômen espetacular.",
    "Pudim de Figo.",
    "Um zoológico deprimido",
    "Um saco de feijões mágicos.",
    "Uma tartaruga mordendo a cabeça do seu pênis.",
    "Escolhas erradas.",
    "Uma detonação termonuclear.",
    "Minha vida sexual.",
    "clitóris.",
    "Auschwitz.",
    "O Big Bang.",
    "Minas terrestres.",
    "Amigos que comem todos os aperitivos.",
    "Bodes comendo latas.",
    "A Dança da Fadinha Doce.",
    "Se masturbar em uma poça de lágrimas de crianças.",
    "Carne humana.",
    "Um tempo particular.",
    "O Quilombo dos Palmares.",
    "Piadas sobre o Holocausto na hora errada.",
    "Mulheres em comerciais de iogurte.",
    "Um mar de problemas.",
    "Estimulante masculino natural.",
    "Fantasias de madeireiro.",
    "Ser um puta dum feiticeiro.",
    "A voz do Morgan Freeman.",
    "Piercing genital.",
    "Travestis que enganam.",
    "Lutas de travesseiro sexys.",
    "Ovos.",
    "Vovó.",
    "Fricção.",
    "Estraga-prazeres.",
    "Peidando e andando.",
    "Ser um imbecil com crianças.",
    "Colocar armadilhas na casa para protegê-las de ladrões.",
    "Travesseiros Suecos.",
    "Morrer.",
    "O furacão Katrina.",
    "Os gays.",
    "A tolice dos homens.",
    "Homens.",
    "Os Amish.",
    "Ovos de Pterodáctilo.",
    "Dinâmicas de grupo.",
    "Um tumor no cérebro.",
    "Cartas Contra a Humanidade.",
    "O próprio medo.",
    "Lady Gaga.",
    "O leiteiro.",
    "Uma boca suja."
];
const ITENS_LOJA = [
    { id: 1, nome: "Espião", preco: 13, desc: "Abre um modal revelando quem jogou cada carta antes da votação." },
    { id: 2, nome: "Ditador", preco: 22, desc: "Garante a vitória imediata da carta que você escolher." },
    { id: 3, nome: "Veto", preco: 15, desc: "Concede imunidade contra qualquer ataque direto nesta rodada." },
    { id: 4, nome: "Sabotador", preco: 69, desc: "Destrói as cartas da mão de um oponente selecionado." },
    { id: 5, nome: "Mestre de Obras", preco: 12, desc: "Adiciona três cartas novas à sua mão imediatamente." },
    { id: 6, nome: "Roubo", preco: 56, desc: "Transfere um ponto de um jogador escolhido para você." },
    { id: 7, nome: "Censura", preco: 13, desc: "Bloqueia um adversário de participar da rodada atual." },
    { id: 8, nome: "Bomba Relógio", preco: 22, desc: "Reduz o tempo restante da fase atual para cinco segundos." },
    { id: 9, nome: "Reciclagem", preco: 15, desc: "Substitui todas as suas cartas atuais por cartas novas." },
    { id: 10, nome: "Segunda Chance", preco: 69, desc: "Remove sua carta da mesa e permite escolher outra." },
    { id: 11, nome: "Voto Duplo", preco: 12, desc: "Seu voto terá o peso duplicado na contagem final." },
    { id: 12, nome: "Inversão", preco: 56, desc: "Altera a regra para que a carta com menos votos vença." },
    { id: 13, nome: "Nova Frase", preco: 13, desc: "Sorteia uma frase preta completamente nova para a mesa." },
    { id: 14, nome: "Caos", preco: 22, desc: "Embaralha aleatoriamente as pontuações de toda a sala." },
    { id: 15, nome: "Anarquia", preco: 15, desc: "Elimina todos os votos que já foram computados na rodada." },
    { id: 16, nome: "Cegueira", preco: 69, desc: "Oculta o texto das cartas na mesa para todos os adversários." },
    { id: 17, nome: "Investidor", preco: 12, desc: "Rende pontos adicionais caso você vença esta rodada." },
    { id: 18, nome: "Silêncio", preco: 56, desc: "Impede todos os jogadores de acessarem a loja de itens." },
    { id: 19, nome: "Comunismo", preco: 13, desc: "Soma todos os pontos da sala e divide igualmente." },
    { id: 20, nome: "Limpa Trilhos", preco: 22, desc: "Encerra a rodada atual e inicia uma nova instantaneamente." }
];

let nomeJogador = "";
let jogadorAnfitriao = false;
let cartasNaMao = [];
let estadoDaSala = {};
let dadosDosJogadores = {};
let efeitosAtivos = { ditador: false, duplo: false, investidor: false };
let loopDoAnfitriao = null;


function exibirNotificacao(mensagem) {
    const elementoDiv = document.getElementById('notificacao');
    const elementoTexto = document.getElementById('texto-notificacao');
    elementoTexto.innerText = mensagem;
    elementoDiv.classList.remove('escondido');
    setTimeout(function() {
        elementoDiv.classList.add('escondido');
    }, 4000);
}

function alterarTela(idDaTela) {
    const todasAsTelas = document.querySelectorAll('.tela');
    for (let index = 0; index < todasAsTelas.length; index++) {
        todasAsTelas[index].classList.remove('ativa');
    }
    document.getElementById(idDaTela).classList.add('ativa');
}

// Limpa o usuário anterior ao carregar a página para evitar travar
window.addEventListener('beforeunload', function() {
    if (nomeJogador) {
        bancoDados.ref('lobby/' + nomeJogador).remove();
    }
});

function entrarNoJogo() {
    const campoDeTexto = document.getElementById('input-nome');
    nomeJogador = campoDeTexto.value.trim();
    
    if (nomeJogador.length < 3) {
        exibirNotificacao("O apelido precisa ter no mínimo três letras.");
        return;
    }
    
    bancoDados.ref('lobby').once('value').then(function(snapshot) {
        const jogadoresAtuais = snapshot.val() || {};
        
        if (jogadoresAtuais[nomeJogador]) {
            exibirNotificacao("Este apelido já está em uso na sala.");
            return;
        }
        
        const quantidadeDeJogadores = Object.keys(jogadoresAtuais).length;
        if (quantidadeDeJogadores === 0) {
            jogadorAnfitriao = true;
        } else {
            jogadorAnfitriao = false;
        }
        
        const referenciaJogador = bancoDados.ref('lobby/' + nomeJogador);
        referenciaJogador.set({
            online: true,
            pontos: 0,
            censurado: false,
            imune: false,
            sabotado: false
        });
        
        referenciaJogador.onDisconnect().remove();
        
        if (jogadorAnfitriao === true) {
            document.getElementById('btn-iniciar').classList.remove('escondido');
            document.getElementById('msg-aguardando').classList.add('escondido');
        } else {
            document.getElementById('btn-iniciar').classList.add('escondido');
            document.getElementById('msg-aguardando').classList.remove('escondido');
        }
        
        alterarTela('tela-lobby');
        iniciarEscutaDoServidor();
    });
}
function iniciarEscutaDoServidor() {
    bancoDados.ref('lobby').on('value', function(snapshot) {
        dadosDosJogadores = snapshot.val() || {};
        const listaNaTela = document.getElementById('lista-jogadores');
        listaNaTela.innerHTML = '';
        
        if (!dadosDosJogadores[nomeJogador]) {
            return;
        }
        
        document.getElementById('meus-pontos').innerText = dadosDosJogadores[nomeJogador].pontos;
        
        if (dadosDosJogadores[nomeJogador].sabotado === true) {
            exibirNotificacao("Você foi alvo de sabotagem e perdeu suas cartas.");
            cartasNaMao = [];
            atualizarExibicaoDaMao();
            bancoDados.ref('lobby/' + nomeJogador + '/sabotado').set(false);
        }
        
        const chavesDosJogadores = Object.keys(dadosDosJogadores);
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            const nomeCorrente = chavesDosJogadores[index];
            let indicativo = "";
            
            if (nomeCorrente === nomeJogador) {
                indicativo = " (Você)";
            }
            if (jogadorAnfitriao === true && nomeCorrente === nomeJogador) {
                indicativo = indicativo + " [Anfitrião]";
            }
            
            const pontuacao = dadosDosJogadores[nomeCorrente].pontos;
            listaNaTela.innerHTML = listaNaTela.innerHTML + '<li>' + nomeCorrente + indicativo + ' <span>' + pontuacao + ' pts</span></li>';
        }
    });
    
    bancoDados.ref('sala').on('value', function(snapshot) {
        estadoDaSala = snapshot.val() || {};
        
        const telaLobbyEstaAtiva = document.getElementById('tela-lobby').classList.contains('ativa');
        if (estadoDaSala.fase && telaLobbyEstaAtiva === true) {
            alterarTela('tela-jogo');
            adicionarCartasNaMao(5);
            carregarItensDaLoja();
            iniciarLoopTemporalDoAnfitriao();
        }
        
        if (estadoDaSala.fase) {
            processarAtualizacaoVisualDaSala();
        }
    });
}

function iniciarLoopTemporalDoAnfitriao() {
    if (jogadorAnfitriao === false) {
        return;
    }
    
    if (loopDoAnfitriao !== null) {
        clearInterval(loopDoAnfitriao);
    }
    
    loopDoAnfitriao = setInterval(function() {
        if (estadoDaSala.tempoRestante > 0) {
            bancoDados.ref('sala/tempoRestante').set(estadoDaSala.tempoRestante - 1);
        }
        
        if (estadoDaSala.tempoRestante === 0) {
            if (estadoDaSala.fase === 'jogando') {
                bancoDados.ref('sala/fase').set('votacao');
                bancoDados.ref('sala/tempoRestante').set(30);
            } else if (estadoDaSala.fase === 'votacao') {
                bancoDados.ref('sala/tempoRestante').set(-1);
                executarApuracaoDeVotos();
            }
        }
    }, 1000);
}

function iniciarPartida() {
    const indiceAleatorio = Math.floor(Math.random() * CARTAS_FRASE.length);
    const cartaSorteada = CARTAS_FRASE[indiceAleatorio];
    
    bancoDados.ref('sala').set({
        fase: 'jogando',
        cartaPreta: cartaSorteada,
        jogadas: {},
        votos: {},
        tempoRestante: 40,
        efeitosGlobais: { inversao: false, cegueira: false, silencio: false }
    });
    
    const nomes = Object.keys(dadosDosJogadores);
    for (let index = 0; index < nomes.length; index++) {
        bancoDados.ref('lobby/' + nomes[index] + '/censurado').set(false);
    }
}

function formatarTempo(segundos) {
    if (segundos < 0) {
        return "00:00";
    }
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    let textoMinutos = minutos.toString();
    let textoSegundos = segundosRestantes.toString();
    
    if (minutos < 10) {
        textoMinutos = "0" + textoMinutos;
    }
    if (segundosRestantes < 10) {
        textoSegundos = "0" + textoSegundos;
    }
    
    return textoMinutos + ":" + textoSegundos;
}

function processarAtualizacaoVisualDaSala() {
    document.getElementById('carta-frase-atual').innerText = estadoDaSala.cartaPreta || "Carregando a frase...";
    
    let textoFase = "Aguardando";
    if (estadoDaSala.fase === 'jogando') {
        textoFase = "Escolha sua resposta";
    } else if (estadoDaSala.fase === 'votacao') {
        textoFase = "Vote na melhor carta";
    }
    document.getElementById('texto-fase').innerText = textoFase;
    
    const elementoRelogio = document.getElementById('cronometro');
    elementoRelogio.innerText = formatarTempo(estadoDaSala.tempoRestante);
    
    if (estadoDaSala.tempoRestante <= 10 && estadoDaSala.tempoRestante > 0) {
        elementoRelogio.classList.add('urgente');
    } else {
        elementoRelogio.classList.remove('urgente');
    }
    
    const caixaDeEfeitos = document.getElementById('alertas-efeitos');
    caixaDeEfeitos.innerHTML = '';
    
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.inversao === true) {
        caixaDeEfeitos.innerHTML = caixaDeEfeitos.innerHTML + "Alerta: Inversão ativada.<br>";
    }
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.cegueira === true) {
        caixaDeEfeitos.innerHTML = caixaDeEfeitos.innerHTML + "Alerta: Cegueira ativada.<br>";
    }
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.silencio === true) {
        caixaDeEfeitos.innerHTML = caixaDeEfeitos.innerHTML + "Alerta: Silêncio ativado.<br>";
    }

    if (estadoDaSala.fase === 'jogando') {
        document.getElementById('area-votacao').classList.add('escondido');
        document.getElementById('area-mao').classList.remove('escondido');
        
        const totalJogadores = Object.keys(dadosDosJogadores).length;
        const totalJogadas = Object.keys(estadoDaSala.jogadas || {}).length;
        
        if (jogadorAnfitriao === true && totalJogadas >= totalJogadores && totalJogadores > 1) {
            bancoDados.ref('sala/fase').set('votacao');
            bancoDados.ref('sala/tempoRestante').set(30);
        }
    } else if (estadoDaSala.fase === 'votacao') {
        document.getElementById('area-mao').classList.add('escondido');
        document.getElementById('area-votacao').classList.remove('escondido');
        
        const containerCartas = document.getElementById('cartas-jogadas');
        containerCartas.innerHTML = '';
        
        const arrayJogadas = Object.entries(estadoDaSala.jogadas || {});
        for (let index = 0; index < arrayJogadas.length; index++) {
            const donoDaCarta = arrayJogadas[index][0];
            const textoDaCarta = arrayJogadas[index][1];
            let classeCegueira = '';
            
            if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.cegueira === true && donoDaCarta !== nomeJogador) {
                classeCegueira = 'cegueira';
            }
            
            const htmlDaCarta = '<div class="carta carta-branca ' + classeCegueira + '" onclick="registrarVoto(\'' + donoDaCarta + '\', this)">' + textoDaCarta + '</div>';
            containerCartas.innerHTML = containerCartas.innerHTML + htmlDaCarta;
        }
        
        const totalJogadoresVotacao = Object.keys(dadosDosJogadores).length;
        const totalVotos = Object.keys(estadoDaSala.votos || {}).length;
        
        if (jogadorAnfitriao === true && totalVotos >= totalJogadoresVotacao && totalJogadoresVotacao > 1) {
            bancoDados.ref('sala/tempoRestante').set(-1);
            executarApuracaoDeVotos();
        }
    }
}

function enviarCarta(textoDaCarta, indiceDaCarta) {
    if (estadoDaSala.fase !== 'jogando') {
        exibirNotificacao("Este não é o momento de jogar cartas.");
        return;
    }
    
    if (estadoDaSala.jogadas && estadoDaSala.jogadas[nomeJogador]) {
        exibirNotificacao("Sua carta já foi enviada nesta rodada.");
        return;
    }
    
    if (dadosDosJogadores[nomeJogador].censurado === true) {
        exibirNotificacao("Você foi censurado e não pode enviar cartas.");
        return;
    }
    
    bancoDados.ref('sala/jogadas/' + nomeJogador).set(textoDaCarta);
    cartasNaMao.splice(indiceDaCarta, 1);
    adicionarCartasNaMao(1);
    exibirNotificacao("Carta enviada com sucesso.");
}

function registrarVoto(jogadorAlvo, elementoVisual) {
    if (estadoDaSala.fase !== 'votacao') {
        return;
    }
    
    if (jogadorAlvo === nomeJogador) {
        exibirNotificacao("Não é permitido votar na própria carta.");
        return;
    }
    
    if (estadoDaSala.votos && estadoDaSala.votos[nomeJogador]) {
        exibirNotificacao("Seu voto já foi registrado.");
        return;
    }
    
    let pesoDoVoto = 1;
    if (efeitosAtivos.ditador === true) {
        pesoDoVoto = 100;
        efeitosAtivos.ditador = false;
    } else if (efeitosAtivos.duplo === true) {
        pesoDoVoto = 2;
        efeitosAtivos.duplo = false;
    }
    
    bancoDados.ref('sala/votos/' + nomeJogador).set({
        para: jogadorAlvo,
        peso: pesoDoVoto
    });
    
    elementoVisual.classList.add('selecionada');
    exibirNotificacao("Voto contabilizado.");
}

function executarApuracaoDeVotos() {
    let tabelaDeContagem = {};
    const arrayVotos = Object.values(estadoDaSala.votos || {});
    
    for (let index = 0; index < arrayVotos.length; index++) {
        const votoAtual = arrayVotos[index];
        const destinoDoVoto = votoAtual.para;
        
        if (!tabelaDeContagem[destinoDoVoto]) {
            tabelaDeContagem[destinoDoVoto] = 0;
        }
        
        tabelaDeContagem[destinoDoVoto] = tabelaDeContagem[destinoDoVoto] + votoAtual.peso;
    }
    
    let nomeDoVencedor = null;
    let quantidadeDeVotosGanhadora = -1;
    
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.inversao === true) {
        quantidadeDeVotosGanhadora = 999999;
    }
    
    const arrayContagem = Object.entries(tabelaDeContagem);
    for (let index = 0; index < arrayContagem.length; index++) {
        const jogadorApurado = arrayContagem[index][0];
        const votosDoJogador = arrayContagem[index][1];
        
        if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.inversao === true) {
            if (votosDoJogador < quantidadeDeVotosGanhadora) {
                quantidadeDeVotosGanhadora = votosDoJogador;
                nomeDoVencedor = jogadorApurado;
            }
        } else {
            if (votosDoJogador > quantidadeDeVotosGanhadora) {
                quantidadeDeVotosGanhadora = votosDoJogador;
                nomeDoVencedor = jogadorApurado;
            }
        }
    }
    
    if (nomeDoVencedor !== null) {
        let bonificacao = 1;
        if (efeitosAtivos.investidor === true && nomeDoVencedor === nomeJogador) {
            bonificacao = 3;
        }
        
        bancoDados.ref('lobby/' + nomeDoVencedor + '/pontos').once('value').then(function(snapshot) {
            const pontosAntigos = snapshot.val() || 0;
            bancoDados.ref('lobby/' + nomeDoVencedor + '/pontos').set(pontosAntigos + bonificacao);
        });
        
        exibirNotificacao("O vencedor foi " + nomeDoVencedor + " com " + quantidadeDeVotosGanhadora + " votos.");
    } else {
        exibirNotificacao("A rodada terminou sem vencedores.");
    }
    
    efeitosAtivos.investidor = false;
    bancoDados.ref('lobby/' + nomeJogador + '/imune').set(false);
    
    setTimeout(function() {
        if (jogadorAnfitriao === true) {
            iniciarPartida();
        }
    }, 6000);
}

function adicionarCartasNaMao(quantidade) {
    for (let index = 0; index < quantidade; index++) {
        const indiceSorteado = Math.floor(Math.random() * CARTAS_RESPOSTA.length);
        cartasNaMao.push(CARTAS_RESPOSTA[indiceSorteado]);
    }
    atualizarExibicaoDaMao();
}

function atualizarExibicaoDaMao() {
    const containerDaMao = document.getElementById('minhas-cartas');
    containerDaMao.innerHTML = '';
    
    for (let index = 0; index < cartasNaMao.length; index++) {
        const textoDaCarta = cartasNaMao[index];
        const html = '<div class="carta carta-branca" onclick="enviarCarta(\'' + textoDaCarta + '\', ' + index + ')">' + textoDaCarta + '</div>';
        containerDaMao.innerHTML = containerDaMao.innerHTML + html;
    }
}

function filtrarCartas() {
    const termoPesquisado = document.getElementById('filtro-cartas').value.toLowerCase();
    const elementosCarta = document.querySelectorAll('#minhas-cartas .carta-branca');
    
    for (let index = 0; index < elementosCarta.length; index++) {
        const textoDaCarta = elementosCarta[index].innerText.toLowerCase();
        
        if (textoDaCarta.includes(termoPesquisado) === true) {
            elementosCarta[index].style.display = 'flex';
        } else {
            elementosCarta[index].style.display = 'none';
        }
    }
}

function abrirLoja() {
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.silencio === true) {
        exibirNotificacao("A loja está fechada devido ao efeito de silêncio.");
        return;
    }
    document.getElementById('modal-loja').classList.remove('escondido');
}

function fecharLoja() {
    document.getElementById('modal-loja').classList.add('escondido');
}

function carregarItensDaLoja() {
    const containerLista = document.getElementById('lista-itens');
    containerLista.innerHTML = '';
    
    for (let index = 0; index < ITENS_LOJA.length; index++) {
        const itemCorrente = ITENS_LOJA[index];
        const htmlItem = '<div class="item-loja"><div><h3>' + itemCorrente.nome + '</h3><p>' + itemCorrente.desc + '</p></div><button onclick="comprarItemDaLoja(' + itemCorrente.id + ', ' + itemCorrente.preco + ')">Comprar por ' + itemCorrente.preco + ' pts</button></div>';
        containerLista.innerHTML = containerLista.innerHTML + htmlItem;
    }
}

function comprarItemDaLoja(identificadorDoItem, precoDoItem) {
    const pontosDisponiveis = dadosDosJogadores[nomeJogador].pontos;
    
    if (pontosDisponiveis >= precoDoItem) {
        bancoDados.ref('lobby/' + nomeJogador + '/pontos').set(pontosDisponiveis - precoDoItem);
        processarEfeitoDoItem(identificadorDoItem);
        fecharLoja();
    } else {
        exibirNotificacao("Seus pontos são insuficientes para esta compra.");
    }
}

function abrirModalDeSelecaoDeAlvo(tituloDoModal, funcaoDeRetorno) {
    fecharLoja();
    
    let htmlBotoes = '';
    const chavesDosJogadores = Object.keys(dadosDosJogadores);
    
    for (let index = 0; index < chavesDosJogadores.length; index++) {
        const nomeDoAlvo = chavesDosJogadores[index];
        if (nomeDoAlvo !== nomeJogador) {
            htmlBotoes = htmlBotoes + '<button class="btn-alvo" onclick="processarSelecaoDeAlvo(\'' + nomeDoAlvo + '\')">' + nomeDoAlvo + '</button>';
        }
    }
    
    const estruturaDoModal = '<div id="modal-alvo" class="modal-overlay"><div class="conteudo-modal" style="max-width: 500px; text-align: center;"><h3 style="margin-bottom: 20px; color: #ff3333;">' + tituloDoModal + '</h3><div class="lista-alvos">' + htmlBotoes + '</div><button class="btn-fechar" onclick="fecharModalDeSelecao()">Cancelar</button></div></div>';
    
    document.body.insertAdjacentHTML('beforeend', estruturaDoModal);
    
    window.processarSelecaoDeAlvo = function(nomeSelecionado) {
        fecharModalDeSelecao();
        if (dadosDosJogadores[nomeSelecionado].imune === true) {
            exibirNotificacao("O ataque falhou. O jogador selecionado está protegido por um Veto.");
        } else {
            funcaoDeRetorno(nomeSelecionado);
        }
    };
}

function fecharModalDeSelecao() {
    const elementoModal = document.getElementById('modal-alvo');
    if (elementoModal) {
        elementoModal.remove();
    }
}

function exibirModalGenerico(titulo, textoConteudo) {
    const estruturaDoModal = '<div id="modal-generico" class="modal-overlay"><div class="conteudo-modal" style="max-width: 600px;"><h3 style="margin-bottom: 20px; color: #ffcc00;">' + titulo + '</h3><div style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">' + textoConteudo + '</div><button class="btn-fechar" onclick="fecharModalGenerico()">Entendi</button></div></div>';
    document.body.insertAdjacentHTML('beforeend', estruturaDoModal);
}

function fecharModalGenerico() {
    const elementoModal = document.getElementById('modal-generico');
    if (elementoModal) {
        elementoModal.remove();
    }
}

function processarEfeitoDoItem(identificadorDoItem) {
    if (identificadorDoItem === 1) {
        let conteudoEspiao = "";
        const arrayJogadas = Object.entries(estadoDaSala.jogadas || {});
        
        for (let index = 0; index < arrayJogadas.length; index++) {
            const donoDaCarta = arrayJogadas[index][0];
            const textoDaCarta = arrayJogadas[index][1];
            conteudoEspiao = conteudoEspiao + "<p><strong>" + donoDaCarta + ":</strong> " + textoDaCarta + "</p>";
        }
        
        if (conteudoEspiao === "") {
            conteudoEspiao = "Nenhuma carta foi jogada ainda.";
        }
        
        exibirModalGenerico("Relatório de Espionagem", conteudoEspiao);
        
    } else if (identificadorDoItem === 2) {
        efeitosAtivos.ditador = true;
        exibirNotificacao("O modo ditador está ativo. Seu voto definirá o vencedor.");
        
    } else if (identificadorDoItem === 3) {
        bancoDados.ref('lobby/' + nomeJogador + '/imune').set(true);
        exibirNotificacao("Você está protegido contra ataques direcionados.");
        
    } else if (identificadorDoItem === 4) {
        abrirModalDeSelecaoDeAlvo("Escolha o jogador para sabotar", function(nomeDoAlvo) {
            bancoDados.ref('lobby/' + nomeDoAlvo + '/sabotado').set(true);
            exibirNotificacao("A sabotagem contra " + nomeDoAlvo + " foi um sucesso.");
        });
        
    } else if (identificadorDoItem === 5) {
        adicionarCartasNaMao(3);
        exibirNotificacao("Três cartas extras foram adicionadas à sua mão.");
        
    } else if (identificadorDoItem === 6) {
        abrirModalDeSelecaoDeAlvo("Escolha de quem deseja roubar", function(nomeDoAlvo) {
            bancoDados.ref('lobby/' + nomeDoAlvo + '/pontos').once('value').then(function(snapshot) {
                const pontosDoAlvo = snapshot.val() || 0;
                let novosPontosDoAlvo = pontosDoAlvo - 1;
                if (novosPontosDoAlvo < 0) {
                    novosPontosDoAlvo = 0;
                }
                bancoDados.ref('lobby/' + nomeDoAlvo + '/pontos').set(novosPontosDoAlvo);
                
                bancoDados.ref('lobby/' + nomeJogador + '/pontos').once('value').then(function(meuSnapshot) {
                    const meusPontos = meuSnapshot.val() || 0;
                    bancoDados.ref('lobby/' + nomeJogador + '/pontos').set(meusPontos + 1);
                });
                exibirNotificacao("Você roubou um ponto com sucesso.");
            });
        });
        
    } else if (identificadorDoItem === 7) {
        abrirModalDeSelecaoDeAlvo("Escolha o jogador para censurar", function(nomeDoAlvo) {
            bancoDados.ref('lobby/' + nomeDoAlvo + '/censurado').set(true);
            exibirNotificacao("O jogador foi censurado e não poderá jogar nesta rodada.");
        });
        
    } else if (identificadorDoItem === 8) {
        bancoDados.ref('sala/tempoRestante').set(5);
        exibirNotificacao("Bomba ativada. O tempo foi reduzido drasticamente.");
        
    } else if (identificadorDoItem === 9) {
        cartasNaMao = [];
        adicionarCartasNaMao(5);
        exibirNotificacao("Suas cartas foram renovadas por completo.");
        
    } else if (identificadorDoItem === 10) {
        bancoDados.ref('sala/jogadas/' + nomeJogador).remove();
        adicionarCartasNaMao(1);
        exibirNotificacao("Sua carta foi removida da mesa. Você pode jogar outra.");
        
    } else if (identificadorDoItem === 11) {
        efeitosAtivos.duplo = true;
        exibirNotificacao("Seu próximo voto terá o peso duplicado.");
        
    } else if (identificadorDoItem === 12) {
        bancoDados.ref('sala/efeitosGlobais/inversao').set(true);
        exibirNotificacao("A regra foi invertida. A carta menos votada será a vencedora.");
        
    } else if (identificadorDoItem === 13) {
        const indiceAleatorio = Math.floor(Math.random() * CARTAS_FRASE.length);
        const novaCartaPreta = CARTAS_FRASE[indiceAleatorio];
        bancoDados.ref('sala/cartaPreta').set(novaCartaPreta);
        exibirNotificacao("A frase principal foi substituída por uma nova.");
        
    } else if (identificadorDoItem === 14) {
        const chavesDosJogadores = Object.keys(dadosDosJogadores);
        let arrayDePontos = [];
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            arrayDePontos.push(dadosDosJogadores[chavesDosJogadores[index]].pontos);
        }
        
        for (let i = arrayDePontos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temporario = arrayDePontos[i];
            arrayDePontos[i] = arrayDePontos[j];
            arrayDePontos[j] = temporario;
        }
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            const nomeCorrente = chavesDosJogadores[index];
            bancoDados.ref('lobby/' + nomeCorrente + '/pontos').set(arrayDePontos[index]);
        }
        exibirNotificacao("As pontuações foram embaralhadas pelo caos.");
        
    } else if (identificadorDoItem === 15) {
        bancoDados.ref('sala/votos').remove();
        exibirNotificacao("Anarquia declarada. Todos os votos atuais foram anulados.");
        
    } else if (identificadorDoItem === 16) {
        bancoDados.ref('sala/efeitosGlobais/cegueira').set(true);
        exibirNotificacao("Cegueira ativada. As cartas estão ocultas para os adversários.");
        
    } else if (identificadorDoItem === 17) {
        efeitosAtivos.investidor = true;
        exibirNotificacao("Você receberá uma bonificação maior caso vença esta rodada.");
        
    } else if (identificadorDoItem === 18) {
        bancoDados.ref('sala/efeitosGlobais/silencio').set(true);
        exibirNotificacao("A loja de itens foi bloqueada para todos os jogadores.");
        
    } else if (identificadorDoItem === 19) {
        const chavesDosJogadores = Object.keys(dadosDosJogadores);
        let somaTotalDePontos = 0;
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            somaTotalDePontos = somaTotalDePontos + dadosDosJogadores[chavesDosJogadores[index]].pontos;
        }
        
        const pontuacaoDividida = Math.floor(somaTotalDePontos / chavesDosJogadores.length);
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            const nomeCorrente = chavesDosJogadores[index];
            bancoDados.ref('lobby/' + nomeCorrente + '/pontos').set(pontuacaoDividida);
        }
        exibirNotificacao("Os pontos foram igualados entre todos os jogadores.");
        
    } else if (identificadorDoItem === 20) {
        if (jogadorAnfitriao === true) {
            iniciarPartida();
        } else {
            bancoDados.ref('sala/tempoRestante').set(0);
        }
        exibirNotificacao("Os trilhos foram limpos. A rodada será reiniciada imediatamente.");
    }
}
// Adicione esta função ao final do seu script para detectar e gerenciar cartas que exigem múltiplas escolhas (Pick 2 / Pick 3)
function obterQuantidadeNecessaria(textoCarta) {
    // Conta quantas lacunas (___) a frase possui
    let lacunas = (textoCarta.match(/___/g) || []).length;
    
    // Verifica se há marcação explícita ou símbolos matemáticos/múltiplas lacunas
    if (textoCarta.includes("PICK 3") || textoCarta.includes("+")) {
        return 3;
    } else if (textoCarta.includes("PICK 2") || lacunas > 1) {
        return lacunas > 1 ? lacunas : 2;
    }
    
    return 1; // Padrão para cartas normais
}

// Função auxiliar para controlar a seleção em ordem (a ordem importa para Pick 2/3)
let cartasSelecionadasRodada = [];

function lidarComSelecaoCarta(idCarta, textoCartaAtual) {
    let limitePermitido = obterQuantidadeNecessaria(textoCartaAtual);
    
    // Se a carta já foi selecionada, removemos (permite trocar)
    let index = cartasSelecionadasRodada.indexOf(idCarta);
    if (index > -1) {
        cartasSelecionadasRodada.splice(index, 1);
        console.log("Carta removida. Seleção atual:", cartasSelecionadasRodada);
        return;
    }
    
    // Se ainda não atingiu o limite, adiciona respeitando a ordem de escolha
    if (cartasSelecionadasRodada.length < limitePermitido) {
        cartasSelecionadasRodada.push(idCarta);
        console.log("Carta adicionada. Seleção atual:", cartasSelecionadasRodada);
    } else {
        alert(`Esta carta exige exatamente ${limitePermitido} escolhas! Desmarque alguma antes.`);
    }
}
