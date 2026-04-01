export interface SfxItem {
  id: string;
  name: string;
  src: string;
  category: "transition" | "emphasis" | "ui" | "mood";
  description: string;
  durationMs: number;
}

export const SFX_LIBRARY: SfxItem[] = [
  {
    id: "sfx-whoosh",
    name: "Whoosh",
    src: "/sfx/whoosh.mp3",
    category: "transition",
    description: "Quick swoosh for scene transitions",
    durationMs: 400,
  },
  {
    id: "sfx-transition",
    name: "Transition",
    src: "/sfx/transition.mp3",
    category: "transition",
    description: "Longer cinematic transition swoosh",
    durationMs: 700,
  },
  {
    id: "sfx-swoosh-reverse",
    name: "Swoosh Reverse",
    src: "/sfx/swoosh-reverse.mp3",
    category: "transition",
    description: "Reverse swoosh for transition out",
    durationMs: 400,
  },
  {
    id: "sfx-pop",
    name: "Pop",
    src: "/sfx/pop.mp3",
    category: "emphasis",
    description: "Short pop for text or element appear",
    durationMs: 80,
  },
  {
    id: "sfx-ding",
    name: "Ding",
    src: "/sfx/ding.mp3",
    category: "emphasis",
    description: "Bell ding for highlights or key points",
    durationMs: 300,
  },
  {
    id: "sfx-boom",
    name: "Boom",
    src: "/sfx/boom.mp3",
    category: "emphasis",
    description: "Low impact hit for dramatic emphasis",
    durationMs: 500,
  },
  {
    id: "sfx-rise",
    name: "Rise",
    src: "/sfx/rise.mp3",
    category: "mood",
    description: "Rising tone for build-up or suspense",
    durationMs: 600,
  },
  {
    id: "sfx-chime",
    name: "Chime",
    src: "/sfx/chime.mp3",
    category: "ui",
    description: "Two-tone chime for notifications",
    durationMs: 300,
  },
  {
    id: "sfx-click",
    name: "Click",
    src: "/sfx/click.mp3",
    category: "ui",
    description: "Subtle click for UI interactions",
    durationMs: 30,
  },
  {
    id: "sfx-blip",
    name: "Blip",
    src: "/sfx/blip.mp3",
    category: "ui",
    description: "Quick blip for text or element appear",
    durationMs: 50,
  },
];

// Map of SFX names the LLM can reference
export const SFX_BY_NAME: Record<string, SfxItem> = Object.fromEntries(
  SFX_LIBRARY.map((sfx) => [sfx.name.toLowerCase(), sfx])
);

export const SFX_CATEGORIES = ["transition", "emphasis", "ui", "mood"] as const;
