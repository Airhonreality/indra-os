export default {
  "id": "sys_atom_inspector",
  "metadata": { "category": "SYSTEM", "artifact": "UTIL" },
  "payload": {
    "label": "🛠️ INSPECTOR: Ver ADN del Átomo",
    "stations": [
      {
        "id": "ST_INSPECT",
        "type": "PROTOCOL",
        "protocol": "UI_INVOKE",
        "config": { 
          "module": "JSON_INSPECTOR", 
          "payload": { "atom_id": "{trigger.atom_id}" } 
        }
      }
    ]
  }
};
