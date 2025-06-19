import { AppCardData } from "../../../mintay/card/card"
import { CardFormData } from "./cardFormClass"

export class CardFormUtils {
	private constructor() {}

	/**
	 * Converts AppCardData to CardFormData for form editing
	 */
	public static readonly appCardDataToFormData = (
		cardData: AppCardData,
	): CardFormData => ({
		globalId: cardData.globalId,
		questionContent: cardData.questionContent,
		answerContent: cardData.answerContent,
		discoveryPriority: cardData.discoveryPriority,
	})

	/**
	 * Converts CardFormData to AppCardData, preserving timestamps
	 */
	public static readonly formDataToAppCardData = (
		formData: CardFormData,
		existingCardData?: Partial<AppCardData>,
	): AppCardData => {
		const now = Date.now()

		return {
			globalId: formData.globalId,
			questionContent: formData.questionContent,
			answerContent: formData.answerContent,
			discoveryPriority: formData.discoveryPriority,
			createdAt: existingCardData?.createdAt ?? now,
			updatedAt: now,
		}
	}
}
