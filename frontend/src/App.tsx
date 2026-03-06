import { BrowserRouter, Routes, Route } from 'react-router-dom';
import SchemaListView from './pages/SchemaListView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* This matches /portal/patient, /portal/user, etc. */}
        <Route path="/portal/:schemaName" element={<SchemaListView />} />
      </Routes>
    </BrowserRouter>
  );
}