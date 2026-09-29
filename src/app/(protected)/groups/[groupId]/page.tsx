import { notFound } from "next/navigation";
import { requirePageSession } from "@/lib/auth";
import { getGroupRoom } from "@/lib/group-store";
import {
  GroupMessageActions,
  GroupOwnerActions,
  JoinGroup,
  MessageComposer,
} from "@/components/groups/GroupActions";

export default async function Page({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const user = await requirePageSession();
  const { groupId } = await params;
  const room = await getGroupRoom(user.id, groupId);
  if (!room) notFound();
  return (
    <main className="grid-texture min-h-screen px-6 pb-28 pt-10">
      <div className="mx-auto max-w-4xl">
        <p className="eyebrow">Brainstorm room</p>
        <h1 className="mt-3 text-4xl font-semibold">{room.group.name}</h1>
        <p className="mt-3 max-w-3xl leading-7 text-muted">
          {room.group.description}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {room.group.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        {room.isOwner && (
          <GroupOwnerActions
            id={groupId}
            name={room.group.name}
            description={room.group.description}
            tags={room.group.tags}
            access={room.group.access}
          />
        )}
        {!room.isMember ? (
          <div className="panel mt-8 p-8 text-center">
            <p className="mb-5 text-muted">
              Join to read and contribute to the discussion.
            </p>
            <JoinGroup id={groupId} />
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-3">
              {room.messages.map((message) => (
                <article className="panel p-4" key={message.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-teal">
                      {message.author?.name ?? "MU student"} ·{" "}
                      {new Date(message.createdAt).toLocaleString()}
                      {message.editedAt ? " · edited" : ""}
                    </p>
                    <GroupMessageActions
                      groupId={groupId}
                      messageId={message.id}
                      body={message.body}
                      canEdit={message.canEdit}
                      canDelete={message.canDelete}
                    />
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                    {message.body}
                  </p>
                </article>
              ))}
              {!room.messages.length && (
                <p className="panel p-8 text-center text-muted">
                  Start with the problem, context, and the first question.
                </p>
              )}
            </div>
            <MessageComposer id={groupId} />
          </>
        )}
      </div>
    </main>
  );
}
