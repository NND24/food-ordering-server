# Base Node.js image
FROM node:20-alpine AS builder

# Set the working directory
WORKDIR /app

# Copy shared files and install dependencies
COPY . .

# Final cleanup
RUN npm cache clean --force

# Use a smaller base for production
FROM node:20-alpine

WORKDIR /app

# Copy built files
COPY --from=builder /app /app

# Expose necessary ports
EXPOSE 5000 4000 3000 7000 8000 9000

# Default command to start all services
CMD ["npm", "run", "up"]
