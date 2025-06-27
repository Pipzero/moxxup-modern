import React, {Component} from 'react';
import { GithubPicker } from 'react-colorful';
import FontPicker from 'font-face-observer';
import _ from 'lodash';

import CONSTANTS from '../constants';
import backgroundImage from "../static/panel-front-uv.png";
import {colorToComplementary} from "../util/color";

const FontFaceObserver = require('font-face-observer');

const colorList = [];
_.forOwn(CONSTANTS.MATERIAL_COLORS, (value, key) => {
    _.forOwn(CONSTANTS.MATERIAL_COLORS[key], (value, key) => {
        if (!key.includes('a')) colorList.push(value);
    });
});

let canvasSize = 1024;
let canvasBounds = { width: canvasSize, height: canvasSize};

// let initialDragPosition = { x: 0, y: 0 };

const commonTextConfig = {
    hoverCursor: 'pointer',
    textAlign: 'center',
    fontFamily: 'Roboto',
    fontWeight: 700,
    charSpacing: -15,
    cornerColor: '#e6edf2',
    cornerSize: 12,
    cornerStyle: 'circle',
    transparentCorners: false,
    hasRotatingPoint: true,
    borderColor: 'black',
    flipX: true,
    originX: "center",
    originY: "center"
};

class FabricCanvas extends Component {
    state = {
        isPickerVisible: false,
        activeColor: '#000',
        currentText: this.props.isFront ? 'Hi!' : 'Bye',
        fontFamily: 'Roboto',
        firstOpen: true
    };

    textArray = [];
    printableAreaBounds = { width: 360, height: 360 * 16 / 12, left: 512, top: this.props.isFront ? 536 : 512 };

    // constructor(props) {
    //     super(props);
    //     // if (props) {
    //     //     canvasSize = props.canvasWidth;
    //     //     printableArea = { width: canvasSize, height: canvasSize};
    //     // }
    // }

    buffer = document.createElement('canvas');
    componentDidMount() {
        this.buffer.width = canvasBounds.width;
        this.buffer.height = canvasBounds.height;

        const { currentText } = this.state;

        const icon = new Image();
        icon.onload = () => {

            /**
             * hide all controls except for rotation (mtr)
             */
            window.fabric.Object.prototype.setControlsVisibility({
                tl: false, //top-left
                mt: false, // middle-top
                tr: true, //top-right
                ml: false, //middle-left
                mr: false, //middle-right
                bl: false, // bottom-left
                mb: false, //middle-bottom
                br: true, //bottom-right
                mtr: false
            })

            //override _drawControl function to change the corner images
            window.fabric.Object.prototype._drawControl = function(control, ctx, methodName, x, y) {
                /**
                 * draw font awesome icons
                 * https://stackoverflow.com/questions/35570801/how-to-draw-font-awesome-icons-onto-html-canvas-version-5
                 *
                 * overriding controls
                 * https://stackoverflow.com/questions/35630508/add-delete-button-on-element-in-canvas-fabric-js/35684847#35684847
                 */
                if (this.isControlVisible(control)) {
                    const dx = x - 18;
                    const dy = y - 18;
                    const dWidth = 48;
                    const dHeight = 48;
                    const sx = control === "tr" ? 500 : 0; // mtr or br
                    const sy = 0;
                    const sWidth = icon.naturalHeight;
                    const sHeight = icon.naturalHeight;
                    ctx.drawImage(icon, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight)
                }
            };
            //end

            this.canvas = new window.fabric.Canvas(this.props.isFront ? 'front-c' : 'back-c', {
                enableRetinaScaling: false
            });
            /**
             * don't bring the active object to front like the printful does
             */
            this.canvas.preserveObjectStacking = true;

            /**
             * preload the font for rendering the text
             */
            const observer = new FontFaceObserver('Roboto');
            observer.check().then(() => {

                /**
                 * canvas config
                 */
                this.canvas.setHeight(canvasSize);
                this.canvas.setWidth(canvasSize);
                this.canvas.setBackgroundColor(this.props.activeColor);

                // default text 1
                this.textArray[0] = new window.fabric.Text(this.props.isFront ? 'FRONT' : 'BACK', {
                    id: new Date().valueOf(),
                    fontSize: 16 * canvasSize / 256,
                    ...commonTextConfig
                });
                this.textArray[0].left = this.canvas.width / 2;
                this.textArray[0].top = this.canvas.height / 3;
                this.textArray[0].setColor('#6089a0');

                // default text 2
                this.textArray[1] = new window.fabric.Text(currentText, {
                    id: new Date().valueOf(),
                    fontSize: 36 * canvasSize / 256,
                    ...commonTextConfig
                });
                // todo: coords should come from the uv picked from a raycasting intersection
                this.textArray[1].left = this.canvas.width / 2;
                this.textArray[1].top = this.canvas.height / 2;
                this.textArray[1].setColor('crimson');

                this.canvas.add(this.textArray[0]);
                this.canvas.add(this.textArray[1]);

                this.activeText.set("fontFamily", 'Roboto');

                this.canvas.requestRenderAll();
            }, () => console.log('Font is not available'));

            // don't check bounds for first render
            // this.checkBounds(this.textArray[0]);
            // this.checkBounds(this.textArray[1]);

            document.addEventListener('scroll', this.handleSpacingScroll);
            document.addEventListener('wheel', this.handleSpacingScroll);

            document.addEventListener('scroll', this.handleSizeScroll);
            document.addEventListener('wheel', this.handleSizeScroll);
        }
        icon.onerror = function() {
            console.log('error loading icon')
        };
        icon.src = "/controls_02.svg";
    }

    componentDidUpdate(prevProps) {
        if (prevProps.activeColor !== this.props.activeColor) {
            this.canvas.setBackgroundColor(this.props.activeColor);
            this.renderAll();
        }
        if (this.props.isActive && this.props.isNewText && this.props.isNewText !== prevProps.isNewText) {

            this.canvas.discardActiveObject();
            this.currTextIndex = -1;

            /**
             * todo: prevent adding duplicated text
             */

            // add new text with properties
            const newText = new window.fabric.Text('TEXT', {
                id: new Date().valueOf(),
                top: this.canvas.height / 2,
                fontSize: 36 * canvasSize / 256,
                ...commonTextConfig
            });
            newText.set({
                left: this.canvas.width / 2 + newText.width / 2
            });
            // newText.setColor(colorToComplementary(activeColor));
            newText.setColor("black");

            /**
             * add to canvas
             */
            this.textArray.push(newText);
            this.canvas.add(newText);
            this.activeText = newText;

            /**
             * activate new text
             */
            this.currTextIndex = this.textArray.length - 1; // last item
            this.canvas.setActiveObject(this.canvas.item(this.currTextIndex));
            const activeObj = this.canvas.getActiveObject();
            /**
             * centering new text before sending to player
             */
            activeObj.left = activeObj.left - activeObj.width / 2;

            this.renderAll();

            // update editor state
            // this.setState({
            //     fontFamily: text.fontFamily,
            //     activeColor: text.fill,
            //     isRemoveBtnVisible: false
            // });
            //
            // this.checkBounds(text);
        }
    }

    /**
     * prepare image blob
     */
    dataURLtoBlob(dataurl) {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], {type:mime});
    }

    downloadCanvas = () => {
        /**
         * render canvas without selection
         */
        this.canvas.discardActiveObject();
        this.canvas.renderAll();

        const ctx = this.canvas.getContext("2d");
        /**
         * create helper canvas
         */
        if (!this.downloadBuffer) {
            this.downloadBuffer = document.createElement('canvas');
        }
        this.downloadBuffer.width = this.printableAreaBounds.width;
        this.downloadBuffer.height = this.printableAreaBounds.height;
        const bufferCtx = this.downloadBuffer.getContext("2d");
        /**
         * flipX canvas for download
         */
        bufferCtx.scale(-1,1);

        // 330 and 241 are magic numbers for the left and top offsets of the printable area.
        // they were manually calculated and need improvement in the future
        bufferCtx.drawImage(ctx.canvas, -ctx.canvas.width + 330, 241 - this.printableAreaBounds.top);
        const imgData = this.downloadBuffer.toDataURL({ format: 'png' });
        /**
         * convert image to blob
         */
        let blob = this.dataURLtoBlob(imgData);
        /**
         * trigger download
         */
        const link = document.createElement("a");
        link.download = "preview.png";
        link.href = URL.createObjectURL(blob);
        link.click();
    }

    handleSizeScroll = e => {
        if (this.fontSizeInput && this.fontSizeInput.checked) {
            const dir =  (e.detail < 0) ? 1 : ((e.wheelDelta > 0) ? 1 : -1);
            this.changeProp('fontSize', dir);
            e.preventDefault();
        }
    };

    handleSpacingScroll = e => {
        if (this.charSpacingInput && this.charSpacingInput.checked) {
            const dir =  (e.detail < 0) ? 1 : ((e.wheelDelta > 0) ? 1 : -1);
            this.changeProp('charSpacing', dir * 10);
            e.preventDefault();
        }
    };

    handleUnCheckCharSpacing = () => this.charSpacingInput.checked = false;

    handleUnCheckFontSize = () => this.fontSizeInput.checked = false;

    handleTogglePicker = () => this.setState({ isPickerVisible: true });

    handleColorChange = activeColor =>
        this.setState({
            activeColor,
            isPickerVisible: false
        }, () => this.setColor(activeColor));

    handleHideColorPicker = () => this.setState({ isPickerVisible: false });

    handleFontChange = fontFamily =>
        this.setState({
            fontFamily
        }, () => this.setProp('fontFamily', fontFamily));

    addTextBreaks = (text, width = canvasSize, fontSize = 33) => {
        // text = text.trim();

        //get existing lines before breaking:
        let lines = text.toString().split('\n'),
            newString = '';

        //for each line, get width of all words
        for (let line = 0; line < lines.length; line++) {
            let words = lines[line].toString().split(' '),
                canvas = document.createElement('canvas'),
                context = canvas.getContext('2d'),
                idx = 2;
            context.font = fontSize + 'px Lato';
            while (words.length > 0 && idx <= words.length) {
                let str = words.slice(0, idx).join(' '),
                    w = context.measureText(str).width;
                if (w > width) {
                    newString += words.slice(0, idx - 1).join(' ');
                    newString += "\n";
                    words = words.splice(idx - 1);
                    idx = 1;
                }
                else {
                    idx += 1;
                }
            }
            newString += words.join(' ');

            // add user linebreaks
            if (line < lines.length - 1) newString += '\n';
        }
        return newString;
    };

    // check if any of coords are out of bounds
    checkBounds = (txt, delta = { x: 0, y: 0 }) => {
        const coords = txt.aCoords;

        // check each corner coords: tl, tr, bl, br
        const corners = ['tl','tr','bl','br'];

        let outOfBoundsArray = [];

        const areaMinX = (canvasSize - canvasBounds.width) / 2;
        const areaMaxX = (canvasSize + canvasBounds.width) / 2;
        const areaMinY = (canvasSize - canvasBounds.height) / 2;
        const areaMaxY = (canvasSize + canvasBounds.height) / 2;

        corners.forEach(c => {
            // negative values occur if x or y are out left or top
            if (coords[c].x - delta.x < areaMinX) {
                outOfBoundsArray.push(Math.abs(coords[c].x - delta.x - areaMinX));
            }
            if (coords[c].y - delta.y < areaMinY) {
                outOfBoundsArray.push(Math.abs(coords[c].y - delta.y - areaMinY));
            }
            // positive out of bounds occur if x or y is greater than canvas size
            if (coords[c].x - delta.x > areaMaxX) {
                outOfBoundsArray.push(coords[c].x - delta.x - areaMaxX);
            }
            if (coords[c].y - delta.y > areaMaxY) {
                outOfBoundsArray.push(coords[c].y - delta.y - areaMaxY);
            }
        });

        const maxOutOfBoundsValue = outOfBoundsArray.length && parseInt(Math.max(...outOfBoundsArray), 10);
        const outOfBoundsLettersCount = Math.ceil(maxOutOfBoundsValue / 10);
        const outOfBoundsString = new Array(outOfBoundsLettersCount + 1).join('a');

        return this.props.onOutOfBounds(outOfBoundsString);
    };

    setProp = (propName, propValue) => {
        if (propName === 'fontFamily') {
            const observer = new FontFaceObserver(propValue);
            observer.check().then(() => {
                this.activeText.set("fontFamily", propValue);
                this.renderAll();
            }, () => console.log('Font is not available'));
        } else {
            this.activeText[propName] = propValue;
            this.renderAll();

            this.checkBounds(this.activeText);
        }
    };

    toggleProp = (propName, propValue1, propValue2) => {
        if (this.activeText[propName] === propValue1) {
            this.setProp(propName, propValue2)
        } else {
            this.setProp(propName, propValue1)
        }
    };

    changeProp = (propName, propChange) => this.setProp(propName, this.activeText[propName] + propChange);

    setColor = (color) => {
        this.activeText.setColor(color);
        this.renderAll();
    };

    renderAll = (shouldDiscardSelection = false) => {
        this.canvas.renderAll();
        this.props.updatePlayer({shouldDiscardSelection});
    }

    currTextIndex = 1;
    setImgPreview = ({x = 0, y = 0, textIndex = -1, shouldDiscardSelection = false, isMoved = false, shouldScaleUp}) => {
        /**
         * if text is not in motion now, update selected text index
         */
        if (!isMoved) {
            this.currTextIndex = textIndex === -1 ? this.currTextIndex : textIndex;
        }
        /**
         * convert xy coords of the player to the canvas texture coords
         */
        if (x) {
            this.textArray[this.currTextIndex].left = this.textArray[this.currTextIndex].left + this.canvas.width * x;
        }
        if (y) {
            this.textArray[this.currTextIndex].top = this.textArray[this.currTextIndex].top - this.canvas.height * y;
        }
        /**
         * clear or keep selection
         */
        if (shouldDiscardSelection) {
            this.canvas.discardActiveObject();
            this.props.onEditorHide();
            this.handleHideColorPicker();
        } else {
            if (this.props.isActive) {
                this.canvas.setActiveObject(this.canvas.item(this.currTextIndex));
                const activeObj = this.canvas.getActiveObject();

                if (shouldScaleUp === true) {
                    activeObj.set({
                        scaleX: activeObj.scaleX * 1.1,
                        scaleY: activeObj.scaleY * 1.1
                    });
                }
                if (shouldScaleUp === false) {
                    activeObj.set({
                        scaleX: activeObj.scaleX * .9,
                        scaleY: activeObj.scaleY * .9
                    });
                }
                /**
                 * hide editor in case there is no text object selected
                 * - text is distinguished from image object by the textLine prop
                 */
                if (activeObj && activeObj.textLines) {
                    this.activeText = this.textArray[this.currTextIndex];
                    // update editor state
                    this.setState({
                        fontFamily: this.activeText.fontFamily,
                        activeColor: this.activeText.fill,
                    });

                    this.fontWeightInput.checked = this.activeText.fontWeight === 700;
                    this.fontStyleInput.checked = this.activeText.fontStyle === 'italic';
                    this.textAlignLeft.checked = this.activeText.textAlign === 'left';
                    this.textAlignCenter.checked = this.activeText.textAlign === 'center';
                    this.textAlignRight.checked = this.activeText.textAlign === 'right';

                    if (this.state.firstOpen) {
                        this.setState({ firstOpen: false, });
                    } else {
                        this.props.onEditorShow();
                    }
                } else {
                    this.props.onEditorHide();
                }
            }
        }
        /**
         * take active object coords
         */
        const activeObj = this.canvas.getActiveObject();
        /**
         * render canvas with or without printable 12x16
         */
        if (activeObj) {
            // set border with complimentary color to the current background
            const square = new window.fabric.Rect({
                width: this.printableAreaBounds.width,
                height: this.printableAreaBounds.height,
                left: this.printableAreaBounds.left,
                top: this.printableAreaBounds.top,
                fill: 'rgba(0,0,0,0)',
                stroke: colorToComplementary(this.props.activeColor),
                strokeDashArray: [5, 5],
                originX: "center",
                originY: "center",
                flipX: true,
                selectable: false
            });
            // removed dashed bounds
            //this.canvas.add(square);
            this.canvas.renderAll();
            // remove border after show up
            this.canvas.remove(square);
        } else {
            this.canvas.renderAll();
        }


        /**
         * generate front image
         */
        const ctx = this.canvas.getContext("2d");
        const printableAreaImage = ctx.getImageData(0, 0, canvasBounds.width, canvasBounds.height);
        const bufferCtx = this.buffer.getContext("2d");
        bufferCtx.putImageData(printableAreaImage, 0, 0);
        const imageWithText = this.buffer.toDataURL({ format: 'png' });
        /**
         * generate solid color texture for sleeves & back
         */
        bufferCtx.fillStyle = this.props.activeColor;
        bufferCtx.fillRect(0, 0, canvasBounds.width, canvasBounds.width);
        const imageWithSolidColor = this.buffer.toDataURL({ format: 'png' });

        return {
            image: imageWithText,
            backgroundColor: imageWithSolidColor,
            boundsArray: this.textArray.map(this.toUV),
            activeCoords: activeObj && this.toUV(activeObj),
            activeIndex: this.currTextIndex,
            isSelectionActive: !!activeObj
        };
    };

    toUV = obj => {
        const {tl, tr, bl, br} = obj.calcCoords(true);

        /**
         * calculate text bounding coords
         */
        const coords = [
            [tl.x / canvasSize, 1 - tl.y / canvasSize],
            [tr.x / canvasSize, 1 - tr.y / canvasSize],
            [br.x / canvasSize, 1 - br.y / canvasSize],
            [bl.x / canvasSize, 1 - bl.y / canvasSize],
        ];

        /**
         * calculate rotation knob coords
         */
        const [[x1, y1], [x2, y2]] = coords;

        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;

        const knobWidth = 0.02;
        const knobHeight = 0.05;

        const angleSin = -Math.sin(obj.angle * Math.PI / 180);
        const angleCos = Math.cos(obj.angle * Math.PI / 180);

        const p1 = [midX - knobWidth * angleCos, midY - knobWidth * angleSin];
        const p2 = [midX + knobWidth * angleCos, midY + knobWidth * angleSin];

        const p3 = [midX - knobWidth * angleCos - knobHeight * angleSin, midY - knobWidth * angleSin + knobHeight * angleCos];
        const p4 = [midX + knobWidth * angleCos - knobHeight * angleSin, midY + knobWidth * angleSin + knobHeight * angleCos];

        // const knobCoords = [
        //     p1, p2, p4, p3
        // ]

        const knobCoords = [
            [coords[1][0] - knobWidth, coords[1][1] + knobWidth],
            [coords[1][0] + knobWidth, coords[1][1] + knobWidth],
            [coords[1][0] + knobWidth, coords[1][1] - knobWidth],
            [coords[1][0] - knobWidth, coords[1][1] - knobWidth],
        ]

        return ({
            left: tl.x / canvasSize,
            top: tl.y / canvasSize,
            right: br.x / canvasSize,
            bottom: br.y / canvasSize,
            knobCoords,
            coords
        })
    };

    /**
     * rotation relative to the center of the currently active object
     */
    setTextAngle = (x, y) => {
        const activeObj = this.canvas.getActiveObject();
        const { left, top, right, bottom } = this.toUV(activeObj);
        const centerX = (left + right) / 2;
        const centerY = (top + bottom) / 2;

        const deltaX = x - centerX;
        const deltaY = 1 - y - centerY;

        // calc angle adjustment for the left-top rotation knob coords
        const {tl, tr, br} = activeObj.calcCoords(true);
        const distTop = Math.sqrt((tl.x - tr.x)*(tl.x - tr.x) + (tl.y - tr.y)*(tl.y - tr.y));
        const distHeight = Math.sqrt((tr.x - br.x)*(tr.x - br.x) + (tr.y - br.y)*(tr.y - br.y));
        const angle = Math.atan2(deltaX, -deltaY) * (180/ Math.PI) - Math.round(90 * distTop / (distTop + distHeight));

        activeObj.rotate(angle);
    }

    removeActiveText = () => {
        /**
         * remove currently active object
         */
        this.textArray = this.textArray.filter(i => i.id !== this.canvas.getActiveObject().id);
        this.canvas.remove(this.canvas.getActiveObject());
        /**
         * discard selection
         */
        this.currTextIndex = -1;
        this.activeText = null;
        this.props.onEditorHide();
        this.renderAll(true);
    };

    // add an image to canvas
    processFiles = files => {
        const file = files[0];

        const reader  = new FileReader();

        reader.addEventListener("load", () => {
            const img = new Image();

            img.onload = () => {
                window.fabric.Image.fromURL(reader.result, image  => {
                    // scale down the image when it is larger than the area width
                    let fitImageFactor = image.width > this.printableAreaBounds.width ? this.printableAreaBounds.width / image.width : 1;
                    // adjust to fit the height too
                    // fitImageFactor = image.height * fitImageFactor > 360 * 16 / 12 ? 360 * 16 / 12 / image.height : 1;
                    const img = image.set({
                        id: new Date().valueOf(),
                        flipX: true,
                        left: this.canvas.width / 2,
                        top: this.printableAreaBounds.top, // match area top
                        originX: "center",
                        originY: "center",
                        scaleX: fitImageFactor,
                        scaleY: fitImageFactor
                    });
                    this.canvas.add(img);
                    this.textArray.push(img);
                    /**
                     * activate image
                     */
                    this.currTextIndex = this.textArray.length - 1; // last item
                    this.canvas.setActiveObject(this.canvas.item(this.currTextIndex));
                    this.activeText = null;
                    this.props.onEditorHide();

                    this.renderAll()
                });
            };

            img.src = reader.result;

        }, false);

        if (file) {
            reader.readAsDataURL(file);
        }
    };

    reset = () => {
        this.canvas.remove(...this.canvas.getObjects());
        this.canvas.renderAll();
        this.textArray = [];
        this.setState({ isRemoveBtnVisible: false });
    };

    render() {
        const {
            isPickerVisible,
            activeColor,
            fontFamily
        } = this.state;

        return (
            <div className="fabric-canvas">
                <img
                    src={backgroundImage}
                    alt=""
                    ref={ref => this.bgImage = ref}
                    style={{opacity: 0, position: "fixed", pointerEvents: "none", display: 'none'}}
                />

                <canvas id={this.props.isFront ? "front-c" : "back-c"}/>

                <div className="fabric-canvas__editor">
                    <textarea
                        className="fabric-canvas__text-area apply-font"
                        style={{ height: 60, flexGrow: 'unset' }}
                        value={(this.activeText && this.activeText.text) || ''}
                        onChange={e => this.setProp('text', this.addTextBreaks(e.target.value))}
                        ref={input => this.input = input}
                    />

                    <div className="fabric-canvas__toolbox">
                        <input
                            type="radio"
                            id="text-align-left"
                            name="text-align"
                            style={{ display: 'none' }}
                            ref={ref => this.textAlignLeft = ref}
                        />
                        <label
                            htmlFor="text-align-left"
                            className="fabric-canvas__btn-tool fa fa-align-left"
                            onClick={() => this.setProp('textAlign', 'left')}
                        />
                        <input
                            defaultChecked={true}
                            type="radio"
                            id="text-align-center"
                            name="text-align"
                            style={{ display: 'none' }}
                            ref={ref => this.textAlignCenter = ref}
                        />
                        <label
                            htmlFor="text-align-center"
                            className="fabric-canvas__btn-tool fa fa-align-center"
                            onClick={() => this.setProp('textAlign', 'center')}
                        />
                        <input
                            type="radio"
                            id="text-align-right"
                            name="text-align"
                            style={{ display: 'none' }}
                            ref={ref => this.textAlignRight = ref}
                        />
                        <label
                            htmlFor="text-align-right"
                            className="fabric-canvas__btn-tool fa fa-align-right"
                            onClick={() => this.setProp('textAlign', 'right')}
                        />


                        <span className="fabric-canvas__btn-tool">|</span>
                        <input
                            type="checkbox"
                            id="font-weight-bold"
                            style={{ display: 'none' }}
                            ref={ref => this.fontWeightInput = ref}
                        />
                        <label
                            htmlFor="font-weight-bold"
                            className="fabric-canvas__btn-tool fa fa-bold"
                            onClick={() => this.toggleProp('fontWeight', 700, 400)}
                        />
                        <input
                            type="checkbox"
                            id="font-style"
                            style={{ display: 'none' }}
                            ref={ref => this.fontStyleInput = ref}
                        />
                        <label
                            htmlFor="font-style"
                            className="fabric-canvas__btn-tool fa fa-italic"
                            onClick={() => this.toggleProp('fontStyle', 'italic', 'normal')}
                        />
                        <div
                            onMouseOver={() => this.fontSizeInput.checked = true}
                            onMouseOut={this.handleUnCheckFontSize}
                        >
                            <input
                                type="checkbox"
                                id="font-size"
                                style={{ display: 'none' }}
                                ref={ref => this.fontSizeInput = ref}
                            />
                            <label
                                htmlFor="font-size"
                                data-text="Scroll up or down to adjust font size. Same for letter spacing."
                                className="fabric-canvas__btn-tool fa fa-text-height"
                            />
                        </div>
                        <div
                            onMouseOver={() => this.charSpacingInput.checked = true}
                            onMouseOut={this.handleUnCheckCharSpacing}
                        >
                            <input
                                type="checkbox"
                                id="char-spacing"
                                style={{ display: 'none' }}
                                ref={ref => this.charSpacingInput = ref}
                            />
                            <label
                                htmlFor="char-spacing"
                                data-text="Scroll up or down to adjust letter spacing. Same for font size."
                                className="fabric-canvas__btn-tool fa fa-text-width"
                            />
                        </div>


                        <div className="fabric-canvas__btn-font">
                            <FontPicker
                                onChange={font => this.handleFontChange(font.family)}
                                apiKey={'AIzaSyBKkXFzektMK5e2ZGKaalgeXiLSmucERUQ'}
                                activeFontFamily={fontFamily}
                                options={{ limit: 50 }}
                            />
                        </div>

                        <div>
                            <button
                                onClick={this.handleTogglePicker}
                                style={{ background: activeColor }}
                                className="fabric-canvas__btn-color"
                                data-color={ isPickerVisible ? activeColor : null }
                            >
                                {
                                    isPickerVisible &&
                                    <GithubPicker
                                        width={300}
                                        triangle={'hide'}
                                        color={ activeColor }
                                        colors={colorList}
                                        onChangeComplete={color => this.handleColorChange(color.hex) }
                                    />
                                }
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        )
    }
}

export default FabricCanvas;