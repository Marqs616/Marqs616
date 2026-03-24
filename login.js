document.getElementById("loginForm").addEventListener("submit", async function(e){

e.preventDefault()

const username = document.getElementById("username").value
const password = document.getElementById("password").value

const res = await fetch("/login",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
username,
password
})
})

const data = await res.json()

if(res.ok){

alert("Login realizado com sucesso!")

window.location.href = "/"

}else{

alert(data.error || "Erro ao fazer login")

}

})