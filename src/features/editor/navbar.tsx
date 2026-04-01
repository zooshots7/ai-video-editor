import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { dispatch } from "@designcombo/events";
import { HISTORY_UNDO, HISTORY_REDO, DESIGN_RESIZE, DESIGN_LOAD } from "@designcombo/state";
import { Icons } from "@/components/shared/icons";
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import {
  ChevronDown,
  Download,
  Keyboard,
  Loader2,
  ProportionsIcon,
  ShareIcon,
  Sparkles,
  Upload
} from "lucide-react";
import { Label } from "@/components/ui/label";

import type StateManager from "@designcombo/state";
import { generateId } from "@designcombo/timeline";
import type { IDesign } from "@designcombo/types";
import { useDownloadState } from "./store/use-download-state";
import DownloadProgressModal from "./download-progress-modal";
import AutosizeInput from "@/components/ui/autosize-input";
import { debounce } from "lodash";
import {
  useIsLargeScreen,
  useIsMediumScreen,
  useIsSmallScreen
} from "@/hooks/use-media-query";

import { LogoIcons } from "@/components/shared/logos";
import Link from "next/link";
import { ShortcutsModal } from "./shortcuts-modal";
import { ModeToggle } from "@/components/ui/mode-toggle";
import useAiEditStore from "./store/use-ai-edit-store";

export default function Navbar({
  user,
  stateManager,
  setProjectName,
  projectName
}: {
  user: any | null;
  stateManager: StateManager;
  setProjectName: (name: string) => void;
  projectName: string;
}) {
  const [title, setTitle] = useState(projectName);
  const isLargeScreen = useIsLargeScreen();
  const isMediumScreen = useIsMediumScreen();
  const isSmallScreen = useIsSmallScreen();
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  const handleUndo = () => {
    dispatch(HISTORY_UNDO);
  };

  const handleRedo = () => {
    dispatch(HISTORY_REDO);
  };

  const handleCreateProject = async () => {};

  // Create a debounced function for setting the project name
  const debouncedSetProjectName = useCallback(
    debounce((name: string) => {
      console.log("Debounced setProjectName:", name);
      setProjectName(name);
    }, 2000), // 2 seconds delay
    []
  );

  // Update the debounced function whenever the title changes
  useEffect(() => {
    debouncedSetProjectName(title);
  }, [title, debouncedSetProjectName]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: isLargeScreen ? "320px 1fr 320px" : "1fr 1fr 1fr"
      }}
      className="bg-card pointer-events-none flex h-13 items-center border-b border-border/80 px-2"
    >
      <DownloadProgressModal />

      <div className="flex items-center gap-2">
        <div className="pointer-events-auto flex h-11 items-center justify-center rounded-md px-2">
          <span className="text-sm font-bold bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text text-transparent">
            ReelForge
          </span>
        </div>

        <div className=" pointer-events-auto flex h-10 items-center px-1.5">
          <Button
            onClick={handleUndo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <Icons.undo width={20} />
          </Button>
          <Button
            onClick={handleRedo}
            className="text-muted-foreground"
            variant="ghost"
            size="icon"
          >
            <Icons.redo width={20} />
          </Button>
        </div>
      </div>

      <div className="flex h-13 items-center justify-center gap-2">
        {!isSmallScreen && (
          <div className=" pointer-events-auto flex h-10 items-center gap-2 rounded-md px-2.5">
            <AutosizeInput
              name="title"
              value={title}
              onChange={handleTitleChange}
              width={200}
              inputClassName="border-none outline-none px-1 text-sm font-medium"
            />
          </div>
        )}
      </div>

      <div className="flex h-13 items-center justify-end gap-2">
        <div className=" pointer-events-auto flex h-10 items-center gap-2 rounded-md px-2.5">
          <AiAutoEditButton stateManager={stateManager} />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => setIsShortcutsModalOpen(true)}
          >
            <Keyboard className="size-5" />
          </Button>
          <ModeToggle />

          {/* <Button
            className="flex h-8 gap-1 border border-border"
            variant="outline"
            size={isMediumScreen ? "sm" : "icon"}
          >
            <ShareIcon width={18} />{" "}
            <span className="hidden md:block">Share</span>
          </Button> */}

          <DownloadPopover stateManager={stateManager} />
        </div>
      </div>
      <ShortcutsModal
        open={isShortcutsModalOpen}
        onOpenChange={setIsShortcutsModalOpen}
      />
    </div>
  );
}

const CAPTION_STYLE_OPTIONS = [
  { id: "bold-highlight", name: "Bold Highlight", desc: "Yellow active word" },
  { id: "neon-pop", name: "Neon Pop", desc: "Green neon + purple fill" },
  { id: "clean-minimal", name: "Clean Minimal", desc: "Dark on light pill" },
  { id: "fire-orange", name: "Fire Orange", desc: "Orange highlight box" },
  { id: "shadow-glow", name: "Shadow Glow", desc: "Cinematic glow" },
  { id: "red-bold", name: "Red Bold", desc: "Red active word" },
];

const AiAutoEditButton = ({
  stateManager,
}: {
  stateManager: StateManager;
}) => {
  const { isProcessing, status, error, captionStyle, setProcessing, setStatus, setError, setCaptionStyle, reset } =
    useAiEditStore();
  const isMediumScreen = useIsMediumScreen();
  const [open, setOpen] = useState(false);

  const handleAiEdit = async () => {
    const state = stateManager.toJSON();
    const videoItem = Object.values(state.trackItemsMap || {}).find(
      (item: any) => item.type === "video" && item.details?.src
    ) as any;

    if (!videoItem) {
      setError("Add a video to the timeline first, then click AI Auto-Edit");
      return;
    }

    setOpen(false);
    reset();
    setProcessing(true);
    setStatus("Extracting audio & transcribing...");

    try {
      const response = await fetch("/api/ai-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoSrc: videoItem.details.src,
          videoDurationMs: videoItem.duration || (videoItem.display?.to - videoItem.display?.from),
          videoItemId: videoItem.id,
          captionStyle,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "AI edit failed");
      }

      setStatus("Loading edits into timeline...");
      const result = await response.json();

      // Load the full design (keeps the original video + adds captions & B-roll)
      dispatch(DESIGN_LOAD, { payload: result.design });

      setStatus(
        `Done! ${result.editPlan.brollCount} B-roll clips + ${result.transcript.wordCount} caption words`
      );
      setTimeout(() => {
        reset();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
      setStatus("");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      {isProcessing ? (
        <Button
          className="flex h-8 gap-1.5 rounded-full bg-violet-600 text-white border-0"
          size={isMediumScreen ? "sm" : "icon"}
          disabled
        >
          <Loader2 width={16} className="animate-spin" />
          <span className="hidden md:block text-xs">{status || "Processing..."}</span>
        </Button>
      ) : (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              className="flex h-8 gap-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white border-0"
              size={isMediumScreen ? "sm" : "icon"}
            >
              <Sparkles width={16} />
              <span className="hidden md:block">AI Auto-Edit</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="bg-sidebar z-[250] flex w-72 flex-col gap-3 p-4"
          >
            <div className="font-semibold text-sm">Caption Style</div>
            <div className="grid grid-cols-2 gap-2">
              {CAPTION_STYLE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setCaptionStyle(opt.id)}
                  className={`flex flex-col gap-0.5 p-2 rounded-lg border text-left transition-colors ${
                    captionStyle === opt.id
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-border hover:border-violet-500/50"
                  }`}
                >
                  <span className="text-xs font-medium">{opt.name}</span>
                  <span className="text-[10px] text-muted-foreground">{opt.desc}</span>
                </button>
              ))}
            </div>
            {error && (
              <p className="text-xs text-red-400">{error}</p>
            )}
            <Button
              onClick={handleAiEdit}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Auto-Edit Video
            </Button>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
};

const DownloadPopover = ({ stateManager }: { stateManager: StateManager }) => {
  const isMediumScreen = useIsMediumScreen();
  const { actions, exportType } = useDownloadState();
  const [isExportTypeOpen, setIsExportTypeOpen] = useState(false);
  const [open, setOpen] = useState(false);

  const handleExport = () => {
    const data: IDesign = {
      id: generateId(),
      ...stateManager.toJSON()
    };

    console.log({ data });

    actions.setState({ payload: data });
    actions.startExport();
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="flex h-8 gap-1 border border-border rounded-full"
          size={isMediumScreen ? "sm" : "icon"}
        >
          {/* <Download width={18} />{" "} */}
          <span className="hidden md:block">Download</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="bg-sidebar z-[250] flex w-60 flex-col gap-4"
      >
        <Label>Export settings</Label>

        <Popover open={isExportTypeOpen} onOpenChange={setIsExportTypeOpen}>
          <PopoverTrigger asChild>
            <Button className="w-full justify-between" variant="outline">
              <div>{exportType.toUpperCase()}</div>
              <ChevronDown width={16} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="bg-background z-[251] w-[--radix-popover-trigger-width] px-2 py-2">
            <div
              className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
              onClick={() => {
                actions.setExportType("mp4");
                setIsExportTypeOpen(false);
              }}
            >
              MP4
            </div>
            <div
              className="flex h-7 items-center rounded-sm px-3 text-sm hover:cursor-pointer hover:bg-zinc-800"
              onClick={() => {
                actions.setExportType("json");
                setIsExportTypeOpen(false);
              }}
            >
              JSON
            </div>
          </PopoverContent>
        </Popover>

        <div>
          <Button onClick={handleExport} className="w-full">
            Export
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

interface ResizeOptionProps {
  label: string;
  icon: string;
  value: ResizeValue;
  description: string;
}

interface ResizeValue {
  width: number;
  height: number;
  name: string;
}

const RESIZE_OPTIONS: ResizeOptionProps[] = [
  {
    label: "16:9",
    icon: "landscape",
    description: "YouTube ads",
    value: {
      width: 1920,
      height: 1080,
      name: "16:9"
    }
  },
  {
    label: "9:16",
    icon: "portrait",
    description: "TikTok, YouTube Shorts",
    value: {
      width: 1080,
      height: 1920,
      name: "9:16"
    }
  },
  {
    label: "1:1",
    icon: "square",
    description: "Instagram, Facebook posts",
    value: {
      width: 1080,
      height: 1080,
      name: "1:1"
    }
  }
];

const ResizeVideo = () => {
  const handleResize = (options: ResizeValue) => {
    dispatch(DESIGN_RESIZE, {
      payload: {
        ...options
      }
    });
  };
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="z-10 h-7 gap-2" variant="outline" size={"sm"}>
          <ProportionsIcon className="h-4 w-4" />
          <div>Resize</div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="z-[250] w-60 px-2.5 py-3">
        <div className="text-sm">
          {RESIZE_OPTIONS.map((option, index) => (
            <ResizeOption
              key={index}
              label={option.label}
              icon={option.icon}
              value={option.value}
              handleResize={handleResize}
              description={option.description}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

const ResizeOption = ({
  label,
  icon,
  value,
  description,
  handleResize
}: ResizeOptionProps & { handleResize: (payload: ResizeValue) => void }) => {
  const Icon = Icons[icon as "text"];
  return (
    <div
      onClick={() => handleResize(value)}
      className="flex cursor-pointer items-center rounded-md p-2 hover:bg-zinc-50/10"
    >
      <div className="w-8 text-muted-foreground">
        <Icon size={20} />
      </div>
      <div>
        <div>{label}</div>
        <div className="text-xs text-muted-foreground">{description}</div>
      </div>
    </div>
  );
};
