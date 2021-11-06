require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const execFile = require("child_process").execFile;
const app = express();

GITHUB_SHA1 = "sha1=" + process.env.GITHUB_SHA1;
GITHUB_SHA256 = "sha256=" + process.env.GITHUB_SHA256;

app.use(express.json());
app.use(morgan("dev"));

app.use((req, res, next) => {
	const sha1 = req.headers["x-hub-signature"];
	const sha256 = req.headers["x-hub-signature-256"];
	if (sha1 === GITHUB_SHA1 && sha256 === GITHUB_SHA256) {
		next();
	} else {
		res.status(403).send("Forbidden");
	}
});

app.get("/", function (req, res) {
	res.send("Server up.");
});

app.post("/", function (req, res) {
	execFile("./deploy.sh", function (error, stdout, stderr) {
		if (err) throw err;
		console.log("Deployment initiated");
		res.status(200).send();
	});
});

var server = app.listen(3420, function () {
	const { address: host, port } = server.address();
	console.log("Staging GitHooks App listening at http://%s:%s", host, port);
});
