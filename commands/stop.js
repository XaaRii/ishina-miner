const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	name: 'stop',
	description: 'Stop your miner.',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('e82e2e');

		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (!docs[0].tmpassworded) return message.reply("Your miner is missing cookies file. Please use `" + prefix + "pass <password>` to finish the setup");
			message.channel.sendTyping();
			exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
				const runningTM = stdout.split("\n");
				const authorid = docs[0].tmowner;
				if (!runningTM.includes(authorid)) return message.reply("Your miner is already down.");
				exec("screen -S tm-" + authorid + " -X stuff $'\003'");
				message.channel.send("Initiated shutdown... please wait a moment for it to close all channels.");
				loopcheck();

				function loopcheck() {
					setTimeout(() => {
						exec(`screen -S tm-${authorid} -X hardcopy "~/temp/${authorid}.log"`, function (e, o, oe) {
							if (e) {
								// process stopped, yaay
								embed.setDescription("Twitch miner closed successfully.")
									.setTitle(docs[0].tmusername + "'s miner")
									.setTimestamp()
									.setFooter({ text: `Need help? type ${prefix}help (command)!` });
								message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
								docs[0].tmrunning = false;
							} else {
								message.channel.sendTyping();
								return loopcheck();
							}
						});
					}, 3000);
				}
			});
		});
	},
};