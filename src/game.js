import kaplay from "kaplay"; // Note to copilot: kaplay is the community-driven fork of KaBoom.js
import PartySocket from "partysocket";

const k = kaplay({
    global: false,
    width: 320,
    height: 240,
    font: "sans-serif",
    canvas: document.querySelector("#game"),
    background: [ 0, 0, 255, ],
    buttons: {
        moveup: {
            keyboard: ["space", "up", "w"],
            gamepad: ["south"],
        },
        movedown: {
            keyboard: ["control", "down", "s"],
            gamepad: ["north"],
        },
    },
})

function makeButton(text, x, y, onClick) {
    const button = k.add([
        k.text(text, 12),
        k.pos(x, y),
        k.origin("center"),
        k.rect(k.width(), k.height()),
        k.color(0, 0, 0),
        k.scale(1),
        k.area(),
        k.onClick(onClick),
    ])
    // add a background color to the button
    const bg = k.add([
        k.rect(k.width(), k.height()),
        k.color(1, 1, 1),
        k.pos(0, 0),
        k.layer(-1),
        k.parent(button),
    ])
    return button
}

k.scene("menu", () => {
    k.add([
        k.text("Hello, World!", 12),
        k.pos(k.width() / 2, k.height() / 2),
        k.origin("center"),
    ])
    makeButton("Singleplayer", k.width() / 2, k.height() / 2 + 24, () => {
        k.go("game")
    })
    makeButton("Multiplayer", k.width() / 2, k.height() / 2 + 48, () => {
        k.go("multiplayer")
    })
})

k.scene("game", () => {
    k.add([
        k.text("Game Scene", 12),
        k.pos(k.width() / 2, k.height() / 2),
        k.origin("center"),
    ])
})

k.scene("multiplayer", () => {
    k.add([
        k.text("Multiplayer Scene", 12),
        k.pos(k.width() / 2, k.height() / 2),
        k.origin("center"),
    ])
})

k.start("menu")