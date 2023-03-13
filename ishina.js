require('console-stamp')(console);
const { Collection, Events, AttachmentBuilder, REST, Routes } = require('discord.js');
const { client } = require('./exports.js');
var { recentBlock } = require('./exports.js');
const fs = require("fs");
const config = require('./.cfg.json');
var { tmmachines, tmvictimlist } = require('./exports.js');
var prefix = config.prefix;

// Commands init
client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}

// Slash commands init
client.slashCollection = new Collection();
const slashCollectionFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
for (const file of slashCollectionFiles) {
	const command = require(`./slashcmds/${file}`);
	client.slashCollection.set(command.data.name, command);
}
const rest = new REST({ version: '10' }).setToken(config.dcToken);

const { exec } = require('child_process');
const { inspect } = require('util');

client.on(Events.ClientReady, () => {
	console.info(`Logged in as ${client.user.tag}!`);
	console.info(`I am a module [${config.moduleName}] with prefix ${config.prefix}`);
	exec(`screen -ls | grep "tm-"| awk '{print $1}' | cut -d. -f 2 | cut -c 4-`, function (error, stdout, stderr) {
		const runningTM = stdout.split("\n");
		console.log(runningTM);
		tmmachines.find({}, function (err, docs) {
			for (let i = 0; i < docs.length; i++) {
				if (!runningTM.includes(docs[i].tmowner) && docs[i].tmrunning && docs[i].tmpassworded) {
					// start it lol
					exec(`cd twitchminers && screen -S tm-${docs[i].tmowner} -d -m bash starter.sh ${docs[i].tmowner}`, (err, sout, serr) => {
						if (err) console.log(err);
						console.log(`Fixed ${docs[i].tmowner} - run state set to ${docs[i].tmrunning}`);
					});
				}
				if (runningTM.includes(docs[i].tmowner) && !(docs[i].tmrunning && docs[i].tmpassworded)) {
					// end it lol
					exec("screen -S tm-" + docs[i].tmowner + " -X stuff $'\003'", (err, sout, serr) => {
						if (err) console.log(err);
						console.log(`Fixed ${docs[i].tmowner} - run state set to ${docs[i].tmrunning}`);
					});
				}
			}
		});

		if (error !== null) {
			if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(config.moduleName + " ᴇʀʀᴏʀ: `" + error + "`");
		}
	});
	client.user.setStatus('invisible');

	if (client.channels.cache.get('894203532092264458') !== undefined) client.channels.cache.get('894203532092264458').send('Twitch module started!');
});

client.on(Events.MessageCreate, async message => {
	if (message.channel.id === "894204559306674177" && message.content === "Module check!") return message.channel.send({ content: config.moduleName });
	if (message.channel.id === "1028704236738981968" && message.content.startsWith("TMERR")) {
		const TMid = message.content.slice(5);
		return exec(`cat ./twitchminers/templogs/tm-${TMid}.err`, (err, stdout) => {
			if (err) console.log(err);
			const atc = new AttachmentBuilder(Buffer.from(stdout), { name: TMid + '.txt' });
			if (recentBlock.includes(TMid)) {
				tmmachines.update({ tmowner: TMid }, { $set: { tmrunning: false } });
				return message.reply({ content: `<@303108947261259776> ERROR (${TMid})\nWithout restart.`, files: [atc] });
			}
			else {
				tmmachines.update({ tmowner: TMid }, { $set: { tmrunning: false } });
				message.reply({ content: `<@303108947261259776> ERROR (${TMid})\nI'll try to recover.`, files: [atc] });
				recentBlock.push(TMid);
				exec(`cd twitchminers && screen -S tm-${TMid} -d -m bash starter.sh ${TMid}`, (err, sout, serr) => {
					tmmachines.update({ tmowner: TMid }, { $set: { tmrunning: true } });
					if (err) console.log(err);
				});
				return setTimeout(() => {
					recentBlock = recentBlock.filter(x => x !== TMid);
				}, 300000);
			}
		});
	}
	if (!message.content.toLowerCase().startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	switch (commandName) {
		case "refresh":
			message.channel.sendTyping();
			var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const command = require(`./commands/${file}`);
				client.commands.set(command.name, command);
			}
			message.reply("Command list reloaded.");
			break;
		case "crash": case "fs":
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
		case "rpicmd": case "eval":
			var msgauthor = message.author.id;
			var cmd = args.join(' ').toString();
			message.channel.sendTyping();
			if (msgauthor === config.xaari) {
				if (commandName === "rpicmd") return execcall(message.channel, cmd);
				else return evalcall(args, message);
			} else return message.reply("**ᴀᴄᴄᴇꜱꜱ ᴅᴇɴɪᴇᴅ**, get lost.");
		case "deploy":
			if (message.author.id !== config.xaari) return;
			if (args[0] === "local") {
				try {
					const slashCommands = [];
					client.slashCollection = new Collection();
					var i = 0;
					const slashFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
					for (const file of slashFiles) {
						const command = require(`./slashcmds/${file}`);
						client.slashCollection.set(command.data.name, command);
						args[1] === "overwrite" ? slashCommands.push(command) : await rest.post(Routes.applicationCommands(config.dcAppID, message.guildId), { body: command.data.toJSON() });
						i++;
					}
					console.log(`deploy of ${i} slash commands globally on ${message.author.username}'s request.`);
					if (args[1] === "overwrite") await rest.put(Routes.applicationCommands(config.dcAppID, message.guildId), { body: slashCommands });
					message.reply(i + " slash commands deployed successfully on this server~");
				} catch (error) {
					message.channel.send('Could not deploy commands!\n' + error);
					console.error(error);
				}
			} else if (args[0] === "global") {
				try {
					const slashPubCommands = [];
					client.slashCollection = new Collection();
					i = 0;
					const slashFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
					for (const file of slashFiles) {
						const command = require(`./slashcmds/${file}`);
						client.slashCollection.set(command.data.name, command);
						if (!command.developer) {
							args[1] === "overwrite" ? slashPubCommands.push(command) : await rest.post(Routes.applicationCommands(config.dcAppID), { body: command.data.toJSON() });
							i++;
						}
					}
					console.log(`deploy of ${i} slash commands globally on ${message.author.username}'s request.`);
					if (args[1] === "overwrite") await rest.put(Routes.applicationCommands(config.dcAppID), { body: slashPubCommands });
					message.reply(i + " slash commands deployed successfully~\nChanges may take a bit longer to proceed tho...");
				} catch (error) {
					message.reply("Could not deploy commands!\n" + error);
					console.error(error);
				}
			} else return message.channel.send("Missing argument: local/global (overwrite)");
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

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = client.slashCollection.get(interaction.commandName);
	if (!command) return; // Not meant for us
	if (command.developer && interaction.user.id !== config.xaari) {
		return interaction.reply({
			content: "This command is only available to the developer (and you look like someone who can't even make 'Hello world' program).",
			ephemeral: true,
		});
	}
	try {
		command.execute(interaction);
	} catch (error) {
		console.error(error);
		interaction.followUp({
			content: 'There was an error trying to execute that command:\n' + error, ephemeral: true,
		});
	}
});

process.on('uncaughtException', (reason) => {
	console.log(reason);
	if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(config.moduleName + ': `UncaughtException:`\n' + reason);
});
process.on('unhandledRejection', (reason) => {
	console.log(reason);
	if (client.channels.cache.get('735207428299161602') !== undefined) client.channels.cache.get('735207428299161602').send(config.moduleName + ': `Unhandled promise rejection:`\n' + reason);
});

client.login(config.dcToken);

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