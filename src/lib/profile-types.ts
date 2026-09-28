export type WorkExperience = {
  company: string;
  role: string;
  duration: string;
  description: string;
};

export type Education = {
  institution: string;
  degree: string;
  year: string;
};

export type ProfileInput = {
  name: string;
  profilePhotoUrl: string;
  resumeUrl: string;
  cohort: string;
  skills: string[];
  interests: string[];
  workExperience: WorkExperience[];
  education: Education[];
  currentProject: string;
  lookingFor: string;
  linkedinUrl: string;
  contactLink: string;
  fieldsFilledManually: string[];
  resumeEmbedding: number[];
};

export type StoredProfile = ProfileInput & {
  id: string;
  userId: string;
  origin: "self" | "masters_cv";
  sourceResumeName: string;
  preloadedNoticeAcknowledgedAt: string | null;
  createdAt: string;
  updatedAt: string;
};
