import Link from "next/link";
import { requirePageSession } from "@/lib/auth";
import {
  getPendingGroupInvitations,
  getVisibleGroups,
} from "@/lib/group-store";
import { CreateGroupForm } from "@/components/groups/CreateGroupForm";
import { InvitationActions } from "@/components/groups/GroupActions";

export const metadata = { title: "Brainstorm groups" };

export default async function Page() {
  const user = await requirePageSession();
  const [groups, invitations] = await Promise.all([
    getVisibleGroups(user.id),
    getPendingGroupInvitations(user.email),
  ]);

  return (
    <main className="min-h-screen px-6 pb-28 pt-10">
      <div className="mx-auto max-w-6xl">
        <p className="eyebrow">Brainstorm groups</p>
        <h1 className="mt-3 text-4xl font-semibold">
          Focused rooms for ideas that need a few minds.
        </h1>
        <p className="mt-3 text-muted">
          Keep durable context here instead of losing it in scattered chats.
        </p>

        {invitations.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Invitations for you</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  Join a focused conversation
                </h2>
              </div>
              <p className="text-sm text-muted">
                {invitations.length} pending
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {invitations.map((invitation) => (
                <article
                  key={invitation.id}
                  className="panel border-teal/30 p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <h3 className="text-xl font-semibold">
                      {invitation.groupName}
                    </h3>
                    <span className="rounded-full border border-line px-3 py-1 text-xs text-muted">
                      Invite only
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                    {invitation.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {invitation.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/5 px-3 py-1 text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <InvitationActions
                    invitationId={invitation.id}
                    groupId={invitation.groupId}
                  />
                </article>
              ))}
            </div>
          </section>
        )}

        <CreateGroupForm />

        <section className="mt-8">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold">Your group rooms</h2>
            <p className="text-sm text-muted">
              {groups.length} group{groups.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <Link
                href={`/groups/${group._id}`}
                key={group._id.toString()}
                className="panel p-6 transition hover:border-teal/40"
              >
                <div className="flex justify-between gap-4">
                  <h3 className="text-xl font-semibold">{group.name}</h3>
                  <span className="text-xs text-muted">
                    {group.access === "open" ? "Open" : "Invite only"}
                  </span>
                </div>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted">
                  {group.description}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-white/5 px-3 py-1 text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-teal">
                  {group.memberIds.length} member
                  {group.memberIds.length === 1 ? "" : "s"} →
                </p>
              </Link>
            ))}
          </div>
          {!groups.length && (
            <p className="panel mt-4 p-8 text-center text-muted">
              No groups yet. Create the first focused room above.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
