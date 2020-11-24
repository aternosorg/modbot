const ChatTriggeredFeature = require('./ChatTriggeredFeature');
const Discord = require('discord.js');

/**
 * Class representing a bad word
 */
class BadWord extends ChatTriggeredFeature {

  static punishmentTypes = ['none','ban','kick','mute','softban','strike'];

  static defaultResponse = 'Your message includes words/phrases that are not allowed here!';

  static tableName = 'badWords';

  static columns = ['guildid', 'trigger', 'punishment', 'response', 'global', 'channels'];

  /**
   * constructor - create a bad word
   * @param {module:"discord.js".Snowflake}     gid               guild ID
   * @param {Object}                            json              options
   * @param {Trigger}                           json.trigger      filter that triggers the bad word
   * @param {String|Punishment}                 json.punishment   punishment for the members which trigger this
   * @param {String}                            [json.response]   a message that is send by this filter. It's automatically deleted after 5 seconds
   * @param {Boolean}                           json.global       does this apply to all channels in this guild
   * @param {module:"discord.js".Snowflake[]}   [json.channels]   channels that this applies to
   * @param {Number}                            [id]              id in DB
   * @return {BadWord}
   */
  constructor(gid, json, id) {
    super(id);
    this.gid = gid;

    if (json) {
      this.trigger = json.trigger;
      this.punishment = typeof(json.punishment) === 'string' ? JSON.parse(json.punishment) : json.punishment;
      this.response = json.response;
      this.global = json.global;
      this.channels = json.channels;
    }

    if (!this.channels) {
      this.channels = [];
    }
  }

  /**
   * serialize the bad word
   * @returns {(*|string)[]}
   */
  serialize() {
    return [this.gid, JSON.stringify(this.trigger), JSON.stringify(this.punishment), this.response, this.global, this.channels.join(',')];
  }

  /**
   * generate an Embed displaying the info of this bad word
   * @param {String}        title
   * @param {Number}        color
   * @returns {module:"discord.js".MessageEmbed}
   */
  embed(title, color) {
    const embed = new Discord.MessageEmbed()
        .setTitle(title + ` [${this.id}]`)
        .setColor(color)
        .addFields(
            /** @type {any} */[
          {name: "Trigger", value: `${this.trigger.type}: \`${this.trigger.type === 'regex' ? '/' + this.trigger.content + '/' + this.trigger.flags : this.trigger.content}\``},
          {name: "Response", value: this.response === 'default' ? BadWord.defaultResponse :this.response.substring(0,1000)},
          {name: "Channels", value: this.global ? "global" : this.channels.map(c => `<#${c}>`).join(', ')}
        ]);
    console.log(this.punishment)
    if (this.punishment.action) {
      embed.addField("Punishment", `${this.punishment.action} ${this.punishment.duration ? `for ${this.punishment.duration}` : ''}`)
    }
    return embed;
  }
}

module.exports = BadWord;
