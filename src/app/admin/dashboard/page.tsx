"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import { DatePicker, TimePicker } from "@/components/DateTimePickers";
import { ToastContainer, useToast } from "@/components/Toast";
import { BakersProvider, useBakers, type TeamMember } from "@/components/BakersContext";
import {
  Package, ClipboardList, LogOut, RefreshCw, Plus, X,
  Pencil, Trash2, ChevronLeft, ChevronRight, Check,
  MessageCircle, User, ShoppingBag, FileText, Download,
  Image as ImageIcon, AlertTriangle, Search, Clock,
  CheckCircle2, Truck, Ban, Info, StickyNote, History,
  Edit3, Save, Calendar, BarChart3
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type Product = { id: string; name: string; description: string; category: string; imageUrl: string; price: number | null; availabilityStatus?: "AVAILABLE" | "OUT_OF_STOCK" | "HIDDEN"; };
type CakeDetail = { filling: string; masa: string; colors: string; message: string; size: string; };
type StatusLogEntry = { status: string; by: string; at: string; };
type Order = {
  id: string; name: string; phone: string; email?: string;
  eventType: string; eventDate: string; deliveryTime?: string; guestCount: string;
  selectedItems: string[]; cakeDetails?: Record<string, CakeDetail>;
  notes?: string; internalNote?: string; imageUrls: string[];
  status: string; assignedTo?: string | null;
  agreedPrice?: number | null;
  depositAmount?: number | null;
  paymentStatus?: string;
  deliveryMethod?: string | null;
  statusLog?: StatusLogEntry[];
  createdAt: string;
};

// ── Constants ─────────────────────────────────────────────────
const STATUS: Record<string, { label: string; color: string; bg: string; dot: string; border: string; emoji: string }> = {
  PENDING:   { label: "Nuevo pedido",    color: "#92400e", bg: "#fef3c7", dot: "#f59e0b", border: "#fcd34d", emoji: "🆕" },
  CONFIRMED: { label: "Activo",          color: "#065f46", bg: "#d1fae5", dot: "#10b981", border: "#6ee7b7", emoji: "✅" },
  NEEDS_INFO:{ label: "Más información", color: "#5b21b6", bg: "#f3e8ff", dot: "#a855f7", border: "#d8b4fe", emoji: "💬" },
  COMPLETED: { label: "Listo",           color: "#1e40af", bg: "#dbeafe", dot: "#3b82f6", border: "#93c5fd", emoji: "📦" },
  DELIVERED: { label: "Entregado",       color: "#065f46", bg: "#d1fae5", dot: "#059669", border: "#6ee7b7", emoji: "🎉" },
  REJECTED:  { label: "Rechazado",       color: "#991b1b", bg: "#fee2e2", dot: "#ef4444", border: "#fca5a5", emoji: "❌" },
  CANCELLED: { label: "Cancelado",       color: "#374151", bg: "#f3f4f6", dot: "#9ca3af", border: "#d1d5db", emoji: "🚫" },
};

const ORDER_TABS = [
  { id: "PENDING",   label: "Nuevos",     statuses: ["PENDING"],               dot: "#f59e0b" },
  { id: "ACTIVE",    label: "Activos",    statuses: ["CONFIRMED","NEEDS_INFO"], dot: "#10b981" },
  { id: "COMPLETED", label: "Listos",     statuses: ["COMPLETED"],              dot: "#3b82f6" },
  { id: "DELIVERED", label: "Entregados", statuses: ["DELIVERED"],              dot: "#059669" },
  { id: "CANCELLED", label: "Cancelados", statuses: ["CANCELLED","REJECTED"],   dot: "#9ca3af" },
] as const;
type OrderTabId = typeof ORDER_TABS[number]["id"];

const EVENT_TYPES = ["Cumpleaños","Boda / Compromiso","Baby shower","Corporativo","Graduación","Quinceañera","Otro"];
// La lista de reposteras viene de /api/bakers (vía BakersContext) — los nombres
// reales de usuarias activas con rol BAKER u OWNER. Si no hay ninguna creada
// todavía, el contexto cae a un fallback hardcoded.
const CATEGORIES = [
  {id:"cakes",label:"Pasteles"},{id:"desserts",label:"Postres"},
  {id:"events",label:"Mesa de dulces"},{id:"picaderas",label:"Picaderas"},
  {id:"brunch",label:"Brunch"},{id:"drinks",label:"Bebidas"},
];
const catLabel = (id: string) => CATEGORIES.find(c=>c.id===id)?.label ?? id;
const empty = { name:"", description:"", category:"cakes", imageUrl:"", price:"" };
const PINK = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

// ── Helpers ───────────────────────────────────────────────────
function shortId(id: string) { return id.slice(-6).toUpperCase(); }
function daysUntil(dateStr: string) {
  const today = new Date(); today.setHours(0,0,0,0);
  return Math.ceil((new Date(dateStr+"T00:00:00").getTime()-today.getTime())/86400000);
}
function isUrgent(o: Order) {
  const d = daysUntil(o.eventDate);
  return d>=0 && d<=2 && !["DELIVERED","CANCELLED","REJECTED"].includes(o.status);
}
function priorityScore(o: Order) {
  if (isUrgent(o)) return 0;
  const order = ["PENDING","CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED","CANCELLED","REJECTED"];
  return order.indexOf(o.status)+1;
}
function matchesSearch(o: Order, q: string) {
  if (!q) return true;
  const lq = q.toLowerCase();
  return o.name.toLowerCase().includes(lq)||o.phone.includes(lq)||shortId(o.id).toLowerCase().includes(lq);
}
function fmt12h(time?: string) {
  if (!time) return "No especificada";
  const [h,m] = time.split(":").map(Number);
  return `${h%12||12}:${m.toString().padStart(2,"0")} ${h>=12?"PM":"AM"}`;
}
function fmtDate(d?: string) {
  if (!d) return "No especificada";
  return new Date(d+"T00:00:00").toLocaleDateString("es-DO",{day:"numeric",month:"long",year:"numeric"});
}
function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-DO",{day:"2-digit",month:"short"})+" · "+d.toLocaleTimeString("es-DO",{hour:"2-digit",minute:"2-digit"});
}

// ── Confirmation Modal wrapper ─────────────────────────────────
function useConfirm() {
  const [state, setState] = useState<{
    open:boolean; title:string; message:string; confirmText:string;
    isDestructive:boolean; icon:"delete"|"save"|"warning"|"confirm";
    resolve:(v:boolean)=>void;
  }>({ open:false,title:"",message:"",confirmText:"Confirmar",isDestructive:false,icon:"confirm",resolve:()=>{} });

  const confirm = (opts:{ title:string; message:string; confirmText?:string; isDestructive?:boolean; icon?:"delete"|"save"|"warning"|"confirm" }) =>
    new Promise<boolean>(resolve => setState({ open:true, title:opts.title, message:opts.message,
      confirmText:opts.confirmText??"Confirmar", isDestructive:opts.isDestructive??false,
      icon:opts.icon??"confirm", resolve }));

  const modal = (
    <ConfirmationModal
      isOpen={state.open}
      title={state.title}
      message={state.message}
      confirmText={state.confirmText}
      cancelText="Cancelar"
      isDestructive={state.isDestructive}
      icon={state.icon}
      onConfirm={()=>{ state.resolve(true); setState(s=>({...s,open:false})); }}
      onCancel={()=>{ state.resolve(false); setState(s=>({...s,open:false})); }}
    />
  );
  return { confirm, modal };
}

// ── Baker popup ───────────────────────────────────────────────
function BakerPopup({ onSelect,onClose }:{ onSelect:(b:string)=>void; onClose:()=>void }) {
  const { bakers } = useBakers();
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown",fn);
    return ()=>document.removeEventListener("keydown",fn);
  },[onClose]);
  return(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.4)"}} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6" onClick={e=>e.stopPropagation()}>
        <h3 className="font-display text-xl mb-1">Asignar repostera</h3>
        <p className="text-sm text-gray-500 mb-5">¿Quién se encarga de este pedido?</p>
        <div className="space-y-2.5">
          {bakers.map(b=>(
            <button key={b} onClick={()=>onSelect(b)}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-2 border-[#f0e8e0] hover:border-[#f07097] hover:bg-[#fef7f9] transition text-left group">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0" style={{background:PINK}}>{b[0]}</div>
              <span className="font-semibold text-gray-700 group-hover:text-[#f07097] transition">{b}</span>
            </button>
          ))}
          <button onClick={()=>onSelect("")} className="w-full px-4 py-3 rounded-2xl border border-dashed border-[#f0e8e0] text-sm text-gray-400 hover:text-gray-600 hover:border-gray-300 transition">
            Sin asignar por ahora
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Lightbox ──────────────────────────────────────────────────
function ImgLightbox({ urls,startIdx,onClose }:{ urls:string[]; startIdx:number; onClose:()=>void }) {
  const [idx,setIdx] = useState(startIdx);
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{
      if(e.key==="Escape") onClose();
      if(e.key==="ArrowLeft") setIdx(i=>(i-1+urls.length)%urls.length);
      if(e.key==="ArrowRight") setIdx(i=>(i+1)%urls.length);
    };
    document.addEventListener("keydown",fn);
    document.body.style.overflow="hidden";
    return()=>{ document.removeEventListener("keydown",fn); document.body.style.overflow=""; };
  },[onClose,urls.length]);
  return(
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center" style={{background:"rgba(0,0,0,0.94)"}} onClick={onClose}>
      <div className="relative max-w-4xl w-full mx-4" onClick={e=>e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={urls[idx]} alt="" className="max-h-[78vh] max-w-full mx-auto rounded-2xl object-contain shadow-2xl"/>
        {urls.length>1&&(<>
          <button onClick={()=>setIdx(i=>(i-1+urls.length)%urls.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/30 transition"><ChevronLeft size={20}/></button>
          <button onClick={()=>setIdx(i=>(i+1)%urls.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center hover:bg-white/30 transition"><ChevronRight size={20}/></button>
        </>)}
      </div>
      <div className="flex items-center gap-4 mt-5">
        <span className="text-white/60 text-sm">{idx+1} / {urls.length}</span>
        <a href={urls[idx]} download target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm hover:bg-white/25 transition"><Download size={14}/> Descargar</a>
        <button onClick={onClose} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/15 text-white text-sm hover:bg-white/25 transition"><X size={14}/> Cerrar</button>
      </div>
      {urls.length>1&&<div className="flex gap-2 mt-3">{urls.map((_,i)=><button key={i} onClick={()=>setIdx(i)} className={`h-1.5 rounded-full transition-all ${i===idx?"bg-white w-6":"bg-white/40 w-1.5"}`}/>)}</div>}
    </div>
  );
}

// ── Product Modal ─────────────────────────────────────────────
function ProductModal({ product,onClose,onSave,onDelete }:{ product:Product|null; onClose:()=>void; onSave:()=>void; onDelete?:(id:string)=>Promise<void>; }) {
  const isEdit = !!product;
  const [form,setForm] = useState({
    name:product?.name??"", description:product?.description??"",
    category:product?.category??"cakes", imageUrl:product?.imageUrl??"",
    price:product?.price?.toString()??"",
    availabilityStatus:(product?.availabilityStatus??"AVAILABLE") as "AVAILABLE"|"OUT_OF_STOCK"|"HIDDEN",
  });
  const [imgPreview,setImgPreview] = useState(product?.imageUrl??"");
  const [uploading,setUploading] = useState(false);
  const [uploadErr,setUploadErr] = useState("");
  const [loading,setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { confirm, modal } = useConfirm();

  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{ document.body.style.overflow=""; }; },[]);

  async function flattenToJpeg(file:File):Promise<File> {
    return new Promise(resolve=>{
      const img=new window.Image(); const ou=URL.createObjectURL(file);
      img.onload=()=>{
        const c=document.createElement("canvas"); c.width=img.naturalWidth; c.height=img.naturalHeight;
        const ctx=c.getContext("2d")!; ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height); ctx.drawImage(img,0,0); URL.revokeObjectURL(ou);
        c.toBlob(b=>{ if(!b){resolve(file);return;} resolve(new File([b],file.name.replace(/\.\w+$/,".jpg"),{type:"image/jpeg"})); },"image/jpeg",0.92);
      };
      img.onerror=()=>{ URL.revokeObjectURL(ou); resolve(file); }; img.src=ou;
    });
  }
  async function handleImg(e:React.ChangeEvent<HTMLInputElement>) {
    const raw=e.target.files?.[0]; if(!raw)return;
    setUploadErr(""); setImgPreview(URL.createObjectURL(raw)); setUploading(true);
    const file=await flattenToJpeg(raw); const fd=new FormData(); fd.append("file",file);
    const res=await fetch("/api/upload",{method:"POST",body:fd}); setUploading(false);
    if(!res.ok){const err=await res.json().catch(()=>({error:"Error"}));setUploadErr(err.error);setImgPreview("");setForm(f=>({...f,imageUrl:""}));return;}
    const {url}=await res.json(); setForm(f=>({...f,imageUrl:url}));
  }
  async function submit(e:React.FormEvent) {
    e.preventDefault(); if(!form.imageUrl){alert("Selecciona una imagen.");return;}
    const ok = await confirm({ title:"Guardar cambios", message:`¿Confirmar ${isEdit?"los cambios en":"el nuevo producto"} "${form.name}"?`, confirmText:"Guardar", icon:"save" });
    if (!ok) return;
    setLoading(true);
    const body={name:form.name,description:form.description,category:form.category,imageUrl:form.imageUrl,price:form.price===""?null:Number(form.price),availabilityStatus:form.availabilityStatus};
    const res=await fetch(isEdit?`/api/products/${product!.id}`:"/api/products",{method:isEdit?"PUT":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    setLoading(false); if(!res.ok){alert("Error: "+await res.text());return;} onSave(); onClose();
  }
  async function handleDelete() {
    const ok = await confirm({ title:"Eliminar producto", message:`¿Eliminar "${product?.name}"? Esta acción no se puede deshacer.`, confirmText:"Eliminar", isDestructive:true, icon:"delete" });
    if (!ok || !product || !onDelete) return;
    await onDelete(product.id); onClose();
  }

  return(
    <>
      {modal}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.5)"}} onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-[#f0e8e0] rounded-t-3xl z-10">
            <div>
              <h3 className="font-display text-xl">{isEdit?"Editar producto":"Nuevo producto"}</h3>
              {isEdit&&<p className="text-xs text-gray-400 mt-0.5">Item ID: #{shortId(product!.id)}</p>}
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"><X size={16}/></button>
          </div>
          <form onSubmit={submit} className="p-6 space-y-4">
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Nombre</label>
              <input required placeholder="Nombre" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition"/></div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Descripción</label>
              <textarea required placeholder="Descripción" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#f07097] transition"/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Categoría</label>
                <select value={form.category} onChange={e=>setForm({...form,category:e.target.value})} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition">
                  {CATEGORIES.map(c=><option key={c.id} value={c.id}>{c.label}</option>)}</select></div>
              <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Precio</label>
                <input type="number" placeholder="RD$ (opcional)" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition"/></div>
            </div>
            {/* Availability toggle */}
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Disponibilidad</label>
              <div className="grid grid-cols-3 gap-1.5">
                {([["AVAILABLE","Disponible","#10b981"],["OUT_OF_STOCK","Sin stock","#f59e0b"],["HIDDEN","Oculto","#9ca3af"]] as const).map(([val,label,color])=>(
                  <button key={val} type="button" onClick={()=>setForm({...form,availabilityStatus:val})}
                    className={`px-2 py-2 rounded-xl text-xs font-semibold border-2 transition ${form.availabilityStatus===val?"border-transparent text-white":"border-[#ede8e0] text-gray-600 hover:border-gray-300"}`}
                    style={form.availabilityStatus===val?{background:color}:{}}>{label}</button>
                ))}
              </div>
            </div>
            <div><label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">Imagen</label>
              {imgPreview?(
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border border-[#ede8e0]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgPreview} alt="" className="w-full h-full object-cover"/>
                  <button type="button" onClick={()=>{setImgPreview("");setForm(f=>({...f,imageUrl:""}));}} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center"><X size={12}/></button>
                </div>
              ):(
                <button type="button" onClick={()=>fileRef.current?.click()} className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[#ede8e0] text-gray-400 hover:border-[#f07097]/50 hover:text-[#f07097] transition text-sm w-full justify-center">
                  <Plus size={15}/> {uploading?"Subiendo…":"Agregar imagen"}</button>
              )}
              {uploadErr&&<p className="text-red-500 text-xs mt-1">{uploadErr}</p>}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg}/>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" disabled={loading||uploading} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50" style={{background:PINK}}>
                {loading?"Guardando…":isEdit?"Guardar cambios":"Agregar producto"}</button>
              {isEdit&&onDelete&&(
                <button type="button" onClick={handleDelete} className="px-4 py-2.5 rounded-xl text-red-400 border-2 border-red-100 hover:bg-red-50 transition flex items-center gap-1 text-sm">
                  <Trash2 size={14}/></button>
              )}
              <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[#ede8e0] text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

// ── Order Edit Modal ──────────────────────────────────────────
function OrderEditModal({ order,onClose,onSave }:{ order:Order; onClose:()=>void; onSave:(data:Partial<Order>)=>Promise<void>; }) {
  const [form,setForm] = useState({
    name:order.name, phone:order.phone, email:order.email??"",
    eventType:order.eventType, eventDate:order.eventDate,
    deliveryTime:order.deliveryTime??"", guestCount:order.guestCount,
    notes:order.notes??"", status:order.status,
    deliveryMethod:order.deliveryMethod??"",
  });
  const [saving,setSaving] = useState(false);
  const { confirm,modal } = useConfirm();
  const MANUAL_STATUSES = ["CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED","REJECTED","CANCELLED"];
  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{ document.body.style.overflow=""; }; },[]);

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    const ok = await confirm({ title:"Guardar cambios", message:"¿Confirmar los cambios en el pedido?", confirmText:"Guardar", icon:"save" });
    if (!ok) return;
    setSaving(true);
    await onSave({ ...form, email:form.email||undefined, deliveryTime:form.deliveryTime||undefined, notes:form.notes||undefined, deliveryMethod:form.deliveryMethod||undefined, changedBy:"Admin (edición)" } as any);
    setSaving(false); onClose();
  }

  const days = daysUntil(form.eventDate);
  const dateUrgent = days >= 0 && days <= 3;
  const inputCls = "w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition";

  return(
    <>
      {modal}
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.55)"}} onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
          <div className="sticky top-0 bg-white flex items-center justify-between px-6 py-4 border-b border-[#f0e8e0] rounded-t-3xl z-10">
            <div><h3 className="font-display text-xl">Editar pedido</h3><p className="text-xs text-gray-400">#{shortId(order.id)}</p></div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"><X size={16}/></button>
          </div>
          <form onSubmit={submit} className="p-6 space-y-5">

            {/* Fecha */}
            <div className={`rounded-2xl p-4 border-2 ${dateUrgent?"border-red-300 bg-red-50":"border-[#f0e8e0] bg-[#faf8f5]"}`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">Fecha y hora</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Fecha *</label>
                  <DatePicker value={form.eventDate} onChange={d=>setForm({...form,eventDate:d})} placeholder="Selecciona fecha"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1.5 block">Hora de entrega</label>
                  <TimePicker value={form.deliveryTime} onChange={t=>setForm({...form,deliveryTime:t})} placeholder="Selecciona hora"/>
                </div>
              </div>
              {form.eventDate&&(
                <div className={`mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${days<0?"bg-gray-100 text-gray-500":days===0?"bg-red-100 text-red-700":days<=2?"bg-orange-100 text-orange-700":days<=7?"bg-yellow-100 text-yellow-700":"bg-green-100 text-green-700"}`}>
                  <Clock size={11}/> {days<0?`Hace ${Math.abs(days)}d`:days===0?"¡Hoy!":days===1?"Mañana":`En ${days} días`}
                </div>
              )}
            </div>

            {/* Método de entrega */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Método de entrega</p>
              <div className="grid grid-cols-2 gap-2">
                {[{id:"pickup",label:"🏠 Recogida"},{id:"delivery",label:"🚗 Delivery"}].map(opt=>(
                  <button key={opt.id} type="button" onClick={()=>setForm({...form,deliveryMethod:form.deliveryMethod===opt.id?"":opt.id})}
                    className={`px-3 py-2.5 rounded-xl text-sm border-2 font-medium transition ${form.deliveryMethod===opt.id?"border-transparent text-white":"border-[#f0e8e0] text-gray-600 hover:border-gray-300"}`}
                    style={form.deliveryMethod===opt.id?{background:PINK}:{}}>{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Estado */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Estado del pedido</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MANUAL_STATUSES.map(s=>{
                  const cfg=STATUS[s]; const active=form.status===s;
                  return(
                    <button key={s} type="button" onClick={()=>setForm({...form,status:s})}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition ${active?"border-transparent text-white":"border-[#f0e8e0] hover:border-gray-300"}`}
                      style={active?{background:`linear-gradient(135deg,${cfg.dot},${cfg.color})`}:{color:cfg.color,background:cfg.bg}}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background:active?"white":cfg.dot}}/>{cfg.label}
                    </button>
                  );
                })}
              </div>
              {form.status!==order.status&&(
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={11}/> Cambia de <strong>{STATUS[order.status]?.label}</strong> a <strong>{STATUS[form.status]?.label}</strong>
                </p>
              )}
            </div>

            {/* Cliente */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Datos del cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Nombre *</label>
                  <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className={inputCls}/></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Teléfono *</label>
                  <input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className={inputCls}/></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="(opcional)" className={inputCls}/></div>
              </div>
            </div>

            {/* Evento */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Detalles del evento</p>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-500 mb-1 block">Tipo</label>
                  <select value={form.eventType} onChange={e=>setForm({...form,eventType:e.target.value})} className={inputCls}>
                    {EVENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select></div>
                <div><label className="text-xs text-gray-500 mb-1 block">Personas *</label>
                  <input type="number" required value={form.guestCount} onChange={e=>setForm({...form,guestCount:e.target.value})} className={inputCls}/></div>
                <div className="col-span-2"><label className="text-xs text-gray-500 mb-1 block">Notas</label>
                  <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} className={inputCls+" resize-none"}/></div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5" style={{background:PINK}}>
                <Save size={14}/> {saving?"Guardando…":"Guardar cambios"}</button>
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl border border-[#ede8e0] text-sm text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}


function OrderModal({ order,onClose,onUpdate,onDelete,currentUser }:{
  order:Order; onClose:()=>void;
  onUpdate:(id:string,data:Partial<Order>)=>Promise<void>;
  onDelete:(id:string)=>Promise<void>;
  currentUser: CurrentUser | null;
}) {
  const { bakers, teamMembers } = useBakers();
  const isAssistant = currentUser?.role === "ASSISTANT";
  const [status,setStatus]         = useState(order.status);
  const [assigned,setAssigned]     = useState(order.assignedTo??"");
  const [internalNote,setNote]     = useState(order.internalNote??"");
  const [agreedPrice,setPrice]     = useState(order.agreedPrice?.toString()??"");
  const [depositAmount,setDeposit] = useState(order.depositAmount?.toString()??"");
  const [paymentStatus,setPayment] = useState(order.paymentStatus??"PENDING");
  const [priceEditing,setPriceEdit]= useState(false);
  const [noteEditing,setNoteEdit]= useState(false);
  const [saving,setSaving]       = useState(false);
  const [lightboxIdx,setLBIdx]   = useState<number|null>(null);
  const [showBaker,setShowBaker] = useState(false);
  const [pendingStatus,setPending]= useState<string|null>(null);
  const [showEdit,setShowEdit]   = useState(false);
  const [localOrder,setLocalOrder]= useState(order);
  const [photoUploading,setPhotoUploading] = useState(false);
  const photoFileRef = useRef<HTMLInputElement>(null);
  const { confirm,modal } = useConfirm();

  const imgs  = Array.isArray(localOrder.imageUrls) ? localOrder.imageUrls.filter(u=>typeof u==="string"&&u.startsWith("http")) : [];
  const items = Array.isArray(localOrder.selectedItems) ? localOrder.selectedItems : [];
  const cakeDet = (localOrder.cakeDetails&&typeof localOrder.cakeDetails==="object"?localOrder.cakeDetails:{}) as Record<string,CakeDetail>;
  const log = Array.isArray(localOrder.statusLog) ? localOrder.statusLog as StatusLogEntry[] : [];
  const st = STATUS[status]??STATUS.PENDING;
  const urgent = isUrgent(localOrder);
  const days = daysUntil(localOrder.eventDate);
  const isPending = status==="PENDING";
  const isActive = ["CONFIRMED","NEEDS_INFO"].includes(status);
  const isCompleted = status==="COMPLETED";

  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==="Escape"&&!showBaker&&lightboxIdx===null&&!showEdit) onClose(); };
    document.addEventListener("keydown",fn); document.body.style.overflow="hidden";
    return()=>{ document.removeEventListener("keydown",fn); document.body.style.overflow=""; };
  },[onClose,showBaker,lightboxIdx,showEdit]);

  const doUpdate = async (data:Partial<Order>) => {
    setSaving(true);
    await onUpdate(localOrder.id, data);
    setLocalOrder(prev=>({...prev,...data}));
    setSaving(false);
  };

  const handleAction = (newStatus:string) => {
    if (currentUser?.role === "BAKER") {
      // BAKER se auto-asigna — sin popup de selección
      handleBakerSelectDirect(currentUser.name, newStatus);
    } else {
      setPending(newStatus); setShowBaker(true);
    }
  };
  // Versión directa que no depende del estado pendingStatus
  const handleBakerSelectDirect = async (baker:string, newStatus:string) => {
    setStatus(newStatus); setAssigned(baker); setPending(null);
    await doUpdate({ status:newStatus, assignedTo:baker||null, changedBy:baker||"Admin" } as any);
  };
  const handleBakerSelect = async (baker:string) => {
    setShowBaker(false);
    const ns = pendingStatus??status;
    setStatus(ns); setAssigned(baker); setPending(null);
    await doUpdate({ status:ns, assignedTo:baker||null, changedBy:baker||"Admin" } as any);
  };
  const handleBakerBtn = async (baker:string) => {
    setAssigned(baker);
    await doUpdate({ assignedTo:baker||null });
  };
  const handleStatusBtn = async (newStatus:string, changedBy?:string) => {
    setStatus(newStatus);
    await doUpdate({ status:newStatus, changedBy:changedBy??assigned??"Admin" } as any);
  };
  // Variante con confirmación para botones "Marcar listo" / "Marcar entregado" del modal
  const handleMarkStatus = async (newStatus:string, changedBy?:string) => {
    const isReady = newStatus === "COMPLETED";
    const ok = await confirm({
      title: isReady ? "Marcar listo" : "Marcar entregado",
      message: isReady
        ? "¿Marcar este pedido como listo para entrega o recogida?"
        : "¿Marcar este pedido como entregado? Pasará al historial.",
      confirmText: "Confirmar",
      icon: "confirm",
    });
    if (!ok) return;
    await handleStatusBtn(newStatus, changedBy);
  };
  const handleSaveNote = async () => {
    await doUpdate({ internalNote });
    setNoteEdit(false);
  };
  const handleSavePrice = async () => {
    await doUpdate({
      agreedPrice: agreedPrice === "" ? null : Number(agreedPrice),
      depositAmount: depositAmount === "" ? null : Number(depositAmount),
    });
    setPriceEdit(false);
  };
  const handleSaveChanges = async () => {
    const ok = await confirm({ title:"Guardar cambios", message:"¿Guardar los cambios de estado y asignación?", confirmText:"Guardar", icon:"save" });
    if (!ok) return;
    await doUpdate({ status, assignedTo:assigned||null });
  };
  const handleDelete = async () => {
    const ok = await confirm({ title:"Eliminar pedido", message:`¿Eliminar el pedido de ${localOrder.name}? Esta acción no se puede deshacer.`, confirmText:"Eliminar", isDestructive:true, icon:"delete" });
    if (!ok) return;
    await onDelete(localOrder.id);
    onClose();
  };

  const uploadPhoto = async (file: File) => {
    setPhotoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/admin/orders/upload", { method: "POST", body: fd });
    setPhotoUploading(false);
    if (!res.ok) return;
    const { url } = await res.json().catch(() => ({}));
    if (!url) return;
    const newUrls = [...imgs, url];
    await doUpdate({ imageUrls: newUrls });
  };

  const removePhoto = async (idx: number) => {
    const ok = await confirm({ title:"Eliminar foto", message:"¿Eliminar esta imagen de referencia? No se puede deshacer.", confirmText:"Eliminar", isDestructive:true, icon:"delete" });
    if (!ok) return;
    const newUrls = imgs.filter((_, i) => i !== idx);
    await doUpdate({ imageUrls: newUrls });
  };

  // Mensaje de WhatsApp según estado del pedido
  const baker = assigned || "Kan M";
  const detalles = `*${localOrder.eventType}* el *${localOrder.eventDate}*${localOrder.deliveryTime?` a las ${fmt12h(localOrder.deliveryTime)}`:""}`;
  const buildWaMsg = () => {
    const intro = `Hola ${localOrder.name}! Te habla ${baker} de Kan M Repostería y Catering 🎂. Te escribo referente al pedido que solicitaste desde nuestra página: ${detalles}.`;
    if (status === "COMPLETED") return `${intro} ¿Nos puedes confirmar que toda la información está correcta?`;
    if (status === "NEEDS_INFO") return `${intro} Necesitaría más información para poder empezar a trabajar con su pedido, ¿tiene disponibilidad ahora?`;
    if (status === "REJECTED")  return `${intro} Por el momento no trabajamos con este producto.`;
    return `Hola ${localOrder.name} 👋, somos Kan M. Sobre tu cotización para ${detalles}: `;
  };
  const waMsg = encodeURIComponent(buildWaMsg());

  return(
    <>
      {modal}
      {lightboxIdx!==null&&<ImgLightbox urls={imgs} startIdx={lightboxIdx} onClose={()=>setLBIdx(null)}/>}
      {showBaker&&<BakerPopup onSelect={handleBakerSelect} onClose={()=>{setShowBaker(false);setPending(null);}}/>}
      {showEdit&&<OrderEditModal order={localOrder} onClose={()=>setShowEdit(false)} onSave={async data=>{await doUpdate(data);setLocalOrder(prev=>({...prev,...data}));}}/>}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.55)"}} onClick={onClose}>
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>

          {/* Header */}
          <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[#f0e8e0] rounded-t-3xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full" style={{color:st.color,background:st.bg,border:`2px dashed ${st.border}`}}>
                <span className="w-1.5 h-1.5 rounded-full" style={{background:st.dot}}/>{st.label}
              </span>
              {urgent&&<span className="inline-flex items-center gap-1 bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full"><AlertTriangle size={10}/> {days===0?"¡Hoy!":`${days}d`}</span>}
              <span className="text-xs text-gray-400">#{shortId(localOrder.id)}</span>
            </div>
            <div className="flex items-center gap-2">
              {!isPending&&!isAssistant&&(
                <button onClick={()=>setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ede8e0] text-xs font-medium text-gray-600 hover:bg-[#faf8f5] hover:border-[#f07097] transition">
                  <Edit3 size={13}/> Editar
                </button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"><X size={16}/></button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Client info */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-xl shrink-0 font-semibold" style={{background:PINK}}>
                {localOrder.name[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl leading-tight">{localOrder.name}</h2>
                <div className="flex flex-wrap gap-3 mt-1">
                  <a href={`tel:${localOrder.phone}`} className="text-sm text-gray-500 hover:text-[#f07097] transition">📱 {localOrder.phone}</a>
                  {localOrder.email&&<a href={`mailto:${localOrder.email}`} className="text-sm text-gray-500 hover:text-[#f07097] transition truncate">📧 {localOrder.email}</a>}
                </div>
                {assigned&&<p className="text-xs text-[#f07097] mt-1.5 flex items-center gap-1 font-medium"><User size={11}/> {assigned}</p>}
              </div>
            </div>

            {/* Event grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                {emoji:"🎉",label:"Tipo de evento",value:localOrder.eventType},
                {emoji:"📅",label:"Fecha",value:fmtDate(localOrder.eventDate)},
                {emoji:"⏰",label:"Hora de entrega",value:fmt12h(localOrder.deliveryTime)},
                {emoji:"👥",label:"Personas",value:localOrder.guestCount},
              ].map(({emoji,label,value})=>(
                <div key={label} className="bg-[#faf8f5] rounded-2xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <p className="font-semibold text-sm text-gray-800">{emoji} {value}</p>
                </div>
              ))}
              {localOrder.deliveryMethod && (
                <div className="col-span-2 bg-[#faf8f5] rounded-2xl p-3.5">
                  <p className="text-xs text-gray-400 mb-1">Método de entrega</p>
                  <p className="font-semibold text-sm text-gray-800">
                    {localOrder.deliveryMethod === "pickup" ? "🏠 Recogida en tienda" : "🚗 Delivery / Envío"}
                  </p>
                </div>
              )}
            </div>

            {/* Products */}
            {items.length>0&&(
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><ShoppingBag size={11}/> Productos</p>
                <div className="space-y-2">
                  {items.map(item=>{
                    const cd=cakeDet[item];
                    return(
                      <div key={item} className={`rounded-xl border p-3 ${cd?"border-[#f07097]/20 bg-[#fef7f9]":"border-[#f0e8e0] bg-[#faf8f5]"}`}>
                        <p className="text-sm font-semibold text-gray-800">🎂 {item}</p>
                        {cd&&(
                          <div className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-gray-600">
                            <p><span className="font-medium text-gray-700">Masa:</span> {cd.masa}</p>
                            <p><span className="font-medium text-gray-700">Relleno:</span> {cd.filling}</p>
                            <p><span className="font-medium text-gray-700">Tamaño:</span> {cd.size}</p>
                            {cd.colors&&<p><span className="font-medium text-gray-700">Colores:</span> {cd.colors}</p>}
                            {cd.message&&<p className="col-span-2"><span className="font-medium text-gray-700">Mensaje:</span> &quot;{cd.message}&quot;</p>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notes */}
            {localOrder.notes&&(
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><FileText size={11}/> Notas del cliente</p>
                <div className="bg-[#faf8f5] rounded-2xl p-4 text-sm text-gray-600 italic leading-relaxed">&quot;{localOrder.notes}&quot;</div>
              </div>
            )}

            {/* ── Financiero ── (oculto en pedidos PENDING) */}
            {!isPending&&(
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                <span>💰</span> Precio y pago
              </p>
              <div className="space-y-3">
                {/* Agreed price */}
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1 block">Precio acordado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">RD$</span>
                      {priceEditing && !isAssistant ? (
                        <input type="number" min={0} step={50} value={agreedPrice} onChange={e=>setPrice(e.target.value)}
                          autoFocus placeholder="0"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f07097]/30 bg-[#fef7f9] text-sm focus:outline-none focus:border-[#f07097] transition"/>
                      ) : !isAssistant ? (
                        <button onClick={()=>setPriceEdit(true)}
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ede8e0] bg-[#faf8f5] text-sm text-left hover:border-[#f07097]/40 transition">
                          <span className={agreedPrice?"text-gray-800 font-semibold":"text-gray-400"}>{agreedPrice||"Sin precio"}</span>
                        </button>
                      ) : (
                        <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ede8e0] bg-[#faf8f5] text-sm">
                          <span className={agreedPrice?"text-gray-800 font-semibold":"text-gray-400"}>{agreedPrice||"Sin precio"}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 mb-1 block">Depositado</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">RD$</span>
                      {isAssistant ? (
                        <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ede8e0] bg-[#faf8f5] text-sm">
                          <span className={depositAmount?"text-gray-800 font-semibold":"text-gray-400"}>{depositAmount||"0"}</span>
                        </div>
                      ) : (
                        <input type="number" min={0} step={50} value={depositAmount} onChange={e=>setDeposit(e.target.value)}
                          placeholder="0"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#ede8e0] bg-[#faf8f5] text-sm focus:outline-none focus:border-[#f07097] transition"/>
                      )}
                    </div>
                  </div>
                </div>
                {/* Payment status */}
                <div>
                  <label className="text-xs text-gray-400 mb-1.5 block">Estado de pago</label>
                  <div className="flex gap-2">
                    {[
                      {id:"PENDING",label:"Pendiente",color:"#92400e",bg:"#fef3c7"},
                      {id:"PARTIAL",label:"Anticipación recibida",color:"#1e40af",bg:"#dbeafe"},
                      {id:"PAID",   label:"Pagado",color:"#065f46",bg:"#d1fae5"},
                    ].map(ps=>(
                      <button key={ps.id} type="button"
                        onClick={isAssistant?undefined:async()=>{setPayment(ps.id);await doUpdate({paymentStatus:ps.id});}}
                        disabled={isAssistant}
                        className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition ${paymentStatus===ps.id?"border-transparent":"border-[#f0e8e0]"} ${!isAssistant?"hover:border-gray-300":""} disabled:cursor-default`}
                        style={paymentStatus===ps.id?{color:ps.color,background:ps.bg,borderColor:ps.color+"40"}:{color:ps.color,background:ps.bg+"80"}}>
                        {ps.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Save price+deposit button */}
                {priceEditing&&(
                  <div className="flex gap-2">
                    <button type="button" onClick={handleSavePrice} className="px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition" style={{background:"#059669"}}>Guardar precio</button>
                    <button type="button" onClick={()=>{setPriceEdit(false);setPrice(localOrder.agreedPrice?.toString()??"");}} className="px-3 py-2 rounded-xl border border-[#ede8e0] text-xs text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Internal note (oculto en pedidos PENDING) */}
            {!isPending&&(
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><StickyNote size={11}/> Nota interna</p>
                {!noteEditing&&!isAssistant&&<button onClick={()=>setNoteEdit(true)} className="text-xs text-[#f07097] hover:underline flex items-center gap-1"><Edit3 size={11}/>{internalNote?"Editar":"Agregar"}</button>}
              </div>
              {noteEditing?(
                <div className="space-y-2">
                  <textarea value={internalNote} onChange={e=>setNote(e.target.value)} rows={3} placeholder="Solo visible para las reposteras…"
                    className="w-full rounded-xl border border-[#f07097]/30 bg-amber-50 px-4 py-3 text-sm resize-none focus:outline-none focus:border-[#f07097] transition"/>
                  <div className="flex gap-2">
                    <button onClick={handleSaveNote} className="px-4 py-1.5 rounded-lg text-white text-xs font-semibold hover:opacity-90 transition" style={{background:PINK}}>Guardar nota</button>
                    <button onClick={()=>{setNoteEdit(false);setNote(localOrder.internalNote??"");}} className="px-4 py-1.5 rounded-lg border border-[#ede8e0] text-xs text-gray-500 hover:bg-gray-50 transition">Cancelar</button>
                  </div>
                </div>
              ):internalNote?(
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900 leading-relaxed">{internalNote}</div>
              ):(!isAssistant&&(
                <button onClick={()=>setNoteEdit(true)} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-[#ede8e0] text-xs text-gray-400 hover:text-[#f07097] hover:border-[#f07097]/40 transition">
                  <Plus size={13}/> Agregar nota interna
                </button>
              ))}
            </div>
            )}

            {/* Photos */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <ImageIcon size={11}/> Fotos de referencia
                {imgs.length>0&&<span className="font-normal normal-case tracking-normal">({imgs.length})</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {imgs.map((url,i)=>(
                  <div key={i} className="relative group/photo">
                    <button onClick={()=>setLBIdx(i)} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#f0e8e0] hover:border-[#f07097] transition cursor-zoom-in flex-shrink-0 block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover transition-transform duration-200 group-hover/photo:scale-105" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                    </button>
                    {currentUser?.role!=="ASSISTANT"&&(
                      <button onClick={()=>removePhoto(i)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full items-center justify-center hidden group-hover/photo:flex hover:bg-red-600 transition z-10">
                        <X size={10}/>
                      </button>
                    )}
                  </div>
                ))}
                {currentUser?.role!=="ASSISTANT"&&(
                  <button onClick={()=>photoFileRef.current?.click()} disabled={photoUploading}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-[#ede8e0] flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-[#f07097] hover:text-[#f07097] transition disabled:opacity-50 shrink-0">
                    {photoUploading?<span className="text-[9px] text-center px-1 leading-tight">Subiendo…</span>:<><Plus size={18}/><span className="text-[10px]">Agregar</span></>}
                  </button>
                )}
                {imgs.length===0&&currentUser?.role==="ASSISTANT"&&(
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#faf8f5] border border-dashed border-[#e8ddd3] text-xs text-gray-400">
                    <ImageIcon size={14}/> Sin imágenes de referencia
                  </div>
                )}
                <input ref={photoFileRef} type="file" accept="image/*" className="hidden"
                  onChange={e=>{const f=e.target.files?.[0];if(f)uploadPhoto(f);e.target.value="";}}/>
              </div>
            </div>

            {/* Status log */}
            {log.length>0&&(
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5"><History size={11}/> Historial del pedido</p>
                <div className="space-y-2">
                  {log.map((entry,i)=>{
                    const cfg = STATUS[entry.status]??STATUS.PENDING;
                    return(
                      <div key={i} className="flex items-center gap-3 text-xs">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{background:cfg.dot}}/>
                        <span className="font-semibold" style={{color:cfg.color}}>{cfg.label}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-gray-500">{entry.by}</span>
                        <span className="text-gray-300">·</span>
                        <span className="text-gray-400 ml-auto">{fmtDateTime(entry.at)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Admin controls */}
            <div className="border-t border-[#f0e8e0] pt-5 space-y-4">

              {/* PENDING → Accept / More info / Cancel — solo OWNER y BAKER */}
              {isPending&&!isAssistant&&(
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Acción sobre el pedido</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={()=>handleAction("CONFIRMED")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition" style={{background:"#bbf7d0",color:"#065f46"}}>
                      <CheckCircle2 size={15}/> Aceptar</button>
                    <button onClick={()=>handleAction("NEEDS_INFO")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition" style={{background:"#e9d5ff",color:"#5b21b6"}}>
                      <Info size={15}/> Más información</button>
                    <button onClick={()=>handleAction("REJECTED")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition" style={{background:"#fecaca",color:"#991b1b"}}>
                      <Ban size={15}/> Rechazar</button>
                  </div>
                </div>
              )}

              {/* ACTIVE → Mark ready — solo OWNER y BAKER */}
              {isActive&&!isAssistant&&(
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-800">¿El pedido está listo?</p>
                    <p className="text-xs text-blue-600 mt-0.5">Marca como listo cuando esté preparado para entrega o recogida.</p>
                  </div>
                  <button onClick={()=>handleMarkStatus("COMPLETED",assigned)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition shrink-0" style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)"}}>
                    <CheckCircle2 size={15}/> Marcar listo</button>
                </div>
              )}

              {/* COMPLETED → Mark delivered — solo OWNER y BAKER */}
              {isCompleted&&!isAssistant&&(
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-green-800">¿El pedido fue entregado?</p>
                    <p className="text-xs text-green-600 mt-0.5">Marca como entregado para moverlo al historial.</p>
                  </div>
                  <button onClick={()=>handleMarkStatus("DELIVERED",assigned)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition shrink-0" style={{background:"linear-gradient(135deg,#059669,#047857)"}}>
                    <Truck size={15}/> Marcar entregado</button>
                </div>
              )}

              {/* Baker assignment (non-pending) */}
              {!isPending&&currentUser?.role==="OWNER"&&(
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><User size={11}/> Asignada a</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={()=>handleBakerBtn("")} className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${!assigned?"text-white border-transparent":"border-[#f0e8e0] text-gray-400 hover:border-gray-300"}`} style={!assigned?{background:PINK}:{}}>Sin asignar</button>
                    {teamMembers.map(m=>(
                      <button key={m.name} onClick={()=>handleBakerBtn(m.name)}
                        className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${assigned===m.name?"text-white border-transparent":"border-[#f0e8e0] text-gray-600 hover:border-gray-300"}`}
                        style={assigned===m.name?{background:PINK}:{}}>
                        {m.name}{m.role==="ASSISTANT"&&<span className="ml-1 text-[10px] opacity-60">(asist.)</span>}
                      </button>
                    ))}
                    {saving&&<span className="text-xs text-gray-400 self-center">Guardando…</span>}
                  </div>
                </div>
              )}
              {/* BAKER puede asignarse a sí misma o a cualquier asistente */}
              {!isPending&&currentUser?.role==="BAKER"&&(
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><User size={11}/> Asignada a</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={()=>handleBakerBtn("")} className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${!assigned?"text-white border-transparent":"border-[#f0e8e0] text-gray-400 hover:border-gray-300"}`} style={!assigned?{background:PINK}:{}}>Sin asignar</button>
                    <button onClick={()=>handleBakerBtn(currentUser.name)}
                      className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${assigned===currentUser.name?"text-white border-transparent":"border-[#f0e8e0] text-gray-600 hover:border-gray-300"}`}
                      style={assigned===currentUser.name?{background:PINK}:{}}>
                      {currentUser.name} <span className="text-[10px] opacity-60">(yo)</span>
                    </button>
                    {teamMembers.filter(m=>m.role==="ASSISTANT").map(m=>(
                      <button key={m.name} onClick={()=>handleBakerBtn(m.name)}
                        className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${assigned===m.name?"text-white border-transparent":"border-[#f0e8e0] text-gray-600 hover:border-gray-300"}`}
                        style={assigned===m.name?{background:PINK}:{}}>
                        {m.name}<span className="ml-1 text-[10px] opacity-60">(asist.)</span>
                      </button>
                    ))}
                    {saving&&<span className="text-xs text-gray-400 self-center">Guardando…</span>}
                  </div>
                </div>
              )}
              {/* ASSISTANT: solo ve quién está asignada */}
              {!isPending&&isAssistant&&assigned&&(
                <div className="flex items-center gap-2 bg-[#fef7f9] border border-[#f07097]/20 rounded-2xl px-4 py-2.5">
                  <User size={13} className="text-[#f07097]"/>
                  <span className="text-sm text-gray-700">Asignada a: <strong>{assigned}</strong></span>
                </div>
              )}

              {/* Bottom actions (oculto en pedidos PENDING) */}
              {!isPending&&(
              <div className="flex flex-wrap gap-2">
                {!isAssistant&&(
                  <button onClick={handleSaveChanges} disabled={saving}
                    className="flex-1 min-w-[120px] py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                    style={{background:PINK}}>
                    {saving?"Guardando…":<><Check size={14}/> Guardar cambios</>}
                  </button>
                )}
                <a href={`https://wa.me/${localOrder.phone.replace(/\D/g,"")}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition"
                  style={{background:"#bbf7d0",color:"#065f46"}}>
                  <MessageCircle size={14}/> WhatsApp
                </a>
                {!isAssistant&&(
                  <button onClick={handleDelete} className="px-3 py-2.5 rounded-xl border-2 border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Order Card ────────────────────────────────────────────────
function OrderCard({ order,onClick,onQuickAction,currentUser }:{
  order:Order; onClick:()=>void;
  onQuickAction:(id:string,status:string)=>void;
  currentUser: CurrentUser | null;
}) {
  const st = STATUS[order.status]??STATUS.PENDING;
  const imgs = Array.isArray(order.imageUrls)?order.imageUrls.filter(u=>typeof u==="string"):[];
  const items = Array.isArray(order.selectedItems)?order.selectedItems:[];
  const days = daysUntil(order.eventDate);
  const urgent = isUrgent(order);
  const dateR = new Date(order.createdAt).toLocaleDateString("es-DO",{day:"2-digit",month:"short"});
  const isActive = ["CONFIRMED","NEEDS_INFO"].includes(order.status);
  const isCompleted = order.status==="COMPLETED";

  return(
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all ${urgent?"border-red-300 ring-1 ring-red-100":"border-[#f0e8e0]"} hover:shadow-md`}>
      {/* Clickable image + info area */}
      <button onClick={onClick} className="text-left flex-1 flex flex-col">
        {imgs.length>0?(
          <div className="flex h-32 overflow-hidden">
            {imgs.slice(0,3).map((url,i)=>(
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={url} alt="" className="flex-1 object-cover min-w-0 hover:scale-105 transition-transform duration-500" style={{flexBasis:`${100/Math.min(imgs.length,3)}%`}}/>
            ))}
          </div>
        ):(
          <div className="h-20 flex items-center justify-center" style={{background:"linear-gradient(135deg,#fce7f3 0%,#fdf2f8 100%)"}}>
            <span className="text-3xl">🎂</span>
          </div>
        )}
        <div className="p-4 pb-3 flex flex-col gap-2.5 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full" style={{color:st.color,background:st.bg}}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{background:st.dot}}/>{st.label}
              </span>
              {urgent&&<span className="inline-flex items-center gap-0.5 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full"><AlertTriangle size={9}/> {days===0?"¡Hoy!":`${days}d`}</span>}
            </div>
            <span className="text-xs text-gray-400 shrink-0">{dateR}</span>
          </div>
          <div>
            <p className="font-display text-base leading-tight text-gray-900">{order.name}</p>
            <p className="text-xs text-gray-400">{order.phone}</p>
            <p className="text-xs text-gray-300">#{shortId(order.id)}</p>
          </div>
          <div className="bg-[#faf8f5] rounded-xl p-2.5 text-xs space-y-1">
            <p className="font-medium text-gray-700">🎉 {order.eventType}</p>
            <div className="flex items-center justify-between gap-1">
              <p className="text-gray-500">📅 {order.eventDate}{order.deliveryTime?` · ⏰ ${fmt12h(order.deliveryTime)}`:""}</p>
              {!["DELIVERED","CANCELLED","REJECTED"].includes(order.status)&&(
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0 ${days<0?"bg-gray-100 text-gray-400":days===0?"bg-red-100 text-red-700":days<=2?"bg-orange-100 text-orange-700":days<=7?"bg-yellow-100 text-yellow-700":"bg-green-100 text-green-700"}`}>
                  {days<0?"Pasó":days===0?"¡Hoy!":days===1?"Mañana":`${days}d`}
                </span>
              )}
            </div>
            {items.length>0&&<p className="text-gray-400 truncate">🛒 {items.join(", ")}</p>}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-wrap">
              {order.assignedTo&&<p className="text-xs text-[#f07097] flex items-center gap-0.5 font-medium"><User size={10}/> {order.assignedTo.split(" ")[0]}</p>}
              {order.deliveryMethod&&<span className="text-xs text-gray-500">{order.deliveryMethod==="pickup"?"🏠":"🚗"}</span>}
              {order.paymentStatus==="PAID"&&<span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">Pagado</span>}
              {order.paymentStatus==="PARTIAL"&&<span className="text-xs font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full">Anticipo</span>}
              {imgs.length>0&&<p className="text-xs text-gray-400 flex items-center gap-0.5"><ImageIcon size={10}/> {imgs.length}</p>}
              {order.internalNote&&<p className="text-xs text-amber-500 flex items-center gap-0.5"><StickyNote size={10}/></p>}
            </div>
            <div className="flex items-center gap-1.5">
              {order.agreedPrice&&<span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">RD${order.agreedPrice.toLocaleString("es-DO")}</span>}
              <span className="text-xs text-[#f07097] font-medium">Ver →</span>
            </div>
          </div>

        </div>
      </button>

      {/* Quick action buttons — solo OWNER y BAKER */}
      {(isActive||isCompleted)&&currentUser?.role!=="ASSISTANT"&&(
        <div className="px-4 pb-4">
          {isActive&&(
            <button onClick={e=>{e.stopPropagation();onQuickAction(order.id,"COMPLETED");}}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 border-blue-200 text-blue-700 hover:bg-blue-50 transition">
              <CheckCircle2 size={13}/> Marcar listo
            </button>
          )}
          {isCompleted&&(
            <button onClick={e=>{e.stopPropagation();onQuickAction(order.id,"DELIVERED");}}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border-2 border-green-200 text-green-700 hover:bg-green-50 transition">
              <Truck size={13}/> Marcar entregado
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────
type CurrentUser = { id: string; email: string; name: string; role: "OWNER"|"BAKER"|"ASSISTANT" };

export default function Dashboard() {
  return (
    <BakersProvider>
      <DashboardInner/>
    </BakersProvider>
  );
}

function DashboardInner() {
  const { bakers } = useBakers();
  const router = useRouter();
  const [mainTab,setMainTab] = useState<"orders"|"catalog">("orders");
  const [orders,setOrders] = useState<Order[]>([]);
  const [ordersLoading,setOrdersLoading] = useState(false);
  const [selectedOrder,setSelectedOrder] = useState<Order|null>(null);
  const [orderTab,setOrderTab] = useState<OrderTabId>("PENDING");
  const [orderSearch,setOrderSearch] = useState("");
  const [bakerFilter,setBakerFilter] = useState<string>("ALL");
  const [products,setProducts] = useState<Product[]>([]);
  const [catFilter,setCatFilter] = useState("all");
  const [catSearch,setCatSearch] = useState("");
  const [productModal,setProductModal] = useState<{open:boolean;product:Product|null}>({open:false,product:null});
  const [currentUser,setCurrentUser] = useState<CurrentUser|null>(null);
  const [userMenuOpen,setUserMenuOpen] = useState(false);
  const [cartOrderBadge,setCartOrderBadge] = useState(0);
  const [availabilityFilter,setAvailabilityFilter] = useState<"all"|"AVAILABLE"|"OUT_OF_STOCK"|"HIDDEN">("all");
  const { confirm,modal:confirmModal } = useConfirm();
  const { toasts,addToast,removeToast } = useToast();
  const prevPendingRef = useRef(0);

  async function load(){ const r=await fetch("/api/products"); setProducts(await r.json()); }
  async function loadOrders(){
    setOrdersLoading(true);
    const r=await fetch("/api/orders");
    if(r.status===401){router.push("/admin/login");setOrdersLoading(false);return;}
    if(r.ok) setOrders(await r.json());
    setOrdersLoading(false);
  }
  async function loadMe(){
    const r = await fetch("/api/auth/me");
    if (r.ok) {
      const data = await r.json();
      if (data.user) setCurrentUser(data.user);
    }
  }
  async function loadCartOrderBadge(){
    const r = await fetch("/api/admin/cart-orders");
    if(r.status===401){router.push("/admin/login");return;}
    if (r.ok) {
      const data = await r.json();
      setCartOrderBadge((Array.isArray(data)?data:[]).filter((o:{status:string})=>o.status==="PENDING").length);
    }
  }

  useEffect(()=>{ load(); loadOrders(); loadMe(); loadCartOrderBadge(); },[]);

  // Auto-refresh every 60s — solo si la pestaña está visible.
  // Esto evita las llamadas 401 cada minuto desde pestañas en background con sesión expirada,
  // y reduce drásticamente el ruido en logs Vercel y el costo de invocations.
  useEffect(()=>{
    const tick = ()=>{
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      loadOrders();
      loadCartOrderBadge();
    };
    const id = setInterval(tick, 60_000);
    // Cuando la pestaña vuelve a estar visible, refresca de inmediato.
    const onVisibility = ()=>{ if (document.visibilityState === "visible") tick(); };
    document.addEventListener("visibilitychange", onVisibility);
    return ()=>{
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  },[addToast]);

  // Update browser tab title with pending count
  useEffect(()=>{
    const pending = orders.filter(o=>o.status==="PENDING").length;
    document.title = pending > 0 ? `(${pending}) Kan M Admin` : "Kan M Admin";
    // Notify if new pending orders arrived (not on first load)
    if (prevPendingRef.current > 0 && pending > prevPendingRef.current) {
      // Browser notification if permission granted
      if (Notification.permission === "granted") {
        new Notification("Kan M — Nuevo pedido", { body: `Tienes ${pending} pedido${pending>1?"s":""} sin atender.`, icon: "/logo-kanm.png" });
      }
    }
    prevPendingRef.current = pending;
    return ()=>{ document.title = "Kan M Admin"; };
  },[orders]);
  async function logout(){ await fetch("/api/auth/logout",{method:"POST"}); router.push("/admin/login"); }

  const updateOrder = useCallback(async (id:string,data:Partial<Order>)=>{
    const res = await fetch(`/api/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    if (!res.ok) { addToast("Error al guardar los cambios","error"); return; }
    await loadOrders();
    setSelectedOrder(prev=>prev?.id===id?{...prev,...data}:prev);
    addToast("Cambios guardados","success");
  },[addToast]);
  const deleteOrder = useCallback(async (id:string)=>{
    await fetch(`/api/orders/${id}`,{method:"DELETE"});
    setSelectedOrder(null); loadOrders();
    addToast("Pedido eliminado","info");
  },[]);

  const handleQuickAction = async (id:string,newStatus:string)=>{
    const label = newStatus==="COMPLETED"?"¿Marcar este pedido como listo para entrega?":"¿Marcar este pedido como entregado?";
    const ok = await confirm({ title:newStatus==="COMPLETED"?"Marcar listo":"Marcar entregado", message:label, confirmText:"Confirmar", icon:"confirm" });
    if (!ok) return;
    await updateOrder(id,{status:newStatus});
  };

  async function delProduct(id:string){
    await fetch(`/api/products/${id}`,{method:"DELETE"});
    load();
    addToast("Producto eliminado","info");
  }

  const sorted = [...orders].sort((a,b)=>priorityScore(a)-priorityScore(b));
  const tabCfg = ORDER_TABS.find(t=>t.id===orderTab)!;
  const tabOrders = sorted
    .filter(o=>(tabCfg.statuses as readonly string[]).includes(o.status))
    .filter(o=>bakerFilter==="ALL"||o.assignedTo===bakerFilter||(!o.assignedTo&&bakerFilter==="UNASSIGNED"))
    .filter(o=>matchesSearch(o,orderSearch));
  const filteredProducts = products
    .filter(p=>catFilter==="all"||p.category===catFilter)
    .filter(p=>{
      // Por defecto ("all") los HIDDEN no se muestran en el panel — quedan
      // archivados invisibles. Para verlos hay que elegir el filtro "Ocultas".
      const status = p.availabilityStatus ?? "AVAILABLE";
      if (availabilityFilter === "all") return status !== "HIDDEN";
      return status === availabilityFilter;
    })
    .filter(p=>!catSearch||p.name.toLowerCase().includes(catSearch.toLowerCase()));
  const pendingCount = orders.filter(o=>o.status==="PENDING").length;
  const tabCounts:Record<OrderTabId,number> = {
    PENDING:   orders.filter(o=>o.status==="PENDING").length,
    ACTIVE:    orders.filter(o=>["CONFIRMED","NEEDS_INFO"].includes(o.status)).length,
    COMPLETED: orders.filter(o=>o.status==="COMPLETED").length,
    DELIVERED: orders.filter(o=>o.status==="DELIVERED").length,
    CANCELLED: orders.filter(o=>["CANCELLED","REJECTED"].includes(o.status)).length,
  };

  return(
    <div className="min-h-screen" style={{background:"#f7f4f0"}}>
      <ToastContainer toasts={toasts} removeToast={removeToast}/>
      {confirmModal}
      {selectedOrder&&<OrderModal order={selectedOrder} onClose={()=>setSelectedOrder(null)} onUpdate={updateOrder} onDelete={deleteOrder} currentUser={currentUser}/>}
      {productModal.open&&<ProductModal product={productModal.product} onClose={()=>setProductModal({open:false,product:null})} onSave={load} onDelete={delProduct}/>}

      <header className="sticky top-0 z-40 border-b border-white/20 shadow-sm" style={{background:PINK}}>
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4" style={{height:"3.75rem"}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-white text-sm font-bold" style={{color:"#e85d82"}}>K</div>
            <div>
              <p className="font-semibold text-sm leading-tight text-white">Kan M</p>
              <p className="text-xs text-white/75 leading-tight">Panel de administración</p>
            </div>
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={()=>setUserMenuOpen(o=>!o)}
              onBlur={()=>setTimeout(()=>setUserMenuOpen(false),150)}
              className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white"
              aria-label="Menú de usuario">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-white text-xs font-bold" style={{color:"#e85d82"}}>
                {currentUser ? currentUser.name.split(" ").map(s=>s[0]).join("").slice(0,2).toUpperCase() : "··"}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold leading-tight">{currentUser?.name ?? "Cargando…"}</p>
                <p className="text-[10px] text-white/75 leading-tight">
                  {currentUser?.role === "OWNER" ? "Admin" : currentUser?.role === "BAKER" ? "Repostera" : currentUser?.role === "ASSISTANT" ? "Asistente" : ""}
                </p>
              </div>
              <ChevronRight size={13} className={`transition-transform ${userMenuOpen?"rotate-90":""}`}/>
            </button>

            {userMenuOpen && currentUser && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white rounded-2xl border border-[#ede8e0] shadow-xl overflow-hidden z-50 animate-[fadeIn_.12s_ease-out]"
                onMouseDown={e=>e.preventDefault()}>
                <div className="px-4 py-3 border-b border-[#ede8e0] bg-[#faf8f5]">
                  <p className="font-semibold text-sm text-gray-800">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{background:"#fef7f9", color:"#e85d82"}}>
                    {currentUser.role === "OWNER" ? "Admin" : currentUser.role === "BAKER" ? "Repostera" : "Asistente"}
                  </span>
                </div>
                <div className="py-1.5">
                  {currentUser.role === "OWNER" && (
                    <Link href="/admin/usuarios"
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[#fef7f9] hover:text-[#f07097] transition">
                      <User size={14}/> Gestión de usuarios
                    </Link>
                  )}
                  <button onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition text-left">
                    <LogOut size={14}/> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Bienvenida personalizada */}
        {currentUser && (
          <div className="mb-5 flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-gray-900">
                Hola, <span style={{color:"#e85d82"}}>{currentUser.name.split(" ")[0]}</span> 👋
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {pendingCount > 0
                  ? `Tienes ${pendingCount} pedido${pendingCount===1?"":"s"} sin atender.`
                  : orders.length === 0
                    ? "Aún no hay pedidos. Cuando lleguen los verás aquí."
                    : "Todo al día. Buen trabajo ✨"}
              </p>
            </div>
            <p className="text-xs text-gray-400 tabular-nums">
              {new Date().toLocaleDateString("es-DO", { weekday:"long", day:"numeric", month:"long" })}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            {label:"Productos",value:products.length,icon:"🛍️",sub:"en catálogo"},
            {label:"Pedidos",value:orders.length,icon:"📋",sub:"en total"},
            {label:"Nuevos",value:pendingCount,icon:"⏳",sub:"sin atender",hot:pendingCount>0},
            {label:"Entregados",value:orders.filter(o=>o.status==="DELIVERED").length,icon:"🎉",sub:"este período"},
          ].map(s=>(
            <div key={s.label} className={`bg-white rounded-2xl border p-4 shadow-sm ${s.hot?"border-amber-200 ring-1 ring-amber-100":"border-[#ede8e0]"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-2xl font-bold font-display ${s.hot?"text-[#f07097]":"text-gray-800"}`}>{s.value}</p>
                  <p className="text-xs font-semibold text-gray-600 mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
                <span className="text-2xl">{s.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Main tabs */}
        <div className="flex flex-wrap gap-1 mb-6 bg-white border border-[#ede8e0] rounded-xl p-1 w-fit shadow-sm">
          <button onClick={()=>setMainTab("orders")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab==="orders"?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}
            style={mainTab==="orders"?{background:PINK}:{}}>
            <ClipboardList size={15}/> Pedidos
            {pendingCount>0&&<span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${mainTab==="orders"?"bg-white text-[#f07097]":"bg-[#f07097] text-white"}`}>{pendingCount}</span>}
          </button>
          {currentUser?.role!=="ASSISTANT"&&(
            <button onClick={()=>setMainTab("catalog")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab==="catalog"?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}
              style={mainTab==="catalog"?{background:PINK}:{}}>
              <Package size={15}/> Catálogo
            </button>
          )}
          <Link href="/admin/calendario" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all">
            <Calendar size={15}/> Calendario
          </Link>
          <Link href="/admin/ordenes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all">
            <ShoppingBag size={15}/> Órdenes
            {cartOrderBadge>0&&<span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold bg-[#f07097] text-white">{cartOrderBadge}</span>}
          </Link>
          {currentUser?.role!=="ASSISTANT"&&(
            <Link href="/admin/reportes" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-gray-500 hover:text-gray-700 transition-all">
              <BarChart3 size={15}/> Reportes
            </Link>
          )}
        </div>

        {/* ORDERS */}
        {mainTab==="orders"&&(
          <div>
            <div className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm mb-5">
              <div className="flex flex-wrap border-b border-[#ede8e0]">
                {ORDER_TABS.map(t=>{
                  const active=orderTab===t.id; const count=tabCounts[t.id];
                  return(
                    <button key={t.id} onClick={()=>setOrderTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all flex-1 justify-center sm:flex-none ${active?"border-[#f07097] text-[#f07097]":"border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background:active?"#f07097":t.dot}}/>{t.label}
                      <span className={`min-w-[1.2rem] h-5 px-1 rounded-full text-xs flex items-center justify-center font-bold ${active?"bg-[#f07097] text-white":"bg-gray-100 text-gray-500"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                  <input type="text" placeholder="Buscar por nombre, teléfono o ID…" value={orderSearch} onChange={e=>setOrderSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#ede8e0] bg-[#faf8f5] focus:outline-none focus:border-[#f07097] transition"/>
                </div>
                <button onClick={loadOrders} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#f07097] transition px-3 py-2 rounded-xl border border-[#ede8e0] bg-white shrink-0">
                  <RefreshCw size={13} className={ordersLoading?"animate-spin":""}/> <span className="hidden sm:inline">Actualizar</span>
                </button>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 border-t border-[#f0e8e0]">
                <span className="text-xs text-gray-400 shrink-0">Repostera:</span>
                <div className="flex gap-1.5 flex-wrap">
                  {[{id:"ALL",label:"Todas"},{id:"UNASSIGNED",label:"Sin asignar"},...bakers.map(b=>({id:b,label:b.split(" ")[0]}))].map(f=>(
                    <button key={f.id} onClick={()=>setBakerFilter(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition ${bakerFilter===f.id?"text-white border-transparent":"border-[#ede8e0] text-gray-500 hover:border-gray-300"}`}
                      style={bakerFilter===f.id?{background:PINK}:{}}>{f.label}</button>
                  ))}
                </div>
              </div>
            </div>

            {sorted.some(isUrgent)&&(
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 mb-4 text-sm text-red-700">
                <AlertTriangle size={15} className="shrink-0"/><span>Hay pedidos con eventos próximos — aparecen primero.</span>
              </div>
            )}

            {ordersLoading?(
              <div className="text-center py-20 text-gray-400">Cargando…</div>
            ):tabOrders.length===0?(
              <div className="text-center py-20 bg-white rounded-2xl border border-[#ede8e0]">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-500 text-sm">{orderSearch?"Sin resultados.":"No hay pedidos en este estado."}</p>
              </div>
            ):(
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {tabOrders.map(o=><OrderCard key={o.id} order={o} onClick={()=>setSelectedOrder(o)} onQuickAction={handleQuickAction} currentUser={currentUser}/>)}
              </div>
            )}
          </div>
        )}

        {/* CATALOG */}
        {mainTab==="catalog"&&(
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <h2 className="font-display text-xl text-gray-900">Catálogo</h2>
              <button onClick={()=>setProductModal({open:true,product:null})} className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition" style={{background:PINK}}>
                <Plus size={15}/> Agregar producto</button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                <input type="text" placeholder="Buscar productos…" value={catSearch} onChange={e=>setCatSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-[#ede8e0] bg-white focus:outline-none focus:border-[#f07097] transition"/>
              </div>
              <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-1.5">
                {(()=>{
                  // Conteo por categoría EXCLUYE HIDDEN (porque por defecto no se ven)
                  const visibleProducts = products.filter(p=>(p.availabilityStatus??"AVAILABLE")!=="HIDDEN");
                  const items = [{id:"all",label:`Todo (${visibleProducts.length})`},...CATEGORIES.map(c=>({id:c.id,label:`${c.label} (${visibleProducts.filter(p=>p.category===c.id).length})`}))];
                  return items.map(c=>(
                    <button key={c.id} onClick={()=>setCatFilter(c.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${catFilter===c.id?"text-white border-transparent":"border-[#ede8e0] text-gray-500 hover:border-gray-300"}`}
                      style={catFilter===c.id?{background:PINK}:{}}>{c.label}</button>
                  ));
                })()}
              </div>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mr-1">Estado:</span>
                {(()=>{
                  const hiddenCount = products.filter(p=>p.availabilityStatus==="HIDDEN").length;
                  const filters: ReadonlyArray<readonly [typeof availabilityFilter, string, string]> = [
                    ["all",          "Visibles",   "#6b7280"],
                    ["AVAILABLE",    "Disponibles","#10b981"],
                    ["OUT_OF_STOCK", "Sin stock",  "#f59e0b"],
                    ["HIDDEN",       `Ocultas${hiddenCount>0?` (${hiddenCount})`:""}`, "#9ca3af"],
                  ];
                  return filters.map(([id,label,color])=>(
                    <button key={id} onClick={()=>setAvailabilityFilter(id)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold border transition ${availabilityFilter===id?"text-white border-transparent":"border-[#ede8e0] text-gray-500 hover:border-gray-300"}`}
                      style={availabilityFilter===id?{background:color}:{}}>{label}</button>
                  ));
                })()}
              </div>
              </div>
            </div>
            <h3 className="font-display text-lg mb-4">Productos <span className="text-gray-400 font-normal text-base">({filteredProducts.length})</span></h3>
            {filteredProducts.length===0?(
              <div className="text-center py-16 bg-white rounded-2xl border border-[#ede8e0]"><div className="text-4xl mb-2">🛍️</div><p className="text-gray-500 text-sm">Sin productos aquí.</p></div>
            ):(
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map(p=>(
                  <div key={p.id} className="bg-white rounded-2xl border border-[#ede8e0] shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={()=>setProductModal({open:true,product:p})}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.imageUrl} alt={p.name} className="w-full aspect-[4/3] object-cover"/>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex flex-wrap gap-1">
                          <span className="inline-block text-xs font-semibold text-white px-2 py-0.5 rounded-full" style={{background:PINK}}>{catLabel(p.category)}</span>
                          {(p.availabilityStatus??"AVAILABLE")!=="AVAILABLE"&&(
                            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${p.availabilityStatus==="OUT_OF_STOCK"?"bg-amber-100 text-amber-700":"bg-gray-100 text-gray-500"}`}>
                              {p.availabilityStatus==="OUT_OF_STOCK"?"Sin stock":"Oculto"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-300 shrink-0">#{shortId(p.id)}</span>
                      </div>
                      <h3 className="font-display text-base leading-tight">{p.name}</h3>
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.description}</p>
                      {p.price!=null&&<p className="text-sm font-semibold mt-1.5" style={{color:"#f07097"}}>RD${p.price.toLocaleString("es-DO")}</p>}
                      <p className="text-xs text-[#f07097] mt-3 font-medium">Clic para editar →</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
