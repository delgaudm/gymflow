import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CategoryView from './pages/CategoryView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
