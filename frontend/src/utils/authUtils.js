/**
 * IMPORTANT: This file is used specifically for testing purposes with the global Jest binary,
 * as the current environment lacks support for running TypeScript tests.
 * This logic must be kept in sync with `authUtils.ts`.
 */

const hasPermission = (user, permission) => {
    if (!user) return false;
    const perms = user.role?.permissions || [];
    const permCodes = perms.map(p => p.code);

    if (permCodes.includes('*:*')) return true;
    if (permCodes.includes(permission)) return true;

    const [module] = permission.split(':');
    if (permCodes.includes(`${module}:*`)) return true;

    return false;
};

module.exports = { hasPermission };
