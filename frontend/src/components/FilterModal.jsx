import { createPortal } from "react-dom";
import { X, SlidersHorizontal } from "lucide-react";
import { useEffect } from "react";

export default function FilterModal({
  isOpen,
  onClose,
  children,
  activeFiltersCount,
  filteredProductsCount,
  onReset,
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
    } else {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const modalRoot = document.getElementById("modal-root");

  if (!modalRoot) return null;

  return createPortal(
    <div
      className="
        absolute
        inset-0
        z-[999999]
        flex
        items-center
        justify-center
        p-4
      "
      style={{
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
        pointerEvents: "auto",
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative
          w-full
          max-w-xl
          bg-white
          rounded-2xl
          shadow-2xl
          overflow-hidden
          animate-popup
        "
        style={{
          maxHeight: "90dvh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white">
          <div>
            <h2 className="text-lg font-bold flex items-center gap-2 text-gray-800">
              <SlidersHorizontal size={20} />
              Фильтры
            </h2>

            {activeFiltersCount > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Активных фильтров: {activeFiltersCount}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              p-2
              rounded-full
              hover:bg-gray-100
              transition
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto px-5 py-4"
          style={{
            maxHeight: "calc(90dvh - 140px)",
          }}
        >
          {children}

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={() => {
                onReset();
                onClose();
              }}
              className="
                w-full
                mt-6
                py-3
                rounded-xl
                bg-gray-100
                hover:bg-gray-200
                text-gray-700
                font-medium
                transition
              "
            >
              Сбросить фильтры
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 p-4 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="
              w-full
              py-3
              rounded-xl
              bg-blue-600
              hover:bg-blue-700
              text-white
              font-semibold
              transition
            "
          >
            Показать {filteredProductsCount} товаров
          </button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}