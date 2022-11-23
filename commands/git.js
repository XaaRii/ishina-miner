const config = require("../.cfg.json");
const Discord = require("discord.js");
const { exec } = require('child_process');

module.exports = {
	name: 'git',
	description: 'git pull from the repository',
	usage: '',
	showHelp: false,
	execute(message, args) {
		if (message.author.id !== config.xaari) return message.reply("Hm? That spell is too powerful for you to use, buddy.");
		return execc(message.channel, `git pull`);
	},
};

async function execc(msgchannel, cmd) {
	const m = await msgchannel.send("Request sent. (if it takes too long, consider checking if there is a correct username/pw combo for git?)");
	exec(cmd, function (error, stdout, stderr) {
		if (!stdout) {
			m.edit("Done.");
		} else if (stdout.length >= 1950) {
			const atc = new Discord.AttachmentBuilder(Buffer.from(stdout), { name: 'rpicmd.txt' });
			m.edit({ content: "Done! Here are the results:", files: [atc] });
		} else m.edit({ content: "Done! Here are the results:\n" + stdout + stderr });
	});
}