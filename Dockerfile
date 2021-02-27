# usage: docker run --rm -v $PWD:/rad rad TASK
# build: docker build -t rad .
FROM hayd/deno:alpine-1.7.5
RUN mkdir /radinstall
WORKDIR /radinstall
COPY . .
RUN RAD_SKIP_INTEGRATION_TESTS=1 ./rad test
WORKDIR /rad
ENTRYPOINT ["deno", "--unstable", "-A", "src/bin.ts"]
