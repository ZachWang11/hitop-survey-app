/********************************************************
 * 1. IMAGE & CANVAS SETUP & DESIGN SCENARIO DETECTION
 ********************************************************/
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');

// Get the scenario number from URL parameters
const urlParams = new URLSearchParams(window.location.search);
let scenarioNumber = parseInt(urlParams.get('scenario'));
if (![1, 2, 3, 4, 5].includes(scenarioNumber)) {
  scenarioNumber = 1;
}
// Set the background image based on the scenario number
const backgroundImagePath = `design${scenarioNumber}.png`;

// Update the document title and scenario title in the HTML
document.title = `Design Scenario ${scenarioNumber}`;
document.getElementById("scenarioTitle").textContent = `Design Scenario ${scenarioNumber}`;

// Define descriptions for each scenario
const descriptions = {
  1: "Scenario 1 features a cantilever beam fixed on the left with a downward point load at the right end.\n\n" + 
     "Please evaluate the design based on your engineering knowledge and experience. " +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, please make sure to click 'Finish Drawing' to record your input.",
  2: "Scenario 2 features a fixed–fixed beam with a central downward load.\n\n" +
     "Please evaluate the design based on your engineering knowledge and experience. " +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, please make sure to click 'Finish Drawing' to record your input.",
  3: "Scenario 3 features a simply-supported beam with a downward load applied at one-third of the span from the left end.\n\n" +
     "Please evaluate the design based on your engineering knowledge and experience. " +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, please make sure to click 'Finish Drawing' to record your input.",
  4: "Scenario 4 features a simply-supported beam subjected to a downward uniform load across the top surface.\n\n" +
     "Please evaluate the design based on your engineering knowledge and experience. " +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, please make sure to click 'Finish Drawing' to record your input.",
  5: "The last design scenario features the same cantilever beam in scenario 1. It's fixed on the left with a downward point load at the right end.\n\n" +
     "Please evaluate the design based on your engineering knowledge and experience. " +
     "If you believe any parts of the structure should be modified, draw around the region of interest " +
     "by clicking, holding, and dragging your mouse. To remove a region, simply click on it and press backspace. " +
     "You may draw multiple regions of interest; all regions will be saved together. " + 
     "When you're satisfied with your edits, please make sure to click 'Finish Drawing' to record your input.",
};

// Set the beam diagram image based on the scenario number
const diagramPath = `Beam_Diagram${scenarioNumber}.png`;
const diagramElement = document.getElementById("beamDiagram");
diagramElement.src = diagramPath;
diagramElement.alt = `Beam diagram for Design Scenario ${scenarioNumber}`;

// Split the description into two parts
const fullDescription = descriptions[scenarioNumber];
const splitIndex = fullDescription.indexOf("Please evaluate"); // this identifies the breakpoint

const introText = fullDescription.slice(0, splitIndex).trim();
const instructionsText = fullDescription.slice(splitIndex).trim();

document.getElementById("scenarioIntro").textContent = introText;
document.getElementById("scenarioInstructions").textContent = instructionsText;

const backgroundImage = new Image();
backgroundImage.src = backgroundImagePath;

// Up to 1000px wide (your future requirement).
const maxWidth = 1000;

// Define the grid size:
const numCols = 240;
const numRows = 80;

// By default, hide the grid. Change to true if you want it shown.
let showGrid = false;

let finalWidth, finalHeight;

backgroundImage.onload = function() {
  const naturalW = backgroundImage.naturalWidth;
  const naturalH = backgroundImage.naturalHeight;

  // Check if the image exceeds the maximum width and height and scale it down if necessary
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
let areasOfInterest = [];

// Track which area is selected (-1 if none)
let selectedIndex = -1;

/********************************************************
 * 3. DRAW EVERYTHING
 ********************************************************/
// This function draws the background image, grid (if enabled), and all areas of interest.
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
// This function draws a grid overlay on the canvas.
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
// This function draws a polygon based on an array of points.
function drawPolygon(points, isSelected = false) {
  if (points.length < 2) return;

  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.closePath();

  // Fill in green or semi-transparent green if selected
  ctx.fillStyle = 'rgba(0, 200, 0, 0.3)';
  ctx.fill();

  // Stroke in yellow if selected, otherwise green
  ctx.strokeStyle = isSelected ? 'yellow' : 'green';
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.stroke();
}

/********************************************************
 * 6. POINT-IN-POLYGON & OVERLAP CHECK
 ********************************************************/
// This function checks if a point is inside a polygon using the ray-casting algorithm.
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

// Check if any edges of two polygons intersect
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

// Check if two line segments intersect
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
// This function computes the indices of cells that are covered by a polygon defined by points.
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
 * 8. DRAWING A NEW AREA OF INTEREST
 ********************************************************/
let isDrawing = false;
let currentPoints = [];

// Helper function to get canvas position from mouse event
function getCanvasPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (evt.clientX - rect.left) * scaleX,
    y: (evt.clientY - rect.top) * scaleY
  };
}

// Hold down the mouse left button: start new area or select existing
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

// Move mouse: draw the area in progress
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

    ctx.fillStyle = 'rgba(0, 200, 0, 0.3)';
    ctx.fill();
    ctx.strokeStyle = 'green';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
});

// Release the mouse left button: finish drawing the area
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
          points: [...currentPoints],
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
 * 9. DELETE AREA (Backspace)
 ********************************************************/
// This event listener allows the user to delete the selected area of interest by pressing Backspace or Delete.
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
// This event listener handles the "Finish Drawing" button click to display the results.
document.getElementById('finishDrawingButton').addEventListener('click', () => {
  updateCellsDisplay(); // Call the function to update the display and save results
});

/********************************************************
 * 11. SAVE RESULTS IN QUALTRICS
 ********************************************************/
// This function displays the number of cells covered by the drawn areas of interest and sends the data to Qualtrics.
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
  const cellDataOnly = areasOfInterest.map(a => a.cells);    // Extract only the cell indices data
  const dataToSave = JSON.stringify(cellDataOnly);           // Convert to JSON string

  window.parent.postMessage({
    type: 'saveToQualtrics',
    scenario: scenarioNumber,
    data: dataToSave
  }, '*');
}
