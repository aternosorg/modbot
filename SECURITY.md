# Security Policy

## Supported Versions
Only the most recent version of ModBot is supported.

We don't offer bug fixes or security updates for old versions. 

## Valid Vulnerabilities
Vulnerabilities in this project mostly fall into one of the following categories:
- Being able to view or modify settings in another guild
- Being able to view or modify moderations for another guild
- Being able to modify moderations or settings without having access in a guild
- Default Permissions that give users access to something that should probably be private
- Injecting custom code into the bot
- Crashing the entire ModBot instance
- Overloading the instance and therefore making the bot unusable on other servers

The following are explicitly not vulnerabilities inside ModBot:
- Poorly configured slash command permissions which allow users to execute privileged commands
- Issues otherwise specific to a server for example having a public log of deleted messages, moderations etc.

## Reporting a Vulnerability
Please do not create a public issue about security vulnerabilities. To prevent abuse of the vulnerability
before a fix is available please create a private report here: https://github.com/aternosorg/modbot/security/advisories