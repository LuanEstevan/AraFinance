import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { C, MONTHS } from "../lib/constants";
import { fmt, monthLabel , catLabel } from "../lib/helpers";
import { CatIcon } from "../components/CatIcon";
import type { Transaction } from "../types";

interface DashboardProps {
  filtered: Transaction[];
  transactions: Transaction[];
  selectedMonth: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  byCategory: { name: string; value: number; color: string; icon: string }[];
  byDate: { day: string; receita: number; gasto: number }[];
}



export function Dashboard({
  filtered, transactions, selectedMonth,
  totalIncome, totalExpense, balance,
  byCategory, byDate,
}: DashboardProps) {

  const months6 = Array.from({ length:6 }, (_, i) => {
    const [y, m] = selectedMonth.split("-").map(Number);
    const d = new Date(y, m - 1 - (5 - i), 1);
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  });

  const data6 = months6.map(ym => {
    const txs = transactions.filter(t => t.date.slice(0, 7) === ym);
    const lbl = MONTHS[parseInt(ym.split("-")[1]) - 1].slice(0, 3);
    const full = MONTHS[parseInt(ym.split("-")[1]) - 1] + " " + ym.split("-")[0];
    return {
      mes: lbl, fullMes: full,
      receita: txs.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
      gasto:   txs.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    };
  });

  const tooltipStyle = {
    contentStyle: { background:C.surface, border:"none", borderRadius:12, color:C.text, fontSize:13, padding:"8px 14px", boxShadow:"0 4px 20px #00000066" },
    itemStyle: { color:C.text, fontWeight:700 },
    labelStyle: { color:C.text, fontWeight:700, marginBottom:4 },
    cursor: { fill:"#ffffff06" },
    wrapperStyle: { outline:"none" },
  };

  if (byCategory.length === 0) return (
    <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhum gasto ainda</div>
      <div style={{ fontSize:13 }}>Adicione seu primeiro lançamento</div>
    </div>
  );

  return (
    <div>
      {byCategory.length > 0 && (
        <div style={{ background:C.card, borderRadius:16, padding:20, marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.sub, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Gastos por Categoria</div>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={2} stroke="none">
                {byCategory.map((e, i) => <Cell key={i} fill={e.color} stroke="none" />)}
              </Pie>
              <Tooltip formatter={(v: any, name: string) => [fmt(v), name]} {...tooltipStyle} />
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

      {byDate.length > 0 && (
        <div style={{ background:C.card, borderRadius:16, padding:20, marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.sub, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Resumo Diário</div>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={byDate} barCategoryGap="35%">
              <XAxis dataKey="day" tick={{ fill:C.sub, fontSize:10 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: any) => fmt(v)}
                labelFormatter={(label: string) => { const [d, m] = label.split("/"); return MONTHS[parseInt(m) - 1] + " " + d; }}
                {...tooltipStyle}
              />
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

      {data6.some(d => d.receita > 0 || d.gasto > 0) && (
        <div style={{ background:C.card, borderRadius:16, padding:20, marginBottom:12 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.sub, marginBottom:16, textTransform:"uppercase", letterSpacing:1 }}>Comparativo 6 Meses</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data6} barCategoryGap="25%" barGap={3}>
              <XAxis dataKey="mes" tick={{ fill:C.sub, fontSize:11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: any) => fmt(v)}
                labelFormatter={(_: any, payload: any) => payload && payload[0] ? payload[0].payload.fullMes : ""}
                {...tooltipStyle}
              />
              <Bar dataKey="receita" fill={C.green} radius={[5,5,0,0]} name="Receita" />
              <Bar dataKey="gasto"   fill={C.red}   radius={[5,5,0,0]} name="Gasto" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:16, marginTop:8, justifyContent:"center" }}>
            <span style={{ fontSize:12, color:C.sub, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.green, display:"inline-block" }} /> Receita</span>
            <span style={{ fontSize:12, color:C.sub, display:"flex", alignItems:"center", gap:4 }}><span style={{ width:8, height:8, borderRadius:"50%", background:C.red, display:"inline-block" }} /> Gasto</span>
          </div>
        </div>
      )}
    </div>
  );
}
