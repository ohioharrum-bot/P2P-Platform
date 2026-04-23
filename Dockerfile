# Use a small Node base image for build and runtime
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first to take advantage of Docker caching
COPY package.json package-lock.json ./
RUN npm ci --production=false

# Copy the app source and build it
COPY . .
RUN npm run build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --production

# Copy built app and source directories from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/pages ./pages
COPY --from=builder /app/components ./components
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/data ./data
COPY --from=builder /app/styles ./styles
COPY next.config.mjs next.config.js ./

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "start"]
