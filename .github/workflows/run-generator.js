import fs from "node:fs";

const header = `name: Archive

on:
  workflow_dispatch:

concurrency:
  group: "archive"
  cancel-in-progress: false

jobs:`;

const template = (type, num) =>
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
          sparse-checkout: .
          repository: deeeepio-archive/${type}
          path: ${type}

      - name: Run ${type} archive script
        run: |
          npm run scrape:${type}

      - name: Save changes to ${type} archive
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: Update ${type} archive
          repository: ${type}
          add_options: --sparse
`;

const types = ["forumPosts", "maps", "playerActivity", "users"];
const generateContent = (scrapers) => {
	let file = header;
	const maxLength = Math.max(...Object.values(scrapers));
	for (let i = 1; i <= maxLength; i++) {
		for (const type of types) {
			if (scrapers[type] >= i) {
				file += template(type, i);
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
		playerActivity: 1,
		users: 8,
	}),
	"utf-8",
);
