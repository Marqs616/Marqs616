async function loadMods(){

    const container = document.getElementById("mods-container")

    if(!container) return

    const res = await fetch("mods.json")
    const mods = await res.json()

    container.innerHTML = ""

    mods.forEach((mod)=>{

        if(mod.approved !== 1) return

        const card = document.createElement("div")
        card.className = "mod-card"

        card.innerHTML = `
            <img src="img/minezin.png">

            <div class="mod-info">
                <h3>${mod.title}</h3>

                <p>${mod.description}</p>

                <button class="btn" onclick="downloadMod('${mod.download_link}')">
                    Download
                </button>
            </div>
        `

        container.appendChild(card)

    })

}

function downloadMod(link){

    window.location.href = "uploads/" + link

}

loadMods()