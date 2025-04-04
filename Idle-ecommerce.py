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