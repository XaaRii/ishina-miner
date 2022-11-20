const { EmbedBuilder } = require('discord.js');
const config = require("../.cfg.json");
var prefix = config.prefix;
const { client } = require('../exports.js');
const os = require("os"); const ms = require("ms");
module.exports = {
	name: 'os',
	description: `Dev only, statistics about system`,
	showHelp: false,
	execute(message, args) {
		if (message.author.id !== config.xaari) return message.reply("Hm? That command is not for you, buddy.");
		if (!args[0]) return message.channel.send("options: all, hostname, freemem, maxmem, network, platform, uptime");
		message.channel.sendTyping();
		const embed = new EmbedBuilder().setColor('#ffbf00').setTimestamp();
		switch (args[0]) {
			case "all":
				embed.setAuthor({ name: 'OS command: all', iconURL: client.user.displayAvatarURL() })
					.addFields(
						{ name: 'Current hostname', value: os.hostname(), inline: true },
						{ name: 'Free Memory (cache excluded):', value: (os.freemem() / 1048576) + " MB", inline: true },
						{ name: 'Maximum Memory:', value: (os.totalmem() / 1048576) + " MB", inline: true },
						{ name: 'Current Networks:', value: `[check ${prefix}os network]`, inline: true },
						{ name: 'Current platform:', value: os.platform(), inline: true },
						{ name: 'Current uptime:', value: ms(os.uptime() * 1000, { long: true }), inline: true },
					);
				break;
			case "hostname":
				embed.setAuthor({ name: 'OS command: hostname', iconURL: client.user.displayAvatarURL() })
					.addFields(
						{ name: 'Current hostname', value: os.hostname(), inline: true },
					);
				break;
			case "freemem":
				embed.setAuthor({ name: 'OS command: freemem', iconURL: client.user.displayAvatarURL() })
					.addFields(
						{ name: 'Free Memory:', value: (os.freemem() / 1048576) + " MB", inline: true },
					);
				break;
			case "maxmem":
				embed.setAuthor({ name: 'OS command: maxmem', iconURL: client.user.displayAvatarURL() })
					.addFields(
						{ name: 'Maximum Memory:', value: (os.totalmem() / 1048576) + " MB", inline: true },
					);
				break;
			case "network":
				var netint = os.networkInterfaces().eth0;	// eth0 check
				if (netint) netint = netint[0];
				else {
					netint = os.networkInterfaces().wlan0;	// wlan0 check
					if (netint) netint = netint[0];
					else return message.reply("Couldn't find any eth0 or wlan0 interfaces, this may happen fe. if I'm being hosted on windows.");
				}
				embed.setAuthor({ name: 'OS command: network', iconURL: client.user.displayAvatarURL() })
					.addFields(
						{ name: 'address:', value: netint.address.substr(0, 15) + "", inline: true },
						{ name: 'netmask:', value: netint.netmask.substr(0, 15) + "", inline: true },
						{ name: 'family:', value: netint.family.substr(0, 4) + "", inline: true },
						{ name: 'mac:', value: netint.mac.substr(0, 17) + "", inline: true },
						{ name: 'internal:', value: netint.internal + "", inline: true },
						{ name: 'cidr:', value: netint.cidr.substr(0, 18) + "", inline: true },
					);
				break;
			case "platform":
				embed.setAuthor({ name: 'OS command: platform', iconURL: client.user.displayAvatarURL() })
					.addFields(
						{ name: 'Current platform:', value: os.platform(), inline: true },
					);
				break;
			case "uptime":
				embed.setAuthor({ name: 'OS command: uptime', iconURL: client.user.displayAvatarURL() })
					.setDescription('System uptime: ' + ms(os.uptime() * 1000, { long: true }));
				break;
		}
		message.channel.send({ embeds: [embed] });
	},
};
