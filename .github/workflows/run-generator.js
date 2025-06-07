import fs from "node:fs";

const header = `name: Archive

on:
  workflow_dispatch:

concurrency:
  group: "archive"
  cancel-in-progress: false

jobs:`;

const template = (type, num, sparse) =>
	`
  scrape-${type}-${num}:
    runs-on: ubuntu-latest${
			num === 1
				? ""
				: `
    needs: scrape-${type}-${num - 1}`
		}
    permissions:
      contents: write
    steps:
      - name: Checkout scraper
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main

      - name: Checkout ${type} archive
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main
          ${
						sparse
							? `sparse-checkout: .
          `
							: ""
					}repository: deeeepio-archive/${type}
          path: ${type}

      - name: Run ${type} archive script
        run: |
          npm run scrape:${type}

      - name: Save changes to ${type} archive
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: Update ${type} archive
          repository: ${type}${
						sparse
							? `
          add_options: --sparse`
							: ""
					}
`;

const generateContent = (scrapers) => {
	let file = header;
	const maxLength = Math.max(
		...Object.values(scrapers).map((n) => (typeof n === "number" ? n : n[0])),
	);
	const types = Object.keys(scrapers);
	for (let i = 1; i <= maxLength; i++) {
		for (const type of types) {
			const n =
				typeof scrapers[type] === "number" ? scrapers[type] : scrapers[type][0];
			const sparse =
				typeof scrapers[type] === "number" ? true : scrapers[type][1];
			if (n >= i) {
				file += template(type, i, sparse);
			}
		}
	}
	return file;
};

fs.writeFileSync(
	".github/workflows/run.yml",
	generateContent({
		forumPosts: 9,
		maps: 9,
		playerActivity: [1, false],
		playHistories: 7,
		users: 8,
	}),
	"utf-8",
);
