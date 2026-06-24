import { Link, useLocation } from "react-router-dom";
import {
  Package,
  List,
  ShoppingCart,
  Users,
  BarChart3,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";

export default function AdminSidebar() {
  const location = useLocation();

  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const links = [
    {
      to: "/admin",
      label: "Товары",
      icon: <Package size={18} />,
    },
    {
      to: "/admin/categories",
      label: "Категории",
      icon: <List size={18} />,
    },
    {
      to: "/admin/orders",
      label: "Заказы",
      icon: <ShoppingCart size={18} />,
    },
    {
      to: "/admin/users",
      label: "Пользователи",
      icon: <Users size={18} />,
    },
    {
      to: "/admin/reports",
      label: "Отчёты",
      icon: <BarChart3 size={18} />,
    },
  ];

  const SidebarLinks = () => (
    <nav className="flex flex-col gap-2">
      {links.map((link) => {
        const active = location.pathname === link.to;

        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={() => setIsMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
              ${
                active
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-white/10 hover:text-white"
              }`}
          >
            {link.icon}

            <span className="font-medium text-sm">
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden lg:flex w-64 min-h-screen sticky top-0 bg-gradient-to-b from-[#111827] via-[#1e293b] to-[#0f172a] text-white flex-col p-5">
        <div className="mb-8">
<h1 className="text-2xl font-bold text-white drop-shadow-md">🛠 RockDog</h1>

          <p className="text-sm text-gray-400 mt-1">
            Панель управления
          </p>
        </div>

        <SidebarLinks />

        <div className="mt-auto pt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} RockDog
        </div>
      </aside>

      {/* FLOATING MOBILE BUTTON */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center active:scale-95 transition"
      >
        <Menu size={26} />
      </button>

      {/* MOBILE MODAL MENU */}
      {isMobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end justify-center lg:hidden p-4">
            <div className="w-full max-w-xs bg-[#111827] rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700">
                <div>
                  <h2 className="text-white text-xl font-bold">
                    🛠 RockDog
                  </h2>

                  <p className="text-sm text-gray-400">
                    Админ панель
                  </p>
                </div>

                <button
                  onClick={() =>
                    setIsMobileOpen(false)
                  }
                  className="text-gray-400 hover:text-white transition"
                >
                  <X size={24} />
                </button>
              </div>

              {/* Navigation */}
              <div className="p-4 max-h-[70vh] overflow-y-auto">
                <SidebarLinks />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}