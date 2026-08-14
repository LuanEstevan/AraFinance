import { useState, useMemo, useEffect, useCallback } from "react";
import { supabase } from "./lib/supabase";
import { C, EXPENSE_CATS, INCOME_CATS, ALL_CATS, ACCOUNT_COLORS, TABS, TAB_LABELS, getBrandColorIdx } from "./lib/constants";
import { fmt, parseBR, monthLabel, fmtDate, getBrand, getBillingYM, iStyle, btn, catLabel } from "./lib/helpers";
import { Modal } from "./components/Modal";
import { TabIcon } from "./components/TabIcon";
import { CatIcon } from "./components/CatIcon";
import { AraLogo } from "./components/AraLogo";
import { DatePicker } from "./components/DatePicker";
import { SideMenu } from "./components/SideMenu";
import { Dashboard } from "./screens/Dashboard";
import { Contas } from "./screens/Contas";
import { Historico } from "./screens/Historico";
import { Metas } from "./screens/Metas";
import type { Transaction, Account, Goal, PaidBills } from "./types";
import { translations, type Language } from "./lib/i18n";




export default function App() {
  const now = new Date();
  const currentYM = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const todayStr  = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");

  // Auth state
  const [user, setUser]               = useState<any>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

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
  const [showMenu, setShowMenu]         = useState<boolean>(false);
  const [language, setLanguage]         = useState<Language>(() => {
    return (localStorage.getItem("ara-language") as Language) || "pt";
  });
  const t = translations[language];
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

  // Load data — Supabase if logged in, localStorage otherwise
  useEffect(() => {
    (async () => {
      setLoading(true);
      if (user) {
        try {
          const { data, error } = await supabase
            .from("user_data").select("*").eq("id", user.id).single();
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
      } else {
        try {
          const raw = localStorage.getItem("ara-finance-data");
          if (raw) {
            const d = JSON.parse(raw);
            if (d.transactions)  setTransactions(d.transactions);
            if (d.accounts)      setAccounts(d.accounts);
            if (d.goals)         setGoals(d.goals);
            if (d.paidBills)     setPaidBills(d.paidBills);
            if (d.nextTxId)      setNextTxId(d.nextTxId);
            if (d.nextAccId)     setNextAccId(d.nextAccId);
            if (d.nextGoalId)    setNextGoalId(d.nextGoalId);
          }
        } catch(e) {}
      }
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
    setSaving(true);
    const pb = paid !== undefined ? paid : paidBills;
    if (user) {
      try {
        await supabase.from("user_data").upsert({
          id: user.id,
          transactions: txs, accounts: accs, goals: gls, paid_bills: pb,
          next_tx_id: txId, next_acc_id: accId, next_goal_id: gId,
          updated_at: new Date().toISOString(),
        });
        setLastSaved(new Date());
      } catch(e) {}
    } else {
      try {
        localStorage.setItem("ara-finance-data", JSON.stringify({
          transactions: txs, accounts: accs, goals: gls, paidBills: pb,
          nextTxId: txId, nextAccId: accId, nextGoalId: gId,
        }));
        setLastSaved(new Date());
      } catch(e) {}
    }
    setSaving(false);
  }, [user, paidBills]);

  // Auth functions
  const signIn = async (email: string, password: string): Promise<string> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : "";
  };

  const signUp = async (email: string, password: string): Promise<string> => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? error.message : "Verifique seu email para confirmar o cadastro!";
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
  const [txSaving, setTxSaving] = useState<boolean>(false);

  const saveTx = async (updateAll: boolean) => {
    if (txSaving) return;
    setTxSaving(true);
    const f = txModal;
    if (!f.description || !f.amount) { setTxSaving(false); return; }
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
    setTxSaving(false);
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

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("ara-language", lang);
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


  // ── Auth loading ───────────────────────────────────────────
  if (authLoading) return (
    <div style={{ minHeight:"100vh", background:C.bg, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:12 }}>
      <AraLogo size={72} id="splash" />
      <div style={{ fontSize:22, fontWeight:800, color:C.text }}>Ara Finance</div>
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
        .recharts-wrapper, .recharts-surface, .recharts-pie, .recharts-pie-sector,
        .recharts-bar, .recharts-bar-rectangle, .recharts-layer, .recharts-sector {
          outline: none !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ padding:"20px 20px 16px", background:"linear-gradient(180deg, #0d1424 0%, "+C.bg+" 100%)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <AraLogo size={36} id="header" />
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
            <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>{t.saldoDoMes}</div>
            <div style={{ fontSize:38, fontWeight:700, color:balance >= 0 ? C.green : C.red, letterSpacing:-1 }}>{fmt(balance)}</div>
            <div style={{ display:"flex", justifyContent:"center", gap:24, marginTop:12 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.sub }}>{t.receitas}</div>
                <div style={{ fontSize:16, fontWeight:600, color:C.green }}>{fmt(totalIncome)}</div>
              </div>
              <div style={{ width:1, background:C.border }} />
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:11, color:C.sub }}>{t.gastos}</div>
                <div style={{ fontSize:16, fontWeight:600, color:C.red }}>{fmt(totalExpense)}</div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Tab bar */}
      <div style={{ position:"fixed", bottom:0, left:0, right:0, background:"rgba(17,24,39,0.75)", backdropFilter:"blur(24px) saturate(180%)", WebkitBackdropFilter:"blur(24px) saturate(180%)", borderTop:"1px solid rgba(255,255,255,0.08)", display:"flex", zIndex:50, paddingBottom:8 }}>
        {["dashboard","contas"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ flex:1, border:"none", background:"none", cursor:"pointer", padding:"10px 0 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <TabIcon tab={tb} active={tab === tb} blue={C.blue} sub={C.sub} />
            <span style={{ fontSize:10, fontWeight:600, color:tab === tb ? C.blue : C.sub }}>{t[tb as keyof typeof t] as string}</span>
          </button>
        ))}

        {/* Center + button */}
        <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", paddingBottom:4 }}>
          <button
            onClick={() => { openNewTx(); }}
            style={{ width:52, height:52, borderRadius:"50%", background:"linear-gradient(135deg,#2563EB,#7C3AED)", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 20px #7C3AED44", marginTop:-16 }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </button>
        </div>

        {["historico","metas"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ flex:1, border:"none", background:"none", cursor:"pointer", padding:"10px 0 4px", display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <TabIcon tab={tb} active={tab === tb} blue={C.blue} sub={C.sub} />
            <span style={{ fontSize:10, fontWeight:600, color:tab === tb ? C.blue : C.sub }}>{t[tb as keyof typeof t] as string}</span>
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
              <DatePicker value={txModal.date} onChange={date => setTxModal((f: any) => ({ ...f, date }))} />
            </div>
            <button onClick={() => saveTx(true)} disabled={txSaving} style={{ ...btn("#f1f5f9"), opacity:txSaving?0.6:1 }}>{txSaving ? "Salvando..." : txModal.editId != null ? "Salvar alterações" : "Adicionar lançamento"}</button>
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
        <Modal title={accModal.editId != null ? "Editar Conta" : ""} onClose={() => setAccModal(null)}>
          <div style={{ display:"flex", gap:8, marginBottom:16, background:C.card, borderRadius:12, padding:4 }}>
            {["bank","card"].map(k => (
              <button key={k} onClick={() => setAccModal((f: any) => ({ ...f, kind:k }))} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:accModal.kind===k?"linear-gradient(135deg,#2563EB,#7C3AED)":"transparent", color:accModal.kind===k?"#fff":C.sub }}>
                {k === "bank" ? "Banco" : "Cartão"}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div>
              <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Nome da conta</div>
              <input style={iStyle} placeholder="Ex: Nubank, Bradesco..." value={accModal.name} onChange={e => {
                const name = e.target.value;
                const colorIdx = accModal.editId != null ? accModal.colorIdx : getBrandColorIdx(name);
                setAccModal((f: any) => ({ ...f, name, colorIdx }));
              }} />
            </div>
            {accModal.kind === "bank" && (
              <div>
                <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Saldo atual <span style={{ color:C.muted }}>(opcional)</span></div>
                <input style={iStyle} placeholder="Ex: 1.500,00" type="text" inputMode="decimal" value={accModal.balance} onChange={e => setAccModal((f: any) => ({ ...f, balance:e.target.value }))} />
              </div>
            )}
            {accModal.kind === "card" && (
              <div>
                <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Limite total <span style={{ color:C.muted }}>(opcional)</span></div>
                <input style={iStyle} placeholder="Ex: 5.000,00" type="text" inputMode="decimal" value={accModal.limit} onChange={e => setAccModal((f: any) => ({ ...f, limit:e.target.value }))} />
              </div>
            )}
            {accModal.kind === "card" && (
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Dia do fechamento</div>
                  <input style={{ ...iStyle, textAlign:"center", fontSize:16, fontWeight:600 }} placeholder="15" type="text" inputMode="numeric" maxLength={2} value={accModal.closingDay || ""} onChange={e => setAccModal((f: any) => ({ ...f, closingDay:e.target.value.replace(/\D/g,"") }))} />
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Dia do vencimento</div>
                  <input style={{ ...iStyle, textAlign:"center", fontSize:16, fontWeight:600 }} placeholder="22" type="text" inputMode="numeric" maxLength={2} value={accModal.dueDay || ""} onChange={e => setAccModal((f: any) => ({ ...f, dueDay:e.target.value.replace(/\D/g,"") }))} />
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
            <button onClick={saveAcc} style={btn("linear-gradient(135deg,#2563EB,#7C3AED)")}>{accModal.editId != null ? "Salvar alterações" : "Adicionar"}</button>
            {accModal.editId != null && <button onClick={async () => { await deleteAccount(accModal.editId); }} style={btn("none", { border:"1px solid "+C.red+"44", color:C.red })}>Remover conta</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Configurações */}

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
            <button onClick={() => saveGoal(goalModal)} style={btn("linear-gradient(135deg,#2563EB,#7C3AED)")}>{goalModal.editId != null ? "Salvar alterações" : "Criar meta"}</button>
            {goalModal.editId != null && <button onClick={async () => { await deleteGoal(goalModal.editId); setGoalModal(null); }} style={btn("none", { border:"1px solid "+C.red+"44", color:C.red })}>Remover meta</button>}
          </div>
        </Modal>
      )}

      {/* MODAL: Detalhe da Conta */}
      {accDetail && (() => {
        const brand    = getBrand(accDetail.name);
        const ac       = ACCOUNT_COLORS[accDetail.colorIdx % ACCOUNT_COLORS.length];
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
        onSignIn={signIn}
        onSignUp={signUp}
        currentLanguage={language}
        onLanguageChange={handleLanguageChange}
      />

    </div>
  );
}
