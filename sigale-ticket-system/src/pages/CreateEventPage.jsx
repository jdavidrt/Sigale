import { CreateEvent } from "../components/Event/CreateEvent";

export const CreateEventPage = () => {
  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
          <span>✨</span>
          Create New Event
        </h1>
        <p className="text-gray-600">Set up your event details and ticket types</p>
      </div>
      <CreateEvent />
    </div>
  );
};
