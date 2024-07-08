import KeyValueEmbed from './KeyValueEmbed.js';
import {yesNo} from '../util/format.js';
import {channelMention} from 'discord.js';
import cloudVision from '../apis/CloudVision.js';
import {EMBED_FIELD_LIMIT} from '../util/apiLimits.js';

export default class ChatFeatureEmbed extends KeyValueEmbed {
    /**
     * @param {import('../database/ChatTriggeredFeature.js')} feature
     * @param {string} title
     * @param {import('discord.js').ColorResolvable} color
     */
    constructor(feature, title, color) {
        super();
        this.setTitle(title + ` [${feature.id}]`)
            .setColor(color)
            .addPair('Trigger', feature.trigger.asString())
            .addPair('Global', yesNo(feature.global))
            .addPairIf(!feature.global, 'Channels', feature.channels.map(channelMention).join(', '))
            .addPairIf(cloudVision.isEnabled, 'Detect images', yesNo(feature.enableVision))
            .addFields(
                /** @type {any} */
                {
                    name: 'Response',
                    value: feature.response.substring(0, EMBED_FIELD_LIMIT)
                },
            );
    }

}