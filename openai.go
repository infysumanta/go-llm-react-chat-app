package main

import (
	"context"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

type OpenAIMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

func StreamChat(messages []OpenAIMessage, model string, stream chan string) {
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	var chatMessages []openai.ChatCompletionMessage
	for _, msg := range messages {
		chatMessages = append(chatMessages, openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	req := openai.ChatCompletionRequest{
		Model:    model,
		Messages: chatMessages,
		Stream:   true,
	}

	resp, err := client.CreateChatCompletionStream(context.Background(), req)
	if err != nil {
		stream <- "Error: " + err.Error()
		close(stream)
		return
	}
	defer resp.Close()

	for {
		response, err := resp.Recv()
		if err != nil {
			close(stream)
			break
		}
		if len(response.Choices) > 0 {
			stream <- response.Choices[0].Delta.Content
		}
	}
}
