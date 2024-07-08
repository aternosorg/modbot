import Trigger from './Trigger.js';
import stringSimilarity from 'string-similarity';

export default class PhishingTrigger extends Trigger {
    constructor(data) {
        super({
            type: 'phishing',
            ...data
        });
    }

    toRegex() {
        return this;
    }

    test(content) {
        // Split domain and min similarity (e.g. discord.com(gg):0.5)
        let [domain, similarity] = String(this.content).split(':');
        similarity = parseFloat(similarity) || 0.5;
        domain = domain.toLowerCase();
        // Split domain into "main part", extension and alternative extensions
        const parts = domain.match(/^([^/]+)\.([^./(]+)(?:\(([^)]+)\))?$/);
        if (!parts || !parts[1] || !parts[2]) {
            return false;
        }

        const expectedDomain = parts[1];
        const expectedExtensions = parts[3] ? [parts[2], ...parts[3].toLowerCase().split(/,\s?/g)] : [parts[2]];
        // Check all domains contained in the content (and split them into "main part" and extension)
        const regex = /https?:\/\/([^/]+)\.([^./]+)\b/ig;


        let matches;
        while ((matches = regex.exec(content)) !== null) {
            if (!matches[1] || !matches[2]) {
                continue;
            }
            const foundDomain = matches[1].toLowerCase(),
                foundExtension = matches[2].toLowerCase();
            const mainPartMatches = foundDomain === expectedDomain || foundDomain.endsWith(`.${expectedDomain}`);

            // Domain is the actual domain or a subdomain of the actual domain -> no phishing
            if (mainPartMatches && expectedExtensions.includes(foundExtension)) {
                continue;
            }

            // "main part" matches, but extension doesn't -> probably phishing
            if (mainPartMatches && !expectedExtensions.includes(foundExtension)) {
                return true;
            }

            // "main part" is very similar to main part of the actual domain -> probably phishing
            if (stringSimilarity.compareTwoStrings(expectedDomain, foundDomain) >= similarity) {
                return true;
            }
        }
    }
}