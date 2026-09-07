// For Firebase JS SDK v7.20.0 and later
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
    "O que arruinou meu último encontro?", "___ é a pior coisa do mundo, mas eu adoro.", 
    "A nova moda entre os jovens é ___.", "Por que estou chorando no chuveiro?",
    "O ingrediente secreto da minha avó é ___.", "A cura para a depressão foi descoberta: ___.",
    "Ninguém espera por ___ na ceia de Natal.", "O que os alienígenas acharam mais estranho na Terra?",
    "O que é mais emo?", "Como eu perdi minha virgindade?",
    "Atirei o pau no gato / Mas o gato não morreu / Dona Chica admirou-se / Do que o gato deu.",
    "Papai, por que mamãe está chorando?", "Durante sua infância, Salvador Dalí fez centenas de pinturas de ___.",
    "Em 1.000 anos, quando o dinheiro de papel for uma memória distante, como nós iremos pagar por bens e serviços?",
    "O Museu de História Natural acabou de lançar uma exibição interativa sobre ___.",
    "A Infraero agora proíbe ___ em aviões.", "É lamentável que os jovens hoje em dia estão todos se envolvendo com ___.",
    "A CBF baniu ___ do futebol por dar aos jogadores uma vantagem injusta.", "Qual é o prazer secreto do Batman?",
    "O próximo livro de J.K. Rowling: Harry Potter e a Câmara de ___.",
    "Me desculpe, Professor, mas eu não consegui fazer meu dever de casa por causa da ___.",
    "O que eu trouxe do Paraguai?", "É impossível comer um só!", "Qual é minha anti-droga?",
    "Enquanto os Estados Unidos disputavam com a União Soviética para ver quem chegava primeiro à Lua, o governo do México destinava milhões de pesos em pesquisas sobre ___.",
    "No novo Filme Original do Disney Channel, Hannah Montana luta com ___ pela primeira vez.",
    "Qual meu poder secreto?", "Qual a dieta do momento?", "O que Vin Diesel comeu no jantar?",
    "Quando o Faraó se mostrou irredutível, Moisés invocou uma praga de ___.",
    "Como eu estou afirmando meu status de relacionamento?",
    "Dizem que na prisão do Carandiru se podia trocar 200 cigarros por ___.",
    "Depois do terremoto, Sean Penn trouxe ___ para o povo do Haiti.",
    "Ao invés de carvão nos dias de hoje Papai Noel dá às crianças malcriadas ___.",
    "A vida dos índios Tapajós foi mudada totalmente quando o homem branco os apresentou a ___.",
    "O que o governo está fazendo para as crianças da favela obterem sucesso?",
    "Talvez ela tenha nascido com isso. Talvez seja ___.", "Nos momentos finais de Michael Jackson, ele pensou ___.",
    "Pessoas brancas gostam de ___.", "Por que estou todo dolorido?",
    "Um jantar romântico a luz de velas não está completo sem ___.",
    "O que eu preciso trazer do passado para convencer as pessoas que sou um poderoso mago?",
    "LIGUE AGORA PARA 011-1406 E ADQUIRA JÁ O SEU ___.",
    "A viagem de estudo da classe foi completamente arruinada por causa de ___.",
    "Qual é o melhor amigo da mulher?", "Querida Márcia, eu estou tendo problemas com ___ e gostaria de seu conselho.",
    "Quando eu for Presidente do Brasil, eu vou criar o Ministério de ___.",
    "O que meus pais estão escondendo de mim?", "O que nunca falha para se tentar animar uma festa?",
    "O que se melhora com a idade?", "Bom até a última gota.",
    "Eu tenho 99 problemas mas ___ não é um deles.", "Pegadinha do Malandro!",
    "O novo reality show da MTV tem oito celebridades decadentes vivendo com ___.",
    "O que vovó acharia perturbador, porém ao mesmo tempo elegante?", "Durante o sexo, eu gosto de pensar sobre ___.",
    "O que fez meu último relacionamento terminar?", "Qual é o próximo McLanche Feliz?",
    "Que som é esse?", "O que tem de tonelada no Paraíso?", "Porque eu não consigo dormir a noite?",
    "E é assim que eu quero morrer.",
    "Eu ainda não sei com quais armas a III Guerra Mundial será lutada, mas a IV Guerra Mundial será lutada com ___.",
    "Que cheiro é esse?", "Porque ___ é tão grudento?", "O que sempre faz com que você consiga transar?",
    "O que ajuda Obama a relaxar?", "Assim expira o mundo / Assim expira o mundo / Não com uma explosão, mas com ___.",
    "Chegando a Broadway esta temporada: ___ O Musical.", "Mas antes de matá-lo Sr. Bond, Eu devo lhe mostrar ___.",
    "Estudos mostram que ratos de laboratório navegam através de labirintos 50% mais rápido, após serem expostos a ___.",
    "Daqui a pouco na ESPN 2: O Campeonato Mundial de ___.",
    "Quando eu for bilionário, eu irei erguer uma estátua de 20 metros para comemorar ___.",
    "Guerra! Pra que serve?", "O que me causa gases incontroláveis?", "Que cheiro têm as pessoas velhas?",
    "O que eu estou abandonando pela quaresma?", "A medicina alternativa está reconhecendo os poderes curativos de ___.",
    "Os E.U.A. começaram a enviar ___ de pára-quedas para as crianças do Afeganistão.",
    "O que é que José Sarney prefere?", "O que você não espera encontrar em sua comida chinesa?",
    "Eu bebo para esquecer ___.", "Toca aqui, irmão. ___",
    "Dizem que o prato preferido de Vladmir Putin é recheado com ___.", "É verdade, eu matei ___.",
    "Como, você pergunta? Com ___.", "Rede Vida apresenta a estória de ___."
];

const CARTAS_RESPOSTA = [
    "Uma maldição cigana.", "Um momento de silêncio.", "Uma festa onde só tem macho.",
    "Um policial honesto sem nada a perder.", "A Fome.", "Uma bacteria comedora de carne.",
    "Cobras voadoras taradas.", "Cagar para o Terceiro Mundo.", "Mandar mensagens sexuais por SMS.",
    "Metamorfos.", "Estrelas Pornôs.", "Estuprar e pilhar.", "72 virgens.", "Um tiroteio.",
    "Um paradoxo de viagem no tempo.", "Uma autêntica comida Mexicana.", "Bijuterias.",
    "Consultores.", "Dívidas astronômicas.", "Problemas com o papai.", "O Selo de Aprovação de Donald Trump.",
    "Injeções Hormonais", "Cair no ridículo.", "O milagre do nascimento.",
    "Derrubar o candelabro sobre seus inimigos e subir pela corda.", "Botar um ovo.",
    "Compartilhar agulhas", "O Ex-Presidente George W. Bush.", "Ficar pelado e assistir a Nickelodeon.",
    "Meleca de nariz.", "Mandando ver.", "Nu frontal Completo.", "Fingir se importar.",
    "A inevitável destruição do universo.", "Classe Média Sofre.", "Deveres conjugais.",
    "Roberval, o ladrão de chocolate.", "Desodorante para corpo AXE.", "Sangue de Cristo.",
    "Um terrível acidente com depilação a laser.", "BATMAN!!!", "Agricultura.",
    "Um retardado fortão.", "Seleção Natural.", "Abortos clandestinos.",
    "Comer todos os biscoitos antes da feira beneficente.", "Os braços da Michelle Obama.",
    "O World of Warcraft.", "Furar olho.", "Obesidade.", "Vídeos homoeróticos de jogadores de Vôlei.",
    "Tétano.", "Uma exibição sexual.", "Torção testicular.", "Rodízio de carnes por R$ 9,90.",
    "Pizza de chocolate.", "Kanye West.", "Queijo Quente.", "Ataque de Velociraptors.",
    "Tirar a camisa.", "Esmegma.", "Alcolismo.", "Um homem de meia idade de patins.",
    "Um abraço dos Ursinhos Carinhosos.", "Beber, Cair e Levantar.", "Um Pirulitão.",
    "Auto-piedade.", "Crianças com coleiras.", "Preliminares meia-boca.", "A Bíblia Sagrada.",
    "Pornô Alemão Sado-Masô.", "Pegar fogo.", "Gravidez adolescente.", "Gandhi.",
    "Deixar uma mensagem de voz bizarra.", "Ganchos.", "Representantes do SAC.",
    "Uma ereção que dura mais de 4 horas.", "Meus genitais.", "Pegar mulher na clínica de abortos.",
    "Ciência.", "Não reciprocar no sexo oral.", "Passarinho que não voa.", "Uma boa cheirada.",
    "Afogamento simulado.", "Um café da manhã balanceado.", "Escolas públicas.",
    "Literalmente tirar doce de crianças.", "O Criança Esperança.", "Uma passada de mão clandestina.",
    "Notas de Post-It passivo-agressivas.", "A equipe de Ginástica Olímpica da China.",
    "Mude para a Porto Seguro®.", "Urinar um pouquinho.", "Vídeo caseiro da Ana Maria Braga chorando embaixo da mesa.",
    "Polução Noturna.", "Os judeus.", "Minha bunda.", "Coxas poderosas.", "Paquerar com idosos.",
    "Pato Purific, confie no bico do pato!", "Uma suave passada de mão na coxa.", "Tensão sexual.",
    "O fruto proibido.", "Esqueleto do He-Man.", "Comida para gatos Whiskas®.", "Ser rico.",
    "Doce, doce vingança.", "Tucanos.", "Um jumento com flatulência.", "Natalie Portman.",
    "Dar uma pegadinha.", "Pilotos Kamikazes", "Sean Connery.", "A Agenda Gay.",
    "O Retirante Nordestino.", "Um falcão de caça.", "Coroinhas.", "Jarbas do Tang.",
    "Ficar com tanta raiva que lhe dá uma ereção.", "Amostras grátis.", "Um grande fuzuê a troco de nada.",
    "Fazer a coisa certa.", "A Lei do Ventre Livre.", "Lactação.", "Paz mundial.", "RoboCop.",
    "Malandragem.", "Justin Bieber.", "Oompa-Loompas.", "Um forró inapropriado.", "Puberdade.",
    "Fantasmas.", "Uma cirurgia de implante de silicone nos seios que ficou assimétrica.",
    "Mãos de seresteiro.", "Dar uma dedada.", "Boris Casoy prendendo o saco na porta do chuveiro.",
    "Danoninho®.", "Brutalidade Policial.", "Joaquim Silvério dos Reis.", "Pré-adolescentes.",
    "Tirar o escalpo.", "Segurar um risinho ao ouvir menção do Peru.", "Tuitar.",
    "Esperar um arroto e acabar vomitando.", "Darth Vader.", "Ritalina™", "Uma punheta meia-boca.",
    "Células-Tronco.", "Exatamente o que você esperava.", "Decote de bom-gosto.", "Sexo de Pandas.",
    "Uma lobotomia com um picador de gelo.", "Tom Cruise.", "Herpes Labial.", "Esperma de Baleia.",
    "Mendigos sem-teto.", "A mão-naquilo, aquilo-na-mão.", "Incesto.",
    "O Pac-Man gozando incontrolavelmente.", "Um mímico tendo um ataque do coração.",
    "Ted Boy Marino.", "Deus.", "Lavar bem as dobrinhas.", "Chuva dourada.", "Emoções.",
    "Lamber a comida pra marcar como sua.", "Nova Schin.", "A Placenta.", "Combustão Humana Espontânea.",
    "Amizade Colorida.", "Pintura com os dedos.", "Cheiro de gente velha.", "Morrer de disenteria.",
    "Meus demônios internos.", "Uma arma de água cheia de xixi de gato.", "Hermes da Fonseca.",
    "Dormir de conchinha.", "A erva.", "Briga de Galo.", "Fogo amigo.", "Fernando Henrique Cardoso.",
    "Uma festa de aniversário fracassada.", "Uma mulata safada.", "Olimpíadas de matemática.",
    "Um pônei.", "Francisco Cuoco.", "Cavalgando em direção ao Pôr do Sol.", "Um M. Night Shyamalan plot twist.",
    "Cabelo pixaim.", "Destruição mútua assegurada.", "Pedófilos.", "Levedura.", "Roubo de Túmulos.",
    "Comer o último bisão conhecido.", "Catapultas.", "Gente Pobre.", "Liberdade, ainda que tardia.",
    "Xaxado.", "A Força.", "Chicoteando a bunda dela.", "Design Inteligente.", "Bucho-furado.",
    "AIDS.", "Fotos de Seios.", "O Super Homem de Nietzche.", "Sarah Palin.", "American Gladiators.",
    "Ficar realmente chapado.", "Cientologia.", "Inveja do penis.", "Rezar até deixar de ser gay.",
    "Se curtir.", "Dois anões cagando em um balde.", "A KKK.", "Genghis Khan.", "Metanfetaminas.",
    "Servidão.", "Não falar com estranhos.", "A Bop It.", "Compensação.", "Arremesso de Anão.",
    "A carreira de ator de Shaquille O'Neal.", "Bukkake.", "Brilho do Sol e Arco-Iris.",
    "Empinar.", "Uma vida completa de tristeza.", "Um macaco fumando charuto.", "Justiça de um Vigilante.",
    "Racismo.", "Enchente de verão.", "O Testículo perdido de Lance Armstrong.", "Tirar um sarro.",
    "Os terroristas.", "Britney Spears aos 55 anos.", "Atitude.", "Começar a cantar e dançar do nada.",
    "Lepra.", "Gloryholes.", "Estar com os faróis acesos.", "Dental Dams.", "Limpeza étnica.",
    "O coração de uma criança.", "A vagina da Raquel de Queiroz.", "Os escravos de Jó jogando caxangá.",
    "Filhotes!", "O períneo; o meinho; a periferia do parque de diversões.", "A mão invisível.",
    "Acordar seminu no estacionamento do Bob's.", "Ouvir atentamente.", "Esperando até o casamento.",
    "Estupidez inconcebível.", "Euphoria™ por Calvin Klein.", "Repassar o presente.", "Auto canibalismo.",
    "Disfunção erétil.", "Minha coleção de brinquedinhos eróticos.", "O Papa.", "Pessoas Brancas.",
    "Tentáculo Hentai.", "Boris Casoy vomitando compulsivamente", "Muito gel de cabelo.", "Seppuku.",
    "Dupla do mesmo sexo de patinação no gelo.", "enquanto aranhas eclodem de seu cérebro e saem por seus canais lacrimais.",
    "Trapaceando nas Paraolimpiadas.", "Carisma.", "Keanu Reeves.", "Sean Penn.", "Nickelback.",
    "Uma espiadinha.", "Cagando e andando. Pra sempre.", "Mestruação.", "Crianças com cancer no reto.",
    "Uma surpresa salgadinha.", "Sul.", "A violação dos nossos mais básicos direitos.",
    "YOU MUST CONSTRUCT ADDITIONAL PYLONS.", "Estupro em encontro.", "Ser fabuloso.", "Necrofilia.",
    "Cavalaria.", "Órfãos adoráveis.", "Mola Maluca enrolada.", "Aquela parada que eletrocuta seu abdomen.",
    "Centauros.", "Biscoito Passatempo.", "MechaHitler.", "O verdadeiro significado do Natal.",
    "Expelir pedra nos rins.", "Beakman do Mundo de Beakman.", "Putas.", "Cagadas de fogo.",
    "Estrogênio.", "Clareamento anal.", "Pessoas Negras.", "muito deficientes.", "Outro maldito filme de vampiro.",
    "burrito de café-da-manhã.", "Michael Jackson.", "Melhorias cibernéticas.", "Caras que não ligam.",
    "Cobertores com varíola.", "Masturbação.", "Insinuações classistas.", "Peido de buceta.",
    "Esconder uma ereção.", "Calcinhas comestíveis.", "Viagra®.", "Sopa que está muito quente.",
    "O Profeta Maomé (que Alá o abençoe).", "Sexo surpresa!", "Promoção da semana do Subway.",
    "Beber sozinho.", "Mão furada.", "Multiplos ferimentos de faca.", "Se cagar todo.", "Abuso infantil.",
    "Contas anais.", "Casualidade civil.", "Tirar de dentro.", "Robert Downey, Jr.", "Comida de cavalo.",
    "Um chapeu realmente maneiro.", "Kim Jong-il.", "Um pentenho rebelde.", "Fraternidades judias.",
    "Uma minoria minúscula.", "Meter na bunda.", "Dar comida a Cláudia Jimenez.", "Ensinar um robo a amar.",
    "Uma lata de chute-no-traseiro.", "Um moinho cheio de corpos.", "Conde Chocula.", "Usar a cueca no lado B.",
    "Raio da Morte.", "Telhado de vidro.", "Um isopor cheio de órgãos humanos.", "O sonho americano.",
    "Barris de cerveja.", "Peido molhado.", "Volta atrás.", "Bebês mortos.", "Prepúcio.", "Solos de saxofone.",
    "Italianos.", "Um feto.", "Atirar pra cima com um rifle enquanto cercado por porcos selvagens.",
    "José Sarney.", "Amputados.", "Eugenia.", "Meu status de relacionamento.", "Christopher Walken.",
    "Abelhas?", "Harry Potter erotica.", "Ensino Médio.", "Ficar Bebâdo com Cepacol.", "Nazistas.",
    "10 gramas de heroína mexicana.", "Stephen Hawking falando palavrão.", "Pais mortos.",
    "Permanência do objeto.", "Polegares Opositores.", "Questões do vestibular racistas.", "Bla-bla-bla.",
    "Explosões.", "Boa noite cinderela.", "Dando 110%.", "Motoserras para mãos.", "Cheirar cola.",
    "Minha vagina.", "Sua Alteza Real, Rainha Elizabeth II.", "Nicolas Cage.",
    "Boris Casoy sendo perseguido por uma revoada de urubus.", "Calça de cavalgada.", "A Trilha de Lágrimas.",
    "Concurso de Beleza Infantil.", "Repressão.", "Um assassinato cruel.", "Ser marginalizado.", "Goblins.",
    "Minha alma.", "Sedução.", "Música New Age.", "Esperança.", "A maior confusão.", "Um complexo de édipo.",
    "Hot Pockets®.", "Rev. Dr. Martin Luther King, Jr.", "Vikings.", "Gansos.", "Fazer bico.",
    "Um micropenis.", "Pessoas Gostosas.", "Aquecimento Global.", "Atropelamento.", "Voto das mulheres.",
    "Uma camisinha defeituosa.", "Você Decide.", "Crianças africanas.", "O Massacre da Candelária.",
    "Barack Obama.", "Asiáticos que não são bom em matemática.", "Velhinhos Japoneses.", "Trocar gentilesas.",
    "Heteronormatividade.", "Abrir o Mar Vermelho.", "Arnold Schwarzenegger.", "Boquete no carro.",
    "Um abdômen espetacular.", "Pudim de Figo.", "Um zoológico deprimido", "Um saco de feijões mágicos.",
    "Uma tartaruga mordendo a cabeça do seu pênis.", "Escolhas erradas.", "Uma detonação termonuclear.",
    "Minha vida sexual.", "clitóris.", "Auschwitz.", "O Big Bang.", "Minas terrestres.",
    "Amigos que comem todos os aperitivos.", "Bodes comendo latas.", "A Dança da Fadinha Doce.",
    "Se masturbar em uma poça de lágrimas de crianças.", "Carne humana.", "Um tempo particular.",
    "O Quilombo dos Palmares.", "Piadas sobre o Holocausto na hora errada.", "Mulheres em comerciais de iogurte.",
    "Um mar de problemas.", "Estimulante masculino natural.", "Fantasias de madeireiro.",
    "Ser um puta dum feiticeiro.", "A voz do Morgan Freeman.", "Piercing genital.", "Travestis que enganam.",
    "Lutas de travesseiro sexys.", "Ovos.", "Vovó.", "Fricção.", "Estraga-prazeres.", "Peidando e andando.",
    "Ser um imbecil com crianças.", "Colocar armadilhas na casa para protegê-las de ladrões.",
    "Travesseiros Suecos.", "Morrer.", "O furacão Katrina.", "Os gays.", "A tolice dos homens.", "Homens.",
    "Os Amish.", "Ovos de Pterodáctilo.", "Dinâmicas de grupo.", "Um tumor no cérebro.",
    "Cartas Contra a Humanidade.", "O próprio medo.", "Lady Gaga.", "O leiteiro.", "Uma boca suja."
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
let cartasSelecionadasRodada = []; // Controle de cartas clicadas
let estadoDaSala = {};
let dadosDosJogadores = {};
let efeitosAtivos = { ditador: false, duplo: false, investidor: false };
let loopDoAnfitriao = null;

function exibirNotificacao(mensagem) {
    const elementoDiv = document.getElementById('notificacao');
    const elementoTexto = document.getElementById('texto-notificacao');
    if(!elementoDiv || !elementoTexto) return;
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
    const alvo = document.getElementById(idDaTela);
    if(alvo) alvo.classList.add('ativa');
}

window.addEventListener('beforeunload', function() {
    if (nomeJogador) {
        bancoDados.ref('lobby/' + nomeJogador).remove();
    }
});

function entrarNoJogo() {
    const campoDeTexto = document.getElementById('input-nome');
    if(!campoDeTexto) return;
    
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
        
        jogadorAnfitriao = Object.keys(jogadoresAtuais).length === 0;
        
        const referenciaJogador = bancoDados.ref('lobby/' + nomeJogador);
        referenciaJogador.set({
            online: true,
            pontos: 0,
            censurado: false,
            imune: false,
            sabotado: false
        });
        
        referenciaJogador.onDisconnect().remove();
        
        if (jogadorAnfitriao) {
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
        if(listaNaTela) listaNaTela.innerHTML = '';
        
        if (!dadosDosJogadores[nomeJogador]) return;
        
        document.getElementById('meus-pontos').innerText = dadosDosJogadores[nomeJogador].pontos;
        
        if (dadosDosJogadores[nomeJogador].sabotado) {
            exibirNotificacao("Você foi alvo de sabotagem e perdeu suas cartas.");
            cartasNaMao = [];
            atualizarExibicaoDaMao();
            bancoDados.ref('lobby/' + nomeJogador + '/sabotado').set(false);
        }
        
        const chavesDosJogadores = Object.keys(dadosDosJogadores);
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            const nomeCorrente = chavesDosJogadores[index];
            let indicativo = "";
            if (nomeCorrente === nomeJogador) indicativo = " (Você)";
            if (jogadorAnfitriao && nomeCorrente === nomeJogador) indicativo += " [Anfitrião]";
            
            const pontuacao = dadosDosJogadores[nomeCorrente].pontos;
            if(listaNaTela) {
                listaNaTela.innerHTML += `<li>${nomeCorrente}${indicativo} <span>${pontuacao} pts</span></li>`;
            }
        }
    });
    
    bancoDados.ref('sala').on('value', function(snapshot) {
        const estadoAnterior = estadoDaSala.fase;
        estadoDaSala = snapshot.val() || {};
        
        const telaLobbyEstaAtiva = document.getElementById('tela-lobby').classList.contains('ativa');
        if (estadoDaSala.fase && telaLobbyEstaAtiva) {
            alterarTela('tela-jogo');
            if(cartasNaMao.length === 0) adicionarCartasNaMao(5);
            carregarItensDaLoja();
            iniciarLoopTemporalDoAnfitriao();
        }
        
        if (estadoDaSala.fase) {
            if(estadoDaSala.fase === 'jogando' && estadoAnterior !== 'jogando') {
                cartasSelecionadasRodada = [];
                atualizarExibicaoDaMao();
            }
            processarAtualizacaoVisualDaSala();
        }
    });
}

function iniciarLoopTemporalDoAnfitriao() {
    if (!jogadorAnfitriao) return;
    
    if (loopDoAnfitriao !== null) clearInterval(loopDoAnfitriao);
    
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
        tempoRestante: 60,
        efeitosGlobais: { inversao: false, cegueira: false, silencio: false }
    });
    
    const nomes = Object.keys(dadosDosJogadores);
    for (let index = 0; index < nomes.length; index++) {
        bancoDados.ref('lobby/' + nomes[index] + '/censurado').set(false);
    }
}

function formatarTempo(segundos) {
    if (segundos < 0) return "00:00";
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return (minutos < 10 ? "0" + minutos : minutos) + ":" + (segundosRestantes < 10 ? "0" + segundosRestantes : segundosRestantes);
}

function processarAtualizacaoVisualDaSala() {
    document.getElementById('carta-frase-atual').innerText = estadoDaSala.cartaPreta || "Carregando a frase...";
    
    let textoFase = estadoDaSala.fase === 'jogando' ? "Escolha sua resposta" : (estadoDaSala.fase === 'votacao' ? "Vote na melhor carta" : "Aguardando");
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
    
    if (estadoDaSala.efeitosGlobais) {
        if (estadoDaSala.efeitosGlobais.inversao) caixaDeEfeitos.innerHTML += "Alerta: Inversão ativada.<br>";
        if (estadoDaSala.efeitosGlobais.cegueira) caixaDeEfeitos.innerHTML += "Alerta: Cegueira ativada.<br>";
        if (estadoDaSala.efeitosGlobais.silencio) caixaDeEfeitos.innerHTML += "Alerta: Silêncio ativado.<br>";
    }

    if (estadoDaSala.fase === 'jogando') {
        document.getElementById('area-votacao').classList.add('escondido');
        document.getElementById('area-mao').classList.remove('escondido');
        
        const totalJogadores = Object.keys(dadosDosJogadores).length;
        const totalJogadas = Object.keys(estadoDaSala.jogadas || {}).length;
        
        if (jogadorAnfitriao && totalJogadas >= totalJogadores && totalJogadores > 1) {
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
            let classeCegueira = (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.cegueira && donoDaCarta !== nomeJogador) ? 'cegueira' : '';
            
            const htmlDaCarta = `<div class="carta carta-branca ${classeCegueira}" onclick="registrarVoto('${donoDaCarta}', this)">${textoDaCarta}</div>`;
            containerCartas.innerHTML += htmlDaCarta;
        }
        
        const totalJogadoresVotacao = Object.keys(dadosDosJogadores).length;
        const totalVotos = Object.keys(estadoDaSala.votos || {}).length;
        
        if (jogadorAnfitriao && totalVotos >= totalJogadoresVotacao && totalJogadoresVotacao > 1) {
            bancoDados.ref('sala/tempoRestante').set(-1);
            executarApuracaoDeVotos();
        }
    }
}

// ----------------------------------------------------------------------
// NOVA LÓGICA DE SELEÇÃO E ENVIO DE CARTAS INTEGRADA
// ----------------------------------------------------------------------
function alternarSelecaoCarta(indiceDaCarta) {
    if (estadoDaSala.fase !== 'jogando') return;
    
    let textoCartaAtual = estadoDaSala.cartaPreta || "";
    let lacunas = (textoCartaAtual.match(/___/g) || []).length;
    let limitePermitido = lacunas > 1 ? lacunas : 1;

    let index = cartasSelecionadasRodada.indexOf(indiceDaCarta);
    if (index > -1) {
        cartasSelecionadasRodada.splice(index, 1); // Desmarca se já tiver
    } else {
        if (cartasSelecionadasRodada.length < limitePermitido) {
            cartasSelecionadasRodada.push(indiceDaCarta);
        } else {
            exibirNotificacao(`Atenção: A frase exige exatamente ${limitePermitido} carta(s).`);
            return;
        }
    }
    atualizarExibicaoDaMao();
}

function confirmarEnvioCartas() {
    if (estadoDaSala.fase !== 'jogando') {
        exibirNotificacao("Este não é o momento de jogar cartas.");
        return;
    }
    if (estadoDaSala.jogadas && estadoDaSala.jogadas[nomeJogador]) {
        exibirNotificacao("Você já enviou sua jogada nesta rodada.");
        return;
    }
    if (dadosDosJogadores[nomeJogador].censurado) {
        exibirNotificacao("Você foi censurado e não pode enviar cartas.");
        return;
    }
    
    let textoCartaAtual = estadoDaSala.cartaPreta || "";
    let lacunas = (textoCartaAtual.match(/___/g) || []).length;
    let limitePermitido = lacunas > 1 ? lacunas : 1;
    
    if (cartasSelecionadasRodada.length !== limitePermitido) {
        exibirNotificacao(`Você precisa selecionar ${limitePermitido} carta(s) para confirmar!`);
        return;
    }

    // Junta as cartas selecionadas
    let respostasJogadas = cartasSelecionadasRodada.map(idx => cartasNaMao[idx]);
    let textoFinal = respostasJogadas.join(" | ");

    bancoDados.ref('sala/jogadas/' + nomeJogador).set(textoFinal);

    // Remove as cartas da mão (ordenando de trás pra frente para não bagunçar o array)
    cartasSelecionadasRodada.sort((a,b) => b-a).forEach(idx => {
        cartasNaMao.splice(idx, 1);
    });

    adicionarCartasNaMao(limitePermitido);
    cartasSelecionadasRodada = [];
    atualizarExibicaoDaMao();
    exibirNotificacao("Jogada enviada com sucesso!");
}
// ----------------------------------------------------------------------

function registrarVoto(jogadorAlvo, elementoVisual) {
    if (estadoDaSala.fase !== 'votacao') return;
    
    if (jogadorAlvo === nomeJogador) {
        exibirNotificacao("Não é permitido votar na própria carta.");
        return;
    }
    if (estadoDaSala.votos && estadoDaSala.votos[nomeJogador]) {
        exibirNotificacao("Seu voto já foi registrado.");
        return;
    }
    
    let pesoDoVoto = 1;
    if (efeitosAtivos.ditador) {
        pesoDoVoto = 100;
        efeitosAtivos.ditador = false;
    } else if (efeitosAtivos.duplo) {
        pesoDoVoto = 2;
        efeitosAtivos.duplo = false;
    }
    
    bancoDados.ref('sala/votos/' + nomeJogador).set({ para: jogadorAlvo, peso: pesoDoVoto });
    elementoVisual.classList.add('selecionada');
    exibirNotificacao("Voto contabilizado.");
}

function executarApuracaoDeVotos() {
    let tabelaDeContagem = {};
    const arrayVotos = Object.values(estadoDaSala.votos || {});
    
    for (let index = 0; index < arrayVotos.length; index++) {
        const destino = arrayVotos[index].para;
        if (!tabelaDeContagem[destino]) tabelaDeContagem[destino] = 0;
        tabelaDeContagem[destino] += arrayVotos[index].peso;
    }
    
    let nomeDoVencedor = null;
    let quantidadeDeVotosGanhadora = estadoDaSala.efeitosGlobais?.inversao ? 999999 : -1;
    
    const arrayContagem = Object.entries(tabelaDeContagem);
    for (let index = 0; index < arrayContagem.length; index++) {
        const jogadorApurado = arrayContagem[index][0];
        const votos = arrayContagem[index][1];
        
        if (estadoDaSala.efeitosGlobais?.inversao) {
            if (votos < quantidadeDeVotosGanhadora) {
                quantidadeDeVotosGanhadora = votos;
                nomeDoVencedor = jogadorApurado;
            }
        } else {
            if (votos > quantidadeDeVotosGanhadora) {
                quantidadeDeVotosGanhadora = votos;
                nomeDoVencedor = jogadorApurado;
            }
        }
    }
    
    if (nomeDoVencedor !== null) {
        let bonificacao = (efeitosAtivos.investidor && nomeDoVencedor === nomeJogador) ? 3 : 1;
        bancoDados.ref('lobby/' + nomeDoVencedor + '/pontos').once('value').then(snapshot => {
            bancoDados.ref('lobby/' + nomeDoVencedor + '/pontos').set((snapshot.val() || 0) + bonificacao);
        });
        exibirNotificacao(`O vencedor foi ${nomeDoVencedor} com ${quantidadeDeVotosGanhadora} votos.`);
    } else {
        exibirNotificacao("A rodada terminou sem vencedores.");
    }
    
    efeitosAtivos.investidor = false;
    bancoDados.ref('lobby/' + nomeJogador + '/imune').set(false);
    
    setTimeout(() => { if (jogadorAnfitriao) iniciarPartida(); }, 6000);
}

function adicionarCartasNaMao(quantidade) {
    for (let index = 0; index < quantidade; index++) {
        cartasNaMao.push(CARTAS_RESPOSTA[Math.floor(Math.random() * CARTAS_RESPOSTA.length)]);
    }
    atualizarExibicaoDaMao();
}

function atualizarExibicaoDaMao() {
    const containerDaMao = document.getElementById('minhas-cartas');
    if(!containerDaMao) return;
    
    containerDaMao.innerHTML = '';
    for (let index = 0; index < cartasNaMao.length; index++) {
        const isSelected = cartasSelecionadasRodada.includes(index);
        const classeSelecionada = isSelected ? ' selecionada' : '';
        
        const html = `<div class="carta carta-branca${classeSelecionada}" onclick="alternarSelecaoCarta(${index})">${cartasNaMao[index]}</div>`;
        containerDaMao.innerHTML += html;
    }
    
    // Mostra o botão "Confirmar" se o usuário selecionou as cartas suficientes
    const btnConfirmar = document.getElementById('btn-confirmar');
    if (btnConfirmar) {
        let textoCartaAtual = estadoDaSala.cartaPreta || "";
        let lacunas = (textoCartaAtual.match(/___/g) || []).length;
        let limitePermitido = lacunas > 1 ? lacunas : 1;
        
        if(cartasSelecionadasRodada.length === limitePermitido) {
            btnConfirmar.classList.remove('escondido');
        } else {
            btnConfirmar.classList.add('escondido');
        }
    }
}

function filtrarCartas() {
    const termo = document.getElementById('filtro-cartas').value.toLowerCase();
    const cartas = document.querySelectorAll('#minhas-cartas .carta-branca');
    cartas.forEach(c => c.style.display = c.innerText.toLowerCase().includes(termo) ? 'flex' : 'none');
}

function abrirLoja() {
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.silencio) {
        exibirNotificacao("A loja está fechada devido ao efeito de silêncio.");
        return;
    }
    document.getElementById('modal-loja').classList.remove('escondido');
}

function fecharLoja() {
    document.getElementById('modal-loja').classList.add('escondido');
}

function carregarItensDaLoja() {
    const container = document.getElementById('lista-itens');
    if(!container) return;
    container.innerHTML = '';
    
    ITENS_LOJA.forEach(item => {
        container.innerHTML += `<div class="item-loja"><div><h3>${item.nome}</h3><p>${item.desc}</p></div><button onclick="comprarItemDaLoja(${item.id}, ${item.preco})">Comprar por ${item.preco} pts</button></div>`;
    });
}

function comprarItemDaLoja(idItem, preco) {
    const pontos = dadosDosJogadores[nomeJogador].pontos;
    if (pontos >= preco) {
        bancoDados.ref('lobby/' + nomeJogador + '/pontos').set(pontos - preco);
        processarEfeitoDoItem(idItem);
        fecharLoja();
    } else {
        exibirNotificacao("Seus pontos são insuficientes.");
    }
}

function abrirModalDeSelecaoDeAlvo(titulo, callback) {
    fecharLoja();
    let htmlBotoes = '';
    Object.keys(dadosDosJogadores).forEach(nome => {
        if (nome !== nomeJogador) htmlBotoes += `<button class="btn-alvo" onclick="processarSelecaoDeAlvo('${nome}')">${nome}</button>`;
    });
    
    const modal = `<div id="modal-alvo" class="modal-overlay"><div class="conteudo-modal" style="max-width: 500px; text-align: center;"><h3 style="margin-bottom: 20px; color: #ff3333;">${titulo}</h3><div class="lista-alvos">${htmlBotoes}</div><button class="btn-fechar" onclick="fecharModalDeSelecao()">Cancelar</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modal);
    
    window.processarSelecaoDeAlvo = function(nomeSelecionado) {
        fecharModalDeSelecao();
        if (dadosDosJogadores[nomeSelecionado].imune) {
            exibirNotificacao("Ataque falhou. O jogador está protegido (Veto).");
        } else {
            callback(nomeSelecionado);
        }
    };
}

function fecharModalDeSelecao() {
    const modal = document.getElementById('modal-alvo');
    if (modal) modal.remove();
}

function exibirModalGenerico(titulo, texto) {
    const modal = `<div id="modal-generico" class="modal-overlay"><div class="conteudo-modal" style="max-width: 600px;"><h3 style="margin-bottom: 20px; color: #ffcc00;">${titulo}</h3><div style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">${texto}</div><button class="btn-fechar" onclick="fecharModalGenerico()">Entendi</button></div></div>`;
    document.body.insertAdjacentHTML('beforeend', modal);
}

function fecharModalGenerico() {
    const modal = document.getElementById('modal-generico');
    if (modal) modal.remove();
}

function processarEfeitoDoItem(idItem) {
    if (idItem === 1) {
        let conteudo = "";
        Object.entries(estadoDaSala.jogadas || {}).forEach(([dono, texto]) => conteudo += `<p><strong>${dono}:</strong> ${texto}</p>`);
        exibirModalGenerico("Relatório de Espionagem", conteudo || "Nenhuma carta foi jogada ainda.");
    } else if (idItem === 2) {
        efeitosAtivos.ditador = true; exibirNotificacao("Modo ditador ativo.");
    } else if (idItem === 3) {
        bancoDados.ref('lobby/' + nomeJogador + '/imune').set(true); exibirNotificacao("Você está imune.");
    } else if (idItem === 4) {
        abrirModalDeSelecaoDeAlvo("Escolha o jogador para sabotar", (alvo) => {
            bancoDados.ref('lobby/' + alvo + '/sabotado').set(true); exibirNotificacao(`Sabotagem contra ${alvo} feita.`);
        });
    } else if (idItem === 5) {
        adicionarCartasNaMao(3); exibirNotificacao("Três cartas extras recebidas.");
    } else if (idItem === 6) {
        abrirModalDeSelecaoDeAlvo("Roubar de quem?", (alvo) => {
            bancoDados.ref('lobby/' + alvo + '/pontos').once('value').then(snap => {
                bancoDados.ref('lobby/' + alvo + '/pontos').set(Math.max(0, (snap.val() || 0) - 1));
                bancoDados.ref('lobby/' + nomeJogador + '/pontos').once('value').then(mySnap => bancoDados.ref('lobby/' + nomeJogador + '/pontos').set((mySnap.val() || 0) + 1));
                exibirNotificacao("Roubo efetuado.");
            });
        });
    } else if (idItem === 7) {
        abrirModalDeSelecaoDeAlvo("Censurar quem?", (alvo) => {
            bancoDados.ref('lobby/' + alvo + '/censurado').set(true); exibirNotificacao(`${alvo} censurado.`);
        });
    } else if (idItem === 8) {
        bancoDados.ref('sala/tempoRestante').set(5); exibirNotificacao("Bomba ativada. Tempo reduzido!");
    } else if (idItem === 9) {
        cartasNaMao = []; adicionarCartasNaMao(5); exibirNotificacao("Cartas renovadas.");
    } else if (idItem === 10) {
        bancoDados.ref('sala/jogadas/' + nomeJogador).remove(); adicionarCartasNaMao(1); exibirNotificacao("Carta removida da mesa. Jogue novamente.");
    } else if (idItem === 11) {
        efeitosAtivos.duplo = true; exibirNotificacao("Próximo voto tem peso duplo.");
    } else if (idItem === 12) {
        bancoDados.ref('sala/efeitosGlobais/inversao').set(true); exibirNotificacao("A carta menos votada vai ganhar.");
    } else if (idItem === 13) {
        trocarCartaPreta(); exibirNotificacao("Frase substituída.");
    } else if (idItem === 14) {
        const chaves = Object.keys(dadosDosJogadores);
        let pontos = chaves.map(c => dadosDosJogadores[c].pontos);
        for (let i = pontos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pontos[i], pontos[j]] = [pontos[j], pontos[i]];
        }
        chaves.forEach((nome, i) => bancoDados.ref('lobby/' + nome + '/pontos').set(pontos[i]));
        exibirNotificacao("Caos: Pontuações embaralhadas!");
    } else if (idItem === 15) {
        bancoDados.ref('sala/votos').remove(); exibirNotificacao("Anarquia: Todos os votos anulados.");
    } else if (idItem === 16) {
        bancoDados.ref('sala/efeitosGlobais/cegueira').set(true); exibirNotificacao("Cegueira: Cartas inimigas ocultas.");
    } else if (idItem === 17) {
        efeitosAtivos.investidor = true; exibirNotificacao("Investidor: Bônus de pontos se vencer a rodada.");
    } else if (idItem === 18) {
        bancoDados.ref('sala/efeitosGlobais/silencio').set(true); exibirNotificacao("Silêncio: Loja bloqueada para todos.");
    } else if (idItem === 19) {
        const chaves = Object.keys(dadosDosJogadores);
        const soma = chaves.reduce((acc, nome) => acc + dadosDosJogadores[nome].pontos, 0);
        const media = Math.floor(soma / chaves.length);
        chaves.forEach(nome => bancoDados.ref('lobby/' + nome + '/pontos').set(media));
        exibirNotificacao("Comunismo: Pontos divididos igualmente.");
    } else if (idItem === 20) {
        if (jogadorAnfitriao) iniciarPartida();
        else bancoDados.ref('sala/tempoRestante').set(0);
        exibirNotificacao("Rodada será reiniciada imediatamente.");
    }
}

function trocarCartaPreta() {
    if(!jogadorAnfitriao) return;
    const novaFrase = CARTAS_FRASE[Math.floor(Math.random() * CARTAS_FRASE.length)];
    bancoDados.ref('sala/cartaPreta').set(novaFrase);
}

function trocarCartasMao() {
    cartasNaMao = cartasNaMao.map(() => CARTAS_RESPOSTA[Math.floor(Math.random() * CARTAS_RESPOSTA.length)]);
    cartasSelecionadasRodada = [];
    atualizarExibicaoDaMao();
    exibirNotificacao("Suas cartas foram trocadas!");
}
