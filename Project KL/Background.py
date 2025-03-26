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