import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import CategoryView from './pages/CategoryView';
import EntryView from './pages/EntryView';
import AdminHome from './pages/AdminHome';
import ManageCategories from './pages/ManageCategories';
import ManageExercises from './pages/ManageExercises';
import ViewLogs from './pages/ViewLogs';

function App() {
  return (
    <BrowserRouter basename="/gym">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
        <Route path="/entry/:exerciseId" element={<EntryView />} />
        <Route path="/admin" element={<AdminHome />} />
        <Route path="/admin/categories" element={<ManageCategories />} />
        <Route path="/admin/exercises" element={<ManageExercises />} />
        <Route path="/admin/logs" element={<ViewLogs />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
