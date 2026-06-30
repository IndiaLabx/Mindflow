from playwright.sync_api import sync_playwright

def run_verification():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using desktop viewport
        context = browser.new_context(viewport={'width': 1280, 'height': 800})
        page = context.new_page()

        try:
            page.goto("http://localhost:3001/", timeout=10000)
            page.wait_for_timeout(3000)

            # Click skip if welcome intro exists
            try:
                page.locator("text=Skip").click(timeout=2000)
                page.wait_for_timeout(2000)
            except:
                pass

            # Log in
            email_input = page.locator('input[type="email"]')
            if email_input.is_visible():
                email_input.fill("mindflow@user.com")
                page.locator('input[type="password"]').fill("Test@1234")
                page.locator('button[type="submit"]').click()
                page.wait_for_timeout(4000)

            page.goto("http://localhost:3001/dashboard")
            page.wait_for_timeout(4000)

        except Exception as e:
            print(f"Error: {e}")

        page.screenshot(path="/tmp/verification_desktop_dash.png", full_page=True)
        context.close()
        browser.close()

if __name__ == "__main__":
    run_verification()
