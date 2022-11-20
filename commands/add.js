const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'add',
	description: 'Adds new locations to mine in. You can even add multiple in one message.',
	usage: '<streamer username> (streamer username) ...',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (!args[0]) return message.reply("What streamers you wanna add?");
			var newlyJoined = [], currlist = [];

			tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
				if (d.length < 1) return runAddNames(0);
				return runListBuild(0, d);
			});
			function runListBuild(n, d) {
				if (n < d.length) {
					currlist.push(d[n].tmvictim.toLowerCase());
					return runListBuild((n + 1), d);
				}
				return runAddNames(0);
			}

			function runAddNames(n) {
				if (n < args.length) {
					if (currlist.includes(args[n].toLowerCase())) return runAddNames((n + 1));
					newlyJoined.push(args[n]);

					tmvictimlist.insert({
						"tmusername": docs[0].tmusername,
						"tmvictim": args[n].toLowerCase(),
					}, function (err) { if (err) return message.channel.send("Error happened!", err); });

					currlist.push(args[n].toLowerCase());
					return runAddNames((n + 1));
				}

				embed.setTitle(docs[0].tmusername + "'s miner")
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				if (docs[0].tmrunning) embed.setDescription("Successfully added " + newlyJoined.join(", ") + "\n\n**Changes are pending. To apply them, please restart your miner.** (`" + prefix + "restart`)");
				else if (docs[0].tmpassworded) embed.setDescription("Successfully added " + newlyJoined.join(", ") + "\n\n**Friendly reminder: your twitch miner isn't running.** (You can start it with `" + prefix + "start`)");
				else embed.setDescription("Successfully added " + newlyJoined.join(", ") + "\n\n**Now all that's left is submitting the password so your miner can log in (one-time process)**\nYou can do so in DM's, so don't worry.");
				message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			}
		});
	},
};