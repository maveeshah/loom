import { lazy, Suspense, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ModuleListView from './ModuleListView';
import RecordForm from './RecordForm';
import RecordView from './RecordView';
import { api } from '../api';
import type { ModuleDefinition } from '../api';

// Pre-scan all custom views. Vite will bundle these as separate chunks.
// Note: We need to include subdirectories if custom views are mapped loosely
const customViews = import.meta.glob(['./custom/*.tsx', './custom/**/*.tsx']);

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

    // 1. Check if the YAML explicitly defines a frontend override
    let overridePath: string | undefined;
    if (type === 'View' && definition?.overrides?.frontend_view) {
        // e.g. "pages/custom/PatientView.tsx" -> we map to "./custom/PatientView.tsx"
        // since import.meta.glob is relative to this file's folder (pages/)
        overridePath = definition.overrides.frontend_view.replace('pages/', './');
    }

    // 2. Fallback to the old implicit naming convention (e.g. ./custom/PatientView.tsx)
    if (!overridePath) {
        const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
        overridePath = `./custom/${moduleName}${type}.tsx`;
    }

    // 3. If a matching file exists in Vite's glob, lazy load it
    if (overridePath && customViews[overridePath]) {
        const CustomComponent = lazy(customViews[overridePath] as any);
        return (
            <Suspense fallback={<div className="p-8 text-slate-400">Loading custom view...</div>}>
                <CustomComponent />
            </Suspense>
        );
    }

    // 4. Fallback to the generic generic UI
    if (type === 'List') return <ModuleListView />;
    if (type === 'Form') return <RecordForm />;
    if (type === 'View') return <RecordView />;

    return null;
}
