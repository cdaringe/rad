// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const TWO_PI = 2 * Math.PI;
const radToDeg = (rad)=>rad / TWO_PI * 360
;
const transform = {
    name: "orbit",
    fn: ({ w , h , count: count1 ,  })=>{
        const [cx, cy] = [
            w / 2,
            h / 2
        ];
        const xforms = [];
        const outer_ring_r = 0.6 * cx;
        const ring_spacing_r = (outer_ring_r - 2) / (5 - 1);
        const times = (count)=>"_".repeat(count).split("")
        ;
        const ring_radii = times(5).map((_, i)=>2 + i * ring_spacing_r
        );
        let sum_circumferences = 0;
        const ring_circumferences = ring_radii.map((_, i)=>{
            const c = Math.PI * 2 * ring_radii[i];
            sum_circumferences += c;
            return c;
        });
        const count_by_ring_index = ring_circumferences.map((c, _)=>Math.floor(count1 * c / sum_circumferences)
        );
        const radians_intervals_by_ring_index = count_by_ring_index.map((num, _)=>2 * Math.PI / num
        );
        count_by_ring_index.forEach((num, ringId)=>{
            const thetaChunk = radians_intervals_by_ring_index[ringId];
            const r = ring_radii[ringId];
            const randomRingThetaOffset = Math.random() * TWO_PI;
            times(num).forEach((_, j)=>{
                const theta = j * thetaChunk + randomRingThetaOffset;
                const yOff = r * Math.sin(theta);
                const xOff = r * Math.cos(theta);
                xforms.push({
                    translate: [
                        cx + xOff,
                        cy + yOff
                    ],
                    rotate: [
                        radToDeg(theta)
                    ],
                    scale: 0.5
                });
            });
        });
        return xforms;
    }
};
const transforms = [
    transform,
    transform, 
];
export { transforms as transforms };
