import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, Phone, PhoneOff, BarChart2, Volume2, User, Bot } from 'lucide-react';
import { createBlob, decode, decodeAudioData } from '../utils/audioUtils';
import { AudioVisualizer } from './AudioVisualizer';
import { Scenario } from '../types';

interface LiveSessionProps {
  scenario: Scenario;
  onEndSession: () => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ scenario, onEndSession }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [status, setStatus] = useState<string>('Initializing...');
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const inputNodeRef = useRef<GainNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  // Analysers for Visualizers
  const inputAnalyserRef = useRef<AnalyserNode | null>(null);
  const outputAnalyserRef = useRef<AnalyserNode | null>(null);
  const [inputAnalyser, setInputAnalyser] = useState<AnalyserNode | null>(null);
  const [outputAnalyser, setOutputAnalyser] = useState<AnalyserNode | null>(null);

  // API & State Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Close session logic would go here if we had the session object, 
    // but the API doesn't expose a clean 'close' on the promise easily without storing the session.
    // We will handle disconnection via context closing.

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
    }
    if (inputAudioContextRef.current) {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
    }
    
    // Stop all playing sources
    sourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourcesRef.current.clear();
    
    setIsConnected(false);
  }, []);

  const connectToLiveAPI = async () => {
    try {
      setStatus("Connecting to Audio...");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;

      // Input Context (16kHz required for Gemini)
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;
      const inputAnalyserNode = inputCtx.createAnalyser();
      inputAnalyserRef.current = inputAnalyserNode;
      setInputAnalyser(inputAnalyserNode);

      const source = inputCtx.createMediaStreamSource(stream);
      const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = scriptProcessor;

      // Output Context (24kHz typically)
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      outputAudioContextRef.current = outputCtx;
      const outputNode = outputCtx.createGain();
      outputNodeRef.current = outputNode;
      outputNode.connect(outputCtx.destination);
      
      const outputAnalyserNode = outputCtx.createAnalyser();
      outputAnalyserRef.current = outputAnalyserNode;
      outputNode.connect(outputAnalyserNode);
      setOutputAnalyser(outputAnalyserNode);

      // Initialize Gemini
      setStatus("Connecting to Gemini...");
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            if (!mountedRef.current) return;
            console.log('Session opened');
            setStatus("Connected. Start speaking.");
            setIsConnected(true);

            // Connect Audio Pipeline
            source.connect(inputAnalyserNode); // Visualizer
            inputAnalyserNode.connect(scriptProcessor); // To Processor
            scriptProcessor.connect(inputCtx.destination); // Required for script processor to run

            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return; 
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
             if (!mountedRef.current) return;

             // Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
             if (base64Audio && outputAudioContextRef.current && outputNodeRef.current) {
               const ctx = outputAudioContextRef.current;
               nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
               
               const audioBuffer = await decodeAudioData(
                 decode(base64Audio),
                 ctx,
                 24000,
                 1
               );

               const source = ctx.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNodeRef.current);
               
               source.addEventListener('ended', () => {
                 sourcesRef.current.delete(source);
               });

               source.start(nextStartTimeRef.current);
               nextStartTimeRef.current += audioBuffer.duration;
               sourcesRef.current.add(source);
             }

             // Handle Interruptions
             if (message.serverContent?.interrupted) {
                console.log('Interrupted');
                sourcesRef.current.forEach(src => {
                  try { src.stop(); } catch (e) {}
                });
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
             }

             // Handle Transcripts (Optional visual feedback)
             // Note: Live API transcriptions might come in specific parts, simplified here for demo
             if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
                setTranscript(prev => [...prev, { role: 'ai', text: message.serverContent?.modelTurn?.parts?.[0]?.text || '' }]);
             }
          },
          onclose: () => {
            console.log("Session closed");
            if(mountedRef.current) setStatus("Disconnected");
          },
          onerror: (err) => {
            console.error("Session error", err);
            if(mountedRef.current) setStatus("Error occurred");
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: scenario.voiceName || 'Kore' } }
          },
          systemInstruction: `You are acting as a roleplay partner for a sales call. 
          Your persona is: ${scenario.description}. 
          Difficulty level: ${scenario.difficulty}. 
          Keep responses concise and natural for a phone conversation.
          ${scenario.systemInstruction}`,
        }
      });

      sessionPromiseRef.current = sessionPromise;

    } catch (error) {
      console.error("Failed to initialize session", error);
      setStatus("Failed to connect. Check permissions.");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    connectToLiveAPI();

    return () => {
      mountedRef.current = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scenario]); 

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 z-10">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Phone className="w-6 h-6 text-green-400" />
            Live Roleplay
          </h2>
          <p className="text-slate-400 text-sm mt-1">Scenario: <span className="text-white font-medium">{scenario.name}</span></p>
        </div>
        <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono">
           {status}
        </div>
      </div>

      {/* Visualizers */}
      <div className="flex-1 flex flex-col justify-center items-center gap-12 z-10 relative">
        
        {/* AI Visualizer */}
        <div className="w-full max-w-lg space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-sm font-semibold uppercase tracking-wider">
            <Bot className="w-4 h-4" />
            Prospect (AI)
          </div>
          <div className="h-32 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 shadow-inner backdrop-blur-sm">
             <AudioVisualizer analyser={outputAnalyser} isActive={true} color="#60a5fa" />
          </div>
        </div>

        {/* User Visualizer */}
        <div className="w-full max-w-lg space-y-2">
          <div className="flex items-center gap-2 text-green-400 text-sm font-semibold uppercase tracking-wider">
            <User className="w-4 h-4" />
            You
          </div>
          <div className="h-32 bg-slate-800/50 rounded-xl border border-slate-700/50 p-4 shadow-inner backdrop-blur-sm">
             <AudioVisualizer analyser={inputAnalyser} isActive={!isMuted} color="#4ade80" />
          </div>
        </div>

      </div>

      {/* Controls */}
      <div className="mt-8 flex justify-center gap-6 z-10">
        <button 
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all duration-200 ${isMuted ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-slate-700 hover:bg-slate-600 text-white'}`}
        >
          {isMuted ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
        
        <button 
          onClick={onEndSession}
          className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-900/50 transition-all duration-200 transform hover:scale-105"
        >
          <PhoneOff className="w-8 h-8" />
        </button>
      </div>

      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600 rounded-full blur-[128px]"></div>
      </div>
    </div>
  );
};