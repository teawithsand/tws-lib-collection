import {
	DefaultStickyEventBus,
	StickySubscribable,
	SubscribableUtil,
} from "@teawithsand/fstate"
import { PlayerEntry } from "../player"
import { AsyncTaskQueue } from "../util/asyncQueue"
import {
	MetadataBag,
	MetadataLoadingResult,
	MetadataLoadingResultType,
} from "./durationBag"
import { AudioDurationLoader } from "./loader"

/**
 * Describes the current state of metadata loading,
 * including the metadata results and loading status.
 */
export interface MetadataLoadState {
	/** The current metadata results for all entries */
	metadataBag: MetadataBag
	/** True if any loading task is currently running or queued */
	isLoading: boolean
}

/**
 * Interface defining the public API of MultiDurationLoader,
 * which manages loading durations for multiple PlayerEntry objects.
 */
export interface MultiDurationLoader {
	/**
	 * Subscribable that emits updates whenever the metadata or loading status changes.
	 * Emits objects containing the metadata result and loading boolean.
	 */
	readonly metadataLoadState: StickySubscribable<MetadataLoadState>

	/**
	 * Set the list of player entries to load metadata for.
	 * Previous entries and results are replaced, and metadata loading begins.
	 * @param entries Array of PlayerEntry objects to load
	 */
	setEntries: (entries: PlayerEntry[]) => void

	/**
	 * Reload the metadata for a single entry at the specified index.
	 * Enqueues the reload operation.
	 * @param index The index of the entry to reload
	 */
	reloadEntry: (index: number) => void

	/**
	 * Returns a Promise that resolves once all current loading tasks are finished,
	 * indicating that the loader is idle.
	 */
	idlePromise: () => Promise<void>
}

/**
 * Implementation of the MultiDurationLoader interface,
 * managing asynchronous loading of audio durations for a list of PlayerEntry instances.
 */
export class MultiDurationLoaderImpl implements MultiDurationLoader {
	private entries: PlayerEntry[] = []
	private results: (MetadataLoadingResult | null)[] = []

	private _metadataStateBus = new DefaultStickyEventBus<MetadataLoadState>({
		metadataBag: new MetadataBag([]),
		isLoading: false,
	})

	private readonly loadQueue: AsyncTaskQueue

	/**
	 * Creates a MultiDurationLoaderImpl instance.
	 * @param loader The AudioDurationLoader used to load durations for entries.
	 */
	constructor(private readonly loader: AudioDurationLoader) {
		this.loadQueue = new AsyncTaskQueue()
	}

	/**
	 * Readonly subscribable emitting current metadata and loading status updates.
	 */
	get metadataLoadState(): StickySubscribable<MetadataLoadState> {
		return SubscribableUtil.hideStickyEmitter(this._metadataStateBus)
	}

	/**
	 * Replace the current entries and start loading their metadata asynchronously.
	 * Clears previous results and queues.
	 * @param entries The PlayerEntry array to set and load
	 */
	readonly setEntries = (entries: PlayerEntry[]): void => {
		this.entries = [...entries]
		this.results = this.entries.map(() => null)
		this.loadQueue.clear()

		this.emitState()

		void this.runEntriesLoading(this.entries)
	}

	/**
	 * Reload metadata for the entry at the given index.
	 * The reload task is enqueued and state updated accordingly.
	 * @param index The index of the entry to reload
	 */
	readonly reloadEntry = (index: number): void => {
		if (index < 0 || index >= this.entries.length) return

		const entry = this.entries[index]
		if (!entry) return

		this.loadQueue
			.enqueue(async () => {
				if (
					this.entries.length <= index ||
					this.entries[index] !== entry
				)
					return
				const res = await this.loadEntry(entry)
				if (
					this.entries.length <= index ||
					this.entries[index] !== entry
				)
					return
				this.results[index] = res
				this.emitState()
			})
			.catch(() => {
				// TODO: log error, should never happen
			})

		this.emitState()
		this.addIdleHandler()
	}

	/**
	 * Returns a promise that resolves when all current loading tasks complete,
	 * indicating the loader has become idle.
	 */
	readonly idlePromise = (): Promise<void> => {
		return this.loadQueue.idlePromise()
	}

	/**
	 * Internal helper to add a handler that emits new state once the load queue is idle.
	 */
	private addIdleHandler = () => {
		void this.loadQueue.idlePromise().then(() => {
			this.emitState()
		})
	}

	/**
	 * Starts asynchronous loading tasks for each entry in the specified array,
	 * enqueuing them to the internal AsyncTaskQueue.
	 * @param entries Array of PlayerEntry for which to load metadata
	 */
	private runEntriesLoading = async (entries: PlayerEntry[]) => {
		for (let i = 0; i < entries.length; i++) {
			const index = i

			this.loadQueue
				.enqueue(async () => {
					if (this.entries !== entries) return
					this.emitState()
					const entry = entries[index]
					if (!entry) return
					const res = await this.loadEntry(entry)
					if (this.entries !== entries) return
					this.results[index] = res
					this.emitState()
				})
				.catch(() => {
					// TODO: log error, should never happen
				})
		}

		this.emitState()
		this.addIdleHandler()
	}

	private readonly loadEntry = async (
		e: PlayerEntry,
	): Promise<MetadataLoadingResult> => {
		try {
			const duration = await this.loader.loadDuration(e)
			return {
				type: MetadataLoadingResultType.OK,
				duration,
			}
		} catch (err) {
			return {
				type: MetadataLoadingResultType.ERROR,
				error: err,
			}
		}
	}

	private emitState = () => {
		const isLoading =
			this.loadQueue.queueLength > 0 || this.loadQueue.isRunning

		this._metadataStateBus.emitEvent({
			metadataBag: new MetadataBag(this.results),
			isLoading,
		})
	}
}
