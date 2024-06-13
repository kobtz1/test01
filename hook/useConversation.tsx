import { useParams } from "next/navigation";
import { useMemo } from "react";

export const useConversation = () => {
  const param = useParams();

  const conversationId = useMemo(
    () => param?.conversationId || ("" as string),
    [param?.conversationId]
  );

  const isActive = useMemo(() => !!conversationId, [conversationId]);

  return {
    isActive,
    conversationId,
  };
};
