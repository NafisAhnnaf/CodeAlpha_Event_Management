import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
import db from "../config/db.ts";
import { sql } from "drizzle-orm";
import { events, users } from "../db/schema.ts";

async function main() {
  console.log("Running migration check on Neon DB...");
  
  // 1. Add banner_url column if it doesn't exist
  await db.execute(sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS banner_url TEXT;`);
  console.log("Verified 'banner_url' column on 'events' table.");

  // 2. Safe check on registrations unique constraint
  try {
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'user_event_unique'
        ) THEN
          ALTER TABLE registrations ADD CONSTRAINT user_event_unique UNIQUE (user_id, event_id);
        END IF;
      END $$;
    `);
    console.log("Verified 'user_event_unique' constraint on 'registrations'.");
  } catch (err: any) {
    console.warn("Notice on constraint check:", err.message);
  }

  // 3. Find an organizer user or admin user
  const allUsers = await db.select().from(users);
  console.log(`Found ${allUsers.length} users in database.`);
  
  let organizer = allUsers.find((u) => u.role === "organizer" || u.role === "admin") || allUsers[0];
  if (!organizer) {
    console.error("No users found in database to assign as organizer!");
    process.exit(1);
  }
  console.log(`Using organizer: ${organizer.name} (${organizer.email}, role: ${organizer.role})`);

  // 4. Define the 6 extracted events from the OCR banners
  const bannerEvents = [
    {
      name: "Hackathon 2026: Shielding Communication Integrity",
      summary: "Shielding the Integrity of Communication in the era of pervasive Mis/Dis-information.",
      description: `<h3>Shielding the Integrity of Communication</h3>
<p>Join researchers, developers, investigative journalists, and media ethicists at <strong>Hackathon 2026</strong>. In an era dominated by pervasive mis- and dis-information, deepfakes, and automated bot networks, safeguarding communication integrity has become paramount.</p>
<h4>Organized By:</h4>
<ul>
  <li>Panteion University of Social and Political Sciences</li>
  <li>DiGi (Diplomacy, Campaigning, Law Research Unit)</li>
  <li>General Secretariat for Communication and Media</li>
</ul>
<h4>Tracks & Challenges:</h4>
<ul>
  <li>AI-Powered Fact Verification & Provenance Tracking</li>
  <li>Synthetic Media & Deepfake Detection Pipelines</li>
  <li>Civic Trust Networks & Decentralized Fact-Checking</li>
</ul>`,
      platform: "online" as const,
      venue: "Panteion University & Global Hybrid Portal",
      banner_url: "/banners/hackathon_2026_horiz.png",
      isPaid: false,
      start_date: new Date("2026-06-05T09:00:00Z"),
      end_date: new Date("2026-06-07T18:00:00Z"),
    },
    {
      name: "2026 EaP Civic Tech Hackathon",
      summary: "Empowering civic activists and tech leaders across the Eastern Partnership to build high-impact civic solutions.",
      description: `<h3>2026 EaP Civic Tech Hackathon</h3>
<p>The <strong>Eastern Partnership (EaP) Civic Tech Hackathon 2026</strong> brings together top civic activists, digital transformers, UI/UX designers, and software engineers from across Europe and the EaP region to prototype game-changing civic tech tools.</p>
<p><em>Funded by the European Union under the Eastern Partnership Civil Society Facility.</em></p>
<h4>Key Themes:</h4>
<ul>
  <li>Open Government Data & Budget Transparency</li>
  <li>Public Services Accessibility & Digital Inclusion</li>
  <li>Community Resilience & Environmental Action Monitoring</li>
</ul>
<p>Winning teams receive incubation funding and mentorship to take their prototypes to deployment.</p>`,
      platform: "onsite" as const,
      venue: "Chișinău Digital Hub, Chișinău, Moldova",
      banner_url: "/banners/eap_civic_tech_2026.webp",
      isPaid: false,
      start_date: new Date("2026-04-17T09:00:00Z"),
      end_date: new Date("2026-04-19T20:00:00Z"),
    },
    {
      name: "AURO & IBM National Hackathon 2026",
      summary: "24 Hours of Innovation, Code & Creativity powered by AURO University and IBM Innovation Centre for Education.",
      description: `<h3>24 Hours of Pure Innovation & Code</h3>
<p>AURO University, in premier collaboration with <strong>IBM ICE (Innovation Centre for Education)</strong>, invites collegiate coders, designers, and innovators nationwide to the flagship <strong>National Hackathon 2026</strong>.</p>
<h4>Featured Domains:</h4>
<ul>
  <li>Enterprise Generative AI & WatsonX Solutions</li>
  <li>Next-Gen FinTech & Secure Smart Contracts</li>
  <li>Smart Healthcare, IoT & Sustainable Smart Cities</li>
</ul>
<p>Participants get 24 hours of non-stop hacking, direct mentorship from IBM cloud architects, industry swag, and cash prizes.</p>`,
      platform: "onsite" as const,
      venue: "AURO University Campus, Surat, Gujarat, India",
      banner_url: "/banners/auro_national_hackathon_2026.png",
      isPaid: false,
      start_date: new Date("2026-03-23T10:00:00Z"),
      end_date: new Date("2026-03-24T18:00:00Z"),
    },
    {
      name: "UNESCO Global Youth Hackathon 2026",
      summary: "Global Media and Information Literacy Week (#GlobalMILWeek2026) empowering youth in digital media ethics.",
      description: `<h3>UNESCO Global Youth Hackathon 2026</h3>
<p>Coinciding with <strong>Global Media and Information Literacy (MIL) Week 2026</strong>, UNESCO is hosting an international youth hackathon addressing critical challenges in the digital ecosystem.</p>
<h4>Mission:</h4>
<p>Harnessing youth innovation to foster critical digital engagement, counter hate speech, celebrate diversity, and ensure algorithmic transparency.</p>
<h4>Who Can Join:</h4>
<p>Youth ages 18–35 worldwide. Projects will be evaluated by an international jury of educators, digital human rights champions, and technologists.</p>`,
      platform: "online" as const,
      venue: "UNESCO Virtual Portal / Global Livestream",
      banner_url: "/banners/unesco_youth_hackathon_2026.png",
      isPaid: false,
      start_date: new Date("2026-10-24T08:00:00Z"),
      end_date: new Date("2026-10-31T20:00:00Z"),
    },
    {
      name: "MBA Case Competition World Cup 2026",
      summary: "The premier global business strategy cup co-hosted by Management Consulted and Case Questions.",
      description: `<h3>MBA Case Competition World Cup 2026</h3>
<p>Co-hosted by <strong>Management Consulted</strong> and <strong>Case Questions</strong>: the definitive global proving ground for top MBA talent, strategists, and problem-solvers.</p>
<h4>Format:</h4>
<ul>
  <li><strong>Round 1:</strong> Market Entry & Profitability Diagnostic (Virtual)</li>
  <li><strong>Round 2:</strong> M&A Synergy & Digital Transformation Case</li>
  <li><strong>Finals:</strong> Live Executive Board Presentation before former McKinsey, BCG, and Bain Partners</li>
</ul>
<p>Top teams receive interview referrals with global strategy consultancies and cash prizes.</p>`,
      platform: "online" as const,
      venue: "Global Virtual Arena / Management Consulted HQ",
      banner_url: "/banners/mba_case_competition_2026.jpeg",
      isPaid: true,
      start_date: new Date("2026-09-18T13:00:00Z"),
      end_date: new Date("2026-09-20T21:00:00Z"),
    },
    {
      name: "TRILYTICS 2026: Data Analytics Competition",
      summary: "Analyze. Insight. Strategize. Impact. Tri-institute flagship analytics competition by PGDBA Conclave (IIM Calcutta, IIT Kharagpur, ISI Kolkata).",
      description: `<h3>India's Biggest Data Analytics Competition</h3>
<p><strong>TRILYTICS 2026</strong> is the premier national data analytics contest organized by <strong>PGDBA Conclave</strong> — the combined flagship program of <strong>IIM Calcutta, IIT Kharagpur, and ISI Kolkata</strong>.</p>
<h4>Competition Highlights:</h4>
<ul>
  <li><strong>Title Sponsor:</strong> Sun Pharma</li>
  <li><strong>Media Partner:</strong> The Times of India</li>
  <li><strong>Learning Partner:</strong> AceMBA</li>
  <li><strong>Cash Prizes Worth:</strong> ₹2,50,000</li>
  <li><strong>Last Date to Register:</strong> 3 July, 2026</li>
</ul>
<p>Tackle real-world pharmaceutical and supply chain datasets using machine learning, optimization, and strategic business intelligence.</p>`,
      platform: "onsite" as const,
      venue: "IIM Calcutta Campus, Kolkata, India",
      banner_url: "/banners/trilytics_analytics_2026.jpeg",
      isPaid: false,
      start_date: new Date("2026-07-10T09:30:00Z"),
      end_date: new Date("2026-07-12T19:00:00Z"),
    },
  ];

  // 5. Insert or update events
  console.log("Seeding events into database...");
  for (const ev of bannerEvents) {
    // Check if event already exists with this name
    const existing = await db.query.events.findFirst({
      where: (tbl, { eq }) => eq(tbl.name, ev.name),
    });

    if (existing) {
      await db.update(events)
        .set({
          ...ev,
          organizer_id: organizer.id,
        })
        .where(sql`id = ${existing.id}`);
      console.log(`Updated event: "${ev.name}"`);
    } else {
      await db.insert(events).values({
        ...ev,
        organizer_id: organizer.id,
      });
      console.log(`Inserted event: "${ev.name}"`);
    }
  }

  console.log("All banner events successfully populated in Neon DB!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration/Seeding failed:", err);
  process.exit(1);
});
