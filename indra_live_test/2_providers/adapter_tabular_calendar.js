// =============================================================================
// ARTEFACTO: 2_providers/adapter_tabular_calendar.gs
// CAPA: 2 — Providers (Soporte Interno)
// RESPONSABILIDAD: Transforma fuentes tabulares (Notion, Sheets) en eventos.
//         Axioma: Toda fila con campo 'date' es un evento potencial.
// =============================================================================

/**
 * Transforma un listado de átomos tabulares en átomos de calendario.
 * @param {Array<Object>} tabularAtoms - Átomos de clase TABULAR o DATA_ROW.
 */
function _ucp_tabularToEvents(tabularAtoms) {
  return tabularAtoms.map(atom => {
    const fields = atom.payload?.fields || atom;
    // Buscar campos que parezcan fechas
    const start = fields.date || fields.fecha || fields.start || fields.inicio;
    if (!start) return null;

    return {
      id: `tabular|${atom.id}`,
      class: 'CALENDAR_EVENT',
      handle: {
        ns: 'com.indra.calendar.event.tabular',
        alias: atom.handle?.alias || 'evento_tabular',
        label: atom.handle?.label || fields.name || 'Evento Tabular'
      },
      provider: 'calendar_universal',
      protocols: ['ATOM_READ'],
      payload: {
        fields: {
          summary: atom.handle?.label || fields.name,
          start: start,
          end: fields.end || fields.fin || start,
          location: fields.location || fields.lugar || 'N/A',
          source_identity: {
            silo: 'tabular',
            original_id: atom.id
          }
        }
      },
      raw: atom
    };
  }).filter(Boolean);
}
