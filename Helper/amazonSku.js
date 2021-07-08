"use strict";
const puppeteer = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
puppeteer.use(pluginStealth());
const sleep = (duration) =>
    new Promise((resolve) => setTimeout(resolve, duration));
const msleep = 2000; // sleeping time

const AMAZON = {
    async firstOne(id, sku, brand) {
        sku = sku.trim();
        let browser = "";
        try {
            browser = await puppeteer.launch({
                headless: false,
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

                    await page.waitForSelector(".a-button-text.a-declarative", { timeout: 5000 });
                    let btnClick2 = await page.$(".a-button-text.a-declarative");
                    await btnClick2.click();
                    await sleep(500);
                    let product = await page.evaluate(this.extractData);
                    console.log("extracted data=== ", product);
                    if (product) {

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
            await browser.close()
        }
        return "done";
    },
    findItemBySku() {

        let firstItem = document.querySelector(".a-link-normal.a-text-normal")
        if (firstItem) {
            return firstItem.href;
        }
        return false;
    },
    extractData() {

        var data = {};
        debugger;

        // Extract Brand
        let productBrand = document.querySelector("#detailBullets_feature_div")
        if (productBrand) {
            data["brand"] = productBrand
                .innerText
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

        // Extract description
        data["description"]
        let productDescription = document.querySelector("#productDescription >p")
        if (productDescription) {
            try {
                data["description"] = productDescription.innerText.trim();
            } catch {
                data["description"] = ""
            }
        }

        // Extract Product images
        data["images"] = [];
        let productImg = document.querySelectorAll(".image.item.maintain-height img")
        if (productImg) {
            let extractedImg = Array.from(productImg).map((item) => item.src)
            data["images"].push(extractedImg)
        }
        // Extract Product Sizes Available
        data["availSizes"] = [];
        let productSize = document.querySelectorAll(".a-dropdown-item.dropdownAvailable")
        if (productSize) {
            let extractedSize = Array.from(productSize).map((item) => item.innerText)
            data["availSizes"].push(extractedSize)
        }

        // Extract rating
        data["rating"] = []
        let prodRating = document.querySelector(".a-icon-alt")
        if (prodRating) {
            let rating = prodRating.innerText.replace(' out of 5 stars', '')
            data["rating"] = rating
        }
        // Extract price
        data["offerPrice"] = []
        let prodPrice = document.querySelector("#priceblock_ourprice")
        if (prodPrice) {
            let extractedPrice = prodPrice.innerText
            data["offerPrice"] = extractedPrice
        }
        data["mainPrice"] = []
        let prodmPrice = document.querySelector(".priceBlockStrikePriceString.a-text-strike")
        if (prodmPrice) {
            try {
                let extractedPrice = prodmPrice.innerText
                data["mainPrice"] = extractedPrice
            } catch {
                data["mainPrice"] = ""
            }
        }
        // Extract color
        data["color"] = []
        let prodColor = document.querySelector("#variation_color_name >.a-row> .selection")
        if (prodColor) {
            try {
                let extractedColor = prodColor.innerText
                data["color"] = extractedColor
            } catch {
                data["color"] = ""
            }
        }

        // Supplier
        data["suplier"] = "Amazon"


        return data;
    },
};
module.exports = AMAZON;

// AMAZON.firstOne('', 'B07H85QQ32', 'test');
// AMAZON.firstOne('', 'B07H2V5YLH', 'test');
AMAZON.firstOne('', 'B07HRC68QF', 'test');
