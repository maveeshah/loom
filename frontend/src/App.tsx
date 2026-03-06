import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import DynamicRoute from './pages/DynamicRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/app/:module" element={<DynamicRoute type="List" />} />
        <Route path="/app/:module/new" element={<DynamicRoute type="Form" />} />
        <Route path="/app/:module/:id" element={<DynamicRoute type="View" />} />
        <Route path="/app/:module/:id/edit" element={<DynamicRoute type="Form" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;