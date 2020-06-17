# levelsranks-discord

Discord bot for use with [LevelsRanks](https://github.com/levelsranks/levels-ranks-core) stat system.

## Install
- Clone this repo to your host machine that has npm/node installed
- Create your bot application in Discord
- Get a Steam API key from [here](https://steamcommunity.com/dev/apikey)
- Fill in the `config.json` with your database details and bot key
- On your host machine, go to the repo you cloned into:
```bash
npm i
node bot.js
```
You may want to use a process manager like `pm2` for auto restarts in case of error.
