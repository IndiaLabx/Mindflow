from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        try:
            page.goto("http://localhost:4173/MindFlow/")
            page.wait_for_timeout(2000)

            page.get_by_role("button", name="Start Learning").click()
            page.wait_for_timeout(1000)

            # Go to dashboard
            page.get_by_role("button", name="Create Quiz").click()
            page.wait_for_timeout(2000)

            # Select Mock Mode
            page.get_by_text("Mock Mode").click()
            page.wait_for_timeout(1000)

            # Create Quiz
            page.get_by_role("button", name="Create Custom Quiz").click()
            page.wait_for_timeout(3000) # Wait for engine to spin up

            # Snapshot
            page.screenshot(path="verification/mock_engine_active.png")
            print("Screenshot saved to verification/mock_engine_active.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/mock_engine_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify()
