import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';
import type { ModuleDefinition } from '../api';

// Pre-scan all custom views for dynamic tab loading
const customViews = import.meta.glob(['./custom/*.tsx', './custom/**/*.tsx']);

function AssociationTab({ view, record, module }: { view: any, record: any, module: string }) {
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!view.target) return;
        setLoading(true);
        api.fetchRecords(view.target.toLowerCase(), { [`${module.toLowerCase()}_id`]: record.id })
            .then(setRecords)
            .finally(() => setLoading(false));
    }, [view, record, module]);

    if (!view.target) return <div>Invalid configuration: no target set.</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-slate-800">{view.name}</h3>
                <Link to={`/app/${view.target.toLowerCase()}/new?${module.toLowerCase()}_id=${record.id}`} className="btn-primary text-sm shrink-0">
                    Add {view.target}
                </Link>
            </div>
            {loading ? (
                <div className="p-8 text-center text-slate-400">Loading records...</div>
            ) : records.length > 0 ? (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-slate-600">ID</th>
                                <th className="px-4 py-3 font-semibold text-slate-600">Details</th>
                                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {records.map(r => (
                                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-4 py-3 text-slate-500 font-mono">#{r.id}</td>
                                    <td className="px-4 py-3 text-slate-800 truncate max-w-[300px]">
                                        {Object.entries(r).find(([k, v]) => typeof v === 'string' && !k.endsWith('_id') && k !== 'id')?.[1] as string || JSON.stringify(r).substring(0, 50)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <Link to={`/app/${view.target.toLowerCase()}/${r.id}`} className="text-blue-600 font-medium hover:text-blue-800">View</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
                    <p className="text-slate-400">No associated {view.target} records found.</p>
                </div>
            )}
        </div>
    );
}

function CommentsTab({ record, module }: { record: any, module: string }) {
    const [comments, setComments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newComment, setNewComment] = useState("");

    const loadComments = () => {
        setLoading(true);
        api.fetchRecords('comment', { model_name: module, record_id: record.id })
            .then(setComments)
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadComments(); }, [record, module]);

    const handlePost = async () => {
        if (!newComment.trim()) return;
        try {
            await api.createRecord('comment', {
                model_name: module,
                record_id: record.id,
                content: newComment,
                author: "Demo User"
            });
            setNewComment("");
            loadComments();
        } catch (e: any) { alert("Failed to post: " + e.message); }
    };

    return (
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6">Discussion</h3>
            <div className="flex gap-4 mb-8">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-bold">U</span>
                </div>
                <div className="flex-1">
                    <textarea
                        className="input mb-3 bg-slate-50 border-slate-200 min-h-[100px] w-full p-3 rounded border"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button onClick={handlePost} className="btn-primary">Post Comment</button>
                    </div>
                </div>
            </div>
            <div className="space-y-6">
                {loading ? <div className="text-slate-400">Loading...</div> : comments.map(c => (
                    <div key={c.id} className="flex gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            <span className="text-slate-600 font-bold">{c.author.charAt(0)}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold text-slate-800">{c.author}</span>
                                <span className="text-xs text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-600 text-sm whitespace-pre-wrap">{c.content}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function HistoryTab({ record, module }: { record: any, module: string }) {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.fetchRecords('auditlog', { model_name: module, record_id: record.id })
            .then(data => setLogs(data.reverse()))
            .finally(() => setLoading(false));
    }, [record, module]);

    return (
        <div>
            <h3 className="text-lg font-bold text-slate-800 mb-6">Audit Trail</h3>
            <div className="relative pl-4 border-l-2 border-slate-100 space-y-6">
                {loading ? <div className="text-slate-400">Loading logs...</div> : logs.length === 0 ? <div className="text-slate-400">No history found.</div> : logs.map(log => (
                    <div key={log.id} className="relative shadow-sm py-2 px-3 bg-slate-50 border border-slate-100 rounded-lg">
                        <div className="absolute -left-[23px] top-4 w-3 h-3 bg-slate-300 rounded-full ring-4 ring-white" />
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-bold text-slate-800 capitalize">{log.action}</p>
                            <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                        <p className="text-xs text-slate-500 mb-2">by {log.actor}</p>
                        {log.changes && (
                            <pre className="text-[10px] bg-slate-800 text-slate-300 p-2 rounded overflow-x-auto">
                                {JSON.stringify(JSON.parse(log.changes), null, 2)}
                            </pre>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function RecordView() {
    const { module, id } = useParams<{ module: string; id: string }>();
    const navigate = useNavigate();
    const [record, setRecord] = useState<any>(null);
    const [definition, setDefinition] = useState<ModuleDefinition | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Tab state
    const [activeTab, setActiveTab] = useState<string>('Dashboard');

    useEffect(() => {
        if (!module || !id) return;
        setLoading(true);
        Promise.all([api.fetchRecord(module, Number(id)), api.fetchModuleDefinition(module)])
            .then(([rec, def]) => {
                setRecord(rec);
                setDefinition(def);
                // Set default tab based on definition
                if (def.ui?.default_view) {
                    const view = def.views?.find((v: any) => v.type === def.ui?.default_view) || def.views?.[0];
                    if (view) setActiveTab(view.name);
                } else if (def.views?.length > 0) {
                    setActiveTab(def.views[0].name);
                }
            })
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
    const fields: any[] = (definition as any)?.fields ?? [];
    const views = definition?.views ?? [];

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

    const currentView = views.find(v => v.name === activeTab);

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

                {/* Main Content Area: Split into Top (Core Details) and Bottom (Tabs) */}

                {/* 1. Core Details Card */}
                <div className="card overflow-hidden mb-8">
                    <dl className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100">
                        {fields.slice(0, 4).map((field: any) => (
                            <div key={field.name} className="px-5 py-3.5">
                                <dt className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">
                                    {field.name.replace(/_/g, ' ')}
                                </dt>
                                <dd className="text-sm text-slate-800 font-semibold">
                                    {record[field.name] === null || record[field.name] === undefined
                                        ? <span className="text-slate-300 font-normal">Not set</span>
                                        : field.type === 'Boolean'
                                            ? <span className={`badge ${record[field.name] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{record[field.name] ? 'Yes' : 'No'}</span>
                                            : String(record[field.name])}
                                </dd>
                            </div>
                        ))}
                    </dl>
                    {/* Render the rest of the fields normally if there are many */}
                    {fields.length > 4 && (
                        <dl className="divide-y divide-slate-100">
                            {fields.slice(4).map((field: any) => (
                                <div key={field.name} className="flex px-5 py-3.5">
                                    <dt className="w-48 flex-shrink-0 text-sm font-medium text-slate-500 capitalize">
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
                    )}
                </div>

                {/* 2. Dynamic Tabs */}
                {views.length > 0 && (
                    <div className="mt-8">
                        <div className="flex items-center gap-6 border-b border-slate-200 mb-6 px-1">
                            {views.map((view) => (
                                <button
                                    key={view.name}
                                    onClick={() => setActiveTab(view.name)}
                                    className={`pb-3 text-sm font-medium border-b-2 transition-colors duration-200 ${activeTab === view.name
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                                        }`}
                                >
                                    {view.name}
                                </button>
                            ))}
                        </div>

                        {/* 3. Tab Content Area */}
                        <div className="bg-white rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.1)] border border-slate-200 min-h-[300px] p-6">
                            {!currentView && (
                                <p className="text-slate-500 text-center py-12">Select a tab to view content.</p>
                            )}

                            {currentView?.type === 'summary' && (
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">{currentView.name}</h3>
                                    <p className="text-slate-500">Summary view of {displayName} record #{record.id}.</p>
                                    {/* Additional generic summary widgets could go here */}
                                </div>
                            )}

                            {currentView?.type === 'association' && (
                                <AssociationTab view={currentView} record={record} module={module!} />
                            )}

                            {currentView?.type === 'comments' && (
                                <CommentsTab record={record} module={module!} />
                            )}

                            {currentView?.type === 'history' && (
                                <HistoryTab record={record} module={module!} />
                            )}

                            {currentView?.type === 'custom' && (() => {
                                const overrideKey = `frontend_${currentView.name.toLowerCase().replace(/ /g, '_')}`;
                                const overridePathRaw = (definition?.overrides as any)?.[overrideKey];
                                const overridePath = overridePathRaw ? overridePathRaw.replace('pages/', './') : undefined;

                                if (overridePath && customViews[overridePath]) {
                                    const CustomTabComponent = lazy(customViews[overridePath] as any);
                                    return (
                                        <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading custom tab...</div>}>
                                            <CustomTabComponent />
                                        </Suspense>
                                    );
                                }

                                return (
                                    <div className="p-8 text-center bg-indigo-50 border border-indigo-100 rounded-lg">
                                        <p className="text-indigo-600 font-medium">Custom Component Slot</p>
                                        <p className="text-sm text-indigo-400 mt-1">
                                            Dynamically imports `<span className="font-mono">{overridePathRaw || definition?.overrides?.frontend_analytics || 'Unknown override path'}</span>`
                                        </p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
