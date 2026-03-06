import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { api } from '../api';
import type { ModuleDefinition } from '../api';

export default function Dashboard() {
    const [modules, setModules] = useState<Record<string, ModuleDefinition[]>>({});

    useEffect(() => {
        api.fetchModules().then(setModules);
    }, []);

    const allModules = Object.entries(modules).flatMap(([group, items]) =>
        items.filter((item) => item.ui?.show_in_sidebar !== false)
            .map((item) => ({ ...item, group }))
    );

    const groupColors: Record<string, string> = {
        Clinical: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        Admin: 'bg-violet-50 border-violet-200 text-violet-700',
    };

    const groupIcons: Record<string, string> = {
        Clinical: '🏥',
        Admin: '⚙️',
    };

    const fallbackColors = [
        'bg-blue-50 border-blue-200 text-blue-700',
        'bg-amber-50 border-amber-200 text-amber-700',
        'bg-pink-50 border-pink-200 text-pink-700',
        'bg-cyan-50 border-cyan-200 text-cyan-700',
        'bg-rose-50 border-rose-200 text-rose-700',
        'bg-indigo-50 border-indigo-200 text-indigo-700',
    ];

    const fallbackIcons = ['📦', '📊', '🧩', '🚀', '⚡', '🌟', '🎯', '🔥', '💎', '💡'];

    const getGroupColor = (group: string) => {
        if (groupColors[group]) return groupColors[group];
        let hash = 0;
        for (let i = 0; i < group.length; i++) hash = group.charCodeAt(i) + ((hash << 5) - hash);
        return fallbackColors[Math.abs(hash) % fallbackColors.length];
    };

    const getGroupIcon = (group: string) => {
        if (groupIcons[group]) return groupIcons[group];
        let hash = 0;
        for (let i = 0; i < group.length; i++) hash = group.charCodeAt(i) + ((hash << 5) - hash);
        return fallbackIcons[Math.abs(hash) % fallbackIcons.length];
    };

    return (
        <Layout>
            <div className="p-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500 mt-1">Select a module to view and manage records.</p>
                </div>

                {/* Module Groups */}
                {Object.entries(modules).map(([group, items]) => {
                    const visibleItems = items.filter(item => item.ui?.show_in_sidebar !== false);
                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group} className="mb-8">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-lg">{getGroupIcon(group)}</span>
                                <h2 className="text-base font-semibold text-slate-700">{group}</h2>
                                <span className="badge bg-slate-100 text-slate-500">{visibleItems.length}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {visibleItems.map(item => (
                                    <Link
                                        key={item.slug}
                                        to={`/app/${item.slug}`}
                                        className="card p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 group cursor-pointer"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className={`badge border ${getGroupColor(group)}`}>
                                                {group}
                                            </span>
                                            <svg className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </div>
                                        <h3 className="text-base font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                                            {item.name}
                                        </h3>
                                        <p className="text-xs text-slate-400 mt-1">View and manage {item.name.toLowerCase()} records</p>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {allModules.length === 0 && (
                    <div className="card p-12 text-center">
                        <p className="text-slate-400">No modules found. Add a YAML blueprint to get started.</p>
                    </div>
                )}
            </div>
        </Layout>
    );
}
