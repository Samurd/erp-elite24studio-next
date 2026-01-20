/**
 * Check if user has a specific permission
 */
export function hasPermission(
    userPermissions: string[],
    required: string | string[]
): boolean {
    if (Array.isArray(required)) {
        return required.some(p => userPermissions.includes(p));
    }
    return userPermissions.includes(required);
}

/**
 * Check if user has ALL specified permissions
 */
export function hasAllPermissions(
    userPermissions: string[],
    required: string[]
): boolean {
    return required.every(p => userPermissions.includes(p));
}

/**
 * Check if user can perform action on area
 * Example: canArea(permissions, 'view', 'usuarios') checks for 'usuarios.view'
 */
export function canArea(
    userPermissions: string[],
    action: 'view' | 'create' | 'update' | 'delete',
    area: string
): boolean {
    const permissionSlug = `${area}.${action}`;
    return userPermissions.includes(permissionSlug);
}
