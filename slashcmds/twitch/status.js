const prefix = require("../../.cfg.json").prefix;
var { tmmachines } = require('../../exports.js');
const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	name: "status",
	async execute(interaction) {
		const embed = new EmbedBuilder().setColor('43ea46');
		const authorid = interaction.user.id;

		tmmachines.find({ tmowner: authorid }, function (err, docs) {
			if (docs.length < 1) return interaction.reply("Sorry, but you don't own any miner. Though, you can register one using `/twitch create <username>`");
			exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
				const runningTM = stdout.split("\n");
				if (runningTM.includes(authorid)) embed.setDescription("Your twitch miner is running.").setColor('43ea46');
				else embed.setDescription("Your twitch miner is not running.").setColor('e82e2e');

				if (!docs[0].tmpassworded) {embed.addFields([{
					name: `Attention!`, value: "Your miner is missing cookies file. Please use `/twitch auth` to finish the setup", inline: false,
				}]);}

				embed.setTitle(docs[0].tmusername + "'s miner")
					.setTimestamp();
				return interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
			});
		});
	},
};
