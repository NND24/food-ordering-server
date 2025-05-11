# Use a lightweight Node.js image
FROM node:20-alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Set the working directory
WORKDIR /usr/src/app

# Copy and install only the necessary dependencies
COPY package*.json ./
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Use the environment variable for the port
EXPOSE ${PORT}

# Mount shared code from the host (useful for development)
VOLUME /usr/src/app/shared

# Start the server
CMD ["node", "server.js"]