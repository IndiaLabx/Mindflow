from playwright.sync_api import sync_playwright, expect
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate directly to the Quiz Config page
        print("Navigating to app...")
        page.goto("http://localhost:4173/MindFlow/#/quiz/config")

        # Bypass intro and onboarding
        page.evaluate("localStorage.setItem('mindflow_intro_seen', 'true')")
        page.evaluate("localStorage.setItem('mindflow_onboarding_seen', 'true')")
        page.reload()

        time.sleep(3)

        try:
           # Open the Advanced Filters accordion if it exists
           page.get_by_text("Advanced Filters", exact=True).click(force=True)
           time.sleep(1)
        except Exception as e:
           print(f"Couldn't open Advanced Filters: {e}")

        try:
           # Click the dropdown
           print("Opening dropdown...")
           dropdown = page.get_by_text("Filter by Tags", exact=True).first
           dropdown.click(force=True)
           time.sleep(1)

           # Type to test debounce
           print("Typing in search...")
           search_input = page.get_by_placeholder("Search...")
           search_input.fill("test tag")
           time.sleep(1) # wait for debounce

           print("Taking screenshot of the open dropdown...")
           page.screenshot(path="/home/jules/verification/dropdown_open_debounced.png")
           print("Screenshot saved to /home/jules/verification/dropdown_open_debounced.png")
        except Exception as e:
           print(f"Error opening dropdown: {e}")

        browser.close()

if __name__ == "__main__":
    run()
