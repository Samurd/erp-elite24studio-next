export interface CloudFile {
    id: number;
    name: string;
    size: number | null;
    mimeType: string | null;
    url: string;
    readable_size: string;
    created_at: string;
    updated_at: string;
    permission?: 'view' | 'edit';
    ownerName?: string;
}

export interface CloudFolder {
    id: number;
    name: string;
    created_at: string;
    updated_at: string;
    permission?: 'view' | 'edit';
    ownerName?: string;
}

export interface ShareInfo {
    sharedBy: string;
    sharedByImage: string | null;
    permission: 'view' | 'edit';
    isOwner: boolean;
    shareType: 'folder' | 'file';
}

export interface CloudData {
    folders: CloudFolder[];
    files: CloudFile[];
    sharedFolders: CloudFolder[];
    sharedFiles: CloudFile[];
    currentFolder: CloudFolder | null;
    breadcrumbs: CloudFolder[];
    canCreate: boolean;
    shareInfo?: ShareInfo; // Only present in share views
}

export interface CloudItem {
    id: number;
    type: 'file' | 'folder';
    name: string;
    permission?: 'view' | 'edit';
}
