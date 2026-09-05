import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, orderBy, limit, doc, updateDoc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let currentRune = null;
let gameLoopInterval = null;
let globalTurnCounter = 0;
let phase = 0; 
let pHP = 100, pMana = 1, eHP = 100, eMana = 1;
let pMaxMana = 1;
let combatLog = [];

const audio = document.getElementById("bg-audio");
const btnAudio = document.getElementById("btn-audio");
let audioPlaying = false;

btnAudio.addEventListener("click", () => {
    if (audioPlaying) { audio.pause(); audioPlaying = false; btnAudio.textContent = "🔈"; }
    else { audio.play(); audioPlaying = true; btnAudio.textContent = "🔊"; }
});

const goReg = document.getElementById("go-register");
const goLog = document.getElementById("go-login");
const loginF = document.getElementById("login-form");
const regF = document.getElementById("register-form");

goReg.addEventListener("click", () => { loginF.classList.remove("active"); regF.classList.add("active"); });
goLog.addEventListener("click", () => { regF.classList.remove("active"); loginF.classList.add("active"); });

document.getElementById("btn-login").addEventListener("click", async () => {
    const e = document.getElementById("login-email").value;
    const p = document.getElementById("login-password").value;
    if(e && p.length >= 6) {
        try { await signInWithEmailAndPassword(auth, e, p); } catch(err) { alert(err.message); }
    }
});

document.getElementById("btn-register").addEventListener("click", async () => {
    const e = document.getElementById("reg-email").value;
    const p = document.getElementById("reg-password").value;
    const n = document.getElementById("reg-name").value;
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && p.length >= 6 && n) {
        try {
            const cred = await createUserWithEmailAndPassword(auth, e, p);
            await setDoc(doc(db, "users", cred.user.uid), { name: n, level: 1, gold: 0 });
        } catch(err) { alert(err.message); }
    }
});

document.getElementById("btn-logout").addEventListener("click", () => {
    signOut(auth);
    localStorage.clear();
});

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        const udoc = await getDoc(doc(db, "users", user.uid));
        document.getElementById("player-name").textContent = udoc.exists() ? udoc.data().name : user.email;
        document.getElementById("auth-screen").classList.remove("active");
        document.getElementById("main-client").classList.add("active");
        initSocial();
    } else {
        currentUser = null;
        document.getElementById("main-client").classList.remove("active");
        document.getElementById("auth-screen").classList.add("active");
    }
});

document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-pane").forEach(t => t.classList.remove("active"));
        e.target.classList.add("active");
        document.getElementById(e.target.dataset.target).classList.add("active");
    });
});

document.querySelectorAll(".rune-card").forEach(c => {
    c.addEventListener("click", (e) => {
        document.querySelectorAll(".rune-card").forEach(x => x.classList.remove("selected"));
        const tg = e.currentTarget;
        tg.classList.add("selected");
        currentRune = tg.dataset.rune;
    });
});

const chatInput = document.getElementById("chat-input");
const chatMessages = document.getElementById("chat-messages");

function initSocial() {
    const q = query(collection(db, "global_chat"), orderBy("timestamp", "desc"), limit(100));
    onSnapshot(q, (snapshot) => {
        chatMessages.innerHTML = "";
        const msgs = [];
        snapshot.forEach(d => msgs.unshift(d.data()));
        msgs.forEach(m => {
            const d = document.createElement("div");
            d.className = "msg";
            const dt = new Date(m.timestamp);
            d.innerHTML = `<span class="time">[${dt.getHours()}:${dt.getMinutes()}]</span> <span class="author">${m.name}:</span> ${m.text}`;
            chatMessages.appendChild(d);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });
}

chatInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter" && chatInput.value.trim() !== "") {
        const txt = chatInput.value.trim();
        chatInput.value = "";
        await addDoc(collection(db, "global_chat"), {
            uid: currentUser.uid,
            name: document.getElementById("player-name").textContent,
            text: txt,
            timestamp: Date.now()
        });
    }
});

const items = [];
const statsKeys = ['AP', 'AD', 'RM', 'RF', 'VM', 'MM', 'VA', 'VP'];
const adjectives = ["Sombrio", "Luminoso", "Frenético", "Imóvel", "Divino", "Profano", "Rápido", "Lento", "Oculto", "Visível"];
const nouns = ["Espada", "Escudo", "Cajado", "Tomo", "Botas", "Anel", "Colar", "Armadura", "Manto", "Adaga"];

for(let i=0; i<100; i++) {
    let st = {};
    let tCost = 0;
    statsKeys.forEach(k => {
        if(Math.random() > 0.6) {
            let val = Math.floor(Math.random() * 50) + 1;
            st[k] = val;
            tCost += val * 10;
        }
    });
    if(Object.keys(st).length === 0) { st['AD'] = 10; tCost = 100; }
    items.push({
        id: i,
        name: `${nouns[i%10]} ${adjectives[Math.floor(i/10)]} do Tier ${Math.floor(i/33)+1}`,
        cost: tCost,
        stats: st,
        recipe: i > 30 ? [Math.floor(Math.random()*30), Math.floor(Math.random()*30)] : [],
        desc: `Poder selado número ${i}`
    });
}

const storeGrid = document.getElementById("store-grid");
function renderStore(data) {
    storeGrid.innerHTML = "";
    data.forEach(it => {
        const d = document.createElement("div");
        d.className = "item-card";
        let sHtml = Object.entries(it.stats).map(([k,v]) => `${k}:${v}`).join(" | ");
        d.innerHTML = `<div class="item-name">${it.name}</div><div class="item-stats">${sHtml}</div><div class="item-cost">G$ ${it.cost}</div>`;
        storeGrid.appendChild(d);
    });
}
renderStore(items);

document.getElementById("store-search").addEventListener("input", (e) => {
    const v = e.target.value.toLowerCase();
    renderStore(items.filter(i => i.name.toLowerCase().includes(v)));
});
document.getElementById("store-sort").addEventListener("change", (e) => {
    const v = e.target.value;
    let s = [...items];
    if(v === "cost-asc") s.sort((a,b)=>a.cost-b.cost);
    if(v === "cost-desc") s.sort((a,b)=>b.cost-a.cost);
    if(v === "alpha") s.sort((a,b)=>a.name.localeCompare(b.name));
    renderStore(s);
});

document.getElementById("btn-calculate-build").addEventListener("click", () => {
    let target = {
        AP: parseInt(document.getElementById("t-ap").value),
        AD: parseInt(document.getElementById("t-ad").value),
        RM: parseInt(document.getElementById("t-rm").value),
        RF: parseInt(document.getElementById("t-rf").value),
        VM: parseInt(document.getElementById("t-vm").value),
        MM: parseInt(document.getElementById("t-mm").value),
        VA: parseInt(document.getElementById("t-va").value),
        VP: parseInt(document.getElementById("t-vp").value)
    };
    
    let current = {AP:0, AD:0, RM:0, RF:0, VM:0, MM:0, VA:0, VP:0};
    let build = [];
    let pool = [...items].sort((a,b) => (Object.values(b.stats).reduce((x,y)=>x+y,0)/b.cost) - (Object.values(a.stats).reduce((x,y)=>x+y,0)/a.cost));
    
    for(let it of pool) {
        let useful = false;
        for(let k of statsKeys) {
            if(it.stats[k] && current[k] < target[k]) useful = true;
        }
        if(useful && build.length < 6) {
            build.push(it);
            for(let k of statsKeys) if(it.stats[k]) current[k] += it.stats[k];
        }
    }
    
    const res = document.getElementById("build-result");
    res.innerHTML = `<h4 style="color:var(--gold-bright);text-align:center;margin-bottom:10px;">BUILD GERADA</h4>`;
    build.forEach(b => {
        res.innerHTML += `<div style="font-size:0.8rem; margin-bottom:5px;">[${b.cost}g] ${b.name}</div>`;
    });
});

const jMonsters = [
    {n:"Fantasma", hp:1000, m:1.1},
    {n:"Gordão da X9", hp:2500, m:1.25},
    {n:"Twink", hp:4000, m:1.4},
    {n:"Saqueleto", hp:6500, m:1.6},
    {n:"Dragão Bafo Colgate", hp:10000, m:2.0},
    {n:"Seu Zé", hp:25000, m:3.0}
];
let jIndex = 0;
let cMonsterHp = jMonsters[0].hp;

document.getElementById("btn-create-room").addEventListener("click", () => {
    document.querySelector(".matchmaking-panel").style.display = "none";
    document.getElementById("active-match").style.display = "flex";
    startGame();
});

function startGame() {
    pHP = 100; eHP = 100; pMana = 1; pMaxMana = 1; eMana = 1; globalTurnCounter = 0; phase = 0;
    updateBars();
    renderBoard();
    if(currentRune === "script") setInterval(scriptRuneFarm, 10000);
}

function scriptRuneFarm() {
    if(phase === 0) pMana += 0.5; updateBars();
}

function updateBars() {
    document.getElementById("player-hp").style.width = `${Math.max(0, pHP)}%`;
    document.getElementById("enemy-hp").style.width = `${Math.max(0, eHP)}%`;
    document.getElementById("player-mana").style.width = `${Math.min(100, (pMana/10)*100)}%`;
    if(pHP < 10 && currentRune === "ondas") document.getElementById("player-hp").style.background = "#00bcd4";
}

function renderBoard() {
    const ph = document.getElementById("player-hand");
    ph.innerHTML = "";
    for(let i=0; i<4; i++) {
        let cost = Math.floor(Math.random()*3)+1;
        let c = document.createElement("div");
        c.className = "playing-card";
        c.draggable = true;
        c.innerHTML = `
            <div class="card-cost">${cost}</div>
            <div class="card-name">Lacaio ${i}</div>
            <div class="card-img"></div>
            <div class="card-stats"><span class="card-atk">⚔ ${cost*2}</span><span class="card-hp">♥ ${cost*3}</span></div>
        `;
        c.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", JSON.stringify({atk:cost*2, hp:cost*3, cost:cost}));
        });
        ph.appendChild(c);
    }
}

const pb = document.getElementById("player-board");
pb.addEventListener("dragover", (e) => e.preventDefault());
pb.addEventListener("drop", (e) => {
    e.preventDefault();
    let data = JSON.parse(e.dataTransfer.getData("text/plain"));
    if(pMana >= data.cost) {
        pMana -= data.cost;
        let c = document.createElement("div");
        c.className = "playing-card";
        c.innerHTML = `
            <div class="card-cost">${data.cost}</div>
            <div class="card-name">Lacaio</div>
            <div class="card-img"></div>
            <div class="card-stats"><span class="card-atk">⚔ ${data.atk}</span><span class="card-hp">♥ ${data.hp}</span></div>
        `;
        pb.appendChild(c);
        updateBars();
    }
});

document.getElementById("btn-end-turn").addEventListener("click", () => {
    phase = (phase + 1) % 4;
    const pi = document.getElementById("phase-indicator");
    if(phase===0) { pi.textContent = "FASE DE COMPRA"; pMaxMana = Math.min(10, pMaxMana+1); pMana = pMaxMana; globalTurnCounter++; }
    if(phase===1) pi.textContent = "FASE PRINCIPAL";
    if(phase===2) { pi.textContent = "FASE DE COMBATE"; doCombat(); }
    if(phase===3) { 
        pi.textContent = "FIM DE TURNO"; 
        if(currentRune === "anjo") { pMana++; }
        setTimeout(()=>document.getElementById("btn-end-turn").click(), 1500);
    }
    updateBars();
});

function doCombat() {
    let dmg = pb.children.length * 5;
    if(currentRune === "clone") dmg *= 1.5;
    takeDamage(dmg, "enemy");
    let eDmg = Math.floor(Math.random()*15);
    takeDamage(eDmg, "player");
}

function takeDamage(amt, target) {
    if(target === "player") {
        if(currentRune === "ondas" && pHP < 10) {
            eHP -= amt * 0.3;
        }
        pHP -= amt;
        if(pHP <= 0 && currentRune === "morte") { pHP = 100; currentRune = null; }
    } else {
        eHP -= amt;
    }
    updateBars();
}

const canvas = document.getElementById("grimoire-canvas");
const ctx = canvas.getContext("2d");
let isDrawing = false;
let pts = [];
let comboBuffer = [];
let comboTimer = null;

window.addEventListener("resize", () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
canvas.width = window.innerWidth; canvas.height = window.innerHeight;

window.addEventListener("keydown", (e) => {
    const valid = ["q","w","e"];
    if(valid.includes(e.key.toLowerCase())) {
        canvas.style.display = "block";
        canvas.style.pointerEvents = "auto";
        comboBuffer.push(e.key.toLowerCase());
        let maxL = currentRune === "pintor" ? 4 : 3;
        if(comboBuffer.length > maxL) comboBuffer.shift();
        clearTimeout(comboTimer);
        comboTimer = setTimeout(() => { comboBuffer = []; canvas.style.display="none"; canvas.style.pointerEvents="none"; }, 2000);
    }
});

canvas.addEventListener("mousedown", (e) => { isDrawing = true; pts = [{x:e.clientX, y:e.clientY}]; });
canvas.addEventListener("mousemove", (e) => {
    if(!isDrawing) return;
    pts.push({x:e.clientX, y:e.clientY});
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath();
    ctx.strokeStyle = comboBuffer[comboBuffer.length-1]==='q'?"#e74c3c":comboBuffer[comboBuffer.length-1]==='w'?"#3498db":"#9b59b6";
    ctx.lineWidth = 5;
    ctx.moveTo(pts[0].x, pts[0].y);
    for(let i=1; i<pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
});
canvas.addEventListener("mouseup", () => {
    isDrawing = false;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    analyzeGesture();
});

function analyzeGesture() {
    if(pts.length < 10) return;
    let minX=9999, maxX=0, minY=9999, maxY=0;
    pts.forEach(p => {
        if(p.x<minX) minX=p.x; if(p.x>maxX) maxX=p.x;
        if(p.y<minY) minY=p.y; if(p.y>maxY) maxY=p.y;
    });
    let dx = maxX-minX; let dy = maxY-minY;
    let dist = Math.hypot(pts[0].x-pts[pts.length-1].x, pts[0].y-pts[pts.length-1].y);
    
    if(dx < dy * 0.2) executeSpell("|");
    else if(dist < Math.max(dx,dy)*0.3 && dx > 50 && dy > 50) executeSpell("0");
    else executeSpell(">");
}

function executeSpell(shape) {
    let cb = comboBuffer.join("");
    if(shape === "|") takeDamage(15, "enemy");
    if(shape === "0" && cb.includes("w")) { pHP = Math.min(100, pHP+20); updateBars(); }
    if(shape === ">" && cb === "qqq") {
        document.getElementById("enemy-board").innerHTML = "";
        takeDamage(30, "enemy");
    }
    if(shape === ">" && cb === "qwe" && currentRune === "pintor") {
        document.body.style.filter = "invert(100%)";
        setTimeout(()=>document.body.style.filter="none", 500);
        takeDamage(50, "enemy");
    }
    comboBuffer = [];
    canvas.style.display="none"; 
    canvas.style.pointerEvents="none";
}
