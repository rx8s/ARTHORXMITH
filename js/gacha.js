import {
    auth,
    db
}
from "./firebase.js";

import {
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {

    ref,

    get,

    set,

    push,

    update

}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

let currentUser = null;

const goldEl =
    document.getElementById(
        "gold"
    );

const resultEl =
    document.getElementById(
        "result"
    );

const gachaBtn =
    document.getElementById(
        "gachaBtn"
    );

onAuthStateChanged(
    auth,
    async(user)=>
    {
        if(!user)
        {
            location.href =
                "index.html";

            return;
        }

        currentUser =
            user;

        loadProfile();
    }
);

async function loadProfile()
{
    const snapshot =
        await get(
            ref(
                db,
                "users/" +
                currentUser.uid
            )
        );

    const profile =
        snapshot.val();

    goldEl.innerText =
        profile.gold || 0;
}

gachaBtn.addEventListener(
    "click",
    rollMonster
);

async function rollMonster()
{
    const userRef =
        ref(
            db,
            "users/" +
            currentUser.uid
        );

    const userSnapshot =
        await get(
            userRef
        );

    const profile =
        userSnapshot.val();

    if(profile.gold < 100)
    {
        alert(
            "Gold ไม่พอ"
        );

        return;
    }

    const monsterSnapshot =
        await get(
            ref(
                db,
                "monsters"
            )
        );

    const monsters =
        monsterSnapshot.val();

    if(!monsters)
    {
        alert(
            "ยังไม่มี Monster"
        );

        return;
    }

    const list =
        Object.entries(
            monsters
        );

    const randomIndex =
        Math.floor(
            Math.random() *
            list.length
        );

    const [
        monsterId,
        monster
    ] =
    list[
        randomIndex
    ];

    await update(
        userRef,
        {
            gold:
                profile.gold - 100
        }
    );

    const collectionRef =
        push(
            ref(
                db,
                "collections/" +
                currentUser.uid
            )
        );

    await set(
        collectionRef,
        {
            monsterId:
                monsterId,

            name:
                monster.name,

            element:
                monster.element,

            race:
                monster.race,

            str:
                monster.str,

            agi:
                monster.agi,

            vit:
                monster.vit,

            int:
                monster.int,

            dex:
                monster.dex,

            luk:
                monster.luk,

            createdAt:
                Date.now()
        }
    );

    goldEl.innerText =
        profile.gold - 100;

    resultEl.innerHTML =
        `
        <h2>
            ${monster.name}
        </h2>

        <p>
            Element :
            ${monster.element}
        </p>

        <p>
            Race :
            ${monster.race}
        </p>

        <p>
            STR :
            ${monster.str}
        </p>

        <p>
            AGI :
            ${monster.agi}
        </p>

        <p>
            VIT :
            ${monster.vit}
        </p>

        <p>
            INT :
            ${monster.int}
        </p>

        <p>
            DEX :
            ${monster.dex}
        </p>

        <p>
            LUK :
            ${monster.luk}
        </p>
        `;

    alert(
        "ได้รับ " +
        monster.name
    );
}