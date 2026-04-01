import { NextRequest, NextResponse } from "next/server";
import { mkdir } from "fs/promises";
import { join } from "path";

function generateId(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  const types: Record<string, string> = {
    mp4: "video/mp4",
    mov: "video/quicktime",
    webm: "video/webm",
    avi: "video/x-msvideo",
    mp3: "audio/mpeg",
    wav: "audio/wav",
    ogg: "audio/ogg",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return types[ext] || "application/octet-stream";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fileNames } = body;

    if (!fileNames || !Array.isArray(fileNames) || fileNames.length === 0) {
      return NextResponse.json(
        { error: "fileNames array is required" },
        { status: 400 }
      );
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uploads = fileNames.map((fileName: string) => {
      const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueName = `${generateId()}_${safeFileName}`;
      const contentType = getContentType(fileName);
      const filePath = `/uploads/${uniqueName}`;

      return {
        fileName: uniqueName,
        filePath,
        contentType,
        // The "presignedUrl" points to our local upload endpoint
        presignedUrl: `/api/uploads/file?name=${encodeURIComponent(uniqueName)}`,
        url: filePath,
        folder: null,
      };
    });

    return NextResponse.json({ success: true, uploads });
  } catch (error) {
    console.error("Presign error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
