const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'remove',
	description: 'Removes locations from mining list. You can even remove multiple from one message.',
	usage: '<twitch username> (twitch username) ...',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (!args[0]) return message.reply("Who you wanna remove? (check out " + prefix + "list)");

			var argslist = args.split("\n").trim();
			for (let i = 0; i < argslist.length; i++) {
				tmvictimlist.remove({ tmusername: docs[0].tmusername, tmvictim: argslist[i].toLowerCase() }, function (err) {
					if (err) return message.channel.send("Error happened!", err);
				});
			}
			embed.setTitle(docs[0].tmusername + "'s miner")
				.setTimestamp()
				.setFooter({ text: `Need help? type ${prefix}help (command)!` });
			if (docs[0].tmrunning) embed.setDescription("Successfully removed " + argslist.join(", ") + "\n\n**Changes are pending. To apply them, please restart your miner.** (`" + prefix + "restart`)");
			else if (docs[0].tmpassworded) embed.setDescription("Successfully removed " + argslist.join(", ") + "\n\n**Friendly reminder: your twitch miner isn't running.** (You can start it with `" + prefix + "start`)");
			else embed.setDescription("Successfully removed " + argslist.join(", ") + "\n\n**Now all that's left is submitting the password so your miner can log in (one-time process)**\nYou can do so in DM's, so don't worry.");
			message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
		});
	},
};