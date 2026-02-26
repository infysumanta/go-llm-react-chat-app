.PHONY: all build run dev clean deps frontend backend

BINARY := llm-chat

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

# Dev mode: run frontend dev server
dev:
	cd frontend && npm run dev

# Clean build artifacts
clean:
	rm -f $(BINARY)
	rm -rf dist
	rm -f chat.db chat.db-wal chat.db-shm
