package provider

import (
	"context"
	"io"

	openai "github.com/sashabaranov/go-openai"
)

// OpenAICompatibleProvider works with any OpenAI-compatible API
// (OpenAI, Groq, Mistral, Ollama, LM Studio).
type OpenAICompatibleProvider struct {
	name      string
	apiKey    string
	baseURL   string
	models    []ModelInfo
	isDynamic bool // if true, ListModels queries the API (e.g. Ollama, LM Studio)
}

// NewOpenAIProvider creates a provider for the official OpenAI API.
func NewOpenAIProvider(apiKey string) *OpenAICompatibleProvider {
	return &OpenAICompatibleProvider{
		name:   "OpenAI",
		apiKey: apiKey,
		models: []ModelInfo{
			{ID: "gpt-5", Name: "GPT-5", Provider: "OpenAI", Picture: "https://models.dev/logos/openai.svg"},
			{ID: "gpt-5-mini", Name: "GPT-5 Mini", Provider: "OpenAI", Picture: "https://models.dev/logos/openai.svg"},
			{ID: "gpt-5-nano", Name: "GPT-5 Nano", Provider: "OpenAI", Picture: "https://models.dev/logos/openai.svg"},
			{ID: "gpt-4.1", Name: "GPT-4.1", Provider: "OpenAI", Picture: "https://models.dev/logos/openai.svg"},
			{ID: "gpt-4.1-mini", Name: "GPT-4.1 Mini", Provider: "OpenAI", Picture: "https://models.dev/logos/openai.svg"},
			{ID: "gpt-4.1-nano", Name: "GPT-4.1 Nano", Provider: "OpenAI", Picture: "https://models.dev/logos/openai.svg"},
			{ID: "o3-mini", Name: "O3 Mini", Provider: "OpenAI", Picture: "https://models.dev/logos/openai.svg"},
		},
	}
}

// NewGroqProvider creates a provider for Groq's OpenAI-compatible API.
func NewGroqProvider(apiKey string) *OpenAICompatibleProvider {
	return &OpenAICompatibleProvider{
		name:    "Groq",
		apiKey:  apiKey,
		baseURL: "https://api.groq.com/openai/v1",
		models: []ModelInfo{
			{ID: "llama-3.3-70b-versatile", Name: "Llama 3.3 70B", Provider: "Groq", Picture: "https://models.dev/logos/groq.svg"},
			{ID: "llama-3.1-8b-instant", Name: "Llama 3.1 8B", Provider: "Groq", Picture: "https://models.dev/logos/groq.svg"},
			{ID: "mixtral-8x7b-32768", Name: "Mixtral 8x7B", Provider: "Groq", Picture: "https://models.dev/logos/groq.svg"},
			{ID: "gemma2-9b-it", Name: "Gemma 2 9B", Provider: "Groq", Picture: "https://models.dev/logos/groq.svg"},
		},
	}
}

// NewMistralProvider creates a provider for Mistral's OpenAI-compatible API.
func NewMistralProvider(apiKey string) *OpenAICompatibleProvider {
	return &OpenAICompatibleProvider{
		name:    "Mistral",
		apiKey:  apiKey,
		baseURL: "https://api.mistral.ai/v1",
		models: []ModelInfo{
			{ID: "mistral-large-latest", Name: "Mistral Large", Provider: "Mistral", Picture: "https://models.dev/logos/mistral.svg"},
			{ID: "mistral-medium-latest", Name: "Mistral Medium", Provider: "Mistral", Picture: "https://models.dev/logos/mistral.svg"},
			{ID: "mistral-small-latest", Name: "Mistral Small", Provider: "Mistral", Picture: "https://models.dev/logos/mistral.svg"},
			{ID: "open-mistral-nemo", Name: "Mistral Nemo", Provider: "Mistral", Picture: "https://models.dev/logos/mistral.svg"},
		},
	}
}

// NewOllamaProvider creates a provider for a local Ollama instance.
func NewOllamaProvider(baseURL string) *OpenAICompatibleProvider {
	return &OpenAICompatibleProvider{
		name:      "Ollama",
		baseURL:   baseURL + "/v1",
		apiKey:    "ollama", // Ollama doesn't require a real key
		isDynamic: true,
	}
}

// NewLMStudioProvider creates a provider for a local LM Studio instance.
func NewLMStudioProvider(baseURL string) *OpenAICompatibleProvider {
	return &OpenAICompatibleProvider{
		name:      "LM Studio",
		baseURL:   baseURL + "/v1",
		apiKey:    "lm-studio", // LM Studio doesn't require a real key
		isDynamic: true,
	}
}

func (p *OpenAICompatibleProvider) Name() string { return p.name }

func (p *OpenAICompatibleProvider) client() *openai.Client {
	cfg := openai.DefaultConfig(p.apiKey)
	if p.baseURL != "" {
		cfg.BaseURL = p.baseURL
	}
	return openai.NewClientWithConfig(cfg)
}

func (p *OpenAICompatibleProvider) StreamChat(ctx context.Context, messages []ChatMessage, modelID string, stream chan<- string) error {
	defer close(stream)

	c := p.client()

	var chatMsgs []openai.ChatCompletionMessage
	for _, m := range messages {
		chatMsgs = append(chatMsgs, openai.ChatCompletionMessage{
			Role:    m.Role,
			Content: m.Content,
		})
	}

	resp, err := c.CreateChatCompletionStream(ctx, openai.ChatCompletionRequest{
		Model:    modelID,
		Messages: chatMsgs,
		Stream:   true,
	})
	if err != nil {
		stream <- "Error: " + err.Error()
		return err
	}
	defer resp.Close() //nolint:errcheck

	for {
		chunk, err := resp.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}
		if len(chunk.Choices) > 0 {
			stream <- chunk.Choices[0].Delta.Content
		}
	}
}

func (p *OpenAICompatibleProvider) ListModels(ctx context.Context) ([]ModelInfo, error) {
	if !p.isDynamic {
		return p.models, nil
	}

	// Dynamic: query the API for available models (Ollama / LM Studio)
	c := p.client()
	resp, err := c.ListModels(ctx)
	if err != nil {
		return nil, err
	}

	pictureURL := providerPicture(p.name)
	var models []ModelInfo
	for _, m := range resp.Models {
		models = append(models, ModelInfo{
			ID:       m.ID,
			Name:     m.ID,
			Provider: p.name,
			Picture:  pictureURL,
		})
	}
	return models, nil
}

var providerPictureMap = map[string]string{
	"OpenAI":    "https://models.dev/logos/openai.svg",
	"Groq":      "https://models.dev/logos/groq.svg",
	"Mistral":   "https://models.dev/logos/mistral.svg",
	"Ollama":    "https://models.dev/logos/llama.svg",
	"LM Studio": "https://models.dev/logos/lmstudio.svg",
}

func providerPicture(name string) string {
	if url, ok := providerPictureMap[name]; ok {
		return url
	}
	return ""
}
