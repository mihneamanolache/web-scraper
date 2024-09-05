import type { LaunchOptions } from "playwright";
import dotenv from "dotenv";
dotenv.config();

export const launchOptions: LaunchOptions = {
    headless: true,
    ignoreDefaultArgs: ["--headless"],
};
