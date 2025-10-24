// convex/transactions.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get all transactions for the currently logged-in user
export const get = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to view transactions.");
    }
    // Only return transactions owned by this user
    try{
      return await ctx.db
        .query("transactions")
        .withIndex("by_user", (q) => q.eq("userId", identity.subject))
        .order("desc")
        .collect();
    }
    catch(e){
      console.error("Error fetching transactions:", e);
      return [];
    }
  },
});

// Add a new transaction for the logged-in user
export const add = mutation({
  args: {
    _id: v.optional(v.id("transactions")),
    amount: v.number(),
    dateTime: v.string(),
    method: v.string(),
    receiverId: v.string(),
    receiverName: v.string(),
    senderId: v.string(),
    senderName: v.string(),
    transactionId: v.string(),
    type: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to add a transaction.");
    }
    if (args._id) {
      const { _id, ...updates } = args;

      // Security Check: Verify the user owns the document they are trying to update.
      const existingTransaction = await ctx.db.get(_id);
      if (!existingTransaction || existingTransaction.userId !== identity.subject) {
        throw new Error("You do not have permission to edit this transaction.");
      }
      
      await ctx.db.patch(_id, updates);
      return _id;
    }
    else{
      const transactionId = await ctx.db.insert("transactions", {
        ...args,
        userId: identity.subject,
      });
      return transactionId;
    }
  },
});

// Delete a transaction owned by the logged-in user
export const remove = mutation({
  args: { id: v.id("transactions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to delete a transaction.");
    }

    // Optional: Check for ownership before deleting
    const transaction = await ctx.db.get(args.id);
    if (transaction && transaction.userId !== identity.subject) {
      throw new Error("You do not have permission to delete this transaction.");
    }
    
    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  // Define the arguments: the document ID and an object with the updates
  args: {
    id: v.id("transactions"),
    // All fields are optional, as you might only be updating a few at a time
    updates: v.object({
        amount: v.optional(v.number()),
        dateTime: v.optional(v.string()),
        method: v.optional(v.string()),
        receiverId: v.optional(v.string()),
        receiverName: v.optional(v.string()),
        senderId: v.optional(v.string()),
        senderName: v.optional(v.string()),
        transactionId: v.optional(v.string()),
        type: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // 1. Check for user authentication
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("You must be logged in to edit a transaction.");
    }

    // 2. (Security Check) Get the existing transaction to verify ownership
    const existingTransaction = await ctx.db.get(args.id);

    // 3. Throw an error if the transaction doesn't exist or if the user is not the owner
    if (!existingTransaction || existingTransaction.userId !== identity.subject) {
      throw new Error("You do not have permission to edit this transaction.");
    }

    // 4. If the check passes, apply the updates to the document
    await ctx.db.patch(args.id, args.updates);
  },
});