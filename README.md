# Web Scraper

A TypeScript-based web scraper that utilizes the [Playwright](https://playwright.dev/) library for performing automated web scraping tasks. This scraper is designed to be flexible, with customizable configurations, and is capable of handling various browser types and proxy settings. Additionally, it integrates with [Browserless](https://www.browserless.io/), a headless browser service, to enable remote browser automation.

## Features

- Supports Multiple Browser Types: Choose between Chromium, Firefox, and WebKit for scraping tasks.
- Proxy Integration: Easily configure HTTP or SOCKS proxies for your scraping tasks.
- Resource Blocking: Block specific resource types (e.g., images, media) to speed up scraping.
- Headless and Stealth Modes: Run the browser in headless mode and enable stealth settings to avoid detection.
- Custom JavaScript Execution: Inject and execute custom JavaScript on the page.
- Screenshot Capture: Capture full-page screenshots of the web page.
- Timeout and Wait Options: Customize timeouts, wait for specific events or elements before proceeding.

## Installation

To install the web scraper, you can use npm or yarn:

```bash
npm install @mihnea.dev/webscraper
```

## Configuration

The scraper can be configured with various options to customize its behavior. Here is an example configuration:

```typescript
const config: IScraperConfig = {
    url:            "https://example.com",
    proxy_type:     ProxyType.Datacenter,
    browser_type:   BrowserType.Chromium,
    headless:       "true",
    block_ads:      "true",
    stealth:        "true",
    timeout:        30000,
    wait_until:     "networkidle",
};
```

## Environment Variables

The scraper uses environment variables to configure proxy settings:

- PROXY_[TYPE]_SERVER   - Proxy server URL.
- PROXY_[TYPE]_USERNAME - Proxy username (if required).
- PROXY_[TYPE]_PASSWORD - Proxy password (if required).
- PROXY_[TYPE]_BYPASS   - Domains to bypass the proxy.

Replace [TYPE] with the proxy type, such as DATACENTER or MOBILE.

## Usage

To use the web scraper, you can create a new instance of the `Scraper` class and call the `scrape` method:

```typescript
import Scraper, { type IScraperConfig, ProxyType, BrowserType } from "@mihnea.dev/webscraper";

const config: IScraperConfig = {
    url:            "https://api.ipify.org",
    proxy_type:     ProxyType.None,
    browser_type:   BrowserType.Chromium,
    headless:       true,
    block_ads:      true,
    stealth:        true,
    timeout:        30000,
    wait_until:     "networkidle",
};

const scraper: Scraper = new Scraper(config);

scraper.run().then((result) => {
    console.log(result);
}).catch((error: Error) => {
    console.error("Scraping failed:", error.message);
});
```

**IMPORTANT**
Currently, the Scraper class is designed to integrate with Browserless. To use the scraper with Browserless, you need to: 
- set `BROWSER_WS_ENDPOINT` environment variable to the Browserless WebSocket URL (defaults to `ws://localhost:3000`) 
- run the Browserless service locally or use the Browserless API. To run it locally, you can use the following Docker command:

```bash
docker run -p 3000:3000 ghcr.io/browserless/multi:latest
```

## Contributing

Contributions are welcome! For feature requests, bug reports, or other feedback, please open an issue on GitHub. If you would like to contribute code, please submit a pull request.

## License

This project is licensed under the SSPL-1.0 License. See the [LICENSE](LICENSE) file for details.
