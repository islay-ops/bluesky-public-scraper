'use strict';
const { Actor, log } = require('apify');
const { parseHandle, getProfile, authorPosts, graph, searchActors } = require('./lib');

Actor.main(async () => {
    const input = (await Actor.getInput()) || {};
    const { mode = 'posts', accounts = [], searchQueries = [], maxItemsPerQuery = 100, includeReplies = false, includeReposts = false, sinceDate } = input;
    let total = 0;
    const push = async (row) => { await Actor.pushData(row, 'item'); total++; };
    const handles = [...new Set(accounts.map(parseHandle).filter(Boolean))];
    if (mode !== 'searchAccounts' && !handles.length) throw new Error('"accounts" needs Bluesky handles or profile URLs, e.g. bsky.app or https://bsky.app/profile/bsky.app');

    if (mode === 'profiles') {
        for (const h of handles) { const p = await getProfile(h); if (p) await push(p); else log.warning(`Profile not found: ${h}`); }
    } else if (mode === 'posts') {
        for (const h of handles) {
            let n = 0;
            for await (const r of authorPosts(h, { max: maxItemsPerQuery, includeReplies, includeReposts, sinceDate })) { await push(r); n++; }
            log.info(`${h}: ${n} posts`);
        }
    } else if (mode === 'followers' || mode === 'following') {
        for (const h of handles) {
            let n = 0;
            for await (const r of graph(mode === 'followers' ? 'getFollowers' : 'getFollows', h, maxItemsPerQuery)) { await push(r); n++; }
            log.info(`${h}: ${n} ${mode}`);
        }
    } else if (mode === 'searchAccounts') {
        if (!searchQueries.length) throw new Error('mode "searchAccounts" needs "searchQueries"');
        for (const q of searchQueries) { let n = 0; for await (const r of searchActors(q, maxItemsPerQuery)) { await push(r); n++; } log.info(`"${q}": ${n} accounts`); }
    } else throw new Error('Unknown mode ' + mode);
    await Actor.setValue('SUMMARY', { mode, items: total });
    log.info(`Done: ${total} items`);
});
