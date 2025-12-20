import React, { useState, useMemo } from 'react';
import { BuildingDefinition, CalculationResult } from '../types';
import { BUILDINGS } from '../constants';
import { Clock, Zap, Calculator as CalcIcon, AlertCircle, ArrowRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

const Calculator: React.FC = () => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(BUILDINGS[0].id);
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [days, setDays] = useState<string>('0');
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('0');

  const selectedBuilding = useMemo(() => 
    BUILDINGS.find(b => b.id === selectedBuildingId) || BUILDINGS[0], 
  [selectedBuildingId]);

  const levelData = useMemo(() => 
    selectedBuilding.levels.find(l => l.level === selectedLevel),
  [selectedBuilding, selectedLevel]);

  const powerIncrease = levelData ? levelData.powerIncrease : 0;
  
  // Logic from user: Threshold (min) = Increase / 10
  const thresholdMinutes = powerIncrease / 10;
  
  const currentTotalMinutes = useMemo(() => {
    const d = parseInt(days) || 0;
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    return (d * 1440) + (h * 60) + m;
  }, [days, hours, minutes]);

  // Points calculation
  const pointsEvent1 = powerIncrease * 30;
  const pointsEvent2 = currentTotalMinutes * 300;

  let result: CalculationResult = CalculationResult.EQUAL;
  if (currentTotalMinutes === 0) {
    // No input
  } else if (currentTotalMinutes < thresholdMinutes) {
    result = CalculationResult.ACCELERATE_NOW;
  } else if (currentTotalMinutes > thresholdMinutes) {
    result = CalculationResult.WAIT_FOR_SPEEDUP;
  }

  const chartData = [
    {
      name: '今加速 (建造P)',
      points: pointsEvent1,
      fill: '#fbbf24', // amber-400
      stroke: '#f59e0b',
    },
    {
      name: '後で加速 (加速P)',
      points: pointsEvent2,
      fill: '#60a5fa', // blue-400
      stroke: '#3b82f6',
    },
  ];

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => e.target.select();

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      
      {/* Input Section */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-blue-600 rounded-3xl opacity-30 group-hover:opacity-50 blur transition duration-500"></div>
        <div className="relative bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-10 shadow-2xl">
          <h2 className="text-2xl font-bold text-white flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
              <CalcIcon className="w-6 h-6" />
            </div>
            建造データの入力
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Building Select */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">施設の種類</label>
              <div className="relative">
                <select
                  value={selectedBuildingId}
                  onChange={(e) => {
                    setSelectedBuildingId(e.target.value);
                    setSelectedLevel(1); 
                  }}
                  className="w-full appearance-none bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-4 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none shadow-inner text-base"
                >
                  {BUILDINGS.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>

            {/* Level Select */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider">強化後のレベル (目標)</label>
              <div className="relative">
                <select
                  value={selectedLevel}
                  onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
                  className="w-full appearance-none bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl px-4 py-4 text-slate-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none shadow-inner text-base"
                >
                  {selectedBuilding.levels.map((l) => (
                    <option key={l.level} value={l.level}>
                      Lv. {l.level} (上昇値: {l.powerIncrease.toLocaleString()})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <ArrowRight className="w-4 h-4 rotate-90" />
                </div>
              </div>
            </div>
          </div>

          {/* Time Input */}
          <div className="mt-8 pt-8 border-t border-white/5">
            <label className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4 block">残り時間 (加速する時間)</label>
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              {[
                { label: '日', value: days, setter: setDays },
                { label: '時間', value: hours, setter: setHours },
                { label: '分', value: minutes, setter: setMinutes }
              ].map((field, idx) => (
                <div key={idx} className="relative">
                  <input
                    type="number"
                    min="0"
                    value={field.value}
                    onFocus={handleFocus}
                    onChange={(e) => field.setter(e.target.value)}
                    className="w-full bg-[#1E293B] border border-slate-700 hover:border-slate-500 rounded-xl pl-4 pr-12 py-4 text-xl font-mono text-white focus:ring-2 focus:ring-amber-500 outline-none shadow-inner transition-colors"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium text-sm">{field.label}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-4 items-baseline gap-2">
              <span className="text-slate-400 text-sm">合計時間:</span>
              <span className="text-2xl font-bold text-white tabular-nums tracking-tight">
                {currentTotalMinutes.toLocaleString()} 
                <span className="text-base font-normal text-slate-500 ml-1">分</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Result Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
        
        {/* Verdict Card */}
        <div className={`relative overflow-hidden rounded-2xl p-1 transition-all duration-500 shadow-2xl group ${
            result === CalculationResult.ACCELERATE_NOW ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
            result === CalculationResult.WAIT_FOR_SPEEDUP ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
            'bg-slate-800'
          }`}>
          <div className="h-full bg-[#0F172A] rounded-xl p-8 flex flex-col justify-center items-center text-center relative overflow-hidden">
            
            {/* Background Glow */}
            <div className={`absolute top-0 left-0 w-full h-full opacity-20 blur-3xl transition-colors duration-500 ${
              result === CalculationResult.ACCELERATE_NOW ? 'bg-amber-500' :
              result === CalculationResult.WAIT_FOR_SPEEDUP ? 'bg-blue-500' :
              'bg-transparent'
            }`}></div>

            {currentTotalMinutes > 0 ? (
              <div className="relative z-10 space-y-6">
                <div className="inline-block">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-6 bg-slate-800/50 px-4 py-1.5 rounded-full backdrop-blur">
                    Analysis Result
                  </h3>
                </div>
                
                {result === CalculationResult.ACCELERATE_NOW && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20 ring-1 ring-amber-500/50">
                      <Zap className="w-12 h-12 text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                    </div>
                    <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-500">今すぐ</span>加速
                    </div>
                    <p className="text-amber-200/80 font-medium text-lg">建造ポイントデーの方が効率的です</p>
                  </div>
                )}
                
                {result === CalculationResult.WAIT_FOR_SPEEDUP && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20 ring-1 ring-blue-500/50">
                      <Clock className="w-12 h-12 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    </div>
                    <div className="text-5xl md:text-6xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
                      <span className="text-transparent bg-clip-text bg-gradient-to-b from-blue-300 to-blue-500">待機</span>推奨
                    </div>
                    <p className="text-blue-200/80 font-medium text-lg">加速消費デーまで温存しましょう</p>
                  </div>
                )}
                
                {result === CalculationResult.EQUAL && (
                  <div className="animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 mx-auto bg-slate-700/30 rounded-full flex items-center justify-center mb-6">
                      <AlertCircle className="w-12 h-12 text-slate-400" />
                    </div>
                    <div className="text-4xl font-bold text-slate-200 mb-3">どちらでも同じ</div>
                    <p className="text-slate-400">獲得ポイントは同等です</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-slate-600 flex flex-col items-center py-10">
                <CalcIcon className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-sm font-medium tracking-wide">データを入力して分析を開始</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-[#0F172A]/80 backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8 flex flex-col justify-between shadow-xl">
          <div>
            <h3 className="text-white font-bold mb-6 flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              詳細データ
            </h3>
            <div className="space-y-5">
              <div className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-sm">建造による上昇総力</span>
                  <span className="text-lg font-bold text-white font-mono">{powerIncrease.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-slate-600 h-full w-full opacity-50"></div>
                </div>
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400 text-sm">お得ライン (境目)</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {thresholdMinutes.toLocaleString()} <span className="text-xs text-amber-400/50">分</span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                   {/* Visual indicator of threshold relative to max typically needed, simplified here */}
                  <div className="bg-amber-500 h-full w-1/2 opacity-80"></div>
                </div>
              </div>

              <div className="group p-3 -mx-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 text-sm">入力された残り時間</span>
                  <span className={`text-xl font-bold font-mono ${
                    currentTotalMinutes > thresholdMinutes ? 'text-blue-400' : 'text-amber-400'
                  }`}>
                    {currentTotalMinutes.toLocaleString()} <span className="text-xs text-slate-500">分</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Comparison Chart */}
          <div className="mt-8 pt-6 border-t border-white/5">
             <div className="h-40 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart 
                    data={chartData} 
                    layout="vertical" 
                    margin={{ top: 0, right: 80, left: 0, bottom: 0 }} 
                    barSize={24}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={110} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 500}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f1f5f9', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                      formatter={(value: number) => [value.toLocaleString() + ' pts', '獲得ポイント']}
                      itemStyle={{ color: '#e2e8f0' }}
                    />
                    <Bar dataKey="points" radius={[0, 4, 4, 0]} animationDuration={1000}>
                      <LabelList 
                        dataKey="points" 
                        position="right" 
                        fill="#cbd5e1" 
                        fontSize={13} 
                        fontWeight="bold"
                        formatter={(value: number) => value.toLocaleString()} 
                      />
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.stroke} strokeWidth={1} fillOpacity={0.8} />
                      ))}
                    </Bar>
                 </BarChart>
               </ResponsiveContainer>
             </div>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-3 bg-blue-900/20 rounded-xl p-4 border border-blue-500/20 text-sm text-blue-200/80 backdrop-blur-sm">
        <div className="shrink-0 mt-0.5">
          <Info className="w-5 h-5 text-blue-400" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-blue-300">計算ロジックについて</h4>
          <p>
            境目となる時間（分） = 上昇する総力 ÷ 10 <br/>
            残り時間がこの境目より<strong>短い</strong>場合、建造ポイントデー（今）に加速するのがお得です。
            逆に長い場合は、加速消費デーに回したほうが獲得ポイントが多くなります。
          </p>
        </div>
      </div>
    </div>
  );
};

// Additional Icon for the info box
const Info = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

export default Calculator;