import fs from "node:fs";
import { fetchJson, getPath } from "../shared.js";

import progress from "../../playHistories/progress.json" with { type: "json" };

const fetchNums = 200;

const skips = [[[0, 303], 304]];
for (const skip of skips) {
	if (
		progress.playHistories > skip[0][0] &&
		progress.playHistories < skip[0][1]
	) {
		progress.playHistories = skip[1];
	}
}
let newProgress = { ...progress };

const getMap = async (id) => {
	const playHistory = await fetchJson(
		`https://api.deeeep.io/playHistories/${id}`,
	);
	if (playHistory.statusCode === 429) {
		return "throttled";
	}
	if (playHistory.statusCode >= 400) {
		throw new Error("Invalid response");
	}
	return playHistory;
};

let allInvalid = true;
const start = Date.now();
for (
	let i = progress.playHistories;
	i < progress.playHistories + fetchNums;
	i++
) {
	const time = Date.now();
	if (time - start > 4.5 * 60 * 1000) {
		console.log("Max time of 4.5 minutes reached!");
		break;
	}

	console.log("Fetching playHistory ID", i);
	newProgress.playHistories = i + 1;

	const playHistory = await getMap(i);
	if (playHistory === null) {
		continue;
	}
	if (playHistory === "throttled") {
		console.log("Rate limit reached!");
		newProgress.playHistories = i;
		break;
	}
	allInvalid = false;
	playHistory.archived_at = new Date().toJSON();

	const p = `playHistories/${getPath(i)}`;
	fs.mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true });
	fs.writeFileSync(p, JSON.stringify(playHistory, null, 2));
}
if (allInvalid && progress.playHistories > progress.newThreshold) {
	newProgress = { ...progress };
}
const end = Date.now();

console.log("Time:", (end - start) / 1000, "seconds");

fs.writeFileSync(
	"playHistories/progress.json",
	`${JSON.stringify(newProgress, null, 2)}\n`,
);
