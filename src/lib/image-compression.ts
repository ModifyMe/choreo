// Lazy-loaded image compression to reduce initial bundle size (~30KB)
// The actual library is only loaded when compressImage is first called

let imageCompressionModule: typeof import("browser-image-compression") | null = null;

export async function compressImage(
    file: File,
    options?: {
        maxSizeMB?: number;
        maxWidthOrHeight?: number;
        useWebWorker?: boolean;
    }
): Promise<File> {
    // Dynamically import only when needed
    if (!imageCompressionModule) {
        imageCompressionModule = await import("browser-image-compression");
    }

    const defaultOptions = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        ...options,
    };

    return imageCompressionModule.default(file, defaultOptions);
}
