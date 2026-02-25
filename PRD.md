You want:

* **Go backend**
* **React frontend**
* **Streaming LLM responses**
* **OpenAI API key from environment**
* **Single binary deployment**
* Clear **folder structure + code + commands**

Below is a production-grade minimal architecture.

---

# ✅ Architecture

```
User (Browser)
    ↓
Go Server (serves React static files + API)
    ↓
OpenAI Streaming API (SSE)
```

We’ll:

* Build React app
* Embed React build into Go binary
* Stream tokens using `http.Flusher`
* Read `OPENAI_API_KEY` from env
* Ship one compiled Go binary

---

# 📁 Project Structure

```
llm-chat-app/
│
│── main.go
│── openai.go
│── go.mod
│── go.sum
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── build.sh
```

---

# 1️⃣ Backend (Go)

## backend/go.mod

```go
module llm-chat-app

go 1.22

require github.com/sashabaranov/go-openai v1.30.0
```

---

## backend/openai.go

```go
package main

import (
	"context"
	"os"

	openai "github.com/sashabaranov/go-openai"
)

func StreamChat(prompt string, stream chan string) error {
	client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

	req := openai.ChatCompletionRequest{
		Model: openai.GPT4oMini,
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
		return err
	}
	defer resp.Close()

	for {
		response, err := resp.Recv()
		if err != nil {
			close(stream)
			return nil
		}

		if len(response.Choices) > 0 {
			stream <- response.Choices[0].Delta.Content
		}
	}
}
```

---

## backend/main.go

```go
package main

import (
	"embed"
	"encoding/json"
	"net/http"
)

//go:embed dist/*
var staticFiles embed.FS

type ChatRequest struct {
	Message string `json:"message"`
}

func main() {

	http.Handle("/", http.FileServer(http.FS(staticFiles)))

	http.HandleFunc("/api/chat", func(w http.ResponseWriter, r *http.Request) {

		var req ChatRequest
		json.NewDecoder(r.Body).Decode(&req)

		w.Header().Set("Content-Type", "text/plain")
		w.Header().Set("Transfer-Encoding", "chunked")

		flusher, ok := w.(http.Flusher)
		if !ok {
			http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
			return
		}

		stream := make(chan string)

		go StreamChat(req.Message, stream)

		for chunk := range stream {
			w.Write([]byte(chunk))
			flusher.Flush()
		}
	})

	http.ListenAndServe(":8080", nil)
}
```

---

# 2️⃣ Frontend (React + Vite)

## frontend/package.json

```json
{
  "name": "llm-chat-ui",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

---

## frontend/vite.config.js

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../backend/dist',
    emptyOutDir: true
  }
})
```

---

## frontend/src/App.jsx

```jsx
import { useState } from "react";

function App() {
  const [message, setMessage] = useState("");
  const [response, setResponse] = useState("");

  const sendMessage = async () => {
    setResponse("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setResponse(prev => prev + decoder.decode(value));
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>LLM Chat</h1>
      <textarea
        rows={4}
        value={message}
        onChange={e => setMessage(e.target.value)}
      />
      <br />
      <button onClick={sendMessage}>Send</button>

      <pre>{response}</pre>
    </div>
  );
}

export default App;
```

---

## frontend/src/main.jsx

```jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

# 3️⃣ Build Steps

## Step 1: Set OpenAI Key

```bash
export OPENAI_API_KEY=sk-xxxxx
```

Windows:

```powershell
setx OPENAI_API_KEY "sk-xxxxx"
```

---

## Step 2: Install frontend deps

```bash
cd frontend
npm install
```

---

## Step 3: Build frontend

```bash
npm run build
```

This outputs static files into:

```
backend/dist/
```

---

## Step 4: Build Go binary

```bash
cd backend
go mod tidy
go build -o llm-chat
```

---

# 🚀 Run

```bash
./llm-chat
```

Open:

```
http://localhost:8080
```

---

# 🎯 Result

You now have:

* Streaming responses
* React UI
* OpenAI key from env
* Static files embedded
* Single Go binary deployment
* No Node server in production

---

# 🔥 Production Build (Single Binary, Cross Compile)

Linux:

```bash
GOOS=linux GOARCH=amd64 go build -o llm-chat
```

Mac:

```bash
GOOS=darwin GOARCH=arm64 go build -o llm-chat
```

---

# ⚡ If You Want More

I can next provide:

* Multi-conversation memory
* Tool calling support
* WebSocket streaming instead of chunked
* Dockerfile
* Reverse proxy with Caddy
* Auth + rate limiting
* Production logging + structured errors
* Multi-model support (OpenAI + Anthropic + Gemini)

Tell me which direction you want.
