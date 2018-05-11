const Discord = require('discord.js');
const config = require("./config.json");
const client = new Discord.Client();

var mysql = require("mysql");

var sqlCon;			// MySQL connection

function createDatabaseConn() {
	sqlCon = mysql.createConnection({
		host: config.sqlHost,
		user: config.sqlUsername,
		password: config.sqlPassword,
		database: config.sqlDatabaseName
	});
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  createDatabaseConn();
});

var commands = {
	"ping": {
		usage: "[returns \"pong!\"]",
		process: function(client, msg, args) {
			msg.channel.send("pong!");
		}
	},
	"start": {
		process: function(client, msg, args) {
			// sqlCon.connect(function(err) { if (err) throw err; });
			let sql = "select current "
					+ "from Runs "
					+ "where current = true";

			sqlCon.query(sql, function(err, results, fields) {
				if (err) throw err;

				if (results.length > 0) {
					return msg.channel.send("There is already a run in progress");
				}
				else {
					sql = "insert into Runs (Current)"
						+ "values (true)"; 
					sqlCon.query(sql, function(err) { if (err) throw err; });
				}
			});
			// sqlCon.end();
		}
	},
	"stop": {
		process: function(client, msg, args) {
			let sql = "select * "
					+ "from Runs "
					+ "where Current = true";

			sqlCon.query(sql, function(err, results, fields) {
				if (err) throw err;

				if (results.length <= 0) {
					return msg.channel.send("There is no run to stop");
				}
				else if (results.length === 1) {
					sql = "update Runs "
						+ "set Current = false "
						+ " where ID = " + results[0].ID;

					sqlCon.query(sql, function(err) { if (err) throw err; })
				}
				else {
					msg.channel.send("Somehow multiple runs are current?")
				}
			});
		}
	}
}

function executeMessageCommand(msg) {
	const args = msg.content.slice(config.prefix.length).trim().split(/\s+/);
	const commandText = args.shift().toLowerCase();
	const cmd = commands[commandText];

	if (!msg.content.startsWith(config.prefix) || msg.author.bot) return;

	if (commandText === "help") {
		var arrayCommands = Object.keys(commands).sort();	// sort commands for output
		var reply = "";
		for (let i in arrayCommands) {
			reply += config.prefix + arrayCommands[i] + " " + commands[arrayCommands[i]].usage + "\n";
		}
		msg.channel.send(reply);
	}
	else if (cmd) {
		cmd.process(client, msg, args);
	}
}

client.on("message", (msg) => executeMessageCommand(msg));

client.login(config.token);