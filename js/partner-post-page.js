function getPartnerPostId() {
const params = new URLSearchParams(window.location.search)
return params.get("id")
}

function createAuthorAvatar(post) {
const avatar = document.getElementById("partnerAuthorAvatar")
const name = post.authorDisplayName || post.authorUsername || "P"

if (!avatar) {
return
}

if (post.authorProfile?.avatarUrl) {
avatar.innerHTML = `<img src="${post.authorProfile.avatarUrl}" alt="${name}">`
return
}

avatar.textContent = name.charAt(0).toUpperCase()
avatar.style.background = post.authorProfile?.accentColor || "#9c4dff"
}

function renderPartnerLink(label, href, type = "ghost") {
if (!href) {
return ""
}

const isExternal = /^https?:\/\//i.test(href)
return `<a class="${type === "primary" ? "btn" : "ghost-btn"}" href="${href}" ${isExternal ? 'target="_blank" rel="noreferrer"' : ""}>${label}</a>`
}

async function loadPartnerPost() {
const postId = getPartnerPostId()

if (!postId) {
window.location.href = "/partnership.html"
return
}

const res = await fetch(`/partnership/posts/${postId}`, {
credentials: "include"
})
const data = await res.json()

if (!res.ok) {
document.querySelector(".partner-post-shell").innerHTML = `<div class="search-empty-state"><span class="hero-kicker">Parceria</span><h3>${data.error || "Parceria nao encontrada"}</h3><a class="ghost-btn" href="/partnership.html">Voltar para parcerias</a></div>`
return
}

const post = data.post
const section = data.section
const primaryLink = post.websiteUrl || post.discordUrl || post.youtubeUrl || ""

document.getElementById("partnerPostTitle").textContent = post.title
document.getElementById("partnerPostSubtitle").textContent = `Conteudo publicado por ${post.authorDisplayName || post.authorUsername}`
document.getElementById("partnerPostSection").textContent = section?.title || "Secao"
document.getElementById("partnerPostDate").textContent = new Date(post.created_at).toLocaleString("pt-BR")
document.getElementById("partnerPostDescription").textContent = post.description
document.getElementById("partnerPostLinks").innerHTML = [
renderPartnerLink(post.ctaLabel || "Abrir link", post.websiteUrl, "primary"),
renderPartnerLink("Discord", post.discordUrl),
renderPartnerLink("YouTube", post.youtubeUrl)
].filter(Boolean).join("")

document.getElementById("partnerPostActions").innerHTML = [
renderPartnerLink("Voltar para lista", "/partnership.html"),
primaryLink ? renderPartnerLink("Acessar conteudo", primaryLink, "primary") : "",
`<a class="ghost-btn" href="/profile.html?id=${post.authorId}">Abrir perfil</a>`
].filter(Boolean).join("")

document.getElementById("partnerAuthorCard").href = `/profile.html?id=${post.authorId}`
document.getElementById("partnerAuthorName").textContent = post.authorDisplayName || post.authorUsername
document.getElementById("partnerAuthorHandle").textContent = `@${post.authorUsername}`
document.getElementById("partnerAuthorBadges").innerHTML = window.getBadgeMarkup?.(post.authorBadges, post.authorRole) || ""
createAuthorAvatar(post)
}

loadPartnerPost()
