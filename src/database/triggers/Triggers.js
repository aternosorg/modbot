import IncludeTrigger from './IncludeTrigger.js';
import MatchTrigger from './MatchTrigger.js';
import RegexTrigger from './RegexTrigger.js';
import PhishingTrigger from './PhishingTrigger.js';

export default class Triggers {
    static of(data) {
        switch (data.type) {
            case 'include':
                return new IncludeTrigger(data);
            case 'match':
                return new MatchTrigger(data);
            case 'regex':
                return new RegexTrigger(data);
            case 'phishing':
                return new PhishingTrigger(data);
            default:
                throw new Error(`Invalid trigger type: ${data.type}`);
        }
    }
}