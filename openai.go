package main

import (
	"context"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func StreamChat(prompt string, stream chan string) {
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	req := openai.ChatCompletionRequest{
		Model: openai.GPT5Nano,
		Messages: []openai.ChatCompletionMessage{
			{
				Role:    openai.ChatMessageRoleUser,
				Content: prompt,
			},
		},
		Stream: true,
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
