import handler from "../../../libs/handler-lib";
import dynamoDb from "../../../libs/dynamodb-lib";

export const main = handler(async (event, context) => {
  // If this invocation is a prewarm, do nothing and return.
  if (event.source === "serverless-plugin-warmup") {
    console.log("Warmed up!");
    return null;
  }

  let data = JSON.parse(event.body);
  console.log("\n\n\n---->about to obtain user: ");
  console.log(data);

  const params = {
    TableName:
      process.env.AUTH_USER_TABLE_NAME ?? process.env.AuthUserTableName,
    Select: "ALL_ATTRIBUTES",
    ExpressionAttributeValues: {
      ":username": data.username,
    },
    FilterExpression: "username = :username",
  };

  const result = await dynamoDb.scan(params);

  console.log("\n\nresult of scan ~~~~>");
  console.log(result);

  if (result.Count === 0) {
    return false;
  }

  console.log("\n\n\n=-========>user obtained: ");
  console.log(result);

  // Return the retrieved item
  return result;
});
