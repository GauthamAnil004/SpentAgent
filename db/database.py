import sqlite3
import os

DB_PATH = "./spendagent.db"

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    # Personal expenses table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS personal_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Friend ledger table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS friend_ledger (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            friend_name TEXT NOT NULL,
            amount REAL NOT NULL,
            type TEXT NOT NULL,
            description TEXT,
            date TEXT NOT NULL,
            expected_return_date TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
