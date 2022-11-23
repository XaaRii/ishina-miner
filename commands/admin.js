const config = require("../.cfg.json");
var { tmmachines } = require('../exports.js');

module.exports = {
	name: 'admin',
	description: 'Admin command: modify database',
	usage: '<userid> <owner/username/passworded/running> (value) ...',
	showHelp: false,
	execute(message, args) {
		if (!args[0]) return message.reply("1: userid?");
		if (!args[1]) return message.reply("2: owner/username/passworded/running?");
		if (!args[2]) return message.reply("3: value?");
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
				tmmachines.update({ tmowner: args[0] }, { $set: { tmpassworded: args[2] } }, {}, function (err, n) {
					if (err) return message.channel.send("error:\n" + err);
					return message.channel.send("Done.");
				});
				break;
			case "running":
				tmmachines.update({ tmowner: args[0] }, { $set: { tmrunning: args[2] } }, {}, function (err, n) {
					if (err) return message.channel.send("error:\n" + err);
					return message.channel.send("Done.");
				});
				break;
			default:
				return message.reply("Wrong 2nd argument. owner/username/passworded/running?");
		}
	},
};