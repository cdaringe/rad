# usage: docker run --rm -v $PWD:/rad rad TASK
# build: docker build -t rad .
FROM hayd/deno:alpine-1.0.0-rc2
RUN mkdir /radinstall
WORKDIR /radinstall
COPY . .
RUN ./rad test
WORKDIR /rad
ENTRYPOINT ["deno", "-A", "src/bin.ts"]
