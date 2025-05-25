import pymysql
import pandas as pd
from pybaseball import statcast
from datetime import datetime, timedelta
from tqdm import tqdm
import math

def clean(val):
    return None if pd.isna(val) or (isinstance(val, float) and math.isnan(val)) else val

pd.set_option('display.max_columns', None)

# 設定 MySQL 連線
db = pymysql.connect(
    host="localhost",
    user="root",
    password="Ken20040410",
    database="player",
    charset='utf8mb4',
    cursorclass=pymysql.cursors.DictCursor
)

def fetch_and_store_matchups_for_day(day):
    print(f"Fetching matchups for {day} ...")
    df = statcast(start_dt=day, end_dt=day)

    print(f"Fetched {len(df)} rows.")

    if df.empty:
        return

    df = df[df["events"].notnull()]
    df = df[df["game_type"] == "R"]  # ✅ 過濾掉非正規賽
    df = df.dropna(subset=["game_date", "pitcher", "batter"])

    insert_query = """
        INSERT IGNORE INTO matchup
        (game_date, pitcher_id, batter_id, pitch_type, description, release_speed, zone, events)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
    """

    with db.cursor() as cursor:
        for i, row in tqdm(df.iterrows(), total=len(df), desc=f"Inserting for {day}"):
            try:
                cursor.execute(insert_query, (
                    row["game_date"],
                    int(row["pitcher"]),
                    int(row["batter"]),
                    row.get("pitch_type"),
                    row.get("description"),
                    row.get("release_speed"),
                    row.get("zone"),
                    row.get("events")
                ))
            except Exception as e:
                print(f"❌ Error at row {i}: {e}")
                print("Row content:")
                print(row[["game_date", "pitcher", "batter", "pitch_type", "release_speed", "zone", "events", "description"]])
                
                user_input = input("是否仍要保留這筆資料？(Y/N): ").strip().lower()
                if user_input == "y":
                    try:
                        cursor.execute(insert_query, (
                            clean(row["game_date"]),
                            clean(row["pitcher"]),
                            clean(row["batter"]),
                            clean(row.get("pitch_type")),
                            clean(row.get("description")),
                            clean(row.get("release_speed")),
                            clean(row.get("zone")),
                            clean(row.get("events"))
                        ))
                        print("✅ 已嘗試插入轉換後的資料。")
                    except Exception as e2:
                        print(f"⚠️ 插入仍然失敗：{e2}")
                else:
                    print("⏭️ 已略過這筆資料。")
                
        db.commit()
        print(f"Inserted {len(df)} rows for {day} (duplicates skipped).\n")

def fetch_and_store_all_matchups(start, end):
    start_date = datetime.strptime(start, "%Y-%m-%d")
    end_date = datetime.strptime(end, "%Y-%m-%d")

    current = start_date
    while current <= end_date:
        fetch_and_store_matchups_for_day(current.strftime("%Y-%m-%d"))
        current += timedelta(days=1)

# 範例：抓 2024 年開季後所有資料
if __name__ == "__main__":
    fetch_and_store_all_matchups("2023-09-18", "2024-12-31")
