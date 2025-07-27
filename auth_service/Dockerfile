# Use the official Node.js LTS image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy only package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install --only=production

# Copy the rest of your app code
COPY . .

# Expose port your app runs on
EXPOSE 5000

# Start the application
CMD ["node", "server.js"]
