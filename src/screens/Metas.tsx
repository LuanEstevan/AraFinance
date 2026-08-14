import { C } from "../lib/constants";
import { fmt, monthLabel } from "../lib/helpers";
import { btn } from "../lib/helpers";
import type { Goal, Transaction } from "../types";

interface MetasProps {
  goals: Goal[];
  filtered: Transaction[];
  selectedMonth: string;
  balance: number;
  totalExpense: number;
  onNew: () => void;
  onEdit: (g: Goal) => void;
}

export function Metas({ goals, filtered, selectedMonth, balance, totalExpense, onNew, onEdit }: MetasProps) {
  return (
    <div>
      <button onClick={onNew} style={btn("linear-gradient(135deg,#2563EB,#7C3AED)", { marginBottom:16 })}>Nova Meta</button>

      {goals.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
          <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhuma meta ainda</div>
          <div style={{ fontSize:13 }}>Defina uma meta para acompanhar seu progresso</div>
        </div>
      )}

      {goals.map(g => {
        let current = 0;
        if (g.type === "economia")    current = Math.max(0, balance);
        else if (g.type === "gasto_max") current = totalExpense;
        else if (g.type === "categoria") current = filtered.filter(t => t.type === "expense" && t.category === g.category).reduce((s, t) => s + t.amount, 0);

        const pct = Math.min((current / g.target) * 100, 100);
        const completed = g.type === "economia" ? current >= g.target : current <= g.target;
        const barColor = g.type === "economia"
          ? (completed ? C.green : C.blue)
          : (completed ? C.green : current > g.target * 0.8 ? C.red : "#f59e0b");

        return (
          <div key={g.id} onClick={() => onEdit(g)} style={{ background:C.card, borderRadius:16, padding:18, marginBottom:12, cursor:"pointer", border:"1px solid " + (completed ? C.green + "44" : C.border) }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:barColor + "22", display:"flex", alignItems:"center", justifyContent:"center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={barColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{g.name}</div>
                  <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{monthLabel(selectedMonth)}</div>
                </div>
              </div>
              {completed
                ? <div style={{ background:C.green + "22", color:C.green, fontSize:11, fontWeight:700, borderRadius:8, padding:"4px 10px" }}>Atingida</div>
                : <div style={{ fontSize:11, color:C.sub }}>{pct.toFixed(0)}%</div>
              }
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.sub, marginBottom:8 }}>
              <span style={{ fontWeight:600, color:barColor, fontSize:14 }}>{fmt(current)}</span>
              <span>meta: {fmt(g.target)}</span>
            </div>
            <div style={{ background:C.muted, borderRadius:6, height:6 }}>
              <div style={{ background:barColor, borderRadius:6, height:6, width:pct + "%", transition:"width .5s", maxWidth:"100%" }} />
            </div>
            {!completed && (
              <div style={{ fontSize:11, color:C.sub, marginTop:6 }}>
                {g.type === "economia"
                  ? "Faltam " + fmt(g.target - current) + " para atingir"
                  : "Limite restante: " + fmt(Math.max(0, g.target - current))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
