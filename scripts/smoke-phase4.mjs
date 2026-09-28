const baseUrl = process.env.UNICONNECT_URL ?? "http://localhost:3000";
const email = `phase4.smoke+${Date.now()}@mastersunion.org`;

async function call(path, options = {}, expectedStatus) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  if (expectedStatus ? response.status !== expectedStatus : !response.ok) {
    throw new Error(`${path}: expected ${expectedStatus ?? "success"}, got ${response.status} (${body.error ?? "unknown"})`);
  }
  return { response, body };
}

const requested = await call("/api/auth/request-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
const verified = await call("/api/auth/verify-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, otp: requested.body.devOtp }),
});
const cookie = verified.response.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("Session cookie missing");

const imageData = new FormData();
imageData.append(
  "file",
  new Blob(
    [Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlQAAAABJRU5ErkJggg==", "base64")],
    { type: "image/png" },
  ),
  "phase4.png",
);
const photo = await call("/api/profile/upload-photo", {
  method: "POST",
  headers: { Cookie: cookie },
  body: imageData,
});
await call("/api/profile/complete", {
  method: "POST",
  headers: { Cookie: cookie, "Content-Type": "application/json" },
  body: JSON.stringify({
    name: "Phase Four Student",
    profilePhotoUrl: photo.body.url,
    resumeUrl: "/api/files/smoke-resume",
    cohort: "PGP TBM 2026",
    skills: ["Community Building", "Product Management"],
    workExperience: [],
    education: [],
    currentProject: "Testing the UniConnect feed.",
    lookingFor: "Collaborators",
    linkedinUrl: "",
    contactLink: `mailto:${email}`,
    fieldsFilledManually: [],
  }),
});

const mediaData = new FormData();
mediaData.append(
  "file",
  new Blob(
    [Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlQAAAABJRU5ErkJggg==", "base64")],
    { type: "image/png" },
  ),
  "post.png",
);
const media = await call("/api/feed/upload-media", {
  method: "POST",
  headers: { Cookie: cookie },
  body: mediaData,
});

const community = await call("/api/feed", {
  method: "POST",
  headers: { Cookie: cookie, "Content-Type": "application/json" },
  body: JSON.stringify({
    type: "community",
    content: "Testing the Community feed end to end.",
    mediaUrls: [media.body.url],
  }),
});
const postId = community.body.postId;
await call(`/api/feed/${postId}/like`, { method: "POST", headers: { Cookie: cookie } });
await call(`/api/feed/${postId}/share`, { method: "POST", headers: { Cookie: cookie } });
const comment = await call(`/api/feed/${postId}/comments`, {
  method: "POST",
  headers: { Cookie: cookie, "Content-Type": "application/json" },
  body: JSON.stringify({ text: "A verified smoke-test comment." }),
});
await call(`/api/feed/${postId}/report`, { method: "POST", headers: { Cookie: cookie } });
await call(`/api/feed/${postId}/comments/${comment.body.commentId}/report`, {
  method: "POST",
  headers: { Cookie: cookie },
});

const spotlightIds = [];
for (const index of [1, 2]) {
  const spotlight = await call("/api/feed", {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "spotlight",
      content: `Spotlight smoke test ${index}.`,
      mediaUrls: [],
      businessName: `Venture ${index}`,
      businessLink: "https://example.com",
      category: "Technology",
    }),
  });
  spotlightIds.push(spotlight.body.postId);
}
await call(
  "/api/feed",
  {
    method: "POST",
    headers: { Cookie: cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "spotlight",
      content: "This third post must be rejected.",
      mediaUrls: [],
      businessName: "Venture 3",
      businessLink: "https://example.com",
      category: "Technology",
    }),
  },
  429,
);

const communityFeed = await call("/api/feed?type=community", { headers: { Cookie: cookie } });
const savedPost = communityFeed.body.posts.find((post) => post.id === postId);
if (!savedPost || savedPost.likeCount !== 1 || savedPost.commentCount !== 1 || savedPost.shareCount !== 1) {
  throw new Error("Community interactions were not persisted correctly");
}
const spotlightFeed = await call("/api/feed?type=spotlight", { headers: { Cookie: cookie } });
if (!spotlightIds.every((id) => spotlightFeed.body.posts.some((post) => post.id === id))) {
  throw new Error("New Spotlight posts were not returned by the feed");
}

console.log(
  JSON.stringify({
    communityPost: "created",
    media: "uploaded privately",
    like: savedPost.likeCount,
    comment: savedPost.commentCount,
    share: savedPost.shareCount,
    report: savedPost.reportCount,
    spotlights: spotlightFeed.body.posts.length,
    thirdSpotlight: "rate-limited",
  }),
);
