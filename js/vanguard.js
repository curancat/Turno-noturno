// ==========================================
// VANGUARD: SISTEMA DE SEGURANÇA E ARBITRAGEM
// ==========================================
import { ref, update, onValue, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "./app.js";

export default class Vanguard {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        // Rastreamento Anti-AFK e Movimento
        this.ultimaPosicaoX = 0;
        this.ultimaPosicaoY = 0;
        this.tempoInativo = 0;
        this.limiteInatividadeAFK = 15; // Segundos máximos parado
        
        // Cooldown anti-abuso de ações rápidas
        this.bloqueadoPorAbuso = false;
        this.contadorAbuso = 0;

        // Mini-mapa dinâmico e posições
        this.posicoesJogadores = {};
    }

    iniciar() {
        console.log("🛡️ VANGUARD ATIVADO: Protocolos de integridade e justiça iniciados.");
        this.limparLayoutObsoleto();
        this.iniciarMonitoramentoAFK();
        this.iniciarRadarMiniMapa();
        this.iniciarGeradorDeBuffsAleatorios();
        this.escalonarDificuldadePorPlayers();
    }

    // ==========================================
    // 1. LIMPEZA DE LAYOUT OBSOLETO
    // ==========================================
    limparLayoutObsoleto() {
        // Remove botões fantasmas ou versões antigas que poluem a tela
        const elementosObsoletos = document.querySelectorAll('.old-version-btn, .legacy-control, [data-deprecated]');
        elementosObsoletos.forEach(el => el.remove());

        // Força organização limpa nos containers de habilidades
        const controlPanels = document.querySelectorAll('.skills-controls, .game-controls');
        controlPanels.forEach(panel => {
            panel.style.display = 'flex';
            panel.style.flexDirection = 'column';
            panel.style.gap = '8px';
        });
    }

    // ==========================================
    // 2. ANTI-AFK E MOVIMENTAÇÃO OBRIGATÓRIA
    // ==========================================
    iniciarMonitoramentoAFK() {
        setInterval(() => {
            // Se o jogador estiver na base ou morto, perdoa o AFK temporariamente
            if (this.state.lane === "Base" || this.state.stats.hp <= 0) {
                this.tempoInativo = 0;
                return;
            }

            this.tempoInativo++;

            // Se passar de 15 segundos sem interagir ou se mover gerando farm
            if (this.tempoInativo >= this.limiteInatividadeAFK) {
                this.aplicarPunicaoPesada("⚠️ PUNIÇÃO VANGUARD (AFK/Estagnação): Você ficou estagnado na rota! O sistema drenou 50 de Ouro e 10% da sua Vida atual por falta de movimentação.");
                this.tempoInativo = 0;
            }
        }, 1000);

        // Reseta o timer de inatividade quando o usuário clica ou usa skills
        window.addEventListener('click', () => { this.tempoInativo = 0; });
        window.addEventListener('keydown', () => { this.tempoInativo = 0; });
    }

    // ==========================================
    // 3. BLOQUEIO DE ATAQUES FORA DE ROTA / BASE SNIPER
    // ==========================================
    validarPermissaoAtaque(alvoSelecionado, laneDoAlvo = null) {
        // Regra 1: Proibido atacar da base
        if (this.state.lane === "Base") {
            this.aplicarPunicaoPesada("🚨 BLOQUEIO VANGUARD: Tentativa de ataque a partir da Base negada. A lei do Rift proíbe ataques à distância segura da Base.");
            return false;
        }

        // Regra 2: O alvo precisa estar na mesma rota (Lane)
        if (laneDoAlvo && laneDoAlvo !== this.state.lane) {
            this.aplicarPunicaoPesada("🚨 BLOQUEIO VANGUARD: Alvo fora da sua rota (Lane). Ataques trans-rotas sem visão direta são proibidos.");
            return false;
        }

        // Regra 3: Checagem de Visão (Se tentarem atacar sem luz/visão)
        if (alvoSelecionado && alvoSelecionado.includes("Oculto") && this.corAtivaAtual !== 'yellow' && this.corAtivaAtual !== 'white') {
            this.aplicarPunicaoPesada("🚨 BLOQUEIO VANGUARD: Falha de Visão! O alvo está nas sombras e você não possui luz amarela ativa.");
            return false;
        }

        return true;
    }

    // ==========================================
    // 4. PUNIÇÃO PESADA CONTRA ABUSO (EXPLOITS)
    // ==========================================
    registrarTentativaAbuso(motivo) {
        this.contadorAbuso++;
        
        // Punição escalável pesada
        const multaOuro = this.contadorAbuso * 100;
        this.state.gold = Math.max(0, this.state.gold - multaOuro);
        
        this.bloqueadoPorAbuso = true;
        
        this.aplicarPunicaoPesada(`🚨 PUNIÇÃO SEVERA VANGUARD [Exploit Detectado]: ${motivo}. Sistema travou suas ações por 10 segundos e aplicou multa de ${multaOuro} 🪙.`);
        
        setTimeout(() => {
            this.bloqueadoPorAbuso = false;
        }, 10000); // 10 segundos de banimento temporário de ações

        atualizarUI();
    }

    aplicarPunicaoPesada(mensagem) {
        // Dano real nos status do jogador
        this.state.stats.hp = Math.max(1, this.state.stats.hp - Math.floor(this.state.stats.maxHp * 0.15));
        
        // Dispara aviso no chat da sala
        if (this.state.roomName && this.db) {
            const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
            import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ push }) => {
                push(chatRef, {
                    sender: "🛡️ VANGUARD (Sistema)",
                    text: `<span style="color: #ff3333; font-weight: bold;">${mensagem}</span>`,
                    type: "system",
                    time: Date.now()
                });
            });
        }

        // Alerta visual na tela do jogador
        const alerta = document.createElement('div');
        alerta.style.cssText = "position:fixed; top:20%; left:50%; transform:translate(-50%,-50%); background:rgba(255,0,0,0.85); color:#fff; padding:15px; border-radius:8px; font-weight:bold; z-index:9999; text-align:center;";
        alerta.innerText = mensagem;
        document.body.appendChild(alerta);
        setTimeout(() => alerta.remove(), 4000);

        atualizarUI();
    }

    // ==========================================
    // 5. ESCALONAMENTO DE DIFICULDADE POR MULTIPLAYER
    // ==========================================
    escalonarDificuldadePorPlayers() {
        if (!this.state.roomName || !this.db) return;

        const roomRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const totalPlayers = Object.keys(snapshot.val()).length;
                
                // Se houver mais de 1 player na sala, o Vanguard aumenta a dificuldade global
                if (totalPlayers > 1) {
                    const multiplicadorDificuldade = 1 + (totalPlayers * 0.25);
                    // Aplica peso na resistência dos monstros/torres simuladas
                    this.state.dificuldadeMundo = multiplicadorDificuldade;
                    console.log(`🛡️ Vanguard: Sala com ${totalPlayers} jogadores. Dificuldade escalonada em x${multiplicadorDificuldade.toFixed(2)}.`);
                }
            }
        });
    }

    // ==========================================
    // 6. MINI-MAPA DE POSIÇÕES EM TEMPO REAL
    // ==========================================
    iniciarRadarMiniMapa() {
        if (!this.state.roomName || !this.db) return;

        // Atualiza a posição do jogador atual no Firebase a cada 3 segundos
        const playerPosRef = ref(this.db, `rooms/${this.state.roomName}/radar/${this.state.playerName}`);
        
        setInterval(() => {
            if (this.state.lane && this.state.stats.hp > 0) {
                import("https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js").then(({ set }) => {
                    set(playerPosRef, {
                        lane: this.state.lane,
                        nivel: this.state.level,
                        vivo: this.state.stats.hp > 0,
                        timestamp: Date.now()
                    });
                });
            }
        }, 3000);

        // Renderiza o mini-mapa no painel se ele existir
        this.criarMiniMapaUI();
    }

    criarMiniMapaUI() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || document.getElementById('vanguard-minimap')) return;

        const mapDiv = document.createElement('div');
        mapDiv.id = 'vanguard-minimap';
        mapDiv.style.cssText = "position:absolute; top:10px; right:10px; width:160px; height:100px; background:rgba(0,0,0,0.8); border:1px solid var(--ouro-antigo); padding:5px; font-size:0.7rem; color:#fff; z-index:100; border-radius:4px;";
        mapDiv.innerHTML = `<div style="color:var(--ouro-brilhante); font-weight:bold; margin-bottom:4px;">🗺️ Radar Vanguard</div><div id="radar-content">Sincronizando posições...</div>`;
        gameScreen.appendChild(mapDiv);

        // Ouve o radar de todos na sala
        const radarRef = ref(this.db, `rooms/${this.state.roomName}/radar`);
        onValue(radarRef, (snapshot) => {
            const content = document.getElementById('radar-content');
            if (!content) return;

            if (snapshot.exists()) {
                let html = "";
                snapshot.forEach((child) => {
                    const data = child.val();
                    const nome = child.key;
                    html += `<div>• <strong>${nome}</strong>: <span style="color:#00ff00;">${data.lane}</span> (Nv.${data.nivel})</div>`;
                });
                content.innerHTML = html;
            }
        });
    }

    // ==========================================
    // 7. INCENTIVO À MOVIMENTAÇÃO (BUFFS ALEATÓRIOS)
    // ==========================================
    iniciarGeradorDeBuffsAleatorios() {
        // A cada 45 segundos, o Vanguard lança um "Card de Oportunidade" aleatório no mapa
        setInterval(() => {
            if (this.state.stats.hp <= 0) return;

            this.dispararEventoColetaBuff();
        }, 45000);
    }

    dispararEventoColetaBuff() {
        const notification = document.createElement('div');
        notification.style.cssText = "position:fixed; bottom:20px; right:20px; background:linear-gradient(135deg, #b8860b, #ffd700); color:#000; padding:12px; border-radius:6px; font-weight:bold; z-index:9999; box-shadow:0 0 15px rgba(255,215,0,0.5); cursor:pointer; animation: bounceIn 0.5s;";
        
        notification.innerHTML = `
            <div>🎁 SUPRIMENTO VANGUARD DISPONÍVEL!</div>
            <div style="font-size:0.75rem; font-weight:normal; margin-top:2px;">Clique rápido para coletar o Bônus de Ouro/XP!</div>
        `;

        // Mini-game de reflexo para pegar o bônus
        let coletado = false;
        notification.addEventListener('click', () => {
            if (coletado) return;
            coletado = true;

            const recompensaOuro = Math.floor(150 + (this.state.level * 25));
            this.state.gold += recompensaOuro;
            
            notification.style.background = "#00ff00";
            notification.innerHTML = `✅ Coletado com Sucesso! +${recompensaOuro} 🪙`;
            setTimeout(() => notification.remove(), 2000);
            atualizarUI();
        });

        document.body.appendChild(notification);

        // Se o player ignorar por 6 segundos, o item some
        setTimeout(() => {
            if (!coletado) {
                notification.remove();
            }
        }, 6000);
    }
}
