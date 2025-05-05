import fs from "node:fs";

const recursiveWriteFileSync = (path, content) => {
	const dir = path.split("/").slice(0, -1).join("/");
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	fs.writeFileSync(path, content);
};

fs.rmSync("client/assets", { recursive: true, force: true });

const html = await (await fetch("https://deeeep.io/")).text();
recursiveWriteFileSync("client/index.html", html);
const files = [
	/\/assets\/index\.[a-f0-9]+\.js/i,
	/\/assets\/vendor\.[a-f0-9]+\.js/i,
	/\/assets\/index\.[a-f0-9]+\.css/i,
	/\/assets\/vendor\.[a-f0-9]+\.css/i,
].map((r) => html.match(r)[0]);

for (const file of files) {
	const content = await (await fetch(`https://deeeep.io${file}`)).text();
	recursiveWriteFileSync(`client/${file}`, content);
}
