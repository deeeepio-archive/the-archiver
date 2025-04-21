import fs from "node:fs";
import { fetchJson, getPath } from "../shared.js";

import progress from "./progress.json" with { type: "json" };

const fetchNums = 100;

const skips = [];
for (const skip of skips) {
	if (progress.maps > skip[0][0] && progress.maps < skip[0][1]) {
		progress.maps = skip[1];
	}
}
const newProgress = { ...progress };

const getMap = async (id) => {
	const map = await fetchJson(`https://api.deeeep.io/maps/${id}`);
	if (map.statusCode === 429) {
		return "throttled";
	}
	if (map.statusCode >= 400) {
		return null;
	}
	return map;
};

const start = Date.now();
for (let i = progress.maps; i < progress.maps + fetchNums; i++) {
	try {
		const time = Date.now();
		if (time - start > 4.5 * 60 * 1000) {
			console.log("Max time of 4.5 minutes reached!");
			break;
		}

		console.log("Fetching map ID", i);

		const map = await getMap(i);
		if (map === null) {
			if (i < newProgress.newThreshold) {
				newProgress.maps = i + 1;
			}
			continue;
		}
		if (map === "throttled") {
			console.log("Rate limit reached!");
			newProgress.maps = i;
			break;
		}
		map.archived_at = new Date().toJSON();

		const p = `maps/${getPath(i)}`;
		fs.mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true });
		fs.writeFileSync(p, JSON.stringify(map, null, 2));

		newProgress.maps = i + 1;

		await new Promise((resolve) => setTimeout(resolve, 150));
	} catch (e) {
		console.error(e);
	}
}
const end = Date.now();

console.log("Time:", (end - start) / 1000, "seconds");

fs.writeFileSync(
	"scrapers/maps/progress.json",
	`${JSON.stringify(newProgress, null, 2)}\n`,
);
