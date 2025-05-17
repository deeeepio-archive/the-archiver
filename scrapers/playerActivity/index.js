import fs from "node:fs";

const date = new Date();

const data = await (
	await fetch("https://api.deeeep.io/hosts?servers=1")
).json();

const hosts = JSON.parse(fs.readFileSync("playerActivity/hosts.json", "utf-8"));
for (const host of data.hosts) {
	hosts[host.id] = host;

	let activityData = "";
	const file = `playerActivity/records/${host.id}/${host.id}-${date.getUTCFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}.csv`;
	if (fs.existsSync(file)) {
		activityData = fs.readFileSync(file, "utf-8");
	} else {
		activityData = "timestamp,player_count\n";
	}
	activityData += `${data.time},${host.users}\n`;
	try {
		fs.mkdirSync(file.split("/").slice(0, -1).join("/"), { recursive: true });
	} catch {}
	fs.writeFileSync(file, activityData, "utf-8");
}
fs.writeFileSync(
	"playerActivity/hosts.json",
	JSON.stringify(hosts, null, 2),
	"utf-8",
);
