import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { initXMTPClient, sendXMTPMessage } from "../utils/xmtpUtils";
import { DynamicSDK } from "@dynamic-labs/sdk-react-core";
import { checkNFTOwnership } from "../utils/airstackUtils";
import { hasUserRecast } from "../utils/dynamicUtils";
import { getFarcasterUserDetails, FarcasterUserDetailsInput, FarcasterUserDetailsOutput } from "@airstack/frames";


const dynamicSDK = new DynamicSDK(process.env.NEXT_PUBLIC_DYNAMIC_API_KEY);

const Destination = class extends Phaser.Scene {
  constructor() {
    super('reached');
  }
  preload() {
    this.load.image('game-over', './assets/gameover.png');
  }
  create() {
    this.add.image(400, 300, 'game-over').setScale(2);
    this.time.addEvent({
      delay: 1000,
      callback: () => {
        this.add.text(200, 0, 'click to restart !', { font: '64px Arial' }).setOrigin(0);
      },
      callbackScope: this,
      loop: true,
    });
    this.input.on('pointerdown', () => {
      this.scene.start('main');
    });
  }
};

const Main = class extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private clicked!: boolean;
  private pipes!: Phaser.Physics.Arcade.StaticGroup;
  private score!: Phaser.GameObjects.Text;
  private scoreText = 0;
  private floor!: Phaser.Physics.Arcade.Image;
  private hit!: Phaser.Sound.BaseSound;
  private onhit = false;
  private die!: Phaser.Sound.BaseSound;
  private difficulty = 1;

  // state variables for credits, lives, and NFT ownership
  private credits = 3;
  private lives = 3;
  private hasNFT = false;

  constructor() {
    super('main');
  }

  init() {
    this.onhit = false;
  }

  preload() {
    this.load.image('floor', '/base.png');
    this.load.image('background', '/background-day.png');
    this.load.image('green-pipe', './assets/pipe-green.png');
    this.load.image('red-pipe', './assets/pipe-red.png');
    this.load.image('bird-upflap', './assets/bluebird-upflap.png');
    this.load.image('bird-midflap', './assets/bluebird-midflap.png');
    this.load.image('bird-downflap', './assets/bluebird-downflap.png');
    this.load.audio('die', './assets/die.wav');
    this.load.audio('wing', './assets/wing.wav');
    this.load.audio('hit', './assets/hit.wav');
  }

  create() {
    this.add.image(0, 0, 'background').setOrigin(0).setScale(3, 1).setScrollFactor(0);
    const wing = this.sound.add('wing');
    this.die = this.sound.add('die');
    this.hit = this.sound.add('hit');

    this.pipes = this.physics.add.staticGroup();
    for (let i = 0; i < 3; i++) {
      const x = 300 * i;
      const y = Phaser.Math.Between(340, 400);
      const pipe1 = this.pipes.create(x, y, 'green-pipe').setScale(2, 1);
      const pipe2 = this.pipes.create(x, -65, 'green-pipe').setScale(2, 1).setFlipY(true);
      const body1 = pipe1.body as Phaser.Physics.Arcade.Body;
      body1.updateFromGameObject();
      const body2 = pipe2.body as Phaser.Physics.Arcade.Body;
      body2.updateFromGameObject();
    }

    this.floor = this.physics.add
      .image(0, this.physics.world.bounds.height - 100, 'floor')
      .setOrigin(0)
      .setScale(2.39, 1)
      .setScrollFactor(0);

    this.player = this.physics.add.sprite(100, 150, 'bird-upflap').setOrigin(0);
    this.physics.add.overlap(this.player, this.pipes);
    this.input.on('pointerdown', () => {
      wing.play();
      this.clicked = true;
      this.player.setTexture('bird-downflap');
    });
    this.input.on('pointerup', () => {
      this.clicked = false;
      this.player.setTexture('bird-upflap');
    });
    this.cameras.main.setBounds(0, 0, 10000, 50);
    this.cameras.main.startFollow(this.player);
    this.score = this.add
      .text(200, 0, `score: ${this.scoreText}`, { font: '64px Arial', color: '#f0000f' })
      .setScrollFactor(0);
    this.time.addEvent({
      delay: 3000,
      callback: this.handleScore,
      callbackScope: this,
      loop: true,
    });
    this.physics.add.overlap(this.player, this.pipes, () => {
      this.onhit = true;
    });
    this.floor.setCollideWorldBounds(true);

    // Check user's NFT ownership status using Airstack SDK
    this.checkNFTOwnership();
  }

  update() {
    if (this.onhit) {
      this.player.setVelocityX(0);
      this.die.play();
      this.lives--;
      if (this.lives > 0) {
        // Restart the game
        this.scene.restart();
      } else {
        // Game over
        this.scene.pause(this);
        this.scene.start('reached');
      }
    }
    if (this.player.y > this.floor.y - 50) {
      this.hit.play();
      setTimeout(() => {
        this.scene.start('reached');
      }, 16);
    }
    this.pipes.children.iterate(child => {
      const pipe = child;
      const scrollX = this.cameras.main.scrollX;
      if (pipe.x <= scrollX - 50) {
        pipe.x = scrollX + Phaser.Math.Between(800, 820);
        pipe.body.updateFromGameObject();
      }
    });

    if (this.clicked == true) {
      this.player.setVelocity(100, -200);
    }
  }

  handleScore() {
    this.scoreText++;
    this.score.text = `score: ${this.scoreText}`;
  }

  async buyCredits() {
    try {
      const userAddress = this.getUserFarcasterAddress(); // Get the user's Farcaster address dynamically
      const amount = 0.001; // Amount of ETH to purchase credits
  
      // Use Dynamic SDK to handle credit purchase
      const { data, error } = await dynamicSDK.buyCredits(userAddress, amount);
      if (error) {
        console.error('Error buying credits:', error);
        return;
      }
  
      // Update the user's credits balance
      this.credits += data.credits;
      console.log('Credits purchased successfully');
    } catch (error) {
      console.error('Error buying credits:', error);
    }
  }
  
  async earnExtraLife() {
    try {
      const userAddress = this.getUserFarcasterAddress(); // Get the user's Farcaster address dynamically
  
      // Check if the user has already recast the frame
      const hasRecast = await hasUserRecast(userAddress);
  
      if (!hasRecast) {
        // User hasn't recast yet, grant an extra life
        this.lives++;
        console.log('Extra life earned successfully');
  
        // Update the user's recast status using the Dynamic SDK
        await dynamicSDK.updateRecastStatus(userAddress, true);
      } else {
        console.log('User has already recast, no extra life granted');
      }
    } catch (error) {
      console.error('Error earning extra life:', error);
    }
  }
  
  async sendFeedback(feedback: string) {
    try {
      const privateKey = process.env.NEXT_PUBLIC_XMTP_PRIVATE_KEY;
      const recipientAddress = process.env.NEXT_PUBLIC_FEEDBACK_RECIPIENT_ADDRESS;

      // Initialize the XMTP client
      await initXMTPClient(privateKey);

      // Send the feedback message using XMTP
      await sendXMTPMessage(recipientAddress, feedback);

      console.log('Feedback sent successfully');
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  }

  async checkNFTOwnership() {
    try {
      const fid = 602; // Replace with the actual FID of the user
      const nftAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS;

      // Check NFT ownership
      const hasNFT = await checkNFTOwnership(fid, nftAddress);
      if (hasNFT) {
        console.log('User holds the required NFT');
        this.hasNFT = true;
        this.credits = 3; // Grant the user 3 credit tokens
      } else {
        console.log('User does not hold the required NFT');
      }
    } catch (error) {
      console.error('Error checking NFT ownership:', error);
    }
  }
  async getUserFarcasterAddress(): Promise<string> {
    try {
      const fid = this.getFID(); 

      const input: FarcasterUserDetailsInput = {
        fid: fid,
      };

      const { data, error }: FarcasterUserDetailsOutput = await getFarcasterUserDetails(input);
      if (error) {
        throw new Error(error);
      }

      if (data.userAssociatedAddresses && data.userAssociatedAddresses.length > 0) {
        return data.userAssociatedAddresses[0]; // Return the first associated address
      } else {
        throw new Error("No associated addresses found for the user");
      }
    } catch (error) {
      console.error("Error retrieving user's Farcaster address:", error);
      return "";
    }
  }

  async getFID(): Promise<number> {
    try {
      const userAddress = this.getUserAddress(); 
  
      const input: FarcasterUserDetailsInput = {
        identity: userAddress,
      };
  
      const { data, error }: FarcasterUserDetailsOutput = await getFarcasterUserDetails(input);
      if (error) {
        throw new Error(error);
      }
  
      return data.fid;
    } catch (error) {
      console.error("Error retrieving user's FID:", error);
      return 0; 
  }
  
const GameComponent: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 200 },
        },
      },
      scene: [Main, Destination],
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
    };
  }, []);

  return <div id="phaser-game" />;
};

export default GameComponent;
