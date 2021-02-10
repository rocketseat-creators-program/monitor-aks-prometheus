FROM node:alpine as builder

WORKDIR /usr/src
COPY ["http-api/package.json", "http-api/package-lock.json", "/usr/src/"]

RUN npm install

FROM node:alpine
WORKDIR /usr/app
COPY --from=builder ["/usr/src/node_modules", "/usr/app/node_modules"]
COPY ["./http-api/index.js", "/usr/app/"]

EXPOSE 3000
CMD "node" "index.js"
