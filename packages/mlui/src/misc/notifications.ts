import { notifications } from "@mantine/notifications"

/**
 * Hook that provides access to Mantine notifications system.
 *
 * @returns The Mantine notifications object containing methods for showing, updating,
 * and managing notifications (show, update, hide, clean, cleanQueue).
 *
 * @example
 * ```typescript
 * const notifications = useMantineNotifications();
 * notifications.show({
 *   title: 'Success',
 *   message: 'Operation completed successfully',
 *   color: 'green'
 * });
 * ```
 */
export const useMantineNotifications = () => {
	return notifications
}
