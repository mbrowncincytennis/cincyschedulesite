
"use client";
import { useState } from "react";

export default function Login() {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/login", { method: "POST", body: JSON.stringify({ pw }) });
    if (res.ok) {
      window.location.href = "/";
    } else {
      setErr("Incorrect password.");
    }
  }

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",background:"#f7f7f8"}}>
      <form onSubmit={onSubmit} style={{background:"white",padding:24,borderRadius:16,boxShadow:"0 6px 20px rgba(0,0,0,0.07)", minWidth:320}}>
        <h1 style={{margin:0, fontSize:20, fontWeight:600, marginBottom:12}}>Staff Map Login</h1>
        <input type="password" placeholder="Password" value={pw} onChange={e=>setPw(e.target.value)}
          style={{width:"100%",padding:"10px 12px",border:"1px solid #ddd",borderRadius:12}} />
        <button type="submit" style={{marginTop:12,width:"100%",padding:"10px 12px",borderRadius:12, background:"#111",color:"white",border:"none"}}>
          Enter
        </button>
        {err && <div style={{color:"#b91c1c", fontSize:12, marginTop:8}}>{err}</div>}
      </form>
    </main>
  );
}
