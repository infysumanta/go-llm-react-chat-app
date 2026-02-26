import { Route, Routes } from "react-router-dom";
import BotDetail from "./pages/BotDetail";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";

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
