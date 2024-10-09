import kaplay from "kaplay"; // Note to copilot: kaplay is the community-driven fork of KaBoom.js
import PartySocket from "partysocket";

/** @type {PartySocket} */
var ws;


function moveroom(room) {
    if (ws) ws.close();
    ws = new PartySocket({
        host: "https://lorem-ipsum-game.magentapenguin.partykit.dev/",
        room: room,
    });    
}
moveroom("connect");
window.moveroom = moveroom;

ws.addEventListener("close", () => {
    console.warn("connection closed");
    k.debug.log("connection closed");
});


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
k.loadSpriteAtlas("/static/muteunmute.png", {
    // Dark theme
    "mute-dark": {x: 0, y: 0, width: 60, height: 16, sliceX: 4},
    // Light theme
    "mute-light": {x: 0, y: 16, width: 60, height: 16, sliceX: 4},
});
k.loadSprite("btn-dark", "/static/btn-dark.png", { slice9: {top: 3, bottom: 3, left: 2, right: 2} });
k.loadSprite("btn-light", "/static/btn-light.png", { slice9: {top: 3, bottom: 3, left: 2, right: 2} });
k.loadSprite("btn-dark-flat", "/static/btn-dark-flat.png", { slice9: {top: 3, bottom: 3, left: 2, right: 2} });
k.loadSprite("btn-light-flat", "/static/btn-light-flat.png", { slice9: {top: 3, bottom: 3, left: 2, right: 2} });

// Sounds
k.loadSound("hit", "/static/audio/hit.mp3");
k.loadSound("pew", "/static/audio/pew.mp3");
k.loadSound("music", "/static/audio/song.mp3");

var music;

function button(x, y, text, action, padding = 10, theme = "dark") {
    const txt = k.formatText({
        //pos: k.vec2(x, y),
        anchor: "center",
        align: "center",
        text: text,
        size: 24,
        width: 200,
        color: theme.includes('dark') ? k.rgb(0, 0, 0) : k.rgb(255, 255, 255),
    });
    console.log(txt.width, txt.height);
    const btn = k.add([
        k.sprite("btn-"+theme),
        k.pos(x+padding, y+padding*0.75),
        k.anchor("center"),
        k.area(),
        k.scale(1),
    ]);
    btn.onDraw(() => k.drawFormattedText(txt));
    btn.onHoverUpdate(() => {
        k.setCursor("pointer");
    });
    btn.onHover(() => {
        btn.scaleTo(1.2);
    });
    btn.onHoverEnd(() => {
        btn.scaleTo(1);
    });
    btn.onUpdate(() => {
        btn.width = 200+padding*2;
        btn.height = txt.height+padding*1.5;
    });
    btn.onClick(action);
    return btn;
}

function mutebtn(theme) {
    const btn = k.add([
        k.sprite("mute-"+theme, ),
        k.pos(k.width()-48, k.height()-48),
        k.anchor("center"),
        k.scale(4),
        k.area(),
        { mode: false, isHovered: false, isClickedafterHover: false },
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
        btn.isClickedafterHover = true;
        btn.frame = 1+btn.mode*2;
    });
    btn.onMouseRelease(() => {
        if (!btn.isClickedafterHover) return;
        btn.isClickedafterHover = false;
        if (btn.mode) {
            music.stop();
        } else {
            music = k.play("music", { loop: true, volume: 0.5 });
        }
        btn.mode = !btn.mode;
        btn.frame = btn.mode*2;
    });
    return btn;
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

k.scene("menu", () => {
    k.onUpdate(() => k.setCursor("default"));
    mutebtn("light");
    const a = k.add([
        k.text("Lorem Ipsum", { size: 72, }),
        k.pos(k.width() / 2, k.height() / 2 - 100),
        k.anchor("center"),
        k.area(),
    ]);
    // funni lil line
    k.add([
        k.rect(a.width/1.1, 3),
        k.pos(a.pos.x, a.pos.y+a.height/2-10),
        k.anchor("center"),
        k.color(255, 255, 255),
    ]);
    k.add([
        k.text("The game that is in development", { size: 20, }),
        k.pos(a.pos.x, a.pos.y+a.height/2+5),
        k.anchor("center"),
        k.area(),
    ]);

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
        k.go("game");
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
    });

    
    // Hit detection
    player.onCollide("bullet-remote", (b) => {
        k.play("hit", { volume: 0.9 });
        b.destroy();
    });

    k.onUpdate(() => {
        cooldown -= k.dt();
        if (cooldown < 0) cooldown = 0;
        if (k.isButtonDown("fire")) {
            if (cooldown > 0) return;
            cooldown += 0.5;
            k.play("pew", { volume: 0.8 });
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
            k.play("pew", { volume: 0.6 });
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
});

k.go("menu");