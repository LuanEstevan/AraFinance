import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";
import type { Transaction, Account, Goal, PaidBills, DraftTransaction, DraftAccount } from "../types";
import { parseBR } from "../lib/helpers";

interface FinanceContextData {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  paidBills: PaidBills;
  loadingData: boolean;
  saving: boolean;
  saveTx: (f: DraftTransaction, updateAll: boolean) => Promise<void>;
  deleteTx: (id: number) => Promise<void>;
  saveAcc: (f: DraftAccount) => Promise<void>;
  deleteAccount: (id: number) => Promise<void>;
  saveGoal: (f: Goal) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  togglePaidBill: (accId: number, ym: string) => Promise<void>;
  saveAdvance: (future: Transaction[], values: Record<number, { checked: boolean; amount: string }>, advDate: string) => Promise<void>;
  clearAllData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextData>({} as FinanceContextData);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [paidBills, setPaidBills] = useState<PaidBills>({});
  
  const [nextTxId, setNextTxId] = useState<number>(1);
  const [nextAccId, setNextAccId] = useState<number>(1);
  const [nextGoalId, setNextGoalId] = useState<number>(1);
  
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  // Carrega os dados (Supabase ou LocalStorage)
  useEffect(() => {
    (async () => {
      setLoadingData(true);
      if (user) {
        try {
          const { data, error } = await supabase.from("user_data").select("*").eq("id", user.id).single();
          if (error && error.code !== 'PGRST116') {
            console.error("[FinanceContext] Erro ao buscar dados do Supabase:", error);
          }
          if (data) {
            setTransactions(data.transactions || []);
            setAccounts(data.accounts || []);
            setGoals(data.goals || []);
            setPaidBills(data.paid_bills || {});
            setNextTxId(data.next_tx_id || 1);
            setNextAccId(data.next_acc_id || 1);
            setNextGoalId(data.next_goal_id || 1);
          }
        } catch (e) {
          console.error("[FinanceContext] Erro inesperado ao carregar Supabase:", e);
        }
      } else {
        try {
          const raw = localStorage.getItem("ara-finance-data");
          if (raw) {
            const d = JSON.parse(raw);
            setTransactions(d.transactions || []);
            setAccounts(d.accounts || []);
            setGoals(d.goals || []);
            setPaidBills(d.paidBills || {});
            setNextTxId(d.nextTxId || 1);
            setNextAccId(d.nextAccId || 1);
            setNextGoalId(d.nextGoalId || 1);
          }
        } catch (e) {
          console.error("[FinanceContext] Erro ao processar localStorage:", e);
        }
      }
      setLoadingData(false);
    })();
  }, [user]);

  // Função centralizada para persistir dados
  const persistData = useCallback(async (txs: Transaction[], accs: Account[], txId: number, accId: number, gls: Goal[], gId: number, pb: PaidBills) => {
    setSaving(true);
    if (user) {
      try {
        const { error } = await supabase.from("user_data").upsert({
          id: user.id,
          transactions: txs, accounts: accs, goals: gls, paid_bills: pb,
          next_tx_id: txId, next_acc_id: accId, next_goal_id: gId,
          updated_at: new Date().toISOString(),
        });
        if (error) console.error("[FinanceContext] Erro ao salvar no Supabase:", error);
      } catch (e) {
        console.error("[FinanceContext] Erro de rede ao salvar:", e);
      }
    } else {
      try {
        localStorage.setItem("ara-finance-data", JSON.stringify({
          transactions: txs, accounts: accs, goals: gls, paidBills: pb,
          nextTxId: txId, nextAccId: accId, nextGoalId: gId,
        }));
      } catch (e) {
        console.error("[FinanceContext] Limite de armazenamento local excedido ou erro:", e);
      }
    }
    setSaving(false);
  }, [user]);

  const saveTx = async (f: DraftTransaction, updateAll: boolean) => {
    if (!f.description || !f.amount) return;
    
    const totalAmt = parseBR(f.amount);
    const installments = parseInt(f.installments) || 1;
    let newTxs: Transaction[];
    let newId = nextTxId;

    if (f.editId != null) {
      if (updateAll && f.installmentGroup) {
        newTxs = transactions.map(t => {
          if (t.installmentGroup === f.installmentGroup) return { ...t, category: f.category, accountId: f.accountId };
          if (t.id === f.editId) return { ...f, id: f.editId as number, amount: totalAmt } as Transaction;
          return t;
        });
      } else {
        newTxs = transactions.map(t => t.id === f.editId ? { ...f, id: f.editId as number, amount: totalAmt } as Transaction : t);
      }
    } else if (installments: Number(tx.installments), {
      const parcelAmt = totalAmt / installments;
      const [y, m, d] = f.date.split("-").map(Number);
      const generated: Transaction[] = Array.from({ length: installments }, (_, i) => {
        const dd = new Date(y, m - 1 + i, d);
        const dayStr = String(dd.getDate()).padStart(2, "0");
        const monthStr = String(dd.getMonth() + 1).padStart(2, "0");
        return {
          ...f,
          id: nextTxId + i,
          amount: parcelAmt,
          description: `${f.description} ${i + 1}/${installments}`,
          date: `${dd.getFullYear()}-${monthStr}-${dayStr}`,
          installmentGroup: nextTxId,
          installmentIndex: i + 1,
          installmentTotal: installments,
          recurring: false
        } as Transaction;
      });
      newTxs = [...transactions, ...generated];
      newId = nextTxId + installments;
    } else if (f.recurring) {
      const [y, m, d] = f.date.split("-").map(Number);
      const generated: Transaction[] = Array.from({ length: 24 }, (_, i) => {
        const dd = new Date(y, m - 1 + i, d);
        const dayStr = String(dd.getDate()).padStart(2, "0");
        const monthStr = String(dd.getMonth() + 1).padStart(2, "0");
        return {
          ...f,
          id: nextTxId + i,
          amount: totalAmt,
          date: `${dd.getFullYear()}-${monthStr}-${dayStr}`,
          recurringGroup: nextTxId
        } as Transaction;
      });
      newTxs = [...transactions, ...generated];
      newId = nextTxId + 24;
    } else {
      newTxs = [...transactions, { ...f, id: nextTxId, amount: totalAmt } as Transaction];
      newId = nextTxId + 1;
    }

    let newAccs = accounts;
    if (f.editId == null && f.accountId && !f.recurring) {
      newAccs = accounts.map(a => {
        if (String(a.id) === String(f.accountId) && a.kind === "bank") {
          return { ...a, balance: Number(parseBR(String(a.balance))) + (f.type === "income" ? totalAmt : -totalAmt) };
        }
        return a;
      });
    }

    setTransactions(newTxs);
    setAccounts(newAccs);
    setNextTxId(newId);
    await persistData(newTxs, newAccs, newId, nextAccId, goals, nextGoalId, paidBills);
  };

  const deleteTx = async (id: number) => {
    const newTxs = transactions.filter(t => t.id !== id);
    setTransactions(newTxs);
    await persistData(newTxs, accounts, nextTxId, nextAccId, goals, nextGoalId, paidBills);
  };

  const saveAcc = async (f: DraftAccount) => {
    if (!f.name) return;
    let newAccs: Account[];
    let newId = nextAccId;
    
    if (f.editId != null) {
      newAccs = accounts.map(a => a.id === f.editId ? { ...f, id: f.editId as number, balance: parseBR(f.balance), limit: parseBR(f.limit) } as Account : a);
    } else {
      newAccs = [...accounts, { ...f, id: nextAccId, balance: parseBR(f.balance), limit: parseBR(f.limit) } as Account];
      newId = nextAccId + 1;
    }
    
    setAccounts(newAccs);
    setNextAccId(newId);
    await persistData(transactions, newAccs, nextTxId, newId, goals, nextGoalId, paidBills);
  };

  const deleteAccount = async (id: number) => {
    const newAccs = accounts.filter(a => a.id !== id);
    setAccounts(newAccs);
    await persistData(transactions, newAccs, nextTxId, nextAccId, goals, nextGoalId, paidBills);
  };

  const saveAdvance = async (values: Record<number, { checked: boolean; amount: string }>, advDate: string) => {
    const newTxs = transactions.map(t => {
      const v = values[t.id];
      if (v?.checked) return { ...t, date: advDate, amount: parseBR(v.amount), advancedFrom: t.date, description: t.description + " (adiantado)" };
      return t;
    });
    setTransactions(newTxs);
    await persistData(newTxs, accounts, nextTxId, nextAccId, goals, nextGoalId, paidBills);
  };

  const saveGoal = async (f: Goal) => {
    if (!f.name || !f.target) return;
    let newGoals: Goal[];
    let newGoalId = nextGoalId;
    
    if (f.editId != null) {
      newGoals = goals.map(g => g.id === f.editId ? { ...f, id: f.editId as number } : g);
    } else {
      newGoals = [...goals, { ...f, id: nextGoalId }];
      newGoalId = nextGoalId + 1;
    }
    
    setGoals(newGoals);
    setNextGoalId(newGoalId);
    await persistData(transactions, accounts, nextTxId, nextAccId, newGoals, newGoalId, paidBills);
  };

  const deleteGoal = async (id: number) => {
    const newGoals = goals.filter(g => g.id !== id);
    setGoals(newGoals);
    await persistData(transactions, accounts, nextTxId, nextAccId, newGoals, nextGoalId, paidBills);
  };

  const togglePaidBill = async (accId: number, ym: string) => {
    const key = `${accId}-${ym}`;
    const newPaid = { ...paidBills, [key]: !paidBills[key] };
    setPaidBills(newPaid);
    await persistData(transactions, accounts, nextTxId, nextAccId, goals, nextGoalId, newPaid);
  };

  const clearAllData = async () => {
    setTransactions([]); setAccounts([]); setGoals([]); setPaidBills({});
    setNextTxId(1); setNextAccId(1); setNextGoalId(1);
    await persistData([], [], 1, 1, [], 1, {});
  };

  return (
    <FinanceContext.Provider value={{
      transactions, accounts, goals, paidBills, loadingData, saving,
      saveTx, deleteTx, saveAcc, deleteAccount, saveGoal, deleteGoal, togglePaidBill, saveAdvance, clearAllData
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  return useContext(FinanceContext);
}
