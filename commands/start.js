const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
	name: 'start',
	description: 'Start your miner.',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('43ea46');
		const authorid = (args[0] && message.author.id === config.xaari) ? args[0] : message.author.id;

		tmmachines.find({ tmowner: authorid }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (!docs[0].tmpassworded) return message.reply("Your miner is missing cookies file. Please use `" + prefix + "auth` to finish the setup");
			message.channel.sendTyping();
			exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
				const runningTM = stdout.split("\n");
				if (runningTM.includes(authorid)) return message.reply("Your miner is already running. Perhaps you meant `" + prefix + "restart`?");
				var viewMsg = 0;

				// rebuild the runPy
				var victlist = ['miner.mine(', '        ['];
				tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
					return runFileBuild(victlist, 0, d);
				});

				function runFileBuild(victlist, n, d) {
					if (n < d.length) {
						victlist.push('            "' + d[n].tmvictim + '",');
						return runFileBuild(victlist, (n + 1), d);
					}
					victlist.push(
						'        ],',
						'        followers=False,',
						'        followers_order=FollowersOrder.ASC',
						'    )',
						'except Exception as e:',
						'    with open("./templogs/tm-' + authorid + '.err", "w") as f:',
						'        traceback.print_exc(file=f)',
						'        sys.exit(1)',
					);
					const vlready = victlist.join("\n");

					let oldFile = fs.readFileSync('./twitchminers/run' + authorid + '.py', 'utf8');
					if (!oldFile) return message.reply("error: Your file seems to be missing *somehow*. Contact Pawele, he will help ya.");
					oldFile = oldFile.split("miner.mine");

					fs.writeFileSync('./twitchminers/run' + authorid + '.py', oldFile[0] + vlready, 'utf8');
					exec(`cd twitchminers && screen -S tm-${authorid} -d -m bash starter.sh ${authorid}`);
					setTimeout(() => {
						return spectR(0, 1);
					}, 1000);
				}

				async function spectR(i, mode) {
					exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 10 '[[:blank:]]' | tac`, async function (e, o, oe) {
						var finito = false;
						if (e) {
							// process stopped
							if (!mode) {
								docsUpdate(false, true);
								finito = true;
							}
							mode ? embed.setDescription("Twitch miner is not running. (" + i + "/6)") : embed.setDescription("Twitch miner is not running.");
							embed.setColor('e82e2e')
								.setTitle(docs[0].tmusername + "'s miner")
								.setTimestamp()
								.setFooter({ text: `Need help? type ${prefix}help (command)!` });
						} else {
							if (mode) {
								if (i < 6) embed.setDescription("Next refresh in 10 seconds. (" + i + "/6)");
								else embed.setDescription("Closed view (" + i + "/6)");
								if (o.includes("Loading data for")) {
									docsUpdate(true, true);
									var running = true;
								}
								else if (o.includes("You'll have to login to Twitch!")) {
									embed.setDescription("Twitch miner couldn't start! (maybe you changed your password?)");
									finito = true;
									exec("screen -S tm-" + authorid + " -X stuff $'\003'");
									docsUpdate(false, false);
								}
							} else embed.setDescription("Still running...");
							const output = o || "[empty output]";
							embed.setColor('43ea46')
								.setTitle(docs[0].tmusername + "'s miner")
								.setFields([
									{
										name: `Twitch miner output:`, value: o, inline: false,
									},
								])
								.setTimestamp()
								.setFooter({ text: `Need help? type ${prefix}help (command)!` });
						}
						if (mode) {
							var cont = running ? cont = "Twitch miner is running!" : "Starting up...";
							if (!viewMsg) {
								viewMsg = await message.channel.send({ content: cont, embeds: [embed] }).catch(er => { message.reply({ content: "something fucked up, " + er }); });
							} else viewMsg.edit({ content: cont, embeds: [embed] }).catch(er => { message.reply({ content: "something fucked up, " + er }); });
							if (finito) return;
							if (i < 6) {
								setTimeout(() => {
									return spectR((i + 1), mode);
								}, 5000);
							} else return;
						} else {
							const msgObj = { content: "Initiated shutdown... please wait a moment for it to close all channels.", embeds: [embed] };
							if (!viewMsg) {
								viewMsg = await message.channel.send(msgObj).catch(er => { message.reply({ content: "something fucked up, " + er }); });
							} else viewMsg.edit(msgObj).catch(er => { message.reply({ content: "something fucked up, " + er }); });
							if (finito) return; // startup();
							else {
								setTimeout(() => {
									return spectR((i + 1), mode);
								}, 3000);
							}
						}
					});
				}

				function docsUpdate(runValue, pwValue) {
					// docsUpdate(tmrunning, tmpassworded);
					tmmachines.update({ tmowner: authorid }, { $set: { tmrunning: runValue, tmpassworded: pwValue } });
				}
			});
		});
	},
};