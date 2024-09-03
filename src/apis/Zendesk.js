import got from 'got';

/**
 * @typedef {object} ZendeskArticle
 * @property {number} id article id
 * @property {string} url api url
 * @property {string} html_url url to public article page
 * @property {boolean} promoted
 * @property {string} title
 * @property {string} body raw html
 */

/**
 * @typedef {object} ZendeskArticleSuggestion
 * @property {string} title
 * @property {string} category_title
 * @property {string} url
 */

export default class Zendesk {
    constructor(identifier) {
        this.identifier = identifier;
    }

    async #request(endpoint) {
        return got.get(`https://${this.identifier}.zendesk.com/${endpoint}`).json();
    }

    /**
     * search articles
     * @param {string} query
     * @returns {Promise<{count: number, results: ZendeskArticle[]}>}
     */
    async searchArticles(query) {
        return this.#request(`api/v2/help_center/articles/search.json?query=${encodeURIComponent(query)}`);
    }

    /**
     * get article suggestions
     * @param {string} query
     * @returns {Promise<ZendeskArticleSuggestion[]>}
     */
    async getArticleSuggestions(query) {
        const data = await this.#request(`hc/api/internal/instant_search.json?query=${encodeURIComponent(query)}`);
        return data.results;
    }

    /**
     * get a single article
     * @param {string|number} id
     * @returns {Promise<?ZendeskArticle>}
     */
    async getArticle(id) {
        /** @type {{article: ZendeskArticle}} */
        const article = await this.#request(`/api/v2/help_center/articles/${id}`);
        return article?.article;
    }

    /**
     * @param {number} [results] maximum number of articles that will be returned
     * @returns {Promise<ZendeskArticle[]>}
     */
    async getArticles(results = 100) {
        /** @type {{articles: ZendeskArticle[]}} */
        const articles = await this.#request(`api/v2/help_center/articles?per_page=${results}`);
        return articles.articles;
    }

    /**
     * get promoted articles
     * @returns {Promise<ZendeskArticle[]>}
     */
    async getPromotedArticles() {
        const articles = await this.getArticles();
        return articles.filter(article => article.promoted);
    }
}