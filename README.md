# url-to-markdown

`url-to-markdown` is a standalone Agent Skill that captures rendered webpages with Chrome CDP and saves clean Markdown or structured JSON. It supports generic pages, X/Twitter posts and threads, YouTube transcripts, Hacker News discussions, media downloads, and visible login or CAPTCHA workflows.

## Install

```bash
npx skills add https://github.com/BruceL017/url-to-markdown
```

The installable Skill lives in `url-to-markdown/`. Bun and Chrome or Chromium are required at runtime. On first use, the Skill installs the CLI dependencies under its own `scripts/` directory and asks where to store capture preferences.

## Use

```text
Use $url-to-markdown to save https://example.com/article as Markdown.
```

The default output layout is:

```text
./url-to-markdown/{domain}/{slug}/{slug}.md
```

Each URL receives an isolated directory. When media download is enabled, images and videos are saved beside the Markdown under `imgs/` and `videos/`.

## Runtime interfaces

- CLI: `url-to-markdown/scripts/url-to-markdown`
- Preference files: project `.url-to-markdown/EXTEND.md`, XDG `$XDG_CONFIG_HOME/url-to-markdown/EXTEND.md`, or user `$HOME/.url-to-markdown/EXTEND.md`
- Chrome profile override: `URL_TO_MARKDOWN_CHROME_PROFILE_DIR`
- Adapters: `x`, `youtube`, `hn`, and `generic`
- Formats: `markdown` and `json`

## Validate

```bash
bun install --cwd url-to-markdown/scripts --frozen-lockfile
bun test
```

## Source and license

This project is a standalone, renamed extraction of Jim Liu's upstream component at commit `6b7a2e417500561a5ecdd0b168332f4142584617`. The original MIT license and copyright notice are preserved. See [LICENSE](LICENSE) and [NOTICE](NOTICE) for exact provenance.
