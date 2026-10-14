import sqlite3
import os

DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "database")
DB_PATH = os.path.join(DB_DIR, "medtwin.db")

def get_db_connection():
    """Returns a connection to the SQLite database with row factory enabled."""
    os.makedirs(DB_DIR, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initializes the database schema if tables do not exist."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Create Resource Status Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS resource_status (
        resource_name TEXT PRIMARY KEY,
        display_name TEXT NOT NULL,
        current_value REAL NOT NULL,
        unit TEXT NOT NULL,
        status TEXT NOT NULL,
        total_capacity REAL NOT NULL,
        trend TEXT NOT NULL,
        trend_value REAL NOT NULL
    );
    """)

    # 2. Create Time-Series Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS time_series_data (
        timestamp TEXT PRIMARY KEY,
        bed_occupancy_rate REAL NOT NULL,
        oxygen_reserve_liters REAL NOT NULL,
        medicine_stock_count REAL NOT NULL,
        staff_coverage_pct REAL NOT NULL
    );
    """)

    # 3. Create Alerts Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource TEXT NOT NULL,
        status TEXT NOT NULL, -- 'critical', 'urgent', 'warning'
        message TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        acknowledged INTEGER NOT NULL DEFAULT 0,
        resolved INTEGER NOT NULL DEFAULT 0
    );
    """)

    # 4. Create Literature Papers Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS literature_papers (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        year INTEGER NOT NULL,
        journal TEXT NOT NULL,
        tags TEXT NOT NULL, -- comma separated tags
        methodology TEXT NOT NULL,
        limitations TEXT NOT NULL,
        gap TEXT NOT NULL,
        mapping TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()
    print("Database schema initialized successfully.")

if __name__ == "__main__":
    init_db()
