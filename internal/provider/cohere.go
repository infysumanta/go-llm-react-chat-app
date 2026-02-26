package provider

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// CohereProvider uses direct HTTP calls to the Cohere API.
type CohereProvider struct {
	apiKey string
	models []ModelInfo
}

// NewCohereProvider creates a provider for Cohere.
func NewCohereProvider(apiKey string) *CohereProvider {
	return &CohereProvider{
		apiKey: apiKey,
		models: []ModelInfo{
			{ID: "command-r-plus", Name: "Command R+", Provider: "Cohere", Picture: "https://models.dev/logos/cohere.svg"},
			{ID: "command-r", Name: "Command R", Provider: "Cohere", Picture: "https://models.dev/logos/cohere.svg"},
			{ID: "command-light", Name: "Command Light", Provider: "Cohere", Picture: "https://models.dev/logos/cohere.svg"},
		},
	}
}

func (p *CohereProvider) Name() string { return "Cohere" }

func (p *CohereProvider) ListModels(_ context.Context) ([]ModelInfo, error) {
	return p.models, nil
}

func (p *CohereProvider) StreamChat(ctx context.Context, messages []ChatMessage, modelID string, stream chan<- string) error {
	defer close(stream)

	// Cohere v2 Chat API uses the same messages format as OpenAI
	var systemText string
	var chatMessages []map[string]string
	for _, m := range messages {
		if m.Role == "system" {
			systemText = m.Content
			continue
		}
		chatMessages = append(chatMessages, map[string]string{
			"role":    m.Role,
			"content": m.Content,
		})
	}

	if len(chatMessages) == 0 {
		chatMessages = append(chatMessages, map[string]string{
			"role":    "user",
			"content": "Hello",
		})
	}

	body := map[string]any{
		"model":    modelID,
		"messages": chatMessages,
		"stream":   true,
	}
	if systemText != "" {
		// Prepend system message
		chatMessages = append([]map[string]string{{
			"role":    "system",
			"content": systemText,
		}}, chatMessages...)
		body["messages"] = chatMessages
	}

	jsonBody, err := json.Marshal(body)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.cohere.com/v2/chat", bytes.NewReader(jsonBody))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+p.apiKey)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "text/event-stream")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		stream <- "Error: " + err.Error()
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBody, _ := io.ReadAll(resp.Body)
		errMsg := fmt.Sprintf("Cohere API error %d: %s", resp.StatusCode, string(respBody))
		stream <- "Error: " + errMsg
		return fmt.Errorf("%s", errMsg)
	}

	// Parse SSE stream
	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if !hasPrefix(line, "data: ") {
			continue
		}
		data := line[6:]
		if data == "[DONE]" {
			break
		}

		var event struct {
			Type  string `json:"type"`
			Delta struct {
				Message struct {
					Content struct {
						Text string `json:"text"`
					} `json:"content"`
				} `json:"message"`
			} `json:"delta"`
		}
		if err := json.Unmarshal([]byte(data), &event); err != nil {
			continue
		}
		if event.Type == "content-delta" && event.Delta.Message.Content.Text != "" {
			stream <- event.Delta.Message.Content.Text
		}
	}

	return scanner.Err()
}

func hasPrefix(s, prefix string) bool {
	return len(s) >= len(prefix) && s[:len(prefix)] == prefix
}
