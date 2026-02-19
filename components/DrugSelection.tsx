import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Search, 
  Pill, 
  Tablets, 
  Syringe, 
  FlaskConical, 
  PlusCircle, 
  CheckCircle2, 
  ArrowRight,
  TestTube
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Drug {
  id: string;
  name: string;
  category: string;
  filterCategory: string;
  icon: any;
  description: string;
  displayDose: string;
}

const DRUGS: Drug[] = [
  {
    id: 'codeine',
    name: 'Codeine',
    category: 'Analgesic',
    filterCategory: 'analgesics',
    icon: Pill,
    description: 'CYP2D6 analysis for metabolic activation risk.',
    displayDose: 'Codeine (30mg Standard)',
  },
  {
    id: 'warfarin',
    name: 'Warfarin',
    category: 'Anticoagulant',
    filterCategory: 'anticoagulants',
    icon: Pill,
    description: 'Sensitivity analysis for CYP2C9 and VKORC1 variants.',
    displayDose: 'Warfarin (5mg Standard)',
  },
  {
    id: 'clopidogrel',
    name: 'Clopidogrel',
    category: 'Antiplatelet',
    filterCategory: 'anticoagulants',
    icon: Tablets,
    description: 'Assessing CYP2C19 metabolism for titration.',
    displayDose: 'Clopidogrel (75mg Standard)',
  },
  {
    id: 'simvastatin',
    name: 'Simvastatin',
    category: 'Statin',
    filterCategory: 'statins',
    icon: FlaskConical,
    description: 'SLCO1B1 genotyping for myopathy risk prediction.',
    displayDose: 'Simvastatin (20mg Standard)',
  },
  {
    id: 'azathioprine',
    name: 'Azathioprine',
    category: 'Immunosuppressant',
    filterCategory: 'immunosuppressants',
    icon: Syringe,
    description: 'TPMT genotyping for myelosuppression risk.',
    displayDose: 'Azathioprine (50mg Standard)',
  },
  {
    id: 'fluorouracil',
    name: 'Fluorouracil',
    category: 'Oncology',
    filterCategory: 'oncology',
    icon: TestTube,
    description: 'DPYD testing for high toxicity mitigation.',
    displayDose: 'Fluorouracil (500mg/m²)',
  },
];

const CATEGORIES = [
  { id: 'all',                label: 'All Classes',        count: 6 },
  { id: 'analgesics',         label: 'Analgesics',         count: 1 },
  { id: 'anticoagulants',     label: 'Anticoagulants',     count: 2 },
  { id: 'statins',            label: 'Statins',            count: 1 },
  { id: 'immunosuppressants', label: 'Immunosuppressants', count: 1 },
  { id: 'oncology',           label: 'Oncology',           count: 1 },
];

const DrugCard: React.FC<{ 
  drug: Drug; 
  isSelected: boolean; 
  onClick: () => void;
}> = ({ drug, isSelected, onClick }) => {
  const prefersReduced = useReducedMotion();
  const Icon = drug.icon;
  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative bg-white rounded-3xl p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-300 border-2",
        isSelected 
          ? "border-brand-blue shadow-lg scale-[1.02]" 
          : "border-gray-100 hover:border-brand-blue/30 hover:shadow-md"
      )}
    >
      <div className={cn(
        "absolute top-0 left-1/2 -translate-x-1/2 w-16 h-1 rounded-b-full transition-colors",
        isSelected ? "bg-brand-blue" : "bg-transparent"
      )} />
      
      <div className={cn(
        "size-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
        isSelected ? "bg-brand-blue/10 text-brand-blue" : "bg-gray-50 text-gray-300"
      )}>
        <Icon size={32} />
      </div>

      <h3 className="text-xl font-bold text-gray-900 font-display mb-1">{drug.name}</h3>
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">{drug.category}</p>
      <p className="text-xs text-gray-500 leading-relaxed mb-6 flex-1">
        {drug.description}
      </p>

      {isSelected ? (
        <div className="flex items-center gap-1.5 text-brand-blue text-[10px] font-bold uppercase tracking-widest">
          <CheckCircle2 size={12} strokeWidth={3} />
          Selected
        </div>
      ) : (
        <div className="h-[15px]" />
      )}
    </div>
  );
};

const DrugSelection: React.FC<{ onContinue: (drugIds: string[]) => void }> = ({ onContinue }) => {
  const [selectedDrugIds, setSelectedDrugIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [commaInput, setCommaInput] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const prefersReduced = useReducedMotion();

  const toggleDrug = (drugId: string) => {
    setSelectedDrugIds(prev => 
      prev.includes(drugId) 
        ? prev.filter(id => id !== drugId) 
        : [...prev, drugId]
    );
  };

  // Sync cards from comma input
  useEffect(() => {
    if (!commaInput.trim()) return;
    const drugNames = commaInput.split(',').map(s => s.trim().toLowerCase());
    const matchedIds = DRUGS.filter(d => drugNames.includes(d.name.toLowerCase())).map(d => d.id);
    if (matchedIds.length > 0) {
      setSelectedDrugIds(prev => {
        const combined = [...new Set([...prev, ...matchedIds])];
        return combined;
      });
    }
  }, [commaInput]);

  const visibleDrugs = useMemo(() => {
    return DRUGS.filter(drug => {
      const matchesSearch = drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          drug.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'all' || drug.filterCategory === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  return (
    <div className="flex flex-col items-center pb-32">
      <div className="text-center mb-16 max-w-2xl">
        <p className="text-xs font-bold tracking-[0.3em] uppercase text-brand-blue mb-4 font-display">Step 01 / Clinical Workflow</p>
        <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 mb-6 font-display">Select Clinical Drugs</h1>
        <p className="text-gray-500 text-lg font-medium leading-relaxed">
          Choose one or more compounds for pharmacogenomic analysis. You can click cards or type names manually.
        </p>
      </div>

      <div className="w-full max-w-2xl mb-12 px-4 space-y-6">
        <div className="group relative flex items-center">
          <Search className="absolute left-6 text-gray-400 group-focus-within:text-brand-blue transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="Search clinical drugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-full py-5 pl-14 pr-8 text-lg font-medium placeholder:text-gray-300 focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all shadow-sm"
          />
        </div>

        <div className="relative">
          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2 block">Batch Entry (Comma Separated)</label>
          <input 
            type="text" 
            placeholder="e.g. Codeine, Warfarin, Clopidogrel"
            value={commaInput}
            onChange={(e) => setCommaInput(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-2xl py-3 px-6 text-sm font-medium placeholder:text-gray-300 focus:ring-4 focus:ring-brand-blue/10 focus:border-brand-blue transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center justify-center gap-4 md:gap-8 mt-10 border-b border-gray-100 overflow-x-auto no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveFilter(cat.id)}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest pb-4 transition-all relative border-b-2",
                activeFilter === cat.id 
                  ? "text-brand-blue border-brand-blue" 
                  : "text-gray-400 border-transparent hover:text-gray-900"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl px-4">
        <AnimatePresence>
          {visibleDrugs.map((drug) => (
            <motion.div
              layout
              key={drug.id}
              initial={prefersReduced ? {} : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReduced ? {} : { opacity: 0, scale: 0.9 }}
              transition={prefersReduced ? { duration: 0 } : { duration: 0.2 }}
            >
              <DrugCard 
                drug={drug} 
                isSelected={selectedDrugIds.includes(drug.id)} 
                onClick={() => toggleDrug(drug.id)} 
              />
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="bg-white/50 border-2 border-dashed border-gray-200 rounded-3xl p-8 flex flex-col items-center justify-center text-center opacity-40 grayscale">
          <PlusCircle className="text-gray-300 mb-4" size={40} />
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest font-display">Coming Soon</h3>
          <p className="text-[10px] text-gray-400 mt-2 px-4 leading-tight">Expanded drug catalog available in future releases.</p>
        </div>
      </div>

      <AnimatePresence>
        {selectedDrugIds.length > 0 && (
          <motion.div 
            initial={prefersReduced ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={prefersReduced ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[60] w-full max-w-[540px] px-6"
          >
            <div className="bg-gray-900 text-white rounded-[24px] p-5 pr-6 flex items-center justify-between shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="flex flex-col pl-3">
                <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-gray-400 mb-0.5">{selectedDrugIds.length} {selectedDrugIds.length === 1 ? 'Drug' : 'Drugs'} Selected</span>
                <span className="text-sm font-bold font-display truncate max-w-[200px]">
                  {selectedDrugIds.map(id => DRUGS.find(d => d.id === id)?.name).join(', ')}
                </span>
              </div>
              <button 
                onClick={() => onContinue(selectedDrugIds)}
                className="bg-brand-blue hover:bg-brand-blueDark text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all active:scale-95 flex items-center gap-3 shadow-lg shadow-blue-500/20"
              >
                Analyze Targets
                <ArrowRight size={14} strokeWidth={3} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DrugSelection;