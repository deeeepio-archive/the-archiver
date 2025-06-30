import { fetchJson } from "../scrapers/shared.js";

const res = await fetchJson("https://api.deeeep.io/pets");
if (res.statusCode >= 400) {
	throw new Error("API is inaccessible");
}
