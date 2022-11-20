const config = require('../.cfg.json');
module.exports = {
	name: 'pull',
	description: `Gets file. Owner only!`,
	usage: `<where? path>`,
	showHelp: false,
	async execute(message, args) {
		if (message.author.id !== config.xaari) return message.reply("Hm? That command is not for you, buddy.");
		if (!args[0]) return message.channel.send("Please specify a path of the file you want! (name included ofc)\nSomething like: `/home/pi/test.png` or `C:/Users/username/Desktop/file.png` or `./heya.png`");
		message.channel.send({ content: "Here you go.", files: [args[0]] }).catch(err => {
			message.channel.send('I can\'t find that file! sry');
		});
	},
};