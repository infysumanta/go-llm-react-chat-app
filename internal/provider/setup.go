package provider

import (
	"log"
	"os"
)

// SetupFromEnv auto-detects available providers from environment variables
// and registers them with the given registry.
func SetupFromEnv(reg *Registry) {
	if key := os.Getenv("OPENAI_API_KEY"); key != "" {
		reg.Register(NewOpenAIProvider(key))
	}

	if key := os.Getenv("ANTHROPIC_API_KEY"); key != "" {
		reg.Register(NewAnthropicProvider(key))
	}

	if key := os.Getenv("GOOGLE_API_KEY"); key != "" {
		reg.Register(NewGoogleProvider(key))
	}

	if key := os.Getenv("GROQ_API_KEY"); key != "" {
		reg.Register(NewGroqProvider(key))
	}

	if key := os.Getenv("MISTRAL_API_KEY"); key != "" {
		reg.Register(NewMistralProvider(key))
	}

	if key := os.Getenv("COHERE_API_KEY"); key != "" {
		reg.Register(NewCohereProvider(key))
	}

	if url := os.Getenv("OLLAMA_BASE_URL"); url != "" {
		reg.Register(NewOllamaProvider(url))
	}

	if url := os.Getenv("LMSTUDIO_BASE_URL"); url != "" {
		reg.Register(NewLMStudioProvider(url))
	}

	names := reg.ProviderNames()
	if len(names) == 0 {
		log.Println("provider: WARNING — no providers configured. Set at least one API key env var.")
	} else {
		log.Printf("provider: active providers: %v", names)
	}
}
