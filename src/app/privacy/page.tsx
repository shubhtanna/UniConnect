import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Privacy" };

// Replace with the official UniConnect or Masters' Union contact before launch.
const PRIVACY_CONTACT = "shubh.tanna_pgpaias27@mastersunion.org";
const LAST_UPDATED = "19 October 2026";

const sections: Array<{ title: string; body: string[] }> = [
  {
    title: "Who can use UniConnect",
    body: [
      "UniConnect is a private network for verified Masters' Union students. You sign in with a one-time code sent to your @mastersunion.org email. There are no passwords and nothing is visible to the public internet.",
    ],
  },
  {
    title: "What we collect",
    body: [
      "Account: your MU email address and whether your profile is complete.",
      "Profile: the details you add or confirm, such as name, cohort, photo, skills, interests, work experience, education, current project, what you are looking for, LinkedIn URL and contact link.",
      "Resume: the file you upload, and the text extracted from it to fill in your profile.",
      "Activity: posts, comments, likes, reports, brainstorm groups, group messages and invitations, and profile views.",
      "Some students' profiles were prepared from their cohort's Master CV collection. A prepared profile stays hidden from everyone until its owner signs in with their own MU email and claims it.",
    ],
  },
  {
    title: "Who sees what",
    body: [
      "Other verified students can see your profile, including your photo and contact link, along with your posts and your messages in groups you belong to.",
      "Only you can open your resume file.",
      "Your profile views are named or anonymous, depending on the setting you choose. Anonymous views never show your identity to the person you viewed.",
    ],
  },
  {
    title: "How AI is used",
    body: [
      "When you upload a resume, its text goes to OpenAI to create a draft profile that you review before saving. Your profile text is also turned into an embedding (a numeric summary) so classmates can find you by describing what they need.",
      "UniConnect sends this data through the OpenAI API, which does not use it to train OpenAI's models by default. We do not use AI to infer sensitive traits such as religion, politics, health or personality.",
    ],
  },
  {
    title: "Where data is stored",
    body: [
      "Account, profile and activity data is stored in MongoDB Atlas. Photos, feed images and resumes are stored in Cloudinary, with access controlled by the app. Login codes are sent through an email provider. The app runs on Vercel.",
      "We do not sell your data, show ads or use third-party analytics trackers.",
    ],
  },
  {
    title: "Deleting your account",
    body: [
      "You can permanently delete your account at any time from My profile → Delete account. This removes your account, your profile and any prepared Master CV profile, your photo and resume files, your posts and their images, your comments, likes and group messages, the groups you created, your invitations, and your profile-view history.",
      "Reports you submitted stay with the reported post, so moderation records remain intact. If you sign in again later, you will start with a new, empty account.",
    ],
  },
  {
    title: "Questions",
    body: [
      `For privacy questions or help with your data, email ${PRIVACY_CONTACT} from your MU address.`,
    ],
  },
];

export default function PrivacyPage() {
  return (
    <main className="grid-texture min-h-dvh bg-app text-ink">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-6 sm:px-6">
        <Logo />
        <Link href="/login" className="text-sm font-medium text-muted transition hover:text-ink">
          Sign in
        </Link>
      </header>
      <article className="mx-auto w-full max-w-3xl px-5 pb-20 pt-6 sm:px-6">
        <p className="eyebrow">Privacy</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
          How UniConnect handles your data
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated {LAST_UPDATED}</p>
        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <div className="mt-3 space-y-3 leading-7 text-white/75">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}
