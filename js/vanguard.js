// ==========================================
// VANGUARD: O ÁRBITRO E MESTRE DO RIFT RPG (PRO EDITION)
// ==========================================
import { ref, onValue, set, push, get, child } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "./app.js";

export default class Vanguard {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        // Controles de Tempo e Abuso
        this.ultimaLane = this.state.lane || "Base";
        this.tempoNaMesmaLane = 0;
        this.limiteAFK = 50; 
        this.avisadoAFK = false; // Controle de aviso prévio
        
        // Otimização de Memória
        this.intervalosAtivos = [];
        this.listenersAtivos = [];
        this.ultimoEstadoRadar = { lane: null, hp: null };
        
        this.cooldownFarm = false;
        this.rotasValidas = ["Top", "Mid", "Bot"];
        
        // Sistema de Turnos e Batalha
        this.turnoAtual = null;
        this.listaJogadores = [];
        this.emBatalhaComMonstro = false;
        this.tempoLimiteTurno = 30; // Segundos para agir
        this.timerTurnoAtual = null;
    }

    iniciar() {
        console.log("🛡️ VANGUARD: Protocolos Avançados Inicializados.");
        this.limparProcessosAnteriores();
        this.forcarPartidaRPG();
        this.limparLayoutObsoleto();
        this.escalonarDificuldade();
        this.criarMiniMapaLimpo();
        this.criarIndicadorDeTurnoVisual();
        
        // Gerenciamento centralizado de loops temporais
        this.adicionarLoop(() => this.atualizarRadar(), 2000);
        this.adicionarLoop(() => this.monitorarMovimentacaoEAFK(), 1000);
        this.adicionarLoop(() => this.verificarSpawnJungle(), 10000);
        this.adicionarLoop(() => this.verificarSpawnReliquia(), 45000);
        
        this.iniciarSincronizacaoDeTurnos();
    }

    adicionarLoop(funcao, tempo) {
        const id = setInterval(funcao, tempo);
        this.intervalosAtivos.push(id);
    }

    limparProcessosAnteriores() {
        this.intervalosAtivos.forEach(clearInterval);
        this.intervalosAtivos = [];
    }

    forcarPartidaRPG() {
        if (!this.state.roomName) return;
        this.state.dificuldadeMundo = 1;
        if (!this.state.stats) {
            this.state.stats = { hp: 100, maxHp: 100, mana: 50, maxMana: 50, ad: 10, ap: 10, def: 5, mdef: 5, ms: 300 };
        }
    }

    limparLayoutObsoleto() {
        document.querySelectorAll('.old-version-btn, .deprecated, [id^="old-skill"]').forEach(el => el.remove());
        document.body.style.overflowX = 'hidden';
    }

    // ==========================================
    // RADAR OTIMIZADO (REDUÇÃO DE REQUISIÇÕES)
    // ==========================================
    atualizarRadar() {
        if (!this.state.roomName || !this.state.playerName) return;
        
        // Atualiza apenas se houve mudança real na lane ou no HP para poupar banda
        if (this.ultimoEstadoRadar.lane !== this.state.lane || this.ultimoEstadoRadar.hp !== this.state.stats.hp) {
            const playerPosRef = ref(this.db, `rooms/${this.state.roomName}/radar/${this.state.playerName}`);
            set(playerPosRef, {
                lane: this.state.lane,
                hp: this.state.stats.hp,
                timestamp: Date.now()
            });
            this.ultimoEstadoRadar = { lane: this.state.lane, hp: this.state.stats.hp };
        }
    }

    criarMiniMapaLimpo() {
        const btnRadar = document.createElement('button');
        btnRadar.innerHTML = "🗺️ Mapa";
        btnRadar.className = "vanguard-ui-btn vanguard-radar-btn";
        btnRadar.style.cssText = "position:fixed; top:75px; right:15px; padding:6px 12px; background:rgba(15,15,25,0.85); color:#00ffcc; border:1px solid #00ffcc; border-radius:6px; font-weight:bold; cursor:pointer; z-index:9000;";
        document.body.appendChild(btnRadar);

        const popup = document.createElement('div');
        popup.id = 'vanguard-minimap-popup';
        popup.style.cssText = "display:none; position:fixed; top:48px; right:15px; width:220px; background:rgba(10,10,20,0.95); border:1px solid #00ffcc; border-radius:8px; padding:12px; z-index:9001;";
        document.body.appendChild(popup);

        btnRadar.addEventListener('click', () => {
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });

        if (this.state.roomName) {
            const radarRef = ref(this.db, `rooms/${this.state.roomName}/radar`);
            onValue(radarRef, (snapshot) => {
                if (snapshot.exists()) {
                    let html = "<div style='color:#00ffcc; margin-bottom:8px; border-bottom:1px solid #333;'>Posições no Rift</div>";
                    snapshot.forEach(child => {
                        const player = child.val();
                        const isMe = child.key === this.state.playerName;
                        const corStatus = player.hp > 0 ? (isMe ? "#00ffcc" : "#fff") : "#ff4444";
                        html += `<div style="display:flex; justify-content:space-between; margin-bottom:4px; color:${corStatus};">
                            <span>${isMe ? '⭐ ' : ''}${child.key}</span>
                            <span style="opacity:0.8;">[${player.lane}]</span>
                        </div>`;
                    });
                    popup.innerHTML = html;
                }
            });
        }
    }

    // ==========================================
    // SISTEMA DE TURNOS COM ANTI-TRAVAMENTO
    // ==========================================
    criarIndicadorDeTurnoVisual() {
        const indicador = document.createElement('div');
        indicador.id = 'vanguard-turno-indicador';
        indicador.style.cssText = "position:fixed; top:12px; left:50%; transform:translateX(-50%); background:rgba(10,10,20,0.9); border:1px solid #ffcc00; padding:8px 24px; border-radius:20px; color:#ffcc00; font-weight:bold; z-index:9000; pointer-events:none; transition:all 0.3s ease;";
        document.body.appendChild(indicador);
    }

    iniciarSincronizacaoDeTurnos() {
        if (!this.state.roomName) return;
        
        const playersRef = ref(this.db, `rooms/${this.state.roomName}/players`);
        onValue(playersRef, (snapshot) => {
            if (snapshot.exists()) {
                this.listaJogadores = Object.keys(snapshot.val());
            }
        });

        const turnoRef = ref(this.db, `rooms/${this.state.roomName}/turnoAtual`);
        onValue(turnoRef, (snapshot) => {
            const indicadorEl = document.getElementById('vanguard-turno-indicador');
            if (snapshot.exists()) {
                this.turnoAtual = snapshot.val();
                const meuTurno = this.turnoAtual === this.state.playerName;

                if (indicadorEl) {
                    if (meuTurno) {
                        indicadorEl.style.background = "rgba(0, 100, 50, 0.9)";
                        indicadorEl.style.borderColor = "#00ff66";
                        indicadorEl.style.color = "#00ff66";
                        indicadorEl.innerText = "⚔️ É O SEU TURNO! FAÇA SUA JOGADA.";
                        this.iniciarTimerDeTurno();
                    } else {
                        indicadorEl.style.background = "rgba(10, 10, 20, 0.9)";
                        indicadorEl.style.borderColor = "#ffcc00";
                        indicadorEl.style.color = "#ffcc00";
                        indicadorEl.innerText = `⏳ Turno de: ${this.turnoAtual}`;
                        this.limparTimerDeTurno();
                    }
                }
            } else if (this.listaJogadores.length > 0) {
                set(turnoRef, this.listaJogadores[0]);
            }
        });
    }

    iniciarTimerDeTurno() {
        this.limparTimerDeTurno();
        let tempoRestante = this.tempoLimiteTurno;
        
        this.timerTurnoAtual = setInterval(() => {
            tempoRestante--;
            const indicadorEl = document.getElementById('vanguard-turno-indicador');
            if (indicadorEl) {
                indicadorEl.innerText = `⚔️ SEU TURNO! (${tempoRestante}s)`;
            }
            if (tempoRestante <= 0) {
                this.animacaoTextoFlutuante("Tempo Esgotado!", "#ff4444");
                this.passarTurno();
            }
        }, 1000);
    }

    limparTimerDeTurno() {
        if (this.timerTurnoAtual) {
            clearInterval(this.timerTurnoAtual);
            this.timerTurnoAtual = null;
        }
    }

    passarTurno() {
        if (!this.state.roomName || !this.listaJogadores.length) return;
        this.limparTimerDeTurno();
        const indexAtual = this.listaJogadores.indexOf(this.turnoAtual);
        let proximoIndex = indexAtual + 1;
        if (proximoIndex >= this.listaJogadores.length) proximoIndex = 0;
        
        set(ref(this.db, `rooms/${this.state.roomName}/turnoAtual`), this.listaJogadores[proximoIndex]);
    }

    validarAtaque(laneAlvo) {
        if (this.emBatalhaComMonstro) {
            this.animacaoTextoFlutuante("Você está ocupado lutando contra um monstro!", "#ffaa00");
            return false;
        }

        if (this.turnoAtual && this.turnoAtual !== this.state.playerName) {
            this.animacaoTextoFlutuante("Aguarde o seu turno!", "#ff4444");
            return false;
        }

        if (this.state.lane === "Base") {
            this.aplicarPunicaoPesada("Ataques partindo da Base são expressamente proibidos!");
            return false;
        }

        if (laneAlvo && laneAlvo !== this.state.lane) {
            this.aplicarPunicaoPesada("Você não pode atacar alvos fora da sua rota atual!");
            return false;
        }

        setTimeout(() => this.passarTurno(), 500);
        return true;
    }

    // ==========================================
    // SISTEMA DE AFK PROGRESSIVO
    // ==========================================
    monitorarMovimentacaoEAFK() {
        if (this.state.lane === "Base") {
            this.tempoNaMesmaLane = 0;
            this.avisadoAFK = false;
            return;
        }

        if (this.state.lane === this.ultimaLane) {
            this.tempoNaMesmaLane++;
            
            // Aviso em 80% do tempo limite
            if (this.tempoNaMesmaLane === Math.floor(this.limiteAFK * 0.8) && !this.avisadoAFK) {
                this.animacaoTextoFlutuante("⚠️ Movimente-se ou será punido por inatividade!", "#ffaa00");
                this.avisadoAFK = true;
            }

            if (this.tempoNaMesmaLane >= this.limiteAFK) {
                this.aplicarPunicaoPesada("Estagnação prolongada. Movimentação tática é necessária.");
                this.tempoNaMesmaLane = 0;
                this.avisadoAFK = false;
            }
        } else {
            this.ultimaLane = this.state.lane;
            this.tempoNaMesmaLane = 0;
            this.avisadoAFK = false;
        }
    }

    aplicarPunicaoPesada(motivo) {
        const penalidadeOuro = 50;
        const penalidadeHP = Math.floor(this.state.stats.maxHp * 0.15); // O HP cai para 15% do máximo
        
        this.state.gold = Math.max(0, (this.state.gold || 0) - penalidadeOuro);
        this.state.stats.hp = penalidadeHP;
        
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle, rgba(120,0,0,0.85), rgba(0,0,0,0.95)); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; text-align:center; padding:20px;";
        overlay.innerHTML = `
            <div style="font-size:4rem; margin-bottom:10px;">⚠️</div>
            <h1 style="font-size:2.5rem; color:#ff3333; margin:0 0 10px 0;">PUNIÇÃO DO VANGUARD</h1>
            <p style="font-size:1.2rem; max-width:500px;">${motivo}</p>
            <p style="color:#ffaa00; font-weight:bold;">Penalidade: -${penalidadeOuro} Ouro | HP Reduzido para 15%</p>
        `;
        document.body.appendChild(overlay);

        setTimeout(() => {
            overlay.remove();
            atualizarUI();
        }, 4000);
        atualizarUI();
    }

    // ==========================================
    // SISTEMA JUNGLE INTERATIVO E BALANCEADO
    // ==========================================
    verificarSpawnJungle() {
        // Possibilidade de 30% a cada ciclo (definido em 10 segundos na inicialização)
        if (Math.random() < 0.3 && !this.emBatalhaComMonstro) {
            const laneAleatoria = this.rotasValidas[Math.floor(Math.random() * this.rotasValidas.length)];
            const monstros = [
                { nome: "Lobisomem do Covil", hp: 100, ad: 15, recompensaOuro: 300, recompensaTipo: "Ouro" },
                { nome: "Dragão Abissal", hp: 180, ad: 25, recompensaOuro: 600, recompensaTipo: "AD" },
                { nome: "Titã da Selva", hp: 250, ad: 35, recompensaOuro: 1000, recompensaTipo: "HP" }
            ];
            const monstroEscolhido = monstros[Math.floor(Math.random() * monstros.length)];
            
            this.anunciarJungle(monstroEscolhido, laneAleatoria);
            this.gerarBotaoCombateMonstro(monstroEscolhido, laneAleatoria);
        }
    }

    anunciarJungle(monstro, lane) {
        if (!this.state.roomName) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: "🌲 VANGUARD EVENT",
            text: `Uma fenda se abriu! <strong>${monstro.nome}</strong> detectado no <strong>${lane}</strong>.`,
            type: "system",
            time: Date.now()
        });
    }

    gerarBotaoCombateMonstro(monstro, lane) {
        let spawned = true;
        let timeoutId;
        
        const checker = setInterval(() => {
            if (!spawned) return clearInterval(checker);

            let container = document.getElementById('jungle-combat-btn-container');
            if (this.state.lane === lane && !this.emBatalhaComMonstro) {
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'jungle-combat-btn-container';
                    container.style.cssText = "position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:8500;";
                    
                    const btn = document.createElement('button');
                    btn.innerHTML = `⚔️ Enfrentar ${monstro.nome}`;
                    btn.style.cssText = "background:linear-gradient(135deg, #ff4e50, #f9d423); padding:14px 28px; border:none; border-radius:30px; font-weight:900; cursor:pointer;";
                    
                    btn.onclick = () => {
                        spawned = false;
                        clearInterval(checker);
                        clearTimeout(timeoutId);
                        container.remove();
                        this.iniciarTelaBatalhaMonstro(monstro);
                    };

                    container.appendChild(btn);
                    document.body.appendChild(container);
                }
            } else {
                if (container) container.remove();
            }
        }, 1000);

        // Despawn ajustado de 400.000ms para 35 segundos para criar dinamismo e limpar memória
        timeoutId = setTimeout(() => {
            spawned = false;
            clearInterval(checker);
            const container = document.getElementById('jungle-combat-btn-container');
            if (container) container.remove();
        }, 35000); 
    }

    iniciarTelaBatalhaMonstro(monstro) {
        this.emBatalhaComMonstro = true;
        let hpMonstroAtual = monstro.hp;
        let hpHeroiAtual = this.state.stats.hp;
        
        const modal = document.createElement('div');
        modal.id = 'vanguard-monstro-modal';
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; display:flex; justify-content:center; align-items:center;";
        
        const renderizarCombate = (msgTurno = "Prepare-se para o embate!") => {
            modal.innerHTML = `
                <div style="background:#141423; border:2px solid #ff4e50; border-radius:16px; padding:25px; width:400px; color:#fff; text-align:center;">
                    <h2 style="color:#ff4e50; margin:0 0 20px 0;">🔥 ${monstro.nome}</h2>
                    <div style="display:flex; justify-content:space-between; font-weight:bold; margin-bottom:20px;">
                        <div>❤️ Você: ${hpHeroiAtual}/${this.state.stats.maxHp}</div>
                        <div>👹 Monstro: ${hpMonstroAtual}/${monstro.hp}</div>
                    </div>
                    <div style="background:#0a0a12; padding:15px; border-radius:8px; margin-bottom:20px; border:1px solid #333; min-height:50px;">
                        ${msgTurno}
                    </div>
                    <div style="display:flex; gap:10px;">
                        <button id="btn-atacar-monstro" style="flex:1; padding:12px; background:#00ffcc; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">⚔️ Atacar</button>
                        <button id="btn-fugir-monstro" style="flex:1; padding:12px; background:#444; color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">🏃 Fugir</button>
                    </div>
                </div>
            `;

            const btnAtacar = document.getElementById('btn-atacar-monstro');
            if(btnAtacar) {
                btnAtacar.onclick = () => {
                    btnAtacar.disabled = true; // Previne cliques duplos rápidos
                    executarTurnoCombate();
                };
            }
            
            const btnFugir = document.getElementById('btn-fugir-monstro');
            if(btnFugir) btnFugir.onclick = () => finalizarCombate(false, "Você recuou para a segurança da rota.");
        };

        const executarTurnoCombate = () => {
            const danoHeroi = this.state.stats.ad || 10;
            hpMonstroAtual = Math.max(0, hpMonstroAtual - Math.floor(danoHeroi));

            if (hpMonstroAtual <= 0) {
                return finalizarCombate(true, "O monstro pereceu sob seus golpes!");
            }

            renderizarCombate(`Você atacou causando ${danoHeroi} de dano! O monstro está preparando o revide...`);
            
            // Simula o tempo de resposta do monstro para maior tensão
            setTimeout(() => {
                const danoMonstro = Math.max(2, monstro.ad - Math.floor((this.state.stats.def || 5) * 0.3));
                hpHeroiAtual = Math.max(0, hpHeroiAtual - danoMonstro);
                this.state.stats.hp = hpHeroiAtual;
                atualizarUI();

                if (hpHeroiAtual <= 0) {
                    return finalizarCombate(false, "Sua força falhou. O monstro te abateu.");
                }
                renderizarCombate(`O monstro revidou brutalmente causando ${danoMonstro} de dano!`);
            }, 800);
        };

        const finalizarCombate = (vitoria, mensagemFinal) => {
            this.emBatalhaComMonstro = false;
            modal.innerHTML = `
                <div style="background:#141423; border:2px solid ${vitoria ? '#00ff66' : '#ff4444'}; border-radius:16px; padding:30px; text-align:center; color:#fff;">
                    <h2 style="color:${vitoria ? '#00ff66' : '#ff4444'};">${vitoria ? '🎉 VITÓRIA!' : '💀 FIM DE COMBATE'}</h2>
                    <p style="margin:20px 0;">${mensagemFinal}</p>
                    <button id="btn-fechar-combate" style="background:${vitoria ? '#00ff66' : '#ff4444'}; padding:10px 20px; border:none; border-radius:8px; cursor:pointer; font-weight:bold;">Continuar</button>
                </div>
            `;

            if (vitoria) {
                if (monstro.recompensaTipo === "Ouro") {
                    this.state.gold = (this.state.gold || 0) + monstro.recompensaOuro;
                    this.animacaoTextoFlutuante(`+${monstro.recompensaOuro} Ouro!`, "#ffd700");
                } else if (monstro.recompensaTipo === "AD") {
                    this.state.stats.ad += 20;
                    this.animacaoTextoFlutuante(`+20 AD!`, "#00ffff");
                } else {
                    this.state.stats.maxHp += 100;
                    this.state.stats.hp = this.state.stats.maxHp;
                    this.animacaoTextoFlutuante(`+100 HP Máximo!`, "#ff00ff");
                }
            }

            atualizarUI();
            document.getElementById('btn-fechar-combate').onclick = () => modal.remove();
        };

        document.body.appendChild(modal);
        renderizarCombate();
    }

    // ==========================================
    // SISTEMA DE RELÍQUIAS E UTILITÁRIOS
    // ==========================================
    verificarSpawnReliquia() {
        // Analisa spawn de relíquia a cada 45 segundos dependendo do RNG
        if (Math.random() < 0.35) {
            const laneAleatoria = this.rotasValidas[Math.floor(Math.random() * this.rotasValidas.length)];
            if (laneAleatoria !== this.state.lane) {
                this.gerarBuffMiniGame(laneAleatoria);
            }
        }
    }

    gerarBuffMiniGame(laneAlvo) {
        this.animacaoTextoFlutuante(`Uma Relíquia surgiu na rota: ${laneAlvo}!`, "#ffd700");
        let tempoRestante = 20;

        const checkInterval = setInterval(() => {
            tempoRestante--;
            if (this.state.lane === laneAlvo) {
                clearInterval(checkInterval);
                this.iniciarMiniGameCaptura();
            }
            if (tempoRestante <= 0) clearInterval(checkInterval);
        }, 1000);
    }

    iniciarMiniGameCaptura() {
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999;";
        
        const alvo = document.createElement('div');
        alvo.style.cssText = "position:absolute; width:60px; height:60px; background:radial-gradient(circle, #fff, #ffd700); border-radius:50%; cursor:pointer; box-shadow:0 0 20px #ffd700; transition: left 0.3s, top 0.3s;";
        
        overlay.appendChild(alvo);
        document.body.appendChild(overlay);

        let cliquesRestantes = 3;

        const moverAlvo = () => {
            alvo.style.left = `${Math.random() * (window.innerWidth - 80)}px`;
            alvo.style.top = `${Math.random() * (window.innerHeight - 80)}px`;
        };

        moverAlvo();
        const loop = setInterval(moverAlvo, 750); // Movimentação mais fluida

        alvo.onclick = () => {
            cliquesRestantes--;
            if (cliquesRestantes <= 0) {
                clearInterval(loop);
                overlay.remove();
                this.animacaoTextoFlutuante("Relíquia Capturada! +40 AD por 15s!", "#ffd700");
                this.state.stats.ad += 40;
                atualizarUI();
                
                setTimeout(() => {
                    this.state.stats.ad -= 40;
                    this.animacaoTextoFlutuante("O efeito da relíquia se dissipou.", "#aaaaaa");
                    atualizarUI();
                }, 15000);
            } else {
                moverAlvo();
            }
        };

        setTimeout(() => {
            if (cliquesRestantes > 0) {
                clearInterval(loop);
                overlay.remove();
                this.animacaoTextoFlutuante("Você falhou em capturar a relíquia...", "#777");
            }
        }, 6000);
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

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.innerText = texto;
        textAnim.style.cssText = `position:fixed; top:35%; left:50%; transform:translate(-50%, -50%); color:${cor}; font-size:1.4rem; font-weight:bold; z-index:10000; text-shadow:2px 2px 4px #000; pointer-events:none; transition:all 1s cubic-bezier(0.25, 1, 0.5, 1);`;
        document.body.appendChild(textAnim);
        
        requestAnimationFrame(() => {
            textAnim.style.top = '25%';
            textAnim.style.opacity = '0';
        });
        
        setTimeout(() => textAnim.remove(), 1100);
    }
}
