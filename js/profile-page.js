let viewedUser = null

function getProfileId() {
const params = new URLSearchParams(window.location.search)
return params.get("id")
}

function setPreviewBox(element, imageUrl, fallbackText, accentColor) {
if (!element) {
return
}

element.textContent = ""
element.style.background = imageUrl ? `center / cover no-repeat url('${imageUrl}')` : accentColor || "#9c4dff"

if (!imageUrl) {
element.textContent = fallbackText
}
}

function updateFileLabel(input, labelId, emptyText) {
const label = document.getElementById(labelId)
if (!label) {
return
}

label.textContent = input.files.length ? input.files[0].name : emptyText
}

function previewLocalFile(input, previewId, fallbackText, accentColor) {
const preview = document.getElementById(previewId)
if (!preview) {
return
}

if (!input.files.length) {
setPreviewBox(preview, "", fallbackText, accentColor)
return
}

const file = input.files[0]
const reader = new FileReader()
reader.onload = () => {
setPreviewBox(preview, reader.result, fallbackText, accentColor)
}
reader.readAsDataURL(file)
}

function renderOptionalChip(id, value, label) {
const element = document.getElementById(id)
if (!element) {
return
}

if (!value) {
element.style.display = "none"
return
}

element.style.display = "inline-flex"
element.textContent = label
}

function ensureExternalUrl(value) {
const raw = String(value || "").trim()

if (!raw) {
return ""
}

if (/^https?:\/\//i.test(raw)) {
return raw
}

return `https://${raw}`
}

function getSocialIcon(type) {
const icons = {
youtube: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M23 12s0-3.1-.4-4.6a3.1 3.1 0 0 0-2.2-2.2C18.9 5 12 5 12 5s-6.9 0-8.4.4A3.1 3.1 0 0 0 1.4 7.6C1 8.9 1 12 1 12s0 3.1.4 4.4a3.1 3.1 0 0 0 2.2 2.2C5.1 19 12 19 12 19s6.9 0 8.4-.4a3.1 3.1 0 0 0 2.2-2.2c.4-1.3.4-4.4.4-4.4ZM10 15.5v-7l6 3.5-6 3.5Z"/></svg>`,
discord: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M20.3 4.4A16.7 16.7 0 0 0 16.2 3l-.2.4c1.6.4 2.4 1 2.7 1.2a12.5 12.5 0 0 0-7.3 0c.4-.3 1.4-.9 2.8-1.2L14 3A16.8 16.8 0 0 0 9.8 4.4C7.1 8.4 6.4 12.4 6.7 16.4a16.9 16.9 0 0 0 5.1 2.6l1.1-1.8a10.9 10.9 0 0 1-1.7-.8l.4-.3c3.2 1.5 6.7 1.5 9.8 0l.4.3c-.6.3-1.2.6-1.8.8l1.1 1.8a16.9 16.9 0 0 0 5.1-2.6c.4-4.6-.7-8.6-3.9-12ZM9.9 13.9c-1 0-1.7-.9-1.7-2s.8-2 1.7-2c1 0 1.8.9 1.7 2 0 1.1-.8 2-1.7 2Zm4.2 0c-1 0-1.7-.9-1.7-2s.8-2 1.7-2c1 0 1.8.9 1.7 2 0 1.1-.7 2-1.7 2Z"/></svg>`,
instagram: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2.2A2.8 2.8 0 0 0 4.2 7v10A2.8 2.8 0 0 0 7 19.8h10a2.8 2.8 0 0 0 2.8-2.8V7A2.8 2.8 0 0 0 17 4.2H7Zm10.5 1.6a1.1 1.1 0 1 1 0 2.2 1.1 1.1 0 0 1 0-2.2ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 2.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6Z"/></svg>`,
github: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 0 0-3.2 19.5c.5 0 .7-.2.7-.5v-1.8c-2.8.6-3.4-1.2-3.4-1.2-.5-1-1.1-1.3-1.1-1.3-.9-.6 0-.6 0-.6 1 .1 1.6 1 1.6 1 .9 1.5 2.4 1 3 .8.1-.7.4-1 .7-1.3-2.3-.3-4.7-1.1-4.7-5a4 4 0 0 1 1-2.8c-.1-.3-.5-1.3.1-2.7 0 0 .9-.3 2.9 1a10 10 0 0 1 5.2 0c2-1.3 2.9-1 2.9-1 .6 1.4.2 2.4.1 2.7a4 4 0 0 1 1 2.8c0 3.9-2.4 4.7-4.7 5 .4.3.8 1 .8 1.9V21c0 .3.2.5.7.5A10 10 0 0 0 12 2Z"/></svg>`
}

return icons[type] || ""
}

function renderSocialLinks(user) {
const container = document.getElementById("profileSocialLinks")

if (!container) {
return
}

const links = [
{ type: "youtube", label: "YouTube", href: ensureExternalUrl(user.profile.youtube) },
{ type: "discord", label: "Discord", href: ensureExternalUrl(user.profile.discord) },
{ type: "instagram", label: "Instagram", href: ensureExternalUrl(user.profile.instagram) },
{ type: "github", label: "GitHub", href: ensureExternalUrl(user.profile.github) }
].filter(item => item.href)

container.innerHTML = ""

if (!links.length) {
container.style.display = "none"
return
}

container.style.display = "flex"

links.forEach(link => {
const anchor = document.createElement("a")
anchor.className = `social-link social-link-${link.type}`
anchor.href = link.href
anchor.target = "_blank"
anchor.rel = "noreferrer"
anchor.setAttribute("aria-label", `Abrir ${link.label}`)
anchor.innerHTML = `${getSocialIcon(link.type)}<span>${link.label}</span>`
container.appendChild(anchor)
})
}

function renderProfileCard(user) {
viewedUser = user
const accent = user.profile.accentColor || "#9c4dff"
const avatar = document.getElementById("profileAvatar")
const cover = document.getElementById("profileCover")
const displayName = user.profile.displayName || user.username
const roleLabel = user.role === "master_admin"
? "Master Admin"
: user.role === "admin"
? "Administrador"
: user.role === "partner"
? "Parceiro"
: user.canPost
? "Postador"
: "Membro"

document.getElementById("username").textContent = displayName
document.getElementById("profileTagline").textContent = `@${user.username} - ${roleLabel}`
document.getElementById("profileBio").textContent = user.profile.bio || "Esse usuario ainda nao escreveu uma bio."
document.getElementById("profileBadgeRow").innerHTML = window.getBadgeMarkup?.(user.badges, user.role) || ""

setPreviewBox(avatar, user.profile.avatarUrl, displayName.charAt(0).toUpperCase(), accent)
cover.style.background = user.profile.coverUrl
? `linear-gradient(135deg, rgba(17,17,25,.48), rgba(17,17,25,.84)), url('${user.profile.coverUrl}') center / cover`
: `linear-gradient(135deg, ${accent}55, rgba(17,17,25,.9))`

document.getElementById("mods-count").textContent = user.stats.mods
document.getElementById("downloads-count").textContent = user.stats.downloads
document.getElementById("rating-count").textContent = user.stats.rating || 0
document.getElementById("followers-count").textContent = user.stats.followers
document.getElementById("following-count").textContent = user.stats.following
document.getElementById("favorites-count").textContent = user.stats.favorites
document.getElementById("profileRoleChip").textContent = roleLabel

renderOptionalChip("profileLocationChip", user.profile.location, `Local: ${user.profile.location}`)
renderSocialLinks(user)

const editButton = document.getElementById("editProfileButton")
const followButton = document.getElementById("followButton")
const editCard = document.getElementById("profileEditCard")

if (user.isOwner) {
editButton.style.display = "inline-flex"
editCard.style.display = "block"
prefillProfileForm(user)
} else {
editButton.style.display = "none"
editCard.style.display = "none"
}

if (window.currentUser && !user.isOwner) {
followButton.style.display = "inline-flex"
followButton.textContent = user.isFollowing ? "Deixar de seguir" : "Seguir"
} else {
followButton.style.display = "none"
}

renderMods(user.mods || [])
renderFavorites(user.favorites || [])
}

function renderMods(mods) {
const container = document.getElementById("mods")
container.innerHTML = ""

if (!mods.length) {
container.innerHTML = `<div class="empty-state">Esse perfil ainda nao publicou mods.</div>`
return
}

mods.forEach(mod => {
const card = document.createElement("div")
card.className = "game-card"
const fallback = getGameImage(mod.game)

card.innerHTML = `
<img src="${mod.banner_link ? `/uploads/${mod.banner_link}` : fallback}" alt="${mod.title}">
<div class="game-info">
<h3>${mod.title}</h3>
<p>${mod.description}</p>
<p class="downloads">${mod.downloads || 0} downloads - ${mod.ratingAverage || 0}/5</p>
<a href="/mod.html?id=${mod.id}" class="btn">Ver mod</a>
</div>
`
container.appendChild(card)
})
}

function renderFavorites(mods) {
const container = document.getElementById("favoritesPreview")
container.innerHTML = ""

if (!mods.length) {
container.innerHTML = `<div class="empty-state">Nenhum favorito publico por enquanto.</div>`
return
}

mods.forEach(mod => {
const card = document.createElement("div")
card.className = "game-card"
const fallback = getGameImage(mod.game)

card.innerHTML = `
<img src="${mod.banner_link ? `/uploads/${mod.banner_link}` : fallback}" alt="${mod.title}">
<div class="game-info">
<h3>${mod.title}</h3>
<p>por ${mod.authorDisplayName || mod.username}</p>
<a href="/mod.html?id=${mod.id}" class="ghost-btn">Abrir</a>
</div>
`
container.appendChild(card)
})
}

function getGameImage(game) {
if (game === "gtasa") {
return "/img/samp.png"
}

if (game === "roblox") {
return "/img/roblox.svg"
}

if (game === "fnf") {
return "/img/fnf.svg"
}

if (game === "gtav") {
return "/img/gtav.svg"
}

return "/img/minezin.png"
}

function renderUsers(containerId, users, emptyMessage) {
const container = document.getElementById(containerId)
container.innerHTML = ""

if (!users.length) {
container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`
return
}

users.forEach(user => {
const row = document.createElement("a")
row.className = "user-row"
row.href = `/profile.html?id=${user.id}`
row.innerHTML = `
<div class="user-row-head">
<strong>${user.profile.displayName || user.username}</strong>
<span class="chip">${user.role === "master_admin" ? "Master Admin" : user.role === "admin" ? "Admin" : user.role === "partner" ? "Parceiro" : user.canPost ? "Postador" : "Usuario"}</span>
${window.getBadgeMarkup?.(user.badges, user.role) || ""}
</div>
<p>@${user.username}</p>
`
container.appendChild(row)
})
}

function prefillProfileForm(user) {
document.getElementById("displayName").value = user.profile.displayName || ""
document.getElementById("bio").value = user.profile.bio || ""
document.getElementById("location").value = user.profile.location || ""
document.getElementById("discord").value = user.profile.discord || ""
document.getElementById("youtube").value = user.profile.youtube || ""
document.getElementById("instagram").value = user.profile.instagram || ""
document.getElementById("github").value = user.profile.github || ""
document.getElementById("accentColor").value = user.profile.accentColor || "#9c4dff"

setPreviewBox(
document.getElementById("avatarPreview"),
user.profile.avatarUrl,
(user.profile.displayName || user.username).charAt(0).toUpperCase(),
user.profile.accentColor || "#9c4dff"
)
setPreviewBox(
document.getElementById("coverPreview"),
user.profile.coverUrl,
"Banner",
user.profile.accentColor || "#9c4dff"
)
}

async function loadProfilePage() {
const profileId = getProfileId()

if (!profileId) {
window.location.href = "/"
return
}

try {
const [profileRes, followersRes, followingRes] = await Promise.all([
fetch(`/user/${profileId}`, { credentials: "include" }),
fetch(`/followers/${profileId}`, { credentials: "include" }),
fetch(`/following/${profileId}`, { credentials: "include" })
])

const profile = await profileRes.json()
const followers = await followersRes.json()
const following = await followingRes.json()

if (!profileRes.ok) {
document.querySelector(".profile-container").innerHTML = `<div class="empty-state">${profile.error || "Perfil nao encontrado."}</div>`
return
}

if (!profile || !profile.profile) {
document.querySelector(".profile-container").innerHTML = `<div class="empty-state">Resposta invalida do servidor. Recarregue a pagina.</div>`
return
}

renderProfileCard(profile)
renderUsers("followersList", followers, "Ainda sem seguidores.")
renderUsers("followingList", following, "Esse perfil ainda nao segue ninguem.")
} catch (error) {
console.error("Erro ao carregar perfil:", error)
document.querySelector(".profile-container").innerHTML = `<div class="empty-state">Nao foi possivel carregar o perfil agora. Tente novamente.</div>`
window.showToast?.("Nao foi possivel carregar o perfil.", "error", "Perfil")
}
}

document.getElementById("followButton").addEventListener("click", async () => {
if (!viewedUser) {
return
}

const res = await fetch(`/follow/${viewedUser.id}`, {
method: "POST",
credentials: "include"
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao seguir perfil", "error", "Perfil")
return
}

window.showToast?.(data.message || "Seguimento atualizado.", "success", "Perfil")
await loadProfilePage()
})

document.getElementById("editProfileButton").addEventListener("click", () => {
document.getElementById("profileEditCard").scrollIntoView({ behavior: "smooth", block: "start" })
})

document.getElementById("avatarFile").addEventListener("change", event => {
updateFileLabel(event.target, "avatarUploadName", "Nenhum arquivo selecionado")
previewLocalFile(event.target, "avatarPreview", (viewedUser?.profile?.displayName || viewedUser?.username || "U").charAt(0).toUpperCase(), document.getElementById("accentColor").value)
})

document.getElementById("coverFile").addEventListener("change", event => {
updateFileLabel(event.target, "coverUploadName", "Nenhum arquivo selecionado")
previewLocalFile(event.target, "coverPreview", "Banner", document.getElementById("accentColor").value)
})

document.getElementById("accentColor").addEventListener("input", event => {
if (!document.getElementById("avatarFile").files.length) {
setPreviewBox(
document.getElementById("avatarPreview"),
viewedUser?.profile?.avatarUrl || "",
((viewedUser?.profile?.displayName || viewedUser?.username || "U").charAt(0).toUpperCase()),
event.target.value
)
}

if (!document.getElementById("coverFile").files.length && !(viewedUser?.profile?.coverUrl)) {
setPreviewBox(document.getElementById("coverPreview"), "", "Banner", event.target.value)
}
})

document.getElementById("profileEditForm").addEventListener("submit", async event => {
event.preventDefault()

const formData = new FormData()
formData.append("displayName", document.getElementById("displayName").value)
formData.append("bio", document.getElementById("bio").value)
formData.append("location", document.getElementById("location").value)
formData.append("discord", document.getElementById("discord").value)
formData.append("youtube", document.getElementById("youtube").value)
formData.append("instagram", document.getElementById("instagram").value)
formData.append("github", document.getElementById("github").value)
formData.append("accentColor", document.getElementById("accentColor").value)

const avatarFile = document.getElementById("avatarFile").files[0]
const coverFile = document.getElementById("coverFile").files[0]

if (avatarFile) {
formData.append("avatar", avatarFile)
}

if (coverFile) {
formData.append("cover", coverFile)
}

const res = await fetch("/profile/customize", {
method: "POST",
credentials: "include",
body: formData
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao atualizar perfil", "error", "Perfil")
return
}

window.showToast?.(data.message || "Perfil atualizado", "success", "Perfil")
event.target.reset()
document.getElementById("avatarUploadName").textContent = "Nenhum arquivo selecionado"
document.getElementById("coverUploadName").textContent = "Nenhum arquivo selecionado"
await checkLogin()
await loadProfilePage()
})

loadProfilePage()
