import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, addDoc, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
    { id: 1, name: "Espada Longa", cost: 350, stats: { AD: 10, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 2, name: "Tomo Amplificador", cost: 435, stats: { AD: 0, AP: 20, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 3, name: "Cristal de Rubi", cost: 400, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 150, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 4, name: "Cristal de Safira", cost: 350, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 250, VA: 0, VP: 0 }, recipe: [] },
    { id: 5, name: "Couraça de Pano", cost: 300, stats: { AD: 0, AP: 0, RM: 0, RF: 15, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 6, name: "Manto Anula-Magia", cost: 450, stats: { AD: 0, AP: 0, RM: 25, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 7, name: "Adaga", cost: 300, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 12, VP: 0 }, recipe: [] },
    { id: 8, name: "Botas Iniciais", cost: 300, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 25 }, recipe: [] },
    { id: 9, name: "Colar de Pérolas", cost: 250, stats: { AD: 0, AP: 5, RM: 0, RF: 0, VM: 0, MM: 50, VA: 0, VP: 0 }, recipe: [] },
    { id: 10, name: "Anel de Doran", cost: 400, stats: { AD: 0, AP: 15, RM: 0, RF: 0, VM: 70, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 11, name: "Lâmina de Doran", cost: 450, stats: { AD: 8, AP: 0, RM: 0, RF: 0, VM: 80, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 12, name: "Escudo de Doran", cost: 450, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 110, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 13, name: "Lacre Sombrio", cost: 350, stats: { AD: 0, AP: 15, RM: 0, RF: 0, VM: 40, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 14, name: "Cinto do Gigante", cost: 900, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 350, MM: 0, VA: 0, VP: 0 }, recipe: [3] },
    { id: 15, name: "Picareta", cost: 875, stats: { AD: 25, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 16, name: "Espada B.F.", cost: 1300, stats: { AD: 40, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 17, name: "Bastão Desnecessariamente Grande", cost: 1250, stats: { AD: 0, AP: 60, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 18, name: "Capa de Agilidade", cost: 600, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 19, name: "Arco Recurvo", cost: 700, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 15, VP: 0 }, recipe: [7] },
    { id: 20, name: "Ídolo Proibido", cost: 800, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 50, VA: 0, VP: 0 }, recipe: [] },
    { id: 21, name: "Varinha Explosiva", cost: 850, stats: { AD: 0, AP: 40, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [2] },
    { id: 22, name: "Codex Diabólico", cost: 900, stats: { AD: 0, AP: 35, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [2] },
    { id: 23, name: "Proteção Glacial", cost: 900, stats: { AD: 0, AP: 0, RM: 0, RF: 40, VM: 0, MM: 250, VA: 0, VP: 0 }, recipe: [4, 5] },
    { id: 24, name: "Gema Ardente", cost: 800, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 200, MM: 0, VA: 0, VP: 0 }, recipe: [3] },
    { id: 25, name: "Martelo de Guerra", cost: 1100, stats: { AD: 25, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [1, 1] },
    { id: 26, name: "Fago", cost: 1100, stats: { AD: 15, AP: 0, RM: 0, RF: 0, VM: 200, MM: 0, VA: 0, VP: 0 }, recipe: [1, 3] },
    { id: 27, name: "Fulgor", cost: 700, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 28, name: "Tiamat", cost: 1200, stats: { AD: 25, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [1, 1] },
    { id: 29, name: "Colete Espinhoso", cost: 800, stats: { AD: 0, AP: 0, RM: 0, RF: 30, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [5, 5] },
    { id: 30, name: "Capuz do Espectro", cost: 1250, stats: { AD: 0, AP: 0, RM: 25, RF: 0, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [3, 6] },
    { id: 31, name: "Carapaça do Vigia", cost: 1000, stats: { AD: 0, AP: 0, RM: 0, RF: 40, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [5, 5] },
    { id: 32, name: "Cota de Malha", cost: 800, stats: { AD: 0, AP: 0, RM: 0, RF: 40, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [5] },
    { id: 33, name: "Capa Negatron", cost: 900, stats: { AD: 0, AP: 0, RM: 50, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [6] },
    { id: 34, name: "Zelo", cost: 1050, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 18, VP: 5 }, recipe: [7, 18] },
    { id: 35, name: "Estilhaço de Kircheis", cost: 700, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 15, VP: 0 }, recipe: [7] },
    { id: 36, name: "Aljava de Aço", cost: 1300, stats: { AD: 30, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 15, VP: 0 }, recipe: [1, 7] },
    { id: 37, name: "Bandana de Mercúrio", cost: 1300, stats: { AD: 0, AP: 0, RM: 30, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [6] },
    { id: 38, name: "Chamado do Carrasco", cost: 800, stats: { AD: 15, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [1] },
    { id: 39, name: "Orbe do Esquecimento", cost: 800, stats: { AD: 0, AP: 30, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [2] },
    { id: 40, name: "Alternador Hextec", cost: 1050, stats: { AD: 0, AP: 40, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [2, 2] },
    { id: 41, name: "Cinturão de Mercúrio", cost: 1300, stats: { AD: 0, AP: 0, RM: 30, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [] },
    { id: 42, name: "Ampulheta Quebrada", cost: 1000, stats: { AD: 0, AP: 20, RM: 0, RF: 15, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [2, 5] },
    { id: 43, name: "Capítulo Perdido", cost: 1300, stats: { AD: 0, AP: 40, RM: 0, RF: 0, VM: 0, MM: 300, VA: 0, VP: 0 }, recipe: [2, 4] },
    { id: 44, name: "Lágrima da Deusa", cost: 400, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 240, VA: 0, VP: 0 }, recipe: [] },
    { id: 45, name: "Máscara Abissal", cost: 2400, stats: { AD: 0, AP: 0, RM: 60, RF: 0, VM: 300, MM: 0, VA: 0, VP: 0 }, recipe: [33, 24] },
    { id: 46, name: "Egide da Legião", cost: 1200, stats: { AD: 0, AP: 0, RM: 30, RF: 30, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [6, 5] },
    { id: 47, name: "Pingente Cristalino", cost: 1000, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 200, MM: 0, VA: 0, VP: 0 }, recipe: [3] },
    { id: 48, name: "Placa Lunar", cost: 800, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 150, MM: 0, VA: 0, VP: 5 }, recipe: [3] },
    { id: 49, name: "Brasa de Bami", cost: 1000, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 300, MM: 0, VA: 0, VP: 0 }, recipe: [3, 3] },
    { id: 50, name: "Lâmina da Fúria", cost: 2600, stats: { AD: 30, AP: 30, RM: 0, RF: 0, VM: 0, MM: 0, VA: 25, VP: 0 }, recipe: [15, 21, 7] },
    { id: 51, name: "Gume do Infinito", cost: 3400, stats: { AD: 65, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [16, 15, 18] },
    { id: 52, name: "Sedenta por Sangue", cost: 3400, stats: { AD: 55, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [16, 18] },
    { id: 53, name: "Força da Trindade", cost: 3333, stats: { AD: 45, AP: 0, RM: 0, RF: 0, VM: 300, MM: 0, VA: 33, VP: 20 }, recipe: [26, 27, 19] },
    { id: 54, name: "Coração Congelado", cost: 2300, stats: { AD: 0, AP: 0, RM: 0, RF: 70, VM: 0, MM: 400, VA: 0, VP: 0 }, recipe: [31, 23] },
    { id: 55, name: "Armadura de Warmog", cost: 3100, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 1000, MM: 0, VA: 0, VP: 0 }, recipe: [14, 24, 3] },
    { id: 56, name: "Rabadon", cost: 3600, stats: { AD: 0, AP: 120, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [17, 17] },
    { id: 57, name: "Ampulheta de Zhonya", cost: 3200, stats: { AD: 0, AP: 120, RM: 0, RF: 50, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [17, 42] },
    { id: 58, name: "Cajado do Vazio", cost: 3000, stats: { AD: 0, AP: 80, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [21, 21] },
    { id: 59, name: "Lâmina Fantasma de Youmuu", cost: 2700, stats: { AD: 60, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 18 }, recipe: [25, 1] },
    { id: 60, name: "Crepúsculo de Draktharr", cost: 2900, stats: { AD: 60, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [25, 1] },
    { id: 61, name: "Eclipse", cost: 2800, stats: { AD: 70, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [25, 15] },
    { id: 62, name: "Mata-Cráquens", cost: 3100, stats: { AD: 40, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 20, VP: 0 }, recipe: [36, 18] },
    { id: 63, name: "Força do Vendaval", cost: 3100, stats: { AD: 50, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 20, VP: 7 }, recipe: [36, 34] },
    { id: 64, name: "Arco-Escudo Imortal", cost: 3000, stats: { AD: 50, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 20, VP: 0 }, recipe: [36, 11] },
    { id: 65, name: "Tormenta de Luden", cost: 3000, stats: { AD: 0, AP: 90, RM: 0, RF: 0, VM: 0, MM: 600, VA: 0, VP: 0 }, recipe: [43, 21] },
    { id: 66, name: "Angústia de Liandry", cost: 3000, stats: { AD: 0, AP: 90, RM: 0, RF: 0, VM: 0, MM: 600, VA: 0, VP: 0 }, recipe: [43, 22] },
    { id: 67, name: "Geada Perpétua", cost: 2800, stats: { AD: 0, AP: 70, RM: 0, RF: 0, VM: 250, MM: 600, VA: 0, VP: 0 }, recipe: [43, 24] },
    { id: 68, name: "Explocinturão Hextec", cost: 3200, stats: { AD: 0, AP: 90, RM: 0, RF: 0, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [40, 21] },
    { id: 69, name: "Colhedor Noturno", cost: 3200, stats: { AD: 0, AP: 90, RM: 0, RF: 0, VM: 300, MM: 0, VA: 0, VP: 0 }, recipe: [40, 21] },
    { id: 70, name: "Criafendas", cost: 3200, stats: { AD: 0, AP: 80, RM: 0, RF: 0, VM: 300, MM: 0, VA: 0, VP: 0 }, recipe: [40, 22] },
    { id: 71, name: "Ruptor Divino", cost: 3300, stats: { AD: 40, AP: 0, RM: 0, RF: 0, VM: 300, MM: 0, VA: 0, VP: 0 }, recipe: [26, 27] },
    { id: 72, name: "Hemodrenário", cost: 3300, stats: { AD: 50, AP: 0, RM: 0, RF: 0, VM: 400, MM: 0, VA: 0, VP: 0 }, recipe: [28, 26] },
    { id: 73, name: "Quebrapassos", cost: 3300, stats: { AD: 50, AP: 0, RM: 0, RF: 0, VM: 300, MM: 0, VA: 20, VP: 0 }, recipe: [28, 26] },
    { id: 74, name: "Manopla dos Glacinatas", cost: 3000, stats: { AD: 0, AP: 0, RM: 0, RF: 50, VM: 400, MM: 0, VA: 0, VP: 0 }, recipe: [49, 23] },
    { id: 75, name: "Quimiotanque Turbo", cost: 2800, stats: { AD: 0, AP: 0, RM: 50, RF: 50, VM: 350, MM: 0, VA: 0, VP: 0 }, recipe: [49, 46] },
    { id: 76, name: "Égide de Fogo Solar", cost: 2700, stats: { AD: 0, AP: 0, RM: 0, RF: 50, VM: 500, MM: 0, VA: 0, VP: 0 }, recipe: [49, 32] },
    { id: 77, name: "Placa Gargolítica", cost: 3200, stats: { AD: 0, AP: 0, RM: 60, RF: 60, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [46, 32, 33] },
    { id: 78, name: "Armadura de Espinhos", cost: 2700, stats: { AD: 0, AP: 0, RM: 0, RF: 70, VM: 350, MM: 0, VA: 0, VP: 0 }, recipe: [29, 14] },
    { id: 79, name: "Força da Natureza", cost: 2900, stats: { AD: 0, AP: 0, RM: 70, RF: 0, VM: 400, MM: 0, VA: 0, VP: 5 }, recipe: [33, 24] },
    { id: 80, name: "Semblante Espiritual", cost: 2900, stats: { AD: 0, AP: 0, RM: 50, RF: 0, VM: 450, MM: 0, VA: 0, VP: 0 }, recipe: [30, 24] },
    { id: 81, name: "Lâmina do Rei Destruído", cost: 3300, stats: { AD: 40, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 25, VP: 0 }, recipe: [38, 19] },
    { id: 82, name: "Faca de Statikk", cost: 3000, stats: { AD: 50, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 30, VP: 0 }, recipe: [36, 35] },
    { id: 83, name: "Canhão Fumegante", cost: 3000, stats: { AD: 30, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 20, VP: 7 }, recipe: [34, 35] },
    { id: 84, name: "Dançarina Fantasma", cost: 2800, stats: { AD: 20, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 30, VP: 10 }, recipe: [34, 1, 1] },
    { id: 85, name: "Furacão de Runaan", cost: 2800, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 40, VP: 7 }, recipe: [34, 19] },
    { id: 86, name: "Lembrete Mortal", cost: 3000, stats: { AD: 40, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [38, 34] },
    { id: 87, name: "Lembranças do Lorde Dominik", cost: 3000, stats: { AD: 45, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [15, 18] },
    { id: 88, name: "Foco do Horizonte", cost: 2700, stats: { AD: 0, AP: 90, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [21, 40] },
    { id: 89, name: "Chama Sombria", cost: 3200, stats: { AD: 0, AP: 120, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [17, 40] },
    { id: 90, name: "Abraço de Seraph", cost: 3000, stats: { AD: 0, AP: 80, RM: 0, RF: 0, VM: 250, MM: 860, VA: 0, VP: 0 }, recipe: [44, 43] },
    { id: 91, name: "Aproximação Invernal", cost: 2600, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 400, MM: 860, VA: 0, VP: 0 }, recipe: [44, 24] },
    { id: 92, name: "Muramana", cost: 2900, stats: { AD: 35, AP: 0, RM: 0, RF: 0, VM: 0, MM: 860, VA: 0, VP: 0 }, recipe: [44, 25] },
    { id: 93, name: "Glaive Sombria", cost: 2300, stats: { AD: 50, AP: 0, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [25, 1] },
    { id: 94, name: "Cajado das Águas", cost: 2300, stats: { AD: 0, AP: 35, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 0 }, recipe: [20, 2] },
    { id: 95, name: "Turíbulo Ardente", cost: 2300, stats: { AD: 0, AP: 35, RM: 0, RF: 0, VM: 0, MM: 0, VA: 0, VP: 8 }, recipe: [20, 2] },
    { id: 96, name: "Redenção", cost: 2300, stats: { AD: 0, AP: 0, RM: 0, RF: 0, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [24, 20] },
    { id: 97, name: "Juramento do Cavaleiro", cost: 2200, stats: { AD: 0, AP: 0, RM: 0, RF: 40, VM: 250, MM: 0, VA: 0, VP: 0 }, recipe: [47, 31] },
    { id: 98, name: "Convergência de Zeke", cost: 2200, stats: { AD: 0, AP: 0, RM: 0, RF: 30, VM: 200, MM: 250, VA: 0, VP: 0 }, recipe: [23, 24] },
    { id: 99, name: "Medalhão dos Solari", cost: 2200, stats: { AD: 0, AP: 0, RM: 30, RF: 30, VM: 200, MM: 0, VA: 0, VP: 0 }, recipe: [46, 24] },
    { id: 100, name: "Coroa da Rainha", cost: 2800, stats: { AD: 0, AP: 70, RM: 0, RF: 0, VM: 250, MM: 600, VA: 0, VP: 0 }, recipe: [43, 24] }
];

let currentUser = null;
let bgm = document.getElementById('bgm');

document.getElementById('volume-control').addEventListener('input', (e) => {
    bgm.volume = e.target.value;
});

const tabLogin = document.getElementById('tab-login');
const tabRegister = document.getElementById('tab-register');
const formLogin = document.getElementById('login-form');
const formRegister = document.getElementById('register-form');
const authError = document.getElementById('auth-error');

tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    formLogin.classList.add('active');
    formRegister.classList.remove('active');
    authError.textContent = "";
});

tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    formRegister.classList.add('active');
    formLogin.classList.remove('active');
    authError.textContent = "";
});

formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (err) {
        authError.textContent = err.message;
    }
});

formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const user = document.getElementById('reg-username').value;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        authError.textContent = "E-mail inválido";
        return;
    }
    if(pass.length < 6) {
        authError.textContent = "Senha fraca (min 6)";
        return;
    }
    try {
        const cred = await createUserWithEmailAndPassword(auth, email, pass);
        await setDoc(doc(db, "users", cred.user.uid), {
            username: user,
            email: email,
            gold: 1500,
            status: "online"
        });
    } catch (err) {
        authError.textContent = err.message;
    }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
    if(currentUser) {
        await setDoc(doc(db, "users", currentUser.uid), { status: "offline" }, { merge: true });
    }
    localStorage.clear();
    await signOut(auth);
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        document.getElementById('auth-screen').classList.remove('active');
        document.getElementById('main-client').classList.add('active');
        bgm.play().catch(()=>{});
        
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if(userDoc.exists()) {
            document.getElementById('player-name-display').textContent = userDoc.data().username;
            document.getElementById('player-gold-display').textContent = userDoc.data().gold + " Ouro";
            await setDoc(doc(db, "users", user.uid), { status: "online" }, { merge: true });
        }
        setupChat();
    } else {
        currentUser = null;
        document.getElementById('auth-screen').classList.add('active');
        document.getElementById('main-client').classList.remove('active');
        bgm.pause();
    }
});

const navBtns = document.querySelectorAll('.nav-btn');
const sections = document.querySelectorAll('.content-section');

navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        navBtns.forEach(b => b.classList.remove('active'));
        sections.forEach(s => s.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(btn.getAttribute('data-target')).classList.add('active');
    });
});

let selectedRunes = [];
document.querySelectorAll('.rune-card').forEach(card => {
    card.addEventListener('click', () => {
        const rune = card.getAttribute('data-rune');
        if(selectedRunes.includes(rune)) {
            selectedRunes = selectedRunes.filter(r => r !== rune);
            card.classList.remove('selected');
        } else {
            if(selectedRunes.length < 3) {
                selectedRunes.push(rune);
                card.classList.add('selected');
            }
        }
    });
});

document.getElementById('find-match-btn').addEventListener('click', () => {
    document.querySelector('.play-setup').style.display = 'none';
    document.getElementById('battlefield').classList.remove('hidden');
    initGame();
});

let chatUnsubscribe = null;
function setupChat() {
    const chatMsg = document.getElementById('chat-messages');
    const q = query(collection(db, "globalChat"), orderBy("timestamp", "desc"), limit(100));
    
    if(chatUnsubscribe) chatUnsubscribe();
    
    chatUnsubscribe = onSnapshot(q, (snapshot) => {
        chatMsg.innerHTML = '';
        const msgs = [];
        snapshot.forEach(doc => msgs.push(doc.data()));
        msgs.reverse().forEach(data => {
            const div = document.createElement('div');
            div.className = 'msg';
            const t = data.timestamp ? new Date(data.timestamp.toDate()).toLocaleTimeString() : '';
            div.innerHTML = `<span class="time">[${t}]</span><span class="author">${data.user}:</span> ${data.text}`;
            chatMsg.appendChild(div);
        });
        chatMsg.scrollTop = chatMsg.scrollHeight;
    });
}

document.getElementById('chat-send').addEventListener('click', async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if(text && currentUser) {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        await addDoc(collection(db, "globalChat"), {
            uid: currentUser.uid,
            user: userDoc.data().username,
            text: text,
            timestamp: serverTimestamp()
        });
        input.value = '';
    }
});

function renderShop() {
    const grid = document.getElementById('shop-grid');
    grid.innerHTML = '';
    const search = document.getElementById('shop-search').value.toLowerCase();
    const sort = document.getElementById('shop-sort').value;
    
    let filtered = items.filter(i => i.name.toLowerCase().includes(search));
    
    if(sort === 'cost-asc') filtered.sort((a,b) => a.cost - b.cost);
    if(sort === 'cost-desc') filtered.sort((a,b) => b.cost - a.cost);
    if(sort === 'name-asc') filtered.sort((a,b) => a.name.localeCompare(b.name));
    
    filtered.forEach(item => {
        const div = document.createElement('div');
        div.className = 'item-card';
        
        let statsStr = '';
        for(let key in item.stats) {
            if(item.stats[key] > 0) statsStr += `${key}: +${item.stats[key]}<br>`;
        }
        
        div.innerHTML = `
            <div class="item-name">${item.name}</div>
            <div class="item-cost">${item.cost} G</div>
            <div class="item-stats">${statsStr}</div>
        `;
        grid.appendChild(div);
    });
}

document.getElementById('shop-search').addEventListener('input', renderShop);
document.getElementById('shop-sort').addEventListener('change', renderShop);
renderShop();

document.getElementById('calculate-build').addEventListener('click', () => {
    const target = {
        AP: parseInt(document.getElementById('target-ap').value) || 0,
        AD: parseInt(document.getElementById('target-ad').value) || 0,
        RM: parseInt(document.getElementById('target-rm').value) || 0,
        RF: parseInt(document.getElementById('target-rf').value) || 0,
        VM: parseInt(document.getElementById('target-vm').value) || 0,
        MM: parseInt(document.getElementById('target-mm').value) || 0,
        VA: parseInt(document.getElementById('target-va').value) || 0,
        VP: parseInt(document.getElementById('target-vp').value) || 0
    };

    let bestCost = Infinity;
    let bestBuild = [];
    
    function solve(currentIndex, currentStats, currentCost, currentItems) {
        if(currentItems.length > 6) return;
        
        let met = true;
        for(let key in target) {
            if(currentStats[key] < target[key]) {
                met = false;
                break;
            }
        }
        
        if(met) {
            if(currentCost < bestCost) {
                bestCost = currentCost;
                bestBuild = [...currentItems];
            }
            return;
        }

        if(currentCost >= bestCost) return;

        for(let i = currentIndex; i < items.length; i++) {
            const item = items[i];
            if(item.cost === 0) continue; 
            
            let hasUsefulStat = false;
            for(let key in target) {
                if(target[key] > 0 && item.stats[key] > 0) {
                    hasUsefulStat = true;
                    break;
                }
            }
            if(!hasUsefulStat) continue;

            const nextStats = {...currentStats};
            for(let key in target) nextStats[key] += item.stats[key];
            
            currentItems.push(item);
            solve(i, nextStats, currentCost + item.cost, currentItems);
            currentItems.pop();
        }
    }

    solve(0, {AP:0, AD:0, RM:0, RF:0, VM:0, MM:0, VA:0, VP:0}, 0, []);

    const resDiv = document.getElementById('build-results');
    resDiv.innerHTML = '';
    
    if(bestBuild.length === 0) {
        resDiv.innerHTML = '<div style="color:var(--gold-primary)">Nenhuma combinação de até 6 itens alcança esses atributos.</div>';
    } else {
        resDiv.innerHTML = `<h4 style="color:var(--gold-light); margin-bottom:15px;">Build Ideal (Custo Total: ${bestCost}G)</h4>`;
        bestBuild.forEach(item => {
            const div = document.createElement('div');
            div.className = 'build-path-item';
            
            let s = '';
            for(let k in item.stats) {
                if(item.stats[k]>0) s+= `${k}:+${item.stats[k]} `;
            }
            
            div.innerHTML = `
                <div style="flex:1">
                    <strong style="color:var(--gold-primary)">${item.name}</strong><br>
                    <span style="font-size:0.8rem; color:#aaa">${s}</span>
                </div>
                <div style="color:#e6cc80">${item.cost} G</div>
            `;
            resDiv.appendChild(div);
        });
    }
});

let myHP = 100, myMaxHP = 100, myMana = 10, myMaxMana = 10;
let enemyHP = 100, enemyMaxHP = 100, enemyMana = 10, enemyMaxMana = 10;
let turnPhase = 0; 
const phases = ["Fase de Compra", "Fase Principal", "Fase de Combate", "Fim de Turno"];
let turnCount = 1;

let jungleIndex = 0;
const jungleMobs = ["Fantasma", "Gordão da X9", "Twink", "Saqueleto", "Dragão Bafo Colgate", "Seu Zé"];
let mobHp = 0, mobMaxHp = 0;

function spawnJungle() {
    if(jungleIndex >= jungleMobs.length) return;
    mobMaxHp = Math.floor(50 * Math.pow(1.5, jungleIndex));
    mobHp = mobMaxHp;
    updateJungleUI();
}

function updateJungleUI() {
    const jg = document.getElementById('jungle-monster');
    if(jungleIndex >= jungleMobs.length) {
        jg.innerHTML = "Vazio";
        return;
    }
    jg.className = 'monster-entity';
    jg.innerHTML = `
        <div style="font-size:1.2rem; color:#fff">${jungleMobs[jungleIndex]}</div>
        <div>HP: ${mobHp}/${mobMaxHp}</div>
    `;
}

function updateAvatars() {
    document.getElementById('my-hp').style.width = (myHP / myMaxHP * 100) + '%';
    document.getElementById('my-mana').style.width = (myMana / myMaxMana * 100) + '%';
    document.getElementById('enemy-hp').style.width = (enemyHP / enemyMaxHP * 100) + '%';
    document.getElementById('enemy-mana').style.width = (enemyMana / enemyMaxMana * 100) + '%';
}

document.getElementById('btn-end-phase').addEventListener('click', () => {
    turnPhase++;
    if(turnPhase > 3) {
        turnPhase = 0;
        turnCount++;
        myMaxMana = Math.min(100, myMaxMana + 10);
        myMana = myMaxMana;
        
        if(selectedRunes.includes("AnjoDourado")) {
            myMana = Math.min(myMaxMana, myMana + 5);
            myHP = Math.min(myMaxHP, myHP + 5);
        }
        
        if(selectedRunes.includes("Script") && turnCount % 3 === 0) {
            myHP = Math.min(myMaxHP, myHP + 20);
        }
    }
    
    document.getElementById('turn-indicator').textContent = phases[turnPhase] + " (Turno " + turnCount + ")";
    updateAvatars();
});

const canvas = document.getElementById('gesture-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let strokePoints = [];
let comboBuffer = "";
let comboTimer = null;

document.getElementById('btn-cast-gesture').addEventListener('click', () => {
    canvas.classList.add('active');
    ctx.clearRect(0,0, canvas.width, canvas.height);
});

function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    strokePoints = [];
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    strokePoints.push({x, y});
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = var('--blue-glow');
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
});

canvas.addEventListener('mousemove', (e) => {
    if(!drawing) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    strokePoints.push({x, y});
    ctx.lineTo(x, y);
    ctx.stroke();
});

canvas.addEventListener('mouseup', () => {
    if(!drawing) return;
    drawing = false;
    canvas.classList.remove('active');
    const shape = recognizeShape(strokePoints);
    executeShapeEffect(shape);
});

function recognizeShape(points) {
    if(points.length < 10) return "none";
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let start = points[0], end = points[points.length-1];
    
    points.forEach(p => {
        if(p.x < minX) minX = p.x; if(p.x > maxX) maxX = p.x;
        if(p.y < minY) minY = p.y; if(p.y > maxY) maxY = p.y;
    });
    
    let dx = maxX - minX, dy = maxY - minY;
    
    if (Math.hypot(start.x - end.x, start.y - end.y) < (dx + dy) * 0.2 && dx > 30 && dy > 30) return "0";
    if (dy > dx * 2.5 && dy > 50) return "|";
    
    let sharp = false;
    for(let i = 5; i < points.length - 5; i+=5) {
        let p1 = points[i-5], p2 = points[i], p3 = points[i+5];
        let a = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
        let b = Math.pow(p2.x - p3.x, 2) + Math.pow(p2.y - p3.y, 2);
        let c = Math.pow(p1.x - p3.x, 2) + Math.pow(p1.y - p3.y, 2);
        let val = (a+b-c)/(2*Math.sqrt(a)*Math.sqrt(b));
        if(val >= -1 && val <= 1) {
            let angle = Math.acos(val) * (180/Math.PI);
            if(angle < 90 && Math.abs(p2.x - p1.x) > 10 && Math.abs(p2.x - p3.x) > 10) sharp = true;
        }
    }
    
    if(sharp) return ">";
    return "none";
}

function executeShapeEffect(shape) {
    let dmg = 0;
    if(shape === ">") {
        dmg = 15;
        document.getElementById('turn-indicator').textContent = "Corte Flamígero!";
    } else if(shape === "|") {
        dmg = 10;
        document.getElementById('turn-indicator').textContent = "Pilar de Gelo!";
    } else if(shape === "0") {
        myHP = Math.min(myMaxHP, myHP + 20);
        document.getElementById('turn-indicator').textContent = "Escudo Circular!";
        updateAvatars();
        return;
    }
    
    if(dmg > 0) {
        if(mobHp > 0) {
            mobHp -= dmg;
            if(mobHp <= 0) {
                jungleIndex++;
                spawnJungle();
                myMaxMana += 5;
            }
            updateJungleUI();
        } else {
            takeEnemyDamage(dmg);
        }
    }
}

function takeEnemyDamage(amount) {
    if(selectedRunes.includes("CloneChato") && Math.random() > 0.7) {
        return;
    }
    enemyHP -= amount;
    if(enemyHP <= 0) {
        enemyHP = 0;
        document.getElementById('turn-indicator').textContent = "VITÓRIA!";
    }
    updateAvatars();
}

function takeMyDamage(amount) {
    if(selectedRunes.includes("OndasDoMar") && myHP < myMaxHP * 0.1) {
        amount = amount * 0.7; 
        document.getElementById('my-hp').style.background = '#0ac8f9';
    } else {
        document.getElementById('my-hp').style.background = 'var(--red-hp)';
    }

    myHP -= amount;
    if(myHP <= 0) {
        if(selectedRunes.includes("AteAMorte")) {
            myHP = myMaxHP;
            selectedRunes = selectedRunes.filter(r => r !== "AteAMorte"); 
            document.getElementById('turn-indicator').textContent = "Até a Morte ativada!";
        } else {
            myHP = 0;
            document.getElementById('turn-indicator').textContent = "DERROTA!";
        }
    }
    updateAvatars();
}

window.addEventListener('keydown', (e) => {
    if(!document.getElementById('battlefield').classList.contains('hidden') && (e.key === 'q' || e.key === 'w' || e.key === 'e' || e.key === 'Q' || e.key === 'W' || e.key === 'E')) {
        const k = e.key.toUpperCase();
        
        let maxLen = selectedRunes.includes("PintorMestre") ? 4 : 3;
        
        comboBuffer += k;
        if(comboBuffer.length > maxLen) {
            comboBuffer = comboBuffer.substring(comboBuffer.length - maxLen);
        }
        
        const cd = document.getElementById('combo-display');
        cd.textContent = comboBuffer;
        cd.style.animation = 'none';
        void cd.offsetWidth;
        cd.style.animation = 'fadeIn 0.2s';
        
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => {
            executeCombo(comboBuffer);
            comboBuffer = "";
            cd.textContent = "";
        }, 800);
    }
});

function executeCombo(combo) {
    if(combo === "QW") {
        takeEnemyDamage(20);
        document.getElementById('turn-indicator').textContent = "Combo: Explosão Sônica (20 dmg)";
    } else if(combo === "WE") {
        myHP = Math.min(myMaxHP, myHP + 25);
        document.getElementById('turn-indicator').textContent = "Combo: Cura Torrencial (+25 HP)";
        updateAvatars();
    } else if(combo === "QQ") {
        takeEnemyDamage(10);
        document.getElementById('turn-indicator').textContent = "Combo: Dardo Duplo (10 dmg)";
    } else if(combo === "QWE") {
        takeEnemyDamage(40);
        document.getElementById('turn-indicator').textContent = "Combo Mestre: Destruição Absoluta (40 dmg)";
    } else if(combo.length === 4 && selectedRunes.includes("PintorMestre")) {
        takeEnemyDamage(80);
        myHP = Math.min(myMaxHP, myHP + 40);
        document.getElementById('turn-indicator').textContent = "ARTE FINAL! (80 dmg, 40 heal)";
        updateAvatars();
    }
}

function initGame() {
    myHP = 100; myMaxHP = 100; myMana = 10; myMaxMana = 10;
    enemyHP = 100; enemyMaxHP = 100; enemyMana = 10; enemyMaxMana = 10;
    turnPhase = 0; turnCount = 1;
    jungleIndex = 0;
    
    document.getElementById('player-hand').innerHTML = '';
    for(let i=0; i<5; i++) {
        const cardItem = items[Math.floor(Math.random() * items.length)];
        const div = document.createElement('div');
        div.className = 'card';
        div.draggable = true;
        div.innerHTML = `
            <div class="card-title">${cardItem.name}</div>
            <div style="flex:1; background:url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzFhMWYyZSIvPjxjaXJjbGUgY3g9IjUwIiBjeT0iNTAiIHI9IjMwIiBmaWxsPSIjYzhhYTZlIiBvcGFjaXR5PSIwLjEiLz48L3N2Zz4=') center/cover;"></div>
            <div class="card-stats">
                <span style="color:var(--red-hp)">${cardItem.stats.AD}</span>
                <span style="color:var(--gold-primary)">${cardItem.cost}G</span>
                <span style="color:var(--blue-mana)">${cardItem.stats.AP}</span>
            </div>
        `;
        
        div.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', JSON.stringify(cardItem));
            setTimeout(() => div.style.opacity = '0.5', 0);
        });
        div.addEventListener('dragend', () => {
            div.style.opacity = '1';
        });

        document.getElementById('player-hand').appendChild(div);
    }
    
    document.getElementById('player-slots').innerHTML = '';
    for(let i=0; i<4; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => {
            e.preventDefault();
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if(myMana >= (data.cost / 100)) {
                myMana -= Math.floor(data.cost / 100);
                slot.innerHTML = `
                    <div style="font-size:0.6rem; text-align:center; color:var(--gold-primary); margin-top:5px;">${data.name}</div>
                    <div style="text-align:center; font-size:1.5rem; margin-top:20px; color:var(--red-hp)">${data.stats.AD || data.stats.AP}</div>
                `;
                slot.style.border = '1px solid var(--gold-primary)';
                takeEnemyDamage(data.stats.AD || data.stats.AP);
                updateAvatars();
            } else {
                document.getElementById('turn-indicator').textContent = "Mana Insuficiente!";
            }
        });
        document.getElementById('player-slots').appendChild(slot);
    }
    
    spawnJungle();
    updateAvatars();
    document.getElementById('turn-indicator').textContent = phases[turnPhase] + " (Turno " + turnCount + ")";
}
