const consoleElement = document.getElementById('console');
let consoleWidth = consoleElement.clientWidth;
let consoleBaseWidth = consoleElement.clientWidth; 

function resizeConsole() {
    consoleElement.style.width = consoleWidth + 'px';
}

// drag width, snap zero and start

let isDragging = false;
let startX = 0;
let startWidth = 0;

document.getElementById('console-resize').addEventListener('mousedown', function(e) {
    isDragging = true;
    startX = e.pageX;
    startWidth = consoleWidth;
});

document.addEventListener('mousemove', function(e) {
    if (isDragging) {
        consoleWidth = startWidth + e.pageX - (startX+document.body.-consoleBaseWidth);
        console.log(consoleWidth);
        resizeConsole();
    }
});

document.addEventListener('mouseup', function(e) {
    if (isDragging) {
        isDragging = false;
    }
});
