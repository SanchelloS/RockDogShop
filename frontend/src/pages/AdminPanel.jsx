import { Routes, Route } from "react-router-dom";

import Header from "../components/Header";
import Footer from "../components/Footer";

import AdminSidebar from "../components/AdminSidebar";

import AdminProducts from "../components/AdminProducts";
import AdminCategories from "../components/AdminCategories";
import AdminOrders from "../components/AdminOrders";
import AdminUsers from "../components/AdminUsers";
import AdminReports from "../components/AdminReports";

export default function AdminPanel() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* HEADER */}
      <Header />

      {/* CONTENT */}
      <div className="flex flex-1">
        {/* SIDEBAR */}
        <AdminSidebar />

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-x-hidden">
          <div className="p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="bg-white rounded-2xl shadow-sm min-h-[calc(100vh-180px)] p-3 sm:p-4 md:p-6 overflow-x-auto">
              <Routes>
                <Route
                  path="/"
                  element={<AdminProducts />}
                />

                <Route
                  path="/categories"
                  element={<AdminCategories />}
                />

                <Route
                  path="/orders"
                  element={<AdminOrders />}
                />

                <Route
                  path="/users"
                  element={<AdminUsers />}
                />

                <Route
                  path="/reports"
                  element={<AdminReports />}
                />
              </Routes>
            </div>
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}