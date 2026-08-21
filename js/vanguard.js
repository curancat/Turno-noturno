// ==========================================
// VANGUARD: O ÁRBITRO E MESTRE DO RIFT RPG (ATUALIZADO & OTIMIZADO)
// ==========================================
import { ref, onValue, set, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "./app.js";

export default class Vanguard {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        // Controles de Tempo e Abuso
        this.ultimaLane = this.state.lane || "Base";
        this.tempoNaMesmaLane = 0;
        this.limiteAFK = 30; // 30s na mesma lane sem se mover gera punição
        this.registroAcoes = {}; 
        
        // Cooldowns Globais
        this.cooldownFarm = false;
        this.rotasValidas = ["Top", "Mid", "Bot"];
        
        // Sistema de Turnos e Batalha
        this.turnoAtual = null;
        this.listaJogadores = [];
        this.emBatalhaComMonstro = false;
    }

    iniciar() {
        console.log("🛡️ VANGUARD: Inicializando protocolos e melhorias de UI.");
        this.forcarPartidaRPG();
        this.limparLayoutObsoleto();
        this.escalonarDificuldade();
        this.criarMiniMapaLimpo();
        this.criarIndicadorDeTurnoVisual();
        this.monitorarMovimentacaoEAFK();
        this.iniciarSistemaJungleInterativo();
        this.iniciarIncentivosDeMovimento();
        this.iniciarSincronizacaoDeTurnos();
        
        setInterval(() => this.atualizarRadar(), 2000);
    }

    // ==========================================
    // 1. CONFIGURAÇÃO INICIAL E LIMPEZA
    // ==========================================
    forcarPartidaRPG() {
        if (!this.state.roomName) return;
        this.state.dificuldadeMundo = 1;
        if (!this.state.stats) this.state.stats = { hp: 100, maxHp: 100, mana: 50, maxMana: 50, ad: 10, ap: 10, def: 5, mdef: 5, ms: 300 };
    }

    limparLayoutObsoleto() {
        document.querySelectorAll('.old-version-btn, .deprecated, [id^="old-skill"]').forEach(el => el.remove());
        document.body.style.overflowX = 'hidden';
    }

    // ==========================================
    // 2. MINI-MAPA NÃO INVASIVO (CLEAN UI)
    // ==========================================
    criarMiniMapaLimpo() {
        // Botão flutuante minimalista no canto superior direito
        const btnRadar = document.createElement('button');
        btnRadar.innerHTML = "🗺️ Mapa";
        btnRadar.style.cssText = "position:fixed; top:12px; right:15px; padding:6px 12px; background:rgba(15,15,25,0.85); color:#00ffcc; border:1px solid #00ffcc; border-radius:6px; font-weight:bold; font-size:0.85rem; z-index:9000; cursor:pointer; backdrop-filter:blur(4px); box-shadow:0 2px 10px rgba(0,0,0,0.5);";
        document.body.appendChild(btnRadar);

        const popup = document.createElement('div');
        popup.id = 'vanguard-minimap-popup';
        popup.style.cssText = "display:none; position:fixed; top:48px; right:15px; width:200px; background:rgba(10,10,20,0.95); border:1px solid #00ffcc; border-radius:8px; padding:12px; color:#fff; z-index:9001; box-shadow:0 8px 25px rgba(0,0,0,0.8); font-size:0.9rem;";
        document.body.appendChild(popup);

        btnRadar.addEventListener('click', () => {
            popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
        });

        if (this.state.roomName) {
            const radarRef = ref(this.db, `rooms/${this.state.roomName}/radar`);
            onValue(radarRef, (snapshot) => {
                if (snapshot.exists()) {
                    let html = "<div style='font-weight:bold; color:#00ffcc; margin-bottom:8px; border-bottom:1px solid #333; padding-bottom:4px;'>Posições no Rift</div>";
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
    // 3. INDICADOR VISUAL DE TURNO (TOPO DA TELA)
    // ==========================================
    criarIndicadorDeTurnoVisual() {
        const indicador = document.createElement('div');
        indicador.id = 'vanguard-turno-indicador';
        indicador.style.cssText = "position:fixed; top:12px; left:50%; transform:translateX(-50%); background:rgba(10,10,20,0.9); border:1px solid #ffcc00; padding:6px 18px; border-radius:20px; color:#ffcc00; font-weight:bold; font-size:0.9rem; z-index:9000; box-shadow:0 0 15px rgba(255,204,0,0.3); pointer-events:none; transition:all 0.3s ease;";
        indicador.innerText = "Aguardando sincronização de turnos...";
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
                        indicadorEl.style.boxShadow = "0 0 20px rgba(0,255,102,0.5)";
                        indicadorEl.innerText = "⚔️ É O SEU TURNO DE ATACAR!";
                    } else {
                        indicadorEl.style.background = "rgba(10, 10, 20, 0.9)";
                        indicadorEl.style.borderColor = "#ffcc00";
                        indicadorEl.style.color = "#ffcc00";
                        indicadorEl.style.boxShadow = "0 0 15px rgba(255,204,0,0.3)";
                        indicadorEl.innerText = `⏳ Turno de: ${this.turnoAtual}`;
                    }
                }
            } else if (this.listaJogadores.length > 0) {
                set(turnoRef, this.listaJogadores[0]);
            }
        });
    }

    passarTurno() {
        if (!this.state.roomName || !this.listaJogadores.length) return;
        const indexAtual = this.listaJogadores.indexOf(this.turnoAtual);
        let proximoIndex = indexAtual + 1;
        if (proximoIndex >= this.listaJogadores.length) proximoIndex = 0;
        
        const proximoJogador = this.listaJogadores[proximoIndex];
        set(ref(this.db, `rooms/${this.state.roomName}/turnoAtual`), proximoJogador);
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
    // 4. VALIDAÇÃO DE ATAQUE POR TURNO
    // ==========================================
    validarAtaque(laneAlvo) {
        if (this.emBatalhaComMonstro) {
            this.animacaoTextoFlutuante("Você está em combate contra um monstro!", "#ff4444");
            return false;
        }

        if (this.turnoAtual && this.turnoAtual !== this.state.playerName) {
            this.animacaoTextoFlutuante("Fora de turno! Aguarde sua vez.", "#ffaa00");
            return false;
        }

        if (this.state.lane === "Base") {
            this.aplicarPunicaoPesada("Ataques partindo da Base são proibidos!");
            return false;
        }

        if (laneAlvo && laneAlvo !== this.state.lane) {
            this.aplicarPunicaoPesada("Alvo fora da sua rota atual!");
            return false;
        }

        setTimeout(() => this.passarTurno(), 1500);
        return true;
    }

    // ==========================================
    // 5. PUNIÇÕES E ANTI-ABUSO
    // ==========================================
    aplicarPunicaoPesada(motivo) {
        this.state.gold = Math.max(0, (this.state.gold || 0) - 50);
        this.state.stats.hp = Math.floor(this.state.stats.maxHp * 0.15);
        
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle, rgba(120,0,0,0.85), rgba(0,0,0,0.95)); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:sans-serif; text-align:center; padding:20px;";
        overlay.innerHTML = `
            <div style="font-size:4rem; margin-bottom:10px;">⚠️</div>
            <h1 style="font-size:2.5rem; color:#ff3333; margin:0 0 10px 0;">PUNIÇÃO DO VANGUARD</h1>
            <p style="font-size:1.2rem; max-width:500px; line-height:1.5; color:#ddd;">${motivo}</p>
            <p style="color:#ffaa00; margin-top:15px; font-weight:bold;">Penalidade: -50 Ouro | HP Reduzido a 15%</p>
        `;
        document.body.appendChild(overlay);

        const bloquear = (e) => { e.stopPropagation(); e.preventDefault(); };
        window.addEventListener('click', bloquear, true);
        
        setTimeout(() => {
            overlay.remove();
            window.removeEventListener('click', bloquear, true);
            atualizarUI();
        }, 4000);

        atualizarUI();
    }

    // ==========================================
    // 6. SISTEMA DE JUNGLE COM BATALHA REAL CONTRA O MONSTRO
    // ==========================================
    iniciarSistemaJungleInterativo() {
        setInterval(() => {
            if (Math.random() < 0.3) {
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
        }, 50000);
    }

    anunciarJungle(monstro, lane) {
        if (!this.state.roomName) return;
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: "🌲 JUNGLE",
            text: `Um <strong>${monstro.nome}</strong> apareceu no <strong>${lane}</strong>! Quem chegar primeiro iniciará o combate!`,
            type: "system",
            time: Date.now()
        });
    }

    gerarBotaoCombateMonstro(monstro, lane) {
        let spawned = true;
        
        const checker = setInterval(() => {
            if (!spawned) return clearInterval(checker);

            let container = document.getElementById('jungle-combat-btn-container');
            if (this.state.lane === lane && !this.emBatalhaComMonstro) {
                if (!container) {
                    container = document.createElement('div');
                    container.id = 'jungle-combat-btn-container';
                    container.style.cssText = "position:fixed; bottom:80px; left:50%; transform:translateX(-50%); z-index:8500; text-align:center;";
                    
                    const btn = document.createElement('button');
                    btn.innerHTML = `⚔️ Enfrentar ${monstro.nome}`;
                    btn.style.cssText = "background:linear-gradient(135deg, #ff4e50, #f9d423); color:#000; padding:14px 28px; border:none; border-radius:30px; font-weight:900; font-size:1.1rem; cursor:pointer; box-shadow:0 6px 20px rgba(255,78,80,0.5); transition:transform 0.2s;";
                    
                    btn.onclick = () => {
                        spawned = false;
                        clearInterval(checker);
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

        // O monstro desaparece após 35 segundos se ninguém o enfrentar
        setTimeout(() => {
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
        const maxHpHeroi = this.state.stats.maxHp;

        const modal = document.createElement('div');
        modal.id = 'vanguard-monstro-modal';
        modal.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(5,5,10,0.92); z-index:9999; display:flex; flex-direction:column; justify-content:center; align-items:center; color:#fff; font-family:sans-serif; padding:20px;";
        
        const atualizarConteudoModal = (msgTurno = "Sua vez de agir!") => {
            modal.innerHTML = `
                <div style="background:rgba(20,20,35,0.95); border:2px solid #ff4e50; border-radius:16px; padding:25px; width:100%; max-width:420px; box-shadow:0 10px 30px rgba(0,0,0,0.8); text-align:center;">
                    <h2 style="color:#ff4e50; margin-top:0; margin-bottom:5px;">🔥 COMBATE: ${monstro.nome}</h2>
                    <p style="font-size:0.85rem; color:#aaa; margin-bottom:20px;">Derrote o monstro para garantir sua recompensa!</p>
                    
                    <div style="display:flex; justify-content:space-between; margin-bottom:15px; font-weight:bold; font-size:0.95rem;">
                        <div style="background:rgba(255,0,0,0.2); padding:10px; border-radius:8px; width:45%; border:1px solid rgba(255,0,0,0.4);">
                            <div>❤️ Você</div>
                            <div style="color:#ff4444; font-size:1.1rem; margin-top:4px;">${hpHeroiAtual} / ${maxHpHeroi}</div>
                        </div>
                        <div style="background:rgba(255,100,0,0.2); padding:10px; border-radius:8px; width:45%; border:1px solid rgba(255,100,0,0.4);">
                            <div>👹 Monstro</div>
                            <div style="color:#ffaa00; font-size:1.1rem; margin-top:4px;">${hpMonstroAtual} / ${monstro.hp}</div>
                        </div>
                    </div>

                    <div id="monstro-log-combate" style="background:#0a0a12; padding:10px; border-radius:6px; font-size:0.9rem; color:#00ffcc; margin-bottom:20px; min-height:45px; display:flex; align-items:center; justify-content:center; border:1px solid #222;">
                        ${msgTurno}
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                        <button id="btn-atacar-monstro" style="background:#00ffcc; color:#000; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">⚔️ Atacar</button>
                        <button id="btn-fugir-monstro" style="background:#444; color:#fff; border:none; padding:12px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">🏃 Fugir</button>
                    </div>
                </div>
            `;

            document.getElementById('btn-atacar-monstro').onclick = () => executarTurnoCombate(false);
            document.getElementById('btn-fugir-monstro').onclick = () => finalizarCombate(false, "Você fugiu da batalha!");
        };

        const executarTurnoCombate = (isHabilidade = false) => {
            // Dano do herói
            const danoHeroi = isHabilidade ? (this.state.stats.ap || 15) * 1.5 : (this.state.stats.ad || 10);
            hpMonstroAtual = Math.max(0, hpMonstroAtual - Math.floor(danoHeroi));

            if (hpMonstroAtual <= 0) {
                return finalizarCombate(true, "Você derrotou o monstro!");
            }

            // Contra-ataque do monstro
            const danoMonstro = Math.max(2, monstro.ad - Math.floor((this.state.stats.def || 5) * 0.3));
            hpHeroiAtual = Math.max(0, hpHeroiAtual - danoMonstro);
            this.state.stats.hp = hpHeroiAtual;
            atualizarUI();

            if (hpHeroiAtual <= 0) {
                return finalizarCombate(false, "Você foi abatido pelo monstro...");
            }

            atualizarConteudoModal(`Você causou ${Math.floor(danoHeroi)} de dano! O monstro revidou com ${danoMonstro}.`);
        };

        const finalizarCombate = (vitoria, mensagemFinal) => {
            this.emBatalhaComMonstro = false;
            modal.innerHTML = `
                <div style="background:rgba(20,20,35,0.95); border:2px solid ${vitoria ? '#00ff66' : '#ff4444'}; border-radius:16px; padding:30px; text-align:center; max-width:380px;">
                    <h2 style="color:${vitoria ? '#00ff66' : '#ff4444'}; margin-top:0;">${vitoria ? '🎉 VITÓRIA!' : '💀 DERROTA'}</h2>
                    <p style="font-size:1.1rem; margin:15px 0 25px 0;">${mensagemFinal}</p>
                    <button id="btn-fechar-combate" style="background:${vitoria ? '#00ff66' : '#ff4444'}; color:#000; border:none; padding:12px 24px; border-radius:8px; font-weight:bold; cursor:pointer; font-size:1rem;">Continuar</button>
                </div>
            `;

            if (vitoria) {
                if (monstro.recompensaTipo === "Ouro") {
                    this.state.gold = (this.state.gold || 0) + monstro.recompensaOuro;
                    this.animacaoTextoFlutuante(`+${monstro.recompensaOuro} Ouro da Jungle!`, "#ffd700");
                } else if (monstro.recompensaTipo === "AD") {
                    this.state.stats.ad += 20;
                    this.animacaoTextoFlutuante(`+20 AD Permanente!`, "#00ffff");
                } else {
                    this.state.stats.maxHp += 100;
                    this.state.stats.hp = this.state.stats.maxHp;
                    this.animacaoTextoFlutuante(`+100 HP Máximo!`, "#ff00ff");
                }
            }

            atualizarUI();

            document.getElementById('btn-fechar-combate').onclick = () => {
                modal.remove();
            };
        };

        document.body.appendChild(modal);
        atualizarConteudoModal("O combate começou! Escolha sua ação.");
    }

    // ==========================================
    // 7. INCENTIVOS DE MOVIMENTO & RELÍQUIAS
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
                    this.aplicarPunicaoPesada("Estagnação prolongada na rota detectada. Saia da base ou mude de lane.");
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
            if (Math.random() < 0.35) {
                const laneAleatoria = this.rotasValidas[Math.floor(Math.random() * this.rotasValidas.length)];
                if (laneAleatoria !== this.state.lane) {
                    this.gerarBuffMiniGame(laneAleatoria);
                }
            }
        }, 45000);
    }

    gerarBuffMiniGame(laneAlvo) {
        const aviso = document.createElement('div');
        aviso.style.cssText = "position:fixed; top:55px; left:50%; transform:translateX(-50%); background:rgba(255,215,0,0.9); color:#000; padding:8px 18px; border-radius:20px; z-index:8000; font-weight:bold; font-size:0.9rem; box-shadow:0 4px 15px rgba(255,215,0,0.4);";
        aviso.innerText = `✨ Relíquia de Movimento disponível no ${laneAlvo}!`;
        document.body.appendChild(aviso);
        setTimeout(() => aviso.remove(), 5000);

        const checkInterval = setInterval(() => {
            if (this.state.lane === laneAlvo) {
                clearInterval(checkInterval);
                this.iniciarMiniGameCaptura();
            }
        }, 1000);

        setTimeout(() => clearInterval(checkInterval), 20000);
    }

    iniciarMiniGameCaptura() {
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:9999;";
        
        const alvo = document.createElement('div');
        alvo.style.cssText = "position:absolute; width:55px; height:55px; background:radial-gradient(circle, #fff, #ffd700); border-radius:50%; cursor:pointer; box-shadow:0 0 20px #ffd700;";
        overlay.appendChild(alvo);
        document.body.appendChild(overlay);

        let cliques = 3;

        const moverAlvo = () => {
            alvo.style.left = `${Math.random() * (window.innerWidth - 70)}px`;
            alvo.style.top = `${Math.random() * (window.innerHeight - 70)}px`;
        };

        moverAlvo();
        const loop = setInterval(moverAlvo, 700);

        alvo.onclick = () => {
            cliques--;
            if (cliques <= 0) {
                clearInterval(loop);
                overlay.remove();
                this.animacaoTextoFlutuante("Relíquia Capturada! +40 AD por 15s!", "#ffd700");
                this.state.stats.ad += 40;
                atualizarUI();
                
                setTimeout(() => {
                    this.state.stats.ad -= 40;
                    atualizarUI();
                }, 15000);
            } else {
                moverAlvo();
            }
        };

        setTimeout(() => {
            if (cliques > 0) {
                clearInterval(loop);
                overlay.remove();
                this.animacaoTextoFlutuante("A relíquia desapareceu...", "#777");
            }
        }, 5000);
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.innerText = texto;
        textAnim.style.cssText = `position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); color:${cor}; font-size:1.6rem; font-weight:bold; z-index:10000; text-shadow:2px 2px 0 #000, 0 0 10px ${cor}; pointer-events:none; transition:all 1s ease-out;`;
        document.body.appendChild(textAnim);
        
        setTimeout(() => {
            textAnim.style.top = '28%';
            textAnim.style.opacity = '0';
        }, 50);
        setTimeout(() => textAnim.remove(), 1100);
    }
}
