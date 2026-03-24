const params = new URLSearchParams(window.location.search)
const modId = params.get("id")

const state = {
mod: null,
user: null,
ratings: {
average: 0,
count: 0,
myRating: null
},
comments: [],
replyingTo: null
}

const elements = {
title: document.getElementById("modTitle"),
description: document.getElementById("modDescription"),
banner: document.getElementById("modBanner"),
author: document.getElementById("modAuthor"),
downloads: document.getElementById("modDownloads"),
rating: document.getElementById("modRating"),
downloadBtn: document.getElementById("downloadBtn"),
favoriteBtn: document.getElementById("favoriteBtn"),
ratingAverageValue: document.getElementById("ratingAverageValue"),
ratingAverageLabel: document.getElementById("ratingAverageLabel"),
ratingAverageStars: document.getElementById("ratingAverageStars"),
ratingVoteCount: document.getElementById("ratingVoteCount"),
myRatingStatus: document.getElementById("myRatingStatus"),
ratingPicker: document.getElementById("ratingPicker"),
ratingSummaryCard: document.getElementById("ratingSummaryCard"),
comments: document.getElementById("comments"),
commentsHeading: document.getElementById("commentsHeading"),
commentText: document.getElementById("commentText"),
composerAvatar: document.getElementById("composerAvatar"),
composerName: document.getElementById("composerName"),
replyingHint: document.getElementById("replyingHint"),
cancelReplyBtn: document.getElementById("cancelReplyBtn")
}

function escapeHtml(value) {
return String(value || "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
.replace(/'/g, "&#39;")
}

function getToneClass(value) {
if (value <= 1) {
return "tone-danger"
}

if (value <= 2) {
return "tone-orange"
}

if (value <= 3) {
return "tone-yellow"
}

if (value <= 4) {
return "tone-green"
}

return "tone-purple"
}

function applyGameTheme(game) {
const themeClasses = [
"game-theme-minecraft",
"game-theme-samp",
"game-theme-fnf",
"game-theme-gtav",
"game-theme-roblox"
]

document.body.classList.remove(...themeClasses)

const normalized = String(game || "").toLowerCase()

if (normalized === "minecraft") {
document.body.classList.add("game-theme-minecraft")
return
}

if (normalized === "gtasa" || normalized === "samp" || normalized === "gta-sa") {
document.body.classList.add("game-theme-samp")
return
}

if (normalized === "fnf") {
document.body.classList.add("game-theme-fnf")
return
}

if (normalized === "gtav" || normalized === "gta5" || normalized === "gta-v") {
document.body.classList.add("game-theme-gtav")
return
}

if (normalized === "roblox") {
document.body.classList.add("game-theme-roblox")
}
}

function enforceModThemeSurface() {
const styleId = "mod-theme-force"
let style = document.getElementById(styleId)

if (!style) {
style = document.createElement("style")
style.id = styleId
document.head.appendChild(style)
}

style.textContent = `
body[class*="game-theme-"] {
background: #05070a !important;
background-image: none !important;
}
body[class*="game-theme-"]::before,
body[class*="game-theme-"]::after,
body[class*="game-theme-"] .hero::before,
body[class*="game-theme-"] .hero::after,
body[class*="game-theme-"] .mod-page::before,
body[class*="game-theme-"] .mod-page::after,
body[class*="game-theme-"] .rating-section::before,
body[class*="game-theme-"] .rating-section::after,
body[class*="game-theme-"] .comments-section::before,
body[class*="game-theme-"] .comments-section::after,
body[class*="game-theme-"] .mod-feedback-panel::before,
body[class*="game-theme-"] .mod-feedback-panel::after,
body[class*="game-theme-"] .mod-info::before,
body[class*="game-theme-"] .mod-info::after,
body[class*="game-theme-"] .rating-summary-card::before,
body[class*="game-theme-"] .rating-summary-card::after,
body[class*="game-theme-"] .rating-picker::before,
body[class*="game-theme-"] .rating-picker::after,
body[class*="game-theme-"] .comment-composer::before,
body[class*="game-theme-"] .comment-composer::after,
body[class*="game-theme-"] .comment-card::before,
body[class*="game-theme-"] .comment-card::after,
body[class*="game-theme-"] .comment-reply-card::before,
body[class*="game-theme-"] .comment-reply-card::after {
display: none !important;
content: none !important;
}
body[class*="game-theme-"] .navbar,
body[class*="game-theme-"] .mod-page,
body[class*="game-theme-"] .rating-section,
body[class*="game-theme-"] .comments-section,
body[class*="game-theme-"] .mod-feedback-panel,
body[class*="game-theme-"] .mod-info,
body[class*="game-theme-"] .rating-summary-card,
body[class*="game-theme-"] .rating-picker,
body[class*="game-theme-"] .comment-composer,
body[class*="game-theme-"] .comment-card,
body[class*="game-theme-"] .comment-reply-card {
background: #0a0d11 !important;
background-image: none !important;
}
body[class*="game-theme-"] .mod-page,
body[class*="game-theme-"] .rating-section,
body[class*="game-theme-"] .comments-section,
body[class*="game-theme-"] .mod-feedback-panel {
background: #07090c !important;
}
body[class*="game-theme-"] .mod-info::before,
body[class*="game-theme-"] .rating-summary-card::before,
body[class*="game-theme-"] .comment-composer::before,
body[class*="game-theme-"] .comment-card::before {
content: none !important;
}
body[class*="game-theme-"] .rating-star,
body[class*="game-theme-"] .rating-display-star {
background: transparent !important;
background-image: none !important;
box-shadow: none !important;
border: 0 !important;
width: auto !important;
height: auto !important;
min-width: 0 !important;
min-height: 0 !important;
padding: 0 6px !important;
border-radius: 0 !important;
}
body[class*="game-theme-"] .rating-star-icon {
width: 34px !important;
height: 34px !important;
display: block !important;
background: transparent !important;
}
body[class*="game-theme-"] .rating-star:hover,
body[class*="game-theme-"] .rating-display-star:hover,
body[class*="game-theme-"] .rating-star.is-active,
body[class*="game-theme-"] .rating-display-star.is-filled,
body[class*="game-theme-"] .rating-average-stars,
body[class*="game-theme-"] .rating-picker {
background: transparent !important;
background-image: none !important;
box-shadow: none !important;
}
`
}

function forceElementStyles() {
let pageBackground = "#05070a"
let sectionBackground = "#07090c"
let cardBackground = "#0a0d11"
let navbarBackground = "#0b0f13"

if (document.body.classList.contains("game-theme-minecraft")) {
pageBackground = "#040b06"
sectionBackground = "#08110b"
cardBackground = "#0b1710"
navbarBackground = "#0a0f0c"
} else if (document.body.classList.contains("game-theme-samp")) {
pageBackground = "#0a0705"
sectionBackground = "#120d09"
cardBackground = "#17110d"
navbarBackground = "#0f0b09"
} else if (document.body.classList.contains("game-theme-fnf")) {
pageBackground = "#05080d"
sectionBackground = "#09111a"
cardBackground = "#0d1722"
navbarBackground = "#091019"
} else if (document.body.classList.contains("game-theme-gtav")) {
pageBackground = "#0c0805"
sectionBackground = "#171009"
cardBackground = "#20150d"
navbarBackground = "#120d08"
} else if (document.body.classList.contains("game-theme-roblox")) {
pageBackground = "#050607"
sectionBackground = "#0c0e11"
cardBackground = "#14171b"
navbarBackground = "#0b0d10"
}

document.body.style.setProperty("background", pageBackground, "important")
document.body.style.setProperty("background-image", "none", "important")

const navbar = document.querySelector(".navbar")
if (navbar) {
navbar.style.setProperty("background", navbarBackground, "important")
navbar.style.setProperty("background-image", "none", "important")
}

const sections = document.querySelectorAll(".mod-page, .rating-section, .comments-section, .mod-feedback-panel")
sections.forEach(element => {
element.style.setProperty("background", sectionBackground, "important")
element.style.setProperty("background-image", "none", "important")
element.style.setProperty("box-shadow", "none", "important")
})

const darkCards = document.querySelectorAll(".mod-info, .rating-summary-card, .rating-picker, .comment-composer, .comment-card, .comment-reply-card")
darkCards.forEach(element => {
element.style.setProperty("background", cardBackground, "important")
element.style.setProperty("background-image", "none", "important")
element.style.setProperty("box-shadow", "none", "important")
})

const starNodes = document.querySelectorAll(".rating-star, .rating-display-star")
starNodes.forEach(element => {
element.style.setProperty("background", "transparent", "important")
element.style.setProperty("background-image", "none", "important")
element.style.setProperty("box-shadow", "none", "important")
element.style.setProperty("border", "0", "important")
element.style.setProperty("width", "auto", "important")
element.style.setProperty("height", "auto", "important")
element.style.setProperty("min-width", "0", "important")
element.style.setProperty("min-height", "0", "important")
element.style.setProperty("padding", "0 6px", "important")
element.style.setProperty("border-radius", "0", "important")
})

const starIcons = document.querySelectorAll(".rating-star-icon")
starIcons.forEach(element => {
element.style.setProperty("width", "34px", "important")
element.style.setProperty("height", "34px", "important")
element.style.setProperty("display", "block", "important")
element.style.setProperty("background", "transparent", "important")
})
}

function createStarsMarkup(value, interactive = false) {
const rounded = Number(value || 0)
const tone = getToneClass(Math.max(1, Math.round(rounded) || 1))

return Array.from({ length: 5 }, (_, index) => {
const filled = index < rounded
const className = interactive
? `rating-star ${tone}${filled ? " is-active" : ""}`
: `rating-display-star ${tone}${filled ? " is-filled" : ""}`
const starSvg = `<svg class="rating-star-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.8l2.85 5.78 6.38.93-4.62 4.51 1.09 6.35L12 17.36 6.3 20.37l1.09-6.35L2.77 9.51l6.38-.93L12 2.8Z"/></svg>`

if (interactive) {
return `<button type="button" class="${className}" data-rating="${index + 1}" aria-label="Avaliar com ${index + 1} estrelas">${starSvg}</button>`
}

return `<span class="${className}">${starSvg}</span>`
}).join("")
}

function setComposerUser(user) {
const avatarUrl = user?.profile?.avatarUrl || ""
const displayName = user?.profile?.displayName || user?.username || "Comente com sua conta"

elements.composerName.textContent = displayName
elements.composerAvatar.src = avatarUrl || "/img/icone.png"
elements.composerAvatar.dataset.hasImage = avatarUrl ? "true" : "false"
}

function updateFavoriteButton() {
if (!elements.favoriteBtn || !state.mod) {
return
}

elements.favoriteBtn.classList.toggle("is-favorited", Boolean(state.mod.isFavorited))
}

function renderMod() {
if (!state.mod) {
return
}

applyGameTheme(state.mod.game)
enforceModThemeSurface()
document.title = `${state.mod.title} - Visualizar mod`
elements.title.textContent = state.mod.title
elements.description.textContent = state.mod.description || "Sem descricao informada."
elements.author.innerHTML = `Autor: <a href="/profile.html?id=${state.mod.authorProfile?.id || state.mod.user_id}">${escapeHtml(state.mod.authorDisplayName || state.mod.username || "autor")}</a>`
elements.downloads.textContent = `${Number(state.mod.downloads || 0)} downloads`
elements.rating.textContent = `${Number(state.mod.ratingAverage || 0).toFixed(1)} avaliacoes`
elements.downloadBtn.href = `/download/${encodeURIComponent(state.mod.download_link)}`

if (state.mod.banner_link) {
elements.banner.src = `/uploads/${encodeURIComponent(state.mod.banner_link)}`
elements.banner.style.display = ""
elements.banner.style.background = ""
} else {
elements.banner.removeAttribute("src")
elements.banner.style.background = "linear-gradient(135deg, rgba(106, 0, 255, 0.35), rgba(156, 77, 255, 0.16))"
}

elements.banner.onerror = () => {
elements.banner.removeAttribute("src")
elements.banner.style.background = "linear-gradient(135deg, rgba(106, 0, 255, 0.35), rgba(156, 77, 255, 0.16))"
}

updateFavoriteButton()
forceElementStyles()
}

function renderRatings() {
enforceModThemeSurface()
const average = Number(state.ratings.average || 0)
const count = Number(state.ratings.count || 0)
const roundedForTone = count ? Math.round(average) : 0
const tone = count ? getToneClass(roundedForTone) : "tone-purple"

elements.ratingAverageValue.textContent = average.toFixed(1)
elements.ratingAverageLabel.textContent = count ? "Media da comunidade" : "Sem notas ainda"
elements.ratingVoteCount.textContent = `${count} ${count === 1 ? "voto" : "votos"}`
elements.myRatingStatus.textContent = state.ratings.myRating
? `Sua nota: ${state.ratings.myRating}/5`
: "Sua nota: ainda nao enviada"
elements.ratingAverageStars.innerHTML = createStarsMarkup(Math.round(average))
elements.ratingPicker.innerHTML = createStarsMarkup(state.ratings.myRating || 0, true)
elements.ratingSummaryCard.className = `rating-summary-card ${tone}${state.ratings.myRating ? " is-rating-updated" : ""}`.trim()
forceElementStyles()
}

function commentActions(comment) {
const reaction = comment.myReaction || null
const likeAction = reaction === "like" ? "clear" : "like"
const dislikeAction = reaction === "dislike" ? "clear" : "dislike"

return `
<div class="comment-actions-bar">
<button class="ghost-btn" type="button" onclick="reactToComment('${comment.id}', '${likeAction}')">Curtir (${Number(comment.likeCount || 0)})</button>
<button class="ghost-btn" type="button" onclick="reactToComment('${comment.id}', '${dislikeAction}')">Dislike (${Number(comment.dislikeCount || 0)})</button>
<button class="ghost-btn" type="button" onclick="replyToComment('${comment.id}', '${escapeHtml(comment.authorDisplayName || comment.username || "usuario")}')">Responder</button>
${comment.canManage ? `<button class="ghost-btn" type="button" onclick="editComment('${comment.id}', '${escapeHtml(comment.text)}')">Editar</button><button class="ghost-btn" type="button" onclick="deleteComment('${comment.id}')">Apagar</button>` : ""}
</div>
`
}

function renderCommentItem(comment, depth = 0) {
const avatarUrl = comment.authorProfile?.avatarUrl || "/img/icone.png"
const replies = Array.isArray(comment.replies) ? comment.replies : []

return `
<div class="comment-thread${depth ? " comment-reply" : " comment-root"}">
<article class="comment-card youtube-comment-card">
<a class="comment-avatar-link" href="/profile.html?id=${comment.authorProfile?.id || comment.userId}">
<img class="comment-avatar" src="${avatarUrl}" alt="${escapeHtml(comment.authorDisplayName || comment.username || "usuario")}" onerror="this.src='/img/icone.png'">
</a>
<div class="comment-content">
<div class="comment-header">
<div class="comment-author-row">
<a class="comment-author" href="/profile.html?id=${comment.authorProfile?.id || comment.userId}">${escapeHtml(comment.authorDisplayName || comment.username || "usuario")}</a>
<span class="comment-handle">@${escapeHtml(comment.username || "usuario")}</span>
${comment.editedAt ? '<span class="comment-handle">editado</span>' : ""}
</div>
<span class="comment-date">${new Date(comment.date).toLocaleString("pt-BR")}</span>
</div>
<div class="comment-body">
<p class="comment-text">${escapeHtml(comment.text)}</p>
${commentActions(comment)}
</div>
</div>
</article>
${replies.length ? `<div class="comment-replies">${replies.map(reply => renderCommentItem(reply, depth + 1)).join("")}</div>` : ""}
</div>
`
}

function renderComments() {
enforceModThemeSurface()
const total = countComments(state.comments)
elements.commentsHeading.textContent = `Comentarios (${total})`

if (!state.comments.length) {
elements.comments.innerHTML = '<div class="empty-state">Nenhum comentario ainda. Seja o primeiro a comentar.</div>'
forceElementStyles()
return
}

elements.comments.innerHTML = state.comments.map(comment => renderCommentItem(comment)).join("")
forceElementStyles()
}

function countComments(items) {
return items.reduce((sum, item) => sum + 1 + countComments(item.replies || []), 0)
}

async function requestJson(url, options = {}) {
const response = await fetch(url, {
credentials: "include",
headers: {
"Content-Type": "application/json",
...(options.headers || {})
},
...options
})

let data = null
try {
data = await response.json()
} catch (error) {
data = null
}

if (!response.ok) {
throw new Error(data?.error || "Nao foi possivel concluir a solicitacao.")
}

return data
}

async function loadViewer() {
const data = await requestJson("/check-login", { headers: {} }).catch(() => ({ logged: false }))
state.user = data?.user || null
setComposerUser(state.user)
}

async function loadMod() {
state.mod = await requestJson(`/mod/${encodeURIComponent(modId)}`, { headers: {} })
renderMod()
}

async function loadRatings() {
state.ratings = await requestJson(`/ratings/${encodeURIComponent(modId)}`, { headers: {} })
renderRatings()
}

async function loadComments() {
const payload = await requestJson(`/comments/${encodeURIComponent(modId)}`, { headers: {} })
state.comments = Array.isArray(payload.items) ? payload.items : []
renderComments()
}

function ensureLoggedIn(message = "Entre na sua conta para continuar.") {
if (state.user) {
return true
}

alert(message)
window.location.href = "/login.html"
return false
}

window.favoriteMod = async function favoriteMod() {
if (!ensureLoggedIn("Entre na sua conta para favoritar mods.")) {
return
}

try {
const result = await requestJson("/favorite", {
method: "POST",
body: JSON.stringify({ modId })
})

state.mod.isFavorited = Boolean(result.active ?? result.favorited)
updateFavoriteButton()
} catch (error) {
alert(error.message)
}
}

window.sendComment = async function sendComment() {
if (!ensureLoggedIn("Entre na sua conta para comentar.")) {
return
}

const text = String(elements.commentText.value || "").trim()

if (!text) {
alert("Escreva um comentario antes de enviar.")
return
}

try {
await requestJson("/comment", {
method: "POST",
body: JSON.stringify({
modId,
text,
parentId: state.replyingTo
})
})

elements.commentText.value = ""
window.cancelReply()
await loadComments()
} catch (error) {
alert(error.message)
}
}

window.cancelReply = function cancelReply() {
state.replyingTo = null
elements.replyingHint.style.display = "none"
elements.replyingHint.textContent = ""
elements.cancelReplyBtn.style.display = "none"
}

window.replyToComment = function replyToComment(commentId, authorName) {
if (!ensureLoggedIn("Entre na sua conta para responder comentarios.")) {
return
}

state.replyingTo = String(commentId)
elements.replyingHint.style.display = "inline"
elements.replyingHint.textContent = `Respondendo ${authorName}`
elements.cancelReplyBtn.style.display = "inline-flex"
elements.commentText.focus()
}

window.reactToComment = async function reactToComment(commentId, action) {
if (!ensureLoggedIn("Entre na sua conta para reagir aos comentarios.")) {
return
}

try {
await requestJson(`/comment/${encodeURIComponent(commentId)}/react`, {
method: "POST",
body: JSON.stringify({ action })
})
await loadComments()
} catch (error) {
alert(error.message)
}
}

window.editComment = async function editComment(commentId, currentText) {
if (!ensureLoggedIn()) {
return
}

const updated = window.prompt("Edite seu comentario:", currentText)

if (updated === null) {
return
}

try {
await requestJson(`/comment/${encodeURIComponent(commentId)}`, {
method: "PATCH",
body: JSON.stringify({ text: updated })
})
await loadComments()
} catch (error) {
alert(error.message)
}
}

window.deleteComment = async function deleteComment(commentId) {
if (!ensureLoggedIn()) {
return
}

if (!window.confirm("Apagar este comentario?")) {
return
}

try {
await requestJson(`/comment/${encodeURIComponent(commentId)}`, {
method: "DELETE"
})
await loadComments()
} catch (error) {
alert(error.message)
}
}

function bindRatingPicker() {
elements.ratingPicker.addEventListener("click", async event => {
const button = event.target.closest("[data-rating]")

if (!button) {
return
}

if (!ensureLoggedIn("Entre na sua conta para avaliar mods.")) {
return
}

const rating = Number(button.dataset.rating)

try {
await requestJson("/rate", {
method: "POST",
body: JSON.stringify({ modId, rating })
})
await loadRatings()
await loadMod()
} catch (error) {
alert(error.message)
}
})
}

async function init() {
if (!modId) {
elements.title.textContent = "Mod nao encontrado"
elements.description.textContent = "O link desta pagina nao possui um id valido."
return
}

setComposerUser(null)
bindRatingPicker()

try {
await loadViewer()
await Promise.all([
loadMod(),
loadRatings(),
loadComments()
])
} catch (error) {
elements.title.textContent = "Erro ao carregar"
elements.description.textContent = error.message || "Nao foi possivel carregar este mod agora."
}
}

init()
