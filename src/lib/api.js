import { supabase } from "./supabase";

// ---------- Profiles ----------
const profFromRow = (r) => r && ({
  id: r.id, name: r.name, uniId: r.uni_id, country: r.country,
  course: r.course || "", stage: r.stage || "Researching", bio: r.bio || "", quiz: r.quiz || null,
});

export async function getMyProfile(userId) {
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return profFromRow(data);
}

export async function upsertProfile(userId, p) {
  const row = { id: userId, name: p.name, uni_id: p.uniId, country: p.country, course: p.course, stage: p.stage, bio: p.bio, quiz: p.quiz };
  const { error } = await supabase.from("profiles").upsert(row);
  if (error) throw error;
  return { ...p, id: userId };
}

export async function listProfiles() {
  const { data } = await supabase.from("profiles").select("*");
  const map = {};
  (data || []).forEach((r) => { map[r.id] = profFromRow(r); });
  return map;
}

// ---------- Tips ----------
export async function listTips() {
  const { data } = await supabase.from("tips").select("*").order("created_at", { ascending: false });
  return (data || []).map((r) => ({ id: r.id, uniId: r.uni_id, authorId: r.author, category: r.category, text: r.text, ts: new Date(r.created_at).getTime() }));
}

export async function addTip(userId, { uniId, category, text }) {
  const { data, error } = await supabase.from("tips").insert({ author: userId, uni_id: uniId, category, text }).select().single();
  if (error) throw error;
  return { id: data.id, uniId, authorId: userId, category, text, ts: Date.now() };
}

// ---------- Notes ----------
export async function listNotes() {
  const { data } = await supabase.from("notes").select("*").order("created_at", { ascending: false });
  return (data || []).map((r) => ({ id: r.id, title: r.title, major: r.major, uniId: r.uni_id, authorId: r.author, content: r.content, pages: r.pages, ts: new Date(r.created_at).getTime() }));
}

export async function addNote(userId, { title, major, uniId, content, pages }) {
  const { data, error } = await supabase.from("notes").insert({ author: userId, title, major, uni_id: uniId, content, pages }).select().single();
  if (error) throw error;
  return { id: data.id, title, major, uniId, authorId: userId, content, pages, ts: Date.now() };
}

// ---------- Activities ----------
export async function listActivities() {
  const { data } = await supabase.from("activities").select("*, activity_signups(profile_id, profiles(name))").order("created_at", { ascending: false });
  return (data || []).map((r) => ({
    id: r.id, uniId: r.uni_id, hostId: r.host, title: r.title, type: r.type,
    date: r.date_text, location: r.location, description: r.description || "",
    signups: (r.activity_signups || []).map((s) => s.profiles?.name).filter(Boolean),
    signupIds: (r.activity_signups || []).map((s) => s.profile_id),
  }));
}

export async function addActivity(userId, a) {
  const { data, error } = await supabase.from("activities").insert({
    host: userId, uni_id: a.uniId, title: a.title, type: a.type, date_text: a.date, location: a.location, description: a.description,
  }).select().single();
  if (error) throw error;
  await supabase.from("activity_signups").insert({ activity_id: data.id, profile_id: userId });
  return data.id;
}

export async function signUpForActivity(userId, activityId) {
  const { error } = await supabase.from("activity_signups").insert({ activity_id: activityId, profile_id: userId });
  if (error && error.code !== "23505") throw error; // 23505 = already signed up, fine
}

// ---------- Friends ----------
export async function listFriends(userId) {
  const { data } = await supabase.from("friends").select("friend_id").eq("user_id", userId);
  return (data || []).map((r) => r.friend_id);
}

export async function addFriend(userId, friendId) {
  await supabase.from("friends").insert({ user_id: userId, friend_id: friendId });
}

export async function removeFriend(userId, friendId) {
  await supabase.from("friends").delete().eq("user_id", userId).eq("friend_id", friendId);
}

// ---------- Messages ----------
export async function listMessages(userId, otherId) {
  const { data } = await supabase
    .from("messages")
    .select("*")
    .or(`and(sender.eq.${userId},recipient.eq.${otherId}),and(sender.eq.${otherId},recipient.eq.${userId})`)
    .order("created_at", { ascending: true });
  return (data || []).map((r) => ({ id: r.id, from: r.sender, text: r.text, ts: new Date(r.created_at).getTime() }));
}

export async function sendMessageTo(userId, otherId, text) {
  const { error } = await supabase.from("messages").insert({ sender: userId, recipient: otherId, text });
  if (error) throw error;
}

export function subscribeToMessages(userId, onMessage) {
  const channel = supabase
    .channel("dm-live")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
      const r = payload.new;
      if (r.recipient === userId || r.sender === userId) {
        onMessage({ id: r.id, from: r.sender, to: r.recipient, text: r.text, ts: new Date(r.created_at).getTime() });
      }
    })
    .subscribe();
  return () => supabase.removeChannel(channel);
}

// ---------- Reports ----------
export async function fileReport(userId, targetType, targetId, reason) {
  await supabase.from("reports").insert({ reporter: userId, target_type: targetType, target_id: String(targetId), reason });
}

// ---------- Buddy (via Edge Function — key stays on the server) ----------
export async function askBuddy(messages, context) {
  const { data, error } = await supabase.functions.invoke("buddy", {
    body: { messages: messages.map((m) => ({ role: m.role, content: m.text })), context },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data.reply;
}
