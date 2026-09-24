const canvas = document.getElementById('webgl-canvas');
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, canvas.clientWidth / canvas.clientHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });

renderer.setSize(canvas.clientWidth, canvas.clientHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// الإضاءة
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xe879f9, 2.5, 60);
pointLight.position.set(6, 8, 6);
scene.add(pointLight);

camera.position.set(0, 3, 7);
controls.target.set(0, 0, 0);
controls.update();

let simulationObjects = [];
let physicsData = { type: 'newton', calculatedValue: 1, scaleFactor: 1 };

function clearScene() {
    simulationObjects.forEach(obj => scene.remove(obj));
    simulationObjects = [];
}

const inputsContainer = document.getElementById('dynamic-inputs');
function updateInputsTemplate(type) {
    inputsContainer.innerHTML = '';
    if (type === 'newton') {
        inputsContainer.innerHTML = `
            <div class="inputs-grid">
                <div class="input-box"><label>القوة F (نيوتن):</label><input type="number" id="val-f" value="10"></div>
                <div class="input-box"><label>الكتلة m (كجم):</label><input type="number" id="val-m" value="2"></div>
            </div>
        `;
    } else if (type === 'ohm') {
        inputsContainer.innerHTML = `
            <div class="inputs-grid">
                <div class="input-box"><label>التيار I (أمبير):</label><input type="number" id="val-i" value="3"></div>
                <div class="input-box"><label>المقاومة R (أوم):</label><input type="number" id="val-r" value="4"></div>
            </div>
        `;
    } else if (type === 'kinetic') {
        inputsContainer.innerHTML = `
            <div class="inputs-grid">
                <div class="input-box"><label>الكتلة m (كجم):</label><input type="number" id="val-mk" value="4"></div>
                <div class="input-box"><label>السرعة v (م/ث):</label><input type="number" id="val-v" value="5"></div>
            </div>
        `;
    }
}

updateInputsTemplate('newton');

document.getElementById('physics-select').addEventListener('change', (e) => {
    updateInputsTemplate(e.target.value);
});

function processPhysicsAndBuild() {
    clearScene();
    const type = document.getElementById('physics-select').value;
    physicsData.type = type;

    if (type === 'newton') {
        let F = parseFloat(document.getElementById('val-f').value) || 1;
        let m = parseFloat(document.getElementById('val-m').value) || 1;
        let a = F / m;

        document.getElementById('calculation-output').innerHTML = 
            `العجلة (a) = F / m = ${F} / ${m} = <b>${a.toFixed(2)} م/ث²</b>`;
        document.getElementById('info-title').innerText = "قانون نيوتن الثاني";
        document.getElementById('info-desc').innerText = `حجم الجسم يعكس الكتلة (${m} كجم)، وسرعة الحركة تعكس العجلة الناتجة (${a.toFixed(2)}).`;

        const size = Math.max(0.5, Math.min(2.5, m * 0.4));
        const geom = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({ color: 0x9f1239, roughness: 0.2, metalness: 0.8 });
        const cube = new THREE.Mesh(geom, mat);
        scene.add(cube);
        simulationObjects.push(cube);
        physicsData.scaleFactor = a;

    } else if (type === 'ohm') {
        let I = parseFloat(document.getElementById('val-i').value) || 1;
        let R = parseFloat(document.getElementById('val-r').value) || 1;
        let V = I * R;

        document.getElementById('calculation-output').innerHTML = 
            `الجهد (V) = I × R = ${I} × ${R} = <b>${V.toFixed(2)} فولت</b>`;
        document.getElementById('info-title').innerText = "قانون أوم (الكهرباء)";
        document.getElementById('info-desc').innerText = `الجهد المحسوب (${V.toFixed(2)}V) يدفع التيار (${I}A) عبر المقاومة (${R}Ω).`;

        const group = new THREE.Group();
        const wireGeom = new THREE.CylinderGeometry(0.1, 0.1, 4, 16);
        const wireMat = new THREE.MeshStandardMaterial({ color: 0x581c87, roughness: 0.5 });
        const wire = new THREE.Mesh(wireGeom, wireMat);
        wire.rotation.z = Math.PI / 2;
        group.add(wire);

        const resRadius = Math.max(0.2, Math.min(0.6, R * 0.1));
        const resistorGeom = new THREE.TorusGeometry(resRadius, 0.08, 16, 32);
        const resistorMat = new THREE.MeshStandardMaterial({ color: 0xbe185d, metalness: 0.8 });
        const resistor = new THREE.Mesh(resistorGeom, resistorMat);
        group.add(resistor);

        const electronsGroup = new THREE.Group();
        for (let i = 0; i < 10; i++) {
            const electronGeom = new THREE.SphereGeometry(0.08, 16, 16);
            const electronMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x38bdf8 });
            const electron = new THREE.Mesh(electronGeom, electronMat);
            electron.position.x = (i - 4.5) * 0.35;
            electronsGroup.add(electron);
        }
        group.add(electronsGroup);
        group.userData = { electrons: electronsGroup, speed: I };

        scene.add(group);
        simulationObjects.push(group);

    } else if (type === 'kinetic') {
        let mk = parseFloat(document.getElementById('val-mk').value) || 1;
        let v = parseFloat(document.getElementById('val-v').value) || 1;
        let KE = 0.5 * mk * Math.pow(v, 2);

        document.getElementById('calculation-output').innerHTML = 
            `طاقة الحركة (KE) = 0.5 · m · v² = <b>${KE.toFixed(2)} جول</b>`;
        document.getElementById('info-title').innerText = "طاقة الحركة (Kinetic Energy)";
        document.getElementById('info-desc').innerText = `الطاقة الناتجة (${KE.toFixed(2)} J) تتأثر بالسرعة بشكل مضاعف (v²).`;

        const geom = new THREE.SphereGeometry(Math.max(0.4, Math.min(1.5, mk * 0.3)), 32, 32);
        const mat = new THREE.MeshStandardMaterial({ color: 0x7e22ce, roughness: 0.2 });
        const sphere = new THREE.Mesh(geom, mat);
        scene.add(sphere);
        simulationObjects.push(sphere);
        physicsData.scaleFactor = v;
    }
}

processPhysicsAndBuild();

document.getElementById('calculate-btn').addEventListener('click', () => {
    processPhysicsAndBuild();
});

let clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    let elapsedTime = clock.getElapsedTime();

    if (physicsData.type === 'newton' && simulationObjects.length > 0) {
        let cube = simulationObjects[0];
        cube.rotation.x = elapsedTime * 0.5;
        cube.position.x = Math.sin(elapsedTime * physicsData.scaleFactor * 0.5) * 1.5;
    } else if (physicsData.type === 'ohm' && simulationObjects.length > 0) {
        let ohmGroup = simulationObjects[0];
        let electrons = ohmGroup.userData.electrons;
        let speedMultiplier = ohmGroup.userData.speed || 1;
        if (electrons) {
            electrons.children.forEach((elec, index) => {
                elec.position.x = (((elapsedTime * speedMultiplier * 0.8 + index * 0.35)) % 4) - 2;
            });
        }
    } else if (physicsData.type === 'kinetic' && simulationObjects.length > 0) {
        let sphere = simulationObjects[0];
        sphere.rotation.y = elapsedTime * 0.5;
        sphere.position.x = Math.sin(elapsedTime * physicsData.scaleFactor * 0.4) * 2;
    }

    controls.update();
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
});
