import { AbookStoreService } from "@/domain"
import { AppTranslation, AppTransPicker } from "@/trans/appTranslation"
import {
	AbookAggregatorImpl,
	AbookEntryAggregatorImpl,
	AbookStore,
	FsAbookStore,
	FsAbookStoreAbookDataSerializer,
	FsAbookStoreAbookEntryDataSerializer,
	InMemoryAbookStore,
} from "@teawithsand/booklibr"
import { createStore, JotaiStore, OpfsFs, Path } from "@teawithsand/fstate"
import { Logger } from "@teawithsand/llog"
import { DIBuilder, ReleaseHelper } from "@teawithsand/lngext"
import {
	AppBarNavigationButtonType,
	AppBarService,
	TransService,
} from "@teawithsand/mlui"
import {
	JsonEncoder,
	SerializerUtil,
	TextBufferEncoder,
} from "@teawithsand/reserd"
import { LIB_LOGGER } from "../internal/log"

export enum DiConfigDbType {
	OPFS = "opfs",
	IN_MEMORY = "inMemory",
}

export type AppDiContents = {
	logger: Logger
	atomStore: JotaiStore
	config: DiConfig

	releaseHelper: ReleaseHelper

	translationService: TransService<AppTranslation>
	appBarService: AppBarService

	abookStore: AbookStore
	abookStoreService: AbookStoreService
}

export type DiConfig = {
	dbType: DiConfigDbType
	throwFromRelease?: boolean
	backendBaseUrl?: string
}

const addr = "/"

export class AppDi {
	private constructor() {}

	public static readonly DI_TEST_CONFIG: DiConfig = {
		dbType: DiConfigDbType.IN_MEMORY,
		throwFromRelease: true,
		backendBaseUrl: addr,
	}

	public static readonly DI_PROD_CONFIG: DiConfig = {
		dbType: DiConfigDbType.OPFS,
		backendBaseUrl: addr,
	}

	public static readonly makeDiBuilder = (config: DiConfig) =>
		DIBuilder.create<AppDiContents>()
			.setValue("config", config)
			.setValue("logger", LIB_LOGGER)
			.setValue("atomStore", createStore())
			.setValue(
				"translationService",
				new TransService<AppTranslation>({
					transPicker: AppTransPicker,
				}),
			)
			.setValue(
				"appBarService",
				new AppBarService({
					title: "",
					actions: [],
					drawerItems: [],
					drawerTitle: "",
					drawerIcon: "",
					moreActions: [],
					navigationConfig: {
						buttonType: AppBarNavigationButtonType.DRAWER,
					},
				}),
			)
			.setFactory("releaseHelper", async () => new ReleaseHelper())
			.setFactory("abookStore", async () => {
				const abookAggregator = AbookAggregatorImpl.create()
				const abookEntryAggregator = AbookEntryAggregatorImpl.create()

				if (config.dbType === DiConfigDbType.IN_MEMORY) {
					return new InMemoryAbookStore({
						abookAggregator,
						abookEntryAggregator,
					})
				} else {
					// OPFS filesystem
					const opfsRoot = await navigator.storage.getDirectory()
					const fs = new OpfsFs(opfsRoot)
					const opfsRootDir = await fs.getRootDir()

					const abooksRootDir = await opfsRootDir.openDir(
						Path.fromSegment("abooks"),
						{
							create: true,
						},
					)

					const abookSerializer = SerializerUtil.compose(
						FsAbookStoreAbookDataSerializer,
						SerializerUtil.compose(
							SerializerUtil.encoderToSerializer(
								new JsonEncoder(),
							),
							SerializerUtil.encoderToSerializer(
								new TextBufferEncoder(),
							),
						),
					)

					const abookEntrySerializer = SerializerUtil.compose(
						FsAbookStoreAbookEntryDataSerializer,
						SerializerUtil.compose(
							SerializerUtil.encoderToSerializer(
								new JsonEncoder(),
							),
							SerializerUtil.encoderToSerializer(
								new TextBufferEncoder(),
							),
						),
					)

					return new FsAbookStore({
						root: abooksRootDir,
						abookSerializer,
						abookEntrySerializer,
						abookAggregator,
						abookEntryAggregator,
					})
				}
			})
			.setFactory("abookStoreService", async (di) => {
				const abookStore = di.get("abookStore")
				return new AbookStoreService({ abookStore })
			})
}
