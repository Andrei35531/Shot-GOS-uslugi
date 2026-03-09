/** Ширина фрейма контента (как в MockupFrame) — статус-бар подстраивается под неё */
const FRAME_WIDTH = 412;
/** Высота области статус-бара при ширине фрейма 412px */
const STATUS_BAR_HEIGHT = 44;

export function StatusBar() {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center w-full overflow-hidden"
      style={{
        minHeight: STATUS_BAR_HEIGHT,
        maxWidth: FRAME_WIDTH,
      }}
    >
      <img
        src={`${import.meta.env.BASE_URL}Status%20Bar.svg`}
        alt=""
        className="w-full h-auto max-h-[54px] object-contain object-center pointer-events-none select-none"
        style={{ width: '100%', maxWidth: FRAME_WIDTH }}
        draggable={false}
      />
    </div>
  );
}
