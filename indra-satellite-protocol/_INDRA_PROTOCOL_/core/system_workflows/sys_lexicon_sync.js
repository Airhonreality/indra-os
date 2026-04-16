export default {
  "id": "sys_lexicon_sync",
  "metadata": { "category": "SYSTEM", "artifact": "UTIL" },
  "payload": {
    "label": "🛠️ TRADUCCIÓN: Sincronizar Lexicón",
    "stations": [
      {
        "id": "ST_LEX_SYNC",
        "type": "PROTOCOL",
        "protocol": "SYSTEM_LEXICON_PULL",
        "config": { "data": { "lang": "all" } }
      }
    ]
  }
};
