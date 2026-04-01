import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

function generateId(length = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { urls } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json(
        { error: "urls array is required" },
        { status: 400 }
      );
    }

    const uploadsDir = join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });

    const uploads = await Promise.all(
      urls.map(async (url: string) => {
        const response = await fetch(url);
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") || "video/mp4";
        const ext = contentType.split("/")[1]?.split(";")[0] || "mp4";
        const fileName = `${generateId()}_download.${ext}`;
        const filePath = join(uploadsDir, fileName);

        await writeFile(filePath, buffer);

        return {
          fileName,
          filePath: `/uploads/${fileName}`,
          contentType,
          originalUrl: url,
          url: `/uploads/${fileName}`,
          folder: null,
        };
      })
    );

    return NextResponse.json({ success: true, uploads });
  } catch (error) {
    console.error("URL upload error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
