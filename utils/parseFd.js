// ac_client/src/utils/parseFd.js

/**
 * Parses the raw FD string from the AC Controller hardware.
 * Handles both ':' and '=' delimiters, and removes the device ID prefix.
 */
export function parseFD(fdString) {
  if (!fdString || typeof fdString !== 'string') return {};
  
  // 1. Remove braces
  let cleanStr = fdString.trim().replace(/^{|}$/g, "");
  
  // 2. Separate the device ID prefix (e.g., "SR_2-9AC:260001")
  const firstComma = cleanStr.indexOf(',');
  if (firstComma === -1) return {};
  
  // 3. Everything after the first comma
  cleanStr = cleanStr.substring(firstComma + 1);
  
  const result = {};
  
  // 4. Split by comma, then by ':' (or '=' as fallback)
  cleanStr.split(',').forEach(pair => {
    let [key, val] = pair.split('=');
    if (val === undefined) {
      [key, val] = pair.split(':');
    }
    if (key && val !== undefined) {
      const k = key.trim();
      const v = val.trim();
      result[k] = isNaN(v) ? v : Number(v);
    }
  });
  
  return result;
}

/**
 * ✅ NEW: Compares FD data against TD data to check if hardware confirmed our command.
 * Only compares the `S_` parameters (setpoints) since that's what we sent.
 */
export function isEqualSetpoints(fdData, tdData) {
  if (!fdData || !tdData) return false;
  
  // Get all the S_ keys from the TD (this is what we actually sent)
  const tdKeys = Object.keys(tdData).filter(k => k.startsWith('S_'));
  
  // If no S_ keys in the TD, we can't confirm anything
  if (tdKeys.length === 0) return false;
  
  // Check every S_ key in the TD matches the FD
  return tdKeys.every(key => {
    return Number(fdData[key]) === Number(tdData[key]);
  });
}