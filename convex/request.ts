import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const create = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new ConvexError("ไม่ได้รับอนุญาติ");
    }
    if (args.email === identity.email) {
      throw new ConvexError("ไม่สามารถส่งคำขอถึงตัวเองได้");
    }
    const currenUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currenUser) {
      throw new ConvexError("ไม่พบผู้ใช้");
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
        q.eq("receiver", receiver._id).eq("sender", currenUser._id)
      );

    if (requestAlreadySent) {
      throw new ConvexError("ส่งคำขอเรียบร้อย");
    }
    const requestAlreadyReceived = await ctx.db
      .query("requests")
      .withIndex("by_receiver_sender", (q) =>
        q.eq("receiver", currenUser._id).eq("sender", receiver._id)
      );
      if (requestAlreadyReceived){
        throw new ConvexError("ผู้ใช้รายนี้ได้ส่งคำขอถึงคุณแล้ว")
      }
      const requests = await ctx.db.insert
      ("requests", {
        sender: currenUser._id,
        receiver: receiver._id,
      })
      return requests;
  },
});
