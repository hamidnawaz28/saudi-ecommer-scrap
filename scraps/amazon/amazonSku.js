"use strict";
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());
const sleep = (duration) =>
new Promise((resolve) => setTimeout(resolve, duration));
const msleep = 2000; // sleeping time

const AMAZON = {
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
  
      await page.goto("https://www.amazon.com/", {
        waitUntil: "load",
        timeout: 0,
      });
      await page.type("#twotabsearchtextbox", sku, { delay: 40 });
      await page.keyboard.press("Enter");
      await sleep(msleep);
      let foundItem = await page.evaluate(this.findItemBySku);
      if (foundItem) {
        try {
          await page.goto(foundItem, {
            waitUntil: "load",
            timeout: 0,
          });

          await page.waitForSelector(".a-button-text.a-declarative", {
            timeout: 5000,
          });
          let btnClick2 = await page.$(".a-button-text.a-declarative");
          await btnClick2.click();
          await sleep(500);
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
    let firstItem = document.querySelector(".a-link-normal.a-text-normal");
    if (firstItem) {
      return firstItem.href;
    }
    return false;
  },
  extractData() {
    var data = {};

    // Extract Brand
    let productBrand = document.querySelector("#detailBullets_feature_div");
    if (productBrand) {
      data["brand_name"] = productBrand.innerText
        .split("Manufacturer")[1]
        .replace("\n", ":")
        .split(":")[1]
        .replace(/[" " ]+/g, "");
    }
    
    // Extract title
    let productTitle = document.querySelector("#productTitle");
    if (productTitle) {
      data["title"] = productTitle.innerText.trim();
    }
   
    //Extract Category
    let prodCategory= Array.from(document.querySelectorAll("#wayfinding-breadcrumbs_feature_div li"))
    if(prodCategory){
      data["category"]=prodCategory.map(item=>item.innerText).filter(item=>item!="›")
    }
    
    // Extract description
    data["description"]='';
    let productDescription = document.querySelector("#productDescription >p");
    if (productDescription) {
      try {
        data["description"] = productDescription.innerText.trim();
      } catch {
        data["description"] = "";
      }
    }

    // Extract Product images
    data["main_image"] = [];
    let productImg = Array.from(document.querySelectorAll(".a-unordered-list.a-nostyle.a-horizontal.list.maintain-height img"))
    if (productImg) {
      let extractedImg = productImg.map(item=>item.src);
      data["main_image"].push(extractedImg);
    }

    // data["all_images"]=''
    // let AllImg =
    
    // Extract Product Sizes Available
    data["availSizes"] = [];
    let productSize = document.querySelectorAll(
      ".a-dropdown-item.dropdownAvailable"
    );
    if (productSize) {
      let extractedSize = Array.from(productSize).map((item) => item.innerText);
      data["availSizes"].push(extractedSize);
    }

    // Extract rating
    data["stars"] = [];
    let prodRating = document.querySelector(".a-icon-alt");
    if (prodRating) {
      let rating = prodRating.innerText.replace(" out of 5 stars", "");
      data["stars"] = rating;
    }
   
    // Extract price
    data["offerPrice"] = [];
    let prodPrice = document.querySelector("#priceblock_ourprice");
    if (prodPrice) {
      let extractedPrice = prodPrice.innerText;
      data["offerPrice"] = extractedPrice;
    }
    data["mainPrice"] = [];
    let prodmPrice = document.querySelector(
      ".priceBlockStrikePriceString.a-text-strike"
    );
    if (prodmPrice) {
      try {
        let extractedPrice = prodmPrice.innerText;
        data["mainPrice"] = extractedPrice;
      } catch {
        data["mainPrice"] = "";
      }
    }
    
    // Extract color
    data["color"] = [];
    let prodColor = document.querySelector(
      "#variation_color_name >.a-row> .selection"
    );
    if (prodColor) {
      try {
        let extractedColor = prodColor.innerText;
        data["color"] = extractedColor;
      } catch {
        data["color"] = "";
      }
    }

    // Retailer
    data["retailer"] = "Amazon";
    
    // Check if prime
    let prime = document.querySelector("._multi-card-creative-desktop_DesktopGridColumn_gridColumn__2Jfab > div > a")?.getAttribute("aria-label").includes("Eligible for Prime");
    if(prime){
        data["Prime"]=true;
      }
      else{
        data["Prime"]=false;
      }

     // Feature Bullets
     let featureB = Array.from(document.querySelectorAll("#feature-bullets span "))
     if(featureB){
      data["FeatureBullets"]=featureB.map(item=>item.innerText)
     }

     // Package Dimensions
     let PackgDimenstion = document.querySelector("#detailBulletsWrapper_feature_div")

     if(PackgDimenstion){
         data["PackageDimention"]=PackgDimenstion?.innerText;
       }
       else{
         data["PackageDimention"]='';
       }

      //Variants...


    return data;
  },
};
module.exports = AMAZON;

AMAZON.firstOne('B07T3P4ZB4');
// AMAZON.firstOne('B08X75NTSX');
// AMAZON.firstOne('B0963R7SJN');
// AMAZON.firstOne('', 'B07HRC68QF', 'test');
