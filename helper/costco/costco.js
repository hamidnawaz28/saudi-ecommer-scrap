"use strict";

const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());
const COSTOCO = {
  async firstOne(query) {
    let q = Object.keys(query)
    .map((item) => `&${item}=${query[item]}`.split(" ").join("+"))
    .join("");
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
      let url = `https://www.costco.com/CatalogSearch?&dept=All&pageSize=24&${q}`;
      console.log("Url--------", url);
      await page.goto(url, {
        waitUntil: "load",
        timeout: 0,
      });
      await autoScroll(page);
      try {
        let product = await page.evaluate(this.extractData);
        console.log("extracted data=== ", product);
        if (product) {
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
    async function autoScroll(page) {
      await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
          var totalHeight = 0;
          var distance = 100;
          var timer = setInterval(() => {
            var scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              resolve();
            }
          }, 100);
        });
      });
    }
  },

  extractData() {
    let out = [];

    Array.from(document.querySelectorAll(".thumbnail")).forEach((item) => {
      var imageUrl = item.querySelector(
        ".product-img-holder.link-behavior > a img:not(.product-out-stock-overlay)"
      )?.src;
      let title = item.querySelector(".description a")?.innerText;
      let rating = item
        .querySelector(".ratings.row>div")
        ?.getAttribute("aria-label")
        ?.split("out")[0]
        ?.match(/[0-9]/g)
        ?.join()
        ?.replace(",", ".");
      let totalRating = item
        .querySelector(".ratings.row>div")
        ?.getAttribute("aria-label")
        ?.split("based on")[1]
        ?.match(/[0-9]/g)
        ?.join()
        ?.replace(/[,]+/g, "");
      let price = item
        .querySelector(".price")
        ?.innerText?.replace(/[\t \n ]+/g, "");
      let link = item.querySelector(".description>a")?.href;
      let ob = {
        imageUrl,
        title,
        price,
        rating: rating?.replace(" out of 5 stars", ""),
        ratings: totalRating,
        link,
      };
      out.push(ob);
      ob = {};
    });
    out = out.filter((item) => item.imageUrl && item.title);
    // Return scraped data

    return out;
  },
};
module.exports = COSTOCO;

COSTOCO.firstOne("shoe nike ", "item_page_views+desc", "1");
