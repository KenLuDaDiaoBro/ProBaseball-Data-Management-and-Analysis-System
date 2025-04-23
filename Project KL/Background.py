from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector

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
              Year, Team, Type, PA, AB, H, H2, H3, HR, RBI, SO, BB, SB, CS,
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
              Year, Team, Type, W, L, ERA, IP, H, R, ER, HR, BB, SO, WHIP,
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

if __name__ == "__main__":
    app.run(debug=True)