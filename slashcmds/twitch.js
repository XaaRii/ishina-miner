const { SlashCommandBuilder, Collection } = require('discord.js'),
	fs = require("fs");
// Slash commands init
const subCommands = new Collection();
const subFiles = fs.readdirSync('./slashcmds/twitch').filter(file => file.endsWith('.js'));
for (const file of subFiles) {
	const command = require(`./twitch/${file}`);
	subCommands.set(command.name, command);
}
module.exports = {
	data: new SlashCommandBuilder()
		.setName('twitch')
		.setDescription('Twitch miner module!')
		.addSubcommand(subcommand => subcommand
			.setName('prime')
			.setDescription('Check out current offers on Twitch Prime.'),
		)
		.addSubcommand(subcommand => subcommand
			.setName('create')
			.setDescription('Register your own twitch miner!')
			.addStringOption(option =>
				option.setName('username')
					.setDescription('your twitch username')
					.setRequired(true),
			),
		)
		.addSubcommand(subcommand => subcommand
			.setName('destroy')
			.setDescription('Unregister your twitch miner.')
			.addStringOption(option =>
				option.setName('confirm')
					.setDescription('put your twitch username here to confirm')
					.setRequired(false),
			),
		)
		.addSubcommand(subcommand => subcommand
			.setName('auth')
			.setDescription('Authorize your twitch miner.'),
		)
		.addSubcommand(subcommand => subcommand
			.setName('start')
			.setDescription('Start your miner.'),
		)
		.addSubcommand(subcommand => subcommand
			.setName('restart')
			.setDescription('Restart your miner.'),
		)
		.addSubcommand(subcommand => subcommand
			.setName('stop')
			.setDescription('Stop your miner.'),
		)
		.addSubcommand(subcommand => subcommand
			.setName('view')
			.setDescription('View latest output from your miner.'),
		)
		.addSubcommand(subcommand => subcommand
			.setName('status')
			.setDescription('Status of your miner.'),
		)
		.addSubcommand(subcommand => subcommand
			.setName('add')
			.setDescription('Adds new streamer(s) to mine at.')
			.addStringOption(option =>
				option.setName('streamers')
					.setDescription('streamer usernames - example: streamer1 streamer2 streamer3')
					.setRequired(true),
			)
			.addStringOption(option =>
				option.setName('comment')
					.setDescription('optional comment')
					.setRequired(false),
			),
		)
		.addSubcommand(subcommand => subcommand
			.setName('remove')
			.setDescription('Removes streamer(s) from mining list.')
			.addStringOption(option =>
				option.setName('streamers')
					.setDescription('streamer usernames - example: streamer1 streamer2 streamer3')
					.setRequired(true),
			),
		)
		.addSubcommand(subcommand => subcommand
			.setName('list')
			.setDescription('Check the list of streamers where you mine.'),
		),
	async execute(interaction) {
		const command = subCommands.get(interaction.options.getSubcommand({ required: false }));
		if (!command) return;
		try {
			command.execute(interaction);
		} catch (error) {
			console.error(error);
			interaction.followUp({
				content: 'There was an error trying to execute that subcommand:\n' + error, ephemeral: true,
			});
		}
	},
};
