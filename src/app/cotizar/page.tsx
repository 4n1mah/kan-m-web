"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays, Users, Cake, Sparkles, ArrowRight,
  CheckCircle2, ImagePlus, X, Clock, ChevronUp, ChevronDown, AlertCircle,
} from "lucide-react";
import { formatDominicanPhone, validateDominicanPhone } from "@/lib/phone";
import CakePopup from "@/components/CakePopup";
import { type CakeDetail } from "@/lib/cakeMenu";
import { useLang } from "@/lib/i18n/LanguageProvider";

const EVENT_TYPES = ["Cumpleaños","Boda / Compromiso","Baby shower","Corporativo","Graduación","Quinceañera","Otro"];
const PRODUCT_CATEGORIES = [
  { label: "Pasteles", items: ["Pastel personalizado","Naked cake","Drip cake","Pastel de bodas"], isCake: true, note: null },
  { label: "Postres", items: ["Macarons","Brownies","Alfajores","Cheesecake"], isCake: false, note: "La cantidad y presentación se ajustan según tu evento." },
  { label: "Mesa dulce", items: ["Mesa dulce completa","Mesa de postres mini"], isCake: false, note: "La composición se personaliza según el número de personas y la temática." },
  { label: "Brunch / Catering", items: ["Brunch para grupo","Catering de evento"], isCake: false, note: "El menú se define en base a tus necesidades y tipo de evento." },
];
const CAKE_ITEMS = new Set(PRODUCT_CATEGORIES.filter(c=>c.isCake).flatMap(c=>c.items));

type FormState = { name:string; phone:string; email:string; eventType:string; eventDate:string; deliveryTime:string; guestCount:string; selectedItems:string[]; notes:string; deliveryMethod:string; };
const EMPTY:FormState = { name:"",phone:"",email:"",eventType:"",eventDate:"",deliveryTime:"",guestCount:"",selectedItems:[],notes:"",deliveryMethod:"" };

function StepHeader({n,label}:{n:number;label:string}) {
  return (
    <h2 className="font-display text-xl mb-4 flex items-center gap-2">
      <span className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 bg-gradient-rose shadow-glow">{n}</span>
      {label}
    </h2>
  );
}

// Reemplaza solo la función DatePicker con esta versión corregida:

function DatePicker({ value, onChange }: { value: string; onChange: (date: string) => void }) {
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Asegurar que sea media noche
  
  const minDate = new Date(today);
  minDate.setDate(minDate.getDate() + 3); // Mínimo 3 días de antelación
  
  const maxDate = new Date(today);
  maxDate.setMonth(maxDate.getMonth() + 2); // 2 meses desde hoy

  const [displayMonth, setDisplayMonth] = useState(value ? new Date(value + "T00:00:00").getMonth() : today.getMonth());
  const [displayYear, setDisplayYear] = useState(value ? new Date(value + "T00:00:00").getFullYear() : today.getFullYear());

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const canChangeYear = (year: number) => {
    const testDate = new Date(year, displayMonth, 1);
    testDate.setHours(0, 0, 0, 0);
    return testDate <= maxDate;
  };

  const canChangeMonth = (month: number, year: number) => {
    const testDate = new Date(year, month, 1);
    testDate.setHours(0, 0, 0, 0);
    return testDate <= maxDate && testDate >= new Date(today.getFullYear(), today.getMonth(), 1);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const isDateDisabled = (day: number) => {
    const testDate = new Date(displayYear, displayMonth, day);
    testDate.setHours(0, 0, 0, 0);
    return testDate < minDate || testDate > maxDate;
  };

  const isDateSelected = (day: number) => {
    if (!value) return false;
    const [year, month, dayStr] = value.split("-");
    return parseInt(dayStr) === day && parseInt(month) - 1 === displayMonth && parseInt(year) === displayYear;
  };

  const handleDateSelect = (day: number) => {
    const dateStr = `${displayYear}-${String(displayMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const prevMonth = () => {
    let newMonth = displayMonth - 1;
    let newYear = displayYear;
    if (newMonth < 0) {
      newMonth = 11;
      newYear--;
    }
    if (canChangeMonth(newMonth, newYear)) {
      setDisplayMonth(newMonth);
      setDisplayYear(newYear);
    }
  };

  const nextMonth = () => {
    let newMonth = displayMonth + 1;
    let newYear = displayYear;
    if (newMonth > 11) {
      newMonth = 0;
      newYear++;
    }
    if (canChangeMonth(newMonth, newYear)) {
      setDisplayMonth(newMonth);
      setDisplayYear(newYear);
    }
  };

  const prevYear = () => {
    if (canChangeYear(displayYear - 1)) {
      setDisplayYear(displayYear - 1);
    }
  };

  const nextYear = () => {
    if (canChangeYear(displayYear + 1)) {
      setDisplayYear(displayYear + 1);
    }
  };

  const monthNames = t.quote.months;
  const dayNames = t.quote.days;
  const daysInMonth = getDaysInMonth(displayMonth, displayYear);
  const firstDay = getFirstDayOfMonth(displayMonth, displayYear);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const displayValue = value ? new Date(value + "T00:00:00").toLocaleDateString(t.quote.dateLocale, { day: "numeric", month: "long", year: "numeric" }) : t.quote.selectDate;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition text-left"
      >
        {displayValue}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 bg-white border border-[var(--border)] rounded-2xl shadow-xl p-4 w-full max-w-xs">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canChangeMonth(displayMonth - 1 < 0 ? 11 : displayMonth - 1, displayMonth - 1 < 0 ? displayYear - 1 : displayYear)}
              className="p-1 hover:bg-[var(--rose)]/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp size={18} className="text-[var(--muted-foreground)]" />
            </button>
            <div className="text-center">
              <p className="font-semibold text-[var(--rose)]">{monthNames[displayMonth]} {displayYear}</p>
            </div>
            <button
              type="button"
              onClick={nextMonth}
              disabled={!canChangeMonth(displayMonth + 1 > 11 ? 0 : displayMonth + 1, displayMonth + 1 > 11 ? displayYear + 1 : displayYear)}
              className="p-1 hover:bg-[var(--rose)]/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown size={18} className="text-[var(--muted-foreground)]" />
            </button>
          </div>

          <div className="flex items-center justify-between mb-4 px-2">
            <button
              type="button"
              onClick={prevYear}
              disabled={!canChangeYear(displayYear - 1)}
              className="p-1 hover:bg-[var(--rose)]/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronUp size={16} className="text-[var(--muted-foreground)]" />
            </button>
            <span className="text-sm font-medium text-[var(--muted-foreground)]">{t.quote.yearLabel} {displayYear}</span>
            <button
              type="button"
              onClick={nextYear}
              disabled={!canChangeYear(displayYear + 1)}
              className="p-1 hover:bg-[var(--rose)]/10 rounded transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronDown size={16} className="text-[var(--muted-foreground)]" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(day => (
              <div key={day} className="text-center text-xs font-semibold text-[var(--muted-foreground)] py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {emptyDays.map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}
            {days.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => handleDateSelect(day)}
                disabled={isDateDisabled(day)}
                className={`h-8 rounded-lg text-sm font-medium transition ${
                  isDateSelected(day)
                    ? "text-white bg-gradient-rose shadow-glow"
                    : isDateDisabled(day)
                    ? "text-[var(--muted-foreground)]/30 cursor-not-allowed"
                    : "text-[var(--muted-foreground)] hover:bg-[var(--rose)]/10 hover:text-[var(--rose)]"
                }`}
              >
                {day}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 rounded-lg text-[var(--rose)] font-semibold text-sm transition border border-[var(--rose)] hover:bg-[var(--rose)]/5"
            >
              {t.quote.cancel}
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="flex-1 py-2 rounded-lg text-white font-semibold text-sm transition hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #999 0%, #aaa 50%, #888 100%)" }}
              >
                {t.quote.clear}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TimePicker({ value, onChange }: { value: string; onChange: (time: string) => void }) {
  const { t } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const convertTo12h = (time24: string) => {
    if (!time24) return { hours: "10", minutes: "00", period: "AM" };
    const [h, m] = time24.split(":");
    const hours24 = parseInt(h);
    const period = hours24 >= 12 ? "PM" : "AM";
    const hours12 = hours24 % 12 || 12;
    return {
      hours: String(hours12).padStart(2, "0"),
      minutes: m,
      period,
    };
  };

  const convertTo24h = (hours: string, minutes: string, period: string) => {
    let h = parseInt(hours) || 0;
    if (period === "PM" && h !== 12) h += 12;
    if (period === "AM" && h === 12) h = 0;
    return `${String(h).padStart(2, "0")}:${minutes.padStart(2, "0")}`;
  };

  const { hours: initialHours, minutes: initialMinutes, period: initialPeriod } = convertTo12h(value);
  const [displayHours, setDisplayHours] = useState(initialHours);
  const [displayMinutes, setDisplayMinutes] = useState(initialMinutes);
  const [displayPeriod, setDisplayPeriod] = useState(initialPeriod);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const hoursArray = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutesArray = ["00", "15", "30", "45"];

  const handleConfirm = () => {
    const newTime24 = convertTo24h(displayHours, displayMinutes, displayPeriod);
    onChange(newTime24);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const displayText = value ? `${displayHours}:${displayMinutes} ${displayPeriod}` : t.quote.selectTime;

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition text-left"
      >
        {displayText}
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full mt-2 bg-white border border-[var(--border)] rounded-2xl shadow-xl p-6 w-full max-w-xs">
          <h3 className="text-sm font-semibold text-[var(--muted-foreground)] mb-4">Select Time</h3>
          
          {/* Selectores */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {/* Horas Dropdown */}
            <div className="flex-1">
              <select
                value={displayHours}
                onChange={(e) => setDisplayHours(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-semibold text-center focus:outline-none focus:border-[var(--rose)] appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  paddingRight: "28px",
                }}
              >
                {hoursArray.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>

            {/* Separador */}
            <span className="text-2xl font-bold text-[var(--muted-foreground)]">:</span>

            {/* Minutos Dropdown */}
            <div className="flex-1">
              <select
                value={displayMinutes}
                onChange={(e) => setDisplayMinutes(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-semibold text-center focus:outline-none focus:border-[var(--rose)] appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  paddingRight: "28px",
                }}
              >
                {minutesArray.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* AM/PM */}
            <div className="flex-1">
              <select
                value={displayPeriod}
                onChange={(e) => setDisplayPeriod(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-semibold text-center focus:outline-none focus:border-[var(--rose)] appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 8px center",
                  paddingRight: "28px",
                }}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-2.5 rounded-lg text-[var(--rose)] font-semibold text-sm transition hover:bg-[var(--rose)]/5"
            >
              {t.quote.cancel}
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="flex-1 py-2.5 rounded-lg text-white font-semibold text-sm transition hover:opacity-90 bg-gradient-rose"
            >
              {t.quote.save}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CotizarForm() {
  const { t } = useLang();
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

  const handleImages = (files: FileList | null) => {
    if (!files) return;
    const remaining = 5 - imageFiles.length;
    if (remaining <= 0) return;
    const newFiles = Array.from(files).slice(0, remaining);
    setImageFiles(prev => [...prev, ...newFiles]);
    setImagePreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = "";
  };
  const removeImage=(i:number)=>{
    URL.revokeObjectURL(imagePreviews[i]);
    setImageFiles(p=>p.filter((_,idx)=>idx!==i));
    setImagePreviews(p=>p.filter((_,idx)=>idx!==i));
  };

  const isValid=!!(form.name.trim()&&validateDominicanPhone(form.phone)&&form.eventType&&form.eventDate&&form.guestCount.trim());

  const handleSubmit=async()=>{
    if(!isValid||submitting)return;
    setSubmitting(true); setError(""); setUploadProgress("");
    try {
      const imageUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        setUploadProgress(`${t.quote.uploadingPhotoPre}${i + 1}${t.quote.uploadingPhotoMid}${imageFiles.length}…`);
        const fd = new FormData();
        fd.append("file", file);
        let res: Response;
        try {
          res = await fetch("/api/orders/upload", { method: "POST", body: fd });
        } catch (networkErr) {
          throw new Error(`${t.quote.errNetworkPre}${i + 1}${t.quote.errNetworkSuf}`);
        }
        const data = await res.json().catch(() => ({ error: `Respuesta inválida del servidor (${res.status})` }));
        if (!res.ok || !data.url) {
          throw new Error(`Error en foto ${i + 1}: ${data.error ?? `Status ${res.status}`}`);
        }
        imageUrls.push(data.url);
      }
      setUploadProgress(t.quote.savingOrder);
      const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,cakeDetails,imageUrls})});
      if(!res.ok) throw new Error(t.quote.errSaveOrder);
      setSubmitted(true);
    } catch(e:unknown){ setError(e instanceof Error?e.message:t.quote.errGeneric); }
    finally{ setSubmitting(false); setUploadProgress(""); }
  };

  if(submitted){
    return(
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-6">
        <div className="modal-pop max-w-md w-full text-center glass rounded-3xl shadow-md p-10">
          <CheckCircle2 size={52} className="mx-auto mb-4" style={{color:"#f07097"}}/>
          <h2 className="font-display text-3xl text-gradient-rose">{t.quote.successTitle}</h2>
          <p className="text-[var(--muted-foreground)] mt-3 leading-relaxed">{t.quote.successMsgPre}<strong>{form.name}</strong>{t.quote.successMsgSuf}</p>
          <div className="mt-5 p-4 rounded-2xl bg-[var(--muted)]/50 text-sm text-left space-y-1">
            <p><span className="font-medium">{t.quote.summaryEvent}</span> {t.quote.eventTypeLabels[form.eventType] ?? form.eventType}</p>
            <p><span className="font-medium">{t.quote.summaryDate}</span> {form.eventDate}{form.deliveryTime?` · ${form.deliveryTime}`:""}</p>
          </div>
          <button onClick={()=>{setForm(EMPTY);setImageFiles([]);setImagePreviews([]);setCakeDetails({});setSubmitted(false);}}
            className="btn-shine mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold bg-gradient-rose">
            {t.quote.anotherQuote}
          </button>
        </div>
      </div>
    );
  }

  return(
    <div className="min-h-screen bg-[var(--background)]">
      {pendingCakeItem&&<CakePopup item={pendingCakeItem} initial={cakeDetails[pendingCakeItem]??null} onSave={handleCakeSave} onClose={()=>setPendingCakeItem(null)}/>}
      <section className="relative overflow-hidden py-12 md:py-16 px-6 text-center">
        <div className="blob-float pointer-events-none absolute -top-20 -left-20 w-72 h-72 rounded-full bg-[var(--blush)]/30 blur-3xl"/>
        <div className="hero-enter relative">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--rose)]/10 border border-[var(--rose)]/20 text-xs uppercase tracking-widest text-[var(--rose)]">
            <Sparkles size={13}/> {t.quote.badge}
          </span>
          <h1 className="font-display text-3xl md:text-4xl mt-3">{t.quote.title}</h1>
          <p className="text-[var(--muted-foreground)] mt-3 max-w-xl mx-auto leading-relaxed">{t.quote.subtitle}</p>
        </div>
      </section>

      <section className="relative max-w-2xl mx-auto px-6 pb-20">
        <div className="glass rounded-3xl p-8 md:p-10 space-y-8">

          {/* Step 1 */}
          <div>
            <StepHeader n={1} label={t.quote.step1}/>
            <div className="grid sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5"><span className="text-sm font-medium">{t.quote.fullName} <span className="text-[var(--rose)]">*</span></span>
                <input type="text" placeholder={t.quote.namePlaceholder} value={form.name} onChange={e=>set("name",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
              </label>
              <label className="flex flex-col gap-1.5"><span className="text-sm font-medium">{t.quote.phoneLabel} <span className="text-[var(--rose)]">*</span></span>
                <input type="tel" placeholder="809-000-0000" value={form.phone} onChange={e=>set("phone",formatDominicanPhone(e.target.value))} maxLength={12} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
                {form.phone.length>0&&!validateDominicanPhone(form.phone)&&<p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={11}/>{t.quote.phoneError}</p>}
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2"><span className="text-sm font-medium">{t.quote.emailLabel} <span className="text-[var(--muted-foreground)] font-normal">{t.quote.optional}</span></span>
                <input type="email" placeholder="tu@correo.com" value={form.email} onChange={e=>set("email",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
              </label>
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50"/>

          {/* Step 2 */}
          <div>
            <StepHeader n={2} label={t.quote.step2}/>
            <div className="space-y-4">
              <div>
                <span className="text-sm font-medium flex items-center gap-1.5 mb-2"><Cake size={15} className="text-[var(--rose)]"/> {t.quote.typeLabel} <span className="text-[var(--rose)]">*</span></span>
                <div className="flex flex-wrap gap-2">
                  {EVENT_TYPES.map(type=>(
                    <button key={type} type="button" onClick={()=>set("eventType",type)}
                      className={`px-4 py-2 rounded-full text-sm border transition ${form.eventType===type?"text-white border-transparent bg-gradient-rose shadow-glow":"border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)] hover:text-[var(--rose)]"}`}>{t.quote.eventTypeLabels[type] ?? type}</button>
                  ))}
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5"><CalendarDays size={15} className="text-[var(--rose)]"/> {t.quote.dateLabel} <span className="text-[var(--rose)]">*</span></span>
                  <DatePicker value={form.eventDate} onChange={(date) => set("eventDate", date)} />
                  <p className="text-xs text-amber-600 flex items-center gap-1 -mt-0.5"><AlertCircle size={11}/>{t.quote.leadTimeNote}</p>
                </label>
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium flex items-center gap-1.5"><Clock size={15} className="text-[var(--rose)]"/> {t.quote.deliveryTimeLabel} <span className="text-[var(--muted-foreground)] font-normal">{t.quote.optional}</span></span>
                  <TimePicker value={form.deliveryTime} onChange={(time) => set("deliveryTime", time)} />
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-medium flex items-center gap-1.5"><Users size={15} className="text-[var(--rose)]"/> {t.quote.guestsLabel} <span className="text-[var(--rose)]">*</span></span>
                  <input type="number" placeholder={t.quote.guestsPlaceholder} min={1} value={form.guestCount} onChange={e=>set("guestCount",e.target.value)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm focus:outline-none focus:border-[var(--rose)] transition"/>
                </label>
                <label className="flex flex-col gap-1.5 sm:col-span-2">
                  <span className="text-sm font-medium">{t.quote.deliveryMethodLabel}</span>
                  <div className="flex gap-3">
                    {[{id:"pickup",label:t.quote.pickupOption},{id:"delivery",label:t.quote.deliveryOption}].map(opt=>(
                      <button key={opt.id} type="button" onClick={()=>set("deliveryMethod",form.deliveryMethod===opt.id?"":opt.id)}
                        className={`flex-1 px-4 py-2.5 rounded-xl text-sm border-2 font-medium transition ${form.deliveryMethod===opt.id?"text-[var(--rose)] border-[var(--rose)] bg-[var(--rose)]/5":"border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)]/50"}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {t.quote.deliveryCostNote}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-[var(--border)]/50"/>

          {/* Step 3 */}
          <div>
            <StepHeader n={3} label={t.quote.step3}/>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 -mt-2">{t.quote.step3Note}</p>
            <div className="space-y-4">
              {PRODUCT_CATEGORIES.map(cat=>(
                <div key={cat.label}>
                  <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted-foreground)] mb-1">{t.quote.categoryLabels[cat.label] ?? cat.label}</p>
                  {cat.note && <p className="text-xs text-[var(--muted-foreground)]/70 italic mb-2">{t.quote.categoryNotes[cat.label] ?? cat.note}</p>}
                  <div className="flex flex-wrap gap-2">
                    {cat.items.map(item=>{
                      const selected=form.selectedItems.includes(item);
                      const hasCakeDetail=cakeDetails[item];
                      return(
                        <div key={item} className="relative">
                          <button type="button" onClick={()=>toggleItem(item)}
                            className={`px-3.5 py-1.5 rounded-full text-sm border transition flex items-center gap-1.5 ${selected?"text-[var(--rose)] border-[var(--rose)]/40 bg-[var(--rose)]/10":"border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)]"}`}>
                            {t.quote.itemLabels[item] ?? item}
                            {selected&&cat.isCake&&<span className="w-4 h-4 rounded-full bg-[var(--rose)] text-white text-[10px] flex items-center justify-center font-bold">✓</span>}
                          </button>
                          {selected&&cat.isCake&&hasCakeDetail&&(
                            <button type="button" onClick={()=>setPendingCakeItem(item)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full text-white text-[9px] flex items-center justify-center bg-gradient-rose" title={t.quote.editTitle}>✏</button>
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
                            <div><span className="font-semibold text-[var(--rose)]">{t.quote.itemLabels[item] ?? item}: </span><span className="text-[var(--muted-foreground)]">{d.cakeType==="tradicional"?`${d.masa} · ${d.filling} · ${d.decoration}`:d.flavor} · {d.size}{d.colors?` · ${t.quote.colorsLabel} ${d.colors}`:""}{d.message?` · "${d.message}"`:""}{d.estimatedPrice!=null?` · Est. RD$${d.estimatedPrice.toLocaleString("es-DO")}`:` · ${t.quote.priceToQuote}`}</span></div>
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
            <StepHeader n={4} label={t.quote.step4}/>
            <p className="text-sm text-[var(--muted-foreground)] mb-4 -mt-2">{t.quote.step4Note}</p>
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
                className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--rose)]/50 hover:text-[var(--rose)] transition">
                <ImagePlus size={18}/>
                {imageFiles.length===0?t.quote.addImages:`${t.quote.addMore} (${imageFiles.length}/5)`}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e=>handleImages(e.target.files)}/>
          </div>

          <div className="border-t border-[var(--border)]/50"/>

          {/* Step 5 */}
          <div>
            <StepHeader n={5} label={t.quote.step5}/>
            <textarea rows={4} placeholder={t.quote.notesPlaceholder} value={form.notes} onChange={e=>set("notes",e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm resize-none focus:outline-none focus:border-[var(--rose)] transition"/>
          </div>

          {error&&<p className="text-sm text-red-500 text-center bg-red-50 rounded-xl py-2">{error}</p>}

          <button type="button" onClick={handleSubmit} disabled={!isValid||submitting}
            className={`w-full py-4 rounded-2xl font-semibold text-white text-base flex items-center justify-center gap-2 transition shadow-md bg-gradient-rose ${isValid&&!submitting?"btn-shine cursor-pointer":"opacity-50 cursor-not-allowed"}`}>
            {submitting?(
              <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg> {t.quote.sending}</>
            ):<>{t.quote.submit} <ArrowRight size={18}/></>}
          </button>
          <p className="text-center text-xs text-[var(--muted-foreground)]">
            {t.quote.requiredNote}
          </p>
        </div>
      </section>
    </div>
  );
}

export default function CotizarPage() { return <Suspense><CotizarForm/></Suspense>; }
