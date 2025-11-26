FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build executable
RUN bun build ./src/index.ts --compile --outfile=llmanager

# Runtime stage - minimal
FROM gcr.io/distroless/cc-debian12

WORKDIR /app

COPY --from=builder /app/llmanager /app/llmanager

EXPOSE 3000

ENTRYPOINT ["/app/llmanager"]
