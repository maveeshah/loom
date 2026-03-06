import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ModuleListView from './pages/ModuleListView';
import RecordForm from './pages/RecordForm';
import RecordView from './pages/RecordView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/app/:module" element={<ModuleListView />} />
        <Route path="/app/:module/new" element={<RecordForm />} />
        <Route path="/app/:module/:id" element={<RecordView />} />
        <Route path="/app/:module/:id/edit" element={<RecordForm />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;