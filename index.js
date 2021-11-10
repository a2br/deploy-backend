require("dotenv").config();
const crypto = require("crypto");
const express = require("express");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const execFile = require("child_process").execFile;
const app = express();

app.use(morgan("dev"));

app.use(
	express.json({
		verify: (req, res, buf, encoding) => {
			if (buf && buf.length) {
				req.rawBody = buf.toString(encoding || "utf8");
			}
		},
	})
);

app.use(function authorize(req, res, next) {
	if (req.method !== "POST") return next();

	const sig = Buffer.from(req.header("X-Hub-Signature-256") || "", "utf-8");
	const hmac = crypto.createHmac("sha256", process.env.GITHUB_SECRET);
	const digest = Buffer.from(
		"sha256" + "=" + hmac.update(req.rawBody).digest("hex"),
		"utf8"
	);

	if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
		res.status(401).send("Unauthorized");
	} else next();
});

app.post("/", function (req, res) {
	execFile("./deploy.sh", function (error, stdout, stderr) {
		if (error) throw error;
		console.log("Deployment initiated");
		console.log("====================");
		console.log(stdout);
		console.log("====================");
		res.status(200).send();
	});
});

app.get("/", function (req, res) {
	res.send("Server up.");
});

var server = app.listen(3420, function () {
	const { address: host, port } = server.address();
	console.log("Staging GitHooks App listening at http://%s:%s", host, port);
});
