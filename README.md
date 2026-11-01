# Bluesky Profiles, Posts & Followers (Public API)

Extract Bluesky data through Bluesky's own public, unauthenticated API. No login, no cookies, no browser, no proxies: fast, stable and cheap.

## Modes
- **posts**: an account's posts with text, timestamp, like / repost / reply / quote counts, hashtags, images and permalink. Optional replies, reposts and a "since" date.
- **profiles**: display name, bio, follower / following / post counts, creation date, avatar, labels.
- **followers / following**: an account's graph as profile rows.
- **searchAccounts**: find accounts by keyword (name, handle, bio).

## Typical uses
- Monitor a brand's, competitor's or journalist's account activity (schedule the Actor).
- Build lists of accounts in a niche from keyword search.
- Export an account's follower list for community analysis.
- Collect posts for sentiment or topic research on specific accounts.

## Input example
```json
{ "mode": "posts", "accounts": ["bsky.app", "https://bsky.app/profile/jay.bsky.team"], "maxItemsPerQuery": 200, "sinceDate": "2026-09-01" }
```

## Pricing
Pay per result: $0.0015 per item (post, profile or follower row). 1,000 posts cost $1.50.

## Limits
- Reads public data only, through the public AppView API. Keyword search over *posts* is not offered by Bluesky without authentication, so it is not included here; use account-based collection or searchAccounts.
- Accounts that opt out of public viewing, or are blocked or deleted, return nothing.
- Questions or a field you need? Open an issue on the Actor page; we reply quickly.


Hosted version (pay per result, no setup): https://apify.com/northgrid-data/bluesky-profiles-posts-followers
