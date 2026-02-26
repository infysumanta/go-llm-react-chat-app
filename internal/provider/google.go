package provider

import (
	"context"
	"fmt"

	"google.golang.org/genai"
)

// GoogleProvider wraps the Google Generative AI (Gemini) SDK.
type GoogleProvider struct {
	apiKey string
	models []ModelInfo
}

// NewGoogleProvider creates a provider for Google Gemini.
func NewGoogleProvider(apiKey string) *GoogleProvider {
	return &GoogleProvider{
		apiKey: apiKey,
		models: []ModelInfo{
			{ID: "gemini-2.5-flash", Name: "Gemini 2.5 Flash", Provider: "Google", Picture: "https://models.dev/logos/google.svg"},
			{ID: "gemini-2.5-pro", Name: "Gemini 2.5 Pro", Provider: "Google", Picture: "https://models.dev/logos/google.svg"},
			{ID: "gemini-2.0-flash", Name: "Gemini 2.0 Flash", Provider: "Google", Picture: "https://models.dev/logos/google.svg"},
		},
	}
}

func (p *GoogleProvider) Name() string { return "Google" }

func (p *GoogleProvider) ListModels(_ context.Context) ([]ModelInfo, error) {
	return p.models, nil
}

func (p *GoogleProvider) StreamChat(ctx context.Context, messages []ChatMessage, modelID string, stream chan<- string) error {
	defer close(stream)

	client, err := genai.NewClient(ctx, &genai.ClientConfig{
		APIKey:  p.apiKey,
		Backend: genai.BackendGeminiAPI,
	})
	if err != nil {
		stream <- "Error: " + err.Error()
		return err
	}

	// Build contents from messages
	var systemText string
	var contents []*genai.Content
	for _, m := range messages {
		switch m.Role {
		case "system":
			systemText = m.Content
		case "user":
			contents = append(contents, &genai.Content{
				Role: "user",
				Parts: []*genai.Part{
					genai.NewPartFromText(m.Content),
				},
			})
		case "assistant":
			contents = append(contents, &genai.Content{
				Role: "model",
				Parts: []*genai.Part{
					genai.NewPartFromText(m.Content),
				},
			})
		}
	}

	if len(contents) == 0 {
		contents = append(contents, &genai.Content{
			Role: "user",
			Parts: []*genai.Part{
				genai.NewPartFromText("Hello"),
			},
		})
	}

	config := &genai.GenerateContentConfig{}
	if systemText != "" {
		config.SystemInstruction = &genai.Content{
			Parts: []*genai.Part{
				genai.NewPartFromText(systemText),
			},
		}
	}

	iter := client.Models.GenerateContentStream(ctx, modelID, contents, config)
	for resp, err := range iter {
		if err != nil {
			stream <- "Error: " + err.Error()
			return fmt.Errorf("stream error: %w", err)
		}
		for _, candidate := range resp.Candidates {
			if candidate.Content != nil {
				for _, part := range candidate.Content.Parts {
					if part.Text != "" {
						stream <- part.Text
					}
				}
			}
		}
	}

	return nil
}
