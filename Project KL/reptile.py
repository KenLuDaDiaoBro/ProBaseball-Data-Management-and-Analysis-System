import os
import time
import json
from selenium import webdriver 
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from webdriver_manager.chrome import ChromeDriverManager

Teams = ["Mets"]
players_data = []
Yr = [2023, 2024]

s = Service("C:/Users/afatf/Desktop/ProBaseball-Data-Management-and-Analysis-System/Project KL/chromedriver-win64/chromedriver.exe")
s = Service(ChromeDriverManager().install())
opts = Options()
opts.add_argument("headless") 
driver = webdriver.Chrome(service=s, options=opts)

try:
    driver.get("https://baseballsavant.mlb.com/")
except Exception as e:
    print(f"開啟網站過程發生錯誤: {e}")
    
for Year in Yr:
    for Team in Teams:   
        players_data = []

        Divison = ""
        if(Team == "Blue Jays" or Team == "Orioles" or Team == "Rays" or Team == "Red Sox" or Team == "Yankees"):
            Divison = "American League East"
        elif(Team == "Guardians" or Team == "Royals" or Team == "Tigers" or Team == "Twins" or Team == "White Sox"):
            Divison = "American League Central"
        elif(Team == "Angels" or Team == "Astros" or Team == "Athletics" or Team == "Mariners" or Team == "Rangers"):
            Divison = "American League West"
        elif(Team == "Braves" or Team == "Marlins" or Team == "Mets" or Team == "Nationals" or Team == "Phillies"):
            Divison = "National League East"
        elif(Team == "Brewers" or Team == "Cardinals" or Team == "Cubs" or Team == "Pirates" or Team == "Reds"):
            Divison = "National League Central"
        elif(Team == "D-backs" or Team == "Dodgers" or Team == "Giants" or Team == "Padres" or Team == "Rockies"):
            Divison = "National League West"
                
        try:  
            element = driver.find_element(By.ID, 'player-auto-complete')
            element.send_keys(Team)
            time.sleep(2)
            ActionChains(driver).send_keys(Keys.ENTER).perform()
            time.sleep(2)
            year_dropdown = Select(driver.find_element(By.ID, "ddlSeason"))
            year_dropdown.select_by_value(f"{Year}")
        except Exception as e:
            print("爬取" + Team + f"過程發生錯誤: {e}")

        # 抓取打者名單
        try:
            time.sleep(2)
            Batters_Name = driver.find_elements(By.TAG_NAME, 'b')
            Unique_Batters = list(dict.fromkeys(player.text for player in Batters_Name if player.text.strip()))
            Unique_Batters = [name for name in Unique_Batters if name not in ["", "MLB", Team]]

            for name in Unique_Batters:
                
                try:
                    print(name)
                    player_link = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, f'//td[@class="tr-data align-left"]//b[text()="{name}"]/parent::a')))
                    player_url = player_link.get_attribute("href")
                    print(f"跳轉至: {player_url}")
                    ID = player_url[45:]
                    print(f"ID: {ID}")
                    driver.get(player_url)
                    
                    #獲得球員名
                    Player_Name = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH, "//div[@style='display: inline-block']"))).text
                    
                    dropdown = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, "//span[@class='selected-dropdown-wrapper']"))).click()
                    option = WebDriverWait(driver, 10).until(EC.element_to_be_clickable((By.XPATH, f"//div[@data-value='{Year}']"))).click()
                    time.sleep(1)
                    element = driver.find_element(By.CLASS_NAME , "chart-container")
                    elements = element.find_elements(By.CLASS_NAME, "text-stat")
                    Sp = elements[len(elements) - 1].text
                    try:
                        Speed = float(Sp)
                        if Speed <= 20:
                            Speed = 0
                    except:
                        Speed = 0
                    
                    time.sleep(2)
                    rows = driver.find_elements(By.CSS_SELECTOR, "table.tablesorter.tablesorter-default tbody tr")

                    if not rows:
                        print("❌ 沒找到表格數據，請檢查 XPath 或網頁加載情況！")
                    else:
                        Index = -1
                        for row in rows:
                            season = row.find_element(By.XPATH, ".//td[1]").text.strip() 
                            if season == str(Year):
                                GGB = row.find_element(By.XPATH, ".//td[2]").text.strip()
                                try:
                                    float(GGB)
                                    Index += 1
                                    if Index == 2:
                                        gb = row.find_element(By.XPATH, ".//td[2]").text.strip()
                                        fb = row.find_element(By.XPATH, ".//td[4]").text.strip()
                                        print(f"✅ GB%: {gb}, FB%: {fb}")
                                        if float(fb) != 0:
                                            gf = round(float(gb) / float(fb) , 2)
                                        else:
                                            gf = 10000
                                        print(gf)
                                except:
                                    pass
                                    
                    b = driver.find_elements(By.XPATH, f"//table[@id='playeDiscipline']//tr[.//span[text()='{Year}']]")
                    
                    ch = b[0].find_element(By.XPATH, ".//td[6]").text
                    if ch == "--":
                        ch = "0.0"
                    wh = b[0].find_element(By.XPATH, ".//td[11]").text
                    if wh == "--":
                        wh = "0.0"
                    print(f"✅ CH%: {ch}, SW%: {wh}")
                    
                    element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "statcast_nav_type_zones")))
                    element.click()
                    year_dropdown = Select(driver.find_element(By.ID, "ddlZoneSeason"))
                    year_dropdown.select_by_value(f"{Year}")
                    year_dropdown = Select(driver.find_element(By.ID, "ddlZoneHand"))
                    year_dropdown.select_by_value("R")
                    time.sleep(1)
                    year_dropdown.select_by_visible_text("Pitcher Throws")
                    time.sleep(1)
                    AVG_Zone = []
                    try:       
                        element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "zoneChartba")))
                        texts = element.find_elements(By.TAG_NAME, "text")
                        for text in texts:
                            content = text.text.strip()
                            if not content:
                                AVG_Zone.append(".000")
                            elif content[0].isdigit() or content.startswith('.'):
                                AVG_Zone.append(content)
                    except:
                        for  num in range(0, 13):
                            AVG_Zone.append("-1.000")
                    print(AVG_Zone)       
                        
                    element = driver.find_element(By.XPATH, "//a[contains(text(), 'Standard')]")
                    driver.execute_script("arguments[0].click();", element)
                    #print("成功點擊")
                    rows = driver.find_elements(By.XPATH, f"//div[@class='table-savant standard-mlb']//tr[.//span[text()='{Year}']]")
                    print("成功抓取元素")
                        
                    for row in rows:
                        td_elements = row.find_elements(By.TAG_NAME, "td")
                        if(len(td_elements) != 22):
                            continue
                        
                        team = row.find_element(By.XPATH, ".//td[3]/span").text
                        PA = row.find_element(By.XPATH, ".//td[6]/span").text
                        AB = row.find_element(By.XPATH, ".//td[7]/span").text
                        Single = row.find_element(By.XPATH, ".//td[9]/span").text
                        Double = row.find_element(By.XPATH, ".//td[10]/span").text
                        Triple = row.find_element(By.XPATH, ".//td[11]/span").text
                        HR = row.find_element(By.XPATH, ".//td[12]/span").text
                        RBI = row.find_element(By.XPATH, ".//td[13]/span").text
                        BB = row.find_element(By.XPATH, ".//td[14]/span").text
                        SO = row.find_element(By.XPATH, ".//td[15]/span").text
                        SB = row.find_element(By.XPATH, ".//td[16]/span").text
                        CS = row.find_element(By.XPATH, ".//td[17]/span").text
                        AVG = row.find_element(By.XPATH, ".//td[19]/span").text
                        OBP = row.find_element(By.XPATH, ".//td[20]/span").text
                        SLG = row.find_element(By.XPATH, ".//td[21]/span").text
                        OPS = row.find_element(By.XPATH, ".//td[22]/span").text


                        # 過濾掉空的資料行
                        if not (PA):
                            continue  # 跳過空行

                        print(f"Player: {Player_Name}, ID: {ID}, Year: {Year}, Team: {team}, PA: {PA}, AB: {AB}, H: {Single}, 2B: {Double}, " 
                            + f"3B: {Triple}, HR: {HR}, RBI: {RBI}, SO: {SO}, BB: {BB}, SB: {SB}, CS: {CS}, AVG: {AVG}, OBP: {OBP}, "
                            + f"SLG: {SLG}, OPS: {OPS}, Chase%: {ch}, Whiff%: {wh}, GB%: {gb}, FB%: {fb}, G/F: {gf}, "
                            + f"Sprint: {Speed}, AVG_Zone: {AVG_Zone}")
                        
                        players_data.append({
                            "Player": Player_Name,"ID": ID,"Year": Year,"Team": team,"Division": Divison,"Type": "Batter","PA": PA,
                            "AB": AB,"H": Single,"2B": Double,"3B": Triple,"HR": HR,"RBI": RBI,"SO": SO,"BB": BB,"SB": SB,
                            "CS": CS,"AVG": AVG,"OBP": OBP, "SLG": SLG,"OPS": OPS,"Chase%": ch,"Whiff%": wh,"GB%": gb,
                            "FB%": fb,"G/F": gf,"Sprint": Speed,"AVG_Zone": AVG_Zone
                        })
                        
                    driver.back()
                except Exception as e:
                    print(f"取得{Year}{name}資訊失敗: {e}")
        except Exception as e:
            print(f"抓取打者名單失敗: {e}")
        
        # 切換到投手頁面並抓取投手名單
        try:
            driver.find_element(By.ID, 'statcast_nav_type_pitching').click()
            time.sleep(2)
            Pitchers_Name = driver.find_elements(By.TAG_NAME, 'b')
            Unique_Pitchers = list(dict.fromkeys(player.text for player in Pitchers_Name if player.text.strip()))
            Unique_Pitchers = [name for name in Unique_Pitchers if name not in ["", "MLB", Team]]
            #Formatted_Pitcher_Name = [Name_Format(name) for name in Unique_Pitchers]
            
            for name in Unique_Pitchers:
                try:
                    print(name)
                    player_link = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.XPATH, f'//td[@class="tr-data align-left"]//b[text()="{name}"]/parent::a')))
                    player_url = player_link.get_attribute("href")
                    print(f"跳轉至: {player_url}")
                    ID = player_url[45:]
                    print(f"ID: {ID}")
                    driver.get(player_url)
                    
                    #獲得球員名
                    Player_Name = WebDriverWait(driver, 20).until(EC.presence_of_element_located((By.XPATH, "//div[@style='display: inline-block']"))).text
                    #print(content)
                    
                    time.sleep(2)
                    rows = driver.find_elements(By.CSS_SELECTOR, "table.tablesorter.tablesorter-default tbody tr")

                    if not rows:
                        print("❌ 沒找到表格數據，請檢查 XPath 或網頁加載情況！")
                    else:
                        Index = -1
                        for row in rows:
                            season = row.find_element(By.XPATH, ".//td[1]").text.strip()
                            if season == str(Year):
                                GGB = row.find_element(By.XPATH, ".//td[2]").text.strip()
                                try:
                                    float(GGB)
                                    Index += 1
                                    if Index == 2:
                                        gb = row.find_element(By.XPATH, ".//td[2]").text.strip()
                                        fb = row.find_element(By.XPATH, ".//td[4]").text.strip()
                                        print(f"✅ GB%: {gb}, FB%: {fb}")
                                        if float(fb) != 0:
                                            gf = round(float(gb) / float(fb) , 2)
                                        else:
                                            gf = 10000
                                        print(gf)
                                except:
                                    pass
                                
                    b = driver.find_elements(By.XPATH, f"//table[@id='playeDiscipline']//tr[.//span[text()='{Year}']]")
                    
                    ch = b[0].find_element(By.XPATH, ".//td[6]").text
                    if ch == "--":
                        ch = "0.0"
                    wh = b[0].find_element(By.XPATH, ".//td[11]").text
                    if wh == "--":
                        wh = "0.0"
                    print(f"✅ CH%: {ch}, SW%: {wh}")
                    
                    element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "statcast_nav_type_zones")))
                    element.click()
                    year_dropdown = Select(driver.find_element(By.ID, "ddlZoneSeason"))
                    year_dropdown.select_by_value(f"{Year}")
                    year_dropdown = Select(driver.find_element(By.ID, "ddlZoneHand"))
                    year_dropdown.select_by_value("R")
                    time.sleep(1)
                    year_dropdown.select_by_visible_text("Batter Stands")
                    time.sleep(1)
                    element = WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "zoneChartpitches")))
                    texts = element.find_elements(By.TAG_NAME, "text")
                    AVG_Zone = []
                    for text in texts:
                        content = text.text.strip()
                        if not content:
                            AVG_Zone.append("0")
                        elif content[0].isdigit() or content.startswith('.'):
                            AVG_Zone.append(content)
        
                    element = driver.find_element(By.XPATH, "//a[contains(text(), 'Standard')]")
                    driver.execute_script("arguments[0].click();", element)
                    #print("成功點擊")
                    rows = driver.find_elements(By.XPATH, f"//div[@class='table-savant standard-mlb']//tr[.//span[text()='{Year}']]")
                    #print("成功抓取元素")
                        
                    for row in rows:
                        td_elements = row.find_elements(By.TAG_NAME, "td")
                        if(len(td_elements) != 19):
                            continue
                        
                        team = row.find_element(By.XPATH, ".//td[3]/span").text
                        Wins = row.find_element(By.XPATH, ".//td[6]/span").text
                        Losses = row.find_element(By.XPATH, ".//td[7]/span").text
                        ERA = row.find_element(By.XPATH, ".//td[8]/span").text
                        IP = row.find_element(By.XPATH, ".//td[12]/span").text
                        Hit = row.find_element(By.XPATH, ".//td[13]/span").text
                        Run = row.find_element(By.XPATH, ".//td[14]/span").text
                        ER = row.find_element(By.XPATH, ".//td[15]/span").text
                        HR = row.find_element(By.XPATH, ".//td[16]/span").text
                        BB = row.find_element(By.XPATH, ".//td[17]/span").text
                        SO = row.find_element(By.XPATH, ".//td[18]/span").text
                        WHIP = row.find_element(By.XPATH, ".//td[19]/span").text

                        # 過濾掉空的資料行
                        if not (team and Wins and Losses and ERA and IP and Hit and Run and ER and HR and BB and SO and WHIP):
                            continue  # 跳過空行
            
                        print(f"Player: {Player_Name}, ID: {ID}, Year: {Year}, Team: {team}, Wins: {Wins}, Losses: {Losses}, ERA: {ERA}, IP: {IP}, " 
                            + f"Hits: {Hit}, Runs: {Run}, ER: {ER}, HR: {HR}, BB: {BB}, SO: {SO}, WHIP: {WHIP}, Chase%: {ch}, Whiff%: {wh}, "
                            + f"GB%: {gb}, FB%: {fb}, G/F: {gf}, Pitch_Zone: {AVG_Zone}")
                        
                        players_data.append({
                            "Player": Player_Name,"ID": ID,"Year": Year,"Team": team,"Division": Divison,"Type": "Pitcher","Wins": Wins,
                            "Losses": Losses,"ERA": ERA,"IP": IP,"Hits": Hit,"Runs": Run,"ER": ER,"HR": HR,"BB": BB,"SO": SO,
                            "WHIP": WHIP,"Chase%": ch,"Whiff%": wh, "GB%": gb,"FB%": fb,"G/F": gf,"Pitch_Zone%": AVG_Zone
                        })
                    driver.back()
                except Exception as e:
                    print(f"取得{Year}{name}資訊失敗: {e}")
        except Exception as e:
            print(f"抓取投手名單失敗: {e}")
                
        base_dir = os.path.dirname(os.path.abspath(__file__))
        
        output_dir = os.path.join(base_dir, "Players_Data")
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        year_folder = os.path.join(output_dir, str(Year))
        if not os.path.exists(year_folder):
            os.makedirs(year_folder)
            
        league_folder = os.path.join(year_folder, Divison)
        if not os.path.exists(league_folder):
            os.makedirs(league_folder)
            
        team_folder = os.path.join(league_folder, Team.replace(" ", "_"))
        if not os.path.exists(team_folder):
            os.makedirs(team_folder)
        
        # 保存到 JSON 文件
        json_file = os.path.join(team_folder, "Player_Data.json")
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(players_data, f, ensure_ascii=False, indent=4)

        print("已保存爬取結果到 JSON 文件中！")
    