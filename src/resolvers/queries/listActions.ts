import { QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { 
  AppSyncEvent, 
  ListActionsResponse, 
  ActionListConnection,
  ListActionsInput,
  ActionList,
  ActionStatus,
  ActionSortField,
  SortDirection
} from '../../types/actions';
import { TABLE_NAME, DEFAULT_LIMIT, MAX_LIMIT } from '../../utils/config';
import { db } from '../../utils/db/db';
import { encodeNextToken, decodeNextToken, buildExpression, applySearchFilter } from '../../utils/helpers';

export async function listActionsHandler(event: AppSyncEvent): Promise<ListActionsResponse> {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    const connection = await listActionsWithFilters(event.arguments.input);
    
    return {
      success: true,
      message: 'Actions retrieved successfully',
      data: connection,
    };
  } catch (error) {
    console.error('Error listing actions:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      message: 'Failed to list actions',
      error: errorMessage,
    };
  }
}

async function listActionsWithFilters(input: ListActionsInput): Promise<ActionListConnection> {
  // Build DynamoDB expression
  const expr = buildExpression(input.filter);

  // Handle limit with schema defaults
  let limit = DEFAULT_LIMIT;
  if (input.pagination?.limit !== undefined) {
    limit = Math.min(Math.max(input.pagination.limit, 1), MAX_LIMIT);
  }

  // Base QueryInput for DocumentClient
  const queryInput: QueryCommandInput = {
    TableName: TABLE_NAME,
    Limit: limit,
    ExpressionAttributeNames: expr.ExpressionAttributeNames,
    ExpressionAttributeValues: expr.ExpressionAttributeValues,
    ScanIndexForward: true, // Default to ASC, will be overridden by sort
  };

  if (expr.KeyConditionExpression) {
    queryInput.KeyConditionExpression = expr.KeyConditionExpression;
  }
  
  if (expr.FilterExpression) {
    queryInput.FilterExpression = expr.FilterExpression;
  }

  // Use GSI if filtering by actionboardID
  if (input.filter?.actionboardID) {
    queryInput.IndexName = 'byActionBoard';
  }

  // Pagination: ExclusiveStartKey
  if (input.pagination?.nextToken) {
    const startKey = decodeNextToken(input.pagination.nextToken);
    if (startKey) {
      queryInput.ExclusiveStartKey = startKey;
    }
  }

  // Sort direction - default to DESC as per schema
  if (input.sort) {
    const direction = input.sort.direction || SortDirection.DESC;
    queryInput.ScanIndexForward = direction === SortDirection.ASC;
  } else {
    // Default sort if none provided (DESC as per schema default)
    queryInput.ScanIndexForward = false;
  }

  console.log('DynamoDB Query Input:', JSON.stringify(queryInput, null, 2));

  // Execute Query using DocumentClient
  const result = await db.query(queryInput);

  // Items are already unmarshalled by DocumentClient
  const items = (result.Items || []) as ActionList[];

  // In-memory full-text search
  let finalItems = items;
  if (input.filter?.searchTerm && input.filter.searchTerm.trim() !== '') {
    finalItems = applySearchFilter(items, input.filter.searchTerm);
  }

  // Encode next page token
  const nextToken = encodeNextToken(result.LastEvaluatedKey || null);

  return {
    items: finalItems,
    nextToken: nextToken || undefined,
    totalCount: finalItems.length,
  };
}