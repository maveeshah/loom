import { Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ModuleListView from './ModuleListView';
import RecordForm from './RecordForm';
import RecordView from './RecordView';
import { api } from '../api';
import type { ModuleDefinition } from '../api';
import { pluginRegistry } from '../framework/pluginRegistry';

interface Props {
    type: 'List' | 'Form' | 'View';
}

export default function DynamicRoute({ type }: Props) {
    const { module } = useParams<{ module: string }>();
    const [definition, setDefinition] = useState<ModuleDefinition | null>(null);
    const [loadingDef, setLoadingDef] = useState(true);

    useEffect(() => {
        if (!module) return;
        setLoadingDef(true);
        api.fetchModuleDefinition(module)
            .then(setDefinition)
            .catch(() => setDefinition(null))
            .finally(() => setLoadingDef(false));
    }, [module]);

    if (!module) return null;
    if (loadingDef) return <div className="p-8 text-slate-400">Loading route...</div>;

    // 1. Check if the YAML explicitly defines a frontend_view override
    // And query the explicit registry for it.
    let CustomComponent: React.ComponentType | undefined;

    // Explicit registry lookup (e.g. view ID passed in overrides)
    if (type === 'View' && definition?.overrides?.frontend_view) {
        CustomComponent = pluginRegistry.getView(module, 'view', definition.overrides.frontend_view) as React.ComponentType;
    }

    // 2. If an override was found in the explicit registry, or custom loaded fallback, render it
    if (CustomComponent) {
        return (
            <Suspense fallback={<div className="p-8 text-slate-400">Loading custom view...</div>}>
                <CustomComponent />
            </Suspense>
        );
    }

    // 3. Fallback to the generic UI for pages that aren't views but could be registered
    if (type === 'List') {
        const CustomList = pluginRegistry.getView(module, 'view', 'list') as React.ComponentType;
        if (CustomList) {
            return <Suspense fallback={<div>Loading list...</div>}><CustomList /></Suspense>;
        }
        return <ModuleListView />;
    }

    if (type === 'Form') {
        const CustomForm = pluginRegistry.getView(module, 'form', 'form') as React.ComponentType;
        if (CustomForm) {
            return <Suspense fallback={<div>Loading form...</div>}><CustomForm /></Suspense>;
        }
        return <RecordForm />;
    }

    if (type === 'View') return <RecordView />;

    return null;
}
