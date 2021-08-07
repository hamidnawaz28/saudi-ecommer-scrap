"use strict";
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
var htmlparser = require("htmlparser2");
const randomUA = require("modern-random-ua");
const dJSON = require("dirty-json");
const getJson = (data) => JSON.parse(dJSON.parse(data));
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
          randomUA.generate(),
          // "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
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

      await page.type("#twotabsearchtextbox", sku, { delay: 1 });
      await page.keyboard.press("Enter");
      await page.waitForSelector(".a-link-normal.a-text-normal", {
        timeout: 5000000,
      });
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
          let images = [];
          let varients = [];
          try {
            let imagesData = await page.evaluate(this.getImagesData);
            images = getJson(imagesData)?.colorImages[
              "Pink Team Gold Black 700"
            ]?.map((item) => item?.large);
          } catch {
            images = [];
          }

          try {
            let varientsData = await page.evaluate(this.getVarientsData);
            let varientsDataObj =
              JSON.parse(varientsData).dimensionValuesDisplayData;
            varients = Object.keys(varientsDataObj)?.map((item) => {
              return {
                product_id: item,
                variant_specifics: [
                  { dimension: "Size", value: varientsDataObj?.[item]?.[0] },
                  { dimension: "Color", value: varientsDataObj?.[item]?.[1] },
                ],
              };
            });
          } catch {
            varients = [];
          }
          let product = await page.evaluate(this.extractData, images, varients);
          console.log("extracted data=== ", product);
          if (product) {
            await browser.close();
            return product;
          }
        } catch (err) {
          console.log("error =>", err);
        }
        await browser.close();
        return "Some Error";
      }
    } catch (err) {
      console.log("main try error", err);
    }
    if (browser !== "") {
      await browser.close();
    }
    return "done";
  },
  getImagesData() {
    var s = Array.from(document?.querySelectorAll("[type]")).filter((item) =>
      item?.innerText?.includes("ImageBlockBTF")
    )?.[0]?.innerText;
    let ob = s
      ?.match(
        /jQuery.parseJSON[\s\S.,-_:;a-zA-Z0-9\"]*?(?=data\[\"alwaysIncludeVideo\"\])/
      )?.[0]
      ?.replace("jQuery.parseJSON(", "")
      ?.replace(");", "");
    return ob;
  },
  getVarientsData() {
    var s = Array.from(document?.querySelectorAll("[type]")).filter((item) =>
      item?.innerText?.includes("twister-js-init-dpx-data")
    )?.[0]?.innerText;
    let ob = s
      ?.match(
        /var\s?dataToReturn\s?=[\s\S.,-_:;a-zA-Z0-9\"]*?(?=return\s?dataToReturn)/
      )?.[0]
      ?.replace(/var\s?dataToReturn\s?=\s?/, "")
      ?.replace(/\;/g, "");
    return ob;
  },
  findItemBySku() {
    let firstItem = document.querySelector(".a-link-normal.a-text-normal");
    if (firstItem) {
      return firstItem.href;
    }
    return false;
  },

  extractData(images, varients) {
    var data = {};
    data["images"] = images;
    data["all_variants"] = varients;
    var s = Array.from(document?.querySelectorAll("[type]")).filter((item) =>
      item?.innerText?.includes("ImageBlockBTF")
    )?.[0];
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
    let prodCategory = Array.from(
      document.querySelectorAll("#wayfinding-breadcrumbs_feature_div li")
    );
    if (prodCategory) {
      data["categories"] = prodCategory
        .map((item) => item.innerText)
        .filter((item) => item != "›");
    }

    // Extract description
    data["description"] = "";
    let productDescription = document.querySelector("#productDescription >p");
    if (productDescription) {
      try {
        data["description"] = productDescription.innerText.trim();
      } catch {
        data["description"] = "";
      }
    }

    // Extract Product images
    data["main_image"] = document
      .querySelector("[data-action=main-image-click] img")
      ?.getAttribute("src");

    // data["all_images"]=''
    // let AllImg =

    // Extract Product Sizes Available
    data["availSizes"] = [];
    let productSize = document.querySelectorAll(
      ".a-dropdown-item.dropdownAvailable"
    );
    if (productSize) {
      data["availSizes"] = Array.from(productSize).map(
        (item) => item.innerText
      );
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

    // Brand
    data["brand"] = document
      ?.querySelector("#bylineInfo")
      ?.innerText.replace(/[Bb]rand:?\s?/, "")
      ?.replace(/Visit the\s?/, "")
      ?.replace(/\s?[Ss]tore/, "");

    // Check if prime
    let prime = document
      .querySelector(
        "._multi-card-creative-desktop_DesktopGridColumn_gridColumn__2Jfab > div > a"
      )
      ?.getAttribute("aria-label")
      .includes("Eligible for Prime");
    if (prime) {
      data["prime"] = true;
    } else {
      data["prime"] = false;
    }

    // Feature Bullets
    let featureB = Array.from(
      document.querySelectorAll("#feature-bullets span ")
    );
    if (featureB) {
      data["feature_bullets"] = featureB.map((item) => item.innerText);
    }

    // Package Dimensions
    let PackgDimenstion = document.querySelector(
      "#detailBulletsWrapper_feature_div"
    );

    if (PackgDimenstion) {
      data["details"] = PackgDimenstion?.innerText;
    } else {
      data["details"] = "";
    }

    // Measurements
    let measurementArray = Array.from(
      document?.querySelectorAll("#detailBullets_feature_div li span")
    )
      ?.filter((item) => item?.innerText?.includes("Package Dimensions"))?.[0]
      ?.querySelector("span:nth-child(2)")
      ?.innerText.split(";");
    const [dimensions, weight] = measurementArray;
    data["dimensionUnit"] = dimensions.match(/[a-zA-Z]{2,}/)?.[0];
    [data["length"], data["width"], data["height"]] = dimensions
      ?.replace(/\s?[a-zA-Z]{2,}/, "")
      ?.split(" x ");
    data["weight"] = weight?.match(/[0-9.]+/)?.[0];
    data["weightUnit"] = weight?.match(/[a-zA-Z]+/)?.[0];

    return data;
  },
};
module.exports = AMAZON;

// AMAZON.firstOne("B07T3P4ZB4");
// AMAZON.firstOne("B085T3PGGR");
