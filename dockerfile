# Use official Node image
FROM node:20-alpine

# Create app directory
WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies
RUN npm install --production

# Copy rest of the app
COPY . .

# Expose port
EXPOSE 8080

# Start app
CMD ["npm", "start"]
