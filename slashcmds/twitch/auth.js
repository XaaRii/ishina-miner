const prefix = require("../../.cfg.json").prefix;
var { tmmachines, tmvictimlist } = require('../../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
	name: "auth",
	async execute(interaction) {
		if (fs.existsSync("../passblocked")) return passblock();
		function passblock() {
			const { misc } = require('../../exports.js');
			misc.find({ passblock: { who: interaction.user.id } }, function (err, docs) {
				if (docs.length < 1) {
					misc.insert({ passblock: { "who": interaction.user.id } }, (err) => {
						if (err) return interaction.reply("Something fucked up while trying to write down your name to remind you later about availability of this command:\n" + err);
					});
				}
				return interaction.reply("I'm sorry, but twitch had a change in logging in - until this is resolved, I cannot log in...\nWhen this gets fixed, I'll send you a message. Thanks for understanding.");
			});
		}

		const embed = new EmbedBuilder().setColor('ffbf00');
		var timeIssued;

		tmmachines.find({ tmowner: interaction.user.id }, function (err, docs) {
			if (docs.length < 1) return interaction.reply("Sorry, but you don't own any miner. Though, you can register one using `/twitch create <username>`");
			if (docs[0].tmpassworded) return interaction.reply("You don't have to authorize again. It was already accepted.\nIf there are any problems (fe. you changed twitch username) contact Pawele, he will help you.");
			// if (!args[0]) return message.reply("If you won't pass me any password, i can't log in!");
			if (docs[0].tmrunning) return interaction.reply("There is already an authorization process ongoing.");

			interaction.deferReply();
			const authorid = docs[0].tmowner;

			console.info(`Auth request from ${interaction.user.username} is occurring:`);
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
				if (!oldFile) return interaction.reply("error: Your file seems to be missing *somehow*. Contact Pawele, he will help ya.");
				oldFile = oldFile.split("miner.mine");

				fs.writeFileSync('./twitchminers/run' + authorid + '.py', oldFile[0] + vlready, 'utf8');
				return finalizing();
			}
			function finalizing() {
				console.info("finalizing1");
				exec(`cd twitchminers && screen -S tm-${authorid} -d -m bash starter.sh ${authorid}`, function (err, stdout, stderr) {
					if (err) console.log(err);
					setTimeout(() => {
						exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 10 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
							console.info("prompted a hardcopy:");
							if (stdout) console.log(stdout);
							if (err) {
								if (stdout.includes("There are several suitable screens on")) {
									return interaction.editReply("This should not be happening! There are multiple sessions opened, contact Pawele and he will manually fix it.");
								}
								console.log("finalizing1 hardcopy -\n" + err);
								return interaction.editReply("Something fucked up, contact Pawele, he will look into it.");
							}
							if (stdout.includes("It will expire in")) {
								console.info("stdout.includes It will expire in");
								docsUpdate(true, false);
								let authCode = stdout.split("enter this code: ");
								authCode = authCode[1].split(/\r?\n|\r/g);
								interaction.editReply(`You want to authorize your twitch miner called \`${docs[0].tmusername}\` right?\nFor that, you have to go to a website __<https://www.twitch.tv/activate>__, fill in the following code: \`${authCode[0]}\` and grant the access to your account.\n**__Make sure you are logged into the correct account before progressing!__** If the name isn't the same as the one you put into twitch miner, bad things will happen.\nAfter that, the miner will be ready to go. But be quick, you only have 30 minutes before the code expires!`);
								timeIssued = Date.now();
								return waitcheck();
							} else if (stdout.includes("Loading data for")) {
								console.info("stdout.includes Loading data for");
								// prefilled pw / cookies
								docsUpdate(true, true);
								return interaction.reply("Found a matching password or cookies file in my storage...\nAuthorization complete, it is running now.");
							} else {
								console.log("How did we get here? -\n" + stdout);
								return interaction.reply("How did we get here? Something must be broken, report this to Pawele. *(Although I'm not entirely sure if he'll be able to help)*");
							}
						});
					}, 1500);
				});
			}

			function waitcheck() {
				console.info("waitcheck");
				setTimeout(() => {
					if (Date.now() > (timeIssued + 1800000)) {
						exec("screen -S tm-" + authorid + " -X stuff $'\003'");
						docsUpdate(false, false);
						return interaction.followUp("You didn't finish it on time and the code expired.");
					}
					exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 9 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
						if (stdout) console.info(stdout);
						// with the old password approach this shouldn't happen
					//	if (err) {
					//		console.log("finalizing3 hardcopy -\n" + err);
					//		return message.channel.send("Something fucked up, contact Pawele, he will look into it.");
					//	}
						if (err) {
							console.log("f3 err triggered, bad username?\n" + err);
							docsUpdate(false, false);
							return interaction.followUp("Twitch miner crashed. Are you sure you authorized with the right account?\nYou can try again to make sure or contact Pawele for help.");
						}
						if (stdout.includes("automatic temporary ban") || stdout.includes("Use a VPN")) {
								// message.channel.send("It seems we got automatically temporarily banned from trying to log in. This happens when you incorrectly submit your 2FA a few times.\n**Don't worry, it is only temporary**. Try again tomorrow.");
							interaction.followUp("It seems we got automatically temporarily banned from trying to log in. This happens sometimes.\n**Don't worry, it is only temporary**. Try again tomorrow.");
							exec("screen -S tm-" + authorid + " -X stuff $'\003'");
							docsUpdate(false, false);
							return fs.unlink('./twitchminers/cookies/' + docs[0].tmusername + '.pkl', () => true);
						}
						if (stdout.includes("Loading data for")) {
							docsUpdate(true, true);
							embed.setTitle(docs[0].tmusername + "'s miner")
								.setFields([{
									name: "Logged in successfully!", value: "Authorization complete, your miner will now start.", inline: false,
								}])
								.setTimestamp()
								.setFooter({ text: `Need help? type ${prefix}help (command)!` });
							return interaction.editReply({ embeds: [embed] }).catch(e => { interaction.editReply({ content: "something fucked up, " + e }); });
						}
					//	if (stdout.includes("Invalid Login") || stdout.includes("Invalid two factor")) {
					//		message.channel.send("Invalid 2FA verification code, please try again.");
					//		return finalizing3();
					//	}
						return waitcheck();
					});
				}, 5000);
			}

			function docsUpdate(runValue, pwValue) {
				// docsUpdate(tmrunning, tmpassworded);
				tmmachines.update({ tmowner: interaction.user.id }, { $set: { tmrunning: runValue, tmpassworded: pwValue } });
			}
		});
	},
};
