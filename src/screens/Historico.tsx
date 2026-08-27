import { C, ALL_CATS, ACCOUNT_COLORS } from "../lib/constants";
import { fmt, monthLabel, catLabel, getBillingYM } from "../lib/helpers";
import { CatIcon } from "../components/CatIcon";
import type { Transaction, Account } from "../types";

interface HistoricoProps {
  sorted: Transaction[];
  transactions: Transaction[];
  accounts: Account[];
  selectedMonth: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onEditTx: (t: Transaction) => void;
  onAdvance: (group: Transaction[]) => void;
}



export function Historico({ sorted, transactions, accounts, selectedMonth, searchQuery, onSearchChange, onEditTx, onAdvance }: HistoricoProps) {
  const displayList = searchQuery.trim()
    ? sorted.filter(t =>
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : sorted;

  // Group installments
  const groups: Record<number, Transaction[]> = {};
  transactions.filter(t => t.installmentGroup).forEach(t => {
    const g = t.installmentGroup!;
    if (!groups[g]) groups[g] = [];
    groups[g].push(t);
  });
  const activeGroups = Object.values(groups).filter(g =>
    g.some(t => getBillingYM(t.date, t.accountId, accounts) === selectedMonth)
  );

  return (
    <div>
      {/* Search */}
      <div style={{ position:"relative", marginBottom:14 }}>
        <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        </div>
        <input
          style={{ width:"100%", background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"12px 14px 12px 38px", fontSize:16, color:C.text, outline:"none", boxSizing:"border-box" }}
          placeholder="Buscar lançamento..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange("")} style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", color:C.sub, cursor:"pointer", fontSize:16 }}>x</button>
        )}
      </div>

      <div style={{ fontSize:12, color:C.sub, marginBottom:14 }}>
        {searchQuery
          ? displayList.length + " resultado" + (displayList.length !== 1 ? "s" : "") + " para \"" + searchQuery + "\""
          : monthLabel(selectedMonth) + " - " + sorted.length + " lançamentos"}
      </div>

      {/* Active installments */}
      {!searchQuery && activeGroups.length > 0 && (
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.purple, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Parcelas em Andamento</div>
          {activeGroups.map(group => {
            const first = group[0];
            const baseName = first.description.replace(/ \d+\/\d+$/, "").replace(" (adiantado)", "");
            const total = group.length;
            const paid  = group.filter(t => getBillingYM(t.date, t.accountId, accounts) <= selectedMonth).length;
            const cur   = group.find(t => getBillingYM(t.date, t.accountId, accounts) === selectedMonth);
            const totalVal = group.reduce((s, t) => s + t.amount, 0);
            return (
              <div key={first.installmentGroup} style={{ background:C.card, borderRadius:14, padding:16, marginBottom:10 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                  <div>
                    <div style={{ fontWeight:600, fontSize:14, color:C.text }}>{baseName} <span style={{ color:C.purple }}>{paid}/{total}</span></div>
                    <div style={{ fontSize:12, color:C.sub, marginTop:2 }}>Total: {fmt(totalVal)}</div>
                  </div>
                  {cur && <div style={{ fontWeight:700, fontSize:15, color:C.red }}>{fmt(cur.amount)}</div>}
                </div>
                <div style={{ background:C.muted, borderRadius:6, height:4 }}>
                  <div style={{ background:C.purple, borderRadius:6, height:4, width:(paid / total * 100) + "%" }} />
                </div>
                {group.some(t => getBillingYM(t.date, t.accountId, accounts) > selectedMonth) && (
                  <button onClick={() => onAdvance(group)} style={{ marginTop:12, width:"100%", background:"none", border:"1px solid "+C.purple+"55", color:C.purple, borderRadius:10, padding:"8px", fontSize:13, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 17 18 12 13 7"/><polyline points="6 17 11 12 6 7"/></svg>
                    Adiantar parcelas
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty states */}
      {sorted.length === 0 && !searchQuery && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
          <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhum lançamento</div>
          <div>Ainda não há movimentações neste mês.</div>
        </div>
      )}
      {displayList.length === 0 && searchQuery && (
        <div style={{ textAlign:"center", padding:"40px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div style={{ fontSize:14, color:C.text, marginBottom:4 }}>Nenhum resultado</div>
          <div style={{ fontSize:12 }}>Tente outro termo de busca</div>
        </div>
      )}

      {/* Transaction list */}
      {displayList.map(t => {
        const cat = ALL_CATS.find(c => c.name === t.category);
        const acc = accounts.find(a => String(a.id) === String(t.accountId));
        const catColor = cat?.color || "#94a3b8";
        const accColor = acc ? ACCOUNT_COLORS[acc.colorIdx % ACCOUNT_COLORS.length] : C.sub;
        let displayDescription = t.description;
        if (t.installmentGroup && t.installmentIndex && t.installmentTotal) {
          displayDescription = t.description.replace(/\s\d+\/\d+$/, "") + " " + t.installmentIndex + "/" + t.installmentTotal;
        }
        return (
          <div key={t.id} onClick={() => onEditTx(t)} style={{ background:C.card, borderRadius:14, padding:"14px 16px", marginBottom:8, display:"flex", alignItems:"center", gap:12, borderLeft:"3px solid "+catColor, cursor:"pointer" }}>
            <div style={{ width:38, height:38, borderRadius:11, background:catColor+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <CatIcon name={cat?.icon || "other"} color={catColor} size={18} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontWeight:600, fontSize:14, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", display:"flex", alignItems:"center", gap:6 }}>
                {displayDescription}
                {t.recurring && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>}
              </div>
              <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                {catLabel(t.category)} - {t.date.split("-").reverse().join("/")}
                {acc && <span style={{ color:accColor }}> - {acc.name}</span>}
              </div>
            </div>
            <div style={{ textAlign:"right", flexShrink:0 }}>
              <div style={{ fontWeight:700, fontSize:15, color:t.type === "income" ? C.green : C.red }}>
                {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
              </div>
              <div style={{ color:C.sub, fontSize:18, lineHeight:1 }}>›</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
