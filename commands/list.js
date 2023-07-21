const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist, splitLines } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'list',
	description: 'Check locations where you mine.',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		const authorid = (args[0] && message.author.id === config.xaari) ? args[0] : message.author.id;

		tmmachines.find({ tmowner: authorid }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			var victlist = [];
			tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
				if (d.length < 1) {
					embed.setTitle(docs[0].tmusername + "'s miner")
						.setDescription("You didn't set any streamers to mine on yet!")
						.setTimestamp()
						.setFooter({ text: `Need help? type ${prefix}help (command)!` });
					return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
				}
				return runListBuild(victlist, 0, d);
			});

			function runListBuild(victlist, n, d) {
				if (n < d.length) {
					if (d[n].tmcomment !== "") victlist.push(`- ${d[n].tmvictim}    (${d[n].tmcomment})`);
					else victlist.push(`- ${d[n].tmvictim}`);
					return runListBuild(victlist, (n + 1), d);
				}
				const vlready = splitLines(victlist, 1010) ?? [];
				embed.setTitle(docs[0].tmusername + "'s miner")
					.setDescription("The list of usernames your miner mines on:")
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });

				for (let i = 0; i < vlready.length; i++) {
					embed.addFields([{
						name: "⠀", value: "```\n" + vlready[i] + "\n```".slice(), inline: false,
					}]);
				}
				message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			}
		});
	},
};