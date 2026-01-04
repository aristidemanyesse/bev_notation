# Stage runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copier uniquement ce qui est nécessaire
COPY .next ./.next
COPY public ./public
COPY package.json ./package.json
COPY node_modules ./node_modules

EXPOSE 3000
CMD ["npm", "start"]
