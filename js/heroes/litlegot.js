import { ref, push, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;

        this.corAtiva = 'red';
        this.alvoSelecionado = this.state.playerName; // Mira padrão é si mesmo
        this.folhasGuardadas = []; 
        this.maxFolhas = 3;

        this.multiplayerAtivo = false;
        this.jogadoresNaSala = {}; // Armazena os players reais
        this.ultimoEventoAnimacao = 0; // Evita repetir animações velhas da rede

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
        this.escutarEfeitosDeRede();
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
    // MULTIPLAYER E MIRA REAL NOS PLAYERS
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
                this.atualizarDropdownMira(); // Atualiza a mira instantaneamente
            }
        });
    }

    atualizarDropdownMira() {
        const selectAlvo = document.getElementById('lg-alvo-select');
        if (!selectAlvo) return;
        
        const alvoAntigo = selectAlvo.value;
        selectAlvo.innerHTML = ''; // Limpa botões fantasmas

        // Preenche APENAS com players reais da sala
        Object.keys(this.jogadoresNaSala).forEach(playerName => {
            const option = document.createElement('option');
            option.value = playerName;
            option.innerText = playerName === this.state.playerName ? `🎯 ${playerName} (Você)` : `👤 ${playerName}`;
            selectAlvo.appendChild(option);
        });

        // Mantém o alvo selecionado se ele ainda existir na sala
        if (this.jogadoresNaSala[alvoAntigo]) {
            selectAlvo.value = alvoAntigo;
        } else {
            selectAlvo.value = this.state.playerName;
            this.alvoSelecionado = this.state.playerName;
        }
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
        this.animacaoTextoFlutuante("Tinta e HP Restaurados!", "#00ffcc");
        atualizarUI();
    }

    // ==========================================
    // UI MOBILE - DOCK NAVIGATION E MODAIS
    // ==========================================
    injetarCSSMobileEPopups() {
        if (document.getElementById('litlegot-styles-v4')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles-v4';
        style.innerHTML = `
            /* Barra Inferior Moderna (Mobile First) */
            .lg-bottom-dock {
                position: fixed; bottom: 0; left: 0; width: 100vw;
                background: rgba(10, 10, 18, 0.85); backdrop-filter: blur(12px);
                border-top: 1px solid rgba(197, 160, 89, 0.4);
                display: flex; justify-content: space-evenly; align-items: center;
                padding: 10px 0 calc(10px + env(safe-area-inset-bottom));
                z-index: 9999; box-shadow: 0 -5px 20px rgba(0,0,0,0.5);
            }
            .lg-dock-btn {
                background: none; border: none; color: #fff;
                display: flex; flex-direction: column; align-items: center; gap: 6px;
                font-size: 1.6rem; cursor: pointer; transition: transform 0.2s, color 0.2s;
                touch-action: manipulation;
            }
            .lg-dock-btn span { font-size: 0.65rem; color: #aaa; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;}
            .lg-dock-btn:active { transform: scale(0.85); color: #c5a059; }

            /* Modais e Popups adaptados para Mobile */
            .lg-popup {
                position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(0, 0, 0, 0.8); backdrop-filter: blur(6px); z-index: 10000;
                display: none; align-items: center; justify-content: center; padding: 15px;
                box-sizing: border-box;
            }
            .lg-popup-card {
                background: linear-gradient(145deg, #121220, #0d0d18);
                border: 1px solid rgba(197, 160, 89, 0.5); border-radius: 18px;
                width: 100%; max-width: 420px; padding: 20px; color: #fff;
                box-shadow: 0 10px 40px rgba(0,0,0,0.8); display: flex;
                flex-direction: column; gap: 15px; max-height: 85vh; overflow-y: auto;
            }
            
            /* Canvas de Desenho Otimizado */
            .lg-canvas-box {
                width: 100%; height: 320px; background: #050508; 
                border: 2px dashed #444; border-radius: 12px; 
                position: relative; overflow: hidden;
            }
            
            /* Paleta e Outros */
            .lg-palette { display: flex; justify-content: space-between; gap: 8px; overflow-x: auto; padding: 10px 0; }
            .lg-color-dot {
                width: 40px; height: 40px; border-radius: 50%; border: 3px solid #333; flex-shrink: 0;
                cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            }
            .lg-color-dot.active { border-color: #fff; transform: scale(1.15) translateY(-5px); }
            
            .lg-grid-folhas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
            .lg-folha-card {
                background: rgba(255,255,255,0.05); border: 1px solid #c5a059; border-radius: 10px;
                padding: 12px 5px; text-align: center; cursor: pointer; transition: background 0.2s;
            }
            .lg-folha-card:active { background: rgba(197, 160, 89, 0.2); }

            /* Efeitos CSS para as Animações Reais */
            .lg-fx-layer { position: fixed; top:0; left:0; width:100vw; height:100vh; pointer-events:none; z-index:9998; overflow:hidden; }
            
            @keyframes pulseCircle {
                0% { transform: scale(0.1); opacity: 1; border-width: 15px; }
                100% { transform: scale(3.5); opacity: 0; border-width: 2px; }
            }
            @keyframes slashX {
                0% { width: 0; opacity: 1; }
                100% { width: 150vw; opacity: 0; }
            }
            @keyframes flashScreen {
                0% { background: rgba(255,255,255,0.8); }
                100% { background: transparent; }
            }
        `;
        document.head.appendChild(style);
    }

    criarPopupsEModais() {
        if (!document.getElementById('lg-fx-layer')) {
            const layer = document.createElement('div');
            layer.id = 'lg-fx-layer';
            layer.className = 'lg-fx-layer';
            document.body.appendChild(layer);
        }

        // Dock Navigation Mobile
        const dockContainer = document.createElement('div');
        dockContainer.className = 'lg-bottom-dock';
        dockContainer.innerHTML = `
            <button class="lg-dock-btn" id="lg-btn-ateliere">🎨<span>Pintar</span></button>
            <button class="lg-dock-btn" id="lg-btn-mochila">📜<span>Mochila</span></button>
            <button class="lg-dock-btn" id="lg-btn-farm">🌾<span>Farm</span></button>
            <button class="lg-dock-btn" id="lg-btn-loja">⚒️<span>Forja</span></button>
            <button class="lg-dock-btn" id="lg-btn-base">🏛️<span>Base</span></button>
        `;
        document.body.appendChild(dockContainer);

        // Modal 1: Canvas
        const popupCanvas = document.createElement('div');
        popupCanvas.id = 'lg-modal-canvas';
        popupCanvas.className = 'lg-popup';
        popupCanvas.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.3rem;">🎨 Ateliê Tático</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.6rem; cursor:pointer;">✕</button>
                </div>
                <div style="font-size:0.9rem; color:#ccc;">Formas mágicas: <b>O</b> (Explosão), <b>X</b> (Corte), <b>Z</b> (Raio).</div>
                
                <div class="lg-palette" id="lg-palette-select"></div>
                <div class="lg-canvas-box">
                    <canvas id="lg-paint-canvas" style="width:100%; height:100%;"></canvas>
                </div>
                <div style="display:flex; gap:12px;">
                    <button id="lg-btn-limpar" style="flex:1; background:#2a2a3e; color:#fff; border:none; padding:14px; border-radius:10px; font-weight:bold; font-size:1rem;">Limpar</button>
                    <button id="lg-btn-guardar" style="flex:2; background:#c5a059; color:#000; font-weight:bold; border:none; padding:14px; border-radius:10px; font-size:1rem;">Guardar Arte</button>
                </div>
            </div>
        `;
        document.body.appendChild(popupCanvas);

        // Modal 2: Mochila de Artes e Seleção de Alvo Real
        const popupMochila = document.createElement('div');
        popupMochila.id = 'lg-modal-mochila';
        popupMochila.className = 'lg-popup';
        popupMochila.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059; font-size:1.3rem;">📜 Mochila Mágica</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.6rem; cursor:pointer;">✕</button>
                </div>
                
                <label style="font-size:0.9rem; color:#bbb; margin-top:5px;">Selecione o Player Alvo:</label>
                <select id="lg-alvo-select" style="background:#0a0a12; color:#fff; padding:14px; border:1px solid rgba(197,160,89,0.6); border-radius:10px; font-weight:bold; font-size:1rem; outline:none;"></select>

                <div class="lg-grid-folhas" id="lg-folhas-container" style="margin-top:10px;"></div>
            </div>
        `;
        document.body.appendChild(popupMochila);

        // Modal 3: Farm
        const popupFarm = document.createElement('div');
        popupFarm.id = 'lg-modal-farm';
        popupFarm.className = 'lg-popup';
        popupFarm.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059;">🌾 Farm Rítmico</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.6rem; cursor:pointer;">✕</button>
                </div>
                <div style="position:relative; width:100%; height:300px; background:#04040a; border:2px solid #333; border-radius:12px; overflow:hidden;" id="lg-farm-arena">
                    <div id="lg-farm-status" style="position:absolute; top:10px; left:10px; color:#fff; font-size:1rem; font-weight:bold; text-shadow: 0 2px 4px #000;">Pontos: 0</div>
                </div>
                <button id="lg-start-farm" style="background:#28a745; color:#fff; border:none; padding:15px; border-radius:10px; font-weight:bold; font-size:1.1rem;">Iniciar Desafio</button>
            </div>
        `;
        document.body.appendChild(popupFarm);

        // Modal 4: Loja
        const popupLoja = document.createElement('div');
        popupLoja.id = 'lg-modal-loja';
        popupLoja.className = 'lg-popup';
        popupLoja.innerHTML = `
            <div class="lg-popup-card">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#c5a059;">⚒️ Forja de Sacrifício</h3>
                    <button class="lg-close-btn" style="background:none; border:none; color:#fff; font-size:1.6rem; cursor:pointer;">✕</button>
                </div>
                <p style="font-size:0.9rem; color:#ff5555; margin:0;">Custa 25% do HP Máximo para forjar o item permanentemente.</p>
                <div style="display:flex; flex-direction:column; gap:12px;">
                    <button class="lg-craft-item" data-item="espada" style="background:#1a1a2e; color:#fff; border:1px solid #c5a059; padding:15px; border-radius:10px; text-align:left; font-size:1rem;">⚔️ Espada Longa (+35 AD)</button>
                    <button class="lg-craft-item" data-item="tomo" style="background:#1a1a2e; color:#fff; border:1px solid #c5a059; padding:15px; border-radius:10px; text-align:left; font-size:1rem;">📘 Tomo Amplificador (+50 AP)</button>
                    <button class="lg-craft-item" data-item="cristal" style="background:#1a1a2e; color:#fff; border:1px solid #c5a059; padding:15px; border-radius:10px; text-align:left; font-size:1rem;">💎 Cristal de Rubi (+300 HP)</button>
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
            dot.style.boxShadow = `0 0 8px ${cor.hex}`;
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
        document.getElementById('lg-btn-mochila').onclick = () => { this.atualizarUIFolhas(); this.atualizarDropdownMira(); togglePopup('lg-modal-mochila', true); };
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
    // CANVAS MELHORADO (TOUCH COM PREVENT DEFAULT)
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
            e.preventDefault(); // Impede a tela de rolar no mobile
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
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.tintas[this.corAtiva].hex;
        };

        const draw = (e) => {
            if (!this.desenhandoCanvas) return;
            e.preventDefault();
            const pos = getPos(e);
            this.pontosDesenho.push(pos);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
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
        
        // Passive: false permite o e.preventDefault() bloquear o scroll
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
        if (!forma) return this.animacaoTextoFlutuante("Traço inválido! Desenhe forte O, X ou Z.", "#ff8c00");

        const corData = this.tintas[this.corAtiva];
        if (this.state.stats.mana < corData.custo) {
            return this.animacaoTextoFlutuante(`Falta Tinta! Necessário: ${corData.custo} MP`, "#ff0000");
        }

        this.state.stats.mana -= corData.custo;
        this.folhasGuardadas.push({ id: Date.now(), forma, corKey: this.corAtiva, corHex: corData.hex, nomeCor: corData.nome, apSnapshot: this.state.stats.ap || 0 });

        this.limparCanvas();
        this.animacaoTextoFlutuante(`Arte [${forma}] Guardada!`, corData.hex);
        document.getElementById('lg-modal-canvas').style.display = 'none';
        atualizarUI();
    }

    atualizarUIFolhas() {
        const container = document.getElementById('lg-folhas-container');
        if (!container) return;
        container.innerHTML = '';

        if (this.folhasGuardadas.length === 0) {
            container.innerHTML = '<div style="grid-column:1/span 3; color:#777; font-size:0.9rem; text-align:center; padding:30px 0;">Mochila vazia.</div>';
            return;
        }

        this.folhasGuardadas.forEach((folha, index) => {
            const card = document.createElement('div');
            card.className = 'lg-folha-card';
            card.style.borderColor = folha.corHex;
            card.style.boxShadow = `inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px ${folha.corHex}33`;
            card.innerHTML = `
                <div style="font-size:2rem; font-weight:bold; color:${folha.corHex}; text-shadow: 0 0 10px ${folha.corHex};">${folha.forma}</div>
                <div style="font-size:0.7rem; color:#aaa; margin-top:5px;">${folha.nomeCor}</div>
                <button style="margin-top:10px; background:${folha.corHex}; color:#000; border:none; border-radius:6px; font-weight:bold; width:100%; padding:8px; cursor:pointer;">Ativar</button>
            `;
            card.querySelector('button').onclick = () => this.ativarFolha(index);
            container.appendChild(card);
        });
    }

    // ==========================================
    // EXECUÇÃO DE EFEITOS E COMBATE REAL
    // ==========================================
    ativarFolha(index) {
        const folha = this.folhasGuardadas[index];
        const alvo = this.alvoSelecionado || this.state.playerName;
        if (!folha) return;

        this.folhasGuardadas.splice(index, 1);
        this.atualizarUIFolhas();
        document.getElementById('lg-modal-mochila').style.display = 'none';

        this.executarEfeitoReal(folha.forma, folha.corKey, folha.apSnapshot, alvo);
        
        // Sincroniza a animação super visual para a rede
        this.sincronizarAnimacao(folha.forma, folha.corHex);
    }

    executarEfeitoReal(forma, corKey, apSnap, alvoName) {
        const ap = apSnap || this.state.stats.ap || 0;
        const hex = this.tintas[corKey].hex;
        let nomeEfeito = "";
        let resumoAcao = "";
        let danoCausado = 0;
        let curaGerada = 0;

        switch (corKey) {
            case 'red':
                if (forma === 'O') { nomeEfeito = "Inferno Circular"; danoCausado = Math.floor(ap * 2.2); } 
                else if (forma === 'X') { nomeEfeito = "Corte Flamejante"; danoCausado = Math.floor(ap * 1.8); } 
                else { nomeEfeito = "Labareda Ziguezague"; danoCausado = Math.floor(ap * 3.5); }
                break;
            case 'orange':
                if (forma === 'O') { nomeEfeito = "Vampirismo"; curaGerada = Math.floor(ap * 1.5); } 
                else if (forma === 'X') { nomeEfeito = "Drenagem"; danoCausado = Math.floor(ap * 2.0); curaGerada = danoCausado; } 
                else { nomeEfeito = "Pulso Hemático"; curaGerada = Math.floor(ap * 1.0); }
                break;
            case 'blue':
                if (forma === 'X') { nomeEfeito = "Lança Gélida"; danoCausado = Math.floor(ap * 2.0); }
                else { nomeEfeito = "Cúpula Aquática"; curaGerada = Math.floor(ap * 2.0); }
                break;
            case 'white':
                if (forma === 'X') { nomeEfeito = "Julgamento Sagrado"; danoCausado = Math.floor(ap * 4.5); } 
                else { nomeEfeito = "Halo Divino"; curaGerada = Math.floor(ap * 3.0); }
                break;
            default:
                nomeEfeito = "Magia Rápida"; danoCausado = Math.floor(ap * 1.5);
                break;
        }

        // Aplica o status no Alvo Real
        if (danoCausado > 0) {
            this.aplicarDanoNoPlayerReal(alvoName, danoCausado);
            resumoAcao = `atingiu ${alvoName} causando ${danoCausado} de Dano!`;
        }
        if (curaGerada > 0) {
            this.curar(curaGerada);
            resumoAcao += ` (e recuperou ${curaGerada} HP)`;
        }

        this.enviarAcaoParaChat(forma, nomeEfeito, resumoAcao || `conjurou mágica sobre ${alvoName}`, hex);
        atualizarUI();
    }

    aplicarDanoNoPlayerReal(alvoName, dano) {
        if (alvoName === this.state.playerName) {
            this.state.stats.hp = Math.max(0, this.state.stats.hp - dano);
        } else if (this.jogadoresNaSala && this.jogadoresNaSala[alvoName]) {
            // Acessa o Firebase do player específico alvo para subtrair o HP real dele
            const statsAlvo = this.jogadoresNaSala[alvoName].stats;
            if (statsAlvo && statsAlvo.hp !== undefined) {
                const hpNovo = Math.max(0, statsAlvo.hp - dano);
                const alvoRef = ref(this.db, `rooms/${this.state.roomName}/players/${alvoName}/stats`);
                update(alvoRef, { hp: hpNovo });
            }
        }
    }

    curar(valor) {
        this.state.stats.hp = Math.min(this.state.stats.maxHp, (this.state.stats.hp || 0) + valor);
    }

    // ==========================================
    // SISTEMA DE EFEITOS VISUAIS E SINCRONIA
    // ==========================================
    sincronizarAnimacao(forma, hex) {
        // Reproduz localmente primeiro
        this.renderizarAnimacaoFX(forma, hex);
        
        // Envia para a rede para os outros verem (usando um node temporário no chat/events)
        if (this.state.roomName) {
            const animRef = ref(this.db, `rooms/${this.state.roomName}/litlegot_fx`);
            set(animRef, { forma, hex, timestamp: Date.now(), disparador: this.state.playerName });
        }
    }

    escutarEfeitosDeRede() {
        if (!this.state.roomName) return;
        const animRef = ref(this.db, `rooms/${this.state.roomName}/litlegot_fx`);
        onValue(animRef, (snapshot) => {
            const data = snapshot.val();
            // Se houver um evento novo e não foi disparado por nós mesmos (para não duplicar)
            if (data && data.timestamp > this.ultimoEventoAnimacao && data.disparador !== this.state.playerName) {
                this.ultimoEventoAnimacao = data.timestamp;
                this.renderizarAnimacaoFX(data.forma, data.hex);
            }
        });
    }

    renderizarAnimacaoFX(forma, hex) {
        const layer = document.getElementById('lg-fx-layer');
        if (!layer) return;
        layer.innerHTML = ''; // Limpa anterior

        // Flash na tela
        const flash = document.createElement('div');
        flash.style.cssText = `position:absolute; width:100%; height:100%; background:${hex}; opacity:0.3; animation: flashScreen 0.5s ease-out forwards;`;
        layer.appendChild(flash);

        if (forma === 'O') {
            const wave = document.createElement('div');
            wave.style.cssText = `position:absolute; top:50%; left:50%; width:100px; height:100px; margin:-50px 0 0 -50px; border-radius:50%; border:15px solid ${hex}; box-shadow:0 0 30px ${hex}; animation: pulseCircle 0.8s ease-out forwards;`;
            layer.appendChild(wave);
        } else if (forma === 'X') {
            const slash1 = document.createElement('div');
            const slash2 = document.createElement('div');
            const baseCss = `position:absolute; top:50%; left:-25vw; height:8px; background:${hex}; box-shadow:0 0 20px ${hex}, 0 0 40px #fff; animation: slashX 0.4s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; transform-origin: left;`;
            slash1.style.cssText = baseCss + `transform: translateY(-50%) rotate(45deg);`;
            slash2.style.cssText = baseCss + `transform: translateY(-50%) rotate(-45deg);`;
            layer.appendChild(slash1);
            layer.appendChild(slash2);
        } else { // Z (Raio)
            const raio = document.createElement('div');
            raio.style.cssText = `position:absolute; top:10%; left:45%; width:10px; height:120vh; background:${hex}; box-shadow:0 0 30px ${hex}, 0 0 50px #fff; transform: rotate(15deg); animation: flashScreen 0.3s steps(3, end) forwards;`;
            layer.appendChild(raio);
        }

        setTimeout(() => { layer.innerHTML = ''; }, 1000);
    }

    // ==========================================
    // MINIGAME DE FARM E FORJA
    // ==========================================
    iniciarMinigameFarm() {
        const arena = document.getElementById('lg-farm-arena');
        const status = document.getElementById('lg-farm-status');
        if (!arena) return;

        this.minigameScore = 0;
        this.minigameAtivo = true;
        status.innerText = "Pontos: 0";
        let contador = 0;

        const gerarAlvo = () => {
            if (contador >= 10 || !this.minigameAtivo) {
                this.finalizarMinigameFarm(); return;
            }

            const alvoEl = document.createElement('div');
            alvoEl.style.cssText = `position:absolute; width:50px; height:50px; border-radius:50%; background:radial-gradient(circle, #fff, #c5a059); border:2px solid #fff; box-shadow:0 0 15px #c5a059; cursor:pointer; left:${Math.random()*(arena.clientWidth-60)}px; top:${Math.random()*(arena.clientHeight-60)}px;`;
            
            const timeoutTarget = setTimeout(() => {
                if (alvoEl.parentNode) { alvoEl.remove(); gerarAlvo(); }
            }, 800); // 800ms para clicar no mobile

            alvoEl.ontouchstart = alvoEl.onmousedown = (e) => {
                e.preventDefault();
                clearTimeout(timeoutTarget);
                this.minigameScore++;
                status.innerText = `Pontos: ${this.minigameScore}`;
                alvoEl.style.background = "#fff";
                alvoEl.style.transform = "scale(1.5)";
                alvoEl.style.opacity = "0";
                setTimeout(() => { alvoEl.remove(); gerarAlvo(); }, 100);
            };

            arena.appendChild(alvoEl);
            contador++;
        };
        gerarAlvo();
    }

    finalizarMinigameFarm() {
        this.minigameAtivo = false;
        const ouroGanhado = this.minigameScore * 60;
        this.state.gold = (this.state.gold || 0) + ouroGanhado;
        this.animacaoTextoFlutuante(`Farm: +${ouroGanhado} 🪙`, "#ffff00");
        document.getElementById('lg-modal-farm').style.display = 'none';
        atualizarUI();
    }

    criarItemDaLoja(tipoItem) {
        const custoHp = Math.floor(this.state.stats.maxHp * 0.25);
        if (this.state.stats.hp <= custoHp) return this.animacaoTextoFlutuante("Falha: HP Insuficiente!", "#ff0000");

        this.state.stats.hp -= custoHp;
        if (tipoItem === 'espada') { this.state.stats.ad = (this.state.stats.ad || 0) + 35; this.animacaoTextoFlutuante("+35 AD Forjado!", "#ff8c00"); }
        else if (tipoItem === 'tomo') { this.state.stats.ap = (this.state.stats.ap || 0) + 50; this.atualizarTintaEstatistica(); this.animacaoTextoFlutuante("+50 AP Forjado!", "#8a2be2"); }
        else if (tipoItem === 'cristal') { this.state.stats.maxHp += 300; this.state.stats.hp += 300; this.animacaoTextoFlutuante("+300 HP Forjado!", "#ff3333"); }
        
        document.getElementById('lg-modal-loja').style.display = 'none';
        atualizarUI();
    }

    enviarAcaoParaChat(forma, nomeEfeito, resumo, hex) {
        if (!this.state.roomName) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: this.state.playerName,
            text: `<span style="color:${hex}; font-weight:bold; font-size:1.1rem; text-shadow:0 0 5px ${hex};">[${forma} - ${nomeEfeito}]</span> Litlegot ${resumo}`,
            type: "combat",
            time: Date.now()
        });
    }

    animacaoTextoFlutuante(texto, cor) {
        const t = document.createElement('div');
        t.style.cssText = `position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); color:${cor}; font-size:1.5rem; font-weight:bold; text-shadow:0 2px 10px #000; z-index:10001; pointer-events:none; transition: all 1s ease-out; text-align:center; width:90vw;`;
        t.innerText = texto;
        document.body.appendChild(t);
        
        requestAnimationFrame(() => {
            t.style.top = '30%';
            t.style.opacity = '0';
        });
        setTimeout(() => t.remove(), 1000);
    }
}
