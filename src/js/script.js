// ---------- Constantes básicas ----------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const ALTURA_CH = 80, GRAV = 0.6;
const MAP_W = 1400, MAP_D = 600;
const PAREDE = { xMin: 0, xMax: MAP_W, zMin: 0, zMax: MAP_D };
const isoS = 0.7, camX = canvas.width / 3, camY = 120;
function iso(x, z) {
    return { eX: (x - z) * isoS + camX, eY: (x + z) * isoS / 2 + camY };
}

// ---------- Personagem ----------
function newChar(x, z, t) {
    return {
        tipo: t, nome: t === "A" ? "Religião" : "Ciência",
        x, z, y: ALTURA_CH, vy: 0, vida: 100,
        defesa: false, defDur: 0, defCd: 0, defesas: 5,
        proj: 20, cdTiro: 0, esp: 5, espCd: 0,
        cdAtk: 0, dir: 1, emoji: t === "A" ? "🧙‍♂️" : "🤖",
        personalidade: null, acaoEmoji: "", iaKeys: {}, state: "alerta",
        empurrado: false, empurraDur: 0,
        lastSwitch: 0, rndDir: 0
    };
}
let A = newChar(200, 150, "A"), B = newChar(1000, 400, "B");

function choosePers(p) {
    const l = ["agressiva", "defensiva", "imprevisível"];
    p.personalidade = l[Math.floor(Math.random() * 3)];
}
choosePers(A); choosePers(B);

// ---------- Desenho do chão ----------
function drawFloor() {
    ctx.font = "25px serif";
    for (let gx = 0; gx <= MAP_W; gx += 40)
        for (let gz = 0; gz <= MAP_D; gz += 40) {
            const { eX, eY } = iso(gx, gz); ctx.fillText("⬜️", eX, eY);
        }
    ctx.font = "35px serif";
    for (let gx = 0; gx <= MAP_W; gx += 40) {
        let p = iso(gx, MAP_D); ctx.fillText("🧱", p.eX, p.eY + 20);
    }
    for (let gz = 0; gz <= MAP_D; gz += 40) {
        let p1 = iso(0, gz), p2 = iso(MAP_W, gz);
        ctx.fillText("🧱", p1.eX - 25, p1.eY - 10); ctx.fillText("🧱", p2.eX + 25, p2.eY - 10);
    }
}

// ---------- Desenho personagens e projéteis ----------
function drawChar(p) {
    const { eX, eY } = iso(p.x, p.z);
    ctx.font = "32px serif"; ctx.fillText(p.emoji, eX, eY - p.y + ALTURA_CH);
    ctx.fillStyle = "lime"; ctx.fillRect(eX - 20, eY - p.y - 50, p.vida * .4, 5);
    ctx.fillStyle = "#000"; ctx.font = "12px sans-serif";
    ctx.fillText(`${p.nome} (${p.personalidade})`, eX - 20, eY - p.y - 60);
    if (p.defesa) ctx.fillText("🛡️", eX - 6, eY - p.y - 30);
    if (p.acaoEmoji) ctx.fillText(p.acaoEmoji, eX + 26, eY - p.y - 4);
}
function drawProj(pr) {
    const { eX, eY } = iso(pr.x, pr.z);
    ctx.font = pr.tipo === "esp" ? "38px serif" : "20px serif";
    ctx.fillText(pr.tipo === "esp"
        ? (pr.dono.tipo === "A" ? "☄️" : "🚀")
        : (pr.dono.tipo === "A" ? "🔥" : "⚡"),
        eX, eY - pr.y + ALTURA_CH);
}

// ---------- Movimentos ----------
function moveToward(p, tx, tz) {
    p.iaKeys = { l: tx < p.x - 10, r: tx > p.x + 10, up: tz < p.z - 10, dn: tz > p.z + 10 };
    p.dir = p.iaKeys.l ? -1 : 1;
}
function strafe(p, e, horz = 1) {
    const a = Math.atan2(e.z - p.z, e.x - p.x) + Math.PI / 2 * horz;
    p.iaKeys = {
        l: Math.cos(a) < 0, r: Math.cos(a) >= 0,
        up: Math.sin(a) < 0, dn: Math.sin(a) >= 0
    };
}
function backAway(p, e) {
    const a = Math.atan2(p.z - e.z, p.x - e.x);
    p.iaKeys = {
        l: Math.cos(a) < 0, r: Math.cos(a) >= 0,
        up: Math.sin(a) < 0, dn: Math.sin(a) >= 0
    };
}
function patrol(p) {
    if (Date.now() - p.lastSwitch > 2000) {
        p.lastSwitch = Date.now();
        p.rndDir = Math.random() * 2 * Math.PI;
    }
    p.iaKeys = {
        l: Math.cos(p.rndDir) < -0.2, r: Math.cos(p.rndDir) > 0.2,
        up: Math.sin(p.rndDir) < -0.2, dn: Math.sin(p.rndDir) > 0.2
    };
}
function canShootLine(p, e) {
    return Math.abs(p.z - e.z) < 50;
}

// ---------- Ataques ----------
let balas = [];
function shoot(p) {
    if (p.proj <= 0 || p.cdTiro > 0) return;
    p.proj--; p.cdTiro = 10; p.acaoEmoji = "🔥";
    balas.push({ x: p.x + 20 * p.dir, z: p.z, y: p.y - 30, vx: 14 * p.dir, vz: 0, vy: -2, dono: p, tipo: "norm" });
}
function shootEsp(p) {
    if (p.esp <= 0 || p.espCd > 0) return;
    p.esp--; p.espCd = 80; p.acaoEmoji = p.tipo === "A" ? "☄️" : "🚀";
    balas.push({ x: p.x + 30 * p.dir, z: p.z, y: p.y - 50, vx: 14 * p.dir, vz: 0, vy: -1.5, dono: p, tipo: "esp" });
}
function defend(p) {
    if (p.defCd > 0 || p.defesas <= 0) return;
    p.defesa = true; p.defDur = 50; p.defCd = 180; p.defesas--; p.acaoEmoji = "🛡️";
}
function melee(at, df) {
    if (at.cdAtk > 0) return;
    if (Math.hypot(at.x - df.x, at.z - df.z) < 55) {
        if (!df.defesa) df.vida -= 3;
        const vx = df.x - at.x, vz = df.z - at.z, mag = Math.hypot(vx, vz) || 1;
        const força = 60;
        df.x += vx / mag * força; df.z += vz / mag * força;
        df.x = Math.max(PAREDE.xMin, Math.min(PAREDE.xMax, df.x));
        df.z = Math.max(PAREDE.zMin, Math.min(PAREDE.zMax, df.z));
        df.empurrado = true; df.empurraDur = 20;
    }
    at.cdAtk = 12; at.acaoEmoji = "👊";
}

// ---------- Inteligência Artificial ----------
function think(p, e) {
    const dist = Math.hypot(e.x - p.x, e.z - p.z);
    const nearShot = balas.some(b => b.dono !== p && Math.hypot(b.x - p.x, b.z - p.z) < 90);
    p.iaKeys = { l: 0, r: 0, up: 0, dn: 0 };
    if (p.empurrado) return;

    switch (p.personalidade) {
        case "agressiva":
            if (dist < 60) melee(p, e); else moveToward(p, e.x, e.z);
            if (canShootLine(p, e) && dist < 250) shoot(p);
            if (p.esp > 0 && p.espCd === 0) shootEsp(p);
            if (nearShot && Math.random() < 0.05) defend(p);
            break;

        case "defensiva":
            if (dist < 120) backAway(p, e);
            else if (dist > 250) moveToward(p, e.x, e.z);
            else strafe(p, e, Math.random() < 0.5 ? -1 : 1);
            if (canShootLine(p, e) && dist < 300) shoot(p);
            if (nearShot && !p.defesa) defend(p);
            if (Math.random() < 0.02 && p.esp > 0) shootEsp(p);
            break;

        case "imprevisível":
            if (Date.now() - p.lastSwitch > 2000 + Math.random() * 2000) {
                p.state = ["rush", "kite", "flank"][Math.floor(Math.random() * 3)];
                p.lastSwitch = Date.now();
            }
            if (p.state === "rush") moveToward(p, e.x, e.z);
            else if (p.state === "kite") backAway(p, e);
            else strafe(p, e, 1);
            if (Math.random() < 0.3) melee(p, e);
            if (Math.random() < 0.2) shoot(p);
            if (Math.random() < 0.05 && p.esp > 0) shootEsp(p);
            if (nearShot && Math.random() < 0.2) defend(p);
            break;
    }
}

// ---------- Atualizações ----------
function updateChar(p, e) {
    if (p.empurrado && --p.empurraDur <= 0) p.empurrado = false;
    if (p.defDur > 0 && --p.defDur === 0) p.defesa = false;
    if (p.cdAtk > 0) p.cdAtk--;
    if (p.cdTiro > 0) p.cdTiro--;
    if (p.defCd > 0) p.defCd--;
    if (p.espCd > 0) p.espCd--;

    think(p, e);

    const vel = 9;
    if (p.iaKeys.l) p.x -= vel;
    if (p.iaKeys.r) p.x += vel;
    if (p.iaKeys.up) p.z -= vel;
    if (p.iaKeys.dn) p.z += vel;
    p.x = Math.max(PAREDE.xMin, Math.min(PAREDE.xMax, p.x));
    p.z = Math.max(PAREDE.zMin, Math.min(PAREDE.zMax, p.z));
}
function updateBalas() {
    for (let i = balas.length - 1; i >= 0; i--) {
        const b = balas[i];
        b.x += b.vx; b.z += b.vz; b.y += b.vy; b.vy -= GRAV / 4;
        if (b.y < ALTURA_CH - 20) { b.y = ALTURA_CH - 20; b.vy = -b.vy * 0.5; }
        const alvo = b.dono === A ? B : A;
        if (Math.hypot(alvo.x - b.x, alvo.z - b.z) < 40) {
            if (!alvo.defesa) alvo.vida -= (b.tipo === "esp" ? 25 : 3);
            balas.splice(i, 1); continue;
        }
        if (b.x < 0 || b.x > MAP_W || b.z < 0 || b.z > MAP_D) balas.splice(i, 1);
    }
}

// ---------- Loop ----------
function step() {
    if (!started) return;
    updateChar(A, B); updateChar(B, A); updateBalas();
    draw(); updateUI();
    if (A.vida <= 0 || B.vida <= 0) {
        started = false;
        status.textContent = `Fim! Vencedor: ${A.vida > B.vida ? A.nome : B.nome}`;
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawFloor(); balas.forEach(drawProj);
    drawChar(A); drawChar(B);
}

// ---------- UI ----------
const contadorA = document.getElementById("contadorA");
const contadorB = document.getElementById("contadorB");
const status = document.getElementById("status");
function updateUI() {
    contadorA.textContent = `Religião | Vida: ${A.vida.toFixed(0)} | Def: ${A.defesas} | Proj: ${A.proj} | Esp: ${A.esp}`;
    contadorB.textContent = `Ciência | Vida: ${B.vida.toFixed(0)} | Def: ${B.defesas} | Proj: ${B.proj} | Esp: ${B.esp}`;
}

// ---------- Início ----------
let started = true;
setInterval(step, 25);
