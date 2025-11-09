import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import AdminProducts from "../components/AdminProducts";
import AdminCategories from "../components/AdminCategories";
import AdminOrders from "../components/AdminOrders";
import AdminUsers from "../components/AdminUsers";

export default function AdminPanel() {
  return (
    <div className="flex min-h-screen bg-linear-to-br from-gray-50 via-blue-50/20 to-white">
      <AdminSidebar />
      <main className="flex-1 p-8 animate-fade-in">
        <div className="bg-white shadow-lg rounded-3xl p-6 border border-gray-100 min-h-[85vh]">
          <Routes>
            <Route path="/" element={<AdminProducts />} />
            <Route path="/categories" element={<AdminCategories />} />
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/users" element={<AdminUsers />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
