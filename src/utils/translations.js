// translations.js - All app translations in Spanish and English

export const translations = {
  es: {
    // Navbar
    home: "Inicio",
    validate: "Validar",
    dashboard: "Panel",

    // Common
    cancel: "Cancelar",
    delete: "Eliminar",
    loading: "Cargando",
    error: "Error",
    success: "Éxito",
    optional: "Opcional",

    // Event Creation
    createNewEvent: "Crear Nuevo Evento",
    setupEventDetails: "Configure los detalles de su evento y tipos de boletas",
    sellTicketsTitle: "Vender Boletas",
    manageTicketSales: "Crear y administrar ventas de boletas para su evento",
    editEventTitle: "Editar Evento",
    eventDetails: "Detalles del Evento",
    eventName: "Nombre del Evento",
    date: "Fecha",
    venueName: "Nombre del Lugar",
    fullAddress: "Dirección Completa",
    entranceTime: "Hora de Entrada",
    ticketTypes: "Tipos de Boletas",
    price: "Precio",
    removeType: "Eliminar",
    // 2.0 — extended event form
    additionalDetails: "Detalles Adicionales",
    description: "Descripción",
    descriptionPlaceholder: "Una noche de astromelias y buena música…",
    artists: "Artistas / Line-up",
    artistsPlaceholder: "Artista 1, Artista 2, Artista 3",
    venueCapacity: "Aforo (capacidad)",
    venueCapacityPlaceholder: "200",
    whatsappNumber: "WhatsApp de contacto",
    whatsappPlaceholder: "573001234567",
    flyerImageUrl: "URL del flyer",
    bankQrImageUrl: "URL del QR bancario",
    stages: "Etapas de Boletas",
    stageName: "Nombre de la etapa",
    quantity: "Cupo",
    activatesAt: "Se activa el (opcional)",
    addStage: "Agregar Etapa",
    capacityUsed: "Cupos asignados",
    overCapacity: "La suma de cupos supera el aforo del lugar",
    setCapacityFirst: "Ingresa el aforo del lugar para validar los cupos",
    createEvent: "Crear Evento",
    updateEvent: "Actualizar Evento",

    // Ticket Form
    pasteNameAndId: "Pegar Nombre y Cédula",
    buyerName: "Nombre",
    idNumber: "ID",
    phoneNumber: "Número de Teléfono",
    ticketType: "Tipo de Boleta",
    selectTicketType: "Seleccione un tipo de boleta",
    createTicket: "Crear Boleta",

    // Ticket Display
    ticketCreated: "¡Boleta Creada!",
    ticketFor: "Boleta para",
    purchaseDate: "Fecha de Compra",
    share: "Compartir",
    createAnother: "Crear Otra Boleta",
    copiedToClipboard: "Copiado al portapapeles",

    // QR Scanner

    // Validation Results

    // Ticket List
    allTickets: "Todas las Boletas",
    searchTickets: "Buscar boletas por nombre, ID o teléfono",
    noTickets: "No hay boletas",
    noTicketsDesc: "Aún no se han creado boletas",
    checkedIn: "Registrado",
    clearAllTickets: "Eliminar Todas las Boletas",
    filterAll: "Todas",

    // Home Page
    noEvent: "No hay eventos configurados",
    noEventDesc: "Cree un evento para comenzar a vender boletas",
    editEvent: "Editar Evento",

    // Dashboard (placeholder for Stage 3)
    salesDashboard: "Panel de Ventas",
    checkInDashboard: "Panel de Registro",
    totalSold: "Total Vendidas",
    totalRevenue: "Ingresos Totales",
    attendanceRate: "Tasa de Asistencia",
    salesByType: "Ventas por Tipo de Boleta",
    sold: "vendidas",
    recentCheckIns: "Registros Recientes",
    attendees: "Asistentes",
    ofTickets: "de",
    remaining: "Restantes",
    storage: "Almacenamiento",
    showing: "Mostrando",

    // Placeholders
    eventNamePlaceholder: "Festival de Rock de Verano 2025",
    venuePlaceholder: "Estadio Nacional",
    addressPlaceholder: "Calle 123, Ciudad, Estado, Código Postal",
    enterFullName: "Ingrese nombre completo",

    // Alerts
    atLeastOneTicketType: "Por favor agregue al menos un tipo de boleta",
    mustHaveOneTicketType: "Debe tener al menos un tipo de boleta",

    // Delete Event
    dangerZone: "Zona de Peligro",
    deleteEvent: "Eliminar Evento",
    deleteEventWarning: "Esta acción es IRREVERSIBLE. Se eliminarán permanentemente todos los datos del evento y todas las boletas vendidas.",
    slideToDelete: "Desliza para eliminar",
    confirmDeleteMessage: "Estás a punto de eliminar el evento y todas sus boletas. Esta acción NO se puede deshacer.",
    eventDeleted: "Evento eliminado exitosamente",

    // CSV Import/Export
    csvExport: "Exportar CSV",
    csvImport: "Importar CSV",
    csvImportNewTickets: "Importar Nuevas Boletas",
    csvCopied: "CSV copiado al portapapeles",
    csvPasteHere: "Pegar CSV aquí...",
    csvImportButton: "Importar",
    csvImportSuccess: "Importación exitosa",
    csvTicketsAdded: "boletas agregadas",
    csvImportErrors: "Errores de importación",

    // Editable ticket table
    viewCards: "Tarjetas",
    viewTable: "Tabla",
    pasteTickets: "Pegar Boletas",
    pasteTicketsHint: "Pegue nombres + cédulas desde Excel o un mensaje. Cada fila se convertirá en una boleta nueva.",
    defaultTypeForPasted: "Tipo por defecto",
    pasteResultAdded: "{n} boletas agregadas",
    pasteResultSkipped: "{n} duplicadas omitidas",
    pasteResultIgnored: "{n} filas ignoradas (sin nombre o cédula)",
    pasteFailed: "No se pudo leer el portapapeles",
    pasteEmpty: "El portapapeles está vacío o no contiene boletas reconocibles",
    tableEmpty: "Aún no hay boletas. Use \"Pegar Boletas\" o el formulario de venta para agregar la primera.",
    selectTypeFirst: "Seleccione un tipo de boleta antes de pegar",
    colName: "Nombre",
    colId: "Cédula",
    colPhone: "Teléfono",
    colDelivery: "Envío",
    colType: "Tipo",
    colStatus: "Estado",
    colActions: "Acciones",
    statusCheckedIn: "Registrado",
    statusPending: "Pendiente",

    // Dialogs / table edit confirm
    confirm: "Confirmar",
    yes: "Sí",
    no: "No",
    rowEditStart: "Editar fila",
    rowEditCommit: "Confirmar cambios",
    rowEditCancel: "Cancelar edición",
    editConfirmTitle: "Confirmar cambios de la boleta",
    editConfirmBody: "Revise los cambios antes de guardar.",
    editNoChanges: "No hay cambios que guardar",
    editConfirmFor: "Boleta de {buyer}",
    saveChanges: "Guardar cambios",
    ticketUpdatedToast: "Boleta actualizada",
    ticketDeletedToast: "Boleta eliminada",
    deleteTicketTitle: "¿Eliminar boleta?",
    deleteTicketBody: "Eliminar la boleta de {buyer} ({id}). Esta acción no se puede deshacer.",
    deleteAllTitle: "¿Eliminar todas las boletas?",
    deleteAllBody: "Esto eliminará {count} boleta(s) y no se puede deshacer. Escriba \"BORRAR\" para confirmar.",
    deleteAllConfirmWord: "BORRAR",
    deleteAllInputPlaceholder: "Escriba BORRAR",
    deleteAllSuccess: "Todas las boletas fueron eliminadas",
    failedToCreateToast: "No se pudo crear la boleta",
    ticketUpdatedFromForm: "Boleta actualizada exitosamente",

    // H5 — check-in window warnings (soft, confirm-to-proceed)

    allTicketTypesMustHavePrice: "Todos los tipos de boleta deben tener un precio válido (0 o positivo).",
    type: "Tipo",
    newType: "Nuevo Tipo...",

    // N2 — Ticket Form success state + update mode
    updateTicket: "Actualizar Boleta",
    readyToGo: "¡Lista!",
    ticketGenerated: "La boleta ha sido generada.",
    detailType: "TIPO",
    detailPrice: "PRECIO",
    detailId: "ID",
    detailPhone: "TEL",

    // N3 — Ticket Card toasts
    copyFailed: "Error al copiar",
    shareNotSupported: "Compartir no disponible",

    // Scanner flow — QRScanner.jsx status messages

    // Scanner flow — ValidationResult.jsx labels

    // TicketForm — inline validation errors + order number label
    nameInvalid: "Nombre no válido. Solo letras y espacios.",
    idInvalid: "Documento no válido. Solo números.",
    stageInvalid: "Selecciona una etapa válida.",
    orderNumber: "Orden",

    // AdminPage — Login screen
    organizerPanel: "Panel del organizador",
    loginSubtitle: "Ingresa para gestionar el evento",
    username: "Usuario",
    password: "Contraseña",
    loggingIn: "Ingresando…",
    logIn: "Ingresar",
    invalidCredentials: "Credenciales inválidas",

    // AdminPage — post-login panel
    loadingEvent: "Cargando evento…",
    noAddressRegistered: "Sin dirección registrada",
    ticketsSold: "Vendidas",
    collected: "Recaudado",
    doorRegistration: "Registro directo · Taquilla",
    registerSale: "Registrar Venta",
    guestPassesCardLabel: "Artistas, crew y cortesías",
    addArtistBtn: "Agregar un artista",
    guestPassesTitle: "Accesos de cortesía",
    guestPassBand: "Banda",
    guestPassHolderName: "Nombre",
    guestPassHolderId: "Número de identificación",
    guestPassType: "Tipo",
    guestPassTypeArtist: "Artista",
    guestPassTypeCrew: "Crew",
    guestPassTypeCourtesy: "Invitadx",
    guestPassAdded: "Acceso registrado",
    guestPassUpdatedToast: "Acceso actualizado",
    editGuestPassTitle: "Editar acceso",
    searchGuestPasses: "Buscar por nombre, documento o banda",
    pasteGuestPasses: "Pegar lista",
    pasteGuestPassesHint: "Copia nombres e identificaciones desde una hoja de cálculo y pégalos aquí.",
    selectBandFirst: "Selecciona una banda primero",
    noGuestPasses: "Sin accesos registrados",
    deleteGuestPassTitle: "Eliminar acceso",
    deleteGuestPassBody: "¿Eliminar el acceso de {name}? Esta acción no se puede deshacer.",
    guestPassDeletedToast: "Acceso eliminado",
    guestPassNameInvalid: "Nombre inválido",
    searchOrder: "Buscar orden",
    noOrdersForFilter: "No hay órdenes para este filtro.",
    filterWaiting: "Esperando",
    filterConfirmed: "Confirmadas",
    filterRejected: "Rechazadas",
    paymentsToReview: "{n} pago(s) por revisar",
    confirmPayment: "Confirmar pago",
    ticketsIssued: "Boletas emitidas",
    noActionsAvailable: "Sin acciones disponibles",
    confirmPurchaseTitle: "¿Confirmar pago?",
    confirmPurchaseMsg: "Se confirma el pago y se emitirán las boletas.",
    rejectPurchaseTitle: "¿Eliminar esta orden?",
    rejectPurchaseMsg: "Esta acción no se puede deshacer.",
    rejectPurchaseBtn: "Eliminar orden",

    // ScanPage — door scanner
    doorTitle: "Puerta",
    online: "En línea",
    offline: "Sin conexión",
  },

  en: {
    // Navbar
    home: "Home",
    validate: "Validate",
    dashboard: "Dashboard",

    // Common
    cancel: "Cancel",
    delete: "Delete",
    loading: "Loading",
    error: "Error",
    success: "Success",
    optional: "Optional",

    // Event Creation
    createNewEvent: "Create New Event",
    setupEventDetails: "Set up your event details and ticket types",
    sellTicketsTitle: "Sell Tickets",
    manageTicketSales: "Create and manage ticket sales for your event",
    editEventTitle: "Edit Event",
    eventDetails: "Event Details",
    eventName: "Event Name",
    date: "Date",
    venueName: "Venue Name",
    fullAddress: "Full Address",
    entranceTime: "Entrance Time",
    ticketTypes: "Ticket Types",
    price: "Price",
    removeType: "Remove",
    // 2.0 — extended event form
    additionalDetails: "Additional Details",
    description: "Description",
    descriptionPlaceholder: "A night of astromelias and good music…",
    artists: "Artists / Line-up",
    artistsPlaceholder: "Artist 1, Artist 2, Artist 3",
    venueCapacity: "Capacity (aforo)",
    venueCapacityPlaceholder: "200",
    whatsappNumber: "Contact WhatsApp",
    whatsappPlaceholder: "573001234567",
    flyerImageUrl: "Flyer image URL",
    bankQrImageUrl: "Bank QR image URL",
    stages: "Ticket Stages",
    stageName: "Stage name",
    quantity: "Quota",
    activatesAt: "Activates on (optional)",
    addStage: "Add Stage",
    capacityUsed: "Quota assigned",
    overCapacity: "The sum of quotas exceeds the venue capacity",
    setCapacityFirst: "Enter the venue capacity to validate quotas",
    createEvent: "Create Event",
    updateEvent: "Update Event",

    // Ticket Form
    pasteNameAndId: "Paste Name & ID",
    buyerName: "Buyer Name",
    idNumber: "ID Number",
    phoneNumber: "Phone Number",
    ticketType: "Ticket Type",
    selectTicketType: "Select a ticket type",
    createTicket: "Create Ticket",

    // Ticket Display
    ticketCreated: "Ticket Created!",
    ticketFor: "Ticket for",
    purchaseDate: "Purchase Date",
    share: "Share",
    createAnother: "Create Another Ticket",
    copiedToClipboard: "Copied to clipboard",

    // QR Scanner

    // Validation Results

    // Ticket List
    allTickets: "All Tickets",
    searchTickets: "Search tickets by name, ID, or phone",
    noTickets: "No tickets",
    noTicketsDesc: "No tickets have been created yet",
    checkedIn: "Checked In",
    clearAllTickets: "Delete All Tickets",
    filterAll: "All",

    // Home Page
    noEvent: "No event configured",
    noEventDesc: "Create an event to start selling tickets",
    editEvent: "Edit Event",

    // Dashboard (placeholder for Stage 3)
    salesDashboard: "Sales Dashboard",
    checkInDashboard: "Check-In Dashboard",
    totalSold: "Total Sold",
    totalRevenue: "Total Revenue",
    attendanceRate: "Attendance Rate",
    salesByType: "Sales by Ticket Type",
    sold: "sold",
    recentCheckIns: "Recent Check-Ins",
    attendees: "Attendees",
    ofTickets: "of",
    remaining: "Remaining",
    storage: "Storage",
    showing: "Showing",

    // Placeholders
    eventNamePlaceholder: "Summer Rock Festival 2025",
    venuePlaceholder: "National Stadium",
    addressPlaceholder: "123 Main Street, City, State, ZIP",
    enterFullName: "Enter full name",

    // Alerts
    atLeastOneTicketType: "Please add at least one ticket type",
    mustHaveOneTicketType: "You must have at least one ticket type",

    // Delete Event
    dangerZone: "Danger Zone",
    deleteEvent: "Delete Event",
    deleteEventWarning: "This action is IRREVERSIBLE. All event data and sold tickets will be permanently deleted.",
    slideToDelete: "Slide to delete",
    confirmDeleteMessage: "You are about to delete the event and all its tickets. This action CANNOT be undone.",
    eventDeleted: "Event deleted successfully",

    // CSV Import/Export
    csvExport: "Export CSV",
    csvImport: "Import CSV",
    csvImportNewTickets: "Import New Tickets",
    csvCopied: "CSV copied to clipboard",
    csvPasteHere: "Paste CSV here...",
    csvImportButton: "Import",
    csvImportSuccess: "Import successful",
    csvTicketsAdded: "tickets added",
    csvImportErrors: "Import errors",

    // Editable ticket table
    viewCards: "Cards",
    viewTable: "Table",
    pasteTickets: "Paste Tickets",
    pasteTicketsHint: "Paste names + IDs from Excel or a message. Each row becomes a new ticket.",
    defaultTypeForPasted: "Default type",
    pasteResultAdded: "{n} tickets added",
    pasteResultSkipped: "{n} duplicates skipped",
    pasteResultIgnored: "{n} rows ignored (no name or ID)",
    pasteFailed: "Could not read clipboard",
    pasteEmpty: "Clipboard is empty or has no recognizable tickets",
    tableEmpty: "No tickets yet. Use \"Paste Tickets\" or the sell form to add the first one.",
    selectTypeFirst: "Pick a ticket type before pasting",
    colName: "Name",
    colId: "ID",
    colPhone: "Phone",
    colDelivery: "Delivery",
    colType: "Type",
    colStatus: "Status",
    colActions: "Actions",
    statusCheckedIn: "Checked in",
    statusPending: "Pending",

    // Dialogs / table edit confirm
    confirm: "Confirm",
    yes: "Yes",
    no: "No",
    rowEditStart: "Edit row",
    rowEditCommit: "Confirm changes",
    rowEditCancel: "Cancel edit",
    editConfirmTitle: "Confirm ticket changes",
    editConfirmBody: "Review the changes below before saving.",
    editNoChanges: "No changes to save",
    editConfirmFor: "Ticket for {buyer}",
    saveChanges: "Save changes",
    ticketUpdatedToast: "Ticket updated",
    ticketDeletedToast: "Ticket deleted",
    deleteTicketTitle: "Delete ticket?",
    deleteTicketBody: "Delete the ticket for {buyer} ({id}). This cannot be undone.",
    deleteAllTitle: "Delete all tickets?",
    deleteAllBody: "This will delete {count} ticket(s) and cannot be undone. Type \"DELETE\" to confirm.",
    deleteAllConfirmWord: "DELETE",
    deleteAllInputPlaceholder: "Type DELETE",
    deleteAllSuccess: "All tickets deleted",
    failedToCreateToast: "Could not create ticket",
    ticketUpdatedFromForm: "Ticket updated successfully",

    // H5 — check-in window warnings (soft, confirm-to-proceed)

    allTicketTypesMustHavePrice: "All ticket types must have a valid price (0 or positive).",
    type: "Type",
    newType: "New Type...",

    // N2 — Ticket Form success state + update mode
    updateTicket: "Update Ticket",
    readyToGo: "Ready to Go!",
    ticketGenerated: "Ticket has been generated.",
    detailType: "TYPE",
    detailPrice: "PRICE",
    detailId: "ID",
    detailPhone: "PHONE",

    // N3 — Ticket Card toasts
    copyFailed: "Failed to copy",
    shareNotSupported: "Share not supported",

    // Scanner flow — QRScanner.jsx status messages

    // Scanner flow — ValidationResult.jsx labels

    // TicketForm — inline validation errors + order number label
    nameInvalid: "Invalid name. Letters and spaces only.",
    idInvalid: "Invalid ID. Numbers only.",
    stageInvalid: "Select a valid stage.",
    orderNumber: "Order",

    // AdminPage — Login screen
    organizerPanel: "Organizer Panel",
    loginSubtitle: "Log in to manage the event",
    username: "Username",
    password: "Password",
    loggingIn: "Logging in…",
    logIn: "Log in",
    invalidCredentials: "Invalid credentials",

    // AdminPage — post-login panel
    loadingEvent: "Loading event…",
    noAddressRegistered: "No address on file",
    ticketsSold: "Sold",
    collected: "Collected",
    doorRegistration: "Direct register · Door",
    registerSale: "Register Sale",
    guestPassesCardLabel: "Artists, crew & courtesy",
    addArtistBtn: "+ Add an artist",
    guestPassesTitle: "Guest passes",
    guestPassBand: "Band",
    guestPassHolderName: "Name",
    guestPassHolderId: "ID number",
    guestPassType: "Type",
    guestPassTypeArtist: "Artist",
    guestPassTypeCrew: "Crew",
    guestPassTypeCourtesy: "Guest",
    guestPassAdded: "Pass added",
    guestPassUpdatedToast: "Pass updated",
    editGuestPassTitle: "Edit pass",
    searchGuestPasses: "Search by name, ID number, or band",
    pasteGuestPasses: "Paste list",
    pasteGuestPassesHint: "Copy names and IDs from a spreadsheet and paste them here.",
    selectBandFirst: "Select a band first",
    noGuestPasses: "No guest passes yet",
    deleteGuestPassTitle: "Delete pass",
    deleteGuestPassBody: "Delete {name}'s pass? This can't be undone.",
    guestPassDeletedToast: "Pass deleted",
    guestPassNameInvalid: "Invalid name",
    searchOrder: "Search order",
    noOrdersForFilter: "No orders for this filter.",
    filterWaiting: "Waiting",
    filterConfirmed: "Confirmed",
    filterRejected: "Rejected",
    paymentsToReview: "{n} payment(s) to review",
    confirmPayment: "Confirm payment",
    ticketsIssued: "Tickets issued",
    noActionsAvailable: "No actions available",
    confirmPurchaseTitle: "Confirm payment?",
    confirmPurchaseMsg: "The payment will be confirmed and tickets will be issued.",
    rejectPurchaseTitle: "Delete this order?",
    rejectPurchaseMsg: "This action cannot be undone.",
    rejectPurchaseBtn: "Delete order",

    // ScanPage — door scanner
    doorTitle: "Door",
    online: "Online",
    offline: "Offline",
  }
};

// Detect browser language
export const detectBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  // Extract the language code (e.g., 'es-ES' -> 'es', 'en-US' -> 'en')
  const langCode = browserLang.split('-')[0].toLowerCase();
  // Default to Spanish if language is Spanish, otherwise English
  return langCode === 'es' ? 'es' : 'en';
};
