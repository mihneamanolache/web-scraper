import type { StringBoolean } from "../types/Scraper.types";

export default (value: StringBoolean | undefined): boolean => value === undefined ? true : value === "true" || value === "1" || value === "yes" || value === "on" || value === "enabled" ? true : false; 
