import { useParams } from 'react-router-dom';

export default function PatientAnalytics() {
    const { id } = useParams<{ id: string }>();

    return (
        <div className="p-8 text-center bg-indigo-50 border border-indigo-200 rounded-lg">
            <h3 className="text-xl font-bold text-indigo-800 mb-2">Patient Analytics Dashboard</h3>
            <p className="text-indigo-600">
                This is a custom React component injected directly into the tab structure!
            </p>
            <p className="text-sm text-indigo-400 mt-4">
                Currently viewing analytics for Patient ID: <strong>{id}</strong>
            </p>
        </div>
    );
}
