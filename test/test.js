'use strict';
const assert = require('assert');
const { parseHandle, getProfile, authorPosts, graph, searchActors } = require('../lib');
(async () => {
    assert.strictEqual(parseHandle('@bsky.app'), 'bsky.app');
    assert.strictEqual(parseHandle('https://bsky.app/profile/bsky.app'), 'bsky.app');
    assert.strictEqual(parseHandle('nonsense'), null);
    const p = await getProfile('bsky.app');
    assert(p && p.did.startsWith('did:') && p.followersCount > 1000 && p.handle === 'bsky.app', 'profile');
    assert.strictEqual(await getProfile('this-handle-does-not-exist-9981.bsky.social'), null);
    const posts = []; const seen = new Set();
    for await (const r of authorPosts('bsky.app', { max: 120 })) { assert(!seen.has(r.uri), 'dup'); seen.add(r.uri); posts.push(r); }
    assert(posts.length >= 100, 'posts ' + posts.length);
    assert(posts[0].text !== undefined && posts[0].createdAt && posts[0].url.startsWith('https://bsky.app/profile/'));
    const f = []; for await (const r of graph('getFollowers', 'bsky.app', 150)) f.push(r);
    assert(f.length === 150, 'followers ' + f.length);
    const s = []; for await (const r of searchActors('news', 30)) s.push(r);
    assert(s.length >= 10, 'search ' + s.length);
    console.log('OK posts', posts.length, 'followers', f.length, 'search', s.length);
})().catch((e) => { console.error('FAIL', e); process.exit(1); });
