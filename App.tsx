import React, { useState } from 'react';
import { Phone, FileText, Shield, LayoutGrid, Zap } from 'lucide-react';
import { AppMode, Scenario } from './types';
import { LiveSession } from './components/LiveSession';
import { ScriptGenerator } from './components/ScriptGenerator';
import { ObjectionHandler } from './components/ObjectionHandler';

// Pre-defined scenarios for roleplay
const SCENARIOS: Scenario[] = [
  {
    id: 'gatekeeper',
    name: 'The Stone-Cold Gatekeeper',
    description: 'An executive assistant who protects their boss aggressively.',
    difficulty: 'Hard',
    systemInstruction: "You are a strict executive assistant named Sarah. You screen all calls for Mr. Thompson. You are skeptical of salespeople. You ask 'Is he expecting your call?' and 'What is this regarding?' aggressively. Do not let them through easily.",
    voiceName: 'Kore'
  },
  {
    id: 'busy-prospect',
    name: 'The "Busy" Executive',
    description: 'A prospect who picks up but is in a rush.',
    difficulty: 'Medium',
    systemInstruction: "You are a busy VP of Marketing named David. You picked up the phone thinking it was a colleague. You are annoyed. You keep saying 'I have 2 minutes, make it quick' or 'Send me an email'.",
    voiceName: 'Fenrir'
  },
  {
    id: 'interested',
    name: 'Curious but Skeptical',
    description: 'Someone who has the problem but doubts the solution.',
    difficulty: 'Medium',
    systemInstruction: "You are a manager named Alex. You actually need the solution they are selling, but you've been burned by vendors before. Ask technical questions. Ask about pricing early.",
    voiceName: 'Puck'
  }
];

export default function App() {
  const [mode, setMode] = useState<AppMode>(AppMode.DASHBOARD);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);

  const startScenario = (scenario: Scenario) => {
    setSelectedScenario(scenario);
    setMode(AppMode.LIVE_ROLEPLAY);
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.LIVE_ROLEPLAY:
        return selectedScenario ? (
          <LiveSession 
            scenario={selectedScenario} 
            onEndSession={() => setMode(AppMode.DASHBOARD)} 
          />
        ) : null;
      
      case AppMode.SCRIPT_GEN:
        return <ScriptGenerator />;
      
      case AppMode.OBJECTION_HANDLER:
        return <ObjectionHandler />;

      case AppMode.DASHBOARD:
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Quick Stats / Welcome */}
            <div className="col-span-full bg-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                <h1 className="text-3xl font-bold mb-2">Ready to dial?</h1>
                <p className="text-indigo-100 max-w-xl">
                  Practice your pitch with AI that talks back, generate killer scripts, or get instant objection handlers.
                </p>
              </div>
              <Zap className="absolute right-0 bottom-0 w-64 h-64 text-indigo-500 opacity-20 -mr-10 -mb-10" />
            </div>

            {/* Scenario Cards */}
            <div className="col-span-full mt-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-600" />
                Start a Live Roleplay
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    onClick={() => startScenario(scenario)}
                    className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-lg transition-all text-left flex flex-col h-full"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className={`text-xs font-bold px-2 py-1 rounded-md ${
                        scenario.difficulty === 'Hard' ? 'bg-red-100 text-red-600' : 
                        scenario.difficulty === 'Medium' ? 'bg-orange-100 text-orange-600' : 
                        'bg-green-100 text-green-600'
                      }`}>
                        {scenario.difficulty}
                      </div>
                      <Phone className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                    <h3 className="font-bold text-slate-900 mb-1">{scenario.name}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2">{scenario.description}</p>
                    <div className="mt-auto pt-4 flex items-center text-indigo-600 font-medium text-sm">
                      Start Call <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            {/* Other Tools Links */}
            <div className="col-span-full mt-4">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Tools</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <button 
                  onClick={() => setMode(AppMode.SCRIPT_GEN)}
                  className="flex items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition"
                 >
                   <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                     <FileText className="w-6 h-6" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-bold text-slate-900">Script Generator</h3>
                     <p className="text-sm text-slate-500">Create tailored cold call scripts instantly.</p>
                   </div>
                 </button>

                 <button 
                  onClick={() => setMode(AppMode.OBJECTION_HANDLER)}
                  className="flex items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 hover:border-indigo-500 hover:shadow-md transition"
                 >
                   <div className="bg-amber-100 p-3 rounded-lg text-amber-600">
                     <Shield className="w-6 h-6" />
                   </div>
                   <div className="text-left">
                     <h3 className="font-bold text-slate-900">Objection Crusher</h3>
                     <p className="text-sm text-slate-500">Quick rebuttals for tough prospects.</p>
                   </div>
                 </button>
              </div>
            </div>

          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col items-center lg:items-stretch py-6 z-20">
        <div className="px-4 mb-10 flex items-center justify-center lg:justify-start gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
             <Phone className="w-6 h-6 text-white" />
          </div>
          <span className="hidden lg:block font-bold text-xl text-slate-900">Backup</span>
        </div>

        <nav className="flex-1 space-y-2 px-2">
          <button 
            onClick={() => setMode(AppMode.DASHBOARD)}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${mode === AppMode.DASHBOARD ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="hidden lg:block">Dashboard</span>
          </button>
          
          <button 
             onClick={() => setMode(AppMode.SCRIPT_GEN)}
             className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${mode === AppMode.SCRIPT_GEN ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <FileText className="w-5 h-5" />
            <span className="hidden lg:block">Script Gen</span>
          </button>

          <button 
             onClick={() => setMode(AppMode.OBJECTION_HANDLER)}
             className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${mode === AppMode.OBJECTION_HANDLER ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            <Shield className="w-5 h-5" />
            <span className="hidden lg:block">Objection Helper</span>
          </button>
        </nav>

        <div className="px-6 text-xs text-slate-400 hidden lg:block">
          Powered by Gemini 2.5
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full overflow-y-auto p-4 lg:p-8">
           {renderContent()}
        </div>
      </main>
    </div>
  );
}