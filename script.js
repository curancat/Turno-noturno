import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, doc, setDoc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB5rYYzsbn7rSfh2Q7iv20VtmWcvUTySaA",
  authDomain: "turno-noturno.firebaseapp.com",
  databaseURL: "https://turno-noturno-default-rtdb.firebaseio.com",
  projectId: "turno-noturno",
  storageBucket: "turno-noturno.firebasestorage.app",
  messagingSenderId: "452104216659",
  appId: "1:452104216659:web:982293f3f30b372e1b26a6",
  measurementId: "G-YQVGM2LLHW"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const items = [
    {id:1,n:"Espada Longa",p:350,ap:0,ad:10,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Ferro bruto forjado em desespero."},
    {id:2,n:"Tomo Amplificador",p:435,ap:20,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Páginas rasgadas de um grimório profano."},
    {id:3,n:"Cristal de Rubi",p:400,ap:0,ad:0,rm:0,rf:150,vm:0,mm:0,va:0,vp:0,req:[],l:"O sangue da terra solidificado."},
    {id:4,n:"Cristal de Safira",p:350,ap:0,ad:0,rm:0,rf:0,vm:250,mm:0,va:0,vp:0,req:[],l:"Lágrimas de um deus esquecido."},
    {id:5,n:"Cota de Malha",p:800,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:40,vp:0,req:[],l:"Anéis metálicos que ressoam proteção."},
    {id:6,n:"Capa Negatron",p:900,ap:0,ad:0,rm:50,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Absorve a magia ao redor como um buraco negro."},
    {id:7,n:"Botas da Velocidade",p:300,ap:0,ad:0,rm:0,rf:0,vm:0,mm:25,va:0,vp:0,req:[],l:"Sapatos leves para fugas rápidas."},
    {id:8,n:"Adaga",p:300,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:12,req:[],l:"Fina, cruel e rápida."},
    {id:9,n:"Luvas do Lutador",p:400,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Couro curtido na dor."},
    {id:10,n:"Talismã da Fada",p:250,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Murmúrios celestiais acalmam a mente."},
    {id:11,n:"Picareta",p:875,ap:0,ad:25,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Usada originalmente para minerar cristal de sangue."},
    {id:12,n:"Bastão Desnecessariamente Grande",p:1250,ap:60,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Irradia uma aura de pura arrogância mágica."},
    {id:13,n:"Cinto do Gigante",p:900,ap:0,ad:0,rm:0,rf:380,vm:0,mm:0,va:0,vp:0,req:[],l:"Muito grande para a maioria dos humanos."},
    {id:14,n:"Manto da Anulação",p:450,ap:0,ad:0,rm:25,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Corta laços fracos de energia arcana."},
    {id:15,n:"Couraça de Pano",p:300,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:15,vp:0,req:[],l:"Melhor que lutar nu."},
    {id:16,n:"Espada B.F.",p:1300,ap:0,ad:40,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Incrivelmente pesada e brutal."},
    {id:17,n:"Arco Recurvo",p:1000,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:25,req:[8,8],l:"Tensionado ao limite."},
    {id:18,n:"Fagote Vampírico",p:900,ap:0,ad:15,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[1],l:"Suga a vitalidade com cada golpe."},
    {id:19,n:"Lágrima da Deusa",p:400,ap:0,ad:0,rm:0,rf:0,vm:240,mm:0,va:0,vp:0,req:[],l:"Chora eternamente pelo que foi perdido."},
    {id:20,n:"Ídolo Proibido",p:800,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[10],l:"Entidade aprisionada em ouro."},
    {id:21,n:"Hexcore Mk-1",p:1000,ap:20,ad:0,rm:0,rf:0,vm:150,mm:0,va:0,vp:0,req:[2,4],l:"Primeiro protótipo de evolução sintética."},
    {id:22,n:"Códex Diabólico",p:900,ap:35,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[2],l:"Palavras que queimam os olhos de quem lê."},
    {id:23,n:"Varinha Explosiva",p:850,ap:40,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[],l:"Vibra com força destrutiva."},
    {id:24,n:"Brutalizador",p:1337,ap:0,ad:25,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[1,1],l:"Apenas dor."},
    {id:25,n:"Fago",p:1250,ap:0,ad:15,rm:0,rf:200,vm:0,mm:0,va:0,vp:0,req:[1,3],l:"O cabo esmaga, a lâmina corta."},
    {id:26,n:"Fulgor",p:700,ap:0,ad:0,rm:0,rf:0,vm:250,mm:0,va:0,vp:0,req:[4],l:"Luz aprisionada em geometria perfeita."},
    {id:27,n:"Zelo",p:1050,ap:0,ad:0,rm:0,rf:0,vm:0,mm:5,va:0,vp:15,req:[9,8],l:"Movimento é vida."},
    {id:28,n:"Espada Avaricenta",p:800,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[9],l:"Brilha mais quando perto do ouro."},
    {id:29,n:"Capuz do Espectro",p:1200,ap:0,ad:0,rm:25,rf:250,vm:0,mm:0,va:0,vp:0,req:[3,14],l:"Visões de morte acompanham quem veste."},
    {id:30,n:"Carapaça do Vigia",p:1000,ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:40,vp:0,req:[15,15],l:"Resiste a investidas impiedosas."},
    {id:31,n:"Força da Trindade",p:3333,ap:30,ad:30,rm:0,rf:250,vm:250,mm:5,va:0,vp:30,req:[25,26,27],l:"Dano, mobilidade e magia unidos no ápice."},
    {id:32,n:"Gume do Infinito",p:3400,ap:0,ad:70,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[16,11,9],l:"Corta até a própria realidade."},
    {id:33,n:"Sedenta por Sangue",p:3400,ap:0,ad:80,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[16,18],l:"Sempre tem sede. Sempre."},
    {id:34,n:"Rabadon",p:3600,ap:120,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[12,23],l:"O chapéu do arquimago mais louco da história."},
    {id:35,n:"Cajado do Vazio",p:2800,ap:65,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[23,2],l:"Anula a resistência da realidade."},
    {id:36,n:"Ampulheta de Zhonya",p:2900,ap:70,ad:0,rm:0,rf:0,vm:0,mm:0,va:45,vp:0,req:[12,30],l:"O tempo congela para os dignos."},
    {id:37,n:"Armadura de Warmog",p:3000,ap:0,ad:0,rm:0,rf:800,vm:0,mm:0,va:0,vp:0,req:[13,3,3],l:"Feita com a pele de um titã caído."},
    {id:38,n:"Coração Congelado",p:2500,ap:0,ad:0,rm:0,rf:0,vm:400,mm:0,va:80,vp:0,req:[30,4],l:"Diminui o ritmo cardíaco de todos ao redor."},
    {id:39,n:"Semblante Espiritual",p:2900,ap:0,ad:0,rm:50,rf:450,vm:0,mm:0,va:0,vp:0,req:[29,3],l:"Aumenta a conexão com as forças vitais."},
    {id:40,n:"Força da Natureza",p:2900,ap:0,ad:0,rm:70,rf:350,vm:0,mm:5,va:0,vp:0,req:[29,6],l:"Tempestades rugem na armadura."},
    {id:41,n:"Dançarina Fantasma",p:2600,ap:0,ad:0,rm:0,rf:0,vm:0,mm:7,va:0,vp:40,req:[27,8,8],l:"Mova-se como o vento, ataque como a tempestade."},
    {id:42,n:"Lâmina Fantasma de Youmuu",p:3000,ap:0,ad:55,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[24,1],l:"A lâmina de cerejeira ensanguentada."},
    {id:43,n:"Cutelo Negro",p:3100,ap:0,ad:40,rm:0,rf:400,vm:0,mm:0,va:0,vp:0,req:[25,11],l:"Quebra ossos e armaduras igualmente."},
    {id:44,n:"Rylai",p:2600,ap:75,ad:0,rm:0,rf:350,vm:0,mm:0,va:0,vp:0,req:[12,13],l:"O cetro cristalino da rainha do gelo."},
    {id:45,n:"Tormento de Liandry",p:3000,ap:70,ad:0,rm:0,rf:250,vm:0,mm:0,va:0,vp:0,req:[22,3,2],l:"Queima a alma dos indignos."},
    {id:46,n:"Máscara Abissal",p:2700,ap:0,ad:0,rm:60,rf:300,vm:300,mm:0,va:0,vp:0,req:[6,4,3],l:"Sussurra segredos obscuros aos inimigos."},
    {id:47,n:"Cajado do Arcanjo",p:3000,ap:60,ad:0,rm:0,rf:0,vm:500,mm:0,va:0,vp:0,req:[19,23],l:"O receptáculo divino de energia mística."},
    {id:48,n:"Manamune",p:2900,ap:0,ad:35,rm:0,rf:0,vm:500,mm:0,va:0,vp:0,req:[19,11],l:"Lâmina que canaliza a mente."},
    {id:49,n:"Lâmina da Fúria de Guinsoo",p:2600,ap:40,ad:40,rm:0,rf:0,vm:0,mm:0,va:0,vp:25,req:[11,23],l:"O frenesi da destruição absoluta."},
    {id:50,n:"Furacão de Runaan",p:2600,ap:0,ad:0,rm:0,rf:0,vm:0,mm:7,va:0,vp:45,req:[27,17],l:"Dispara contra todos ao mesmo tempo."},
    {id:51,n:"Canhão Fumegante",p:2500,ap:0,ad:0,rm:0,rf:0,vm:0,mm:7,va:0,vp:35,req:[27,8],l:"Alcancem os inalcançáveis."},
    {id:52,n:"Anjo Guardião",p:2800,ap:0,ad:40,rm:0,rf:0,vm:0,mm:0,va:40,vp:0,req:[16,5],l:"Sua hora ainda não chegou."},
    {id:53,n:"Placa Gargolítica",p:3200,ap:0,ad:0,rm:60,rf:0,vm:0,mm:0,va:60,vp:0,req:[6,5,3],l:"Torne-se pedra, inquebrável."},
    {id:54,n:"Ruptor Divino",p:3300,ap:0,ad:40,rm:0,rf:300,vm:0,mm:0,va:0,vp:0,req:[25,26],l:"Esmaga a fundação dos deuses."},
    {id:55,n:"Eclipsar",p:3200,ap:0,ad:55,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[24,18],l:"Sombra letal sob o sol negro."},
    {id:56,n:"Criafendas",p:3200,ap:70,ad:0,rm:0,rf:250,vm:0,mm:0,va:0,vp:0,req:[22,3,2],l:"Despedaça a tessitura do espaço."},
    {id:57,n:"Colhedor Noturno",p:3200,ap:85,ad:0,rm:0,rf:250,vm:0,mm:0,va:0,vp:0,req:[21,22],l:"A foice da meia-noite."},
    {id:58,n:"Explocinturão Hextec",p:3200,ap:80,ad:0,rm:0,rf:250,vm:0,mm:0,va:0,vp:0,req:[21,3],l:"Propulsão arcana agressiva."},
    {id:59,n:"Lâmina do Rei Destruído",p:3200,ap:0,ad:40,rm:0,rf:0,vm:0,mm:0,va:0,vp:25,req:[18,17],l:"A tristeza de um rei transformado em aço."},
    {id:60,n:"Mandato Imperial",p:2500,ap:40,ad:0,rm:0,rf:200,vm:0,mm:0,va:0,vp:0,req:[22,3],l:"Ordene e destrua."},
    {id:61,n:"Redenção",p:2300,ap:0,ad:0,rm:0,rf:200,vm:0,mm:0,va:0,vp:0,req:[20,3],l:"Luz pura sobre o campo de batalha."},
    {id:62,n:"Juramento do Cavaleiro",p:2200,ap:0,ad:0,rm:0,rf:400,vm:0,mm:0,va:0,vp:0,req:[13,3],l:"Minha vida pela sua."},
    {id:63,n:"Convergência de Zeke",p:2400,ap:0,ad:0,rm:25,rf:250,vm:250,mm:0,va:25,vp:0,req:[3,15,14,4],l:"Tempestade forjada em conjunto."},
    {id:64,n:"Medalhão dos Solari",p:2500,ap:0,ad:0,rm:30,rf:200,vm:0,mm:0,va:30,vp:0,req:[14,15,3],l:"Protege os fiéis ao sol."},
    {id:65,n:"Quimiotanque Turbo",p:2800,ap:0,ad:0,rm:50,rf:350,vm:0,mm:0,va:0,vp:0,req:[29,3],l:"Química tóxica impulsionando carne morta."},
    {id:66,n:"Manopla dos Glacinatas",p:2800,ap:0,ad:0,rm:0,rf:350,vm:0,mm:0,va:50,vp:0,req:[26,5],l:"Frio paralisante em cada golpe."},
    {id:67,n:"Égide de Fogo Solar",p:3200,ap:0,ad:0,rm:30,rf:350,vm:0,mm:0,va:30,vp:0,req:[5,14,3],l:"Ande como um sol incandescente."},
    {id:68,n:"Coroa da Rainha Despedaçada",p:2800,ap:70,ad:0,rm:0,rf:250,vm:0,mm:0,va:0,vp:0,req:[22,3],l:"Defesa espectral de um reinado antigo."},
    {id:69,n:"Lúden",p:3200,ap:80,ad:0,rm:0,rf:0,vm:600,mm:0,va:0,vp:0,req:[23,22,4],l:"Explosões sonoras de pura magia."},
    {id:70,n:"Glaive Sombria",p:2600,ap:0,ad:50,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[24,1],l:"Corta a luz, espalha a escuridão."},
    {id:71,n:"Crepúsculo de Draktharr",p:3100,ap:0,ad:60,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[24,11],l:"Caçador invisível da noite sem estrelas."},
    {id:72,n:"Arco-escudo Imortal",p:3400,ap:0,ad:50,rm:0,rf:0,vm:0,mm:0,va:0,vp:20,req:[18,27],l:"Sobrevivência cravada em flechas."},
    {id:73,n:"Força do Vendaval",p:3400,ap:0,ad:60,rm:0,rf:0,vm:0,mm:7,va:0,vp:20,req:[16,27],l:"O vento obedece ao portador."},
    {id:74,n:"Mata-Cráquenes",p:3400,ap:0,ad:65,rm:0,rf:0,vm:0,mm:0,va:0,vp:25,req:[16,17],l:"Matador de leviatãs, um golpe por vez."},
    {id:75,n:"Rancor de Serylda",p:3200,ap:0,ad:45,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[24,11],l:"O frio do ressentimento eterno."},
    {id:76,n:"Lembranças do Lorde Dominik",p:3000,ap:0,ad:30,rm:0,rf:0,vm:0,mm:0,va:0,vp:20,req:[11,27],l:"Tomba reis gigantes."},
    {id:77,n:"Anjo Caído",p:3100,ap:40,ad:40,rm:20,rf:20,vm:0,mm:0,va:20,vp:20,req:[52,22],l:"Pureza corrompida pelo ódio."},
    {id:78,n:"Devorador de Almas",p:3400,ap:100,ad:0,rm:0,rf:200,vm:0,mm:0,va:0,vp:0,req:[12,23,3],l:"Alimenta-se do medo mágico."},
    {id:79,n:"Abraço de Seraph",p:3200,ap:80,ad:0,rm:0,rf:250,vm:860,mm:0,va:0,vp:0,req:[47],l:"Transformado pelo sofrimento."},
    {id:80,n:"Muramana",p:3000,ap:0,ad:35,rm:0,rf:0,vm:860,mm:0,va:0,vp:0,req:[48],l:"Lâmina que chora e dilacera."},
    {id:81,n:"Dente de Na'Shor",p:3000,ap:100,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:50,req:[22,17],l:"Presa de um horror cósmico."},
    {id:82,n:"Perdição de Lich",p:3000,ap:75,ad:0,rm:0,rf:0,vm:0,mm:8,va:0,vp:0,req:[26,23],l:"Golpes banhados em magia letal."},
    {id:83,n:"Foco do Horizonte",p:3000,ap:115,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[12,2],l:"O alvo não pode se esconder."},
    {id:84,n:"Chama Sombria",p:3000,ap:100,ad:0,rm:0,rf:200,vm:0,mm:0,va:0,vp:0,req:[23,3],l:"Fogo que não aquece, apenas queima."},
    {id:85,n:"Banshee",p:2600,ap:80,ad:0,rm:45,rf:0,vm:0,mm:0,va:0,vp:0,req:[22,6],l:"O lamento do véu protege da morte."},
    {id:86,n:"Putrificador Quimtec",p:2300,ap:60,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[22,10],l:"Espalha feridas irrecuperáveis."},
    {id:87,n:"Turíbulo Ardente",p:2300,ap:60,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[20,2],l:"Incenso que acelera o pulso dos aliados."},
    {id:88,n:"Limiar da Noite",p:2900,ap:0,ad:50,rm:0,rf:325,vm:0,mm:0,va:0,vp:0,req:[24,3],l:"A proteção letal nas sombras."},
    {id:89,n:"Dança da Morte",p:3300,ap:0,ad:55,rm:0,rf:0,vm:0,mm:0,va:45,vp:0,req:[11,5],l:"Transmuta o dano em pura adrenalina."},
    {id:90,n:"Hexdrinker",p:1300,ap:0,ad:20,rm:35,rf:0,vm:0,mm:0,va:0,vp:0,req:[1,14],l:"Bebe magia como água."},
    {id:91,n:"Fauce de Malmortius",p:2900,ap:0,ad:50,rm:50,rf:0,vm:0,mm:0,va:0,vp:0,req:[90,11],l:"Devora o fim de quem depende de feitiços."},
    {id:92,n:"Sinal de Sterak",p:3100,ap:0,ad:50,rm:0,rf:400,vm:0,mm:0,va:0,vp:0,req:[11,13],l:"A fúria primal despertada."},
    {id:93,n:"Titânica",p:3300,ap:0,ad:30,rm:0,rf:500,vm:0,mm:0,va:0,vp:0,req:[13,11],l:"Cada golpe treme a própria fundação da terra."},
    {id:94,n:"Raivosa",p:3300,ap:0,ad:65,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[16,18],l:"Sede de sangue insaciável em área."},
    {id:95,n:"O Cutelo",p:3000,ap:0,ad:50,rm:0,rf:300,vm:0,mm:0,va:0,vp:0,req:[43],l:"Corta tudo."},
    {id:96,n:"Gume do Destino",p:3800,ap:0,ad:90,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[32,16],l:"Último suspiro do universo."},
    {id:97,n:"Coroa de Sangue",p:3800,ap:150,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,req:[34,12],l:"Poder absoluto, custo absoluto."},
    {id:98,n:"Égide Eterna",p:3800,ap:0,ad:0,rm:80,rf:1000,vm:0,mm:0,va:80,vp:0,req:[37,53],l:"Nem estrelas podem penetrar."},
    {id:99,n:"Lâmina do Templo",p:4000,ap:80,ad:80,rm:0,rf:300,vm:300,mm:10,va:0,vp:40,req:[31,49],l:"Arma dos deuses esquecidos."},
    {id:100,n:"Olho de Templo",p:4000,ap:120,ad:0,rm:50,rf:500,vm:0,mm:0,va:50,vp:0,req:[36,44,22],l:"Tudo vê. Tudo acaba."}
];

let currentUser = null;
let currentRune = null;
let friendSnapshot = null;
let chatSnapshot = null;
let gameSessionId = null;

const state = {
    turnPhase: 0,
    mana: 0,
    maxMana: 0,
    hp: 4000,
    enemyHp: 4000,
    comboBuffer: [],
    comboTimer: null,
    jungleIndex: 0,
    jungleMonsters: [
        {name:"Fantasma", hp:1000, atk:50, mhp:1000},
        {name:"Gordão da X9", hp:2500, atk:120, mhp:2500},
        {name:"Twink", hp:1500, atk:300, mhp:1500},
        {name:"Saqueleto", hp:4000, atk:80, mhp:4000},
        {name:"Dragão Bafo Colgate", hp:8000, atk:400, mhp:8000},
        {name:"Seu Zé", hp:15000, atk:999, mhp:15000}
    ]
};

const dom = {
    authContainer: document.getElementById('auth-container'),
    appContainer: document.getElementById('app-container'),
    loginForm: document.getElementById('login-form'),
    registerForm: document.getElementById('register-form'),
    authToggle: document.getElementById('auth-toggle'),
    tabs: document.querySelectorAll('.tab-btn'),
    tabContents: document.querySelectorAll('.tab-content'),
    btnLogout: document.getElementById('btn-logout'),
    playerName: document.getElementById('player-name-display'),
    bgm: document.getElementById('bgm'),
    volControl: document.getElementById('vol-control'),
    chatMessages: document.getElementById('chat-messages'),
    chatInput: document.getElementById('chat-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    friendsUl: document.getElementById('friends-ul'),
    friendInput: document.getElementById('friend-input'),
    btnAddFriend: document.getElementById('btn-add-friend'),
    shopGrid: document.getElementById('shop-grid'),
    shopSearch: document.getElementById('shop-search'),
    shopSort: document.getElementById('shop-sort'),
    btnCalcBuild: document.getElementById('btn-calc-build'),
    buildResult: document.getElementById('build-result'),
    btnFindMatch: document.getElementById('btn-find-match'),
    matchStatus: document.getElementById('match-status'),
    matchmakingPanel: document.getElementById('matchmaking-panel'),
    gameBoard: document.getElementById('game-board'),
    runeCards: document.querySelectorAll('.rune-card'),
    canvas: document.getElementById('spell-canvas'),
    playerHpFill: document.getElementById('player-hp-fill'),
    playerHpText: document.getElementById('player-hp-text'),
    enemyHpFill: document.getElementById('enemy-hp-fill'),
    enemyHpText: document.getElementById('enemy-hp-text'),
    monsterName: document.getElementById('monster-name'),
    monsterHp: document.getElementById('monster-hp'),
    monsterAtk: document.getElementById('monster-atk'),
    playerMana: document.getElementById('player-mana'),
    playerMaxMana: document.getElementById('player-max-mana'),
    turnIndicator: document.getElementById('turn-indicator'),
    btnEndPhase: document.getElementById('btn-end-phase'),
    playerHand: document.getElementById('player-hand'),
    comboDisplay: document.getElementById('combo-display')
};

dom.authToggle.addEventListener('click', () => {
    const isLogin = dom.loginForm.style.display !== 'none';
    dom.loginForm.style.display = isLogin ? 'none' : 'block';
    dom.registerForm.style.display = isLogin ? 'block' : 'none';
    dom.authToggle.innerText = isLogin ? 'Já tenho uma conta' : 'Criar nova conta';
});

dom.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await signInWithEmailAndPassword(auth, document.getElementById('login-email').value, document.getElementById('login-password').value);
    } catch(err) {}
});

dom.registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const res = await createUserWithEmailAndPassword(auth, document.getElementById('register-email').value, document.getElementById('register-password').value);
        await updateProfile(res.user, { displayName: document.getElementById('register-name').value });
        await setDoc(doc(db, "users", res.user.uid), {
            name: document.getElementById('register-name').value,
            online: true,
            friends: []
        });
    } catch(err) {}
});

dom.btnLogout.addEventListener('click', () => {
    if(currentUser) setDoc(doc(db, "users", currentUser.uid), { online: false }, { merge: true });
    signOut(auth);
});

onAuthStateChanged(auth, user => {
    if(user) {
        currentUser = user;
        dom.authContainer.style.display = 'none';
        dom.appContainer.style.display = 'flex';
        dom.playerName.innerText = user.displayName || user.email;
        dom.bgm.volume = dom.volControl.value;
        dom.bgm.play().catch(()=>{});
        initApp();
        setDoc(doc(db, "users", user.uid), { online: true }, { merge: true });
    } else {
        currentUser = null;
        dom.authContainer.style.display = 'flex';
        dom.appContainer.style.display = 'none';
        dom.bgm.pause();
        if(chatSnapshot) chatSnapshot();
        if(friendSnapshot) friendSnapshot();
    }
});

dom.volControl.addEventListener('input', e => dom.bgm.volume = e.target.value);

dom.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        dom.tabs.forEach(t => t.classList.remove('active'));
        dom.tabContents.forEach(c => c.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.target).classList.add('active');
    });
});

function initApp() {
    renderShop(items);
    initChat();
    initFriends();
    setupRunes();
}

function initChat() {
    const q = query(collection(db, "globalChat"), orderBy("ts", "desc"), limit(100));
    chatSnapshot = onSnapshot(q, snap => {
        dom.chatMessages.innerHTML = '';
        const msgs = [];
        snap.forEach(d => msgs.push(d.data()));
        msgs.reverse().forEach(m => {
            const div = document.createElement('div');
            div.className = 'chat-msg';
            const date = new Date(m.ts);
            div.innerHTML = `<span class="time">[${date.getHours().toString().padStart(2,'0')}:${date.getMinutes().toString().padStart(2,'0')}]</span><span class="author">${m.name}:</span>${m.txt}`;
            dom.chatMessages.appendChild(div);
        });
        dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
    });
}

dom.btnSendChat.addEventListener('click', sendChat);
dom.chatInput.addEventListener('keypress', e => { if(e.key === 'Enter') sendChat(); });

async function sendChat() {
    const txt = dom.chatInput.value.trim();
    if(!txt) return;
    dom.chatInput.value = '';
    await addDoc(collection(db, "globalChat"), {
        uid: currentUser.uid,
        name: currentUser.displayName,
        txt: txt,
        ts: Date.now()
    });
}

function initFriends() {
    friendSnapshot = onSnapshot(doc(db, "users", currentUser.uid), async snap => {
        dom.friendsUl.innerHTML = '';
        if(!snap.exists()) return;
        const data = snap.data();
        if(!data.friends) return;
        for(let uid of data.friends) {
            const fdoc = await getDoc(doc(db, "users", uid));
            if(fdoc.exists()) {
                const fd = fdoc.data();
                const li = document.createElement('li');
                li.innerHTML = `<span>${fd.name}</span> <span class="${fd.online?'status-online':'status-offline'}">${fd.online?'Online':'Offline'}</span>`;
                dom.friendsUl.appendChild(li);
            }
        }
    });
}

dom.btnAddFriend.addEventListener('click', async () => {
    const input = dom.friendInput.value.trim();
    if(!input) return;
    dom.friendInput.value = '';
    const ref = doc(db, "users", currentUser.uid);
    const snap = await getDoc(ref);
    let fr = snap.data().friends || [];
    if(!fr.includes(input)) {
        fr.push(input);
        await updateDoc(ref, { friends: fr });
    }
});

function renderShop(list) {
    dom.shopGrid.innerHTML = '';
    list.forEach(i => {
        const div = document.createElement('div');
        div.className = 'shop-item';
        div.innerHTML = `
            <h4>${i.n}</h4>
            <span class="price">${i.p} G</span>
            <div class="stats">
                ${i.ap ? `<span>AP: ${i.ap}</span>` : ''}
                ${i.ad ? `<span>AD: ${i.ad}</span>` : ''}
                ${i.rm ? `<span>RM: ${i.rm}</span>` : ''}
                ${i.rf ? `<span>HP: ${i.rf}</span>` : ''}
                ${i.vm ? `<span>Mana: ${i.vm}</span>` : ''}
                ${i.mm ? `<span>MS: ${i.mm}%</span>` : ''}
                ${i.va ? `<span>Armor: ${i.va}</span>` : ''}
                ${i.vp ? `<span>AS: ${i.vp}%</span>` : ''}
            </div>
            <div class="lore">${i.l}</div>
        `;
        dom.shopGrid.appendChild(div);
    });
}

function filterShop() {
    const q = dom.shopSearch.value.toLowerCase();
    const s = dom.shopSort.value;
    let arr = items.filter(i => i.n.toLowerCase().includes(q));
    arr.sort((a,b) => {
        if(s === 'price') return a.p - b.p;
        if(s === 'name') return a.n.localeCompare(b.n);
        if(s === 'ap') return b.ap - a.ap;
        if(s === 'ad') return b.ad - a.ad;
        return 0;
    });
    renderShop(arr);
}

dom.shopSearch.addEventListener('input', filterShop);
dom.shopSort.addEventListener('change', filterShop);

dom.btnCalcBuild.addEventListener('click', () => {
    const t = {
        ap: parseInt(document.getElementById('t-ap').value)||0,
        ad: parseInt(document.getElementById('t-ad').value)||0,
        rm: parseInt(document.getElementById('t-rm').value)||0,
        rf: parseInt(document.getElementById('t-rf').value)||0,
        vm: parseInt(document.getElementById('t-vm').value)||0,
        mm: parseInt(document.getElementById('t-mm').value)||0,
        va: parseInt(document.getElementById('t-va').value)||0,
        vp: parseInt(document.getElementById('t-vp').value)||0
    };
    
    let best = null;
    let minPrice = Infinity;

    for(let i=0; i<3000; i++) {
        let current = {ap:0,ad:0,rm:0,rf:0,vm:0,mm:0,va:0,vp:0,p:0};
        let selection = [];
        for(let j=0; j<6; j++) {
            const r = items[Math.floor(Math.random()*items.length)];
            current.ap += r.ap; current.ad += r.ad; current.rm += r.rm;
            current.rf += r.rf; current.vm += r.vm; current.mm += r.mm;
            current.va += r.va; current.vp += r.vp; current.p += r.p;
            selection.push(r.n);
        }
        if(current.ap >= t.ap && current.ad >= t.ad && current.rm >= t.rm &&
           current.rf >= t.rf && current.vm >= t.vm && current.mm >= t.mm &&
           current.va >= t.va && current.vp >= t.vp) {
            if(current.p < minPrice) {
                minPrice = current.p;
                best = selection;
            }
        }
    }

    if(best) {
        dom.buildResult.innerHTML = `<strong>Custo Mínimo Estimado: ${minPrice}G</strong><br><br>${best.join('<br>')}`;
    } else {
        dom.buildResult.innerHTML = `<span style="color:#aa3a3a">Nenhuma build de 6 itens atinge esses atributos.</span>`;
    }
});

function setupRunes() {
    dom.runeCards.forEach(c => {
        c.addEventListener('click', () => {
            dom.runeCards.forEach(rc => rc.classList.remove('selected'));
            c.classList.add('selected');
            currentRune = c.dataset.rune;
        });
    });
}

dom.btnFindMatch.addEventListener('click', () => {
    if(!currentRune) {
        dom.matchStatus.innerText = "Selecione uma runa primeiro!";
        return;
    }
    dom.matchStatus.innerText = "Buscando oponentes no Templo...";
    setTimeout(() => {
        dom.matchmakingPanel.style.display = 'none';
        dom.gameBoard.style.display = 'flex';
        startGame();
    }, 2000);
});

function startGame() {
    state.hp = 4000;
    state.enemyHp = 4000;
    state.turnPhase = 0;
    state.maxMana = 1;
    state.mana = 1;
    state.jungleIndex = 0;
    updateUI();
    generateHand();
}

function updateUI() {
    dom.playerHpText.innerText = `${Math.floor(state.hp)}/4000`;
    dom.playerHpFill.style.width = `${Math.max(0, (state.hp/4000)*100)}%`;
    dom.enemyHpText.innerText = `${Math.floor(state.enemyHp)}/4000`;
    dom.enemyHpFill.style.width = `${Math.max(0, (state.enemyHp/4000)*100)}%`;
    dom.playerMana.innerText = state.mana;
    dom.playerMaxMana.innerText = state.maxMana;
    
    const m = state.jungleMonsters[state.jungleIndex];
    if(m) {
        dom.monsterName.innerText = m.name;
        dom.monsterHp.innerText = m.hp;
        dom.monsterAtk.innerText = m.atk;
    }

    const phases = ["Fase de Compra", "Fase Principal", "Fase de Combate", "Fim de Turno"];
    dom.turnIndicator.innerText = phases[state.turnPhase];

    if(state.hp <= 0 && currentRune === 'morte') {
        state.hp = 4000;
        currentRune = null;
        updateUI();
    }
}

dom.btnEndPhase.addEventListener('click', () => {
    state.turnPhase++;
    if(state.turnPhase > 3) {
        state.turnPhase = 0;
        if(state.maxMana < 10) state.maxMana++;
        state.mana = state.maxMana;
        if(currentRune === 'anjo') state.mana = Math.min(10, state.mana + 2);
        generateHand();
    }
    updateUI();
});

function generateHand() {
    dom.playerHand.innerHTML = '';
    for(let i=0; i<5; i++) {
        const c = items[Math.floor(Math.random()*items.length)];
        const div = document.createElement('div');
        div.className = 'card-item';
        div.draggable = true;
        div.innerHTML = `<b>${c.n}</b><br>${c.p}G`;
        div.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', c.id));
        dom.playerHand.appendChild(div);
    }
}

document.getElementById('player-board').addEventListener('dragover', e => e.preventDefault());
document.getElementById('player-board').addEventListener('drop', e => {
    e.preventDefault();
    const id = parseInt(e.dataTransfer.getData('text/plain'));
    const item = items.find(i => i.id === id);
    if(item && state.turnPhase === 1) {
        const div = document.createElement('div');
        div.className = 'card-item';
        div.innerHTML = `<b>${item.n}</b><br>ATK: ${item.ad || item.ap}`;
        document.getElementById('player-board').appendChild(div);
        Array.from(dom.playerHand.children).forEach(c => {
            if(c.innerHTML.includes(item.n)) c.remove();
        });
    }
});

let isDrawing = false;
let points = [];
const ctx = dom.canvas.getContext('2d');

window.addEventListener('keydown', e => {
    if(dom.gameBoard.style.display === 'flex' && (e.key === 'q' || e.key === 'w' || e.key === 'e')) {
        dom.canvas.classList.add('active');
        dom.canvas.width = dom.gameBoard.offsetWidth;
        dom.canvas.height = dom.gameBoard.offsetHeight;
        ctx.strokeStyle = e.key === 'q' ? '#ff3300' : e.key === 'w' ? '#00ccff' : '#9900ff';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }
});

dom.canvas.addEventListener('mousedown', e => {
    if(!dom.canvas.classList.contains('active')) return;
    isDrawing = true;
    points = [];
    const rect = dom.canvas.getBoundingClientRect();
    points.push({x: e.clientX - rect.left, y: e.clientY - rect.top});
});

dom.canvas.addEventListener('mousemove', e => {
    if(!isDrawing) return;
    const rect = dom.canvas.getBoundingClientRect();
    const pt = {x: e.clientX - rect.left, y: e.clientY - rect.top};
    points.push(pt);
    ctx.clearRect(0,0,dom.canvas.width,dom.canvas.height);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for(let i=1; i<points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
});

dom.canvas.addEventListener('mouseup', () => {
    if(!isDrawing) return;
    isDrawing = false;
    dom.canvas.classList.remove('active');
    ctx.clearRect(0,0,dom.canvas.width,dom.canvas.height);
    analyzeGesture();
});

function analyzeGesture() {
    if(points.length < 10) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    points.forEach(p => {
        if(p.x < minX) minX = p.x;
        if(p.x > maxX) maxX = p.x;
        if(p.y < minY) minY = p.y;
        if(p.y > maxY) maxY = p.y;
    });

    const w = maxX - minX;
    const h = maxY - minY;
    const start = points[0];
    const end = points[points.length-1];
    const dx = Math.abs(start.x - end.x);
    const dy = Math.abs(start.y - end.y);
    
    let spell = "";

    if(w < 50 && h > 100) spell = "|";
    else if(Math.hypot(start.x - end.x, start.y - end.y) < 50 && w > 50 && h > 50) spell = "0";
    else if(w > 100 && points.some(p => p.x > start.x + 50 && p.x > end.x + 50)) spell = ">";

    if(spell) {
        state.comboBuffer.push(spell);
        clearTimeout(state.comboTimer);
        state.comboTimer = setTimeout(() => { state.comboBuffer = []; updateCombo(); }, 2000);
        updateCombo();
        processCombo();
    }
}

function updateCombo() {
    dom.comboDisplay.innerText = state.comboBuffer.join(" + ");
}

function processCombo() {
    const c = state.comboBuffer.join("");
    let limit = currentRune === 'pintor' ? 4 : 3;
    if(state.comboBuffer.length === limit) {
        if(c.includes("0") && c.includes("|")) applyDamage(500);
        else if(c.includes(">")) applyDamage(800);
        else applyDamage(300);
        state.comboBuffer = [];
        updateCombo();
    }
}

function applyDamage(dmg) {
    if(currentRune === 'ondas' && state.hp < 400) state.enemyHp -= dmg * 1.3;
    else state.enemyHp -= dmg;
    
    const m = state.jungleMonsters[state.jungleIndex];
    if(m) {
        m.hp -= dmg;
        if(m.hp <= 0) {
            state.jungleIndex++;
            state.mana += 2;
        }
    }

    if(currentRune === 'clone' && Math.random() > 0.7) {
        state.enemyHp -= dmg; 
    }

    updateUI();
}

if(currentRune === 'script') {
    setInterval(() => {
        if(dom.gameBoard.style.display === 'flex' && state.turnPhase === 2) {
            applyDamage(50);
        }
    }, 1000);
}
