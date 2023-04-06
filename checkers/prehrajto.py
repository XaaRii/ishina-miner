from selenium import webdriver
# from selenium.webdriver.chrome.service import Service as ChromeService
# from webdriver_manager.chrome import ChromeDriverManager
import os

from selenium.webdriver.common.by import By
import sys
if len(sys.argv) < 2:
    print(f"ERR: no argument passed")
    exit()

sys.stdout = open(os.devnull, "w")

# Create browser options
options = webdriver.ChromeOptions()
options.add_argument('--headless')
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')
# options.binary_location = '/usr/bin/chromium-browser'
options.binary_location = '/usr/bin/chromium'

# Start browser
# originally was there also   service=ChromeService(ChromeDriverManager().install()),
driver = webdriver.Chrome(executable_path='/home/ubuntu/ishina-miner/checkers/chromedriver', options=options)

driver.get("https://prehrajto.cz/")
# search_bar = driver.find_element_by_name('phrase')
# search_bar = driver.find_element(By.XPATH, "//input[@name='phrase']")
search_bar = driver.find_element(By.ID, 'search-phrase')
search_bar.send_keys(sys.argv[1])
search_button = driver.find_element(By.XPATH, "/html/body/div[1]/div[1]/header/div[2]/form/fieldset/div/div/div[1]/div/button")
search_button.click()
first_result = driver.find_element(By.XPATH, "/html/body/div[1]/div[1]/div[2]/div/section/div[2]/div[1]/a/div")
first_result.click()
video = driver.find_element(By.XPATH, "//*[@id='content_video_html5_api']")
url = video.get_dom_attribute("src")

driver.close()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
print(str(url))

exit()