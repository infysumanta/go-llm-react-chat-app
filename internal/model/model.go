package model

import "time"

type Channel struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Type         string    `json:"type"`
	BotToken     string    `json:"botToken,omitempty"`
	SystemPrompt string    `json:"systemPrompt"`
	Model        string    `json:"model"`
	Enabled      bool      `json:"enabled"`
	BotUsername  string    `json:"botUsername"`
	CreatedAt    time.Time `json:"createdAt"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

type Conversation struct {
	ID             string    `json:"id"`
	Title          string    `json:"title"`
	Model          string    `json:"model"`
	Channel        string    `json:"channel"`
	ChannelID      *string   `json:"channelId,omitempty"`
	TelegramChatID *int64    `json:"telegramChatId,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
	Messages       []Message `json:"messages,omitempty"`
}

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	Model          string    `json:"model,omitempty"`
	Channel        string    `json:"channel"`
	CreatedAt      time.Time `json:"createdAt"`
}

type ModelInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

var AvailableModels = []ModelInfo{
	{ID: "gpt-5", Name: "GPT-5"},
	{ID: "gpt-5-mini", Name: "GPT-5 Mini"},
	{ID: "gpt-5-nano", Name: "GPT-5 Nano"},
}

func IsValidModel(m string) bool {
	for _, info := range AvailableModels {
		if info.ID == m {
			return true
		}
	}
	return false
}
