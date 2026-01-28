FROM node:22 AS builder
RUN npm i -g bun
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install
COPY . .
RUN bun run build

FROM node:22 AS runner
RUN npm i -g http-server
WORKDIR /app
COPY --from=builder /app/dist ./
EXPOSE 8080
CMD ["http-server",  "-p", "8080", "--proxy", "http://localhost:8080?"]