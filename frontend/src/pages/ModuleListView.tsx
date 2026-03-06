import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

export default function ModuleListView() {
    const { module } = useParams<{ module: string }>();
    const navigate = useNavigate();
    const [records, setRecords] = useState<any[]>([]);
    const [definition, setDefinition] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);

    const load = () => {
        if (!module) return;
        setLoading(true);
        setError(null);
        Promise.all([api.fetchRecords(module), api.fetchModuleDefinition(module)])
            .then(([recs, def]) => { setRecords(recs); setDefinition(def); })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, [module]);

    const handleDelete = async (id: number) => {
        if (!module || !window.confirm('Are you sure you want to delete this record?')) return;
        setDeletingId(id);
        try {
            await api.deleteRecord(module, id);
            setRecords(prev => prev.filter(r => r.id !== id));
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const columns = definition?.fields?.map((f: any) => f.name) ?? [];
    const displayName = definition?.name ?? module;

    if (loading) {
        return (
            <Layout>
                <div className="p-8 flex items-center gap-3 text-slate-400">
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Loading {module}...
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="p-8">
                    <div className="card p-6 border-red-200 bg-red-50">
                        <p className="text-red-600 font-medium">{error}</p>
                        <Link to="/" className="btn-ghost mt-3 text-red-600">← Back to Dashboard</Link>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{displayName}</h1>
                        <p className="text-sm text-slate-400 mt-0.5">{records.length} record{records.length !== 1 ? 's' : ''}</p>
                    </div>
                    <Link to={`/app/${module}/new`} className="btn-primary">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New {displayName}
                    </Link>
                </div>

                {/* Table */}
                <div className="card overflow-hidden">
                    {records.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-slate-400 text-sm">No records yet.</p>
                            <Link to={`/app/${module}/new`} className="btn-primary mt-4 inline-flex">
                                Create your first {displayName?.toLowerCase()}
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50">
                                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12">#</th>
                                        {columns.map((col: string) => (
                                            <th key={col} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                {col.replace(/_/g, ' ')}
                                            </th>
                                        ))}
                                        <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {records.map((record) => (
                                        <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-3 text-slate-400 font-mono text-xs">{record.id}</td>
                                            {columns.map((col: string) => (
                                                <td key={col} className="px-4 py-3 text-slate-700">
                                                    {record[col] === null || record[col] === undefined
                                                        ? <span className="text-slate-300">—</span>
                                                        : typeof record[col] === 'boolean'
                                                            ? <span className={`badge ${record[col] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{record[col] ? 'Yes' : 'No'}</span>
                                                            : String(record[col])}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Link to={`/app/${module}/${record.id}`} className="btn-ghost py-1 px-2">View</Link>
                                                    <Link to={`/app/${module}/${record.id}/edit`} className="btn-ghost py-1 px-2">Edit</Link>
                                                    <button
                                                        onClick={() => handleDelete(record.id)}
                                                        disabled={deletingId === record.id}
                                                        className="btn-danger py-1 px-2"
                                                    >
                                                        {deletingId === record.id ? '...' : 'Delete'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Layout>
    );
}
