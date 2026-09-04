/* ==========================================================================
   HWEI: CARD GAME - MOTOR PRINCIPAL DE JOGO (SCRIPT.JS)
   ========================================================================== */
// 1. CONFIGURAÇÃO E INICIALIZAÇÃO DO FIREBASE
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

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.firestore();

// ==========================================================================
// ESTADO GLOBAL DO JOGO
// ==========================================================================
const GameState = {
    currentUser: null,
    matchId: null,
    isMyTurn: true,
    turnCount: 1,
    totalDamageDealt: 0,
    totalGoldEarned: 100,
    
    player: {
        name: "Hwei",
        hp: 100,
        maxHp: 100,
        gold: 100,
        rune: null,
        hand: [],
        board: [],
        inventory: [null, null, null, null], // 2 ativos, 2 passivos
        stats: { bonusAtk: 0, bonusHeal: 0, goldMult: 1.0 }
    },
    
    enemy: {
        name: "Invocador Sombrio",
        hp: 100,
        maxHp: 100,
        gold: 50,
        board: [],
        runes: ["colheita"]
    },

    canvas: {
        color: "#ff3333",
        brushSize: 5,
        isDrawing: false,
        strokesCount: 0,
        inkMix: [] // Historico de tintas usadas
    }
};

// ==========================================================================
// 2. BANCO DE DADOS DE RUNAS
// ==========================================================================
const RUNES_DATABASE = [
    {
        id: "cometa",
        name: "Cometa Arcano do Desastre",
        type: "Ofensiva",
        desc: "+15 Dano Adicional em todas as magias de Desastre e 10% de chance de crítico.",
        icon: "☄️",
        apply: (p) => { p.stats.bonusAtk += 15; }
    },
    {
        id: "conquistador",
        name: "Pincelada Implacável",
        type: "Combate",
        desc: "Cada carta jogada aumenta o ouro ganho no turno em +10 e cura 5 HP.",
        icon: "⚔️",
        apply: (p) => { p.stats.goldMult += 0.2; }
    },
    {
        id: "colheita",
        name: "Colheita de Tinta Sombria",
        type: "Execução",
        desc: "Causa 25 de dano extra a inimigos com menos de 50% de HP.",
        icon: "🩸",
        apply: (p) => { /* Aplicado em combate */ }
    },
    {
        id: "fluxo",
        name: "Serenidade Fluida",
        type: "Suporte",
        desc: "Restaura 10 HP ao início de cada turno e reduz o custo da Loja em 15%.",
        icon: "🌊",
        apply: (p) => { p.stats.bonusHeal += 10; }
    }
];

// ==========================================================================
// 3. GERADOR E BANCO DE DADOS DE 100 ITENS (LOJA)
// ==========================================================================
function generateShopItems() {
    const items = [];
    const rarities = [
        { key: "trash", name: "Lixo", color: "#7f8c8d", basePrice: 25, count: 20 },
        { key: "common", name: "Comum", color: "#2ecc71", basePrice: 75, count: 20 },
        { key: "rare", name: "Raro", color: "#3498db", basePrice: 200, count: 20 },
        { key: "epic", name: "Épico", color: "#9b59b6", basePrice: 450, count: 20 },
        { key: "legendary", name: "Lendário", color: "#f1c40f", basePrice: 900, count: 20 }
    ];

    const itemTemplates = {
        trash: [
            "Pincel Quebrado", "Tinta Seca", "Trapo Velho", "Frasco Rachado", "Botas Furadas",
            "Anel de Cobre", "Galho Seco", "Pergaminho Rasgado", "Moeda Enferrujada", "Semente Murcha",
            "Pedra Comum", "Lente Trincada", "Colher de Madeira", "Vela Apagada", "Restos de Tela",
            "Corda Gasta", "Osso Roído", "Dente de Monstro", "Escama Quebrada", "Pena Amassada"
        ],
        common: [
            "Pincel de Aprendiz", "Tinta Nanquim", "Sapatilhas de Couro", "Amuleto Simples", "Anel de Prata",
            "Escudo de Madeira", "Livro de Feitiços", "Poção de Vida", "Frasco de Mana", "Cristal de Quartzo",
            "Capa de Viagem", "Espada de Ferro", "Luva de Pano", "Cinto de Couro", "Adaga Curta",
            "Amuleto do Vento", "Lanterna Mágica", "Pergaminho de Fogo", "Pedra de Amolar", "Anel de Vida"
        ],
        rare: [
            "Pincel Rúnico", "Tinta do Desastre", "Botas do Mago", "Amuleto Arcano", "Lâmina Flamejante",
            "Escudo Prateado", "Grimório Tenebroso", "Elixir Vital", "Cristal Fluido", "Anel de Ouro Místico",
            "Manto da Invisibilidade", "Cetro da Tempestade", "Orb Solar", "Cajado do Silêncio", "Coroa de Espinhos",
            "Adaga Sombria", "Broche de Rubi", "Talismã do Caos", "Coração de Pedra", "Manopla Elemental"
        ],
        epic: [
            "Pincel Cósmico", "Tinta de Dragão", "Manto do Vazio", "Espada Celestial", "Escudo Dracônico",
            "Anel do Tempo", "Cetro da Ruína", "Elixir Imortal", "Cristal Espiritual", "Orb da Aniquilação",
            "Coroa Imperial", "Manopla Astral", "Botas de Mercúrio", "Coração da Tempestade", "Grimório Ancestral",
            "Espelho das Almas", "Broche Divino", "Lâmina Infernal", "Orbe Absoluto", "Amuleto do Destino"
        ],
        legendary: [
            "O Pincel do Criador", "Tinta Primordial de Hwei", "Apocalipse de Tinta", "Coroa do Rei Destruído",
            "Amuleto do Infinito", "Cetro de Valoran", "Escudo do Olimpo", "Anel da Imortabilidade", "Orb Divino",
            "Lâmina Cósmica", "Manto do Dragão Ancião", "Elixir do Deus Sol", "Grimório do Vazio Absolute",
            "Manopla do Titan", "Botas do Mapeador de Mundos", "Coração de Astaroth", "Esfera do Caos Primordial",
            "Espada da Criação", "Cetro do Caos", "Olho do Vazio Supremo"
        ]
    };

    let idCounter = 1;

    rarities.forEach(r => {
        const names = itemTemplates[r.key];
        names.forEach((name, idx) => {
            const isPassive = idx % 2 === 0;
            const powerMultiplier = (rarities.indexOf(r) + 1);
            items.push({
                id: idCounter++,
                name: name,
                rarity: r.key,
                rarityName: r.name,
                price: r.basePrice + (idx * 5 * powerMultiplier),
                type: isPassive ? "passive" : "active",
                stats: {
                    damage: 10 * powerMultiplier + (idx * 2),
                    heal: isPassive ? 5 * powerMultiplier : 15 * powerMultiplier,
                    goldBonus: 5 * powerMultiplier
                },
                desc: isPassive 
                    ? `Passiva: Concede +${10 * powerMultiplier + idx} de Dano de Magia e +${5 * powerMultiplier} Ouro por turno.`
                    : `Ativa: Restaura ${15 * powerMultiplier} HP e causa ${15 * powerMultiplier} de dano direto ao oponente.`,
                icon: isPassive ? "🛡️" : "⚔️"
            });
        });
    });

    return items;
}

const ITEMS_DATABASE = generateShopItems();

// ==========================================================================
// 4. INICIALIZAÇÃO DE EVENTOS E INTERFACE (DOM)
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initAuthEvents();
    initCanvasEngine();
    initShopUI();
    initRuneUI();
    initKeyboardShortcuts();
    initGameControls();
    
    // Tenta reproduzir música ao primeiro clique
    document.body.addEventListener("click", () => {
        const audio = document.getElementById("bg-music");
        if (audio && audio.paused) {
            audio.volume = 0.3;
            audio.play().catch(() => {});
        }
    }, { once: true });
});

// ==========================================================================
// 5. MÓDULO DE AUTENTICAÇÃO E LOBBY (FIREBASE)
// ==========================================================================
function initAuthEvents() {
    const viewLogin = document.getElementById("view-login");
    const viewRegister = document.getElementById("view-register");
    const viewLobby = document.getElementById("view-lobby");
    const clientViewport = document.getElementById("client-viewport");
    const gameViewport = document.getElementById("game-viewport");

    document.getElementById("link-to-register")?.addEventListener("click", (e) => {
        e.preventDefault();
        viewLogin.classList.add("hidden");
        viewRegister.classList.remove("hidden");
    });

    document.getElementById("link-to-login")?.addEventListener("click", (e) => {
        e.preventDefault();
        viewRegister.classList.add("hidden");
        viewLogin.classList.remove("hidden");
    });

    // Login Form
    document.getElementById("form-login")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;

        auth.signInWithEmailAndPassword(email, pass)
            .then(userCred => {
                showToast("Login realizado com sucesso!");
            })
            .catch(err => alert("Erro ao entrar: " + err.message));
    });

    // Register Form
    document.getElementById("form-register")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("reg-username").value;
        const email = document.getElementById("reg-email").value;
        const pass = document.getElementById("reg-password").value;

        auth.createUserWithEmailAndPassword(email, pass)
            .then(userCred => {
                return userCred.user.updateProfile({ displayName: username }).then(() => {
                    db.collection("users").doc(userCred.user.uid).set({
                        username: username,
                        email: email,
                        createdAt: new Date()
                    });
                });
            })
            .catch(err => alert("Erro ao criar conta: " + err.message));
    });

    // Logout
    document.getElementById("btn-logout")?.addEventListener("click", () => {
        auth.signOut();
    });

    // Matchmaking / Play Match
    document.getElementById("btn-play-match")?.addEventListener("click", () => {
        clientViewport.classList.add("hidden");
        document.getElementById("rune-modal").classList.add("active");
        document.getElementById("rune-modal").classList.remove("hidden");
    });

    // Firebase Auth State Observer
    auth.onAuthStateChanged(user => {
        if (user) {
            GameState.currentUser = user;
            GameState.player.name = user.displayName || "Hwei Invocador";
            document.getElementById("lobby-username").textContent = GameState.player.name;
            document.getElementById("player-name").textContent = GameState.player.name;
            
            viewLogin.classList.add("hidden");
            viewRegister.classList.add("hidden");
            viewLobby.classList.remove("hidden");
        } else {
            GameState.currentUser = null;
            viewLobby.classList.add("hidden");
            clientViewport.classList.remove("hidden");
            viewLogin.classList.remove("hidden");
            gameViewport.classList.add("hidden");
        }
    });
}

// ==========================================================================
// 6. SISTEMA DE SELEÇÃO DE RUNAS
// ==========================================================================
function initRuneUI() {
    const grid = document.getElementById("rune-selection-grid");
    if (!grid) return;
    grid.innerHTML = "";

    RUNES_DATABASE.forEach(rune => {
        const card = document.createElement("div");
        card.className = "rune-card panel-glass";
        card.style.cssText = "padding: 15px; margin: 10px; cursor: pointer; border: 2px solid transparent; text-align: center; border-radius: 8px; transition: 0.3s;";
        card.innerHTML = `
            <div style="font-size: 2.5rem;">${rune.icon}</div>
            <h3 style="color: var(--gold-primary); margin: 5px 0;">${rune.name}</h3>
            <p style="font-size: 0.85rem; color: #ccc;">${rune.desc}</p>
        `;

        card.addEventListener("click", () => {
            document.querySelectorAll(".rune-card").forEach(c => c.style.borderColor = "transparent");
            card.style.borderColor = "var(--gold-primary)";
            GameState.player.rune = rune;
        });

        grid.appendChild(card);
    });

    document.getElementById("btn-confirm-runes")?.addEventListener("click", () => {
        if (!GameState.player.rune) {
            GameState.player.rune = RUNES_DATABASE[0]; // Padrão
        }
        
        // Aplica efeitos da runa
        GameState.player.rune.apply(GameState.player);
        
        // Transiciona para o jogo
        document.getElementById("rune-modal").classList.remove("active");
        document.getElementById("rune-modal").classList.add("hidden");
        document.getElementById("game-viewport").classList.remove("hidden");

        updateHUD();
        startBattle();
    });
}

// ==========================================================================
// 7. MOTOR DE DESENHO (CANVAS & MATERIALIZAÇÃO DAS CARTAS DO HWEI)
// ==========================================================================
function initCanvasEngine() {
    const canvas = document.getElementById("magic-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    
    // Ajusta resolução do Canvas interno
    canvas.width = 400;
    canvas.height = 250;

    const sizeInput = document.getElementById("brush-size");
    if (sizeInput) {
        sizeInput.addEventListener("input", (e) => {
            GameState.canvas.brushSize = e.target.value;
        });
    }

    // Seleção de Cores de Tintas (Desastre, Serenidade, Tormento)
    document.querySelectorAll(".ink-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const color = btn.getAttribute("data-color");
            GameState.canvas.color = color;
            
            const orb = document.getElementById("active-mixture-display");
            if (orb) orb.style.backgroundColor = color;
            
            const label = document.getElementById("mixture-name");
            if (label) {
                if (color === "#ff3333") label.textContent = "Assunto: Desastre (QQ/QW/QE)";
                else if (color === "#33ccff") label.textContent = "Assunto: Serenidade (WQ/WW/WE)";
                else if (color === "#9933ff") label.textContent = "Assunto: Tormento (EQ/EW/EE)";
            }

            GameState.canvas.inkMix.push(color);
            updateSpellPrediction();
        });
    });

    // Limpar Canvas
    document.getElementById("btn-clear-canvas")?.addEventListener("click", clearCanvas);

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        GameState.canvas.strokesCount = 0;
        GameState.canvas.inkMix = [];
        updateSpellPrediction();
    }

    // Eventos de Pincel (Mouse e Touch)
    function startDrawing(e) {
        GameState.canvas.isDrawing = true;
        GameState.canvas.strokesCount++;
        draw(e);
    }

    function stopDrawing() {
        GameState.canvas.isDrawing = false;
        ctx.beginPath();
        updateSpellPrediction();
    }

    function draw(e) {
        if (!GameState.canvas.isDrawing) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineWidth = GameState.canvas.brushSize;
        ctx.lineCap = "round";
        ctx.strokeStyle = GameState.canvas.color;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseleave", stopDrawing);

    canvas.addEventListener("touchstart", (e) => { e.preventDefault(); startDrawing(e); });
    canvas.addEventListener("touchmove", (e) => { e.preventDefault(); draw(e); });
    canvas.addEventListener("touchend", stopDrawing);

    // Botão Materializar Carta
    document.getElementById("btn-materialize-card")?.addEventListener("click", () => {
        if (GameState.canvas.strokesCount === 0) {
            showToast("Desenhe uma forma na tela primeiro!");
            return;
        }

        materializeCard();
        clearCanvas();
    });
}

function updateSpellPrediction() {
    const preview = document.getElementById("spell-prediction");
    const shapeLabel = document.getElementById("detected-shape");
    if (!preview || !shapeLabel) return;

    if (GameState.canvas.strokesCount === 0) {
        preview.classList.add("hidden");
        return;
    }

    preview.classList.remove("hidden");
    const lastColor = GameState.canvas.color;

    if (lastColor === "#ff3333") shapeLabel.textContent = "Chama Devastadora (Ataque de Área)";
    else if (lastColor === "#33ccff") shapeLabel.textContent = "Escudo Fluido (Defesa & Cura)";
    else shapeLabel.textContent = "Olho do Tormento (Dano e Roubo de Vida)";
}

function materializeCard() {
    if (GameState.player.hand.length >= 6) {
        showToast("Sua mão está cheia (Máximo 6 cartas)!");
        return;
    }

    const color = GameState.canvas.color;
    let cardData = {};

    if (color === "#ff3333") {
        // Carta de Desastre
        cardData = {
            id: Date.now(),
            name: "Devastação Calcinante",
            type: "desastre",
            cost: 2,
            damage: 25 + GameState.player.stats.bonusAtk,
            heal: 0,
            color: "#ff3333",
            desc: "Causa dano direto devastador ao oponente."
        };
    } else if (color === "#33ccff") {
        // Carta de Serenidade
        cardData = {
            id: Date.now(),
            name: "Piscina Protetora",
            type: "serenidade",
            cost: 1,
            damage: 5,
            heal: 20 + GameState.player.stats.bonusHeal,
            color: "#33ccff",
            desc: "Restaura vida e concede proteção mística."
        };
    } else {
        // Carta de Tormento
        cardData = {
            id: Date.now(),
            name: "Garras do Tormento",
            type: "tormento",
            cost: 3,
            damage: 35 + GameState.player.stats.bonusAtk,
            heal: 10,
            color: "#9933ff",
            desc: "Drena a vida do oponente e aplica pavor."
        };
    }

    GameState.player.hand.push(cardData);
    renderPlayerHand();
    showToast(`Carta "${cardData.name}" Materializada!`);
}

function renderPlayerHand() {
    const handContainer = document.getElementById("player-hand");
    if (!handContainer) return;
    handContainer.innerHTML = "";

    GameState.player.hand.forEach((card, index) => {
        const cardEl = document.createElement("div");
        cardEl.className = "card-item panel-glass";
        cardEl.style.cssText = `
            width: 110px;
            height: 150px;
            border: 2px solid ${card.color};
            border-radius: 8px;
            padding: 8px;
            margin: 0 5px;
            display: inline-flex;
            flex-direction: column;
            justify-content: space-between;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
            background: rgba(10, 15, 25, 0.85);
        `;

        cardEl.innerHTML = `
            <div style="font-size: 0.75rem; font-weight: bold; color: ${card.color}">${card.name}</div>
            <div style="font-size: 0.7rem; color: #aaa;">${card.desc}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: bold;">
                <span style="color: #ff5555">⚔️ ${card.damage}</span>
                <span style="color: #55ff55">💚 ${card.heal}</span>
            </div>
        `;

        cardEl.addEventListener("mouseenter", () => { cardEl.style.transform = "translateY(-15px) scale(1.05)"; });
        cardEl.addEventListener("mouseleave", () => { cardEl.style.transform = "none"; });

        // Jogar Carta ao clicar
        cardEl.addEventListener("click", () => {
            playCard(index);
        });

        handContainer.appendChild(cardEl);
    });
}

function playCard(index) {
    if (!GameState.isMyTurn) {
        showToast("Aguarde seu turno!");
        return;
    }

    const card = GameState.player.hand.splice(index, 1)[0];
    if (!card) return;

    // Aplica Efeitos da Carta
    if (card.damage > 0) {
        let finalDamage = card.damage;
        if (GameState.enemy.hp < 50 && GameState.player.rune?.id === "colheita") {
            finalDamage += 25; // Runa Colheita
        }
        GameState.enemy.hp = Math.max(0, GameState.enemy.hp - finalDamage);
        GameState.totalDamageDealt += finalDamage;
    }

    if (card.heal > 0) {
        GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + card.heal);
    }

    // Animação de envio ao tabuleiro
    const boardContainer = document.getElementById("player-board-cards");
    if (boardContainer) {
        const playedCard = document.createElement("div");
        playedCard.className = "played-card-effect";
        playedCard.style.cssText = `padding: 5px 10px; background: ${card.color}; color: #fff; border-radius: 4px; margin: 3px; font-weight: bold; animation: fadeIn 0.3s;`;
        playedCard.textContent = `${card.name} (-${card.damage} HP / +${card.heal} HP)`;
        boardContainer.appendChild(playedCard);
        setTimeout(() => playedCard.remove(), 2500);
    }

    updateHUD();
    checkEndGame();
}

// ==========================================================================
// 8. GERENCIAMENTO DA LOJA DE ITENS (BAZAR - 100 ITENS)
// ==========================================================================
function initShopUI() {
    const shopModal = document.getElementById("shop-modal");
    const btnOpen = document.getElementById("btn-open-shop");
    const btnClose = document.getElementById("btn-close-shop");
    const grid = document.getElementById("shop-items-grid");

    btnOpen?.addEventListener("click", () => {
        shopModal.classList.remove("hidden");
        shopModal.classList.add("active");
        renderShopItems("all");
    });

    btnClose?.addEventListener("click", () => {
        shopModal.classList.add("hidden");
        shopModal.classList.remove("active");
    });

    // Abas de Raridade
    document.querySelectorAll(".shop-tabs .tab-btn").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".shop-tabs .tab-btn").forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            const rarity = e.target.getAttribute("data-rarity");
            renderShopItems(rarity);
        });
    });
}

function renderShopItems(filterRarity = "all") {
    const grid = document.getElementById("shop-items-grid");
    const goldDisplay = document.getElementById("shop-player-gold");
    if (!grid) return;

    if (goldDisplay) goldDisplay.textContent = GameState.player.gold;

    grid.innerHTML = "";
    grid.style.cssText = "display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; max-height: 60vh; overflow-y: auto; padding: 10px;";

    const filtered = filterRarity === "all" 
        ? ITEMS_DATABASE 
        : ITEMS_DATABASE.filter(item => item.rarity === filterRarity);

    filtered.forEach(item => {
        const itemCard = document.createElement("div");
        itemCard.className = `shop-item-card panel-glass rarity-${item.rarity}`;
        itemCard.style.cssText = `
            padding: 12px;
            border-radius: 6px;
            border: 1px solid var(--glass-border);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: rgba(15, 20, 30, 0.8);
        `;

        itemCard.innerHTML = `
            <div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 1.5rem;">${item.icon}</span>
                    <span style="font-size: 0.75rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.1);">${item.rarityName}</span>
                </div>
                <h4 style="color: var(--gold-primary); margin: 6px 0; font-size: 0.95rem;">${item.name}</h4>
                <p style="font-size: 0.75rem; color: #bbb; line-height: 1.2;">${item.desc}</p>
            </div>
            <div style="margin-top: 10px;">
                <button class="btn-primary full-width btn-buy-item" style="padding: 6px; font-size: 0.85rem;">
                    Comprar 🪙 ${item.price}
                </button>
            </div>
        `;

        itemCard.querySelector(".btn-buy-item").addEventListener("click", () => {
            buyItem(item);
        });

        grid.appendChild(itemCard);
    });
}

function buyItem(item) {
    if (GameState.player.gold < item.price) {
        showToast("Ouro insuficiente!");
        return;
    }

    // Encontra slot livre no inventário (4 slots max)
    const freeSlotIndex = GameState.player.inventory.findIndex(slot => slot === null);
    if (freeSlotIndex === -1) {
        showToast("Inventário Cheio (Máximo 4 Itens)!");
        return;
    }

    GameState.player.gold -= item.price;
    GameState.player.inventory[freeSlotIndex] = item;

    // Aplica Bônus do Item se Passivo
    if (item.type === "passive") {
        GameState.player.stats.bonusAtk += item.stats.damage;
        GameState.player.maxHp += 10;
        GameState.player.hp += 10;
    }

    showToast(`Comprado: ${item.name}!`);
    renderShopItems(document.querySelector(".shop-tabs .tab-btn.active")?.getAttribute("data-rarity") || "all");
    updateHUD();
    renderInventorySlots();
}

function renderInventorySlots() {
    const slots = document.querySelectorAll("#player-inventory .item-slot");
    slots.forEach((slotEl, idx) => {
        const item = GameState.player.inventory[idx];
        if (item) {
            slotEl.innerHTML = `<span style="font-size: 1.2rem;" title="${item.name}: ${item.desc}">${item.icon}</span>`;
            slotEl.style.border = "1px solid var(--gold-primary)";
            
            // Permite usar item se for do tipo ativo
            slotEl.onclick = () => {
                if (item.type === "active" && GameState.isMyTurn) {
                    useActiveItem(idx, item);
                }
            };
        } else {
            slotEl.innerHTML = "";
            slotEl.style.border = "1px dashed var(--text-muted)";
            slotEl.onclick = null;
        }
    });
}

function useActiveItem(index, item) {
    GameState.enemy.hp = Math.max(0, GameState.enemy.hp - item.stats.damage);
    GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + item.stats.heal);
    
    showToast(`Usou ${item.name}! -${item.stats.damage} HP no inimigo / +${item.stats.heal} Cura`);
    
    // Consome o item ativo
    GameState.player.inventory[index] = null;
    renderInventorySlots();
    updateHUD();
    checkEndGame();
}

// ==========================================================================
// 9. CONTROLE DE TURNOS, IA DO OPONENTE E LOOP DE COMBATE
// ==========================================================================
function startBattle() {
    GameState.player.hp = 100;
    GameState.enemy.hp = 100;
    GameState.player.gold = 100;
    GameState.turnCount = 1;
    GameState.isMyTurn = true;

    updateHUD();
    renderInventorySlots();
    showToast("A Batalha Começou! Desenhe suas cartas.");
}

function initGameControls() {
    document.getElementById("btn-end-turn")?.addEventListener("click", () => {
        if (!GameState.isMyTurn) return;
        endTurn();
    });

    document.getElementById("btn-restart")?.addEventListener("click", () => {
        document.getElementById("death-modal").classList.add("hidden");
        document.getElementById("death-modal").classList.remove("active");
        startBattle();
    });
}

function endTurn() {
    GameState.isMyTurn = false;
    document.getElementById("turn-indicator").textContent = "Turno do Oponente";
    document.getElementById("turn-indicator").style.color = "#ff4444";

    // Executa Efeitos de Fim de Turno
    if (GameState.player.rune?.id === "fluxo") {
        GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + 10);
    }

    showToast("Turno Encerrado. Oponente pensando...");

    // Turno da IA Oponente
    setTimeout(() => {
        executeEnemyTurn();
    }, 1500);
}

function executeEnemyTurn() {
    const enemyDamage = Math.floor(Math.random() * 20) + 10;
    GameState.player.hp = Math.max(0, GameState.player.hp - enemyDamage);

    showToast(`Oponente atacou e causou ${enemyDamage} de dano!`);

    // Inicia Próximo Turno do Jogador
    GameState.turnCount++;
    GameState.isMyTurn = true;
    
    // Renda por Turno
    const earnedGold = Math.floor(25 * GameState.player.stats.goldMult);
    GameState.player.gold += earnedGold;
    GameState.totalGoldEarned += earnedGold;

    document.getElementById("turn-indicator").textContent = "Seu Turno";
    document.getElementById("turn-indicator").style.color = "var(--gold-primary)";

    updateHUD();
    checkEndGame();
}

// ==========================================================================
// 10. ATUALIZAÇÃO DA INTERFACE (HUD) E TELA DE FIM DE JOGO
// ==========================================================================
function updateHUD() {
    // Player Vitals
    const playerHpBar = document.getElementById("player-hp-bar");
    const playerHpText = document.getElementById("player-hp-text");
    const playerGold = document.getElementById("player-gold");

    if (playerHpBar) playerHpBar.style.width = `${(GameState.player.hp / GameState.player.maxHp) * 100}%`;
    if (playerHpText) playerHpText.textContent = `${GameState.player.hp} / ${GameState.player.maxHp}`;
    if (playerGold) playerGold.textContent = GameState.player.gold;

    // Enemy Vitals
    const enemyHpBar = document.getElementById("enemy-hp-bar");
    const enemyHpText = document.getElementById("enemy-hp-text");
    const enemyGold = document.getElementById("enemy-gold");

    if (enemyHpBar) enemyHpBar.style.width = `${(GameState.enemy.hp / GameState.enemy.maxHp) * 100}%`;
    if (enemyHpText) enemyHpText.textContent = `${GameState.enemy.hp} / ${GameState.enemy.maxHp}`;
    if (enemyGold) enemyGold.textContent = GameState.enemy.gold;
}

function checkEndGame() {
    if (GameState.player.hp <= 0 || GameState.enemy.hp <= 0) {
        const deathModal = document.getElementById("death-modal");
        const title = document.getElementById("endgame-status-title");
        const subtitle = document.getElementById("endgame-status-subtitle");

        if (GameState.player.hp <= 0) {
            title.textContent = "VOCÊ FOI DERROTADO";
            title.style.color = "#ff3333";
            subtitle.textContent = "Sua arte sucumbiu às sombras.";
        } else {
            title.textContent = "VITÓRIA MAGNÍFICA";
            title.style.color = "var(--gold-primary)";
            subtitle.textContent = "Sua visão artística prevaleceu no campo de batalha!";
        }

        document.getElementById("stat-turns").textContent = GameState.turnCount;
        document.getElementById("stat-damage").textContent = GameState.totalDamageDealt;
        document.getElementById("stat-gold").textContent = GameState.totalGoldEarned;

        deathModal.classList.remove("hidden");
        deathModal.classList.add("active");
    }
}

// ==========================================================================
// 11. TECLAS DE ATALHO (DESKTOP) E UTILITÁRIOS
// ==========================================================================
function initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

        // 'P' - Abrir/Fechar Loja
        if (e.key.toLowerCase() === "p") {
            const shopModal = document.getElementById("shop-modal");
            if (shopModal.classList.contains("hidden")) {
                shopModal.classList.remove("hidden");
                shopModal.classList.add("active");
                renderShopItems("all");
            } else {
                shopModal.classList.add("hidden");
                shopModal.classList.remove("active");
            }
        }

        // 'Espaço' - Passar Turno
        if (e.code === "Space") {
            e.preventDefault();
            if (GameState.isMyTurn) endTurn();
        }

        // 'C' - Limpar Canvas
        if (e.key.toLowerCase() === "c") {
            document.getElementById("btn-clear-canvas")?.click();
        }
    });
}

function showToast(message) {
    let toast = document.getElementById("game-toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "game-toast";
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(12, 16, 24, 0.95);
            border: 1px solid var(--gold-primary);
            color: var(--gold-light);
            padding: 12px 20px;
            border-radius: 6px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.8);
            z-index: 9999;
            font-family: 'Cinzel', serif;
            transition: opacity 0.3s;
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = "1";

    setTimeout(() => {
        toast.style.opacity = "0";
    }, 2500);
}
