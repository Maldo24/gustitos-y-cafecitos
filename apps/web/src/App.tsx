import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <header className="bg-white shadow px-6 py-4">
          <h1 className="text-2xl font-bold text-orange-600">Gustitos y Cafecitos ☕️</h1>
        </header>

        <main className="p-6 max-w-4xl mx-auto">
          <Routes>
            <Route path="/" element={Home()} />
            <Route path="/grupo/:slug" element={<h2>Vista de Grupo (Próximamente)</h2>} />
            <Route path="*" element={<h2>404 - No encontrado</h2>} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;