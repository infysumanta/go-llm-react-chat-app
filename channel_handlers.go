package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/google/uuid"
)

type ChannelHandlers struct {
	db         *sql.DB
	botManager *BotManager
}

func NewChannelHandlers(db *sql.DB, bm *BotManager) *ChannelHandlers {
	return &ChannelHandlers{db: db, botManager: bm}
}

// GET /api/channels
func (ch *ChannelHandlers) ListChannels(w http.ResponseWriter, r *http.Request) {
	rows, err := ch.db.Query(
		"SELECT id, name, type, system_prompt, model, enabled, bot_username, created_at, updated_at FROM channels ORDER BY created_at DESC",
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	channels := []Channel{}
	for rows.Next() {
		var c Channel
		var enabled int
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &c.SystemPrompt, &c.Model, &enabled, &c.BotUsername, &c.CreatedAt, &c.UpdatedAt); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		c.Enabled = enabled == 1
		// Don't expose bot token in list responses
		channels = append(channels, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(channels)
}

// POST /api/channels
func (ch *ChannelHandlers) CreateChannel(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Name         string `json:"name"`
		BotToken     string `json:"botToken"`
		SystemPrompt string `json:"systemPrompt"`
		Model        string `json:"model"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.BotToken == "" {
		http.Error(w, "name and botToken are required", http.StatusBadRequest)
		return
	}
	if req.Model == "" || !IsValidModel(req.Model) {
		req.Model = "gpt-5-nano"
	}

	// Validate the bot token with Telegram API
	bot, err := tgbotapi.NewBotAPI(req.BotToken)
	if err != nil {
		http.Error(w, "Invalid bot token: "+err.Error(), http.StatusBadRequest)
		return
	}
	botUsername := bot.Self.UserName

	id := uuid.New().String()
	now := time.Now()

	_, err = ch.db.Exec(
		"INSERT INTO channels (id, name, type, bot_token, system_prompt, model, enabled, bot_username, created_at, updated_at) VALUES (?, ?, 'telegram', ?, ?, ?, 1, ?, ?, ?)",
		id, req.Name, req.BotToken, req.SystemPrompt, req.Model, botUsername, now, now,
	)
	if err != nil {
		http.Error(w, "Failed to create channel: "+err.Error(), http.StatusInternalServerError)
		return
	}

	channel := Channel{
		ID:           id,
		Name:         req.Name,
		Type:         "telegram",
		SystemPrompt: req.SystemPrompt,
		Model:        req.Model,
		Enabled:      true,
		BotUsername:   botUsername,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	// Start the bot
	channel.BotToken = req.BotToken
	ch.botManager.StartBot(channel)
	channel.BotToken = "" // Don't expose token in response

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(channel)
}

// GET /api/channels/{id}
func (ch *ChannelHandlers) GetChannel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var c Channel
	var enabled int
	err := ch.db.QueryRow(
		"SELECT id, name, type, system_prompt, model, enabled, bot_username, created_at, updated_at FROM channels WHERE id = ?", id,
	).Scan(&c.ID, &c.Name, &c.Type, &c.SystemPrompt, &c.Model, &enabled, &c.BotUsername, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		http.Error(w, "channel not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	c.Enabled = enabled == 1

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

// PUT /api/channels/{id}
func (ch *ChannelHandlers) UpdateChannel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	var req struct {
		Name         *string `json:"name"`
		SystemPrompt *string `json:"systemPrompt"`
		Model        *string `json:"model"`
		Enabled      *bool   `json:"enabled"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Fetch current channel
	var c Channel
	var enabled int
	var botToken string
	err := ch.db.QueryRow(
		"SELECT id, name, type, bot_token, system_prompt, model, enabled, bot_username, created_at, updated_at FROM channels WHERE id = ?", id,
	).Scan(&c.ID, &c.Name, &c.Type, &botToken, &c.SystemPrompt, &c.Model, &enabled, &c.BotUsername, &c.CreatedAt, &c.UpdatedAt)
	if err == sql.ErrNoRows {
		http.Error(w, "channel not found", http.StatusNotFound)
		return
	}
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	c.Enabled = enabled == 1
	c.BotToken = botToken

	// Apply updates
	if req.Name != nil {
		c.Name = *req.Name
	}
	if req.SystemPrompt != nil {
		c.SystemPrompt = *req.SystemPrompt
	}
	if req.Model != nil && IsValidModel(*req.Model) {
		c.Model = *req.Model
	}
	if req.Enabled != nil {
		c.Enabled = *req.Enabled
	}

	enabledInt := 0
	if c.Enabled {
		enabledInt = 1
	}

	now := time.Now()
	_, err = ch.db.Exec(
		"UPDATE channels SET name = ?, system_prompt = ?, model = ?, enabled = ?, updated_at = ? WHERE id = ?",
		c.Name, c.SystemPrompt, c.Model, enabledInt, now, id,
	)
	if err != nil {
		http.Error(w, "Failed to update channel: "+err.Error(), http.StatusInternalServerError)
		return
	}
	c.UpdatedAt = now

	// Restart or stop bot based on enabled state
	if c.Enabled {
		ch.botManager.RestartBot(c)
	} else {
		ch.botManager.StopBot(c.ID)
	}

	c.BotToken = "" // Don't expose token in response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(c)
}

// GET /api/channels/{id}/conversations
func (ch *ChannelHandlers) ListChannelConversations(w http.ResponseWriter, r *http.Request) {
	channelID := r.PathValue("id")

	rows, err := ch.db.Query(
		`SELECT c.id, c.title, c.model, c.channel, c.channel_id, c.telegram_chat_id, c.created_at, c.updated_at,
		 (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id) as msg_count
		 FROM conversations c WHERE c.channel_id = ? ORDER BY c.updated_at DESC`,
		channelID,
	)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	type ConvWithCount struct {
		Conversation
		MessageCount int `json:"messageCount"`
	}

	convs := []ConvWithCount{}
	for rows.Next() {
		var c ConvWithCount
		if err := rows.Scan(&c.ID, &c.Title, &c.Model, &c.Channel, &c.ChannelID, &c.TelegramChatID, &c.CreatedAt, &c.UpdatedAt, &c.MessageCount); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		convs = append(convs, c)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(convs)
}

// DELETE /api/channels/{id}
func (ch *ChannelHandlers) DeleteChannel(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")

	// Stop the bot first
	ch.botManager.StopBot(id)

	result, err := ch.db.Exec("DELETE FROM channels WHERE id = ?", id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rows, _ := result.RowsAffected()
	if rows == 0 {
		http.Error(w, "channel not found", http.StatusNotFound)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
