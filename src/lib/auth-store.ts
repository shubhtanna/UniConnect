import { randomUUID } from "crypto";
import { connectToDatabase } from "@/lib/db";
import { getServerEnv } from "@/lib/env";
import { EmailOtp } from "@/models/EmailOtp";
import { User } from "@/models/User";

export type AuthChallenge = {
  email: string;
  otpHash: string;
  expiresAt: Date;
  resendAvailableAt: Date;
  attempts: number;
};

export type AuthUser = {
  id: string;
  email: string;
  isEmailVerified: boolean;
  isProfileComplete: boolean;
};

type MemoryAuthStore = {
  challenges: Map<string, AuthChallenge>;
  users: Map<string, AuthUser>;
};

const globalWithAuthStore = globalThis as typeof globalThis & {
  uniconnectMemoryAuth?: MemoryAuthStore;
};

const memoryStore = globalWithAuthStore.uniconnectMemoryAuth ?? {
  challenges: new Map<string, AuthChallenge>(),
  users: new Map<string, AuthUser>(),
};

globalWithAuthStore.uniconnectMemoryAuth = memoryStore;

function usesMemoryStore() {
  return getServerEnv().DATABASE_MODE === "memory";
}

export async function getAuthChallenge(email: string): Promise<AuthChallenge | null> {
  if (usesMemoryStore()) return memoryStore.challenges.get(email) ?? null;

  await connectToDatabase();
  const challenge = await EmailOtp.findOne({ email }).select("+otpHash").lean();
  if (!challenge) return null;

  return {
    email: challenge.email,
    otpHash: challenge.otpHash,
    expiresAt: challenge.expiresAt,
    resendAvailableAt: challenge.resendAvailableAt,
    attempts: challenge.attempts,
  };
}

export async function saveAuthChallenge(challenge: AuthChallenge) {
  if (usesMemoryStore()) {
    memoryStore.challenges.set(challenge.email, challenge);
    return;
  }

  await connectToDatabase();
  await EmailOtp.findOneAndUpdate(
    { email: challenge.email },
    { $set: challenge },
    { upsert: true, runValidators: true },
  );
}

export async function incrementAuthAttempts(email: string) {
  if (usesMemoryStore()) {
    const challenge = memoryStore.challenges.get(email);
    if (challenge) challenge.attempts += 1;
    return;
  }

  await connectToDatabase();
  await EmailOtp.updateOne({ email }, { $inc: { attempts: 1 } });
}

export async function deleteAuthChallenge(email: string) {
  if (usesMemoryStore()) {
    memoryStore.challenges.delete(email);
    return;
  }

  await connectToDatabase();
  await EmailOtp.deleteOne({ email });
}

export async function upsertVerifiedUser(email: string): Promise<AuthUser> {
  if (usesMemoryStore()) {
    const existing = [...memoryStore.users.values()].find((user) => user.email === email);
    if (existing) {
      existing.isEmailVerified = true;
      return existing;
    }

    const user: AuthUser = {
      id: randomUUID(),
      email,
      isEmailVerified: true,
      isProfileComplete: false,
    };
    memoryStore.users.set(user.id, user);
    return user;
  }

  await connectToDatabase();
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { isEmailVerified: true }, $setOnInsert: { isProfileComplete: false } },
    { new: true, upsert: true, runValidators: true },
  );

  return {
    id: user._id.toString(),
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    isProfileComplete: user.isProfileComplete,
  };
}

export async function getAuthUserById(id: string): Promise<AuthUser | null> {
  if (usesMemoryStore()) return memoryStore.users.get(id) ?? null;

  await connectToDatabase();
  const user = await User.findById(id).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    isProfileComplete: user.isProfileComplete,
  };
}

export function completeMemoryUserProfile(id: string) {
  const user = memoryStore.users.get(id);
  if (user) user.isProfileComplete = true;
}
