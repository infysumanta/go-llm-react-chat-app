import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useChannels } from "../hooks/useChannels";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { channels, createChannel, updateChannel, deleteChannel } =
    useChannels();
  const [models, setModels] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [formName, setFormName] = useState("");
  const [formToken, setFormToken] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [formModel, setFormModel] = useState("gpt-5-nano");
  const [formEnabled, setFormEnabled] = useState(true);

  useEffect(() => {
    fetch("/api/models")
      .then((r) => r.json())
      .then(setModels)
      .catch(() => {});
  }, []);

  const resetForm = () => {
    setFormName("");
    setFormToken("");
    setFormPrompt("");
    setFormModel("gpt-5-nano");
    setFormEnabled(true);
    setError("");
  };

  const handleAdd = () => {
    resetForm();
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (ch) => {
    setFormName(ch.name);
    setFormToken("");
    setFormPrompt(ch.systemPrompt);
    setFormModel(ch.model);
    setFormEnabled(ch.enabled);
    setEditingId(ch.id);
    setShowForm(true);
    setError("");
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await updateChannel(editingId, {
          name: formName,
          systemPrompt: formPrompt,
          model: formModel,
          enabled: formEnabled,
        });
      } else {
        if (!formToken) {
          setError("Bot token is required");
          setSaving(false);
          return;
        }
        await createChannel({
          name: formName,
          botToken: formToken,
          systemPrompt: formPrompt,
          model: formModel,
        });
      }
      handleCancel();
    } catch (err) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this bot? It will stop responding immediately."))
      return;
    try {
      await deleteChannel(id);
    } catch {
      setError("Failed to delete bot");
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-gray-800">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-lg font-semibold">Telegram Bots</h1>
            <p className="text-xs text-gray-500">
              Manage your Telegram bot integrations
            </p>
          </div>
        </header>

        {/* Content */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <h2 className="text-sm font-medium text-gray-300">
                {editingId ? "Edit Bot" : "Add New Bot"}
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Bot Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Support Bot"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Bot Token
                  </label>
                  <input
                    type="password"
                    value={formToken}
                    onChange={(e) => setFormToken(e.target.value)}
                    placeholder="Paste your Telegram bot token"
                    required
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Get a token from @BotFather on Telegram
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  System Prompt
                </label>
                <textarea
                  value={formPrompt}
                  onChange={(e) => setFormPrompt(e.target.value)}
                  placeholder="You are a helpful assistant..."
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Model
                </label>
                <select
                  value={formModel}
                  onChange={(e) => setFormModel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
                >
                  {models.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {editingId && (
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEnabled}
                      onChange={(e) => setFormEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-600" />
                  </label>
                  <span className="text-sm text-gray-300">Enabled</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                      ? "Update Bot"
                      : "Add Bot"}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium text-gray-300 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              {channels.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-3 text-gray-600"
                  >
                    <path d="M21.198 2.433a2.242 2.242 0 0 0-1.022.215l-16.5 8.25a2.25 2.25 0 0 0 .126 4.073l4.5 1.5 2.25 6a1.5 1.5 0 0 0 2.652.378L15.5 19.5l4.5 1.5a2.25 2.25 0 0 0 2.965-1.768l1.5-15A2.25 2.25 0 0 0 21.198 2.433z" />
                  </svg>
                  <p className="text-sm">No Telegram bots configured yet.</p>
                  <p className="text-xs mt-1">
                    Add a bot to start receiving messages on Telegram.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {channels.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-200 truncate">
                              {ch.name}
                            </span>
                            {ch.botUsername && (
                              <span className="text-xs text-gray-500">
                                @{ch.botUsername}
                              </span>
                            )}
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                ch.enabled
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${ch.enabled ? "bg-emerald-400" : "bg-gray-500"}`}
                              />
                              {ch.enabled ? "Running" : "Stopped"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 truncate">
                            {ch.model} &middot;{" "}
                            {ch.systemPrompt
                              ? ch.systemPrompt.slice(0, 80) +
                                (ch.systemPrompt.length > 80 ? "..." : "")
                              : "No system prompt"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-3">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/settings/${ch.id}`)
                            }
                            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                            title="View conversations"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEdit(ch)}
                            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(ch.id)}
                            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleAdd}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 rounded-lg text-sm font-medium text-white transition-colors cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add Telegram Bot
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
