const { hasPermission } = require('./authUtils');

describe('hasPermission', () => {
    const userWithSpecificPerm = {
        role: {
            permissions: [{ code: 'user:read' }]
        }
    };

    const userWithGlobalWildcard = {
        role: {
            permissions: [{ code: '*:*' }]
        }
    };

    const userWithModuleWildcard = {
        role: {
            permissions: [{ code: 'user:*' }]
        }
    };

    const userWithNoPerms = {
        role: {
            permissions: []
        }
    };

    test('returns false when user is null', () => {
        expect(hasPermission(null, 'user:read')).toBe(false);
    });

    test('returns true for exact permission match', () => {
        expect(hasPermission(userWithSpecificPerm, 'user:read')).toBe(true);
    });

    test('returns false for mismatched permission', () => {
        expect(hasPermission(userWithSpecificPerm, 'user:write')).toBe(false);
    });

    test('returns true for global wildcard *:*', () => {
        expect(hasPermission(userWithGlobalWildcard, 'any:permission')).toBe(true);
    });

    test('returns true for module wildcard (e.g., user:*)', () => {
        expect(hasPermission(userWithModuleWildcard, 'user:read')).toBe(true);
        expect(hasPermission(userWithModuleWildcard, 'user:write')).toBe(true);
        expect(hasPermission(userWithModuleWildcard, 'user:anything')).toBe(true);
    });

    test('returns false for module wildcard mismatch', () => {
        expect(hasPermission(userWithModuleWildcard, 'other:read')).toBe(false);
    });

    test('returns false when user has no permissions', () => {
        expect(hasPermission(userWithNoPerms, 'user:read')).toBe(false);
    });
});
