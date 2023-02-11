const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Login to Facebook
  await page.goto("https://www.facebook.com");
  await page.type("#email", "your_email");
  await page.type("#pass", "your_password");
  await page.click("#loginbutton");
  await page.waitForNavigation();

  // Go to Facebook Marketplace
  await page.goto("https://www.facebook.com/marketplace");
  await page.waitForSelector('[data-testid="sell-something-cta-button"]');
  await page.click('[data-testid="sell-something-cta-button"]');
  await page.waitForNavigation();

  // Fill out listing form
  await page.waitForSelector("#marketplace_sell_item_title");
  await page.type("#marketplace_sell_item_title", "Item Name");
  await page.type("#marketplace_sell_item_description", "Item Description");
  await page.type("#marketplace_sell_item_price", "100");

  // Upload photo
  const input = await page.$('input[type="file"]');
  await input.uploadFile("path/to/image.jpg");

  // Submit listing
  await page.click("#marketplace_sell_item_submit_button");

  // Close the browser
  await browser.close();
})();
