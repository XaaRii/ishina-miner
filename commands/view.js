const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	name: 'view',
	description: 'View latest few lines from your miner.',
	aliases: ["read"],
	showHelp: true,
	async execute(message, args) {
		const embed = new EmbedBuilder();
		const authorid = (args[0] && message.author.id === config.xaari) ? args[0] : message.author.id;

		tmmachines.find({ tmowner: authorid }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			message.channel.sendTyping();

			exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log"`, function (e, o, oe) {
				if (e) {
					// process stopped
					embed.setDescription("Twitch miner is not running.")
						.setColor('e82e2e')
						.setTitle(docs[0].tmusername + "'s miner")
						.setTimestamp()
						.setFooter({ text: `Need help? type ${prefix}help (command)!` });
					return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
				} else {
					exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 10 '[[:blank:]]' | tac`, function (ee, oo, ooee) {
						if (ee) return message.reply("Something fucked up, please report to Pawele.");
						embed.setColor('e82e2e')
							.setTitle(docs[0].tmusername + "'s miner")
							.addFields([
								{
									name: `Twitch miner output:`, value: oo, inline: false,
								},
							])
							.setTimestamp()
							.setFooter({ text: `Need help? type ${prefix}help (command)!` });
						return message.reply({ embeds: [embed] }).catch(er => { message.reply({ content: "something fucked up, " + er }); });
					});
				}
			});
		});
	},
};