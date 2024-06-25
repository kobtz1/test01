import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const create = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    console.log("Identity:", identity);

    if (!identity) {
      throw new ConvexError("ไม่ได้รับอนุญาติ");
    }

    // ตรวจสอบว่ามี email ใน identity หรือไม่
    if (!identity.email) {
      throw new ConvexError("ไม่พบอีเมลในข้อมูลผู้ใช้");
    }

    // ตรวจสอบว่า email ของผู้ใช้และ args.email ไม่ตรงกัน
    if (args.email.toLowerCase() === identity.email.toLowerCase()) {
      throw new ConvexError("ไม่สามารถส่งคำขอถึงตัวเองได้");
    }

    const currenUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currenUser) {
      throw new ConvexError("ไม่พบผู้ใช้");
    }

    console.log("Current user:", currenUser);
    console.log("Searching for email:", args.email.toLowerCase());

    const receiver = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .unique();

    if (!receiver) {
      console.log("Receiver not found for email:", args.email.toLowerCase());
      throw new ConvexError("ไม่พบผู้ใช้ภายในแอพ");
    }

    console.log("Receiver found:", receiver);

    const requestAlreadySent = await ctx.db
      .query("requests")
      .withIndex("by_receiver_sender", (q) =>
        q.eq("receiver", receiver._id).eq("sender", currenUser._id)
      )
      .unique();

    if (requestAlreadySent) {
      throw new ConvexError("ส่งคำขอเรียบร้อย");
    }

    const requestAlreadyReceived = await ctx.db
      .query("requests")
      .withIndex("by_receiver_sender", (q) =>
        q.eq("receiver", currenUser._id).eq("sender", receiver._id)
      )
      .unique();

    if (requestAlreadyReceived) {
      throw new ConvexError("ผู้ใช้รายนี้ได้ส่งคำขอถึงคุณแล้ว");
    }

    const request = await ctx.db.insert("requests", {
      sender: currenUser._id,
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
    console.log("Identity:", identity);

    if (!identity) {
      throw new ConvexError("ไม่ได้รับอนุญาติ");
    }

    // ตรวจสอบว่ามี email ใน identity หรือไม่
    if (!identity.email) {
      throw new ConvexError("ไม่พบอีเมลในข้อมูลผู้ใช้");
    }

    const currenUser = await getUserByClerkId({
      ctx,
      clerkId: identity.subject,
    });

    if (!currenUser) {
      throw new ConvexError("ไม่พบผู้ใช้");
    }
    const request = await ctx.db.get(args.id)

    if (!request || request.receiver !== currenUser._id) {
      throw new ConvexError("พบข้อผิดพลาดในการปฎิเสธคำขอ");
    }
  await ctx.db.delete(request._id);
  },
});
