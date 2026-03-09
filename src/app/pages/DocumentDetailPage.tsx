import { useRef, useEffect, useCallback, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { StatusBar } from '../components/StatusBar';
import { MobileHeader } from '../components/MobileHeader';

const IMAGE_SRC = '/image 1.png';

function useRotatableCanvas(imageSrc: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const rotationRef = useRef(0);
  const startAngleRef = useRef(0);
  const isDraggingRef = useRef(false);

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
    const cy = h / 2 - h * 0.12;
    const imgW = img.naturalWidth;
    const imgH = img.naturalHeight;
    const angle = rotationRef.current;
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const boundW = imgW * cos + imgH * sin;
    const boundH = imgW * sin + imgH * cos;
    const maxVert = 2 * Math.min(cy, h - cy);
    const scale = Math.min(w / boundW, h / boundH, maxVert / boundH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotationRef.current);
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();
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
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ro = new ResizeObserver(() => redraw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [redraw]);

  const getAngle = useCallback((clientX: number, clientY: number) => {
    const container = containerRef.current;
    if (!container) return 0;
    const rect = container.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return Math.atan2(clientY - cy, clientX - cx);
  }, []);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      startAngleRef.current = getAngle(e.clientX, e.clientY);
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [getAngle]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDraggingRef.current) return;
      const currentAngle = getAngle(e.clientX, e.clientY);
      let delta = currentAngle - startAngleRef.current;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;
      rotationRef.current += delta;
      startAngleRef.current = currentAngle;
      redraw();
    },
    [getAngle, redraw]
  );

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      isDraggingRef.current = false;
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    },
    []
  );

  const onPointerLeave = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  return {
    canvasRef,
    containerRef,
    redraw,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  };
}

export function DocumentDetailPage() {
  const { title } = useParams<{ title: string }>();
  const navigate = useNavigate();
  const decodedTitle = title ? decodeURIComponent(title) : 'Документ';
  const headerTitle = decodedTitle === 'Водительское удостоверение' ? 'ВУ' : decodedTitle;

  const {
    canvasRef,
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave,
  } = useRotatableCanvas(IMAGE_SRC);

  return (
    <div
      className="relative w-full h-full min-h-0 flex flex-col overflow-hidden bg-black box-border"
      style={{ width: '100%', height: '100%', maxWidth: 412 }}
    >
      <StatusBar />
      <MobileHeader
        title={headerTitle}
        onBack={() => navigate(-1)}
        onMenu={() => {}}
      />
      <div className="flex-1 min-h-0 overflow-y-auto py-0 flex min-w-0">
        <div
          ref={containerRef}
          className="flex-1 w-full min-h-0 min-w-0 touch-none select-none overflow-hidden cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerLeave}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/30 rounded-full" />
    </div>
  );
}
