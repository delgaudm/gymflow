import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CategoryView from './pages/CategoryView';
import EntryView from './pages/EntryView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
        <Route path="/entry/:exerciseId" element={<EntryView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
