const util = require('../lib/util');

//removes messages with(out) IPs in specific channels
exports.message = async (message, database) => {
    if (!message.guild || message.author.bot || message.member.hasPermission('MANAGE_MESSAGES'))
        return;

    let channel = await util.getChannelConfig(message.channel.id)

    if (channel && channel.mode) {

        let mode = channel.mode;
        if (mode === 1 && !message.content.toLowerCase().includes('.aternos.me')) {
            //delete non IP messages in IP only channels
            let response = await message.channel.send(`**${util.icons.forbidden} <@${message.author.id}> your message to this channel must include a valid Aternos IP! ${util.icons.forbidden}**`);
            try {
                await util.retry(message.delete, message);
                await util.log(message, `Message in <#${message.channel.id}> deleted`, {
                  footer: {
                    text: `${message.author.username}#${message.author.discriminator}`,
                    iconURL: message.author.avatarURL()
                  },
                  color: 'ORANGE',
                  fields: [{
                    name: 'Message',
                    value: message.content
                  },
                  {
                    name:'Reason',
                    value: `IPs are required here`
                  }]
                });
            } catch (e) {
                console.error('Failed to delete message', e);
            }
            try {
                await util.retry(response.delete, response, [{timeout: 5000}]);
            } catch (e) {
                console.error('Failed to delete response', e);
            }
            return;
        }
        if (mode === 2 && (message.content.toLowerCase().includes('.aternos.me') || message.content.toLowerCase().includes('add.aternos.org'))) {
            //Delete IPs in no IP channels
            let response = await message.channel.send(`**${util.icons.forbidden} <@${message.author.id}> don't advertise your server here! ${util.icons.forbidden}**`);
            try {
                await util.retry(message.delete, message);
                await util.log(message, `Message in <#${message.channel.id}> deleted`, {
                    footer: {
                      text: `${message.author.username}#${message.author.discriminator}`,
                      iconURL: message.author.avatarURL()
                    },
                    color: 'ORANGE',
                    fields: [{
                      name: 'Message',
                      value: message.content
                    },
                    {
                      name:'Reason',
                      value: `IPs are not allowed here`
                    }]
                  });
            } catch (e) {
                console.error('Failed to delete message', e);
            }
            try {
                await util.retry(response.delete, response, [{timeout: 5000}]);
            } catch (e) {
                console.error('Failed to delete response', e);
            }
        }
    }
}
