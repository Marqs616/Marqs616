;(function bootstrapSiteUi() {
const styleId = "site-ui-runtime"

if (!document.getElementById(styleId)) {
const style = document.createElement("style")
style.id = styleId
style.textContent = `
.toast-stack {
position: fixed;
right: 18px;
bottom: 18px;
z-index: 9999;
display: grid;
gap: 12px;
width: min(380px, calc(100vw - 24px));
}

.site-toast {
padding: 16px 18px;
border-radius: 22px;
border: 1px solid rgba(255,255,255,0.08);
background:
linear-gradient(180deg, rgba(17,17,25,0.96), rgba(10,10,16,0.96));
box-shadow: 0 20px 55px rgba(0,0,0,0.38);
display: grid;
gap: 6px;
transform: translateY(16px);
opacity: 0;
animation: toastIn 0.28s ease forwards;
}

.site-toast.success {
border-color: rgba(37, 197, 139, 0.25);
box-shadow: 0 20px 55px rgba(10, 120, 80, 0.18);
}

.site-toast.error {
border-color: rgba(255, 95, 122, 0.25);
box-shadow: 0 20px 55px rgba(120, 10, 40, 0.18);
}

.site-toast.info {
border-color: rgba(156, 77, 255, 0.25);
}

.site-toast-title {
font-family: "Sora", "Space Grotesk", Arial, sans-serif;
font-weight: 700;
color: #f7efff;
}

.site-toast-text {
color: #c9c1e1;
line-height: 1.55;
}

.offline-banner {
position: fixed;
right: 18px;
top: 18px;
transform: translateY(-120%);
z-index: 9998;
padding: 12px 16px;
border-radius: 18px;
background: rgba(255, 95, 122, 0.92);
color: #fff;
font-weight: 700;
box-shadow: 0 16px 35px rgba(120, 10, 40, 0.28);
transition: transform 0.28s ease, opacity 0.28s ease;
opacity: 0;
max-width: min(360px, calc(100vw - 24px));
}

.offline-banner.active {
transform: translateY(0);
opacity: 1;
}

.site-progress {
position: fixed;
top: 0;
left: 0;
height: 3px;
width: 0;
z-index: 10001;
background: linear-gradient(90deg, #6a00ff, #c47dff, #7ef3ff);
box-shadow: 0 0 18px rgba(156, 77, 255, 0.5);
transition: width 0.12s linear;
}

.back-to-top {
position: fixed;
right: 18px;
bottom: 18px;
z-index: 9997;
width: 52px;
height: 52px;
border-radius: 50%;
border: 1px solid rgba(255,255,255,0.1);
background:
radial-gradient(circle at 30% 30%, rgba(255,255,255,0.14), transparent 30%),
linear-gradient(135deg, rgba(106,0,255,0.95), rgba(156,77,255,0.95));
color: #fff;
font-size: 1.2rem;
box-shadow: 0 18px 45px rgba(56, 12, 95, 0.28);
display: inline-flex;
align-items: center;
justify-content: center;
opacity: 0;
transform: translateY(16px) scale(0.96);
pointer-events: none;
transition: opacity 0.22s ease, transform 0.22s ease, box-shadow 0.22s ease;
}

.back-to-top.visible {
opacity: 1;
transform: translateY(0) scale(1);
pointer-events: auto;
}

.back-to-top:hover {
transform: translateY(-2px) scale(1.04);
box-shadow: 0 22px 54px rgba(86, 19, 140, 0.38);
}

.ai-launcher {
position: fixed;
right: 18px;
bottom: 82px;
z-index: 9997;
display: inline-flex;
align-items: center;
gap: 10px;
padding: 12px 16px;
border-radius: 999px;
border: 1px solid rgba(156, 77, 255, 0.18);
background:
radial-gradient(circle at 20% 20%, rgba(156,77,255,0.16), transparent 30%),
linear-gradient(135deg, rgba(20,18,30,0.96), rgba(10,10,16,0.96));
color: #eff8ff;
box-shadow: 0 18px 44px rgba(24, 8, 48, 0.35);
transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.ai-launcher:hover {
transform: translateY(-2px);
border-color: rgba(156, 77, 255, 0.3);
box-shadow: 0 22px 54px rgba(42, 16, 88, 0.42);
}

.ai-launcher-badge {
width: 34px;
height: 34px;
border-radius: 50%;
display: inline-flex;
align-items: center;
justify-content: center;
background: linear-gradient(135deg, #6a00ff, #9c4dff);
color: #f4ebff;
font-weight: 800;
}

.ai-launcher-copy {
display: grid;
line-height: 1.1;
}

.ai-launcher-copy strong {
color: #f3fbff;
font-size: 0.95rem;
}

.ai-launcher-copy span {
color: #c7b1ef;
font-size: 0.72rem;
letter-spacing: 0.08em;
text-transform: uppercase;
}

.mobile-menu-toggle {
display: none;
width: 46px;
height: 46px;
border-radius: 16px;
border: 1px solid rgba(255,255,255,0.08);
background:
linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.04));
color: #f5ebff;
align-items: center;
justify-content: center;
position: relative;
overflow: hidden;
box-shadow: 0 16px 34px rgba(0,0,0,0.2);
}

.mobile-menu-toggle-lines,
.mobile-menu-toggle-lines::before,
.mobile-menu-toggle-lines::after {
display: block;
width: 18px;
height: 2px;
border-radius: 999px;
background: currentColor;
transition: transform 0.22s ease, opacity 0.22s ease;
content: "";
}

.mobile-menu-toggle-lines::before {
transform: translateY(-6px);
}

.mobile-menu-toggle-lines::after {
transform: translateY(4px);
}

.mobile-menu-toggle.active .mobile-menu-toggle-lines {
transform: rotate(45deg);
}

.mobile-menu-toggle.active .mobile-menu-toggle-lines::before {
transform: translateY(0);
opacity: 0;
}

.mobile-menu-toggle.active .mobile-menu-toggle-lines::after {
transform: translateY(-2px) rotate(-90deg);
}

.mobile-drawer-backdrop {
position: fixed;
inset: 0;
z-index: 9996;
background: rgba(5, 5, 10, 0.52);
backdrop-filter: blur(10px);
opacity: 0;
pointer-events: none;
transition: opacity 0.22s ease;
}

.mobile-drawer-backdrop.active {
opacity: 1;
pointer-events: auto;
}

.mobile-drawer {
position: fixed;
top: 0;
right: 0;
height: 100vh;
width: min(360px, 88vw);
z-index: 9997;
padding: 22px;
display: grid;
gap: 18px;
align-content: start;
background:
radial-gradient(circle at top right, rgba(156,77,255,0.16), transparent 28%),
linear-gradient(180deg, rgba(20,20,30,0.98), rgba(8,8,14,0.98));
border-left: 1px solid rgba(255,255,255,0.08);
box-shadow: -24px 0 60px rgba(0,0,0,0.35);
transform: translateX(110%);
transition: transform 0.26s ease;
}

.mobile-drawer.active {
transform: translateX(0);
}

.mobile-drawer-head {
display: flex;
align-items: center;
justify-content: space-between;
gap: 12px;
}

.mobile-drawer-title {
font-family: "Sora", "Space Grotesk", Arial, sans-serif;
font-size: 1rem;
font-weight: 800;
letter-spacing: 0.14em;
text-transform: uppercase;
color: #f1e1ff;
}

.mobile-drawer-close {
width: 42px;
height: 42px;
border-radius: 14px;
border: 1px solid rgba(255,255,255,0.08);
background: rgba(255,255,255,0.05);
color: #f2e7ff;
display: inline-flex;
align-items: center;
justify-content: center;
font-size: 1.2rem;
}

.mobile-drawer-block {
display: grid;
gap: 10px;
padding: 16px;
border-radius: 22px;
border: 1px solid rgba(255,255,255,0.07);
background: rgba(255,255,255,0.03);
}

.mobile-drawer-label {
font-size: 0.78rem;
font-weight: 700;
letter-spacing: 0.12em;
text-transform: uppercase;
color: #cdb7f7;
}

.mobile-drawer-links {
display: grid;
gap: 8px;
}

.mobile-drawer-links a {
padding: 12px 14px;
border-radius: 16px;
color: #f2ecff;
background: rgba(255,255,255,0.03);
border: 1px solid rgba(255,255,255,0.05);
transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.mobile-drawer-links a:hover {
transform: translateX(3px);
border-color: rgba(156,77,255,0.24);
background: rgba(156,77,255,0.08);
}

.site-modal-backdrop,
.site-loader {
position: fixed;
inset: 0;
z-index: 10000;
display: flex;
align-items: center;
justify-content: center;
background: rgba(5, 5, 10, 0.74);
backdrop-filter: blur(16px);
}

.site-modal-backdrop {
padding: 20px;
}

.site-modal {
width: min(460px, 100%);
padding: 24px;
border-radius: 28px;
border: 1px solid rgba(255,255,255,0.08);
background:
radial-gradient(circle at top right, rgba(156,77,255,0.18), transparent 28%),
linear-gradient(180deg, rgba(20,20,30,0.96), rgba(10,10,16,0.96));
box-shadow: 0 30px 80px rgba(0,0,0,0.45);
display: grid;
gap: 14px;
animation: modalIn 0.24s ease;
}

.site-modal h3 {
color: #f8f0ff;
}

.site-modal p {
color: #cfc7e6;
line-height: 1.65;
}

.site-modal-actions {
display: flex;
justify-content: flex-end;
gap: 10px;
flex-wrap: wrap;
}

.site-loader {
flex-direction: column;
gap: 20px;
transition: opacity 0.35s ease, visibility 0.35s ease;
background:
radial-gradient(circle at top left, rgba(156, 77, 255, 0.16), transparent 26%),
radial-gradient(circle at 82% 20%, rgba(106, 0, 255, 0.2), transparent 22%),
rgba(5, 5, 10, 0.86);
}

.site-loader.hidden {
opacity: 0;
visibility: hidden;
pointer-events: none;
}

.site-loader-logo {
font-family: "Sora", "Space Grotesk", Arial, sans-serif;
font-size: clamp(2rem, 6vw, 4rem);
font-weight: 800;
letter-spacing: 0.14em;
text-transform: uppercase;
color: #f1e1ff;
text-shadow: 0 0 16px rgba(156, 77, 255, 0.4), 0 0 30px rgba(106, 0, 255, 0.2);
animation: loaderPulse 1.8s ease-in-out infinite;
}

.site-loader-kicker {
padding: 8px 14px;
border-radius: 999px;
border: 1px solid rgba(255,255,255,0.08);
background: rgba(255,255,255,0.04);
color: #d5c2ff;
font-family: "Sora", "Space Grotesk", Arial, sans-serif;
font-size: 0.82rem;
letter-spacing: 0.16em;
text-transform: uppercase;
}

.site-loader-copy {
color: #c9c1e1;
text-align: center;
max-width: 520px;
line-height: 1.7;
}

.site-loader-bar {
width: min(280px, 70vw);
height: 10px;
border-radius: 999px;
background: rgba(255, 255, 255, 0.07);
overflow: hidden;
box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
}

.site-loader-bar::after {
content: "";
display: block;
height: 100%;
width: 42%;
border-radius: inherit;
background: linear-gradient(90deg, #6a00ff, #c47dff);
animation: loaderRun 1.2s ease-in-out infinite;
}

@keyframes toastIn {
to {
opacity: 1;
transform: translateY(0);
}
}

@keyframes modalIn {
from {
opacity: 0;
transform: translateY(16px) scale(0.98);
}
to {
opacity: 1;
transform: translateY(0) scale(1);
}
}

@keyframes loaderPulse {
0%, 100% {
transform: scale(1);
opacity: 0.9;
}
50% {
transform: scale(1.03);
opacity: 1;
}
}

@keyframes loaderRun {
0% {
transform: translateX(-120%);
}
100% {
transform: translateX(260%);
}
}

@media (max-width: 720px) {
.toast-stack {
right: 10px;
left: 10px;
bottom: 10px;
width: auto;
}

.offline-banner {
right: 10px;
left: 10px;
max-width: none;
}

.ai-launcher {
right: 12px;
bottom: 74px;
padding: 10px 12px;
gap: 8px;
max-width: calc(100vw - 24px);
border-radius: 22px;
}

.ai-launcher-badge {
width: 30px;
height: 30px;
font-size: 0.95rem;
flex: 0 0 auto;
}

.ai-launcher-copy strong {
font-size: 0.82rem;
}

.ai-launcher-copy span {
font-size: 0.62rem;
letter-spacing: 0.06em;
}

.mobile-menu-toggle {
display: inline-flex;
}
}

@media (max-width: 540px) {
.ai-launcher {
padding: 9px;
border-radius: 18px;
min-width: 0;
}

.ai-launcher-copy span {
display: none;
}

.ai-launcher-copy strong {
font-size: 0.78rem;
}
}

@media (max-width: 420px) {
.ai-launcher {
right: 10px;
bottom: 72px;
padding: 8px;
}

.ai-launcher-copy {
display: none;
}

.ai-launcher-badge {
width: 34px;
height: 34px;
}
}
`
document.head.appendChild(style)
}

const toastStack = document.createElement("div")
toastStack.className = "toast-stack"
document.body.appendChild(toastStack)

const progress = document.createElement("div")
progress.className = "site-progress"
document.body.appendChild(progress)

const offlineBanner = document.createElement("div")
offlineBanner.className = "offline-banner"
offlineBanner.textContent = "Sem conexao com a internet. Algumas funcoes podem falhar."
document.body.appendChild(offlineBanner)

const backToTop = document.createElement("button")
backToTop.className = "back-to-top"
backToTop.type = "button"
backToTop.setAttribute("aria-label", "Voltar ao topo")
backToTop.textContent = "↑"
backToTop.addEventListener("click", () => {
window.scrollTo({ top: 0, behavior: "smooth" })
})
document.body.appendChild(backToTop)

const aiLauncher = document.createElement("a")
aiLauncher.className = "ai-launcher"
aiLauncher.href = "/ai.html"
aiLauncher.innerHTML = `
<span class="ai-launcher-badge">AI</span>
<span class="ai-launcher-copy">
<strong>DRXZ AI</strong>
<span>Abrir assistente</span>
</span>
`
document.body.appendChild(aiLauncher)

const loader = document.createElement("div")
loader.className = "site-loader"
loader.innerHTML = `
<div class="site-loader-kicker">Carregando experiencia</div>
<div class="site-loader-logo">DRXZ MODS</div>
<div class="site-loader-bar"></div>
<div class="site-loader-copy">Preparando os mods, perfis e o visual da plataforma para voce entrar no clima certo.</div>
`
document.body.appendChild(loader)

const drawerBackdrop = document.createElement("div")
drawerBackdrop.className = "mobile-drawer-backdrop"
document.body.appendChild(drawerBackdrop)

const mobileDrawer = document.createElement("aside")
mobileDrawer.className = "mobile-drawer"
mobileDrawer.innerHTML = `
<div class="mobile-drawer-head">
<div class="mobile-drawer-title">DRXZ MODS</div>
<button type="button" class="mobile-drawer-close" aria-label="Fechar menu">×</button>
</div>
<div class="mobile-drawer-block">
<span class="mobile-drawer-label">Navegacao</span>
<div class="mobile-drawer-links" id="mobilePrimaryLinks"></div>
</div>
<div class="mobile-drawer-block">
<span class="mobile-drawer-label">Conta</span>
<div class="mobile-drawer-links" id="mobileAccountLinks"></div>
</div>
`
document.body.appendChild(mobileDrawer)

let mobileMenuButton = null

function setMobileDrawerState(open) {
mobileDrawer.classList.toggle("active", open)
drawerBackdrop.classList.toggle("active", open)
mobileMenuButton?.classList.toggle("active", open)
document.body.style.overflow = open ? "hidden" : ""
}

function buildMobileMenuButton() {
const navbar = document.querySelector(".navbar")

if (!navbar || mobileMenuButton) {
return
}

mobileMenuButton = document.createElement("button")
mobileMenuButton.type = "button"
mobileMenuButton.className = "mobile-menu-toggle"
mobileMenuButton.setAttribute("aria-label", "Abrir menu")
mobileMenuButton.innerHTML = `<span class="mobile-menu-toggle-lines"></span>`
mobileMenuButton.addEventListener("click", () => {
setMobileDrawerState(!mobileDrawer.classList.contains("active"))
})
navbar.appendChild(mobileMenuButton)
}

function populateMobileDrawer() {
const primaryContainer = document.getElementById("mobilePrimaryLinks")
const accountContainer = document.getElementById("mobileAccountLinks")
const navLinks = Array.from(document.querySelectorAll(".nav-left nav a"))
const authLinks = Array.from(document.querySelectorAll("#authArea a"))
const dropdownLinks = Array.from(document.querySelectorAll(".nav-user .dropdown a")).filter(link => {
return link.style.display !== "none"
})

if (!primaryContainer || !accountContainer) {
return
}

primaryContainer.innerHTML = ""
accountContainer.innerHTML = ""

navLinks.forEach(link => {
const clone = link.cloneNode(true)
clone.addEventListener("click", () => setMobileDrawerState(false))
primaryContainer.appendChild(clone)
})

if (!primaryContainer.querySelector('a[href="/ai.html"]')) {
const aiLink = document.createElement("a")
aiLink.href = "/ai.html"
aiLink.textContent = "DRXZ AI"
aiLink.addEventListener("click", () => setMobileDrawerState(false))
primaryContainer.appendChild(aiLink)
}

const accountSources = authLinks.length ? authLinks : dropdownLinks

accountSources.forEach(link => {
const clone = link.cloneNode(true)
clone.addEventListener("click", () => setMobileDrawerState(false))
accountContainer.appendChild(clone)
})
}

window.refreshMobileNav = function refreshMobileNav() {
buildMobileMenuButton()
populateMobileDrawer()
}

drawerBackdrop.addEventListener("click", () => setMobileDrawerState(false))
mobileDrawer.querySelector(".mobile-drawer-close")?.addEventListener("click", () => setMobileDrawerState(false))

window.showToast = function showToast(message, type = "info", title = "") {
const toast = document.createElement("div")
toast.className = `site-toast ${type}`
toast.innerHTML = `
<div class="site-toast-title">${title || (type === "success" ? "Tudo certo" : type === "error" ? "Algo deu errado" : "Aviso")}</div>
<div class="site-toast-text">${message}</div>
`
toastStack.appendChild(toast)

window.setTimeout(() => {
toast.style.opacity = "0"
toast.style.transform = "translateY(12px)"
window.setTimeout(() => toast.remove(), 220)
}, 3200)
}

window.showConfirm = function showConfirm({
title = "Confirmar acao",
message = "Tem certeza que deseja continuar?",
confirmLabel = "Confirmar",
cancelLabel = "Cancelar",
tone = "danger"
} = {}) {
return new Promise(resolve => {
const backdrop = document.createElement("div")
backdrop.className = "site-modal-backdrop"
backdrop.innerHTML = `
<div class="site-modal">
<h3>${title}</h3>
<p>${message}</p>
<div class="site-modal-actions">
<button class="ghost-btn" type="button" data-modal-cancel>${cancelLabel}</button>
<button class="${tone === "danger" ? "danger-btn" : "btn"}" type="button" data-modal-confirm>${confirmLabel}</button>
</div>
</div>
`

function close(result) {
backdrop.remove()
resolve(result)
}

backdrop.addEventListener("click", event => {
if (event.target === backdrop) {
close(false)
}
})

backdrop.querySelector("[data-modal-cancel]").addEventListener("click", () => close(false))
backdrop.querySelector("[data-modal-confirm]").addEventListener("click", () => close(true))
document.body.appendChild(backdrop)
})
}

window.alert = function customAlert(message) {
window.showToast(String(message || "Aviso"), "info", "Aviso")
}

function syncOfflineState() {
offlineBanner.classList.toggle("active", !navigator.onLine)
}

function updatePageChrome() {
const scrollTop = window.scrollY || document.documentElement.scrollTop
const docHeight = document.documentElement.scrollHeight - window.innerHeight
const progressWidth = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0
progress.style.width = `${Math.max(0, Math.min(100, progressWidth))}%`
backToTop.classList.toggle("visible", scrollTop > 320)
}

function bindGlobalSearch() {
const searchInput = document.getElementById("searchTop")

if (!searchInput) {
return
}

function runSearch() {
const query = String(searchInput.value || "").trim()
const target = new URL("/explore.html", window.location.origin)

if (query) {
target.searchParams.set("q", query)
}

window.location.href = target.toString()
}

searchInput.addEventListener("keydown", event => {
if (event.key !== "Enter") {
return
}

event.preventDefault()
runSearch()
})

searchInput.addEventListener("search", runSearch)
}

window.addEventListener("offline", () => {
syncOfflineState()
window.showToast("Voce ficou offline. Verifique sua internet para continuar usando o site.", "error", "Sem conexao")
})

window.addEventListener("online", () => {
syncOfflineState()
window.showToast("Conexao restaurada. O site ja pode ser usado normalmente.", "success", "Internet voltou")
})

syncOfflineState()
updatePageChrome()
window.refreshMobileNav()
bindGlobalSearch()

window.addEventListener("scroll", updatePageChrome, { passive: true })
window.addEventListener("resize", updatePageChrome)

window.addEventListener("load", () => {
window.setTimeout(() => {
loader.classList.add("hidden")
window.setTimeout(() => loader.remove(), 360)
}, 450)
updatePageChrome()
})

const nativeFetch = window.fetch.bind(window)
window.fetch = async (...args) => {
try {
return await nativeFetch(...args)
} catch (error) {
window.showToast("Nao foi possivel conectar ao servidor agora. Tente novamente em instantes.", "error", "Falha de conexao")
throw error
}
}
})()
