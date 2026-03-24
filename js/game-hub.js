function createGameHub(config) {
const state = {
mods: [],
filtered: [],
sort: "recent",
filter: "all",
user: null,
editingModId: null
}

const elements = {
modsFeed: document.getElementById("modsFeed"),
search: document.getElementById("gameSearch"),
sort: document.getElementById("sortSelect"),
featuredTitle: document.getElementById("featuredTitle"),
featuredText: document.getElementById("featuredText"),
featuredButton: document.getElementById("featuredButton"),
count: document.getElementById("modsCount"),
downloads: document.getElementById("downloadsCount"),
creators: document.getElementById("creatorsCount"),
topList: document.getElementById("topList"),
recentList: document.getElementById("recentList"),
postHint: document.getElementById("postPermissionHint"),
publishSection: document.getElementById("publishSection"),
fileInput: document.getElementById("fileInput"),
bannerInput: document.getElementById("bannerInput"),
fileName: document.getElementById("fileName"),
bannerName: document.getElementById("bannerName"),
modForm: document.getElementById("modForm"),
authArea: document.getElementById("authArea"),
userBar: document.getElementById("userBar"),
userEmail: document.getElementById("userEmail")
}

function getFallbackImage() {
return config.fallbackImage
}

function canManageMod(mod) {
return Boolean(state.user && ((window.canAccessAdminPanel?.(state.user)) || state.user.id == mod.user_id))
}

function sortMods(mods) {
if (state.sort === "popular") {
return mods.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
}

if (state.sort === "rating") {
return mods.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))
}

return mods.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

function applyFilters() {
const term = (elements.search?.value || "").trim().toLowerCase()
let mods = [...state.mods]

if (state.filter === "popular") {
mods = mods.filter(mod => (mod.downloads || 0) > 0)
}

if (state.filter === "rated") {
mods = mods.filter(mod => (mod.ratingCount || 0) > 0)
}

if (state.filter === "recent") {
mods = mods.filter(mod => {
const createdAt = new Date(mod.created_at)
const days = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
return days <= 14
})
}

if (term) {
mods = mods.filter(mod =>
(mod.title || "").toLowerCase().includes(term) ||
(mod.description || "").toLowerCase().includes(term) ||
(mod.authorDisplayName || mod.username || "").toLowerCase().includes(term) ||
(mod.credits || "").toLowerCase().includes(term)
)
}

state.filtered = sortMods(mods)
renderMods()
renderSidebar()
updateStats()
updateFeatured()
}

function updateStats() {
if (elements.count) {
elements.count.textContent = state.mods.length
}

if (elements.downloads) {
elements.downloads.textContent = state.mods.reduce((sum, mod) => sum + Number(mod.downloads || 0), 0)
}

if (elements.creators) {
elements.creators.textContent = new Set(state.mods.map(mod => mod.user_id)).size
}
}

function updateFeatured() {
const featured = [...state.mods].sort((a, b) => (b.downloads || 0) - (a.downloads || 0))[0]

if (!featured) {
elements.featuredTitle.textContent = "Nenhum destaque ainda"
elements.featuredText.textContent = "Assim que tiver mods publicados, o principal vai aparecer aqui."
elements.featuredButton.style.display = "none"
return
}

elements.featuredTitle.textContent = featured.title
elements.featuredText.textContent = featured.description
elements.featuredButton.href = `/mod.html?id=${featured.id}`
elements.featuredButton.style.display = "inline-flex"
}

function renderMods() {
if (!elements.modsFeed) {
return
}

elements.modsFeed.innerHTML = ""

if (!state.filtered.length) {
elements.modsFeed.innerHTML = `<div class="empty-state">Nenhum mod encontrado nessa combinacao de filtros.</div>`
return
}

state.filtered.forEach(mod => {
const card = document.createElement("article")
card.className = "mod-showcase"
const image = mod.banner_link ? `/uploads/${mod.banner_link}` : getFallbackImage()
const isEditing = String(state.editingModId || "") === String(mod.id)
const editButton = canManageMod(mod) ? `<button class="ghost-btn" type="button" data-action="toggle-edit-mod" data-id="${mod.id}">${isEditing ? "Fechar edicao" : "Editar mod"}</button>` : ""
const editForm = isEditing ? `
<form class="inline-mod-editor" data-mod-id="${mod.id}">
<input type="text" name="title" value="${mod.title}">
<textarea name="description" rows="4">${mod.description || ""}</textarea>
<input type="text" name="credits" value="${mod.credits || ""}" placeholder="Creditos">
<input type="hidden" name="game" value="${mod.game}">
<div class="inline-actions">
<button class="ghost-btn" type="button" data-action="toggle-edit-mod" data-id="${mod.id}">Cancelar</button>
<button class="btn" type="submit">Salvar</button>
</div>
</form>
` : ""

card.innerHTML = `
<div class="mod-showcase-media" style="background-image:url('${image}')"></div>
<div class="mod-showcase-body">
<div class="chip-row">
<span class="chip">${config.categoryLabel}</span>
<span class="chip">${mod.ratingCount || 0} avaliacoes</span>
<span class="chip">${mod.favoriteCount || 0} favoritos</span>
</div>
<div>
<h3>${mod.title}</h3>
<p>${mod.description}</p>
</div>
<div class="meta-line">
<span>Autor: ${mod.authorDisplayName || mod.username || "autor"} ${window.getBadgeMarkup?.(mod.authorBadges, mod.authorRole) || ""}</span>
<span>${mod.downloads || 0} downloads</span>
<span>${mod.ratingCount || 0} avaliacoes</span>
</div>
<div class="spotlight-actions">
<a class="btn" href="/mod.html?id=${mod.id}">Abrir mod</a>
<a class="ghost-btn" href="/profile.html?id=${mod.user_id}">Ver criador</a>
${editButton}
</div>
${editForm}
</div>
`

elements.modsFeed.appendChild(card)
})
}

function renderMiniList(container, items) {
if (!container) {
return
}

container.innerHTML = ""

if (!items.length) {
container.innerHTML = `<div class="empty-state">Ainda sem itens por aqui.</div>`
return
}

items.forEach(item => {
const node = document.createElement("a")
node.className = "mini-item"
node.href = `/mod.html?id=${item.id}`
node.innerHTML = `
<strong>${item.title}</strong>
<p>${item.authorDisplayName || item.username || "autor"} ${window.getBadgeMarkup?.(item.authorBadges, item.authorRole) || ""}</p>
<div class="meta-line">
<span>${item.downloads || 0} downloads</span>
<span>${item.ratingCount || 0} avaliacoes</span>
</div>
`
container.appendChild(node)
})
}

function renderSidebar() {
renderMiniList(elements.topList, [...state.mods].sort((a, b) => (b.downloads || 0) - (a.downloads || 0)).slice(0, 4))
renderMiniList(elements.recentList, [...state.mods].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 4))
}

async function handleSession() {
const res = await fetch("/check-login", { credentials: "include" })
const data = await res.json()
state.user = data.user || null

if (state.user) {
elements.userBar.style.display = "flex"
elements.userEmail.textContent = state.user.profile.displayName || state.user.username
elements.authArea.innerHTML = `
<a href="/profile.html?id=${state.user.id}">Meu perfil</a>
${window.canAccessAdminPanel?.(state.user) ? '<a href="/admin.html">Painel admin</a>' : ""}
<a href="#" onclick="logout()">Sair</a>
`
} else {
elements.authArea.innerHTML = `<a href="/login.html" class="btn">Entrar / Criar conta</a>`
}

const canPost = Boolean(state.user && (state.user.canPost || window.canAccessAdminPanel?.(state.user)))

if (elements.publishSection) {
elements.publishSection.style.display = "block"
}

if (elements.postHint) {
elements.postHint.textContent = canPost
? `Sua conta pode enviar conteudo em ${config.title} pela tela dedicada de postagem.`
: "A tela de postagem e centralizada, mas sua conta ainda nao tem permissao para enviar mods."
}
}

window.logout = async function logout() {
await fetch("/logout", {
method: "POST",
credentials: "include"
})

window.location.reload()
}

async function loadMods() {
const res = await fetch(`/mods/${config.gameKey}`, { credentials: "include" })
state.mods = await res.json()
applyFilters()
}

function bindEvents() {
elements.search?.addEventListener("input", applyFilters)
elements.sort?.addEventListener("change", event => {
state.sort = event.target.value
applyFilters()
})

document.querySelectorAll(".quick-filter").forEach(button => {
button.addEventListener("click", () => {
state.filter = button.dataset.filter
document.querySelectorAll(".quick-filter").forEach(item => item.classList.toggle("active", item === button))
applyFilters()
})
})

document.addEventListener("click", async event => {
const action = event.target.dataset.action

if (action === "toggle-edit-mod") {
state.editingModId = String(state.editingModId || "") === String(event.target.dataset.id) ? null : String(event.target.dataset.id)
renderMods()
}
})

document.addEventListener("submit", async event => {
const form = event.target

if (!form.matches(".inline-mod-editor")) {
return
}

event.preventDefault()

const id = form.dataset.modId
const payload = {
title: form.title.value,
description: form.description.value,
credits: form.credits.value,
game: form.game.value
}

const response = await fetch(`/mod/${id}/edit`, {
method: "PUT",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify(payload)
})

const result = await response.json()

if (!response.ok) {
window.showToast?.(result.error || "Erro ao atualizar mod", "error", "Edicao")
return
}

window.showToast?.(result.message || "Mod atualizado", "success", "Edicao")
state.editingModId = null
await loadMods()
})

elements.fileInput?.addEventListener("change", () => {
elements.fileName.textContent = elements.fileInput.files.length ? elements.fileInput.files[0].name : "Nenhum arquivo selecionado"
})

elements.bannerInput?.addEventListener("change", () => {
elements.bannerName.textContent = elements.bannerInput.files.length ? elements.bannerInput.files[0].name : "Nenhum banner selecionado"
})

elements.modForm?.addEventListener("submit", async event => {
event.preventDefault()

const formData = new FormData(elements.modForm)
const response = await fetch("/post-mod", {
method: "POST",
credentials: "include",
body: formData
})

const result = await response.json()
window.showToast?.(
result.message || result.error || "Acao concluida",
response.ok ? "success" : "error",
"Postagem"
)

if (response.ok) {
elements.modForm.reset()
elements.fileName.textContent = "Nenhum arquivo selecionado"
elements.bannerName.textContent = "Nenhum banner selecionado"
await loadMods()
}
})
}

async function init() {
bindEvents()
await handleSession()
await loadMods()
}

init()
}
