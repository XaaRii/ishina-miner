const config = require("../.cfg.json");
const prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
	name: 'auth',
	description: 'Authorize your twitch miner.',
	usage: '',
	showHelp: true,
	execute(message, args) {
		if (fs.existsSync("../passblocked")) return passblock(message);
		function passblock(message) {
			const { passblock } = require('../exports.js');
			passblock.find({ who: message.author.id }, function (err, docs) {
				if (docs.length < 1) {
					passblock.insert({ "who": message.author.id }, (err) => {
						if (err) return message.reply("Something fucked up while trying to write down your name to remind you later about availability of this command:\n" + err);
					});
				}
				return message.reply("I'm sorry, but twitch had a change in logging in - until this is resolved, I cannot log in...\nWhen this gets fixed, I'll send you a message. Thanks for understanding.");
			});
		}
		// const pass = args.join(/ +/);
		// message.delete().catch(O_o => { });

		const embed = new EmbedBuilder().setColor('ffbf00');

		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (docs[0].tmpassworded) return message.reply("You don't have to authorize again. It was already accepted.\nIf there are any problems (fe. you changed twitch username) contact Pawele, he will help you.");
			// if (!args[0]) return message.reply("If you won't pass me any password, i can't log in!");
			if (docs[0].tmrunning) return message.reply("Please do not use this command, just type the numbers alone.");

			message.channel.sendTyping();
			const authorid = docs[0].tmowner;

			if (message.attachments.first()) {
				const request = require(`request`);
				request.get(message.attachments.first().url)
					.on('error', function (error) { return message.channel.send("ᴇʀʀᴏʀ: " + error); })
					.pipe(fs.createWriteStream('./twitchminers/cookies/' + docs[0].tmusername));
				return message.channel.send("File downloaded, now you can start your miner with " + prefix + "start");
			} else {
				console.info(`Auth request from ${message.author.username} is occurring:`);
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

				let oldFile = fs.readFileSync('./twitchminers/run' + authorid + '.py', 'utf8');
				if (!oldFile) return message.reply("error: Your file seems to be missing *somehow*. Contact Pawele, he will help ya.");
				oldFile = oldFile.split("twitch_miner.mine");

				fs.writeFileSync('./twitchminers/run' + authorid + '.py', oldFile[0] + vlready, 'utf8');
				console.info("run.py file built successfully.");
				return finalizing();
			}
			function finalizing() {
				console.info("finalizing1");
				exec(`cd twitchminers && screen -S tm-${authorid} -d -m python run${authorid}.py`, function (err, stdout, stderr) {
					if (err) console.log(err);
					setTimeout(() => {
						exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 10 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
							console.info("prompted a hardcopy:");
							if (stdout) console.log(stdout);
							if (err) {
								if (stdout.includes("There are several suitable screens on")) {
									return message.channel.send("This should not be happening! There are multiple sessions opened, contact Pawele and he will manually fix it.");
								}
								console.log("finalizing1 hardcopy -\n" + err);
								return message.channel.send("Something fucked up, contact Pawele, he will look into it.");
							}
							if (stdout.includes("It will expire in")) {
								console.info("stdout.includes It will expire in");
								docsUpdate(true, false);
								let authCode = stdout.split("enter this code: ");
								authCode = authCode[0].split(/\r?\n|\r/g);
								message.reply(`You want to authorize your twitch miner called \`${docs[0].tmusername}\` right?\nFor that, you have to go to a website __<https://www.twitch.tv/activate>__, fill in the following code: \`${authCode[0]}\` and grant the access to your account.\n**__Make sure you are logged into the correct account before progressing!__** If the name isn't the same as the one you put into twitch miner, bad things will happen.\nAfter that, the miner will be ready to go. But be quick, you only have 30 minutes before the code expires!`);
								return waitcheck();

					//		if (stdout.includes("Enter Twitch password")) {
					//			console.info("stdout.includes Enter Twitch password");
					//			docsUpdate(true, false);
								// insert password
					//			exec('screen -S tm-' + authorid + ' -X stuff "' + pass + '\015"', function (ee, sout, serr) {
					//				console.info("injecting password");
					//				message.channel.sendTyping();
					//				setTimeout(() => {
					//					return finalizing2();
					//				}, 1500);
					//			});
							} else if (stdout.includes("Loading data for")) {
								console.info("stdout.includes Loading data for");
								// prefilled pw / cookies
								docsUpdate(true, true);
								return message.channel.send("Found a matching password or cookies file in my storage...\nAuthorization complete, it is running now.");
							} else {
								console.log("How did we get here? -\n" + stdout);
								return message.reply("How did we get here? Something must be broken, report this to Pawele. *(Although I'm not entirely sure if he'll be able to help)*");
							}
						});
					}, 1500);
				});
			}
			/*
			function finalizing2() {
				console.info("finalizing2");
				exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 8 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
					console.info("prompted a hardcopy:");
					if (stdout) console.log(stdout);
					if (err) {
						docsUpdate(false, false);
						console.log("finalizing2 hardcopy -\n" + err + stdout);
						return message.channel.send("Session failed after I entered the password. Possible reasons:\n- You provided wrong password\n- Twitch is just ratelimiting us (try again after 24 hours)\n- Something else is fucked up, mesage Pawele and he will look into it.");
					}
					if (stdout.includes("Console login unavailable")) {
						console.info("stdout.includes Console login unavailable");
						if (stdout.includes("Use a VPN or wait")) {
							fs.unlink('./twitchminers/cookies/' + docs[0].tmusername + '.pkl', () => true);
							docsUpdate(false, false);
							exec("screen -S tm-" + authorid + " -X stuff $'\003'");
							return message.reply("Seems like we're getting rate-limited.\nEither wait some time and try again, or message Pawele and he will tell you how to generate the cookies file yourself.");
						}
						docsUpdate(false, false);
						exec("screen -S tm-" + authorid + " -X stuff $'\003'");
						return message.reply("Console login is currently unavailable. That means either twitch changed some shit on their side, or we are just getting ratelimited.\nIn case it is just a ratelimit, message Pawele. He will tell you how to generate the cookies file yourself.");
					}
					if (stdout.includes("2FA token:")) {
						console.info("stdout.includes Two factor authentication");
						message.reply("Two factor authentication (2FA) code required! You can find it in your 2FA Auth app.\nTo submit the 2FA code, **just type it as a normal message to me** (no command, no prefix, just those 6 numbers). I'll be listening for the next 5 minutes.");
						console.info("going to finalizing3");
						return finalizing3();
					}
					if (stdout.includes("Please enter the 6-digit")) {
						console.info("stdout.includes Email Verification code required");
						exec(`tac ./twitchminers/templogs/${authorid}.log | grep -m 1 '[[:blank:]]'`, function (err, emailread, stderr) {
							// Please enter the 6-digit code sent to g****@s***.cz:
							const prepEmail = emailread.split(":");
							const emailcens = prepEmail[0].replace("Please enter the 6-digit code sent to ", "");
							message.reply("Login Verification code required! Please enter the 6-digit code sent to " + emailcens + "\nTo submit the 2FA code, **just type it as a normal message to me** (no command, no prefix, just those 6 numbers). I'll be listening for the next 5 minutes.");
							return finalizing3();
						});
					}
					if (stdout.includes("Invalid username or password")) {
						console.info("stdout.includes Invalid username or password");
						docsUpdate(false, false);
						exec("screen -S tm-" + authorid + " -X stuff $'\003'");
						return message.reply("Invalid username or password. Please try again.");
					}
				});
			}
			*/

			/*
			function finalizing3() {
				console.info("finalizing3");
					// 2FA thing listener
				var twoFA = "";
				const filter = m => m.author.id === authorid;
				const collector = message.channel.createMessageCollector({ filter, time: 300000 });
				collector.on('collect', m => {
					console.info("collector triggered");
					if (!m.content.startsWith("..twitch ")) {
						if (isNaN(m)) message.channel.send("That is not a valid number!");
						else twoFA = m.content;
						collector.stop();
					}
				});

				collector.on('end', c => {
					console.info("collector ends");
					if (twoFA === "") {
						docsUpdate(false, false);
						exec("screen -S tm-" + authorid + " -X stuff $'\003'");
						return message.channel.send("No valid 2FA verification code provided for the past 5 minutes, exiting...");
					}
					exec('screen -S tm-' + authorid + ' -X stuff "' + twoFA + '\015"');
					return waitcheck();
				});
			}
			*/

			function waitcheck() {
				console.info("waitcheck");
				setTimeout(() => {
					message.channel.sendTyping();
					exec(`screen -S tm-${authorid} -X hardcopy "./templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 9 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
						if (stdout) console.info(stdout);
						// with the old password approach this shouldn't happen
					//	if (err) {
					//		console.log("finalizing3 hardcopy -\n" + err);
					//		return message.channel.send("Something fucked up, contact Pawele, he will look into it.");
					//	}
						if (err) {
							console.log("f3 err triggered, bad username?\n" + err);
							return message.channel.send("Twitch miner crashed. Are you sure you authorized with the right account?\nYou can try again to make sure or contact Pawele for help.");
						}
						if (stdout.includes("automatic temporary ban") || stdout.includes("Use a VPN")) {
								// message.channel.send("It seems we got automatically temporarily banned from trying to log in. This happens when you incorrectly submit your 2FA a few times.\n**Don't worry, it is only temporary**. Try again tomorrow.");
							message.channel.send("It seems we got automatically temporarily banned from trying to log in. This happens sometimes.\n**Don't worry, it is only temporary**. Try again tomorrow.");
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
							return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
						}
					//	if (stdout.includes("Invalid Login") || stdout.includes("Invalid two factor")) {
					//		message.channel.send("Invalid 2FA verification code, please try again.");
					//		return finalizing3();
					//	}
						return waitcheck();
					});
				}, 2000);
			}

			function docsUpdate(runValue, pwValue) {
				// docsUpdate(tmrunning, tmpassworded);
				tmmachines.update({ tmowner: message.author.id }, { $set: { tmrunning: runValue, tmpassworded: pwValue } });
			}
		});
	},
};