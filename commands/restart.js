const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
	name: 'restart',
	description: 'Restart your miner.',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('43ea46');

		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (!docs[0].tmpassworded) return message.reply("Your miner is missing cookies file. Please use `" + prefix + "pass <password>` to finish the setup");
			message.channel.sendTyping();
			exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
				const runningTM = stdout.split("\n");
				const authorid = docs[0].tmowner;
				if (runningTM.includes(authorid)) return wasRunning();
				return startup();

				function wasRunning() {
					exec("screen -S tm-" + authorid + " -X stuff $'\003'");
					message.channel.send("Initiated shutdown... please wait a moment for it to close all channels.");
					return loopcheck();
				}

				function loopcheck() {
					setTimeout(() => {
						exec(`screen -S tm-${authorid} -X hardcopy "~/twitchminers/templogs/${authorid}.log"`, function (e, o, oe) {
							if (e) {
								// process stopped, yaay
								docs[0].tmrunning = false;
								return startup();
							} else {
								message.channel.sendTyping();
								return loopcheck();
							}
						});
					}, 4000);
				}

				function startup() {
					// rebuild the runPy
					var victlist = ['twitch_miner.mine(', '    ['];
					tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
						return runFileBuild(victlist, 0, d);
					});
				}

				function runFileBuild(victlist, n, d) {
					if (n < d.length) {
						victlist.push('        "' + d[n].tmvictim + '",');
						return runFileBuild(victlist, (n + 1), d);
					}
					victlist.push('    ],', '    followers=False,', '    followers_order=FollowersOrder.ASC', ')');
					const vlready = victlist.join("\n");

					var oldFile = fs.readFileSync('./twitchminers/run' + authorid + '.py', 'utf8');
					if (!oldFile) return message.reply("error: Your file seems to be missing *somehow*. Contact Pawele, he will help ya.");
					oldFile = oldFile.split("twitch_miner.mine");

					fs.writeFileSync('./twitchminers/run' + authorid + '.py', oldFile[0] + vlready, 'utf8');
					return finalizing();
				}
				function finalizing() {
					// start it lol
					exec(`screen -S tm-${authorid} -d -m python ./twitchminers/run${authorid}.py`);

					// i would like to wait and check here that it reads [Loading xx streamers...]
					setTimeout(() => {
						exec(`screen -S tm-${authorid} -X hardcopy "~/twitchminers/templogs/${authorid}.log" && sleep 1 && screen -S tm-${authorid} -X hardcopy "./twitchminers/templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 5 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
							if (err) return message.channel.send("Something fucked up, contact Pawele, he will help ya.");
							if (stdout.includes("Loading data for")) {
								embed.setDescription("Twitch miner started successfully.");
								docs[0].tmrunning = true;
							}
							if (stdout.includes("You'll have to login to Twitch!")) {
								embed.setDescription("Twitch miner couldn't start - it requires login (maybe you changed your password?)");
								exec("screen -S tm-" + authorid + " -X stuff $'\003'");
								docs[0].tmrunning = false; docs[0].tmpassworded = false;
							}

							embed.setTitle(docs[0].tmusername + "'s miner")
								.setTimestamp()
								.setFooter({ text: `Need help? type ${prefix}help (command)!` });
							message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
						});
					}, 1500);
				}
			});
		});
	},
};