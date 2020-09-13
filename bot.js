const Discord = new require('discord.js');
const client = new Discord.Client();
const config = require('./config.json');
const mysql = require('mysql2');
const steamAPI = new (require('steamapi'))(config.steamAPIKey)
const steamID = require('steamid');
const PREFIX = config.commandPrefix;
client.once('ready', () => console.log("I'm a bot!"));

client.login(config.discordKey);

const pool = mysql.createPool({
    connectionLimit: 20,
    ...config.db
});

const Top = message => {
    pool.getConnection((err, con) => {
        con.query(`SELECT name, steam, value, rank, kills, deaths FROM lvl_base ORDER BY value DESC LIMIT ${config.topX}`, (err, result) => {
            if (!result || result.length <= 0) 
            {
                con.release();
                return message.reply(`No players found`);
            }
            let embed = new Discord.MessageEmbed()
                .setColor("40C0EF")
                .setTitle(`__Top ${config.topX} Players!__`);

            result.forEach((player, index) => {
                embed.addField(`${index + 1}. ${player.name}`, `**Score:** ${player.value}\n**Kills:** ${player.kills}\n**Deaths:** ${player.deaths}\n${player.steam}`, true);
            });
            con.release();
            return message.reply(embed);
        });
    });
};

const Rank = async message => {
    const usage = `**Usage:** ${PREFIX}rank <Steam user/ID>`;
    if (message.content == `${PREFIX}rank`)
        return message.reply(`Displays stats for a user's Steam ID:\n${usage}`);

    let steam = await GetSteam(message);
    if (!steam) return message.reply('Invalid ID given.');

    profile = await steamAPI.getUserSummary(steam.getSteamID64());

    pool.getConnection((err, con) => {
        con.query(`SELECT name, value, rank, kills, deaths, headshots, hits, assists, round_win, round_lose, playtime FROM lvl_base WHERE steam = '${steam.getSteam2RenderedID(true)}'`, (err, result) => {

            if (!result || result.length <= 0) 
            {
                con.release();
                return message.reply(`No results found for ${steam.getSteam2RenderedID(true)}`);
            }
            let embed = new Discord.MessageEmbed()
                .setColor("40C0EF")
                .setTitle(`${result[0].name}'s Profile`)
                .setThumbnail(profile ? profile.avatar.medium : "")
                .setURL(profile ? profile.url : "")
                .addFields(
                    { name: "Kills",         value: result[0].kills, inline: true },
                    { name: "Deaths",        value: result[0].deaths, inline: true },
                    { name: "Assists",       value: result[0].assists, inline: true },
                    { name: "Headshots",     value: result[0].headshots, inline: true },
                    { name: "KDR",           value: (result[0].kills / (result[0].deaths || 1)).toFixed(2), inline: true },
                    { name: "HS Percentage", value: (result[0].headshots / (result[0].kills || 1) * 100).toFixed(2), inline: true },
                    { name: "Rounds Played", value: result[0].round_win + result[0].round_lose, inline: true }
                )
            con.release();
            return message.reply(embed);
        });
    });
};

const GetSteam = async message => {

	const steam = message.content.match(/((?:STEAM_[0-9]:[0-9]:[0-9]+)|(?:\[U:[0-9]:[0-9]+\])|(?:https?:\/\/steamcommunity\.com\/[^\s]+)|(?:[0-9]+)|(?:[a-zA-Z0-9]+$))/);
    if (!steam || !steam[1]) return message.reply(`Invalid Steam ID given`);
    
    let id, sid;
    if (steam[1].match(/^((?![0-9]+$)[a-zA-Z0-9]+)$/))
    	steam[1] = `https://steamcommunity.com/id/${steam[1]}`;

    if (steam[1].startsWith('http'))
    	try {
    		sid = new steamID(await steamAPI.resolve(steam[1]));
    	}
    	catch (e) {
    		message.reply("No match for this ID");
    		return false;
    	}
    else sid = new steamID(steam[1]);

    if (!sid.isValid()) 
    {
    	message.reply(`Invalid Steam ID given`);
    	return false;
    } 
    else return sid;
}

client.on('message', async message => {
    if (message.author === client.user) return;

    if (message.content.startsWith(`${PREFIX}top`)) return Top(message);
    else if (message.content.startsWith(`${PREFIX}rank`)) return Rank(message);
});

setInterval(() => pool.query("SELECT 1"), 10000);