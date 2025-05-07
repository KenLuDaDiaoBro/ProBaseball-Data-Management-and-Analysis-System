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

# 🔹 遍歷 Players_Data 目錄
base_path = "C:/Users/afatf/Desktop/ProBaseball-Data-Management-and-Analysis-System/Project KL/Players_Data"
if not os.path.exists(base_path):
    print(f"❌ 找不到資料夾: {base_path}")
    exit(1)
              
# 🔹 初始化球隊統計數據
team_stats = {}

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
                            Player = player.get("Player")
                            ID = player.get("ID")
                            Year = player.get("Year")
                            Team = player.get("Team")
                            Division = player.get("Division")
                            Type = player.get("Type")  # batter 或 pitcher
                            if Type == "Batter":
                                table_name = "batter"
                            elif Type == "Pitcher":
                                table_name = "pitcher"
                            else:
                                print(f"⚠️ 未知球員類型: {Type}，跳過 {Player}")
                                continue
                            
                            # 🔹 檢查是否已存在相同 ID, Year, Team
                            cursor.execute(
                                f"SELECT 1 FROM {table_name} WHERE ID=%s AND Year=%s AND Team=%s LIMIT 1",  
                                (ID, Year, Team)
                            )
                            if cursor.fetchone():
                                continue
                            
                            # 🔹 確認 player_type 並插入對應的 Table
                            if table_name == "batter":
                                PA = player.get("PA") or 0
                                AB = player.get("AB") or 0
                                H = player.get("H") or 0
                                H2 = player.get("2B") or 0
                                H3 = player.get("3B") or 0
                                HR = player.get("HR") or 0
                                RBI = player.get("RBI") or 0
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
                                GF = player.get("G/F") or 0
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
                                    INSERT INTO {table_name} (Name, ID, Year, Team, Division, Type, PA, AB, H, H2, H3, HR, RBI,
                                    SO, BB, SB, CS, AVG, OBP, SLG, OPS, Chase, Whiff, GB, FB, GF, Sprint, AVGZ1, AVGZ2,
                                    AVGZ3, AVGZ4, AVGZ5, AVGZ6, AVGZ7, AVGZ8, AVGZ9, AVGZLU, AVGZRU, AVGZLD, AVGZRD) 
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                                """, ( Player, ID, Year, Team, Division, Type, PA, AB, H, H2, H3, HR, RBI,
                                      SO, BB, SB, CS, AVG, OBP, SLG, OPS, CH, WH, GB, FB, GF, Sprint, AVGZ1, AVGZ2,
                                      AVGZ3, AVGZ4, AVGZ5, AVGZ6, AVGZ7, AVGZ8, AVGZ9, AVGZLU, AVGZRU, AVGZLD, AVGZRD))

                                print(f"✅ 插入 {Player} 到 {table_name},球隊: {Team} ,年份: {Year}")

                            elif table_name == "pitcher":
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
                                GF = player.get("G/F") or 0
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
                                    INSERT INTO {table_name} (Name, ID, Year, Team, Division, Type, W, L, ERA, IP, H, R, ER,
                                    HR, BB, SO, WHIP, Chase, Whiff, GB, FB, GF, PZ1, PZ2, PZ3, PZ4, PZ5, PZ6, PZ7,
                                    PZ8, PZ9, PZLU, PZRU, PZLD, PZRD) 
                                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 
                                    %s, %s, %s, %s, %s, %s)
                                """, (Player, ID, Year, Team, Division, Type, W, L, ERA, IP, H, R, ER,
                                      HR, BB, SO, WHIP, CH, WH, GB, FB, GF, PZ1, PZ2, PZ3, PZ4, PZ5, PZ6, PZ7,
                                      PZ8, PZ9, PZLU, PZRU, PZLD, PZRD))
                                
                                print(f"✅ 插入 {Player} 到 {table_name}，球隊: {Team} ,年份: {Year}    ")

                            else:
                                continue

                            # 🔹 統計球員數據到球隊
                        for player in data:
                            Team = player.get("Team")
                            Year = player.get("Year")
                            Type = player.get("Type")  # batter 或 pitcher
                            
                            cursor.execute(
                                f"SELECT 1 FROM team WHERE Year=%s AND Team=%s LIMIT 1",  
                                (Year, Team)
                            )
                            if cursor.fetchone() or "Team" in Team:
                                continue
                            
                            key = (Year, Team)
                            
                            if key not in team_stats:
                                team_stats[key] = {
                                    "Team": Team,
                                    "Year": Year,
                                    "Total_PA": 0,
                                    "Total_AB": 0,
                                    "Total_H": 0,
                                    "Total_2B": 0,
                                    "Total_3B": 0,
                                    "Total_HR": 0,
                                    "Total_RBI": 0,
                                    "Total_SO": 0,
                                    "Total_BB": 0,
                                    "Total_SB": 0,
                                    "Total_CS": 0,
                                    "Total_AVG": 0,
                                    "Total_OBP": 0,
                                    "Total_SLG": 0,
                                    "Total_OPS": 0,
                                    "Total_Chase": 0,
                                    "Total_Whiff": 0,
                                    "Total_GB": 0,
                                    "Total_FB": 0,
                                    "Total_GF": 0,
                                    
                                    "Total_W": 0,
                                    "Total_L": 0,
                                    "Total_ERA": 0,
                                    "Total_IP": 0,
                                    "Total_PH": 0,
                                    "Total_R": 0,
                                    "Total_ER": 0,
                                    "Total_PHR": 0,
                                    "Total_PBB": 0,
                                    "Total_BB9": 0,
                                    "Total_PSO": 0,
                                    "Total_K9": 0,
                                    "Total_WHIP": 0,
                                    "Total_PChase": 0,
                                    "Total_PWhiff": 0,
                                    "Total_PGB": 0,
                                    "Total_PFB": 0,
                                    "Total_PGF": 0,
                                }
                                print(f"✅ 新球隊統計: {Team} ({Year})")

                            # 累加球員數據
                            if Type == "Batter":
                                team_stats[key]["Total_PA"] += int(player.get("PA", 0))
                                team_stats[key]["Total_AB"] += int(player.get("AB", 0))
                                team_stats[key]["Total_H"] += int(player.get("H", 0))
                                team_stats[key]["Total_2B"] += int(player.get("2B", 0))
                                team_stats[key]["Total_3B"] += int(player.get("3B", 0))
                                team_stats[key]["Total_HR"] += int(player.get("HR", 0))
                                team_stats[key]["Total_RBI"] += int(player.get("RBI", 0))
                                team_stats[key]["Total_SO"] += int(player.get("SO", 0))
                                team_stats[key]["Total_BB"] += int(player.get("BB", 0))
                                team_stats[key]["Total_SB"] += int(player.get("SB", 0))
                                team_stats[key]["Total_CS"] += int(player.get("CS", 0))
                                team_stats[key]["Total_OBP"] += float(player.get("OBP", 0)) * int(player.get("PA", 0))
                                team_stats[key]["Total_Chase"] += float(player.get("Chase%", 0)) * int(player.get("PA", 0))
                                team_stats[key]["Total_Whiff"] += float(player.get("Whiff%", 0)) * int(player.get("PA", 0))
                                team_stats[key]["Total_GB"] += float(player.get("GB%", 0)) * int(player.get("PA", 0))
                                team_stats[key]["Total_FB"] += float(player.get("FB%", 0)) * int(player.get("PA", 0))
                                
                            elif Type == "Pitcher":
                                team_stats[key]["Total_W"] += int(player.get("Wins", 0))
                                team_stats[key]["Total_L"] += int(player.get("Losses", 0))
                                IP = float(player.get("IP", 0))
                                outs = int(IP) * 3 + (IP - int(IP)) * 10  # 將 IP 轉換為出局數
                                team_stats[key]["Total_IP"] += outs
                                team_stats[key]["Total_PH"] += int(player.get("Hits", 0))
                                team_stats[key]["Total_R"] += int(player.get("Runs", 0))
                                team_stats[key]["Total_ER"] += int(player.get("ER", 0))
                                team_stats[key]["Total_PHR"] += int(player.get("HR", 0))
                                team_stats[key]["Total_PBB"] += int(player.get("BB", 0))
                                team_stats[key]["Total_PSO"] += int(player.get("SO", 0))
                                team_stats[key]["Total_WHIP"] += float(player.get("WHIP", 0)) * outs / 3
                                team_stats[key]["Total_PChase"] += float(player.get("Chase%", 0)) * outs
                                team_stats[key]["Total_PWhiff"] += float(player.get("Whiff%", 0)) * outs
                                team_stats[key]["Total_PGB"] += float(player.get("GB%", 0)) * outs
                                team_stats[key]["Total_PFB"] += float(player.get("FB%", 0)) * outs

                    except json.JSONDecodeError:
                        print(f"❌ JSON 解析錯誤: {json_file}")
                        
for Team, stats in team_stats.items():
                            
    if stats["Total_AB"] == 0: stats["Total_AB"] = 1
    if stats["Total_PA"] == 0: stats["Total_PA"] = 1
    
    stats["Total_AVG"] = round(stats["Total_H"] / stats["Total_AB"], 3)
    stats["Total_OBP"] = round(stats["Total_OBP"] / stats["Total_PA"] , 3)
    stats["Total_SLG"] = round((stats["Total_H"] + stats["Total_2B"] + 2 * stats["Total_3B"] + 3 * stats["Total_HR"]) / stats["Total_AB"], 3)
    stats["Total_OPS"] = round(stats["Total_OBP"] + stats["Total_SLG"], 3)
    stats["Total_Chase"] = round(stats["Total_Chase"] / stats["Total_PA"], 3)
    stats["Total_Whiff"] = round(stats["Total_Whiff"] / stats["Total_PA"], 3)
    stats["Total_GB"] = round(stats["Total_GB"] / stats["Total_PA"], 3)
    stats["Total_FB"] = round(stats["Total_FB"] / stats["Total_PA"], 3)
    
    if stats["Total_FB"] == 0: stats["Total_FB"] = 1
        
    stats["Total_GF"] =  round(stats["Total_GB"] / stats["Total_FB"], 2)
    
    if(stats["Total_IP"] != 0):
        stats["Total_ERA"] = round(stats["Total_ER"] / stats["Total_IP"] * 27, 2)
        stats["Total_BB9"] = round(stats["Total_PBB"] / stats["Total_IP"] * 27, 2)
        stats["Total_K9"] = round(stats["Total_PSO"] / stats["Total_IP"] * 27, 2)
        stats["Total_WHIP"] = round(stats["Total_WHIP"] / stats["Total_IP"] * 3, 2)
        stats["Total_PChase"] = round(stats["Total_PChase"] / stats["Total_IP"], 1)
        stats["Total_PWhiff"] = round(stats["Total_PWhiff"] / stats["Total_IP"], 1)
        stats["Total_PGB"] = round(stats["Total_PGB"] / stats["Total_IP"], 1)
        stats["Total_PFB"] = round(stats["Total_PFB"] / stats["Total_IP"], 1)
    
    if(stats["Total_PFB"] == 0): stats["Total_PFB"] = 1
        
    stats["Total_PGF"] = round(stats["Total_PGB"] / stats["Total_PFB"], 2)
    stats["Total_IP"] = round(stats["Total_IP"] // 3 + ((stats["Total_IP"] % 3) / 10), 1)

    cursor.execute(f"""
        INSERT INTO team (
            Team, Year, PA, AB, H, H2, H3, HR, RBI, SO, BB, SB, CS, AVG, OBP, SLG, OPS, Chase, Whiff, GB, FB, GF,
            W, L, ERA, IP, PH, R, ER, PHR, PBB, BB9, PSO, K9, WHIP, PChase, PWhiff, PGB, PFB, PGF
        ) 
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        stats["Team"],
        stats["Year"],
        stats["Total_PA"],
        stats["Total_AB"],
        stats["Total_H"],
        stats["Total_2B"],
        stats["Total_3B"],
        stats["Total_HR"],
        stats["Total_RBI"],
        stats["Total_SO"],
        stats["Total_BB"],
        stats["Total_SB"],
        stats["Total_CS"],
        stats["Total_AVG"],
        stats["Total_OBP"],
        stats["Total_SLG"],
        stats["Total_OPS"],
        stats["Total_Chase"],
        stats["Total_Whiff"],
        stats["Total_GB"],
        stats["Total_FB"],
        stats["Total_GF"],
        stats["Total_W"],
        stats["Total_L"],
        stats["Total_ERA"],
        stats["Total_IP"],  # 已轉換為 0.2, 0.1 格式
        stats["Total_PH"],
        stats["Total_R"],
        stats["Total_ER"],
        stats["Total_PHR"],
        stats["Total_PBB"],
        stats["Total_BB9"],
        stats["Total_PSO"],
        stats["Total_K9"],
        stats["Total_WHIP"],
        stats["Total_PChase"],
        stats["Total_PWhiff"],
        stats["Total_PGB"],
        stats["Total_PFB"],
        stats["Total_PGF"]  # 已限制為小數點後兩位
    ))

print("✅ 球隊統計數據已成功插入資料庫")

# 提交變更
conn.commit()
cursor.close()
conn.close()
print("🎉 所有 JSON 檔案已成功匯入 MySQL")