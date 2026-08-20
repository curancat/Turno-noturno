// ==========================================
// VANGUARD: SISTEMA DE SEGURANÇA, EVENTOS E ARBITRAGEM
// ==========================================
import { ref, onValue, push, set } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "./app.js";

export default class Vanguard {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        // Rastreamento e Cooldowns
        this.tempoInativo = 0;
        this.limiteAFK = 20; // Segundos permitidos na mesma rota sem ação
        this.ultimoFarm = 0;
        this.cooldownFarmMs = 2500; // 2.5s de recarga entre farms
        
        // Anti-Abuso
        this.bloqueado = false;
        this.registroAcoes = [];
        
        // Sistema de Dificuldade
        this.multiplicadorDificuldade = 1;
    }

    iniciar() {
        console.log("🛡️ VANGUARD: Iniciando auditoria do sistema...");
        this.auditoriaDeArquivos();
        this.forcarLimpezaLayout();
        this.iniciarRadarMiniMapa();
        this.iniciarAntiAFK();
        this.escalonarDificuldade();
        this.iniciarEventosJungle();
        this.iniciarDropDeBuffs();
    }

    // ==========================================
    // 1. AUDITORIA E LIMPEZA DE LAYOUT (LITLEGOT & UI)
    // ==========================================
    auditoriaDeArquivos() {
        // Conversa com os arquivos verificando variáveis globais
        if (!this.state || !this.db) {
            console.error("💀 VANGUARD ERRO CRÍTICO: GameState ou Database ausentes!");
            return;
        }
        setInterval(() => {
            if (this.state.stats.hp > this.state.stats.maxHp) this.state.stats.hp = this.state.stats.maxHp;
            if (isNaN(this.state.gold)) this.state.gold = 0;
        }, 5000);
        console.log("🛡️ VANGUARD: Arquivos sincronizados e íntegros.");
    }

    forcarLimpezaLayout() {
        setInterval(() => {
            // Remove botões velhos do Litlegot ou de farms antigos
            const lixosVisuais = document.querySelectorAll('.old-btn, [id^="btn-antigo"], .deprecated-skill');
            lixosVisuais.forEach(el => el.remove());

            // Garante que containers não quebrem a tela
            const painel = document.querySelector('.skills-controls');
            if (painel) painel.style.display = 'flex';
        }, 3000);
    }

    // ==========================================
    // 2. SISTEMA DE FARM COM COOLDOWN E MESMA ROTA
    // ==========================================
    podeFarmar() {
        const agora = Date.now();
        if (agora - this.ultimoFarm < this.cooldownFarmMs) {
            this.animacaoAviso("Mecânica em Recarga! Não flode o sistema.");
            return false;
        }
        
        if (this.state.lane === "Base") {
            this.animacaoAviso("Não há o que farmar na Base!");
            return false;
        }

        this.ultimoFarm = agora;
        return true;
    }

    // ==========================================
    // 3. EVENTOS DINÂMICOS DE JUNGLE (JG)
    // ==========================================
    iniciarEventosJungle() {
        const rotas = ["Rota Topo", "Rota Meio", "Rota Fundo"];
        
        setInterval(() => {
            if (Math.random() > 0.7) return; // 30% de chance de spawn a cada intervalo

            const rotaSorteada = rotas[Math.floor(Math.random() * rotas.length)];
            this.anunciarEventoGlobal(`🌲 UM MONSTRO DA SELVA (JG) INVADIU A [${rotaSorteada}]!`);

            // Se o player estiver na rota, ele vê o botão de caça
            if (this.state.lane === rotaSorteada) {
                this.spawnarBotaoJungle();
            }
        }, 40000); // Tenta spawnar a cada 40 segundos
    }

    spawnarBotaoJungle() {
        if (document.getElementById('jungle-event-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'jungle-event-btn';
        btn.innerText = "⚔️ Abater Monstro (JG)";
        btn.style.cssText = "background: darkgreen; color: white; padding: 15px; border: 2px solid lime; font-weight: bold; width: 100%; margin-top: 10px; cursor: pointer; animation: pulse 1s infinite;";
        
        btn.onclick = () => {
            const ouroGanhado = Math.floor(200 * this.multiplicadorDificuldade);
            this.state.gold += ouroGanhado;
            this.animacaoAviso(`Monstro abatido! +${ouroGanhado} 🪙`);
            btn.remove();
            atualizarUI();
        };

        const controles = document.querySelector('.game-controls') || document.body;
        controles.appendChild(btn);

        // O monstro foge após 10 segundos
        setTimeout(() => { if (btn.parentNode) btn.remove(); }, 10000);
    }

    // ==========================================
    // 4. BLOQUEIO DE ATAQUES (BASE / VISÃO / ROTA)
    // ==========================================
    validarAtaque(alvoNome, alvoLane, temVisao) {
        if (this.state.lane === "Base") {
            this.aplicarPunicaoPesada("TENTATIVA DE ATAQUE DA BASE (SNIPER COVARDE).");
            return false;
        }
        if (alvoLane && alvoLane !== this.state.lane) {
            this.animacaoAviso("O alvo não está na sua rota!");
            return false;
        }
        if (!temVisao) {
            this.animacaoAviso("Você não tem visão deste alvo!");
            return false;
        }
        return true;
    }

    // ==========================================
    // 5. ANTI-AFK, MOVIMENTAÇÃO E PUNIÇÕES SEVERAS
    // ==========================================
    iniciarAntiAFK() {
        let rotaAnterior = this.state.lane;

        setInterval(() => {
            if (this.state.lane === "Base" || this.state.stats.hp <= 0) return;

            if (this.state.lane === rotaAnterior) {
                this.tempoInativo++;
            } else {
                this.tempoInativo = 0; // Resetou mudando de rota
                rotaAnterior = this.state.lane;
            }

            if (this.tempoInativo >= this.limiteAFK) {
                this.aplicarPunicaoPesada("ESTAGNAÇÃO AFK DETECTADA.");
                this.tempoInativo = 0;
            }
        }, 1000);
    }

    registrarAbusoHabilidade() {
        const agora = Date.now();
        this.registroAcoes = this.registroAcoes.filter(tempo => agora - tempo < 2000);
        this.registroAcoes.push(agora);

        // Se usar mais de 5 habilidades em 2 segundos = Exploit/Macro
        if (this.registroAcoes.length >= 5) {
            this.aplicarPunicaoPesada("ABUSO DE MECÂNICA (SPAM) DETECTADO.");
            this.registroAcoes = [];
        }
    }

    aplicarPunicaoPesada(motivo) {
        if (this.bloqueado) return;
        this.bloqueado = true;

        // PUNIÇÃO: -50% de HP Atual e Zera o Ouro!
        const dano = Math.floor(this.state.stats.hp * 0.5);
        this.state.stats.hp -= dano;
        if (this.state.stats.hp < 1) this.state.stats.hp = 1;
        this.state.gold = 0; 
        
        // Aplica Silence (Impede cliques)
        document.body.style.pointerEvents = "none";
        document.body.style.filter = "grayscale(100%)";

        const tela = document.createElement('div');
        tela.style.cssText = "position:fixed; top:0; left:0; width:100vw; height:100vh; background:rgba(255,0,0,0.4); display:flex; justify-content:center; align-items:center; color:white; font-size:2rem; font-weight:bold; z-index:9999; text-align:center; flex-direction:column;";
        tela.innerHTML = `<div>🚨 PUNIÇÃO VANGUARD 🚨</div><div style="font-size:1rem; margin-top:10px;">${motivo}<br>Ouro zerado. 50% HP drenado. Bloqueado por 5s.</div>`;
        document.body.appendChild(tela);

        this.anunciarEventoGlobal(`O sistema Vanguard puniu ${this.state.playerName} por quebra de regras!`);
        atualizarUI();

        setTimeout(() => {
            this.bloqueado = false;
            document.body.style.pointerEvents = "auto";
            document.body.style.filter = "none";
            tela.remove();
        }, 5000);
    }

    // ==========================================
    // 6. MINIGAME DE BUFF E INCENTIVO AO MOVIMENTO
    // ==========================================
    iniciarDropDeBuffs() {
        setInterval(() => {
            if (this.state.stats.hp <= 0) return;
            this.criarMinigameBuff();
        }, 60000); // 1 minuto
    }

    criarMinigameBuff() {
        const buff = document.createElement('div');
        buff.innerText = "⭐ CAPTURE!";
        buff.style.cssText = `position:fixed; top:${Math.random() * 80}vh; left:${Math.random() * 80}vw; background:gold; color:black; padding:10px; border-radius:50%; font-weight:bold; cursor:pointer; z-index:9000; box-shadow: 0 0 10px gold; transition: all 0.3s;`;
        
        // Minigame: Ele foge do mouse!
        buff.onmouseenter = () => {
            buff.style.top = `${Math.random() * 80}vh`;
            buff.style.left = `${Math.random() * 80}vw`;
        };

        buff.onclick = () => {
            this.state.stats.ad += 20;
            this.animacaoAviso("Buff Coletado! +20 Dano por 15s!");
            setTimeout(() => { this.state.stats.ad -= 20; atualizarUI(); }, 15000);
            buff.remove();
            atualizarUI();
        };

        document.body.appendChild(buff);
        setTimeout(() => { if (buff.parentNode) buff.remove(); }, 8000);
    }

    // ==========================================
    // 7. MULTIPLAYER DIFICULDADE E RADAR
    // ==========================================
    escalonarDificuldade() {
        if (!this.state.roomName) return;
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        onValue(playersRef, (snap) => {
            if (snap.exists()) {
                const qtd = Object.keys(snap.val()).length;
                this.multiplicadorDificuldade = 1 + (qtd * 0.3); // +30% diff por player
            }
        });
    }

    iniciarRadarMiniMapa() {
        const radarDiv = document.createElement('div');
        radarDiv.id = "mini-mapa";
        radarDiv.style.cssText = "position:fixed; top:10px; left:10px; width:200px; background:rgba(0,0,0,0.8); border:1px solid lime; padding:10px; color:white; z-index:100; font-size:0.8rem;";
        radarDiv.innerHTML = `<strong>📡 Radar Vanguard</strong><div id="radar-lista">Carregando posições...</div>`;
        document.body.appendChild(radarDiv);

        if (!this.state.roomName) return;

        // Atualiza a própria posição
        setInterval(() => {
            set(ref(this.db, `rooms/${this.state.roomName}/radar/${this.state.playerName}`), { lane: this.state.lane });
        }, 2000);

        // Lê os outros
        onValue(ref(this.db, `rooms/${this.state.roomName}/radar`), (snap) => {
            const lista = document.getElementById('radar-lista');
            if (!lista || !snap.exists()) return;
            lista.innerHTML = "";
            snap.forEach(child => {
                const pName = child.key;
                const pData = child.val();
                let cor = pName === this.state.playerName ? "lime" : "red";
                lista.innerHTML += `<div style="color:${cor}">${pName} - [${pData.lane}]</div>`;
            });
        });
    }

    // Utilitários Visuais
    animacaoAviso(msg) {
        const div = document.createElement('div');
        div.innerText = msg;
        div.style.cssText = "position:fixed; top:15%; left:50%; transform:translateX(-50%); background:#333; color:yellow; padding:10px; border-radius:5px; z-index:9999;";
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }

    anunciarEventoGlobal(texto) {
        if (!this.state.roomName) return;
        push(ref(this.db, `rooms/${this.state.roomName}/chat`), {
            sender: "👑 VANGUARD",
            text: `<span style="color: gold; font-weight: bold;">${texto}</span>`,
            type: "system",
            time: Date.now()
        });
    }
}
