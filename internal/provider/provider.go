package provider

import "context"

// ChatMessage represents a role+content message for any LLM provider.
type ChatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// ModelInfo describes an available model and which provider serves it.
type ModelInfo struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	Provider string `json:"provider"`
}

// Provider is the interface every LLM backend must implement.
type Provider interface {
	Name() string
	StreamChat(ctx context.Context, messages []ChatMessage, modelID string, stream chan<- string) error
	ListModels(ctx context.Context) ([]ModelInfo, error)
}
