import React, { useState, useMemo, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MOBILIZATION_QUESTS } from '../constants';
import { Timer, Hammer, Hexagon, Gem, ArrowRight, TrendingUp, AlertTriangle, CheckCircle2, Clock, ArrowDown, Zap, Calculator, ChevronDown, ChevronUp, BarChart3, Coins, Pickaxe, CreditCard, HelpCircle, Swords, BookOpen, Lightbulb, Target, Camera, Loader2, Info, ArrowUpCircle, Lock } from 'lucide-react';

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

// --- ALGORITHM TYPES ---
interface QuestVariant {
  type: string;
  rank: string;
  cost: number;
  points: number;
  questLabel: string;
  unit: string;
  resourceKey: keyof Inventory; // Helper to know which resource to deduct
  icon: any;
  color: string;
  efficiency: number; // Cost per Point
}

interface BreakdownItem {
  id: string;
  label: string;
  questCount: number;
  points: number;
  details: string[];
  icon: any;
  color: string;
  unit: string;
}

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
        return saved ? Math.min(69, parseInt(saved)) : 51;
    } catch {
        return 51;
    }
  });

  const [isSimulationOpen, setIsSimulationOpen] = useState(true);
  const [isImpossibleOpen, setIsImpossibleOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSpeedupInstructionOpen, setIsSpeedupInstructionOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_inventory_v3', JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem('kingshot_mobilization_target', targetQuests.toString());
  }, [targetQuests]);

  const handleInventoryChange = (field: keyof Inventory, value: string) => {
    const normalized = normalizeInput(value);
    const num = parseInt(normalized.replace(/[^0-9]/g, '')) || 0;
    setInventory(prev => ({ ...prev, [field]: num }));
  };

  // --- Image Analysis Helper: Resize & Compress ---
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Resize to max 1024px to save bandwidth/memory while keeping text readable
        const MAX_SIZE = 1024;
        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round(height * (MAX_SIZE / width));
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round(width * (MAX_SIZE / height));
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error("Canvas context failed"));
            return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG 0.7 quality
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
      };
      
      img.src = url;
    });
  };

  // --- Image Analysis for Speedups ---
  const handleSpeedupImageAnalysis = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);

    try {
      // Compress image first to fix mobile issues
      const base64Data = await compressImage(file);
      const base64Content = base64Data.split(',')[1];
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Content
              }
            },
            {
              text: `Analyze this game inventory screenshot to calculate the TOTAL minutes of speed-up items.
Identify items by icon and text:
1. General Speedup (Commonly blue arrows/clock, "一般加速"): Key "speedup_general_mins"
2. Troop/Training Speedup (Helmet/Sword/Red, "訓練加速"): Key "speedup_troop_mins"
3. Building Speedup (Hammer/Orange, "建築加速"): Key "speedup_building_mins"
4. Research Speedup (Flask/Atom/Blue, "研究加速"): Key "speedup_research_mins"

For each item found:
1. Identify the time duration (e.g., "5m", "1h", "1d", "5分", "1時間").
2. Identify the quantity owned (e.g., "x10", "Owned: 50").
3. Calculate total minutes = duration_in_minutes * quantity.
   (1h = 60m, 1d = 1440m)

Sum up the totals for each category.
Return ONLY a JSON object with keys: "speedup_general_mins", "speedup_troop_mins", "speedup_building_mins", "speedup_research_mins".
Values must be integers (total minutes). If a category is not found, do not include the key or set to null.
`
            }
          ]
        },
        config: {
          responseMimeType: "application/json"
        }
      });
      
      const resultText = response.text;
      if (resultText) {
          const data = JSON.parse(resultText);
          setInventory(prev => ({
            ...prev,
            speedup_general_mins: data.speedup_general_mins !== null && data.speedup_general_mins !== undefined ? data.speedup_general_mins : prev.speedup_general_mins,
            speedup_troop_mins: data.speedup_troop_mins !== null && data.speedup_troop_mins !== undefined ? data.speedup_troop_mins : prev.speedup_troop_mins,
            speedup_building_mins: data.speedup_building_mins !== null && data.speedup_building_mins !== undefined ? data.speedup_building_mins : prev.speedup_building_mins,
            speedup_research_mins: data.speedup_research_mins !== null && data.speedup_research_mins !== undefined ? data.speedup_research_mins : prev.speedup_research_mins,
          }));
      }
    } catch (err) {
      console.error("AI Analysis/Compression Error:", err);
      alert("画像の解析に失敗しました。もう一度試すか、手動で入力してください。");
    } finally {
      setIsAnalyzing(false);
      // Reset input so same file can be selected again
      e.target.value = '';
    }
  };

  // --- HELPER: Quest Definitions ---
  // Maps constants to a flatter structure for the algorithm
  const availableQuestVariants = useMemo(() => {
    const variants: QuestVariant[] = [];
    
    // Mapping Quest Types to Resource Keys and Icons
    const mapTypeToResource: Record<string, { key: keyof Inventory, icon: any, color: string, unit: string }> = {
       'speedup_general': { key: 'speedup_general_mins', icon: Clock, color: 'text-slate-200', unit: '分' },
       'speedup_troop': { key: 'speedup_troop_mins', icon: Clock, color: 'text-rose-400', unit: '分' },
       'speedup_building': { key: 'speedup_building_mins', icon: Clock, color: 'text-amber-400', unit: '分' },
       'speedup_research': { key: 'speedup_research_mins', icon: Clock, color: 'text-blue-400', unit: '分' },
       'diamonds': { key: 'diamonds', icon: Gem, color: 'text-indigo-400', unit: '個' },
       'hammer': { key: 'hammer', icon: Hammer, color: 'text-amber-500', unit: '個' },
       'hero_shards': { key: 'hero_shards', icon: Hexagon, color: 'text-purple-400', unit: '個' },
       'wild_beast': { key: 'stamina', icon: Swords, color: 'text-slate-200', unit: '体力' },
    };

    MOBILIZATION_QUESTS.forEach(q => {
       const info = mapTypeToResource[q.type];
       if (!info) return;

       q.variants.forEach(v => {
          variants.push({
             type: q.type,
             questLabel: q.label,
             rank: v.rank,
             cost: v.cost,
             points: v.points,
             resourceKey: info.key,
             icon: info.icon,
             color: info.color,
             unit: info.unit,
             efficiency: v.cost / v.points // Lower is better resource efficiency (Blue)
          });
       });
    });

    return variants;
  }, []);

  // --- CORE ALGORITHM: Simulation ---
  const calculatePlan = (target: number, currentInventory: Inventory) => {
      // 1. Group variants by Type (e.g. "Building Speedup")
      const groupedVariants: Record<string, QuestVariant[]> = {};
      availableQuestVariants.forEach(v => {
          if (!groupedVariants[v.type]) groupedVariants[v.type] = [];
          groupedVariants[v.type].push(v);
      });
      
      // Sort each group by Points ASC (Blue -> Purple -> Yellow)
      Object.keys(groupedVariants).forEach(key => {
          groupedVariants[key].sort((a, b) => a.points - b.points);
      });

      // 2. Initial Pass: Fill with Cheapest (Blue) to ensure we hit Target count
      let selectedQuests: QuestVariant[] = [];
      let tempInv = { ...currentInventory };
      
      // Helper to check/deduct cost
      const canAfford = (v: QuestVariant, inv: Inventory): boolean => {
          let needed = v.cost;
          let available = inv[v.resourceKey];
          
          // Speedup Logic: Use specific first, then general
          if (v.type.startsWith('speedup_') && v.type !== 'speedup_general') {
              if (available >= needed) return true;
              needed -= available;
              return inv.speedup_general_mins >= needed;
          }
          return available >= needed;
      };

      const deduct = (v: QuestVariant, inv: Inventory) => {
          let needed = v.cost;
          
          if (v.type.startsWith('speedup_') && v.type !== 'speedup_general') {
             const specific = inv[v.resourceKey];
             const usedSpecific = Math.min(specific, needed);
             inv[v.resourceKey] -= usedSpecific;
             needed -= usedSpecific;
             if (needed > 0) {
                 inv.speedup_general_mins -= needed;
             }
          } else {
             inv[v.resourceKey] -= needed;
          }
      };
      
      // Greedy Fill for Count (Prioritize Cheapest globally)
      // Flatten all affordable options? No, just iterative.
      // We want to reach Target.
      
      while (selectedQuests.length < target) {
          // Find the absolute most resource-efficient quest available across ALL types
          // Efficiency = cost relative to type? 
          // Actually, cost scales are different (Diamonds vs Minutes).
          // Heuristic: Just pick the cheapest available variant of ANY type.
          
          // Let's iterate all Quest Types. For each type, see if we can afford the *cheapest* variant.
          // Collect all affordable cheapest variants. Pick one.
          // To ensure diversity, maybe round robin? Or just bulk.
          // Actually, we want to save high-value resources for upgrades.
          // Let's prioritize spending Stamina/Items before Speedups if possible?
          // For now, let's just find *any* affordable cheapest variant.
          
          let candidates: QuestVariant[] = [];
          
          Object.values(groupedVariants).forEach(variants => {
              // The first one is the cheapest (Blue)
              const cheap = variants[0];
              if (canAfford(cheap, tempInv)) {
                  candidates.push(cheap);
              }
          });

          if (candidates.length === 0) break; // Cannot afford anything more
          
          // Pick one. Strategy: Use types that have the most "spare" capacity?
          // Simplest: Just pick the first one found.
          // Better: Pick the one that yields the least points? (Since we want to upgrade later)
          // Actually, all cheapest are usually Blue.
          const chosen = candidates[0]; 
          deduct(chosen, tempInv);
          selectedQuests.push(chosen);
      }
      
      const maxReachedCount = selectedQuests.length;

      // 3. Optimization Pass: Upgrade to maximize Points
      // We have `selectedQuests` (mostly Blue). 
      // We have `tempInv` (remaining resources).
      // Try to "Upgrade" each selected quest to a higher tier variant of the SAME type.
      
      // Sort selected quests by current points ASC (try to upgrade Blues first)
      selectedQuests.sort((a, b) => a.points - b.points);

      // We need to reconstruct the list because we might change items.
      // Actually, we can just iterate and swap in place if affordable.
      
      for (let i = 0; i < selectedQuests.length; i++) {
          const current = selectedQuests[i];
          const variants = groupedVariants[current.type];
          
          // Find higher tier variants
          // Variants are sorted by points ASC.
          // Try from highest (Yellow) down to current.
          for (let j = variants.length - 1; j >= 0; j--) {
              const upgrade = variants[j];
              if (upgrade.points <= current.points) break; // No better than current
              
              // Calculate cost difference
              const costDiff = upgrade.cost - current.cost;
              
              // Check if we can afford the difference
              // This implies temporarily refunding current and checking upgrade
              // Refund
              const refundInv = { ...tempInv };
              
              // Refund Logic (Simplified: Add back to primary resource. 
              // If it was split speedup, it's tricky to know where it came from.
              // Conservative: Add back to primary key.
              // Wait, `deduct` modifies `tempInv` in place.
              // To check "Upgrade", we need: Available + CurrentCost >= UpgradeCost.
              
              // Let's do a strict check:
              // Refund current cost conceptually
              // Checking:
              let availablePrimary = tempInv[current.resourceKey] + (current.type.startsWith('speedup_') && current.type!=='speedup_general' ? 0 : current.cost); 
              // Note: Speedup refund is messy because we don't track how much general was used.
              // WORKAROUND: We iterate upgrades. If we afford Yellow, swap.
              
              // Robust Check:
              // 1. Create a temp inventory state as if we hadn't bought 'current'
              // Since we don't track history, let's just try to buy 'upgrade' using 'tempInv'. 
              // If we can't, check if 'tempInv + current.cost' can buy 'upgrade'.
              
              // Let's use the `costDiff` approach.
              // If upgrade.cost > current.cost, we need to spend `diff`.
              // Can we afford `diff`?
              
              const diff = upgrade.cost - current.cost;
              // Mock object for "canAfford"
              // We need to construct a fake variant representing the Diff
              const diffVariant = { ...upgrade, cost: diff };
              
              if (canAfford(diffVariant, tempInv)) {
                  // Execute Upgrade
                  deduct(diffVariant, tempInv);
                  selectedQuests[i] = upgrade; // Swap
                  break; // Move to next quest
              }
          }
      }

      // Calculate totals
      const totalPoints = selectedQuests.reduce((sum, q) => sum + q.points, 0);
      
      // Generate Breakdown
      const breakdown: BreakdownItem[] = [];
      const groupedResult: Record<string, { count: number, points: number, details: string[], icon: any, color: string, label: string, unit: string }> = {};
      
      selectedQuests.forEach(q => {
          if (!groupedResult[q.resourceKey]) {
              groupedResult[q.resourceKey] = { 
                  count: 0, 
                  points: 0, 
                  details: [], 
                  icon: q.icon, 
                  color: q.color, 
                  label: q.questLabel.split('(')[0], // Simple label
                  unit: q.unit
              };
          }
          groupedResult[q.resourceKey].count++;
          groupedResult[q.resourceKey].points += q.points;
          groupedResult[q.resourceKey].details.push(q.rank);
      });

      Object.entries(groupedResult).forEach(([key, data]) => {
          // Compress details (e.g., "黄, 黄, 青" -> "黄x2, 青x1")
          const counts = data.details.reduce((acc, curr) => { acc[curr] = (acc[curr]||0)+1; return acc; }, {} as Record<string, number>);
          const detailStr = Object.entries(counts)
            .sort((a, b) => b[1] - a[1]) // Sort by count desc
            .map(([rank, count]) => `${rank}×${count}`)
            .join(', ');

          breakdown.push({
              id: key,
              label: data.label, // Simplified label
              questCount: data.count,
              points: data.points,
              details: [detailStr],
              icon: data.icon,
              color: data.color,
              unit: data.unit
          });
      });

      return { totalPoints, totalQuests: maxReachedCount, breakdown, remaining: tempInv };
  };

  // --- MAIN SIMULATION ---
  const simulation = useMemo(() => {
      return calculatePlan(targetQuests, inventory);
  }, [inventory, targetQuests]);

  // --- COST CALCULATION HELPER ---
  const calculateEventCost = (target: number) => {
    const INITIAL_QUESTS = 9;
    const EVENT_DAYS = 6;
    const needed = Math.max(0, target - INITIAL_QUESTS);
    
    if (needed === 0) return { totalCost: 0, details: ['初期回数(9)以下なので購入不要'] };

    const basePerDay = Math.floor(needed / EVENT_DAYS);
    const remainder = needed % EVENT_DAYS;
    
    // Function to calculate cost for N quests in a single day
    // Structure: 1st=0, 2-4=50, 5-7=200, 8+=1000
    // Note: This logic assumes a specific cost structure for the event
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
    if (basePerDay > 0 || remainder > 0) {
        if (remainder === 0) {
            details.push(`1日 ${basePerDay}個追加 × ${EVENT_DAYS}日間`);
        } else {
            details.push(`${remainder}日間は ${basePerDay + 1}個`);
            details.push(`${EVENT_DAYS - remainder}日間は ${basePerDay}個`);
        }
    }
    
    return { totalCost, details };
  };

  // --- SUGGESTION LOGIC ---
  const suggestion = useMemo(() => {
      // 1. If we couldn't hit current target, no suggestion to increase.
      if (simulation.totalQuests < targetQuests) return null;

      // 2. Logic: If current target is less than 51, suggest 51.
      // If current target is 51 or more, do not suggest higher (e.g. 69) as cost is too high.
      if (targetQuests >= 51) return null;

      const NEXT_TARGET = 51;
      const maxPlan = calculatePlan(NEXT_TARGET, inventory);
      
      // 3. Logic: If MaxPlan gets significantly more points than CurrentPlan
      // AND MaxPlan count is higher than CurrentPlan count
      // Suggest it.
      
      if (maxPlan.totalQuests > simulation.totalQuests) {
          const pointDiff = maxPlan.totalPoints - simulation.totalPoints;
          const countDiff = maxPlan.totalQuests - simulation.totalQuests;
          
          // Calculate Cost Difference
          const currentCost = calculateEventCost(targetQuests).totalCost;
          const nextCost = calculateEventCost(NEXT_TARGET).totalCost;
          const additionalCost = nextCost - currentCost;
          
          if (pointDiff > 500) { // Arbitrary threshold: significant gain
              return {
                  newTarget: NEXT_TARGET,
                  pointGain: pointDiff,
                  countGain: countDiff,
                  additionalCost: additionalCost
              };
          }
      }
      return null;
  }, [simulation, targetQuests, inventory]);


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
      return calculateEventCost(targetQuests);
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

      {/* Inventory Inputs */}
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
                label="ダイヤ"
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
                    <label className={`
                        flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold cursor-pointer transition-all
                        ${isAnalyzing 
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                        : 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30'
                        }
                    `}>
                        <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleSpeedupImageAnalysis}
                        disabled={isAnalyzing}
                        />
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                解析中
                            </>
                        ) : (
                            <>
                                <Camera className="w-3 h-3" />
                                画像から自動入力
                            </>
                        )}
                    </label>
                 </div>

                 {/* Check Speedup Time Instruction */}
                 <div className="mb-2">
                    <button 
                        onClick={() => setIsSpeedupInstructionOpen(!isSpeedupInstructionOpen)}
                        className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-slate-300 transition-colors w-full"
                    >
                        <Info className="w-3 h-3" />
                        <span>総時間の確認方法</span>
                        {isSpeedupInstructionOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    
                    {isSpeedupInstructionOpen && (
                        <div className="mt-2 bg-slate-900/50 rounded-lg p-3 border border-white/5 animate-in slide-in-from-top-2">
                            <div className="flex flex-wrap items-center gap-1 text-[10px] font-medium text-slate-400">
                               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">バッグ</span>
                               <ArrowRight className="w-3 h-3 text-slate-600" />
                               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">加速</span>
                               <ArrowRight className="w-3 h-3 text-slate-600" />
                               <span className="bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">右上のグラフ</span>
                               <ArrowRight className="w-3 h-3 text-slate-600" />
                               <span className="text-amber-400">分にチェック</span>
                            </div>
                            <p className="text-[9px] text-slate-500 mt-1.5 leading-relaxed">
                               ※スクショの場合は「日時分」表示のままでも自動計算されます
                            </p>
                        </div>
                    )}
                </div>
                 
                 <TimeInput label="一般加速" colorClass="text-purple-300" 
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

      {/* Course Guide Section (New) */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-xl mb-6">
        <button 
            onClick={() => setIsGuideOpen(!isGuideOpen)}
            className="w-full p-4 flex items-center justify-between bg-indigo-900/20 hover:bg-indigo-900/30 transition-colors text-left group"
        >
            <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-base font-bold text-white">コースの選び方ガイド（初回必見）</span>
            </div>
            {isGuideOpen ? <ChevronUp className="text-indigo-400 w-4 h-4" /> : <ChevronDown className="text-indigo-400 w-4 h-4" />}
        </button>
        
        {isGuideOpen && (
            <div className="p-5 border-t border-white/5 grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                {/* Left Panel: Cost Differences */}
                <div className="space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-indigo-300 font-bold text-sm">
                            <Lightbulb className="w-4 h-4" />
                            コストの違い（ダイヤ消費）
                        </div>
                        <h4 className="text-xs font-bold text-slate-400 mb-2 ml-6">クエスト追加コストの仕組み</h4>
                        <ul className="space-y-2 ml-6 text-xs text-slate-300">
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span>1個目 : <span className="text-emerald-400 font-bold">無料</span></span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span>2〜4個目 : 各<span className="text-amber-400 font-bold">50</span>ダイヤ</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span>5〜7個目 : 各<span className="text-amber-400 font-bold">200</span>ダイヤ</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-slate-500"></span>
                                <span className="flex items-center gap-2">
                                    8個目〜 : 各<span className="text-rose-400 font-bold">1000</span>ダイヤ
                                    <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-bold">非推奨</span>
                                </span>
                            </li>
                        </ul>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                            <div className="text-emerald-400 font-bold mb-1 text-xs">33回 (節約)</div>
                            <div className="text-[10px] text-slate-400 mb-1">初期9 + 毎日4個×6日</div>
                            <div className="text-[10px] text-slate-300 font-bold">コスト: 50×3×6 = <span className="text-white">900ダイヤ</span></div>
                        </div>
                        <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700">
                            <div className="text-blue-400 font-bold mb-1 text-xs">51回 (完走)</div>
                            <div className="text-[10px] text-slate-400 mb-1">初期9 + 毎日7個×6日</div>
                            <div className="text-[10px] text-slate-300 font-bold">コスト: 750×6 = <span className="text-white">4,500ダイヤ</span></div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Logic & CP */}
                <div className="space-y-5">
                    <div>
                        <div className="flex items-center gap-2 mb-2 text-amber-400 font-bold text-sm">
                            <TrendingUp className="w-4 h-4" />
                            自動計算のロジック & コスパ
                        </div>
                        <h4 className="text-xs font-bold text-slate-400 mb-2 ml-6 flex items-center gap-1">
                            <HelpCircle className="w-3 h-3" /> なぜ「青ランク」がお得なのか？
                        </h4>
                        <p className="text-[11px] text-slate-400 ml-6 leading-relaxed mb-4">
                            黄ランクは1回で大量のポイントを稼げますが、消費アイテム量が莫大です。<br/>
                            青ランクはポイントは控えめですが、消費アイテムが非常に少なく済みます。
                        </p>
                    </div>

                    <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
                        <div className="grid grid-cols-2 divide-x divide-slate-800">
                            <div className="p-3 text-center">
                                <div className="text-yellow-500 font-bold text-xs mb-1">黄 : 一般加速</div>
                                <div className="text-[10px] text-slate-400 mb-2">7200分で450pt</div>
                                <div className="text-[10px] text-slate-500 pt-2 border-t border-slate-800/50">1ptあたり16分消費</div>
                            </div>
                            <div className="p-3 text-center bg-blue-900/10">
                                <div className="text-blue-400 font-bold text-xs mb-1">青 : 一般加速</div>
                                <div className="text-[10px] text-slate-300 mb-2">900分で160pt</div>
                                <div className="text-[10px] text-white font-bold pt-2 border-t border-slate-800/50">1ptあたり5.6分消費</div>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-2 text-center text-[10px] font-bold text-emerald-400 border-t border-slate-800">
                            青ランクの方が圧倒的に低コストでポイントを稼げます！
                        </div>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-3">
                        <div className="text-indigo-300 font-bold text-xs mb-2 flex items-center gap-2">
                            <Calculator className="w-3 h-3" />
                            このツールの計算手順 (最適ミックス)
                        </div>
                        <ul className="space-y-3">
                            <li className="flex gap-3">
                                <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0 border border-blue-500/30">1</div>
                                <div>
                                    <div className="text-xs font-bold text-slate-300">まずは「青ランク」で回数を確保</div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        最もコスパが良い青クエストを優先的に採用し、少ない予算で目標回数に到達させます。
                                    </p>
                                </div>
                            </li>
                            <li className="flex gap-3">
                                <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold shrink-0 border border-amber-500/30">2</div>
                                <div>
                                    <div className="text-xs font-bold text-slate-300">余った予算で「黄・紫」へアップグレード</div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        予算に余裕がある分だけ、自動的に高ポイントのクエストに入れ替えてスコアを最大化します。
                                    </p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        )}
      </div>
      
      {/* Target Selector */}
      <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-xl space-y-6">
        
        <div>
           <div className="flex items-center gap-2 mb-4">
             <Target className="w-5 h-5 text-indigo-400" />
             <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">目標クエスト回数の設定 (最大69回)</h3>
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
                      max="69"
                      value={targetQuests}
                      onChange={(e) => {
                          let val = parseInt(e.target.value) || 0;
                          val = Math.max(9, Math.min(69, val));
                          setTargetQuests(val);
                      }}
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white font-mono font-bold text-center outline-none focus:border-indigo-500"
                    />
                    <span className="text-xs text-slate-400 shrink-0">回</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="bg-slate-900/50 rounded-xl p-4 border border-white/5 relative overflow-hidden">
           <div className="relative z-10 flex flex-col md:flex-row gap-4 md:items-center">
              <div className="flex-1">
                 <h4 className="text-white font-bold flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                    目標: {targetQuests}回 ／ Max 69回
                 </h4>
                 <p className="text-xs text-slate-400">
                    現在の予算内で{targetQuests}回を達成できるように、<strong className="text-indigo-300">「青・紫・黄」を自動でミックス</strong>して最大得点を狙います。
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
      
      {/* Suggestion Banner (If resource abundant) */}
      {suggestion && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 p-1">
              <div className="bg-slate-900/40 backdrop-blur-sm rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                      <div className="p-3 bg-emerald-500/20 rounded-full shrink-0 animate-pulse">
                          <ArrowUpCircle className="w-6 h-6 text-emerald-400" />
                      </div>
                      <div>
                          <h4 className="text-lg font-bold text-emerald-200">目標回数の引き上げ推奨！</h4>
                          <p className="text-sm text-slate-300 mt-1 leading-snug">
                             現在の予算なら、<span className="text-white font-bold">{suggestion.newTarget}回</span> まで増やしても達成可能です。<br/>
                             これにより、さらに <span className="text-amber-400 font-bold">+{suggestion.pointGain.toLocaleString()}pt</span> 獲得できます。<br/>
                             (追加コスト: <span className="font-bold text-white">{suggestion.additionalCost.toLocaleString()} ダイヤ</span>)
                          </p>
                      </div>
                  </div>
                  <button 
                    onClick={() => setTargetQuests(suggestion.newTarget)}
                    className="whitespace-nowrap px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
                  >
                     目標を{suggestion.newTarget}回に変更
                  </button>
              </div>
          </div>
      )}

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
                      <h3 className="text-white font-bold text-lg sm:text-xl whitespace-nowrap">最適ミックス推奨プラン</h3>
                      <p className="text-indigo-200 text-xs sm:text-sm mt-0.5">
                        {simulation.totalQuests >= targetQuests 
                           ? '目標達成！ポイント最大化のためにランクを調整済' 
                           : '予算不足により目標未達。不足分をご確認ください'}
                      </p>
                   </div>
                </div>
                {isSimulationOpen ? <ChevronUp className="text-indigo-300" /> : <ChevronDown className="text-indigo-300" />}
             </div>

             {isSimulationOpen && (
               <div className="bg-[#0B1120]/30 border-t border-indigo-500/20 p-6 animate-in slide-in-from-top-2 duration-300">
                  
                    <div className="space-y-6">

                      {/* Top Summary Stats */}
                      <div className="grid grid-cols-2 gap-4">
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full relative overflow-hidden group">
                            <div className="text-xs text-slate-400 mb-1 z-10 relative">予算で可能な回数</div>
                            <div className="text-3xl font-black text-white flex items-baseline gap-1 z-10 relative">
                               {simulation.totalQuests} 
                               <span className="text-sm font-normal text-slate-500">/ {targetQuests}回</span>
                            </div>
                            <div className="absolute bottom-0 left-0 h-1 bg-slate-700 w-full">
                                <div className={`h-full transition-all duration-1000 ${simulation.totalQuests >= targetQuests ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{width: `${Math.min((simulation.totalQuests/targetQuests)*100, 100)}%`}}></div>
                            </div>
                         </div>
                         <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 flex flex-col justify-between h-full">
                            <div className="text-xs text-slate-400 mb-1">獲得予定ポイント</div>
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
                                  以下のいずれかの方法で不足分の回数を埋めると、{targetQuests}回を達成できます。
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
                                  <p className="text-emerald-200/70 text-sm">「青」で回数を確保し、余剰分で「黄・紫」へ自動アップグレードしました。</p>
                              </div>
                          </div>
                      )}

                      {/* Breakdown List */}
                      {simulation.breakdown.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">推奨クエスト内訳</div>
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
                                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                                       残: {simulation.remaining[item.id as keyof Inventory]?.toLocaleString() ?? 0}{item.unit}
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

export default MobilizationGuide;