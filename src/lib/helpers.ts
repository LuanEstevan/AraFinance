import { BANK_BRANDS, MONTHS, C } from "./constants";
import type { BrandInfo, Account } from "../types";

// ── Formatters ────────────────────────────────────────────────
export const fmt = (v: number): string =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const parseBR = (v: string | number | undefined): number => {
  if (!v && v !== 0) return 0;
  return parseFloat(String(v).trim().replace(/\./g, "").replace(",", ".")) || 0;
};

export const normalize = (s: string): string =>
  s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

export const getBrand = (name: string): BrandInfo | null => {
  const k = normalize(name);
  for (const b of Object.keys(BANK_BRANDS)) {
    if (k.includes(normalize(b))) return BANK_BRANDS[b];
  }
  return null;
};

export const monthLabel = (ym: string): string => {
  const [y, m] = ym.split("-");
  return MONTHS[parseInt(m) - 1] + ", " + y;
};

export const fmtDate = (d: Date | null): string =>
  d ? d.toLocaleString("pt-BR") : "";

export const getBillingYM = (dateStr: string, accountId: string | number, accounts: Account[]): string => {
  const acc = accounts.find(a => String(a.id) === String(accountId));
  if (!acc || acc.kind !== "card" || !acc.closingDay) return dateStr.slice(0, 7);
  const [y, m, d] = dateStr.split("-").map(Number);
  const closingDay = parseInt(acc.closingDay, 10);
  if (isNaN(closingDay) || closingDay <= 0) return dateStr.slice(0, 7);
  if (d >= closingDay) {
    const next = new Date(y, m, 1);
    return next.getFullYear() + "-" + String(next.getMonth() + 1).padStart(2, "0");
  }
  return dateStr.slice(0, 7);
};

// ── Style Helpers ─────────────────────────────────────────────
export const iStyle: React.CSSProperties = {
  width: "100%",
  background: C.card,
  border: "1px solid " + C.border,
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 16,
  color: C.text,
  outline: "none",
  boxSizing: "border-box",
};

export const btn = (bg: string, extra?: React.CSSProperties): React.CSSProperties => ({
  width: "100%",
  background: bg,
  color: bg === "#f1f5f9" ? "#0a0f1a" : "#fff",
  border: "none",
  borderRadius: 12,
  padding: "13px",
  fontSize: 15,
  fontWeight: 700,
  cursor: "pointer",
  ...extra,
});

export const catLabel = (n: string): string => {
  const map: Record<string, string> = {
    Alimentacao:"Alimentação", Saude:"Saúde", Educacao:"Educação",
    Credito:"Crédito", Salario:"Salário",
  };
  return map[n] || n;
};

// ── Brand default color index ─────────────────────────────────
import { BRAND_COLOR_IDX } from "./constants";

export const getBrandColorIdx = (name: string): number => {
  const k = normalize(name);
  for (const [brand, idx] of Object.entries(BRAND_COLOR_IDX)) {
    if (k.includes(brand)) return idx;
  }
  return 0; // default azul
};
