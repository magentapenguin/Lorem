import kaplay from "kaplay"; // Note to copilot: kaplay is the community-driven fork of KaBoom.js
import PartySocket from "partysocket";

const ws = new PartySocket({
    host: "https://lorem-ipsum-game.magentapenguin.partykit.dev/",
    room: "dev",
});

ws.addEventListener("close", () => {
    console.warn("connection closed");
    k.debug.log("connection closed");
});

ws.addEventListener("message", (e) => {
    if (e.data === "full") {
        console.warn("room is full");
        k.debug.log("room is full");
        return;
    }
    k.debug.log(e.data);
});

const k = kaplay({
    debugKey: "i",
    width: 835,
    height: 640,
    canvas: document.getElementById("game"),
    global: false,
    buttons: {
        up: {
            keys: ["w", "arrowup"],
            gamepad: "dpadUp",
        },
        down: {
            keys: ["s", "arrowdown"],
            gamepad: "dpadDown",
        },
        fire: {
            keys: ["space", "enter"],
            mouse: "left",
            gamepad: "buttonA",
        },
    },
    
    background: [255, 255, 255],
});

k.loadSprite("bean", "/static/bean.png");
k.loadSprite("gun", "/static/gun.png");

// reset cursor to default on frame start for easier cursor management
k.onUpdate(() => k.setCursor("crosshair"));

function button(x, y, text, action, padding = 10) {
    const txt = k.formatText({
        //pos: k.vec2(x, y),
        anchor: "center",
        align: "center",
        text: text,
        size: 24,
        width: 200,
        color: k.rgb(0, 0, 0),
    });
    console.log(txt.width, txt.height);
    const btn = k.add([
        k.rect(200+padding*2, txt.height+padding*1.5, {
            radius: 3,
            fill: k.rgb(1, 1, 1),
        }),
        k.outline(2),
        k.pos(x-(txt.width/2+padding), y-(txt.height/2+padding*0.75)),
        k.anchor("center"),
        k.area(),
    ]);
    btn.onDraw(() => k.drawFormattedText(txt));
    btn.onHoverUpdate(() => {
        k.setCursor("pointer");
    });
    btn.onClick(action);
    return btn;
}

button(k.width() / 2, k.height() / 2, "Join", ()=>k.debug.log("Joining..."));


const player = k.add([
    k.sprite("bean"),
    k.pos(k.width() - 70, k.height() / 2),
    k.anchor("center"),
    k.area(),
]);

const gun = player.add([
    k.pos(0, 0),
    k.sprite("gun"),
    k.anchor(k.vec2(-2, 0.5)),
    k.rotate(0),
    k.area(),
]);

var cooldown = 0;

const bullets = k.add([
    k.layer({
        zIndex: 1,
    }),
    k.pos(0, 0),
    "bullets",
]);
function angleGun() {
    gun.angle = k.mousePos().sub(player.pos).angle();
    gun.flipY = Math.abs(gun.angle) > 90;
    if (Math.abs(gun.angle) > 90) {
        gun.anchor = k.vec2(-2, 0.5);
    } else {
        gun.anchor = k.vec2(-2, -0.5);
    }
    ws.send(["angle", gun.angle]);
}
k.onMouseMove(angleGun);

player.on("update", () => {
    if (k.isButtonDown("up")) {
        player.move(0, -200);
        ws.send(["move", player.pos]);
        angleGun();
    }
    if (k.isButtonDown("down")) {
        player.move(0, 200);
        ws.send(["move", player.pos]);
        angleGun();
    }
});

k.onUpdate(() => {
    cooldown -= k.dt();
    if (cooldown < 0) cooldown = 0;
    if (k.isButtonDown("fire")) {
        if (cooldown > 0) return;
        cooldown += 0.1;
        let angle = gun.angle+k.randi(-2, 2);
        const b = bullets.add([
            k.pos(k.Vec2.fromAngle(gun.angle).scale(gun.width*1.5).add(player.pos)),
            k.anchor("center"),
            k.rotate(angle),
            k.area(),
            k.move(angle, 400),
            k.offscreen({ destroy: true }),
            k.color(64, 64, 64),
            k.rect(12, 5, { radius: 2 }),
            "bullet-local",
        ]);
        ws.send(["fire", b.pos, angle]);
    }
});
