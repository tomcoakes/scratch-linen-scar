FROM node:18

WORKDIR /usr/src/app

# Install system dependencies for Canvas and Chromium
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libcairo2-dev \
        libpango1.0-dev \
        libjpeg-dev \
        libgif-dev \
        librsvg2-dev \
        pkg-config \
        chromium \
        chromium-sandbox \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Copy package files
COPY package*.json ./

# Install dependencies with network retry and legacy peer deps
RUN npm install --network-timeout=300000 --legacy-peer-deps

# Copy app source
COPY . .

# Your app needs these environment variables
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the app
CMD [ "npm", "start" ] 