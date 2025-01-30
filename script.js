// Initialize the canvas
const canvas = new fabric.Canvas('canvas', {
    isDrawingMode: false, // We'll use circles, not freehand drawing
    selection: false
  });
  
  // Load your topology-optimized image (replace URL with your image)
  fabric.Image.fromURL('YOUR_IMAGE_URL_HERE', (img) => {
    img.scaleToWidth(600); // Adjust size as needed
    canvas.add(img);
    canvas.renderAll();
  });
  
  // Let users draw circles
  canvas.on('mouse:up', (e) => {
    if (e.target) return; // Don't trigger if clicking an existing object
  
    // Create a circle where the user clicked
    const circle = new fabric.Circle({
      left: e.pointer.x,
      top: e.pointer.y,
      radius: 0, // Start with radius 0
      fill: 'rgba(255, 0, 0, 0.3)', // Transparent red
      stroke: 'red',
      hasControls: false // Disable resizing handles
    });
  
    // Let the user drag to adjust the circle size
    canvas.add(circle);
    canvas.setActiveObject(circle);
  });

  // Define your grid parameters (adjust based on your HiTop setup)
const GRID_SIZE = {
    cols: 100, // Number of columns in your grid
    rows: 50   // Number of rows
  };
  
  // Image dimensions (must match the image you load)
  const IMAGE_WIDTH = 600; // Same as img.scaleToWidth() above
  const IMAGE_HEIGHT = 400; // Adjust based on your image

function getAffectedGridCells(circle) {
const cells = [];
const centerX = circle.left; // Pixel X of circle center
const centerY = circle.top;  // Pixel Y of circle center
const radius = circle.radius;

// Calculate cell size based on image and grid dimensions
const cellWidth = IMAGE_WIDTH / GRID_SIZE.cols;
const cellHeight = IMAGE_HEIGHT / GRID_SIZE.rows;

// Find all cells within the circle
for (let col = 0; col < GRID_SIZE.cols; col++) {
    for (let row = 0; row < GRID_SIZE.rows; row++) {
    // Calculate cell center coordinates
    const cellCenterX = col * cellWidth + cellWidth / 2;
    const cellCenterY = row * cellHeight + cellHeight / 2;

    // Check if cell center is inside the circle
    const distance = Math.sqrt(
        Math.pow(cellCenterX - centerX, 2) + 
        Math.pow(cellCenterY - centerY, 2)
    );

    if (distance <= radius) {
        cells.push({ col, row }); // Record grid indices
    }
    }
}
return cells;
}

function saveData() {
    const circles = canvas.getObjects('circle');
    const modifications = [];
  
    circles.forEach((circle) => {
      modifications.push({
        center: { x: circle.left, y: circle.top },
        radius: circle.radius,
        cells: getAffectedGridCells(circle)
      });
    });
  
    // Log the data (we'll send this to Qualtrics later)
    console.log(modifications);
    alert('Data saved! Close this window to continue.');
  }