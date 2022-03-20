// deno-lint-ignore-file camelcase
import { RadSvgTransform, Transform } from "../common.ts";

const TWO_PI = 2 * Math.PI;

const radToDeg = (rad: number) => (rad / TWO_PI) * 360;

export const transform: Transform = {
  name: "orbit",
  fn: ({
    w,
    h,
    count,
  }) => {
    const [cx, cy] = [w / 2, h / 2];
    const xforms: RadSvgTransform[] = [];
    const outer_ring_r = .6 * cx;
    const inner_ring_r = 2;
    const ring_count = 5;
    const ring_spacing_r = (outer_ring_r - inner_ring_r) / (ring_count - 1);
    const times = (count: number) => "_".repeat(count).split("");
    const ring_radii = times(ring_count).map((_, i) =>
      inner_ring_r + i * ring_spacing_r
    );
    let sum_circumferences = 0;
    const ring_circumferences = ring_radii.map((_, i) => {
      const c = Math.PI * 2 * ring_radii[i];
      sum_circumferences += c;
      return c;
    });
    const count_by_ring_index = ring_circumferences.map((c, _) =>
      Math.floor(count * c / sum_circumferences)
    );
    const radians_intervals_by_ring_index = count_by_ring_index.map((num, _) =>
      (2 * Math.PI) / num
    );
    count_by_ring_index.forEach((num, ringId) => {
      const thetaChunk = radians_intervals_by_ring_index[ringId];
      const r = ring_radii[ringId];
      const randomRingThetaOffset = Math.random() * TWO_PI;
      times(num).forEach((_, j) => {
        const theta = j * thetaChunk + randomRingThetaOffset;
        const yOff = r * Math.sin(theta);
        const xOff = r * Math.cos(theta);
        xforms.push({
          translate: [cx + xOff, cy + yOff],
          rotate: [radToDeg(theta)],
          scale: 0.5,
        });
      });
    });
    return xforms;
  },
};
