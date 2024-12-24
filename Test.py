from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

Teams = ["Blue_Jays"]

Year = [2024]
Players_Name = []
Types = ["Pitchers"]

# 設定 WebDriver
s = Service("C:/Users/afatf/Desktop/Project KL/chromedriver-win64/chromedriver.exe")
opts = Options()
opts.add_argument("headless") 
driver = webdriver.Chrome(service=s , options = opts)

# 打開目標頁面
try:
    driver.get("https://baseballsavant.mlb.com/")  # 本地 HTML 檔案或 URL
    for Team in Teams:
        Divison = ""
        if(Team == "Blue_Jays" or Team == "Orioles" or Team == "Rays" or Team == "Red_Sox" or Team == "Yankees"):
            Divison = "American League East"
        elif(Team == "Guardians" or Team == "Royals" or Team == "Tigers" or Team == "Twins" or Team == "White_Sox"):
            Divison = "American League Central"
        elif(Team == "Angels" or Team == "Astros" or Team == "Athletics" or Team == "Mariners" or Team == "Rangers"):
            Divison = "American League West"
        elif(Team == "Braves" or Team == "Marlins" or Team == "Mets" or Team == "Nationals" or Team == "Phillies"):
            Divison = "National League East"
        elif(Team == "Brewers" or Team == "Cardinals" or Team == "Cubs" or Team == "Pirates" or Team == "Reds"):
            Divison = "National League Central"
        elif(Team == "D-backs" or Team == "Dodgers" or Team == "Giants" or Team == "Padres" or Team == "Rockies"):
            Divison = "National League West"
            
        for Type in Types:
            file_path = r"C:/Users/afatf/Desktop/Project KL/Players_Data/" + Divison + r"/" + Team + r"/" + Type + r"/" + Type + r".txt"

            # 讀取檔案內容
            players = []
            with open(file_path, "r", encoding="utf-8") as file:
                players = [line.strip() for line in file if line.strip()]
                
            for Player in players:
                element = driver.find_element(By.ID, 'player-auto-complete')
                element.clear()  # 清空輸入欄位
                element.send_keys(Player)
                time.sleep(2)
                ActionChains(driver).send_keys(Keys.ENTER).perform()  # 使用 ActionChains 按下 ENTER
                time.sleep(2)
                
                try:
                    element = driver.find_element(By.XPATH, "//a[contains(text(), 'Standard')]")
                    element.click()
                    
                    try:
                        rows = driver.find_elements(By.XPATH, "//div[@class='table-savant standard-mlb']//tr[.//span[text()='2024']]")
                        print("成功抓取元素")
                        
                        # 遍歷每一行，提取相關資訊
                        for row in rows:
                            td_elements = row.find_elements(By.TAG_NAME, "td")
                            if(len(td_elements) != 19):
                                continue
                            
                            year = row.find_element(By.XPATH, ".//span[text()='2024']").text
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
                            if not (year and team and Wins and Losses and ERA and IP and Hit and Run and ER and HR and BB and SO and WHIP):
                                continue  # 跳過空行
                
                            print(f"Player: {Player}, Year: {year}, Team: {team}, Wins: {Wins}, Losses: {Losses}, ERA: {ERA}, IP: {IP}," 
                                + f"Hits: {Hit}, Runs: {Run}, ER: {ER}, HR: {HR}, BB: {BB}, SO: {SO}, WHIP: {WHIP}")
                            
                    except Exception as e:
                        print("未找到符合條件的元素:", e)
    
                    
                except Exception as e:
                    print("未能找到 tab_career 元素:", e)  
                
except Exception as e:
    print(f"開啟網站過程發生錯誤: {e}")   

# 關閉瀏覽器
driver.quit()


