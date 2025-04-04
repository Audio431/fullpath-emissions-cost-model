from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
import pyautogui
import time

options = Options()
options.headless = False  # Developer Edition must run in headful mode for privileged features

# Specify the path to your Firefox Developer Edition executable.
# For example, on macOS it might look like:
#   "/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox"
# On Windows, it could be something like:
#   "C:\\Program Files\\Firefox Developer Edition\\firefox.exe"
options.binary_location = "/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox"

# (Optional) Set up a profile if needed
profile = webdriver.FirefoxProfile()


profile.set_preference('extensions.experiments.enabled', True)
profile.set_preference('xpinstall.signatures.required', False)
profile.set_preference('extensions.install.requireBuiltInCerts', False)
profile.set_preference('extensions.autoDisableScopes', 0)
profile.set_preference('extensions.enabledScopes', 15)
profile.set_preference("browser.cache.disk.enable", False)
profile.set_preference("browser.cache.memory.enable", False)
profile.set_preference("browser.cache.offline.enable", False)
profile.set_preference("network.http.use-cache", False)

options.profile = profile
options.add_argument("-devtools")

driver = webdriver.Firefox(options=options)
addon_path = "carbon_footprint_tracker-1.0.xpi"
addon_id = driver.install_addon(addon_path, temporary=True)

# Allow some time for any transitions or page updates

# Set the coordinates for the button on the left
# These are example coordinates; adjust as needed for your screen resolution and layout.
x_coordinate = 111 # X position near the left edge of the screen
y_coordinate =  225   # Y position where the button is located

# Open the page before navigating to the target page
driver.get("https://wiki.xxiivv.com/site/uxntal.html")

# Start tracking
time.sleep(3)
print("Moving the mouse to the target position...")
pyautogui.moveTo(x_coordinate, y_coordinate)
print("Mouse moved.")

pyautogui.click()
print("Mouse clicked.")

time.sleep(1)
driver.get("https://www.amazon.co.uk")
print("Page Title:", driver.title)

WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.ID, "sp-cc-accept"))
    ).click()


# move to the amazon search bar
def activity(product):
    try:
        # Search for product
        search_bar = WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.ID, "twotabsearchtextbox"))
        )
        search_bar.clear()
        search_bar.send_keys(product)
        search_bar.send_keys(Keys.RETURN)
        
        # Wait for page to load
        time.sleep(2)
        
        # Target the ACTUAL clickable link element - this is key
        product_link = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, "a.a-link-normal.s-no-outline"))
        )
        # Use JavaScript to click it safely
        driver.execute_script("arguments[0].click();", product_link)
        
        # Wait for product page to load
        add_to_basket = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "add-to-cart-button"))
        )
        # Use JavaScript for more reliable clicking
        driver.execute_script("arguments[0].click();", add_to_basket)
        
        # Handle multiple possible post-add scenarios
        try:
            # Try one common confirmation element
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.ID, "hlb-ptc-btn-native"))
            )
        except:
            # If not found, look for alternative confirmation indicators
            try:
                WebDriverWait(driver, 5).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, ".sw-atc-text"))
                )
            except:
                pass  # Continue anyway
        
        print(f"{product} added to basket!")
        
        # Go to cart
        basket_button = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "nav-cart"))
        )
        driver.execute_script("arguments[0].click();", basket_button)
        
        driver.get("https://www.amazon.co.uk")
        
    except Exception as e:
        print(f"Error with {product}: {str(e)}")
        # Recovery - go back to home page to restart
        driver.get("https://www.amazon.co.uk")

# products = ["iphone 12", "macbook pro", "samsung galaxy s21", "dell xps 13", "samsung galaxy tab s7"]

time.sleep(5)
activity("iphone 12")

time.sleep(45)
activity("macbook pro")

time.sleep(45)
activity("samsung galaxy s21")

time.sleep(45)
activity("dell xps 13")

time.sleep(45)
activity("samsung galaxy tab s7")

time.sleep(45)
activity("iphone 15")

time.sleep(45)
activity("macbook air 2021")

time.sleep(45)
activity("samsung galaxy s22")

time.sleep(45)
activity("surface pro 8")

time.sleep(45)
activity("gaming mouse")

time.sleep(45)
activity("mechanical keyboard")

time.sleep(45)
activity("airpods pro")

time.sleep(45)
activity("ipad air")

time.sleep(45)
activity("logitech mx master")

time.sleep(45)
activity("kindle paperwhite")

time.sleep(45)
activity("sony headphones")

time.sleep(45)
activity("bluetooth speaker")

time.sleep(45)
activity("nintendo switch")

time.sleep(45)
activity("external hard drive")

time.sleep(45)
activity("wireless charger")

# for product in products:
#     activity(product)
# Click to stop tracking
# time.sleep(60)
# pyautogui.moveTo(x_coordinate, y_coordinate)
# pyautogui.click()