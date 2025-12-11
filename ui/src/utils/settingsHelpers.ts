import type { Settings, SectionEnabled } from '../types'
import {
  HAIR_COLORS,
  HAIR_STYLES,
  EXPRESSIONS,
  OUTFITS,
  SHIRT_COLORS,
  TIE_STYLES,
  LIGHTING,
  BACKGROUNDS
} from '../constants'

export const ALL_SECTIONS_ENABLED: SectionEnabled = {
  hair: true,
  face: true,
  clothing: true,
  style: true
};

export function randomizeSettings(currentSubjectType?: string): Settings {
  return {
    hairColor: HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)],
    hairStyle: HAIR_STYLES[Math.floor(Math.random() * HAIR_STYLES.length)],
    expression: EXPRESSIONS[Math.floor(Math.random() * EXPRESSIONS.length)],
    outfit: OUTFITS[Math.floor(Math.random() * OUTFITS.length)],
    shirtColor: SHIRT_COLORS[Math.floor(Math.random() * SHIRT_COLORS.length)],
    tieStyle: TIE_STYLES[Math.floor(Math.random() * TIE_STYLES.length)],
    lighting: LIGHTING[Math.floor(Math.random() * LIGHTING.length)],
    background: BACKGROUNDS[Math.floor(Math.random() * BACKGROUNDS.length)],
    cheeks: Math.floor(Math.random() * 100),
    chin: Math.floor(Math.random() * 100),
    forehead: Math.floor(Math.random() * 100),
    nose: Math.floor(Math.random() * 100),
    ears: Math.floor(Math.random() * 100),
    subjectType: currentSubjectType
  };
}

export function maximizeExaggerations(settings: Settings): Settings {
  return {
    ...settings,
    cheeks: 100,
    chin: 100,
    forehead: 100,
    nose: 100,
    ears: 100
  };
}
