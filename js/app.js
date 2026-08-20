// ==========================================
// IMPORTAÇÕES DO FIREBASE (Via CDN nativo do navegador)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    onChildAdded, 
    set, 
    get, 
    child 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// ⚠️ ATENÇÃO: Substitua estas chaves pelas do seu projeto Firebase Realtime Database!
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

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================================
// ESTADO GLOBAL DO JOGADOR
// ==========================================
export const gameState = {
    playerName: "",
    roomName: "",
    heroId: "",
    heroInstance: null,
    level: 1,
    gold: 500,
    lane: "Base",
    stats: {
        hp: 100, maxHp: 100,
        mana: 100, maxMana: 100,
        xp: 0, maxXp: 100,
        ad: 10, ap: 0, def: 15, mdef: 10, ms: 300, cdr: 0
    }
};

// ==========================================
// ELEMENTOS DO DOM
// ==========================================
const DOM = {
    // Telas
    lobbyScreen: document.getElementById('lobby-screen'),
    gameScreen: document.getElementById('game-screen'),
    
    // Inputs de Lobby
    inputName: document.getElementById('player-name'),
    selectHero: document.getElementById('hero-select'),
    inputRoom: document.getElementById('room-name'),
    inputPass: document.getElementById('room-pass'),
    btnCreate: document.getElementById('btn-create-room'),
    btnJoin: document.getElementById('btn-join-room'),
    
    // Chat
    chatLog: document.getElementById('chat-log'),
    chatInput: document.getElementById('chat-input'),
    btnSendChat: document.getElementById('btn-send-chat'),
    
    // UI de Jogo (Modais)
    btnShop: document.getElementById('btn-open-shop'),
    shopModal: document.getElementById('shop-modal'),
    closeShop: document.getElementById('close-shop'),
    btnMap: document.getElementById('btn-map'),
    mapModal: document.getElementById('map-modal'),
    closeMap: document.getElementById('close-map'),
    laneBtns: document.querySelectorAll('.lane-btn')
};

// ==========================================
// SISTEMA DE MODULARIDADE DE HERÓIS
// ==========================================
// Esta função faz o "Drag and Drop" funcionar. Ela lê o arquivo do personagem selecionado.
async function carregarHeroi(heroId) {
    try {
        // Importa o script do herói dinamicamente
        const moduloHeroi = await import(`./heroes/${heroId}.js`);
        
        // Instancia o herói e passa o estado global para ele
        gameState.heroInstance = new moduloHeroi.default(gameState, db);
        gameState.heroInstance.iniciar();
        
        console.log(`Herói ${heroId} carregado com sucesso!`);
    } catch (erro) {
        console.error("Erro ao carregar os arquivos do grimório do herói:", erro);
        alert("Falha ao invocar o herói. Verifique se o arquivo .js existe na pasta heroes.");
    }
}

// ==========================================
// LÓGICA DE LOBBY (CRIAR / ENTRAR)
// ==========================================
async function validarEntrada() {
    const nome = DOM.inputName.value.trim();
    const sala = DOM.inputRoom.value.trim();
    
    if (!nome || !sala) {
        alert("Preencha seu Nome e o Nome da Sala!");
        return false;
    }
    
    gameState.playerName = nome;
    gameState.roomName = sala;
    gameState.heroId = DOM.selectHero.value;
    
    return true;
}

DOM.btnCreate.addEventListener('click', async () => {
    if (!await validarEntrada()) return;
    
    const salaRef = ref(db, `rooms/${gameState.roomName}`);
    const snapshot = await get(salaRef);
    
    if (snapshot.exists()) {
        alert("Esta sala já existe! Tente 'Entrar na Partida'.");
        return;
    }

    // Cria a sala com a senha
    await set(salaRef, {
        password: DOM.inputPass.value.trim(),
        created_at: Date.now()
    });
    
    iniciarPartida();
});

DOM.btnJoin.addEventListener('click', async () => {
    if (!await validarEntrada()) return;
    
    const salaRef = ref(db, `rooms/${gameState.roomName}`);
    const snapshot = await get(salaRef);
    
    if (!snapshot.exists()) {
        alert("Sala não encontrada! Verifique o nome.");
        return;
    }
    
    const dadosSala = snapshot.val();
    if (dadosSala.password && dadosSala.password !== DOM.inputPass.value.trim()) {
        alert("Senha incorreta, invasor!");
        return;
    }
    
    iniciarPartida();
});

async function iniciarPartida() {
    // Troca a tela
    DOM.lobbyScreen.classList.add('hidden');
    DOM.gameScreen.classList.remove('hidden');
    
    // Atualiza UI base
    atualizarUI();
    
    // Carrega o personagem escolhido
    await carregarHeroi(gameState.heroId);
    
    // Conecta ao Chat
    iniciarChat();
    
    // Envia mensagem de sistema
    enviarMensagemSistema(`${gameState.playerName} (Jogando de ${gameState.heroId}) conectou-se ao Rift.`);
}

// ==========================================
// LÓGICA DE CHAT E SINCRONIZAÇÃO
// ==========================================
function iniciarChat() {
    const chatRef = ref(db, `rooms/${gameState.roomName}/chat`);
    
    // Escuta novas mensagens em tempo real
    onChildAdded(chatRef, (snapshot) => {
        const msg = snapshot.val();
        renderizarMensagem(msg);
    });
}

function enviarMensagemSistema(texto) {
    const chatRef = ref(db, `rooms/${gameState.roomName}/chat`);
    push(chatRef, { sender: "Sistema", text: texto, type: "sys", time: Date.now() });
}

function enviarMensagemChat() {
    const texto = DOM.chatInput.value.trim();
    if (!texto) return;
    
    const chatRef = ref(db, `rooms/${gameState.roomName}/chat`);
    push(chatRef, {
        sender: gameState.playerName,
        text: texto,
        type: "player",
        time: Date.now()
    });
    
    DOM.chatInput.value = "";
}

DOM.btnSendChat.addEventListener('click', enviarMensagemChat);
DOM.chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') enviarMensagemChat();
});

function renderizarMensagem(msg) {
    const div = document.createElement('div');
    
    if (msg.type === "sys") {
        div.className = "sys-msg";
        div.innerText = msg.text;
    } else {
        // Define se é o próprio jogador ou aliado/inimigo (simplificado para aliado por enquanto)
        const isMe = msg.sender === gameState.playerName;
        div.className = isMe ? "msg-ally" : "msg-enemy";
        div.innerHTML = `<strong>${msg.sender}:</strong> ${msg.text}`;
    }
    
    DOM.chatLog.appendChild(div);
    DOM.chatLog.scrollTop = DOM.chatLog.scrollHeight; // Auto-scroll
}

// ==========================================
// INTERAÇÕES DE UI (ATRIBUTOS, MAPA, LOJA)
// ==========================================
// Exportamos esta função para que o engine.js e litlegot.js possam forçar a atualização visual
export function atualizarUI() {
    document.getElementById('player-level').innerText = gameState.level;
    document.getElementById('player-gold').innerText = Math.floor(gameState.gold);
    document.getElementById('current-lane').innerText = gameState.lane;
    
    // Barras
    document.getElementById('hp-text').innerText = `${Math.floor(gameState.stats.hp)}/${gameState.stats.maxHp}`;
    document.getElementById('hp-bar').style.width = `${(gameState.stats.hp / gameState.stats.maxHp) * 100}%`;
    
    document.getElementById('mana-text').innerText = `${Math.floor(gameState.stats.mana)}/${gameState.stats.maxMana}`;
    document.getElementById('mana-bar').style.width = `${(gameState.stats.mana / gameState.stats.maxMana) * 100}%`;
    
    document.getElementById('xp-bar').style.width = `${(gameState.stats.xp / gameState.stats.maxXp) * 100}%`;
    
    // Status
    document.getElementById('stat-ad').innerText = gameState.stats.ad;
    document.getElementById('stat-ap').innerText = gameState.stats.ap;
    document.getElementById('stat-def').innerText = gameState.stats.def;
    document.getElementById('stat-mdef').innerText = gameState.stats.mdef;
    document.getElementById('stat-ms').innerText = gameState.stats.ms;
    document.getElementById('stat-cdr').innerText = `${gameState.stats.cdr}%`;
}

// Modal Loja
DOM.btnShop.addEventListener('click', () => {
    if (gameState.lane !== "Base") {
        return alert("Você precisa estar na Base para acessar a loja!");
    }
    DOM.shopModal.classList.remove('hidden');
});
DOM.closeShop.addEventListener('click', () => DOM.shopModal.classList.add('hidden'));

// Modal Mapa
DOM.btnMap.addEventListener('click', () => DOM.mapModal.classList.remove('hidden'));
DOM.closeMap.addEventListener('click', () => DOM.mapModal.classList.add('hidden'));

// Troca de Lane
DOM.laneBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const novaLane = e.target.dataset.lane;
        // Tempo de viagem (ex: 3 segundos se não for base -> base)
        enviarMensagemSistema(`${gameState.playerName} está se movendo para: ${novaLane.toUpperCase()}`);
        gameState.lane = novaLane.charAt(0).toUpperCase() + novaLane.slice(1);
        atualizarUI();
        DOM.mapModal.classList.add('hidden');
    });
});
