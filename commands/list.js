const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist, splitLines } = require('../exports.js');
const { EmbedBuilder, escapeMarkdown } = require('discord.js');

module.exports = {
	name: 'list',
	description: 'Check locations where you mine.',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		const authorid = (args[0] && message.author.id === config.xaari) ? args[0] : message.author.id;

		tmmachines.findOne({ tmowner: authorid }, function (err, doc) {
			if (!doc) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			var victlist = [];
			tmvictimlist.find({ tmusername: doc.tmusername }, function (err, d) {
				if (d.length < 1) {
					embed.setTitle(doc.tmusername + "'s miner")
						.setDescription("You didn't set any streamers to mine on yet!")
						.setTimestamp()
						.setFooter({ text: `Need help? type ${prefix}help (command)!` });
					return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
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
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });

				for (let i = 0; i < vlready.length; i++) {
					embed.addFields([{
						name: "⠀", value: vlready[i], inline: false,
					}]);
				}
				message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			});
		});
	},
};