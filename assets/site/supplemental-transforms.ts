import { Transform } from "./common.ts";
import { transform as orbit } from "./transforms/0001-orbit.ts";

// supplemental transforms
export const transforms: Transform[] = [
  /* back-to-back orbit is often randomly pretty sweet */
  orbit,
  orbit,
];
