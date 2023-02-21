const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	name: 'view',
	description: 'View latest few lines from your miner.',
	aliases: ["read", "open"],
	showHelp: true,
	async execute(message, args) {
		const embed = new EmbedBuilder();
		const authorid = (args[0] && message.author.id === config.xaari) ? args[0] : message.author.id;

		tmmachines.find({ tmowner: authorid }, async function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			message.channel.sendTyping();
			var viewMsg;
			await spectator(0, viewMsg);

			async function spectator(i, viewMsg) {
				exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log"`, async function (e, o, oe) {
					if (e) {
						// process stopped
						if (i < 6) embed.setDescription("Twitch miner is not running.\nNext refresh in 10 seconds. (" + i + "/6)");
						else embed.setDescription("Twitch miner is not running.");
						embed.setColor('e82e2e')
							.setTitle(docs[0].tmusername + "'s miner")
							.setTimestamp()
							.setFooter({ text: `Need help? type ${prefix}help (command)!` });
					} else {
						exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 10 '[[:blank:]]' | tac`, async function (ee, oo, ooee) {
							if (ee) return message.reply("Something fucked up, please report to Pawele.");
							if (i < 6) embed.setDescription("Next refresh in 10 seconds. (" + i + "/6)");
							else embed.setDescription("Closed view (" + i + "/6)");
							embed.setColor('43ea46')
								.setTitle(docs[0].tmusername + "'s miner")
								.setFields([
									{
										name: `Twitch miner output:`, value: oo, inline: false,
									},
								])
								.setTimestamp()
								.setFooter({ text: `Need help? type ${prefix}help (command)!` });
						});
					}
					if (i < 1) viewMsg = await message.channel.send({ embeds: [embed] }).catch(er => { message.reply({ content: "something fucked up, " + er }); });
					else viewMsg.edit({ embeds: [embed] }).catch(er => { message.reply({ content: "something fucked up, " + er }); });
					if (i < 6) {
						setTimeout(() => {
							return spectator((i + 1), viewMsg);
						}, 5000);
					}
					else return;
				});
			}
		});
	},
};