import { C } from "../lib/constants";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, message, confirmLabel = "Remover", onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div
      onClick={onCancel}
      style={{
        position:"fixed", inset:0, zIndex:300,
        background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:24,
        animation:"fadeIn 0.2s ease both",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes confirmIn { from { opacity:0; transform:scale(0.94) translateY(8px); } to { opacity:1; transform:scale(1) translateY(0); } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width:"100%", maxWidth:340,
          background:"rgba(22,26,40,0.82)",
          backdropFilter:"blur(28px) saturate(180%)",
          WebkitBackdropFilter:"blur(28px) saturate(180%)",
          border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:20, padding:22,
          boxShadow:"0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          animation:"confirmIn 0.22s cubic-bezier(0.32,0.72,0,1) both",
        }}
      >
        <div style={{ width:44, height:44, borderRadius:12, background:"#7f1d1d33", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:14 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
        </div>
        <div style={{ fontSize:17, fontWeight:700, color:C.text, marginBottom:8 }}>{title}</div>
        <div style={{ fontSize:14, color:C.sub, lineHeight:1.5, marginBottom:22 }}>{message}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={onCancel}
            style={{ flex:1, background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)", color:C.text, borderRadius:12, padding:"12px", cursor:"pointer", fontSize:14, fontWeight:600 }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            style={{ flex:1, background:C.red, border:"none", color:"#fff", borderRadius:12, padding:"12px", cursor:"pointer", fontSize:14, fontWeight:700 }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
