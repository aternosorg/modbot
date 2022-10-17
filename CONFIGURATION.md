# Configuration
ModBot offers two different ways to configure it, a config file or environment variables. To use the config file
just copy the example.config.json to a new file called config.json and modify the options in it.
If you chose to use environment variables then you first need to set the environment variable `MODBOT_USE_ENV`.

Environment variables use `SCREAMING_SNAKE_CASE`, the configuration file uses `camelCase`.

If both a config file exists and the `MODBOT_USE_ENV` variable is set ModBot will ignore the config.json file.

## Auth Token (required)
Discord bot authentication token, can be generated in the [Developer Portal](https://discordapp.com/developers/applications/)
type: string
config file: `authToken`
environment: `MODBOT_AUTH_TOKEN`

## Database (required)
MySQL/MariaDB access credentials. Other SQL dialects or Databases are not supported. If you're using a config file,
you can easily add any additional options accepted by [mysql2](https://www.npmjs.com/package/mysql2). This is not
possible using environment variables. If you're missing an option just let us know ;)

### Host
Database hostname or IP
type: string
config file: `database.host`
environment: `MODBOT_DATABASE_HOST`

### User
Database username
type: string
config file: `database.user`
environment: `MODBOT_DATABASE_USER`

### Password
Database password
type: string
config file: `database.password`
environment: `MODBOT_DATABASE_PASSWORD`

### Database
Database name
type: string
config file: `database.database`
environment: `MODBOT_DATABASE_DATABASE`

### Port
Database port
type: number
config file: `database.port`
environment: `MODBOT_DATABASE_PORT`

## Google API Key (optional)
Google cloud API Key. Currently used for the YouTube v3 API (`/video` and `/playlist`).
type: string
config file: `googleApiKey`
environment: `MODBOT_GOOGLE_API_KEY`

## Google Cloud (optional)
Configuration for Google cloud features

### Credentials
These options break our convention on using `camelCase` because they are passed directly to the Google API.
If you're using a config file you add additional options to this, and they will be passed along.
These credentials are used for the following apis if you enabled them in the config:
- Cloud Vision
- Cloud Logging

#### Client Email
type: string
config file: `monitoring.credentials.client_email`
environment: `MODBOT_MONITORING_CREDENTIALS_CLIENT_EMAIL`

#### Private Key
type: string
config file: `monitoring.credentials.private_key`
environment: `MODBOT_MONITORING_CREDENTIALS_PRIVATE_KEY`

### Logging
Configuration for logging messages to the Google cloud using the Google cloud logging api. 
If you don't want to use Google cloud logging just ignore this.

#### Enabled
type: boolean
config file: `googleCloud.logging.enabled`
environment: `MODBOT_GOOGLE_CLOUD_LOGGING_ENABLED`

#### Project ID
type: string
config file: `googleCloud.logging.projectId`
environment: `MODBOT_GOOGLE_CLOUD_LOGGING_PROJECT_ID`

#### Log Name
type: string
config file: `googleCloud.logging.logName`
environment: `MODBOT_GOOGLE_CLOUD_LOGGING_LOG_NAME`

### Vision
Configuration for using the cloud vision API to detect adult images.

#### Enabled
type: boolean
config file: `googleCloud.vision.enabled`
environment: `MODBOT_GOOGLE_CLOUD_VISION_ENABLED`

## Feature Whitelist (optional)
Array of server ids that are allowed to use special features (e.g. `/purge-invites`).
type: string[]
config file: `featureWhitelist`
environment: `MODBOT_FEATURE_WHITELIST`

## Emoji (optional)
Snowflakes of discord custom Emojis. The bot must be on the server the emoji is registered on. Emoji IDs are strings and
the naming follows the conventions described [above](#configuration).

Currently, the following emojis are used:
- source
- privacy
- invite
- discord
- youtube
- zendesk
- firstPage
- previousPage
- refresh
- nextPage
- lastPage
- announcement
- channel
- forum
- stage
- thread
- voice
- avatar
- ban
- moderations
- mute
- pardon
- strike
- kick
- userCreated
- userId
- userJoined

As environment variables these would follow the standard of `MDOBOT_EMOJI_LAST_PAGE`.