### Commands

- article

  Usage:
  ```
  ,article search query
  ```

- ip

  Usage:
  ```
  ,ip require #channel
  ```
  sub commands:
  -  require:
    Messages without an .aternos.me IP in this channel will be deleted
  - forbid
    Messages with an .aternos.me IP in this channel will be deleted
  - off
    No Messages will be deleted

  channel can be a #channel mention or channel ID

- ipcooldown

  Usage:
  ```
  ,ipcooldown #channel 2h 30m 5s
  ```
  channel can be a #channel mention or channel ID
  time is the cooldown you want to set.
  Supported units are y(years), w(weeks), d(days), h(hours), m(minutes), and s(seconds).

  Note: Messages sent less then a minute before the cooldown ends will not be deleted. Cooldowns below 60s are not possible.

- logchannel

  Usage:
  ```
  ,logchannel #channel
  ```
  channel can be a #channel mention or channel ID

- tutorial (or video)

  Usage:
  ```
  ,tutorial search query
  ```
