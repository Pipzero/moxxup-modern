import React, {
  useRef,
  useEffect,
  useImperativeHandle,
  forwardRef
} from 'react';

import { Canvas, Image, Textbox } from 'fabric';



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

    useEffect(() => {
      if (!canvasEl.current) return;

      const c = new Canvas(canvasEl.current, {
        width: 600,
        height: 400,
        backgroundColor: isActive ? '#ffffff' : 'transparent'
      });

      fabricCanvas.current = c;

      c.on('selection:created', () => onEditorShow?.());
      c.on('selection:updated', () => onEditorShow?.());
      c.on('selection:cleared', () => onEditorHide?.());

      return () => c.dispose();
    }, [isActive, onEditorShow, onEditorHide]);

    useEffect(() => {
      const c = fabricCanvas.current;
      if (isNewText != null && c) {
        const txt = new Textbox('New Text', {
          left: 50,
          top: 50,
          fill: activeColor,
          fontSize: 24,
          width: 200
        });
        c.add(txt).setActiveObject(txt);
        c.renderAll();
        updatePlayer?.();
        onEditorShow?.();
      }
    }, [isNewText, activeColor, updatePlayer, onEditorShow]);

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

    useImperativeHandle(ref, () => ({
      processFiles(files) {
        const c = fabricCanvas.current;
        Array.from(files).forEach((file) => {
          const url = URL.createObjectURL(file);
          Image.fromURL(url, (img) => {
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
        const c = fabricCanvas.current;
        Image.fromURL(imgUrl, (img) => {
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