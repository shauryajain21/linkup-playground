FROM oven/bun:1-alpine
WORKDIR /app
COPY server.ts ./
COPY index.html admin.html ./public/
EXPOSE 3000
CMD ["bun", "run", "server.ts"]
