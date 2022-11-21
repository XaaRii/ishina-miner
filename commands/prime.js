const config = require("../.cfg.json");
const { EmbedBuilder } = require('discord.js');
const fs = require("fs");

module.exports = {
	name: 'prime',
	description: 'Check out current offers on Twitch Prime.',
	usage: '',
	showHelp: true,
	execute(message, args) {
		// if (!args.length) {
		// show list
		const embed = new EmbedBuilder();
		const file = JSON.parse(fs.readFileSync("./primecheck/prime_fetch.json", 'utf8'));
		const data = file.data;

		for (let i = 0; i < data.length; i++) {
			const e = data[i];
			// [ bundle name, game name, time, url ]
			if (e[0] !== "Undetectable" && e[1] === "Undetectable") e[1] = "Free to claim game";
			if (e[3] === "Link Undetectable") {
				// just skip this for now
				// embed.addFields({ name: e[0], value: `${e[1]}\nExpires in${e[2]})`, inline: false });
			} else embed.addFields({ name: e[0], value: `${e[1]}\nExpires in${e[2]}\n[offer link](${e[3]})`, inline: false });
		}
		embed.setTitle("Current Twitch Prime offers:")
			.setColor("ffca2b")
			.setTimestamp()
			.setFooter({ text: `Need help? type ${config.prefix}help (command)!` });
		message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
		// }
	},
};