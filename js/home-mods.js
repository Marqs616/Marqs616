const homeState = {
mods: [],
query: "",
sort: "recent"
}

const homeElements = {
featured: document.getElementById("featured-mods"),
recent: document.getElementById("recent-mods"),
search: document.getElementById("searchMods"),
sort: document.getElementById("homeSort")
}

function escapeHtml(value) {
return String(value || "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#39;")
}

function getModImage(mod) {
if (mod.banner_link) {
return `/uploads/${encodeURIComponent(mod.banner_link)}`
}

const gameFallbacks = {
gtasa: "/img/samp.png",
minecraft: "/img/minezin.png",
roblox: "/img/roblox.svg",
fnf: "/img/fnf.svg",
gtav: "/img/gtav.svg"
}

return gameFallbacks[String(mod.game || "").toLowerCase()] || "/img/banner.png"
}

function createModCard(mod, compact = false) {
const article = document.createElement("article")
article.className = compact ? "game-card" : "mod-card"

article.innerHTML = `
<img src="${getModImage(mod)}" alt="${escapeHtml(mod.title)}" onerror="this.src='/img/banner.png'">
<div class="${compact ? "game-info" : "mod-info"}">
<h3>${escapeHtml(mod.title)}</h3>
<p>${escapeHtml(mod.description || "Sem descricao informada.")}</p>
<div class="meta-line">
<span>${escapeHtml(mod.authorDisplayName || mod.username || "autor")}</span>
<span>${Number(mod.downloads || 0)} downloads</span>
<span>${Number(mod.ratingAverage || 0).toFixed(1)} nota</span>
</div>
<a href="/mod.html?id=${mod.id}" class="btn">Abrir</a>
</div>
`

return article
}

function sortMods(items) {
const mods = [...items]

if (homeState.sort === "popular") {
return mods.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
}

if (homeState.sort === "rating") {
return mods.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))
}

return mods.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
}

function filterMods() {
const term = homeState.query.trim().toLowerCase()

if (!term) {
return sortMods(homeState.mods)
}

return sortMods(homeState.mods.filter(mod => {
return [
mod.title,
mod.description,
mod.authorDisplayName,
mod.username,
mod.game,
mod.credits
]
.filter(Boolean)
.some(value => String(value).toLowerCase().includes(term))
}))
}

function renderFeatured() {
if (!homeElements.featured) {
return
}

homeElements.featured.innerHTML = ""

const featured = [...homeState.mods]
.sort((a, b) => (b.featureScore || 0) - (a.featureScore || 0))
.slice(0, 6)

if (!featured.length) {
homeElements.featured.innerHTML = '<div class="empty-state">Nenhum destaque publicado ainda.</div>'
return
}

featured.forEach(mod => {
homeElements.featured.appendChild(createModCard(mod, true))
})
}

function renderRecent() {
if (!homeElements.recent) {
return
}

homeElements.recent.innerHTML = ""

const mods = filterMods().slice(0, 12)

if (!mods.length) {
homeElements.recent.innerHTML = '<div class="empty-state">Nenhum mod encontrado com esse filtro.</div>'
return
}

mods.forEach(mod => {
homeElements.recent.appendChild(createModCard(mod))
})
}

async function loadHomeMods() {
try {
const response = await fetch("/ranking", { credentials: "include" })
const data = await response.json()

if (!response.ok) {
throw new Error(data?.error || "Nao foi possivel carregar os mods da home.")
}

homeState.mods = Array.isArray(data) ? data : []
renderFeatured()
renderRecent()
} catch (error) {
console.error("Erro ao carregar home:", error)
if (homeElements.featured) {
homeElements.featured.innerHTML = '<div class="empty-state">Nao foi possivel carregar os destaques agora.</div>'
}
if (homeElements.recent) {
homeElements.recent.innerHTML = '<div class="empty-state">Nao foi possivel carregar os mods agora.</div>'
}
}
}

function bindHomeEvents() {
homeElements.search?.addEventListener("input", event => {
homeState.query = event.target.value || ""
renderRecent()
})

homeElements.sort?.addEventListener("change", event => {
homeState.sort = event.target.value || "recent"
renderRecent()
})
}

bindHomeEvents()
loadHomeMods()
