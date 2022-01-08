# usage: docker run --rm -v $PWD:/rad rad TASK
# build: docker build -t rad .
FROM denoland/deno:alpine-1.17.2
RUN mkdir /radinstall
WORKDIR /radinstall
COPY . .
RUN RAD_SKIP_INTEGRATION_TESTS=1 sh -c "./rad test"
WORKDIR /rad
ENTRYPOINT ["deno", "run", "--unstable", "-A", "src/bin.ts"]
