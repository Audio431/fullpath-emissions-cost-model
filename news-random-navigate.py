import random
import time
from selenium import webdriver
from selenium.webdriver.firefox.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pyautogui

# Set up Firefox Developer Edition with the appropriate options and profile
options = Options()
options.headless = False  # Must run in headful mode for privileged features
options.binary_location = "/Applications/Firefox Developer Edition.app/Contents/MacOS/firefox"

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

# (Optional) Install an addon if needed
addon_path = "carbon_footprint_tracker-1.0.xpi"
addon_id = driver.install_addon(addon_path, temporary=True)



def accept_cookies(driver, timeout=10):
    try:
        # Wait for the consent iframe to be present.
        consent_iframe = WebDriverWait(driver, timeout).until(
            EC.presence_of_element_located((By.XPATH, "//iframe[@title='SP Consent Message']"))
        )
        driver.switch_to.frame(consent_iframe)
        print("Switched to consent iframe.")

        # Locate and click the "Accept all" button inside the iframe.
        locator = (By.XPATH, "//button[@title='Accept all' and @aria-label='Accept all']")
        cookie_button = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable(locator)
        )
        cookie_button.click()
        print("Cookie accepted inside the consent iframe.")
        time.sleep(2)
    except Exception as e:
        print("Cookie acceptance button not found or error:", e)
    finally:
        driver.switch_to.default_content()

def get_clickable_elements(driver):
    elements = driver.find_elements(By.XPATH, "//a[@href] | //button | //*[@onclick]")
    visible_elements = [el for el in elements if el.is_displayed()]
    return visible_elements

def close_popup(driver, timeout=10):
    try:
        close_button = WebDriverWait(driver, timeout).until(
            EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Close']]"))
        )
        close_button.click()
        print("Close button clicked.")
        time.sleep(2)
    except Exception as e:
        print("Close button not found or error:", e)

def random_navigation(driver, max_attempts=10):
    original_url = driver.current_url
    for attempt in range(1, max_attempts + 1):
        clickable_elements = get_clickable_elements(driver)
        if not clickable_elements:
            print("No clickable elements found on the page.")
            break

        element = random.choice(clickable_elements)
        try:
            text = element.text.strip() or element.get_attribute("innerHTML") or "No text"
            print(f"Attempt {attempt}: Clicking on element with text: '{text[:50]}'")
            element.click()
            time.sleep(3)  # Allow time for potential navigation

            new_url = driver.current_url
            if new_url == original_url:
                print("Navigation did not occur. Going back and trying another element.")
                driver.get("https://www.theguardian.com/uk")
                close_popup(driver)
                time.sleep(2)
            elif "theguardian.com" not in new_url.lower():
                print(f"Navigated to external domain ({new_url}). Returning back.")
                driver.get("https://www.theguardian.com/uk")
                close_popup(driver)
                time.sleep(2)
            else:
                print("Navigation succeeded within theguardian.com! New URL:", new_url)
                close_popup(driver)
                return

        except Exception as e:
            print("Error during click:", e)
            driver.back()
            time.sleep(2)
    print("Failed to navigate successfully after", max_attempts, "attempts.")



x_coordinate = 111 # X position near the left edge of the screen
y_coordinate =  225   # Y position where the button is located

driver.get("https://wiki.xxiivv.com/site/uxntal.html")

time.sleep(3)
print("Moving the mouse to the target position...")
pyautogui.moveTo(x_coordinate, y_coordinate)
print("Mouse moved.")

pyautogui.click()
print("Mouse clicked.")


# Example usage:
# Open the initial page.
driver.get("https://www.theguardian.com/uk")
time.sleep(3)  # Allow the page to load.

accept_cookies(driver)

# Proceed with random navigation.
random_navigation(driver, 10)

# Perform multiple random navigations with pauses between
for i in range(20):
    time.sleep(45)
    print(f"Starting navigation iteration {i+1}")
    random_navigation(driver, 10)

print("Final Page Title:", driver.title)
print("Final URL:", driver.current_url)