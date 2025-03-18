from flask import Flask, jsonify
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
        cursor.execute("SELECT Name FROM pitcher")  
        pitchers = cursor.fetchall()

        cursor.execute("SELECT Name FROM batter")  
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

if __name__ == "__main__":
    app.run(debug=True)