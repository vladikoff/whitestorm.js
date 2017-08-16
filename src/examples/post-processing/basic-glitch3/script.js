import * as UTILS from './globals';

const radiusMin = 150, // Min radius of the asteroid belt.
  radiusMax = 220, // Max radius of the asteroid belt.
  particleCount = 400, // Ammount of asteroids.
  particleMinRadius = 0.1, // Min of asteroid radius.
  particleMaxRadius = 4, // Max of asteroid radius.
  planetSize = 50; // Radius of planet.

const colors = {
  green: 0x8fc999,
  blue: 0x5fc4d0,
  orange: 0xee5624,
  yellow: 0xfaff70
};




// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------
const conf = {
  world: {
    ...UTILS.$world,

    camera: {
      far: 2000,
      near: 1,
      position: [0, 100, 400]
    },

    plugins: {
      rendering: false
    },
    stats: false,
    autoresize: "window",

    gravity: {
      x: 0,
      y: 0,
      z: 0
    },
  },

  // sphere: {
  //   geometry: {
  //     radius: 3,
  //     widthSegments: 16,
  //     heightSegments: 16
  //   },
  //
  //   mass: 10,
  //
  //   material: {
  //     color: UTILS.$colors.mesh,
  //     kind: 'phong'
  //   },
  //
  //   position: {
  //     y: 50
  //   }
  // }
};


// -----------------------------------------------------------------------------
// Glitch Pass
// -----------------------------------------------------------------------------
const DigitalGlitchShader = {
  uniforms: {
    tDiffuse: { value: null }, //diffuse texture
    tDisp: { value: null }, //displacement texture for digital glitch squares
    byp: { value: 0 }, //apply the glitch ?
    amount: { value: 0.08 },
    angle: { value: 0.02 },
    seed: { value: 0.02 },
    seed_x: { value: 0.02 }, //-1,1
    seed_y: { value: 0.02 }, //-1,1
    distortion_x: { value: 0.5 },
    distortion_y: { value: 0.6 },
    col_s: { value: 0.05 }
  },

  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
  `,

  fragmentShader: `
    uniform int byp; //should we apply the glitch ?

    uniform sampler2D tDiffuse;
    uniform sampler2D tDisp;

    uniform float amount;
    uniform float angle;
    uniform float seed;
    uniform float seed_x;
    uniform float seed_y;
    uniform float distortion_x;
    uniform float distortion_y;
    uniform float col_s;

    varying vec2 vUv;


    float rand(vec2 co){
      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
    }

    void main() {
      if(byp<1) {
        vec2 p = vUv;
        float xs = floor(gl_FragCoord.x / 0.5);
        float ys = floor(gl_FragCoord.y / 0.5);
        //based on staffantans glitch shader for unity https://github.com/staffantan/unityglitch
        vec4 normal = texture2D (tDisp, p*seed*seed);

        if(p.y<distortion_x+col_s && p.y>distortion_x-col_s*seed) {
          if(seed_x>0.){
            p.y = 1. - (p.y + distortion_y);
          }
          else {
            p.y = distortion_y;
          }
        }

        if(p.x<distortion_y+col_s && p.x>distortion_y-col_s*seed) {
          if(seed_y>0.){
            p.x=distortion_x;
          }
          else {
            p.x = 1. - (p.x + distortion_x);
          }
        }

        p.x+=normal.x*seed_x*(seed/5.);
        p.y+=normal.y*seed_y*(seed/5.);

        //base from RGB shift shader

        vec2 offset = amount * vec2( cos(angle), sin(angle));
        vec4 cr = texture2D(tDiffuse, p + offset);
        vec4 cga = texture2D(tDiffuse, p);
        vec4 cb = texture2D(tDiffuse, p - offset);
        gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);

        //add noise
        vec4 snow = 200.*amount*vec4(rand(vec2(xs * seed,ys * seed*50.))*0.2);
        gl_FragColor = gl_FragColor+ snow;
      }
      else {
        gl_FragColor = texture2D (tDiffuse, vUv);
      }
    }
  `
};

class GlitchPass extends WHS.Pass {
  constructor(name, dt_size) {

    super(name);

    if (DigitalGlitchShader === undefined) console.error("THREE.GlitchPass relies on DigitalGlitchShader");

    var shader = DigitalGlitchShader;
    this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    if (dt_size == undefined) dt_size = 64;

    this.uniforms["tDisp"].value = this.generateHeightmap(dt_size);

    this.material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene = new THREE.Scene();

    this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    this.scene.add(this.quad);

    this.goWild = false;
    this.curF = 0;
    this.generateTrigger();
  }

  render(renderer, writeBuffer, readBuffer, delta, maskActive) {
    this.uniforms["tDiffuse"].value = readBuffer.texture;
    this.uniforms['seed'].value = Math.random(); //default seeding
    this.uniforms['byp'].value = 0;

    if (this.curF % this.randX == 0 || this.goWild == true) {
      this.uniforms['amount'].value = Math.random() / 30;
      this.uniforms['angle'].value = THREE.Math.randFloat(-Math.PI, Math.PI);
      this.uniforms['seed_x'].value = THREE.Math.randFloat(-1, 1);
      this.uniforms['seed_y'].value = THREE.Math.randFloat(-1, 1);
      this.uniforms['distortion_x'].value = THREE.Math.randFloat(0, 1);
      this.uniforms['distortion_y'].value = THREE.Math.randFloat(0, 1);
      this.curF = 0;
      this.generateTrigger();
    } else if (this.curF % this.randX < this.randX / 5) {
      this.uniforms['amount'].value = Math.random() / 90;
      this.uniforms['angle'].value = THREE.Math.randFloat(-Math.PI, Math.PI);
      this.uniforms['distortion_x'].value = THREE.Math.randFloat(0, 1);
      this.uniforms['distortion_y'].value = THREE.Math.randFloat(0, 1);
      this.uniforms['seed_x'].value = THREE.Math.randFloat(-0.3, 0.3);
      this.uniforms['seed_y'].value = THREE.Math.randFloat(-0.3, 0.3);
    } else if (this.goWild == false) {
      this.uniforms['byp'].value = 1;
    }

    this.curF++;
    this.quad.material = this.material;

    if (this.renderToScreen) {
      renderer.render(this.scene, this.camera);
    } else {
      renderer.render(this.scene, this.camera, writeBuffer, this.clear);
    }
  }

  generateTrigger() {
    this.randX = THREE.Math.randInt(120, 240);
  }

  generateHeightmap(dt_size) {
    var data_arr = new Float32Array(dt_size * dt_size * 3);
    var length = dt_size * dt_size;

    for (var i = 0; i < length; i++) {
      var val = THREE.Math.randFloat(0, 1);
      data_arr[i * 3 + 0] = val;
      data_arr[i * 3 + 1] = val;
      data_arr[i * 3 + 2] = val;
    }

    var texture = new THREE.DataTexture(data_arr, dt_size, dt_size, THREE.RGBFormat, THREE.FloatType);
    texture.needsUpdate = true;
    return texture;
  }
}


// -----------------------------------------------------------------------------
// Game class
// -----------------------------------------------------------------------------
class Game {
  constructor(options) {
    this.options = options;

    this.world = new WHS.World(options.world);

    //UTILS.addPlane(this.world, 250);
    UTILS.addBasicLights(this.world);

    this.createPostProcessing();
    this.createGeometry();
    // this.world.setSize(window.innerWidth, window.innerHeight);
  }

  createPostProcessing() {
    this.world.$rendering = new WHS.PostProcessor(this.world.params);
    this.postProcessor = this.world.$rendering;

    this.postProcessor.createRenderPass(false);
    this.postProcessor.createPass(composer => {
      const pass = new GlitchPass('Glitch');
      pass.renderToScreen = true;
      composer.addPass(pass);
    });
  }

  createGeometry() {
    this.sphere = new WHS.Sphere(this.options.sphere);
    this.sphere.addTo(this.world);
  }

  start() {


    const space = new WHS.Group();
    space.addTo(this.world);
    space.rotation.z = Math.PI / 12;

    const planet = new WHS.Tetrahedron({
      geometry: {
        radius: planetSize,
        detail: 2
      },

      mass: 100,

      material: {
        color: 0xF7A37A, // #90C27D
        shading: THREE.FlatShading,
        roughness: 0.9,
        emissive: 0x270000,
        kind: 'standard'
      }
    });

    planet.addTo(space);

// LIGHTS.
    new WHS.AmbientLight({
      light: {
        color: 0x663344,
        intensity: 2
      }
    }).addTo(this.world);

    new WHS.DirectionalLight({
      light: {
        color: 0xffffff,
        intensity: 1.5,
        distance: 800
      },

      shadowmap: {
        width: 2048,
        height: 2048,

        left: -800,
        right: 800,
        top: 800,
        bottom: -800,
        far: 800
      },

      position: {
        x: 300,
        z: 300,
        y: 100
      }
    }).addTo(this.world);

    const s1 = new WHS.Dodecahedron({
      geometry: {
        buffer: true,
        radius: 10
      },

      mass: 0,
      physics: false,

      material: {
        shading: THREE.FlatShading,
        emissive: 0x270000,
        roughness: 0.9,
        kind: 'standard'
      }
    });

    const s2 = new WHS.Box({
      geometry: {
        buffer: true,
        width: 10,
        height: 10,
        depth: 10
      },

      mass: 0,
      physics: false,

      material: {
        shading: THREE.FlatShading,
        roughness: 0.9,
        emissive: 0x270000,
        kind: 'standard'
      }
    });

    const s3 = new WHS.Cylinder({
      geometry: {
        buffer: true,
        radiusTop: 0,
        radiusBottom: 10,
        height: 10
      },

      mass: 0,
      physics: false,

      material: {
        shading: THREE.FlatShading,
        roughness: 0.9,
        emissive: 0x270000,
        kind: 'standard'
      }
    });

    const s4 = new WHS.Sphere({
      geometry: {
        buffer: true,
        radius: 10
      },

      mass: 0,
      physics: false,

      material: {
        shading: THREE.FlatShading,
        roughness: 0.9,
        emissive: 0x270000,
        kind: 'standard'
      }
    });

    const asteroids = new WHS.Group();
    asteroids.addTo(space);

// Materials.
    const mat = [
      new THREE.MeshPhongMaterial({ color: colors.green, shading: THREE.FlatShading }),
      new THREE.MeshPhongMaterial({ color: colors.blue, shading: THREE.FlatShading }),
      new THREE.MeshPhongMaterial({ color: colors.orange, shading: THREE.FlatShading }),
      new THREE.MeshPhongMaterial({ color: colors.yellow, shading: THREE.FlatShading })
    ];

    for (let i = 0; i < particleCount; i++) {
      const particle = [s1, s2, s3, s4][Math.ceil(Math.random() * 3)].clone(),
        radius = particleMinRadius + Math.random() * (particleMaxRadius - particleMinRadius);

      particle.g_({
        radiusBottom: radius,
        radiusTop: 0,
        height: particle instanceof WHS.Cylinder ? radius * 2 : radius,
        width: radius,
        depth: radius,
        radius
      });

      particle.material = mat[Math.floor(4 * Math.random())]; // Set custom THREE.Material to mesh.

      // Particle data.
      particle.data = {
        distance: radiusMin + Math.random() * (radiusMax - radiusMin),
        angle: Math.random() * Math.PI * 2
      };

      // Set position & rotation.
      particle.position.x = Math.cos(particle.data.angle) * particle.data.distance;
      particle.position.z = Math.sin(particle.data.angle) * particle.data.distance;
      particle.position.y = -10 * Math.random() + 4;

      particle.rotation.set(Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random(), Math.PI * 2 * Math.random());

      particle.addTo(asteroids);
    }

// Animating rotating shapes around planet.
    const particles = asteroids.children;
    const animation = new WHS.Loop(() => {
      for (let i = 0, max = particles.length; i < max; i++) {
        const particle = particles[i];

        particle.data.angle += 0.005 * particle.data.distance / radiusMax;

        particle.position.x = Math.cos(particle.data.angle) * particle.data.distance;
        particle.position.z = Math.sin(particle.data.angle) * particle.data.distance;

        particle.rotation.x += Math.PI / 60;
        particle.rotation.y += Math.PI / 60 / 200;
      }

      planet.rotation.y += 0.005;
    });

    this.world.addLoop(animation);
    this.world.setControls(new WHS.OrbitControls());

    animation.start();
    //
    var text = new WHS.Text({
      geometry: {
        text: 'Mozilla Developer Roadshow',
        parameters: {
          font: '../../ironBrine.js',
          size: 32,
          height: 5,
          curveSegments: 3
        }
      },

      mass: 10,

      material: {
        color: 0xFDAE45, // #FDAE45
        kind: "lambert"
      },

      position: {
        x: -220,
        y: 110,
        z: 20
      }
    });

    text.addTo(this.world);

    this.world.start();
    //this.world.setControls(new WHS.OrbitControls());
  }
}

// -----------------------------------------------------------------------------
// Application bootstrap
// -----------------------------------------------------------------------------
var app = null;

function bootstrap() {
  app.start()
}

function configure() {
  return new Promise((resolve) => {
    // some async config fetch could be done from here
    // ...

    // Create a Game instance with its conf
    app = new Game(conf);
    resolve(true);
  });
}

configure().then(() => bootstrap());
