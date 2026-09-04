/**
 * HWEI: O PINTOR - JOGO DE CARTAS MULTIPLAYER
 * Script Completo, Mobile-Optimized e Integrado com Firebase.
 * Contém Autenticação, Matchmaking, Sincronização em Tempo Real (Realtime Database),
 * Motor de Desenho em Canvas e Lógica de Combate.
 */

// ============================================================================
// 1. CONFIGURAÇÃO DO FIREBASE (Insira as credenciais do seu projeto aqui)
// ============================================================================
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

// Inicialização
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// ============================================================================
// 2. ESTADO GLOBAL DA APLICAÇÃO E VARIÁVEIS
// ============================================================================
const AppState = {
    user: null,
    gameId: null,
    isMyTurn: false,
    playerNum: 0, // 1 ou 2
    opponentId: null,
    
    // Status do Jogador Local
    hp: 100,
    maxHp: 100,
    gold: 0,
    hand: [],
    
    // Status do Inimigo
    enemyHp: 100,
    enemyMaxHp: 100,
    enemyName: "Oponente",

    // Motor de Desenho
    currentInk: 'damage', // damage, heal, control
    isDrawing: false,
    strokes: [], // Guarda as coordenadas para análise
    canvasCtx: null,
    
    // Sons
    bgMusic: document.getElementById('bg-music'),
    musicStarted: false
};

const ShopItems = [
    { id: 'item_potion', name: 'Poção Maior', cost: 15, effect: 'heal', value: 30, icon: '🧪' },
    { id: 'item_upgrade', name: 'Tinta Aprimorada', cost: 25, effect: 'damage_buff', value: 10, icon: '🖌️' },
    { id: 'item_shield', name: 'Barreira', cost: 20, effect: 'shield', value: 20, icon: '🛡️' }
];

// ============================================================================
// 3. MAPEAMENTO DO DOM
// ============================================================================
const UI = {
    // Telas
    viewAuth: document.getElementById('view-auth'),
    viewLobby: document.getElementById('view-lobby'),
    viewMatchmaking: document.getElementById('view-matchmaking'),
    viewGame: document.getElementById('view-game'),
    
    // Formulários de Auth
    formLogin: document.getElementById('form-login'),
    formRegister: document.getElementById('form-register'),
    toggleRegister: document.getElementById('toggle-register'),
    toggleLogin: document.getElementById('toggle-login'),
    
    // Lobby e Matchmaking
    lobbyUsername: document.getElementById('lobby-username'),
    btnFindMatch: document.getElementById('btn-find-match'),
    btnCancelMatch: document.getElementById('btn-cancel-match'),
    btnLogout: document.getElementById('btn-logout'),
    matchmakingStatus: document.getElementById('matchmaking-status'),
    
    // Jogo - HUD
    playerName: document.getElementById('player-name'),
    playerHpText: document.getElementById('player-hp-text'),
    playerHpFill: document.getElementById('player-hp-fill'),
    playerGold: document.getElementById('player-gold'),
    enemyName: document.getElementById('enemy-name'),
    enemyHpText: document.getElementById('enemy-hp-text'),
    enemyHpFill: document.getElementById('enemy-hp-fill'),
    turnIndicator: document.getElementById('turn-indicator'),
    
    // Jogo - Tabuleiro e Mão
    playerHand: document.getElementById('player-hand'),
    playerBoard: document.getElementById('player-board'),
    enemyBoard: document.getElementById('enemy-board'),
    
    // Jogo - Canvas e Ações
    canvas: document.getElementById('magic-canvas'),
    inkBtns: document.querySelectorAll('.ink-btn'),
    symbolGuide: document.getElementById('symbol-guide'),
    drawFeedback: document.getElementById('draw-feedback'),
    btnClearCanvas: document.getElementById('btn-clear-canvas'),
    btnCreateCard: document.getElementById('btn-create-card'),
    btnEndTurn: document.getElementById('btn-end-turn'),
    
    // Loja e Modais
    btnOpenShop: document.getElementById('btn-open-shop'),
    btnCloseShop: document.getElementById('btn-close-shop'),
    modalShop: document.getElementById('modal-shop'),
    shopGrid: document.getElementById('shop-grid'),
    shopGoldDisplay: document.getElementById('shop-gold-display'),
    
    // Modal Fim de Jogo
    modalEndgame: document.getElementById('modal-endgame'),
    endgameTitle: document.getElementById('endgame-title'),
    endgameMsg: document.getElementById('endgame-msg'),
    btnBackLobby: document.getElementById('btn-back-lobby')
};

// ============================================================================
// 4. GERENCIADOR DE TELAS E NAVEGAÇÃO
// ============================================================================
function switchScreen(screenElement) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    screenElement.classList.remove('hidden');
    screenElement.classList.add('active');
}

function showModal(modalElement) {
    modalElement.classList.remove('hidden');
    modalElement.classList.add('active');
}

function hideModal(modalElement) {
    modalElement.classList.remove('active');
    setTimeout(() => modalElement.classList.add('hidden'), 300);
}

// Iniciar música ao primeiro toque (Política de navegadores)
document.body.addEventListener('click', () => {
    if (!AppState.musicStarted && AppState.bgMusic) {
        AppState.bgMusic.volume = 0.3;
        AppState.bgMusic.play().catch(e => console.log("Áudio bloqueado pelo navegador", e));
        AppState.musicStarted = true;
    }
}, { once: true });

// ============================================================================
// 5. AUTENTICAÇÃO (FIREBASE)
// ============================================================================
UI.toggleRegister.addEventListener('click', (e) => {
    e.preventDefault();
    UI.formLogin.classList.replace('active-form', 'hidden-form');
    UI.formRegister.classList.replace('hidden-form', 'active-form');
});

UI.toggleLogin.addEventListener('click', (e) => {
    e.preventDefault();
    UI.formRegister.classList.replace('active-form', 'hidden-form');
    UI.formLogin.classList.replace('hidden-form', 'active-form');
});

UI.formRegister.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const pass = document.getElementById('reg-password').value;
    const username = document.getElementById('reg-username').value;
    
    try {
        const userCred = await auth.createUserWithEmailAndPassword(email, pass);
        await userCred.user.updateProfile({ displayName: username });
        // Salvar dados base no Realtime Database
        await db.ref('users/' + userCred.user.uid).set({
            username: username,
            rating: 1000,
            gamesPlayed: 0
        });
    } catch (error) {
        alert("Erro ao registrar: " + error.message);
    }
});

UI.formLogin.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pass = document.getElementById('login-password').value;
    try {
        await auth.signInWithEmailAndPassword(email, pass);
    } catch (error) {
        alert("Erro no login: " + error.message);
    }
});

UI.btnLogout.addEventListener('click', () => auth.signOut());

// Listener de Estado de Autenticação
auth.onAuthStateChanged(user => {
    if (user) {
        AppState.user = user;
        UI.lobbyUsername.textContent = user.displayName || "Jogador";
        UI.playerName.textContent = user.displayName || "Você";
        switchScreen(UI.viewLobby);
    } else {
        AppState.user = null;
        switchScreen(UI.viewAuth);
    }
});

// ============================================================================
// 6. MATCHMAKING E GERENCIAMENTO DE FILA
// ============================================================================
let matchmakingRef = null;
let gameRef = null;

UI.btnFindMatch.addEventListener('click', joinMatchmaking);
UI.btnCancelMatch.addEventListener('click', cancelMatchmaking);

async function joinMatchmaking() {
    switchScreen(UI.viewMatchmaking);
    UI.matchmakingStatus.textContent = "Procurando oponente...";
    const uid = AppState.user.uid;
    
    // Tenta encontrar alguém na fila
    const queueRef = db.ref('queue');
    const snapshot = await queueRef.once('value');
    const queue = snapshot.val();
    
    let matched = false;
    if (queue) {
        for (let playerId in queue) {
            if (playerId !== uid) {
                // Oponente encontrado! Cria a sala.
                matched = true;
                const gameId = 'game_' + Date.now();
                
                // Estrutura inicial do jogo
                const gameData = {
                    status: 'playing',
                    currentTurn: playerId, // Oponente começa
                    turnCount: 1,
                    players: {
                        [playerId]: { hp: 100, maxHp: 100, gold: 0, name: queue[playerId].name, num: 1 },
                        [uid]: { hp: 100, maxHp: 100, gold: 0, name: AppState.user.displayName, num: 2 }
                    },
                    lastAction: { type: 'start' }
                };
                
                await db.ref('games/' + gameId).set(gameData);
                // Remove oponente da fila e notifica-o do jogo criado
                await db.ref('queue/' + playerId).remove();
                await db.ref('users/' + playerId + '/activeGame').set(gameId);
                await db.ref('users/' + uid + '/activeGame').set(gameId);
                
                initGame(gameId, 2, queue[playerId].name, playerId);
                break;
            }
        }
    }
    
    if (!matched) {
        // Entra na fila e aguarda
        matchmakingRef = db.ref('queue/' + uid);
        await matchmakingRef.set({ name: AppState.user.displayName, time: Date.now() });
        
        // Fica ouvindo se foi puxado para um jogo
        db.ref('users/' + uid + '/activeGame').on('value', (snap) => {
            const activeGameId = snap.val();
            if (activeGameId) {
                db.ref('users/' + uid + '/activeGame').off(); // Remove listener
                
                // Busca nome do oponente no jogo
                db.ref('games/' + activeGameId + '/players').once('value').then(pSnap => {
                    const players = pSnap.val();
                    let oppName = "Oponente";
                    let oppId = null;
                    for (let id in players) {
                        if (id !== uid) { oppName = players[id].name; oppId = id; }
                    }
                    initGame(activeGameId, 1, oppName, oppId);
                });
            }
        });
    }
}

async function cancelMatchmaking() {
    const uid = AppState.user.uid;
    if (matchmakingRef) {
        await matchmakingRef.remove();
        matchmakingRef = null;
    }
    db.ref('users/' + uid + '/activeGame').off();
    switchScreen(UI.viewLobby);
}

// ============================================================================
// 7. LÓGICA DE SINCRONIZAÇÃO DA PARTIDA
// ============================================================================
function initGame(gameId, playerNum, opponentName, opponentId) {
    AppState.gameId = gameId;
    AppState.playerNum = playerNum;
    AppState.opponentId = opponentId;
    AppState.enemyName = opponentName;
    
    // Resetar Status Local
    AppState.hp = 100;
    AppState.gold = 0;
    AppState.hand = [];
    AppState.enemyHp = 100;
    
    UI.enemyName.textContent = opponentName;
    updateHUD();
    
    switchScreen(UI.viewGame);
    setupCanvas();
    renderShop();
    
    gameRef = db.ref('games/' + gameId);
    
    // Listener principal do estado do jogo
    gameRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        
        // Atualizar Status HPs
        const me = data.players[AppState.user.uid];
        const enemy = data.players[AppState.opponentId];
        
        AppState.hp = me.hp;
        AppState.gold = me.gold;
        AppState.enemyHp = enemy.hp;
        updateHUD();
        
        // Controle de Turno
        AppState.isMyTurn = (data.currentTurn === AppState.user.uid);
        
        if (AppState.isMyTurn) {
            UI.turnIndicator.textContent = "Seu Turno";
            UI.turnIndicator.style.color = "var(--color-heal)";
            UI.canvas.style.pointerEvents = "auto";
            UI.btnEndTurn.disabled = false;
        } else {
            UI.turnIndicator.textContent = "Turno do Inimigo";
            UI.turnIndicator.style.color = "var(--color-damage)";
            UI.canvas.style.pointerEvents = "none";
            UI.btnEndTurn.disabled = true;
        }
        
        // Verificar Condição de Vitória/Derrota
        if (data.status === 'finished') {
            handleEndgame(data.winner);
        }
    });
}

async function performAction(actionType, value, cardElement = null) {
    if (!AppState.isMyTurn) return;
    
    let updates = {};
    
    if (actionType === 'damage') {
        const newEnemyHp = Math.max(0, AppState.enemyHp - value);
        updates[`players/${AppState.opponentId}/hp`] = newEnemyHp;
        if (newEnemyHp === 0) updates['status'] = 'finished';
    } 
    else if (actionType === 'heal') {
        const newHp = Math.min(100, AppState.hp + value);
        updates[`players/${AppState.user.uid}/hp`] = newHp;
    }
    
    updates['lastAction'] = { type: actionType, value: value, by: AppState.user.uid };
    
    // Remove a carta da mão localmente e visualmente
    if (cardElement) {
        cardElement.remove();
        const index = AppState.hand.indexOf(cardElement);
        if (index > -1) AppState.hand.splice(index, 1);
    }
    
    await gameRef.update(updates);
    
    if (updates['status'] === 'finished') {
        await gameRef.update({ winner: AppState.user.uid });
    }
}

UI.btnEndTurn.addEventListener('click', async () => {
    if (!AppState.isMyTurn) return;
    
    // Adicionar ouro ao passar o turno
    const newGold = AppState.gold + 10;
    
    const updates = {
        currentTurn: AppState.opponentId,
        [`players/${AppState.user.uid}/gold`]: newGold,
        lastAction: { type: 'end_turn', by: AppState.user.uid }
    };
    
    await gameRef.update(updates);
    
    // Limpar área de desenho
    clearCanvas();
    UI.drawFeedback.textContent = "Aguarde seu turno...";
});

function handleEndgame(winnerUid) {
    gameRef.off(); // Remove listener
    db.ref('users/' + AppState.user.uid + '/activeGame').remove();
    
    showModal(UI.modalEndgame);
    if (winnerUid === AppState.user.uid) {
        UI.endgameTitle.textContent = "VITÓRIA!";
        UI.endgameTitle.style.color = "var(--color-heal)";
        UI.endgameMsg.textContent = "Sua arte dominou o campo de batalha.";
    } else {
        UI.endgameTitle.textContent = "DERROTA";
        UI.endgameTitle.style.color = "var(--color-damage)";
        UI.endgameMsg.textContent = "Você foi superado pela técnica inimiga.";
    }
}

UI.btnBackLobby.addEventListener('click', () => {
    hideModal(UI.modalEndgame);
    switchScreen(UI.viewLobby);
});

function updateHUD() {
    UI.playerHpText.textContent = `${AppState.hp}/100`;
    UI.playerHpFill.style.width = `${AppState.hp}%`;
    UI.playerGold.textContent = AppState.gold;
    UI.shopGoldDisplay.textContent = AppState.gold;
    
    UI.enemyHpText.textContent = `${AppState.enemyHp}/100`;
    UI.enemyHpFill.style.width = `${AppState.enemyHp}%`;
}

// ============================================================================
// 8. MOTOR DE DESENHO NO CANVAS E RECONHECIMENTO (MOBILE & DESKTOP)
// ============================================================================

// Seleção de Tinta
UI.inkBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        UI.inkBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        AppState.currentInk = btn.dataset.ink;
        
        // Atualiza a instrução
        if (AppState.currentInk === 'damage') UI.symbolGuide.textContent = "Símbolo: V";
        if (AppState.currentInk === 'heal') UI.symbolGuide.textContent = "Símbolo: O (Círculo)";
        if (AppState.currentInk === 'control') UI.symbolGuide.textContent = "Símbolo: — (Linha)";
        
        setCanvasStyle();
    });
});

function setupCanvas() {
    const canvas = UI.canvas;
    AppState.canvasCtx = canvas.getContext('2d', { willReadFrequently: true });
    
    // Ajuste dinâmico de resolução baseada no CSS
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    setCanvasStyle();

    // Eventos Mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Eventos Touch (Mobile)
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', stopDrawing);
}

function setCanvasStyle() {
    const ctx = AppState.canvasCtx;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 10;
    
    if (AppState.currentInk === 'damage') {
        ctx.strokeStyle = '#ef4444';
        ctx.shadowColor = '#ef4444';
    } else if (AppState.currentInk === 'heal') {
        ctx.strokeStyle = '#10b981';
        ctx.shadowColor = '#10b981';
    } else {
        ctx.strokeStyle = '#8b5cf6';
        ctx.shadowColor = '#8b5cf6';
    }
}

// Manipuladores de Coordenadas
function getCoordinates(e) {
    const rect = UI.canvas.getBoundingClientRect();
    const scaleX = UI.canvas.width / rect.width;
    const scaleY = UI.canvas.height / rect.height;
    
    if (e.touches && e.touches.length > 0) {
        return {
            x: (e.touches[0].clientX - rect.left) * scaleX,
            y: (e.touches[0].clientY - rect.top) * scaleY
        };
    }
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

function startDrawing(e) {
    if (!AppState.isMyTurn) return;
    if (e.type.includes('touch')) e.preventDefault(); // Previne scroll no mobile
    
    AppState.isDrawing = true;
    AppState.strokes = [];
    const pos = getCoordinates(e);
    AppState.strokes.push(pos);
    
    AppState.canvasCtx.beginPath();
    AppState.canvasCtx.moveTo(pos.x, pos.y);
    UI.drawFeedback.textContent = "Desenhando...";
}

function handleTouchStart(e) { startDrawing(e); }

function draw(e) {
    if (!AppState.isDrawing) return;
    if (e.type.includes('touch')) e.preventDefault();
    
    const pos = getCoordinates(e);
    // Filtrar pontos muito próximos para otimizar a performance do vetor
    const lastPos = AppState.strokes[AppState.strokes.length - 1];
    const dist = Math.hypot(pos.x - lastPos.x, pos.y - lastPos.y);
    
    if (dist > 5) {
        AppState.strokes.push(pos);
        AppState.canvasCtx.lineTo(pos.x, pos.y);
        AppState.canvasCtx.stroke();
    }
}

function handleTouchMove(e) { draw(e); }

function stopDrawing() {
    if (!AppState.isDrawing) return;
    AppState.isDrawing = false;
    AppState.canvasCtx.closePath();
}

UI.btnClearCanvas.addEventListener('click', clearCanvas);

function clearCanvas() {
    if (!AppState.canvasCtx) return;
    AppState.canvasCtx.clearRect(0, 0, UI.canvas.width, UI.canvas.height);
    AppState.strokes = [];
    UI.drawFeedback.textContent = "Pinte para criar";
}

// Lógica de Reconhecimento de Forma Direcional Simplificada
function analyzeDrawing() {
    if (AppState.strokes.length < 10) return "invalido"; // Traço muito curto
    
    const pts = AppState.strokes;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    
    pts.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });
    
    const width = maxX - minX;
    const height = maxY - minY;
    const pStart = pts[0];
    const pEnd = pts[pts.length - 1];
    const distStartEnd = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);
    const boundingBoxDiagonal = Math.hypot(width, height);
    
    // Regra 1: Círculo ('O' - Curar)
    // Se desenhar muito, tem altura e largura proporcionais, e o começo encontra o fim.
    if (width > 30 && height > 30 && distStartEnd < (boundingBoxDiagonal * 0.3)) {
        return "circulo";
    }
    
    // Regra 2: Linha ('-' - Controle)
    // Muito mais largo do que alto.
    if (width > height * 2.5) {
        return "linha";
    }
    
    // Regra 3: Letra 'V' (Dano)
    // Começa alto, vai baixo (meio), e termina alto.
    // Simples check de direção y:
    let minIndex = 0;
    for(let i=0; i<pts.length; i++) {
        if(pts[i].y > pts[minIndex].y) minIndex = i; // Encontra o ponto mais baixo (maior Y)
    }
    // O ponto mais baixo deve estar mais ou menos no meio do array
    if (minIndex > pts.length * 0.2 && minIndex < pts.length * 0.8) {
        if (pStart.y < pts[minIndex].y - 20 && pEnd.y < pts[minIndex].y - 20) {
            return "v";
        }
    }

    return "invalido";
}

// ============================================================================
// 9. SISTEMA DE CARTAS
// ============================================================================
UI.btnCreateCard.addEventListener('click', () => {
    if (!AppState.isMyTurn) return;
    
    const forma = analyzeDrawing();
    
    if (forma === "invalido") {
        UI.drawFeedback.textContent = "Desenho fraco ou incorreto.";
        UI.drawFeedback.style.color = "var(--color-damage)";
        setTimeout(() => { UI.drawFeedback.style.color = "var(--text-muted)"; }, 2000);
        clearCanvas();
        return;
    }

    // Validar Tinta vs Forma
    let cardGerada = null;
    
    if (AppState.currentInk === 'damage' && forma === 'v') {
        cardGerada = { name: "Golpe Cortante", type: "damage", value: 20, icon: "⚔️" };
    } 
    else if (AppState.currentInk === 'heal' && forma === 'circulo') {
        cardGerada = { name: "Brisa Curativa", type: "heal", value: 15, icon: "🌿" };
    } 
    else if (AppState.currentInk === 'control' && forma === 'linha') {
        cardGerada = { name: "Muralha de Tinta", type: "control", value: 10, icon: "🛡️" }; // Dano penetrante
    } 
    else {
        UI.drawFeedback.textContent = "O símbolo não combinou com a tinta.";
        UI.drawFeedback.style.color = "var(--color-gold)";
        setTimeout(() => { UI.drawFeedback.style.color = "var(--text-muted)"; }, 2000);
        clearCanvas();
        return;
    }

    createCardDOM(cardGerada);
    clearCanvas();
    UI.drawFeedback.textContent = "Carta criada!";
});

function createCardDOM(cardData) {
    if (AppState.hand.length >= 5) {
        alert("Sua mão está cheia (Max 5)");
        return;
    }

    const card = document.createElement('div');
    card.className = 'game-card';
    
    // Cor da borda baseada no tipo
    if (cardData.type === 'damage') card.style.borderColor = 'var(--color-damage)';
    if (cardData.type === 'heal') card.style.borderColor = 'var(--color-heal)';
    if (cardData.type === 'control') card.style.borderColor = 'var(--color-control)';

    card.innerHTML = `
        <div class="card-icon" style="text-align: center; font-size: 1.5rem;">${cardData.icon}</div>
        <div class="card-title">${cardData.name}</div>
        <div class="card-stats">
            <span>Ativ:</span>
            <span>${cardData.value}</span>
        </div>
    `;

    // Evento de Jogar a carta
    card.addEventListener('click', () => {
        if (!AppState.isMyTurn) return;
        
        // Efeito visual de jogar para o campo
        UI.playerBoard.appendChild(card);
        card.style.transform = "translateY(-50px) scale(1.1)";
        card.style.opacity = "0";
        card.style.transition = "all 0.5s ease";
        
        setTimeout(() => {
            performAction(cardData.type, cardData.value, card);
        }, 500);
    });

    UI.playerHand.appendChild(card);
    AppState.hand.push(card);
}

// ============================================================================
// 10. LOJA DE ITENS
// ============================================================================
UI.btnOpenShop.addEventListener('click', () => showModal(UI.modalShop));
UI.btnCloseShop.addEventListener('click', () => hideModal(UI.modalShop));

function renderShop() {
    UI.shopGrid.innerHTML = '';
    ShopItems.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';
        itemDiv.innerHTML = `
            <div style="font-size: 2rem;">${item.icon}</div>
            <h4>${item.name}</h4>
            <div class="gold">🪙 ${item.cost}</div>
            <button class="btn btn-primary small mt-15">Comprar</button>
        `;
        
        const btn = itemDiv.querySelector('button');
        btn.addEventListener('click', () => buyItem(item));
        
        UI.shopGrid.appendChild(itemDiv);
    });
}

async function buyItem(item) {
    if (!AppState.isMyTurn) {
        alert("Você só pode comprar no seu turno.");
        return;
    }
    if (AppState.gold < item.cost) {
        alert("Ouro insuficiente.");
        return;
    }
    
    // Deduz o custo
    const novoOuro = AppState.gold - item.cost;
    let updates = {
        [`players/${AppState.user.uid}/gold`]: novoOuro
    };

    // Aplica efeito
    if (item.effect === 'heal') {
        const newHp = Math.min(100, AppState.hp + item.value);
        updates[`players/${AppState.user.uid}/hp`] = newHp;
    } else if (item.effect === 'damage_buff') {
        // Exemplo: Causa dano direto mágico
        const newEnemyHp = Math.max(0, AppState.enemyHp - item.value);
        updates[`players/${AppState.opponentId}/hp`] = newEnemyHp;
        if (newEnemyHp === 0) updates['status'] = 'finished';
    }

    updates['lastAction'] = { type: 'buy_item', item: item.name, by: AppState.user.uid };
    
    await gameRef.update(updates);
    
    if (updates['status'] === 'finished') {
        await gameRef.update({ winner: AppState.user.uid });
    }
    
    alert(`Você comprou e usou: ${item.name}`);
    hideModal(UI.modalShop);
}

// ============================================================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    // Força o reset visual do Canvas e UI na montagem inicial
    switchScreen(UI.viewAuth);
});
