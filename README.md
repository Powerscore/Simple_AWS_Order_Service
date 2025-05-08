# Event-Driven Order Notification System – AWS Assignment

## Overview

This project implements an event-driven backend system for a simplified e-commerce platform using AWS services. It supports accepting customer orders, storing them in a DynamoDB table, broadcasting notifications via SNS, queuing events with SQS, and processing messages using AWS Lambda.

---

## Architecture Diagram
![image](https://github.com/user-attachments/assets/bd652b13-efb9-44eb-9e6b-0b1ad79d7883)

---

## Components Used

| Service      | Role                                                                 |
|--------------|----------------------------------------------------------------------|
| **DynamoDB** | Stores order records in a table named `Orders`                      |
| **SNS**      | Topic `OrderTopic` publishes new order events                       |
| **SQS**      | Queue `OrderQueue` receives SNS messages                            |
| **Lambda**   | Processes messages from SQS and inserts into DynamoDB               |
| **DLQ**      | Captures failed messages from `OrderQueue` after 3 failed attempts  |

---

## Setup Instructions

### 1. DynamoDB Table – `Orders`
- **Partition key**: `orderId` (String)
- **Other attributes**: `userId`, `itemName`, `quantity`, `status`, `timestamp`

### 2. SNS – `OrderTopic`
- Create an SNS Topic named `OrderTopic`.

### 3. SQS – `OrderQueue` and `OrderDLQ`
- Create a **Standard SQS Queue** named `OrderQueue`.
- Create a **Dead Letter Queue (DLQ)** named `OrderDLQ`.
- Attach DLQ to `OrderQueue` with `maxReceiveCount = 3`.

### 4. Subscribe Queue to SNS Topic
- Subscribe `OrderQueue` to `OrderTopic`.
- Ensure `OrderQueue` policy allows SNS to send messages:
```json
{
  "Sid": "Allow-SNS-SendMessage",
  "Effect": "Allow",
  "Principal": { "AWS": "*" },
  "Action": "SQS:SendMessage",
  "Resource": "arn:aws:sqs:REGION:ACCOUNT_ID:OrderQueue",
  "Condition": {
    "ArnEquals": {
      "aws:SourceArn": "arn:aws:sns:REGION:ACCOUNT_ID:OrderTopic"
    }
  }
}
