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
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
        ],
      });
      const page = await browser.newPage();
      page.setViewport({
        width: 1400,
        height: 1050,
      });
      await page.goto("https://www.costco.com/ ", {
        waitUntil: "load",
        timeout: 0,
      });
      let url = `https://www.costco.com/CatalogSearch?pageSize=24${q}`;
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
          await browser.close()
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
      let asin = item?.getAttribute('itemid')
      let ob = {
        asin,
        image: imageUrl,
        title,
        price,
        stars: rating?.replace(" out of 5 stars", ""),
        num_reviews: totalRating,
        link,
      };
      out.push(ob);
      ob = {};
    });
    out = out.filter((item) => item.image && item.title && item.price);
    let brandDom = Array.from(document.querySelectorAll('.panel.panel-default')).filter(item => item.querySelector('.panel-title').innerText.includes('Brand'))[0]
    let brands = Array.from(brandDom.querySelectorAll("div:nth-child(2) > div > span label > span:nth-child(1)")).map(item => item.innerText)
    let output = {
      brands,
      results: out
    }
    // Return scraped data

    return output;
  },
};
module.exports = COSTOCO;

// COSTOCO.firstOne("shoe nike ", "item_page_views+desc", "1");
