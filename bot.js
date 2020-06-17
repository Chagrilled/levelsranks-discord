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
    if (message.content == `${PREFIX}rank`)
        return message.reply(`Displays stats for a user's Steam ID:\n**Usage:** ${PREFIX}rank STEAM_1:0:12345`);

    const steam = message.content.match(/rank (STEAM_[0-9]:[0-9]:[0-9]+)/);
    if (!steam || !steam[1]) return message.reply(`Invalid Steam ID given\n**Usage:** ${PREFIX}rank STEAM_1:0:1234`);
    let sid = new steamID(steam[1]);

    profile = await steamAPI.getUserSummary(sid.getSteamID64());

    pool.getConnection((err, con) => {
        con.query(`SELECT name, value, rank, kills, deaths, headshots, hits, assists, round_win, round_lose, playtime FROM lvl_base WHERE steam = '${steam[1]}'`, (err, result) => {

            if (!result || result.length <= 0) 
            {
                con.release();
                return message.reply(`No results found for ${steam[1]}`);
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

client.on('message', async message => {
    if (message.author === client.user) return;

    if (message.content.startsWith(`${PREFIX}top`)) return Top(message);
    else if (message.content.startsWith(`${PREFIX}rank`)) return Rank(message);
});

setInterval(() => pool.query("SELECT 1"), 10000);