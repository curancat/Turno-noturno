// ==========================================
// HERÓI: LITLEGOT (Miraculous da Cabra)
// ==========================================
import { ref, push } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { atualizarUI } from "../app.js";

export default class Litlegot {
    constructor(gameState, db) {
        this.state = gameState;
        this.db = db;
        
        // Estado exclusivo do herói
        this.paginaPronta = true;
        this.corAtiva = 'red'; // Começa com vermelho (Fogo)
        this.desenhando = false;
        
        // Dicionário de Cores e Efeitos
        this.tintas = {
            red: { nome: 'Fogo', hex: '#ff3333', fx: 'Explosão Escaldante' },
            orange: { nome: 'Vampirismo', hex: '#ff8c00', fx: 'Drenagem Vital' },
            green: { nome: 'Cura', hex: '#00ff00', fx: 'Sopro da Natureza' },
            yellow: { nome: 'Luz/Visão', hex: '#ffff00', fx: 'Clarão Revelador' },
            blue: { nome: 'Escudo', hex: '#00bfff', fx: 'Barreira de Tinta' },
            purple: { nome: 'Controle', hex: '#8a2be2', fx: 'Prisão de Pigmentos' }
        };
    }

    // Método chamado pelo app.js quando o herói é carregado
    iniciar() {
        this.vincularBotoesUI();
        this.injetarEstilosDeAnimacao();
        console.log("Litlegot está pronto para pintar o campo de batalha!");
        
        // Ajuste de atributos base do Litlegot
        this.state.stats.maxMana = 200; // Tinta
        this.state.stats.mana = 200;
        atualizarUI();
    }

    // ==========================================
    // VÍNCULO DOS BOTÕES DO HTML
    // ==========================================
    vincularBotoesUI() {
        // Seletores de Cor
        const colorBtns = document.querySelectorAll('.color-btn');
        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove a classe de ativo de todos e coloca no clicado
                colorBtns.forEach(b => b.classList.remove('active-color'));
                e.target.classList.add('active-color');
                
                // Muda a cor ativa
                this.corAtiva = e.target.dataset.color;
                this.animacaoVisual(this.tintas[this.corAtiva].hex, `Tinta ${this.tintas[this.corAtiva].nome} Equipada!`);
            });
        });

        // Botões de Habilidade (X, O, Z)
        document.getElementById('skill-x').addEventListener('click', () => this.usarPagina('X'));
        document.getElementById('skill-o').addEventListener('click', () => this.usarPagina('O'));
        document.getElementById('skill-z').addEventListener('click', () => this.usarPagina('Z'));

        // Botão de Redesenhar Página
        document.getElementById('skill-redraw').addEventListener('click', () => this.desenharNovaPagina());
    }

    // ==========================================
    // LÓGICA DE COMBATE (X, O, Z)
    // ==========================================
    usarPagina(tecla) {
        if (!this.paginaPronta) {
            return this.animacaoTextoFlutuante("Página em Branco! Desenhe outra primeiro.", "#ff0000");
        }
        if (this.state.stats.mana < 10) {
            return this.animacaoTextoFlutuante("Sem tinta (Mana) suficiente!", "#ff0000");
        }

        // Consome a página e a tinta (mana)
        this.paginaPronta = false;
        this.state.stats.mana -= 10;
        
        // Desativa visualmente os botões
        this.atualizarBotoesHabilidade(false);

        const cor = this.tintas[this.corAtiva];
        let efeitoMecanico = "";

        // Lógica de Efeitos baseados na Cor
        switch (this.corAtiva) {
            case 'red': // Dano Fogo
                efeitoMecanico = `causou dano mágico (${this.state.stats.ap + 30}) em área.`;
                this.animacaoVisual(cor.hex);
                break;
            case 'orange': // Vampirismo
                const curaDrenagem = Math.floor(15 + (this.state.stats.ap * 0.2));
                this.curarLitlegot(curaDrenagem);
                efeitoMecanico = `drenou ${curaDrenagem} de vida dos inimigos próximos.`;
                this.animacaoVisual(cor.hex);
                break;
            case 'green': // Cura Pura
                const curaPura = Math.floor(30 + (this.state.stats.ap * 0.4));
                this.curarLitlegot(curaPura);
                efeitoMecanico = `curou a si mesmo/aliados em ${curaPura} HP.`;
                this.animacaoVisual(cor.hex);
                break;
            case 'yellow': // Visão
                efeitoMecanico = `iluminou a escuridão! (Revelando unidades na Rota: ${this.state.lane}).`;
                this.animacaoVisual(cor.hex);
                document.getElementById('chat-log').style.boxShadow = "inset 0 0 50px rgba(255, 255, 0, 0.2)";
                setTimeout(() => document.getElementById('chat-log').style.boxShadow = "none", 5000);
                break;
            case 'blue': // Escudo
                this.state.stats.def += 15;
                this.state.stats.mdef += 15;
                efeitoMecanico = `criou uma barreira (Ganhando +15 DEF/MDEF Temporário).`;
                this.animacaoVisual(cor.hex);
                // Remove o buff após 5 segundos
                setTimeout(() => {
                    this.state.stats.def -= 15;
                    this.state.stats.mdef -= 15;
                    atualizarUI();
                }, 5000);
                break;
            case 'purple': // Controle de Grupo (CC)
                efeitoMecanico = `enraizou os inimigos próximos por 2 segundos.`;
                this.animacaoVisual(cor.hex);
                break;
        }

        atualizarUI();

        // Dispara mensagem no Firebase para o Chat de Combate
        this.enviarAtaqueParaChat(tecla, cor.nome, efeitoMecanico, cor.hex);
    }

    // ==========================================
    // LÓGICA DE RECARGA (O Pulo do Gato do Nível 30)
    // ==========================================
    desenharNovaPagina() {
        if (this.paginaPronta || this.desenhando) return;

        this.desenhando = true;
        const btnRedraw = document.getElementById('skill-redraw');
        btnRedraw.innerText = "Desenhando...";
        btnRedraw.style.opacity = "0.5";

        // Matemática da Recarga: 
        // Nível 1: ~4.5 segundos. Nível 30: 0 segundos.
        // CD Máximo de 1% (CDR de itens) também afeta!
        let tempoBase = 5000 - (this.state.level * 166); // Reduz ~166ms por nível
        if (tempoBase < 0) tempoBase = 0;
        
        // Aplica o CDR (Redução de Tempo de Recarga dos itens)
        let cdFinal = tempoBase * (1 - (this.state.stats.cdr / 100));

        // Se o nível for 30 ou o CD ficar menor que 100ms, é instantâneo (metralhadora)
        if (this.state.level >= 30 || cdFinal < 100) {
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
        this.animacaoTextoFlutuante("Página Pronta!", "#ffffff");
    }

    atualizarBotoesHabilidade(estado) {
        const botoes = [document.getElementById('skill-x'), document.getElementById('skill-o'), document.getElementById('skill-z')];
        botoes.forEach(b => {
            b.style.opacity = estado ? "1" : "0.3";
            b.style.pointerEvents = estado ? "auto" : "none";
        });
    }

    curarLitlegot(valor) {
        this.state.stats.hp += valor;
        if (this.state.stats.hp > this.state.stats.maxHp) {
            this.state.stats.hp = this.state.stats.maxHp;
        }
    }

    // ==========================================
    // INTEGRAÇÃO COM FIREBASE (CHAT)
    // ==========================================
    enviarAtaqueParaChat(tecla, nomeCor, efeito, hexCode) {
        if (!this.state.roomName) return; // Só envia se estiver em uma sala
        
        const chatRef = ref(this.db, `rooms/${this.state.roomName}/chat`);
        
        // Cria uma mensagem destacada (em HTML) para o chat do jogo
        const msgFormatada = `<span style="color:${hexCode}; font-weight:bold;">[${nomeCor}]</span> Litlegot usou a técnica [${tecla}]: ${efeito}`;
        
        push(chatRef, {
            sender: this.state.playerName,
            text: msgFormatada,
            type: "combat", // Tipo combate para destacar no CSS se necessário
            time: Date.now()
        });
    }

    // ==========================================
    // SISTEMA DE ANIMAÇÕES VISUAIS (EFEITOS TELA)
    // ==========================================
    animacaoVisual(corHex, textoDica = null) {
        // Efeito 1: Piscar a tela com a cor da magia
        const flash = document.createElement('div');
        flash.className = 'magia-flash';
        flash.style.backgroundColor = corHex;
        document.body.appendChild(flash);
        
        // Remove o flash da memória após a animação
        setTimeout(() => flash.remove(), 400);

        // Efeito 2: Texto flutuante no meio da tela
        if (textoDica) {
            this.animacaoTextoFlutuante(textoDica, corHex);
        }
    }

    animacaoTextoFlutuante(texto, cor) {
        const textAnim = document.createElement('div');
        textAnim.className = 'magia-texto-flutuante';
        textAnim.innerText = texto;
        textAnim.style.color = cor;
        
        // Posiciona no meio do painel de jogo
        const container = document.getElementById('game-screen');
        container.appendChild(textAnim);
        
        setTimeout(() => textAnim.remove(), 1000);
    }

    injetarEstilosDeAnimacao() {
        // Injeta CSS dinâmico apenas para os efeitos especiais das magias
        const style = document.createElement('style');
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
            @keyframes fadeOutFlash {
                0% { opacity: 0.3; }
                100% { opacity: 0; }
            }
            @keyframes floatUpAndFade {
                0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
                50% { opacity: 1; transform: translate(-50%, -80%) scale(1.1); }
                100% { opacity: 0; transform: translate(-50%, -100%) scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}
