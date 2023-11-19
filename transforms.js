const TWO_PI = 2 * Math.PI;
const radToDeg = (rad)=>rad / TWO_PI * 360;
const transform = {
    name: "orbit",
    fn: ({ w , h , count ,  })=>{
        const [cx, cy] = [
            w / 2,
            h / 2
        ];
        const xforms = [];
        const outer_ring_r = .6 * cx;
        const ring_spacing_r = (outer_ring_r - 2) / (5 - 1);
        const times = (count)=>"_".repeat(count).split("");
        const ring_radii = times(5).map((_, i)=>2 + i * ring_spacing_r);
        let sum_circumferences = 0;
        const ring_circumferences = ring_radii.map((_, i)=>{
            const c = Math.PI * 2 * ring_radii[i];
            sum_circumferences += c;
            return c;
        });
        const count_by_ring_index = ring_circumferences.map((c, _)=>Math.floor(count * c / sum_circumferences));
        const radians_intervals_by_ring_index = count_by_ring_index.map((num, _)=>2 * Math.PI / num);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZpbGU6Ly8vaG9tZS9ydW5uZXIvd29yay9yYWQvcmFkL2Fzc2V0cy9zaXRlL3RyYW5zZm9ybXMvb3JiaXQudHMiLCJmaWxlOi8vL2hvbWUvcnVubmVyL3dvcmsvcmFkL3JhZC9hc3NldHMvc2l0ZS9zdXBwbGVtZW50YWwtdHJhbnNmb3Jtcy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBkZW5vLWxpbnQtaWdub3JlLWZpbGUgY2FtZWxjYXNlXG5pbXBvcnQgeyBSYWRTdmdUcmFuc2Zvcm0sIFRyYW5zZm9ybSB9IGZyb20gXCIuLi9jb21tb24udHNcIjtcblxuY29uc3QgVFdPX1BJID0gMiAqIE1hdGguUEk7XG5cbmNvbnN0IHJhZFRvRGVnID0gKHJhZDogbnVtYmVyKSA9PiAocmFkIC8gVFdPX1BJKSAqIDM2MDtcblxuZXhwb3J0IGNvbnN0IHRyYW5zZm9ybTogVHJhbnNmb3JtID0ge1xuICBuYW1lOiBcIm9yYml0XCIsXG4gIGZuOiAoe1xuICAgIHcsXG4gICAgaCxcbiAgICBjb3VudCxcbiAgfSkgPT4ge1xuICAgIGNvbnN0IFtjeCwgY3ldID0gW3cgLyAyLCBoIC8gMl07XG4gICAgY29uc3QgeGZvcm1zOiBSYWRTdmdUcmFuc2Zvcm1bXSA9IFtdO1xuICAgIGNvbnN0IG91dGVyX3JpbmdfciA9IC42ICogY3g7XG4gICAgY29uc3QgaW5uZXJfcmluZ19yID0gMjtcbiAgICBjb25zdCByaW5nX2NvdW50ID0gNTtcbiAgICBjb25zdCByaW5nX3NwYWNpbmdfciA9IChvdXRlcl9yaW5nX3IgLSBpbm5lcl9yaW5nX3IpIC8gKHJpbmdfY291bnQgLSAxKTtcbiAgICBjb25zdCB0aW1lcyA9IChjb3VudDogbnVtYmVyKSA9PiBcIl9cIi5yZXBlYXQoY291bnQpLnNwbGl0KFwiXCIpO1xuICAgIGNvbnN0IHJpbmdfcmFkaWkgPSB0aW1lcyhyaW5nX2NvdW50KS5tYXAoKF8sIGkpID0+XG4gICAgICBpbm5lcl9yaW5nX3IgKyBpICogcmluZ19zcGFjaW5nX3JcbiAgICApO1xuICAgIGxldCBzdW1fY2lyY3VtZmVyZW5jZXMgPSAwO1xuICAgIGNvbnN0IHJpbmdfY2lyY3VtZmVyZW5jZXMgPSByaW5nX3JhZGlpLm1hcCgoXywgaSkgPT4ge1xuICAgICAgY29uc3QgYyA9IE1hdGguUEkgKiAyICogcmluZ19yYWRpaVtpXTtcbiAgICAgIHN1bV9jaXJjdW1mZXJlbmNlcyArPSBjO1xuICAgICAgcmV0dXJuIGM7XG4gICAgfSk7XG4gICAgY29uc3QgY291bnRfYnlfcmluZ19pbmRleCA9IHJpbmdfY2lyY3VtZmVyZW5jZXMubWFwKChjLCBfKSA9PlxuICAgICAgTWF0aC5mbG9vcihjb3VudCAqIGMgLyBzdW1fY2lyY3VtZmVyZW5jZXMpXG4gICAgKTtcbiAgICBjb25zdCByYWRpYW5zX2ludGVydmFsc19ieV9yaW5nX2luZGV4ID0gY291bnRfYnlfcmluZ19pbmRleC5tYXAoKG51bSwgXykgPT5cbiAgICAgICgyICogTWF0aC5QSSkgLyBudW1cbiAgICApO1xuICAgIGNvdW50X2J5X3JpbmdfaW5kZXguZm9yRWFjaCgobnVtLCByaW5nSWQpID0+IHtcbiAgICAgIGNvbnN0IHRoZXRhQ2h1bmsgPSByYWRpYW5zX2ludGVydmFsc19ieV9yaW5nX2luZGV4W3JpbmdJZF07XG4gICAgICBjb25zdCByID0gcmluZ19yYWRpaVtyaW5nSWRdO1xuICAgICAgY29uc3QgcmFuZG9tUmluZ1RoZXRhT2Zmc2V0ID0gTWF0aC5yYW5kb20oKSAqIFRXT19QSTtcbiAgICAgIHRpbWVzKG51bSkuZm9yRWFjaCgoXywgaikgPT4ge1xuICAgICAgICBjb25zdCB0aGV0YSA9IGogKiB0aGV0YUNodW5rICsgcmFuZG9tUmluZ1RoZXRhT2Zmc2V0O1xuICAgICAgICBjb25zdCB5T2ZmID0gciAqIE1hdGguc2luKHRoZXRhKTtcbiAgICAgICAgY29uc3QgeE9mZiA9IHIgKiBNYXRoLmNvcyh0aGV0YSk7XG4gICAgICAgIHhmb3Jtcy5wdXNoKHtcbiAgICAgICAgICB0cmFuc2xhdGU6IFtjeCArIHhPZmYsIGN5ICsgeU9mZl0sXG4gICAgICAgICAgcm90YXRlOiBbcmFkVG9EZWcodGhldGEpXSxcbiAgICAgICAgICBzY2FsZTogMC41LFxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIHJldHVybiB4Zm9ybXM7XG4gIH0sXG59O1xuIiwiaW1wb3J0IHsgVHJhbnNmb3JtIH0gZnJvbSBcIi4vY29tbW9uLnRzXCI7XG5pbXBvcnQgeyB0cmFuc2Zvcm0gYXMgb3JiaXQgfSBmcm9tIFwiLi90cmFuc2Zvcm1zL29yYml0LnRzXCI7XG5cbi8vIHN1cHBsZW1lbnRhbCB0cmFuc2Zvcm1zXG5leHBvcnQgY29uc3QgdHJhbnNmb3JtczogVHJhbnNmb3JtW10gPSBbXG4gIC8qIGJhY2stdG8tYmFjayBvcmJpdCBpcyBvZnRlbiByYW5kb21seSBwcmV0dHkgc3dlZXQgKi9cbiAgb3JiaXQsXG4gIG9yYml0LFxuXTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFHQSxNQUFNLE1BQU0sR0FBRyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsQUFBQztBQUUzQixNQUFNLFFBQVEsR0FBRyxDQUFDLEdBQVcsR0FBSyxBQUFDLEdBQUcsR0FBRyxNQUFNLEdBQUksR0FBRyxBQUFDO0FBRWhELE1BQU0sU0FBUyxHQUFjO0lBQ2xDLElBQUksRUFBRSxPQUFPO0lBQ2IsRUFBRSxFQUFFLENBQUMsRUFDSCxDQUFDLENBQUEsRUFDRCxDQUFDLENBQUEsRUFDRCxLQUFLLENBQUEsSUFDTixHQUFLO1FBQ0osTUFBTSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsR0FBRztZQUFDLENBQUMsR0FBRyxDQUFDO1lBQUUsQ0FBQyxHQUFHLENBQUM7U0FBQyxBQUFDO1FBQ2hDLE1BQU0sTUFBTSxHQUFzQixFQUFFLEFBQUM7UUFDckMsTUFBTSxZQUFZLEdBQUcsRUFBRSxHQUFHLEVBQUUsQUFBQztRQUc3QixNQUFNLGNBQWMsR0FBRyxDQUFDLFlBQVksR0FGZixDQUFDLEFBRTZCLENBQUMsR0FBRyxDQUFDLEFB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
