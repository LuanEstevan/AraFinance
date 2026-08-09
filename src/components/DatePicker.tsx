import { useState } from "react";
import { C } from "../lib/constants";

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (date: string) => void;
}

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WEEKDAYS_PT = ["D","S","T","Q","Q","S","S"];

export function DatePicker({ value, onChange }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const [y, m, d] = value.split("-").map(Number);
  const [viewY, setViewY] = useState(y);
  const [viewM, setViewM] = useState(m - 1); // 0-indexed

  const formatted = (() => {
    const date = new Date(y, m - 1, d);
    return date.getDate() + " de " + MONTHS_PT[m - 1].slice(0, 3).toLowerCase() + ". de " + y;
  })();

  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const firstWeekday = new Date(viewY, viewM, 1).getDay();
  const today = new Date();
  const todayStr = today.getFullYear() + "-" + String(today.getMonth()+1).padStart(2,"0") + "-" + String(today.getDate()).padStart(2,"0");

  const selectDay = (day: number) => {
    const dateStr = viewY + "-" + String(viewM + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
    onChange(dateStr);
    setOpen(false);
  };

  const prevMonth = () => {
    if (viewM === 0) { setViewM(11); setViewY(viewY - 1); }
    else setViewM(viewM - 1);
  };
  const nextMonth = () => {
    if (viewM === 11) { setViewM(0); setViewY(viewY + 1); }
    else setViewM(viewM + 1);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  return (
    <div style={{ position:"relative" }}>
      <div
        onClick={() => { setViewY(y); setViewM(m - 1); setOpen(true); }}
        style={{ width:"100%", background:C.card, border:"1px solid "+C.border, borderRadius:12, padding:"12px 14px", fontSize:16, color:C.text, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", boxSizing:"border-box" }}
      >
        <span>{formatted}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      </div>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position:"fixed", inset:0, zIndex:150 }} />
          <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, right:0, background:C.surface, border:"1px solid "+C.border, borderRadius:16, padding:16, zIndex:151, boxShadow:"0 -8px 30px #00000066" }}>
            {/* Header: month nav */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
              <button onClick={prevMonth} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{MONTHS_PT[viewM]} {viewY}</div>
              <button onClick={nextMonth} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* Weekday labels */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:4, marginBottom:6 }}>
              {WEEKDAYS_PT.map((wd, i) => (
                <div key={i} style={{ textAlign:"center", fontSize:11, color:C.sub, fontWeight:600, padding:"4px 0" }}>{wd}</div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7, 1fr)", gap:4 }}>
              {cells.map((day, i) => {
                if (day === null) return <div key={i} />;
                const dateStr = viewY + "-" + String(viewM + 1).padStart(2, "0") + "-" + String(day).padStart(2, "0");
                const isSelected = dateStr === value;
                const isToday = dateStr === todayStr;
                return (
                  <button
                    key={i}
                    onClick={() => selectDay(day)}
                    style={{
                      aspectRatio:"1", borderRadius:10, border:"none", cursor:"pointer",
                      background: isSelected ? "linear-gradient(135deg,#2563EB,#7C3AED)" : "transparent",
                      color: isSelected ? "#fff" : isToday ? C.blue : C.text,
                      fontSize:13, fontWeight: isSelected || isToday ? 700 : 500,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      border: isToday && !isSelected ? "1px solid "+C.blue : "none",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Today shortcut */}
            <button
              onClick={() => { onChange(todayStr); setOpen(false); }}
              style={{ width:"100%", marginTop:14, padding:"10px", borderRadius:10, border:"1px solid "+C.border, background:C.card, color:C.blue, cursor:"pointer", fontSize:13, fontWeight:600 }}
            >
              Hoje
            </button>
          </div>
        </>
      )}
    </div>
  );
}
