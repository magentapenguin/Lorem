import kaplay from "kaplay"; // Note to copilot: kaplay is the community-driven fork of KaBoom.js
import PartySocket from "partysocket";
import * as Sentry from "@sentry/browser";

Sentry.init({
    dsn: "https://c816d20b5304121270582182fd4b3ea6@o4506782055596032.ingest.us.sentry.io/4508248601853952",
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

  integrations: [
    // Keep the Replay integration as before
    Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
    }),
    Sentry.feedbackIntegration({
        colorScheme: 'light'

    }),
    // The following is all you need to enable canvas recording with Replay
    Sentry.replayCanvasIntegration({ preserveDrawingBuffer: true }),
  ],
});


/** @type {PartySocket} */
var ws;
const HOST = location.host;


function wsinit() {
    ws.addEventListener("close", () => {
        console.warn("connection closed");
        k.debug.error("connection closed");
    });
}



function add2chat(message, user, info = false) {
    k.debug.log(message, user)
    console.log(message, user, info)
    /*
    let chatelm = document.getElementById('chat-messages')
    let msg = document.createElement('div')
    msg.className = 'chat-message' + (info?" chat-info":"")
    msg.innerHTML = `<span class="chat-username">${user}</span><span class="chat-text">${message}</span>`
    chatelm.appendChild(msg)
    */
}

const k = kaplay({
    debugKey: "i",
    width: 835,
    height: 640,
    //letterbox: true,
    canvas: document.getElementById("game"),
    global: false,
    buttons: {
        up: {
            keyboard: ["w", "up"],
            gamepad: "dpadUp",
        },
        down: {
            keyboard: ["s", "down"],
            gamepad: "dpadDown",
        },
        fire: {
            keyboard: ["space", "enter"],
            mouse: "left",
            gamepad: "buttonA",
        },
    },
    //crisp: true,

    background: [0, 0, 0],
});

k.loadSprite("bean", "/static/bean.png");
k.loadSprite("gun", "/static/gun.png");
k.loadSprite("github", "/static/github.png");
k.loadSprite("discord", "/static/discord.png");
k.loadSpriteAtlas("/static/muteunmute.png", {
    // Dark theme
    "mute-dark": { x: 0, y: 0, width: 60, height: 16, sliceX: 4 },
    // Light theme
    "mute-light": { x: 0, y: 16, width: 60, height: 16, sliceX: 4 },
});
k.loadSpriteAtlas("/static/fullscreen.png", {
    // Dark theme
    "fs-dark": { x: 0, y: 0, width: 60, height: 16, sliceX: 4 },
    // Light theme
    "fs-light": { x: 0, y: 16, width: 60, height: 16, sliceX: 4 },
});
k.loadSpriteAtlas("/static/back.png", {
    // Dark theme
    "back-dark": { x: 0, y: 0, width: 30, height: 16, sliceX: 2 },
    // Light theme
    "back-light": { x: 0, y: 16, width: 30, height: 16, sliceX: 2 },
});
let scale = 3; // SCALE var from splitbtnsprites.py
k.loadSprite("btn-dark", "/static/btn-dark.png", { slice9: { top: 3 * scale, bottom: 3 * scale, left: 2 * scale, right: 2 * scale } });
k.loadSprite("btn-light", "/static/btn-light.png", { slice9: { top: 3 * scale, bottom: 3 * scale, left: 2 * scale, right: 2 * scale } });
k.loadSprite("btn-dark-flat", "/static/btn-dark-flat.png", { slice9: { top: 3 * scale, bottom: 3 * scale, left: 2 * scale, right: 2 * scale } });
k.loadSprite("btn-light-flat", "/static/btn-light-flat.png", { slice9: { top: 3 * scale, bottom: 3 * scale, left: 2 * scale, right: 2 * scale } });

k.loadSprite("heart", "/static/heart.png", { sliceX: 2 });

k.loadSprite("bob", "/static/bob.png");
k.loadSprite("copy", "/static/copy.png", {
    sliceX: 8,
    anims: {
        icon: 0,
        copy: { from: 0, to: 7, loop: false, speed: 20 }
    }
});


// Sounds
k.loadSound("hit", "/static/audio/hit.mp3");
k.loadSound("pew", "/static/audio/pew.mp3");
k.loadMusic("music", "/static/audio/Voice Over Under.mp3");


var music;

function button(x, y, text, action, padding = 10, theme = "light") {
    const txt = k.formatText({
        pos: k.vec2(padding / 2, padding * 0.75),
        anchor: "topleft",
        align: "center",
        text: text,
        size: 24,
        width: 200,
        color: theme.includes('dark') ? k.rgb(0, 0, 0) : k.rgb(255, 255, 255),
    });
    console.log(txt.width, txt.height);

    const btn = k.add([
        k.sprite("btn-" + theme),
        k.pos(x + padding, y + padding * 0.75),
        k.anchor("topleft"),
        k.area(),
        k.scale(1),
    ]);

    btn.onDraw(() => {
        k.drawFormattedText(txt)
    });
    btn.onHoverUpdate(() => {
        k.setCursor("pointer");
    });/*
    btn.onHover(() => {
        btn.scaleTo(1.2);
    });
    btn.onHoverEnd(() => {
        btn.scaleTo(1);
    });*/
    btn.onUpdate(() => {
        btn.width = 200 + padding * 2;
        btn.height = txt.height + padding * 1.5;

        btn.pos.x = x + padding - btn.width / 2;
        btn.pos.y = y + padding * 0.75 - btn.height / 2;
    });
    btn.onClick(action);
    return btn;
}

var toasts = [];

function toast(title, theme = "dark", padding = 10, timeout = 5000, action = () => { }) {
    const txt = k.formatText({
        pos: k.vec2(padding / 2, padding * 0.75),
        anchor: "topleft",
        align: "center",
        text: title,
        size: 24,
        width: 200,
        color: theme.includes('dark') ? k.rgb(0, 0, 0) : k.rgb(255, 255, 255),
    });
    console.log(txt.width, txt.height);
    const t = k.add([
        k.sprite("btn-" + theme),
        k.pos(k.width() / 2, k.height() - 48),
        k.anchor("center"),
        k.area(),
        k.scale(1),
        { timeout: timeout },
    ]);

    t.onDraw(() => {
        k.drawFormattedText(txt)
    });
    t.onHoverUpdate(() => {
        k.setCursor("pointer");
    });
    t.onUpdate(() => {
        t.width = 200 + padding * 2;
        t.height = txt.height + padding * 1.5;

        t.pos.x = k.width() / 2 - t.width / 2;
        t.pos.y = k.height() - 48 - t.height / 2;
        t.timeout -= k.dt();
        if (t.timeout < 0) {
            t.destroy();
        }
    });
    return t;
}

toast("Hello", "dark", 10, 5000, () => {
    console.log("Hello");
});

function fullscreenbtn(theme) {
    const btn = k.add([
        k.sprite("fs-" + theme,),
        k.pos(k.width() - 120, k.height() - 48),
        k.anchor("center"),
        k.scale(4),
        k.area(),
        { mode: false, isHovered: false, isClickedAfterHover: false },
    ]);
    console.log(music);
    if (k.isFullscreen()) {
        btn.mode = true;
        btn.frame = 2;
    }
    btn.onHover(() => {
        btn.isHovered = true;
    });
    btn.onHoverEnd(() => {
        btn.isHovered = false;
    });
    btn.onHoverUpdate(() => {
        k.setCursor("pointer");
    });
    btn.onMouseDown(() => {
        if (!btn.isHovered) return;
        btn.isClickedAfterHover = true;
        btn.frame = 1 + btn.mode * 2;
    });
    btn.onMouseRelease(() => {
        if (!btn.isClickedAfterHover) return;
        btn.isClickedAfterHover = false;

        btn.mode = !btn.mode;
        btn.frame = btn.mode * 2;

        k.setFullscreen(btn.mode);
    });
    return btn;
}

function mutebtn(theme) {
    const btn = k.add([
        k.sprite("mute-" + theme,),
        k.pos(k.width() - 48, k.height() - 48),
        k.anchor("center"),
        k.scale(4),
        k.area(),
        { mode: false, isHovered: false, isClickedAfterHover: false },
    ]);
    console.log(music);
    if (music && !music.paused) {
        btn.mode = true;
        btn.frame = 2;
    }
    btn.onHover(() => {
        btn.isHovered = true;
    });
    btn.onHoverEnd(() => {
        btn.isHovered = false;
    });
    btn.onHoverUpdate(() => {
        k.setCursor("pointer");
    });
    btn.onMouseDown(() => {
        if (!btn.isHovered) return;
        btn.isClickedAfterHover = true;
        btn.frame = 1 + btn.mode * 2;
    });
    btn.onMouseRelease(() => {
        if (!btn.isClickedAfterHover) return;
        btn.isClickedAfterHover = false;
        if (btn.mode) {
            music.stop();
        } else {
            music = k.play("music", { loop: true, volume: 0.5 });
        }
        btn.mode = !btn.mode;
        btn.frame = btn.mode * 2;
    });
    return btn;
}


function backbtn(theme, callback) {
    const btn = k.add([
        k.sprite("back-" + theme,),
        k.pos(48, 48),
        k.anchor("center"),
        k.scale(4),
        k.area(),
        { isHovered: false, isClickedAfterHover: false },
    ]);
    btn.onHover(() => {
        btn.isHovered = true;
    });
    btn.onHoverEnd(() => {
        btn.isHovered = false;
    });
    btn.onHoverUpdate(() => {
        k.setCursor("pointer");
    });
    btn.onMouseDown(() => {
        if (!btn.isHovered) return;
        btn.isClickedAfterHover = true;
        btn.frame = 1;
    });
    btn.onMouseRelease(() => {
        if (!btn.isClickedAfterHover) return;
        btn.isClickedAfterHover = false;
        btn.frame = 0;
        callback();
    });
    return btn;
}

// technically async
// returns a promise
function queryServer(info) {
    return new Promise((resolve, reject) => {
        ws = new PartySocket({
            host: HOST,
            party: "connect",
            room: "game",
        });
        ws.addEventListener('open', () => {
            setTimeout(() => ws.send(JSON.stringify(info)), 100);
        });
        ws.addEventListener('message', (e) => {
            console.log(e.data);
            resolve(JSON.parse(e.data));
        });
        ws.addEventListener('close', () => {
            console.warn("connection closed");
            reject("Connection closed");
        });
    });

}


k.loadShader("checkerbg", null, `
    uniform float u_time;
    uniform vec3 u_color1;
    uniform vec3 u_color2;
    uniform vec2 u_speed;
    uniform float u_angle;
    uniform float u_scale;
    uniform float u_aspect;
    
    #define PI 3.14159265359
    vec4 frag(vec2 pos, vec2 uv, vec4 color, sampler2D tex) {
        float angle = u_angle * PI / 180.0;
        mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
        vec2 size = vec2(u_scale);
        vec2 p = (pos + vec2(u_time) * u_speed) * vec2(u_aspect, 1.0);
        p = p * rot;
        float total = floor(p.x * size.x) + floor(p.y * size.y);
        bool isEven = mod(total, 2.0) == 0.0;
        vec4 col1 = vec4(u_color1 / 255.0, 1.0);
        vec4 col2 = vec4(u_color2 / 255.0, 1.0);
        return (isEven) ? col1 : col2;
    }
`)

k.scene("loading", () => {
    k.onUpdate(() => k.setCursor("default"));
    k.add([
        k.text("Loading...", { size: 48 }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
    ]);
    button(k.width() / 2, k.height() / 2 + 50, "Cancel", () => {
        ws.close();
        k.go("menu");
    });
    k.add([
        k.rect(k.width(), k.height()),
        k.scale(8),
        k.z(-5),
        k.shader("checkerbg", () => ({
            "u_time": k.time() / 10,
            "u_color1": k.rgb(40, 40, 40),
            "u_color2": k.rgb(60, 60, 60),
            "u_speed": k.vec2(0.5, -0.25),
            "u_angle": 15,
            "u_scale": 4,
            "u_aspect": k.width() / k.height(),
        })),
    ]);
});

k.scene("menu", () => {
    k.onUpdate(() => k.setCursor("default"));
    mutebtn("light");
    fullscreenbtn("light");
    const a = k.add([
        k.text("Lorem Ipsum", { size: 72, }),
        k.pos(k.width() / 2, k.height() / 2 - 100),
        k.anchor("center"),
        k.area(),
    ]);
    // funni lil line
    k.add([
        k.rect(a.width / 1.1, 3),
        k.pos(a.pos.x, a.pos.y + a.height / 2 - 10),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);
    k.add([
        k.text("The game that is in development", { size: 20, }),
        k.pos(a.pos.x, a.pos.y + a.height / 2 + 5),
        k.anchor("center"),
        k.area(),
    ]);

    const logo = (y, name, text, url, color) => {
        const a = k.add([
            k.sprite(name),
            k.pos(50, k.height() - ((1 + y) * 50)),
            k.anchor("center"),
            k.area(),
            k.scale(0.75),
            { curtween: null },
        ]);
        a.onHoverUpdate(() => {
            k.setCursor("pointer");
        });
        a.onClick(() => {
            window.open(url, "_blank");
        });
        const t = a.add([
            k.text(text, { size: 56, }),
            k.pos(48, 0),
            k.anchor("left"),
            k.area(),
            k.color(color),

        ]);
        //t.width = 0;
        a.onHover(() => {
            if (a.curtween) a.curtween.cancel();
            a.curtween = k.tween(a.scale.x, 0.9, 0.1, (w) => a.scaleTo(w), k.easings.easeOutExpo);
        })
        a.onHoverEnd(() => {
            if (a.curtween) a.curtween.cancel();
            a.curtween = k.tween(a.scale.x, 0.75, 0.1, (w) => a.scaleTo(w), k.easings.easeOutExpo);
        });
        return a;
    }

    logo(0, "github", "Github", "https://github.com/magentapenguin/Lorem", "#FFFFFF");
    logo(1, "discord", "Discord", "https://discord.gg/qrkdS85Wcn", "#5766F2");

    k.add([
        k.rect(k.width(), k.height()),
        k.scale(8),
        k.z(-5),
        k.shader("checkerbg", () => ({
            "u_time": k.time() / 10,
            "u_color1": k.rgb(40, 40, 40),
            "u_color2": k.rgb(60, 60, 60),
            "u_speed": k.vec2(0.5, -0.25),
            "u_angle": 15,
            "u_scale": 4,
            "u_aspect": k.width() / k.height(),
        })),
    ])
    button(k.width() / 2, k.height() / 2, "Join Room", () => {
        k.go("joinroom");
    });

    button(k.width() / 2, k.height() / 2 + 50, "Create Room", () => {
        k.go("loading");
        queryServer(["create"]).then(data => {
            if (ws) ws.close();
            ws = new PartySocket({
                host: HOST,
                room: data[1],
            });
            wsinit();
            ws.addEventListener('open', () => {
                k.go("game");
            })
        }).catch(e => {
            k.debug.error(e);
            Sentry.captureException(e);
            k.go("menu");
        });
    });

    button(k.width() / 2, k.height() / 2 + 100, "Settings", () => {
        k.debug.error("Settings");
    });
});

k.scene("joinroom", () => {
    k.onUpdate(() => k.setCursor("default"));
    // bg
    k.add([
        k.rect(k.width(), k.height()),
        k.z(-5),
        k.shader("checkerbg", () => ({
            "u_time": k.time() / 10,
            "u_color1": k.rgb(40, 40, 40),
            "u_color2": k.rgb(60, 60, 60),
            "u_speed": k.vec2(0.5, -0.25),
            "u_angle": 15,
            "u_scale": 4,
            "u_aspect": k.width() / k.height(),
        })),
    ]);
    k.add([
        k.text("Join Room", { size: 72, }),
        k.pos(k.width() / 2, k.height() / 2 - 100),
        k.anchor("center"),
        k.area(),
    ]);
    // select mode
    button(k.width() / 2, k.height() / 2, "Join Random Room", () => {
        queryServer(["find"]).then(data => {
            if (!data[1]) {
                k.debug.log("No rooms found");
                return;
            }
            if (ws) ws.close();
            ws = new PartySocket({
                host: HOST,
                room: data[1],
            });
            wsinit();
            ws.addEventListener('open', () => {
                k.go("game");
            })
            k.go("loading");
        });
    });
    button(k.width() / 2, k.height() / 2 + 70, "Join Specific Room", () => {
        let code = prompt("Enter room code");
        queryServer(["check", code]).then(data => {
            if (!data[1]) {
                k.debug.log("Room not found");
                return;
            }
            if (ws) ws.close();
            ws = new PartySocket({
                host: HOST,
                room: code,
            });
            wsinit();
            ws.addEventListener('open', () => {
                k.go("game");
            })
            k.go("loading");
        });
    });
    backbtn("light", () => {
        k.go("menu");
    });
});




k.scene("game", () => {
    // reset cursor to default on frame start for easier cursor management
    k.onUpdate(() => k.setCursor("crosshair"));
    k.add([
        k.rect(k.width(), k.height()),
        k.z(-5),
        k.color(80, 80, 80),
    ])
    const player = k.add([
        k.sprite("bean"),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.area(),
        k.health(3),
        { side: null },
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
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
        k.area(),
        k.health(3),
        { side: null },
    ]);

    const altgun = altplayer.add([
        k.pos(0, 0),
        k.sprite("gun"),
        k.anchor(k.vec2(-2, 0.5)),
        k.rotate(0),
        k.area(),
    ]);


    const lefthearts = [];
    const righthearts = [];
    for (let i = 0; i < 3; i++) {
        lefthearts.push(k.add([
            k.sprite("heart"),
            k.pos(120 + 44 * i, 24),
            k.anchor("center"),
        ]));
        righthearts.push(k.add([
            k.sprite("heart"),
            k.pos(k.width() - 120 - 44 * i, 24),
            k.anchor("center"),
        ]));
    }

    // line to show movement limits for players
    k.add([
        k.rect(3, k.height() - 120),
        k.pos(70, 60),
        k.color(0, 0, 0),
        k.opacity(0.5),
        k.z(-1)
    ]);
    k.add([
        k.rect(3, k.height() - 120),
        k.pos(k.width() - 70, 60),
        k.color(0, 0, 0),
        k.opacity(0.5),
        k.z(-1)
    ]);

    var cooldown = 0;

    const bullets = k.add([
        k.layer({
            zIndex: 1,
        }),
        k.pos(0, 0),
        "bullets",
    ]);

    k.add([
        k.text("Room code:", { size: 24 }),
        k.pos(k.width() / 2, 17),
        k.anchor("center"),
    ]);
    const rmid = k.add([
        k.text(ws.room, { size: 24 }),
        k.pos(k.width() / 2, 45),
        k.anchor("center"),
    ]);
    const cprmid = k.add([
        k.sprite("copy"),
        k.pos(k.width() / 2 + rmid.width / 2 + 10, 45),
        k.anchor(k.vec2(-0.5, 0)),
        k.scale(0.9),
        k.area(),
    ]);
    cprmid.onHoverUpdate(() => {
        k.setCursor("pointer");
    });
    cprmid.onClick(() => {
        // Copy to clipboard
        navigator.clipboard.writeText(ws.room).then(() => {
            cprmid.play('copy')
            setTimeout(() => {
                cprmid.frame = 0;
            }, 1000);
        });
    });
    rmid.pos.x -= cprmid.width / 2;
    cprmid.pos.x -= cprmid.width / 2;


    function updateHearts(strside, hp) {
        const side = strside == "left" ? lefthearts : righthearts;
        for (let i = 0; i < 3; i++) {
            if (i < hp) {
                side[i].frame = 0;
            } else {
                side[i].frame = 1;
            }
        }
    }

    function angleGun(gun, player, angle, send = true) {
        gun.angle = angle ?? k.mousePos().sub(player.pos).angle();
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

    player.onButtonDown("up", () => {
        player.move(0, -200);
        if (player.pos.y < 60) player.pos.y = 60;
        if (player.pos.y > k.height() - 60) player.pos.y = k.height() - 60;
        ws.send(JSON.stringify(["move", player.pos.toArray()]));
        angleGun(gun, player);
    });

    player.onButtonDown("down", () => {
        player.move(0, 200);
        if (player.pos.y < 60) player.pos.y = 60;
        if (player.pos.y > k.height() - 60) player.pos.y = k.height() - 60;
        ws.send(JSON.stringify(["move", player.pos.toArray()]));
        angleGun(gun, player);
    });

    player.on("hurt", () => {
        ws.send(JSON.stringify(["hurt", player.hp()]));
        updateHearts(player.side, player.hp());
        k.play("hit", { volume: 0.9 });
        k.shake(2);
    })
    altplayer.on("hurt", () => {
        k.play("hit", { volume: 0.9 });
        k.shake(2);
    })

    // Hit detection
    player.onCollide("bullet-remote", (b) => {
        player.hurt(1);
        b.destroy();
    });
    altplayer.onCollide("bullet-local", (b) => {
        b.destroy();
    });

    k.onUpdate(() => {
        cooldown -= k.dt();
        if (cooldown < 0) cooldown = 0;
        if (k.isButtonDown("fire")) {
            if (cooldown > 0) return;
            cooldown += 0.5;
            k.play("pew", { volume: 0.8 });
            let angle = gun.angle + k.randi(-1.5, 1.5);
            const b = bullets.add([
                k.pos(k.Vec2.fromAngle(gun.angle).scale(gun.width * 1.5).add(player.pos)),
                k.anchor("center"),
                k.rotate(angle),
                k.area(),
                k.move(angle, 400),
                k.offscreen({ destroy: true }),
                k.color(255, 255, 128),
                k.rect(12, 5, { radius: 2 }),
                "bullet-local",
            ]);
            ws.send(JSON.stringify(["fire", b.pos.toArray(), angle]));
        }
    });



    ws.addEventListener("message", (e) => {
        console.log(e.data);
        const [type, ...data] = JSON.parse(e.data);
        if (type === "join") {
            add2chat('joined', data[0], true)
        }
        if (type === "leave") {
            add2chat('left', data[0], true)
        }
        if (type === "move") {
            altplayer.pos = data[0];
            // Anti-cheat
            if (data[0] > k.height() - 60 || data[0] < 60) {
                k.debug.error("Cheating detected");
                Sentry.addBreadcrumb("Cheating detected");
            }
        }
        if (type === "angle") {
            angleGun(altgun, altplayer, data[0], false);
        }
        if (type === "fire") {
            k.play("pew", { volume: 0.6 });
            const b = bullets.add([
                k.pos(data[0]),
                k.anchor("center"),
                k.rotate(data[1]),
                k.area(),
                k.move(data[1], 400),
                k.offscreen({ destroy: true }),
                k.color(255, 255, 128),
                k.rect(12, 5, { radius: 2 }),
                "bullet-remote",
            ]);
            // Anti-cheat
            if (b.pos.dist(altplayer.pos) > 100) {
                b.destroy();
                k.debug.error("Cheating detected");
                Sentry.addBreadcrumb("Cheating detected");
            }
        }
        if (type === "chat") {
            // Add to chat
            add2chat(data[1], data[0])
        }
        if (type === "init") {
            console.log("init", data[1]);
            player.pos = data[1] == "left" ? k.vec2(70, k.height() / 2) : k.vec2(k.width() - 70, k.height() / 2);
            altplayer.pos = data[1] == "left" ? k.vec2(k.width() - 70, k.height() / 2) : k.vec2(70, k.height() / 2);
            player.flipX = data[1] == "left";
            altplayer.flipX = data[1] == "right";
            player.side = data[1];
            altplayer.side = data[1] == "left" ? "right" : "left";
        }
        if (type === "pong") {
            console.log("pong", data);
        }
        if (type === "hurt") {
            altplayer.setHP(data[0]);
            updateHearts(altplayer.side, data[0]);
        }
    });
    setTimeout(() => {
        ws.send(JSON.stringify(["ready"]));
    }, 500);
    setInterval(() => {
        ws.send(JSON.stringify(["ping"]));
    }, 30000);
    backbtn("light", () => {
        ws.close();
        k.go("menu");
    });
});

k.go("menu");
k.onError((e) => {
    Sentry.captureException(e);
    console.error(e);
    k.debug.error(e);
    // draw custom error screen
    k.add([
        k.text("Uh Oh!", { size: 48 }),
        k.pos(k.width() / 2, k.height() / 2),
        k.anchor("center"),
    ]);
    k.add([
        k.text("An error has occurred", { size: 24 }),
        k.pos(k.width() / 2, k.height() / 2 + 50),
        k.anchor("center"),
    ]);
    k.add([
        k.text("Please refresh the page", { size: 24 }),
        k.pos(k.width() / 2, k.height() / 2 + 100),
        k.anchor("center"),
    ]);
});
