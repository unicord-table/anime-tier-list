# Contributing

Thanks for helping out. Read [`.docs/04-decisions.md`](.docs/04-decisions.md)
before adding anything — it lists what was deliberately skipped and what would
have to be true to un-skip it.

## Before you open a PR

```bash
npm run typecheck && npm run lint && npm test
```

## Licensing of contributions

This project is [MIT licensed](LICENSE). By opening a pull request you agree
that your contribution is licensed under the MIT License, and that you have the
right to license it (it's your own work, or you have permission from whoever
owns it).

There is no CLA to sign. Inbound = outbound.

Don't paste in code copied from another project unless it's MIT/BSD/ISC/Apache-2.0
licensed and you keep its copyright notice — GPL or LGPL code cannot be merged
here without relicensing the whole project.

## Third-party data and assets

Anime metadata and cover images come from the AniList API at runtime and are not
redistributed in this repo. They are not covered by this project's licence — use
of them is governed by AniList's terms and by whoever holds copyright in the
artwork. Don't check anime images or scraped catalogue dumps into the repo.
