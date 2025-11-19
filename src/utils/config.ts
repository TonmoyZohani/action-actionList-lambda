export const envConfig = {
    aws: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        region: process.env.AWS_REGION || 'us-east-1',
    },
    tableName: process.env.ACTION_TABLE || 'ActionList-o45bls5ybraplm34trrwgkpooy-dev',
};

// Basic validation
if (!envConfig.aws.accessKeyId) {
    throw new Error('AWS_ACCESS_KEY_ID environment variable is required');
}
if (!envConfig.aws.secretAccessKey) {
    throw new Error('AWS_SECRET_ACCESS_KEY environment variable is required');
}
if (!envConfig.tableName) {
    throw new Error('ACTION_TABLE environment variable is required');
}

// Export constants for backward compatibility
export const TABLE_NAME = envConfig.tableName;
export const DEFAULT_LIMIT = 50;
export const MAX_LIMIT = 100;