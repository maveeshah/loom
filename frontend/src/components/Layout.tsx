import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api';

interface ModuleGroup {
    [group: string]: { name: string; slug: string }[];
}

interface LayoutProps {
    children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    const [modules, setModules] = useState<ModuleGroup>({});
    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        api.fetchModules().then(data => {
            setModules(data);
            // Open all groups by default
            const allOpen: Record<string, boolean> = {};
            Object.keys(data).forEach(g => (allOpen[g] = true));
            setOpenGroups(allOpen);
        });
    }, []);

    const toggleGroup = (group: string) =>
        setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));

    const isActive = (slug: string) => location.pathname.startsWith(`/app/${slug}`);

    return (
        <div className="flex min-h-screen w-screen bg-slate-50">
            {/* Sidebar */}
            <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: '#0f1623' }}>
                {/* Logo */}
                <div className="px-5 py-5 border-b border-slate-800">
                    <Link to="/" className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">V</span>
                        </div>
                        <span className="text-white font-semibold text-sm tracking-wide">Viemed</span>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                    {/* Dashboard link */}
                    <Link
                        to="/"
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${location.pathname === '/'
                            ? 'bg-blue-600/20 text-blue-400 font-medium'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        Dashboard
                    </Link>

                    {/* Module Groups */}
                    {Object.entries(modules).map(([group, items]) => (
                        <div key={group} className="pt-3">
                            <button
                                onClick={() => toggleGroup(group)}
                                className="flex items-center justify-between w-full px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 hover:text-slate-300 transition-colors"
                            >
                                {group}
                                <svg
                                    className={`w-3 h-3 transition-transform ${openGroups[group] ? '' : '-rotate-90'}`}
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {openGroups[group] && (
                                <div className="mt-1 space-y-0.5">
                                    {items.map(item => (
                                        <Link
                                            key={item.slug}
                                            to={`/app/${item.slug}`}
                                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${isActive(item.slug)
                                                ? 'bg-blue-600/20 text-blue-400 font-medium'
                                                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                                                }`}
                                        >
                                            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                                            {item.name}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Topbar */}
                <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-3 flex-shrink-0">
                    <button onClick={() => navigate(-1)} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div className="flex-1" />
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-700 text-xs font-semibold">U</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
