import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import UploadPage from './pages/UploadPage';
import MeetingDetail from './pages/MeetingDetail';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/upload" element={<UploadPage />} />
            <Route path="/meeting/:id" element={<MeetingDetail />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;