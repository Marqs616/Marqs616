async function setupPostModAccessPage() {
	try {
		const response = await fetch("/check-login", { credentials: "include" })
		const data = await response.json()

		if (data?.logged) {
			const query = window.location.search || ""
			window.location.replace(`/post-mod.html${query}`)
		}
	} catch (error) {
		// Keep the access page visible if the check fails.
	}
}

setupPostModAccessPage()
