import { lazy, Suspense } from 'react';
import { useParams } from 'react-router-dom';
import ModuleListView from './ModuleListView';
import RecordForm from './RecordForm';
import RecordView from './RecordView';

// Pre-scan all custom views. Vite will bundle these as separate chunks.
const customViews = import.meta.glob('./custom/*.tsx');

interface Props {
    type: 'List' | 'Form' | 'View';
}

export default function DynamicRoute({ type }: Props) {
    const { module } = useParams<{ module: string }>();

    if (!module) return null;

    // Capitalize for matching component filenames (e.g., 'patient' -> 'Patient')
    const moduleName = module.charAt(0).toUpperCase() + module.slice(1);
    const customPath = `./custom/${moduleName}${type}.tsx`;

    // If the developer created a matching file, lazy load it
    if (customViews[customPath]) {
        const CustomComponent = lazy(customViews[customPath] as any);
        return (
            <Suspense fallback={<div className="p-8 text-slate-400">Loading custom view...</div>}>
                <CustomComponent />
            </Suspense>
        );
    }

    // Fallback to the generic generic UI
    if (type === 'List') return <ModuleListView />;
    if (type === 'Form') return <RecordForm />;
    if (type === 'View') return <RecordView />;

    return null;
}
