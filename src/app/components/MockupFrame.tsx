import { useEffect, useRef, useState } from 'react';

const MOBILE_VIEWPORT_WIDTH = 412;

/** Область чёрного экрана телефона в макете — интерфейс строго внутри (%) */
const SCREEN_LEFT = 5.5;
const SCREEN_TOP = 5.5;
const SCREEN_WIDTH = 89;
const SCREEN_HEIGHT = 89;
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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#1a1a1a] p-6 box-border">
      <div
        className="relative flex-shrink-0 overflow-visible"
        style={{
          width: 'min(380px, calc(100vw - 3rem), calc((100vh - 3rem) * 390 / 844))',
          aspectRatio: '390 / 844',
        }}
      >
        <img
          src={`${import.meta.env.BASE_URL}Mockup%202.png`}
          alt=""
          className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none select-none rounded-[40px]"
          draggable={false}
        />
        {/* Чёрный экран телефона — интерфейс только внутри */}
        <div
          ref={overlayRef}
          className="absolute overflow-hidden bg-black flex items-center justify-center"
          style={{
            left: `${SCREEN_LEFT}%`,
            top: `${SCREEN_TOP}%`,
            width: `${SCREEN_WIDTH}%`,
            height: `calc(${SCREEN_HEIGHT}% + 4px)`,
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
      </div>
    </div>
  );
}
