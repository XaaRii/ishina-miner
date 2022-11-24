const config = require("../.cfg.json");
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'admin',
	description: 'Admin command: modify database',
	usage: '<userid> <owner/username/passworded/running/list> (value)/(reset/view) ...',
	showHelp: false,
	execute(message, args) {
		if (!args[0]) return message.reply("1: userid?");
		if (!args[1]) return message.reply("2: owner/username/passworded/running/list?");
		if (!args[2]) {
			if (args[1] !== "list") return message.reply("3: value?");
			else return message.reply("3: reset/view?");
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
							return runListBuild(victlist, 0, d, embed, docs[0].tmusername);
						});
					} else return message.reply("Wrong 3rd arg. reset/view?");
					if (err) return message.channel.send("error:\n" + err);
					return message.channel.send("Done.");
				});
				break;
			default:
				return message.reply("Wrong 2nd argument. owner/username/passworded/running/list?");
		}
		function runListBuild(victlist, n, d, embed, tmusername) {
			if (n < d.length) {
				if (d[n].tmcomment !== "") victlist.push(`'${d[n].tmvictim}' (${d[n].tmcomment})`);
				else victlist.push(`'${d[n].tmvictim}'`);
				return runListBuild(victlist, (n + 1), d, embed, tmusername);
			}
			const vlready = victlist.join("\n");
			embed.setTitle(tmusername + "'s miner")
				.addFields([{
					name: `The list of usernames your miner mines on:`, value: vlready, inline: false,
				}])
				.setTimestamp();
			message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
		}
	},
};