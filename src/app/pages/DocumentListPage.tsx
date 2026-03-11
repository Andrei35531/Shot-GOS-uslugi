import { useRef, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Crown, Shield, CreditCard, Heart, Award } from 'lucide-react';
import { motion } from 'motion/react';
import { DocumentCard } from '../components/DocumentCard';
import { MobileHeader } from '../components/MobileHeader';
import { IPHONE_17_AIR_VIEWPORT_WIDTH } from '../constants/viewport';

const PASSPORT_RF_GRADIENT =
  'linear-gradient(244.92deg, #ED4A4A 4.86%, #B51C2E 39.31%, #760F1B 95.56%)';
const INN_GRADIENT =
  'linear-gradient(243.06deg, #F89832 8.72%, #E07517 40.21%, #D94613 94.91%)';
const OMSPOLICY_GRADIENT =
  'linear-gradient(242.32deg, #578DF1 16.55%, #2F71E9 45.28%, #023881 95.19%)';
const SNILS_GRADIENT =
  'linear-gradient(243.06deg, #6AEB93 8.72%, #19B65D 40.21%, #15764C 94.91%)';
const VU_GRADIENT =
  'linear-gradient(242.32deg, #6473E6 16.55%, #394AB1 45.28%, #181164 95.19%)';

/* Высота видимой полоски предыдущей карточки в стаке — заголовок + подзаголовок с запасом для читаемости */
const PEEK_PX = 88;
const CARD_GAP = 4;
const CARD_HEIGHT = 160;
const CARDS_COUNT = 5;
const PADDING_TOP = 16;
const DRAG_THRESHOLD_PX = 5;
const SMOOTH_SCROLL_DURATION_MS = 3000;
function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
const CARDS_TOTAL_HEIGHT = CARDS_COUNT * CARD_HEIGHT + CARDS_COUNT * CARD_GAP;
const MAX_SCROLL_TOP =
  PADDING_TOP +
  (CARDS_COUNT - 1) * (CARD_HEIGHT + CARD_GAP) -
  (CARDS_COUNT - 1) * PEEK_PX;

const DOCUMENTS = [
  { title: 'Паспорт РФ', number: '8824 232487', gradient: 'bg-gradient-to-br from-red-600 via-red-500 to-pink-500', Icon: Crown },
  { title: 'ИНН', number: '7707083893', gradient: 'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-500', Icon: Shield },
  { title: 'Полис ОМС', number: '120912308923148274', gradient: 'bg-gradient-to-br from-emerald-600 via-green-500 to-teal-500', Icon: CreditCard },
  { title: 'СНИЛС', number: '123-456-789 00', gradient: 'bg-gradient-to-br from-indigo-600 via-violet-500 to-purple-500', Icon: Heart },
  { title: 'Водительское удостоверение', number: '99 12 345678', gradient: 'bg-gradient-to-br from-violet-600 via-purple-500 to-fuchsia-500', Icon: Award },
];

export function DocumentListPage() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [bottomPadding, setBottomPadding] = useState(320);
  const startY = useRef(0);
  const startScrollTop = useRef(0);
  const hasCommittedDrag = useRef(false);
  const isPointerDownOnScroll = useRef(false);
  const rafId = useRef<number | null>(null);
  const pendingScrollTop = useRef<number | null>(null);
  const smoothScrollTarget = useRef<number | null>(null);
  const smoothScrollStart = useRef(0);
  const smoothScrollStartTime = useRef(0);
  const smoothRafId = useRef<number | null>(null);

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

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.scrollTop <= MAX_SCROLL_TOP) return;
    el.scrollTop = MAX_SCROLL_TOP;
  }, []);

  const runSmoothScroll = useCallback(() => {
    const el = scrollRef.current;
    const target = smoothScrollTarget.current;
    if (!el || target === null) return;
    const now = performance.now();
    const elapsed = now - smoothScrollStartTime.current;
    const t = Math.min(elapsed / SMOOTH_SCROLL_DURATION_MS, 1);
    const eased = easeOutCubic(t);
    const current = smoothScrollStart.current + (target - smoothScrollStart.current) * eased;
    el.scrollTop = Math.round(current * 100) / 100;
    if (t < 1) {
      smoothRafId.current = requestAnimationFrame(runSmoothScroll);
    } else {
      smoothScrollTarget.current = null;
      smoothRafId.current = null;
    }
  }, []);

  const setSmoothScrollTarget = useCallback((target: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(MAX_SCROLL_TOP, target));
    smoothScrollTarget.current = clamped;
    smoothScrollStart.current = el.scrollTop;
    smoothScrollStartTime.current = performance.now();
    if (smoothRafId.current === null) {
      smoothRafId.current = requestAnimationFrame(runSmoothScroll);
    }
  }, [runSmoothScroll]);

  const handlePointerDown = useCallback((e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isPointerDownOnScroll.current = true;
    hasCommittedDrag.current = false;
    startY.current = e.clientY;
    startScrollTop.current = scrollRef.current.scrollTop;
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    const onMove = (e: MouseEvent) => {
      if (!scrollRef.current || !isPointerDownOnScroll.current) return;
      if (!hasCommittedDrag.current && Math.abs(e.clientY - startY.current) > DRAG_THRESHOLD_PX) {
        hasCommittedDrag.current = true;
        setIsDragging(true);
      }
      if (hasCommittedDrag.current) {
        e.preventDefault();
        const dy = startY.current - e.clientY;
        let next = startScrollTop.current + dy;
        if (next > MAX_SCROLL_TOP) next = MAX_SCROLL_TOP;
        if (next < 0) next = 0;
        pendingScrollTop.current = next;
        if (rafId.current === null) {
          rafId.current = requestAnimationFrame(() => {
            rafId.current = null;
            if (scrollRef.current && pendingScrollTop.current !== null) {
              scrollRef.current.scrollTop = pendingScrollTop.current;
              pendingScrollTop.current = null;
            }
          });
        }
      }
    };
    const onUp = () => {
      isPointerDownOnScroll.current = false;
      setIsDragging(false);
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
      if (scrollRef.current && pendingScrollTop.current !== null) {
        setSmoothScrollTarget(pendingScrollTop.current);
        pendingScrollTop.current = null;
      }
      // не сбрасываем hasCommittedDrag здесь — иначе после перетаскивания click откроет карточку
    };
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp);
    return () => {
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [setSmoothScrollTarget]);

  const handlePointerUpOrLeave = useCallback(() => {
    isPointerDownOnScroll.current = false;
    setIsDragging(false);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const target = el.scrollTop + e.deltaY;
      setSmoothScrollTarget(target);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [setSmoothScrollTarget]);

  const handleCardClick = useCallback(
    (title: string) => {
      if (hasCommittedDrag.current) return;
      navigate(`/document/${encodeURIComponent(title)}`);
    },
    [navigate]
  );

  return (
    <div
      className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-black box-border"
      style={{ width: '100%', height: '100%', maxWidth: IPHONE_17_AIR_VIEWPORT_WIDTH, margin: '0 auto' }}
    >
      <MobileHeader
        title="Документы"
        onBack={() => {}}
        onMenu={() => {}}
      />
      <div
        ref={scrollRef}
        className="scrollbar-hide flex flex-col flex-1 min-h-0 min-w-0 w-full overflow-y-auto overflow-x-hidden overscroll-contain px-0 touch-pan-y select-none"
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handlePointerDown}
        onMouseUp={handlePointerUpOrLeave}
        onMouseLeave={handlePointerUpOrLeave}
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
              role="button"
              tabIndex={0}
              data-document-card
              className={`relative overflow-hidden rounded-[24px] cursor-pointer ${[0, 1, 2, 4].includes(index) ? '' : doc.gradient}`}
              style={{
                position: 'sticky',
                top: index * PEEK_PX,
                zIndex: index,
                marginBottom: CARD_GAP,
                minHeight: CARD_HEIGHT,
                transition: 'transform 3s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 3s cubic-bezier(0.22, 1, 0.36, 1)',
                ...(index === 0 ? { background: PASSPORT_RF_GRADIENT } : {}),
                ...(index === 1 ? { background: INN_GRADIENT } : {}),
                ...(index === 2 ? { background: OMSPOLICY_GRADIENT } : {}),
                ...(index === 4 ? { background: VU_GRADIENT } : {}),
              }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 1.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              onClick={() => handleCardClick(doc.title)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(doc.title);
                }
              }}
            >
              <DocumentCard
                title={doc.title}
                number={doc.number}
                gradient={doc.gradient}
                backgroundStyle={
                  index === 0
                    ? { background: PASSPORT_RF_GRADIENT }
                    : index === 1
                      ? { background: INN_GRADIENT }
                      : index === 2
                        ? { background: OMSPOLICY_GRADIENT }
                        : index === 3
                          ? { background: SNILS_GRADIENT }
                          : index === 4
                            ? { background: VU_GRADIENT }
                            : undefined
                }
                icon={index === 0 ? (
                  <img
                    src={`${import.meta.env.BASE_URL}Orel.svg`}
                    alt=""
                    className="w-10 h-10 object-contain"
                  />
                ) : index === 1 ? (
                  <img
                    src={`${import.meta.env.BASE_URL}fa7-solid_folder.svg`}
                    alt=""
                    className="w-10 h-10 object-contain"
                  />
                ) : index === 2 ? (
                  <img
                    src={`${import.meta.env.BASE_URL}Union.svg`}
                    alt=""
                    className="w-10 h-10 object-contain"
                  />
                ) : index === 3 ? (
                  <img
                    src={`${import.meta.env.BASE_URL}Shield.svg`}
                    alt=""
                    className="w-10 h-10 object-contain"
                  />
                ) : index === 4 ? (
                  <img
                    src={`${import.meta.env.BASE_URL}mingcute_car-3-fill.svg`}
                    alt=""
                    className="w-10 h-10 object-contain"
                  />
                ) : (
                  <doc.Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
                )}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
