console.clear();
let distance = 0;
let isWatching = true;
let pos = {
    x: -1,
    y: -1
};
let prev_pos = {
    x: 0,
    y: 0
};
let distanceSinceWatching = 0;
const elDistance = document.querySelector('.distance .total');
const elStart = document.querySelector('.start');
const elHowTo = document.querySelector('.howto');
const elGame = document.querySelector('.game');
const elContainer = document.querySelector('.container');
const elTime = document.querySelector('.timer .time');
const elMovement = document.querySelector('.movement');
const elReplay1 = document.querySelector('.replay1');
const elReplay2 = document.querySelector('.replay2');
const elDead = document.querySelector('.dead');
const elWin = document.querySelector('.win');
const audioDoll = new Audio('sounds/squid-game-sound.mp3');
const audioDollDuration = 5.433469;
const shotGun = new Audio('sounds/shotgun.mp3');
shotGun.volume = 0.2;
const sigh = new Audio('sounds/sigh.mp3');

const MAX_TIME = 60;
const FINISH_DISTANCE = 100;
const IN_GAME_MAX_DISTANCE = 4000;
const MAX_MOVEMENT = 180;

let playing = false;

var mycamvas;

function init() {

    var initialized = false;
    if (initialized) return;
    var update_memory = pico.instantiate_detection_memory(5);
    var facefinder_classify_region = function(r, c, s, pixels, ldim) {
        return -1.0;
    };
    var cascadeurl = "https://raw.githubusercontent.com/nenadmarkus/pico/c2e81f9d23cc11d1a612fd21e4f9de0921a5d0d9/rnt/cascades/facefinder";
    fetch(cascadeurl).then(function(response) {
        response.arrayBuffer().then(function(buffer) {
            var bytes = new Int8Array(buffer);
            facefinder_classify_region = pico.unpack_cascade(bytes);
            console.log("* cascade loaded");
        });
    });

    var ctx = document.querySelector(".webcam").getContext("2d");
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#d7327a";

    function rgba_to_grayscale(rgba, nrows, ncols) {
        var gray = new Uint8Array(nrows * ncols);
        for (var r = 0; r < nrows; ++r)
            for (var c = 0; c < ncols; ++c)
                gray[r * ncols + c] =
                (2 * rgba[r * 4 * ncols + 4 * c + 0] +
                    7 * rgba[r * 4 * ncols + 4 * c + 1] +
                    1 * rgba[r * 4 * ncols + 4 * c + 2]) /
                10;
        return gray;
    }
    var processfn = function(video, dt) {
        ctx.drawImage(video, 0, 0);
        var rgba = ctx.getImageData(0, 0, 640, 480).data;
        image = {
            pixels: rgba_to_grayscale(rgba, 480, 640),
            nrows: 480,
            ncols: 640,
            ldim: 640
        };
        params = {
            shiftfactor: 0.1,
            minsize: 100,
            maxsize: 1000,
            scalefactor: 1.1
        };
        dets = pico.run_cascade(image, facefinder_classify_region, params);
        dets = update_memory(dets);
        dets = pico.cluster_detections(dets, 0.2);
        if (dets.length) {
            const det = dets[0];
            if (det[3] > 50.0) {
                prev_pos.x = pos.x;
                prev_pos.y = pos.y;
                pos.x = det[1];
                pos.y = det[0];
                let _dist = Math.hypot(pos.x - prev_pos.x, pos.y - prev_pos.y);
                if (prev_pos.x === -1) {
                    _dist = 0;
                }
                if (!isWatching) {
                    distance += _dist;
                    if (distance > IN_GAME_MAX_DISTANCE) {
                        reachedEnd();
                    }
                } else {
                    distanceSinceWatching += _dist;
                    if (distanceSinceWatching > MAX_MOVEMENT) {
                        dead();
                    }
                }
                let formattedDistance = '' + Math.round((distance / IN_GAME_MAX_DISTANCE) * FINISH_DISTANCE);
                if (formattedDistance.length === 1) {
                    formattedDistance = '00' + formattedDistance;
                } else if (formattedDistance.length == 2) {
                    formattedDistance = '0' + formattedDistance;
                }
                elDistance.innerHTML = formattedDistance;
                let movingDistance = Math.floor(distanceSinceWatching / MAX_MOVEMENT * 100);
                movingDistance = '' + Math.min(100, movingDistance);
                if (movingDistance.length === 1) {
                    movingDistance = '0' + movingDistance;
                }
                elMovement.innerHTML = `${movingDistance}%`;


                ctx.beginPath();
                ctx.arc(det[1], det[0], det[2] / 2, 0, 2 * Math.PI, false);
                ctx.stroke();
            }
        }
        updateTimer(MAX_TIME - (Date.now() - mycamvas.startTime) / 1000);

        if ((Date.now() - mycamvas.startTime) / 1000 > MAX_TIME) {
            timeOut();
        }

    };
    mycamvas = new camvas(ctx, processfn, () => {
        playing = true;
        updateWatching();
    });
    initialized = true;
}

elStart.addEventListener('click', () => {
    init();

    elContainer.classList.add('is-playing');
    elHowTo.classList.remove('is-visible');
});

function reachedEnd() {
    watchingTween.kill();
    sigh.currentTime = 0;
    sigh.play();
    audioDoll.pause();
    mycamvas.stop();
    playing = false;
    elWin.classList.add('is-visible');
    elContainer.classList.remove('is-playing');
}

function timeOut() {
    watchingTween.kill();
    audioDoll.pause();
    shotGun.currentTime = 0;
    shotGun.play();
    mycamvas.stop();
    playing = false;
    elDead.classList.add('is-visible');
    elContainer.classList.remove('is-playing');
}

function dead() {
    watchingTween.kill();
    audioDoll.pause();
    shotGun.currentTime = 0;
    shotGun.play();
    mycamvas.stop();
    playing = false;
    elDead.classList.add('is-visible');
    elContainer.classList.remove('is-playing');
}

let watchingTween = null;

function updateWatching() {
    if (!playing) return;

    isWatching = !isWatching;

    let duration = Math.random() * 3.5 + 2.5;
    if (isWatching) {
        duration = Math.random() * 2 + 2;
    }
    if (!isWatching) {
        audioDoll.currentTime = 0;
        audioDoll.playbackRate = (audioDollDuration - 0.5) / duration;
        audioDoll.play();
    }
    gsap.to(head.rotation, {
        y: isWatching ? 0 : -Math.PI,
        duration: 0.4
    });
    watchingTween = gsap.to({}, {
        duration: duration,
        onComplete: updateWatching
    });

    if (!isWatching) {
        distanceSinceWatching = 0;
    }
}

function updateTimer(timeLeft) {
    let min = '' + Math.floor(timeLeft / 60);
    if (min.length === 1) {
        min = '0' + min;
    }
    let sec = '' + Math.floor(timeLeft % 60);
    if (sec.length === 1) {
        sec = '0' + sec;
    }
    if (timeLeft < 0) {
        min = '00';
        sec = '00';
    }
    elTime.innerHTML = `${min}:${sec}`;
}

const scene = new THREE.Scene();
let sceneWidth = 0;
if (window.innerWidth / window.innerHeight > 1.9) {
    sceneWidth = window.innerWidth * 0.6;
} else {
    sceneWidth = window.innerWidth * 0.95;
}
let sceneHeight = sceneWidth / 2;
const camera = new THREE.PerspectiveCamera(75, sceneWidth / sceneHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
renderer.setSize(sceneWidth, sceneHeight);
elGame.appendChild(renderer.domElement);

camera.position.y = 2.8;
camera.position.z = 11;

const light = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
scene.add(light);
const light2 = new THREE.AmbientLight(0x404040, 1.2);
scene.add(light2);
const spotLight = new THREE.SpotLight(0xffffff);
spotLight.position.set(100, 1000, 100);
scene.add(spotLight);

let head = new THREE.Group();
scene.add(head);
const loader = new THREE.GLTFLoader();
loader.load(
    'models/squid-game-doll/Squid_game_doll.gltf',
    function(gltf) {
        scene.add(gltf.scene);
        head.add(gltf.scene.children[0].children[0].children[0].children[1]);
        head.add(gltf.scene.children[0].children[0].children[0].children[1]);
        head.add(gltf.scene.children[0].children[0].children[0].children[2]);
        head.children[0].position.y = -8;
        head.children[1].position.y = -8;
        head.children[2].position.y = -8;
        head.children[0].position.z = 1;
        head.children[1].position.z = 1;
        head.children[2].position.z = 1;
        head.children[0].scale.setScalar(1);
        head.children[1].scale.setScalar(1);
        head.children[2].scale.setScalar(1);
        head.position.y = 8;
        head.position.z = -1;

        elStart.classList.add('is-ready');
    },
    function(xhr) {
        console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    },
    function(error) {
        console.log('An error happened', error);
    }
);

renderer.setAnimationLoop(renderWebGL);

function renderWebGL() {
    renderer.render(scene, camera);
}

function onWindowResize() {
    if (window.innerWidth / window.innerHeight > 1.9) {
        sceneWidth = window.innerWidth * 0.6;
    } else {
        sceneWidth = window.innerWidth * 0.95;
    }
    sceneHeight = sceneWidth / 2;
    camera.aspect = sceneWidth / sceneHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(sceneWidth, sceneHeight);
}
window.addEventListener('resize', onWindowResize, false);
onWindowResize();

function replay() {
    elContainer.classList.add('is-playing');
    elDead.classList.remove('is-visible');
    elWin.classList.remove('is-visible');
    distance = 0;
    isWatching = true;
    distanceSinceWatching = 0;
    playing = true;
    updateWatching();
    mycamvas.startTime = Date.now();
    mycamvas.play();
}
elReplay1.addEventListener('click', () => {
    replay();
});
elReplay2.addEventListener('click', () => {
    replay();
});