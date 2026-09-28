import type { Education, WorkExperience } from "@/lib/profile-types";

export type SearchableProfile = {
  userId: string;
  profileState?: "claimed" | "unclaimed";
  name: string;
  profilePhotoUrl: string;
  cohort: string;
  skills: string[];
  interests: string[];
  workExperience: WorkExperience[];
  education: Education[];
  currentProject: string;
  lookingFor: string;
  linkedinUrl: string;
  contactLink: string;
  resumeEmbedding: number[];
  vectorScore?: number;
};

export type ConnectionCard = Omit<SearchableProfile, "resumeEmbedding" | "vectorScore"> & {
  score: number;
  matchReason: string;
};

export type ConnectionSearchResponse = {
  answer: string;
  profiles: ConnectionCard[];
  searchMode: "atlas-vector" | "application-vector";
  answerMode: "ai" | "local";
};
