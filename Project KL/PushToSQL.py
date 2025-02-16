import os
import json
import mysql.connector

# 🔹 連接 MySQL
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="Ken20040410",
    database="player"
)
cursor = conn.cursor()

ID = 0

# 🔹 遍歷 Players_Data 目錄
base_path = "C:/Users/afatf/Desktop/ProBaseball-Data-Management-and-Analysis-System/Project KL/Players_Data"
if not os.path.exists(base_path):
    print(f"❌ 找不到資料夾: {base_path}")
    exit(1)

for year in os.listdir(base_path):  # 年份資料夾（2022, 2023, 2024）
    year_path = os.path.join(base_path, year)
    if not os.path.isdir(year_path):
        continue

    for division in os.listdir(year_path):  # 分區（American League East / National League West）
        division_path = os.path.join(year_path, division)
        if not os.path.isdir(division_path):
            continue

        for team in os.listdir(division_path):  # 球隊（Yankees / Dodgers / Rays）
            team_path = os.path.join(division_path, team)
            if not os.path.isdir(team_path):
                continue

            json_file = os.path.join(team_path, "Player_Data.json")
            if os.path.exists(json_file):
                with open(json_file, "r", encoding="utf-8") as file:
                    try:
                        data = json.load(file)  # 讀取 JSON
                        if not isinstance(data, list):
                            print(f"⚠️ JSON 格式錯誤: {json_file}")
                            continue

                        for player in data:
                            ID += 1
                            Player = player.get("Player")
                            Year = player.get("Year")
                            Team = player.get("Team")
                            Division = player.get("Division")
                            Type = player.get("Type")  # batter 或 pitcher
                            
                            # 🔹 確認 player_type 並插入對應的 Table
                            if Type == "Batter":
                                table_name = "batter"
                                PA = player.get("PA") or 0
                                AB = player.get("AB") or 0
                                H = player.get("H") or 0
                                H2 = player.get("2B") or 0
                                H3 = player.get("3B") or 0
                                HR = player.get("HR") or 0
                                RBL = player.get("RBL") or 0
                                SO = player.get("SO") or 0
                                BB = player.get("BB") or 0
                                SB = player.get("SB") or 0
                                CS = player.get("CS") or 0
                                AVG = player.get("AVG") or 0
                                OBP = player.get("OBP") or 0
                                SLG = player.get("SLG") or 0
                                OPS = player.get("OPS") or 0
                                CH = player.get("Chase%") or 0
                                WH = player.get("Whiff%") or 0
                                GB = player.get("GB%") or 0
                                FB = player.get("FB%") or 0
                                GF = player.get("G/F")
                                Sprint = player.get("Sprint") or 0
                                AVGZ = player.get("AVG_Zone")
                                AVGZ1 = AVGZ[0]
                                AVGZ2 = AVGZ[1]
                                AVGZ3 = AVGZ[2]
                                AVGZ4 = AVGZ[3]
                                AVGZ5 = AVGZ[4]
                                AVGZ6 = AVGZ[5]
                                AVGZ7 = AVGZ[6]
                                AVGZ8 = AVGZ[7]
                                AVGZ9 = AVGZ[8]
                                AVGZLU = AVGZ[9]
                                AVGZRU = AVGZ[10]
                                AVGZLD = AVGZ[11]
                                AVGZRD = AVGZ[12]
                                
                                # 🔹 插入資料
                                cursor.execute(f"""
                                    INSERT INTO {table_name} (ID, Name, Year, Team, Division, Type, PA, AB, H, H2, H3, HR, RBL,
                                    SO, BB, SB, CS, AVG, OBP, SLG, OPS, Chase, Whiff, GB, FB, GF, Sprint, AVGZ1, AVGZ2,
                                    AVGZ3, AVGZ4, AVGZ5, AVGZ6, AVGZ7, AVGZ8, AVGZ9, AVGZLU, AVGZRU, AVGZLD, AVGZRD) 
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                """, (ID, Player, Year, Team, Division, Type, PA, AB, H, H2, H3, HR, RBL,
                                      SO, BB, SB, CS, AVG, OBP, SLG, OPS, CH, WH, GB, FB, GF, Sprint, AVGZ1, AVGZ2,
                                      AVGZ3, AVGZ4, AVGZ5, AVGZ6, AVGZ7, AVGZ8, AVGZ9, AVGZLU, AVGZRU, AVGZLD, AVGZRD))

                                print(f"✅ 插入 {Player} 到 {table_name}，球隊: {Team}")

                            elif Type == "Pitcher":
                                table_name = "pitcher"
                                W = player.get("Wins") or 0
                                L = player.get("Losses") or 0
                                ERA = player.get("ERA") or 0
                                IP = player.get("IP") or 0
                                H = player.get("Hits") or 0
                                R = player.get("Runs") or 0
                                ER = player.get("ER") or 0
                                HR = player.get("HR") or 0
                                BB = player.get("BB") or 0
                                SO = player.get("SO") or 0
                                WHIP = player.get("WHIP") or 0
                                CH = player.get("Chase%") or 0
                                WH = player.get("Whiff%") or 0
                                GB = player.get("GB%") or 0
                                FB = player.get("FB%") or 0
                                GF = player.get("G/F")
                                PZ = player.get("Pitch_Zone%")
                                PZ1 = PZ[0]
                                PZ2 = PZ[1]
                                PZ3 = PZ[2]
                                PZ4 = PZ[3]
                                PZ5 = PZ[4]
                                PZ6 = PZ[5]
                                PZ7 = PZ[6]
                                PZ8 = PZ[7]
                                PZ9 = PZ[8]
                                PZLU = PZ[9]
                                PZRU = PZ[10]
                                PZLD = PZ[11]
                                PZRD = PZ[12]
                                
                                # 🔹 插入資料
                                cursor.execute(f"""
                                    INSERT INTO {table_name} (ID, Name, Year, Team, Division, Type, W, L, ERA, IP, H, R, ER,
                                    HR, BB, SO, WHIP, Chase, Whiff, GB, FB, GF, PZ1, PZ2, PZ3, PZ4, PZ5, PZ6, PZ7,
                                    PZ8, PZ9, PZLU, PZRU, PZLD, PZRD) 
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                                    %s, %s, %s, %s, %s, %s)
                                """, (ID, Player, Year, Team, Division, Type, W, L, ERA, IP, H, R, ER,
                                      HR, BB, SO, WHIP, CH, WH, GB, FB, GF, PZ1, PZ2, PZ3, PZ4, PZ5, PZ6, PZ7,
                                      PZ8, PZ9, PZLU, PZRU, PZLD, PZRD))

                                print(f"✅ 插入 {Player} 到 {table_name}，球隊: {Team}")

                            else:
                                print(f"⚠️ 未知球員類型: {Type}，跳過 {Player}")
                                continue

                    except json.JSONDecodeError:
                        print(f"❌ JSON 解析錯誤: {json_file}")

# 提交變更
conn.commit()
cursor.close()
conn.close()
print("🎉 所有 JSON 檔案已成功匯入 MySQL")