import type { BrowserType} from "playwright";
import { chromium, firefox, webkit } from "playwright";
import type { BrowserTypes } from "../types/Scraper.types";

export default (browser: BrowserTypes | undefined): BrowserType => {
    switch (browser) {
        case "webkit":  return webkit;
        case "firefox": return firefox;
        default:        return chromium;
    }
}
