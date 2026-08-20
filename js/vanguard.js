// ==========================================
// VANGUARD: O ÁRBITRO E MESTRE DO RIFT RPG
// ==========================================
import { ref, onValue, set, push, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "./app.js";

export default class Vanguard {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        // Controles de Tempo e Abuso
        this.ultimaLane = this.state.lane || "Base";
        this.tempoNaMesmaLane = 0;
        this.limiteAFK = 30; // 30s na mesma lane farmando gera punição
        this.registroAcoes = {}; // Anti-spam
        
        // Cooldowns Globais
        this.cooldownFarm = false;
        
        // Rotas Possíveis
        this.rotasValidas = ["Top", "Mid", "Bot"];
    }

    iniciar() {
        console.log("🛡️ VANGUARD: Inicializando protocolos absolutos.");
        this.forcarPartidaRPG();
        this.limparLayoutObsoleto();
        this.escalonarDificuldade();
        this.criarMiniMapaPopup();
        this.monitorarMovimentacaoEAFK();
        this.iniciarSistemaJungle();
        this.iniciarIncentivosDeMovimento();
        
        // Sincroniza presença no radar a cada 2 segundos
        setInterval(() => this.atualizarRadar(), 2000);
    }

    // ==========================================
    // 1. FORÇAR PARTIDA RPG E ORGANIZAÇÃO DE UI
    // ==========================================
    forcarPartidaRPG() {
        if (!this.state.roomName) return;
        
        // Garante que atributos base de RPG existam e estejam zerados/prontos
        this.state.dificuldadeMundo = 1;
        if (!this.state.stats) this.state.stats = { hp: 100, maxHp: 100, mana: 50, maxMana: 50, ad: 10, ap: 10, def: 5, mdef: 5, ms: 300 };
        
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: "🛡️ VANGUARD (Mestre)",
            text: `<strong style="color:#ffd700;">A PARTIDA RPG COMEÇOU!</strong> Regras ativas: Movimentem-se, cacem monstros na Jungle e não ataquem da base. A dificuldade se ajustará ao número de guerreiros.`,
            type: "system",
            time: Date.now()
        });
    }

    limparLayoutObsoleto() {
        // Remove botões fantasmas e versões antigas (ex: litlegot sem câmera/bugado)
        document.querySelectorAll('.old-version-btn, .deprecated, [id^="old-skill"]').forEach(el => el.remove());

        // Otimização Estrutural: Força o site a usar apenas UMA tabela central para UI/Status
        const tabelas = document.querySelectorAll('table');
        if (tabelas.length > 1) {
            const tabelaPrincipal = tabelas[0];
            tabelaPrincipal.classList.add('vanguard-single-table');
            
            for (let i = 1; i < tabelas.length; i++) {
                const linhas = tabelas[i].querySelectorAll('tr');
                linhas.forEach(linha => tabelaPrincipal.appendChild(linha));
                tabelas[i].remove(); // Destrói tabelas sobressalentes
            }
            console.log("🛡️ VANGUARD: Múltiplas tabelas detectadas. Estrutura fundida em uma única tabela para otimização visual.");
        }

        // Garante responsividade básica
        document.body.style.overflowX = 'hidden';
    }

    // ==========================================
    // 2. MINI-MAPA COMPACTADO (POP-UP)
    // ==========================================
    criarMiniMapaPopup() {
        const btnRadar = document.createElement('button');
        btnRadar.innerHTML = "🗺️ Radar";
        btnRadar.style.cssText = "position:fixed; top:10px; right:10px; padding:8px 15px; background:#1a1a2e; color:#00ff00; border:2px solid #00ff00; border-radius:8px; font-weight:bold; z-index:9000; cursor:pointer;";
        document.body.appendChild(btnRadar);

        const popup = document.createElement('div');
        popup.id = 'vanguard-minimap-popup';
        popup.style.cssText = "display:none; position:fixed; top:50px; right:10px; width:220px; background:rgba(10,10,20,0.95); border:2px solid #00ff00; border-radius:8px; padding:10px; color:#fff; z-index:9001; box-shadow:0 0 15px #00ff00;";
        document.body.appendChild(popup);

        btnRadar.addEventListener('click', () => {
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });

        // Ouve dados do Firebase
        if (this.state.roomName) {
            const radarRef = ref(this.db, `rooms/${this.state.roomName}/radar`);
            onValue(radarRef, (snapshot) => {
                if (snapshot.exists() && popup.style.display === 'block') {
                    let html = "<h4 style='margin:0 0 10px 0; color:#00ff00; border-bottom:1px solid #333; padding-bottom:5px;'>Posições do Rift</h4>";
                    snapshot.forEach(child => {
                        const player = child.val();
                        const color = player.hp > 0 ? "#fff" : "#ff3333";
                        html += `<div style="font-size:0.85rem; margin-bottom:5px; color:${color};">
                            <strong>${child.key}</strong>: ${player.lane} ${player.hp <= 0 ? '(Morto)' : ''}
                        </div>`;
                    });
                    popup.innerHTML = html;
                }
            });
        }
    }

    atualizarRadar() {
        if (!this.state.roomName || !this.state.playerName) return;
        const playerPosRef = ref(this.db, `rooms/${this.state.roomName}/radar/${this.state.playerName}`);
        set(playerPosRef, {
            lane: this.state.lane,
            hp: this.state.stats.hp,
            timestamp: Date.now()
        });
    }

    // ==========================================
    // 3. DIFICULDADE DINÂMICA (MULTIPLAYER SCALING)
    // ==========================================
    escalonarDificuldade() {
        if (!this.state.roomName) return;
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        onValue(playersRef, (snapshot) => {
            if (snapshot.exists()) {
                const numPlayers = Object.keys(snapshot.val()).length;
                // A cada jogador, a dificuldade do mundo (HP de monstros, dano de torres) sobe 40%
                this.state.dificuldadeMundo = 1 + ((numPlayers - 1) * 0.4);
            }
        });
    }

    // ==========================================
    // 4. BLOQUEIO DE ATAQUES E VISÃO
    // ==========================================
    validarAtaque(alvo, laneAlvo, temVisao = false) {
        if (this.state.lane === "Base") {
            this.aplicarPunicaoPesada("TENTATIVA DE ATAQUE DA BASE! Covardia não é tolerada.");
            return false;
        }

        if (laneAlvo && laneAlvo !== this.state.lane) {
            this.aplicarPunicaoPesada(`TENTATIVA DE ATAQUE TRANS-ROTA! O alvo está no ${laneAlvo} e você no ${this.state.lane}.`);
            return false;
        }

        if (alvo.includes("Oculto") && !temVisao) {
            this.aplicarPunicaoPesada("TENTATIVA DE ATAQUE SEM VISÃO! Você atacou as sombras e perdeu o equilíbrio.");
            return false;
        }

        return true;
    }

    // ==========================================
    // 5. ANTI-SPAM, FARM COOLDOWN E PUNIÇÃO PESADA
    // ==========================================
    registrarUsoMecanica(mecanicaId) {
        const agora = Date.now();
        if (!this.registroAcoes[mecanicaId]) {
            this.registroAcoes[mecanicaId] = { contagem: 1, ultimoUso: agora };
            return true;
        }

        const tempoDecorrido = agora - this.registroAcoes[mecanicaId].ultimoUso;
        
        // Se usar a mesma habilidade ou criar item num intervalo menor que 800ms
        if (tempoDecorrido < 800) {
            this.registroAcoes[mecanicaId].contagem++;
            if (this.registroAcoes[mecanicaId].contagem >= 4) {
                this.aplicarPunicaoPesada(`ABUSO DE MECÂNICA DETECTADO (${mecanicaId})! Sobrecarga de comandos.`);
                this.registroAcoes[mecanicaId].contagem = 0; // reseta após punir
                return false;
            }
        } else {
            this.registroAcoes[mecanicaId].contagem = 1;
        }
        
        this.registroAcoes[mecanicaId].ultimoUso = agora;
        return true;
    }

    executarFarmControlado(funcaoFarmOriginal) {
        if (this.cooldownFarm) {
            this.animacaoTextoFlutuante("Farm em Recarga!", "red");
            return;
        }
        
        // Aplica o farm
        funcaoFarmOriginal();
        
        // Trava o farm por 2 segundos
        this.cooldownFarm = true;
        setTimeout(() => { this.cooldownFarm = false; }, 2000);
    }

    aplicarPunicaoPesada(motivo) {
        // Punição Severa: Zera Ouro, deixa com 1 HP e trava ações por 5s
        this.state.gold = 0;
        this.state.stats.hp = 1;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(255,0,0,0.8); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:monospace;";
        overlay.innerHTML = `
            <h1 style="font-size:3rem; margin:0;">PUNIÇÃO VANGUARD</h1>
            <p style="font-size:1.5rem;">${motivo}</p>
            <p>Ouro drenado. Vida reduzida a 1. Sistema travado.</p>
        `;
        document.body.appendChild(overlay);

        // Bloqueia cliques
        const blockEvent = (e) => { e.stopPropagation(); e.preventDefault(); };
        window.addEventListener('click', blockEvent, true);
        
        setTimeout(() => {
            overlay.remove();
            window.removeEventListener('click', blockEvent, true);
        }, 5000);

        atualizarUI();
    }

    // ==========================================
    // 6. SISTEMA JUNGLE: EVENTOS ALEATÓRIOS NAS ROTAS
    // ==========================================
    iniciarSistemaJungle() {
        setInterval(() => {
            // Chance de 30% a cada 40 segundos de spawnar um monstro JG
            if (Math.random() < 0.3) {
                const laneAleatoria = this.rotasValidas[Math.floor(Math.random() * this.rotasValidas.length)];
                const monstros = ["Arauto das Sombras", "Dragão de Gesso", "Guardião Neutro"];
                const monstroEscolhido = monstros[Math.floor(Math.random() * monstros.length)];
                
                this.anunciarJungle(monstroEscolhido, laneAleatoria);
                this.injetarMonstroJungle(monstroEscolhido, laneAleatoria);
            }
        }, 40000);
    }

    anunciarJungle(monstro, lane) {
        if (!this.state.roomName) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: "🌲 JUNGLE",
            text: `Um <strong>${monstro}</strong> invadiu a rota <strong>${lane}</strong>! Desloquem-se para enfrentá-lo!`,
            type: "system",
            time: Date.now()
        });
    }

    injetarMonstroJungle(monstro, lane) {
        // Verifica continuamente se o jogador chegou na lane certa para mostrar o botão
        const jungleInterval = setInterval(() => {
            let container = document.getElementById('jungle-event-container');
            
            if (this.state.lane === lane) {
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'jungle-event-container';
                    container.style.cssText = "margin-top:15px; padding:15px; background:rgba(34, 139, 34, 0.2); border:2px dashed #32cd32; text-align:center; border-radius:8px;";
                    container.innerHTML = `<h3 style="color:#32cd32; margin:0 0 10px 0;">🐺 Monstro Presente: ${monstro}</h3>`;
                    
                    const btnBatalha = document.createElement('button');
                    btnBatalha.innerText = "⚔️ Iniciar Batalha da Selva";
                    btnBatalha.style.cssText = "background:#ff4500; color:#fff; padding:10px; border:none; border-radius:5px; cursor:pointer; width:100%; font-weight:bold;";
                    
                    btnBatalha.onclick = () => {
                        btnBatalha.innerText = "Lutando...";
                        btnBatalha.disabled = true;
                        
                        setTimeout(() => {
                            const recompensa = Math.floor((300 * this.state.dificuldadeMundo) + (this.state.level * 50));
                            this.state.gold += recompensa;
                            this.animacaoTextoFlutuante(`+${recompensa} Ouro da Jungle!`, "#ffd700");
                            container.remove();
                            clearInterval(jungleInterval);
                            atualizarUI();
                        }, 3000); // 3 segundos de "batalha" simulada
                    };
                    
                    container.appendChild(btnBatalha);
                    const controles = document.querySelector('.skills-controls') || document.body;
                    controles.appendChild(container);
                }
            } else {
                // Se mudou de lane, esconde/remove o container
                if (container) container.remove();
            }
        }, 1000);

        // O monstro foge após 60 segundos
        setTimeout(() => {
            clearInterval(jungleInterval);
            const container = document.getElementById('jungle-event-container');
            if (container) container.remove();
        }, 60000);
    }

    // ==========================================
    // 7. INCENTIVO DE MOVIMENTAÇÃO (MINI-GAME) E ANTI-AFK
    // ==========================================
    monitorarMovimentacaoEAFK() {
        setInterval(() => {
            if (this.state.lane === "Base") {
                this.tempoNaMesmaLane = 0; // Base é segura
                return;
            }

            if (this.state.lane === this.ultimaLane) {
                this.tempoNaMesmaLane++;
                if (this.tempoNaMesmaLane >= this.limiteAFK) {
                    this.aplicarPunicaoPesada("ESTAGNAÇÃO DETECTADA! Você ficou parado farmando na mesma rota por muito tempo. Movimente-se pelo mapa!");
                    this.tempoNaMesmaLane = 0; // Reseta após punir
                }
            } else {
                this.ultimaLane = this.state.lane;
                this.tempoNaMesmaLane = 0;
            }
        }, 1000);
    }

    iniciarIncentivosDeMovimento() {
        setInterval(() => {
            if (Math.random() < 0.4) {
                const laneAleatoria = this.rotasValidas[Math.floor(Math.random() * this.rotasValidas.length)];
                
                // Se o item spawnar fora da lane atual dele, ele tem que se mover para pegar
                if (laneAleatoria !== this.state.lane) {
                    this.gerarBuffMiniGame(laneAleatoria);
                }
            }
        }, 35000);
    }

    gerarBuffMiniGame(laneAlvo) {
        // Alerta o jogador no topo da tela
        const aviso = document.createElement('div');
        aviso.style.cssText = "position:fixed; top:60px; left:50%; transform:translateX(-50%); background:rgba(0,191,255,0.9); color:#fff; padding:10px 20px; border-radius:20px; z-index:8000; font-weight:bold;";
        aviso.innerText = `✨ Uma Relíquia de Poder apareceu no ${laneAlvo}! Corra até lá!`;
        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 6000);

        // Monitora se o jogador chega na lane
        const buffInterval = setInterval(() => {
            if (this.state.lane === laneAlvo) {
                clearInterval(buffInterval);
                this.iniciarMiniGameCaptura();
            }
        }, 1000);

        // Desiste após 20 segundos
        setTimeout(() => clearInterval(buffInterval), 20000);
    }

    iniciarMiniGameCaptura() {
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999;";
        
        const alvoDiv = document.createElement('div');
        alvoDiv.style.cssText = "position:absolute; width:50px; height:50px; background:radial-gradient(circle, #00ffff, #00008b); border-radius:50%; cursor:crosshair; box-shadow:0 0 20px #00ffff;";
        
        overlay.appendChild(alvoDiv);
        document.body.appendChild(overlay);

        let cliquesRestantes = 3;
        
        const moverAlvo = () => {
            const x = Math.random() * (window.innerWidth - 60);
            const y = Math.random() * (window.innerHeight - 60);
            alvoDiv.style.left = `${x}px`;
            alvoDiv.style.top = `${y}px`;
        };

        moverAlvo();
        const loopMovimento = setInterval(moverAlvo, 800);

        alvoDiv.onclick = () => {
            cliquesRestantes--;
            if (cliquesRestantes <= 0) {
                clearInterval(loopMovimento);
                overlay.remove();
                
                // Recompensa: Buff de MS e AD temporário
                this.animacaoTextoFlutuante("Relíquia Capturada! +50 AD por 15s!", "#00ffff");
                this.state.stats.ad += 50;
                atualizarUI();
                
                setTimeout(() => {
                    this.state.stats.ad -= 50;
                    atualizarUI();
                }, 15000);
            } else {
                moverAlvo();
            }
        };

        // Falha no minigame se não clicar em 5 segundos
        setTimeout(() => {
            if (cliquesRestantes > 0) {
                clearInterval(loopMovimento);
                overlay.remove();
                this.animacaoTextoFlutuante("A Relíquia sumiu...", "#777");
            }
        }, 5000);
    }

    // ==========================================
    // UTILITÁRIOS VISUAIS
    // ==========================================
    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.innerText = texto;
        textAnim.style.cssText = `position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); color:${cor}; font-size:1.5rem; font-weight:bold; z-index:10000; text-shadow:2px 2px 0 #000; pointer-events:none; transition:all 1s ease-out;`;
        document.body.appendChild(textAnim);
        
        setTimeout(() => {
            textAnim.style.top = '30%';
            textAnim.style.opacity = '0';
        }, 50);
        setTimeout(() => textAnim.remove(), 1050);
    }
}
