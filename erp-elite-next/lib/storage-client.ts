/**
 * Client-side safe storage utilities.
 * Mimics the URL resolution logic of StorageService but without server dependencies.
 */
export function getStorageUrl(path: string | null | undefined): string | undefined {
    if (!path) return undefined;

    // Already a full URL
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }

    // Already has the prefix (local driver typical pattern)
    if (path.startsWith('/storage/')) {
        return path;
    }

    // Pass through S3 proxy URLs
    if (path.startsWith('/api/files/')) {
        return path;
    }

    // Handle local paths - assuming they need /storage/ prefix
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    return `/storage/${cleanPath}`;
}
