const { Client, GatewayIntentBits, Partials } = require('discord.js');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildIntegrations,
		// GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		// Intents.FLAGS.GUILD_BANS,
		// Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS,
		// Intents.FLAGS.GUILD_WEBHOOKS,
		// Intents.FLAGS.GUILD_INVITES,
		// Intents.FLAGS.GUILD_PRESENCES,
		// Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
		// Intents.FLAGS.GUILD_MESSAGE_TYPING,
		// Intents.FLAGS.DIRECT_MESSAGE_REACTIONS,
		// Intents.FLAGS.DIRECT_MESSAGE_TYPING,
		// Intents.FLAGS.GUILD_SCHEDULED_EVENTS,
	],
	ws: { properties: { browser: "Discord iOS" } },
	partials: [
		// Partials.Message,
		Partials.Channel,
		// Partials.Reaction
	],
});

const Datastore = require('nedb');
const db1 = new Datastore({ filename: './tmmachines.db', autoload: true });
const db2 = new Datastore({ filename: './tmvictimlist.db', autoload: true });
const db3 = new Datastore({ filename: './tmmisc.db', autoload: true });
var recentBlock = [];

exports.client = client;
exports.tmmachines = db1;
exports.tmvictimlist = db2;
exports.misc = db3;
exports.recentBlock = recentBlock;

// Function blocks //

function splitLines(input, limit) {
	const lines = (typeof input === 'string' || input instanceof String) ? input.split('\n') : input instanceof Array ? input : undefined;
	if (!lines) return;
	const arr = []; let part = '';

	lines.forEach(line => {
		const tmpPart = (part + '\n' + line).trim();
		if (tmpPart.length > limit) {
			if (part.length > 0) {
				arr.push(part);
				part = line;
			} else {
				part.substring(0, limit - 3) + "...";
				part = part.substring(limit - 2);
			}
		} else {
			part = tmpPart;
		}
	});
	if (part !== '') arr.push(part);

	return arr;
}
exports.splitLines = splitLines;