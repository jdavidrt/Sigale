import { TicketForm } from "../components/Tickets/TicketForm";
import { useLanguage } from "../context/LanguageContext";

export const SellTicketsPage = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3">🎫 {t("sellTicketsTitle")}</h1>
        <p className="text-lg text-gray-600">
          {t("manageTicketSales")}
        </p>
      </div>

      <TicketForm />
    </div>
  );
};
