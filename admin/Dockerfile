FROM node:18-alpine

WORKDIR /app

# Install project dependencies (THIS WAS MISSING)
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build Vite app (tsc + vite)
RUN npm run build

# Install static server
RUN npm install -g serve

EXPOSE 3001
CMD ["serve", "-s", "dist", "-l", "3001"]
