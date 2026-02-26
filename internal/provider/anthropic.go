package provider

import (
	"context"

	"github.com/anthropics/anthropic-sdk-go"
	"github.com/anthropics/anthropic-sdk-go/option"
)

// AnthropicProvider wraps the official Anthropic SDK.
type AnthropicProvider struct {
	apiKey string
	models []ModelInfo
}

// NewAnthropicProvider creates a provider for Anthropic's Claude API.
func NewAnthropicProvider(apiKey string) *AnthropicProvider {
	return &AnthropicProvider{
		apiKey: apiKey,
		models: []ModelInfo{
			{ID: "claude-opus-4-20250514", Name: "Claude Opus 4", Provider: "Anthropic", Picture: "https://models.dev/logos/anthropic.svg"},
			{ID: "claude-sonnet-4-20250514", Name: "Claude Sonnet 4", Provider: "Anthropic", Picture: "https://models.dev/logos/anthropic.svg"},
			{ID: "claude-haiku-3-5-20241022", Name: "Claude 3.5 Haiku", Provider: "Anthropic", Picture: "https://models.dev/logos/anthropic.svg"},
		},
	}
}

func (p *AnthropicProvider) Name() string { return "Anthropic" }

func (p *AnthropicProvider) ListModels(_ context.Context) ([]ModelInfo, error) {
	return p.models, nil
}

func (p *AnthropicProvider) StreamChat(ctx context.Context, messages []ChatMessage, modelID string, stream chan<- string) error {
	defer close(stream)

	client := anthropic.NewClient(option.WithAPIKey(p.apiKey))

	// Separate system message from conversation messages
	var systemText string
	var convMessages []anthropic.MessageParam
	for _, m := range messages {
		switch m.Role {
		case "system":
			systemText = m.Content
		case "user":
			convMessages = append(convMessages, anthropic.NewUserMessage(
				anthropic.NewTextBlock(m.Content),
			))
		case "assistant":
			convMessages = append(convMessages, anthropic.NewAssistantMessage(
				anthropic.NewTextBlock(m.Content),
			))
		}
	}

	// Ensure we have at least one user message
	if len(convMessages) == 0 {
		convMessages = append(convMessages, anthropic.NewUserMessage(
			anthropic.NewTextBlock("Hello"),
		))
	}

	params := anthropic.MessageNewParams{
		Model:     anthropic.Model(modelID),
		MaxTokens: int64(4096),
		Messages:  convMessages,
	}
	if systemText != "" {
		params.System = []anthropic.TextBlockParam{
			{Text: systemText},
		}
	}

	resp := client.Messages.NewStreaming(ctx, params)

	for resp.Next() {
		event := resp.Current()
		if event.Type == "content_block_delta" && event.Delta.Text != "" {
			stream <- event.Delta.Text
		}
	}

	if err := resp.Err(); err != nil {
		stream <- "Error: " + err.Error()
		return err
	}

	return nil
}
