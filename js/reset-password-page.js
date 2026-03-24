function getRecoveryToken() {
const params = new URLSearchParams(window.location.search)
return params.get("token") || ""
}

document.getElementById("resetPasswordForm")?.addEventListener("submit", async event => {
event.preventDefault()

const token = getRecoveryToken()
const password = document.getElementById("newPassword").value
const confirmPassword = document.getElementById("confirmPassword").value

if (!token) {
window.showToast?.("A liberacao de recuperacao nao foi encontrada.", "error", "Recuperacao")
return
}

if (password !== confirmPassword) {
window.showToast?.("As senhas nao coincidem.", "error", "Recuperacao")
return
}

const res = await fetch("/account-recovery/complete", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
body: JSON.stringify({
token,
password
})
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel redefinir a senha.", "error", "Recuperacao")
return
}

window.showToast?.(data.message || "Senha redefinida com sucesso.", "success", "Recuperacao")
window.setTimeout(() => {
window.location.href = "/login.html"
}, 900)
})
