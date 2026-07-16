export interface RevealRegion {
  id: string;
  label: string;
  points: number[][];
}

export interface RevealImageConfig {
  image: string;
  width: number;
  height: number;
  regions: RevealRegion[];
}

export interface ImageCoordinate {
  x: number;
  y: number;
}
