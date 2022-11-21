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

		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			message.channel.sendTyping();
			const authorid = docs[0].tmowner;

			exec(`screen -S tm-${authorid} -X hardcopy "./twitchminers/templogs/${authorid}.log"`, function (e, o, oe) {
				if (e) {
					// process stopped
					embed.setDescription("Twitch miner is not running.")
						.setColor('43ea46')
						.setTitle(docs[0].tmusername + "'s miner")
						.setTimestamp()
						.setFooter({ text: `Need help? type ${prefix}help (command)!` });
					return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
				} else {
					exec(`screen -S tm-${authorid} -X hardcopy "./twitchminers/templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 10 '[[:blank:]]' | tac`, function (e, o, oe) {
						if (e) return message.reply("Something fucked up, please report to Pawele.");
						embed.setColor('e82e2e')
							.setTitle(docs[0].tmusername + "'s miner")
							.addFields([
								{
									name: `Twitch miner output:`, value: o, inline: false,
								},
							])
							.setTimestamp()
							.setFooter({ text: `Need help? type ${prefix}help (command)!` });
						return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
					});
				}
			});
		});
	},
};