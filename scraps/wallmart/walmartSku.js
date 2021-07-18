const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

const WALMART = {
  async firstOne(sku) {
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

      await page.goto("https://www.walmart.com/",
        {
          waitUntil: "load",
          timeout: 0,
        });

      await page.goto(
        "https://www.walmart.com/search/?query=" +
        sku
        ,
        {
          waitUntil: "load",
          timeout: 0,
        }
      );
      let foundItem = await page.evaluate(this.findItemBySku);
      if (foundItem) {
        try {
          await page.goto(foundItem, {
            waitUntil: "load",
            timeout: 0,
          });
          let product = await page.evaluate(this.extractData);
          console.log("extracted data=== ", product);
          if (product) {
            return product
          }
        } catch (err) {
          console.log("error =>", err);
        }
      } else {
        console.log("Product not found");
      }
    } catch (err) {
      console.log("main try error", err);
    }
    if (browser !== "") {
      await browser.close();
    }
    return "done";
  },
  findItemBySku() {

    let firstItem = document.querySelector(
      ".arrange-fill a"
    );
    if (firstItem) {
      return firstItem.href;
    }
    return false;

  },
  extractData() {
    // Set empty data object

    var data = {};
    
    // Set Brand
    let productBrand = document.querySelector('.hf-Bot span');
    if (productBrand) {
      data["brand"] = productBrand.innerText;
    }

    // Set title
    let productTitle = document.querySelector('[property="og:title"]');

    if (productTitle) {
      data["title"] = productTitle.getAttribute("content")
        .replace(" - Walmart.com", "")
        .trim();
    }

    // Set Size
    data["sizes"] = [];
    let productSize = document.querySelectorAll('.cont__content:not(.not-available-variant-label)');
    if (productSize) {
      data["sizes"] = Array.from(productSize).map(a => a.innerText)
    }

    // Set category
    data["category"] = [];

    let productCat = document.querySelectorAll('.breadcrumb');
    if (productCat) {
      data["category"] = Array.from(productCat).map(a => a.innerText.replace("/", ""))
    }

    // Set Price
    data["main_price"] = "0";
    data["offered-price"] = "0";
    let price = document.querySelector('.price-old .visuallyhidden').innerText.toLowerCase()
    let ofPrice = document.querySelector('.prod-PriceHero .visuallyhidden').innerText
    if (price.includes('was')) {
      data["main_price"] = price.replace('was ', '');
      data["offered-price"] = ofPrice
    }
    else {
      data["offered-price"] = ofPrice
    }

    data["url"] = document.URL;

    // Set Product images
    data["images"] = [];
    let productImages = document.querySelectorAll('.slider-frame ul')[0].querySelectorAll('li img')
    if (productImages) {
      data["images"] = Array.from(productImages).map((a) => a.src);
    }

    // Get Rating
    data["stars"] = ""
    let productRating = document.querySelector('[itemprop="ratingValue"]');
    if (productRating) {
      data["stars"] = productRating.innerText
    }

    // Get Total Rating
    data["num_reviews"] = "";
    let totalRating = document.querySelector('.stars-reviews-count-node')
    if (totalRating) {
      data["num_reviews"] = totalRating.innerText.replace(' ratings','')
    }

    // Get Description
    if (document.querySelector("[property='og:description']")) {
      data["description"] = document
        .querySelector("[property='og:description']")
        .getAttribute("content")
        .trim();
    }

    // Set color 
    data["color"] = " ";
    let colObj = document.querySelector('.varslabel__content')
    if(colObj) data["color"] = colObj.innerText

    // Set Supplier
    data["supplier"] = "Walmart";
    
    // Set Currency
    let currObj = document.querySelector('.price-currency')
    data["currency"] = ''
    if(currObj){
      data["currency"] = currObj?.getAttribute('content')
    }
    // Return scraped data
    return data;
  },
};
module.exports = WALMART;

// WALMART.firstOne(595043117); //keybord

// WALMART.firstOne('270570931'); //bachi

// WALMART.firstOne('', '276150604', 'test');
