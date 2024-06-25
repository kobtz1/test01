
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { MessagesSquare, Users } from "lucide-react";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

export const useNavigation = () => {
  const pathname = usePathname();

  const requestsCount = useQuery(api.requests.count)

  const paths = useMemo(
    () => [
      {
        name: "Conversations",
        href: "/conversations",
        icon: <MessagesSquare />,
        active: pathname.startsWith("/conversations"),
      },
      {
        name: "Friends",
        href: "/friends",
        icon: <Users />,
        active: pathname === "/friends",
        count: requestsCount,
      }
    ],
    [pathname, requestsCount]
  );

  return paths;
};
