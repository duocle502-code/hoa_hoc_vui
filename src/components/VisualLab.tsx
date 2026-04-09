import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Beaker, FlaskConical, Info, RotateCcw, Zap, Loader2, Pipette, Search, AlertTriangle, Flame, Droplets, X, Sparkles, ClipboardList, Atom, ChevronDown, ChevronUp, Wrench, Trash2, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { predictReaction, LabProblemResult } from '../services/geminiService';
import Swal from 'sweetalert2';
import { PlacedEquipment, LabEquipment } from '../types';
import { LAB_EQUIPMENT, EQUIPMENT_CATEGORIES } from '../data/equipmentData';
import { EquipmentSVG } from './EquipmentSVGs';

interface TestTubeData {
  id: number;
  chemicals: string[];
  color: string;
  bubbles: boolean;
  precipitate: boolean;
  message: string;
  isReacting: boolean;
}

interface VisualLabProps {
  chemicals: any[];
  isHeating?: boolean;
  onHeatingToggle?: () => void;
  problemResult?: LabProblemResult | null;
}

// Phân loại hóa chất theo nhóm
const getChemicalCategory = (id: string): string => {
  const acids = ['hcl', 'h2so4', 'hno3'];
  const bases = ['naoh', 'koh', 'caoh2'];
  const salts = ['bacl2', 'agno3', 'cuso4', 'fecl3', 'na2co3', 'ki', 'kmno4'];
  const metals = ['fe', 'zn', 'cu', 'al', 'mg'];
  const indicators = ['litmus', 'phenolphthalein', 'methylorange'];

  if (acids.includes(id)) return 'Axit';
  if (bases.includes(id)) return 'Bazơ';
  if (salts.includes(id)) return 'Muối & Oxit';
  if (metals.includes(id)) return 'Kim loại';
  if (indicators.includes(id)) return 'Chỉ thị';
  return 'Khác';
};

const categoryColors: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  'Axit': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', dot: 'bg-red-500' },
  'Bazơ': { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', dot: 'bg-blue-500' },
  'Muối & Oxit': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-500' },
  'Kim loại': { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/20', dot: 'bg-slate-400' },
  'Chỉ thị': { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/20', dot: 'bg-violet-500' },
  'Khác': { bg: 'bg-gray-500/10', text: 'text-gray-400', border: 'border-gray-500/20', dot: 'bg-gray-500' },
};

export const VisualLab: React.FC<VisualLabProps> = ({ chemicals, isHeating = false, onHeatingToggle, problemResult }) => {
  const [activeDropper, setActiveDropper] = useState<string | null>(null);
  const [reactionLog, setReactionLog] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showProblemDetails, setShowProblemDetails] = useState(true);

  // Equipment states
  const [activeTab, setActiveTab] = useState<'chemical' | 'equipment'>('chemical');
  const [placedEquipment, setPlacedEquipment] = useState<PlacedEquipment[]>([]);
  const labAreaRef = useRef<HTMLDivElement>(null);

  // Nhóm hóa chất theo danh mục
  const groupedChemicals = useMemo(() => {
    const groups: Record<string, any[]> = {};
    chemicals.forEach(chem => {
      const cat = getChemicalCategory(chem.id);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(chem);
    });
    return groups;
  }, [chemicals]);

  // Lọc hóa chất theo tìm kiếm và danh mục
  const filteredChemicals = useMemo(() => {
    let result = chemicals;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    }
    if (activeCategory) {
      result = result.filter(c => getChemicalCategory(c.id) === activeCategory);
    }
    return result;
  }, [chemicals, searchQuery, activeCategory]);

  // Nhóm kết quả đã lọc
  const filteredGrouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredChemicals.forEach(chem => {
      const cat = getChemicalCategory(chem.id);
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(chem);
    });
    return groups;
  }, [filteredChemicals]);

  useEffect(() => {
    if (isHeating) {
      setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Đã bật đèn cồn. Đang đun nóng các ống nghiệm...`, ...prev]);
    } else {
      if (reactionLog.length > 0) {
        setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Đã tắt đèn cồn.`, ...prev]);
      }
    }
  }, [isHeating]);

  const pickChemical = (id: string) => {
    setActiveDropper(id);
  };

  const canHoldChemicals = (equipmentId: string) => {
    const eq = LAB_EQUIPMENT.find(e => e.id === equipmentId);
    return eq && (eq.categoryId === 'containers' || eq.categoryId === 'tubes' || equipmentId === 'trough' || equipmentId === 'mortar');
  };

  const dropIntoEquipment = async (instId: string) => {
    if (!activeDropper) return;

    const instIndex = placedEquipment.findIndex(t => t.id === instId);
    const inst = placedEquipment[instIndex];

    if (!canHoldChemicals(inst.equipmentId)) {
      Swal.fire('Thông báo', 'Dụng cụ này không thể chứa hóa chất!', 'warning');
      return;
    }

    if (inst.chemicals.includes(activeDropper)) {
      Swal.fire('Thông báo', 'Hóa chất này đã có trong dụng cụ!', 'info');
      return;
    }

    const newChemicals = [...inst.chemicals, activeDropper];
    const updatedEqs = [...placedEquipment];
    updatedEqs[instIndex] = { ...inst, chemicals: newChemicals, isReacting: true };
    setPlacedEquipment(updatedEqs);

    const eqName = LAB_EQUIPMENT.find(e => e.id === inst.equipmentId)?.name || 'Dụng cụ';
    setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Thêm ${chemicals.find(c => c.id === activeDropper)?.name} vào ${eqName}`, ...prev]);

    if (newChemicals.length >= 2) {
      try {
        const chemNames = newChemicals.map(id => chemicals.find(c => c.id === id)?.name || id);
        const result = await predictReaction(chemNames);

        if (result) {
          updatedEqs[instIndex] = {
            ...updatedEqs[instIndex],
            color: result.color,
            bubbles: result.bubbles,
            precipitate: result.precipitate,
            message: result.message,
            isReacting: false
          };
          setPlacedEquipment([...updatedEqs]);
          setReactionLog(prev => [
            `[${new Date().toLocaleTimeString()}] ${eqName}: ${result.message}`,
            `[${new Date().toLocaleTimeString()}] Phương trình: ${result.equation}`,
            ...prev
          ]);
        }
      } catch (error) {
        console.error("Reaction prediction failed:", error);
        updatedEqs[instIndex].isReacting = false;
        setPlacedEquipment([...updatedEqs]);
      }
    } else {
      const chem = chemicals.find(c => c.id === activeDropper);
      updatedEqs[instIndex] = {
        ...updatedEqs[instIndex],
        color: chem?.color || '#ffffff',
        isReacting: false
      };
      setPlacedEquipment([...updatedEqs]);
    }
  };

  const resetEquipment = (instId: string) => {
    setPlacedEquipment(prev => prev.map(t => t.id === instId ? {
      ...t,
      chemicals: [],
      color: '#ffffff',
      bubbles: false,
      precipitate: false,
      message: '',
      isReacting: false
    } : t));
  };

  const resetAll = () => {
    setActiveDropper(null);
    setReactionLog([]);
    setPlacedEquipment([]);
  };

  const addEquipment = (equipmentId: string) => {
    // Add new equipment to the center of the lab area
    const newEquipment: PlacedEquipment = {
      id: `${equipmentId}-${Date.now()}`,
      equipmentId: equipmentId,
      x: 100 + Math.random() * 50, // Slight random offset
      y: 100 + Math.random() * 50,
      rotation: 0,
      chemicals: [],
      color: '#ffffff',
      bubbles: false,
      precipitate: false,
      message: '',
      isReacting: false
    };
    setPlacedEquipment(prev => [...prev, newEquipment]);
    setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] Đã thêm ${LAB_EQUIPMENT.find(e => e.id === equipmentId)?.name} vào phòng lab.`, ...prev]);
  };

  const removeEquipment = (id: string) => {
    setPlacedEquipment(prev => prev.filter(e => e.id !== id));
  };

  const updateEquipment = (id: string, updates: Partial<PlacedEquipment>) => {
    setPlacedEquipment(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const loadPreset = (presetId: string) => {
    setActiveDropper(null);
    setPlacedEquipment([]);
    
    setTimeout(() => {
      let presetEqs: PlacedEquipment[] = [];
      let logMsg = '';
      
      // Calculate center coordinates
      const baseX = (labAreaRef.current?.clientWidth || 800) / 2 - 100;
      const baseY = (labAreaRef.current?.clientHeight || 400) / 2;

      if (presetId === 'H2') {
        logMsg = 'Đã tải bộ dụng cụ điều chế khí Hidro (Zn + HCl). Thử nhỏ HCl vào bình cầu!';
        presetEqs = [
          { id: `iron-stand-${Date.now()}-1`, equipmentId: 'iron-stand', x: baseX - 80, y: baseY - 50, scale: 1, rotation: 0, chemicals: [], color: '#fff', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `round-flask-${Date.now()}-2`, equipmentId: 'round-flask', x: baseX - 45, y: baseY - 10, scale: 0.9, rotation: 0, chemicals: ['zn'], color: '#94a3b8', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `separatory-funnel-${Date.now()}-3`, equipmentId: 'separatory-funnel', x: baseX - 45, y: baseY - 120, scale: 0.8, rotation: 0, chemicals: [], color: '#fff', bubbles: false, precipitate: false, message: 'Nhỏ HCl vào đây', isReacting: false },
          { id: `delivery-tube-z-${Date.now()}-4`, equipmentId: 'delivery-tube-z', x: baseX - 10, y: baseY - 40, scale: 1.2, rotation: 10, chemicals: [], color: '#fff', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `trough-${Date.now()}-5`, equipmentId: 'trough', x: baseX + 80, y: baseY + 30, scale: 1.2, rotation: 0, chemicals: ['h2o'], color: '#38bdf8', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `test-tube-${Date.now()}-6`, equipmentId: 'test-tube', x: baseX + 130, y: baseY - 20, scale: 1, rotation: 180, chemicals: [], color: '#fff', bubbles: true, precipitate: false, message: 'Thu khí dời nước', isReacting: false },
        ];
      } else if (presetId === 'O2') {
        logMsg = 'Đã tải bộ dụng cụ nhiệt phân (KMnO4). Hãy bật đèn cồn ở dưới!';
        presetEqs = [
          { id: `iron-stand-${Date.now()}-1`, equipmentId: 'iron-stand', x: baseX - 110, y: baseY - 30, scale: 1, rotation: 0, chemicals: [], color: '#fff', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `test-tube-${Date.now()}-2`, equipmentId: 'test-tube', x: baseX - 50, y: baseY - 50, scale: 1.2, rotation: 65, chemicals: ['kmno4'], color: '#a21caf', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `delivery-tube-z-${Date.now()}-4`, equipmentId: 'delivery-tube-z', x: baseX - 5, y: baseY, scale: 1.2, rotation: -10, chemicals: [], color: '#fff', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `trough-${Date.now()}-5`, equipmentId: 'trough', x: baseX + 80, y: baseY + 50, scale: 1.2, rotation: 0, chemicals: ['h2o'], color: '#38bdf8', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `test-tube-${Date.now()}-6`, equipmentId: 'test-tube', x: baseX + 130, y: baseY + 10, scale: 1, rotation: 180, chemicals: [], color: '#fff', bubbles: true, precipitate: false, message: 'Thu khí O2', isReacting: false },
        ];
      } else if (presetId === 'CO2') {
        logMsg = 'Đã tải bộ sục khí CO2. Nhỏ HCl vào Erlenmeyer (Bình tam giác)!';
        presetEqs = [
          { id: `erlenmeyer-${Date.now()}-1`, equipmentId: 'erlenmeyer', x: baseX - 50, y: baseY + 30, scale: 1, rotation: 0, chemicals: ['na2co3'], color: '#f8fafc', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `delivery-tube-l-${Date.now()}-2`, equipmentId: 'delivery-tube-l', x: baseX - 20, y: baseY - 5, scale: 1.3, rotation: 35, chemicals: [], color: '#fff', bubbles: false, precipitate: false, message: '', isReacting: false },
          { id: `beaker-${Date.now()}-3`, equipmentId: 'beaker', x: baseX + 60, y: baseY + 50, scale: 0.9, rotation: 0, chemicals: ['caoh2'], color: '#ffffff', bubbles: false, precipitate: false, message: 'Nước vôi trong', isReacting: false },
        ];
      }

      setPlacedEquipment(presetEqs);
      setReactionLog(prev => [`[${new Date().toLocaleTimeString()}] ${logMsg}`, ...prev]);
    }, 50);
  };

  const activeChem = chemicals.find(c => c.id === activeDropper);
  const categories = Object.keys(groupedChemicals);

  return (
    <div className="flex h-full gap-4 overflow-hidden">
      {/* ===== BÊN TRÁI: Khu vực thí nghiệm ===== */}
      <div className="flex-1 flex flex-col gap-4 min-w-0">
        {/* Status Bar */}
        <div className="glass-card px-5 py-2.5 rounded-2xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-cyan-300 font-medium">
            <Info className="w-5 h-5 shrink-0 text-cyan-500" />
            {activeDropper ? (
              <span className="text-sm">
                Đang cầm <strong className="text-cyan-200">{activeChem?.name} ({activeChem?.formula})</strong>
                <span className="text-cyan-400/70 ml-1">— Nhấp vào ống nghiệm để nhỏ vào.</span>
                <button
                  onClick={() => setActiveDropper(null)}
                  className="ml-3 inline-flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg text-xs font-bold text-cyan-300 transition-colors border border-cyan-500/30"
                >
                  <X className="w-3 h-3" /> Bỏ
                </button>
              </span>
            ) : (
              <span className="text-sm text-slate-400">Chọn hóa chất từ danh sách bên phải để bắt đầu thí nghiệm.</span>
            )}
          </div>

          {/* Menu Dropdown - Presets */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 rounded-xl text-violet-300 text-xs font-bold transition-colors">
              <Sparkles className="w-4 h-4" />
              Mẫu Thí Nghiệm
              <ChevronDown className="w-3 h-3 ml-1 opacity-70" />
            </button>
            <div className="absolute top-full right-0 mt-2 w-64 bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
               <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-700/50 mb-1">Thiết lập tự động</div>
               <button onClick={() => loadPreset('H2')} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-700/50 rounded-lg text-left text-sm text-slate-300 hover:text-cyan-300 transition-colors">
                 <span className="text-lg">🎈</span> Điều chế H2 (Kẽm + HCl)
               </button>
               <button onClick={() => loadPreset('O2')} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-700/50 rounded-lg text-left text-sm text-slate-300 hover:text-cyan-300 transition-colors">
                 <span className="text-lg">🔥</span> Điều chế O2 (Nhiệt phân thuốc tím)
               </button>
               <button onClick={() => loadPreset('CO2')} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-700/50 rounded-lg text-left text-sm text-slate-300 hover:text-cyan-300 transition-colors">
                 <span className="text-lg">💨</span> Sục CO2 (Muối Carbonate + HCl)
               </button>
            </div>
          </div>
        </div>

        {/* Khu vực ống nghiệm */}
        <div className="relative flex-1 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-xl border border-slate-700/30 p-6 flex flex-col items-center justify-end overflow-hidden min-h-[400px] neon-border">
          {/* Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center text-slate-400">
            <FlaskConical className="w-80 h-80" />
          </div>
          {/* Grid background effect */}
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(139,92,246,0.06) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/4 w-64 h-64 bg-violet-500/5 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-cyan-500/5 rounded-full blur-[60px] pointer-events-none" />

          {/* Draggable Equipment Layer */}
          <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden" ref={labAreaRef}>
             {placedEquipment.map(item => {
               const eqDef = LAB_EQUIPMENT.find(e => e.id === item.equipmentId);
               if (!eqDef) return null;

               return (
                 <motion.div
                   key={item.id}
                   drag
                   dragConstraints={labAreaRef}
                   dragElastic={0}
                   dragMomentum={false}
                   initial={{ x: item.x, y: item.y, scale: 0 }}
                   animate={{ scale: item.scale || 1, rotate: item.rotation || 0 }}
                   onClick={() => dropIntoEquipment(item.id)}
                   className={cn(
                     "absolute origin-center pointer-events-auto group cursor-grab active:cursor-grabbing",
                     activeDropper && canHoldChemicals(eqDef.id) && "hover:ring-4 ring-violet-500/50 rounded-lg"
                   )}
                   style={{ width: eqDef.width, height: eqDef.height }}
                 >
                   {/* Chemical labels */}
                   {item.chemicals && item.chemicals.length > 0 && (
                     <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col gap-0.5 items-center justify-end h-10 w-24 pointer-events-none">
                       {item.chemicals.map(chemId => (
                         <span key={chemId} className="text-[7px] font-bold px-1 py-0 rounded bg-violet-500/30 text-violet-200 leading-tight border border-violet-500/40 backdrop-blur-sm whitespace-nowrap shadow-sm">
                           {chemicals.find(c => c.id === chemId)?.formula}
                         </span>
                       ))}
                     </div>
                   )}

                   <EquipmentSVG 
                     id={eqDef.id} 
                     width={eqDef.width} 
                     height={eqDef.height} 
                     fillLevel={item.chemicals && item.chemicals.length > 0 ? Math.min(item.chemicals.length * 0.25 + 0.1, 0.9) : 0}
                     liquidColor={item.color}
                     bubbles={item.bubbles || (isHeating && item.chemicals && item.chemicals.length > 0)}
                   />
                   
                   {/* Loading overlay */}
                   <AnimatePresence>
                     {item.isReacting && (
                       <motion.div
                         initial={{ opacity: 0 }}
                         animate={{ opacity: 1 }}
                         exit={{ opacity: 0 }}
                         className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] rounded-lg pointer-events-none"
                       >
                         <Loader2 className="w-4 h-4 text-violet-400 animate-spin drop-shadow-md" />
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Delete button (shows on hover, top right) */}
                   <button
                     onClick={(e) => { e.stopPropagation(); removeEquipment(item.id); }}
                     className="absolute -top-3 -right-3 w-6 h-6 bg-red-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30"
                     title="Xóa dụng cụ"
                   >
                     <Trash2 className="w-3 h-3" />
                   </button>

                   {/* Reset chemicals button (shows on hover, top left) */}
                   {item.chemicals && item.chemicals.length > 0 && (
                     <button
                       onClick={(e) => { e.stopPropagation(); resetEquipment(item.id); }}
                       className="absolute -top-3 -left-3 w-6 h-6 bg-amber-500/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-30"
                       title="Đổ hóa chất"
                     >
                       <RotateCcw className="w-3 h-3" />
                     </button>
                   )}

                   {/* Size & Rotate Controls (bottom) */}
                   <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-800/90 border border-slate-600/50 p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
                     <button onClick={(e) => { e.stopPropagation(); updateEquipment(item.id, { scale: Math.max(0.5, (item.scale || 1) - 0.1) }); }} className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-700 rounded-full" title="Thu nhỏ">
                       <ZoomOut className="w-3 h-3" />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); updateEquipment(item.id, { scale: Math.min(2.5, (item.scale || 1) + 0.1) }); }} className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-700 rounded-full" title="Phóng to">
                       <ZoomIn className="w-3 h-3" />
                     </button>
                     <div className="w-px h-3 bg-slate-600 mx-0.5"></div>
                     <button onClick={(e) => { e.stopPropagation(); updateEquipment(item.id, { rotation: (item.rotation || 0) - 15 }); }} className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-violet-400 hover:bg-slate-700 rounded-full" title="Xoay trái">
                       <RotateCcw className="w-3 h-3" />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); updateEquipment(item.id, { rotation: (item.rotation || 0) + 15 }); }} className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-violet-400 hover:bg-slate-700 rounded-full" title="Xoay phải">
                       <RotateCw className="w-3 h-3" />
                     </button>
                   </div>

                   {/* Message popup */}
                   <AnimatePresence>
                     {item.message && (
                       <motion.div
                         initial={{ opacity: 0, y: 5 }}
                         animate={{ opacity: 1, y: 0 }}
                         exit={{ opacity: 0, y: -5 }}
                         className="absolute -right-24 top-1/2 -translate-y-1/2 text-[9px] font-medium text-slate-200 text-center w-[80px] leading-tight bg-slate-800/95 p-1.5 rounded-lg border border-slate-600/50 shadow-xl pointer-events-none z-40 backdrop-blur-md"
                       >
                         {item.message}
                       </motion.div>
                     )}
                   </AnimatePresence>
                 </motion.div>
               );
             })}
          </div>

          {/* Alcohol Lamp (Legacy context) */}
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
            <div className="relative cursor-pointer group" onClick={onHeatingToggle}>
              <AnimatePresence>
                {isHeating && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{
                      opacity: [0.8, 1, 0.8],
                      scale: [1, 1.1, 1],
                      y: 0
                    }}
                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute -top-12 left-1/2 -translate-x-1/2 w-8 h-12 bg-gradient-to-t from-orange-500 via-yellow-400 to-transparent rounded-full blur-[2px] z-10"
                  />
                )}
              </AnimatePresence>

              <img
                src="https://img.icons8.com/fluency/512/alcohol-lamp.png"
                alt="Đèn cồn"
                className={cn(
                  "w-20 h-20 object-contain transition-all duration-500",
                  isHeating ? "brightness-110 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" : "grayscale-[0.3] opacity-80"
                )}
                referrerPolicy="no-referrer"
              />

              <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-slate-700 text-slate-200 text-[10px] px-2 py-1 rounded border border-slate-600">
                {isHeating ? "Tắt đèn cồn" : "Bật đèn cồn"}
              </div>
            </div>
          </div>
        </div>

        {/* Console / Log */}
        <div className="h-36 glass-card rounded-2xl p-4 text-slate-300 font-mono text-xs overflow-y-auto shrink-0">
          <div className="flex items-center justify-between mb-3 border-b border-slate-700/50 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-yellow-500" />
              <span className="font-bold uppercase tracking-wider text-[10px] text-cyan-400">Nhật ký thí nghiệm</span>
            </div>
            <button
              onClick={resetAll}
              className="text-[10px] bg-slate-800/80 hover:bg-slate-700 px-2 py-0.5 rounded border border-slate-600/30 text-slate-400 hover:text-slate-200 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
          {reactionLog.length === 0 ? (
            <div className="text-slate-600 italic text-[11px]">Chưa có hoạt động nào...</div>
          ) : (
            reactionLog.map((log, i) => (
              <div key={i} className="mb-0.5 flex gap-2 text-[11px]">
                <span className="text-slate-600 shrink-0">{log.split(']')[0]}]</span>
                <span className={cn(
                  log.includes('Phương trình') ? "text-cyan-400" :
                  log.includes('Ống') ? "text-emerald-400" : "text-slate-400"
                )}>
                  {log.split(']')[1]}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== BÊN PHẢI: Panel ===== */}
      <div className="w-80 shrink-0 flex flex-col glass-panel rounded-3xl overflow-hidden">
        {/* Header Tabs */}
        <div className="flex border-b border-slate-700/30">
          <button
            onClick={() => setActiveTab('chemical')}
            className={cn(
              "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              activeTab === 'chemical' ? "bg-slate-800/80 text-violet-400 border-b-2 border-violet-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
            )}
          >
            <Droplets className="w-4 h-4" />
            Hóa Chất
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={cn(
              "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors",
              activeTab === 'equipment' ? "bg-slate-800/80 text-cyan-400 border-b-2 border-cyan-500" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800/40"
            )}
          >
            <Wrench className="w-4 h-4" />
            Dụng Cụ
          </button>
        </div>

        {/* Tab Header Info & Search */}
        <div className="p-4 border-b border-slate-700/30 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 dark-input text-xs"
            />
          </div>

          {/* Bộ lọc danh mục (Chỉ hiện cho Hóa chất) */}
          {activeTab === 'chemical' && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              <button
                onClick={() => setActiveCategory(null)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                  !activeCategory
                    ? "bg-gradient-to-r from-violet-600 to-cyan-600 text-white shadow-sm"
                    : "bg-slate-800/60 text-slate-500 hover:bg-slate-700/60 hover:text-slate-300 border border-slate-700/30"
                )}
              >
                Tất cả
              </button>
              {categories.map(cat => {
                const colors = categoryColors[cat] || categoryColors['Khác'];
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1",
                      activeCategory === cat
                        ? `${colors.bg} ${colors.text} border ${colors.border}`
                        : "bg-slate-800/60 text-slate-500 hover:bg-slate-700/60 hover:text-slate-300 border border-slate-700/30"
                    )}
                  >
                    <span className={cn("w-1.5 h-1.5 rounded-full", colors.dot)} />
                    {cat}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Danh sách - có thể cuộn */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          
          {/* =========== CHẾ ĐỘ HÓA CHẤT =========== */}
          {activeTab === 'chemical' && (
            <>
              {/* ===== GIÁ HOÁ CHẤT ĐỀ BÀI ===== */}
          {problemResult && problemResult.chemicals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-cyan-500/10 border border-violet-500/20 overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => setShowProblemDetails(!showProblemDetails)}
                className="w-full flex items-center justify-between p-3 hover:bg-violet-500/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white shadow-sm neon-glow">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-violet-300">Hoá chất theo đề bài</h4>
                    <p className="text-[9px] text-violet-500">{problemResult.chemicals.length} loại</p>
                  </div>
                </div>
                {showProblemDetails ? (
                  <ChevronUp className="w-4 h-4 text-violet-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-violet-400" />
                )}
              </button>

              <AnimatePresence>
                {showProblemDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {/* Tóm tắt đề bài */}
                    <div className="px-3 pb-2">
                      <p className="text-[10px] text-violet-300 bg-violet-500/10 rounded-lg px-2.5 py-1.5 leading-relaxed border border-violet-500/20">
                        📋 {problemResult.problem_summary}
                      </p>
                    </div>

                    {/* Danh sách hoá chất đề bài */}
                    <div className="px-3 pb-2 space-y-1.5">
                      {problemResult.chemicals.map((chem) => {
                        // Tìm chemical tương ứng trong danh sách (có thể trùng hoặc mới)
                        const matchedChem = chemicals.find(
                          c => c.id === chem.id || c.formula.toLowerCase() === chem.formula.toLowerCase()
                        ) || chem;

                        return (
                          <motion.button
                            key={chem.id}
                            whileHover={{ x: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => pickChemical(matchedChem.id)}
                            className={cn(
                              "w-full flex items-center gap-3 p-2 rounded-xl transition-all text-left group",
                              activeDropper === matchedChem.id
                                ? "bg-violet-500/20 border-2 border-violet-500/50 shadow-md"
                                : "bg-slate-800/50 border-2 border-transparent hover:border-violet-500/20 hover:bg-slate-800/80"
                            )}
                            style={activeDropper === matchedChem.id ? { boxShadow: '0 0 15px rgba(139, 92, 246, 0.15)' } : {}}
                          >
                            {/* Mẫu màu */}
                            <div className="relative shrink-0">
                              <div
                                className="w-8 h-11 rounded-lg border-2 border-violet-500/30 relative overflow-hidden"
                                style={{ backgroundColor: '#1e293b' }}
                              >
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-1.5 bg-violet-400/50 rounded-b-sm" />
                                <div
                                  className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                                  style={{ backgroundColor: chem.color || matchedChem.color, height: '55%', opacity: 0.85 }}
                                />
                              </div>
                              {activeDropper === matchedChem.id && (
                                <motion.div
                                  layoutId="dropper-indicator"
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white rounded-full flex items-center justify-center shadow-lg"
                                >
                                  <Pipette className="w-2.5 h-2.5" />
                                </motion.div>
                              )}
                            </div>

                            {/* Thông tin */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-bold text-slate-200 truncate">{chem.name}</span>
                                <span className={cn(
                                  "text-[7px] font-bold px-1 py-0 rounded",
                                  chem.state === 'solid' ? "bg-slate-700 text-slate-400" :
                                  chem.state === 'gas' ? "bg-sky-500/20 text-sky-400" :
                                  "bg-blue-500/20 text-blue-400"
                                )}>
                                  {chem.state === 'solid' ? 'Rắn' : chem.state === 'gas' ? 'Khí' : 'Lỏng'}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono font-bold text-violet-400">{chem.formula}</span>
                                {chem.concentration && (
                                  <span className="text-[8px] text-slate-500">{chem.concentration}</span>
                                )}
                              </div>
                              <p className="text-[8px] text-slate-500 mt-0.5 truncate">{chem.description}</p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Phương trình hoá học */}
                    {problemResult.equations.length > 0 && (
                      <div className="px-3 pb-2">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Atom className="w-3 h-3 text-cyan-400" />
                          <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">Phương trình</span>
                        </div>
                        <div className="space-y-1">
                          {problemResult.equations.map((eq, i) => (
                            <div key={i} className="px-2 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 font-mono text-[9px] text-cyan-300 leading-tight">
                              {eq}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Các bước thí nghiệm */}
                    {problemResult.experiment_steps.length > 0 && (
                      <div className="px-3 pb-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <ClipboardList className="w-3 h-3 text-amber-400" />
                          <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Các bước</span>
                        </div>
                        <div className="space-y-1">
                          {problemResult.experiment_steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-1.5 text-[9px] text-slate-400">
                              <span className="shrink-0 w-4 h-4 rounded-full bg-amber-500/10 text-amber-400 font-bold flex items-center justify-center text-[8px] border border-amber-500/20">
                                {i + 1}
                              </span>
                              <span className="leading-tight pt-0.5">{step}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ===== Separator nếu có đề bài ===== */}
          {problemResult && problemResult.chemicals.length > 0 && (
            <div className="flex items-center gap-2 px-1">
              <div className="flex-1 h-px bg-slate-700/50" />
              <span className="text-[9px] font-medium text-slate-600">Thư viện chung</span>
              <div className="flex-1 h-px bg-slate-700/50" />
            </div>
          )}

          {Object.entries(filteredGrouped).map(([category, chems]) => {
            const colors = categoryColors[category] || categoryColors['Khác'];
            return (
              <div key={category}>
                {/* Tên nhóm */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className={cn("w-2 h-2 rounded-full", colors.dot)} />
                  <span className={cn("text-[10px] font-bold uppercase tracking-wider", colors.text)}>
                    {category}
                  </span>
                  <span className="text-[10px] text-slate-600">({chems.length})</span>
                </div>

                {/* Danh sách */}
                <div className="space-y-1.5">
                  {chems.map((chem: any) => (
                    <motion.button
                      key={chem.id}
                      whileHover={{ x: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => pickChemical(chem.id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left group",
                        activeDropper === chem.id
                          ? "bg-violet-500/15 border-2 border-violet-500/40"
                          : "bg-slate-800/40 border-2 border-transparent hover:border-slate-600/50 hover:bg-slate-800/60"
                      )}
                      style={activeDropper === chem.id ? { boxShadow: '0 0 15px rgba(139, 92, 246, 0.1)' } : {}}
                    >
                      {/* Mẫu màu hóa chất */}
                      <div className="relative shrink-0">
                        <div
                          className="w-9 h-12 rounded-lg border-2 border-slate-600/50 relative overflow-hidden"
                          style={{ backgroundColor: '#1e293b' }}
                        >
                          {/* Nút chai */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1.5 bg-slate-500/50 rounded-b-sm" />
                          {/* Chất lỏng */}
                          <div
                            className="absolute bottom-0 left-0 right-0 transition-all duration-500"
                            style={{ backgroundColor: chem.color, height: '55%', opacity: 0.85 }}
                          />
                        </div>
                        {activeDropper === chem.id && (
                          <motion.div
                            layoutId="dropper-indicator"
                            className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white rounded-full flex items-center justify-center shadow-lg"
                          >
                            <Pipette className="w-2.5 h-2.5" />
                          </motion.div>
                        )}
                      </div>

                      {/* Thông tin hóa chất */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-200 truncate">{chem.name}</span>
                          {chem.state === 'solid' && (
                            <span className="text-[8px] font-bold bg-slate-700 text-slate-400 px-1 rounded">Rắn</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[11px] font-mono font-bold text-violet-400">{chem.formula}</span>
                          {chem.concentration && (
                            <span className="text-[9px] text-slate-500">{chem.concentration}</span>
                          )}
                        </div>
                        {/* Cảnh báo an toàn */}
                        {chem.safetyWarnings?.some((w: string) => !w.includes('An toàn')) && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertTriangle className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                            <span className="text-[8px] text-amber-400/70 font-medium truncate">
                              {chem.safetyWarnings.filter((w: string) => !w.includes('An toàn'))[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })}

          {filteredChemicals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-slate-600">
              <Search className="w-8 h-8 mb-2 opacity-30" />
              <span className="text-xs font-medium">Không tìm thấy hóa chất</span>
            </div>
          )}
          </>
          )}

          {/* =========== CHẾ ĐỘ DỤNG CỤ =========== */}
          {activeTab === 'equipment' && (
            <div className="space-y-4">
              {EQUIPMENT_CATEGORIES.map(category => {
                const categoryEquipments = LAB_EQUIPMENT.filter(eq => 
                  eq.categoryId === category.id && 
                  (searchQuery === '' || eq.name.toLowerCase().includes(searchQuery.toLowerCase()))
                );

                if (categoryEquipments.length === 0) return null;

                return (
                  <div key={category.id}>
                    <div className="flex items-center gap-2 mb-2 px-1 text-cyan-400">
                      <Wrench className="w-3 h-3" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{category.name}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       {categoryEquipments.map(eq => (
                         <motion.button
                           key={eq.id}
                           whileHover={{ scale: 1.02 }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => addEquipment(eq.id)}
                           className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30 hover:bg-slate-800/80 transition-colors group"
                         >
                           <div className="h-12 flex items-center justify-center mb-2 opacity-80 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                             <EquipmentSVG id={eq.id} width={30} height={30} />
                           </div>
                           <span className="text-[10px] font-bold text-slate-300 text-center leading-tight">
                             {eq.name}
                           </span>
                         </motion.button>
                       ))}
                    </div>
                  </div>
                );
              })}
              
              {LAB_EQUIPMENT.filter(eq => eq.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-slate-600">
                  <Search className="w-8 h-8 mb-2 opacity-30" />
                  <span className="text-xs font-medium">Không tìm thấy dụng cụ</span>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Thông tin đang cầm */}
        <AnimatePresence>
          {activeDropper && activeChem && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="border-t border-slate-700/30 p-3 shrink-0 bg-gradient-to-t from-violet-500/5 to-transparent"
            >
              <div className="flex items-center gap-2 mb-2">
                <Pipette className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold text-violet-400">Đang cầm</span>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-3 border border-violet-500/20">
                <div className="font-bold text-sm text-slate-200">{activeChem.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{activeChem.properties}</div>
                <div className="text-[10px] text-violet-400 font-mono font-bold mt-1">{activeChem.formula} {activeChem.concentration ? `• ${activeChem.concentration}` : ''}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
