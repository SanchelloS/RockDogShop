import { Link, useLocation } from "react-router-dom";
import { Package, List, ShoppingCart, Users } from "lucide-react";

export default function AdminSidebar() {
  const location = useLocation();

  const links = [
    { to: "/admin", label: "Товары", icon: <Package size={18} /> },
    { to: "/admin/categories", label: "Категории", icon: <List size={18} /> },
    { to: "/admin/orders", label: "Заказы", icon: <ShoppingCart size={18} /> },
    { to: "/admin/users", label: "Пользователи", icon: <Users size={18} /> },
  ];

  return (
    <aside className="w-64 min-h-screen bg-linear-to-b from-[#111827] via-[#1e293b] to-[#0f172a] text-gray-100 flex flex-col p-5 shadow-2xl">
      {/* === Заголовок === */}
      <div className="text-center mb-10 select-none">
        <h2 className="text-2xl font-extrabold tracking-wide text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
          <span className="text-yellow-400">🛠</span>{" "}
          <span className="text-blue-400">RockDog</span>
        </h2>
        <p className="text-xs text-gray-400 mt-1 font-medium">Панель управления</p>
      </div>

      {/* === Навигация === */}
      <nav className="flex flex-col gap-2">
        {links.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium transition-all duration-300 relative overflow-hidden
                ${
                  active
                    ? "bg-linear-to-r from-blue-600 to-blue-500 text-white shadow-lg"
                    : "text-gray-200 hover:text-white hover:bg-white/10"
                }`}
            >
              <span
                className={`transition-transform duration-300 ${
                  active ? "text-white scale-110" : "text-blue-300 group-hover:text-blue-400"
                }`}
              >
                {link.icon}
              </span>
              <span
                className={`transition-all duration-300 ${
                  active ? "text-white" : "text-gray-200"
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* === Футер === */}
      <div className="mt-auto pt-8 border-t border-slate-700/60 text-center text-xs text-gray-500">
        © {new Date().getFullYear()} RockDog Admin
      </div>
    </aside>
  );
}
