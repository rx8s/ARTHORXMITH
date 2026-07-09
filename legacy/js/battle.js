import {
    ELEMENTS
}
from "./elements.js";

export function buildStats(card)
{
    return {

        hp:
            card.vit * 20 +
            card.str * 2,

        atk:
            card.str * 2,

        matk:
            card.int * 2,

        def:
            card.vit,

        mdef:
            card.int,

        hit:
            card.dex +
            Math.floor(
                card.luk / 5
            ),

        flee:
            card.agi +
            Math.floor(
                card.luk / 3
            ),

        critical:
            card.luk * 0.3
    };
}

export function attack(
    attacker,
    defender
)
{
    const atk =
        buildStats(attacker);

    const def =
        buildStats(defender);

    let chance =
        atk.hit -
        def.flee +
        80;

    chance =
        Math.max(
            10,
            Math.min(
                95,
                chance
            )
        );

    if(
        Math.random()*100 >
        chance
    )
    {
        return {

            damage:0,

            result:"MISS"

        };
    }

    let damage =
        Math.max(
            1,
            atk.atk -
            def.def
        );

    if(
        Math.random()*100 <
        atk.critical
    )
    {
        damage *= 1.5;
    }

    const elementRate =
        ELEMENTS[
            attacker.element
        ]?.[
            defender.element
        ] ?? 1;

    damage *= elementRate;

    return {

        damage:
            Math.floor(
                damage
            ),

        result:"HIT"

    };
}