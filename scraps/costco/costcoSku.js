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
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        ],
      });
      const page = await browser.newPage();
      page.setViewport({
        width: 1400,
        height: 1050,
      });

      await page.goto(`https://www.costco.com/CatalogSearch?keyword=${sku}`, {
        waitUntil: "load",
        timeout: 0,
      });

      // await page.type("#search-field", sku, { delay: 40 });
      // await page.keyboard.press("Enter");

      try {
        await page.reload({ waitUntil: "load", timeout: 0 });
         
        await page.waitForSelector("[itemprop=ratingValue]", { timeout: 30000 });
        await page.waitForSelector("[itemprop=reviewCount]", { timeout: 30000 });
        let product = await page.evaluate(this.extractData);
        console.log("extracted data=== ", product);
        if (product) {
          await browser.close()
          return product;
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
    let productImg = document.querySelectorAll('[property="og:image"]');
    if (productImg) {
      data["images"] = Array.from(productImg).map(item=>item.getAttribute('content'));
    }
    // Extract Product Sizes Available
    data["sizes"] = [];
    let productSize = document.querySelectorAll(
      "#swatches-productOption01 div fieldset span span"
    );
    if (productSize) {
      data["sizes"] = Array.from(productSize).map((item) => item.innerText);
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
    // Categories 
    data['category'] = []
    let catObj = document.querySelectorAll('.crumbs li [itemprop=name]')
    if(catObj) data['category'] = Array.from(catObj).map(item=>item.innerText).map(item=>item.replace(/Go to\s+↵?/g, ""))
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
    }
    // Extract rating
    data["stars"] = '';
    let prodRating = document.querySelector('[itemprop=ratingValue]');
    if (prodRating) {
      let rating = prodRating.innerText;
      data["stars"] = rating;
    }
    
    // Num Reviews 
    data["num_reviews"] = '';
    let numRevObj = document.querySelector('[itemprop=reviewCount]');
    if (numRevObj) {
      data["num_reviews"] = numRevObj.innerText;
    }
    return data;
  },
};
module.exports = COSTOCO;

COSTOCO.firstOne("1430643");
// COSTOCO.firstOne("", "1371082", "test");
