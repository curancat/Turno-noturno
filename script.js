/* ==========================================================================
   HWEI: CARD GAME - MOTOR PRINCIPAL DE JOGO (SCRIPT.JS)
   ========================================================================== */
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
// BANCO DE DADOS DAS 11 HABILIDADES DE HWEI (ASSUNTOS Q, W, E, R + PASSIVA)
// ==========================================================================
const HWEI_SPELLS = {
    // PASSIVA: Assustando o Visionário
    "PASSIVA": { name: "Visão Progressiva", type: "passiva", desc: "Acumula cargas ao conjurar feitiços, causando dano explosivo adicional.", damage: 15, heal: 0, color: "#d4af37" },
    
    // ASSUNTO Q (DESASTRE)
    "QQ": { name: "Fagulha Devastadora", type: "desastre", desc: "Q+Q: Chama concentrada de dano puro.", damage: 30, heal: 0, color: "#ff3333", minLevel: 1, image: "" },
    "QW": { name: "Trovão Cataclísmico", type: "desastre", desc: "Q+W: Raio elemental cortante.", damage: 40, heal: 0, color: "#ff5533", minLevel: 5, image: "" },
    "QE": { name: "Erupção Magmática", type: "desastre", desc: "Q+E: Fissura flamejante em área.", damage: 55, heal: 0, color: "#ff1111", minLevel: 10, image: "" },

    // ASSUNTO W (SERENIDADE)
    "WQ": { name: "Correnteza Protetora", type: "serenidade", desc: "W+Q: Concede escudo e regeneração rápida.", damage: 5, heal: 25, color: "#33ccff", minLevel: 1, image: "" },
    "WW": { name: "Poça da Refugiada", type: "serenidade", desc: "W+W: Aura calmante de cura profunda.", damage: 0, heal: 40, color: "#3399ff", minLevel: 8, image: "" },
    "WE": { name: "Manto de Íris", type: "serenidade", desc: "W+E: Concede vigor e bônus de ouro.", damage: 10, heal: 20, color: "#33ffee", minLevel: 15, image: "" },

    // ASSUNTO E (TORMENTO)
    "EQ": { name: "Olho do Pavor", type: "tormento", desc: "E+Q: Causa pavor e drena vida.", damage: 25, heal: 15, color: "#9933ff", minLevel: 1, image: "" },
    "EW": { name: "Abismo Fétido", type: "tormento", desc: "E+W: Zona de aprisionamento e dano contínuo.", damage: 35, heal: 5, color: "#7722ff", minLevel: 12, image: "" },
    "EE": { name: "Mão Esmagadora", type: "tormento", desc: "E+E: Esmaga o oponente com forças do abismo.", damage: 50, heal: 0, color: "#aa11ff", minLevel: 18, image: "" },

    // ASSUNTO R (SUPREMO - Muda baseado na última tinta usada)
    "R": { name: "Cataclismo de Hwei", type: "supremo", desc: "R: Eclosão apocalíptica que corrói o oponente.", damage: 70, heal: 20, color: "#ff00ff", minLevel: 20, image: "" }
};

// ==========================================================================
// ESTADO GLOBAL DO JOGO
// ==========================================================================
const GameState = {
    currentUser: null,
    isMyTurn: true,
    turnCount: 1,
    totalDamageDealt: 0,
    totalGoldEarned: 100,
    
    player: {
        name: "Hwei",
        hp: 100,
        maxHp: 100,
        gold: 100,
        level: 1,
        xp: 0,
        rune: null,
        hand: [],
        board: [],
        inventory: [null, null, null, null],
        stats: { bonusAtk: 0, bonusHeal: 0, goldMult: 1.0 }
    },
    
    enemy: {
        name: "Invocador Sombrio",
        hp: 100,
        maxHp: 100,
        gold: 50,
        board: []
    },

    canvas: {
        brushSize: 6,
        isDrawing: false,
        strokesCount: 0,
        inkMix: [] // Armazena sequência exata (ex: ['Q', 'Q'], ['W', 'E'])
    }
};

// ==========================================================================
// BANCO DE RUNAS
// ==========================================================================
const RUNES_DATABASE = [
    {
        id: "cometa",
        name: "Cometa Arcano",
        desc: "+15 Dano Adicional em todas as magias elementais.",
        icon: "☄️",
        apply: (p) => { p.stats.bonusAtk += 15; }
    },
    {
        id: "conquistador",
        name: "Pincelada Implacável",
        desc: "Cada carta jogada aumenta o ouro ganho por turno em +20%.",
        icon: "⚔️",
        apply: (p) => { p.stats.goldMult += 0.2; }
    },
    {
        id: "fluxo",
        name: "Serenidade Fluida",
        desc: "Restaura 12 HP ao início de cada turno e aumenta a cura recebida.",
        icon: "🌊",
        apply: (p) => { p.stats.bonusHeal += 12; }
    }
];

// ==========================================================================
// GERADOR DE 100 ITENS (LOJA)
// ==========================================================================
function generateShopItems() {
    const items = [];
    const rarities = [
        { key: "trash", name: "Lixo", basePrice: 25 },
        { key: "common", name: "Comum", basePrice: 75 },
        { key: "rare", name: "Raro", basePrice: 200 },
        { key: "epic", name: "Épico", basePrice: 450 },
        { key: "legendary", name: "Lendário", basePrice: 900 }
    ];

    const templates = {
        trash: ["Pincel Quebrado", "Tinta Seca", "Trapo Velho", "Frasco Rachado", "Botas Furadas"],
        common: ["Pincel de Aprendiz", "Tinta Nanquim", "Sapatilhas de Couro", "Amuleto Simples", "Anel de Prata"],
        rare: ["Pincel Rúnico", "Tinta do Desastre", "Botas do Mago", "Amuleto Arcano", "Lâmina Flamejante"],
        epic: ["Pincel Cósmico", "Tinta de Dragão", "Manto do Vazio", "Espada Celestial", "Escudo Dracônico"],
        legendary: ["O Pincel do Criador", "Tinta Primordial", "Apocalipse", "Coroa do Rei", "Infinito"]
    };

    let idCounter = 1;
    rarities.forEach(r => {
        for (let i = 0; i < 20; i++) {
            const nameBase = templates[r.key][i % templates[r.key].length];
            const name = `${nameBase} #${i + 1}`;
            const isPassive = i % 2 === 0;
            const mult = rarities.indexOf(r) + 1;

            items.push({
                id: idCounter++,
                name: name,
                rarity: r.key,
                rarityName: r.name,
                price: r.basePrice + (i * 3 * mult),
                type: isPassive ? "passive" : "active",
                stats: { damage: 8 * mult + i, heal: 10 * mult },
                desc: isPassive ? `Passiva: +${8 * mult} Dano` : `Ativa: Restaura ${10 * mult} HP`,
                icon: isPassive ? "🛡️" : "⚔️"
            });
        }
    });
    return items;
}
const ITEMS_DATABASE = generateShopItems();

// ==========================================================================
// INICIALIZAÇÃO GERAL
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
    initAuthEvents();
    initCanvasEngine();
    initShopUI();
    initRuneUI();
    initKeyboardShortcuts();
    initGameControls();

    document.body.addEventListener("click", () => {
        const audio = document.getElementById("bg-music");
        if (audio && audio.paused) {
            audio.volume = 0.25;
            audio.play().catch(() => {});
        }
    }, { once: true });
});

// ==========================================================================
// AUTENTICAÇÃO E LOBBY
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

    document.getElementById("form-login")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value;
        const pass = document.getElementById("login-password").value;
        auth.signInWithEmailAndPassword(email, pass)
            .then(() => showToast("Bem-vindo de volta ao Grimório!"))
            .catch(err => alert("Erro ao entrar: " + err.message));
    });

    document.getElementById("form-register")?.addEventListener("submit", (e) => {
        e.preventDefault();
        const username = document.getElementById("reg-username").value;
        const email = document.getElementById("reg-email").value;
        const pass = document.getElementById("reg-password").value;

        auth.createUserWithEmailAndPassword(email, pass)
            .then(userCred => {
                return userCred.user.updateProfile({ displayName: username }).then(() => {
                    db.collection("users").doc(userCred.user.uid).set({ username, email, level: 1, xp: 0 });
                });
            })
            .catch(err => alert("Erro ao criar conta: " + err.message));
    });

    document.getElementById("btn-logout")?.addEventListener("click", () => auth.signOut());

    document.getElementById("btn-play-match")?.addEventListener("click", () => {
        clientViewport.classList.add("hidden");
        document.getElementById("rune-modal").classList.remove("hidden");
        document.getElementById("rune-modal").classList.add("active");
    });

    auth.onAuthStateChanged(user => {
        if (user) {
            GameState.currentUser = user;
            GameState.player.name = user.displayName || "Hwei Mestre";
            document.getElementById("lobby-username").textContent = GameState.player.name;
            document.getElementById("player-name").textContent = GameState.player.name;
            
            viewLogin.classList.add("hidden");
            viewRegister.classList.add("hidden");
            viewLobby.classList.remove("hidden");
        } else {
            viewLobby.classList.add("hidden");
            clientViewport.classList.remove("hidden");
            viewLogin.classList.remove("hidden");
            gameViewport.classList.add("hidden");
        }
    });
}

// ==========================================================================
// SELEÇÃO DE RUNAS
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
            <div style="font-size: 2.2rem;">${rune.icon}</div>
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
        if (!GameState.player.rune) GameState.player.rune = RUNES_DATABASE[0];
        GameState.player.rune.apply(GameState.player);
        
        document.getElementById("rune-modal").classList.add("hidden");
        document.getElementById("game-viewport").classList.remove("hidden");

        updateHUD();
        startBattle();
    });
}

// ==========================================================================
// MOTOR DE DESENHO E COMBINAÇÕES DE HWEI (11 MAGIAS)
// ==========================================================================
function initCanvasEngine() {
    const canvas = document.getElementById("magic-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    canvas.width = 400;
    canvas.height = 250;

    const sizeInput = document.getElementById("brush-size");
    if (sizeInput) {
        sizeInput.addEventListener("input", (e) => { GameState.canvas.brushSize = e.target.value; });
    }

    // Botões de Assuntos de Tinta (Q, W, E, R)
    document.querySelectorAll(".ink-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const subject = btn.getAttribute("data-subject");
            GameState.canvas.inkMix.push(subject);
            
            updateMixtureDisplay();
            updateSpellPrediction();
        });
    });

    document.getElementById("btn-clear-canvas")?.addEventListener("click", clearCanvas);

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        GameState.canvas.strokesCount = 0;
        GameState.canvas.inkMix = [];
        updateMixtureDisplay();
        updateSpellPrediction();
    }

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
        ctx.strokeStyle = GameState.canvas.inkMix.length > 0 ? getInkColor(GameState.canvas.inkMix[GameState.canvas.inkMix.length - 1]) : "#d4af37";

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

    document.getElementById("btn-materialize-card")?.addEventListener("click", () => {
        if (GameState.canvas.inkMix.length === 0 && GameState.canvas.strokesCount === 0) {
            showToast("Selecione tintas (Q, W, E, R) ou desenhe no canvas!");
            return;
        }
        materializeSpellCard();
        clearCanvas();
    });
}

function getInkColor(subject) {
    if (subject === "Q") return "#ff3333";
    if (subject === "W") return "#33ccff";
    if (subject === "E") return "#9933ff";
    if (subject === "R") return "#ff00ff";
    return "#d4af37";
}

function updateMixtureDisplay() {
    const orb = document.getElementById("active-mixture-display");
    const label = document.getElementById("mixture-name");
    const mixStr = GameState.canvas.inkMix.join("");

    if (!orb || !label) return;

    if (GameState.canvas.inkMix.length === 0) {
        orb.style.backgroundColor = "#222";
        label.textContent = "Nenhuma tinta selecionada";
        return;
    }

    const lastSubject = GameState.canvas.inkMix[GameState.canvas.inkMix.length - 1];
    orb.style.backgroundColor = getInkColor(lastSubject);
    label.textContent = `Mistura: [ ${mixStr} ]`;
}

function getResolvedSpellKey() {
    const mix = GameState.canvas.inkMix.join("");
    if (mix.startsWith("R")) return "R";
    if (HWEI_SPELLS[mix]) return mix;
    
    // Fallback inteligente para mesclas customizadas longas
    if (mix.length >= 2) {
        return mix.substring(0, 2);
    }
    return "QQ";
}

function updateSpellPrediction() {
    const detectedLabel = document.getElementById("detected-shape");
    if (!detectedLabel) return;

    if (GameState.canvas.inkMix.length === 0) {
        detectedLabel.textContent = "Nenhuma";
        return;
    }

    const spellKey = getResolvedSpellKey();
    const spell = HWEI_SPELLS[spellKey] || HWEI_SPELLS["QQ"];
    detectedLabel.textContent = spell.name;
}

function materializeSpellCard() {
    if (GameState.player.hand.length >= 6) {
        showToast("Mão cheia! (Máximo 6 cartas)");
        return;
    }

    const spellKey = getResolvedSpellKey();
    const spellData = HWEI_SPELLS[spellKey] || HWEI_SPELLS["QQ"];

    // Verificação de Nível para Magias Avançadas (Nível 20 exigido para Ultimates/Avançadas)
    if (spellData.minLevel && GameState.player.level < spellData.minLevel) {
        showToast(`Requer Nível ${spellData.minLevel} para conjurar ${spellData.name}!`);
        return;
    }

    const card = {
        id: Date.now(),
        name: spellData.name,
        type: spellData.type,
        damage: spellData.damage + GameState.player.stats.bonusAtk,
        heal: spellData.heal + GameState.player.stats.bonusHeal,
        color: spellData.color,
        desc: spellData.desc,
        image: spellData.image // Espaço opcional para foto real das skills do Hwei
    };

    GameState.player.hand.push(card);
    renderPlayerHand();
    showToast(`Magia Materializada: ${card.name}!`);
    gainXP(15);
}

// ==========================================================================
// RENDERIZAÇÃO DA MÃO E COMBATE
// ==========================================================================
function renderPlayerHand() {
    const handContainer = document.getElementById("player-hand");
    if (!handContainer) return;
    handContainer.innerHTML = "";

    GameState.player.hand.forEach((card, index) => {
        const cardEl = document.createElement("div");
        cardEl.className = "game-card panel-glass";
        cardEl.style.borderColor = card.color;
        
        cardEl.innerHTML = `
            <div style="font-size: 0.75rem; font-weight: bold; color: ${card.color}">${card.name}</div>
            <div style="font-size: 0.68rem; color: #ccc; line-height: 1.1;">${card.desc}</div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: bold;">
                <span style="color: #ff5555">⚔️ ${card.damage}</span>
                <span style="color: #55ff55">💚 ${card.heal}</span>
            </div>
        `;

        cardEl.addEventListener("click", () => playCard(index));
        handContainer.appendChild(cardEl);
    });
}

function playCard(index) {
    if (!GameState.isMyTurn) {
        showToast("Aguarde o seu turno!");
        return;
    }

    const card = GameState.player.hand.splice(index, 1)[0];
    if (!card) return;

    if (card.damage > 0) {
        GameState.enemy.hp = Math.max(0, GameState.enemy.hp - card.damage);
        GameState.totalDamageDealt += card.damage;
    }
    if (card.heal > 0) {
        GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + card.heal);
    }

    updateHUD();
    renderPlayerHand();
    checkEndGame();
}

// ==========================================================================
// SISTEMA DE LOJA E INVENTÁRIO
// ==========================================================================
function initShopUI() {
    const shopModal = document.getElementById("shop-modal");
    document.getElementById("btn-open-shop")?.addEventListener("click", () => {
        shopModal.classList.remove("hidden");
        renderShopItems("all");
    });
    document.getElementById("btn-close-shop")?.addEventListener("click", () => {
        shopModal.classList.add("hidden");
    });

    document.querySelectorAll(".shop-tabs .tab-btn").forEach(tab => {
        tab.addEventListener("click", (e) => {
            document.querySelectorAll(".shop-tabs .tab-btn").forEach(t => t.classList.remove("active"));
            e.target.classList.add("active");
            renderShopItems(e.target.getAttribute("data-rarity"));
        });
    });
}

function renderShopItems(filterRarity) {
    const grid = document.getElementById("shop-items-grid");
    document.getElementById("shop-player-gold").textContent = GameState.player.gold;
    if (!grid) return;
    grid.innerHTML = "";

    const filtered = filterRarity === "all" ? ITEMS_DATABASE : ITEMS_DATABASE.filter(i => i.rarity === filterRarity);

    filtered.forEach(item => {
        const itemCard = document.createElement("div");
        itemCard.className = "panel-glass";
        itemCard.style.cssText = "padding: 10px; border-radius: 6px; display: flex; flex-direction: column; justify-content: space-between;";
        itemCard.innerHTML = `
            <div>
                <div style="font-size: 1.2rem;">${item.icon} <span style="font-size: 0.8rem; color: var(--gold-primary)">${item.name}</span></div>
                <p style="font-size: 0.72rem; color: #aaa; margin: 5px 0;">${item.desc}</p>
            </div>
            <button class="btn-primary full-width" style="padding: 5px; font-size: 0.8rem;">Comprar 🪙 ${item.price}</button>
        `;
        itemCard.querySelector("button").addEventListener("click", () => buyItem(item));
        grid.appendChild(itemCard);
    });
}

function buyItem(item) {
    if (GameState.player.gold < item.price) {
        showToast("Ouro insuficiente!");
        return;
    }
    const freeSlot = GameState.player.inventory.findIndex(s => s === null);
    if (freeSlot === -1) {
        showToast("Inventário cheio (Máximo 4 itens)!");
        return;
    }

    GameState.player.gold -= item.price;
    GameState.player.inventory[freeSlot] = item;
    if (item.type === "passive") GameState.player.stats.bonusAtk += item.stats.damage;

    showToast(`Adquirido: ${item.name}!`);
    renderShopItems("all");
    updateHUD();
    renderInventorySlots();
}

function renderInventorySlots() {
    const slots = document.querySelectorAll("#player-inventory .item-slot");
    slots.forEach((slotEl, idx) => {
        const item = GameState.player.inventory[idx];
        if (item) {
            slotEl.innerHTML = `<span title="${item.name}">${item.icon}</span>`;
            slotEl.style.borderColor = "var(--gold-primary)";
        } else {
            slotEl.innerHTML = "";
            slotEl.style.borderColor = "var(--text-muted)";
        }
    });
}

// ==========================================================================
// TURNOS E XP
// ==========================================================================
function startBattle() {
    GameState.player.hp = GameState.player.maxHp;
    GameState.enemy.hp = GameState.enemy.maxHp;
    GameState.turnCount = 1;
    GameState.isMyTurn = true;
    updateHUD();
    renderInventorySlots();
    showToast("A Batalha Ingressou no Grimório!");
}

function initGameControls() {
    document.getElementById("btn-end-turn")?.addEventListener("click", () => {
        if (!GameState.isMyTurn) return;
        endTurn();
    });
    document.getElementById("btn-restart")?.addEventListener("click", () => {
        document.getElementById("death-modal").classList.add("hidden");
        startBattle();
    });
}

function endTurn() {
    GameState.isMyTurn = false;
    document.getElementById("turn-indicator").textContent = "Turno do Oponente";
    
    if (GameState.player.rune?.id === "fluxo") {
        GameState.player.hp = Math.min(GameState.player.maxHp, GameState.player.hp + 12);
    }

    setTimeout(() => {
        const enemyDmg = Math.floor(Math.random() * 15) + 10;
        GameState.player.hp = Math.max(0, GameState.player.hp - enemyDmg);
        
        GameState.turnCount++;
        GameState.isMyTurn = true;
        GameState.player.gold += Math.floor(25 * GameState.player.stats.goldMult);
        
        document.getElementById("turn-indicator").textContent = "Seu Turno";
        updateHUD();
        checkEndGame();
    }, 1200);
}

function gainXP(amount) {
    GameState.player.xp += amount;
    if (GameState.player.xp >= 100) {
        GameState.player.level++;
        GameState.player.xp = 0;
        showToast(`Subiu para o Nível ${GameState.player.level}! Novas magias liberadas.`);
        document.getElementById("player-level").textContent = GameState.player.level;
    }
    document.getElementById("player-xp").textContent = GameState.player.xp;
}

function updateHUD() {
    document.getElementById("player-hp-bar").style.width = `${(GameState.player.hp / GameState.player.maxHp) * 100}%`;
    document.getElementById("player-hp-text").textContent = `${GameState.player.hp} / ${GameState.player.maxHp}`;
    document.getElementById("player-gold").textContent = GameState.player.gold;

    document.getElementById("enemy-hp-bar").style.width = `${(GameState.enemy.hp / GameState.enemy.maxHp) * 100}%`;
    document.getElementById("enemy-hp-text").textContent = `${GameState.enemy.hp} / ${GameState.enemy.maxHp}`;
    document.getElementById("enemy-gold").textContent = GameState.enemy.gold;
}

function checkEndGame() {
    if (GameState.player.hp <= 0 || GameState.enemy.hp <= 0) {
        const modal = document.getElementById("death-modal");
        document.getElementById("endgame-status-title").textContent = GameState.player.hp <= 0 ? "DERROTA" : "VITÓRIA";
        document.getElementById("stat-turns").textContent = GameState.turnCount;
        document.getElementById("stat-damage").textContent = GameState.totalDamageDealt;
        document.getElementById("stat-gold").textContent = GameState.player.gold;
        modal.classList.remove("hidden");
    }
}

function initKeyboardShortcuts() {
    window.addEventListener("keydown", (e) => {
        if (e.target.tagName === "INPUT") return;
        if (e.key.toLowerCase() === "p") document.getElementById("btn-open-shop")?.click();
        if (e.code === "Space") { e.preventDefault(); if (GameState.isMyTurn) endTurn(); }
    });
}

function showToast(message) {
    const toast = document.getElementById("game-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.style.opacity = "1";
    setTimeout(() => { toast.style.opacity = "0"; }, 2500);
}
