import { NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export const maxDuration = 120;

interface Word {
  word: string;
  start: number;
  end: number;
}

interface Segment {
  id: number;
  start: number;
  end: number;
  text: string;
}

interface EditPlan {
  segments: Array<{
    text: string;
    start_ms: number;
    end_ms: number;
    broll_query: string | null;
    broll_start_ms: number | null;
    broll_end_ms: number | null;
    transition: string | null;
  }>;
  overall_mood: string;
}

interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
}

interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  image: string;
  duration: number;
  video_files: PexelsVideoFile[];
}

function generateId(length = 16): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Extract audio from video file using ffmpeg → small mp3 for Whisper
async function extractAudio(videoPath: string): Promise<string> {
  const audioPath = videoPath.replace(/\.[^.]+$/, "") + "_audio.mp3";
  const ffmpegPath = "/opt/homebrew/bin/ffmpeg";

  await execFileAsync(ffmpegPath, [
    "-i", videoPath,
    "-vn",                // no video
    "-acodec", "libmp3lame",
    "-ab", "64k",         // low bitrate, good enough for speech
    "-ar", "16000",       // 16kHz mono, ideal for Whisper
    "-ac", "1",
    "-y",                 // overwrite
    audioPath,
  ]);

  return audioPath;
}

// Transcribe audio file using Whisper
async function transcribeAudio(
  audioPath: string,
  apiKey: string
): Promise<{ text: string; words: Word[]; segments: Segment[]; duration: number }> {
  const { readFile } = await import("fs/promises");
  const audioBuffer = await readFile(audioPath);
  const audioBlob = new Blob([audioBuffer], { type: "audio/mp3" });

  const formData = new FormData();
  formData.append("file", audioBlob, "audio.mp3");
  formData.append("model", "whisper-1");
  formData.append("response_format", "verbose_json");
  formData.append("timestamp_granularities[]", "word");
  formData.append("timestamp_granularities[]", "segment");

  const response = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    }
  );

  if (!response.ok) {
    const err = await response.json();
    throw new Error(
      `Whisper error: ${err?.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const segments = data.segments || [];
  const words = data.words || [];
  let duration = data.duration || 0;
  if (!duration && segments.length > 0) {
    duration = segments[segments.length - 1].end;
  }

  return { text: data.text, words, segments, duration };
}

// Plan edits with LLM
async function planEdits(
  transcript: { text: string; segments: Segment[] },
  videoDurationMs: number,
  apiKey: string
): Promise<EditPlan> {
  const segmentsInfo = transcript.segments
    .map((s) => `[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s]: "${s.text.trim()}"`)
    .join("\n");

  const prompt = `You are an expert Instagram Reels video editor. Given a transcript of an AI avatar narration video, plan the edits to make it engaging.

VIDEO DURATION: ${(videoDurationMs / 1000).toFixed(1)} seconds
TRANSCRIPT SEGMENTS:
${segmentsInfo}

For each segment, decide:
1. Whether to insert B-roll footage (search query for Pexels). Only add B-roll for segments that reference visual concepts, actions, or objects. Skip B-roll for intro greetings, filler, or abstract statements.
2. B-roll timing - when to show it (start_ms and end_ms) within the segment. B-roll should be 2-5 seconds max.
3. What transition to use before the B-roll (one of: "crossfade", "slide-left", "slide-right", "zoom-in", "none").

RULES:
- Add B-roll to roughly 30-50% of segments, not all
- B-roll queries should be specific and visual (e.g. "person typing laptop" not "technology")
- All times in milliseconds
- Keep B-roll clips short (2-4 seconds)

Return JSON only, no markdown:
{
  "segments": [
    {
      "text": "segment text",
      "start_ms": 0,
      "end_ms": 3000,
      "broll_query": "search query" or null,
      "broll_start_ms": 1000 or null,
      "broll_end_ms": 3000 or null,
      "transition": "crossfade" or null
    }
  ],
  "overall_mood": "energetic/calm/professional/etc"
}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`LLM error: ${err?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

// Fetch B-roll from Pexels
async function fetchBroll(
  query: string,
  apiKey: string
): Promise<PexelsVideo | null> {
  const url = `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait`;
  const response = await fetch(url, { headers: { Authorization: apiKey } });
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.videos?.length) return null;
  return data.videos[Math.floor(Math.random() * data.videos.length)];
}

// Build the design JSON
function buildDesign(
  videoSrc: string,
  videoDurationMs: number,
  words: Word[],
  editPlan: EditPlan,
  brollMap: Map<string, PexelsVideo>
) {
  const designId = generateId();
  const mainVideoId = generateId();
  const tracks: any[] = [];
  const trackItemsMap: Record<string, any> = {};
  const trackItemIds: string[] = [];
  const transitionsMap: Record<string, any> = {};
  const transitionIds: string[] = [];

  // Main video track
  trackItemsMap[mainVideoId] = {
    id: mainVideoId,
    details: {
      width: 1080, height: 1920, opacity: 100, src: videoSrc,
      volume: 100, borderRadius: 0, borderWidth: 0, borderColor: "#000000",
      boxShadow: { color: "#000000", x: 0, y: 0, blur: 0 },
      top: "0px", left: "0px", transform: "none",
      blur: 0, brightness: 100, flipX: false, flipY: false,
      rotate: "0deg", visibility: "visible",
    },
    trim: { from: 0, to: videoDurationMs },
    type: "video", name: "Main Video", playbackRate: 1,
    display: { from: 0, to: videoDurationMs },
    duration: videoDurationMs, isMain: true,
  };
  trackItemIds.push(mainVideoId);

  const mainTrackId = generateId();
  tracks.push({
    id: mainTrackId, items: [mainVideoId], type: "video",
    name: "Main Video", accepts: ["video", "image", "text", "audio", "caption"],
    magnetic: false, static: false,
  });

  // B-roll track
  const brollTrackItems: string[] = [];
  for (const seg of editPlan.segments) {
    if (!seg.broll_query || !seg.broll_start_ms || !seg.broll_end_ms) continue;
    const bv = brollMap.get(seg.broll_query);
    if (!bv) continue;
    const vf = bv.video_files.find((f) => f.quality === "hd" && f.height > f.width)
      || bv.video_files.find((f) => f.quality === "hd")
      || bv.video_files[0];
    if (!vf) continue;

    const id = generateId();
    const dur = seg.broll_end_ms - seg.broll_start_ms;
    trackItemsMap[id] = {
      id, type: "video", name: `B-Roll: ${seg.broll_query}`, playbackRate: 1,
      details: {
        width: 1080, height: 1920, opacity: 100, src: vf.link, volume: 0,
        borderRadius: 0, borderWidth: 0, borderColor: "#000000",
        boxShadow: { color: "#000000", x: 0, y: 0, blur: 0 },
        top: "0px", left: "0px", transform: "none",
        blur: 0, brightness: 100, flipX: false, flipY: false,
        rotate: "0deg", visibility: "visible",
      },
      trim: { from: 0, to: dur },
      display: { from: seg.broll_start_ms, to: seg.broll_end_ms },
      duration: dur, isMain: false,
      metadata: { pexelsId: bv.id, previewUrl: bv.image },
    };
    trackItemIds.push(id);
    brollTrackItems.push(id);
  }

  if (brollTrackItems.length > 0) {
    tracks.push({
      id: generateId(), items: brollTrackItems, type: "video",
      name: "B-Roll", accepts: ["video", "image"], magnetic: false, static: false,
    });
  }

  // Caption track
  const captionItems: string[] = [];
  const WORDS_PER_CAPTION = 4;
  for (let i = 0; i < words.length; i += WORDS_PER_CAPTION) {
    const chunk = words.slice(i, i + WORDS_PER_CAPTION);
    if (!chunk.length) continue;
    const id = generateId();
    const text = chunk.map((w) => w.word).join(" ");
    const startMs = chunk[0].start * 1000;
    const endMs = chunk[chunk.length - 1].end * 1000;

    trackItemsMap[id] = {
      id, name: "caption", type: "caption",
      display: { from: startMs, to: endMs },
      details: {
        appearedColor: "#FFFFFF", activeColor: "#FFD700",
        activeFillColor: "transparent", color: "#FFFFFF",
        backgroundColor: "transparent", borderColor: "#000000", borderWidth: 0,
        text, fontSize: 58, width: 900, fontFamily: "Inter",
        fontUrl: "https://fonts.gstatic.com/s/inter/v18/UcCo3FwrK3iLTcviYwY.woff2",
        textAlign: "center", linesPerCaption: 1,
        words: chunk.map((w) => ({
          word: w.word, start: w.start * 1000, end: w.end * 1000,
          confidence: 1, is_keyword: false,
        })),
        fontWeight: "bold", fontStyle: "normal", textDecoration: "none",
        lineHeight: "normal", letterSpacing: "normal", wordSpacing: "normal",
        border: "none", textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
        opacity: 100, wordWrap: "normal", wordBreak: "normal",
        WebkitTextStrokeColor: "#000000", WebkitTextStrokeWidth: "1px",
        top: "1400px", left: "90px", textTransform: "uppercase",
        transform: "none", skewX: 0, skewY: 0, height: 80,
        boxShadow: { color: "#000000", x: 0, y: 0, blur: 0 },
        isKeywordColor: "transparent", preservedColorKeyWord: false,
        wordsPerLine: "punctuationOrPause",
      },
      metadata: { parentId: mainVideoId },
      isMain: false,
    };
    trackItemIds.push(id);
    captionItems.push(id);
  }

  tracks.unshift({
    id: generateId(), items: captionItems, type: "caption",
    name: "Captions", accepts: ["caption"], magnetic: false, static: false,
  });

  return {
    id: designId, fps: 30, tracks,
    size: { width: 1080, height: 1920 },
    trackItemIds, transitionsMap, trackItemsMap, transitionIds,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { videoSrc, videoDurationMs } = body;

    if (!videoSrc || !videoDurationMs) {
      return NextResponse.json(
        { message: "No video found on timeline. Upload a video first." },
        { status: 400 }
      );
    }

    const openaiKey = process.env.OPENAI_API_KEY;
    const pexelsKey = process.env.PEXELS_API_KEY;

    if (!openaiKey) {
      return NextResponse.json(
        { message: "OPENAI_API_KEY not configured in .env.local" },
        { status: 500 }
      );
    }

    // Resolve the video file path on disk
    // videoSrc is either a public path like "/uploads/foo.mp4" or a full URL
    let videoFilePath: string;
    const tmpDir = join(process.cwd(), "public", "uploads");
    await mkdir(tmpDir, { recursive: true });

    if (videoSrc.startsWith("/")) {
      // Local public file
      videoFilePath = join(process.cwd(), "public", videoSrc);
    } else if (videoSrc.startsWith("http")) {
      // Remote URL - download it
      const resp = await fetch(videoSrc);
      const buf = Buffer.from(await resp.arrayBuffer());
      videoFilePath = join(tmpDir, `dl_${generateId()}.mp4`);
      await writeFile(videoFilePath, buf);
    } else {
      // Blob or data URL won't work server-side
      return NextResponse.json(
        { message: "Video must be uploaded via the sidebar Uploads panel so it has a server-accessible URL. Drag & drop your MP4 into the Uploads panel first." },
        { status: 400 }
      );
    }

    // Step 1: Extract audio (small mp3) then transcribe
    const audioPath = await extractAudio(videoFilePath);
    const transcript = await transcribeAudio(audioPath, openaiKey);

    // Clean up temp audio
    await unlink(audioPath).catch(() => {});

    const actualDurationMs = transcript.duration * 1000 || videoDurationMs;

    // Step 2: Plan edits
    const editPlan = await planEdits(transcript, actualDurationMs, openaiKey);

    // Step 3: Fetch B-roll
    const brollMap = new Map<string, PexelsVideo>();
    if (pexelsKey) {
      const queries = [...new Set(
        editPlan.segments.filter((s) => s.broll_query).map((s) => s.broll_query as string)
      )];
      const results = await Promise.all(queries.map((q) => fetchBroll(q, pexelsKey)));
      queries.forEach((q, i) => { if (results[i]) brollMap.set(q, results[i]!); });
    }

    // Step 4: Build design
    const design = buildDesign(videoSrc, actualDurationMs, transcript.words, editPlan, brollMap);

    return NextResponse.json({
      design,
      transcript: {
        text: transcript.text,
        wordCount: transcript.words.length,
        segmentCount: transcript.segments.length,
        durationSeconds: transcript.duration,
      },
      editPlan: {
        segmentCount: editPlan.segments.length,
        brollCount: editPlan.segments.filter((s) => s.broll_query).length,
        mood: editPlan.overall_mood,
      },
    });
  } catch (error: any) {
    console.error("AI Edit error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
