// ==========================================
// VANGUARD: O ÁRBITRO E MESTRE DO RIFT RPG (ATUALIZADO)
// ==========================================
import { ref, onValue, set, push, get, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
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
        
        // Sistema de Turnos
        this.turnoAtual = null;
        this.listaJogadores = [];
    }

    iniciar() {
        console.log("🛡️ VANGUARD: Inicializando protocolos absolutos de RPG Tático.");
        this.forcarPartidaRPG();
        this.limparLayoutObsoleto();
        this.escalonarDificuldade();
        this.criarMiniMapaPopup();
        this.monitorarMovimentacaoEAFK();
        this.iniciarSistemaJungle();
        this.iniciarIncentivosDeMovimento();
        this.iniciarSincronizacaoDeTurnos();
        
        // Sincroniza presença no radar a cada 2 segundos
        setInterval(() => this.atualizarRadar(), 2000);
    }

    // ==========================================
    // 1. FORÇAR PARTIDA RPG E ORGANIZAÇÃO DE UI
    // ==========================================
    forcarPartidaRPG() {
        if (!this.state.roomName) return;
        
        this.state.dificuldadeMundo = 1;
        if (!this.state.stats) this.state.stats = { hp: 100, maxHp: 100, mana: 50, maxMana: 50, ad: 10, ap: 10, def: 5, mdef: 5, ms: 300 };
        
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: "🛡️ VANGUARD (Mestre)",
            text: `<strong style="color:#ffd700;">A PARTIDA RPG COMEÇOU!</strong> Regras ativas: Movimento e Farm são livres. Ataques são baseados em TURNOS!`,
            type: "system",
            time: Date.now()
        });
    }

    limparLayoutObsoleto() {
        document.querySelectorAll('.old-version-btn, .deprecated, [id^="old-skill"]').forEach(el => el.remove());

        const tabelas = document.querySelectorAll('table');
        if (tabelas.length > 1) {
            const tabelaPrincipal = tabelas[0];
            tabelaPrincipal.classList.add('vanguard-single-table');
            
            for (let i = 1; i < tabelas.length; i++) {
                const linhas = tabelas[i].querySelectorAll('tr');
                linhas.forEach(linha => tabelaPrincipal.appendChild(linha));
                tabelas[i].remove();
            }
            console.log("🛡️ VANGUARD: Múltiplas tabelas detectadas. Estrutura fundida.");
        }
        document.body.style.overflowX = 'hidden';
    }

    // ==========================================
    // 2. MINI-MAPA E RADAR
    // ==========================================
    criarMiniMapaPopup() {
        const btnRadar = document.createElement('button');
        btnRadar.innerHTML = "🗺️ Radar";
        btnRadar.style.cssText = "position:fixed; top:15px; right:10px; padding:8px 15px; background:#1a1a2e; color:#00ff00; border:2px solid #00ff00; border-radius:8px; font-weight:bold; z-index:9000; cursor:pointer;";
        document.body.appendChild(btnRadar);

        const popup = document.createElement('div');
        popup.id = 'vanguard-minimap-popup';
        popup.style.cssText = "display:none; position:fixed; top:50px; right:10px; width:220px; background:rgba(10,10,20,0.95); border:2px solid #00ff00; border-radius:8px; padding:10px; color:#fff; z-index:9001; box-shadow:0 0 15px #00ff00;";
        document.body.appendChild(popup);

        btnRadar.addEventListener('click', () => {
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });

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
                    
                    if (this.turnoAtual) {
                        html += `<div style="margin-top:10px; padding:5px; background:#440000; text-align:center; border-radius:4px; font-weight:bold; color:#ffcc00;">Turno: ${this.turnoAtual}</div>`;
                    }
                    
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
    // 3. SISTEMA DE TURNOS (NOVO)
    // ==========================================
    iniciarSincronizacaoDeTurnos() {
        if (!this.state.roomName) return;
        
        // Monitora os jogadores na sala
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        onValue(playersRef, (snapshot) => {
            if (snapshot.exists()) {
                this.listaJogadores = Object.keys(snapshot.val());
            }
        });

        // Monitora o turno atual
        const turnoRef = ref(this.db, `rooms/${this.state.roomName}/turnoAtual`);
        onValue(turnoRef, (snapshot) => {
            if (snapshot.exists()) {
                this.turnoAtual = snapshot.val();
                
                // Aviso visual se for o turno do jogador
                if (this.turnoAtual === this.state.playerName) {
                    this.animacaoTextoFlutuante("⚔️ SEU TURNO DE ATACAR!", "#ff0000");
                }
            } else if (this.listaJogadores.length > 0) {
                // Se não houver turno definido, o primeiro jogador começa
                set(turnoRef, this.listaJogadores[0]);
            }
        });
    }

    passarTurno() {
        if (!this.state.roomName || !this.listaJogadores.length) return;
        
        const indexAtual = this.listaJogadores.indexOf(this.turnoAtual);
        let proximoIndex = indexAtual + 1;
        
        if (proximoIndex >= this.listaJogadores.length) {
            proximoIndex = 0; // Volta para o primeiro jogador
        }
        
        const proximoJogador = this.listaJogadores[proximoIndex];
        set(ref(this.db, `rooms/${this.state.roomName}/turnoAtual`), proximoJogador);
        console.log(`🛡️ VANGUARD: Turno passado para ${proximoJogador}`);
    }

    escalonarDificuldade() {
        if (!this.state.roomName) return;
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        onValue(playersRef, (snapshot) => {
            if (snapshot.exists()) {
                const numPlayers = Object.keys(snapshot.val()).length;
                this.state.dificuldadeMundo = 1 + ((numPlayers - 1) * 0.4);
            }
        });
    }

    // ==========================================
    // 4. BLOQUEIO DE ATAQUES POR TURNO E VISÃO
    // ==========================================
    validarAtaque(alvo, laneAlvo, temVisao = false) {
        // Regra 1: Turnos
        if (this.turnoAtual && this.turnoAtual !== this.state.playerName) {
            this.animacaoTextoFlutuante("Fora de Turno! Aguarde.", "#ffaa00");
            return false;
        }

        // Regra 2: Base Segura
        if (this.state.lane === "Base") {
            this.aplicarPunicaoPesada("TENTATIVA DE ATAQUE DA BASE! Covardia não é tolerada.");
            return false;
        }

        // Regra 3: Alcance
        if (laneAlvo && laneAlvo !== this.state.lane) {
            this.aplicarPunicaoPesada(`TENTATIVA DE ATAQUE TRANS-ROTA! Você está muito longe.`);
            return false;
        }

        // Regra 4: Visão
        if (alvo.includes("Oculto") && !temVisao) {
            this.aplicarPunicaoPesada("TENTATIVA DE ATAQUE SEM VISÃO! Você atacou as sombras.");
            return false;
        }

        // Se o ataque for válido, passa o turno automaticamente após a ação
        setTimeout(() => this.passarTurno(), 1500);
        return true;
    }

    // ==========================================
    // 5. ANTI-SPAM, FARM COOLDOWN E PUNIÇÃO MELHORADA
    // ==========================================
    registrarUsoMecanica(mecanicaId) {
        const agora = Date.now();
        if (!this.registroAcoes[mecanicaId]) {
            this.registroAcoes[mecanicaId] = { contagem: 1, ultimoUso: agora };
            return true;
        }

        const tempoDecorrido = agora - this.registroAcoes[mecanicaId].ultimoUso;
        
        if (tempoDecorrido < 800) {
            this.registroAcoes[mecanicaId].contagem++;
            if (this.registroAcoes[mecanicaId].contagem >= 4) {
                this.aplicarPunicaoPesada(`ABUSO DE MECÂNICA DETECTADO (${mecanicaId})!`);
                this.registroAcoes[mecanicaId].contagem = 0;
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
        
        funcaoFarmOriginal();
        
        this.cooldownFarm = true;
        setTimeout(() => { this.cooldownFarm = false; }, 2000);
    }

    aplicarPunicaoPesada(motivo) {
        // Punição Severa: Zera Ouro, reduz AD e trava ações por 5s
        this.state.gold = 0;
        this.state.stats.hp = Math.floor(this.state.stats.maxHp * 0.1); // Cai para 10% do HP
        const penalidadeAD = Math.floor(this.state.stats.ad * 0.5);
        this.state.stats.ad -= penalidadeAD;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle, rgba(139,0,0,0.8), rgba(0,0,0,0.9)); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:monospace; backdrop-filter:blur(5px);";
        overlay.innerHTML = `
            <div style="font-size:5rem;">⛓️</div>
            <h1 style="font-size:3rem; margin:0; color:#ff3333; text-shadow:0 0 20px #ff0000;">PRISÃO VANGUARD</h1>
            <p style="font-size:1.5rem; text-align:center; max-width:80%;">${motivo}</p>
            <p style="color:#ffaa00;">Ouro Perdido. HP Reduzido. AD Cortado pela metade.</p>
        `;
        document.body.appendChild(overlay);

        const blockEvent = (e) => { e.stopPropagation(); e.preventDefault(); };
        window.addEventListener('click', blockEvent, true);
        
        setTimeout(() => {
            overlay.remove();
            window.removeEventListener('click', blockEvent, true);
            this.state.stats.ad += penalidadeAD; // Devolve o AD após a prisão
            atualizarUI();
        }, 5000);

        atualizarUI();
    }

    // ==========================================
    // 6. SISTEMA JUNGLE: EVENTOS ÉPICOS
    // ==========================================
    iniciarSistemaJungle() {
        setInterval(() => {
            if (Math.random() < 0.35) {
                const laneAleatoria = this.rotasValidas[Math.floor(Math.random() * this.rotasValidas.length)];
                const monstros = [
                    { nome: "Arauto das Sombras", tipo: "Comum", recompensa: "Ouro" },
                    { nome: "Dragão de Gesso", tipo: "Épico", recompensa: "AD" },
                    { nome: "Guardião do Vazio", tipo: "Lendário", recompensa: "MaxHP" }
                ];
                const monstroEscolhido = monstros[Math.floor(Math.random() * monstros.length)];
                
                this.anunciarJungle(monstroEscolhido, laneAleatoria);
                this.injetarMonstroJungle(monstroEscolhido, laneAleatoria);
            }
        }, 45000);
    }

    anunciarJungle(monstro, lane) {
        if (!this.state.roomName) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        const cor = monstro.tipo === "Lendário" ? "#ff00ff" : (monstro.tipo === "Épico" ? "#00ffff" : "#32cd32");
        
        push(chatRef, {
            sender: "🌲 JUNGLE",
            text: `Um <strong>${monstro.nome}</strong> (${monstro.tipo}) invadiu o <strong>${lane}</strong>! Matem-no para receber <strong>${monstro.recompensa}</strong>!`,
            type: "system",
            time: Date.now()
        });
    }

    injetarMonstroJungle(monstro, lane) {
        const jungleInterval = setInterval(() => {
            let container = document.getElementById('jungle-event-container');
            
            if (this.state.lane === lane) {
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'jungle-event-container';
                    const borderColor = monstro.tipo === "Lendário" ? "#ff00ff" : "#32cd32";
                    container.style.cssText = `margin-top:15px; padding:15px; background:rgba(0,0,0,0.6); border:2px dashed ${borderColor}; text-align:center; border-radius:8px;`;
                    container.innerHTML = `<h3 style="color:${borderColor}; margin:0 0 10px 0;">🐺 Chefe JG: ${monstro.nome}</h3>`;
                    
                    const btnBatalha = document.createElement('button');
                    btnBatalha.innerText = "⚔️ Abater Monstro";
                    btnBatalha.style.cssText = `background:${borderColor}; color:#000; padding:10px; border:none; border-radius:5px; cursor:pointer; width:100%; font-weight:900; font-size:1.1rem;`;
                    
                    btnBatalha.onclick = () => {
                        btnBatalha.innerText = "Lutando...";
                        btnBatalha.disabled = true;
                        
                        setTimeout(() => {
                            if (monstro.recompensa === "Ouro") {
                                const recompensa = Math.floor(400 * this.state.dificuldadeMundo);
                                this.state.gold += recompensa;
                                this.animacaoTextoFlutuante(`+${recompensa} Ouro da Jungle!`, "#ffd700");
                            } else if (monstro.recompensa === "AD") {
                                this.state.stats.ad += 15;
                                this.animacaoTextoFlutuante(`Buff Épico! +15 AD Permanente!`, "#00ffff");
                            } else if (monstro.recompensa === "MaxHP") {
                                this.state.stats.maxHp += 150;
                                this.state.stats.hp += 150;
                                this.animacaoTextoFlutuante(`Buff Lendário! +150 HP Máximo!`, "#ff00ff");
                            }
                            
                            container.remove();
                            clearInterval(jungleInterval);
                            atualizarUI();
                        }, 3500); 
                    };
                    
                    container.appendChild(btnBatalha);
                    const controles = document.querySelector('.skills-controls') || document.body;
                    controles.appendChild(container);
                }
            } else {
                if (container) container.remove();
            }
        }, 1000);

        setTimeout(() => {
            clearInterval(jungleInterval);
            const container = document.getElementById('jungle-event-container');
            if (container) container.remove();
        }, 45000);
    }

    // ==========================================
    // 7. ANTI-AFK E MINI-GAMES DE RELÍQUIA
    // ==========================================
    monitorarMovimentacaoEAFK() {
        setInterval(() => {
            if (this.state.lane === "Base") {
                this.tempoNaMesmaLane = 0; 
                return;
            }

            if (this.state.lane === this.ultimaLane) {
                this.tempoNaMesmaLane++;
                if (this.tempoNaMesmaLane >= this.limiteAFK) {
                    this.aplicarPunicaoPesada("ESTAGNAÇÃO DETECTADA! Mova-se pelo mapa e pare de acampar a rota!");
                    this.tempoNaMesmaLane = 0; 
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
                if (laneAleatoria !== this.state.lane) {
                    this.gerarBuffMiniGame(laneAleatoria);
                }
            }
        }, 40000);
    }

    gerarBuffMiniGame(laneAlvo) {
        const aviso = document.createElement('div');
        aviso.style.cssText = "position:fixed; top:60px; left:50%; transform:translateX(-50%); background:rgba(255,215,0,0.9); color:#000; padding:10px 20px; border-radius:20px; z-index:8000; font-weight:900; box-shadow:0 4px 15px rgba(255,215,0,0.5);";
        aviso.innerText = `✨ Relíquia de Movimento no ${laneAlvo}!`;
        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 6000);

        const buffInterval = setInterval(() => {
            if (this.state.lane === laneAlvo) {
                clearInterval(buffInterval);
                this.iniciarMiniGameCaptura();
            }
        }, 1000);

        setTimeout(() => clearInterval(buffInterval), 20000);
    }

    iniciarMiniGameCaptura() {
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999;";
        
        const alvoDiv = document.createElement('div');
        alvoDiv.style.cssText = "position:absolute; width:60px; height:60px; background:radial-gradient(circle, #fff, #ffd700); border-radius:50%; cursor:crosshair; box-shadow:0 0 25px #ffd700;";
        
        overlay.appendChild(alvoDiv);
        document.body.appendChild(overlay);

        let cliquesRestantes = 3;
        
        const moverAlvo = () => {
            const x = Math.random() * (window.innerWidth - 80);
            const y = Math.random() * (window.innerHeight - 80);
            alvoDiv.style.left = `${x}px`;
            alvoDiv.style.top = `${y}px`;
        };

        moverAlvo();
        const loopMovimento = setInterval(moverAlvo, 700);

        alvoDiv.onclick = () => {
            cliquesRestantes--;
            if (cliquesRestantes <= 0) {
                clearInterval(loopMovimento);
                overlay.remove();
                
                this.animacaoTextoFlutuante("Relíquia Pega! +100 AD por 10s!", "#ffd700");
                this.state.stats.ad += 100;
                atualizarUI();
                
                setTimeout(() => {
                    this.state.stats.ad -= 100;
                    atualizarUI();
                }, 10000);
            } else {
                moverAlvo();
                alvoDiv.style.transform = `scale(${1 - (0.2 * (3 - cliquesRestantes))})`;
            }
        };

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
        textAnim.style.cssText = `position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); color:${cor}; font-size:1.8rem; font-weight:900; z-index:10000; text-shadow:3px 3px 0 #000, 0 0 15px ${cor}; pointer-events:none; transition:all 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);`;
        document.body.appendChild(textAnim);
        
        setTimeout(() => {
            textAnim.style.top = '25%';
            textAnim.style.opacity = '0';
            textAnim.style.transform = 'translate(-50%, -50%) scale(1.2)';
        }, 50);
        setTimeout(() => textAnim.remove(), 1250);
    }
}
