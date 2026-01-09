export type AutocompleteSuggestion = {
  surface: string;
  conceptName?: string;
  conceptType?: string;
  lastUsedAt?: string | null;
  usageCount?: number;
};

export type AutocompleteResponse = {
  suggestions: AutocompleteSuggestion[];
};

export type RecommendationReason = 'most_recent' | 'most_frequent';

export type SurfaceRecommendation = {
  reason: RecommendationReason;
  surface: string;
  usageCount?: number;
  lastUsedAt?: string | null;
};

export type Span = {
  start: number;
  end: number;
};

export type ConsistencyRecommendation = {
  canonicalName: string;
  conceptType?: string;
  inputSurface?: string | null;
  span?: Span | null;
  mostRecent?: SurfaceRecommendation | null;
  mostFrequent?: SurfaceRecommendation | null;
};

export type ConsistencyError = {
  stage: string;
  message: string;
};

export type ConsistencyResponse = {
  cacheToken: string;
  results: ConsistencyRecommendation[];
  errors?: ConsistencyError[];
};

export type ConsistencyDecisionAction = 'applied' | 'ignored';

export type ConsistencyDecisionPair = {
  canonicalName: string;
  conceptType: string;
  appliedSurface: string;
};

export type ConsistencyDecisionRequest = {
  eventId: string;
  action: ConsistencyDecisionAction;
  beforeTitle?: string;
  afterTitle?: string;
  pairs?: ConsistencyDecisionPair[];
};

export type ConsistencyDecisionResponse = {
  acknowledged: boolean;
};

export type ConsistencyCacheEntry = {
  sourceTitle: string;
  createdAt: number;
  results: ConsistencyRecommendation[];
};

export type ConsistencyPendingEntry = {
  sourceTitle: string;
  startedAt: number;
};
