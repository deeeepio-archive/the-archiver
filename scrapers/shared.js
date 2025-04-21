export const fetchJson = async (url) => {
	return await (await fetch(url)).json();
};

export const getPath = (number) => {
	return `${Math.floor(number / 1000000) * 1000000}/${Math.floor(number / 10000) * 10000}/${Math.floor(number / 100) * 100}/${number}.json`;
};
