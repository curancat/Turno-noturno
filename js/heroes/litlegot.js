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
        this.morto = false;

        // Posição no Mapa Global
        this.state.pos = this.state.pos || { x: 0, y: 0 };
        this.state.stats.level = this.state.stats.level || 1;

        // Sistema de Tintas com Restrição por Nível (Anti-Spam até Nível 30)
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25, tipoAnimacao: 'explosao', nivelMin: 1 },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20, tipoAnimacao: 'drenagem', nivelMin: 3 },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15, tipoAnimacao: 'raio', nivelMin: 6 },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30, tipoAnimacao: 'espiral', nivelMin: 10 },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25, tipoAnimacao: 'escudo', nivelMin: 15 },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35, tipoAnimacao: 'implosao', nivelMin: 22 },
            white: { nome: 'Luz Absoluta (Divino)', hex: '#ffffff', custo: 60, tipoAnimacao: 'pilar', nivelMin: 30 }
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
        atualizarUI();
    }

    // ==========================================
    // MULTIPLAYER, MIRA E POSIÇÃO NO MAPA
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

    sincronizarPosicaoMapa() {
        if (!this.state.roomName) return;
        const minhaPosRef = ref(this.db, `rooms/${this.state.roomName}/players/${this.meuId}/pos`);
        set(minhaPosRef, this.state.pos);
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
        this.morto = false;
        const deathScreen = document.getElementById('lg-modal-morte');
        if (deathScreen) deathScreen.classList.remove('active');

        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana;
        this.state.stats.hp = this.state.stats.maxHp;
        this.state.pos = { x: 0, y: 0 };
        this.sincronizarPosicaoMapa();
        
        this.emitirEventoDeRede('pilar', '#00ffcc', this.meuId, `+${this.state.stats.maxHp}`, 'Retorno à Base');
        this.animacaoTextoFlutuante("Ressuscitado na Base Sagrada!", "#00ffcc");
        atualizarUI();
    }

    verificarMorte() {
        if ((this.state.stats.hp || 0) <= 0 && !this.morto) {
            this.morto = true;
            const deathScreen = document.getElementById('lg-modal-morte');
            if (deathScreen) deathScreen.classList.add('active');
            this.animacaoTextoFlutuante("VOCÊ MORREU!", "#ff0000");
        }
    }

    // ==========================================
    // INTERFACE, DOCK E MODAIS
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v5')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v5';
        style.innerHTML = `
            :root {
                --lg-gold: #c5a059;
                --lg-dark: #0f0f1a;
                --lg-panel: rgba(20, 20, 35, 0.98);
            }
            .lg-mobile-dock {
                position: fixed; bottom: 0; left: 0; width: 100vw;
                background: linear-gradient(to top, #05050a 60%, transparent);
                backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
                display: flex; justify-content: space-evenly; align-items: flex-end;
                padding: 10px 0 calc(10px + env(safe-area-inset-bottom)) 0;
                z-index: 9999; border-top: 1px solid rgba(197, 160, 89, 0.2);
            }
            .lg-dock-btn {
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border: 2px solid var(--lg-gold); border-radius: 16px;
                width: 50px; height: 50px; display: flex; flex-direction: column;
                align-items: center; justify-content: center; color: #fff;
                font-size: 1.3rem; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                transition: all 0.2s; touch-action: manipulation;
            }
            .lg-dock-btn:active { transform: scale(0.85); box-shadow: 0 0 20px var(--lg-gold); }
            .lg-dock-label { font-size: 0.55rem; font-weight: bold; margin-top: 2px; color: var(--lg-gold); text-transform: uppercase; }

            .lg-popup {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.75); backdrop-filter: blur(5px); z-index: 10000;
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
            
            .lg-header-handle { width: 40px; height: 5px; background: rgba(255,255,255,0.3); border-radius: 3px; margin: -10px auto 10px auto; }
            
            .lg-canvas-box {
                width: 100%; height: 55vh; max-height: 320px; background: #070710; 
                border: 2px dashed #444; border-radius: 16px; touch-action: none; 
                position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
            }
            .lg-palette { display: flex; gap: 10px; overflow-x: auto; padding: 5px; }
            .lg-color-dot {
                width: 44px; height: 44px; border-radius: 50%; border: 3px solid #333;
                flex-shrink: 0; cursor: pointer; transition: all 0.3s; position: relative;
            }
            .lg-color-dot.active { border-color: #fff; transform: scale(1.15) translateY(-3px); box-shadow: 0 5px 15px var(--lg-gold); }
            .lg-color-dot.locked { filter: grayscale(1); opacity: 0.4; cursor: not-allowed; }
            .lg-color-dot.locked::after { content: '🔒'; position: absolute; top: 10px; left: 10px; font-size: 1rem; }

            .lg-select-modern {
                background: #1a1a2e; color: #fff; padding: 14px; font-size: 1.05rem;
                border: 1px solid var(--lg-gold); border-radius: 12px; font-weight: bold; width: 100%; outline: none; text-align: center;
            }
            .lg-grid-folhas { display: grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; }
            .lg-folha-card { border: 2px solid; background: #0b0b18; border-radius: 12px; padding: 12px; text-align: center; }

            /* D-Pad de Movimentação no Mapa */
            .lg-dpad-grid {
                display: grid; grid-template-columns: repeat(3, 70px); grid-template-rows: repeat(3, 70px);
                gap: 8px; justify-content: center; align-items: center; margin: 15px auto;
            }
            .lg-dpad-btn {
                background: #1a1a2e; border: 2px solid var(--lg-gold); color: var(--lg-gold);
                font-size: 1.5rem; border-radius: 14px; display: flex; align-items: center; justify-content: center;
                cursor: pointer; user-select: none; transition: background 0.1s;
            }
            .lg-dpad-btn:active { background: var(--lg-gold); color: #000; }

            .lg-effect-layer { position: fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9998; overflow: hidden; }
            
            @keyframes shockwave { 0% { transform: scale(0) translate(-50%, -50%); opacity: 1; border-width: 10px; } 100% { transform: scale(4) translate(-12.5%, -12.5%); opacity: 0; border-width: 1px; } }
            @keyframes implode { 0% { transform: scale(3) translate(-16.6%, -16.6%); opacity: 0; } 50% { opacity: 1; } 100% { transform: scale(0) translate(-50%, -50%); opacity: 0; filter: blur(5px); } }
            @keyframes shake { 0%, 100% { transform: translate(0, 0); } 20% { transform: translate(-6px, 6px); } 40% { transform: translate(6px, -6px); } 60% { transform: translate(-6px, -6px); } 80% { transform: translate(6px, 6px); } }
            @keyframes pilar-luz { 0% { height: 0; opacity: 0; bottom: 50%; } 20% { height: 100vh; opacity: 1; bottom: 0; } 80% { height: 100vh; opacity: 1; bottom: 0; } 100% { height: 100vh; opacity: 0; bottom: 0; } }
            @keyframes float-up { 0% { transform: translateY(0) scale(0.8); opacity: 0; } 20% { transform: translateY(-20px) scale(1.2); opacity: 1; } 80% { transform: translateY(-60px) scale(1); opacity: 1; } 100% { transform: translateY(-80px) scale(0.8); opacity: 0; } }
            .lg-damage-text { position: absolute; font-size: 2.2rem; font-weight: 900; -webkit-text-stroke: 2px black; pointer-events: none; animation: float-up 1.4s ease-out forwards; }
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

        const dock = document.createElement('div');
        dock.className = 'lg-mobile-dock';
        dock.innerHTML = `
            <div class="lg-dock-btn" id="lg-btn-ateliere">🎨<span class="lg-dock-label">Arte</span></div>
            <div class="lg-dock-btn" id="lg-btn-mochila">📜<span class="lg-dock-label">Mochila</span></div>
            <div class="lg-dock-btn" id="lg-btn-mapa">🗺️<span class="lg-dock-label">Mapa</span></div>
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
                        <h3 style="margin:0; color:var(--lg-gold); font-size:1.3rem; display:flex; align-items:center; gap:8px;">${icone} ${titulo}</h3>
                        <button class="lg-close-btn" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:34px; height:34px; border-radius:50%; font-size:1.1rem; cursor:pointer;">✕</button>
                    </div>
                    <div style="font-size:0.85rem; color:#aaa;">${subtitulo}</div>
                    ${conteudo}
                </div>
            `;
            document.body.appendChild(popup);
        };

        // Tela de Morte
        const morteModal = document.createElement('div');
        morteModal.id = 'lg-modal-morte';
        morteModal.className = 'lg-popup';
        morteModal.innerHTML = `
            <div class="lg-popup-card" style="text-align:center; align-items:center; border-color:#ff0000; background:rgba(25,5,5,0.95);">
                <div style="font-size:4rem;">💀</div>
                <h2 style="color:#ff3333; margin:0;">VOCÊ FOI DERROTADO</h2>
                <p style="color:#bbb;">Sua carcaça arcana sucumbiu aos ferimentos do campo de batalha.</p>
                <button id="lg-btn-ressuscitar" style="background:linear-gradient(135deg, #ff3333, #990000); color:#fff; border:none; padding:16px 32px; border-radius:12px; font-weight:900; font-size:1.2rem; width:100%; margin-top:20px; box-shadow:0 0 20px rgba(255,0,0,0.6);">Ressuscitar na Base</button>
            </div>
        `;
        document.body.appendChild(morteModal);

        criarSheet('lg-modal-canvas', '🎨', 'Ateliê Tático', 'Trace: <b>O</b>, <b>X</b> ou <b>Z</b>.', `
            <div class="lg-palette" id="lg-palette-select"></div>
            <div class="lg-canvas-box"><canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas></div>
            <div style="display:flex; gap:10px; margin-top:5px;">
                <button id="lg-btn-limpar" style="flex:1; background:#2a2a3e; color:#fff; border:none; padding:14px; border-radius:12px; font-weight:bold;">Limpar</button>
                <button id="lg-btn-guardar" style="flex:2; background:var(--lg-gold); color:#000; font-weight:900; border:none; padding:14px; border-radius:12px;">Materializar</button>
            </div>
        `);

        criarSheet('lg-modal-mochila', '📜', 'Mochila Arcana', 'Escolha o alvo e libere a arte arcana:', `
            <select id="lg-alvo-select" class="lg-select-modern"></select>
            <div class="lg-grid-folhas" id="lg-folhas-container" style="margin-top:5px;"></div>
        `);

        // Painel de Mapa & Movimentação
        criarSheet('lg-modal-mapa', '🗺️', 'Navegação no Mapa', `Coordenadas Atuais: <b id="lg-coords-txt" style="color:var(--lg-gold);">X: 0 | Y: 0</b>`, `
            <div class="lg-dpad-grid">
                <div></div>
                <div class="lg-dpad-btn" id="dpad-up">⬆️</div>
                <div></div>
                <div class="lg-dpad-btn" id="dpad-left">⬅️</div>
                <div class="lg-dpad-btn" style="background:#333; font-size:0.8rem; border-color:#555;">📍</div>
                <div class="lg-dpad-btn" id="dpad-right">➡️</div>
                <div></div>
                <div class="lg-dpad-btn" id="dpad-down">⬇️</div>
                <div></div>
            </div>
        `);

        criarSheet('lg-modal-farm', '🌾', 'Rito de Farm', 'Toque rápido nas runas energéticas.', `
            <div style="position:relative; width:100%; height:280px; background:radial-gradient(circle, #1a1a2e, #04040a); border:2px solid #333; border-radius:16px; overflow:hidden;" id="lg-farm-arena">
                <div id="lg-farm-status" style="position:absolute; top:10px; left:10px; color:#fff; font-size:1.1rem; font-weight:bold; z-index:2;">Pontos: 0</div>
            </div>
            <button id="lg-start-farm" style="background:#28a745; color:#fff; border:none; padding:14px; border-radius:12px; font-weight:900; font-size:1.1rem; width:100%;">Iniciar Rito</button>
        `);

        criarSheet('lg-modal-loja', '⚒️', 'Forja Física', '<span style="color:#ff4444;">Sacrifício Mítico: Transmuta 25% do HP Máximo.</span>', `
            <div style="display:flex; flex-direction:column; gap:12px;">
                <button class="lg-craft-item" data-item="espada" style="background:#1a1a2e; color:#fff; border:2px solid var(--lg-gold); padding:14px; border-radius:12px; text-align:left; display:flex; gap:10px; align-items:center;"><span style="font-size:1.8rem;">⚔️</span><div><b>Espada Longa (+35 AD)</b></div></button>
                <button class="lg-craft-item" data-item="tomo" style="background:#1a1a2e; color:#fff; border:2px solid var(--lg-gold); padding:14px; border-radius:12px; text-align:left; display:flex; gap:10px; align-items:center;"><span style="font-size:1.8rem;">📘</span><div><b>Tomo Amplificador (+50 AP)</b></div></button>
                <button class="lg-craft-item" data-item="cristal" style="background:#1a1a2e; color:#fff; border:2px solid var(--lg-gold); padding:14px; border-radius:12px; text-align:left; display:flex; gap:10px; align-items:center;"><span style="font-size:1.8rem;">💎</span><div><b>Cristal de Rubi (+300 HP)</b></div></button>
            </div>
        `);

        this.vincularEventosModais();
        this.renderizarPaleta();
    }

    renderizarPaleta() {
        const container = document.getElementById('lg-palette-select');
        if (!container) return;
        container.innerHTML = '';

        const nivelAtual = this.state.stats.level || 1;

        Object.keys(this.tintas).forEach(corKey => {
            const cor = this.tintas[corKey];
            const dot = document.createElement('div');
            const bloqueado = nivelAtual < cor.nivelMin;

            dot.className = `lg-color-dot ${corKey === this.corAtiva && !bloqueado ? 'active' : ''} ${bloqueado ? 'locked' : ''}`;
            dot.style.backgroundColor = cor.hex;
            dot.title = `${cor.nome} (Req: Nível ${cor.nivelMin})`;

            dot.addEventListener('click', () => {
                if (bloqueado) {
                    this.animacaoTextoFlutuante(`Requer Nível ${cor.nivelMin} para desbloquear esta Tinta!`, "#ff4444");
                    return;
                }
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
                if (show) popup.classList.add('active');
                else popup.classList.remove('active');
            }
        };

        document.getElementById('lg-btn-ateliere').onclick = () => { if(!this.morto) { togglePopup('lg-modal-canvas', true); setTimeout(()=>this.redimensionarCanvas(), 300); } };
        document.getElementById('lg-btn-mochila').onclick = () => { if(!this.morto) { this.atualizarListaDeAlvos(); this.atualizarUIFolhas(); togglePopup('lg-modal-mochila', true); } };
        document.getElementById('lg-btn-mapa').onclick = () => { togglePopup('lg-modal-mapa', true); };
        document.getElementById('lg-btn-farm').onclick = () => { if(!this.morto) togglePopup('lg-modal-farm', true); };
        document.getElementById('lg-btn-loja').onclick = () => { if(!this.morto) togglePopup('lg-modal-loja', true); };
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();
        document.getElementById('lg-btn-ressuscitar').onclick = () => this.retornarABase();

        document.querySelectorAll('.lg-close-btn').forEach(btn => {
            btn.onclick = (e) => e.target.closest('.lg-popup').classList.remove('active');
        });

        // Controles do D-Pad de Movimento
        const mover = (dx, dy) => {
            this.state.pos.x += dx;
            this.state.pos.y += dy;
            const coordTxt = document.getElementById('lg-coords-txt');
            if (coordTxt) coordTxt.innerText = `X: ${this.state.pos.x} | Y: ${this.state.pos.y}`;
            this.sincronizarPosicaoMapa();
            this.animacaoTextoFlutuante(`Posição: X:${this.state.pos.x}, Y:${this.state.pos.y}`, "#c5a059");
        };

        document.getElementById('dpad-up').onclick = () => mover(0, 1);
        document.getElementById('dpad-down').onclick = () => mover(0, -1);
        document.getElementById('dpad-left').onclick = () => mover(-1, 0);
        document.getElementById('dpad-right').onclick = () => mover(1, 0);

        document.getElementById('lg-btn-limpar').onclick = () => this.limparCanvas();
        document.getElementById('lg-btn-guardar').onclick = () => this.guardarDesenho();
        document.getElementById('lg-start-farm').onclick = () => this.iniciarMinigameFarm();

        document.querySelectorAll('.lg-craft-item').forEach(btn => {
            btn.onclick = (e) => this.criarItemDaLoja(e.currentTarget.dataset.item);
        });

        const selectAlvo = document.getElementById('lg-alvo-select');
        if (selectAlvo) selectAlvo.onchange = (e) => { this.alvoSelecionado = e.target.value; };
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
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 12;
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
        if (pts.length < 12) return null;

        const start = pts[0];
        const end = pts[pts.length - 1];
        const distStartEnd = Math.hypot(end.x - start.x, end.y - start.y);

        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        pts.forEach(p => {
            if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
        });

        const width = maxX - minX;
        const height = maxY - minY;

        if (distStartEnd < 70 && width > 35 && height > 35) return 'O';

        let mudancasX = 0;
        for (let i = 3; i < pts.length - 3; i+=3) {
            const dirPrevX = pts[i].x - pts[i - 3].x;
            const dirNextX = pts[i + 3].x - pts[i].x;
            if ((dirPrevX > 0 && dirNextX < 0) || (dirPrevX < 0 && dirNextX > 0)) mudancasX++;
        }

        if (mudancasX >= 1 && width > 25) return 'Z';
        return 'X';
    }

    guardarDesenho() {
        if (this.folhasGuardadas.length >= this.maxFolhas) {
            return this.animacaoTextoFlutuante("Mochila Cheia! Máx 3", "#ff0000");
        }

        const forma = this.reconhecerForma();
        if (!forma) {
            return this.animacaoTextoFlutuante("Traço Inválido! Desenhe O, X ou Z", "#ff8c00");
        }

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) {
            return this.animacaoTextoFlutuante(`Mana Insuficiente: ${corData.custo} pts`, "#00bfff");
        }

        this.state.stats.mana -= corData.custo;
        this.folhasGuardadas.push({
            id: Date.now(),
            forma: forma,
            corKey: this.corAtiva,
            corHex: corData.hex,
            nomeCor: corData.nome,
            apSnapshot: this.state.stats.ap || 0
        });

        this.limparCanvas();
        this.animacaoTextoFlutuante(`Folha de ${forma} Guardada!`, corData.hex);
        document.getElementById('lg-modal-canvas').classList.remove('active');
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; color:#777; padding:20px; text-align:center;">Nenhuma folha guardada.</div>';
            return;
        }

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = folha.corHex;
            card.innerHTML = `
                <div style="font-size:2.2rem; font-weight:900; color:${folha.corHex};">${folha.forma}</div>
                <div style="font-size:0.7rem; color:#fff; margin:5px 0;">${folha.nomeCor}</div>
                <button style="background:${folha.corHex}; color:#000; border:none; border-radius:6px; font-weight:bold; width:100%; padding:8px; cursor:pointer;">Lançar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(index);
            container.appendChild(card);
        });
    }

    // ==========================================
    // SISTEMA DOS 21 FEITIÇOS REAIS E ANIMAÇÕES
    // ==========================================
    ativarFolha(index) {
        const folha = this.folhasGuardadas[index];
        if (!folha || this.morto) return;
        
        if (!this.alvoSelecionado) {
            return this.animacaoTextoFlutuante("Selecione um alvo válido!", "#ff0000");
        }

        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').classList.remove('active');

        this.executarEfeitoRealEAnimar(folha.forma, folha.corKey, folha.apSnapshot, this.alvoSelecionado);
    }

    executarEfeitoRealEAnimar(forma, corKey, apSnap, alvoId) {
        const ap = apSnap || this.state.stats.ap || 0;
        const tinta = this.tintas[corKey];
        let danoOuCura = 0;
        let nomeEfeito = "";
        let resumo = "";

        // Tabela completa de 7 Cores x 3 Formas = 21 Efeitos Reais Distintos
        switch (corKey) {
            case 'red': // Fogo
                if (forma === 'O') { danoOuCura = Math.floor(ap * 2.2 + 30); nomeEfeito = "Inferno Circular"; resumo = `causou ${danoOuCura} Dano em Área`; this.aplicarDanoRede(alvoId, danoOuCura); }
                else if (forma === 'X') { danoOuCura = Math.floor(ap * 3.0 + 50); nomeEfeito = "Corte Flamejante"; resumo = `desferiu corte brutal de ${danoOuCura} Dano`; this.aplicarDanoRede(alvoId, danoOuCura); }
                else { danoOuCura = Math.floor(ap * 1.8 + 20); nomeEfeito = "Labareda Ziguezague"; resumo = `queimou o alvo em ${danoOuCura} Dano`; this.aplicarDanoRede(alvoId, danoOuCura); }
                break;
            case 'orange': // Drenagem
                if (forma === 'O') { danoOuCura = Math.floor(ap * 1.5 + 40); nomeEfeito = "Vampirismo de Aura"; resumo = `curou +${danoOuCura} HP próprio`; this.curar(danoOuCura); }
                else if (forma === 'X') { danoOuCura = Math.floor(ap * 2.2 + 25); nomeEfeito = "Drenagem Direta"; resumo = `drenou ${danoOuCura} HP do inimigo`; this.curar(danoOuCura); this.aplicarDanoRede(alvoId, danoOuCura); }
                else { danoOuCura = 25; nomeEfeito = "Pulso Hemático"; resumo = "concedeu Bônus de Roubo de Vida (+25%)"; }
                break;
            case 'yellow': // Ouro / Luz
                if (forma === 'O') { danoOuCura = Math.floor(60 + ap * 0.5); nomeEfeito = "Clarão Dourado"; resumo = `gerou +${danoOuCura} Ouro`; this.state.gold = (this.state.gold || 0) + danoOuCura; }
                else if (forma === 'X') { danoOuCura = Math.floor(40 + ap * 0.8); nomeEfeito = "Chuva de Ouro"; resumo = `gerou fortuna e XP arcano`; this.state.gold = (this.state.gold || 0) + danoOuCura; }
                else { danoOuCura = Math.floor(ap * 1.2); nomeEfeito = "Relâmpago Áureo"; resumo = `atordoou e causou ${danoOuCura} Dano`; this.aplicarDanoRede(alvoId, danoOuCura); }
                break;
            case 'green': // Natureza
                if (forma === 'O') { danoOuCura = Math.floor(ap * 2.5 + 50); nomeEfeito = "Raiz Viva Protetora"; resumo = `curou +${danoOuCura} HP`; this.curar(danoOuCura); }
                else if (forma === 'X') { danoOuCura = Math.floor(ap * 2.0 + 30); nomeEfeito = "Espinhos Selvagens"; resumo = `enraizou e causou ${danoOuCura} Dano`; this.aplicarDanoRede(alvoId, danoOuCura); }
                else { danoOuCura = 40; nomeEfeito = "Vinha Cortante"; resumo = `aumentou Vida Máxima em +40 HP`; this.state.stats.maxHp += 40; this.curar(40); }
                break;
            case 'blue': // Água / Gelo
                if (forma === 'O') { danoOuCura = Math.floor(100 + ap * 1.8); nomeEfeito = "Cúpula Aquática"; resumo = `criou +${danoOuCura} de Escudo protetor`; this.state.stats.shield = (this.state.stats.shield || 0) + danoOuCura; }
                else if (forma === 'X') { danoOuCura = Math.floor(ap * 2.4 + 40); nomeEfeito = "Lança Gélida"; resumo = `congelou com ${danoOuCura} Dano`; this.aplicarDanoRede(alvoId, danoOuCura); }
                else { danoOuCura = 20; nomeEfeito = "Correnteza Veloz"; resumo = "acelerou reflexos e mobilidade"; }
                break;
            case 'purple': // Sombra
                if (forma === 'O') { danoOuCura = Math.floor(ap * 1.7); nomeEfeito = "Esfera Umbral"; resumo = `cegou e causou ${danoOuCura} Dano`; this.aplicarDanoRede(alvoId, danoOuCura); }
                else if (forma === 'X') { danoOuCura = Math.floor(ap * 2.2); nomeEfeito = "Fio de Sombra"; resumo = `puxou o alvo causando ${danoOuCura} Dano`; this.aplicarDanoRede(alvoId, danoOuCura); }
                else { danoOuCura = Math.floor(ap * 3.2 + 40); nomeEfeito = "Ruptura Sombria"; resumo = `implodiu o alvo com ${danoOuCura} Dano Mágico`; this.aplicarDanoRede(alvoId, danoOuCura); }
                break;
            case 'white': // Divino
                if (forma === 'O') { danoOuCura = this.state.stats.maxHp; nomeEfeito = "Halo Divino"; resumo = "restaurou 100% da Vida total!"; this.curar(danoOuCura); }
                else if (forma === 'X') { danoOuCura = Math.floor(ap * 4.5 + 100); nomeEfeito = "Julgamento Sagrado"; resumo = `puniu com ${danoOuCura} Dano Verdadeiro!`; this.aplicarDanoRede(alvoId, danoOuCura); }
                else { danoOuCura = 50; nomeEfeito = "Feixe Pristino"; resumo = `concedeu +${danoOuCura} AP permanente`; this.state.stats.ap += 50; this.atualizarTintaEstatistica(); }
                break;
        }

        atualizarUI();
        this.emitirEventoDeRede(tinta.tipoAnimacao, tinta.hex, alvoId, danoOuCura, `[${forma}] ${nomeEfeito}`);
        this.enviarAcaoParaChat(forma, nomeEfeito, resumo, tinta.hex);
    }

    aplicarDanoRede(alvoId, dano) {
        if (!this.multiplayerAtivo || !this.state.roomName) return;
        if (alvoId === this.meuId) {
            this.receberDano(dano);
            return;
        }

        const alvoRef = ref(this.db, `rooms/${this.state.roomName}/players/${alvoId}/stats`);
        get(alvoRef).then(snapshot => {
            const stats = snapshot.val();
            if (stats) {
                let hp = stats.hp || 0;
                let shield = stats.shield || 0;
                if (shield > 0) {
                    if (dano >= shield) { dano -= shield; shield = 0; hp = Math.max(0, hp - danno); }
                    else { shield -= dano; }
                } else { hp = Math.max(0, hp - dano); }
                update(alvoRef, { hp, shield });
            }
        });
    }

    receberDano(dano) {
        let shield = this.state.stats.shield || 0;
        let hp = this.state.stats.hp || 0;
        if (shield > 0) {
            if (dano >= shield) { dano -= shield; this.state.stats.shield = 0; hp = Math.max(0, hp - dano); }
            else { this.state.stats.shield -= dano; }
        } else { hp = Math.max(0, hp - dano); }
        this.state.stats.hp = hp;
        atualizarUI();
        this.verificarMorte();
    }

    curar(valor) {
        this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor);
        atualizarUI();
    }

    renderizarEventoVisualGlobal(evento) {
        const isTarget = evento.targetId === this.meuId;
        const isSource = evento.sourceId === this.meuId;
        const layer = document.getElementById('lg-effect-layer');
        if (!layer) return;

        if (isTarget && evento.valor > 0) {
            document.body.style.animation = 'none';
            void document.body.offsetWidth;
            document.body.style.animation = 'shake 0.4s ease both';
            if (evento.targetId === this.meuId) this.receberDano(evento.valor);
        }

        this.gerarSistemasDeParticulas(evento.tipoAnimacao, evento.hexColor, layer);
        if (evento.valor > 0) {
            this.criarTextoFlutuante((isTarget || isSource) ? `-${evento.valor}` : `-${evento.valor}`, evento.hexColor, layer);
        }
        if (isSource) this.animacaoTextoFlutuante(`Lançado: ${evento.nomeEfeito}`, evento.hexColor);
    }

    gerarSistemasDeParticulas(tipo, corHex, layer) {
        const container = document.createElement('div');
        container.style.position = 'absolute'; container.style.top = '50%'; container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        
        if (tipo === 'explosao') {
            container.style.width = '100px'; container.style.height = '100px'; container.style.borderRadius = '50%';
            container.style.border = `solid ${corHex}`; container.style.animation = 'shockwave 0.6s ease-out forwards';
        } else if (tipo === 'implosao') {
            container.style.width = '250px'; container.style.height = '250px'; container.style.borderRadius = '50%';
            container.style.background = `radial-gradient(circle, ${corHex}88, transparent)`; container.style.animation = 'implode 0.8s ease-in forwards';
        } else if (tipo === 'pilar') {
            container.style.width = '100vw'; container.style.height = '0';
            container.style.background = `linear-gradient(to top, transparent, ${corHex}aa, transparent)`;
            container.style.animation = 'pilar-luz 1s ease-in-out forwards'; container.style.bottom = '0';
        } else {
            for (let i = 0; i < 12; i++) {
                const part = document.createElement('div');
                part.style.position = 'absolute'; part.style.borderRadius = '50%';
                part.style.background = corHex; part.style.width = '10px'; part.style.height = '10px';
                const angle = Math.random() * Math.PI * 2; const dist = Math.random() * 120 + 30;
                part.style.transition = 'all 0.7s cubic-bezier(0.175, 0.885, 0.32, 1)';
                container.appendChild(part);
                setTimeout(() => { part.style.transform = `translate(${Math.cos(angle)*dist}px, ${Math.sin(angle)*dist}px) scale(0)`; part.style.opacity = '0'; }, 30);
            }
        }
        layer.appendChild(container);
        setTimeout(() => container.remove(), 1000);
    }

    criarTextoFlutuante(texto, cor, layer) {
        const span = document.createElement('div');
        span.className = 'lg-damage-text'; span.style.color = cor; span.innerText = texto;
        span.style.left = `calc(50% + ${(Math.random() - 0.5) * 80}px)`;
        span.style.top = `calc(50% + ${(Math.random() - 0.5) * 40}px)`;
        layer.appendChild(span);
        setTimeout(() => span.remove(), 1400);
    }

    animacaoTextoFlutuante(texto, cor) {
        const t = document.createElement('div');
        t.style.position = 'fixed'; t.style.top = '25%'; t.style.left = '50%'; t.style.transform = 'translate(-50%, -50%)';
        t.style.color = cor; t.style.fontSize = '1.4rem'; t.style.fontWeight = '900'; t.style.zIndex = '10005';
        t.style.textShadow = `0 3px 10px rgba(0,0,0,0.9), 0 0 10px ${cor}`; t.style.pointerEvents = 'none';
        t.style.animation = 'float-up 1.2s ease-out forwards'; t.innerText = texto;
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 1200);
    }

    enviarAcaoParaChat(forma, nomeEfeito, resumo, hex) {
        if (!this.state.roomName || !this.multiplayerAtivo) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: this.meuId,
            text: `<strong style="color:${hex}; background:rgba(0,0,0,0.6); padding:2px 5px; border-radius:4px;">[${forma}] ${nomeEfeito}</strong> ${resumo}`,
            type: "combat",
            time: Date.now()
        });
    }

    // ==========================================
    // LOJA E FARM DE RUNAS
    // ==========================================
    criarItemDaLoja(tipoItem) {
        const custoHp = Math.floor(this.state.stats.maxHp * 0.25);
        if (this.state.stats.hp <= custoHp || this.state.stats.maxHp <= 250) {
            return this.animacaoTextoFlutuante("Resiliência Vital Insuficiente!", "#ff0000");
        }

        this.state.stats.hp -= custoHp;
        this.emitirEventoDeRede('explosao', '#8b0000', this.meuId, custoHp, 'Sacrifício de Sangue');

        if (tipoItem === 'espada') { this.state.stats.ad = (this.state.stats.ad || 0) + 35; this.animacaoTextoFlutuante("+35 AD Forjado!", "#ffaa00"); }
        else if (tipoItem === 'tomo') { this.state.stats.ap = (this.state.stats.ap || 0) + 50; this.atualizarTintaEstatistica(); this.animacaoTextoFlutuante("+50 AP Amplificado!", "#8a2be2"); }
        else if (tipoItem === 'cristal') { this.state.stats.maxHp += 300; this.state.stats.hp += 300; this.animacaoTextoFlutuante("+300 HP Adicionado!", "#ff3333"); }

        document.getElementById('lg-modal-loja').classList.remove('active');
        atualizarUI();
        this.verificarMorte();
    }

    iniciarMinigameFarm() {
        const arena = document.getElementById('lg-farm-arena');
        const status = document.getElementById('lg-farm-status');
        const btnStart = document.getElementById('lg-start-farm');
        if (!arena) return;

        this.minigameScore = 0;
        this.minigameAtivo = true;
        status.innerText = "Pontos: 0";
        btnStart.style.display = 'none';

        let count = 0;
        const criarRuna = () => {
            if (count >= 12 || !this.minigameAtivo) {
                this.minigameAtivo = false;
                btnStart.style.display = 'block';
                const ouro = this.minigameScore * 50;
                this.state.gold = (this.state.gold || 0) + ouro;
                this.animacaoTextoFlutuante(`Farm Concluído: +${ouro} Ouro`, "#28a745");
                setTimeout(() => document.getElementById('lg-modal-farm').classList.remove('active'), 1000);
                atualizarUI();
                return;
            }

            const runa = document.createElement('div');
            runa.style.position = 'absolute'; runa.style.width = '45px'; runa.style.height = '45px';
            runa.style.borderRadius = '50%'; runa.style.background = 'radial-gradient(circle, #fff, var(--lg-gold))';
            runa.style.left = `${Math.random() * (arena.clientWidth - 50)}px`;
            runa.style.top = `${Math.random() * (arena.clientHeight - 50)}px`;
            runa.style.cursor = 'pointer'; runa.style.boxShadow = '0 0 10px var(--lg-gold)';

            const t = setTimeout(() => { if (runa.parentElement) runa.remove(); count++; criarRuna(); }, 750);

            const hit = (e) => {
                e.preventDefault(); clearTimeout(t);
                this.minigameScore += 1;
                status.innerText = `Pontos: ${this.minigameScore} 🔥`;
                runa.remove(); count++; criarRuna();
            };

            runa.addEventListener('mousedown', hit);
            runa.addEventListener('touchstart', hit, { passive: false });
            arena.appendChild(runa);
        };
        criarRuna();
    }
}
