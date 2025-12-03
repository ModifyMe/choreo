import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const body = await req.json();
        const { filePath, bucketName = 'chore-proofs' } = body;

        if (!filePath) {
            return new NextResponse("Missing filePath", { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        if (!supabaseServiceKey) {
            console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
            return new NextResponse("Server Configuration Error", { status: 500 });
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Generate a signed URL for the client to upload directly to Supabase
        // This bypasses the Vercel 4.5MB payload limit
        const { data, error } = await supabaseAdmin.storage
            .from(bucketName)
            .createSignedUploadUrl(filePath);

        if (error) {
            console.error("Supabase Signed URL Error:", error);
            throw error;
        }

        return NextResponse.json({ token: data.token, path: data.path, signedUrl: data.signedUrl });
    } catch (error) {
        console.error("[UPLOAD_ERROR]", error);
        return new NextResponse("Internal Upload Error", { status: 500 });
    }
}
