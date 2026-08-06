/** Smoke-test the online worker: create room, join 2 players, roll, verify redaction. */
const BASE = process.env.ONLINE_URL || "http://127.0.0.1:8787";
const wsBase = BASE.replace(/^http/, "ws");

function connect(code, name, playerId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(
      `${wsBase}/api/rooms/${code}/ws?name=${encodeURIComponent(name)}&playerId=${playerId}&skinId=classic_white`
    );
    const inbox = [];
    ws.addEventListener("message", (ev) => inbox.push(JSON.parse(ev.data)));
    ws.addEventListener("open", () => resolve({ ws, inbox, name }));
    ws.addEventListener("error", (e) => reject(e.error || e));
  });
}

function waitFor(client, pred, ms = 8000) {
  const t0 = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const hit = client.inbox.find(pred);
      if (hit) return resolve(hit);
      if (Date.now() - t0 > ms) return reject(new Error(`${client.name} timeout`));
      setTimeout(tick, 40);
    };
    tick();
  });
}

const health = await fetch(`${BASE}/api/health`).then((r) => r.json());
if (!health?.ok) throw new Error("health failed");
const { code } = await fetch(`${BASE}/api/rooms`, { method: "POST" }).then((r) => r.json());
const a = await connect(code, "Alice", "smoke-a");
const b = await connect(code, "Bob", "smoke-b");
const vis = {
  hideDice: true,
  hideTurnScore: true,
  hidePowerPanel: true,
  hidePowerChargeBadge: true,
  hideXrayReveals: true,
  subtlePowerVfx: true,
};
a.ws.send(JSON.stringify({ type: "join", name: "Alice", skinId: "classic_white", visibility: vis }));
b.ws.send(JSON.stringify({ type: "join", name: "Bob", skinId: "matrix", visibility: vis }));
await waitFor(a, (m) => m.type === "joined");
await waitFor(b, (m) => m.type === "joined");
a.ws.send(JSON.stringify({ type: "ready" }));
b.ws.send(JSON.stringify({ type: "ready" }));
await waitFor(a, (m) => m.type === "match_state");
await waitFor(b, (m) => m.type === "match_state");
a.inbox.length = 0;
b.inbox.length = 0;
a.ws.send(JSON.stringify({ type: "action", action: "roll" }));
const rollA = await waitFor(a, (m) => m.type === "match_state" && m.payload?.hasRolled);
const rollB = await waitFor(b, (m) => m.type === "match_state" && m.payload?.hasRolled);
if (!rollA.payload.dice.every((d) => typeof d.value === "number")) throw new Error("roller sees values");
if (!rollB.payload.dice.every((d) => d.valueHidden && d.value == null)) throw new Error("opponent redaction");
console.log(`ok room=${code} redaction=pass`);
a.ws.close();
b.ws.close();
