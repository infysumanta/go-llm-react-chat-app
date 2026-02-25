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
