"use strict";

const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

const AMAZON = {
  async search(q) {
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
          "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
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
    let brands = Array.from(
      document.querySelectorAll("[aria-labelledby=p_89-title] > li")
    )
      .map((item) => item.getAttribute("aria-label"))
      .filter((item) => item);
    let departments = Array.from(
      document.querySelectorAll("#departments> ul li a span")
    )?.map((item) => item?.innerText);
    let reviews = Array.from(
      document.querySelectorAll("#reviewsRefinements> ul li i span ")
    )?.map((item) => item?.innerText);
    let priceFilter = Array.from(
      document.querySelectorAll("#priceRefinements> ul li a span")
    )?.map((item) => item?.innerText);
    Array.from(
      document.querySelectorAll("[data-component-type=s-search-result]")
    ).forEach((item) => {
      var imag = item.querySelector("img")?.src;
      let title = item.querySelector(".a-link-normal.a-text-normal")?.innerText;
      let rating = item.querySelector(".a-icon-alt")?.innerText;
      let totalRating = item.querySelector(".a-size-base")?.innerText;
      let price = item.querySelector(".a-price span.a-offscreen")?.innerText;
      let link = item.querySelector(
        "a-size-base.a-link-normal.a-text-normal"
      )?.innerText;
      let sku = item.getAttribute("data-asin");
      let isPrime = item.innerText.includes("Eligible for Prime")
        ? true
        : false;
      let ob = {
        image: imag,
        title,
        price,
        stars: rating?.replace(" out of 5 stars", ""),
        num_reviews: totalRating,
        link,
        asin: sku,
        prime: isPrime,
      };

      out.push(ob);
      ob = {};
    });
    out = out.filter((item) => item.image && item.title && item.price);
    let results = {
      filters: {
        brands,
        price: priceFilter,
        reviews,
        departments,
      },
      results: out,
    };
    return results;
  },

  // let allBrands = Array.from(
  //   document.querySelectorAll("[aria-labelledby=p_89-title] > li")
  // ).forEach((item) => {brands.getAttribute("aria-label")});
};
module.exports = AMAZON;

// AMAZON.search('shoe nike new', 'price-asc-rank', '25');
