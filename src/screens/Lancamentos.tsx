import { C, ALL_CATS, ACCOUNT_COLORS } from "../lib/constants";
import { fmt, monthLabel } from "../lib/helpers";
import { btn } from "../lib/helpers";
import { CatIcon } from "../components/CatIcon";
import type { Transaction, Account } from "../types";

interface LancamentosProps {
  sorted: Transaction[];
  accounts: Account[];
  selectedMonth: string;
  balance: number;
  totalExpense: number;
  onNew: () => void;
  onEdit: (t: Transaction) => void;
  onViewAll: () => void;
}

const catLabel = (n: string): string => {
  const map: Record<string, string> = {
    Alimentacao:"Alimentação", Saude:"Saúde", Educacao:"Educação",
    Credito:"Crédito", Salario:"Salário",
  };
  return map[n] || n;
};

export function Lancamentos({ sorted, accounts, selectedMonth, balance, totalExpense, onNew, onEdit, onViewAll }: LancamentosProps) {
  return (
    <div>
      <button onClick={onNew} style={btn("#f1f5f9", { marginBottom:12 })}>Novo Lançamento</button>

      <div style={{ background:C.card, borderRadius:14, padding:16, marginBottom:16 }}>
        <div style={{ fontSize:12, color:C.sub, lineHeight:1.7, display:"flex", gap:10, alignItems:"flex-start" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0, marginTop:2 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <span>Vincule lançamentos a um <b style={{ color:C.text }}>banco</b> para atualizar o saldo automaticamente, ou a um <b style={{ color:C.text }}>cartão</b> para controlar a fatura.</span>
        </div>
      </div>

      {sorted.length > 0 && (
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1 }}>Últimos lançamentos</div>
            <button onClick={onViewAll} style={{ background:"none", border:"none", color:C.blue, cursor:"pointer", fontSize:12, fontWeight:500 }}>Ver todos</button>
          </div>
          {sorted.slice(0, 5).map(t => {
            const cat = ALL_CATS.find(c => c.name === t.category);
            const catColor = cat?.color || "#94a3b8";
            return (
              <div key={t.id} onClick={() => onEdit(t)} style={{ background:C.card, borderRadius:14, padding:"12px 14px", marginBottom:8, display:"flex", alignItems:"center", gap:12, borderLeft:"3px solid "+catColor, cursor:"pointer" }}>
                <div style={{ width:34, height:34, borderRadius:10, background:catColor+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <CatIcon name={cat?.icon || "other"} color={catColor} size={16} />
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:13, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{t.description}</div>
                  <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{catLabel(t.category)} - {t.date.split("-").reverse().join("/")}</div>
                </div>
                <div style={{ fontWeight:700, fontSize:14, color:t.type === "income" ? C.green : C.red, flexShrink:0 }}>
                  {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                </div>
              </div>
            );
          })}
          {sorted.length > 5 && (
            <button onClick={onViewAll} style={{ width:"100%", background:"none", border:"1px solid "+C.border, color:C.sub, borderRadius:12, padding:"10px", fontSize:13, cursor:"pointer", marginTop:4 }}>
              Ver mais {sorted.length - 5} lançamentos
            </button>
          )}
        </div>
      )}

      {sorted.length === 0 && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
          <div style={{ fontSize:14, color:C.text, marginBottom:4 }}>Nenhum lançamento ainda</div>
          <div style={{ fontSize:12 }}>Toque em "Novo Lançamento" para começar</div>
        </div>
      )}
    </div>
  );
}
