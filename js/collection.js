import {
    auth,
    db
}
from "./firebase.js";

import {
    onAuthStateChanged
}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";

import {

    ref,

    get,

    set

}
from
"https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const collectionDiv =
    document.getElementById(
        "collection"
    );

const selectedCount =
    document.getElementById(
        "selectedCount"
    );

const saveDeckBtn =
    document.getElementById(
        "saveDeckBtn"
    );

let selectedDeck = [];

let allMonsters = {};

onAuthStateChanged(
    auth,
    async(user)=>
    {
        if(!user)
        {
            alert(
                "Please Login"
            );

            return;
        }

        await initializeCollection(
            user.uid
        );

        loadCollection(
            user.uid
        );
    }
);

async function initializeCollection(uid)
{
    const collectionRef =
        ref(
            db,
            "users/" +
            uid +
            "/collection"
        );

    const collectionSnap =
        await get(
            collectionRef
        );

    if(
        collectionSnap.exists()
    )
    {
        return;
    }

    const monstersSnap =
        await get(
            ref(
                db,
                "monsters"
            )
        );

    const monsters =
        monstersSnap.val();

    const ids =
        Object.keys(
            monsters
        );

    const collection = {};

    for(
        let i=0;
        i<10;
        i++
    )
    {
        const randomId =
            ids[
                Math.floor(
                    Math.random()
                    *
                    ids.length
                )
            ];

        collection[
            randomId
        ] = true;
    }

    await set(
        collectionRef,
        collection
    );
}

async function loadCollection(
    uid
)
{
    const monstersSnap =
        await get(
            ref(
                db,
                "monsters"
            )
        );

    allMonsters =
        monstersSnap.val();

    const collectionSnap =
        await get(
            ref(
                db,
                "users/" +
                uid +
                "/collection"
            )
        );

    const collection =
        collectionSnap.val();

    collectionDiv.innerHTML =
        "";

    Object.keys(
        collection
    ).forEach(
        monsterId =>
        {
            const monster =
                allMonsters[
                    monsterId
                ];

            if(!monster)
            {
                return;
            }

            const card =
                document
                .createElement(
                    "div"
                );

            card.className =
                "card";

            card.innerHTML =
            `
            <h3>
            ${monster.name}
            </h3>

            Element:
            ${monster.element}
            <br>

            Race:
            ${monster.race}
            <br><br>

            STR:
            ${monster.str}
            <br>

            AGI:
            ${monster.agi}
            <br>

            VIT:
            ${monster.vit}
            <br>

            INT:
            ${monster.int}
            <br>

            DEX:
            ${monster.dex}
            <br>

            LUK:
            ${monster.luk}
            `;

            card.onclick =
            () =>
            {
                toggleSelect(
                    monsterId,
                    card
                );
            };

            collectionDiv
            .appendChild(
                card
            );
        }
    );

    saveDeckBtn.onclick =
    () =>
    saveDeck(uid);
}

function toggleSelect(
    monsterId,
    card
)
{
    const index =
        selectedDeck.indexOf(
            monsterId
        );

    if(index >= 0)
    {
        selectedDeck.splice(
            index,
            1
        );

        card.classList.remove(
            "selected"
        );
    }
    else
    {
        if(
            selectedDeck.length >= 3
        )
        {
            alert(
                "Deck Full"
            );

            return;
        }

        selectedDeck.push(
            monsterId
        );

        card.classList.add(
            "selected"
        );
    }

    selectedCount.innerText =
        selectedDeck.length;
}

async function saveDeck(
    uid
)
{
    if(
        selectedDeck.length !== 3
    )
    {
        alert(
            "Select 3 Monsters"
        );

        return;
    }

    await set(
        ref(
            db,
            "users/" +
            uid +
            "/deck"
        ),
        {
            slot1:
                selectedDeck[0],

            slot2:
                selectedDeck[1],

            slot3:
                selectedDeck[2]
        }
    );

    alert(
        "Deck Saved"
    );
}