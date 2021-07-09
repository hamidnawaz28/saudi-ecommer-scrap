"use strict";

const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

const AMAZON = {
  async firstOne(q) {
    let queries = Object.keys(q)
      .map((item) => `&${item}=${q[item]}`.split(" ").join("+"))
      .join("");
    let browser = "";
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          "--no-sandbox",
          // "--disable-setuid-sandbox",
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
      let url = `https://www.amazon.com/s?${queries}`;
      console.log("Url--------", url);
      await page.goto(url, {
        waitUntil: "load",
        timeout: 0,
      });
      try {
        let product = await page.evaluate(this.extractData);
        console.log("extracted data=== ", product);
        if (product) {
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
    let out = [];
    Array.from(
      document.querySelectorAll(".a-section.a-spacing-medium")
    ).forEach((item) => {
      var imag = item.querySelector("img")?.src;
      let title = item.querySelector(".a-link-normal.a-text-normal")?.innerText;
      let rating = item.querySelector(".a-icon-alt")?.innerText;
      let totalRating = item.querySelector(".a-size-base")?.innerText;
      let price = item.querySelector(".a-price span.a-offscreen")?.innerText;
      let link = item.querySelector(
        "a-size-base.a-link-normal.a-text-normal"
      )?.innerText;

      let ob = {
        imageUrl: imag,
        title,
        price,
        rating: rating?.replace(" out of 5 stars", ""),
        // ratings: totalRating,
        link,
      };
      out.push(ob);
      ob = {};
    });
    out = out.filter((item) => item.imageUrl && item.title);
    return out;
  },
};
module.exports = AMAZON;

// AMAZON.firstOne('shoe nike new', 'price-asc-rank', '25');
