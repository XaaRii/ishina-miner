const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder, escapeMarkdown } = require('discord.js');

module.exports = {
	name: 'list',
	description: 'Check locations where you mine.',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
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
					if (d[n].tmcomment !== "") victlist.push("`" + escapeMarkdown(d[n].tmvictim) + "` (" + d[n].tmcomment + ")");
					else victlist.push(`\`${d[n].tmvictim}\``);
					return runListBuild(victlist, (n + 1), d);
				}
				const vlready = victlist.join("\n");
				embed.setTitle(docs[0].tmusername + "'s miner")
					.addFields([{
						name: `The list of usernames your miner mines on:`, value: vlready, inline: false,
					}])
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			}
		});
	},
};