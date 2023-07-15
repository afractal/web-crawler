#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');
const axios = require('axios');
const yargs = require('yargs');
const cheerio = require('cheerio');
const uuid = require('uuid');

const urlRegex = /(https?:\/\/[^\s]+)/g;

// example:  node . --s="https://icanhazdadjoke.com" 
const options = yargs
    .usage("Usage: --s <site>")
    .option("s", { demandOption: true, alias: "site", describe: "Enter the site to crawl", type: "string" })
    .argv;

const storeFile = async (fileName, content) => {
    const location = path.join('./', fileName);
    await fs.writeFile(location, content, { flag: 'w+' });
};

const crawl = async (mainSiteUrl) => {
    const mainSite = await axios.get(mainSiteUrl, { headers: { Accept: "text/html" } });

    const $ = cheerio.load(mainSite.data);
    const links = $("body a");

    const hrefs = links
        .map((i, value) => $(value).attr("href"))
        .toArray();

    hrefs
        .filter(h => h.match(urlRegex))
        .forEach(async href => {
            try {
                const response = await axios.get(href, {
                    headers: { Accept: "text/html" },
                    maxRedirects: 0
                });
                await storeFile(`${uuid.v4()}.html`, response.data);
            } catch {
                // if link has redirection we dont do anything
            }
        });
};

const main = async () => {
    try {
        if (options.s) {
            console.log(`Crawling site: ${options.s}...`)
            await crawl(options.s);
        } else {
            console.log("ERRRROR");
        }
    } catch (err) {
        console.log(err);
    }
};

main();
