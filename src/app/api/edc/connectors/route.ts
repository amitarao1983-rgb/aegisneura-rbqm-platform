import { NextResponse } from "next/server";
import { readPlatform } from "@/lib/store";

export async function GET() {
  const data = await readPlatform();
  return NextResponse.json({ connectors: data.connectors });
}
