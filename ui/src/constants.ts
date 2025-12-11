export interface Settings {
  hairColor: string;
  hairStyle: string;
  expression: string;
  outfit: string;
  shirtColor: string;
  tieStyle: string;
  lighting: string;
  background: string;
  cheeks: number;
  chin: number;
  forehead: number;
  nose: number;
  ears: number;
  subjectType?: string;
}

export interface SectionEnabled {
  hair: boolean;
  face: boolean;
  clothing: boolean;
  style: boolean;
}

export interface Preset {
  name: string;
  icon: string;
  settings: Settings;
}

export const HAIR_COLORS = ['blond', 'dark brown', 'black', 'gray', 'white', 'red', 'auburn', 'silver'];
export const HAIR_STYLES = ['voluminous swept to side', 'slicked back', 'curly', 'bald', 'spiky', 'wavy', 'short cropped', 'wild and messy'];
export const EXPRESSIONS = ['stern', 'smiling warmly', 'surprised', 'pouty', 'smug', 'contemplative', 'mischievous', 'serious'];
export const OUTFITS = ['dark formal suit', 'casual sweater', 'vintage tuxedo', 'leather jacket', 'lab coat', 'military uniform', 'superhero cape', 'banana costume'];
export const SHIRT_COLORS = ['white', 'light blue', 'pink', 'cream', 'black', 'striped'];
export const TIE_STYLES = ['solid blue tie', 'red power tie', 'bow tie', 'no tie', 'gold tie', 'polka dot tie'];
export const LIGHTING = ['soft studio lighting', 'dramatic rim lighting', 'warm golden hour', 'cool blue tones', 'high contrast noir'];
export const BACKGROUNDS = ['dark gradient', 'smoky atmosphere', 'rich burgundy', 'deep navy blue', 'charcoal gray'];

export const PRESETS: Preset[] = [
  {
    name: 'Distinguished Gentleman',
    icon: '🎩',
    settings: {
      hairColor: 'gray',
      hairStyle: 'slicked back',
      expression: 'contemplative',
      outfit: 'dark formal suit',
      shirtColor: 'white',
      tieStyle: 'solid blue tie',
      lighting: 'soft studio lighting',
      background: 'dark gradient',
      cheeks: 70,
      chin: 80,
      forehead: 60,
      nose: 75,
      ears: 50,
      subjectType: 'older man'
    }
  },
  {
    name: 'Stern Leader',
    icon: '👔',
    settings: {
      hairColor: 'blond',
      hairStyle: 'voluminous swept to side',
      expression: 'stern',
      outfit: 'dark formal suit',
      shirtColor: 'white',
      tieStyle: 'red power tie',
      lighting: 'dramatic rim lighting',
      background: 'deep navy blue',
      cheeks: 85,
      chin: 90,
      forehead: 70,
      nose: 80,
      ears: 60,
      subjectType: 'older man'
    }
  },
  {
    name: 'Friendly Celebrity',
    icon: '⭐',
    settings: {
      hairColor: 'dark brown',
      hairStyle: 'wavy',
      expression: 'smiling warmly',
      outfit: 'casual sweater',
      shirtColor: 'cream',
      tieStyle: 'no tie',
      lighting: 'warm golden hour',
      background: 'smoky atmosphere',
      cheeks: 60,
      chin: 55,
      forehead: 50,
      nose: 65,
      ears: 45,
      subjectType: 'young woman'
    }
  },
  {
    name: 'Mad Scientist',
    icon: '🧪',
    settings: {
      hairColor: 'white',
      hairStyle: 'wild and messy',
      expression: 'mischievous',
      outfit: 'lab coat',
      shirtColor: 'black',
      tieStyle: 'bow tie',
      lighting: 'high contrast noir',
      background: 'charcoal gray',
      cheeks: 50,
      chin: 65,
      forehead: 90,
      nose: 85,
      ears: 70,
      subjectType: 'scientist'
    }
  }
];
