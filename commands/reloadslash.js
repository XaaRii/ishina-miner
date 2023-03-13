const config = require("../.cfg.json");

module.exports = {
	name: 'reloadslash',
	description: 'Reloads a slash command',
	aliases: ['rls'],
	usage: '<command you want to reload>',
	showHelp: false,
	execute(message, args) {
		if (message.author.id !== config.xaari) return;
		message.channel.sendTyping();
		if (!args.length) return message.reply("I don't know what command you wanna reload!");
		const commandName = args[0].toLowerCase();
		const command = message.client.slashCollection.get(commandName);
		if (!command) return message.channel.send(`That's not a command I would know, ${message.author}!`);

		delete require.cache[require.resolve(`../slashcmds/${commandName}.js`)];

		try {
			const newCommand = require(`../slashcmds/${commandName}.js`);
			message.client.slashCollection.set(newCommand.data.name, newCommand);
			message.channel.send(`Command \`${command.data.name}\` reloaded!`);
		} catch (error) {
			console.log(error);
			message.channel.send(`I've got an error while reloading that \`${command.data.name}\` command:\n\`${error.message}\``);
		}
	},
};