splash();
require('console-stamp')(console);
const Discord = require("discord.js");
const { REST, Routes } = require('discord.js');
const { client } = require('./exports.js');
const fs = require("fs"), ms = require('ms');
const config = require('./.cfg.json');
var { tmmachines, tmvictimlist } = require('./exports.js');
var prefix = config.prefix;
var temp1, temp2, temp3;

// Commands init
client.commands = new Discord.Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// Slash commands init
const slashcommands = [];
client.slashcmds = new Discord.Collection();
const slashcmdFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
for (const file of slashcmdFiles) {
	const command = require(`./slashcmds/${file}`);
	client.slashcmds.set(command.name, command);
	slashcommands.push(command);
}

const { exec } = require('child_process');
const { inspect } = require('util');

client.on('ready', () => {
	console.info(`Logged in as ${client.user.tag}!`);
	console.info(`I am a module [${config.moduleName}] with prefix ${config.prefix}`);
	exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
		const runningTM = stdout.split("\n");
		console.log(runningTM);
		tmmachines.find({}, function (err, docs) {
			for (let i = 0; i < docs.length; i++) {
				console.log(docs[i]);
				console.log(docs[i].tmowner);
				console.log("includes? " + runningTM.includes(docs[i].tmowner));
				console.log("running? " + docs[i].running);
				console.log("passworded? " + docs[i].passworded);
				if (!runningTM.includes(docs[i].tmowner) && docs[i].running && docs[i].passworded) {
					// start it lol
					exec(`cd twitchminers && screen -S tm-${docs[i].tmowner} -d -m python run${docs[i].tmowner}.py`, (err) => {
						if (err) console.log(err);
						console.log(`Fixed ${docs[i].tmowner} - run state set to ${docs[i].running}`);
					});
				}
				if (runningTM.includes(docs.tmowner) && (!docs[i].running || !docs[i].passworded)) {
					// end it lol
					exec("screen -S tm-" + docs[i].tmowner + " -X stuff $'\003'", (err) => {
						if (err) console.log(err);
						console.log(`Fixed ${docs[i].tmowner} - run state set to ${docs[i].running}`);
					});
				}
			}
		});

		if (error !== null) {
			if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(config.moduleName + " ᴇʀʀᴏʀ: `" + error + "`");
		}
	});
	if (client.channels.cache.get('894203532092264458') !== undefined) client.channels.cache.get('894203532092264458').send('Twitch module started!');
});

client.on("messageCreate", async message => {
	if (message.content === "Module check!" && message.channel.id === "894204559306674177") return message.channel.send({ content: config.moduleName });
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	switch (commandName) {
		case "rpicmd":
			var msgauthor = message.author.id;
			var cmd = args.join(' ').toString();
			message.channel.sendTyping();
			if (msgauthor !== config.xaari) return message.reply("You are not Pawele, thus i can't let you execute this command.");
			execcall(message.channel, cmd);
			break;
		case "refresh":
			message.channel.sendTyping();
			var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const command = require(`./commands/${file}`);
				client.commands.set(command.name, command);
			}
			message.reply("Command list reloaded.");
			break;
		case "crash":
		// fall through
		case "fs":
			if (message.author.id === config.xaari) {
				var whoasked = message.author.username;
				if (commandName === "fs") { // fs
					message.channel.send('Full Reset...')
						.then(msg => {
							client.destroy();
							console.log(`Shutting down on request of ${whoasked}.`);
							process.exit();
						});
				} else { // crash
					message.channel.send('Oh shit a concrete wall-')
						.then(msg => {
							client.destroy();
							console.log(`Concrete wall built on request of ${whoasked}.`);
							const x = require("./keepAlive.js");
						});
				}
			} else message.channel.send("*You wanted to restart their framework, but you don't have enough permissions.*\n  Hehe, error 404: Your perms not found.");
			break;
		case "eval":
			message.channel.sendTyping();
			if (message.author.id !== config.xaari) return message.channel.send("Don't even THINK about that.");
			evalcall(args, message);
			break;
		case "deploy":
			if (!config.admins.includes(message.author.id)) return;
			if (args[0] === "local") {
				message.channel.sendTyping();
				await message.guild.commands
					.set(client.slashcmds)
					.then(async () => {
						console.log(`deploy on ${message.guild.name} on ${message.author.username}'s request.`);
						message.reply("Slash commands deployed successfully~");
					})
					.catch(err => {
						message.channel.send('Could not deploy commands!\n' + err);
						console.log(err);
					});
			} else if (args[0] === "global") {
				var wannabetoken, wannabeappid;
				wannabetoken = config.init.dcToken;
				wannabeappid = config.init.dcAppID;
				const rest = new REST({ version: '10' }).setToken(wannabetoken);
				try {
					console.log(`deploy of ${slashcommands.length} slash commands globally on ${message.author.username}'s request.`);
					const data = await rest.put(
						Routes.applicationCommands(wannabeappid),
						{ body: slashcommands },
					);
					message.reply("Slash commands deployed successfully~\nChanges may take a bit longer to proceed tho...");
				} catch (error) {
					console.error(error);
				}
			} else return message.channel.send("Missing argument: local/global");
			break;
	}
	var command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
	if (!command) return;

	if (command.guildOnly && message.channel.isDMBased()) {
		const guildOnlyMessages = ["I'm not gonna respond to this, unless you ask me on a server", "Y'know this one's a server command, right?", "I can't help you here, let's go on server!", "I can't execute that command inside DMs!"];
		const randomGuildOnlyMessage = guildOnlyMessages[Math.floor(Math.random() * guildOnlyMessages.length)];
		return message.reply(randomGuildOnlyMessage);
	}
	// try catch for commands
	try { command.execute(message, args); }
	catch (error) {
		console.error(error);
		return message.channel.send(`Error happened. Either you or my creator fucked up.\nᴇʀʀᴏʀ: \`${error}\``);
	}


});

client.on('interactionCreate', async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.slashcmds.get(interaction.commandName.toLowerCase());
	try {
		if (!command) return; // Not meant for us
		command.execute(interaction, client);
	} catch (error) {
		console.error(error);
		interaction.followUp({
			content: 'There was an error trying to execute that command:\n' + error,
		});
	}
});

process.on('unhandledRejection', (reason) => {
	console.log(reason);
	if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(config.moduleName + ': `Unhandled promise rejection:`\n' + reason);
});

client.login(config.dcToken);

/* FUNCTIONS */
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

async function execcall(msgchannel, cmd) {
	const m = await msgchannel.send("Request sent.");
	exec(cmd, function (error, stdout, stderr) {
		if (!stdout) {
			m.edit("Done.");
		} else if (stdout.length >= 1950) {
			const atc = new Discord.AttachmentBuilder(Buffer.from(stdout), { name: 'rpicmd.txt' });
			m.edit({ content: "Done! Here are the results:", files: [atc] });
		} else m.edit({ content: "Done! Here are the results:\n" + stdout + stderr });
	});
}

async function evalcall(args, message) {
	let evaled;
	try {
		if (args[0] === "output") {
			evaled = await eval(args.slice(1).join(' '));
			if (evaled !== undefined) {
				if (inspect(evaled).length >= 1970) {
					const atc = new Discord.AttachmentBuilder(Buffer.from(inspect(evaled)), { name: 'eval.txt' });
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