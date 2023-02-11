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
  async firstOne(asin) {
    let browser = "";
    try {
      browser = await puppeteer.launch({
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
          // "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        ],
      });
      const page = await browser.newPage();
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
      // page.setViewport({
      //   width: 1400,
      //   height: 1050,
      // });

      await page.goto("https://www.amazon.com/", {
        waitUntil: "load",
        timeout: 0,
      });

      await page.type("#twotabsearchtextbox", asin, { delay: 1 });
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
            let color = await page.evaluate(this.getColor);
            images = getJson(imagesData)?.colorImages[color]?.map(
              (item) => item?.large
            );
          } catch {
            images = [];
          }

          try {
            let varientsData = await page.evaluate(this.getVarientsData);
            let varientsDataObj =
              dJSON.parse(varientsData).dimensionValuesDisplayData;
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
          let product = await page.evaluate(
            this.extractData,
            images,
            varients,
            asin
          );
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
  getColor() {
    let colorObj = document.querySelector("#variation_color_name .selection");
    if (colorObj) {
      return colorObj.innerText;
    }
  },
  getImagesData() {
    var s = Array.from(document?.querySelectorAll("[type]"))?.filter((item) =>
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
    var s = Array.from(document?.querySelectorAll("[type]"))?.filter((item) =>
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
      return firstItem?.href;
    }
    return false;
  },

  extractData(images, varients, asin) {
    var data = {};
    data["images"] = images;
    data["all_variants"] = varients;
    data["product_id"] = asin;
    data["site"] = "www.amazon.com";
    data["url"] = window?.location?.href;
    data["specs "] = "revisit"; //key-value pairs
    // Extract Brand
    let productBrand = document.querySelector("#detailBullets_feature_div");
    if (productBrand) {
      data["brand_name"] = productBrand?.innerText
        ?.split("Manufacturer")[1]
        ?.replace("\n", ":")
        ?.split(":")[1]
        ?.replace(/[" " ]+/g, "");
    }

    // Extract title
    let productTitle = document.querySelector("#productTitle");
    if (productTitle) {
      data["title"] = productTitle?.innerText?.trim();
    }

    // Selected Color
    let colorObj = document.querySelector("#variation_color_name .selection");
    if (colorObj) {
      data["color"] = colorObj.innerText;
    }

    // Selected size
    let sizeObj = document.querySelector(
      "#dropdown_selected_size_name .a-dropdown-prompt"
    );
    if (sizeObj) {
      data["size"] = sizeObj.innerText;
    }

    // Varient specific
    data[
      "variant_specifics"
    ] = `Size: ${data["size"]}, Color: ${data["color"]}`;

    //Extract Category
    let prodCategory = Array.from(
      document.querySelectorAll("#wayfinding-breadcrumbs_feature_div li")
    );
    if (prodCategory) {
      data["category"] = prodCategory
        ?.map((item) => item?.innerText)
        ?.filter((item) => item != "›");
    }

    // Extract description
    data["description"] = "";
    let productDescription = document.querySelector("#productDescription >p");
    if (productDescription) {
      try {
        data["description"] = productDescription?.innerText?.trim();
      } catch {
        data["description"] = "";
      }
    }

    // Extract Product images
    data["main_image"] = "";
    let mainImgObj = document.querySelector("#imgTagWrapperId img");
    if (mainImgObj) {
      data["main_image"] = mainImgObj?.src;
    }
    // data["all_images"]=''
    // let AllImg =

    // Extract Product Sizes Available
    data["sizes"] = [];
    let productSizeObj = document.querySelectorAll(
      ".a-dropdown-item.dropdownAvailable"
    );
    if (productSizeObj) {
      data["sizes"] = Array.from(productSizeObj)?.map(
        (item) => item?.innerText
      );
    }

    // Extract rating
    data["stars"] = [];
    let prodRatingObj = document.querySelector(".a-icon-alt");
    if (prodRatingObj) {
      let rating = prodRatingObj?.innerText?.replace(" out of 5 stars", "");
      data["stars"] = rating;
    }

    // Extract price
    data["offered_price"] = "";
    let prodPrice = document.querySelector("#priceblock_ourprice");
    if (prodPrice) {
      let extractedPrice = prodPrice?.innerText;
      data["offered_price"] = extractedPrice;
    }
    data["price"] = "";
    let prodmPrice = document.querySelector(
      ".priceBlockStrikePriceString.a-text-strike"
    );
    if (prodmPrice) {
      try {
        let extractedPrice = prodmPrice?.innerText;
        data["price"] = extractedPrice;
      } catch {
        data["price"] = "";
      }
    }

    // Extract color
    data["color"] = [];
    let prodColor = document.querySelector(
      "#variation_color_name >.a-row> .selection"
    );
    if (prodColor) {
      try {
        let extractedColor = prodColor?.innerText;
        data["color"] = extractedColor;
      } catch {
        data["color"] = "";
      }
    }

    // Retailer
    data["retailer"] = "amazon";

    // Brand
    data["brand_name"] = document
      ?.querySelector("#bylineInfo")
      ?.innerText?.replace(/[Bb]rand:?\s?/, "")
      ?.replace(/Visit the\s?/, "")
      ?.replace(/\s?[Ss]tore/, "");

    // Check if prime
    let prime = document.querySelector("#prime_feature_div");
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
      data["feature_bullets"] = featureB?.map((item) => item?.innerText);
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
    const packageDimensions = (
      length,
      width,
      depth,
      weight,
      dimensionUnit,
      weightUnit
    ) => {
      return {
        size: {
          width: {
            amount: width,
            unit: dimensionUnit,
          },
          depth: {
            amount: depth,
            unit: dimensionUnit,
          },
          length: {
            amount: length,
            unit: dimensionUnit,
          },
        },
        weight: {
          amount: weight,
          unit: weightUnit,
        },
      };
    };
    // Measurements
    let measurementsObject = document?.querySelectorAll(
      "#detailBullets_feature_div li span"
    );
    if (measurementsObject) {
      let measurementArray = Array.from(measurementsObject)
        ?.filter((item) => item?.innerText?.includes("Package Dimensions"))?.[0]
        ?.querySelector("span:nth-child(2)")
        ?.innerText?.split(";");
      const dimensions = measurementArray?.[0];
      const weightObj = measurementArray?.[1];

      const dimensionUnit = dimensions?.match(/[a-zA-Z]{2,}/)?.[0];
      const dimData = dimensions?.replace(/\s?[a-zA-Z]{2,}/, "")?.split(" x ");
      const length = dimData?.[0];
      const width = dimData?.[1];
      const depth = dimData?.[2];

      const weight = weightObj?.match(/[0-9.]+/)?.[0];
      const weightUnit = weightObj?.match(/[a-zA-Z]+/)?.[0];
      data["length"] = length;
      data["width"] = width;
      data["height"] = depth;
      data["weight"] = weight;
      data["dimensionUnit"] = dimensionUnit;
      data["weightUnit"] = weightUnit;
      data["package_dimensions"] = packageDimensions(
        length,
        width,
        depth,
        weight,
        dimensionUnit,
        weightUnit
      );
      data["specs"] = {};
      Array.from(document.querySelectorAll("#twister .a-row"))?.forEach(
        (item) => {
          let label = item
            ?.querySelector("label")
            ?.innerText?.replace(/:\s?/, "");
          let value = item?.querySelector("span")?.innerText;
          data["specs"][label] = value;
          return true;
        }
      );
      Array.from(document.querySelectorAll("#poExpander tbody tr"))?.forEach(
        (item) => {
          let label = item?.querySelector("td:nth-child(1) span")?.innerText;
          let value = item?.querySelector("td:nth-child(2) span")?.innerText;
          data["specs"][label] = value;
          return true;
        }
      );
    }
    return data;
  },
};
module.exports = AMAZON;

AMAZON.firstOne("B0971C8SZD");
// AMAZON.firstOne("B07T3P4ZB4");
// AMAZON.firstOne("B085T3PGGR");
