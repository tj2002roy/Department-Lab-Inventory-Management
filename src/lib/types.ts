export const ActionType = {
  UPDATE: "UPDATE",
  MOVE: "MOVE",
  COMMENT: "COMMENT",
} as const;

export type ActionType = (typeof ActionType)[keyof typeof ActionType];

export const Role = {
  ADMIN: "ADMIN",
  OPERATOR: "OPERATOR",
  AUDITOR: "AUDITOR",
} as const;

export type Role = (typeof Role)[keyof typeof Role];
