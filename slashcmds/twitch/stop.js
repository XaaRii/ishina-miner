const prefix = require("../../.cfg.json").prefix;
var { tmmachines, recentBlock } = require('../../exports.js');
const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	name: "stop",
	async execute(interaction) {
		const embed = new EmbedBuilder().setColor('e82e2e');
		const authorid = interaction.user.id;
		await interaction.deferReply();

		tmmachines.find({ tmowner: authorid }, async function (err, docs) {
			if (docs.length < 1) return interaction.followUp("Sorry, but you don't own any miner. Though, you can register one using `/twitch create <username>`");
			if (!docs[0].tmpassworded) return interaction.followUp("Your miner is missing cookies file. Please use `/twitch auth` to finish the setup");
			if (!recentBlock.includes(authorid)) {
				recentBlock.push(authorid);
				setTimeout(() => { recentBlock = recentBlock.filter(x => x !== authorid); }, 30000);
			}
			exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
				const runningTM = stdout.split("\n");
				if (!runningTM.includes(authorid)) return interaction.followUp("Your miner is already down.");
				exec("screen -S tm-" + authorid + " -X stuff $'\003'");
				interaction.editReply("Initiated shutdown... please wait a moment for it to close all channels.");
				loopcheck();

				function loopcheck() {
					setTimeout(() => {
						exec(`screen -S tm-${authorid} -X hardcopy "./temp/${authorid}.log"`, function (e, o, oe) {
							if (e) {
								// process stopped, yaay
								embed.setDescription("Twitch miner closed successfully.")
									.setTitle(docs[0].tmusername + "'s miner")
									.setTimestamp()
									.setFooter({ text: `Need help? type ${prefix}help (command)!` });
								interaction.editReply({ embeds: [embed] }).catch(e => { interaction.editReply({ content: "something fucked up, " + e }); });
								docsUpdate(false);
							} else {
								return loopcheck();
							}
						});
					}, 3000);
				}
			});
		});

		function docsUpdate(runValue) {
			// docsUpdate(tmrunning);
			tmmachines.update({ tmowner: authorid }, { $set: { tmrunning: runValue } });
		}
	},
};
