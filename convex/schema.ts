// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  transactions: defineTable({
    amount: v.number(),
    dateTime: v.string(),
    method: v.string(),
    receiverId: v.string(),
    receiverName: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    transactionId: v.string(),
    type: v.string(),
    userId: v.string(), // Link to the Clerk user
  }).index("by_user", ["userId"]), // Add an index for fast lookups by user
});


