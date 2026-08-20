// ==========================================
// HERÓI: LITLEGOT (Miraculous da Cabra)
// MECÂNICA: CAVALETE, TINTA (Escala c/ AP), 21 HABILIDADES E ALVOS
// ==========================================
import { ref, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        this.paginaPronta = true;
        this.desenhando = false;
        this.corAtiva = 'red';
        this.alvoSelecionado = 'Inimigo da Rota';
        
        // 7 Cores do Arco-íris / Paleta
        this.tintas = {
            red: { nome: 'Fogo Carnificina', hex: '#ff3333', gasto: { X: 15, O: 30, Z: 60 } },
            orange: { nome: 'Drenagem Vital', hex: '#ff8c00', gasto: { X: 10, O: 25, Z: 50 } },
            yellow: { nome: 'Ouro e Clarão', hex: '#ffff00', gasto: { X: 5, O: 40, Z: 35 } },
            green: { nome: 'Sopro da Natureza', hex: '#00ff00', gasto: { X: 20, O: 35, Z: 55 } },
            blue: { nome: 'Barreiras de Água', hex: '#00bfff', gasto: { X: 15, O: 40, Z: 60 } },
            purple: { nome: 'Sombras de Controle', hex: '#8a2be2', gasto: { X: 25, O: 45, Z: 70 } },
            white: { nome: 'Luz Absoluta (Divino)', hex: '#ffffff', gasto: { X: 50, O: 80, Z: 150 } } // 7ª Cor
        };
    }

    iniciar() {
        this.configurarTintaMecanica();
        this.injetarCavaleteUI();
        this.vincularBotoesUI();
        this.injetarEstilosDeAnimacao();
        
        // Loop que garante que a Tinta Máxima escale com o AP constantemente
        setInterval(() => this.atualizarTintaEstatistica(), 1000);
    }

    // ==========================================
    // ESCALONAMENTO DE TINTA COM AP
    // ==========================================
    configurarTintaMecanica() {
        // Renomeia o texto de Mana para Tinta no painel dinamicamente
        const manaLabel = document.querySelector('.stat-row:nth-child(2) span');
        if (manaLabel) manaLabel.innerText = 'Tinta (Escala c/ AP):';
        
        this.atualizarTintaEstatistica();
        this.state.stats.mana = this.state.stats.maxMana; // Enche a tinta inicial
        atualizarUI();
    }

    atualizarTintaEstatistica() {
        // A Tinta Máxima base é 100 + (AP * 2.5). Se o jogador focar em AP, terá muita tinta!
        const tintaBase = 100;
        const apAtual = this.state.stats.ap || 0;
        this.state.stats.maxMana = Math.floor(tintaBase + (apAtual * 2.5));
        
        if (this.state.stats.mana > this.state.stats.maxMana) {
            this.state.stats.mana = this.state.stats.maxMana;
        }
        atualizarUI();
    }

    // ==========================================
    // UI: INJEÇÃO DO CAVALETE E ALVOS
    // ==========================================
    injetarCavaleteUI() {
        const controleHabilidades = document.querySelector('.skills-controls');
        
        // Injeta a 7ª cor caso não exista no HTML base
        const coresContainer = document.querySelector('.color-palette');
        if (coresContainer && !document.querySelector('[data-color="white"]')) {
            const btnWhite = document.createElement('button');
            btnWhite.className = 'color-btn';
            btnWhite.dataset.color = 'white';
            btnWhite.style.backgroundColor = '#ffffff';
            btnWhite.style.border = '2px solid #ccc';
            coresContainer.appendChild(btnWhite);
        }

        // Injeta o seletor de Alvos do Cavalete
        const cavaleteHTML = document.createElement('div');
        cavaleteHTML.style.marginTop = '15px';
        cavaleteHTML.style.padding = '10px';
        cavaleteHTML.style.border = '1px dashed var(--ouro-antigo)';
        cavaleteHTML.innerHTML = `
            <div style="font-size:0.8rem; color:var(--ouro-brilhante); margin-bottom:5px;">🎨 Foco do Cavalete (Alvo):</div>
            <select id="alvo-cavalete" class="w-full" style="background:#1a1a2e; color:#fff; padding:5px; border:1px solid #333;">
                <option value="Inimigo da Rota">Inimigo (Herói)</option>
                <option value="Minion Inimigo">Minion Inimigo</option>
                <option value="Torre Inimiga">Torre Inimiga</option>
                <option value="Si Mesmo">Si Mesmo</option>
                <option value="Aliado">Aliado</option>
            </select>
        `;
        controleHabilidades.insertBefore(cavaleteHTML, document.getElementById('skill-redraw'));
    }

    vincularBotoesUI() {
        const colorBtns = document.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                colorBtns.forEach(b => b.classList.remove('active-color'));
                e.target.classList.add('active-color');
                this.corAtiva = e.target.dataset.color;
                this.animacaoVisual(this.tintas[this.corAtiva].hex, `Tinta ${this.tintas[this.corAtiva].nome}`);
            });
        });

        document.getElementById('skill-x').addEventListener('click', () => this.usarPagina('X'));
        document.getElementById('skill-o').addEventListener('click', () => this.usarPagina('O'));
        document.getElementById('skill-z').addEventListener('click', () => this.usarPagina('Z'));
        document.getElementById('skill-redraw').addEventListener('click', () => this.desenharNovaPagina());
        
        document.getElementById('alvo-cavalete').addEventListener('change', (e) => {
            this.alvoSelecionado = e.target.value;
        });
    }

    // ==========================================
    // SISTEMA DE PRECISÃO E CUSTO
    // ==========================================
    usarPagina(tecla) {
        if (!this.paginaPronta) return this.animacaoTextoFlutuante("Cavalete Vazio! Desenhe algo.", "#ff0000");
        
        const cor = this.tintas[this.corAtiva];
        const custoTinta = cor.gasto[tecla];

        if (this.state.stats.mana < custoTinta) {
            return this.animacaoTextoFlutuante(`Falta Tinta! Custo: ${custoTinta}`, "#ff0000");
        }

        // Consome página e tinta
        this.paginaPronta = false;
        this.state.stats.mana -= custoTinta;
        this.atualizarBotoesHabilidade(false);

        // Chance de Erro: Base 70% de acerto. Cada nível de Litlegot aumenta 1% de precisão.
        // Tentar atingir alvos distantes (outras rotas) aumenta o erro, mas como estamos focados no alvo local:
        let chanceDeAcerto = 70 + this.state.level; 
        if (chanceDeAcerto > 98) chanceDeAcerto = 98; // Nunca é 100% garantido

        const rolagemDeDado = Math.floor(Math.random() * 100) + 1;
        
        if (rolagemDeDado > chanceDeAcerto) {
            this.animacaoVisual("#555", "O desenho borrou!");
            this.enviarAtaqueParaChat(tecla, cor.nome, `tentou pintar, mas o desenho borrou e errou o alvo (${this.alvoSelecionado})!`, "#777");
            atualizarUI();
            return;
        }

        // Se acertou, roda as 21 mecânicas reais:
        this.executarMecanicaReal(tecla, cor);
    }

    // ==========================================
    // AS 21 MECÂNICAS (EFEITOS MATEMÁTICOS)
    // ==========================================
    executarMecanicaReal(tecla, cor) {
        let efeitoTexto = "";
        const ap = this.state.stats.ap;
        const ad = this.state.stats.ad;
        const alvo = this.alvoSelecionado;

        // VERMELHO: Fogo & Dano
        if (this.corAtiva === 'red') {
            if (tecla === 'X') {
                const dano = Math.floor((ap * 1.5) + (ad * 0.5));
                efeitoTexto = `atirou uma fagulha, causando **${dano} de Dano** em [${alvo}].`;
            } else if (tecla === 'O') {
                const dano = Math.floor(ap * 2);
                efeitoTexto = `pintou um mar de fogo, queimando [${alvo}] por **${dano} de Dano em Área**.`;
            } else if (tecla === 'Z') {
                const dano = Math.floor(ap * 4); // Execução maciça
                efeitoTexto = `desenhou um METEORO, explodindo [${alvo}] com **${dano} de Dano Crítico**!`;
            }
        }
        
        // LARANJA: Drenagem Física/Mágica
        else if (this.corAtiva === 'orange') {
            if (tecla === 'X') {
                const cura = Math.floor(ap * 0.8);
                this.curar(cura);
                efeitoTexto = `golpeou [${alvo}] e drenou a vida, curando Litlegot em **+${cura} HP**.`;
            } else if (tecla === 'O') {
                const reducao = Math.floor(10 + (ap * 0.1));
                efeitoTexto = `corroeu a armadura de [${alvo}], reduzindo suas defesas em **-${reducao}** por 10s.`;
            } else if (tecla === 'Z') {
                this.state.stats.mana += 100; // Rouba tinta
                efeitoTexto = `sugou a essência de [${alvo}], convertendo a dor do inimigo em **+100 de Tinta**!`;
            }
        }

        // AMARELO: Visão e Riqueza (Economia)
        else if (this.corAtiva === 'yellow') {
            if (tecla === 'X') {
                efeitoTexto = `desenhou um Sol em [${this.state.lane}], revelando [${alvo}] oculto nas sombras.`;
            } else if (tecla === 'O') {
                const ouroGerado = Math.floor(20 + (ap * 0.2));
                this.state.gold += ouroGerado;
                efeitoTexto = `transmutou tinta em ouro, ganhando **+${ouroGerado} 🪙** focando em [${alvo}].`;
            } else if (tecla === 'Z') {
                this.state.stats.ms += 50; 
                setTimeout(() => this.state.stats.ms -= 50, 8000);
                efeitoTexto = `pintou asas de luz, ganhando **+50 de Vel. Movimento** por 8 segundos.`;
            }
        }

        // VERDE: Regeneração
        else if (this.corAtiva === 'green') {
            if (tecla === 'X') {
                const cura = Math.floor(ap * 1.5);
                this.curar(cura);
                efeitoTexto = `envolveu [${alvo}] com vinhas curativas, restaurando **+${cura} HP**.`;
            } else if (tecla === 'O') {
                this.state.stats.maxHp += 50; // Buff permanente leve
                this.curar(50);
                efeitoTexto = `reforçou o corpo de [${alvo}], adicionando permanentemente **+50 Vida Máxima**!`;
            } else if (tecla === 'Z') {
                const enraizado = Math.floor(2 + (ap * 0.01));
                efeitoTexto = `desenhou raízes titânicas, paralisando [${alvo}] completamente por **${enraizado} segundos**.`;
            }
        }

        // AZUL: Barreiras e Mana
        else if (this.corAtiva === 'blue') {
            if (tecla === 'X') {
                this.state.stats.def += 30; setTimeout(() => this.state.stats.def -= 30, 6000);
                efeitoTexto = `criou um escudo d'água em [${alvo}], concedendo **+30 Defesa Física** temporária.`;
            } else if (tecla === 'O') {
                this.state.stats.mdef += 40; setTimeout(() => this.state.stats.mdef -= 40, 6000);
                efeitoTexto = `pintou uma redoma de gelo em [${alvo}], concedendo **+40 Defesa Mágica** temporária.`;
            } else if (tecla === 'Z') {
                // Remove CDR temporariamente
                const cdrBonus = 50;
                this.state.stats.cdr += cdrBonus; setTimeout(() => this.state.stats.cdr -= cdrBonus, 5000);
                efeitoTexto = `congelou o tempo para si mesmo, ganhando **+50% de Redução de Recarga** nos próximos 5s!`;
            }
        }

        // ROXO: Debuff e Controle Absoluto
        else if (this.corAtiva === 'purple') {
            if (tecla === 'X') {
                efeitoTexto = `silenciou [${alvo}], impedindo que ele use habilidades no próximo turno.`;
            } else if (tecla === 'O') {
                const danoVerdadeiro = Math.floor(ap * 1.2);
                efeitoTexto = `injetou sombra diretamente na mente de [${alvo}], causando **${danoVerdadeiro} de Dano Verdadeiro**.`;
            } else if (tecla === 'Z') {
                efeitoTexto = `abriu um portal negro embaixo de [${alvo}], enviando-o forçadamente de volta para a Base!`;
            }
        }

        // BRANCO: O Ápice do Miraculous (Divindade)
        else if (this.corAtiva === 'white') {
            if (tecla === 'X') {
                // Purificação
                efeitoTexto = `limpou todas as imperfeições, **Purificando [${alvo}]** de qualquer enraizamento, sangramento ou cegueira.`;
            } else if (tecla === 'O') {
                // Clona atributos brutos (Temporário)
                const boost = Math.floor(ap * 0.5);
                this.state.stats.ad += boost; setTimeout(() => this.state.stats.ad -= boost, 10000);
                efeitoTexto = `desenhou uma cópia divina da sua arma, ganhando **+${boost} de AD** por 10 segundos.`;
            } else if (tecla === 'Z') {
                // Apocalipse da Tinta: Esvazia toda a tinta restante para um dano colossal
                const tintaGasta = this.state.stats.mana;
                const danoCatastrofico = Math.floor((ap * 3) + (tintaGasta * 2));
                this.state.stats.mana = 0; // Zera a tinta
                efeitoTexto = `gastou toda a tinta restante no Cavalete para criar a ARTE FINAL! [${alvo}] sofreu **${danoCatastrofico} de Dano Devastador**.`;
            }
        }

        this.animacaoVisual(cor.hex);
        atualizarUI();
        this.enviarAtaqueParaChat(tecla, cor.nome, efeitoTexto, cor.hex);
    }

    curar(valor) {
        this.state.stats.hp += valor;
        if (this.state.stats.hp > this.state.stats.maxHp) {
            this.state.stats.hp = this.state.stats.maxHp;
        }
    }

    // ==========================================
    // ESCALONAMENTO DE RECARGA (ZERO NO LVL 30)
    // ==========================================
    desenharNovaPagina() {
        if (this.paginaPronta || this.desenhando) return;

        this.desenhando = true;
        const btnRedraw = document.getElementById('skill-redraw');
        btnRedraw.innerText = "Pintando Tela...";
        btnRedraw.style.opacity = "0.5";

        // Matemática: Nível 1 sofre com CD alto (10 segundos). 
        // A cada nível, subtrai ~333ms. Nível 30 = 0s de recarga.
        let tempoBase = 10000 - (this.state.level * 333); 
        if (tempoBase < 0) tempoBase = 0;
        
        let cdFinal = tempoBase * (1 - ((this.state.stats.cdr || 0) / 100));

        if (this.state.level >= 30 || cdFinal <= 100) {
            this.finalizarDesenho();
        } else {
            setTimeout(() => this.finalizarDesenho(), cdFinal);
        }
    }

    finalizarDesenho() {
        this.paginaPronta = true;
        this.desenhando = false;
        const btnRedraw = document.getElementById('skill-redraw');
        btnRedraw.innerText = "Desenhar Nova Página";
        btnRedraw.style.opacity = "1";
        this.atualizarBotoesHabilidade(true);
        this.animacaoTextoFlutuante("Tela Pronta!", "#ffffff");
    }

    atualizarBotoesHabilidade(estado) {
        ['skill-x', 'skill-o', 'skill-z'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.opacity = estado ? "1" : "0.3";
                btn.style.pointerEvents = estado ? "auto" : "none";
            }
        });
    }

    // ==========================================
    // SISTEMA FIREBASE & VISUAL
    // ==========================================
    enviarAtaqueParaChat(tecla, nomeCor, efeito, hexCode) {
        if (!this.state.roomName) return; 
        
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        const msgFormatada = `<span style="color:${hexCode}; font-weight:bold;">[${nomeCor}]</span> Litlegot traçou a Arte ${tecla}: ${efeito}`;
        
        push(chatRef, {
            sender: this.state.playerName,
            text: msgFormatada,
            type: "combat",
            time: Date.now()
        });
    }

    animacaoVisual(corHex, textoDica = null) {
        const flash = document.createElement('div');
        flash.className = 'magia-flash';
        flash.style.backgroundColor = corHex;
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 400);

        if (textoDica) this.animacaoTextoFlutuante(textoDica, corHex);
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.className = 'magia-texto-flutuante';
        textAnim.innerText = texto;
        textAnim.style.color = cor;
        
        document.getElementById('game-screen').appendChild(textAnim);
        setTimeout(() => textAnim.remove(), 1000);
    }

    injetarEstilosDeAnimacao() {
        if (document.getElementById('litlegot-styles')) return;
        const style = document.createElement('style');
        style.id = 'litlegot-styles';
        style.innerHTML = `
            .magia-flash {
                position: fixed;
                top: 0; left: 0; width: 100%; height: 100%;
                opacity: 0.3;
                pointer-events: none;
                z-index: 999;
                animation: fadeOutFlash 0.4s ease-out forwards;
            }
            .magia-texto-flutuante {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                font-family: 'Cinzel', serif;
                font-size: 1.5rem;
                font-weight: bold;
                text-shadow: 0 0 10px #000, 2px 2px 0px #000;
                pointer-events: none;
                z-index: 1000;
                animation: floatUpAndFade 1s ease-out forwards;
            }
            @keyframes fadeOutFlash { 0% { opacity: 0.3; } 100% { opacity: 0; } }
            @keyframes floatUpAndFade {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
                50% { opacity: 1; transform: translate(-50%, -80%) scale(1.1); }
                100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}
