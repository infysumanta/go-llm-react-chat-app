package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
)

type Handlers struct {
	db *sql.DB
}

func NewHandlers(db *sql.DB) *Handlers {
	return &Handlers{db: db}
}

// GET /api/health
func (h *Handlers) HealthCheck(w http.ResponseWriter, r *http.Request) {
	status := "ok"
	if err := h.db.Ping(); err != nil {
		status = "degraded"
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": status})
}

// GET /api/models
func (h *Handlers) ListModels(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(AvailableModels)
}

// GET /api/conversations
func (h *Handlers) ListConversations(w http.ResponseWriter, r *http.Request) {
	rows, err := h.db.Query(
		"SELECT id, title, model, created_at, updated_at FROM conversations ORDER BY updated_at DESC",
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	conversations := []Conversation{}
	for rows.Next() {
		var c Conversation
		if err := rows.Scan(&c.ID, &c.Title, &c.Model, &c.CreatedAt, &c.UpdatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		conversations = append(conversations, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conversations)
}

// POST /api/conversations
func (h *Handlers) CreateConversation(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Title string `json:"title"`
		Model string `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Allow empty body — use defaults
		req.Title = "New Chat"
		req.Model = "gpt-4o-mini"
	}
	if req.Title == "" {
		req.Title = "New Chat"
	}
	if req.Model == "" || !IsValidModel(req.Model) {
		req.Model = "gpt-4o-mini"
	}

	id := uuid.New().String()
	now := time.Now()

	_, err := h.db.Exec(
		"INSERT INTO conversations (id, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
		id, req.Title, req.Model, now, now,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	conv := Conversation{
		ID:        id,
		Title:     req.Title,
		Model:     req.Model,
		CreatedAt: now,
		UpdatedAt: now,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(conv)
}

// GET /api/conversations/{id}
func (h *Handlers) GetConversation(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var conv Conversation
	err := h.db.QueryRow(
		"SELECT id, title, model, created_at, updated_at FROM conversations WHERE id = ?", id,
	).Scan(&conv.ID, &conv.Title, &conv.Model, &conv.CreatedAt, &conv.UpdatedAt)
	if err == sql.ErrNoRows {
		http.Error(w, "conversation not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, err := h.db.Query(
		"SELECT id, conversation_id, role, content, model, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC", id,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	conv.Messages = []Message{}
	for rows.Next() {
		var m Message
		var model sql.NullString
		if err := rows.Scan(&m.ID, &m.ConversationID, &m.Role, &m.Content, &model, &m.CreatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if model.Valid {
			m.Model = model.String
		}
		conv.Messages = append(conv.Messages, m)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(conv)
}

// DELETE /api/conversations/{id}
func (h *Handlers) DeleteConversation(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	result, err := h.db.Exec("DELETE FROM conversations WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "conversation not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// AI SDK chat request format
type AIChatRequest struct {
	ID             string          `json:"id"`
	Messages       []AIMessage     `json:"messages"`
	Model          string          `json:"model"`
	ConversationID string          `json:"conversationId"`
}

type AIMessage struct {
	ID    string   `json:"id"`
	Role  string   `json:"role"`
	Parts []AIPart `json:"parts"`
}

type AIPart struct {
	Type string `json:"type"`
	Text string `json:"text"`
}

// POST /api/chat — streaming chat handler
func (h *Handlers) Chat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req AIChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	model := req.Model
	if model == "" || !IsValidModel(model) {
		model = "gpt-4o-mini"
	}

	// Extract the last user message text
	var lastUserText string
	for i := len(req.Messages) - 1; i >= 0; i-- {
		if req.Messages[i].Role == "user" {
			for _, part := range req.Messages[i].Parts {
				if part.Type == "text" {
					lastUserText = part.Text
					break
				}
			}
			break
		}
	}

	// Auto-create conversation if needed
	convID := req.ConversationID
	if convID == "" {
		convID = uuid.New().String()
		title := lastUserText
		if len(title) > 50 {
			title = title[:50] + "..."
		}
		if title == "" {
			title = "New Chat"
		}
		_, err := h.db.Exec(
			"INSERT INTO conversations (id, title, model, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			convID, title, model, time.Now(), time.Now(),
		)
		if err != nil {
			http.Error(w, "Failed to create conversation", http.StatusInternalServerError)
			return
		}
	}

	// Save user message to DB
	if lastUserText != "" {
		userMsgID := uuid.New().String()
		_, err := h.db.Exec(
			"INSERT INTO messages (id, conversation_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)",
			userMsgID, convID, "user", lastUserText, time.Now(),
		)
		if err != nil {
			http.Error(w, "Failed to save message", http.StatusInternalServerError)
			return
		}
	}

	// Update conversation timestamp
	h.db.Exec("UPDATE conversations SET updated_at = ? WHERE id = ?", time.Now(), convID)

	// Convert AI SDK messages to OpenAI format
	openaiMessages := convertToOpenAIMessages(req.Messages)

	// Set up streaming response
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	w.Header().Set("Transfer-Encoding", "chunked")
	w.Header().Set("X-Conversation-Id", convID)

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	stream := make(chan string)
	go StreamChat(openaiMessages, model, stream)

	var fullResponse strings.Builder
	for chunk := range stream {
		fullResponse.WriteString(chunk)
		w.Write([]byte(chunk))
		flusher.Flush()
	}

	// Save assistant response to DB
	if fullResponse.Len() > 0 {
		assistantMsgID := uuid.New().String()
		h.db.Exec(
			"INSERT INTO messages (id, conversation_id, role, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?)",
			assistantMsgID, convID, "assistant", fullResponse.String(), model, time.Now(),
		)
	}
}

func convertToOpenAIMessages(messages []AIMessage) []OpenAIMessage {
	var result []OpenAIMessage
	for _, msg := range messages {
		var text strings.Builder
		for _, part := range msg.Parts {
			if part.Type == "text" {
				text.WriteString(part.Text)
			}
		}
		result = append(result, OpenAIMessage{
			Role:    msg.Role,
			Content: text.String(),
		})
	}
	return result
}
