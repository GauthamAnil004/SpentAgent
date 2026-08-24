import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_connection():
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set.")
    
    if db_url.startswith("postgres://"):
        db_url = db_url.replace("postgres://", "postgresql://", 1)
        
    conn = psycopg2.connect(db_url, cursor_factory=RealDictCursor)
    return conn

def init_db():
    try:
        conn = get_connection()
        cursor = conn.cursor()

        # Personal expenses table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS personal_expenses (
                id SERIAL PRIMARY KEY,
                amount DOUBLE PRECISION NOT NULL,
                category VARCHAR(255) NOT NULL,
                description TEXT,
                date VARCHAR(50) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # OTPs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS otps (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) NOT NULL,
                otp_code VARCHAR(20) NOT NULL,
                expiry TIMESTAMP NOT NULL,
                used INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Friend ledger table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS friend_ledger (
                id SERIAL PRIMARY KEY,
                friend_name VARCHAR(255) NOT NULL,
                amount DOUBLE PRECISION NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                date VARCHAR(50) NOT NULL,
                expected_return_date VARCHAR(50),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        conn.commit()
        cursor.close()
        conn.close()
        print("Postgres database initialized successfully.")
    except Exception as e:
        print(f"Warning: Database initialization skipped or failed: {e}")
