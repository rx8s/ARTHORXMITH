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

    push,

    set

}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const cards =
    document.getElementById(
        "cards"
    );

let currentUser =
    null;

onAuthStateChanged(
    auth,
    (user)=>
    {
        if(!user)
        {
            location.href =
                "index.html";

            return;
        }

        currentUser =
            user;

        loadCollection();
    }
);

async function loadCollection()
{
    const snapshot =
        await get(
            ref(
                db,
                "collections/" +
                currentUser.uid
            )
        );

    const data =
        snapshot.val();

    cards.innerHTML =
        "";

    if(!data)
    {
        cards.innerHTML =
        `
        <div class="empty">

            <h2>
                ยังไม่มี Monster
            </h2>

            <br>

            <a href="gacha.html">

                ไปสุ่ม Monster

            </a>

        </div>
        `;

        return;
    }

    Object.entries(
        data
    ).forEach(
        (
            [
                key,
                monster
            ]
        )=>
        {
            cards.innerHTML +=
            `
            <div class="card">

                <h2>

                    ${monster.name}

                </h2>

                <div class="stat">

                    Element :

                    <span
                        class="element">

                        ${monster.element}

                    </span>

                </div>

                <div class="stat">

                    Race :

                    <span
                        class="race">

                        ${monster.race}

                    </span>

                </div>

                <hr>

                <div class="stat">
                    STR :
                    ${monster.str}
                </div>

                <div class="stat">
                    AGI :
                    ${monster.agi}
                </div>

                <div class="stat">
                    VIT :
                    ${monster.vit}
                </div>

                <div class="stat">
                    INT :
                    ${monster.int}
                </div>

                <div class="stat">
                    DEX :
                    ${monster.dex}
                </div>

                <div class="stat">
                    LUK :
                    ${monster.luk}
                </div>

                <button
                    class="deckBtn"
                    onclick="
                        addToDeck(
                            '${key}'
                        )
                    ">

                    เพิ่มเข้า Deck

                </button>

            </div>
            `;
        }
    );
}

window.addToDeck =
async function(
    collectionId
)
{
    const deckSnapshot =
        await get(
            ref(
                db,
                "decks/" +
                currentUser.uid
            )
        );

    const deck =
        deckSnapshot.val();

    let count = 0;

    if(deck)
    {
        count =
            Object.keys(
                deck
            ).length;
    }

    if(count >= 3)
    {
        alert(
            "Deck เต็มแล้ว"
        );

        return;
    }

    const monsterSnapshot =
        await get(
            ref(
                db,
                "collections/" +
                currentUser.uid +
                "/" +
                collectionId
            )
        );

    const monster =
        monsterSnapshot.val();

    const deckRef =
        push(
            ref(
                db,
                "decks/" +
                currentUser.uid
            )
        );

    await set(
        deckRef,
        {
            collectionId:
                collectionId,

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

    alert(
        monster.name +
        " ถูกเพิ่มเข้า Deck"
    );
}