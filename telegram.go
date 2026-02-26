package main

import (
	"database/sql"
	"fmt"
	"log"
	"strings"
	"sync"
	"time"

	tgbotapi "github.com/go-telegram-bot-api/telegram-bot-api/v5"
	"github.com/google/uuid"
)

type BotManager struct {
	db   *sql.DB
	mu   sync.RWMutex
	bots map[string]*TelegramBot // keyed by channel ID
}

type TelegramBot struct {
	channel    Channel
	api        *tgbotapi.BotAPI
	stop       chan struct{}
	done       chan struct{}
	pendingNew sync.Map // chat IDs that requested /new
}

func NewBotManager(db *sql.DB) *BotManager {
	return &BotManager{
		db:   db,
		bots: make(map[string]*TelegramBot),
	}
}

// LoadAndStartAll reads all enabled channels from the DB and starts bots.
func (bm *BotManager) LoadAndStartAll() {
	rows, err := bm.db.Query(
		"SELECT id, name, type, bot_token, system_prompt, model, enabled, bot_username, created_at, updated_at FROM channels WHERE enabled = 1",
	)
	if err != nil {
		log.Printf("BotManager: failed to load channels: %v", err)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var c Channel
		var enabled int
		if err := rows.Scan(&c.ID, &c.Name, &c.Type, &c.BotToken, &c.SystemPrompt, &c.Model, &enabled, &c.BotUsername, &c.CreatedAt, &c.UpdatedAt); err != nil {
			log.Printf("BotManager: failed to scan channel: %v", err)
			continue
		}
		c.Enabled = enabled == 1
		bm.StartBot(c)
	}
}

// StartBot starts a single Telegram bot for the given channel.
func (bm *BotManager) StartBot(channel Channel) {
	// Stop existing bot if already running and wait for it to finish
	bm.mu.Lock()
	existing, hadExisting := bm.bots[channel.ID]
	if hadExisting {
		close(existing.stop)
		delete(bm.bots, channel.ID)
	}
	bm.mu.Unlock()

	if hadExisting {
		<-existing.done // wait for old goroutine to fully stop
	}

	bot, err := tgbotapi.NewBotAPI(channel.BotToken)
	if err != nil {
		log.Printf("BotManager: failed to start bot %q (%s): %v", channel.Name, channel.ID, err)
		return
	}

	tb := &TelegramBot{
		channel: channel,
		api:     bot,
		stop:    make(chan struct{}),
		done:    make(chan struct{}),
	}

	bm.mu.Lock()
	bm.bots[channel.ID] = tb
	bm.mu.Unlock()

	log.Printf("BotManager: started bot @%s for channel %q", bot.Self.UserName, channel.Name)

	go bm.runBot(tb)
}

// StopBot stops a running bot by channel ID and waits for it to finish.
func (bm *BotManager) StopBot(channelID string) {
	bm.mu.Lock()
	tb, ok := bm.bots[channelID]
	if ok {
		close(tb.stop)
		delete(bm.bots, channelID)
	}
	bm.mu.Unlock()

	if ok {
		<-tb.done // wait for goroutine to fully stop
		log.Printf("BotManager: stopped bot for channel %s", channelID)
	}
}

// RestartBot stops and restarts a bot with updated config.
func (bm *BotManager) RestartBot(channel Channel) {
	bm.StopBot(channel.ID)
	bm.StartBot(channel)
}

func (bm *BotManager) runBot(tb *TelegramBot) {
	defer close(tb.done)

	// Register bot commands with Telegram
	commands := tgbotapi.NewSetMyCommands(
		tgbotapi.BotCommand{Command: "new", Description: "Start a new conversation"},
		tgbotapi.BotCommand{Command: "clear", Description: "Clear current conversation history"},
		tgbotapi.BotCommand{Command: "model", Description: "Show the current AI model"},
		tgbotapi.BotCommand{Command: "help", Description: "Show available commands"},
	)
	if _, err := tb.api.Request(commands); err != nil {
		log.Printf("BotManager: failed to set commands for @%s: %v", tb.api.Self.UserName, err)
	}

	u := tgbotapi.NewUpdate(0)
	u.Timeout = 30

	updates := tb.api.GetUpdatesChan(u)

	for {
		select {
		case <-tb.stop:
			tb.api.StopReceivingUpdates()
			return
		case update, ok := <-updates:
			if !ok {
				return
			}
			if update.Message == nil {
				continue
			}
			bm.handleMessage(tb, update.Message)
		}
	}
}

func (bm *BotManager) handleCommand(tb *TelegramBot, msg *tgbotapi.Message) {
	chatID := msg.Chat.ID

	switch msg.Command() {
	case "start":
		text := fmt.Sprintf(
			"Hello! I'm *%s*.\n\n"+
				"Send me any message and I'll respond using AI.\n\n"+
				"*Commands:*\n"+
				"/new - Start a new conversation\n"+
				"/clear - Clear current conversation history\n"+
				"/model - Show the current AI model\n"+
				"/help - Show this help message",
			tb.channel.Name,
		)
		reply := tgbotapi.NewMessage(chatID, text)
		reply.ParseMode = tgbotapi.ModeMarkdown
		tb.api.Send(reply)

	case "new":
		tb.pendingNew.Store(chatID, true)
		reply := tgbotapi.NewMessage(chatID, "New conversation started. Send me a message!")
		tb.api.Send(reply)

	case "clear":
		var convID string
		err := bm.db.QueryRow(
			"SELECT id FROM conversations WHERE channel_id = ? AND telegram_chat_id = ? ORDER BY updated_at DESC LIMIT 1",
			tb.channel.ID, chatID,
		).Scan(&convID)
		if err != nil {
			reply := tgbotapi.NewMessage(chatID, "No conversation to clear. Send a message to start one!")
			tb.api.Send(reply)
			return
		}
		bm.db.Exec("DELETE FROM messages WHERE conversation_id = ?", convID)
		reply := tgbotapi.NewMessage(chatID, "Conversation history cleared.")
		tb.api.Send(reply)

	case "model":
		text := fmt.Sprintf("Current model: *%s*", tb.channel.Model)
		reply := tgbotapi.NewMessage(chatID, text)
		reply.ParseMode = tgbotapi.ModeMarkdown
		tb.api.Send(reply)

	case "help":
		text := "*Available commands:*\n\n" +
			"/new - Start a new conversation\n" +
			"/clear - Clear current conversation history\n" +
			"/model - Show the current AI model\n" +
			"/help - Show this help message"
		reply := tgbotapi.NewMessage(chatID, text)
		reply.ParseMode = tgbotapi.ModeMarkdown
		tb.api.Send(reply)

	default:
		reply := tgbotapi.NewMessage(chatID, "Unknown command. Type /help to see available commands.")
		tb.api.Send(reply)
	}
}

func (bm *BotManager) handleMessage(tb *TelegramBot, msg *tgbotapi.Message) {
	chatID := msg.Chat.ID

	if msg.IsCommand() {
		bm.handleCommand(tb, msg)
		return
	}

	text := msg.Text
	if text == "" {
		return
	}

	// Check if user requested a new conversation via /new
	forceNew := false
	if _, ok := tb.pendingNew.LoadAndDelete(chatID); ok {
		forceNew = true
	}

	// Find or create conversation for this (channel_id, telegram_chat_id)
	convID, err := bm.findOrCreateConversation(tb, chatID, text, forceNew)
	if err != nil {
		log.Printf("BotManager: failed to find/create conversation: %v", err)
		reply := tgbotapi.NewMessage(chatID, "Sorry, something went wrong. Please try again.")
		tb.api.Send(reply)
		return
	}

	// Save user message
	userMsgID := uuid.New().String()
	_, err = bm.db.Exec(
		"INSERT INTO messages (id, conversation_id, role, content, channel, created_at) VALUES (?, ?, 'user', ?, 'telegram', ?)",
		userMsgID, convID, text, time.Now(),
	)
	if err != nil {
		log.Printf("BotManager: failed to save user message: %v", err)
	}

	// Update conversation timestamp
	bm.db.Exec("UPDATE conversations SET updated_at = ? WHERE id = ?", time.Now(), convID)

	// Load conversation history
	messages, err := bm.loadHistory(convID)
	if err != nil {
		log.Printf("BotManager: failed to load history: %v", err)
		messages = []OpenAIMessage{}
	}

	// Prepend system prompt if configured
	if tb.channel.SystemPrompt != "" {
		messages = append([]OpenAIMessage{{Role: "system", Content: tb.channel.SystemPrompt}}, messages...)
	}

	// Call LLM
	stream := make(chan string)
	go StreamChat(messages, tb.channel.Model, stream)

	var fullResponse strings.Builder
	for chunk := range stream {
		fullResponse.WriteString(chunk)
	}

	responseText := fullResponse.String()
	if responseText == "" {
		responseText = "Sorry, I couldn't generate a response."
	}

	// Save assistant message
	assistantMsgID := uuid.New().String()
	bm.db.Exec(
		"INSERT INTO messages (id, conversation_id, role, content, model, channel, created_at) VALUES (?, ?, 'assistant', ?, ?, 'telegram', ?)",
		assistantMsgID, convID, responseText, tb.channel.Model, time.Now(),
	)

	// Send to Telegram (split at 4096 chars if needed)
	bm.sendTelegramResponse(tb, chatID, responseText)
}

func (bm *BotManager) findOrCreateConversation(tb *TelegramBot, chatID int64, firstMsg string, forceNew bool) (string, error) {
	if !forceNew {
		var convID string
		err := bm.db.QueryRow(
			"SELECT id FROM conversations WHERE channel_id = ? AND telegram_chat_id = ? ORDER BY updated_at DESC LIMIT 1",
			tb.channel.ID, chatID,
		).Scan(&convID)
		if err == nil {
			return convID, nil
		}
		if err != sql.ErrNoRows {
			return "", err
		}
	}

	// Create new conversation
	convID := uuid.New().String()
	title := firstMsg
	if len(title) > 50 {
		title = title[:50] + "..."
	}
	_, err := bm.db.Exec(
		"INSERT INTO conversations (id, title, model, channel, channel_id, telegram_chat_id, created_at, updated_at) VALUES (?, ?, ?, 'telegram', ?, ?, ?, ?)",
		convID, title, tb.channel.Model, tb.channel.ID, chatID, time.Now(), time.Now(),
	)
	if err != nil {
		return "", fmt.Errorf("failed to create conversation: %w", err)
	}
	return convID, nil
}

func (bm *BotManager) loadHistory(convID string) ([]OpenAIMessage, error) {
	rows, err := bm.db.Query(
		"SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
		convID,
	)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []OpenAIMessage
	for rows.Next() {
		var m OpenAIMessage
		if err := rows.Scan(&m.Role, &m.Content); err != nil {
			return nil, err
		}
		messages = append(messages, m)
	}
	return messages, nil
}

func (bm *BotManager) sendTelegramResponse(tb *TelegramBot, chatID int64, text string) {
	const maxLen = 4096

	for len(text) > 0 {
		chunk := text
		if len(chunk) > maxLen {
			chunk = text[:maxLen]
			text = text[maxLen:]
		} else {
			text = ""
		}

		// Try sending with Markdown first
		msg := tgbotapi.NewMessage(chatID, chunk)
		msg.ParseMode = tgbotapi.ModeMarkdown
		_, err := tb.api.Send(msg)
		if err != nil {
			// Fallback to plain text
			msg.ParseMode = ""
			tb.api.Send(msg)
		}
	}
}
