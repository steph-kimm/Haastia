# Use a lightweight Node image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first for caching
COPY package*.json ./

# Install ONLY production dependencies
RUN npm install --production

# Copy the rest of the server code
COPY . .

# Expose backend port
EXPOSE 8000

# Start the server
CMD ["npm", "start"]
