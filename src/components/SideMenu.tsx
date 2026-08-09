import { useState, useRef } from "react";
import { C } from "../lib/constants";
import { AraLogo } from "./AraLogo";
import { supabase } from "../lib/supabase";
import { btn, iStyle } from "../lib/helpers";
import type { Language } from "../lib/i18n";

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSignOut: () => void;
  onSignIn: (email: string, password: string) => Promise<string>;
  onSignUp: (email: string, password: string) => Promise<string>;
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

type MenuView = "main" | "sobre" | "perfil" | "faq" | "configuracoes" | "auth";

const FAQ_ITEMS = [
  {
    q: "Como adicionar um lançamento?",
    a: "Vá na aba Lançamentos e toque em 'Novo Lançamento'. Preencha a descrição, valor, categoria e data.",
  },
  {
    q: "Como funciona o gasto recorrente?",
    a: "Ao criar um lançamento à vista, ative 'Gasto recorrente' para que ele seja gerado automaticamente por 24 meses.",
  },
  {
    q: "Como funciona o fechamento do cartão?",
    a: "Cadastre o dia de fechamento no cartão. Compras feitas a partir desse dia entram na fatura do mês seguinte.",
  },
  {
    q: "Meus dados são salvos na nuvem?",
    a: "Sim! Com o login ativo, seus dados são salvos automaticamente no Supabase e sincronizados entre dispositivos.",
  },
  {
    q: "Como adiantar parcelas?",
    a: "No Histórico, toque em uma compra parcelada e use o botão 'Adiantar parcelas' para antecipar pagamentos.",
  },
  {
    q: "Como marcar uma fatura como paga?",
    a: "Em Contas, toque no cartão para abrir o detalhe e use o botão 'Marcar fatura como paga'.",
  },
];

export function SideMenu({ isOpen, onClose, user, onSignOut, onSignIn, onSignUp, currentLanguage, onLanguageChange }: SideMenuProps) {
  const [view, setView] = useState<MenuView>("main");
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authWorking, setAuthWorking] = useState(false);
  const [name, setName]           = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [saving, setSaving]       = useState(false);
  const [savedMsg, setSavedMsg]   = useState("");
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile when opening
  const loadProfile = async () => {
    if (profileLoaded) return;
    const { data } = await supabase.from("profiles").select("name, avatar_url").eq("id", user.id).single();
    if (data) {
      setName(data.name || "");
      setAvatarUrl(data.avatar_url || "");
    }
    setProfileLoaded(true);
  };

  const saveProfile = async () => {
    setSaving(true);
    await supabase.from("profiles").update({ name, avatar_url: avatarUrl }).eq("id", user.id);
    setSaving(false);
    setSavedMsg("Salvo!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Convert to base64 for preview (Storage config needed for persistence)
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const menuItem = (icon: React.ReactNode, label: string, onClick: () => void, danger = false) => (
    <div onClick={onClick} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:12, cursor:"pointer", background:"transparent" }}>
      <div style={{ width:36, height:36, borderRadius:10, background:danger?"#7f1d1d33":C.card, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        {icon}
      </div>
      <span style={{ fontSize:15, fontWeight:600, color:danger?C.red:C.text }}>{label}</span>
      {!danger && <div style={{ marginLeft:"auto", color:C.sub, fontSize:18 }}>›</div>}
    </div>
  );

  const backBtn = (label: string) => (
    <div onClick={() => setView("main")} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20, cursor:"pointer" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      <span style={{ fontSize:16, fontWeight:700, color:C.text }}>{label}</span>
    </div>
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(3px)", WebkitBackdropFilter:"blur(3px)", zIndex:200, animation:"fadeIn 0.2s ease both" }}
      />

      {/* Side panel */}
      <div style={{ position:"fixed", top:0, right:0, bottom:0, width:"85%", maxWidth:340, background:"rgba(17,24,39,0.75)", backdropFilter:"blur(28px) saturate(180%)", WebkitBackdropFilter:"blur(28px) saturate(180%)", borderLeft:"1px solid rgba(255,255,255,0.1)", zIndex:201, display:"flex", flexDirection:"column", animation:"slideLeft 0.3s cubic-bezier(0.32,0.72,0,1) both", boxShadow:"-16px 0 50px rgba(0,0,0,0.5)" }}>
        <style>{`
          @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
          @keyframes slideLeft { from { transform:translateX(100%); } to { transform:translateX(0); } }
        `}</style>

        {/* Header */}
        <div style={{ padding:"52px 20px 20px", borderBottom:"1px solid "+C.border, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <AraLogo size={28} id="menu" />
            <span style={{ fontSize:16, fontWeight:800, color:C.text }}>Ara Finance</span>
          </div>
          <button onClick={onClose} style={{ background:C.card, border:"1px solid "+C.border, color:C.sub, borderRadius:10, width:32, height:32, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 12px" }}>

          {/* MAIN MENU */}
          {view === "main" && (
            <div>
              {/* User card */}
              <div style={{ background:C.card, borderRadius:14, padding:16, marginBottom:16, border:"1px solid "+C.border }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#7C3AED,#2563EB)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:18, fontWeight:700, color:"#fff" }}>
                    {user ? user?.email?.[0]?.toUpperCase() : "?"}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    {user ? (
                      <>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user?.email}</div>
                        <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>Conta ativa — dados na nuvem</div>
                      </>
                    ) : (
                      <>
                        <div style={{ fontSize:13, fontWeight:600, color:C.text }}>Visitante</div>
                        <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>Dados salvos neste dispositivo</div>
                      </>
                    )}
                  </div>
                </div>

                {/* Login / Register buttons when not logged in */}
                {!user && (
                  <div style={{ display:"flex", gap:8, marginTop:12 }}>
                    <button onClick={() => { setAuthView("login"); setView("auth"); setAuthError(""); }} style={{ flex:1, padding:"10px", borderRadius:10, border:"1px solid "+C.border, background:C.surface, color:C.text, cursor:"pointer", fontSize:13, fontWeight:600 }}>Entrar</button>
                    <button onClick={() => { setAuthView("register"); setView("auth"); setAuthError(""); }} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", background:"linear-gradient(135deg,#7C3AED,#2563EB)", color:"#fff", cursor:"pointer", fontSize:13, fontWeight:600 }}>Criar conta</button>
                  </div>
                )}
              </div>

              {menuItem(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
                "Perfil",
                () => { setView("perfil"); loadProfile(); }
              )}
              {menuItem(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
                "Configurações",
                () => setView("configuracoes")
              )}
              {menuItem(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                "FAQ",
                () => setView("faq")
              )}
              {menuItem(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
                "Sobre nós",
                () => setView("sobre")
              )}

              <div style={{ height:1, background:C.border, margin:"12px 4px" }} />

              {menuItem(
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
                "Sair",
                () => { onClose(); onSignOut(); },
                true
              )}
            </div>
          )}

          {/* PERFIL */}
          {view === "perfil" && (
            <div>
              {backBtn("Perfil")}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width:80, height:80, borderRadius:20, background:"linear-gradient(135deg,#7C3AED,#2563EB)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", marginBottom:8, overflow:"hidden", position:"relative" }}
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
                    : <span style={{ fontSize:28, fontWeight:700, color:"#fff" }}>{user?.email?.[0]?.toUpperCase() || "?"}</span>
                  }
                  <div style={{ position:"absolute", inset:0, background:"#00000033", display:"flex", alignItems:"center", justifyContent:"center", opacity:0 }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleAvatarUpload} />
                <div style={{ fontSize:12, color:C.sub }}>Toque para alterar a foto</div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Nome</div>
                  <input style={iStyle} placeholder="Seu nome" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <div style={{ fontSize:12, color:C.sub, marginBottom:6 }}>Email</div>
                  <div style={{ ...iStyle, color:C.sub, cursor:"not-allowed" }}>{user?.email}</div>
                </div>
                {savedMsg && <div style={{ fontSize:13, color:C.green, textAlign:"center", fontWeight:600 }}>{savedMsg}</div>}
                <button onClick={saveProfile} disabled={saving} style={btn("linear-gradient(135deg,#7C3AED,#2563EB)")}>
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          )}

          {/* FAQ */}
          {view === "faq" && (
            <div>
              {backBtn("FAQ")}
              <div style={{ fontSize:13, color:C.sub, marginBottom:16 }}>Perguntas frequentes sobre o Ara Finance.</div>
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} style={{ background:C.card, borderRadius:12, marginBottom:8, overflow:"hidden" }}>
                  <div onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 16px", cursor:"pointer" }}>
                    <span style={{ fontSize:13, fontWeight:600, color:C.text, flex:1, paddingRight:8 }}>{item.q}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform:openFaq===i?"rotate(180deg)":"rotate(0deg)", transition:"transform 0.2s", flexShrink:0 }}><polyline points="6 9 12 15 18 9"/></svg>
                  </div>
                  {openFaq === i && (
                    <div style={{ padding:"0 16px 14px", fontSize:13, color:C.sub, lineHeight:1.6, borderTop:"1px solid "+C.border }}>
                      <div style={{ paddingTop:10 }}>{item.a}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SOBRE NÓS */}
          {view === "sobre" && (
            <div>
              {backBtn("Sobre nós")}
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:24 }}>
                <AraLogo size={72} id="sobre" />
                <div style={{ fontSize:22, fontWeight:800, color:C.text, marginTop:12, marginBottom:4 }}>Ara Finance</div>
                <div style={{ fontSize:13, color:C.sub, textAlign:"center" }}>Controle com clareza. Viva melhor.</div>
              </div>
              <div style={{ background:C.card, borderRadius:14, overflow:"hidden", marginBottom:16 }}>
                {[
                  { label:"Versão", value:"v2.0.0" },
                  { label:"Início do projeto", value:"11 de Abril de 2026" },
                  { label:"Tecnologia", value:"React + TypeScript" },
                  { label:"Backend", value:"Supabase" },
                  { label:"Hospedagem", value:"Vercel" },
                ].map((item, i, arr) => (
                  <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", borderBottom:i<arr.length-1?"1px solid "+C.border:"none" }}>
                    <span style={{ fontSize:13, color:C.sub }}>{item.label}</span>
                    <span style={{ fontSize:13, color:C.text, fontWeight:600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:C.card, borderRadius:14, padding:16 }}>
                <div style={{ fontSize:13, color:C.sub, lineHeight:1.7, textAlign:"center" }}>
                  O Ara Finance nasceu da ideia de trazer clareza financeira para o dia a dia. O nome vem do Tupi-Guaraní — <span style={{ color:C.text, fontWeight:600 }}>Ara</span> significa <span style={{ color:C.text, fontWeight:600 }}>luz e clareza</span>.
                </div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, marginTop:14 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill={C.red} stroke="none"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                  <span style={{ fontSize:13, color:C.sub }}>Desenvolvido por <span style={{ color:C.text, fontWeight:600 }}>Claude e Luan</span></span>
                </div>
              </div>
            </div>
          )}

          {/* CONFIGURAÇÕES */}
          {view === "configuracoes" && (
            <div>
              {backBtn("Configurações")}
              <div style={{ background:C.card, borderRadius:14, overflow:"hidden" }}>
                <div style={{ padding:"14px 16px", borderBottom:"1px solid "+C.border }}>
                  <div style={{ fontSize:13, fontWeight:600, color:C.text, marginBottom:2 }}>Idioma</div>
                  <div style={{ fontSize:12, color:C.sub }}>Escolha o idioma do app</div>
                </div>
                <div style={{ padding:"14px 16px", display:"flex", gap:10 }}>
                  {(["pt","en"] as const).map(lang => (
                    <button
                      key={lang}
                      onClick={() => onLanguageChange(lang)}
                      style={{ flex:1, padding:"12px", borderRadius:12, border:"2px solid "+(currentLanguage===lang?C.blue:C.border), background:currentLanguage===lang?C.blue+"22":"transparent", color:currentLanguage===lang?C.blue:C.sub, cursor:"pointer", fontSize:14, fontWeight:600, display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}
                    >
                      <span style={{ fontSize:24 }}>{lang === "pt" ? "🇧🇷" : "🇺🇸"}</span>
                      <span>{lang === "pt" ? "Português" : "English"}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {/* AUTH */}
          {view === "auth" && (
            <div>
              {backBtn(authView === "login" ? "Entrar" : "Criar conta")}
              <div style={{ display:"flex", background:C.card, borderRadius:12, padding:4, marginBottom:20, border:"1px solid "+C.border }}>
                <button onClick={() => { setAuthView("login"); setAuthError(""); }} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:authView==="login"?C.surface:"transparent", color:authView==="login"?C.text:C.sub }}>Entrar</button>
                <button onClick={() => { setAuthView("register"); setAuthError(""); }} style={{ flex:1, padding:"10px", borderRadius:10, border:"none", cursor:"pointer", fontSize:13, fontWeight:600, background:authView==="register"?C.surface:"transparent", color:authView==="register"?C.text:C.sub }}>Criar conta</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <input style={iStyle} placeholder="Email" type="email" inputMode="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} />
                <input style={iStyle} placeholder="Senha" type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} onKeyDown={async e => { if (e.key === "Enter") { setAuthWorking(true); const err = authView === "login" ? await onSignIn(authEmail, authPassword) : await onSignUp(authEmail, authPassword); setAuthError(err); setAuthWorking(false); if (!err) { setView("main"); onClose(); } } }} />
                {authError && (
                  <div style={{ fontSize:13, color:authError.includes("Verifique")?C.green:C.red, background:authError.includes("Verifique")?"#14532d33":"#7f1d1d33", borderRadius:10, padding:"10px 14px", borderLeft:"3px solid "+(authError.includes("Verifique")?C.green:C.red) }}>
                    {authError}
                  </div>
                )}
                <button
                  onClick={async () => {
                    setAuthWorking(true);
                    const err = authView === "login" ? await onSignIn(authEmail, authPassword) : await onSignUp(authEmail, authPassword);
                    setAuthError(err);
                    setAuthWorking(false);
                    if (!err || err.includes("Verifique")) { setView("main"); if (!err) onClose(); }
                  }}
                  disabled={authWorking}
                  style={{ ...btn("linear-gradient(135deg,#7C3AED,#2563EB)"), opacity:authWorking?0.7:1 }}
                >
                  {authWorking ? "Aguarde..." : authView === "login" ? "Entrar" : "Criar conta"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
