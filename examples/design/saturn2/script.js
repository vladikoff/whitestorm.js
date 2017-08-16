(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var radiusMin = 150,
    // Min radius of the asteroid belt.
radiusMax = 220,
    // Max radius of the asteroid belt.
particleCount = 400,
    // Ammount of asteroids.
particleMinRadius = 0.1,
    // Min of asteroid radius.
particleMaxRadius = 4,
    // Max of asteroid radius.
planetSize = 50; // Radius of planet.

var colors = {
  green: 0x8fc999,
  blue: 0x5fc4d0,
  orange: 0xee5624,
  yellow: 0xfaff70
};

////////// GLITCH PASS


// -----------------------------------------------------------------------------
// Glitch Pass
// -----------------------------------------------------------------------------
var DigitalGlitchShader = {
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

  vertexShader: "\n    varying vec2 vUv;\n\n    void main() {\n      vUv = uv;\n      gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n    }\n  ",

  fragmentShader: "\n    uniform int byp; //should we apply the glitch ?\n\n    uniform sampler2D tDiffuse;\n    uniform sampler2D tDisp;\n\n    uniform float amount;\n    uniform float angle;\n    uniform float seed;\n    uniform float seed_x;\n    uniform float seed_y;\n    uniform float distortion_x;\n    uniform float distortion_y;\n    uniform float col_s;\n\n    varying vec2 vUv;\n\n\n    float rand(vec2 co){\n      return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);\n    }\n\n    void main() {\n      if(byp<1) {\n        vec2 p = vUv;\n        float xs = floor(gl_FragCoord.x / 0.5);\n        float ys = floor(gl_FragCoord.y / 0.5);\n        //based on staffantans glitch shader for unity https://github.com/staffantan/unityglitch\n        vec4 normal = texture2D (tDisp, p*seed*seed);\n\n        if(p.y<distortion_x+col_s && p.y>distortion_x-col_s*seed) {\n          if(seed_x>0.){\n            p.y = 1. - (p.y + distortion_y);\n          }\n          else {\n            p.y = distortion_y;\n          }\n        }\n\n        if(p.x<distortion_y+col_s && p.x>distortion_y-col_s*seed) {\n          if(seed_y>0.){\n            p.x=distortion_x;\n          }\n          else {\n            p.x = 1. - (p.x + distortion_x);\n          }\n        }\n\n        p.x+=normal.x*seed_x*(seed/5.);\n        p.y+=normal.y*seed_y*(seed/5.);\n\n        //base from RGB shift shader\n\n        vec2 offset = amount * vec2( cos(angle), sin(angle));\n        vec4 cr = texture2D(tDiffuse, p + offset);\n        vec4 cga = texture2D(tDiffuse, p);\n        vec4 cb = texture2D(tDiffuse, p - offset);\n        gl_FragColor = vec4(cr.r, cga.g, cb.b, cga.a);\n\n        //add noise\n        vec4 snow = 200.*amount*vec4(rand(vec2(xs * seed,ys * seed*50.))*0.2);\n        gl_FragColor = gl_FragColor+ snow;\n      }\n      else {\n        gl_FragColor = texture2D (tDiffuse, vUv);\n      }\n    }\n  "
};

var GlitchPass = function (_WHS$Pass) {
  _inherits(GlitchPass, _WHS$Pass);

  function GlitchPass(name, dt_size) {
    _classCallCheck(this, GlitchPass);

    var _this = _possibleConstructorReturn(this, (GlitchPass.__proto__ || Object.getPrototypeOf(GlitchPass)).call(this, name));

    if (DigitalGlitchShader === undefined) console.error("THREE.GlitchPass relies on DigitalGlitchShader");

    var shader = DigitalGlitchShader;
    _this.uniforms = THREE.UniformsUtils.clone(shader.uniforms);

    if (dt_size == undefined) dt_size = 64;

    _this.uniforms["tDisp"].value = _this.generateHeightmap(dt_size);

    _this.material = new THREE.ShaderMaterial({
      uniforms: _this.uniforms,
      vertexShader: shader.vertexShader,
      fragmentShader: shader.fragmentShader
    });

    _this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    _this.scene = new THREE.Scene();

    _this.quad = new THREE.Mesh(new THREE.PlaneBufferGeometry(2, 2), null);
    _this.scene.add(_this.quad);

    _this.goWild = false;
    _this.curF = 0;
    _this.generateTrigger();
    return _this;
  }

  _createClass(GlitchPass, [{
    key: "render",
    value: function render(renderer, writeBuffer, readBuffer, delta, maskActive) {
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
  }, {
    key: "generateTrigger",
    value: function generateTrigger() {
      this.randX = THREE.Math.randInt(120, 240);
    }
  }, {
    key: "generateHeightmap",
    value: function generateHeightmap(dt_size) {
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
  }]);

  return GlitchPass;
}(WHS.Pass);

///////////////


var world = new WHS.World({
  stats: false,
  autoresize: "window",

  gravity: {
    x: 0,
    y: 0,
    z: 0
  },

  camera: {
    far: 2000,
    near: 1,
    position: [0, 100, 400]
  },

  rendering: {
    background: {
      color: 0x2a3340
    },

    renderer: {
      antialias: true
    }
  }
});

var space = new WHS.Group();
space.addTo(world);
space.rotation.z = Math.PI / 12;

var planet = new WHS.Tetrahedron({
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
}).addTo(world);

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
}).addTo(world);

var s1 = new WHS.Dodecahedron({
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

var s2 = new WHS.Box({
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

var s3 = new WHS.Cylinder({
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

var s4 = new WHS.Sphere({
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

var asteroids = new WHS.Group();
asteroids.addTo(space);

// Materials.
var mat = [new THREE.MeshPhongMaterial({ color: colors.green, shading: THREE.FlatShading }), new THREE.MeshPhongMaterial({ color: colors.blue, shading: THREE.FlatShading }), new THREE.MeshPhongMaterial({ color: colors.orange, shading: THREE.FlatShading }), new THREE.MeshPhongMaterial({ color: colors.yellow, shading: THREE.FlatShading })];

for (var i = 0; i < particleCount; i++) {
  var particle = [s1, s2, s3, s4][Math.ceil(Math.random() * 3)].clone(),
      radius = particleMinRadius + Math.random() * (particleMaxRadius - particleMinRadius);

  particle.g_({
    radiusBottom: radius,
    radiusTop: 0,
    height: particle instanceof WHS.Cylinder ? radius * 2 : radius,
    width: radius,
    depth: radius,
    radius: radius
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
var particles = asteroids.children;
var animation = new WHS.Loop(function () {
  for (var _i = 0, max = particles.length; _i < max; _i++) {
    var _particle = particles[_i];

    _particle.data.angle += 0.005 * _particle.data.distance / radiusMax;

    _particle.position.x = Math.cos(_particle.data.angle) * _particle.data.distance;
    _particle.position.z = Math.sin(_particle.data.angle) * _particle.data.distance;

    _particle.rotation.x += Math.PI / 60;
    _particle.rotation.y += Math.PI / 60 / 200;
  }

  planet.rotation.y += 0.005;
});

world.addLoop(animation);
world.setControls(new WHS.OrbitControls());

animation.start();

var text = new WHS.Text({
  geometry: {
    text: '7 years of three.js',
    parameters: {
      font: 'ironBrine.js',
      size: 32,
      height: 5,
      curveSegments: 3
    }
  },

  mass: 10,

  material: {
    color: 0xF7A37A,
    kind: "lambert"
  },

  position: {
    x: -170,
    y: 110,
    z: 20
  }
});

text.addTo(world);
// Start rendering.


world.$rendering = new WHS.PostProcessor(world.params);
var postProcessor = world.$rendering;

postProcessor.createRenderPass(false);
postProcessor.createPass(function (composer) {
  var pass = new GlitchPass('Glitch');
  pass.renderToScreen = true;
  composer.addPass(pass);
});

world.start();

},{}]},{},[1]);
