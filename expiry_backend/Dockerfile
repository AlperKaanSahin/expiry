FROM node:20-alpine

WORKDIR /app

# Copy only manifest files first so npm install layer is cached
# unless package.json/package-lock.json actually change
COPY package*.json ./
RUN npm ci

# Now copy the rest of the source
COPY . .

ENV NODE_ENV=production
EXPOSE 5000

# NOTE: not using `npm start` on purpose — that script runs nodemon,
# which is meant for local dev (file-watching + auto-restart) and is
# unnecessary overhead inside a container. We run the server directly.
CMD ["node", "server.js"]
