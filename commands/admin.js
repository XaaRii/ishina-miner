const { tmmachines, tmvictimlist, misc, client, splitLines } = require('../exports.js');
const { EmbedBuilder, escapeMarkdown } = require('discord.js');
const fs = require('fs');

module.exports = {
	name: 'admin',
	description: 'Admin command: modify database',
	usage: 'block/unblock/ <userid> <owner/username/passworded/running/list> (value)/(reset/view) ...',
	showHelp: false,
	execute(message, args) {
		if (!args[0]) return message.reply("1: userid? (or block/unblock)");
		if (args[0] === "block") {
			if (fs.existsSync("../passblocked")) return message.reply("already blocked");
			fs.writeFile('../passblocked', "blocked", function () {
				console.info("Block enabled");
				return message.reply("Block enabled");
			});
		}
		if (args[0] === "unblock") {
			if (!fs.existsSync("../passblocked")) return message.reply("already unblocked");
			const msg = args[1] ? args.slice(1).join(" ") : undefined;
			fs.unlink('../passblocked', function () {
				console.info("Block disabled");
				message.reply("Block disabled");
				misc.find({ passblock: { $exists: true } }, function (err, docs) {
					return sendiary(client, docs, 0, msg);
				});
			});
		}
		//	var rTMmachine = {
		//		"tmowner": message.author.id,
		//		"tmusername": arg0,
		//		"tmpassworded": false,
		//		"tmrunning": false,
		//	};
		switch (args[1]) {
			case "owner":
				tmmachines.update({ tmowner: args[0] }, { $set: { tmowner: args[2] } }, {}, function (err, n) {
					if (err) return message.channel.send("error:\n" + err);
					return message.channel.send("Done.");
				});
				break;
			case "username":
				tmmachines.update({ tmowner: args[0] }, { $set: { tmusername: args[2] } }, {}, function (err, n) {
					if (err) return message.channel.send("error:\n" + err);
					return message.channel.send("Done.");
				});
				break;
			case "passworded":
				if (args[2] === "true") args[2] = true;
				else if (args[2] === "false") args[2] = false;
				else return message.channel.send("only true/false is supported, you stupid");
				tmmachines.update({ tmowner: args[0] }, { $set: { tmpassworded: args[2] } }, {}, function (err, n) {
					if (err) return message.channel.send("error:\n" + err);
					return message.channel.send("Done.");
				});
				break;
			case "running":
				if (args[2] === "true") args[2] = true;
				else if (args[2] === "false") args[2] = false;
				else return message.channel.send("only true/false is supported, you stupid");
				tmmachines.update({ tmowner: args[0] }, { $set: { tmrunning: args[2] } }, {}, function (err, n) {
					if (err) return message.channel.send("error:\n" + err);
					return message.channel.send("Done.");
				});
				break;
			case "list":
				tmmachines.find({ tmowner: args[0] }, function (err, docs) {
					if (docs.length < 1) return message.reply("This guy has no miner");
					if (args[2] === "reset") {
						tmvictimlist.remove({ tmusername: docs[0].tmusername }, { multi: true }, function (e) {
							if (err) return message.channel.send("Error happened!", e);
						});
						return message.reply("Done");
					} else if (args[2] === "view") {
						var victlist = [];
						const embed = new EmbedBuilder().setColor('ffbf00');
						tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
							if (d.length < 1) {
								embed.setTitle(docs[0].tmusername + "'s miner")
									.setDescription("You didn't set any streamers to mine on yet!")
									.setTimestamp();
								return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
							}

							const groups = {};
							for (let i = 0; i < d.length; i++) {
								const streamer = d[i].tmvictim, comment = d[i].tmcomment === "" ? "none" : d[i].tmcomment;
								if (groups[comment]) groups[comment] += ', ' + streamer;
								else groups[comment] = streamer;
							}

							for (const group in groups) {
								if (group !== 'none') victlist.push(`${escapeMarkdown(group)}:\n\`\`\`\n${groups[group]}\`\`\``);
							}
							if (groups['none']) victlist.push(`No comment:\n\`\`\`\n${groups['none']}\`\`\``);

							const vlready = splitLines(victlist, 1020) ?? [];
							embed.setTitle(docs[0].tmusername + "'s miner")
								.setDescription("The list of streamers this miner mines on:")
								.setTimestamp();

							for (let i = 0; i < vlready.length; i++) {
								embed.addFields([{
									name: "⠀", value: vlready[i], inline: false,
								}]);
							}
							message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
						});
					} else return message.reply("Wrong 3rd arg. reset/view?");
					if (err) return message.channel.send("error:\n" + err);
				});
				break;
			default:
				tmmachines.find({ tmowner: args[0] }, function (err, docs) {
					if (docs.length < 1) return message.reply("No such user found. Check syntax?\n  usage: 'block/unblock/ <userid> <owner/username/passworded/running/list> (value)/(reset/view) ...'");
					return message.reply(`**Owner:** ${docs[0].tmowner}\n**Username:** ${docs[0].tmusername}\n**Passworded?** ${docs[0].tmpassworded}\n**Running?** ${docs[0].tmrunning}\nCheck 'list view' for streamer list`);
				});
		}
	},
};

function sendiary(client, docs, i, msg) {
	if (i < docs.length) {
		client.users.fetch(docs[i].who, false).then((user) => {
			msg ?
				user.send('Hi, I remember you trying to authenticate your twitch miner a while ago. Pawele fixed it and left a message:\n' + msg + '\n\nOnce you authenticate, your miner will be up and running. Have fun!')
				: user.send('Hi, I remember you trying to authenticate your twitch miner a while ago. Pawele looked into it and it should now be available again!\n\nOnce you authenticate, your miner will be up and running. Have fun!');
		});
		setTimeout(() => {
			return sendiary(client, docs, (i + 1), msg);
		}, 3000);
	} else return misc.remove({ passblock: { $exists: true } }, { multi: true });
}