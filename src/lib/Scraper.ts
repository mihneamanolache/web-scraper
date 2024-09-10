import type { Browser, BrowserContext, LaunchOptions, Page, Route, Response, Dialog, BrowserType } from "playwright";
import { ProxyType, type IProxyConfig, type IScraperConfig, type IScraperResult } from "./../types/Scraper.types";
import { launchOptions } from "./../utils/constants/browser.defaults";
import parseBool from "./../utils/parseBool";
import getBrowser from "./../utils/getBrowser";

/**
 * Scraper class for performing web scraping tasks.
 * It configures and launches a browser instance, manages browser contexts and pages, and returns the scraping results.
 */
export default class Scraper {

    /* PROTECTED */
    protected _CONFIG:  IScraperConfig;

    /* PRIVATE */
    private launchOptions:  LaunchOptions           = JSON.parse(JSON.stringify(launchOptions)) as LaunchOptions; 
    private _timeout:       number                  = 60_000;
    private context:        BrowserContext | null   = null;
    private browser:        Browser | null          = null;
    private page:           Page | null             = null;
   
    /* GETTERS */
    private get timeout(): number {
        return this._CONFIG.timeout ?? this._timeout;
    }

    /**
     * Creates a new Scraper instance with the given configuration.
     *
     * @param { IScraperConfig } config - The configuration for the scraping, including the target URL, proxy settings, browser type, etc.
     */
    public constructor(
        config: IScraperConfig
    ) { 
        this._CONFIG = config;
        /* setup scraper */
        this.setupLaunchOptions();
    }

    /**
     * Configures the launch options for the browser instance based on the provided configuration.
     * This includes proxy settings, headless mode, and browser-specific features such as stealth and ad blocking.
     *
     * TODO: Throw error if proxy_type is set but no proxy setup is provided in the environment variables.
     */
    private setupLaunchOptions(): void {
        this.launchOptions.proxy = ((): IProxyConfig | undefined => {
            switch (this._CONFIG.proxy_type) {
                case ProxyType.None:        
                    return undefined;
                default:                    
                    return {
                        server:     process.env[`PROXY_${this._CONFIG.proxy_type.toUpperCase()}_SERVER`]    ?? "",
                        username:   process.env[`PROXY_${this._CONFIG.proxy_type.toUpperCase()}_USERNAME`]  ?? "",
                        password:   process.env[`PROXY_${this._CONFIG.proxy_type.toUpperCase()}_PASSWORD`]  ?? "",
                        bypass:     process.env[`PROXY_${this._CONFIG.proxy_type.toUpperCase()}_BYPASS`]    ?? "",
                    }
            }
        })();
        this.launchOptions.headless = parseBool(this._CONFIG.headless);
        /**
         * HACK: Currently, webkit does not support proxy, while firefox does not support stealth and block_ads.
         */
        switch ( this._CONFIG.browser_type ) {
            case "webkit":
                this.launchOptions.proxy = undefined;
                break;
            case "firefox":
                break
            case "chromium":
                /* @ts-expect-error: Property */
                this.launchOptions.stealth = parseBool(this._CONFIG.stealth);
                /* @ts-expect-error: ProxyType */
                this.launchOptions.blockAds = parseBool(this._CONFIG.block_ads);
                break;
            default:
                break;
        }       
    }

    /**
     * Handles resource blocking based on the types specified in the configuration.
     * This method is called for each network request to determine whether the resource should be blocked.
     * 
     * @param { Route }         route       - The route object representing the network request.
     * @param { Array<string> } resources   - Array of resource types (e.g., "image", "media") to block.
     */
    private async blockResources(route: Route, resources: Array<string>): Promise<void> {
        try {
            if ( resources.includes(route.request().resourceType()) ) {
                await route.abort();
            } else {
                await route.continue();
            }
        } catch (e: unknown) {
            console.error(e);
        }
    }

    /**
     * Initializes and launches the browser instance.
     * 
     * @returns A promise that resolves to the launched Browser instance.
     */
    private async setupBrowser(): Promise<Browser> {
        const browser: BrowserType = getBrowser(this._CONFIG.browser_type);
        return await browser.connect(`${process.env.BROWSER_WS_ENDPOINT ?? "ws://127.0.0.1"}/${browser.name()}/playwright?launch=${JSON.stringify(this.launchOptions)}`);
    }

    /**
     * Initializes the browser context.
     * The context is a separate environment within the browser instance, with its own cache, cookies, etc.
     * 
     * @returns A promise that resolves to the created BrowserContext.
     */
    private async setupContext(): Promise<BrowserContext> {
        if ( !this.browser ) {
            throw new Error("Browser is not initialized");
        }
        return await this.browser.newContext(this.launchOptions);
    }

    /**
     * Initializes the page within the context.
     * The page is where the actual interaction with the web content occurs.
     * 
     * @returns A promise that resolves to the created Page.
     */
    private async setupPage(): Promise<Page> {
        if ( !this.context ) {
            throw new Error("Context is not initialized");
        }
        const page: Page = await this.context.newPage();
        if ( this._CONFIG.block_resources ) {
            const resources: Array<string> = this._CONFIG.block_resources.split(",");
            await page.route("**/*", (route: Route): Promise<void> => this.blockResources(route, resources));
        }
        page.setDefaultTimeout(this.timeout);
        return page;
    }
    
    /**
     * Cleans up resources by closing the page, context, and browser.
     * This method ensures that all resources are properly released after the scraping operation.
     */
    private async cleanup(): Promise<void> {
        if ( this.page ) {
            await this.page.unroute("**/*").catch((e: unknown): void => { console.error(e) });
            await this.page.close().catch((e: unknown): void => { console.error(e) });
        }
        if ( this.context ) {
            await this.context.close().catch((e: unknown): void => { console.error(e) });
        }
        if ( this.browser ) {
            if ( this.browser.isConnected() ) {
                this.browser.removeAllListeners()
                await this.browser.close().catch((e: unknown): void => { console.error(e) });
            }
        }
    }

    /**
     * Performs the actual scraping operation.
     * This includes navigating to the target URL, waiting for the page to load, executing custom JavaScript, 
     * taking screenshots, and capturing the final HTML content.
     * 
     * @returns A promise that resolves to an IScraperResult object containing the scraping results.
     */
    private async scrape(): Promise<IScraperResult> {
        const result: IScraperResult = {} as IScraperResult;
        const crash: () => void = (): void => {
            console.error(`Page crashed on ${this.page?.url() ?? "unknown"}`);
            throw new Error("Page crashed");
        };
        const close: () => void = (): void => {
            console.warn(`Page closed on ${this.page?.url() ?? "unknown"}`);
        };
        const dialog: (dialog: Dialog) => Promise<void> = async (dialog: Dialog): Promise<void> => {
            await dialog.dismiss();
        };
        try {
            const URL: string = this._CONFIG.view_source !== undefined && parseBool(this._CONFIG.view_source) ? `view-source:${this._CONFIG.url}` : this._CONFIG.url ;
            this.browser    = await this.setupBrowser();
            this.context    = await this.setupContext(); 
            this.page       = await this.setupPage();
            this.page.on('crash', crash);
            this.page.on('close', close);
            this.page.on('dialog', dialog);
            /* go to the page */
            const res: Response | null = await this.page.goto(URL, {
                waitUntil: this._CONFIG.wait_until ?? "domcontentloaded",
            });
            result.headers = res?.headers() ?? {};
            if ( this._CONFIG.wait_for ) {
                await this.page.waitForTimeout(this._CONFIG.wait_for);
            }
            if ( this._CONFIG.wait_for_css ) {
                await this.page.waitForSelector(this._CONFIG.wait_for_css);
            }
            if ( undefined !== this._CONFIG.eval_js ) {
                const evaluate: unknown = await this.page.evaluate(decodeURIComponent(this._CONFIG.eval_js));
                result.eval_result = evaluate;
            }
            if ( this._CONFIG.screenshot ) {
                const screenshot_buff: Buffer = await this.page.screenshot({ fullPage: true, timeout: this.timeout / 2 });
                result.screenshot = screenshot_buff.toString('base64');
            }
            result.url = this.page.url();
            result.body = await this.page.content();
            result.status_code = res?.status() ?? 0;
            result.cookies = await this.context.cookies();
            return result;
        } catch (e: unknown) {
            return {
                url:            this._CONFIG.url,
                error:          (e as Error).message,
                status_code:    500,
            }
        } finally {
            try { 
                if ( this.page ) {
                    this.page.off('crash', crash);
                    this.page.off('close', close);
                    this.page.off('dialog', dialog);
                }
                await this.cleanup();
            } catch (e: unknown) {
                console.error(e);
            }
        }
    }

    /**
     * Runs the scraping process.
     * This method is the main entry point for starting the scraper and returns the final result of the operation.
     * 
     * @returns A promise that resolves to an IScraperResult object containing the final scraping results.
     */
    public async run(): Promise<IScraperResult> {
        let res: IScraperResult = {} as IScraperResult;
        try {
            res = await this.scrape();
        } catch (e: unknown) {
            res.url = this._CONFIG.url;
            res.error = (e as Error).message;
            res.status_code = 500;
        } 
        return res;
    }
}
