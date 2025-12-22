import React, { useState, useMemo, useEffect } from 'react';
import { MOBILIZATION_QUESTS } from '../constants';
import { Timer, Hammer, Hexagon, Gem, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, Clock, Lock, ArrowDown, Zap, Calculator, ChevronDown, ChevronUp, BarChart3, Coins, SlidersHorizontal, MousePointerClick, Pickaxe, CreditCard, HelpCircle, Swords, BookOpen, Lightbulb, Scale, Target, Settings2 } from 'lucide-react';

// Type definitions for user inventory
interface Inventory {
  speedup_general_mins: number;
  speedup_troop_mins: number;
  speedup_building_mins: number;
  speedup_research_mins: number;
  diamonds: number;
  hammer: number;
  hero_shards: number;
  stamina: number;
}

// Helper to convert full-width numbers to half-width
const normalizeInput = (str: string) => {
  return str.replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
};

// Specific handler for time inputs
const TimeInput = ({ 
  label, 
  value, 
  onChange, 
  colorClass 
}: { 
  label: string, 
  value: number, 
  onChange: (mins: number) => void,
  colorClass?: string
}) => {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toLocaleString());
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) {
       setLocalValue(value === 0 ? '' : value.toLocaleString());
    }
  }, [value, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);
    
    if (!isComposing) {
        const normalized = normalizeInput(raw);
        const val = parseInt(normalized.replace(/[^0-9]/g, ''));
        onChange(isNaN(val) ? 0 : val);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const normalized = normalizeInput(e.currentTarget.value);
    const val = parseInt(normalized.replace(/[^0-9]/g, ''));
    onChange(isNaN(val) ? 0 : val);
  };

  return (
    <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 flex items-center justify-between gap-3">
       <label className={`block text-xs font-bold uppercase ${colorClass || 'text-slate-300'}`}>{label}</label>
       <div className="relative w-32">
          <input 
            type="text" 
            inputMode="numeric"
            placeholder="0" 
            value={localValue} 
            onChange={handleChange}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={handleCompositionEnd}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-8 py-2 text-right text-sm text-white focus:ring-1 focus:ring-slate-500 outline-none font-mono"
            onFocus={(e) => e.target.select()}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">分</span>
       </div>
    </div>
  );
};

// Unified Resource Input Component
const ResourceInput = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  iconColor, 
  iconBg,
  unit
}: { 
  label: string, 
  value: number, 
  onChange: (val: string) => void,
  icon: any,
  iconColor: string,
  iconBg: string,
  unit?: string
}) => {
  const [localValue, setLocalValue] = useState(value === 0 ? '' : value.toLocaleString());
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (!isComposing) {
       setLocalValue(value === 0 ? '' : value.toLocaleString());
    }
  }, [value, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalValue(raw);

    if (!isComposing) {
        // We pass the raw value to parent, let parent handle normalization if needed or do it here
        // The parent expects a string to normalize. 
        // We can normalize here to be safe and consistent with TimeInput.
        const normalized = normalizeInput(raw);
        onChange(normalized);
    }
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    setIsComposing(false);
    const normalized = normalizeInput(e.currentTarget.value);
    onChange(normalized);
  };

  return (
    <div className="flex items-center gap-3 bg-[#1E293B] p-3 rounded-xl border border-slate-700 group hover:border-slate-500 transition-colors">
       <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center shrink-0`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
       </div>
       <div className="flex-1">
          <label className="text-xs font-bold text-slate-400 uppercase block mb-0.5">{label}</label>
          <div className="relative">
             <input 
               type="text" 
               inputMode="numeric"
               placeholder="0"
               value={localValue}
               onChange={handleChange}
               onCompositionStart={() => setIsComposing(true)}
               onCompositionEnd={handleCompositionEnd}
               className="w-full bg-transparent text-white font-mono text-lg outline-none placeholder:text-slate-600 appearance-none z-10 relative"
               onFocus={(e) => e.target.select()}
             />
             {unit && <span className="absolute right-0 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none font-sans">{unit}</span>}
          </div>
       </div>
    </div>
  );
};

const MobilizationGuide: React.FC = () => {
  const defaultInventory: Inventory = {
    speedup_general_mins: 0,
    speedup_troop_mins: 0,
    speedup_building_mins: 0,
    speedup_research_mins: 0,
    diamonds: 0,
    hammer: 0,
    hero_shards: 0,
    stamina: 0,
  };

  const [inventory, setInventory] = useState<Inventory>(() => {
    try {
      const saved = localStorage.getItem('kingshot_mobilization_inventory_v3');
      return saved ? { ...defaultInventory, ...JSON.parse(saved) } : defaultInventory;
    } catch (e) {
      return defaultInventory;
    }
  });

  // Target Quests State
  const [targetQuests, setTargetQuests] = useState<number>(() => {
    try {
        const saved = localStorage.getItem('kingshot_mobilization_target');
        return saved ? parseInt(saved) : 51;
    } catch {
        return 51;
    }
  });

  // Strategy Preference State
  const [strategyPreference, setStrategyPreference] = useState<'auto' | 'efficiency' | 'compression'>(() => {
    try {
        const saved = localStorage.getItem('kingshot_mobilization_strategy');
        return (saved as 'auto' | 'efficiency' | 'compression') || 'auto';
    } catch {
        return 'auto';
    }
  });

  const [isSimulationOpen, setIsSimulationOpen] = useState(true);
  const [isImpossibleOpen, setIsImpossibleOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_inventory_v3', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_target', targetQuests.toString());
  }, [targetQuests]);

  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_strategy', strategyPreference);
  }, [strategyPreference]);

  const handleInventoryChange = (field: keyof Inventory, value: string) => {
    // Normalize logic is handled in ResourceInput or here. 
    // Since ResourceInput calls with normalized string (but maybe not stripped of non-digits if user typed garbage),
    // we robustly parse it here.
    const normalized = normalizeInput(value);
    const num = parseInt(normalized.replace(/[^0-9]/g, '')) || 0;
    setInventory(prev => ({ ...prev, [field]: num }));
  };
  
  // --- Enhanced Strategy Simulation ("Sweet Spot" Logic) ---
  const simulation = useMemo(() => {
    let totalPoints = 0;
    let totalQuests = 0;
    const MAX_QUESTS = targetQuests; // Use user selected target
    
    // Tracking leftovers for display
    const remaining = { ...inventory };
    
    const breakdown: { 
      id: string; 
      label: string; 
      questCount: number;
      points: number; 
      details: string[]; 
      icon: any; 
      color: string;
    }[] = [];

    // --- Phase 1: Determine Strategy (Efficiency vs Compression) ---
    const calculatePotentialCount = () => {
        let count = 0;
        
        // Helper to check max potential for a resource type
        const check = (resAmount: number, type: string) => {
            const variants = MOBILIZATION_QUESTS
              .filter(q => q.type === type)
              .flatMap(q => q.variants);
            // Find cheapest variant
            const cheapest = variants.reduce((min, cur) => cur.cost < min.cost ? cur : min, variants[0]);
            if (cheapest && resAmount > 0) {
                count += Math.floor(resAmount / cheapest.cost);
            }
        };

        check(remaining.diamonds, 'diamonds');
        check(remaining.hammer, 'hammer');
        check(remaining.hero_shards, 'hero_shards');
        check(remaining.stamina, 'wild_beast');
        
        // Speedups (Approximation: treat all speedups as potential basic speedup quests)
        const totalSpeedups = remaining.speedup_general_mins + remaining.speedup_troop_mins + remaining.speedup_building_mins + remaining.speedup_research_mins;
        // Cheapest speedup is usually 900 mins
        count += Math.floor(totalSpeedups / 900);

        return count;
    };

    const potentialQuests = calculatePotentialCount();
    const isOverflowMode = potentialQuests > MAX_QUESTS;

    let strategyMode = 'max_quests';
    if (strategyPreference === 'auto') {
        strategyMode = isOverflowMode ? 'max_score' : 'max_quests';
    } else if (strategyPreference === 'compression') {
        strategyMode = 'max_score';
    } else {
        // efficiency
        strategyMode = 'max_quests';
    }

    // --- Helper: Simulate spending a resource ---
    const simulateResourceSpend = (
       resourceKey: keyof Inventory,
       questTypes: string[],
       label: string,
       Icon: any,
       color: string,
       unitLabel: string
    ) => {
        let currentInv = remaining[resourceKey];
        if (currentInv <= 0) return;

        // Find relevant quests
        const relevantVariants = MOBILIZATION_QUESTS
            .filter(q => questTypes.includes(q.type))
            .flatMap(q => q.variants.map(v => ({...v, questLabel: q.label, type: q.type})));

        // --- SORTING STRATEGY ---
        // If Overflow Mode (Too many items for the target): Prioritize High Points (Yellow) to compress usage.
        // If Standard Mode (Not enough items): Prioritize Efficiency (Blue) to fill slots.
        relevantVariants.sort((a, b) => {
            if (strategyMode === 'max_score') {
                // Descending Points (Primary), Ascending Cost (Secondary)
                if (b.points !== a.points) return b.points - a.points;
                return a.cost - b.cost;
            } else {
                // Efficiency: Cost per Point Ascending
                const effA = a.cost / a.points;
                const effB = b.cost / b.points;
                return effA - effB;
            }
        });

        let subPoints = 0;
        let subQuests = 0;
        let subDetails: string[] = [];

        for (const v of relevantVariants) {
            // UNLIMITED MODE: Do not break if we exceed MAX_QUESTS.
            // if (totalQuests >= MAX_QUESTS) break; 

            if (currentInv >= v.cost) {
                let count = Math.floor(currentInv / v.cost);
                
                // UNLIMITED MODE: Do not limit count by remaining slots.
                // const slotsLeft = MAX_QUESTS - totalQuests;
                // if (count > slotsLeft) count = slotsLeft;

                if (count > 0) {
                    subPoints += count * v.points;
                    subQuests += count;
                    totalQuests += count; // Update global immediately
                    currentInv -= (count * v.cost);
                    subDetails.push(`${v.rank}：${v.questLabel} (${v.cost.toLocaleString()}${unitLabel}) × ${count}`);
                }
            }
        }
        
        remaining[resourceKey] = currentInv;

        if (subQuests > 0) {
            totalPoints += subPoints;
            breakdown.push({
                id: resourceKey,
                label,
                questCount: subQuests,
                points: subPoints,
                details: subDetails,
                icon: Icon,
                color
            });
        }
    };

    // Processing Order: Specific items first, then versatile ones
    // 1. Basic Resources
    simulateResourceSpend('diamonds', ['diamonds'], 'ダイヤ消費', Gem, 'text-indigo-400', '個');
    simulateResourceSpend('hammer', ['hammer'], 'ハンマー', Hammer, 'text-amber-500', '個');
    simulateResourceSpend('hero_shards', ['hero_shards'], '英雄の欠片', Hexagon, 'text-purple-400', '個');
    simulateResourceSpend('stamina', ['wild_beast'], '野獣討伐(ソロ)', Swords, 'text-slate-200', '体力');

    // 2. Speedups
    simulateResourceSpend('speedup_troop_mins', ['speedup_troop'], '兵士加速(専用)', Clock, 'text-rose-400', '分');
    simulateResourceSpend('speedup_building_mins', ['speedup_building'], '建築加速(専用)', Clock, 'text-amber-400', '分');
    simulateResourceSpend('speedup_research_mins', ['speedup_research'], '研究加速(専用)', Clock, 'text-blue-400', '分');
    simulateResourceSpend('speedup_general_mins', ['speedup_general'], '一般加速(万能)', Clock, 'text-slate-200', '分');

    return { totalPoints, totalQuests, breakdown, remaining, strategyMode, potentialQuests };
  }, [inventory, targetQuests, strategyPreference]);


  // --- Gap Analysis Logic ---
  const gapAnalysis = useMemo(() => {
    const TARGET = targetQuests;
    const current = simulation.totalQuests;
    const missing = Math.max(0, TARGET - current);
    
    // Proposal Data (Fillers)
    const proposals = [
        {
            type: 'giant_beast',
            label: '巨獣討伐(集結/10回)',
            icon: Zap,
            color: 'text-yellow-400',
            bg: 'bg-yellow-500/10',
            border: 'border-yellow-500/20',
            pointsPerQuest: 300, 
            desc: '集結参加なら体力消費なしで回数稼ぎ'
        },
        {
            type: 'grind',
            label: '資源採集(3.0M)',
            icon: Pickaxe,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            pointsPerQuest: 240, 
            desc: '時間はかかりますが無料で無限に可能'
        },
        {
            type: 'pay',
            label: 'パック購入(2500pt)',
            icon: CreditCard,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            pointsPerQuest: 240, 
            desc: '約610円のパック購入で即達成可能'
        }
    ];

    return { missing, proposals };
  }, [simulation.totalQuests, targetQuests]);


  // --- Cost Calculation Logic (Daily Reset) ---
  const costAnalysis = useMemo(() => {
      // Calculate based on Daily Reset (6 days event)
      // Goal: Reach 'q' total quests.
      // Initial: 9.
      // Added needed: q - 9.
      // Spread over 6 days.
      
      const q = targetQuests; // Use global target
      const INITIAL_QUESTS = 9;
      const EVENT_DAYS = 6;
      
      const needed = Math.max(0, q - INITIAL_QUESTS);
      
      if (needed === 0) return { totalCost: 0, details: ['初期回数(9)以下なので購入不要'] };

      const basePerDay = Math.floor(needed / EVENT_DAYS);
      const remainder = needed % EVENT_DAYS;
      
      // Function to calculate cost for N quests in a single day
      // Structure: 1st=0, 2-4=50, 5-7=200, 8+=1000
      const calculateDailyCost = (n: number) => {
          let c = 0;
          for (let i = 1; i <= n; i++) {
              if (i === 1) c += 0;
              else if (i <= 4) c += 50;
              else if (i <= 7) c += 200;
              else c += 1000;
          }
          return c;
      };

      const costBase = calculateDailyCost(basePerDay);
      const costPlus = calculateDailyCost(basePerDay + 1);
      
      const totalCost = (costPlus * remainder) + (costBase * (EVENT_DAYS - remainder));
      
      let details = [];
      // Formatting the details for UI
      if (basePerDay > 0 || remainder > 0) {
          if (remainder === 0) {
              details.push(`1日 ${basePerDay}個追加 × ${EVENT_DAYS}日間`);
              details.push(`(コスト: ${costBase}ダイヤ/日)`);
          } else {
              // Mixed strategy
              details.push(`${remainder}日間は ${basePerDay + 1}個 (日/${costPlus})`);
              details.push(`${EVENT_DAYS - remainder}日間は ${basePerDay}個 (日/${costBase})`);
          }
      }
      
      return { totalCost, details };
  }, [targetQuests]);


  // --- List View Logic (Possible/Impossible) ---
  const { possible, impossible } = useMemo(() => {
    let possibleList: any[] = [];
    let impossibleList: any[] = [];

    MOBILIZATION_QUESTS.forEach(questType => {
      // Skip filler quests for the specific list, as they are infinite
      if (['gathering', 'giant_beast', 'charge'].includes(questType.type)) return;

      let displayLabel = questType.label;
      if (questType.type === 'speedup_general') displayLabel = '一般加速';

      questType.variants.forEach(variant => {
        let availableInv = 0;
        let isPossible = false;
        let unit = questType.unit || '分';
        
        if (questType.category === 'speedup') {
             const general = inventory.speedup_general_mins;
             if (questType.type === 'speedup_troop') availableInv = inventory.speedup_troop_mins + general;
             else if (questType.type === 'speedup_building') availableInv = inventory.speedup_building_mins + general;
             else if (questType.type === 'speedup_research') availableInv = inventory.speedup_research_mins + general;
             else availableInv = general + inventory.speedup_troop_mins + inventory.speedup_building_mins + inventory.speedup_research_mins;
        } else {
            if (questType.type === 'hammer') availableInv = inventory.hammer;
            else if (questType.type === 'diamonds') availableInv = inventory.diamonds;
            else if (questType.type === 'hero_shards') availableInv = inventory.hero_shards;
            else if (questType.type === 'wild_beast') availableInv = inventory.stamina;
        }

        isPossible = availableInv >= variant.cost;
        let efficiencyScore = variant.cost / variant.points;
        
        const item = { 
            ...variant, 
            label: displayLabel, 
            currentInv: availableInv, 
            efficiencyScore, 
            unit 
        };

        if (isPossible) possibleList.push(item);
        else impossibleList.push(item);
      });
    });

    const sortFn = (a: any, b: any) => a.efficiencyScore - b.efficiencyScore;
    return { possible: possibleList.sort(sortFn), impossible: impossibleList.sort(sortFn) };
  }, [inventory]);

  const getRankBadgeStyle = (rank: string) => {
      switch (rank) {
          case '黄': return 'bg-yellow-500 text-black border-yellow-400';
          case '紫': return 'bg-purple-600 text-white border-purple-500';
          case '青': return 'bg-blue-600 text-white border-blue-500';
          default: return 'bg-slate-700 text-slate-400 border-slate-600';
      }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Inventory Inputs - Moved to Top */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
        <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
           今回のイベントでの予算を入力
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                <span className="flex items-center gap-1"><Gem className="w-3 h-3" /> 基本アイテム</span>
              </div>
              <ResourceInput
                label="使用予定ダイヤ"
                value={inventory.diamonds}
                onChange={v => handleInventoryChange('diamonds', v)}
                icon={Gem} iconColor="text-indigo-400" iconBg="bg-indigo-500/20" unit="個"
              />
              <ResourceInput
                label="レジェンド英雄の欠片"
                value={inventory.hero_shards}
                onChange={v => handleInventoryChange('hero_shards', v)}
                icon={Hexagon} iconColor="text-purple-400" iconBg="bg-purple-500/20" unit="個"
              />
              <ResourceInput
                label="ハンマー"
                value={inventory.hammer}
                onChange={v => handleInventoryChange('hammer', v)}
                icon={Hammer} iconColor="text-amber-500" iconBg="bg-amber-500/20" unit="個"
              />
              <ResourceInput
                label="体力 (野獣討伐用)"
                value={inventory.stamina}
                onChange={v => handleInventoryChange('stamina', v)}
                icon={Zap} iconColor="text-rose-400" iconBg="bg-rose-500/20" unit="個"
              />
            </div>

            <div className="space-y-3">
                 <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 加速アイテム (分)</span>
                    <span className="text-[10px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">一般加速は万能枠として計算</span>
                 </div>
                 
                 <TimeInput label="一般加速 (重要)" colorClass="text-purple-300" 
                    value={inventory.speedup_general_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_general_mins: v}))} 
                 />
                 <TimeInput label="兵士訓練加速" colorClass="text-rose-400" 
                    value={inventory.speedup_troop_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_troop_mins: v}))} 
                 />
                 <TimeInput label="建築加速" colorClass="text-amber-400" 
                    value={inventory.speedup_building_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_building_mins: v}))} 
                 />
                 <TimeInput label="研究加速" colorClass="text-blue-400" 
                    value={inventory.speedup_research_mins} 
                    onChange={v => setInventory(prev => ({...prev, speedup_research_mins: v}))} 
                 />
            </div>
        </div>
      </div>

      {/* Beginner Guide Accordion - MOVED HERE */}
      <div className="bg-slate-800/40 border border-white/5 rounded-xl overflow-hidden">
        <button 
          onClick={() => setIsGuideOpen(!isGuideOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
        >
           <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
             <BookOpen className="w-5 h-5 text-indigo-400" />
             コースの選び方ガイド（初回必見）
           </div>
           {isGuideOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>
        
        {isGuideOpen && (
          <div className="p-4 pt-0 text-sm text-slate-400 space-y-4 animate-in slide-in-from-top-2 duration-300 border-t border-white/5">
            <div className="mt-4 grid md:grid-cols-2 gap-4">
               {/* 33 vs 51 */}
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h4 className="text-indigo-300 font-bold mb-2 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4" />
                    コストの違い（ダイヤ消費）
                  </h4>
                  <div className="space-y-3 text-xs text-slate-400 leading-relaxed">
                    <div>
                      <p className="font-bold text-slate-200 mb-1">クエスト追加コストの仕組み</p>
                      <ul className="list-disc list-inside space-y-0.5 ml-1">
                        <li>1個目：<span className="text-emerald-400">無料</span></li>
                        <li>2～4個目：各<span className="text-amber-400">50</span>ダイヤ</li>
                        <li>5～7個目：各<span className="text-amber-400">200</span>ダイヤ</li>
                        <li>8個目～：各<span className="text-rose-400">1000</span>ダイヤ <span className="text-[10px] bg-rose-900/50 text-rose-300 px-1 rounded ml-1">非推奨</span></li>
                      </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                           <p className="font-bold text-emerald-400 mb-1">33回 (節約)</p>
                           <p>初期9 + 毎日4個×6日</p>
                           <p className="text-[10px] text-slate-400 mt-1">コスト: 50×3×6 = <strong className="text-white">900ダイヤ</strong></p>
                        </div>
                        <div className="bg-slate-800 p-2 rounded border border-slate-700">
                           <p className="font-bold text-indigo-400 mb-1">51回 (完走)</p>
                           <p>初期9 + 毎日7個×6日</p>
                           <p className="text-[10px] text-slate-400 mt-1">コスト: 750×6 = <strong className="text-white">4,500ダイヤ</strong></p>
                        </div>
                    </div>
                  </div>
               </div>

               {/* Why Blue? */}
               <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                  <h4 className="text-amber-300 font-bold mb-2 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    自動計算のロジック & コスパ
                  </h4>
                  
                  {/* NEW SECTION: Why Blue Rank is Better */}
                  <div className="mb-4">
                     <p className="font-bold text-blue-300 text-xs mb-1 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3" />
                        なぜ「青ランク」がお得なのか？
                     </p>
                     <p className="leading-relaxed text-[10px] text-slate-400 mb-2">
                        黄ランクは1回で大量のポイントを稼げますが、消費アイテム量が莫大です。<br/>
                        青ランクはポイントは控えめですが、消費アイテムが非常に少なく済みます。
                     </p>
                     <div className="bg-slate-950 p-2 rounded border border-slate-800 grid grid-cols-2 gap-2 text-[10px] text-center">
                        <div>
                           <div className="text-amber-400 font-bold">黄：一般加速</div>
                           <div className="text-slate-500">7200分で450pt</div>
                           <div className="text-slate-300 mt-0.5 border-t border-slate-800 pt-0.5">1ptあたり16分消費</div>
                        </div>
                        <div className="relative overflow-hidden">
                           <div className="absolute inset-0 bg-blue-500/10 animate-pulse"></div>
                           <div className="relative z-10">
                              <div className="text-blue-400 font-bold">青：一般加速</div>
                              <div className="text-slate-500">900分で160pt</div>
                              <div className="text-white font-bold mt-0.5 border-t border-slate-800 pt-0.5">1ptあたり5.6分消費</div>
                           </div>
                        </div>
                     </div>
                     <p className="text-[10px] text-emerald-400 mt-2 text-center">
                        青ランクの方が圧倒的に低コストでポイントを稼げます！
                     </p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-white/5">
                     <div className="bg-blue-900/20 p-2 rounded border border-blue-500/20">
                        <div className="font-bold text-blue-300 text-xs mb-1">節約モード (青・紫優先)</div>
                        <p className="text-[10px]">
                           アイテムが少ない場合、コスパの良い青ランクを数多くこなして回数を稼ぎます。
                        </p>
                     </div>
                     <div className="bg-amber-900/20 p-2 rounded border border-amber-500/20">
                        <div className="font-bold text-amber-300 text-xs mb-1">圧縮モード (黄優先)</div>
                        <p className="text-[10px]">
                           アイテムが余っている場合、1回あたりのポイントが高い黄ランクで枠を節約します。
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Target Selector & Strategy Header - MOVED DOWN */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
        
        <div>
           <div className="flex items-center gap-2 mb-4">
             <Target className="w-5 h-5 text-indigo-400" />
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">目標クエスト回数の設定</h3>
           </div>
           
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button 
                onClick={() => setTargetQuests(33)}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  targetQuests === 33 
                  ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50' 
                  : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                }`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-2xl font-black ${targetQuests === 33 ? 'text-emerald-400' : 'text-slate-300'}`}>33回</span>
                    {targetQuests === 33 && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                 </div>
                 <div className={`text-xs font-bold mb-1 ${targetQuests === 33 ? 'text-emerald-200' : 'text-slate-400'}`}>節約・微課金コース</div>
                 <p className="text-[10px] text-slate-500 leading-snug">
                   コスト約900ダイヤ。<br/>
                   毎日4回追加のペース。
                 </p>
              </button>

              <button 
                onClick={() => setTargetQuests(51)}
                className={`relative p-4 rounded-xl border text-left transition-all ${
                  targetQuests === 51 
                  ? 'bg-rose-500/10 border-rose-500/50 ring-1 ring-rose-500/50' 
                  : 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10'
                }`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-2xl font-black ${targetQuests === 51 ? 'text-rose-400' : 'text-slate-300'}`}>51回</span>
                    {targetQuests === 51 && <CheckCircle2 className="w-5 h-5 text-rose-500" />}
                 </div>
                 <div className={`text-xs font-bold mb-1 ${targetQuests === 51 ? 'text-rose-200' : 'text-slate-400'}`}>完走・ガチコース</div>
                 <p className="text-[10px] text-slate-500 leading-snug">
                   コスト約4500ダイヤ。<br/>
                   最大報酬を目指すプラン。
                 </p>
              </button>

              <div className={`relative p-4 rounded-xl border text-left transition-all ${
                  targetQuests !== 33 && targetQuests !== 51
                  ? 'bg-slate-700/30 border-slate-500/50 ring-1 ring-slate-500/50' 
                  : 'bg-slate-800/50 border-white/5'
                }`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg font-bold ${targetQuests !== 33 && targetQuests !== 51 ? 'text-white' : 'text-slate-400'}`}>カスタム</span>
                    </div>
                    {(targetQuests !== 33 && targetQuests !== 51) && <CheckCircle2 className="w-5 h-5 text-slate-400" />}
                 </div>
                 <div className="flex items-center gap-2 mt-3">
                    <input 
                      type="number" 
                      min="9" 
                      max="100"
                      value={targetQuests}
                      onChange={(e) => setTargetQuests(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono font-bold text-center outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400 shrink-0">回</span>
                 </div>
              </div>
           </div>

           {/* Strategy Selector */}
           <div className="pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Settings2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">優先戦略モード</h3>
              </div>
              <div className="flex flex-col sm:flex-row bg-slate-900/50 p-1.5 rounded-xl border border-white/5 gap-1">
                 {[
                   { id: 'auto', label: '自動 (推奨)', icon: Zap, color: 'text-white', activeBg: 'bg-slate-600', activeText: 'text-white' },
                   { id: 'efficiency', label: '節約 (青優先)', icon: LayoutGrid, color: 'text-blue-400', activeBg: 'bg-blue-600', activeText: 'text-white' },
                   { id: 'compression', label: '圧縮 (黄優先)', icon: Scale, color: 'text-amber-400', activeBg: 'bg-amber-600', activeText: 'text-white' }
                 ].map(mode => {
                   const isActive = strategyPreference === mode.id;
                   const Icon = mode.icon;
                   return (
                     <button
                       key={mode.id}
                       onClick={() => setStrategyPreference(mode.id as any)}
                       className={`flex-1 flex items-center justify-center gap-2 py-3 sm:py-2 rounded-lg text-xs font-bold transition-all ${
                         isActive 
                         ? `${mode.activeBg} ${mode.activeText} shadow-lg` 
                         : `text-slate-400 hover:text-slate-200 hover:bg-white/5`
                       }`}
                     >
                       <Icon className={`w-4 h-4 ${isActive ? 'text-white' : mode.color}`} />
                       {mode.label}
                     </button>
                   );
                 })}
              </div>
           </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex-1">
                 <h4 className="text-white font-bold flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    現在の目標: {targetQuests}回
                 </h4>
                 <p className="text-xs text-slate-400">
                   {strategyPreference === 'auto' && (targetQuests > 40 
                     ? 'アイテムが余る場合は「高得点（黄）」を優先し、足りない場合は「低コスト（青）」で回数を埋めます。' 
                     : '無理のない範囲で、最も効率の良いクエストを選定します。')}
                   {strategyPreference === 'efficiency' && '可能な限りコストの低い（青・紫）クエストを優先してアイテムを節約します。'}
                   {strategyPreference === 'compression' && '可能な限り1回あたりの得点が高い（黄）クエストを優先して枠を節約します。'}
                 </p>
              </div>
              <div className="flex items-center gap-2 text-xs bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                 <Coins className="w-4 h-4 text-amber-400" />
                 <span className="text-slate-300">必要枠コスト:</span>
                 <span className="font-bold text-white tabular-nums">{costAnalysis.totalCost.toLocaleString()} ダイヤ</span>
              </div>
           </div>
        </div>
      </div>

      <div className="space-y-6">
           
           {/* Quest Strategy Planner */}
           <div className="bg-gradient-to-br from-[#1e1b4b] to-[#312e81] rounded-2xl border border-indigo-500/30 shadow-2xl overflow-hidden">
             
             <div 
               className="p-4 sm:p-6 cursor-pointer flex justify-between items-center bg-white/5 hover:bg-white/10 transition-colors"
               onClick={() => setIsSimulationOpen(!isSimulationOpen)}
             >
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                     <BarChart3 className="w-6 h-6 text-white" />
                   </div>
                   <div>
                      <h3 className="text-white font-bold text-lg sm:text-xl whitespace-nowrap">推奨プラン ({targetQuests}回)</h3>
                      <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">
                        予算消化 + 不足分の補填ガイド
                      </p>
                   </div>
                </div>
                {isSimulationOpen ? <ChevronUp className="text-indigo-300" /> : <ChevronDown className="text-indigo-300" />}
             </div>

             {isSimulationOpen && (
               <div className="bg-[#0B1120]/30 border-t border-indigo-500/20 p-6 animate-in slide-in-from-top-2 duration-300">
                  
                    <div className="space-y-6">
                      
                      {/* Strategy Mode Banner */}
                      <div className={`rounded-xl p-3 flex items-start gap-3 text-sm border ${
                          simulation.strategyMode === 'max_score' 
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' 
                            : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                      }`}>
                          {simulation.strategyMode === 'max_score' ? (
                              <>
                                <Scale className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                                <div>
                                    <div className="font-bold text-amber-400">圧縮モード適用（アイテム豊富）</div>
                                    <p className="text-xs opacity-80 mt-1">
                                        {strategyPreference === 'auto' 
                                          ? <>アイテムが十分にあるため、<strong className="underline">{targetQuests}回に収まるように高ランク（黄）クエスト</strong>を混ぜてスコアを伸ばします。</>
                                          : <>手動選択により、<strong className="underline">高ランク（黄）クエスト</strong>を優先してスコア最大化を目指します。</>
                                        }
                                    </p>
                                </div>
                              </>
                          ) : (
                              <>
                                <LayoutGrid className="w-5 h-5 shrink-0 text-blue-400 mt-0.5" />
                                <div>
                                    <div className="font-bold text-blue-400">節約モード適用（回数重視）</div>
                                    <p className="text-xs opacity-80 mt-1">
                                        {strategyPreference === 'auto'
                                          ? <>アイテムが{targetQuests}回分より少ないため、<strong className="underline">低コスト（青・紫）クエスト</strong>を優先して回数を稼ぎます。</>
                                          : <>手動選択により、<strong className="underline">低コスト（青・紫）クエスト</strong>を優先してアイテムを節約します。</>
                                        }
                                    </p>
                                </div>
                              </>
                          )}
                      </div>

                      {/* Top Summary Stats */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden group">
                            <div className="text-xs text-slate-400 mb-1 z-10 relative">予算で可能な回数</div>
                            <div className="text-3xl font-black text-white flex items-baseline gap-1 z-10 relative">
                               {simulation.totalQuests} 
                               <span className="text-sm font-normal text-slate-500">/ {targetQuests}回</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                                <div className="h-full bg-indigo-500 transition-all duration-1000" style={{width: `${Math.min((simulation.totalQuests/targetQuests)*100, 100)}%`}}></div>
                            </div>
                         </div>
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full">
                            <div className="text-xs text-slate-400 mb-1">予算での獲得P</div>
                            <div className="text-3xl font-black text-white flex items-baseline gap-1">{simulation.totalPoints.toLocaleString()} <span className="text-sm font-normal text-indigo-300">pt</span></div>
                         </div>
                      </div>

                      {/* Gap Recommendation Section */}
                      {gapAnalysis.missing > 0 ? (
                          <div className="bg-slate-900/80 rounded-xl border border-rose-500/30 p-5 shadow-lg relative overflow-hidden">
                              <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                              
                              <h4 className="text-rose-200 font-bold flex items-center gap-2 mb-4 relative z-10">
                                  <AlertTriangle className="w-5 h-5 text-rose-400" />
                                  目標まであと <span className="text-2xl font-black text-white">{gapAnalysis.missing}</span> 回
                              </h4>
                              
                              <p className="text-xs text-slate-400 mb-4 relative z-10">
                                  以下のいずれかの方法で不足分を埋めると、{targetQuests}回を達成できます。
                              </p>

                              <div className="grid gap-3 relative z-10">
                                  {gapAnalysis.proposals.map((prop, idx) => (
                                      <div key={idx} className={`flex items-center justify-between p-3 rounded-lg border bg-slate-950/50 ${prop.border}`}>
                                          <div className="flex items-center gap-3">
                                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${prop.bg}`}>
                                                  <prop.icon className={`w-5 h-5 ${prop.color}`} />
                                              </div>
                                              <div>
                                                  <div className={`font-bold text-sm ${prop.color}`}>{prop.label}</div>
                                                  <div className="text-[10px] text-slate-500">{prop.desc}</div>
                                              </div>
                                          </div>
                                          <div className="text-right">
                                              <div className="text-lg font-black text-white">
                                                  × {gapAnalysis.missing}
                                              </div>
                                              <div className="text-[10px] text-slate-400">
                                                  +{gapAnalysis.missing * prop.pointsPerQuest} pts
                                              </div>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      ) : (
                          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-5 flex items-center gap-4">
                              <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center shrink-0">
                                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                              </div>
                              <div>
                                  <h4 className="text-emerald-200 font-bold text-lg">予算のみで目標達成可能です！</h4>
                                  <p className="text-emerald-200/70 text-sm">追加の採取や課金は必要ありません。</p>
                              </div>
                          </div>
                      )}

                      {/* Breakdown List */}
                      {simulation.breakdown.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">推奨クエスト内訳 ({simulation.strategyMode === 'max_score' ? '高スコア優先' : 'コスト効率優先'})</div>
                            {simulation.breakdown.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50 p-3 rounded-lg border border-indigo-500/10">
                                <div className="flex items-start gap-3">
                                    <item.icon className={`w-5 h-5 mt-0.5 ${item.color}`} />
                                    <div>
                                    <div className={`text-sm font-bold ${item.color} flex items-center gap-2`}>
                                        {item.label}
                                        <span className="text-xs text-white bg-slate-700 px-1.5 rounded">{item.questCount}回</span>
                                    </div>
                                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                                        {item.details.map((d, i) => (
                                        <span key={i} className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">{d}</span>
                                        ))}
                                    </div>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 pl-8 sm:pl-0">
                                    <div className="text-lg font-bold text-white tabular-nums">
                                    +{item.points.toLocaleString()} pt
                                    </div>
                                </div>
                            </div>
                            ))}
                        </div>
                      )}

                    </div>
               </div>
             )}
           </div>

           {/* Possible Quests List */}
           <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl">
              <h3 className="text-slate-300 text-sm font-bold uppercase tracking-wider mb-6 flex items-center justify-between">
                 <span>達成可能クエスト一覧</span>
                 <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded border border-slate-700">
                    効率順
                 </span>
              </h3>
              
              <div className="space-y-3">
                 {possible.length > 0 ? (
                    possible.map((rec, idx) => (
                       <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all hover:translate-x-1 ${
                          rec.rank === '青' ? 'bg-indigo-900/20 border-indigo-500/50 shadow-lg shadow-indigo-900/10' :
                          'bg-slate-800/50 border-slate-700'
                       }`}>
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold text-lg border shadow-inner ${getRankBadgeStyle(rec.rank)}`}>
                                <span>{rec.rank}</span>
                             </div>
                             
                             <div>
                                <h4 className={`font-bold text-base ${rec.color} flex items-center gap-2`}>
                                   {rec.label}
                                   <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                                      効率: {rec.efficiencyScore.toFixed(1)}
                                   </span>
                                </h4>
                                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                                   <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">
                                      コスト: {rec.cost.toLocaleString()}{rec.unit}
                                   </span>
                                   <ArrowRight className="w-3 h-3" />
                                   <span className="text-white font-bold">{rec.points} pt</span>
                                </div>
                             </div>
                          </div>

                          <div className="text-right shrink-0">
                             <div className="text-xs text-slate-500 mb-1">実質予算</div>
                             <div className="text-sm font-mono text-slate-300">
                                {rec.currentInv.toLocaleString()} {rec.unit}
                             </div>
                          </div>
                       </div>
                    ))
                 ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-4">
                       <CheckCircle2 className="w-12 h-12 opacity-20" />
                       <p className="text-center text-sm">
                          予算を入力すると、<br/>達成可能なクエストが表示されます。
                       </p>
                    </div>
                 )}
              </div>
           </div>

           {/* Impossible Quests */}
           <div className="bg-[#0F172A]/50 backdrop-blur-sm rounded-2xl border border-white/5 overflow-hidden transition-all">
              <div 
                 className="p-6 cursor-pointer hover:bg-white/5 transition-colors flex items-center justify-between select-none"
                 onClick={() => setIsImpossibleOpen(!isImpossibleOpen)}
              >
                 <h3 className="text-slate-500 text-sm font-bold uppercase tracking-wider flex items-center gap-3">
                    <div className="flex items-center gap-2"><Lock className="w-4 h-4" /> 予算不足クエスト</div>
                    <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-slate-500">
                       {impossible.length} 件
                    </span>
                 </h3>
                 <div className="text-slate-500">
                   {isImpossibleOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                 </div>
              </div>
              
              {isImpossibleOpen && (
                <div className="px-6 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-300">
                   {impossible.length > 0 ? (
                      impossible.map((rec, idx) => (
                         <div key={idx} className="p-3 rounded-lg border border-slate-800 bg-slate-900/30 flex items-center justify-between gap-4 grayscale hover:grayscale-0 transition-all">
                            <div className="flex items-center gap-4 opacity-60">
                               <div className={`w-10 h-10 rounded flex flex-col items-center justify-center shrink-0 font-bold text-sm border ${getRankBadgeStyle(rec.rank)}`}>
                                  <span>{rec.rank}</span>
                                </div>
                               <div>
                                  <h4 className="font-bold text-sm text-slate-400">
                                     {rec.label}
                                  </h4>
                                  <div className="text-[10px] text-slate-500 mt-0.5">
                                     {rec.points} pt / {rec.cost.toLocaleString()}{rec.unit}
                                  </div>
                               </div>
                            </div>
                            <div className="text-right shrink-0">
                               <div className="text-[10px] text-rose-500/70 font-bold mb-0.5 flex items-center justify-end gap-1">
                                  <AlertTriangle className="w-3 h-3" /> 不足
                                </div>
                               <div className="text-xs font-mono text-rose-400">
                                  -{(rec.cost - rec.currentInv).toLocaleString()} {rec.unit}
                               </div>
                            </div>
                         </div>
                      ))
                   ) : (
                      <div className="text-center py-4 text-xs text-slate-600">
                         現在、予算不足のクエストはありません。
                      </div>
                   )}
                </div>
              )}
           </div>

      </div>
    </div>
  );
};

// Simple Icon component for the mode switch
const LayoutGrid = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
)

export default MobilizationGuide;