const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
	name: 'destroy',
	description: 'Unregister your twitch miner.',
	aliases: ['unregister'],
	showHelp: true,
	execute(message, args) {
		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any. Though, you can register one using `" + prefix + "create <username>`");
			if (args[0] !== "confirm") return message.reply("Are you REALLY sure you want to DESTROY YOUR OWN twitch miner? type `" + prefix + "destroy confirm` to proceed.");

			if (docs[0].tmrunning) {
				exec("screen -S tm-" + docs[0].tmowner + " -X stuff $'\003'");
			}
			fs.unlink('./twitchminers/run' + message.author.id + '.py', () => true);
			fs.unlink('./twitchminers/cookies/' + docs[0].tmusername + '.pkl', () => true);

			tmmachines.remove({ _id: docs[0]._id });
			tmvictimlist.remove({ tmusername: docs[0].tmusername }, { multi: true });

			const embed = new EmbedBuilder()
				.setColor('074e3e')
				.setTitle(docs[0].tmusername + "'s miner")
				.setDescription("Miner destroyed successfully.")
				.setTimestamp()
				.setFooter({ text: `Need help? type ${prefix}help (command)!` });
			message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
		});
	},
};