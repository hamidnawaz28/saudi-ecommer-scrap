const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());

const WALMART = {
    async firstOne(query) {
        let q = Object.keys(query)
        .map((item) => `&${item}=${query[item]}`.split(" ").join("%20"))
        .join("");
        let browser = ''
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
            await page.goto("https://www.walmart.com/ ",
            {
                waitUntil: "load",
                timeout: 0,
            }
         );
            let url = `https://www.walmart.com/search/?query=${q}  `
            console.log('Url--------', url);
            await page.goto(
                url,
                {
                    waitUntil: "load",
                    timeout: 0,
                }
            );
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
            await browser.close()
        }
        return "done";
    },
    extractData() {
        let out = []
        let allProducts= document.querySelectorAll('li.Grid-col')
        Array.from(allProducts).forEach((item) => {
            var imag = item.querySelector('.orientation-portrait img')?.src
            let title = item.querySelector(".orientation-portrait img")?.getAttribute("alt");
            let rating = item.querySelector(".visuallyhidden.seo-avg-rating")?.innerText;
            let totalRating = item.querySelector(".stars-reviews-count")?.innerText.replace("\nratings","");
            let price = item.querySelector(".price.display-inline-block.arrange-fit.price.price-main > .visuallyhidden")?.innerText;
            let link = item.querySelector("a-size-base.a-link-normal.a-text-normal")?.innerText;
            let ob = {
                imageUrl: imag,
                title,
                price,
                rating: rating?.replace(' out of 5 stars',''),
                ratings: totalRating,
                link
            }
            out.push(ob)
            ob = {}
        })
        out = out.filter(item=>item.imageUrl && item.title)
        // Return scraped data
        return out;
    },
};
module.exports = WALMART;

// WALMART.firstOne('men boots');