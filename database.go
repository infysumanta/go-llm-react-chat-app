package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

func InitDB() (*sql.DB, error) {
	db, err := sql.Open("sqlite", "chat.db")
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

	log.Println("Database initialized: chat.db")
	return db, nil
}

func migrate(db *sql.DB) error {
	schema := `
	CREATE TABLE IF NOT EXISTS conversations (
		id         TEXT PRIMARY KEY,
		title      TEXT NOT NULL DEFAULT 'New Chat',
		model      TEXT NOT NULL DEFAULT 'gpt-4o-mini',
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
	`
	_, err := db.Exec(schema)
	return err
}
