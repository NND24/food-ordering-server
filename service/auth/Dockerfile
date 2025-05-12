# Use a lightweight Node.js image
FROM node:20-alpine

# Install necessary tools
RUN apk add --no-cache curl

# Set the working directory
WORKDIR /usr/src/app

# Copy package files for dependency installation
COPY package*.json ./

# Install both production and dev dependencies
RUN npm install --production

# Install nodemon globally for development
RUN npm install -g nodemon

# Mount volumes for live code reloading
VOLUME [ "/usr/src/app/shared", "/usr/src/app" ]

# Expose the application port
EXPOSE ${PORT}


# Start the server in watch mode
CMD ["nodemon", "--watch", ".", "--legacy-watch", "--exec", "node", "server.js"]
