import * as UTILS from './globals';



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

    data.push( { src: '../slides/' + n + '.jpg' } );
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
    }
    else if (ev.keyCode === ENTERKEY) {
      console.log('enter');
      self.next();
    } else if (ev.keyCode === comma) {
      debugger
      self.world.$camera.native.lookAt(new THREE.Vector3(0, 50, 0));
    }


  });
};



const world = new WHS.World({
  ...UTILS.$world,

  camera: {
    far: 10000,
    position: [0, 7, 7]
  },

  plugins: {
    scene: false
  }
});

const scene = new THREE.Scene();
const material = new THREE.MeshPhongMaterial({color: UTILS.$colors.mesh});
const materialNested = material.clone();
materialNested.color.set(0x0000ff);
const materialWHS = material.clone();
materialWHS.color.set(0xffffff);
materialWHS.map = new WHS.texture('{{ assets }}/textures/earth.jpg');



world.importScene(scene, true);
world.make$camera();
world.make$rendering();
world.make$helpers();

const sphere = new WHS.Element(
  new THREE.Mesh(
    new THREE.SphereGeometry(1, 32, 32),
    materialWHS
  ),
  [WHS.MeshComponent]
);

sphere.addTo(world);
sphere.position.y = 2;

const light = new WHS.Element(
  new THREE.PointLight(),
  [WHS.LightComponent]
);

light.wrap();

light.addTo(world);


var slides = new Slides({
  scene: scene,
  world: world,
});
slides.load(['slides/1.jpg', 'slides/2.jpg', 'slides/3.jpg']);


UTILS.addPlane(world);
UTILS.addBasicLights(world);

world.setControls(new WHS.OrbitControls());
world.start();
