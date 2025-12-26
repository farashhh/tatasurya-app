FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

# DEBUG: pastikan express benar-benar terinstall
RUN node -p "require.resolve('express')"

COPY . .

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "server.js"]
