const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

async function scrapeAmazon(query) {
    try {
        const url = `https://www.amazon.sg/s?k=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const $ = cheerio.load(response.data);
        const results = [];
        $('div[data-component-type="s-search-result"]').slice(0, 10).each((i, el) => {
            const title = $(el).find('h2 span').text() || 'Unknown Product';
            const price = $(el).find('.a-price > .a-offscreen').first().text() || 'Check Site';
            const image = $(el).find('img.s-image').attr('src') || 'https://via.placeholder.com/150';
            const link = $(el).find('h2 a').attr('href') || '#';
            results.push({
                title, price, image, link: link.startsWith('http') ? link : `https://www.amazon.sg${link}`, store: 'Amazon SG'
            });
        });
        return results;
    } catch (e) {
        console.error("Amazon scrape failed:", e.message);
        return [];
    }
}

async function scrapeShopee(query) {
    // Shopee is heavily client-side rendered and blocks basic axios usually. 
    // We will attempt their public search API if we can guess the endpoint, otherwise fallback.
    try {
        const url = `https://shopee.sg/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=10&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;
        const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT, 'Referer': 'https://shopee.sg/' } });
        if (response.data && response.data.items) {
            return response.data.items.slice(0, 10).map(item => ({
                title: item.item_basic.name,
                price: `$${(item.item_basic.price / 100000).toFixed(2)}`,
                image: `https://cf.shopee.sg/file/${item.item_basic.image}`,
                link: `https://shopee.sg/product/${item.item_basic.shopid}/${item.item_basic.itemid}`,
                store: 'Shopee SG'
            }));
        }
        return [];
    } catch (e) {
        console.error("Shopee scrape failed:", e.message);
        return [];
    }
}

async function scrapeLazada(query) {
    try {
        // Lazada is also heavily protected, let's just attempt a basic GET.
        const url = `https://www.lazada.sg/catalog/?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const $ = cheerio.load(response.data);
        const results = [];
        // Extract from window.pageData if it exists
        const scripts = $('script').toArray();
        let pageDataStr = null;
        for (const script of scripts) {
            const content = $(script).html();
            if (content && content.includes('window.pageData=')) {
                pageDataStr = content;
                break;
            }
        }
        
        if (pageDataStr) {
            const match = pageDataStr.match(/window\.pageData=(\{.*?\});/);
            if (match && match[1]) {
                const data = JSON.parse(match[1]);
                if (data.mods && data.mods.listItems) {
                    const items = data.mods.listItems.slice(0, 10);
                    return items.map(item => ({
                        title: item.name,
                        price: item.priceShow,
                        image: item.image,
                        link: item.itemUrl.startsWith('http') ? item.itemUrl : `https:${item.itemUrl}`,
                        store: 'Lazada SG'
                    }));
                }
            }
        }
        return [];
    } catch (e) {
        console.error("Lazada scrape failed:", e.message);
        return [];
    }
}

async function scrapeGoogle(query) {
    try {
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        const response = await axios.get(url, { headers: { 'User-Agent': USER_AGENT } });
        const $ = cheerio.load(response.data);
        const results = [];
        $('.tF2Cxc').slice(0, 5).each((i, el) => {
            const title = $(el).find('h3').text() || 'Unknown Result';
            const link = $(el).find('a').attr('href') || '#';
            results.push({
                title,
                price: 'Search Result',
                image: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
                link,
                store: 'Google'
            });
        });
        
        if (results.length === 0) {
            $('div.g').slice(0, 5).each((i, el) => {
                const title = $(el).find('h3').text();
                const link = $(el).find('a').attr('href');
                if (title && link) {
                    results.push({
                        title,
                        price: 'Search Result',
                        image: 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
                        link,
                        store: 'Google'
                    });
                }
            });
        }
        return results;
    } catch (e) {
        console.error("Google scrape failed:", e.message);
        return [];
    }
}

app.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const [amazonResults, shopeeResults, lazadaResults, googleResults] = await Promise.all([
            scrapeAmazon(query),
            scrapeShopee(query),
            scrapeLazada(query),
            scrapeGoogle(query)
        ]);

        const makeMocks = (store, count) => Array.from({length: count}).map((_, i) => ({
            title: `${store} Mock Result ${i+1} for ${query} (Live Fetch Failed)`,
            price: store === 'Google' ? 'Search Result' : `$${(Math.random() * 100 + 10).toFixed(2)}`,
            image: store === 'Google' ? 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg' : 'https://via.placeholder.com/150',
            link: '#',
            store: store
        }));

        res.json({
            amazon: amazonResults.length > 0 ? amazonResults : makeMocks('Amazon SG', 10),
            shopee: shopeeResults.length > 0 ? shopeeResults : makeMocks('Shopee SG', 10),
            lazada: lazadaResults.length > 0 ? lazadaResults : makeMocks('Lazada SG', 10),
            google: googleResults.length > 0 ? googleResults.slice(0, 5) : makeMocks('Google', 5)
        });
        
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to scrape data' });
    }
});

app.listen(port, () => {
    console.log(`Scraper backend listening on port ${port}`);
});