const express = require("express")
const bcrypt = require("bcryptjs")
const session = require("express-session")
const multer = require("multer")
const cors = require("cors")
const crypto = require("crypto")
const fs = require("fs")
const path = require("path")

loadEnvFile()

const app = express()
const PORT = Number(process.env.PORT) || 3000
const MASTER_USERNAME = "drax"
const OAUTH_HANDOFF_SECRET = process.env.OAUTH_HANDOFF_SECRET || "drxz-oauth-handoff-secret"
const PUBLIC_BASE_URL = String(process.env.PUBLIC_BASE_URL || `http://localhost:${PORT}`).replace(/\/+$/, "")
const DATA_DIR = path.resolve(process.env.DATA_DIR || __dirname)
const uploadsDir = path.resolve(process.env.UPLOADS_DIR || path.join(DATA_DIR, "uploads"))
const sessionsFile = path.join(DATA_DIR, "sessions.json")
const siteSettingsFile = path.join(DATA_DIR, "site-settings.json")
const aiConversationsFile = path.join(DATA_DIR, "ai-conversations.json")
const ACCOUNT_RECOVERY_WINDOW_MS = 1000 * 60 * 60

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const usersFile = path.join(DATA_DIR, "users.json")
const modsFile = path.join(DATA_DIR, "mods.json")
const commentsFile = path.join(DATA_DIR, "comments.json")
const ratingsFile = path.join(DATA_DIR, "ratings.json")
const favoritesFile = path.join(DATA_DIR, "favorites.json")
const followsFile = path.join(DATA_DIR, "follows.json")
const notificationsFile = path.join(DATA_DIR, "notifications.json")
const partnerSectionsFile = path.join(DATA_DIR, "partner-sections.json")
const partnerPostsFile = path.join(DATA_DIR, "partner-posts.json")

ensureDir(DATA_DIR)
ensureDir(uploadsDir)
bootstrapPersistentData()

function loadEnvFile() {
const envPath = path.join(__dirname, ".env")

if (!fs.existsSync(envPath)) {
return
}

const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/)

lines.forEach(line => {
const trimmed = line.trim()

if (!trimmed || trimmed.startsWith("#")) {
return
}

const separatorIndex = trimmed.indexOf("=")

if (separatorIndex === -1) {
return
}

const key = trimmed.slice(0, separatorIndex).trim()
let value = trimmed.slice(separatorIndex + 1).trim()

if (!key || process.env[key]) {
return
}

if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
value = value.slice(1, -1)
}

process.env[key] = value
})
}

function ensureDir(dirPath) {
if (!fs.existsSync(dirPath)) {
fs.mkdirSync(dirPath, { recursive: true })
}
}

function copyFileIfMissing(source, target) {
if (!fs.existsSync(source) || fs.existsSync(target)) {
return
}

ensureDir(path.dirname(target))
fs.copyFileSync(source, target)
}

function copyDirectoryContentsIfMissing(sourceDir, targetDir) {
if (!fs.existsSync(sourceDir)) {
return
}

ensureDir(targetDir)

const items = fs.readdirSync(sourceDir, { withFileTypes: true })
items.forEach(item => {
const sourcePath = path.join(sourceDir, item.name)
const targetPath = path.join(targetDir, item.name)

if (item.isDirectory()) {
copyDirectoryContentsIfMissing(sourcePath, targetPath)
return
}

if (!fs.existsSync(targetPath)) {
fs.copyFileSync(sourcePath, targetPath)
}
})
}

function bootstrapPersistentData() {
const legacyRootFiles = [
["users.json", usersFile],
["mods.json", modsFile],
["comments.json", commentsFile],
["ratings.json", ratingsFile],
["favorites.json", favoritesFile],
["follows.json", followsFile],
["notifications.json", notificationsFile],
["partner-sections.json", partnerSectionsFile],
["partner-posts.json", partnerPostsFile],
["sessions.json", sessionsFile],
["site-settings.json", siteSettingsFile],
["ai-conversations.json", aiConversationsFile]
]

legacyRootFiles.forEach(([legacyName, targetPath]) => {
const legacyPath = path.join(__dirname, legacyName)
if (path.resolve(targetPath) === path.resolve(legacyPath)) {
return
}

copyFileIfMissing(legacyPath, targetPath)
})

const legacyUploadsDir = path.join(__dirname, "uploads")
if (path.resolve(uploadsDir) !== path.resolve(legacyUploadsDir)) {
copyDirectoryContentsIfMissing(legacyUploadsDir, uploadsDir)
}
}

function readData(file) {
if (!fs.existsSync(file)) {
fs.writeFileSync(file, "[]")
}

return JSON.parse(fs.readFileSync(file, "utf8"))
}

function writeData(file, data) {
fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

function readObjectData(file, fallback = {}) {
if (!fs.existsSync(file)) {
fs.writeFileSync(file, JSON.stringify(fallback, null, 2))
}

try {
const parsed = JSON.parse(fs.readFileSync(file, "utf8"))
return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback
} catch (error) {
return fallback
}
}

function writeObjectData(file, data) {
fs.writeFileSync(file, JSON.stringify(data, null, 2))
}

let users = readData(usersFile)
let mods = readData(modsFile)
let comments = readData(commentsFile)
let ratings = readData(ratingsFile)
let favorites = readData(favoritesFile)
let follows = readData(followsFile)
let notifications = readData(notificationsFile)
let partnerSections = readData(partnerSectionsFile)
let partnerPosts = readData(partnerPostsFile)
let aiConversations = readData(aiConversationsFile)
let siteSettings = readObjectData(siteSettingsFile, {
maintenanceMode: false,
maintenanceMessage: "Estamos fazendo ajustes para deixar a plataforma ainda melhor. Volte em instantes.",
lastAutoBroadcastAt: null,
autoBroadcastCursor: 0
})

class JsonSessionStore extends session.Store {
constructor(file) {
super()
this.file = file
this.sessions = readObjectData(file, {})
}

persist() {
writeObjectData(this.file, this.sessions)
}

get(sid, callback) {
const rawSession = this.sessions[sid]

if (!rawSession) {
return callback(null, null)
}

if (rawSession.cookie?.expires && new Date(rawSession.cookie.expires).getTime() <= Date.now()) {
delete this.sessions[sid]
this.persist()
return callback(null, null)
}

callback(null, rawSession)
}

set(sid, sessionData, callback = () => {}) {
this.sessions[sid] = sessionData
this.persist()
callback(null)
}

destroy(sid, callback = () => {}) {
delete this.sessions[sid]
this.persist()
callback(null)
}

touch(sid, sessionData, callback = () => {}) {
this.sessions[sid] = sessionData
this.persist()
callback(null)
}
}

const sessionStore = new JsonSessionStore(sessionsFile)

app.set("trust proxy", 1)

app.use(session({
secret: "drxz-mods-secret",
resave: false,
saveUninitialized: false,
store: sessionStore,
cookie: {
maxAge: 1000 * 60 * 60 * 24 * 30,
httpOnly: true,
sameSite: "lax",
secure: process.env.NODE_ENV === "production"
}
}))

function destroySessionsForUser(userId, options = {}) {
const exceptSid = options.exceptSid || null
let changed = false

Object.entries(sessionStore.sessions).forEach(([sid, sessionData]) => {
if (exceptSid && sid === exceptSid) {
return
}

if (Number(sessionData?.userId) !== Number(userId)) {
return
}

delete sessionStore.sessions[sid]
changed = true
})

if (changed) {
sessionStore.persist()
}
}

function normalizeComment(comment) {
return {
id: Number(comment.id),
modId: String(comment.modId),
userId: Number(comment.userId),
username: String(comment.username || "usuario").trim(),
text: String(comment.text || "").trim(),
date: comment.date || new Date().toISOString(),
parentId: comment.parentId ? String(comment.parentId) : null,
likes: Array.isArray(comment.likes) ? comment.likes.map(Number).filter(Boolean) : [],
dislikes: Array.isArray(comment.dislikes) ? comment.dislikes.map(Number).filter(Boolean) : []
}
}

function normalizeNotification(notification) {
return {
id: Number(notification.id),
userId: Number(notification.userId),
actorId: notification.actorId ? Number(notification.actorId) : null,
type: String(notification.type || "general"),
title: String(notification.title || "Notificacao"),
message: String(notification.message || "").trim(),
link: String(notification.link || "/"),
read: Boolean(notification.read),
date: notification.date || new Date().toISOString()
}
}

function normalizeUser(user) {
const isMaster = user.username === MASTER_USERNAME

return {
id: user.id,
username: user.username,
email: user.email,
password: user.password,
oauthAccounts: Array.isArray(user.oauthAccounts) ? user.oauthAccounts : [],
role: isMaster ? "master_admin" : (user.role || "user"),
canPost: typeof user.canPost === "boolean" ? user.canPost : isMaster,
banned: Boolean(user.banned),
banReason: user.banReason || "",
banDate: user.banDate || null,
recoveryAuthorized: Boolean(user.recoveryAuthorized),
	recoveryRequestedAt: user.recoveryRequestedAt || null,
	recoveryExpiresAt: user.recoveryExpiresAt || null,
	recoveryToken: user.recoveryToken || "",
	security: {
		registeredIp: String(user.security?.registeredIp || "").trim(),
		trustedIps: Array.isArray(user.security?.trustedIps) ? [...new Set(user.security.trustedIps.map(ip => String(ip || "").trim()).filter(Boolean))].slice(0, 8) : [],
		trustedDevices: Array.isArray(user.security?.trustedDevices) ? [...new Set(user.security.trustedDevices.map(device => String(device || "").trim()).filter(Boolean))].slice(0, 8) : [],
		securityBypassUntil: user.security?.securityBypassUntil || null,
		lastLoginIp: String(user.security?.lastLoginIp || "").trim(),
		lastLoginAt: user.security?.lastLoginAt || null,
		lastDeviceToken: String(user.security?.lastDeviceToken || "").trim()
	},
	badges: {
verified: Boolean(user.badges?.verified),
booster: Boolean(user.badges?.booster),
ownerTag: Boolean(user.badges?.ownerTag || isMaster),
adminTag: Boolean(user.badges?.adminTag)
},
profile: {
displayName: user.profile?.displayName || user.username,
bio: user.profile?.bio || "",
accentColor: user.profile?.accentColor || "#9c4dff",
avatarUrl: user.profile?.avatarUrl || "",
coverUrl: user.profile?.coverUrl || "",
discord: user.profile?.discord || "",
youtube: user.profile?.youtube || "",
instagram: user.profile?.instagram || "",
github: user.profile?.github || "",
location: user.profile?.location || ""
}
}
}

users = users.map(normalizeUser)
writeData(usersFile, users)
comments = comments.map(normalizeComment)
writeData(commentsFile, comments)
notifications = notifications.map(normalizeNotification)
writeData(notificationsFile, notifications)

function nextId(collection) {
return collection.length ? Math.max(...collection.map(item => Number(item.id) || 0)) + 1 : 1
}

function getUserById(id) {
return users.find(user => user.id == id)
}

function getCurrentUser(req) {
return getUserById(req.session.userId)
}

function isBannedUser(user) {
return Boolean(user && user.banned)
}

function isAdminUser(user) {
return Boolean(user && (user.role === "admin" || user.role === "master_admin" || user.badges?.adminTag))
}

function isPartnerUser(user) {
return Boolean(user && (user.role === "partner" || user.role === "admin" || user.role === "master_admin"))
}

function isMasterAdmin(user) {
return Boolean(user && user.role === "master_admin")
}

function canPostMods(user) {
return Boolean(user && (user.canPost || isAdminUser(user)))
}

function getAiActorKey(req) {
const user = getCurrentUser(req)

if (user) {
return `user:${user.id}`
}

if (!req.session.aiGuestId) {
req.session.aiGuestId = crypto.randomUUID()
}

return `guest:${req.session.aiGuestId}`
}

function getAiActorLabel(req) {
const user = getCurrentUser(req)

if (user) {
return user.profile?.displayName || user.username
}

return "Visitante"
}

function getConversationOwner(req) {
const user = getCurrentUser(req)

return {
userId: user ? Number(user.id) : null,
actorKey: getAiActorKey(req)
}
}

function getConversationPreview(conversation) {
return {
id: conversation.id,
title: conversation.title,
createdAt: conversation.createdAt,
updatedAt: conversation.updatedAt,
messageCount: Array.isArray(conversation.messages) ? conversation.messages.length : 0,
lastMessage: Array.isArray(conversation.messages) && conversation.messages.length
? conversation.messages[conversation.messages.length - 1]
: null,
pageContext: conversation.pageContext || null
}
}

function getConversationForRequest(req, conversationId) {
const owner = getConversationOwner(req)

return aiConversations.find(conversation => {
if (String(conversation.id) !== String(conversationId)) {
return false
}

if (owner.userId && Number(conversation.userId) === owner.userId) {
return true
}

return conversation.actorKey === owner.actorKey
})
}

function createAiConversation(req, options = {}) {
const owner = getConversationOwner(req)
const now = new Date().toISOString()
const titleSource = String(options.title || options.firstMessage || "Nova conversa").trim()
const title = titleSource.length > 60 ? `${titleSource.slice(0, 57)}...` : titleSource
const conversation = {
id: crypto.randomUUID(),
userId: owner.userId,
actorKey: owner.actorKey,
title: title || "Nova conversa",
createdAt: now,
updatedAt: now,
pageContext: options.pageContext || null,
messages: []
}

aiConversations.unshift(conversation)
writeData(aiConversationsFile, aiConversations)
return conversation
}

function saveAiConversations() {
writeData(aiConversationsFile, aiConversations)
}

function buildAiSiteContext(req, pageContext = {}) {
const viewer = getCurrentUser(req)
const approvedMods = mods.filter(mod => mod.approved)
const topMods = approvedMods
.map(enrichMod)
.sort((a, b) => {
const downloadDiff = Number(b.downloads || 0) - Number(a.downloads || 0)
if (downloadDiff !== 0) {
return downloadDiff
}

return Number(b.ratingAverage || 0) - Number(a.ratingAverage || 0)
})
.slice(0, 8)
.map(mod => ({
id: mod.id,
title: mod.title,
game: mod.game,
downloads: Number(mod.downloads || 0),
ratingAverage: Number(mod.ratingAverage || 0),
author: mod.authorDisplayName || mod.username
}))

const categories = ["gtasa", "minecraft", "roblox", "fnf", "gtav"].map(game => ({
game,
mods: approvedMods.filter(mod => mod.game === game).length
}))

return {
site: {
name: "DRXZ MODS",
url: PUBLIC_BASE_URL,
maintenanceMode: Boolean(siteSettings.maintenanceMode),
maintenanceMessage: siteSettings.maintenanceMessage
},
viewer: viewer ? {
id: viewer.id,
username: viewer.username,
displayName: viewer.profile?.displayName || viewer.username,
role: viewer.role,
canPost: Boolean(viewer.canPost)
} : {
displayName: getAiActorLabel(req),
role: "guest",
canPost: false
},
pageContext: pageContext || {},
stats: {
users: users.length,
approvedMods: approvedMods.length,
pendingMods: mods.filter(mod => !mod.approved).length,
comments: comments.length,
ratings: ratings.length
},
categories,
topMods,
rules: [
 "A IA deve responder em portugues do Brasil, com tom amigavel e direto.",
 "O foco principal eh ajudar usuarios a navegar, descobrir mods, entender regras e melhorar postagens.",
 "Nunca invente downloads, status de aprovacao ou dados de usuarios quando o contexto nao trouxer isso.",
 "Quando houver incerteza, a IA deve admitir e sugerir o proximo passo dentro do site."
 ]
}
}

function createLocalAiResponse({ message, siteContext }) {
const prompt = String(message || "").trim()
const normalized = prompt.toLowerCase()
const viewerName = siteContext.viewer?.displayName || "voce"
const topMods = Array.isArray(siteContext.topMods) ? siteContext.topMods : []
const categories = Array.isArray(siteContext.categories) ? siteContext.categories : []

const gameAliases = {
gtasa: ["gta sa", "samp", "sa-mp", "mta", "san andreas", "gtasa"],
minecraft: ["minecraft", "mine", "mc"],
roblox: ["roblox"],
fnf: ["fnf", "friday night funkin", "friday night funkin'"],
gtav: ["gta v", "gtav", "gta 5", "gta5"]
}

const matchedGame = Object.entries(gameAliases).find(([, aliases]) => {
return aliases.some(alias => normalized.includes(alias))
})?.[0] || ""

const compactPrompt = normalized
.normalize("NFD")
.replace(/[\u0300-\u036f]/g, "")
.replace(/[^\p{L}\p{N}\s]/gu, " ")
.replace(/\s+/g, " ")
.trim()

const greetingMessages = [
"oi",
"ola",
"opa",
"e ai",
"iae",
"salve",
"bom dia",
"boa tarde",
"boa noite",
"tudo bem",
"tudo bom"
]

if (greetingMessages.some(item => compactPrompt === item || compactPrompt.startsWith(`${item} `) || compactPrompt.endsWith(` ${item}`))) {
const timeGreeting = compactPrompt.includes("bom dia")
? "Bom dia"
: compactPrompt.includes("boa tarde")
? "Boa tarde"
: compactPrompt.includes("boa noite")
? "Boa noite"
: "Opa"

return {
ok: true,
text: `${timeGreeting}, ${viewerName}. Eu sou a DRXZ AI, a assistente do site. Tamo junto.\n\nPosso te ajudar a achar mods, explicar regras, organizar uma postagem ou sugerir ideias pra tua conta. Se quiser, manda logo o jogo ou o tipo de mod que tu ta procurando.`,
model: "drxz-local"
}
}

const formatMods = modsToFormat => {
if (!modsToFormat.length) {
return "Ainda nao encontrei mods suficientes nessa categoria dentro do contexto atual."
}

return modsToFormat
.slice(0, 5)
.map((mod, index) => `${index + 1}. ${mod.title} (${mod.game}) - ${mod.downloads} downloads - nota ${Number(mod.ratingAverage || 0).toFixed(1)}/5`)
.join("\n")
}

if (normalized.includes("regra") || normalized.includes("postar") || normalized.includes("aprova") || normalized.includes("postagem")) {
return {
ok: true,
text: `${viewerName}, para postar bem no DRXZ MODS o ideal eh:\n1. usar um titulo claro\n2. explicar o que o mod faz logo no inicio\n3. escolher o jogo correto\n4. mandar banner e arquivo validos\n5. evitar descricao vaga ou sem contexto\n\nSe quiser, eu posso montar agora um titulo + descricao + estrutura de postagem para o seu mod.`,
model: "drxz-local"
}
}

if (matchedGame) {
const themedMods = topMods.filter(mod => mod.game === matchedGame)
const categoryInfo = categories.find(item => item.game === matchedGame)

return {
ok: true,
text: `Separei o que consigo sobre ${matchedGame.toUpperCase()} no DRXZ MODS.\n\nMods aprovados nessa area: ${categoryInfo?.mods || 0}\n\nDestaques atuais:\n${formatMods(themedMods)}\n\nSe quiser, eu tambem posso filtrar por algo mais especifico, tipo mod leve, popular ou bem avaliado.`,
model: "drxz-local"
}
}

if (normalized.includes("mod") || normalized.includes("recomenda") || normalized.includes("sugere") || normalized.includes("explorar")) {
return {
ok: true,
text: `Posso te ajudar a achar mods agora mesmo. Esses sao alguns destaques atuais do site:\n\n${formatMods(topMods)}\n\nSe quiser, me fala o jogo ou o estilo que eu afino melhor a sugestao.`,
model: "drxz-local"
}
}

if (normalized.includes("perfil") || normalized.includes("favorito") || normalized.includes("coment") || normalized.includes("avali")) {
return {
ok: true,
text: `Eu consigo te orientar nas funcoes do site tambem. Hoje eu posso ajudar com perfil, favoritos, comentarios, avaliacao, exploracao de mods e estrutura de postagem. Se me disser exatamente o que voce quer fazer, eu te guio passo a passo.`,
model: "drxz-local"
}
}

return {
ok: true,
text: `Sou a DRXZ AI e, enquanto a chave completa da OpenAI nao esta configurada, estou rodando em modo local com contexto real do site.\n\nEu ja consigo:\n- sugerir mods por jogo\n- explicar regras de postagem\n- orientar recursos do site\n- montar ideias de titulo e descricao\n\nMe pede algo tipo "quais mods de Minecraft estao em alta?" ou "me ajuda a escrever a descricao do meu mod".`,
model: "drxz-local"
}
}

async function createOpenAIResponse({ message, conversation, siteContext }) {
const apiKey = process.env.OPENAI_API_KEY

if (!apiKey) {
return createLocalAiResponse({ message, siteContext })
}

const recentMessages = Array.isArray(conversation.messages)
? conversation.messages.slice(-10).map(item => ({
role: item.role,
content: [{ type: "input_text", text: item.content }]
}))
: []

const systemInstructions = [
 "Voce eh a DRXZ AI, assistente oficial da plataforma DRXZ MODS.",
 "Responda sempre em portugues do Brasil.",
 "Ajude usuarios a encontrar mods, entender categorias, regras, postagem, perfil, favoritos, avaliacao, comentarios e administracao do site.",
 "Use o contexto do site fornecido para citar mods, categorias e recursos reais quando possivel.",
 "Se a pergunta pedir acao que voce ainda nao executa, explique que eh a primeira versao e ofereca o proximo passo."
 ].join(" ")

 const input = [
 ...recentMessages,
 {
 role: "user",
 content: [{ type: "input_text", text: message }]
 }
 ]

 const response = await fetch("https://api.openai.com/v1/responses", {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "Authorization": `Bearer ${apiKey}`
 },
 body: JSON.stringify({
 model: process.env.OPENAI_CHAT_MODEL || "gpt-5",
 reasoning: { effort: "low" },
 instructions: `${systemInstructions}\n\nContexto atual do site: ${JSON.stringify(siteContext)}`,
 input
 })
 })

 const data = await response.json()

 if (!response.ok) {
 return {
 ok: false,
 status: response.status,
 error: data?.error?.message || "Falha ao gerar resposta da IA"
 }
 }

 const outputText = typeof data.output_text === "string"
 ? data.output_text.trim()
 : ""

 if (outputText) {
 return {
 ok: true,
 text: outputText,
 model: data.model || process.env.OPENAI_CHAT_MODEL || "gpt-5"
 }
 }

 const fallbackText = Array.isArray(data.output)
 ? data.output
 .flatMap(item => Array.isArray(item.content) ? item.content : [])
 .filter(item => item.type === "output_text" && item.text)
 .map(item => item.text)
 .join("\n")
 .trim()
 : ""

 return {
 ok: true,
 text: fallbackText || "Nao consegui montar uma resposta agora.",
 model: data.model || process.env.OPENAI_CHAT_MODEL || "gpt-5"
 }
}

function signOAuthPayload(payload) {
const ordered = Object.keys(payload).sort().reduce((acc, key) => {
acc[key] = payload[key]
return acc
}, {})

return crypto.createHmac("sha256", OAUTH_HANDOFF_SECRET).update(JSON.stringify(ordered)).digest("hex")
}

function getOAuthProviderConfig(provider) {
const providers = {
google: {
clientId: process.env.GOOGLE_CLIENT_ID || "",
clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
tokenUrl: "https://oauth2.googleapis.com/token",
scope: "openid email profile"
},
github: {
clientId: process.env.GITHUB_CLIENT_ID || "",
clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
authorizeUrl: "https://github.com/login/oauth/authorize",
tokenUrl: "https://github.com/login/oauth/access_token",
scope: "read:user user:email"
},
facebook: {
clientId: process.env.FACEBOOK_CLIENT_ID || "",
clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
authorizeUrl: "https://www.facebook.com/v20.0/dialog/oauth",
tokenUrl: "https://graph.facebook.com/v20.0/oauth/access_token",
scope: "email public_profile"
},
discord: {
clientId: process.env.DISCORD_CLIENT_ID || "",
clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
authorizeUrl: "https://discord.com/oauth2/authorize",
tokenUrl: "https://discord.com/api/oauth2/token",
scope: "identify email"
}
}

const config = providers[String(provider || "").toLowerCase()]

if (!config) {
return null
}

return {
...config,
provider: String(provider || "").toLowerCase(),
redirectUri: process.env[`${String(provider || "").toUpperCase()}_REDIRECT_URI`] || `${PUBLIC_BASE_URL}/oauth/callback?provider=${encodeURIComponent(String(provider || "").toLowerCase())}`
}
}

function createOAuthState(req, provider) {
const state = crypto.randomBytes(24).toString("hex")
req.session.oauthState = {
provider,
state,
createdAt: Date.now()
}
return state
}

function validateOAuthState(req, provider, state) {
const stored = req.session.oauthState
delete req.session.oauthState

if (!stored || stored.provider !== provider || stored.state !== state) {
return false
}

return Date.now() - Number(stored.createdAt || 0) <= 1000 * 60 * 10
}

async function exchangeOAuthCode(provider, code) {
const config = getOAuthProviderConfig(provider)

if (!config?.clientId || !config?.clientSecret) {
throw new Error("Configure as credenciais OAuth do provedor antes de usar este login.")
}

const body = new URLSearchParams({
client_id: config.clientId,
client_secret: config.clientSecret,
redirect_uri: config.redirectUri,
code: String(code || "")
})

if (provider !== "github" && provider !== "facebook") {
body.set("grant_type", "authorization_code")
}

const response = await fetch(config.tokenUrl, {
method: "POST",
headers: {
"Accept": "application/json",
"Content-Type": "application/x-www-form-urlencoded",
...(provider === "github" ? { "User-Agent": "DRXZ-MODS" } : {})
},
body
})

const payload = await response.json().catch(() => ({}))

if (!response.ok || !payload.access_token) {
throw new Error(`Nao foi possivel obter o access token do ${provider}.`)
}

return payload.access_token
}

async function fetchOAuthProfile(provider, accessToken) {
if (provider === "google") {
const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
headers: { "Authorization": `Bearer ${accessToken}` }
})
const profile = await response.json().catch(() => ({}))

if (!response.ok || !profile.sub) {
throw new Error("Nao foi possivel carregar o perfil do Google.")
}

return {
providerId: String(profile.sub),
email: String(profile.email || "").trim(),
displayName: String(profile.name || "Google User").trim(),
avatarUrl: String(profile.picture || "").trim()
}
}

if (provider === "github") {
const profileResponse = await fetch("https://api.github.com/user", {
headers: {
"Accept": "application/vnd.github+json",
"Authorization": `Bearer ${accessToken}`,
"User-Agent": "DRXZ-MODS"
}
})
const profile = await profileResponse.json().catch(() => ({}))

const emailResponse = await fetch("https://api.github.com/user/emails", {
headers: {
"Accept": "application/vnd.github+json",
"Authorization": `Bearer ${accessToken}`,
"User-Agent": "DRXZ-MODS"
}
})
const emails = await emailResponse.json().catch(() => [])
const primary = Array.isArray(emails) ? emails.find(item => item.primary && item.verified)?.email : ""

if (!profileResponse.ok || !profile.id) {
throw new Error("Nao foi possivel carregar o perfil do GitHub.")
}

return {
providerId: String(profile.id),
email: String(primary || profile.email || "").trim(),
displayName: String(profile.name || profile.login || "GitHub User").trim(),
avatarUrl: String(profile.avatar_url || "").trim()
}
}

if (provider === "facebook") {
const response = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${encodeURIComponent(accessToken)}`)
const profile = await response.json().catch(() => ({}))

if (!response.ok || !profile.id) {
throw new Error("Nao foi possivel carregar o perfil do Facebook.")
}

return {
providerId: String(profile.id),
email: String(profile.email || "").trim(),
displayName: String(profile.name || "Facebook User").trim(),
avatarUrl: String(profile.picture?.data?.url || "").trim()
}
}

if (provider === "discord") {
const response = await fetch("https://discord.com/api/users/@me", {
headers: { "Authorization": `Bearer ${accessToken}` }
})
const profile = await response.json().catch(() => ({}))

if (!response.ok || !profile.id) {
throw new Error("Nao foi possivel carregar o perfil do Discord.")
}

const avatarUrl = profile.avatar
? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png?size=256`
: ""

return {
providerId: String(profile.id),
email: String(profile.email || "").trim(),
displayName: String(profile.global_name || profile.username || "Discord User").trim(),
avatarUrl: String(avatarUrl).trim()
}
}

throw new Error("Provedor OAuth invalido.")
}

function loginWithOAuthProfile(req, res, profile, provider) {
const clientIp = getClientIp(req)
const { providerId, email, displayName, avatarUrl } = profile

if (!provider || !providerId || !email || !displayName) {
return res.status(400).json({ error: "Payload OAuth invalido" })
}

let user = findUserByOAuth(provider, providerId)

if (!user) {
user = users.find(item => item.email.toLowerCase() === String(email).toLowerCase())
}

if (!user) {
const baseUsername = String(displayName).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || `${provider}_user`
let username = baseUsername
let counter = 1

while (users.some(existingUser => existingUser.username === username)) {
counter += 1
username = `${baseUsername}_${counter}`
}

user = normalizeUser({
id: nextId(users),
username,
email: String(email).trim(),
password: "",
oauthAccounts: [{ provider, providerId }],
role: "user",
canPost: false,
security: {
registeredIp: clientIp,
trustedIps: clientIp ? [clientIp] : [],
trustedDevices: [],
lastLoginIp: clientIp,
lastLoginAt: new Date().toISOString(),
lastDeviceToken: ""
},
profile: {
displayName: String(displayName).trim(),
avatarUrl: String(avatarUrl || "").trim()
}
})

users.push(user)
} else {
if (isBannedUser(user)) {
return res.status(403).json({ error: "Essa conta foi banida da plataforma", banned: true })
}

ensureOAuthAccount(user, provider, providerId)
if (displayName && !user.profile.displayName) {
user.profile.displayName = String(displayName).trim()
}
if (avatarUrl && !user.profile.avatarUrl) {
user.profile.avatarUrl = String(avatarUrl).trim()
}
}

writeData(usersFile, users)
rememberSuccessfulLogin(user, clientIp, "")
writeData(usersFile, users)
req.session.userId = user.id

return user
}

function signaturesMatch(received, expected) {
const receivedBuffer = Buffer.from(String(received || ""))
const expectedBuffer = Buffer.from(String(expected || ""))

if (receivedBuffer.length !== expectedBuffer.length) {
return false
}

return crypto.timingSafeEqual(receivedBuffer, expectedBuffer)
}

function findUserByOAuth(provider, providerId) {
return users.find(user => user.oauthAccounts.some(account => account.provider === provider && account.providerId === providerId))
}

function ensureOAuthAccount(user, provider, providerId) {
const exists = user.oauthAccounts.some(account => account.provider === provider && account.providerId === providerId)

if (!exists) {
user.oauthAccounts.push({ provider, providerId })
}
}

function getRatingsForMod(modId) {
return ratings.filter(rating => rating.modId == modId)
}

function getAverageForMod(modId) {
const modRatings = getRatingsForMod(modId)

if (!modRatings.length) {
return 0
}

const average = modRatings.reduce((sum, current) => sum + Number(current.rating || 0), 0) / modRatings.length
return Number(average.toFixed(1))
}

function getFavoriteCount(modId) {
return favorites.filter(favorite => favorite.modId == modId).length
}

function canonicalizeGame(game) {
const value = String(game || "").trim().toLowerCase()

if (value === "samp" || value === "gta-sa" || value === "gtasa" || value === "mta") {
return "gtasa"
}

if (value === "roblox" || value === "script" || value === "scripts" || value === "executor" || value === "executors" || value === "antilag" || value === "anti-lag") {
return "roblox"
}

if (value === "fnf" || value === "friday-night-funkin" || value === "friday night funkin" || value === "fridaynightfunkin") {
return "fnf"
}

if (value === "gtav" || value === "gta5" || value === "gta-v" || value === "gta v" || value === "fivem") {
return "gtav"
}

return value
}

function matchesGame(modGame, requestedGame) {
return canonicalizeGame(modGame) === canonicalizeGame(requestedGame)
}

function getUserBadges(user) {
return {
verified: Boolean(user?.badges?.verified),
booster: Boolean(user?.badges?.booster),
ownerTag: Boolean(user?.badges?.ownerTag),
adminTag: Boolean(user?.badges?.adminTag)
}
}

function enrichMod(mod) {
const author = getUserById(mod.user_id)
const modRatings = getRatingsForMod(mod.id)
const badges = getUserBadges(author)
const featureScore =
Number(mod.downloads || 0) +
Number(getFavoriteCount(mod.id) * 2) +
Number(getAverageForMod(mod.id) * 20) +
Number(badges.verified ? 260 : 0) +
Number(badges.ownerTag ? 180 : 0) +
Number(badges.adminTag ? 120 : 0) +
Number(badges.booster ? 90 : 0)

return {
...mod,
username: author ? author.username : "autor",
authorDisplayName: author?.profile?.displayName || author?.username || "autor",
authorRole: author?.role || "user",
authorBadges: badges,
authorProfile: {
id: author?.id || mod.user_id,
avatarUrl: author?.profile?.avatarUrl || "",
accentColor: author?.profile?.accentColor || "#9c4dff"
},
ratingAverage: getAverageForMod(mod.id),
ratingCount: modRatings.length,
favoriteCount: getFavoriteCount(mod.id),
featureScore
}
}

function getProfileStats(userId) {
const userMods = mods.filter(mod => mod.user_id == userId)
const totalDownloads = userMods.reduce((sum, mod) => sum + Number(mod.downloads || 0), 0)
const allRatings = ratings.filter(rating => userMods.some(mod => mod.id == rating.modId))
const averageRating = allRatings.length
? allRatings.reduce((sum, current) => sum + Number(current.rating || 0), 0) / allRatings.length
: 0

return {
mods: userMods.length,
downloads: totalDownloads,
rating: Number(averageRating.toFixed(1)),
followers: follows.filter(follow => follow.followingId == userId).length,
following: follows.filter(follow => follow.followerId == userId).length,
favorites: favorites.filter(favorite => favorite.userId == userId).length
}
}

function sanitizeUser(user, viewer) {
const stats = getProfileStats(user.id)
const canSeeSecurity = Boolean(viewer && viewer.role === "master_admin")

return {
id: user.id,
username: user.username,
role: user.role,
canPost: user.canPost,
banned: user.banned,
banReason: user.banReason,
banDate: user.banDate,
recoveryAuthorized: Boolean(user.recoveryAuthorized),
recoveryRequestedAt: user.recoveryRequestedAt,
recoveryExpiresAt: user.recoveryExpiresAt,
	isPartner: isPartnerUser(user),
	badges: getUserBadges(user),
	profile: user.profile,
	security: canSeeSecurity ? {
		registeredIp: user.security?.registeredIp || "",
		trustedIpsCount: user.security?.trustedIps?.length || 0,
		trustedDevicesCount: user.security?.trustedDevices?.length || 0,
		securityBypassUntil: user.security?.securityBypassUntil || null,
		lastLoginIp: user.security?.lastLoginIp || "",
		lastLoginAt: user.security?.lastLoginAt || null
	} : undefined,
	stats,
isOwner: Boolean(viewer && viewer.id == user.id),
isFollowing: Boolean(viewer && follows.some(follow => follow.followerId == viewer.id && follow.followingId == user.id))
}
}

function canManageMod(user, mod) {
return Boolean(user && mod && (isAdminUser(user) || user.id == mod.user_id))
}

function createNotification({ userId, actorId = null, type = "general", title = "Notificacao", message = "", link = "/" }) {
if (!userId) {
return
}

notifications.unshift(normalizeNotification({
id: nextId(notifications),
userId,
actorId,
type,
title,
message,
link,
read: false,
date: new Date().toISOString()
}))

notifications = notifications.slice(0, 300)
writeData(notificationsFile, notifications)
}

function clearRecoveryAccess(user) {
if (!user) {
return
}

user.recoveryAuthorized = false
user.recoveryRequestedAt = null
user.recoveryExpiresAt = null
user.recoveryToken = ""
}

function ensureRecoveryState(user) {
if (!user?.recoveryAuthorized) {
return false
}

const expiresAt = user.recoveryExpiresAt ? new Date(user.recoveryExpiresAt).getTime() : 0

if (expiresAt && expiresAt > Date.now()) {
return true
}

clearRecoveryAccess(user)
	writeData(usersFile, users)
	return false
}

function getClientIp(req) {
	const forwarded = String(req.headers["x-forwarded-for"] || "").trim()
	const candidate = forwarded ? forwarded.split(",")[0].trim() : (req.socket?.remoteAddress || req.ip || "")
	return String(candidate || "").replace(/^::ffff:/, "").trim()
}

function normalizeDeviceToken(token) {
	return String(token || "").trim().replace(/[^a-zA-Z0-9:_-]/g, "").slice(0, 120)
}

function ensureUserSecurityState(user) {
	if (!user.security || typeof user.security !== "object") {
		user.security = {
			registeredIp: "",
			trustedIps: [],
			trustedDevices: [],
			securityBypassUntil: null,
			lastLoginIp: "",
			lastLoginAt: null,
			lastDeviceToken: ""
		}
	}

	user.security.registeredIp = String(user.security.registeredIp || "").trim()
	user.security.trustedIps = Array.isArray(user.security.trustedIps) ? user.security.trustedIps.map(ip => String(ip || "").trim()).filter(Boolean).slice(0, 8) : []
	user.security.trustedDevices = Array.isArray(user.security.trustedDevices) ? user.security.trustedDevices.map(device => String(device || "").trim()).filter(Boolean).slice(0, 8) : []
	user.security.securityBypassUntil = user.security.securityBypassUntil || null
	user.security.lastLoginIp = String(user.security.lastLoginIp || "").trim()
	user.security.lastDeviceToken = String(user.security.lastDeviceToken || "").trim()
	return user.security
}

function hasActiveSecurityBypass(user) {
	const security = ensureUserSecurityState(user)
	const expiresAt = security.securityBypassUntil ? new Date(security.securityBypassUntil).getTime() : 0

	if (expiresAt && expiresAt > Date.now()) {
		return true
	}

	if (security.securityBypassUntil) {
		security.securityBypassUntil = null
		writeData(usersFile, users)
	}

	return false
}

function hasTrustedLoginAccess(user, ip, deviceToken) {
	const security = ensureUserSecurityState(user)
	const trustedIpMatch = Boolean(ip && (security.registeredIp === ip || security.trustedIps.includes(ip)))
	const trustedDeviceMatch = Boolean(deviceToken && security.trustedDevices.includes(deviceToken))
	return trustedIpMatch || trustedDeviceMatch
}

function seedTrustedLoginAccess(user, ip, deviceToken) {
	const security = ensureUserSecurityState(user)

	if (ip && !security.registeredIp) {
		security.registeredIp = ip
	}

	if (ip && !security.trustedIps.includes(ip)) {
		security.trustedIps.unshift(ip)
		security.trustedIps = [...new Set(security.trustedIps)].slice(0, 8)
	}

	if (deviceToken && !security.trustedDevices.includes(deviceToken)) {
		security.trustedDevices.unshift(deviceToken)
		security.trustedDevices = [...new Set(security.trustedDevices)].slice(0, 8)
	}
}

function rememberSuccessfulLogin(user, ip, deviceToken) {
	const security = ensureUserSecurityState(user)
	seedTrustedLoginAccess(user, ip, deviceToken)
	security.securityBypassUntil = null
	security.lastLoginIp = ip || security.lastLoginIp || ""
	security.lastDeviceToken = deviceToken || security.lastDeviceToken || ""
	security.lastLoginAt = new Date().toISOString()
}

function createNotificationForUsers(userIds, payload) {
const uniqueIds = [...new Set(userIds.map(Number).filter(Boolean))]
uniqueIds.forEach(userId => {
createNotification({
...payload,
userId
})
})
}

function persistSiteSettings() {
writeObjectData(siteSettingsFile, siteSettings)
}

function sendAutomatedSiteNotification(force = false) {
const intervalMs = 1000 * 60 * 60 * 2
const lastSentAt = siteSettings.lastAutoBroadcastAt ? new Date(siteSettings.lastAutoBroadcastAt).getTime() : 0

if (!force && lastSentAt && Date.now() - lastSentAt < intervalMs) {
return
}

const automaticMessages = [
{
title: "Radar da plataforma",
message: "Sempre tem mod novo, parceria nova e destaque novo pintando por aqui. Cola na home e confere o que subiu.",
link: "/"
},
{
title: "Explorar vale a visita",
message: "A aba Explorar junta mods, criadores e perfis em um so lugar. Se quiser achar algo rapido, passa por la.",
link: "/explore.html"
},
{
title: "Criadores em movimento",
message: "Perfis ativos, comentarios, respostas e favoritos fazem o site girar. Acompanha os criadores que voce curte.",
link: "/explore.html"
},
{
title: "Area de postagem aberta",
message: "Se sua conta tiver permissao para postar, a tela dedicada de envio esta pronta para mandar seu proximo mod.",
link: "/post-mod.html"
},
{
title: "Parcerias em destaque",
message: "A area de parceria esta aberta para quem tiver o cargo certo. Vale conferir conteudo, links e criadores parceiros.",
link: "/partnership.html"
},
{
title: "Dica rapida",
message: "Complete seu perfil com avatar, banner e links sociais para deixar sua pagina mais forte dentro da comunidade.",
link: "/"
}
]

const cursor = Number(siteSettings.autoBroadcastCursor || 0)
const currentMessage = automaticMessages[cursor % automaticMessages.length]
const targetIds = users.filter(user => !user.banned).map(user => user.id)

createNotificationForUsers(targetIds, {
type: "site-news",
title: currentMessage.title,
message: currentMessage.message,
link: currentMessage.link
})

siteSettings.lastAutoBroadcastAt = new Date().toISOString()
siteSettings.autoBroadcastCursor = (cursor + 1) % automaticMessages.length
persistSiteSettings()
}

app.use((req, res, next) => {
const user = getCurrentUser(req)
const acceptsHtml = (req.headers.accept || "").includes("text/html")
const allowAsset = ["/css/", "/js/", "/img/", "/uploads/"].some(prefix => req.path.startsWith(prefix))
const allowPaths = ["/logout", "/check-login", "/banned.html"]

if (!isBannedUser(user)) {
return next()
}

if (allowAsset || allowPaths.includes(req.path)) {
return next()
}

if (acceptsHtml) {
return res.status(403).sendFile(path.join(__dirname, "banned.html"))
}

return res.status(403).json({
error: "Sua conta foi banida",
banned: true,
reason: user.banReason || "Violacao das regras da plataforma"
})
})

app.use((req, res, next) => {
const user = getCurrentUser(req)
const acceptsHtml = (req.headers.accept || "").includes("text/html")
const allowAsset = ["/css/", "/js/", "/img/", "/uploads/"].some(prefix => req.path.startsWith(prefix))
const allowPaths = [
"/maintenance.html",
"/login.html",
"/register.html",
"/post-mod-access.html",
"/forgot-password.html",
"/reset-password.html",
"/login",
"/register",
"/account-recovery/complete",
"/check-login",
"/logout",
"/oauth/google",
"/oauth/github",
"/oauth/facebook",
"/oauth/discord",
"/oauth/callback",
"/oauth/php-login",
"/banned.html"
]

if (!siteSettings.maintenanceMode || isMasterAdmin(user)) {
return next()
}

if (allowAsset || allowPaths.includes(req.path)) {
return next()
}

if (acceptsHtml) {
return res.status(503).sendFile(path.join(__dirname, "maintenance.html"))
}

return res.status(503).json({
error: "O site esta em manutencao no momento",
maintenance: true,
message: siteSettings.maintenanceMessage
})
})

app.use(express.static(__dirname))
app.use("/uploads", express.static(uploadsDir))

function enrichComment(comment, viewer) {
const author = getUserById(comment.userId)
const likes = Array.isArray(comment.likes) ? comment.likes : []
const dislikes = Array.isArray(comment.dislikes) ? comment.dislikes : []
const canManage = Boolean(viewer && (viewer.id == comment.userId || isAdminUser(viewer)))

return {
...comment,
username: author?.username || comment.username || "usuario",
authorDisplayName: author?.profile?.displayName || comment.username || "usuario",
authorRole: author?.role || "user",
authorProfile: {
id: author?.id || comment.userId,
avatarUrl: author?.profile?.avatarUrl || "",
accentColor: author?.profile?.accentColor || "#9c4dff"
},
authorBadges: getUserBadges(author),
likeCount: likes.length,
dislikeCount: dislikes.length,
myReaction: viewer
? (likes.includes(viewer.id) ? "like" : (dislikes.includes(viewer.id) ? "dislike" : null))
: null,
canManage
}
}

function buildCommentTree(modId, viewer) {
const modComments = comments
.filter(comment => comment.modId == modId)
.sort((a, b) => new Date(a.date) - new Date(b.date))
.map(comment => ({
...enrichComment(comment, viewer),
replies: []
}))

const byId = new Map(modComments.map(comment => [String(comment.id), comment]))
const roots = []

modComments.forEach(comment => {
if (comment.parentId && byId.has(String(comment.parentId))) {
byId.get(String(comment.parentId)).replies.push(comment)
return
}

roots.push(comment)
})

roots.sort((a, b) => new Date(b.date) - new Date(a.date))
return roots
}

function searchUsers(query, viewer) {
const term = String(query || "").trim().toLowerCase()

return users
.filter(user => {
if (!term) {
return true
}

return [
user.username,
user.profile?.displayName,
user.profile?.bio,
user.profile?.location,
user.profile?.discord,
user.profile?.youtube,
user.profile?.instagram,
user.profile?.github
]
.filter(Boolean)
.some(value => String(value).toLowerCase().includes(term))
})
.map(user => sanitizeUser(user, viewer))
}

function ensureAuthenticated(req, res, next) {
const user = getCurrentUser(req)

if (!user) {
return res.status(401).json({ error: "Voce precisa estar logado" })
}

req.currentUser = user
next()
}

function ensureAdmin(req, res, next) {
const user = getCurrentUser(req)

if (!isAdminUser(user)) {
return res.status(403).json({ error: "Acesso negado" })
}

req.currentUser = user
next()
}

function ensureMasterAdmin(req, res, next) {
const user = getCurrentUser(req)

if (!isMasterAdmin(user)) {
return res.status(403).json({ error: "Somente o master admin pode fazer isso" })
}

req.currentUser = user
next()
}

const storage = multer.diskStorage({
destination: (req, file, cb) => {
cb(null, uploadsDir)
},
filename: (req, file, cb) => {
cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}${path.extname(file.originalname)}`)
}
})

const upload = multer({ storage })

app.post("/register", async (req, res) => {
const { username, email, password, deviceToken } = req.body
const clientIp = getClientIp(req)
const safeDeviceToken = normalizeDeviceToken(deviceToken)

if (!username || !email || !password) {
return res.status(400).json({ error: "Preencha todos os campos" })
}

if (users.some(user => user.username.toLowerCase() === String(username).toLowerCase())) {
return res.status(400).json({ error: "Esse usuario ja existe" })
}

const hashed = await bcrypt.hash(password, 10)

const newUser = normalizeUser({
id: nextId(users),
username: String(username).trim(),
email: String(email).trim(),
password: hashed,
role: "user",
canPost: false,
security: {
registeredIp: clientIp,
trustedIps: clientIp ? [clientIp] : [],
trustedDevices: safeDeviceToken ? [safeDeviceToken] : [],
lastLoginIp: "",
lastLoginAt: null,
lastDeviceToken: ""
},
profile: {}
})

users.push(newUser)
writeData(usersFile, users)

res.json({ message: "Conta criada com sucesso" })
})

app.post("/login", async (req, res) => {
const { username, password, deviceToken } = req.body
const user = users.find(item => item.username === username)
const clientIp = getClientIp(req)
const safeDeviceToken = normalizeDeviceToken(deviceToken)

if (!user) {
return res.status(400).json({ error: "Usuario nao encontrado" })
}

if (!user.password || !String(user.password).startsWith("$2")) {
return res.status(400).json({ error: "Essa conta usa login social. Entre pelo provedor conectado." })
}

if (isBannedUser(user)) {
return res.status(403).json({ error: "Essa conta foi banida da plataforma", banned: true })
}

if (ensureRecoveryState(user)) {
if (!user.recoveryToken) {
user.recoveryToken = crypto.randomBytes(24).toString("hex")
writeData(usersFile, users)
}

return res.status(409).json({
error: "Essa conta foi liberada para recuperacao de senha pelo suporte.",
passwordResetRequired: true,
resetToken: user.recoveryToken,
username: user.username
})
}

const valid = await bcrypt.compare(password, user.password)

if (!valid) {
return res.status(400).json({ error: "Senha incorreta" })
}

const security = ensureUserSecurityState(user)
const accountHasSecuritySeed = Boolean(security.registeredIp || security.trustedIps.length || security.trustedDevices.length)
const securityBypassActive = hasActiveSecurityBypass(user)

if (accountHasSecuritySeed && !securityBypassActive && !hasTrustedLoginAccess(user, clientIp, safeDeviceToken)) {
	if (isMasterAdmin(user)) {
		seedTrustedLoginAccess(user, clientIp, safeDeviceToken)
		rememberSuccessfulLogin(user, clientIp, safeDeviceToken)
		writeData(usersFile, users)
		req.session.userId = user.id
		return req.session.save(() => {
			res.json({
				message: "Login realizado",
				user: sanitizeUser(user, user)
			})
		})
	}

	const masterIds = users.filter(candidate => candidate.role === "master_admin" && !candidate.banned).map(candidate => candidate.id)

	createNotificationForUsers(masterIds, {
		actorId: user.id,
		type: "security-alert",
		title: "Tentativa suspeita de acesso",
		message: `A conta @${user.username} tentou entrar com IP/dispositivo diferente do cadastrado. IP atual: ${clientIp || "desconhecido"}.`,
		link: "/admin.html"
	})

	return res.status(403).json({
		error: "Acesso bloqueado. O IP ou dispositivo desta tentativa nao bate com o cadastrado na conta. Fale com o suporte para confirmar sua identidade.",
		suspiciousAccess: true,
		supportUrl: `/access-denied.html?username=${encodeURIComponent(user.username)}`
	})
}

if (!accountHasSecuritySeed) {
	seedTrustedLoginAccess(user, clientIp, safeDeviceToken)
}

rememberSuccessfulLogin(user, clientIp, safeDeviceToken)
writeData(usersFile, users)

req.session.userId = user.id
req.session.save(() => {
	res.json({
	message: "Login realizado",
	user: sanitizeUser(user, user)
	})
})
})

app.post("/account-recovery/complete", async (req, res) => {
const { token, password } = req.body
const safeToken = String(token || "").trim()
const safePassword = String(password || "")

if (!safeToken || !safePassword) {
return res.status(400).json({ error: "Informe o token e a nova senha" })
}

const user = users.find(item => item.recoveryToken === safeToken)

if (!user || !ensureRecoveryState(user)) {
return res.status(400).json({ error: "A liberacao de recuperacao expirou ou e invalida" })
}

if (safePassword.length < 6) {
return res.status(400).json({ error: "A nova senha precisa ter pelo menos 6 caracteres" })
}

user.password = await bcrypt.hash(safePassword, 10)
clearRecoveryAccess(user)
writeData(usersFile, users)

createNotification({
userId: user.id,
type: "account-recovery",
title: "Senha atualizada",
message: "Sua senha foi redefinida com sucesso pelo fluxo de recuperacao.",
link: "/login.html"
})

res.json({ message: "Senha alterada com sucesso. Agora voce ja pode entrar normalmente." })
})

app.get("/oauth/:provider", (req, res) => {
const provider = String(req.params.provider || "").toLowerCase()
const config = getOAuthProviderConfig(provider)

if (!config) {
return res.status(404).sendFile(path.join(__dirname, "not-found.html"))
}

if (!config.clientId || !config.clientSecret) {
return res.status(500).json({ error: "Configure as credenciais OAuth do provedor antes de usar este login." })
}

const state = createOAuthState(req, provider)
const params = new URLSearchParams({
client_id: config.clientId,
redirect_uri: config.redirectUri,
response_type: "code",
scope: config.scope,
state
})

res.redirect(`${config.authorizeUrl}?${params.toString()}`)
})

app.get("/oauth/callback", async (req, res) => {
const provider = String(req.query.provider || "").toLowerCase()
const state = String(req.query.state || "")
const code = String(req.query.code || "")

if (!provider || !state || !code) {
return res.status(400).send("Callback OAuth invalido.")
}

if (!validateOAuthState(req, provider, state)) {
return res.status(400).send("Falha ao validar o state do OAuth.")
}

try {
const accessToken = await exchangeOAuthCode(provider, code)
const profile = await fetchOAuthProfile(provider, accessToken)

if (!profile.providerId || !profile.email || !profile.displayName) {
return res.status(400).send("O provedor nao retornou os dados minimos de perfil.")
}

const user = loginWithOAuthProfile(req, res, profile, provider)

if (!user) {
return
}

res.redirect("/")
} catch (error) {
res.status(500).send(String(error.message || "Falha ao concluir o login OAuth."))
}
})

app.post("/oauth/php-login", (req, res) => {
const { provider, providerId, email, displayName, avatarUrl, signature, timestamp } = req.body
const safeTimestamp = Number(timestamp)

if (!provider || !providerId || !email || !displayName || !signature || Number.isNaN(safeTimestamp)) {
return res.status(400).json({ error: "Payload OAuth invalido" })
}

if (Math.abs(Date.now() - safeTimestamp) > 1000 * 60 * 10) {
return res.status(400).json({ error: "Payload OAuth expirado" })
}

const payload = { provider, providerId, email, displayName, avatarUrl: avatarUrl || "", timestamp: safeTimestamp }
const expectedSignature = signOAuthPayload(payload)

if (!signaturesMatch(signature, expectedSignature)) {
return res.status(403).json({ error: "Assinatura OAuth invalida" })
}

const user = loginWithOAuthProfile(req, res, {
providerId,
email,
displayName,
avatarUrl: avatarUrl || ""
}, provider)

if (!user) {
return
}

res.redirect("/")
})

app.get("/check-login", (req, res) => {
const user = getCurrentUser(req)

if (!user) {
return res.json({
logged: false,
loggedIn: false,
maintenance: Boolean(siteSettings.maintenanceMode)
})
}

if (isBannedUser(user)) {
return res.status(403).json({
logged: false,
loggedIn: false,
banned: true,
reason: user.banReason || "Violacao das regras da plataforma"
})
}

if (siteSettings.maintenanceMode && !isMasterAdmin(user)) {
return res.status(503).json({
logged: false,
loggedIn: false,
maintenance: true,
message: siteSettings.maintenanceMessage
})
}

res.json({
logged: true,
loggedIn: true,
username: user.username,
role: user.role,
id: user.id,
canPost: user.canPost,
maintenance: Boolean(siteSettings.maintenanceMode),
user: sanitizeUser(user, user)
})
})

app.post("/logout", (req, res) => {
req.session.destroy(() => {
res.json({ message: "Logout realizado" })
})
})

app.post("/post-mod", ensureAuthenticated, upload.fields([
{ name: "file", maxCount: 1 },
{ name: "banner", maxCount: 1 }
]), (req, res) => {
if (!canPostMods(req.currentUser)) {
return res.status(403).json({ error: "Sua conta ainda nao tem permissao para postar mods" })
}

const { title, description, game, credits } = req.body
const modFile = req.files?.file?.[0]
const bannerFile = req.files?.banner?.[0]

if (!title || !description || !game || !modFile) {
return res.status(400).json({ error: "Preencha os campos obrigatorios" })
}

const newMod = {
id: nextId(mods),
title: String(title).trim(),
description: String(description).trim(),
game: canonicalizeGame(game),
credits: String(credits || "").trim(),
download_link: modFile.filename,
banner_link: bannerFile ? bannerFile.filename : "",
user_id: req.currentUser.id,
approved: isAdminUser(req.currentUser) ? 1 : 0,
downloads: 0,
created_at: new Date().toISOString()
}

mods.push(newMod)
writeData(modsFile, mods)

if (!newMod.approved) {
const adminIds = users.filter(user => isAdminUser(user) && !user.banned).map(user => user.id)
createNotificationForUsers(adminIds, {
actorId: req.currentUser.id,
type: "mod-review",
title: "Novo mod aguardando aprovacao",
message: `${req.currentUser.profile.displayName || req.currentUser.username} enviou "${newMod.title}" para analise.`,
link: "/admin.html"
})
}

res.json({
message: newMod.approved ? "Mod publicado com sucesso" : "Mod enviado para analise. A aprovacao pode levar de 1 hora a 24 horas.",
mod: enrichMod(newMod)
})
})

app.get("/mods/:game", (req, res) => {
const game = canonicalizeGame(req.params.game)
const query = String(req.query.q || "").trim().toLowerCase()

const approvedMods = mods
.filter(mod => matchesGame(mod.game, game) && mod.approved)
.map(enrichMod)
.filter(mod => {
if (!query) {
return true
}

return [mod.title, mod.description, mod.username, mod.authorDisplayName, mod.credits]
.filter(Boolean)
.some(value => String(value).toLowerCase().includes(query))
})
.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

res.json(approvedMods)
})

app.get("/mod/:id", (req, res) => {
const mod = mods.find(item => item.id == req.params.id)
const currentUser = getCurrentUser(req)

if (!mod) {
return res.status(404).json({ error: "Mod nao encontrado" })
}

if (!mod.approved && !isAdminUser(currentUser) && currentUser?.id != mod.user_id) {
return res.status(403).json({ error: "Esse mod ainda nao foi aprovado" })
}

const enrichedMod = enrichMod(mod)
res.json({
...enrichedMod,
isFavorited: Boolean(currentUser && favorites.some(favorite => favorite.userId == currentUser.id && favorite.modId == mod.id))
})
})

app.get("/popular-mods", (req, res) => {
const sorted = [...mods]
.filter(mod => mod.approved)
.map(enrichMod)
.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
.slice(0, 6)

res.json(sorted)
})

app.get("/ranking", (req, res) => {
const ranked = [...mods]
.filter(mod => mod.approved)
.map(enrichMod)
.sort((a, b) => {
if ((b.featureScore || 0) !== (a.featureScore || 0)) {
return (b.featureScore || 0) - (a.featureScore || 0)
}

if ((b.downloads || 0) !== (a.downloads || 0)) {
return (b.downloads || 0) - (a.downloads || 0)
}

return (b.favoriteCount || 0) - (a.favoriteCount || 0)
})

res.json(ranked)
})

app.get("/explore", (req, res) => {
const viewer = getCurrentUser(req)
const query = String(req.query.q || "").trim().toLowerCase()
const type = String(req.query.type || "all").trim().toLowerCase()
const game = canonicalizeGame(req.query.game || "all")
const sort = String(req.query.sort || "recent").trim().toLowerCase()

let modsResults = mods
.filter(mod => mod.approved)
.map(enrichMod)
.filter(mod => {
if (game && game !== "all" && canonicalizeGame(mod.game) !== game) {
return false
}

if (!query) {
return true
}

return [
mod.title,
mod.description,
mod.username,
mod.authorDisplayName,
mod.credits,
mod.game
]
.filter(Boolean)
.some(value => String(value).toLowerCase().includes(query))
})

if (sort === "popular") {
modsResults.sort((a, b) => (b.downloads || 0) - (a.downloads || 0))
} else if (sort === "rating") {
modsResults.sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))
} else {
modsResults.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

let profilesResults = searchUsers(query, viewer)

profilesResults.sort((a, b) => {
const followersDiff = (b.stats?.followers || 0) - (a.stats?.followers || 0)
if (followersDiff !== 0) {
return followersDiff
}

return (b.stats?.mods || 0) - (a.stats?.mods || 0)
})

if (type === "mods") {
profilesResults = []
}

if (type === "profiles") {
modsResults = []
}

res.json({
query,
filters: {
type,
game: game || "all",
sort
},
counts: {
mods: modsResults.length,
profiles: profilesResults.length
},
mods: modsResults,
profiles: profilesResults
})
})

app.get("/download/:file", (req, res) => {
const filename = path.basename(req.params.file)
const filePath = path.join(__dirname, "uploads", filename)

if (!fs.existsSync(filePath)) {
return res.status(404).send("Arquivo nao encontrado")
}

const mod = mods.find(item => item.download_link === filename)

if (mod) {
mod.downloads = Number(mod.downloads || 0) + 1
writeData(modsFile, mods)
}

res.download(filePath)
})

app.get("/comments/:modId", (req, res) => {
const viewer = getCurrentUser(req)
const items = buildCommentTree(req.params.modId, viewer)

res.json({
total: comments.filter(comment => comment.modId == req.params.modId).length,
items
})
})

app.post("/comment", ensureAuthenticated, (req, res) => {
const { modId, text, parentId } = req.body

if (!modId || !String(text || "").trim()) {
return res.status(400).json({ error: "Comentario invalido" })
}

if (parentId) {
const parentComment = comments.find(comment => comment.id == parentId && comment.modId == modId)
if (!parentComment) {
return res.status(400).json({ error: "Comentario pai nao encontrado" })
}
}

const newComment = normalizeComment({
id: nextId(comments),
modId: String(modId),
userId: req.currentUser.id,
username: req.currentUser.profile.displayName || req.currentUser.username,
text: String(text).trim(),
date: new Date().toISOString(),
parentId: parentId ? String(parentId) : null,
likes: [],
dislikes: []
})

comments.push(newComment)
writeData(commentsFile, comments)

const mod = mods.find(item => item.id == modId)
if (mod && mod.user_id != req.currentUser.id) {
createNotification({
userId: mod.user_id,
actorId: req.currentUser.id,
type: "comment",
title: "Novo comentario no seu mod",
message: `${req.currentUser.profile.displayName || req.currentUser.username} comentou em ${mod.title}`,
link: `/mod.html?id=${mod.id}`
})
}

if (parentId) {
const parentComment = comments.find(comment => comment.id == parentId)
if (parentComment && parentComment.userId != req.currentUser.id) {
createNotification({
userId: parentComment.userId,
actorId: req.currentUser.id,
type: "reply",
title: "Responderam seu comentario",
message: `${req.currentUser.profile.displayName || req.currentUser.username} respondeu seu comentario`,
link: `/mod.html?id=${modId}`
})
}
}

res.json({
message: parentId ? "Resposta enviada" : "Comentario enviado",
comment: enrichComment(newComment, req.currentUser)
})
})

app.post("/comment/:id/react", ensureAuthenticated, (req, res) => {
const comment = comments.find(item => item.id == req.params.id)
const action = String(req.body.action || "").trim().toLowerCase()

if (!comment) {
return res.status(404).json({ error: "Comentario nao encontrado" })
}

if (!["like", "dislike", "clear"].includes(action)) {
return res.status(400).json({ error: "Reacao invalida" })
}

comment.likes = Array.isArray(comment.likes) ? comment.likes : []
comment.dislikes = Array.isArray(comment.dislikes) ? comment.dislikes : []
const alreadyLiked = comment.likes.includes(req.currentUser.id)
const alreadyDisliked = comment.dislikes.includes(req.currentUser.id)
comment.likes = comment.likes.filter(userId => userId != req.currentUser.id)
comment.dislikes = comment.dislikes.filter(userId => userId != req.currentUser.id)

if (action === "like" && !alreadyLiked) {
comment.likes.push(req.currentUser.id)
}

if (action === "dislike" && !alreadyDisliked) {
comment.dislikes.push(req.currentUser.id)
}

writeData(commentsFile, comments)

if (comment.userId != req.currentUser.id && (action === "like" || action === "dislike")) {
createNotification({
userId: comment.userId,
actorId: req.currentUser.id,
type: action,
title: action === "like" ? "Curtiram seu comentario" : "Reagiram ao seu comentario",
message: `${req.currentUser.profile.displayName || req.currentUser.username} ${action === "like" ? "curtiu" : "reagiu a"} seu comentario`,
link: `/mod.html?id=${comment.modId}`
})
}

res.json({
message: "Reacao atualizada",
comment: enrichComment(comment, req.currentUser)
})
})

app.patch("/comment/:id", ensureAuthenticated, (req, res) => {
const comment = comments.find(item => item.id == req.params.id)

if (!comment) {
return res.status(404).json({ error: "Comentario nao encontrado" })
}

if (comment.userId != req.currentUser.id && !isAdminUser(req.currentUser)) {
return res.status(403).json({ error: "Voce nao pode editar esse comentario" })
}

const text = String(req.body.text || "").trim()

if (!text) {
return res.status(400).json({ error: "Comentario invalido" })
}

comment.text = text
comment.editedAt = new Date().toISOString()
writeData(commentsFile, comments)

res.json({
message: "Comentario atualizado",
comment: enrichComment(comment, req.currentUser)
})
})

app.delete("/comment/:id", ensureAuthenticated, (req, res) => {
const comment = comments.find(item => item.id == req.params.id)

if (!comment) {
return res.status(404).json({ error: "Comentario nao encontrado" })
}

if (comment.userId != req.currentUser.id && !isAdminUser(req.currentUser)) {
return res.status(403).json({ error: "Voce nao pode apagar esse comentario" })
}

const targetIds = new Set([String(comment.id)])
let changed = true

while (changed) {
changed = false
comments.forEach(item => {
if (item.parentId && targetIds.has(String(item.parentId)) && !targetIds.has(String(item.id))) {
targetIds.add(String(item.id))
changed = true
}
})
}

comments = comments.filter(item => !targetIds.has(String(item.id)))
writeData(commentsFile, comments)

res.json({ message: "Comentario apagado" })
})

app.get("/ratings/:modId", (req, res) => {
const modRatings = getRatingsForMod(req.params.modId)
const currentUser = getCurrentUser(req)
const ownRating = currentUser ? modRatings.find(rating => rating.userId == currentUser.id) : null

res.json({
average: getAverageForMod(req.params.modId),
count: modRatings.length,
myRating: ownRating ? ownRating.rating : null
})
})

app.post("/rate", ensureAuthenticated, (req, res) => {
const { modId, rating } = req.body
const parsedRating = Number(rating)

if (!modId || Number.isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
return res.status(400).json({ error: "Avaliacao invalida" })
}

const existing = ratings.find(item => item.modId == modId && item.userId == req.currentUser.id)

if (existing) {
existing.rating = parsedRating
} else {
ratings.push({
id: nextId(ratings),
modId: String(modId),
userId: req.currentUser.id,
rating: parsedRating
})
}

writeData(ratingsFile, ratings)

res.json({ message: "Avaliacao enviada" })
})

app.post("/favorite", ensureAuthenticated, (req, res) => {
const { modId } = req.body

if (!modId) {
return res.status(400).json({ error: "Mod invalido" })
}

const existing = favorites.find(favorite => favorite.userId == req.currentUser.id && favorite.modId == modId)

if (existing) {
favorites = favorites.filter(favorite => favorite.id != existing.id)
writeData(favoritesFile, favorites)
return res.json({ message: "Favorito removido", active: false, favorited: false })
}

favorites.push({
id: nextId(favorites),
userId: req.currentUser.id,
modId: String(modId)
})

writeData(favoritesFile, favorites)

const mod = mods.find(item => item.id == modId)
if (mod && mod.user_id != req.currentUser.id) {
createNotification({
userId: mod.user_id,
actorId: req.currentUser.id,
type: "favorite",
title: "Favoritaram seu mod",
message: `${req.currentUser.profile.displayName || req.currentUser.username} favoritou ${mod.title}`,
link: `/mod.html?id=${mod.id}`
})
}

res.json({ message: "Favorito adicionado", active: true, favorited: true })
})

app.get("/favorites", ensureAuthenticated, (req, res) => {
const favs = favorites
.filter(favorite => favorite.userId == req.currentUser.id)
.map(favorite => mods.find(mod => mod.id == favorite.modId))
.filter(Boolean)
.map(enrichMod)

res.json(favs)
})

app.post("/follow/:id", ensureAuthenticated, (req, res) => {
const targetId = String(req.params.id)

if (req.currentUser.id == targetId) {
return res.status(400).json({ error: "Voce nao pode seguir a si mesmo" })
}

const targetUser = getUserById(targetId)

if (!targetUser) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

const existing = follows.find(follow => follow.followerId == req.currentUser.id && follow.followingId == targetId)

if (existing) {
follows = follows.filter(follow => follow.id != existing.id)
writeData(followsFile, follows)
return res.json({ message: "Deixou de seguir", active: false })
}

follows.push({
id: nextId(follows),
followerId: req.currentUser.id,
followingId: Number(targetId)
})

writeData(followsFile, follows)

createNotification({
userId: Number(targetId),
actorId: req.currentUser.id,
type: "follow",
title: "Novo seguidor",
message: `${req.currentUser.profile.displayName || req.currentUser.username} comecou a seguir voce`,
link: `/profile.html?id=${req.currentUser.id}`
})

res.json({ message: "Agora voce esta seguindo esse perfil", active: true })
})

app.get("/followers/:id", (req, res) => {
const targetId = req.params.id
const items = follows
.filter(follow => follow.followingId == targetId)
.map(follow => getUserById(follow.followerId))
.filter(Boolean)
.map(user => sanitizeUser(user, getCurrentUser(req)))

res.json(items)
})

app.get("/following/:id", (req, res) => {
const targetId = req.params.id
const items = follows
.filter(follow => follow.followerId == targetId)
.map(follow => getUserById(follow.followingId))
.filter(Boolean)
.map(user => sanitizeUser(user, getCurrentUser(req)))

res.json(items)
})

app.get("/notifications", ensureAuthenticated, (req, res) => {
const items = notifications
.filter(notification => notification.userId == req.currentUser.id)
.map(notification => ({
...notification,
actor: notification.actorId ? sanitizeUser(getUserById(notification.actorId), req.currentUser) : null
}))
.sort((a, b) => new Date(b.date) - new Date(a.date))

res.json({
count: items.length,
unread: items.filter(item => !item.read).length,
items
})
})

app.post("/notifications/read-all", ensureAuthenticated, (req, res) => {
notifications = notifications.map(notification => notification.userId == req.currentUser.id
? { ...notification, read: true }
: notification
)
writeData(notificationsFile, notifications)

res.json({ message: "Notificacoes marcadas como lidas" })
})

app.delete("/notifications", ensureAuthenticated, (req, res) => {
notifications = notifications.filter(notification => notification.userId != req.currentUser.id)
writeData(notificationsFile, notifications)

res.json({ message: "Notificacoes limpas com sucesso" })
})

app.get("/user/:id", (req, res) => {
const user = getUserById(req.params.id)
const viewer = getCurrentUser(req)

if (!user) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

const userMods = mods
.filter(mod => mod.user_id == user.id && (mod.approved || isAdminUser(viewer) || viewer?.id == user.id))
.map(enrichMod)
.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

const favoritesPreview = favorites
.filter(favorite => favorite.userId == user.id)
.map(favorite => mods.find(mod => mod.id == favorite.modId && mod.approved))
.filter(Boolean)
.map(enrichMod)
.slice(0, 6)

res.json({
...sanitizeUser(user, viewer),
mods: userMods,
favorites: favoritesPreview
})
})

function enrichPartnerSection(section) {
return {
...section,
postsCount: partnerPosts.filter(post => post.sectionId == section.id && post.approved !== false).length
}
}

function ensureDefaultPartnerSection() {
if (partnerSections.length) {
return partnerSections.find(section => section.active !== false) || partnerSections[0]
}

const defaultSection = {
id: nextId(partnerSections),
title: "Geral",
description: "Area principal para parceiros publicarem conteudos, links e divulgacoes.",
active: true,
created_at: new Date().toISOString()
}

partnerSections.push(defaultSection)
writeData(partnerSectionsFile, partnerSections)
return defaultSection
}

function enrichPartnerPost(post) {
const author = getUserById(post.userId)

return {
...post,
authorId: author?.id || post.userId,
authorUsername: author?.username || "parceiro",
authorDisplayName: author?.profile?.displayName || author?.username || "parceiro",
authorRole: author?.role || "partner",
authorBadges: getUserBadges(author),
authorProfile: {
avatarUrl: author?.profile?.avatarUrl || "",
accentColor: author?.profile?.accentColor || "#9c4dff"
},
canManage: false
}
}

app.get("/partnership/overview", (req, res) => {
const viewer = getCurrentUser(req)
ensureDefaultPartnerSection()
const sections = partnerSections.filter(section => section.active !== false).map(enrichPartnerSection)
const posts = partnerPosts
.filter(post => post.approved !== false)
.map(post => {
const enriched = enrichPartnerPost(post)
return {
...enriched,
canManage: Boolean(viewer && isPartnerUser(viewer) && (viewer.id == post.userId || isAdminUser(viewer)))
}
})
.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

res.json({
viewer: viewer ? sanitizeUser(viewer, viewer) : null,
sections,
posts
})
})

app.get("/partnership/posts/:id", (req, res) => {
const viewer = getCurrentUser(req)
const post = partnerPosts.find(item => item.id == req.params.id && item.approved !== false)

if (!post) {
return res.status(404).json({ error: "Parceria nao encontrada" })
}

const enriched = enrichPartnerPost(post)

res.json({
viewer: viewer ? sanitizeUser(viewer, viewer) : null,
post: {
...enriched,
canManage: Boolean(viewer && isPartnerUser(viewer) && (viewer.id == post.userId || isAdminUser(viewer)))
},
section: enrichPartnerSection(partnerSections.find(section => section.id == post.sectionId) || ensureDefaultPartnerSection())
})
})

app.post("/partnership/posts", ensureAuthenticated, (req, res) => {
if (!isPartnerUser(req.currentUser)) {
return res.status(403).json({ error: "Somente parceiros e administradores podem publicar nessa area" })
}

const { sectionId, title, description, discordUrl, websiteUrl, youtubeUrl, ctaLabel } = req.body
const fallbackSection = ensureDefaultPartnerSection()
const section = partnerSections.find(item => item.id == sectionId && item.active !== false) || fallbackSection

if (!title || !description) {
return res.status(400).json({ error: "Preencha titulo e descricao" })
}

const newPost = {
id: nextId(partnerPosts),
sectionId: section.id,
userId: req.currentUser.id,
title: String(title).trim(),
description: String(description).trim(),
discordUrl: String(discordUrl || "").trim(),
websiteUrl: String(websiteUrl || "").trim(),
youtubeUrl: String(youtubeUrl || "").trim(),
ctaLabel: String(ctaLabel || "Abrir link").trim(),
approved: true,
created_at: new Date().toISOString()
}

partnerPosts.push(newPost)
writeData(partnerPostsFile, partnerPosts)

res.json({ message: "Conteudo de parceria publicado", post: enrichPartnerPost(newPost) })
})

app.delete("/partnership/posts/:id", ensureAuthenticated, (req, res) => {
const postIndex = partnerPosts.findIndex(post => post.id == req.params.id)

if (postIndex === -1) {
return res.status(404).json({ error: "Post de parceria nao encontrado" })
}

const post = partnerPosts[postIndex]
const canManage = isPartnerUser(req.currentUser) && (req.currentUser.id == post.userId || isAdminUser(req.currentUser))

if (!canManage) {
return res.status(403).json({ error: "Voce nao pode excluir esse conteudo de parceria" })
}

partnerPosts.splice(postIndex, 1)
writeData(partnerPostsFile, partnerPosts)

res.json({ message: "Post de parceria excluido com sucesso" })
})

app.post("/profile/customize", ensureAuthenticated, upload.fields([
{ name: "avatar", maxCount: 1 },
{ name: "cover", maxCount: 1 }
]), (req, res) => {
const { displayName, bio, accentColor, avatarUrl, coverUrl, discord, youtube, instagram, github, location } = req.body
const avatarFile = req.files?.avatar?.[0]
const coverFile = req.files?.cover?.[0]

req.currentUser.profile = {
displayName: String(displayName || req.currentUser.username).trim().slice(0, 40) || req.currentUser.username,
bio: String(bio || "").trim().slice(0, 300),
accentColor: String(accentColor || "#9c4dff").trim() || "#9c4dff",
avatarUrl: avatarFile ? `/uploads/${avatarFile.filename}` : String(avatarUrl || req.currentUser.profile.avatarUrl || "").trim(),
coverUrl: coverFile ? `/uploads/${coverFile.filename}` : String(coverUrl || req.currentUser.profile.coverUrl || "").trim(),
discord: String(discord || "").trim().slice(0, 80),
youtube: String(youtube || "").trim().slice(0, 120),
instagram: String(instagram || "").trim().slice(0, 120),
github: String(github || "").trim().slice(0, 120),
location: String(location || "").trim().slice(0, 60)
}

users = users.map(user => user.id == req.currentUser.id ? req.currentUser : user)
writeData(usersFile, users)

res.json({
message: "Perfil atualizado com sucesso",
user: sanitizeUser(req.currentUser, req.currentUser)
})
})

app.get("/admin/overview", ensureAdmin, (req, res) => {
const pendingMods = mods.filter(mod => !mod.approved).map(enrichMod)
const modsList = mods.map(enrichMod).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
const partnership = {
sections: partnerSections.map(enrichPartnerSection),
posts: partnerPosts.map(enrichPartnerPost).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

res.json({
viewer: sanitizeUser(req.currentUser, req.currentUser),
stats: {
users: users.length,
mods: mods.length,
pendingMods: pendingMods.length,
downloads: mods.reduce((sum, mod) => sum + Number(mod.downloads || 0), 0),
partners: users.filter(user => user.role === "partner").length,
bannedUsers: users.filter(user => user.banned).length
},
settings: {
maintenanceMode: Boolean(siteSettings.maintenanceMode),
maintenanceMessage: siteSettings.maintenanceMessage
},
pendingMods,
mods: modsList,
partnership
})
})

app.get("/admin/users/search", ensureAdmin, (req, res) => {
const query = String(req.query.q || "").trim().toLowerCase()

if (!query) {
return res.json({ items: [] })
}

const items = users
.filter(user => {
const displayName = String(user.profile?.displayName || "").toLowerCase()
const username = String(user.username || "").toLowerCase()
const email = String(user.email || "").toLowerCase()
return displayName.includes(query) || username.includes(query) || email.includes(query)
})
.slice(0, 25)
.map(user => sanitizeUser(user, req.currentUser))

res.json({ items })
})

app.post("/admin/approve/:id", ensureAdmin, (req, res) => {
const mod = mods.find(item => item.id == req.params.id)

if (!mod) {
return res.status(404).json({ error: "Mod nao encontrado" })
}

mod.approved = 1
writeData(modsFile, mods)

if (mod.user_id != req.currentUser.id) {
createNotification({
userId: mod.user_id,
actorId: req.currentUser.id,
type: "mod-approved",
title: "Seu mod foi aprovado",
message: `"${mod.title}" foi aprovado e ja esta visivel no site.`,
link: `/mod.html?id=${mod.id}`
})
}

res.json({ message: "Mod aprovado", mod: enrichMod(mod) })
})

app.post("/admin/reject/:id", ensureAdmin, (req, res) => {
const mod = mods.find(item => item.id == req.params.id)

if (!mod) {
return res.status(404).json({ error: "Mod nao encontrado" })
}

mod.approved = 0
writeData(modsFile, mods)

if (mod.user_id != req.currentUser.id) {
createNotification({
userId: mod.user_id,
actorId: req.currentUser.id,
type: "mod-review",
title: "Seu mod voltou para analise",
message: `"${mod.title}" foi marcado como nao aprovado e voltou para revisao.`,
link: `/profile.html?id=${mod.user_id}`
})
}

res.json({ message: "Mod marcado como nao aprovado", mod: enrichMod(mod) })
})

app.put("/admin/mod/:id", ensureAdmin, (req, res) => {
const mod = mods.find(item => item.id == req.params.id)

if (!mod) {
return res.status(404).json({ error: "Mod nao encontrado" })
}

const { title, description, credits, game } = req.body

mod.title = String(title || mod.title).trim()
mod.description = String(description || mod.description).trim()
mod.credits = String(credits || mod.credits || "").trim()
mod.game = canonicalizeGame(game || mod.game)

writeData(modsFile, mods)

res.json({ message: "Mod atualizado", mod: enrichMod(mod) })
})

app.put("/mod/:id/edit", ensureAuthenticated, (req, res) => {
const mod = mods.find(item => item.id == req.params.id)

if (!mod) {
return res.status(404).json({ error: "Mod nao encontrado" })
}

if (!canManageMod(req.currentUser, mod)) {
return res.status(403).json({ error: "Voce nao pode editar esse mod" })
}

const { title, description, credits, game } = req.body

mod.title = String(title || mod.title).trim()
mod.description = String(description || mod.description).trim()
mod.credits = String(credits || mod.credits || "").trim()
mod.game = canonicalizeGame(game || mod.game)

writeData(modsFile, mods)

res.json({ message: "Mod atualizado com sucesso", mod: enrichMod(mod) })
})

app.delete("/admin/delete/:id", ensureAdmin, (req, res) => {
mods = mods.filter(mod => mod.id != req.params.id)
comments = comments.filter(comment => comment.modId != req.params.id)
ratings = ratings.filter(rating => rating.modId != req.params.id)
favorites = favorites.filter(favorite => favorite.modId != req.params.id)

writeData(modsFile, mods)
writeData(commentsFile, comments)
writeData(ratingsFile, ratings)
writeData(favoritesFile, favorites)

res.json({ message: "Mod excluido" })
})

app.patch("/admin/users/:id/post-access", ensureAdmin, (req, res) => {
const target = getUserById(req.params.id)

if (!target) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

target.canPost = Boolean(req.body.canPost)
writeData(usersFile, users)

createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "post-access",
title: target.canPost ? "Postagem liberada" : "Postagem removida",
message: target.canPost
? "Sua conta agora pode publicar mods na plataforma."
: "Sua permissao para publicar mods foi removida.",
link: `/profile.html?id=${target.id}`
})

res.json({ message: "Permissao de postagem atualizada", user: sanitizeUser(target, req.currentUser) })
})

app.patch("/master/users/:id/role", ensureMasterAdmin, (req, res) => {
const target = getUserById(req.params.id)
const role = String(req.body.role || "user")

if (!target) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

if (target.username === MASTER_USERNAME) {
return res.status(400).json({ error: "A conta master admin nao pode ser alterada" })
}

if (!["user", "admin", "partner"].includes(role)) {
return res.status(400).json({ error: "Cargo invalido" })
}

target.role = role
writeData(usersFile, users)

createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "role",
title: "Seu cargo foi atualizado",
message: role === "admin"
? "Voce agora faz parte da administracao."
: role === "partner"
? "Voce agora recebeu o cargo de parceiro."
: "Seu cargo foi redefinido para usuario.",
link: `/profile.html?id=${target.id}`
})

res.json({ message: "Cargo atualizado", user: sanitizeUser(target, req.currentUser) })
})

app.patch("/master/users/:id/recovery-access", ensureMasterAdmin, (req, res) => {
const target = getUserById(req.params.id)
const enabled = Boolean(req.body.enabled)

if (!target) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

if (target.username === MASTER_USERNAME && !enabled) {
return res.status(400).json({ error: "A conta master nao pode ficar sem acesso de recuperacao liberado por esse fluxo" })
}

if (enabled) {
target.recoveryAuthorized = true
target.recoveryRequestedAt = new Date().toISOString()
target.recoveryExpiresAt = new Date(Date.now() + ACCOUNT_RECOVERY_WINDOW_MS).toISOString()
target.recoveryToken = crypto.randomBytes(24).toString("hex")
} else {
clearRecoveryAccess(target)
}

writeData(usersFile, users)

createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "account-recovery",
title: enabled ? "Recuperacao de conta liberada" : "Recuperacao de conta encerrada",
message: enabled
? "O suporte liberou temporariamente a troca de senha. Tente entrar para abrir a tela de redefinicao."
: "A janela de recuperacao foi encerrada pelo suporte.",
link: "/login.html"
})

res.json({
message: enabled
? "Recuperacao de conta liberada por 1 hora."
: "Recuperacao de conta removida.",
user: sanitizeUser(target, req.currentUser)
})
})

app.patch("/master/users/:id/security-bypass", ensureMasterAdmin, (req, res) => {
const target = getUserById(req.params.id)
const enabled = Boolean(req.body.enabled)

if (!target) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

ensureUserSecurityState(target)
target.security.securityBypassUntil = enabled ? new Date(Date.now() + ACCOUNT_RECOVERY_WINDOW_MS).toISOString() : null
writeData(usersFile, users)

createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "security-access",
title: enabled ? "Novo dispositivo liberado" : "Liberacao de novo dispositivo encerrada",
message: enabled
? "O suporte liberou temporariamente o acesso para validar um novo IP ou dispositivo. Entre novamente dentro da janela liberada."
: "A janela de liberacao de novo dispositivo foi encerrada.",
link: "/login.html"
})

res.json({
message: enabled ? "Novo dispositivo liberado por 1 hora." : "Liberacao de novo dispositivo removida.",
user: sanitizeUser(target, req.currentUser)
})
})

app.patch("/admin/users/:id/badges", ensureAdmin, (req, res) => {
const target = getUserById(req.params.id)
const updates = req.body || {}

if (!target) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

target.badges = target.badges || { verified: false, booster: false, ownerTag: false, adminTag: false }

if (typeof updates.booster === "boolean") {
target.badges.booster = updates.booster
createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "badge",
title: updates.booster ? "Voce recebeu a tag Booster" : "Sua tag Booster foi removida",
message: updates.booster
? "Sua conta agora aparece com a tag roxa Booster."
: "A tag Booster foi removida da sua conta.",
link: `/profile.html?id=${target.id}`
})
}

if (typeof updates.verified === "boolean" || typeof updates.ownerTag === "boolean" || typeof updates.adminTag === "boolean") {
if (!isMasterAdmin(req.currentUser)) {
return res.status(403).json({ error: "Somente o master admin pode alterar essas tags" })
}

if (typeof updates.verified === "boolean") {
target.badges.verified = updates.verified
createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "badge",
title: updates.verified ? "Conta verificada" : "Verificado removido",
message: updates.verified
? "Sua conta recebeu a tag verde de verificado."
: "A tag de verificado foi removida da sua conta.",
link: `/profile.html?id=${target.id}`
})
}

if (typeof updates.ownerTag === "boolean") {
target.badges.ownerTag = updates.ownerTag
createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "badge",
title: updates.ownerTag ? "Tag Dono aplicada" : "Tag Dono removida",
message: updates.ownerTag
? "Sua conta agora mostra a tag amarela de Dono."
: "A tag de Dono foi removida da sua conta.",
link: `/profile.html?id=${target.id}`
})
}

if (typeof updates.adminTag === "boolean") {
target.badges.adminTag = updates.adminTag
createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "badge",
title: updates.adminTag ? "Tag Admin aplicada" : "Tag Admin removida",
message: updates.adminTag
? "Sua conta agora mostra a tag azul de Admin."
: "A tag de Admin foi removida da sua conta.",
link: `/profile.html?id=${target.id}`
})
}
}

writeData(usersFile, users)

res.json({
message: "Badges atualizadas com sucesso",
user: sanitizeUser(target, req.currentUser)
})
})

app.patch("/master/users/:id/ban", ensureMasterAdmin, (req, res) => {
const target = getUserById(req.params.id)

if (!target) {
return res.status(404).json({ error: "Usuario nao encontrado" })
}

if (target.username === MASTER_USERNAME) {
return res.status(400).json({ error: "A conta master admin nao pode ser banida" })
}

target.banned = Boolean(req.body.banned)
target.banReason = target.banned ? String(req.body.reason || "Violacao das regras da plataforma").trim() : ""
target.banDate = target.banned ? new Date().toISOString() : null

if (target.banned) {
destroySessionsForUser(target.id, {
exceptSid: req.sessionID && Number(target.id) === Number(req.currentUser.id) ? req.sessionID : null
})
}

writeData(usersFile, users)

createNotification({
userId: target.id,
actorId: req.currentUser.id,
type: "ban",
title: target.banned ? "Sua conta foi banida" : "Banimento removido",
message: target.banned
? `Sua conta foi banida. Motivo: ${target.banReason || "Violacao das regras da plataforma"}`
: "Sua conta voltou a ter acesso normal a plataforma.",
link: target.banned ? "/banned.html" : `/profile.html?id=${target.id}`
})

res.json({
message: target.banned ? "Usuario banido com sucesso e sessoes encerradas" : "Banimento removido com sucesso",
user: sanitizeUser(target, req.currentUser)
})
})

app.post("/master/partner-sections", ensureMasterAdmin, (req, res) => {
const { title, description } = req.body

if (!title) {
return res.status(400).json({ error: "Titulo da secao obrigatorio" })
}

const section = {
id: nextId(partnerSections),
title: String(title).trim(),
description: String(description || "").trim(),
active: true,
created_at: new Date().toISOString()
}

partnerSections.push(section)
writeData(partnerSectionsFile, partnerSections)

res.json({ message: "Secao de parceria criada", section: enrichPartnerSection(section) })
})

app.patch("/master/partner-sections/:id", ensureMasterAdmin, (req, res) => {
const section = partnerSections.find(item => item.id == req.params.id)

if (!section) {
return res.status(404).json({ error: "Secao nao encontrada" })
}

section.title = String(req.body.title || section.title).trim()
section.description = String(req.body.description || section.description || "").trim()
if (typeof req.body.active === "boolean") {
section.active = req.body.active
}

writeData(partnerSectionsFile, partnerSections)

res.json({ message: "Secao de parceria atualizada", section: enrichPartnerSection(section) })
})

app.patch("/master/site-settings", ensureMasterAdmin, (req, res) => {
if (typeof req.body.maintenanceMode === "boolean") {
siteSettings.maintenanceMode = req.body.maintenanceMode
}

if (typeof req.body.maintenanceMessage === "string") {
siteSettings.maintenanceMessage = String(req.body.maintenanceMessage).trim() || siteSettings.maintenanceMessage
}

writeObjectData(siteSettingsFile, siteSettings)

res.json({
message: siteSettings.maintenanceMode ? "Modo manutencao ativado" : "Modo manutencao desativado",
settings: siteSettings
})
})

app.post("/master/broadcast", ensureMasterAdmin, (req, res) => {
const title = String(req.body.title || "").trim()
const message = String(req.body.message || "").trim()
const link = String(req.body.link || "/").trim() || "/"

if (!title || !message) {
return res.status(400).json({ error: "Preencha titulo e mensagem do aviso global" })
}

const targetIds = users.filter(user => !user.banned).map(user => user.id)

createNotificationForUsers(targetIds, {
actorId: req.currentUser.id,
type: "broadcast",
title,
message,
link
})

res.json({ message: "Aviso global enviado com sucesso" })
})

app.get("/api/ai/status", (req, res) => {
res.json({
configured: Boolean(process.env.OPENAI_API_KEY),
model: process.env.OPENAI_CHAT_MODEL || "gpt-5",
viewer: getCurrentUser(req) ? sanitizeUser(getCurrentUser(req), getCurrentUser(req)) : null
})
})

app.get("/api/ai/conversations", (req, res) => {
const owner = getConversationOwner(req)
const items = aiConversations
.filter(conversation => {
if (owner.userId && Number(conversation.userId) === owner.userId) {
return true
}

return conversation.actorKey === owner.actorKey
})
.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
.map(getConversationPreview)

res.json({ items })
})

app.post("/api/ai/conversations", (req, res) => {
const conversation = createAiConversation(req, {
title: req.body.title,
firstMessage: req.body.firstMessage,
pageContext: req.body.pageContext || null
})

res.status(201).json({
message: "Conversa criada com sucesso",
conversation
})
})

app.get("/api/ai/conversations/:id", (req, res) => {
const conversation = getConversationForRequest(req, req.params.id)

if (!conversation) {
return res.status(404).json({ error: "Conversa nao encontrada" })
}

res.json({ conversation })
})

app.delete("/api/ai/conversations/:id", (req, res) => {
const conversation = getConversationForRequest(req, req.params.id)

if (!conversation) {
return res.status(404).json({ error: "Conversa nao encontrada" })
}

aiConversations = aiConversations.filter(item => item.id !== conversation.id)
saveAiConversations()

res.json({ message: "Conversa removida com sucesso" })
})

app.post("/api/ai/chat", async (req, res) => {
const message = String(req.body.message || "").trim()

if (!message) {
return res.status(400).json({ error: "Envie uma mensagem para falar com a IA" })
}

let conversation = req.body.conversationId
? getConversationForRequest(req, req.body.conversationId)
: null

if (!conversation) {
conversation = createAiConversation(req, {
firstMessage: message,
pageContext: req.body.pageContext || null
})
}

if (req.body.pageContext) {
conversation.pageContext = req.body.pageContext
}

const userMessage = {
id: crypto.randomUUID(),
role: "user",
content: message,
createdAt: new Date().toISOString()
}

conversation.messages.push(userMessage)
conversation.updatedAt = userMessage.createdAt

if (!conversation.title || conversation.title === "Nova conversa") {
conversation.title = message.length > 60 ? `${message.slice(0, 57)}...` : message
}

const siteContext = buildAiSiteContext(req, req.body.pageContext || conversation.pageContext || {})

try {
const aiResponse = await createOpenAIResponse({
message,
conversation,
siteContext
})

if (!aiResponse.ok) {
conversation.messages.pop()
conversation.updatedAt = new Date().toISOString()
saveAiConversations()
return res.status(aiResponse.status || 500).json({ error: aiResponse.error || "Erro ao falar com a IA" })
}

const assistantMessage = {
id: crypto.randomUUID(),
role: "assistant",
content: aiResponse.text,
createdAt: new Date().toISOString(),
model: aiResponse.model
}

conversation.messages.push(assistantMessage)
conversation.updatedAt = assistantMessage.createdAt
saveAiConversations()

res.json({
message: "Resposta gerada com sucesso",
conversation: getConversationPreview(conversation),
reply: assistantMessage
})
} catch (error) {
conversation.messages.pop()
conversation.updatedAt = new Date().toISOString()
saveAiConversations()

res.status(500).json({
error: "Falha inesperada ao conversar com a IA",
details: error.message
})
}
})

app.use((req, res) => {
if ((req.headers.accept || "").includes("text/html")) {
return res.status(404).sendFile(path.join(__dirname, "not-found.html"))
}

res.status(404).json({ error: "Pagina nao encontrada" })
})

app.listen(PORT, () => {
console.log(`Server rodando em http://localhost:${PORT}`)
})

sendAutomatedSiteNotification()
setInterval(() => {
sendAutomatedSiteNotification()
}, 1000 * 60 * 60 * 2)
