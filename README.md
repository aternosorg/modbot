# Aternos/modbot
[![Discord](https://img.shields.io/discord/107936397578489856?style=plastic)](https://chat.aternos.org/)
[![GitHub](https://img.shields.io/github/license/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/blob/master/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/commits/)

---
Modbot is a moderation bot that is mainly used in the [Aternos Discord](https://chat.aternos.org).

It was made using the [discord.js](https://discord.js.org/) Library and [node.js](https://nodejs.org/).

### Features
- Moderation commands (ban, kick, mute, softban, strike)
- Import strikes, tempmutes and tempbans from Vortex 
- Auto moderation (Discord invites, linkcooldown)
- Find articles from your Zendesk helpcenter and videos from a Youtube playlist
- Lock (all or specific) channels
- Log message edits and deletions
- Autoresponses

### Setup
1. Install [Node.js](https://nodejs.org/en/download/) and [MySQL](https://dev.mysql.com/downloads/mysql/)
2. Create a MySQL user and database for the bot
3. Clone or download the repository
4. Run `npm install`
5. Create a [Discord application](https://discordapp.com/developers/applications/)
6. Add a bot to it and copy the auth token
7. Copy the example.config.json to config.json, add the auth token and configure mysql
8. Run the following command in the directory

   ```bash
   node bot.js
   ```
9. To invite the bot to your server replace `ID` with the client ID of your application https://discordapp.com/oauth2/authorize?client_id=ID&scope=bot&permissions=11264 and open the link

10. (optional) Set up a log channel by using `!logchannel <#channel>`

Now you can use our bot!
If you need help with the commands use `!help` to list them and `!help <command>` to get more info.

### Contributing
If you want to contribute you need to [fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the repository, then add your changes to your fork and then create a [pull request](https://github.com/aternosorg/modbot/compare). We recommend looking at the [Documentation](https://discord.js.org/#/docs/) of discord.js.

If you need help with the Bot create an [Issue](https://github.com/aternosorg/modbot/issues).
