"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConfirmationModal } from "@/components/ConfirmationModal";
import {
  Package, ClipboardList, LogOut, RefreshCw, Plus, X,
  Pencil, Trash2, ChevronLeft, ChevronRight, Check,
  MessageCircle, User, ShoppingBag, FileText, Download,
  Image as ImageIcon, AlertTriangle, Search, Clock,
  CheckCircle2, Truck, Ban, Info, StickyNote, History,
  Edit3, Save
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
type Product = { id: string; name: string; description: string; category: string; imageUrl: string; price: number | null; };
type CakeDetail = { filling: string; masa: string; colors: string; message: string; size: string; };
type StatusLogEntry = { status: string; by: string; at: string; };
type Order = {
  id: string; name: string; phone: string; email?: string;
  eventType: string; eventDate: string; deliveryTime?: string; guestCount: string;
  selectedItems: string[]; cakeDetails?: Record<string, CakeDetail>;
  notes?: string; internalNote?: string; imageUrls: string[];
  status: string; assignedTo?: string | null;
  agreedPrice?: number | null;
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
const BAKERS = ["Karolyn Sierra","Astrid Sierra"];
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
          {BAKERS.map(b=>(
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
  const [form,setForm] = useState({ name:product?.name??"", description:product?.description??"", category:product?.category??"cakes", imageUrl:product?.imageUrl??"", price:product?.price?.toString()??"" });
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
    const body={name:form.name,description:form.description,category:form.category,imageUrl:form.imageUrl,price:form.price===""?null:Number(form.price)};
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
  });
  const [saving,setSaving] = useState(false);
  const { confirm,modal } = useConfirm();

  // Statuses that can be set manually (skip PENDING — handled by action buttons)
  const MANUAL_STATUSES = ["CONFIRMED","NEEDS_INFO","COMPLETED","DELIVERED","REJECTED","CANCELLED"];

  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{ document.body.style.overflow=""; }; },[]);

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    const ok = await confirm({ title:"Guardar cambios", message:"¿Confirmar los cambios en el pedido?", confirmText:"Guardar", icon:"save" });
    if (!ok) return;
    setSaving(true);
    await onSave({ ...form, email:form.email||undefined, deliveryTime:form.deliveryTime||undefined, notes:form.notes||undefined, changedBy:"Admin (edición)" } as any);
    setSaving(false); onClose();
  }

  // Days until event for display
  const days = daysUntil(form.eventDate);
  const dateUrgent = days >= 0 && days <= 3;

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

            {/* Event date banner — prominent */}
            <div className={`rounded-2xl p-4 border-2 ${dateUrgent ? "border-red-300 bg-red-50" : "border-[#f0e8e0] bg-[#faf8f5]"}`}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Fecha y hora del evento</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Fecha <span className="text-[#f07097]">*</span></label>
                  <input type="date" required value={form.eventDate} onChange={e=>setForm({...form,eventDate:e.target.value})}
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm focus:outline-none transition ${dateUrgent?"border-red-300 bg-white focus:border-red-400":"border-[#ede8e0] bg-white focus:border-[#f07097]"}`}/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Hora de entrega</label>
                  <input type="time" value={form.deliveryTime} onChange={e=>setForm({...form,deliveryTime:e.target.value})}
                    className="w-full rounded-xl border border-[#ede8e0] bg-white px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition"/>
                </div>
              </div>
              {/* Countdown chip */}
              {form.eventDate && (
                <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                  days < 0 ? "bg-gray-100 text-gray-500" :
                  days === 0 ? "bg-red-100 text-red-700" :
                  days <= 2 ? "bg-orange-100 text-orange-700" :
                  days <= 7 ? "bg-yellow-100 text-yellow-700" :
                  "bg-green-100 text-green-700"
                }`}>
                  <Clock size={11}/>
                  {days < 0 ? `Hace ${Math.abs(days)} día${Math.abs(days)!==1?"s":""}` :
                   days === 0 ? "¡Hoy!" :
                   days === 1 ? "Mañana" :
                   `En ${days} días`}
                </div>
              )}
            </div>

            {/* Status selector */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Estado del pedido</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MANUAL_STATUSES.map(s=>{
                  const cfg = STATUS[s];
                  const active = form.status === s;
                  return(
                    <button key={s} type="button" onClick={()=>setForm({...form,status:s})}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold border-2 transition ${active?"border-transparent text-white":"border-[#f0e8e0] hover:border-gray-300"}`}
                      style={active?{background:`linear-gradient(135deg,${cfg.dot},${cfg.color})`}:{color:cfg.color,background:cfg.bg}}>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{background:active?"white":cfg.dot}}/>
                      {cfg.label}
                    </button>
                  );
                })}
              </div>
              {form.status !== order.status && (
                <p className="text-xs text-amber-600 mt-2 flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg">
                  <AlertTriangle size={11}/> El estado cambiará de <strong>{STATUS[order.status]?.label}</strong> a <strong>{STATUS[form.status]?.label}</strong>
                </p>
              )}
            </div>

            {/* Client info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Datos del cliente</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Nombre <span className="text-[#f07097]">*</span></label>
                  <input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Teléfono <span className="text-[#f07097]">*</span></label>
                  <input required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition"/>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Email</label>
                  <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="(opcional)" className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition"/>
                </div>
              </div>
            </div>

            {/* Event info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Detalles del evento</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Tipo de evento</label>
                  <select value={form.eventType} onChange={e=>setForm({...form,eventType:e.target.value})} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition">
                    {EVENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Personas <span className="text-[#f07097]">*</span></label>
                  <input type="number" required value={form.guestCount} onChange={e=>setForm({...form,guestCount:e.target.value})} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm focus:outline-none focus:border-[#f07097] transition"/>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 mb-1 block">Notas del cliente</label>
                  <textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} rows={3} className="w-full rounded-xl border border-[#ede8e0] bg-[#faf8f5] px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-[#f07097] transition"/>
                </div>
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

// ── Order Detail Modal ────────────────────────────────────────
function OrderModal({ order,onClose,onUpdate,onDelete }:{
  order:Order; onClose:()=>void;
  onUpdate:(id:string,data:Partial<Order>)=>Promise<void>;
  onDelete:(id:string)=>Promise<void>;
}) {
  const [status,setStatus]       = useState(order.status);
  const [assigned,setAssigned]   = useState(order.assignedTo??"");
  const [internalNote,setNote]   = useState(order.internalNote??"");
  const [agreedPrice,setPrice]   = useState(order.agreedPrice?.toString()??"");
  const [priceEditing,setPriceEdit] = useState(false);
  const [noteEditing,setNoteEdit]= useState(false);
  const [saving,setSaving]       = useState(false);
  const [lightboxIdx,setLBIdx]   = useState<number|null>(null);
  const [showBaker,setShowBaker] = useState(false);
  const [pendingStatus,setPending]= useState<string|null>(null);
  const [showEdit,setShowEdit]   = useState(false);
  const [localOrder,setLocalOrder]= useState(order);
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

  const handleAction = (newStatus:string) => { setPending(newStatus); setShowBaker(true); };
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
  const handleSaveNote = async () => {
    await doUpdate({ internalNote });
    setNoteEdit(false);
  };
  const handleSavePrice = async () => {
    await doUpdate({ agreedPrice: agreedPrice === "" ? null : Number(agreedPrice) });
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

  const waMsg = encodeURIComponent(`Hola ${localOrder.name} 👋, somos Kan M. Sobre tu cotización para *${localOrder.eventType}* el *${localOrder.eventDate}*${localOrder.deliveryTime?` a las ${fmt12h(localOrder.deliveryTime)}`:""}: `);

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
              <button onClick={()=>setShowEdit(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#ede8e0] text-xs font-medium text-gray-600 hover:bg-[#faf8f5] hover:border-[#f07097] transition">
                <Edit3 size={13}/> Editar
              </button>
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
                            {cd.message&&<p className="col-span-2"><span className="font-medium text-gray-700">Mensaje:</span> "{cd.message}"</p>}
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
                <div className="bg-[#faf8f5] rounded-2xl p-4 text-sm text-gray-600 italic leading-relaxed">"{localOrder.notes}"</div>
              </div>
            )}

            {/* Agreed price */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5">
                  <span>💰</span> Precio acordado
                </p>
                {!priceEditing && <button onClick={()=>setPriceEdit(true)} className="text-xs text-[#f07097] hover:underline flex items-center gap-1"><Edit3 size={11}/>{agreedPrice?"Editar":"Agregar"}</button>}
              </div>
              {priceEditing ? (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">RD$</span>
                    <input type="number" min={0} step={50} value={agreedPrice} onChange={e=>setPrice(e.target.value)}
                      placeholder="0"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#f07097]/30 bg-[#fef7f9] text-sm focus:outline-none focus:border-[#f07097] transition"/>
                  </div>
                  <button onClick={handleSavePrice} className="px-4 py-2 rounded-xl text-white text-xs font-semibold hover:opacity-90 transition" style={{background:"#059669"}}>Guardar</button>
                  <button onClick={()=>{setPriceEdit(false);setPrice(localOrder.agreedPrice?.toString()??"");}} className="px-3 py-2 rounded-xl border border-[#ede8e0] text-xs text-gray-500 hover:bg-gray-50 transition">×</button>
                </div>
              ) : agreedPrice ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center justify-between">
                  <span className="text-green-800 font-bold text-lg">RD${Number(agreedPrice).toLocaleString("es-DO")}</span>
                  <span className="text-xs text-green-600">Precio confirmado</span>
                </div>
              ) : (
                <button onClick={()=>setPriceEdit(true)} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-[#ede8e0] text-xs text-gray-400 hover:text-[#f07097] hover:border-[#f07097]/40 transition">
                  <Plus size={13}/> Agregar precio acordado
                </button>
              )}
            </div>

            {/* Internal note */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 flex items-center gap-1.5"><StickyNote size={11}/> Nota interna</p>
                {!noteEditing&&<button onClick={()=>setNoteEdit(true)} className="text-xs text-[#f07097] hover:underline flex items-center gap-1"><Edit3 size={11}/>{internalNote?"Editar":"Agregar"}</button>}
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
              ):(
                <button onClick={()=>setNoteEdit(true)} className="flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-dashed border-[#ede8e0] text-xs text-gray-400 hover:text-[#f07097] hover:border-[#f07097]/40 transition">
                  <Plus size={13}/> Agregar nota interna
                </button>
              )}
            </div>

            {/* Photos */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5">
                <ImageIcon size={11}/> Fotos de referencia
                {imgs.length>0&&<span className="font-normal normal-case tracking-normal">({imgs.length}) — clic para ampliar</span>}
              </p>
              {imgs.length>0?(
                <div className="flex flex-wrap gap-2">
                  {imgs.map((url,i)=>(
                    <button key={i} onClick={()=>setLBIdx(i)} className="relative w-20 h-20 rounded-xl overflow-hidden border-2 border-[#f0e8e0] hover:border-[#f07097] transition cursor-zoom-in group flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" onError={e=>{(e.target as HTMLImageElement).style.display="none";}}/>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <ImageIcon size={16} className="text-white drop-shadow"/>
                      </div>
                    </button>
                  ))}
                </div>
              ):(
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[#faf8f5] border border-dashed border-[#e8ddd3] text-xs text-gray-400">
                  <ImageIcon size={14}/> Sin imágenes de referencia
                </div>
              )}
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

              {/* PENDING → Accept / More info / Cancel */}
              {isPending&&(
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Acción sobre el pedido</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={()=>handleAction("CONFIRMED")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition" style={{background:"#bbf7d0",color:"#065f46"}}>
                      <CheckCircle2 size={15}/> Aceptar</button>
                    <button onClick={()=>handleAction("NEEDS_INFO")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition" style={{background:"#e9d5ff",color:"#5b21b6"}}>
                      <Info size={15}/> Más información</button>
                    <button onClick={()=>handleAction("CANCELLED")} className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition" style={{background:"#fecaca",color:"#991b1b"}}>
                      <Ban size={15}/> Cancelar</button>
                  </div>
                </div>
              )}

              {/* ACTIVE → Mark ready */}
              {isActive&&(
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-blue-800">¿El pedido está listo?</p>
                    <p className="text-xs text-blue-600 mt-0.5">Marca como listo cuando esté preparado para entrega o recogida.</p>
                  </div>
                  <button onClick={()=>handleStatusBtn("COMPLETED",assigned)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition shrink-0" style={{background:"linear-gradient(135deg,#3b82f6,#1d4ed8)"}}>
                    <CheckCircle2 size={15}/> Marcar listo</button>
                </div>
              )}

              {/* COMPLETED → Mark delivered */}
              {isCompleted&&(
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-green-800">¿El pedido fue entregado?</p>
                    <p className="text-xs text-green-600 mt-0.5">Marca como entregado para moverlo al historial.</p>
                  </div>
                  <button onClick={()=>handleStatusBtn("DELIVERED",assigned)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition shrink-0" style={{background:"linear-gradient(135deg,#059669,#047857)"}}>
                    <Truck size={15}/> Marcar entregado</button>
                </div>
              )}

              {/* Baker assignment (non-pending) */}
              {!isPending&&(
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2 flex items-center gap-1.5"><User size={11}/> Repostera asignada</p>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={()=>handleBakerBtn("")} className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${!assigned?"text-white border-transparent":"border-[#f0e8e0] text-gray-400 hover:border-gray-300"}`} style={!assigned?{background:PINK}:{}}>Sin asignar</button>
                    {BAKERS.map(b=>(
                      <button key={b} onClick={()=>handleBakerBtn(b)} className={`px-4 py-2 rounded-xl text-sm border-2 font-medium transition ${assigned===b?"text-white border-transparent":"border-[#f0e8e0] text-gray-600 hover:border-gray-300"}`} style={assigned===b?{background:PINK}:{}}>{b}</button>
                    ))}
                    {saving&&<span className="text-xs text-gray-400 self-center">Guardando…</span>}
                  </div>
                </div>
              )}

              {/* Bottom actions */}
              <div className="flex flex-wrap gap-2">
                <button onClick={handleSaveChanges} disabled={saving}
                  className="flex-1 min-w-[120px] py-2.5 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{background:PINK}}>
                  {saving?"Guardando…":<><Check size={14}/> Guardar cambios</>}
                </button>
                <a href={`https://wa.me/${localOrder.phone.replace(/\D/g,"")}?text=${waMsg}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition"
                  style={{background:"#bbf7d0",color:"#065f46"}}>
                  <MessageCircle size={14}/> WhatsApp
                </a>
                <button onClick={handleDelete} className="px-3 py-2.5 rounded-xl border-2 border-red-100 text-red-400 hover:bg-red-50 hover:border-red-200 transition">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Order Card ────────────────────────────────────────────────
function OrderCard({ order,onClick,onQuickAction }:{
  order:Order; onClick:()=>void;
  onQuickAction:(id:string,status:string)=>void;
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
            <div className="flex items-center gap-2">
              {order.assignedTo&&<p className="text-xs text-[#f07097] flex items-center gap-0.5 font-medium"><User size={10}/> {order.assignedTo.split(" ")[0]}</p>}
              {imgs.length>0&&<p className="text-xs text-gray-400 flex items-center gap-0.5"><ImageIcon size={10}/> {imgs.length}</p>}
              {order.internalNote&&<p className="text-xs text-amber-500 flex items-center gap-0.5"><StickyNote size={10}/></p>}
            </div>
            <div className="flex items-center gap-2">
              {order.agreedPrice&&<span className="text-xs font-bold text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">RD${order.agreedPrice.toLocaleString("es-DO")}</span>}
              <span className="text-xs text-[#f07097] font-medium">Ver →</span>
            </div>
          </div>
        </div>
      </button>

      {/* Quick action buttons at bottom of card */}
      {(isActive||isCompleted)&&(
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
export default function Dashboard() {
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
  const { confirm,modal:confirmModal } = useConfirm();
  const prevPendingRef = useRef(0);

  async function load(){ const r=await fetch("/api/products"); setProducts(await r.json()); }
  async function loadOrders(){
    setOrdersLoading(true);
    const r=await fetch("/api/orders");
    if(r.ok) setOrders(await r.json());
    setOrdersLoading(false);
  }

  useEffect(()=>{ load(); loadOrders(); },[]);

  // Auto-refresh every 60s + browser tab title badge
  useEffect(()=>{
    const id = setInterval(()=>{ loadOrders(); }, 60_000);
    return ()=>clearInterval(id);
  },[]);

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
    await fetch(`/api/orders/${id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
    await loadOrders();
    setSelectedOrder(prev=>prev?.id===id?{...prev,...data}:prev);
  },[]);
  const deleteOrder = useCallback(async (id:string)=>{
    await fetch(`/api/orders/${id}`,{method:"DELETE"});
    setSelectedOrder(null); loadOrders();
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
  }

  const sorted = [...orders].sort((a,b)=>priorityScore(a)-priorityScore(b));
  const tabCfg = ORDER_TABS.find(t=>t.id===orderTab)!;
  const tabOrders = sorted
    .filter((o) => (tabCfg.statuses as readonly string[]).includes(o.status))
    .filter(o=>bakerFilter==="ALL"||o.assignedTo===bakerFilter||(!o.assignedTo&&bakerFilter==="UNASSIGNED"))
    .filter(o=>matchesSearch(o,orderSearch));
  const filteredProducts = products.filter(p=>catFilter==="all"||p.category===catFilter).filter(p=>!catSearch||p.name.toLowerCase().includes(catSearch.toLowerCase()));
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
      {confirmModal}
      {selectedOrder&&<OrderModal order={selectedOrder} onClose={()=>setSelectedOrder(null)} onUpdate={updateOrder} onDelete={deleteOrder}/>}
      {productModal.open&&<ProductModal product={productModal.product} onClose={()=>setProductModal({open:false,product:null})} onSave={load} onDelete={delProduct}/>}

      <header className="sticky top-0 z-40 border-b border-[#ede8e0] bg-white/90 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between gap-4" style={{height:"3.75rem"}}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold" style={{background:PINK}}>K</div>
            <div><p className="font-semibold text-sm leading-tight">Kan M</p><p className="text-xs text-gray-400 leading-tight">Panel de administración</p></div>
          </div>
          <nav className="hidden sm:flex items-center gap-1">
            <Link href="/admin/calendario" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
              📅 Calendario
            </Link>
            <Link href="/admin/reportes" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition">
              📊 Reportes
            </Link>
          </nav>
          <button onClick={logout} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition px-3 py-1.5 rounded-lg hover:bg-gray-100"><LogOut size={14}/> Salir</button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
        <div className="flex gap-1 mb-6 bg-white border border-[#ede8e0] rounded-xl p-1 w-fit shadow-sm">
          {[{id:"orders",icon:<ClipboardList size={15}/>,label:"Pedidos",badge:pendingCount},{id:"catalog",icon:<Package size={15}/>,label:"Catálogo"}].map(t=>(
            <button key={t.id} onClick={()=>setMainTab(t.id as typeof mainTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${mainTab===t.id?"text-white shadow-sm":"text-gray-500 hover:text-gray-700"}`}
              style={mainTab===t.id?{background:PINK}:{}}>
              {t.icon} {t.label}
              {t.badge?<span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${mainTab===t.id?"bg-white text-[#f07097]":"bg-[#f07097] text-white"}`}>{t.badge}</span>:null}
            </button>
          ))}
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
                  {[{id:"ALL",label:"Todas"},{id:"UNASSIGNED",label:"Sin asignar"},...BAKERS.map(b=>({id:b,label:b.split(" ")[0]}))].map(f=>(
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
                {tabOrders.map(o=><OrderCard key={o.id} order={o} onClick={()=>setSelectedOrder(o)} onQuickAction={handleQuickAction}/>)}
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
              <div className="flex flex-wrap gap-1.5">
                {[{id:"all",label:`Todo (${products.length})`},...CATEGORIES.map(c=>({id:c.id,label:`${c.label} (${products.filter(p=>p.category===c.id).length})`}))].map(c=>(
                  <button key={c.id} onClick={()=>setCatFilter(c.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${catFilter===c.id?"text-white border-transparent":"border-[#ede8e0] text-gray-500 hover:border-gray-300"}`}
                    style={catFilter===c.id?{background:PINK}:{}}>{c.label}</button>
                ))}
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
                        <span className="inline-block text-xs font-semibold text-white px-2 py-0.5 rounded-full" style={{background:PINK}}>{catLabel(p.category)}</span>
                        <span className="text-xs text-gray-300">#{shortId(p.id)}</span>
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
