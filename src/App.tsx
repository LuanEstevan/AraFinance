import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { C, EXPENSE_CATS, INCOME_CATS, ALL_CATS, ACCOUNT_COLORS, TABS, TAB_LABELS, MONTHS } from "./lib/constants";
import { fmt, parseBR, monthLabel, fmtDate, getBrand, getBillingYM, iStyle, btn, compress, decompress } from "./lib/helpers";
import { Modal } from "./components/Modal";
import { TabIcon } from "./components/TabIcon";
import { CatIcon } from "./components/CatIcon";
import { AraLogo } from "./components/AraLogo";
import { SideMenu } from "./components/SideMenu";
import { Dashboard } from "./screens/Dashboard";
import { Contas } from "./screens/Contas";
import { Lancamentos } from "./screens/Lancamentos";
import { Historico } from "./screens/Historico";
import { Metas } from "./screens/Metas";
import type { Transaction, Account, Goal, PaidBills } from "./types";

const catLabel = (n: string): string => {
  const map: Record<string, string> = {
    Alimentacao:"Alimentação", Saude:"Saúde", Educacao:"Educação",
    Credito:"Crédito", Salario:"Salário",
  };
  return map[n] || n;
};

export default function App() {
  const now = new Date();
  const currentYM = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const todayStr  = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");

  // Auth state
  const [user, setUser]               = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authView, setAuthView]       = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail]     = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authError, setAuthError]     = useState<string>("");
  const [authWorking, setAuthWorking] = useState<boolean>(false);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts]         = useState<Account[]>([]);
  const [goals, setGoals]               = useState<Goal[]>([]);
  const [paidBills, setPaidBills]       = useState<PaidBills>({});
  const [nextTxId, setNextTxId]         = useState<number>(1);
  const [nextAccId, setNextAccId]       = useState<number>(1);
  const [nextGoalId, setNextGoalId]     = useState<number>(1);
  const [loading, setLoading]           = useState<boolean>(true);
  const [saving, setSaving]             = useState<boolean>(false);
  const [lastSaved, setLastSaved]       = useState<Date | null>(null);

  // UI state
  const [tab, setTab]                   = useState<string>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYM);
  const [txModal, setTxModal]           = useState<any>(null);
  const [accModal, setAccModal]         = useState<any>(null);
  const [accDetail, setAccDetail]       = useState<Account | null>(null);
  const [advanceModal, setAdvanceModal] = useState<any>(null);
  const [goalModal, setGoalModal]       = useState<any>(null);
  const [showBackup, setShowBackup]     = useState<boolean>(false);
  const [showMenu, setShowMenu]         = useState<boolean>(false);
  const [backupText, setBackupText]     = useState<string>("");
  const [importText, setImportText]     = useState<string>("");
  const [backupMsg, setBackupMsg]       = useState<string>("");
  const [importSuccess, setImportSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery]   = useState<string>("");

  // Viewport fix
  useEffect(() => {
    let meta = document.querySelector("meta[name=viewport]");
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.appendChild(meta); }
    (meta as HTMLMetaElement).content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
  }, []);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data from Supabase
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("user_data")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data && !error) {
          if (data.transactions)  setTransactions(data.transactions);
          if (data.accounts)      setAccounts(data.accounts);
          if (data.goals)         setGoals(data.goals);
          if (data.paid_bills)    setPaidBills(data.paid_bills);
          if (data.next_tx_id)    setNextTxId(data.next_tx_id);
          if (data.next_acc_id)   setNextAccId(data.next_acc_id);
          if (data.next_goal_id)  setNextGoalId(data.next_goal_id);
        }
      } catch(e) {}
      setLoading(false);
    })();
  }, [user]);

  // Computed values
  const filtered = useMemo(() => {
    return transactions.filter(t => {
      if (!t.date) return false;
      return getBillingYM(t.date, t.accountId, accounts) === selectedMonth;
    });
  }, [transactions, accounts, selectedMonth]);

  const totalIncome  = useMemo(() => filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [filtered]);
  const balance      = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(t => t.type === "expense").forEach(t => {
      if (!map[t.category]) map[t.category] = 0;
      map[t.category] += t.amount;
    });
    return Object.entries(map).map(([name, value]) => {
      const cat = ALL_CATS.find(c => c.name === name);
      return { name, value, color: cat?.color || "#94a3b8", icon: cat?.icon || "other" };
    }).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byDate = useMemo(() => {
    const map: Record<string, { day: string; receita: number; gasto: number }> = {};
    filtered.forEach(t => {
      const d = t.date.slice(8, 10) + "/" + t.date.slice(5, 7);
      if (!map[d]) map[d] = { day:d, receita:0, gasto:0 };
      if (t.type === "income") map[d].receita += t.amount;
      else map[d].gasto += t.amount;
    });
    return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
  }, [filtered]);

  const spendByAccount = useMemo(() => {
    const map: Record<string | number, number> = {};
    filtered.filter(t => t.type === "expense").forEach(t => {
      if (!map[t.accountId]) map[t.accountId] = 0;
      map[t.accountId] += t.amount;
    });
    return map;
  }, [filtered]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => b.date.localeCompare(a.date)), [filtered]);
  const banks  = useMemo(() => accounts.filter(a => a.kind === "bank"), [accounts]);
  const cards  = useMemo(() => accounts.filter(a => a.kind === "card"), [accounts]);
  const totalBankBalance = useMemo(() => banks.reduce((s, a) => s + parseBR(a.balance), 0), [banks]);

  // Save to Supabase
  const saveData = useCallback(async (txs: Transaction[], accs: Account[], txId: number, accId: number, gls: Goal[], gId: number, paid?: PaidBills) => {
    if (!user) return;
    setSaving(true);
    const pb = paid !== undefined ? paid : paidBills;
    try {
      await supabase.from("user_data").upsert({
        id: user.id,
        transactions: txs,
        accounts: accs,
        goals: gls,
        paid_bills: pb,
        next_tx_id: txId,
        next_acc_id: accId,
        next_goal_id: gId,
        updated_at: new Date().toISOString(),
      });
      setLastSaved(new Date());
    } catch(e) {}
    setSaving(false);
  }, [user, paidBills]);

  // Auth functions
  const signIn = async () => {
    setAuthError(""); setAuthWorking(true);
    const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    setAuthWorking(false);
  };

  const signUp = async () => {
    setAuthError(""); setAuthWorking(true);
    const { error } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
    else setAuthError("Verifique seu email para confirmar o cadastro!");
    setAuthWorking(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setTransactions([]); setAccounts([]); setGoals([]);
    setPaidBills({}); setNextTxId(1); setNextAccId(1); setNextGoalId(1);
  };

  // Navigation
  const prevMonth = useCallback(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 2, 1);
    setSelectedMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }, [selectedMonth]);

  const nextMonth = useCallback(() => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m, 1);
    setSelectedMonth(d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"));
  }, [selectedMonth]);

  // Modals
  const EMPTY_TX = useCallback(() => ({ type:"expense" as const, description:"", amount:"", category:"Alimentação", accountId:"", date:todayStr, installments:1, recurring:false }), [todayStr]);
  const EMPTY_ACC = useCallback(() => ({ kind:"bank" as const, name:"", balance:"", limit:"", colorIdx:0 }), []);

  const openNewTx   = useCallback(() => setTxModal(EMPTY_TX()), [EMPTY_TX]);
  const openEditTx  = useCallback((t: Transaction) => setTxModal({ ...t, amount:String(t.amount).replace(".", ","), editId:t.id }), []);
  const openNewAcc  = useCallback(() => setAccModal({ ...EMPTY_ACC(), colorIdx:nextAccId % ACCOUNT_COLORS.length }), [EMPTY_ACC, nextAccId]);
  const openEditAcc = useCallback((a: Account) => setAccModal({ ...a, balance:String(a.balance), limit:String(a.limit || ""), editId:a.id }), []);

  // Save transaction
  const saveTx = async (updateAll: boolean) => {
    const f = txModal;
    if (!f.description || !f.amount) return;
    const totalAmt = parseBR(f.amount);
    const installments = parseInt(f.installments) || 1;
    let newTxs: Transaction[];
    let newId = nextTxId;

    if (f.editId != null) {
      if (updateAll && f.installmentGroup) {
        newTxs = transactions.map(t => {
          if (t.installmentGroup === f.installmentGroup) return { ...t, category:f.category, accountId:f.accountId };
          if (t.id === f.editId) return { ...f, id:f.editId, amount:totalAmt };
          return t;
        });
      } else {
        newTxs = transactions.map(t => t.id === f.editId ? { ...f, id:f.editId, amount:totalAmt } : t);
      }
    } else if (installments > 1) {
      const parcelAmt = totalAmt / installments;
      const [y, m, d] = f.date.split("-").map(Number);
      const generated: Transaction[] = Array.from({ length:installments }, (_, i) => {
        const dd = new Date(y, m - 1 + i, d);
        return { ...f, id:nextTxId + i, amount:parcelAmt, description:f.description + " " + (i+1) + "/" + installments, date:dd.getFullYear() + "-" + String(dd.getMonth()+1).padStart(2,"0") + "-" + String(dd.getDate()).padStart(2,"0"), installmentGroup:nextTxId, installmentIndex:i+1, installmentTotal:installments, recurring:false };
      });
      newTxs = [...transactions, ...generated];
      newId  = nextTxId + installments;
    } else if (f.recurring) {
      const [y, m, d] = f.date.split("-").map(Number);
      const generated: Transaction[] = Array.from({ length:24 }, (_, i) => {
        const dd = new Date(y, m - 1 + i, d);
        return { ...f, id:nextTxId + i, amount:totalAmt, date:dd.getFullYear() + "-" + String(dd.getMonth()+1).padStart(2,"0") + "-" + String(dd.getDate()).padStart(2,"0"), recurringGroup:nextTxId };
      });
      newTxs = [...transactions, ...generated];
      newId  = nextTxId + 24;
    } else {
      newTxs = [...transactions, { ...f, id:nextTxId, amount:totalAmt }];
      newId  = nextTxId + 1;
    }

    let newAccs = accounts;
    if (f.editId == null && f.accountId && !f.recurring) {
      newAccs = accounts.map(a => {
        if (String(a.id) === String(f.accountId) && a.kind === "bank") {
          return { ...a, balance: parseBR(a.balance) + (f.type === "income" ? totalAmt : -totalAmt) };
        }
        return a;
      });
    }

    setTransactions(newTxs); setAccounts(newAccs); setNextTxId(newId); setTxModal(null);
    await saveData(newTxs, newAccs, newId, nextAccId, goals, nextGoalId);
  };

  const deleteTx = async (id: number) => {
    const newTxs = transactions.filter(t => t.id !== id);
    setTransactions(newTxs); setTxModal(null);
    await saveData(newTxs, accounts, nextTxId, nextAccId, goals, nextGoalId);
  };

  const saveAcc = async () => {
    const f = accModal;
    if (!f.name) return;
    let newAccs: Account[];
    let newId = nextAccId;
    if (f.editId != null) {
      newAccs = accounts.map(a => a.id === f.editId ? { ...f, id:f.editId, balance:parseBR(f.balance), limit:parseBR(f.limit) } : a);
    } else {
      newAccs = [...accounts, { ...f, id:nextAccId, balance:parseBR(f.balance), limit:parseBR(f.limit) }];
      newId = nextAccId + 1;
    }
    setAccounts(newAccs); setNextAccId(newId); setAccModal(null);
    await saveData(transactions, newAccs, nextTxId, newId, goals, nextGoalId);
  };

  const deleteAccount = async (id: number) => {
    const newAccs = accounts.filter(a => a.id !== id);
    setAccounts(newAccs); setAccModal(null);
    await saveData(transactions, newAccs, nextTxId, nextAccId, goals, nextGoalId);
  };

  const openAdvance = useCallback((group: Transaction[]) => {
    const future = group.filter(t => t.date.slice(0,7) > selectedMonth).sort((a,b) => a.date.localeCompare(b.date));
    const values: Record<number, { checked:boolean; amount:string }> = {};
    future.forEach(t => { values[t.id] = { checked:false, amount:fmt(t.amount) }; });
    setAdvanceModal({ group, future, values });
  }, [selectedMonth]);

  const saveAdvance = async () => {
    const { future, values } = advanceModal;
    const toAdv = future.filter((t: Transaction) => values[t.id]?.checked);
    if (!toAdv.length) { setAdvanceModal(null); return; }
    const advDate = selectedMonth + "-01";
    const newTxs = transactions.map(t => {
      const v = values[t.id];
      if (v?.checked) return { ...t, date:advDate, amount:parseBR(v.amount), advancedFrom:t.date, description:t.description + " (adiantado)" };
      return t;
    });
    setTransactions(newTxs); setAdvanceModal(null);
    await saveData(newTxs, accounts, nextTxId, nextAccId, goals, nextGoalId);
  };

  const saveGoal = async (f: any) => {
    if (!f.name || !f.target) return;
    let newGoals: Goal[];
    let newGoalId = nextGoalId;
    if (f.editId != null) {
      newGoals = goals.map(g => g.id === f.editId ? { ...f, id:f.editId, target:parseBR(f.target) } : g);
    } else {
      newGoals = [...goals, { ...f, id:nextGoalId, target:parseBR(f.target), createdMonth:selectedMonth }];
      newGoalId = nextGoalId + 1;
      setNextGoalId(newGoalId);
    }
    setGoals(newGoals); setGoalModal(null);
    await saveData(transactions, accounts, nextTxId, nextAccId, newGoals, newGoalId);
  };

  const deleteGoal = async (id: number) => {
    const newGoals = goals.filter(g => g.id !== id);
    setGoals(newGoals);
    await saveData(transactions, accounts, nextTxId, nextAccId, newGoals, nextGoalId);
  };

  const togglePaidBill = async (accId: number, ym: string) => {
    const key = accId + "-" + ym;
    const newPaid = { ...paidBills, [key]: !paidBills[key] };
    setPaidBills(newPaid);
    await saveData(transactions, accounts, nextTxId, nextAccId, goals, nextGoalId, newPaid);
  };

  const recalcBankBalance = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const newAccs = accounts.map(a => {
      if (a.kind !== "bank") return a;
      const txTotal = transactions
        .filter(t => String(t.accountId) === String(a.id) && !t.recurringGroup && t.date <= today)
        .reduce((s, t) => t.type === "income" ? s + t.amount : s - t.amount, 0);
      return { ...a, balance: txTotal };
    });
    setAccounts(newAccs);
    await saveData(transactions, newAccs, nextTxId, nextAccId, goals, nextGoalId);
  };

  const exportData = () => {
    const compressed = compress({ transactions, accounts, goals, nextTxId, nextAccId, nextGoalId });
    setBackupText(compressed);
    setBackupMsg("Selecione o texto abaixo e copie para o Notas.");
    if (navigator.clipboard) navigator.clipboard.writeText(compressed).then(() => setBackupMsg("Copiado! Cole no Notas.")).catch(() => {});
  };

  const importData = () => {
    try {
      const d = decompress(importText.trim());
      if (!d.transactions || !d.accounts) { setBackupMsg("Dados inválidos."); return; }
      setTransactions(d.transactions); setAccounts(d.accounts);
      if (d.goals) setGoals(d.goals);
      setNextTxId(d.nextTxId || 1); setNextAccId(d.nextAccId || 1); setNextGoalId(d.nextGoalId || 1);
      saveData(d.transactions, d.accounts, d.nextTxId || 1, d.nextAccId || 1, d.goals || [], d.nextGoalId || 1);
      setImportSuccess(true); setImportText(""); setBackupMsg("");
      setTimeout(() => { setShowBackup(false); setImportSuccess(false); }, 1500);
    } catch(e) { setBackupMsg("Texto inválido. Cole exatamente o que foi exportado."); }
  };

  // ── Auth loading ───────────────────────────────────────────
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <AraLogo size={72} id="splash" />
      <div style={{ fontSize:22, fontWeight:800, color:C.text }}>Ara Finance</div>
    </div>
  );

  // ── Login / Register ───────────────────────────────────────
  if (!user) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"32px 24px", color:C.text, overflow:"hidden", position:"relative" }}>
      <style>{`
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes pulse {
          0%, 100% { opacity:0.15; transform:scale(1); }
          50%       { opacity:0.25; transform:scale(1.05); }
        }
        @keyframes float {
          0%, 100% { transform:translateY(0px); }
          50%       { transform:translateY(-8px); }
        }
        .auth-bg-circle { animation: pulse 4s ease-in-out infinite; }
        .auth-logo      { animation: fadeUp 0.6s ease both; animation-delay:0.1s; }
        .auth-title     { animation: fadeUp 0.6s ease both; animation-delay:0.25s; }
        .auth-slogan    { animation: fadeUp 0.6s ease both; animation-delay:0.35s; }
        .auth-tabs      { animation: fadeUp 0.6s ease both; animation-delay:0.45s; }
        .auth-fields    { animation: fadeUp 0.6s ease both; animation-delay:0.55s; }
        .auth-logo-float { animation: float 3s ease-in-out infinite; animation-delay:0.8s; }
        button { -webkit-tap-highlight-color: transparent; }
        input:focus { border-color: #3b82f6 !important; box-shadow: 0 0 0 3px #3b82f620; transition: all 0.2s; }
      `}</style>

      {/* Background decorative circles */}
      <div className="auth-bg-circle" style={{ position:"absolute", top:"-10%", right:"-15%", width:300, height:300, borderRadius:"50%", background:"radial-gradient(circle, #7C3AED22, transparent 70%)", pointerEvents:"none" }} />
      <div className="auth-bg-circle" style={{ position:"absolute", bottom:"-5%", left:"-10%", width:250, height:250, borderRadius:"50%", background:"radial-gradient(circle, #2563EB22, transparent 70%)", pointerEvents:"none", animationDelay:"2s" }} />

      <div style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column", alignItems:"center", zIndex:1 }}>

        {/* Logo */}
        <div className="auth-logo auth-logo-float">
          <AraLogo size={90} id="login" />
        </div>

        {/* Title */}
        <div className="auth-title" style={{ fontSize:32, fontWeight:800, color:C.text, marginBottom:6, marginTop:20, letterSpacing:-0.5 }}>Ara Finance</div>

        {/* Slogan */}
        <div className="auth-slogan" style={{ fontSize:14, color:C.sub, marginBottom:48, textAlign:"center", lineHeight:1.5 }}>
          Controle com clareza.<br/>Viva melhor.
        </div>

        {/* Tabs */}
        <div className="auth-tabs" style={{ display:"flex", background:C.card, borderRadius:14, padding:4, marginBottom:20, width:"100%", border:"1px solid "+C.border }}>
          <button onClick={() => { setAuthView("login"); setAuthError(""); }} style={{ flex:1, padding:"12px", borderRadius:11, border:"none", cursor:"pointer", fontSize:14, fontWeight:600, background:authView==="login"?C.surface:"transparent", color:authView==="login"?C.text:C.sub, transition:"all 0.2s" }}>Entrar</button>
          <button onClick={() => { setAuthView("register"); setAuthError(""); }} style={{ flex:1, padding:"12px", borderRadius:11, border:"none", cursor:"pointer", fontSize:14, fontWeight:600, background:authView==="register"?C.surface:"transparent", color:authView==="register"?C.text:C.sub, transition:"all 0.2s" }}>Criar conta</button>
        </div>

        {/* Fields */}
        <div className="auth-fields" style={{ display:"flex", flexDirection:"column", gap:12, width:"100%" }}>
          <input
            style={{ ...iStyle, transition:"border-color 0.2s, box-shadow 0.2s" }}
            placeholder="Email"
            type="email"
            inputMode="email"
            value={authEmail}
            onChange={e => setAuthEmail(e.target.value)}
          />
          <input
            style={{ ...iStyle, transition:"border-color 0.2s, box-shadow 0.2s" }}
            placeholder="Senha"
            type="password"
            value={authPassword}
            onChange={e => setAuthPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (authView === "login" ? signIn() : signUp())}
          />

          {authError && (
            <div style={{ fontSize:13, color:authError.includes("Verifique") ? C.green : C.red, background:authError.includes("Verifique") ? "#14532d33" : "#7f1d1d33", borderRadius:12, padding:"12px 14px", borderLeft:"3px solid "+(authError.includes("Verifique")?C.green:C.red), animation:"fadeIn 0.3s ease both" }}>
              {authError}
            </div>
          )}

          <button
            onClick={authView === "login" ? signIn : signUp}
            disabled={authWorking}
            style={{ ...btn("linear-gradient(135deg,#7C3AED,#2563EB)"), padding:"15px", fontSize:16, borderRadius:14, opacity:authWorking?0.7:1, transition:"opacity 0.2s, transform 0.1s", marginTop:4 }}
          >
            {authWorking ? "Aguarde..." : authView === "login" ? "Entrar" : "Criar conta"}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:C.sub, marginTop:8 }}>
            {authView === "login" ? "Não tem conta? " : "Já tem conta? "}
            <span onClick={() => { setAuthView(authView === "login" ? "register" : "login"); setAuthError(""); }} style={{ color:C.blue, cursor:"pointer", fontWeight:600 }}>
              {authView === "login" ? "Criar conta" : "Entrar"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── App loading ────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", color:C.text, gap:12 }}>
      <AraLogo size={80} id="loading" />
      <div style={{ fontSize:22, fontWeight:800, color:C.text }}>Ara Finance</div>
      <div style={{ fontSize:13, color:C.sub }}>Controle com clareza. Viva melhor.</div>
    </div>
  );

  // ── Main App ───────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:C.bg, color:C.text, fontFamily:"system-ui, sans-serif", paddingBottom:80 }}>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes slideUp { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
        .tab-content { animation: fadeUp 0.22s ease both; }
        .modal-sheet { animation: slideUp 0.28s cubic-bezier(0.32,0.72,0,1) both; }
        .modal-backdrop { animation: fadeIn 0.2s ease both; }
        button { -webkit-tap-highlight-color: transparent; }
        * { -webkit-font-smoothing: antialiased; }
      `}</style>

      {/* Header */}
      <div style={{ padding:"20px 20px 16px", background:"linear-gradient(180deg, #0d1424 0%, "+C.bg+" 100%)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <AraLogo size={36} id="header" />
            <div style={{ fontSize:22, fontWeight:800, color:C.text, letterSpacing:-0.5 }}>Ara Finance</div>
          </div>
          <button onClick={() => setShowMenu(true)} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:12, width:38, height:38, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>

        {/* Month nav */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginTop:14 }}>
          <button onClick={prevMonth} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>‹</button>
          <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <div style={{ fontSize:13, fontWeight:600, color:C.sub }}>{monthLabel(selectedMonth)}</div>
          </div>
          <button onClick={nextMonth} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:16 }}>›</button>
        </div>

        {/* Dashboard balance */}
        {tab === "dashboard" && (
          <div style={{ marginTop:20, textAlign:"center" }}>
            <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>SALDO DO MÊS</div>
            <div style={{ fontSize:38, fontWeight:700, color:balance >= 0 ? C.green : C.red, letterSpacing:-1 }}>{fmt(balance)}</div>
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

        {/* Other tab headers */}
        {tab !== "dashboard" && (
          <div style={{ marginTop:16, paddingBottom:16, borderBottom:"1px solid "+C.border }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end" }}>
              <div style={{ fontSize:26, fontWeight:700, color:C.text, letterSpacing:-0.5 }}>
                {tab === "contas"      && "Contas"}
                {tab === "lancamentos" && "Lançamentos"}
                {tab === "historico"   && "Histórico"}
                {tab === "metas"       && "Metas"}
              </div>
              {tab === "contas" && accounts.length > 0 && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.sub }}>{banks.length} banco{banks.length !== 1 ? "s" : ""} - {cards.length} {cards.length === 1 ? "cartão" : "cartões"}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.green, marginTop:2 }}>{fmt(totalBankBalance)}</div>
                </div>
              )}
              {tab === "lancamentos" && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.sub }}>{monthLabel(selectedMonth)}</div>
                  <div style={{ fontSize:13, fontWeight:600, color:balance >= 0 ? C.green : C.red, marginTop:2 }}>{fmt(balance)}</div>
                </div>
              )}
              {tab === "historico" && (
                <div style={{ textAlign:"right" }}>
                  <div style={{ fontSize:11, color:C.sub }}>{sorted.length} lançamentos</div>
                  <div style={{ fontSize:13, fontWeight:600, color:C.red, marginTop:2 }}>{fmt(totalExpense)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:C.surface, borderTop:"1px solid "+C.border, display:"flex", zIndex:50, paddingBottom:8 }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex:1, border:"none", background:"none", cursor:"pointer", padding:"10px 0 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <TabIcon tab={t} active={tab === t} blue={C.blue} sub={C.sub} />
            <span style={{ fontSize:10, fontWeight:600, color:tab === t ? C.blue : C.sub }}>{TAB_LABELS[t]}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div key={tab} className="tab-content" style={{ padding:"16px 16px 0" }}>
        {tab === "dashboard" && (
          <Dashboard
            filtered={filtered}
            transactions={transactions}
            selectedMonth={selectedMonth}
            totalIncome={totalIncome}
            totalExpense={totalExpense}
            balance={balance}
            byCategory={byCategory}
            byDate={byDate}
          />
        )}
        {tab === "contas" && (
          <Contas
            accounts={accounts}
            transactions={transactions}
            selectedMonth={selectedMonth}
            paidBills={paidBills}
            spendByAccount={spendByAccount}
            totalBankBalance={totalBankBalance}
            onNewAcc={openNewAcc}
            onAccDetail={setAccDetail}
            onTogglePaid={togglePaidBill}
          />
        )}
        {tab === "lancamentos" && (
          <Lancamentos
            sorted={sorted}
            accounts={accounts}
            selectedMonth={selectedMonth}
            balance={balance}
            totalExpense={totalExpense}
            onNew={openNewTx}
            onEdit={openEditTx}
            onViewAll={() => setTab("historico")}
          />
        )}
        {tab === "historico" && (
          <Historico
            sorted={sorted}
            transactions={transactions}
            accounts={accounts}
            selectedMonth={selectedMonth}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onEditTx={openEditTx}
            onAdvance={openAdvance}
          />
        )}
        {tab === "metas" && (
          <Metas
            goals={goals}
            filtered={filtered}
            selectedMonth={selectedMonth}
            balance={balance}
            totalExpense={totalExpense}
            onNew={() => setGoalModal({ name:"", target:"", type:"economia", editId:null })}
            onEdit={g => setGoalModal({ ...g, target:String(g.target), editId:g.id })}
          />
        )}
      </div>

      {/* MODAL: Lançamento */}
      {txModal && (
        <Modal title={txModal.editId != null ? "Editar Lançamento" : "Novo Lançamento"} onClose={() => setTxModal(null)}>
          <div style={{ display:"flex", gap:8, marginBottom:16, background:C.card, borderRadius:12, padding:4 }}>
            {["expense","income"].map(tp => (
              <button key={tp} onClick={() => setTxModal((f: any) => ({ ...f, type:tp, category:tp==="expense"?"Alimentação":"Salário" }))} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:txModal.type===tp?(tp==="expense"?C.red:C.green):"transparent", color:txModal.type===tp?"#fff":C.sub }}>
                {tp === "expense" ? "Gasto" : "Receita"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input style={iStyle} placeholder="Descrição" value={txModal.description} onChange={e => setTxModal((f: any) => ({ ...f, description:e.target.value }))} />
            <input style={iStyle} placeholder={txModal.type === "expense" ? "Valor (valor total para parcelas)" : "Valor total"} type="text" inputMode="decimal" value={txModal.amount} onChange={e => setTxModal((f: any) => ({ ...f, amount:e.target.value }))} />

            {txModal.type === "expense" && txModal.editId == null && (
              <div style={{ background:C.card, borderRadius:12, padding:14 }}>
                <div style={{ fontSize:12, color:C.sub, marginBottom:10 }}>Parcelamento</div>
                <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                  <button onClick={() => setTxModal((f: any) => ({ ...f, installments:Math.max(1,(parseInt(f.installments)||1)-1), recurring:false }))} style={{ background:C.muted, border:"none", color:C.text, borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:18 }}>-</button>
                  <div style={{ flex:1, textAlign:"center", color:C.text, fontWeight:700, fontSize:15 }}>
                    {(parseInt(txModal.installments)||1)===1 ? "À vista" : (parseInt(txModal.installments)||1) + "x de " + fmt(parseBR(txModal.amount)/(parseInt(txModal.installments)||1))}
                  </div>
                  <button onClick={() => setTxModal((f: any) => ({ ...f, installments:Math.min(48,(parseInt(f.installments)||1)+1), recurring:false }))} style={{ background:C.muted, border:"none", color:C.text, borderRadius:10, width:36, height:36, cursor:"pointer", fontSize:18 }}>+</button>
                </div>
              </div>
            )}

            {txModal.editId == null && (parseInt(txModal.installments)||1) === 1 && (
              <div onClick={() => setTxModal((f: any) => ({ ...f, recurring:!f.recurring }))} style={{ background:C.card, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", justifyContent:"space-between", cursor:"pointer", border:"1px solid "+(txModal.recurring?C.blue+"66":C.border) }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:32, height:32, borderRadius:8, background:txModal.recurring?C.blue+"22":C.muted+"33", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={txModal.recurring?C.blue:C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  </div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color:txModal.recurring?C.blue:C.text }}>Gasto recorrente</div>
                    <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>Repete todo mês automaticamente</div>
                  </div>
                </div>
                <div style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(txModal.recurring?C.blue:C.border), background:txModal.recurring?C.blue:"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {txModal.recurring && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
              </div>
            )}

            <select style={iStyle} value={txModal.category} onChange={e => setTxModal((f: any) => ({ ...f, category:e.target.value }))}>
              {(txModal.type === "expense" ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c.name} value={c.name}>{catLabel(c.name)}</option>)}
            </select>
            <select style={iStyle} value={txModal.accountId} onChange={e => setTxModal((f: any) => ({ ...f, accountId:e.target.value }))}>
              <option value="">Sem vínculo de conta</option>
              {banks.map(a => <option key={a.id} value={a.id}>Banco - {a.name}</option>)}
              {cards.map(a => <option key={a.id} value={a.id}>Cartão - {a.name}</option>)}
            </select>
            <div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Data</div>
              <input type="date" style={iStyle} value={txModal.date} onChange={e => setTxModal((f: any) => ({ ...f, date:e.target.value }))} />
            </div>
            <button onClick={() => saveTx(true)} style={btn("#f1f5f9")}>{txModal.editId != null ? "Salvar alterações" : "Adicionar lançamento"}</button>
            {txModal.editId != null && txModal.recurringGroup && (
              <button onClick={async () => {
                const newTxs = transactions.filter(t => !(t.recurringGroup === txModal.recurringGroup && t.date >= txModal.date));
                setTransactions(newTxs); setTxModal(null);
                await saveData(newTxs, accounts, nextTxId, nextAccId, goals, nextGoalId);
              }} style={btn("none", { border:"1px solid #f59e0b44", color:"#f59e0b" })}>Cancelar recorrência daqui em diante</button>
            )}
            {txModal.editId != null && <button onClick={async () => { await deleteTx(txModal.editId); }} style={btn("none", { border:"1px solid "+C.red+"44", color:C.red })}>Remover lançamento</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Conta */}
      {accModal && (
        <Modal title={accModal.editId != null ? "Editar Conta" : "Nova Conta"} onClose={() => setAccModal(null)}>
          <div style={{ display:"flex", gap:8, marginBottom:16, background:C.card, borderRadius:12, padding:4 }}>
            {["bank","card"].map(k => (
              <button key={k} onClick={() => setAccModal((f: any) => ({ ...f, kind:k }))} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:accModal.kind===k?C.blue:"transparent", color:accModal.kind===k?"#fff":C.sub }}>
                {k === "bank" ? "Banco" : "Cartão"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input style={iStyle} placeholder="Nome (ex: Nubank, Bradesco...)" value={accModal.name} onChange={e => setAccModal((f: any) => ({ ...f, name:e.target.value }))} />
            {accModal.kind === "bank" && <input style={iStyle} placeholder="Saldo atual" type="text" inputMode="decimal" value={accModal.balance} onChange={e => setAccModal((f: any) => ({ ...f, balance:e.target.value }))} />}
            {accModal.kind === "card" && <input style={iStyle} placeholder="Limite total (opcional)" type="text" inputMode="decimal" value={accModal.limit} onChange={e => setAccModal((f: any) => ({ ...f, limit:e.target.value }))} />}
            {accModal.kind === "card" && (
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Fechamento (dia)</div>
                  <input style={iStyle} placeholder="Ex: 15" type="text" inputMode="numeric" value={accModal.closingDay || ""} onChange={e => setAccModal((f: any) => ({ ...f, closingDay:e.target.value.replace(/\D/g,"") }))} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Vencimento (dia)</div>
                  <input style={iStyle} placeholder="Ex: 22" type="text" inputMode="numeric" value={accModal.dueDay || ""} onChange={e => setAccModal((f: any) => ({ ...f, dueDay:e.target.value.replace(/\D/g,"") }))} />
                </div>
              </div>
            )}
            <div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:4 }}>Cor</div>
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {ACCOUNT_COLORS.map((c, i) => (
                  <div key={i} onClick={() => setAccModal((f: any) => ({ ...f, colorIdx:i }))} style={{ width:28, height:28, borderRadius:"50%", background:c, cursor:"pointer", border:accModal.colorIdx===i?"3px solid #fff":"3px solid transparent" }} />
                ))}
              </div>
            </div>
            <button onClick={saveAcc} style={btn("#f1f5f9")}>{accModal.editId != null ? "Salvar alterações" : "Adicionar"}</button>
            {accModal.editId != null && <button onClick={async () => { await deleteAccount(accModal.editId); }} style={btn("none", { border:"1px solid "+C.red+"44", color:C.red })}>Remover conta</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Configurações */}
      {showBackup && (
        <Modal title="Configurações" onClose={() => { setShowBackup(false); setBackupText(""); setBackupMsg(""); setImportText(""); setImportSuccess(false); }}>
          {importSuccess && <div style={{ background:"#14532d", borderRadius:12, padding:14, textAlign:"center", color:C.green, fontWeight:700, marginBottom:16 }}>Dados restaurados!</div>}

          {/* Status */}
          <div style={{ marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Status</div>
            <div style={{ background:C.card, borderRadius:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderBottom:"1px solid "+C.border }}>
                <div style={{ width:38, height:38, borderRadius:10, background:saving?"#1e3a5f33":lastSaved?"#14532d33":"#37415133", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {saving
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-.18-3.32"/></svg>
                    : lastSaved
                    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  }
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.text }}>{saving ? "Salvando..." : lastSaved ? "Dados salvos na nuvem" : "Sem dados salvos"}</div>
                  <div style={{ fontSize:12, color:lastSaved?C.green:C.sub, marginTop:2 }}>{lastSaved ? fmtDate(lastSaved) : "Adicione dados para salvar"}</div>
                </div>
              </div>
              <div style={{ padding:"12px 16px" }}>
                <button onClick={recalcBankBalance} style={{ width:"100%", background:"#1e3a5f33", border:"1px solid "+C.blue+"44", color:C.blue, borderRadius:10, padding:"10px", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                  Recalcular saldo dos bancos
                </button>
              </div>
            </div>
          </div>

          {/* Backup */}
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
                    <div style={{ fontSize:12, color:C.sub, marginTop:1 }}>Gere o código e salve no Notas.</div>
                  </div>
                </div>
                <button onClick={exportData} style={btn("linear-gradient(135deg,#10b981,#059669)", { marginBottom:backupText?10:0 })}>Gerar código de backup</button>
                {backupMsg && <div style={{ fontSize:12, color:C.green, margin:"8px 0" }}>{backupMsg}</div>}
                {backupText && <textarea readOnly style={{ ...iStyle, height:60, resize:"none", fontSize:16 }} value={backupText} onFocus={e => e.target.select()} />}
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
                <textarea style={{ ...iStyle, height:70, resize:"none", fontSize:16, marginBottom:10 }} placeholder="Cole seu código de backup aqui..." value={importText} onChange={e => setImportText(e.target.value)} />
                <button onClick={importData} style={btn("#f1f5f9")}>Restaurar dados</button>
              </div>
            </div>
          </div>

          {/* Sobre */}
          <div>
            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Sobre o App</div>
            <div style={{ background:C.card, borderRadius:14, overflow:"hidden" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid "+C.border }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <AraLogo size={38} id="settings" />
                  <div>
                    <div style={{ fontSize:14, fontWeight:600, color:C.text }}>Ara Finance</div>
                    <div style={{ fontSize:12, color:C.sub, marginTop:1 }}>Controle com clareza. Viva melhor.</div>
                  </div>
                </div>
                <div style={{ fontSize:12, color:C.sub, background:C.surface, borderRadius:8, padding:"4px 10px", fontWeight:600 }}>v2.0.0</div>
              </div>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid "+C.border, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:13, color:C.sub }}>Início do projeto</span>
                <span style={{ fontSize:13, color:C.text }}>11 de Abril de 2026</span>
              </div>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:13, color:C.sub }}>Desenvolvido por</span>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={C.red} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{ fontSize:13, color:C.text, fontWeight:500 }}>Claude e Luan</span>
                </div>
              </div>
              <div style={{ padding:"12px 16px", borderBottom:"1px solid "+C.border, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontSize:12, color:C.sub }}>Conta conectada</div>
                  <div style={{ fontSize:13, color:C.text, marginTop:2 }}>{user?.email}</div>
                </div>
                <button onClick={() => { setShowBackup(false); signOut(); }} style={{ background:"#7f1d1d33", border:"1px solid "+C.red+"44", color:C.red, borderRadius:10, padding:"6px 14px", cursor:"pointer", fontSize:13, fontWeight:600, display:"flex", alignItems:"center", gap:6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sair
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL: Adiantar Parcelas */}
      {advanceModal && (
        <Modal title="Adiantar Parcelas" onClose={() => setAdvanceModal(null)}>
          <div style={{ fontSize:13, color:C.sub, marginBottom:16, lineHeight:1.6 }}>
            Selecione as parcelas para adiantar em <b style={{ color:C.text }}>{monthLabel(selectedMonth)}</b>.
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {advanceModal.future.map((t: Transaction) => {
              const v = advanceModal.values[t.id];
              const parcelLabel = (t.description.match(/\d+\/\d+/) || [])[0] || "";
              const baseName = t.description.replace(/ \d+\/\d+$/, "").replace(" (adiantado)", "");
              return (
                <div key={t.id} style={{ background:C.card, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12 }}>
                  <div onClick={() => setAdvanceModal((f: any) => ({ ...f, values:{ ...f.values, [t.id]:{ ...v, checked:!v.checked } } }))} style={{ width:22, height:22, borderRadius:6, border:"2px solid "+(v.checked?C.purple:C.border), background:v.checked?C.purple:"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    {v.checked && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{baseName} <span style={{ color:C.purple }}>{parcelLabel}</span></div>
                    <div style={{ fontSize:11, color:C.sub }}>{t.date.split("-").reverse().join("/")}</div>
                  </div>
                  <input style={{ ...iStyle, width:100, textAlign:"right", fontSize:13 }} value={v.amount} onChange={e => setAdvanceModal((f: any) => ({ ...f, values:{ ...f.values, [t.id]:{ ...v, amount:e.target.value } } }))} />
                </div>
              );
            })}
          </div>
          <button onClick={saveAdvance} style={{ ...btn("linear-gradient(135deg,#8b5cf6,#7c3aed)"), marginTop:16 }}>Confirmar adiantamento</button>
        </Modal>
      )}

      {/* MODAL: Meta */}
      {goalModal && (
        <Modal title={goalModal.editId != null ? "Editar Meta" : "Nova Meta"} onClose={() => setGoalModal(null)}>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <input style={iStyle} placeholder="Nome da meta (ex: Guardar para viagem)" value={goalModal.name} onChange={e => setGoalModal((f: any) => ({ ...f, name:e.target.value }))} />
            <div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:8 }}>Tipo de meta</div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {[
                  { value:"economia",   label:"Economia",             desc:"Guardar uma quantia este mês" },
                  { value:"gasto_max",  label:"Limite de gastos",     desc:"Não gastar mais que um valor" },
                  { value:"categoria",  label:"Limite por categoria", desc:"Controlar gastos em uma categoria" },
                ].map(opt => (
                  <div key={opt.value} onClick={() => setGoalModal((f: any) => ({ ...f, type:opt.value }))} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", background:goalModal.type===opt.value?C.blue+"22":C.card, borderRadius:12, border:"1px solid "+(goalModal.type===opt.value?C.blue:C.border), cursor:"pointer" }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text }}>{opt.label}</div>
                      <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{opt.desc}</div>
                    </div>
                    {goalModal.type === opt.value && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                ))}
              </div>
            </div>
            {goalModal.type === "categoria" && (
              <select style={iStyle} value={goalModal.category || ""} onChange={e => setGoalModal((f: any) => ({ ...f, category:e.target.value }))}>
                <option value="">Selecione a categoria</option>
                {EXPENSE_CATS.map(c => <option key={c.name} value={c.name}>{catLabel(c.name)}</option>)}
              </select>
            )}
            <input style={iStyle} placeholder="Valor da meta (ex: 500)" type="text" inputMode="decimal" value={goalModal.target} onChange={e => setGoalModal((f: any) => ({ ...f, target:e.target.value }))} />
            <button onClick={() => saveGoal(goalModal)} style={btn("#f1f5f9")}>{goalModal.editId != null ? "Salvar alterações" : "Criar meta"}</button>
            {goalModal.editId != null && <button onClick={async () => { await deleteGoal(goalModal.editId); setGoalModal(null); }} style={btn("none", { border:"1px solid "+C.red+"44", color:C.red })}>Remover meta</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Detalhe da Conta */}
      {accDetail && (() => {
        const brand    = getBrand(accDetail.name);
        const ac       = brand ? brand.color : ACCOUNT_COLORS[accDetail.colorIdx % ACCOUNT_COLORS.length];
        const monthTxs = transactions.filter(t => String(t.accountId) === String(accDetail.id) && getBillingYM(t.date, t.accountId, accounts) === selectedMonth).sort((a, b) => b.date.localeCompare(a.date));
        const monthSpend  = monthTxs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
        const monthIncome = monthTxs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
        const futureBill  = transactions.filter(t => String(t.accountId) === String(accDetail.id) && t.type === "expense" && t.date.slice(0,7) > selectedMonth && t.installmentGroup && !t.recurringGroup).reduce((s, t) => s + t.amount, 0);
        const limit = parseBR(accDetail.limit);
        const available = limit - monthSpend - futureBill;
        return (
          <Modal title="" onClose={() => setAccDetail(null)}>
            <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16, paddingBottom:16, borderBottom:"1px solid "+C.border }}>
              {brand
                ? <img src={brand.logo} alt={accDetail.name} style={{ width:48, height:48, borderRadius:14, objectFit:"contain", background:"#fff", padding:5 }} onError={e => (e.target as HTMLImageElement).style.display = "none"} />
                : <div style={{ width:48, height:48, borderRadius:14, background:ac+"33", display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {accDetail.kind === "bank"
                      ? <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>
                      : <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                    }
                  </div>
              }
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:700, color:C.text }}>{accDetail.name}</div>
                <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>{accDetail.kind === "bank" ? "Conta bancária" : "Cartão de crédito"} - {monthLabel(selectedMonth)} - {monthTxs.length} lançamentos</div>
                {accDetail.kind === "card" && (accDetail.closingDay || accDetail.dueDay) && (
                  <div style={{ display:"flex", gap:8, marginTop:6 }}>
                    {accDetail.closingDay && <span style={{ fontSize:11, color:C.sub, background:C.muted+"44", borderRadius:6, padding:"2px 10px" }}>Fecha dia {accDetail.closingDay}</span>}
                    {accDetail.dueDay && <span style={{ fontSize:11, color:C.blue, background:C.blue+"22", borderRadius:6, padding:"2px 10px" }}>Vence dia {accDetail.dueDay}</span>}
                  </div>
                )}
              </div>
              <button onClick={() => { setAccDetail(null); openEditAcc(accDetail); }} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, padding:"6px 12px", cursor:"pointer", fontSize:12 }}>editar</button>
            </div>

            {accDetail.kind === "card" && (
              <button onClick={() => togglePaidBill(accDetail.id, selectedMonth)} style={{ width:"100%", marginBottom:16, padding:"12px", borderRadius:12, border:"none", cursor:"pointer", background:paidBills[accDetail.id+"-"+selectedMonth] ? C.green+"22" : "#1e3a5f33", display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
                {paidBills[accDetail.id + "-" + selectedMonth] ? (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg><span style={{ fontSize:14, fontWeight:700, color:C.green }}>Fatura paga</span></>
                ) : (
                  <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><span style={{ fontSize:14, fontWeight:600, color:C.sub }}>Marcar fatura como paga</span></>
                )}
              </button>
            )}

            <div style={{ display:"flex", gap:10, marginBottom:20 }}>
              <div style={{ flex:1, background:C.card, borderRadius:12, padding:"12px 14px", borderTop:"3px solid "+C.red }}>
                <div style={{ fontSize:11, color:C.sub }}>Gastos</div>
                <div style={{ fontSize:18, fontWeight:700, color:C.red, marginTop:4 }}>{fmt(monthSpend)}</div>
              </div>
              {accDetail.kind === "bank" && (
                <div style={{ flex:1, background:C.card, borderRadius:12, padding:"12px 14px", borderTop:"3px solid "+C.green }}>
                  <div style={{ fontSize:11, color:C.sub }}>Receitas</div>
                  <div style={{ fontSize:18, fontWeight:700, color:C.green, marginTop:4 }}>{fmt(monthIncome)}</div>
                </div>
              )}
              {accDetail.kind === "card" && limit > 0 && (
                <div style={{ flex:1, background:C.card, borderRadius:12, padding:"12px 14px", borderTop:"3px solid "+(available >= 0 ? C.blue : C.red) }}>
                  <div style={{ fontSize:11, color:C.sub }}>Limite disponível</div>
                  <div style={{ fontSize:18, fontWeight:700, color:available >= 0 ? C.blue : C.red, marginTop:4 }}>{fmt(available)}</div>
                </div>
              )}
            </div>

            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Fatura de {monthLabel(selectedMonth)}</div>

            {monthTxs.length === 0 && (
              <div style={{ textAlign:"center", padding:"30px 0", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:8 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <div>Nenhum lançamento neste mês.</div>
              </div>
            )}

            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {monthTxs.map(t => {
                const cat = ALL_CATS.find(c => c.name === t.category);
                const catColor = cat?.color || "#94a3b8";
                return (
                  <div key={t.id} style={{ background:C.card, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"center", gap:12, borderLeft:"3px solid "+catColor }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:catColor+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <CatIcon name={cat?.icon || "other"} color={catColor} size={17} />
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:600, fontSize:14, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</div>
                      <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{catLabel(t.category)} - {t.date.split("-").reverse().join("/")}</div>
                    </div>
                    <div style={{ fontWeight:700, fontSize:15, color:t.type === "income" ? C.green : C.red, flexShrink:0 }}>
                      {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          </Modal>
        );
      })()}
      {/* Side Menu */}
      <SideMenu
        isOpen={showMenu}
        onClose={() => setShowMenu(false)}
        user={user}
        onSignOut={signOut}
      />

    </div>
  );
}
