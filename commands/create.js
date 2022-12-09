const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
	name: 'create',
	description: 'Register your own twitch miner!',
	aliases: ['register'],
	usage: '<username>',
	showHelp: true,
	execute(message, args) {
		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length > 0) return message.reply("Sorry, but you already have one. If you wanna replace it, i suggest using `" + prefix + "destroy` command");
			if (!args[0]) return message.reply("Missing argument: username");
			if (args[1]) return message.reply("Was that a typo? twitch usernames don't have spaces.");
			if (!/^[a-zA-Z0-9_]{4,25}$/.test(args[0])) return message.reply(`'${args[0]}' is not a twitch-supported username`);
			var arg0 = args[0].toLowerCase();
			var rTMmachine = {
				"tmowner": message.author.id,
				"tmusername": arg0,
				"tmpassworded": false,
				"tmrunning": false,
			};
			tmmachines.find({ tmusername: arg0 }, function (err, d) {
				if (d.length > 0) return message.reply("Sorry, but this username is already registered.");
				tmmachines.insert(rTMmachine, function (err, d) {
					if (err) return message.channel.send("Error happened!", err);

					const templatefile = fs.readFileSync('./twitchminers/runDefault.py', 'utf8').split("usernamegoeshere");
					if (!templatefile) return message.reply("The template file is corrupted... please report this to Pawele.");

					fs.writeFileSync('./twitchminers/run' + message.author.id + '.py', templatefile[0] + arg0 + templatefile[1], 'utf8');
				});

				const embed = new EmbedBuilder()
					.setColor('ffbf00')
					.setTitle(arg0 + "'s miner")
					.setDescription("Miner registered, but it's inactive.\nWhat to do now?")
					.addFields([
						{
							name: "Add usernames to mine points and drops on", value: "`" + prefix + "add (#one_word_comment) <username> (username) ...`", inline: false,
						},
						{
							name: "Submit your password (so your miner can log in)", value: "You can do this in DM's using `" + prefix + "pass <password>`", inline: false,
						},
						{
							name: "And that's all!", value: "**__Other commands:__**\n`" + prefix + "status` to check if it's running\n`" + prefix + "start/stop/restart`\n`" + prefix + "add/remove/list` for editing where you want to mine\n", inline: false,
						},
					])
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			});
		});
	},
};