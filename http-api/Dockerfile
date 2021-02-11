FROM node:alpine as builder

WORKDIR /usr/src
COPY ["package.json", "package-lock.json", "/usr/src/"]

RUN npm install

FROM node:alpine
WORKDIR /usr/app
COPY --from=builder ["/usr/src/node_modules", "/usr/app/node_modules"]
COPY ["index.js", "metrics.js", "/usr/app/"]

EXPOSE 3000
CMD "node" "index.js"
