import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'
import Navbar from './components/Navbar';

function App() {
  return (
    <BrowserRouter>
      <div className="h-screen flex flex-col bg-gray-50 text-gray-900 font-sans">
        <Navbar></Navbar>

        <main className="mx-auto w-full flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/grupo/:slug" element={<h2>Vista de Grupo (Próximamente)</h2>} />
            <Route path="*" element={<h2>404 - No encontrado</h2>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;