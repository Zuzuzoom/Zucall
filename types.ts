export enum AppMode {
  DASHBOARD = 'DASHBOARD',
  LIVE_ROLEPLAY = 'LIVE_ROLEPLAY',
  SCRIPT_GEN = 'SCRIPT_GEN',
  OBJECTION_HANDLER = 'OBJECTION_HANDLER'
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  systemInstruction: string;
  voiceName: string;
}

export interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

// Audio Types
export interface PCMChunk {
  data: string; // base64
  mimeType: string;
}
