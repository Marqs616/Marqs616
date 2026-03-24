const state = {
status: null,
conversations: [],
activeConversationId: null,
loading: false
}

const elements = {
statusPill: document.getElementById("aiStatusPill"),
conversationList: document.getElementById("aiConversationList"),
conversationTitle: document.getElementById("aiConversationTitle"),
conversationMeta: document.getElementById("aiConversationMeta"),
chatFeed: document.getElementById("aiChatFeed"),
composer: document.getElementById("aiComposer"),
composerInput: document.getElementById("aiComposerInput"),
sendButton: document.getElementById("aiSendButton"),
newConversationButton: document.getElementById("newConversationButton"),
deleteConversationButton: document.getElementById("deleteConversationButton")
}

function enforceAiTheme() {
const styleId = "ai-theme-force"
let style = document.getElementById(styleId)

if (!style) {
style = document.createElement("style")
style.id = styleId
document.head.appendChild(style)
}

style.textContent = `
body.ai-page,
body.ai-page::before,
body.ai-page::after,
body.ai-page main,
body.ai-page .ai-shell,
body.ai-page .ai-layout {
background: #020203 !important;
background-image: none !important;
}

body.ai-page .navbar {
background: linear-gradient(180deg, rgba(14, 11, 22, 0.98), rgba(8, 8, 14, 0.98)) !important;
}

body.ai-page .ai-hero,
body.ai-page .ai-sidebar,
body.ai-page .ai-chat,
body.ai-page .ai-chat-feed,
body.ai-page .ai-composer,
body.ai-page .ai-message-card,
body.ai-page .ai-message-user .ai-message-card,
body.ai-page .ai-conversation-item,
body.ai-page .ai-suggestion-list .quick-filter {
background-image: none !important;
}
`

document.body.style.setProperty("background", "#05050a", "important")
document.body.style.setProperty("background-image", "none", "important")

const panels = document.querySelectorAll(".ai-hero, .ai-sidebar, .ai-chat")
panels.forEach(element => {
element.style.setProperty("background", "#0b0b12", "important")
element.style.setProperty("background-image", "none", "important")
element.style.setProperty("border-color", "rgba(156, 77, 255, 0.18)", "important")
element.style.setProperty("box-shadow", "0 0 0 1px rgba(156, 77, 255, 0.06) inset, 0 18px 45px rgba(0, 0, 0, 0.42)", "important")
})

const innerCards = document.querySelectorAll(".ai-chat-feed, .ai-composer, .ai-message-card, .ai-conversation-item, .ai-suggestion-list .quick-filter")
innerCards.forEach(element => {
element.style.setProperty("background", "#14141d", "important")
element.style.setProperty("background-image", "none", "important")
element.style.setProperty("border-color", "rgba(156, 77, 255, 0.12)", "important")
element.style.setProperty("box-shadow", "none", "important")
})

document.querySelectorAll(".ai-conversation-item.active, .ai-conversation-item:hover, .ai-suggestion-list .quick-filter:hover").forEach(element => {
element.style.setProperty("background", "#1a1a25", "important")
})

document.querySelectorAll(".ai-message-badge, .ai-message-user .ai-message-badge, .ai-sidebar .btn, .ai-chat .btn").forEach(element => {
element.style.setProperty("background", "linear-gradient(135deg, #6a00ff, #9c4dff)", "important")
element.style.setProperty("color", "#f8f1ff", "important")
})

document.querySelectorAll(".ai-chat .ghost-btn").forEach(element => {
element.style.setProperty("background", "#14141d", "important")
element.style.setProperty("border-color", "rgba(156, 77, 255, 0.16)", "important")
element.style.setProperty("color", "#eadbff", "important")
})

const statusPill = document.getElementById("aiStatusPill")
if (statusPill) {
statusPill.style.setProperty("background", "#14141d", "important")
statusPill.style.setProperty("border-color", "rgba(156, 77, 255, 0.18)", "important")
statusPill.style.setProperty("color", "#eadbff", "important")
}
}

function formatDate(value) {
if (!value) {
return ""
}

return new Date(value).toLocaleString("pt-BR", {
day: "2-digit",
month: "2-digit",
hour: "2-digit",
minute: "2-digit"
})
}

function escapeHtml(value) {
return String(value || "")
.replace(/&/g, "&amp;")
.replace(/</g, "&lt;")
.replace(/>/g, "&gt;")
.replace(/"/g, "&quot;")
}

function renderStatus() {
if (!elements.statusPill) {
return
}

if (!state.status) {
elements.statusPill.textContent = "Conectando..."
return
}

if (state.status.configured) {
elements.statusPill.textContent = `Online com ${state.status.model || "modelo configurado"}`
elements.statusPill.classList.remove("error")
return
}

elements.statusPill.textContent = "Modo local ativo"
elements.statusPill.classList.add("error")
}

function getActiveConversation() {
return state.conversations.find(item => item.id === state.activeConversationId) || null
}

function renderConversationList() {
elements.conversationList.innerHTML = ""

if (!state.conversations.length) {
elements.conversationList.innerHTML = `<div class="empty-state">Nenhuma conversa ainda. Comece pedindo uma recomendacao ou ajuda para postar.</div>`
return
}

state.conversations.forEach(conversation => {
const button = document.createElement("button")
button.type = "button"
button.className = `ai-conversation-item${conversation.id === state.activeConversationId ? " active" : ""}`
button.dataset.id = conversation.id
button.innerHTML = `
<strong>${escapeHtml(conversation.title || "Nova conversa")}</strong>
<span>${escapeHtml(conversation.lastMessage?.content || "Sem mensagens ainda").slice(0, 90)}</span>
<small>${formatDate(conversation.updatedAt)}</small>
`
button.addEventListener("click", () => loadConversation(conversation.id))
elements.conversationList.appendChild(button)
})
}

function renderMessages() {
const conversation = getActiveConversation()
elements.chatFeed.innerHTML = ""

if (!conversation || !Array.isArray(conversation.messages) || !conversation.messages.length) {
elements.chatFeed.innerHTML = `
<article class="ai-message ai-message-assistant">
<div class="ai-message-badge">AI</div>
<div class="ai-message-card">
<strong>DRXZ AI</strong>
<p>Me chama para encontrar mods, explicar regras, orientar postagem, sugerir ideias ou resumir recursos do site.</p>
</div>
</article>
`
elements.conversationTitle.textContent = "Nova conversa"
elements.conversationMeta.textContent = "Fale com a assistente do DRXZ MODS."
elements.deleteConversationButton.disabled = true
return
}

elements.conversationTitle.textContent = conversation.title || "Conversa"
elements.conversationMeta.textContent = `${conversation.messages.length} mensagens • atualizada em ${formatDate(conversation.updatedAt)}`
elements.deleteConversationButton.disabled = false

conversation.messages.forEach(message => {
const article = document.createElement("article")
article.className = `ai-message ${message.role === "user" ? "ai-message-user" : "ai-message-assistant"}`
article.innerHTML = `
<div class="ai-message-badge">${message.role === "user" ? "VOCE" : "AI"}</div>
<div class="ai-message-card">
<strong>${message.role === "user" ? "Voce" : "DRXZ AI"}</strong>
<p>${escapeHtml(message.content).replace(/\n/g, "<br>")}</p>
${message.model ? `<small>${escapeHtml(message.model)}</small>` : ""}
</div>
`
elements.chatFeed.appendChild(article)
})

elements.chatFeed.scrollTop = elements.chatFeed.scrollHeight
}

async function request(url, options = {}) {
const response = await fetch(url, {
credentials: "include",
headers: {
...(options.body ? { "Content-Type": "application/json" } : {})
},
...options
})

const data = await response.json().catch(() => ({}))

if (!response.ok) {
throw new Error(data.error || "Nao foi possivel concluir a operacao")
}

return data
}

async function loadStatus() {
state.status = await request("/api/ai/status")
renderStatus()
}

async function loadConversations(selectId = "") {
const data = await request("/api/ai/conversations")
state.conversations = data.items || []

if (selectId) {
state.activeConversationId = selectId
} else if (!state.activeConversationId && state.conversations.length) {
state.activeConversationId = state.conversations[0].id
}

renderConversationList()

if (state.activeConversationId) {
await loadConversation(state.activeConversationId, false)
} else {
renderMessages()
}
}

async function loadConversation(id, refreshList = true) {
const data = await request(`/api/ai/conversations/${id}`)
const index = state.conversations.findIndex(item => item.id === id)

if (index >= 0) {
state.conversations[index] = data.conversation
} else {
state.conversations.unshift(data.conversation)
}

state.activeConversationId = data.conversation.id

if (refreshList) {
renderConversationList()
}

renderMessages()
}

function getPageContext() {
return {
page: "ai",
path: window.location.pathname,
title: document.title
}
}

function setLoading(loading) {
state.loading = loading
elements.sendButton.disabled = loading
elements.composerInput.disabled = loading
elements.sendButton.textContent = loading ? "Pensando..." : "Enviar"
}

async function createConversation(prefill = "") {
const data = await request("/api/ai/conversations", {
method: "POST",
body: JSON.stringify({
title: prefill || "Nova conversa",
firstMessage: prefill || "",
pageContext: getPageContext()
})
})

state.conversations.unshift(data.conversation)
state.activeConversationId = data.conversation.id
renderConversationList()
renderMessages()

if (prefill) {
elements.composerInput.value = prefill
}
}

async function sendMessage(message) {
setLoading(true)

try {
const data = await request("/api/ai/chat", {
method: "POST",
body: JSON.stringify({
conversationId: state.activeConversationId,
message,
pageContext: getPageContext()
})
})

await loadConversations(data.conversation.id)
elements.composerInput.value = ""
} catch (error) {
window.showToast?.(error.message, "error", "DRXZ AI")
} finally {
setLoading(false)
elements.composerInput.focus()
}
}

async function deleteConversation() {
const active = getActiveConversation()

if (!active) {
return
}

const confirmed = await window.showConfirm?.({
title: "Apagar conversa",
message: "Essa conversa sera removida do historico desta conta.",
confirmLabel: "Apagar",
cancelLabel: "Cancelar"
})

if (!confirmed) {
return
}

try {
await request(`/api/ai/conversations/${active.id}`, { method: "DELETE" })
state.conversations = state.conversations.filter(item => item.id !== active.id)
state.activeConversationId = state.conversations[0]?.id || null
renderConversationList()

if (state.activeConversationId) {
await loadConversation(state.activeConversationId, false)
} else {
renderMessages()
}
} catch (error) {
window.showToast?.(error.message, "error", "DRXZ AI")
}
}

elements.composer?.addEventListener("submit", async event => {
event.preventDefault()

const message = elements.composerInput.value.trim()

if (!message) {
window.showToast?.("Escreva uma mensagem antes de enviar.", "info", "DRXZ AI")
return
}

if (!state.activeConversationId) {
await createConversation(message)
}

await sendMessage(message)
})

elements.newConversationButton?.addEventListener("click", async () => {
await createConversation("")
elements.composerInput.focus()
})

elements.deleteConversationButton?.addEventListener("click", deleteConversation)

document.querySelectorAll("[data-prompt]").forEach(button => {
button.addEventListener("click", () => {
elements.composerInput.value = button.dataset.prompt || ""
elements.composerInput.focus()
})
})

async function bootstrap() {
try {
enforceAiTheme()
await loadStatus()
await loadConversations()
} catch (error) {
window.showToast?.(error.message, "error", "DRXZ AI")
renderMessages()
}
}

bootstrap()
