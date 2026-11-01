'use strict';
// Bluesky public AppView (unauthenticated, documented XRPC endpoints).
const BASE = 'https://public.api.bsky.app/xrpc/';
const UA = 'Mozilla/5.0 (compatible; bluesky-public-data-actor)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function xrpc(method, params, tries = 5) {
    const url = BASE + method + '?' + new URLSearchParams(params).toString();
    let last;
    for (let i = 0; i < tries; i++) {
        try {
            const res = await fetch(url, { headers: { 'user-agent': UA, accept: 'application/json' } });
            if (res.status === 429) { await sleep(Number(res.headers.get('retry-after') || 5) * 1000); continue; }
            if (res.status >= 500) throw new Error('HTTP ' + res.status);
            if (res.status === 400) return null; // e.g. profile not found
            if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + method);
            return await res.json();
        } catch (e) { last = e; await sleep(1000 * (i + 1)); }
    }
    throw last;
}

function parseHandle(s) {
    let h = String(s).trim().replace(/^@/, '');
    const m = h.match(/bsky\.app\/profile\/([^/?#]+)/);
    if (m) h = m[1];
    return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(h) || /^did:[a-z]+:[\w.:%-]+$/.test(h) ? h.toLowerCase() : null;
}

function profileRow(p) {
    return {
        type: 'profile', did: p.did, handle: p.handle, displayName: p.displayName || null, description: p.description || null,
        followersCount: p.followersCount ?? null, followsCount: p.followsCount ?? null, postsCount: p.postsCount ?? null,
        createdAt: p.createdAt || null, avatar: p.avatar || null, banner: p.banner || null,
        url: `https://bsky.app/profile/${p.handle}`, labels: (p.labels || []).map((l) => l.val),
    };
}

function postRow(item) {
    const p = item.post, rec = p.record || {};
    const embed = p.embed || {};
    return {
        type: 'post', uri: p.uri, cid: p.cid, authorHandle: p.author.handle, authorDid: p.author.did,
        text: rec.text || '', createdAt: rec.createdAt, langs: rec.langs || [],
        likeCount: p.likeCount ?? 0, repostCount: p.repostCount ?? 0, replyCount: p.replyCount ?? 0, quoteCount: p.quoteCount ?? 0,
        isRepost: !!(item.reason && item.reason.$type === 'app.bsky.feed.defs#reasonRepost'),
        isReply: !!rec.reply, hashtags: (rec.text || '').match(/#[\p{L}\p{N}_]+/gu) || [],
        embedType: embed.$type || null, images: (embed.images || []).map((i) => i.fullsize),
        url: `https://bsky.app/profile/${p.author.handle}/post/${p.uri.split('/').pop()}`,
    };
}

async function getProfile(actor) {
    const p = await xrpc('app.bsky.actor.getProfile', { actor });
    return p ? profileRow(p) : null;
}

async function* authorPosts(actor, { max = 100, includeReplies = false, includeReposts = false, sinceDate } = {}) {
    const filter = includeReplies ? 'posts_with_replies' : 'posts_no_replies';
    let cursor, n = 0;
    const since = sinceDate ? new Date(sinceDate) : null;
    do {
        const j = await xrpc('app.bsky.feed.getAuthorFeed', { actor, limit: String(Math.min(100, max - n)), filter, ...(cursor ? { cursor } : {}) });
        if (!j) return;
        for (const it of j.feed) {
            const row = postRow(it);
            if (row.isRepost && !includeReposts) continue;
            if (since && !row.isRepost && new Date(row.createdAt) < since) { if (!it.post.viewer?.pinned) return; continue; }
            yield row; if (++n >= max) return;
        }
        cursor = j.cursor;
    } while (cursor);
}

async function* graph(kind, actor, max = 100) { // kind: 'getFollowers' | 'getFollows'
    let cursor, n = 0;
    const key = kind === 'getFollowers' ? 'followers' : 'follows';
    do {
        const j = await xrpc('app.bsky.graph.' + kind, { actor, limit: String(Math.min(100, max - n)), ...(cursor ? { cursor } : {}) });
        if (!j) return;
        for (const p of j[key]) { yield { ...profileRow(p), relation: key, ofActor: actor }; if (++n >= max) return; }
        cursor = j.cursor;
    } while (cursor);
}

async function* searchActors(q, max = 100) {
    let cursor, n = 0;
    do {
        const j = await xrpc('app.bsky.actor.searchActors', { q, limit: String(Math.min(100, max - n)), ...(cursor ? { cursor } : {}) });
        if (!j) return;
        for (const p of j.actors) { yield { ...profileRow(p), searchQuery: q }; if (++n >= max) return; }
        cursor = j.cursor;
    } while (cursor);
}

module.exports = { parseHandle, getProfile, authorPosts, graph, searchActors };
