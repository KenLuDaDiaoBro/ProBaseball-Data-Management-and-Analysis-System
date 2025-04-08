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

@app.route('/api/players_stats', methods=['GET'])
def get_all_players_stats():
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        # 打者百分比統計
        batter_query = '''
            SELECT 
                b1.id,
                MAX(b1.Name) AS Name,
                'Batter' AS Type,
                ROUND(100 * (
                    SELECT COUNT(*) FROM batter b2 WHERE b2.OPS <= b1.OPS
                ) / (SELECT COUNT(*) FROM batter), 0) AS OPS,
                ROUND(100 * (
                    SELECT COUNT(*) FROM batter b2 WHERE b2.AVG <= b1.AVG
                ) / (SELECT COUNT(*) FROM batter), 0) AS AVG,
                ROUND(100 * (
                    SELECT COUNT(*) FROM batter b2 WHERE b2.SLG <= b1.SLG
                ) / (SELECT COUNT(*) FROM batter), 0) AS SLG,
                ROUND(100 * (
                    SELECT COUNT(*) FROM batter b2 WHERE b2.OBP <= b1.OBP
                ) / (SELECT COUNT(*) FROM batter), 0) AS OBP
            FROM batter b1
            GROUP BY b1.id
        '''
        cursor.execute(batter_query)
        batters = cursor.fetchall()

        # 投手百分比統計
        pitcher_query = '''
            SELECT 
                p1.id,
                MAX(p1.Name) AS Name,
                'Pitcher' AS Type,
                ROUND(100 * (
                    SELECT COUNT(*) FROM pitcher p2 WHERE p2.ERA >= p1.ERA
                ) / (SELECT COUNT(*) FROM pitcher), 0) AS ERA,
                ROUND(100 * (
                    SELECT COUNT(*) FROM pitcher p2 WHERE p2.WHIP >= p1.WHIP
                ) / (SELECT COUNT(*) FROM pitcher), 0) AS WHIP,
                ROUND(100 * (
                    SELECT COUNT(*) FROM pitcher p2 WHERE p2.SO <= p1.SO
                ) / (SELECT COUNT(*) FROM pitcher), 0) AS SO,
                ROUND(100 * (
                    SELECT COUNT(*) FROM pitcher p2 WHERE p2.BB >= p1.BB
                ) / (SELECT COUNT(*) FROM pitcher), 0) AS BB
            FROM pitcher p1
            GROUP BY p1.id
        '''
        cursor.execute(pitcher_query)
        pitchers = cursor.fetchall()

        cursor.close()
        conn.close()

        all_stats = batters + pitchers
        return jsonify(all_stats)

    except mysql.connector.Error as err:
        print("Database error:", err)
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
    SELECT Name, Year, Team, Type, PA, AB, H, H2, H3, HR, RBL, SO, BB, SB, CS, 
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
               PZ9, PZLU, PZRU, PZLD, PZRD 
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