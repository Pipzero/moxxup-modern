import { useRef, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import Player from './player';
import FabricCanvas from './FabricCanvas';
// import Header from './header';
// import Footer from './footer';
import CONSTANTS from '../constants';
import { HexColorPicker } from 'react-colorful';
import { colorToComplementary } from '../util/color';
import _ from 'lodash';

const ProductCreator = ({ handleBurgerMenu }) => {
  const fabricCanvasRef = useRef(null);
  const playerRef = useRef(null);

  const [mainTheme, setMainTheme] = useState(CONSTANTS.SITE_THEME.Black);
  const [isFront] = useState(true);
  const [autoRotate, setAutoRotate] = useState(false);
  const [isEditorVisible, setEditorVisible] = useState(false);
  const [isNewText, setNewText] = useState(null);
  const [isPhotoMenuVisible, setPhotoMenuVisible] = useState(false);
  const [isShareMenuVisible, setShareMenuVisible] = useState(false);
  const [isPickerVisible, setPickerVisible] = useState(false);
  const [activeColor, setActiveColor] = useState('#212121');
  const [outOfBoundsValue, setOutOfBoundsValue] = useState(false);
  const [isBackgroundVisible, setBackgroundVisible] = useState(false);

  const colorList = [];
  _.forOwn(CONSTANTS.MATERIAL_COLORS, (group) => {
    _.forOwn(group, (value, key) => {
      if (!key.includes('a')) colorList.push(value);
    });
  });

  const handleAddText = () => {
    if (!isEditorVisible) {
      setEditorVisible(true);
      setNewText(Date.now());
      setAutoRotate(false);
    } else {
      setEditorVisible(false);
    }
  };

  const handleScreenshot = () => {
    fabricCanvasRef.current?.downloadCanvas();
    setPhotoMenuVisible(false);
  };

  const handleUpload = (files) => {
    fabricCanvasRef.current?.processFiles(files);
    setPhotoMenuVisible(false);
  };

  const toggleTheme = () => {
    setMainTheme((prev) =>
      prev === CONSTANTS.SITE_THEME.White ? CONSTANTS.SITE_THEME.Black : CONSTANTS.SITE_THEME.White
    );
  };

  const printableClass = `product-creator__printable-area ${
    colorToComplementary(activeColor) === 'white' ? 'light' : ''
  } ${isEditorVisible ? '' : 'is-hidden'}`;

  return (
    <>
      {isShareMenuVisible && (
        <div className="share-menu">
          <IoClose onClick={() => setShareMenuVisible(false)} className="close__burger" />
          <ul className="share-list">
            <li className="share-list-item tiktok" />
            <li className="share-list-item facebook" />
            <li className="share-list-item twitter" />
          </ul>
          <h1>proof of creation</h1>
        </div>
      )}

      {isPhotoMenuVisible && (
        <div className="share-menu">
          <IoClose onClick={() => setPhotoMenuVisible(false)} className="close__burger" />
          <ul className="share-list">
            <li className="share-list-item screenshot" onClick={handleScreenshot} />
            <li className="share-list-item upload-video" />
            <label htmlFor="upload" className="share-list-item upload-photo" />
            <input
              id="upload"
              type="file"
              style={{ display: 'none' }}
              onChange={(e) => handleUpload(e.target.files)}
            />
          </ul>
        </div>
      )}

      <div className={mainTheme} style={{ position: 'relative', height: '100vh' }}>
        {/* <Header
          handleBurgerMenu={handleBurgerMenu}
          onThemeTogglerChange={toggleTheme}
          colorTheme={mainTheme}
          sceneBackgroundToggler={() => setBackgroundVisible(!isBackgroundVisible)}
        /> */}

        <div className="product-creator__container">
          <Player
            ref={playerRef}
            sceneBackground={isBackgroundVisible}
            colorTheme={mainTheme}
            autoRotate={autoRotate}
            onProgress={() => null}
            onEditorShow={() => setEditorVisible(true)}
            setImgFront={(img) => fabricCanvasRef.current?.setImgPreview?.(img)}
            setImgBack={(img) => fabricCanvasRef.current?.setImgPreview?.(img)}
            setTextAngle={(...args) => fabricCanvasRef.current?.setTextAngle?.(...args)}
            removeActiveTextFront={() => fabricCanvasRef.current?.removeActiveText?.()}
            removeActiveTextBack={() => fabricCanvasRef.current?.removeActiveText?.()}
          />

          <div className="product-creator__controls">
            <button className="product-creator__btn product-creator__btn--wardrobe" />
            <button
              className="product-creator__btn product-creator__btn-upload"
              onClick={() => setPhotoMenuVisible(true)}
            />
            <button className="product-creator__btn product-creator__btn-add" onClick={handleAddText} />
            <button
              className="product-creator__btn product-creator__btn-color"
              onClick={() => setPickerVisible(true)}
              data-color={isPickerVisible ? activeColor : null}
            >
              {isPickerVisible && (
                <HexColorPicker color={activeColor} onChange={(c) => {
                  setActiveColor(c);
                  setPickerVisible(false);
                }} />
              )}
            </button>
            <button
              className="product-creator__btn product-creator__btn--share"
              onClick={() => setShareMenuVisible(true)}
            />
          </div>
        </div>

        <div className={printableClass} data-size='12" x 16"'>
          <FabricCanvas
            ref={fabricCanvasRef}
            activeColor={activeColor}
            isEditorVisible={isEditorVisible}
            isNewText={isNewText}
            updatePlayer={
              isFront
                ? playerRef.current?.renderFront
                : playerRef.current?.renderBack
            }
            isFront={isFront}
            isActive
            onEditorShow={() => setEditorVisible(true)}
            onEditorHide={() => setEditorVisible(false)}
            onOutOfBounds={(val) => setOutOfBoundsValue(val)}
          />
        </div>

        {outOfBoundsValue && isEditorVisible && (
          <div className="product-creator__message">
            {`Your graphic is w${outOfBoundsValue}y beyond recommended size.`}
          </div>
        )}

        <div className="product__details">
          <p className="product__details--text">
            Creation node: 305 <br />
            Dimensions: CHEST: 58" X LENGTH: 77.5" <br />
            Proof of creation: 4300 + (THC) <br />
            Fabric: Pima <br />
            Rig: Disabled <br />
            Process: 49.00 USD <br />
            Simulation: 50.000 (THC) <br />
            Character upload: Disabled
          </p>
        </div>

        {/* <Footer colorTheme={mainTheme} /> */}
      </div>
    </>
  );
};

export default ProductCreator;
