const config = require("../.cfg.json");

module.exports = {
	name: 'reload',
	description: 'Reloads a command',
	aliases: ['rl'],
	usage: '<command you want to reload>',
	showHelp: false,
	execute(message, args) {
		if (message.author.id !== config.xaari) return;
		message.channel.sendTyping();
		if (!args.length) return message.reply("I don't know what command you wanna reload!");
		const commandName = args[0].toLowerCase();
		const command = message.client.commands.get(commandName) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

		if (!command) {
			return message.channel.send(`That's not a command I would know, ${message.author}!`);
		}

		delete require.cache[require.resolve(`./${command.name}.js`)];

		try {
			const newCommand = require(`./${command.name}.js`);
			message.client.commands.set(newCommand.name, newCommand);
			message.channel.send(`Command \`${command.name}\` reloaded!`);
		} catch (error) {
			console.log(error);
			message.channel.send(`I've got an error while reloading that \`${command.name}\` command:\n\`${error.message}\``);
		}
	},
};