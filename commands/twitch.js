const config = require("../.cfg.json");
var prefix = config.prefix;
var { tmmachines, tmvictimlist, whoami } = require('../exports.js');
const { EmbedBuilder } = require('discord.js');

// bot start, check db for expected running, then check running. for each machine, fix the state if needed.

//   var tmusername, tmauthor,
//   var request_tmmachines = {
//       "tmauthor": message.author.id,
//       "tmusername": "",
//       "tmrunning": true/false,
//       "tmpermissions": [],
//   };
//   var request_tmvictimlist = {
//       "tmusername": "",
//       "tmvictim": "",
//   };
//   dbRem.insert(request, function (err, d) {
//       if (err) return message.channel.send("Error happened!", err);
//   });
//
//   await dbRem.find({ tmusername: "" }, function (err, docs) {
//       for (let i = 0; i < docs.length; i++) {
//           var entraj = (`- ${docs[i].content}, [1;36m${ms(docs[i].wannadate - toki, { long: true, decimal: 1 })} remains[0m`);
//           todolist.push(entraj);
//       }
//       todolist.push("\n[0;37m---------------------------------------------------[0m\n```");
//       message.channel.send(todolist.join("\n"));
//   });
//
//
// celej create a add/remove bude zalozenej na templatu ze twou casti, ktery se spoji jako sendvic a mezi ne pujde fabricated tmvictimlist
//

// ////////////////////////
// //////////////////////  SPLIT THIS FILE INTO SEVERAL SUBPARTS :)
// //////////////////////  VIZ DOWN THERE
// ////////////////////////
module.exports = {
	name: 'twitch',
	description: 'Manage your own twitch miner!',
	usage: 'create <username>/add (miner) <username>/delete (miner) <username>/list/permissions <add/remove> @mention/start/stop/restart',
	showHelp: true,
	async execute(message, args) {
		switch (args[0]) {
			case "create":
                // ///////////////
				break;
			case "destroy":
                // //////
				break;
			case "add":
                // /////////
				break;
			case "remove":
                // //////////
				break;
			case "list":
                // /////////////
				break;
			case "permissions":
                // /////////////////
				break;
			case "status":

				break;
			case "start":
                // ///////////
				break;
			case "stop":
                // //////////
				break;
			case "restart":
                // //////
				break;
			case "pass":

				break;
			default:
                // show miners with access to + status (running/stopped)
				return message.reply({ content: "" });
		}
	},
};