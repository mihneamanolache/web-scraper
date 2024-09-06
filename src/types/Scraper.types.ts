import type { Cookie } from "playwright";

export type PlaywrightLoadEvents = "load" | "domcontentloaded" | "networkidle" | "commit";

export type StringBoolean = "true" | "false" | "1" | "0" | "yes" | "no" | "on" | "off" | "enabled" | "disabled" | true | false; 

export enum ProxyType {
    None        = "none",
    IPv6        = "ipv6",
    Mobile      = "mobile",
    Residential = "residential",
    Datacenter  = "datacenter",
    Custom      = "custom",
}

export type BrowserTypes = "webkit" | "firefox" | "chromium";

export enum BrowserType {
    Webkit   = "webkit",
    Firefox  = "firefox",
    Chromium = "chromium",
}

export interface IScraperConfig {
    /**
     * URL to scrape.
     * This is the target URL that the scraper will navigate to and perform actions on.
     */
    url: string;

    /**
     * Type of proxy to use for the request.
     * Choose the proxy type based on the available options like IPv6, mobile, residential, datacenter, or custom.
     * The default is "none" if no proxy is required.
     */
    proxy_type: ProxyType;

    /**
     * Stringified JavaScript code to execute in the browser context.
     * This code will run after the page has loaded, allowing you to interact with or manipulate the page.
     * Example: "document.querySelector('button').click();"
     */
    eval_js?: string;

    /**
     * Playwright browser type to use for the request.
     * Choose from "webkit", "firefox", or "chromium" based on your needs.
     * The default browser type is "chromium".
     */
    browser_type?: BrowserTypes;

    /**
     * Whether to run the browser in headless mode.
     * In headless mode, the browser runs without a UI, which is typically faster and uses less memory.
     * This option is useful for running automated tests or scraping tasks in environments without a display.
     */
    headless?: StringBoolean;

    /**
     * Whether to block ads. Supported by Chromium browsers.
     * Blocking ads can speed up page loading times and reduce data usage.
     */
    block_ads?: StringBoolean;

    /**
     * Whether to run the browser in stealth mode. Supported by Chromium browsers.
     * Stealth mode hides the fact that a bot is accessing the website by masking certain browser characteristics.
     */
    stealth?: StringBoolean;

    /**
     * Timeout in milliseconds for the request.
     * The request will be aborted if it takes longer than the specified timeout.
     * Set to 0 for no timeout.
     */
    timeout?: number;

    /**
     * Resource types to block.
     * This is a comma-separated string of resource types like "image,media,document" that you want to block.
     * Blocking resources can reduce page load times by preventing certain types of content from being downloaded.
     */
    block_resources?: string;

    /**
     * Wait until a specific event occurs before continuing.
     * The scraper will wait until the specified event ("load", "domcontentloaded", "networkidle", "commit") occurs before proceeding.
     */
    wait_until?: PlaywrightLoadEvents;

    /**
     * Returns unrendered HTML content.
     * If true, the scraper will return the HTML content as received from the server, without any client-side rendering or modifications.
     */
    view_source?: StringBoolean;

    /**
     * Whether to take a screenshot of the page.
     * If true, the scraper will take a screenshot of the page and return it as a base64-encoded string.
     */
    screenshot?: StringBoolean;

    /**
     * CSS selector to wait for before continuing.
     * The scraper will wait until an element matching the specified CSS selector appears on the page.
     * This is useful for ensuring that certain content has loaded before interacting with the page.
     */
    wait_for_css?: string;

    /**
     * Wait for a specific amount of time before continuing.
     * The scraper will pause for the specified number of milliseconds before proceeding to the next step.
     */
    wait_for?: number;
}

export interface IScraperResult {
    /**
     * Final URL after redirects.
     * This is the URL of the page after any redirects have been followed.
     */
    url: string;

    /**
     * HTTP status code of the response.
     * The status code indicates the result of the HTTP request, such as 200 for success or 404 for not found.
     */
    status_code: number;

    /**
     * Response body.
     * The content of the page as a string, which may include the full HTML of the page.
     */
    body?: string;

    /**
     * Error message if the request failed.
     * If the scraping operation failed, this field contains a description of the error.
     */
    error?: string;

    /**
     * Response cookies.
     * An array of cookies set by the server during the request.
     * These cookies can be used in subsequent requests or for session management.
     */
    cookies?: Array<Cookie>;

    /**
     * Response headers.
     * A record of key-value pairs representing the headers returned by the server.
     * Headers provide additional information about the response, such as content type and caching policies.
     */
    headers?: Record<string, string>;

    /**
     * Base64 encoded screenshot of the page.
     * If the screenshot option was enabled, this field contains a base64-encoded string representing the image.
     */
    screenshot?: string;

    /**
     * Result of the JavaScript evaluation.
     * This is the value returned by the JavaScript code executed in the browser context, which could be of any type.
     */
    eval_result?: unknown;
}

export interface IProxyConfig {
    /**
     * Proxy to be used for all requests. HTTP and SOCKS proxies are supported, for example `http://myproxy.com:3128` or
     * `socks5://myproxy.com:3128`. Short form `myproxy.com:3128` is considered an HTTP proxy.
     */
    server: string;

    /**
     * Optional comma-separated domains to bypass proxy, for example `".com, chromium.org, .domain.com"`.
     */
    bypass?: string;

    /**
     * Optional username to use if HTTP proxy requires authentication.
     */
    username?: string;

    /**
     * Optional password to use if HTTP proxy requires authentication.
     */
    password?: string;
}
