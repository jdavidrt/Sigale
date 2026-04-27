// translations.js - All app translations in Spanish and English

export const translations = {
  es: {
    // Navbar
    home: "Inicio",
    sell: "Vender",
    validate: "Validar",
    dashboard: "Panel",
    event: "Evento",

    // Common
    save: "Guardar",
    cancel: "Cancelar",
    delete: "Eliminar",
    edit: "Editar",
    create: "Crear",
    update: "Actualizar",
    search: "Buscar",
    close: "Cerrar",
    loading: "Cargando",
    error: "Error",
    success: "Éxito",
    required: "Requerido",
    optional: "Opcional",

    // Event Creation
    createNewEvent: "Crear Nuevo Evento",
    setupEventDetails: "Configure los detalles de su evento y tipos de boletas",
    sellTicketsTitle: "Vender Boletas",
    manageTicketSales: "Crear y administrar ventas de boletas para su evento",
    validateTicketsTitle: "Validar Boletas",
    scanValidateTickets: "Escanear y validar boletas en el evento",
    editEventTitle: "Editar Evento",
    updateEventDetails: "Actualizar los detalles de su evento y tipos de boletas",
    checkInValidation: "Validación de Registro",
    scanQRValidate: "Escanear códigos QR para validar y registrar asistentes",
    scanner: "Escáner",
    ticketList: "Lista de Boletas",
    eventDetails: "Detalles del Evento",
    eventName: "Nombre del Evento",
    date: "Fecha",
    venue: "Lugar",
    venueName: "Nombre del Lugar",
    address: "Dirección",
    fullAddress: "Dirección Completa",
    entranceTime: "Hora de Entrada",
    location: "Ubicación",
    noAddress: "Sin dirección",
    dateAndTime: "Fecha y Hora",
    revenue: "Ingresos",
    ticketTypes: "Tipos de Boletas",
    ticketTypesDesc: "Se requiere al menos un tipo de boleta",
    typeName: "Nombre del Tipo",
    price: "Precio",
    addType: "Agregar Tipo",
    removeType: "Eliminar",
    addNewTicketType: "Agregar Nuevo Tipo de Boleta",
    createEvent: "Crear Evento",
    updateEvent: "Actualizar Evento",

    // Ticket Form
    newTicketSale: "Nueva Venta de Boleta",
    buyerInfo: "Información del Comprador",
    buyerInfoDesc: "Complete la información del comprador para generar una boleta",
    pasteNameAndId: "Pegar Nombre y Cédula",
    buyerName: "Nombre",
    idNumber: "ID",
    phoneNumber: "Número de Teléfono",
    ticketType: "Tipo de Boleta",
    selectTicketType: "Seleccione un tipo de boleta",
    createTicket: "Crear Boleta",
    creatingTicket: "Creando Boleta...",

    // Ticket Display
    ticketCreated: "¡Boleta Creada!",
    ticketFor: "Boleta para",
    ticketId: "ID de Boleta",
    validationHash: "Hash de Validación",
    purchaseDate: "Fecha de Compra",
    qrCode: "Código QR",
    copyAsSVG: "Copiar como SVG",
    copyAsPNG: "Copiar como PNG",
    share: "Compartir",
    createAnother: "Crear Otra Boleta",
    copiedToClipboard: "Copiado al portapapeles",
    shareTicket: "Compartir Boleta",

    // QR Scanner
    scanQR: "Escanear Código QR",
    scannerLoading: "Cargando escáner...",
    scannerError: "Error al cargar el escáner",
    pointCamera: "Apunte la cámara al código QR",

    // Validation Results
    validTicket: "¡Boleta Válida!",
    invalidTicket: "Boleta Inválida",
    duplicateCheckIn: "Check-in Duplicado",
    ticketNotFound: "Boleta No Encontrada",
    alreadyCheckedIn: "Ya registrado el",
    checkedInAt: "Registrado a las",
    scanAnother: "Escanear Otra",

    // Ticket List
    allTickets: "Todas las Boletas",
    searchTickets: "Buscar boletas por nombre, ID o teléfono",
    noTickets: "No hay boletas",
    noTicketsDesc: "Aún no se han creado boletas",
    ticketsFound: "boletas encontradas",
    checkedIn: "Registrado",
    notCheckedIn: "No Registrado",
    clearAllTickets: "Eliminar Todas las Boletas",
    confirmResetCheckIns: "¿Está seguro de que desea eliminar todas las boletas? Esta acción no se puede deshacer.",
    confirmResetCheckInsRetype: "Escriba DELETE para confirmar la eliminación de todas las boletas:",
    enterPasswordToReset: "Ingrese la contraseña para eliminar todas las boletas:",
    incorrectPassword: "Contraseña incorrecta. Eliminación cancelada.",
    deletionCancelled: "Eliminación cancelada.",
    checkInsReset: "Todas las boletas han sido eliminadas.",
    confirmDeleteTicket: "¿Eliminar esta boleta?\n\nComprador: {buyer}\nID de Boleta: {id}\n\nEsta acción no se puede deshacer.",
    filterAll: "Todas",
    cannotRemoveTicketTypeInUse: "No se puede eliminar el tipo de boleta — ya existen {count} boleta(s) de este tipo. Reasigne o elimine esas boletas primero.",
    navTickets: "Boletas",
    navCopy: "Copiar",

    // Home Page
    welcome: "Bienvenido a",
    noEvent: "No hay eventos configurados",
    noEventDesc: "Cree un evento para comenzar a vender boletas",
    setupEvent: "Configurar Evento",
    eventInfo: "Información del Evento",
    editEvent: "Editar Evento",
    sellTicketTypes: "Vender Tipos de Boletas",
    viewAnalytics: "Ver análisis y estadísticas",
    madeIn: "Hecho en Colombia con Amor - ARMA",
    toggleLanguage: "Cambiar idioma",

    // Dashboard (placeholder for Stage 3)
    salesDashboard: "Panel de Ventas",
    checkInDashboard: "Panel de Registro",
    totalSold: "Total Vendidas",
    totalRevenue: "Ingresos Totales",
    totalCheckedIn: "Total Registrados",
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
    enterIdNumber: "Ingrese número de identificación",
    phoneNumberPlaceholder: "+57 300 1234567",
    ticketTypeExample: "ej., VIP, General",

    // Alerts
    atLeastOneTicketType: "Por favor agregue al menos un tipo de boleta",
    ticketTypeExists: "Este tipo de boleta ya existe",
    enterTicketTypeName: "Por favor ingrese un nombre de tipo de boleta",
    ticketTypeNameEmpty: "El nombre del tipo de boleta no puede estar vacío",
    ticketTypeNameExists: "Ya existe un tipo de boleta con este nombre",
    mustHaveOneTicketType: "Debe tener al menos un tipo de boleta",
    failedToCreateTicket: "Error al crear la boleta. Por favor intente de nuevo.",

    // Delete Event
    dangerZone: "Zona de Peligro",
    deleteEvent: "Eliminar Evento",
    deleteEventWarning: "Esta acción es IRREVERSIBLE. Se eliminarán permanentemente todos los datos del evento y todas las boletas vendidas.",
    slideToDelete: "Desliza para eliminar",
    confirmDeleteTitle: "¿Eliminar evento permanentemente?",
    confirmDeleteMessage: "Estás a punto de eliminar el evento y todas sus boletas. Esta acción NO se puede deshacer.",
    confirmDeleteButton: "Sí, eliminar todo",
    cancelDelete: "Cancelar",
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

    // Attendance Sheet PDF
    exportAttendanceSheet: "Exportar Hoja de Asistencia",
    attendanceSheet: "Hoja de Asistencia",
    artistCourtesy: "Artista/Cortesía",
    attendance: "Asistencia",
    copyJSON: "Copiar JSON",
    downloadJSON: "Descargar JSON",
    copyCSV: "Copiar CSV",
    downloadCSV: "Descargar CSV",

    // Copy Event Page
    copyEventData: "Copiar Datos del Evento",
    copyEventSubtitle: "Respalda o transfiere los datos de tu evento y boletas",

    // H5 — check-in window warnings (soft, confirm-to-proceed)
    checkInEarlyWarning: "La fecha del evento es en {days} día(s). ¿Continuar con el registro?",
    checkInLateWarning: "La fecha del evento fue hace {days} día(s). ¿Continuar con el registro?",
    checkInCancelledOutsideWindow: "Registro cancelado (fuera de la ventana del evento)",

    // N1 — JSON import (Event page)
    jsonImportInvalid: "❌ Formato JSON inválido",
    eventImported: "✅ ¡Evento importado exitosamente!",
    eventImportError: "❌ Error al importar el evento",
    pasteEventData: "Pegar Datos del Evento",
    allTicketTypesMustHavePrice: "Todos los tipos de boleta deben tener un precio válido (0 o positivo).",
    type: "Tipo",
    newType: "Nuevo Tipo...",

    // N2 — Ticket Form success state + update mode
    updateTicket: "Actualizar Boleta",
    ticketUpdated: "¡Boleta actualizada exitosamente!",
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
    qrInvalidFormat: "Formato de código QR inválido",
    ticketForDifferentEvent: "Esta boleta fue emitida para un evento diferente",
    ticketNotFoundInDb: "Boleta no encontrada en la base de datos",
    alreadyCheckedInMessage: "Esta boleta ya ha sido registrada",
    checkInSuccessful: "¡Registro exitoso!",
    checkInSaveFailed: "No se pudo guardar el registro. Verifique el almacenamiento e intente de nuevo.",
    stopCamera: "Detener Cámara",
    cameraPermissionDenied: "Se denegó el acceso a la cámara. Permita el permiso de cámara en la configuración de su navegador y recargue la página.",
    positionQRCode: "Coloque el código QR dentro del marco",

    // Scanner flow — ValidationResult.jsx labels
    checkInSuccessTitle: "¡Registro Exitoso!",
    checkInFailedTitle: "Registro Fallido",
    resultBuyer: "Comprador",
    originalCheckIn: "Registro original",
    qrDataLabel: "Datos QR",
    continueAction: "Continuar",
    tryAgain: "Intentar de nuevo",
  },

  en: {
    // Navbar
    home: "Home",
    sell: "Sell",
    validate: "Validate",
    dashboard: "Dashboard",
    event: "Event",

    // Common
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    create: "Create",
    update: "Update",
    search: "Search",
    close: "Close",
    loading: "Loading",
    error: "Error",
    success: "Success",
    required: "Required",
    optional: "Optional",

    // Event Creation
    createNewEvent: "Create New Event",
    setupEventDetails: "Set up your event details and ticket types",
    sellTicketsTitle: "Sell Tickets",
    manageTicketSales: "Create and manage ticket sales for your event",
    validateTicketsTitle: "Validate Tickets",
    scanValidateTickets: "Scan and validate tickets at the event",
    editEventTitle: "Edit Event",
    updateEventDetails: "Update your event details and ticket types",
    checkInValidation: "Check-In Validation",
    scanQRValidate: "Scan QR codes to validate and check in attendees",
    scanner: "Scanner",
    ticketList: "Ticket List",
    eventDetails: "Event Details",
    eventName: "Event Name",
    date: "Date",
    venue: "Venue",
    venueName: "Venue Name",
    address: "Address",
    fullAddress: "Full Address",
    entranceTime: "Entrance Time",
    location: "Location",
    noAddress: "No address",
    dateAndTime: "Date & Time",
    revenue: "Revenue",
    ticketTypes: "Ticket Types",
    ticketTypesDesc: "At least one ticket type is required",
    typeName: "Type Name",
    price: "Price",
    addType: "Add Type",
    removeType: "Remove",
    addNewTicketType: "Add New Ticket Type",
    createEvent: "Create Event",
    updateEvent: "Update Event",

    // Ticket Form
    newTicketSale: "New Ticket Sale",
    buyerInfo: "Buyer Information",
    buyerInfoDesc: "Fill in the buyer information to generate a ticket",
    pasteNameAndId: "Paste Name & ID",
    buyerName: "Buyer Name",
    idNumber: "ID Number",
    phoneNumber: "Phone Number",
    ticketType: "Ticket Type",
    selectTicketType: "Select a ticket type",
    createTicket: "Create Ticket",
    creatingTicket: "Creating Ticket...",

    // Ticket Display
    ticketCreated: "Ticket Created!",
    ticketFor: "Ticket for",
    ticketId: "Ticket ID",
    validationHash: "Validation Hash",
    purchaseDate: "Purchase Date",
    qrCode: "QR Code",
    copyAsSVG: "Copy as SVG",
    copyAsPNG: "Copy as PNG",
    share: "Share",
    createAnother: "Create Another Ticket",
    copiedToClipboard: "Copied to clipboard",
    shareTicket: "Share Ticket",

    // QR Scanner
    scanQR: "Scan QR Code",
    scannerLoading: "Loading scanner...",
    scannerError: "Error loading scanner",
    pointCamera: "Point camera at QR code",

    // Validation Results
    validTicket: "Valid Ticket!",
    invalidTicket: "Invalid Ticket",
    duplicateCheckIn: "Duplicate Check-In",
    ticketNotFound: "Ticket Not Found",
    alreadyCheckedIn: "Already checked in on",
    checkedInAt: "Checked in at",
    scanAnother: "Scan Another",

    // Ticket List
    allTickets: "All Tickets",
    searchTickets: "Search tickets by name, ID, or phone",
    noTickets: "No tickets",
    noTicketsDesc: "No tickets have been created yet",
    ticketsFound: "tickets found",
    checkedIn: "Checked In",
    notCheckedIn: "Not Checked In",
    clearAllTickets: "Delete All Tickets",
    confirmResetCheckIns: "Are you sure you want to delete all tickets? This action cannot be undone.",
    confirmResetCheckInsRetype: "Type DELETE to confirm deleting all tickets:",
    enterPasswordToReset: "Enter password to delete all tickets:",
    incorrectPassword: "Incorrect password. Deletion cancelled.",
    deletionCancelled: "Deletion cancelled.",
    checkInsReset: "All tickets have been deleted.",
    confirmDeleteTicket: "Delete this ticket?\n\nBuyer: {buyer}\nTicket ID: {id}\n\nThis action cannot be undone.",
    filterAll: "All",
    cannotRemoveTicketTypeInUse: "Cannot remove ticket type — {count} ticket(s) of this type already exist. Reassign or delete those tickets first.",
    navTickets: "Tickets",
    navCopy: "Copy",

    // Home Page
    welcome: "Welcome to",
    noEvent: "No event configured",
    noEventDesc: "Create an event to start selling tickets",
    setupEvent: "Setup Event",
    eventInfo: "Event Information",
    editEvent: "Edit Event",
    sellTicketTypes: "Sell Ticket Types",
    viewAnalytics: "View analytics and statistics",
    madeIn: "Made in Colombia with Love - ARMA",
    toggleLanguage: "Toggle language",

    // Dashboard (placeholder for Stage 3)
    salesDashboard: "Sales Dashboard",
    checkInDashboard: "Check-In Dashboard",
    totalSold: "Total Sold",
    totalRevenue: "Total Revenue",
    totalCheckedIn: "Total Checked In",
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
    enterIdNumber: "Enter ID number",
    phoneNumberPlaceholder: "+1 555 123 4567",
    ticketTypeExample: "e.g., VIP, General",

    // Alerts
    atLeastOneTicketType: "Please add at least one ticket type",
    ticketTypeExists: "This ticket type already exists",
    enterTicketTypeName: "Please enter a ticket type name",
    ticketTypeNameEmpty: "Ticket type name cannot be empty",
    ticketTypeNameExists: "A ticket type with this name already exists",
    mustHaveOneTicketType: "You must have at least one ticket type",
    failedToCreateTicket: "Failed to create ticket. Please try again.",

    // Delete Event
    dangerZone: "Danger Zone",
    deleteEvent: "Delete Event",
    deleteEventWarning: "This action is IRREVERSIBLE. All event data and sold tickets will be permanently deleted.",
    slideToDelete: "Slide to delete",
    confirmDeleteTitle: "Delete event permanently?",
    confirmDeleteMessage: "You are about to delete the event and all its tickets. This action CANNOT be undone.",
    confirmDeleteButton: "Yes, delete everything",
    cancelDelete: "Cancel",
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

    // Attendance Sheet PDF
    exportAttendanceSheet: "Export Attendance Sheet",
    attendanceSheet: "Attendance Sheet",
    artistCourtesy: "Artist/Courtesy",
    attendance: "Attendance",
    copyJSON: "Copy JSON",
    downloadJSON: "Download JSON",
    copyCSV: "Copy CSV",
    downloadCSV: "Download CSV",

    // Copy Event Page
    copyEventData: "Copy Event Data",
    copyEventSubtitle: "Backup or transfer your event and ticket data",

    // H5 — check-in window warnings (soft, confirm-to-proceed)
    checkInEarlyWarning: "Event date is in {days} day(s). Continue with check-in?",
    checkInLateWarning: "Event date was {days} day(s) ago. Continue with check-in?",
    checkInCancelledOutsideWindow: "Check-in cancelled (outside event window)",

    // N1 — JSON import (Event page)
    jsonImportInvalid: "❌ Invalid JSON format",
    eventImported: "✅ Event imported successfully!",
    eventImportError: "❌ Error importing event",
    pasteEventData: "Paste Event Data",
    allTicketTypesMustHavePrice: "All ticket types must have a valid price (0 or positive).",
    type: "Type",
    newType: "New Type...",

    // N2 — Ticket Form success state + update mode
    updateTicket: "Update Ticket",
    ticketUpdated: "Ticket updated successfully!",
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
    qrInvalidFormat: "Invalid QR code format",
    ticketForDifferentEvent: "This ticket was issued for a different event",
    ticketNotFoundInDb: "Ticket not found in database",
    alreadyCheckedInMessage: "This ticket has already been checked in",
    checkInSuccessful: "Check-in successful!",
    checkInSaveFailed: "Check-in could not be saved. Check storage and try again.",
    stopCamera: "Stop Camera",
    cameraPermissionDenied: "Camera access was denied. Please allow camera permission in your browser settings and reload the page.",
    positionQRCode: "Position the QR code within the frame",

    // Scanner flow — ValidationResult.jsx labels
    checkInSuccessTitle: "Check-In Successful!",
    checkInFailedTitle: "Check-In Failed",
    resultBuyer: "Buyer",
    originalCheckIn: "Original check-in",
    qrDataLabel: "QR Data",
    continueAction: "Continue",
    tryAgain: "Try Again",
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
