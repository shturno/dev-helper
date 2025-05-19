FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy project files
COPY . .

# Build application
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Start application
CMD ["npm", "run", "dev"] 