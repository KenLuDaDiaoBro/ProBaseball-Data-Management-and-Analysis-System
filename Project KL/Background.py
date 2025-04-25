from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from collections import defaultdict

app = Flask(__name__)
CORS(app)  # 允許 React 前端請求 API

# 設定 MySQL 連線
db_config = {
    "host": "localhost",      # MySQL 伺服器地址
    "user": "root",           # 你的 MySQL 用戶名
    "password": "Ken20040410",  # 你的 MySQL 密碼
    "database": "player",     # 你的資料庫名稱
}

# 取得所有球員名稱
@app.route('/api/players', methods=['GET'])
def get_players():
    try:
        # 連接 MySQL
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)  # 讓回傳資料變成 dict 格式

        # 查詢投手和打者的名稱
        cursor.execute("SELECT ANY_VALUE(Name) AS Name , id FROM pitcher GROUP BY id;")  
        pitchers = cursor.fetchall()

        cursor.execute("SELECT ANY_VALUE(Name) AS Name , id FROM batter GROUP BY id;")  
        batters = cursor.fetchall()
        
        # 合併結果
        players = pitchers + batters

        # 關閉資料庫連線
        cursor.close()
        conn.close()

        return jsonify(players)  # 回傳 JSON 格式的球員名稱

    except mysql.connector.Error as err:
        print("Database error:", err)
        return jsonify({"error": "Database connection failed"}), 500
    
@app.route("/api/teams", methods=["GET"])
def get_teams():
    """回傳所有在 pitcher/batter 兩張表中出現過且不含 'Teams' 的 distinct Team 代號"""
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        # 取 pitcher, batter 兩張表的所有 distinct Team，並做 union
        cursor.execute(
            "SELECT DISTINCT Team FROM pitcher "
            "UNION "
            "SELECT DISTINCT Team FROM batter;"
        )
        rows = cursor.fetchall()

        # 把空值、含 'Teams' 的字串過濾掉，然後去重排序
        codes = sorted({
            r[0] for r in rows
            if r[0] and "Teams" not in r[0]
        })

        cursor.close()
        conn.close()

        return jsonify([{"code": c, "name": c} for c in codes])
    except mysql.connector.Error as err:
        print("Database error in /api/teams:", err)
        return jsonify({"error": "Database connection failed"}), 500

@app.route('/api/players_stats', methods=['GET'])
def get_all_players_stats():
    year = request.args.get('year')  # 從 URL 參數取得 year，例如 ?year=2023

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # 打者數據
        batter_query = '''
            SELECT Year, Team, Type, OPS, AVG, SLG, OBP, id
            FROM batter
            WHERE Year = %s;
        '''
        cursor.execute(batter_query, (year,))
        batters = cursor.fetchall()

        # 投手數據
        pitcher_query = '''
            SELECT Year, Team, Type, IP, ERA, WHIP, SO, BB, id,
                ROUND(
                    SO / NULLIF(
                        (FLOOR(IP) + ((IP - FLOOR(IP)) * 10 / 3)),
                        0
                    ) * 9, 2
                ) AS K9,
                ROUND(
                    BB / NULLIF(
                        (FLOOR(IP) + ((IP - FLOOR(IP)) * 10 / 3)),
                        0
                    ) * 9, 2
                ) AS BB9
            FROM pitcher
            WHERE Year = %s;
        '''
        cursor.execute(pitcher_query, (year,))
        pitchers = cursor.fetchall()

        cursor.close()
        conn.close()

        all_stats = batters + pitchers
        return jsonify(all_stats)

    except mysql.connector.Error as err:
        print("Database error:", err)
        return jsonify({"error": "Database connection failed"}), 500
    
@app.route('/api/team_stats', methods=['GET'])
def get_team_stats():
    team = request.args.get('team')
    if not team:
        return jsonify({"error": "No team code provided"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # 打者數據
        batter_query = """
            SELECT 
              Name, Year, Team, Type, PA, AB, H, H2, H3, HR, RBI, SO, BB, SB, CS,
              AVG, OBP, SLG, OPS, Chase, Whiff, GB, FB, GF, Sprint
            FROM batter
            WHERE Team = %s
            ORDER BY Year ASC;
        """
        cursor.execute(batter_query, (team,))
        batters = cursor.fetchall()

        # 投手數據，並同時計算 K9 / BB9
        pitcher_query = """
            SELECT
              Name, Year, Team, Type, W, L, ERA, IP, H, R, ER, HR, BB, SO, WHIP,
              -- 換算局數後算每九局三振、保送
              ROUND(
                SO / NULLIF(
                  (FLOOR(IP) + ((IP - FLOOR(IP)) * 10 / 3)),
                  0
                ) * 9, 2
              ) AS K9,
              ROUND(
                BB / NULLIF(
                  (FLOOR(IP) + ((IP - FLOOR(IP)) * 10 / 3)),
                  0
                ) * 9, 2
              ) AS BB9,
              Chase, Whiff, GB, FB, GF
            FROM pitcher
            WHERE Team = %s
            ORDER BY Year ASC;
        """
        cursor.execute(pitcher_query, (team,))
        pitchers = cursor.fetchall()

        cursor.close()
        conn.close()

        # 回傳兩個列表，前端取完再依年分做篩選
        return jsonify({
            "batters": batters,
            "pitchers": pitchers
        })

    except mysql.connector.Error as err:
        print("Database error in /api/team_stats:", err)
        return jsonify({"error": "Database connection failed"}), 500

@app.route('/api/selected_player', methods=['POST'])
def receive_selected_player():
    data = request.get_json()
    player_id = data.get("id")

    if not player_id:
        return jsonify({"error": "No player ID provided"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)
    
    print(f"收到前端傳來的球員: {player_id}")
    
    query = """
    SELECT Name, Year, Team, Type, PA, AB, H, H2, H3, HR, RBI, SO, BB, SB, CS, 
           AVG, OBP, SLG, OPS, Chase, Whiff, GB, FB, GF, Sprint,
           AVGZ1, AVGZ2, AVGZ3, AVGZ4, AVGZ5, AVGZ6, AVGZ7, 
           AVGZ8, AVGZ9, AVGZLU, AVGZRU, AVGZLD, AVGZRD 
    FROM batter
    WHERE id = %s
    ORDER BY Year ASC;
    """
    
    cursor.execute(query, (player_id,))
    player_stats = cursor.fetchall()
    
    if not player_stats:
        query = """
        SELECT Name, Year, Team, Type, W, L, ERA, IP, H, R, ER, HR, BB, SO, WHIP, 
               Chase, Whiff, GB, FB, GF, PZ1, PZ2,PZ3, PZ4, PZ5, PZ6, PZ7, PZ8, 
               PZ9, PZLU, PZRU, PZLD, PZRD, 
               ROUND(
                    ANY_VALUE(SO) / NULLIF(
                        (FLOOR(ANY_VALUE(IP)) + ((ANY_VALUE(IP) - FLOOR(ANY_VALUE(IP))) * 10 / 3)),
                        0
                    ) * 9, 2
                ) AS K9,
                ROUND(
                    ANY_VALUE(BB) / NULLIF(
                        (FLOOR(ANY_VALUE(IP)) + ((ANY_VALUE(IP) - FLOOR(ANY_VALUE(IP))) * 10 / 3)),
                        0
                    ) * 9, 2
                ) AS BB9
        FROM pitcher
        WHERE id = %s
        ORDER BY Year ASC;
        """
        cursor.execute(query, (player_id,))
        player_stats = cursor.fetchall()
        
    cursor.close()
    conn.close()

    return jsonify(player_stats)

@app.route('/api/league_team_stats')
def league_team_stats():
    year = request.args.get('year', type=int)
    if not year:
        return jsonify({'error': 'year is required'}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    # 預先建立所有球隊與索引的對應（可動態抓 distinct Team）
    cursor.execute("SELECT DISTINCT Team FROM batters WHERE Year = %s", (year,))
    teams_list = [row['Team'] for row in cursor.fetchall()]
    team_index = {team: idx for idx, team in enumerate(teams_list)}
    teams_data = [defaultdict(float) for _ in range(len(teams_list))]

    # -------- 累加打者資料 --------
    cursor.execute("""
        SELECT  Team, PA, AB, H, H2, H3, HR, BB, RBI, SO, BB, SB, CS,
                OBP, Chase, Whiff, GB, FB, GF,
        FROM batters
        WHERE Year = %s
    """, (year,))
    for row in cursor.fetchall():
        i = team_index[row['Team']]
        for k in row:
            if k != 'Team':
                teams_data[i][k] += row[k] or 0

    # -------- 累加投手資料 --------
    cursor.execute("""
         SELECT Team, W, L, H AS PH, R, ER, HR AS PHR, BB AS PBB, SO AS PSO, WHIP, 
               Chase AS PCH, Whiff AS PWH, GB AS PGB, FB AS PFB, GF AS PGF,
               (FLOOR(ANY_VALUE(IP)) * 3 + ((ANY_VALUE(IP) - FLOOR(ANY_VALUE(IP))) * 10)) AS IP
        FROM pitchers
        WHERE Year = %s
    """, (year,))
    for row in cursor.fetchall():
        i = team_index[row['Team']]
        for k in row:
            if k != 'Team':
                teams_data[i][k] += row[k] or 0

    conn.close()

    # -------- 統一計算 --------
    result = []
    for team, data in zip(teams_list, teams_data):
        PA = data['PA']
        AB = data['AB']
        H = data['H']
        H2 = data['H2']
        H3 = data['H3']
        HR = data['HR']
        BB = data['BB']
        RBI = data['RBI']
        SO = data['SO']
        BB = data['BB']
        SB = data['SB']
        CS = data['CS']
        OBP = data['OBP']
        Chase = data['Chase']
        Whiff = data['Whiff']
        GB = data['GB']
        FB = data['FB']
        GF = data['GF']

        W = data['W']
        L = data['L']
        IP = data['IP']
        PH = data['PH']
        R = data['R']
        ER = data['ER']
        PHR = data['PHR']
        PBB = data['PBB']
        PSO = data['PSO']
        WHIP = data['WHIP']
        PCH = data['PCH']
        PWH = data['PWH']
        PGB = data['PGB']
        PFB = data['PFB']
        PGF = data['PGF']

        obp_den = ab + bb + hbp + sf
        slg_numerator = h + h2 + 2 * h3 + 3 * hr

        obp = (h + bb + hbp) / obp_den if obp_den else 0
        slg = slg_numerator / ab if ab else 0
        ops = obp + slg

        era = (er / ip) * 9 if ip else 0
        whip = (ph + pbb) / ip if ip else 0
        k9 = (so / ip) * 9 if ip else 0
        bb9 = (pbb / ip) * 9 if ip else 0

        result.append({
            "team": team,
            "AVG": round(h / ab, 3) if ab else 0,
            "OBP": round(obp, 3),
            "SLG": round(slg, 3),
            "OPS": round(ops, 3),
            "ERA": round(era, 2),
            "WHIP": round(whip, 2),
            "K9": round(k9, 2),
            "BB9": round(bb9, 2),
        })

    return jsonify(result)

if __name__ == "__main__":
    app.run(debug=True)