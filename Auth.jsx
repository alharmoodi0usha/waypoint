import { useState } from "react";
import { supabase } from "./lib/supabase";
import { Compass, Loader2 } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Check your email to confirm your account, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      setMsg(err.message || "Something went wrong.");
    }
    setBusy(false);
  }

  return (
    <div className="wp-auth">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300&family=Outfit:wght@300;400;500&family=IBM+Plex+Mono:wght@400;500&display=swap');
        .wp-auth {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background:
            radial-gradient(1200px 500px at 80% -10%, rgba(127,184,164,0.10), transparent 60%),
            radial-gradient(900px 420px at -10% 20%, rgba(217,164,65,0.07), transparent 55%),
            #10221E;
          font-family: 'Outfit', sans-serif; color: #F5EFE2; padding: 24px;
        }
        .wp-auth-card { width: 100%; max-width: 400px; border: 1px solid rgba(245,239,226,0.14); border-radius: 22px; background: #16302A; padding: 34px 30px; }
        .wp-auth-brand { display: flex; align-items: center; gap: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: #7FB8A4; margin-bottom: 18px; }
        .wp-auth h1 { font-family: 'Fraunces', serif; font-weight: 300; font-size: 32px; margin: 0 0 6px; line-height: 1.05; }
        .wp-auth h1 em { font-style: italic; color: #7FB8A4; }
        .wp-auth p { font-size: 13px; color: #CFC7B4; line-height: 1.6; margin: 0 0 24px; }
        .wp-auth label { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: #7FB8A4; margin: 0 0 6px; }
        .wp-auth input { width: 100%; box-sizing: border-box; border: 1px solid rgba(245,239,226,0.14); border-radius: 12px; padding: 12px 14px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 14px; background: #10221E; color: #F5EFE2; outline: none; margin-bottom: 14px; transition: border-color 0.2s; }
        .wp-auth input:focus { border-color: #7FB8A4; }
        .wp-auth button.main { width: 100%; border: none; background: #D9A441; color: #10221E; font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; padding: 13px; border-radius: 999px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; }
        .wp-auth button.main:disabled { opacity: 0.5; }
        .wp-auth .swap { margin-top: 16px; font-size: 12.5px; color: #CFC7B4; text-align: center; }
        .wp-auth .swap button { background: none; border: none; color: #D9A441; cursor: pointer; font: inherit; text-decoration: underline; }
        .wp-auth .msg { margin-top: 12px; font-size: 12.5px; color: #C96F4A; text-align: center; line-height: 1.5; }
      `}</style>
      <div className="wp-auth-card">
        <div className="wp-auth-brand"><Compass size={14} /> Waypoint</div>
        <h1>The part <em>after</em><br />you get in.</h1>
        <p>Visas, landing plans, notes, and people who've already done it.</p>
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.ae" />
          <label>Password</label>
          <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" />
          <button className="main" disabled={busy}>
            {busy && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <div className="swap">
          {mode === "signin" ? <>New here? <button onClick={() => { setMode("signup"); setMsg(""); }}>Create an account</button></>
            : <>Already have an account? <button onClick={() => { setMode("signin"); setMsg(""); }}>Sign in</button></>}
        </div>
        {msg && <div className="msg">{msg}</div>}
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
