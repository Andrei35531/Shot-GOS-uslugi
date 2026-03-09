import { useEffect, useRef, useState } from 'react';

const MOBILE_VIEWPORT_WIDTH = 412;

/** Область чёрного экрана в мокапе — вверху оставляем место под островок (Dynamic Island) */
const SCREEN_LEFT = 5.8;
const SCREEN_TOP = 9.2;
const SCREEN_WIDTH = 88.4;
const SCREEN_HEIGHT = 85.5;
const SCREEN_RADIUS = '24px';

export function MockupFrame({ children }: { children: React.ReactNode }) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [innerHeight, setInnerHeight] = useState(915);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const update = () => {
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const s = w / MOBILE_VIEWPORT_WIDTH;
      const contentH = h / s;
      setInnerHeight(contentH);
      setScale(Math.min(1, s, h / contentH));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black box-border p-0">
      <div
        className="relative flex-shrink-0 overflow-visible"
        style={{
          width: 'min(380px, 100vw, calc(100vh * 390 / 844))',
          aspectRatio: '390 / 844',
        }}
      >
        {/* Фрейм с контентом — под мокапом, виден через прозрачную область экрана в Bezel.png */}
        <div
          ref={overlayRef}
          className="absolute overflow-hidden bg-black flex items-center justify-center z-0"
          style={{
            left: `calc(${SCREEN_LEFT}% - 1px)`,
            top: `calc(${SCREEN_TOP}% - 28px)`,
            width: `calc(${SCREEN_WIDTH}% + 2px)`,
            height: `calc(${SCREEN_HEIGHT}% + 30px)`,
            borderRadius: SCREEN_RADIUS,
          }}
        >
          <div
            className="origin-center flex-shrink-0 overflow-hidden"
            style={{
              width: MOBILE_VIEWPORT_WIDTH,
              height: innerHeight,
              transform: `scale(${scale})`,
            }}
          >
            <div className="w-full h-full overflow-hidden flex flex-col min-h-0">
              {children}
            </div>
          </div>
        </div>
        {/* Мокап поверх — главный слой, рамка и островок перекрывают фрейм */}
        <img
          src={`${import.meta.env.BASE_URL}Bezel.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none select-none rounded-[48px] z-10"
          draggable={false}
        />
      </div>
    </div>
  );
}
