import fs from "node:fs";

const header = `name: Archive

on:
  workflow_dispatch:

concurrency:
  group: "archive"
  cancel-in-progress: false

jobs:`;

const template = (n) =>
	`
  scrape-forumPosts-${n}:
    runs-on: ubuntu-latest${
			n === 1
				? ""
				: `
    needs: scrape-forumPosts-${n - 1}`
		}
    permissions:
      contents: write
    steps:
      - name: Checkout scraper
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main

      - name: Checkout forumPosts archive
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main
          sparse-checkout: .
          repository: deeeepio-archive/forumPosts
          path: forumPosts

      - name: Run forumPosts archive script
        run: |
          npm run scrape:forumPosts

      - name: Save changes to forumPosts archive
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: Update forumPosts archive
          repository: forumPosts
          add_options: --sparse

  scrape-maps-${n}:
    runs-on: ubuntu-latest${
			n === 1
				? ""
				: `
    needs: scrape-maps-${n - 1}`
		}
    permissions:
      contents: write
    steps:
      - name: Checkout scraper
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main

      - name: Checkout maps archive
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main
          sparse-checkout: .
          repository: deeeepio-archive/maps
          path: maps

      - name: Run maps archive script
        run: |
          npm run scrape:maps

      - name: Save changes to maps archive
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: Update maps archive
          repository: maps
          add_options: --sparse

  scrape-users-${n}:
    runs-on: ubuntu-latest${
			n === 1
				? ""
				: `
    needs: scrape-users-${n - 1}`
		}
    permissions:
      contents: write
    steps:
      - name: Checkout scraper
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main

      - name: Checkout users archive
        uses: actions/checkout@v4
        with:
          token: \${{ secrets.ACCESS_TOKEN }}
          ref: main
          sparse-checkout: .
          repository: deeeepio-archive/users
          path: users

      - name: Run users archive script
        run: |
          npm run scrape:users

      - name: Save changes to users archive
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: Update users archive
          repository: users
          add_options: --sparse
`;

const generateContent = (num) =>
	header +
	Array.from({ length: num })
		.map((_, i) => template(i + 1))
		.join("");

fs.writeFileSync(".github/workflows/run.yml", generateContent(10), "utf-8");
