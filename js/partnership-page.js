let partnershipState = {
viewer: null,
sections: [],
posts: [],
activeSectionId: null
}

function getPrimaryPartnerLink(post) {
return post.websiteUrl || post.discordUrl || post.youtubeUrl || ""
}

function renderSectionTabs() {
const tabs = document.getElementById("sectionTabs")
const select = document.getElementById("partnerSectionSelect")

tabs.innerHTML = ""
select.innerHTML = ""

if (!partnershipState.sections.length) {
tabs.innerHTML = `<div class="empty-state">A secao principal vai aparecer automaticamente aqui.</div>`
select.innerHTML = `<option value="">Geral</option>`
return
}

partnershipState.sections.forEach((section, index) => {
const button = document.createElement("button")
button.className = `tab-button ${partnershipState.activeSectionId == section.id || (!partnershipState.activeSectionId && index === 0) ? "active" : ""}`
button.type = "button"
button.textContent = section.title
button.addEventListener("click", () => {
partnershipState.activeSectionId = section.id
renderSectionTabs()
renderPosts()
})
tabs.appendChild(button)

const option = document.createElement("option")
option.value = section.id
option.textContent = section.title
select.appendChild(option)
})

if (!partnershipState.activeSectionId) {
partnershipState.activeSectionId = partnershipState.sections[0].id
}

select.value = String(partnershipState.activeSectionId)
}

function renderStats() {
document.getElementById("sectionsCount").textContent = partnershipState.sections.length
document.getElementById("postsCount").textContent = partnershipState.posts.length
document.getElementById("partnersCount").textContent = new Set(partnershipState.posts.map(post => post.userId)).size
}

function renderPosts() {
const container = document.getElementById("partnerPostsList")
container.innerHTML = ""

const posts = partnershipState.posts.filter(post => !partnershipState.activeSectionId || post.sectionId == partnershipState.activeSectionId)

if (!posts.length) {
container.innerHTML = `<div class="empty-state">Nenhum conteudo de parceria publicado nessa secao ainda.</div>`
return
}

posts.forEach(post => {
const links = [
post.discordUrl ? `<a class="ghost-btn" href="${post.discordUrl}" target="_blank" rel="noreferrer">Discord</a>` : "",
post.websiteUrl ? `<a class="btn" href="${post.websiteUrl}" target="_blank" rel="noreferrer">${post.ctaLabel || "Abrir link"}</a>` : "",
post.youtubeUrl ? `<a class="ghost-btn" href="${post.youtubeUrl}" target="_blank" rel="noreferrer">YouTube</a>` : ""
].filter(Boolean).join("")
const primaryLink = getPrimaryPartnerLink(post)
const managementActions = post.canManage ? `
<div class="spotlight-actions" style="margin-top:14px">
<a class="ghost-btn" href="/partner-post.html?id=${post.id}">Abrir parceria</a>
${primaryLink ? `<a class="ghost-btn" href="${primaryLink}" target="_blank" rel="noreferrer">Acessar conteudo</a>` : ""}
<button class="danger-btn" type="button" data-action="delete-partner-post" data-id="${post.id}">Excluir parceria</button>
</div>
` : `<div class="spotlight-actions" style="margin-top:14px">
<a class="ghost-btn" href="/partner-post.html?id=${post.id}">Abrir parceria</a>
${primaryLink ? `<a class="ghost-btn" href="${primaryLink}" target="_blank" rel="noreferrer">Acessar conteudo</a>` : ""}
</div>`

const card = document.createElement("article")
card.className = "mod-showcase"
card.innerHTML = `
<div class="mod-showcase-media" style="background-image:linear-gradient(135deg, rgba(106,0,255,.32), rgba(156,77,255,.1))"></div>
<div class="mod-showcase-body">
<div class="chip-row">
<span class="chip">${partnershipState.sections.find(section => section.id == post.sectionId)?.title || "Secao"}</span>
<span class="chip">${post.authorRole === "partner" ? "Parceiro" : post.authorRole}</span>
</div>
<div>
<h3>${post.title}</h3>
<p>${post.description}</p>
</div>
<div class="meta-line">
<a class="inline-profile-link" href="/profile.html?id=${post.authorId}">Por ${post.authorDisplayName || post.authorUsername}</a>
<span>${new Date(post.created_at).toLocaleDateString("pt-BR")}</span>
</div>
<div class="spotlight-actions">${links}</div>
${managementActions}
</div>
`

container.appendChild(card)
})
}

function applyPermissionState() {
const hint = document.getElementById("partnerPermissionHint")
const form = document.getElementById("partnerPostForm")
const canPost = partnershipState.viewer && partnershipState.viewer.isPartner

hint.textContent = canPost
? "Sua conta tem cargo para publicar nessa area."
: "Somente contas com cargo de parceiro, admin ou master admin podem publicar aqui."

Array.from(form.elements).forEach(element => {
if (element.tagName === "BUTTON") {
element.disabled = !canPost
return
}

element.disabled = !canPost
})
}

async function loadPartnershipOverview() {
const res = await fetch("/partnership/overview", {
credentials: "include"
})

const data = await res.json()
partnershipState = {
viewer: data.viewer,
sections: data.sections || [],
posts: data.posts || [],
activeSectionId: partnershipState.activeSectionId
}

renderSectionTabs()
renderStats()
renderPosts()
applyPermissionState()
}

document.getElementById("partnerPostForm").addEventListener("submit", async event => {
event.preventDefault()

const payload = {
sectionId: document.getElementById("partnerSectionSelect").value,
title: document.getElementById("partnerTitle").value,
description: document.getElementById("partnerDescription").value,
discordUrl: document.getElementById("partnerDiscordUrl").value,
websiteUrl: document.getElementById("partnerWebsiteUrl").value,
youtubeUrl: document.getElementById("partnerYoutubeUrl").value,
ctaLabel: document.getElementById("partnerCtaLabel").value
}

const res = await fetch("/partnership/posts", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify(payload)
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao publicar parceria", "error", "Parcerias")
return
}

window.showToast?.(data.message || "Conteudo publicado", "success", "Parcerias")
event.target.reset()
await loadPartnershipOverview()
})

document.addEventListener("click", async event => {
const button = event.target.closest("[data-action='delete-partner-post']")

if (!button) {
return
}

const postId = button.dataset.id
const confirmed = await window.showConfirmModal?.({
title: "Excluir parceria",
message: "Quer mesmo apagar esse conteudo de parceria?"
})

if (!confirmed) {
return
}

const res = await fetch(`/partnership/posts/${postId}`, {
method: "DELETE",
credentials: "include"
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel excluir a parceria", "error", "Parcerias")
return
}

window.showToast?.(data.message || "Parceria excluida", "success", "Parcerias")
await loadPartnershipOverview()
})

loadPartnershipOverview()
