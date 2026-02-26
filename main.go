package main

import (
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"github.com/infysumanta/go-llm-react-chat-app/internal/handler"
	"github.com/infysumanta/go-llm-react-chat-app/internal/provider"
	"github.com/infysumanta/go-llm-react-chat-app/internal/store"
	"github.com/infysumanta/go-llm-react-chat-app/internal/telegram"

	"github.com/joho/godotenv"
)

//go:embed dist/*
var staticFiles embed.FS

func main() {
	godotenv.Load()

	db, err := store.InitDB()
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Set up multi-provider registry from env vars
	reg := provider.NewRegistry()
	provider.SetupFromEnv(reg)

	h := handler.NewHandlers(db, reg)

	// Start Telegram bot manager
	botManager := telegram.NewBotManager(db, reg)
	go botManager.LoadAndStartAll()

	ch := handler.NewChannelHandlers(db, botManager, reg)

	mux := http.NewServeMux()

	// API routes
	mux.HandleFunc("GET /api/health", h.HealthCheck)
	mux.HandleFunc("GET /api/models", h.ListModels)
	mux.HandleFunc("GET /api/providers", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(reg.ProviderNames())
	})
	mux.HandleFunc("POST /api/models/refresh", func(w http.ResponseWriter, r *http.Request) {
		reg.RefreshModels()
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(reg.AllModels())
	})
	mux.HandleFunc("GET /api/conversations", h.ListConversations)
	mux.HandleFunc("POST /api/conversations", h.CreateConversation)
	mux.HandleFunc("GET /api/conversations/{id}", h.GetConversation)
	mux.HandleFunc("DELETE /api/conversations/{id}", h.DeleteConversation)
	mux.HandleFunc("POST /api/chat", h.Chat)

	// Channel management routes
	mux.HandleFunc("GET /api/channels", ch.ListChannels)
	mux.HandleFunc("POST /api/channels", ch.CreateChannel)
	mux.HandleFunc("GET /api/channels/{id}", ch.GetChannel)
	mux.HandleFunc("PUT /api/channels/{id}", ch.UpdateChannel)
	mux.HandleFunc("DELETE /api/channels/{id}", ch.DeleteChannel)
	mux.HandleFunc("GET /api/channels/{id}/conversations", ch.ListChannelConversations)

	// Static files with SPA fallback for client-side routing
	distFS, err := fs.Sub(staticFiles, "dist")
	if err != nil {
		log.Println("Failed to load static files:", err)
		return
	}
	fileServer := http.FileServer(http.FS(distFS))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/api/") {
			http.NotFound(w, r)
			return
		}
		path := strings.TrimPrefix(r.URL.Path, "/")
		if path != "" {
			if f, err := distFS.Open(path); err == nil {
				_ = f.Close()
				fileServer.ServeHTTP(w, r)
				return
			}
		}
		// SPA fallback: serve index.html for client-side routes
		r.URL.Path = "/"
		fileServer.ServeHTTP(w, r)
	})

	fmt.Println("Server running on http://localhost:8080")
	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Println("Server stopped:", err)
	}
}
