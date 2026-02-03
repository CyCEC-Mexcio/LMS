import { NextResponse } from "next/server";
import Mux from "@mux/mux-node";

const mux = new Mux({
  tokenId: process.env.MUX_TOKEN_ID!,
  tokenSecret: process.env.MUX_TOKEN_SECRET!,
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get("uploadId");

    if (!uploadId) {
      return NextResponse.json({ error: "Upload ID required" }, { status: 400 });
    }

    const upload = await mux.video.uploads.retrieve(uploadId);

    if (upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      
      if (asset.playback_ids && asset.playback_ids.length > 0) {
        return NextResponse.json({
          status: "ready",
          playbackId: asset.playback_ids[0].id,
          assetId: asset.id,
        });
      }
    }

    return NextResponse.json({
      status: upload.status,
      playbackId: null,
    });
  } catch (error) {
    console.error("Error checking Mux upload:", error);
    return NextResponse.json(
      { error: "Failed to check upload status" },
      { status: 500 }
    );
  }
}