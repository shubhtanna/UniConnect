import assert from "node:assert/strict";
import test from "node:test";
import { contentSafetyIssue, isSafePublicHttpsUrl } from "@/lib/content-safety";
import {
  commentSchema,
  createPostSchema,
  reportSchema,
} from "@/lib/feed-validation";

test("feed text blocks abusive and executable content on the server", () => {
  assert.equal(commentSchema.safeParse({ text: "m@darchod" }).success, false);
  assert.equal(
    commentSchema.safeParse({ text: "<script>alert(1)</script>" }).success,
    false,
  );
  assert.equal(
    commentSchema.safeParse({ text: "Useful respectful feedback" }).success,
    true,
  );
});

test("public links must be direct HTTPS destinations", () => {
  assert.equal(isSafePublicHttpsUrl("https://example.com/path"), true);
  for (const value of [
    "http://example.com",
    "https://bit.ly/test",
    "https://127.0.0.1/a",
    "https://user:pass@example.com",
  ])
    assert.equal(isSafePublicHttpsUrl(value), false);
  assert.ok(contentSafetyIssue("visit https://bit.ly/test"));
});

test("spotlight links and report reasons are validated", () => {
  assert.equal(
    createPostSchema.safeParse({
      type: "spotlight",
      content: "A useful venture",
      mediaUrls: [],
      businessName: "Demo",
      businessLink: "http://demo.com",
      category: "SaaS",
    }).success,
    false,
  );
  assert.equal(
    reportSchema.safeParse({ category: "other", reason: "bad" }).success,
    false,
  );
  assert.equal(
    reportSchema.safeParse({
      category: "spam_or_scam",
      reason: "This repeatedly promotes a suspicious offer.",
    }).success,
    true,
  );
});
