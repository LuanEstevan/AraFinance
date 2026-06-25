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
      style={{ position:"fixed", inset:0, background:"#000000bb", zIndex:100, display:"flex", alignItems:"flex-end" }}
      onClick={onClose}
    >
      <div
        className="modal-sheet"
        style={{ background:C.surface, borderRadius:"20px 20px 0 0", width:"100%", maxHeight:"90vh", overflowY:"auto", padding:"16px 16px 40px" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width:36, height:4, background:C.muted, borderRadius:2, margin:"0 auto 16px" }} />
        {title && <div style={{ fontSize:18, fontWeight:700, color:C.text, marginBottom:16 }}>{title}</div>}
        {children}
      </div>
    </div>
  );
}
