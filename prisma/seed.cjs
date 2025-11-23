// prisma/seed.cjs
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// DiceBear thumbs avatar helper
const avatar = (seed) =>
  `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(seed)}`;

async function main() {
  console.log("🌱 Seeding KUWHY database...");

  // Fixed IDs so we can reference them everywhere
  const aliceId = "11111111-1111-1111-1111-111111111111"; // member
  const bobId   = "22222222-2222-2222-2222-222222222222"; // admin
  const carolId = "33333333-3333-3333-3333-333333333333"; // member
  const daveId  = "44444444-4444-4444-4444-444444444444"; // anonymous / trouble user

  // ---------------------------------------------------------------------------
  // users (app profile)
  // ---------------------------------------------------------------------------
  await prisma.users.createMany({
    data: [
      {
        user_id: aliceId,
        user_name: "alice",
        full_name: "Alice Doe",
        location: "Campus dorm A",
        phone: "0000000000",
        web: "https://example.com/alice",
        bio: "CS student trying to balance grades, health, and side projects.",
        login_name: "alice",
        party_id: 2,
        gender: "Female",
        img: avatar("alice"),
        role: "member",
        email: "alice@example.com",
        password: null
      },
      {
        user_id: bobId,
        user_name: "admin-bob",
        full_name: "Bob Admin",
        location: "Library building",
        phone: "0000000001",
        web: "https://example.com/bob",
        bio: "Keeps KUWHY somewhat under control. Enjoys refactoring and green tests.",
        login_name: "admin",
        party_id: 2,
        gender: "Male",
        img: avatar("admin-bob"),
        role: "admin",
        email: "admin@example.com",
        password: null
      },
      {
        user_id: carolId,
        user_name: "carol",
        full_name: "Carol Nguyen",
        location: "Off-campus apartment",
        phone: "0000000002",
        web: "https://example.com/carol",
        bio: "Loves game jams, cozy cafés, and talking about mental health in tech.",
        login_name: "carol",
        party_id: 3,
        gender: "Female",
        img: avatar("carol"),
        role: "member",
        email: "carol@example.com",
        password: null
      },
      {
        user_id: daveId,
        user_name: "sleep-is-overrated",
        full_name: "Dave Unknown",
        location: "Unknown",
        phone: "0000000003",
        web: "https://example.com/dave",
        bio: "Sometimes a bit too intense about ranked games.",
        login_name: null,
        party_id: 0,
        gender: "Not_Specified",
        img: avatar("sleep-is-overrated"),
        role: "anonymous",
        email: null,
        password: null
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // notes (some with party enabled)
  // ---------------------------------------------------------------------------
  await prisma.note.createMany({
    data: [
      {
        note_id: 1,
        user_id: aliceId,
        message: "Looking for someone to quickly review my database schema tonight.",
        max_party: 0,
        crr_party: 0
      },
      {
        note_id: 2,
        user_id: bobId,
        message: "Late night study party – algorithms and data structures only.",
        max_party: 4,
        crr_party: 3
      },
      {
        note_id: 3,
        user_id: carolId,
        message: "Chill game & health chat – how do you balance ranked with sleep?",
        max_party: 6,
        crr_party: 3
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // party members
  // ---------------------------------------------------------------------------
  await prisma.party_members.createMany({
    data: [
      // Note #2 study party
      { note_id: 2, user_id: aliceId },
      { note_id: 2, user_id: bobId },
      { note_id: 2, user_id: carolId },

      // Note #3 game & health chat
      { note_id: 3, user_id: bobId },
      { note_id: 3, user_id: carolId },
      { note_id: 3, user_id: aliceId }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // party messages (live chat)
  // ---------------------------------------------------------------------------
  await prisma.party_messages.createMany({
    data: [
      // Study party (note 2)
      {
        note_id: 2,
        user_id: bobId,
        content:
          "Welcome to the late night study party! Quick rule: short questions, no spoilers."
      },
      {
        note_id: 2,
        user_id: aliceId,
        content:
          "I’m stuck on a dynamic programming problem about longest increasing subsequence."
      },
      {
        note_id: 2,
        user_id: carolId,
        content:
          "Same, also trying to stay awake without drinking a third energy drink."
      },

      // Game & health chat (note 3)
      {
        note_id: 3,
        user_id: carolId,
        content:
          "Anyone else getting sleepy after just one ranked match lately?"
      },
      {
        note_id: 3,
        user_id: bobId,
        content:
          "I stand up and stretch every two games. It surprisingly keeps my aim stable."
      },
      {
        note_id: 3,
        user_id: aliceId,
        content:
          "I’m trying a rule: no ranked after midnight. My mood has improved a lot."
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // blogs (with tags; attachments not required for UI → set null)
  // ---------------------------------------------------------------------------
  await prisma.blog.createMany({
    data: [
      {
        blog_id: 1,
        user_id: aliceId,
        blog_title: "How I stay sane during exam season",
        message:
          "Exam season used to completely destroy my sleep and my mood. " +
          "Now I use small routines: morning walks, offline evenings, and tiny reflections after each study block.",
        blog_up: 7,
        blog_down: 1,
        attachments: null,
        tags: ["study", "mental health", "routines", "university"]
      },
      {
        blog_id: 2,
        user_id: bobId,
        blog_title: "Quick healthy snacks for late-night coding",
        message:
          "If I only eat instant noodles, my brain shuts down by midnight. " +
          "Here are a few quick snacks that keep my energy more stable without a sugar crash.",
        blog_up: 10,
        blog_down: 0,
        attachments: null,
        tags: ["food", "health", "coding", "snacks", "productivity"]
      },
      {
        blog_id: 3,
        user_id: carolId,
        blog_title: "Looking for teammates for an online game jam",
        message:
          "There’s a small weekend game jam coming up. I’m looking for 1–2 people " +
          "who care about storytelling, accessibility, and not burning out in 48 hours.",
        blog_up: 5,
        blog_down: 0,
        attachments: null,
        tags: ["game", "team", "event", "collaboration", "health"]
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // comments (blogs + notes + threaded replies + YouTube links)
  // ---------------------------------------------------------------------------
  await prisma.comment.createMany({
    data: [
      // ===== Blog #1 tree =====
      {
        comment_id: 1,
        user_id: bobId,
        blog_id: 1,
        note_id: null,
        parent_comment_id: null,
        message:
          "Breaking the material into 25-minute sprints really helps me stay focused."
      },
      {
        comment_id: 2,
        user_id: aliceId,
        blog_id: 1,
        note_id: null,
        parent_comment_id: 1,
        message:
          "Same here! I also write a tiny reflection after each sprint so my brain can close the loop."
      },
      {
        comment_id: 3,
        user_id: carolId,
        blog_id: 1,
        note_id: null,
        parent_comment_id: null,
        message:
          "Short walks between sessions are underrated. My brain literally feels fresher."
      },

      // ===== Blog #2 tree =====
      {
        comment_id: 4,
        user_id: aliceId,
        blog_id: 2,
        note_id: null,
        parent_comment_id: null,
        message:
          "Greek yogurt with granola is my go-to when I want something fast but not too heavy."
      },
      {
        comment_id: 5,
        user_id: carolId,
        blog_id: 2,
        note_id: null,
        parent_comment_id: 4,
        message:
          "Plus a handful of frozen berries on top. It feels like dessert but still decently healthy."
      },

      // ===== Blog #3 tree =====
      {
        comment_id: 6,
        user_id: aliceId,
        blog_id: 3,
        note_id: null,
        parent_comment_id: null,
        message:
          "What engine are you planning to use? Unity, Godot, or something else?"
      },
      {
        comment_id: 7,
        user_id: bobId,
        blog_id: 3,
        note_id: null,
        parent_comment_id: null,
        message:
          "If the team needs a backend person, I can handle APIs and simple matchmaking."
      },

      // ===== Note #2 tree (study party note) =====
      {
        comment_id: 8,
        user_id: aliceId,
        blog_id: null,
        note_id: 2,
        parent_comment_id: null,
        message:
          "I’ll join the voice channel after I finish this LeetCode problem."
      },
      {
        // reply from Bob to Alice
        comment_id: 11,
        user_id: bobId,
        blog_id: null,
        note_id: 2,
        parent_comment_id: 8,
        message:
          "No rush. If you want a quick explanation first, I can walk through the idea."
      },
      {
        // nested reply from Carol with a YouTube link (for preview feature)
        comment_id: 12,
        user_id: carolId,
        blog_id: null,
        note_id: 2,
        parent_comment_id: 11,
        message:
          "This video explains dynamic programming really clearly: https://www.youtube.com/watch?v=OQ5jsbhAv_M"
      },

      // ===== Note #3 tree (game & health note) =====
      {
        // problematic comment – will be reported
        comment_id: 9,
        user_id: daveId,
        blog_id: null,
        note_id: 3,
        parent_comment_id: null,
        message:
          "Sleep is overrated, just grind ranked all night and drink more energy drinks."
      },
      {
        // reply from Carol (healthy perspective)
        comment_id: 10,
        user_id: carolId,
        blog_id: null,
        note_id: 3,
        parent_comment_id: 9,
        message:
          "Jokes aside, please take breaks. Burnout hits harder than any losing streak."
      },
      {
        // nested reply from Alice, with another YouTube link about sleep/health
        comment_id: 13,
        user_id: aliceId,
        blog_id: null,
        note_id: 3,
        parent_comment_id: 10,
        message:
          "If you like videos, this talk about sleep and performance is great: https://www.youtube.com/watch?v=5MuIMqhT8DM"
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // notifications (comment / reply / party events, including note trees)
  // ---------------------------------------------------------------------------
  await prisma.notifications.createMany({
    data: [
      // Bob comments on Alice's blog #1 -> notify Alice (comment on blog)
      {
        recipient_id: aliceId,
        sender_id: bobId,
        blog_id: 1,
        note_id: null,
        comment_id: 1,
        parent_comment_id: null,
        type: "comment",
        is_read: false
      },
      // Alice replies to Bob's comment #1 -> notify Bob (reply)
      {
        recipient_id: bobId,
        sender_id: aliceId,
        blog_id: 1,
        note_id: null,
        comment_id: 2,
        parent_comment_id: 1,
        type: "reply",
        is_read: false
      },
      // Carol replies on blog #2 -> notify Alice (reply to her comment #4)
      {
        recipient_id: aliceId,
        sender_id: carolId,
        blog_id: 2,
        note_id: null,
        comment_id: 5,
        parent_comment_id: 4,
        type: "reply",
        is_read: true
      },

      // Alice comments on Bob's study note #2 -> notify Bob (comment)
      {
        recipient_id: bobId,
        sender_id: aliceId,
        blog_id: null,
        note_id: 2,
        comment_id: 8,
        parent_comment_id: null,
        type: "comment",
        is_read: false
      },
      // Bob replies to Alice on note #2 -> notify Alice (reply)
      {
        recipient_id: aliceId,
        sender_id: bobId,
        blog_id: null,
        note_id: 2,
        comment_id: 11,
        parent_comment_id: 8,
        type: "reply",
        is_read: false
      },
      // Carol replies with YouTube link on note #2 -> notify Bob (reply)
      {
        recipient_id: bobId,
        sender_id: carolId,
        blog_id: null,
        note_id: 2,
        comment_id: 12,
        parent_comment_id: 11,
        type: "reply",
        is_read: false
      },

      // Dave's unhealthy comment on note #3 got a reply -> notify Dave (reply)
      {
        recipient_id: daveId,
        sender_id: carolId,
        blog_id: null,
        note_id: 3,
        comment_id: 10,
        parent_comment_id: 9,
        type: "reply",
        is_read: false
      },
      // Alice’s nested reply (with YT link) on note #3 -> notify Carol (reply)
      {
        recipient_id: carolId,
        sender_id: aliceId,
        blog_id: null,
        note_id: 3,
        comment_id: 13,
        parent_comment_id: 10,
        type: "reply",
        is_read: false
      },

      // Alice joins Bob's study party on note #2 -> notify Bob (party_join)
      {
        recipient_id: bobId,
        sender_id: aliceId,
        blog_id: null,
        note_id: 2,
        comment_id: null,
        parent_comment_id: null,
        type: "party_join",
        is_read: true
      },
      // Bob sends a party message on note #2 -> notify Alice (party_chat)
      {
        recipient_id: aliceId,
        sender_id: bobId,
        blog_id: null,
        note_id: 2,
        comment_id: null,
        parent_comment_id: null,
        type: "party_chat",
        is_read: false
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // user reports (moderation)
  // ---------------------------------------------------------------------------
  await prisma.user_report.createMany({
    data: [
      // Alice reports Dave's unhealthy comment on note #3
      {
        reporter_id: aliceId,
        target_user_id: daveId,
        target_type: "comment",
        note_id: 3,
        comment_id: 9,
        blog_id: null,
        reason: "Promoting extremely unhealthy behaviour.",
        detail:
          "Tells people to skip sleep and just drink more energy drinks. " +
          "Might be a joke, but this is a sensitive topic for some users.",
        status: "pending",
        resolution_action: null,
        resolved_at: null,
        resolved_by: null
      },
      // Carol reports spam on note #3, already resolved by admin Bob
      {
        reporter_id: carolId,
        target_user_id: daveId,
        target_type: "note",
        note_id: 3,
        comment_id: null,
        blog_id: null,
        reason: "Repeated off-topic messages in party chat.",
        detail:
          "User kept pushing people to overwork and ignore health in multiple sessions.",
        status: "resolved",
        resolution_action: "TIMEOUT",
        resolved_at: new Date(),
        resolved_by: bobId
      }
    ],
    skipDuplicates: true
  });

  // ---------------------------------------------------------------------------
  // user punishments
  // ---------------------------------------------------------------------------
  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);

  await prisma.user_punishment.createMany({
    data: [
      {
        user_id: daveId,
        ip_address: null,
        type: "BAN_USER",
        reason: "Repeated toxic behaviour around sleep and health topics.",
        created_at: new Date(),
        expires_at: null,
        revoked_at: null,
        created_by: bobId,
        revoked_by: null
      },
      {
        user_id: null,
        ip_address: "203.0.113.42",
        type: "TIMEOUT",
        reason: "Abusive language in party chat.",
        created_at: new Date(),
        expires_at: twoHoursFromNow,
        revoked_at: null,
        created_by: bobId,
        revoked_by: null
      }
    ],
    skipDuplicates: true
  });

  console.log("✅ Seeding completed.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
