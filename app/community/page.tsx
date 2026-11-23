"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, CircleAlert, Heart, LoaderCircle, LockKeyhole, MessageCircle, Plus, Send, Shield, Sparkles, Users, HandHeart, BookMarked, MoreHorizontal, Copy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import "./community.css";

type Tab = "feed" | "prayer" | "groups";
type CommunityPost = { id: string; author_id: string; body: string; post_type: string; scripture_reference: string | null; created_at: string; };
type Prayer = { id: string; author_id: string; title: string; body: string; visibility: string; status: string; created_at: string; };
type Group = { id: string; created_by: string; name: string; description: string; visibility: "public" | "private"; created_at: string; };
type MemberProfile = { user_id: string; display_name: string; avatar_url: string | null; bio: string; };
type Comment = { id: string; post_id: string; author_id: string; body: string; created_at: string; };

const supabase = createClient();
const timeAgo = (value: string) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400) return Math.floor(seconds / 3600) + "h ago";
  return Math.floor(seconds / 86400) + "d ago";
};

export default function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("OrPath member");
  const [profiles, setProfiles] = useState<Record<string, MemberProfile>>({});
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({});
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [myReactions, setMyReactions] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentAuthors, setCommentAuthors] = useState<Record<string, MemberProfile>>({});
  const [activeComments, setActiveComments] = useState("");
  const [postBody, setPostBody] = useState("");
  const [postType, setPostType] = useState("reflection");
  const [scripture, setScripture] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [prayerTitle, setPrayerTitle] = useState("");
  const [prayerBody, setPrayerBody] = useState("");
  const [prayerVisibility, setPrayerVisibility] = useState("public");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupVisibility, setGroupVisibility] = useState<"public" | "private">("public");
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadProfiles = useCallback(async (ids: string[]) => {
    const unique = [...new Set(ids.filter(Boolean))];
    if (!unique.length) return;
    const { data } = await supabase.from("community_profiles").select("user_id,display_name,avatar_url,bio").in("user_id", unique);
    if (data) setProfiles(previous => ({ ...previous, ...Object.fromEntries(data.map(p => [p.user_id, p as MemberProfile])) }));
  }, []);

  const loadAll = useCallback(async () => {
    setError("");
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      const pendingInvite = new URLSearchParams(window.location.search).get("invite");
      const destination = pendingInvite ? "/community?invite=" + encodeURIComponent(pendingInvite) : "/community";
      window.location.href = "/auth?next=" + encodeURIComponent(destination);
      return;
    }
    setUserId(auth.user.id);
    const inviteToken = new URLSearchParams(window.location.search).get("invite");
    if (inviteToken) {
      const { data: joined, error: inviteError } = await supabase.rpc("community_join_group_by_invite", { invite_token: inviteToken });
      if (inviteError) setError(inviteError.message);
      else if (joined?.[0]?.joined_group_name) setMessage("You joined " + joined[0].joined_group_name + ". Welcome!");
      window.history.replaceState({}, "", "/community");
    }
    const { data: baseProfile } = await supabase.from("profiles").select("display_name,avatar_url").eq("id", auth.user.id).maybeSingle();
    const name = baseProfile?.display_name || auth.user.user_metadata?.full_name || auth.user.email?.split("@")[0] || "OrPath member";
    setDisplayName(name);
    const { data: ownCommunityProfile } = await supabase.from("community_profiles").select("user_id").eq("user_id", auth.user.id).maybeSingle();
    if (!ownCommunityProfile) {
      await supabase.from("community_profiles").insert({ user_id: auth.user.id, display_name: name, avatar_url: baseProfile?.avatar_url || null });
    }

    const [postResult, prayerResult, groupResult, membershipResult] = await Promise.all([
      supabase.from("community_posts").select("id,author_id,body,post_type,scripture_reference,created_at").eq("status", "published").order("created_at", { ascending: false }).limit(40),
      supabase.from("community_prayer_requests").select("id,author_id,title,body,visibility,status,created_at").in("status", ["active","answered"]).order("created_at", { ascending: false }).limit(50),
      supabase.from("community_groups").select("id,created_by,name,description,visibility,created_at").order("created_at", { ascending: false }).limit(60),
      supabase.from("community_group_members").select("group_id,status").eq("user_id", auth.user.id),
    ]);
    if (postResult.error) setError(postResult.error.message);
    if (prayerResult.error) setError(prayerResult.error.message);
    if (groupResult.error) setError(groupResult.error.message);
    const postRows = (postResult.data || []) as CommunityPost[];
    const prayerRows = (prayerResult.data || []) as Prayer[];
    const groupRows = (groupResult.data || []) as Group[];
    setPosts(postRows); setPrayers(prayerRows); setGroups(groupRows);
    setMemberships(Object.fromEntries((membershipResult.data || []).map(m => [m.group_id, m.status])));
    const ids = [...postRows.map(p => p.author_id), ...prayerRows.filter(p => p.visibility !== "anonymous").map(p => p.author_id), ...groupRows.map(g => g.created_by)];
    await loadProfiles(ids);
    if (postRows.length) {
      const postIds = postRows.map(p => p.id);
      const [reactionResult, commentResult] = await Promise.all([
        supabase.from("community_reactions").select("post_id,user_id").in("post_id", postIds),
        supabase.from("community_comments").select("post_id").in("post_id", postIds),
      ]);
      const reactions = reactionResult.data || [];
      const counts: Record<string, number> = {}, mine: Record<string, boolean> = {}, commentsByPost: Record<string, number> = {};
      reactions.forEach(r => { counts[r.post_id] = (counts[r.post_id] || 0) + 1; if (r.user_id === auth.user!.id) mine[r.post_id] = true; });
      (commentResult.data || []).forEach(c => { commentsByPost[c.post_id] = (commentsByPost[c.post_id] || 0) + 1; });
      setReactionCounts(counts); setMyReactions(mine); setCommentCounts(commentsByPost);
    }
    setLoading(false);
  }, [loadProfiles]);

  useEffect(() => { void loadAll(); }, [loadAll]);

  const submitPost = async () => {
    if (!postBody.trim() || busy) return;
    setBusy(true); setError(""); setMessage("");
    const { error: saveError } = await supabase.from("community_posts").insert({
      author_id: userId, body: postBody.trim(), post_type: postType,
      scripture_reference: scripture.trim() || null,
    });
    if (saveError) setError(saveError.message);
    else { setPostBody(""); setScripture(""); setPostType("reflection"); setMessage("Your post is now part of the community."); await loadAll(); }
    setBusy(false);
  };

  const toggleAmen = async (postId: string) => {
    if (busy) return;
    setBusy(true);
    const result = myReactions[postId]
      ? await supabase.from("community_reactions").delete().eq("post_id", postId).eq("user_id", userId)
      : await supabase.from("community_reactions").insert({ post_id: postId, user_id: userId, reaction: "amen" });
    if (result.error) setError(result.error.message);
    else {
      setMyReactions(old => ({ ...old, [postId]: !old[postId] }));
      setReactionCounts(old => ({ ...old, [postId]: Math.max(0, (old[postId] || 0) + (myReactions[postId] ? -1 : 1)) }));
    }
    setBusy(false);
  };

  const openComments = async (postId: string) => {
    if (activeComments === postId) { setActiveComments(""); return; }
    setActiveComments(postId); setComments([]);
    const { data, error: loadError } = await supabase.from("community_comments").select("id,post_id,author_id,body,created_at").eq("post_id", postId).order("created_at", { ascending: true }).limit(50);
    if (loadError) setError(loadError.message);
    const rows = (data || []) as Comment[];
    setComments(rows);
    const ids = rows.map(c => c.author_id);
    if (ids.length) {
      const { data: authors } = await supabase.from("community_profiles").select("user_id,display_name,avatar_url,bio").in("user_id", ids);
      if (authors) setCommentAuthors(Object.fromEntries(authors.map(p => [p.user_id, p as MemberProfile])));
    }
  };

  const submitComment = async (postId: string) => {
    if (!commentBody.trim() || busy) return;
    setBusy(true);
    const { error: saveError } = await supabase.from("community_comments").insert({ post_id: postId, author_id: userId, body: commentBody.trim() });
    if (saveError) setError(saveError.message);
    else { setCommentBody(""); const { data: refreshed } = await supabase.from("community_comments").select("id,post_id,author_id,body,created_at").eq("post_id", postId).order("created_at", { ascending: true }).limit(50); const rows = (refreshed || []) as Comment[]; setComments(rows); const ids = rows.map(item => item.author_id); if (ids.length) { const { data: authors } = await supabase.from("community_profiles").select("user_id,display_name,avatar_url,bio").in("user_id", ids); if (authors) setCommentAuthors(Object.fromEntries(authors.map(item => [item.user_id, item as MemberProfile]))); } setCommentCounts(old => ({ ...old, [postId]: rows.length })); }
    setBusy(false);
  };

  const submitPrayer = async () => {
    if (!prayerBody.trim() || busy) return;
    setBusy(true); setError(""); setMessage("");
    const { error: saveError } = await supabase.from("community_prayer_requests").insert({
      author_id: userId, title: prayerTitle.trim() || "Prayer request",
      body: prayerBody.trim(), visibility: prayerVisibility,
    });
    if (saveError) setError(saveError.message);
    else { setPrayerTitle(""); setPrayerBody(""); setMessage(prayerVisibility === "private" ? "Your private prayer request has been saved." : "Your prayer request has been shared."); await loadAll(); }
    setBusy(false);
  };

  const createGroup = async () => {
    if (groupName.trim().length < 3 || busy) return;
    setBusy(true); setError(""); setMessage("");
    const { error: saveError } = await supabase.from("community_groups").insert({
      created_by: userId, name: groupName.trim(), description: groupDescription.trim(), visibility: groupVisibility,
    });
    if (saveError) setError(saveError.message);
    else { setGroupName(""); setGroupDescription(""); setShowGroupForm(false); setMessage("Your study group has been created."); await loadAll(); }
    setBusy(false);
  };

  const joinGroup = async (group: Group) => {
    if (busy || memberships[group.id]) return;
    setBusy(true);
    const status = group.visibility === "public" ? "active" : "pending";
    const { error: joinError } = await supabase.from("community_group_members").insert({ group_id: group.id, user_id: userId, status });
    if (joinError) setError(joinError.message);
    else { setMemberships(old => ({ ...old, [group.id]: status })); setMessage(status === "pending" ? "Your request has been sent to the group owner." : "You joined the group."); }
    setBusy(false);
  };

  const createGroupInvite = async (groupId: string) => {
    const { data, error: inviteError } = await supabase.from("community_group_invites").insert({ group_id: groupId, created_by: userId }).select("id").single();
    if (inviteError || !data) { setError(inviteError?.message || "Could not create the invitation."); return; }
    const inviteUrl = window.location.origin + "/community?invite=" + data.id;
    try { await navigator.clipboard.writeText(inviteUrl); setMessage("Private group invitation copied. Share it with the people you want to invite."); }
    catch { setMessage("Invitation created: " + inviteUrl); }
  };

  const reportPost = async (postId: string) => {
    const reason = window.prompt("What should the OrPath moderation team review?");
    if (!reason?.trim()) return;
    const { error: reportError } = await supabase.from("community_reports").insert({ reporter_id: userId, target_type: "post", target_id: postId, reason: reason.trim() });
    if (reportError) setError(reportError.message); else setMessage("Thank you. Your report has been sent for review.");
  };

  const profileFor = (id: string) => profiles[id];
  const ownName = displayName || "OrPath member";

  return (
    <main className="community-app">
      <header className="community-topbar">
        <Link href="/dashboard" className="community-back"><ArrowLeft size={17}/> Dashboard</Link>
        <Link href="/" className="community-brand"><span className="community-brand-mark"><BookOpen size={19}/></span><span>orpath<span>.</span><small>LET THE WORD LEAD</small></span></Link>
        <Link href="/account" className="community-account">{ownName.slice(0,1).toUpperCase()}</Link>
      </header>
      <div className="community-layout">
        <aside className="community-intro">
          <span className="community-eyebrow"><Sparkles size={13}/> A PLACE TO GROW TOGETHER</span>
          <h1>Faith grows<br/><em>in fellowship.</em></h1>
          <p>Share what the Word is teaching you, pray for one another, and find people to walk with.</p>
          <div className="community-scripture"><span>“</span><p>And let us consider one another to provoke unto love and to good works.</p><strong>HEBREWS 10:24 · KJV</strong></div>
          <div className="community-guideline"><Shield size={17}/><div><strong>A thoughtful space</strong><p>Lead with grace. Respect privacy. Encourage one another in the Word.</p></div></div>
        </aside>

        <section className="community-main">
          <div className="community-heading">
            <div><span className="community-eyebrow">ORPATH COMMUNITY</span><h2>Welcome, {ownName.split(" ")[0]}.</h2><p>A little encouragement can change someone&apos;s day.</p></div>
            <div className="community-member-chip"><Users size={15}/> For OrPath members</div>
          </div>
          <nav className="community-tabs" aria-label="Community sections">
            <button className={tab === "feed" ? "active" : ""} onClick={() => setTab("feed")}><MessageCircle size={16}/> Feed</button>
            <button className={tab === "prayer" ? "active" : ""} onClick={() => setTab("prayer")}><HandHeart size={16}/> Prayer Wall</button>
            <button className={tab === "groups" ? "active" : ""} onClick={() => setTab("groups")}><Users size={16}/> Study Groups</button>
          </nav>

          {message && <div className="community-notice success"><Check size={15}/>{message}<button onClick={() => setMessage("")}>Dismiss</button></div>}
          {error && <div className="community-notice error"><CircleAlert size={15}/>{error}<button onClick={() => setError("")}>Dismiss</button></div>}

          {loading ? <div className="community-loading"><LoaderCircle className="spin" size={22}/> Preparing your community…</div> : <>
            {tab === "feed" && <>
              <section className="community-compose">
                <div className="community-compose-avatar">{ownName.slice(0,1).toUpperCase()}</div>
                <div className="community-compose-fields">
                  <label htmlFor="community-post">Share a reflection, testimony, question or encouragement…</label>
                  <textarea id="community-post" value={postBody} onChange={e => setPostBody(e.target.value)} maxLength={3000} rows={3} placeholder="What has the Word been teaching you lately?"/>
                  <div className="community-compose-meta">
                    <select value={postType} onChange={e => setPostType(e.target.value)} aria-label="Post type">
                      <option value="reflection">Reflection</option><option value="testimony">Testimony</option><option value="question">Question</option><option value="encouragement">Encouragement</option>
                    </select>
                    <input value={scripture} onChange={e => setScripture(e.target.value)} placeholder="Scripture reference (optional)" aria-label="Scripture reference"/>
                    <button className="community-primary" onClick={submitPost} disabled={!postBody.trim() || busy}><Send size={14}/> Share</button>
                  </div>
                </div>
              </section>
              <div className="community-feed-label"><span>COMMUNITY FEED</span><span>{posts.length} recent posts</span></div>
              {posts.length ? posts.map(post => {
                const author = profileFor(post.author_id);
                return <article className="community-post" key={post.id}>
                  <div className="community-post-head">
                    <div className="community-post-avatar">{(author?.display_name || "O").slice(0,1).toUpperCase()}</div>
                    <div className="community-post-author"><strong>{author?.display_name || "OrPath member"}</strong><span>{timeAgo(post.created_at)} · {post.post_type}</span></div>
                    <button className="community-more" title="Report post" onClick={() => void reportPost(post.id)}><MoreHorizontal size={19}/></button>
                  </div>
                  <p className="community-post-body">{post.body}</p>
                  {post.scripture_reference && <div className="community-post-scripture"><BookMarked size={14}/>{post.scripture_reference}</div>}
                  <div className="community-post-actions">
                    <button className={myReactions[post.id] ? "reacted" : ""} onClick={() => void toggleAmen(post.id)}><Heart size={15} fill={myReactions[post.id] ? "currentColor" : "none"}/> Amen <span>{reactionCounts[post.id] || 0}</span></button>
                    <button onClick={() => void openComments(post.id)}><MessageCircle size={15}/> Comments <span>{commentCounts[post.id] || 0}</span></button>
                  </div>
                  {activeComments === post.id && <div className="community-comments">
                    {comments.map(comment => <div className="community-comment" key={comment.id}><strong>{commentAuthors[comment.author_id]?.display_name || "OrPath member"}</strong><p>{comment.body}</p></div>)}
                    <div className="community-comment-form"><input value={commentBody} onChange={e => setCommentBody(e.target.value)} maxLength={1200} placeholder="Write an encouraging reply…"/><button onClick={() => void submitComment(post.id)} disabled={!commentBody.trim() || busy}><Send size={15}/></button></div>
                  </div>}
                </article>;
              }) : <div className="community-empty"><MessageCircle size={26}/><strong>The first encouragement can start here.</strong><p>Share a Scripture reflection or testimony with the community.</p></div>}
            </>}

            {tab === "prayer" && <>
              <section className="community-form-card">
                <div className="community-form-title"><div><span className="community-eyebrow">PRAY WITH ONE ANOTHER</span><h3>Share a prayer request</h3></div><HandHeart size={22}/></div>
                <p>Your request can be shared with the community, shared anonymously, or kept private in your account.</p>
                <input value={prayerTitle} onChange={e => setPrayerTitle(e.target.value)} maxLength={90} placeholder="A short title (optional)"/>
                <textarea value={prayerBody} onChange={e => setPrayerBody(e.target.value)} maxLength={2000} rows={4} placeholder="What would you like prayer for?"/>
                <div className="community-form-bottom"><label className="community-select-label"><LockKeyhole size={14}/><select value={prayerVisibility} onChange={e => setPrayerVisibility(e.target.value)}><option value="public">Share with community</option><option value="anonymous">Share anonymously</option><option value="private">Keep private</option></select></label><button className="community-primary" onClick={submitPrayer} disabled={!prayerBody.trim() || busy}><Send size={14}/> Submit request</button></div>
              </section>
              <div className="community-feed-label"><span>PRAYER WALL</span><span>{prayers.length} requests</span></div>
              {prayers.length ? prayers.map(prayer => <article className="community-prayer" key={prayer.id}>
                <div className="community-prayer-head"><span className="community-prayer-icon"><HandHeart size={17}/></span><div><strong>{prayer.visibility === "anonymous" ? "A community member" : profileFor(prayer.author_id)?.display_name || "Your prayer"}</strong><span>{timeAgo(prayer.created_at)} · {prayer.visibility === "private" ? "Private to you" : prayer.status === "answered" ? "Answered prayer" : "In prayer"}</span></div>{prayer.visibility === "private" && <LockKeyhole size={15}/>}</div>
                <h4>{prayer.title}</h4><p>{prayer.body}</p>
                {prayer.author_id === userId && prayer.status === "active" && <button className="community-mark-answered" onClick={async () => { const { error: updateError } = await supabase.from("community_prayer_requests").update({ status: "answered" }).eq("id", prayer.id).eq("author_id", userId); if (updateError) setError(updateError.message); else await loadAll(); }}><Check size={14}/> Mark as answered</button>}
              </article>) : <div className="community-empty"><HandHeart size={26}/><strong>There is room for hope here.</strong><p>Be the first to share a prayer request.</p></div>}
            </>}

            {tab === "groups" && <>
              <div className="community-groups-intro"><div><span className="community-eyebrow">GROW IN THE WORD TOGETHER</span><h3>Find your people.</h3><p>Join a public study or request to enter a private group.</p></div><button className="community-primary" onClick={() => setShowGroupForm(!showGroupForm)}><Plus size={15}/> Create group</button></div>
              {showGroupForm && <section className="community-form-card"><h3>Start a Bible study group</h3><input value={groupName} onChange={e => setGroupName(e.target.value)} maxLength={70} placeholder="Group name"/><textarea value={groupDescription} onChange={e => setGroupDescription(e.target.value)} maxLength={500} rows={3} placeholder="What will your group explore?"/><div className="community-form-bottom"><label className="community-select-label"><LockKeyhole size={14}/><select value={groupVisibility} onChange={e => setGroupVisibility(e.target.value as "public" | "private")}><option value="public">Public group</option><option value="private">Private group</option></select></label><button className="community-primary" onClick={createGroup} disabled={groupName.trim().length < 3 || busy}>Create group</button></div><small>Public groups are open to join. Private groups require the owner to approve requests.</small></section>}
              <div className="community-group-grid">
                {groups.map(group => {
                  const membership = memberships[group.id];
                  const owner = profileFor(group.created_by);
                  return <article className="community-group-card" key={group.id}>
                    <div className="community-group-icon"><BookOpen size={21}/></div>
                    <div className="community-group-badge">{group.visibility === "private" ? <><LockKeyhole size={12}/> PRIVATE</> : <><Users size={12}/> PUBLIC</>}</div>
                    <h4>{group.name}</h4><p>{group.description || "A space to learn, reflect and encourage one another through Scripture."}</p>
                    <span className="community-group-owner">Started by {owner?.display_name || "OrPath member"}</span>
                    {membership === "active" ? <span className="community-member-status"><Check size={14}/> Member</span> : membership === "pending" ? <span className="community-member-status pending"><LoaderCircle size={14}/> Request pending</span> : <button className="community-group-join" onClick={() => void joinGroup(group)}>{group.visibility === "private" ? "Request to join" : "Join group"} <ArrowLeft size={14}/></button>}
                    {group.visibility === "private" && group.created_by === userId && <button className="community-group-join community-invite" onClick={() => void createGroupInvite(group.id)}><Copy size={13}/> Copy invite link</button>}
                  </article>;
                })}
              </div>
              {!groups.length && <div className="community-empty"><Users size={26}/><strong>Your next Bible study could start here.</strong><p>Create a group and invite others to grow with you.</p></div>}
            </>}
          </>}
          <p className="community-footnote"><Shield size={13}/> Be kind, protect personal information, and report content that does not belong here. <Link href="/privacy">Privacy</Link></p>
        </section>
      </div>
    </main>
  );
}
