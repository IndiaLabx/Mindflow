import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 900})

        # Bypass intro and onboarding
        await page.add_init_script("""
            localStorage.setItem('mindflow_intro_seen', 'true');
            localStorage.setItem('mindflow_onboarding_seen', 'true');
        """)

        # Navigate to Quiz Config page
        await page.goto("http://localhost:4173/MindFlow/#/quiz/config")
        await page.wait_for_load_state('networkidle')

        print("Clicking Advanced Filters...")
        # Click the Advanced Filters accordion
        await page.get_by_text("Advanced Filters").click()
        await page.wait_for_timeout(500)

        print("Clicking Filter by Tags...")
        # Scroll down
        await page.evaluate("window.scrollBy(0, 500)")

        # Click the multi-select dropdown trigger
        await page.get_by_text("Filter by Tags").click()
        await page.wait_for_timeout(500)

        print("Typing in search to show options...")
        # The search input should now be visible
        await page.get_by_placeholder("Search...").fill("SSC")
        await page.wait_for_timeout(500)

        # Take a screenshot
        await page.screenshot(path="/home/jules/verification/dropdown_open_ssc.png")
        print("Screenshot saved to /home/jules/verification/dropdown_open_ssc.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
