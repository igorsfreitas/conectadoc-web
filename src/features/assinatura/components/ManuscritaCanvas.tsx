import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface ManuscritaCanvasRef {
  getImageBase64(): string | null;
  isEmpty: boolean;
}

export const ManuscritaCanvas = forwardRef<ManuscritaCanvasRef>(function ManuscritaCanvas(_, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [isEmpty, setIsEmpty] = useState(true);

  function getCtx() {
    const c = canvasRef.current;
    if (!c) return null;
    const ctx = c.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  }

  function getPos(e: { clientX: number; clientY: number }, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = 180 * window.devicePixelRatio;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
  }, []);

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    drawing.current = true;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    const { x, y } = getPos(e.nativeEvent, canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    const { x, y } = getPos(e.nativeEvent, canvasRef.current);
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function onMouseUp() { drawing.current = false; }

  function onTouchStart(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    drawing.current = true;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    const { x, y } = getPos(e.touches[0], canvasRef.current);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }

  function onTouchMove(e: React.TouchEvent<HTMLCanvasElement>) {
    e.preventDefault();
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;
    const { x, y } = getPos(e.touches[0], canvasRef.current);
    ctx.lineTo(x, y);
    ctx.stroke();
    setIsEmpty(false);
  }

  function onTouchEnd() { drawing.current = false; }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  }

  useImperativeHandle(ref, () => ({
    get isEmpty() { return isEmpty; },
    getImageBase64() {
      if (isEmpty) return null;
      return canvasRef.current?.toDataURL('image/png') ?? null;
    },
  }));

  return (
    <div>
      <div style={{ position: 'relative', border: '1.5px dashed var(--border, #d1d5db)', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
        <canvas
          ref={canvasRef}
          style={{ display: 'block', width: '100%', height: 180, cursor: 'crosshair', touchAction: 'none' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        />
        {isEmpty && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none', color: 'var(--text-3, #9ca3af)', fontSize: 13, fontStyle: 'italic',
          }}>
            Desenhe sua assinatura aqui
          </div>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <button type="button" className="btn btn-secondary" style={{ fontSize: 12, height: 28, padding: '0 12px' }} onClick={clear}>
          Limpar
        </button>
      </div>
    </div>
  );
});
