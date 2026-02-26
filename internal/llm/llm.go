package llm

import (
	"context"
	"os"

	openai "github.com/sashabaranov/go-openai"

	"github.com/infysumanta/go-llm-react-chat-app/internal/model"
)

func StreamChat(messages []model.OpenAIMessage, modelName string, stream chan string) {
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	var chatMessages []openai.ChatCompletionMessage
	for _, msg := range messages {
		chatMessages = append(chatMessages, openai.ChatCompletionMessage{
			Role:    msg.Role,
			Content: msg.Content,
		})
	}

	req := openai.ChatCompletionRequest{
		Model:    modelName,
		Messages: chatMessages,
		Stream:   true,
	}

	resp, err := client.CreateChatCompletionStream(context.Background(), req)
	if err != nil {
		stream <- "Error: " + err.Error()
		close(stream)
		return
	}
	defer resp.Close() //nolint:errcheck // best-effort cleanup

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
