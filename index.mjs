import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

export const handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));

  // Always normalize into an array of order messages:
  let messages = [];

  if (Array.isArray(event.Records)) {
    for (const rec of event.Records) {
      try {
        const envelope = JSON.parse(rec.body);
        // If SNS wrapped inside SQS, unwrap:
        if (typeof envelope.Message === "string") {
          messages.push(JSON.parse(envelope.Message));
        } else {
          messages.push(envelope);
        }
      } catch (err) {
        console.error("Failed to parse record body:", rec.body, err);
        // skip malformed record
      }
    }
  } else {
    // Direct invocation (e.g. TestEvent)
    messages = [event];
  }

  for (const msg of messages) {
    console.log("Parsed order message:", msg);

    const { orderId, userId, itemName, quantity, status, timestamp } = msg;
    if (!orderId || !userId || !itemName || quantity == null || !status || !timestamp) {
      console.error("Missing required fields:", msg);
      continue;  // or throw if you want to retry
    }

    const params = new PutItemCommand({
      TableName: "Orders",
      Item: {
        orderId:   { S: orderId },
        userId:    { S: userId },
        itemName:  { S: itemName },
        quantity:  { N: quantity.toString() },
        status:    { S: status },
        timestamp: { S: timestamp },
        createdAt: { S: new Date().toISOString() },
      },
    });

    try {
      await client.send(params);
      console.log(`Order ${orderId} saved successfully`);
    } catch (ddbErr) {
      console.error("DynamoDB error for order", orderId, ddbErr);
      // optionally re-throw to send to DLQ
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Processed all messages", count: messages.length }),
  };
};
