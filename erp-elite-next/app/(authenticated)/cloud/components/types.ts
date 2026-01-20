export interface CloudFile {
    id: number;
    name: string;
    size: number | null;
    mimeType: string | null;
    url: string;
    readable_size: string;
    created_at: string;
    updated_at: string;
}

export interface CloudFolder {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface CloudData {
    folders: CloudFolder[];
    files: CloudFile[];
    currentFolder: CloudFolder | null;
    breadcrumbs: CloudFolder[];
    canCreate: boolean;
}

export interface CloudItem {
    id: number;
    type: 'file' | 'folder';
    name: string;
}
