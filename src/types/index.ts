// ── Types ─────────────────────────────────────────────────────

export interface Category {
  name: string;
  icon: string;
  color: string;
}

export interface Transaction {
  id: number;
  type: "income" | "expense";
  description: string;
  amount: number;
  category: string;
  accountId: string | number;
  date: string;
  installments?: number;
  installmentGroup?: number;
  installmentIndex?: number;
  installmentTotal?: number;
  recurringGroup?: number;
  recurring?: boolean;
  advancedFrom?: string;
}

export interface Account {
  id: number;
  kind: "bank" | "card";
  name: string;
  balance: string | number;
  limit?: string | number;
  colorIdx: number;
  closingDay?: string;
  dueDay?: string;
}

export interface Goal {
  id: number;
  name: string;
  target: number;
  type: "economia" | "gasto_max" | "categoria";
  category?: string;
  createdMonth?: string;
  editId?: number | null;
}

export interface BrandInfo {
  color: string;
  bg: string;
  logo: string;
}

export interface ColorMap {
  bg: string;
  surface: string;
  card: string;
  border: string;
  muted: string;
  text: string;
  sub: string;
  green: string;
  red: string;
  purple: string;
  blue: string;
}

export type PaidBills = Record<string, boolean>;

export interface AppState {
  transactions: Transaction[];
  accounts: Account[];
  goals: Goal[];
  paidBills: PaidBills;
  nextTxId: number;
  nextAccId: number;
  nextGoalId: number;
}
