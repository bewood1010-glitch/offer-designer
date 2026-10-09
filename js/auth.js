"use strict";
/* Member gate: nickname + password accounts approved by an admin.
   Backed by Supabase Postgres RPC functions (see supabase/schema.sql).
   Only the nickname and a bcrypt hash live on the server; no candidate/employee data is ever sent. */
window.Auth = (function(){
  const CFG = window.OD_CONFIG || {};
  const enabled = !!(CFG.supabaseUrl && CFG.supabaseKey);
  const SKEY = "od_session";
  let session = null;   // {token, nickname, is_admin}

  function headers(){
    const h = {"Content-Type":"application/json", "apikey": CFG.supabaseKey};
    if (!String(CFG.supabaseKey).startsWith("sb_publishable_")) h.Authorization = "Bearer " + CFG.supabaseKey;
    return h;
  }
  async function rpc(fn, args){
    const r = await fetch(CFG.supabaseUrl.replace(/\/$/,"") + "/rest/v1/rpc/" + fn, {method:"POST", headers: headers(), body: JSON.stringify(args || {})});
    if (!r.ok) throw new Error("http " + r.status);
    return r.json();
  }
  const load = () => { try { return JSON.parse(localStorage.getItem(SKEY) || "null"); } catch(e){ return null; } };
  const store = s => { try { s ? localStorage.setItem(SKEY, JSON.stringify(s)) : localStorage.removeItem(SKEY); } catch(e){} };

  return {
    enabled,
    get session(){ return session; },
    async restore(){
      const s = load(); if (!s || !s.token) return false;
      try { const r = await rpc("od_me", {p_token: s.token}); if (r && r.ok){ session = {token: s.token, nickname: r.nickname, is_admin: !!r.is_admin}; store(session); return true; } }
      catch(e){ if (s) { session = s; return "offline"; } }
      store(null); return false;
    },
    async signup(nick, pw){ return rpc("od_signup", {p_nick: nick, p_pw: pw}); },
    async login(nick, pw){
      const r = await rpc("od_login", {p_nick: nick, p_pw: pw});
      if (r && r.ok){ session = {token: r.token, nickname: r.nickname, is_admin: !!r.is_admin}; store(session); }
      return r;
    },
    async logout(){ const s = session; session = null; store(null); if (s) { try { await rpc("od_logout", {p_token: s.token}); } catch(e){} } },
    async check(){ if (!session) return false; try { const r = await rpc("od_me", {p_token: session.token}); return !!(r && r.ok); } catch(e){ return true; } },
    changePassword(oldPw, newPw){ return rpc("od_change_password", {p_token: session.token, p_old: oldPw, p_new: newPw}); },
    async withdraw(pw){ const r = await rpc("od_withdraw", {p_token: session.token, p_pw: pw}); if (r && r.ok){ session = null; store(null); } return r; },
    adminList(){ return rpc("od_admin_list", {p_token: session.token}); },
    adminSet(userId, action){ return rpc("od_admin_set", {p_token: session.token, p_user: userId, p_action: action}); }
  };
})();
