import { ChevronLeft, MoreVertical } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
  /** Вызов при touchend на кнопке меню (для запроса разрешений на iOS в контексте жеста). */
  onMenuTouchEnd?: () => void;
  /** Иконка меню (справа). Если задан путь к SVG — показывается он (например, только внутри карточки). */
  menuIconSrc?: string;
}

export function MobileHeader({ title, onBack, onMenu, onMenuTouchEnd, menuIconSrc }: MobileHeaderProps) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 py-4">
      <button 
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="w-7 h-7 text-[#848C97]" />
      </button>
      
      <h1 className="text-white text-lg font-medium text-center leading-6" style={{ fontFamily: "'Golos Text', sans-serif", fontSize: '17px' }}>{title}</h1>
      
      <button 
        type="button"
        onClick={onMenu}
        onTouchEnd={onMenuTouchEnd}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Menu"
      >
        {menuIconSrc ? (
          <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" style={{ color: 'rgba(47, 113, 233, 1)' }}>
            <path d="M20.5 8C19.108 4.821 15.677 3 11.978 3C7.299 3 3.453 6.552 3 11.1" />
            <path d="M16.489 8.40002H20.459C20.53 8.40016 20.6003 8.38629 20.666 8.35921C20.7316 8.33213 20.7912 8.29237 20.8415 8.24222C20.8917 8.19206 20.9316 8.13249 20.9588 8.0669C20.986 8.00132 21 7.93102 21 7.86002V3.90002M3.5 16C4.892 19.179 8.323 21 12.022 21C16.701 21 20.547 17.448 21 12.9" />
            <path d="M7.511 15.6H3.541C3.47 15.5998 3.39968 15.6137 3.33404 15.6408C3.26841 15.6679 3.20877 15.7076 3.15852 15.7578C3.10827 15.8079 3.0684 15.8675 3.0412 15.9331C3.014 15.9987 3 16.069 3 16.14V20.1" />
          </svg>
        ) : (
          <MoreVertical className="w-6 h-6 text-[#848C97]" />
        )}
      </button>
    </header>
  );
}
