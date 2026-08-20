// ==========================================
// HERÓI: LITLEGOT (Miraculous da Cabra)
// MECÂNICA: CAVALETE (CANVAS REAL), TINTA ESTÁTICA, MINIGAME DE FARM, 21 HABILIDADES ATIVAS
// ==========================================
import { ref, push, update } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        this.paginaPronta = true;
        this.corAtiva = 'red';
        this.nivelHabilidadeAtivo = 'X'; // Prepara qual golpe será desenhado (X, O ou Z)
        this.alvoSelecionado = 'Inimigo da Rota';
        
        // Coordenadas do Canvas
        this.isDrawing = false;
        this.traços = 0; // Conta o quão longo foi o desenho
        
        // 7 Cores do Arco-íris / Paleta
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', gasto: { X: 15, O: 30, Z: 60 } },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', gasto: { X: 10, O: 25, Z: 50 } },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', gasto: { X: 5, O: 40, Z: 35 } },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', gasto: { X: 20, O: 35, Z: 55 } },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', gasto: { X: 15, O: 40, Z: 60 } },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', gasto: { X: 25, O: 45, Z: 70 } },
            white: { nome: 'Artefato Divino', hex: '#ffffff', gasto: { X: 50, O: 80, Z: 150 } }
        };
    }

    iniciar() {
        this.configurarTintaMecanica();
        this.injetarEstilos();
        this.injetarCavaleteUI();
        this.injetarMinigameFarm();
        this.vincularBotoesUI();
        
        // Loop que garante que a Tinta Máxima escale com o AP constantemente
        // MAS NÃO REGENERA A TINTA!
        setInterval(() => this.atualizarMaxTinta(), 2000);
    }

    // ==========================================
    // ESCALONAMENTO DE TINTA E BASE
    // ==========================================
    configurarTintaMecanica() {
        const manaLabel = document.querySelector('.stat-row:nth-child(2) span') || document.querySelector('.mana-label');
        if (manaLabel) manaLabel.innerText = 'Tinta (Base p/ Recarregar):';
        
        this.atualizarMaxTinta();
        this.state.stats.mana = this.state.stats.maxMana; // Inicia cheio
        atualizarUI();
    }

    atualizarMaxTinta() {
        const tintaBase = 100;
        const apAtual = this.state.stats.ap || 0;
        const maxTintaCalculada = Math.floor(tintaBase + (apAtual * 3.0)); // Escala com AP
        
        this.state.stats.maxMana = maxTintaCalculada;
        
        // Garante que não ultrapasse o máximo, mas NUNCA regenera sozinho
        if (this.state.stats.mana > this.state.stats.maxMana) {
            this.state.stats.mana = this.state.stats.maxMana;
        }
        atualizarUI();
    }

    voltarParaBase() {
        this.animacaoTextoFlutuante("Retornando à Base... Tinta Restaurada!", "#ffffff");
        setTimeout(() => {
            this.state.stats.mana = this.state.stats.maxMana;
            this.state.stats.hp = this.state.stats.maxHp;
            atualizarUI();
        }, 3000); // 3 segundos de cast para voltar à base
    }

    // ==========================================
    // UI: CAVALETE INTERATIVO (CANVAS)
    // ==========================================
    injetarCavaleteUI() {
        const controleHabilidades = document.querySelector('.skills-controls') || document.getElementById('game-screen');
        if (!controleHabilidades || document.getElementById('cavalete-container')) return;

        const container = document.createElement('div');
        container.id = 'cavalete-container';
        container.innerHTML = `
            <div style="background:#111; padding:10px; border:2px solid var(--ouro-antigo, #c5a059); border-radius:8px; margin-top:15px;">
                <h4 style="color:#fff; text-align:center; margin:0 0 10px 0;">🎨 Tela de Pintura</h4>
                
                <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                    <select id="alvo-cavalete" style="background:#222; color:#fff; padding:5px; border:1px solid #444; width:48%;">
                        <option value="Inimigo da Rota">Inimigo</option>
                        <option value="Minion Inimigo">Minion</option>
                        <option value="Aliado">Aliado</option>
                        <option value="Si Mesmo">Si Mesmo</option>
                    </select>
                    <select id="nivel-skill" style="background:#222; color:#fff; padding:5px; border:1px solid #444; width:48%;">
                        <option value="X">Nível X (Leve)</option>
                        <option value="O">Nível O (Médio)</option>
                        <option value="Z">Nível Z (Supremo)</option>
                    </select>
                </div>

                <div style="position:relative; width:100%; height:200px; background:#fffbea; border-radius:4px; overflow:hidden;" id="canvas-wrapper">
                    <canvas id="cavalete-canvas" style="width:100%; height:100%; cursor:crosshair; touch-action:none;"></canvas>
                    <div id="aviso-canvas" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); color:#888; pointer-events:none; font-weight:bold; opacity:0.5;">Desenhe o Golpe Aqui</div>
                </div>

                <div style="display:flex; justify-content:space-between; margin-top:10px;">
                    <button id="btn-base" style="background:#4a90e2; color:white; padding:8px; border:none; border-radius:4px; width:48%;">🏰 Voltar à Base</button>
                    <button id="skill-redraw" style="background:#e67e22; color:white; padding:8px; border:none; border-radius:4px; width:48%;">🔄 Limpar Tela</button>
                </div>
            </div>
        `;
        
        controleHabilidades.appendChild(container);
        this.configurarEventosCanvas();
    }

    configurarEventosCanvas() {
        const canvas = document.getElementById('cavalete-canvas');
        const ctx = canvas.getContext('2d');
        const wrapper = document.getElementById('canvas-wrapper');
        const aviso = document.getElementById('aviso-canvas');
        
        // Ajusta tamanho real do canvas
        canvas.width = wrapper.clientWidth;
        canvas.height = wrapper.clientHeight;

        const startDraw = (e) => {
            if (!this.paginaPronta) return;
            e.preventDefault();
            this.isDrawing = true;
            this.traços = 0;
            aviso.style.display = 'none';
            ctx.beginPath();
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            ctx.moveTo(x, y);
            
            ctx.strokeStyle = this.tintas[this.corAtiva].hex;
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
        };

        const draw = (e) => {
            if (!this.isDrawing || !this.paginaPronta) return;
            e.preventDefault();
            
            const rect = canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            
            ctx.lineTo(x, y);
            ctx.stroke();
            this.traços++; // Mede a intensidade do desenho
        };

        const stopDraw = () => {
            if (!this.isDrawing) return;
            this.isDrawing = false;
            ctx.closePath();

            if (this.traços > 10) {
                // Desenho validado, executar habilidade!
                this.usarPagina();
            } else {
                // Desenho muito curto, ignorar
                this.limparCanvas();
                aviso.style.display = 'block';
            }
        };

        // Eventos Mobile e PC
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDraw);
        canvas.addEventListener('mouseout', stopDraw);

        canvas.addEventListener('touchstart', startDraw, {passive: false});
        canvas.addEventListener('touchmove', draw, {passive: false});
        canvas.addEventListener('touchend', stopDraw);
    }

    limparCanvas() {
        const canvas = document.getElementById('cavalete-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.getElementById('aviso-canvas').style.display = 'block';
    }

    vincularBotoesUI() {
        // Cores
        const colorBtns = document.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.corAtiva = e.target.dataset.color;
                this.animacaoTextoFlutuante(`Tinta ${this.tintas[this.corAtiva].nome}`, this.tintas[this.corAtiva].hex);
            });
        });

        // Configurações
        document.getElementById('alvo-cavalete')?.addEventListener('change', (e) => this.alvoSelecionado = e.target.value);
        document.getElementById('nivel-skill')?.addEventListener('change', (e) => this.nivelHabilidadeAtivo = e.target.value);
        document.getElementById('skill-redraw')?.addEventListener('click', () => this.desenharNovaPagina());
        document.getElementById('btn-base')?.addEventListener('click', () => this.voltarParaBase());
        document.getElementById('btn-farm-minigame')?.addEventListener('click', () => this.iniciarMinigameFarm());
    }

    // ==========================================
    // SISTEMA DE PRECISÃO E CUSTO DE HABILIDADE
    // ==========================================
    usarPagina() {
        const tecla = this.nivelHabilidadeAtivo;
        const cor = this.tintas[this.corAtiva];
        const custoTinta = cor.gasto[tecla];

        if (this.state.stats.mana < custoTinta) {
            this.limparCanvas();
            return this.animacaoTextoFlutuante(`Falta Tinta! (Custo: ${custoTinta})`, "#ff0000");
        }

        this.paginaPronta = false;
        this.state.stats.mana -= custoTinta;
        document.getElementById('cavalete-canvas').style.pointerEvents = 'none';
        document.getElementById('cavalete-canvas').style.opacity = '0.5';

        // Rolagem de Dado Interno (Falha Crítica)
        let chanceDeAcerto = 75 + Math.floor(this.state.level / 2); 
        if (chanceDeAcerto > 95) chanceDeAcerto = 95;

        if ((Math.random() * 100) > chanceDeAcerto) {
            this.animacaoEfeitoVisual("#555555", "borrão");
            this.enviarAtaqueParaChat(tecla, cor.nome, `borrou a tela acidentalmente e perdeu a tinta!`, "#777");
            atualizarUI();
            return;
        }

        this.executarMecanicaReal(tecla, cor);
    }

    // ==========================================
    // AS 21 MECÂNICAS (AGORA COM EFEITOS REAIS DE STATUS)
    // ==========================================
    executarMecanicaReal(tecla, cor) {
        let efeitoTexto = "";
        const ap = this.state.stats.ap || 0;
        const ad = this.state.stats.ad || 0;
        const alvo = this.alvoSelecionado;
        const ehInimigo = alvo.includes("Inimigo");

        // VERMELHO (DANO E QUEIMADURA)
        if (this.corAtiva === 'red') {
            if (tecla === 'X') {
                const dano = Math.floor((ap * 1.5) + (ad * 0.5));
                efeitoTexto = `atirou uma fagulha perfurante, causando **${dano} de Dano** em [${alvo}].`;
                this.animacaoEfeitoVisual(cor.hex, 'explosao-pequena');
            } else if (tecla === 'O') {
                const dano = Math.floor(ap * 2);
                efeitoTexto = `pintou um mar de fogo! [${alvo}] queimará recebendo **${dano} de Dano** ao longo do tempo.`;
                this.animacaoEfeitoVisual(cor.hex, 'fogo-area');
                // Simulação de DoT
            } else if (tecla === 'Z') {
                const dano = Math.floor(ap * 4.5);
                efeitoTexto = `desenhou um METEORO GIGANTE, obliterando [${alvo}] com **${dano} de Dano Crítico**!`;
                this.animacaoEfeitoVisual(cor.hex, 'explosao-meteoro');
            }
        }
        // LARANJA (VAMPIRISMO E DEBUFFS)
        else if (this.corAtiva === 'orange') {
            if (tecla === 'X') {
                const cura = Math.floor(ap * 1.2);
                this.curar(cura);
                efeitoTexto = `drenou a vida de [${alvo}], curando Litlegot em **+${cura} HP**.`;
                this.animacaoEfeitoVisual(cor.hex, 'drenar');
            } else if (tecla === 'O') {
                efeitoTexto = `corroeu a armadura de [${alvo}], reduzindo drasticamente suas defesas por 10s.`;
                // Debuff real inimigo via banco (simplificado no chat para leitura)
            } else if (tecla === 'Z') {
                const curaHP = Math.floor(ap * 2);
                this.curar(curaHP);
                this.state.stats.mana += 80; // Apenas essa skill recupera tinta fora da base
                efeitoTexto = `sugou a alma de [${alvo}], restaurando **+${curaHP} HP** e forçando **+80 de Tinta**!`;
            }
        }
        // AMARELO (VISÃO E VELOCIDADE)
        else if (this.corAtiva === 'yellow') {
            if (tecla === 'X') {
                efeitoTexto = `desenhou um Sol, concedendo Visão Verdadeira do mapa e revelando [${alvo}].`;
            } else if (tecla === 'O') {
                const ouroGerado = Math.floor(30 + (ap * 0.3));
                this.state.gold += ouroGerado;
                efeitoTexto = `transmutou poeira em ouro usando [${alvo}], garantindo **+${ouroGerado} 🪙**.`;
            } else if (tecla === 'Z') {
                this.state.stats.ms += 80; 
                setTimeout(() => { this.state.stats.ms -= 80; atualizarUI(); }, 8000);
                efeitoTexto = `pintou rodas de luz nos pés! Litlegot ganha **+80 Vel. Movimento** por 8s.`;
                this.animacaoEfeitoVisual(cor.hex, 'buff-velocidade');
            }
        }
        // VERDE (CURA E CONTROLE)
        else if (this.corAtiva === 'green') {
            if (tecla === 'X') {
                const cura = Math.floor(ap * 1.5);
                if (!ehInimigo) this.curar(cura); // Cura aliado ou si mesmo
                efeitoTexto = `envolveu [${alvo}] com vinhas curativas, restaurando **+${cura} HP**.`;
            } else if (tecla === 'O') {
                const bonusVida = Math.floor(ap * 1.0);
                this.state.stats.maxHp += bonusVida;
                this.curar(bonusVida);
                efeitoTexto = `reforçou a biologia de [${alvo}], adicionando **+${bonusVida} Vida Máxima** permanente!`;
            } else if (tecla === 'Z') {
                efeitoTexto = `desenhou raízes titânicas de Yggdrasil, enraizando [${alvo}] completamente por 4 segundos.`;
                this.animacaoEfeitoVisual(cor.hex, 'raizes');
            }
        }
        // AZUL (DEFESA E TEMPO)
        else if (this.corAtiva === 'blue') {
            if (tecla === 'X') {
                this.state.stats.def += 50; setTimeout(() => { this.state.stats.def -= 50; atualizarUI(); }, 8000);
                efeitoTexto = `criou uma armadura de Safira em [${alvo}], ganhando **+50 Defesa Física** por 8s.`;
            } else if (tecla === 'O') {
                this.state.stats.mdef += 50; setTimeout(() => { this.state.stats.mdef -= 50; atualizarUI(); }, 8000);
                efeitoTexto = `desenhou um prisma místico em [${alvo}], ganhando **+50 Defesa Mágica** por 8s.`;
            } else if (tecla === 'Z') {
                const cdrBonus = 60;
                this.state.stats.cdr += cdrBonus; setTimeout(() => { this.state.stats.cdr -= cdrBonus; atualizarUI(); }, 6000);
                efeitoTexto = `dobrou o tecido do tempo! Ganhou **+60% de Redução de Recarga** por 6s.`;
                this.animacaoEfeitoVisual(cor.hex, 'relogio');
            }
        }
        // ROXO (CONTROLE PROFUNDO)
        else if (this.corAtiva === 'purple') {
            if (tecla === 'X') {
                efeitoTexto = `amordaçou [${alvo}] com tinta sombria, aplicando **Silêncio** por 3s.`;
            } else if (tecla === 'O') {
                const danoVerdadeiro = Math.floor(ap * 1.5);
                efeitoTexto = `perfurou a sanidade de [${alvo}], causando **${danoVerdadeiro} de Dano Verdadeiro**.`;
                this.animacaoEfeitoVisual(cor.hex, 'dano-verdadeiro');
            } else if (tecla === 'Z') {
                efeitoTexto = `abriu um BURACO NEGRO embaixo de [${alvo}], banindo-o instantaneamente para a Base!`;
                this.animacaoEfeitoVisual(cor.hex, 'buraco-negro');
            }
        }
        // BRANCO (CRIAÇÃO DE ITENS E ULTIMATE)
        else if (this.corAtiva === 'white') {
            if (tecla === 'X') {
                efeitoTexto = `passou uma borracha divina, **Purificando [${alvo}]** de lentidões, sangramentos e atordoamentos.`;
            } else if (tecla === 'O') {
                const boost = Math.floor(ap * 0.8);
                this.state.stats.ad += boost; setTimeout(() => { this.state.stats.ad -= boost; atualizarUI(); }, 12000);
                efeitoTexto = `materializou uma arma perfeita para [${alvo}], concedendo **+${boost} de AD** por 12s.`;
            } else if (tecla === 'Z') {
                // MECÂNICA DE CRIAÇÃO DE ITEM TEMPORÁRIO (Sacrifício de Sangue)
                const limiteSeguranca = this.state.stats.maxHp * 0.25;
                const custoHpLitlegot = Math.floor(this.state.stats.maxHp * 0.30);
                
                if (this.state.stats.hp <= limiteSeguranca) {
                    efeitoTexto = `tentou desenhar o Artefato Divino, mas o sistema bloqueou (HP abaixo de 25%) para evitar morte!`;
                } else {
                    this.state.stats.hp -= custoHpLitlegot; // Drena a vida do Litlegot
                    const statusBoost = Math.floor(ap * 1.2);
                    
                    // Buff massivo temporário que simula um item de Tier 3
                    this.state.stats.ad += statusBoost;
                    this.state.stats.ap += statusBoost;
                    setTimeout(() => {
                        this.state.stats.ad -= statusBoost;
                        this.state.stats.ap -= statusBoost;
                        atualizarUI();
                        this.enviarAtaqueParaChat('Info', 'Branco', `O Artefato Divino de [${alvo}] se desfez.`, '#ccc');
                    }, 20000); // Dura 20 segundos

                    efeitoTexto = `sacrificou **${custoHpLitlegot} de HP** para materializar um **ARTEFATO DIVINO** fora da base! [${alvo}] ganha +${statusBoost} AD e AP por 20s (Custa vida do alvo também)!`;
                    this.animacaoEfeitoVisual('#ffffff', 'explosao-divina');
                }
            }
        }

        atualizarUI();
        this.enviarAtaqueParaChat(tecla, cor.nome, efeitoTexto, cor.hex);
    }

    curar(valor) {
        this.state.stats.hp += valor;
        if (this.state.stats.hp > this.state.stats.maxHp) {
            this.state.stats.hp = this.state.stats.maxHp;
        }
        this.animacaoTextoFlutuante(`+${valor} HP`, "#00ff00");
    }

    // ==========================================
    // RECARGA DA TELA DE PINTURA (COOLDOWN)
    // ==========================================
    desenharNovaPagina() {
        if (this.isDrawing) return; // Não recarrega no meio do desenho
        
        this.limparCanvas();
        this.paginaPronta = false;
        
        const canvas = document.getElementById('cavalete-canvas');
        canvas.style.pointerEvents = 'none';
        canvas.style.opacity = '0.3';
        document.getElementById('aviso-canvas').innerText = "Trocando Tela...";
        document.getElementById('aviso-canvas').style.display = 'block';

        let tempoBase = 8000 - (this.state.level * 200); 
        if (tempoBase < 1000) tempoBase = 1000;
        
        let cdFinal = tempoBase * (1 - ((this.state.stats.cdr || 0) / 100));

        setTimeout(() => {
            this.paginaPronta = true;
            canvas.style.pointerEvents = 'auto';
            canvas.style.opacity = '1';
            document.getElementById('aviso-canvas').innerText = "Desenhe o Golpe Aqui";
            this.animacaoTextoFlutuante("Tela Nova Pronta!", "#ffffff");
        }, cdFinal);
    }

    // ==========================================
    // MINIGAME DE FARM HARDCORE
    // ==========================================
    injetarMinigameFarm() {
        const areaAcoes = document.querySelector('.action-buttons') || document.getElementById('game-screen');
        if (!areaAcoes || document.getElementById('btn-farm-minigame')) return;

        const btnFarm = document.createElement('button');
        btnFarm.id = 'btn-farm-minigame';
        btnFarm.innerHTML = "🌾 Farmar (Minigame)";
        btnFarm.style.cssText = "background: #27ae60; color: #fff; padding: 10px; border: none; border-radius: 5px; width: 100%; margin-top: 10px; font-weight: bold; font-size: 1.1em;";
        areaAcoes.appendChild(btnFarm);

        // Container do Minigame (Invisível até ativar)
        const mgContainer = document.createElement('div');
        mgContainer.id = 'minigame-container';
        mgContainer.style.cssText = "display:none; position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:90%; max-width:400px; background:#2c3e50; padding:20px; border-radius:10px; box-shadow:0 0 20px #000; z-index:9999; text-align:center;";
        mgContainer.innerHTML = `
            <h3 style="color:#f1c40f; margin-bottom:15px;">Ataque Sincronizado!</h3>
            <div style="position:relative; width:100%; height:30px; background:#34495e; border-radius:15px; overflow:hidden; border:2px solid #000;">
                <div id="mg-zona-sucesso" style="position:absolute; height:100%; width:15%; background:#2ecc71; left:42.5%;"></div>
                <div id="mg-cursor" style="position:absolute; height:130%; width:4px; background:#e74c3c; top:-15%; left:0;"></div>
            </div>
            <button id="mg-btn-acao" style="margin-top:20px; padding:15px 30px; background:#e67e22; color:white; font-size:1.2em; border:none; border-radius:8px; width:100%;">GOLPEAR!</button>
        `;
        document.body.appendChild(mgContainer);
    }

    iniciarMinigameFarm() {
        if (this.mgAtivo) return;
        this.mgAtivo = true;

        const container = document.getElementById('minigame-container');
        const cursor = document.getElementById('mg-cursor');
        const btnAcao = document.getElementById('mg-btn-acao');
        container.style.display = 'block';

        let pos = 0;
        let direcao = 1;
        // Velocidade baseada no AP (quanto mais forte, mais rápido/difícil fica)
        const velocidade = 2 + (this.state.stats.ap * 0.02);

        const loop = setInterval(() => {
            pos += direcao * velocidade;
            if (pos >= 98 || pos <= 0) direcao *= -1;
            cursor.style.left = `${pos}%`;
        }, 16);

        // Ação de Clique única
        btnAcao.onclick = () => {
            clearInterval(loop);
            this.mgAtivo = false;
            container.style.display = 'none';
            btnAcao.onclick = null;

            // Avaliação do Hit (Zona verde entre 42.5% e 57.5%)
            if (pos >= 42.5 && pos <= 57.5) {
                const goldGanho = Math.floor(15 + (this.state.level * 2));
                const xpGanho = Math.floor(20 + this.state.level);
                this.state.gold += goldGanho;
                this.state.exp += xpGanho;
                this.animacaoTextoFlutuante(`Farm Perfeito! +${goldGanho} 🪙`, "#f1c40f");
                this.enviarAtaqueParaChat('Farm', 'Verde', `Executou um minion com perfeição! (+${goldGanho} Ouro)`, '#2ecc71');
            } else {
                const danoRecebido = Math.floor(this.state.stats.maxHp * 0.05); // Perde 5% da vida se errar
                this.state.stats.hp -= danoRecebido;
                this.animacaoTextoFlutuante(`Falhou! -${danoRecebido} HP`, "#e74c3c");
            }
            atualizarUI();
        };
    }

    // ==========================================
    // ANIMAÇÕES AVANÇADAS E FIREBASE
    // ==========================================
    enviarAtaqueParaChat(tecla, nomeCor, efeito, hexCode) {
        if (!this.state.roomName) return; 
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        push(chatRef, {
            sender: this.state.playerName,
            text: `<span style="color:${hexCode}; font-weight:bold; text-shadow:1px 1px 0px #000;">[🖌️ Arte ${tecla} - ${nomeCor}]</span> Litlegot ${efeito}`,
            type: "combat",
            time: Date.now()
        });
    }

    animacaoEfeitoVisual(corHex, tipo) {
        // Flash na tela
        const flash = document.createElement('div');
        flash.style.cssText = `position:fixed; top:0; left:0; width:100%; height:100%; background:${corHex}; opacity:0.4; pointer-events:none; z-index:9000; transition: opacity 0.5s;`;
        document.body.appendChild(flash);
        
        // Partícula Centralizada
        const particula = document.createElement('div');
        particula.style.cssText = `position:fixed; top:50%; left:50%; transform:translate(-50%, -50%); width:100px; height:100px; background:radial-gradient(circle, ${corHex} 0%, transparent 70%); pointer-events:none; z-index:9001; animation: explodir 0.6s ease-out forwards; border-radius:50%;`;
        document.body.appendChild(particula);

        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => { flash.remove(); particula.remove(); }, 500);
        }, 100);
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.innerText = texto;
        textAnim.style.cssText = `position:fixed; top:40%; left:50%; transform:translate(-50%, -50%); color:${cor}; font-family:'Arial Black', sans-serif; font-size:1.8rem; text-shadow:2px 2px 4px #000, -1px -1px 0 #000; pointer-events:none; z-index:9999; animation: floatUpText 1.2s ease-out forwards; text-align:center; width:100%;`;
        document.body.appendChild(textAnim);
        setTimeout(() => textAnim.remove(), 1200);
    }

    injetarEstilos() {
        if (document.getElementById('litlegot-styles')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles';
        style.innerHTML = `
            @keyframes explodir {
                0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
                100% { transform: translate(-50%, -50%) scale(5); opacity: 0; }
            }
            @keyframes floatUpText {
                0% { opacity: 0; transform: translate(-50%, -30%) scale(0.5); }
                20% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
                80% { opacity: 1; transform: translate(-50%, -80%) scale(1); }
                100% { opacity: 0; transform: translate(-50%, -100%) scale(0.8); }
            }
        `;
        document.head.appendChild(style);
    }
}
