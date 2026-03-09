interface DocumentCardProps {
  title: string;
  number: string;
  icon: React.ReactNode;
  gradient: string;
}

const CARD_RADIUS_PX = 24;
const CORNER_SMOOTHING = 0.6; // 60% — эллиптические углы (smoother corners)

export function DocumentCard({ title, number, icon, gradient }: DocumentCardProps) {
  const radiusVertical = CARD_RADIUS_PX * CORNER_SMOOTHING;
  return (
    <div 
      className={`relative overflow-hidden p-6 ${gradient} shadow-lg`}
      style={{
        minHeight: '160px',
        borderRadius: `${CARD_RADIUS_PX}px / ${radiusVertical}px`,
      }}
    >
      {/* Content */}
      <div className="relative z-10">
        <h3 className="text-white text-xl font-semibold mb-2">{title}</h3>
        <p className="text-white/90 text-lg tracking-wide">{number}</p>
      </div>
      
      {/* Иконка — стеклянная прозрачная подложка (нейтральный белый слой + blur, без окраски от карточки) */}
      <div
        className="absolute right-4 bottom-4 w-20 h-20 rounded-full flex items-center justify-center overflow-hidden transition-opacity duration-[260ms] ease-out"
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
