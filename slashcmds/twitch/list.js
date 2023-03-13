const prefix = require("../../.cfg.json").prefix;
const { tmmachines, tmvictimlist } = require('../../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: "list",
	async execute(interaction) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		const authorid = interaction.user.id;

		tmmachines.find({ tmowner: authorid }, function (err, docs) {
			if (docs.length < 1) return interaction.reply("Sorry, but you don't own any miner. Though, you can register one using `/twitch create <username>`");
			var victlist = [];
			tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
				if (d.length < 1) {
					embed.setTitle(docs[0].tmusername + "'s miner")
						.setDescription("You didn't set any streamers to mine on yet!")
						.setTimestamp()
						.setFooter({ text: `Need help? type ${prefix}help (command)!` });
					return interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
				}
				return runListBuild(victlist, 0, d);
			});

			function runListBuild(victlist, n, d) {
				if (n < d.length) {
					if (d[n].tmcomment !== "") victlist.push(`- ${d[n].tmvictim}    (${d[n].tmcomment})`);
					else victlist.push(`- ${d[n].tmvictim}`);
					return runListBuild(victlist, (n + 1), d);
				}
				const vlready = victlist.join("\n");
				embed.setTitle(docs[0].tmusername + "'s miner")
					.addFields([{
						name: `The list of usernames your miner mines on:`, value: "```\n" + vlready + "\n```", inline: false,
					}])
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
			}
		});
	},
};
