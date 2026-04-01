"use client";
import { useState, useRef, useCallback } from "react";
import { Play, Pause, Plus, Music, Volume2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { generateId } from "@designcombo/timeline";
import { dispatch } from "@designcombo/events";
import { ADD_AUDIO } from "@designcombo/state";
import { MUSIC_LIBRARY, type MusicTrack } from "../data/music";
import { cn } from "@/lib/utils";

function MusicCard({
  track,
  isPlaying,
  onTogglePlay,
  onAdd,
}: {
  track: MusicTrack;
  isPlaying: boolean;
  onTogglePlay: (id: string) => void;
  onAdd: (track: MusicTrack) => void;
}) {
  const moodColors: Record<string, string> = {
    calm: "bg-sky-500/20 text-sky-400",
    energetic: "bg-orange-500/20 text-orange-400",
    professional: "bg-slate-500/20 text-slate-400",
    dramatic: "bg-red-500/20 text-red-400",
    inspiring: "bg-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-white/5 group transition-colors">
      <button
        onClick={() => onTogglePlay(track.id)}
        className="flex-none w-9 h-9 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-4 h-4" />
        ) : (
          <Play className="w-4 h-4 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{track.name}</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full flex-none",
              moodColors[track.mood] || "bg-white/10 text-white/60"
            )}
          >
            {track.mood}
          </span>
        </div>
        <span className="text-xs text-muted-foreground line-clamp-1">
          {track.description}
        </span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="flex-none h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onAdd(track)}
        title="Add to timeline"
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export const Audios = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlay = useCallback(
    (id: string) => {
      if (playingId === id) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
      }

      const track = MUSIC_LIBRARY.find((t) => t.id === id);
      if (!track) return;

      if (audioRef.current) audioRef.current.pause();

      const audio = new Audio(track.src);
      audio.volume = 0.4;
      audio.loop = true;
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(id);
    },
    [playingId]
  );

  const handleAddMusic = useCallback((track: MusicTrack) => {
    dispatch(ADD_AUDIO, {
      payload: {
        id: generateId(),
        type: "audio",
        details: {
          src: track.src,
          volume: track.duckedVolume, // Auto-ducked for narration
        },
        name: `Music: ${track.name}`,
        metadata: {
          musicId: track.id,
          mood: track.mood,
          isDucked: true,
          defaultVolume: track.defaultVolume,
          duckedVolume: track.duckedVolume,
        },
      },
      options: {},
    });
  }, []);

  return (
    <div className="flex flex-1 flex-col max-w-full h-full">
      <div className="flex items-center gap-1.5 px-4 py-3">
        <Music className="w-4 h-4 text-muted-foreground flex-none" />
        <span className="text-sm font-medium">Background Music</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {MUSIC_LIBRARY.length} tracks
        </span>
      </div>

      <div className="px-4 pb-2">
        <p className="text-xs text-muted-foreground">
          Music auto-ducks during narration. AI Auto-Edit picks the best track based on mood.
        </p>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-0.5 pb-4">
          {MUSIC_LIBRARY.map((track) => (
            <MusicCard
              key={track.id}
              track={track}
              isPlaying={playingId === track.id}
              onTogglePlay={handleTogglePlay}
              onAdd={handleAddMusic}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
