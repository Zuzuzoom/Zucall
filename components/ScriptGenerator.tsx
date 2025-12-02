import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FileText, Wand2, Copy, Check } from 'lucide-react';

export const ScriptGenerator: React.FC = () => {
  const [product, setProduct] = useState('');
  const [target, setTarget] = useState('');
  const [goal, setGoal] = useState('');
  const [generatedScript, setGeneratedScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateScript = async () => {
    if (!product || !target) return;
    
    setIsLoading(true);
    setGeneratedScript('');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Write a professional, effective cold call script.
      Product/Service: ${product}
      Target Audience: ${target}
      Call Goal: ${goal || 'Book a meeting'}
      
      Structure:
      1. Opener (Pattern interrupt)
      2. Value Proposition (Problem-centric)
      3. Qualification
      4. Call to Action
      
      Keep it conversational and concise. Do not use Markdown formatting, just plain text with clear section headers.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      setGeneratedScript(response.text || 'No script generated.');
    } catch (error) {
      console.error(error);
      setGeneratedScript('Error generating script. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col md:flex-row gap-6">
      {/* Input Section */}
      <div className="w-full md:w-1/3 bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-indigo-600" />
          Script Parameters
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Product/Service</label>
          <input 
            type="text" 
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="e.g. AI HR Software"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Target Audience</label>
          <input 
            type="text" 
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="e.g. VP of HR at Mid-sized Tech"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">Goal (Optional)</label>
          <input 
            type="text" 
            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="e.g. 15 min Demo"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />
        </div>

        <button 
          onClick={generateScript}
          disabled={isLoading || !product || !target}
          className="mt-auto w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>Generate Script <Wand2 className="w-4 h-4" /></>
          )}
        </button>
      </div>

      {/* Output Section */}
      <div className="w-full md:w-2/3 bg-slate-50 border border-slate-200 rounded-xl p-6 relative flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            Generated Script
          </h3>
          {generatedScript && (
            <button 
              onClick={copyToClipboard}
              className="text-sm flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {generatedScript ? (
            <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-mono text-sm">
              {generatedScript}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <FileText className="w-12 h-12 mb-2 opacity-20" />
              <p>Enter details and click generate to create a script.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};