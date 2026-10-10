FROM node:20-alpine

ENV NODE_ENV=development

WORKDIR /app

# Copy package files first for layer caching
COPY package.json package-lock.json* ./

RUN npm install

# Copy source (overridden by volume mount in dev)
COPY . .

EXPOSE 5173

# Vite must listen on 0.0.0.0 inside Docker
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
