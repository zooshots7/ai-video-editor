export interface CaptionPreset {
  id: string;
  name: string;
  description: string;
  // Caption style properties
  appearedColor: string;
  activeColor: string;
  activeFillColor: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  boxShadow?: { color: string; x: number; y: number; blur: number };
  fontFamily?: string;
  fontUrl?: string;
  textTransform?: string;
  fontSize?: number;
  // For previewing in the UI
  preview: {
    bgColor: string;
    sampleText: string;
  };
}

export const INSTAGRAM_CAPTION_PRESETS: CaptionPreset[] = [
  {
    id: "bold-highlight",
    name: "Bold Highlight",
    description: "White text with yellow active word — classic Instagram Reels style",
    appearedColor: "#FFFFFF",
    activeColor: "#FFD700",
    activeFillColor: "transparent",
    color: "#FFFFFF",
    backgroundColor: "transparent",
    borderColor: "#000000",
    borderWidth: 0,
    boxShadow: { color: "#000000", x: 2, y: 2, blur: 8 },
    fontFamily: "Inter",
    fontUrl: "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2",
    textTransform: "uppercase",
    fontSize: 58,
    preview: {
      bgColor: "#1a1a2e",
      sampleText: "THIS IS **BOLD**",
    },
  },
  {
    id: "neon-pop",
    name: "Neon Pop",
    description: "Green neon active word with purple fill — viral TikTok/Reels look",
    appearedColor: "#FFFFFF",
    activeColor: "#50FF12",
    activeFillColor: "#7E12FF",
    color: "#DADADA",
    backgroundColor: "transparent",
    borderColor: "#000000",
    borderWidth: 5,
    fontFamily: "Bangers-Regular",
    fontUrl: "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf",
    textTransform: "uppercase",
    fontSize: 64,
    preview: {
      bgColor: "#0a0a23",
      sampleText: "NEON **POP** STYLE",
    },
  },
  {
    id: "clean-minimal",
    name: "Clean Minimal",
    description: "Dark text on light background pill — professional and clean",
    appearedColor: "#000000",
    activeColor: "#000000",
    activeFillColor: "transparent",
    color: "#666666",
    backgroundColor: "#F0F0F0",
    borderColor: "transparent",
    borderWidth: 0,
    fontFamily: "Inter",
    fontUrl: "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2",
    textTransform: "none",
    fontSize: 52,
    preview: {
      bgColor: "#ffffff",
      sampleText: "clean **minimal** look",
    },
  },
  {
    id: "fire-orange",
    name: "Fire Orange",
    description: "White text with orange highlight box — high energy Reels",
    appearedColor: "#FFFFFF",
    activeColor: "#FFFFFF",
    activeFillColor: "#FF6B00",
    color: "#FFFFFF",
    backgroundColor: "transparent",
    borderColor: "#000000",
    borderWidth: 5,
    fontFamily: "Bangers-Regular",
    fontUrl: "https://fonts.gstatic.com/s/bangers/v13/FeVQS0BTqb0h60ACL5la2bxii28.ttf",
    textTransform: "uppercase",
    fontSize: 62,
    preview: {
      bgColor: "#1a0a00",
      sampleText: "FIRE **ORANGE** ENERGY",
    },
  },
  {
    id: "shadow-glow",
    name: "Shadow Glow",
    description: "White text with glow shadow — cinematic storytelling feel",
    appearedColor: "#FFFFFF",
    activeColor: "#FFFFFF",
    activeFillColor: "transparent",
    color: "#FFFFFF",
    backgroundColor: "transparent",
    borderColor: "#000000",
    borderWidth: 8,
    boxShadow: { color: "#FFFFFF", x: 0, y: 0, blur: 40 },
    fontFamily: "Inter",
    fontUrl: "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2",
    textTransform: "none",
    fontSize: 56,
    preview: {
      bgColor: "#0d0d0d",
      sampleText: "shadow **glow** effect",
    },
  },
  {
    id: "red-bold",
    name: "Red Bold",
    description: "Red active word on white — attention-grabbing for hooks",
    appearedColor: "#FFFFFF",
    activeColor: "#FF0000",
    activeFillColor: "transparent",
    color: "#FFFFFF",
    backgroundColor: "transparent",
    borderColor: "#000000",
    borderWidth: 3,
    boxShadow: { color: "#000000", x: 2, y: 2, blur: 6 },
    fontFamily: "Inter",
    fontUrl: "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2",
    textTransform: "uppercase",
    fontSize: 60,
    preview: {
      bgColor: "#1a1a1a",
      sampleText: "RED **BOLD** HOOK",
    },
  },
];

export const CAPTION_PRESETS_BY_ID: Record<string, CaptionPreset> = Object.fromEntries(
  INSTAGRAM_CAPTION_PRESETS.map((p) => [p.id, p])
);

export const DEFAULT_CAPTION_PRESET = INSTAGRAM_CAPTION_PRESETS[0]; // bold-highlight
