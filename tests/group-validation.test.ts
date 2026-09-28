import assert from "node:assert/strict";
import test from "node:test";
import { createGroupSchema, groupMessageSchema } from "@/lib/group-validation";

test("brainstorm groups normalize and deduplicate topic tags", () => {
  const parsed = createGroupSchema.parse({
    name: "Climate-tech sprint",
    description: "A focused space to test climate-tech problems and ideas.",
    tags: [" Climate ", "research", "climate"],
    access: "open",
    inviteEmails: [],
  });

  assert.deepEqual(parsed.tags, ["Climate", "research"]);
});

test("brainstorm groups reject invalid invite domains and excessive tags", () => {
  const invalidEmail = createGroupSchema.safeParse({
    name: "D2C founders",
    description:
      "Share customer research and build useful experiments together.",
    tags: ["D2C"],
    access: "invite_only",
    inviteEmails: ["person@gmail.com"],
  });
  const tooManyTags = createGroupSchema.safeParse({
    name: "Research circle",
    description:
      "Explore a focused question with classmates over a short sprint.",
    tags: ["one", "two", "three", "four", "five", "six", "seven"],
    access: "open",
    inviteEmails: [],
  });

  assert.equal(invalidEmail.success, false);
  assert.equal(tooManyTags.success, false);
});

test("brainstorm messages require content and enforce the length boundary", () => {
  assert.equal(groupMessageSchema.safeParse({ body: "  " }).success, false);
  assert.equal(
    groupMessageSchema.safeParse({ body: "x".repeat(2000) }).success,
    true,
  );
  assert.equal(
    groupMessageSchema.safeParse({ body: "x".repeat(2001) }).success,
    false,
  );
});

test("brainstorm groups and messages reject abusive content and unsafe links", () => {
  assert.equal(
    groupMessageSchema.safeParse({ body: "you are chutiya" }).success,
    false,
  );
  assert.equal(
    groupMessageSchema.safeParse({ body: "open javascript:alert(1)" }).success,
    false,
  );
  assert.equal(
    createGroupSchema.safeParse({
      name: "Useful group",
      description: "Please use https://bit.ly/unsafe for everything here.",
      tags: ["Ideas"],
      access: "open",
      inviteEmails: [],
    }).success,
    false,
  );
});
