import { RadSvgTransform, Transform } from "../common.ts";

export const order: Transform = ({
  w,
  h,
  count,
}) => {
  const times = (count: number) => "_".repeat(count).split("");
  const xforms: RadSvgTransform[] = [];
  const numRows = 3;
  const numCols = 17;
  const ySep = h / (numRows + 1);
  const xSep = w / (numCols + 1);
  times(numRows).forEach((_, iy) => {
    times(numCols).forEach((_, ix) => {
      xforms.push({
        translate: [ix * xSep, iy * ySep - 35],
        rotate: [70],
        scale: 0.5,
      });
    });
  });
  return xforms;
}
