import AWS from "aws-sdk";
import atomicCounter from "dynamodb-atomic-counter";

const dyanmoConfig = {};

// ugly but OK, here's where we will check the environment
const atomicTableName = process.env.atomicCounterTableName;
const endpoint = process.env.DYNAMODB_URL;
if (endpoint) {
  dyanmoConfig.endpoint = endpoint;
  dyanmoConfig.accessKeyId = "LOCAL_FAKE_KEY";
  dyanmoConfig.secretAccessKey = "LOCAL_FAKE_SECRET";
} else {
  dyanmoConfig["region"] = "us-east-1";
}

const database = new AWS.DynamoDB();

const client = new AWS.DynamoDB.DocumentClient(dyanmoConfig);

atomicCounter.config.update(dyanmoConfig);

export default {
  get: (params) => client.get(params).promise(),
  put: (params) => client.put(params).promise(),
  query: (params) => client.query(params).promise(),
  update: (params) => client.update(params).promise(),
  delete: (params) => client.delete(params).promise(),
  scan: async (params) => {
    const items = [];
    let complete = false;
    while (!complete) {
      const result = await client.scan(params).promise();
      items.push(...result.Items);
      params.ExclusiveStartKey = result.LastEvaluatedKey;
      complete = result.LastEvaluatedKey === undefined;
    }
    return { Items: items, Count: items.length };
  },
  batchWrite: (params) => client.batchWrite(params).promise(),
  listTables: (params) => database.listTables(params).promise(),
  increment: (params) =>
    atomicCounter.increment(params, { tableName: atomicTableName }),
};
