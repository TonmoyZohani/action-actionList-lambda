export enum ActionStatus {
  New = 'New',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled'
}

export enum ActionSortField {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  action = 'action',
  actionListStatus = 'actionListStatus'
}

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

export interface ActionFilterInput {
  searchTerm?: string;
  actionboardID?: string;
  actionListStatus?: ActionStatus;
  isImportant?: boolean;
  isUrgent?: boolean;
  tags?: string[];
  createdAfter?: string; // AWSDateTime is string in TypeScript
  createdBefore?: string;
}

export interface ActionSortInput {
  field: ActionSortField;
  direction?: SortDirection; // Defaults to DESC in schema
}

export interface PaginationInput {
  limit?: number;
  nextToken?: string;
}

export interface ListActionsInput {
  filter?: ActionFilterInput;
  sort?: ActionSortInput;
  pagination?: PaginationInput;
}

export interface AppSyncEvent {
  arguments: {
    input: ListActionsInput;
  };
  info?: {
    fieldName: string;
  };
}

export interface ActionList {
  id: string;
  action: string;
  actionboardID: string;
  actionListStatus: ActionStatus;
  context?: string | null;
  createdAt: string;
  updatedAt: string;
  delegate?: boolean | null;
  ignore?: boolean | null;
  isImportant?: boolean | null;
  isUrgent?: boolean | null;
  tags?: string[] | null;
  __typename?: string;
}

export interface ActionListConnection {
  items: ActionList[];
  nextToken?: string | null;
  totalCount: number;
}

export interface ListActionsResponse {
  success: boolean;
  message: string;
  data?: ActionListConnection;
  error?: string;
}