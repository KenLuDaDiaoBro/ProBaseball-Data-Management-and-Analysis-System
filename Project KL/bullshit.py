from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
import time

word = ''
num = 0
content = ''

word = input('Please enter key words:')
num = input('Please enter the number of words (within 1000):')
while int(num) > 1000 :
    num = input('Error Please re-enter the number of words:')
print('Generating...')

s = Service("C:/Users/afatf/Desktop/Project KL/chromedriver-win64/chromedriver.exe")
opts = Options()
opts.add_argument("headless") 
driver = webdriver.Chrome(service=s , options = opts)

driver.get('https://howtobullshit.me/')
driver.find_element(By.ID, 'topic').send_keys(word)
driver.find_element(By.ID, 'minlen').send_keys(num)
driver.find_element(By.ID, 'btn-get-bullshit').click()

time.sleep(5)

content = driver.find_element(By.ID, 'content').text

print(content)