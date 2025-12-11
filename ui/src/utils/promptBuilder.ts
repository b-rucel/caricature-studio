import type { Settings, SectionEnabled } from '../types'

export function buildJsonPrompt(
  settings: Settings,
  sectionEnabled: SectionEnabled,
  userPhoto: string | null,
  extraMode: boolean
) {
  return {
    style: {
      type: "hyperrealistic caricature",
      lighting: sectionEnabled.style ? settings.lighting : "(default)",
      mood: "serious, dramatic",
      details: `${extraMode ? 'extremely' : ''} exaggerated facial proportions, smooth skin texture, painterly realism`
    },
    subject: {
      type: settings.subjectType,
      hasReferencePhoto: !!userPhoto,
      features: {
        hair: sectionEnabled.hair ? `${settings.hairColor}, ${settings.hairStyle}` : "(default)",
        face: sectionEnabled.face ? {
          cheeks_exaggeration: settings.cheeks,
          chin_exaggeration: settings.chin,
          forehead_exaggeration: settings.forehead,
          nose_exaggeration: settings.nose,
          ears_exaggeration: settings.ears
        } : "(default)",
        expression: sectionEnabled.face ? settings.expression : "(default)"
      },
      clothing: sectionEnabled.clothing ? {
        outfit: settings.outfit,
        shirt: settings.shirtColor,
        tie: settings.tieStyle
      } : "(default)"
    },
    background: {
      type: sectionEnabled.style ? settings.background : "(default)",
      atmosphere: "studio portrait, minimalistic"
    },
    sectionsEnabled: sectionEnabled
  };
}
