import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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

let currentUser = null;
let currentRune = null;
let isPintorMestre = false;
let comboBuffer = [];
let comboTimer = null;
let jungleIndex = 0;
let desesperoTurns = 0;
let playerStats = { hp: 1000, maxHp: 1000, mana: 500, maxMana: 500, gold: 0, ap: 0, ad: 0, rm: 0, rf: 0, va: 0, vp: 0 };
let enemyStats = { hp: 1000, maxHp: 1000 };
let gameActive = false;
let autoFarmInterval = null;
let vpInterval = null;

const jungleMonsters = [
    { name: "Fantasma", hp: 100, gold: 50 },
    { name: "Gordão da X9", hp: 300, gold: 150 },
    { name: "Twink", hp: 600, gold: 300 },
    { name: "Saqueleto", hp: 1000, gold: 500 },
    { name: "Dragão Bafo Colgate", hp: 2500, gold: 1200 },
    { name: "Seu Zé", hp: 9999, gold: 5000 }
];

const items = [
    { id: 1, name: "Graveto Fino", rarity: "Lixo", cost: 10, stats: { AD: 1, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 2, name: "Pedra Pomes", rarity: "Lixo", cost: 10, stats: { AD: 0, AP: 1, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 3, name: "Bota Furada", rarity: "Lixo", cost: 10, stats: { AD: 0, AP: 0, RM: 0, RF: 1, VM: 5, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 4, name: "Pedaço de Pano", rarity: "Lixo", cost: 10, stats: { AD: 0, AP: 0, RM: 1, RF: 0, VM: 5, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 5, name: "Copo Sujo", rarity: "Lixo", cost: 10, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 10, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 6, name: "Prego Enferrujado", rarity: "Lixo", cost: 15, stats: { AD: 2, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 7, name: "Folha Seca", rarity: "Lixo", cost: 15, stats: { AD: 0, AP: 2, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 8, name: "Corda Puída", rarity: "Lixo", cost: 15, stats: { AD: 0, AP: 0, RM: 1, RF: 1, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 9, name: "Osso Quebrado", rarity: "Lixo", cost: 15, stats: { AD: 1, AP: 1, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 10, name: "Garrafa Quebrada", rarity: "Lixo", cost: 15, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 10, MM: 10, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 11, name: "Pedaço de Giz", rarity: "Lixo", cost: 20, stats: { AD: 0, AP: 3, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 12, name: "Cabo de Vassoura", rarity: "Lixo", cost: 20, stats: { AD: 3, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 13, name: "Tampa de Bueiro", rarity: "Lixo", cost: 20, stats: { AD: 0, AP: 0, RM: 0, RF: 3, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 14, name: "Guarda-chuva Quebrado", rarity: "Lixo", cost: 20, stats: { AD: 0, AP: 0, RM: 3, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 15, name: "Semente Estragada", rarity: "Lixo", cost: 20, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 15, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 16, name: "Agulha Torta", rarity: "Lixo", cost: 25, stats: { AD: 2, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 1, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 17, name: "Pena Suja", rarity: "Lixo", cost: 25, stats: { AD: 0, AP: 2, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 1 }, recipe: [], active: "Nenhuma" },
    { id: 18, name: "Carvão Úmido", rarity: "Lixo", cost: 25, stats: { AD: 0, AP: 1, RM: 1, RF: 1, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 19, name: "Papel Amassado", rarity: "Lixo", cost: 25, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 20, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 20, name: "Resto de Comida", rarity: "Lixo", cost: 25, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 20, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 21, name: "Espada de Ferro", rarity: "Comum", cost: 100, stats: { AD: 10, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 22, name: "Varinha de Aprendiz", rarity: "Comum", cost: 100, stats: { AD: 0, AP: 10, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 23, name: "Armadura de Couro", rarity: "Comum", cost: 100, stats: { AD: 0, AP: 0, RM: 0, RF: 10, VM: 50, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 24, name: "Manto Menor", rarity: "Comum", cost: 100, stats: { AD: 0, AP: 0, RM: 10, RF: 0, VM: 50, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 25, name: "Cristal de Mana", rarity: "Comum", cost: 100, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 100, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 26, name: "Cristal de Vida", rarity: "Comum", cost: 100, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 100, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 27, name: "Adaga Fina", rarity: "Comum", cost: 150, stats: { AD: 15, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 28, name: "Cajado Quebrado", rarity: "Comum", cost: 150, stats: { AD: 0, AP: 15, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 29, name: "Cota de Malha", rarity: "Comum", cost: 150, stats: { AD: 0, AP: 0, RM: 0, RF: 15, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 30, name: "Capuz Mágico", rarity: "Comum", cost: 150, stats: { AD: 0, AP: 0, RM: 15, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 31, name: "Anel de Cobre", rarity: "Comum", cost: 150, stats: { AD: 0, AP: 5, RM: 5, RF: 0, VM: 0, MM: 50, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 32, name: "Anel de Prata", rarity: "Comum", cost: 150, stats: { AD: 5, AP: 0, RM: 0, RF: 5, VM: 50, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 33, name: "Dente de Morcego", rarity: "Comum", cost: 200, stats: { AD: 5, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 5, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 34, name: "Gota de Orvalho", rarity: "Comum", cost: 200, stats: { AD: 0, AP: 5, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 5 }, recipe: [], active: "Nenhuma" },
    { id: 35, name: "Cinto Largo", rarity: "Comum", cost: 200, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 150, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 36, name: "Livro Velho", rarity: "Comum", cost: 200, stats: { AD: 0, AP: 5, RM: 0, RF: 0, VM: 0, MM: 150, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 37, name: "Luvas de Pano", rarity: "Comum", cost: 250, stats: { AD: 8, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 2, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 38, name: "Óculos de Leitura", rarity: "Comum", cost: 250, stats: { AD: 0, AP: 8, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 2 }, recipe: [], active: "Nenhuma" },
    { id: 39, name: "Botas Leves", rarity: "Comum", cost: 250, stats: { AD: 0, AP: 0, RM: 5, RF: 5, VM: 50, MM: 0, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 40, name: "Talisma Menor", rarity: "Comum", cost: 250, stats: { AD: 2, AP: 2, RM: 2, RF: 2, VM: 20, MM: 20, VA: 0, VP: 0 }, recipe: [], active: "Nenhuma" },
    { id: 41, name: "Machado de Aço", rarity: "Raro", cost: 500, stats: { AD: 30, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [21, 27], active: "Nenhuma" },
    { id: 42, name: "Varinha Mágica", rarity: "Raro", cost: 500, stats: { AD: 0, AP: 30, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [22, 28], active: "Nenhuma" },
    { id: 43, name: "Escudo de Prata", rarity: "Raro", cost: 500, stats: { AD: 0, AP: 0, RM: 0, RF: 30, VM: 100, MM: 0, VA: 0, VP: 0 }, recipe: [23, 29], active: "Nenhuma" },
    { id: 44, name: "Manto Espectral", rarity: "Raro", cost: 500, stats: { AD: 0, AP: 0, RM: 30, RF: 0, VM: 100, MM: 0, VA: 0, VP: 0 }, recipe: [24, 30], active: "Nenhuma" },
    { id: 45, name: "Lágrima da Deusa", rarity: "Raro", cost: 600, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 250, VA: 0, VP: 5 }, recipe: [25, 36], active: "Nenhuma" },
    { id: 46, name: "Gema de Sangue", rarity: "Raro", cost: 600, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 250, MM: 0, VA: 5, VP: 0 }, recipe: [26, 35], active: "Nenhuma" },
    { id: 47, name: "Arco Recurvo", rarity: "Raro", cost: 700, stats: { AD: 40, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [21, 21], active: "Nenhuma" },
    { id: 48, name: "Tomo Amplificador", rarity: "Raro", cost: 700, stats: { AD: 0, AP: 40, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [22, 22], active: "Nenhuma" },
    { id: 49, name: "Placa Carapaça", rarity: "Raro", cost: 700, stats: { AD: 0, AP: 0, RM: 0, RF: 40, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [29, 29], active: "Nenhuma" },
    { id: 50, name: "Capa Negatron", rarity: "Raro", cost: 700, stats: { AD: 0, AP: 0, RM: 40, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [30, 30], active: "Nenhuma" },
    { id: 51, name: "Anel de Ouro", rarity: "Raro", cost: 800, stats: { AD: 0, AP: 20, RM: 10, RF: 0, VM: 0, MM: 150, VA: 0, VP: 0 }, recipe: [31, 31], active: "Nenhuma" },
    { id: 52, name: "Anel de Platina", rarity: "Raro", cost: 800, stats: { AD: 20, AP: 0, RM: 0, RF: 10, VM: 150, MM: 0, VA: 0, VP: 0 }, recipe: [32, 32], active: "Nenhuma" },
    { id: 53, name: "Cetro Vampírico", rarity: "Raro", cost: 900, stats: { AD: 15, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 10, VP: 0 }, recipe: [27, 33], active: "Nenhuma" },
    { id: 54, name: "Cálice da Harmonia", rarity: "Raro", cost: 900, stats: { AD: 0, AP: 15, RM: 10, RF: 0, VM: 0, MM: 0, VA: 0, VP: 10 }, recipe: [28, 34], active: "Nenhuma" },
    { id: 55, name: "Cinto do Gigante", rarity: "Raro", cost: 1000, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 350, MM: 0, VA: 0, VP: 0 }, recipe: [35, 35], active: "Nenhuma" },
    { id: 56, name: "Capítulo Perdido", rarity: "Raro", cost: 1000, stats: { AD: 0, AP: 20, RM: 0, RF: 0, VM: 0, MM: 300, VA: 0, VP: 0 }, recipe: [36, 25], active: "Nenhuma" },
    { id: 57, name: "Luvas de Briga", rarity: "Raro", cost: 1100, stats: { AD: 25, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 5, VP: 0 }, recipe: [37, 21], active: "Nenhuma" },
    { id: 58, name: "Cristal Vidente", rarity: "Raro", cost: 1100, stats: { AD: 0, AP: 25, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 5 }, recipe: [38, 22], active: "Nenhuma" },
    { id: 59, name: "Botas Pesadas", rarity: "Raro", cost: 1200, stats: { AD: 0, AP: 0, RM: 15, RF: 15, VM: 150, MM: 0, VA: 0, VP: 0 }, recipe: [39, 23], active: "Nenhuma" },
    { id: 60, name: "Ídolo Proibido", rarity: "Raro", cost: 1200, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 100, MM: 100, VA: 5, VP: 5 }, recipe: [40, 40], active: "Nenhuma" },
    { id: 61, name: "Espada Demoníaca", rarity: "Épico", cost: 2000, stats: { AD: 60, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 15, VP: 0 }, recipe: [41, 53], active: "Causa dano adicional ao alvo." },
    { id: 62, name: "Cajado do Vazio", rarity: "Épico", cost: 2000, stats: { AD: 0, AP: 60, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 15 }, recipe: [42, 54], active: "Ignora parte da resistência mágica." },
    { id: 63, name: "Égide da Legião", rarity: "Épico", cost: 2000, stats: { AD: 0, AP: 0, RM: 45, RF: 45, VM: 200, MM: 0, VA: 0, VP: 0 }, recipe: [43, 44], active: "Aumenta defesas da equipe." },
    { id: 64, name: "Rostos Espirituais", rarity: "Épico", cost: 2200, stats: { AD: 0, AP: 0, RM: 50, RF: 0, VM: 400, MM: 0, VA: 0, VP: 0 }, recipe: [44, 55], active: "Aumenta toda cura recebida." },
    { id: 65, name: "Coração Congelado", rarity: "Épico", cost: 2200, stats: { AD: 0, AP: 0, RM: 0, RF: 70, VM: 0, MM: 300, VA: 0, VP: 0 }, recipe: [49, 45], active: "Reduz o ataque dos inimigos." },
    { id: 66, name: "Bastão das Eras", rarity: "Épico", cost: 2500, stats: { AD: 0, AP: 50, RM: 0, RF: 0, VM: 300, MM: 300, VA: 0, VP: 0 }, recipe: [42, 45, 46], active: "Ganha atributos a cada turno." },
    { id: 67, name: "Lâmina Sanguinária", rarity: "Épico", cost: 2500, stats: { AD: 70, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 20, VP: 0 }, recipe: [47, 53], active: "Cria um escudo se curar acima do máximo." },
    { id: 68, name: "Capuz da Morte", rarity: "Épico", cost: 2800, stats: { AD: 0, AP: 90, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [48, 42], active: "Aumenta drasticamente o AP total." },
    { id: 69, name: "Armadura de Espinhos", rarity: "Épico", cost: 2500, stats: { AD: 0, AP: 0, RM: 0, RF: 80, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [49, 55], active: "Reflete dano físico." },
    { id: 70, name: "Força da Natureza", rarity: "Épico", cost: 2500, stats: { AD: 0, AP: 0, RM: 80, RF: 0, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [50, 55], active: "Ganha velocidade e resistência ao tomar dano." },
    { id: 71, name: "Coroa de Ouro", rarity: "Épico", cost: 2300, stats: { AD: 0, AP: 50, RM: 30, RF: 0, VM: 0, MM: 250, VA: 0, VP: 0 }, recipe: [51, 48], active: "Protege contra o próximo feitiço." },
    { id: 72, name: "Manopla de Platina", rarity: "Épico", cost: 2300, stats: { AD: 50, AP: 0, RM: 0, RF: 30, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [52, 47], active: "Próximo ataque causa lentidão em área." },
    { id: 73, name: "Dançarina Fantasma", rarity: "Épico", cost: 2400, stats: { AD: 40, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 5, VP: 0 }, recipe: [57, 47], active: "Permite ignorar bloqueios." },
    { id: 74, name: "Zhonya", rarity: "Épico", cost: 2700, stats: { AD: 0, AP: 65, RM: 0, RF: 45, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [58, 49], active: "Fica invulnerável por 1 turno." },
    { id: 75, name: "Armadura de Warmog", rarity: "Épico", cost: 2800, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 800, MM: 0, VA: 0, VP: 0 }, recipe: [55, 55], active: "Regenera vida fora de combate." },
    { id: 76, name: "Eco de Luden", rarity: "Épico", cost: 2900, stats: { AD: 0, AP: 80, RM: 0, RF: 0, VM: 0, MM: 400, VA: 0, VP: 0 }, recipe: [56, 48], active: "Feitiços causam dano em área." },
    { id: 77, name: "Sinal de Sterak", rarity: "Épico", cost: 2900, stats: { AD: 45, AP: 0, RM: 0, RF: 0, VM: 450, MM: 0, VA: 0, VP: 0 }, recipe: [57, 55], active: "Gera escudo massivo ao receber muito dano." },
    { id: 78, name: "Morellonomicon", rarity: "Épico", cost: 2800, stats: { AD: 0, AP: 70, RM: 0, RF: 0, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [58, 46], active: "Causa feridas dolorosas." },
    { id: 79, name: "Botas de Mercúrio", rarity: "Épico", cost: 1800, stats: { AD: 0, AP: 0, RM: 30, RF: 20, VM: 200, MM: 0, VA: 0, VP: 0 }, recipe: [59, 50], active: "Reduz controle de grupo." },
    { id: 80, name: "Redenção", rarity: "Épico", cost: 2100, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 200, MM: 200, VA: 10, VP: 10 }, recipe: [60, 46], active: "Cura aliados em uma grande área." },
    { id: 81, name: "Gume do Infinito", rarity: "Lendário", cost: 4000, stats: { AD: 150, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 30, VP: 0 }, recipe: [61, 67], active: "Ataques ignoram qualquer defesa." },
    { id: 82, name: "Despertar de Rabadon", rarity: "Lendário", cost: 4000, stats: { AD: 0, AP: 150, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 30 }, recipe: [68, 62], active: "Multiplica o AP base por 2." },
    { id: 83, name: "Placa Gargolítica Absoluta", rarity: "Lendário", cost: 4000, stats: { AD: 0, AP: 0, RM: 100, RF: 100, VM: 500, MM: 0, VA: 0, VP: 0 }, recipe: [63, 69], active: "Absorve 1000 de dano." },
    { id: 84, name: "Alma Gêmea", rarity: "Lendário", cost: 4500, stats: { AD: 0, AP: 0, RM: 120, RF: 0, VM: 1000, MM: 0, VA: 0, VP: 0 }, recipe: [64, 70], active: "Revive na morte com 50% HP." },
    { id: 85, name: "Prisão Eterna", rarity: "Lendário", cost: 4500, stats: { AD: 0, AP: 0, RM: 0, RF: 120, VM: 500, MM: 800, VA: 0, VP: 0 }, recipe: [65, 69], active: "Congela o inimigo por 2 turnos." },
    { id: 86, name: "Cetro de Cristal de Rylai", rarity: "Lendário", cost: 4200, stats: { AD: 0, AP: 120, RM: 0, RF: 0, VM: 600, MM: 0, VA: 0, VP: 0 }, recipe: [66, 78], active: "Feitiços param o tempo." },
    { id: 87, name: "Sedenta por Sangue", rarity: "Lendário", cost: 4200, stats: { AD: 130, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 50, VP: 0 }, recipe: [67, 61], active: "Cura além da vida máxima, gerando escudo infinito." },
    { id: 88, name: "Abraço de Seraph", rarity: "Lendário", cost: 4200, stats: { AD: 0, AP: 130, RM: 0, RF: 0, VM: 0, MM: 1000, VA: 0, VP: 20 }, recipe: [76, 62], active: "Gera um escudo baseado na mana atual." },
    { id: 89, name: "Anjo Guardião", rarity: "Lendário", cost: 4500, stats: { AD: 80, AP: 0, RM: 0, RF: 80, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [72, 75], active: "Renasce com 100% de vida e mana após 5 turnos." },
    { id: 90, name: "Máscara Abissal", rarity: "Lendário", cost: 4200, stats: { AD: 0, AP: 0, RM: 120, RF: 0, VM: 800, MM: 500, VA: 0, VP: 0 }, recipe: [70, 71], active: "Causa dano igual à vida recebida." },
    { id: 91, name: "Cajado do Arcanjo Oculto", rarity: "Lendário", cost: 4800, stats: { AD: 0, AP: 160, RM: 20, RF: 20, VM: 200, MM: 1200, VA: 0, VP: 10 }, recipe: [68, 76], active: "Reseta cooldowns instantaneamente." },
    { id: 92, name: "Ruptor Divino", rarity: "Lendário", cost: 4800, stats: { AD: 100, AP: 50, RM: 0, RF: 0, VM: 600, MM: 0, VA: 20, VP: 0 }, recipe: [77, 72], active: "Arranca 20% da vida máxima do alvo por acerto." },
    { id: 93, name: "Tormenta de Luden", rarity: "Lendário", cost: 4600, stats: { AD: 0, AP: 140, RM: 0, RF: 0, VM: 0, MM: 800, VA: 0, VP: 0 }, recipe: [76, 68], active: "Atinge todos os inimigos." },
    { id: 94, name: "Colosso Sombrio", rarity: "Lendário", cost: 5000, stats: { AD: 0, AP: 0, RM: 150, RF: 150, VM: 1500, MM: 0, VA: 0, VP: 0 }, recipe: [75, 83], active: "Imune a status." },
    { id: 95, name: "Lâmina do Rei Destruído", rarity: "Lendário", cost: 4800, stats: { AD: 110, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 30, VP: 0 }, recipe: [67, 73], active: "Rouba vida equivalente ao ouro do inimigo." },
    { id: 96, name: "Pistola Lâmina Hextech", rarity: "Lendário", cost: 5000, stats: { AD: 100, AP: 100, RM: 0, RF: 0, VM: 0, MM: 0, VA: 25, VP: 25 }, recipe: [61, 62], active: "Causa lentidão e rouba atributos do alvo." },
    { id: 97, name: "Espada do Oculto", rarity: "Lendário", cost: 5500, stats: { AD: 200, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [81, 61], active: "Dano aumenta exponencialmente." },
    { id: 98, name: "Mejai", rarity: "Lendário", cost: 5500, stats: { AD: 0, AP: 200, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [82, 62], active: "Poder de habilidade triplicado se vida estiver cheia." },
    { id: 99, name: "Leviatã", rarity: "Lendário", cost: 5500, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 3000, MM: 0, VA: 0, VP: 0 }, recipe: [75, 75], active: "Reduz todo o dano recebido em 50%." },
    { id: 100, name: "Trindade", rarity: "Lendário", cost: 6000, stats: { AD: 100, AP: 100, RM: 100, RF: 100, VM: 1000, MM: 1000, VA: 20, VP: 20 }, recipe: [92, 96, 94], active: "Domínio total da mesa." }
];

document.getElementById('to-register').addEventListener('click', () => {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('register-form').style.display = 'block';
});

document.getElementById('to-login').addEventListener('click', () => {
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'block';
});

document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-pass').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {}
});

document.getElementById('btn-register').addEventListener('click', async () => {
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-pass').value;
    const name = document.getElementById('reg-name').value;
    try {
        const userCred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", userCred.user.uid), { name, friends: [] });
    } catch (e) {}
});

document.getElementById('btn-logout').addEventListener('click', () => {
    signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('client-screen').classList.add('active');
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            document.getElementById('display-username').innerText = userDoc.data().name;
        }
        document.getElementById('bgm').play().catch(()=>{});
        initChat();
    } else {
        currentUser = null;
        document.getElementById('client-screen').classList.remove('active');
        document.getElementById('rune-screen').classList.remove('active');
        document.getElementById('game-screen').classList.remove('active');
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('bgm').pause();
    }
});

document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).classList.add('active');
    });
});

document.querySelectorAll('.game-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
        document.querySelectorAll('.game-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.game-pane').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        document.getElementById(e.target.dataset.target).classList.add('active');
    });
});

document.getElementById('btn-host-match').addEventListener('click', () => {
    document.querySelector('.play-options').style.display = 'none';
    document.getElementById('room-lobby').style.display = 'block';
});

document.getElementById('btn-solo-bot').addEventListener('click', () => {
    startRuneSelection();
});

document.getElementById('btn-start-match').addEventListener('click', () => {
    startRuneSelection();
});

document.getElementById('btn-send-chat').addEventListener('click', async () => {
    const msg = document.getElementById('chat-input').value;
    if (msg.trim() !== "") {
        await addDoc(collection(db, "global_chat"), {
            text: msg,
            sender: document.getElementById('display-username').innerText,
            timestamp: serverTimestamp()
        });
        document.getElementById('chat-input').value = "";
    }
});

function initChat() {
    const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"));
    onSnapshot(q, (snapshot) => {
        const chatBox = document.getElementById('chat-messages');
        chatBox.innerHTML = "";
        const msgs = [];
        snapshot.forEach(doc => msgs.push(doc.data()));
        msgs.reverse().forEach(data => {
            const div = document.createElement('div');
            div.innerText = `${data.sender}: ${data.text}`;
            chatBox.appendChild(div);
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
}

document.getElementById('btn-add-friend').addEventListener('click', async () => {
    const name = document.getElementById('friend-name-input').value;
    if (name) {
        const li = document.createElement('li');
        li.innerText = name;
        document.getElementById('friends-ul').appendChild(li);
        document.getElementById('friend-name-input').value = "";
    }
});

document.getElementById('btn-calc-build').addEventListener('click', () => {
    const tAP = parseInt(document.getElementById('target-AP').value) || 0;
    const tAD = parseInt(document.getElementById('target-AD').value) || 0;
    const tRM = parseInt(document.getElementById('target-RM').value) || 0;
    const tRF = parseInt(document.getElementById('target-RF').value) || 0;
    const tVM = parseInt(document.getElementById('target-VM').value) || 0;
    const tMM = parseInt(document.getElementById('target-MM').value) || 0;
    
    let resultHTML = "";
    const validItems = items.filter(i => i.rarity === "Épico" || i.rarity === "Lendário");
    
    let best = null;
    let bestScore = -1;
    
    for (let i = 0; i < validItems.length; i++) {
        let score = 0;
        if (tAP > 0 && validItems[i].stats.AP > 0) score += validItems[i].stats.AP;
        if (tAD > 0 && validItems[i].stats.AD > 0) score += validItems[i].stats.AD;
        if (tRM > 0 && validItems[i].stats.RM > 0) score += validItems[i].stats.RM;
        if (tRF > 0 && validItems[i].stats.RF > 0) score += validItems[i].stats.RF;
        if (tVM > 0 && validItems[i].stats.VM > 0) score += validItems[i].stats.VM;
        if (tMM > 0 && validItems[i].stats.MM > 0) score += validItems[i].stats.MM;
        
        if (score > bestScore) {
            bestScore = score;
            best = validItems[i];
        }
    }
    
    if (bestScore > 0) {
        resultHTML = `<li>${best.name} (${best.rarity}) - Foco principal.</li>`;
        if (best.recipe.length > 0) {
            resultHTML += `<li>Componentes: ${best.recipe.map(r => items.find(it => it.id === r).name).join(', ')}</li>`;
        }
    } else {
        resultHTML = "<li>Nenhum item focado nesses atributos encontrado.</li>";
    }
    
    document.getElementById('build-path-result').innerHTML = resultHTML;
});

function startRuneSelection() {
    document.getElementById('client-screen').classList.remove('active');
    document.getElementById('rune-screen').classList.add('active');
}

document.querySelectorAll('.rune-card').forEach(card => {
    card.addEventListener('click', (e) => {
        document.querySelectorAll('.rune-card').forEach(c => c.classList.remove('selected'));
        const target = e.currentTarget;
        target.classList.add('selected');
        currentRune = target.dataset.rune;
        if (currentRune === "pintor") isPintorMestre = true;
        setTimeout(startGame, 1000);
    });
});

function startGame() {
    document.getElementById('rune-screen').classList.remove('active');
    document.getElementById('game-screen').classList.add('active');
    gameActive = true;
    updateHUD();
    renderJungle();
    renderShop("Lixo");
    
    if (currentRune === "anjo") {
        playerStats.mana += playerStats.maxMana * 0.1;
    }
    
    if (!vpInterval) {
        vpInterval = setInterval(() => {
            if (playerStats.vp > 0) {
                const recover = (playerStats.maxHp * 0.05);
                playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + recover);
                updateHUD();
            }
        }, 60000);
    }
}

function updateHUD() {
    document.getElementById('player-hp').innerText = `HP: ${Math.floor(playerStats.hp)}/${playerStats.maxHp}`;
    document.getElementById('player-mana').innerText = `Mana: ${Math.floor(playerStats.mana)}/${playerStats.maxMana}`;
    document.getElementById('player-gold').innerText = `Gold: ${playerStats.gold}`;
    document.getElementById('player-ap').innerText = `AP: ${playerStats.ap}`;
    document.getElementById('player-ad').innerText = `AD: ${playerStats.ad}`;
    document.getElementById('enemy-hp').innerText = `HP: ${Math.floor(enemyStats.hp)}/${enemyStats.maxHp}`;
}

function renderJungle() {
    if (jungleIndex >= jungleMonsters.length) return;
    const m = jungleMonsters[jungleIndex];
    document.getElementById('jungle-monster-name').innerText = m.name;
    document.getElementById('jungle-hp-text').innerText = `${m.hp}/${m.hp}`;
    document.getElementById('jungle-hp-fill').style.width = '100%';
}

document.getElementById('btn-attack-jungle').addEventListener('click', () => {
    if (jungleIndex >= jungleMonsters.length) return;
    let m = jungleMonsters[jungleIndex];
    let damage = playerStats.ad > 0 ? playerStats.ad : 10;
    m.hp -= damage;
    if (playerStats.va > 0) {
        playerStats.hp = Math.min(playerStats.maxHp, playerStats.hp + (damage * (playerStats.va / 100)));
    }
    if (m.hp <= 0) {
        let goldGain = m.gold;
        if (currentRune === "anjo") goldGain = Math.floor(goldGain * 1.05);
        playerStats.gold += goldGain;
        jungleIndex++;
        if (currentRune === "script" && jungleIndex === 4 && !autoFarmInterval) {
            autoFarmInterval = setInterval(() => {
                playerStats.gold += 100;
                updateHUD();
            }, 300000);
        }
        if (jungleIndex < jungleMonsters.length) {
            jungleMonsters[jungleIndex].maxHp = jungleMonsters[jungleIndex].hp;
        }
        renderJungle();
    } else {
        const pct = (m.hp / m.maxHp || m.hp / (m.hp+damage)) * 100;
        document.getElementById('jungle-hp-fill').style.width = `${pct}%`;
        document.getElementById('jungle-hp-text').innerText = `${Math.floor(m.hp)}`;
    }
    updateHUD();
});

document.querySelectorAll('.shop-cat').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.shop-cat').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        renderShop(e.target.dataset.cat);
    });
});

document.getElementById('shop-search').addEventListener('input', (e) => {
    const val = e.target.value.toLowerCase();
    const activeCat = document.querySelector('.shop-cat.active').dataset.cat;
    renderShop(activeCat, val);
});

function renderShop(category, search = "") {
    const container = document.getElementById('shop-items-container');
    container.innerHTML = "";
    items.forEach(item => {
        if (item.rarity === category && item.name.toLowerCase().includes(search)) {
            const div = document.createElement('div');
            div.className = 'shop-item';
            div.innerHTML = `
                <strong>${item.name}</strong><br>
                Custo: ${item.cost}<br>
                <button class="gold-btn small-btn" onclick="buyItem(${item.id})">COMPRAR</button>
            `;
            container.appendChild(div);
        }
    });
}

window.buyItem = function(id) {
    const item = items.find(i => i.id === id);
    if (playerStats.gold >= item.cost) {
        playerStats.gold -= item.cost;
        playerStats.ap += item.stats.AP;
        playerStats.ad += item.stats.AD;
        playerStats.rm += item.stats.RM;
        playerStats.rf += item.stats.RF;
        playerStats.maxHp += item.stats.VM;
        playerStats.hp += item.stats.VM;
        playerStats.maxMana += item.stats.MM;
        playerStats.mana += item.stats.MM;
        playerStats.va += item.stats.VA;
        playerStats.vp += item.stats.VP;
        updateHUD();
        const inv = document.getElementById('player-inventory');
        const d = document.createElement('div');
        d.style.border = '1px solid #c8aa6e';
        d.style.padding = '5px';
        d.style.fontSize = '10px';
        d.innerText = item.name;
        inv.appendChild(d);
    }
}

document.addEventListener('keydown', (e) => {
    if (!gameActive) return;
    const k = e.key.toUpperCase();
    if (k === 'Q' || k === 'W' || k === 'E') {
        comboBuffer.push(k);
        clearTimeout(comboTimer);
        
        let maxCombo = isPintorMestre ? 4 : 2;
        if (comboBuffer.length > maxCombo) comboBuffer.shift();
        
        document.getElementById('combo-display').innerText = comboBuffer.join(" + ");
        openGrimoire(k);
        
        comboTimer = setTimeout(() => {
            comboBuffer = [];
            document.getElementById('grimoire-overlay').style.display = 'none';
        }, 3000);
    }
});

const canvas = document.getElementById('grimoire-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let pts = [];

function openGrimoire(key) {
    document.getElementById('grimoire-overlay').style.display = 'flex';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pts = [];
    let title = "";
    if (key === 'Q') { title = "Grimório do Desastre"; ctx.strokeStyle = "#ff4444"; }
    if (key === 'W') { title = "Grimório da Serenidade"; ctx.strokeStyle = "#44ccff"; }
    if (key === 'E') { title = "Grimório do Tormento"; ctx.strokeStyle = "#aa44ff"; }
    ctx.lineWidth = 5;
    document.getElementById('grimoire-title').innerText = title;
}

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    pts.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
});
canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    pts.push({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    drawPath();
});
canvas.addEventListener('mouseup', () => {
    drawing = false;
    analyzeGesture();
});

function drawPath() {
    if (pts.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
        ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
}

function analyzeGesture() {
    if (pts.length < 10) return;
    let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
    pts.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });
    const dx = maxX - minX;
    const dy = maxY - minY;
    
    const start = pts[0];
    const end = pts[pts.length - 1];
    const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
    
    let shape = "";
    if (dist < 40 && dx > 20 && dy > 20) {
        shape = "0";
    } else if (dx < 30 && dy > 50) {
        shape = "|";
    } else {
        shape = ">";
    }
    
    executeSpell(shape);
}

function executeSpell(shape) {
    document.getElementById('grimoire-overlay').style.display = 'none';
    const combo = comboBuffer.join("");
    comboBuffer = [];
    
    if (playerStats.mana < 50) return;
    playerStats.mana -= 50;
    
    let damage = (playerStats.ap > 0 ? playerStats.ap : 50);
    
    if (combo.includes("Q")) {
        if (shape === ">") enemyStats.hp -= damage;
        if (shape === "|") {
            document.getElementById('player-cards').innerHTML = "";
            document.getElementById('enemy-cards').innerHTML = "";
        }
        if (shape === "0") enemyStats.hp -= (damage * 1.5);
    }
    if (combo.includes("W")) {
        if (shape === ">") playerStats.hp += damage;
        if (shape === "|") {
            document.getElementById('player-cards').innerHTML = "";
            document.getElementById('enemy-cards').innerHTML = "";
            document.getElementById('player-hand').innerHTML = "";
        }
    }
    if (combo.includes("E")) {
        if (shape === ">") {
            document.body.classList.add('desespero-active');
            desesperoTurns = 5;
        }
    }
    
    updateHUD();
}

document.addEventListener('mousemove', (e) => {
    if (document.body.classList.contains('desespero-active')) {
        const fl = document.getElementById('flashlight');
        fl.style.left = e.clientX + 'px';
        fl.style.top = e.clientY + 'px';
    }
});
