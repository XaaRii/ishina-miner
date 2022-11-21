from bs4 import BeautifulSoup, SoupStrainer
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from webdriver_manager.chrome import ChromeDriverManager
import time
import random
import json
import os
from datetime import datetime, timedelta


def get_html_data() -> BeautifulSoup:
    """ Fetch html data from prime gaming website

    :return: BeautifulSoup
    """

    # Create browser options
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')  # no UI interface
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.binary_location = '/usr/bin/chromium-browser'

    # Start browser
    # originally was there also   service=ChromeService(ChromeDriverManager().install()),
    driver = webdriver.Chrome(executable_path='/home/ubuntu/prime-checker/chromedriver', options=options)

    # Get html from website
    driver.get("https://gaming.amazon.com/home")
    time.sleep(10)
    source = driver.page_source

    # Close browser
    driver.close()

    # Create soup
    soup = BeautifulSoup(source, 'html.parser')
    return soup


def extract_data_from_html(soup: BeautifulSoup) -> list:
    """ Extract wanted data from BeautifulSoup-Object

    :param soup: BeautifulSoup; The fetched html data
    :return: list; List of tuples where each tuple contains game-name, image-link and weblink
    """

    data = []

    mydivs = soup.find_all("div", class_="item-card__action")

    # debug
    # os.remove('./soup.html')
    # with open('./soup.html', 'x') as ile:
    #     ile.write(str(mydivs))

    for item_card in mydivs:
        # Get item name
        nameF = item_card.find("a", class_="tw-interactive tw-block tw-full-width tw-interactable tw-interactable--alpha")
        if nameF != None:
            name = nameF["aria-label"]
        else:
            nameF = item_card.find("figure", class_="tw-aspect tw-aspect--16x9 tw-aspect--align-top")
            if nameF != None:
                atest = nameF.find("img", class_="tw-image")
                name = atest["alt"]
            else:
                name = "Undetectable"
        
        # Get game name
        gameF = item_card.find("p", class_="tw-amazon-ember-regular tw-c-text-base tw-ellipsis tw-font-size-7 tw-md-font-size-6")
        if gameF != None:
            game = gameF["title"]
        else:
            game = "Undetectable"
        
        # Get expiry
        # expiry = item_card.find("p", class_="tw-c-text-white tw-font-size-7")
        expi = item_card.find("span", class_="tw-amazon-ember-regular tw-c-text-base tw-font-size-7")
        expiry = expi.nextSibling

        # Get weblink
        hrefF = item_card.find("a", class_="tw-interactive tw-block tw-full-width tw-interactable tw-interactable--alpha")
        if hrefF != None:
            href = "https://gaming.amazon.com" + hrefF["href"]
        else:
            href = "Link Undetectable"

        # TODO: Make sure we got an entry for each list. If not add some empty value.

        print("----------\nGame: " + game + "\nItem name: " + name + "\nExpires in:" + expiry + "\n" + href)
        data.append((name, game, expiry, href))
    dataPruned = [*set(data)]

    return dataPruned
        


    # for item_card in soup.find_all("div", attrs={"class": "item-card__action"}):
    #     # Get item name
    #     name = item_card.find(
    #         "a",
    #         attrs={"class": "tw-interactive tw-block tw-full-width tw-interactable tw-interactable--alpha"})["aria-label"]

    #     # Get link to item image
    #     image_link = item_card.find("img", attrs={"class": "tw-image"})["src"]

    #     # Get weblink
    #     href = item_card.find(
    #         "a",
    #         attrs={"class": "tw-interactive tw-block tw-full-width tw-interactable tw-interactable--alpha"})["href"]
    #     weblink = "https://gaming.amazon.com" + href

    #     # TODO: Make sure we got an entry for each list. If not add some empty value.

    #     data.append((name, image_link, weblink))

    # return data


def save_data_to_json(data: list):
    """ Save loaded data to JSON file

    :param data: List; Data from the twitch website
    :return: None
    """
    # Get timestamp
    timestamp = str(datetime.now())

    # Create dictionary
    data_dict = {
        "timestamp": timestamp,
        "data": data
    }

    # Write dictonary to JSON file
    with open("prime_fetch.json", "w", encoding="utf-8") as file:
        json.dump(data_dict, file)


def load_data_from_json() -> dict:
    """ Load data from saved JSON file

    :return: dict
    """
    # Read JSON file to dictionary
    with open("prime_fetch.json", encoding="utf-8") as file:
        data_dict = json.load(file)

    return data_dict


def fetch_data() -> dict:
    """ A wrapper for the functions to fetch, extract and save ressources from the website

    :return: dict
    """
    # Get HTML ressources
    soup = get_html_data()

    # Extract from html
    data = extract_data_from_html(soup=soup)

    # Save new ressources
    save_data_to_json(data=data)

    # Create and return dict
    data_json = {
        "timestamp": str(datetime.now()),
        "data": data
    }

    return data_json


def handle_cmd():
    """ Main function
    :return: None
    """

    # Check if fetch true:
    # -> Fetch ressources
    # Else
    # -> Load previously fetched data from JSON file
    # -> Check if json empty OR timestamp to old
    #    -> Fetch ressources
    #    -> Save ressources
    #
    # Check if loaded ressources is empty
    # -> Send sorry message
    # else
    # -> Send messages

    print("Loading prime gaming data")

    # Check if fetch. If true fetch
    fetch=True
    if fetch:
        print("D_MSG_E: Let me check it out")
        data_json = fetch_data()
        

    else:
        # Load ressources from JSON
        data_json = load_data_from_json()

        if len(data_json["data"]) == 0:
            print("D_MSG_E: Let me check it out")
            data_json = fetch_data()
            

        else:
            # Get timestamps
            timestamp_now = datetime.now()
            timestamp_last_str = data_json["timestamp"]
            timestamp_last = datetime.strptime(timestamp_last_str, '%Y-%m-%d %H:%M:%S.%f')

            if (timestamp_now - timestamp_last) >= timedelta(days=1):
                print("D_MSG_E: Let me check it out")
                data_json = fetch_data()
                

    # Check if resources empty
    if len(data_json["data"]) == 0:
        print("No data found")
        print("D_MSG_E:Yeah nothing here pal")


if __name__ == "__main__":
    handle_cmd()
