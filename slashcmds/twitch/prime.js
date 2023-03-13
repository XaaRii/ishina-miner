const prefix = require("../../.cfg.json").prefix;
const { EmbedBuilder } = require('discord.js');
const fs = require("fs");

module.exports = {
	name: "prime",
	async execute(interaction) {
		// show list
		const embed = new EmbedBuilder();
		var backupUsed = false;
		const embedBackup = new EmbedBuilder();
		const file = JSON.parse(fs.readFileSync("./checkers/prime_fetch.json", 'utf8'));
		const data = file.data;

		for (let i = 0; i < data.length; i++) {
			const e = data[i];
			// [ bundle name, game name, time, url ]
			if (e[0] !== "Undetectable" && e[1] === "Undetectable") e[1] = "Free to claim game";
			if (e[3] !== "Link Undetectable") {
				if (i < 25) embed.addFields({ name: e[0], value: `${e[1]}\nExpires in${e[2]}\n[offer link](${e[3]})`, inline: true });
				else {
					backupUsed = true;
					embedBackup.addFields({ name: e[0], value: `${e[1]}\nExpires in${e[2]}\n[offer link](${e[3]})`, inline: true });
				}
			}
		}
		embed.setTitle("Current Twitch Prime offers:")
			.setColor("ffca2b")
			.setTimestamp()
			.setFooter({ text: `Need help? type ${prefix}help (command)!` });
		if (backupUsed) {
			embedBackup.setTitle("More than 25 games - splitted into two embeds")
				.setColor("ffca2b")
				.setTimestamp()
				.setFooter({ text: `Need help? type ${prefix}help (command)!` });
			return interaction.reply({ embeds: [embed, embedBackup] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
		} else return interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
	},
};
