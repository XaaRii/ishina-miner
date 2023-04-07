splash();
require('console-stamp')(console);
try {
	require('./ishina.js');
} catch (err) {
	if (err instanceof SyntaxError) {
		console.log("----------------------------------------\nSyntaxError detected! Booting into ᴇᴍᴇʀɢᴇɴᴄʏ ᴍᴏᴅᴇ...");
		emergency("SyntaxError");
	} else if (err instanceof TypeError) {
		console.log("----------------------------------------\nTypeError detected! Booting into ᴇᴍᴇʀɢᴇɴᴄʏ ᴍᴏᴅᴇ...");
		emergency("TypeError");
	} else if (err instanceof ReferenceError) {
		console.log("----------------------------------------\nReferenceError detected! Booting into ᴇᴍᴇʀɢᴇɴᴄʏ ᴍᴏᴅᴇ...");
		emergency("ReferenceError");
	} else if (err.code === 'ENOENT') {
		console.log("----------------------------------------\n'File not found' Error detected! Booting into ᴇᴍᴇʀɢᴇɴᴄʏ ᴍᴏᴅᴇ...");
		emergency("'File not found' Error");
	} else {
		console.log(err);
		emergency("unknownError");
	}
}

async function splash() {
	return console.log(`
	▄▄▄    ▀█▓      █▌  ▄█▀▒▒▄▄▄   ███▄   ▀█  ██▓▒▀█     █▀▒ ▒ █████ ██▀███   
   ▒████▄  ▓▄█▒    ▓█▌▄█▀▒▓▒████▄   ██▓▀█  █▌▒▓██▒▒▒▀█▄█▀▒░▒ ██▒  ██▒▓██ ▒ ██▒
  ▒██  ▀█▄ ▒█▀░    ▓███▄░▒▒██  ▀█▄ ▓██▒▒▀█ █▌▒▒██▒░░░▄█▀░░░ ▒██░  ██▒▓██ ░▄█ ▒
 ░██▄▄▄▄██ ▒█▄░    ▓█▌ █▄░██▄▄▄▄██ ▓██▒▒▒▐▌█▌░ ██░░▄█▀▀█▄▒  ▒██   ██░▒██▀▀█▄  
  ▓█   ▓██▒░█████▄▒▓█▌▒ █▄▓█   ▓██▒▄██░ ▒▄██▒░ ██▒▄█ ▒ ▒█▄▒  ████▓▒░░ ██▓ ▒██▒
  ▒▒   ▓▒█░░ ▒░░ ▓░▒▒▒▒ ▓▒▒▒   ▓▒█░░░▒░ ░▒▒▒▒░░▓  ▒▒ ▒ ░▒░▓░ ▒░▒░▒░ ░▓▒░ ░▒▓░ 
   ▒   ▒▒ ░░ ░  ▒ ░░ ░▒ ▒░ ▒   ▒▒ ░░ ░   ░ ▒░ ░▒ ░░░ ░  ░▒▒░ ░ ▒ ▒░ ▒▒░  ░ ▒░ 
   ░   ▒     ░  ░  ░ ░░ ░  ░   ▒   ░░      ░   ▒ ░ ░      ░  ░ ░ ▒  ░░     ░  
	   ░  ░       ░░  ░        ░  ░        ░   ░   ░    ░      ░ ░   ░        

					   Ishina Modules: Twitch Miners
`);
}

async function emergency(errType) {
	const { client } = require("./exports.js"),
		{ Events, AttachmentBuilder, PresenceUpdateStatus } = require("discord.js"),
		fs = require("fs"), ms = require('ms'), request = require(`request`),
		config = require('./.cfg.json');
	var prefix = config.prefix, token = config.dcToken;

	var temppermits = {};
	const { exec } = require('child_process');
	const { inspect } = require('util');

	client.on(Events.ClientReady, () => {
		console.info(`Emergency login as ${client.user.tag}!`);
		if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(`[${config.moduleName}] ${errType} detected! Emergency mode activated.`);
		client.user.setPresence({
			activities: [{
				name: "ᴇᴍᴇʀɢᴇɴᴄʏ ᴍᴏᴅᴇ",
				type: 0,
			}],
			status: PresenceUpdateStatus.DoNotDisturb,
		});
	});

	client.on(Events.MessageCreate, async message => {
		if (!message.content.startsWith(prefix) || message.author.bot) return;
		const args = message.content.slice(prefix.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

		console.log(message.author.username, "|", commandName, args);
		switch (commandName) {
			case "push":
				if (message.author.id === config.xaari) {
					if (!args[0]) return message.channel.send("Please specify **where** you want to save it!");
					message.attachments.each(f => {
						request.get(f.url, {}, (err) => { if (err) { return message.channel.send("ᴇʀʀᴏʀ: " + err); } })
							.pipe(fs.createWriteStream(args[0] + '/' + f.name));
					});
					if (message.attachments.size === 0) return message.channel.send("If you have something for me, then send it, baka!");
					message.channel.send("got it! Thanks! ^^");
				} else message.channel.send("*You tried to give her something, but she refused.*\n  Huh? I don't accept candies from strangers.");
				break;
			case "pull":
				if (message.author.id === config.xaari) {
					if (!args[0]) return message.channel.send("Please specify a path of the file you want! (name included ofc)\nSomething like: `/home/pi/test.png` or `C:/Users/username/Desktop/file.png` or `./heya.png`");
					message.channel.send({ content: "Here you go.", files: [args[0]] }).catch(err => {
						return message.channel.send('I can\'t find that file! sry');
					});
				} else message.channel.send("*You tried to pull some bitches, but...*\n  Don't you dare hunt in **my** territory! <a:cocoGun:1037328931386298378>");
				break;
			case "fs":
				if (message.author.id === config.xaari) {
					var whoasked = message.author.username;
					message.channel.send('Exiting emergency mode...')
						.then(msg => {
							client.destroy();
							console.log(`Shutting down on request of ${whoasked}.`);
							process.exit();
						});
				} else message.channel.send("*You wanted to restart her framework, but you don't have enough permissions.*\n  Hehe, error 404: Your perms not found.");
				break;
			case "rpicmd": case "eval":
				var msgauthor = message.author.id;
				var cmd = args.join(' ').toString();
				message.channel.sendTyping();
				if (msgauthor === config.xaari) {
					if (args[0] === "rpicmd") return execcall(message.channel, cmd);
					else return evalcall(args, message);
				} else return message.reply("**ᴀᴄᴄᴇꜱꜱ ᴅᴇɴɪᴇᴅ**, get lost.");
		}
	});

	process.on('unhandledRejection', (reason) => {
		console.log(reason);
		if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send('`Unhandled promise rejection:`\n' + reason);
	});


	client.login(token);

	/* FUNCTIONS */
	async function execcall(msgchannel, cmd) {
		const m = await msgchannel.send("Request sent.");
		exec(cmd, function (error, stdout, stderr) {
			if (!stdout) {
				m.edit("Done.");
			} else if (stdout.length >= 1950) {
				const atc = new AttachmentBuilder(Buffer.from(stdout), { name: 'rpicmd.txt' });
				m.edit({ content: "Done! Here are the results:", files: [atc] });
			} else m.edit({ content: "Done! Here are the results:\n" + stdout });
			if (error !== null) {
				msgchannel.send("ᴇʀʀᴏʀ: `" + stderr + "`");
			}
		});
	}

	async function evalcall(args, message) {
		let evaled;
		try {
			if (args[0] === "output") {
				evaled = await eval(args.slice(1).join(' '));
				if (evaled !== undefined) {
					if (inspect(evaled).length >= 1970) {
						const atc = new AttachmentBuilder(Buffer.from(inspect(evaled)), { name: 'eval.txt' });
						message.channel.send({ content: "Evaluation too long, so instead i'll send a file containing result.:", files: [atc] });
					} else message.channel.send(inspect(evaled));
					console.log(inspect(evaled));
				} else return message.channel.send("Evaluated.");
			} else {
				evaled = await eval(args.join(' '));
			}
		}
		catch (err) {
			console.error(err);
			message.reply(`There was an error during evaluation. ᴇʀʀᴏʀ: \`${err}\``);
		}
	}
}