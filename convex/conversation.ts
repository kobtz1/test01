import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const get = query({
    args: {
        id: v.id("conversations")
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("ไม่ได้รับอนุญาต");
        }

        const currentUser = await getUserByClerkId({
            ctx,
            clerkId: identity.subject,
        });

        if (!currentUser) {
            throw new ConvexError("ไม่พบชื่อผู้ใช้");
        }

        const conversation = await ctx.db.get(args.id);
        console.log("Conversation:", conversation); // เพิ่มการตรวจสอบค่านี้

        if (!conversation) {
            throw new ConvexError("ไม่พบการสนทนา");
        }

        const membership = await ctx.db.query("conversationMembers")
            .withIndex("by_memberId_conversationId", (q) => q
                .eq("memberId", currentUser._id)
                .eq("conversationId", conversation._id)).unique();

        if (!membership) {
            throw new ConvexError("คุณไม่ได้เป็นสมาชิกสำหรับการสนทนานี้");
        }

        const allConversationMemberships = await ctx.db.query("conversationMembers")
            .withIndex("by_conversationId", (q) => q
                .eq("conversationId", args.id)).collect();

        if (!conversation.isGroup) {
            const otherMembership = allConversationMemberships.filter((membership) =>
                membership.memberId !== currentUser._id)[0];
            
            const otherMemberDetails = await ctx.db.get(otherMembership.memberId);

            return {
                ...conversation,
                otherMember: {
                    ...otherMemberDetails,
                    lastSeenMessageId: otherMembership.lastSeenMessage
                },
                otherMembers: null
            };
        } else {
            return {
                ...conversation,
                otherMembers: allConversationMemberships
            };
        }
    },
});
