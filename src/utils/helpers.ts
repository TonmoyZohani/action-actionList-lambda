import { ActionList, ActionFilterInput, ActionStatus } from '../types/actions';

// Pagination helpers
export function encodeNextToken(key: Record<string, any> | null): string | null {
  if (!key || Object.keys(key).length === 0) {
    return null;
  }
  
  const jsonString = JSON.stringify(key);
  return Buffer.from(jsonString).toString('base64');
}

export function decodeNextToken(token: string | null | undefined): Record<string, any> | null {
  if (!token) {
    return null;
  }
  
  try {
    const jsonString = Buffer.from(token, 'base64').toString();
    return JSON.parse(jsonString) as Record<string, any>;
  } catch (error) {
    throw new Error(`Invalid nextToken format: ${error}`);
  }
}

// Search filter
export function applySearchFilter(items: ActionList[], term: string): ActionList[] {
  const search = term.toLowerCase().trim();
  
  return items.filter(item => 
    item.action.toLowerCase().includes(search) ||
    (item.context && item.context.toLowerCase().includes(search)) ||
    tagsContain(item.tags || [], search)
  );
}

function tagsContain(tags: string[], search: string): boolean {
  return tags.some(tag => tag.toLowerCase().includes(search));
}

// Expression builder for DocumentClient
export function buildExpression(filter?: ActionFilterInput) {
  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, any> = {};
  const conditions: string[] = [];
  const keyConditions: string[] = [];

  // Key Condition - only used when querying by actionboardID (GSI)
  if (filter?.actionboardID) {
    keyConditions.push('#actionboardID = :actionboardID');
    expressionAttributeNames['#actionboardID'] = 'actionboardID';
    expressionAttributeValues[':actionboardID'] = filter.actionboardID;
  }

  // Filter conditions
  if (filter?.actionListStatus) {
    conditions.push('#actionListStatus = :actionListStatus');
    expressionAttributeNames['#actionListStatus'] = 'actionListStatus';
    expressionAttributeValues[':actionListStatus'] = filter.actionListStatus;
  }

  if (filter?.isImportant !== undefined) {
    conditions.push('#isImportant = :isImportant');
    expressionAttributeNames['#isImportant'] = 'isImportant';
    expressionAttributeValues[':isImportant'] = filter.isImportant;
  }

  if (filter?.isUrgent !== undefined) {
    conditions.push('#isUrgent = :isUrgent');
    expressionAttributeNames['#isUrgent'] = 'isUrgent';
    expressionAttributeValues[':isUrgent'] = filter.isUrgent;
  }

  if (filter?.createdAfter) {
    conditions.push('#createdAt > :createdAfter');
    expressionAttributeNames['#createdAt'] = 'createdAt';
    expressionAttributeValues[':createdAfter'] = filter.createdAfter;
  }

  if (filter?.createdBefore) {
    conditions.push('#createdAt < :createdBefore');
    expressionAttributeNames['#createdAt'] = 'createdAt';
    expressionAttributeValues[':createdBefore'] = filter.createdBefore;
  }

  // Tags: OR condition across all provided tags
  if (filter?.tags && filter.tags.length > 0) {
    const tagConditions: string[] = [];
    filter.tags.forEach((tag, index) => {
      tagConditions.push(`contains(#tags, :tag${index})`);
      expressionAttributeValues[`:tag${index}`] = tag;
    });
    
    if (tagConditions.length > 0) {
      expressionAttributeNames['#tags'] = 'tags';
      conditions.push(`(${tagConditions.join(' OR ')})`);
    }
  }

  return {
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    KeyConditionExpression: keyConditions.length > 0 ? keyConditions.join(' AND ') : undefined,
    FilterExpression: conditions.length > 0 ? conditions.join(' AND ') : undefined,
  };
}