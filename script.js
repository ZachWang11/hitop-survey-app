/********************************************************
 * 1. IMAGE & CANVAS SETUP & DESIGN SCENARIO DETECTION
 ********************************************************/
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

const urlParams = new URLSearchParams(window.location.search);
let scenarioNumber = parseInt(urlParams.get('scenario'));
if (![1, 2, 3, 4, 5].includes(scenarioNumber)) {
  scenarioNumber = 1;
}
const backgroundImagePath = `design${scenarioNumber}.png`;

document.title = `Design Scenario ${scenarioNumber}`;
document.getElementById("scenarioTitle").textContent = `Design Scenario ${scenarioNumber}`;

const descriptions = {
  1: "Below is the optimized design for an MBB beam (a benchmark problem in topology optimization). " +
     "It represents half of a simply supported beam, with a downward force applied at the center (top-left corner of the right half of the beam). " +
     "Please evaluate the design based on your engineering knowledge and experience.\n\n" +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, click 'Finish Drawing' to continue.",
  2: "This is a cantilever beam fixed on the left with a downward point load at the right end.\n\n" +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, click 'Finish Drawing' to continue.",
  3: "This design represents a fixed–fixed beam with a central downward force.\n\n" +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, click 'Finish Drawing' to continue.",
  4: "This design represents a simply-supported beam with a downward load applied at one-third of the span from the left end.\n\n" +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, click 'Finish Drawing' to continue.",
  5: "This design represents a simply-supported beam subjected to a downward uniform load across the top surface.\n\n" +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, click 'Finish Drawing' to continue.",
};

document.getElementById("scenarioDescription").textContent = descriptions[scenarioNumber];

const backgroundImage = new Image();
backgroundImage.src = backgroundImagePath;

// Up to 1200px wide (your future requirement).
const maxWidth = 1000;

// Grid details (if needed):
const numCols = 240;
const numRows = 80;

// By default, let's hide the grid. Change to true if you want it shown.
let showGrid = false;

let finalWidth, finalHeight;

backgroundImage.onload = function() {
  const naturalW = backgroundImage.naturalWidth;
  const naturalH = backgroundImage.naturalHeight;

  if (naturalW > maxWidth) {
    const scale = maxWidth / naturalW;
    finalWidth = maxWidth;
    finalHeight = naturalH * scale;
  } else {
    finalWidth = naturalW;
    finalHeight = naturalH;
  }

  canvas.width = finalWidth;
  canvas.height = finalHeight;
  
  drawAll();
};

/********************************************************
 * 2. DATA STRUCTURES
 ********************************************************/
// Each "Area of Interest" will be stored as an object:
//  { points: [...], cells: [...] }
let areasOfInterest = []; // Instead of "shapes"

// Track which area is selected (-1 if none)
let selectedIndex = -1;

/********************************************************
 * 3. DRAW EVERYTHING
 ********************************************************/
function drawAll() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

  // Optionally draw grid
  if (showGrid) {
    drawGrid();
  }

  // Draw each area of interest
  areasOfInterest.forEach((area, i) => {
    drawPolygon(area.points, i === selectedIndex);
  });
}

/********************************************************
 * 4. DRAW THE GRID (Optional)
 ********************************************************/
function drawGrid() {
  const cellWidth = canvas.width / numCols;
  const cellHeight = canvas.height / numRows;

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;

  // Vertical lines
  for (let c = 0; c <= numCols; c++) {
    const x = c * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let r = 0; r <= numRows; r++) {
    const y = r * cellHeight;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
}

/********************************************************
 * 5. DRAW A POLYGON
 ********************************************************/
function drawPolygon(points, isSelected = false) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();

  // Fill with semi-transparent white
  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.fill();

  // Outline in white or yellow if selected
  ctx.strokeStyle = isSelected ? 'yellow' : 'white';
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.stroke();
}

/********************************************************
 * 6. POINT-IN-POLYGON & OVERLAP CHECK
 ********************************************************/
function isPointInPolygon(pt, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;

    const intersect = ((yi > pt.y) !== (yj > pt.y)) &&
      (pt.x < (xj - xi) * (pt.y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Check polygons for overlap
function polygonsOverlap(polyA, polyB) {
  if (doEdgesIntersect(polyA, polyB)) return true;
  // Check if a vertex of A is inside B, or vice versa
  if (isPointInPolygon(polyA[0], polyB)) return true;
  if (isPointInPolygon(polyB[0], polyA)) return true;
  return false;
}

function doEdgesIntersect(polyA, polyB) {
  for (let i = 0; i < polyA.length - 1; i++) {
    const a1 = polyA[i];
    const a2 = polyA[i + 1];
    for (let j = 0; j < polyB.length - 1; j++) {
      const b1 = polyB[j];
      const b2 = polyB[j + 1];
      if (segmentsIntersect(a1, a2, b1, b2)) {
        return true;
      }
    }
  }
  return false;
}

function segmentsIntersect(p1, p2, p3, p4) {
  function orientation(a, b, c) {
    const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
    if (val === 0) return 0; 
    return val > 0 ? 1 : 2; // 1=clockwise, 2=counterclockwise
  }
  function onSegment(a, b, c) {
    return Math.min(a.x, c.x) <= b.x && b.x <= Math.max(a.x, c.x) &&
           Math.min(a.y, c.y) <= b.y && b.y <= Math.max(a.y, c.y);
  }

  const o1 = orientation(p1, p2, p3);
  const o2 = orientation(p1, p2, p4);
  const o3 = orientation(p3, p4, p1);
  const o4 = orientation(p3, p4, p2);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSegment(p1, p3, p2)) return true;
  if (o2 === 0 && onSegment(p1, p4, p2)) return true;
  if (o3 === 0 && onSegment(p3, p1, p4)) return true;
  if (o4 === 0 && onSegment(p3, p2, p4)) return true;

  return false;
}

/********************************************************
 * 7. SELECT CELLS COVERED BY A POLYGON
 ********************************************************/
function getSelectedCells(points) {
  const cellIndices = [];
  const cellWidth = canvas.width / numCols;
  const cellHeight = canvas.height / numRows;

  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      const center = {
        x: (c + 0.5) * cellWidth,
        y: (r + 0.5) * cellHeight
      };
      if (isPointInPolygon(center, points)) {
        cellIndices.push(r * numCols + c);
      }
    }
  }
  return cellIndices;
}

/********************************************************
 * 8. DRAWING A NEW AREA OF INTEREST (MOUSE)
 ********************************************************/
let isDrawing = false;
let currentPoints = [];

function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY
  };
}

// MOUSE DOWN: start new area or select existing
canvas.addEventListener('mousedown', (evt) => {
  if (!isDrawing) {
    const clickPos = getCanvasPos(evt);

    // Check if we clicked an existing area (topmost first)
    let foundIndex = -1;
    for (let i = areasOfInterest.length - 1; i >= 0; i--) {
      if (isPointInPolygon(clickPos, areasOfInterest[i].points)) {
        foundIndex = i;
        break;
      }
    }
    if (foundIndex !== -1) {
      // select that area
      selectedIndex = foundIndex;
      drawAll();
    } else {
      // start drawing a new area
      isDrawing = true;
      selectedIndex = -1;
      currentPoints = [ clickPos ];
    }
  }
});

canvas.addEventListener('mousemove', (evt) => {
  if (!isDrawing) return;

  currentPoints.push(getCanvasPos(evt));

  drawAll(); // draw existing areas

  // show the new area in progress
  if (currentPoints.length > 1) {
    ctx.beginPath();
    ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
    for (let i = 1; i < currentPoints.length; i++) {
      ctx.lineTo(currentPoints[i].x, currentPoints[i].y);
    }
    ctx.lineTo(currentPoints[0].x, currentPoints[0].y);
    ctx.closePath();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
});

canvas.addEventListener('mouseup', () => {
  if (isDrawing) {
    if (currentPoints.length > 2) {
      // close polygon
      currentPoints.push(currentPoints[0]);

      // check overlap
      let overlaps = false;
      for (const aoI of areasOfInterest) {
        if (polygonsOverlap(currentPoints, aoI.points)) {
          overlaps = true;
          break;
        }
      }

      if (overlaps) {
        alert("New Region of Interest overlaps an existing one. Discarding it.");
      } else {
        // compute selected cells
        const cellIndices = getSelectedCells(currentPoints);

        // store
        areasOfInterest.push({
          points: currentPoints,
          cells: cellIndices
        });
      }
    }
    isDrawing = false;
    currentPoints = [];
    drawAll();
    // NOTE: We do NOT show results yet; user must click "Finish Drawing"
  }
});

/********************************************************
 * 9. DELETE AREA (Backspace/Delete)
 ********************************************************/
document.addEventListener('keydown', (evt) => {
  if (evt.key === 'Backspace' || evt.key === 'Delete') {
    evt.preventDefault();
    if (selectedIndex !== -1) {
      areasOfInterest.splice(selectedIndex, 1);
      selectedIndex = -1;
      drawAll();
      // Still no auto-display of cells
    }
  }
});

/********************************************************
 * 10. FINISH DRAWING BUTTON => DISPLAY RESULTS
 ********************************************************/
document.getElementById('finishDrawingButton').addEventListener('click', () => {
  updateCellsDisplay(); // Only now do we show the results
});

/********************************************************
 * 11. SAVE RESULTS IN QUALTRICS
 ********************************************************/
function updateCellsDisplay() {
  const outputEl = document.getElementById('output');

  if (areasOfInterest.length === 0) {
    outputEl.textContent = "No Areas of Interest created yet.";
    return;
  }

  let msg = '';
  areasOfInterest.forEach((area, i) => {
    msg += `Region of Interest ${i + 1} has ${area.cells.length} elements\n`;
  });

  outputEl.textContent = msg;

  // Send to Qualtrics
  const cellDataOnly = areasOfInterest.map(a => a.cells);
  const dataToSave = JSON.stringify(cellDataOnly);

  window.parent.postMessage({
    type: 'saveToQualtrics',
    data: dataToSave
  }, '*');
}
