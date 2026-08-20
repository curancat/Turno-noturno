import { ref, onValue, set, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Vanguard {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;

        // Controle de Rota e Presença
        this.playersNaMesmaLane = {};
        this.dificuldadeEscala = 1.0;

        // Cooldowns e Anti-Abuso (Cooldowns e Punições)
        this.cooldowns = {
            farm: 0,
            forjaItem: 0,
            buffMundial: 0
        };
        this.tentativasAbusoForja = 0;

        // Detecção de AFK
        this.ultimaAcaoPlayer = Date.now();
        this.posicaoAnteriorX = this.state.stats?.posX || 0;
        this.posicaoAnteriorY = this.state.stats?.posY || 0;
        this.tempoAfkLimite = 30000; // 30 segundos parado gera alerta/penalidade

        // Estado do Minimapa e Buffs Dinâmicos
        this.minimapaAtivo = false;
        this.buffAleatorioAtivo = null;
    }

    iniciar() {
        this.injetarCSSVanguard();
        this.criarMinimapaUI();
        this.iniciarMonitoramentoGlobal();
        this.iniciarMonitoramentoAFK();
        this.iniciarVerificadorDeSaudeSistemica();
        this.gerarBuffsAleatoriosTempo();
    }

    // ==========================================
    // 1. LIMPEZA DE LAYOUT (REMOVE BOTÕES OBSOLETOS)
    // ==========================================
    injetarCSSVanguard() {
        if (document.getElementById('vanguard-styles')) return;
        const style = document.createElement('style');
        style.id = 'vanguard-styles';
        style.innerHTML = `
            /* Remove e oculta elementos legados ou botões duplicados de versões antigas do Litlegot */
            .lg-fab-container button[title*="Antigo"], .lg-legacy-btn, .litlegot-old-panel {
                display: none !important;
            }
            .vg-minimapa-container {
                position: fixed; top: 15px; left: 15px; width: 140px; height: 140px;
                background: rgba(10, 10, 20, 0.85); border: 2px solid #c5a059; border-radius: 10px;
                z-index: 9997; display: flex; flex-direction: column; align-items: center; justify-content: center;
                box-shadow: 0 0 15px rgba(0,0,0,0.8); pointer-events: none;
            }
            .vg-minimapa-canvas {
                width: 120px; height: 120px; background: #05050c; border-radius: 6px; position: relative;
            }
            .vg-dot-player {
                position: absolute; width: 8px; height: 8px; background: #00ffcc; border-radius: 50%;
                transform: translate(-50%, -50%); box-shadow: 0 0 6px #00ffcc;
            }
            .vg-dot-enemy {
                position: absolute; width: 8px; height: 8px; background: #ff3333; border-radius: 50%;
                transform: translate(-50%, -50%); box-shadow: 0 0 6px #ff3333;
            }
            .vg-dot-buff {
                position: absolute; width: 10px; height: 10px; background: #ffff00; border-radius: 50%;
                transform: translate(-50%, -50%); animation: vg-pulse 1s infinite alternate;
            }
            @keyframes vg-pulse {
                0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0.6; }
                100% { transform: translate(-50%, -50%) scale(1.3); opacity: 1; }
            }
        `;
        document.body.appendChild(style);

        // Remove resquícios visuais obsoletos do DOM
        document.querySelectorAll('.lg-old-element, [data-deprecated]').forEach(el => el.remove());
    }

    // ==========================================
    // 2. MONITORAMENTO GLOBAL E DIFICULDADE DINÂMICA
    // ==========================================
    iniciarMonitoramentoGlobal() {
        if (!this.state.roomName) return;
        const roomRef = ref(this.db, `rooms/${this.state.roomName}`);
        
        onValue(roomRef, (snapshot) => {
            const data = snapshot.val();
            if (!data || !data.players) return;

            const players = data.players;
            const totalPlayers = Object.keys(players).length;

            // Escala a dificuldade do jogo com base na quantidade real de players presentes
            if (totalPlayers >= 3) {
                this.dificuldadeEscala = 1.8; // Inimigos mais fortes, dano ajustado
            } else if (totalPlayers === 2) {
                this.dificuldadeEscala = 1.4;
            } else {
                this.dificuldadeEscala = 1.0;
            }

            this.state.dificuldadeAtual = this.dificuldadeEscala;
            this.atualizarPosicoesMinimapa(players);
        });
    }

    // ==========================================
    // 3. MINIMAPA TÁTICO
    // ==========================================
    criarMinimapaUI() {
        if (document.getElementById('vg-minimapa')) return;
        const container = document.createElement('div');
        container.id = 'vg-minimapa';
        container.className = 'vg-minimapa-container';
        container.innerHTML = `
            <div style="font-size:0.65rem; color:#c5a059; margin-bottom:2px; font-weight:bold;">TÁTICO MAPA</div>
            <div class="vg-minimapa-canvas" id="vg-minimapa-arena"></div>
        `;
        document.body.appendChild(container);
    }

    atualizarPosicoesMinimapa(players) {
        const arena = document.getElementById('vg-minimapa-arena');
        if (!arena) return;
        arena.innerHTML = '';

        // Renderiza aliados e inimigos baseados nas coordenadas da sala
        Object.keys(players).forEach(id => {
            const p = players[id];
            const dot = document.createElement('div');
            const posX = (p.posX || 50); // Porcentagem 0 a 100
            const posY = (p.posY || 50);

            if (p.team === this.state.playerTeam) {
                dot.className = 'vg-dot-player';
            } else {
                dot.className = 'vg-dot-enemy';
            }

            dot.style.left = `${posX}%`;
            dot.style.top = `${posY}%`;
            arena.appendChild(dot);
        });

        // Renderiza Buff Aleatório no Minimapa se ativo
        if (this.buffAleatorioAtivo) {
            const buffDot = document.createElement('div');
            buffDot.className = 'vg-dot-buff';
            buffDot.style.left = `${this.buffAleatorioAtivo.x}%`;
            buffDot.style.top = `${this.buffAleatorioAtivo.y}%`;
            buffDot.title = "Buff Dinâmico Disponível!";
            arena.appendChild(buffDot);
        }
    }

    // ==========================================
    // 4. VALIDAÇÃO DE COMBATE: ROTA E VISÃO (ANTI-BASE ATTACK)
    // ==========================================
    validarAtaque(alvoX, alvoY, inimigoNaMesmaLane, temVisao) {
        // Bloqueia ataques se o alvo estiver fora da lane ou se não houver visão (ex: atacando da base)
        const naBaseDoAvaliador = this.state.stats?.naBase === true;

        if (naBaseDoAvaliador) {
            this.notificarVanguard("Ataque Negado: Você está na base e não pode atingir alvos distantes!");
            return false;
        }

        if (!inimigoNaMesmaLane) {
            this.notificarVanguard("Ataque Negado: O inimigo não está na mesma rota que você!");
            return false;
        }

        if (!temVisao) {
            this.notificarVanguard("Ataque Negado: Sem visão direta do alvo!");
            return false;
        }

        return true;
    }

    // ==========================================
    // 5. CONTROLES DE FARM, COOLDOWNS E PUNIÇÕES DE ABUSO
    // ==========================================
    validarFarm() {
        const agora = Date.now();
        const cooldownFarmMs = 4000; // 4 segundos de recarga obrigatória no farm

        if (agora < this.cooldowns.farm) {
            const restante = Math.ceil((this.cooldowns.farm - agora) / 1000);
            this.notificarVanguard(`Farm em Recarga! Aguarde ${restante}s.`);
            return false;
        }

        this.cooldowns.farm = agora + cooldownFarmMs;
        return true;
    }

    validarForjaItem() {
        const agora = Date.now();
        const cooldownForjaMs = 15000; // 15 segundos entre criações de itens fora da base

        if (agora < this.cooldowns.forjaItem) {
            this.tentativasAbusoForja++;
            
            // Se o player abusar repetidamente tentando spammar itens, aplica punição severa
            if (this.tentativasAbusoForja >= 3) {
                this.aplicarPunicaoAbuso("Abuso de mecânica de forja detectado! Penalidade aplicada.");
                this.tentativasAbusoForja = 0;
                return false;
            }

            this.notificarVanguard("Forja em Recarga! Cuidado com o spam.");
            return false;
        }

        this.cooldowns.forjaItem = agora + cooldownForjaMs;
        this.tentativasAbusoForja = Math.max(0, this.tentativasAbusoForja - 1);
        return true;
    }

    aplicarPunicaoAbuso(motivo) {
        this.state.stats.hp = Math.max(1, (this.state.stats.hp || 100) - 50);
        this.state.stats.ap = Math.max(0, (this.state.stats.ap || 0) - 20);
        this.notificarVanguard(`⚠️ PUNIÇÃO VANGUARD: ${motivo} (-50 HP, -20 AP)`);
        atualizarUI();
    }

    // ==========================================
    // 6. DETECÇÃO DE AFK E MOVIMENTAÇÃO CONSTANTE
    // ==========================================
    iniciarMonitoramentoAFK() {
        setInterval(() => {
            const posXAtual = this.state.stats?.posX || 0;
            const posYAtual = this.state.stats?.posY || 0;
            const tempoDecorrido = Date.now() - this.ultimaAcaoPlayer;

            // Verifica se o player saiu do lugar ou interagiu
            if (posXAtual === this.posicaoAnteriorX && posYAtual === this.posicaoAnteriorY) {
                if (tempoDecorrido > this.tempoAfkLimite) {
                    this.notificarVanguard("⚠️ Alerta AFK: Mova-se pela rota para evitar penalidades de combate!");
                    // Aplica penalidade leve por inatividade prolongada
                    this.state.stats.mana = Math.max(0, (this.state.stats.mana || 0) - 10);
                    atualizarUI();
                }
            } else {
                this.posicaoAnteriorX = posXAtual;
                this.posicaoAnteriorY = posYAtual;
                this.ultimaAcaoPlayer = Date.now();
            }
        }, 10000);
    }

    // ==========================================
    // 7. BUFFS DINÂMICOS ALEATÓRIOS E MINIGAMES DE CAPTURA
    // ==========================================
    gerarBuffsAleatoriosTempo() {
        // A cada 45 segundos, gera um local de buff aleatório no mapa
        setInterval(() => {
            if (this.buffAleatorioAtivo) return;

            this.buffAleatorioAtivo = {
                x: Math.floor(Math.random() * 80) + 10,
                y: Math.floor(Math.random() * 80) + 10,
                tipo: Math.random() > 0.5 ? 'Poder Absoluto' : 'Velocidade Supônica'
            };

            this.notificarVanguard(`✨ Um Buff de [${this.buffAleatorioAtivo.tipo}] apareceu nas coordenadas (${this.buffAleatorioAtivo.x}, ${this.buffAleatorioAtivo.y})! Vá até lá e vença o desafio.`);
            this.atualizarPosicoesMinimapa({});
        }, 45000);
    }

    tentarCapturarBuff(playerX, playerY) {
        if (!this.buffAleatorioAtivo) return false;

        const distancia = Math.hypot(playerX - this.buffAleatorioAtivo.x, playerY - this.buffAleatorioAtivo.y);
        if (distancia < 12) { // Próximo o suficiente para interagir
            this.abrirMinigameCapturaBuff(this.buffAleatorioAtivo.tipo);
            return true;
        }
        return false;
    }

    abrirMinigameCapturaBuff(tipoBuff) {
        // Dispara um minigame rápido de reflexo para coletar o boost
        const sucesso = confirm(`Desafio Vanguard! Toque OK rapidamente para capturar o buff de ${tipoBuff}!`);
        if (sucesso) {
            if (tipoBuff === 'Poder Absoluto') {
                this.state.stats.ap = (this.state.stats.ap || 0) + 60;
                setTimeout(() => this.state.stats.ap -= 60, 20000);
            } else {
                this.state.stats.ms = (this.state.stats.ms || 300) + 90;
                setTimeout(() => this.state.stats.ms -= 90, 20000);
            }
            this.notificarVanguard(`🎉 Buff "${tipoBuff}" capturado com sucesso!`);
            this.buffAleatorioAtivo = null;
            atualizarUI();
        } else {
            this.notificarVanguard("❌ Falha na captura do buff!");
            this.buffAleatorioAtivo = null;
        }
    }

    // ==========================================
    // 8. COMUNICAÇÃO INTERSISTÊMICA E SAÚDE
    // ==========================================
    iniciarVerificadorDeSaudeSistemica() {
        // Verifica se os arquivos e dependências integrados estão operando corretamente
        setInterval(() => {
            if (!this.state) {
                console.error("[Vanguard] Erro Crítico: Estado do jogo corrompido ou ausente.");
            }
        }, 5000);
    }

    notificarVanguard(mensagem) {
        const aviso = document.createElement('div');
        aviso.style.position = 'fixed';
        aviso.style.top = '18%';
        aviso.style.left = '50%';
        aviso.style.transform = 'translate(-50%, -50%)';
        aviso.style.background = 'rgba(20, 20, 35, 0.95)';
        aviso.style.border = '2px solid #c5a059';
        aviso.style.color = '#fff';
        aviso.style.padding = '10px 18px';
        aviso.style.borderRadius = '8px';
        aviso.style.fontSize = '0.9rem';
        aviso.style.fontWeight = 'bold';
        aviso.style.zIndex = '10005';
        aviso.style.boxShadow = '0 0 15px rgba(197, 160, 89, 0.4)';
        aviso.innerText = mensagem;

        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 2500);
    }
}
