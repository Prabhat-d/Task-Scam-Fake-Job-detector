import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar.jsx';

/** Admin area: sidebar + white content. Rendered inside AppLayout (same ticker/navbar/footer). */
export default function AdminLayout() {
  return (
    <div className="flex-1 flex flex-col lg:flex-row">
      <AdminSidebar />
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Outlet />
      </div>
    </div>
  );
}
