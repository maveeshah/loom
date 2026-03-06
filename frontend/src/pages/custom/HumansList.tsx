import Layout from '../../components/Layout';
import { useEffect, useState } from 'react';
import { api } from '../../api';

export default function HumansList() {
    const [stats, setStats] = useState<any[]>([]);

    useEffect(() => {
        api.fetchRecords('humans').then(setStats);
    }, []);

    return (
        <Layout>
            <div className="min-h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-900 to-black p-8 text-slate-200">
                <div className="max-w-4xl mx-auto space-y-12">

                    {/* Header Section */}
                    <header className="text-center space-y-6 py-12 border-b border-white/10 relative overflow-hidden">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                        <span className="text-6xl animate-pulse block mb-4">🌍 🛸</span>
                        <h1 className="text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">
                            A WARNING TO OBSERVERS
                        </h1>
                        <p className="text-xl text-slate-400 font-light max-w-2xl mx-auto leading-relaxed">
                            You have accessed the internal records of Species 001: <span className="text-cyan-400 font-semibold tracking-wide">HUMANITY</span>. Proceed with extreme caution.
                        </p>
                    </header>

                    {/* Threat Assessment Grid */}
                    <section className="grid md:grid-cols-2 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
                            <div className="w-12 h-12 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center text-2xl mb-4 border border-red-500/30">⚔️</div>
                            <h3 className="text-xl font-bold text-slate-200 mb-2">Relentless Adaptability</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Originating from a Class-9 Deathworld, Humans survive extremes of heat, cold, vacuum, and pressure. When presented with insurmountable odds, they invoke a localized phenomenon known as "spite" to bypass physical limitations.
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
                            <div className="w-12 h-12 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl mb-4 border border-amber-500/30">💥</div>
                            <h3 className="text-xl font-bold text-slate-200 mb-2">Weaponized Curiosity</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Humans split the fundamental building blocks of the universe primarily "to see what happens." They have weaponized math, sound, light, and their own biology. Do not leave unattended technology near a Human.
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
                            <div className="w-12 h-12 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-2xl mb-4 border border-emerald-500/30">🧬</div>
                            <h3 className="text-xl font-bold text-slate-200 mb-2">Pack Bonding</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                They will pack-bond with anything. Other species, inanimate objects, predatory apex fauna, and autonomous cleaning drones. Threatening a bonded entity triggers an immediate and catastrophic hostile response.
                            </p>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors duration-300">
                            <div className="w-12 h-12 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center text-2xl mb-4 border border-purple-500/30">🧠</div>
                            <h3 className="text-xl font-bold text-slate-200 mb-2">Unorthodox Logic</h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Human intelligence operates on highly irrational heuristics powered by a biological mechanism called "caffeine." They are masters of the universally feared tactic known as the "Hail Mary."
                            </p>
                        </div>
                    </section>

                    {/* Raw Internal Data Stream */}
                    <section className="mt-12">
                        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            Intercepted Biosignatures
                        </h2>
                        <div className="bg-black/50 border border-slate-800 rounded-xl p-4 font-mono text-sm shadow-2xl overflow-x-auto relative">
                            {/* Decorative scanline */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent bg-[length:100%_4px] opacity-20 pointer-events-none"></div>

                            <table className="w-full text-left border-collapse min-w-max relative z-10">
                                <thead>
                                    <tr className="border-b border-slate-700/50">
                                        <th className="py-3 px-4 text-cyan-600 font-semibold">TARGET_ID</th>
                                        <th className="py-3 px-4 text-cyan-600 font-semibold">DESIGNATION</th>
                                        <th className="py-3 px-4 text-cyan-600 font-semibold">LOCATION_VECTOR</th>
                                        <th className="py-3 px-4 text-cyan-600 font-semibold">THREAT_LEVEL</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/50">
                                    {stats.map((human, idx) => (
                                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                            <td className="py-3 px-4 text-slate-500">[{human.id || 'N/A'}]</td>
                                            <td className="py-3 px-4 text-slate-300 group-hover:text-white transition-colors">
                                                {human.last_name ? `${human.last_name}, ` : ''}{human.first_name || 'UNKNOWN'}
                                            </td>
                                            <td className="py-3 px-4 text-slate-400">{human.city || 'UNDEFINED'}, {human.country || 'TERRA'}</td>
                                            <td className="py-3 px-4">
                                                <span className="inline-block px-2 py-1 rounded bg-red-900/40 text-red-400 border border-red-500/20 text-xs font-bold tracking-widest">EXTREME</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {stats.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-slate-600 italic">
                                                Scanning matrix empty. No human targets currently in telemetry.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                </div>
            </div>
        </Layout>
    );
}
