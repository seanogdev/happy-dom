import BrowserPage from './BrowserPage.js';
import AsyncTaskManager from '../async-task-manager/AsyncTaskManager.js';
import IBrowserFrame from './types/IBrowserFrame.js';
import BrowserWindow from '../window/BrowserWindow.js';
import Location from '../location/Location.js';
import IResponse from '../fetch/types/IResponse.js';
import IGoToOptions from './types/IGoToOptions.js';
import { Script } from 'vm';
import BrowserFrameURL from './utilities/BrowserFrameURL.js';
import BrowserFrameScriptEvaluator from './utilities/BrowserFrameScriptEvaluator.js';
import BrowserFrameNavigator from './utilities/BrowserFrameNavigator.js';
import IReloadOptions from './types/IReloadOptions.js';

/**
 * Browser frame.
 */
export default class BrowserFrame implements IBrowserFrame {
	public readonly childFrames: BrowserFrame[] = [];
	public readonly parentFrame: BrowserFrame | null = null;
	public readonly opener: BrowserFrame | null = null;
	public readonly page: BrowserPage;
	public readonly window: BrowserWindow;
	public __asyncTaskManager__ = new AsyncTaskManager();

	/**
	 * Constructor.
	 *
	 * @param page Page.
	 */
	constructor(page: BrowserPage) {
		this.page = page;
		this.window = new BrowserWindow(this);
	}

	/**
	 * Returns the content.
	 *
	 * @returns Content.
	 */
	public get content(): string {
		return this.window.document.documentElement.outerHTML;
	}

	/**
	 * Sets the content.
	 *
	 * @param content Content.
	 */
	public set content(content) {
		this.window.document['__isFirstWrite__'] = true;
		this.window.document['__isFirstWriteAfterOpen__'] = false;
		this.window.document.open();
		this.window.document.write(content);
	}

	/**
	 * Returns the URL.
	 *
	 * @returns URL.
	 */
	public get url(): string {
		return this.window.location.href;
	}

	/**
	 * Sets the content.
	 *
	 * @param url URL.
	 */
	public set url(url) {
		(<Location>this.window.location) = new Location(
			this,
			BrowserFrameURL.getRelativeURL(this, url).href
		);
	}

	/**
	 * Returns a promise that is resolved when all async tasks are complete.
	 *
	 * @returns Promise.
	 */
	public async whenComplete(): Promise<void> {
		await Promise.all([
			this.__asyncTaskManager__.whenComplete(),
			...this.childFrames.map((frame) => frame.whenComplete())
		]);
	}

	/**
	 * Aborts all ongoing operations.
	 *
	 * @returns Promise.
	 */
	public abort(): void {
		for (const frame of this.childFrames) {
			frame.abort();
		}
		this.__asyncTaskManager__.abort();
	}

	/**
	 * Evaluates code or a VM Script in the page's context.
	 *
	 * @param script Script.
	 * @returns Result.
	 */
	public evaluate(script: string | Script): any {
		return BrowserFrameScriptEvaluator.evaluate(this, script);
	}

	/**
	 * Go to a page.
	 *
	 * @param url URL.
	 * @param [options] Options.
	 * @returns Response.
	 */
	public goto(url: string, options?: IGoToOptions): Promise<IResponse | null> {
		return BrowserFrameNavigator.goto(BrowserWindow, this, url, options);
	}

	/**
	 * Reloads the current frame.
	 *
	 * @param [options] Options.
	 * @returns Response.
	 */
	public reload(options: IReloadOptions): Promise<IResponse | null> {
		return BrowserFrameNavigator.goto(BrowserWindow, this, this.url, options);
	}
}
