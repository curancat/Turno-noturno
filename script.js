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
const bancoDados = firebase.database();

const CARTAS_FRASE = [
    "O que arruinou meu último encontro?",
    "___ é a pior coisa do mundo, mas eu adoro.",
    "A nova moda entre os jovens é ___.",
    "Por que estou chorando no chuveiro?",
    "O ingrediente secreto da minha avó é ___.",
    "A cura para a depressão foi descoberta: ___.",
    "Ninguém espera por ___ na ceia de Natal.",
    "O que os alienígenas acharam mais estranho na Terra?"
];

const CARTAS_RESPOSTA = [
    "Um pinguim agiota.",
    "Comer sopa de garfo.",
    "Meu histórico do navegador.",
    "Um anão de jardim explosivo.",
    "Imposto de renda.",
    "Chororô no Twitter.",
    "Uma galinha com crise de identidade.",
    "Falar de ex no primeiro encontro.",
    "Falta de desodorante.",
    "Um ataque de pânico no mercado.",
    "Café frio.",
    "Dança do ventre com a sogra."
];

const ITENS_LOJA = [
    { id: 1, nome: "Espião", preco: 2, desc: "Abre um modal revelando quem jogou cada carta antes da votação." },
    { id: 2, nome: "Ditador", preco: 5, desc: "Garante a vitória imediata da carta que você escolher." },
    { id: 3, nome: "Veto", preco: 3, desc: "Concede imunidade contra qualquer ataque direto nesta rodada." },
    { id: 4, nome: "Sabotador", preco: 4, desc: "Destrói as cartas da mão de um oponente selecionado." },
    { id: 5, nome: "Mestre de Obras", preco: 2, desc: "Adiciona três cartas novas à sua mão imediatamente." },
    { id: 6, nome: "Roubo", preco: 4, desc: "Transfere um ponto de um jogador escolhido para você." },
    { id: 7, nome: "Censura", preco: 3, desc: "Bloqueia um adversário de participar da rodada atual." },
    { id: 8, nome: "Bomba Relógio", preco: 3, desc: "Reduz o tempo restante da fase atual para cinco segundos." },
    { id: 9, nome: "Reciclagem", preco: 1, desc: "Substitui todas as suas cartas atuais por cartas novas." },
    { id: 10, nome: "Segunda Chance", preco: 2, desc: "Remove sua carta da mesa e permite escolher outra." },
    { id: 11, nome: "Voto Duplo", preco: 3, desc: "Seu voto terá o peso duplicado na contagem final." },
    { id: 12, nome: "Inversão", preco: 5, desc: "Altera a regra para que a carta com menos votos vença." },
    { id: 13, nome: "Nova Frase", preco: 2, desc: "Sorteia uma frase preta completamente nova para a mesa." },
    { id: 14, nome: "Caos", preco: 4, desc: "Embaralha aleatoriamente as pontuações de toda a sala." },
    { id: 15, nome: "Anarquia", preco: 3, desc: "Elimina todos os votos que já foram computados na rodada." },
    { id: 16, nome: "Cegueira", preco: 3, desc: "Oculta o texto das cartas na mesa para todos os adversários." },
    { id: 17, nome: "Investidor", preco: 2, desc: "Rende pontos adicionais caso você vença esta rodada." },
    { id: 18, nome: "Silêncio", preco: 3, desc: "Impede todos os jogadores de acessarem a loja de itens." },
    { id: 19, nome: "Comunismo", preco: 5, desc: "Soma todos os pontos da sala e divide igualmente." },
    { id: 20, nome: "Limpa Trilhos", preco: 2, desc: "Encerra a rodada atual e inicia uma nova instantaneamente." }
];

let nomeJogador = "";
let jogadorAnfitriao = false;
let cartasNaMao = [];
let estadoDaSala = {};
let dadosDosJogadores = {};
let efeitosAtivos = { ditador: false, duplo: false, investidor: false };
let loopDoAnfitriao = null;

function exibirNotificacao(mensagem) {
    const elementoDiv = document.getElementById('notificacao');
    const elementoTexto = document.getElementById('texto-notificacao');
    elementoTexto.innerText = mensagem;
    elementoDiv.classList.remove('escondido');
    setTimeout(function() {
        elementoDiv.classList.add('escondido');
    }, 4000);
}

function alterarTela(idDaTela) {
    const todasAsTelas = document.querySelectorAll('.tela');
    for (let index = 0; index < todasAsTelas.length; index++) {
        todasAsTelas[index].classList.remove('ativa');
    }
    document.getElementById(idDaTela).classList.add('ativa');
}

function entrarNoJogo() {
    const campoDeTexto = document.getElementById('input-nome');
    nomeJogador = campoDeTexto.value.trim();
    
    if (nomeJogador.length < 3) {
        exibirNotificacao("O apelido precisa ter no mínimo três letras.");
        return;
    }
    
    bancoDados.ref('lobby').once('value').then(function(snapshot) {
        const jogadoresAtuais = snapshot.val() || {};
        
        if (jogadoresAtuais[nomeJogador]) {
            exibirNotificacao("Este apelido já está sendo usado.");
            return;
        }
        
        const referenciaJogador = bancoDados.ref('lobby/' + nomeJogador);
        referenciaJogador.set({
            online: true,
            pontos: 0,
            censurado: false,
            imune: false,
            sabotado: false
        });
        
        referenciaJogador.onDisconnect().remove();
        
        const quantidadeDeJogadores = Object.keys(jogadoresAtuais).length;
        if (quantidadeDeJogadores === 0) {
            jogadorAnfitriao = true;
        }
        
        if (jogadorAnfitriao === true) {
            document.getElementById('btn-iniciar').classList.remove('escondido');
            document.getElementById('msg-aguardando').classList.add('escondido');
        }
        
        alterarTela('tela-lobby');
        iniciarEscutaDoServidor();
    });
}

function iniciarEscutaDoServidor() {
    bancoDados.ref('lobby').on('value', function(snapshot) {
        dadosDosJogadores = snapshot.val() || {};
        const listaNaTela = document.getElementById('lista-jogadores');
        listaNaTela.innerHTML = '';
        
        if (!dadosDosJogadores[nomeJogador]) {
            return;
        }
        
        document.getElementById('meus-pontos').innerText = dadosDosJogadores[nomeJogador].pontos;
        
        if (dadosDosJogadores[nomeJogador].sabotado === true) {
            exibirNotificacao("Você foi alvo de sabotagem e perdeu suas cartas.");
            cartasNaMao = [];
            atualizarExibicaoDaMao();
            bancoDados.ref('lobby/' + nomeJogador + '/sabotado').set(false);
        }
        
        const chavesDosJogadores = Object.keys(dadosDosJogadores);
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            const nomeCorrente = chavesDosJogadores[index];
            let indicativo = "";
            
            if (nomeCorrente === nomeJogador) {
                indicativo = " (Você)";
            }
            if (jogadorAnfitriao === true && nomeCorrente === nomeJogador) {
                indicativo = indicativo + " [Anfitrião]";
            }
            
            const pontuacao = dadosDosJogadores[nomeCorrente].pontos;
            listaNaTela.innerHTML = listaNaTela.innerHTML + '<li>' + nomeCorrente + indicativo + ' <span>' + pontuacao + ' pts</span></li>';
        }
    });
    
    bancoDados.ref('sala').on('value', function(snapshot) {
        estadoDaSala = snapshot.val() || {};
        
        const telaLobbyEstaAtiva = document.getElementById('tela-lobby').classList.contains('ativa');
        if (estadoDaSala.fase && telaLobbyEstaAtiva === true) {
            alterarTela('tela-jogo');
            adicionarCartasNaMao(5);
            carregarItensDaLoja();
            iniciarLoopTemporalDoAnfitriao();
        }
        
        if (estadoDaSala.fase) {
            processarAtualizacaoVisualDaSala();
        }
    });
}

function iniciarLoopTemporalDoAnfitriao() {
    if (jogadorAnfitriao === false) {
        return;
    }
    
    if (loopDoAnfitriao !== null) {
        clearInterval(loopDoAnfitriao);
    }
    
    loopDoAnfitriao = setInterval(function() {
        if (estadoDaSala.tempoRestante > 0) {
            bancoDados.ref('sala/tempoRestante').set(estadoDaSala.tempoRestante - 1);
        }
        
        if (estadoDaSala.tempoRestante === 0) {
            if (estadoDaSala.fase === 'jogando') {
                bancoDados.ref('sala/fase').set('votacao');
                bancoDados.ref('sala/tempoRestante').set(30);
            } else if (estadoDaSala.fase === 'votacao') {
                bancoDados.ref('sala/tempoRestante').set(-1);
                executarApuracaoDeVotos();
            }
        }
    }, 1000);
}

function iniciarPartida() {
    const indiceAleatorio = Math.floor(Math.random() * CARTAS_FRASE.length);
    const cartaSorteada = CARTAS_FRASE[indiceAleatorio];
    
    bancoDados.ref('sala').set({
        fase: 'jogando',
        cartaPreta: cartaSorteada,
        jogadas: {},
        votos: {},
        tempoRestante: 40,
        efeitosGlobais: { inversao: false, cegueira: false, silencio: false }
    });
    
    const nomes = Object.keys(dadosDosJogadores);
    for (let index = 0; index < nomes.length; index++) {
        bancoDados.ref('lobby/' + nomes[index] + '/censurado').set(false);
    }
}

function formatarTempo(segundos) {
    if (segundos < 0) {
        return "00:00";
    }
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    let textoMinutos = minutos.toString();
    let textoSegundos = segundosRestantes.toString();
    
    if (minutos < 10) {
        textoMinutos = "0" + textoMinutos;
    }
    if (segundosRestantes < 10) {
        textoSegundos = "0" + textoSegundos;
    }
    
    return textoMinutos + ":" + textoSegundos;
}

function processarAtualizacaoVisualDaSala() {
    document.getElementById('carta-frase-atual').innerText = estadoDaSala.cartaPreta || "Carregando a frase...";
    
    let textoFase = "Aguardando";
    if (estadoDaSala.fase === 'jogando') {
        textoFase = "Escolha sua resposta";
    } else if (estadoDaSala.fase === 'votacao') {
        textoFase = "Vote na melhor carta";
    }
    document.getElementById('texto-fase').innerText = textoFase;
    
    const elementoRelogio = document.getElementById('cronometro');
    elementoRelogio.innerText = formatarTempo(estadoDaSala.tempoRestante);
    
    if (estadoDaSala.tempoRestante <= 10 && estadoDaSala.tempoRestante > 0) {
        elementoRelogio.classList.add('urgente');
    } else {
        elementoRelogio.classList.remove('urgente');
    }
    
    const caixaDeEfeitos = document.getElementById('alertas-efeitos');
    caixaDeEfeitos.innerHTML = '';
    
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.inversao === true) {
        caixaDeEfeitos.innerHTML = caixaDeEfeitos.innerHTML + "Alerta: Inversão ativada.<br>";
    }
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.cegueira === true) {
        caixaDeEfeitos.innerHTML = caixaDeEfeitos.innerHTML + "Alerta: Cegueira ativada.<br>";
    }
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.silencio === true) {
        caixaDeEfeitos.innerHTML = caixaDeEfeitos.innerHTML + "Alerta: Silêncio ativado.<br>";
    }

    if (estadoDaSala.fase === 'jogando') {
        document.getElementById('area-votacao').classList.add('escondido');
        document.getElementById('area-mao').classList.remove('escondido');
        
        const totalJogadores = Object.keys(dadosDosJogadores).length;
        const totalJogadas = Object.keys(estadoDaSala.jogadas || {}).length;
        
        if (jogadorAnfitriao === true && totalJogadas >= totalJogadores && totalJogadores > 1) {
            bancoDados.ref('sala/fase').set('votacao');
            bancoDados.ref('sala/tempoRestante').set(30);
        }
    } else if (estadoDaSala.fase === 'votacao') {
        document.getElementById('area-mao').classList.add('escondido');
        document.getElementById('area-votacao').classList.remove('escondido');
        
        const containerCartas = document.getElementById('cartas-jogadas');
        containerCartas.innerHTML = '';
        
        const arrayJogadas = Object.entries(estadoDaSala.jogadas || {});
        for (let index = 0; index < arrayJogadas.length; index++) {
            const donoDaCarta = arrayJogadas[index][0];
            const textoDaCarta = arrayJogadas[index][1];
            let classeCegueira = '';
            
            if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.cegueira === true && donoDaCarta !== nomeJogador) {
                classeCegueira = 'cegueira';
            }
            
            const htmlDaCarta = '<div class="carta carta-branca ' + classeCegueira + '" onclick="registrarVoto(\'' + donoDaCarta + '\', this)">' + textoDaCarta + '</div>';
            containerCartas.innerHTML = containerCartas.innerHTML + htmlDaCarta;
        }
        
        const totalJogadoresVotacao = Object.keys(dadosDosJogadores).length;
        const totalVotos = Object.keys(estadoDaSala.votos || {}).length;
        
        if (jogadorAnfitriao === true && totalVotos >= totalJogadoresVotacao && totalJogadoresVotacao > 1) {
            bancoDados.ref('sala/tempoRestante').set(-1);
            executarApuracaoDeVotos();
        }
    }
}

function enviarCarta(textoDaCarta, indiceDaCarta) {
    if (estadoDaSala.fase !== 'jogando') {
        exibirNotificacao("Este não é o momento de jogar cartas.");
        return;
    }
    
    if (estadoDaSala.jogadas && estadoDaSala.jogadas[nomeJogador]) {
        exibirNotificacao("Sua carta já foi enviada nesta rodada.");
        return;
    }
    
    if (dadosDosJogadores[nomeJogador].censurado === true) {
        exibirNotificacao("Você foi censurado e não pode enviar cartas.");
        return;
    }
    
    bancoDados.ref('sala/jogadas/' + nomeJogador).set(textoDaCarta);
    cartasNaMao.splice(indiceDaCarta, 1);
    adicionarCartasNaMao(1);
    exibirNotificacao("Carta enviada com sucesso.");
}

function registrarVoto(jogadorAlvo, elementoVisual) {
    if (estadoDaSala.fase !== 'votacao') {
        return;
    }
    
    if (jogadorAlvo === nomeJogador) {
        exibirNotificacao("Não é permitido votar na própria carta.");
        return;
    }
    
    if (estadoDaSala.votos && estadoDaSala.votos[nomeJogador]) {
        exibirNotificacao("Seu voto já foi registrado.");
        return;
    }
    
    let pesoDoVoto = 1;
    if (efeitosAtivos.ditador === true) {
        pesoDoVoto = 100;
        efeitosAtivos.ditador = false;
    } else if (efeitosAtivos.duplo === true) {
        pesoDoVoto = 2;
        efeitosAtivos.duplo = false;
    }
    
    bancoDados.ref('sala/votos/' + nomeJogador).set({
        para: jogadorAlvo,
        peso: pesoDoVoto
    });
    
    elementoVisual.classList.add('selecionada');
    exibirNotificacao("Voto contabilizado.");
}

function executarApuracaoDeVotos() {
    let tabelaDeContagem = {};
    const arrayVotos = Object.values(estadoDaSala.votos || {});
    
    for (let index = 0; index < arrayVotos.length; index++) {
        const votoAtual = arrayVotos[index];
        const destinoDoVoto = votoAtual.para;
        
        if (!tabelaDeContagem[destinoDoVoto]) {
            tabelaDeContagem[destinoDoVoto] = 0;
        }
        
        tabelaDeContagem[destinoDoVoto] = tabelaDeContagem[destinoDoVoto] + votoAtual.peso;
    }
    
    let nomeDoVencedor = null;
    let quantidadeDeVotosGanhadora = -1;
    
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.inversao === true) {
        quantidadeDeVotosGanhadora = 999999;
    }
    
    const arrayContagem = Object.entries(tabelaDeContagem);
    for (let index = 0; index < arrayContagem.length; index++) {
        const jogadorApurado = arrayContagem[index][0];
        const votosDoJogador = arrayContagem[index][1];
        
        if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.inversao === true) {
            if (votosDoJogador < quantidadeDeVotosGanhadora) {
                quantidadeDeVotosGanhadora = votosDoJogador;
                nomeDoVencedor = jogadorApurado;
            }
        } else {
            if (votosDoJogador > quantidadeDeVotosGanhadora) {
                quantidadeDeVotosGanhadora = votosDoJogador;
                nomeDoVencedor = jogadorApurado;
            }
        }
    }
    
    if (nomeDoVencedor !== null) {
        let bonificacao = 1;
        if (efeitosAtivos.investidor === true && nomeDoVencedor === nomeJogador) {
            bonificacao = 3;
        }
        
        bancoDados.ref('lobby/' + nomeDoVencedor + '/pontos').once('value').then(function(snapshot) {
            const pontosAntigos = snapshot.val() || 0;
            bancoDados.ref('lobby/' + nomeDoVencedor + '/pontos').set(pontosAntigos + bonificacao);
        });
        
        exibirNotificacao("O vencedor foi " + nomeDoVencedor + " com " + quantidadeDeVotosGanhadora + " votos.");
    } else {
        exibirNotificacao("A rodada terminou sem vencedores.");
    }
    
    efeitosAtivos.investidor = false;
    bancoDados.ref('lobby/' + nomeJogador + '/imune').set(false);
    
    setTimeout(function() {
        if (jogadorAnfitriao === true) {
            iniciarPartida();
        }
    }, 6000);
}

function adicionarCartasNaMao(quantidade) {
    for (let index = 0; index < quantidade; index++) {
        const indiceSorteado = Math.floor(Math.random() * CARTAS_RESPOSTA.length);
        cartasNaMao.push(CARTAS_RESPOSTA[indiceSorteado]);
    }
    atualizarExibicaoDaMao();
}

function atualizarExibicaoDaMao() {
    const containerDaMao = document.getElementById('minhas-cartas');
    containerDaMao.innerHTML = '';
    
    for (let index = 0; index < cartasNaMao.length; index++) {
        const textoDaCarta = cartasNaMao[index];
        const html = '<div class="carta carta-branca" onclick="enviarCarta(\'' + textoDaCarta + '\', ' + index + ')">' + textoDaCarta + '</div>';
        containerDaMao.innerHTML = containerDaMao.innerHTML + html;
    }
}

function filtrarCartas() {
    const termoPesquisado = document.getElementById('filtro-cartas').value.toLowerCase();
    const elementosCarta = document.querySelectorAll('#minhas-cartas .carta-branca');
    
    for (let index = 0; index < elementosCarta.length; index++) {
        const textoDaCarta = elementosCarta[index].innerText.toLowerCase();
        
        if (textoDaCarta.includes(termoPesquisado) === true) {
            elementosCarta[index].style.display = 'flex';
        } else {
            elementosCarta[index].style.display = 'none';
        }
    }
}

function abrirLoja() {
    if (estadoDaSala.efeitosGlobais && estadoDaSala.efeitosGlobais.silencio === true) {
        exibirNotificacao("A loja está fechada devido ao efeito de silêncio.");
        return;
    }
    document.getElementById('modal-loja').classList.remove('escondido');
}

function fecharLoja() {
    document.getElementById('modal-loja').classList.add('escondido');
}

function carregarItensDaLoja() {
    const containerLista = document.getElementById('lista-itens');
    containerLista.innerHTML = '';
    
    for (let index = 0; index < ITENS_LOJA.length; index++) {
        const itemCorrente = ITENS_LOJA[index];
        const htmlItem = '<div class="item-loja"><div><h3>' + itemCorrente.nome + '</h3><p>' + itemCorrente.desc + '</p></div><button onclick="comprarItemDaLoja(' + itemCorrente.id + ', ' + itemCorrente.preco + ')">Comprar por ' + itemCorrente.preco + ' pts</button></div>';
        containerLista.innerHTML = containerLista.innerHTML + htmlItem;
    }
}

function comprarItemDaLoja(identificadorDoItem, precoDoItem) {
    const pontosDisponiveis = dadosDosJogadores[nomeJogador].pontos;
    
    if (pontosDisponiveis >= precoDoItem) {
        bancoDados.ref('lobby/' + nomeJogador + '/pontos').set(pontosDisponiveis - precoDoItem);
        processarEfeitoDoItem(identificadorDoItem);
        fecharLoja();
    } else {
        exibirNotificacao("Seus pontos são insuficientes para esta compra.");
    }
}

function abrirModalDeSelecaoDeAlvo(tituloDoModal, funcaoDeRetorno) {
    fecharLoja();
    
    let htmlBotoes = '';
    const chavesDosJogadores = Object.keys(dadosDosJogadores);
    
    for (let index = 0; index < chavesDosJogadores.length; index++) {
        const nomeDoAlvo = chavesDosJogadores[index];
        if (nomeDoAlvo !== nomeJogador) {
            htmlBotoes = htmlBotoes + '<button class="btn-alvo" onclick="processarSelecaoDeAlvo(\'' + nomeDoAlvo + '\')">' + nomeDoAlvo + '</button>';
        }
    }
    
    const estruturaDoModal = '<div id="modal-alvo" class="modal-overlay"><div class="conteudo-modal" style="max-width: 500px; text-align: center;"><h3 style="margin-bottom: 20px; color: #ff3333;">' + tituloDoModal + '</h3><div class="lista-alvos">' + htmlBotoes + '</div><button class="btn-fechar" onclick="fecharModalDeSelecao()">Cancelar</button></div></div>';
    
    document.body.insertAdjacentHTML('beforeend', estruturaDoModal);
    
    window.processarSelecaoDeAlvo = function(nomeSelecionado) {
        fecharModalDeSelecao();
        if (dadosDosJogadores[nomeSelecionado].imune === true) {
            exibirNotificacao("O ataque falhou. O jogador selecionado está protegido por um Veto.");
        } else {
            funcaoDeRetorno(nomeSelecionado);
        }
    };
}

function fecharModalDeSelecao() {
    const elementoModal = document.getElementById('modal-alvo');
    if (elementoModal) {
        elementoModal.remove();
    }
}

function exibirModalGenerico(titulo, textoConteudo) {
    const estruturaDoModal = '<div id="modal-generico" class="modal-overlay"><div class="conteudo-modal" style="max-width: 600px;"><h3 style="margin-bottom: 20px; color: #ffcc00;">' + titulo + '</h3><div style="font-size: 16px; line-height: 1.6; margin-bottom: 30px;">' + textoConteudo + '</div><button class="btn-fechar" onclick="fecharModalGenerico()">Entendi</button></div></div>';
    document.body.insertAdjacentHTML('beforeend', estruturaDoModal);
}

function fecharModalGenerico() {
    const elementoModal = document.getElementById('modal-generico');
    if (elementoModal) {
        elementoModal.remove();
    }
}

function processarEfeitoDoItem(identificadorDoItem) {
    if (identificadorDoItem === 1) {
        let conteudoEspiao = "";
        const arrayJogadas = Object.entries(estadoDaSala.jogadas || {});
        
        for (let index = 0; index < arrayJogadas.length; index++) {
            const donoDaCarta = arrayJogadas[index][0];
            const textoDaCarta = arrayJogadas[index][1];
            conteudoEspiao = conteudoEspiao + "<p><strong>" + donoDaCarta + ":</strong> " + textoDaCarta + "</p>";
        }
        
        if (conteudoEspiao === "") {
            conteudoEspiao = "Nenhuma carta foi jogada ainda.";
        }
        
        exibirModalGenerico("Relatório de Espionagem", conteudoEspiao);
        
    } else if (identificadorDoItem === 2) {
        efeitosAtivos.ditador = true;
        exibirNotificacao("O modo ditador está ativo. Seu voto definirá o vencedor.");
        
    } else if (identificadorDoItem === 3) {
        bancoDados.ref('lobby/' + nomeJogador + '/imune').set(true);
        exibirNotificacao("Você está protegido contra ataques direcionados.");
        
    } else if (identificadorDoItem === 4) {
        abrirModalDeSelecaoDeAlvo("Escolha o jogador para sabotar", function(nomeDoAlvo) {
            bancoDados.ref('lobby/' + nomeDoAlvo + '/sabotado').set(true);
            exibirNotificacao("A sabotagem contra " + nomeDoAlvo + " foi um sucesso.");
        });
        
    } else if (identificadorDoItem === 5) {
        adicionarCartasNaMao(3);
        exibirNotificacao("Três cartas extras foram adicionadas à sua mão.");
        
    } else if (identificadorDoItem === 6) {
        abrirModalDeSelecaoDeAlvo("Escolha de quem deseja roubar", function(nomeDoAlvo) {
            bancoDados.ref('lobby/' + nomeDoAlvo + '/pontos').once('value').then(function(snapshot) {
                const pontosDoAlvo = snapshot.val() || 0;
                let novosPontosDoAlvo = pontosDoAlvo - 1;
                if (novosPontosDoAlvo < 0) {
                    novosPontosDoAlvo = 0;
                }
                bancoDados.ref('lobby/' + nomeDoAlvo + '/pontos').set(novosPontosDoAlvo);
                
                bancoDados.ref('lobby/' + nomeJogador + '/pontos').once('value').then(function(meuSnapshot) {
                    const meusPontos = meuSnapshot.val() || 0;
                    bancoDados.ref('lobby/' + nomeJogador + '/pontos').set(meusPontos + 1);
                });
                exibirNotificacao("Você roubou um ponto com sucesso.");
            });
        });
        
    } else if (identificadorDoItem === 7) {
        abrirModalDeSelecaoDeAlvo("Escolha o jogador para censurar", function(nomeDoAlvo) {
            bancoDados.ref('lobby/' + nomeDoAlvo + '/censurado').set(true);
            exibirNotificacao("O jogador foi censurado e não poderá jogar nesta rodada.");
        });
        
    } else if (identificadorDoItem === 8) {
        bancoDados.ref('sala/tempoRestante').set(5);
        exibirNotificacao("Bomba ativada. O tempo foi reduzido drasticamente.");
        
    } else if (identificadorDoItem === 9) {
        cartasNaMao = [];
        adicionarCartasNaMao(5);
        exibirNotificacao("Suas cartas foram renovadas por completo.");
        
    } else if (identificadorDoItem === 10) {
        bancoDados.ref('sala/jogadas/' + nomeJogador).remove();
        adicionarCartasNaMao(1);
        exibirNotificacao("Sua carta foi removida da mesa. Você pode jogar outra.");
        
    } else if (identificadorDoItem === 11) {
        efeitosAtivos.duplo = true;
        exibirNotificacao("Seu próximo voto terá o peso duplicado.");
        
    } else if (identificadorDoItem === 12) {
        bancoDados.ref('sala/efeitosGlobais/inversao').set(true);
        exibirNotificacao("A regra foi invertida. A carta menos votada será a vencedora.");
        
    } else if (identificadorDoItem === 13) {
        const indiceAleatorio = Math.floor(Math.random() * CARTAS_FRASE.length);
        const novaCartaPreta = CARTAS_FRASE[indiceAleatorio];
        bancoDados.ref('sala/cartaPreta').set(novaCartaPreta);
        exibirNotificacao("A frase principal foi substituída por uma nova.");
        
    } else if (identificadorDoItem === 14) {
        const chavesDosJogadores = Object.keys(dadosDosJogadores);
        let arrayDePontos = [];
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            arrayDePontos.push(dadosDosJogadores[chavesDosJogadores[index]].pontos);
        }
        
        for (let i = arrayDePontos.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const temporario = arrayDePontos[i];
            arrayDePontos[i] = arrayDePontos[j];
            arrayDePontos[j] = temporario;
        }
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            const nomeCorrente = chavesDosJogadores[index];
            bancoDados.ref('lobby/' + nomeCorrente + '/pontos').set(arrayDePontos[index]);
        }
        exibirNotificacao("As pontuações foram embaralhadas pelo caos.");
        
    } else if (identificadorDoItem === 15) {
        bancoDados.ref('sala/votos').remove();
        exibirNotificacao("Anarquia declarada. Todos os votos atuais foram anulados.");
        
    } else if (identificadorDoItem === 16) {
        bancoDados.ref('sala/efeitosGlobais/cegueira').set(true);
        exibirNotificacao("Cegueira ativada. As cartas estão ocultas para os adversários.");
        
    } else if (identificadorDoItem === 17) {
        efeitosAtivos.investidor = true;
        exibirNotificacao("Você receberá uma bonificação maior caso vença esta rodada.");
        
    } else if (identificadorDoItem === 18) {
        bancoDados.ref('sala/efeitosGlobais/silencio').set(true);
        exibirNotificacao("A loja de itens foi bloqueada para todos os jogadores.");
        
    } else if (identificadorDoItem === 19) {
        const chavesDosJogadores = Object.keys(dadosDosJogadores);
        let somaTotalDePontos = 0;
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            somaTotalDePontos = somaTotalDePontos + dadosDosJogadores[chavesDosJogadores[index]].pontos;
        }
        
        const pontuacaoDividida = Math.floor(somaTotalDePontos / chavesDosJogadores.length);
        
        for (let index = 0; index < chavesDosJogadores.length; index++) {
            const nomeCorrente = chavesDosJogadores[index];
            bancoDados.ref('lobby/' + nomeCorrente + '/pontos').set(pontuacaoDividida);
        }
        exibirNotificacao("Os pontos foram igualados entre todos os jogadores.");
        
    } else if (identificadorDoItem === 20) {
        if (jogadorAnfitriao === true) {
            iniciarPartida();
        } else {
            bancoDados.ref('sala/tempoRestante').set(0);
        }
        exibirNotificacao("Os trilhos foram limpos. A rodada será reiniciada imediatamente.");
    }
}
