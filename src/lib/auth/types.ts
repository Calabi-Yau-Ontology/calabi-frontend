export type AuthUser = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export type AuthSession = {
  access_token: string;
  user?: AuthUser;
};
