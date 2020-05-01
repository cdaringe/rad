/// <reference lib="dom" />
import {
  Transform,
  RadSvgTransform,
} from "./common.ts";
import { chaos } from './transforms/chaos.ts'
import { order } from './transforms/order.ts'

function paintBabies(transform: Transform) {
  let count = 51;
  const [w, h] = [800, 300];
  var group = document.getElementById("repeats")!;
  var nodes = Array.from(group.children);
  const getTransformString = ({ translate, rotate, scale }: RadSvgTransform) =>
    `translate(${translate.join(" ")}) rotate(${
      rotate.join(" ")
    }) scale(${scale})`;
  const xforms = transform({ count, w, h });
  // update existing nodes
  if (group.innerHTML) {
    xforms.forEach((xform, i) => {
      nodes[i].setAttribute("transform", getTransformString(xform));
    });
  } else {
    // create initial nodes
    group.innerHTML = xforms.map((xform, i) =>
      `
    <use id='baby_${i}' class='text baby-rad' xlink:href="#repeatme"
      transform="${getTransformString(xform)}"
    />
  `
    ).join("");
  }
}
let transforms = [order, chaos];
// initial paint
paintBabies(chaos);
// funsies initial animation
const chaosTimer = setTimeout(
  () => window.requestAnimationFrame(() => paintBabies(order)),
  500,
);

function whileNotExecuting(cb: () => any) {
  let isExecuting = false;
  return async () => {
    isExecuting = true;
    try {
      /**
       * update default transforms with remote transforms
       */
      if (transforms.length === 2) {
        transforms = await import(
          window.location.port == "3333"
            ? "http://localhost:3333/transforms.js"
            : "https://raw.githubusercontent.com/cdaringe/rad/next/assets/site/transforms"
        ).then((r) => {
          return transforms.concat(r.transforms);
        });
      }
      await Promise.resolve(cb());
    } finally {
      isExecuting = false;
    }
  };
}

let transformIndex = 0;
const onClick = whileNotExecuting(() => {
  clearTimeout(chaosTimer);
  ++transformIndex;
  if (!transforms[transformIndex]) {
    transformIndex = 0;
  }
  paintBabies(transforms[transformIndex]);
});
document.getElementById("radness")!.addEventListener("click", onClick);
