"use client";
import { useState, useEffect, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

const MONTH_NAMES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAY_NAMES = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

// ── DatePicker ───────────────────────────────────────────────
export function DatePicker({
  value, onChange, minDate, maxDate, placeholder = "Selecciona una fecha",
}: {
  value: string;
  onChange: (date: string) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const today = new Date(); today.setHours(0,0,0,0);
  const min = minDate ?? today;
  const max = maxDate ?? new Date(today.getFullYear(), today.getMonth()+18, 0);

  const parsed = value ? new Date(value+"T00:00:00") : null;
  const [displayMonth, setDisplayMonth] = useState(parsed?.getMonth() ?? today.getMonth());
  const [displayYear,  setDisplayYear]  = useState(parsed?.getFullYear() ?? today.getFullYear());

  useEffect(()=>{
    if(!isOpen) return;
    const fn=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown",fn);
    return ()=>document.removeEventListener("mousedown",fn);
  },[isOpen]);

  const canGoPrev = () => new Date(displayYear, displayMonth-1, 1) >= new Date(min.getFullYear(), min.getMonth(), 1);
  const canGoNext = () => new Date(displayYear, displayMonth+1, 1) <= new Date(max.getFullYear(), max.getMonth(), 1);

  const prevMonth = () => {
    if(!canGoPrev()) return;
    if(displayMonth===0){setDisplayMonth(11);setDisplayYear(y=>y-1);}
    else setDisplayMonth(m=>m-1);
  };
  const nextMonth = () => {
    if(!canGoNext()) return;
    if(displayMonth===11){setDisplayMonth(0);setDisplayYear(y=>y+1);}
    else setDisplayMonth(m=>m+1);
  };

  const isDisabled = (day:number) => {
    const d=new Date(displayYear,displayMonth,day); d.setHours(0,0,0,0);
    return d<min||d>max;
  };
  const isSelected = (day:number) => {
    if(!value) return false;
    const [y,m,d]=value.split("-").map(Number);
    return d===day&&m-1===displayMonth&&y===displayYear;
  };
  const isToday = (day:number) => {
    const d=new Date(displayYear,displayMonth,day); d.setHours(0,0,0,0);
    return d.getTime()===today.getTime();
  };

  const select = (day:number) => {
    onChange(`${displayYear}-${String(displayMonth+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`);
    setIsOpen(false);
  };

  const displayValue = value
    ? new Date(value+"T00:00:00").toLocaleDateString("es-DO",{day:"numeric",month:"long",year:"numeric"})
    : placeholder;

  const daysInMonth = new Date(displayYear, displayMonth+1, 0).getDate();
  const firstDay    = new Date(displayYear, displayMonth, 1).getDay();

  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={()=>setIsOpen(v=>!v)}
        className="w-full px-4 py-2.5 rounded-xl border border-[#ede8e0] bg-[#faf8f5] text-sm focus:outline-none focus:border-[#f07097] transition text-left flex items-center justify-between"
        style={isOpen?{borderColor:"#f07097"}:{}}>
        <span className={value?"text-gray-800":"text-gray-400"}>{displayValue}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {isOpen&&(
        <div className="modal-pop absolute z-[60] top-full mt-2 bg-white/95 backdrop-blur-md border border-[#ede8e0] rounded-2xl shadow-2xl p-4 w-72">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} disabled={!canGoPrev()}
              className="p-1.5 rounded-lg hover:bg-[#fef7f9] disabled:opacity-30 transition"><ChevronUp size={16} className="text-gray-500"/></button>
            <div className="text-center">
              <p className="font-semibold text-sm" style={{color:"#f07097"}}>{MONTH_NAMES[displayMonth]}</p>
              <div className="flex items-center justify-center gap-2 mt-0.5">
                <button type="button" onClick={()=>setDisplayYear(y=>y-1)} disabled={displayYear<=min.getFullYear()}
                  className="text-xs text-gray-400 hover:text-[#f07097] disabled:opacity-30 transition">‹</button>
                <span className="text-xs text-gray-500">{displayYear}</span>
                <button type="button" onClick={()=>setDisplayYear(y=>y+1)} disabled={displayYear>=max.getFullYear()}
                  className="text-xs text-gray-400 hover:text-[#f07097] disabled:opacity-30 transition">›</button>
              </div>
            </div>
            <button type="button" onClick={nextMonth} disabled={!canGoNext()}
              className="p-1.5 rounded-lg hover:bg-[#fef7f9] disabled:opacity-30 transition"><ChevronDown size={16} className="text-gray-500"/></button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_NAMES.map(d=><div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>)}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
            {Array.from({length:daysInMonth}).map((_,i)=>{
              const day=i+1;
              const selected=isSelected(day);
              const disabled=isDisabled(day);
              const todayDay=isToday(day);
              return(
                <button key={day} type="button" onClick={()=>!disabled&&select(day)} disabled={disabled}
                  className={`h-8 rounded-lg text-xs font-medium transition ${
                    selected?"text-white bg-gradient-rose shadow-glow":
                    disabled?"text-gray-300 cursor-not-allowed":
                    todayDay?"text-[#f07097] font-bold hover:bg-[#fef7f9]":
                    "text-gray-700 hover:bg-[#fef7f9] hover:text-[#f07097]"
                  }`}>
                  {day}
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-[#f0e8e0]">
            <button type="button" onClick={()=>setIsOpen(false)}
              className="flex-1 py-2 rounded-lg text-sm text-gray-500 border border-[#ede8e0] hover:bg-gray-50 transition">Cancelar</button>
            {value&&(
              <button type="button" onClick={()=>{onChange("");setIsOpen(false);}}
                className="flex-1 py-2 rounded-lg text-sm text-gray-400 border border-[#ede8e0] hover:bg-gray-50 transition">Limpiar</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── TimePicker ───────────────────────────────────────────────
export function TimePicker({
  value, onChange, placeholder = "Selecciona una hora",
}: {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const to12h = (t24:string) => {
    if(!t24) return {h:"10",m:"00",p:"AM"};
    const [h,m]=t24.split(":");
    const h24=parseInt(h);
    return {h:String(h24%12||12).padStart(2,"0"),m,p:h24>=12?"PM":"AM"};
  };
  const to24h = (h:string,m:string,p:string) => {
    let hh=parseInt(h)||0;
    if(p==="PM"&&hh!==12) hh+=12;
    if(p==="AM"&&hh===12) hh=0;
    return `${String(hh).padStart(2,"0")}:${m.padStart(2,"0")}`;
  };

  const init = to12h(value);
  const [h,setH] = useState(init.h);
  const [m,setM] = useState(init.m);
  const [p,setP] = useState(init.p);

  useEffect(()=>{
    if(!isOpen) return;
    const fn=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node)) setIsOpen(false); };
    document.addEventListener("mousedown",fn);
    return ()=>document.removeEventListener("mousedown",fn);
  },[isOpen]);

  const confirm = () => { onChange(to24h(h,m,p)); setIsOpen(false); };
  const displayText = value ? `${h}:${m} ${p}` : placeholder;

  const selClass = "w-full px-3 py-2 rounded-lg border border-[#ede8e0] bg-[#faf8f5] text-sm font-semibold text-center focus:outline-none focus:border-[#f07097] appearance-none cursor-pointer transition";

  return (
    <div className="relative w-full" ref={ref}>
      <button type="button" onClick={()=>setIsOpen(v=>!v)}
        className="w-full px-4 py-2.5 rounded-xl border border-[#ede8e0] bg-[#faf8f5] text-sm focus:outline-none focus:border-[#f07097] transition text-left flex items-center justify-between"
        style={isOpen?{borderColor:"#f07097"}:{}}>
        <span className={value?"text-gray-800":"text-gray-400"}>{displayText}</span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {isOpen&&(
        <div className="modal-pop absolute z-[60] top-full mt-2 bg-white/95 backdrop-blur-md border border-[#ede8e0] rounded-2xl shadow-2xl p-5 w-64">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">Hora de entrega</p>
          <div className="flex items-center gap-2 mb-5">
            <select value={h} onChange={e=>setH(e.target.value)} className={selClass}>
              {Array.from({length:12},(_,i)=>String(i+1).padStart(2,"0")).map(hv=>(
                <option key={hv} value={hv}>{hv}</option>
              ))}
            </select>
            <span className="text-xl font-bold text-gray-400 shrink-0">:</span>
            <select value={m} onChange={e=>setM(e.target.value)} className={selClass}>
              {["00","15","30","45"].map(mv=><option key={mv} value={mv}>{mv}</option>)}
            </select>
            <select value={p} onChange={e=>setP(e.target.value)} className={selClass}>
              <option value="AM">AM</option>
              <option value="PM">PM</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={()=>setIsOpen(false)}
              className="flex-1 py-2 rounded-lg text-sm text-gray-500 border border-[#ede8e0] hover:bg-gray-50 transition">Cancelar</button>
            <button type="button" onClick={confirm}
              className="flex-1 py-2 rounded-lg text-white text-sm font-semibold bg-gradient-rose hover:opacity-90 transition">Confirmar</button>
          </div>
        </div>
      )}
    </div>
  );
}
