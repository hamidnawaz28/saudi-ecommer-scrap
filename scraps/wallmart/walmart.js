const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

const WALMART = {
  async firstOne(query) {
    let queries = Object.keys(query)
      .map((item) => `&${item}=${query[item]}`.split(" ").join("%20"))
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
      await page.goto("https://www.walmart.com/ ", {
        waitUntil: "load",
        timeout: 0,
      });
      let url = `https://www.walmart.com/search/?${queries}  `;
      console.log("Url--------", url);

      await page.goto(url, {
        waitUntil: "load",
        timeout: 0,
      });
      try {
        
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
    let out = [];

    let allProducts = document.querySelectorAll("[data-tl-id*=ProductTileListView]")
    Array.from(allProducts).forEach((item) => {
      var imag = item.querySelector('img').getAttribute('src');
      let title = item
        .querySelector('.search-result-product-title')?.innerText
      let rating = item.querySelector(
        ".visuallyhidden.seo-avg-rating"
      )?.innerText;
      let totalRating = item
        .querySelector(".stars-reviews-count")
        ?.innerText.replace("\nratings", "");
      let price = item.querySelector(
        ".price.display-inline-block.arrange-fit.price.price-main > .visuallyhidden"
      )?.innerText;
      let link = item.querySelector(
        ".product-title-link"
      )?.href;
      let ob = {
        image: imag,
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
    let brands = Array.from(document.querySelectorAll('#facet-brand-search-results label')).map(item=>item.innerText)
    let output = { 
      brands,
      results : out
    }
    // Return scraped data
    return output;
  },
};
module.exports = WALMART;

// WALMART.firstOne('men boots', '', '');
