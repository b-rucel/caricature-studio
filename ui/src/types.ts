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
