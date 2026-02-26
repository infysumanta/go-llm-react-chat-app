package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"

	_ "modernc.org/sqlite"
)

func InitDB() (*sql.DB, error) {
	dbPath := "chat.db"
	if dir := os.Getenv("DATA_DIR"); dir != "" {
		os.MkdirAll(dir, 0755)
		dbPath = filepath.Join(dir, "chat.db")
	}

	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Enable WAL mode and foreign keys
	pragmas := []string{
		"PRAGMA journal_mode=WAL",
		"PRAGMA foreign_keys=ON",
	}
	for _, p := range pragmas {
		if _, err := db.Exec(p); err != nil {
			return nil, fmt.Errorf("failed to set pragma %q: %w", p, err)
		}
	}

	if err := migrate(db); err != nil {
		return nil, fmt.Errorf("migration failed: %w", err)
	}

	log.Println("Database initialized:", dbPath)
	return db, nil
}

func migrate(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS conversations (
		id         TEXT PRIMARY KEY,
		title      TEXT NOT NULL DEFAULT 'New Chat',
		model      TEXT NOT NULL DEFAULT 'gpt-5-nano',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS messages (
		id              TEXT PRIMARY KEY,
		conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
		role            TEXT NOT NULL CHECK(role IN ('system','user','assistant')),
		content         TEXT NOT NULL,
		model           TEXT,
		created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);

	CREATE TABLE IF NOT EXISTS channels (
		id            TEXT PRIMARY KEY,
		name          TEXT NOT NULL,
		type          TEXT NOT NULL DEFAULT 'telegram',
		bot_token     TEXT NOT NULL,
		system_prompt TEXT NOT NULL DEFAULT '',
		model         TEXT NOT NULL DEFAULT 'gpt-5-nano',
		enabled       INTEGER NOT NULL DEFAULT 1,
		bot_username  TEXT DEFAULT '',
		created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	`
	if _, err := db.Exec(schema); err != nil {
		return err
	}

	// Add columns to existing tables (ignore errors for already-existing columns)
	alterStmts := []string{
		"ALTER TABLE conversations ADD COLUMN channel TEXT NOT NULL DEFAULT 'web'",
		"ALTER TABLE conversations ADD COLUMN channel_id TEXT DEFAULT NULL",
		"ALTER TABLE conversations ADD COLUMN telegram_chat_id INTEGER DEFAULT NULL",
		"ALTER TABLE messages ADD COLUMN channel TEXT NOT NULL DEFAULT 'web'",
	}
	for _, stmt := range alterStmts {
		db.Exec(stmt) // ignore "duplicate column" errors
	}

	return nil
}
