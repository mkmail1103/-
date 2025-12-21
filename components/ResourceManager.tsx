
import React, { useState, useEffect } from 'react';
import { RESOURCE_CONFIGS } from '../constants';
import { ResourceType } from '../types';
import { Calculator, AlertTriangle, TrendingDown, Scale, ArrowDown, Medal, ArrowRight, Info, ChevronDown, ChevronUp } from 'lucide-react';

const ResourceManager: React.FC = () => {
  // State for current holdings (string to allow "1.5m" inputs) for all resources
  // Initialize from local storage if available
  const [holdings, setHoldings] = useState<Record<ResourceType, string>>(() => {
    try {
      const saved = localStorage.getItem('kingshot_resources');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch(e) {
      // ignore error
    }
    return {
      food: '',
      wood: '',
      stone: '',
      iron: ''
    };
  });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('kingshot_resources', JSON.stringify(holdings));
  }, [holdings]);

  // State to track IME composition status to prevent input duplication bugs
  const [isComposing, setIsComposing] = useState(false);

  // State for instruction visibility
  const [isInstructionOpen, setIsInstructionOpen] = useState(false);

  // --- Helper: Full-width to Half-width Conversion ---
  const toHalfWidth = (str: string): string => {
    return str
      .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0))
      .replace(/．/g, '.')
      .replace(/，/g, ',');
  };

  // --- Smart Parsing Logic ---
  const parseSmartNumber = (val: string): number => {
    if (!val) return 0;
    const normalized = toHalfWidth(val);
    const lower = normalized.toLowerCase().replace(/,/g, '').trim();
    const num = parseFloat(lower);
    if (isNaN(num)) return 0;

    if (lower.endsWith('k')) return num * 1000;
    if (lower.endsWith('m')) return num * 1000000;
    if (lower.endsWith('g')) return num * 1000000000;
    return num;
  };

  const handleHoldingChange = (id: ResourceType, val: string) => {
    if (isComposing) {
      setHoldings(prev => ({ ...prev, [id]: val }));
      return;
    }
    const normalized = toHalfWidth(val);
    setHoldings(prev => ({ ...prev, [id]: normalized }));
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>, id: ResourceType) => {
    setIsComposing(false);
    const normalized = toHalfWidth(e.currentTarget.value);
    setHoldings(prev => ({ ...prev, [id]: normalized }));
  };

  const applyMultiplier = (id: ResourceType, mult: string) => {
    const current = holdings[id];
    if (!current) {
        setHoldings(prev => ({ ...prev, [id]: mult }));
        return;
    }
    const base = toHalfWidth(current).replace(/[kmg]$/i, '');
    setHoldings(prev => ({ ...prev, [id]: base + mult }));
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  // --- Calculations ---
  // Calculate Score = Total Value / Ratio
  // Lower score means more scarce relative to the ideal ratio
  const analysisData = RESOURCE_CONFIGS.map(config => {
    const val = parseSmartNumber(holdings[config.id]);
    const score = config.ratio > 0 ? val / config.ratio : 0;
    return {
      ...config,
      val,
      score,
      hasInput: val > 0
    };
  });

  // Only rank if we have some data
  const hasAnyInput = analysisData.some(d => d.val > 0);
  
  // Sort by score ascending (Lowest score = #1 Priority)
  const rankedData = [...analysisData].sort((a, b) => {
    if (a.score === b.score) return 0;
    return a.score - b.score;
  });

  // Calculate relative % for visualization
  // Max score is 100% width
  const maxScore = Math.max(...analysisData.map(d => d.score)) || 1;

  // Helper for formatting large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'G';
    if (num >= 1000000) return (num / 1000000).toLocaleString(undefined, { maximumFractionDigits: 2 }) + 'M';
    if (num >= 1000) return (num / 1000).toLocaleString(undefined, { maximumFractionDigits: 1 }) + 'K';
    return num.toLocaleString();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Introduction Card - Collapsible */}
      <div className="bg-slate-800/50 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300">
         <div 
            onClick={() => setIsInstructionOpen(!isInstructionOpen)}
            className="p-4 cursor-pointer hover:bg-white/5 transition-colors flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 select-none"
         >
            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-400" />
                資源バランス診断 (比率 20:20:4:1)
            </h3>
            
            <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-300 ${
                isInstructionOpen 
                ? 'bg-slate-700 text-slate-200 border-slate-600' 
                : 'bg-slate-900/50 text-slate-400 border-white/5 hover:text-slate-200 hover:border-white/10'
            }`}>
                <Info className="w-3.5 h-3.5" />
                <span>総資源の確認方法</span>
                {isInstructionOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </div>
         </div>
         
         {isInstructionOpen && (
             <div className="px-6 pb-6 pt-2 border-t border-white/5 bg-slate-800/30 animate-in slide-in-from-top-2 fade-in duration-200">
                <div className="bg-slate-900/50 rounded-xl border border-white/5 mb-4 shadow-inner max-w-2xl mx-auto overflow-hidden mt-2">
                    <div className="bg-white/5 py-2 px-3 text-center border-b border-white/5">
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                           <Info className="w-3.5 h-3.5" />
                           データの確認場所
                        </div>
                    </div>
                    
                    <div className="p-4 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm font-medium text-slate-300">
                       <span className="bg-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-200 border border-slate-600/50 whitespace-nowrap">バッグ</span>
                       
                       <ArrowRight className="w-3.5 h-3.5 text-slate-600 rotate-90 sm:rotate-0" />
                       
                       <span className="bg-slate-700/80 px-3 py-1.5 rounded-lg text-xs text-slate-200 border border-slate-600/50 whitespace-nowrap">右上のグラフアイコン</span>
                       
                       <ArrowRight className="w-3.5 h-3.5 text-slate-600 rotate-90 sm:rotate-0" />
                       
                       <span className="text-amber-400 font-bold bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)] whitespace-nowrap">「総資源」を入力</span>
                    </div>
                </div>

                <p className="text-slate-400 text-sm text-center leading-relaxed">
                   上記の場所で確認できる数値を入力してください。
                </p>
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl relative overflow-hidden">
            
            <div className="mb-6 bg-slate-800/50 -mx-6 -mt-6 p-4 border-b border-white/5">
              <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4" />
                総資源入力
              </h3>
            </div>

            <div className="space-y-6">
              {RESOURCE_CONFIGS.map((config) => (
                <div key={config.id} className="space-y-2">
                   <div className="flex justify-between items-center px-1">
                      <label className={`text-sm font-bold flex items-center gap-2 ${config.color}`}>
                         {config.name}
                         <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                            比率 {config.ratio}
                         </span>
                      </label>
                      {holdings[config.id] && (
                        <span className="text-xs text-slate-500 font-mono">
                          {parseSmartNumber(holdings[config.id]).toLocaleString()}
                        </span>
                      )}
                   </div>
                   
                   <div className="flex gap-1.5">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={holdings[config.id]}
                        onChange={(e) => handleHoldingChange(config.id, e.target.value)}
                        onCompositionStart={() => setIsComposing(true)}
                        onCompositionEnd={(e) => handleCompositionEnd(e, config.id)}
                        onFocus={handleFocus}
                        placeholder="0"
                        className={`min-w-0 flex-1 bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-3 py-3 text-lg font-mono text-white focus:ring-2 focus:${config.ringColor} outline-none shadow-inner transition-colors placeholder:text-slate-600`}
                      />
                      <div className="flex gap-0.5 shrink-0">
                        {['k', 'm', 'g'].map((unit) => (
                          <button
                            key={unit}
                            onClick={() => applyMultiplier(config.id, unit)}
                            className={`w-9 rounded-lg font-bold text-sm transition-all border border-slate-700 hover:border-slate-500 active:scale-95 flex items-center justify-center uppercase
                              ${holdings[config.id].toLowerCase().endsWith(unit) 
                                ? `${config.bgColor} text-white shadow-lg` 
                                : 'bg-[#1E293B] text-slate-400 hover:text-white hover:bg-slate-700'
                              }
                            `}
                          >
                            {unit}
                          </button>
                        ))}
                      </div>
                   </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">
                ※ K=1,000, M=1,000,000, G=1,000,000,000
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Results */}
        <div className="space-y-6">
           {hasAnyInput ? (
             <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl h-full flex flex-col">
                <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  採取優先度ランキング (不足順)
                </h3>

                <div className="space-y-4 flex-1">
                   {rankedData.map((data, index) => {
                     // Calculate width relative to the most abundant resource
                     const percentage = maxScore > 0 ? (data.score / maxScore) * 100 : 0;
                     const isTopPriority = index === 0;

                     return (
                       <div key={data.id} className={`relative p-4 rounded-xl border transition-all duration-500 ${
                         isTopPriority 
                           ? 'bg-gradient-to-r from-slate-800 to-slate-800/50 border-rose-500/50 shadow-lg shadow-rose-900/10' 
                           : 'bg-slate-800/30 border-slate-700/50'
                       }`}>
                          {isTopPriority && (
                            <div className="absolute -top-3 -right-3">
                               <div className="bg-rose-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg flex items-center gap-1 animate-bounce">
                                 <AlertTriangle className="w-3 h-3 fill-white" />
                                 最優先
                               </div>
                            </div>
                          )}

                          <div className="flex justify-between items-end mb-2 relative z-10">
                             <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-lg ${
                                   isTopPriority ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-400'
                                }`}>
                                   {index + 1}
                                </div>
                                <div>
                                   <div className={`font-bold text-lg leading-none ${data.color}`}>{data.name}</div>
                                   <div className="text-[10px] text-slate-500 mt-1">現在: {formatNumber(data.val)}</div>
                                </div>
                             </div>
                             
                             <div className="text-right">
                                {isTopPriority ? (
                                   <div className="text-rose-400 text-xs font-bold flex items-center justify-end gap-1">
                                      <ArrowDown className="w-3 h-3" /> 不足
                                   </div>
                                ) : (
                                   <div className="text-emerald-400 text-xs font-bold">充足気味</div>
                                )}
                             </div>
                          </div>

                          {/* Visualization Bar */}
                          <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden relative">
                             {/* Background grid lines for ratio visualization optional */}
                             <div 
                                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                   isTopPriority ? 'bg-rose-500' : data.bgColor
                                }`}
                                style={{ width: `${Math.max(percentage, 2)}%` }}
                             ></div>
                          </div>
                          
                          <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
                             <span>バランス充足率</span>
                             <span>{Math.round(percentage)}%</span>
                          </div>
                       </div>
                     );
                   })}
                </div>
                
                <div className="mt-6 pt-4 border-t border-white/5 text-center">
                    <p className="text-sm text-slate-400">
                       <span className="font-bold text-rose-400">{rankedData[0].name}</span> を中心に採取しましょう！
                    </p>
                </div>
             </div>
           ) : (
             <div className="bg-[#0F172A]/50 rounded-xl border border-white/5 h-full flex flex-col items-center justify-center p-10 text-slate-600">
                <Medal className="w-16 h-16 mb-4 opacity-20" />
                <p>数値を入力すると<br/>ランキングが表示されます</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default ResourceManager;
