const searchParams = new URLSearchParams(window.location.search);
let seed = searchParams.get('seed');

function newSeed() {
    seed = randomSeed();
    searchParams.set('seed', seed);
    const newRelativePathQuery = window.location.pathname + '?' + searchParams.toString();
    history.pushState(null, '', newRelativePathQuery);
    window.location.reload();
}

function randomSeed() {
    let result = '0x';
    const chars = '0123456789abcdef';
    const charsLength = chars.length;
    for (let char = 0; char < 64; char++) {
        result += chars.charAt(Math.floor(Math.random() * charsLength));
    }
    return result;
}

if (seed == undefined) {
    seed = randomSeed();
    window.location.search = '?seed=' + seed;
}



const r = new Random(seed);

// create illo
let illo = new Zdog.Illustration({
    // set canvas with selector
    element: '.zdog-canvas',
    dragRotate: true,
    zoom: 2,
});

function randomPointInSpace(lastPoint) {
    let x, y, z, upperBound = 75;
    if (lastPoint != undefined) {
        upperBound = 25;
    }
    const lowerBound = -1 * upperBound;

    const dx = r.random_int(lowerBound, upperBound);
    const dy = r.random_int(lowerBound, upperBound);
    const dz = r.random_int(lowerBound, upperBound);

    if (lastPoint == undefined) {
        return { x: dx, y: dy, z: dz };
    }
    return {
        x: lastPoint.x + dx,
        y: lastPoint.y + dy,
        z: lastPoint.z + dz,
    };
}

function endpointInBezier(bezier) {
    return bezier[2];
}

function convertBezierArrayToPath(bezierArray) {
    return [
        endpointInBezier(bezierArray[0]),
        ...bezierArray.slice(1).map(b => { return { bezier: b} }),
    ];
}

function randomBezierInSpace(lastPoint) {
    return [
        randomPointInSpace(),
        randomPointInSpace(),
        randomPointInSpace(lastPoint), // endpoint
    ];
}

function toLengthTwo(str) {
    let zerosToAdd = 2 - str.length;
    let newStr = str;
    while (zerosToAdd > 0) {
        newStr = "0" + newStr;
        zerosToAdd--;
    }
    return newStr;
}

function randomColor() {
    const red = toLengthTwo(r.random_int(0, 255).toString(16));
    const green = toLengthTwo(r.random_int(0, 255).toString(16));
    const blue = toLengthTwo(r.random_int(0, 255).toString(16));
    return '#' + red + green + blue;
}

const numArtwork = r.random_int(1, 4);

const artworks = [];
const dynamicPathes = [];
for (let i = 0; i < numArtwork; i++) {
    const numPoints = r.random_int(2, 4);
    const dynamicPath = [
        randomBezierInSpace(),
    ];
    for (let i = 0; i < numPoints - 1; i++) {
        dynamicPath.push(randomBezierInSpace(endpointInBezier(dynamicPath[i])));
    }
    dynamicPathes.push(dynamicPath);
    artworks.push(new Zdog.Shape({
        addTo: illo,
        stroke: 5,
        closed: false,
        color: randomColor(),
        path: convertBezierArrayToPath(dynamicPath),
    }))
}

function animatePath() {
    for (let i = 0; i < numArtwork; i++) {
        const dynamicPath = dynamicPathes[i];
        const artwork = artworks[i];
        dynamicPath.shift();
        dynamicPath.push(randomBezierInSpace());
        artwork.path = convertBezierArrayToPath(dynamicPath);
        artwork.updatePath();
    }
}

function slowDown(func, count) {
    let i = 0;
    return () => {
        i++;
        if (i >= count) {
            func();
            i = 0;
        }
    };
}

const speed = r.random_int(5, 10);
const slowedAnimatedPath = slowDown(animatePath, speed);

function animate() {
    slowedAnimatedPath();
    illo.rotate.y += 0.02;
    illo.updateRenderGraph();
    requestAnimationFrame(animate);
}

animate();
document.getElementsByClassName('zdog-canvas')[0].style.backgroundColor = randomColor();