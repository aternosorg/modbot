# ModBot
[![Discord](https://img.shields.io/discord/826482655893127248?style=plastic)](https://discord.gg/zYYhgPtmxw)
[![GitHub](https://img.shields.io/github/license/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/blob/master/LICENSE)
[![GitHub contributors](https://img.shields.io/github/contributors/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/graphs/contributors)
[![GitHub last commit](https://img.shields.io/github/last-commit/aternosorg/modbot?style=plastic)](https://github.com/aternosorg/modbot/commits/)

---
ModBot is an open source moderation bot with advanced features developed by [Aternos](https://aternos.org/).

It uses **modern Discord features** like slash-commands, context-menus, timeouts, buttons, select-menus
and modals and offers everything you need for moderation. Including bad-words and auto-responses
with support for regex, detecting phishing urls, temporary bans, a strike system, message logging
and various other forms of automatic moderation filters.


### Screenshots
Moderating users or viewing information is faster than ever thanks to buttons, modals and context menus:

![User Embed](https://user-images.githubusercontent.com/45244473/196917527-cff86e16-f074-493d-8067-a85c0599c102.png)

ModBot will prevent accidentally punishing a user twice by warning the moderator if another moderator
has punished this user in the last 5 minutes.

![Strike Confirmation](https://user-images.githubusercontent.com/45244473/196927951-5a3f8cda-8cda-4824-a094-ee868a335709.png)

### Add ModBot to your server
By adding the bot to your server you agree to our [privacy policy](https://aternos.gmbh/en/modbot/privacy). <br>
Invite: [Click me](https://discord.com/oauth2/authorize?client_id=790967448111153153&scope=bot%20applications.commands&permissions=1099780074646)

You can view all commands by typing a slash `/` in the text input field. 
All commands and options have clear descriptions.

We also have a [Discord server](https://discord.gg/zYYhgPtmxw). <br>
**Please note: ModBot is a side project for us. 
We don't earn any money with it and primarily develop it for use on our own servers. 
We can't help with every problem and won't add features that we don't need.**

### Getting Started
- You can view the settings with `/settings overview`
- To set up a log channel use `/settings log-channel <#channel>`
- You can import strikes, mutes and bans from Vortex using `/import`
- If you want to configure a YouTube playlist, you can use `/settings playlist <url>`
- You can also add a Zendesk help center, using `/settings helpcenter <url>` to enable the `/article` command.

### Support
You can view the usage of commands with the help command.<br>
If you think you found a bug in ModBot then please create an [issue](https://github.com/aternosorg/modbot/issues). <br>
For security issues please refer to the [SECURITY.md](./SECURITY.md).

### Self Hosting
If you want to host the bot yourself you can use our pre-built docker image or install it directly.
In both cases you will need a [MySQL](https://dev.mysql.com/downloads/mysql/) database and a 
[Discord application](https://discord.com/developers/applications/):

1. Create a [Discord application](https://discord.com/developers/applications/) and enable the SERVER MEMBERS and 
MESSAGE CONTENT intents.
2. Add a bot to the application and copy the auth token
3. Configure the bot (see [CONFIGURATION.md](./CONFIGURATION.md))
4. To invite the bot to your server replace `ID` with the client ID of your application
   https://discord.com/oauth2/authorize?client_id=ID&scope=bot%20applications.commands&permissions=1099780074646 and open the link
5. Follow the instructions for the installation method you want to use

#### Docker
Requirements: [Docker](https://docs.docker.com/get-docker/)
```bash 
docker run -e MODBOT_AUTH_TOKEN="<discord-auth-token>" -e MODBOT_DATABASE_HOST="<database-host>" -e MODBOT_DATABASE_PASSWORD="<database-password>" ghcr.io/aternosorg/modbot
```

#### Direct Installation
Requirements: [Node.js](https://nodejs.org/en/download/) (v22+), a [MySQL](https://dev.mysql.com/downloads/mysql/) database
1. Download the code and run `npm ci`
2. Run `npm start` to start the bot

### Contributing
If you want to contribute you need to [fork](https://docs.github.com/en/github/getting-started-with-github/fork-a-repo)
the repository, then add your changes to your fork and then create a [pull request](https://github.com/aternosorg/modbot/compare).
We also recommend looking at the [Documentation](https://discord.js.org/#/docs/) of discord.js. If you have any questions
create an issue or join our [discord](#add-modbot-to-your-server)
