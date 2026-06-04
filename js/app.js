// app.js

import { cards } from "./cards.js";
import { attack } from "./battle.js";
import { getDeck } from "./deck.js";

// ========================================
// DOM
// ========================================

const battleLog =
    document.getElementById("battleLog");

const playerName =
    document.getElementById("playerName");

// ========================================
// Utility
// ========================================

function log(text)
{
    if(!battleLog) return;

    battleLog.innerHTML +=
        text + "<br>";
}

function clearLog()
{
    if(!battleLog) return;

    battleLog.innerHTML = "";
}

// ========================================
// Load Cards
// ========================================

window.showCards = () =>
{
    const cardList =
        document.getElementById(
            "cardList"
        );

    if(!cardList) return;

    cardList.innerHTML = "";

    cards.forEach(card =>
    {
        const div =
            document.createElement(
                "div"
            );

        div.className =
            "card";

        div.innerHTML = `
            <h3>${card.name}</h3>

            <div>Element :
                ${card.element}
            </div>

            <div>Race :
                ${card.race}
            </div>

            <div>
                STR ${card.str}
            </div>

            <div>
                AGI ${card.agi}
            </div>

            <div>
                VIT ${card.vit}
            </div>

            <div>
                INT ${card.int}
            </div>

            <div>
                DEX ${card.dex}
            </div>

            <div>
                LUK ${card.luk}
            </div>
        `;

        cardList.appendChild(div);
    });
};

// ========================================
// Demo Battle
// ========================================

window.startBattle = () =>
{
    clearLog();

    const playerTeam = [

        cards[0],
        cards[1],
        cards[2]

    ];

    const enemyTeam = [

        cards[2],
        cards[1],
        cards[0]

    ];

    log("=== BATTLE START ===");

    for(let i=0;i<3;i++)
    {
        const attacker =
            playerTeam[i];

        const defender =
            enemyTeam[i];

        const result =
            attack(
                attacker,
                defender
            );

        log(
            `${attacker.name}
            attacks
            ${defender.name}

            Damage:
            ${result.damage}

            Result:
            ${result.result}`
        );
    }

    log("=== BATTLE END ===");
};

// ========================================
// Deck
// ========================================

window.showDeck = () =>
{
    const deck =
        getDeck();

    console.log(
        "Current Deck",
        deck
    );
};

// ========================================
// Lobby
// ========================================

window.showLobby = () =>
{
    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            screen =>
            {
                screen.classList.add(
                    "hidden"
                );
            }
        );

    document
        .getElementById(
            "lobbyScreen"
        )
        ?.classList
        .remove(
            "hidden"
        );
};

// ========================================
// Collection
// ========================================

window.showCollection = () =>
{
    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            screen =>
            {
                screen.classList.add(
                    "hidden"
                );
            }
        );

    document
        .getElementById(
            "collectionScreen"
        )
        ?.classList
        .remove(
            "hidden"
        );

    showCards();
};

// ========================================
// Deck Builder
// ========================================

window.showDeckBuilder = () =>
{
    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            screen =>
            {
                screen.classList.add(
                    "hidden"
                );
            }
        );

    document
        .getElementById(
            "deckScreen"
        )
        ?.classList
        .remove(
            "hidden"
        );
};

// ========================================
// Battle Screen
// ========================================

window.showBattleScreen = () =>
{
    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            screen =>
            {
                screen.classList.add(
                    "hidden"
                );
            }
        );

    document
        .getElementById(
            "battleScreen"
        )
        ?.classList
        .remove(
            "hidden"
        );
};

// ========================================
// Init
// ========================================

window.addEventListener(
    "DOMContentLoaded",
    () =>
    {
        console.log(
            "ARTHORXMITH Started"
        );

        if(playerName)
        {
            playerName.innerText =
                "Guest";
        }
    }
);