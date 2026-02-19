import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { 
  Activity, 
  Dna, 
  BrainCircuit,
  HeartPulse,
  Users,
  Sparkles,
  ShieldCheck,
  Search
} from 'lucide-react';
import VCFUpload from './components/VCFUpload';
import ResultDashboard from './components/ResultDashboard';
import DrugSelection from './components/DrugSelection';
import { PharmaGuardResult, Phenotype } from './types';
import { parseVCF } from './services/vcfParser';
import { getPhenotypeForGene, getDiplotypeForGene } from './services/phenotypeEngine';
import { getRecommendation } from './services/ruleEngine';
import { generateExplanations, buildFallbackExplanation } from './services/geminiService';
import { DRUG_GENE_MAP } from './constants';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type AnalysisPhase = 'idle' | 'drug_selection' | 'parsing' | 'mapping' | 'reasoning' | 'complete' | 'error';
type ViewMode = 'clinician' | 'patient';

export const Navbar: React.FC<{ 
  onReset?: () => void; 
  activePage?: string;
  onNavClick: (link: string) => void;
}> = ({ onReset, activePage = 'dashboard', onNavClick }) => {
  const NAV_LINKS = ['Dashboard', 'Analysis', 'Patients', 'Settings'];
  
  return (
    <header className="w-full fixed top-0 z-[60] bg-white/70 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="size-8 bg-brand-blue rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles size={18} strokeWidth={2.5} />
          </div>
          <span className="font-bold text-lg tracking-tight text-[#1D1D1F] font-display">
            PharmaGuard<span className="font-light text-[#86868b]">AI</span>
          </span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <button 
              key={item} 
              onClick={() => onNavClick(item)}
              className={cn(
                "text-sm font-medium transition-colors",
                activePage.toLowerCase() === item.toLowerCase() 
                  ? "text-[#007AFF]" 
                  : "text-[#86868b] hover:text-[#007AFF]"
              )}
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <div className="hidden md:block text-right">
            <p className="text-xs font-semibold text-[#1D1D1F]">Dr. S. Chen</p>
            <p className="text-[10px] text-[#86868b]">Genomics Dept.</p>
          </div>
          <button className="relative group">
            <div className="size-9 rounded-full overflow-hidden shadow-sm ring-2 ring-white group-hover:ring-[#007AFF] transition-all duration-300 bg-gray-200">
               <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuALQHcQFEgUW5X_ixGjI7LvrOoNt2Nn6jgo-CdzBcEHfgEF9HNQltq8xl5Vq_3a0__LQAQoA35Lme65-uuSKh4CQs8RS1YI6iKqt2nbgupcfXEGiRDTberF65L7uWWDqLQKew37jBZWWh93HOfla82Z-i_1Vl2pz49dotGjYeE9KIfZY0HeEJUsVPwKchn7Ag_6ohlItOLnbdyZoPk0MM-fB08VEnslDveHz9yRpfPYyjouk997F1O00aJK_hv1mTxi2wG181GcZrg" alt="profile" />
            </div>
            <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white"></div>
          </button>
        </div>
      </div>
    </header>
  );
};

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; subtitle: string; colorClass: string }> = ({ icon, title, subtitle, colorClass }) => (
  <div className="bg-white/65 backdrop-blur-[20px] p-4 rounded-2xl flex items-center gap-4 shadow-glass-sm hover:shadow-glass transition-all duration-300 border border-white/80 group">
    <div className={cn("size-10 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110", colorClass)}>
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-[#1D1D1F] text-sm">{title}</h3>
      <p className="text-xs text-[#86868b]">{subtitle}</p>
    </div>
  </div>
);

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [phase, setPhase] = useState<AnalysisPhase>('idle');
  const [results, setResults] = useState<PharmaGuardResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('clinician');
  const prefersReduced = useReducedMotion();

  const handleFileUploaded = (uploadedFile: File) => {
    setFile(uploadedFile);
    setPhase('drug_selection');
  };

  const handleStartAnalysis = async (drugIds: string[]) => {
    if (!file) return;
    setPhase('parsing');
    setError(null);

    try {
      const text = await file.text();
      const { variants, metrics } = parseVCF(text);
      
      setPhase('mapping');
      const timestamp = new Date().toISOString();
      const patientId = `PAT_RIFT_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Analyze each drug independently
      const drugResults: PharmaGuardResult[] = drugIds.map(drugId => {
        const drug = drugId.toUpperCase();
        const primaryGene = DRUG_GENE_MAP[drug] || 'Unknown';
        const phenoResult = getPhenotypeForGene(primaryGene, variants);
        const phenotype = phenoResult.phenotype;
        const diplotype = getDiplotypeForGene(primaryGene, variants);
        const recData = getRecommendation(drug, phenotype, phenoResult.confidence);

        const primaryVariants = variants
          .filter(v => v.gene === primaryGene)
          .map(v => ({ 
            rsid: v.rsid,
            gene: v.gene,
            star_allele: v.star_allele,
            zygosity: v.zygosity as any,
          }));

        return {
          patient_id: patientId,
          drug: drug,
          timestamp: timestamp,
          risk_assessment: {
            risk_label: recData.risk_label,
            confidence_score: recData.confidence_score,
            severity: recData.severity,
          },
          pharmacogenomic_profile: {
            primary_gene: primaryGene,
            diplotype: diplotype,
            phenotype: phenotype as Phenotype,
            detected_variants: primaryVariants,
          },
          clinical_recommendation: {
            action: recData.recommendation_text,
            cpic_guideline: `CPIC ${primaryGene}-${drug} Guideline`,
            alternative_drugs: recData.alternative_drugs,
            monitoring_required: recData.severity !== 'none'
          },
          llm_generated_explanation: { 
            summary: "Analyzing metabolic pathways...",
            mechanism: "",
            variant_impact: "",
            clinical_context: ""
          },
          quality_metrics: {
            vcf_parsing_success: metrics.vcf_parsing_success,
            variants_detected: primaryVariants.length,
            genes_analyzed: metrics.genes_analyzed,
            data_completeness_score: metrics.data_completeness_score
          }
        };
      });

      setPhase('reasoning');
      const explanations = await generateExplanations(drugResults);
      
      const finalResults = drugResults.map(res => ({
        ...res,
        llm_generated_explanation: explanations[res.drug]
      }));

      setResults(finalResults);
      setPhase('complete');
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Ensure VCF headers follow v4.2 standards.");
      setPhase('error');
    }
  };

  const handleReset = useCallback(() => {
    setResults(null);
    setFile(null);
    setPhase('idle');
    setError(null);
  }, []);

  const handleNavClick = (link: string) => {
    switch (link) {
      case 'Dashboard': handleReset(); break;
      case 'Analysis': if (results) setPhase('complete'); break;
      case 'Patients': case 'Settings': alert(`${link} feature coming soon for RIFT Phase 2.`); break;
    }
  };

  const activePage = useMemo(() => {
    if (phase === 'complete') return 'Analysis';
    if (phase === 'idle') return 'Dashboard';
    return 'Analysis';
  }, [phase]);

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Navbar onReset={handleReset} activePage={activePage} onNavClick={handleNavClick} />

      <main className="flex-1 w-full max-w-7xl mx-auto pt-28 pb-12 px-6">
        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.div 
              key="landing"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
            >
              <div className="lg:col-span-5 flex flex-col justify-center space-y-8">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm w-fit">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#007AFF]"></span>
                    </span>
                    <span className="text-[11px] font-semibold text-[#86868b] uppercase tracking-wide">System Online v4.0.2</span>
                  </div>
                  <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-[#1D1D1F] leading-[1.05] font-display">
                    Genomic <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#007AFF] to-[#30B0C7]">Insight.</span> <br/>
                    Simplified.
                  </h1>
                </div>

                <p className="text-lg text-[#86868b] leading-relaxed max-w-md">
                  Professional-grade VCF analysis for pharmacogenomics. High-fidelity drug-gene compatibility assessment with AES-256 encryption.
                </p>

                <div className="flex flex-col gap-4 max-w-sm">
                  <FeatureCard 
                    icon={<BrainCircuit size={20} />} 
                    title="CYP2D6 Analysis" 
                    subtitle="Psychotropic metabolizer status" 
                    colorClass="bg-blue-50 text-[#007AFF]"
                  />
                  <FeatureCard 
                    icon={<HeartPulse size={20} />} 
                    title="CYP2C19 Vector" 
                    subtitle="Clopidogrel response detection" 
                    colorClass="bg-teal-50 text-[#30B0C7]"
                  />
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col relative h-full min-h-[500px] justify-center">
                <div className="absolute top-10 right-10 w-64 h-64 bg-[#007AFF]/10 rounded-full blur-3xl -z-10"></div>
                <div className="absolute bottom-10 left-10 w-72 h-72 bg-[#30B0C7]/10 rounded-full blur-3xl -z-10"></div>
                
                <div className="relative w-full h-full flex items-center justify-center">
                  <div className="bg-white/65 backdrop-blur-[20px] border border-white/80 rounded-[32px] shadow-glass w-full max-w-lg aspect-square lg:aspect-[4/3] flex flex-col p-8 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-8 relative z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                      </div>
                      <span className="text-xs font-medium text-[#86868b] uppercase tracking-wider">Secure Upload</span>
                    </div>
                    
                    <VCFUpload onFileSelect={handleFileUploaded} />
                    
                    <div className="mt-auto pt-6 border-t border-[#1D1D1F]/5 flex justify-between items-center relative z-10">
                      <span className="text-[10px] text-[#86868b] font-medium">ENCRYPTION: AES-256</span>
                      <span className="text-[10px] text-[#86868b] font-medium">STATUS: READY</span>
                    </div>
                  </div>

                  <div className="absolute -right-8 -bottom-8 lg:right-0 lg:-bottom-12 w-48 h-32 bg-white/65 backdrop-blur-[20px] border border-white/80 rounded-[24px] shadow-glass-sm p-3 z-20 hidden md:flex items-center gap-3 animate-float">
                    <div className="h-full w-24 rounded-lg overflow-hidden relative">
                      <img className="absolute inset-0 object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuALQHcQFEgUW5X_ixGjI7LvrOoNt2Nn6jgo-CdzBcEHfgEF9HNQltq8xl5Vq_3a0__LQAQoA35Lme65-uuSKh4CQs8RS1YI6iKqt2nbgupcfXEGiRDTberF65L7uWWDqLQKew37jBZWWh93HOfla82Z-i_1Vl2pz49dotGjYeE9KIfZY0HeEJUsVPwKchn7Ag_6ohlItOLnbdyZoPk0MM-fB08VEnslDveHz9yRpfPYyjouk997F1O00aJK_hv1mTxi2wG181GcZrg" alt="profile" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <span className="text-[10px] font-bold text-[#1D1D1F]">Sample_082</span>
                      <span className="text-[9px] text-green-600 font-medium">Completed</span>
                      <div className="w-full h-1 bg-gray-100 rounded-full mt-2">
                        <div className="w-full h-full bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {phase === 'drug_selection' && (
            <motion.div 
              key="selection" 
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={prefersReduced ? { opacity: 1 } : { opacity: 0, x: -20 }}
            >
              <DrugSelection onContinue={handleStartAnalysis} />
            </motion.div>
          )}

          {(['parsing', 'mapping', 'reasoning'] as AnalysisPhase[]).includes(phase) && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
              <div className="relative size-24 bg-white rounded-3xl shadow-glass flex items-center justify-center text-brand-blue border border-white">
                <Activity size={40} className="animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-xl font-bold text-gray-900 font-display uppercase tracking-widest">{phase} Phase...</h3>
                <p className="text-gray-500 font-medium">RIFT AI Pipeline Processing</p>
              </div>
            </motion.div>
          )}

          {phase === 'complete' && results && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 font-display">Clinical Dashboard</h2>
                  <p className="text-sm text-gray-500 mt-1">Patient: {results[0].patient_id}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm">
                    {(['clinician', 'patient'] as ViewMode[]).map(mode => (
                      <button key={mode} onClick={() => setViewMode(mode)} className={cn("px-4 py-2 text-xs font-bold uppercase rounded-lg transition-all", viewMode === mode ? "bg-brand-blue text-white" : "text-gray-400")}>
                        {mode}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleReset} className="px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg">Reset</button>
                </div>
              </div>
              <ResultDashboard results={results} viewMode={viewMode} />
            </motion.div>
          )}

          {phase === 'error' && (
            <motion.div key="error" className="flex items-center justify-center min-h-[60vh]">
              <div className="bg-white rounded-[32px] shadow-glass p-12 text-center max-w-lg border border-red-50">
                <div className="size-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-6"><Activity size={32} /></div>
                <h3 className="text-xl font-bold text-red-600 mb-2">Analysis Interrupted</h3>
                <p className="text-gray-500 mb-8">{error}</p>
                <button onClick={handleReset} className="bg-brand-blue text-white px-8 py-3 rounded-full font-bold uppercase text-xs shadow-lg">Return to Intake</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="w-full border-t border-black/5 bg-white/50 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#86868b] font-medium">
            © 2024 PharmaGuard AI. Designed in California.
          </div>
          <div className="flex gap-6">
            <button className="text-xs text-[#86868b] hover:text-[#007AFF] transition-colors">Privacy</button>
            <button className="text-xs text-[#86868b] hover:text-[#007AFF] transition-colors">Terms</button>
            <button className="text-xs text-[#86868b] hover:text-[#007AFF] transition-colors">Support</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;