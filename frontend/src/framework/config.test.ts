import { describe, it, expect, vi } from 'vitest';

describe('config resolution', () => {
    it('should resolve the exported config values correctly with a mocked env', async () => {
        // Save the original MODE
        const originalMode = import.meta.env.MODE;

        // Mock import.meta.env.MODE
        import.meta.env.MODE = 'mocked-test-env';

        // Reset modules so that config.ts is re-evaluated with the new env mode
        vi.resetModules();
        const { config } = await import('./config');

        // Assert the environment mode
        expect(config.env).toBe('mocked-test-env');

        // Assert theme configurations
        expect(config.theme).toEqual({
            colorPrimary: '#3b82f6',
            borderRadius: 12,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
        });

        // Assert layout configurations
        expect(config.layout).toEqual({
            sidebarPosition: 'left',
        });

        // Assert feature flags
        expect(config.features).toEqual({
            enableComments: true,
            enableHistory: true,
        });

        // Restore the original MODE
        import.meta.env.MODE = originalMode;
    });
});
