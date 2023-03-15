const config = require("../.cfg.json");
var token = config.dcToken, appid = config.dcAppID;
const { REST, Routes } = require("discord.js");
const rest = new REST({ version: '10' }).setToken(token);

module.exports = {
	name: 'reloadslash',
	description: 'Reloads a slash command',
	aliases: ['rls'],
	usage: '<command you want to reload>',
	showHelp: false,
	async execute(message, args) {
		if (message.author.id !== config.xaari) return;
		if (!args.length) return message.reply("I don't know what command you wanna reload!");
		if (!["g", "l", "n"].some(v => args[1].includes(v))) return message.reply("g/l/n ?");
		message.channel.sendTyping();
		const commandName = args[0].toLowerCase();
		const command = message.client.slashCollection.get(commandName);
		if (!command) return message.channel.send(`That's not a command I would know, ${message.author}!`);

		await delete require.cache[require.resolve(`../slashcmds/${commandName}.js`)];

		try {
			const newCommand = require(`../slashcmds/${commandName}.js`);
			message.client.slashCollection.set(newCommand.data.name, newCommand);
			if (args[1] === "g") await rest.post(Routes.applicationCommands(appid), { body: command.data.toJSON() });
			if (args[1] === "l") await rest.post(Routes.applicationCommands(appid, message.guildId), { body: command.data.toJSON() });
			message.channel.send(`Command \`${command.data.name}\` reloaded!`);
		} catch (error) {
			console.log(error);
			message.channel.send(`I've got an error while reloading that \`${command.data.name}\` command:\n\`${error.message}\``);
		}
	},
};