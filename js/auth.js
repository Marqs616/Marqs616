window.currentUser = null
window.userNotifications = []
window.notificationsPoller = null

function getOrCreateDeviceToken() {
	const storageKey = "drxz_device_token"
	let token = ""

	try {
		token = window.localStorage.getItem(storageKey) || ""
		if (!token) {
			token = (window.crypto?.randomUUID?.() || `drxz_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`).replace(/[^a-zA-Z0-9:_-]/g, "")
			window.localStorage.setItem(storageKey, token)
		}
	} catch (error) {
		token = `drxz_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
	}

	return token
}

window.getOrCreateDeviceToken = getOrCreateDeviceToken

function canStayOnCurrentPageDuringMaintenance() {
const path = window.location.pathname.toLowerCase()
return path === "/login.html" || path === "/register.html" || path === "/maintenance.html" || path === "/forgot-password.html" || path === "/reset-password.html"
|| path === "/access-denied.html" || path === "/post-mod-access.html"
}

function getBadgeMarkup(badges = {}, role = "") {
return [
role === "partner" ? '<span class="profile-badge partner">Parceiro</span>' : "",
badges.ownerTag ? '<span class="profile-badge owner">Dono</span>' : "",
badges.adminTag ? '<span class="profile-badge admin">Admin</span>' : "",
badges.verified ? '<span class="profile-badge verified">Verificado</span>' : "",
badges.booster ? '<span class="profile-badge booster">Booster</span>' : ""
].join("")
}

function canAccessAdminPanel(user) {
return Boolean(user && (user.role === "admin" || user.role === "master_admin" || user.badges?.adminTag))
}

window.getBadgeMarkup = getBadgeMarkup
window.canAccessAdminPanel = canAccessAdminPanel

async function loadNotifications() {
if (!window.currentUser) {
return
}

const res = await fetch("/notifications", { credentials: "include" })
const data = await res.json()

if (!res.ok) {
return
}

window.userNotifications = data.items || []
renderNotifications(data)
}

function startNotificationsPolling() {
if (window.notificationsPoller) {
clearInterval(window.notificationsPoller)
}

window.notificationsPoller = window.setInterval(() => {
if (window.currentUser) {
loadNotifications()
}
}, 5000)
}

function renderNotifications(data) {
const bell = document.getElementById("notificationBell")
const panel = document.getElementById("notificationPanel")
const count = document.getElementById("notificationCount")
const list = document.getElementById("notificationList")

if (!bell || !panel || !count || !list) {
return
}

const unread = data.unread || 0
count.style.display = unread ? "inline-flex" : "none"
count.textContent = unread
list.innerHTML = ""

if (!(data.items || []).length) {
list.innerHTML = `<div class="empty-state">Nada novo por enquanto.</div>`
const clearButton = document.getElementById("clearNotificationsBtn")
if (clearButton) {
clearButton.style.display = "none"
}
return
}

const clearButton = document.getElementById("clearNotificationsBtn")
if (clearButton) {
clearButton.style.display = (data.items || []).length ? "inline-flex" : "none"
}

data.items.slice(0, 10).forEach(item => {
const row = document.createElement("a")
row.className = `notification-item ${item.read ? "" : "unread"}`
row.href = item.link || "/"
row.innerHTML = `
<div class="notification-title">${item.title}</div>
<p>${item.message}</p>
<span class="muted">${new Date(item.date).toLocaleString("pt-BR")}</span>
`
list.appendChild(row)
})
}

function ensureNotificationUi() {
const userBar = document.getElementById("userBar")

if (!userBar || document.getElementById("notificationBell")) {
return
}

const bell = document.createElement("button")
bell.type = "button"
bell.id = "notificationBell"
bell.className = "notification-bell"
bell.innerHTML = `<span>🔔</span><span id="notificationCount" class="notification-count" style="display:none"></span>`
bell.addEventListener("click", async event => {
event.stopPropagation()
document.getElementById("notificationPanel")?.classList.toggle("active")
await fetch("/notifications/read-all", { method: "POST", credentials: "include" })
await loadNotifications()
})

const panel = document.createElement("div")
panel.id = "notificationPanel"
panel.className = "notification-panel"
panel.innerHTML = `
<div class="notification-head">
<strong>Notificacoes</strong>
<button id="clearNotificationsBtn" class="notification-clear-btn" type="button" style="display:none">Limpar tudo</button>
</div>
<div id="notificationList" class="notification-list"></div>
`

userBar.prepend(bell)
userBar.appendChild(panel)

panel.querySelector("#clearNotificationsBtn")?.addEventListener("click", async event => {
event.stopPropagation()
const res = await fetch("/notifications", {
method: "DELETE",
credentials: "include"
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel limpar as notificacoes", "error", "Notificacoes")
return
}

window.userNotifications = []
renderNotifications({ unread: 0, items: [] })
window.showToast?.(data.message || "Notificacoes limpas", "success", "Notificacoes")
})
}

const loginForm = document.getElementById("loginForm")

if (loginForm) {
loginForm.addEventListener("submit", async event => {
event.preventDefault()

const username = document.getElementById("username").value.trim()
const password = document.getElementById("password").value

const res = await fetch("/login", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify({ username, password, deviceToken: getOrCreateDeviceToken() })
})

const data = await res.json()

if (!res.ok) {
if (data.passwordResetRequired && data.resetToken) {
window.showToast?.("Recuperacao liberada. Abra a tela de troca de senha.", "info", "Recuperacao")
window.setTimeout(() => {
window.location.href = `/reset-password.html?token=${encodeURIComponent(data.resetToken)}`
}, 700)
return
}

window.showToast?.(data.error || "Erro ao logar", "error", "Login")
if (data.banned) {
window.setTimeout(() => {
window.location.href = "/banned.html"
}, 700)
}
if (data.maintenance) {
window.setTimeout(() => {
window.location.href = "/maintenance.html"
}, 700)
}
if (data.suspiciousAccess && data.supportUrl) {
	window.setTimeout(() => {
		window.location.href = data.supportUrl
	}, 1200)
}
return
}

window.showToast?.("Logado com sucesso. Preparando seu painel...", "success", "Bem-vindo")
window.setTimeout(() => {
window.location.href = "/"
}, 700)
})
}

const registerForm = document.getElementById("registerForm")

if (registerForm) {
registerForm.addEventListener("submit", async event => {
event.preventDefault()

const username = document.getElementById("username").value.trim()
const email = document.getElementById("email").value.trim()
const password = document.getElementById("password").value

const res = await fetch("/register", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify({ username, email, password, deviceToken: getOrCreateDeviceToken() })
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao registrar", "error", "Cadastro")
return
}

window.showToast?.("Conta criada com sucesso. Agora e so entrar.", "success", "Cadastro concluido")
window.setTimeout(() => {
window.location.href = "/login.html"
}, 700)
})
}

function renderUserMenu(user) {
const authArea = document.getElementById("authArea")
const userBar = document.getElementById("userBar")
const userEmail = document.getElementById("userEmail")
const userAvatar = document.getElementById("userAvatar")
const ownProfileLink = document.querySelectorAll("[data-own-profile-link]")
const favoritesLink = document.querySelectorAll("[data-favorites-link]")
const adminLinks = document.querySelectorAll("[data-admin-link]")

if (!authArea) {
return
}

if (!user) {
authArea.style.display = "flex"
authArea.innerHTML = `<a href="/login.html" class="btn">Entrar / Criar conta</a>`
if (userBar) {
userBar.style.display = "none"
}
window.refreshMobileNav?.()
return
}

window.currentUser = user

if (userBar) {
userBar.style.display = "flex"
}

authArea.style.display = "none"
ensureNotificationUi()

if (userEmail) {
userEmail.innerHTML = `${user.profile.displayName || user.username}${getBadgeMarkup(user.badges, user.role)}`
}

if (userAvatar) {
if (user.profile.avatarUrl) {
userAvatar.src = user.profile.avatarUrl
} else {
userAvatar.src = buildAvatarDataUrl(user.profile.displayName || user.username, user.profile.accentColor)
}
}

authArea.innerHTML = ""

ownProfileLink.forEach(link => {
link.href = `/profile.html?id=${user.id}`
})

favoritesLink.forEach(link => {
link.href = `/profile.html?id=${user.id}#favoritos`
})

adminLinks.forEach(link => {
link.style.display = canAccessAdminPanel(user) ? "" : "none"
})

loadNotifications()
startNotificationsPolling()
window.refreshMobileNav?.()
}

window.addEventListener("focus", () => {
if (window.currentUser) {
loadNotifications()
}
})

document.addEventListener("visibilitychange", () => {
if (!document.hidden && window.currentUser) {
loadNotifications()
}
})

window.loadNotifications = loadNotifications

async function checkLogin() {
try {
const res = await fetch("/check-login", {
credentials: "include"
})

const data = await res.json()

if (data.banned) {
window.location.href = "/banned.html"
return data
}

if (data.logged && data.user) {
renderUserMenu(data.user)
return data
}

if (data.maintenance) {
if (!canStayOnCurrentPageDuringMaintenance()) {
window.location.href = "/maintenance.html"
}
return data
}

if (!data.logged) {
renderUserMenu(null)
return data
}

return data
} catch (error) {
console.error("Erro ao verificar login:", error)
renderUserMenu(null)
return { logged: false, loggedIn: false }
}
}

async function logout() {
await fetch("/logout", {
method: "POST",
credentials: "include"
})

window.location.href = "/"
}

function toggleUserMenu(event) {
event.stopPropagation()
const menu = document.querySelector(".dropdown")

if (menu) {
menu.classList.toggle("active")
}
}

document.addEventListener("click", () => {
const menu = document.querySelector(".dropdown")
if (menu) {
menu.classList.remove("active")
}

const notificationPanel = document.getElementById("notificationPanel")
if (notificationPanel) {
notificationPanel.classList.remove("active")
}
})

function buildAvatarDataUrl(name, accentColor = "#9c4dff") {
const canvas = document.createElement("canvas")
canvas.width = 80
canvas.height = 80

const ctx = canvas.getContext("2d")
ctx.fillStyle = accentColor
ctx.fillRect(0, 0, canvas.width, canvas.height)

ctx.fillStyle = "#ffffff"
ctx.font = "bold 34px Poppins"
ctx.textAlign = "center"
ctx.textBaseline = "middle"
ctx.fillText(String(name || "U").charAt(0).toUpperCase(), 40, 42)

return canvas.toDataURL()
}

window.buildAvatarDataUrl = buildAvatarDataUrl

checkLogin()
