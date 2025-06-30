import fs from "node:fs";
import { fetchJson, getPath } from "../shared.js";

import progress from "../../maps/progress.json" with { type: "json" };

const fetchNums = 200;

const skips = [
	[[15819, 17000], 34078],
	[[34079, 35000], 43899],
	[[43957, 45000], 94995],
	[[94996, 96000], 147432],
	[[147433, 148000], 244170],
];
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
	if (map.statusCode >= 400 && map.statusCode < 450) {
		return null;
	}
	if (map.statusCode >= 450) {
		throw new Error("Invalid response");
	}
	return map;
};

let allInvalid = true;
const start = Date.now();
for (let i = progress.maps; i < progress.maps + fetchNums; i++) {
	const time = Date.now();
	if (time - start > 4.5 * 60 * 1000) {
		console.log("Max time of 4.5 minutes reached!");
		break;
	}

	console.log("Fetching map ID", i);
	newProgress.maps = i + 1;

	const map = await getMap(i);
	if (map === null) {
		continue;
	}
	if (map === "throttled") {
		console.log("Rate limit reached!");
		newProgress.maps = i;
		break;
	}
	allInvalid = false;

	const p = `maps/${getPath(i)}`;
	fs.mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(map, null, 2));
}
if (allInvalid && progress.maps > progress.newThreshold) {
	newProgress.newThreshold = progress.maps;
	newProgress.maps = 0;
}
const end = Date.now();

console.log("Time:", (end - start) / 1000, "seconds");

fs.writeFileSync(
	"maps/progress.json",
	`${JSON.stringify(newProgress, null, 2)}\n`,
);
