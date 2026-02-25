package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"

	"github.com/joho/godotenv"
)

//go:embed dist/*
var staticFiles embed.FS

type ChatRequest struct {
	Message string `json:"message"`
}

func main() {
	godotenv.Load()

	distFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		panic(err)
	}

	http.Handle("/", http.FileServer(http.FS(distFS)))

	http.HandleFunc("/api/chat", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
			return
		}

		var req ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("Transfer-Encoding", "chunked")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		stream := make(chan string)

		go StreamChat(req.Message, stream)

		for chunk := range stream {
			w.Write([]byte(chunk))
			flusher.Flush()
		}
	})

	fmt.Println("Server running on http://localhost:8080")
	http.ListenAndServe(":8080", nil)
}
