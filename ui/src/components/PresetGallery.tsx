import React from 'react';
import { Preset } from '../types';

interface PresetGalleryProps {
  presets: Preset[];
  onApplyPreset: (preset: Preset) => void;
}

export const PresetGallery: React.FC<PresetGalleryProps> = ({
  presets,
  onApplyPreset,
}) => {
  return (
    <div className="preset-gallery py-6 px-4 border-b border-amber-500/10">
      <div className="max-w-6xl mx-auto">
        <h3 className="text-amber-400/80 text-sm font-semibold mb-4 uppercase tracking-wider">
          Quick Presets
        </h3>
        <div className="flex gap-3 pb-2">
          {presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => onApplyPreset(preset)}
              className="preset-btn flex-shrink-0"
            >
              <span className="text-2xl">{preset.icon}</span>
              <span className="text-sm">{preset.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
