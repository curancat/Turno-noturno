import { ref, push, onValue, onChildAdded, set, update, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;

        // Garante nível base caso não exista
        if (!this.state.stats.level) this.state.stats.level = 1;

        this.corAtiva = 'red';
        this.alvoSelecionado = null; 
        this.jogadoresNaSala = {};
        this.folhasGuardadas = []; 
        this.maxFolhas = 3;

        this.multiplayerAtivo = false;
        this.desenhandoCanvas = false;
        this.pontosDesenho = [];

        // Cooldown/Anti-Spam
        this.podeUsarMagia = true; 

        // Sistema de Tintas com Restrição de Nível e Novos Efeitos
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25, nivelMinimo: 1 },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20, nivelMinimo: 5 },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15, nivelMinimo: 10 },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30, nivelMinimo: 15 },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25, nivelMinimo: 20 },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35, nivelMinimo: 25 },
            white: { nome: 'Luz Absoluta', hex: '#ffffff', custo: 60, nivelMinimo: 30 }
        };

        this.minigameAtivo = false;
        this.minigameScore = 0;
        
        this.meuId = this.state.playerName || `Litlegot_${Math.floor(Math.random() * 1000)}`;
    }

    iniciar() {
        this.injetarCSSMobileEPopups();
        this.criarPopupsEModais();
        this.iniciarMonitoramentoMultiplayer();
        this.iniciarSincronizacaoDeEventosVisuais();
        this.vincularCanvasEventos();
        this.atualizarTintaEstatistica();
        
        this.state.stats.manaRegen = 0;
        this.state.stats.mana = this.state.stats.maxMana;
        
        // Loop de verificação de vida
        setInterval(() => this.verificarMorte(), 1000);
        
        atualizarUI();
    }

    // ==========================================
    // VERIFICAÇÃO DE MORTE
    // ==========================================
    verificarMorte() {
        if (this.state.stats.hp <= 0) {
            this.state.stats.hp = 0;
            const deathScreen = document.getElementById('lg-death-screen');
            if (deathScreen && !deathScreen.classList.contains('active')) {
                deathScreen.classList.add('active');
                // Emite evento global de morte
                this.emitirEventoDeRede('caveira', '#ff0000', this.meuId, 0, 'Foi de arrasta pra cima');
            }
        }
    }

    renascer() {
        const deathScreen = document.getElementById('lg-death-screen');
        if (deathScreen) deathScreen.classList.remove('active');

        // Penalidade de morte
        this.state.gold = Math.max(0, Math.floor((this.state.gold || 0) * 0.8)); // Perde 20% do ouro
        this.state.stats.hp = this.state.stats.maxHp;
        this.state.stats.mana = 0; // Renasce sem mana

        this.emitirEventoDeRede('pilar', '#00ffcc', this.meuId, 0, 'Renasceu');
        atualizarUI();
    }

    // ==========================================
    // MULTIPLAYER E EVENTOS
    // ==========================================
    iniciarMonitoramentoMultiplayer() {
        if (!this.state.roomName) return;
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        
        onValue(playersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.jogadoresNaSala = data;
                this.multiplayerAtivo = Object.keys(data).length > 1;
                if (this.multiplayerAtivo) this.state.modoSimulado = false;
                this.atualizarListaDeAlvos();
            }
        });
    }

    iniciarSincronizacaoDeEventosVisuais() {
        if (!this.state.roomName) return;
        const eventsRef = ref(this.db, `rooms/${this.state.roomName}/battle_events`);
        
        onChildAdded(eventsRef, (snapshot) => {
            const evento = snapshot.val();
            if (Date.now() - evento.timestamp > 10000) return;
            this.renderizarEventoVisualGlobal(evento);
            // Se tomou dano, verifica morte imediatamente
            if (evento.targetId === this.meuId && evento.valor > 0) {
                setTimeout(() => this.verificarMorte(), 100);
            }
        });
    }

    atualizarListaDeAlvos() {
        const selectAlvo = document.getElementById('lg-alvo-select');
        if (!selectAlvo) return;
        
        const alvoAnterior = selectAlvo.value;
        selectAlvo.innerHTML = ''; 
        
        const optionSelf = document.createElement('option');
        optionSelf.value = this.meuId;
        optionSelf.innerText = `🧍 Si Mesmo (${this.meuId})`;
        selectAlvo.appendChild(optionSelf);

        Object.keys(this.jogadoresNaSala).forEach(playerId => {
            if (playerId !== this.meuId) {
                const option = document.createElement('option');
                option.value = playerId;
                const hpAlvo = this.jogadoresNaSala[playerId].stats?.hp || '???';
                option.innerText = `⚔️ Inimigo: ${playerId} (HP: ${hpAlvo})`;
                selectAlvo.appendChild(option);
            }
        });

        if (alvoAnterior && Object.keys(this.jogadoresNaSala).includes(alvoAnterior)) {
            selectAlvo.value = alvoAnterior;
            this.alvoSelecionado = alvoAnterior;
        } else {
            this.alvoSelecionado = this.meuId;
            selectAlvo.value = this.meuId;
        }
    }

    emitirEventoDeRede(tipoAnimacao, hex, alvoId, danoOuCura, nomeEfeito) {
        if (!this.state.roomName) return;
        const eventsRef = ref(this.db, `rooms/${this.state.roomName}/battle_events`);
        push(eventsRef, {
            sourceId: this.meuId,
            targetId: alvoId,
            tipoAnimacao: tipoAnimacao,
            hexColor: hex,
            valor: danoOuCura,
            nomeEfeito: nomeEfeito,
            timestamp: Date.now()
        });
    }

    atualizarTintaEstatistica() {
        const apAtual = this.state.stats.ap || 0;
        this.state.stats.maxMana = Math.floor(100 + (apAtual * 3.5));
        if (this.state.stats.mana > this.state.stats.maxMana) {
            this.state.stats.mana = this.state.stats.maxMana;
        }
        atualizarUI();
    }

    retornarABase() {
        if (this.state.stats.hp <= 0) return; // Morto não usa botão de base normal
        
        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana;
        this.state.stats.hp = this.state.stats.maxHp;
        
        this.emitirEventoDeRede('pilar', '#00ffcc', this.meuId, `+${this.state.stats.maxHp}`, 'Retorno à Base');
        atualizarUI();
    }

    // ==========================================
    // UI, DOCK FLUTUANTE E TELA DE MORTE
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v5')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v5';
        style.innerHTML = `
            :root { --lg-gold: #c5a059; --lg-panel: rgba(20, 20, 35, 0.95); }
            
            /* Dock Flutuante (Permite andar pelo mapa) */
            .lg-mobile-dock {
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                background: rgba(10, 10, 15, 0.85); backdrop-filter: blur(10px);
                display: flex; gap: 10px; padding: 10px 15px; border-radius: 40px;
                z-index: 9990; border: 1px solid rgba(197, 160, 89, 0.4);
                box-shadow: 0 10px 25px rgba(0,0,0,0.8); pointer-events: auto;
            }
            .lg-dock-btn {
                background: linear-gradient(135deg, #2a2a4a, #16213e);
                border: 2px solid var(--lg-gold); border-radius: 50%;
                width: 50px; height: 50px; display: flex; align-items: center; justify-content: center;
                color: #fff; font-size: 1.4rem; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                transition: transform 0.2s; cursor: pointer;
            }
            .lg-dock-btn:active { transform: scale(0.85); }

            /* Tela de Morte */
            .lg-death-screen {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(20, 0, 0, 0.9); z-index: 10005;
                display: none; flex-direction: column; align-items: center; justify-content: center;
                opacity: 0; transition: opacity 1s ease-in; color: #ff3333; font-family: serif;
            }
            .lg-death-screen.active { display: flex; opacity: 1; }
            .lg-death-screen h1 { font-size: 4rem; text-shadow: 0 0 20px #ff0000; margin-bottom: 10px; letter-spacing: 5px; }
            .lg-btn-respawn {
                margin-top: 30px; background: transparent; border: 2px solid #ff3333; color: #ff3333;
                padding: 15px 40px; font-size: 1.5rem; text-transform: uppercase; cursor: pointer;
                transition: 0.3s; box-shadow: inset 0 0 10px #ff3333; border-radius: 5px;
            }
            .lg-btn-respawn:hover { background: #ff3333; color: #000; }

            /* Bottom Sheet Modals */
            .lg-popup {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); z-index: 9995;
                display: none; align-items: flex-end; justify-content: center;
            }
            .lg-popup.active { display: flex; }
            .lg-popup-card {
                background: var(--lg-panel); border-top: 2px solid var(--lg-gold);
                border-radius: 24px 24px 0 0; width: 100%; max-width: 600px;
                padding: 20px; color: #fff; max-height: 85vh; overflow-y: auto;
                animation: slideUp 0.3s ease-out; pointer-events: auto;
            }
            @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }

            /* Paleta e Bloqueios por Nível */
            .lg-palette { display: flex; gap: 12px; overflow-x: auto; padding: 10px 5px; }
            .lg-color-dot {
                width: 44px; height: 44px; border-radius: 50%; border: 3px solid #333;
                flex-shrink: 0; cursor: pointer; transition: all 0.3s; position: relative;
            }
            .lg-color-dot.active { border-color: #fff; transform: scale(1.15) translateY(-5px); box-shadow: 0 5px 15px var(--lg-gold); }
            .lg-color-dot.locked { filter: grayscale(100%); opacity: 0.5; cursor: not-allowed; }
            .lg-color-dot.locked::after {
                content: '🔒'; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.2rem;
            }
            
            /* UI Canvas e Resto */
            .lg-canvas-box { width: 100%; height: 50vh; background: #070710; border: 2px dashed #444; border-radius: 16px; touch-action: none; position: relative; }
            .lg-select-modern { background: #1a1a2e; color: #fff; padding: 15px; border: 1px solid var(--lg-gold); border-radius: 12px; width: 100%; outline: none; }
            .lg-grid-folhas { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
            .lg-folha-card { border: 2px solid; background: #0b0b18; border-radius: 12px; padding: 16px; text-align: center; }

            /* Efeitos Globais e Animações de Batalha (21 tipos suportados) */
            .lg-effect-layer { position: fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9998; }
            
            @keyframes anim-slash { 0% { transform: scale(0) rotate(45deg); opacity: 1; } 100% { transform: scale(5) rotate(45deg) translateX(100px); opacity: 0; } }
            @keyframes anim-shield { 0% { transform: scale(0); opacity: 0.8; border-width: 20px;} 100% { transform: scale(2.5); opacity: 0; border-width: 1px;} }
            @keyframes anim-beam { 0% { width: 0; opacity: 1; } 100% { width: 200vw; opacity: 0; left: -50vw; } }
            @keyframes anim-drain { 0% { box-shadow: inset 0 0 0px #ff0000; } 50% { box-shadow: inset 0 0 150px #ff0000; } 100% { box-shadow: inset 0 0 0px #ff0000; } }
            @keyframes anim-heal { 0% { transform: translateY(50px); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateY(-100px); opacity: 0; } }
            @keyframes anim-bind { 0% { transform: scale(3) rotate(0deg); opacity:0;} 50% { transform: scale(1) rotate(180deg); opacity:1;} 100% { transform: scale(1) rotate(360deg); opacity:0;} }
            @keyframes float-up { 0% { transform: translateY(0) scale(0.8); opacity: 0; } 20% { transform: translateY(-20px) scale(1.2); opacity: 1; } 80% { transform: translateY(-60px) scale(1); opacity: 1; } 100% { transform: translateY(-80px) scale(0.8); opacity: 0; } }
            
            .lg-damage-text { position: absolute; font-size: 2.5rem; font-weight: 900; font-family: 'Arial Black', sans-serif; -webkit-text-stroke: 2px black; text-shadow: 0px 5px 15px rgba(0,0,0,0.8); animation: float-up 1.5s forwards; }
            .lg-particle { position: absolute; pointer-events: none; }
        `;
        document.head.appendChild(style);
    }

    criarPopupsEModais() {
        if (!document.getElementById('lg-effect-layer')) {
            const layer = document.createElement('div');
            layer.id = 'lg-effect-layer';
            layer.className = 'lg-effect-layer';
            document.body.appendChild(layer);
        }

        // Tela de Morte
        if (!document.getElementById('lg-death-screen')) {
            const deathScreen = document.createElement('div');
            deathScreen.id = 'lg-death-screen';
            deathScreen.className = 'lg-death-screen';
            deathScreen.innerHTML = `
                <h1>VOCÊ MORREU</h1>
                <p>Sua luz se apagou no campo de batalha.</p>
                <button class="lg-btn-respawn" id="lg-btn-respawn">Renascer na Base</button>
            `;
            document.body.appendChild(deathScreen);
            document.getElementById('lg-btn-respawn').onclick = () => this.renascer();
        }

        // Dock Flutuante
        const dock = document.createElement('div');
        dock.className = 'lg-mobile-dock';
        dock.innerHTML = `
            <div class="lg-dock-btn" id="lg-btn-ateliere" title="Arte">🎨</div>
            <div class="lg-dock-btn" id="lg-btn-mochila" title="Mochila">📜</div>
            <div class="lg-dock-btn" id="lg-btn-farm" title="Farm">🌾</div>
            <div class="lg-dock-btn" id="lg-btn-loja" title="Forja">⚒️</div>
            <div class="lg-dock-btn" id="lg-btn-base" title="Base">🏛️</div>
        `;
        document.body.appendChild(dock);

        const criarSheet = (id, icone, titulo, subtitulo, conteudo) => {
            const popup = document.createElement('div');
            popup.id = id;
            popup.className = 'lg-popup';
            popup.innerHTML = `
                <div class="lg-popup-card">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                        <h3 style="margin:0; color:var(--lg-gold); display:flex; align-items:center; gap:8px;">${icone} ${titulo}</h3>
                        <button class="lg-close-btn" style="background:transparent; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:0.9rem; color:#aaa; margin-bottom: 15px;">${subtitulo}</div>
                    ${conteudo}
                </div>
            `;
            document.body.appendChild(popup);
        };

        // Modais
        criarSheet('lg-modal-canvas', '🎨', 'Ateliê Tático', 'Traços mágicos. Nível 30 = Sem Cooldown.', `
            <div class="lg-palette" id="lg-palette-select"></div>
            <div class="lg-canvas-box"><canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas></div>
            <div style="display:flex; gap:10px; margin-top:10px;">
                <button id="lg-btn-limpar" style="flex:1; background:#2a2a3e; color:#fff; border:none; padding:12px; border-radius:8px;">Limpar</button>
                <button id="lg-btn-guardar" style="flex:2; background:var(--lg-gold); color:#000; font-weight:bold; border:none; border-radius:8px;">Materializar</button>
            </div>
        `);

        criarSheet('lg-modal-mochila', '📜', 'Mochila Arcana', 'Escolha o alvo e libere a magia.', `
            <select id="lg-alvo-select" class="lg-select-modern"></select>
            <div class="lg-grid-folhas" id="lg-folhas-container" style="margin-top:15px;"></div>
        `);

        criarSheet('lg-modal-farm', '🌾', 'Farm Rápido', 'Toque rápido nas esferas.', `
            <div id="lg-farm-arena" style="position:relative; width:100%; height:300px; background:#04040a; border-radius:12px; overflow:hidden;"></div>
            <button id="lg-start-farm" style="width:100%; padding:15px; background:#28a745; color:#fff; font-weight:bold; border:none; border-radius:8px; margin-top:10px;">Iniciar</button>
        `);

        criarSheet('lg-modal-loja', '⚒️', 'Forja de Atributos', 'Sacrifique 25% do HP máximo.', `
            <div style="display:flex; flex-direction:column; gap:10px;">
                <button class="lg-craft-item" data-item="espada" style="padding:15px; background:#1a1a2e; border:1px solid var(--lg-gold); color:#fff; border-radius:8px;">⚔️ Espada (+35 AD)</button>
                <button class="lg-craft-item" data-item="tomo" style="padding:15px; background:#1a1a2e; border:1px solid var(--lg-gold); color:#fff; border-radius:8px;">📘 Tomo (+50 AP)</button>
                <button class="lg-craft-item" data-item="cristal" style="padding:15px; background:#1a1a2e; border:1px solid var(--lg-gold); color:#fff; border-radius:8px;">💎 Cristal (+300 HP)</button>
            </div>
        `);

        this.vincularEventosModais();
        this.renderizarPaleta();
    }

    renderizarPaleta() {
        const container = document.getElementById('lg-palette-select');
        if (!container) return;
        container.innerHTML = '';

        const levelJogador = this.state.stats.level || 1;

        Object.keys(this.tintas).forEach(corKey => {
            const cor = this.tintas[corKey];
            const dot = document.createElement('div');
            const hasLevel = levelJogador >= cor.nivelMinimo;
            
            dot.className = `lg-color-dot ${corKey === this.corAtiva ? 'active' : ''} ${!hasLevel ? 'locked' : ''}`;
            dot.style.backgroundColor = cor.hex;
            
            if (hasLevel) {
                dot.title = `${cor.nome} (Mana: ${cor.custo})`;
                dot.onclick = () => {
                    document.querySelectorAll('.lg-color-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    this.corAtiva = corKey;
                };
            } else {
                dot.title = `Desbloqueia no Nv. ${cor.nivelMinimo}`;
                dot.onclick = () => this.animacaoTextoFlutuante(`Requer Nível ${cor.nivelMinimo}`, "#ff0000");
            }
            container.appendChild(dot);
        });
        
        // Garante que se subiu de nível e a cor inicial tava bloqueada, ele seleciona a primeira possível
        if ((this.state.stats.level || 1) < this.tintas[this.corAtiva].nivelMinimo) {
            this.corAtiva = 'red';
        }
    }

    vincularEventosModais() {
        const toggle = (id, show) => {
            const popup = document.getElementById(id);
            if (show) popup.classList.add('active');
            else popup.classList.remove('active');
        };

        document.getElementById('lg-btn-ateliere').onclick = () => { this.renderizarPaleta(); toggle('lg-modal-canvas', true); setTimeout(()=>this.redimensionarCanvas(), 300); };
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarListaDeAlvos(); this.atualizarUIFolhas(); toggle('lg-modal-mochila', true); };
        document.getElementById('lg-btn-farm').onclick = () => toggle('lg-modal-farm', true);
        document.getElementById('lg-btn-loja').onclick = () => toggle('lg-modal-loja', true);
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();

        document.querySelectorAll('.lg-close-btn').forEach(btn => btn.onclick = (e) => e.target.closest('.lg-popup').classList.remove('active'));
        document.querySelectorAll('.lg-popup').forEach(p => p.addEventListener('click', (e) => { if (e.target === p) p.classList.remove('active'); }));

        document.getElementById('lg-btn-limpar').onclick = () => this.limparCanvas();
        document.getElementById('lg-btn-guardar').onclick = () => this.guardarDesenho();
        document.getElementById('lg-start-farm').onclick = () => this.iniciarMinigameFarm();
        document.querySelectorAll('.lg-craft-item').forEach(b => b.onclick = (e) => this.criarItemDaLoja(e.currentTarget.dataset.item));
    }

    // ==========================================
    // CANVAS E RECONHECIMENTO DE FORMAS
    // ==========================================
    vincularCanvasEventos() {
        const canvas = document.getElementById('lg-paint-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            return { x: clientX - rect.left, y: clientY - rect.top };
        };

        const startDraw = (e) => {
            e.preventDefault(); 
            this.desenhandoCanvas = true;
            this.pontosDesenho = [];
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = this.tintas[this.corAtiva].hex;
            ctx.lineWidth = 6;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.tintas[this.corAtiva].hex;
        };

        const draw = (e) => {
            if (!this.desenhandoCanvas) return;
            e.preventDefault();
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            
            if (this.pontosDesenho.length > 2) {
                const p1 = this.pontosDesenho[this.pontosDesenho.length - 2];
                const p2 = this.pontosDesenho[this.pontosDesenho.length - 1];
                ctx.quadraticCurveTo(p1.x, p1.y, (p1.x + p2.x)/2, (p1.y + p2.y)/2);
                ctx.stroke();
            }
        };

        const stopDraw = () => { this.desenhandoCanvas = false; };

        canvas.addEventListener('mousedown', startDraw); canvas.addEventListener('mousemove', draw);
        window.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false }); canvas.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('touchend', stopDraw);
    }

    redimensionarCanvas() {
        const canvas = document.getElementById('lg-paint-canvas');
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth; canvas.height = parent.clientHeight;
        this.limparCanvas();
    }
    limparCanvas() {
        const canvas = document.getElementById('lg-paint-canvas');
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        this.pontosDesenho = [];
    }

    reconhecerForma() {
        const pts = this.pontosDesenho;
        if (pts.length < 10) return null; 
        const start = pts[0], end = pts[pts.length - 1];
        const dist = Math.hypot(end.x - start.x, end.y - start.y);
        
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        pts.forEach(p => { if (p.x<minX) minX=p.x; if(p.x>maxX) maxX=p.x; if(p.y<minY) minY=p.y; if(p.y>maxY) maxY=p.y; });
        
        if (dist < 70 && (maxX-minX)>30 && (maxY-minY)>30) return 'O';
        
        let mudancas = 0;
        for (let i = 3; i < pts.length - 3; i+=3) {
            const d1 = pts[i].x - pts[i-3].x;
            const d2 = pts[i+3].x - pts[i].x;
            if (d1 * d2 < 0) mudancas++; // Mudou direção horizontal
        }
        if (mudancas >= 1 && (maxX-minX) > 40) return 'Z';
        return 'X';
    }

    guardarDesenho() {
        if (this.folhasGuardadas.length >= this.maxFolhas) return this.animacaoTextoFlutuante("Mochila Cheia!", "#ff0000");
        
        const forma = this.reconhecerForma();
        if (!forma) return this.animacaoTextoFlutuante("Desenho não reconhecido!", "#ffaa00");

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) return this.animacaoTextoFlutuante(`Sem Mana (${corData.custo})`, "#00bfff");

        this.state.stats.mana -= corData.custo;
        this.folhasGuardadas.push({ id: Date.now(), forma, corKey: this.corAtiva, corHex: corData.hex, nomeCor: corData.nome, apSnapshot: this.state.stats.ap || 0 });

        this.limparCanvas();
        this.animacaoTextoFlutuante(`Preparado: ${forma}`, corData.hex);
        document.getElementById('lg-modal-canvas').classList.remove('active');
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        container.innerHTML = '';
        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:#777;">Vazio.</div>';
            return;
        }

        this.folhasGuardadas.forEach((f, i) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = f.corHex;
            card.innerHTML = `
                <div style="font-size:2rem; font-weight:900; color:${f.corHex};">${f.forma}</div>
                <div style="font-size:0.7rem; color:#fff; margin:5px 0;">${f.nomeCor}</div>
                <button style="background:${f.corHex}; color:#000; font-weight:bold; width:100%; border:none; padding:8px; border-radius:5px; cursor:pointer;">Lançar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(i);
            container.appendChild(card);
        });
    }

    // ==========================================
    // SISTEMA DE 21 EFEITOS REAIS + COOLDOWN
    // ==========================================
    ativarFolha(index) {
        if (!this.podeUsarMagia && (this.state.stats.level || 1) < 30) {
            return this.animacaoTextoFlutuante("Aguarde recarga mágica!", "#aaaaaa");
        }

        const folha = this.folhasGuardadas[index];
        if (!this.alvoSelecionado) return this.animacaoTextoFlutuante("Selecione um alvo!", "#ff0000");

        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').classList.remove('active');

        // Ativa Cooldown se Nível < 30
        if ((this.state.stats.level || 1) < 30) {
            this.podeUsarMagia = false;
            setTimeout(() => {
                this.podeUsarMagia = true;
                this.animacaoTextoFlutuante("Magia Recarregada!", "#ffffff");
            }, 3000); // 3 segundos de CD
        }

        this.executarOs21EfeitosMecanicos(folha.forma, folha.corKey, folha.apSnapshot, this.alvoSelecionado);
    }

    executarOs21EfeitosMecanicos(forma, corKey, apSnap, alvoId) {
        const ap = apSnap || this.state.stats.ap || 0;
        const hpBase = this.state.stats.maxHp || 100;
        const hex = this.tintas[corKey].hex;
        
        let nomeEfeito = "";
        let resumoAcao = "";
        let dano = 0;
        let tipoAnimacao = 'padrao'; 

        // AS 21 MECÂNICAS EXCLUSIVAS
        switch (corKey) {
            case 'red': // FOGO (Foco: Dano Bruto)
                if (forma === 'O') {
                    nomeEfeito = "Explosão Solar"; tipoAnimacao = 'explosao';
                    dano = Math.floor(ap * 3.5); resumoAcao = `causou ${dano} Dano em Área`;
                } else if (forma === 'X') {
                    nomeEfeito = "Corte Ígneo"; tipoAnimacao = 'slash';
                    dano = Math.floor(ap * 2.0); resumoAcao = `causou ${dano} Dano e cortou`;
                } else { // Z
                    nomeEfeito = "Rastro de Fogo"; tipoAnimacao = 'beam';
                    dano = Math.floor(ap * 1.5); this.state.stats.ad += 10; // Buff AD Temporário/Perma
                    resumoAcao = `causou ${dano} Dano e ganhou +10 AD`;
                }
                break;
                
            case 'orange': // LARANJA (Foco: Roubo e Sacrifício)
                if (forma === 'O') {
                    nomeEfeito = "Aura Sanguessuga"; tipoAnimacao = 'heal';
                    const cura = Math.floor(hpBase * 0.3); this.curar(cura);
                    resumoAcao = `curou ${cura} HP`;
                } else if (forma === 'X') {
                    nomeEfeito = "Estaca de Sangue"; tipoAnimacao = 'drain';
                    dano = Math.floor(ap * 2.5); this.curar(dano); // Drena 100% do dano
                    resumoAcao = `drenou ${dano} HP de ${alvoId}`;
                } else { // Z
                    nomeEfeito = "Frenesi Sacrificial"; tipoAnimacao = 'explosao';
                    this.state.stats.hp -= Math.floor(hpBase * 0.2); // Paga 20% HP
                    this.state.stats.ap += 30; // Ganha mt AP
                    resumoAcao = `sacrificou HP por +30 AP!`;
                }
                break;

            case 'yellow': // AMARELO (Foco: Ouro e Velocidade)
                if (forma === 'O') {
                    nomeEfeito = "Esfera de Ouro"; tipoAnimacao = 'heal';
                    const ouro = Math.floor(100 + (ap * 1.5)); this.state.gold += ouro;
                    resumoAcao = `transmutou +${ouro} Ouro`;
                } else if (forma === 'X') {
                    nomeEfeito = "Raio Estocada"; tipoAnimacao = 'beam';
                    dano = Math.floor(ap * 2.2); resumoAcao = `atingiu ${alvoId} com ${dano} Dano Rapido`;
                } else { // Z
                    nomeEfeito = "Esquiva Ilusória"; tipoAnimacao = 'shield';
                    this.state.stats.shield = (this.state.stats.shield || 0) + Math.floor(ap * 2);
                    resumoAcao = `gerou escudo de ${Math.floor(ap*2)}`;
                }
                break;

            case 'green': // VERDE (Foco: Natureza, HP Máximo e Controle)
                if (forma === 'O') {
                    nomeEfeito = "Casulo da Vida"; tipoAnimacao = 'shield';
                    this.state.stats.maxHp += 25; this.curar(100);
                    resumoAcao = `curou HP e ganhou +25 Max HP`;
                } else if (forma === 'X') {
                    nomeEfeito = "Espinho Perfurante"; tipoAnimacao = 'slash';
                    dano = Math.floor(ap * 1.8 + this.state.stats.ad * 0.5); // Escala hibrida
                    resumoAcao = `perfurou ${alvoId} com ${dano} Dano Híbrido`;
                } else { // Z
                    nomeEfeito = "Raízes Prisão"; tipoAnimacao = 'bind';
                    dano = Math.floor(ap * 1.2); 
                    // No futuro: status effect "Root"
                    resumoAcao = `enraizou ${alvoId} causando ${dano} Dano`;
                }
                break;

            case 'blue': // AZUL (Foco: Água, Escudos e Defesa)
                if (forma === 'O') {
                    nomeEfeito = "Barreira Oceânica"; tipoAnimacao = 'shield';
                    const shield = Math.floor(150 + ap * 2.5);
                    this.state.stats.shield = (this.state.stats.shield || 0) + shield;
                    resumoAcao = `ganhou +${shield} Escudo`;
                } else if (forma === 'X') {
                    nomeEfeito = "Jato D'Água Purificador"; tipoAnimacao = 'beam';
                    dano = Math.floor(ap * 2.0); this.curar(50); // Bate e limpa (simulado)
                    resumoAcao = `causou ${dano} Dano e limpou feridas`;
                } else { // Z
                    nomeEfeito = "Corte Congelante"; tipoAnimacao = 'slash';
                    dano = Math.floor(ap * 2.8); // Bate forte
                    resumoAcao = `congelou ${alvoId} com ${dano} Dano`;
                }
                break;

            case 'purple': // ROXO (Foco: Vazio, Quebra Escudo e Execução)
                if (forma === 'O') {
                    nomeEfeito = "Buraco Negro"; tipoAnimacao = 'implosao';
                    dano = Math.floor(hpBase * 0.15 + ap * 2); // Dano baseado no proprio max HP
                    resumoAcao = `sugou a área causando ${dano} Dano`;
                } else if (forma === 'X') {
                    nomeEfeito = "Foice Umbral"; tipoAnimacao = 'slash';
                    dano = Math.floor(ap * 3.5); // Dano alto de execução
                    resumoAcao = `ceifou ${alvoId} com ${dano} Dano Crítico`;
                } else { // Z
                    nomeEfeito = "Maldição da Ruína"; tipoAnimacao = 'bind';
                    dano = Math.floor(ap * 1.5); 
                    // Efeito real em combate: Destrói escudos (implementado no aplicarDanoRede extra)
                    resumoAcao = `amaldiçoou ${alvoId} (Dano Real ignorando Escudo)`;
                }
                break;

            case 'white': // BRANCO (Foco: Divino, Atributos Permanentes) [Desbloqueado NV 30]
                if (forma === 'O') {
                    nomeEfeito = "Milagre"; tipoAnimacao = 'pilar';
                    this.state.stats.hp = this.state.stats.maxHp; 
                    this.state.stats.mana = this.state.stats.maxMana;
                    resumoAcao = `restaurou Saúde e Mana 100%`;
                } else if (forma === 'X') {
                    nomeEfeito = "Julgamento"; tipoAnimacao = 'pilar';
                    dano = Math.floor(ap * 5.0); // Dano massivo absurdo
                    resumoAcao = `julgou ${alvoId} com ${dano} Dano Divino`;
                } else { // Z
                    nomeEfeito = "Ascensão"; tipoAnimacao = 'heal';
                    this.state.stats.ap += 15; this.state.stats.ad += 15; this.state.stats.maxHp += 50;
                    resumoAcao = `ascendeu atributos (+15 AP/AD, +50 HP)`;
                }
                break;
        }

        if (dano > 0) {
            // Se for Z do roxo, ignora escudo (Dano Verdadeiro)
            const trueDamage = (corKey === 'purple' && forma === 'Z');
            this.aplicarDanoRede(alvoId, dano, trueDamage);
        }
        
        atualizarUI();
        this.emitirEventoDeRede(tipoAnimacao, hex, alvoId, dano, `[${forma}] ${nomeEfeito}`);
        if (this.state.roomName) {
            push(ref(this.db, `rooms/${this.state.roomName}/chat`), {
                sender: this.meuId,
                text: `<strong style="color:${hex};">[${forma}] ${nomeEfeito}</strong>: ${resumoAcao}`,
                type: "combat", time: Date.now()
            });
        }
    }

    aplicarDanoRede(alvoId, dano, ignoreShield = false) {
        if (!this.multiplayerAtivo || !this.state.roomName) return;
        
        if (alvoId === this.meuId) {
            this.state.stats.hp = Math.max(0, (this.state.stats.hp || 0) - dano);
            this.verificarMorte();
            return;
        }

        const alvoRef = ref(this.db, `rooms/${this.state.roomName}/players/${alvoId}/stats`);
        get(alvoRef).then(snapshot => {
            const stats = snapshot.val();
            if (stats) {
                let hp = stats.hp || 0;
                let escudo = stats.shield || 0;
                
                if (ignoreShield) {
                    hp = Math.max(0, hp - dano);
                } else {
                    if (escudo > 0) {
                        if (dano >= escudo) { dano -= escudo; escudo = 0; hp = Math.max(0, hp - dano); } 
                        else { escudo -= dano; }
                    } else { hp = Math.max(0, hp - dano); }
                }

                update(alvoRef, { hp, shield: escudo });
            }
        });
    }

    curar(valor) {
        if (this.state.stats.hp <= 0) return; // Morto não cura
        this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor);
        atualizarUI();
    }

    // ==========================================
    // RENDERIZADOR DE ANIMAÇÕES E PARTÍCULAS
    // ==========================================
    renderizarEventoVisualGlobal(evento) {
        const isTarget = evento.targetId === this.meuId;
        const isSource = evento.sourceId === this.meuId;
        const layer = document.getElementById('lg-effect-layer');
        if (!layer) return;

        if (isTarget && evento.valor > 0) {
            document.body.style.animation = 'none';
            void document.body.offsetWidth; 
            document.body.style.animation = 'shake 0.4s both';
        }

        this.gerarParticulas(evento.tipoAnimacao, evento.hexColor, layer);

        if (evento.valor > 0) {
            const txt = document.createElement('div');
            txt.className = 'lg-damage-text'; txt.style.color = evento.hexColor;
            txt.innerText = isTarget || isSource ? `-${evento.valor}` : `-${evento.valor} (em ${evento.targetId})`;
            txt.style.left = `calc(50% + ${(Math.random()-0.5)*100}px)`;
            txt.style.top = `calc(50% + ${(Math.random()-0.5)*50}px)`;
            layer.appendChild(txt);
            setTimeout(() => txt.remove(), 1500);
        }
        
        if (isSource) this.animacaoTextoFlutuante(`${evento.nomeEfeito}`, evento.hexColor);
    }

    gerarParticulas(tipo, cor, layer) {
        const c = document.createElement('div');
        c.style.position = 'absolute'; c.style.top = '50%'; c.style.left = '50%'; c.style.transform = 'translate(-50%, -50%)';
        
        // Mapeamento das Animações Específicas
        if (tipo === 'explosao') {
            c.style.width = '100px'; c.style.height = '100px'; c.style.borderRadius = '50%';
            c.style.background = `radial-gradient(circle, ${cor}aa, transparent)`;
            c.style.animation = 'anim-shield 0.6s ease-out forwards';
        } else if (tipo === 'slash') {
            c.style.width = '5px'; c.style.height = '200px'; c.style.background = cor; c.style.boxShadow = `0 0 20px ${cor}`;
            c.style.animation = 'anim-slash 0.5s ease-out forwards';
        } else if (tipo === 'shield') {
            c.style.width = '150px'; c.style.height = '150px'; c.style.borderRadius = '50%';
            c.style.border = `5px solid ${cor}`; c.style.boxShadow = `inset 0 0 30px ${cor}`;
            c.style.animation = 'anim-shield 1s ease-out forwards';
        } else if (tipo === 'beam') {
            c.style.height = '20px'; c.style.background = cor; c.style.boxShadow = `0 0 30px ${cor}`;
            c.style.animation = 'anim-beam 0.6s ease-in-out forwards';
        } else if (tipo === 'drain') {
            c.style.width = '100vw'; c.style.height = '100vh'; 
            c.style.animation = 'anim-drain 1s ease-in-out forwards';
        } else if (tipo === 'heal') {
            c.style.width = '80px'; c.style.height = '80px'; c.style.borderRadius = '50%';
            c.style.background = `radial-gradient(circle, #fff, ${cor})`; c.style.boxShadow = `0 0 40px ${cor}`;
            c.style.animation = 'anim-heal 1.5s ease-out forwards';
        } else if (tipo === 'bind') {
            c.style.width = '100px'; c.style.height = '100px'; c.style.border = `10px dashed ${cor}`; c.style.borderRadius = '50%';
            c.style.animation = 'anim-bind 1s linear forwards';
        } else if (tipo === 'implosao') {
            c.style.width = '300px'; c.style.height = '300px'; c.style.borderRadius = '50%';
            c.style.background = `radial-gradient(circle, ${cor}88, transparent)`;
            c.style.animation = 'anim-shield 0.8s reverse forwards';
        } else if (tipo === 'pilar') {
            c.style.width = '100vw'; c.style.height = '100vh';
            c.style.background = `linear-gradient(to top, transparent, ${cor}88, transparent)`;
            c.style.animation = 'float-up 1s ease-in-out forwards';
        }

        layer.appendChild(c);
        setTimeout(() => c.remove(), 1500);
    }

    animacaoTextoFlutuante(texto, cor) {
        const t = document.createElement('div');
        t.style.position = 'fixed'; t.style.top = '30%'; t.style.left = '50%'; t.style.transform = 'translate(-50%, -50%)';
        t.style.color = cor; t.style.fontSize = '1.5rem'; t.style.fontWeight = '900'; t.style.textShadow = `0 4px 15px #000, 0 0 10px ${cor}`;
        t.style.zIndex = '10001'; t.style.pointerEvents = 'none'; t.style.textAlign = 'center';
        t.style.animation = 'float-up 1.3s ease-out forwards';
        t.innerText = texto;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 1300);
    }

    // ==========================================
    // FORJA E MINIGAME FARM (MANTIDOS E AJUSTADOS)
    // ==========================================
    criarItemDaLoja(tipoItem) {
        const custo = Math.floor(this.state.stats.maxHp * 0.25);
        if (this.state.stats.hp <= custo || this.state.stats.maxHp <= 300) return this.animacaoTextoFlutuante("HP Insuficiente!", "#ff0000");

        this.state.stats.hp -= custo;
        this.emitirEventoDeRede('explosao', '#8b0000', this.meuId, custo, 'Sacrifício');

        if (tipoItem === 'espada') { this.state.stats.ad += 35; this.animacaoTextoFlutuante("+35 AD", "#ffaa00"); } 
        else if (tipoItem === 'tomo') { this.state.stats.ap += 50; this.atualizarTintaEstatistica(); this.animacaoTextoFlutuante("+50 AP", "#8a2be2"); } 
        else if (tipoItem === 'cristal') { this.state.stats.maxHp += 300; this.state.stats.hp += 300; this.animacaoTextoFlutuante("+300 HP", "#ff3333"); }
        document.getElementById('lg-modal-loja').classList.remove('active'); atualizarUI();
    }

    iniciarMinigameFarm() {
        const arena = document.getElementById('lg-farm-arena');
        document.getElementById('lg-start-farm').style.display = 'none';
        this.minigameScore = 0; this.minigameAtivo = true;
        let c = 0;

        const gerar = () => {
            if (c >= 15 || !this.minigameAtivo) {
                this.minigameAtivo = false;
                document.getElementById('lg-start-farm').style.display = 'block';
                const ouro = this.minigameScore * 75; this.state.gold += ouro;
                this.animacaoTextoFlutuante(`Farm: +${ouro} Ouro`, "#ffff00");
                setTimeout(() => document.getElementById('lg-modal-farm').classList.remove('active'), 1000);
                atualizarUI(); return;
            }

            const alvo = document.createElement('div');
            alvo.style.position = 'absolute'; alvo.style.width = '50px'; alvo.style.height = '50px';
            alvo.style.borderRadius = '50%'; alvo.style.background = 'radial-gradient(circle, #fff, var(--lg-gold))';
            alvo.style.left = `${Math.random() * (arena.clientWidth - 50)}px`;
            alvo.style.top = `${Math.random() * (arena.clientHeight - 50)}px`;
            alvo.style.animation = 'float-up 0.8s ease-in reverse forwards';

            const to = setTimeout(() => { if (alvo.parentNode) { alvo.remove(); gerar(); } }, Math.max(400, 800 - c * 25));

            const hit = (e) => {
                e.preventDefault(); clearTimeout(to); this.minigameScore++;
                alvo.style.transform = 'scale(2)'; alvo.style.opacity = '0';
                setTimeout(() => { alvo.remove(); gerar(); }, 150);
            };
            alvo.addEventListener('mousedown', hit); alvo.addEventListener('touchstart', hit, { passive: false });
            arena.appendChild(alvo); c++;
        };
        gerar();
    }
}
