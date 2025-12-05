import { NextResponse } from "next/server";

// This gets updated at build time via environment variable or automatically
// When this value changes from what the client has, they should refresh
const BUILD_VERSION = process.env.NEXT_PUBLIC_BUILD_ID || 
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || 
    new Date().toISOString().slice(0, 10);

export async function GET() {
    return NextResponse.json({
        version: BUILD_VERSION,
        timestamp: Date.now(),
    });
}
