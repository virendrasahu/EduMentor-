import { Whiteboard } from "@/components/whiteboard/Whiteboard";
import { PrivateRoute } from "@/components/PrivateRoute";

export default function WhiteboardPage() {
  return (
    <PrivateRoute>
      <div className="container mx-auto py-6">
        <Whiteboard />
      </div>
    </PrivateRoute>
  );
}
