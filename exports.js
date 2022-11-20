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
var user = "";

exports.client = client;
exports.tmmachines = db1;
exports.tmvictimlist = db2;
exports.whoami = user;