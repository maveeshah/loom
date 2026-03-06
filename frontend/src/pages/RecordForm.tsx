import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';

const FIELD_TYPE_MAP: Record<string, string> = {
    String: 'text',
    Integer: 'number',
    Float: 'number',
    Boolean: 'checkbox',
    DateTime: 'datetime-local',
};

export default function RecordForm() {
    const { module, id } = useParams<{ module: string; id?: string }>();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [definition, setDefinition] = useState<any>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!module) return;
        const loads: Promise<any>[] = [api.fetchModuleDefinition(module)];
        if (isEditing && id) loads.push(api.fetchRecord(module, Number(id)));

        Promise.all(loads)
            .then(([def, existing]) => {
                setDefinition(def);
                if (existing) {
                    // Pre-fill form without id
                    const { id: _, ...rest } = existing;
                    setFormData(rest);
                } else {
                    // Set defaults from blueprint
                    const defaults: Record<string, any> = {};
                    def.fields?.forEach((f: any) => {
                        const isAutomatic = f.default === 'now()' || f.onupdate;
                        if (!isAutomatic) {
                            if (f.default !== undefined) {
                                defaults[f.name] = f.default;
                            } else {
                                defaults[f.name] = f.type === 'Boolean' ? false : '';
                            }
                        }
                    });
                    setFormData(defaults);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [module, id]);

    const handleChange = (field: any, value: any) => {
        setFormData(prev => ({ ...prev, [field.name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!module) return;
        setSaving(true);
        setError(null);
        try {
            if (isEditing && id) {
                await api.updateRecord(module, Number(id), formData);
            } else {
                await api.createRecord(module, formData);
            }
            navigate(`/app/${module}`);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const displayName = definition?.name ?? module;

    if (loading) {
        return (
            <Layout>
                <div className="p-8 text-slate-400">Loading...</div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-8 max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link to={`/app/${module}`} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">
                            {isEditing ? `Edit ${displayName}` : `New ${displayName}`}
                        </h1>
                        <p className="text-sm text-slate-400 mt-0.5">
                            {isEditing ? `Editing record #${id}` : `Create a new ${displayName?.toLowerCase()} record`}
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="card p-6 space-y-5">
                    {definition?.fields?.map((field: any) => {
                        const inputType = FIELD_TYPE_MAP[field.type] || 'text';
                        const isAutomatic = field.default === 'now()' || field.onupdate;

                        if (isAutomatic) return null; // Skip auto-managed fields

                        return (
                            <div key={field.name}>
                                <label className="form-label capitalize">
                                    {field.name.replace(/_/g, ' ')}
                                    {field.required && <span className="text-red-500 ml-1">*</span>}
                                </label>

                                {inputType === 'checkbox' ? (
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={!!formData[field.name]}
                                            onChange={e => handleChange(field, e.target.checked)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-600">
                                            {formData[field.name] ? 'Yes' : 'No'}
                                        </span>
                                    </label>
                                ) : (
                                    <input
                                        type={inputType}
                                        value={formData[field.name] ?? ''}
                                        onChange={e => handleChange(field, inputType === 'number' ? Number(e.target.value) : e.target.value)}
                                        required={field.required}
                                        className="form-input"
                                        placeholder={`Enter ${field.name.replace(/_/g, ' ')}`}
                                    />
                                )}
                            </div>
                        );
                    })}

                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                        <Link to={`/app/${module}`} className="btn-ghost">Cancel</Link>
                        <button type="submit" disabled={saving} className="btn-primary">
                            {saving ? 'Saving...' : isEditing ? 'Save Changes' : `Create ${displayName}`}
                        </button>
                    </div>
                </form>
            </div>
        </Layout>
    );
}
