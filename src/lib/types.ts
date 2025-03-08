export type Category = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  order: number;
  content: string;
};

export type SDModel = 'SD 1.5' | 'SDXL' | 'SD 3.5' | 'Flux';

export type SavedPrompt = {
  id: string;
  title: string;
  prompt: string;
  negativePrompt: string;
  model: SDModel;
  categories: Record<string, string>;
  createdAt: string;
  updatedAt: string;
};

export type TokenCount = {
  total: number;
  limit: number;
  isOverLimit: boolean;
};

export type ArtStyle = {
  id: string;
  name: string;
  description: string;
  prompt: string;
  category: string;
};

export type StyleCategory = {
  id: string;
  name: string;
};

export type Styles = {
  styles: ArtStyle[];
  categories: StyleCategory[];
};

export type AnalysisResult = {
  composition: string;
  lighting: string;
  colors: string;
  style: string;
  suggestedPrompt: string;
};

export type ImageWithAnalysis = {
  id: string;
  imageData: string;
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  error?: string;
};

export type Theme = {
  name: string;
  bgColor: string;
  cardBgColor: string;
  textColor: string;
  borderColor: string;
};