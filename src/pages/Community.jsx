import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, MessageSquarePlus, Send } from "lucide-react";
import SiteNav from "@/components/marketing/SiteNav";
import { useAuth } from "@/hooks/useAuth";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabaseClient";
import { toast } from "sonner";

export const COMMUNITY_BOARDS = [
  {
    id: "talk",
    title: "Talk",
    blurb: "Chat about the game, clutch rolls, and neon dice.",
    accent: "#00ffc8",
  },
  {
    id: "help",
    title: "Help",
    blurb: "Rules questions, bugs, and how-do-I…",
    accent: "#38bdf8",
  },
  {
    id: "ideas",
    title: "Ideas",
    blurb: "Skins, modes, and features you want next.",
    accent: "#c084fc",
  },
];

function BoardList() {
  return (
    <div className="grid gap-3">
      {COMMUNITY_BOARDS.map((b) => (
        <Link
          key={b.id}
          to={`/community/${b.id}`}
          className="rounded-xl border p-4 transition-opacity hover:opacity-90"
          style={{
            borderColor: `${b.accent}44`,
            background: `${b.accent}0d`,
          }}
        >
          <h2 className="font-black text-lg" style={{ color: b.accent }}>
            {b.title}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{b.blurb}</p>
        </Link>
      ))}
    </div>
  );
}

function PostList({ boardId }) {
  const board = COMMUNITY_BOARDS.find((b) => b.id === boardId);
  const { user, configured } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      setPosts([]);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("community_posts")
      .select("id, title, body, author_email, created_at, reply_count")
      .eq("board", boardId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.warn(error);
      toast.error("Could not load posts");
    }
    setPosts(data || []);
    setLoading(false);
  }, [boardId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.message("Sign in to post", {
        action: { label: "Account", onClick: () => navigate("/account") },
      });
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setPosting(true);
    const { data, error } = await supabase
      .from("community_posts")
      .insert({
        board: boardId,
        title: title.trim(),
        body: body.trim(),
        author_id: user.id,
        author_email: user.email,
      })
      .select("id")
      .single();
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTitle("");
    setBody("");
    toast.success("Posted");
    navigate(`/community/${boardId}/${data.id}`);
  };

  if (!board) {
    return <p className="text-slate-400">Unknown board.</p>;
  }

  return (
    <div>
      <Link
        to="/community"
        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500/70 mb-4 hover:text-cyan-400"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> All boards
      </Link>
      <h1 className="text-2xl font-black mb-1" style={{ color: board.accent }}>
        {board.title}
      </h1>
      <p className="text-sm text-slate-400 mb-6">{board.blurb}</p>

      {!configured && (
        <div
          className="mb-6 rounded-lg border px-4 py-3 text-sm text-amber-200/90"
          style={{
            borderColor: "rgba(251,191,36,0.35)",
            background: "rgba(251,191,36,0.08)",
          }}
        >
          Community backend needs Supabase. UI is ready — posts will appear once configured.
        </div>
      )}

      <form
        onSubmit={submit}
        className="rounded-xl border p-4 mb-8 space-y-3"
        style={{ borderColor: "rgba(0,255,200,0.18)" }}
      >
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
          <MessageSquarePlus className="w-3.5 h-3.5" /> New post
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={120}
          placeholder="Title"
          className="w-full rounded-lg border bg-black/40 px-3 py-2 text-sm text-white"
          style={{ borderColor: "rgba(0,255,200,0.2)" }}
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          maxLength={4000}
          rows={4}
          placeholder="What's on your mind?"
          className="w-full rounded-lg border bg-black/40 px-3 py-2 text-sm text-white resize-y"
          style={{ borderColor: "rgba(0,255,200,0.2)" }}
        />
        <button
          type="submit"
          disabled={posting || !configured}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #00ffc8, #a855f7)",
            color: "#000",
          }}
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Post
        </button>
      </form>

      {loading ? (
        <div className="flex items-center gap-2 text-cyan-300/70 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </div>
      ) : posts.length === 0 ? (
        <p className="text-sm text-slate-500">No posts yet — be the first.</p>
      ) : (
        <ul className="space-y-2">
          {posts.map((p) => (
            <li key={p.id}>
              <Link
                to={`/community/${boardId}/${p.id}`}
                className="block rounded-lg border px-4 py-3 hover:opacity-90"
                style={{ borderColor: "rgba(0,255,200,0.15)" }}
              >
                <div className="font-bold text-white text-sm">{p.title}</div>
                <div className="text-[11px] text-slate-500 mt-1">
                  {p.author_email || "player"} ·{" "}
                  {p.created_at ? new Date(p.created_at).toLocaleString() : ""}
                  {typeof p.reply_count === "number" ? ` · ${p.reply_count} replies` : ""}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ThreadView({ boardId, postId }) {
  const board = COMMUNITY_BOARDS.find((b) => b.id === boardId);
  const { user, configured } = useAuth();
  const [post, setPost] = useState(null);
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("community_posts").select("*").eq("id", postId).maybeSingle(),
      supabase
        .from("community_replies")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true }),
    ]);
    setPost(p);
    setReplies(r || []);
    setLoading(false);
  }, [postId]);

  useEffect(() => {
    void load();
  }, [load]);

  const reply = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.message("Sign in to reply", {
        action: { label: "Account", onClick: () => navigate("/account") },
      });
      return;
    }
    const supabase = getSupabase();
    if (!supabase) return;
    setPosting(true);
    const { error } = await supabase.from("community_replies").insert({
      post_id: postId,
      body: body.trim(),
      author_id: user.id,
      author_email: user.email,
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setBody("");
    void load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-cyan-300/70 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading…
      </div>
    );
  }

  if (!post) {
    return <p className="text-slate-400">Post not found.</p>;
  }

  return (
    <div>
      <Link
        to={`/community/${boardId}`}
        className="inline-flex items-center gap-1 text-xs font-bold text-cyan-500/70 mb-4 hover:text-cyan-400"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> {board?.title || "Board"}
      </Link>
      <article
        className="rounded-xl border p-4 mb-6"
        style={{ borderColor: "rgba(0,255,200,0.2)" }}
      >
        <h1 className="text-xl font-black text-white mb-2">{post.title}</h1>
        <p className="text-[11px] text-slate-500 mb-4">
          {post.author_email} · {new Date(post.created_at).toLocaleString()}
        </p>
        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{post.body}</p>
      </article>

      <h2 className="text-sm font-black text-white mb-3">Replies</h2>
      <ul className="space-y-3 mb-6">
        {replies.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border px-3 py-2"
            style={{ borderColor: "rgba(0,255,200,0.12)" }}
          >
            <p className="text-[11px] text-slate-500 mb-1">
              {r.author_email} · {new Date(r.created_at).toLocaleString()}
            </p>
            <p className="text-sm text-slate-300 whitespace-pre-wrap">{r.body}</p>
          </li>
        ))}
        {replies.length === 0 && (
          <li className="text-sm text-slate-500">No replies yet.</li>
        )}
      </ul>

      <form onSubmit={reply} className="space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={3}
          maxLength={2000}
          placeholder="Write a reply…"
          className="w-full rounded-lg border bg-black/40 px-3 py-2 text-sm text-white"
          style={{ borderColor: "rgba(0,255,200,0.2)" }}
        />
        <button
          type="submit"
          disabled={posting || !configured}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, #00ffc8, #a855f7)",
            color: "#000",
          }}
        >
          {posting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Reply
        </button>
      </form>
    </div>
  );
}

export default function Community() {
  const { boardId, postId } = useParams();

  return (
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#020408" }}>
      <SiteNav />
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">
        {!boardId && (
          <>
            <h1
              className="text-3xl font-black mb-2"
              style={{ color: "#00ffc8", textShadow: "0 0 20px rgba(0,255,200,0.3)" }}
            >
              Community
            </h1>
            <p className="text-slate-400 text-sm mb-8">
              Talk about the game, get help, or drop ideas for what we build next.
            </p>
            <BoardList />
            {!isSupabaseConfigured() && (
              <p className="text-xs text-slate-600 mt-6">
                Tip: connect Supabase to enable live posts (see .env.example).
              </p>
            )}
          </>
        )}
        {boardId && !postId && <PostList boardId={boardId} />}
        {boardId && postId && <ThreadView boardId={boardId} postId={postId} />}
      </main>
    </div>
  );
}
