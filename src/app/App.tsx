import { useRef, useState, useCallback, useEffect } from 'react';
import { Crown, Shield, FileText, CreditCard, IdCard, Heart, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { DocumentCard } from './components/DocumentCard';
import { MobileHeader } from './components/MobileHeader';
import { StatusBar } from './components/StatusBar';

const PEEK_PX = 28;
const CARD_GAP = 4;
const CARD_HEIGHT = 160;
const CARDS_COUNT = 7;
const PADDING_TOP = 16;
const CARDS_TOTAL_HEIGHT = CARDS_COUNT * CARD_HEIGHT + CARDS_COUNT * CARD_GAP;
// Макс. прокрутка: при таком scrollTop последняя карточка прилипает ровно на top (n-1)*PEEK_PX, как остальные (учёт paddingTop).
const MAX_SCROLL_TOP =
  PADDING_TOP +
  (CARDS_COUNT - 1) * (CARD_HEIGHT + CARD_GAP) -
  (CARDS_COUNT - 1) * PEEK_PX;

const DOCUMENTS = [
  { title: 'Паспорт РФ', number: '8824 232487', gradient: 'bg-gradient-to-br from-red-600 via-red-500 to-pink-500', Icon: Crown },
  { title: 'ИНН', number: '7707083893', gradient: 'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500', Icon: Shield },
  { title: 'Свидетельство о рождении', number: 'IV-АБ 123456', gradient: 'bg-gradient-to-br from-yellow-500 via-lime-400 to-emerald-500', Icon: FileText },
  { title: 'Полис ОМС', number: '120912308923148274', gradient: 'bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500', Icon: CreditCard },
  { title: 'Загранпаспорт', number: '72 1234567', gradient: 'bg-gradient-to-br from-cyan-600 via-blue-500 to-blue-600', Icon: IdCard },
  { title: 'СНИЛС', number: '123-456-789 00', gradient: 'bg-gradient-to-br from-indigo-600 via-violet-500 to-purple-500', Icon: Heart },
  { title: 'Водительское удостоверение', number: '99 12 345678', gradient: 'bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500', Icon: Award },
];

export default function App() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [bottomPadding, setBottomPadding] = useState(320);
  const startY = useRef(0);
  const startScrollTop = useRef(0);

  // Нижний отступ так, чтобы при scrollTop = MAX_SCROLL_TOP последняя карточка стояла на top (n-1)*PEEK_PX
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      const viewportH = el.clientHeight;
      if (viewportH < 150) return;
      setBottomPadding(
        Math.max(120, MAX_SCROLL_TOP + viewportH - PADDING_TOP - CARDS_TOTAL_HEIGHT)
      );
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const maxScrollTop = MAX_SCROLL_TOP;
  // Ограничиваем scrollTop, чтобы финал скролла совпадал со скрином
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.scrollTop <= maxScrollTop) return;
    el.scrollTop = maxScrollTop;
  }, [maxScrollTop]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    startY.current = e.clientY;
    startScrollTop.current = scrollRef.current.scrollTop;
  }, []);

  const handleMouseUpOrLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!scrollRef.current) return;
      e.preventDefault();
      const dy = startY.current - e.clientY;
      let next = startScrollTop.current + dy;
      if (next > maxScrollTop) next = maxScrollTop;
      scrollRef.current.scrollTop = next;
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, maxScrollTop]);

  return (
    <div 
      className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black box-border"
      style={{ width: '100%', height: '100%', maxWidth: 412 }}
    >
      {/* Status Bar */}
      <StatusBar />
      
      {/* Header */}
      <MobileHeader 
        title="Документы"
        onBack={() => console.log('Back clicked')}
        onMenu={() => console.log('Menu clicked')}
      />
      
      {/* Карточки друг под другом; при скролле вниз по очереди образуют стак (sticky) */}
      <div
        ref={scrollRef}
        className="scrollbar-hide flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain px-0 touch-pan-y select-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        onScroll={handleScroll}
      >
        <div
          className="relative min-w-0 max-w-full"
          style={{
            paddingTop: PADDING_TOP,
            paddingBottom: bottomPadding,
          }}
        >
          {DOCUMENTS.map((doc, index) => (
            <motion.div
              key={doc.title}
              className={`relative transition-shadow duration-200 overflow-hidden rounded-[24px] ${doc.gradient}`}
              style={{
                position: 'sticky',
                top: index * PEEK_PX,
                zIndex: index,
                marginBottom: CARD_GAP,
                minHeight: CARD_HEIGHT,
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <DocumentCard
                title={doc.title}
                number={doc.number}
                gradient={doc.gradient}
                icon={<doc.Icon className="w-10 h-10 text-white" strokeWidth={2.5} />}
              />
            </motion.div>
          ))}
        </div>
      </div>
      
      {/* Home Indicator (iOS style) */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
    </div>
  );
}