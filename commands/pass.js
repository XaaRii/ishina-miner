const config = require("../.cfg.json");
const prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs'); const ms = require('ms');
const { exec } = require('child_process');

module.exports = {
	name: 'pass',
	description: 'Submit the password so your miner can log in and start mining.',
	usage: '<pass>',
	showHelp: true,
	execute(message, args) {
		const pass = args.join(/ +/);
		// message.delete().catch(O_o => { });

		const embed = new EmbedBuilder().setColor('ffbf00');

		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (docs[0].tmpassworded) return message.reply("You don't have to fill in the password again. It was already accepted.");
			if (!args[0]) return message.reply("If you won't pass me any password, i can't log in!");
			if (docs[0].tmrunning) return message.reply("Please do not use this command, just type the numbers alone."); // idk may change

			message.channel.sendTyping();
			const authorid = docs[0].tmowner;

			// rebuild the runPy
			var victlist = ['twitch_miner.mine(', '    ['];
			tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
				return runFileBuild(victlist, 0, d);
			});

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
				console.info("started finalizing");
				exec(`screen -S tm-${authorid} -d -m python ./twitchminers/run${authorid}.py`, function (err, stdout, stderr) {
					console.info("started a new screen");
					if (err) console.log(err);
					setTimeout(() => {
						console.info("timeout callback starts");
						exec(`screen -S tm-${authorid} -X hardcopy "./twitchminers/templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 5 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
							console.info("prompted a hardcopy:");
							if (stdout) console.log(stdout);
							if (err) {
								console.log("finalizing1 hardcopy -\n" + err);
								return message.channel.send("Something fucked up, contact Pawele, he will look into it.");
							}
							console.info("no errors so far");
							if (stdout.includes("Enter Twitch password")) {
								console.info("stdout.includes Enter Twitch password");
								docs[0].tmrunning = true; docs[0].tmpassworded = false;

								// insert password
								exec('screen -S tm-' + authorid + ' -X stuff "' + pass + '\015"', function(ee, sout, serr) {
									console.info("injecting password");
									message.channel.sendTyping();
									setTimeout(() => {
										console.info("going to finalizing2");
										return finalizing2();
									}, 1500);
								});
							} else if (stdout.includes("Loading data for")) {
								console.info("stdout.includes Loading data for");
								// prefilled pw / cookies
								docs[0].tmrunning = true; docs[0].tmpassworded = true;
								return message.channel.send("Found a matching password or cookies file in my storage...\nAuthorization complete, it is running now.");
							} else {
								console.log("How did we get here? -\n" + stdout);
								return message.reply("How did we get here? Something must be broken, report this to Pawele. *(Although I'm not entirely sure if he'll be able to help)*");
							}
						});
					}, 1500);
				});
			}
			function finalizing2() {
				console.info("started finalizing2");
				exec(`screen -S tm-${authorid} -X hardcopy "~/twitchminers/templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 2 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
					console.info("prompted a hardcopy:");
					if (stdout) console.log(stdout);
					if (err) {
						console.log("finalizing2 hardcopy -\n" + err);
						return message.channel.send("Something fucked up, contact Pawele, he will look into it.");
					}
					console.info("past err");
					if (stdout.includes("Console login unavailable")) {
						console.info("stdout.includes Console login unavailable");
						docs[0].running = false;
						exec("screen -S tm-" + authorid + " -X stuff $'\003'");
						return message.reply("Console login is currently unavailable. That means either twitch changed some shit on their side, or we are just getting ratelimited.\nIn case it is just a ratelimit, message Pawele. He will tell you how to generate the cookies file yourself.");
					}
					if (stdout.includes("Login Verification code required")) {
						console.info("stdout.includes Login Verification code required");
						message.reply("Login Verification code (2FA) required! Check your email (or Auth app if you have That thing set up)\nTo submit the 2FA code, **just type it as a normal message to me** (no command, no prefix, just those 6 numbers). I'll be listening for the next 5 minutes.");
						console.info("going to finalizing3");
						return finalizing3();
					}
					if (stdout.includes("Invalid username or password")) {
						console.info("stdout.includes Invalid username or password");
						docs[0].running = false;
						exec("screen -S tm-" + authorid + " -X stuff $'\003'");
						return message.reply("Invalid username or password. Please try again.");
					}
				});

				function finalizing3() {
					console.info("started finalizing3");
					// 2FA thing listener
					var twoFA = "";
					const filter = m => m.author.id === authorid;
					const collector = message.channel.createMessageCollector({ filter, time: 300000 });
					collector.on('collect', m => {
						console.info("collect triggered");
						if (m.startsWith("..twitch ")); // ignore
						else if (isNaN(m)) message.channel.send("That is not a valid number!");
						else twoFA = m;
						collector.stop();
					});

					collector.on('end', c => {
						console.info("collect end triggered");
						if (twoFA === "") {
							docs[0].running = false;
							exec("screen -S tm-" + authorid + " -X stuff $'\003'");
							return message.channel.send("No valid 2FA verification code provided for the past 5 minutes, exiting...");
						}
						exec('screen -S tm-' + authorid + ' -X stuff "' + twoFA + '\015"');
						return waitcheck();
					});
				}

				function waitcheck() {
					console.info("waitcheck");
					setTimeout(() => {
						exec(`screen -S tm-${authorid} -X hardcopy "~/twitchminers/templogs/${authorid}.log" && sleep 1 && tac ./twitchminers/templogs/${authorid}.log | grep -m 4 '[[:blank:]]' | tac`, function (err, stdout, stderr) {
							if (err) {
								console.log("finalizing3 hardcopy -\n" + err);
								return message.channel.send("Something fucked up, contact Pawele, he will look into it.");
							}
							if (stdout.includes("Invalid Login") || stdout.includes("Invalid two factor")) {
								message.channel.send("Invalid 2FA verification code, please try again.");
								return finalizing3();
							}
							if (stdout.includes("Loading data for")) {
								docs[0].tmpassworded = true;
								embed.setTitle(docs[0].tmusername + "'s miner")
									.setFields([{
										name: "Logged in successfully!", value: "Authorization complete, your miner will now start.", inline: false,
									}])
									.setTimestamp()
									.setFooter({ text: `Need help? type ${prefix}help (command)!` });
								return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
							}
						});
					}, 1500);
				}
			}
		});
	},
};