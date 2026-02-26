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
	{ID: "gpt-4o", Name: "GPT-4o"},
	{ID: "gpt-4o-mini", Name: "GPT-4o Mini"},
	{ID: "gpt-4.1", Name: "GPT-4.1"},
	{ID: "gpt-4.1-mini", Name: "GPT-4.1 Mini"},
	{ID: "gpt-4.1-nano", Name: "GPT-4.1 Nano"},
	{ID: "gpt-3.5-turbo", Name: "GPT-3.5 Turbo"},
	{ID: "o3", Name: "o3"},
	{ID: "o3-mini", Name: "o3 Mini"},
	{ID: "o4-mini", Name: "o4 Mini"},
}

func IsValidModel(model string) bool {
	for _, m := range AvailableModels {
		if m.ID == model {
			return true
		}
	}
	return false
}
