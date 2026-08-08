import { C, ACCOUNT_COLORS } from "../lib/constants";
import { fmt, parseBR, monthLabel } from "../lib/helpers";
import { btn } from "../lib/helpers";
import type { Transaction, Account, PaidBills } from "../types";

interface ContasProps {
  accounts: Account[];
  transactions: Transaction[];
  selectedMonth: string;
  paidBills: PaidBills;
  spendByAccount: Record<string | number, number>;
  totalBankBalance: number;
  onNewAcc: () => void;
  onAccDetail: (a: Account) => void;
  onTogglePaid: (accId: number, ym: string) => void;
}

export function Contas({ accounts, transactions, selectedMonth, paidBills, spendByAccount, totalBankBalance, onNewAcc, onAccDetail }: ContasProps) {
  const banks = accounts.filter(a => a.kind === "bank");
  const cards = accounts.filter(a => a.kind === "card");

  return (
    <div>
      {/* Summary cards */}
      {(banks.length > 0 || cards.length > 0) && (
        <div style={{ display:"flex", gap:10, marginBottom:16 }}>
          <div style={{ flex:1, background:C.card, borderRadius:14, padding:"14px 16px" }}>
            <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Saldo em Bancos</div>
            <div style={{ fontSize:20, fontWeight:700, color:totalBankBalance >= 0 ? C.green : C.red }}>{fmt(totalBankBalance)}</div>
          </div>
          {cards.length > 0 && (
            <div style={{ flex:1, background:C.card, borderRadius:14, padding:"14px 16px" }}>
              <div style={{ fontSize:11, color:C.sub, marginBottom:4 }}>Fatura do Mês</div>
              <div style={{ fontSize:20, fontWeight:700, color:C.red }}>{fmt(cards.reduce((s, a) => s + (spendByAccount[a.id] || 0), 0))}</div>
            </div>
          )}
        </div>
      )}

      {/* Banks */}
      {banks.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Bancos</div>
          {banks.map(a => {
            const ac = ACCOUNT_COLORS[a.colorIdx % ACCOUNT_COLORS.length];
            const bg = ac + "22";
            return (
              <div key={a.id} onClick={() => onAccDetail(a)} style={{ background:bg, borderRadius:16, padding:16, marginBottom:10, border:"1px solid "+ac+"33", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:ac+"33", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg></div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{a.name}</div>
                      <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>Gasto este mês: <span style={{ color:C.red }}>{fmt(spendByAccount[a.id] || 0)}</span></div>
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:18, fontWeight:700, color:parseBR(a.balance) >= 0 ? C.green : C.red }}>{fmt(parseBR(a.balance))}</div>
                    <div style={{ color:C.sub, fontSize:16, marginTop:2 }}>›</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cards */}
      {cards.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, fontWeight:600, color:C.sub, textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Cartões</div>
          {cards.map(a => {
            const spent   = spendByAccount[a.id] || 0;
            const limit   = parseBR(a.limit);
            const futureBill = transactions.filter(t => String(t.accountId) === String(a.id) && t.type === "expense" && t.date.slice(0, 7) > selectedMonth && t.installmentGroup && !t.recurringGroup).reduce((s, t) => s + t.amount, 0);
            const committed  = spent + futureBill;
            const available  = limit - committed;
            const pct        = limit > 0 ? Math.min((committed / limit) * 100, 100) : 0;
            const barC       = pct > 80 ? C.red : pct > 50 ? "#f59e0b" : C.green;
            const ac = ACCOUNT_COLORS[a.colorIdx % ACCOUNT_COLORS.length];
            const bg = ac + "22";
            const isPaid = paidBills[a.id + "-" + selectedMonth];
            return (
              <div key={a.id} onClick={() => onAccDetail(a)} style={{ background:bg, borderRadius:16, padding:16, marginBottom:10, border:"1px solid "+ac+"33", cursor:"pointer" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                      <div style={{ width:36, height:36, borderRadius:10, background:ac+"33", display:"flex", alignItems:"center", justifyContent:"center" }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ac} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
                      <div style={{ fontWeight:700, fontSize:15, color:C.text }}>{a.name}</div>
                    </div>
                    {limit > 0 ? (
                      <div>
                        <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:C.sub, marginBottom:6 }}>
                          <span>Fatura: <span style={{ color:C.red, fontWeight:600 }}>{fmt(spent)}</span></span>
                          <span>Limite: {fmt(limit)}</span>
                        </div>
                        <div style={{ background:C.muted, borderRadius:6, height:5 }}>
                          <div style={{ background:barC, borderRadius:6, height:5, width:pct + "%", transition:"width .3s" }} />
                        </div>
                        <div style={{ fontSize:10, color:C.sub, marginTop:4 }}>
                          {pct.toFixed(0)}% comprometido - <span style={{ color:available >= 0 ? C.green : C.red }}>{fmt(available)} disponível</span>
                          {futureBill > 0 && <span style={{ color:C.muted }}> (incl. {fmt(futureBill)} futuras)</span>}
                        </div>
                        {(a.closingDay || a.dueDay) && (
                          <div style={{ display:"flex", gap:10, marginTop:6 }}>
                            {a.closingDay && <span style={{ fontSize:10, color:C.sub, background:C.muted+"44", borderRadius:6, padding:"2px 8px" }}>Fecha dia {a.closingDay}</span>}
                            {a.dueDay && <span style={{ fontSize:10, color:C.blue, background:C.blue+"22", borderRadius:6, padding:"2px 8px" }}>Vence dia {a.dueDay}</span>}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ fontSize:12, color:C.sub }}>
                        Fatura: <span style={{ color:C.red }}>{fmt(spent)}</span>
                        {(a.closingDay || a.dueDay) && (
                          <div style={{ display:"flex", gap:10, marginTop:6 }}>
                            {a.closingDay && <span style={{ fontSize:10, color:C.sub, background:C.muted+"44", borderRadius:6, padding:"2px 8px" }}>Fecha dia {a.closingDay}</span>}
                            {a.dueDay && <span style={{ fontSize:10, color:C.blue, background:C.blue+"22", borderRadius:6, padding:"2px 8px" }}>Vence dia {a.dueDay}</span>}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", marginLeft:12 }}>
                    {isPaid && (
                      <div style={{ background:C.green+"22", borderRadius:8, padding:"2px 8px", marginBottom:4, display:"flex", alignItems:"center", gap:4 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        <span style={{ fontSize:10, color:C.green, fontWeight:700 }}>Pago</span>
                      </div>
                    )}
                    <div style={{ color:C.sub, fontSize:16 }}>›</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {accounts.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:C.sub, display:"flex", flexDirection:"column", alignItems:"center" }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom:12 }}><rect x="2" y="5" width="20" height="14" rx="3"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
          <div style={{ fontSize:16, fontWeight:600, color:C.text, marginBottom:8 }}>Nenhuma conta ainda</div>
          <div style={{ fontSize:13 }}>Adicione seu banco ou cartão</div>
        </div>
      )}

      <button onClick={onNewAcc} style={{ width:"100%", background:"linear-gradient(135deg, #2563EB18, #7C3AED18)", border:"1px solid #2563EB33", borderRadius:14, padding:"14px", cursor:"pointer", fontSize:15, fontWeight:600, color:C.blue, display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Adicionar Conta
      </button>
    </div>
  );
}
