package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"

	"github.com/joho/godotenv"
)

//go:embed dist/*
var staticFiles embed.FS

func main() {
	godotenv.Load()

	db, err := InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	h := NewHandlers(db)

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("GET /api/health", h.HealthCheck)
	mux.HandleFunc("GET /api/models", h.ListModels)
	mux.HandleFunc("GET /api/conversations", h.ListConversations)
	mux.HandleFunc("POST /api/conversations", h.CreateConversation)
	mux.HandleFunc("GET /api/conversations/{id}", h.GetConversation)
	mux.HandleFunc("DELETE /api/conversations/{id}", h.DeleteConversation)
	mux.HandleFunc("POST /api/chat", h.Chat)

	// Static files
	distFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Fatal("Failed to load static files:", err)
	}
	mux.Handle("/", http.FileServer(http.FS(distFS)))

	fmt.Println("Server running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}
