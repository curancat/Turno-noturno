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

        // Sistema de Tintas com Restrição por Nível e Nível Máximo (Trava de Segurança Level 30)
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25, nivelMin: 1, tipoAnimacao: 'explosao' },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20, nivelMin: 3, tipoAnimacao: 'drenagem' },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15, nivelMin: 5, tipoAnimacao: 'raio' },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30, nivelMin: 10, tipoAnimacao: 'espiral' },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25, nivelMin: 15, tipoAnimacao: 'escudo' },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35, nivelMin: 22, tipoAnimacao: 'implosao' },
            white: { nome: 'Luz Absoluta (Divino)', hex: '#ffffff', custo: 60, nivelMin: 30, tipoAnimacao: 'pilar' }
        };

        this.minigameAtivo = false;
        this.minigameScore = 0;
        
        // Identificador único do jogador
        this.meuId = this.state.playerName || `Litlegot_${Math.floor(Math.random() * 1000)}`;
        
        // Garante level padrão se não houver
        if (!this.state.stats.nivel) this.state.stats.nivel = 1;
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
        
        this.verificarEstadoMorte();
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
                
                // Monitora meu próprio HP remotamente se necessário
                if (data[this.meuId] && data[this.meuId].stats) {
                    if (data[this.meuId].stats.hp !== undefined) {
                        this.state.stats.hp = data[this.meuId].stats.hp;
                        this.verificarEstadoMorte();
                    }
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
    const custoBase = 50; // Defina o valor em ouro aqui
    if ((this.state.gold || 0) < custoBase) {
        return this.animacaoTextoFlutuante("Ouro insuficiente para a Base!", "#ff0000");
    }
    
    this.state.gold -= custoBase;
    this.state.stats.mana = this.state.stats.maxMana;
    this.state.stats.hp = this.state.stats.maxHp;
    this.fecharTelaMorte();
    
    this.emitirEventoDeRede('pilar', '#00ffcc', this.meuId, `+${this.state.stats.maxHp}`, 'Retorno à Base');
    this.animacaoTextoFlutuante(`Base! (-${custoBase} Ouro)`, "#00ffcc");
    atualizarUI();
}
    // ==========================================
    // TELA DE MORTE E GERENCIAMENTO DE VIDA
    // ==========================================
    verificarEstadoMorte() {
        const hp = this.state.stats.hp !== undefined ? this.state.stats.hp : this.state.stats.maxHp;
        const telaMorte = document.getElementById('lg-tela-morte');
        if (!telaMorte) return;

        if (hp <= 0) {
            telaMorte.classList.add('active');
        } else {
            telaMorte.classList.remove('active');
        }
    }

    fecharTelaMorte() {
        const telaMorte = document.getElementById('lg-tela-morte');
        if (telaMorte) telaMorte.classList.remove('active');
    }

    // ==========================================
    // UI MOBILE AVANÇADA, DOCK E MAPA (D-PAD)
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v5')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v5';
        style.innerHTML = `
            :root {
                --lg-gold: #c5a059;
                --lg-dark: #0f0f1a;
                --lg-panel: rgba(20, 20, 35, 0.95);
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
                width: 52px; height: 52px; display: flex; flex-direction: column;
                align-items: center; justify-content: center; color: #fff;
                font-size: 1.3rem; box-shadow: 0 4px 15px rgba(0,0,0,0.5);
                transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                touch-action: manipulation; -webkit-tap-highlight-color: transparent;
            }
            .lg-dock-btn:active { transform: scale(0.85) translateY(5px); box-shadow: 0 0 20px var(--lg-gold); }
            .lg-dock-label { font-size: 0.55rem; font-weight: bold; margin-top: 2px; color: var(--lg-gold); text-transform: uppercase; }

            /* D-Pad de Movimentação no Mapa */
            .lg-map-dpad {
                position: fixed; bottom: 85px; right: 20px; width: 130px; height: 130px;
                z-index: 9997; display: grid; grid-template-columns: repeat(3, 1fr);
                grid-template-rows: repeat(3, 1fr); gap: 4px; pointer-events: auto;
                background: rgba(10, 10, 20, 0.6); padding: 8px; border-radius: 50%;
                border: 1px solid rgba(197, 160, 89, 0.3); backdrop-filter: blur(4px);
            }
            .lg-dpad-btn {
                background: rgba(26, 26, 46, 0.9); border: 1px solid var(--lg-gold);
                color: var(--lg-gold); border-radius: 50%; font-size: 0.9rem;
                display: flex; align-items: center; justify-content: center; cursor: pointer;
                transition: transform 0.1s; user-select: none; -webkit-tap-highlight-color: transparent;
            }
            .lg-dpad-btn:active { background: var(--lg-gold); color: #000; transform: scale(0.85); }
            .lg-dpad-up { grid-column: 2; grid-row: 1; }
            .lg-dpad-left { grid-column: 1; grid-row: 2; }
            .lg-dpad-right { grid-column: 3; grid-row: 2; }
            .lg-dpad-down { grid-column: 2; grid-row: 3; }
            .lg-dpad-center { grid-column: 2; grid-row: 2; background: transparent; border: none; font-size: 0.6rem; color: #fff; font-weight: bold; pointer-events: none;}

            /* Tela de Morte Imersiva */
            .lg-death-screen {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(5, 2, 8, 0.92); z-index: 20000; display: none;
                flex-direction: column; align-items: center; justify-content: center;
                padding: 20px; text-align: center; backdrop-filter: blur(10px);
                animation: fadeInDeath 0.5s ease-out forwards;
            }
            .lg-death-screen.active { display: flex; }
            @keyframes fadeInDeath { from { opacity: 0; } to { opacity: 1; } }

            /* Bottom Sheet Modals */
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

            .lg-canvas-box {
                width: 100%; height: 60vh; max-height: 320px; background: #070710; 
                border: 2px dashed #444; border-radius: 16px; touch-action: none; 
                position: relative; overflow: hidden; box-shadow: inset 0 0 20px rgba(0,0,0,0.8);
            }
            .lg-palette { display: flex; gap: 10px; overflow-x: auto; padding: 10px 5px; scrollbar-width: none; }
            .lg-palette::-webkit-scrollbar { display: none; }
            .lg-color-dot {
                width: 44px; height: 44px; border-radius: 50%; border: 3px solid #333;
                flex-shrink: 0; cursor: pointer; transition: all 0.3s; position: relative;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            }
            .lg-color-dot.locked { filter: grayscale(1); opacity: 0.5; cursor: not-allowed; }
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
                transition: transform 0.2s;
            }
            .lg-folha-card:active { transform: scale(0.95); }

            /* Camada de Efeitos Visuais Dinâmicos */
            .lg-effect-layer {
                position: fixed; top:0; left:0; width:100vw; height:100vh;
                pointer-events:none; z-index:9998; overflow: hidden;
            }
            
            @keyframes shockwave {
                0% { transform: scale(0) translate(-50%, -50%); opacity: 1; border-width: 12px; }
                100% { transform: scale(5) translate(-10%, -10%); opacity: 0; border-width: 2px; }
            }
            @keyframes spiralSpin {
                0% { transform: scale(0) rotate(0deg) translate(-50%, -50%); opacity: 1; }
                100% { transform: scale(3.5) rotate(720deg) translate(-15%, -15%); opacity: 0; }
            }
            @keyframes lightningZap {
                0% { opacity: 0; filter: brightness(3); }
                50% { opacity: 1; background: #fff; }
                100% { opacity: 0; }
            }
            @keyframes shieldDome {
                0% { transform: scale(0.5); opacity: 0; border-radius: 50%; }
                50% { transform: scale(1.5); opacity: 0.8; }
                100% { transform: scale(2); opacity: 0; }
            }
            @keyframes implode {
                0% { transform: scale(3) translate(-16.6%, -16.6%); opacity: 0; }
                50% { opacity: 1; }
                100% { transform: scale(0) translate(-50%, -50%); opacity: 0; filter: blur(8px); }
            }
            @keyframes shake {
                0%, 100% { transform: translate(0, 0) rotate(0deg); }
                20% { transform: translate(-6px, 6px) rotate(-1.5deg); }
                40% { transform: translate(6px, -6px) rotate(1.5deg); }
                60% { transform: translate(-6px, -6px) rotate(-1.5deg); }
                80% { transform: translate(6px, 6px) rotate(1.5deg); }
            }
            @keyframes pilar-luz {
                0% { height: 0; opacity: 0; bottom: 50%; }
                25% { height: 100vh; opacity: 1; bottom: 0; }
                75% { height: 100vh; opacity: 1; bottom: 0; filter: brightness(2.5); }
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

        // Tela de Morte
        if (!document.getElementById('lg-tela-morte')) {
            const deathDiv = document.div = document.createElement('div');
            deathDiv.id = 'lg-tela-morte';
            deathDiv.className = 'lg-death-screen';
            deathDiv.innerHTML = `
                <div style="font-size: 4rem; margin-bottom: 10px;">💀</div>
                <h1 style="color: #ff3333; font-size: 2rem; margin: 0 0 10px 0; text-shadow: 0 0 20px #ff0000;">VOCÊ FOI DERROTADO</h1>
                <p style="color: #aaa; max-label: 400px; margin-bottom: 25px;">Sua energia vital esgotou-se no plano material. Suas tintas foram dissipadas.</p>
                <div style="display: flex; gap: 15px; width: 100%; max-width: 320px; flex-direction: column;">
                    <button id="lg-btn-ressuscitar" style="background: linear-gradient(135deg, #c5a059, #8a733c); color: #000; border: none; padding: 16px; border-radius: 12px; font-weight: 900; font-size: 1.1rem; cursor: pointer; box-shadow: 0 4px 20px rgba(197,160,89,0.5);">Retornar à Base (Reviver)</button>
                </div>
            `;
            document.body.appendChild(deathDiv);
            document.getElementById('lg-btn-ressuscitar').onclick = () => this.retornarABase();
        }

        // D-Pad de Movimentação no Mapa
        if (!document.getElementById('lg-map-dpad')) {
            const dpad = document.createElement('div');
            dpad.id = 'lg-map-dpad';
            dpad.className = 'lg-map-dpad';
            dpad.innerHTML = `
                <div class="lg-dpad-btn lg-dpad-up" data-dir="up">▲</div>
                <div class="lg-dpad-btn lg-dpad-left" data-dir="left">◀</div>
                <div class="lg-dpad-center">MAPA</div>
                <div class="lg-dpad-btn lg-dpad-right" data-dir="right">▶</div>
                <div class="lg-dpad-btn lg-dpad-down" data-dir="down">▼</div>
            `;
            document.body.appendChild(dpad);

            dpad.querySelectorAll('.lg-dpad-btn').forEach(btn => {
                const dir = btn.dataset.dir;
                const acionarMovimento = (e) => {
                    e.preventDefault();
                    this.animacaoTextoFlutuante(`Deslocando-se para [${dir.toUpperCase()}]...`, "#c5a059");
                    // Dispara evento de movimento compatível com a engine externa se existente
                    if (window.moverNoMapa) window.moverNoMapa(dir);
                };
                btn.addEventListener('click', acionarMovimento);
                btn.addEventListener('touchstart', acionarMovimento, { passive: false });
            });
        }

        // Dock de Navegação Inferior
        if (!document.querySelector('.lg-mobile-dock')) {
            const dock = document.createElement('div');
            dock.className = 'lg-mobile-dock';
            dock.innerHTML = `
                <div class="lg-dock-btn" id="lg-btn-ateliere">🎨<span class="lg-dock-label">Arte</span></div>
                <div class="lg-dock-btn" id="lg-btn-mochila">📜<span class="lg-dock-label">Mochila</span></div>
                <div class="lg-dock-btn" id="lg-btn-farm">🌾<span class="lg-dock-label">Farm</span></div>
                <div class="lg-dock-btn" id="lg-btn-lanes">🗺️<span class="lg-dock-label">Lanes</span></div>
                <div class="lg-dock-btn" id="lg-btn-base">🏛️<span class="lg-dock-label">Base</span></div>
            `;
            document.body.appendChild(dock);
        }

        const criarSheet = (id, icone, titulo, subtitulo, conteudo) => {
            if (document.getElementById(id)) return;
            const popup = document.createElement('div');
            popup.id = id;
            popup.className = 'lg-popup';
            popup.innerHTML = `
                <div class="lg-popup-card">
                    <div class="lg-header-handle"></div>
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; color:var(--lg-gold); font-size:1.3rem; display:flex; align-items:center; gap:8px;">${icone} ${titulo}</h3>
                        <button class="lg-close-btn" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:36px; height:36px; border-radius:50%; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
                    </div>
                    <div style="font-size:0.85rem; color:#aaa; margin-bottom: 4px;">${subtitulo}</div>
                    ${conteudo}
                </div>
            `;
            document.body.appendChild(popup);
        };

        criarSheet('lg-modal-canvas', '🎨', 'Ateliê Tático', 'Trace com precisão: <b>O</b>, <b>X</b> ou <b>Z</b>.', `
            <div class="lg-palette" id="lg-palette-select"></div>
            <div class="lg-canvas-box"><canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas></div>
            <div style="display:flex; gap:12px; margin-top:4px;">
                <button id="lg-btn-limpar" style="flex:1; background:#2a2a3e; color:#fff; border:none; padding:14px; border-radius:12px; font-weight:bold; font-size:1rem;">Limpar</button>
                <button id="lg-btn-guardar" style="flex:2; background:var(--lg-gold); color:#000; font-weight:900; border:none; padding:14px; border-radius:12px; font-size:1rem; box-shadow: 0 4px 15px rgba(197,160,89,0.4);">Materializar Tinta</button>
            </div>
        `);

        criarSheet('lg-modal-mochila', '📜', 'Mochila Arcana', 'Selecione a entidade conectada e aplique sua arte guardada:', `
            <select id="lg-alvo-select" class="lg-select-modern"></select>
            <div class="lg-grid-folhas" id="lg-folhas-container" style="margin-top:10px;"></div>
        `);

        criarSheet('lg-modal-farm', '🌾', 'Rito de Farm', 'Toque rápido nas runas para acumular recursos.', `
            <div style="position:relative; width:100%; height:280px; background:radial-gradient(circle, #1a1a2e, #04040a); border:2px solid #333; border-radius:16px; overflow:hidden;" id="lg-farm-arena">
                <div id="lg-farm-status" style="position:absolute; top:12px; left:12px; color:#fff; font-size:1.1rem; font-weight:bold; z-index:2;">Pontos: 0</div>
            </div>
            <button id="lg-start-farm" style="background:linear-gradient(90deg, #28a745, #218838); color:#fff; border:none; padding:14px; border-radius:12px; font-weight:900; font-size:1.1rem; width:100%; box-shadow:0 4px 15px rgba(40,167,69,0.4);">Iniciar Rito</button>
        `);

      criarSheet('lg-modal-lanes', '🗺️', 'Teleporte Arcano', 'Viaje entre as rotas (Custo: 100 Ouro | Recarga: 10s)', `
    <div style="display:flex; flex-direction:column; gap:12px; margin-top:4px;">
        <button class="lg-btn-lane" data-lane="TOP" style="background:rgba(26,26,46,0.8); color:#fff; border:2px solid var(--lg-gold); padding:14px; border-radius:12px; font-weight:bold; font-size:1.1rem;">⬆️ Rota Superior (TOP)</button>
        <button class="lg-btn-lane" data-lane="MID" style="background:rgba(26,26,46,0.8); color:#fff; border:2px solid var(--lg-gold); padding:14px; border-radius:12px; font-weight:bold; font-size:1.1rem;">⏺️ Rota Central (MID)</button>
        <button class="lg-btn-lane" data-lane="BOT" style="background:rgba(26,26,46,0.8); color:#fff; border:2px solid var(--lg-gold); padding:14px; border-radius:12px; font-weight:bold; font-size:1.1rem;">⬇️ Rota Inferior (BOT)</button>
    </div>
`);
        this.vincularEventosModais();
        this.renderizarPaleta();
    }

    renderizarPaleta() {
        const container = document.getElementById('lg-palette-select');
        if (!container) return;
        container.innerHTML = '';

        const nivelAtual = this.state.stats.nivel || 1;

        Object.keys(this.tintas).forEach(corKey => {
            const cor = this.tintas[corKey];
            const dot = document.createElement('div');
            
            // Verificação da Trava de Segurança por Nível (Exigência até nível 30)
            const bloqueado = nivelAtual < cor.nivelMin;

            dot.className = `lg-color-dot ${corKey === this.corAtiva && !bloqueado ? 'active' : ''} ${bloqueado ? 'locked' : ''}`;
            dot.style.backgroundColor = cor.hex;
            dot.title = `${cor.nome} (Req: Nv ${cor.nivelMin} | Custo: ${cor.custo})`;
            
            if (bloqueado) {
                const lockBadge = document.createElement('div');
                lockBadge.style.cssText = "position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:0.75rem; background:rgba(0,0,0,0.6); border-radius:50%; color:#fff; font-weight:bold;";
                lockBadge.innerText = `L${cor.nivelMin}`;
                dot.appendChild(lockBadge);
            }

            dot.addEventListener('click', () => {
                if (bloqueado) {
                    return this.animacaoTextoFlutuante(`Requer Nível ${cor.nivelMin} para desbloquear esta tinta!`, "#ff4444");
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

        document.getElementById('lg-btn-ateliere').onclick = () => { togglePopup('lg-modal-canvas', true); setTimeout(()=>this.redimensionarCanvas(), 300); };
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarListaDeAlvos(); this.atualizarUIFolhas(); togglePopup('lg-modal-mochila', true); };
        document.getElementById('lg-btn-farm').onclick = () => { togglePopup('lg-modal-farm', true); };
        ocument.getElementById('lg-btn-lanes').onclick = () => { togglePopup('lg-modal-lanes', true); };
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();

        document.querySelectorAll('.lg-close-btn').forEach(btn => {
            btn.onclick = (e) => e.target.closest('.lg-popup').classList.remove('active');
        });
        
        document.querySelectorAll('.lg-popup').forEach(popup => {
            popup.addEventListener('click', (e) => {
                if (e.target === popup) popup.classList.remove('active');
            });
        });

        document.getElementById('lg-btn-limpar').onclick = () => this.limparCanvas();
        document.getElementById('lg-btn-guardar').onclick = () => this.guardarDesenho();
        document.getElementById('lg-start-farm').onclick = () => this.iniciarMinigameFarm();

        document.querySelectorAll('.lg-btn-lane').forEach(btn => {
             btn.onclick = (e) => this.teleportarParaLane(e.currentTarget.dataset.lane);
        });
        const selectAlvo = document.getElementById('lg-alvo-select');
        if (selectAlvo) {
            selectAlvo.onchange = (e) => { this.alvoSelecionado = e.target.value; };
        }
    }

    // ==========================================
    // CANVAS FLUIDO E RECONHECIMENTO DE TRAÇOS
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
            ctx.shadowBlur = 15;
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
        if (pts.length < 15) return null;

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

        if (distStartEnd < 90 && width > 35 && height > 35) return 'O';

        let mudancasX = 0;
        for (let i = 3; i < pts.length - 3; i+=3) {
            const dirPrevX = pts[i].x - pts[i - 3].x;
            const dirNextX = pts[i + 3].x - pts[i].x;
            if ((dirPrevX > 0 && dirNextX < 0) || (dirPrevX < 0 && dirNextX > 0)) mudancasX++;
        }

        if (mudancasX >= 2 && width > 25) return 'Z';
        return 'X';
    }

    guardarDesenho() {
        if (this.folhasGuardadas.length >= this.maxFolhas) {
            return this.animacaoTextoFlutuante("Mochila Cheia! Máx 3", "#ff0000");
        }

        const forma = this.reconhecerForma();
        if (!forma) {
            return this.animacaoTextoFlutuante("Traço Incompreensível! Tente novamente.", "#ff8c00");
        }

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) {
            return this.animacaoTextoFlutuante(`Falta Mana: ${corData.custo} pts`, "#00bfff");
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
        this.animacaoTextoFlutuante(`Arte ${forma} Materializada com sucesso!`, corData.hex);
        document.getElementById('lg-modal-canvas').classList.remove('active');
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; color:#777; padding:20px; text-align:center; font-style:italic;">Nenhuma arte em posse. Visite o Ateliê.</div>';
            return;
        }

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = folha.corHex;
            card.style.boxShadow = `inset 0 0 15px ${folha.corHex}33`;
            card.innerHTML = `
                <div style="font-size:2.2rem; font-weight:900; color:${folha.corHex}; text-shadow:0 0 10px ${folha.corHex};">${folha.forma}</div>
                <div style="font-size:0.7rem; color:#fff; font-weight:bold; margin:6px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${folha.nomeCor}</div>
                <button style="background:linear-gradient(135deg, ${folha.corHex}, #222); color:#fff; border:none; border-radius:8px; font-weight:bold; font-size:1rem; width:100%; padding:8px; cursor:pointer;">Lançar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(index);
            container.appendChild(card);
        });
    }

    // ==========================================
    // SISTEMA DE EFEITOS REAIS PARA OS 21 FEITIÇOS (7 CORES x 3 TRAÇOS)
    // ==========================================
    ativarFolha(index) {
        const folha = this.folhasGuardadas[index];
        if (!folha) return;
        
        if (!this.alvoSelecionado) {
            return this.animacaoTextoFlutuante("Selecione um alvo na mochila!", "#ff0000");
        }

        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').classList.remove('active');

        this.executarEfeitoRealEAnimar(folha.forma, folha.corKey, folha.apSnapshot, this.alvoSelecionado);
    }

    executarEfeitoRealEAnimar(forma, corKey, apSnap, alvoId) {
        const ap = apSnap || this.state.stats.ap || 0;
        const tinta = this.tintas[corKey];
        const hex = tinta.hex;
        
        // Mapeamento dinâmico de animação baseado no traço e cor
        let tipoAnimacao = tinta.tipoAnimacao;
        if (forma === 'O') tipoAnimacao = 'explosao';
        else if (forma === 'X') tipoAnimacao = 'raio';
        else if (forma === 'Z') tipoAnimacao = 'espiral';

        let nomeEfeito = "";
        let resumoAcao = "";
        let danoOuCuraAplicado = 0;

        // Matriz de Feitiços Completa (21 variações reais e funcionais)
        switch (corKey) {
            case 'red': // Fogo Carnificina
                if (forma === 'O') {
                    danoOuCuraAplicado = Math.floor(ap * 2.5 + 40);
                    nomeEfeito = "Inferno Circular Em Chamas";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` incinerou o alvo com ${danoOuCuraAplicado} de dano elemental.`;
                } else if (forma === 'X') {
                    danoOuCuraAplicado = Math.floor(ap * 2.0 + 20);
                    nomeEfeito = "Corte Flamejante Cruzado";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` fatiou com lâminas incandescentes infligindo ${danoOuCuraAplicado} de dano.`;
                } else {
                    danoOuCuraAplicado = Math.floor(ap * 3.2);
                    nomeEfeito = "Labareda Ziguezague Instável";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` rasgou o campo com fogo em ziguezague causando ${danoOuCuraAplicado} de dano.`;
                }
                break;

            case 'orange': // Drenagem Vital
                if (forma === 'O') {
                    danoOuCuraAplicado = Math.floor(ap * 1.8);
                    nomeEfeito = "Vampirismo de Aura Circular";
                    this.curar(danoOuCuraAplicado);
                    resumoAcao = ` absorveu energias vitais curando-se em +${danoOuCuraAplicado} HP.`;
                } else if (forma === 'X') {
                    danoOuCuraAplicado = Math.floor(ap * 2.2);
                    nomeEfeito = "Drenagem Sanguínea Direta";
                    this.curar(danoOuCuraAplicado);
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` drenou ${danoOuCuraAplicado} HP diretamente do alvo para si.`;
                } else {
                    nomeEfeito = "Pulso Hemático Reativo";
                    this.state.stats.maxHp += 20;
                    this.curar(20);
                    resumoAcao = ` converteu sangue em max HP permanente (+20).`;
                }
                break;

            case 'yellow': // Ouro e Clarão
                if (forma === 'O') {
                    const ouroGerado = Math.floor(60 + (ap * 0.8));
                    this.state.gold = (this.state.gold || 0) + ouroGerado;
                    nomeEfeito = "Clarão Dourado Concentrado";
                    resumoAcao = ` materializou runas áureas gerando +${ouroGerado} Ouro!`;
                } else if (forma === 'X') {
                    danoOuCuraAplicado = Math.floor(ap * 1.5);
                    nomeEfeito = "Chuva de Ouro Penetrante";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` apedrejou o alvo com moedas energizadas (${danoOuCuraAplicado} dano).`;
                } else {
                    nomeEfeito = "Relâmpago do Sol Nascente";
                    this.state.stats.ap = (this.state.stats.ap || 0) + 15;
                    resumoAcao = ` amplificou permanentemente sua inteligência arcana (+15 AP).`;
                }
                break;

            case 'green': // Sopro da Natureza
                if (forma === 'O') {
                    danoOuCuraAplicado = Math.floor(ap * 3.0 + 50);
                    nomeEfeito = "Raiz Viva Protetora";
                    this.curar(danoOuCuraAplicado);
                    resumoAcao = ` evocou flora sagrada restaurando +${danoOuCuraAplicado} HP.`;
                } else if (forma === 'X') {
                    danoOuCuraAplicado = Math.floor(ap * 2.2);
                    nomeEfeito = "Espinhos Selvagens Cruzados";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` perfurou o inimigo com vinhas espinhosas (${danoOuCuraAplicado} dano).`;
                } else {
                    nomeEfeito = "Crescimento Silvestre Eterno";
                    this.state.stats.maxHp += 75;
                    this.curar(75);
                    resumoAcao = ` enraizou vigor celular expandindo o HP Máximo em +75.`;
                }
                break;

            case 'blue': // Barreiras de Água
                if (forma === 'O') {
                    danoOuCuraAplicado = Math.floor(150 + (ap * 2.5));
                    nomeEfeito = "Cúpula Aquática Absoluta";
                    this.state.stats.shield = (this.state.stats.shield || 0) + danoOuCuraAplicado;
                    resumoAcao = ` gerou um escudo protetor de gelo e água (+${danoOuCuraAplicado} Escudo).`;
                } else if (forma === 'X') {
                    danoOuCuraAplicado = Math.floor(ap * 2.4);
                    nomeEfeito = "Lança Gélida Perfurante";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` disparou um dardo congelante causando ${danoOuCuraAplicado} de dano.`;
                } else {
                    nomeEfeito = "Correnteza Veloz Fluida";
                    this.state.stats.ad = (this.state.stats.ad || 0) + 20;
                    resumoAcao = ` canalizou a fluidez da água aumentando o AD em +20.`;
                }
                break;

            case 'purple': // Sombras de Controle
                if (forma === 'O') {
                    danoOuCuraAplicado = Math.floor(ap * 2.0);
                    nomeEfeito = "Esfera Umbral Paralisante";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` aprisionou o alvo em gravidade sombria (${danoOuCuraAplicado} dano).`;
                } else if (forma === 'X') {
                    danoOuCuraAplicado = Math.floor(ap * 2.8);
                    nomeEfeito = "Fios de Sombra Cortantes";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` fatiou com agulhas do vazio causando ${danoOuCuraAplicado} de dano.`;
                } else {
                    danoOuCuraAplicado = Math.floor(ap * 3.5);
                    nomeEfeito = "Implosão Dimensional Sombria";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` colapsou o espaço ao redor do alvo infligindo ${danoOuCuraAplicado} dano.`;
                }
                break;

            case 'white': // Luz Absoluta (Divino - Nv 30)
                if (forma === 'O') {
                    nomeEfeito = "Halo Divino da Restauração";
                    this.state.stats.hp = this.state.stats.maxHp;
                    resumoAcao = ` purificou seu corpo restaurando 100% da Vida máxima instantaneamente!`;
                } else if (forma === 'X') {
                    danoOuCuraAplicado = Math.floor(ap * 5.0 + 100);
                    nomeEfeito = "Julgamento Sagrado Verdadeiro";
                    this.aplicarDanoRede(alvoId, danoOuCuraAplicado);
                    resumoAcao = ` puniu severamente o alvo com luz pura (${danoOuCuraAplicado} Dano Verdadeiro).`;
                } else {
                    nomeEfeito = "Feixe Pristino da Ascensão";
                    this.state.stats.ap = (this.state.stats.ap || 0) + 50;
                    this.state.stats.ad = (this.state.stats.ad || 0) + 30;
                    resumoAcao = ` elevou seus atributos divinos permanentemente (+50 AP, +30 AD).`;
                }
                break;
        }

        atualizarUI();
        
        // Sincroniza o efeito visual em rede com todos os jogadores
        this.emitirEventoDeRede(tipoAnimacao, hex, alvoId, danoOuCuraAplicado, `[${forma}] ${nomeEfeito}`);
        
        // Insere notificação no chat da sala
        this.enviarAcaoParaChat(forma, nomeEfeito, resumoAcao, hex);
    }

    aplicarDanoRede(alvoId, dano) {
        if (!this.multiplayerAtivo || !this.state.roomName) return;
        
        if (alvoId === this.meuId) {
            this.state.stats.hp = Math.max(0, (this.state.stats.hp || 0) - dano);
            this.verificarEstadoMorte();
            return;
        }

        const alvoRef = ref(this.db, `rooms/${this.state.roomName}/players/${alvoId}/stats`);
        get(alvoRef).then(snapshot => {
            const statsDoAlvo = snapshot.val();
            if (statsDoAlvo) {
                const hpAtual = statsDoAlvo.hp || 0;
                const escudo = statsDoAlvo.shield || 0;
                
                let hpRestante = hpAtual;
                let escudoRestante = escudo;
                
                if (escudo > 0) {
                    if (dano >= escudo) {
                        dano -= escudo;
                        escudoRestante = 0;
                        hpRestante = Math.max(0, hpAtual - dano);
                    } else {
                        escudoRestante -= dano;
                    }
                } else {
                    hpRestante = Math.max(0, hpAtual - dano);
                }

                update(alvoRef, { hp: hpRestante, shield: escudoRestante });
            }
        });
    }

    curar(valor) {
        this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor);
        this.verificarEstadoMorte();
        atualizarUI();
    }

    // ==========================================
    // SISTEMA VISUAL GLOBAL (ANIMAÇÕES VIVAS)
    // ==========================================
    renderizarEventoVisualGlobal(evento) {
        const isTarget = evento.targetId === this.meuId;
        const isSource = evento.sourceId === this.meuId;
        const layer = document.getElementById('lg-effect-layer');
        if (!layer) return;

        if (isTarget && evento.valor > 0) {
            document.body.style.animation = 'none';
            void document.body.offsetWidth;
            document.body.style.animation = 'shake 0.4s cubic-bezier(.36,.07,.19,.97) both';
        }

        this.gerarSistemasDeParticulas(evento.tipoAnimacao, evento.hexColor, layer);

        if (evento.valor > 0) {
            this.criarTextoFlutuante(
                (isTarget || isSource) ? `-${evento.valor}` : `-${evento.valor} (${evento.targetId})`, 
                evento.hexColor, 
                layer
            );
        }

        if (isSource) {
            this.animacaoTextoFlutuante(`Executado: ${evento.nomeEfeito}`, evento.hexColor);
        }
    }

    gerarSistemasDeParticulas(tipo, corHex, layer) {
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.top = '50%'; container.style.left = '50%';
        container.style.transform = 'translate(-50%, -50%)';
        
        if (tipo === 'explosao') {
            container.style.width = '120px'; container.style.height = '120px';
            container.style.borderRadius = '50%';
            container.style.border = `solid ${corHex}`;
            container.style.animation = 'shockwave 0.6s ease-out forwards';
        } else if (tipo === 'implosao') {
            container.style.width = '320px'; container.style.height = '320px';
            container.style.borderRadius = '50%';
            container.style.background = `radial-gradient(circle, ${corHex}88, transparent)`;
            container.style.animation = 'implode 0.8s ease-in forwards';
        } else if (tipo === 'pilar') {
            container.style.width = '100vw'; container.style.height = '0';
            container.style.background = `linear-gradient(to top, transparent, ${corHex}88, transparent)`;
            container.style.animation = 'pilar-luz 1s ease-in-out forwards';
            container.style.top = 'auto'; container.style.bottom = '0';
        } else if (tipo === 'espiral') {
            container.style.width = '150px'; container.style.height = '150px';
            container.style.border = `4px dashed ${corHex}`;
            container.style.borderRadius = '50%';
            container.style.animation = 'spiralSpin 0.7s linear forwards';
        } else {
            for (let i = 0; i < 16; i++) {
                const part = document.createElement('div');
                part.className = 'lg-particle';
                part.style.background = corHex;
                part.style.boxShadow = `0 0 10px ${corHex}`;
                
                const size = Math.random() * 14 + 4;
                part.style.width = `${size}px`; part.style.height = `${size}px`;
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 160 + 40;
                const tx = Math.cos(angle) * distance;
                const ty = Math.sin(angle) * distance;
                
                part.style.transition = 'all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
                part.style.transform = `translate(0px, 0px) scale(1)`;
                part.style.opacity = '1';
                
                container.appendChild(part);
                
                setTimeout(() => {
                    part.style.transform = `translate(${tx}px, ${ty}px) scale(0)`;
                    part.style.opacity = '0';
                }, 40);
            }
            setTimeout(() => container.remove(), 900);
        }

        layer.appendChild(container);
        if (tipo === 'explosao' || tipo === 'implosao' || tipo === 'pilar' || tipo === 'espiral') {
            setTimeout(() => container.remove(), 1000);
        }
    }

    criarTextoFlutuante(texto, cor, layer) {
        const span = document.createElement('div');
        span.className = 'lg-damage-text';
        span.style.color = cor;
        span.innerText = texto;
        
        const xOffset = (Math.random() - 0.5) * 110;
        const yOffset = (Math.random() - 0.5) * 60;
        
        span.style.left = `calc(50% + ${xOffset}px)`;
        span.style.top = `calc(50% + ${yOffset}px)`;
        
        layer.appendChild(span);
        setTimeout(() => span.remove(), 1500);
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.style.position = 'fixed';
        textAnim.style.top = '28%';
        textAnim.style.left = '50%';
        textAnim.style.transform = 'translate(-50%, -50%)';
        textAnim.style.color = cor;
        textAnim.style.fontSize = '1.4rem';
        textAnim.style.fontWeight = '900';
        textAnim.style.textShadow = `0 4px 15px rgba(0,0,0,0.9), 0 0 10px ${cor}`;
        textAnim.style.zIndex = '10001';
        textAnim.style.pointerEvents = 'none';
        textAnim.style.textAlign = 'center';
        textAnim.style.animation = 'float-up 1.3s ease-out forwards';
        textAnim.innerText = texto;

        document.body.appendChild(textAnim);
        setTimeout(() => textAnim.remove(), 1300);
    }

    enviarAcaoParaChat(forma, nomeEfeito, resumo, hex) {
        if (!this.state.roomName || !this.multiplayerAtivo) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: this.meuId,
            text: `<strong style="color:${hex}; background:rgba(0,0,0,0.6); padding:2px 6px; border-radius:4px;">[${forma}] ${nomeEfeito}</strong>${resumo}`,
            type: "combat",
            time: Date.now()
        });
    }

    // ==========================================
    // FORJA E FARM ARCANO
    // ==========================================
    criarItemDaLoja(tipoItem) {
        const custoHpSacrificio = Math.floor(this.state.stats.maxHp * 0.25);
        
        if (this.state.stats.hp <= custoHpSacrificio || this.state.stats.maxHp <= 300) {
            return this.animacaoTextoFlutuante("Falha: Resiliência Vital Insuficiente!", "#ff0000");
        }

        this.state.stats.hp -= custoHpSacrificio;
        this.verificarEstadoMorte();
        
        this.emitirEventoDeRede('explosao', '#8b0000', this.meuId, custoHpSacrificio, 'Sacrifício de Sangue');

        if (tipoItem === 'espada') {
            this.state.stats.ad = (this.state.stats.ad || 0) + 35;
            this.animacaoTextoFlutuante("Espada Longa Forjada! (+35 AD)", "#ffaa00");
        } else if (tipoItem === 'tomo') {
            this.state.stats.ap = (this.state.stats.ap || 0) + 50;
            this.atualizarTintaEstatistica();
            this.animacaoTextoFlutuante("Tomo Amplificador! (+50 AP)", "#8a2be2");
        } else if (tipoItem === 'cristal') {
            this.state.stats.maxHp += 300;
            this.state.stats.hp += 300;
            this.animacaoTextoFlutuante("Cristal de Rubi! (+300 HP)", "#ff3333");
        }

        document.getElementById('lg-modal-loja').classList.remove('active');
        atualizarUI();
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

        let contador = 0;
        const maxAlvos = 15;

        const gerarAlvo = () => {
            if (contador >= maxAlvos || !this.minigameAtivo) {
                this.finalizarMinigameFarm();
                return;
            }

            const alvoEl = document.createElement('div');
            alvoEl.style.position = 'absolute';
            alvoEl.style.width = '48px';
            alvoEl.style.height = '48px';
            alvoEl.style.borderRadius = '50%';
            alvoEl.style.background = 'radial-gradient(circle at 30% 30%, #fff, var(--lg-gold))';
            alvoEl.style.boxShadow = '0 0 15px var(--lg-gold)';
            alvoEl.style.left = `${Math.random() * (arena.clientWidth - 55)}px`;
            alvoEl.style.top = `${Math.random() * (arena.clientHeight - 55)}px`;
            alvoEl.style.cursor = 'pointer';
            alvoEl.style.transition = 'transform 0.1s';
            alvoEl.style.animation = 'float-up 0.8s ease-in reverse forwards';
            
            const tempoDecaimento = Math.max(350, 750 - (contador * 25));

            const timeoutTarget = setTimeout(() => {
                if (alvoEl.parentNode) {
                    alvoEl.style.background = '#ff0000';
                    setTimeout(()=> alvoEl.remove(), 100);
                    gerarAlvo();
                }
            }, tempoDecaimento); 

            const onHit = (e) => {
                e.preventDefault();
                clearTimeout(timeoutTarget);
                this.minigameScore += 1;
                status.innerText = `Pontos: ${this.minigameScore} 🔥`;
                
                alvoEl.style.transform = 'scale(2)';
                alvoEl.style.opacity = '0';
                
                setTimeout(() => {
                    alvoEl.remove();
                    gerarAlvo();
                }, 120);
            };

            alvoEl.addEventListener('mousedown', onHit);
            alvoEl.addEventListener('touchstart', onHit, { passive: false });

            arena.appendChild(alvoEl);
            contador++;
        };

        gerarAlvo();
    }

    finalizarMinigameFarm() {
        this.minigameAtivo = false;
        const btnStart = document.getElementById('lg-start-farm');
        if (btnStart) btnStart.style.display = 'block';
        
        const ouroGanhado = this.minigameScore * 75;
        const xpGanhado = this.minigameScore * 45;

        this.state.gold = (this.state.gold || 0) + ouroGanhado;
        this.animacaoTextoFlutuante(`Farm Rito: +${ouroGanhado} Ouro | +${xpGanhado} XP`, "#ffff00");
        
        setTimeout(() => {
            const modalFarm = document.getElementById('lg-modal-farm');
            if (modalFarm) modalFarm.classList.remove('active');
        }, 1000);
        
        atualizarUI();
    }
    teleportarParaLane(lane) {
    const custoTeleporte = 100;
    const cooldownMs = 10000; // 10 segundos
    const agora = Date.now();

    if (agora - this.ultimoTeleporte < cooldownMs) {
        const faltam = Math.ceil((cooldownMs - (agora - this.ultimoTeleporte)) / 1000);
        return this.animacaoTextoFlutuante(`Em recarga! Aguarde ${faltam}s`, "#ffaa00");
    }

    if ((this.state.gold || 0) < custoTeleporte) {
        return this.animacaoTextoFlutuante("Ouro insuficiente para teleporte!", "#ff0000");
    }

    this.state.gold -= custoTeleporte;
    this.ultimoTeleporte = agora;

    document.getElementById('lg-modal-lanes').classList.remove('active');
    this.emitirEventoDeRede('espiral', '#c5a059', this.meuId, 0, `Teleporte: ${lane}`);
    this.animacaoTextoFlutuante(`Movido para ${lane}! (-${custoTeleporte}G)`, "#c5a059");
    atualizarUI();

    // Arrumando a movimentação: Integração com a sua engine
    if (window.moverNoMapa) window.moverNoMapa(lane.toLowerCase());
}
}
