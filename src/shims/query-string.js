// expo-router reads named exports from query-string, but the patched releases
// only have a default export. Without this adapter queryString.parse is
// undefined and the app crashes at runtime even though the build passes. Remove
// it once expo-router stops needing named exports.
import queryString from "../../node_modules/query-string/index.js";

export const { parse, stringify, extract, parseUrl, stringifyUrl, exclude, pick } =
  queryString;
export default queryString;
