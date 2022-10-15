# usage: docker run --rm -v $PWD:/rad rad TASK
# build: docker build --progress=plain -t rad -t cdaringe/rad -t cdaringe/rad:6-latest -t cdaringe/rad:latest .
FROM denoland/deno:alpine-1.26.1
RUN mkdir /radinstall
ENV RAD="deno run --unstable -A  /radinstall/src/bin.ts --log-level info"
WORKDIR /radinstall
COPY . .
# test, hydrate the deno cache, clear excess files
RUN RAD_SKIP_INTEGRATION_TESTS=1 $RAD test && $RAD --version && rm -rf test rad.ts .rad
WORKDIR /rad
ENTRYPOINT ["deno", "run", "--unstable", "-A", "/radinstall/src/bin.ts"]


