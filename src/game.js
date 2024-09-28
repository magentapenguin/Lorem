import kaplay from "kaplay"; // Note to copilot: kaplay is the community-driven fork of KaBoom.js
import PartySocket from "partysocket";

const ws = new PartySocket({
    host: 'localhost:1999',
    room: "dev",
});

ws.addEventListener("message", (e) => {
    console.log(e.data);
});

const k = kaplay({
    debugKey: "i",
    width: 835,
    height: 640,
    canvas: document.getElementById("game"),
    global: false,
    buttons: {
        up: {
            keys: ["w", "up"],
            gamepad: "dpadUp",
        },
        down: {
            keys: ["s", "down"],
            gamepad: "dpadDown",
        },
        fire: {
            keys: ["space", "enter"],
            mouse: "left",
            gamepad: "buttonA",
        },
    },
    backgroundColor: [255, 255, 255, 255],
});

k.loadSprite("bean", "/static/bean.png");
k.loadSprite("gun", "/static/gun.png");

// cursors
k.loadSprite("cursor", "/static/cursor.png");
k.loadSprite("pointer", "/static/pointer.png");
k.loadSprite("crosshair", "/static/pew.png");
const cursor = k.add([
    k.sprite("cursor"),
    k.anchor("center"),
    k.fakeMouse(),
    k.pos(),
    k.z(200),
]);

function setCursor(x) {
    cursor.use(k.sprite(x));
}
k.setCursor("none");
setCursor("crosshair");

function button(x, y, text, action) {
    const btn = k.add([
        k.rect(100, 40),
        k.pos(x, y),
        k.origin("center"),
        k.color(0.3, 0.3, 0.3),
        k.area(),
        k.text(text, 12),
        k.action(() => {
            action();
        }),
    ]);
    btn.children[0].useCustomButton = true;
    return btn;
}


const player = k.add([
    k.sprite("bean"),
    k.pos(k.width() - 70, k.height() / 2),
    k.anchor("center"),
    k.area(),
]);

const gun = player.add([
    k.pos(0, 0),
    k.sprite("gun"),
    k.anchor(k.vec2(-2, 0)),
    k.rotate(0),
    k.area(),
]);

const bullets = k.add([
    k.layer({
        zIndex: 1,
    }),
    k.pos(0, 0),
    "bullets",
]);


k.onMouseMove(() => {
    gun.angle = k.mousePos().sub(player.pos).angle();
    gun.flipY = Math.abs(gun.angle) > 90;
    ws.send(["angle", gun.angle]);
});

player.on("update", () => {
    if (k.isButtonDown("up")) {
        player.move(0, -200);
    }
    if (k.isButtonDown("down")) {
        player.move(0, 200);
    }
});


k.onButtonPress("fire", () => {
    console.log(gun.width*1.5, Math.abs(gun.angle) > 90 ? 7 : -7);
    console.log(gun.toOther(bullets,
        k.vec2(
            gun.width * 1.5,
            Math.abs(gun.angle) > 90 ? 7 : -7,
        )
    ))

    const b = bullets.add([
        k.pos(
            gun.toOther(bullets,
                k.vec2(
                    gun.width * 1.5,
                    Math.abs(gun.angle) > 90 ? 7 : -7,
                )
            )
        ),
        k.anchor("center"),
        k.offscreen({ destroy: true }),
        k.circle(10),
        "bullet-local"
    ]);
    b.update = () => {
        b.move(-200, 0);
    };
    ws.send(["fire", b.pos]);
});
