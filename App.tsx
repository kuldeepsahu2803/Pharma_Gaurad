
import React, { useState, useCallback } from 'react';
import Layout from './components/Layout';
import VCFUpload from './components/VCFUpload';
import DrugSelector from './components/DrugSelector';
import ResultDashboard from './components/ResultDashboard';
import { PharmaGuardResult, RiskLabel, Severity } from './types';
import { parseVCF, determinePhenotypes } from './services/vcfParser';
import { DRUG_GENE_MAP, CPIC_RULES } from './constants';
import { generateExplanations } from './services/geminiService';

const App: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [selectedDrugs, setSelectedDrugs] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PharmaGuardResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!file) {
      setError("Please upload a VCF file first.");
      return;
    }
    if (selectedDrugs.length === 0) {
      setError("Please select at least one drug.");
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      // 1. Read file
      const text = await file.text();
      
      // 2. Parse VCF (Vibe check logic)
      const { variants, metrics } = parseVCF(text);
      
      // 3. Phenotype Engine
      const profiles = determinePhenotypes(variants);

      // 4. Rule Engine (Actionable Recommendations)
      const riskAssessment = selectedDrugs.map(drug => {
        const gene = DRUG_GENE_MAP[drug];
        const profile = profiles.find(p => p.gene === gene);
        const rule = CPIC_RULES[gene]?.[profile?.phenotype || 'Normal Metabolizer'];

        return {
          drug,
          primary_gene: gene,
          recommendation_text: rule?.rec || 'Standard pharmacological management.',
          risk_label: rule?.risk || RiskLabel.LOW,
          severity: rule?.severity || Severity.LOW,
          confidence_score: 0.95
        };
      });

      const initialResult: PharmaGuardResult = {
        risk_assessment: riskAssessment,
        pharmacogenomic_profiles: profiles,
        llm_generated_explanations: {},
        quality_metrics: metrics
      };

      // 5. LLM Explanation Service (Gemini)
      const explanations = await generateExplanations(initialResult);
      
      setResult({
        ...initialResult,
        llm_generated_explanations: explanations
      });
    } catch (err: any) {
      console.error(err);
      setError("Analysis failed. Please check the VCF format and your API key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setSelectedDrugs([]);
    setResult(null);
    setError(null);
  };

  return (
    <Layout>
      <div className="space-y-10 py-10">
        {!result ? (
          <div className="max-w-2xl mx-auto space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">AI Pharmacogenomics</h2>
              <p className="text-slate-500 text-lg">
                Upload genetic data and select medication to receive personalized safety reports 
                grounded in CPIC clinical guidelines.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-3">
                <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            )}

            <VCFUpload onFileSelect={setFile} />
            <DrugSelector selectedDrugs={selectedDrugs} onChange={setSelectedDrugs} />

            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !file || selectedDrugs.length === 0}
              className={`w-full py-4 rounded-xl font-black text-lg shadow-xl transition-all transform active:scale-95 ${
                isAnalyzing 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-blue-500/20'
              }`}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Analyzing Patient Data...
                </span>
              ) : 'Run Clinical Analysis'}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black text-slate-900">Analysis Results</h2>
                <p className="text-slate-500">Report generated on {new Date().toLocaleDateString()}</p>
              </div>
              <button 
                onClick={handleReset}
                className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Start New Analysis
              </button>
            </div>
            
            <ResultDashboard result={result} />

            <div className="bg-slate-900 text-white rounded-2xl p-8 overflow-hidden relative">
              <div className="relative z-10 space-y-4">
                <h3 className="text-xl font-bold">Standardized JSON Output</h3>
                <p className="text-slate-400 text-sm max-w-lg">
                  This payload follows the strict PS1 schema requirements and is ready for integration with EMR systems.
                </p>
                <div className="bg-black/50 rounded-xl p-4 font-mono text-[10px] text-blue-300 max-h-60 overflow-y-auto border border-white/10">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(JSON.stringify(result))}
                  className="bg-white text-slate-900 px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Copy JSON Payload
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl -mr-20 -mt-20"></div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
