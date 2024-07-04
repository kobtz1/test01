"use client";

import ConversationContainer from "@/components/ui/shared/conversation/ConversationContainer";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import React from "react";
import ChatInput from "./_components/input/ChatInput";
import Body from "./_components/body/Body";

type Props = {
  params: {
    conversationId: Id<"conversations">;
  };
};

const ConversationPage = ({ params: { conversationId } }: Props) => {
  const conversation = useQuery(api.conversation.get, {
    id: conversationId,
  });

  return (
    <ConversationContainer>
      <Body />
      <ChatInput />
    </ConversationContainer>
  );
};

export default ConversationPage;
