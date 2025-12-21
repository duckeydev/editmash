import { eq, and, desc } from "drizzle-orm";
import { db, lobbies, lobbyPlayers, matches, matchPlayers, clipEditOperations, user, matchMedia } from "./db";
import type { Lobby, LobbyPlayer, LobbyStatus, LobbyListItemWithConfig } from "../app/types/lobby";
import type { Match, MatchStatus, MatchConfig, ClipEditOperation } from "../app/types/match";
import type { TimelineState, Clip, Track } from "../app/types/timeline";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(str: string): boolean {
	return UUID_REGEX.test(str);
}

function generateJoinCode(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let code = "";
	for (let i = 0; i < 6; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

export async function createLobby(
	name: string,
	matchConfig: MatchConfig,
	hostUserId: string
): Promise<{ lobbyId: string; joinCode: string }> {
	const database = db();
	const joinCode = generateJoinCode();

	const [lobby] = await database
		.insert(lobbies)
		.values({
			name,
			joinCode,
			status: "waiting",
			hostPlayerId: hostUserId,
			matchConfigJson: matchConfig,
		})
		.returning({ id: lobbies.id, joinCode: lobbies.joinCode });

	await database.insert(lobbyPlayers).values({
		lobbyId: lobby.id,
		userId: hostUserId,
		isHost: true,
		isReady: true,
	});

	return { lobbyId: lobby.id, joinCode: lobby.joinCode };
}

export async function getLobbyById(lobbyId: string): Promise<Lobby | null> {
	if (!isValidUUID(lobbyId)) {
		return null;
	}

	const database = db();

	const [lobbyRecord] = await database.select().from(lobbies).where(eq(lobbies.id, lobbyId)).limit(1);

	if (!lobbyRecord) {
		return null;
	}

	const playersWithUsers = await database
		.select({
			id: lobbyPlayers.id,
			lobbyId: lobbyPlayers.lobbyId,
			userId: lobbyPlayers.userId,
			isHost: lobbyPlayers.isHost,
			isReady: lobbyPlayers.isReady,
			joinedAt: lobbyPlayers.joinedAt,
			userName: user.name,
			userImage: user.image,
		})
		.from(lobbyPlayers)
		.innerJoin(user, eq(lobbyPlayers.userId, user.id))
		.where(eq(lobbyPlayers.lobbyId, lobbyId));

	return mapLobbyRecordToLobby(lobbyRecord, playersWithUsers);
}

export async function getLobbyByJoinCode(joinCode: string): Promise<Lobby | null> {
	const database = db();

	const [lobbyRecord] = await database.select().from(lobbies).where(eq(lobbies.joinCode, joinCode.toUpperCase())).limit(1);

	if (!lobbyRecord) {
		return null;
	}

	const playersWithUsers = await database
		.select({
			id: lobbyPlayers.id,
			lobbyId: lobbyPlayers.lobbyId,
			userId: lobbyPlayers.userId,
			isHost: lobbyPlayers.isHost,
			isReady: lobbyPlayers.isReady,
			joinedAt: lobbyPlayers.joinedAt,
			userName: user.name,
			userImage: user.image,
		})
		.from(lobbyPlayers)
		.innerJoin(user, eq(lobbyPlayers.userId, user.id))
		.where(eq(lobbyPlayers.lobbyId, lobbyRecord.id));

	return mapLobbyRecordToLobby(lobbyRecord, playersWithUsers);
}

export async function listLobbies(status?: LobbyStatus): Promise<LobbyListItemWithConfig[]> {
	const database = db();

	let query = database.select().from(lobbies).orderBy(desc(lobbies.createdAt));

	if (status) {
		query = query.where(eq(lobbies.status, status)) as typeof query;
	}

	const lobbyRecords = await query;

	const result: LobbyListItemWithConfig[] = [];

	for (const record of lobbyRecords) {
		const playersWithUsers = await database
			.select({
				id: lobbyPlayers.id,
				lobbyId: lobbyPlayers.lobbyId,
				userId: lobbyPlayers.userId,
				isHost: lobbyPlayers.isHost,
				isReady: lobbyPlayers.isReady,
				joinedAt: lobbyPlayers.joinedAt,
				userName: user.name,
				userImage: user.image,
			})
			.from(lobbyPlayers)
			.innerJoin(user, eq(lobbyPlayers.userId, user.id))
			.where(eq(lobbyPlayers.lobbyId, record.id));

		const host = playersWithUsers.find((p) => p.isHost);

		result.push({
			id: record.id,
			name: record.name,
			joinCode: record.joinCode,
			status: record.status,
			playerCount: playersWithUsers.length,
			maxPlayers: record.matchConfigJson.maxPlayers,
			hostUsername: host?.userName || "Unknown",
			createdAt: record.createdAt,
			matchConfig: record.matchConfigJson as MatchConfig,
		});
	}

	return result;
}

export async function addPlayerToLobby(lobbyId: string, userId: string): Promise<{ success: boolean; message: string }> {
	const database = db();

	const lobby = await getLobbyById(lobbyId);
	if (!lobby) {
		return { success: false, message: "Lobby not found" };
	}

	if (lobby.status !== "waiting") {
		return { success: false, message: "Lobby is no longer accepting players" };
	}

	if (lobby.players.length >= lobby.matchConfig.maxPlayers) {
		return { success: false, message: "Lobby is full" };
	}

	const existingPlayer = lobby.players.find((p) => p.id === userId);
	if (existingPlayer) {
		return { success: false, message: "Player already in lobby" };
	}

	await database.insert(lobbyPlayers).values({
		lobbyId,
		userId,
		isHost: false,
		isReady: false,
	});

	return { success: true, message: "Successfully joined lobby" };
}

export async function removePlayerFromLobby(lobbyId: string, userId: string): Promise<{ success: boolean; message: string }> {
	const database = db();

	const lobby = await getLobbyById(lobbyId);
	if (!lobby) {
		return { success: false, message: "Lobby not found" };
	}

	const player = lobby.players.find((p) => p.id === userId);
	if (!player) {
		return { success: false, message: "Player not in lobby" };
	}

	await database.delete(lobbyPlayers).where(and(eq(lobbyPlayers.lobbyId, lobbyId), eq(lobbyPlayers.userId, userId)));

	// host left, assign new host or close lobby
	if (player.isHost) {
		const remainingPlayers = lobby.players.filter((p) => p.id !== userId);
		if (remainingPlayers.length > 0) {
			await database
				.update(lobbyPlayers)
				.set({ isHost: true })
				.where(and(eq(lobbyPlayers.lobbyId, lobbyId), eq(lobbyPlayers.userId, remainingPlayers[0].id)));
		} else {
			await database.update(lobbies).set({ status: "closed", updatedAt: new Date() }).where(eq(lobbies.id, lobbyId));
		}
	}

	return { success: true, message: "Successfully left lobby" };
}

export async function updateLobbyStatus(lobbyId: string, status: LobbyStatus, matchId?: string): Promise<void> {
	const database = db();

	await database
		.update(lobbies)
		.set({
			status,
			matchId: matchId ?? null,
			updatedAt: new Date(),
		})
		.where(eq(lobbies.id, lobbyId));
}

export async function setPlayerReady(lobbyId: string, userId: string, ready: boolean): Promise<void> {
	const database = db();

	await database
		.update(lobbyPlayers)
		.set({ isReady: ready })
		.where(and(eq(lobbyPlayers.lobbyId, lobbyId), eq(lobbyPlayers.userId, userId)));
}

// Match functions

export async function createMatch(lobbyId: string, lobbyName: string, config: MatchConfig, players: LobbyPlayer[]): Promise<string> {
	const database = db();

	const tracks: Track[] = [];
	for (let i = 0; i < config.maxVideoTracks; i++) {
		tracks.push({
			id: `video-${i}`,
			type: "video",
			clips: [],
		});
	}
	for (let i = 0; i < config.maxAudioTracks; i++) {
		tracks.push({
			id: `audio-${i}`,
			type: "audio",
			clips: [],
		});
	}

	const emptyTimeline: TimelineState = {
		duration: config.timelineDuration,
		tracks,
	};

	const [match] = await database
		.insert(matches)
		.values({
			lobbyId,
			lobbyName,
			status: "preparing",
			configJson: config,
			timelineJson: emptyTimeline,
			editCount: 0,
		})
		.returning({ id: matches.id });

	for (const player of players) {
		await database.insert(matchPlayers).values({
			matchId: match.id,
			userId: player.id,
			clipCount: 0,
		});
	}

	return match.id;
}

export async function deleteMatch(matchId: string): Promise<void> {
	const database = db();
	await database.delete(matches).where(eq(matches.id, matchId));
}

export async function getMatchById(matchId: string): Promise<Match | null> {
	const database = db();

	const [matchRecord] = await database.select().from(matches).where(eq(matches.id, matchId)).limit(1);

	if (!matchRecord) {
		return null;
	}

	const playersWithUsers = await database
		.select({
			id: matchPlayers.id,
			matchId: matchPlayers.matchId,
			userId: matchPlayers.userId,
			joinedAt: matchPlayers.joinedAt,
			disconnectedAt: matchPlayers.disconnectedAt,
			clipCount: matchPlayers.clipCount,
			userName: user.name,
			userImage: user.image,
		})
		.from(matchPlayers)
		.innerJoin(user, eq(matchPlayers.userId, user.id))
		.where(eq(matchPlayers.matchId, matchId));

	return mapMatchRecordToMatch(matchRecord, playersWithUsers);
}

export async function getMatchByLobbyId(lobbyId: string): Promise<Match | null> {
	const database = db();

	const [matchRecord] = await database.select().from(matches).where(eq(matches.lobbyId, lobbyId)).limit(1);

	if (!matchRecord) {
		return null;
	}

	const playersWithUsers = await database
		.select({
			id: matchPlayers.id,
			matchId: matchPlayers.matchId,
			userId: matchPlayers.userId,
			joinedAt: matchPlayers.joinedAt,
			disconnectedAt: matchPlayers.disconnectedAt,
			clipCount: matchPlayers.clipCount,
			userName: user.name,
			userImage: user.image,
		})
		.from(matchPlayers)
		.innerJoin(user, eq(matchPlayers.userId, user.id))
		.where(eq(matchPlayers.matchId, matchRecord.id));

	return mapMatchRecordToMatch(matchRecord, playersWithUsers);
}

export async function updateMatchStatus(matchId: string, status: MatchStatus): Promise<void> {
	const database = db();

	const updates: Record<string, unknown> = {
		status,
		updatedAt: new Date(),
	};

	if (status === "active") {
		const match = await getMatchById(matchId);
		if (match) {
			updates.startedAt = new Date();
			updates.endsAt = new Date(Date.now() + match.config.matchDuration * 60 * 1000);
		}
	} else if (status === "completed" || status === "failed") {
		updates.completedAt = new Date();
	}

	await database.update(matches).set(updates).where(eq(matches.id, matchId));
}

export async function updateMatchTimeline(matchId: string, timeline: TimelineState): Promise<void> {
	const database = db();

	await database.update(matches).set({ timelineJson: timeline, updatedAt: new Date() }).where(eq(matches.id, matchId));
}

export async function updateMatchRender(matchId: string, renderJobId?: string, renderUrl?: string, renderError?: string): Promise<void> {
	const database = db();

	await database
		.update(matches)
		.set({
			renderJobId: renderJobId ?? null,
			renderUrl: renderUrl ?? null,
			renderError: renderError ?? null,
			updatedAt: new Date(),
		})
		.where(eq(matches.id, matchId));
}

export async function markPlayerDisconnected(matchId: string, userId: string): Promise<void> {
	const database = db();

	await database
		.update(matchPlayers)
		.set({ disconnectedAt: new Date() })
		.where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, userId)));
}

export async function incrementPlayerClipCount(matchId: string, userId: string, delta: number = 1): Promise<void> {
	const database = db();

	const [player] = await database
		.select()
		.from(matchPlayers)
		.where(and(eq(matchPlayers.matchId, matchId), eq(matchPlayers.userId, userId)))
		.limit(1);

	if (player) {
		await database
			.update(matchPlayers)
			.set({ clipCount: player.clipCount + delta })
			.where(eq(matchPlayers.id, player.id));
	}
}

// Clip edit functions
export async function recordClipEdit(
	matchId: string,
	playerId: string,
	operationType: "add" | "update" | "remove",
	clipId: string,
	trackId: string,
	clipData: Clip | null,
	previousData: Clip | null
): Promise<void> {
	const database = db();

	await database.insert(clipEditOperations).values({
		matchId,
		playerId,
		operationType,
		clipId,
		trackId,
		clipDataJson: clipData,
		previousDataJson: previousData,
	});
}

export async function getMatchEditHistory(matchId: string): Promise<ClipEditOperation[]> {
	const database = db();

	const records = await database
		.select()
		.from(clipEditOperations)
		.where(eq(clipEditOperations.matchId, matchId))
		.orderBy(desc(clipEditOperations.createdAt));

	return records.map((r) => ({
		id: r.id,
		matchId: r.matchId,
		playerId: r.playerId,
		type: r.operationType,
		clipId: r.clipId,
		trackId: r.trackId,
		clipData: r.clipDataJson as Clip | null,
		previousData: r.previousDataJson as Clip | null,
		timestamp: r.createdAt,
	}));
}

// other functions

type LobbyPlayerWithUser = {
	id: string;
	lobbyId: string;
	userId: string;
	isHost: boolean;
	isReady: boolean;
	joinedAt: Date;
	userName: string;
	userImage: string | null;
};

function mapLobbyRecordToLobby(
	record: {
		id: string;
		name: string;
		joinCode: string;
		status: LobbyStatus;
		hostPlayerId: string;
		matchConfigJson: MatchConfig;
		matchId: string | null;
		createdAt: Date;
		updatedAt: Date;
	},
	players: LobbyPlayerWithUser[]
): Lobby {
	return {
		id: record.id,
		name: record.name,
		joinCode: record.joinCode,
		status: record.status,
		hostPlayerId: record.hostPlayerId,
		matchConfig: record.matchConfigJson,
		players: players.map((p) => ({
			id: p.userId,
			username: p.userName,
			image: p.userImage,
			joinedAt: p.joinedAt,
			isHost: p.isHost,
			isReady: p.isReady,
		})),
		matchId: record.matchId,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

type MatchPlayerWithUser = {
	id: string;
	matchId: string;
	userId: string;
	joinedAt: Date;
	disconnectedAt: Date | null;
	clipCount: number;
	userName: string;
	userImage: string | null;
};

function mapMatchRecordToMatch(
	record: {
		id: string;
		lobbyId: string;
		lobbyName: string;
		status: MatchStatus;
		configJson: MatchConfig;
		timelineJson: TimelineState;
		editCount: number;
		startedAt: Date | null;
		endsAt: Date | null;
		completedAt: Date | null;
		renderJobId: string | null;
		renderUrl: string | null;
		renderError: string | null;
		createdAt: Date;
		updatedAt: Date;
	},
	players: MatchPlayerWithUser[]
): Match {
	return {
		id: record.id,
		lobbyId: record.lobbyId,
		lobbyName: record.lobbyName,
		status: record.status,
		config: record.configJson,
		timeline: record.timelineJson,
		editCount: record.editCount,
		players: players.map((p) => ({
			id: p.userId,
			username: p.userName,
			image: p.userImage,
			joinedAt: p.joinedAt,
			disconnectedAt: p.disconnectedAt,
			clipCount: p.clipCount,
		})),
		startedAt: record.startedAt,
		endsAt: record.endsAt,
		completedAt: record.completedAt,
		renderJobId: record.renderJobId,
		renderUrl: record.renderUrl,
		renderError: record.renderError,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

// Cleanup functions

export async function deleteMatchMedia(matchId: string): Promise<void> {
	const database = db();
	await database.delete(matchMedia).where(eq(matchMedia.matchId, matchId));
}

export async function cleanupOldLobbies(olderThanHours: number = 24): Promise<number> {
	const database = db();
	const cutoff = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

	const result = await database.delete(lobbies).where(and(eq(lobbies.status, "closed"), eq(lobbies.createdAt, cutoff)));

	return 0;
}

export async function getExpiredMatches(): Promise<Match[]> {
	const database = db();
	const now = new Date();

	const records = await database.select().from(matches).where(eq(matches.status, "active"));

	const expiredMatches: Match[] = [];

	for (const record of records) {
		if (record.endsAt && record.endsAt <= now) {
			const playersWithUsers = await database
				.select({
					id: matchPlayers.id,
					matchId: matchPlayers.matchId,
					userId: matchPlayers.userId,
					joinedAt: matchPlayers.joinedAt,
					disconnectedAt: matchPlayers.disconnectedAt,
					clipCount: matchPlayers.clipCount,
					userName: user.name,
					userImage: user.image,
				})
				.from(matchPlayers)
				.innerJoin(user, eq(matchPlayers.userId, user.id))
				.where(eq(matchPlayers.matchId, record.id));
			expiredMatches.push(mapMatchRecordToMatch(record, playersWithUsers));
		}
	}

	return expiredMatches;
}
