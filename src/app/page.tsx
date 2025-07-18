import { ChatInterface } from "@/components/chat/ChatInterface";
import { PrivateRoute } from "@/components/PrivateRoute";

export default function Home() {
  return (
    <PrivateRoute>
      <ChatInterface />
    </PrivateRoute>
  );
}
