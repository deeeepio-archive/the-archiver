import fs from "node:fs";
import { fetchJson, getPath } from "../shared.js";

import progress from "../../users/progress.json" with { type: "json" };

const fetchNums = 250;

const skips = [
	[[1051500, 1053000], 4916100],
	[[4916500, 4918000], 5192000],
	[[5192100, 5192400], 6311000],
	[[6312500, 6314000], 7140000],
	[[7166000, 7169000], 7839000],
	[[7841000, 7844000], 9022000],
	[[9023000, 9026000], 9227000],
	[[9228000, 9231000], 9370000],
	[[9370000, 9371000], 11833000],
	[[11834000, 11837000], 13860000],
	[[13861000, 13864000], 14004000],
	[[14008000, 14011000], 14828000],
	[[14852000, 14855000], 15023000],
	[[15024000, 15027000], 15290000],
	[[15291000, 15294000], 15771000],
	[[15772000, 15775000], 16899000],
	[[16900000, 16903000], 17055000],
	[[17056000, 17059000], 17683000],
	[[17684000, 17687000], 18134000],
	[[18135000, 18138000], 18765000],
	[[18766000, 18769000], 19225000],
	[[19226000, 19229000], 19394000],
	[[19395000, 19398000], 19538000],
	[[19539000, 19542000], 19605000],
	[[19606000, 19609000], 19786000],
	[[19787000, 19790000], 20686000],
];
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

let allInvalid = true;
const start = Date.now();
for (let i = progress.users; i < progress.users + fetchNums; i += 20) {
	try {
		const time = Date.now();
		if (time - start > 4.5 * 60 * 1000) {
			console.log("Max time of 4.5 minutes reached!");
			break;
		}

		console.log("Fetching user ID", i);
		newProgress.users = i + 20;

		const user = await getUser(i);
		if (user === null) {
			continue;
		}
		if (user === "throttled") {
			console.log("Rate limit reached!");
			newProgress.users = i;
			break;
		}
		allInvalid = false;
		user.archived_at = new Date().toJSON();

		const p = `users/${getPath(i)}`;
		fs.mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true });
		fs.writeFileSync(p, JSON.stringify(user, null, 2));
	} catch (e) {
		console.error(e);
	}
}
if (allInvalid && progress.users > progress.newThreshold) {
	newProgress.newThreshold = progress.users;
	newProgress.users = 0;
}
const end = Date.now();

console.log("Time:", (end - start) / 1000, "seconds");

fs.writeFileSync(
	"users/progress.json",
	`${JSON.stringify(newProgress, null, 2)}\n`,
);
