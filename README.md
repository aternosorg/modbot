# Aternos/modbot

Modbot is a Moderation Bot specifically for the [Aternos Discord](https://chat.aternos.org), made using the [discord.js](https://discord.js.org/) Library and [node.js](https://nodejs.org/).

### Features
- delete messages with .aternos.me IPs in specified channels
- delete messages without .aternos.me IPs in specified channels
- set a cooldown on .aternos.me IPs in specified channels
- find articles from the [Aternos Help Center](https://support.aternos.org/hc/en-us)
- find our [tutorials](https://www.youtube.com/playlist?list=PLHn1eAE9tVwzD2pnhzfvCj9h-e06MfH2N)
- log it's actions (message deletions etc.) in a configurable channel.

### Setup

1. Install [Node.js](https://nodejs.org/en/) and [Mysql](https://www.mysql.com/)
2. create a user and databse for the bot
3. Clone or download the repository
4. create a discord Application [here](https://discordapp.com/developers/applications/)
5. add a Bot to it and copy the auth token
6. copy the example.config.json to config.json and enter the auth token and mysql login
7. run this command in the directory

   ```bash
   node bot.js
   ```
8. to invite the bot to your server replace ID with your applications Client ID https://discordapp.com/oauth2/authorize?client_id=ID&scope=bot&permissions=11264 and open the link

9. (optional) Set up a logchannel by using ,logchannel #channel

Now you can use our bot!
If you need help with the commands use !help to list them and !help <command> to get more info

### Contributing

If you want to contribute you need to [fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo) the repository, then add your changes to your fork and then create a [pull request](https://github.com/aternosorg/modbot/compare). We recommend looking at the [Documentation](https://discord.js.org/#/docs/) of discord.js.

If you need help with the Bot create an [Issue](https://github.com/aternosorg/modbot/issues).
