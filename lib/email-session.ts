// Data model for email editing session

export interface BrandKit {
  colors: string[];
  tone: string; // e.g. "professional", "playful"
  logo?: string; // logo URL
  fonts?: string[];
}

export interface GenerationContext {
  originalPrompt: string; // e.g. "Promo email for winter sale"
  sourceUrls?: string[]; // URLs crawled during generation
  brandKit?: BrandKit;
  productData?: Record<string, unknown>;
  campaignRef?: string; // reference to past campaign used
  industry?: string; // e.g. "e-commerce", "SaaS"
}

export interface EditSnapshot {
  html: string;
  timestamp: number;
  description: string; // human-readable label for the edit
}

export interface EmailSession {
  html: string; // current email HTML
  generationContext?: GenerationContext;
  editHistory: EditSnapshot[]; // undo/redo stack
}
