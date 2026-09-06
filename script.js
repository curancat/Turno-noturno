// ==========================================
// CONFIGURAÇÃO FIREBASE
// ==========================================
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBykDF5TNKQHejUJTp-ue7s5CKfpJp1HV0",
  authDomain: "mestre-471a0.firebaseapp.com",
  databaseURL: "https://mestre-471a0-default-rtdb.firebaseio.com",
  projectId: "mestre-471a0",
  storageBucket: "mestre-471a0.firebasestorage.app",
  messagingSenderId: "142996111628",
  appId: "1:142996111628:web:c3785e54588632f468c929",
  measurementId: "G-XWSF04WNVW"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ==========================================
// DADOS DO JOGO (Expanda o quanto quiser)
// ==========================================
const CARTAS_FRASE = [
    "O que arruinou meu último encontro?",
    "___ é a pior coisa do mundo, mas eu adoro.",
    "A nova moda entre os jovens é ___.",
    "Por que estou chorando no chuveiro?",
    "O ingrediente secreto da minha avó é ___.",
    "A cura para a depressão foi descoberta: ___."
];

const CARTAS_RESPOSTA = [
    "Um pinguim agiota.", "Comer sopa de garfo.", "Meu histórico do navegador.", 
    "Um anão de jardim explosivo.", "Imposto de renda.", "Chororô no Twitter.", 
    "Uma galinha com crise de identidade.", "Falar de ex no primeiro encontro.",
    "Falta de desodorante.", "Um ataque de pânico no mercado.", "Café frio."
];

const ITENS_LOJA = [
    { id: 1, nome: "Espião", preco: 2, desc: "Espia quem jogou qual carta (Console)." },
    { id: 2, nome: "Ditador", preco: 5, desc: "Seu voto vale 100 pontos (Vitória garantida)." },
    { id: 3, nome: "Veto", preco: 3, desc: "Imune a itens direcionados nesta rodada." },
    { id: 4, nome: "Sabotador", preco: 4, desc: "Escolha um jogador para descartar a mão atual." },
    { id: 5, nome: "Mestre de Obras", preco: 2, desc: "Compra 3 cartas brancas extras agora." },
    { id: 6, nome: "Roubo", preco: 4, desc: "Rouba 1 ponto de um jogador escolhido." },
    { id: 7, nome: "Censura", preco: 3, desc: "Impede um jogador de jogar nesta rodada." },
    { id: 8, nome: "Bomba Relógio", preco: 3, desc: "Força o início imediato da votação." },
    { id: 9, nome: "Reciclagem", preco: 1, desc: "Troca toda a sua mão por novas cartas." },
    { id: 10, nome: "Segunda Chance", preco: 2, desc: "Permite retirar a carta que você jogou da mesa." },
    { id: 11, nome: "Voto Duplo", preco: 3, desc: "Seu voto valerá 2 pontos." },
    { id: 12, nome: "Inversão", preco: 5, desc: "A carta com MENOS votos ganha a rodada." },
    { id: 13, nome: "Nova Frase", preco: 2, desc: "Troca a carta preta da mesa imediatamente." },
    { id: 14, nome: "Caos", preco: 4, desc: "Embaralha a pontuação de todos na sala." },
    { id: 15, nome: "Anarquia", preco: 3, desc: "Zera os votos computados até agora." },
    { id: 16, nome: "Cegueira", preco: 3, desc: "Borra as cartas na mesa, forçando voto cego." },
    { id: 17, nome: "Investidor", preco: 2, desc: "Se você ganhar esta rodada, ganha +2 pontos." },
    { id: 18, nome: "Silêncio", preco: 3, desc: "Bloqueia a loja para todos até a próxima rodada." },
    { id: 19, nome: "Comunismo", preco: 5, desc: "Divide os pontos de todos igualmente." },
    { id: 20, nome: "Limpa Trilhos", preco: 2, desc: "Reinicia a rodada inteira imediatamente." }
];

// ==========================================
// VARIÁVEIS DE ESTADO DO CLIENTE
// ==========================================
let me = ""; 
let host = false; 
let minhaMao = [];
let salaState = {}; 
let jogadoresData = {};
let meusEfeitos = { ditador: false, duplo: false, investidor: false };

// ==========================================
// CORE: LOGIN E PRESENÇA (ON-DISCONNECT)
// ==========================================
function entrarNoJogo() {
    me = document.getElementById('input-nome').value.trim();
    if (!me || me.length < 3) return mostrarNotificacao("Digite um nome com pelo menos 3 letras!");
    
    db.ref('lobby').once('value', snap => {
        let players = snap.val() || {};
        if (players[me]) return mostrarNotificacao("Este nome já está em uso na sala!");
        
        // Define presenca (remove do banco se fechar a aba)
        const meuRef = db.ref('lobby/' + me);
        meuRef.set({ online: true, pontos: 0, censurado: false, imune: false, sabotado: false });
        meuRef.onDisconnect().remove(); // MÁGICA: Limpa o jogador se ele sair

        if (Object.keys(players).length === 0) host = true; // Primeiro a entrar vira host
        
        if (host) {
            document.getElementById('btn-iniciar').style.display = 'inline-block';
            document.getElementById('msg-aguardando').style.display = 'none';
        }

        trocarTela('tela-lobby');
        escutarServidor();
    });
}

function trocarTela(id) {
    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById(id).classList.add('ativa');
}

function mostrarNotificacao(msg) {
    const div = document.getElementById('notificacao');
    div.innerText = msg;
    div.classList.remove('escondido');
    setTimeout(() => div.classList.add('escondido'), 3000);
}

// ==========================================
// ESCUTA ATIVA DO FIREBASE
// ==========================================
function escutarServidor() {
    // 1. Escuta o Lobby e Status dos Jogadores
    db.ref('lobby').on('value', snap => {
        jogadoresData = snap.val() || {};
        const lista = document.getElementById('lista-jogadores');
        lista.innerHTML = '';
        
        if (!jogadoresData[me]) return; // Fui expulso ou sai
        
        document.getElementById('meus-pontos').innerText = jogadoresData[me].pontos;

        // Trata ataques sofridos
        if (jogadoresData[me].sabotado) {
            mostrarNotificacao("💣 Você foi sabotado! Perdeu sua mão.");
            minhaMao = []; renderizarMao();
            db.ref('lobby/'+me+'/sabotado').set(false);
        }

        Object.keys(jogadoresData).forEach(nome => {
            const isMe = nome === me ? " (Você)" : "";
            const hostTag = (host && nome === me) ? " 👑" : "";
            lista.innerHTML += `<li>${nome}${isMe}${hostTag} <span>${jogadoresData[nome].pontos} pts</span></li>`;
        });
    });

    // 2. Escuta o Estado do Jogo (Fases, Cartas na Mesa)
    db.ref('sala').on('value', snap => {
        salaState = snap.val() || {};
        if (salaState.fase && document.getElementById('tela-lobby').classList.contains('ativa')) {
            trocarTela('tela-jogo');
            comprarCartas(5);
            renderizarLoja();
        }
        if (salaState.fase) atualizarInterfaceJogo();
    });
}

// ==========================================
// FLUXO DO JOGO
// ==========================================
function iniciarPartida() {
    db.ref('sala').set({
        fase: 'jogando',
        cartaPreta: CARTAS_FRASE[Math.floor(Math.random() * CARTAS_FRASE.length)],
        jogadas: {},
        votos: {},
        efeitosGlobais: { inversao: false, cegueira: false, silencio: false }
    });
    // Limpa efeitos dos jogadores
    Object.keys(jogadoresData).forEach(j => db.ref(`lobby/${j}/censurado`).set(false));
}

function atualizarInterfaceJogo() {
    document.getElementById('carta-frase-atual').innerText = salaState.cartaPreta || "Sorteando...";
    document.getElementById('texto-fase').innerText = salaState.fase === 'jogando' ? "Envie sua carta!" : "Votação!";
    
    // Avisos de Loja
    const divEfeitos = document.getElementById('alertas-efeitos');
    divEfeitos.innerHTML = '';
    if(salaState.efeitosGlobais?.inversao) divEfeitos.innerHTML += "⚠️ INVERSÃO: Pior voto ganha!<br>";
    if(salaState.efeitosGlobais?.cegueira) divEfeitos.innerHTML += "👁️ CEGUEIRA: Vote às cegas!<br>";
    if(salaState.efeitosGlobais?.silencio) divEfeitos.innerHTML += "🤫 SILÊNCIO: Loja fechada.<br>";

    // FASE 1: JOGAR CARTAS
    if (salaState.fase === 'jogando') {
        document.getElementById('area-votacao').classList.add('escondido');
        document.getElementById('area-mao').classList.remove('escondido');
        
        const numJogadores = Object.keys(jogadoresData).length;
        const numJogadas = Object.keys(salaState.jogadas || {}).length;

        if (host && numJogadas >= numJogadores && numJogadores > 1) {
            db.ref('sala/fase').set('votacao'); // Auto-avança
        }
    } 
    // FASE 2: VOTAÇÃO
    else if (salaState.fase === 'votacao') {
        document.getElementById('area-mao').classList.add('escondido');
        document.getElementById('area-votacao').classList.remove('escondido');
        
        const divCartas = document.getElementById('cartas-jogadas');
        divCartas.innerHTML = '';
        
        Object.entries(salaState.jogadas || {}).forEach(([jogador, cartaTexto]) => {
            const cssCego = (salaState.efeitosGlobais?.cegueira && jogador !== me) ? 'cegueira' : '';
            divCartas.innerHTML += `
                <div class="carta carta-branca ${cssCego}" onclick="votar('${jogador}', this)">
                    ${cartaTexto}
                </div>`;
        });

        const numJogadores = Object.keys(jogadoresData).length;
        const totalVotos = Object.keys(salaState.votos || {}).length;
        if (host && totalVotos >= numJogadores && numJogadores > 1) {
            apurarVotos(); // Auto-avança
        }
    }
}

// ==========================================
// AÇÕES DO JOGADOR (JOGAR E VOTAR)
// ==========================================
function jogarCarta(texto, indexNaMao) {
    if (salaState.fase !== 'jogando') return mostrarNotificacao("Não é hora de jogar!");
    if (salaState.jogadas && salaState.jogadas[me]) return mostrarNotificacao("Você já jogou nesta rodada!");
    if (jogadoresData[me].censurado) return mostrarNotificacao("🚫 Você foi censurado e não pode jogar agora.");

    db.ref('sala/jogadas/' + me).set(texto);
    minhaMao.splice(indexNaMao, 1);
    comprarCartas(1);
    mostrarNotificacao("Carta enviada!");
}

function votar(jogadorAlvo, elementoCard) {
    if (salaState.fase !== 'votacao') return;
    if (jogadorAlvo === me) return mostrarNotificacao("Não pode votar na própria carta!");
    if (salaState.votos && salaState.votos[me]) return mostrarNotificacao("Voto já registrado!");
    
    let peso = 1;
    if (meusEfeitos.ditador) { peso = 100; meusEfeitos.ditador = false; }
    else if (meusEfeitos.duplo) { peso = 2; meusEfeitos.duplo = false; }

    db.ref('sala/votos/' + me).set({ para: jogadorAlvo, peso: peso });
    elementoCard.classList.add('selecionada');
    mostrarNotificacao("Voto computado!");
}

function apurarVotos() {
    let contagem = {};
    Object.values(salaState.votos || {}).forEach(v => {
        contagem[v.para] = (contagem[v.para] || 0) + v.peso;
    });

    let ganhador = null;
    let maxVotos = salaState.efeitosGlobais?.inversao ? Infinity : -1;

    Object.entries(contagem).forEach(([jog, qtd]) => {
        if (salaState.efeitosGlobais?.inversao) {
            if (qtd < maxVotos) { maxVotos = qtd; ganhador = jog; }
        } else {
            if (qtd > maxVotos) { maxVotos = qtd; ganhador = jog; }
        }
    });

    if (ganhador) {
        let premio = meusEfeitos.investidor && ganhador === me ? 3 : 1;
        db.ref('lobby/'+ganhador+'/pontos').transaction(p => (p || 0) + premio);
        mostrarNotificacao(`🏆 ${ganhador} ganhou a rodada com ${maxVotos} votos!`);
    } else {
        mostrarNotificacao("Ninguém ganhou essa rodada.");
    }
    
    meusEfeitos.investidor = false;
    db.ref('lobby/'+me+'/imune').set(false); // Reseta imunidade
    setTimeout(() => iniciarPartida(), 5000); // Nova rodada após 5s
}

// ==========================================
// GERENCIAMENTO DA MÃO
// ==========================================
function comprarCartas(qtd) {
    for(let i=0; i<qtd; i++) {
        minhaMao.push(CARTAS_RESPOSTA[Math.floor(Math.random() * CARTAS_RESPOSTA.length)]);
    }
    renderizarMao();
}

function renderizarMao() {
    const div = document.getElementById('minhas-cartas');
    div.innerHTML = '';
    minhaMao.forEach((texto, idx) => {
        div.innerHTML += `<div class="carta carta-branca" onclick="jogarCarta('${texto}', ${idx})">${texto}</div>`;
    });
}

function filtrarCartas() {
    const termo = document.getElementById('filtro-cartas').value.toLowerCase();
    document.querySelectorAll('#minhas-cartas .carta-branca').forEach(c => {
        c.style.display = c.innerText.toLowerCase().includes(termo) ? 'flex' : 'none';
    });
}

// ==========================================
// LOJA E MODAIS CUSTOMIZADOS (SEM PROMPTS)
// ==========================================
function abrirLoja() { 
    if(salaState.efeitosGlobais?.silencio) return mostrarNotificacao("🤫 O Silêncio está ativo! Loja fechada.");
    document.getElementById('modal-loja').classList.remove('escondido'); 
}
function fecharLoja() { document.getElementById('modal-loja').classList.add('escondido'); }

function renderizarLoja() {
    const lista = document.getElementById('lista-itens');
    lista.innerHTML = '';
    ITENS_LOJA.forEach(item => {
        lista.innerHTML += `
            <div class="item-loja">
                <div><h3>${item.nome}</h3><p>${item.desc}</p></div>
                <button onclick="comprarItem(${item.id}, ${item.preco})">${item.preco} pts</button>
            </div>`;
    });
}

function comprarItem(id, preco) {
    let ptsAtuais = jogadoresData[me].pontos;
    if (ptsAtuais >= preco) {
        db.ref('lobby/'+me+'/pontos').set(ptsAtuais - preco);
        aplicarEfeito(id);
        fecharLoja();
    } else {
        mostrarNotificacao("❌ Pontos insuficientes!");
    }
}

// Cria um modal dinâmico no HTML para escolher um jogador
function solicitarAlvo(titulo, callback) {
    fecharLoja();
    const modalHtml = `
        <div id="modal-alvo" class="modal-overlay">
            <div class="conteudo-modal" style="max-width: 400px; text-align: center;">
                <h3>${titulo}</h3>
                <div class="lista-alvos">
                    ${Object.keys(jogadoresData).filter(j => j !== me).map(j => 
                        `<button class="btn-alvo" onclick="window.escolherAlvo('${j}')">${j}</button>`
                    ).join('')}
                </div>
                <button class="btn-fechar" onclick="fecharModalAlvo()">Cancelar</button>
            </div>
        </div>`;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    window.escolherAlvo = function(alvoSelecionado) {
        fecharModalAlvo();
        // Checa se o alvo tem o item VETO ativado
        if(jogadoresData[alvoSelecionado].imune) {
            mostrarNotificacao(`🛡️ O ataque falhou! ${alvoSelecionado} usou um Veto!`);
        } else {
            callback(alvoSelecionado);
        }
    };
}
function fecharModalAlvo() { const m = document.getElementById('modal-alvo'); if(m) m.remove(); }

// ==========================================
// EFEITOS ATIVOS DOS 20 ITENS
// ==========================================
function aplicarEfeito(id) {
    switch(id) {
        case 1: // Espião
            console.log("ESPIÃO: ", salaState.jogadas);
            mostrarNotificacao("🕵️ Abra o Console do Navegador (F12) para ver as cartas jogadas!"); 
            break;
        case 2: meusEfeitos.ditador = true; mostrarNotificacao("👑 Modo Ditador ativo!"); break;
        case 3: db.ref('lobby/'+me+'/imune').set(true); mostrarNotificacao("🛡️ Você está imune nesta rodada."); break;
        case 4: 
            solicitarAlvo("Quem você quer Sabotar?", (alvo) => {
                db.ref('lobby/'+alvo+'/sabotado').set(true);
                mostrarNotificacao(`💣 ${alvo} foi sabotado!`);
            }); break;
        case 5: comprarCartas(3); mostrarNotificacao("🃏 +3 Cartas compradas!"); break;
        case 6: 
            solicitarAlvo("De quem você quer Roubar 1 ponto?", (alvo) => {
                db.ref('lobby/'+alvo+'/pontos').transaction(p => (p>0 ? p-1 : 0));
                db.ref('lobby/'+me+'/pontos').transaction(p => p+1);
                mostrarNotificacao(`💰 Ponto roubado de ${alvo}!`);
            }); break;
        case 7: 
            solicitarAlvo("Quem você quer Censurar?", (alvo) => {
                db.ref('lobby/'+alvo+'/censurado').set(true); 
                mostrarNotificacao(`🚫 ${alvo} censurado!`);
            }); break;
        case 8: db.ref('sala/fase').set('votacao'); mostrarNotificacao("⏰ Votação forçada iniciada!"); break;
        case 9: minhaMao = []; comprarCartas(5); mostrarNotificacao("♻️ Mão totalmente renovada!"); break;
        case 10: db.ref('sala/jogadas/'+me).remove(); mostrarNotificacao("↩️ Carta retirada. Jogue outra!"); break;
        case 11: meusEfeitos.duplo = true; mostrarNotificacao("✌️ Voto Duplo ativado!"); break;
        case 12: db.ref('sala/efeitosGlobais/inversao').set(true); break;
        case 13: db.ref('sala/cartaPreta').set(CARTAS_FRASE[Math.floor(Math.random() * CARTAS_FRASE.length)]); mostrarNotificacao("🔄 Frase alterada!"); break;
        case 14: // Caos - Embaralha pontos
            let pontosArr = Object.values(jogadoresData).map(j => j.pontos).sort(() => Math.random() - 0.5);
            Object.keys(jogadoresData).forEach((nome, i) => db.ref('lobby/'+nome+'/pontos').set(pontosArr[i]));
            mostrarNotificacao("🌪️ Caos instalado! Os pontos foram embaralhados."); break;
        case 15: db.ref('sala/votos').remove(); mostrarNotificacao("🔥 Anarquia! Todos os votos zerados."); break;
        case 16: db.ref('sala/efeitosGlobais/cegueira').set(true); break;
        case 17: meusEfeitos.investidor = true; mostrarNotificacao("📈 Ações compradas!"); break;
        case 18: db.ref('sala/efeitosGlobais/silencio').set(true); break;
        case 19: // Comunismo
            let soma = Object.values(jogadoresData).reduce((acc, j) => acc + j.pontos, 0);
            let divisao = Math.floor(soma / Object.keys(jogadoresData).length);
            Object.keys(jogadoresData).forEach(nome => db.ref('lobby/'+nome+'/pontos').set(divisao));
            mostrarNotificacao("☭ Comunismo! Pontos igualados."); break;
        case 20: iniciarPartida(); mostrarNotificacao("🚂 Limpa Trilhos! Rodada reiniciada."); break;
    }
}
