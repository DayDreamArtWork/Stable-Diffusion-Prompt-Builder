import { Category } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'subject',
    name: 'Main Subject',
    description: 'Central element or theme of the image',
    active: true,
    order: 0,
    content: '',
  },
  {
    id: 'style',
    name: 'Style',
    description: 'Artistic style and genre',
    active: true,
    order: 1,
    content: '',
  },
  {
    id: 'quality',
    name: 'Quality Enhancers',
    description: 'Quality-improving adjectives',
    active: true,
    order: 2,
    content: '',
  },
  {
    id: 'composition',
    name: 'Composition',
    description: 'Arrangement, viewpoint, and framing',
    active: true,
    order: 3,
    content: '',
  },
  {
    id: 'lighting',
    name: 'Lighting',
    description: 'Light source and quality',
    active: true,
    order: 4,
    content: '',
  },
  {
    id: 'color',
    name: 'Color Palette',
    description: 'Dominant colors and mood',
    active: true,
    order: 5,
    content: '',
  },
  {
    id: 'background',
    name: 'Environment/Background',
    description: 'Description of the background or environment',
    active: true,
    order: 6,
    content: '',
  },
  {
    id: 'mood',
    name: 'Mood/Atmosphere',
    description: 'Emotional tone and atmosphere',
    active: true,
    order: 7,
    content: '',
  },
];

export const MODEL_TOKEN_LIMITS = {
  'SD 1.5': 77,
  'SDXL': 256,
  'SD 3.5': 256,
  'Flux': 512,
};

export const COMMON_NEGATIVE_PROMPTS = [
  'blurry, bad quality, low resolution',
  'deformed, distorted, disfigured',
  'watermark, text, signature',
  'oversaturated, overexposed',
  'cropped, frame, border',
];

export const DEFAULT_THEMES = {
  light: {
    name: "Light",
    bgColor: "bg-gray-50",
    cardBgColor: "bg-white",
    textColor: "text-gray-900",
    borderColor: "border-gray-200"
  },
  dark: {
    name: "Dark",
    bgColor: "bg-gray-900",
    cardBgColor: "bg-gray-800",
    textColor: "text-gray-100",
    borderColor: "border-gray-700"
  },
  cream: {
    name: "Cream",
    bgColor: "bg-amber-50",
    cardBgColor: "bg-white",
    textColor: "text-amber-900",
    borderColor: "border-amber-200"
  },
  blue: {
    name: "Blue",
    bgColor: "bg-blue-50",
    cardBgColor: "bg-white",
    textColor: "text-blue-900",
    borderColor: "border-blue-200"
  },
  forest: {
    name: "Forest",
    bgColor: "bg-green-900",
    cardBgColor: "bg-green-800",
    textColor: "text-green-100",
    borderColor: "border-green-700"
  }
};