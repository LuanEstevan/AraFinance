import { useState, useMemo, useEffect, useCallback } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

// -- Categories ------------------------------------------------
const EXPENSE_CATS = [
  { name:"Moradia",     icon:"home",      color:"#22d3ee" },
  { name:"Alimentação", icon:"food",      color:"#facc15" },
  { name:"Transporte",  icon:"transport", color:"#818cf8" },
  { name:"Posto",       icon:"fuel",      color:"#f97316" },
  { name:"Saúde",       icon:"health",    color:"#f43f5e" },
  { name:"Lazer",       icon:"leisure",   color:"#a78bfa" },
  { name:"Educação",    icon:"education", color:"#34d399" },
  { name:"Assinaturas", icon:"sub",       color:"#e879f9" },
  { name:"Roupa",       icon:"clothes",   color:"#fb7185" },
  { name:"Produtos",    icon:"products",  color:"#38bdf8" },
  { name:"Crédito",     icon:"credit",    color:"#fbbf24" },
  { name:"PIX",         icon:"pix",       color:"#4ade80" },
  { name:"Outros",      icon:"other",     color:"#94a3b8" },
];
const INCOME_CATS = [
  { name:"Salário",          icon:"salary",    color:"#4ade80" },
  { name:"Gorjeta",          icon:"tip",       color:"#facc15" },
  { name:"Vale",             icon:"voucher",   color:"#60a5fa" },
  { name:"Vale Transporte",  icon:"transport", color:"#fb923c" },
  { name:"PIX",              icon:"pix",       color:"#38bdf8" },
  { name:"Outros",           icon:"other",     color:"#94a3b8" },
];
const ALL_CATS = [...EXPENSE_CATS, ...INCOME_CATS];

// Display names with accents (for UI only, never used as identifiers)
const CAT_DISPLAY = {
  "Alimentação":"Alimentação","Saúde":"Saúde","Educação":"Educação",
  "Crédito":"Crédito","Salário":"Salário",
};
const catLabel = (n) => CAT_DISPLAY[n] || n;

// -- Cat Icon component (module-level, no JSX in objects) ------
function CatIcon({ name, color, size }) {
  const sz = size || 18;
  const st = { width:sz, height:sz, display:"block", flexShrink:0,
               fill:"none", stroke:color, strokeWidth:1.8,
               strokeLinecap:"round", strokeLinejoin:"round" };
  if (name==="home")      return <svg style={st} viewBox="0 0 24 24"><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 21V12h6v9"/></svg>;
  if (name==="food")      return <svg style={st} viewBox="0 0 24 24"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>;
  if (name==="transport") return <svg style={st} viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
  if (name==="fuel")      return <svg style={st} viewBox="0 0 24 24"><path d="M3 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M3 11h12"/><path d="M15 6h2a2 2 0 0 1 2 2v3a2 2 0 0 0 2 2h0V6l-3-3"/></svg>;
  if (name==="health")    return <svg style={st} viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
  if (name==="leisure")   return <svg style={st} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>;
  if (name==="education") return <svg style={st} viewBox="0 0 24 24"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
  if (name==="sub")       return <svg style={st} viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>;
  if (name==="clothes")   return <svg style={st} viewBox="0 0 24 24"><path d="M20.38 3.46L16 2l-4 4-4-4L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.57a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.57a2 2 0 0 0-1.34-2.23z"/></svg>;
  if (name==="products")  return <svg style={st} viewBox="0 0 24 24"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
  if (name==="credit")    return <svg style={st} viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
  if (name==="pix")       return <svg style={st} viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
  if (name==="salary")    return <svg style={st} viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>;
  if (name==="tip")       return <svg style={st} viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
  if (name==="voucher")   return <svg style={st} viewBox="0 0 24 24"><path d="M20 12V22H4V12"/><path d="M22 7H2v5h20V7z"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/></svg>;
  return <svg style={st} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;
}

// -- Tab Icon component (module-level) -------------------------
function TabIcon({ tab, active, blue, sub }) {
  const c = active ? blue : sub;
  const w = "22", h = "22", vb = "0 0 24 24", sw = "2", sl = "round", sj = "round";
  if (tab==="dashboard")   return <svg width={w} height={h} viewBox={vb} fill="none" stroke={c} strokeWidth={sw} strokeLinecap={sl} strokeLinejoin={sj}><rect x="2" y="2" width="9" height="9" rx="2"/><rect x="13" y="2" width="9" height="9" rx="2"/><rect x="2" y="13" width="9" height="9" rx="2"/><rect x="13" y="13" width="9" height="9" rx="2"/></svg>;
  if (tab==="contas")      return <svg width={w} height={h} viewBox={vb} fill="none" stroke={c} strokeWidth={sw} strokeLinecap={sl} strokeLinejoin={sj}><rect x="2" y="5" width="20" height="14" rx="3"/><path d="M2 10h20"/><path d="M6 15h4"/><path d="M14 15h4"/></svg>;
  if (tab==="lançamentos") return <svg width={w} height={h} viewBox={vb} fill="none" stroke={c} strokeWidth={sw} strokeLinecap={sl} strokeLinejoin={sj}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="12" x2="15" y2="14"/></svg>;
  if (tab==="histórico")   return <svg width={w} height={h} viewBox={vb} fill="none" stroke={c} strokeWidth={sw} strokeLinecap={sl} strokeLinejoin={sj}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>;
  if (tab==="metas")       return <svg width={w} height={h} viewBox={vb} fill="none" stroke={c} strokeWidth={sw} strokeLinecap={sl} strokeLinejoin={sj}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>;
  return null;
}

// -- Constants -------------------------------------------------
const ACCOUNT_COLORS = ["#3b82f6","#8b5cf6","#ec4899","#ef4444","#f59e0b","#10b981","#06b6d4","#f97316","#6366f1","#64748b"];
const BANK_BRANDS = {
  "nubank":       { color:"#820AD1", bg:"#1a0628", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Nubank_logo_2021.svg/240px-Nubank_logo_2021.svg.png" },
  "itau":         { color:"#EC7000", bg:"#1e0e00", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Banco_Ita%C3%BA_logo.svg/240px-Banco_Ita%C3%BA_logo.svg.png" },
  "itauu":        { color:"#EC7000", bg:"#1e0e00", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Banco_Ita%C3%BA_logo.svg/240px-Banco_Ita%C3%BA_logo.svg.png" },
  "bradesco":     { color:"#CC0000", bg:"#1a0000", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Bradesco_logo.svg/240px-Bradesco_logo.svg.png" },
  "bb":           { color:"#F9DD16", bg:"#141100", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Banco_do_Brasil_logo_%282020%29.svg/240px-Banco_do_Brasil_logo_%282020%29.svg.png" },
  "caixa":        { color:"#0070AF", bg:"#000f1a", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Caixa_Econ%C3%B4mica_Federal_logo.svg/240px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png" },
  "inter":        { color:"#FF7A00", bg:"#1e0e00", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Banco_Inter_logo.svg/240px-Banco_Inter_logo.svg.png" },
  "c6":           { color:"#444",    bg:"#0a0a0a", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/C6_Bank_logo.svg/240px-C6_Bank_logo.svg.png" },
  "santander":    { color:"#EC0000", bg:"#1a0000", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Santander_Consumer_Finance_logo.svg/240px-Santander_Consumer_Finance_logo.svg.png" },
  "mercadopago":  { color:"#00b1ea", bg:"#001a24", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/MercadoPago_logo.svg/240px-MercadoPago_logo.svg.png" },
  "mercado":      { color:"#00b1ea", bg:"#001a24", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/MercadoPago_logo.svg/240px-MercadoPago_logo.svg.png" },
  "xp":           { color:"#555",    bg:"#0a0a0a", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/XP_Investimentos_logo_2019.svg/240px-XP_Investimentos_logo_2019.svg.png" },
};
const MONTHS = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const MONTHS_DISPLAY = ["Janeiro","Fevereiro","Marco","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const TABS = ["dashboard","contas","lançamentos","histórico","metas"];
const TAB_LABELS = { dashboard:"Dashboard", contas:"Contas", lançamentos:"Lançamentos", histórico:"Histórico", metas:"Metas" };

// -- Helpers ---------------------------------------------------
const C = { bg:"#0a0f1a", surface:"#111827", card:"#161e2e", border:"#1f2d45", muted:"#374151", text:"#f1f5f9", sub:"#6b7280", green:"#22c55e", red:"#ef4444", purple:"#a855f7", blue:"#3b82f6" };
const fmt  = (v) => v.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
const parseBR = (v) => { if (!v && v!==0) return 0; return parseFloat(String(v).trim().replace(/\./g,"").replace(",",".")) || 0; };
const normalize = (s) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
const getBrand = (name) => { const k = normalize(name); for (const b of Object.keys(BANK_BRANDS)) { if (k.includes(normalize(b))) return BANK_BRANDS[b]; } return null; };
const monthLabel = (ym) => { const [y,m] = ym.split("-"); return MONTHS[parseInt(m)-1]+" "+y; };
const fmtDate = (d) => d ? new Date(d).toLocaleString("pt-BR") : "";
const btn = (bg, extra) => ({ width:"100%", background:bg, color:bg==="#f1f5f9"?"#0a0f1a":"#fff", border:"none", borderRadius:12, padding:"13px", fontSize:15, fontWeight:700, cursor:"pointer", ...extra });
const iStyle = { width:"100%", background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"12px 14px", fontSize:16, color:C.text, outline:"none", boxSizing:"border-box" };

// -- Compression -----------------------------------------------
const KEY_MAP = { transactions:"T", accounts:"A", nextTxId:"ti", nextAccId:"ai", goals:"GL", nextGoalId:"gi", type:"tp", description:"ds", amount:"am", category:"ct", date:"dt", accountId:"ac", installments:"in", installmentGroup:"ig", advancedFrom:"af", id:"id", kind:"kd", limit:"lm", balance:"bl", colorIdx:"ci", name:"nm" };
const KEY_UNMAP = Object.fromEntries(Object.entries(KEY_MAP).map(([k,v])=>[v,k]));
const SKIP_KEYS = new Set(["editId","lastSaved","installmentIndex","installmentTotal"]);
const compress = (data) => {
  const sh = (o) => { if (Array.isArray(o)) return o.map(sh); if (o && typeof o==="object") { const r={}; for (const [k,v] of Object.entries(o)) { if (SKIP_KEYS.has(k)) continue; if (v===null||v===undefined||v===""||v===false) continue; if (k==="installments"&&(v===1||v==="1")) continue; r[KEY_MAP[k]||k]=sh(v); } return r; } return o; };
  return btoa(unescape(encodeURIComponent(JSON.stringify(sh(data)))));
};
const decompress = (str) => {
  const ex = (o) => { if (Array.isArray(o)) return o.map(ex); if (o && typeof o==="object") { const r={}; for (const [k,v] of Object.entries(o)) { r[KEY_UNMAP[k]||k]=ex(v); } if (r.installments===undefined) r.installments=1; if (r.accountId===undefined) r.accountId=""; return r; } return o; };
  try { return ex(JSON.parse(decodeURIComponent(escape(atob(str))))); } catch(e) { return JSON.parse(str); }
};

// -- Modal component (module-level) ---------------------------
function Modal({ title, onClose, children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:100, display:"flex", alignItems:"flex-end" }} onClick={onClose}>
      <div style={{ background:C.surface, borderRadius:"20px 20px 0 0", width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"16px 16px 40px" }} onClick={e=>e.stopPropagation()}>
        <div style={{ width:36, height:4, background:C.muted, borderRadius:2, margin:"0 auto 16px" }} />
        {title && <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// -- Main App --------------------------------------------------
export default function App() {
  const now = new Date();
  const currentYM = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0");
  const todayStr  = now.getFullYear()+"-"+String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0");

  // All useState hooks first
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts]         = useState([]);
  const [goals, setGoals]               = useState([]);
  const [tab, setTab]                   = useState("dashboard");
  const [selectedMonth, setSelectedMonth] = useState(currentYM);
  const [nextTxId, setNextTxId]         = useState(1);
  const [nextAccId, setNextAccId]       = useState(1);
  const [nextGoalId, setNextGoalId]     = useState(1);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [lastSaved, setLastSaved]       = useState(null);
  const [txModal, setTxModal]           = useState(null);
  const [accModal, setAccModal]         = useState(null);
  const [accDetail, setAccDetail]       = useState(null);
  const [advanceModal, setAdvanceModal] = useState(null);
  const [goalModal, setGoalModal]       = useState(null);
  const [showBackup, setShowBackup]     = useState(false);
  const [backupText, setBackupText]     = useState("");
  const [importText, setImportText]     = useState("");
  const [backupMsg, setBackupMsg]       = useState("");
  const [importSuccess, setImportSuccess] = useState(false);
  const [searchQuery, setSearchQuery]   = useState("");

  // useEffect hooks
  useEffect(() => {
    let meta = document.querySelector("meta[name=viewport]");
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.appendChild(meta); }
    meta.content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get("finanças-data");
        if (r && r.value) {
          const d = JSON.parse(r.value);
          if (d.transactions) setTransactions(d.transactions);
          if (d.accounts)     setAccounts(d.accounts);
          if (d.goals)        setGoals(d.goals);
          if (d.nextTxId)     setNextTxId(d.nextTxId);
          if (d.nextAccId)    setNextAccId(d.nextAccId);
          if (d.nextGoalId)   setNextGoalId(d.nextGoalId);
          if (d.lastSaved)    setLastSaved(new Date(d.lastSaved));
          setLoading(false); return;
        }
      } catch(e) {}
      try {
        const r2 = localStorage.getItem("finanças-data");
        if (r2) {
          const d = JSON.parse(r2);
          if (d.transactions) setTransactions(d.transactions);
          if (d.accounts)     setAccounts(d.accounts);
          if (d.goals)        setGoals(d.goals);
          if (d.nextTxId)     setNextTxId(d.nextTxId);
          if (d.nextAccId)    setNextAccId(d.nextAccId);
          if (d.nextGoalId)   setNextGoalId(d.nextGoalId);
          if (d.lastSaved)    setLastSaved(new Date(d.lastSaved));
        }
      } catch(e) {}
      setLoading(false);
    })();
  }, []);

  // useMemo hooks
  const filtered = useMemo(() => transactions.filter(t => t.date && t.date.slice(0,7)===selectedMonth), [transactions, selectedMonth]);
  const totalIncome  = useMemo(() => filtered.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0), [filtered]);
  const balance      = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);
  const byCategory   = useMemo(() => {
    const map = {};
    filtered.filter(t=>t.type==="expense").forEach(t => { if (!map[t.category]) map[t.category]=0; map[t.category]+=t.amount; });
    return Object.entries(map).map(([name, value]) => {
      const cat = ALL_CATS.find(c=>c.name===name);
      return { name, value, color:(cat||{}).color||"#94a3b8", icon:(cat||{}).icon||"other" };
    }).sort((a,b)=>b.value-a.value);
  }, [filtered]);
  const byDate = useMemo(() => {
    const map = {};
    filtered.forEach(t => { const d=t.date.slice(8,10)+"/"+t.date.slice(5,7); if(!map[d]) map[d]={day:d,receita:0,gasto:0}; if(t.type==="income") map[d].receita+=t.amount; else map[d].gasto+=t.amount; });
    return Object.values(map).sort((a,b)=>a.day.localeCompare(b.day));
  }, [filtered]);
  const spendByAccount = useMemo(() => {
    const map = {};
    filtered.filter(t=>t.type==="expense").forEach(t => { if(!map[t.accountId]) map[t.accountId]=0; map[t.accountId]+=t.amount; });
    return map;
  }, [filtered]);
  const sorted = useMemo(() => [...filtered].sort((a,b)=>b.date.localeCompare(a.date)), [filtered]);
  const banks  = useMemo(() => accounts.filter(a=>a.kind==="bank"), [accounts]);
  const cards  = useMemo(() => accounts.filter(a=>a.kind==="card"), [accounts]);
  const totalBankBalance = useMemo(() => banks.reduce((s,a)=>s+parseBR(a.balance),0), [banks]);

  // Save function
  const saveData = useCallback(async (txs, accs, txId, accId, gls, gId) => {
    setSaving(true);
    const ts = new Date().toISOString();
    const payload = JSON.stringify({ transactions:txs, accounts:accs, goals:gls, nextTxId:txId, nextAccId:accId, nextGoalId:gId, lastSaved:ts });
    try { await window.storage.set("finanças-data", payload); } catch(e) {}
    try { localStorage.setItem("finanças-data", payload); } catch(e) {}
    setLastSaved(new Date(ts));
    setSaving(false);
  }, []);

  const prevMonth = useCallback(() => {
    const [y,m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m-2, 1);
    setSelectedMonth(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));
  }, [selectedMonth]);
  const nextMonth = useCallback(() => {
    const [y,m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));
  }, [selectedMonth]);

  // Empty templates
  const EMPTY_TX  = useCallback(() => ({ type:"expense", description:"", amount:"", category:"Alimentação", accountId:"", date:todayStr, installments:1 }), [todayStr]);
  const EMPTY_ACC = useCallback(() => ({ kind:"bank", name:"", balance:"", limit:"", colorIdx:0 }), []);

  const openNewTx  = useCallback(() => setTxModal(EMPTY_TX()), [EMPTY_TX]);
  const openEditTx = useCallback((t) => setTxModal({ ...t, amount:String(t.amount).replace(".",","), editId:t.id }), []);
  const openNewAcc  = useCallback(() => setAccModal({ ...EMPTY_ACC(), colorIdx:nextAccId%ACCOUNT_COLORS.length }), [EMPTY_ACC, nextAccId]);
  const openEditAcc = useCallback((a) => setAccModal({ ...a, balance:String(a.balance), limit:String(a.limit||""), editId:a.id }), []);

  // Save transaction
  const saveTx = async () => {
    const f = txModal;
    if (!f.description || !f.amount) return;
    const totalAmt  = parseBR(f.amount);
    const installments = parseInt(f.installments) || 1;
    let newTxs;
    let newId = nextTxId;
    if (f.editId != null) {
      newTxs = transactions.map(t => t.id===f.editId ? { ...f, id:f.editId, amount:totalAmt } : t);
    } else if (installments > 1) {
      const parcelAmt = totalAmt / installments;
      const [y,m,d] = f.date.split("-").map(Number);
      const generated = Array.from({ length:installments }, (_,i) => {
        const dd = new Date(y, m-1+i, d);
        return { ...f, id:nextTxId+i, amount:parcelAmt, description:f.description+" "+(i+1)+"/"+installments, date:dd.getFullYear()+"-"+String(dd.getMonth()+1).padStart(2,"0")+"-"+String(dd.getDate()).padStart(2,"0"), installmentGroup:nextTxId, installmentIndex:i+1, installmentTotal:installments };
      });
      newTxs = [...transactions, ...generated];
      newId  = nextTxId + installments;
    } else {
      newTxs = [...transactions, { ...f, id:nextTxId, amount:totalAmt }];
      newId  = nextTxId + 1;
    }
    // Update bank balance
    let newAccs = accounts;
    if (f.editId==null && f.accountId && f.kind!=="card") {
      newAccs = accounts.map(a => {
        if (String(a.id)===String(f.accountId) && a.kind==="bank") {
          return { ...a, balance: parseBR(a.balance) + (f.type==="income" ? totalAmt : -totalAmt) };
        }
        return a;
      });
    }
    setTransactions(newTxs); setAccounts(newAccs); setNextTxId(newId); setTxModal(null);
    await saveData(newTxs, newAccs, newId, nextAccId, goals, nextGoalId);
  };

  const deleteTx = async (id) => {
    const newTxs = transactions.filter(t => t.id!==id);
    setTransactions(newTxs); setTxModal(null);
    await saveData(newTxs, accounts, nextTxId, nextAccId, goals, nextGoalId);
  };

  const saveAcc = async () => {
    const f = accModal;
    if (!f.name) return;
    let newAccs, newId = nextAccId;
    if (f.editId != null) {
      newAccs = accounts.map(a => a.id===f.editId ? { ...f, id:f.editId, balance:parseBR(f.balance), limit:parseBR(f.limit) } : a);
    } else {
      newAccs = [...accounts, { ...f, id:nextAccId, balance:parseBR(f.balance), limit:parseBR(f.limit) }];
      newId = nextAccId + 1;
    }
    setAccounts(newAccs); setNextAccId(newId); setAccModal(null);
    await saveData(transactions, newAccs, nextTxId, newId, goals, nextGoalId);
  };

  const deleteAccount = async (id) => {
    const newAccs = accounts.filter(a => a.id!==id);
    setAccounts(newAccs); setAccModal(null);
    await saveData(transactions, newAccs, nextTxId, nextAccId, goals, nextGoalId);
  };

  const openAdvance = useCallback((group) => {
    const future = group.filter(t=>t.date.slice(0,7)>selectedMonth).sort((a,b)=>a.date.localeCompare(b.date));
    const values  = {};
    future.forEach(t => { values[t.id] = { checked:false, amount:fmt(t.amount) }; });
    setAdvanceModal({ group, future, values });
  }, [selectedMonth]);

  const saveAdvance = async () => {
    const { future, values } = advanceModal;
    const toAdv = future.filter(t => values[t.id] && values[t.id].checked);
    if (!toAdv.length) { setAdvanceModal(null); return; }
    const advDate = selectedMonth+"-01";
    const newTxs  = transactions.map(t => {
      const v = values[t.id];
      if (v && v.checked) return { ...t, date:advDate, amount:parseBR(v.amount), advancedFrom:t.date, description:t.description+" (adiantado)" };
      return t;
    });
    setTransactions(newTxs); setAdvanceModal(null);
    await saveData(newTxs, accounts, nextTxId, nextAccId, goals, nextGoalId);
  };

  const saveGoal = async (f) => {
    if (!f.name || !f.target) return;
    let newGoals, newGoalId = nextGoalId;
    if (f.editId != null) {
      newGoals = goals.map(g => g.id===f.editId ? { ...f, id:f.editId, target:parseBR(f.target) } : g);
    } else {
      newGoals = [...goals, { ...f, id:nextGoalId, target:parseBR(f.target), createdMonth:selectedMonth }];
      newGoalId = nextGoalId + 1;
      setNextGoalId(newGoalId);
    }
    setGoals(newGoals); setGoalModal(null);
    await saveData(transactions, accounts, nextTxId, nextAccId, newGoals, newGoalId);
  };

  const deleteGoal = async (id) => {
    const newGoals = goals.filter(g=>g.id!==id);
    setGoals(newGoals);
    await saveData(transactions, accounts, nextTxId, nextAccId, newGoals, nextGoalId);
  };

  const exportData = () => {
    const compressed = compress({ transactions, accounts, goals, nextTxId, nextAccId, nextGoalId });
    setBackupText(compressed);
    setBackupMsg("Selecione o texto abaixo e copie para o Notas do iPhone.");
    if (navigator.clipboard) navigator.clipboard.writeText(compressed).then(()=>setBackupMsg("Copiado! Cole no Notas do iPhone.")).catch(()=>{});
  };

  const importData = () => {
    try {
      const d = decompress(importText.trim());
      if (!d.transactions||!d.accounts) { setBackupMsg("Dados inválidos."); return; }
      setTransactions(d.transactions); setAccounts(d.accounts);
      if (d.goals) setGoals(d.goals);
      setNextTxId(d.nextTxId||1); setNextAccId(d.nextAccId||1); setNextGoalId(d.nextGoalId||1);
      saveData(d.transactions, d.accounts, d.nextTxId||1, d.nextAccId||1, d.goals||[], d.nextGoalId||1);
      setImportSuccess(true); setImportText(""); setBackupMsg("");
      setTimeout(()=>{ setShowBackup(false); setImportSuccess(false); }, 1500);
    } catch(e) { setBackupMsg("Texto inválido. Cole exatamente o que foi exportado."); }
  };

  // -- Render -------------------------------------------------
  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:C.text, gap:12 }}>
      <div style={{ width:44, height:44, borderRadius:12, background:"#1e3a5f33", display:"flex", alignItems:"center", justifyContent:"center" }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
      </div>
      <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>Ara</div>
      <div style={{ fontSize:13, color:C.sub }}>Clareza para sua vida financeira</div>
    </div>
  );

  const displayList = searchQuery.trim()
    ? sorted.filter(t => t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : sorted;

  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"system-ui, sans-serif", paddingBottom:80 }}>

      {/* Header */}
      <div style={{ padding:"20px 20px 16px", background:"linear-gradient(180deg, #0d1424 0%, "+C.bg+" 100%)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <div>
            <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>Ara</div>
          </div>
          <button onClick={()=>{ setShowBackup(true); setBackupText(""); setBackupMsg(""); setImportText(""); setImportSuccess(false); }} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:12, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </button>
        </div>

        {/* Month nav */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14 }}>
          <button onClick={prevMonth} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>&#8249;</button>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.sub, letterSpacing:0.5 }}>{monthLabel(selectedMonth)}</div>
          </div>
          <button onClick={nextMonth} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>&#8250;</button>
        </div>

        {/* Dashboard balance */}
        {tab==="dashboard" && (
          <div style={{ marginTop:20, textAlign:"center" }}>
            <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>SALDO DO MÊS</div>
            <div style={{ fontSize:38, fontWeight:700, color:balance>=0?C.green:C.red, letterSpacing:-1 }}>{fmt(balance)}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:12 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.sub }}>Receitas</div>
                <div style={{ fontSize:16, fontWeight:600, color:C.green }}>{fmt(totalIncome)}</div>
              </div>
              <div style={{ width:1, background:C.border }} />
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.sub }}>Gastos</div>
                <div style={{ fontSize:16, fontWeight:600, color:C.red }}>{fmt(totalExpense)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Other tab titles */}
        {tab!=="dashboard" && (
          <div style={{ marginTop:16, paddingBottom:16, borderBottom:"1px solid "+C.border }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <div style={{ fontSize:26, fontWeight:700, color:C.text, letterSpacing:-0.5 }}>
                {tab==="contas"      && "Contas"}
                {tab==="lançamentos" && "Lançamentos"}
                {tab==="histórico"   && "Histórico"}
                {tab==="metas"       && "Metas"}
              </div>
              {tab==="contas" && accounts.length>0 && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.sub }}>{banks.length} banco{banks.length!==1?"s":""} - {cards.length} {cards.length===1?"cartão":"cartões"}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.green, marginTop:2 }}>{fmt(totalBankBalance)}</div>
                </div>
              )}
              {tab==="lançamentos" && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.sub }}>{monthLabel(selectedMonth)}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:balance>=0?C.green:C.red, marginTop:2 }}>{fmt(balance)}</div>
                </div>
              )}
              {tab==="histórico" && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.sub }}>{sorted.length} lançamentos</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.red, marginTop:2 }}>{fmt(totalExpense)}</div>
                </div>
              )}
              {tab==="metas" && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.sub }}>{goals.length} meta{goals.length!==1?"s":""}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:"1px solid "+C.border, display:"flex", zIndex:50, paddingBottom:8 }}>
        {TABS.map(t => {
          const active = tab===t;
          const labels = { dashboard:"Dashboard", contas:"Contas", lançamentos:"Lançamentos", histórico:"Histórico", metas:"Metas" };
          return (
            <button key={t} onClick={()=>setTab(t)} style={{ flex:1, border:"none", background:"none", cursor:"pointer", padding:"10px 0 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
              <TabIcon tab={t} active={active} blue={C.blue} sub={C.sub} />
              <span style={{ fontSize:10, fontWeight:600, color:active?C.blue:C.sub }}>{labels[t]}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div style={{ padding:"16px 16px 0" }}>

        {/* DASHBOARD */}
        {tab==="dashboard" && (
          <div>
            {byCategory.length===0 && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhum gasto ainda</div>
                <div style={{ fontSize:13 }}>Adicione seu primeiro lançamento</div>
              </div>
            )}
            {byCategory.length>0 && (
              <div style={{ background:C.card, borderRadius:16, padding:20, marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.sub, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Gastos por Categoria</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart style={{ outline:"none" }}>
                    <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} stroke="none" style={{ outline:"none" }}>
                      {byCategory.map((e,i) => <Cell key={i} fill={e.color} stroke="none" />)}
                    </Pie>
                    <Tooltip formatter={(v,name)=>[fmt(v),name]} contentStyle={{ background:C.surface, border:"none", borderRadius:12, color:C.text, fontSize:13, padding:"8px 14px", boxShadow:"0 4px 20px #00000066" }} itemStyle={{ color:C.text, fontWeight:700 }} labelStyle={{ color:C.text, fontWeight:700, marginBottom:4 }} cursor={false} wrapperStyle={{ outline:"none" }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginTop:8 }}>
                  {byCategory.map(c => (
                    <div key={c.name} style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div style={{ width:10, height:10, borderRadius:"50%", background:c.color, flexShrink:0 }} />
                        <span style={{ fontSize:13, color:C.sub }}>{catLabel(c.name)}</span>
                      </div>
                      <span style={{ fontSize:13, fontWeight:600, color:C.text }}>{fmt(c.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {byDate.length>0 && (
              <div style={{ background:C.card, borderRadius:16, padding:20, marginBottom:12 }}>
                <div style={{ fontSize:13, fontWeight:600, color:C.sub, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Resumo Diário</div>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={byDate} barCategoryGap="35%">
                    <XAxis dataKey="day" tick={{ fill:C.sub, fontSize:10 }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip formatter={v=>fmt(v)} labelFormatter={(label)=>{ const [d,m]=label.split("/"); return MONTHS[parseInt(m)-1]+" "+d; }} contentStyle={{ background:C.surface, border:"none", borderRadius:12, color:C.text, fontSize:13, padding:"8px 14px", boxShadow:"0 4px 20px #00000066" }} itemStyle={{ color:C.text, fontWeight:700 }} labelStyle={{ color:C.text, fontWeight:700, marginBottom:4 }} cursor={{ fill:"#ffffff06" }} wrapperStyle={{ outline:"none" }} />
                    <Bar dataKey="receita" fill={C.green} radius={[4,4,0,0]} name="Receita" />
                    <Bar dataKey="gasto"   fill={C.red}   radius={[4,4,0,0]} name="Gasto" />
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:"flex", gap:16, marginTop:8, justifyContent:"center" }}>
                  <span style={{ fontSize:12, color:C.sub, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.green, display:"inline-block" }} /> Receita</span>
                  <span style={{ fontSize:12, color:C.sub, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.red, display:"inline-block" }} /> Gasto</span>
                </div>
              </div>
            )}
            {(()=>{
              const months6 = Array.from({length:6},(_,i)=>{ const [y,m]=selectedMonth.split("-").map(Number); const d=new Date(y,m-1-(5-i),1); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); });
              const data = months6.map(ym=>{ const txs=transactions.filter(t=>t.date.slice(0,7)===ym); const lbl=MONTHS[parseInt(ym.split("-")[1])-1].slice(0,3); const full=MONTHS[parseInt(ym.split("-")[1])-1]+" "+ym.split("-")[0]; return { mês:lbl, fullMês:full, receita:txs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0), gasto:txs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0) }; });
              if (!data.some(d=>d.receita>0||d.gasto>0)) return null;
              return (
                <div style={{ background:C.card, borderRadius:16, padding:20, marginBottom:12 }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.sub, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Comparativo 6 Mêses</div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={data} barCategoryGap="25%" barGap={3}>
                      <XAxis dataKey="mes" tick={{ fill:C.sub, fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip formatter={v=>fmt(v)} labelFormatter={(_,payload)=>payload&&payload[0]?payload[0].payload.fullMês:""} contentStyle={{ background:C.surface, border:"none", borderRadius:12, color:C.text, fontSize:12, padding:"8px 14px", boxShadow:"0 4px 20px #00000066" }} itemStyle={{ color:C.text, fontWeight:700 }} labelStyle={{ color:C.text, fontWeight:700, marginBottom:4 }} cursor={{ fill:"#ffffff06" }} wrapperStyle={{ outline:"none" }} />
                      <Bar dataKey="receita" fill={C.green} radius={[5,5,0,0]} name="Receita" />
                      <Bar dataKey="gasto"   fill={C.red}   radius={[5,5,0,0]} name="Gasto" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div style={{ display:"flex", gap:16, marginTop:8, justifyContent:"center" }}>
                    <span style={{ fontSize:12, color:C.sub, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.green, display:"inline-block" }} /> Receita</span>
                    <span style={{ fontSize:12, color:C.sub, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.red, display:"inline-block" }} /> Gasto</span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* CONTAS */}
        {tab==="contas" && (
          <div>
            {banks.length>0||cards.length>0 ? (
              <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                <div style={{ flex:1, background:C.card, borderRadius:14, padding:"14px 16px" }}>
                  <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Saldo em Bancos</div>
                  <div style={{ fontSize:20, fontWeight:700, color:totalBankBalance>=0?C.green:C.red }}>{fmt(totalBankBalance)}</div>
                </div>
                {cards.length>0 && (
                  <div style={{ flex:1, background:C.card, borderRadius:14, padding:"14px 16px" }}>
                    <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Fatura do Mês</div>
                    <div style={{ fontSize:20, fontWeight:700, color:C.red }}>{fmt(cards.reduce((s,a)=>s+(spendByAccount[a.id]||0),0))}</div>
                  </div>
                )}
              </div>
            ) : null}

            {banks.length>0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Bancos</div>
                {banks.map(a => {
                  const brand = getBrand(a.name);
                  const bg = brand ? brand.bg : C.card;
                  const ac = brand ? brand.color : ACCOUNT_COLORS[a.colorIdx%ACCOUNT_COLORS.length];
                  return (
                    <div key={a.id} onClick={()=>setAccDetail(a)} style={{ background:bg, borderRadius:16, padding:16, marginBottom:10, border:"1px solid "+ac+"33", cursor:"pointer" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          {brand ? <img src={brand.logo} alt={a.name} style={{ width:40, height:40, borderRadius:12, objectFit:"contain", background:"#fff", padding:4 }} onError={e=>e.target.style.display="none"} /> : <div style={{ width:40, height:40, borderRadius:12, background:ac+"33", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg></div>}
                          <div>
                            <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{a.name}</div>
                            <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>Gasto este mês: <span style={{ color:C.red }}>{fmt(spendByAccount[a.id]||0)}</span></div>
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontSize:18, fontWeight:700, color:parseBR(a.balance)>=0?C.green:C.red }}>{fmt(parseBR(a.balance))}</div>
                          <div style={{ color:C.sub, fontSize:16, marginTop:2 }}>&#8250;</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {cards.length>0 && (
              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Cartões</div>
                {cards.map(a => {
                  const spent   = spendByAccount[a.id]||0;
                  const limit   = parseBR(a.limit);
                  const futureBill = transactions.filter(t=>String(t.accountId)===String(a.id)&&t.type==="expense"&&t.date.slice(0,7)>selectedMonth).reduce((s,t)=>s+t.amount,0);
                  const committed  = spent + futureBill;
                  const available  = limit - committed;
                  const pct        = limit>0 ? Math.min((committed/limit)*100,100) : 0;
                  const barC       = pct>80?C.red:pct>50?"#f59e0b":C.green;
                  const brand = getBrand(a.name);
                  const bg = brand ? brand.bg : C.card;
                  const ac = brand ? brand.color : ACCOUNT_COLORS[a.colorIdx%ACCOUNT_COLORS.length];
                  return (
                    <div key={a.id} onClick={()=>setAccDetail(a)} style={{ background:bg, borderRadius:16, padding:16, marginBottom:10, border:"1px solid "+ac+"33", cursor:"pointer" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                            {brand ? <img src={brand.logo} alt={a.name} style={{ width:36, height:36, borderRadius:10, objectFit:"contain", background:"#fff", padding:3 }} onError={e=>e.target.style.display="none"} /> : <div style={{ width:36, height:36, borderRadius:10, background:ac+"33", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>}
                            <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{a.name}</div>
                          </div>
                          {limit>0 ? (
                            <div>
                              <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.sub, marginBottom:6 }}>
                                <span>Fatura: <span style={{ color:C.red, fontWeight:600 }}>{fmt(spent)}</span></span>
                                <span>Limite: {fmt(limit)}</span>
                              </div>
                              <div style={{ background:C.muted, borderRadius:6, height:5 }}>
                                <div style={{ background:barC, borderRadius:6, height:5, width:pct+"%", transition:"width .3s" }} />
                              </div>
                              <div style={{ fontSize:10, color:C.sub, marginTop:4 }}>{pct.toFixed(0)}% comprometido - <span style={{ color:available>=0?C.green:C.red }}>{fmt(available)} disponível</span>{futureBill>0&&<span style={{ color:C.muted }}> (incl. {fmt(futureBill)} futuras)</span>}</div>
                            </div>
                          ) : (
                            <div style={{ fontSize:12, color:C.sub }}>Fatura: <span style={{ color:C.red }}>{fmt(spent)}</span></div>
                          )}
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", justifyContent:"center", marginLeft:12 }}>
                          <div style={{ color:C.sub, fontSize:16 }}>&#8250;</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {accounts.length===0 && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhuma conta ainda</div>
                <div style={{ fontSize:13 }}>Adicione seu banco ou cartão</div>
              </div>
            )}
            <button onClick={openNewAcc} style={btn("#f1f5f9")}>Adicionar Banco ou Cartão</button>
          </div>
        )}

        {/* LANCAMENTOS */}
        {tab==="lançamentos" && (
          <div>
            <button onClick={openNewTx} style={btn("#f1f5f9",{ marginBottom:12 })}>Novo Lançamento</button>
            <div style={{ background:C.card, borderRadius:14, padding:16, marginBottom:16 }}>
              <div style={{ fontSize:12, color:C.sub, lineHeight:1.7, display:"flex", gap:10, alignItems:"flex-start" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>Vincule lançamentos a um <b style={{ color:C.text }}>banco</b> para atualizar o saldo automaticamente, ou a um <b style={{ color:C.text }}>cartão</b> para controlar a fatura.</span>
              </div>
            </div>
            {sorted.length>0 && (
              <div>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1 }}>Últimos lançamentos</div>
                  <button onClick={()=>setTab("histórico")} style={{ background:"none", border:"none", color:C.blue, cursor:"pointer", fontSize:12, fontWeight:500 }}>Ver todos</button>
                </div>
                {sorted.slice(0,5).map(t => {
                  const cat = ALL_CATS.find(c=>c.name===t.category);
                  const catColor = (cat||{}).color||"#94a3b8";
                  return (
                    <div key={t.id} onClick={()=>openEditTx(t)} style={{ background:C.card, borderRadius:14, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:12, borderLeft:"3px solid "+catColor, cursor:"pointer" }}>
                      <div style={{ width:34, height:34, borderRadius:10, background:catColor+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                        <CatIcon name={(cat||{}).icon||"other"} color={catColor} size={16} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontWeight:600, fontSize:13, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</div>
                        <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{catLabel(t.category)} - {t.date.split("-").reverse().join("/")}</div>
                      </div>
                      <div style={{ fontWeight:700, fontSize:14, color:t.type==="income"?C.green:C.red, flexShrink:0 }}>
                        {t.type==="income"?"+":"-"}{fmt(t.amount)}
                      </div>
                    </div>
                  );
                })}
                {sorted.length>5 && (
                  <button onClick={()=>setTab("histórico")} style={{ width:"100%", background:"none", border:"1px solid "+C.border, color:C.sub, borderRadius:12, padding:"10px", fontSize:13, cursor:"pointer", marginTop:4 }}>
                    Ver mais {sorted.length-5} lançamentos
                  </button>
                )}
              </div>
            )}
            {sorted.length===0 && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                <div style={{ fontSize:14, color:C.text, marginBottom:4 }}>Nenhum lançamento ainda</div>
                <div style={{ fontSize:12 }}>Toque em "Novo Lançamento" para começar</div>
              </div>
            )}
          </div>
        )}

        {/* HISTORICO */}
        {tab==="histórico" && (
          <div>
            <div style={{ position:"relative", marginBottom:14 }}>
              <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <input style={{ ...iStyle, paddingLeft:38, paddingRight:searchQuery?38:14 }} placeholder="Buscar lançamento..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} />
              {searchQuery && <button onClick={()=>setSearchQuery("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.sub, cursor:"pointer", fontSize:16, padding:2 }}>x</button>}
            </div>
            <div style={{ fontSize:12, color:C.sub, marginBottom:14 }}>
              {searchQuery ? displayList.length+" resultado"+(displayList.length!==1?"s":"")+" para \""+searchQuery+"\"" : monthLabel(selectedMonth)+" - "+sorted.length+" lançamentos"}
            </div>

            {/* Parcelas ativas */}
            {!searchQuery && (()=>{
              const groups = {};
              transactions.filter(t=>t.installmentGroup).forEach(t=>{ const g=t.installmentGroup; if(!groups[g]) groups[g]=[]; groups[g].push(t); });
              const active = Object.values(groups).filter(g=>g.some(t=>t.date.slice(0,7)===selectedMonth));
              if (!active.length) return null;
              return (
                <div style={{ marginBottom:20 }}>
                  <div style={{ fontSize:11, fontWeight:600, color:C.purple, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Parcelas em Andamento</div>
                  {active.map(group => {
                    const first = group[0];
                    const baseName = first.description.replace(/ \d+\/\d+$/,"").replace(" (adiantado)","");
                    const total = group.length;
                    const paid  = group.filter(t=>t.date.slice(0,7)<=selectedMonth).length;
                    const cur   = group.find(t=>t.date.slice(0,7)===selectedMonth);
                    const totalVal = group.reduce((s,t)=>s+t.amount,0);
                    return (
                      <div key={first.installmentGroup} style={{ background:C.card, borderRadius:14, padding:16, marginBottom:10 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                          <div>
                            <div style={{ fontWeight:600, fontSize:14, color:C.text }}>{baseName} <span style={{ color:C.purple }}>{paid}/{total}</span></div>
                            <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>Total: {fmt(totalVal)}</div>
                          </div>
                          {cur && <div style={{ fontWeight:700, fontSize:15, color:C.red }}>{fmt(cur.amount)}</div>}
                        </div>
                        <div style={{ background:C.muted, borderRadius:6, height:4 }}>
                          <div style={{ background:C.purple, borderRadius:6, height:4, width:(paid/total*100)+"%" }} />
                        </div>
                        {group.some(t=>t.date.slice(0,7)>selectedMonth) && (
                          <button onClick={()=>openAdvance(group)} style={{ marginTop:12, width:"100%", background:"none", border:"1px solid "+C.purple+"55", color:C.purple, borderRadius:10, padding:"8px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                            Adiantar parcelas
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {sorted.length===0&&!searchQuery && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhum lançamento</div>
                <div>Ainda não há movimentações neste mês.</div>
              </div>
            )}
            {displayList.length===0&&searchQuery && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <div style={{ fontSize:14, color:C.text, marginBottom:4 }}>Nenhum resultado</div>
                <div style={{ fontSize:12 }}>Tente outro termo de busca</div>
              </div>
            )}
            {displayList.map(t => {
              const cat = ALL_CATS.find(c=>c.name===t.category);
              const acc = accounts.find(a=>String(a.id)===String(t.accountId));
              const catColor = (cat||{}).color||"#94a3b8";
              return (
                <div key={t.id} onClick={()=>openEditTx(t)} style={{ background:C.card, borderRadius:14, padding:"14px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12, borderLeft:"3px solid "+catColor, cursor:"pointer" }}>
                  <div style={{ width:38, height:38, borderRadius:11, background:catColor+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <CatIcon name={(cat||{}).icon||"other"} color={catColor} size={18} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:600, fontSize:14, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</div>
                    <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                      {catLabel(t.category)} - {t.date.split("-").reverse().join("/")}
                      {acc && <span style={{ color:ACCOUNT_COLORS[acc.colorIdx%ACCOUNT_COLORS.length] }}> - {acc.name}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:t.type==="income"?C.green:C.red }}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</div>
                    <div style={{ color:C.sub, fontSize:18, lineHeight:1 }}>&#8250;</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* METAS */}
        {tab==="metas" && (
          <div>
            <button onClick={()=>setGoalModal({ name:"", target:"", type:"economia", editId:null })} style={btn("#f1f5f9",{ marginBottom:16 })}>Nova Meta</button>
            {goals.length===0 && (
              <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhuma meta ainda</div>
                <div style={{ fontSize:13 }}>Defina uma meta para acompanhar seu progresso</div>
              </div>
            )}
            {goals.map(g => {
              let current = 0;
              if (g.type==="economia")    current = Math.max(0, balance);
              else if (g.type==="gasto_max") current = totalExpense;
              else if (g.type==="categoria") current = filtered.filter(t=>t.type==="expense"&&t.category===g.category).reduce((s,t)=>s+t.amount,0);
              const pct = Math.min((current/g.target)*100, 100);
              const completed = g.type==="economia" ? current>=g.target : current<=g.target;
              const barColor  = g.type==="economia" ? (completed?C.green:C.blue) : (completed?C.green:current>g.target*0.8?C.red:"#f59e0b");
              return (
                <div key={g.id} onClick={()=>setGoalModal({ ...g, target:String(g.target), editId:g.id })} style={{ background:C.card, borderRadius:16, padding:18, marginBottom:12, cursor:"pointer", border:"1px solid "+(completed?C.green+"44":C.border) }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:barColor+"22", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={barColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{g.name}</div>
                        <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{monthLabel(selectedMonth)}</div>
                      </div>
                    </div>
                    {completed
                      ? <div style={{ background:C.green+"22", color:C.green, fontSize:11, fontWeight:700, borderRadius:8, padding:"4px 10px" }}>Atingida</div>
                      : <div style={{ fontSize:11, color:C.sub }}>{pct.toFixed(0)}%</div>
                    }
                  </div>
                  <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.sub, marginBottom:8 }}>
                    <span style={{ fontWeight:600, color:barColor, fontSize:14 }}>{fmt(current)}</span>
                    <span>meta: {fmt(g.target)}</span>
                  </div>
                  <div style={{ background:C.muted, borderRadius:6, height:6 }}>
                    <div style={{ background:barColor, borderRadius:6, height:6, width:pct+"%", transition:"width .5s", maxWidth:"100%" }} />
                  </div>
                  {!completed && (
                    <div style={{ fontSize:11, color:C.sub, marginTop:6 }}>
                      {g.type==="economia" ? "Faltam "+fmt(g.target-current)+" para atingir" : "Limite restante: "+fmt(Math.max(0,g.target-current))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: Lancamento */}
      {txModal && (
        <Modal title={txModal.editId!=null?"Editar Lançamento":"Novo Lançamento"} onClose={()=>setTxModal(null)}>
          <div style={{ display:"flex", gap:8, marginBottom:16, background:C.card, borderRadius:12, padding:4 }}>
            {["expense","income"].map(tp => (
              <button key={tp} onClick={()=>setTxModal(f=>({ ...f, type:tp, category:tp==="expense"?"Alimentação":"Salário" }))} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:txModal.type===tp?(tp==="expense"?C.red:C.green):"transparent", color:txModal.type===tp?"#fff":C.sub, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {tp==="expense"
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
                }
                {tp==="expense"?"Gasto":"Receita"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input style={iStyle} placeholder="Descricao" value={txModal.description} onChange={e=>setTxModal(f=>({ ...f, description:e.target.value }))} />
            <input style={iStyle} placeholder="Valor total (ex: 1.200)" type="text" inputMode="decimal" value={txModal.amount} onChange={e=>setTxModal(f=>({ ...f, amount:e.target.value }))} />
            {txModal.type==="expense"&&txModal.editId==null && (
              <div style={{ background:C.card, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, color:C.sub, marginBottom:10 }}>Parcelamento</div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <button onClick={()=>setTxModal(f=>({ ...f, installments:Math.max(1,(parseInt(f.installments)||1)-1) }))} style={{ background:C.muted, border:"none", color:C.text, borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:18 }}>-</button>
                  <div style={{ flex:1, textAlign:"center", color:C.text, fontWeight:700, fontSize:15 }}>
                    {(parseInt(txModal.installments)||1)===1?"À vista":(parseInt(txModal.installments)||1)+"x de "+fmt(parseBR(txModal.amount)/(parseInt(txModal.installments)||1))}
                  </div>
                  <button onClick={()=>setTxModal(f=>({ ...f, installments:Math.min(48,(parseInt(f.installments)||1)+1) }))} style={{ background:C.muted, border:"none", color:C.text, borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:18 }}>+</button>
                </div>
              </div>
            )}
            <select style={iStyle} value={txModal.category} onChange={e=>setTxModal(f=>({ ...f, category:e.target.value }))}>
              {(txModal.type==="expense"?EXPENSE_CATS:INCOME_CATS).map(c=><option key={c.name} value={c.name}>{catLabel(c.name)}</option>)}
            </select>
            <select style={iStyle} value={txModal.accountId} onChange={e=>setTxModal(f=>({ ...f, accountId:e.target.value }))}>
              <option value="">Sem vínculo de conta</option>
              {banks.map(a=><option key={a.id} value={a.id}>Banco - {a.name}</option>)}
              {cards.map(a=><option key={a.id} value={a.id}>Cartão - {a.name}</option>)}
            </select>
            <div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Data</div>
              <input type="date" style={{ ...iStyle }} value={txModal.date} onChange={e=>setTxModal(f=>({ ...f, date:e.target.value }))} />
            </div>
            <button onClick={saveTx} style={btn("#f1f5f9")}>{txModal.editId!=null?"Salvar alterações":"Adicionar lançamento"}</button>
            {txModal.editId!=null && <button onClick={async()=>{ await deleteTx(txModal.editId); }} style={btn("none",{ border:"1px solid "+C.red+"44", color:C.red })}>Remover lançamento</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Conta */}
      {accModal && (
        <Modal title={accModal.editId!=null?"Editar Conta":"Nova Conta"} onClose={()=>setAccModal(null)}>
          <div style={{ display:"flex", gap:8, marginBottom:16, background:C.card, borderRadius:12, padding:4 }}>
            {["bank","card"].map(k => (
              <button key={k} onClick={()=>setAccModal(f=>({ ...f, kind:k }))} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:accModal.kind===k?C.blue:"transparent", color:accModal.kind===k?"#fff":C.sub, display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                {k==="bank"
                  ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                  : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                }
                {k==="bank"?"Banco":"Cartão"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input style={iStyle} placeholder="Nome (ex: Nubank, Bradesco...)" value={accModal.name} onChange={e=>setAccModal(f=>({ ...f, name:e.target.value }))} />
            {accModal.kind==="bank" && <input style={iStyle} placeholder="Saldo atual (ex: 1.500)" type="text" inputMode="decimal" value={accModal.balance} onChange={e=>setAccModal(f=>({ ...f, balance:e.target.value }))} />}
            {accModal.kind==="card" && <input style={iStyle} placeholder="Limite (ex: 4.900)" type="text" inputMode="decimal" value={accModal.limit} onChange={e=>setAccModal(f=>({ ...f, limit:e.target.value }))} />}
            <div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:4 }}>Cor</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ACCOUNT_COLORS.map((c,i) => <div key={i} onClick={()=>setAccModal(f=>({ ...f, colorIdx:i }))} style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:accModal.colorIdx===i?"3px solid #fff":"3px solid transparent" }} />)}
              </div>
            </div>
            <button onClick={saveAcc} style={btn("#f1f5f9")}>{accModal.editId!=null?"Salvar alterações":"Adicionar"}</button>
            {accModal.editId!=null && <button onClick={async()=>{ await deleteAccount(accModal.editId); }} style={btn("none",{ border:"1px solid "+C.red+"44", color:C.red })}>Remover conta</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Configurações */}
      {showBackup && (
        <Modal title="Configurações" onClose={()=>{ setShowBackup(false); setBackupText(""); setBackupMsg(""); setImportText(""); setImportSuccess(false); }}>
          {importSuccess && <div style={{ background:"#14532d", borderRadius:12, padding:14, textAlign:"center", color:C.green, fontWeight:700, marginBottom:16 }}>Dados restaurados!</div>}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Status</div>
            <div style={{ background:C.card, borderRadius:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px" }}>
                <div style={{ width:38, height:38, borderRadius:10, background:saving?"#1e3a5f33":lastSaved?"#14532d33":"#37415133", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {saving
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-3.32"/></svg>
                    : lastSaved
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  }
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{saving?"Salvando...":lastSaved?"Dados salvos":"Sem dados salvos"}</div>
                  <div style={{ fontSize:12, color:lastSaved?C.green:C.sub, marginTop:2 }}>{lastSaved?fmtDate(lastSaved):"Adicione dados para salvar"}</div>
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Backup</div>
            <div style={{ background:C.card, borderRadius:14, overflow:"hidden" }}>
              <div style={{ padding:"14px 16px", borderBottom:"1px solid "+C.border }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#14532d33", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Exportar</div>
                    <div style={{ fontSize:12, color:C.sub, marginTop:1 }}>Gere o código e salve no Notas do iPhone</div>
                  </div>
                </div>
                <button onClick={exportData} style={btn("linear-gradient(135deg,#10b981,#059669)",{ marginBottom:backupText?10:0 })}>Gerar código de backup</button>
                {backupMsg && <div style={{ fontSize:12, color:C.green, margin:"8px 0" }}>{backupMsg}</div>}
                {backupText && <textarea readOnly style={{ ...iStyle, height:60, resize:"none", fontSize:16 }} value={backupText} onFocus={e=>e.target.select()} />}
              </div>
              <div style={{ padding:"14px 16px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#1e3a5f33", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Importar</div>
                    <div style={{ fontSize:12, color:C.sub, marginTop:1 }}>Cole o código para restaurar seus dados</div>
                  </div>
                </div>
                <textarea style={{ ...iStyle, height:70, resize:"none", fontSize:16, marginBottom:10 }} placeholder="Cole seu código de backup aqui..." value={importText} onChange={e=>setImportText(e.target.value)} />
                <button onClick={importData} style={btn("#f1f5f9")}>Restaurar dados</button>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Sobre o App</div>
            <div style={{ background:C.card, borderRadius:14, overflow:"hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid "+C.border }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:38, height:38, borderRadius:10, background:"#1e3a5f33", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Ara</div>
                    <div style={{ fontSize:12, color:C.sub, marginTop:1 }}>Clareza para sua vida financeira</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:C.sub, background:C.surface, borderRadius:8, padding:"4px 10px", fontWeight:600 }}>v1.6.1</div>
              </div>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid "+C.border, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:C.sub }}>Início do projeto</span>
                <span style={{ fontSize:13, color:C.text }}>13 de Abril de 2026</span>
              </div>
              <div style={{ padding:"12px 16px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:C.sub }}>Desenvolvido por</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={C.red} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{ fontSize:13, color:C.text, fontWeight:500 }}>Claude e Luan</span>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Adiantar Parcelas */}
      {advanceModal && (
        <Modal title="Adiantar Parcelas" onClose={()=>setAdvanceModal(null)}>
          <div style={{ fontSize:13, color:C.sub, marginBottom:16, lineHeight:1.6 }}>
            Selecione as parcelas para adiantar em <b style={{ color:C.text }}>{monthLabel(selectedMonth)}</b> e informe o valor com desconto.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {advanceModal.future.map(t => {
              const v = advanceModal.values[t.id];
              const parcelLabel = (t.description.match(/\d+\/\d+/)||[])[0]||"";
              const baseName = t.description.replace(/ \d+\/\d+$/,"").replace(" (adiantado)","");
              return (
                <div key={t.id} style={{ background:C.card, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                  <div onClick={()=>setAdvanceModal(f=>({ ...f, values:{ ...f.values, [t.id]:{ ...v, checked:!v.checked } } }))} style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(v.checked?C.purple:C.border), background:v.checked?C.purple:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {v.checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{baseName} <span style={{ color:C.purple }}>{parcelLabel}</span></div>
                    <div style={{ fontSize:11, color:C.sub }}>{t.date.split("-").reverse().join("/")}</div>
                  </div>
                  <input style={{ ...iStyle, width:100, textAlign:"right", fontSize:13 }} value={v.amount} onChange={e=>setAdvanceModal(f=>({ ...f, values:{ ...f.values, [t.id]:{ ...v, amount:e.target.value } } }))} />
                </div>
              );
            })}
          </div>
          <button onClick={saveAdvance} style={{ ...btn("linear-gradient(135deg,#8b5cf6,#7c3aed)"), marginTop:16 }}>Confirmar adiantamento</button>
        </Modal>
      )}

      {/* MODAL: Meta */}
      {goalModal && (
        <Modal title={goalModal.editId!=null?"Editar Meta":"Nova Meta"} onClose={()=>setGoalModal(null)}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input style={iStyle} placeholder="Nome da meta (ex: Guardar para viagem)" value={goalModal.name} onChange={e=>setGoalModal(f=>({ ...f, name:e.target.value }))} />
            <div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:8 }}>Tipo de meta</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  { value:"economia",  label:"Economia",             desc:"Guardar uma quantia este mês" },
                  { value:"gasto_max", label:"Limite de gastos",     desc:"Não gastar mais que um valor" },
                  { value:"categoria", label:"Limite por categoria", desc:"Controlar gastos em uma categoria" },
                ].map(opt => (
                  <div key={opt.value} onClick={()=>setGoalModal(f=>({ ...f, type:opt.value }))} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:goalModal.type===opt.value?C.blue+"22":C.card, borderRadius:12, border:"1px solid "+(goalModal.type===opt.value?C.blue:C.border), cursor:"pointer" }}>
                    <div style={{ width:34, height:34, borderRadius:10, background:goalModal.type===opt.value?C.blue+"33":C.muted+"33", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      {opt.value==="economia"  && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={goalModal.type===opt.value?C.blue:C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>}
                      {opt.value==="gasto_max" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={goalModal.type===opt.value?C.blue:C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
                      {opt.value==="categoria" && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={goalModal.type===opt.value?C.blue:C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>}
                    </div>
                    <div>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{opt.label}</div>
                      <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{opt.desc}</div>
                    </div>
                    {goalModal.type===opt.value && <div style={{ marginLeft:"auto" }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>}
                  </div>
                ))}
              </div>
            </div>
            {goalModal.type==="categoria" && (
              <select style={iStyle} value={goalModal.category||""} onChange={e=>setGoalModal(f=>({ ...f, category:e.target.value }))}>
                <option value="">Selecione a categoria</option>
                {EXPENSE_CATS.map(c=><option key={c.name} value={c.name}>{catLabel(c.name)}</option>)}
              </select>
            )}
            <input style={iStyle} placeholder="Valor da meta (ex: 500)" type="text" inputMode="decimal" value={goalModal.target} onChange={e=>setGoalModal(f=>({ ...f, target:e.target.value }))} />
            <button onClick={()=>saveGoal(goalModal)} style={btn("#f1f5f9")}>{goalModal.editId!=null?"Salvar alterações":"Criar meta"}</button>
            {goalModal.editId!=null && <button onClick={async()=>{ await deleteGoal(goalModal.editId); setGoalModal(null); }} style={btn("none",{ border:"1px solid "+C.red+"44", color:C.red })}>Remover meta</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Detalhe da Conta */}
      {accDetail && (()=>{
        const brand   = getBrand(accDetail.name);
        const ac      = brand ? brand.color : ACCOUNT_COLORS[accDetail.colorIdx%ACCOUNT_COLORS.length];
        const monthTxs = transactions.filter(t=>String(t.accountId)===String(accDetail.id)&&t.date.slice(0,7)===selectedMonth).sort((a,b)=>b.date.localeCompare(a.date));
        const monthSpend = monthTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
        const monthIncome= monthTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
        return (
          <Modal title="" onClose={()=>setAccDetail(null)}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:20, paddingBottom:16, borderBottom:"1px solid "+C.border }}>
              {brand ? <img src={brand.logo} alt={accDetail.name} style={{ width:48, height:48, borderRadius:14, objectFit:"contain", background:"#fff", padding:5 }} onError={e=>e.target.style.display="none"} /> : <div style={{ width:48, height:48, borderRadius:14, background:ac+"33", display:"flex", alignItems:"center", justifyContent:"center" }}>{accDetail.kind==="bank" ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg> : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>}</div>}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{accDetail.name}</div>
                <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{accDetail.kind==="bank"?"Conta bancária":"Cartão de crédito"} - {monthLabel(selectedMonth)} - {monthTxs.length} lançamentos</div>
              </div>
              <button onClick={()=>{ setAccDetail(null); openEditAcc(accDetail); }} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>editar</button>
            </div>
            <div style={{ display:"flex", gap:10, marginBottom:20 }}>
              <div style={{ flex:1, background:C.card, borderRadius:12, padding:"12px 14px", borderTop:"3px solid "+C.red }}>
                <div style={{ fontSize:11, color:C.sub }}>Gastos</div>
                <div style={{ fontSize:18, fontWeight:700, color:C.red, marginTop:4 }}>{fmt(monthSpend)}</div>
              </div>
              {accDetail.kind==="bank" && (
                <div style={{ flex:1, background:C.card, borderRadius:12, padding:"12px 14px", borderTop:"3px solid "+C.green }}>
                  <div style={{ fontSize:11, color:C.sub }}>Receitas</div>
                  <div style={{ fontSize:18, fontWeight:700, color:C.green, marginTop:4 }}>{fmt(monthIncome)}</div>
                </div>
              )}
              {accDetail.kind==="card" && parseBR(accDetail.limit)>0 && (()=>{
                const limit = parseBR(accDetail.limit);
                const futureBill = transactions.filter(t=>String(t.accountId)===String(accDetail.id)&&t.type==="expense"&&t.date.slice(0,7)>selectedMonth).reduce((s,t)=>s+t.amount,0);
                const available = limit - monthSpend - futureBill;
                return (
                  <div style={{ flex:1, background:C.card, borderRadius:12, padding:"12px 14px", borderTop:"3px solid "+(available>=0?C.blue:C.red) }}>
                    <div style={{ fontSize:11, color:C.sub }}>Limite disponível</div>
                    <div style={{ fontSize:18, fontWeight:700, color:available>=0?C.blue:C.red, marginTop:4 }}>{fmt(available)}</div>
                    <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:5 }}>
                      <div style={{ flex:1, height:1, background:C.border }} />
                      <div style={{ fontSize:10, color:C.muted, whiteSpace:"nowrap" }}>{fmt(monthSpend+futureBill)} de {fmt(limit)}</div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Fatura de {monthLabel(selectedMonth)}</div>
            {monthTxs.length===0 && (
              <div style={{ textAlign:"center", padding:"30px 0", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:8 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>Nenhum lançamento neste mês.</div>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {monthTxs.map(t => {
                const cat = ALL_CATS.find(c=>c.name===t.category);
                const catColor = (cat||{}).color||"#94a3b8";
                return (
                  <div key={t.id} style={{ background:C.card, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, borderLeft:"3px solid "+catColor }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:catColor+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <CatIcon name={(cat||{}).icon||"other"} color={catColor} size={17} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</div>
                      <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{catLabel(t.category)} - {t.date.split("-").reverse().join("/")}</div>
                    </div>
                    <div style={{ fontWeight:700, fontSize:15, color:t.type==="income"?C.green:C.red, flexShrink:0 }}>{t.type==="income"?"+":"-"}{fmt(t.amount)}</div>
                  </div>
                );
              })}
            </div>
          </Modal>
        );
      })()}

    </div>
  );
}
