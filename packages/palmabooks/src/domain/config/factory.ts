import { ConfigBuilder, ConfigStorage, JotaiStore } from "@teawithsand/fstate"
import { RwLockAdapter, RwLockAdapterMap } from "@teawithsand/lngext"
import { AppConfigSerializers } from "./serializers"
import { AppConfig } from "./types"

export const createAppConfig = ({
	storage,
	globalLock,
	keyLockMap,
	store,
}: {
	storage: ConfigStorage
	globalLock: RwLockAdapter
	keyLockMap: RwLockAdapterMap
	store: JotaiStore
}) => {
	return ConfigBuilder.create<AppConfig>()
		.addField("language", "en", AppConfigSerializers.language)
		.setStorageKeyTransform((k) => `pcfg-1/${k}`)
		.setLockKeyTransform((k) => `palmabooks/config/value/${k}`)
		.setGlobalLock(globalLock)
		.setRwLockAdapterMap(keyLockMap)
		.build({
			store,
			storage,
		})
}
