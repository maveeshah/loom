/**
 * IMPORTANT: This file is used for production.
 * Any changes here must be mirrored in `authUtils.js` to ensure the tests pass,
 * because the current environment does not support TypeScript testing with Jest.
 */

export interface Permission {
    id: number;
    code: string;
    name: string;
    module: string;
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: {
        name: string;
        permissions: Permission[];
    };
}

export const hasPermission = (user: User | null, permission: string): boolean => {
    if (!user) return false;
    const perms = user.role?.permissions || [];
    const permCodes = perms.map(p => p.code);

    if (permCodes.includes('*:*')) return true;
    if (permCodes.includes(permission)) return true;

    const [module] = permission.split(':');
    if (permCodes.includes(`${module}:*`)) return true;

    return false;
};
