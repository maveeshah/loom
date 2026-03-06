import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function SchemaListView() {
    const { schemaName } = useParams();
    const [items, setItems] = useState([]);

    useEffect(() => {
        fetch(`http://localhost:8010/v1/portal/${schemaName}`)
            .then(res => res.json())
            .then(data => setItems(data));
    }, [schemaName]);

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