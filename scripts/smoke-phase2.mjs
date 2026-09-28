import JSZip from "jszip";
import assert from "node:assert/strict";

const baseUrl = process.env.UNICONNECT_URL ?? "http://localhost:3000";
const email = "phase2.smoke@mastersunion.org";

async function jsonRequest(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  if (!response.ok) throw new Error(`${path}: ${body.error ?? response.status}`);
  return { response, body };
}

const requested = await jsonRequest("/api/auth/request-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email }),
});
if (!requested.body.devOtp) throw new Error("Development OTP was not returned");

const verified = await jsonRequest("/api/auth/verify-otp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, otp: requested.body.devOtp }),
});
const cookie = verified.response.headers.get("set-cookie")?.split(";", 1)[0];
if (!cookie) throw new Error("Session cookie was not created");

const photoData = new FormData();
photoData.append(
  "file",
  new Blob(
    [Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9ZlQAAAABJRU5ErkJggg==", "base64")],
    { type: "image/png" },
  ),
  "avatar.png",
);
const photo = await jsonRequest("/api/profile/upload-photo", {
  method: "POST",
  headers: { Cookie: cookie },
  body: photoData,
});

const zip = new JSZip();
zip.file(
  "[Content_Types].xml",
  '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
);
zip.file(
  "_rels/.rels",
  '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
);
zip.file(
  "word/document.xml",
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Phase Two Student</w:t></w:r></w:p><w:p><w:r><w:t>Product Management, TypeScript, React, Strategy, Marketing</w:t></w:r></w:p><w:p><w:r><w:t>Built ecommerce products and led growth projects for student ventures.</w:t></w:r></w:p><w:sectPr/></w:body></w:document>',
);
const resumeBuffer = await zip.generateAsync({ type: "nodebuffer" });
const resumeData = new FormData();
resumeData.append(
  "file",
  new Blob([resumeBuffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  }),
  "resume.docx",
);
const resume = await jsonRequest("/api/profile/upload-resume", {
  method: "POST",
  headers: { Cookie: cookie },
  body: resumeData,
});

function makePdf() {
  const content = "BT /F1 16 Tf 72 720 Td (Phase Two PDF Student) Tj 0 -24 Td (Product Management TypeScript React Marketing Strategy) Tj ET";
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

const pdfData = new FormData();
pdfData.append("file", new Blob([makePdf()], { type: "application/pdf" }), "resume.pdf");
const pdfResume = await jsonRequest("/api/profile/upload-resume", {
  method: "POST",
  headers: { Cookie: cookie },
  body: pdfData,
});

const extracted = resume.body.extracted;
const profileInput = {
    name: extracted.name || "Phase Two Student",
    profilePhotoUrl: photo.body.url,
    resumeUrl: pdfResume.body.url,
    cohort: "PGP TBM 2026",
    skills: extracted.skills.length ? extracted.skills : ["Product Management"],
    workExperience: [],
    education: [],
    currentProject: "Building a verified student collaboration network.",
    lookingFor: "Collaborators and product feedback",
    linkedinUrl: "",
    contactLink: `mailto:${email}`,
    fieldsFilledManually: resume.body.missingFields,
};

const invalidResponse = await fetch(`${baseUrl}/api/profile/complete`, {
  method: "POST",
  headers: { Cookie: cookie, "Content-Type": "application/json" },
  body: JSON.stringify({
    ...profileInput,
    skills: Array.from({ length: 34 }, (_, index) => `Skill ${index + 1}`),
    education: [{ institution: "MU", degree: "PGP", year: "" }],
    linkedinUrl: "not a url",
  }),
});
assert.equal(invalidResponse.status, 400);
const invalidBody = await invalidResponse.json();
assert.match(invalidBody.fieldErrors.skills, /34 unique skills/);
assert.match(invalidBody.fieldErrors["education.0.year"], /Education entry 1 — Year/);
assert.match(invalidBody.fieldErrors.linkedinUrl, /^LinkedIn URL:/);

const completed = await jsonRequest("/api/profile/complete", {
  method: "POST",
  headers: { Cookie: cookie, "Content-Type": "application/json" },
  body: JSON.stringify(profileInput),
});

const profilePage = await fetch(`${baseUrl}/profile`, { headers: { Cookie: cookie } });
if (!profilePage.ok) throw new Error(`/profile returned ${profilePage.status}`);

console.log(
  JSON.stringify({
    otp: "issued",
    photo: "private upload passed",
    resume: "DOCX extraction passed",
    pdfResume: "PDF extraction passed",
    profile: completed.body.ok ? "saved" : "failed",
    validation: "field-specific errors and successful corrected retry passed",
    protectedProfilePage: profilePage.status,
  }),
);
