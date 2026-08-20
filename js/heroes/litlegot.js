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

        // Sistema de Tintas (Escala com AP; recarga exclusiva na Base)
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25 },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20 },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15 },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30 },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25 },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35 },
            white: { nome: 'Luz Absoluta (Divino)', hex: '#ffffff', custo: 60 }
        };

        // Estado do Minigame de Farm Extremo
        this.minigameAtivo = false;
        this.minigameScore = 0;
        this.minigameTimer = null;
    }

    iniciar() {
        this.iniciarMonitoramentoMultiplayer();
        this.injetarCSSMobileEPopups();
        this.criarPopupsEModais();
        this.vincularCanvasEventos();
        this.atualizarTintaEstatistica();
        
        // Bloqueia regeneração automática por tempo
        this.state.stats.manaRegen = 0;
        this.state.stats.mana = this.state.stats.maxMana;
        atualizarUI();
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
                if (this.multiplayerAtivo) {
                    this.state.modoSimulado = false;
                }
            }
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
            this.animacaoTextoFlutuante("Aviso: Modo Solo - Base Restrita!", "#ffaa00");
        }
        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana;
        this.state.stats.hp = this.state.stats.maxHp;
        this.animacaoTextoFlutuante("Tinta e HP Totalmente Restaurados na Base!", "#00ffcc");
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
            .lg-fab-container {
                position: fixed; bottom: 20px; right: 20px; z-index: 9999;
                display: flex; flex-direction: column; gap: 10px;
            }
            .lg-fab {
                width: 56px; height: 56px; border-radius: 50%; border: 2px solid #c5a059;
                background: linear-gradient(135deg, #121225, #1a1a3a); color: #fff; font-size: 1.4rem; 
                display: flex; align-items: center; justify-content: center; box-shadow: 0 6px 15px rgba(0,0,0,0.6);
                touch-action: manipulation; transition: transform 0.1s ease;
            }
            .lg-fab:active { transform: scale(0.92); }
            .lg-popup {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(5, 5, 12, 0.9); backdrop-filter: blur(8px); z-index: 10000;
                display: none; align-items: center; justify-content: center; padding: 12px;
                box-sizing: border-box;
            }
            .lg-popup-card {
                background: #111122; border: 2px solid #c5a059; border-radius: 14px;
                width: 100%; max-width: 440px; padding: 18px; color: #fff;
                box-shadow: 0 0 30px rgba(197, 160, 89, 0.25); display: flex;
                flex-direction: column; gap: 12px; max-height: 92vh; overflow-y: auto;
            }
            .lg-canvas-box {
                width: 100%; height: 280px; background: #070710; border: 2px dashed #333;
                border-radius: 10px; touch-action: none; position: relative; overflow: hidden;
            }
            .lg-palette {
                display: flex; justify-content: space-between; gap: 6px; overflow-x: auto; padding: 6px 0;
            }
            .lg-color-dot {
                width: 36px; height: 36px; border-radius: 50%; border: 2px solid #444; flex-shrink: 0;
                cursor: pointer; transition: transform 0.2s;
            }
            .lg-color-dot.active { border-color: #fff; transform: scale(1.2); box-shadow: 0 0 10px #fff; }
            .lg-grid-folhas {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;
            }
            .lg-folha-card {
                border: 1px solid #c5a059; background: #0b0b18; border-radius: 8px;
                padding: 10px; text-align: center; font-size: 0.8rem; cursor: pointer;
            }
            @keyframes shockwave {
                0% { transform: scale(0.1); opacity: 1; }
                100% { transform: scale(3.0); opacity: 0; }
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
            <button class="lg-fab" id="lg-btn-farm" title="Minigame de Farm Rítmico">🌾</button>
            <button class="lg-fab" id="lg-btn-loja" title="Forja de Itens de Loja">⚒️</button>
            <button class="lg-fab" id="lg-btn-base" title="Retornar à Base">🏛️</button>
        `;
        document.body.appendChild(fabContainer);

        // Modal 1: Canvas
        const popupCanvas = document.createElement('div');
        popupCanvas.id = 'lg-modal-canvas';
        popupCanvas.className = 'lg-popup';
        popupCanvas.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.2rem;">🎨 Ateliê de Pintura Tática</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:0.85rem; color:#bbb;">Desenhe uma forma fluida: <b>O</b> (Círculo), <b>X</b> (Cruz) ou <b>Z</b> (Zigue-zague).</div>
                
                <div class="lg-palette" id="lg-palette-select"></div>

                <div class="lg-canvas-box">
                    <canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas>
                </div>

                <div style="display:flex; gap:10px;">
                    <button id="lg-btn-limpar" style="flex:1; background:#2a2a3e; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:bold;">Limpar</button>
                    <button id="lg-btn-guardar" style="flex:2; background:#c5a059; color:#000; font-weight:bold; border:none; padding:10px; border-radius:6px;">Guardar Folha</button>
                </div>
            </div>
        `;
        document.body.appendChild(popupCanvas);

        // Modal 2: Mochila
        const popupMochila = document.createElement('div');
        popupMochila.id = 'lg-modal-mochila';
        popupMochila.className = 'lg-popup';
        popupMochila.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.2rem;">📜 Mochila de Folhas</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:0.85rem; color:#bbb;">Selecione o Alvo tático e ative sua arte guardada:</div>
                
                <select id="lg-alvo-select" style="background:#0b0b18; color:#fff; padding:10px; border:1px solid #c5a059; border-radius:6px; font-weight:bold;">
                    <option value="Inimigo da Rota">Inimigo da Rota (Campeão)</option>
                    <option value="Minion Inimigo">Minions Inimigos</option>
                    <option value="Torre Inimiga">Torre Inimiga</option>
                    <option value="Si Mesmo">Si Mesmo</option>
                    <option value="Aliado Próximo">Aliado Próximo</option>
                </select>

                <div class="lg-grid-folhas" id="lg-folhas-container"></div>
            </div>
        `;
        document.body.appendChild(popupMochila);

        // Modal 3: Minigame Farm
        const popupFarm = document.createElement('div');
        popupFarm.id = 'lg-modal-farm';
        popupFarm.className = 'lg-popup';
        popupFarm.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.2rem;">🌾 Rito de Farm de Alta Intensidade</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:0.85rem; color:#bbb;">Toque rapidamente nas runas que aparecem antes que sumam!</div>
                
                <div style="position:relative; width:100%; height:260px; background:#04040a; border:1px solid #444; border-radius:8px; overflow:hidden;" id="lg-farm-arena">
                    <div id="lg-farm-status" style="position:absolute; top:8px; left:8px; color:#fff; font-size:0.85rem; font-weight:bold;">Pontos: 0</div>
                </div>

                <button id="lg-start-farm" style="background:#28a745; color:#fff; border:none; padding:12px; border-radius:6px; font-weight:bold; font-size:1rem;">Iniciar Desafio</button>
            </div>
        `;
        document.body.appendChild(popupFarm);

        // Modal 4: Loja de Itens Reais
        const popupLoja = document.createElement('div');
        popupLoja.id = 'lg-modal-loja';
        popupLoja.className = 'lg-popup';
        popupLoja.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.2rem;">⚒️ Forja de Itens de Loja</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.4rem; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:0.85rem; color:#ff8c00; font-weight:bold;">Custo: Sacrifício de 25% de HP Máximo de Litlegot para materializar itens da loja física fora da base.</div>
                
                <div style="display:flex; flex-direction:column; gap:10px;">
                    <button class="lg-craft-item" data-item="espada" style="background:#1a1a2e; color:#fff; border:1px solid #c5a059; padding:12px; border-radius:6px; text-align:left; cursor:pointer;">
                        ⚔️ **Espada Longa (+35 AD)**: Forja física de combate direto.
                    </button>
                    <button class="lg-craft-item" data-item="tomo" style="background:#1a1a2e; color:#fff; border:1px solid #c5a059; padding:12px; border-radius:6px; text-align:left; cursor:pointer;">
                        📘 **Tomo Amplificador (+50 AP)**: Condensa energia mágica pura.
                    </button>
                    <button class="lg-craft-item" data-item="cristal" style="background:#1a1a2e; color:#fff; border:1px solid #c5a059; padding:12px; border-radius:6px; text-align:left; cursor:pointer;">
                        💎 **Cristal de Rubi (+300 HP)**: Materializa estilhaços de vitalidade.
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(popupLoja);

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

        document.getElementById('lg-btn-ateliere').onclick = () => { togglePopup('lg-modal-canvas', true); this.redimensionarCanvas(); };
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarUIFolhas(); togglePopup('lg-modal-mochila', true); };
        document.getElementById('lg-btn-farm').onclick = () => togglePopup('lg-modal-farm', true);
        document.getElementById('lg-btn-loja').onclick = () => togglePopup('lg-modal-loja', true);
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();

        document.querySelectorAll('.lg-close-btn').forEach(btn => {
            btn.onclick = (e) => e.target.closest('.lg-popup').style.display = 'none';
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
    // RECONHECIMENTO DE DESENHO (O, X, Z)
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
            this.desenhandoCanvas = true;
            this.pontosDesenho = [];
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.strokeStyle = this.tintas[this.corAtiva].hex;
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
        };

        const draw = (e) => {
            if (!this.desenhandoCanvas) return;
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
        canvas.addEventListener('touchstart', startDraw, { passive: true });
        canvas.addEventListener('touchmove', draw, { passive: true });
        canvas.addEventListener('touchend', stopDraw);
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

        if (distStartEnd < 50 && width > 35 && height > 35) return 'O';

        let mudancasX = 0;
        for (let i = 2; i < pts.length - 2; i++) {
            const dirPrev = pts[i].x - pts[i - 2].x;
            const dirNext = pts[i + 2].x - pts[i].x;
            if ((dirPrev > 0 && dirNext < 0) || (dirPrev < 0 && dirNext > 0)) {
                mudancasX++;
            }
        }

        if (mudancasX >= 2) return 'Z';
        return 'X';
    }

    guardarDesenho() {
        if (this.folhasGuardadas.length >= this.maxFolhas) {
            return this.animacaoTextoFlutuante("Mochila Cheia! (Máx 3)", "#ff0000");
        }

        const forma = this.reconhecerForma();
        if (!forma) {
            return this.animacaoTextoFlutuante("Traço inválido ou incompleto!", "#ff8c00");
        }

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) {
            return this.animacaoTextoFlutuante(`Tinta insuficiente! Necessário: ${corData.custo}`, "#ff0000");
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
        this.animacaoTextoFlutuante(`Arte [${forma} - ${corData.nome}] Guardada!`, corData.hex);
        document.getElementById('lg-modal-canvas').style.display = 'none';
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<div style="grid-column:1/span 3; color:#777; font-size:0.85rem; text-align:center; padding:20px;">Nenhuma arte guardada na mochila.</div>';
            return;
        }

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = folha.corHex;
            card.innerHTML = `
                <div style="font-size:1.6rem; font-weight:bold; color:${folha.corHex}">${folha.forma}</div>
                <div style="font-size:0.7rem; color:#aaa; margin-top:2px;">${folha.nomeCor}</div>
                <button style="margin-top:8px; background:${folha.corHex}; color:#000; border:none; border-radius:4px; font-weight:bold; width:100%; padding:4px; cursor:pointer;">Ativar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(index);
            container.appendChild(card);
        });
    }

    // ==========================================
    // 21 EFEITOS REAIS EM CAMPO
    // ==========================================
    ativarFolha(index) {
        const folha = this.folhasGuardadas[index];
        if (!folha) return;

        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').style.display = 'none';

        this.executarEfeitoReal(folha.forma, folha.corKey, folha.apSnapshot);
    }

    executarEfeitoReal(forma, corKey, apSnap) {
        const ap = apSnap || this.state.stats.ap || 0;
        const alvo = this.alvoSelecionado;
        const hex = this.tintas[corKey].hex;
        let nomeEfeito = "";
        let resumoAcao = "";

        // Tabela completa de 21 Efeitos Reais
        switch (corKey) {
            case 'red':
                if (forma === 'O') {
                    nomeEfeito = "Inferno Circular";
                    const dano = Math.floor(ap * 2.2);
                    this.aplicarDanoAlvo(alvo, dano);
                    resumoAcao = `criou uma fogueira explosiva causando ${dano} de Dano de Fogo em ${alvo}!`;
                } else if (forma === 'X') {
                    nomeEfeito = "Corte Flamejante";
                    const dano = Math.floor(ap * 1.8);
                    this.aplicarDanoAlvo(alvo, dano);
                    this.state.enemyBurn = true; // Efeito real de queimadura contínua
                    resumoAcao = `executou um corte em X carbonizando ${alvo} por ${dano} de dano!`;
                } else { // Z
                    nomeEfeito = "Labareda Ziguezague";
                    const dano = Math.floor(ap * 3.5);
                    this.aplicarDanoAlvo(alvo, dano);
                    resumoAcao = `disparou labaredas em zigue-zague perfurando as defesas de ${alvo} com ${dano} de dano!`;
                }
                break;

            case 'orange':
                if (forma === 'O') {
                    nomeEfeito = "Vampirismo de Aura";
                    const cura = Math.floor(ap * 1.5);
                    this.curar(cura);
                    resumoAcao = `absorveu energias vitais ao redor recuperando +${cura} de HP!`;
                } else if (forma === 'X') {
                    nomeEfeito = "Drenagem Direta";
                    const roubo = Math.floor(ap * 2.0);
                    this.curar(roubo);
                    this.aplicarDanoAlvo(alvo, roubo);
                    resumoAcao = `roubou diretamente ${roubo} de HP de ${alvo} para si!`;
                } else { // Z
                    nomeEfeito = "Pulso Hemático";
                    this.state.stats.lifesteal = (this.state.stats.lifesteal || 0) + 0.25;
                    setTimeout(() => this.state.stats.lifesteal -= 0.25, 8000);
                    resumoAcao = `ativou pulso hemático, concedendo +25% de Roubo de Vida por 8s!`;
                }
                break;

            case 'yellow':
                if (forma === 'O') {
                    nomeEfeito = "Clarão Dourado";
                    const ouro = Math.floor(40 + (ap * 0.4));
                    this.state.gold = (this.state.gold || 0) + ouro;
                    resumoAcao = `coletou ${ouro} de Ouro extra das reservas do campo!`;
                } else if (forma === 'X') {
                    nomeEfeito = "Chuva de Ouro Ativa";
                    this.state.stats.attackSpeed = (this.state.stats.attackSpeed || 1.0) + 0.35;
                    setTimeout(() => this.state.stats.attackSpeed -= 0.35, 6000);
                    resumoAcao = `acelerou seus ataques em +35% com a energia de ouro reluzente!`;
                } else { // Z
                    nomeEfeito = "Relâmpago Áureo";
                    this.state.stats.ms = (this.state.stats.ms || 300) + 60;
                    setTimeout(() => this.state.stats.ms -= 60, 5000);
                    resumoAcao = `concedeu +60 de Velocidade de Movimento explosiva!`;
                }
                break;

            case 'green':
                if (forma === 'O') {
                    nomeEfeito = "Raiz Viva Protetora";
                    const cura = Math.floor(ap * 2.5);
                    this.curar(cura);
                    this.state.stats.armor = (this.state.stats.armor || 20) + 15;
                    setTimeout(() => this.state.stats.armor -= 15, 10000);
                    resumoAcao = `brotou raízes naturais curando +${cura} HP e concedendo +15 de Armadura!`;
                } else if (forma === 'X') {
                    nomeEfeito = "Espinhos Selvagens";
                    this.aplicarDanoAlvo(alvo, Math.floor(ap * 1.5));
                    this.state.enemyRooted = true; // Efeito real de enraizamento
                    setTimeout(() => this.state.enemyRooted = false, 3000);
                    resumoAcao = `enraizou ${alvo} ao solo por 3 segundos com espinhos pontiagudos!`;
                } else { // Z
                    nomeEfeito = "Vinha Cortante";
                    this.state.stats.maxHp += 50;
                    this.curar(50);
                    resumoAcao = `expandiu sua vitalidade de forma permanente, ganhando +50 de HP Máximo!`;
                }
                break;

            case 'blue':
                if (forma === 'O') {
                    nomeEfeito = "Cúpula Aquática";
                    const escudo = Math.floor(120 + (ap * 1.8));
                    this.state.stats.shield = (this.state.stats.shield || 0) + escudo;
                    resumoAcao = `gerou uma Cúpula Aquática fornecendo +${escudo} de Escudo protetor!`;
                } else if (forma === 'X') {
                    nomeEfeito = "Lança Gélida";
                    const dano = Math.floor(ap * 2.0);
                    this.aplicarDanoAlvo(alvo, dano);
                    resumoAcao = `congelou ${alvo} com uma estaca de água pesada, causando ${dano} de dano!`;
                } else { // Z
                    nomeEfeito = "Correnteza Veloz";
                    this.state.stats.cooldownReduction = (this.state.stats.cooldownReduction || 0) + 0.2;
                    setTimeout(() => this.state.stats.cooldownReduction -= 0.2, 10000);
                    resumoAcao = `fluigiu a mente com correntezas, reduzindo tempos de recarga em 20%!`;
                }
                break;

            case 'purple':
                if (forma === 'O') {
                    nomeEfeito = "Esfera Umbral";
                    this.state.enemyBlinded = true;
                    setTimeout(() => this.state.enemyBlinded = false, 4000);
                    resumoAcao = `cegou ${alvo} com uma nuvem de fumaça umbral por 4 segundos!`;
                } else if (forma === 'X') {
                    nomeEfeito = "Ruptura Sombria";
                    const dano = Math.floor(ap * 2.8);
                    this.aplicarDanoAlvo(alvo, dano);
                    resumoAcao = `rasgou as trevas ao redor de ${alvo}, causando ${dano} de dano mágico!`;
                } else { // Z
                    nomeEfeito = "Fio de Sombra Controlador";
                    this.state.enemySilenced = true;
                    setTimeout(() => this.state.enemySilenced = false, 5000);
                    resumoAcao = `silenciou as habilidades de ${alvo} por 5 segundos inteiros!`;
                }
                break;

            case 'white':
                if (forma === 'O') {
                    nomeEfeito = "Halo Divino";
                    this.curar(this.state.stats.maxHp);
                    resumoAcao = `invocou um Halo Divino restaurando 100% da vida atual!`;
                } else if (forma === 'X') {
                    nomeEfeito = "Julgamento Sagrado";
                    const danoVerdadeiro = Math.floor(ap * 4.5);
                    this.aplicarDanoAlvo(alvo, danoVerdadeiro);
                    resumoAcao = `fulminou ${alvo} com o Julgamento Sagrado de ${danoVerdadeiro} Dano Verdadeiro!`;
                } else { // Z
                    nomeEfeito = "Feixe Pristino";
                    this.state.stats.ap += 40;
                    setTimeout(() => this.state.stats.ap -= 40, 15000);
                    resumoAcao = `absorveu luz pristina, aumentando seu AP em +40 por 15 segundos!`;
                }
                break;
        }

        atualizarUI();
        this.criarEfeitoOnda(hex);
        this.enviarAcaoParaChat(forma, nomeEfeito, resumoAcao, hex);
    }

    aplicarDanoAlvo(alvo, dano) {
        if (alvo === 'Inimigo da Rota') {
            this.state.enemyHp = Math.max(0, (this.state.enemyHp || 1000) - dano);
        } else if (alvo === 'Torre Inimiga') {
            this.state.enemyTowerHp = Math.max(0, (this.state.enemyTowerHp || 2500) - dano);
        }
    }

    curar(valor) {
        this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor);
    }

    // ==========================================
    // FORJA DE ITENS DE LOJA REAIS
    // ==========================================
    criarItemDaLoja(tipoItem) {
        const custoHpSacrificio = Math.floor(this.state.stats.maxHp * 0.25);
        
        if (this.state.stats.hp <= custoHpSacrificio) {
            return this.animacaoTextoFlutuante("Falha: Vida insuficiente para o sacrifício da forja!", "#ff0000");
        }

        this.state.stats.hp -= custoHpSacrificio;

        if (tipoItem === 'espada') {
            this.state.stats.ad = (this.state.stats.ad || 0) + 35;
            this.animacaoTextoFlutuante("Espada Longa Forjada em Campo! (+35 AD)", "#ff8c00");
        } else if (tipoItem === 'tomo') {
            this.state.stats.ap = (this.state.stats.ap || 0) + 50;
            this.atualizarTintaEstatistica();
            this.animacaoTextoFlutuante("Tomo Amplificador Materializado! (+50 AP)", "#8a2be2");
        } else if (tipoItem === 'cristal') {
            this.state.stats.maxHp += 300;
            this.state.stats.hp += 300;
            this.animacaoTextoFlutuante("Cristal de Rubi Adicionado! (+300 HP)", "#ff3333");
        }

        document.getElementById('lg-modal-loja').style.display = 'none';
        atualizarUI();
    }

    // ==========================================
    // MINIGAME DE FARM DE ALTA INTENSIDADE
    // ==========================================
    iniciarMinigameFarm() {
        const arena = document.getElementById('lg-farm-arena');
        const status = document.getElementById('lg-farm-status');
        if (!arena) return;

        this.minigameScore = 0;
        this.minigameAtivo = true;
        status.innerText = "Pontos: 0 | Desafio Iniciado!";

        let contador = 0;
        const maxAlvos = 12;

        const gerarAlvo = () => {
            if (contador >= maxAlvos || !this.minigameAtivo) {
                this.finalizarMinigameFarm();
                return;
            }

            const alvoEl = document.createElement('div');
            alvoEl.style.position = 'absolute';
            alvoEl.style.width = '42px';
            alvoEl.style.height = '42px';
            alvoEl.style.borderRadius = '50%';
            alvoEl.style.background = '#c5a059';
            alvoEl.style.border = '2px solid #fff';
            alvoEl.style.left = `${Math.random() * (arena.clientWidth - 50)}px`;
            alvoEl.style.top = `${Math.random() * (arena.clientHeight - 50)}px`;
            alvoEl.style.cursor = 'pointer';
            alvoEl.style.boxShadow = '0 0 12px #c5a059';

            const timeoutTarget = setTimeout(() => {
                if (alvoEl.parentNode) {
                    alvoEl.remove();
                    gerarAlvo();
                }
            }, 750); // Janela de clique agressiva para exigir reflexos

            alvoEl.onclick = () => {
                clearTimeout(timeoutTarget);
                this.minigameScore += 1;
                status.innerText = `Pontos: ${this.minigameScore}`;
                alvoEl.remove();
                gerarAlvo();
            };

            arena.appendChild(alvoEl);
            contador++;
        };

        gerarAlvo();
    }

    finalizarMinigameFarm() {
        this.minigameAtivo = false;
        const ouroGanhado = this.minigameScore * 50;
        const xpGanhado = this.minigameScore * 35;

        this.state.gold = (this.state.gold || 0) + ouroGanhado;
        this.animacaoTextoFlutuante(`Farm Concluído! +${ouroGanhado} 🪙 | +${xpGanhado} XP`, "#ffff00");
        document.getElementById('lg-modal-farm').style.display = 'none';
        atualizarUI();
    }

    // ==========================================
    // REDE E ANIMAÇÕES
    // ==========================================
    enviarAcaoParaChat(forma, nomeEfeito, resumo, hex) {
        if (!this.state.roomName || !this.multiplayerAtivo) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: this.state.playerName,
            text: `<span style="color:${hex}; font-weight:bold;">[${forma} - ${nomeEfeito}]</span> Litlegot ${resumo}`,
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
        wave.style.width = '240px';
        wave.style.height = '240px';
        wave.style.marginLeft = '-120px';
        wave.style.marginTop = '-120px';
        wave.style.borderRadius = '50%';
        wave.style.border = `4px solid ${hex}`;
        wave.style.boxShadow = `0 0 25px ${hex}`;
        wave.style.animation = 'shockwave 0.5s ease-out forwards';

        layer.appendChild(wave);
        setTimeout(() => wave.remove(), 500);
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.style.position = 'fixed';
        textAnim.style.top = '38%';
        textAnim.style.left = '50%';
        textAnim.style.transform = 'translate(-50%, -50%)';
        textAnim.style.color = cor;
        textAnim.style.fontSize = '1.3rem';
        textAnim.style.fontWeight = 'bold';
        textAnim.style.textShadow = '0 0 10px #000';
        textAnim.style.zIndex = '10001';
        textAnim.style.pointerEvents = 'none';
        textAnim.innerText = texto;

        document.body.appendChild(textAnim);
        setTimeout(() => textAnim.remove(), 1300);
    }
}
