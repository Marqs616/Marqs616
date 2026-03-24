let overviewData = null
let userSearchResults = []
let userSearchQuery = ""

function viewerIsAdmin(viewer) {
return Boolean(viewer && (viewer.role === "admin" || viewer.role === "master_admin" || viewer.badges?.adminTag))
}

function modStatusBadge(mod) {
if (mod.approved) {
return `<span class="status-pill approved">Aprovado</span>`
}

return `<span class="status-pill pending">Pendente</span>`
}

function userRoleBadge(user) {
if (user.banned) {
return `<span class="status-pill danger">Banido</span>`
}

if (user.role === "master_admin") {
return `<span class="status-pill master">Master Admin</span>`
}

if (user.role === "admin") {
return `<span class="status-pill approved">Administrador</span>`
}

if (user.badges?.adminTag) {
return `<span class="status-pill approved">Administrador</span>`
}

if (user.role === "partner") {
return `<span class="status-pill pending">Parceiro</span>`
}

if (user.canPost) {
return `<span class="status-pill pending">Postador</span>`
}

return `<span class="status-pill">Usuario</span>`
}

function renderStats(data) {
document.getElementById("usersStat").textContent = data.stats.users
document.getElementById("modsStat").textContent = data.stats.mods
document.getElementById("pendingStat").textContent = data.stats.pendingMods
document.getElementById("downloadsStat").textContent = data.stats.downloads
document.getElementById("partnersStat").textContent = data.stats.partners
document.getElementById("bannedStat").textContent = data.stats.bannedUsers || 0
}

function renderMaintenanceSettings(data) {
const form = document.getElementById("maintenanceForm")
const broadcastForm = document.getElementById("broadcastForm")
const status = document.getElementById("maintenanceStatus")
const messageInput = document.getElementById("maintenanceMessage")
const enableButton = document.getElementById("enableMaintenanceButton")
const disableButton = document.getElementById("disableMaintenanceButton")
const isMaster = data.viewer?.role === "master_admin"
const settings = data.settings || {}

if (!form || !status || !messageInput || !enableButton || !disableButton) {
return
}

form.style.display = isMaster ? "block" : "none"
if (broadcastForm) {
broadcastForm.style.display = isMaster ? "grid" : "none"
}

status.innerHTML = settings.maintenanceMode
? `Modo manutencao <strong>ativo</strong>. Visitantes e usuarios comuns ja recebem a tela de manutencao; a conta master continua entrando normalmente para administracao. Mensagem atual: ${settings.maintenanceMessage || "Sem mensagem personalizada."}`
: "Modo manutencao desativado."

messageInput.value = settings.maintenanceMessage || ""

if (!isMaster) {
status.innerHTML = "Somente o master admin pode alterar esse modo."
}
}

function renderMods(mods) {
const container = document.getElementById("modsAdminList")
container.innerHTML = ""

if (!mods.length) {
container.innerHTML = `<div class="empty-state">Nenhum mod aguardando aprovacao no momento.</div>`
return
}

mods.forEach(mod => {
const block = document.createElement("div")
block.className = "admin-mod"

block.innerHTML = `
<div class="admin-row-head">
<strong>${mod.title}</strong>
${modStatusBadge(mod)}
</div>
<p>${mod.description}</p>
<div class="chip-row">
<span class="chip">Jogo: ${mod.game}</span>
<span class="chip">Autor: ${mod.authorDisplayName || mod.username}</span>
<span class="chip">${mod.downloads || 0} downloads</span>
<span class="chip">${mod.ratingAverage || 0}/5</span>
</div>
<form class="admin-edit-form" data-mod-id="${mod.id}">
<input type="text" name="title" value="${mod.title}">
<textarea name="description" rows="3">${mod.description}</textarea>
<input type="text" name="credits" value="${mod.credits || ""}" placeholder="Creditos">
<select name="game">
<option value="gtasa" ${mod.game === "gtasa" ? "selected" : ""}>GTA SA</option>
<option value="minecraft" ${mod.game === "minecraft" ? "selected" : ""}>Minecraft</option>
<option value="roblox" ${mod.game === "roblox" ? "selected" : ""}>Roblox</option>
<option value="fnf" ${mod.game === "fnf" ? "selected" : ""}>Friday Night Funkin</option>
<option value="gtav" ${mod.game === "gtav" ? "selected" : ""}>GTA V</option>
</select>
<div class="admin-actions">
<button class="ghost-btn" type="submit">Salvar edicao</button>
<button class="btn" type="button" data-action="approve" data-id="${mod.id}">Aprovar</button>
<button class="danger-btn" type="button" data-action="delete" data-id="${mod.id}">Excluir</button>
</div>
</form>
`

container.appendChild(block)
})
}

function renderUsers(users, viewer) {
const container = document.getElementById("usersAdminList")
const hint = document.getElementById("adminUserSearchHint")
container.innerHTML = ""

if (!userSearchQuery.trim()) {
if (hint) {
hint.textContent = "Digite algo para buscar usuarios da plataforma."
hint.style.display = "block"
}
return
}

if (hint) {
hint.style.display = "none"
}

if (!users.length) {
container.innerHTML = `<div class="search-empty-state"><h3>Ninguem encontrado</h3><p>Nenhum usuario combina com "${userSearchQuery}". Tente outro trecho do nome, @usuario ou e-mail.</p></div>`
return
}

users.forEach(user => {
const block = document.createElement("div")
block.className = "user-row admin-user-card"
const canManageRole = viewer.role === "master_admin" && user.role !== "master_admin"
const canManageBooster = viewerIsAdmin(viewer) && user.role !== "master_admin"
const canSeeSecurity = viewer.role === "master_admin"

block.innerHTML = `
<div class="user-row-head">
<div class="admin-user-identity">
<strong>${user.profile.displayName || user.username}</strong>
<span class="admin-user-handle">@${user.username}</span>
</div>
${userRoleBadge(user)}
</div>
<div class="chip-row">
<span class="chip">Mods: ${user.stats.mods}</span>
<span class="chip">Seguidores: ${user.stats.followers}</span>
<span class="chip">Downloads: ${user.stats.downloads}</span>
${user.recoveryAuthorized ? `<span class="chip active">Recuperacao liberada ate ${new Date(user.recoveryExpiresAt).toLocaleString("pt-BR")}</span>` : ""}
${canSeeSecurity ? `<span class="chip">IPs confiaveis: ${user.security?.trustedIpsCount || 0}</span>` : ""}
${canSeeSecurity ? `<span class="chip">Dispositivos confiaveis: ${user.security?.trustedDevicesCount || 0}</span>` : ""}
${canSeeSecurity && user.security?.registeredIp ? `<span class="chip">IP de cadastro: ${user.security.registeredIp}</span>` : ""}
${canSeeSecurity && user.security?.lastLoginIp ? `<span class="chip">Ultimo IP: ${user.security.lastLoginIp}</span>` : ""}
${canSeeSecurity && user.security?.securityBypassUntil ? `<span class="chip active">Novo dispositivo liberado ate ${new Date(user.security.securityBypassUntil).toLocaleString("pt-BR")}</span>` : ""}
${canSeeSecurity && user.security?.lastBlockedIp ? `<span class="chip danger">IP bloqueado: ${user.security.lastBlockedIp}</span>` : ""}
${canSeeSecurity && user.security?.lastBlockedAt ? `<span class="chip">Bloqueio em: ${new Date(user.security.lastBlockedAt).toLocaleString("pt-BR")}</span>` : ""}
${user.banned ? `<span class="chip">Motivo: ${user.banReason || "Sem motivo"}</span>` : ""}
</div>
<div class="admin-actions">
<button class="ghost-btn" type="button" data-action="toggle-post" data-id="${user.id}" data-value="${!user.canPost}">
${user.canPost ? "Remover postador" : "Liberar postagem"}
</button>
${canManageRole ? `
<button class="btn" type="button" data-action="set-role" data-id="${user.id}" data-role="${user.role === "admin" ? "user" : "admin"}">${user.role === "admin" ? "Remover admin" : "Tornar admin"}</button>
<button class="ghost-btn" type="button" data-action="set-role" data-id="${user.id}" data-role="${user.role === "partner" ? "user" : "partner"}">${user.role === "partner" ? "Remover parceiro" : "Tornar parceiro"}</button>
<button class="${user.banned ? "ghost-btn" : "danger-btn"}" type="button" data-action="toggle-ban" data-id="${user.id}" data-value="${user.banned ? "false" : "true"}">${user.banned ? "Desbanir" : "Banir"}</button>
<button class="ghost-btn" type="button" data-action="toggle-verified" data-id="${user.id}" data-value="${user.badges?.verified ? "false" : "true"}">${user.badges?.verified ? "Remover verificado" : "Dar verificado"}</button>
<button class="ghost-btn" type="button" data-action="toggle-owner-tag" data-id="${user.id}" data-value="${user.badges?.ownerTag ? "false" : "true"}">${user.badges?.ownerTag ? "Remover dono" : "Tag dono"}</button>
<button class="ghost-btn" type="button" data-action="toggle-admin-tag" data-id="${user.id}" data-value="${user.badges?.adminTag ? "false" : "true"}">${user.badges?.adminTag ? "Remover tag admin" : "Tag admin"}</button>
<button class="ghost-btn" type="button" data-action="toggle-recovery-access" data-id="${user.id}" data-value="${user.recoveryAuthorized ? "false" : "true"}">${user.recoveryAuthorized ? "Encerrar recuperacao" : "Liberar troca de senha"}</button>
<button class="ghost-btn" type="button" data-action="toggle-security-bypass" data-id="${user.id}" data-value="${user.security?.securityBypassUntil ? "false" : "true"}">${user.security?.securityBypassUntil ? "Encerrar novo dispositivo" : "Liberar novo dispositivo"}</button>
${user.security?.lastBlockedIp ? `<button class="btn" type="button" data-action="authorize-ip" data-id="${user.id}">Autorizar IP bloqueado</button>` : ""}
` : ""}
${canManageBooster ? `<button class="ghost-btn" type="button" data-action="toggle-booster" data-id="${user.id}" data-value="${user.badges?.booster ? "false" : "true"}">${user.badges?.booster ? "Remover booster" : "Dar booster"}</button>` : ""}
<a class="ghost-btn" href="/profile.html?id=${user.id}">Abrir perfil</a>
</div>
`

container.appendChild(block)
})
}

function renderPartnerSections(sections, viewer) {
const container = document.getElementById("partnerSectionsList")
container.innerHTML = ""

if (!sections.length) {
container.innerHTML = `<div class="empty-state">Nenhuma secao de parceria criada.</div>`
return
}

sections.forEach(section => {
const block = document.createElement("div")
block.className = "admin-mod"
const canEdit = viewer.role === "master_admin"

block.innerHTML = `
<div class="admin-row-head">
<strong>${section.title}</strong>
<span class="status-pill ${section.active === false ? "" : "approved"}">${section.active === false ? "Inativa" : "Ativa"}</span>
</div>
<p>${section.description || "Sem descricao."}</p>
<div class="chip-row">
<span class="chip">${section.postsCount || 0} posts</span>
</div>
${canEdit ? `
<form class="partner-section-edit-form" data-section-id="${section.id}">
<input type="text" name="title" value="${section.title}">
<textarea name="description" rows="3">${section.description || ""}</textarea>
<div class="inline-actions">
<button class="ghost-btn" type="submit">Salvar</button>
<button class="btn" type="button" data-action="toggle-partner-section" data-id="${section.id}" data-active="${section.active === false ? "true" : "false"}">${section.active === false ? "Ativar" : "Desativar"}</button>
</div>
</form>
` : ""}
`

container.appendChild(block)
})
}

function renderPartnerPosts(posts) {
const container = document.getElementById("partnerPostsList")
container.innerHTML = ""

if (!posts.length) {
container.innerHTML = `<div class="empty-state">Nenhum post de parceiro ainda.</div>`
return
}

posts.forEach(post => {
const block = document.createElement("div")
block.className = "admin-mod"
block.innerHTML = `
<div class="admin-row-head">
<strong>${post.title}</strong>
<span class="chip">${post.authorDisplayName || post.authorUsername}</span>
</div>
<p>${post.description}</p>
<div class="chip-row">
<span class="chip">Discord: ${post.discordUrl ? "sim" : "nao"}</span>
<span class="chip">Site: ${post.websiteUrl ? "sim" : "nao"}</span>
<span class="chip">YouTube: ${post.youtubeUrl ? "sim" : "nao"}</span>
</div>
`
container.appendChild(block)
})
}

async function loadOverview() {
const res = await fetch("/admin/overview", {
credentials: "include"
})

const data = await res.json()

if (!res.ok) {
document.querySelector(".admin-shell").innerHTML = `<div class="empty-state">${data.error || "Acesso negado ao painel admin."}</div>`
return
}

overviewData = data
renderStats(data)
renderMods(data.pendingMods || [])
renderUsers(userSearchResults, data.viewer)
renderPartnerSections(data.partnership.sections, data.viewer)
renderPartnerPosts(data.partnership.posts)
renderMaintenanceSettings(data)
}

async function searchUsers(query) {
userSearchQuery = String(query || "").trim()

if (!userSearchQuery) {
userSearchResults = []
renderUsers([], overviewData?.viewer || {})
return
}

const res = await fetch(`/admin/users/search?q=${encodeURIComponent(userSearchQuery)}`, {
credentials: "include"
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel buscar usuarios", "error", "Painel admin")
return
}

userSearchResults = data.items || []
renderUsers(userSearchResults, overviewData?.viewer || {})
}

document.addEventListener("submit", async event => {
const form = event.target

if (form.matches("#adminUserSearchForm")) {
event.preventDefault()
await searchUsers(document.getElementById("adminUserSearchInput")?.value || "")
return
}

if (form.matches(".admin-edit-form")) {
event.preventDefault()

const id = form.dataset.modId
const payload = {
title: form.title.value,
description: form.description.value,
credits: form.credits.value,
game: form.game.value
}

const res = await fetch(`/admin/mod/${id}`, {
method: "PUT",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify(payload)
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao editar mod", "error", "Painel admin")
return
}

window.showToast?.("Mod atualizado com sucesso.", "success", "Painel admin")
await loadOverview()
return
}

if (form.matches("#partnerSectionForm")) {
event.preventDefault()

const res = await fetch("/master/partner-sections", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify({
title: document.getElementById("partnerSectionTitle").value,
description: document.getElementById("partnerSectionDescription").value
})
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao criar secao", "error", "Painel admin")
return
}

form.reset()
window.showToast?.("Secao criada com sucesso.", "success", "Painel admin")
await loadOverview()
return
}

if (form.matches(".partner-section-edit-form")) {
event.preventDefault()

const id = form.dataset.sectionId
const res = await fetch(`/master/partner-sections/${id}`, {
method: "PATCH",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify({
title: form.title.value,
description: form.description.value
})
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Erro ao atualizar secao", "error", "Painel admin")
return
}

window.showToast?.("Secao atualizada com sucesso.", "success", "Painel admin")
await loadOverview()
return
}

if (form.matches("#broadcastForm")) {
event.preventDefault()

const res = await fetch("/master/broadcast", {
method: "POST",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify({
title: document.getElementById("broadcastTitle").value,
message: document.getElementById("broadcastMessage").value,
link: document.getElementById("broadcastLink").value
})
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel enviar o aviso global", "error", "Painel admin")
return
}

form.reset()
document.getElementById("broadcastLink").value = "/"
window.loadNotifications?.()
window.showToast?.(data.message || "Aviso enviado", "success", "Painel admin")
}
})

document.getElementById("enableMaintenanceButton")?.addEventListener("click", async () => {
const message = document.getElementById("maintenanceMessage")?.value || ""
const res = await fetch("/master/site-settings", {
method: "PATCH",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify({
maintenanceMode: true,
maintenanceMessage: message
})
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel ativar a manutencao", "error", "Painel admin")
return
}

window.showToast?.(data.message || "Modo manutencao ativado", "success", "Painel admin")
await loadOverview()
})

document.getElementById("disableMaintenanceButton")?.addEventListener("click", async () => {
const message = document.getElementById("maintenanceMessage")?.value || ""
const res = await fetch("/master/site-settings", {
method: "PATCH",
headers: {
"Content-Type": "application/json"
},
credentials: "include",
body: JSON.stringify({
maintenanceMode: false,
maintenanceMessage: message
})
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel desativar a manutencao", "error", "Painel admin")
return
}

window.showToast?.(data.message || "Modo manutencao desativado", "success", "Painel admin")
await loadOverview()
})

document.addEventListener("click", async event => {
const action = event.target.dataset.action
const id = event.target.dataset.id

if (!action || !id) {
return
}

let endpoint = ""
let method = "POST"
let payload = null

if (action === "approve") {
endpoint = `/admin/approve/${id}`
}

if (action === "delete") {
endpoint = `/admin/delete/${id}`
method = "DELETE"
}

if (action === "toggle-post") {
endpoint = `/admin/users/${id}/post-access`
method = "PATCH"
payload = { canPost: event.target.dataset.value === "true" }
}

if (action === "toggle-recovery-access") {
endpoint = `/master/users/${id}/recovery-access`
method = "PATCH"
payload = { enabled: event.target.dataset.value === "true" }
}

if (action === "toggle-security-bypass") {
endpoint = `/master/users/${id}/security-bypass`
method = "PATCH"
payload = { enabled: event.target.dataset.value === "true" }
}

if (action === "authorize-ip") {
endpoint = `/master/users/${id}/authorize-ip`
method = "PATCH"
payload = {}
}

if (action === "set-role") {
endpoint = `/master/users/${id}/role`
method = "PATCH"
payload = { role: event.target.dataset.role }
}

if (action === "toggle-partner-section") {
endpoint = `/master/partner-sections/${id}`
method = "PATCH"
payload = { active: event.target.dataset.active === "true" }
}

if (action === "toggle-ban") {
endpoint = `/master/users/${id}/ban`
method = "PATCH"
payload = {
banned: event.target.dataset.value === "true",
reason: event.target.dataset.value === "true" ? "Violacao das regras da plataforma" : ""
}
}

if (action === "toggle-booster") {
endpoint = `/admin/users/${id}/badges`
method = "PATCH"
payload = { booster: event.target.dataset.value === "true" }
}

if (action === "toggle-verified") {
endpoint = `/admin/users/${id}/badges`
method = "PATCH"
payload = { verified: event.target.dataset.value === "true" }
}

if (action === "toggle-owner-tag") {
endpoint = `/admin/users/${id}/badges`
method = "PATCH"
payload = { ownerTag: event.target.dataset.value === "true" }
}

if (action === "toggle-admin-tag") {
endpoint = `/admin/users/${id}/badges`
method = "PATCH"
payload = { adminTag: event.target.dataset.value === "true" }
}

const res = await fetch(endpoint, {
method,
headers: payload ? { "Content-Type": "application/json" } : undefined,
credentials: "include",
body: payload ? JSON.stringify(payload) : undefined
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel concluir a acao", "error", "Painel admin")
return
}

window.showToast?.(data.message || "Acao concluida.", "success", "Painel admin")
await loadOverview()

if (userSearchQuery.trim()) {
await searchUsers(userSearchQuery)
}
})

loadOverview()
