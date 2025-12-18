"use client";

import { useSession } from "@/lib/auth-client";

export function usePlayer() {
	const { data: session, isPending } = useSession();

	return {
		playerId: session?.user?.id ?? null,
		username: session?.user?.name ?? null,
		email: session?.user?.email ?? null,
		image: session?.user?.image ?? null,
		isLoading: isPending,
		isAuthenticated: !!session,
		session,
	};
}
