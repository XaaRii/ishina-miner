const config = require("../.cfg.json");
var prefix = config.prefix;
const { client } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	name: 'help',
	description: 'List of all things I can do ^^.',
	aliases: ['commands'],
	usage: '(command name)',
	showHelp: true,
	execute(message, args) {
		message.channel.sendTyping();
		if (!args[1]) {
			const commands = client.commands.filter(x => x.showHelp !== false);
			const embed = new EmbedBuilder()
				.setColor('ffbf00')
				.setTitle(client.user.username + " - Twitch Miner module")
				.setThumbnail("https://cdn.discordapp.com/attachments/894179012652445756/1034893102495842325/ishina-miner.png")
				.setDescription("To get more info about a specific command,\ntype " + prefix + "help [command name]")
				.addFields([{ name: `Available Commands:`, value: commands.map(x => `\`${prefix}${x.name}\``).join(' | ') }])
				.setTimestamp()
				.setFooter({ text: `Have fun!` });
			message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
		} else {
			const name = args[1].toLowerCase();
			const command = client.commands.get(name) || client.commands.find(c => c.aliases && c.aliases.includes(name));
			if (!command) return message.reply('Gimme a sec... ehmm... nope, that\'s not a valid command!');

			const embed = new EmbedBuilder()
				.setColor('007fff')
				.setTitle(`Command name:  ${command.name}`)
				.setTimestamp()
				.setFooter({ text: `Need help? type ${prefix}help (command)!` });
			if (command.description) embed.setDescription(command.description);
			if (command.aliases) embed.addFields({ name: `Aliases:`, value: `${command.aliases.join(', ')}` });
			if (command.usage) embed.addFields({ name: `Usage:`, value: `${prefix}${command.name} ${command.usage}` });

			message.reply({ embeds: [embed] }).catch(e => { message.reply({ content: "something fucked up, " + e }); });
		}
	},
};