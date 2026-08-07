import type { Category, BrandInfo, ColorMap } from "../types";

// ── Design Tokens ─────────────────────────────────────────────
export const C: ColorMap = {
  bg:      "#0a0f1a",
  surface: "#111827",
  card:    "#161e2e",
  border:  "#1f2d45",
  muted:   "#374151",
  text:    "#f1f5f9",
  sub:     "#6b7280",
  green:   "#22c55e",
  red:     "#ef4444",
  purple:  "#a855f7",
  blue:    "#3b82f6",
};

// ── Categories ────────────────────────────────────────────────
export const EXPENSE_CATS: Category[] = [
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

export const INCOME_CATS: Category[] = [
  { name:"Salário",         icon:"salary",    color:"#4ade80" },
  { name:"Gorjeta",         icon:"tip",       color:"#facc15" },
  { name:"Vale",            icon:"voucher",   color:"#60a5fa" },
  { name:"Vale Transporte", icon:"transport", color:"#fb923c" },
  { name:"PIX",             icon:"pix",       color:"#38bdf8" },
  { name:"Outros",          icon:"other",     color:"#94a3b8" },
];

export const ALL_CATS: Category[] = [...EXPENSE_CATS, ...INCOME_CATS];

// ── Account Colors ────────────────────────────────────────────
export const ACCOUNT_COLORS: string[] = [
  "#3b82f6","#8b5cf6","#ec4899","#ef4444",
  "#f59e0b","#10b981","#06b6d4","#f97316","#6366f1","#64748b",
];

// ── Bank Brands ───────────────────────────────────────────────
export const BANK_BRANDS: Record<string, BrandInfo> = {
  "nubank":      { color:"#820AD1", bg:"#1a0628", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Nubank_logo_2021.svg/240px-Nubank_logo_2021.svg.png" },
  "itau":        { color:"#EC7000", bg:"#1e0e00", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Banco_Ita%C3%BA_logo.svg/240px-Banco_Ita%C3%BA_logo.svg.png" },
  "itauu":       { color:"#EC7000", bg:"#1e0e00", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Banco_Ita%C3%BA_logo.svg/240px-Banco_Ita%C3%BA_logo.svg.png" },
  "bradesco":    { color:"#CC0000", bg:"#1a0000", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Bradesco_logo.svg/240px-Bradesco_logo.svg.png" },
  "bb":          { color:"#F9DD16", bg:"#141100", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Banco_do_Brasil_logo_%282020%29.svg/240px-Banco_do_Brasil_logo_%282020%29.svg.png" },
  "caixa":       { color:"#0070AF", bg:"#000f1a", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/8a/Caixa_Econ%C3%B4mica_Federal_logo.svg/240px-Caixa_Econ%C3%B4mica_Federal_logo.svg.png" },
  "inter":       { color:"#FF7A00", bg:"#1e0e00", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Banco_Inter_logo.svg/240px-Banco_Inter_logo.svg.png" },
  "c6":          { color:"#444",    bg:"#0a0a0a", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/C6_Bank_logo.svg/240px-C6_Bank_logo.svg.png" },
  "santander":   { color:"#EC0000", bg:"#1a0000", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Santander_Consumer_Finance_logo.svg/240px-Santander_Consumer_Finance_logo.svg.png" },
  "mercadopago": { color:"#00b1ea", bg:"#001a24", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/MercadoPago_logo.svg/240px-MercadoPago_logo.svg.png" },
  "mercado":     { color:"#00b1ea", bg:"#001a24", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/MercadoPago_logo.svg/240px-MercadoPago_logo.svg.png" },
  "xp":          { color:"#555",    bg:"#0a0a0a", logo:"https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/XP_Investimentos_logo_2019.svg/240px-XP_Investimentos_logo_2019.svg.png" },
};

// ── Months ────────────────────────────────────────────────────
export const MONTHS: string[] = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

export const TABS: string[] = ["dashboard","contas","lancamentos","historico","metas"];

export const TAB_LABELS: Record<string, string> = {
  dashboard:    "Dashboard",
  contas:       "Contas",
  lancamentos:  "Lançamentos",
  historico:    "Histórico",
  metas:        "Metas",
};

// ── Brand default color index ─────────────────────────────────
export const BRAND_COLOR_IDX: Record<string, number> = {
  "nubank":    1,
  "itau":      7,
  "bradesco":  3,
  "bb":        4,
  "caixa":     0,
  "inter":     7,
  "c6":        9,
  "santander": 3,
  "mercado":   0,
  "xp":        9,
  "amex":      5,
  "american":  5,
  "next":      5,
  "picpay":    5,
  "sicoob":    0,
  "sicredi":   5,
};

export const getBrandColorIdx = (name: string): number => {
  const k = name.toLowerCase().trim().normalize("NFD").replace(/[̀-ͯ]/g, "");
  for (const [brand, idx] of Object.entries(BRAND_COLOR_IDX)) {
    if (k.includes(brand)) return idx;
  }
  return 0;
};
