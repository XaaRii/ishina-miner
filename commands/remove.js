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
			var newlyDeleted = [], currlist = [], argslist = args, description = [];
			const al = argslist.join(" ");
			argslist = al.replace(/\r?\n|\r/g, " ").trim().split(" ").filter(e => e);

			tmvictimlist.find({ tmusername: docs[0].tmusername }, function (err, d) {
				if (d.length < 1) {
					description.push("You don't have any streamers added. There is nothing to remove.");
					return sendmessage();
				}
				return runListBuild(0, d);
			});
			function runListBuild(n, d) {
				if (n < d.length) {
					currlist.push(d[n].tmvictim.toLowerCase());
					return runListBuild((n + 1), d);
				}
				return runRemoveNames(0);
			}

			function runRemoveNames(n) {
				if (n < argslist.length) {
					if (!currlist.includes(argslist[n].toLowerCase())) return runRemoveNames((n + 1));

					tmvictimlist.remove({ tmusername: docs[0].tmusername, tmvictim: argslist[n].toLowerCase() }, function (err) {
						if (err) return message.channel.send("Error happened!", err);
					});

					newlyDeleted.push(argslist[n]);
					currlist = currlist.filter(e => e !== argslist[n].toLowerCase());
					return runRemoveNames((n + 1));
				}

				if (newlyDeleted.length) description.push("Successfully removed `" + newlyDeleted.join("`, `") + "`");
				else description.push("No valid changes, the list stays the same.");

				if (docs[0].tmrunning) newlyDeleted.length ? description.push("\n\n**Changes are pending. To apply them, please restart your miner.** (`" + prefix + "restart`)") : newlyDeleted = [];
				else if (docs[0].tmpassworded) description.push("\n\n**Friendly reminder: your twitch miner isn't running.** (You can start it with `" + prefix + "start`)");
				else description.push("\n\n**Now all that's left is submitting the password so your miner can log in (one-time process)** - `" + prefix + "pass <password>`\nYou can do so in DM's, so don't worry.");

				return sendmessage();
			}
			function sendmessage() {
				embed.setTitle(docs[0].tmusername + "'s miner")
					.setDescription(description.join(""))
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				return message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			}
		});
	},
};