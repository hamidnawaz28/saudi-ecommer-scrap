"use strict";

const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

const COSTOCO = {
  async firstOne(sku) {
    sku = sku.trim();
    let browser = "";
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--ignore-certificate-errors",
          "--disable-dev-shm-usage",
          "--lang=en-US;q=0.9,en",
        ],
      });
      const page = await browser.newPage();
      page.setViewport({
        width: 1400,
        height: 1050,
      });

      await page.goto("https://www.costco.com/", {
        waitUntil: "load",
        timeout: 0,
      });

      await page.type("#search-field", sku, { delay: 40 });
      await page.keyboard.press("Enter");

      try {
        await page.reload({ waitUntil: "load", timeout: 0 });
        let product = await page.evaluate(this.extractData);
        console.log("extracted data=== ", product);
        if (product) {
          return product
        }
      } catch (err) {
        console.log("error =>", err);
      }
      await browser.close();
      return "done";
    } catch (err) {
      console.log("main try error", err);
    }
    if (browser !== "") {
      await browser.close();
    }
    return "done";
  },

  extractData() {
    var data = {};

    // Extract Brand
    let productBrand = document.querySelector('[itemprop="brand"]');
    if (productBrand) {
      data["brand"] = productBrand.innerText;
    }
    // Extract title
    let productTitle = document.querySelector('[property="og:title"]');
    if (productTitle) {
      data["title"] = productTitle.getAttribute("content");
    }

    // Extract description
    data["description"] = "";
    let productDescription = document.querySelector('[name="description"]');
    if (productDescription) {
      data["description"] = productDescription
        .getAttribute("content")
        .replace(/[\n]+/g, "");
    }

    // Extract Product images
    data["images"] = [];
    let productImg = document.querySelectorAll("#theViews div div a img");
    if (productImg) {
      let extractedImg = Array.from(productImg).map((item) => item.src);
      data["images"].push(extractedImg);
    }
    // Extract Product Sizes Available
    data["availSizes"] = [];
    let productSize = document.querySelectorAll(
      "#swatches-productOption01 div fieldset span span"
    );
    if (productSize) {
      let extractedSize = Array.from(productSize).map((item) => item.innerText);
      data["availSizes"].push(extractedSize);
    }

    // Extract price
    data["price"] = [];
    let prodPrice = document.querySelector('[property="product:price:amount"]');
    if (prodPrice) {
      let extractedPrice = prodPrice.getAttribute("content");
      data["price"] = extractedPrice;
    }
    //Extract Currency
    data["currency"] = [];
    let proCurrency = document.querySelector(
      '[property="product:price:currency"]'
    );
    if (proCurrency) {
      let extractedCurrency = proCurrency.getAttribute("content");
      data["currency"] = extractedCurrency;
    }
    // Extract color
    data["color"] = [];
    let prodColor = document.querySelector(".product-info-description ul");
    if (prodColor) {
      let extractedColor = prodColor.innerText;
      if (extractedColor.includes("Colors")) {
        data["color"] = extractedColor?.split("Colors:")[1]?.split("\n")[0];
      } else {
        data["color"] = extractedColor?.split("Color:")[1]?.split("\n")[0];
      }
      // Extract rating
      data["rating"] = [];
      let prodRating = document.querySelector('[itemprop="ratingValue"]');
      if (prodRating) {
        let rating = prodRating.innerText;
        data["rating"] = rating;
      }
    }

    return data;
  },
};
module.exports = COSTOCO;

// COSTOCO.firstOne("", "1444292", "test");
// COSTOCO.firstOne("", "1371082", "test");
