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
        this.strokes = [];

        // Sistema de Tintas (Não usa Mana; escala com AP; recarrega APENAS na Base)
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', custo: 25 },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', custo: 20 },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', custo: 15 },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', custo: 30 },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', custo: 25 },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', custo: 35 },
            white: { nome: 'Luz Absoluta (Divino)', hex: '#ffffff', custo: 60 }
        };

        // Estado do Minigame de Farm
        this.minigameAtivo = false;
        this.minigameAlvos = [];
        this.minigameScore = 0;
        this.minigameTimer = null;
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
        this.state.stats.maxMana = Math.floor(100 + (apAtual * 3.0));
        if (this.state.stats.mana > this.state.stats.maxMana) {
            this.state.stats.mana = this.state.stats.maxMana;
        }
        atualizarUI();
    }

    retornarABase() {
        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana;
        this.animacaoTextoFlutuante("Tinta Totalmente Recarregada na Base!", "#00ffcc");
        atualizarUI();
    }

    // ==========================================
    // UI COMPACTA MOBILE & MODAIS EM POPUPS
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v2')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v2';
        style.innerHTML = `
            .lg-fab-container {
                position: fixed; bottom: 15px; right: 15px; z-index: 9999;
                display: flex; flex-direction: column; gap: 8px;
            }
            .lg-fab {
                width: 52px; height: 52px; border-radius: 50%; border: 2px solid #c5a059;
                background: #121225; color: #fff; font-size: 1.2rem; display: flex;
                align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                touch-action: manipulation;
            }
            .lg-popup {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0,0,0,0.85); backdrop-filter: blur(5px); z-index: 10000;
                display: none; align-items: center; justify-content: center; padding: 10px;
                box-sizing: border-box;
            }
            .lg-popup-card {
                background: #1a1a2e; border: 2px solid #c5a059; border-radius: 12px;
                width: 100%; max-width: 420px; padding: 15px; color: #fff;
                box-shadow: 0 0 20px rgba(197, 160, 89, 0.3); display: flex;
                flex-direction: column; gap: 10px; max-height: 90vh; overflow-y: auto;
            }
            .lg-canvas-box {
                width: 100%; height: 260px; background: #0b0b14; border: 2px dashed #444;
                border-radius: 8px; touch-action: none; position: relative;
            }
            .lg-palette {
                display: flex; justify-content: space-between; gap: 4px; overflow-x: auto; padding: 4px 0;
            }
            .lg-color-dot {
                width: 32px; height: 32px; border-radius: 50%; border: 2px solid #555; flex-shrink: 0;
            }
            .lg-color-dot.active { border-color: #fff; transform: scale(1.15); }
            .lg-grid-folhas {
                display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
            }
            .lg-folha-card {
                border: 1px solid #c5a059; background: #0f0f1d; border-radius: 6px;
                padding: 8px; text-align: center; font-size: 0.8rem; cursor: pointer;
            }
            @keyframes shockwave {
                0% { transform: scale(0.2); opacity: 1; }
                100% { transform: scale(2.5); opacity: 0; }
            }
            .lg-effect-layer {
                position: fixed; top:0; left:0; width:100vw; height:100vh;
                pointer-events:none; z-index:9998;
            }
        `;
        document.head.appendChild(style);
    }

    criarPopupsEModais() {
        // Overlay de Efeitos Visuais
        if (!document.getElementById('lg-effect-layer')) {
            const layer = document.createElement('div');
            layer.id = 'lg-effect-layer';
            layer.className = 'lg-effect-layer';
            document.body.appendChild(layer);
        }

        // Botoes Flutuantes (FAB) para Acesso Rapido Mobile
        const fabContainer = document.createElement('div');
        fabContainer.className = 'lg-fab-container';
        fabContainer.innerHTML = `
            <button class="lg-fab" id="lg-btn-ateliere" title="Ateliê de Pintura">🎨</button>
            <button class="lg-fab" id="lg-btn-mochila" title="Mochila de Desenhos">📜</button>
            <button class="lg-fab" id="lg-btn-farm" title="Minigame de Farm">🌾</button>
            <button class="lg-fab" id="lg-btn-loja" title="Criar Item em Campo">⚒️</button>
            <button class="lg-fab" id="lg-btn-base" title="Retornar à Base">🏛️</button>
        `;
        document.body.appendChild(fabContainer);

        // Modal 1: Atelier / Canvas de Desenho
        const popupCanvas = document.createElement('div');
        popupCanvas.id = 'lg-modal-canvas';
        popupCanvas.className = 'lg-popup';
        popupCanvas.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.1rem;">🎨 Ateliê do Cavalete</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.2rem;">✕</button>
                </div>
                <div style="font-size:0.8rem; color:#aaa;">Desenhe as formas <b>O</b>, <b>X</b> ou <b>Z</b> na tela em um único traço fluido.</div>
                
                <div class="lg-palette" id="lg-palette-select"></div>

                <div class="lg-canvas-box">
                    <canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas>
                </div>

                <div style="display:flex; gap:8px;">
                    <button id="lg-btn-limpar" style="flex:1; background:#333; color:#fff; border:none; padding:8px; border-radius:4px;">Limpar</button>
                    <button id="lg-btn-guardar" style="flex:2; background:#c5a059; color:#000; font-weight:bold; border:none; padding:8px; border-radius:4px;">Guardar Folha</button>
                </div>
            </div>
        `;
        document.body.appendChild(popupCanvas);

        // Modal 2: Mochila de Desenhos Guardados
        const popupMochila = document.createElement('div');
        popupMochila.id = 'lg-modal-mochila';
        popupMochila.className = 'lg-popup';
        popupMochila.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.1rem;">📜 Folhas Guardadas</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.2rem;">✕</button>
                </div>
                <div style="font-size:0.8rem; color:#aaa;">Selecione o Alvo e toque no desenho para ativá-lo no campo:</div>
                
                <select id="lg-alvo-select" style="background:#0f0f1d; color:#fff; padding:8px; border:1px solid #c5a059; border-radius:4px;">
                    <option value="Inimigo da Rota">Inimigo (Herói)</option>
                    <option value="Minion Inimigo">Minion Inimigo</option>
                    <option value="Torre Inimiga">Torre Inimiga</option>
                    <option value="Si Mesmo">Si Mesmo</option>
                    <option value="Aliado">Aliado</option>
                </select>

                <div class="lg-grid-folhas" id="lg-folhas-container"></div>
            </div>
        `;
        document.body.appendChild(popupMochila);

        // Modal 3: Rito de Farm (Minigame Rítmico)
        const popupFarm = document.createElement('div');
        popupFarm.id = 'lg-modal-farm';
        popupFarm.className = 'lg-popup';
        popupFarm.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.1rem;">🌾 Rito de Farm Rítmico</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.2rem;">✕</button>
                </div>
                <div style="font-size:0.8rem; color:#aaa;">Toque nas Runas na ordem exata antes do tempo esgotar para farmar Ouro e XP!</div>
                
                <div style="position:relative; width:100%; height:250px; background:#080811; border:1px solid #333; border-radius:6px; overflow:hidden;" id="lg-farm-arena">
                    <div id="lg-farm-status" style="position:absolute; top:5px; left:5px; color:#fff; font-size:0.8rem;">Pontos: 0</div>
                </div>

                <button id="lg-start-farm" style="background:#28a745; color:#fff; border:none; padding:10px; border-radius:4px; font-weight:bold;">Iniciar Rito</button>
            </div>
        `;
        document.body.appendChild(popupFarm);

        // Modal 4: Criação de Itens Fora da Base
        const popupLoja = document.createElement('div');
        popupLoja.id = 'lg-modal-loja';
        popupLoja.className = 'lg-popup';
        popupLoja.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.1rem;">⚒️ Forja Divina Fora da Base</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.2rem;">✕</button>
                </div>
                <div style="font-size:0.8rem; color:#ff8c00;">Custo: **20% HP de Litlegot** + **15% HP do Aliado**. Falha se a vida estiver abaixo de 25%.</div>
                
                <div style="display:flex; flex-direction:column; gap:8px;">
                    <button class="lg-craft-item" data-item="elixir" style="background:#222; color:#fff; border:1px solid #444; padding:8px; border-radius:4px; text-align:left;">
                        🧪 **Elixir Efêmero**: +40 AP e +30 AD temporários por 30s.
                    </button>
                    <button class="lg-craft-item" data-item="escudo" style="background:#222; color:#fff; border:1px solid #444; padding:8px; border-radius:4px; text-align:left;">
                        🛡️ **Aegis de Tinta**: Escudo de 250 HP imediato para o aliado.
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

        document.getElementById('lg-btn-ateliere').onclick = () => { togglePopup('lg-modal-canvas', true); this.redimensionarCanvas(); };
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarUIFolhas(); togglePopup('lg-modal-mochila', true); };
        document.getElementById('lg-btn-farm').onclick = () => togglePopup('lg-modal-farm', true);
        document.getElementById('lg-btn-loja').onclick = () => togglePopup('lg-modal-loja', true);
        document.getElementById('lg-btn-base').onclick = () => this.retornarABase();

        document.querySelectorAll('.lg-close-btn').forEach(btn => {
            btn.onclick = (e) => {
                e.target.closest('.lg-popup').style.display = 'none';
            };
        });

        document.getElementById('lg-btn-limpar').onclick = () => this.limparCanvas();
        document.getElementById('lg-btn-guardar').onclick = () => this.guardarDesenho();
        document.getElementById('lg-start-farm').onclick = () => this.iniciarMinigameFarm();

        document.querySelectorAll('.lg-craft-item').forEach(btn => {
            btn.onclick = (e) => this.criarItemForaDaBase(e.currentTarget.dataset.item);
        });

        const selectAlvo = document.getElementById('lg-alvo-select');
        if (selectAlvo) {
            selectAlvo.onchange = (e) => { this.alvoSelecionado = e.target.value; };
        }
    }

    // ==========================================
    // RECONHECIMENTO DE DESENHO NO CANVAS (O, X, Z)
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
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
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
        if (pts.length < 8) return null;

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

        // Reconhece 'O' (Loop Fechado)
        if (distStartEnd < 40 && width > 30 && height > 30) {
            return 'O';
        }

        // Analisa direções transversais para reconhecer 'Z' e 'X'
        let MudancasDirecaoX = 0;
        for (let i = 2; i < pts.length - 2; i++) {
            const dirPrev = pts[i].x - pts[i - 2].x;
            const dirNext = pts[i + 2].x - pts[i].x;
            if ((dirPrev > 0 && dirNext < 0) || (dirPrev < 0 && dirNext > 0)) {
                MudancasDirecaoX++;
            }
        }

        if (MudancasDirecaoX >= 2) return 'Z';
        if (height > width * 1.2 || width > height * 1.2) return 'X';

        return 'X'; // Fallback padrão
    }

    guardarDesenho() {
        if (this.folhasGuardadas.length >= this.maxFolhas) {
            return this.animacaoTextoFlutuante("Mochila Cheia! (Máx 3 folhas)", "#ff0000");
        }

        const forma = this.reconhecerForma();
        if (!forma) {
            return this.animacaoTextoFlutuante("Desenho Riscado/Incompleto!", "#ff8c00");
        }

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) {
            return this.animacaoTextoFlutuante(`Sem tinta! Custo: ${corData.custo}`, "#ff0000");
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
        this.animacaoTextoFlutuante(`Folha [${forma}] Guardada!`, corData.hex);
        document.getElementById('lg-modal-canvas').style.display = 'none';
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<div style="grid-column:1/span 3; color:#777; font-size:0.8rem;">Nenhum desenho guardado.</div>';
            return;
        }

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = folha.corHex;
            card.innerHTML = `
                <div style="font-size:1.5rem; font-weight:bold; color:${folha.corHex}">${folha.forma}</div>
                <div style="font-size:0.65rem; color:#aaa;">${folha.nomeCor}</div>
                <button style="margin-top:5px; background:${folha.corHex}; color:#000; border:none; border-radius:3px; font-weight:bold; width:100%;">Usar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(index);
            container.appendChild(card);
        });
    }

    // ==========================================
    // EXECUÇÃO REAL DE HABILIDADES NO CAMPO
    // ==========================================
    ativarFolha(index) {
        const folha = this.folhasGuardadas[index];
        if (!folha) return;

        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').style.display = 'none';

        this.executarEfeitoEmCampo(folha.forma, folha.corKey, folha.apSnapshot);
    }

    executarEfeitoEmCampo(forma, corKey, apSnap) {
        const ap = apSnap || this.state.stats.ap || 0;
        const alvo = this.alvoSelecionado;
        const hex = this.tintas[corKey].hex;
        let resumoEfeito = "";

        // Aplicação Real no Estado de Jogo
        if (corKey === 'red') {
            const dano = forma === 'X' ? Math.floor(ap * 1.8) : (forma === 'O' ? Math.floor(ap * 2.5) : Math.floor(ap * 4.2));
            if (alvo === 'Inimigo da Rota') this.state.enemyHp = Math.max(0, (this.state.enemyHp || 1000) - dano);
            resumoEfeito = `desferiu arte incandescente [${forma}] causando **${dano} de Dano Real** em [${alvo}]!`;
            this.criarEfeitoOnda(hex);
        } 
        else if (corKey === 'orange') {
            const cura = Math.floor(ap * 1.2);
            this.curar(cura);
            if (forma === 'Z') this.state.stats.mana = Math.min(this.state.stats.maxMana, this.state.stats.mana + 40);
            resumoEfeito = `drenou pigmentos vitais de [${alvo}], curando **+${cura} HP**!`;
            this.criarEfeitoOnda(hex);
        }
        else if (corKey === 'yellow') {
            const ouro = Math.floor(35 + (ap * 0.3));
            this.state.gold = (this.state.gold || 0) + ouro;
            this.state.stats.ms = (this.state.stats.ms || 300) + 40;
            setTimeout(() => this.state.stats.ms -= 40, 5000);
            resumoEfeito = `iluminou o campo com [${forma}], recebendo **+${ouro} 🪙** e velocidade!`;
            this.criarEfeitoOnda(hex);
        }
        else if (corKey === 'green') {
            const curaVida = Math.floor(ap * 2.0);
            this.curar(curaVida);
            this.state.stats.maxHp += 30;
            resumoEfeito = `esculpiu a Natureza viva em [${alvo}], garantindo **+${curaVida} HP** e +30 Max HP permanentemente!`;
            this.criarEfeitoOnda(hex);
        }
        else if (corKey === 'blue') {
            const escudo = Math.floor(100 + (ap * 1.5));
            this.state.stats.shield = (this.state.stats.shield || 0) + escudo;
            resumoEfeito = `pintou Barreira Fluida [${forma}] concedendo **+${escudo} de Escudo Proteção**!`;
            this.criarEfeitoOnda(hex);
        }
        else if (corKey === 'purple') {
            this.state.enemySilenced = true;
            setTimeout(() => this.state.enemySilenced = false, 4000);
            resumoEfeito = `traçou Sombras de Controle em [${alvo}], **Silenciando e Paralisando** por 4 segundos!`;
            this.criarEfeitoOnda(hex);
        }
        else if (corKey === 'white') {
            const danoDivino = Math.floor(ap * 5.0);
            if (alvo === 'Inimigo da Rota') this.state.enemyHp = Math.max(0, (this.state.enemyHp || 1000) - danoDivino);
            resumoEfeito = `invocou a Luz Absoluta Divina, obliterando [${alvo}] com **${danoDivino} Dano Verdadeiro**!`;
            this.criarEfeitoOnda(hex);
        }

        atualizarUI();
        this.enviarAcaoParaChat(forma, this.tintas[corKey].nome, resumoEfeito, hex);
    }

    curar(valor) {
        this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor);
    }

    // ==========================================
    // RITUAL DE CRIAÇÃO DE ITEM FORA DA BASE
    // ==========================================
    criarItemForaDaBase(tipoItem) {
        const minHpLitlegot = this.state.stats.maxHp * 0.25;
        const hpAtualLitlegot = this.state.stats.hp || 0;

        if (hpAtualLitlegot <= minHpLitlegot) {
            return this.animacaoTextoFlutuante("Bloqueio de Segurança: Sua vida está abaixo de 25%!", "#ff0000");
        }

        const custoHpLitlegot = Math.floor(this.state.stats.maxHp * 0.20);
        this.state.stats.hp -= custoHpLitlegot;

        if (tipoItem === 'elixir') {
            this.state.stats.ap = (this.state.stats.ap || 0) + 40;
            this.state.stats.ad = (this.state.stats.ad || 0) + 30;
            setTimeout(() => {
                this.state.stats.ap -= 40;
                this.state.stats.ad -= 30;
                atualizarUI();
            }, 30000);
            this.animacaoTextoFlutuante("Elixir Efêmero Forjado! (-20% HP)", "#ff8c00");
        } else if (tipoItem === 'escudo') {
            this.state.stats.shield = (this.state.stats.shield || 0) + 250;
            this.animacaoTextoFlutuante("Aegis de Tinta Concedido! (-20% HP)", "#00bfff");
        }

        document.getElementById('lg-modal-loja').style.display = 'none';
        atualizarUI();
    }

    // ==========================================
    // MINIGAME DE FARM RÍTMICO ULTRA DIFÍCIL
    // ==========================================
    iniciarMinigameFarm() {
        const arena = document.getElementById('lg-farm-arena');
        const status = document.getElementById('lg-farm-status');
        if (!arena) return;

        this.minigameScore = 0;
        this.minigameAtivo = true;
        status.innerText = "Pontos: 0 | Rito Iniciado!";

        let contador = 0;
        const maxAlvos = 8;

        const gerarAlvo = () => {
            if (contador >= maxAlvos || !this.minigameAtivo) {
                this.finalizarMinigameFarm();
                return;
            }

            const alvoEl = document.createElement('div');
            alvoEl.style.position = 'absolute';
            alvoEl.style.width = '36px';
            alvoEl.style.height = '36px';
            alvoEl.style.borderRadius = '50%';
            alvoEl.style.background = '#ff3333';
            alvoEl.style.border = '2px solid #fff';
            alvoEl.style.left = `${Math.random() * (arena.clientWidth - 40)}px`;
            alvoEl.style.top = `${Math.random() * (arena.clientHeight - 40)}px`;
            alvoEl.style.cursor = 'pointer';
            alvoEl.style.boxShadow = '0 0 10px #ff0000';

            const timeoutTarget = setTimeout(() => {
                if (alvoEl.parentNode) {
                    alvoEl.remove();
                    gerarAlvo();
                }
            }, 900); // Tempo super curto para clicar (Dificuldade Alta)

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
        const ouroGanhado = this.minigameScore * 45;
        const xpGanhado = this.minigameScore * 30;

        this.state.gold = (this.state.gold || 0) + ouroGanhado;
        this.animacaoTextoFlutuante(`Farm Concluído: +${ouroGanhado} 🪙 | +${xpGanhado} XP`, "#ffff00");
        document.getElementById('lg-modal-farm').style.display = 'none';
        atualizarUI();
    }

    // ==========================================
    // REDE E ANIMAÇÕES
    // ==========================================
    enviarAcaoParaChat(forma, nomeCor, efeito, hex) {
        if (!this.state.roomName) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: this.state.playerName,
            text: `<span style="color:${hex}; font-weight:bold;">[Arte ${forma} - ${nomeCor}]</span> Litlegot ${efeito}`,
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
        wave.style.width = '200px';
        wave.style.height = '200px';
        wave.style.marginLeft = '-100px';
        wave.style.marginTop = '-100px';
        wave.style.borderRadius = '50%';
        wave.style.border = `4px solid ${hex}`;
        wave.style.boxShadow = `0 0 20px ${hex}`;
        wave.style.animation = 'shockwave 0.6s ease-out forwards';

        layer.appendChild(wave);
        setTimeout(() => wave.remove(), 600);
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.style.position = 'fixed';
        textAnim.style.top = '40%';
        textAnim.style.left = '50%';
        textAnim.style.transform = 'translate(-50%, -50%)';
        textAnim.style.color = cor;
        textAnim.style.fontSize = '1.2rem';
        textAnim.style.fontWeight = 'bold';
        textAnim.style.textShadow = '0 0 8px #000';
        textAnim.style.zIndex = '10001';
        textAnim.style.pointerEvents = 'none';
        textAnim.innerText = texto;

        document.body.appendChild(textAnim);
        setTimeout(() => textAnim.remove(), 1200);
    }
}
