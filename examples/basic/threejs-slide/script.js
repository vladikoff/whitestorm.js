(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _globals = require('./globals');

var UTILS = _interopRequireWildcard(_globals);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function Slides(options) {
  if (!options) options = {};

  this.group = new THREE.Object3D();
  this.group.position.set(0, 0, 0);

  this.scene = options.scene;
  this.world = options.world;
  this.scene.add(this.group);
  this.createSliderExtras();
  this.load();
  this.render();
  this.setupControls();

  this.current = 0;
}

Slides.prototype.load = function (data) {
  data = [];

  for (var n = 1; n <= 3; n++) {
    //if (n < 10) n = "0" + n;

    data.push({ src: '../slides/' + n + '.jpg' });
  }

  this.slideData = data;
};

Slides.prototype.render = function () {
  var self = this;

  this.slides = [];

  this.slideData.forEach(function (slide, i) {
    var image = new Image();

    image.addEventListener('load', function () {
      var texture = new THREE.Texture(image);
      texture.needsUpdate = true;
      var geometry = new THREE.BoxGeometry(160, 120, 0.01);
      var material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity: 0 });

      if (i === 0) {
        material.opacity = 1;
      }

      var mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.y = Math.PI;
      mesh.position.x = 0;
      mesh.position.z = 0;
      mesh.position.y = 60;

      self.slides[i] = mesh;
      self.group.add(mesh);
      console.log(mesh);
    });

    image.src = slide.src;
  });
};

Slides.prototype.setCurrent = function (idx) {
  console.log(idx);
  var oldSlide = this.slides[this.current];
  oldSlide.material.opacity = 0;
  console.log(oldSlide);

  this.current = idx;
  var newSlide = this.slides[this.current];
  newSlide.material.opacity = 1;
};

Slides.prototype.next = function () {
  this.setCurrent(this.current + 1);
};

Slides.prototype.prev = function () {
  this.setCurrent(this.current - 1);
};

Slides.prototype.createSliderExtras = function () {
  var sPos = { x: 0, y: 0, z: 0 };

  var glassMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff, transparent: true, opacity: 0.9 });
  var geometry = new THREE.BoxGeometry(20, 5, 0.5);
  var slider = new THREE.Mesh(geometry, glassMaterial);
  this.scene.add(slider);
};

Slides.prototype.setupControls = function () {
  var self = this;

  window.addEventListener('keydown', function (ev) {
    var TABKEY = 9;
    var ENTERKEY = 13;
    var comma = 188;
    var A = 219;
    var D = 221;

    if (ev.keyCode === TABKEY) {
      self.prev();
    } else if (ev.keyCode === ENTERKEY) {
      console.log('enter');
      self.next();
    } else if (ev.keyCode === comma) {
      debugger;
      self.world.$camera.native.lookAt(new THREE.Vector3(0, 50, 0));
    }
  });
};

var world = new WHS.World(_extends({}, UTILS.$world, {

  camera: {
    far: 10000,
    position: [0, 7, 7]
  },

  plugins: {
    scene: false
  }
}));

var scene = new THREE.Scene();
var material = new THREE.MeshPhongMaterial({ color: UTILS.$colors.mesh });
var materialNested = material.clone();
materialNested.color.set(0x0000ff);
var materialWHS = material.clone();
materialWHS.color.set(0xffffff);
materialWHS.map = new WHS.texture('../../_assets/textures/earth.jpg');

world.importScene(scene, true);
world.make$camera();
world.make$rendering();
world.make$helpers();

var sphere = new WHS.Element(new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), materialWHS), [WHS.MeshComponent]);

sphere.addTo(world);
sphere.position.y = 2;

var light = new WHS.Element(new THREE.PointLight(), [WHS.LightComponent]);

light.wrap();

light.addTo(world);

var slides = new Slides({
  scene: scene,
  world: world
});
slides.load(['slides/1.jpg', 'slides/2.jpg', 'slides/3.jpg']);

UTILS.addPlane(world);
UTILS.addBasicLights(world);

world.setControls(new WHS.OrbitControls());
world.start();

},{"./globals":2}],2:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addAmbient = addAmbient;
exports.addBasicLights = addBasicLights;
exports.addPlane = addPlane;
exports.addBoxPlane = addBoxPlane;
var $world = exports.$world = {
  stats: "fps", // fps, ms, mb or false if not need.
  autoresize: "window",

  gravity: [0, -100, 0],

  camera: {
    position: [0, 10, 50]
  },

  rendering: {
    background: {
      color: 0x162129
    },

    renderer: {
      antialias: true
    }
  },

  shadowmap: {
    type: THREE.PCFSoftShadowMap
  }
};

var $colors = exports.$colors = {
  bg: 0x162129,
  plane: 0x447F8B,
  mesh: 0xF2F2F2,
  softbody: 0x434B7F
};

function addAmbient(world, intensity) {
  new WHS.AmbientLight({
    light: {
      intensity: intensity
    }
  }).addTo(world);
}

function addBasicLights(world) {
  var intensity = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 0.5;
  var position = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [0, 10, 10];
  var distance = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 100;

  addAmbient(world, 1 - intensity);

  return new WHS.PointLight({
    light: {
      intensity: intensity,
      distance: distance
    },

    shadowmap: {
      fov: 90
    },

    position: position
  }).addTo(world);
}

function addPlane(world) {
  var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;

  return new WHS.Plane({
    geometry: {
      width: size,
      height: size
    },

    mass: 0,

    material: {
      color: 0x447F8B,
      kind: 'phong'
    },

    rotation: {
      x: -Math.PI / 2
    }
  }).addTo(world);
}

function addBoxPlane(world) {
  var size = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;

  return new WHS.Box({
    geometry: {
      width: size,
      height: 1,
      depth: size
    },

    mass: 0,

    material: {
      color: 0x447F8B,
      kind: 'phong'
    }
  }).addTo(world);
}

},{}]},{},[1]);
