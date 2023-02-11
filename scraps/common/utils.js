var htmlparser = require("htmlparser2");

const dJSON = require("dirty-json");
const getJson = (data) => JSON.parse(dJSON.parse(data));

const sleep = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration * 1000));

module.exports = {
  htmlparser,
  getJson,
  sleep,
};
