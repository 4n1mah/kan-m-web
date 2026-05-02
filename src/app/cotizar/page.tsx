"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays, Users, Cake, Sparkles, ArrowRight,
  CheckCircle2, ImagePlus, X, Clock,
} from "lucide-react";

const EVENT_TYPES = ["Cumpleaños","Boda / Compromiso","Baby shower","Corporativo","Graduación","Quinceañera","Otro"];
const PRODUCT_CATEGORIES = [
  { label: "Pasteles",items: ["Pastel personalizado","Naked cake","Drip cake","Pastel de bodas"],isCake: true },
  { label: "Postres",items: ["Macarons","Brownies","Alfajores","Cheesecake"],isCake: false },
  { label: "Mesa dulce",items: ["Mesa dulce completa","Mesa de postres mini"],isCake: false },
  { label: "Brunch / Catering",items: ["Brunch para grupo","Catering de evento"],isCake: false },
];
const CAKE_ITEMS = new Set(PRODUCT_CATEGORIES.filter(c=>c.isCake).flatMap(c=>c.items));
const FILLINGS = ["Dulce de leche","Crema pastelera","Ganache chocolate","Ganache chocolate blanco","Mermelada fresa","Mermelada frutos del bosque","Mermelada piña","Mermelada limón"];
const MASAS = ["Vainilla","Chocolate","Marmol cake","Naranja"];
const BTN = "linear-gradient(135deg,#f07097 0%,#f4899e 50%,#e85d82 100%)";

type CakeDetail = { filling:string; masa:string; colors:string; message:string; size:string; };
type FormState = { name:string; phone:string; email:string; eventType:string; eventDate:string; deliveryTime:string; guestCount:string; selectedItems:string[]; notes:string; };
const EMPTY:FormState = { name:"",phone:"",email:"",eventType:"",eventDate:"",deliveryTime:"",guestCount:"",selectedItems:[],notes:"" };
const EMPTY_CAKE:CakeDetail = { filling:"",masa:"",colors:"",message:"",size:"" };

function CakePopup({ item,onSave,onClose }:{ item:string; onSave:(d:CakeDetail)=>void; onClose:()=>void }) {
  const [d,setD] = useState<CakeDetail>(EMPTY_CAKE);
  const s = (k:keyof CakeDetail,v:string) => setD(p=>({...p,[k]:v}));
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==="Escape") onClose(); };
    document.addEventListener("keydown",fn); document.body.style.overflow="hidden";
    return ()=>{ document.removeEventListener("keydown",fn); document.body.style.overflow=""; };
  },[onClose]);
  const Pill=({label,active,onClick}:{label:string;active:boolean;onClick:()=>void})=>(
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm border transition ${active?"text-white border-transparent":"border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)] hover:text-[var(--rose)]"}`}
      style={active?{background:BTN}:{}}>
      {label}
    </button>
  );
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.5)"}} onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <div className="sticky top-0 bg-white z-10 flex items-center justify-between px-6 py-4 border-b border-[var(--border)] rounded-t-3xl">
          <div><h3 className="font-display text-xl">Detalles del pastel</h3><p className="text-xs text-[var(--muted-foreground)] mt-0.5">{item}</p></div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><X size={16}/></button>
        </div>
        <div className="p-6 space-y-5">
          <div><p className="text-sm font-semibold mb-2">🍮 Relleno <span className="text-[var(--rose)]">*</span></p><div className="flex flex-wrap gap-2">{FILLINGS.map(f=><Pill key={f} label={f} active={d.filling===f} onClick={()=>s("filling",d.filling===f?"":f)}/>)}</div></div>
          <div><p className="text-sm font-semibold mb-2">🎂 Masa <span className="text-[var(--rose)]">*</span></p><div className="flex flex-wrap gap-2">{MASAS.map(m=><Pill key={m} label={m} active={d.masa===m} onClick={()=>s("masa",d.masa===m?"":m)}/>)}</div></div>
          <div>
            <p className="text-sm font-semibold mb-2">⚖️ Tamaño <span className="text-[var(--rose)]">*</span></p>
            <div className="flex flex-wrap gap-2">{["1 libra","1.5 libras","2 libras","3 libras","4 libras","5 libras"].map(sz=><Pill key={sz} label={sz} active={d.size===sz} onClick={()=>s("size",d.size===sz?"":sz)}/>)}</div>
            <input type="text" placeholder="O escribe el tamaño personalizado..." value={["1 libra","1.5 libras","2 libras","3 libras","4 libras","5 libras"].includes(d.size)?"":d.size} onChange={e=>s("size",e.target.value)} className="mt-2 w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
          </div>
          <div><p className="text-sm font-semibold mb-2">🎨 Colores para decoración</p><input type="text" placeholder="ej. rosa, dorado, blanco..." value={d.colors} onChange={e=>s("colors",e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/></div>
          <div><p className="text-sm font-semibold mb-2">✍️ Mensaje <span className="text-[var(--muted-foreground)] font-normal">(opcional)</span></p><input type="text" placeholder="ej. Feliz cumpleaños María..." value={d.message} onChange={e=>s("message",e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/></div>
          <button type="button" disabled={!d.filling||!d.masa||!d.size} onClick={()=>{onSave(d);onClose();}}
            className="w-full py-3.5 rounded-2xl text-white font-semibold hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{background:BTN}}>
            <CheckCircle2 size={18}/> Confirmar detalles
          </button>
        </div>
      </div>
    </div>
  );
}

function StepHeader({n,label}:{n:number;label:string}) {
  return (
    <h2 className="font-display text-xl mb-4 flex items-center gap-2">
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{background:BTN}}>{n}</span>
      {label}
    </h2>
  );
}

function CotizarForm() {
  const searchParams = useSearchParams();
  const [form,setForm] = useState<FormState>(EMPTY);
  const [cakeDetails,setCakeDetails] = useState<Record<string,CakeDetail>>({});
  const [pendingCakeItem,setPendingCakeItem] = useState<string|null>(null);
  const [imageFiles,setImageFiles] = useState<File[]>([]);
  const [imagePreviews,setImagePreviews] = useState<string[]>([]);
  const [submitting,setSubmitting] = useState(false);
  const [uploadProgress,setUploadProgress] = useState("");
  const [submitted,setSubmitted] = useState(false);
  const [error,setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    const ev=searchParams.get("eventType")??"";
    const item=searchParams.get("item")??"";
    setForm(p=>({...p,eventType:ev&&EVENT_TYPES.includes(ev)?ev:p.eventType,selectedItems:item?[item]:p.selectedItems}));
  },[searchParams]);

  const set=(k:keyof FormState,v:string)=>setForm(p=>({...p,[k]:v}));
  const toggleItem=(item:string)=>{
    const already=form.selectedItems.includes(item);
    if(!already&&CAKE_ITEMS.has(item)){setPendingCakeItem(item);}
    else{setForm(p=>({...p,selectedItems:already?p.selectedItems.filter(x=>x!==item):[...p.selectedItems,item]}));if(already)setCakeDetails(p=>{const n={...p};delete n[item];return n;});}
  };
  const handleCakeSave=(detail:CakeDetail)=>{
    if(!pendingCakeItem)return;
    setForm(p=>({...p,selectedItems:[...p.selectedItems,pendingCakeItem]}));
    setCakeDetails(p=>({...p,[pendingCakeItem]:detail}));
    setPendingCakeItem(null);
  };

  // Correct: batch both state updates in one call each
  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - imageFiles.length;
    if (remaining <= 0) return;
    const newFiles = Array.from(files).slice(0, remaining);
    // Batch update both arrays at once (not in forEach)
    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    // Reset input so the same file can be selected again
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeImage=(i:number)=>{
    URL.revokeObjectURL(imagePreviews[i]);
    setImageFiles(p=>p.filter((_,idx)=>idx!==i));
    setImagePreviews(p=>p.filter((_,idx)=>idx!==i));
  };

  const isValid=!!(form.name.trim()&&form.phone.trim()&&form.eventType&&form.eventDate&&form.guestCount.trim());

  const handleSubmit=async()=>{
    if(!isValid||submitting)return;
    setSubmitting(true); setError(""); setUploadProgress("");
    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress(`Subiendo foto ${i + 1} de ${imageFiles.length}…`);
        const fd = new FormData();
        fd.append("file", file);
        let res: Response;
        try {
          res = await fetch("/api/orders/upload", { method: "POST", body: fd });
        } catch (networkErr) {
          throw new Error(`Error de red al subir foto ${i + 1}. Verifica tu conexión.`);
        }
        const data = await res.json().catch(() => ({ error: `Respuesta inválida del servidor (${res.status})` }));
        if (!res.ok || !data.url) {
          throw new Error(`Error en foto ${i + 1}: ${data.error ?? `Status ${res.status}`}`);
        }
        imageUrls.push(data.url);
      }
      setUploadProgress("Guardando pedido…");
      const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,cakeDetails,imageUrls})});
      if(!res.ok) throw new Error("Error al guardar el pedido");
      setSubmitted(true);
    } catch(e:unknown){ setError(e instanceof Error?e.message:"Ocurrió un error. Por favor intenta de nuevo."); }
    finally{ setSubmitting(false); setUploadProgress(""); }
  };

  if(submitted){
    return(
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
        <div className="max-w-md w-full text-center bg-[var(--card)] border border-[var(--border)]/60 rounded-3xl shadow-md p-10">
          <CheckCircle2 size={52} className="mx-auto mb-4" style={{color:"#f07097"}}/>
          <h2 className="font-display text-3xl">¡Solicitud enviada!</h2>
          <p className="text-[var(--muted-foreground)] mt-3 leading-relaxed">Recibimos tu cotización, <strong>{form.name}</strong>. Te contactamos por WhatsApp pronto.</p>
          <div className="mt-5 p-4 rounded-2xl bg-[var(--muted)]/50 text-sm text-left space-y-1">
            <p><span className="font-medium">Evento:</span> {form.eventType}</p>
            <p><span className="font-medium">Fecha:</span> {form.eventDate}{form.deliveryTime?` · ${form.deliveryTime}`:""}</p>
          </div>
          <button onClick={()=>{setForm(EMPTY);setImageFiles([]);setImagePreviews([]);setCakeDetails({});setSubmitted(false);}}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold hover:opacity-90 transition" style={{background:BTN}}>
            Hacer otra cotización
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-[var(--background)]">
      {pendingCakeItem&&<CakePopup item={pendingCakeItem} onSave={handleCakeSave} onClose={()=>setPendingCakeItem(null)}/>}
      <section className="relative overflow-hidden py-12 px-6 text-center">
        <div className="pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl"/>
        <span className="relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--rose)]/10 border border-[var(--rose)]/20 text-xs uppercase tracking-widest text-[var(--rose)]">
          <Sparkles size={13}/> Cotización sin compromiso
        </span>
        <h1 className="font-display text-3xl md:text-4xl mt-3 relative">Cotiza tu evento</h1>
        <p className="text-[var(--muted-foreground)] mt-3 max-w-xl mx-auto leading-relaxed relative">Cuéntanos qué imaginas. Te contactamos en menos de 24 horas.</p>
      </section>

      <section className="relative max-w-2xl mx-auto px-6 pb-20">
        <div className="rounded-3xl p-8 md:p-10 space-y-8 border"
          style={{background:"rgba(255,255,255,0.65)",backdropFilter:"blur(10px)",WebkitBackdropFilter:"blur(10px)",borderColor:"rgba(255,255,255,0.75)",boxShadow:"0 8px 40px rgba(240,112,151,0.10)"}}>

          {/* Step 1 */}
          <div>
            <StepHeader n={1} label="Tus datos"/>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5"><span className="text-sm font-medium">Nombre completo <span className="text-[var(--rose)]">*</span></span>
                <input type="text" placeholder="Tu nombre" value={form.name} onChange={e=>set("name",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/></label>
              <label className="flex flex-col gap-1.5"><span className="text-sm font-medium">WhatsApp / Teléfono <span className="text-[var(--rose)]">*</span></span>
                <input type="tel" placeholder="+1 809 000 0000" value={form.phone} onChange={e=>set("phone",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/></label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="text-sm font-medium">Correo <span className="text-[var(--muted-foreground)] font-normal">(opcional)</span></span>
                <input type="email" placeholder="tu@correo.com" value={form.email} onChange={e=>set("email",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/></label>
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50"/>

          {/* Step 2 */}
          <div>
            <StepHeader n={2} label="Tu evento"/>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium flex items-center gap-1.5 mb-2"><Cake size={15} className="text-[var(--rose)]"/> Tipo <span className="text-[var(--rose)]">*</span></span>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(type=>(
                    <button key={type} type="button" onClick={()=>set("eventType",type)}
                      className={`px-4 py-2 rounded-full text-sm border transition ${form.eventType===type?"text-white border-transparent":"border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)] hover:text-[var(--rose)]"}`}
                      style={form.eventType===type?{background:BTN}:{}}>{type}</button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5"><CalendarDays size={15} className="text-[var(--rose)]"/> Fecha <span className="text-[var(--rose)]">*</span></span>
                  <input type="date" value={form.eventDate} onChange={e=>set("eventDate",e.target.value)} min={new Date().toISOString().split("T")[0]} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5"><Clock size={15} className="text-[var(--rose)]"/> Hora de entrega <span className="text-[var(--muted-foreground)] font-normal text-xs">(opcional)</span></span>
                  <input type="time" value={form.deliveryTime} onChange={e=>set("deliveryTime",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-medium flex items-center gap-1.5"><Users size={15} className="text-[var(--rose)]"/> Personas <span className="text-[var(--rose)]">*</span></span>
                  <input type="number" placeholder="ej. 50" min={1} value={form.guestCount} onChange={e=>set("guestCount",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50"/>

          {/* Step 3 */}
          <div>
            <StepHeader n={3} label="¿Qué te interesa?"/>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 -mt-2">Los pasteles pedirán detalles adicionales</p>
            <div className="space-y-4">
              {PRODUCT_CATEGORIES.map(cat=>(
                <div key={cat.label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-2">{cat.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map(item=>{
                      const selected=form.selectedItems.includes(item);
                      const hasCakeDetail=cakeDetails[item];
                      return(
                        <div key={item} className="relative">
                          <button type="button" onClick={()=>toggleItem(item)}
                            className={`px-3.5 py-1.5 rounded-full text-sm border transition flex items-center gap-1.5 ${selected?"text-[var(--rose)] border-[var(--rose)]/40 bg-[var(--rose)]/10":"border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)]"}`}>
                            {item}
                            {selected&&cat.isCake&&<span className="w-4 h-4 rounded-full bg-[var(--rose)] text-white text-[10px] flex items-center justify-center font-bold">✓</span>}
                          </button>
                          {selected&&cat.isCake&&hasCakeDetail&&(
                            <button type="button" onClick={()=>setPendingCakeItem(item)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center" style={{background:BTN}} title="Editar">✏</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {cat.isCake&&form.selectedItems.some(i=>cat.items.includes(i))&&(
                    <div className="mt-2 space-y-1.5">
                      {form.selectedItems.filter(i=>cat.items.includes(i)).map(item=>{
                        const d=cakeDetails[item]; if(!d)return null;
                        return(
                          <div key={item} className="text-xs bg-[var(--rose)]/5 border border-[var(--rose)]/15 rounded-xl px-3 py-2 flex items-start gap-2">
                            <Cake size={12} className="text-[var(--rose)] shrink-0 mt-0.5"/>
                            <div><span className="font-semibold text-[var(--rose)]">{item}: </span><span className="text-[var(--muted-foreground)]">{d.masa} · {d.filling} · {d.size}{d.colors?` · Colores: ${d.colors}`:""}{d.message?` · "${d.message}"`:""}</span></div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50"/>

          {/* Step 4 — Images */}
          <div>
            <StepHeader n={4} label="Imágenes de inspiración"/>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 -mt-2">Sube hasta 5 fotos de referencia (opcional)</p>
            {imagePreviews.length>0&&(
              <div className="flex flex-wrap gap-3 mb-4">
                {imagePreviews.map((src,i)=>(
                  <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-[var(--border)] group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt="" className="w-full h-full object-cover"/>
                    <button onClick={()=>removeImage(i)} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"><X size={16}/></button>
                  </div>
                ))}
              </div>
            )}
            {imageFiles.length<5&&(
              <button type="button" onClick={()=>fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)] transition text-sm w-full justify-center">
                <ImagePlus size={18}/>
                {imageFiles.length===0?"Agregar imágenes de referencia":`Agregar más (${imageFiles.length}/5)`}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>handleImages(e.target.files)}/>
          </div>

          <div className="border-t border-[var(--border)]/50"/>

          {/* Step 5 */}
          <div>
            <StepHeader n={5} label="Notas adicionales"/>
            <textarea rows={4} placeholder="Cuéntanos tu idea, colores, sabores, inspiración..." value={form.notes} onChange={e=>set("notes",e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:border-[var(--rose)] transition"/>
          </div>

          {error&&<p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2">{error}</p>}

          <button type="button" onClick={handleSubmit} disabled={!isValid||submitting}
            className={`w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 transition shadow-md ${isValid&&!submitting?"hover:opacity-90 cursor-pointer":"opacity-40 cursor-not-allowed"}`}
            style={{background:BTN}}>
            {submitting?(
              <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> {uploadProgress||"Enviando…"}</>
            ):<>Enviar cotización <ArrowRight size={18}/></>}
          </button>
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            <span className="text-[var(--rose)]">*</span> obligatorios · Te contactamos por WhatsApp en menos de 24 horas.
          </p>
        </div>
      </section>
    </div>
  );
}

export default function CotizarPage() { return <Suspense><CotizarForm/></Suspense>; }
