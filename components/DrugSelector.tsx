
import React from 'react';
import { SUPPORTED_DRUGS } from '../constants';

interface DrugSelectorProps {
  selectedDrugs: string[];
  onChange: (drugs: string[]) => void;
}

const DrugSelector: React.FC<DrugSelectorProps> = ({ selectedDrugs, onChange }) => {
  const toggleDrug = (drug: string) => {
    if (selectedDrugs.includes(drug)) {
      onChange(selectedDrugs.filter(d => d !== drug));
    } else {
      onChange([...selectedDrugs, drug]);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <h3 className="text-lg font-bold text-slate-800 mb-4">Select Drugs to Analyze</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SUPPORTED_DRUGS.map(drug => {
          const isSelected = selectedDrugs.includes(drug);
          return (
            <button
              key={drug}
              onClick={() => toggleDrug(drug)}
              className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all font-medium text-sm ${
                isSelected 
                ? 'bg-blue-50 border-blue-500 text-blue-700' 
                : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {isSelected && (
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
              {drug}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DrugSelector;
