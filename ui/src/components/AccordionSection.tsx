import type { ReactNode } from 'react'
import type { SectionEnabled } from '../types'

interface AccordionSectionProps {
  icon: string;
  title: string;
  sectionKey: 'hair' | 'face' | 'clothing' | 'style';
  expandedSections: { hair: boolean; face: boolean; clothing: boolean; style: boolean };
  sectionEnabled: SectionEnabled;
  toggleSection: (section: 'hair' | 'face' | 'clothing' | 'style') => void;
  setSectionEnabled: (fn: (prev: SectionEnabled) => SectionEnabled) => void;
  children: ReactNode;
}

export default function AccordionSection({
  icon,
  title,
  sectionKey,
  expandedSections,
  sectionEnabled,
  toggleSection,
  setSectionEnabled,
  children
}: AccordionSectionProps) {
  const isEnabled = sectionEnabled[sectionKey];
  const isExpanded = expandedSections[sectionKey];

  return (
    <div className={`accordion-section mb-3 ${!isEnabled ? 'section-disabled' : ''}`}>
      <div className="accordion-header-wrapper">
        <button className="accordion-header flex-1" onClick={() => toggleSection(sectionKey)}>
          <span className="flex items-center gap-2">
            <span>{icon}</span>
            <span>{title}</span>
          </span>
          <span className={`transform transition-transform ${isExpanded ? '' : 'rotate-180'}`}>▼</span>
        </button>
        <div className="accordion-checkbox-wrapper">
          <label className="section-checkbox flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="custom-checkbox"
              checked={isEnabled}
              onChange={(e) => setSectionEnabled(prev => ({ ...prev, [sectionKey]: e.target.checked }))}
            />
            <span className="text-xs text-amber-400/60">{isEnabled ? 'Included in prompt' : 'Excluded from prompt'}</span>
          </label>
        </div>
      </div>
      <div className={`accordion-content ${!isExpanded ? 'collapsed' : ''}`}>
        {children}
      </div>
    </div>
  )
}
