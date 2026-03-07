import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

interface Schema {
    name: string;
    slug: string;
}

export default function Workspace() {
    const [schemas, setSchemas] = useState<Schema[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_URL || ''}/v1/portal/schemas`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch schemas');
                return res.json();
            })
            .then(data => setSchemas(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div className="p-8 text-gray-500">Loading workspace...</div>;
    if (error) return <div className="p-8 text-red-500 font-bold">Error: {error}</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-6">Welcome to Your Workspace</h1>
            <p className="text-gray-600 mb-8">Select a schema below to view and manage its records.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {schemas.map(schema => (
                    <Link
                        key={schema.slug}
                        to={`/portal/${schema.slug}`}
                        className="block p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-200"
                    >
                        <h2 className="text-xl font-semibold text-gray-800 capitalize mb-2">{schema.name}</h2>
                        <span className="text-blue-600 font-medium group-hover:underline">View Records &rarr;</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}
