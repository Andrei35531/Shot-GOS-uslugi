import { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { StatusBar } from '../components/StatusBar';
import { MobileHeader } from '../components/MobileHeader';

const IMAGE_FRONT = '/Group 3.svg';
const IMAGE_BACK = '/Group 222.svg';
const TILT_MAX = 12;
const TILT_SENSITIVITY = 12;

function useDocumentCanvas(imageSrc: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageRect, setImageRect] = useState({ left: 0, top: 0, width: 0, height: 0 });

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img || !img.complete) return;

    const dpr = window.devicePixelRatio ?? 1;
    const rect = canvas.getBoundingClientRect();
    const w = Math.round(rect.width);
    const h = Math.round(rect.height);
    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const scale = Math.min(w / imgW, h / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const left = cx - drawW / 2;
    const top = cy - drawH / 2 - 24;
    ctx.drawImage(img, left, top, drawW, drawH);
    setImageRect({ left, top, width: drawW, height: drawH });
  }, []);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imageRef.current = img;
      redraw();
    };
    img.src = imageSrc;
    return () => {
      imageRef.current = null;
    };
  }, [imageSrc, redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [redraw]);

  return { canvasRef, containerRef, imageRect };
}

const FLIP_DURATION_MS = 600;

export function DocumentDetailPage() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const decodedTitle = title ? decodeURIComponent(title) : 'Документ';
  const headerTitle = decodedTitle;
  const isVU = decodedTitle === 'Водительское удостоверение';
  const [isFlipped, setIsFlipped] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const isInteracting = isPressed || tilt.x !== 0 || tilt.y !== 0;
  const pointerDownRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const TAP_DRAG_THRESHOLD = 8;
  const TAP_MAX_MS = 300;

  const front = useDocumentCanvas(IMAGE_FRONT);
  const back = useDocumentCanvas(IMAGE_BACK);
  const imageSrc = isVU ? (isFlipped ? IMAGE_BACK : IMAGE_FRONT) : IMAGE_BACK;
  const single = useDocumentCanvas(imageSrc);

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const box = e.currentTarget.getBoundingClientRect();
    setPointerPos({
      x: ((e.clientX - box.left) / box.width) * 100,
      y: ((e.clientY - box.top) / box.height) * 100,
    });
    pointerDownRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    setIsPressed(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect();
    const xPct = ((e.clientX - box.left) / box.width) * 100;
    const yPct = ((e.clientY - box.top) / box.height) * 100;
    setPointerPos({ x: xPct, y: yPct });
    if (!isPressed) return;
    const centerX = box.width / 2;
    const centerY = box.height / 2;
    const x = (e.clientX - box.left - centerX) / TILT_SENSITIVITY;
    const y = (e.clientY - box.top - centerY) / TILT_SENSITIVITY;
    setTilt({
      x: Math.max(-TILT_MAX, Math.min(TILT_MAX, -y)),
      y: Math.max(-TILT_MAX, Math.min(TILT_MAX, x)),
    });
  }, [isPressed]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const down = pointerDownRef.current;
    if (isVU && down && Date.now() - down.t <= TAP_MAX_MS) {
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      if (dx * dx + dy * dy <= TAP_DRAG_THRESHOLD * TAP_DRAG_THRESHOLD) {
        setIsFlipped((v) => !v);
      }
    }
    pointerDownRef.current = null;
    setIsPressed(false);
    setTilt({ x: 0, y: 0 });
    setPointerPos(null);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isVU]);

  const onPointerLeave = useCallback(() => {
    pointerDownRef.current = null;
    setIsPressed(false);
    setTilt({ x: 0, y: 0 });
    setPointerPos(null);
  }, []);

  const canvasAreaClass = 'flex-1 w-full min-h-0 min-w-0 overflow-hidden select-none';
  /* Позиция радужного блика: от курсора или от наклона карточки (при вращении прав) */
  const shimmerStyle: React.CSSProperties | undefined = isInteracting
    ? {
        ['--mouse-x' as string]: `${pointerPos ? pointerPos.x : 50 + (tilt.y / TILT_MAX) * 45}%`,
        ['--mouse-y' as string]: `${pointerPos ? pointerPos.y : 50 + (tilt.x / TILT_MAX) * 45}%`,
      }
    : undefined;
  /* Маска перелива только по водяным знакам; размер маски = габариты картинки (imageRect) */
  const frontShimmerStyle: React.CSSProperties | undefined = isInteracting
    ? {
        ...shimmerStyle,
        ['--watermark-mask-url' as string]: `url("${import.meta.env.BASE_URL}Frame%202131327833.svg")`,
        ['--mask-width' as string]: `${front.imageRect.width}px`,
        ['--mask-height' as string]: `${front.imageRect.height}px`,
      }
    : undefined;
  const backShimmerStyle: React.CSSProperties | undefined = isInteracting
    ? {
        ...shimmerStyle,
        ['--watermark-mask-url' as string]: `url("${import.meta.env.BASE_URL}Frame%202131327833.svg")`,
        ['--mask-width' as string]: `${back.imageRect.width}px`,
        ['--mask-height' as string]: `${back.imageRect.height}px`,
      }
    : undefined;
  const cardTiltStyle: React.CSSProperties = {
    transformStyle: 'preserve-3d',
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: 'transform 0.15s ease-out',
    height: '400px',
  };

  const renderCanvasArea = () => {
    if (!isVU) {
      return (
        <div ref={single.containerRef} className={canvasAreaClass}>
          <canvas
            ref={single.canvasRef}
            className="w-full h-full"
            style={{
              width: '100%',
              height: '400px',
              padding: '8px 12px',
              display: 'flex',
              flexDirection: 'column',
              flexWrap: 'nowrap',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          />
        </div>
      );
    }

    return (
      <div
        className={`flex-1 w-full min-h-0 min-w-0 overflow-hidden flex items-center justify-start touch-none p-0 ${isPressed ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ perspective: 1200, aspectRatio: '538 / 960', width: '100%', height: '400px' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
      >
        <div
          className="w-full h-full relative flex items-center justify-center"
          style={{
            aspectRatio: '538 / 960',
            height: '400px',
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform ' + FLIP_DURATION_MS + 'ms ease-in-out',
          }}
        >
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
            style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', height: '400px' }}
          >
            <div
              ref={front.containerRef}
              className="relative w-full h-full"
              style={cardTiltStyle}
            >
              <div className="document-bounds">
                <div className="document-bounds-inner">
                  <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl" style={{ height: '400px' }}>
                    <canvas
                      ref={front.canvasRef}
                      className="w-full h-full"
                      style={{
                        width: '100%',
                        height: '400px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexWrap: 'nowrap',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                      }}
                    />
                    {/* Soft rainbow only inside existing watermark shapes (clipping mask); no new or duplicated icons */}
                    {front.imageRect.width > 0 && front.imageRect.height > 0 && (
                      <div
                        className={`absolute pointer-events-none watermark-shimmer watermark-shimmer-rainbow watermark-shimmer-mask watermark-shimmer-image-size ${isInteracting ? 'watermark-shimmer-active' : ''}`}
                        aria-hidden
                        style={{
                          ...frontShimmerStyle,
                          left: front.imageRect.left,
                          top: front.imageRect.top,
                          width: front.imageRect.width,
                          height: front.imageRect.height,
                          zIndex: 1,
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              height: '400px',
            }}
          >
            <div
              ref={back.containerRef}
              className="relative w-full h-full"
              style={cardTiltStyle}
            >
              <div className="document-bounds">
                <div className="document-bounds-inner">
                  <div className="absolute inset-0 w-full h-full overflow-hidden rounded-xl" style={{ height: '400px' }}>
                    <canvas
                      ref={back.canvasRef}
                      className="w-full h-full"
                      style={{
                        width: '100%',
                        height: '400px',
                        padding: '8px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        flexWrap: 'nowrap',
                        justifyContent: 'flex-start',
                        alignItems: 'center',
                      }}
                    />
                    {back.imageRect.width > 0 && back.imageRect.height > 0 && (
                      <div
                        className={`absolute pointer-events-none watermark-shimmer watermark-shimmer-rainbow watermark-shimmer-mask watermark-shimmer-image-size ${isInteracting ? 'watermark-shimmer-active' : ''}`}
                        aria-hidden
                        style={{
                          ...backShimmerStyle,
                          left: back.imageRect.left,
                          top: back.imageRect.top,
                          width: back.imageRect.width,
                          height: back.imageRect.height,
                          zIndex: 1,
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                </div>
            </div>
          </div>
          </div>
        </div>
      {/* fix esbuild JSX parse */}
      </div>
    );
  };

  return (
    <div
      className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-black box-border"
      style={{ width: '100%', height: '100%', maxWidth: 412 }}
    >
      <StatusBar />
      <MobileHeader
        title={headerTitle}
        onBack={() => navigate(-1)}
        onMenu={() => { if (isVU) setIsFlipped((v) => !v); }}
        menuIconSrc={`${import.meta.env.BASE_URL || '/'}mynaui_refresh.svg`}
      />
      {renderCanvasArea()}
      <div className="flex-1 min-h-0 overflow-y-auto py-0 flex flex-col min-w-0" />
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
    </div>
  );
}
