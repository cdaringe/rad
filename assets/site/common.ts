export type Point = [number, number];
export type Transform = {
  name: string;
  fn: (i: TransformInput) => RadSvgTransform[];
};
export type TransformInput = { w: number; h: number; count: number };
export type RadSvgTransform = {
  translate: [number, number];
  rotate: [number];
  scale: number;
};
