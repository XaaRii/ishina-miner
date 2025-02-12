const prefix = require("../../.cfg.json").prefix;
var { tmmachines } = require('../../exports.js');
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
	name: "create",
	async execute(interaction) {
		tmmachines.find({ tmowner: interaction.user.id }, function (err, docs) {
			if (docs.length > 0) return interaction.reply("Sorry, but you already have one. If you wanna replace it, i suggest using `/twitch destroy` command");
			const urname = interaction.options.getString('username');
			if (!/^[a-zA-Z0-9_]{4,25}$/.test(urname)) return interaction.reply(`'${urname}' is not a twitch-supported username`);
			var arg0 = urname.toLowerCase();
			var rTMmachine = {
				"tmowner": interaction.user.id,
				"tmusername": arg0,
				"tmpassworded": false,
				"tmrunning": false,
			};
			tmmachines.find({ tmusername: arg0 }, function (err, d) {
				if (d.length > 0) return interaction.reply("Sorry, but this username is already registered.");
				tmmachines.insert(rTMmachine, function (err, d) {
					if (err) return interaction.channel.send("Error happened!", err);

					const templatefile = fs.readFileSync('./twitchminers/runDefault.py', 'utf8').split("usernamegoeshere");
					if (!templatefile) return interaction.reply("The template file is corrupted... please report this to Pawele.");

					fs.writeFileSync('./twitchminers/run' + interaction.user.id + '.py', templatefile[0] + arg0 + templatefile[1], 'utf8');
				});

				const embed = new EmbedBuilder()
					.setColor('ffbf00')
					.setTitle(arg0 + "'s miner")
					.setDescription("Miner registered, but it's inactive.\nWhat to do now?")
					.addFields([
						{
							name: "Add usernames to mine points and drops on", value: "`/twitch add (#one_word_comment) <username> (username) ...`", inline: false,
						},
						{
							name: "Authorize your twitch miner", value: "You can do this in DM's using `/twitch auth`", inline: false,
						},
						{
							name: "And that's all!", value: "**__Other commands:__**\n`/twitch status` to check if it's running\n`/twitch start/stop/restart`\n`/twitch add/remove/list` for editing where you want to mine\n", inline: false,
						},
					])
					.setTimestamp();
				interaction.reply({ embeds: [embed] }).catch(e => { interaction.reply({ content: "something fucked up, " + e }); });
			});
		});
	},
};
