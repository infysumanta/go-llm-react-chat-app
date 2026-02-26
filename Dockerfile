# Stage 1: Build frontend
FROM node:22-alpine AS frontend
WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# Stage 2: Build Go binary
FROM golang:1.25-alpine AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY *.go ./
COPY --from=frontend /app/dist ./dist/
RUN CGO_ENABLED=0 go build -o llm-chat .

# Stage 3: Runtime
FROM alpine:3.21
RUN apk add --no-cache ca-certificates
WORKDIR /app
COPY --from=backend /app/llm-chat .
VOLUME /app/data
ENV DATA_DIR="/app/data"
EXPOSE 8080
CMD ["./llm-chat"]
