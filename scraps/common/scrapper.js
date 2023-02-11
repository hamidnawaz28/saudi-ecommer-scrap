const pluginStealth = require("puppeteer-extra-plugin-stealth");
const puppeteer = require("puppeteer-extra");
puppeteer.use(pluginStealth());
const randomUA = require("modern-random-ua");
const getBrowser = async () => {
  return await puppeteer.launch({
    headless: false,
    devtools: false,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--ignore-certificate-errors",
      "--disable-dev-shm-usage",
      "--lang=en-US;q=0.9,en",
      "--start-maximized",
      randomUA.generate(),
      "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
    ],
  });
};
const pageInterceptions = async (page) => {
  await page.setRequestInterception(true);
  page.on("request", (req) => {
    if (
      req.resourceType() == "stylesheet" ||
      req.resourceType() == "font" ||
      req.resourceType() == "image"
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });
};

const loadPage = async (page, url, timeOut = 30, waitTill = "load") => {
  await page.goto(url, {
    waitUntil: waitTill,
    timeout: timeOut * 1000,
  });
};
const waitForSelectorAndClick = async (page, selector, timeOut = 30) => {
  await page.waitForSelector(selector, {
    timeout: timeOut * 1000,
  });
  let btnClick2 = await page.$(selector);
  await btnClick2.click();
};

module.exports = {
  getBrowser,
  pageInterceptions,
  loadPage,
  waitForSelectorAndClick,
};
