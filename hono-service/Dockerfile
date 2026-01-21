# Use the official Bun image
FROM oven/bun:1

WORKDIR /app

# Copy package files
COPY package.json .
#COPY bun.lockb .

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Expose the port
EXPOSE 3000

# Run the app
CMD ["bun", "run", "index.ts"]