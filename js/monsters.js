import { db }
from "./firebase.js";

import {

    ref,
    push,
    set,
    remove,
    onValue

}
from "https://www.gstatic.com/firebasejs/12.2.1/firebase-database.js";

const ELEMENTS = [

    "Neutral",
    "Water",
    "Earth",
    "Fire",
    "Wind",
    "Poison",
    "Holy",
    "Shadow",
    "Ghost",
    "Undead"

];

const RACES = [

    "Formless",
    "Undead",
    "Brute",
    "Plant",
    "Insect",
    "Fish",
    "Demon",
    "Demi-Human",
    "Angel",
    "Dragon"

];

document
.getElementById("saveBtn")
.addEventListener(
    "click",
    createManualMonster
);

document
.getElementById("randomBtn")
.addEventListener(
    "click",
    createRandomMonster
);

async function createManualMonster()
{
    const data = {

        name:
            document
            .getElementById("name")
            .value,

        element:
            document
            .getElementById("element")
            .value,

        race:
            document
            .getElementById("race")
            .value,

        str:
            Number(
                document
                .getElementById("str")
                .value
            ),

        agi:
            Number(
                document
                .getElementById("agi")
                .value
            ),

        vit:
            Number(
                document
                .getElementById("vit")
                .value
            ),

        int:
            Number(
                document
                .getElementById("int")
                .value
            ),

        dex:
            Number(
                document
                .getElementById("dex")
                .value
            ),

        luk:
            Number(
                document
                .getElementById("luk")
                .value
            ),

        createdAt:
            Date.now()
    };

    const monsterRef =
        push(
            ref(
                db,
                "monsters"
            )
        );

    await set(
        monsterRef,
        data
    );

    alert("Saved");
}

function randomStat()
{
    return Math.floor(
        Math.random()*255
    ) + 1;
}

async function createRandomMonster()
{
    const monsterRef =
        push(
            ref(
                db,
                "monsters"
            )
        );

    const data = {

        name:
            "Monster_" +
            Date.now(),

        element:
            ELEMENTS[
                Math.floor(
                    Math.random()
                    *
                    ELEMENTS.length
                )
            ],

        race:
            RACES[
                Math.floor(
                    Math.random()
                    *
                    RACES.length
                )
            ],

        str:
            randomStat(),

        agi:
            randomStat(),

        vit:
            randomStat(),

        int:
            randomStat(),

        dex:
            randomStat(),

        luk:
            randomStat(),

        createdAt:
            Date.now()
    };

    await set(
        monsterRef,
        data
    );

    alert("Random Created");
}

const monsterList =
    document.getElementById(
        "monsterList"
    );

onValue(
    ref(
        db,
        "monsters"
    ),
    snapshot =>
    {
        monsterList.innerHTML =
            "";

        const monsters =
            snapshot.val();

        if(!monsters)
        {
            return;
        }

        Object.entries(
            monsters
        ).forEach(
            ([id,m]) =>
            {
                const div =
                    document
                    .createElement(
                        "div"
                    );

                div.className =
                    "card";

                div.innerHTML =
                `
                <b>${m.name}</b><br>

                ${m.element}
                /
                ${m.race}

                <br><br>

                STR ${m.str}
                |
                AGI ${m.agi}
                |
                VIT ${m.vit}
                |
                INT ${m.int}
                |
                DEX ${m.dex}
                |
                LUK ${m.luk}

                <br><br>

                <button
                data-id="${id}">
                Delete
                </button>
                `;

                div
                .querySelector(
                    "button"
                )
                .onclick =
                async () =>
                {
                    if(
                        confirm(
                            "Delete?"
                        )
                    )
                    {
                        await remove(
                            ref(
                                db,
                                "monsters/" +
                                id
                            )
                        );
                    }
                };

                monsterList
                .appendChild(
                    div
                );
            }
        );
    }
);