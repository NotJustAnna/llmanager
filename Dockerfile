FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY . .

# Build executable using existing build script
RUN bun run build

# Runtime stage - minimal
FROM gcr.io/distroless/cc-debian12

WORKDIR /app

COPY --from=builder /app/llmanager /app/llmanager

# Default port (configurable via PORT env var)
EXPOSE 3001

# Data volume for sqlite database
VOLUME ["/data"]

ENV PORT=3001
ENV DB_PATH=/data/llmanager.sqlite

ENTRYPOINT ["/app/llmanager"]
