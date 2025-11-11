"use client";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";

/** ปรับให้ตรงกับ backend ของคุณ */
const BACKEND_BASE = "http://localhost:8000";

export default function DebugAuth_A() {
  const { data: session, status } = useSession();
  const [token, setToken] = useState("");
  const [autoAttach, setAutoAttach] = useState(true);
  const [running, setRunning] = useState(false);
  const [res, setRes] = useState({});

  // ดึง apiToken จาก session (วิธี A)
  useEffect(() => {
    if (session?.apiToken) setToken(session.apiToken);
  }, [session]);

  const STEPS = useMemo(
    () => [
      { key: "session", name: "GET /api/auth/session (อ่าน apiToken)" },
      { key: "secret", name: `GET ${BACKEND_BASE}/api/_debug/secret` },
      { key: "headers", name: `GET ${BACKEND_BASE}/api/_debug/headers` },
      { key: "tokenInfo", name: `GET ${BACKEND_BASE}/api/_debug/token-info` },
      { key: "me", name: `GET ${BACKEND_BASE}/api/_debug/me` },
    ],
    []
  );
  const save = (k, v) => setRes((p) => ({ ...p, [k]: v }));

  async function sfetch(url, init = {}) {
    const t0 = performance.now();
    try {
      const r = await fetch(url, {
        ...init,
        headers: { "Content-Type": "application/json", ...(init.headers || {}) },
        cache: "no-store",
        credentials: "include",
      });
      const ms = Math.round(performance.now() - t0);
      let body;
      try {
        body = await r.json();
      } catch {
        body = { _note: "non-JSON response", statusText: r.statusText };
      }
      return { ok: r.ok, status: r.status, body, ms };
    } catch (e) {
      const ms = Math.round(performance.now() - t0);
      return { ok: false, status: 0, body: { error: String(e) }, ms };
    }
  }

  // ----- runners -----
  async function runSession() {
    const r = await sfetch("/api/auth/session");
    // sync token จาก session ทันที
    const t = r?.body?.apiToken || r?.body?.user?.apiToken || "";
    if (t) setToken(t);
    return r;
  }
  const runSecret = (b) =>
    sfetch(`${BACKEND_BASE}/api/_debug/secret`, {
      headers: b ? { Authorization: `Bearer ${b}` } : {},
    });
  const runHeaders = (b) =>
    sfetch(`${BACKEND_BASE}/api/_debug/headers`, {
      headers: b ? { Authorization: `Bearer ${b}` } : {},
    });
  const runTokenInfo = (b) =>
    sfetch(`${BACKEND_BASE}/api/_debug/token-info`, {
      headers: b ? { Authorization: `Bearer ${b}` } : {},
    });
  const runMe = (b) =>
    sfetch(`${BACKEND_BASE}/api/_debug/me`, {
      headers: b ? { Authorization: `Bearer ${b}` } : {},
    });

  async function runAll() {
    if (running) return;
    setRunning(true);
    setRes({});
    try {
      // 1) อ่าน session เพื่อดึง apiToken
      const sRes = await runSession();
      save("session", sRes);
      let bearer = autoAttach ? (sRes?.body?.apiToken || token || "") : "";
      // 2) ยิงดีบั๊กชุดต่อไป
      save("secret", await runSecret(bearer));
      save("headers", await runHeaders(bearer));
      save("tokenInfo", await runTokenInfo(bearer));
      save("me", await runMe(bearer));
    } finally {
      setRunning(false);
    }
  }

  async function runOne(key) {
    if (running) return;
    setRunning(true);
    try {
      if (key === "session") return save("session", await runSession());
      const b = autoAttach ? token?.trim() : "";
      if (key === "secret") return save("secret", await runSecret(b));
      if (key === "headers") return save("headers", await runHeaders(b));
      if (key === "tokenInfo") return save("tokenInfo", await runTokenInfo(b));
      if (key === "me") return save("me", await runMe(b));
    } finally {
      setRunning(false);
    }
  }

  // ----- UI helpers -----
  const Badge = ({ ok }) => (
    <span className={`ml-2 rounded px-2 py-0.5 text-xs ${ok ? "bg-green-700" : "bg-rose-700"} text-slate-100`}>
      {ok ? "OK" : "FAIL"}
    </span>
  );

  return (
    <div className="mx-auto max-w-4xl p-6 text-slate-100 bg-slate-900 min-h-screen">
      <h1 className="text-2xl font-semibold mb-2">Auth Debug – Method A (session.apiToken)</h1>
      <p className="text-slate-300 mb-4">
        วิธีนี้อ่าน <code className="text-sky-300">apiToken</code> จาก <code className="text-sky-300">/api/auth/session</code> แล้วแนบเป็น Bearer ไป Backend โดยตรง
      </p>

      <div className="rounded-lg border border-slate-700 p-4 space-y-3 bg-slate-800">
        <div className="text-sm">
          NextAuth session status: <b className="text-slate-100">{status}</b>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            <div className="mb-1 text-slate-300">Backend Base URL</div>
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2"
              value={BACKEND_BASE}
              readOnly
            />
          </label>

          <label className="text-sm">
            <div className="mb-1 text-slate-300">Bearer token (จาก session.apiToken หรือตั้งเอง)</div>
            <input
              className="w-full rounded-md border border-slate-600 bg-slate-900 text-slate-100 px-3 py-2"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="จะเติมให้อัตโนมัติหลังรัน /api/auth/session"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={autoAttach}
            onChange={(e) => setAutoAttach(e.target.checked)}
          />
          แนบ Authorization header อัตโนมัติ (ถ้ามี token)
        </label>

        <div className="flex gap-2">
          <button
            onClick={runAll}
            disabled={running}
            className="rounded-md bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm font-medium disabled:opacity-50"
          >
            {running ? "Running…" : "Run all"}
          </button>
          <button
            onClick={() => runOne("session")}
            disabled={running}
            className="rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-2 text-sm disabled:opacity-50"
          >
            Get session only
          </button>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {STEPS.map(({ key, name }) => (
          <DebugBox key={key} title={name} r={res[key]} onRun={() => runOne(key)} running={running} />
        ))}
      </div>

      <div className="rounded-lg border border-slate-700 p-4 text-sm text-slate-200 bg-slate-800 mt-6">
        <div className="font-medium mb-1">วิธีอ่านผล</div>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            กล่อง <b>session</b> ควรมี <code className="text-sky-300">apiToken</code>
          </li>
          <li>
            <b>headers</b> ต้องเห็น Bearer ถ้าเปิด “แนบ header”
          </li>
          <li>
            <b>token-info</b>: <code className="text-sky-300">compactParts = 5</code> (JWE) หรือ <code className="text-sky-300">= 3</code> (JWS)
          </li>
          <li>
            <b>me</b> = 200 พร้อม <code className="text-sky-300">{`{ user: { id, ... } }`}</code>
          </li>
        </ul>
      </div>
    </div>
  );
}

function DebugBox({ title, r, onRun, running }) {
  const dot =
    !r ? "bg-slate-500" : r.ok ? "bg-green-500" : "bg-rose-500";
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-800">
      <div className="flex items-center justify-between gap-3 border-b border-slate-700 p-3">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2 w-2 rounded-full ${dot}`} />
          <div className="font-medium text-slate-100">{title}</div>
          {r?.ms ? <div className="text-xs text-slate-400">{r.ms} ms</div> : null}
          {r?.status ? (
            <span className={`ml-2 rounded px-2 py-0.5 text-xs ${r.ok ? "bg-green-700" : "bg-rose-700"} text-slate-100`}>
              {r.ok ? "OK" : "FAIL"} {r.status}
            </span>
          ) : null}
        </div>
        <button
          onClick={onRun}
          disabled={running}
          className="rounded-md bg-slate-700 hover:bg-slate-600 px-2 py-1 text-xs text-slate-100 disabled:opacity-50"
        >
          Run
        </button>
      </div>
      <div className="p-3 text-xs">
        {r ? (
          <pre className="overflow-auto rounded bg-slate-900 text-slate-100 p-3">
            {JSON.stringify(r.body, null, 2)}
          </pre>
        ) : (
          <div className="text-slate-300">ยังไม่รัน</div>
        )}
      </div>
    </div>
  );
}
