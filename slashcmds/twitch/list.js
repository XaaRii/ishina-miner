const prefix = require("../../.cfg.json").prefix;
const { tmmachines, tmvictimlist, splitLines } = require('../../exports.js');
const { EmbedBuilder, escapeMarkdown } = require('discord.js');

module.exports = {
	name: "list",
	async execute(interaction) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		const authorid = interaction.user.id;

		tmmachines.findOne({ tmowner: authorid }, function (err, doc) {
			if (!doc) return interaction.reply("Sorry, but you don't own any miner. Though, you can register one using `/twitch create <username>`");
			var victlist = [];
			tmvictimlist.find({ tmusername: doc.tmusername }, function (err, d) {
				if (d.length < 1) {
					embed.setTitle(doc.tmusername + "'s miner")
						.setDescription("You didn't set any streamers to mine on yet!")
						.setTimestamp()
						.setFooter({ text: `Need help? type ${prefix}help (command)!` });
					return interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
				}

				const groups = {};
				for (let i = 0; i < d.length; i++) {
					const streamer = d[i].tmvictim, comment = d[i].tmcomment === "" ? "none" : d[i].tmcomment;
					if (groups[comment]) groups[comment] += ', ' + streamer;
					else groups[comment] = streamer;
				}

				for (const group in groups) {
					if (group !== 'none') victlist.push(`${escapeMarkdown(group)}:\n\`\`\`\n${groups[group]}\`\`\``);
				}
				if (groups['none']) victlist.push(`No comment:\n\`\`\`\n${groups['none']}\`\`\``);

				const vlready = splitLines(victlist, 1020) ?? [];
				embed.setTitle(doc.tmusername + "'s miner")
					.setDescription("The list of streamers your miner mines on:")
					.setTimestamp();

				for (let i = 0; i < vlready.length; i++) {
					embed.addFields([{
						name: "⠀", value: vlready[i], inline: false,
					}]);
				}
				interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
			});
		});
	},
};
