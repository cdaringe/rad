/// <reference lib="dom" />
import { RadSvgTransform, Transform } from "./common.ts";
import { chaos } from "./transforms/chaos.ts";
import { order } from "./transforms/order.ts";

const updateTransformNameUi = (name: string) => {
  const el = document.getElementById("transform-name");
  if (el) el.textContent = `(${name})`;
};

const getTransformString = ({ translate, rotate, scale }: RadSvgTransform) =>
  `translate(${translate.map((v) => `${v}px`).join(", ")}) rotate(${
    rotate.map((v) => `${v}deg`).join(" ")
  }) scale(${scale})`;

function renderBabies(transform: Transform) {
  const [w, h] = [800, 300];
  const group = document.getElementById("repeats")!;
  // const nodes = Array.from(group.children);
  const xforms = transform.fn({ count: 51, w, h });
  // update existing nodes
  if (!group.innerHTML) {
    group.innerHTML = xforms.map((_, i) =>
      `<use id='baby_${i}' class='text baby-rad' xlink:href="#repeatme" />`
    ).join("");
  }
  Array.from(group.children).forEach((el_, i) => {
    const xform = xforms[i];
    const el = el_ as HTMLElement;
    if (xform) {
      el.style.transform = getTransformString(xform);
      el.style.opacity = "1";
    } else {
      el.style.opacity = "0";
    }
  });
}
let transforms = [chaos, order];
const initialTransformsLength = transforms.length;

// initial paint
renderBabies(chaos);
updateTransformNameUi(chaos.name);
// funsies initial animation
const chaosTimer = setTimeout(
  () => window.requestAnimationFrame(() => renderBabies(order)),
  500,
);

function installSupplementalTransforms(cb: () => any) {
  return async () => {
    try {
      /**
       * update default transforms with remote transforms
       */
      if (transforms.length === initialTransformsLength) {
        const tUrl = window.location.port == "3333"
          ? `${window.location.origin}/transforms.js`
          : (
            window.location.href.match(/github/)
              ? `https://cdaringe.github.io/rad/transforms.js`
              : `${window.location.origin}/transforms.js`
          );
        transforms = await import(tUrl).then((r) =>
          transforms.concat(r.transforms)
        );
      }
    } finally {
      await Promise.resolve(cb());
    }
  };
}

let transformIndex = 1; // start at 1 to not revisit eager pageload xforms
const onClick = installSupplementalTransforms(() => {
  clearTimeout(chaosTimer);
  ++transformIndex;
  if (!transforms[transformIndex]) {
    transformIndex = 0;
    document.getElementById("add_more_transforms")!.style.display = "";
  }
  const currentTransform = transforms[transformIndex];
  updateTransformNameUi(currentTransform.name);
  console.info(
    `current transform: ${currentTransform.name} (${transformIndex}/${transforms.length})`,
  );
  renderBabies(currentTransform);
});
document.getElementById("radness")!.addEventListener("click", onClick);
