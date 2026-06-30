from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        try:
            page.goto("http://localhost:4173/MindFlow/")
            page.wait_for_load_state('networkidle')
            page.wait_for_timeout(2000)

            # Start
            page.get_by_text("Start Learning").click()
            page.wait_for_timeout(1000)

            # Navigate to Quiz Config
            page.evaluate("window.location.hash = '#/quiz/config'")
            page.wait_for_timeout(2000)

            # Mock
            page.get_by_text("Mock Exam").click()
            page.wait_for_timeout(1000)

            # Start Quiz
            page.get_by_role("button", name="Create Custom Quiz").click()
            page.wait_for_timeout(3000)

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
