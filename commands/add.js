const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'add',
	description: 'Adds new locations to mine in. You can even add multiple in one message.',
	usage: '(#one_word_comment) <streamer username> (streamer username) ...',
	showHelp: true,
	execute(message, args) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		tmmachines.find({ tmowner: message.author.id }, function (err, docs) {
			if (err) console.log(err);
			if (docs.length < 1) return message.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			if (!args[0]) return message.reply("What streamers you wanna add?");

			var newlyJoined = [], currlist = [], comment = "", argslist = args.join(" ").split("\n").trim();
			console.log(argslist);
			if (argslist[0].startsWith("#")) {
				if (!argslist[1]) return message.reply("What streamers you wanna add under this comment?");
				comment = argslist[0].substring(1);
				argslist.slice(1);
			}

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
				if (n < argslist.length) {
					if (currlist.includes(argslist[n].toLowerCase())) {
						tmvictimlist.find({ tmusername: docs[0].tmusername, tmvictim: argslist[n].toLowerCase() }, function (err, doc) {
							if (doc.tmcomment === comment) return runAddNames((n + 1));
							tmvictimlist.update({ tmusername: docs[0].tmusername, tmvictim: argslist[n].toLowerCase() }, { $set: { tmcomment: comment } }, {}, function(err, nou) {
								newlyJoined.push(argslist[n] + " (comment updated)");
								return runAddNames((n + 1));
							});
						});
					}
					newlyJoined.push(argslist[n]);

					tmvictimlist.insert({
						"tmusername": docs[0].tmusername,
						"tmvictim": argslist[n].toLowerCase(),
						"tmcomment": comment,
					}, function (err) { if (err) return message.channel.send("Error happened!", err); });

					currlist.push(argslist[n].toLowerCase());
					return runAddNames((n + 1));
				}

				var description = ["Successfully added " + newlyJoined.join(", ")];
				if (comment !== "") description.push(" with comment: " + comment);
				if (docs[0].tmrunning) description.push("\n\n**Changes are pending. To apply them, please restart your miner.** (`" + prefix + "restart`)");
				else if (docs[0].tmpassworded) description.push("\n\n**Friendly reminder: your twitch miner isn't running.** (You can start it with `" + prefix + "start`)");
				else description.push("\n\n**Now all that's left is submitting the password so your miner can log in (one-time process)** - `" + prefix + "pass <password>`\nYou can do so in DM's, so don't worry.");

				embed.setTitle(docs[0].tmusername + "'s miner")
					.setDescription(description.join(""))
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
			}
		});
	},
};