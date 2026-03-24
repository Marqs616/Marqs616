const exploreState = {
query: "",
type: "all",
game: "all",
sort: "recent",
editingModId: null
}

const exploreElements = {
search: document.getElementById("exploreSearch"),
type: document.getElementById("exploreType"),
game: document.getElementById("exploreGame"),
sort: document.getElementById("exploreSort"),
mods: document.getElementById("exploreMods"),
profiles: document.getElementById("exploreProfiles"),
modsCount: document.getElementById("modsResultCount"),
profilesCount: document.getElementById("profilesResultCount"),
totalCount: document.getElementById("totalResultCount")
}

function createSearchEmptyState(query, subtitle) {
return `
<div class="search-empty-state">
<span class="hero-kicker">Busca vazia</span>
<h3>Nada encontrado para "${query || "essa busca"}"</h3>
<p>${subtitle}</p>
<a class="ghost-btn" href="/explore.html">Limpar busca</a>
</div>
`
}

function getGameLabel(game) {
if (game === "gtasa") {
return "GTA SA"
}

if (game === "roblox") {
return "Roblox"
}

if (game === "fnf") {
return "Friday Night Funkin"
}

if (game === "gtav") {
return "GTA V"
}

return "Minecraft"
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

function createExploreModCard(mod) {
const card = document.createElement("article")
card.className = "mod-showcase"

const image = mod.banner_link
? `/uploads/${mod.banner_link}`
: getGameImage(mod.game)
const canManage = Boolean(window.currentUser && ((window.canAccessAdminPanel?.(window.currentUser)) || window.currentUser.id == mod.user_id))
const isEditing = String(exploreState.editingModId || "") === String(mod.id)
const editButton = canManage ? `<button class="ghost-btn" type="button" data-action="toggle-edit-mod" data-id="${mod.id}">${isEditing ? "Fechar edicao" : "Editar mod"}</button>` : ""
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
<span class="chip">${getGameLabel(mod.game)}</span>
<span class="chip">${mod.ratingCount || 0} avaliacoes</span>
<span class="chip">${mod.favoriteCount || 0} favoritos</span>
</div>
<div>
<h3>${mod.title}</h3>
<p>${mod.description || "Sem descricao"}</p>
</div>
<div class="meta-line">
<span>Criador: ${mod.authorDisplayName || mod.username || "autor"}</span>
<span>${mod.downloads || 0} downloads</span>
<span>${mod.ratingCount || 0} avaliacoes</span>
</div>
<div class="spotlight-actions">
<a class="btn" href="/mod.html?id=${mod.id}">Abrir mod</a>
<a class="ghost-btn" href="/profile.html?id=${mod.user_id}">Ver perfil</a>
${editButton}
</div>
${editForm}
</div>
`

return card
}

function createProfileCard(profile) {
const card = document.createElement("article")
card.className = "profile-search-card"

const avatar = profile.profile?.avatarUrl || ""
const roleLabel = profile.role === "master_admin"
? "Master admin"
: profile.role === "admin"
? "Administrador"
: profile.role === "partner"
? "Parceiro"
: "Usuario"

card.innerHTML = `
<div class="profile-search-head">
<div class="profile-search-avatar-wrap">
${avatar ? `<img class="profile-search-avatar" src="${avatar}" alt="${profile.username}">` : `<div class="profile-search-avatar profile-search-fallback">${(profile.profile?.displayName || profile.username || "U").charAt(0).toUpperCase()}</div>`}
</div>
<div>
<h3>${profile.profile?.displayName || profile.username}</h3>
<p>@${profile.username}</p>
<div class="chip-row">
<span class="chip">${roleLabel}</span>
${profile.canPost ? '<span class="chip active">Postador</span>' : ""}
</div>
</div>
</div>
<p>${profile.profile?.bio || "Esse perfil ainda nao adicionou uma bio."}</p>
<div class="meta-line">
<span>${profile.stats?.mods || 0} mods</span>
<span>${profile.stats?.followers || 0} seguidores</span>
<span>${profile.stats?.favorites || 0} favoritos</span>
</div>
<a class="btn" href="/profile.html?id=${profile.id}">Abrir perfil</a>
`

return card
}

function renderExploreResults(data) {
if (exploreElements.modsCount) {
exploreElements.modsCount.textContent = data.counts.mods
}

if (exploreElements.profilesCount) {
exploreElements.profilesCount.textContent = data.counts.profiles
}

if (exploreElements.totalCount) {
exploreElements.totalCount.textContent = data.counts.mods + data.counts.profiles
}

if (exploreElements.mods) {
exploreElements.mods.innerHTML = ""
if (!data.mods.length) {
exploreElements.mods.innerHTML = createSearchEmptyState(data.query, "Nenhum mod bateu com esses filtros. Tente trocar o jogo, o tipo ou outra palavra-chave.")
} else {
data.mods.forEach(mod => {
exploreElements.mods.appendChild(createExploreModCard(mod))
})
}
}

if (exploreElements.profiles) {
exploreElements.profiles.innerHTML = ""
if (!data.profiles.length) {
exploreElements.profiles.innerHTML = createSearchEmptyState(data.query, "Nenhum perfil foi encontrado nessa pesquisa. Vale tentar nome, @usuario ou bio.")
} else {
data.profiles.forEach(profile => {
exploreElements.profiles.appendChild(createProfileCard(profile))
})
}
}
}

async function loadExploreResults() {
const params = new URLSearchParams({
q: exploreState.query,
type: exploreState.type,
game: exploreState.game,
sort: exploreState.sort
})

try {
const response = await fetch(`/explore?${params.toString()}`, {
credentials: "include"
})

const data = await response.json()
if (!response.ok) {
window.showToast?.(data.error || "Erro ao buscar resultados", "error", "Explorar")
return
}
renderExploreResults(data)
} catch (error) {
console.error("Erro ao buscar resultados:", error)
window.showToast?.("Nao foi possivel carregar a busca agora.", "error", "Explorar")
}
}

function syncQuickFilters() {
document.querySelectorAll("[data-type-filter]").forEach(button => {
button.classList.toggle("active", button.dataset.typeFilter === exploreState.type)
})

document.addEventListener("click", event => {
const action = event.target.dataset.action

if (action === "toggle-edit-mod") {
exploreState.editingModId = String(exploreState.editingModId || "") === String(event.target.dataset.id) ? null : String(event.target.dataset.id)
loadExploreResults()
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

const res = await fetch(`/mod/${id}/edit`, {
method: "PUT",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify(payload)
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao atualizar mod", "error", "Explorar")
return
}

window.showToast?.(data.message || "Mod atualizado", "success", "Explorar")
exploreState.editingModId = null
await loadExploreResults()
})
}

function bindExploreEvents() {
exploreElements.search?.addEventListener("input", event => {
exploreState.query = event.target.value.trim()
loadExploreResults()
})

exploreElements.type?.addEventListener("change", event => {
exploreState.type = event.target.value
syncQuickFilters()
loadExploreResults()
})

exploreElements.game?.addEventListener("change", event => {
exploreState.game = event.target.value
loadExploreResults()
})

exploreElements.sort?.addEventListener("change", event => {
exploreState.sort = event.target.value
loadExploreResults()
})

document.querySelectorAll("[data-type-filter]").forEach(button => {
button.addEventListener("click", () => {
exploreState.type = button.dataset.typeFilter
if (exploreElements.type) {
exploreElements.type.value = exploreState.type
}
syncQuickFilters()
loadExploreResults()
})
})
}

function initExploreFromUrl() {
const params = new URLSearchParams(window.location.search)
exploreState.query = params.get("q") || ""
exploreState.type = params.get("type") || "all"
exploreState.game = params.get("game") || "all"
exploreState.sort = params.get("sort") || "recent"

if (exploreElements.search) {
exploreElements.search.value = exploreState.query
}

if (exploreElements.type) {
exploreElements.type.value = exploreState.type
}

if (exploreElements.game) {
exploreElements.game.value = exploreState.game
}

if (exploreElements.sort) {
exploreElements.sort.value = exploreState.sort
}

syncQuickFilters()
}

initExploreFromUrl()
bindExploreEvents()
loadExploreResults()
