const request = require(`request`);
const fs = require(`fs`);
const config = require('../.cfg.json');
module.exports = {
	name: 'push',
	description: `Sends file. Owner only!`,
	usage: `<where? path>`,
	showHelp: false,
	async execute(message, args) {
		if (message.author.id !== config.xaari) return message.reply("Hm? That command is not for you, buddy.");
		if (!args[0]) return message.channel.send("Please specify **where** you want to save it!");

		message.attachments.each(f => {
			request.get(f.url, {}, (err) => { if (err) { return message.channel.send("ᴇʀʀᴏʀ: " + err); } })
				.pipe(fs.createWriteStream(args[0] + '/' + f.name));
		});
		if (message.attachments.size === 0) return message.channel.send("If you have something for me, then send it, baka!");
		message.channel.send("got it! Thanks! ^^");
	},
};