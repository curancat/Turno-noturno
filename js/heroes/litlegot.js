import { ref, push, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;

        this.corAtiva = 'red';
        this.alvoSelecionado = 'Inimigo da Rota';
        this.folhasGuardadas = []; 
        this.maxFolhas = 3;

        this.multiplayerAtivo = false;
        this.desenhandoCanvas = false;
        this.pontosDesenho = [];

        // Inicializando atributos caso não existam
        if (!this.state.stats) this.state.stats = {};
        if (!this.state.inventory) this.state.inventory = [];

        // TINTAS - Custo e Escala de AP
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25 },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20 },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15 },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30 },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25 },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35 },
            white: { nome: 'Luz Absoluta', hex: '#ffffff', custo: 60 }
        };

        // ITENS DE LOJA (Forjados com HP do Litlegot fora da base)
        this.itensLoja = {
            'espada_longa': { nome: 'Espada Longa', icone: '🗡️', ad: 10, ap: 0, hp: 0, ms: 0, custoHpLitlegot: 15 },
            'tomo_amplificador': { nome: 'Tomo Amplificador', icone: '📖', ad: 0, ap: 20, hp: 0, ms: 0, custoHpLitlegot: 15 },
            'cristal_rubi': { nome: 'Cristal de Rubi', icone: '💎', ad: 0, ap: 0, hp: 150, ms: 0, custoHpLitlegot: 20 },
            'botas_iniciais': { nome: 'Botas Leves', icone: '🥾', ad: 0, ap: 0, hp: 0, ms: 25, custoHpLitlegot: 10 }
        };

        this.minigameAtivo = false;
        this.minigameScore = 0;
        
        // CATÁLOGO DEFINITIVO DE 21 EFEITOS REAIS (7 Cores x 3 Formas)
        this.catalogoEfeitos = this.gerarCatalogoDeEfeitos();
    }

    iniciar() {
        this.iniciarMonitoramentoMultiplayer();
        this.injetarCSSMobileEPopups();
        this.criarPopupsEModais();
        this.vincularCanvasEventos();
        this.atualizarTintaEstatistica();
        
        // Bloqueia regeneração automática de mana/tinta por tempo
        this.state.stats.manaRegen = 0;
        this.state.stats.mana = this.state.stats.maxMana;
        atualizarUI();
    }

    // ==========================================
    // SISTEMA DE 21 HABILIDADES ÚNICAS (REAIS)
    // ==========================================
    gerarCatalogoDeEfeitos() {
        return {
            'red': {
                'O': { nome: "Meteoro Rubro", desc: "Dano massivo em área.", executar: (ap) => { this.causarDano(Math.floor(ap * 2.5)); } },
                'X': { nome: "Corte da Carnificina", desc: "Dano perfurante único.", executar: (ap) => { this.causarDano(Math.floor(ap * 3.5)); this.state.enemyArmor = Math.max(0, (this.state.enemyArmor || 30) - 10); } },
                'Z': { nome: "Fenda Magmática", desc: "Dano contínuo e queima.", executar: (ap) => { this.causarDano(Math.floor(ap * 1.5)); this.aplicarQueimadura(Math.floor(ap * 0.5)); } }
            },
            'orange': {
                'O': { nome: "Círculo Vampírico", desc: "Rouba vida do inimigo.", executar: (ap) => { const dano = Math.floor(ap * 1.5); this.causarDano(dano); this.curar(dano); } },
                'X': { nome: "Marca do Sanguessuga", desc: "Cura focada no aliado.", executar: (ap) => { this.curar(Math.floor(ap * 2.5)); } },
                'Z': { nome: "Veia Drenante", desc: "Converte HP inimigo em Mana.", executar: (ap) => { this.causarDano(Math.floor(ap * 1.0)); this.restaurarMana(Math.floor(ap * 1.5)); } }
            },
            'yellow': {
                'O': { nome: "Sol da Prosperidade", desc: "Gera muito ouro.", executar: (ap) => { this.gerarOuro(50 + Math.floor(ap * 0.5)); } },
                'X': { nome: "Selo do Caçador", desc: "Gera ouro e corta cura.", executar: (ap) => { this.gerarOuro(30); this.state.enemyAntiHeal = true; setTimeout(() => this.state.enemyAntiHeal = false, 5000); } },
                'Z': { nome: "Avanço Relâmpago", desc: "Gera Ouro e Velocidade Mov.", executar: (ap) => { this.gerarOuro(20); this.buffVelocidade(40, 4000); } }
            },
            'green': {
                'O': { nome: "Jardim das Fadas", desc: "Cura Max HP permanente.", executar: (ap) => { this.aumentarMaxHp(25); this.curar(Math.floor(ap * 1.0)); } },
                'X': { nome: "Espinhos Protetores", desc: "Cura e devolve dano.", executar: (ap) => { this.curar(Math.floor(ap * 1.5)); this.state.stats.thorns = (this.state.stats.thorns || 0) + 15; } },
                'Z': { nome: "Raízes Vingativas", desc: "Prende o inimigo (Root).", executar: (ap) => { this.causarDano(Math.floor(ap * 1.0)); this.aplicarCC('root', 3000); } }
            },
            'blue': {
                'O': { nome: "Bolha do Leviatã", desc: "Escudo massivo.", executar: (ap) => { this.gerarEscudo(150 + Math.floor(ap * 2.0)); } },
                'X': { nome: "Cristalização", desc: "Escudo + Armadura extra.", executar: (ap) => { this.gerarEscudo(100); this.state.stats.armor = (this.state.stats.armor || 0) + 20; } },
                'Z': { nome: "Correnteza Pura", desc: "Limpa Debuffs e dá escudo.", executar: (ap) => { this.gerarEscudo(80); this.limparDebuffs(); } }
            },
            'purple': {
                'O': { nome: "Prisão do Vazio", desc: "Atordoa inimigo (Stun).", executar: (ap) => { this.causarDano(Math.floor(ap * 1.0)); this.aplicarCC('stun', 2500); } },
                'X': { nome: "Maldição do Silêncio", desc: "Silencia habilidades inimigas.", executar: (ap) => { this.aplicarCC('silence', 4000); } },
                'Z': { nome: "Ruptura Dimensional", desc: "Reduz Dano do inimigo.", executar: (ap) => { this.state.enemyAd = Math.max(0, (this.state.enemyAd || 100) - 30); this.causarDano(Math.floor(ap * 1.5)); } }
            },
            'white': {
                'O': { nome: "Julgamento Divino", desc: "Dano Verdadeiro Devastador.", executar: (ap) => { this.causarDanoVerdadeiro(Math.floor(ap * 4.0)); } },
                'X': { nome: "Ressurreição da Tela", desc: "Cura massiva crítica.", executar: (ap) => { this.curar(Math.floor(this.state.stats.maxHp * 0.4)); } },
                'Z': { nome: "Ascensão", desc: "Bônus temporário de todos Status.", executar: (ap) => { this.buffStatusGeral(30, 8000); } }
            }
        };
    }

    // Funções de manipulação do Estado para as 21 habilidades
    causarDano(valor) { this.state.enemyHp = Math.max(0, (this.state.enemyHp || 1000) - valor); }
    causarDanoVerdadeiro(valor) { this.state.enemyHp = Math.max(0, (this.state.enemyHp || 1000) - valor); } // Ignora armadura na lógica principal do seu app
    curar(valor) { this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor); }
    restaurarMana(valor) { this.state.stats.mana = Math.min(this.state.stats.maxMana, (this.state.stats.mana || 0) + valor); }
    gerarOuro(valor) { this.state.gold = (this.state.gold || 0) + valor; }
    aumentarMaxHp(valor) { this.state.stats.maxHp += valor; this.state.stats.hp += valor; }
    gerarEscudo(valor) { this.state.stats.shield = (this.state.stats.shield || 0) + valor; }
    aplicarQueimadura(valor) { this.state.enemyBurn = (this.state.enemyBurn || 0) + valor; }
    aplicarCC(tipo, duracaoMs) {
        if (tipo === 'stun') this.state.enemyStunned = true;
        if (tipo === 'root') this.state.enemyRooted = true;
        if (tipo === 'silence') this.state.enemySilenced = true;
        setTimeout(() => {
            if (tipo === 'stun') this.state.enemyStunned = false;
            if (tipo === 'root') this.state.enemyRooted = false;
            if (tipo === 'silence') this.state.enemySilenced = false;
            atualizarUI();
        }, duracaoMs);
    }
    buffVelocidade(valor, tempo) {
        this.state.stats.ms = (this.state.stats.ms || 300) + valor;
        setTimeout(() => { this.state.stats.ms -= valor; atualizarUI(); }, tempo);
    }
    limparDebuffs() { this.state.isStunned = false; this.state.isSilenced = false; this.state.isSlowed = false; }
    buffStatusGeral(valor, tempo) {
        this.state.stats.ap = (this.state.stats.ap || 0) + valor;
        this.state.stats.ad = (this.state.stats.ad || 0) + valor;
        setTimeout(() => {
            this.state.stats.ap -= valor;
            this.state.stats.ad -= valor;
            atualizarUI();
        }, tempo);
    }

    // ==========================================
    // MULTIPLAYER E BASE DE TINTA
    // ==========================================
    iniciarMonitoramentoMultiplayer() {
        if (!this.state.roomName) return;
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        onValue(playersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const qtdJogadores = Object.keys(data).length;
                this.multiplayerAtivo = qtdJogadores > 1;
                this.atualizarBloqueioMultiplayer();
            }
        });
    }

    atualizarBloqueioMultiplayer() {
        const lockScreen = document.getElementById('lg-multiplayer-lock');
        if (lockScreen) {
            lockScreen.style.display = this.multiplayerAtivo ? 'none' : 'flex';
        }
    }

    atualizarTintaEstatistica() {
        const apAtual = this.state.stats.ap || 0;
        this.state.stats.maxMana = Math.floor(100 + (apAtual * 3.0));
        if (this.state.stats.mana > this.state.stats.maxMana) {
            this.state.stats.mana = this.state.stats.maxMana;
        }
        atualizarUI();
    }

    retornarABase() {
        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana;
        this.animacaoTextoFlutuante("Base: Tinta Recarregada!", "#00ffcc");
        atualizarUI();
    }

    // ==========================================
    // UI COMPACTA MOBILE & MODAIS EM POPUPS
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v3')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v3';
        style.innerHTML = `
            :root {
                --lg-gold: #e5b85c;
                --lg-dark: #0f1015;
                --lg-card: #1c1e26;
                --lg-border: rgba(229, 184, 92, 0.4);
            }
            .lg-fab-container {
                position: fixed; bottom: 20px; right: 20px; z-index: 9990;
                display: flex; flex-direction: column; gap: 12px;
            }
            .lg-fab {
                width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--lg-gold);
                background: var(--lg-dark); color: #fff; font-size: 1.5rem; display: flex;
                align-items: center; justify-content: center; box-shadow: 0 6px 15px rgba(0,0,0,0.7);
                touch-action: manipulation; transition: transform 0.1s; cursor: pointer;
            }
            .lg-fab:active { transform: scale(0.9); }
            .lg-popup {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
                z-index: 10000; display: none; align-items: center; justify-content: center; padding: 15px;
                box-sizing: border-box; flex-direction: column;
            }
            .lg-popup-card {
                background: var(--lg-card); border: 2px solid var(--lg-gold); border-radius: 16px;
                width: 100%; max-width: 450px; padding: 20px; color: #fff;
                box-shadow: 0 0 30px rgba(229, 184, 92, 0.2); display: flex;
                flex-direction: column; gap: 15px; max-height: 90vh; overflow-y: auto;
            }
            .lg-canvas-box {
                width: 100%; height: 300px; background: #07070a; border: 2px dashed #555;
                border-radius: 12px; touch-action: none; position: relative; overflow: hidden;
            }
            .lg-palette {
                display: flex; justify-content: space-around; gap: 8px; overflow-x: auto; padding: 10px 0;
            }
            .lg-color-dot {
                width: 40px; height: 40px; border-radius: 50%; border: 3px solid transparent; flex-shrink: 0;
                box-shadow: 0 4px 6px rgba(0,0,0,0.5); transition: 0.2s; cursor: pointer;
            }
            .lg-color-dot.active { border-color: #fff; transform: translateY(-5px) scale(1.1); box-shadow: 0 10px 15px rgba(255,255,255,0.3); }
            .lg-grid-folhas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
            .lg-folha-card {
                border: 2px solid; background: rgba(0,0,0,0.4); border-radius: 8px;
                padding: 12px 8px; text-align: center; cursor: pointer; transition: 0.2s;
            }
            .lg-folha-card:active { transform: scale(0.95); }
            .lg-craft-item {
                background: linear-gradient(145deg, #2a2d39, #1c1e26); border: 1px solid var(--lg-border);
                color: #fff; padding: 15px; border-radius: 10px; text-align: left; display: flex;
                align-items: center; gap: 15px; font-size: 1rem; cursor: pointer;
            }
            .lg-craft-item:active { background: #111; }
            .lg-btn-action {
                background: var(--lg-gold); color: #000; font-weight: 900; border: none;
                padding: 15px; border-radius: 8px; font-size: 1.1rem; cursor: pointer; text-transform: uppercase;
            }
            
            /* Bloqueio Multiplayer */
            #lg-multiplayer-lock {
                position: absolute; top:0; left:0; width:100%; height:100%;
                background: rgba(0,0,0,0.9); z-index: 10001; display: flex;
                flex-direction: column; align-items: center; justify-content: center;
                text-align: center; padding: 20px; box-sizing: border-box;
                border-radius: 14px;
            }

            @keyframes lg-shockwave {
                0% { transform: scale(0.1); opacity: 1; border-width: 10px; }
                100% { transform: scale(3); opacity: 0; border-width: 1px; }
            }
            .lg-effect-layer {
                position: fixed; top:0; left:0; width:100vw; height:100vh;
                pointer-events:none; z-index:9998;
            }
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

        const fabContainer = document.createElement('div');
        fabContainer.className = 'lg-fab-container';
        fabContainer.innerHTML = `
            <button class="lg-fab" id="lg-btn-ateliere" title="Ateliê de Pintura">🎨</button>
            <button class="lg-fab" id="lg-btn-mochila" title="Mochila de Desenhos">📜</button>
            <button class="lg-fab" id="lg-btn-farm" title="Ritual de Farm">🌾</button>
            <button class="lg-fab" id="lg-btn-loja" title="Forja de Itens">⚒️</button>
            <button class="lg-fab" id="lg-btn-base" title="Retornar à Base">🏛️</button>
        `;
        document.body.appendChild(fabContainer);

        // Modal Canvas
        const popupCanvas = document.createElement('div');
        popupCanvas.id = 'lg-modal-canvas';
        popupCanvas.className = 'lg-popup';
        popupCanvas.innerHTML = `
            <div class="lg-popup-card" style="position: relative;">
                <div id="lg-multiplayer-lock">
                    <h2>⚠️ Requer Aliados</h2>
                    <p style="color:#aaa;">As habilidades do Litlegot só podem ser canalizadas quando a sala possui 2 ou mais jogadores online.</p>
                    <button class="lg-close-btn lg-btn-action" style="margin-top:20px; width:100%;">Entendi</button>
                </div>

                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:var(--lg-gold); font-size:1.3rem;">🎨 Ateliê</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.5rem;">✕</button>
                </div>
                <div style="font-size:0.9rem; color:#ccc;">Desenhe as runas <b>O</b>, <b>X</b> ou <b>Z</b> em um único traço contínuo.</div>
                
                <div class="lg-palette" id="lg-palette-select"></div>
                <div class="lg-canvas-box">
                    <canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas>
                </div>
                <div style="display:flex; gap:10px;">
                    <button id="lg-btn-limpar" style="flex:1; background:#333; color:#fff; border:none; border-radius:8px; font-weight:bold;">Limpar</button>
                    <button id="lg-btn-guardar" class="lg-btn-action" style="flex:2;">Guardar Arte</button>
                </div>
            </div>
        `;
        document.body.appendChild(popupCanvas);

        // Modal Mochila
        const popupMochila = document.createElement('div');
        popupMochila.id = 'lg-modal-mochila';
        popupMochila.className = 'lg-popup';
        popupMochila.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:var(--lg-gold); font-size:1.3rem;">📜 Mochila (Máx 3)</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.5rem;">✕</button>
                </div>
                <select id="lg-alvo-select" style="background:#111; color:#fff; padding:12px; border:1px solid var(--lg-gold); border-radius:8px; font-size:1rem; width:100%;">
                    <option value="Inimigo da Rota">Inimigo da Rota</option>
                    <option value="Minion Inimigo">Minion Inimigo</option>
                    <option value="Torre Inimiga">Torre Inimiga</option>
                    <option value="Aliado">Aliado Principal</option>
                    <option value="Si Mesmo">Si Mesmo (Litlegot)</option>
                </select>
                <div class="lg-grid-folhas" id="lg-folhas-container"></div>
            </div>
        `;
        document.body.appendChild(popupMochila);

        // Modal Farm
        const popupFarm = document.createElement('div');
        popupFarm.id = 'lg-modal-farm';
        popupFarm.className = 'lg-popup';
        popupFarm.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:var(--lg-gold); font-size:1.3rem;">🌾 Rito de Farm</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.5rem;">✕</button>
                </div>
                <div style="font-size:0.9rem; color:#ccc;">Toque nos orbes de ouro o mais rápido possível!</div>
                <div style="position:relative; width:100%; height:300px; background:#000; border:2px solid #333; border-radius:12px; overflow:hidden; touch-action:none;" id="lg-farm-arena">
                    <div id="lg-farm-status" style="position:absolute; top:10px; left:10px; color:#fff; font-size:1rem; font-weight:bold; text-shadow:1px 1px 2px #000; z-index:10;">Pontos: 0</div>
                </div>
                <button id="lg-start-farm" class="lg-btn-action" style="background:#28a745; color:#fff;">Iniciar Ritual</button>
            </div>
        `;
        document.body.appendChild(popupFarm);

        // Modal Forja (Loja Física)
        const popupLoja = document.createElement('div');
        popupLoja.id = 'lg-modal-loja';
        popupLoja.className = 'lg-popup';
        let htmlItensLoja = '';
        
        Object.keys(this.itensLoja).forEach(key => {
            const item = this.itensLoja[key];
            htmlItensLoja += `
                <button class="lg-craft-item" data-item="${key}">
                    <div style="font-size:2rem;">${item.icone}</div>
                    <div style="flex:1;">
                        <div style="font-weight:bold; color:var(--lg-gold);">${item.nome}</div>
                        <div style="font-size:0.8rem; color:#aaa;">Custo: -${item.custoHpLitlegot}% do seu HP Max</div>
                    </div>
                </button>
            `;
        });

        popupLoja.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:var(--lg-gold); font-size:1.3rem;">⚒️ Forja Sanguínea</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.5rem;">✕</button>
                </div>
                <div style="font-size:0.9rem; color:#ff4444;">Compre itens reais de loja fora da base sacrificando sua própria vida! Falha se HP &lt; 25%.</div>
                <div style="display:flex; flex-direction:column; gap:10px; margin-top:10px;">
                    ${htmlItensLoja}
                </div>
            </div>
        `;
        document.body.appendChild(popupLoja);

        this.vincularEventosModais();
        this.renderizarPaleta();
        this.atualizarBloqueioMultiplayer();
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
            dot.dataset.color = corKey;
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
            if (popup) popup.style.display = show ? 'flex' : 'none';
        };

        document.getElementById('lg-btn-ateliere').onclick = () => { togglePopup('lg-modal-canvas', true); this.redimensionarCanvas(); this.atualizarBloqueioMultiplayer(); };
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarUIFolhas(); togglePopup('lg-modal-mochila', true); };
        document.getElementById('lg-btn-farm').onclick = () => togglePopup('lg-modal-farm', true);
        document.getElementById('lg-btn-loja').onclick = () => togglePopup('lg-modal-loja', true);
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();

        document.querySelectorAll('.lg-close-btn').forEach(btn => {
            btn.onclick = (e) => { e.target.closest('.lg-popup').style.display = 'none'; };
        });

        document.getElementById('lg-btn-limpar').onclick = () => this.limparCanvas();
        document.getElementById('lg-btn-guardar').onclick = () => this.guardarDesenho();
        document.getElementById('lg-start-farm').onclick = () => this.iniciarMinigameFarm();

        document.querySelectorAll('.lg-craft-item').forEach(btn => {
            btn.onclick = (e) => this.comprarItemForaDaBase(e.currentTarget.dataset.item);
        });

        const selectAlvo = document.getElementById('lg-alvo-select');
        if (selectAlvo) {
            selectAlvo.onchange = (e) => { this.alvoSelecionado = e.target.value; };
        }
    }

    // ==========================================
    // CANETA & RECONHECIMENTO DE PADRÃO O, X, Z
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
            if(e.cancelable) e.preventDefault(); // Previne scroll no mobile
            if(!this.multiplayerAtivo) return;

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
            if(e.cancelable) e.preventDefault();
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };

        const stopDraw = () => {
            if (!this.desenhandoCanvas) return;
            this.desenhandoCanvas = false;
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseout', stopDraw);

        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDraw);
        canvas.addEventListener('touchcancel', stopDraw);
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
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        this.pontosDesenho = [];
    }

    reconhecerForma() {
        const pts = this.pontosDesenho;
        if (pts.length < 10) return null; // Traço muito curto

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

        // Se fechou um circulo (Início e fim próximos) E tem tamanho razoável
        if (distStartEnd < 50 && width > 40 && height > 40) return 'O';

        // Lógica para 'Z' (Múltiplas mudanças bruscas de direção no eixo X)
        let MudancasDirecaoX = 0;
        for (let i = 2; i < pts.length - 2; i += 2) {
            const dirPrev = pts[i].x - pts[i - 2].x;
            const dirNext = pts[i + 2].x - pts[i].x;
            if (Math.sign(dirPrev) !== Math.sign(dirNext) && Math.abs(dirPrev) > 5 && Math.abs(dirNext) > 5) {
                MudancasDirecaoX++;
            }
        }

        if (MudancasDirecaoX >= 2) return 'Z';
        
        // Se não é O nem Z, mas tem altura ou largura, consideramos X (Traço de Corte)
        if (height > 30 || width > 30) return 'X';

        return null;
    }

    guardarDesenho() {
        if (!this.multiplayerAtivo) return;

        if (this.folhasGuardadas.length >= this.maxFolhas) {
            return this.animacaoTextoFlutuante("Mochila Cheia! (Máx 3 folhas)", "#ff0000");
        }

        const forma = this.reconhecerForma();
        if (!forma) {
            return this.animacaoTextoFlutuante("Desenho Riscado/Incompleto!", "#ff8c00");
        }

        const corData = this.tintas[this.corAtiva];
        const custoReal = corData.custo;

        if (this.state.stats.mana < custoReal) {
            return this.animacaoTextoFlutuante(`Sem tinta! Requer: ${custoReal}`, "#ff0000");
        }

        const habilidadeInfo = this.catalogoEfeitos[this.corAtiva][forma];

        this.state.stats.mana -= custoReal;
        this.folhasGuardadas.push({
            id: Date.now(),
            forma: forma,
            corKey: this.corAtiva,
            corHex: corData.hex,
            nomeMagia: habilidadeInfo.nome,
            descMagia: habilidadeInfo.desc,
            apSnapshot: this.state.stats.ap || 0
        });

        this.limparCanvas();
        this.animacaoTextoFlutuante(`Preparado: ${habilidadeInfo.nome}`, corData.hex);
        document.getElementById('lg-modal-canvas').style.display = 'none';
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<div style="grid-column:1/span 3; color:#777; font-size:1rem; text-align:center;">Nenhuma arte na mochila.</div>';
            return;
        }

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = folha.corHex;
            card.innerHTML = `
                <div style="font-size:2.5rem; font-weight:900; color:${folha.corHex}; text-shadow: 0 0 10px ${folha.corHex};">${folha.forma}</div>
                <div style="font-size:0.75rem; color:#fff; font-weight:bold; margin-top:5px;">${folha.nomeMagia}</div>
                <div style="font-size:0.6rem; color:#aaa; margin-bottom:8px;">${folha.descMagia}</div>
                <button style="background:${folha.corHex}; color:#000; border:none; padding:8px; border-radius:5px; font-weight:bold; width:100%; text-transform:uppercase;">Conjurar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(index);
            container.appendChild(card);
        });
    }

    // ==========================================
    // EXECUÇÃO EM CAMPO (USO DO CATÁLOGO DE 21)
    // ==========================================
    ativarFolha(index) {
        if (!this.multiplayerAtivo) {
            return this.animacaoTextoFlutuante("Requer Aliados na Sala!", "#ff0000");
        }

        const folha = this.folhasGuardadas[index];
        if (!folha) return;

        // Remove a folha
        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').style.display = 'none';

        // Executa baseada no dicionário real
        const apFinal = folha.apSnapshot || this.state.stats.ap || 0;
        const hex = folha.corHex;
        const hab = this.catalogoEfeitos[folha.corKey][folha.forma];

        // Chama a função executora passando o AP
        hab.executar(apFinal);
        
        // Efeitos Visuais e Feedback
        this.criarEfeitoOnda(hex);
        atualizarUI();
        
        const resumoEfeito = `conjurou **${hab.nome}** contra [${this.alvoSelecionado}]!`;
        this.enviarAcaoParaChat(folha.forma, hab.nome, resumoEfeito, hex);
    }

    // ==========================================
    // LOJA FÍSICA E FORJA (CUSTA HP)
    // ==========================================
    comprarItemForaDaBase(idItem) {
        if (!this.multiplayerAtivo) {
            return this.animacaoTextoFlutuante("Requer Aliados na Sala!", "#ff0000");
        }

        const item = this.itensLoja[idItem];
        if(!item) return;

        const maxHpLitlegot = this.state.stats.maxHp || 1000;
        const hpAtualLitlegot = this.state.stats.hp || maxHpLitlegot;
        const custoHpAbsoluto = Math.floor(maxHpLitlegot * (item.custoHpLitlegot / 100));

        // Regra de falha: Se HP < 25%, não pode craftar
        if (hpAtualLitlegot <= (maxHpLitlegot * 0.25)) {
            return this.animacaoTextoFlutuante("Sua Vida está muito baixa (<25%)!", "#ff0000");
        }

        // Drena o HP
        this.state.stats.hp -= custoHpAbsoluto;

        // Adiciona os atributos reais do Item Físico
        this.state.stats.ad = (this.state.stats.ad || 0) + item.ad;
        this.state.stats.ap = (this.state.stats.ap || 0) + item.ap;
        this.state.stats.maxHp = (this.state.stats.maxHp || 0) + item.hp;
        this.state.stats.hp = (this.state.stats.hp || 0) + item.hp;
        this.state.stats.ms = (this.state.stats.ms || 300) + item.ms;

        // Adiciona ao inventário para mostrar na UI do jogo
        this.state.inventory.push({ nome: item.nome, icone: item.icone });

        this.animacaoTextoFlutuante(`Forjou: ${item.nome}! (-${custoHpAbsoluto} HP)`, "#ff4444");
        document.getElementById('lg-modal-loja').style.display = 'none';
        atualizarUI();
    }

    // ==========================================
    // RITUAL DE FARM (OTIMIZADO MOBILE)
    // ==========================================
    iniciarMinigameFarm() {
        const arena = document.getElementById('lg-farm-arena');
        const status = document.getElementById('lg-farm-status');
        if (!arena) return;

        this.minigameScore = 0;
        this.minigameAtivo = true;
        status.innerText = "Pontos: 0";

        let contador = 0;
        const maxAlvos = 10;
        const btnStart = document.getElementById('lg-start-farm');
        btnStart.style.display = 'none';

        const gerarAlvo = () => {
            if (contador >= maxAlvos || !this.minigameAtivo) {
                this.finalizarMinigameFarm();
                btnStart.style.display = 'block';
                btnStart.innerText = "Tentar Novamente";
                return;
            }

            const alvoEl = document.createElement('div');
            // Tamanho maior para touch em mobile (min 44px)
            const size = 50 + Math.random() * 20; 
            alvoEl.style.position = 'absolute';
            alvoEl.style.width = `${size}px`;
            alvoEl.style.height = `${size}px`;
            alvoEl.style.borderRadius = '50%';
            alvoEl.style.background = 'radial-gradient(circle, #ffe259, #ffa751)';
            alvoEl.style.border = '2px solid #fff';
            
            const maxLeft = arena.clientWidth - size;
            const maxTop = arena.clientHeight - size;
            alvoEl.style.left = `${Math.random() * maxLeft}px`;
            alvoEl.style.top = `${Math.random() * maxTop}px`;
            
            alvoEl.style.cursor = 'pointer';
            alvoEl.style.boxShadow = '0 0 15px #ffa751';

            // Tempo curto mas justo
            const timeoutTarget = setTimeout(() => {
                if (alvoEl.parentNode) {
                    alvoEl.remove();
                    gerarAlvo();
                }
            }, 800); 

            // Funciona no click e no touch
            const hitTarget = (e) => {
                if(e.cancelable) e.preventDefault();
                clearTimeout(timeoutTarget);
                this.minigameScore += 1;
                status.innerText = `Pontos: ${this.minigameScore}`;
                alvoEl.remove();
                gerarAlvo();
            };

            alvoEl.addEventListener('mousedown', hitTarget);
            alvoEl.addEventListener('touchstart', hitTarget, {passive: false});

            arena.appendChild(alvoEl);
            contador++;
        };

        gerarAlvo();
    }

    finalizarMinigameFarm() {
        this.minigameAtivo = false;
        // Recompensa alta baseado na perfomance
        const ouroGanhado = this.minigameScore * 55;
        const xpGanhado = this.minigameScore * 40;

        this.state.gold = (this.state.gold || 0) + ouroGanhado;
        this.animacaoTextoFlutuante(`Farm Concluído: +${ouroGanhado} Ouro!`, "var(--lg-gold)");
        setTimeout(() => { document.getElementById('lg-modal-farm').style.display = 'none'; }, 1500);
        atualizarUI();
    }

    // ==========================================
    // REDE E EFEITOS VISUAIS
    // ==========================================
    enviarAcaoParaChat(forma, nomeMagia, efeito, hex) {
        if (!this.state.roomName) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: this.state.playerName,
            text: `<span style="color:${hex}; font-weight:bold;">[${forma}] ${nomeMagia}</span>: ${efeito}`,
            type: "combat",
            time: Date.now()
        });
    }

    criarEfeitoOnda(hex) {
        const layer = document.getElementById('lg-effect-layer');
        if (!layer) return;

        const wave = document.createElement('div');
        wave.style.position = 'absolute';
        wave.style.top = '50%';
        wave.style.left = '50%';
        wave.style.width = '100px';
        wave.style.height = '100px';
        wave.style.marginLeft = '-50px';
        wave.style.marginTop = '-50px';
        wave.style.borderRadius = '50%';
        wave.style.border = `solid ${hex}`;
        wave.style.boxShadow = `0 0 30px ${hex}, inset 0 0 30px ${hex}`;
        wave.style.animation = 'lg-shockwave 0.8s ease-out forwards';

        layer.appendChild(wave);
        setTimeout(() => wave.remove(), 850);
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.style.position = 'fixed';
        textAnim.style.top = '40%';
        textAnim.style.left = '50%';
        textAnim.style.transform = 'translate(-50%, -50%)';
        textAnim.style.color = cor;
        textAnim.style.fontSize = '1.5rem';
        textAnim.style.fontWeight = '900';
        textAnim.style.textShadow = '0 4px 10px rgba(0,0,0,1), 0 0 5px ' + cor;
        textAnim.style.zIndex = '10005';
        textAnim.style.pointerEvents = 'none';
        textAnim.style.textAlign = 'center';
        textAnim.innerText = texto;

        // Animação de subida e fadeout simples
        textAnim.animate([
            { opacity: 0, transform: 'translate(-50%, -30%)' },
            { opacity: 1, transform: 'translate(-50%, -50%)' },
            { opacity: 1, transform: 'translate(-50%, -60%)' },
            { opacity: 0, transform: 'translate(-50%, -80%)' }
        ], { duration: 2000, easing: 'ease-in-out' });

        document.body.appendChild(textAnim);
        setTimeout(() => textAnim.remove(), 2000);
    }
}
