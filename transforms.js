// Copyright 2018-2020 the Deno authors. All rights reserved. MIT license.

// This is a specialised implementation of a System module loader.

// @ts-nocheck
/* eslint-disable */
let System, __instantiateAsync, __instantiate;

(() => {
  const r = new Map();

  System = {
    register(id, d, f) {
      r.set(id, { d, f, exp: {} });
    },
  };

  async function dI(mid, src) {
    let id = mid.replace(/\.\w+$/i, "");
    if (id.includes("./")) {
      const [o, ...ia] = id.split("/").reverse(),
        [, ...sa] = src.split("/").reverse(),
        oa = [o];
      let s = 0,
        i;
      while ((i = ia.shift())) {
        if (i === "..") s++;
        else if (i === ".") break;
        else oa.push(i);
      }
      if (s < sa.length) oa.push(...sa.slice(s));
      id = oa.reverse().join("/");
    }
    return r.has(id) ? gExpA(id) : import(mid);
  }

  function gC(id, main) {
    return {
      id,
      import: (m) => dI(m, id),
      meta: { url: id, main },
    };
  }

  function gE(exp) {
    return (id, v) => {
      v = typeof id === "string" ? { [id]: v } : id;
      for (const [id, value] of Object.entries(v)) {
        Object.defineProperty(exp, id, {
          value,
          writable: true,
          enumerable: true,
        });
      }
    };
  }

  function rF(main) {
    for (const [id, m] of r.entries()) {
      const { f, exp } = m;
      const { execute: e, setters: s } = f(gE(exp), gC(id, id === main));
      delete m.f;
      m.e = e;
      m.s = s;
    }
  }

  async function gExpA(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](await gExpA(d[i]));
      const r = e();
      if (r) await r;
    }
    return m.exp;
  }

  function gExp(id) {
    if (!r.has(id)) return;
    const m = r.get(id);
    if (m.s) {
      const { d, e, s } = m;
      delete m.s;
      delete m.e;
      for (let i = 0; i < s.length; i++) s[i](gExp(d[i]));
      e();
    }
    return m.exp;
  }

  __instantiateAsync = async (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExpA(m);
  };

  __instantiate = (m) => {
    System = __instantiateAsync = __instantiate = undefined;
    rF(m);
    return gExp(m);
  };
})();

System.register("common", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("transforms/0001-orbit", [], function (exports_2, context_2) {
    "use strict";
    var TWO_PI, radToDeg, transform;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            TWO_PI = 2 * Math.PI;
            radToDeg = (rad) => (rad / TWO_PI) * 360;
            exports_2("transform", transform = ({ w, h, count, }) => {
                const [cx, cy] = [w / 2, h / 2];
                const xforms = [];
                const outer_ring_r = .6 * cx;
                const inner_ring_r = 2;
                const ring_count = 5;
                const ring_spacing_r = (outer_ring_r - inner_ring_r) / (ring_count - 1);
                const times = (count) => "_".repeat(count).split("");
                const ring_radii = times(ring_count).map((_, i) => inner_ring_r + i * ring_spacing_r);
                let sum_circumferences = 0;
                const ring_circumferences = ring_radii.map((_, i) => {
                    const c = Math.PI * 2 * ring_radii[i];
                    sum_circumferences += c;
                    return c;
                });
                const count_by_ring_index = ring_circumferences.map((c, _) => Math.floor((count * c / sum_circumferences)));
                const radians_intervals_by_ring_index = count_by_ring_index.map((num, _) => (2 * Math.PI) / num);
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
            });
        }
    };
});
System.register("supplemental-transforms", ["transforms/0001-orbit"], function (exports_3, context_3) {
    "use strict";
    var _0001_orbit_ts_1, transforms;
    var __moduleName = context_3 && context_3.id;
    return {
        setters: [
            function (_0001_orbit_ts_1_1) {
                _0001_orbit_ts_1 = _0001_orbit_ts_1_1;
            }
        ],
        execute: function () {
            // supplemental transforms
            exports_3("transforms", transforms = [
                /* back-to-back orbit is often randomly pretty sweet */
                _0001_orbit_ts_1.transform,
                _0001_orbit_ts_1.transform,
            ]);
        }
    };
});

const __exp = __instantiate("supplemental-transforms");
export const transforms = __exp["transforms"];
