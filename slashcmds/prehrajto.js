const { SlashCommandBuilder, EmbedBuilder } = require('discord.js'),
	fs = require("fs"),
	{ spawn } = require('child_process');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('prehrajto')
		.setDescription('Quickly get the video!')
		.addStringOption(option =>
			option.setName('query')
				.setDescription('What to search for?')
				.setRequired(true),
		),
	async execute(interaction) {
		const query = interaction.options.getString('query'), chunks = [];
		await interaction.deferReply();
		const pythonProcess = spawn('python', [`../checkers/prehrajto.py "${query}"`]);
		const embed = new EmbedBuilder().setColor('43ea46');

		pythonProcess.stdout.on('data', chunk => chunks.push(chunk));
		pythonProcess.stdout.on('end', () => {
			const data = Buffer.concat(chunks).toString();
			if (data.startsWith("http")) {
				embed.setTitle("Video found!")
					.setDescription(data)
					.setTimestamp()
					.setFooter({ text: `Have fun!` });
				return interaction.followUp({ embeds: [embed] }).catch(e => { interaction.followUp({ content: "something fucked up, " + e }); });
			} else {
				console.log("prehrajto dump log:\n" + data);
				embed.setTitle("Well, this is awkward...")
					.setDescription("I'm not sure where the fault is, but i didn't get any hyperlinks...\nMessage Pawele and he'll look into it.")
					.setTimestamp()
					.setColor('e82e2e');
				return interaction.followUp({ embeds: [embed] }).catch(e => { interaction.followUp({ content: "something fucked up, " + e }); });
			}
		});
	},
};
