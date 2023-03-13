const prefix = require("../../.cfg.json").prefix;
var { tmmachines, tmvictimlist } = require('../../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const { exec } = require('child_process');

module.exports = {
	name: "destroy",
	async execute(interaction) {
		tmmachines.find({ tmowner: interaction.user.id }, function (err, docs) {
			if (docs.length < 1) return interaction.reply("Sorry, but you don't own any. Though, you can register one using `/twitch create <username>`");
			const confirmation = interaction.options.getString('confirm') ?? "";
			if (confirmation !== docs[0].tmusername) return interaction.reply(`Are you REALLY sure you want to DESTROY YOUR OWN twitch miner? If so, confirm it with \`${docs[0].tmusername}\` to proceed.`);

			if (docs[0].tmrunning) {
				exec("screen -S tm-" + docs[0].tmowner + " -X stuff $'\003'");
			}
			fs.unlink('./twitchminers/run' + interaction.user.id + '.py', () => true);
			fs.unlink('./twitchminers/cookies/' + docs[0].tmusername + '.pkl', () => true);

			tmmachines.remove({ _id: docs[0]._id });
			tmvictimlist.remove({ tmusername: docs[0].tmusername }, { multi: true });

			const embed = new EmbedBuilder()
				.setColor('074e3e')
				.setTitle(docs[0].tmusername + "'s miner")
				.setDescription("Miner destroyed successfully.")
				.setTimestamp()
				.setFooter({ text: `Need help? type ${prefix}help (command)!` });
			interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
		});
	},
};
