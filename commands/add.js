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
			var newlyJoined = [], currlist = [], comment = "", argslist = args, description = [];
			const al = argslist.join(" ");
			argslist = al.replace(/\r?\n|\r/g, " ").trim().split(" ").filter(e => e);
			console.log(argslist);
			if (argslist[0].startsWith("#")) {
				if (!argslist[1]) return message.reply("What streamers you wanna add under this comment?");
				comment = argslist[0].substring(1);
				argslist = argslist.slice(1);
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
					if (currlist.includes(argslist[n].toLowerCase())) return runAddNames((n + 1));
					// tmvictimlist.find({ tmusername: docs[0].tmusername, tmvictim: argslist[n].toLowerCase() }, function (err, doc) {
					// 	if (doc.tmcomment === comment) return runAddNames((n + 1));
					// 	tmvictimlist.remove({ _id: doc._id }, function (err) { if (err) return message.channel.send("Error happened!", err); });
					// 	tmvictimlist.insert({
					// 		"tmusername": docs[0].tmusername,
					// 		"tmvictim": argslist[n].toLowerCase(),
					// 		"tmcomment": comment,
					// 	}, function (err) { if (err) return message.channel.send("Error happened!", err); });
					// 	newlyJoined.push(argslist[n] + " (comment updated)");

					tmvictimlist.insert({
						"tmusername": docs[0].tmusername,
						"tmvictim": argslist[n].toLowerCase(),
						"tmcomment": comment,
					}, function (err) { if (err) return message.channel.send("Error happened!", err); });

					newlyJoined.push(argslist[n]);
					currlist.push(argslist[n].toLowerCase());
					return runAddNames((n + 1));
				}

				if (newlyJoined.length) {
					description.push("Successfully added `" + newlyJoined.join("`, `") + "`");
					if (comment !== "") description.push(" with comment: " + comment);
				} else description.push("No valid changes, the list stays the same.");

				if (docs[0].tmrunning) newlyJoined.length ? description.push("\n\n**Changes are pending. To apply them, please restart your miner.** (`" + prefix + "restart`)") : newlyJoined = [];
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