# Introduction

Thank you for considering contributing to offerpool. Prior to submitting a PR, consider creating an issue to discuss what you plan to work on.

# Translation

To contribute a new translation check out the repository:

1. `cd` to `./client`
1. Run `npm install`
1. In `.linguirc` add your locale to the local array
1. Run `npm run extract` to generate the local file in `./client/src/locales/{locale}/messages.po`
1. Edit `messages.po` with local strings
1. Add the language in `./client/src/i18n.js`
1. To test locally, run offerpool as described in `./README.md` and navigate to `http://localhost:3001?lang={locale}`
1. Create a PR and I will confrim that it works
