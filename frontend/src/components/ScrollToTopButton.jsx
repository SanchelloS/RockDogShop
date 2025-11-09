import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  // следим за прокруткой
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) setVisible(true);
      else setVisible(false);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-50 p-3 rounded-full shadow-lg transition-all duration-300 
      ${
        visible
          ? "opacity-100 translate-y-0 bg-blue-600 hover:bg-blue-700 text-white"
          : "opacity-0 translate-y-10 pointer-events-none"
      }`}
      aria-label="Прокрутить вверх"
    >
      <ArrowUp size={22} />
    </button>
  );
}
