interface DocumentCardProps {
  title: string;
  number: string;
  icon: React.ReactNode;
  gradient: string;
  backgroundStyle?: React.CSSProperties;
}

export function DocumentCard({ title, number, icon, gradient, backgroundStyle }: DocumentCardProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-[24px] p-6 max-w-full box-border shadow-lg ${backgroundStyle ? '' : gradient}`}
      style={{ minHeight: '160px', ...backgroundStyle }}
    >
      {/* Content — типографика как в Госуслугах: Golos Text, 16px, medium, line-height 1.25 */}
      <div className="relative z-10" style={{ fontFamily: "'Golos Text', sans-serif" }}>
        <h3 className="text-white text-[18px] font-medium leading-[1.25] mb-2">{title}</h3>
        <p className="text-white text-base tracking-wide" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.25)' }}>{number}</p>
      </div>
      
      {/* Круглая подложка под иконку (на 40% больше основного круга, по центру) */}
      <div
        className="absolute right-[15px] bottom-[15px] w-[112px] h-[112px] rounded-full"
        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
      />
      {/* Иконка — стеклянная прозрачная подложка (нейтральный белый слой + blur, без окраски от карточки) */}
      <div
        className="absolute right-[31px] bottom-[31px] w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out"
        style={{
          background: 'rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.25)',
          boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 0 rgba(255, 255, 255, 0.06)',
        }}
      >
        {icon}
      </div>
      
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    </div>
  );
}
