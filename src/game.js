import kaplay from "kaplay"; // Note to copilot: kaplay is the community-driven fork of KaBoom.js
import PartySocket from "partysocket";

const ws = new PartySocket({
    host: "https://lorem-ipsum-game.magentapenguin.partykit.dev/",
    room: "test2",
});



function moveroom(room) {
    ws.partySocketOptions.room = room;
    ws.reconnect(room)
}
window.moveroom = moveroom;

ws.addEventListener("close", () => {
    console.warn("connection closed");
    k.debug.log("connection closed");
});

ws.addEventListener("message", (e) => {
    console.log(e.data);
    const [type, ...data] = JSON.parse(e.data);
    console.log(type, data);
    if (type === "join") {
        add2chat('joined', data[0], true)
    }
    if (type === "leave") {
        add2chat('left', data[0], true)
    }
    if (type === "move") {
        altplayer.pos = data[0];
    }
    if (type === "angle") {
        angleGun(altgun, altplayer, false);
    }
    if (type === "fire") {
        k.play("pew", { volume: 0.7 });
        const b = bullets.add([
            k.pos(data[0]),
            k.anchor("center"),
            k.rotate(data[1]),
            k.area(),
            k.move(data[1], 400),
            k.offscreen({ destroy: true }),
            k.color(64, 64, 64),
            k.rect(12, 5, { radius: 2 }),
            "bullet-remote",
        ]);
    }
    if (type === "chat") {
        // Add to chat
        add2chat(data[1], data[0])
    }
});

function add2chat(message, user, info = false) {
    let chatelm = document.getElementById('chat-messages')
    let msg = document.createElement('div')
    msg.className = 'chat-message' + (info?" chat-info":"")
    msg.innerHTML = `<span class="chat-username">${user}</span><span class="chat-text">${message}</span>`
    chatelm.appendChild(msg)
}

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
// Sounds
k.loadSound("hit", "/static/audio/hit.mp3");
k.loadSound("pew", "/static/audio/pew.mp3");
k.loadSound("music", "/static/audio/song.mp3");

musicplay = false;
try {
    musicplay = k.play("music", { loop: true });
} catch (e) {}

k.onClick(() => {
    if (musicplay) return;
    try {
        musicplay = k.play("music", { loop: true });
    } catch (e) {}
});

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

k.scene("menu", () => {
    k.onUpdate(() => k.setCursor("default"));
    k.add([
        k.text("Lorem Ipsum", 48),
        k.pos(k.width() / 2, k.height() / 2 - 100),
        k.anchor("center"),
    ]);
    button(k.width() / 2, k.height() / 2, "Join Room", () => {
        k.debug.log("Joining room");
    });

    button(k.width() / 2, k.height() / 2 + 50, "Create Room", () => {
        k.debug.log("Creating room");
    });

    button(k.width() / 2, k.height() / 2 + 100, "Settings", () => {
        k.debug.log("Settings");
    });
});


k.scene("game", () => {
    // reset cursor to default on frame start for easier cursor management
    k.onUpdate(() => k.setCursor("crosshair"));
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

    const altplayer = k.add([
        k.sprite("bean"),
        k.pos(k.width() - 70, k.height() / 2),
        k.anchor("center"),
        k.area(),
    ]); 

    const altgun = altplayer.add([
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

    function angleGun(gun, player, send = true) {
        gun.angle = k.mousePos().sub(player.pos).angle();
        gun.flipY = Math.abs(gun.angle) > 90;
        if (Math.abs(gun.angle) > 90) {
            gun.anchor = k.vec2(-2, 0.5);
        } else {
            gun.anchor = k.vec2(-2, -0.5);
        }
        if (send) ws.send(JSON.stringify(["angle", gun.angle]));
    }
    k.onMouseMove(() => {
        angleGun(gun, player);
    });

    player.on("update", () => {
        if (k.isButtonDown("up")) {
            player.move(0, -200);
            ws.send(JSON.stringify(["move", player.pos]));
            angleGun();
        }
        if (k.isButtonDown("down")) {
            player.move(0, 200);
            ws.send(JSON.stringify(["move", player.pos]));
            angleGun();
        }
        // Hit detection
        player.overlaps("bullet-remote", (b) => {
            k.play("hit", { volume: 0.9 });
            b.destroy();
        });
    });

    k.onUpdate(() => {
        cooldown -= k.dt();
        if (cooldown < 0) cooldown = 0;
        if (k.isButtonDown("fire")) {
            if (cooldown > 0) return;
            cooldown += 0.1;
            k.play("pew", { volume: 0.9 });
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
            ws.send(JSON.stringify(["fire", b.pos.toArray(), angle]));
        }
    });
});

k.go("menu");