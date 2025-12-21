import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { matchMedia, matches } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface RouteParams {
	params: Promise<{
		matchId: string;
	}>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { matchId } = await params;

		const media = await db().select().from(matchMedia).where(eq(matchMedia.matchId, matchId));

		return NextResponse.json({ media });
	} catch (error) {
		console.error("Error getting match media:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { matchId } = await params;

		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const body = await request.json();
		const { name, type, url, fileId } = body;

		if (!name || !type || !url) {
			return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
		}

		const match = await db().select().from(matches).where(eq(matches.id, matchId)).limit(1);
		if (!match.length) {
			return NextResponse.json({ error: "Match not found" }, { status: 404 });
		}

		const existing = await db()
			.select()
			.from(matchMedia)
			.where(and(eq(matchMedia.url, url), eq(matchMedia.matchId, matchId)))
			.limit(1);
		if (existing.length) {
			return NextResponse.json({ success: true, id: existing[0].id, message: "Media already exists" });
		}

		const [inserted] = await db().insert(matchMedia).values({
			matchId,
			uploadedBy: session.user.id,
			name,
			type,
			url,
			fileId,
		}).returning({ id: matchMedia.id });

		return NextResponse.json({ success: true, id: inserted.id });
	} catch (error) {
		console.error("Error adding match media:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { matchId } = await params;

		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const { searchParams } = new URL(request.url);
		const mediaId = searchParams.get("mediaId");

		if (!mediaId) {
			return NextResponse.json({ error: "Media ID is required" }, { status: 400 });
		}

		const result = await db()
			.delete(matchMedia)
			.where(and(eq(matchMedia.id, mediaId), eq(matchMedia.matchId, matchId)))
			.returning({ id: matchMedia.id });

		if (result.length === 0) {
			return NextResponse.json({ error: "Media not found for this match" }, { status: 404 });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error deleting match media:", error);
		return NextResponse.json({ error: "Internal server error" }, { status: 500 });
	}
}
