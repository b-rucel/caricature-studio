interface SliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export default function Slider({ label, value, onChange, min = 0, max = 100 }: SliderProps) {
  return (
    <div className="slider-container mb-4">
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-medium text-amber-200/80">{label}</label>
        <span className="tooltip-trigger text-amber-500/60 cursor-help text-xs">?</span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          className="custom-slider w-full"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
        />
        <span className="text-xs text-amber-400/60 absolute right-0 -top-1">{value}%</span>
      </div>
    </div>
  )
}
