export interface MusicTrack {
  id: string;
  name: string;
  src: string;
  mood: string;
  description: string;
  durationMs: number;
  bpm: number;
  /** Volume 0-100 for background use (with ducking, this is the "high" level) */
  defaultVolume: number;
  /** Volume during narration (ducked level) */
  duckedVolume: number;
}

export const MUSIC_LIBRARY: MusicTrack[] = [
  {
    id: "music-chill-lofi",
    name: "Chill Lo-fi",
    src: "/music/chill-lofi.mp3",
    mood: "calm",
    description: "Soft ambient pad — relaxed storytelling, tutorials",
    durationMs: 15000,
    bpm: 80,
    defaultVolume: 25,
    duckedVolume: 10,
  },
  {
    id: "music-upbeat-energy",
    name: "Upbeat Energy",
    src: "/music/upbeat-energy.mp3",
    mood: "energetic",
    description: "Rhythmic pulse — hype content, product reveals",
    durationMs: 15000,
    bpm: 120,
    defaultVolume: 20,
    duckedVolume: 8,
  },
  {
    id: "music-corporate-calm",
    name: "Corporate Calm",
    src: "/music/corporate-calm.mp3",
    mood: "professional",
    description: "Gentle ambient — business content, presentations",
    durationMs: 15000,
    bpm: 70,
    defaultVolume: 20,
    duckedVolume: 8,
  },
  {
    id: "music-dramatic-cinematic",
    name: "Dramatic Cinematic",
    src: "/music/dramatic-cinematic.mp3",
    mood: "dramatic",
    description: "Deep tension — dramatic reveals, storytelling hooks",
    durationMs: 15000,
    bpm: 60,
    defaultVolume: 22,
    duckedVolume: 10,
  },
  {
    id: "music-tech-modern",
    name: "Tech Modern",
    src: "/music/tech-modern.mp3",
    mood: "energetic",
    description: "Bright techy vibe — tech content, AI topics, startups",
    durationMs: 15000,
    bpm: 110,
    defaultVolume: 18,
    duckedVolume: 7,
  },
  {
    id: "music-inspiring",
    name: "Inspiring",
    src: "/music/inspiring.mp3",
    mood: "inspiring",
    description: "Warm uplifting — motivational, success stories",
    durationMs: 15000,
    bpm: 90,
    defaultVolume: 22,
    duckedVolume: 9,
  },
];

/** Map LLM mood output to a music track */
export const MOOD_TO_MUSIC: Record<string, string> = {
  calm: "music-chill-lofi",
  relaxed: "music-chill-lofi",
  chill: "music-chill-lofi",
  energetic: "music-upbeat-energy",
  exciting: "music-upbeat-energy",
  hype: "music-upbeat-energy",
  professional: "music-corporate-calm",
  corporate: "music-corporate-calm",
  business: "music-corporate-calm",
  dramatic: "music-dramatic-cinematic",
  serious: "music-dramatic-cinematic",
  intense: "music-dramatic-cinematic",
  techy: "music-tech-modern",
  tech: "music-tech-modern",
  modern: "music-tech-modern",
  inspiring: "music-inspiring",
  motivational: "music-inspiring",
  uplifting: "music-inspiring",
};

export const MUSIC_BY_ID: Record<string, MusicTrack> = Object.fromEntries(
  MUSIC_LIBRARY.map((t) => [t.id, t])
);
