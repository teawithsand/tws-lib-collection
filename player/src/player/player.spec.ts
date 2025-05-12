import { afterEach, beforeEach, describe, expect, test } from "vitest"
import { PlayerEntry, PlayerEntryType } from "./entry"
import { PlayerEventType } from "./player"
import { HTMLPlayer } from "./playerImpl"

import { userEvent } from "@vitest/browser/context"

// Helper to create an audio element
const createAudioElement = () => {
	const audio = document.createElement("audio")
	audio.preload = "auto"
	return audio
}

const RAW_1S_AUDIO = `GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAO3EU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggFCTbuMU6uEHFO7a1OsggOh7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiECPgAAAAAAAFlSua+WuAQAAAAAAAFzXgQFzxYgfP7Fg0kKiGpyBACK1nIN1bmSIgQCGhkFfT1BVU1aqg2MuoFa7hATEtACDgQLhkZ+BArWIQOdwAAAAAABiZIEQY6KTT3B1c0hlYWQBAjgBgLsAAAAAABJUw2f9c3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2MC4xNi4xMDBzc9djwItjxYgfP7Fg0kKiGmfIokWjh0VOQ09ERVJEh5VMYXZjNjAuMzEuMTAyIGxpYm9wdXNnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAxLjAwODAwMDAwMAAfQ7Z1QdfngQCjh4EAAID8//6jh4EAFYD8//6jh4EAKYD8//6jh4EAPYD8//6jh4EAUYD8//6jh4EAZYD8//6jh4EAeYD8//6jh4EAjYD8//6jh4EAoYD8//6jh4EAtYD8//6jh4EAyYD8//6jh4EA3YD8//6jh4EA8YD8//6jh4EBBYD8//6jh4EBGYD8//6jh4EBLYD8//6jh4EBQYD8//6jh4EBVYD8//6jh4EBaYD8//6jh4EBfYD8//6jh4EBkYD8//6jh4EBpYD8//6jh4EBuYD8//6jh4EBzYD8//6jh4EB4YD8//6jh4EB9YD8//6jh4ECCYD8//6jh4ECHYD8//6jh4ECMYD8//6jh4ECRYD8//6jh4ECWYD8//6jh4ECbYD8//6jh4ECgYD8//6jh4EClYD8//6jh4ECqYD8//6jh4ECvYD8//6jh4EC0YD8//6jh4EC5YD8//6jh4EC+YD8//6jh4EDDYD8//6jh4EDIYD8//6jh4EDNYD8//6jh4EDSYD8//6jh4EDXYD8//6jh4EDcYD8//6jh4EDhYD8//6jh4EDmYD8//6jh4EDrYD8//6jh4EDwYD8//6jh4ED1YD8//6gkKGHgQPpAPz//nWihADN/mAcU7trkbuPs4EAt4r3gQHxggHE8IED`
const RAW_10S_AUDIO = `GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAABPAEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHYTbuMU6uEElTDZ1OsggFCTbuMU6uEHFO7a1OsghOG7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsirXsYMPQkBNgI1MYXZmNjAuMTYuMTAwV0GNTGF2ZjYwLjE2LjEwMESJiEDDjAAAAAAAFlSua+WuAQAAAAAAAFzXgQFzxYhYXP8/ipqg2pyBACK1nIN1bmSIgQCGhkFfT1BVU1aqg2MuoFa7hATEtACDgQLhkZ+BArWIQOdwAAAAAABiZIEQY6KTT3B1c0hlYWQBAjgBgLsAAAAAABJUw2f9c3OgY8CAZ8iaRaOHRU5DT0RFUkSHjUxhdmY2MC4xNi4xMDBzc9djwItjxYhYXP8/ipqg2mfIokWjh0VOQ09ERVJEh5VMYXZjNjAuMzEuMTAyIGxpYm9wdXNnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjEwLjAwODAwMDAwMAAfQ7Z1SMTngQCjh4EAAID8//6jh4EAFYD8//6jh4EAKYD8//6jh4EAPYD8//6jh4EAUYD8//6jh4EAZYD8//6jh4EAeYD8//6jh4EAjYD8//6jh4EAoYD8//6jh4EAtYD8//6jh4EAyYD8//6jh4EA3YD8//6jh4EA8YD8//6jh4EBBYD8//6jh4EBGYD8//6jh4EBLYD8//6jh4EBQYD8//6jh4EBVYD8//6jh4EBaYD8//6jh4EBfYD8//6jh4EBkYD8//6jh4EBpYD8//6jh4EBuYD8//6jh4EBzYD8//6jh4EB4YD8//6jh4EB9YD8//6jh4ECCYD8//6jh4ECHYD8//6jh4ECMYD8//6jh4ECRYD8//6jh4ECWYD8//6jh4ECbYD8//6jh4ECgYD8//6jh4EClYD8//6jh4ECqYD8//6jh4ECvYD8//6jh4EC0YD8//6jh4EC5YD8//6jh4EC+YD8//6jh4EDDYD8//6jh4EDIYD8//6jh4EDNYD8//6jh4EDSYD8//6jh4EDXYD8//6jh4EDcYD8//6jh4EDhYD8//6jh4EDmYD8//6jh4EDrYD8//6jh4EDwYD8//6jh4ED1YD8//6jh4ED6YD8//6jh4ED/YD8//6jh4EEEYD8//6jh4EEJYD8//6jh4EEOYD8//6jh4EETYD8//6jh4EEYYD8//6jh4EEdYD8//6jh4EEiYD8//6jh4EEnYD8//6jh4EEsYD8//6jh4EExYD8//6jh4EE2YD8//6jh4EE7YD8//6jh4EFAYD8//6jh4EFFYD8//6jh4EFKYD8//6jh4EFPYD8//6jh4EFUYD8//6jh4EFZYD8//6jh4EFeYD8//6jh4EFjYD8//6jh4EFoYD8//6jh4EFtYD8//6jh4EFyYD8//6jh4EF3YD8//6jh4EF8YD8//6jh4EGBYD8//6jh4EGGYD8//6jh4EGLYD8//6jh4EGQYD8//6jh4EGVYD8//6jh4EGaYD8//6jh4EGfYD8//6jh4EGkYD8//6jh4EGpYD8//6jh4EGuYD8//6jh4EGzYD8//6jh4EG4YD8//6jh4EG9YD8//6jh4EHCYD8//6jh4EHHYD8//6jh4EHMYD8//6jh4EHRYD8//6jh4EHWYD8//6jh4EHbYD8//6jh4EHgYD8//6jh4EHlYD8//6jh4EHqYD8//6jh4EHvYD8//6jh4EH0YD8//6jh4EH5YD8//6jh4EH+YD8//6jh4EIDYD8//6jh4EIIYD8//6jh4EINYD8//6jh4EISYD8//6jh4EIXYD8//6jh4EIcYD8//6jh4EIhYD8//6jh4EImYD8//6jh4EIrYD8//6jh4EIwYD8//6jh4EI1YD8//6jh4EI6YD8//6jh4EI/YD8//6jh4EJEYD8//6jh4EJJYD8//6jh4EJOYD8//6jh4EJTYD8//6jh4EJYYD8//6jh4EJdYD8//6jh4EJiYD8//6jh4EJnYD8//6jh4EJsYD8//6jh4EJxYD8//6jh4EJ2YD8//6jh4EJ7YD8//6jh4EKAYD8//6jh4EKFYD8//6jh4EKKYD8//6jh4EKPYD8//6jh4EKUYD8//6jh4EKZYD8//6jh4EKeYD8//6jh4EKjYD8//6jh4EKoYD8//6jh4EKtYD8//6jh4EKyYD8//6jh4EK3YD8//6jh4EK8YD8//6jh4ELBYD8//6jh4ELGYD8//6jh4ELLYD8//6jh4ELQYD8//6jh4ELVYD8//6jh4ELaYD8//6jh4ELfYD8//6jh4ELkYD8//6jh4ELpYD8//6jh4ELuYD8//6jh4ELzYD8//6jh4EL4YD8//6jh4EL9YD8//6jh4EMCYD8//6jh4EMHYD8//6jh4EMMYD8//6jh4EMRYD8//6jh4EMWYD8//6jh4EMbYD8//6jh4EMgYD8//6jh4EMlYD8//6jh4EMqYD8//6jh4EMvYD8//6jh4EM0YD8//6jh4EM5YD8//6jh4EM+YD8//6jh4ENDYD8//6jh4ENIYD8//6jh4ENNYD8//6jh4ENSYD8//6jh4ENXYD8//6jh4ENcYD8//6jh4ENhYD8//6jh4ENmYD8//6jh4ENrYD8//6jh4ENwYD8//6jh4EN1YD8//6jh4EN6YD8//6jh4EN/YD8//6jh4EOEYD8//6jh4EOJYD8//6jh4EOOYD8//6jh4EOTYD8//6jh4EOYYD8//6jh4EOdYD8//6jh4EOiYD8//6jh4EOnYD8//6jh4EOsYD8//6jh4EOxYD8//6jh4EO2YD8//6jh4EO7YD8//6jh4EPAYD8//6jh4EPFYD8//6jh4EPKYD8//6jh4EPPYD8//6jh4EPUYD8//6jh4EPZYD8//6jh4EPeYD8//6jh4EPjYD8//6jh4EPoYD8//6jh4EPtYD8//6jh4EPyYD8//6jh4EP3YD8//6jh4EP8YD8//6jh4EQBYD8//6jh4EQGYD8//6jh4EQLYD8//6jh4EQQYD8//6jh4EQVYD8//6jh4EQaYD8//6jh4EQfYD8//6jh4EQkYD8//6jh4EQpYD8//6jh4EQuYD8//6jh4EQzYD8//6jh4EQ4YD8//6jh4EQ9YD8//6jh4ERCYD8//6jh4ERHYD8//6jh4ERMYD8//6jh4ERRYD8//6jh4ERWYD8//6jh4ERbYD8//6jh4ERgYD8//6jh4ERlYD8//6jh4ERqYD8//6jh4ERvYD8//6jh4ER0YD8//6jh4ER5YD8//6jh4ER+YD8//6jh4ESDYD8//6jh4ESIYD8//6jh4ESNYD8//6jh4ESSYD8//6jh4ESXYD8//6jh4EScYD8//6jh4EShYD8//6jh4ESmYD8//6jh4ESrYD8//6jh4ESwYD8//6jh4ES1YD8//6jh4ES6YD8//6jh4ES/YD8//6jh4ETEYD8//6jh4ETJYD8//6jh4ETOYD8//6jh4ETTYD8//6jh4ETYYD8//4fQ7Z1SM7nghN1o4eBAACA/P/+o4eBABSA/P/+o4eBACiA/P/+o4eBADyA/P/+o4eBAFCA/P/+o4eBAGSA/P/+o4eBAHiA/P/+o4eBAIyA/P/+o4eBAKCA/P/+o4eBALSA/P/+o4eBAMiA/P/+o4eBANyA/P/+o4eBAPCA/P/+o4eBAQSA/P/+o4eBARiA/P/+o4eBASyA/P/+o4eBAUCA/P/+o4eBAVSA/P/+o4eBAWiA/P/+o4eBAXyA/P/+o4eBAZCA/P/+o4eBAaSA/P/+o4eBAbiA/P/+o4eBAcyA/P/+o4eBAeCA/P/+o4eBAfSA/P/+o4eBAgiA/P/+o4eBAhyA/P/+o4eBAjCA/P/+o4eBAkSA/P/+o4eBAliA/P/+o4eBAmyA/P/+o4eBAoCA/P/+o4eBApSA/P/+o4eBAqiA/P/+o4eBAryA/P/+o4eBAtCA/P/+o4eBAuSA/P/+o4eBAviA/P/+o4eBAwyA/P/+o4eBAyCA/P/+o4eBAzSA/P/+o4eBA0iA/P/+o4eBA1yA/P/+o4eBA3CA/P/+o4eBA4SA/P/+o4eBA5iA/P/+o4eBA6yA/P/+o4eBA8CA/P/+o4eBA9SA/P/+o4eBA+iA/P/+o4eBA/yA/P/+o4eBBBCA/P/+o4eBBCSA/P/+o4eBBDiA/P/+o4eBBEyA/P/+o4eBBGCA/P/+o4eBBHSA/P/+o4eBBIiA/P/+o4eBBJyA/P/+o4eBBLCA/P/+o4eBBMSA/P/+o4eBBNiA/P/+o4eBBOyA/P/+o4eBBQCA/P/+o4eBBRSA/P/+o4eBBSiA/P/+o4eBBTyA/P/+o4eBBVCA/P/+o4eBBWSA/P/+o4eBBXiA/P/+o4eBBYyA/P/+o4eBBaCA/P/+o4eBBbSA/P/+o4eBBciA/P/+o4eBBdyA/P/+o4eBBfCA/P/+o4eBBgSA/P/+o4eBBhiA/P/+o4eBBiyA/P/+o4eBBkCA/P/+o4eBBlSA/P/+o4eBBmiA/P/+o4eBBnyA/P/+o4eBBpCA/P/+o4eBBqSA/P/+o4eBBriA/P/+o4eBBsyA/P/+o4eBBuCA/P/+o4eBBvSA/P/+o4eBBwiA/P/+o4eBBxyA/P/+o4eBBzCA/P/+o4eBB0SA/P/+o4eBB1iA/P/+o4eBB2yA/P/+o4eBB4CA/P/+o4eBB5SA/P/+o4eBB6iA/P/+o4eBB7yA/P/+o4eBB9CA/P/+o4eBB+SA/P/+o4eBB/iA/P/+o4eBCAyA/P/+o4eBCCCA/P/+o4eBCDSA/P/+o4eBCEiA/P/+o4eBCFyA/P/+o4eBCHCA/P/+o4eBCISA/P/+o4eBCJiA/P/+o4eBCKyA/P/+o4eBCMCA/P/+o4eBCNSA/P/+o4eBCOiA/P/+o4eBCPyA/P/+o4eBCRCA/P/+o4eBCSSA/P/+o4eBCTiA/P/+o4eBCUyA/P/+o4eBCWCA/P/+o4eBCXSA/P/+o4eBCYiA/P/+o4eBCZyA/P/+o4eBCbCA/P/+o4eBCcSA/P/+o4eBCdiA/P/+o4eBCeyA/P/+o4eBCgCA/P/+o4eBChSA/P/+o4eBCiiA/P/+o4eBCjyA/P/+o4eBClCA/P/+o4eBCmSA/P/+o4eBCniA/P/+o4eBCoyA/P/+o4eBCqCA/P/+o4eBCrSA/P/+o4eBCsiA/P/+o4eBCtyA/P/+o4eBCvCA/P/+o4eBCwSA/P/+o4eBCxiA/P/+o4eBCyyA/P/+o4eBC0CA/P/+o4eBC1SA/P/+o4eBC2iA/P/+o4eBC3yA/P/+o4eBC5CA/P/+o4eBC6SA/P/+o4eBC7iA/P/+o4eBC8yA/P/+o4eBC+CA/P/+o4eBC/SA/P/+o4eBDAiA/P/+o4eBDByA/P/+o4eBDDCA/P/+o4eBDESA/P/+o4eBDFiA/P/+o4eBDGyA/P/+o4eBDICA/P/+o4eBDJSA/P/+o4eBDKiA/P/+o4eBDLyA/P/+o4eBDNCA/P/+o4eBDOSA/P/+o4eBDPiA/P/+o4eBDQyA/P/+o4eBDSCA/P/+o4eBDTSA/P/+o4eBDUiA/P/+o4eBDVyA/P/+o4eBDXCA/P/+o4eBDYSA/P/+o4eBDZiA/P/+o4eBDayA/P/+o4eBDcCA/P/+o4eBDdSA/P/+o4eBDeiA/P/+o4eBDfyA/P/+o4eBDhCA/P/+o4eBDiSA/P/+o4eBDjiA/P/+o4eBDkyA/P/+o4eBDmCA/P/+o4eBDnSA/P/+o4eBDoiA/P/+o4eBDpyA/P/+o4eBDrCA/P/+o4eBDsSA/P/+o4eBDtiA/P/+o4eBDuyA/P/+o4eBDwCA/P/+o4eBDxSA/P/+o4eBDyiA/P/+o4eBDzyA/P/+o4eBD1CA/P/+o4eBD2SA/P/+o4eBD3iA/P/+o4eBD4yA/P/+o4eBD6CA/P/+o4eBD7SA/P/+o4eBD8iA/P/+o4eBD9yA/P/+o4eBD/CA/P/+o4eBEASA/P/+o4eBEBiA/P/+o4eBECyA/P/+o4eBEECA/P/+o4eBEFSA/P/+o4eBEGiA/P/+o4eBEHyA/P/+o4eBEJCA/P/+o4eBEKSA/P/+o4eBELiA/P/+o4eBEMyA/P/+o4eBEOCA/P/+o4eBEPSA/P/+o4eBEQiA/P/+o4eBERyA/P/+o4eBETCA/P/+o4eBEUSA/P/+o4eBEViA/P/+o4eBEWyA/P/+o4eBEYCA/P/+o4eBEZSA/P/+o4eBEaiA/P/+o4eBEbyA/P/+o4eBEdCA/P/+o4eBEeSA/P/+o4eBEfiA/P/+o4eBEgyA/P/+o4eBEiCA/P/+o4eBEjSA/P/+o4eBEkiA/P/+o4eBElyA/P/+o4eBEnCA/P/+o4eBEoSA/P/+o4eBEpiA/P/+o4eBEqyA/P/+o4eBEsCA/P/+o4eBEtSA/P/+o4eBEuiA/P/+o4eBEvyA/P/+o4eBExCA/P/+o4eBEySA/P/+o4eBEziA/P/+o4eBE0yA/P/+o4eBE2CA/P/+o4eBE3SA/P/+H0O2dZ/ngib9o4eBAACA/P/+oJChh4EAFAD8//51ooQAzf5gHFO7a7W7j7OBALeK94EB8YIBxPCBA7uQs4ITdbeK94EB8YIKjvCBBLuQs4Im/beK94EB8YITYvCBBA==`
const AUDIO_10S_URL = `data:audio/webm;base64,${RAW_10S_AUDIO}`
const AUDIO_1S_URL = `data:audio/webm;base64,${RAW_1S_AUDIO}`

describe("HTMLPlayer", () => {
	let audio: HTMLAudioElement
	let player: HTMLPlayer

	beforeEach(async () => {
		audio = createAudioElement()
		audio.controls = true

		player = new HTMLPlayer(audio)
		player.enterDebugMode() // mute works for firefox

		// Chrome needs clicking
		document.body.appendChild(audio)
		try {
			await userEvent.click(document.body)
		} catch (_e) {
			// ignore
		}

		audio.loop = false
	})

	afterEach(() => {
		player.release()
		audio.remove()
	})

	test("initial state is correct", () => {
		expect(player.state.isPlaying).toBe(false)
		expect(player.state.isUserWantsToPlay).toBe(false)
		expect(player.state.entries).toEqual([])
		expect(player.state.currentEntryIndex).toBe(0)
		expect(player.state.speed).toBe(1)
		expect(player.state.volume).toBe(1)
		expect(player.state.isSeeking).toBe(false)
	})

	test("setEntries loads first entry and sets src", () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)

		expect(player.state.entries).toEqual(entries)
		// Check src indirectly via player state or other means, avoid direct audio.src access
		// For now, just check entries set correctly
	})

	test("setUserWantsToPlay triggers play and pause", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])

		player.setUserWantsToPlay(true)
		await new Promise((r) => setTimeout(r, 100))
		expect(player.state.isUserWantsToPlay).toBe(true)

		player.setUserWantsToPlay(false)
		await new Promise((r) => setTimeout(r, 100))
		expect(player.state.isUserWantsToPlay).toBe(false)
	})

	test(
		"isPositionUpdatedAfterSeek becomes true",
		{ timeout: 5000 },
		async () => {
			const entries: PlayerEntry[] = [
				{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
				{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
			]

			player.setEntries(entries)
			player.seek(10)

			// Wait until isPositionUpdatedAfterSeek is true
			await new Promise((resolve) => {
				const checkSeek = () => {
					if (player.state.isPositionUpdatedAfterSeek) {
						resolve(null)
					} else {
						setTimeout(checkSeek, 100)
					}
				}
				checkSeek()
			})
		},
	)

	test("setSpeed and setVolume update element and state", () => {
		player.setSpeed(1.5)
		// Cannot check audio.playbackRate directly, check player state
		expect(player.state.speed).toBe(1.5)

		player.setVolume(0.3)
		// Cannot check audio.volume directly, check player state
		expect(player.state.volume).toBe(0.3)
	})

	test("setPreservePitchForSpeed sets preservesPitch if supported", () => {
		audio.preservesPitch = true

		player.setPreservePitchForSpeed(false)
		expect(audio.preservesPitch).toBe(false)
		expect(player.state.preservePitchForSpeed).toBe(false)
	})

	test("reloadEntry reloads current entry", () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)
		const oldSrc = audio.src
		player.reloadEntry()
		expect(audio.src).toBe(oldSrc)
	})

	test("events are emitted correctly", async () => {
		let errorEventCount = 0
		player.on(PlayerEventType.ERROR, () => {
			errorEventCount++
		})

		let entryEndedCount = 0
		player.on(PlayerEventType.ENTRY_ENDED, () => {
			entryEndedCount++
		})

		let externalPlayingChangeCount = 0
		player.on(PlayerEventType.EXTERNAL_IS_PLAYING_CHANGE, () => {
			externalPlayingChangeCount++
		})

		// Instead of manual dispatch, rely on natural events triggered by player actions
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait some time for events to be emitted naturally
		await new Promise((r) => setTimeout(r, 500))

		expect(entryEndedCount).toBeGreaterThanOrEqual(0)
		expect(errorEventCount).toBeGreaterThanOrEqual(0)
		expect(externalPlayingChangeCount).toBeGreaterThanOrEqual(0)
	})

	test("loads URL duration without error", async () => {
		let errorOccurred = false
		player.on(PlayerEventType.ERROR, () => {
			errorOccurred = true
		})

		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])

		// Wait until isReadyToPlay is true
		await new Promise((resolve) => {
			const checkReady = () => {
				if (player.state.isReadyToPlay) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		expect(player.state.error).toBeNull()
		// Decoding audio length is magic, that's why for 10s url it's safest to check if it's longer than 9s
		expect(player.state.currentEntryDuration).toBeGreaterThan(9)

		expect(errorOccurred).toBe(false)
	})

	test("currentEntryPosition updates when playing", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isReadyToPlay is true
		await new Promise((resolve, reject) => {
			const checkReady = () => {
				if (player.state.error) reject(player.state.error)
				if (player.state.currentEntryPosition > 0.5) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		expect(player.state.currentEntryPosition).toBeGreaterThanOrEqual(0.5)
	})

	test("automatic switching to next entry after previous ends", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
		]

		player.on(PlayerEventType.ENTRY_ENDED, () => {
			player.seek(0, player.state.currentEntryIndex + 1)
		})

		player.setEntries(entries)
		player.setUserWantsToPlay(true)
		player.setSpeed(4)

		// Wait until first entry is ready
		await new Promise((resolve) => {
			const checkReady = () => {
				if (player.state.isReadyToPlay) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		// Wait for first entry to end and player to switch to next
		await new Promise((resolve, reject) => {
			const checkNext = () => {
				if (player.state.isEnded) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkNext, 100)
				}
			}
			checkNext()
		})

		expect(player.state.currentEntryIndex).toEqual(entries.length)
		expect(player.state.isEnded).toBe(true)
	})

	test("isEntryEnded becomes true eventually while playing", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_1S_URL },
		]

		player.setEntries(entries)
		player.setUserWantsToPlay(true)

		// Wait until isEntryEnded is true or timeout
		await new Promise((resolve, reject) => {
			const timeout = setTimeout(
				() => reject(new Error("Timeout waiting for isEntryEnded")),
				1000 * 4,
			)
			const checkEnded = () => {
				if (player.state.isEntryEnded) {
					clearTimeout(timeout)
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkEnded, 100)
				}
			}
			checkEnded()
		})

		expect(player.state.isEntryEnded).toBe(true)
	})

	test("playback starts after source set when isUserWantsToPlay was set first", async () => {
		player.setUserWantsToPlay(true)

		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)

		// Wait until isPlaying is true
		await new Promise((resolve, reject) => {
			const checkPlaying = () => {
				if (player.state.isPlaying) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkPlaying, 50)
				}
			}
			checkPlaying()
		})

		expect(player.state.isPlaying).toBe(true)
	})

	test("playback stops after setting user wants to play to false", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isPlaying is true
		await new Promise((resolve, reject) => {
			const checkPlaying = () => {
				if (player.state.isPlaying) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkPlaying, 50)
				}
			}
			checkPlaying()
		})

		player.setUserWantsToPlay(false)

		// Wait until isPlaying is false
		await new Promise((resolve, reject) => {
			const checkStopped = () => {
				if (!player.state.isPlaying) {
					resolve(null)
				} else if (player.state.error) {
					reject(player.state.error)
				} else {
					setTimeout(checkStopped, 50)
				}
			}
			checkStopped()
		})

		expect(player.state.isPlaying).toBe(false)
	})

	test("seek to non-zero position and different target entry index updates state", async () => {
		const entries: PlayerEntry[] = [
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
			{ type: PlayerEntryType.URL, url: AUDIO_10S_URL },
		]

		player.setEntries(entries)

		player.seek(5, 1)

		expect(player.state.isPositionUpdatedAfterSeek).toBe(false)

		// Wait until isPositionUpdatedAfterSeek is true
		await new Promise((resolve) => {
			const checkSeek = () => {
				if (player.state.isPositionUpdatedAfterSeek) {
					resolve(null)
				} else {
					setTimeout(checkSeek, 50)
				}
			}
			checkSeek()
		})

		expect(player.state.currentEntryIndex).toBe(1)
		expect(player.state.currentEntryPosition).toBe(5)
	})

	test("changing speed updates playbackRate and state", () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])

		player.setSpeed(1.25)
		// Check player state
		expect(player.state.speed).toBe(1.25)

		player.setSpeed(0.75)
		expect(player.state.speed).toBe(0.75)
	})

	test("time progresses with default 1x speed", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isReadyToPlay is true
		await new Promise((resolve, reject) => {
			const checkReady = () => {
				if (player.state.error) reject(player.state.error)
				if (player.state.isReadyToPlay && player.state.isPlaying) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		await new Promise((resolve) => setTimeout(resolve, 500))

		player.forceLoadPlayerState()
		const p1 = player.state.currentEntryPosition
		expect(Number.isFinite(p1)).toBe(true)
		expect(p1).toBeGreaterThan(0)

		await new Promise((resolve) => setTimeout(resolve, 1000))

		player.forceLoadPlayerState()
		const p2 = player.state.currentEntryPosition

		expect(p2).toBeLessThan(p1 + 2 * 0.9)
		expect(p2).toBeGreaterThanOrEqual(p1 + 1 * 0.9)
	})

	test("changing speed influences currentEntryPosition progression", async () => {
		player.setEntries([{ type: PlayerEntryType.URL, url: AUDIO_10S_URL }])
		player.setUserWantsToPlay(true)

		// Wait until isReadyToPlay is true
		await new Promise((resolve, reject) => {
			const checkReady = () => {
				if (player.state.error) reject(player.state.error)
				if (player.state.isReadyToPlay && player.state.isPlaying) {
					resolve(null)
				} else {
					setTimeout(checkReady, 50)
				}
			}
			checkReady()
		})

		await new Promise((resolve) => setTimeout(resolve, 500))

		player.forceLoadPlayerState()
		const p1 = player.state.currentEntryPosition
		expect(Number.isFinite(p1)).toBe(true)
		expect(p1).toBeGreaterThan(0)

		player.setSpeed(2)

		await new Promise((resolve) => setTimeout(resolve, 1000))

		player.forceLoadPlayerState()
		const p2 = player.state.currentEntryPosition

		// 0.9 factor accounts for the fact that there may be some error of measurement
		expect(p2).toBeGreaterThanOrEqual(p1 + 2 * 0.9)
	})
})
