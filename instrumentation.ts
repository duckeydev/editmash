export async function register() {
	if (process.env.NEXT_RUNTIME === "nodejs") {
		const { checkExpiredMatches } = await import("./lib/matchManager");

		try {
			await checkExpiredMatches();
			console.log("[Instrumentation] Startup recovery completed");
		} catch (error) {
			console.error("[Instrumentation] Startup recovery failed:", error);
		}

		const INTERVAL = 60 * 1000;

		setInterval(async () => {
			try {
				await checkExpiredMatches();
			} catch (error) {
				console.error("[Instrumentation] Periodic expired match check failed:", error);
			}
		}, INTERVAL);

		console.log(`[Instrumentation] Scheduled expired match checks every ${INTERVAL / 1000}s`);
	}
}
