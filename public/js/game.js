const config = {
    type: Phaser.AUTO,
    parent: 'phaser-example',
    width: window.innerWidth,
    height: window.innerHeight,
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: {y: 0}
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};


let background;
let userName;
var userNameText;
var otherUserNameText = {};
function initHome() {
    userName = document.getElementById("usr").value;
    if (userName.toString().length >= 1) {
        var elem = document.getElementById('cont');
        elem.style.display = 'none';
        const game = new Phaser.Game(config);
    }else {
        alert("Escriba un nombre");
    }
}



function preload() {
    this.load.image('star', 'assets/sat.png');
    this.load.image('comet', 'assets/ufo.png');
    this.load.image('sky', 'assets/sky.png');
    this.load.image('astro', 'assets/ship.png');
    this.load.spritesheet('dude', 'assets/dude4.png', {frameWidth: 37, frameHeight: 56});
}

function create() {
    background = this.add.tileSprite(640, 300, 1600, 1000, 'sky');
    var self = this;
    this.socket = io();
    this.socket.emit('userCreated', userName);
    this.otherPlayers = this.physics.add.group();

    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addPlayer(self, players[id]);
            } else {
                addOtherPlayers(self, players[id]);
            }
        });
    });
//////////////Nuevo jugador
    this.socket.on('newPlayer', function (playerInfo) {
        addOtherPlayers(self, playerInfo);

    });

    this.particles = this.add.particles('star');
    this.emitter = this.particles.createEmitter({
        x: {min: 1100, max: 0, steps: 500},
        y: {min: 0, max: 600, steps: 300},
        lifespan: 0,
        rotate: 184,
        //alpha: { start: 100, end: 600 },
        //scale: { min: 0.21, max: 1 },
        scale: {min: 0.8, max: 1},
        //gravityY: -2000,
        on: false
    })
    this.emitter.start();


    this.particles = this.add.particles('star');
    this.emitter2 = this.particles.createEmitter({
        x: {min: 1280, max: -10, steps: 900},
        y: {min: 0, max: 600, steps: 400},
        angle: {min: 0, max: 360},
        quantity: 2,
        frecuency: 0,
        lifespan: 5,
        //alpha: { start: 1, end: 600 },
        scale: {min: 0.8, max: 1},
        rotate: 184,
        gravityX: -1000,
        on: false
    })
    this.emitter2.start();

    ///////////////Desconectado
    this.socket.on('disconnect', function (playerId) {
        otherUserNameText[playerId].destroy();
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerId === otherPlayer.playerId) {
                otherPlayer.destroy();
            }
        });
    });
    ////////Rotacion del jugador
    this.socket.on('playerMoved', function (playerInfo) {
        if (otherUserNameText[playerInfo.playerId] !== undefined) {
            otherUserNameText[playerInfo.playerId].x = playerInfo.x - 27;
            otherUserNameText[playerInfo.playerId].y = playerInfo.y - 45;
        }
        self.otherPlayers.getChildren().forEach(function (otherPlayer) {
            if (playerInfo.playerId === otherPlayer.playerId) {
                //console.log(JSON.stringify(otherPlayer))
                // otherPlayer.setRotation(playerInfo.rotation);
                let diferencia = otherPlayer.x - playerInfo.x;
                if (diferencia > 2) {
                    otherPlayer.anims.play('left', true);
                } else if (diferencia < -2) {
                    otherPlayer.anims.play('right', true);
                } else {
                    otherPlayer.anims.play('turn', true);
                }
                otherPlayer.setPosition(playerInfo.x, playerInfo.y);
            }
        });
    });
    //  Our player animations, turning, walking left and walking right.
    this.anims.create({
        key: 'left',
        frames: this.anims.generateFrameNumbers('dude', {start: 0, end: 3}),
        frameRate: 10,
        repeat: -1
    });

    this.anims.create({
        key: 'turn',
        frames: [{key: 'dude', frame: 4}],
        frameRate: 20
    });

    this.anims.create({
        key: 'right',
        frames: this.anims.generateFrameNumbers('dude', {start: 5, end: 8}),
        frameRate: 10,
        repeat: -1
    });

    //Creación cursor
    this.cursors = this.input.keyboard.createCursorKeys();

    this.redScoreText = this.add.text(875, 16, '', {fontSize: '24px', fill: '#ed391a'});
    this.blueScoreText = this.add.text(120, 16, '', {fontSize: '24px', fill: '#5900d6'});

    this.socket.on('scoreUpdate', function (scores, playerInfo) {
        self.blueScoreText.setText('Equipo azul: ' + scores.blue);
        self.redScoreText.setText('Equipo rojo: ' + scores.red);
    });

    this.socket.on('starLocation', function (starLocation) {
        if (self.star) self.star.destroy();
        self.star = self.physics.add.image(starLocation.x, starLocation.y, 'astro');
        self.physics.add.overlap(self.player, self.star, function () {
            this.socket.emit('starCollected');
        }, null, self);
    });

    this.socket.on('cometLocation', function (cometLocation) {
        if (self.comet) self.comet.destroy();
        self.comet = self.physics.add.image(cometLocation.x, cometLocation.y, 'comet');
        self.physics.add.overlap(self.player, self.comet, function () {
            this.socket.emit('cometCollected');
        }, null, self);
    });

}


function addPlayer(self, playerInfo) {
    self.player = self.physics.add.sprite(playerInfo.x, playerInfo.y, 'dude');
    userNameText = self.add.text(playerInfo.x - 27, playerInfo.y - 45, userName, {fontSize: '16px', fill: '#000000'});

    self.player.setGravity(200, -500);
    if (playerInfo.team === 'blue') {
        self.player.setTint(0xa54cff);
    } else {
        self.player.setTint(0xb26862);
    }
    self.player.setDrag(100);
    self.player.setAngularDrag(100);
    self.player.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
    otherUserNameText[playerInfo.playerId] = self.add.text(playerInfo.x - 27, playerInfo.y - 45, playerInfo.name, {fontSize: '16px', fill: '#000000'});
    const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'dude');
    if (playerInfo.team === 'blue') {
        otherPlayer.setTint(0x5900d6);
    } else {
        otherPlayer.setTint(0xed391a);
    }
    otherPlayer.playerId = playerInfo.playerId;
    self.otherPlayers.add(otherPlayer);
}

function update() {

    if (this.player) {
        if (this.cursors.left.isDown) {
            background.tilePositionX -= 3;
            this.player.setVelocityX(-160);
            this.player.anims.play('left', true);
        } else if (this.cursors.right.isDown) {
            this.player.anims.play('right', true);
            background.tilePositionX += 3;
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
            this.player.anims.play('turn', true);
        }
        if (this.cursors.up.isDown) {
            background.tilePositionY -= 3;
            this.player.setVelocityY(-160);
            // this.physics.velocityFromRotation(this.player.rotation + 1, -90, this.player.body.acceleration);
        } else if (this.cursors.down.isDown) {
            background.tilePositionY += 3;
            this.player.setVelocityY(160);
            // this.physics.velocityFromRotation(this.player.rotation + 1, 90, this.player.body.acceleration);
        } else {
            this.player.setVelocityY(0);
            //this.player.setAcceleration(0);
        }

        this.physics.world.wrap(this.player, 2);


        // emit player movement
        var x = this.player.x;
        var y = this.player.y;
        var r = this.player.rotation;
        if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y || r !== this.player.oldPosition.rotation)) {
            this.socket.emit('playerMovement', {x: this.player.x, y: this.player.y, rotation: this.player.rotation});
            userNameText.x = this.player.x - 27;
            userNameText.y = this.player.y - 45;
        }
        // save old position data
        this.player.oldPosition = {
            x: this.player.x,
            y: this.player.y,
            rotation: this.player.rotation
        };
    }
}