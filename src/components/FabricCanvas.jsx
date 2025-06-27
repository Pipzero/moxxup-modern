// src/components/FabricCanvas.jsx
import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef
} from 'react';
import { Canvas, Rect, Image as FabricImage, Text as FabricText } from 'fabric';

const FabricCanvas = forwardRef(
  (
    {
      activeColor,
      isEditorVisible,
      isNewText,
      updatePlayer,
      isActive,
      onEditorShow,
      onEditorHide
    },
    ref
  ) => {
    const canvasEl = useRef(null);
    const fabricCanvas = useRef(null);

    // Initialize Fabric canvas once
    useEffect(() => {
      if (!canvasEl.current) return;

      const c = new Canvas(canvasEl.current, {
        width: 600,
        height: 400,
        backgroundColor: isActive ? '#ffffff' : 'transparent'
      });
      fabricCanvas.current = c;

      // Selection events to toggle editor UI
      c.on('selection:created', () => onEditorShow?.());
      c.on('selection:updated', () => onEditorShow?.());
      c.on('selection:cleared', () => onEditorHide?.());

      return () => c.dispose();
    }, [isActive, onEditorShow, onEditorHide]);

    // Add new text when flagged
    useEffect(() => {
      const c = fabricCanvas.current;
      if (isNewText != null && c) {
        const txt = new FabricText('New Text', {
          left: 50,
          top: 50,
          fill: activeColor,
          fontSize: 24
        });
        c.add(txt).setActiveObject(txt);
        c.renderAll();
        updatePlayer?.();
        onEditorShow?.();
      }
    }, [isNewText, activeColor, updatePlayer, onEditorShow]);

    // Re-color active object
    useEffect(() => {
      const c = fabricCanvas.current;
      if (c && isEditorVisible) {
        const obj = c.getActiveObject();
        if (obj?.set) {
          obj.set({ fill: activeColor });
          c.renderAll();
          updatePlayer?.();
        }
      }
    }, [activeColor, isEditorVisible, updatePlayer]);

    // Expose imperative methods to parent via ref
    useImperativeHandle(ref, () => ({
      processFiles(files) {
        const c = fabricCanvas.current;
        Array.from(files).forEach((file) => {
          const url = URL.createObjectURL(file);
          FabricImage.fromURL(url, (img) => {
            img.set({ left: 100, top: 100, scaleX: 0.5, scaleY: 0.5 });
            c.add(img).setActiveObject(img);
            c.renderAll();
            updatePlayer?.();
            URL.revokeObjectURL(url);
          });
        });
      },

      downloadCanvas(filename = 'design.png') {
        const c = fabricCanvas.current;
        const dataUrl = c.toDataURL({ format: 'png', multiplier: 2 });
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = filename;
        link.click();
      },

      setImgPreview(imgUrl) {
        // optional: swap in a preview image on a background rect
        const c = fabricCanvas.current;
        FabricImage.fromURL(imgUrl, (img) => {
          img.set({ left: 0, top: 0, selectable: false });
          c.setBackgroundImage(img, c.renderAll.bind(c));
        });
      },

      setTextAngle(angle) {
        const c = fabricCanvas.current;
        const obj = c.getActiveObject();
        if (obj) {
          obj.set({ angle });
          c.renderAll();
          updatePlayer?.();
        }
      },

      removeActiveText() {
        const c = fabricCanvas.current;
        const obj = c.getActiveObject();
        if (obj) {
          c.remove(obj);
          c.discardActiveObject();
          c.renderAll();
          updatePlayer?.();
        }
      }
    }));

    return <canvas ref={canvasEl} />;
  }
);

export default FabricCanvas;
