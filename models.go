package main

import "time"

type Conversation struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	Model     string    `json:"model"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
	Messages  []Message `json:"messages,omitempty"`
}

type Message struct {
	ID             string    `json:"id"`
	ConversationID string    `json:"conversationId"`
	Role           string    `json:"role"`
	Content        string    `json:"content"`
	Model          string    `json:"model,omitempty"`
	CreatedAt      time.Time `json:"createdAt"`
}

type ModelInfo struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

var AvailableModels = []ModelInfo{
	{ID: "gpt-5", Name: "GPT-5"},
	{ID: "gpt-5-mini", Name: "GPT-5 Mini"},
	{ID: "gpt-5-nano", Name: "GPT-5 Nano"},
}

func IsValidModel(model string) bool {
	for _, m := range AvailableModels {
		if m.ID == model {
			return true
		}
	}
	return false
}
