from playwright.sync_api import sync_playwright

def verify():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Using a mobile viewport to simulate PWA
        context = browser.new_context(
            viewport={'width': 390, 'height': 844},
            user_agent='Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
        )
        page = context.new_page()

        # Enable dark mode just to see the UI clearly
        page.add_init_script("""
            localStorage.setItem('mindflow_settings_v1_darkMode', 'true');
            document.documentElement.classList.add('dark');
        """)

        try:
            # Go to app
            page.goto("http://localhost:4173/MindFlow/")
            page.wait_for_load_state('networkidle')

            # Click Start
            page.get_by_role("button", name="Start Learning").click()
            page.wait_for_timeout(1000)

            # Go to Create Quiz
            page.get_by_role("button", name="Create Quiz").click()
            page.wait_for_timeout(1000)

            # Select Mock Mode
            page.get_by_text("Mock Exam").click()

            # Create Quiz
            page.get_by_role("button", name="Create Custom Quiz").click()
            page.wait_for_timeout(2000)

            # We should be in MockSession now.
            # Let's verify the Timer is visible (which uses the Web Worker now)
            page.wait_for_selector(".lucide-clock")

            # Take a screenshot
            page.screenshot(path="verification/mock_engine_active.png")
            print("Screenshot saved to verification/mock_engine_active.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/mock_engine_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify()
