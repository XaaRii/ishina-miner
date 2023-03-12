const prefix = require(".cfg.json").prefix;
const { tmmachines } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	name: "view",
	async execute(interaction) {
		const embed = new EmbedBuilder();
		const authorid = interaction.user.id;

		tmmachines.find({ tmowner: authorid }, async function (err, docs) {
			if (docs.length < 1) return interaction.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			interaction.deferReply();
			var viewMsg;
			await spectator(0, viewMsg);

			async function spectator(i, viewMsg) {
				exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log"`, async function (e, o, oe) {
					if (e) {
						// process stopped
						if (i < 5) embed.setDescription("Twitch miner is not running.\nNext refresh in 10 seconds. (" + i + "/5)");
						else embed.setDescription("Twitch miner is not running.");
						embed.setColor('e82e2e')
							.setTitle(docs[0].tmusername + "'s miner")
							.setTimestamp()
							.setFooter({ text: `Need help? type ${prefix}help (command)!` });
						if (i < 1) viewMsg = await interaction.reply({ embeds: [embed] }).catch(er => { interaction.reply({ content: "something fucked up, " + er }); });
						else viewMsg.edit({ embeds: [embed] }).catch(er => { interaction.reply({ content: "something fucked up, " + er }); });
						if (i < 5) { setTimeout(() => { return spectator((i + 1), viewMsg); }, 10000); }
						else return;
					} else {
						exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 10 '[[:blank:]]' | tac`, async function (ee, oo, ooee) {
							if (ee) return interaction.reply("Something fucked up, please report to Pawele.");
							if (i < 5) embed.setDescription("Next refresh in 10 seconds. (" + i + "/5)");
							else embed.setDescription("Closed view (" + i + "/5)");
							embed.setColor('43ea46')
								.setTitle(docs[0].tmusername + "'s miner")
								.setFields([
									{
										name: `Twitch miner output:`, value: oo, inline: false,
									},
								])
								.setTimestamp()
								.setFooter({ text: `Need help? type ${prefix}help (command)!` });
							if (i < 1) viewMsg = await interaction.reply({ embeds: [embed] }).catch(er => console.log("something fucked up, " + er));
							else interaction.editReply({ embeds: [embed] }).catch(er => console.log("something fucked up, " + er));
							if (i < 5) { setTimeout(() => { return spectator((i + 1), viewMsg); }, 10000); }
							else return;
						});
					}
				});
			}
		});
	},
};
