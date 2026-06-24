import { Link } from "react-router-dom";

export default function Footer() {
  const contacts = {
    phone: "+375 (29) 775-24-98",   // Ваш номер телефона
    telegram: "https://t.me/alexunder_zhur", // Ссылка на Telegram
    telegramUsername: "@alexunder_zhur",     // Ваш юзернейм для отображения
  };

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-gray-950 text-gray-300 mt-auto">
      <div className="container mx-auto px-4 py-12">
        {/* Все блоки по центру */}
        <div className="text-center">
          {/* Название магазина */}
          <h3 className="text-xl font-bold text-white mb-4">RockDog Store</h3>
          
          {/* Описание */}
          <p className="text-sm text-gray-400 mb-6 max-w-md mx-auto">
            Магазин для настоящих поклонников вселенной RockDog. Только оригинальная продукция и лучший сервис.
          </p>

          {/* Контакты */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-12">
              <div>
                <span className="block text-gray-400 text-xs mb-1">Телефон</span>
                <a href={`tel:${contacts.phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors font-medium text-lg">
                  {contacts.phone}
                </a>
              </div>
              <div>
                <span className="block text-gray-400 text-xs mb-1">Telegram</span>
                <a href={contacts.telegram} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium text-lg">
                  {contacts.telegramUsername}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Нижняя полоса с копирайтом и дипломом */}
        <div className="border-t border-gray-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-500 space-y-2 md:space-y-0">
            <p>
              © {new Date().getFullYear()} RockDog Store — Все права защищены.
            </p>
            <p className="text-center">
              Сделано с ❤️ для поклонников вселенной RockDog
            </p>
            <p className="text-gray-600">
              УО ПГЭК — Диплом 2026 — Журавский Александр Николаевич
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}