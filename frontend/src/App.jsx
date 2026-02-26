import { Routes, Route } from "react-router-dom";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import BotDetail from "./pages/BotDetail";

function App() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/c/:id" element={<ChatPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/settings/:channelId" element={<BotDetail />} />
    </Routes>
  );
}

export default App;
