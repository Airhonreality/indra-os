function debug_CheckProperties() {
  const props = PropertiesService.getScriptProperties().getProperties();
  const keys = Object.keys(props);
  Logger.log("📋 Script Properties Count: " + keys.length);
  
  keys.forEach(k => {
    if (k.includes("NOTION") || k.includes("TOKEN") || k.includes("KEY")) {
      const val = props[k];
      const masked = val ? (val.substring(0, 5) + "..." + val.substring(val.length - 4)) : "null";
      Logger.log(`🔍 Key: ${k} | Value: ${masked}`);
    }
  });
  
  const userProps = PropertiesService.getUserProperties().getProperties();
  Logger.log("📋 User Properties Count: " + Object.keys(userProps).length);
  Object.keys(userProps).forEach(k => {
     if (k.includes("NOTION")) {
        Logger.log(`🔍 User Key: ${k} | Value: [MASKED]`);
     }
  });
}
