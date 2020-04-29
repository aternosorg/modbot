# Aternos/modbot

Modbot is a Moderation Bot specifically for the [Aternos Discord](https://chat.aternos.org), made using the [discord.js](https://discord.js.org/) Library and [node.js](https://nodejs.org/).

### Features

You can...

- specify channels in which messages with Aternos IPs / Hostnames should be deleted
- specify channels in which messages without Aternos IPs / Hostnames should be deleted
- specify channels where each Aternos IP / Hostname has a cooldown

### Setup

1. Install [Node.js](https://nodejs.org/en/)

2. Clone or download the repository

3. create a discord Application [here](https://discordapp.com/developers/applications/)

4. add a Bot to it and copy the auth token

5. rename the example.config.json to config.json and enter the auth token

6. run this command in the directory

   ```bash
   node bot.js
   ```

7. to invite the bot to your server replace ID with your applications Client ID https://discordapp.com/oauth2/authorize?client_id=ID&scope=bot&permissions=11264 and open the link

### Commands

- ip:

  Usage: 

  ```
  ,ip subcommand channel
  ```

  sub commands:

  -  require:

    Messages without an .aternos.me IP in this channel will be deleted

  - forbid

    Messages with an .aternos.me IP in this channel will be deleted

  - off

    No Messages will be deleted

  channel: a #channel mention or channel ID

- ipcooldown:

  Usage:

  ```
  ,ipcooldown channel time
  ```

  channel: a #channel mention or channel ID

  time: the cooldown you want. 

  Supported units are d(days) h(hours) m(minutes) and s(seconds).

  Example:

  ```
  ,ipcooldown #cooldown 1h 30m
  ```

  Note: Messages that are less then a minute earlier then the cooldown can still be sent. Cooldowns below 60s are not possible.

### Contributing

Most commits are by Julian and the Bot is maintained by Matthias.

If you want to contribute you need to fork the repository, apply your changes to it and then create a [pull request](https://github.com/aternosorg/modbot/compare). We recommend looking at the [Documentation](https://discord.js.org/#/docs/) of discord.js. 

If you need help join the [Aternos Discord](https://chat.aternos.org/) and send Julian#0332 a direct message. Make sure to clarify that you are talking about this repository in the first message. 