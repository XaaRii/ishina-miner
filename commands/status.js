const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const { exec } = require('child_process');

module.exports = {
	name: 'status',
	description: 'Status of your miner.',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('43ea46');
		if (args[0] && message.author.id === config.xaari) message.author.id = args[0];

		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			message.channel.sendTyping();
			exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
				const runningTM = stdout.split("\n");
				const authorid = docs[0].tmowner;
				if (runningTM.includes(authorid)) embed.setDescription("Your twitch miner is running.").setColor('43ea46');
				else embed.setDescription("Your twitch miner is not running.").setColor('e82e2e');

				if (!docs[0].tmpassworded) {embed.addFields([{
					name: `Attention!`, value: "Your miner is missing cookies file. Please use `" + prefix + "auth` to finish the setup", inline: false,
				}]);}

				embed.setTitle(docs[0].tmusername + "'s miner")
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			});
		});
	},
};