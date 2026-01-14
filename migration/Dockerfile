ARG NODE_IMG_VERSION=22
FROM node:${NODE_IMG_VERSION}-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy migration script
COPY . .

# Run migration
CMD ["npm", "run", "migrate"]
