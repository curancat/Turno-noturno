import { ref, push, onValue, onChildAdded, set, update, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;

        this.corAtiva = 'red';
        this.alvoSelecionado = null; // Agora será dinâmico baseado nos jogadores
        this.jogadoresNaSala = {};
        this.folhasGuardadas = []; 
        this.maxFolhas = 3;

        this.multiplayerAtivo = false;
        this.desenhandoCanvas = false;
        this.pontosDesenho = [];

        // Sistema de Tintas (Escala com AP; recarga exclusiva na Base)
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25, tipoAnimacao: 'explosao' },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20, tipoAnimacao: 'drenagem' },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15, tipoAnimacao: 'raio' },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30, tipoAnimacao: 'espiral' },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25, tipoAnimacao: 'escudo' },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35, tipoAnimacao: 'implosao' },
            white: { nome: 'Luz Absoluta (Divino)', hex: '#ffffff', custo: 60, tipoAnimacao: 'pilar' }
        };

        this.minigameAtivo = false;
        this.minigameScore = 0;
        this.minigameTimer = null;
        
        // Identificador único do jogador (usando o nome ou ID do state)
        this.meuId = this.state.playerName || `Litlegot_${Math.floor(Math.random() * 1000)}`;
    }

    iniciar() {
        this.injetarCSSMobileEPopups();
        this.criarPopupsEModais();
        this.iniciarMonitoramentoMultiplayer();
        this.iniciarSincronizacaoDeEventosVisuais();
        this.vincularCanvasEventos();
        this.atualizarTintaEstatistica();
        
        // Bloqueia regeneração automática por tempo
        this.state.stats.manaRegen = 0;
        this.state.stats.mana = this.state.stats.maxMana;
        atualizarUI();
    }

    // ==========================================
    // MULTIPLAYER, MIRA REAL E REDE DE EVENTOS
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
                
                if (this.multiplayerAtivo) {
                    this.state.modoSimulado = false;
                }
                this.atualizarListaDeAlvos();
            }
        });
    }

    iniciarSincronizacaoDeEventosVisuais() {
        if (!this.state.roomName) return;
        const eventsRef = ref(this.db, `rooms/${this.state.roomName}/battle_events`);
        
        // Ouve eventos lançados por qualquer jogador na sala para renderizar animações
        onChildAdded(eventsRef, (snapshot) => {
            const evento = snapshot.val();
            // Ignora eventos muito antigos (mais de 10 segundos)
            if (Date.now() - evento.timestamp > 10000) return;
            
            this.renderizarEventoVisualGlobal(evento);
        });
    }

    atualizarListaDeAlvos() {
        const selectAlvo = document.getElementById('lg-alvo-select');
        if (!selectAlvo) return;
        
        const alvoAnterior = selectAlvo.value;
        selectAlvo.innerHTML = ''; // Limpa botões fantasmas/simulados
        
        // Adiciona a si mesmo
        const optionSelf = document.createElement('option');
        optionSelf.value = this.meuId;
        optionSelf.innerText = `🧍 Si Mesmo (${this.meuId})`;
        selectAlvo.appendChild(optionSelf);

        // Adiciona outros jogadores da sala
        Object.keys(this.jogadoresNaSala).forEach(playerId => {
            if (playerId !== this.meuId) {
                const option = document.createElement('option');
                option.value = playerId;
                const hpAlvo = this.jogadoresNaSala[playerId].stats?.hp || '???';
                option.innerText = `⚔️ Inimigo: ${playerId} (HP: ${hpAlvo})`;
                selectAlvo.appendChild(option);
            }
        });

        // Tenta manter o alvo anterior, se ainda existir
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
        if (!this.multiplayerAtivo) {
            this.animacaoTextoFlutuante("Aviso: Sala Vazia - Base Restrita!", "#ffaa00");
        }
        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana;
        this.state.stats.hp = this.state.stats.maxHp;
        
        // Efeito global de base
        this.emitirEventoDeRede('pilar', '#00ffcc', this.meuId, `+${this.state.stats.maxHp}`, 'Retorno à Base');
        atualizarUI();
    }

    // ==========================================
    // UI MOBILE AVANÇADA, DOCK E BOTTOM SHEETS
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v4')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v4';
        style.innerHTML = `
            :root {
                --lg-gold: #c5a059;
                --lg-dark: #0f0f1a;
                --lg-panel: rgba(20, 20, 35, 0.95);
            }
            
            /* Dock Mobile Inferior Substituto dos FABs fantasmas/sobrepostos */
            .lg-mobile-dock {
                position: fixed; bottom: 0; left: 0; width: 100vw;
                background: linear-gradient(to top, #05050a 50%, transparent);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                display: flex; justify-content: space-evenly; align-items: flex-end;
                padding: 10px 0 calc(10px + env(safe-area-inset-bottom)) 0;
                z-index: 9999; border-top: 1px solid rgba(197, 160, 89, 0.2);
            }
            .lg-dock-btn {
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid var(--lg-gold); border-radius: 16px;
                width: 55px; height: 55px; display: flex; flex-direction: column;
                align-items: center; justify-content: center; color: #fff;
                font-size: 1.5rem; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                touch-action: manipulation; -webkit-tap-highlight-color: transparent;
            }
            .lg-dock-btn:active { transform: scale(0.85) translateY(5px); box-shadow: 0 0 20px var(--lg-gold); }
            .lg-dock-label { font-size: 0.6rem; font-weight: bold; margin-top: 4px; color: var(--lg-gold); text-transform: uppercase; }

            /* Bottom Sheet Modals (Melhor UX Mobile) */
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
                color: #fff; box-shadow: 0 -10px 40px rgba(0,0,0,0.8);
                display: flex; flex-direction: column; gap: 16px;
                max-height: 85vh; overflow-y: auto; transform: translateY(100%);
                transition: transform 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
            }
            .lg-popup.active .lg-popup-card { transform: translateY(0); }
            
            .lg-header-handle {
                width: 40px; height: 5px; background: rgba(255,255,255,0.3);
                border-radius: 3px; margin: -10px auto 15px auto;
            }

            /* Inputs e UI Interna */
            .lg-canvas-box {
                width: 100%; height: 60vh; max-height: 350px; background: #070710; 
                border: 2px dashed #444; border-radius: 16px; touch-action: none; 
                position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
            }
            .lg-palette { display: flex; gap: 12px; overflow-x: auto; padding: 10px 5px; scrollbar-width: none; }
            .lg-palette::-webkit-scrollbar { display: none; }
            .lg-color-dot {
                width: 44px; height: 44px; border-radius: 50%; border: 3px solid #333;
                flex-shrink: 0; cursor: pointer; transition: all 0.3s;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            }
            .lg-color-dot.active { border-color: #fff; transform: scale(1.15) translateY(-5px); box-shadow: 0 10px 20px var(--lg-gold); }
            
            .lg-select-modern {
                background: #1a1a2e; color: #fff; padding: 16px; font-size: 1.1rem;
                border: 1px solid var(--lg-gold); border-radius: 12px; font-weight: bold;
                width: 100%; appearance: none; outline: none; text-align: center;
            }

            .lg-grid-folhas { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 12px; }
            .lg-folha-card {
                border: 2px solid; background: #0b0b18; border-radius: 12px;
                padding: 16px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.4);
                transition: transform 0.2s; cursor: pointer;
            }
            .lg-folha-card:active { transform: scale(0.95); }

            /* Efeitos Globais Complexos (Rede) */
            .lg-effect-layer {
                position: fixed; top:0; left:0; width:100vw; height:100vh;
                pointer-events:none; z-index:9998; overflow: hidden;
            }
            
            @keyframes shockwave {
                0% { transform: scale(0) translate(-50%, -50%); opacity: 1; border-width: 10px; }
                100% { transform: scale(4) translate(-12.5%, -12.5%); opacity: 0; border-width: 1px; }
            }
            @keyframes implode {
                0% { transform: scale(3) translate(-16.6%, -16.6%); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: scale(0) translate(-50%, -50%); opacity: 0; filter: blur(5px); }
            }
            @keyframes shake {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                20% { transform: translate(-5px, 5px) rotate(-1deg); }
                40% { transform: translate(5px, -5px) rotate(1deg); }
                60% { transform: translate(-5px, -5px) rotate(-1deg); }
                80% { transform: translate(5px, 5px) rotate(1deg); }
            }
            @keyframes pilar-luz {
                0% { height: 0; opacity: 0; bottom: 50%; }
                20% { height: 100vh; opacity: 1; bottom: 0; }
                80% { height: 100vh; opacity: 1; bottom: 0; filter: brightness(2); }
                100% { height: 100vh; opacity: 0; bottom: 0; width: 0; }
            }
            @keyframes float-up {
                0% { transform: translateY(0) scale(0.8); opacity: 0; }
                20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
                80% { transform: translateY(-60px) scale(1); opacity: 1; }
                100% { transform: translateY(-80px) scale(0.8); opacity: 0; }
            }
            .lg-damage-text {
                position: absolute; font-size: 2.5rem; font-weight: 900; font-family: 'Arial Black', sans-serif;
                -webkit-text-stroke: 2px black; pointer-events: none; text-shadow: 0px 5px 15px rgba(0,0,0,0.8);
                animation: float-up 1.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                transform: translateX(-50%);
            }
            .lg-particle { position: absolute; border-radius: 50%; pointer-events: none; }
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

        // Dock de Navegação Substituto (Focado em Mobile)
        const dock = document.createElement('div');
        dock.className = 'lg-mobile-dock';
        dock.innerHTML = `
            <div class="lg-dock-btn" id="lg-btn-ateliere">🎨<span class="lg-dock-label">Arte</span></div>
            <div class="lg-dock-btn" id="lg-btn-mochila">📜<span class="lg-dock-label">Mochila</span></div>
            <div class="lg-dock-btn" id="lg-btn-farm">🌾<span class="lg-dock-label">Farm</span></div>
            <div class="lg-dock-btn" id="lg-btn-loja">⚒️<span class="lg-dock-label">Forja</span></div>
            <div class="lg-dock-btn" id="lg-btn-base">🏛️<span class="lg-dock-label">Base</span></div>
        `;
        document.body.appendChild(dock);

        const criarSheet = (id, icone, titulo, subtitulo, conteudo) => {
            const popup = document.createElement('div');
            popup.id = id;
            popup.className = 'lg-popup';
            popup.innerHTML = `
                <div class="lg-popup-card">
                    <div class="lg-header-handle"></div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; color:var(--lg-gold); font-size:1.4rem; display:flex; align-items:center; gap:8px;">${icone} ${titulo}</h3>
                        <button class="lg-close-btn" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:36px; height:36px; border-radius:50%; font-size:1.2rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
                    </div>
                    <div style="font-size:0.9rem; color:#aaa; margin-bottom: 8px;">${subtitulo}</div>
                    ${conteudo}
                </div>
            `;
            document.body.appendChild(popup);
        };

        // Modal 1: Canvas
        criarSheet('lg-modal-canvas', '🎨', 'Ateliê Tático', 'Trace: <b>O</b> (Círculo), <b>X</b> (Cruz) ou <b>Z</b> (Zigue-zague).', `
            <div class="lg-palette" id="lg-palette-select"></div>
            <div class="lg-canvas-box"><canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas></div>
            <div style="display:flex; gap:12px; margin-top:8px;">
                <button id="lg-btn-limpar" style="flex:1; background:#2a2a3e; color:#fff; border:none; padding:16px; border-radius:12px; font-weight:bold; font-size:1.1rem;">Limpar</button>
                <button id="lg-btn-guardar" style="flex:2; background:var(--lg-gold); color:#000; font-weight:900; border:none; padding:16px; border-radius:12px; font-size:1.1rem; box-shadow: 0 4px 15px rgba(197,160,89,0.4);">Materializar Tinta</button>
            </div>
        `);

        // Modal 2: Mochila
        criarSheet('lg-modal-mochila', '📜', 'Mochila Arcana', 'Selecione a entidade conectada e aplique a arte:', `
            <select id="lg-alvo-select" class="lg-select-modern"></select>
            <div class="lg-grid-folhas" id="lg-folhas-container" style="margin-top:10px;"></div>
        `);

        // Modal 3: Minigame
        criarSheet('lg-modal-farm', '🌾', 'Rito de Farm', 'Toque rápido nas runas. O ouro flui com reflexos.', `
            <div style="position:relative; width:100%; height:320px; background:radial-gradient(circle, #1a1a2e, #04040a); border:2px solid #333; border-radius:16px; overflow:hidden;" id="lg-farm-arena">
                <div id="lg-farm-status" style="position:absolute; top:12px; left:12px; color:#fff; font-size:1.2rem; font-weight:bold; text-shadow:0 2px 4px #000; z-index:2;">Pontos: 0</div>
            </div>
            <button id="lg-start-farm" style="background:linear-gradient(90deg, #28a745, #218838); color:#fff; border:none; padding:16px; border-radius:12px; font-weight:900; font-size:1.2rem; width:100%; box-shadow:0 4px 15px rgba(40,167,69,0.4);">Iniciar Rito</button>
        `);

        // Modal 4: Loja
        criarSheet('lg-modal-loja', '⚒️', 'Forja Física', '<span style="color:#ff4444;">Sacrifício Mítico: Transmuta 25% do HP Máximo em atributos permanentes.</span>', `
            <div style="display:flex; flex-direction:column; gap:16px; margin-top:8px;">
                <button class="lg-craft-item" data-item="espada" style="background:rgba(26,26,46,0.8); color:#fff; border:2px solid var(--lg-gold); padding:16px; border-radius:12px; text-align:left; font-size:1.05rem; display:flex; align-items:center; gap:12px;">
                    <span style="font-size:2rem;">⚔️</span> <div><b>Espada Longa (+35 AD)</b><br><small style="color:#aaa;">Dano de ataque físico direto.</small></div>
                </button>
                <button class="lg-craft-item" data-item="tomo" style="background:rgba(26,26,46,0.8); color:#fff; border:2px solid var(--lg-gold); padding:16px; border-radius:12px; text-align:left; font-size:1.05rem; display:flex; align-items:center; gap:12px;">
                    <span style="font-size:2rem;">📘</span> <div><b>Tomo Amplificador (+50 AP)</b><br><small style="color:#aaa;">Potencializa as magias de tinta.</small></div>
                </button>
                <button class="lg-craft-item" data-item="cristal" style="background:rgba(26,26,46,0.8); color:#fff; border:2px solid var(--lg-gold); padding:16px; border-radius:12px; text-align:left; font-size:1.05rem; display:flex; align-items:center; gap:12px;">
                    <span style="font-size:2rem;">💎</span> <div><b>Cristal de Rubi (+300 HP)</b><br><small style="color:#aaa;">Resiliência celular expandida.</small></div>
                </button>
            </div>
        `);

        this.vincularEventosModais();
        this.renderizarPaleta();
    }

    renderizarPaleta() {
        const container = document.getElementById('lg-palette-select');
        if (!container) return;
        container.innerHTML = '';

        Object.keys(this.tintas).forEach(corKey => {
            const cor = this.tintas[corKey];
            const dot = document.createElement('div');
            dot.className = `lg-color-dot ${corKey === this.corAtiva ? 'active' : ''}`;
            dot.style.backgroundColor = cor.hex;
            dot.title = `${cor.nome} (Custo: ${cor.custo})`;
            dot.addEventListener('click', () => {
                document.querySelectorAll('.lg-color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                this.corAtiva = corKey;
            });
            container.appendChild(dot);
        });
    }

    vincularEventosModais() {
        const togglePopup = (id, show) => {
            const popup = document.getElementById(id);
            if (popup) {
                if (show) {
                    popup.classList.add('active');
                } else {
                    popup.classList.remove('active');
                }
            }
        };

        // Eventos do Dock
        document.getElementById('lg-btn-ateliere').onclick = () => { togglePopup('lg-modal-canvas', true); setTimeout(()=>this.redimensionarCanvas(), 300); };
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarListaDeAlvos(); this.atualizarUIFolhas(); togglePopup('lg-modal-mochila', true); };
        document.getElementById('lg-btn-farm').onclick = () => { togglePopup('lg-modal-farm', true); };
        document.getElementById('lg-btn-loja').onclick = () => { togglePopup('lg-modal-loja', true); };
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();

        // Fechar modais
        document.querySelectorAll('.lg-close-btn').forEach(btn => {
            btn.onclick = (e) => e.target.closest('.lg-popup').classList.remove('active');
        });
        
        // Clicar fora do card para fechar
        document.querySelectorAll('.lg-popup').forEach(popup => {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) popup.classList.remove('active');
            });
        });

        document.getElementById('lg-btn-limpar').onclick = () => this.limparCanvas();
        document.getElementById('lg-btn-guardar').onclick = () => this.guardarDesenho();
        document.getElementById('lg-start-farm').onclick = () => this.iniciarMinigameFarm();

        document.querySelectorAll('.lg-craft-item').forEach(btn => {
            btn.onclick = (e) => this.criarItemDaLoja(e.currentTarget.dataset.item);
        });

        const selectAlvo = document.getElementById('lg-alvo-select');
        if (selectAlvo) {
            selectAlvo.onchange = (e) => { this.alvoSelecionado = e.target.value; };
        }
    }

    // ==========================================
    // CANVA FLUIDO (MELHORIA PARA TOUCH/MOBILE)
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
            e.preventDefault(); // Previne scroll ao desenhar
            this.desenhandoCanvas = true;
            this.pontosDesenho = [];
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = this.tintas[this.corAtiva].hex;
            ctx.lineWidth = 8; // Traço mais grosso e visível mobile
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.tintas[this.corAtiva].hex;
        };

        const draw = (e) => {
            if (!this.desenhandoCanvas) return;
            e.preventDefault();
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            
            // Suavização simples (Bezier) para não ficar capenga
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
        canvas.addEventListener('touchcancel', stopDraw, { passive: false });
    }

    redimensionarCanvas() {
        const canvas = document.getElementById('lg-paint-canvas');
        if (!canvas) return;
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        this.limparCanvas();
    }

    limparCanvas() {
        const canvas = document.getElementById('lg-paint-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.pontosDesenho = [];
    }

    reconhecerForma() {
        const pts = this.pontosDesenho;
        if (pts.length < 15) return null; // Tolerância maior para toque

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

        // Deteção mais amigável
        if (distStartEnd < 80 && width > 40 && height > 40) return 'O'; // Tolerância de fechamento maior

        let mudancasX = 0;
        let mudancasY = 0;
        for (let i = 3; i < pts.length - 3; i+=3) {
            const dirPrevX = pts[i].x - pts[i - 3].x;
            const dirNextX = pts[i + 3].x - pts[i].x;
            if ((dirPrevX > 0 && dirNextX < 0) || (dirPrevX < 0 && dirNextX > 0)) mudancasX++;
        }

        if (mudancasX >= 1 && width > 30) return 'Z';
        return 'X';
    }

    guardarDesenho() {
        if (this.folhasGuardadas.length >= this.maxFolhas) {
            return this.animacaoTextoFlutuante("Mochila Cheia! Máx 3", "#ff0000");
        }

        const forma = this.reconhecerForma();
        if (!forma) {
            return this.animacaoTextoFlutuante("Traço Incompreensível!", "#ff8c00");
        }

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) {
            return this.animacaoTextoFlutuante(`Falta Mana: ${corData.custo} pts`, "#00bfff");
        }

        this.state.stats.mana -= corData.custo;
        this.folhasGuardadas.push({
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            forma: forma,
            cor: this.corAtiva,
            dadosCor: corData,
            timestamp: Date.now()
        });

        this.limparCanvas();
        this.animacaoTextoFlutuante("Materializado!", corData.hex);
        atualizarUI();
        
        // Atualiza a Mochila caso ela esteja aberta e fecha o Canvas
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-canvas').classList.remove('active');
    }

    // ==========================================
    // SISTEMA DE COMBATE / MOCHILA DE MAGIAS
    // ==========================================
    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<p style="color:#aaa; grid-column: 1/-1; text-align: center;">Sua mochila arcana está vazia. Crie artes no Ateliê.</p>';
            return;
        }

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = folha.dadosCor.hex;
            card.innerHTML = `
                <div style="font-size:2.5rem; font-weight:bold; color:${folha.dadosCor.hex}">${folha.forma}</div>
                <div style="font-size:0.8rem; margin-top:8px; color:#fff; font-weight:bold;">${folha.dadosCor.nome}</div>
            `;
            card.onclick = () => this.usarFolha(index);
            container.appendChild(card);
        });
    }

    usarFolha(index) {
        if (!this.alvoSelecionado) {
            return this.animacaoTextoFlutuante("Selecione um alvo primeiro!", "#ffffff");
        }

        const folha = this.folhasGuardadas[index];
        
        // Remove a folha do inventário
        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();

        // Dispara a lógica de dano/cura
        this.aplicarEfeito(this.alvoSelecionado, folha.forma, folha.cor, folha.dadosCor);
        
        // Fecha o modal após usar
        document.getElementById('lg-modal-mochila').classList.remove('active');
    }

    aplicarEfeito(alvoId, forma, corKey, corData) {
        // Cálculo de Atributos 
        let ap = this.state.stats.ap || 0;
        let ad = this.state.stats.ad || 0;
        let poderBase = corData.custo + (ap * 1.5);
        
        let dano = 0;
        let cura = 0;

        // Dinâmica por formato e tinta
        if (forma === 'O') {
            // Círculo = Defesa/Cura
            cura = Math.floor(poderBase * 1.2);
        } else if (forma === 'X') {
            // Cruz = Ataque Direto (mistura AP e AD)
            dano = Math.floor(poderBase * 1.5 + (ad * 0.8));
        } else if (forma === 'Z') {
            // Zigue-zague = Dano com leve cura "Roubo de vida"
            dano = Math.floor(poderBase * 1.2 + (ad * 0.4));
            cura = Math.floor(poderBase * 0.3);
        }

        // Bônus/Penalidades por Cores específicas
        if (corKey === 'white') cura *= 2.0; 
        if (corKey === 'red') dano *= 1.4;

        dano = Math.floor(dano);
        cura = Math.floor(cura);

        const ehMimMesmo = (alvoId === this.meuId);

        // Aplicação local do efeito (Se for em si mesmo)
        if (ehMimMesmo) {
            if (cura > 0) {
                this.state.stats.hp = Math.min(this.state.stats.maxHp, this.state.stats.hp + cura);
            }
            if (dano > 0) {
                // Aplicar golpe em si mesmo reduz um pouco o dano, mas ainda machuca
                this.state.stats.hp -= Math.floor(dano * 0.5); 
            }
        } else if (this.multiplayerAtivo) {
            // Enviar os dados de alteração de HP para o Firebase para o alvo
            const alvoRef = ref(this.db, `rooms/${this.state.roomName}/players/${alvoId}/stats`);
            get(alvoRef).then((snapshot) => {
                const stats = snapshot.val();
                if (stats) {
                    let novoHp = stats.hp;
                    if (dano > 0) novoHp -= dano;
                    if (cura > 0) novoHp = Math.min(stats.maxHp || 100, novoHp + cura);
                    
                    // Impede vida negativa
                    if (novoHp < 0) novoHp = 0;
                    update(alvoRef, { hp: novoHp });
                }
            });
        }

        // Exibir feedback na tela do lançador
        if (cura > 0 && ehMimMesmo) this.animacaoTextoFlutuante(`+${cura}`, '#00ff00');
        if (dano > 0 && ehMimMesmo) this.animacaoTextoFlutuante(`-${Math.floor(dano * 0.5)}`, '#ff0000');

        // Emite o evento na sala para sincronizar as animações de skill globalmente
        let valorTexto = dano > 0 ? `-${dano}` : `+${cura}`;
        this.emitirEventoDeRede(corData.tipoAnimacao, corData.hex, alvoId, valorTexto, corData.nome);
        
        atualizarUI();
    }

    // ==========================================
    // ANIMAÇÕES E EFEITOS GLOBAIS
    // ==========================================
    renderizarEventoVisualGlobal(evento) {
        const ehAlvo = (evento.targetId === this.meuId);
        const ehOrigem = (evento.sourceId === this.meuId);

        // Só renderiza animação na tela se você for o conjurador ou o alvo
        if (!ehAlvo && !ehOrigem) return;

        const layer = document.getElementById('lg-effect-layer');
        if (!layer) return;

        const divAnim = document.createElement('div');
        
        // Renderiza Textos Flutuantes (Dano/Cura)
        const textEl = document.createElement('div');
        textEl.className = 'lg-damage-text';
        textEl.style.color = evento.hexColor;
        textEl.innerText = evento.valor;
        // Posições fictícias baseadas em quem toma o hit
        textEl.style.left = ehAlvo ? '50%' : '30%'; 
        textEl.style.top = ehAlvo ? '50%' : '20%';
        layer.appendChild(textEl);
        
        setTimeout(() => textEl.remove(), 1500);

        // Se você for o alvo, sofre o efeito Full Screen
        if (ehAlvo) {
            divAnim.style.position = 'absolute';
            divAnim.style.top = '50%';
            divAnim.style.left = '50%';
            divAnim.style.width = '100px';
            divAnim.style.height = '100px';
            divAnim.style.backgroundColor = 'transparent';
            divAnim.style.border = `2px solid ${evento.hexColor}`;
            divAnim.style.borderRadius = '50%';
            divAnim.style.boxShadow = `0 0 40px ${evento.hexColor}`;

            // Determina a animação baseada no evento
            if (evento.tipoAnimacao === 'explosao') {
                divAnim.style.animation = 'shockwave 0.8s ease-out forwards';
            } else if (evento.tipoAnimacao === 'implosao') {
                divAnim.style.animation = 'implode 1s ease-in forwards';
            } else if (evento.tipoAnimacao === 'pilar') {
                divAnim.style.width = '100%';
                divAnim.style.left = '0';
                divAnim.style.transform = 'none';
                divAnim.style.border = 'none';
                divAnim.style.backgroundColor = evento.hexColor;
                divAnim.style.animation = 'pilar-luz 1.2s ease-out forwards';
            } else {
                divAnim.style.animation = 'shockwave 1s ease-out forwards'; // Padrão
            }

            layer.appendChild(divAnim);
            
            // Tremor de tela ao receber um ataque
            if (evento.valor.startsWith('-')) {
                document.body.style.animation = 'shake 0.4s ease-in-out';
                setTimeout(() => { document.body.style.animation = ''; }, 400);
            }

            setTimeout(() => divAnim.remove(), 1500);
        }
    }

    animacaoTextoFlutuante(texto, cor, pos = null) {
        const layer = document.getElementById('lg-effect-layer');
        if (!layer) return;

        const floating = document.createElement('div');
        floating.className = 'lg-damage-text';
        floating.style.color = cor;
        floating.innerText = texto;
        
        if (pos) {
            floating.style.left = `${pos.x}px`;
            floating.style.top = `${pos.y}px`;
        } else {
            floating.style.left = '50%';
            floating.style.top = '30%';
        }

        layer.appendChild(floating);
        setTimeout(() => floating.remove(), 1500);
    }

    // ==========================================
    // SISTEMA DE MINIGAME (FARM DE OURO)
    // ==========================================
    iniciarMinigameFarm() {
        if (this.minigameAtivo) return;
        this.minigameAtivo = true;
        this.minigameScore = 0;
        
        const arena = document.getElementById('lg-farm-arena');
        const status = document.getElementById('lg-farm-status');
        const btn = document.getElementById('lg-start-farm');
        
        if(!arena || !status || !btn) return;

        btn.style.display = 'none';
        status.innerText = 'Pontos: 0';
        arena.innerHTML = '';
        arena.appendChild(status);

        let timeLeft = 10;
        const timerDisplay = document.createElement('div');
        timerDisplay.style.position = 'absolute';
        timerDisplay.style.top = '12px';
        timerDisplay.style.right = '12px';
        timerDisplay.style.color = '#ffaa00';
        timerDisplay.style.fontWeight = 'bold';
        timerDisplay.style.fontSize = '1.2rem';
        timerDisplay.innerText = `${timeLeft}s`;
        arena.appendChild(timerDisplay);

        const spawnRune = () => {
            if (!this.minigameAtivo) return;
            const rune = document.createElement('div');
            
            // Símbolos variados e tamanhos dinâmicos
            rune.innerText = ['✦', '✧', '★', '☆', '💎'][Math.floor(Math.random() * 5)];
            rune.style.position = 'absolute';
            rune.style.left = `${Math.random() * 80 + 10}%`;
            rune.style.top = `${Math.random() * 70 + 15}%`;
            rune.style.fontSize = `${Math.random() * 1.5 + 1.5}rem`;
            rune.style.color = '#fff';
            rune.style.textShadow = '0 0 15px var(--lg-gold)';
            rune.style.cursor = 'pointer';
            rune.style.userSelect = 'none';
            rune.style.transition = 'transform 0.1s';
            
            rune.onmousedown = rune.ontouchstart = (e) => {
                e.stopPropagation();
                e.preventDefault();
                this.minigameScore += 5;
                status.innerText = `Pontos: ${this.minigameScore}`;
                rune.style.transform = 'scale(1.5)';
                rune.style.opacity = '0';
                
                this.animacaoTextoFlutuante('+5', '#ffaa00', {x: e.clientX, y: e.clientY});
                setTimeout(() => rune.remove(), 100);
            };

            arena.appendChild(rune);
            
            // As runas somem muito rápido!
            setTimeout(() => { if (rune.parentElement) rune.remove(); }, 800);
        };

        const interval = setInterval(spawnRune, 400);

        this.minigameTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.innerText = `${timeLeft}s`;
            if (timeLeft <= 0) {
                clearInterval(interval);
                clearInterval(this.minigameTimer);
                this.minigameAtivo = false;
                btn.style.display = 'block';
                arena.innerHTML = '';
                arena.appendChild(status);
                
                // Converte pontos para Ouro
                this.state.stats.gold = (this.state.stats.gold || 0) + this.minigameScore;
                this.animacaoTextoFlutuante(`Colheita final: +${this.minigameScore} Ouro`, 'var(--lg-gold)');
                atualizarUI();
            }
        }, 1000);
    }

    // ==========================================
    // FORJA (LOJA FISICA)
    // ==========================================
    criarItemDaLoja(item) {
        // Custo fixo da Forja: Sacrifício de 25% do HP Máximo
        const custoHp = Math.floor(this.state.stats.maxHp * 0.25);
        if (this.state.stats.maxHp <= 25) { // Precisa de um limite mínimo pra não morrer de vez
            return this.animacaoTextoFlutuante("HP Máximo muito baixo para o pacto!", "#ff0000");
        }

        // Aplica o debuff definitivo no Max HP
        this.state.stats.maxHp -= custoHp;
        if (this.state.stats.hp > this.state.stats.maxHp) {
            this.state.stats.hp = this.state.stats.maxHp;
        }

        // Entrega a recompensa
        if (item === 'espada') {
            this.state.stats.ad = (this.state.stats.ad || 0) + 35;
            this.animacaoTextoFlutuante("+35 AD", "#ff3333");
        } else if (item === 'tomo') {
            this.state.stats.ap = (this.state.stats.ap || 0) + 50;
            this.animacaoTextoFlutuante("+50 AP", "#00bfff");
            this.atualizarTintaEstatistica(); // AP aumenta a Mana Máxima da Tinta
        } else if (item === 'cristal') {
            // Se escolher cristal, recupera o sacríficio e ganha muito mais
            this.state.stats.maxHp += (custoHp + 300);
            this.state.stats.hp += 300;
            this.animacaoTextoFlutuante("+300 HP Máx", "#00ff00");
        }

        // Efeito visual dramático do sacrifício
        this.emitirEventoDeRede('implosao', '#c5a059', this.meuId, `- HP MÁXIMO`, 'Sacrifício da Forja');
        atualizarUI();
    }
}
