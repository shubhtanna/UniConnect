export type DirectoryProfile = {
  userId: string;
  name: string;
  profilePhotoUrl: string;
  cohort: string;
  skills: string[];
  interests: string[];
  lookingFor: string;
  currentProject: string;
};

export type DirectoryResponse = {
  profiles: DirectoryProfile[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  facets: {
    cohorts: string[];
    skills: string[];
    interests: string[];
  };
};
