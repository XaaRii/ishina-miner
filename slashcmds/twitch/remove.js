const prefix = require("../.cfg.json").prefix;
const { tmmachines, tmvictimlist } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: "remove",
	async execute(interaction) {
		const embed = new EmbedBuilder().setColor('ffbf00');
		tmmachines.find({ tmowner: interaction.user.id }, function (err, docs) {
			if (docs.length < 1) return interaction.reply("Sorry, but you don't own any miner. Though, you can register one using `" + prefix + "create <username>`");
			const streamers = interaction.options.getString({ name: streamers });
			if (!streamers) return interaction.reply("Who you wanna remove? (check out /twitch list)");
			var newlyDeleted = [], currlist = [], description = [];
			const al = streamers.join(" ").replace(/\r?\n|\r/g, " ").trim().split(" ").filter(e => e);

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
				if (n < al.length) {
					if (!currlist.includes(al[n].toLowerCase())) return runRemoveNames((n + 1));

					tmvictimlist.remove({ tmusername: docs[0].tmusername, tmvictim: al[n].toLowerCase() }, function (err) {
						if (err) return interaction.reply("Error happened!", err);
					});

					newlyDeleted.push(al[n]);
					currlist = currlist.filter(e => e !== al[n].toLowerCase());
					return runRemoveNames((n + 1));
				}

				if (newlyDeleted.length) description.push("Successfully removed `" + newlyDeleted.join("`, `") + "`");
				else description.push("No valid changes, the list stays the same.");

				if (docs[0].tmrunning) newlyDeleted.length ? description.push("\n\n**Changes are pending. To apply them, please restart your miner.** (`/twitch restart`)") : newlyDeleted = [];
				else if (docs[0].tmpassworded) description.push("\n\n**Friendly reminder: your twitch miner isn't running.** (You can start it with `/twitch start`)");
				else description.push("\n\n**Now all that's left is authorizing your miner (one-time process)** - `" + prefix + "auth`\nYou can do so even in DM's, so don't worry.");

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
