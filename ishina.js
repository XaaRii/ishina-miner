require('console-stamp')(console);
const { Collection, Events, AttachmentBuilder, REST, Routes, InteractionType } = require('discord.js');
const { client } = require('./exports.js');
var { recentBlock } = require('./exports.js');
const fs = require("fs");
const config = require('./.cfg.json');
var { tmmachines, tmvictimlist } = require('./exports.js');
var prefix = config.prefix, prefixAlias = config.prefixAlias;

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
	console.info(`I am a module [${config.moduleName}] with prefix ${config.prefix} (${config.prefixAlias})`);
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
					// wait 10 seconds and wait for it to finish
					sleep(10000)
					
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
	if (message.channel.id === "1028704236738981968") {
		if (message.author.username !== "DataMiner") return;
		if (message.attachments.size > 0) prepareScraperData(message.attachments);
		return;
	}
	if (message.channel.id === "1028704236738981968" && message.content.startsWith("TMERR")) {
		if (recentBlock === "upgrade_pending") return;
		const TMid = message.content.slice(5);
		return exec(`cat ./twitchminers/templogs/tm-${TMid}.err`, (err, stdout) => {
			if (err) console.log(err);
			const atc = new AttachmentBuilder(Buffer.from(stdout), { name: TMid + '.txt' });
			if (recentBlock.includes(TMid)) {
				tmmachines.update({ tmowner: TMid }, { $set: { tmrunning: false } });
				return message.reply({ content: `<@303108947261259776> ERROR (${TMid})\nNot restarting.`, files: [atc] });
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
	var shorty = false;
	if (message.author.bot) return;
	if (message.content.toLowerCase().startsWith(prefixAlias)) shorty = true;
	else if (!message.content.toLowerCase().startsWith(prefix)) return;

	const args = shorty ? message.content.slice(prefixAlias.length).trim().split(/ +/) : message.content.slice(prefix.length).trim().split(/ +/);
	const commandName = args.shift().toLowerCase();

	console.log(message.author.username, "|", commandName, args);
	switch (commandName) {
		case "refresh":
			message.channel.sendTyping();
			var commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const command = require(`./commands/${file}`);
				client.commands.set(command.name, command);
			}
			commandFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const command = require(`./slashcmds/${file}`);
				client.slashCollection.set(command.data.name, command);
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
			if (message.author.id !== config.xaari) return message.channel.send("How about deploying yourself into a proper employment instead?");
			if (!["global", "local"].includes(args[0])) return message.channel.send("Missing argument: local/global (overwrite)");
			message.channel.sendTyping();
			var resp = ['Registering commands in progress...\n'];
			var progressbar = args[1] !== "overwrite" ? await message.reply({ content: resp.join("") }) : undefined;

			// json hack because we don't have the luxury of user commands in djs yet
			let hacked_json
			function body_hack_usercmds(body) {
				// if (body.name !== "twitch") return body;
				body.integration_types = [0, 1];
				body.contexts = [0, 1, 2];
				return body;
			}
			if (args[0] === "local") {
				try {
					const slashCommands = [];
					client.slashCollection = new Collection();
					var i = 0;
					const slashFiles = fs.readdirSync('./slashcmds').filter(file => file.endsWith('.js'));
					for (const file of slashFiles) {
						const command = require(`./slashcmds/${file}`);
						client.slashCollection.set(command.data.name, command);
						if (args[1] === "overwrite") slashCommands.push(command.data);
						else {
							hacked_json = await body_hack_usercmds(command.data.toJSON());
							await rest.post(Routes.applicationCommands(config.dcAppID, message.guildId), { body: hacked_json });
							resp.push(command.data.name + " ");
							progressbar.edit(resp.join(""));
						}
						i++;
					}
					console.log(`deploy of ${i} slash commands globally on ${message.author.username}'s request.`);
					if (args[1] === "overwrite") await rest.put(Routes.applicationCommands(config.dcAppID, message.guildId), { body: slashCommands });
					if (!progressbar) message.reply(i + " slash commands deployed successfully on this server~");
					else {
						resp.push(`\n\n${i} slash commands deployed successfully on this server~`);
						progressbar.edit(resp.join(""));
					}
				} catch (error) {
					if (!progressbar) message.channel.send('Could not deploy commands!\n' + error);
					else progressbar.edit('Could not deploy commands!\n' + error);
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
							if (args[1] === "overwrite") slashPubCommands.push(command.data);
							else {
								hacked_json = await body_hack_usercmds(command.data.toJSON());
								await rest.post(Routes.applicationCommands(config.dcAppID), { body: hacked_json });
								resp.push(command.data.name + " ");
								progressbar.edit(resp.join(""));
							}
							i++;
						}
					}
					console.log(`deploy of ${i} slash commands globally on ${message.author.username}'s request.`);
					if (args[1] === "overwrite") await rest.put(Routes.applicationCommands(config.dcAppID), { body: slashPubCommands });
					if (!progressbar) message.reply(i + " slash commands deployed successfully~\nChanges may take a bit longer to proceed tho...");
					else {
						resp.push(`\n\n${i} slash commands deployed successfully~\nChanges may take a bit longer to proceed tho...`);
						progressbar.edit(resp.join(""));
					}
				} catch (error) {
					if (!progressbar) message.channel.send('Could not deploy commands!\n' + error);
					else progressbar.edit('Could not deploy commands!\n' + error);
					console.error(error);
				}
			} else return message.channel.send("Bad format, use these args: local/global (overwrite)");
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
	if (interaction.type !== InteractionType.ApplicationCommand) return;

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

async function prepareScraperData(attachments) {
	const https = require('https')
	try {
		attachments.forEach(a => {
			if (!a.contentType.startsWith("text/plain")) return console.log("Invalid content type: " + a.contentType);
			if (fs.existsSync(`./checkers/${a.name}`)) {
				fs.writeFileSync(`./checkers/${a.name}.old`, fs.readFileSync(`./checkers/${a.name}`));
				fs.unlinkSync(`./checkers/${a.name}`);
			}

			const file = fs.createWriteStream(`./checkers/${a.name}`);
			https.get(a.url, function (response) {
				response.pipe(file);
			});

			file.on('finish', async () => {
				file.close();

				try {
					const encoded = fs.readFileSync(`./checkers/${a.name}`, 'utf8');
					const decoded = Buffer.from(encoded, 'base64').toString('utf8');
					fs.writeFileSync(`./checkers/${a.name}`, decoded, 'utf8');

				} catch (error) {
					console.error(error);
					if (client.channels.cache.get('1028704236738981968') !== undefined) client.channels.cache.get('1028704236738981968').send({ content: "unexpected encoding error: " + error });
				}

				manageScrapeData(a.name);

			});

			file.on('error', (error) => {
				console.error(`Error writing file ${a.name}:`, error);
			});
		});
	} catch (error) {
		console.log("Error: ", error);
		if (client.channels.cache.get('1028704236738981968') !== undefined) client.channels.cache.get('1028704236738981968').send({ content: "prepareScraperData error: " + error });
		return;
	}
}

const { EmbedBuilder } = require('discord.js');
const HTMLParser = require('node-html-parser');

async function manageScrapeData(filename) {
	let diff = [], destination = "", embedList = [new EmbedBuilder()], msg = [];
	try {
		switch (filename) {
			case "PA_PRIME.txt":
				destination = "1161948675006812211";
				headers = ["name", "game", "link", "image"];
				diff = await processCSV(filename, headers, "link");
				embedList[0].setTitle("New Twitch Prime offers!")
					.setColor("9146ff")
				i = 0, e = 0;
				for (const item of diff) {
					if (i > 24) {
						i = 0;
						embedList.push(new EmbedBuilder().setColor("9146ff"));
						e++;
					}
					if (item.name && item.game && item.link) {
						embedList[e].addFields({ name: item.name, value: `${item.game}\n[Claim now!](${item.link})`, inline: true });
						i++;
					}
				}
				if (!i && !e) return;
				// edit last embed in embedList to add timestamp
				embedList[e].setTimestamp();
				msg.push({ embeds: embedList })
				break;

			case "PA_TDROPS.txt":
				destination = "1161948782326456340";
				headers = ["game", "studio", "datetime"];
				diff = await processCSV(filename, headers, "game", "datetime");
				embedList[0].setTitle("New Twitch Drops available!")
					.setColor("7213ff")
				i = 0, e = 0;
				for (const item of diff) {
					if (i > 24) {
						i = 0;
						embedList.push(new EmbedBuilder().setColor("7213ff"));
						e++;
					}
					embedList[e].addFields({ name: item.game, value: `${item.studio}\n${item.datetime}`, inline: false });
					i++;
				}
				msg.push({ embeds: embedList })
				break;

			case "PA_HS.txt":
				destination = "1161947881062805515";
				/// CSV approach not working since 10.2.2025
				// headers = ["image"];
				// diff = await processCSV(filename, headers, "image");

				// load results
				const data = fs.readFileSync(`./checkers/${filename}`, 'utf8'),
					root = HTMLParser.parse(data),
					entryContent = root.querySelector('.entry-content'),
					images = entryContent.querySelectorAll('img').map(x => x.getAttribute('data-src'));

				// compare with old results
				if (fs.existsSync(`./checkers/${filename}.old`)) {
					const oldData = fs.readFileSync(`./checkers/${filename}.old`, 'utf8'),
					oldRoot = HTMLParser.parse(oldData),
					oldEntryContent = oldRoot.querySelector('.entry-content'),
					oldimages = oldEntryContent.querySelectorAll('img').map(x => x.getAttribute('data-src'));
					
					diff = images.filter((el) => !oldimages.includes(el));
					console.log("hs diff", images.length);
				} else diff = images;

				let attas = [];
				for (const item of images) {
					attas.push(new AttachmentBuilder(item));
				}
				// Discord's API limit is 10 files per message
				while (attas.length > 0) {
					msg.push({ content: "", files: attas.splice(0, 10) });
				}
				if (msg[0]) msg[0].content = "New Hearthstone shop rotation!";
				break;

			default:
				console.warn("Couldn't parse, invalid filename " + filename);
				return;
		}
		if (diff.length < 1) return;

		let where = client.channels.cache.get(destination);
		if (!where) where = await client.channels.fetch(destination);

		for (const o of msg) {
			const x = await where.send(o);
			if (x.channel.type === 5) await x.crosspost();
		}
		return;

	} catch (error) {
		if (client.channels.cache.get('1028704236738981968') !== undefined) await client.channels.cache.get('1028704236738981968').send({ content: "error: " + error });
		if (fs.existsSync(`./checkers/${filename}`)) {
			if (client.channels.cache.get('1028704236738981968') !== undefined) await client.channels.cache.get('1028704236738981968').send({ files: [`./checkers/${filename}`] });
			fs.unlinkSync(`./checkers/${filename}`);
		}
		return console.error(error);
	}
}

const csv = require('csv-parser');
async function processCSV(filename, headers, compareBy, compareSecondary = null) {
	let n = [], o = [];

	const readNewFile = new Promise((resolve, reject) => {
		fs.createReadStream(`./checkers/${filename}`, { encoding: 'utf8' })
			.pipe(csv({ headers: headers, separator: ';' }))
			.on('data', (data) => n.push(data))
			.on('end', resolve)
			.on('error', reject);
	});

	const readOldFile = new Promise((resolve, reject) => {
		if (!fs.existsSync(`./checkers/${filename}.old`)) return resolve();
		fs.createReadStream(`./checkers/${filename}.old`, { encoding: 'utf8' })
			.pipe(csv({ headers: headers, separator: ';' }))
			.on('data', (data) => o.push(data))
			.on('end', resolve)
			.on('error', reject);
	});

	await Promise.all([readNewFile, readOldFile]);

	// compare the two JSON arrays
	let diff = n.filter((el) => {
		let found = o.find((el2) => el[compareBy] === el2[compareBy] && (compareSecondary === null || el[compareSecondary] === el2[compareSecondary]));
		return !found;
	});
	console.log("new old diff", n.length, o.length, diff.length);
	return diff;
}


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

function sleep(milliseconds) {
    const start = Date.now();
    while (Date.now() - start < milliseconds) {
        // Block execution
    }
}