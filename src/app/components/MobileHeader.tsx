import { ChevronLeft, MoreVertical } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  onMenu?: () => void;
}

export function MobileHeader({ title, onBack, onMenu }: MobileHeaderProps) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 py-4">
      <button 
        onClick={onBack}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6 text-[#848C97]" />
      </button>
      
      <h1 className="text-white text-lg font-medium text-center leading-6" style={{ fontFamily: "'Golos Text', sans-serif", fontSize: '17px' }}>{title}</h1>
      
      <button 
        onClick={onMenu}
        className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
        aria-label="Menu"
      >
        <MoreVertical className="w-6 h-6 text-[#848C97]" />
      </button>
    </header>
  );
}
