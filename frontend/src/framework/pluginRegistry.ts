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

// Lazy load convention-based custom views and auto-register them as fallback
// This improves initial bundle size by code-splitting custom plugins.
const customViewsRecord = import.meta.glob('../pages/custom/*.tsx');

for (const path in customViewsRecord) {
    // Extract module and ID roughly from the path for convention-based registration
    // e.g. ../pages/custom/PatientAnalytics.tsx
    const fileName = path.split('/').pop()?.replace('.tsx', '');

    if (fileName) {
        // We use React.lazy to dynamically import the component when it's rendered
        const LazyComponent = React.lazy(customViewsRecord[path] as any);

        // This is a naive registration based on file name.
        // In a real system, you might fetch a plugin manifest or rely on explicit registry calls.
        // We'll register it under a generic ID based on the filename for demonstration.
        // It's expected that blueprints using these components will specify id: "PatientAnalytics"
        pluginRegistry.registerView({
            module: '*', // Wilcard module or try to infer
            surface: 'tab',
            id: fileName,
            component: LazyComponent,
        });
    }
}
