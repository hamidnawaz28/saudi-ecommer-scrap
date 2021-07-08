const cheerio = require('cheerio');
const request = require('request');
const htmlparser2 = require('htmlparser2');

request({
    method: 'GET',
    url: 'https://www.amazon.com/s?k=pakistan&s=price-asc-rank&page=2'
}, (err, res, body) => {
    if (err) return console.error(err);
       // const dom = htmlparser2.parseDocument($);
    let $ = cheerio.load(body);
    let results = $('[data-component-type="s-search-result"]')
    let data = {}
    results.each((index, item)=>{
        let title = $(item).find('.a-link-normal.a-text-normal').text()
        let ratingLabel = $(item).find('.a-icon-alt').text()
        let totalRatings = $(item).find('.a-size-base').text()
        let image = $(item).find('img')[0].attribs.src
        let price = $(item).find('.a-price span.a-offscreen').text()
        let link = $('a-size-base.a-link-normal.a-text-normal').text()
        data = {
            title, rating: ratingLabels, ratings: totalRatings, image, price, link
        }
    })
});