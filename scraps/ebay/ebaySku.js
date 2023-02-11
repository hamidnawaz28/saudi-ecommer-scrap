"use strict";
const {
  getBrowser,
  pageInterceptions,
  loadPage,
  waitForSelectorAndClick,
} = require("../common/scrapper");
const { sleep } = require("../common/utils");

const EBAY = {
  async item(itemNumber) {
    let browser = "";
    try {
      browser = await getBrowser();
      let page = await browser.newPage();
      pageInterceptions(page);
      await loadPage(page, `https://www.ebay.co.uk/itm/${itemNumber}`);
      let product = await page.evaluate(this.extractData);
      console.log(product);
      await browser.close();
      return product;
    } catch (err) {
      console.log("main try error", err);
    }
  },

  extractData() {
    let data = {};

    data["title"] =
      document.querySelector(".x-item-title__mainTitle")?.innerText || null;

    data["sub_title"] =
      document.querySelector(".x-item-title__subTitle")?.innerText || null;

    data["urgency"] = document.querySelector("#urgency")?.innerText || null;

    data["condition"] = document.querySelector(
      ".x-item-condition-text .clipped"
    )?.innerText;

    data["shipping"] =
      document.querySelector("#fshippingCost")?.innerText || null;

    data["price"] =
      document.querySelector("[itemprop=price]")?.getAttribute("content") ||
      null;

    data["sold"] =
      document.querySelector("#why-to-buy li:nth-child(2)")?.innerText || null;

    data["image"] = document
      ?.querySelector("[name='twitter:image']")
      ?.getAttribute("content");

    data["listing_type"] = document.querySelector(".x-bid-count")
      ? "bid"
      : "best_offer";

    data["currency"] =
      document
        ?.querySelector("[itemprop=priceCurrency]")
        ?.getAttribute("content") || null;

    return data;
  },
};
module.exports = EBAY;

EBAY.item("374465631884");
