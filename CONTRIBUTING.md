# Contributing

Thanks for helping make this guide more accurate! / 欢迎帮忙让这份指南更准确！

## What's most useful

- **Fingering corrections.** Please say which pitch, which input you pressed, what you heard, and your game version.
- **New worked examples.** Songs that fit the B3–F5 range, or transposition tips for those that don't.
- **Translations and typo fixes.**

## How to contribute

1. Open an issue using the *Fingering correction* template, or fork the repo and open a pull request.
2. Keep English and Chinese docs in sync: [`docs/technical-analysis.md`](docs/technical-analysis.md) and [`docs/technical-analysis.zh-CN.md`](docs/technical-analysis.zh-CN.md).
3. Don't edit the files in `assets/images/` by hand — change [`tools/generate-diagrams.mjs`](tools/generate-diagrams.mjs) and regenerate (`node tools/generate-diagrams.mjs assets/images`), then re-render the PNGs.
4. If you change the fingering logic in [`src/ocarina.mjs`](src/ocarina.mjs), run `npm test`. One test checks the converter against the published fingering chart, so update the chart and the test together.

## Content guidelines

- Describe only what you have verified in the game or in a cited source.
- Don't add Nintendo's copyrighted assets (screenshots, artwork, audio). Original diagrams and your own screenshots are fine.
- Contributions to text and diagrams are licensed under [CC BY 4.0](LICENSE-CONTENT); contributions to code under [MIT](LICENSE).
