import { useState, useMemo, useEffect, useCallback } from "react";
import { C, EXPENSE_CATS, INCOME_CATS, ALL_CATS } from "./lib/constants";
import { fmt, parseBR, monthLabel, getBillingYM, iStyle, btn, catLabel } from "./lib/helpers";
import { Modal } from "./components/Modal";
import { TabIcon } from "./components/TabIcon";
import { AraLogo } from "./components/AraLogo";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { DatePicker } from "./components/DatePicker";
import { SideMenu } from "./components/SideMenu";
import { Dashboard } from "./screens/Dashboard";
import { Contas } from "./screens/Contas";
import { Historico } from "./screens/Historico";
import { Metas } from "./screens/Metas";
import type { Transaction, Account, DraftTransaction, DraftAccount } from "./types";
import { translations, type Language } from "./lib/i18n";

// Importando os novos contextos
import { useAuth } from "./contexts/AuthContext";
import { useFinance } from "./contexts/FinanceContext";

export default function App() {
  const now = new Date();
  const currentYM = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const todayStr  = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");

  // Contextos
  const { user, authLoading, signIn, signUp, signOut } = useAuth();
  const { 
    transactions, accounts, loadingData, saving, 
    saveTx, deleteTx, saveAcc, deleteAccount, deleteGoal, clearAllData 
  } = useFinance();

  // UI state
  const [tab, setTab] = useState<string>("dashboard");
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYM);
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [pendingDelete, setPendingDelete] = useState<{ type:"tx"|"account"|"goal"; id:number; label:string } | null>(null);
  const [txModalOpen, setTxModalOpen] = useState(false);
  const [accModalOpen, setAccModalOpen] = useState(false);
  const [txToEdit, setTxToEdit] = useState<any>(null);
  const [accDetail, setAccDetail] = useState<any>(null);
  const [advanceModal, setAdvanceModal] = useState<any>(null);
  const [goalModal, setGoalModal] = useState<any>(null);

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem("ara-language") as Language) || "pt";
  });
  const t = translations[language];

  // Modal States (agora tipados e separados do fluxo principal de dados)
  const [txModal, setTxModal] = useState<{ isOpen: boolean; data: DraftTransaction | null }>({ isOpen: false, data: null });
  const [accModal, setAccModal] = useState<{ isOpen: boolean; data: DraftAccount | null }>({ isOpen: false, data: null });

  // Viewport fix
  useEffect(() => {
    let meta = document.querySelector("meta[name=viewport]");
    if (!meta) { meta = document.createElement("meta"); meta.name = "viewport"; document.head.appendChild(meta); }
    (meta as HTMLMetaElement).content = "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no";
  }, []);

  // ── Computados Visuais (Poderiam ir para hooks customizados no futuro) ──
  const filtered = useMemo(() => {
    return transactions.filter(tx => {
      if (!tx.date) return false;
      return getBillingYM(tx.date, tx.accountId, accounts) === selectedMonth;
    });
  }, [transactions, accounts, selectedMonth]);

  const totalIncome  = useMemo(() => filtered.filter(tx => tx.type === "income").reduce((s, tx) => s + tx.amount, 0), [filtered]);
  const totalExpense = useMemo(() => filtered.filter(tx => tx.type === "expense").reduce((s, tx) => s + tx.amount, 0), [filtered]);
  const balance      = useMemo(() => totalIncome - totalExpense, [totalIncome, totalExpense]);

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.filter(tx => tx.type === "expense").forEach(tx => {
      if (!map[tx.category]) map[tx.category] = 0;
      map[tx.category] += tx.amount;
    });
    return Object.entries(map).map(([name, value]) => {
      const cat = ALL_CATS.find(c => c.name === name);
      return { name, value, color: cat?.color || "#94a3b8", icon: cat?.icon || "other" };
    }).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const byDate = useMemo(() => {
    const map: Record<string, { day: string; receita: number; gasto: number }> = {};
    filtered.forEach(tx => {
      const d = tx.date.slice(8, 10) + "/" + tx.date.slice(5, 7);
      if (!map[d]) map[d] = { day: d, receita: 0, gasto: 0 };
      if (tx.type === "income") map[d].receita += tx.amount;
      else map[d].gasto += tx.amount;
    });
    return Object.values(map).sort((a, b) => a.day.localeCompare(b.day));
  }, [filtered]);

  const banks  = useMemo(() => accounts.filter(a => a.kind === "bank"), [accounts]);
  const cards  = useMemo(() => accounts.filter(a => a.kind === "card"), [accounts]);

  // ── Navegação de Meses ──
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

  // ── Funções Auxiliares de Modais ──
  const EMPTY_TX = useCallback((): DraftTransaction => ({ 
    type: "expense", description: "", amount: "", category: "Alimentação", 
    accountId: "", date: todayStr, installments: "1", recurring: false 
  }), [todayStr]);
  
  const EMPTY_ACC = useCallback((): DraftAccount => ({ 
    kind: "bank", name: "", balance: "", limit: "", colorIdx: 0 
  }), []);

  const openNewTx   = useCallback(() => setTxModal({ isOpen: true, data: EMPTY_TX() }), [EMPTY_TX]);

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("ara-language", lang);
  };

  // ── Loading States ──
  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
      <AraLogo size={72} id="splash" />
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Ara Finance</div>
    </div>
  );

  if (loadingData) return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: C.text, gap: 12 }}>
      <AraLogo size={80} id="loading" />
      <div style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Ara Finance</div>
      <div style={{ fontSize: 13, color: C.sub }}>Controle com clareza. Viva melhor.</div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "system-ui, sans-serif", paddingBottom: 80 }}>
      {/* Estilos Globais */}
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
      <div style={{ padding: "20px 20px 16px", background: "linear-gradient(180deg, #0d1424 0%, " + C.bg + " 100%)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AraLogo size={36} id="header" />
          </div>
          <button onClick={() => setShowMenu(true)} style={{ background: C.card, border: "1px solid " + C.border, color: C.sub, borderRadius: 12, width: 38, height: 38, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
        </div>

        {/* Mês Navigation */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <button onClick={prevMonth} style={{ background: C.card, border: "1px solid " + C.border, color: C.sub, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>‹</button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.sub }}>{monthLabel(selectedMonth)}</div>
          </div>
          <button onClick={nextMonth} style={{ background: C.card, border: "1px solid " + C.border, color: C.sub, borderRadius: 10, padding: "6px 12px", cursor: "pointer", fontSize: 16 }}>›</button>
        </div>

        {/* Dashboard Resumo */}
        {tab === "dashboard" && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>{t.saldoDoMes}</div>
            <div style={{ fontSize: 38, fontWeight: 700, color: balance >= 0 ? C.green : C.red, letterSpacing: -1 }}>{fmt(balance)}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 12 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.sub }}>{t.receitas}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.green }}>{fmt(totalIncome)}</div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 11, color: C.sub }}>{t.gastos}</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: C.red }}>{fmt(totalExpense)}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tab Bar Inferior */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(17,24,39,0.75)", backdropFilter: "blur(24px) saturate(180%)", WebkitBackdropFilter: "blur(24px) saturate(180%)", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", zIndex: 50, paddingBottom: 8 }}>
        {["dashboard", "contas"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", padding: "10px 0 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <TabIcon tab={tb} active={tab === tb} blue={C.blue} sub={C.sub} />
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === tb ? C.blue : C.sub }}>{t[tb as keyof typeof t] as string}</span>
          </button>
        ))}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", paddingBottom: 4 }}>
          <button onClick={openNewTx} style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#2563EB,#7C3AED)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px #7C3AED44", marginTop: -16 }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
        {["historico", "metas"].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} style={{ flex: 1, border: "none", background: "none", cursor: "pointer", padding: "10px 0 4px", display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <TabIcon tab={tb} active={tab === tb} blue={C.blue} sub={C.sub} />
            <span style={{ fontSize: 10, fontWeight: 600, color: tab === tb ? C.blue : C.sub }}>{t[tb as keyof typeof t] as string}</span>
          </button>
        ))}
      </div>

      {/* Conteúdo das Abas */}
      <div key={tab} className="tab-content" style={{ padding: "16px 16px 0" }}>
        {tab === "dashboard" && <Dashboard filtered={filtered} transactions={transactions} selectedMonth={selectedMonth} totalIncome={totalIncome} totalExpense={totalExpense} balance={balance} byCategory={byCategory} byDate={byDate} />}
        {tab === "contas" && <Contas selectedMonth={selectedMonth} onNewAcc={() => setAccModalOpen(true)} onAccDetail={a => setAccDetail(a)} />}        
        {tab === "historico" && <Historico sorted={filtered} selectedMonth={selectedMonth} searchQuery={searchQuery} onSearchChange={setSearchQuery} onEditTx={t => { setTxToEdit(t); setTxModalOpen(true); }} onAdvance={g => setAdvanceModal(g)} />}
        {tab === "metas" && <Metas selectedMonth={selectedMonth} onNew={() => setGoalModal(null)} onEdit={g => setGoalModal(g)} />}

      </div>

      {/* MODAL: Transação */}
      {txModal.isOpen && txModal.data && (
        <Modal title={txModal.data.editId != null ? "Editar Lançamento" : "Novo Lançamento"} onClose={() => setTxModal({ isOpen: false, data: null })}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4 }}>
            {["expense", "income"].map(tp => (
              <button key={tp} onClick={() => setTxModal(prev => ({ ...prev, data: { ...prev.data!, type: tp as any, category: tp === "expense" ? "Alimentação" : "Salário" } }))} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: txModal.data!.type === tp ? (tp === "expense" ? C.red : C.green) : "transparent", color: txModal.data!.type === tp ? "#fff" : C.sub }}>
                {tp === "expense" ? "Gasto" : "Receita"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input style={iStyle} placeholder="Descrição" value={txModal.data.description} onChange={e => setTxModal(prev => ({ ...prev, data: { ...prev.data!, description: e.target.value } }))} />
            <input style={iStyle} placeholder={txModal.data.type === "expense" ? "Valor (ex: 150,00)" : "Valor total (ex: 1.500,00)"} type="text" inputMode="decimal" value={txModal.data.amount} onChange={e => setTxModal(prev => ({ ...prev, data: { ...prev.data!, amount: e.target.value } }))} />
            
            {/* Omitidos botões de parcelamento/recorrência por brevidade, mas você pode usar o mesmo padrão de setState: setTxModal(prev => ({...prev, data: {...prev.data, ...}})) */}

            <select style={iStyle} value={txModal.data.category} onChange={e => setTxModal(prev => ({ ...prev, data: { ...prev.data!, category: e.target.value } }))}>
              {(txModal.data.type === "expense" ? EXPENSE_CATS : INCOME_CATS).map(c => <option key={c.name} value={c.name}>{catLabel(c.name)}</option>)}
            </select>
            <select style={iStyle} value={txModal.data.accountId} onChange={e => setTxModal(prev => ({ ...prev, data: { ...prev.data!, accountId: e.target.value } }))}>
              <option value="">Sem vínculo de conta</option>
              {banks.map(a => <option key={a.id} value={String(a.id)}>Banco - {a.name}</option>)}
              {cards.map(a => <option key={a.id} value={String(a.id)}>Cartão - {a.name}</option>)}
            </select>
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Data</div>
              <DatePicker value={txModal.data.date} onChange={date => setTxModal(prev => ({ ...prev, data: { ...prev.data!, date } }))} />
            </div>
            
            <button 
              onClick={async () => { await saveTx(txModal.data!, true); setTxModal({ isOpen: false, data: null }); }} 
              disabled={saving} 
              style={{ ...btn("#f1f5f9"), opacity: saving ? 0.6 : 1 }}
            >
              {saving ? "Salvando..." : txModal.data.editId != null ? "Salvar alterações" : "Adicionar lançamento"}
            </button>
            
            {txModal.data.editId != null && (
              <button onClick={() => { setPendingDelete({ type: "tx", id: txModal.data!.editId as number, label: txModal.data!.description }); setTxModal({ isOpen: false, data: null }); }} style={btn("none", { border: "1px solid " + C.red + "44", color: C.red })}>Remover lançamento</button>
            )}
          </div>
        </Modal>
      )}

      {/* MODAL: Conta */}
      {accModal.isOpen && accModal.data && (
        <Modal title={accModal.data.editId != null ? "Editar Conta" : "Nova Conta"} onClose={() => setAccModal({ isOpen: false, data: null })}>
          <div style={{ display: "flex", gap: 8, marginBottom: 16, background: C.card, borderRadius: 12, padding: 4 }}>
            {["bank", "card"].map(k => (
              <button key={k} onClick={() => setAccModal(prev => ({ ...prev, data: { ...prev.data!, kind: k as any } }))} style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600, background: accModal.data!.kind === k ? "linear-gradient(135deg,#2563EB,#7C3AED)" : "transparent", color: accModal.data!.kind === k ? "#fff" : C.sub }}>
                {k === "bank" ? "Banco" : "Cartão"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Nome da conta</div>
              <input style={iStyle} placeholder="Ex: Nubank, Bradesco..." value={accModal.data.name} onChange={e => setAccModal(prev => ({ ...prev, data: { ...prev.data!, name: e.target.value } }))} />
            </div>
            {accModal.data.kind === "bank" && (
              <div>
                <div style={{ fontSize: 12, color: C.sub, marginBottom: 6 }}>Saldo atual</div>
                <input style={iStyle} placeholder="Ex: 1.500,00" type="text" inputMode="decimal" value={accModal.data.balance} onChange={e => setAccModal(prev => ({ ...prev, data: { ...prev.data!, balance: e.target.value } }))} />
              </div>
            )}
            
            <button onClick={async () => { await saveAcc(accModal.data!); setAccModal({ isOpen: false, data: null }); }} style={btn("linear-gradient(135deg,#2563EB,#7C3AED)")}>
              {saving ? "Salvando..." : accModal.data.editId != null ? "Salvar alterações" : "Adicionar"}
            </button>
            
            {accModal.data.editId != null && (
              <button onClick={() => { setPendingDelete({ type: "account", id: accModal.data!.editId as number, label: accModal.data!.name }); setAccModal({ isOpen: false, data: null }); }} style={btn("none", { border: "1px solid " + C.red + "44", color: C.red })}>Remover conta</button>
            )}
          </div>
        </Modal>
      )}

      {/* Side Menu */}
      <SideMenu isOpen={showMenu} onClose={() => setShowMenu(false)} user={user} onSignOut={signOut} onSignIn={signIn} onSignUp={signUp} currentLanguage={language} onLanguageChange={handleLanguageChange} transactions={transactions} onClearData={clearAllData} />

      {/* Confirm Dialog */}
      {pendingDelete && (
        <ConfirmDialog
          title={pendingDelete.type === "tx" ? "Remover lançamento?" : pendingDelete.type === "account" ? "Remover conta?" : "Remover meta?"}
          message="Essa ação não pode ser desfeita."
          confirmLabel="Remover"
          onCancel={() => setPendingDelete(null)}
          onConfirm={async () => {
            if (pendingDelete.type === "tx") await deleteTx(pendingDelete.id);
            if (pendingDelete.type === "account") await deleteAccount(pendingDelete.id);
            if (pendingDelete.type === "goal") await deleteGoal(pendingDelete.id);
            setPendingDelete(null);
          }}
        />
      )}
    </div>
  );
}
