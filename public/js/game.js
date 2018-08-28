var config = {
  type: Phaser.AUTO,
  parent: 'phaser-example',
  width: 1280,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      debug: false,
      gravity: { y: 0 }
    }
  },
  scene: {
    preload: preload,
    create: create,
    update: update
  } 
};

var game = new Phaser.Game(config);
var background;

function preload() {
  this.load.image('star', 'assets/sat.png');
  this.load.image('comet', 'assets/falling.png');
  this.load.image('sky', 'assets/sky.png');
  this.load.spritesheet('dude','assets/dude0.png', { frameWidth: 32, frameHeight: 48 } );
}

function create() {
  background =  this.add.tileSprite(640,300,1280, 600, 'sky');
  var self = this;
  this.socket = io();

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
    
  this.particles = this.add.particles('comet');
  this.emitter = this.particles.createEmitter({
      x: {min:1280 , max:0 , steps: 700},
      y: {min:0 , max:600 , steps: 400},
      //angle: { min: 0, max: 360 },
      speedX: 10,
      speedY: 40,
      quantity: 3 ,
      frecuency: 100,
      lifespan: 10,
      alpha: { start: 100, end: 600 },
      //scale: { min: 0.21, max: 1 },
      //rotate: { start: 0, end: 180 },
      gravityY: -2000,
      on: false
  })
this.emitter.start();


this.particles = this.add.particles('star');
this.emitter2 = this.particles.createEmitter({
    x: {min:1280 , max:-10 , steps: 900},
    y: {min:0 , max:600 , steps: 400},
    angle: { min: 0, max: 360 },
    quantity: 2 ,
    frecuency: 0,
    lifespan: 5,
    alpha: { start: 1, end: 600 },
    scale: { min: 0.8, max: 1 },
    rotate: 184,
    gravityX: -1000,
    on: false
})
this.emitter2.start();

///////////////Desconectado
  this.socket.on('disconnect', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });
////////Rotacion del jugador
 this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
     if (playerInfo.playerId === otherPlayer.playerId) {
        otherPlayer.setRotation(playerInfo.rotation);
        otherPlayer.setPosition(playerInfo.x, playerInfo.y);
      }
    });
  });

  //  Our player animations, turning, walking left and walking right.
  this.anims.create({
    key: 'left',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
    frameRate: 10,
    repeat: -1
});

this.anims.create({
    key: 'turn',
    frames: [ { key: 'dude', frame: 4 } ],
    frameRate: 20
});

this.anims.create({
    key: 'right',
    frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
    frameRate: 10,
    repeat: -1
});

  //Creación cursor
  this.cursors = this.input.keyboard.createCursorKeys();

  this.redScoreText = this.add.text(584, 16, '', { fontSize: '32px', fill: '#FF0000' });
  this.blueScoreText = this.add.text(0, 16, '', { fontSize: '32px', fill: '#FF1000' });
  this.nameText = this.add.text(100, 16, 'bebebe', { fontSize: '12px', fill: '#FF1000' });
  
  this.socket.on('scoreUpdate', function (scores, playerInfo) {
    self.blueScoreText.setText('Blue: ' + scores.blue);
    self.redScoreText.setText('Red: ' + scores.red);
  });

  this.socket.on('starLocation', function (starLocation) {
    if (self.star) self.star.destroy();
    self.star = self.physics.add.image(starLocation.x, starLocation.y, 'star');
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
  self.player.setBounce(0.3);
  self.player.setGravity(200,500);
  if (playerInfo.team === 'blue') {
    //self.player.setTint(0xffffb3);
  } else {
    self.player.setTint(0xffad99);
  }
  self.player.setDrag(100);
  self.player.setAngularDrag(100);
  self.player.setMaxVelocity(200);
}

function addOtherPlayers(self, playerInfo) {
  const otherPlayer = self.add.sprite(playerInfo.x, playerInfo.y, 'dude');
  if (playerInfo.team === 'blue') {
    otherPlayer.setTint(0x0000ff);
  } else {
    otherPlayer.setTint(0xff0000);
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
    }  else {
       this.player.setVelocityY(0);
      //this.player.setAcceleration(0);
    }
  
    this.physics.world.wrap(this.player, 2);

    
    // emit player movement
    var x = this.player.x;
    var y = this.player.y;
    var r = this.player.rotation;
    if (this.player.oldPosition && (x !== this.player.oldPosition.x || y !== this.player.oldPosition.y || r !== this.player.oldPosition.rotation)) {
      this.socket.emit('playerMovement', { x: this.player.x, y: this.player.y, rotation: this.player.rotation });
    }
    // save old position data
    this.player.oldPosition = {
      x: this.player.x,
      y: this.player.y,
      rotation: this.player.rotation
    };
  }
}