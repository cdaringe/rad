import { Point, RadSvgTransform, Transform } from "../common.ts";

export const chaos: Transform = {
  name: "chaos",
  fn: ({
    w,
    h,
    count,
  }) => {
    const xforms: RadSvgTransform[] = [];
    const getTranslateProposal: () => Point =
      () => [Math.random() * w * .85, h * Math.random()];
    const distance = ([a, b]: Point, [x, y]: Point) =>
      Math.sqrt(
        Math.pow(a - x, 2) + Math.pow(b - y, 2),
      );
    const scootchAway = (
      [a, b]: Point,
      [stepX, stepY]: Point = [10, 30],
    ): Point => [
      a + ((Math.random()) + stepX) * (Math.random() > 0.5 ? 1 : -1),
      b + ((1 + Math.random()) + stepY) * (Math.random() > 0.5 ? 1 : -1),
    ];
    let i = count;
    while (i) {
      let translate: Point = getTranslateProposal();
      while (distance(translate, [700, 280]) < 190) {
        translate = scootchAway(translate);
      }
      xforms.push({
        translate,
        rotate: [360 * Math.random()],
        scale: 0.5,
      });
      --i;
    }
    return xforms;
  },
};
