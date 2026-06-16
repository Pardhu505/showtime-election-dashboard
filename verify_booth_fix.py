import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        try:
            await page.goto("http://localhost:3000", timeout=10000)
        except Exception as e:
            print(f"Frontend failed: {e}")
            await browser.close()
            return

        # Polling Station Detail section
        # Locate the Year select
        await page.select_option("div.hp-ed-group:has-text('Polling Station Wise Detail Results') select", label="2024")
        # Locate the State select
        await page.select_option("div.hp-ed-group:has-text('Polling Station Wise Detail Results') select:nth-child(3)", label="Punjab")

        await page.click("button:text('Get Result')")

        # Login
        await page.fill("input[type='email']", "contact@showtimeconsulting.in")
        await page.fill("input[type='password']", "Welcome@123")
        await page.click("button[type='submit']")

        await page.wait_for_timeout(3000)

        content = await page.content()
        if "Verify backend connectivity" in content:
            print("SUCCESS: Found improved error message with health link!")
        else:
            print("FAILURE: Improved error message NOT found.")

        await page.screenshot(path="booth_error_verification.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
