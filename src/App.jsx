import { useState, useEffect, useRef, useCallback } from "react";
import { Compass, MessageCircle, Users, Sprout, Send, MapPin, Calendar, GraduationCap, ChevronRight, Loader2, Sparkles, Quote, X, UserPlus, UserCheck, RefreshCw, ArrowLeft, Heart, Plane, CheckCircle2, Circle, PlusCircle, Stamp, BookOpen, Download, Lock, Zap, LogOut, Flag } from "lucide-react";
import { supabase } from "./lib/supabase";
import * as api from "./lib/api";

// ---------- Static data ----------
const UNIVERSITIES = [
  { id: "nyuad", name: "NYU Abu Dhabi", city: "Abu Dhabi", country: "UAE", flag: "🇦🇪", rounds: "ED I Nov 1 · ED II Jan 1 · RD Jan 5" },
  { id: "sharjah", name: "University of Sharjah", city: "Sharjah", country: "UAE", flag: "🇦🇪", rounds: "Rolling (Fall & Spring intakes)" },
  { id: "aus", name: "American University of Sharjah", city: "Sharjah", country: "UAE", flag: "🇦🇪", rounds: "Rolling · priority deadlines per semester" },
  { id: "khalifa", name: "Khalifa University", city: "Abu Dhabi", country: "UAE", flag: "🇦🇪", rounds: "Rolling (Fall & Spring intakes)" },
  { id: "adu", name: "Abu Dhabi University", city: "Abu Dhabi", country: "UAE", flag: "🇦🇪", rounds: "Rolling (Fall & Spring intakes)" },
  { id: "zayed", name: "Zayed University", city: "Abu Dhabi / Dubai", country: "UAE", flag: "🇦🇪", rounds: "Rolling (Fall & Spring intakes)" },
  { id: "uaeu", name: "UAE University", city: "Al Ain", country: "UAE", flag: "🇦🇪", rounds: "Rolling (Fall & Spring intakes)" },
  { id: "nyunyc", name: "NYU New York", city: "New York", country: "USA", flag: "🇺🇸", rounds: "ED I Nov 1 · ED II Jan 1 · RD Jan 5" },
  { id: "columbia", name: "Columbia University", city: "New York", country: "USA", flag: "🇺🇸", rounds: "ED Nov 1 · RD Jan 1" },
  { id: "georgetown", name: "Georgetown University", city: "Washington DC", country: "USA", flag: "🇺🇸", rounds: "EA Nov 1 · RD Jan 10" },
  { id: "bu", name: "Boston University", city: "Boston", country: "USA", flag: "🇺🇸", rounds: "ED Nov 1 · ED II Jan 4 · RD Jan 4" },
  { id: "lse", name: "London School of Economics", city: "London", country: "UK", flag: "🇬🇧", rounds: "UCAS Jan 25" },
  { id: "kings", name: "King's College London", city: "London", country: "UK", flag: "🇬🇧", rounds: "UCAS Jan 25" },
  { id: "ucl", name: "UCL", city: "London", country: "UK", flag: "🇬🇧", rounds: "UCAS Jan 25" },
  { id: "oxford", name: "University of Oxford", city: "Oxford", country: "UK", flag: "🇬🇧", rounds: "UCAS Oct 15 (early deadline!)" },
  { id: "cambridge", name: "University of Cambridge", city: "Cambridge", country: "UK", flag: "🇬🇧", rounds: "UCAS Oct 15 (early deadline!)" },
  { id: "manchester", name: "University of Manchester", city: "Manchester", country: "UK", flag: "🇬🇧", rounds: "UCAS Jan 25" },
  { id: "edinburgh", name: "University of Edinburgh", city: "Edinburgh", country: "UK", flag: "🏴", rounds: "UCAS Jan 25" },
  { id: "toronto", name: "University of Toronto", city: "Toronto", country: "Canada", flag: "🇨🇦", rounds: "EA Nov 7 · RD Jan 15 (OUAC)" },
  { id: "mcgill", name: "McGill University", city: "Montreal", country: "Canada", flag: "🇨🇦", rounds: "Intl deadline Jan 15" },
  { id: "ubc", name: "University of British Columbia", city: "Vancouver", country: "Canada", flag: "🇨🇦", rounds: "Intl deadline Jan 15" },
  { id: "sciencespo", name: "Sciences Po", city: "Paris", country: "France", flag: "🇫🇷", rounds: "R1 Oct 22 · R2 Jan 6 · R3 Feb 24" },
  { id: "melbourne", name: "University of Melbourne", city: "Melbourne", country: "Australia", flag: "🇦🇺", rounds: "Rolling (Feb & Jul intakes)" },
  { id: "sydney", name: "University of Sydney", city: "Sydney", country: "Australia", flag: "🇦🇺", rounds: "Rolling (Feb & Jul intakes)" },
];

const COUNTRIES = ["UAE", "USA", "UK", "Canada", "France", "Australia", "Other"];
const STAGES = ["Researching", "Applying", "Got an offer", "Enrolled / on campus"];
const ACTIVITY_TYPES = ["Garden", "Meetup", "Study", "Sport", "Culture"];
const MAJORS = ["Political Science", "International Relations", "Economics", "Business", "Law", "Literature", "History", "Computer Science", "Psychology", "Other"];
const TIP_CATEGORIES = ["Uni", "Country", "Major"];
const NOTES_UNLOCK_PAGES = 10;
const WORDS_PER_PAGE = 300;

const QUIZ = [
  { q: "A free Friday night abroad looks like…", options: ["Big social gathering", "Small close circle", "Solo recharge"] },
  { q: "Your planning style:", options: ["Detailed spreadsheets", "Rough plan, flexible", "Fully spontaneous"] },
  { q: "Where do you actually study?", options: ["Library, silent", "Café with noise", "Group sessions"] },
  { q: "First week in a new city, you…", options: ["Explore everything immediately", "Settle in slowly", "Find one favourite spot first"] },
  { q: "When homesickness hits:", options: ["Call home right away", "Distract with new plans", "Talk it out with friends there"] },
];

function compatibility(a, b) {
  if (!a || !b || a.length !== QUIZ.length || b.length !== QUIZ.length) return null;
  const matches = a.filter((v, i) => v === b[i]).length;
  const pct = Math.round((matches / QUIZ.length) * 70 + 30);
  let label = "Opposites — could be interesting";
  if (pct >= 86) label = "Practically twins";
  else if (pct >= 72) label = "Strong match";
  else if (pct >= 58) label = "Balanced mix";
  return { pct, label, matches };
}

// ---------- Landing plans per destination ----------
const LANDING_PLANS = {
  UAE: {
    visa: [
      "Receive admission letter — your university sponsors your student residence visa",
      "Send passport copy + photos to the university's visa office",
      "Complete medical fitness test on arrival (required for residence visa)",
      "Emirates ID registration (university usually walks you through it)",
    ],
    before: ["Book flight for the official move-in window", "Arrange airport pickup with the university", "Get documents attested/translated if requested", "Sort international health insurance until uni coverage starts"],
    arrival: ["Collect room keys & campus ID", "Get a local SIM (du / Etisalat kiosks at the airport)", "Open a local bank account (Emirates NBD / FAB student accounts)", "Attend international student orientation"],
    firstMonth: ["Finish Emirates ID + medical steps", "Register with your country's embassy if you're foreign", "Join 2–3 clubs before week 4 (easiest window to make friends)", "Learn the bus/metro card system"],
  },
  USA: {
    visa: [
      "Receive I-20 form from your university after deposit",
      "Pay the SEVIS I-901 fee (keep the receipt)",
      "Complete DS-160 online application",
      "Book & attend F-1 visa interview at the US embassy (bring I-20, financials, ties evidence)",
    ],
    before: ["Book flight arriving no earlier than 30 days before program start (F-1 rule)", "Arrange housing or confirm dorm assignment", "Get vaccination records translated & uploaded to the health portal", "Carry I-20 + admission letter in hand luggage — you'll need them at the border"],
    arrival: ["Immigration: present passport, visa, I-20 at the port of entry", "Check in with the International Student Office (mandatory SEVIS registration)", "Get a US SIM (Mint/T-Mobile are student favourites)", "Open a bank account (bring passport + I-20 + campus address)"],
    firstMonth: ["Apply for a Social Security Number if you'll work on campus", "Understand F-1 work limits (20 hrs/week on campus max)", "Set up health insurance & find the campus clinic", "Register with your embassy"],
  },
  UK: {
    visa: [
      "Receive CAS (Confirmation of Acceptance for Studies) after meeting offer conditions",
      "Apply for the Student visa online (needs CAS number + financial evidence)",
      "Pay the Immigration Health Surcharge (IHS) — this is your NHS access",
      "Book biometrics appointment; TB test certificate if required for your country",
    ],
    before: ["Show 28-day bank statements meeting the maintenance requirement", "Book accommodation before flying (first-year halls deadline!)", "Download BRP collection details or eVisa setup", "Pack for rain. Seriously."],
    arrival: ["Collect BRP / activate eVisa within the stated window", "Register with the university (enrolment + ID card)", "Register with a local GP (doctor) — do it before you're sick", "Get a UK SIM (giffgaff/VOXI) and a 16–25 Railcard"],
    firstMonth: ["Open a UK student bank account", "Council tax exemption letter from the university (if in private housing)", "Join societies during Freshers' Fair — the window closes fast socially", "Learn your campus's study spaces before deadline season"],
  },
  Canada: {
    visa: [
      "Receive Letter of Acceptance + Provincial Attestation Letter (PAL) from the university",
      "Apply for the Study Permit online (IRCC account)",
      "Complete biometrics at a VAC",
      "Receive Port of Entry letter — the actual permit is issued when you land",
    ],
    before: ["Proof of funds (GIC of ~CAD 20,635 is the common route)", "Immigration Medical Exam if required for your country", "Confirm residence/college housing", "Buy a real winter coat — or budget to buy one there in October"],
    arrival: ["Get your Study Permit printed at the airport (check every detail before leaving the counter)", "Apply for a SIN if you plan to work", "Get a SIM (Fido/Koodo student plans)", "Open a bank account (RBC/TD student accounts)"],
    firstMonth: ["Get your provincial health card or confirm UHIP coverage", "Set up transit card (Presto in Toronto)", "Attend your college's orientation events", "Understand study permit work rules (20 hrs/week off campus)"],
  },
  France: {
    visa: [
      "Complete the Campus France / Études en France procedure for your country",
      "Attend Campus France interview if required",
      "Apply for the VLS-TS long-stay student visa",
      "Validate your VLS-TS online within 3 months of arrival (this step is often missed!)",
    ],
    before: ["Arrange housing early — CROUS applications open in spring", "Get birth certificate translated (needed for social security)", "Set up an international-friendly bank (or plan to open a French one)", "Basic French survival phrases — even at English-taught programmes"],
    arrival: ["Validate visa online (OFII process)", "Register for French social security (ameli.fr) — free healthcare", "Get a French SIM (Free Mobile is the student classic)", "Open a French bank account (needed for CAF)"],
    firstMonth: ["Apply for CAF housing benefit — internationals qualify and it's real money", "Get your Navigo/transport card", "Register with your embassy", "Join student associations — integration week matters"],
  },
  Australia: {
    visa: [
      "Receive CoE (Confirmation of Enrolment) after accepting & paying deposit",
      "Purchase OSHC (Overseas Student Health Cover) for your whole stay",
      "Apply for Student visa subclass 500 (include Genuine Student statement)",
      "Complete health examination if requested",
    ],
    before: ["Book flights for O-Week arrival", "Confirm college/accommodation offer", "Notarise key documents", "Check quarantine rules — Australia is strict about what you can bring in"],
    arrival: ["Activate OSHC and find your campus clinic", "Get an Australian SIM (Optus/Vodafone student deals)", "Open a bank account (Commonwealth/NAB — can be started before arrival)", "Get a Tax File Number if you'll work"],
    firstMonth: ["Set up Myki/Opal transport card", "Understand visa work limits (48 hrs/fortnight)", "Join clubs during O-Week", "Sort out Medicare-equivalent claims process through OSHC"],
  },
  Other: {
    visa: ["Confirm which visa type your admission letter supports", "Gather passport, photos, financial proof, admission letter", "Check translation/attestation requirements for your documents", "Book visa appointment early — slots fill months ahead"],
    before: ["Confirm housing in writing before flying", "Arrange health insurance valid from day one", "Scan every important document to cloud storage", "Research local SIM & banking options"],
    arrival: ["Complete any required immigration registration", "Get a local SIM & data plan", "Open a local bank account", "Attend every orientation event you can"],
    firstMonth: ["Register with your embassy", "Sort local healthcare access", "Join student groups early", "Build a weekly routine that includes people, not just study"],
  },
};

const PLAN_PHASES = [
  { id: "visa", label: "Visa & documents", icon: Stamp },
  { id: "before", label: "Before you fly", icon: Plane },
  { id: "arrival", label: "Arrival week", icon: MapPin },
  { id: "firstMonth", label: "First month", icon: Sprout },
];

const TABS = [
  { id: "landing", label: "Landing Plan", icon: Plane },
  { id: "buddy", label: "Buddy", icon: MessageCircle },
  { id: "tips", label: "Tips", icon: Users },
  { id: "notes", label: "Notes", icon: BookOpen },
  { id: "activities", label: "Activities", icon: Sprout },
  { id: "friends", label: "Friends", icon: Heart },
];

function timeAgo(ts) {
  const days = Math.floor((Date.now() - ts) / 8.64e7);
  if (days <= 0) return "today";
  if (days === 1) return "1 day ago";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}
function initials(name) { return name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase(); }
const uniById = (id) => UNIVERSITIES.find((u) => u.id === id);

export default function Waypoint({ session }) {
  const userId = session.user.id;
  const [activeTab, setActiveTab] = useState("landing");

  const [tips, setTips] = useState(null);
  const [tipDraft, setTipDraft] = useState({ uniId: UNIVERSITIES[0].id, category: "Uni", text: "" });
  const [tipError, setTipError] = useState("");
  const [tipCountry, setTipCountry] = useState("All");
  const [tipCat, setTipCat] = useState("All");

  const [notes, setNotes] = useState(null);
  const [noteDraft, setNoteDraft] = useState({ title: "", major: MAJORS[0], uniId: UNIVERSITIES[0].id, content: "" });
  const [noteError, setNoteError] = useState("");
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [notesMajor, setNotesMajor] = useState("All");
  const [openNoteId, setOpenNoteId] = useState(null);

  const [profiles, setProfiles] = useState({});
  const [myProfile, setMyProfile] = useState(undefined);
  const [profileForm, setProfileForm] = useState({ name: "", uniId: UNIVERSITIES[0].id, country: COUNTRIES[0], course: "", stage: STAGES[0], bio: "", quiz: Array(QUIZ.length).fill(null) });
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [pendingTip, setPendingTip] = useState(false);
  const [viewProfileId, setViewProfileId] = useState(null);

  const [friends, setFriends] = useState([]);
  const [dm, setDm] = useState({ msgs: [], loading: false });
  const [dmInput, setDmInput] = useState("");
  const dmEndRef = useRef(null);

  const [activities, setActivities] = useState(null);
  const [actUniFilter, setActUniFilter] = useState("all");
  const [signupName, setSignupName] = useState("");
  const [activeSignupId, setActiveSignupId] = useState(null);
  const [stampActivity, setStampActivity] = useState(null);
  const [showActForm, setShowActForm] = useState(false);
  const [actDraft, setActDraft] = useState({ uniId: UNIVERSITIES[0].id, title: "", type: ACTIVITY_TYPES[1], date: "", location: "", description: "" });
  const [actError, setActError] = useState("");

  const [landingDest, setLandingDest] = useState(null); // country key
  const [planChecks, setPlanChecks] = useState({}); // { [country]: { [phase-idx]: true } }

  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi, I'm your Guidance Buddy. I read your profile and landing plan so my advice fits *your* journey — ask me anything about applying, offers, packing, or settling in." },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // ---------- Load from Supabase ----------
  const refreshAll = useCallback(async () => {
    const [profs, mine, t, n, acts, fr] = await Promise.all([
      api.listProfiles(),
      api.getMyProfile(userId),
      api.listTips(),
      api.listNotes(),
      api.listActivities(),
      api.listFriends(userId),
    ]);
    setProfiles(profs);
    setMyProfile(mine);
    setTips(t);
    setNotes(n);
    setActivities(acts);
    setFriends(fr);
    if (mine) {
      setActUniFilter(mine.uniId);
      const c = uniById(mine.uniId)?.country;
      setLandingDest((cur) => cur || (LANDING_PLANS[c] ? c : "Other"));
    } else {
      setShowProfileSetup(true); // first login → set up profile
    }
  }, [userId]);

  useEffect(() => {
    refreshAll();
    try { const r = localStorage.getItem("wp-plan-checks"); setPlanChecks(r ? JSON.parse(r) : {}); } catch { setPlanChecks({}); }
  }, [refreshAll]);

  // Live DMs: append incoming messages if that chat is open
  const viewProfileIdRef = useRef(null);
  useEffect(() => { viewProfileIdRef.current = viewProfileId; }, [viewProfileId]);
  useEffect(() => {
    const unsub = api.subscribeToMessages(userId, (msg) => {
      const open = viewProfileIdRef.current;
      if (open && (msg.from === open || msg.to === open) && msg.from !== userId) {
        setDm((d) => ({ ...d, msgs: [...d.msgs, msg] }));
      }
    });
    return unsub;
  }, [userId]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, chatLoading]);
  useEffect(() => { dmEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [dm.msgs]);

  // ---------- Profile & DMs ----------
  async function saveProfile(e) {
    e?.preventDefault();
    const name = profileForm.name.trim();
    if (!name) return;
    const prof = { name, uniId: profileForm.uniId, country: profileForm.country, course: profileForm.course.trim(), stage: profileForm.stage, bio: profileForm.bio.trim(), quiz: profileForm.quiz?.every((v) => v !== null) ? profileForm.quiz : (myProfile?.quiz || null) };
    try {
      const saved = await api.upsertProfile(userId, prof);
      setMyProfile(saved);
      setProfiles((cur) => ({ ...cur, [userId]: saved }));
      setActUniFilter(saved.uniId);
      const c = uniById(saved.uniId)?.country;
      setLandingDest(LANDING_PLANS[c] ? c : "Other");
      setShowProfileSetup(false);
      if (pendingTip) { setPendingTip(false); postTip(saved); }
    } catch (err) {
      alert("Couldn't save profile: " + (err.message || err));
    }
  }

  const loadDm = useCallback(async (otherId) => {
    if (!myProfile) return;
    setDm((d) => ({ ...d, loading: true }));
    let msgs = [];
    try { msgs = await api.listMessages(userId, otherId); } catch {}
    setDm({ msgs, loading: false });
  }, [myProfile, userId]);

  useEffect(() => {
    if (viewProfileId && myProfile && viewProfileId !== myProfile.id) loadDm(viewProfileId);
    else setDm({ msgs: [], loading: false });
  }, [viewProfileId, myProfile, loadDm]);

  async function sendDm() {
    const text = dmInput.trim();
    if (!text || !myProfile || !viewProfileId) return;
    setDm((d) => ({ ...d, msgs: [...d.msgs, { from: userId, text, ts: Date.now() }] }));
    setDmInput("");
    try { await api.sendMessageTo(userId, viewProfileId, text); } catch {}
  }

  async function toggleFriend(id) {
    const isFriend = friends.includes(id);
    setFriends(isFriend ? friends.filter((f) => f !== id) : [...friends, id]);
    try { isFriend ? await api.removeFriend(userId, id) : await api.addFriend(userId, id); } catch {}
  }

  // ---------- Tips ----------
  async function postTip() {
    try {
      const newTip = await api.addTip(userId, { uniId: tipDraft.uniId, category: tipDraft.category, text: tipDraft.text.trim() });
      setTips([newTip, ...(tips || [])]);
      setTipDraft({ uniId: tipDraft.uniId, category: tipDraft.category, text: "" });
    } catch { setTipError("Couldn't post — check your connection and try again."); }
  }

  // ---------- Notes ----------
  function pageCount(text) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / WORDS_PER_PAGE));
  }

  async function submitNote(e) {
    e.preventDefault();
    setNoteError("");
    if (!myProfile) { setShowProfileSetup(true); return; }
    if (!noteDraft.title.trim()) { setNoteError("Give your notes a title."); return; }
    if (noteDraft.content.trim().split(/\s+/).filter(Boolean).length < 50) { setNoteError("That's too short to help anyone — paste at least ~50 words."); return; }
    try {
      const newNote = await api.addNote(userId, {
        title: noteDraft.title.trim(),
        major: noteDraft.major,
        uniId: noteDraft.uniId,
        content: noteDraft.content,
        pages: pageCount(noteDraft.content),
      });
      setNotes([newNote, ...(notes || [])]);
      setShowNoteForm(false);
      setNoteDraft({ title: "", major: noteDraft.major, uniId: noteDraft.uniId, content: "" });
    } catch { setNoteError("Couldn't upload — check your connection and try again."); }
  }

  function readNoteFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setNoteDraft((d) => ({ ...d, content: String(reader.result || ""), title: d.title || file.name.replace(/\.(txt|md)$/i, "") }));
    reader.readAsText(file);
    e.target.value = "";
  }

  function downloadNote(note) {
    const blob = new Blob([`${note.title}\n${"=".repeat(note.title.length)}\nMajor: ${note.major} · ${uniById(note.uniId)?.name || ""} · shared on Waypoint\n\n${note.content}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function submitTip(e) {
    e.preventDefault();
    setTipError("");
    if (!tipDraft.text.trim()) { setTipError("Write a tip before posting."); return; }
    if (!myProfile) { setPendingTip(true); setShowProfileSetup(true); return; }
    postTip();
  }

  // ---------- Activities ----------
  async function submitActivity(e) {
    e.preventDefault();
    setActError("");
    if (!actDraft.title.trim() || !actDraft.date.trim() || !actDraft.location.trim()) { setActError("Title, date and location are required."); return; }
    if (!myProfile) { setShowProfileSetup(true); return; }
    try {
      await api.addActivity(userId, {
        uniId: actDraft.uniId,
        title: actDraft.title.trim(),
        type: actDraft.type,
        date: actDraft.date.trim(),
        location: actDraft.location.trim(),
        description: actDraft.description.trim(),
      });
      setActivities(await api.listActivities());
      setShowActForm(false);
      setActDraft({ uniId: actDraft.uniId, title: "", type: ACTIVITY_TYPES[1], date: "", location: "", description: "" });
    } catch { setActError("Couldn't publish — check your connection and try again."); }
  }

  async function signUp(activityId) {
    if (!myProfile) { setActiveSignupId(null); setShowProfileSetup(true); return; }
    try {
      await api.signUpForActivity(userId, activityId);
      setActivities(await api.listActivities());
      setActiveSignupId(null);
      setStampActivity(activityId);
      setTimeout(() => setStampActivity(null), 1500);
    } catch {}
  }

  // ---------- Landing plan (device-local via localStorage) ----------
  function togglePlanItem(country, phaseId, idx) {
    const key = `${phaseId}-${idx}`;
    const cur = planChecks[country] || {};
    const next = { ...planChecks, [country]: { ...cur, [key]: !cur[key] } };
    setPlanChecks(next);
    try { localStorage.setItem("wp-plan-checks", JSON.stringify(next)); } catch {}
  }

  // ---------- Buddy with journey memory ----------
  function buildBuddyContext() {
    if (!myProfile) return "The student hasn't set up a profile yet. Gently suggest they create one (top-right button) so your advice can be personalised, but still answer helpfully.";
    const uni = uniById(myProfile.uniId);
    const dest = landingDest || (LANDING_PLANS[uni?.country] ? uni?.country : "Other");
    const checks = planChecks[dest] || {};
    const plan = LANDING_PLANS[dest] || LANDING_PLANS.Other;
    const total = PLAN_PHASES.reduce((n, ph) => n + plan[ph.id].length, 0);
    const done = Object.values(checks).filter(Boolean).length;
    const pending = [];
    PLAN_PHASES.forEach((ph) => plan[ph.id].forEach((item, i) => { if (!checks[`${ph.id}-${i}`]) pending.push(`[${ph.label}] ${item}`); }));
    return `STUDENT PROFILE (use this to personalise every answer):
- Name: ${myProfile.name}
- Stage: ${myProfile.stage || "Unknown"}
- University (attending or targeting): ${uni ? `${uni.name}, ${uni.city}, ${uni.country}` : "Not set"}
- Application rounds for that university: ${uni?.rounds || "Unknown"}
- Currently based in: ${myProfile.country}
- Course/year: ${myProfile.course || "Not stated"}
- Bio: ${myProfile.bio || "None"}
- Landing plan destination: ${dest} — ${done}/${total} tasks completed
- Note exchange: they have published ${(typeof myPublishedPages !== "undefined" ? myPublishedPages : 0)} pages of study notes (${NOTES_UNLOCK_PAGES} unlocks the shared library)
- Their next unchecked landing-plan tasks (reference these when relevant): ${pending.slice(0, 6).join("; ") || "All done!"}

Address the student by first name occasionally. When they ask what to pack, tailor it to ${dest}'s climate and their route from ${myProfile.country}. When they ask about deadlines, use the rounds above.`;
  }

  async function sendMessage(e, presetText) {
    e?.preventDefault();
    const text = (presetText ?? chatInput).trim();
    if (!text || chatLoading) return;
    const nextMessages = [...messages, { role: "user", text }];
    setMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);
    try {
      const reply = await api.askBuddy(nextMessages, buildBuddyContext());
      setMessages((cur) => [...cur, { role: "assistant", text: reply || "Sorry — I didn't catch that. Could you try rephrasing?" }]);
    } catch {
      setMessages((cur) => [...cur, { role: "assistant", text: "Buddy isn't available just yet — we're still setting this feature up! Everything else on Waypoint works though, so check out your Landing Plan, Tips, and Notes in the meantime. ✦" }]);
    }
    setChatLoading(false);
  }

  // ---------- Derived ----------
  const catOf = (t) => t.category || "Uni";
  const filteredTips = (tips || []).filter((t) => tipCat === "All" || catOf(t) === tipCat);
  const tipsByUni = filteredTips.reduce((acc, t) => { (acc[t.uniId] = acc[t.uniId] || []).push(t); return acc; }, {});
  const tipUnis = UNIVERSITIES.filter((u) => tipsByUni[u.id]?.length && (tipCountry === "All" || u.country === tipCountry));
  const allTipsByUni = (tips || []).reduce((acc, t) => { (acc[t.uniId] = acc[t.uniId] || []).push(t); return acc; }, {});
  const tipCountries = ["All", ...new Set(UNIVERSITIES.filter((u) => allTipsByUni[u.id]?.length).map((u) => u.country))];

  const myPublishedPages = (notes || []).filter((n) => myProfile && n.authorId === myProfile.id).reduce((s, n) => s + n.pages, 0);
  const notesUnlocked = myPublishedPages >= NOTES_UNLOCK_PAGES;
  const filteredNotes = (notes || []).filter((n) => notesMajor === "All" || n.major === notesMajor);
  const notesMajors = ["All", ...new Set((notes || []).map((n) => n.major))];
  const openNote = openNoteId ? (notes || []).find((n) => n.id === openNoteId) : null;

  const compat = viewProfileId && myProfile && profiles[viewProfileId] && viewProfileId !== myProfile.id
    ? compatibility(myProfile.quiz, profiles[viewProfileId].quiz)
    : null;

  const actsByUni = (activities || []).reduce((acc, a) => { (acc[a.uniId] = acc[a.uniId] || []).push(a); return acc; }, {});
  const actUniIds = actUniFilter === "all"
    ? UNIVERSITIES.filter((u) => actsByUni[u.id]?.length).map((u) => u.id)
    : (actsByUni[actUniFilter]?.length ? [actUniFilter] : []);

  const viewProfile = viewProfileId ? profiles[viewProfileId] : null;
  const isSelf = viewProfile && myProfile && viewProfile.id === myProfile.id;
  const friendProfiles = friends.map((f) => profiles[f]).filter(Boolean);

  const destCountry = landingDest || "Other";
  const plan = LANDING_PLANS[destCountry] || LANDING_PLANS.Other;
  const destChecks = planChecks[destCountry] || {};
  const planTotal = PLAN_PHASES.reduce((n, ph) => n + plan[ph.id].length, 0);
  const planDone = PLAN_PHASES.reduce((n, ph) => n + plan[ph.id].filter((_, i) => destChecks[`${ph.id}-${i}`]).length, 0);
  const planPct = planTotal ? Math.round((planDone / planTotal) * 100) : 0;

  return (
    <div className="wp">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,300;1,9..144,400&family=Outfit:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; }
        .wp {
          --night: #10221E; --night-2: #16302A; --pine: #1E4038;
          --sea: #7FB8A4; --cream: #F5EFE2; --cream-dim: #CFC7B4;
          --gold: #D9A441; --clay: #C96F4A;
          --line: rgba(245,239,226,0.14); --line-soft: rgba(245,239,226,0.07);
          font-family: 'Outfit', sans-serif;
          background:
            radial-gradient(1200px 500px at 80% -10%, rgba(127,184,164,0.10), transparent 60%),
            radial-gradient(900px 420px at -10% 20%, rgba(217,164,65,0.07), transparent 55%),
            var(--night);
          color: var(--cream); min-height: 100vh; font-weight: 300;
        }
        .wp ::selection { background: var(--gold); color: var(--night); }
        .wp button { font-family: inherit; }

        .wp-hero { max-width: 1060px; margin: 0 auto; padding: 44px 28px 0; position: relative; }
        .wp-topline { display: flex; justify-content: space-between; align-items: center; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--sea); padding-bottom: 16px; border-bottom: 1px solid var(--line); }
        .wp-topline .dot { color: var(--gold); }
        .wp-me { display: flex; align-items: center; gap: 8px; background: none; border: 1px solid var(--line); border-radius: 999px; color: var(--cream-dim); padding: 5px 12px 5px 5px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; transition: border-color 0.2s, color 0.2s; }
        .wp-me:hover { border-color: var(--sea); color: var(--sea); }
        .wp-title-row { display: flex; align-items: flex-end; justify-content: space-between; gap: 24px; padding: 30px 0 8px; flex-wrap: wrap; }
        .wp-wordmark { font-family: 'Fraunces', serif; font-size: clamp(44px, 7vw, 72px); font-weight: 300; line-height: 0.95; letter-spacing: -0.02em; color: var(--cream); margin: 0; }
        .wp-wordmark em { font-style: italic; font-weight: 400; color: var(--sea); }
        .wp-tagline { font-family: 'Fraunces', serif; font-style: italic; font-weight: 300; font-size: 16px; color: var(--cream-dim); max-width: 310px; line-height: 1.5; padding-bottom: 10px; }
        .wp-rose { position: absolute; right: 12px; top: 84px; opacity: 0.10; pointer-events: none; animation: wp-drift 42s linear infinite; }
        @keyframes wp-drift { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @media (prefers-reduced-motion: reduce) { .wp-rose { animation: none; } .wp-ticket:hover, .wp-friend:hover, .wp-tip-card:hover { transform: none; } }

        .wp-nav { max-width: 1060px; margin: 26px auto 0; padding: 0 28px; display: flex; gap: 24px; border-bottom: 1px solid var(--line); overflow-x: auto; }
        .wp-tab { display: flex; align-items: center; gap: 8px; padding: 12px 2px 14px; background: none; border: none; font-family: 'IBM Plex Mono', monospace; font-size: 12px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--cream-dim); cursor: pointer; position: relative; white-space: nowrap; transition: color 0.2s; }
        .wp-tab:hover { color: var(--cream); }
        .wp-tab.active { color: var(--gold); }
        .wp-tab.active::after { content: ""; position: absolute; left: 0; right: 0; bottom: -1px; height: 2px; background: var(--gold); }
        .wp-tab .badge { font-size: 9px; background: var(--sea); color: var(--night); border-radius: 999px; padding: 1px 7px; font-weight: 500; }

        .wp-main { max-width: 1060px; margin: 0 auto; padding: 34px 28px 80px; }
        .wp-section-head { display: flex; align-items: baseline; gap: 14px; margin-bottom: 26px; flex-wrap: wrap; }
        .wp-section-head h2 { font-family: 'Fraunces', serif; font-weight: 400; font-size: 26px; color: var(--cream); margin: 0; }
        .wp-section-head span { font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--sea); }

        .wp-controls { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 30px; align-items: center; }
        .wp-select { border: 1px solid var(--line); background: var(--night-2); border-radius: 999px; padding: 12px 18px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 14px; color: var(--cream); cursor: pointer; }
        .wp-select option { background: var(--night-2); }
        .wp-pills { display: flex; gap: 8px; flex-wrap: wrap; }
        .wp-pill { border: 1px solid var(--line); background: transparent; color: var(--cream-dim); font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em; text-transform: uppercase; padding: 8px 16px; border-radius: 999px; cursor: pointer; transition: all 0.2s; }
        .wp-pill:hover { border-color: var(--sea); color: var(--sea); }
        .wp-pill.on { background: var(--sea); border-color: var(--sea); color: var(--night); font-weight: 500; }
        .wp-pill.gold.on { background: var(--gold); border-color: var(--gold); }
        .wp-pill.gold:hover:not(.on) { border-color: var(--gold); color: var(--gold); }

        .wp-cat-chip { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); border: 1px solid rgba(217,164,65,0.35); padding: 2px 9px; border-radius: 999px; }
        .wp-linklike { background: none; border: none; padding: 0; color: var(--sea); cursor: pointer; font: inherit; text-decoration: underline; text-decoration-color: rgba(127,184,164,0.4); }
        .wp-linklike:hover { color: var(--gold); }

        .wp-quiz { border: 1px solid var(--line); border-radius: 16px; padding: 18px; margin-bottom: 18px; background: var(--night); }
        .wp-quiz-head { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); display: flex; align-items: center; gap: 7px; margin-bottom: 14px; }
        .wp-quiz-head span { color: var(--cream-dim); letter-spacing: 0.08em; }
        .wp-quiz-q { margin-bottom: 14px; }
        .wp-quiz-q:last-child { margin-bottom: 0; }
        .wp-quiz-q .qt { font-size: 13.5px; color: var(--cream); margin-bottom: 8px; }
        .wp-quiz .wp-pill { padding: 6px 12px; font-size: 9.5px; }

        .wp-compat { display: flex; gap: 16px; align-items: center; padding: 18px 30px; border-bottom: 1px solid var(--line-soft); }
        .wp-compat-ring { width: 62px; height: 62px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; background: conic-gradient(var(--gold) calc(var(--p) * 1%), rgba(245,239,226,0.08) 0); position: relative; }
        .wp-compat-ring::before { content: ""; position: absolute; inset: 5px; border-radius: 50%; background: var(--night-2); }
        .wp-compat-ring span { position: relative; font-family: 'Fraunces', serif; font-size: 16px; color: var(--gold); }
        .wp-compat-label { display: flex; align-items: center; gap: 6px; font-family: 'Fraunces', serif; font-size: 17px; color: var(--cream); }
        .wp-compat-label svg { color: var(--gold); }
        .wp-compat-sub { font-size: 12.5px; color: var(--cream-dim); line-height: 1.55; margin-top: 3px; }

        .wp-note-body { background: var(--night); border: 1px solid var(--line-soft); border-radius: 14px; padding: 18px; font-size: 13.5px; line-height: 1.75; color: var(--cream); white-space: pre-wrap; max-height: 44vh; overflow-y: auto; font-weight: 300; }
        .wp-field input[type=file] { padding: 9px 12px; font-size: 12.5px; color: var(--cream-dim); }
        .wp-field input[type=file]::file-selector-button { border: 1px solid var(--line); background: var(--night-2); color: var(--cream); border-radius: 999px; padding: 6px 14px; margin-right: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer; }

        /* Landing plan */
        .wp-plan-top { border: 1px solid var(--line); border-radius: 20px; background: var(--night-2); padding: 24px; margin-bottom: 28px; display: flex; gap: 24px; align-items: center; flex-wrap: wrap; }
        .wp-plan-dest { flex: 1 1 240px; }
        .wp-plan-dest .lbl { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sea); margin-bottom: 8px; }
        .wp-progress { flex: 2 1 280px; }
        .wp-progress .row { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; }
        .wp-progress .pct { font-family: 'Fraunces', serif; font-size: 26px; color: var(--gold); }
        .wp-progress .cnt { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; color: var(--cream-dim); }
        .wp-bar { height: 8px; border-radius: 999px; background: var(--night); border: 1px solid var(--line-soft); overflow: hidden; }
        .wp-bar > div { height: 100%; background: linear-gradient(90deg, var(--sea), var(--gold)); border-radius: 999px; transition: width 0.4s ease; }
        .wp-phase { margin-bottom: 26px; }
        .wp-phase-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
        .wp-phase-head svg { color: var(--gold); }
        .wp-phase-head h3 { font-family: 'Fraunces', serif; font-size: 19px; font-weight: 400; color: var(--cream); margin: 0; }
        .wp-phase-head .cnt { font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.1em; color: var(--sea); }
        .wp-task { display: flex; gap: 12px; align-items: flex-start; width: 100%; text-align: left; background: var(--night-2); border: 1px solid var(--line-soft); border-radius: 14px; padding: 13px 16px; margin-bottom: 8px; cursor: pointer; color: var(--cream); font-size: 14px; line-height: 1.55; font-weight: 300; transition: border-color 0.2s, opacity 0.2s; }
        .wp-task:hover { border-color: rgba(127,184,164,0.4); }
        .wp-task svg { flex-shrink: 0; margin-top: 1px; }
        .wp-task.done { opacity: 0.55; }
        .wp-task.done .txt { text-decoration: line-through; text-decoration-color: var(--sea); }
        .wp-plan-note { font-size: 11.5px; color: var(--cream-dim); opacity: 0.75; font-style: italic; margin-top: 18px; }

        /* Chat */
        .wp-chat { border: 1px solid var(--line); border-radius: 20px; background: var(--night-2); display: flex; flex-direction: column; height: 62vh; max-height: 580px; overflow: hidden; }
        .wp-chat-head { display: flex; align-items: center; gap: 10px; padding: 16px 20px; border-bottom: 1px solid var(--line-soft); font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sea); }
        .wp-pulse { width: 8px; height: 8px; border-radius: 50%; background: var(--sea); animation: wp-pulse 2.4s ease-out infinite; }
        @keyframes wp-pulse { 0% { box-shadow: 0 0 0 0 rgba(127,184,164,0.5); } 70% { box-shadow: 0 0 0 9px rgba(127,184,164,0); } 100% { box-shadow: 0 0 0 0 rgba(127,184,164,0); } }
        .wp-chat-log { flex: 1; overflow-y: auto; padding: 22px; display: flex; flex-direction: column; gap: 14px; }
        .wp-msg { max-width: 76%; padding: 12px 16px; font-size: 14.5px; line-height: 1.6; font-weight: 300; animation: wp-rise 0.3s ease-out; white-space: pre-wrap; }
        @keyframes wp-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
        .wp-msg.user { align-self: flex-end; background: var(--gold); color: var(--night); border-radius: 18px 18px 4px 18px; font-weight: 400; }
        .wp-msg.assistant { align-self: flex-start; background: var(--pine); color: var(--cream); border-radius: 18px 18px 18px 4px; border: 1px solid var(--line-soft); }
        .wp-typing { display: flex; align-items: center; gap: 8px; font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; color: var(--sea); align-self: flex-start; }
        .wp-chat-form { display: flex; gap: 10px; padding: 16px; border-top: 1px solid var(--line-soft); }
        .wp-chat-form input { flex: 1; border: 1px solid var(--line); border-radius: 999px; padding: 12px 18px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 14.5px; background: var(--night); color: var(--cream); outline: none; transition: border-color 0.2s; }
        .wp-chat-form input:focus { border-color: var(--sea); }
        .wp-chat-form input::placeholder { color: var(--cream-dim); opacity: 0.6; }
        .wp-send { border: none; background: var(--gold); color: var(--night); width: 46px; height: 46px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s, opacity 0.15s; }
        .wp-send:hover:not(:disabled) { transform: scale(1.07); }
        .wp-send:disabled { opacity: 0.35; cursor: default; }
        .wp-suggest { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 16px 14px; }
        .wp-suggest button { border: 1px solid var(--line); background: transparent; color: var(--cream-dim); font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 12.5px; padding: 7px 14px; border-radius: 999px; cursor: pointer; transition: border-color 0.2s, color 0.2s; }
        .wp-suggest button:hover { border-color: var(--sea); color: var(--sea); }
        .wp-buddy-context { font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.08em; color: var(--cream-dim); opacity: 0.8; margin-left: auto; text-transform: none; }

        /* Forms & sheets */
        .wp-overlay { position: fixed; inset: 0; z-index: 50; background: rgba(9,18,16,0.72); display: flex; align-items: center; justify-content: center; padding: 24px; animation: wp-fade 0.2s ease-out; }
        @keyframes wp-fade { from { opacity: 0; } to { opacity: 1; } }
        .wp-sheet { background: var(--night-2); border: 1px solid var(--line); border-radius: 22px; width: 100%; max-width: 620px; max-height: 86vh; overflow-y: auto; animation: wp-sheet-in 0.28s cubic-bezier(0.2, 1, 0.3, 1); position: relative; }
        @keyframes wp-sheet-in { from { opacity: 0; transform: translateY(18px) scale(0.98); } to { opacity: 1; transform: none; } }
        .wp-close { position: absolute; top: 16px; right: 16px; z-index: 2; background: rgba(16,34,30,0.7); border: 1px solid var(--line); color: var(--cream); width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color 0.2s; }
        .wp-close:hover { border-color: var(--gold); color: var(--gold); }
        .wp-btn-gold { border: none; background: var(--gold); color: var(--night); font-family: 'IBM Plex Mono', monospace; font-size: 11px; font-weight: 500; letter-spacing: 0.12em; text-transform: uppercase; padding: 12px 22px; border-radius: 999px; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: transform 0.15s; }
        .wp-btn-gold:hover { transform: translateY(-1px); }
        .wp-btn-gold:disabled { opacity: 0.4; cursor: default; }
        .wp-btn-ghost { border: 1px solid var(--line); background: transparent; color: var(--cream-dim); font-family: 'IBM Plex Mono', monospace; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; padding: 12px 22px; border-radius: 999px; cursor: pointer; transition: border-color 0.2s, color 0.2s; display: flex; align-items: center; }
        .wp-btn-ghost:hover { border-color: var(--sea); color: var(--sea); }
        .wp-error { color: var(--clay); font-size: 12.5px; margin-top: 8px; }

        .wp-form { padding: 28px 30px 30px; }
        .wp-form h3 { font-family: 'Fraunces', serif; font-weight: 400; font-size: 24px; margin: 0 0 6px; color: var(--cream); }
        .wp-form-sub { font-size: 13px; color: var(--cream-dim); margin-bottom: 22px; line-height: 1.6; }
        .wp-field { margin-bottom: 14px; }
        .wp-field label { display: block; font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--sea); margin-bottom: 6px; }
        .wp-field input, .wp-field select, .wp-field textarea { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 11px 14px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 14px; background: var(--night); color: var(--cream); outline: none; transition: border-color 0.2s; }
        .wp-field input:focus, .wp-field textarea:focus { border-color: var(--sea); }
        .wp-field textarea { min-height: 64px; resize: vertical; }
        .wp-field select option { background: var(--night); }
        .wp-field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        /* Tips */
        .wp-tip-form { border: 1px solid var(--line); border-radius: 20px; background: var(--night-2); padding: 22px; margin-bottom: 28px; }
        .wp-tip-form-label { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sea); margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
        .wp-tip-row { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 12px; }
        .wp-tip-form select { border: 1px solid var(--line); border-radius: 999px; padding: 10px 16px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 13.5px; background: var(--night); color: var(--cream); outline: none; }
        .wp-tip-form select option { background: var(--night); }
        .wp-tip-form textarea { width: 100%; border: 1px solid var(--line); border-radius: 14px; padding: 13px 16px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 14.5px; background: var(--night); color: var(--cream); min-height: 74px; resize: vertical; outline: none; transition: border-color 0.2s; }
        .wp-tip-form textarea:focus { border-color: var(--sea); }
        .wp-tip-form textarea::placeholder { color: var(--cream-dim); opacity: 0.6; }
        .wp-tip-as { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--cream-dim); margin-top: 12px; }

        .wp-uni-group { margin-bottom: 40px; }
        .wp-uni-group-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 18px; border-bottom: 1px solid var(--line-soft); padding-bottom: 10px; }
        .wp-uni-group-head h3 { font-family: 'Fraunces', serif; font-size: 20px; font-weight: 400; color: var(--cream); margin: 0; }
        .wp-uni-group-head span { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.1em; color: var(--sea); }
        .wp-uni-group-head .mine-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; background: var(--gold); color: var(--night); padding: 2px 9px; border-radius: 999px; font-weight: 500; }
        .wp-tip-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
        .wp-tip-card { border: 1px solid var(--line); border-left: 3px solid var(--gold); border-radius: 4px 14px 14px 4px; background: var(--night-2); padding: 18px 18px 14px; transition: transform 0.2s, border-color 0.2s; display: flex; flex-direction: column; }
        .wp-tip-card:hover { transform: translateY(-2px); border-color: rgba(217,164,65,0.4); border-left-color: var(--gold); }
        .wp-tip-card .q { color: var(--gold); opacity: 0.7; margin-bottom: 6px; }
        .wp-tip-text { font-family: 'Fraunces', serif; font-weight: 300; font-size: 15.5px; line-height: 1.6; color: var(--cream); flex: 1; }
        .wp-tip-author { margin-top: 14px; display: flex; align-items: center; gap: 8px; background: none; border: none; padding: 6px 8px; margin-left: -8px; border-radius: 999px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.06em; color: var(--cream-dim); text-align: left; transition: background 0.2s, color 0.2s; }
        .wp-tip-author:hover { background: rgba(127,184,164,0.1); color: var(--sea); }
        .wp-tip-author .meta { line-height: 1.5; }
        .wp-tip-author .nm { color: var(--sea); font-weight: 500; }

        /* Activities */
        .wp-act-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; }
        .wp-ticket { position: relative; border: 1px solid var(--line); border-radius: 18px; background: var(--night-2); padding: 22px; transition: transform 0.25s, border-color 0.25s; overflow: hidden; }
        .wp-ticket:hover { transform: translateY(-3px); border-color: rgba(127,184,164,0.45); }
        .wp-ticket-type { display: inline-flex; align-items: center; gap: 6px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--night); background: var(--sea); padding: 4px 11px; border-radius: 999px; margin-bottom: 12px; }
        .wp-ticket-type.meetup, .wp-ticket-type.culture { background: var(--gold); }
        .wp-ticket-type.study, .wp-ticket-type.sport { background: var(--clay); color: var(--cream); }
        .wp-ticket h3 { font-family: 'Fraunces', serif; font-size: 21px; font-weight: 500; color: var(--cream); margin: 0; }
        .wp-ticket-meta { display: flex; flex-direction: column; gap: 5px; margin-top: 12px; font-size: 13px; color: var(--cream-dim); }
        .wp-ticket-meta div { display: flex; align-items: center; gap: 8px; }
        .wp-ticket-meta svg { color: var(--sea); flex-shrink: 0; }
        .wp-ticket-desc { font-size: 13.5px; color: var(--cream-dim); margin-top: 12px; line-height: 1.6; }
        .wp-attendees { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; }
        .wp-att { font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: var(--sea); border: 1px solid rgba(127,184,164,0.3); padding: 3px 9px; border-radius: 999px; }
        .wp-ticket-foot { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--line); }
        .wp-count { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.08em; color: var(--cream-dim); }
        .wp-count b { color: var(--gold); font-weight: 500; }
        .wp-join { border: 1px solid var(--sea); background: transparent; color: var(--sea); font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; padding: 9px 16px; border-radius: 999px; cursor: pointer; transition: background 0.2s, color 0.2s; }
        .wp-join:hover { background: var(--sea); color: var(--night); }
        .wp-join-inline { display: flex; gap: 8px; margin-top: 12px; }
        .wp-join-inline input { flex: 1; border: 1px solid var(--line); border-radius: 999px; padding: 10px 16px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 13.5px; background: var(--night); color: var(--cream); outline: none; }
        .wp-join-inline input:focus { border-color: var(--sea); }
        .wp-join-inline button { border: none; background: var(--sea); color: var(--night); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .wp-host-badge { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--gold); }

        .wp-stamp { position: absolute; top: 18px; right: 18px; z-index: 2; border: 2px solid var(--gold); color: var(--gold); border-radius: 50%; width: 78px; height: 78px; display: flex; flex-direction: column; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; text-align: center; transform: rotate(-12deg); pointer-events: none; animation: wp-stamp-in 0.4s cubic-bezier(0.2, 1.4, 0.4, 1); background: rgba(16,34,30,0.75); }
        @keyframes wp-stamp-in { 0% { opacity: 0; transform: rotate(-12deg) scale(1.7); } 100% { opacity: 1; transform: rotate(-12deg) scale(1); } }

        /* Friends */
        .wp-friend-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
        .wp-friend { border: 1px solid var(--line); border-radius: 18px; background: var(--night-2); padding: 18px; display: flex; gap: 14px; align-items: flex-start; cursor: pointer; text-align: left; color: inherit; transition: transform 0.2s, border-color 0.2s; }
        .wp-friend:hover { transform: translateY(-2px); border-color: rgba(127,184,164,0.45); }
        .wp-friend-name { font-family: 'Fraunces', serif; font-size: 18px; font-weight: 500; color: var(--cream); }
        .wp-friend-sub { font-size: 12px; color: var(--cream-dim); margin-top: 4px; line-height: 1.6; }
        .wp-friend-sub svg { vertical-align: -2px; margin-right: 4px; color: var(--sea); }
        .wp-friend-msg { margin-top: 10px; font-family: 'IBM Plex Mono', monospace; font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--gold); display: flex; align-items: center; gap: 5px; }
        .wp-empty-state { border: 1px dashed var(--line); border-radius: 20px; padding: 44px 30px; text-align: center; }
        .wp-empty-state h3 { font-family: 'Fraunces', serif; font-weight: 400; font-size: 22px; color: var(--cream); margin: 0 0 8px; }
        .wp-empty-state p { font-size: 13.5px; color: var(--cream-dim); line-height: 1.7; max-width: 380px; margin: 0 auto 18px; }

        /* Profile sheet */
        .wp-prof-head { padding: 32px 30px 22px; border-bottom: 1px solid var(--line); display: flex; gap: 18px; align-items: center; }
        .wp-avatar { width: 64px; height: 64px; border-radius: 50%; background: var(--pine); border: 1px solid rgba(127,184,164,0.4); display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 22px; color: var(--sea); flex-shrink: 0; }
        .wp-avatar.sm { width: 30px; height: 30px; font-size: 12px; }
        .wp-avatar.md { width: 46px; height: 46px; font-size: 16px; }
        .wp-prof-name { font-family: 'Fraunces', serif; font-size: 26px; font-weight: 400; color: var(--cream); margin: 0; display: flex; align-items: center; gap: 8px; }
        .wp-prof-sub { font-size: 13px; color: var(--cream-dim); margin-top: 5px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .wp-prof-sub .sep { color: var(--sea); }
        .wp-prof-bio { padding: 20px 30px; font-family: 'Fraunces', serif; font-weight: 300; font-size: 15.5px; font-style: italic; line-height: 1.65; color: var(--cream-dim); border-bottom: 1px solid var(--line-soft); }
        .wp-prof-actions { display: flex; gap: 10px; padding: 18px 30px; border-bottom: 1px solid var(--line-soft); }
        .wp-dm { display: flex; flex-direction: column; max-height: 320px; }
        .wp-dm-head { padding: 16px 30px 0; font-family: 'IBM Plex Mono', monospace; font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--sea); display: flex; align-items: center; gap: 8px; justify-content: space-between; }
        .wp-dm-refresh { background: none; border: none; color: var(--sea); cursor: pointer; display: flex; align-items: center; gap: 5px; font-family: inherit; font-size: 9.5px; letter-spacing: 0.1em; text-transform: uppercase; }
        .wp-dm-log { flex: 1; overflow-y: auto; padding: 16px 30px; display: flex; flex-direction: column; gap: 10px; min-height: 120px; }
        .wp-dm-msg { max-width: 78%; padding: 9px 13px; font-size: 13.5px; line-height: 1.55; }
        .wp-dm-msg.mine { align-self: flex-end; background: var(--gold); color: var(--night); border-radius: 14px 14px 3px 14px; font-weight: 400; }
        .wp-dm-msg.theirs { align-self: flex-start; background: var(--pine); color: var(--cream); border-radius: 14px 14px 14px 3px; border: 1px solid var(--line-soft); }
        .wp-dm-empty { font-family: 'Fraunces', serif; font-style: italic; font-size: 13.5px; color: var(--cream-dim); opacity: 0.8; }
        .wp-dm-form { display: flex; gap: 8px; padding: 14px 24px 22px; }
        .wp-dm-form input { flex: 1; border: 1px solid var(--line); border-radius: 999px; padding: 11px 16px; font-family: 'Outfit', sans-serif; font-weight: 300; font-size: 13.5px; background: var(--night); color: var(--cream); outline: none; transition: border-color 0.2s; }
        .wp-dm-form input:focus { border-color: var(--sea); }
        .wp-dm-send { border: none; background: var(--sea); color: var(--night); width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .wp-dm-send:disabled { opacity: 0.35; cursor: default; }
        .wp-dm-note { padding: 0 30px 20px; font-size: 11px; color: var(--cream-dim); opacity: 0.7; font-style: italic; }

        .wp-empty { font-family: 'Fraunces', serif; font-style: italic; font-size: 15px; color: var(--cream-dim); }

        @media (max-width: 640px) {
          .wp-act-grid, .wp-tip-grid, .wp-friend-grid { grid-template-columns: 1fr; }
          .wp-nav { gap: 14px; }
          .wp-rose { display: none; }
          .wp-field-row { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* ---------- Header ---------- */}
      <header className="wp-hero">
        <svg className="wp-rose" width="150" height="150" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="48" stroke="#F5EFE2" strokeWidth="0.6" />
          <circle cx="50" cy="50" r="36" stroke="#F5EFE2" strokeWidth="0.4" strokeDasharray="2 3" />
          <path d="M50 4 L54 46 L50 50 L46 46 Z" fill="#F5EFE2" />
          <path d="M50 96 L54 54 L50 50 L46 54 Z" fill="#F5EFE2" opacity="0.5" />
          <path d="M4 50 L46 46 L50 50 L46 54 Z" fill="#F5EFE2" opacity="0.5" />
          <path d="M96 50 L54 46 L50 50 L54 54 Z" fill="#F5EFE2" opacity="0.5" />
        </svg>
        <div className="wp-topline">
          <span>Waypoint <span className="dot">✦</span> Land on your feet</span>
          <div style={{ display: "flex", alignItems: "center" }}>
          <button className="wp-me" onClick={() => {
            if (myProfile) setProfileForm({ name: myProfile.name, uniId: myProfile.uniId, country: myProfile.country, course: myProfile.course, stage: myProfile.stage || STAGES[0], bio: myProfile.bio, quiz: myProfile.quiz || Array(QUIZ.length).fill(null) });
            setShowProfileSetup(true);
          }}>
            <span className="wp-avatar sm">{myProfile ? initials(myProfile.name) : "?"}</span>
            {myProfile ? myProfile.name : "Create profile"}
          </button>
          <button className="wp-me" style={{ marginLeft: 8, padding: "5px 12px" }} onClick={() => supabase.auth.signOut()} title="Sign out">
            <LogOut size={12} /> Sign out
          </button>
          </div>
        </div>
        <div className="wp-title-row">
          <h1 className="wp-wordmark">The part <em>after</em><br />you get in.</h1>
          <p className="wp-tagline">Visas, packing, first-week nerves, and people who've already done it — everything the brochures skip.</p>
        </div>
      </header>

      {/* ---------- Nav ---------- */}
      <nav className="wp-nav">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} className={`wp-tab ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>
              <Icon size={13} /> {t.label}
              {t.id === "friends" && friendProfiles.length > 0 && <span className="badge">{friendProfiles.length}</span>}
              {t.id === "landing" && planTotal > 0 && planDone > 0 && <span className="badge">{planPct}%</span>}
            </button>
          );
        })}
      </nav>

      <main className="wp-main">
        {/* ---------- Landing Plan ---------- */}
        {activeTab === "landing" && (
          <section>
            <div className="wp-section-head">
              <h2>Your landing plan</h2>
              <span>offer → arrival → settled</span>
            </div>

            <div className="wp-plan-top">
              <div className="wp-plan-dest">
                <div className="lbl">Destination country</div>
                <select className="wp-select" style={{ width: "100%" }} value={destCountry} onChange={(e) => setLandingDest(e.target.value)}>
                  {Object.keys(LANDING_PLANS).map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="wp-progress">
                <div className="row">
                  <span className="pct">{planPct}%</span>
                  <span className="cnt">{planDone} / {planTotal} tasks done</span>
                </div>
                <div className="wp-bar"><div style={{ width: `${planPct}%` }} /></div>
              </div>
            </div>

            {PLAN_PHASES.map((ph) => {
              const items = plan[ph.id];
              const done = items.filter((_, i) => destChecks[`${ph.id}-${i}`]).length;
              const Icon = ph.icon;
              return (
                <div className="wp-phase" key={ph.id}>
                  <div className="wp-phase-head">
                    <Icon size={16} />
                    <h3>{ph.label}</h3>
                    <span className="cnt">{done}/{items.length}</span>
                  </div>
                  {items.map((item, i) => {
                    const checked = !!destChecks[`${ph.id}-${i}`];
                    return (
                      <button className={`wp-task ${checked ? "done" : ""}`} key={i} onClick={() => togglePlanItem(destCountry, ph.id, i)}>
                        {checked ? <CheckCircle2 size={17} color="#7FB8A4" /> : <Circle size={17} color="#CFC7B4" />}
                        <span className="txt">{item}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
            <p className="wp-plan-note">Visa steps are indicative and change by nationality and year — always confirm with the official immigration site and your university's international office. Ask Buddy if any step is confusing; it can see your progress here.</p>
          </section>
        )}

        {/* ---------- Buddy ---------- */}
        {activeTab === "buddy" && (
          <section>
            <div className="wp-section-head">
              <h2>Guidance Buddy</h2>
              <span>AI mentor · knows your journey</span>
            </div>
            <div className="wp-chat">
              <div className="wp-chat-head">
                <span className="wp-pulse" /> Buddy is online
                {myProfile && <span className="wp-buddy-context">personalised for {myProfile.name.split(" ")[0]} · {uniById(myProfile.uniId)?.name} · plan {planPct}%</span>}
              </div>
              <div className="wp-chat-log">
                {messages.map((m, i) => <div className={`wp-msg ${m.role}`} key={i}>{m.text}</div>)}
                {chatLoading && <div className="wp-typing"><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> thinking…</div>}
                <div ref={chatEndRef} />
              </div>
              {messages.length === 1 && (
                <div className="wp-suggest">
                  {["What should I pack?", "What's my next visa step?", "Should I apply ED, EA, or RD?", "How do I handle homesickness?"].map((s) => (
                    <button key={s} onClick={() => sendMessage(null, s)}>{s}</button>
                  ))}
                </div>
              )}
              <form className="wp-chat-form" onSubmit={sendMessage}>
                <input placeholder="Ask about visas, packing, offers, settling in…" value={chatInput} onChange={(e) => setChatInput(e.target.value)} />
                <button className="wp-send" type="submit" disabled={chatLoading || !chatInput.trim()}><Send size={17} /></button>
              </form>
            </div>
          </section>
        )}

        {/* ---------- Tips ---------- */}
        {activeTab === "tips" && (
          <section>
            <div className="wp-section-head">
              <h2>Field notes</h2>
              <span>from students already there · tap an author to connect</span>
            </div>

            <div className="wp-controls" style={{ flexDirection: "column", alignItems: "flex-start", gap: 10 }}>
              <div className="wp-pills">
                {tipCountries.map((c) => (
                  <button key={c} className={`wp-pill ${tipCountry === c ? "on" : ""}`} onClick={() => setTipCountry(c)}>{c}</button>
                ))}
              </div>
              <div className="wp-pills">
                {["All", ...TIP_CATEGORIES].map((c) => (
                  <button key={c} className={`wp-pill gold ${tipCat === c ? "on" : ""}`} onClick={() => setTipCat(c)}>
                    {c === "All" ? "All topics" : c === "Uni" ? "About the uni" : c === "Country" ? "About the country" : "About the major"}
                  </button>
                ))}
              </div>
            </div>

            <form className="wp-tip-form" onSubmit={submitTip}>
              <div className="wp-tip-form-label"><Sparkles size={12} /> Leave a note for whoever comes next</div>
              <div className="wp-tip-row">
                <select value={tipDraft.uniId} onChange={(e) => setTipDraft({ ...tipDraft, uniId: e.target.value })}>
                  {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <select value={tipDraft.category} onChange={(e) => setTipDraft({ ...tipDraft, category: e.target.value })}>
                  {TIP_CATEGORIES.map((c) => <option key={c} value={c}>{c === "Uni" ? "About the uni" : c === "Country" ? "About the country" : "About the major"}</option>)}
                </select>
              </div>
              <textarea placeholder="Share something you wish you'd known before you got there…" value={tipDraft.text} onChange={(e) => setTipDraft({ ...tipDraft, text: e.target.value })} />
              {tipError && <div className="wp-error">{tipError}</div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
                <button className="wp-btn-gold" type="submit" style={{ marginTop: 12 }}>Post note</button>
                <div className="wp-tip-as">
                  {myProfile
                    ? <><span className="wp-avatar sm">{initials(myProfile.name)}</span> posting as <b style={{ color: "var(--sea)", fontWeight: 500 }}>{myProfile.name}</b></>
                    : "You'll set up a quick profile when you post — that's how others can reach you."}
                </div>
              </div>
            </form>

            {tips === null && <p className="wp-empty">Loading notes…</p>}
            {tips && tipUnis.map((u) => (
              <div className="wp-uni-group" key={u.id}>
                <div className="wp-uni-group-head">
                  <h3>{u.flag} {u.name}</h3>
                  <span>{u.country} · {tipsByUni[u.id].length} note{tipsByUni[u.id].length > 1 ? "s" : ""}</span>
                </div>
                <div className="wp-tip-grid">
                  {tipsByUni[u.id].map((t) => {
                    const author = profiles[t.authorId];
                    return (
                      <div className="wp-tip-card" key={t.id}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Quote size={14} className="q" />
                          <span className="wp-cat-chip">{catOf(t) === "Uni" ? "Uni" : catOf(t) === "Country" ? "Country" : "Major"}</span>
                        </div>
                        <div className="wp-tip-text">{t.text}</div>
                        <button className="wp-tip-author" onClick={() => author && setViewProfileId(author.id)} disabled={!author}>
                          <span className="wp-avatar sm">{author ? initials(author.name) : "?"}</span>
                          <span className="meta">
                            <span className="nm">{author ? author.name : "Former student"}</span>
                            {author?.course ? ` · ${author.course}` : ""}<br />
                            {timeAgo(t.ts)}{author ? ` · tap to connect` : ""}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
            {tips && tipUnis.length === 0 && <p className="wp-empty">No notes for this filter yet — switch country or be the first to post one.</p>}
          </section>
        )}

        {/* ---------- Notes ---------- */}
        {activeTab === "notes" && (
          <section>
            <div className="wp-section-head">
              <h2>The note exchange</h2>
              <span>give {NOTES_UNLOCK_PAGES} pages, get everything</span>
            </div>

            <div className="wp-plan-top">
              <div className="wp-plan-dest" style={{ flex: "2 1 300px" }}>
                <div className="lbl">{notesUnlocked ? "Library unlocked" : "Unlock the library"}</div>
                <div style={{ fontSize: 13.5, color: "var(--cream-dim)", lineHeight: 1.6 }}>
                  {notesUnlocked
                    ? `You've shared ${myPublishedPages} pages — every note in the exchange is open to you. Keep contributing to keep it alive.`
                    : `Publish ${NOTES_UNLOCK_PAGES} pages of your own notes to read and download everyone else's. Give first, then take. (~${WORDS_PER_PAGE} words = 1 page)`}
                </div>
              </div>
              <div className="wp-progress">
                <div className="row">
                  <span className="pct">{Math.min(myPublishedPages, NOTES_UNLOCK_PAGES)}/{NOTES_UNLOCK_PAGES}</span>
                  <span className="cnt">pages published</span>
                </div>
                <div className="wp-bar"><div style={{ width: `${Math.min(100, (myPublishedPages / NOTES_UNLOCK_PAGES) * 100)}%` }} /></div>
              </div>
              <button className="wp-btn-gold" onClick={() => {
                if (!myProfile) { setShowProfileSetup(true); return; }
                setShowNoteForm(true);
              }}><PlusCircle size={13} /> Upload notes</button>
            </div>

            <div className="wp-controls">
              <div className="wp-pills">
                {notesMajors.map((m) => (
                  <button key={m} className={`wp-pill ${notesMajor === m ? "on" : ""}`} onClick={() => setNotesMajor(m)}>{m}</button>
                ))}
              </div>
            </div>

            {notes === null && <p className="wp-empty">Loading notes…</p>}
            {notes && filteredNotes.length === 0 && <p className="wp-empty">No notes for this major yet — upload the first set.</p>}
            {notes && filteredNotes.length > 0 && (
              <div className="wp-act-grid">
                {filteredNotes.map((n) => {
                  const author = profiles[n.authorId];
                  const mine = myProfile && n.authorId === myProfile.id;
                  const canOpen = notesUnlocked || mine;
                  return (
                    <article className="wp-ticket" key={n.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                        <span className="wp-ticket-type study"><BookOpen size={11} /> {n.major}</span>
                        <span className="wp-count"><b>{n.pages}</b> pages</span>
                      </div>
                      <h3>{n.title}</h3>
                      <div className="wp-ticket-meta">
                        <div><GraduationCap size={13} /> {uniById(n.uniId)?.name || "Unknown uni"}</div>
                        <div><Users size={13} />
                          {author ? (
                            <button className="wp-linklike" onClick={() => setViewProfileId(author.id)}>{author.name}</button>
                          ) : "Former student"} · {timeAgo(n.ts)}
                        </div>
                      </div>
                      <p className="wp-ticket-desc" style={{ opacity: canOpen ? 1 : 0.5 }}>
                        {canOpen ? `${n.content.slice(0, 140)}…` : "Preview locked — publish your own notes to open the library."}
                      </p>
                      <div className="wp-ticket-foot">
                        {mine && <span className="wp-host-badge">Your upload</span>}
                        {!mine && !canOpen && <span className="wp-count" style={{ display: "flex", alignItems: "center", gap: 6 }}><Lock size={11} /> {NOTES_UNLOCK_PAGES - myPublishedPages} pages to unlock</span>}
                        {canOpen && !mine && <span />}
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className="wp-join" disabled={!canOpen} style={!canOpen ? { opacity: 0.4, cursor: "default" } : {}} onClick={() => canOpen && setOpenNoteId(n.id)}>Read</button>
                          <button className="wp-join" disabled={!canOpen} style={!canOpen ? { opacity: 0.4, cursor: "default" } : {}} onClick={() => canOpen && downloadNote(n)}><Download size={12} /></button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ---------- Activities ---------- */}
        {activeTab === "activities" && (
          <section>
            <div className="wp-section-head">
              <h2>Grow some roots</h2>
              <span>student-run · grouped by campus</span>
            </div>

            <div className="wp-controls">
              <select className="wp-select" value={actUniFilter} onChange={(e) => setActUniFilter(e.target.value)}>
                <option value="all">All universities</option>
                {UNIVERSITIES.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}{myProfile?.uniId === u.id ? " (my uni)" : ""}</option>
                ))}
              </select>
              <button className="wp-btn-gold" onClick={() => {
                if (!myProfile) { setShowProfileSetup(true); return; }
                setActDraft((d) => ({ ...d, uniId: myProfile.uniId }));
                setShowActForm(true);
              }}>
                <PlusCircle size={13} /> Host an activity
              </button>
            </div>

            {activities === null && <p className="wp-empty">Loading activities…</p>}
            {activities && actUniIds.length === 0 && (
              <div className="wp-empty-state">
                <h3>Nothing on this campus yet.</h3>
                <p>Activities here are run by students, for students. If nothing exists at your uni, that's your opening — host the first one.</p>
                <button className="wp-btn-gold" style={{ margin: "0 auto" }} onClick={() => {
                  if (!myProfile) { setShowProfileSetup(true); return; }
                  setActDraft((d) => ({ ...d, uniId: actUniFilter === "all" ? (myProfile?.uniId || UNIVERSITIES[0].id) : actUniFilter }));
                  setShowActForm(true);
                }}><PlusCircle size={13} /> Host the first activity</button>
              </div>
            )}
            {activities && actUniIds.map((uid) => {
              const u = uniById(uid);
              return (
                <div className="wp-uni-group" key={uid}>
                  <div className="wp-uni-group-head">
                    <h3>{u.flag} {u.name}</h3>
                    <span>{actsByUni[uid].length} event{actsByUni[uid].length > 1 ? "s" : ""}</span>
                    {myProfile?.uniId === uid && <span className="mine-badge">My uni</span>}
                  </div>
                  <div className="wp-act-grid">
                    {actsByUni[uid].map((a) => (
                      <article className="wp-ticket" key={a.id}>
                        {stampActivity === a.id && <div className="wp-stamp"><span>✦</span>You're in</div>}
                        <span className={`wp-ticket-type ${a.type.toLowerCase()}`}>
                          {a.type === "Garden" ? <Sprout size={11} /> : <Users size={11} />} {a.type}
                        </span>
                        <h3>{a.title}</h3>
                        <div className="wp-ticket-meta">
                          <div><Calendar size={13} /> {a.date}</div>
                          <div><MapPin size={13} /> {a.location}</div>
                          <div><GraduationCap size={13} /> Hosted by <span className="wp-host-badge" style={{ marginLeft: 2 }}>{a.host}</span></div>
                        </div>
                        {a.description && <p className="wp-ticket-desc">{a.description}</p>}

                        {a.signups.length > 0 && (
                          <div className="wp-attendees">
                            {a.signups.slice(0, 6).map((n) => <span className="wp-att" key={n}>{n}</span>)}
                            {a.signups.length > 6 && <span className="wp-att">+{a.signups.length - 6} more</span>}
                          </div>
                        )}

                        <div className="wp-ticket-foot">
                          <span className="wp-count"><b>{a.signups.length}</b> signed up</span>
                          {!(a.signupIds || []).includes(userId)
                            ? <button className="wp-join" onClick={() => signUp(a.id)}>Sign up</button>
                            : <span className="wp-host-badge">You're in ✦</span>}
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ---------- Friends ---------- */}
        {activeTab === "friends" && (
          <section>
            <div className="wp-section-head">
              <h2>Your people</h2>
              <span>{friendProfiles.length} friend{friendProfiles.length === 1 ? "" : "s"}</span>
            </div>

            {friendProfiles.length === 0 ? (
              <div className="wp-empty-state">
                <h3>No friends yet — but that's the whole point of this place.</h3>
                <p>Head to the Tips tab, find a note from someone at a university you're curious about, and tap their name to connect and start a conversation.</p>
                <button className="wp-btn-gold" style={{ margin: "0 auto" }} onClick={() => setActiveTab("tips")}>
                  <Users size={13} /> Browse field notes
                </button>
              </div>
            ) : (
              <div className="wp-friend-grid">
                {friendProfiles.map((p) => (
                  <button className="wp-friend" key={p.id} onClick={() => setViewProfileId(p.id)}>
                    <span className="wp-avatar md">{initials(p.name)}</span>
                    <span style={{ flex: 1 }}>
                      <span className="wp-friend-name">{p.name}</span>
                      <div className="wp-friend-sub">
                        <GraduationCap size={12} />{uniById(p.uniId)?.name || "Unknown"}<br />
                        <MapPin size={12} />{p.country}{p.course ? ` · ${p.course}` : ""}
                      </div>
                      <span className="wp-friend-msg"><MessageCircle size={11} /> Open chat <ChevronRight size={11} /></span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* ---------- Host activity overlay ---------- */}
      {showActForm && (
        <div className="wp-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowActForm(false); }}>
          <div className="wp-sheet">
            <button className="wp-close" onClick={() => setShowActForm(false)} aria-label="Close"><X size={16} /></button>
            <form className="wp-form" onSubmit={submitActivity}>
              <h3>Host an activity</h3>
              <p className="wp-form-sub">You'll be listed as the host and auto-signed-up. Keep it on campus or somewhere public, and be there when you say you will.</p>
              <div className="wp-field">
                <label>Title</label>
                <input placeholder="e.g. Sunset Rooftop Garden Session" value={actDraft.title} onChange={(e) => setActDraft({ ...actDraft, title: e.target.value })} />
              </div>
              <div className="wp-field-row">
                <div className="wp-field">
                  <label>University</label>
                  <select value={actDraft.uniId} onChange={(e) => setActDraft({ ...actDraft, uniId: e.target.value })}>
                    {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="wp-field">
                  <label>Type</label>
                  <select value={actDraft.type} onChange={(e) => setActDraft({ ...actDraft, type: e.target.value })}>
                    {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className="wp-field-row">
                <div className="wp-field">
                  <label>When</label>
                  <input placeholder="e.g. Thursdays · 5pm" value={actDraft.date} onChange={(e) => setActDraft({ ...actDraft, date: e.target.value })} />
                </div>
                <div className="wp-field">
                  <label>Where</label>
                  <input placeholder="e.g. Library Courtyard" value={actDraft.location} onChange={(e) => setActDraft({ ...actDraft, location: e.target.value })} />
                </div>
              </div>
              <div className="wp-field">
                <label>Description (optional)</label>
                <textarea placeholder="What should people expect or bring?" value={actDraft.description} onChange={(e) => setActDraft({ ...actDraft, description: e.target.value })} />
              </div>
              {actError && <div className="wp-error">{actError}</div>}
              <button className="wp-btn-gold" type="submit" style={{ marginTop: 8 }}><PlusCircle size={13} /> Publish activity</button>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Upload notes overlay ---------- */}
      {showNoteForm && (
        <div className="wp-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowNoteForm(false); }}>
          <div className="wp-sheet">
            <button className="wp-close" onClick={() => setShowNoteForm(false)} aria-label="Close"><X size={16} /></button>
            <form className="wp-form" onSubmit={submitNote}>
              <h3>Upload your notes</h3>
              <p className="wp-form-sub">Paste your notes below or import a .txt/.md file. ~{WORDS_PER_PAGE} words counts as one page. Only share notes you wrote yourself — don't upload textbook scans, lecture slides, or anything copyrighted.</p>
              <div className="wp-field">
                <label>Title</label>
                <input placeholder="e.g. IR Theory — Realism vs Liberalism Summary" value={noteDraft.title} onChange={(e) => setNoteDraft({ ...noteDraft, title: e.target.value })} />
              </div>
              <div className="wp-field-row">
                <div className="wp-field">
                  <label>Major</label>
                  <select value={noteDraft.major} onChange={(e) => setNoteDraft({ ...noteDraft, major: e.target.value })}>
                    {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="wp-field">
                  <label>University</label>
                  <select value={noteDraft.uniId} onChange={(e) => setNoteDraft({ ...noteDraft, uniId: e.target.value })}>
                    {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="wp-field">
                <label>Notes content · currently ≈ {noteDraft.content.trim() ? pageCount(noteDraft.content) : 0} page{pageCount(noteDraft.content || "a") === 1 ? "" : "s"}</label>
                <textarea style={{ minHeight: 180 }} placeholder="Paste your notes here…" value={noteDraft.content} onChange={(e) => setNoteDraft({ ...noteDraft, content: e.target.value })} />
              </div>
              <div className="wp-field">
                <label>Or import a file (.txt / .md)</label>
                <input type="file" accept=".txt,.md,text/plain,text/markdown" onChange={readNoteFile} />
              </div>
              {noteError && <div className="wp-error">{noteError}</div>}
              <button className="wp-btn-gold" type="submit" style={{ marginTop: 8 }}><BookOpen size={13} /> Publish notes</button>
            </form>
          </div>
        </div>
      )}

      {/* ---------- Note reader overlay ---------- */}
      {openNote && (
        <div className="wp-overlay" onClick={(e) => { if (e.target === e.currentTarget) setOpenNoteId(null); }}>
          <div className="wp-sheet">
            <button className="wp-close" onClick={() => setOpenNoteId(null)} aria-label="Close"><X size={16} /></button>
            <div className="wp-form" style={{ paddingBottom: 20 }}>
              <span className="wp-ticket-type study" style={{ marginBottom: 14 }}><BookOpen size={11} /> {openNote.major}</span>
              <h3 style={{ marginBottom: 4 }}>{openNote.title}</h3>
              <p className="wp-form-sub" style={{ marginBottom: 16 }}>
                {uniById(openNote.uniId)?.name} · {profiles[openNote.authorId]?.name || "Former student"} · {openNote.pages} pages
              </p>
              <div className="wp-note-body">{openNote.content}</div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button className="wp-btn-gold" onClick={() => downloadNote(openNote)}><Download size={13} /> Download .txt</button>
                <button className="wp-btn-ghost" onClick={() => setOpenNoteId(null)}><ArrowLeft size={12} style={{ marginRight: 6 }} />Back</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Profile view overlay ---------- */}
      {viewProfile && (
        <div className="wp-overlay" onClick={(e) => { if (e.target === e.currentTarget) setViewProfileId(null); }}>
          <div className="wp-sheet">
            <button className="wp-close" onClick={() => setViewProfileId(null)} aria-label="Close profile"><X size={16} /></button>
            <div className="wp-prof-head">
              <div className="wp-avatar">{initials(viewProfile.name)}</div>
              <div>
                <h2 className="wp-prof-name">{viewProfile.name} {friends.includes(viewProfile.id) && <UserCheck size={16} color="#7FB8A4" />}</h2>
                <div className="wp-prof-sub">
                  <GraduationCap size={13} color="#7FB8A4" /> {uniById(viewProfile.uniId)?.name || "Unknown university"}
                  <span className="sep">·</span>
                  <MapPin size={13} color="#7FB8A4" /> {viewProfile.country}
                  {viewProfile.course && <><span className="sep">·</span>{viewProfile.course}</>}
                </div>
              </div>
            </div>
            {viewProfile.bio && <div className="wp-prof-bio">"{viewProfile.bio}"</div>}

            {!isSelf && myProfile && (
              <div className="wp-compat">
                {compat ? (
                  <>
                    <div className="wp-compat-ring" style={{ "--p": compat.pct }}>
                      <span>{compat.pct}%</span>
                    </div>
                    <div>
                      <div className="wp-compat-label"><Zap size={13} /> {compat.label}</div>
                      <div className="wp-compat-sub">You matched on {compat.matches} of {QUIZ.length} vibe questions — {compat.matches >= 3 ? "you'd probably survive a road trip together." : "different styles, which is often exactly what you need abroad."}</div>
                    </div>
                  </>
                ) : (
                  <div className="wp-compat-sub" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Zap size={13} color="#D9A441" />
                    {myProfile.quiz ? `${viewProfile.name.split(" ")[0]} hasn't taken the vibe quiz yet.` : "Take the vibe quiz (edit your profile) to see your compatibility."}
                  </div>
                )}
              </div>
            )}

            {!isSelf && (
              <>
                <div className="wp-prof-actions">
                  <button className="wp-btn-ghost" onClick={() => toggleFriend(viewProfile.id)}>
                    {friends.includes(viewProfile.id) ? <><UserCheck size={12} style={{ marginRight: 6 }} />Friends</> : <><UserPlus size={12} style={{ marginRight: 6 }} />Add friend</>}
                  </button>
                </div>

                {myProfile ? (
                  <div className="wp-dm">
                    <div className="wp-dm-head">
                      <span><MessageCircle size={11} style={{ marginRight: 6, verticalAlign: -1 }} />Message {viewProfile.name.split(" ")[0]}</span>
                      <button className="wp-dm-refresh" onClick={() => loadDm(viewProfile.id)}><RefreshCw size={10} /> Refresh</button>
                    </div>
                    <div className="wp-dm-log">
                      {dm.loading && <span className="wp-dm-empty">Loading messages…</span>}
                      {!dm.loading && dm.msgs.length === 0 && <span className="wp-dm-empty">No messages yet — ask about their tip, their uni, or just say hi.</span>}
                      {dm.msgs.map((m, i) => (
                        <div key={i} className={`wp-dm-msg ${m.from === userId ? "mine" : "theirs"}`}>{m.text}</div>
                      ))}
                      <div ref={dmEndRef} />
                    </div>
                    <div className="wp-dm-form">
                      <input placeholder={`Ask ${viewProfile.name.split(" ")[0]} about their tip…`} value={dmInput} onChange={(e) => setDmInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendDm()} />
                      <button className="wp-dm-send" onClick={sendDm} disabled={!dmInput.trim()}><Send size={15} /></button>
                    </div>
                    <div className="wp-dm-note">
                      Messages are private between you two. Be kind — and if someone isn't, {" "}
                      <button className="wp-linklike" onClick={() => { api.fileReport(userId, "profile", viewProfile.id, "Reported from DM view"); alert("Thanks — we've logged your report and will review it."); }}><Flag size={9} style={{ verticalAlign: -1 }} /> report them</button>.
                    </div>
                  </div>
                ) : (
                  <div className="wp-form" style={{ paddingTop: 18 }}>
                    <p className="wp-form-sub" style={{ marginBottom: 14 }}>Create your profile to message {viewProfile.name.split(" ")[0]}.</p>
                    <button className="wp-btn-gold" onClick={() => { setViewProfileId(null); setShowProfileSetup(true); }}><UserPlus size={13} /> Create profile</button>
                  </div>
                )}
              </>
            )}
            {isSelf && (
              <div className="wp-prof-actions">
                <button className="wp-btn-ghost" onClick={() => {
                  setProfileForm({ name: myProfile.name, uniId: myProfile.uniId, country: myProfile.country, course: myProfile.course, stage: myProfile.stage || STAGES[0], bio: myProfile.bio, quiz: myProfile.quiz || Array(QUIZ.length).fill(null) });
                  setViewProfileId(null);
                  setShowProfileSetup(true);
                }}>Edit profile</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------- Profile setup overlay ---------- */}
      {showProfileSetup && (
        <div className="wp-overlay" onClick={(e) => { if (e.target === e.currentTarget) { setShowProfileSetup(false); setPendingTip(false); } }}>
          <div className="wp-sheet">
            <button className="wp-close" onClick={() => { setShowProfileSetup(false); setPendingTip(false); }} aria-label="Close"><X size={16} /></button>
            <form className="wp-form" onSubmit={saveProfile}>
              <h3>{myProfile ? "Edit your profile" : "Set up your profile"}</h3>
              <p className="wp-form-sub">
                {pendingTip
                  ? "Your note will post right after — a profile is how other students can reach you about it."
                  : "Your profile personalises Buddy's advice and your landing plan, and lets other students find and message you."}
              </p>
              <div className="wp-field">
                <label>Display name</label>
                <input required placeholder="e.g. Ousha A." value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div className="wp-field-row">
                <div className="wp-field">
                  <label>University (attending or targeting)</label>
                  <select value={profileForm.uniId} onChange={(e) => setProfileForm({ ...profileForm, uniId: e.target.value })}>
                    {UNIVERSITIES.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="wp-field">
                  <label>Where you are in the journey</label>
                  <select value={profileForm.stage} onChange={(e) => setProfileForm({ ...profileForm, stage: e.target.value })}>
                    {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="wp-field-row">
                <div className="wp-field">
                  <label>Country you're in now</label>
                  <select value={profileForm.country} onChange={(e) => setProfileForm({ ...profileForm, country: e.target.value })}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="wp-field">
                  <label>Year & course (optional)</label>
                  <input placeholder="e.g. 1st-year, Political Science" value={profileForm.course} onChange={(e) => setProfileForm({ ...profileForm, course: e.target.value })} />
                </div>
              </div>
              <div className="wp-field">
                <label>Short bio (optional)</label>
                <textarea placeholder="What can people ask you about?" value={profileForm.bio} onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })} />
              </div>

              <div className="wp-quiz">
                <div className="wp-quiz-head"><Zap size={12} /> Vibe quiz <span>optional · powers compatibility scores</span></div>
                {QUIZ.map((qz, qi) => (
                  <div className="wp-quiz-q" key={qi}>
                    <div className="qt">{qz.q}</div>
                    <div className="wp-pills">
                      {qz.options.map((opt, oi) => (
                        <button type="button" key={oi} className={`wp-pill ${profileForm.quiz?.[qi] === oi ? "on" : ""}`}
                          onClick={() => {
                            const next = [...(profileForm.quiz || Array(QUIZ.length).fill(null))];
                            next[qi] = oi;
                            setProfileForm({ ...profileForm, quiz: next });
                          }}>{opt}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <button className="wp-btn-gold" type="submit" disabled={!profileForm.name.trim()}>
                {pendingTip ? "Save & post my note" : "Save profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
