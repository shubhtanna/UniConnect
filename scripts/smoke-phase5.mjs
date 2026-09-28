import assert from "node:assert/strict";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";
const runId = `${Date.now()}-${Math.floor(Math.random() * 10_000)}`;

async function json(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function signInAndCompleteProfile(number, profile) {
  const email = `phase5-${runId}-${number}@mastersunion.org`;
  const requested = await json("/api/auth/request-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  assert.equal(requested.response.status, 200, JSON.stringify(requested.body));
  assert.match(requested.body.devOtp ?? "", /^\d{6}$/);

  const verified = await json("/api/auth/verify-otp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp: requested.body.devOtp }),
  });
  assert.equal(verified.response.status, 200, JSON.stringify(verified.body));
  assert.equal(verified.body.redirectTo, "/profile/setup");
  const cookie = verified.response.headers.get("set-cookie")?.split(";", 1)[0];
  assert.ok(cookie, "Session cookie was not issued");

  const completed = await json("/api/profile/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: profile.name,
      profilePhotoUrl: `/api/files/phase5-photo-${number}`,
      resumeUrl: `/api/files/phase5-resume-${number}`,
      cohort: "PGP TBM 2026",
      skills: profile.skills,
      workExperience: profile.workExperience,
      education: [],
      currentProject: profile.currentProject,
      lookingFor: profile.lookingFor,
      linkedinUrl: "",
      contactLink: `mailto:${email}`,
      fieldsFilledManually: [],
    }),
  });
  assert.equal(completed.response.status, 200, JSON.stringify(completed.body));
  return { email, cookie };
}

const invalidDomain = await json("/api/auth/request-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: `outsider-${runId}@example.com` }),
});
assert.equal(invalidDomain.response.status, 400);

const protectedPage = await fetch(`${baseUrl}/connections`, { redirect: "manual" });
assert.equal(protectedPage.status, 307);
assert.match(protectedPage.headers.get("location") ?? "", /\/login(?:\?next=%2Fconnections)?$/);

const seeker = await signInAndCompleteProfile(1, {
  name: "Aarav Searcher",
  skills: ["Finance", "Operations"],
  currentProject: "Exploring campus ventures",
  lookingFor: "A consumer growth collaborator",
  workExperience: [],
});

await signInAndCompleteProfile(2, {
  name: "Mira Growth",
  skills: ["Ecommerce", "Growth Marketing", "Consumer Insights"],
  currentProject: "Building a sustainable consumer brand",
  lookingFor: "A product and operations collaborator",
  workExperience: [{ company: "Demo Commerce", role: "Growth Intern", duration: "2025", description: "Ran ecommerce acquisition experiments" }],
});

const invalidSpotlight = await json("/api/feed", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: seeker.cookie },
  body: JSON.stringify({ type: "spotlight", content: "Missing required fields", mediaUrls: [] }),
});
assert.equal(invalidSpotlight.response.status, 400);

const searched = await json("/api/connections/search", {
  method: "POST",
  headers: { "Content-Type": "application/json", Cookie: seeker.cookie },
  body: JSON.stringify({ query: "Who has ecommerce growth marketing experience for a consumer brand?" }),
});
assert.equal(searched.response.status, 200, JSON.stringify(searched.body));
assert.ok(searched.body.profiles.length >= 1, "Search returned no matching profiles");
assert.equal(searched.body.profiles[0].name, "Mira Growth");
assert.match(searched.body.answer, /Mira Growth/);
assert.equal(JSON.stringify(searched.body).includes("resumeUrl"), false);
assert.equal(JSON.stringify(searched.body).includes("resumeEmbedding"), false);

console.log(JSON.stringify({
  domainValidation: "passed",
  protectedRedirect: "passed",
  signInAndSetup: "passed",
  modelValidation: "passed",
  groundedSearch: searched.body.profiles.map((profile) => profile.name),
  searchMode: searched.body.searchMode,
  answerMode: searched.body.answerMode,
}));
