import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    username: v.string(),
    imageUrl: v.string(),
    clerkId: v.string(),
    email: v.string(),
    //phone: v.int64(),
  })
    .index("by_email", ["email"])
    .index("by_clerkId", ["clerkId"]),
});
