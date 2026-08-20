// ==========================================
// VANGUARD: JUIZ, ANTI-CHEAT E DIRETOR DA PARTIDA
// ==========================================
import { ref, update, onValue, get, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "./app.js";

export default class Vanguard {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        // Controles de Tempo e Abuso
        this.ultimoFarm = 0;
        this.cooldownFarm = 2500; // 2.5 segundos de recarga no farm base
        this.tempoAFK = 0;
        this.historicoHabilidades = [];
        this.cooldownPunicao = false;
        
        // Dificuldade e Estado
        this.dificuldadeGlobal = 1;
        this.arquivosInteiros = false;
    }

    iniciar() {
        console.log("🛡️ VANGUARD ONLINE: Iniciando varredura de integridade...");
        this.conversarComArquivos();
        
        if (this.arquivosInteiros) {
            this.forcarOrganizacaoLayout();
            this.iniciarRadarAvancado();
            this.escalonarDificuldadeDinamicamente();
            this.injetarNovosMetodosFarm();
            this.monitorarAFKeMovimento();
            this.iniciarIncentivosDeMovimento();
        }
    }

    // ==========================================
    // 1. CONVERSA COM OS ARQUIVOS (HEALTH CHECK)
    // ==========================================
    conversarComArquivos() {
        // Verifica se os objetos essenciais existem antes de liberar o jogo
        if (!this.state || !this.db) {
            console.error("⛔ VANGUARD FALHA: GameState ou Banco de Dados ausentes.");
            return;
        }
        if (typeof atualizarUI !== "function") {
            console.error("⛔ VANGUARD FALHA: Função atualizarUI não encontrada no app.js.");
            return;
        }
        
        console.log("✅ VANGUARD: Todos os sistemas vitais respondendo. Partida autorizada.");
        this.arquivosInteiros = true;
    }

    // ==========================================
    // 2. ORGANIZAÇÃO DE LAYOUT (LIMPEZA DO LITLEGOT)
    // ==========================================
    forcarOrganizacaoLayout() {
        // Remove botões antigos e bugs visuais, especialmente do Litlegot
        const elementosCorrompidos = document.querySelectorAll('.old-version-btn, .bug-btn, #btn-litlegot-antigo, [data-deprecated]');
        elementosCorrompidos.forEach(el => el.remove());

        // Força os painéis a ficarem organizados
        const paineis = document.querySelectorAll('.skills-controls, .action-panel');
        paineis.forEach(panel => {
            panel.style.display = 'grid';
            panel.style.gridTemplateColumns = 'repeat(auto-fit, minmax(120px, 1fr))';
            panel.style.gap = '10px';
            panel.style.padding = '10px';
        });
    }

    // ==========================================
    // 3. REGRAS DE COMBATE (VISÃO E ROTA)
    // ==========================================
    validarAtaque(alvo, rotaDoAlvo, temVisao) {
        if (this.state.lane === "Base") {
            this.punirJogador("Covardia detectada! Ataques a partir da Base são estritamente proibidos.");
            return false;
        }

        if (this.state.lane !== rotaDoAlvo) {
            this.punirJogador(`Fora de alcance! Você está na [${this.state.lane}] e o inimigo na [${rotaDoAlvo}].`);
            return false;
        }

        if (!temVisao) {
            this.punirJogador("Ataque no escuro bloqueado! Você não tem visão deste alvo.");
            return false;
        }

        return true;
    }

    // ==========================================
    // 4. ANTI-ABUSO (PUNIÇÃO PESADA) E COOLDOWN
    // ==========================================
    registrarUsoHabilidade(nomeSkill) {
        if (this.cooldownPunicao) {
            this.animacaoVanguard("Ação bloqueada! Cumpra sua punição.");
            return false;
        }

        const agora = Date.now();
        this.historicoHabilidades.push(agora);

        // Limpa o histórico mais velho que 3 segundos
        this.historicoHabilidades = this.historicoHabilidades.filter(tempo => agora - tempo < 3000);

        // Se usar mais de 5 habilidades em 3 segundos (Spam/Macro/Bug do Litlegot)
        if (this.historicoHabilidades.length > 5) {
            this.aplicarPunicaoPesada("Abuso de Mecânica (Spam) Detectado!");
            this.historicoHabilidades = [];
            return false;
        }
        return true;
    }

    aplicarPunicaoPesada(motivo) {
        this.cooldownPunicao = true;
        
        // Punição: Drena 30% da Vida Máxima e zera o Ouro
        const danoPunicao = Math.floor(this.state.stats.maxHp * 0.3);
        this.state.stats.hp = Math.max(1, this.state.stats.hp - danoPunicao);
        const ouroPerdido = this.state.gold;
        this.state.gold = 0;

        this.animacaoVanguard(`🚨 JULGAMENTO VANGUARD 🚨\n${motivo}\nPenalidade: -${danoPunicao} HP, -${ouroPerdido} Ouro e Bloqueio de 10s.`);

        setTimeout(() => {
            this.cooldownPunicao = false;
            this.animacaoVanguard("Bloqueio Vanguard removido. Jogue limpo.");
        }, 10000); // 10 segundos de silêncio absoluto
        
        atualizarUI();
    }

    // ==========================================
    // 5. SISTEMA DE FARM DINÂMICO E RECARGA
    // ==========================================
    podeFarmar() {
        const agora = Date.now();
        if (agora - this.ultimoFarm < this.cooldownFarm) {
            this.animacaoVanguard("Calma! Tempo de recarga do Farm ativo.", "#ffaa00");
            return false;
        }
        this.ultimoFarm = agora;
        this.tempoAFK = 0; // Reset do AFK
        return true;
    }

    injetarNovosMetodosFarm() {
        const container = document.querySelector('.farm-controls') || document.getElementById('game-screen');
        if (!container) return;

        const btnCaçada = document.createElement('button');
        btnCaçada.className = 'btn-farm-extra';
        btnCaçada.style.cssText = "background: #2a0845; color: #fff; padding: 10px; border: 1px solid #9932CC; margin-top: 10px; width: 100%; font-weight:bold;";
        btnCaçada.innerText = "🗡️ Caçada de Risco (Alto Retorno, Risco de Dano)";
        
        btnCaçada.addEventListener('click', () => {
            if (!this.podeFarmar()) return;
            
            const sucesso = Math.random() > 0.4; // 60% de chance de dar bom
            if (sucesso) {
                const recompensa = Math.floor((50 * this.dificuldadeGlobal) + (this.state.level * 10));
                this.state.gold += recompensa;
                this.animacaoVanguard(`Caçada bem sucedida: +${recompensa} Ouro!`, "#00ff00");
            } else {
                const dano = Math.floor(this.state.stats.maxHp * 0.1);
                this.state.stats.hp -= dano;
                this.animacaoVanguard(`A caça virou o caçador! -${dano} HP.`, "#ff0000");
            }
            atualizarUI();
        });

        container.appendChild(btnCaçada);
    }

    // ==========================================
    // 6. ANTI-AFK IMPLACÁVEL
    // ==========================================
    monitorarAFKeMovimento() {
        setInterval(() => {
            if (this.state.lane === "Base" || this.state.stats.hp <= 0) return; // Base é segura
            
            this.tempoAFK++;
            if (this.tempoAFK > 20) { // 20 segundos parado na Rota
                this.punirJogador("Estagnação Detectada! Movimente-se ou volte para a base.");
                this.tempoAFK = 0;
            }
        }, 1000);

        // Ouve movimento real (troca de lane reseta o timer extra)
        document.getElementById('lane-selector')?.addEventListener('change', () => {
            this.tempoAFK = 0;
        });
    }

    punirJogador(mensagem) {
        this.state.stats.hp -= Math.floor(this.state.stats.maxHp * 0.05);
        this.animacaoVanguard(`⚠️ ALERTA VANGUARD: ${mensagem}`);
        atualizarUI();
    }

    // ==========================================
    // 7. INCENTIVOS DE MOVIMENTO (MINIGAME)
    // ==========================================
    iniciarIncentivosDeMovimento() {
        setInterval(() => {
            if (this.state.lane === "Base" || this.state.stats.hp <= 0) return;
            // 30% de chance de spawnar um buff a cada 30 segundos
            if (Math.random() <= 0.3) this.spawnarMinigameDeBuff();
        }, 30000);
    }

    spawnarMinigameDeBuff() {
        const buffDiv = document.createElement('div');
        buffDiv.style.cssText = `position:fixed; top:${Math.random() * 60 + 20}%; left:${Math.random() * 60 + 20}%; background:#ffd700; color:#000; padding:15px; border-radius:50%; font-weight:bold; cursor:pointer; box-shadow:0 0 20px #ffd700; z-index:10000; transition: transform 0.2s;`;
        buffDiv.innerText = "⭐ PEGUE O BUFF!";
        
        let clicado = false;
        buffDiv.addEventListener('click', () => {
            if (clicado) return;
            clicado = true;
            buffDiv.innerText = "RESOLVA: 7 x 8 = ?";
            buffDiv.style.borderRadius = "5px";
            
            const input = document.createElement('input');
            input.type = "number";
            input.style.width = "50px";
            input.style.marginLeft = "10px";
            buffDiv.appendChild(input);

            input.focus();
            input.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    if (input.value == "56") {
                        this.state.stats.ad += 20;
                        this.state.gold += 200;
                        this.animacaoVanguard("Resposta Exata! +20 AD e +200 Ouro!", "#00ff00");
                        atualizarUI();
                    } else {
                        this.animacaoVanguard("Errou o cálculo! O buff desvaneceu.", "#ff0000");
                    }
                    buffDiv.remove();
                }
            });
        });

        document.body.appendChild(buffDiv);
        setTimeout(() => { if (!clicado) buffDiv.remove(); }, 5000); // Some em 5s se ignorado
    }

    // ==========================================
    // 8. ESCALONAMENTO DE DIFICULDADE (MULTIPLAYER)
    // ==========================================
    escalonarDificuldadeDinamicamente() {
        if (!this.state.roomName) return;
        const roomRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        
        onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const numPlayers = Object.keys(snapshot.val()).length;
                // A cada player extra, o jogo fica 30% mais difícil
                this.dificuldadeGlobal = 1 + (numPlayers * 0.3);
                console.log(`[Vanguard] Dificuldade ajustada para: x${this.dificuldadeGlobal.toFixed(2)}`);
            }
        });
    }

    // ==========================================
    // 9. MINI-MAPA DE JOGADORES (INIMIGOS E ALIADOS)
    // ==========================================
    iniciarRadarAvancado() {
        if (!this.state.roomName) return;

        const mapContainer = document.createElement('div');
        mapContainer.id = "vanguard-map";
        mapContainer.style.cssText = "position:fixed; top:10px; right:10px; width:200px; background:rgba(0,0,0,0.9); border:2px solid #555; border-radius:8px; padding:10px; color:#fff; font-size:0.8rem; z-index:9000;";
        mapContainer.innerHTML = `<h4 style="margin:0 0 10px 0; color:#00ffcc; text-align:center;">📡 Radar Vanguard</h4><div id="map-players"></div>`;
        document.body.appendChild(mapContainer);

        const radarRef = ref(this.db, `rooms/${this.state.roomName}/radar`);
        
        // Atualiza a própria posição no Firebase
        setInterval(() => {
            set(ref(this.db, `rooms/${this.state.roomName}/radar/${this.state.playerName}`), {
                lane: this.state.lane,
                hp: this.state.stats.hp,
                isAlly: true // Lógica simples; no futuro você pode separar times
            });
        }, 2000);

        // Lê a posição de todos
        onValue(radarRef, (snapshot) => {
            const list = document.getElementById('map-players');
            if (!list) return;
            
            if (snapshot.exists()) {
                list.innerHTML = "";
                snapshot.forEach(child => {
                    const dados = child.val();
                    const nome = child.key;
                    const cor = dados.hp > 0 ? "#00ff00" : "#ff0000";
                    list.innerHTML += `<div style="margin-bottom:5px; border-bottom:1px solid #333;">
                        <span style="color:${cor};">●</span> <strong>${nome}</strong><br>
                        <span style="color:#aaa; font-size:0.7rem;">📍 ${dados.lane}</span>
                    </div>`;
                });
            }
        });
    }

    // ==========================================
    // UTILITÁRIO: ANIMAÇÃO DE TEXTO DO VANGUARD
    // ==========================================
    animacaoVanguard(texto, cor = "#ff3333") {
        const alerta = document.createElement('div');
        alerta.style.cssText = `position:fixed; top:15%; left:50%; transform:translateX(-50%); background:rgba(0,0,0,0.8); color:${cor}; padding:15px 30px; border:2px solid ${cor}; border-radius:5px; font-weight:bold; font-size:1.2rem; text-align:center; z-index:99999; box-shadow:0 0 20px ${cor}; text-transform:uppercase;`;
        alerta.innerText = texto;
        document.body.appendChild(alerta);
        
        setTimeout(() => alerta.remove(), 4000);
    }
}
