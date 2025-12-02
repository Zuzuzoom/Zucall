import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ShieldAlert, Send } from 'lucide-react';

export const ObjectionHandler: React.FC = () => {
  const [objection, setObjection] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleObjection = async () => {
    if (!objection) return;
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `I am on a cold call. The prospect just said: "${objection}". 
        Give me 3 short, punchy, and effective responses to handle this objection and pivot back to the goal.
        Format as a numbered list.`
      });
      setResponse(result.text || 'No response generated.');
    } catch (error) {
       setResponse("Error generating rebuttal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-slate-900">Objection Crusher</h2>
        <p className="text-slate-500">Stuck? Type what they said and get instant rebuttals.</p>
      </div>

      <div className="bg-white p-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-2">
        <input 
          type="text" 
          value={objection}
          onChange={(e) => setObjection(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleObjection()}
          placeholder="e.g. 'Just send me an email'"
          className="flex-1 p-3 outline-none text-slate-700 placeholder:text-slate-400"
        />
        <button 
          onClick={handleObjection}
          disabled={isLoading || !objection}
          className="bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-lg transition disabled:opacity-50"
        >
          {isLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Send className="w-5 h-5" />}
        </button>
      </div>

      {response && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
           <div className="flex items-center gap-2 mb-4 text-indigo-600 font-semibold">
              <ShieldAlert className="w-5 h-5" />
              <span>Try saying this:</span>
           </div>
           <div className="prose prose-slate text-slate-700">
             <div className="whitespace-pre-wrap">{response}</div>
           </div>
        </div>
      )}
    </div>
  );
};