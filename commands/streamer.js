const { AttachmentBuilder } = require('discord.js');
const config = require("../.cfg.json");
const request = require('request');
const { inspect } = require('util');
const getToken = "https://id.twitch.tv/oauth2/token",
	apiLink = "https://api.twitch.tv/helix/users";

module.exports = {
	name: 'streamer',
	description: 'twitch streamer info',
	usage: '(streamer name)',
	showHelp: false,
	async execute(message, args) {
		if (!message.guild || message.guild.id !== "582953986089287691") return message.reply("I'm sorry, but this command is only for use on Brainstorm.");
		if (!args[0]) return message.reply('Please provide a streamer name.');
		const streamerName = args[0];
		if (!/^[a-zA-Z0-9_]{4,25}$/.test(streamerName)) return message.reply('Please provide a valid streamer name.');

		async function twitchRequest(accessToken) {
			var streamOptions = {
				url: apiLink + "?login=" + streamerName,
				method: 'GET',
				headers: {
					'Client-ID': config.CLIENT_ID,
					'Authorization': 'Bearer ' + accessToken,
				},
			};
			if (!accessToken) return console.warn("I am not able to grab myself a token, maybe try checking configs?");
			var twitchRequest = request.get(streamOptions, async (err, res, body) => {
				if (err) { return console.log(err); }
				if (res.statusCode !== 200) return message.reply(`\`ERROR\` HTTP STATUS: ${res.statusCode}, it should be 200!\n${body}`);
				console.log(JSON.parse(body));
				const atc = new AttachmentBuilder(Buffer.from(inspect(JSON.parse(body))), { name: streamerName + '.txt' });
				return message.channel.send({ content: "Here are the results:", files: [atc] });
			});
		}


		const options = {
			url: getToken,
			json: true,
			body: {
				client_id: config.CLIENT_ID,
				client_secret: config.CLIENT_SECRET,
				grant_type: 'client_credentials',
			},
		};

		request.post(options, async (err, res, body) => {
			if (err) {
				return console.log(err);
			}
			await twitchRequest(body.access_token);
		});
	},
};