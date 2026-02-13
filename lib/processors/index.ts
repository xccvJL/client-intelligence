// Import all processors so they register themselves in the registry.
// When you add a new source type, add its import here.
import "./gmail";
import "./google-drive";
import "./manual-note";

export { processorRegistry } from "./types";
