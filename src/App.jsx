import { Routes, Route } from 'react-router-dom';
import { AuctionProvider } from './context/AuctionContext';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import CaptainDashboard from './pages/CaptainDashboard';
import DisplayScreen from './pages/DisplayScreen';

function App() {
  return (
    <AuctionProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/captain/:teamId" element={<CaptainDashboard />} />
        <Route path="/display" element={<DisplayScreen />} />
      </Routes>
    </AuctionProvider>
  );
}

export default App;
