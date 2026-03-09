import { createBrowserRouter, RouterProvider } from 'react-router';
import { DocumentListPage } from './pages/DocumentListPage';
import { DocumentDetailPage } from './pages/DocumentDetailPage';

const router = createBrowserRouter([
  { path: '/', element: <DocumentListPage /> },
  { path: '/document/:title', element: <DocumentDetailPage /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
