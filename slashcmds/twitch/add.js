const prefix = require("../../.cfg.json").prefix;
const { tmmachines, tmvictimlist } = require('../../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: "add",
	async execute(interaction) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		tmmachines.find({ tmowner: interaction.user.id }, function (err, docs) {
			if (docs.length < 1) return interaction.reply("Sorry, but you don't own any miner. Though, you can register one using `/twitch create <username>`");
			const streamers = interaction.options.getString('streamers'), comment = interaction.options.getString('comment') ?? undefined;
			if (!streamers) return interaction.reply("What streamers you wanna add?");
			var newlyJoined = [], currlist = [], description = [];
			const al = streamers.replace(/\r?\n|\r/g, " ").trim().split(" ").filter(e => e);

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
				if (n < al.length) {
					if (currlist.includes(al[n].toLowerCase())) return runAddNames((n + 1));
					tmvictimlist.insert({
						"tmusername": docs[0].tmusername,
						"tmvictim": al[n].toLowerCase(),
						"tmcomment": comment,
					}, function (err) { if (err) return interaction.reply("Error happened!", err); });

					newlyJoined.push(al[n]);
					currlist.push(al[n].toLowerCase());
					return runAddNames((n + 1));
				}

				if (newlyJoined.length) {
					description.push("Successfully added `" + newlyJoined.join("`, `") + "`");
					if (comment !== undefined) description.push(" with comment: " + comment);
				} else description.push("No valid changes, the list stays the same.");

				const withRestart = interaction.options.getBoolean('restart') ?? false;
				if (!withRestart) {
					if (docs[0].tmrunning) newlyJoined.length ? description.push("\n\n**Changes are pending. To apply them, please restart your miner.** (`/twitch restart`)") : newlyJoined = [];
					else if (docs[0].tmpassworded) description.push("\n\n**Friendly reminder: your twitch miner isn't running.** (You can start it with `/twitch start`)");
					else description.push("\n\n**Now all that's left is authorizing your miner (one-time process)** - `/twitch auth`\nYou can do so even in DM's, so don't worry.");
				}

				return sendmessage();
			}
			function sendmessage() {
				embed.setTitle(docs[0].tmusername + "'s miner")
					.setDescription(description.join(""))
					.setTimestamp()
					.setFooter({ text: `Need help? type ${prefix}help (command)!` });
				return interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
			}
		});
	},
};
