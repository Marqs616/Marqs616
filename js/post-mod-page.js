function syncFileLabel(inputId, labelId, emptyText) {
const input = document.getElementById(inputId)
const label = document.getElementById(labelId)

if (!input || !label) {
return
}

input.addEventListener("change", () => {
label.textContent = input.files.length ? input.files[0].name : emptyText
})
}

function preselectGameFromQuery() {
const params = new URLSearchParams(window.location.search)
const game = params.get("game")
const select = document.getElementById("postModGame")

if (!select || !game) {
return
}

const optionExists = Array.from(select.options).some(option => option.value === game)
if (optionExists) {
select.value = game
}
}

async function setupPostModPage() {
const form = document.getElementById("postModForm")
const hint = document.getElementById("postModPermissionHint")
const submitButton = document.getElementById("postModSubmit")

syncFileLabel("postModFile", "postModFileName", "Nenhum arquivo selecionado")
syncFileLabel("postModBanner", "postModBannerName", "Nenhum banner selecionado")
preselectGameFromQuery()

const loginState = await window.checkLogin?.()
const isLoggedIn = Boolean(loginState?.user)
const canPost = Boolean(loginState?.user && (loginState.user.canPost || window.canAccessAdminPanel?.(loginState.user)))

if (!isLoggedIn) {
const query = window.location.search || ""
window.location.replace(`/post-mod-access.html${query}`)
return
}

if (hint) {
hint.textContent = canPost
? "Sua conta pode enviar mods para a fila de analise agora."
: "Somente postadores, administradores e master admin podem enviar mods."
}

if (!canPost) {
Array.from(form.elements).forEach(element => {
element.disabled = true
})
if (submitButton) {
submitButton.textContent = "Permissao necessaria"
}
return
}

form.addEventListener("submit", async event => {
event.preventDefault()

const formData = new FormData(form)
const res = await fetch("/post-mod", {
method: "POST",
credentials: "include",
body: formData
})

const data = await res.json()

if (!res.ok) {
window.showToast?.(data.error || "Nao foi possivel enviar o mod", "error", "Postagem")
return
}

window.showToast?.(data.message || "Mod enviado para analise", "success", "Postagem")
form.reset()
document.getElementById("postModFileName").textContent = "Nenhum arquivo selecionado"
document.getElementById("postModBannerName").textContent = "Nenhum banner selecionado"
})
}

setupPostModPage()
