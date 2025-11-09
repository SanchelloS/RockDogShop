import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProductDetails from "./pages/ProductDetails";
import AdminPanel from "./pages/AdminPanel";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProtectedRoute from "./components/ProtectedRoute";
import UserOrders from "./pages/UserOrders";
import Profile from "./pages/Profile"; // ✅ добавляем
import { Toaster } from "react-hot-toast";
import ScrollToTopButton from "./components/ScrollToTopButton";

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-gray-50">
        <Navbar />

        <main
          className="grow w-full transition-all duration-500 ease-out"
          style={{
            minHeight: "calc(100vh - 200px)",
          }}
        >
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<UserOrders />} />
            <Route path="/profile" element={<Profile />} /> {/* ✅ вот это добавляем */}
            <Route
              path="/admin/*"
              element={
                <ProtectedRoute role="Admin">
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>

        <footer className="bg-gray-900 text-gray-300 py-10 transition-all duration-500 ease-out">
          <div className="container text-center animate-fade-in">
            <p className="text-sm">
              © {new Date().getFullYear()} RockDog Store — Все права защищены.
            </p>
            <p className="text-xs mt-2 opacity-70">
              Сделано с ❤️ для поклонников вселенной RockDog
            </p>
          </div>
        </footer>
      </div>

      <ScrollToTopButton />

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#333",
            borderRadius: "10px",
            padding: "12px 16px",
            boxShadow:
              "0 4px 12px rgba(0, 0, 0, 0.15), 0 0 2px rgba(0, 0, 0, 0.05)",
            fontSize: "15px",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
    </Router>
  );
}
