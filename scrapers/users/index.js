import fs from "node:fs";
import { fetchJson, getPath } from "../shared.js";

import progress from "../../users/progress.json" with { type: "json" };

const fetchNums = 150;

const skips = [[[811497, 830000], 20686948]];
for (const skip of skips) {
	if (progress.users > skip[0][0] && progress.users < skip[0][1]) {
		progress.users = skip[1];
	}
}
const newProgress = { ...progress };

const getUser = async (id) => {
	const user = await fetchJson(`https://api.deeeep.io/users/${id}?ref=profile`);
	if (user.statusCode === 429) {
		return "throttled";
	}
	if (user.statusCode >= 400) {
		return null;
	}
	const [socialNetworks, userStats, creationsMaps, creationsSkins] =
		await Promise.all([
			fetchJson(`https://api.deeeep.io/socialNetworks/u/${id}`),
			fetchJson(`https://api.deeeep.io/userStats/${id}`),
			fetchJson(
				`https://api.deeeep.io/maps/u/${id}?page=1&count=10000&orderBy=created_at&direction=DESC`,
			),
			fetchJson(`https://api.deeeep.io/skins/creator/${id}`),
		]);
	if (
		socialNetworks.statusCode === 429 ||
		userStats.statusCode === 429 ||
		creationsMaps.statusCode === 429 ||
		creationsSkins.statusCode === 429
	) {
		return "throttled";
	}

	return {
		...user,
		social_networks: socialNetworks,
		user_stats: userStats,
		creations: {
			maps: creationsMaps,
			skins: creationsSkins,
		},
	};
};

const start = Date.now();
for (let i = progress.users; i < progress.users + fetchNums; i++) {
	try {
		const time = Date.now();
		if (time - start > 4.5 * 60 * 1000) {
			console.log("Max time of 4.5 minutes reached!");
			break;
		}

		console.log("Fetching user ID", i);

		const user = await getUser(i);
		if (user === null) {
			if (i < newProgress.newThreshold) {
				newProgress.users = i + 1;
			}
			continue;
		}
		if (user === "throttled") {
			console.log("Rate limit reached!");
			newProgress.users = i;
			break;
		}
		user.archived_at = new Date().toJSON();

		const p = `users/${getPath(i)}`;
		fs.mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true });
		fs.writeFileSync(p, JSON.stringify(user, null, 2));

		newProgress.users = i + 1;
	} catch (e) {
		console.error(e);
	}
}
const end = Date.now();

console.log("Time:", (end - start) / 1000, "seconds");

fs.writeFileSync(
	"users/progress.json",
	`${JSON.stringify(newProgress, null, 2)}\n`,
);
