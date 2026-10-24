interface LiveControlsProps {
  onBlank: () => void;
  onLogo: () => void;
  onFreeze: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

export default function LiveControls({
  onBlank,
  onLogo,
  onFreeze,
  onPrev,
  onNext,
}: LiveControlsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={onPrev} className="ctrl-btn">
        ◀ Prev
      </button>
      <button type="button" onClick={onNext} className="ctrl-btn">
        Next ▶
      </button>
      <button type="button" onClick={onBlank} className="ctrl-btn">
        Blank (B)
      </button>
      <button type="button" onClick={onLogo} className="ctrl-btn">
        Logo (L)
      </button>
      <button type="button" onClick={onFreeze} className="ctrl-btn">
        Freeze (F)
      </button>
    </div>
  );
}
