import React from 'react';
import Calculator from './components/Calculator';
import { Crown } from 'lucide-react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 relative overflow-hidden selection:bg-amber-500/30">
      
      {/* Background Decorations */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '7s' }}></div>
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-600/10 rounded-full blur-[100px] mix-blend-screen"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0B1120]/70 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 group-hover:rotate-3">
              <Crown className="text-white w-6 h-6" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-100 tracking-tight leading-none group-hover:text-white transition-colors">Kingshot <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Optimizer</span></h1>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mt-1">Unofficial Strategy Tool</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto py-12 px-4 md:px-6">
        <div className="text-center mb-12 max-w-3xl mx-auto relative">
          <div className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-amber-300 text-xs font-medium mb-6 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-2 animate-pulse"></span>
            最強領主イベント攻略
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-2xl">
            加速アイテム
          </h2>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto">
            「総力上昇イベント」の日と「加速消費」の日。<br className="hidden md:block"/>
            建造・研究・訓練、それぞれの効率を瞬時に計算します。
          </p>
        </div>

        <Calculator />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0B1120]/50 backdrop-blur-sm py-8 mt-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-600 text-sm">© 2026 Kingshot Optimizer. Unofficial Tool. v0.12</p>
        </div>
      </footer>
    </div>
  );
};

export default App;