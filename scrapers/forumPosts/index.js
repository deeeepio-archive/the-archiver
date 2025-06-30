import fs from "node:fs";
import { fetchJson, getPath } from "../shared.js";

import progress from "../../forumPosts/progress.json" with { type: "json" };
import regionCache from "../../forumPosts/regionCache.json" with {
	type: "json",
};

const fetchNums = 100;

const skips = [];
for (const skip of skips) {
	if (progress.forumPosts > skip[0][0] && progress.forumPosts < skip[0][1]) {
		progress.forumPosts = skip[1];
	}
}
const newProgress = { ...progress };
const newRegionCache = { ...regionCache };

const regions = ["en", "zh", "pt", "es", "bork", "tr", "ru", "vi", "pl"];
const getRegion = async (id) => {
	const cached = newRegionCache[id];
	if (cached) {
		const post = await fetchJson(
			`https://api.deeeep.io/forumPosts/${cached}/${id}`,
		);
		if (post.statusCode >= 400) {
			throw new Error("Invalid response");
		}
		return { post, region: cached };
	}

	for (const region of regions) {
		const post = await fetchJson(
			`https://api.deeeep.io/forumPosts/${region}/${id}`,
		);
		if (!post.statusCode) {
			return { post, region };
		}
		if (post.statusCode === 429) {
			return { post: "throttled", region: null };
		}
		if (post.statusCode >= 450) {
			throw new Error("Invalid response");
		}
	}
	return { post: null, region: null };
};
const getPost = async (id) => {
	const { post, region } = await getRegion(id);
	if (post === null) {
		return null;
	}
	if (post === "throttled") {
		return "throttled";
	}
	const comments = await fetchJson(
		`https://api.deeeep.io/forumPosts/${region}/${id}/comments`,
	);
	newRegionCache[id] = region;
	return {
		...post,
		comments,
	};
};

let allInvalid = true;
const start = Date.now();
for (let i = progress.forumPosts; i < progress.forumPosts + fetchNums; i++) {
	try {
		const time = Date.now();
		if (time - start > 4.5 * 60 * 1000) {
			console.log("Max time of 4.5 minutes reached!");
			break;
		}

		console.log("Fetching forum post ID", i);
		newProgress.forumPosts = i + 1;

		const post = await getPost(i);
		if (post === null) {
			continue;
		}
		if (post === "throttled") {
			console.log("Rate limit reached!");
			newProgress.forumPosts = i;
			break;
		}
		allInvalid = false;

		const p = `forumPosts/${getPath(i)}`;
		fs.mkdirSync(p.split("/").slice(0, -1).join("/"), { recursive: true });
		fs.writeFileSync(p, JSON.stringify(post, null, 2));
	} catch (e) {
		console.error(e);
	}
}
if (allInvalid && progress.forumPosts > progress.newThreshold) {
	newProgress.newThreshold = progress.forumPosts;
	newProgress.forumPosts = 0;
}
const end = Date.now();

console.log("Time:", (end - start) / 1000, "seconds");

fs.writeFileSync(
	"forumPosts/progress.json",
	`${JSON.stringify(newProgress, null, 2)}\n`,
);
fs.writeFileSync("forumPosts/regionCache.json", JSON.stringify(newRegionCache));
