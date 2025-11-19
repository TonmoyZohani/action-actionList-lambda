import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import { envConfig } from '../config';

const client = new DynamoDBClient({
    region: envConfig.aws.region,
    credentials: {
        accessKeyId: envConfig.aws.accessKeyId,
        secretAccessKey: envConfig.aws.secretAccessKey,
    },
});

export const db = DynamoDBDocument.from(client);