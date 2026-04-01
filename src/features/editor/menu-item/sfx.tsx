"use client";
import { useState, useRef, useCallback } from "react";
import { Play, Pause, Plus, Volume2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { generateId } from "@designcombo/timeline";
import { dispatch } from "@designcombo/events";
import { ADD_AUDIO } from "@designcombo/state";
import { SFX_LIBRARY, SFX_CATEGORIES, type SfxItem } from "../data/sfx";
import { cn } from "@/lib/utils";

function SfxCard({
  sfx,
  isPlaying,
  onTogglePlay,
  onAdd,
}: {
  sfx: SfxItem;
  isPlaying: boolean;
  onTogglePlay: (id: string) => void;
  onAdd: (sfx: SfxItem) => void;
}) {
  const categoryColors: Record<string, string> = {
    transition: "bg-blue-500/20 text-blue-400",
    emphasis: "bg-amber-500/20 text-amber-400",
    ui: "bg-green-500/20 text-green-400",
    mood: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 group transition-colors">
      <button
        onClick={() => onTogglePlay(sfx.id)}
        className="flex-none w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
      >
        {isPlaying ? (
          <Pause className="w-3.5 h-3.5" />
        ) : (
          <Play className="w-3.5 h-3.5 ml-0.5" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{sfx.name}</span>
          <span
            className={cn(
              "text-[10px] px-1.5 py-0.5 rounded-full flex-none",
              categoryColors[sfx.category] || "bg-white/10 text-white/60"
            )}
          >
            {sfx.category}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {sfx.durationMs < 100
            ? `${sfx.durationMs}ms`
            : `${(sfx.durationMs / 1000).toFixed(1)}s`}
        </span>
      </div>

      <Button
        size="icon"
        variant="ghost"
        className="flex-none h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => onAdd(sfx)}
      >
        <Plus className="w-4 h-4" />
      </Button>
    </div>
  );
}

export function SFX() {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlay = useCallback(
    (id: string) => {
      if (playingId === id) {
        audioRef.current?.pause();
        setPlayingId(null);
        return;
      }

      const sfx = SFX_LIBRARY.find((s) => s.id === id);
      if (!sfx) return;

      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(sfx.src);
      audio.volume = 0.5;
      audio.onended = () => setPlayingId(null);
      audio.play();
      audioRef.current = audio;
      setPlayingId(id);
    },
    [playingId]
  );

  const handleAddSfx = useCallback((sfx: SfxItem) => {
    dispatch(ADD_AUDIO, {
      payload: {
        id: generateId(),
        type: "audio",
        details: {
          src: sfx.src,
          volume: 80,
        },
        name: `SFX: ${sfx.name}`,
        metadata: {
          sfxName: sfx.name,
          category: sfx.category,
        },
      },
      options: {},
    });
  }, []);

  const filteredSfx =
    activeCategory === "all"
      ? SFX_LIBRARY
      : SFX_LIBRARY.filter((s) => s.category === activeCategory);

  return (
    <div className="flex flex-1 flex-col max-w-full h-full">
      <div className="flex items-center gap-1.5 px-4 py-3">
        <Volume2 className="w-4 h-4 text-muted-foreground flex-none" />
        <span className="text-sm font-medium">Sound Effects</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {SFX_LIBRARY.length} sounds
        </span>
      </div>

      {/* Category filter */}
      <div className="flex gap-1 px-4 pb-2 flex-wrap">
        <button
          onClick={() => setActiveCategory("all")}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full transition-colors",
            activeCategory === "all"
              ? "bg-white/15 text-white"
              : "bg-white/5 text-muted-foreground hover:bg-white/10"
          )}
        >
          All
        </button>
        {SFX_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "text-xs px-2.5 py-1 rounded-full transition-colors capitalize",
              activeCategory === cat
                ? "bg-white/15 text-white"
                : "bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-0.5 pb-4">
          {filteredSfx.map((sfx) => (
            <SfxCard
              key={sfx.id}
              sfx={sfx}
              isPlaying={playingId === sfx.id}
              onTogglePlay={handleTogglePlay}
              onAdd={handleAddSfx}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
