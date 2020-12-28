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
- Bad word filters

### Invite The Bot
Click [this link](https://discordapp.com/oauth2/authorize?client_id=790967448111153153&scope=bot&permissions=268446806) to invite the bot to your own server

If you need help with the commands use `!help` to list them and `!help <command>` to get more info.

### Getting Started
- You can view the settings with `!settings`
- If you have a Zendesk help center, use `!helpcenter <url>` to enable the `!article` command
- To set up a log channel use `!logchannel <#channel>`
- If you want to configure a Youtube playlist, you can use `!playlist <url>`
- To add moderator roles use `!modrole add <@role>`
- If you used Vortex before you can import strikes, mutes and bans using `!import`

### Self Hosting
Requirements: [Node.js](https://nodejs.org/en/download/), a [MySQL](https://dev.mysql.com/downloads/mysql/) database
1. Download the code and run `npm install`
2. Create a [Discord application](https://discordapp.com/developers/applications/)
3. Add a bot to the application and copy the auth token
4. Create an API key in the [Google Cloud Console](https://console.cloud.google.com/) for the Youtube Data API v3
5. Copy the example.config.json to config.json, and configure it
6. Start the index.js file
7. To invite the bot to your server replace `ID` with the client ID of your application https://discordapp.com/oauth2/authorize?client_id=ID&scope=bot&permissions=268446806 and open the link

### Contributing
If you want to contribute you need to [fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the repository, then add your changes to your fork and then create a [pull request](https://github.com/aternosorg/modbot/compare). We recommend looking at the [Documentation](https://discord.js.org/#/docs/) of discord.js.

If you need help with the Bot create an [Issue](https://github.com/aternosorg/modbot/issues).
