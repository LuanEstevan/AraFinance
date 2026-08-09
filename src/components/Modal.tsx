import { type ReactNode } from "react";
import { C } from "../lib/constants";

interface ModalProps {
  title?: string;
  onClose: () => void;
  children: ReactNode;
}

export function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div
      className="modal-backdrop"
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(4px)", WebkitBackdropFilter:"blur(4px)", zIndex:100, display:"flex", alignItems:"flex-end" }}
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        style={{
          background:"rgba(22,26,40,0.78)",
          backdropFilter:"blur(28px) saturate(180%)",
          WebkitBackdropFilter:"blur(28px) saturate(180%)",
          borderRadius:"24px 24px 0 0",
          border:"1px solid rgba(255,255,255,0.1)",
          borderBottom:"none",
          boxShadow:"0 -16px 50px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"16px 16px 40px",
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width:36, height:4, background:"rgba(255,255,255,0.25)", borderRadius:2, margin:"0 auto 16px" }} />
        {title && <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
