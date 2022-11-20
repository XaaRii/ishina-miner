var http = require('http');
const fs = require('fs');

http.createServer(function (req, res) {
	res.write("Hey, look! There was an accident... i guess... \n What the hell happened here..?\n\n(Tip: you can help them by making a file named: uncrash)");
	res.end();
}).listen(8080);

var file = './uncrash';
function antireboot() {
	fs.access(file, fs.constants.F_OK, (err) => {
		if (!err) {
			fs.rm(file, () => {
				process.exit();
			});
		}
	});
}
setInterval(antireboot, 10000);