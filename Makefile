.PHONY: all build run dev clean deps frontend backend docker docker-run compose compose-down fmt lint lint-fix check

BINARY := llm-chat
IMAGE := llm-chat
AIR := $(shell go env GOPATH)/bin/air

all: build

# Install all dependencies (Go + npm)
deps:
	go mod tidy
	cd frontend && npm install

# Build frontend assets into dist/
frontend:
	cd frontend && npm install && npm run build

# Build Go binary (requires frontend assets in dist/)
backend:
	go build -o $(BINARY)

# Full build: frontend then backend
build: frontend backend
	@echo "Build complete. Run with: ./$(BINARY)"

# Run the server
run: build
	./$(BINARY)

# Dev mode: Go backend (hot reload) + Vite frontend dev server
dev:
	@echo "Starting Go backend (air) on :8080 and Vite dev server on :5173..."
	@echo "Open http://localhost:5173 in your browser"
	@trap 'kill 0' EXIT; \
	$(AIR) & \
	cd frontend && npm run dev & \
	wait

# Dev mode: Go backend only with hot reload
dev-back:
	$(AIR)

# Dev mode: frontend only
dev-front:
	cd frontend && npm run dev

# Build Docker image
docker:
	docker build -t $(IMAGE) .

# Run Docker container
docker-run:
	docker run --rm -p 8080:8080 -e OPENAI_API_KEY -v llm-chat-data:/app/data $(IMAGE)

# Start with Docker Compose
compose:
	docker compose up --build -d

# Stop Docker Compose
compose-down:
	docker compose down

# Format Go source files
fmt:
	gofmt -w .
	goimports -w -local github.com/infysumanta/go-llm-react-chat-app .

# Run linter
lint:
	golangci-lint run ./...

# Run linter with auto-fix
lint-fix:
	golangci-lint run --fix ./...

# Run all checks: fmt + lint + vet
check: fmt lint
	go vet ./...

# Clean build artifacts
clean:
	rm -f $(BINARY)
	rm -rf dist
	rm -rf data
