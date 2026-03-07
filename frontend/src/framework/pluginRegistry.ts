import React from 'react';

export interface ViewRegistration {
    module: string;    // slug of the module (e.g., "patient")
    surface: 'tab' | 'view' | 'widget' | 'form';
    id: string;        // specific id (e.g., "timeline" or "summary")
    component: React.ComponentType<any>;
}

class PluginRegistry {
    private views: Map<string, React.ComponentType<any>> = new Map();

    private getCacheKey(module: string, surface: string, id: string) {
        return `${module}:${surface}:${id}`;
    }

    registerView(registration: ViewRegistration) {
        const key = this.getCacheKey(registration.module, registration.surface, registration.id);
        this.views.set(key, registration.component);
    }

    getView(module: string, surface: string, id: string): React.ComponentType<any> | undefined {
        return this.views.get(this.getCacheKey(module, surface, id));
    }
}

export const pluginRegistry = new PluginRegistry();

// Eager load convention-based custom views and auto-register them as fallback
// This facilitates incremental migration from convention to explicit config.
const customViewsRecord = import.meta.glob('../pages/custom/*.tsx', { eager: true });

for (const path in customViewsRecord) {
    const mod = customViewsRecord[path] as any;
    // Expected to export default component, and optionally a pluginConfig
    if (mod.default && mod.pluginConfig) {
        pluginRegistry.registerView({
            ...mod.pluginConfig,
            component: mod.default,
        });
    }
}
