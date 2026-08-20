import { ref, push, onValue, onChildAdded, set, update, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;

        this.corAtiva = 'red';
        this.alvoSelecionado = null; 
        this.jogadoresNaSala = {};
        this.folhasGuardadas = []; 
        this.maxFolhas = 3;

        this.multiplayerAtivo = false;
        this.desenhandoCanvas = false;
        this.pontosDesenho = [];

        // Sistema de Anti-Spam
        this.ultimoDesenhoTempo = 0;
        this.tempoRecargaBase = 3000; // 3 segundos de cooldown
        this.morto = false;

        // Sistema de Tintas com Nível Requisitado
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25, nivelReq: 1 },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20, nivelReq: 5 },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15, nivelReq: 10 },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30, nivelReq: 15 },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25, nivelReq: 20 },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35, nivelReq: 25 },
            white: { nome: 'Luz Absoluta', hex: '#ffffff', custo: 60, nivelReq: 30 }
        };

        this.minigameAtivo = false;
        this.minigameScore = 0;
        this.minigameTimer = null;
        
        this.meuId = this.state.playerName || `Litlegot_${Math.floor(Math.random() * 1000)}`;

        // Certifica de ter nível e stats iniciais para evitar erros
        if (!this.state.stats) this.state.stats = {};
        if (!this.state.stats.level) this.state.stats.level = 1;
        if (!this.state.stats.maxHp) this.state.stats.maxHp = 500;
        if (!this.state.stats.hp) this.state.stats.hp = this.state.stats.maxHp;
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
        
        // Loop de checagem vital
        setInterval(() => this.verificarMorte(), 1000);
        
        atualizarUI();
    }

    // ==========================================
    // MULTIPLAYER E REDE
    // ==========================================
    iniciarMonitoramentoMultiplayer() {
        if (!this.state.roomName) return;
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        
        onValue(playersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.jogadoresNaSala = data;
                const qtdJogadores = Object.keys(data).length;
                this.multiplayerAtivo = qtdJogadores > 1;
                
                if (this.multiplayerAtivo) this.state.modoSimulado = false;
                this.atualizarListaDeAlvos();
                
                // Checa HP remotamente caso sofra dano fatal de uma vez
                if (data[this.meuId] && data[this.meuId].stats && data[this.meuId].stats.hp <= 0) {
                    this.state.stats.hp = 0;
                    this.verificarMorte();
                }
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

    emitirEventoDeRede(forma, corKey, hex, alvoId, danoOuCura, nomeEfeito) {
        if (!this.state.roomName) return;
        const eventsRef = ref(this.db, `rooms/${this.state.roomName}/battle_events`);
        push(eventsRef, {
            sourceId: this.meuId,
            targetId: alvoId,
            forma: forma,
            corKey: corKey,
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
        if (this.morto) {
            this.morto = false;
            document.getElementById('lg-death-screen').classList.remove('active');
        }
        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana;
        this.state.stats.hp = this.state.stats.maxHp;
        
        // Remove debuffs ou shields expirados aqui se houver
        this.state.stats.shield = 0; 
        
        this.emitirEventoDeRede('O', 'blue', '#00ffcc', this.meuId, `+${this.state.stats.maxHp}`, 'Retorno à Base / Renascimento');
        atualizarUI();
    }

    verificarMorte() {
        if (this.state.stats.hp <= 0 && !this.morto) {
            this.morto = true;
            this.state.stats.hp = 0;
            
            // Limpa canvas se estiver desenhando
            document.querySelectorAll('.lg-popup').forEach(p => p.classList.remove('active'));
            
            document.getElementById('lg-death-screen').classList.add('active');
            
            // Avisa a sala
            if (this.state.roomName) {
                const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
                push(chatRef, {
                    sender: "SISTEMA",
                    text: `💀 <b style="color:red;">${this.meuId}</b> foi abatido!`,
                    type: "system",
                    time: Date.now()
                });
            }
        }
    }

    // ==========================================
    // UI, ESTILOS E TELAS
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v5')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v5';
        style.innerHTML = `
            :root { --lg-gold: #c5a059; --lg-panel: rgba(20, 20, 35, 0.95); }
            
            /* DOCK MOBILE OTIMIZADO PARA MOVIMENTAÇÃO (Pointer Events None) */
            .lg-mobile-dock {
                position: fixed; bottom: 0; left: 0; width: 100vw;
                display: flex; justify-content: space-evenly; align-items: flex-end;
                padding: 10px 0 calc(10px + env(safe-area-inset-bottom)) 0;
                z-index: 9000; 
                pointer-events: none; /* Permite arrastar o mapa pelos espaços vazios! */
            }
            .lg-dock-btn {
                background: linear-gradient(135deg, rgba(26,26,46,0.9), rgba(22,33,62,0.9));
                border: 2px solid var(--lg-gold); border-radius: 16px;
                width: 55px; height: 55px; display: flex; flex-direction: column;
                align-items: center; justify-content: center; color: #fff;
                font-size: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                backdrop-filter: blur(5px);
                pointer-events: auto; /* Apenas os botões são clicáveis */
                transition: transform 0.2s; touch-action: manipulation;
            }
            .lg-dock-btn:active { transform: scale(0.85); box-shadow: 0 0 20px var(--lg-gold); }
            .lg-dock-label { font-size: 0.6rem; font-weight: bold; margin-top: 4px; color: var(--lg-gold); text-transform: uppercase; }

            /* Modais e UI interna */
            .lg-popup {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(5px); z-index: 10000;
                display: none; align-items: flex-end; justify-content: center;
                opacity: 0; transition: opacity 0.3s ease;
            }
            .lg-popup.active { display: flex; opacity: 1; }
            .lg-popup-card {
                background: var(--lg-panel); border-top: 2px solid var(--lg-gold);
                border-radius: 24px 24px 0 0; width: 100%; max-width: 600px;
                padding: 24px 20px calc(24px + env(safe-area-inset-bottom)) 20px;
                color: #fff; display: flex; flex-direction: column; gap: 16px;
                max-height: 85vh; overflow-y: auto; transform: translateY(100%);
                transition: transform 0.3s;
            }
            .lg-popup.active .lg-popup-card { transform: translateY(0); }
            
            /* TELA DE MORTE */
            .lg-death-screen {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(40, 0, 0, 0.9); backdrop-filter: blur(10px);
                z-index: 10005; display: none; flex-direction: column;
                align-items: center; justify-content: center; text-align: center;
                color: #ff3333; opacity: 0; transition: opacity 1s;
            }
            .lg-death-screen.active { display: flex; opacity: 1; }
            .lg-death-title { font-size: 4rem; font-weight: 900; text-transform: uppercase; letter-spacing: 5px; text-shadow: 0 0 20px #ff0000; animation: pilar-luz 2s infinite alternate; }

            /* Canvas e Paleta */
            .lg-palette { display: flex; gap: 12px; overflow-x: auto; padding: 10px 5px; }
            .lg-color-dot {
                width: 44px; height: 44px; border-radius: 50%; border: 3px solid #333;
                flex-shrink: 0; cursor: pointer; transition: all 0.3s;
                position: relative;
            }
            .lg-color-dot.active { border-color: #fff; transform: scale(1.15) translateY(-5px); box-shadow: 0 10px 20px var(--lg-gold); }
            .lg-color-locked { filter: grayscale(100%) opacity(0.4); cursor: not-allowed; }
            .lg-color-locked::after { content: "🔒"; position: absolute; top:50%; left:50%; transform: translate(-50%, -50%); font-size:1.2rem; }
            
            .lg-canvas-box { width: 100%; height: 50vh; background: #070710; border: 2px dashed #444; border-radius: 16px; touch-action: none; position: relative; }
            .lg-cooldown-bar { position: absolute; bottom: 0; left: 0; height: 4px; background: var(--lg-gold); width: 0%; transition: width linear; }

            /* Efeitos */
            .lg-effect-layer { position: fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9998; overflow: hidden; }
            @keyframes float-up { 0% { transform: translateY(0); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-80px); opacity: 0; } }
            @keyframes shake { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(-10px, 10px); } 50% { transform: translate(10px, -10px); } 75% { transform: translate(-10px, -10px); } }
            
            /* Animações Formas Reais */
            .lg-anim-O { animation: burstO 0.8s ease-out forwards; border-radius:50%; border: 8px solid; position:absolute; }
            @keyframes burstO { 0% { width:10px; height:10px; opacity:1; } 100% { width:300px; height:300px; opacity:0; border-width: 1px;} }
            
            .lg-anim-X { position:absolute; width: 150px; height: 150px; display:flex; align-items:center; justify-content:center; animation: slashX 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
            .lg-anim-X::before, .lg-anim-X::after { content:''; position:absolute; background: currentColor; box-shadow: 0 0 20px currentColor; }
            .lg-anim-X::before { width: 100%; height: 10px; transform: rotate(45deg); }
            .lg-anim-X::after { width: 10px; height: 100%; transform: rotate(45deg); }
            @keyframes slashX { 0% { transform: scale(0); opacity:1; } 50% { transform: scale(1.5); } 100% { transform: scale(2); opacity:0; } }
            
            .lg-anim-Z { position:absolute; font-size: 150px; font-weight:900; font-family:sans-serif; color: currentColor; text-shadow: 0 0 30px currentColor; animation: boltZ 0.6s steps(5) forwards; }
            @keyframes boltZ { 0% { clip-path: polygon(0 0, 100% 0, 100% 0, 0 0); opacity:1; transform: translateY(-50px); } 100% { clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%); opacity:0; transform: translateY(50px); } }
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

        // Dock
        const dock = document.createElement('div');
        dock.className = 'lg-mobile-dock';
        dock.innerHTML = `
            <div class="lg-dock-btn" id="lg-btn-ateliere">🎨</div>
            <div class="lg-dock-btn" id="lg-btn-mochila">📜</div>
            <div class="lg-dock-btn" id="lg-btn-farm">🌾</div>
            <div class="lg-dock-btn" id="lg-btn-loja">⚒️</div>
            <div class="lg-dock-btn" id="lg-btn-base">🏛️</div>
        `;
        document.body.appendChild(dock);

        const criarSheet = (id, icone, titulo, subtitulo, conteudo) => {
            const popup = document.createElement('div');
            popup.id = id;
            popup.className = 'lg-popup';
            popup.innerHTML = `
                <div class="lg-popup-card">
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; color:var(--lg-gold); display:flex; align-items:center; gap:8px;">${icone} ${titulo}</h3>
                        <button class="lg-close-btn" style="background:transparent; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:0.9rem; color:#aaa;">${subtitulo}</div>
                    ${conteudo}
                </div>
            `;
            document.body.appendChild(popup);
        };

        criarSheet('lg-modal-canvas', '🎨', 'Ateliê Tático', 'Trace: <b>O</b> (Área/Aura), <b>X</b> (Direto/Corte), <b>Z</b> (Efeito Rápido).', `
            <div class="lg-palette" id="lg-palette-select"></div>
            <div class="lg-canvas-box">
                <canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas>
                <div id="lg-cooldown-bar" class="lg-cooldown-bar"></div>
            </div>
            <div style="display:flex; gap:12px;">
                <button id="lg-btn-limpar" style="flex:1; background:#2a2a3e; color:#fff; border:none; padding:12px; border-radius:12px; font-weight:bold;">Limpar</button>
                <button id="lg-btn-guardar" style="flex:2; background:var(--lg-gold); color:#000; font-weight:900; border:none; padding:12px; border-radius:12px;">Materializar</button>
            </div>
        `);

        criarSheet('lg-modal-mochila', '📜', 'Mochila Arcana', 'Escolha o alvo e libere a magia.', `
            <select id="lg-alvo-select" style="background:#1a1a2e; color:#fff; padding:12px; border-radius:8px; width:100%; margin-bottom:10px;"></select>
            <div id="lg-folhas-container" style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;"></div>
        `);

        // Cria tela de Morte
        const deathScreen = document.createElement('div');
        deathScreen.id = 'lg-death-screen';
        deathScreen.className = 'lg-death-screen';
        deathScreen.innerHTML = `
            <div class="lg-death-title">VOCÊ MORREU</div>
            <p style="color:#aaa; margin: 20px 0;">Sua energia vital se esgotou no campo de batalha.</p>
            <button id="lg-btn-renascer" style="background:#ff0000; color:#fff; border:2px solid #fff; padding:15px 30px; font-size:1.2rem; font-weight:bold; border-radius:10px; cursor:pointer;">RENASCER NA BASE</button>
        `;
        document.body.appendChild(deathScreen);

        this.vincularEventosModais();
        this.renderizarPaleta();
    }

    renderizarPaleta() {
        const container = document.getElementById('lg-palette-select');
        if (!container) return;
        container.innerHTML = '';

        const myLevel = this.state.stats.level || 1;

        Object.keys(this.tintas).forEach(corKey => {
            const cor = this.tintas[corKey];
            const dot = document.createElement('div');
            
            if (myLevel >= cor.nivelReq) {
                dot.className = `lg-color-dot ${corKey === this.corAtiva ? 'active' : ''}`;
                dot.style.backgroundColor = cor.hex;
                dot.title = `${cor.nome} (Custo: ${cor.custo})`;
                dot.addEventListener('click', () => {
                    document.querySelectorAll('.lg-color-dot').forEach(d => d.classList.remove('active'));
                    dot.classList.add('active');
                    this.corAtiva = corKey;
                });
            } else {
                dot.className = 'lg-color-dot lg-color-locked';
                dot.style.backgroundColor = cor.hex;
                dot.title = `Desbloqueia no Nv ${cor.nivelReq}`;
            }
            container.appendChild(dot);
        });
    }

    vincularEventosModais() {
        const togglePopup = (id) => {
            if (this.morto) return; // Impede abrir menus se morto
            document.querySelectorAll('.lg-popup').forEach(p => p.classList.remove('active'));
            document.getElementById(id).classList.add('active');
        };

        document.getElementById('lg-btn-ateliere').onclick = () => { this.renderizarPaleta(); togglePopup('lg-modal-canvas'); setTimeout(()=>this.redimensionarCanvas(), 300); };
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarListaDeAlvos(); this.atualizarUIFolhas(); togglePopup('lg-modal-mochila'); };
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();
        document.getElementById('lg-btn-renascer').onclick = () => this.retornarABase();

        document.querySelectorAll('.lg-close-btn').forEach(btn => {
            btn.onclick = (e) => e.target.closest('.lg-popup').classList.remove('active');
        });

        document.getElementById('lg-btn-limpar').onclick = () => this.limparCanvas();
        document.getElementById('lg-btn-guardar').onclick = () => this.guardarDesenho();

        const selectAlvo = document.getElementById('lg-alvo-select');
        if (selectAlvo) selectAlvo.onchange = (e) => { this.alvoSelecionado = e.target.value; };
    }

    // ==========================================
    // CANVA E DESENHO
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
            ctx.lineWidth = 10;
            ctx.lineCap = 'round'; ctx.lineJoin = 'round';
            ctx.shadowBlur = 20; ctx.shadowColor = this.tintas[this.corAtiva].hex;
        };

        const draw = (e) => {
            if (!this.desenhandoCanvas) return;
            e.preventDefault();
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            
            if (this.pontosDesenho.length > 2) {
                const p1 = this.pontosDesenho[this.pontosDesenho.length - 2];
                const p2 = this.pontosDesenho[this.pontosDesenho.length - 1];
                const xc = (p1.x + p2.x) / 2;
                const yc = (p1.y + p2.y) / 2;
                ctx.quadraticCurveTo(p1.x, p1.y, xc, yc);
                ctx.stroke();
            }
        };

        const stopDraw = (e) => {
            if (!this.desenhandoCanvas) return;
            e.preventDefault();
            this.desenhandoCanvas = false;
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseleave', stopDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDraw, { passive: false });
    }

    redimensionarCanvas() {
        const canvas = document.getElementById('lg-paint-canvas');
        if (!canvas) return;
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
        this.limparCanvas();
    }

    limparCanvas() {
        const canvas = document.getElementById('lg-paint-canvas');
        if (!canvas) return;
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
        this.pontosDesenho = [];
    }

    reconhecerForma() {
        const pts = this.pontosDesenho;
        if (pts.length < 10) return null; 

        const start = pts[0];
        const end = pts[pts.length - 1];
        const distStartEnd = Math.hypot(end.x - start.x, end.y - start.y);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        pts.forEach(p => {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        });

        const width = maxX - minX;
        const height = maxY - minY;

        if (distStartEnd < 90 && width > 40 && height > 40) return 'O'; 

        let mudancasX = 0;
        for (let i = 3; i < pts.length - 3; i+=3) {
            const dirPrevX = pts[i].x - pts[i - 3].x;
            const dirNextX = pts[i + 3].x - pts[i].x;
            if ((dirPrevX > 0 && dirNextX < 0) || (dirPrevX < 0 && dirNextX > 0)) mudancasX++;
        }

        if (mudancasX >= 1 && width > 30) return 'Z';
        return 'X';
    }

    guardarDesenho() {
        const level = this.state.stats.level || 1;
        
        // Anti-Spam: Limita a velocidade de criação até o level 30
        if (level < 30) {
            const agora = Date.now();
            const tempoRestante = this.tempoRecargaBase - (agora - this.ultimoDesenhoTempo);
            if (tempoRestante > 0) {
                return this.animacaoTextoFlutuante(`Aguarde ${(tempoRestante/1000).toFixed(1)}s`, "#ffff00");
            }
            this.ultimoDesenhoTempo = agora;
            
            // Anima barra de cooldown
            const barra = document.getElementById('lg-cooldown-bar');
            if(barra) {
                barra.style.transition = 'none'; barra.style.width = '100%';
                setTimeout(() => { barra.style.transition = `width ${this.tempoRecargaBase}ms linear`; barra.style.width = '0%'; }, 50);
            }
        }

        if (this.folhasGuardadas.length >= this.maxFolhas) return this.animacaoTextoFlutuante("Mochila Cheia!", "#ff0000");

        const forma = this.reconhecerForma();
        if (!forma) return this.animacaoTextoFlutuante("Traço Falhou", "#ff8c00");

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) return this.animacaoTextoFlutuante(`Sem Mana (${corData.custo})`, "#00bfff");

        this.state.stats.mana -= corData.custo;
        this.folhasGuardadas.push({ id: Date.now(), forma: forma, corKey: this.corAtiva, corHex: corData.hex, nomeCor: corData.nome, apSnapshot: this.state.stats.ap || 0 });

        this.limparCanvas();
        this.animacaoTextoFlutuante(`Magia Pronta: ${forma}`, corData.hex);
        document.getElementById('lg-modal-canvas').classList.remove('active');
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.style = `border:2px solid ${folha.corHex}; background:#0b0b18; padding:10px; border-radius:8px; text-align:center;`;
            card.innerHTML = `
                <div style="font-size:2rem; font-weight:900; color:${folha.corHex};">${folha.forma}</div>
                <div style="font-size:0.7rem; color:#fff; margin:5px 0;">${folha.nomeCor}</div>
                <button style="background:${folha.corHex}; color:#000; border:none; width:100%; padding:8px; border-radius:5px; font-weight:bold; cursor:pointer;">Lançar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(index);
            container.appendChild(card);
        });
    }

    // ==========================================
    // SISTEMA DE MAGIAS REAIS (21 COMBINAÇÕES)
    // ==========================================
    ativarFolha(index) {
        const folha = this.folhasGuardadas[index];
        if (!folha || !this.alvoSelecionado) return;

        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').classList.remove('active');

        this.executarEfeitoRealEAnimar(folha.forma, folha.corKey, folha.apSnapshot, this.alvoSelecionado);
    }

    executarEfeitoRealEAnimar(forma, corKey, apSnap, alvoId) {
        const ap = apSnap || this.state.stats.ap || 0;
        const tinta = this.tintas[corKey];
        
        let nomeEfeito = ""; let resumo = ""; let poder = 0;

        // O = Área/Aura/Defesa | X = Dano Direto/Focado | Z = Efeito Secundário/DoT/Velocidade
        switch (corKey) {
            case 'red':
                if (forma === 'O') { poder = ap * 2.0; nomeEfeito = "Explosão de Área"; }
                if (forma === 'X') { poder = ap * 3.5; nomeEfeito = "Corte Ígneo (Focado)"; }
                if (forma === 'Z') { poder = ap * 1.5; nomeEfeito = "Rastro de Chamas"; this.aplicarDanoRede(alvoId, poder); } // Dano duplo simulando DoT
                this.aplicarDanoRede(alvoId, poder); resumo = `Causou ${Math.floor(poder)} de Dano.`;
                break;
            case 'orange':
                if (forma === 'O') { poder = ap * 1.5; nomeEfeito = "Aura de Sanguessuga"; this.curar(poder); resumo = `Curou ${Math.floor(poder)} HP em área.`;}
                if (forma === 'X') { poder = ap * 2.5; nomeEfeito = "Fio de Sangue"; this.curar(poder/2); this.aplicarDanoRede(alvoId, poder); resumo = `Drenou ${Math.floor(poder)} HP.`;}
                if (forma === 'Z') { poder = ap * 1.0; nomeEfeito = "Corrupção"; this.state.stats.maxHp += 5; this.aplicarDanoRede(alvoId, poder); resumo = `Roubou +5 HP Máximo.`; }
                break;
            case 'yellow':
                if (forma === 'O') { poder = 50 + (ap * 0.5); nomeEfeito = "Transmutação"; this.state.gold = (this.state.gold||0) + poder; resumo = `Farmou ${Math.floor(poder)} Ouro.`; }
                if (forma === 'X') { poder = ap * 2.0; nomeEfeito = "Raio Cegante"; this.aplicarDanoRede(alvoId, poder); resumo = `Deu Dano Crítico de Luz.`; }
                if (forma === 'Z') { nomeEfeito = "Passos de Trovão"; this.state.stats.manaRegen += 2; resumo = `Aumentou Regen de Mana Permanente (+2).`; }
                break;
            case 'green':
                if (forma === 'O') { poder = ap * 2.5; nomeEfeito = "Florescimento"; this.curar(poder); this.state.stats.shield = (this.state.stats.shield||0) + poder/2; resumo = `Curou e Escudou.`; }
                if (forma === 'X') { poder = ap * 1.8; nomeEfeito = "Lança de Madeira"; this.aplicarDanoRede(alvoId, poder); resumo = `Perfurou alvo em ${Math.floor(poder)}.`; }
                if (forma === 'Z') { nomeEfeito = "Crescimento Natural"; this.state.stats.maxHp += 30; this.curar(30); resumo = `Ganhou +30 HP Máx Permanente.`; }
                break;
            case 'blue':
                if (forma === 'O') { poder = ap * 3.0; nomeEfeito = "Bolha Protetora"; this.state.stats.shield = (this.state.stats.shield||0) + poder; resumo = `Gerou ${Math.floor(poder)} de Escudo Absoluto.`; }
                if (forma === 'X') { poder = ap * 2.8; nomeEfeito = "Jato de Pressão"; this.aplicarDanoRede(alvoId, poder); resumo = `Afogou alvo em ${Math.floor(poder)} Dano.`; }
                if (forma === 'Z') { nomeEfeito = "Correnteza"; this.state.stats.mana += 100; resumo = `Recuperou 100 de Mana Instantânea.`; }
                break;
            case 'purple':
                if (forma === 'O') { poder = ap * 2.0; nomeEfeito = "Poço Gravitacional"; this.aplicarDanoRede(alvoId, poder); resumo = `Esmagou o alvo.`; }
                if (forma === 'X') { poder = ap * 4.0; nomeEfeito = "Lâmina do Vazio"; this.aplicarDanoRede(alvoId, poder); resumo = `Dano Massivo Mágico (${Math.floor(poder)}).`; }
                if (forma === 'Z') { nomeEfeito = "Ceifador Negro"; poder = ap * 1.5; this.aplicarDanoRede(alvoId, poder); this.curar(poder*0.8); resumo = `Dano Verdadeiro com Retorno.`; }
                break;
            case 'white':
                if (forma === 'O') { nomeEfeito = "Purificação Global"; this.curar(this.state.stats.maxHp); this.state.stats.shield = this.state.stats.maxHp; resumo = `HP Cheio + Escudo Máximo!`; }
                if (forma === 'X') { poder = ap * 5.0; nomeEfeito = "Julgamento Divino"; this.aplicarDanoRede(alvoId, poder); resumo = `Apagou o inimigo (${Math.floor(poder)}).`; }
                if (forma === 'Z') { nomeEfeito = "Ascensão"; this.state.stats.ap += 10; resumo = `Ganhou +10 AP Permanente!`; }
                break;
        }

        atualizarUI();
        this.emitirEventoDeRede(forma, corKey, tinta.hex, alvoId, Math.floor(poder), nomeEfeito);
        this.animacaoTextoFlutuante(nomeEfeito, tinta.hex);
    }

    aplicarDanoRede(alvoId, dano) {
        if (alvoId === this.meuId) {
            let hpAtual = this.state.stats.hp;
            let shield = this.state.stats.shield || 0;
            if (shield > 0) {
                if (dano > shield) { dano -= shield; this.state.stats.shield = 0; hpAtual -= dano; } 
                else { this.state.stats.shield -= dano; }
            } else { hpAtual -= dano; }
            
            this.state.stats.hp = Math.max(0, hpAtual);
            atualizarUI();
            return;
        }

        if (!this.multiplayerAtivo || !this.state.roomName) return;
        const alvoRef = ref(this.db, `rooms/${this.state.roomName}/players/${alvoId}/stats`);
        get(alvoRef).then(snap => {
            const stats = snap.val();
            if (stats) {
                let hp = stats.hp || 0; let shield = stats.shield || 0;
                if (shield > 0) {
                    if (dano >= shield) { dano -= shield; shield = 0; hp = Math.max(0, hp - dano); } 
                    else { shield -= dano; }
                } else { hp = Math.max(0, hp - dano); }
                update(alvoRef, { hp: hp, shield: shield });
            }
        });
    }

    curar(valor) {
        this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor);
        atualizarUI();
    }

    // ==========================================
    // SISTEMA DE ANIMAÇÕES DINÂMICAS 21 FORMAS
    // ==========================================
    renderizarEventoVisualGlobal(ev) {
        const isTarget = ev.targetId === this.meuId;
        const layer = document.getElementById('lg-effect-layer');
        if (!layer) return;

        if (isTarget && ev.valor > 0) {
            document.body.style.animation = 'none'; void document.body.offsetWidth;
            document.body.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
        }

        // Gera Elemento baseado na FORMA (O, X, Z) e Colore com a COR
        const ef = document.createElement('div');
        ef.style.position = 'absolute'; ef.style.top = '50%'; ef.style.left = '50%'; ef.style.transform = 'translate(-50%, -50%)';
        ef.style.color = ev.hexColor;
        
        if (ev.forma === 'O') {
            ef.className = 'lg-anim-O';
            ef.style.borderColor = ev.hexColor;
        } else if (ev.forma === 'X') {
            ef.className = 'lg-anim-X';
        } else if (ev.forma === 'Z') {
            ef.className = 'lg-anim-Z';
            ef.innerText = 'Z';
        }

        layer.appendChild(ef);
        setTimeout(() => ef.remove(), 1000);

        if (ev.valor > 0) {
            const span = document.createElement('div');
            span.style = `position:absolute; font-size:2.5rem; font-weight:900; color:${ev.hexColor}; -webkit-text-stroke:1px black; animation:float-up 1s forwards; left:calc(50% + ${(Math.random()-0.5)*100}px); top:calc(50% + ${(Math.random()-0.5)*50}px);`;
            span.innerText = isTarget ? `-${ev.valor}` : `Dano!`;
            layer.appendChild(span);
            setTimeout(() => span.remove(), 1000);
        }
    }

    animacaoTextoFlutuante(texto, cor) {
        const t = document.createElement('div');
        t.style = `position:fixed; top:30%; left:50%; transform:translate(-50%,-50%); color:${cor}; font-size:1.5rem; font-weight:900; text-shadow:0 0 10px #000; z-index:10001; pointer-events:none; animation:float-up 1.3s forwards;`;
        t.innerText = texto;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 1300);
    }
}
