import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

export default function RecordView() {
    const { module, id } = useParams<{ module: string; id: string }>();
    const navigate = useNavigate();
    const [record, setRecord] = useState<any>(null);
    const [definition, setDefinition] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        if (!module || !id) return;
        Promise.all([api.fetchRecord(module, Number(id)), api.fetchModuleDefinition(module)])
            .then(([rec, def]) => { setRecord(rec); setDefinition(def); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [module, id]);

    const handleDelete = async () => {
        if (!module || !id || !window.confirm('Delete this record? This cannot be undone.')) return;
        setDeleting(true);
        try {
            await api.deleteRecord(module, Number(id));
            navigate(`/app/${module}`);
        } catch (err: any) {
            alert(err.message);
            setDeleting(false);
        }
    };

    const displayName = definition?.name ?? module;
    const fields: any[] = definition?.fields ?? [];

    if (loading) return <Layout><div className="p-8 text-slate-400">Loading...</div></Layout>;

    if (error || !record) {
        return (
            <Layout>
                <div className="p-8">
                    <div className="card p-6 border-red-200 bg-red-50">
                        <p className="text-red-600 font-medium">{error ?? 'Record not found'}</p>
                        <Link to={`/app/${module}`} className="btn-ghost mt-3">← Back</Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link to={`/app/${module}`} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{displayName} #{record.id}</h1>
                            <p className="text-sm text-slate-400 mt-0.5">Record details</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link to={`/app/${module}/${id}/edit`} className="btn-ghost">Edit</Link>
                        <button onClick={handleDelete} disabled={deleting} className="btn-danger">
                            {deleting ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>

                {/* Detail Card */}
                <div className="card overflow-hidden">
                    <dl className="divide-y divide-slate-100">
                        {fields.map((field: any) => (
                            <div key={field.name} className="flex px-5 py-3.5">
                                <dt className="w-40 flex-shrink-0 text-sm font-medium text-slate-500 capitalize">
                                    {field.name.replace(/_/g, ' ')}
                                </dt>
                                <dd className="flex-1 text-sm text-slate-800 font-medium">
                                    {record[field.name] === null || record[field.name] === undefined
                                        ? <span className="text-slate-300">Not set</span>
                                        : field.type === 'Boolean'
                                            ? <span className={`badge ${record[field.name] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{record[field.name] ? 'Yes' : 'No'}</span>
                                            : String(record[field.name])}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </Layout>
    );
}
