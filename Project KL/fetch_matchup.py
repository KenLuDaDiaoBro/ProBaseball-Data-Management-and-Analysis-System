import pymysql
import pandas as pd
from pybaseball import statcast
from datetime import datetime

# 設定 MySQL 連線
db = pymysql.connect(
    host="localhost",
    user="root",
    password="Ken20040410",
    database="player",
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

def fetch_and_store_all_matchups(start="2024-03-28", end="2024-12-28"):
    print(f"Fetching all matchups from {start} to {end} ...")
    df = statcast(start_dt=start, end_dt=end)

    print(f"Fetched {len(df)} rows.")

    if df.empty:
        return

    # 過濾我們需要的欄位
    df = df[["game_date", "pitcher", "batter", "pitch_type", "description", "release_speed", "zone"]]
    df = df.dropna(subset=["pitcher", "batter", "game_date"])

    insert_query = """
        INSERT IGNORE INTO matchup
        (game_date, pitcher_id, batter_id, pitch_type, description, release_speed, zone)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """

    with db.cursor() as cursor:
        for _, row in df.iterrows():
            cursor.execute(insert_query, (
                row["game_date"],
                int(row["pitcher"]),
                int(row["batter"]),
                row["pitch_type"],
                row["description"],
                row["release_speed"],
                row["zone"]
            ))
        db.commit()

    print(f"Inserted {len(df)} rows to database (duplicates skipped automatically).")

# 範例：抓 2024 年開季後所有資料
if __name__ == "__main__":
    fetch_and_store_all_matchups("2024-03-28")
