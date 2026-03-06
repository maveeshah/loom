import { useParams } from 'react-router-dom';

export default function DocumentPreview() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="p-8 text-center bg-blue-50 border border-blue-100 rounded-lg">
            <h3 className="text-xl font-bold text-blue-900 mb-2">Secure Document Viewer</h3>
            <p className="text-blue-700 mb-6">
                This is a completely custom React component loaded dynamically via the YAML `overrides.frontend_preview` path!
            </p>

            <div className="max-w-md mx-auto aspect-[3/4] bg-white shadow-sm border border-slate-200 rounded flex items-center justify-center">
                <div className="text-slate-400 flex flex-col items-center">
                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Simulated PDF Viewer for Record #{id}</span>
                </div>
            </div>
        </div>
    );
}
