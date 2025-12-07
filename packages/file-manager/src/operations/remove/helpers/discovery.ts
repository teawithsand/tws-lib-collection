import { FsDirHandle, FsHandle, FsHandleType, Path } from "@teawithsand/fstate"

export interface DiscoveryQueueItem {
	handle: FsHandle
	relativePath: Path
}

export interface DiscoveryResult {
	handle: FsHandle
	relativePath: Path
}

export const getDirectoryChildren = async (
	dirHandle: FsDirHandle,
	parentPath: Path,
): Promise<DiscoveryQueueItem[]> => {
	const stat = await dirHandle.stat()
	if (!stat.exists) {
		return []
	}

	return stat.entries.map((entry) => ({
		handle: entry,
		relativePath: parentPath.concat(Path.fromSegment(entry.name)),
	}))
}

export const discoverHandle = async (
	handle: FsHandle,
	relativePath: Path,
	results: DiscoveryResult[],
	checkInterruption: () => void,
	incrementDiscoveredFiles: () => void,
	incrementDiscoveredDirs: () => void,
): Promise<void> => {
	const queue: DiscoveryQueueItem[] = [{ handle, relativePath }]

	while (queue.length > 0) {
		checkInterruption()

		const item = queue.shift()!
		results.push(item)

		if (item.handle.type === FsHandleType.FILE) {
			incrementDiscoveredFiles()
		} else if (item.handle.type === FsHandleType.DIR) {
			incrementDiscoveredDirs()
			const children = await getDirectoryChildren(
				item.handle as FsDirHandle,
				item.relativePath,
			)
			queue.push(...children)
		}
	}
}
