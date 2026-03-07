import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function SchemaListView() {
    const { schemaName } = useParams();
    const [items, setItems] = useState([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch(`${import.meta.env.VITE_API_URL || ''}/v1/portal/${schemaName}`)
            .then(async res => {
                if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.detail || `Schema '${schemaName}' not found`);
                }
                return res.json();
            })
            .then(data => setItems(data))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [schemaName]);

    if (loading) {
        return <div className="p-8 text-gray-500">Loading {schemaName}...</div>;
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="text-red-500 font-bold text-xl">{error}</div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold capitalize">{schemaName} List</h1>
            <div className="mt-4 border rounded">
                {items.map((item: any) => (
                    <div key={item.id} className="p-4 border-b last:border-0">
                        {/* Dynamically render all keys like Frappe's List View */}
                        {JSON.stringify(item)}
                    </div>
                ))}
            </div>
        </div>
    );
}