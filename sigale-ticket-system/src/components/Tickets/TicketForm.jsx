import { useState } from "react";
import { useTickets } from "../../context/TicketContext";
import { useEvent } from "../../context/EventContext";
import { QRDisplay } from "./QRDisplay";

export const TicketForm = () => {
  const { addTicket } = useTickets();
  const { event } = useEvent();

  const [formData, setFormData] = useState({
    buyerName: "",
    buyerId: "",
    buyerPhone: "",
    ticketType: "",
  });

  const [createdTicket, setCreatedTicket] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const ticket = await addTicket(formData);
      setCreatedTicket(ticket);
      setFormData({ buyerName: "", buyerId: "", buyerPhone: "", ticketType: "" });
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewTicket = () => {
    setCreatedTicket(null);
  };

  if (createdTicket) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Ticket Created!</h3>
            <p className="text-gray-600">
              Ticket for <strong>{createdTicket.buyerName}</strong>
            </p>
          </div>

          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ticket Type</p>
                <p className="font-semibold text-gray-900">{createdTicket.ticketType}</p>
              </div>
              <div>
                <p className="text-gray-500">Price</p>
                <p className="font-semibold text-gray-900">
                  ${event.ticketTypes[createdTicket.ticketType]?.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-500">ID Number</p>
                <p className="font-semibold text-gray-900">{createdTicket.buyerId}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-semibold text-gray-900">{createdTicket.buyerPhone}</p>
              </div>
            </div>
          </div>

          <QRDisplay ticket={createdTicket} event={event} />

          <button
            onClick={handleNewTicket}
            className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            ➕ Create Another Ticket
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🎫 New Ticket Sale</h2>
          <p className="text-gray-600">Fill in the buyer information to generate a ticket</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Buyer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.buyerName}
              onChange={(e) => setFormData({ ...formData, buyerName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              ID Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.buyerId}
              onChange={(e) => setFormData({ ...formData, buyerId: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="Enter ID number"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.buyerPhone}
              onChange={(e) => setFormData({ ...formData, buyerPhone: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="+57 300 1234567"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium text-gray-700">
              Ticket Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.ticketType}
              onChange={(e) => setFormData({ ...formData, ticketType: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
            >
              <option value="">Select a ticket type</option>
              {Object.entries(event.ticketTypes).map(([type, price]) => (
                <option key={type} value={type}>
                  {type} - ${price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating Ticket..." : "🎫 Create Ticket"}
          </button>
        </form>
      </div>
    </div>
  );
};
