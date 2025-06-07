from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from collections import OrderedDict

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
        cursor.execute("SELECT id, Name, 'Pitcher' AS Type FROM pitcher GROUP BY id, Name")
        pitchers = cursor.fetchall()

        cursor.execute("SELECT id, Name, 'Batter' AS Type FROM batter GROUP BY id, Name")
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
    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor()

        cursor.execute(
            "SELECT DISTINCT Team FROM pitcher "
            "UNION "
            "SELECT DISTINCT Team FROM batter;"
        )
        rows = cursor.fetchall()

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
    year = request.args.get('year')

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        min_PA = 324
        min_IP = 81
        
        batter_query = f'''
            SELECT 
            Name, Year, Team, Type, PA, AB, H, H2, H3, HR, RBI, SO, BB, SB, CS, 
            AVG, OBP, SLG, OPS, Chase, Whiff, GB, FB, GF, Sprint
            FROM batter
            WHERE Year = %s AND PA >= {min_PA};
        '''
        cursor.execute(batter_query, (year,))
        batters = cursor.fetchall()

        pitcher_query = f'''
            SELECT 
            Name, Year, Team, Type, W, L, ERA, IP, H, R, ER, HR, BB, BB9, SO, K9, WHIP, 
            Chase, Whiff, GB, FB, GF
            FROM pitcher
            WHERE Year = %s AND IP >= {min_IP};
        '''
        cursor.execute(pitcher_query, (year,))
        pitchers = cursor.fetchall()

        cursor.close()
        conn.close()
        
        # 3. 針對每個打者 Name 分組，保留合併列（Team 含 "Teams"）若存在，否則保留所有該球員紀錄
        groups = OrderedDict()
        for b in batters:
            groups.setdefault(b['Name'], []).append(b)

        batters_deduped = []
        for records in groups.values():
            # 找出合併（aggregated）那筆
            agg = next((r for r in records if 'Teams' in r.get('Team', '')), None)
            if agg:
                batters_deduped.append(agg)
            else:
                # 如果沒有合併列，就把所有該球員的單隊紀錄都顯示
                batters_deduped.extend(records)
        
        # 4. 最終回傳：先打者，再投手
        all_stats = batters_deduped + pitchers
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
              Name, Year, Team, Type, W, L, ERA, IP, H, R, ER, HR, BB, BB9, 
              SO, K9, WHIP, Chase, Whiff, GB, FB, GF
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
        SELECT Name, Year, Team, Type, W, L, ERA, IP, H, R, ER, HR, BB, BB9, SO, K9, WHIP, 
               Chase, Whiff, GB, FB, GF, PZ1, PZ2, PZ3, PZ4, PZ5, PZ6, PZ7, PZ8, 
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

@app.route("/api/league_team_stats", methods=["GET"])
def league_team_stats():
    # 1. 读取 year 参数
    year = request.args.get("year", type=int)
    if not year:
        return jsonify({"error": "Missing or invalid year parameter"}), 400

    try:
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
              Team, Year, PA, AB, H, H2, H3, HR, RBI, SO, BB, SB, CS,
              AVG, OPS, SLG, OBP, Chase, Whiff, GB, FB, GF,
              W, L, ERA, IP, PH, R, ER, PHR, PBB, BB9, PSO, K9,
              WHIP, PChase, PWhiff, PGB, PFB, PGF
            FROM team
            WHERE Year = %s
        """, (year,))
        teams = cursor.fetchall()

        cursor.close()
        conn.close()
        
        return jsonify(teams)

    except mysql.connector.Error as err:
        print("Database error in /api/league_team_stats:", err)
        return jsonify({"error": "Database connection failed"}), 500
    
@app.route("/api/player_lookup", methods=["GET"])
def player_lookup():
    name = request.args.get("name")
    team = request.args.get("team")
    year = request.args.get("year", type=int)
    if not all([name, team, year]):
        return jsonify({"error": "Missing parameters"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    # 先查 batter
    cursor.execute("""
        SELECT id FROM batter
         WHERE Name = %s AND Team = %s AND Year = %s
         LIMIT 1
    """, (name, team, year))
    row = cursor.fetchone()

    # 再查 pitcher
    if not row:
        cursor.execute("""
            SELECT id FROM pitcher
             WHERE Name = %s AND Team = %s AND Year = %s
             LIMIT 1
        """, (name, team, year))
        row = cursor.fetchone()

    cursor.close()
    conn.close()

    if row and row.get("id"):
        return jsonify({"id": row["id"]})
    else:
        return jsonify({"error": "Player not found"}), 404
    
@app.route("/api/matchup")
def matchup():
    pitcher_id = request.args.get("pitcher")
    batter_id = request.args.get("batter")

    if not pitcher_id or not batter_id:
        return jsonify({"error": "Missing pitcher or batter ID"}), 400
    
    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT game_date, pitch_type, description, release_speed, zone, events
            FROM matchup
            WHERE pitcher_id = %s AND batter_id = %s
            ORDER BY game_date DESC
        """
        cursor.execute(query, (pitcher_id, batter_id))
        result = cursor.fetchall()
    
        cursor.close()
        conn.close()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/PitcherPitches")
def pitcher_data():
    pitcher_id = request.args.get("pitcher")

    if not pitcher_id:
        return jsonify({"error": "Missing pitcher ID"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT game_date, batter_id, pitch_type, description,
                   release_speed, zone, events
            FROM matchup
            WHERE pitcher_id = %s
            ORDER BY game_date DESC
        """
        cursor.execute(query, (pitcher_id,))
        result = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/BatterPitches")
def batter_data():
    batter_id = request.args.get("batter")

    if not batter_id:
        return jsonify({"error": "Missing batter ID"}), 400

    conn = mysql.connector.connect(**db_config)
    cursor = conn.cursor(dictionary=True)

    try:
        query = """
            SELECT game_date, batter_id, pitch_type, description,
                   release_speed, zone, events
            FROM matchup
            WHERE batter_id = %s
            ORDER BY game_date DESC
        """
        cursor.execute(query, (batter_id,))
        result = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    
if __name__ == "__main__":
    app.run(debug=True)