import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const create = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("🚀 ~ handler: ~ identity:", identity);

    if (!identity) {
      throw new ConvexError("ไม่ได้รับอนุญาต");
    }

    if (args.email === identity.email) {
      throw new ConvexError("ไม่สามารถส่งคำขอถึงตัวคุณเองได้");
    }

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("ไม่พบชื่อผู้ใช้");
    }

    const receiver = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!receiver) {
      throw new ConvexError("ไม่พบผู้ใช้");
    }

    const requestAlreadySent = await ctx.db
      .query("requests")
      .withIndex("by_receiver_sender", (q) =>
        q.eq("receiver", receiver._id).eq("sender", currentUser._id)
      )
      .unique();

    if (requestAlreadySent) {
      throw new ConvexError("ส่งคำขอไปแล้ว");
    }

    const requestAlreadyReceived = await ctx.db
      .query("requests")
      .withIndex("by_receiver_sender", (q) =>
        q.eq("receiver", currentUser._id).eq("sender", receiver._id)
      )
      .unique();

    if (requestAlreadyReceived) {
      throw new ConvexError("ผู้ใช้รายนี้ได้ส่งคำขอถึงคุณแล้ว");
    }

    const friends1 = await ctx.db
      .query("friends")
      .withIndex("by_user1", (q) => q.eq("user1", currentUser._id))
      .collect();

    const friends2 = await ctx.db
      .query("friends")
      .withIndex("by_user2", (q) => q.eq("user2", currentUser._id))
      .collect();

    if (
      friends1.some((friend) => friend.user2 === receiver._id) ||
      friends2.some((friend) => friend.user1 === receiver._id)
    ) {
      throw new ConvexError("คุณเป็นเพื่อนกับผู้ใช้รายนี้แล้ว");
    }

    const request = await ctx.db.insert("requests", {
      sender: currentUser._id,
      receiver: receiver._id,
    });

    return request;
  },
});

export const deny = mutation({
  args: {
    id: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("🚀 ~ handler: ~ identity:", identity);

    if (!identity) {
      throw new ConvexError("ไม่ได้รับอนุญาต");
    }

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("ไม่พบชื่อผู้ใช้");
    }

    const request = await ctx.db.get(args.id);

    if (!request || request.receiver !== currentUser._id) {
      throw new ConvexError("มีข้อผิดพลาดในการปฏิเสธคำขอนี้");
    }

    await ctx.db.delete(request._id);
  },
});

export const accept = mutation({
  args: {
    id: v.id("requests"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("🚀 ~ handler: ~ identity:", identity);

    if (!identity) {
      throw new ConvexError("ไม่ได้รับอนุญาต");
    }

    const currentUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currentUser) {
      throw new ConvexError("ไม่พบชื่อผู้ใช้");
    }

    const request = await ctx.db.get(args.id);

    if (!request || request.receiver !== currentUser._id) {
      throw new ConvexError("มีข้อผิดพลาดในการยอมรับคำขอนี้");
    }

    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
    });
    await ctx.db.insert("friends", {
      user1: currentUser._id,
      user2: request.sender,
      conversationId,
    });

    await ctx.db.insert("conversationMembers", {
      memberId: currentUser._id,
      conversationId,
    });
    await ctx.db.insert("conversationMembers", {
      memberId: request.sender,
      conversationId,
    });

    await ctx.db.delete(request._id);
  },
});
