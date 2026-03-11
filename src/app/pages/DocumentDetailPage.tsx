import { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { MobileHeader } from '../components/MobileHeader';
import { IPHONE_17_AIR_VIEWPORT_WIDTH } from '../constants/viewport';

const IMAGE_FRONT = `${import.meta.env.BASE_URL || '/'}${encodeURI('Group 3 (1).svg')}`;
const IMAGE_BACK = `${import.meta.env.BASE_URL || '/'}Group 222.svg`;
const TILT_MAX = 12;
const TILT_SENSITIVITY = 12;
const FLIP_DURATION_MS = 600;
export function DocumentDetailPage() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const decodedTitle = title ? decodeURIComponent(title) : 'Документ';
  const headerTitle = decodedTitle;
  const isVU = decodedTitle === 'Водительское удостоверение';
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isPressed, setIsPressed] = useState(false);
  const flipTimeoutRef = useRef<number | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const [isDeviceMoving, setIsDeviceMoving] = useState(false);
  const [deviceTilt, setDeviceTilt] = useState({ beta: 0, gamma: 0 });
  const [sensorPermissionGranted, setSensorPermissionGranted] = useState(false);
  const motionTimeoutRef = useRef<number | null>(null);
  const showWatermarksRef = useRef<(durationMs?: number) => void>(() => {});
  const deviceTiltUpdateRef = useRef(0);
  const hasRequestedPermissionRef = useRef(false);
  const requestInProgressRef = useRef(false);
  const cardContainerRef = useRef<HTMLDivElement | null>(null);
  const cardTouchEndHandlerRef = useRef<((e: TouchEvent) => void) | null>(null);
  const sensorPermissionGrantedRef = useRef(false);
  const requestSensorPermissionRef = useRef<() => void>(() => {});
  const TAP_DRAG_THRESHOLD = 8;
  const TAP_MAX_MS = 300;

  // На iOS 13+ запрос разрешения нужен для датчика наклона. Работает только по HTTPS (или localhost).
  const needsPermission =
    typeof (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function' ||
    typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission === 'function';
  const needsPermissionRef = useRef(needsPermission);
  needsPermissionRef.current = needsPermission;
  sensorPermissionGrantedRef.current = sensorPermissionGranted;

  // Показать водяные знаки на несколько секунд
  const showWatermarks = useCallback((durationMs = 2500) => {
    setIsDeviceMoving(true);
    if (motionTimeoutRef.current != null) {
      window.clearTimeout(motionTimeoutRef.current);
    }
    motionTimeoutRef.current = window.setTimeout(() => {
      setIsDeviceMoving(false);
    }, durationMs);
  }, []);
  showWatermarksRef.current = showWatermarks;

  useEffect(() => {
    return () => {
      if (flipTimeoutRef.current != null) window.clearTimeout(flipTimeoutRef.current);
    };
  }, []);

  // 1) Поворот экрана (portrait ↔ landscape) — срабатывает без разрешений на iPhone
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOrientationChange = () => showWatermarks(2500);
    window.addEventListener('orientationchange', onOrientationChange);

    // Подстраховка: при смене ширины/высоты (поворот) тоже показываем знаки
    let lastInnerWidth = window.innerWidth;
    let lastInnerHeight = window.innerHeight;
    const resizeDebounce = 300;
    let resizeTimer: number | null = null;
    const onResize = () => {
      if (resizeTimer != null) window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const dw = Math.abs(window.innerWidth - lastInnerWidth);
        const dh = Math.abs(window.innerHeight - lastInnerHeight);
        if (dw > 50 || dh > 50) {
          lastInnerWidth = window.innerWidth;
          lastInnerHeight = window.innerHeight;
          showWatermarks(2500);
        }
        resizeTimer = null;
      }, resizeDebounce);
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('orientationchange', onOrientationChange);
      window.removeEventListener('resize', onResize);
      if (resizeTimer != null) window.clearTimeout(resizeTimer);
    };
  }, [showWatermarks]);

  // 2) Наклон устройства (датчик). На iOS события приходят только после разрешения (кнопка «Проверить подлинность»).
  const canUseSensor = !needsPermission || sensorPermissionGranted;
  useEffect(() => {
    if (typeof window === 'undefined' || !canUseSensor) return;

    let lastBeta: number | null = null;
    let lastGamma: number | null = null;
    let lastTrigger = 0;
    const THRESHOLD = 12;
    const THROTTLE_MS = 1500;

    const triggerFromTilt = () => {
      if (Date.now() - lastTrigger > THROTTLE_MS) {
        lastTrigger = Date.now();
        showWatermarksRef.current(2500);
      }
    };

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      const { beta, gamma } = event;
      if (beta == null || gamma == null) return;
      if (lastBeta == null || lastGamma == null) {
        lastBeta = beta;
        lastGamma = gamma;
        return;
      }
      const delta = Math.abs(beta - lastBeta) + Math.abs(gamma - lastGamma);
      lastBeta = beta;
      lastGamma = gamma;
      if (delta > THRESHOLD) triggerFromTilt();
      if (Date.now() - deviceTiltUpdateRef.current > 80) {
        deviceTiltUpdateRef.current = Date.now();
        setDeviceTilt({ beta, gamma });
      }
    };

    const onDeviceMotion = (event: DeviceMotionEvent) => {
      const { alpha, beta, gamma } = event.rotationRate ?? {};
      if (beta == null && gamma == null) return;
      const rate = (Math.abs(beta ?? 0) + Math.abs(gamma ?? 0));
      if (rate > 25) triggerFromTilt();
    };

    window.addEventListener('deviceorientation', onDeviceOrientation);
    window.addEventListener('devicemotion', onDeviceMotion);
    return () => {
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      window.removeEventListener('devicemotion', onDeviceMotion);
      if (motionTimeoutRef.current != null) {
        window.clearTimeout(motionTimeoutRef.current);
      }
    };
  }, [canUseSensor]);

  const requestSensorPermission = useCallback(() => {
    if (requestInProgressRef.current) return;
    const OrientationReq = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
    const MotionReq = (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
    const requestOrientation = typeof OrientationReq === 'function' ? OrientationReq() : Promise.resolve('granted');
    const requestMotion = typeof MotionReq === 'function' ? MotionReq() : Promise.resolve('granted');
    requestInProgressRef.current = true;
    Promise.all([requestOrientation, requestMotion])
      .then(([o, m]) => {
        hasRequestedPermissionRef.current = true;
        if (o === 'granted' || m === 'granted') setSensorPermissionGranted(true);
      })
      .catch(() => {})
      .finally(() => {
        requestInProgressRef.current = false;
      });
  }, []);
  requestSensorPermissionRef.current = requestSensorPermission;

  // При первом касании страницы (любое место) запрашиваем доступ к датчику — тогда наклон сразу начнёт работать.
  const onFirstTouchRequestPermission = useCallback(() => {
    if (!needsPermission || sensorPermissionGranted || hasRequestedPermissionRef.current) return;
    requestSensorPermission();
  }, [needsPermission, sensorPermissionGranted, requestSensorPermission]);

  const handleCheckAuthenticity = useCallback(() => {
    if (needsPermission && !sensorPermissionGranted) requestSensorPermission();
  }, [needsPermission, sensorPermissionGranted, requestSensorPermission]);

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
        if (flipTimeoutRef.current != null) window.clearTimeout(flipTimeoutRef.current);
        setTilt({ x: 0, y: 0 });
        setIsFlipping(true);
        setIsFlipped((v) => !v);
        flipTimeoutRef.current = window.setTimeout(() => {
          setIsFlipping(false);
          flipTimeoutRef.current = null;
        }, FLIP_DURATION_MS);
      }
    }
    pointerDownRef.current = null;
    setIsPressed(false);
    if (!isFlipping) setTilt({ x: 0, y: 0 });
    setPointerPos(null);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
  }, [isVU]);

  const requestPermissionIfNeeded = useCallback(() => {
    if (needsPermission && !sensorPermissionGranted && !hasRequestedPermissionRef.current) requestSensorPermission();
  }, [needsPermission, sensorPermissionGranted, requestSensorPermission]);

  const setCardContainerRef = useCallback((el: HTMLDivElement | null) => {
    if (cardContainerRef.current && cardTouchEndHandlerRef.current) {
      cardContainerRef.current.removeEventListener('touchend', cardTouchEndHandlerRef.current, { capture: true });
    }
    cardContainerRef.current = el;
    if (el && isVU) {
      const handler = () => {
        if (!needsPermissionRef.current) return;
        if (sensorPermissionGrantedRef.current) return;
        if (hasRequestedPermissionRef.current) return;
        requestSensorPermissionRef.current();
      };
      cardTouchEndHandlerRef.current = handler;
      el.addEventListener('touchend', handler, { capture: true });
    } else {
      cardTouchEndHandlerRef.current = null;
    }
  }, [isVU]);

  const onPointerLeave = useCallback(() => {
    pointerDownRef.current = null;
    setIsPressed(false);
    setTilt({ x: 0, y: 0 });
    setPointerPos(null);
  }, []);

  const canvasAreaClass = 'flex-1 w-full min-h-0 min-w-0 overflow-hidden select-none';
  const isInteracting = isPressed || tilt.x !== 0 || tilt.y !== 0;
  /* Позиция радужного блика: от курсора или от наклона карточки (при вращении прав) */
  const shimmerStyle: React.CSSProperties | undefined = isInteracting
    ? {
        ['--mouse-x' as string]: `${pointerPos ? pointerPos.x : 50 + (tilt.y / TILT_MAX) * 45}%`,
        ['--mouse-y' as string]: `${pointerPos ? pointerPos.y : 50 + (tilt.x / TILT_MAX) * 45}%`,
      }
    : undefined;
  /* При наклоне телефона перелив смещается по углам beta/gamma (переливание цветом при наклоне) */
  const deviceTiltShimmer =
    isDeviceMoving &&
    (() => {
      const { beta, gamma } = deviceTilt;
      const x = 50 + (gamma / 90) * 45;
      const y = 50 + (beta / 180) * 45;
      return { ['--mouse-x' as string]: `${Math.max(0, Math.min(100, x))}%`, ['--mouse-y' as string]: `${Math.max(0, Math.min(100, y))}%` };
    })();
  /* Маска перелива по водяным знакам; размер 100% — ровно по размеру картинки; при наклоне перелив от углов beta/gamma */
  const frontShimmerStyle: React.CSSProperties | undefined = isDeviceMoving
    ? {
        ...shimmerStyle,
        ...(deviceTiltShimmer || {}),
        ['--watermark-mask-url' as string]: `url("${import.meta.env.BASE_URL}Frame%202131327833.svg")`,
        ['--mask-width' as string]: '100%',
        ['--mask-height' as string]: '100%',
      }
    : undefined;
  const backShimmerStyle: React.CSSProperties | undefined = isDeviceMoving
    ? {
        ...shimmerStyle,
        ...(deviceTiltShimmer || {}),
        ['--watermark-mask-url' as string]: `url("${import.meta.env.BASE_URL}Frame%202131327833.svg")`,
        ['--mask-width' as string]: '100%',
        ['--mask-height' as string]: '100%',
      }
    : undefined;
  const cardTiltStyle: React.CSSProperties = {
    transformStyle: 'preserve-3d',
    transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: isFlipping ? 'none' : 'transform 0.15s ease-out',
    height: '400px',
  };

  const imageSrc = isVU ? (isFlipped ? IMAGE_BACK : IMAGE_FRONT) : IMAGE_BACK;

  const renderImageArea = () => {
    if (!isVU) {
      return (
        <div
          className="flex-1 w-full min-h-0 min-w-0 overflow-visible select-none"
          style={{ padding: '8px 12px', boxSizing: 'border-box' }}
          onPointerDown={onFirstTouchRequestPermission}
        >
          <div className="document-bounds">
            <div className="document-bounds-inner">
              <img
                src={imageSrc}
                alt={headerTitle}
                className="w-full h-full max-h-none object-contain object-center select-none"
                style={{ display: 'block' }}
                draggable={false}
              />
            </div>
          </div>
        </div>
      );
    }

    const cardHeight = 400;
    const cardInnerHeight = 384;
    return (
      <div
        ref={setCardContainerRef}
        className={`flex-shrink-0 overflow-hidden touch-none p-0 ${isPressed ? 'cursor-grabbing' : 'cursor-grab'}`}
        style={{ perspective: 1200, width: '100%', minWidth: 280, height: cardHeight, minHeight: cardHeight, marginTop: -20 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerLeave}
        onTouchEnd={requestPermissionIfNeeded}
        onClick={requestPermissionIfNeeded}
      >
        <div
          className="relative"
          style={{
            width: '100%',
            height: cardHeight,
            minHeight: cardHeight,
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            transition: 'transform ' + FLIP_DURATION_MS + 'ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {/* Лицевая сторона — только px, без % для Safari */}
          <div
            className="absolute flex items-center justify-center overflow-hidden rounded-xl"
            style={{
              top: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: cardHeight,
              padding: 8,
              boxSizing: 'border-box',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(0deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl overflow-hidden"
              style={{ ...cardTiltStyle, width: '100%', height: cardInnerHeight }}
            >
              <div
                className="flex items-center justify-center rounded-xl overflow-hidden"
                style={{ width: '100%', height: cardInnerHeight }}
              >
                <img
                  src={IMAGE_FRONT}
                  alt={`${headerTitle} (лицевая сторона)`}
                  className="block select-none"
                  style={{ maxWidth: '100%', maxHeight: '100%', height: cardInnerHeight, width: 'auto', objectFit: 'contain' }}
                  draggable={false}
                />
                {frontShimmerStyle && (
                  <div
                    className={`absolute inset-0 pointer-events-none watermark-shimmer watermark-shimmer-rainbow watermark-shimmer-mask watermark-shimmer-image-size ${isDeviceMoving ? 'watermark-shimmer-active' : ''}`}
                    aria-hidden
                    style={{ ...frontShimmerStyle, zIndex: 1, boxSizing: 'border-box' }}
                  />
                )}
              </div>
            </div>
          </div>
          {/* Оборотная сторона */}
          <div
            className="absolute flex items-center justify-center overflow-hidden rounded-xl"
            style={{
              top: 0,
              left: 0,
              right: 0,
              width: '100%',
              height: cardHeight,
              padding: 8,
              boxSizing: 'border-box',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              transformStyle: 'preserve-3d',
            }}
          >
            <div
              className="flex items-center justify-center rounded-xl overflow-hidden"
              style={{ ...cardTiltStyle, width: '100%', height: cardInnerHeight }}
            >
              <div
                className="flex items-center justify-center rounded-xl overflow-hidden"
                style={{ width: '100%', height: cardInnerHeight }}
              >
                <img
                  src={IMAGE_BACK}
                  alt={`${headerTitle} (оборотная сторона)`}
                  className="block select-none"
                  style={{ maxWidth: '100%', maxHeight: '100%', height: cardInnerHeight, width: 'auto', objectFit: 'contain' }}
                  draggable={false}
                />
                {backShimmerStyle && (
                  <div
                    className={`absolute inset-0 pointer-events-none watermark-shimmer watermark-shimmer-rainbow watermark-shimmer-mask watermark-shimmer-image-size ${isDeviceMoving ? 'watermark-shimmer-active' : ''}`}
                    aria-hidden
                    style={{ ...backShimmerStyle, zIndex: 1, boxSizing: 'border-box' }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-black box-border"
      style={{ width: '100%', height: '100%', maxWidth: IPHONE_17_AIR_VIEWPORT_WIDTH, margin: '0 auto' }}
    >
      <MobileHeader
        title={headerTitle}
        onBack={() => navigate('/')}
        onMenu={() => {
          requestPermissionIfNeeded();
          if (isVU) setIsFlipped((v) => !v);
        }}
        onMenuTouchEnd={requestPermissionIfNeeded}
        menuIconSrc={`${import.meta.env.BASE_URL || '/'}mynaui_refresh.svg`}
      />
      <div className="flex-shrink-0 flex flex-col items-center w-full" style={{ minWidth: 280 }}>
        {renderImageArea()}
        <div className="w-full flex flex-col items-center gap-1 pt-2 pb-2">
          <button
            type="button"
            onClick={handleCheckAuthenticity}
            className="text-sm text-white/80 hover:text-white underline underline-offset-2 active:opacity-80 opacity-0 min-h-[44px] min-w-[120px] cursor-pointer"
            style={{ fontFamily: "'Golos Text', sans-serif" }}
            aria-label="Проверить подлинность"
          >
            Проверить подлинность
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto py-0 flex flex-col min-w-0" />
    </div>
  );
}
