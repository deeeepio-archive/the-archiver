import fs from "node:fs";
import { getPath } from "../scrapers/shared.js";

const repos = ["forumPosts", "maps", "users"];
for (const repo of repos) {
	if (!fs.existsSync(`./${repo}`)) continue;
	const millions = fs.readdirSync(`./${repo}`);
	for (const million of millions) {
		if (Number.parseInt(million) != million) continue;
		const tenThousands = fs.readdirSync(`./${repo}/${million}`);
		for (const tenThousand of tenThousands) {
			const hundreds = fs.readdirSync(`./${repo}/${million}/${tenThousand}`);
			console.log(`Migrating ${repo}/${million}/${tenThousand} ...`);
			for (const hundred of hundreds) {
				const files = fs.readdirSync(
					`./${repo}/${million}/${tenThousand}/${hundred}`,
				);
				for (const file of files) {
					const newPath = `./${repo}/${getPath(file.split("/").pop().split(".")[0])}`;
					const newDir = newPath.split("/").slice(0, -1).join("/");
					if (!fs.existsSync(newDir)) {
						fs.mkdirSync(newDir, { recursive: true });
					}
					fs.renameSync(
						`./${repo}/${million}/${tenThousand}/${hundred}/${file}`,
						`./${repo}/${getPath(file.split("/").pop().split(".")[0])}`,
					);
				}
			}
		}
	}
}
