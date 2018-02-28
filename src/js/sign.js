/* global Promise */

(() => {
  'use strict';

  const canvas = $('.signature-canvas')[0];
  const signaturePad = new SignaturePad(canvas, {});
  
  const resizeCanvas = () => {
    const ratio =  Math.max(window.devicePixelRatio || 1, 1);

    canvas.width = canvas.offsetWidth * ratio;
    canvas.height = canvas.offsetHeight * ratio;
    canvas.getContext("2d").scale(ratio, ratio);

    signaturePad.clear();
  };
  
  const trimCanvas = (canvasToTrim) => {
    let context = canvasToTrim.getContext('2d');

    let imgWidth = canvasToTrim.width;
    let imgHeight = canvasToTrim.height;

    let imgData = context.getImageData(0, 0, imgWidth, imgHeight).data;

    let cropTop = scanY(true, imgWidth, imgHeight, imgData);
    let cropBottom = scanY(false, imgWidth, imgHeight, imgData);
    let cropLeft = scanX(true, imgWidth, imgHeight, imgData);
    let cropRight = scanX(false, imgWidth, imgHeight, imgData);

    let cropXDiff = cropRight - cropLeft;
    let cropYDiff = cropBottom - cropTop;
    
    let trimmedData = context.getImageData(cropLeft, cropTop, cropXDiff, cropYDiff);

    canvasToTrim.width = cropXDiff;
    canvasToTrim.height = cropYDiff;

    context.clearRect(0, 0, cropXDiff, cropYDiff);

    context.putImageData(trimmedData, 0, 0);
    return canvasToTrim;
  };

  const getRGBA = (x, y, imgWidth, imgData) => {
    return {
      red: imgData[(imgWidth * y + x) * 4],
      green: imgData[(imgWidth * y + x) * 4 + 1],
      blue: imgData[(imgWidth * y + x) * 4 + 2],
      alpha: imgData[(imgWidth * y + x) * 4 + 3]
    };
  };

  const getAlpha = (x, y, imgWidth, imgData) => {
    return getRGBA(x, y, imgWidth, imgData).alpha;
  };

  const scanY = (fromTop, imgWidth, imgHeight, imgData) => {
    let offset = fromTop ? 1 : -1;
    let firstCol = fromTop ? 0 : imgHeight - 1;

    for (var y = firstCol; fromTop ? (y < imgHeight) : (y > -1); y += offset) {
      for (var x = 0; x < imgWidth; x++) {
        if (getAlpha(x, y, imgWidth, imgData)) {
          return y            ;            
        }      
      }
    }

    return null;
  };

  const scanX = (fromLeft, imgWidth, imgHeight, imgData) => {
    let offset = fromLeft ? 1 : -1;
    let firstRow = fromLeft ? 0 : imgWidth - 1;

    for (var x = firstRow; fromLeft ? (x < imgWidth) : (x > -1); x += offset) {
      for (var y = 0; y < imgHeight; y++) {
        if (getAlpha(x, y, imgWidth, imgData)) {
          return x;
        }      
      }
    }

    return null;
  };
  
  const copyCanvas = (canvasToCopy) => {
    const croppedCanvas = document.createElement('canvas'),
    croppedCtx    = croppedCanvas.getContext('2d');

    croppedCanvas.width  = canvasToCopy.width;
    croppedCanvas.height = canvasToCopy.height;
    croppedCtx.drawImage(canvasToCopy, 0, 0);
    return croppedCanvas;
  };

  window.onresize = resizeCanvas;
  resizeCanvas();

  $('.clear-btn').click(() => {
    signaturePad.clear();
  });
  
  $('.send-btn').click(() => {
    const signature = trimCanvas(copyCanvas(canvas)).toDataURL();
    const token = $('#token').val();
    $.post(`/signature/sign/${token}`, { signature: signature }, (res) => {
      alert('Allekirjoitus tallennettu');
    });
  });
  
  

})();